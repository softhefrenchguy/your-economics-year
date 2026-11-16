import type { Opportunity, OpportunityStatus } from "../types/opportunity";

export type Category =
  | "Competition"
  | "Work experience"
  | "University"
  | "Finance"
  | "Policy"
  | "Business";
// What kind of thing it is, in the words a student would use. Every type maps to exactly one.
export type Kind = "talks" | "competitions" | "programmes" | "work";
export const kindOptions: { id: Kind; label: string }[] = [
  { id: "talks", label: "Talks & tasters" },
  { id: "competitions", label: "Competitions" },
  { id: "programmes", label: "Courses & programmes" },
  { id: "work", label: "Work & business" },
];
const kindByType: Record<Opportunity["type"], Kind> = {
  "Taster / event": "talks",
  Competition: "competitions",
  "Essay competition": "competitions",
  "University programme": "programmes",
  "Summer school": "programmes",
  "Mentoring / development": "programmes",
  "Work experience": "work",
  "Finance insight": "work",
  "Business & entrepreneurship": "work",
};
export const kindOf = (item: Opportunity): Kind => kindByType[item.type];

export interface Filters {
  freeOnly: boolean;
  online: boolean;
  // Only things a student can sign up to without a teacher.
  noTeacher: boolean;
  kind: Kind | null;
  // Free text from the search box.
  query: string;
  location: string;
  categories: Category[];
}
export const emptyFilters: Filters = {
  freeOnly: false,
  online: false,
  noTeacher: false,
  kind: null,
  query: "",
  location: "",
  categories: [],
};
export const categoryOptions: Category[] = [
  "Competition",
  "Work experience",
  "University",
  "Finance",
  "Policy",
  "Business",
];

const universityTypes = ["University programme", "Summer school", "Taster / event"];
const financeTopics = ["Finance", "Banking", "Professional Services", "Markets", "Risk"];
const policyTopics = ["Public Policy", "Fiscal Policy"];

