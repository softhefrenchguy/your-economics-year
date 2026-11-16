// Presentation helpers shared by the list, the headline, the chart, the details dialog and the
// teacher page. Pure functions: "today" is always passed in, never read here.
import type { Opportunity, OpportunityStatus } from "../types/opportunity";
import { actionDate, formatDate } from "./opportunities";

export function teacherMessage(item: Opportunity): string {
  const ask = item.requiresSchoolNomination
    ? "Schools need to nominate students to take part."
    : "A teacher needs to register our school to take part.";
  return `Hi, I found ${item.name} (${item.provider}) for Year 12 students interested in Economics. ${ask} Would it be possible for our school to take part? Here's the official information: ${item.officialUrl}`;
}

export const needsTeacher = (item: Opportunity) => item.requiresTeacher || item.requiresSchoolNomination;

// An "open" item with rolling enrolment: no window or event date at all.
export function isRollingOpen(item: Opportunity): boolean {
  return item.status === "open" && !item.applicationDeadline && !item.eventStart && !item.applicationsOpen;
}

export function costLabel(item: Opportunity): string {
  if (item.costType === "free") return "Free";
  if (item.costType === "unknown") return "Cost not listed";
  if (item.costAmount == null) return "Paid";
  return `${item.costCurrency === "USD" ? "US$" : "£"}${item.costAmount}`;
}

// The cost mid-sentence in a list line: "paid", "cost not listed", but "£40" and "US$35" kept as is.
export function costInline(item: Opportunity): string {
  const label = costLabel(item);
  return /^[A-Z][a-z]/.test(label) ? label[0].toLowerCase() + label.slice(1) : label;
}

