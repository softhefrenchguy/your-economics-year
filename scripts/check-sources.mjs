// Fetches every opportunity's officialUrl and compares its (roughly normalised) text
// against a snapshot from the last run, flagging pages that look different — a cheap signal
// that something may have changed (a date, a status, anything) and the entry is due for a
// human re-check. This is NOT a scraper: it never reads a date out of the page or touches
// src/data/opportunities.ts. It only tells you where to look.
//
// Run with: npm run check-sources
// Snapshots persist in scripts/source-snapshots.json, committed to the repo so "changed
// since last run" means something across sessions, not just within one.
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { opportunities } from "../src/data/opportunities.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const snapshotPath = path.join(here, "source-snapshots.json");
const REQUEST_DELAY_MS = 400;

function normalise(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hash(text) {
  return createHash("sha256").update(text).digest("hex");
}

async function loadSnapshots() {
  try {
    return JSON.parse(await readFile(snapshotPath, "utf8"));
  } catch {
    return {};
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const snapshots = await loadSnapshots();
  const results = [];
  for (const item of opportunities) {
    if (!item.officialUrl) continue;
    try {
      const response = await fetch(item.officialUrl, {
        headers: { "user-agent": "Mozilla/5.0 (compatible; YourEconomicsYear-SourceCheck/1.0)" },
      });
      if (!response.ok) {
        results.push({ id: item.id, status: "error", detail: `HTTP ${response.status}` });
      } else {
        const digest = hash(normalise(await response.text()));
        const previous = snapshots[item.id];
        const checkedAt = new Date().toISOString().slice(0, 10);
        if (!previous) results.push({ id: item.id, status: "new", detail: "no prior snapshot — baseline recorded" });
        else if (previous.hash !== digest)
          results.push({ id: item.id, status: "changed", detail: `differs from the snapshot taken ${previous.checkedAt}` });
        else results.push({ id: item.id, status: "unchanged", detail: `matches snapshot from ${previous.checkedAt}` });
        snapshots[item.id] = { hash: digest, checkedAt, url: item.officialUrl };
      }
    } catch (error) {
      results.push({ id: item.id, status: "error", detail: error instanceof Error ? error.message : String(error) });
    }
    await sleep(REQUEST_DELAY_MS);
  }
  await writeFile(snapshotPath, JSON.stringify(snapshots, null, 2) + "\n");

  const changed = results.filter((r) => r.status === "changed");
  const errored = results.filter((r) => r.status === "error");
  const fresh = results.filter((r) => r.status === "new");

  console.log(`Checked ${results.length} sources.\n`);
  if (changed.length) {
    console.log(`⚠ ${changed.length} page(s) look different since last check — go re-verify these:`);
    for (const r of changed) console.log(`  - ${r.id}: ${r.detail}`);
    console.log("");
  }
  if (errored.length) {
    console.log(`✗ ${errored.length} source(s) couldn't be fetched (some sites block automated requests — check manually):`);
    for (const r of errored) console.log(`  - ${r.id}: ${r.detail}`);
    console.log("");
  }
  if (fresh.length) {
    console.log(`${fresh.length} source(s) had no prior snapshot — baseline recorded now, nothing to compare yet.`);
  }
  if (!changed.length && !errored.length && !fresh.length) console.log("No changes detected since the last run.");
}

main();
