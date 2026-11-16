import { useState } from "react";
import { resources, type Resource, type ResourceKind } from "../data/resources";
import { Icon, type IconName } from "./Icon";

const kinds: { id: ResourceKind | null; label: string }[] = [
  { id: null, label: "Everything" },
  { id: "book", label: "Books" },
  { id: "podcast", label: "Podcasts" },
  { id: "course", label: "Free courses" },
  { id: "website", label: "Websites" },
];
const kindLabel: Record<ResourceKind, string> = { book: "Book", podcast: "Podcast", course: "Free course", website: "Website" };
const kindIcon: Record<ResourceKind, IconName> = { book: "book", podcast: "headphones", course: "spark", website: "globe" };
const linkLabel: Record<ResourceKind, string> = { book: "", podcast: "Listen", course: "Start", website: "Open" };

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

export function ReadListen() {
  const [kind, setKind] = useState<ResourceKind | null>(null);
  const shown = resources.filter((item) => !kind || item.kind === kind);
  const groups = [
    { key: "start", title: "Start here", note: "an easy way in", items: shown.filter((item) => item.level === "start") },
    { key: "stretch", title: "When you want a challenge", note: "longer or harder", items: shown.filter((item) => item.level === "stretch") },
  ].filter((group) => group.items.length);
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
        {kinds.map((k) => (
          <button key={k.id ?? "all"} aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
            {k.label} <span>{count(k.id)}</span>
          </button>
        ))}
      </div>
      <div className="page-list">
        {groups.map((group) => (
          <section className="list-section" key={group.key} aria-labelledby={`read-${group.key}`}>
            <header className="section-head">
              <h2 id={`read-${group.key}`}>{group.title}</h2>
              <span>{group.note}</span>
            </header>
            <div className="resource-grid">
              {group.items.map((item) => (
                <Card key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
