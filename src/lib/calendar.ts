// "Add to calendar": a standard .ics file of the saved items' confirmed dates, so the
// student's own calendar app does the reminding. Nothing is sent anywhere; the file is made
// in the browser. Month-only dates are left out (there's no day to put them on).
import type { Opportunity } from "../types/opportunity";
import { confirmedSteps, type PlanStep } from "./plan";

// Reminder lead time before each kind of date.
const ALARM: Record<PlanStep["kind"], string> = { deadline: "-P3D", opens: "-P1D", event: "-P1D", ends: "-P1D" };

const escapeText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// RFC 5545 lines are at most 75 octets; longer ones continue on a line starting with a space.
function fold(line: string): string {
  const bytes = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  for (const char of line) {
    if (bytes.encode(current + char).length > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = "";
    }
    current += char;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

const compact = (date: string) => date.replace(/-/g, "");
const nextDay = (date: string) => new Date(Date.parse(`${date}T12:00:00Z`) + 86400000).toISOString().slice(0, 10);

function summary(item: Opportunity, step: PlanStep): string {
  if (step.kind === "deadline") return `Deadline: ${item.name}`;
  if (step.kind === "opens") return `Applications open: ${item.name}`;
  if (step.kind === "ends") return `Ends: ${item.name}`;
  return item.name;
}

// `now` is a full ISO timestamp, used for DTSTAMP. Only dates from `today` onwards go in.
export function buildCalendar(items: Opportunity[], today: string, now: string): { ics: string; count: number } {
  const stamp = now.replace(/[-:]/g, "").replace(/\.\d+/, "").slice(0, 15) + "Z";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Your Economics Year//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  let count = 0;
  for (const item of items) {
    for (const step of confirmedSteps(item)) {
      if (step.date.length !== 10 || step.date < today) continue;
      count++;
      lines.push(
        "BEGIN:VEVENT",
        `UID:${item.id}-${step.kind}-${step.date}@your-economics-year`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${compact(step.date)}`,
        `DTEND;VALUE=DATE:${compact(nextDay(step.date))}`,
        `SUMMARY:${escapeText(summary(item, step))}`,
        `DESCRIPTION:${escapeText(`${item.provider}. Check the official page for times and details: ${item.officialUrl}`)}`,
        `URL:${item.officialUrl}`,
        "TRANSP:TRANSPARENT",
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeText(summary(item, step))}`,
        `TRIGGER:${ALARM[step.kind]}`,
        "END:VALARM",
        "END:VEVENT",
      );
    }
  }
  lines.push("END:VCALENDAR");
  return { ics: lines.map(fold).join("\r\n") + "\r\n", count };
}
