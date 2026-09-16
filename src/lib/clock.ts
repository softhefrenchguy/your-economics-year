// The one impure "what's today" read in the app, isolated here so lib/opportunities.ts
// stays pure and deterministic for tests. Uses the viewer's local calendar date, not UTC,
// so it matches what the viewer would actually call "today".
export function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
