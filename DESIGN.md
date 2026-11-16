---
name: Your Economics Year
description: Year 12 Economics opportunities as an annotated newspaper of the year.
colors:
  paper: "#fdfcf9"
  ink: "#16202f"
  ink-hover: "#2a3649"
  muted: "#5b6372"
  body: "#3b4352"
  rule: "#e6e2d8"
  rule-strong: "#d6d1c4"
  wash: "#f4f1ea"
  pen-red: "#c8102e"
  highlighter-yellow: "#ffe45c"
  highlighter-pink: "#ff9bd2"
  teacher-blue: "#1f4fb5"
  today: "#fff7e0"
  bar: "#cdc8ba"
  dash: "#8a8f99"
typography:
  headline:
    fontFamily: "Spectral, Georgia, serif"
    fontSize: "clamp(30px, 3.2vw, 42px)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.012em"
  page-title:
    fontFamily: "Spectral, Georgia, serif"
    fontSize: "clamp(34px, 5vw, 52px)"
    fontWeight: 800
    lineHeight: 1.04
  section:
    fontFamily: "Spectral, Georgia, serif"
    fontSize: "22px"
    fontWeight: 800
  title:
    fontFamily: "Spectral, Georgia, serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.22
  date:
    fontFamily: "Spectral, Georgia, serif"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: 1
  body:
    fontFamily: "Public Sans Variable, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "Public Sans Variable, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
  label:
    fontFamily: "Public Sans Variable, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.07em"
  pen:
    fontFamily: "Caveat, cursive"
    fontSize: "21px"
    fontWeight: 600
rounded:
  mark: "4px"
  control: "6px"
  field: "8px"
  pill: "16px"
spacing:
  gutter: "clamp(16px, 4vw, 40px)"
  listing: "15px"
  section-top: "26px"
components:
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    height: "42px"
    padding: "0 16px"
  button-ink-hover:
    backgroundColor: "{colors.ink-hover}"
  button-plain:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "42px"
    padding: "0 16px"
  toggle-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    height: "32px"
  search-field:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    height: "44px"
  chip:
    textColor: "{colors.ink}"
    rounded: "{rounded.mark}"
    height: "24px"
    padding: "0 8px"
---

# Design System: Your Economics Year

## Overview

**Creative North Star: "The Annotated Paper"**

The site reads like a good newspaper of your year that a clever friend has marked up for you. The structure is calm and official: a double-ruled masthead, serif headlines, hairline rules, and a chronological list where every listing leads with a big serif date. The character comes from the annotations on top: red pen notes in the margin ("you are here", "today!", "closes in 5 days"), a red circle round today's date, highlighter on one phrase per headline and on "free", and the occasional economics diagram joke drawn in the gutter.

It's honest by design. The headline is written from the data, and always from the whole tab, so a filter or a search never makes it untrue. The year chart counts only real dates, with confirmed dates as solid ink bars and last year's dates as dashed outlines. "Last year" is labelled everywhere it applies, and screen readers hear "not confirmed".

The paper has one urgent voice: the friend's red pen. Anything that needs attention (a deadline in the next fortnight, new dates, two things on the same day) is written by hand on the row it concerns. There are no alert boxes, no coloured stripes and no system-red text.

**Key Characteristics:**
- Warm white paper, near-black ink, hairline rules, a double rule under the masthead.
- Serif (Spectral) for the masthead, headlines, titles and big dates; Public Sans for everything read.
- Handwriting (Caveat) in pen red, for margin notes, countdowns and diagram jokes.
- Chronological sections: This week, Later in <month>, each later month, Any time. Your year opens with "Next two weeks".
- The data-driven year chart is the hero image; there are no photos.
- Dark mode follows the device: charcoal paper, cream ink, toned-down highlighters.

## Colors

Paper and ink, plus the stationery a student actually uses: a red pen and two highlighters. Nothing else gets a colour; in particular, kinds of thing (talks, competitions, courses, work) are words, not colours.

### Primary
- **Ink** (`ink`): text, the kind word that starts each meta line, the active tab and kind underline, the current month's chart bar, primary buttons, switched-on filters, saved state.

