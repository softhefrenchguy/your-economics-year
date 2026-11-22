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
//     usually doesn't ask again next week. Cloudflare checks loop forever on an automated
//     browser, so those skip the wait: if one doesn't clear by itself within a few seconds,
//     the page opens in the person's own browser for copy-paste — see manualCopy below.
//     A plain 404/410 is reported as a dead link (never copy-pasted, see source-health.mjs).
import { execFile } from "node:child_process";
import { readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import {
  forgetHost,
  isRefusalStatus,
  loadOwnBrowserHosts,
  rememberHost,
  saveOwnBrowserHosts,
  straightToOwnBrowser,
} from "./own-browser-hosts.mjs";

export const NAV_TIMEOUT_MS = 30000;
const HUMAN_WAIT_MS = 10 * 60 * 1000;
const POLL_MS = 2000;
const CLOUDFLARE_SELF_CLEAR_MS = 8000;

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

// Cloudflare's "Just a moment…" check loops forever in a Playwright-driven browser however
// many times a person clicks it, so in interactive mode it skips waiting in the bot's window
// and goes straight to copy-paste from the person's own browser.
export async function isCloudflareChallenge(page, response) {
  if (response?.headers()["cf-mitigated"] === "challenge") return true;
  if (page.frames().some((frame) => /challenges\.cloudflare\.com/i.test(frame.url()))) return true;
  try {
    const title = (await page.title()).toLowerCase();
    return title.includes("just a moment") || title.includes("attention required! | cloudflare");
  } catch {
    return false;
  }
}

// Sites that refused the bot's browser (a Cloudflare check, a CAPTCHA nobody could pass in
// its window, a 403), in this run or an earlier one: their other pages go straight to
// copy-paste rather than loading in the bot's window and asking again for every page.
// See own-browser-hosts.mjs.
const ownBrowserHosts = isInteractive ? loadOwnBrowserHosts() : {};

// A link that's gone, as opposed to a site refusing the bot: no point copy-pasting it, and
// no point trying it again next week (see source-health.mjs). DNS failures deliberately
// aren't here — your own internet dropping would mark every site dead at once.
const DEAD_STATUSES = new Set([404, 410]);

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
  console.log(`   If it keeps looping, click "No" on the pop-up to open it in your own browser instead.\n`);
  let chose = false;
  if (process.platform !== "win32") return { choseCopyPaste: () => false, dismiss: () => {} };
  // An always-on-top message box plus a sound. (A Windows toast notification was tried first,
  // but it silently didn't appear on this machine and Focus/Do Not Disturb can hide toasts.)
  const ps = `
[System.Media.SystemSounds]::Exclamation.Play()
Add-Type -AssemblyName System.Windows.Forms
$owner = New-Object System.Windows.Forms.Form -Property @{ TopMost = $true }
$msg = "$($env:YEY_HOST) needs a human check.\`n\`nSwitch to the Edge window and complete it. The weekly check waits up to 10 minutes.\`n\`nYes = I'll do it in the Edge window.\`nNo = it keeps restarting, open it in my own browser instead (the bot copies it from there)."
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
// matter what (Cloudflare). The page opens in the person's own normal browser — not driven by
// Playwright — and the copied text is checked exactly as if the bot had loaded it.
//
// The bot does the copying itself: it finds that browser window, brings it to the front and
// presses Ctrl+A, Ctrl+C every few seconds until the clipboard holds the real page (not the
// "Just a moment…" check, and the same length twice running, so a half-loaded page isn't
// taken). All the person does is tick the check box if Cloudflare shows one. Keys are only
// sent while that browser window is confirmed in front, so they can never land in another
// app. Afterwards it closes the tab it opened and puts the person's clipboard text back.
// If it can't find the window or get the page within AUTO_COPY_SECONDS, it falls back to
// asking the person to copy it by hand (OK/Cancel pop-up). Nothing is spoofed or bypassed:
// a real person's real browser loads the page.
const MIN_COPIED_CHARS = 300;
const AUTO_COPY_SECONDS = 180;
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
    console.log(`   Opening it in your normal browser — the bot will copy the page from there itself.`);
    console.log(`   If it shows a "verify you are human" box, tick it. Please don't type in that window meanwhile.\n`);
    // URL, host, reason and output path go in through environment variables, never spliced
    // into the script text, so nothing from a web page can run as PowerShell.
    const ps = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class YeyWin {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr h, int cmd);
  [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] static extern bool AttachThreadInput(uint a, uint b, bool attach);
  [DllImport("kernel32.dll")] static extern uint GetCurrentThreadId();
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr h, System.Text.StringBuilder s, int n);
  public static string Title(IntPtr h) { var s = new System.Text.StringBuilder(512); GetWindowText(h, s, 512); return s.ToString(); }
  public static uint ProcessOf(IntPtr h) { uint pid; GetWindowThreadProcessId(h, out pid); return pid; }
  public static bool Focus(IntPtr h) {
    IntPtr fgWin = GetForegroundWindow();
    if (fgWin == h) return true;
    if (IsIconic(h)) ShowWindow(h, 9);
    uint ignored;
    uint fg = GetWindowThreadProcessId(fgWin, out ignored);
    uint me = GetCurrentThreadId();
    AttachThreadInput(me, fg, true);
    SetForegroundWindow(h);
    AttachThreadInput(me, fg, false);
    return GetForegroundWindow() == h;
  }
}
"@
$browsers = @("msedge", "chrome", "firefox", "brave", "opera", "vivaldi", "arc")
$markers = $env:YEY_MARKERS -split "\`n"
$original = $null
if ([System.Windows.Forms.Clipboard]::ContainsText()) { $original = [System.Windows.Forms.Clipboard]::GetText() }
function Restore-Clipboard {
  if ($original) { [System.Windows.Forms.Clipboard]::SetText($original) } else { [System.Windows.Forms.Clipboard]::Clear() }
}
function Get-BrowserWindow {
  $h = [YeyWin]::GetForegroundWindow()
  try {
    $p = Get-Process -Id ([YeyWin]::ProcessOf($h)) -ErrorAction Stop
    if ($browsers -contains $p.ProcessName.ToLower()) { return $h }
  } catch {}
  return [IntPtr]::Zero
}
# Closes the tab this opened with Ctrl+W, and checks it worked: the window's title changes
# (another tab is showing) or the window goes away (it was the only tab). Keys are only sent
# while that window is in front, so a Ctrl+W can't close something in another app.
function Close-OpenedTab($w) {
  if ($w -eq [IntPtr]::Zero) { return }
  $title = [YeyWin]::Title($w)
  for ($try = 0; $try -lt 3; $try++) {
    if (-not [YeyWin]::IsWindow($w)) { return }
    if ([YeyWin]::Title($w) -ne $title) { return }
    if (-not [YeyWin]::Focus($w)) { Start-Sleep -Milliseconds 500; continue }
    [System.Windows.Forms.SendKeys]::SendWait("{ESC}")
    [System.Windows.Forms.SendKeys]::SendWait("^w")
    Start-Sleep -Milliseconds 800
  }
}

