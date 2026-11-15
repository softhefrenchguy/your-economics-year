import { describe, expect, it } from "vitest";
import { opportunities } from "../data/opportunities";
import type { Opportunity } from "../types/opportunity";
import { buildPlan, confirmedSteps, recordText } from "./plan";
import { buildCalendar } from "./calendar";

const today = "2026-11-15";
const item = (overrides: Partial<Opportunity>): Opportunity => ({
  ...opportunities[0],
  applicationsOpen: null,
  applicationDeadline: null,
  eventStart: null,
  eventEnd: null,
  previousCycle: null,
  ...overrides,
});

const lecture = item({ id: "lecture", name: "Money talk", status: "open", eventStart: "2026-11-25", eventEnd: "2026-11-25" });
const essay = item({ id: "essay", name: "Essay prize", status: "open", applicationDeadline: "2027-01-29", eventStart: "2027-02" });
const summer = item({ id: "summer", name: "Summer school", status: "coming-soon", applicationsOpen: "2027-01-11", applicationDeadline: "2027-03-04" });
const pastTalk = item({ id: "past", name: "Old talk", status: "closed", eventStart: "2026-10-01" });
const watch = item({ id: "watch", name: "Locke essay", status: "watchlist", applicationDeadline: "2026-05-31" });
const rolling = item({ id: "rolling", name: "Company programme", status: "open" });
const sameDay = item({ id: "same", name: "Other talk", status: "open", eventStart: "2026-11-25" });

describe("Your year plan", () => {
  it("sorts saved things into what's next, any time, not announced, finished and done", () => {
    const plan = buildPlan([summer, essay, lecture, pastTalk, watch, rolling], today, {
      rolling: { done: true, note: "Ran a stall", doneOn: "2026-11-10" },
    });
    expect(plan.upcoming.map((e) => e.item.id)).toEqual(["lecture", "summer", "essay"]);
    expect(plan.upcoming[1].next).toEqual({ kind: "opens", date: "2027-01-11" });
    expect(plan.upcoming[1].later).toEqual([{ kind: "deadline", date: "2027-03-04" }]);
    expect(plan.notAnnounced.map((i) => i.id)).toEqual(["watch"]);
    expect(plan.finished.map((i) => i.id)).toEqual(["past"]);
    expect(plan.done.map((i) => i.id)).toEqual(["rolling"]);
    expect(plan.anytime).toEqual([]);
  });

  it("never treats a watchlist item's stale date as confirmed", () => {
    expect(confirmedSteps(watch)).toEqual([]);
  });

  it("flags what's due in the next two weeks and same-day clashes", () => {
    const plan = buildPlan([lecture, essay, sameDay], today, {});
    expect(plan.soon.map((e) => e.item.id)).toEqual(["lecture", "same"]);
    expect(plan.clashes).toEqual([{ date: "2026-11-25", items: [lecture, sameDay] }]);
  });

  it("writes a plain-text record of what's done, with notes", () => {
    const text = recordText([rolling], { rolling: { done: true, note: "Ran a stall", doneOn: "2026-11-10" } });
    expect(text).toBe(`Company programme — ${rolling.provider} (November 2026)\nRan a stall`);
  });
});

describe("Add to calendar", () => {
  it("includes each upcoming full date with a reminder, and skips month-only and past dates", () => {
    const { ics, count } = buildCalendar([essay, pastTalk, summer], today, "2026-11-15T19:00:00.000Z");
    // essay: deadline (the Feb event is month-only, skipped); summer: opens + deadline; past talk: nothing.
    expect(count).toBe(3);
    expect(ics).toContain("DTSTART;VALUE=DATE:20270129");
    expect(ics).toContain("DTEND;VALUE=DATE:20270130");
    expect(ics).toContain("SUMMARY:Deadline: Essay prize");
    expect(ics).toContain("TRIGGER:-P3D");
    expect(ics).toContain("DTSTAMP:20261115T190000Z");
    expect(ics).not.toContain("20261001");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
  });

  it("escapes text and keeps every line within 75 bytes", () => {
    const long = item({ id: "long", name: "A, very; long name ".repeat(6), status: "open", applicationDeadline: "2027-01-01" });
    const { ics } = buildCalendar([long], today, "2026-11-15T19:00:00.000Z");
    expect(ics).toContain("A\\, very\\; long");
    for (const line of ics.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
});
