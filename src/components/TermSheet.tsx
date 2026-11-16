import type { Opportunity } from "../types/opportunity";
import { formatDate } from "../lib/opportunities";
import { costLabel, dayParts, needsTeacher, numberWord, placeLabel, shortProvider } from "../lib/display";
import { termSheet, type Term } from "../lib/terms";

const host = (item: Opportunity) => new URL(item.officialUrl).hostname.replace("www.", "");

function Who({ item }: { item: Opportunity }) {
  if (item.requiresSchoolNomination) return <strong>School nominates</strong>;
  if (item.requiresTeacher) return <strong>Teacher registers</strong>;
  return <>Student</>;
}

function Line({ item }: { item: Opportunity }) {
  return (
    <>
      <span className="ps-name">{item.name}</span>
      <span className="ps-sub">
        {shortProvider(item) !== item.name && <>{shortProvider(item)} · </>}
        {placeLabel(item)} · {costLabel(item)} ·{" "}
        <a href={item.officialUrl}>{host(item)}</a>
      </span>
    </>
  );
}

// A one-page (or two) list for a staffroom wall or an email to students. Only shown when
// printing; the browser's print window saves it as a PDF.
export function TermSheet({ items, term, today, siteUrl }: { items: Opportunity[]; term: Term; today: string; siteUrl: string }) {
  const sheet = termSheet(items, term, today);
  const teacherCount = sheet.dated.filter((row) => needsTeacher(row.item)).length;
  return (
    <div className="print-sheet">
      <header className="ps-head">
        <p className="ps-kicker">Your Economics Year · for Year 12 Economics</p>
        <h1>{term.name}: what's on</h1>
        <p className="ps-intro">
          Competitions, lectures, courses and work experience for Year 12 students interested in Economics, with a confirmed
          date this term{today > term.start ? ` (from ${formatDate(today, true)})` : ""}.
          {teacherCount > 0 &&
            ` ${numberWord(teacherCount)} of them ${teacherCount === 1 ? "needs" : "need"} a teacher to register the school or nominate students.`}
        </p>
      </header>

      {sheet.dated.length > 0 && (
        <table className="ps-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>What</th>
              <th>Key dates</th>
              <th>Who signs up</th>
            </tr>
          </thead>
          <tbody>
            {sheet.dated.map(({ item, date, when }) => {
              const parts = dayParts(date);
              return (
                <tr key={item.id}>
                  <td className="ps-date">
                    {parts.day !== "–" && <strong>{parts.day}</strong>} {parts.month}
                  </td>
                  <td>
                    <Line item={item} />
                  </td>
                  <td className="ps-when">{when[0].toUpperCase() + when.slice(1)}</td>
                  <td className="ps-who">
                    <Who item={item} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {sheet.expected.length > 0 && (
        <section className="ps-section">
          <h2>Likely this term, dates not announced yet</h2>
          <p className="ps-note">These ran around this time last year. Check the official page before telling students a date.</p>
          <ul>
            {sheet.expected.map(({ item, lastYear }) => (
              <li key={item.id}>
                <Line item={item} /> <span className="ps-sub">· Last year: {formatDate(lastYear.slice(0, 7))} · <Who item={item} /></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sheet.anytime.length > 0 && (
        <section className="ps-section">
          <h2>Any time</h2>
          <ul>
            {sheet.anytime.map((item) => (
              <li key={item.id}>
                <Line item={item} /> <span className="ps-sub">· <Who item={item} /></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="ps-foot">
        Made {formatDate(today, true)} from {siteUrl.replace(/^https?:\/\//, "")}, where students can save these and add the
        dates to their calendar. Dates come from each organiser's official page; check there before committing. Independent,
        not affiliated with any organiser.
      </footer>
    </div>
  );
}