[System.Windows.Forms.Clipboard]::Clear()
Start-Process $env:YEY_URL
[System.Media.SystemSounds]::Asterisk.Play()

# The browser comes to the front when it opens the link; that's the window to copy from.
$win = [IntPtr]::Zero
for ($i = 0; $i -lt 20 -and $win -eq [IntPtr]::Zero; $i++) { Start-Sleep -Milliseconds 500; $win = Get-BrowserWindow }

$text = $null
$html = ""
$mode = "auto"
if ($win -ne [IntPtr]::Zero) {
  $deadline = (Get-Date).AddSeconds([int]$env:YEY_AUTO_SECONDS)
  $prevLength = -1
  while ((Get-Date) -lt $deadline -and [YeyWin]::IsWindow($win)) {
    Start-Sleep -Seconds 3
    if (-not [YeyWin]::Focus($win)) { continue }
    [System.Windows.Forms.Clipboard]::Clear()
    [System.Windows.Forms.SendKeys]::SendWait("^a")
    Start-Sleep -Milliseconds 300
    if ([YeyWin]::GetForegroundWindow() -ne $win) { continue }
    [System.Windows.Forms.SendKeys]::SendWait("^c")
    Start-Sleep -Milliseconds 700
    $copy = [System.Windows.Forms.Clipboard]::GetText([System.Windows.Forms.TextDataFormat]::UnicodeText)
    $t = $copy.Trim()
    if ($t.Length -lt ${MIN_COPIED_CHARS}) {
      # One word or link copied means the address bar had focus, not the page: F6 moves on.
      if ($t.Length -gt 0 -and $t -notmatch '\\s') { [System.Windows.Forms.SendKeys]::SendWait("{F6}") }
      $prevLength = -1
      continue
    }
    $lower = $t.ToLower()
    if ($t.Length -lt 2000 -and ($markers | Where-Object { $_ -and $lower.Contains($_) })) { $prevLength = -1; continue }
    # Still loading if it grew since the last copy: wait for two copies of the same length.
    if ([Math]::Abs($t.Length - $prevLength) -gt [Math]::Max(20, $t.Length * 0.01)) { $prevLength = $t.Length; continue }
    $text = $copy
    $html = [System.Windows.Forms.Clipboard]::GetText([System.Windows.Forms.TextDataFormat]::Html)
    Close-OpenedTab $win
    break
  }
}

