import { useEffect, useMemo, useRef, useState } from "react";
import { opportunities, REFERENCE_DATE } from "./data/opportunities";
import type { Opportunity } from "./types/opportunity";
import {
  availableInLondon,
  currentAcademicYear,
  emptyFilters,
  filterOpportunities,
  formatDate,
  kindOf,
  kindOptions,
  prioritiseFree,
  withEffectiveStatus,
  type Filters as FilterState,
} from "./lib/opportunities";
import { headline, inTab, numberWord, sections, upcomingSections, type BrowseTab } from "./lib/display";
import { progressStore, readStore } from "./lib/progress";
import { dateNews, seenStore, settleSeen, type Seen } from "./lib/news";
import { resources } from "./data/resources";
import type { Progress, ProgressMap } from "./lib/plan";
import { todayISO } from "./lib/clock";
import { reminderStore } from "./lib/reminders";
import { freshListings, recordVisit, visitStore } from "./lib/fresh";
import { listingIdFromUrl, listingUrl, setListingInUrl, siteUrl } from "./lib/links";
import type { Term } from "./lib/terms";
import { TermSheet } from "./components/TermSheet";
import { ReadListen } from "./components/ReadListen";
import { Icon, type IconName } from "./components/Icon";
import { ListingSections } from "./components/Listing";
import { YearChart } from "./components/YearChart";
import { OpportunityDialog } from "./components/OpportunityDialog";
import { YearPlan } from "./components/YearPlan";
import { TeacherPage } from "./components/TeacherPage";

type View = "browse" | "year" | "read" | "teachers";
const views: { id: View; label: string; icon: IconName }[] = [
  { id: "browse", label: "Browse", icon: "home" },
  { id: "year", label: "Your year", icon: "calendar" },
  { id: "read", label: "Read & listen", icon: "headphones" },
  { id: "teachers", label: "Teachers", icon: "mail" },
];
const statuses: { id: BrowseTab; label: string; line: string }[] = [
  { id: "open", label: "Open now", line: "Everything you can apply for, sign up to or turn up to right now, in date order." },
  {
    id: "upcoming",
    label: "Not open yet",
    line: "In the order they open. Where it says “Opens”, the date is confirmed; where it says “not announced yet”, it ran last year and the date shown is last year's.",
  },
];

