// The weekly data run, done on your own PC with you nearby (replaces the old Monday GitHub
// Actions schedule, which couldn't get past the CAPTCHAs on sites like LSE's).
//
//   1. Sync main with GitHub.
//   2. check-sources --interactive: visible Edge window; any CAPTCHA pings you to solve it.
//   3. draft-updates: Claude Haiku proposes field updates for pages that changed.
//   4. Commit + push the refreshed snapshots straight to main (data-free, safe).
//   5. discover-opportunities --interactive: Claude Sonnet drafts new entries from hub pages.
//   6. Any data changes go on their own review branch (never straight to main), only after
//      `tsc --noEmit` passes, and a pre-filled "open pull request" page opens in your browser.
//
// Run with: npm run weekly   (scheduled Sundays 19:00 via scripts/weekly.cmd — see README)
// Needs ANTHROPIC_API_KEY in .env.local (gitignored) for steps 3 and 5; without it only the
// source check runs.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
const DATA_FILE = "src/data/opportunities.ts";
const SNAPSHOTS = "scripts/source-snapshots.json";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);

function run(cmd, args, { allowFail = false, quiet = false } = {}) {
  const result = spawnSync(cmd, args, {
    stdio: quiet ? "pipe" : "inherit",
    encoding: "utf8",
    shell: cmd === "npm" || cmd === "npx", // .cmd shims on Windows need a shell
  });
  if (result.status !== 0 && !allowFail) {
    throw new Error(`\`${cmd} ${args.join(" ")}\` failed (exit ${result.status}).${quiet ? `\n${result.stderr}` : ""}`);
  }
  return { ok: result.status === 0, out: (result.stdout ?? "").trim() };
}
const git = (...args) => run("git", args, { quiet: true });
const script = (name, ...args) =>
  run(process.execPath, ["--experimental-strip-types", `scripts/${name}`, ...args], { allowFail: true });
const heading = (text) => console.log(`\n━━━ ${text} ━━━\n`);
const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};

function repoWebUrl() {
  const remote = git("remote", "get-url", "origin").out;
  return remote.replace(/^git@github\.com:/, "https://github.com/").replace(/\.git$/, "");
}

// Puts the data-file change on its own branch, pushes it, and returns a pre-filled PR URL.
// Returns null (and reverts the data file) if the change doesn't type-check.
function proposeOnBranch(prefix, title, bodyScript, bodyFile) {
  if (!run("npm", ["run", "check"], { allowFail: true }).ok) {
    console.log(`✗ The drafted change broke the type check, so it was discarded. Nothing pushed.`);
    git("checkout", "--", DATA_FILE);
    return null;
  }
  run(process.execPath, [`scripts/${bodyScript}`]);
  const body = readFileSync(bodyFile, "utf8");
  rmSync(bodyFile, { force: true });
  const stamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-");
  const branch = `${prefix}/${stamp}`;
  git("checkout", "-b", branch);
  git("add", DATA_FILE);
  git("commit", "-m", `${title}\n\nDrafted by npm run weekly; review before merging.`);
  run("git", ["push", "-u", "origin", branch]);
  git("checkout", "main");
  const params = new URLSearchParams({ expand: "1", title, body: body.slice(0, 6000) });
  return `${repoWebUrl()}/compare/main...${encodeURIComponent(branch)}?${params}`;
}

async function main() {
  const date = new Date().toISOString().slice(0, 10);
  const prLinks = [];

  heading("1. Syncing with GitHub");
  if (git("branch", "--show-current").out !== "main") git("checkout", "main");
  if (git("status", "--porcelain", "--untracked-files=no").out) {
    throw new Error("You have uncommitted changes to tracked files. Commit or stash them, then run this again.");
  }
  run("git", ["pull", "--ff-only"]);

  heading("2. Checking every source page (solve any CAPTCHA that pops up)");
  script("check-sources.mjs", "--interactive");

  if (hasKey) {
    heading("3. Drafting updates for changed pages (Claude Haiku)");
    script("draft-updates.mjs");
  } else {
    console.log("\n(Skipping AI steps: no ANTHROPIC_API_KEY in .env.local.)");
  }

  heading("4. Saving snapshots");
  git("add", SNAPSHOTS);
  if (!run("git", ["diff", "--cached", "--quiet"], { allowFail: true, quiet: true }).ok) {
    git("commit", "-m", "Update source snapshots [skip ci]");
    run("git", ["push"]);
  } else {
    console.log("No snapshot changes.");
  }

  if (hasKey && readJson("scripts/.draft-summary.json")?.hasAnyChange) {
    const link = proposeOnBranch("data-check", `AI-drafted opportunity data updates (${date})`, "build-pr-body.mjs", "pr-body.md");
    if (link) prLinks.push(link);
  }

  if (hasKey) {
    heading("5. Looking for new opportunities (Claude Sonnet; solve any CAPTCHA)");
    script("discover-opportunities.mjs", "--interactive");
    if (readJson("scripts/.discovery-summary.json")?.hasAnyNew) {
      const link = proposeOnBranch(
        "new-opportunity",
        `New opportunities discovered (${date})`,
        "build-discovery-pr-body.mjs",
        "discovery-pr-body.md",
      );
      if (link) prLinks.push(link);
    }
  }

  heading("Done");
  if (prLinks.length) {
    console.log("Opening the review page(s) in your browser — check the changes, then click “Create pull request”:");
    for (const link of prLinks) {
      console.log(`  ${link.split("?")[0]}`);
      // rundll32 rather than `cmd /c start`: cmd would cut the URL at its first `&`.
      if (process.platform === "win32") spawnSync("rundll32", ["url.dll,FileProtocolHandler", link], { stdio: "ignore" });
    }
  } else {
    console.log("No data changes to review this week.");
  }
}

main().catch((error) => {
  console.error(`\n✗ ${error.message}`);
  process.exitCode = 1;
});
