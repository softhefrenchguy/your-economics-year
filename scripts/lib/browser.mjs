// Shared page-loading for check-sources.mjs and discover-opportunities.mjs.
//
// Two modes:
//   - Headless (default, and what CI uses): an ordinary headless Chromium. A CAPTCHA or bot
//     wall is reported as "blocked" and skipped — never worked around.
//   - Interactive (`--interactive`, used by `npm run weekly` on a real PC with a person at
//     it): a visible Microsoft Edge window with a persistent profile. When a page shows a
//     CAPTCHA/bot check, the script alerts the person (always-on-top pop-up + sound), brings
//     the window to the front and WAITS for the human to complete the check themselves.
//     Nothing here solves, bypasses or spoofs anything — a real person passes the check in a
//     real browser, exactly as they would browsing by hand. The persistent profile just keeps
//     the resulting cookies, the same way a normal browser remembers them, so the same site
//     usually doesn't ask again next week. If a site still won't let the bot's window through
//     (some Cloudflare checks loop forever on an automated browser), it falls back to
//     copy-paste from the person's own browser — see manualCopy below.
import { execFile } from "node:child_process";
import { readFile, rm } from "node:fs/promises";
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

// Runs a PowerShell script for the pop-ups. Sent -EncodedCommand (base64 UTF-16LE), not as
// a plain -Command argument: Windows strips the double quotes out of a plain argument,
// which silently broke these scripts. Untrusted values (URLs, hosts) go in through
// environment variables, never spliced into the script text.
function runPowerShell(script, env, options, callback) {
  const encoded = Buffer.from(script, "utf16le").toString("base64");
  return execFile(
    "powershell.exe",
    ["-NoProfile", "-STA", "-WindowStyle", "Hidden", "-EncodedCommand", encoded],
    { ...options, env: { ...process.env, ...env } },
    callback,
  );
}

const CHOSE_COPY_PASTE = 3;
// Returns { choseCopyPaste(), dismiss() }. The pop-up is non-blocking for the run: polling
// continues whether or not it's answered, and a failed alert must never stop the run.
function alertHuman(url) {
  const host = new URL(url).hostname;
  console.log(`\n🔔 ${host} is asking for a human check. Complete it in the browser window.`);
  console.log(`   If it keeps looping, click "No" on the pop-up to use copy-paste instead.\n`);
  let chose = false;
  if (process.platform !== "win32") return { choseCopyPaste: () => false, dismiss: () => {} };
  // An always-on-top message box plus a sound. (A Windows toast notification was tried first,
  // but it silently didn't appear on this machine and Focus/Do Not Disturb can hide toasts.)
  const ps = `
[System.Media.SystemSounds]::Exclamation.Play()
Add-Type -AssemblyName System.Windows.Forms
$owner = New-Object System.Windows.Forms.Form -Property @{ TopMost = $true }
$msg = "$($env:YEY_HOST) needs a human check.\`n\`nSwitch to the Edge window and complete it. The weekly check waits up to 10 minutes.\`n\`nYes = I'll do it in the Edge window.\`nNo = it keeps restarting, let me copy-paste the page instead."
$r = [System.Windows.Forms.MessageBox]::Show($owner, $msg, "Your Economics Year: CAPTCHA to solve", "YesNo", "Warning")
if ($r -eq "No") { exit ${CHOSE_COPY_PASTE} }`;
  const child = runPowerShell(ps, { YEY_HOST: host }, {}, () => {});
  child.on("exit", (code) => {
    if (code === CHOSE_COPY_PASTE) chose = true;
  });
  child.unref();
  return {
    choseCopyPaste: () => chose,
    // Check passed: take down the now-stale pop-up.
    dismiss: () => {
      if (child.exitCode === null) child.kill();
    },
  };
}

