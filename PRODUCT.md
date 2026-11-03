# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: UK Year 12 students (16–17) curious about studying Economics at university.** They browse on their own, mostly on phones, often without a teacher or parent steering them. Many don't yet know what's out there beyond the classroom, and some are from schools with little support for applications. Their job: find one or two things worth doing this year (a competition, a taster, a lecture, work experience) and know whether they can take part and when to act.

**Secondary: teachers and careers staff.** Reached through the "For teachers" page and the "send to your teacher" message students copy. Their job: decide whether an opportunity that needs a school nomination, registration or booking is worth the department's time.

## Product Purpose

A planner of real, checked opportunities beyond the classroom for Year 12 Economics students, organised by when you can act: open now, coming soon, and a watchlist of things likely to return. Success is a student finding something they can actually do, understanding who it's for and what it costs, and acting before the deadline.

## Positioning

- **Checked, not scraped.** Every entry links to its official organiser page and shows when it was last checked. Confirmed dates and "based on last cycle, not confirmed" estimates are always labelled separately; nothing is invented.
- **Live, not stale.** Open / coming soon / closed is recalculated from today's date on every visit, and a weekly human-supervised check (with AI-drafted updates reviewed before merging) keeps sources fresh.
- **Free first.** Free opportunities are ordered first, then unknown cost, then paid.
- **Economics-only and Year 12-specific**, rather than a general "opportunities for students" list.

## Operating Context

- Students browse in short sessions on phones; tabs for Open now / Coming soon / Watchlist, optional filters (free, online, location, category), an academic-year timeline (September–August), and a details dialog per opportunity with an "Apply" link.
- "Remind me" saves a choice on the device only; no accounts, emails or notifications.
- "Send to your teacher" copies a short message with the official link to the clipboard for the student to paste themselves.
- Teacher page lists opportunities needing a nomination or school booking.
- Hosted on GitHub Pages as a static React + TypeScript + Vite + Tailwind site; no backend.

## Capabilities and Constraints

- Data lives in `src/data/opportunities.ts` (typed schema in `src/types/opportunity.ts`); statuses are derived live in `src/lib/opportunities.ts`.
- No external font or image services have been used so far; any new ones are a deliberate decision.
- Must stay honest about what the site does: no claims of notifications, accounts, personalised recommendations, or that an opportunity improves admissions chances.
- The product name "Your Economics Year" is the current name; whether it stays is undecided.

## Brand Commitments

None binding. The user has said the name, logo mark, colours, fonts and voice are all open to change. The current look and gentle, soft voice were judged "AI-made, no character or personality, too bland".

## Evidence on Hand

- ~36 real opportunities with official URLs and last-checked dates (`src/data/opportunities.ts`).
- No testimonials, user numbers, school partnerships, press or endorsements exist. Never fabricate them.

## Product Principles

1. **Truth over hype.** Every date, cost and eligibility fact is sourced and labelled with how certain it is.
2. **Act-ability first.** What can I do, can I take part, and by when — answered at a glance.
3. **Free and open by default.** Lower the barrier for students without connections or money.
4. **Respect the student.** Speak to a 16-year-old as a capable person, not a customer and not a child.
5. **Honest about limits.** Say plainly what the site doesn't do (no notifications, nothing sent automatically).

## Accessibility & Inclusion

Audience includes students from schools with less support; must work well on low-end phones and slow connections, keyboard and screen readers (existing skip link, native dialog, live regions should be kept). WCAG AA contrast as a floor.
