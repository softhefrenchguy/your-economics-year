import type { ReactNode } from "react";
import type { Opportunity } from "../types/opportunity";
import type { Section } from "../lib/display";
import { costLabel, dayParts, listDate, needsTeacher, placeLabel, shortProvider, todayNote } from "../lib/display";
import { Icon } from "./Icon";

// One dated listing: big serif date on the left, title and a single meta line, save on the
// right. Today's listing gets the pale-yellow band, a red pen circle and a margin note.
export function Listing({
  item,
  today,
  saved,
  dateOverride,
  onOpen,
  onSave,
}: {
  item: Opportunity;
  today: string;
  saved: boolean;
  // The timeline passes the specific date and label it is listing this item under.
  dateOverride?: { date: string; label: string; lastYear: boolean };
  onOpen: (item: Opportunity) => void;
  onSave: (id: string) => void;
}) {
  const at = dateOverride ?? listDate(item);
  const parts = at ? dayParts(at.date) : null;
  const note = dateOverride ? null : todayNote(item, today);
  const canApply = item.status === "open" && !needsTeacher(item);
  return (
    <article className={`listing ${note ? "is-today" : ""} ${at?.lastYear ? "is-last-year" : ""} ${item.status === "closed" ? "is-closed" : ""}`}>
      <div className="listing-date" aria-hidden="true">
        {parts ? (
          <>
            <span>{at?.lastYear ? "LAST YR" : parts.weekday}</span>
            <strong>{parts.day}</strong>
            <span>{parts.month}</span>
          </>
        ) : (
          <>
            <span>ANY</span>
            <strong>–</strong>
            <span>TIME</span>
          </>
        )}
        {note && <i className="pen-circle" />}
      </div>
      <div className="listing-body">
        <h3>
          <button onClick={() => onOpen(item)}>{item.name}</button>
        </h3>
        <p className="listing-meta">
          {dateOverride && <span className="listing-kind">{dateOverride.label} · </span>}
          {shortProvider(item) !== item.name && <>{shortProvider(item)} · </>}
          {placeLabel(item)} ·{" "}
          {item.costType === "free" ? <mark className="hl-free">free</mark> : costLabel(item).toLowerCase()}
          {needsTeacher(item) && <span className="teacher-line"> · your teacher signs you up</span>}
          {item.status === "closed" && <span> · closed</span>}
        </p>
        {note && canApply && (
          <a className="btn btn-ink btn-small" href={item.officialUrl} target="_blank" rel="noopener noreferrer">
            Sign up on the official site <Icon name="arrow" size={15} />
          </a>
        )}
      </div>
      <button
        className={`save ${saved ? "is-on" : ""}`}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${item.name} from my list` : `Save ${item.name} to my list`}
        onClick={() => onSave(item.id)}
      >
        <Icon name={saved ? "check" : "bookmark"} size={18} />
      </button>
      {note && <span className="pen margin-note" aria-hidden="true">{note}</span>}
    </article>
  );
}

// Margin diagram jokes. At most two per list, so they stay funny.
const jokes: { text: ReactNode; drawing: ReactNode }[] = [
  {
    text: (
      <>
        supply of free lectures: high.
        <br />
        price: £0. you know what to do.
      </>
    ),
    drawing: (
      <>
        <path d="M6 3v50h66" />
        <path d="M12 10c16 10 32 26 52 36" />
        <path d="M12 48c18-10 34-28 52-38" className="pen-stroke" />
        <circle cx="38" cy="29" r="3" className="ink-fill" />
      </>
    ),
  },
  {
    text: (
      <>
        opportunity cost of one evening:
        <br />
        about one episode of something.
      </>
    ),
    drawing: (
      <>
        <path d="M6 3v50h66" />
        <path d="M8 8C38 8 66 26 66 53" />
        <circle cx="49" cy="20" r="3" className="pen-fill" />
        <path d="M49 20 34 36" className="pen-stroke" strokeDasharray="3 3" />
      </>
    ),
  },
];

export function Doodle({ index }: { index: number }) {
  const joke = jokes[index % jokes.length];
  return (
    <div className="doodle" aria-hidden="true">
      <svg viewBox="0 0 76 58" width="72" height="55" fill="none" strokeWidth="2.2" strokeLinecap="round">
        {joke.drawing}
      </svg>
      <span className="pen">{joke.text}</span>
    </div>
  );
}

// A full chronological list: section headings with their listings, plus up to two doodles
// placed after the 3rd and 9th listing.
export function ListingSections({
  groups,
  today,
  saved,
  onOpen,
  onSave,
  jokes: withJokes = true,
}: {
  groups: Section[];
  today: string;
  saved: string[];
  onOpen: (item: Opportunity) => void;
  onSave: (id: string) => void;
  jokes?: boolean;
}) {
  let count = 0;
  return (
    <>
      {groups.map((group) => (
        <section className="list-section" key={group.key} aria-labelledby={`sec-${group.key}`}>
          <header className="section-head">
            <h2 id={`sec-${group.key}`}>{group.title}</h2>
            <span>{group.note}</span>
          </header>
          {group.items.map((item) => {
            count += 1;
            const joke = withJokes && (count === 3 || count === 9) ? <Doodle index={count === 3 ? 0 : 1} /> : null;
            return (
              <div key={item.id}>
                <Listing item={item} today={today} saved={saved.includes(item.id)} onOpen={onOpen} onSave={onSave} />
                {joke}
              </div>
            );
          })}
        </section>
      ))}
    </>
  );
}
