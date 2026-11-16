import { useState, type ReactNode } from "react";
import type { Opportunity } from "../types/opportunity";
import { formatDate } from "../lib/opportunities";
import { costInline, dayParts, inDays, listDate, needsTeacher, placeLabel, shortProvider } from "../lib/display";
import {
  buildPlan,
  confirmedSteps,
  recordText,
  stepLabel,
  stepPhrase,
  type PlanEntry,
  type PlanStep,
  type Progress,
  type ProgressMap,
} from "../lib/plan";
import { buildCalendar } from "../lib/calendar";
import type { DateNews } from "../lib/news";
import { savedSummary, suggestions } from "../lib/suggest";
import type { Resource } from "../data/resources";
import { Icon } from "./Icon";

const resourceKind: Record<Resource["kind"], string> = { book: "Book", podcast: "Podcast", course: "Free course", website: "Website" };

function DateBox({ date, top }: { date: string | null; top?: string }) {
  const parts = date ? dayParts(date) : null;
  return (
    <div className="listing-date" aria-hidden="true">
      <span>{top ?? parts?.weekday ?? "DATE"}</span>
      <strong>{parts?.day ?? "–"}</strong>
      <span>{parts?.month ?? "TBC"}</span>
    </div>
  );
}

function Meta({ item }: { item: Opportunity }) {
  return (
    <>
      {shortProvider(item) !== item.name && <>{shortProvider(item)} · </>}
      {placeLabel(item)} · {item.costType === "free" ? <mark className="hl-free">free</mark> : costInline(item)}
      {item.timeNeeded && (
        <>
          {" "}· <span className="nowrap">{item.timeNeeded}</span>
        </>
      )}
      {needsTeacher(item) && <span className="teacher-line"> · your teacher signs you up</span>}
    </>
  );
}

function Row({
  item,
  box,
  meta,
  children,
  onOpen,
  onRemove,
  muted,
}: {
  item: Opportunity;
  box: ReactNode;
  meta: ReactNode;
  children?: ReactNode;
  onOpen: (item: Opportunity) => void;
  onRemove: (id: string) => void;
  muted?: boolean;
}) {
  return (
    <article className={`listing ${muted ? "is-last-year" : ""}`}>
      {box}
      <div className="listing-body">
        <h3>
          <button onClick={() => onOpen(item)}>{item.name}</button>
        </h3>
        <p className="listing-meta">{meta}</p>
        {children}
      </div>
      <button className="save" aria-label={`Remove ${item.name} from your year`} title="Remove from your year" onClick={() => onRemove(item.id)}>
        <Icon name="close" size={16} />
      </button>
    </article>
  );
}

const thenLine = (later: PlanStep[]) => (later.length ? ` · then ${later.slice(0, 2).map(stepPhrase).join(", ")}` : "");