### Secondary
- **Pen Red** (`pen-red`): handwritten notes (margin notes, "closes in 5 days", "new dates!", "tomorrow!"), the circle round today's date, the red curve in diagram jokes, count badges. Never body text, never buttons.
- **Highlighter Yellow** (`highlighter-yellow`): one phrase in the headline, and text selection. Nothing else.
- **Highlighter Pink** (`highlighter-pink`): the word "free" in listing lines.
- **Teacher Blue** (`teacher-blue`): "your teacher signs you up", the teacher box in the details sheet, focus rings.

### Neutral
- **Paper** (`paper`): the page and the sheets.
- **Today** (`today`): the pale-yellow band behind today's listing.
- **Wash** (`wash`): the search field, hover fills, the teacher box, topic tags.
- **Muted** (`muted`): metadata, weekdays and months in the date column, chart labels.
- **Body** (`body`): reading text inside sheets and Read & listen descriptions.
- **Rule** and **Rule Strong** (`rule`, `rule-strong`): hairlines between listings; outlines on plain buttons and toggles.
- **Bar** and **Dash** (`bar`, `dash`): the chart's other-month bars, and every dashed "last year" outline.

### Dark
Every colour above is a token, redefined under `:root[data-theme="dark"]` (screen only, so printed lists stay black on white). The site follows the device until the sun/moon switch in the masthead is used; the choice is then kept in that browser, and a small script in index.html applies it before the page draws. Dark values: paper `#13171e`, ink `#ebe7de`, muted `#9ca3b0`, rule `#2a303b`, pen `#ff6b7d`, yellow highlighter `#7d6408`, pink `#8a2c63`, teacher blue `#8eb0ff`, today `#262214`, wash `#1d222b`. The highlighters are darkened so cream text still reads over them (4.6:1 and up).

### Named Rules
**The Red Pen Rule.** Red is handwriting. It marks, circles, counts down and jokes; it never fills a button, colours body text or tints a box.
**The One Highlight Rule.** One yellow-highlighted phrase per screen, in the headline. Selected filters are underlined in ink, never highlighted. Pink highlighter is reserved for "free".
**The Ink Kind Rule.** The kind of thing is the first word of the meta line, in ink, in the filters' own words ("Talk", "Competition", "Programme", "Work experience"). No coloured tags, no labels above titles.

## Typography

**Display and titles:** Spectral (self-hosted, 500/700/800)
**Body:** Public Sans Variable (self-hosted)
**Annotations:** Caveat 600 (self-hosted)

**Character:** An official broadsheet serif for anything you'd read as news, a plain modern sans for the details, and real-looking handwriting for the friend's notes.

### Hierarchy
- **Headline** (700, clamp(30px, 3.2vw, 42px), 1.08): the data-driven lead on Browse.
- **Page title** (800, clamp(34px, 5vw, 52px), 1.04): Your year, Read & listen, For teachers.
- **Section** (800, 22px): "This week", "Next two weeks", month names.
- **Title** (700, 19px, 1.22): listing titles (18px on phones).
- **Date** (700, 36px, 1): the big day number in the date column (32px on phones).
- **Body** (400, 16px, 1.5): reading text, kept to roughly 62–66ch.
- **Meta** (400, 13.5px): the one line under a title. Starts with the kind word in ink (600).
- **Label** (700, 11px, 0.07em, uppercase): weekday and month around the big date.
- **Pen** (Caveat 600, 20–22px, rotated 1.5–5°): margin notes, countdowns and jokes.

### Named Rules
**The Big Date Rule.** Every listing leads with its date at display size. A listing with no date says "Any time"; one dated from last year says "Last yr" in a dashed box. The column is drawn for the eye: the meta line carries the same date in words for screen readers ("Tuesday 17 November", "last year, 3 June 2026, not confirmed").

## Layout

On desktop, Browse is a two-column paper: a sticky lead column (headline, standfirst, year chart) of 300–380px, and a reading column up to 720px holding search, the status tabs (Open now / Not open yet) with the filter switches, the kind filters, and the dated list. Below 900px the columns stack and the chart folds behind "See the year at a glance". Other pages are a single 860px column. Listings are a three-column grid: 60px date, flexible body, 36px save button. Rules separate listings; section headings sit 26px above their first rule.

Below 760px the masthead loses its nav, a four-item bottom tab bar (Browse, Your year, Read & listen, Teachers) takes over, and Browse keeps only search and the two tabs in view: the switches and kinds fold behind one "Filters" button, which shows how many are on, a one-line summary and "Clear". Tap targets are at least 40px.

## Elevation & Depth

