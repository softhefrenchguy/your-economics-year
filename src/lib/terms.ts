// The termly list for teachers: what's happening in one school term, built from the same data
// as the site. Pure functions: "today" is always passed in.
import type { Opportunity } from "../types/opportunity";
import { confirmedSteps, stepPhrase, type PlanStep } from "./plan";
import { listDate } from "./display";

export interface Term {
  key: string;
  name: string; // "Spring term 2027"
  start: string; // YYYY-MM-DD, inclusive
  end: string; // YYYY-MM-DD, inclusive
}

// Autumn: September–December. Spring: January–March. Summer: April–August (summer schools
// and their deadlines run into the holidays, so the summer term keeps them).
const seasons = [
  { name: "Spring", from: 1, to: 3 },
  { name: "Summer", from: 4, to: 8 },
  { name: "Autumn", from: 9, to: 12 },
];
const pad = (n: number) => String(n).padStart(2, "0");
const lastDay = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

function termAt(year: number, seasonIndex: number): Term {
  const season = seasons[seasonIndex];
  return {
    key: `${season.name.toLowerCase()}-${year}`,
    name: `${season.name} term ${year}`,
    start: `${year}-${pad(season.from)}-01`,
    end: `${year}-${pad(season.to)}-${lastDay(year, season.to)}`,
  };
}

// The term today falls in, and the one after it.
export function termsFrom(today: string): [Term, Term] {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const index = seasons.findIndex((season) => month >= season.from && month <= season.to);
  const now = termAt(year, index);
  const next = index === seasons.length - 1 ? termAt(year + 1, 0) : termAt(year, index + 1);
  return [now, next];
}

export interface SheetRow {
  item: Opportunity;
  date: string; // the first date that matters in the term
  when: string; // "apply by 5 Jan, takes place 12 Jan"
}
export interface TermSheet {
  dated: SheetRow[]; // confirmed dates in the term
  expected: { item: Opportunity; lastYear: string }[]; // not announced yet; last year's date fell in this term
  anytime: Opportunity[]; // open now, no fixed dates
}

const within = (date: string, from: string, to: string) =>
  date.length === 7 ? date >= from.slice(0, 7) && date <= to.slice(0, 7) : date >= from && date <= to;

// For the term in progress, only what's still ahead of today.
export function termSheet(items: Opportunity[], term: Term, today: string): TermSheet {
  const from = today > term.start ? today : term.start;
  const sheet: TermSheet = { dated: [], expected: [], anytime: [] };
  const months = seasons.find((season) => term.name.startsWith(season.name))!;
  for (const item of items) {
    if (item.status === "closed") continue;
    if (item.status === "watchlist") {
      const last = listDate(item);
      const month = last ? Number(last.date.slice(5, 7)) : 0;
      // In the term in progress, a month that has already gone by isn't "likely this term".
      const earliest = Math.max(months.from, Number(from.slice(5, 7)));
      if (last && month >= earliest && month <= months.to) sheet.expected.push({ item, lastYear: last.date });
      continue;
    }
    const steps: PlanStep[] = confirmedSteps(item).filter((step) => within(step.date, from, term.end));
    if (steps.length) {
      sheet.dated.push({ item, date: steps[0].date, when: steps.map(stepPhrase).join(", ") });
    } else if (item.status === "open" && !confirmedSteps(item).length) {
      sheet.anytime.push(item);
    }
  }
  sheet.dated.sort((a, b) => a.date.localeCompare(b.date) || a.item.name.localeCompare(b.item.name));
  sheet.expected.sort((a, b) => a.lastYear.slice(5).localeCompare(b.lastYear.slice(5)));
  sheet.anytime.sort((a, b) => a.name.localeCompare(b.name));
  return sheet;
}