async function waitForHuman(page, url) {
  const alert = alertHuman(url);
  await page.bringToFront().catch(() => {});
  const deadline = Date.now() + HUMAN_WAIT_MS;
  while (Date.now() < deadline) {
    if (alert.choseCopyPaste()) return "copy";
    if (page.isClosed()) return "skipped";
    await page.waitForTimeout(POLL_MS).catch(() => {});
    if (page.isClosed()) return "skipped";
    // After a solve the site usually redirects to the real page, so judge by content.
    if (!(await looksBlocked(page))) {
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await page.waitForTimeout(1500).catch(() => {});
      if (!(await looksBlocked(page))) {
        alert.dismiss();
        console.log("   ✓ Thanks — check passed, carrying on.\n");
        return "passed";
      }
    }
  }
  alert.dismiss();
  return "timeout";
}

// Copy-paste fallback, for sites whose bot check won't let an automated browser through no
// matter what. The page opens in the person's own normal browser — not driven by
// Playwright — they copy it (Ctrl+A, Ctrl+C) and click OK, and the copied text is checked
// exactly as if the bot had loaded it. The person reads the page as themselves; nothing is
// spoofed or bypassed.
const MIN_COPIED_CHARS = 300;
function manualCopy(url, reason) {
  return new Promise((resolve) => {
    const fail = (error) => resolve({ ok: false, status: 0, blocked: true, error });
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return fail(`${reason}; not a valid URL for copy-paste`);
    }
    // URLs can come from scraped hub pages: only ever hand the OS a plain web link.
    if (!/^https?:$/.test(parsed.protocol)) return fail(`${reason}; not a web link`);
    if (process.platform !== "win32") return fail(reason);
    const outFile = path.join(os.tmpdir(), `yey-clipboard-${process.pid}-${Date.now()}.json`);
    console.log(`\n📋 ${parsed.hostname} couldn't be loaded by the bot (${reason}).`);
    console.log(`   Opening it in your normal browser: press Ctrl+A, Ctrl+C there, then click OK on the pop-up.\n`);
    // URL, host, reason and output path go in through environment variables, never spliced
    // into the script text, so nothing from a web page can run as PowerShell.
    const ps = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.Clipboard]::Clear()
Start-Process $env:YEY_URL
[System.Media.SystemSounds]::Exclamation.Play()
$owner = New-Object System.Windows.Forms.Form -Property @{ TopMost = $true }
$msg = "The bot couldn't load $($env:YEY_HOST) ($($env:YEY_REASON)).\`n\`nIt has opened the page in your normal browser:\`n\`n   1. Wait for the page to load (do any check it asks for)\`n   2. Click on the page, press Ctrl+A, then Ctrl+C\`n   3. Click OK here\`n\`nClick Cancel to skip this site."
$tries = 0
while ($true) {
  $r = [System.Windows.Forms.MessageBox]::Show($owner, $msg, "Your Economics Year: copy this page", "OKCancel", "Information")
  if ($r -ne "OK") { exit 2 }
  $text = [System.Windows.Forms.Clipboard]::GetText([System.Windows.Forms.TextDataFormat]::UnicodeText)
  $tries++
  if ($text.Trim().Length -ge ${MIN_COPIED_CHARS} -or $tries -ge 3) { break }
  # Usual cause: the new tab opens with the cursor in the address bar, so Ctrl+A, Ctrl+C
  # copies just the URL. Ask again rather than failing the site.
  [System.Media.SystemSounds]::Exclamation.Play()
  $msg = "That copy only had $($text.Trim().Length) characters, so it probably copied the address bar, not the page.\`n\`n   1. Click in the middle of the page itself\`n   2. Press Ctrl+A, then Ctrl+C\`n   3. Click OK here\`n\`nClick Cancel to skip this site."
}
$html = [System.Windows.Forms.Clipboard]::GetText([System.Windows.Forms.TextDataFormat]::Html)
$json = @{ text = $text; html = $html } | ConvertTo-Json -Compress
[IO.File]::WriteAllText($env:YEY_OUT, $json, (New-Object System.Text.UTF8Encoding($false)))`;
    runPowerShell(
      ps,
      { YEY_URL: parsed.href, YEY_HOST: parsed.hostname, YEY_REASON: reason, YEY_OUT: outFile },
      { timeout: HUMAN_WAIT_MS, maxBuffer: 1024 * 1024 },
      async (error) => {
        if (error) return fail(error.code === 2 ? "skipped by you" : `${reason}; copy-paste not completed`);
        let copied;
        try {
          copied = JSON.parse(await readFile(outFile, "utf8"));
        } catch {
          return fail(`${reason}; couldn't read the clipboard`);
        } finally {
          rm(outFile, { force: true }).catch(() => {});
        }
        const text = String(copied.text ?? "");
        const lower = text.toLowerCase();
        if (text.trim().length < MIN_COPIED_CHARS)
          return fail(`${reason}; the copied text was empty or too short (did Ctrl+A, Ctrl+C work?)`);
        if (text.length < 2000 && CHALLENGE_TEXT.some((marker) => lower.includes(marker)))
          return fail(`${reason}; the copied page was still the bot check`);
        // A copy has no HTTP status, so a dead link has to be recognised from the words
        // (london.ac.uk shows "ERROR 404 – page not found" behind its Cloudflare check).
        if (/\b404\b|page not found|page could not be found|page you requested (does not|doesn.t) exist/.test(lower.slice(0, 1500)))
          return resolve({ ok: false, status: 404, error: "page not found (404) — the link is dead, the entry needs a new URL" });
        console.log(`   ✓ Got ${text.length} characters from your copy — carrying on.\n`);
        resolve({
          ok: true,
          status: 200,
          text,
          links: linksFromClipboardHtml(String(copied.html ?? ""), parsed.href),
          manual: true,
        });
      },
    );
  });
}

