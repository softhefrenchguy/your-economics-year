// Shared page-loading for check-sources.mjs and discover-opportunities.mjs.
//
// Two modes:
//   - Headless (default, and what CI uses): an ordinary headless Chromium. A CAPTCHA or bot
//     wall is reported as "blocked" and skipped — never worked around.
//   - Interactive (`--interactive`, used by `npm run weekly` on a real PC with a person at
//     it): a visible Microsoft Edge window with a persistent profile. When a page shows a
//     CAPTCHA/bot check, the script alerts the person (Windows notification + sound), brings
//     the window to the front and WAITS for the human to complete the check themselves.
//     Nothing here solves, bypasses or spoofs anything — a real person passes the check in a
//     real browser, exactly as they would browsing by hand. The persistent profile just keeps
//     the resulting cookies, the same way a normal browser remembers them, so the same site
//     usually doesn't ask again next week.
import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

export const NAV_TIMEOUT_MS = 30000;
const HUMAN_WAIT_MS = 10 * 60 * 1000;
const POLL_MS = 2000;

export const isInteractive = process.argv.includes("--interactive");

// Kept outside the repo (and outside OneDrive, which mangles browser profile files mid-sync).
const profileDir = path.join(
  process.env.LOCALAPPDATA ?? path.join(os.homedir(), ".cache"),
  "your-economics-year",
  "browser-profile",
);

export async function openBrowser() {
  if (!isInteractive) {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    return { context, close: () => browser.close() };
  }
  let context;
  try {
    context = await chromium.launchPersistentContext(profileDir, {
      channel: "msedge",
      headless: false,
      viewport: null,
    });
  } catch {
    // Edge missing (non-Windows machine): fall back to Playwright's own Chromium, still visible.
    context = await chromium.launchPersistentContext(profileDir, { headless: false, viewport: null });
  }
  return { context, close: () => context.close() };
}

const CHALLENGE_FRAME_RE =
  /challenges\.cloudflare\.com|google\.com\/recaptcha|recaptcha\.net|hcaptcha\.com|captcha-delivery\.com|geo\.captcha|arkoselabs|funcaptcha/i;
const CHALLENGE_TEXT = [
  "just a moment",
  "attention required",
  "verify you are human",
  "verifying you are human",
  "checking your browser",
  "checking if the site connection is secure",
  "are you a robot",
  "i'm not a robot",
  "complete the security check",
  "press & hold",
  "please enable js and disable any ad blocker",
  "request unsuccessful. incapsula",
  "pardon our interruption",
];

// Heuristic: a known challenge iframe, or a short page whose title/text reads like a bot
// check. Long, real pages that merely mention "captcha" in a footer aren't flagged.
export async function looksBlocked(page) {
  if (page.frames().some((frame) => CHALLENGE_FRAME_RE.test(frame.url()))) return true;
  let title = "";
  let text = "";
  try {
    title = (await page.title()).toLowerCase();
    text = (await page.evaluate(() => document.body?.innerText ?? "")).toLowerCase();
  } catch {
    return false; // mid-navigation; the caller polls again
  }
  if (CHALLENGE_TEXT.some((marker) => title.includes(marker))) return true;
  return text.length < 2000 && CHALLENGE_TEXT.some((marker) => text.includes(marker));
}

function alertHuman(url) {
  const host = new URL(url).hostname;
  console.log(`\n🔔 ${host} is asking for a human check. Complete it in the browser window.`);
  console.log(`   Waiting up to ${HUMAN_WAIT_MS / 60000} minutes. Close that tab to skip this site.\n`);
  if (process.platform !== "win32") return;
  // An always-on-top message box plus a sound. (A Windows toast notification was tried first,
  // but it silently didn't appear on this machine and Focus/Do Not Disturb can hide toasts.)
  // Fire-and-forget in its own process: the run keeps polling whether or not OK is clicked,
  // and a failed alert must never stop the run.
  const safeHost = host.replace(/[^a-z0-9.-]/gi, "");
  const ps = `
[System.Media.SystemSounds]::Exclamation.Play()
Add-Type -AssemblyName System.Windows.Forms
$owner = New-Object System.Windows.Forms.Form -Property @{ TopMost = $true }
[System.Windows.Forms.MessageBox]::Show($owner, "${safeHost} needs a human check.\`n\`nSwitch to the Edge window and complete it. The weekly check is waiting for you (up to 10 minutes).", "Your Economics Year: CAPTCHA to solve", "OK", "Warning") | Out-Null`;
  const child = execFile("powershell.exe", ["-NoProfile", "-WindowStyle", "Hidden", "-Command", ps], () => {});
  child.unref();
}

async function waitForHuman(page, url) {
  alertHuman(url);
  await page.bringToFront().catch(() => {});
  const deadline = Date.now() + HUMAN_WAIT_MS;
  while (Date.now() < deadline) {
    if (page.isClosed()) return "skipped";
    await page.waitForTimeout(POLL_MS).catch(() => {});
    if (page.isClosed()) return "skipped";
    // After a solve the site usually redirects to the real page, so judge by content.
    if (!(await looksBlocked(page))) {
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await page.waitForTimeout(1500).catch(() => {});
      if (!(await looksBlocked(page))) {
        console.log("   ✓ Thanks — check passed, carrying on.\n");
        return "passed";
      }
    }
  }
  return "timeout";
}

// Loads a page and returns its rendered text and links. In interactive mode a bot check
// pauses for the human; in headless mode it's reported as blocked.
export async function visit(context, url) {
  const page = await context.newPage();
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS });
    const status = response?.status() ?? 0;
    // Some challenges (e.g. Cloudflare's) render a moment after the first paint.
    await page.waitForTimeout(1000);
    if (await looksBlocked(page)) {
      if (!isInteractive) return { ok: false, status, blocked: true, error: `bot check / CAPTCHA (HTTP ${status})` };
      const outcome = await waitForHuman(page, url);
      if (outcome !== "passed")
        return { ok: false, status, blocked: true, error: outcome === "skipped" ? "skipped by you" : "bot check not completed in time" };
    } else if (!response || status >= 400) {
      // A plain error/denial page with no human check on it — nothing a person can solve.
      return { ok: false, status, error: `HTTP ${status || "no response"}` };
    }
    const text = await page.evaluate(() => document.body?.innerText ?? "");
    const links = await page.$$eval("a[href]", (anchors) =>
      anchors
        .map((a) => ({ text: (a.textContent ?? "").trim(), href: a.href }))
        .filter((l) => l.text && l.href.startsWith("http")),
    );
    return { ok: true, status, text, links };
  } catch (error) {
    return { ok: false, status: 0, error: error instanceof Error ? error.message : String(error) };
  } finally {
    if (!page.isClosed()) await page.close().catch(() => {});
  }
}
