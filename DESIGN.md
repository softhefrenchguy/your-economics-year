---
name: Your Economics Year
description: Year 12 Economics opportunities as an annotated newspaper of the year.
colors:
  paper: "#fdfcf9"
  ink: "#16202f"
  muted: "#5b6372"
  rule: "#e6e2d8"
  rule-strong: "#d6d1c4"
  wash: "#f4f1ea"
  pen-red: "#c8102e"
  highlighter-yellow: "#ffe45c"
  highlighter-pink: "#ff9bd2"
  teacher-blue: "#1f4fb5"
  today: "#fff7e0"
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
  chip:
    textColor: "{colors.ink}"
    rounded: "{rounded.mark}"
    height: "24px"
    padding: "0 8px"
---

# Design System: Your Economics Year

## Overview

**Creative North Star: "The Annotated Paper"**

The site reads like a good newspaper of your year that a clever friend has marked up for you. The structure is calm and official: a double-ruled masthead, serif headlines, hairline rules, and a chronological list where every listing leads with a big serif date. The character comes from the annotations on top: red pen notes in the margin ("you are here", "today!"), a red circle round today's date, highlighter on one phrase per headline and on "free", and the occasional economics diagram joke drawn in the gutter.

It's honest by design. The headline is written from the data. The year chart counts only real dates, with confirmed dates as solid ink bars and last year's dates as dashed outlines. "Last year" is labelled everywhere it applies.

**Key Characteristics:**
- Warm white paper, near-black ink, hairline rules, a double rule under the masthead.
- Serif (Spectral) for the masthead, headlines, titles and big dates; Public Sans for everything read.
- Handwriting (Caveat) in pen red, used only for margin notes and diagram jokes.
- Chronological sections: This week, Later in <month>, each later month, Any time.
- The data-driven year chart is the hero image; there are no photos.

## Colors

Paper and ink, plus the stationery a student actually uses: a red pen and two highlighters.

### Primary
- **Ink** (`ink`): text, the active tab underline, the current month's chart bar, primary buttons, saved state.

### Secondary
- **Pen Red** (`pen-red`): handwritten margin notes, the circle round today's date, the red curve in diagram jokes, count badges. Never body text, never buttons.
- **Highlighter Yellow** (`highlighter-yellow`): one phrase in the headline, and text selection.
- **Highlighter Pink** (`highlighter-pink`): the word "free" in listing lines.
- **Teacher Blue** (`teacher-blue`): "your teacher signs you up", the teacher box in the details sheet, focus rings.

### Neutral
- **Paper** (`paper`): the page and the sheets.
- **Today** (`today`): the pale-yellow band behind today's listing.
- **Wash** (`wash`): hover fills, the teacher box, topic tags.
- **Muted** (`muted`): metadata, weekdays and months in the date column, chart labels.
- **Rule** and **Rule Strong** (`rule`, `rule-strong`): hairlines between listings; outlines on plain buttons and toggles.

### Named Rules
**The Red Pen Rule.** Red is handwriting. It marks, circles and jokes; it never fills a button or colours body text.
**The One Highlight Rule.** One yellow-highlighted phrase per headline. Pink highlighter is reserved for "free".

## Typography

**Display and titles:** Spectral (self-hosted, 500/700/800)
**Body:** Public Sans Variable (self-hosted)
**Annotations:** Caveat 600 (self-hosted)

**Character:** An official broadsheet serif for anything you'd read as news, a plain modern sans for the details, and real-looking handwriting for the friend's notes.

### Hierarchy
- **Headline** (700, clamp(30px, 3.2vw, 42px), 1.08): the data-driven lead on Browse.
- **Page title** (800, clamp(34px, 5vw, 52px), 1.04): Your year, My list, For teachers.
- **Section** (800, 22px): "This week", "Later in November", month names.
- **Title** (700, 19px, 1.22): listing titles (18px on phones).
- **Date** (700, 36px, 1): the big day number in the date column (32px on phones).
- **Body** (400, 16px, 1.5): reading text, kept to roughly 62–66ch.
- **Label** (700, 11px, 0.07em, uppercase): weekday and month around the big date.
- **Pen** (Caveat 600, 20–22px): margin notes and jokes only.

