import { useState } from "react";
import type { Opportunity } from "../types/opportunity";
import { actionDate, formatDate } from "../lib/opportunities";
import { Icon } from "./Icon";

export function teacherMessage(item: Opportunity): string {
  const ask = item.requiresSchoolNomination
    ? "Schools need to nominate students to take part."
    : "A teacher needs to register our school to take part.";
  return `Hi, I found ${item.name} (${item.provider}) for Year 12 students interested in Economics. ${ask} Would it be possible for our school to take part? Here's the official information: ${item.officialUrl}`;
}

function CopyTeacherMessageButton({ item }: { item: Opportunity }) {
  const [copied, setCopied] = useState(false);
  return (
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
      <Icon name={copied ? "check" : "mail"} size={14} />
      {copied ? "Message copied" : "Copy message for my teacher"}
      {!copied && <Icon name="arrow" size={14} />}
    </button>
  );
}

function statusNote(item: Opportunity): string | null {
  if (item.status === "open") return item.expectedWindow ?? null;
  if (item.status === "coming-soon") return item.expectedWindow ?? "Returning soon · exact dates not yet announced";
  if (item.status === "watchlist")
    return item.previousCycle
      ? `Based on the ${item.previousCycle.label} · not confirmed for 2026–27`
      : (item.expectedWindow ?? "Not yet confirmed for 2026–27");
  return null;
}
// True for an "open" item with rolling enrollment — no application window or event date at all,
// so "Apply by" / "Event starts" would be misleading.
function isRollingOpen(item: Opportunity): boolean {
  return item.status === "open" && !item.applicationDeadline && !item.eventStart && !item.applicationsOpen;
}

export function OpportunityCard({
  item,
  saved,
  onRemind,
  onDetails,
}: {
  item: Opportunity;
  saved: boolean;
  onRemind: (id: string) => void;
  onDetails: (item: Opportunity) => void;
}) {
  const needsTeacher = item.requiresTeacher || item.requiresSchoolNomination;
  const canRemind = item.status === "coming-soon" || item.status === "watchlist";
  const date = actionDate(item);
  const dateLabel =
    item.status === "watchlist"
      ? "Status"
      : item.status === "coming-soon"
        ? "Opens"
        : item.status === "closed"
          ? "Closed"
          : isRollingOpen(item)
            ? "Enrolment"
            : item.applicationDeadline
              ? "Apply by"
              : "Event starts";
  const colour =
    item.type.includes("competition") || item.type === "Competition"
      ? "peach"
      : item.type === "Work experience"
        ? "blue"
        : "lavender";
  const note = statusNote(item);
  return (
    <article className="opportunity-card">
      <div className="card-top">
        <span className={`type-badge ${colour}`}>{item.type}</span>
        <span className={`cost-badge ${item.costType === "free" ? "is-free" : ""}`}>
          {item.costType === "free" ? "Free" : item.costType === "unknown" ? "Cost not listed" : `£${item.costAmount}`}
        </span>
      </div>
      <p className="provider">{item.provider}</p>
      <button className="card-title" onClick={() => onDetails(item)}>
        <h3>{item.name}</h3>
      </button>
      <p className="relevance">
        <Icon name="spark" size={15} />
        <span>{item.whyRelevant}</span>
      </p>
      <div className="card-facts">
        <span>
          <Icon name="book" size={15} />
          {item.eligibilitySummary}
        </span>
        <span>
          <Icon name={item.deliveryMode === "online" ? "globe" : "pin"} size={15} />
          {item.deliveryMode === "online"
            ? "Online · UK-wide"
            : `${item.location} · ${item.deliveryMode === "hybrid" ? "Hybrid" : "In person"}`}
        </span>
      </div>
      {needsTeacher && (
        <div className="teacher-note">
          <strong>Start with your teacher</strong>
          <p>
            {item.requiresTeacher
              ? "You can't enter this yourself — ask your Economics teacher to register your school."
              : "You can't apply independently — ask your school to nominate you."}
          </p>
          <CopyTeacherMessageButton item={item} />
        </div>
      )}
      <div className="card-bottom">
        <div className="deadline">
          <span>{dateLabel}</span>
          <strong>{date ? formatDate(date) : (note ?? "Date to be confirmed")}</strong>
        </div>
        <div className="card-actions">
          <button className="card-detail-button" aria-label={`View ${item.name}`} onClick={() => onDetails(item)}>
            Details <Icon name="arrow" size={16} />
          </button>
          {item.status === "open" && !needsTeacher && (
            <a className="card-apply-button" href={item.officialUrl} target="_blank" rel="noopener noreferrer">
              Apply <Icon name="arrow" size={16} />
            </a>
          )}
        </div>
      </div>
      {canRemind && (
        <button className={`remind-button ${saved ? "saved" : ""}`} aria-pressed={saved} onClick={() => onRemind(item.id)}>
          <Icon name={saved ? "check" : "bell"} size={16} />
          {saved
            ? "Reminder saved · on this device"
            : item.status === "watchlist"
              ? "Watch the next cycle"
              : "Remind me when this opens"}
        </button>
      )}
      {!needsTeacher && !canRemind && (
        <p className="apply-note">{item.status === "closed" ? "Applications are closed" : "Apply yourself · no teacher registration"}</p>
      )}
    </article>
  );
}