if ($null -eq $text) {
  # Couldn't do it automatically (no browser window found, or the page never came through).
  $mode = "manual"
  [System.Windows.Forms.Clipboard]::Clear()
  [System.Media.SystemSounds]::Exclamation.Play()
  $owner = New-Object System.Windows.Forms.Form -Property @{ TopMost = $true }
  $msg = "The bot couldn't copy $($env:YEY_HOST) by itself.\`n\`nIn the browser tab it opened:\`n\`n   1. Wait for the page to load (do any check it asks for)\`n   2. Click on the page, press Ctrl+A, then Ctrl+C\`n   3. Click OK here\`n\`nClick Cancel to skip this site."
  $tries = 0
  while ($true) {
    $r = [System.Windows.Forms.MessageBox]::Show($owner, $msg, "Your Economics Year: copy this page", "OKCancel", "Information")
    if ($r -ne "OK") { Restore-Clipboard; exit 2 }
    $text = [System.Windows.Forms.Clipboard]::GetText([System.Windows.Forms.TextDataFormat]::UnicodeText)
    $tries++
    if ($text.Trim().Length -ge ${MIN_COPIED_CHARS} -or $tries -ge 3) { break }
    [System.Media.SystemSounds]::Exclamation.Play()
    $msg = "That copy only had $($text.Trim().Length) characters, so it probably copied the address bar, not the page.\`n\`n   1. Click in the middle of the page itself\`n   2. Press Ctrl+A, then Ctrl+C\`n   3. Click OK here\`n\`nClick Cancel to skip this site."
  }
  $html = [System.Windows.Forms.Clipboard]::GetText([System.Windows.Forms.TextDataFormat]::Html)
  Close-OpenedTab $win
}
Restore-Clipboard
$json = @{ text = $text; html = $html; mode = $mode } | ConvertTo-Json -Compress
[IO.File]::WriteAllText($env:YEY_OUT, $json, (New-Object System.Text.UTF8Encoding($false)))`;
    runPowerShell(
      ps,
      {
        YEY_URL: parsed.href,
        YEY_HOST: parsed.hostname,
        YEY_REASON: reason,
        YEY_OUT: outFile,
        YEY_MARKERS: CHALLENGE_TEXT.join("\n"),
        YEY_AUTO_SECONDS: String(AUTO_COPY_SECONDS),
      },
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
          return resolve({ ok: false, status: 404, dead: true, error: "page not found (404) — the link is dead, the entry needs a new URL" });
        console.log(`   ✓ Got ${text.length} characters ${copied.mode === "manual" ? "from your copy" : "from your browser"} — carrying on.\n`);
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
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    // manualCopy reports the bad URL below
  }
  const today = new Date().toISOString().slice(0, 10);
  if (isInteractive) {
    const known = straightToOwnBrowser(ownBrowserHosts, host, today);
    if (known) return manualCopy(url, known.reason);
  }
  const page = await context.newPage();
  let fallbackReason = null;
  // True when the bot was refused as a browser (a bot check, a 403), as opposed to a page
  // that's merely broken: only then do the site's other pages skip the bot's window.
  let siteRefusedBot = false;
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS });
    const status = response?.status() ?? 0;
    // Some challenges (e.g. Cloudflare's) render a moment after the first paint.
    await page.waitForTimeout(1000);
    let cloudflare = isInteractive && (await isCloudflareChallenge(page, response));
    // With the persistent profile's cookies, Cloudflare's "Just a moment…" often clears by
    // itself within a few seconds (no click needed); only hand over to the person if it doesn't.
    for (let waited = 0; cloudflare && waited < CLOUDFLARE_SELF_CLEAR_MS; waited += POLL_MS) {
      await page.waitForTimeout(POLL_MS).catch(() => {});
      if (!(await looksBlocked(page))) cloudflare = false;
    }
    if (cloudflare) {
      // Remembered straight away, even if the copy below gets skipped: it can never clear here.
      rememberHost(ownBrowserHosts, host, "Cloudflare check", today);
      saveOwnBrowserHosts(ownBrowserHosts);
      fallbackReason = "Cloudflare check";
    } else if (DEAD_STATUSES.has(status) && !(await looksBlocked(page))) {
      return { ok: false, status, dead: true, error: `HTTP ${status} — the link is dead, the entry needs a new URL` };
    } else if (await looksBlocked(page)) {
      if (!isInteractive) return { ok: false, status, blocked: true, error: `bot check / CAPTCHA (HTTP ${status})` };
      const outcome = await waitForHuman(page, url);
      if (outcome !== "passed") {
        siteRefusedBot = true;
        fallbackReason =
          outcome === "copy" ? "you chose copy-paste" : outcome === "skipped" ? "bot check kept looping" : "bot check not completed in time";
      }
    } else if (!response || status >= 400) {
      // An error/denial page with no human check on it. Headless: report it. Interactive:
      // the site may just be refusing automated browsers, so offer copy-paste.
      if (!isInteractive) return { ok: false, status, error: `HTTP ${status || "no response"}` };
      siteRefusedBot = isRefusalStatus(status);
      fallbackReason = `HTTP ${status || "no response"}`;
    }
    if (!fallbackReason) {
      // The bot got in by itself (or the person passed the check in its window), so a site
      // remembered from an earlier run no longer needs the person's browser.
      if (isInteractive && forgetHost(ownBrowserHosts, host)) saveOwnBrowserHosts(ownBrowserHosts);
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
  const copied = await manualCopy(url, fallbackReason);
  // Only once the person's browser has actually got the page: then the rest of this site's
  // pages go straight there, this run and on later Sundays, with no pop-up per page.
  if (siteRefusedBot && copied.ok) {
    rememberHost(ownBrowserHosts, host, fallbackReason, today);
    saveOwnBrowserHosts(ownBrowserHosts);
    console.log(`   (${host} pages now open straight in your browser — no more pop-ups for this site.)\n`);
  }
  return copied;
}
