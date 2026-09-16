import type { Opportunity } from "../types/opportunity";
import {
  academicMonths,
  formatDate,
  timelineEntries,
} from "../lib/opportunities";
import { Icon } from "./Icon";

export function Timeline({
  items,
  onDetails,
  academicYear,
}: {
  items: Opportunity[];
  onDetails: (item: Opportunity) => void;
  academicYear: number;
}) {
  const entries = timelineEntries(items, academicYear);
  return (
    <div className="timeline">
      <p className="timeline-explainer">
        <Icon name="info" size={17} />
        Solid entries are confirmed dates from official sources. Dashed entries are based on a
        previous cycle and are not confirmed for 2026–27. Filters also apply to this timeline.
      </p>
      {academicMonths(academicYear).map((month) => {
        const events = entries.filter((entry) =>
          entry.date.startsWith(month.date),
        );
        return (
          <section
            className="timeline-month"
            id={`month-${month.date}`}
            key={month.date}
          >
            <div className="month-label">
              <span className="month-dot" />
              <h3>{month.label.split(" ")[0]}</h3>
              <span>{month.label.split(" ")[1]}</span>
            </div>
            <div className="month-events">
              {events.length ? (
                events.map((entry) => (
                  <button
                    className={`timeline-event ${entry.estimated ? "estimated" : ""}`}
                    onClick={() => onDetails(entry.opportunity)}
                    key={`${entry.opportunity.id}-${entry.label}`}
                  >
                    <span className="timeline-date">
                      {entry.estimated ? "TBC" : formatDate(entry.date)}
                    </span>
                    <span className="timeline-event-main">
                      <span className="event-kind">
                        {entry.label}
                        {entry.opportunity.status === "closed" ? " · closed" : ""}
                      </span>
                      <strong>{entry.opportunity.name}</strong>
                    </span>
                    <span className="timeline-cost">
                      {entry.opportunity.costType === "free"
                        ? "Free"
                        : entry.opportunity.costType === "unknown"
                          ? "Cost TBC"
                          : `£${entry.opportunity.costAmount}`}
                    </span>
                    <Icon name="arrow" size={17} />
                  </button>
                ))
              ) : (
                <p className="empty-month">
                  A little breathing room. No matching dates this month.
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
