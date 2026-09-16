import { useEffect, useRef, useState } from "react";
import type { Opportunity } from "../types/opportunity";
import { formatDate } from "../lib/opportunities";
import { teacherMessage } from "./OpportunityCard";
import { Icon } from "./Icon";

function confidenceLabel(item: Opportunity): string {
  if (item.status === "open" || item.status === "closed") return "Confirmed";
  if (item.dateConfidence === "confirmed") return "Confirmed";
  if (item.dateConfidence === "previous-cycle") return "Based on last cycle · not confirmed";
  return "Expected to return · no date yet";
}

export function OpportunityDialog({
  item,
  saved,
  onRemind,
  onClose,
}: {
  item: Opportunity;
  saved: boolean;
  onRemind: (id: string) => void;
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
    ["Event starts", item.eventStart],
    ["Event ends", item.eventEnd],
  ].filter((date): date is [string, string] => !!date[1]);
  const cycle = item.previousCycle;
  const cycleDates = cycle
    ? ([
        ["Applications opened", cycle.applicationsOpen],
        ["Application deadline", cycle.applicationDeadline],
        ["Event started", cycle.eventStart],
        ["Event ended", cycle.eventEnd],
      ].filter((date): date is [string, string] => !!date[1]) as [string, string][])
    : [];
  return (
    <dialog
      ref={dialog}
      className="detail-dialog"
      aria-labelledby="detail-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <div className="dialog-inner">
        <button className="dialog-close" aria-label="Close opportunity details" onClick={onClose}>
          <Icon name="close" />
        </button>
        <span className="eyebrow">
          {item.type} · {item.status.replace("-", " ")}
        </span>
        <h2 id="detail-title">{item.name}</h2>
        <p className="provider">{item.provider}</p>
        <div className="source-note">
          <Icon name="info" />
          <p>
            <strong>Official source: </strong>
            <a href={item.officialUrl} target="_blank" rel="noopener noreferrer">
              {new URL(item.officialUrl).hostname.replace("www.", "")}
            </a>
            <br />
            Last checked {formatDate(item.sourceLastChecked, true)}. This site is a discovery layer, not the
            application processor — always apply on the official page.
          </p>
        </div>
        <p>{item.description}</p>
        <h3>What you'll get from it</h3>
        <p>{item.whyRelevant}</p>
        <h3>Can I take part?</h3>
        <p>{item.eligibilityDetails || item.eligibilitySummary}</p>
        {item.wideningParticipation && <span className="access-badge">Widening participation / access programme</span>}
        <h3>Where & how much?</h3>
        <p>
          {item.location} · {item.deliveryMode} ·{" "}
          {item.costType === "free" ? "Free to take part" : item.costType === "unknown" ? "Cost not listed on official page" : `£${item.costAmount}`}
        </p>
        {item.financialSupport && <p>{item.financialSupport}</p>}
        <h3>
          When? <span className={`confidence-tag confidence-${item.dateConfidence}`}>{confidenceLabel(item)}</span>
        </h3>
        {dates.length > 0 && (
          <dl className="detail-dates">
            {dates.map(([label, date]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{formatDate(date, true)}</dd>
              </div>
            ))}
          </dl>
        )}
        {item.expectedWindow && !dates.length && <p>{item.expectedWindow}</p>}
        {cycle && (
          <div className="previous-cycle">
            <p className="previous-cycle-heading">
              <strong>{cycle.label}</strong> — shown for context only, not confirmed for 2026–27
            </p>
            {cycleDates.length > 0 && (
              <dl className="detail-dates">
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
        <h3>Your next step</h3>
        {item.requiresTeacher || item.requiresSchoolNomination ? (
          <div className="teacher-note">
            <p>
              {item.requiresTeacher
                ? "You can't enter this yourself — ask your Economics teacher to register your school."
                : "Ask your school to nominate you; independent applications are not accepted."}
            </p>
            <button
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
              {copied ? "Message copied" : "Copy message for my teacher"}
            </button>
          </div>
        ) : (
          <p>
            {item.status === "closed"
              ? "This opportunity's most recent cycle has closed."
              : "Apply directly on the official page when applications are open. No teacher registration is needed."}
          </p>
        )}
        {(item.status === "coming-soon" || item.status === "watchlist") && (
          <>
            <button className={`remind-button ${saved ? "saved" : ""}`} aria-pressed={saved} onClick={() => onRemind(item.id)}>
              <Icon name={saved ? "check" : "bell"} />
              {saved ? "Reminder saved · tap to remove" : item.status === "watchlist" ? "Watch the next cycle" : "Remind me when this opens"}
            </button>
            <p className="small-note">Saved on this device only. This site does not send emails or notifications.</p>
          </>
        )}
        <div className="detail-tags">
          {item.topics.map((topic) => (
            <span key={topic}>{topic}</span>
          ))}
        </div>
      </div>
    </dialog>
  );
}
