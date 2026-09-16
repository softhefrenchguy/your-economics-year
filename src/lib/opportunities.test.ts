import { describe, expect, it } from "vitest";
import { opportunities } from "../data/opportunities";
import {
  academicMonths,
  actionDate,
  categorise,
  currentAcademicYear,
  effectiveStatus,
  emptyFilters,
  filterOpportunities,
  formatDate,
  prioritiseFree,
  sortByDeadline,
  teacherOpportunities,
  timelineEntries,
  withEffectiveStatus,
} from "./opportunities";
import type { Opportunity } from "../types/opportunity";

const fixture = (overrides: Partial<Opportunity>): Opportunity => ({
  ...opportunities[0],
  ...overrides,
});

describe("opportunity filtering", () => {
  it.each(["open", "coming-soon", "watchlist"] as const)("isolates the %s state", (status) => {
    const result = filterOpportunities(opportunities, emptyFilters, status);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.status === status)).toBe(true);
    expect(result.length).toBe(opportunities.filter((item) => item.status === status).length);
  });
  it("returns an empty list for a status with no matching records, without throwing", () => {
    expect(filterOpportunities(opportunities, emptyFilters, "closed")).toEqual([]);
  });
  it("excludes paid and unknown-cost entries when free only is selected", () => {
    const result = filterOpportunities(opportunities, { ...emptyFilters, freeOnly: true });
    expect(result.every((item) => item.costType === "free")).toBe(true);
    expect(result.length).toBeLessThan(opportunities.length);
  });
  it("intersects cost, delivery, location, category and status filters", () => {
    const result = filterOpportunities(
      opportunities,
      { freeOnly: true, online: true, location: "UK-wide", categories: ["Policy"] },
      "coming-soon",
    );
    expect(result.map((item) => item.id)).toEqual(["fcdo-next-generation-economics"]);
  });
  it("matches any selected category without duplicating a result that fits several", () => {
    const result = filterOpportunities(
      opportunities,
      { ...emptyFilters, categories: ["Competition", "Finance"] },
      "watchlist",
    );
    expect(result.filter((item) => item.id === "oxford-econsoc-essay")).toHaveLength(1);
    expect(new Set(result.map((item) => item.id)).size).toBe(result.length);
    expect(result.every((item) => categorise(item).some((c) => c === "Competition" || c === "Finance"))).toBe(true);
  });
  it("does not treat hybrid programmes as fully online", () => {
    expect(
      filterOpportunities(opportunities, { ...emptyFilters, online: true }).some(
        (item) => item.deliveryMode === "hybrid",
      ),
    ).toBe(false);
  });
});

describe("categorisation", () => {
  it("includes essay competitions under Competition, and Public Policy under Policy", () => {
    expect(categorise(fixture({ type: "Essay competition", topics: ["Economics", "Public Policy"] }))).toEqual([
      "Competition",
      "Policy",
    ]);
  });
  it("includes university tasters and summer schools in University", () => {
    expect(categorise(fixture({ type: "Summer school", topics: ["Economics"] }))).toEqual(["University"]);
    expect(categorise(fixture({ type: "Taster / event", topics: ["Economics"] }))).toEqual(["University"]);
  });
  it("allows work experience to carry a Finance category via topics", () => {
    expect(categorise(fixture({ type: "Work experience", topics: ["Finance"] }))).toEqual([
      "Work experience",
      "Finance",
    ]);
  });
  it("puts business & entrepreneurship opportunities in Business", () => {
    expect(categorise(fixture({ type: "Business & entrepreneurship", topics: ["Business", "Entrepreneurship"] }))).toEqual([
      "Business",
    ]);
  });
});

