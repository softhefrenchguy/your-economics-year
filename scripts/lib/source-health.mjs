// Remembers which URLs don't work, so the weekly run stops re-trying them every Sunday (and
// stops asking you to copy-paste a page that's just a 404 behind a Cloudflare check).
//
// Kept in scripts/source-health.json, committed alongside the snapshots, keyed by URL — so
// fixing an entry's officialUrl in the data file automatically gets the new URL tried.
//
//   dead      404/410 (from the bot or a copied "page not found"). Never re-tried: the link
//             needs replacing. Listed every run so it doesn't get forgotten.
//   failing   any other failure (403, timeout, copy-paste skipped...). Re-tried next week.
//   given-up  failing GIVE_UP_AFTER runs in a row. Not re-tried any more.
//
// `--retry-dead` on check-sources / discover-opportunities ignores all of this for one run.
// A URL that loads fine is removed from the file.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const GIVE_UP_AFTER = 3;
export const retryDead = process.argv.includes("--retry-dead");
const healthPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "source-health.json");

export async function loadHealth() {
  try {
    return JSON.parse(await readFile(healthPath, "utf8"));
  } catch {
    return {};
  }
}

export async function saveHealth(health) {
  const sorted = Object.fromEntries(Object.entries(health).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(healthPath, JSON.stringify(sorted, null, 2) + "\n");
}

// Returns the stored record if this URL should be skipped this run, otherwise null.
export function skipReason(health, url, { retry = retryDead } = {}) {
  const record = health[url];
  if (!record || retry) return null;
  return record.state === "dead" || record.state === "given-up" ? record : null;
}

// Updates the record for one URL from a visit() result. Mutates and returns `health`.
export function recordVisit(health, url, result, today) {
  if (result.ok) {
    delete health[url];
    return health;
  }
  const previous = health[url];
  const reason = result.error ?? `HTTP ${result.status || "no response"}`;
  if (result.dead) {
    health[url] = { state: "dead", reason, since: previous?.state === "dead" ? previous.since : today, lastTried: today };
    return health;
  }
  const failures = (previous && previous.state !== "dead" ? previous.failures ?? 0 : 0) + 1;
  health[url] = {
    state: failures >= GIVE_UP_AFTER ? "given-up" : "failing",
    reason,
    failures,
    since: previous && previous.state !== "dead" ? previous.since : today,
    lastTried: today,
  };
  return health;
}
