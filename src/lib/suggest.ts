// "To round out your year": when everything a student has saved is one kind of thing (all
// talks, say), suggest one of each kind they're missing. Pure: "today" is passed in.
import type { Opportunity } from "../types/opportunity";
import { kindOf, type Kind } from "./opportunities";
import { confirmedSteps, type PlanStep } from "./plan";
import { numberWord } from "./display";

// The order to suggest in, with why each kind is worth having, said to the student.
const kinds: { id: Kind; one: string; many: string; missing: string; why: string }[] = [
  { id: "competitions", one: "competition", many: "competitions", missing: "No competitions yet.", why: "A competition shows you can take on a hard question by yourself." },
  { id: "programmes", one: "course or programme", many: "courses or programmes", missing: "No courses or programmes yet.", why: "A course or summer school is a taste of studying economics at university." },
  { id: "talks", one: "talk", many: "talks", missing: "No talks yet.", why: "Talks are the quickest way to find a topic you care about." },
  { id: "work", one: "work or business programme", many: "work or business programmes", missing: "No work experience yet.", why: "It shows how economics gets used outside the classroom." },
];

export interface Suggestion {
  kind: Kind;
  missing: string; // "No competitions yet."
  why: string;
  item: Opportunity;
  next: PlanStep | null; // the next confirmed date, if any
}

export const MAX_SUGGESTIONS = 2;

export function suggestions(saved: Opportunity[], all: Opportunity[], today: string): Suggestion[] {
  if (saved.length < 2) return [];
  const have = new Set(saved.map(kindOf));
  const savedIds = new Set(saved.map((item) => item.id));
  const out: Suggestion[] = [];
  for (const kind of kinds) {
    if (have.has(kind.id) || out.length >= MAX_SUGGESTIONS) continue;
    // Something you can act on: open now, or opening on a confirmed date. Free things and ones
    // you can do without a teacher first, then the soonest.
    const next = (item: Opportunity) => confirmedSteps(item).find((step) => step.date >= today.slice(0, step.date.length)) ?? null;
    const pick = all
      .filter((item) => kindOf(item) === kind.id && !savedIds.has(item.id))
      .filter((item) => item.status === "open" || (item.status === "coming-soon" && next(item)))
      .sort(
        (a, b) =>
          Number(a.costType !== "free") - Number(b.costType !== "free") ||
          Number(a.requiresTeacher || a.requiresSchoolNomination) - Number(b.requiresTeacher || b.requiresSchoolNomination) ||
          (next(a)?.date ?? "9999").localeCompare(next(b)?.date ?? "9999") ||
          a.name.localeCompare(b.name),
      )[0];
    if (pick) out.push({ kind: kind.id, missing: kind.missing, why: kind.why, item: pick, next: next(pick) });
  }
  return out;
}

// "You've saved four talks and a course." for the heading of the suggestions.
export function savedSummary(saved: Opportunity[]): string {
  const parts = kinds
    .map((kind) => ({ kind, n: saved.filter((item) => kindOf(item) === kind.id).length }))
    .filter(({ n }) => n > 0)
    .map(({ kind, n }) => (n === 1 ? `one ${kind.one}` : `${numberWord(n).toLowerCase()} ${kind.many}`));
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
  return `You've saved ${list}.`;
}
