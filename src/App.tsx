import { useEffect, useMemo, useRef, useState } from "react";
import { opportunities, REFERENCE_DATE } from "./data/opportunities";
import type { Opportunity, OpportunityStatus } from "./types/opportunity";
import {
  currentAcademicYear,
  emptyFilters,
  filterOpportunities,
  formatDate,
  prioritiseFree,
  withEffectiveStatus,
  type Filters as FilterState,
} from "./lib/opportunities";
import { todayISO } from "./lib/clock";
import { reminderStore } from "./lib/reminders";
import { Filters } from "./components/Filters";
import { Icon } from "./components/Icon";
import { OpportunityCard } from "./components/OpportunityCard";
import { OpportunityDialog } from "./components/OpportunityDialog";
import { Timeline } from "./components/Timeline";
import { TeacherPage } from "./components/TeacherPage";

type View = "opportunities" | "timeline" | "teachers";
const tabs: { id: OpportunityStatus; label: string; description: string }[] = [
  {
    id: "open",
    label: "Open now",
    description:
      "Take your time. Pick something you’re curious about — you don’t need to do them all.",
  },
  {
    id: "coming-soon",
    label: "Coming soon",
    description:
      "Nothing to apply for just yet. Save a reminder if something catches your eye.",
  },
  {
    id: "watchlist",
    label: "Watchlist",
    description:
      "These might return later in the year. There’s nothing you need to do today.",
  },
];