// Windows' clipboard HTML ("CF_HTML") starts with a header that includes SourceURL; links
// are resolved against it so relative hrefs still work for discover-opportunities.
function linksFromClipboardHtml(html, fallbackBase) {
  const base = /^SourceURL:(.+)$/m.exec(html)?.[1]?.trim() || fallbackBase;
  const links = [];
  for (const match of html.matchAll(/<a\b[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const text = match[2].replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
    try {
      const href = new URL(match[1].replace(/&amp;/g, "&"), base).href;
      if (text && href.startsWith("http")) links.push({ text, href });
    } catch {
      // unparseable href: skip it
    }
  }
  return links;
}

// Loads a page and returns its rendered text and links. In interactive mode a bot check
// pauses for the human, and if the bot's browser still can't get through, it falls back to
// copy-paste from the person's own browser. In headless mode it's reported as blocked.
export async function visit(context, url) {
  const page = await context.newPage();
  let fallbackReason = null;
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS });
    const status = response?.status() ?? 0;
    // Some challenges (e.g. Cloudflare's) render a moment after the first paint.
    await page.waitForTimeout(1000);
    if (await looksBlocked(page)) {
      if (!isInteractive) return { ok: false, status, blocked: true, error: `bot check / CAPTCHA (HTTP ${status})` };
      const outcome = await waitForHuman(page, url);
      if (outcome !== "passed")
        fallbackReason =
          outcome === "copy" ? "you chose copy-paste" : outcome === "skipped" ? "bot check kept looping" : "bot check not completed in time";
    } else if (!response || status >= 400) {
      // An error/denial page with no human check on it. Headless: report it. Interactive:
      // the site may just be refusing automated browsers, so offer copy-paste.
      if (!isInteractive) return { ok: false, status, error: `HTTP ${status || "no response"}` };
      fallbackReason = `HTTP ${status || "no response"}`;
    }
    if (!fallbackReason) {
      const text = await page.evaluate(() => document.body?.innerText ?? "");
      const links = await page.$$eval("a[href]", (anchors) =>
        anchors
          .map((a) => ({ text: (a.textContent ?? "").trim(), href: a.href }))
          .filter((l) => l.text && l.href.startsWith("http")),
      );
      return { ok: true, status, text, links };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
    if (!isInteractive) return { ok: false, status: 0, error: message };
    fallbackReason = message;
  } finally {
    if (!page.isClosed()) await page.close().catch(() => {});
  }
  return manualCopy(url, fallbackReason);
}
