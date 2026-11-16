// "Your year": a plan built from what the student has saved. Pure functions — "today" and the
// saved progress are always passed in.
import type { Opportunity } from "../types/opportunity";
import { formatDate } from "./opportunities";

export type StepKind = "opens" | "deadline" | "event" | "ends";
export interface PlanStep {
  kind: StepKind;
  date: string; // YYYY-MM-DD, or YYYY-MM when only the month is known
}
export interface Progress {
  done: boolean;
  note: string;
  doneOn: string;
}
export type ProgressMap = Record<string, Progress>;

export interface PlanEntry {
  item: Opportunity;
  next: PlanStep;
  later: PlanStep[];
}
export interface Plan {
  upcoming: PlanEntry[]; // a confirmed date still ahead, soonest first
  anytime: Opportunity[]; // open with no dates at all (rolling)
  notAnnounced: Opportunity[]; // this year's dates not out yet
  finished: Opportunity[]; // every date has passed, not ticked off yet
  done: Opportunity[]; // ticked off, most recent first
  soon: PlanEntry[]; // next step within SOON_DAYS
  clashes: { date: string; items: Opportunity[] }[]; // two saved things on the same day
}

export const SOON_DAYS = 14;

const isAhead = (date: string, today: string) =>
  date.length === 7 ? date >= today.slice(0, 7) : date >= today;

const daysUntil = (date: string, today: string) =>
  (Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86400000;

// This cycle's confirmed dates, in order. Watchlist items have none by definition, even if a
// stale field is still set on them.
export function confirmedSteps(item: Opportunity): PlanStep[] {
  if (item.status === "watchlist") return [];
  const steps: PlanStep[] = [];
  if (item.applicationsOpen) steps.push({ kind: "opens", date: item.applicationsOpen });
  if (item.applicationDeadline) steps.push({ kind: "deadline", date: item.applicationDeadline });
  if (item.eventStart) steps.push({ kind: "event", date: item.eventStart });
  if (item.eventEnd && item.eventEnd !== item.eventStart) steps.push({ kind: "ends", date: item.eventEnd });
  return steps.sort((a, b) => a.date.localeCompare(b.date));
}

export function stepLabel(step: PlanStep): string {
  return { opens: "Opens", deadline: "Apply by", event: "Takes place", ends: "Ends" }[step.kind];
}

export function stepPhrase(step: PlanStep): string {
  const when = formatDate(step.date);
  return { opens: `opens ${when}`, deadline: `apply by ${when}`, event: `takes place ${when}`, ends: `ends ${when}` }[step.kind];
}

export function buildPlan(items: Opportunity[], today: string, progress: ProgressMap): Plan {
  const plan: Plan = { upcoming: [], anytime: [], notAnnounced: [], finished: [], done: [], soon: [], clashes: [] };
  for (const item of items) {
    if (progress[item.id]?.done) {
      plan.done.push(item);
      continue;
    }
    const steps = confirmedSteps(item);
    const ahead = steps.filter((step) => isAhead(step.date, today));
    if (ahead.length) plan.upcoming.push({ item, next: ahead[0], later: ahead.slice(1) });
    else if (steps.length || item.status === "closed") plan.finished.push(item);
    else if (item.status === "open") plan.anytime.push(item);
    else plan.notAnnounced.push(item);
  }
  plan.upcoming.sort((a, b) => a.next.date.localeCompare(b.next.date) || a.item.name.localeCompare(b.item.name));
  plan.done.sort((a, b) => (progress[b.id]?.doneOn ?? "").localeCompare(progress[a.id]?.doneOn ?? ""));
  plan.soon = plan.upcoming.filter((entry) => entry.next.date.length === 10 && daysUntil(entry.next.date, today) <= SOON_DAYS);

  // Clashes: two different saved things you'd have to be at (or submit) on the same day.
  const byDay = new Map<string, Opportunity[]>();
  for (const { item, next, later } of plan.upcoming) {
    for (const step of [next, ...later]) {
      if (step.date.length !== 10 || step.kind === "opens") continue;
      const list = byDay.get(step.date) ?? [];
      if (!list.includes(item)) list.push(item);
      byDay.set(step.date, list);
    }
  }
  plan.clashes = [...byDay.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([date, list]) => ({ date, items: list }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return plan;
}

// Plain text of everything ticked off, with notes — to paste into a personal statement draft.
// Books, podcasts and courses from Read & listen follow the listings, under their own heading.
export function recordText(
  done: Opportunity[],
  progress: ProgressMap,
  read: { title: string; by: string; kind: string; id: string }[] = [],
  readProgress: ProgressMap = {},
): string {
  const block = (title: string, entry: { note: string; doneOn: string } | undefined) => {
    const when = entry?.doneOn ? ` (${formatDate(entry.doneOn.slice(0, 7))})` : "";
    const note = entry?.note.trim();
    return `${title}${when}${note ? `\n${note}` : ""}`;
  };
  const listings = done.map((item) => block(`${item.name} — ${item.provider}`, progress[item.id]));
  const reading = read.map((item) => block(`${item.title} — ${item.by}`, readProgress[item.id]));
  return [...listings, ...(reading.length ? [`Reading and listening\n\n${reading.join("\n\n")}`] : [])].join("\n\n");
}