export function categorise(opportunity: Opportunity): Category[] {
  const categories: Category[] = [];
  if (["Competition", "Essay competition"].includes(opportunity.type))
    categories.push("Competition");
  if (opportunity.type === "Work experience") categories.push("Work experience");
  if (universityTypes.includes(opportunity.type)) categories.push("University");
  if (opportunity.type === "Business & entrepreneurship" || opportunity.topics.includes("Business"))
    categories.push("Business");
  if (
    opportunity.type === "Finance insight" ||
    opportunity.type === "Mentoring / development" ||
    opportunity.topics.some((topic) => financeTopics.includes(topic))
  )
    categories.push("Finance");
  if (opportunity.topics.some((topic) => policyTopics.includes(topic))) categories.push("Policy");
  return categories;
}
// Search: every word typed has to appear somewhere in the listing (name, organiser, place,
// type, topics or description). Case and accents don't matter, so "lse" finds "LSE" and
// "dauphine" finds "Dauphine-PSL".
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
export function matchesQuery(item: Opportunity, query: string): boolean {
  const words = fold(query).split(/[^a-z0-9£$]+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = fold(
    [item.name, item.provider, item.location, item.type, kindOptions.find((k) => k.id === kindOf(item))!.label, ...item.topics, item.description].join(" "),
  );
  // Short words must start a word, so "ai" finds "AI" but not "said".
  const found = (word: string) =>
    word.length > 3 ? haystack.includes(word) : ` ${haystack}`.match(new RegExp(`[^a-z0-9]${word.replace(/[$]/g, "\\$")}`)) !== null;
  return words.every(found);
}

// Different filter groups intersect; selections within the category group are alternatives.
export function filterOpportunities(
  items: Opportunity[],
  filters: Filters,
  status?: OpportunityStatus,
): Opportunity[] {
  return items.filter(
    (item) =>
      (!status || item.status === status) &&
      (!filters.freeOnly || item.costType === "free") &&
      (!filters.online || item.deliveryMode === "online") &&
      (!filters.noTeacher || !(item.requiresTeacher || item.requiresSchoolNomination)) &&
      (!filters.kind || kindOf(item) === filters.kind) &&
      matchesQuery(item, filters.query) &&
      (!filters.location || item.location === filters.location) &&
      (!filters.categories.length ||
        filters.categories.some((category) => categorise(item).includes(category))),
  );
}
// The only date ever surfaced as "upcoming" for sorting/urgency — real confirmed dates only.
// Watchlist/coming-soon entries without a confirmed date return null and sort to the end,
// never falling back to a stale previous-cycle date.
export function actionDate(item: Opportunity): string | null {
  if (item.status === "watchlist") return null;
  return item.applicationDeadline ?? item.eventStart ?? item.applicationsOpen ?? null;
}
export function sortByDeadline(items: Opportunity[]): Opportunity[] {
  return [...items].sort(
    (a, b) =>
      (actionDate(a) ?? "9999").localeCompare(actionDate(b) ?? "9999") ||
      a.name.localeCompare(b.name),
  );
}
const costRank: Record<Opportunity["costType"], number> = { free: 0, unknown: 1, paid: 2 };
export function prioritiseFree(items: Opportunity[]): Opportunity[] {
  return sortByDeadline(items).sort(
    (a, b) => costRank[a.costType] - costRank[b.costType] || Number(b.featured) - Number(a.featured),
  );
}
// Opportunities a student cannot act on alone — a teacher has to nominate/register the
// school, or arrange a booking directly. Split for the teacher-facing page: nominated/
// competitive entries first, then direct bookings/registrations with no selection process.
export function teacherOpportunities(items: Opportunity[]): {
  nominated: Opportunity[];
  direct: Opportunity[];
} {
  const needsTeacher = items.filter((item) => item.requiresTeacher || item.requiresSchoolNomination);
  return {
    nominated: sortByDeadline(needsTeacher.filter((item) => item.requiresSchoolNomination)),
    direct: sortByDeadline(needsTeacher.filter((item) => !item.requiresSchoolNomination)),
  };
}
export function formatDate(date: string, includeYear = false): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: date.length === 7 ? undefined : "numeric",
    month: date.length === 7 ? "long" : "short",
    year: includeYear || date.length === 7 ? "numeric" : undefined,
    timeZone: "UTC",
  }).format(new Date(`${date.length === 7 ? `${date}-01` : date}T12:00:00Z`));
}
export interface TimelineEntry {
  opportunity: Opportunity;
  date: string;
  label: string;
  estimated: boolean;
}
// Maps a real previous-cycle date onto the equivalent month/day in the current academic
// year, purely to place a "based on last cycle" marker on the timeline. The year is always
// replaced — this never produces a date that could be mistaken for a confirmed one.
function shiftToAcademicYear(date: string, academicYear: number): string {
  const month = Number(date.slice(5, 7));
  const year = month >= 9 ? academicYear : academicYear + 1;
  return `${year}-${date.slice(5)}`;
}
export function timelineEntries(items: Opportunity[], academicYear: number): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  const add = (opportunity: Opportunity, date: string | null | undefined, label: string, estimated = false) => {
    if (date && date >= `${academicYear}-09` && date < `${academicYear + 1}-09`)
      entries.push({ opportunity, date, label, estimated });
  };
  for (const item of items) {
    // Last cycle's dates only stand in when this cycle has none confirmed: a coming-soon
    // item with real dates (Sutton Trust's 2027 round) is placed on those, not last year's.
    const hasConfirmedDates = Boolean(item.applicationsOpen || item.applicationDeadline || item.eventStart);
    if (item.status === "watchlist" || (item.status === "coming-soon" && !hasConfirmedDates)) {
      const cycle = item.previousCycle;
      if (cycle) {
        const label = `${cycle.label} · based on last cycle, not confirmed`;
        if (cycle.applicationsOpen)
          add(item, shiftToAcademicYear(cycle.applicationsOpen, academicYear), `Applications opened · ${label}`, true);
        if (cycle.applicationDeadline)
          add(item, shiftToAcademicYear(cycle.applicationDeadline, academicYear), `Deadline · ${label}`, true);
        if (cycle.eventStart)
          add(item, shiftToAcademicYear(cycle.eventStart, academicYear), `Event started · ${label}`, true);
        if (cycle.eventEnd && cycle.eventEnd !== cycle.eventStart)
          add(item, shiftToAcademicYear(cycle.eventEnd, academicYear), `Event ended · ${label}`, true);
      }
    } else {
      add(item, item.applicationsOpen, "Applications open");
      add(item, item.applicationDeadline, "Application deadline");
      add(item, item.eventStart, "Event starts");
      if (item.eventEnd !== item.eventStart) add(item, item.eventEnd, "Event ends");
    }
  }
  return entries.sort(
    (a, b) => a.date.localeCompare(b.date) || a.opportunity.name.localeCompare(b.opportunity.name),
  );
}
export function academicMonths(year: number) {
  return Array.from({ length: 12 }, (_, index) => {
    const month = ((index + 8) % 12) + 1;
    const date = `${year + (index > 3 ? 1 : 0)}-${String(month).padStart(2, "0")}`;
    return { date, label: formatDate(date) };
  });
}
// The academic year (Sept–Aug) that a given date falls in, e.g. March 2027 -> 2026
// (meaning the 2026–27 year). Sept onward belongs to the year that just started.
export function currentAcademicYear(today: string): number {
  const month = Number(today.slice(5, 7));
  const year = Number(today.slice(0, 4));
  return month >= 9 ? year : year - 1;
}
// Ages a stored status forward against real dates, so "open"/"coming-soon"/"closed" never
// go stale just because nobody edited the data file. Only applies where a real date exists:
// - "watchlist" is always author-set — by definition there's no confirmed date to compare.
// - An item with no applicationsOpen/deadline/event dates at all (rolling enrollment, or a
//   "coming-soon" awaiting an announcement) keeps its authored status — there's nothing to
//   derive from.
// - Otherwise: before applicationsOpen -> "coming-soon"; after the last relevant date
//   (deadline, else event end, else event start) -> "closed"; between the two -> "open".
// - "coming-soon" means a confirmed date is on the way. One with no dates at all is really
//   "not announced yet", so it's shown as watchlist — the site never says "coming soon"
//   without a date to back it.
export function effectiveStatus(item: Opportunity, today: string): OpportunityStatus {
  if (item.status === "watchlist" || item.status === "closed") return item.status;
  const openDate = item.applicationsOpen;
  const closeDate = item.applicationDeadline ?? item.eventEnd ?? item.eventStart;
  if (!openDate && !closeDate) return item.status === "coming-soon" ? "watchlist" : item.status;
  if (openDate && today < openDate) return "coming-soon";
  if (closeDate && today > closeDate) return "closed";
  return "open";
}
export function withEffectiveStatus(items: Opportunity[], today: string): Opportunity[] {
  return items.map((item) => ({ ...item, status: effectiveStatus(item, today) }));
}

// The site covers what a London-based Year 12 student can actually do: anything in London,
// online, or open UK-wide (national competitions and schemes run through any school). Things
// tied to somewhere else (a Bristol event, a Cambridge summer school) are left out.
export function availableInLondon(item: Opportunity): boolean {
  if (item.deliveryMode === "online") return true;
  return /london|uk-wide|online/i.test(item.location);
}
