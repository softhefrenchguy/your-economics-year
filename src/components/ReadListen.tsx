import { useEffect, useRef, useState } from "react";
import { resources, type Resource, type ResourceKind } from "../data/resources";
import type { Progress, ProgressMap } from "../lib/plan";
import { numberWord } from "../lib/display";
import { Icon, type IconName } from "./Icon";

const kinds: { id: ResourceKind; label: string; many: string }[] = [
  { id: "book", label: "Books", many: "books" },
  { id: "podcast", label: "Podcasts", many: "podcasts" },
  { id: "course", label: "Free courses", many: "courses" },
  { id: "website", label: "Websites", many: "websites" },
];
const kindLabel: Record<ResourceKind, string> = { book: "Book", podcast: "Podcast", course: "Free course", website: "Website" };
const kindIcon: Record<ResourceKind, IconName> = { book: "book", podcast: "headphones", course: "spark", website: "globe" };
const linkLabel: Record<ResourceKind, string> = { book: "", podcast: "Listen", course: "Start", website: "Open" };
const doneLabel: Record<ResourceKind, string> = { book: "I've read it", podcast: "I've listened", course: "I've done some", website: "I've used it" };

// How many of each kind show before "Show all": two rows of two on a wide screen, two on a phone.
function usePreview(): number {
  const query = "(max-width: 760px)";
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setNarrow(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return narrow ? 2 : 4;
}

type Track = { progress: ProgressMap; today: string; onProgress: (id: string, entry: Progress) => void };

function Card({ item, track }: { item: Resource; track: Track }) {
  const entry = track.progress[item.id];
  const done = entry?.done ?? false;
  return (
    <article className={`resource ${done ? "is-done" : ""}`}>
      <div className="resource-kind" aria-hidden="true">
        <Icon name={done ? "check" : kindIcon[item.kind]} size={20} />
      </div>
      <div className="resource-body">
        <p className="resource-meta">
          {kindLabel[item.kind]} · {item.by}
          {item.year && <> · {item.year}</>}
          {item.level === "stretch" && <span className="resource-stretch">Challenge</span>}
        </p>
        <h3>{item.title}</h3>
        <p className="resource-why">{item.why}</p>
        <div className="resource-actions">
          {item.url ? (
            <a className="text-button" href={item.url} target="_blank" rel="noopener noreferrer">
              {linkLabel[item.kind]} <span className="sr-only">{item.title}</span>
              <Icon name="arrow" size={14} />
            </a>
          ) : (
            <span className="resource-library">Ask your school or local library</span>
          )}
          <button
            className={`resource-done ${done ? "is-on" : ""}`}
            aria-pressed={done}
            onClick={() => track.onProgress(item.id, { done: !done, note: entry?.note ?? "", doneOn: done ? "" : track.today })}
          >
            <Icon name="check" size={14} /> {done ? "Done" : doneLabel[item.kind]}
            <span className="sr-only">: {item.title}</span>
          </button>
        </div>
        {done && (
          <label className="plan-note">
            <span className="sr-only">Your notes on {item.title}</span>
            <textarea
              rows={2}
              value={entry?.note ?? ""}
              placeholder="One argument you'd push back on, or one thing that stuck."
              onChange={(event) => track.onProgress(item.id, { done: true, doneOn: entry?.doneOn || track.today, note: event.target.value })}
            />
          </label>
        )}
      </div>
    </article>
  );
}

function KindSection({ kind, full, track }: { kind: (typeof kinds)[number]; full: boolean; track: Track }) {
  const [open, setOpen] = useState(false);
  const head = useRef<HTMLElement>(null);
  const preview = usePreview();
  // Easy ways in first, then the challenges.
  const items = resources
    .filter((item) => item.kind === kind.id)
    .sort((a, b) => Number(a.level === "stretch") - Number(b.level === "stretch"));
  // One left over isn't worth a button, so a list of five just shows all five.
  const collapsible = !full && items.length > preview + 1;
  const shown = collapsible && !open ? items.slice(0, preview) : items;

  function toggle() {
    if (open) head.current?.scrollIntoView({ block: "nearest" });
    setOpen(!open);
  }

  return (
    <section className="list-section" aria-labelledby={`read-${kind.id}`}>
      <header className="section-head" ref={head}>
        <h2 id={`read-${kind.id}`}>{kind.label}</h2>
        <span>{items.length}</span>
      </header>
      <div className="resource-grid" id={`read-${kind.id}-list`}>
        {shown.map((item) => (
          <Card key={item.id} item={item} track={track} />
        ))}
      </div>
      {collapsible && (
        <button className="show-more" aria-expanded={open} aria-controls={`read-${kind.id}-list`} onClick={toggle}>
          {open ? "Show fewer" : `Show all ${items.length} ${kind.many}`}
          <Icon name="chevron" size={14} />
        </button>
      )}
    </section>
  );
}

export function ReadListen(track: Track) {
  const [kind, setKind] = useState<ResourceKind | null>(null);
  const shown = kinds.filter((k) => !kind || k.id === kind);
  const count = (id: ResourceKind | null) => resources.filter((item) => !id || item.kind === id).length;
  const doneCount = resources.filter((item) => track.progress[item.id]?.done).length;

  return (
    <div className="page">
      <h1 className="page-title">Read &amp; listen</h1>
      <p className="page-intro">
        For the weeks between events. Books, podcasts and free courses that get you thinking like an economist. Everything
        with a link is free; books are worth asking your library for. Tick off what you've done and it goes in Your year,
        with your notes.
      </p>
      <p className="pen read-tip">
        {doneCount > 0
          ? `${numberWord(doneCount)} done so far. Keep a line on each: what would you push back on?`
          : "tip: it's not which book you read, it's what you made of it. Note one argument you'd push back on."}
      </p>
      <div className="kind-chips" role="group" aria-label="Kind of thing">
        {[{ id: null, label: "Everything" }, ...kinds].map((k) => (
          <button key={k.id ?? "all"} aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
            {k.label} <span>{count(k.id)}</span>
          </button>
        ))}
      </div>
      <div className="page-list">
        {shown.map((k) => (
          <KindSection key={k.id} kind={k} full={kind !== null} track={track} />
        ))}
      </div>
    </div>
  );
}