### Named Rules
**The Big Date Rule.** Every listing leads with its date at display size. A listing with no date says "Any time"; one dated from last year says "Last yr" in a dashed box.

## Layout

On desktop, Browse is a two-column paper: a sticky lead column (headline, standfirst, year chart) of 300–380px, and a reading column up to 720px holding the status tabs, filters and the dated list. Below 900px the columns stack. Other pages are a single 860px column. Listings are a three-column grid: 60px date, flexible body, 36px save button. Rules separate listings; section headings sit 26px above their first rule. Below 760px the masthead loses its nav, and a four-item bottom tab bar (Browse, Your year, My list, Teachers) takes over.

## Elevation & Depth

Flat paper. Depth comes from rules: hairlines between listings, a 2px ink rule above teacher items and date boxes, and a double rule under the masthead and at the top of every sheet. Only sheets and the toast cast a shadow, because they float.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 24px 60px rgb(22 32 47 / 0.28)`): details and About sheets.
- **Toast** (`box-shadow: 0 12px 30px rgb(22 32 47 / 0.3)`): the save confirmation.

## Shapes

Mostly square: 6px on buttons and sheets, 4px on chips and date boxes, full pills only on the two filter toggles and the round save button. The only curves with character are hand-drawn: the pen circle and the diagram jokes.

## Components

### Buttons
- **Ink:** ink fill, paper text, 6px corners, 42px tall; used for the one action that matters ("Sign up on the official site", "Apply").
- **Plain:** transparent with a 1.5px rule-strong inset outline that darkens to ink on hover.
- **Save:** a round 36px bookmark button on every listing; it fills with ink when saved.

### Chips and toggles
- **Chips** (details sheet): 24px, 1.5px outline; the status chip is ink-filled when open.
- **Toggles** (Free only, Online only): outlined pills that fill with ink when on.

### Navigation
- **Masthead:** serif wordmark, text nav with a 2px ink underline on the current page, the edition line ("Year 12 · 2026/27") in small caps, and a double rule beneath.
- **Status tabs:** text tabs with counts; the active tab has a 3px ink underline.
- **Phone:** the bottom tab bar; the current item is ink, the rest muted, with a red count dot on My list.

### Listing (signature)
Date column, serif title (a button that opens details), one meta line (organiser · place · free/cost · "your teacher signs you up" in blue), and a save button. Today's listing gets the pale-yellow band, a red pen circle round its date, a handwritten "today!" or "last day!", and its sign-up button inline. Last-year listings get a dashed date box; closed ones fade to 55%.

### Year chart (signature)
Twelve months of real counts: solid bars for confirmed dates (the current month in ink, the others stone), dashed outlines for last year's dates. A handwritten "you are here" sits over the current month and "busiest last year" (or "summer schools usually land here") over last year's peak. A key explains solid versus dashed.

### Diagram jokes
At most two per list, only on Open now: a small hand-drawn economics diagram with a one-line pen joke (supply and demand, opportunity cost).

## Do's and Don'ts

### Do:
- **Do** write headlines and chart notes from the data so they are always true.
- **Do** keep confirmed and last-year dates visibly different (solid vs dashed) everywhere.
- **Do** theme focus (teacher blue) and text selection (yellow highlighter) from the palette.

### Don't:
- **Don't** use photos or illustrations; the chart and the pen marks are the imagery.
- **Don't** put red on buttons or body text, or highlight more than one headline phrase.
- **Don't** add more than two diagram jokes to a list, or put them anywhere but Open now.
- **Don't** put small labels above headings; the serif headline carries itself.