export default function App() {
  const [view, setView] = useState<View>("opportunities");
  const [status, setStatus] = useState<OpportunityStatus>("open");
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [showAll, setShowAll] = useState(false);
  const [saved, setSaved] = useState<string[]>(() => reminderStore.load());
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [toast, setToast] = useState("");
  const [about, setAbout] = useState(false);
  const aboutDialog = useRef<HTMLDialogElement>(null);
  // Ages stored statuses against the real clock, once per mount — see lib/opportunities.ts
  // effectiveStatus. This is the only place "today" is read; everything downstream just
  // consumes already-corrected data and needs no knowledge of the real date.
  const today = useMemo(() => todayISO(), []);
  const academicYear = useMemo(() => currentAcademicYear(today), [today]);
  const liveOpportunities = useMemo(() => withEffectiveStatus(opportunities, today), [today]);
  const results = prioritiseFree(
    filterOpportunities(liveOpportunities, filters, status),
  );
  const filtered = filterOpportunities(liveOpportunities, filters);
  const activeTab = tabs.find((tab) => tab.id === status)!;
  const visibleResults = showAll ? results : results.slice(0, 2);
  const otherTabMatches = tabs
    .filter((tab) => tab.id !== status)
    .map((tab) => ({ tab, count: filterOpportunities(liveOpportunities, filters, tab.id).length }))
    .filter((entry) => entry.count > 0);
  const starter = prioritiseFree(liveOpportunities).find(
    (item) =>
      item.status === "open" &&
      item.costType === "free" &&
      !item.requiresTeacher &&
      !item.requiresSchoolNomination,
  );
  function changeFilters(next: FilterState) {
    setFilters(next);
    setShowAll(false);
  }
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 6500);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (about) aboutDialog.current?.showModal();
    else aboutDialog.current?.close();
  }, [about]);

  function toggleReminder(id: string) {
    const removing = saved.includes(id);
    const next = removing
      ? saved.filter((item) => item !== id)
      : [...saved, id];
    const persisted = reminderStore.save(next);
    setSaved(next);
    setToast(
      persisted
        ? removing
          ? "Reminder removed from this device."
          : "Reminder saved on this device. No emails or notifications will be sent."
        : "Device storage is unavailable. Your change will last for this session only.",
    );
  }
  function navigate(next: View) {
    setView(next);
  }
  function exploreTimeline() {
    setView("timeline");
    document
      .getElementById("explore")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <a className="skip-link" href="#explore">
        Skip to opportunities
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a
            className="brand"
            href="#"
            aria-label="Your Economics Year home"
            onClick={() => {
              setView("opportunities");
              setStatus("open");
            }}
          >
            <span className="brand-mark">
              y<span>e</span>
              <span className="brand-dot" />
            </span>
            <span>
              Your Economics Year
              <span className="brand-subtitle">One small step at a time.</span>
            </span>
          </a>
          <nav aria-label="Main navigation">
            <button
              className={view === "opportunities" ? "nav-active" : ""}
              aria-current={view === "opportunities" ? "page" : undefined}
              onClick={() => navigate("opportunities")}
            >
              Opportunities
            </button>
            <button
              className={view === "timeline" ? "nav-active" : ""}
              aria-current={view === "timeline" ? "page" : undefined}
              onClick={() => navigate("timeline")}
            >
              Your year
              <Icon name="calendar" size={15} />
            </button>
            <button
              className={view === "teachers" ? "nav-active" : ""}
              aria-current={view === "teachers" ? "page" : undefined}
              onClick={() => navigate("teachers")}
            >
              For teachers
              <Icon name="mail" size={15} />
            </button>
            <button onClick={() => setAbout(true)}>
              About
              <Icon name="arrow" size={15} />
            </button>
          </nav>
          <span className="year-pill">
            YEAR 12 <span>{academicYear}—{String(academicYear + 1).slice(2)}</span>
          </span>
        </div>
      </header>
      <main>
        {view === "teachers" ? (
          <TeacherPage opportunities={liveOpportunities} />
        ) : (
          <>
        <section className="hero page-width" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="little-star">✳</span> YOUR YEAR 12 ECONOMICS
              COMPANION
            </p>
            <h1 id="hero-title">
              Your year.
              <br />
              <span>At your own pace.</span>
            </h1>
            <p className="hero-description">
              You don’t need to have it all figured out. Start with one thing
              that interests you, and see where it takes you.
            </p>
            <div className="hero-meta">
              <span>
                <span className="tiny-dot" />
                For UK Year 12 students
              </span>
              <span>Free opportunities first</span>
            </div>
          </div>
          {starter && (
            <aside className="starter-note" aria-labelledby="starter-title">
              <span className="starter-symbol">
                <Icon name="book" size={22} />
              </span>
              <p className="eyebrow">NOT SURE WHERE TO START?</p>
              <h2 id="starter-title">Just come along and listen.</h2>
              <p>
                A university taster can help you find out what you enjoy about
                Economics. A little curiosity is enough to start.
              </p>
              <div className="starter-facts">
                <span>Free</span>
                <span>
                  {starter.deliveryMode === "online"
                    ? "Online"
                    : starter.deliveryMode === "hybrid"
                      ? `Hybrid · ${starter.location}`
                      : starter.location}
                </span>
                <span>No teacher registration</span>
              </div>
              <button onClick={() => setSelected(starter)}>
                Take a look at a taster
                <Icon name="arrow" size={17} />
              </button>
              <small>
                Sample suggestion
                {starter.applicationDeadline
                  ? ` · apply by ${formatDate(starter.applicationDeadline)}`
                  : ""}
              </small>
            </aside>
          )}
        </section>
        <div className="page-width">
          <div className="trust-banner">
            <span className="trust-label">VERIFIED SOURCES</span>
            <p>
              Every opportunity links to its official page and shows when we last checked it.
              Confirmed dates and "based on last cycle" estimates are always labelled separately.
            </p>
            <button onClick={() => setAbout(true)} aria-label="Learn how this data is checked">
              <Icon name="info" size={17} />
            </button>
          </div>
        </div>
        <section
          id="explore"
          className="explore page-width"
          aria-labelledby="explore-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">A LITTLE EXPLORING</p>
              <h2 id="explore-title">
                {view === "timeline"
                  ? "Your year, one month at a time."
                  : "See what catches your eye."}
              </h2>
            </div>
            <div className="view-toggle" aria-label="Display mode">
              <button
                className={view === "opportunities" ? "active" : ""}
                aria-pressed={view === "opportunities"}
                onClick={() => setView("opportunities")}
              >
                <Icon name="book" size={16} />
                Explore
              </button>
              <button
                className={view === "timeline" ? "active" : ""}
                aria-pressed={view === "timeline"}
                onClick={() => setView("timeline")}
              >
                <Icon name="calendar" size={16} />
                Timeline
              </button>
            </div>
          </div>
          {view === "opportunities" && (
            <div className="status-tabs" aria-label="Opportunity timing">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  aria-pressed={status === tab.id}
                  className={status === tab.id ? "active" : ""}
                  onClick={() => {
                    setStatus(tab.id);
                    setShowAll(false);
                  }}
                >
                  <span className={`status-dot ${tab.id}`} />
                  {tab.label}
                </button>
              ))}
            </div>
          )}
          <Filters
            value={filters}
            onChange={changeFilters}
            opportunities={liveOpportunities}
            status={view === "opportunities" ? status : undefined}
          />
          {view === "opportunities" ? (
            <>
              <div className="results-heading">
                <div>
                  <h3>
                    {status === "open"
                      ? showAll
                        ? "A few more possibilities"
                        : results.length === 1
                          ? "One idea to explore"
                          : "A couple of ideas to start with"
                      : activeTab.label}
                    <span>
                      {results.length > 0
                        ? `${visibleResults.length} of ${results.length}`
                        : "No matches"}
                    </span>
                  </h3>
                  <p>{activeTab.description}</p>
                </div>
              </div>
              <div className="result-announcement sr-only" role="status">
                Showing {visibleResults.length} of {results.length}{" "}
                {activeTab.label.toLowerCase()} opportunities.
              </div>
              {results.length ? (
                <div className="opportunity-grid">
                  {visibleResults.map((item) => (
                    <OpportunityCard
                      key={item.id}
                      item={item}
                      saved={saved.includes(item.id)}
                      onRemind={toggleReminder}
                      onDetails={setSelected}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Icon name="filter" size={30} />
                  <h3>Let’s try a different angle.</h3>
                  <p>
                    No {activeTab.label.toLowerCase()} opportunities match these filters.
                  </p>
                  {otherTabMatches.length > 0 ? (
                    <div className="empty-state-switch">
                      {otherTabMatches.map(({ tab, count }) => (
                        <button
                          key={tab.id}
                          className="primary-button"
                          onClick={() => {
                            setStatus(tab.id);
                            setShowAll(false);
                          }}
                        >
                          {count} match{count === 1 ? "" : "es"} in {tab.label}
                          <Icon name="arrow" size={16} />
                        </button>
                      ))}
                      {(filters.freeOnly || filters.online || filters.location || filters.categories.length > 0) && (
                        <button className="clear-filter" onClick={() => changeFilters(emptyFilters)}>
                          Or clear filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      className="primary-button"
                      onClick={() => changeFilters(emptyFilters)}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
              {!showAll && results.length > visibleResults.length && (
                <div className="browse-more">
                  <p>
                    That’s plenty to start with. There’s more here if you’re
                    curious.
                  </p>
                  <button onClick={() => setShowAll(true)}>
                    Show {results.length - visibleResults.length} more
                    <Icon name="arrow" size={16} />
                  </button>
                </div>
              )}
              <div className="next-up">
                <div className="next-up-icon">
                  <Icon name="calendar" size={25} />
                </div>
                <div>
                  <h3>You don’t have to plan the whole year today.</h3>
                  <p>
                    Your timeline is here whenever you feel ready to look ahead.
                  </p>
                </div>
                <button onClick={exploreTimeline}>
                  Have a look ahead
                  <Icon name="arrow" size={18} />
                </button>
              </div>
            </>
          ) : (
            <Timeline items={filtered} onDetails={setSelected} academicYear={academicYear} />
          )}
          <p className="data-caption">
            Academic year: September {academicYear} – August {academicYear + 1} · Statuses are
            calculated live against today, {formatDate(today, true)}. The underlying data was
            last verified {formatDate(REFERENCE_DATE, true)}.<br />
            Reminder choices stay on this device. This site does not send emails or
            notifications.
          </p>
        </section>
          </>
        )}
      </main>
      <footer className="page-width">
        <span className="footer-brand">
          Your Economics Year
          <span>A little more informed. A little more inspired.</span>
        </span>
        <p>Built for curious minds, not perfect CVs.</p>
        <span className="footer-note">
          An Economics-only MVP <span>↗</span>
        </span>
      </footer>
      {selected && (
        <OpportunityDialog
          item={selected}
          saved={saved.includes(selected.id)}
          onRemind={toggleReminder}
          onClose={() => setSelected(null)}
        />
      )}
      <dialog
        ref={aboutDialog}
        className="detail-dialog about-dialog"
        aria-labelledby="about-title"
        onCancel={() => setAbout(false)}
        onClick={(event) => {
          if (event.target === aboutDialog.current) setAbout(false);
        }}
      >
        <div className="dialog-inner">
          <button
            className="dialog-close"
            aria-label="Close about"
            onClick={() => setAbout(false)}
          >
            <Icon name="close" />
          </button>
          <p className="eyebrow">A LITTLE CONTEXT</p>
          <h2 id="about-title">
            Your subject.
            <br />
            Your year.
          </h2>
          <p>
            A planner for UK Year 12 students interested in Economics at
            university. Find useful things to do beyond the classroom,
            understand who can take part, and see when to act.
          </p>
          <h3>How the data is checked</h3>
          <p>
            Every opportunity, provider, date, cost and eligibility rule links to a real, official
            page and shows when we last checked it. Where a provider hasn't published next-cycle
            dates yet, we either show real dates from a documented previous cycle — clearly
            labelled "based on last cycle, not confirmed" — or a plain note that it's expected to
            return, with no invented date. Open/Coming soon/Watchlist statuses are calculated
            live against today's date, not a fixed snapshot — the underlying data itself was
            last verified {formatDate(REFERENCE_DATE, true)}.
          </p>
          <h3>What do the tabs mean?</h3>
          <p>
            <strong>Open now:</strong> you can apply or register right now.
            <br />
            <strong>Coming soon:</strong> confirmed to return, with at least some date evidence.
            <br />
            <strong>Watchlist:</strong> a recurring opportunity whose next dates aren't confirmed
            yet.
          </p>
          <h3>A note on reminders</h3>
          <p>
            “Remind me” saves your choice in this browser on this device. It
            does not send an email, schedule a notification or monitor an
            opportunity. Tap it again to remove your choice.
          </p>
          <h3>Sending to your teacher</h3>
          <p>
            This copies a short message to your clipboard, with a link to the official page, so
            you can paste it into an email, message or form yourself. Nothing is sent
            automatically.
          </p>
        </div>
      </dialog>
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="toast">
            <Icon name="check" size={20} />
            <p>{toast}</p>
            <button aria-label="Dismiss message" onClick={() => setToast("")}>
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
