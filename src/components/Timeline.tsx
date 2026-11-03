import type { Opportunity } from "../types/opportunity";
import { academicMonths, timelineEntries } from "../lib/opportunities";
import { Listing } from "./Listing";
import { YearChart } from "./YearChart";

// Listing labels are one short phrase ("Deadline", "Starts").
function shortLabel(label: string): string {
  const kind = label.split(" · ")[0];
  const words: Record<string, string> = {
    "Applications open": "Opens",
    "Application deadline": "Deadline",
    "Event starts": "Starts",
    "Event ends": "Ends",
    "Applications opened": "Opened",
    Deadline: "Deadline",
    "Event started": "Started",
    "Event ended": "Ended",
  };
  return words[kind] ?? kind;
}

// "Your year": every dated moment, September to August, under month headings. Confirmed
// dates are plain; dates taken from last year are marked "last year" with a dashed date box.
export function Timeline({
  items,
  allItems,
  academicYear,
  today,
  saved,
  onOpen,
  onSave,
}: {
  items: Opportunity[];
  allItems: Opportunity[];
  academicYear: number;
  today: string;
  saved: string[];
  onOpen: (item: Opportunity) => void;
  onSave: (id: string) => void;
}) {
  const entries = timelineEntries(items, academicYear);
  return (
    <div className="page">
      <h1 className="page-title">
        Your year, {academicYear}–{String(academicYear + 1).slice(2)}
      </h1>
      <p className="page-intro">
        Every date on the site, month by month. Entries marked “last year” show roughly when something usually
        happens; they aren't confirmed for this year.
      </p>
      <div className="page-chart">
        <YearChart items={allItems} academicYear={academicYear} today={today} />
      </div>
      <div className="page-list">
        {academicMonths(academicYear).map((month) => {
          const inMonth = entries.filter((entry) => entry.date.startsWith(month.date));
          const isNow = today.startsWith(month.date);
          return (
            <section className="list-section" key={month.date} aria-labelledby={`m-${month.date}`}>
              <header className="section-head">
                <h2 id={`m-${month.date}`}>{month.label}</h2>
                <span>{isNow ? "this month" : inMonth.length ? `${inMonth.length} dated` : "nothing dated"}</span>
              </header>
              {inMonth.map((entry) => (
                <Listing
                  key={`${entry.opportunity.id}-${entry.label}`}
                  item={entry.opportunity}
                  today={today}
                  saved={saved.includes(entry.opportunity.id)}
                  dateOverride={{
                    date: entry.date,
                    label: entry.estimated ? `${shortLabel(entry.label)} last year` : shortLabel(entry.label),
                    lastYear: entry.estimated,
                  }}
                  onOpen={onOpen}
                  onSave={onSave}
                />
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
