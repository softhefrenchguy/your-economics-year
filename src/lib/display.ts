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
  return `£${item.costAmount}`;
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
export function headline(items: Opportunity[], status: OpportunityStatus, today: string): { highlight: string; after: string } {
  if (status === "open") {
    const next = new Date(Date.parse(`${today.slice(0, 7)}-01T12:00:00Z`));
    next.setUTCMonth(next.getUTCMonth() + 1);
    const freeThisMonth = items.filter(
      (item) => item.costType === "free" && actionDate(item)?.startsWith(today.slice(0, 7)),
    ).length;
    if (freeThisMonth >= 2)
      return { highlight: `${numberWord(freeThisMonth)} free things`, after: ` to do before ${monthName(next.toISOString())}.` };
    return { highlight: `${numberWord(items.length)} things`, after: " you can do right now." };
  }
  if (status === "coming-soon")
    return { highlight: `${numberWord(items.length)} on the way.`, after: " Confirmed, just not open yet." };
  return { highlight: `${numberWord(items.length)} that ran last year`, after: " and will probably be back." };
}

// The pen note for a listing whose date is today, if any.
export function todayNote(item: Opportunity, today: string): string | null {
  if (item.status !== "open") return null;
  if (item.applicationDeadline === today) return "last day!";
  if (item.eventStart === today) return "today!";
  return null;
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