describe("action dates and sorting", () => {
  it("sorts action dates chronologically across the year, placing missing dates last", () => {
    const items = [
      fixture({ id: "unknown", status: "open", applicationsOpen: null, applicationDeadline: null }),
      fixture({ id: "jan", status: "open", applicationDeadline: "2027-01-01" }),
      fixture({ id: "dec", status: "open", applicationDeadline: "2026-12-01" }),
    ];
    expect(sortByDeadline(items).map((item) => item.id)).toEqual(["dec", "jan", "unknown"]);
  });
  it("orders a coming-soon item with a confirmed date ahead of a watchlist item, which never gets one", () => {
    const items = [
      fixture({ id: "watch", status: "watchlist", applicationDeadline: "2025-01-01" }),
      fixture({ id: "soon", status: "coming-soon", applicationDeadline: "2027-03-01" }),
    ];
    expect(sortByDeadline(items).map((item) => item.id)).toEqual(["soon", "watch"]);
  });
  it("CRITICAL: never derives an action date for a watchlist item, even if a deadline field is still set on it", () => {
    const item = fixture({ id: "watch", status: "watchlist", applicationDeadline: "2026-01-15" });
    expect(actionDate(item)).toBeNull();
  });
  it("places free opportunities first, then unknown cost, then paid, ordering each group by date", () => {
    const items = [
      fixture({ id: "paid", status: "open", costType: "paid", applicationDeadline: "2026-09-01" }),
      fixture({ id: "unknown-cost", status: "open", costType: "unknown", applicationDeadline: "2026-09-01" }),
      fixture({ id: "later", status: "open", costType: "free", applicationDeadline: "2026-11-01" }),
      fixture({ id: "earlier", status: "open", costType: "free", applicationDeadline: "2026-10-01" }),
    ];
    expect(prioritiseFree(items).map((item) => item.id)).toEqual(["earlier", "later", "unknown-cost", "paid"]);
  });
});

describe("timeline placement", () => {
  it("includes openings, deadlines, starts and ends within the academic year", () => {
    const entries = timelineEntries(
      [
        fixture({
          status: "open",
          applicationsOpen: "2026-08-31",
          applicationDeadline: "2026-12-31",
          eventStart: "2027-01-01",
          eventEnd: "2027-01-04",
        }),
      ],
      2026,
    );
    expect(entries.map((entry) => [entry.date, entry.label])).toEqual([
      ["2026-12-31", "Application deadline"],
      ["2027-01-01", "Event starts"],
      ["2027-01-04", "Event ends"],
    ]);
    expect(
      timelineEntries([fixture({ status: "open", applicationsOpen: null, applicationDeadline: "2027-09-01" })], 2026),
    ).toEqual([]);
  });
  it("does not duplicate the end of a single-day event", () => {
    const entries = timelineEntries(
      [
        fixture({
          status: "open",
          applicationsOpen: null,
          applicationDeadline: null,
          eventStart: "2026-10-01",
          eventEnd: "2026-10-01",
        }),
      ],
      2026,
    );
    expect(entries).toHaveLength(1);
  });
  it("places previous-cycle dates as estimated markers shifted into the current academic year", () => {
    const item = fixture({
      id: "watch",
      status: "watchlist",
      previousCycle: {
        label: "2025–26 cycle",
        applicationDeadline: "2026-05-29",
        eventStart: "2026-06-02",
        eventEnd: "2026-06-18",
      },
    });
    const entries = timelineEntries([item], 2026);
    expect(entries.map((entry) => entry.date)).toEqual(["2027-05-29", "2027-06-02", "2027-06-18"]);
    expect(entries.every((entry) => entry.estimated)).toBe(true);
    expect(entries.every((entry) => entry.label.includes("not confirmed"))).toBe(true);
  });
  it("CRITICAL: a stale deadline stored directly on a watchlist item is never shown as an upcoming date", () => {
    const item = fixture({
      id: "danger",
      status: "watchlist",
      applicationDeadline: "2026-01-15",
      applicationsOpen: "2025-09-01",
      eventStart: "2026-02-01",
      previousCycle: null,
    });
    expect(timelineEntries([item], 2026)).toEqual([]);
  });
  it("shows a real coming-soon previous-cycle deadline (FCDO) as estimated, not confirmed", () => {
    const fcdo = opportunities.find((item) => item.id === "fcdo-next-generation-economics")!;
    const entries = timelineEntries([fcdo], 2026);
    expect(entries).toHaveLength(1);
    expect(entries[0].date).toBe("2027-06-28");
    expect(entries[0].estimated).toBe(true);
  });
  it("spans September to August and formats month-only estimates without inventing a day", () => {
    const months = academicMonths(2026);
    expect(months).toHaveLength(12);
    expect(months[0].date).toBe("2026-09");
    expect(months[4].date).toBe("2027-01");
    expect(months[11].date).toBe("2027-08");
    expect(formatDate("2027-02")).toBe("February 2027");
  });
});

