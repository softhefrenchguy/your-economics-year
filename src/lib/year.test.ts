import { describe, expect, it } from "vitest";
import { opportunities } from "../data/opportunities";
import type { Opportunity } from "../types/opportunity";
import { emptyFilters, filterOpportunities, kindOf, matchesQuery } from "./opportunities";
import { dateNews, datesSignature, settleSeen } from "./news";
import { savedSummary, suggestions } from "./suggest";
import { recordText } from "./plan";
import { closingSoon, typeTag } from "./display";

const fixture = (overrides: Partial<Opportunity>): Opportunity => ({
  ...opportunities[0],
  applicationsOpen: null,
  applicationDeadline: null,
  eventStart: null,
  eventEnd: null,
  previousCycle: null,
  requiresTeacher: false,
  requiresSchoolNomination: false,
  costType: "free",
  ...overrides,
});

describe("search", () => {
  const item = fixture({
    name: "Is Bitcoin the way to a better money?",
    provider: "London School of Economics (LSE)",
    type: "Taster / event",
    topics: ["Economics", "AI"],
    description: "Professor White compares gold, fiat and Bitcoin.",
  });
  it("needs every word, in any case, anywhere in the listing", () => {
    expect(matchesQuery(item, "bitcoin")).toBe(true);
    expect(matchesQuery(item, "LSE gold")).toBe(true);
    expect(matchesQuery(item, "lse summer")).toBe(false);
    expect(matchesQuery(item, "  ")).toBe(true);
  });
  it("matches the kind of thing too, so 'talk' finds talks", () => {
    expect(matchesQuery(item, "talks")).toBe(true);
  });
  it("only matches short words at the start of a word", () => {
    expect(matchesQuery(item, "ai")).toBe(true);
    expect(matchesQuery(fixture({ name: "Said", description: "", topics: [] }), "ai")).toBe(false);
  });
  it("ignores accents", () => {
    expect(matchesQuery(fixture({ name: "Pré-Uni Camp" }), "pre-uni")).toBe(true);
  });
  it("is part of the filters", () => {
    const hits = filterOpportunities(opportunities, { ...emptyFilters, query: "essay" });
    expect(hits.length).toBeGreaterThan(3);
    expect(hits.every((hit) => matchesQuery(hit, "essay"))).toBe(true);
  });
});

describe("time it takes", () => {
  it("is short, lower case and never a guess dressed up as a date", () => {
    for (const item of opportunities.filter((entry) => entry.timeNeeded)) {
      expect(item.timeNeeded).toMatch(/^[a-z0-9]/);
      expect(item.timeNeeded!.length).toBeLessThan(32);
    }
    expect(opportunities.filter((entry) => entry.timeNeeded).length).toBeGreaterThan(40);
  });
});

describe("dates are out", () => {
  const watch = fixture({ id: "locke", status: "watchlist" });
  const announced = { ...watch, status: "coming-soon" as const, applicationsOpen: "2027-01-10", applicationDeadline: "2027-06-30" };
  it("starts a newly saved listing from its current dates, so saving is never news", () => {
    const seen = settleSeen([watch], {});
    expect(seen).toEqual({ locke: "" });
    expect(dateNews([watch], seen)).toEqual([]);
  });
  it("says when a saved listing gets this year's dates", () => {
    const seen = settleSeen([watch], {});
    expect(dateNews([announced], seen).map((news) => news.kind)).toEqual(["announced"]);
  });
  it("says when confirmed dates move", () => {
    const seen = settleSeen([announced], {});
    const moved = { ...announced, applicationDeadline: "2027-07-07" };
    expect(dateNews([moved], seen).map((news) => news.kind)).toEqual(["changed"]);
  });
  it("keeps the news until it's acknowledged, then forgets unsaved listings", () => {
    const seen = settleSeen([watch], {});
    expect(dateNews([announced], settleSeen([announced], seen))).toHaveLength(1);
    const acknowledged = settleSeen([announced], seen, true);
    expect(dateNews([announced], acknowledged)).toEqual([]);
    expect(settleSeen([], acknowledged)).toEqual({});
  });
  it("isn't news when dates are taken away, or the listing has closed", () => {
    const seen = { locke: datesSignature(announced) };
    expect(dateNews([watch], seen)).toEqual([]);
    expect(dateNews([{ ...announced, status: "closed", applicationDeadline: "2027-08-01" }], seen)).toEqual([]);
  });
});

