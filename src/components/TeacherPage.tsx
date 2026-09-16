import type { Opportunity } from "../types/opportunity";
import { formatDate, teacherOpportunities } from "../lib/opportunities";
import { Icon } from "./Icon";

function whatsNeeded(item: Opportunity): string {
  if (item.requiresSchoolNomination) {
    if (item.status === "open" && item.applicationDeadline)
      return `Register your school by ${formatDate(item.applicationDeadline, true)}.`;
    if (item.status === "watchlist")
      return item.previousCycle
        ? `Not open yet — last cycle's teacher registration opened around ${item.previousCycle.applicationsOpen ? formatDate(item.previousCycle.applicationsOpen) : "the start of the school year"}. Not confirmed for 2026–27.`
        : "Not open for entries yet.";
    return "Register your school when applications open.";
  }
  return item.expectedWindow ?? "Contact the provider directly to arrange this.";
}

function costLine(item: Opportunity): string {
  if (item.costType === "free") return "Free to take part.";
  if (item.costType === "unknown") return item.financialSupport ?? "Cost isn't listed on the official page — confirm before committing.";
  return `£${item.costAmount} to take part.`;
}

function TeacherItem({ item }: { item: Opportunity }) {
  return (
    <article className="teacher-item">
      <div className="teacher-item-top">
        <div>
          <p className="provider">{item.provider}</p>
          <h3>{item.name}</h3>
        </div>
        <span className={`status-dot ${item.status}`} title={item.status} />
      </div>
      <p className="teacher-item-line">
        <Icon name="bell" size={14} /> {whatsNeeded(item)}
      </p>
      <p className="teacher-item-line">
        <Icon name="spark" size={14} /> {costLine(item)}
      </p>
      <p className="teacher-item-line">
        <Icon name="book" size={14} /> {item.eligibilitySummary}
      </p>
      <p className="relevance">
        <Icon name="spark" size={15} />
        <span>{item.teacherPitch}</span>
      </p>
      <div className="source-note">
        <Icon name="info" />
        <p>
          <strong>Official source: </strong>
          <a href={item.officialUrl} target="_blank" rel="noopener noreferrer">
            {new URL(item.officialUrl).hostname.replace("www.", "")}
          </a>
          <br />
          Checked {formatDate(item.sourceLastChecked, true)} — verify current details there before committing your
          department's time.
        </p>
      </div>
    </article>
  );
}

export function TeacherPage({ opportunities }: { opportunities: Opportunity[] }) {
  const { nominated, direct } = teacherOpportunities(opportunities);
  return (
    <section className="teacher-page page-width" aria-labelledby="teacher-title">
      <p className="eyebrow">FOR ECONOMICS TEACHERS</p>
      <h2 id="teacher-title">Five minutes for something a student wants to do</h2>
      <p className="teacher-intro">
        A student has likely pointed you here. This page collects every opportunity on this site that a student
        can't act on alone — because it needs your department to nominate or register the school, or because it's a
        booking only a staff member can make. Everything else on the site, a student can pursue independently.
      </p>
      {nominated.length > 0 && (
        <div className="teacher-group">
          <h3 className="teacher-group-title">Entered competitively through your school</h3>
          <p className="teacher-group-note">
            These have a selection or registration process run by the provider, not by the student. Some have
            application windows that are currently closed for new entrants — that's shown below.
          </p>
          <div className="teacher-item-grid">
            {nominated.map((item) => (
              <TeacherItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
      {direct.length > 0 && (
        <div className="teacher-group">
          <h3 className="teacher-group-title">You can arrange these directly, no selection process</h3>
          <p className="teacher-group-note">
            No competitive entry — just a booking or registration your department makes when it suits your
            timetable.
          </p>
          <div className="teacher-item-grid">
            {direct.map((item) => (
              <TeacherItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
      <p className="data-caption">
        This is an independent, student-built directory, not affiliated with any provider listed here. Each item
        links to its own official page — that page, not this one, is the source of truth on current dates and
        eligibility.
      </p>
    </section>
  );
}
