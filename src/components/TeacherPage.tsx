import type { Opportunity } from "../types/opportunity";
import { formatDate, teacherOpportunities } from "../lib/opportunities";
import { costLabel, statusName } from "../lib/display";
import { termsFrom, type Term } from "../lib/terms";
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
  // A fee that varies (by school type, say) has no single costAmount; its note says it in full.
  if (item.costAmount == null && item.financialSupport) return item.financialSupport;
  return `${costLabel(item)} to take part.`;
}

function TeacherItem({ item }: { item: Opportunity }) {
  return (
    <article className="teacher-item">
      <div className="teacher-item-top">
        <div>
          <p className="provider">{item.provider}</p>
          <h3>{item.name}</h3>
        </div>
        <span className={`status-pill status-${item.status}`}>{statusName[item.status]}</span>
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
      {item.teacherPitch && <p className="teacher-pitch">{item.teacherPitch}</p>}
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

export function TeacherPage({
  opportunities,
  today,
  onPrint,
}: {
  opportunities: Opportunity[];
  today: string;
  onPrint: (term: Term) => void;
}) {
  const { nominated, direct } = teacherOpportunities(opportunities);
  const terms = termsFrom(today);
  return (
    <section className="page teacher-page" aria-labelledby="teacher-title">
      <h1 className="page-title" id="teacher-title">For teachers: five minutes for something a student wants to do</h1>
      <p className="page-intro">
        A student has likely pointed you here. This page collects every opportunity on this site that a student
        can't act on alone — because it needs your department to nominate or register the school, or because it's a
        booking only a staff member can make. Everything else on the site, a student can pursue independently.
      </p>
      <div className="term-box">
        <div>
          <h2>A termly list to print or email</h2>
          <p>
            Everything with a date in the term on one page: what it is, when, the cost and who signs up. Opens your print
            window. Choose “Save as PDF” to get a file to email to students or pin up.
          </p>
        </div>
        <div className="term-buttons">
          {terms.map((term) => (
            <button key={term.key} className="btn btn-ink" onClick={() => onPrint(term)}>
              <Icon name="calendar" size={16} /> {term.name}
            </button>
          ))}
        </div>
      </div>
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
      <p className="teacher-caption">
        This is an independent, student-built directory, not affiliated with any provider listed here. Each item
        links to its own official page — that page, not this one, is the source of truth on current dates and
        eligibility.
      </p>
    </section>
  );
}
