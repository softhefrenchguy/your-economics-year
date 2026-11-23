import { afterEach, describe, expect, it, vi } from "vitest";
import { clickPath, countOfficialClick } from "./clicks";

const g = globalThis as { goatcounter?: unknown };

describe("countOfficialClick", () => {
  afterEach(() => {
    delete g.goatcounter;
  });

  it("sends one GoatCounter event per click, keyed by the listing id", () => {
    const count = vi.fn();
    g.goatcounter = { count };
    countOfficialClick("kplus-kings", "K+ at King's");
    expect(count).toHaveBeenCalledWith({ path: "official/kplus-kings", title: "K+ at King's", event: true });
  });

  it("does nothing when the script is blocked or not loaded yet", () => {
    expect(() => countOfficialClick("kplus-kings", "K+")).not.toThrow();
    g.goatcounter = {};
    expect(() => countOfficialClick("kplus-kings", "K+")).not.toThrow();
  });

  it("never throws if GoatCounter itself fails", () => {
    g.goatcounter = { count: () => { throw new Error("offline"); } };
    expect(() => countOfficialClick("kplus-kings", "K+")).not.toThrow();
  });

  it("builds the dashboard path", () => {
    expect(clickPath("abc")).toBe("official/abc");
  });
});