export function YearPlan({
  items,
  all,
  today,
  progress,
  onProgress,
  readDone,
  readProgress,
  onReadProgress,
  news,
  onAcknowledge,
  onOpen,
  onSave,
  onRemove,
  onBrowse,
  onRead,
  onToast,
}: {
  items: Opportunity[];
  // Everything on the site, for suggestions.
  all: Opportunity[];
  today: string;
  progress: ProgressMap;
  onProgress: (id: string, entry: Progress) => void;
  // Books, podcasts and courses ticked off in Read & listen.
  readDone: Resource[];
  readProgress: ProgressMap;
  onReadProgress: (id: string, entry: Progress) => void;
  news: DateNews[];
  onAcknowledge: () => void;
  onOpen: (item: Opportunity) => void;
  onSave: (id: string) => void;
  onRemove: (id: string) => void;
  onBrowse: () => void;
  onRead: () => void;
  onToast: (message: string) => void;
}) {
  const plan = buildPlan(items, today, progress);
  const calendar = buildCalendar([...plan.upcoming.map((entry) => entry.item)], today, new Date().toISOString());
  const [copied, setCopied] = useState(false);
  const tips = suggestions(items, all, today);
  const readNudge = items.length >= 2 && readDone.length === 0;

  const markDone = (id: string) => onProgress(id, { done: true, note: progress[id]?.note ?? "", doneOn: today });
  // Keeps the note, in case it was ticked by mistake.
  const undo = (id: string) => onProgress(id, { done: false, note: progress[id]?.note ?? "", doneOn: "" });

  function downloadCalendar() {
    const url = URL.createObjectURL(new Blob([calendar.ics], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "your-economics-year.ics";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    onToast(`Downloaded ${calendar.count} ${calendar.count === 1 ? "date" : "dates"}. Open the file to add them to your calendar.`);
  }

  async function copyRecord() {
    try {
      await navigator.clipboard.writeText(recordText(plan.done, progress, readDone, readProgress));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      onToast("Couldn't copy here. Select the notes and copy them yourself.");
    }
  }

  if (!items.length && !readDone.length) {
    return (
      <div className="page">
        <h1 className="page-title">Your year</h1>
        <div className="empty">
          <h2>Nothing saved yet.</h2>
          <p>
            Tap the bookmark next to anything that looks interesting. It'll appear here in the order you need to act, with
            a button to put the dates in your calendar.
          </p>
          <div className="empty-actions">
            <button className="btn btn-ink" onClick={onBrowse}>
              See what's open <Icon name="arrow" size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Coming up, grouped by the month of each thing's next step.
  const months = new Map<string, PlanEntry[]>();
  for (const entry of plan.upcoming) {
    const key = entry.next.date.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), entry]);
  }

  return (
    <div className="page">
      <h1 className="page-title">Your year</h1>
      <p className="page-intro">
        Everything you've saved, in the order you need to act. It's kept in this browser on this device: no account, and
        nothing is sent anywhere.
      </p>

      <div className="plan-actions">
        {calendar.count > 0 && (
          <button className="btn btn-ink" onClick={downloadCalendar}>
            <Icon name="calendar" size={16} /> Add {calendar.count} {calendar.count === 1 ? "date" : "dates"} to my calendar
          </button>
        )}
        {(plan.done.length > 0 || readDone.length > 0) && (
          <button className="btn btn-plain" onClick={copyRecord}>
            <Icon name={copied ? "check" : "book"} size={16} /> {copied ? "Copied" : "Copy my notes"}
          </button>
        )}
      </div>
      {calendar.count > 0 && (
        <p className="plan-hint">Works with Google, Apple and Outlook calendars, with a reminder 3 days before each deadline.</p>
      )}

      {news.length > 0 && (
        <section className="plan-alert plan-news" aria-labelledby="plan-news-title">
          <h2 id="plan-news-title">
            <Icon name="spark" size={16} /> {news.every((entry) => entry.kind === "changed") ? "Dates have changed" : "Dates are out"}
          </h2>
          <ul>
            {news.map(({ item, kind }) => {
              const ahead = confirmedSteps(item).filter((step) => step.date >= today.slice(0, step.date.length));
              return (
                <li key={item.id}>
                  <button className="link-button" onClick={() => onOpen(item)}>
                    <strong>{item.name}</strong>
                  </button>
                  : {kind === "announced" ? "this year's dates are confirmed" : "the dates have moved"}
                  {ahead.length > 0 && <>, {ahead.slice(0, 2).map(stepPhrase).join(", ")}</>}.
                </li>
              );
            })}
          </ul>
          <button className="text-button plan-news-ok" onClick={onAcknowledge}>
            Got it
          </button>
        </section>
      )}

      {(plan.soon.length > 0 || plan.clashes.length > 0) && (
        <section className="plan-alert" aria-labelledby="plan-alert-title">
          <h2 id="plan-alert-title">
            <Icon name="bell" size={16} /> Next two weeks
          </h2>
          <ul>
            {plan.soon.map(({ item, next }) => (
              <li key={item.id}>
                <strong>{item.name}</strong>: {stepPhrase(next)} ({inDays(next.date, today)})
              </li>
            ))}
            {plan.clashes.map((clash) => (
              <li key={clash.date} className="plan-clash">
                <strong>Same day, {formatDate(clash.date)}:</strong> {clash.items.map((item) => item.name).join(" and ")}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="page-list">
        {[...months.entries()].map(([month, entries]) => (
          <section className="list-section" key={month} aria-labelledby={`plan-${month}`}>
            <header className="section-head">
              <h2 id={`plan-${month}`}>{formatDate(month)}</h2>
            </header>
            {entries.map(({ item, next, later }) => {
              const soon = inDays(next.date, today);
              return (
                <Row
                  key={item.id}
                  item={item}
                  box={<DateBox date={next.date} />}
                  meta={
                    <>
                      <span className="listing-kind">{stepLabel(next)}</span>
                      {soon && <span className="plan-soon"> · {soon}</span>}
                      {thenLine(later)} · <Meta item={item} />
                    </>
                  }
                  onOpen={onOpen}
                  onRemove={onRemove}
                >
                  <div className="plan-row-actions">
                    <button className="text-button" onClick={() => markDone(item.id)}>
                      Mark as done
                    </button>
                  </div>
                </Row>
              );
            })}
          </section>
        ))}

        {plan.anytime.length > 0 && (
          <section className="list-section" aria-labelledby="plan-anytime">
            <header className="section-head">
              <h2 id="plan-anytime">Any time</h2>
              <span>no fixed dates</span>
            </header>
            {plan.anytime.map((item) => (
              <Row key={item.id} item={item} box={<DateBox date={null} top="ANY" />} meta={<Meta item={item} />} onOpen={onOpen} onRemove={onRemove}>
                <div className="plan-row-actions">
                  <button className="text-button" onClick={() => markDone(item.id)}>
                    Mark as done
                  </button>
                </div>
              </Row>
            ))}
          </section>
        )}

        {plan.notAnnounced.length > 0 && (
          <section className="list-section" aria-labelledby="plan-tba">
            <header className="section-head">
              <h2 id="plan-tba">Dates not announced yet</h2>
              <span>these move up when dates are confirmed</span>
            </header>
            {plan.notAnnounced.map((item) => {
              const last = listDate(item);
              return (
                <Row
                  key={item.id}
                  item={item}
                  muted
                  box={<DateBox date={last?.date ?? null} top={last ? "LAST YR" : undefined} />}
                  meta={
                    <>
                      <span className="listing-kind">
                        {last ? `Last year: ${formatDate(last.date.slice(0, 7))}` : "No date yet"}
                      </span>{" "}
                      · <Meta item={item} />
                    </>
                  }
                  onOpen={onOpen}
                  onRemove={onRemove}
                />
              );
            })}
          </section>
        )}

        {(tips.length > 0 || readNudge) && (
          <section className="list-section" aria-labelledby="plan-suggest">
            <header className="section-head">
              <h2 id="plan-suggest">To round out your year</h2>
            </header>
            {tips.length > 0 && <p className="plan-hint suggest-intro">{savedSummary(items)} A mix tells a better story than more of the same.</p>}
            {tips.map(({ kind, missing, why, item, next }) => (
              <article className="suggestion" key={kind}>
                <p className="suggestion-why">
                  <strong>{missing}</strong> {why}
                </p>
                <div className="suggestion-pick">
                  <div>
                    <button className="suggestion-name" onClick={() => onOpen(item)}>
                      {item.name}
                    </button>
                    <p className="listing-meta">
                      <span className="listing-kind">{next ? stepPhrase(next)[0].toUpperCase() + stepPhrase(next).slice(1) : "Open now"}</span> ·{" "}
                      <Meta item={item} />
                    </p>
                  </div>
                  <button className="btn btn-plain btn-small" onClick={() => onSave(item.id)}>
                    <Icon name="bookmark" size={14} /> Save
                  </button>
                </div>
              </article>
            ))}
            {readNudge && (
              <article className="suggestion">
                <p className="suggestion-why">
                  <strong>Nothing from Read &amp; listen yet.</strong> A podcast on the bus counts, and it gives you something to
                  talk about at interview.
                </p>
                <button className="text-button" onClick={onRead}>
                  Find one in Read &amp; listen
                </button>
              </article>
            )}
          </section>
        )}

        {plan.finished.length > 0 && (
          <section className="list-section" aria-labelledby="plan-finished">
            <header className="section-head">
              <h2 id="plan-finished">Finished. Did you take part?</h2>
            </header>
            {plan.finished.map((item) => (
              <Row key={item.id} item={item} muted box={<DateBox date={listDate(item)?.date ?? null} />} meta={<Meta item={item} />} onOpen={onOpen} onRemove={onRemove}>
                <div className="plan-row-actions">
                  <button className="btn btn-plain btn-small" onClick={() => markDone(item.id)}>
                    <Icon name="check" size={14} /> Yes, I did
                  </button>
                  <button className="btn btn-plain btn-small" onClick={() => onRemove(item.id)}>
                    No, remove it
                  </button>
                </div>
              </Row>
            ))}
          </section>
        )}

        {plan.done.length > 0 && (
          <section className="list-section" aria-labelledby="plan-done">
            <header className="section-head">
              <h2 id="plan-done">Done</h2>
              <span>{plan.done.length} so far</span>
            </header>
            <p className="plan-hint">
              Jot down what you learned, made or argued, while you still remember. A line or two is plenty. It's what
              you'll want when you write your UCAS personal statement or prepare for an interview.
            </p>
            {plan.done.map((item) => {
              const entry = progress[item.id];
              return (
                <Row
                  key={item.id}
                  item={item}
                  box={<DateBox date={entry?.doneOn || null} top="DONE" />}
                  meta={<Meta item={item} />}
                  onOpen={onOpen}
                  onRemove={onRemove}
                >
                  <label className="plan-note">
                    <span className="sr-only">Your notes on {item.name}</span>
                    <textarea
                      rows={3}
                      value={entry?.note ?? ""}
                      placeholder="What did you learn, make or argue? Anything that surprised you?"
                      onChange={(event) => onProgress(item.id, { done: true, doneOn: entry?.doneOn ?? today, note: event.target.value })}
                    />
                  </label>
                  <div className="plan-row-actions">
                    <button className="text-button" onClick={() => undo(item.id)}>
                      Not done yet
                    </button>
                  </div>
                </Row>
              );
            })}
          </section>
        )}

        {readDone.length > 0 && (
          <section className="list-section" aria-labelledby="plan-read">
            <header className="section-head">
              <h2 id="plan-read">Read &amp; listened</h2>
              <span>{readDone.length} so far</span>
            </header>
            {readDone.map((resource) => {
              const entry = readProgress[resource.id];
              return (
                <article className="listing" key={resource.id}>
                  <DateBox date={entry?.doneOn || null} top="DONE" />
                  <div className="listing-body">
                    <h3>
                      {resource.url ? (
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          {resource.title}
                        </a>
                      ) : (
                        resource.title
                      )}
                    </h3>
                    <p className="listing-meta">
                      {resourceKind[resource.kind]} · {resource.by}
                    </p>
                    <label className="plan-note">
                      <span className="sr-only">Your notes on {resource.title}</span>
                      <textarea
                        rows={2}
                        value={entry?.note ?? ""}
                        placeholder="One argument you'd push back on, or one thing that stuck."
                        onChange={(event) =>
                          onReadProgress(resource.id, { done: true, doneOn: entry?.doneOn || today, note: event.target.value })
                        }
                      />
                    </label>
                    <div className="plan-row-actions">
                      <button
                        className="text-button"
                        onClick={() => onReadProgress(resource.id, { done: false, note: entry?.note ?? "", doneOn: "" })}
                      >
                        Not done yet
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
