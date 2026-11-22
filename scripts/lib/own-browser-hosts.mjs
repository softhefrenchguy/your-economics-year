// Remembers which sites won't let the bot's browser in, so their pages open straight in the
// person's own browser (see manualCopy in browser.mjs) instead of asking for a human check
// on every single page. LSE alone has ~20 tracked pages: without this, each one showed the
// "needs a human check" pop-up again.
//
// Kept next to the bot's browser profile (%LOCALAPPDATA%\your-economics-year), not in the
// repo: which sites block a browser depends on this PC and its cookies, not on the project.
//
// A remembered site isn't written off for good: once RETRY_BOT_AFTER_DAYS have passed since
// the bot last tried it, the bot tries one page again. If that loads, the site is forgotten;
// if it's blocked again, the clock restarts.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export const RETRY_BOT_AFTER_DAYS = 28;
// A refusal aimed at the browser rather than a broken page. A 404 or a 500 says nothing
// about the rest of the site, so those never mark a whole host.
const REFUSAL_STATUSES = new Set([401, 403, 429]);

const filePath = path.join(
  process.env.LOCALAPPDATA ?? path.join(os.homedir(), ".cache"),
  "your-economics-year",
  "own-browser-hosts.json",
);

export function loadOwnBrowserHosts(file = filePath) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

export function saveOwnBrowserHosts(hosts, file = filePath) {
  try {
    mkdirSync(path.dirname(file), { recursive: true });
    const sorted = Object.fromEntries(Object.entries(hosts).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(file, JSON.stringify(sorted, null, 2) + "\n");
  } catch {
    // Only a convenience: failing to save must never stop the run.
  }
}

function daysBetween(from, to) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86400000);
}

// The stored record if this host's pages should skip the bot's window today, otherwise null.
export function straightToOwnBrowser(hosts, host, today) {
  const record = hosts[host];
  if (!record) return null;
  const age = daysBetween(record.lastBotTry, today);
  return Number.isFinite(age) && age >= 0 && age < RETRY_BOT_AFTER_DAYS ? record : null;
}

// The bot was just refused by this host. Mutates and returns `hosts`.
export function rememberHost(hosts, host, reason, today) {
  if (!host) return hosts;
  hosts[host] = { reason, since: hosts[host]?.since ?? today, lastBotTry: today };
  return hosts;
}

// The bot just loaded a page from this host without help. Returns true if it had been remembered.
export function forgetHost(hosts, host) {
  if (!hosts[host]) return false;
  delete hosts[host];
  return true;
}

export function isRefusalStatus(status) {
  return REFUSAL_STATUSES.has(status);
}