export function placeLabel(item: Opportunity): string {
  if (item.deliveryMode === "online") return "online";
  const location = item.location.replace(/\s*\(.*$/, "");
  const place = /london/i.test(location) ? "London" : location.split(",")[0].trim();
  return item.deliveryMode === "hybrid" ? `${place} or online` : place;
}

// The short organiser name a student would say ("LSE", "Bank of England"), for list lines.
const shortNames: [RegExp, string][] = [
  [/^LSESU/, "LSESU Economics Society"],
  [/^LSE\b|London School of Economics/, "LSE"],
  [/Bank of England/, "Bank of England"],
  [/Royal Economic Society/, "Royal Economic Society"],
  [/Foreign, Commonwealth/, "FCDO"],
  [/Institute of Economic Affairs|^IEA/, "IEA"],
  [/Royal Holloway/, "Royal Holloway"],
  [/Goldman Sachs/, "Goldman Sachs"],
  [/City St George/, "City St George's"],
  [/Christ's College/, "Christ's College, Cambridge"],
  [/King's Entrepreneurship/, "King's College, Cambridge"],
  [/STEM Learning|Nuffield/, "Nuffield"],
  [/University of Bristol/, "University of Bristol"],
];
export function shortProvider(item: Opportunity): string {
  for (const [pattern, name] of shortNames) if (pattern.test(item.provider)) return name;
  return item.provider.split(/\s*[(/]/)[0].trim();
}

// The date an item is listed under. Open and coming-soon items use their real next date;
// watchlist items have none, so they sit under last year's month, clearly labelled.
export function listDate(item: Opportunity): { date: string; lastYear: boolean } | null {
  const date = actionDate(item);
  if (date) return { date, lastYear: false };
  const cycle = item.previousCycle;
  const last = cycle?.applicationDeadline ?? cycle?.eventStart ?? cycle?.applicationsOpen;
  return last ? { date: last, lastYear: true } : null;
}

export function dayParts(date: string): { weekday: string; day: string; month: string } {
  const value = new Date(`${date.length === 7 ? `${date}-01` : date.slice(0, 10)}T12:00:00Z`);
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(value);
  return {
    weekday: date.length === 7 ? "" : part({ weekday: "short" }),
    day: date.length === 7 ? "–" : part({ day: "numeric" }),
    month: part({ month: "short" }),
  };
}

const monthName = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(new Date(`${date.slice(0, 7)}-01T12:00:00Z`));
const addDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10);

export interface Section {
  key: string;
  title: string;
  note: string;
  items: Opportunity[];
  // Per-item date shown on the listing instead of its default one (used by "Not open yet").
  dates?: Record<string, { date: string; label: string; lastYear: boolean }>;
}

// Browse has two tabs. "Not open yet" holds both kinds of not-yet: confirmed ("coming-soon",
// which always has a real date) and not announced ("watchlist", going by last year). They
// sit together by month; each card says which it is.
export type BrowseTab = "open" | "upcoming";
export const inTab = (item: Opportunity, tab: BrowseTab) =>
  tab === "open" ? item.status === "open" : item.status === "coming-soon" || item.status === "watchlist";

export const statusName: Record<OpportunityStatus, string> = {
  open: "Open now",
  "coming-soon": "Opens soon",
  watchlist: "Not announced yet",
  closed: "Closed",
};

// The same month (and day) as last year's date, at its next occurrence from this month on:
// last September's deadline is expected around next September, not two months ago.
function nextOccurrence(date: string, today: string): string {
  const rest = date.slice(4);
  const year = Number(today.slice(0, 4));
  return `${year}${rest}`.slice(0, 7) < today.slice(0, 7) ? `${year + 1}${rest}` : `${year}${rest}`;
}

// Where a not-open-yet item is listed. Confirmed: its opening date. Not announced: last
// year's date, moved to when it would next come round (used for ordering only — the card
// itself always shows last year's real date, marked as such).
export function upcomingPlacement(item: Opportunity, today: string) {
  if (item.status === "coming-soon") {
    const date = item.applicationsOpen ?? actionDate(item);
    return date ? { sortDate: date, shown: { date, label: "Opens", lastYear: false } } : null;
  }
  const last = listDate(item);
  if (!last) return null;
  return {
    sortDate: nextOccurrence(last.date, today),
    shown: { date: last.date, label: "Not announced yet · last year's date", lastYear: true },
  };
}

export function upcomingSections(items: Opportunity[], today: string): Section[] {
  const groups = new Map<string, Section>();
  const placed = items
    .map((item) => ({ item, at: upcomingPlacement(item, today) }))
    .sort(
      (a, b) =>
        (a.at?.sortDate.slice(0, 7) ?? "9999").localeCompare(b.at?.sortDate.slice(0, 7) ?? "9999") ||
        Number(a.at?.shown.lastYear ?? true) - Number(b.at?.shown.lastYear ?? true) ||
        (a.at?.sortDate ?? "").localeCompare(b.at?.sortDate ?? ""),
    );
  for (const { item, at } of placed) {
    const key = at ? `m-${at.sortDate.slice(0, 7)}` : "z-none";
    if (!groups.has(key))
      groups.set(key, { key, title: at ? formatDate(at.sortDate.slice(0, 7)) : "No dates yet", note: "", items: [], dates: {} });
    const group = groups.get(key)!;
    group.items.push(item);
    if (at) group.dates![item.id] = at.shown;
  }
  return [...groups.values()].map((section) => {
    const confirmed = section.items.filter((item) => item.status === "coming-soon").length;
    const count = `${section.items.length} ${section.items.length === 1 ? "listing" : "listings"}`;
    return { ...section, note: confirmed ? `${count} · ${confirmed} confirmed` : count };
  });
}

// Chronological sections: This week, Later in <this month>, then each later month, then
// Any time. Watchlist items sit under "Last year: <month>". Order within a section is kept.
export function sections(items: Opportunity[], today: string, status: OpportunityStatus): Section[] {
  const weekEnd = addDays(today, 6);
  const thisMonth = today.slice(0, 7);
  const groups = new Map<string, Omit<Section, "note">>();
  const add = (key: string, title: string, item: Opportunity) => {
    if (!groups.has(key)) groups.set(key, { key, title, items: [] });
    groups.get(key)!.items.push(item);
  };
  const dated = items
    .map((item) => ({ item, at: listDate(item) }))
    .sort((a, b) => (a.at?.date ?? "9999").localeCompare(b.at?.date ?? "9999"));
  for (const { item, at } of dated) {
    if (!at) add("z-any", status === "open" ? "Any time" : "Dates not announced yet", item);
    else if (at.lastYear) add(`m-${at.date.slice(0, 7)}`, `Last year: ${monthName(at.date)}`, item);
    else if (status === "open" && at.date <= weekEnd) add("a-week", "This week", item);
    else if (at.date.startsWith(thisMonth)) add("b-month", `Later in ${monthName(at.date)}`, item);
    else add(`m-${at.date.slice(0, 7)}`, monthName(at.date), item);
  }
  return [...groups.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((section) => ({ ...section, note: `${section.items.length} ${section.items.length === 1 ? "listing" : "listings"}` }));
}

const words = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
export const numberWord = (n: number) => words[n] ?? String(n);

// The headline, written from the data so it is always true. `highlight` gets the yellow
// highlighter; `after` follows it.
export function headline(items: Opportunity[], tab: BrowseTab, today: string): { highlight: string; after: string } {
  if (tab === "open") {
    const next = new Date(Date.parse(`${today.slice(0, 7)}-01T12:00:00Z`));
    next.setUTCMonth(next.getUTCMonth() + 1);
    const freeThisMonth = items.filter(
      (item) => item.costType === "free" && actionDate(item)?.startsWith(today.slice(0, 7)),
    ).length;
    if (freeThisMonth >= 2)
      return { highlight: `${numberWord(freeThisMonth)} free things`, after: ` to do before ${monthName(next.toISOString())}.` };
    return { highlight: `${numberWord(items.length)} things`, after: " you can do right now." };
  }
  const confirmed = items.filter((item) => item.status === "coming-soon").length;
  return {
    highlight: `${numberWord(items.length)} not open yet.`,
    after: confirmed
      ? ` ${numberWord(confirmed)} with confirmed dates, the rest going by last year's.`
      : " None confirmed yet, so the dates shown are last year's.",
  };
}

// The pen note for a listing whose date is today, if any.
export function todayNote(item: Opportunity, today: string): string | null {
  if (item.status !== "open") return null;
  if (item.applicationDeadline === today) return "last day!";
  if (item.eventStart === today) return "today!";
  return null;
}

const daysUntil = (date: string, today: string) =>
  Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86400000);

// "today", "tomorrow", "in 5 days" for a day up to two weeks away; null otherwise.
export function inDays(date: string, today: string): string | null {
  if (date.length !== 10) return null;
  const days = daysUntil(date, today);
  if (days < 0) return null;
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return days <= 14 ? `in ${days} days` : null;
}

// The countdown on a listing whose application deadline is in the next two weeks. The day
// itself already gets the "last day!" pen note, so it starts from tomorrow.
export function closingSoon(item: Opportunity, today: string): string | null {
  if (item.status !== "open" || !item.applicationDeadline || item.applicationDeadline <= today) return null;
  const when = inDays(item.applicationDeadline, today);
  return when ? `Closes ${when}` : null;
}

// The short tag on a listing. The colour comes from its kind (talks, competitions,
// courses, work), the word from its type, so "Essay" and "Competition" share a colour.
const typeTags: Record<Opportunity["type"], string> = {
  "Taster / event": "Talk",
  Competition: "Competition",
  "Essay competition": "Essay",
  "University programme": "Programme",
  "Summer school": "Summer school",
  "Mentoring / development": "Mentoring",
  "Work experience": "Work experience",
  "Finance insight": "Insight",
  "Business & entrepreneurship": "Business",
};
export function typeTag(item: Opportunity): string {
  // University taster days share the type with public talks but are a different thing to go to.
  if (item.type === "Taster / event" && /taster|explore/i.test(`${item.id} ${item.name}`)) return "Taster";
  return typeTags[item.type];
}

export function whenLabel(item: Opportunity): string {
  if (item.status === "closed") return "Closed";
  if (isRollingOpen(item)) return "Any time";
  const at = listDate(item);
  if (!at) return item.status === "coming-soon" ? "Opening soon" : "Date not announced";
  if (at.lastYear) return `Last year: ${formatDate(at.date.slice(0, 7))}`;
  if (item.status === "coming-soon") return `Opens ${formatDate(item.applicationsOpen ?? at.date)}`;
  if (item.applicationDeadline) return `Apply by ${formatDate(item.applicationDeadline)}`;
  return formatDate(at.date);
}
