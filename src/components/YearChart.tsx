import type { Opportunity } from "../types/opportunity";
import { academicMonths, timelineEntries } from "../lib/opportunities";

// The year at a glance, drawn from the data: solid ink bars are confirmed dates, dashed
// outlines are last year's dates (not confirmed). The current month is inked; a pen note says
// "you are here", and another marks last year's busiest month.
export function YearChart({ items, academicYear, today }: { items: Opportunity[]; academicYear: number; today: string }) {
  const entries = timelineEntries(items, academicYear);
  const months = academicMonths(academicYear).map((month) => {
    const inMonth = entries.filter((entry) => entry.date.startsWith(month.date));
    return {
      ...month,
      confirmed: inMonth.filter((entry) => !entry.estimated).length,
      lastYear: inMonth.filter((entry) => entry.estimated),
    };
  });
  const max = Math.max(4, ...months.map((m) => m.confirmed + m.lastYear.length));
  const unit = 84 / max;
  const slot = 30;
  const nowIndex = months.findIndex((m) => today.startsWith(m.date));
  const busiest = months.reduce((best, m, i) => (m.lastYear.length > months[best].lastYear.length ? i : best), 0);
  const busiestEntries = months[busiest].lastYear;
  const summer =
    busiestEntries.filter((entry) => entry.opportunity.type === "Summer school").length > busiestEntries.length / 2;
  const busyNote =
    busiestEntries.length >= 3 && busiest !== nowIndex
      ? summer
        ? "summer schools usually land here"
        : "busiest last year"
      : null;

  return (
    <figure className="year-chart">
      <div className="chart-frame">
        {nowIndex >= 0 && (
          <span className="pen chart-note" style={{ left: `${((nowIndex * slot + 4) / (slot * 12)) * 100}%` }} aria-hidden="true">
            ↓ you are here
          </span>
        )}
        {busyNote && (
          <span className="pen chart-note chart-note--right" style={{ right: `${((11 - busiest) * slot) / (slot * 12) * 100}%` }} aria-hidden="true">
            {busyNote} ↓
          </span>
        )}
        <svg viewBox={`0 0 ${slot * 12} 118`} role="img" aria-label={chartLabel(months)}>
          <line x1="0" y1="96" x2={slot * 12} y2="96" className="chart-axis" />
          {months.map((m, i) => {
            const x = i * slot + 4;
            const solid = m.confirmed * unit;
            const dashed = m.lastYear.length * unit;
            return (
              <g key={m.date}>
                {solid > 0 && <rect x={x} y={96 - solid} width={slot - 8} height={solid} className={i === nowIndex ? "bar-now" : "bar"} />}
                {dashed > 0 && <rect x={x + 0.75} y={96 - solid - dashed + 0.75} width={slot - 9.5} height={dashed - 1.5} className="bar-last-year" />}
                <text x={x + (slot - 8) / 2} y="112" textAnchor="middle" className={i === nowIndex ? "chart-month is-now" : "chart-month"}>
                  {m.label.charAt(0)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="chart-key">
        <span><i className="key-solid" />Confirmed dates</span>
        <span><i className="key-dashed" />Last year's dates, not confirmed</span>
      </figcaption>
    </figure>
  );
}

function chartLabel(months: { label: string; confirmed: number; lastYear: unknown[] }[]): string {
  const parts = months
    .filter((m) => m.confirmed || m.lastYear.length)
    .map((m) => `${m.label}: ${m.confirmed} confirmed${m.lastYear.length ? `, ${m.lastYear.length} from last year` : ""}`);
  return `Dated opportunities by month. ${parts.join("; ")}.`;
}
