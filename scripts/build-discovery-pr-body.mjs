// Turns scripts/.discovery-summary.json (written by discover-opportunities.mjs) into a PR
// body that shows every candidate considered, not just the ones added — so a reviewer can
// see what was found and rejected, not only what's about to be merged.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const summary = JSON.parse(await readFile(path.join(here, ".discovery-summary.json"), "utf8"));

const lines = [
  "This PR was drafted automatically: Claude Sonnet scanned known hub pages for opportunities not yet tracked, and drafted full entries for ones it judged genuinely relevant.",
  "**Nothing here is auto-merged — read each new entry against its source before merging.**",
  "",
];

const added = summary.entries.filter((entry) => entry.status === "added");
for (const entry of added) {
  lines.push(`### New: \`${entry.id}\` — ${entry.name}`);
  lines.push(`- **Source:** ${entry.url} (found via ${entry.hub})`);
  lines.push(`- **Model confidence:** ${entry.confidence ?? "n/a"}`);
  lines.push(`- **Why it was added:** ${entry.reasoning}`);
  if (entry.quote) lines.push(`- **Supporting quote from the page:** "${entry.quote}"`);
  lines.push("");
}

const other = summary.entries.filter((entry) => entry.status !== "added");
if (other.length) {
  lines.push("<details><summary>Considered but not added</summary>", "");
  for (const entry of other) {
    lines.push(`- \`${entry.name ?? entry.hub}\` (${entry.status}): ${entry.detail ?? ""}`);
  }
  lines.push("", "</details>");
}

await writeFile(path.join(process.cwd(), "discovery-pr-body.md"), lines.join("\n") + "\n");
