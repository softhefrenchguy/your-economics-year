// What's new on the site. A listing is new if it was added in the last week, or since this
// student's previous visit, whichever reaches further back. Visits are remembered in this
// browser only: just two dates, nothing sent anywhere.
import type { Opportunity } from "../types/opportunity";

export const NEW_FOR_DAYS = 7;

const daysBefore = (date: string, days: number) =>
  new Date(Date.parse(`${date}T12:00:00Z`) - days * 86400000).toISOString().slice(0, 10);

export interface Visits {
  // The day of the latest visit (today, once recorded) and the day of the one before it.
  last: string;
  previous: string | null;
}

// Today's visit. Several visits on one day count as one, so "since your last visit" still
// means since the last day you came.
export function recordVisit(stored: Visits | null, today: string): Visits {
  if (!stored) return { last: today, previous: null };
  if (stored.last === today) return stored;
  return { last: today, previous: stored.last };
}

export interface Fresh {
  ids: Set<string>;
  // How to describe them: since a previous visit more than a week ago, or simply this week.
  sinceVisit: boolean;
}

export function freshListings(items: Opportunity[], today: string, previousVisit: string | null): Fresh {
  const weekAgo = daysBefore(today, NEW_FOR_DAYS);
  const sinceVisit = previousVisit != null && previousVisit < weekAgo;
  const cutoff = sinceVisit ? previousVisit : weekAgo;
  const ids = new Set(
    items
      .filter((item) => item.status !== "closed" && item.addedOn && item.addedOn > cutoff && item.addedOn <= today)
      .map((item) => item.id),
  );
  return { ids, sinceVisit };
}

const key = "your-economics-year:visits:v1";

export const visitStore = {
  load(): Visits | null {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
      if (!value || typeof value !== "object") return null;
      const { last, previous } = value as Record<string, unknown>;
      if (typeof last !== "string") return null;
      return { last, previous: typeof previous === "string" ? previous : null };
    } catch {
      return null;
    }
  },
  save(visits: Visits): void {
    try {
      localStorage.setItem(key, JSON.stringify(visits));
    } catch {
      // Not stored: "New" falls back to this week's additions.
    }
  },
};
