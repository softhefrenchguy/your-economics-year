// "Dates are out": tells a student when something they saved gets confirmed dates, or its
// dates change, since they last looked. The browser keeps, for each saved listing, the dates
// it had when the student last saw it. Pure functions apart from the store at the bottom.
import type { Opportunity } from "../types/opportunity";
import { confirmedSteps } from "./plan";

export type Seen = Record<string, string>; // listing id -> its confirmed dates, as last seen

// The confirmed dates as one string: "" when none are announced.
export const datesSignature = (item: Opportunity): string =>
  confirmedSteps(item)
    .map((step) => `${step.kind}:${step.date}`)
    .join(",");

export interface DateNews {
  item: Opportunity;
  kind: "announced" | "changed";
}

// Saved listings whose dates are now out, or have moved, since they were last seen. A listing
// whose dates were taken away (back to "not announced") isn't news worth an alert.
export function dateNews(saved: Opportunity[], seen: Seen): DateNews[] {
  return saved.flatMap((item): DateNews[] => {
    const before = seen[item.id];
    const now = datesSignature(item);
    if (before === undefined || before === now || now === "" || item.status === "closed") return [];
    return [{ item, kind: before === "" ? "announced" : "changed" }];
  });
}

// What to remember next: newly saved listings start from today's dates (so saving something
// is never "news"), unsaved ones are forgotten, and `acknowledge` marks the news as read.
export function settleSeen(saved: Opportunity[], seen: Seen, acknowledge = false): Seen {
  const next: Seen = {};
  for (const item of saved) {
    next[item.id] = acknowledge || seen[item.id] === undefined ? datesSignature(item) : seen[item.id];
  }
  return next;
}

const key = "your-economics-year:dates-seen:v1";
export const seenStore = {
  load(): Seen {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(key) ?? "{}");
      if (!value || typeof value !== "object" || Array.isArray(value)) return {};
      return Object.fromEntries(Object.entries(value).filter(([, v]) => typeof v === "string")) as Seen;
    } catch {
      return {};
    }
  },
  save(seen: Seen): void {
    try {
      localStorage.setItem(key, JSON.stringify(seen));
    } catch {
      // Not stored: the alert just won't carry over to the next visit.
    }
  },
};
