// Counts clicks on a listing's official link with GoatCounter (see index.html): no cookies, no
// personal data, just "someone opened the official page for <id>". Each click shows up in the
// GoatCounter dashboard as an event with the path official/<id>. If the script is blocked or
// hasn't loaded, nothing is counted and the link still opens as normal.
type GoatCounter = { count: (vars: { path: string; title?: string; event?: boolean }) => void };

export const clickPath = (id: string) => `official/${id}`;

export function countOfficialClick(id: string, name: string): void {
  const counter = (globalThis as { goatcounter?: GoatCounter }).goatcounter;
  if (typeof counter?.count !== "function") return;
  try {
    counter.count({ path: clickPath(id), title: name, event: true });
  } catch {
    // Counting must never get in the way of opening the link.
  }
}
