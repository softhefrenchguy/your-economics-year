import { describe, expect, it } from "vitest";
import {
  RETRY_BOT_AFTER_DAYS,
  forgetHost,
  isRefusalStatus,
  rememberHost,
  straightToOwnBrowser,
} from "./own-browser-hosts.mjs";

const LSE = "www.lse.ac.uk";

describe("own-browser hosts: ask about a blocked site once, not once per page", () => {
  it("sends a site's other pages straight to the person's browser once it has blocked the bot", () => {
    const hosts = rememberHost({}, LSE, "bot check not completed in time", "2026-11-22");
    expect(straightToOwnBrowser(hosts, LSE, "2026-11-22")?.reason).toBe("bot check not completed in time");
    expect(straightToOwnBrowser(hosts, "www.gresham.ac.uk", "2026-11-22")).toBeNull();
  });

  it("still remembers the site on later Sundays", () => {
    const hosts = rememberHost({}, LSE, "you chose copy-paste", "2026-11-22");
    expect(straightToOwnBrowser(hosts, LSE, "2026-11-29")).not.toBeNull();
    expect(straightToOwnBrowser(hosts, LSE, "2026-12-13")).not.toBeNull();
  });

  it("lets the bot try again after a few weeks, and restarts the clock if it's blocked again", () => {
    const hosts = rememberHost({}, LSE, "Cloudflare check", "2026-11-01");
    const later = new Date(Date.parse("2026-11-01") + RETRY_BOT_AFTER_DAYS * 86400000).toISOString().slice(0, 10);
    expect(straightToOwnBrowser(hosts, LSE, later)).toBeNull();
    rememberHost(hosts, LSE, "Cloudflare check", later);
    expect(hosts[LSE].since).toBe("2026-11-01");
    expect(straightToOwnBrowser(hosts, LSE, later)).not.toBeNull();
  });

  it("forgets a site the bot can load again", () => {
    const hosts = rememberHost({}, LSE, "HTTP 403", "2026-11-22");
    expect(forgetHost(hosts, LSE)).toBe(true);
    expect(straightToOwnBrowser(hosts, LSE, "2026-11-22")).toBeNull();
    expect(forgetHost(hosts, LSE)).toBe(false);
  });

  it("ignores a record with a broken or future date instead of trusting it", () => {
    expect(straightToOwnBrowser({ [LSE]: { reason: "x", lastBotTry: "not a date" } }, LSE, "2026-11-22")).toBeNull();
    expect(straightToOwnBrowser({ [LSE]: { reason: "x", lastBotTry: "2027-01-01" } }, LSE, "2026-11-22")).toBeNull();
  });

  it("only treats a refusal as a reason to mark the whole site, never a broken page", () => {
    expect(isRefusalStatus(403)).toBe(true);
    expect(isRefusalStatus(429)).toBe(true);
    expect(isRefusalStatus(404)).toBe(false);
    expect(isRefusalStatus(500)).toBe(false);
  });
});
