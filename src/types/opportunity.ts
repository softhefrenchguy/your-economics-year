export type OpportunityStatus = "open" | "coming-soon" | "watchlist" | "closed";

export type OpportunityType =
  | "Competition"
  | "Essay competition"
  | "Work experience"
  | "University programme"
  | "Taster / event"
  | "Summer school"
  | "Mentoring / development"
  | "Business & entrepreneurship"
  | "Finance insight";

export type Topic =
  | "Economics"
  | "Finance"
  | "Banking"
  | "Public Policy"
  | "Fiscal Policy"
  | "Monetary Policy"
  | "International Economics"
  | "Development Economics"
  | "Labour Economics"
  | "Economic History"
  | "Business"
  | "Entrepreneurship"
  | "Data"
  | "AI"
  | "Markets"
  | "Risk"
  | "Professional Services";

export type DeliveryMode = "online" | "in-person" | "hybrid";
export type CostType = "free" | "paid" | "unknown";

// How much we trust any forward-looking date shown for this opportunity's next cycle.
// "confirmed": the provider has published the actual date(s).
// "previous-cycle": no date is confirmed yet, but we hold real dates from a prior cycle,
//   shown only as "usually around this time", never as if they were upcoming.
// "expected": the provider says it will return, but no useful date pattern exists at all.
export type DateConfidence = "confirmed" | "previous-cycle" | "expected";

// A prior real cycle's dates, kept only for context ("usually around this time").
// Never used to imply an upcoming date — see DateConfidence.
export interface PreviousCycle {
  label: string;
  applicationsOpen?: string | null;
  applicationDeadline?: string | null;
  eventStart?: string | null;
  eventEnd?: string | null;
  notes?: string | null;
}

export interface Opportunity {
  id: string;
  slug: string;

  name: string;
  provider: string;

  type: OpportunityType;
  subjects: string[];
  topics: Topic[];

  yearGroups: string[];
  minAge?: number | null;
  maxAge?: number | null;

  location: string;
  deliveryMode: DeliveryMode;
  ukWide: boolean;

  costType: CostType;
  costAmount?: number | null;
  costCurrency?: "GBP";
  financialSupport?: string | null;

  applicationsOpen?: string | null;
  applicationDeadline?: string | null;

  eventStart?: string | null;
  eventEnd?: string | null;

  status: OpportunityStatus;
  recurring: boolean;

  // Free-text, non-parseable hint shown on the card when no real date pattern exists
  // (e.g. "Returning in 2027 · exact dates not yet announced"). Never used for sorting
  // or timeline placement — only PreviousCycle dates and confirmed dates are.
  expectedWindow?: string | null;
  previousCycle?: PreviousCycle | null;

  eligibilitySummary: string;
  eligibilityDetails: string;

  description: string;
  whyRelevant: string;
  // Only set on opportunities that require a teacher/school action. Written to the teacher —
  // why the department's time, a nomination slot or a fee is worth it — never reused from
  // whyRelevant, which is written to sell the student on the opportunity, not the teacher.
  teacherPitch?: string;

  officialUrl: string;
  sourceLastChecked: string;

  requiresSchoolNomination: boolean;
  requiresTeacher: boolean;

  wideningParticipation: boolean;

  dateConfidence: DateConfidence;
  featured?: boolean;
}