Flat paper. Depth comes from rules: hairlines between listings, a 2px ink rule above teacher items and date boxes, and a double rule under the masthead and at the top of every sheet. Only sheets and the toast cast a shadow, because they float.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 24px 60px rgb(22 32 47 / 0.28)`): details and About sheets.
- **Toast** (`box-shadow: 0 12px 30px rgb(22 32 47 / 0.3)`): the save confirmation.

## Shapes

Mostly square: 6px on buttons and sheets, 4px on chips and date boxes, 8px on the search field, full pills only on the filter switches, the phone "Filters" button and the round save button. The only curves with character are hand-drawn: the pen circle and the diagram jokes.

## Components

### Buttons
- **Ink:** ink fill, paper text, 6px corners, 42px tall; used for the one action that matters ("Sign up on the official site", "Apply", "Add dates to my calendar").
- **Plain:** transparent with a 1.5px rule-strong inset outline that darkens to ink on hover.
- **Text:** underlined 13px bold muted text ("Mark as done", "Got it", "Show all", "Clear").
- **Save:** a round 36px bookmark button on every listing; it fills with ink when saved.

### Filters
- **Status tabs** (one of a set): text tabs with counts; the active tab has a 3px ink underline.
- **Kind filters** (one of a set): text with counts; the chosen one has a 2px ink underline.
- **Switches** (on/off: Free only, Online only, No teacher needed, New): outlined pills that fill with ink when on. "New" only appears when it would show something.
- **Search:** a 44px wash field with a search icon; 16px text so phones don't zoom.

### Chips
- **Detail sheet chips:** 24px, 1.5px outline: status (ink-filled when open), kind, when, cost.

### Navigation
- **Masthead:** serif wordmark, text nav with a 2px ink underline on the current page, the edition line ("Year 12 · 2026/27") in small caps above 1040px, a round 40px light/dark switch (moon in light, sun in dark) at the end, and a double rule beneath.
- **Phone:** the bottom tab bar; the current item is ink, the rest muted, with a red count badge on Your year.

### Listing (signature)
Date column, serif title (a button that opens details), one meta line (kind word in ink · organiser · place · free/cost · time it takes · "your teacher signs you up" in blue), and a save button. A deadline in the next two weeks gets a pen note under the meta line ("closes in 5 days", "closes tomorrow!"). Today's listing gets the pale-yellow band, a red pen circle round its date, a handwritten "today!" or "last day!", and its sign-up button inline. Last-year listings get a dashed date box; closed ones fade to 55%.

### Your year rows
The same listing grid, with the next step written out in ink ("Apply by 30 Nov · then takes place 21 Jan") and a remove button. The list opens with "Next two weeks"; those rows carry pen notes ("tomorrow!", "in 14 days"). New or moved dates are a pen "new dates!" on the row, with one plain line at the top ("New dates for one thing you saved, marked in red pen below. Got it"). Two things on the same day get "same day as another one you saved".

### Year chart (signature)
Twelve months of real counts: solid bars for confirmed dates (the current month in ink, the others stone), dashed outlines for last year's dates. A handwritten "you are here" sits over the current month and "busiest last year" (or "summer schools usually land here") over last year's peak. A key explains solid versus dashed.

### Read & listen
Books, podcasts, free courses and websites grouped by type, two to four per type before "Show all". Each has a done switch; once done, a handwriting-style note field (Caveat on wash) asks for one thing that stuck.

### Diagram jokes
At most two per list, only on Open now with no filters: a small hand-drawn economics diagram with a one-line pen joke (supply and demand, opportunity cost).

## Do's and Don'ts

### Do:
- **Do** write headlines and chart notes from the data so they are always true, and build the headline from the whole tab, not the filtered results.
- **Do** keep confirmed and last-year dates visibly different (solid vs dashed) everywhere, and say "not confirmed" to screen readers.
- **Do** put anything urgent on the row it concerns, in the red pen.
- **Do** theme focus (teacher blue) and text selection (yellow highlighter) from the palette, and define every colour as a token with a dark value.

### Don't:
- **Don't** use photos or illustrations; the chart and the pen marks are the imagery.
- **Don't** put red on buttons, body text or boxes, or highlight more than one headline phrase.
- **Don't** add alert boxes or coloured side stripes; the pen does urgency.
- **Don't** give kinds of thing their own colours, or put tags or small labels above titles; the serif headline carries itself.
- **Don't** add more than two diagram jokes to a list, or put them anywhere but Open now.