export default function App() {
  const [view, setView] = useState<View>("browse");
  const [status, setStatus] = useState<BrowseTab>("open");
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [newOnly, setNewOnly] = useState(false);
  const [saved, setSaved] = useState<string[]>(() => reminderStore.load());
  const [progress, setProgress] = useState<ProgressMap>(() => progressStore.load());
  const [readProgress, setReadProgress] = useState<ProgressMap>(() => readStore.load());
  const [seen, setSeen] = useState<Seen>(() => seenStore.load());
  // Chrome and Edge offer their own install prompt; we keep it for the button in About.
  const [installPrompt, setInstallPrompt] = useState<{ prompt: () => Promise<void> } | null>(null);
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [printTerm, setPrintTerm] = useState<Term | null>(null);
  const [toast, setToast] = useState("");
  const [about, setAbout] = useState(false);
  // Phones only: the chart starts folded away so the listings are on the first screen.
  const [chartOpen, setChartOpen] = useState(false);
  // Phones only: the filters fold behind one button so search and the tabs come first.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const aboutDialog = useRef<HTMLDialogElement>(null);

  // The one read of "today": statuses are aged against the real date on every visit.
  const today = useMemo(() => todayISO(), []);
  const academicYear = useMemo(() => currentAcademicYear(today), [today]);
  // London-focused: only what a London-based student can do (London, online or UK-wide).
  const live = useMemo(() => withEffectiveStatus(opportunities.filter(availableInLondon), today), [today]);

  // Remembers this visit (two dates, this browser only) to work out what's new since the last one.
  const previousVisit = useMemo(() => {
    const visits = recordVisit(visitStore.load(), today);
    visitStore.save(visits);
    return visits.previous;
  }, [today]);
  const fresh = useMemo(() => freshListings(live, today, previousVisit), [live, today, previousVisit]);

  const isShown = (item: Opportunity) => !newOnly || fresh.ids.has(item.id);
  const filtered = filterOpportunities(live, filters).filter(isShown);
  const results = prioritiseFree(filtered.filter((item) => inTab(item, status)));
  const counts = Object.fromEntries(
    statuses.map((s) => [s.id, filtered.filter((item) => inTab(item, s.id)).length]),
  ) as Record<BrowseTab, number>;
  // Each kind's count with every other filter applied, so the numbers match what a tap shows.
  const kindPool = filterOpportunities(live, { ...filters, kind: null }).filter((item) => isShown(item) && inTab(item, status));
  const kindCount = (kind: string | null) => kindPool.filter((item) => !kind || kindOf(item) === kind).length;
  const freshInTab = live.filter((item) => fresh.ids.has(item.id) && inTab(item, status)).length;
  // The number on the New button, with the other filters and the search applied, like the kinds.
  const freshShown = filterOpportunities(live, filters).filter((item) => fresh.ids.has(item.id) && inTab(item, status)).length;
  // The headline describes the whole tab, so it stays true while filters or a search are on;
  // the line under it says how many are showing.
  const tabTotal = live.filter((item) => inTab(item, status)).length;
  const lead = headline(prioritiseFree(live.filter((item) => inTab(item, status))), status, today);
  const activeStatus = statuses.find((s) => s.id === status)!;
  const savedItems = live.filter((item) => saved.includes(item.id));
  const readDone = resources
    .filter((item) => readProgress[item.id]?.done)
    .sort((a, b) => readProgress[b.id].doneOn.localeCompare(readProgress[a.id].doneOn));
  const news = dateNews(savedItems, seen);
  const filtersOn =
    filters.freeOnly || filters.online || filters.noTeacher || filters.kind !== null || filters.query.trim() !== "" || newOnly;
  // What's switched on, in words, for the folded filter bar on phones (the search box shows itself).
  const kindLabel = kindOptions.find((k) => k.id === filters.kind)?.label;
  const activeFilters = [
    filters.freeOnly && "Free only",
    filters.online && "Online only",
    filters.noTeacher && "No teacher needed",
    newOnly && "New",
    kindLabel,
  ].filter(Boolean) as string[];
  function clearFilters() {
    setFilters(emptyFilters);
    setNewOnly(false);
  }
  function showNew() {
    setNewOnly(true);
    if (!freshInTab) setStatus(status === "open" ? "upcoming" : "open");
  }

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);
  // A shared link (?listing=<id>) opens that listing; the address follows whatever is open,
  // so it can be copied from the browser too.
  useEffect(() => {
    const id = listingIdFromUrl(window.location.search);
    if (!id) return;
    const item = withEffectiveStatus(opportunities, today).find((entry) => entry.id === id);
    if (item) setSelected(item);
    else {
      setListingInUrl(null);
      setToast("That listing isn't on the site any more. Here's everything that's on now.");
    }
  }, [today]);
  useEffect(() => {
    setListingInUrl(selected?.id ?? null);
  }, [selected]);
  // The termly list: rendered for print only, then the browser's print window (Save as PDF).
  useEffect(() => {
    if (!printTerm) return;
    const title = document.title;
    document.title = `Economics opportunities, ${printTerm.name}`;
    document.documentElement.classList.add("printing-sheet");
    const done = () => setPrintTerm(null);
    window.addEventListener("afterprint", done);
    const timer = window.setTimeout(() => window.print(), 50);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", done);
      document.title = title;
      document.documentElement.classList.remove("printing-sheet");
    };
  }, [printTerm]);
  // Remember the dates of anything newly saved, and forget anything unsaved. News stays until
  // "Got it" in Your year.
  useEffect(() => {
    const items = live.filter((item) => saved.includes(item.id));
    setSeen((current) => {
      const next = settleSeen(items, current);
      seenStore.save(next);
      return next;
    });
  }, [live, saved]);
  // Said once per visit (the first render's news), so a student who never opens Your year
  // still hears about it.
  const [firstNews] = useState(news);
  useEffect(() => {
    if (!firstNews.length || listingIdFromUrl(window.location.search)) return;
    setToast(
      firstNews.length === 1
        ? `${firstNews[0].kind === "changed" ? "Dates have changed" : "Dates are out"} for ${firstNews[0].item.name}, which you saved. It's in Your year.`
        : `Dates are out for ${numberWord(firstNews.length).toLowerCase()} things you saved. They're in Your year.`,
    );
  }, [firstNews]);
  function acknowledgeNews() {
    const next = settleSeen(savedItems, seen, true);
    setSeen(next);
    seenStore.save(next);
  }
  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as unknown as { prompt: () => Promise<void> });
    };
    const installed = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  useEffect(() => {
    if (about) aboutDialog.current?.showModal();
    else aboutDialog.current?.close();
  }, [about]);

  function toggleSaved(id: string) {
    const removing = saved.includes(id);
    const next = removing ? saved.filter((item) => item !== id) : [...saved, id];
    const persisted = reminderStore.save(next);
    setSaved(next);
    setToast(
      persisted
        ? removing
          ? "Removed from Your year."
          : "Saved to Your year, on this device. Nothing gets emailed or sent."
        : "This browser won't store your list, so it'll only last until you close the tab.",
    );
  }
  function go(next: View) {
    setView(next);
    window.scrollTo({ top: 0 });
  }
  const listProps = { today, saved, onOpen: setSelected, onSave: toggleSaved };
  function updateProgress(id: string, entry: Progress) {
    const next = { ...progress, [id]: entry };
    setProgress(next);
    if (!progressStore.save(next)) setToast("This browser won't store your notes, so they'll only last until you close the tab.");
  }
  function updateRead(id: string, entry: Progress) {
    const next = { ...readProgress, [id]: entry };
    setReadProgress(next);
    if (!readStore.save(next)) setToast("This browser won't store your notes, so they'll only last until you close the tab.");
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="masthead">
        <div className="masthead-inner">
          <button className="wordmark" onClick={() => { go("browse"); setStatus("open"); }}>
            Your Economics Year
          </button>
          <nav className="topnav" aria-label="Main">
            {views.map((v) => (
              <button key={v.id} aria-current={view === v.id ? "page" : undefined} onClick={() => go(v.id)}>
                {v.label}
                {v.id === "year" && saved.length > 0 && <span className="count">{saved.length}</span>}
              </button>
            ))}
            <button onClick={() => setAbout(true)}>About</button>
          </nav>
          <span className="edition">
            Year 12 · {academicYear}/{String(academicYear + 1).slice(2)}
          </span>
          <button className="about-link" onClick={() => setAbout(true)}>
            About
          </button>
        </div>
      </header>

      <main id="main">
        {view === "browse" && (
          <div className="paper">
            <aside className="lead-col">
              <h1 className="lead-title">
                <mark className="hl">{lead.highlight}</mark>
                {lead.after}
              </h1>
              <p className="lead-sub">
                {filtersOn ? (
                  <>
                    Showing {results.length} of {tabTotal} with your filters.{" "}
                    <button className="text-button" onClick={clearFilters}>
                      Show all
                    </button>
                  </>
                ) : (
                  <>{activeStatus.line} Each one links to its official page.</>
                )}
              </p>
              {fresh.ids.size > 0 && !filtersOn && (
                // Counts the tab you're on, like the New button; points to the other tab when this one has none.
                <button className="fresh-note pen" onClick={showNew}>
                  {freshInTab > 0
                    ? `${numberWord(freshInTab)} new ${fresh.sinceVisit ? "since you were last here" : "this week"}`
                    : `${numberWord(fresh.ids.size)} new in ${statuses.find((s) => s.id !== status)!.label}`}{" "}
                  →
                </button>
              )}
              <button className="chart-toggle" aria-expanded={chartOpen} aria-controls="year-chart" onClick={() => setChartOpen(!chartOpen)}>
                {chartOpen ? "Hide the year at a glance" : "See the year at a glance"}
                <Icon name="chevron" size={14} />
              </button>
              <div id="year-chart" className={`chart-wrap ${chartOpen ? "is-open" : ""}`}>
                <YearChart items={live} academicYear={academicYear} today={today} />
              </div>
            </aside>
            <section className="list-col" aria-label={`${activeStatus.label} listings`}>
              <div className="search" role="search">
                <Icon name="search" size={17} />
                <label className="sr-only" htmlFor="search">
                  Search listings
                </label>
                <input
                  id="search"
                  type="search"
                  value={filters.query}
                  placeholder="Search: LSE, essay, Bitcoin…"
                  autoComplete="off"
                  enterKeyHint="search"
                  onChange={(event) => setFilters({ ...filters, query: event.target.value })}
                />
                {filters.query && (
                  <button aria-label="Clear search" onClick={() => setFilters({ ...filters, query: "" })}>
                    <Icon name="close" size={15} />
                  </button>
                )}
              </div>
              <div className={`browse-controls ${filtersOpen ? "filters-open" : ""}`}>
                <div className="list-controls">
                  <nav className="status-tabs" aria-label="When you can act">
                    {statuses.map((s) => (
                      <button key={s.id} aria-pressed={status === s.id} onClick={() => setStatus(s.id)}>
                        {s.label} <span>{counts[s.id]}</span>
                      </button>
                    ))}
                  </nav>
                  <div className="filter-bar">
                    <button
                      className="filter-button"
                      aria-expanded={filtersOpen}
                      aria-controls="filter-toggles filter-kinds"
                      onClick={() => setFiltersOpen(!filtersOpen)}
                    >
                      <Icon name="filter" size={15} /> Filters
                      {activeFilters.length > 0 && <span className="toggle-count"> · {activeFilters.length}</span>}
                    </button>
                    {activeFilters.length > 0 && !filtersOpen && <span className="filter-summary">{activeFilters.join(", ")}</span>}
                    {filtersOn && (
                      <button className="text-button filter-clear" onClick={clearFilters}>
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="toggles" id="filter-toggles" role="group" aria-label="Filters">
                    <button aria-pressed={filters.freeOnly} onClick={() => setFilters({ ...filters, freeOnly: !filters.freeOnly })}>
                      <Icon name={filters.freeOnly ? "check" : "filter"} size={14} />
                      Free only
                    </button>
                    <button aria-pressed={filters.online} onClick={() => setFilters({ ...filters, online: !filters.online })}>
                      <Icon name={filters.online ? "check" : "globe"} size={14} />
                      Online only
                    </button>
                    <button aria-pressed={filters.noTeacher} onClick={() => setFilters({ ...filters, noTeacher: !filters.noTeacher })}>
                      <Icon name={filters.noTeacher ? "check" : "mail"} size={14} />
                      No teacher needed
                    </button>
                    {(freshShown > 0 || newOnly) && (
                      <button aria-pressed={newOnly} onClick={() => setNewOnly(!newOnly)}>
                        <Icon name={newOnly ? "check" : "spark"} size={14} />
                        New <span className="toggle-count">{freshShown}</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="kind-chips" id="filter-kinds" role="group" aria-label="Kind of thing">
                  {[{ id: null, label: "Everything" }, ...kindOptions].map((k) => (
                    <button key={k.id ?? "all"} aria-pressed={filters.kind === k.id} onClick={() => setFilters({ ...filters, kind: k.id })}>
                      {k.label} <span>{kindCount(k.id)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <p className="sr-only" role="status">
                {results.length} {activeStatus.label.toLowerCase()} listings{filtersOn ? " with your filters" : ""}.
              </p>
              {results.length ? (
                <ListingSections
                  groups={status === "open" ? sections(results, today, "open") : upcomingSections(results, today)}
                  {...listProps}
                  fresh={fresh.ids}
                  jokes={status === "open" && !filtersOn}
                />
              ) : (
                <div className="empty">
                  <h2>
                    Nothing {status === "open" ? "open now" : "coming up"}{" "}
                    {filters.query.trim() ? <>matches “{filters.query.trim()}”</> : "with those filters"}.
                  </h2>
                  <div className="empty-actions">
                    {statuses
                      .filter((s) => s.id !== status && counts[s.id] > 0)
                      .map((s) => (
                        <button key={s.id} className="btn btn-ink" onClick={() => setStatus(s.id)}>
                          {counts[s.id]} in {s.label} <Icon name="arrow" size={15} />
                        </button>
                      ))}
                    {filtersOn && (
                      <button className="btn btn-plain" onClick={clearFilters}>
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {view === "year" && (
          <YearPlan
            items={savedItems}
            all={live}
            today={today}
            progress={progress}
            onProgress={updateProgress}
            readDone={readDone}
            readProgress={readProgress}
            onReadProgress={updateRead}
            news={news}
            onAcknowledge={acknowledgeNews}
            onOpen={setSelected}
            onSave={toggleSaved}
            onRemove={toggleSaved}
            onBrowse={() => go("browse")}
            onRead={() => go("read")}
            onToast={setToast}
          />
        )}

        {view === "read" && <ReadListen progress={readProgress} today={today} onProgress={updateRead} />}

        {view === "teachers" && <TeacherPage opportunities={live} today={today} onPrint={setPrintTerm} />}

        <footer className="footer">
          <p>
            What's open, not open yet and closed is worked out live from today's date ({formatDate(today, true)}). The listings
            were last verified by hand on {formatDate(REFERENCE_DATE, true)}, and each links to its official page, which
            always has the final word.
          </p>
          <p>Independent and student-built. Not affiliated with any organiser listed here.</p>
        </footer>
      </main>

      <nav className="tabbar" aria-label="Main">
        {views.map((v) => (
          <button key={v.id} aria-current={view === v.id ? "page" : undefined} onClick={() => go(v.id)}>
            <Icon name={v.icon} size={21} />
            <span>{v.label}</span>
            {v.id === "year" && saved.length > 0 && <span className="dot">{saved.length}</span>}
          </button>
        ))}
      </nav>

      {selected && (
        <OpportunityDialog
          item={selected}
          link={listingUrl(selected.id)}
          saved={saved.includes(selected.id)}
          onSave={toggleSaved}
          onClose={() => setSelected(null)}
        />
      )}
      {printTerm && <TermSheet items={live} term={printTerm} today={today} siteUrl={siteUrl()} />}

      <dialog
        ref={aboutDialog}
        className="sheet"
        aria-labelledby="about-title"
        onCancel={() => setAbout(false)}
        onClick={(event) => {
          if (event.target === aboutDialog.current) setAbout(false);
        }}
      >
        <div className="sheet-inner">
          <button className="sheet-close" aria-label="Close" onClick={() => setAbout(false)}>
            <Icon name="close" />
          </button>
          <h2 id="about-title">What this is</h2>
          <p>
            Real things to do beyond the classroom for Year 12 students thinking about Economics at university:
            competitions, lectures, tasters, summer schools and work experience, in date order.
          </p>
          <h3>Where the information comes from</h3>
          <p>
            Every listing links to its organiser's official page and shows when it was last checked. When next
            year's dates aren't out yet, you'll see last year's month, clearly marked "last year". Nothing is guessed,
            and the chart counts only real dates.
          </p>
          <h3>Open now and Not open yet</h3>
          <p>
            <strong>Open now:</strong> apply, sign up or turn up now. <strong>Not open yet:</strong> everything coming
            up, in the order it opens. A card saying <strong>“Opens”</strong> has a confirmed date. A card saying{" "}
            <strong>“not announced yet”</strong> ran last year and hasn't published this year's dates, so it shows last
            year's date, marked “last yr”.
          </p>
          <h3>Your year</h3>
          <p>
            Everything you save, in the order you need to act, with a button to put the dates in your own calendar. Tick
            things off and jot down what you got from them, ready for your personal statement. When something you saved
            gets this year's dates, it tells you. It's all kept in this browser on this device: no account, no emails.
          </p>
          <h3>Sending things to your teacher</h3>
          <p>
            Some opportunities need your school to sign you up. “Copy message for my teacher” copies a short message
            with the official link for you to paste into an email or chat yourself. Nothing is sent for you.
          </p>
          <h3>Read &amp; listen</h3>
          <p>
            Books, podcasts, free courses and websites for the weeks between events. Tick off what you've done and add a
            line on it; it goes in Your year with everything else.
          </p>
          <h3>Sharing a listing</h3>
          <p>
            Every listing has its own link. Use <strong>Share</strong> in a listing to send it to a friend or post it in a
            class chat.
          </p>
          <h3>For teachers</h3>
          <p>
            The Teachers page lists what needs a school to sign students up, and prints a one-page list of what's on each
            term, to put up or email out.
          </p>
          <h3>Put it on your phone</h3>
          <p>
            It works like an app from your home screen. On an iPhone, tap Share, then <strong>Add to Home Screen</strong>.
            On Android, open the browser menu and tap <strong>Install app</strong> or <strong>Add to home screen</strong>.
          </p>
          {installPrompt && (
            <button
              className="btn btn-ink install-btn"
              onClick={async () => {
                await installPrompt.prompt();
                setInstallPrompt(null);
              }}
            >
              <Icon name="download" size={16} /> Install on this device
            </button>
          )}
        </div>
      </dialog>

      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="toast">
            <Icon name="check" size={18} />
            <p>{toast}</p>
            <button aria-label="Dismiss" onClick={() => setToast("")}>
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
