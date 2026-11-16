import { describe, expect, it } from "vitest";
import { opportunities } from "../data/opportunities";
import type { Opportunity } from "../types/opportunity";
import { termSheet, termsFrom } from "./terms";
import { listingIdFromUrl } from "./links";

const fixture = (overrides: Partial<Opportunity>): Opportunity => ({
  ...opportunities[0],
  applicationsOpen: null,
  applicationDeadline: null,
  eventStart: null,
  eventEnd: null,
  previousCycle: null,
  ...overrides,
});

describe("school terms", () => {
  it("gives the term today is in and the next one, across the new year", () => {
    const [now, next] = termsFrom("2026-11-16");
    expect(now).toMatchObject({ name: "Autumn term 2026", start: "2026-09-01", end: "2026-12-31" });
    expect(next).toMatchObject({ name: "Spring term 2027", start: "2027-01-01", end: "2027-03-31" });
    expect(termsFrom("2027-05-02").map((term) => term.name)).toEqual(["Summer term 2027", "Autumn term 2027"]);
  });
});

describe("termly list", () => {
  const [autumn, spring] = termsFrom("2026-11-16");
  const items = [
    fixture({ id: "spring-essay", name: "Spring essay", status: "open", applicationDeadline: "2027-01-05" }),
    fixture({ id: "past", name: "Past talk", status: "open", eventStart: "2026-10-01" }),
    fixture({ id: "soon", name: "Soon talk", status: "open", eventStart: "2026-11-20" }),
    fixture({ id: "opens", name: "Opens later", status: "coming-soon", applicationsOpen: "2027-01-11", applicationDeadline: "2027-03-04" }),
    fixture({ id: "rolling", name: "Rolling", status: "open" }),
    fixture({ id: "closed", name: "Closed", status: "closed", applicationDeadline: "2027-01-05" }),
    fixture({
      id: "tba",
      name: "Not announced",
      status: "watchlist",
      dateConfidence: "previous-cycle",
      previousCycle: { label: "2026", applicationDeadline: "2026-02-14" },
    }),
  ];
  it("lists only what's still ahead in the term in progress", () => {
    const sheet = termSheet(items, autumn, "2026-11-16");
    expect(sheet.dated.map((row) => row.item.id)).toEqual(["soon"]);
    expect(sheet.anytime.map((item) => item.id)).toEqual(["rolling"]);
    expect(sheet.expected).toEqual([]);
  });
  it("gives next term's confirmed dates in order, with every key date in that term", () => {
    const sheet = termSheet(items, spring, "2026-11-16");
    expect(sheet.dated.map((row) => row.item.id)).toEqual(["spring-essay", "opens"]);
    expect(sheet.dated[1].when).toBe("opens 11 Jan, apply by 4 Mar");
  });
  it("puts not-announced items under the term last year's date fell in, never as a confirmed date", () => {
    const sheet = termSheet(items, spring, "2026-11-16");
    expect(sheet.expected.map((entry) => entry.item.id)).toEqual(["tba"]);
    expect(sheet.dated.some((row) => row.item.id === "tba")).toBe(false);
  });
  it("drops a not-announced item whose usual month has already gone by this term", () => {
    const september = fixture({
      id: "sept",
      status: "watchlist",
      dateConfidence: "previous-cycle",
      previousCycle: { label: "2026", applicationDeadline: "2026-09-30" },
    });
    expect(termSheet([september], autumn, "2026-11-16").expected).toEqual([]);
    expect(termSheet([september], autumn, "2026-09-02").expected.map((entry) => entry.item.id)).toEqual(["sept"]);
  });
  it("never lists closed items", () => {
    for (const term of [autumn, spring]) {
      const sheet = termSheet(items, term, "2026-11-16");
      expect([...sheet.dated.map((row) => row.item), ...sheet.anytime].some((item) => item.id === "closed")).toBe(false);
    }
  });
});

describe("listing links", () => {
  it("reads a listing id from the address, and ignores anything that isn't one", () => {
    expect(listingIdFromUrl("?listing=john-locke-essay-competition")).toBe("john-locke-essay-competition");
    expect(listingIdFromUrl("?listing=<script>")).toBeNull();
    expect(listingIdFromUrl("")).toBeNull();
  });
});

describe("read & listen", () => {
  it("gives every resource a unique id, and a working https link unless it's a book", async () => {
    const { resources } = await import("../data/resources");
    expect(new Set(resources.map((item) => item.id)).size).toBe(resources.length);
    for (const item of resources) {
      if (item.kind === "book") expect(item.year).toBeGreaterThan(1900);
      else expect(item.url).toMatch(/^https:\/\//);
      expect(item.why.length).toBeGreaterThan(20);
    }
  });
});
