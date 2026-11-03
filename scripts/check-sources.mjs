// Fetches every opportunity's officialUrl with a real (headless) Chromium — not a spoofed
// or fingerprint-evaded one, just an ordinary browser engine — and compares its rendered text
// against a snapshot from the last run, flagging pages that look different. That's a cheap
// signal that something may have changed (a date, a status, anything) and the entry is due
// for a human/AI re-check. This is NOT a scraper: it never reads a date out of the page or
// touches src/data/opportunities.ts itself. It only tells you where to look.
//
// Some sites (see README) put a CAPTCHA / bot check in front of automated requests. Headless
// (CI, the default) reports those as "couldn't check" and never tries to defeat them — no
// proxies, no fingerprint spoofing, no automated CAPTCHA-solving. With `--interactive` (what
// `npm run weekly` uses on your own PC) a visible browser pauses and alerts you so a real
// person can complete the check by hand — see scripts/lib/browser.mjs.
//
// Run with: npm run check-sources   (add `-- --interactive` to get the human-help mode)
// Snapshots persist in scripts/source-snapshots.json, committed to the repo so "changed
// since last run" means something across sessions, not just within one.
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openBrowser, visit } from "./lib/browser.mjs";
import { opportunities } from "../src/data/opportunities.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const snapshotPath = path.join(here, "source-snapshots.json");
// Scratch file for the next step (draft-updates.mjs) — never committed, see .gitignore.
// Holds the freshly fetched text only for entries flagged "changed", so that step doesn't
// have to re-fetch (and re-risk a bot block) to get the same content this run already has.
const changedPath = path.join(here, ".changed-sources.json");
const REQUEST_DELAY_MS = 400;

function hash(text) {
  return createHash("sha256").update(text.replace(/\s+/g, " ").trim()).digest("hex");
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
  const { context, close } = await openBrowser();
  try {
    for (const item of opportunities) {
      if (!item.officialUrl) continue;
      const page = await visit(context, item.officialUrl);
      if (!page.ok) {
        results.push({ id: item.id, status: "error", detail: page.error });
      } else {
        const digest = hash(page.text);
        const previous = snapshots[item.id];
        const checkedAt = new Date().toISOString().slice(0, 10);
        if (!previous)
          results.push({ id: item.id, status: "new", detail: "no prior snapshot — baseline recorded" });
        else if (previous.hash !== digest)
          results.push({ id: item.id, status: "changed", detail: `differs from the snapshot taken ${previous.checkedAt}`, text: page.text });
        else results.push({ id: item.id, status: "unchanged", detail: `matches snapshot from ${previous.checkedAt}` });
        snapshots[item.id] = { hash: digest, checkedAt, url: item.officialUrl };
      }
      await sleep(REQUEST_DELAY_MS);
    }
  } finally {
    await close();
  }
  await writeFile(snapshotPath, JSON.stringify(snapshots, null, 2) + "\n");

  const changed = results.filter((r) => r.status === "changed");
  const errored = results.filter((r) => r.status === "error");
  const fresh = results.filter((r) => r.status === "new");

  await writeFile(
    changedPath,
    JSON.stringify(
      changed.map((r) => ({ id: r.id, text: r.text })),
      null,
      2,
    ) + "\n",
  );

  console.log(`Checked ${results.length} sources.\n`);
  if (changed.length) {
    console.log(`⚠ ${changed.length} page(s) look different since last check — go re-verify these:`);
    for (const r of changed) console.log(`  - ${r.id}: ${r.detail}`);
    console.log("");
  }
  if (errored.length) {
    console.log(`✗ ${errored.length} source(s) couldn't be checked (some sites block automated requests — check manually):`);
    for (const r of errored) console.log(`  - ${r.id}: ${r.detail}`);
    console.log("");
  }
  if (fresh.length) {
    console.log(`${fresh.length} source(s) had no prior snapshot — baseline recorded now, nothing to compare yet.`);
  }
  if (!changed.length && !errored.length && !fresh.length) console.log("No changes detected since the last run.");
}

main();
