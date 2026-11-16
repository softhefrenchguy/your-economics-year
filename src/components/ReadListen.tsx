import { useRef, useState } from "react";
import { resources, type Resource, type ResourceKind } from "../data/resources";
import { Icon, type IconName } from "./Icon";

const kinds: { id: ResourceKind; label: string; one: string; many: string }[] = [
  { id: "book", label: "Books", one: "book", many: "books" },
  { id: "podcast", label: "Podcasts", one: "podcast", many: "podcasts" },
  { id: "course", label: "Free courses", one: "course", many: "courses" },
  { id: "website", label: "Websites", one: "website", many: "websites" },
];
const kindLabel: Record<ResourceKind, string> = { book: "Book", podcast: "Podcast", course: "Free course", website: "Website" };
const kindIcon: Record<ResourceKind, IconName> = { book: "book", podcast: "headphones", course: "spark", website: "globe" };
const linkLabel: Record<ResourceKind, string> = { book: "", podcast: "Listen", course: "Start", website: "Open" };
// How many of each kind show before "Show all": two rows of two on a wide screen.
const PREVIEW = 4;

function Card({ item }: { item: Resource }) {
  return (
    <article className="resource">
      <div className="resource-kind" aria-hidden="true">
        <Icon name={kindIcon[item.kind]} size={20} />
      </div>
      <div className="resource-body">
        <p className="resource-meta">
          {kindLabel[item.kind]} · {item.by}
          {item.year && <> · {item.year}</>}
          {item.level === "stretch" && <span className="resource-stretch">Challenge</span>}
        </p>
        <h3>{item.title}</h3>
        <p className="resource-why">{item.why}</p>
        {item.url ? (
          <a className="text-button" href={item.url} target="_blank" rel="noopener noreferrer">
            {linkLabel[item.kind]} <span className="sr-only">{item.title}</span>
            <Icon name="arrow" size={14} />
          </a>
        ) : (
          <p className="resource-library">Ask your school or local library</p>
        )}
      </div>
    </article>
  );
}

function KindSection({ kind, full }: { kind: (typeof kinds)[number]; full: boolean }) {
  const [open, setOpen] = useState(false);
  const head = useRef<HTMLElement>(null);
  // Easy ways in first, then the challenges.
  const items = resources
    .filter((item) => item.kind === kind.id)
    .sort((a, b) => Number(a.level === "stretch") - Number(b.level === "stretch"));
  // One left over isn't worth a button, so a list of five just shows all five.
  const showAll = full || open || items.length <= PREVIEW + 1;
  const shown = showAll ? items : items.slice(0, PREVIEW);

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
          <Card key={item.id} item={item} />
        ))}
      </div>
      {!full && items.length > PREVIEW + 1 && (
        <button className="show-more" aria-expanded={open} aria-controls={`read-${kind.id}-list`} onClick={toggle}>
          {open ? "Show fewer" : `Show all ${items.length} ${kind.many}`}
          <Icon name="chevron" size={14} />
        </button>
      )}
    </section>
  );
}

export function ReadListen() {
  const [kind, setKind] = useState<ResourceKind | null>(null);
  const shown = kinds.filter((k) => !kind || k.id === kind);
  const count = (id: ResourceKind | null) => resources.filter((item) => !id || item.kind === id).length;

  return (
    <div className="page">
      <h1 className="page-title">Read &amp; listen</h1>
      <p className="page-intro">
        For the weeks between events. Books, podcasts and free courses that get you thinking like an economist. Everything
        with a link is free; books are worth asking your library for.
      </p>
      <p className="pen read-tip">
        tip: it's not which book you read, it's what you made of it. Note one argument you'd push back on.
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
          <KindSection key={k.id} kind={k} full={kind !== null} />
        ))}
      </div>
    </div>
  );
}
