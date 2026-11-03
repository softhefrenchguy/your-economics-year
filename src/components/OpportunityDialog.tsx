import { useEffect, useRef, useState } from "react";
import type { Opportunity } from "../types/opportunity";
import { formatDate } from "../lib/opportunities";
import { costLabel, needsTeacher, teacherMessage, whenLabel } from "../lib/display";
import { Icon } from "./Icon";

function confidenceLabel(item: Opportunity): string {
  if (item.status === "open" || item.status === "closed") return "Confirmed";
  if (item.dateConfidence === "confirmed") return "Confirmed";
  if (item.dateConfidence === "previous-cycle") return "Last year's dates · not confirmed";
  return "Expected back · no date yet";
}

const statusName: Record<Opportunity["status"], string> = {
  open: "Open now",
  "coming-soon": "Coming soon",
  watchlist: "Watchlist",
  closed: "Closed",
};

export function OpportunityDialog({
  item,
  saved,
  onSave,
  onClose,
}: {
  item: Opportunity;
  saved: boolean;
  onSave: (id: string) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const element = dialog.current!;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      trigger?.focus({ preventScroll: true });
    };
  }, []);
  const dates = [
    ["Applications open", item.applicationsOpen],
    ["Application deadline", item.applicationDeadline],
    ["Starts", item.eventStart],
    ["Ends", item.eventEnd !== item.eventStart ? item.eventEnd : null],
  ].filter((date): date is [string, string] => !!date[1]);
  const cycle = item.previousCycle;
  const cycleDates = cycle
    ? ([
        ["Applications opened", cycle.applicationsOpen],
        ["Application deadline", cycle.applicationDeadline],
        ["Started", cycle.eventStart],
        ["Ended", cycle.eventEnd],
      ].filter((date): date is [string, string] => !!date[1]) as [string, string][])
    : [];
  const canApply = item.status === "open" && !needsTeacher(item);
  return (
    <dialog
      ref={dialog}
      className="sheet detail"
      aria-labelledby="detail-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <div className="sheet-inner">
        <button className="sheet-close" aria-label="Close details" onClick={onClose}>
          <Icon name="close" />
        </button>
        <p className="detail-chips">
          <span className={`chip ${item.status === "open" ? "chip-accent" : ""}`}>{statusName[item.status]}</span>
          <span className="chip">{whenLabel(item)}</span>
          <span className="chip">{costLabel(item)}</span>
        </p>
        <h2 id="detail-title">{item.name}</h2>
        <p className="detail-provider">{item.provider}</p>

        <div className="detail-actions">
          {canApply && (
            <a className="btn btn-primary" href={item.officialUrl} target="_blank" rel="noopener noreferrer">
              Apply on the official site <Icon name="arrow" size={16} />
            </a>
          )}
          <button className={`btn btn-icon ${saved ? "is-on" : ""}`} aria-pressed={saved} onClick={() => onSave(item.id)}>
            <Icon name={saved ? "check" : "bookmark"} size={17} />
            <span>{saved ? "On my list" : "Add to my list"}</span>
          </button>
        </div>

        <p className="detail-lead">{item.description}</p>
        <h3>What you get out of it</h3>
        <p>{item.whyRelevant}</p>

        <h3>Can I take part?</h3>
        <p>{item.eligibilityDetails || item.eligibilitySummary}</p>
        {item.wideningParticipation && (
          <p className="note-line">This is an access programme for students from groups under-represented at university.</p>
        )}
        {needsTeacher(item) && (
          <div className="teacher-box">
            <p>
              {item.requiresTeacher
                ? "You can't enter this yourself. Your Economics teacher has to register your school."
                : "You can't apply on your own. Your school has to nominate you."}
            </p>
            <button
              className="btn btn-ghost"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(teacherMessage(item));
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2500);
                } catch {
                  setCopied(false);
                }
              }}
            >
              <Icon name={copied ? "check" : "mail"} size={16} />
              {copied ? "Copied. Paste it to your teacher" : "Copy message for my teacher"}
            </button>
          </div>
        )}

        <h3>Where and how much</h3>
        <p>
          {item.location} · {item.deliveryMode === "hybrid" ? "in person or online" : item.deliveryMode.replace("-", " ")} ·{" "}
          {item.costType === "free" ? "free to take part" : item.costType === "unknown" ? "cost not listed on the official page" : `£${item.costAmount}`}
        </p>
        {item.financialSupport && <p>{item.financialSupport}</p>}

        <h3>
          When <span className={`confidence confidence-${item.dateConfidence}`}>{confidenceLabel(item)}</span>
        </h3>
        {dates.length > 0 ? (
          <dl className="dates">
            {dates.map(([label, date]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{formatDate(date, true)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          item.expectedWindow && <p>{item.expectedWindow}</p>
        )}
        {cycle && (
          <div className="last-cycle">
            <p>
              <strong>{cycle.label}</strong>, for reference only. Not confirmed for this year.
            </p>
            {cycleDates.length > 0 && (
              <dl className="dates">
                {cycleDates.map(([label, date]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{formatDate(date, true)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {cycle.notes && <p>{cycle.notes}</p>}
          </div>
        )}

        <p className="source">
          <Icon name="info" size={16} />
          <span>
            Official page:{" "}
            <a href={item.officialUrl} target="_blank" rel="noopener noreferrer">
              {new URL(item.officialUrl).hostname.replace("www.", "")}
            </a>
            , last checked {formatDate(item.sourceLastChecked, true)}. Always apply there; this site just helps you find it.
          </span>
        </p>
        <p className="topics">
          {item.topics.map((topic) => (
            <span key={topic}>{topic}</span>
          ))}
        </p>
      </div>
    </dialog>
  );
}
