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
- `scripts/check-sources.mjs` — see "Keeping data fresh", below.

## Status is live, not hand-set

`ACADEMIC_YEAR` and a frozen "today" used to be hardcoded constants — meaning every card would keep showing as "Open Now" forever after its real deadline passed, until someone noticed and edited the data file by hand. That's fixed: `App.tsx` reads the real date once per load (`lib/clock.ts`), derives the current academic year from it, and recomputes every item's effective status from its actual dates (`effectiveStatus` in `lib/opportunities.ts`) before anything else touches the data. `REFERENCE_DATE` in `data/opportunities.ts` now only means "when this seed set was last verified" — a provenance fact, not "today".

This only ages items that have real dates. `watchlist` is always author-set (there's no confirmed date to compare against, by definition), and a rolling-enrollment item with no dates at all (e.g. Young Enterprise) keeps its authored status indefinitely, since there's nothing to derive from.

## Keeping data fresh

`npm run check-sources` fetches every opportunity's `officialUrl`, hashes its (roughly normalised) text, and compares it against a snapshot from the last run (`scripts/source-snapshots.json`, committed so comparisons persist across sessions). It flags pages that look different since last time — a cheap signal to go re-verify that entry — and separately flags URLs that return an error (a dead link needs fixing regardless of whether the content "changed"). It found and fixed one real dead link during development: an Aon job-board posting that had been taken down after its cycle closed, replaced with Aon's stable programme hub page.

This is deliberately not a scraper: it never reads a date out of a page or touches `opportunities.ts` itself, only tells you where to look. A handful of university sites (london.ac.uk, ucl.ac.uk, stem.org.uk) block automated requests entirely (403), so those always need a manual check — the script can't help there, and says so.

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
