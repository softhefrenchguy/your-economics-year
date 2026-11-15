import { describe, expect, it } from "vitest";
import { GIVE_UP_AFTER, recordVisit, skipReason } from "./source-health.mjs";
import { validateAndDiff } from "../draft-updates.mjs";

const URL_A = "https://example.org/a";

describe("source health: stop re-trying links that don't work", () => {
  it("marks a 404 dead straight away and skips it after that", () => {
    const health = recordVisit({}, URL_A, { ok: false, status: 404, dead: true, error: "HTTP 404" }, "2026-11-15");
    expect(health[URL_A].state).toBe("dead");
    expect(skipReason(health, URL_A, { retry: false })?.state).toBe("dead");
  });

  it("keeps re-trying other failures until they fail several runs in a row", () => {
    let health = {};
    for (let week = 1; week < GIVE_UP_AFTER; week++) {
      health = recordVisit(health, URL_A, { ok: false, status: 403 }, `2026-11-0${week}`);
      expect(skipReason(health, URL_A, { retry: false })).toBeNull();
    }
    health = recordVisit(health, URL_A, { ok: false, status: 403 }, "2026-11-15");
    expect(health[URL_A]).toMatchObject({ state: "given-up", failures: GIVE_UP_AFTER, since: "2026-11-01" });
    expect(skipReason(health, URL_A, { retry: false })).not.toBeNull();
  });

  it("forgets a URL once it loads, and --retry-dead ignores the record", () => {
    const health = recordVisit({}, URL_A, { ok: false, status: 404, dead: true }, "2026-11-15");
    expect(skipReason(health, URL_A, { retry: true })).toBeNull();
    recordVisit(health, URL_A, { ok: true, status: 200 }, "2026-11-22");
    expect(health[URL_A]).toBeUndefined();
  });

  it("never skips a URL it has no record of (e.g. an entry given a new officialUrl)", () => {
    const health = recordVisit({}, URL_A, { ok: false, status: 404, dead: true }, "2026-11-15");
    expect(skipReason(health, "https://example.org/new-page", { retry: false })).toBeNull();
  });
});

describe("draft-updates: confirmed dates replace last year's", () => {
  const previousCycleEntry = { status: "watchlist", recurring: true, dateConfidence: "previous-cycle", costType: "free" };

  it("flips dateConfidence to confirmed when it applies this cycle's dates", () => {
    const patch = validateAndDiff(
      { hasChange: true, status: "coming-soon", applicationsOpen: "2027-01-11", applicationDeadline: "2027-03-04" },
      previousCycleEntry,
      "2026-11-15",
    );
    expect(patch).toMatchObject({ status: "coming-soon", dateConfidence: "confirmed" });
  });

  it("leaves dateConfidence alone when no date was applied", () => {
    const patch = validateAndDiff({ hasChange: true, costType: "paid" }, previousCycleEntry, "2026-11-15");
    expect(patch.dateConfidence).toBeUndefined();
  });
});
