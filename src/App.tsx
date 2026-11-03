import { useEffect, useMemo, useRef, useState } from "react";
import { opportunities, REFERENCE_DATE } from "./data/opportunities";
import type { Opportunity, OpportunityStatus } from "./types/opportunity";
import {
  availableInLondon,
  currentAcademicYear,
  emptyFilters,
  filterOpportunities,
  formatDate,
  prioritiseFree,
  withEffectiveStatus,
  type Filters as FilterState,
} from "./lib/opportunities";
import { headline, sections, type Section } from "./lib/display";
import { todayISO } from "./lib/clock";
import { reminderStore } from "./lib/reminders";
import { Icon, type IconName } from "./components/Icon";
import { ListingSections } from "./components/Listing";
import { YearChart } from "./components/YearChart";
import { OpportunityDialog } from "./components/OpportunityDialog";
import { Timeline } from "./components/Timeline";
import { TeacherPage } from "./components/TeacherPage";

type View = "browse" | "year" | "list" | "teachers";
const views: { id: View; label: string; icon: IconName }[] = [
  { id: "browse", label: "Browse", icon: "home" },
  { id: "year", label: "Your year", icon: "calendar" },
  { id: "list", label: "My list", icon: "bookmark" },
  { id: "teachers", label: "Teachers", icon: "mail" },
];
const statuses: { id: OpportunityStatus; label: string; line: string }[] = [
  { id: "open", label: "Open now", line: "Everything you can apply for, sign up to or turn up to right now, in date order." },
  { id: "coming-soon", label: "Coming soon", line: "Confirmed and on the way. Save them and check back when they open." },
  { id: "watchlist", label: "Watchlist", line: "These ran last year and will probably return. The months shown are last year's, not confirmed." },
];

export default function App() {
  const [view, setView] = useState<View>("browse");
  const [status, setStatus] = useState<OpportunityStatus>("open");
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [saved, setSaved] = useState<string[]>(() => reminderStore.load());
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [toast, setToast] = useState("");
  const [about, setAbout] = useState(false);
  const aboutDialog = useRef<HTMLDialogElement>(null);

  // The one read of "today": statuses are aged against the real date on every visit.
  const today = useMemo(() => todayISO(), []);
  const academicYear = useMemo(() => currentAcademicYear(today), [today]);
  // London-focused: only what a London-based student can do (London, online or UK-wide).
  const live = useMemo(() => withEffectiveStatus(opportunities.filter(availableInLondon), today), [today]);

  const results = prioritiseFree(filterOpportunities(live, filters, status));
  const counts = Object.fromEntries(
    statuses.map((s) => [s.id, filterOpportunities(live, filters, s.id).length]),
  ) as Record<OpportunityStatus, number>;
  const lead = headline(results, status, today);
  const activeStatus = statuses.find((s) => s.id === status)!;
  const savedItems = live.filter((item) => saved.includes(item.id));
  const filtersOn = filters.freeOnly || filters.online;

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);
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
          ? "Removed from My list."
          : "Saved to My list on this device. Nothing gets emailed or sent."
        : "This browser won't store your list, so it'll only last until you close the tab.",
    );
  }
  function go(next: View) {
    setView(next);
    window.scrollTo({ top: 0 });
  }
  const listProps = { today, saved, onOpen: setSelected, onSave: toggleSaved };
  const savedGroups: Section[] = statuses
    .map((s) => {
      const items = savedItems.filter((item) => item.status === s.id);
      return { key: s.id, title: s.label, note: `${items.length} saved`, items };
    })
    .filter((group) => group.items.length > 0);

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
                {v.id === "list" && saved.length > 0 && <span className="count">{saved.length}</span>}
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
              <p className="lead-sub">{activeStatus.line} Each one links to its official page.</p>
              <YearChart items={live} academicYear={academicYear} today={today} />
            </aside>
            <section className="list-col" aria-label={`${activeStatus.label} listings`}>
              <div className="list-controls">
                <nav className="status-tabs" aria-label="When you can act">
                  {statuses.map((s) => (
                    <button key={s.id} aria-pressed={status === s.id} onClick={() => setStatus(s.id)}>
                      {s.label} <span>{counts[s.id]}</span>
                    </button>
                  ))}
                </nav>
                <div className="toggles" role="group" aria-label="Filters">
                  <button aria-pressed={filters.freeOnly} onClick={() => setFilters({ ...filters, freeOnly: !filters.freeOnly })}>
                    <Icon name={filters.freeOnly ? "check" : "filter"} size={14} />
                    Free only
                  </button>
                  <button aria-pressed={filters.online} onClick={() => setFilters({ ...filters, online: !filters.online })}>
                    <Icon name={filters.online ? "check" : "globe"} size={14} />
                    Online only
                  </button>
                </div>
              </div>
              <p className="sr-only" role="status">
                {results.length} {activeStatus.label.toLowerCase()} listings{filtersOn ? " with your filters" : ""}.
              </p>
              {results.length ? (
                <ListingSections groups={sections(results, today, status)} {...listProps} jokes={status === "open"} />
              ) : (
                <div className="empty">
                  <h2>Nothing {activeStatus.label.toLowerCase()} with those filters.</h2>
                  <div className="empty-actions">
                    {statuses
                      .filter((s) => s.id !== status && counts[s.id] > 0)
                      .map((s) => (
                        <button key={s.id} className="btn btn-ink" onClick={() => setStatus(s.id)}>
                          {counts[s.id]} in {s.label} <Icon name="arrow" size={15} />
                        </button>
                      ))}
                    {filtersOn && (
                      <button className="btn btn-plain" onClick={() => setFilters(emptyFilters)}>
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
          <Timeline items={filterOpportunities(live, filters)} allItems={live} academicYear={academicYear} {...listProps} />
        )}

        {view === "list" && (
          <div className="page">
            <h1 className="page-title">My list</h1>
            <p className="page-intro">
              Saved in this browser on this device. No account, and nothing is emailed or sent.
            </p>
            {savedGroups.length ? (
              <div className="page-list">
                <ListingSections groups={savedGroups} {...listProps} jokes={false} />
              </div>
            ) : (
              <div className="empty">
                <h2>Nothing saved yet.</h2>
                <p>Tap the bookmark next to anything that looks interesting and it'll wait for you here.</p>
                <div className="empty-actions">
                  <button className="btn btn-ink" onClick={() => go("browse")}>
                    See what's open <Icon name="arrow" size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {view === "teachers" && <TeacherPage opportunities={live} />}

        <footer className="footer">
          <p>
            Open, coming soon and closed are worked out live from today's date ({formatDate(today, true)}). The listings
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
            {v.id === "list" && saved.length > 0 && <span className="dot">{saved.length}</span>}
          </button>
        ))}
      </nav>

      {selected && (
        <OpportunityDialog item={selected} saved={saved.includes(selected.id)} onSave={toggleSaved} onClose={() => setSelected(null)} />
      )}

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
          <h3>Open now, Coming soon, Watchlist</h3>
          <p>
            <strong>Open now:</strong> apply, sign up or turn up now. <strong>Coming soon:</strong> confirmed, not open
            yet. <strong>Watchlist:</strong> ran last year, dates not confirmed.
          </p>
          <h3>My list</h3>
          <p>Saves things in this browser on this device. No account, no emails, no notifications.</p>
          <h3>Sending things to your teacher</h3>
          <p>
            Some opportunities need your school to sign you up. “Copy message for my teacher” copies a short message
            with the official link for you to paste into an email or chat yourself. Nothing is sent for you.
          </p>
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
