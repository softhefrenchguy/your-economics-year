import type { ReactNode } from "react";
import type { Opportunity } from "../types/opportunity";
import { countOfficialClick } from "../lib/clicks";

// A link to a listing's official page that also counts the click (src/lib/clicks.ts).
// onAuxClick catches a middle-click, which opens the page in a new tab without firing onClick.
export function OfficialLink({ item, className, children }: { item: Opportunity; className?: string; children: ReactNode }) {
  const count = () => countOfficialClick(item.id, item.name);
  return (
    <a
      className={className}
      href={item.officialUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={count}
      onAuxClick={(event) => event.button === 1 && count()}
    >
      {children}
    </a>
  );
}
