import { useState, type ReactNode } from "react";
import type { Opportunity } from "../types/opportunity";
import { formatDate } from "../lib/opportunities";
import { costLabel, dayParts, listDate, needsTeacher, placeLabel, shortProvider } from "../lib/display";
import { buildPlan, recordText, stepLabel, stepPhrase, type PlanEntry, type PlanStep, type Progress, type ProgressMap } from "../lib/plan";
import { buildCalendar } from "../lib/calendar";
import { Icon } from "./Icon";

const daysUntil = (date: string, today: string) =>
  Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86400000);

function inDays(date: string, today: string): string | null {
  if (date.length !== 10) return null;
  const days = daysUntil(date, today);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return days <= 14 ? `in ${days} days` : null;
}

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
      {placeLabel(item)} · {item.costType === "free" ? <mark className="hl-free">free</mark> : costLabel(item).toLowerCase()}
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
  today,
  progress,
  onProgress,
  onOpen,
  onRemove,
  onBrowse,
  onToast,
}: {
  items: Opportunity[];
  today: string;
  progress: ProgressMap;
  onProgress: (id: string, entry: Progress) => void;
  onOpen: (item: Opportunity) => void;
  onRemove: (id: string) => void;
  onBrowse: () => void;
  onToast: (message: string) => void;
}) {
  const plan = buildPlan(items, today, progress);
  const calendar = buildCalendar([...plan.upcoming.map((entry) => entry.item)], today, new Date().toISOString());
  const [copied, setCopied] = useState(false);

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
      await navigator.clipboard.writeText(recordText(plan.done, progress));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      onToast("Couldn't copy here. Select the notes and copy them yourself.");
    }
  }

  if (!items.length) {
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
        {plan.done.length > 0 && (
          <button className="btn btn-plain" onClick={copyRecord}>
            <Icon name={copied ? "check" : "book"} size={16} /> {copied ? "Copied" : "Copy my notes"}
          </button>
        )}
      </div>
      {calendar.count > 0 && (
        <p className="plan-hint">Works with Google, Apple and Outlook calendars, with a reminder 3 days before each deadline.</p>
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
      </div>
    </div>
  );
}
