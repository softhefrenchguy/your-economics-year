# Your Economics Year

A focused MVP for UK Year 12 students exploring Economics at university. Built with React, TypeScript, Vite and Tailwind CSS. This is a standalone project; the existing cleaning-business application in the parent directory is unchanged.

## Run locally

Requires Node.js 22.12+ and npm.

```sh
cd economics-year
npm install
npm run dev
```

Open the local address printed by Vite.

```sh
npm run check
npm test
npm run build
npm run preview
npm run check-sources
```

## Structure

- `src/types/opportunity.ts` — typed opportunity schema, including `DateConfidence` (`confirmed` / `previous-cycle` / `expected`) and an optional `PreviousCycle` block for honest, non-fabricated forward-looking dates.
- `src/data/opportunities.ts` — verified real opportunities for the September 2026–August 2027 academic year, each with a real `officialUrl` and `sourceLastChecked`.
- `src/lib/clock.ts` — the one impure "what's today" read in the app (local calendar date), isolated so `lib/opportunities.ts` stays pure.
- `src/lib/opportunities.ts` — pure filtering, categorisation, sorting, timeline-placement and live-status-derivation functions, with tests. `effectiveStatus`/`withEffectiveStatus` age a stored `open`/`coming-soon`/`closed` status against real dates every time the app loads, so nobody has to hand-edit status fields as deadlines pass — see "Status is live", below.
- `src/components/` — reusable filters, opportunity cards, accessible native details dialog, academic-year timeline and the teacher-facing page.
- `src/lib/reminders.ts` — replaceable local-storage adapter that stores reminder intent only.
- `src/App.tsx` — page composition and UI state.
- `src/styles.css` — responsive visual styles and Tailwind directives.
- `scripts/check-sources.mjs`, `scripts/draft-updates.mjs`, `scripts/build-pr-body.mjs` — see "Keeping data fresh", below.
- `scripts/discover-opportunities.mjs`, `scripts/build-discovery-pr-body.mjs` — see "Discovering new opportunities", below.

## Status is live, not hand-set

`ACADEMIC_YEAR` and a frozen "today" used to be hardcoded constants — meaning every card would keep showing as "Open Now" forever after its real deadline passed, until someone noticed and edited the data file by hand. That's fixed: `App.tsx` reads the real date once per load (`lib/clock.ts`), derives the current academic year from it, and recomputes every item's effective status from its actual dates (`effectiveStatus` in `lib/opportunities.ts`) before anything else touches the data. `REFERENCE_DATE` in `data/opportunities.ts` now only means "when this seed set was last verified" — a provenance fact, not "today".

