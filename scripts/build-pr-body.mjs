// Turns scripts/.draft-summary.json (written by draft-updates.mjs) into a PR body that puts
// the evidence for every applied change in front of the reviewer, not just the diff.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const summary = JSON.parse(await readFile(path.join(here, ".draft-summary.json"), "utf8"));

const lines = [
  "This PR was drafted automatically: Claude Haiku read each changed source page and proposed field updates.",
  "**Nothing here is auto-merged — review every field against its quoted source text before merging.**",
  "",
];

for (const entry of summary.entries) {
  if (!entry.applied) continue;
  lines.push(`### \`${entry.id}\``);
  lines.push(`- **What changed:** ${entry.summary}`);
  lines.push(`- **Model confidence:** ${entry.confidence ?? "n/a"}`);
  if (entry.quote) lines.push(`- **Supporting quote from the page:** "${entry.quote}"`);
  lines.push(`- **Fields changed:** \`${JSON.stringify(entry.fields)}\``);
  lines.push("");
}

const skipped = summary.entries.filter((entry) => !entry.applied);
if (skipped.length) {
  lines.push("<details><summary>Checked but not changed</summary>", "");
  for (const entry of skipped) lines.push(`- \`${entry.id}\`: ${entry.summary}`);
  lines.push("", "</details>");
}

await writeFile(path.join(process.cwd(), "pr-body.md"), lines.join("\n") + "\n");