describe("round out your year", () => {
  const talk = (id: string) => fixture({ id, name: id, type: "Taster / event", status: "open", eventStart: "2026-12-01" });
  const essay = (id: string, overrides: Partial<Opportunity> = {}) =>
    fixture({ id, name: id, type: "Essay competition", status: "open", applicationDeadline: "2027-03-01", ...overrides });
  it("needs at least two saved things before suggesting anything", () => {
    expect(suggestions([talk("a")], [talk("a"), essay("e")], "2026-11-16")).toEqual([]);
  });
  it("suggests a missing kind, free and student-entered first, then soonest", () => {
    const all = [
      talk("a"),
      talk("b"),
      essay("teacher-one", { requiresTeacher: true, applicationDeadline: "2026-12-01" }),
      essay("later", { applicationDeadline: "2027-05-01" }),
      essay("sooner"),
    ];
    const tips = suggestions([talk("a"), talk("b")], all, "2026-11-16");
    expect(tips[0]).toMatchObject({ kind: "competitions", missing: "No competitions yet." });
    expect(tips[0].item.id).toBe("sooner");
    expect(tips[0].next).toEqual({ kind: "deadline", date: "2027-03-01" });
  });
  it("never suggests something closed, already saved, or not announced", () => {
    const all = [talk("a"), talk("b"), essay("shut", { status: "closed" }), essay("tba", { status: "watchlist" })];
    expect(suggestions([talk("a"), talk("b")], all, "2026-11-16")).toEqual([]);
  });
  it("suggests at most two", () => {
    const tips = suggestions([talk("a"), talk("b")], opportunities.map((item) => ({ ...item })), "2026-11-16");
    expect(tips.length).toBeLessThanOrEqual(2);
    expect(tips.every((tip) => kindOf(tip.item) !== "talks")).toBe(true);
  });
  it("sums up what's saved in words", () => {
    expect(savedSummary([talk("a"), talk("b"), talk("c"), essay("e")])).toBe("You've saved one competition and three talks.");
  });
});

describe("copy my notes", () => {
  it("adds reading and listening under its own heading", () => {
    const item = fixture({ id: "x", name: "Talk", provider: "LSE" });
    const text = recordText(
      [item],
      { x: { done: true, note: "Good on tax.", doneOn: "2026-11-10" } },
      [{ id: "more-or-less", title: "More or Less", by: "BBC", kind: "podcast" }],
      { "more-or-less": { done: true, note: "", doneOn: "2026-11-12" } },
    );
    expect(text).toBe("Talk — LSE (November 2026)\nGood on tax.\n\nReading and listening\n\nMore or Less — BBC (November 2026)");
  });
});

describe("listing tags and countdowns", () => {
  const today = "2026-11-16";
  it("counts down an open listing's deadline over the next two weeks", () => {
    const at = (date: string) => closingSoon(fixture({ status: "open", applicationDeadline: date }), today);
    expect(at("2026-11-17")).toBe("Closes tomorrow");
    expect(at("2026-11-21")).toBe("Closes in 5 days");
    expect(at("2026-11-30")).toBe("Closes in 14 days");
    expect(at("2026-12-01")).toBeNull();
  });
  it("leaves out the last day itself (it gets the pen note), past deadlines and events", () => {
    expect(closingSoon(fixture({ status: "open", applicationDeadline: today }), today)).toBeNull();
    expect(closingSoon(fixture({ status: "open", applicationDeadline: "2026-11-10" }), today)).toBeNull();
    expect(closingSoon(fixture({ status: "open", eventStart: "2026-11-18" }), today)).toBeNull();
    expect(closingSoon(fixture({ status: "coming-soon", applicationDeadline: "2026-11-20" }), today)).toBeNull();
  });
  it("tells taster days from talks, and gives every type a tag", () => {
    expect(typeTag(fixture({ type: "Taster / event", id: "bristol-discover-economics-taster", name: "Discover Economics" }))).toBe("Taster");
    expect(typeTag(fixture({ type: "Taster / event", id: "lse-talk", name: "Money: the inside story" }))).toBe("Talk");
    for (const item of opportunities) expect(typeTag(item)).toBeTruthy();
  });
});