This only ages items that have real dates. `watchlist` is always author-set (there's no confirmed date to compare against, by definition), and a rolling-enrollment item with no dates at all (e.g. Young Enterprise) keeps its authored status indefinitely, since there's nothing to derive from.

## Keeping data fresh

`npm run check-sources` fetches every opportunity's `officialUrl` with a real headless Chromium (Playwright — an ordinary browser engine, not a spoofed or fingerprint-evaded one) and compares its rendered text against a snapshot from the last run (`scripts/source-snapshots.json`, committed so comparisons persist across sessions). It flags pages that look different since last time, and separately flags URLs that error out (a dead link needs fixing regardless of whether content "changed"). It found and fixed one real dead link during development: an Aon job-board posting taken down after its cycle closed, replaced with Aon's stable programme hub page.

This deliberately does not try to defeat sites that block automation — no proxies, no fingerprint spoofing, no CAPTCHA-solving. A block is reported as "couldn't check", not worked around. A handful of sites (london.ac.uk, ucl.ac.uk, stem.org.uk) block it outright and always need a manual check. Note the headless browser isn't a strict improvement over a plain fetch either — Bristol's WP page blocks the browser while it allowed a plain fetch, so which approach gets through varies per site.

**`npm run draft-updates`** goes one step further: for every source `check-sources` just flagged as changed, it hands the current data entry plus the freshly fetched page text to Claude Haiku and asks it to propose specific field updates (dates, status, cost) as strict structured output — never free-form file edits. The page text is untrusted third-party content, so the model is explicitly told to treat it as data, never as instructions, and every proposed value is independently regex/enum-validated here before being applied; anything that doesn't validate cleanly is dropped. Applying a patch is careful about exact indentation so it can't confuse a top-level field with a same-named one nested in `previousCycle` (see the comment in `applyPatch`). Nothing is ever merged automatically — `.github/workflows/check-sources.yml` opens a pull request labelled `ai-drafted` with each proposal's summary, confidence and a supporting quote from the source page, for a human to check against the diff and merge or close.

Requires an `ANTHROPIC_API_KEY` repository secret (Settings → Secrets and variables → Actions → New repository secret, or `gh secret set ANTHROPIC_API_KEY` from your own terminal — never paste the key into chat or a commit). Cost is small: this only runs on sources actually flagged changed, each call is a few thousand input tokens against Haiku 4.5 (~$1/$5 per MTok), so a few cents a month in the realistic case.

`.github/workflows/check-sources.yml` runs both scripts automatically every Monday (and on demand via the Actions tab). Anything `check-sources` flags — changed or erroring — also opens/updates a GitHub issue labelled `data-check`, so a source with no clean AI-provable change (or one of the always-blocked sites) still surfaces for a manual look instead of silently waiting for someone to remember to check.

## Discovering new opportunities

**`npm run discover-opportunities`** automates the research-and-verify loop this project's data was originally built with by hand: it scans a small set of known hub/listing pages (`HUB_SOURCES` in the script — currently Discover Economics' events page, LSE Economics' public lectures page, and the University of London taster-courses page) for opportunities not yet tracked, and drafts full entries for the ones it judges genuinely relevant.

This is a materially bigger judgment call than `draft-updates` — deciding whether something is a good fit and writing several paragraphs of description, eligibility and relevance, rather than patching one date field — so it runs on Claude Sonnet 5, not Haiku, and every candidate is capped (`MAX_CANDIDATES_PER_HUB`, `MAX_NEW_ENTRIES_PER_RUN`) to keep review batches small and cost bounded. The same rules as `draft-updates` apply: fetched text is untrusted and the model is told so explicitly, a candidate with no real supporting date is dropped rather than guessed at, and the model can decline outright (`isRelevant: false`) — declines are recorded in the PR body's "considered but not added" section, not silently discarded, so a human can see what was rejected and why.

New entries are generated as plain object literals (`JSON.stringify` with the quotes stripped from keys — valid TS either way, since JSON object syntax is a subset of it) and inserted before the closing `];`, then the whole file must still pass `tsc --noEmit` before anything is committed — same safety gate as `draft-updates`. They land in their own pull request, labelled `new-opportunity`, kept separate from the update-drafting PR since "is this a good addition" is a different review question from "did this date change correctly."

Uses the same `ANTHROPIC_API_KEY` secret as `draft-updates`. Cost is still small in absolute terms but higher per run than the update check — worst case (every hub maxes out its candidate cap without adding anything) is roughly 15–20 Sonnet calls a run, each a few thousand tokens; comfortably inside a modest monthly workspace cap, but worth knowing it's not as cheap as the Haiku-based update check.

## MVP behaviour

The opening page offers a free taster with no teacher registration as an approachable starting point, selected from open opportunities. It is a general suggestion, not a personalised recommendation. Browsing initially shows two opportunities; "Show more" reveals the rest. Changing a filter or timing tab resets the list to two. Filters sit in an optional disclosure, with the active filter count visible when collapsed. Cards summarise the benefit, eligibility, cost and next action; full descriptions remain in the details dialog.

Open now, Coming soon and Watchlist are separate timing views. Free opportunities are ordered first, then unknown-cost, then paid; within each tier, by the next relevant deadline or opening. Filter groups intersect; multiple category selections match any of those categories. University includes university programmes, tasters and summer schools. Online means fully online, excluding hybrid programmes.

The timeline covers all twelve academic-year months, displaying confirmed application openings, deadlines and event starts/ends. Watchlist and coming-soon entries never contribute a date directly — the timeline only ever shows their `previousCycle` dates (when one is on record), shifted into the current academic year and clearly labelled "based on last cycle, not confirmed". An item with no previous-cycle evidence at all simply doesn't appear on the timeline rather than guessing a month.

Teacher actions copy a short message (with the official link) to the clipboard for the student to paste into an email, message or form themselves; nothing is sent automatically.

Reminder buttons save/remove IDs in local storage. No email, push notification, account, backend or background monitoring exists. Storage errors fall back to session state and are explained in the UI. Replace the `ReminderStore` adapter and adjust the UI wording when implementing real notifications later.

## Data honesty

Every record's `officialUrl` and `sourceLastChecked` are real. Where a provider hasn't published next-cycle dates:

- If real dates exist from a documented previous cycle, they're stored in `previousCycle` and shown only as historical context ("based on last cycle, not confirmed") — never as if they were upcoming.
- Otherwise, `expectedWindow` holds a plain-text note (e.g. "Returning in 2027 · exact dates not yet announced") with no invented date.

`dateConfidence` records which of the two situations applies, and `lib/opportunities.test.ts` includes a critical regression test asserting that a stale date on a watchlist/coming-soon item can never be surfaced as an upcoming one, even if the field is still technically present on the record.

Re-verify every entry against its `officialUrl` periodically — `npm run check-sources` (see above) tells you which ones have likely changed since last time, but it can't read the page for you. No scraping, paid APIs, AI features or external font/image services are used yet; see the product spec for the planned direction (a monitored-source pipeline with human review before publish).
