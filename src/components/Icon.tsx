import type { CSSProperties } from "react";
export type IconName =
  | "arrow"
  | "bell"
  | "check"
  | "calendar"
  | "globe"
  | "pin"
  | "close"
  | "filter"
  | "mail"
  | "book"
  | "spark"
  | "chevron"
  | "info";
const paths: Record<IconName, string> = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  check: "m5 12 4 4L19 6",
  calendar: "M4 5h16v16H4zM8 2v6m8-6v6M4 10h16m-11 4h2m3 0h2m-7 3h2",
  globe:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z",
  pin: "M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0ZM14 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z",
  close: "m6 6 12 12M6 18 18 6",
  filter: "M4 7h16M7 12h10m-7 5h4M8 5v4m8 1v4m-4 1v4",
  mail: "M3 5h18v14H3zM3 5l9 8 9-8",
  book: "M12 5v16M3 3c4 0 6 0 9 2 3-2 5-2 9-2v16c-4 0-6 0-9 2-3-2-5-2-9-2Z",
  spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z",
  chevron: "m9 5 7 7-7 7",
  info: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 11v6m0-10v1",
};
export function Icon({
  name,
  size = 18,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