describe("status ages against real dates instead of needing manual edits", () => {
  it("CRITICAL: an 'open' item automatically becomes 'closed' once its deadline has passed", () => {
    const item = fixture({ status: "open", applicationDeadline: "2026-10-19", eventStart: null, eventEnd: null });
    expect(effectiveStatus(item, "2026-10-18")).toBe("open");
    expect(effectiveStatus(item, "2026-10-19")).toBe("open");
    expect(effectiveStatus(item, "2026-10-20")).toBe("closed");
  });
  it("falls back to the event date when there's no separate application deadline", () => {
    const item = fixture({
      status: "open",
      applicationDeadline: null,
      applicationsOpen: null,
      eventStart: "2026-09-30",
      eventEnd: "2026-09-30",
    });
    expect(effectiveStatus(item, "2026-09-30")).toBe("open");
    expect(effectiveStatus(item, "2026-10-01")).toBe("closed");
  });
  it("becomes 'coming-soon' before an announced applicationsOpen date, then 'open' after", () => {
    const item = fixture({ status: "open", applicationsOpen: "2027-01-01", applicationDeadline: "2027-02-01" });
    expect(effectiveStatus(item, "2026-12-31")).toBe("coming-soon");
    expect(effectiveStatus(item, "2027-01-01")).toBe("open");
  });
  it("never derives a status for watchlist items, and never reopens a closed one", () => {
    const watchlisted = fixture({ status: "watchlist", applicationDeadline: "2099-01-01" });
    expect(effectiveStatus(watchlisted, "2000-01-01")).toBe("watchlist");
    const closed = fixture({ status: "closed", applicationDeadline: "2099-01-01" });
    expect(effectiveStatus(closed, "2000-01-01")).toBe("closed");
  });
  it("keeps the authored status for rolling items with no dates at all to derive from", () => {
    const rolling = fixture({
      status: "open",
      applicationsOpen: null,
      applicationDeadline: null,
      eventStart: null,
      eventEnd: null,
    });
    expect(effectiveStatus(rolling, "2099-01-01")).toBe("open");
  });
  it("withEffectiveStatus rewrites every item's status without mutating the source array", () => {
    const source = [
      fixture({ id: "a", status: "open", applicationsOpen: null, applicationDeadline: "2026-01-01" }),
    ];
    const result = withEffectiveStatus(source, "2026-06-01");
    expect(result[0].status).toBe("closed");
    expect(source[0].status).toBe("open");
  });
  it("computes the Sept–Aug academic year a date falls in", () => {
    expect(currentAcademicYear("2026-09-16")).toBe(2026);
    expect(currentAcademicYear("2027-08-31")).toBe(2026);
    expect(currentAcademicYear("2027-09-01")).toBe(2027);
  });
});

describe("teacher-required opportunities", () => {
  it("CRITICAL: never falls back to student-facing copy — every teacher-required item has its own teacherPitch", () => {
    const { nominated, direct } = teacherOpportunities(opportunities);
    for (const item of [...nominated, ...direct]) {
      expect(item.teacherPitch, `${item.id} needs a teacherPitch, not whyRelevant`).toBeTruthy();
      expect(item.teacherPitch).not.toBe(item.whyRelevant);
    }
  });
  it("splits nominated/competitive entries from direct bookings, and only includes items needing a teacher", () => {
    const { nominated, direct } = teacherOpportunities(opportunities);
    expect(nominated.length).toBeGreaterThan(0);
    expect(direct.length).toBeGreaterThan(0);
    expect(nominated.every((item) => item.requiresSchoolNomination)).toBe(true);
    expect(direct.every((item) => item.requiresTeacher && !item.requiresSchoolNomination)).toBe(true);
    const all = [...nominated, ...direct];
    expect(all.every((item) => item.requiresTeacher || item.requiresSchoolNomination)).toBe(true);
    expect(
      opportunities
        .filter((item) => !item.requiresTeacher && !item.requiresSchoolNomination)
        .every((item) => !all.includes(item)),
    ).toBe(true);
  });
});

describe("data integrity", () => {
  it("gives every opportunity a real https source, a checked date and a unique id", () => {
    expect(opportunities.every((item) => item.officialUrl.startsWith("https://"))).toBe(true);
    expect(opportunities.every((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.sourceLastChecked))).toBe(true);
    expect(new Set(opportunities.map((item) => item.id)).size).toBe(opportunities.length);
  });
  it("only claims previous-cycle confidence when real previous-cycle dates are stored", () => {
    for (const item of opportunities) {
      if (item.dateConfidence === "previous-cycle") expect(item.previousCycle).not.toBeNull();
      if (item.dateConfidence === "expected") expect(item.previousCycle).toBeNull();
    }
  });
});
