import type { Opportunity } from "../types/opportunity";

// VERIFIED SEED DATA — real providers, checked against primary sources.
// Every record carries its own officialUrl and sourceLastChecked; nothing here is fictional.
// Where a provider hasn't published next-cycle dates, we show either real dates from a
// documented previous cycle (dateConfidence: "previous-cycle") or a plain-text expectation
// with no invented date (dateConfidence: "expected"). See types/opportunity.ts.
//
// REFERENCE_DATE is when this whole seed set was last verified against its sources — a data
// provenance fact, not "today". The app derives "today" and each item's live status from the
// real clock (see lib/clock.ts and lib/opportunities.ts effectiveStatus), so this constant
// never needs bumping just because time has passed — only when the data itself is re-checked.
export const REFERENCE_DATE = "2026-09-16";

const base: Opportunity = {
  id: "",
  slug: "",
  name: "",
  provider: "",
  type: "Taster / event",
  subjects: ["Economics"],
  topics: ["Economics"],
  yearGroups: ["Year 12"],
  minAge: 16,
  maxAge: 17,
  location: "UK-wide",
  deliveryMode: "online",
  ukWide: true,
  costType: "free",
  costAmount: null,
  financialSupport: null,
  applicationsOpen: null,
  applicationDeadline: null,
  eventStart: null,
  eventEnd: null,
  status: "open",
  recurring: true,
  expectedWindow: null,
  previousCycle: null,
  eligibilitySummary: "UK Year 12 students, aged 16–17",
  eligibilityDetails:
    "Check the official page for the exact eligibility criteria before applying — requirements can change between cycles.",
  description: "",
  whyRelevant: "",
  officialUrl: "",
  sourceLastChecked: REFERENCE_DATE,
  requiresSchoolNomination: false,
  requiresTeacher: false,
  wideningParticipation: false,
  dateConfidence: "confirmed",
};

function entry(id: string, fields: Partial<Opportunity>): Opportunity {
  return { ...base, id, slug: id, ...fields };
}

export const opportunities: Opportunity[] = [
  entry("lse-pathways-banking-finance", {
    name: "Pathways to Banking and Finance",
    provider: "London School of Economics / Sutton Trust",
    type: "University programme",
    subjects: ["Economics", "Finance"],
    topics: ["Economics", "Finance", "Banking"],
    yearGroups: ["Year 12", "Year 13"],
    location: "London",
    deliveryMode: "hybrid",
    ukWide: false,
    costType: "free",
    applicationsOpen: "2026-09-01",
    applicationDeadline: "2026-10-19",
    status: "open",
    recurring: true,
    eligibilitySummary:
      "Year 12 students within roughly 90 minutes' commute of LSE who meet the programme's academic and widening-participation criteria.",
    eligibilityDetails:
      "Uses LSE/Sutton Trust academic and widening-participation criteria; you must live within about 90 minutes of the LSE campus in London. Confirm the current criteria on the official page before applying.",
    description:
      "An 18-month programme beginning in Year 12 exploring university study and careers in banking and finance, running from December in Year 12 through April in Year 13, mixing online sessions with in-person events at LSE.",
    whyRelevant:
      "Strong fit for students interested in economics, finance and banking who want sustained exposure beyond the A-level curriculum.",
    officialUrl:
      "https://www.lse.ac.uk/study-at-lse/undergraduate/widening-participation/activities/pathways-to-banking-and-finance-london-years-12-13",
    wideningParticipation: true,
    dateConfidence: "confirmed",
    featured: true,
  }),

  entry("birkbeck-migration-economics", {
    name: "Migration: Economic Problem or Economic Opportunity?",
    provider: "Birkbeck, University of London",
    type: "Taster / event",
    subjects: ["Economics", "International Development", "Social Sciences"],
    topics: ["Economics", "Labour Economics", "International Economics"],
    yearGroups: ["Year 12", "Year 13"],
    location: "London",
    deliveryMode: "in-person",
    ukWide: false,
    costType: "free",
    eventStart: "2026-09-30",
    eventEnd: "2026-09-30",
    status: "open",
    recurring: false,
    eligibilitySummary:
      "Open to Year 12, Year 13 and anyone considering undergraduate study in 2027 or 2028.",
    eligibilityDetails:
      "This BSc Economics taster is open to Year 12 and Year 13 students, and to anyone considering starting an undergraduate degree in 2027 or 2028. No teacher registration is required.",
    description:
      "A BSc Economics taster exploring whether migration harms low-wage workers, its wider economic effects, economic models, data and natural experiments.",
    whyRelevant:
      "A very accessible example of university-level applied economics using a major real-world policy question.",
    officialUrl:
      "https://www.london.ac.uk/study/taster-courses-schools/migration-economic-problem-economic-opportunity-bk30472",
    dateConfidence: "confirmed",
    featured: true,
  }),

  entry("dauphine-preuni-economics-management", {
    name: "Dauphine-PSL Pre-Uni Camp — Economics & Management",
    provider: "Dauphine-PSL London",
    type: "University programme",
    subjects: ["Economics", "Management"],
    topics: ["Economics", "Business", "International Economics"],
    yearGroups: ["Year 11", "Year 12", "Year 13", "Gap year"],
    minAge: 16,
    maxAge: undefined,
    location: "London",
    deliveryMode: "in-person",
    ukWide: false,
    costType: "paid",
    eventStart: "2026-10-27",
    eventEnd: "2026-10-29",
    status: "open",
    recurring: true,
    eligibilitySummary:
      "Students aged 16+ in Years 11–13, IB students approaching their final years, and gap-year students.",
    eligibilityDetails:
      "Open to students aged 16 and over in Years 11–13, final-year IB students, and gap-year students considering university applications.",
    description:
      "A three-day pre-university programme introducing Economics and Management through workshops, activities and lectures.",
    whyRelevant:
      "Structured exposure to microeconomics, macroeconomics, globalisation and management at pre-university level.",
    officialUrl: "https://london.dauphine.psl.eu/programmes/pre-uni-camps",
    dateConfidence: "confirmed",
  }),

  entry("yse-launch", {
    name: "LAUNCH",
    provider: "Young Social Entrepreneurs",
    type: "Business & entrepreneurship",
    subjects: ["Economics", "Business"],
    topics: ["Business", "Entrepreneurship", "Economics"],
    yearGroups: ["Year 12"],
    location: "UK-wide",
    deliveryMode: "hybrid",
    ukWide: true,
    costType: "unknown",
    status: "coming-soon",
    recurring: true,
    expectedWindow: "Returning in 2027 · exact dates not yet announced",
    eligibilitySummary: "UK Year 12 students working in teams of 2–5.",
    eligibilityDetails:
      "Open to UK Year 12 students who form teams of two to five. No school nomination is required to register a team.",
    description:
      "Teams develop a social enterprise responding to a London borough challenge, create a professional business plan and brand, and can pitch to judges in a Dragon's Den-style final.",
    whyRelevant:
      "Useful for students interested in entrepreneurship, incentives, costs, viability and applying economic thinking to real problems.",
    officialUrl: "https://yseuk.org/launch/",
    dateConfidence: "expected",
  }),

  entry("fcdo-next-generation-economics", {
    name: "FCDO Next Generation Economics Competition",
    provider: "Foreign, Commonwealth & Development Office",
    type: "Essay competition",
    subjects: ["Economics"],
    topics: ["Economics", "Public Policy", "International Economics", "Development Economics"],
    yearGroups: ["Secondary school", "Sixth form"],
    minAge: 14,
    maxAge: 18,
    location: "UK-wide",
    deliveryMode: "online",
    ukWide: true,
    costType: "free",
    status: "coming-soon",
    recurring: true,
    expectedWindow:
      "Returning in 2027 · FCDO says details will appear on gov.uk, but no opening or closing date is announced yet",
    previousCycle: {
      label: "2026 cycle",
      applicationDeadline: "2026-06-28",
      notes:
        "Students wrote a concise economics letter; 2026 questions covered creative destruction, protectionism, women's economic participation and sustainable development. Prizes: £350 winner, £200 runner-up, £100 each for shortlisted entrants; the top 8 were offered a fully funded FCDO/LSE visit and the top 25 received an economics book.",
    },
    eligibilitySummary:
      "The 2026 competition was open to students aged 14–18 studying at secondary-school level in the UK, including sixth form, home education and British international schools.",
    eligibilityDetails:
      "2026 eligibility covered students aged 14–18 at UK secondary level, including sixth form, home education and British international schools. Confirm eligibility again once the 2027 competition is announced.",
    description:
      "Students write a concise economics letter addressing a major economic challenge, judged by FCDO and academic economists.",
    whyRelevant:
      "One of the strongest directly relevant opportunities for applying economic concepts, evidence and policy analysis outside the classroom.",
    officialUrl: "https://www.gov.uk/guidance/fcdo-next-generation-economics-competition",
    dateConfidence: "previous-cycle",
    featured: true,
  }),

  entry("cambridge-economics-challenge", {
    name: "Cambridge Economics Challenge",
    provider: "Cambridge Economics Challenge",
    type: "Competition",
    subjects: ["Economics"],
    topics: ["Economics", "Data", "Public Policy"],
    yearGroups: ["Year 12"],
    location: "UK-wide",
    deliveryMode: "in-person",
    ukWide: true,
    costType: "free",
    status: "watchlist",
    recurring: true,
    previousCycle: {
      label: "2025–26 cycle",
      applicationsOpen: "2025-09-01",
      applicationDeadline: "2026-05-29",
      eventStart: "2026-06-02",
      eventEnd: "2026-06-18",
      notes:
        "Teacher registration opened 1 September 2025; the written paper window ran 2–18 June 2026. Top performers could be invited to a fully funded residential camp at Cambridge's Faculty of Economics.",
    },
    eligibilitySummary:
      "UK Year 12 / Lower Sixth students studying A-level Economics or equivalent — entered by your school, not individually.",
    eligibilityDetails:
      "A 75-minute written Economics paper set by Cambridge economists, entered through the school's Economics department — individual students cannot register themselves.",
    description:
      "A 75-minute written Economics paper set by Cambridge economists, focused on economic reasoning, data interpretation and policy choices rather than syllabus recall.",
    whyRelevant:
      "Directly tests the sort of applied reasoning students encounter when moving beyond A-level Economics.",
    teacherPitch:
      "Free to enter and low-effort to run — registering your school and finding an exam slot is the whole commitment. It gives your strongest Year 12 economists a genuine Cambridge-set challenge, and top performers can be invited to a fully funded residential at Cambridge's Faculty of Economics.",
    officialUrl: "https://www.cecl6.com/",
    requiresSchoolNomination: true,
    requiresTeacher: true,
    dateConfidence: "previous-cycle",
    featured: true,
  }),

  entry("oxford-econsoc-essay", {
    name: "Oxford Economics Society Sixth Form Essay Competition",
    provider: "Oxford Economics Society",
    type: "Essay competition",
    subjects: ["Economics"],
    topics: ["Economics", "Finance"],
    yearGroups: ["Sixth form"],
    location: "Online",
    deliveryMode: "online",
    ukWide: true,
    costType: "free",
    status: "watchlist",
    recurring: true,
    previousCycle: {
      label: "2026 cycle",
      notes:
        "2026 questions included 'Why is the UK economy particularly exposed to oil shocks?', 'Should the CMA be more lenient when clearing mergers?' and 'Have we learnt the right lessons from the 2008 Financial Crisis?'. Prizes: £100 winner, £50 each for two finalists.",
    },
    eligibilitySummary: "Sixth-form students.",
    description:
      "Students submit an economics essay responding to one of several questions spanning macroeconomics, microeconomics and interdisciplinary issues.",
    whyRelevant:
      "Encourages independent research, economic reasoning and persuasive analytical writing beyond the school curriculum.",
    officialUrl: "https://oxfordeconsoc.org/essay-competition",
    dateConfidence: "previous-cycle",
  }),

  entry("lsesu-economics-essay", {
    name: "LSESU Economics Society Annual Essay Competition",
    provider: "LSESU Economics Society",
    type: "Essay competition",
    subjects: ["Economics"],
    topics: ["Economics", "Public Policy"],
    yearGroups: ["Year 12 equivalent"],
    location: "Online",
    deliveryMode: "online",
    costType: "unknown",
    status: "watchlist",
    recurring: true,
    previousCycle: {
      label: "2026 cycle",
      applicationDeadline: "2026-09-01",
      notes:
        "Global submissions were accepted; the recommended level corresponds to students who have just completed the penultimate year of secondary school — Year 12 in the UK.",
    },
    eligibilitySummary:
      "Global entries welcome; aimed at students at a level corresponding to UK Year 12.",
    description:
      "Annual essay competition focused on contemporary economic issues and policy questions.",
    whyRelevant:
      "Gives students a reason to research an economic issue independently and develop university-relevant analytical writing.",
    officialUrl: "https://lsesueconsoc.org/competitions/",
    dateConfidence: "previous-cycle",
  }),

  entry("iea-monetary-policy-essay", {
    name: "Monetary Policy Essay Prize",
    provider: "IEA / Institute of International Monetary Research / Vinson Centre",
    type: "Essay competition",
    subjects: ["Economics"],
    topics: ["Economics", "Monetary Policy"],
    yearGroups: ["Sixth form"],
    location: "UK-wide",
    deliveryMode: "hybrid",
    costType: "free",
    status: "watchlist",
    recurring: true,
    previousCycle: {
      label: "2026 cycle",
      applicationDeadline: "2026-08-31",
      eventStart: "2026-10-19",
      eventEnd: "2026-12-01",
      notes:
        "2,500-word maximum essay. Sixth-form semi-final held 19 October 2026, final 1 December 2026. Sixth-form prizes: £1,500 first, £750 each for two runners-up. International entries were accepted, but finalists needed to attend later stages in person.",
    },
    eligibilitySummary:
      "Separate sixth-form category; international entries accepted, but finalists attend later stages in person.",
    description: "A substantial economics essay competition focused on monetary-policy questions.",
    whyRelevant:
      "Particularly useful for students interested in inflation, monetary economics, central banking and macroeconomic policy.",
    officialUrl: "https://iea.org.uk/Monetary-Policy-Essay-Prize",
    dateConfidence: "previous-cycle",
  }),

  entry("iea-budget-challenge", {
    name: "The Budget Challenge",
    provider: "Institute of Economic Affairs",
    type: "Competition",
    subjects: ["Economics"],
    topics: ["Economics", "Fiscal Policy", "Public Policy"],
    yearGroups: ["Sixth form"],
    location: "UK-wide",
    deliveryMode: "in-person",
    ukWide: true,
    costType: "free",
    status: "watchlist",
    recurring: true,
    previousCycle: {
      label: "2026 cycle",
      applicationDeadline: "2026-01-30",
      eventStart: "2026-02",
      eventEnd: "2026-03",
      notes:
        "Submission deadline was Friday 30 January 2026; semi-finals ran in February 2026 at the Vinson Centre, University of Buckingham, and the final in March 2026 at the IEA in London (exact semi-final/final days not published). Winning team prize: £1,000 total (£500 to the school, £500 shared among the team).",
    },
    eligibilitySummary: "Open to students attending a sixth form or equivalent institution in the UK.",
    description:
      "Teams develop and defend an economic budget; strong teams progress to semi-finals and a final where they present proposals and answer judges' questions.",
    whyRelevant:
      "Applies economics directly to fiscal policy, trade-offs, research, analysis and argument.",
    teacherPitch:
      "Free to enter, and the IEA runs the semi-finals and final — your role is nominating a team and finding them research time. The £1,000 prize (split between school and team) is a genuine incentive, and it gives students a structured project outside the syllabus.",
    officialUrl: "https://iea.org.uk/the-budget-challenge/",
    requiresSchoolNomination: true,
    requiresTeacher: true,
    dateConfidence: "previous-cycle",
  }),

  entry("soas-y12-outreach-summer-school", {
    name: "SOAS Year 12 Outreach Summer School — Thriving Futures",
    provider: "SOAS University of London",
    type: "Summer school",
    subjects: ["Economics", "Finance", "Global Development"],
    topics: ["Economics", "Finance", "Development Economics"],
    yearGroups: ["Year 12"],
    location: "London",
    deliveryMode: "in-person",
    costType: "free",
    financialSupport:
      "Travel costs may be covered for eligible students outside the London Oyster 16+ travel zones.",
    status: "watchlist",
    recurring: true,
    previousCycle: {
      label: "2026 cycle",
      applicationDeadline: "2026-04-24",
      eventStart: "2026-07-13",
      eventEnd: "2026-07-17",
    },
    eligibilitySummary:
      "2026 programme was for Year 12 students at state schools and colleges, prioritising widening-participation criteria.",
    description:
      "Five-day university outreach summer school including lectures, debates, study-skills sessions, university guidance and a group project.",
    whyRelevant:
      "The Thriving Futures pathway directly combines Economics, Finance and Global Development.",
    officialUrl: "https://www.soas.ac.uk/about/event/soas-year-12-outreach-summer-school-2026",
    wideningParticipation: true,
    dateConfidence: "previous-cycle",
  }),

  entry("ucl-management-summer-school", {
    name: "UCL School of Management Non-Residential Summer School",
    provider: "UCL School of Management",
    type: "Summer school",
    subjects: ["Business", "Management"],
    topics: ["Business", "Entrepreneurship"],
    yearGroups: ["Year 12"],
    location: "London",
    deliveryMode: "in-person",
    costType: "free",
    financialSupport: "2026 programme reimbursed travel costs and provided lunch.",
    status: "watchlist",
    recurring: true,
    previousCycle: {
      label: "2026 cycle",
      eventStart: "2026-07-27",
      eventEnd: "2026-07-31",
      notes: "A follow-on work-experience week was offered to some selected students in 2026.",
    },
    eligibilitySummary:
      "2026 event was for Year 12 students at state schools or colleges in Greater London, with widening-participation selection criteria.",
    description:
      "Week-long programme where students work in teams on a real business challenge with UCL academics and student ambassadors.",
    whyRelevant:
      "More business-focused than pure Economics, but useful for students interested in firms, management, innovation and applied commercial decision-making.",
    officialUrl:
      "https://www.ucl.ac.uk/engage/events/2026/jul/ucl-school-management-non-residential-summer-school-2026",
    wideningParticipation: true,
    dateConfidence: "previous-cycle",
  }),

  entry("christs-cambridge-summer-school", {
    name: "Experience Christ's Summer School",
    provider: "Christ's College, University of Cambridge",
    type: "Summer school",
    subjects: ["Economics", "Law", "Politics", "Social Sciences"],
    topics: ["Economics"],
    yearGroups: ["Year 12"],
    location: "Cambridge",
    deliveryMode: "in-person",
    costType: "free",
    financialSupport: "2026 programme included meals, accommodation and travel expenses.",
    status: "watchlist",
    recurring: true,
    previousCycle: {
      label: "2026 cycle",
      applicationDeadline: "2026-06-12",
      eventStart: "2026-08-26",
      eventEnd: "2026-08-28",
    },
    eligibilitySummary:
      "2026 programme targeted Year 12 students at state schools, with additional eligibility criteria.",
    description:
      "Residential Cambridge summer school providing academic sessions and experience of college/university life; one 2026 strand covered Economics.",
    whyRelevant:
      "An opportunity to experience academically demanding university study alongside an Economics strand.",
    officialUrl: "https://www.undergraduate.study.cam.ac.uk/events/experience-christs-summer-schools",
    wideningParticipation: true,
    dateConfidence: "previous-cycle",
  }),

  entry("royal-holloway-economics-work-experience", {
    name: "Work Experience @RHULECON",
    provider: "Royal Holloway Department of Economics",
    type: "Work experience",
    topics: ["Economics", "Data"],
    yearGroups: ["Sixth form"],
    location: "London",
    deliveryMode: "in-person",
    costType: "unknown",
    status: "watchlist",
    recurring: true,
    expectedWindow:
      "Royal Holloway says it offers this each summer to a limited number of A-level students — exact 2027 dates not yet announced.",
    eligibilitySummary: "A-level students; places are limited each summer.",
    description:
      "Academic Economics work experience designed to develop data analysis, quantitative research, critical thinking and communication skills.",
    whyRelevant:
      "Unusually direct Economics work experience rather than generic finance or business experience.",
    officialUrl:
      "https://www.royalholloway.ac.uk/research-and-education/subjects/economics/department-of-economics-activity-hub/connect-with-us/",
    dateConfidence: "expected",
  }),

  entry("royal-holloway-data-bootcamp", {
    name: "Economics Data Boot Camp",
    provider: "Royal Holloway Department of Economics",
    type: "University programme",
    topics: ["Economics", "Data"],
    yearGroups: ["School students"],
    deliveryMode: "hybrid",
    costType: "unknown",
    status: "watchlist",
    recurring: true,
    expectedWindow:
      "Royal Holloway invites up to 25 students to this bootcamp; the next cycle and exact eligibility aren't announced yet.",
    eligibilitySummary: "Up to 25 students per cohort; check official page for exact eligibility.",
    description:
      "Week-long event mixing on-site and online activity, introducing Python and showing how modern data analytics are applied to real-world projects.",
    whyRelevant:
      "Economics degrees are increasingly quantitative — this exposes students to data analysis and coding in an Economics context.",
    officialUrl:
      "https://www.royalholloway.ac.uk/research-and-education/subjects/economics/department-of-economics-activity-hub/connect-with-us/",
    dateConfidence: "expected",
  }),

  entry("royal-holloway-economics-ai", {
    name: "Economics of AI Insight Day",
    provider: "Royal Holloway Department of Economics",
    type: "Taster / event",
    topics: ["Economics", "AI", "Data"],
    yearGroups: ["Year 12"],
    location: "London",
    deliveryMode: "in-person",
    costType: "unknown",
    status: "watchlist",
    recurring: true,
    expectedWindow:
      "Aimed at Year 12 A-level students interested in Economics, AI and Data Science — next date not yet announced.",
    eligibilitySummary: "Year 12 A-level students interested in Economics, AI and Data Science.",
    description:
      "University Economics sessions, case studies and industry perspectives showing how AI and data science affect economics, policy and finance.",
    whyRelevant:
      "A strong interdisciplinary opportunity for Economics applicants interested in quantitative economics, fintech or policy.",
    officialUrl:
      "https://www.royalholloway.ac.uk/research-and-education/subjects/economics/department-of-economics-activity-hub/economics-of-ai-insight-day/",
    dateConfidence: "expected",
  }),

  entry("aon-discover-finance-city-edition", {
    name: "Aon Work Insight Programme",
    provider: "Aon",
    type: "Work experience",
    subjects: ["Finance"],
    topics: ["Finance", "Professional Services"],
    yearGroups: ["Year 12", "Year 13"],
    minAge: 16,
    maxAge: 19,
    location: "London",
    deliveryMode: "in-person",
    costType: "free",
    status: "watchlist",
    recurring: true,
    expectedWindow:
      "Aon runs Work Insight sessions roughly three times a year (February half term, summer term, October half term), applied for through a rotating job-portal listing rather than one fixed page. One 2026 session (branded 'Discover Finance: City Edition') had a 10 June 2026 deadline for a 7 July event — but with three sessions a year on a rotating link, that single example isn't a reliable 'usually around this time' pattern for the next one. No specific next application link or deadline is currently confirmed.",
    eligibilitySummary:
      "For Year 12 and 13 students aged 16–19 at state-funded schools or colleges; selection prioritises areas with high free-school-meal rates and lower socio-economic backgrounds.",
    eligibilityDetails:
      "A three-day in-person work-experience programme with panel discussions from Aon colleagues on career pathways and project work on real workplace challenges, for Year 12/13 students at state-funded schools or colleges.",
    description:
      "A structured, three-day work-experience programme with Aon, including finance-sector-themed sessions, aimed at Year 12/13 students from state-funded schools.",
    whyRelevant:
      "Useful for Economics students who want to explore how Economics and Finance relate to professional careers.",
    officialUrl: "https://www.aon.com/careers/early-careers/uk/workinsight",
    dateConfidence: "expected",
  }),

  entry("gs-money-markets-risk", {
    name: "Understanding Money, Markets and Risk",
    provider: "Goldman Sachs / LSEG Foundation / Founders4Schools",
    type: "Mentoring / development",
    subjects: ["Finance", "Economics"],
    topics: ["Finance", "Markets", "Risk"],
    yearGroups: ["Year 12"],
    location: "UK-wide",
    deliveryMode: "hybrid",
    ukWide: true,
    costType: "free",
    status: "watchlist",
    recurring: false,
    expectedWindow:
      "Newly launched in 2026 — no confirmed route to enter a future cohort yet.",
    eligibilitySummary: "Launched in 2026 for Year 12 students across the UK, entered via participating schools.",
    description:
      "Financial education programme combining learning modules, mentoring and a simulated stock-picking competition using a virtual portfolio. Top-performing schools can be recognised at a London Stock Exchange Market Close ceremony and Goldman Sachs Insight Day.",
    whyRelevant:
      "Provides practical exposure to markets, risk, investment concepts and financial reasoning.",
    teacherPitch:
      "Free, and the learning modules, mentoring and competition structure are all supplied by Goldman Sachs/LSEG — your department doesn't need to build activities from scratch. Recognition at a London Stock Exchange ceremony is a real profile-raiser for the school if your students do well.",
    officialUrl:
      "https://www.goldmansachs.com/worldwide/united-kingdom/press-releases/2026/gs-lseg-foundation-launch-financial-education-initiative",
    requiresSchoolNomination: true,
    requiresTeacher: true,
    dateConfidence: "expected",
  }),

  entry("city-st-georges-economics-taster", {
    name: "A Taste of Economics at City St George's",
    provider: "City St George's, University of London",
    type: "Taster / event",
    topics: ["Economics", "Finance", "Data"],
    yearGroups: ["Year 12"],
    location: "London",
    deliveryMode: "in-person",
    costType: "free",
    status: "watchlist",
    recurring: true,
    previousCycle: {
      label: "2026 cycle",
      eventStart: "2026-07-07",
      eventEnd: "2026-07-07",
    },
    eligibilitySummary: "2026 event was exclusively for Year 12 students.",
    description:
      "Two-hour university Economics taster covering Economics as a discipline, degree study and related careers.",
    whyRelevant:
      "A very low-commitment way for a Year 12 student to experience university Economics before applying.",
    officialUrl:
      "https://www.london.ac.uk/study/taster-courses-schools/taste-economics-city-st-georges-cg30288",
    dateConfidence: "previous-cycle",
  }),

  entry("lse-explore-economic-history", {
    name: "LSE Explore Extra — Economic History",
    provider: "London School of Economics",
    type: "Taster / event",
    subjects: ["Economic History", "Economics", "History"],
    topics: ["Economic History", "Economics"],
    yearGroups: ["Year 12"],
    location: "London",
    deliveryMode: "in-person",
    costType: "free",
    status: "watchlist",
    recurring: true,
    previousCycle: {
      label: "2026 cycle",
      eventStart: "2026-06-03",
      eventEnd: "2026-06-03",
    },
    eligibilitySummary: "Designed for Year 12 students.",
    description:
      "Academic subject taster allowing Year 12 students to experience university-level study.",
    whyRelevant:
      "Useful for Economics applicants interested in economic history and understanding economic questions in historical context.",
    officialUrl: "https://www.london.ac.uk/study/taster-courses-schools/lse-explore-extra-economic-history-ls29557",
    dateConfidence: "previous-cycle",
  }),

  entry("res-annual-public-lecture-2026", {
    name: "RES Annual Public Lecture 2026 — Is Economics broken?",
    provider: "Royal Economic Society / Discover Economics",
    type: "Taster / event",
    topics: ["Economics"],
    yearGroups: ["Sixth form"],
    location: "Online",
    deliveryMode: "online",
    ukWide: true,
    costType: "free",
    eventStart: "2026-11-03",
    eventEnd: "2026-11-03",
    status: "open",
    recurring: true,
    eligibilitySummary:
      "Principally aimed at sixth form students; in-person places at Kingston University are closed, but the livestream is open to all.",
    eligibilityDetails:
      "Established in 2001, this annual lecture lets school students hear a leading economist present their research — this year, Dharshini David OBE (BBC News) on 'Is Economics broken?'. In-person registration is closed; join via the livestream.",
    description:
      "A livestreamed public lecture from a leading economics commentator, aimed at sixth form students exploring the subject.",
    whyRelevant:
      "A free, low-commitment way to hear a professional economist discuss real debates in the field — good material for wider reading and personal statements.",
    officialUrl: "https://www.discovereconomics.co.uk/events/res-annual-public-lecture-2026",
    dateConfidence: "confirmed",
  }),

  entry("frontier-economics-apprenticeship-evening", {
    name: "Economic Apprenticeships at Frontier — Open Evening",
    provider: "Frontier Economics / Discover Economics",
    type: "Taster / event",
    topics: ["Economics", "Professional Services"],
    yearGroups: ["Sixth form"],
    location: "London",
    deliveryMode: "in-person",
    costType: "free",
    eventStart: "2026-11-02",
    eventEnd: "2026-11-02",
    status: "open",
    recurring: false,
    eligibilitySummary:
      "Aimed at sixth form students considering an economics apprenticeship route; exact age/year eligibility isn't stated on the event page — check before booking.",
    eligibilityDetails:
      "An informal open evening about Frontier Economics' Level 6 Economic Apprenticeship, with current apprentice analysts, a Frontier director and a Discover Economics representative.",
    description:
      "Learn about starting a career in economics through an apprenticeship — earning a degree while working — direct from current apprentices and a Frontier director.",
    whyRelevant:
      "Useful for students weighing an apprenticeship route into economics against the traditional university path.",
    officialUrl: "https://www.discovereconomics.co.uk/events/economic-apprenticeships-at-frontier-open-evening",
    dateConfidence: "confirmed",
  }),

  entry("young-enterprise-company-programme", {
    name: "Company Programme",
    provider: "Young Enterprise",
    type: "Business & entrepreneurship",
    subjects: ["Business", "Economics"],
    topics: ["Business", "Entrepreneurship"],
    yearGroups: ["Year 12", "Year 13"],
    minAge: 13,
    maxAge: 19,
    location: "UK-wide",
    deliveryMode: "in-person",
    ukWide: true,
    costType: "unknown",
    status: "open",
    recurring: true,
    expectedWindow:
      "Rolling enrollment — your school can register at any point and run it from 12 weeks up to a full academic year.",
    eligibilitySummary:
      "Runs through your school, which registers and pays a per-company fee (published as £560 for state schools, £2,500 for independent schools) — there's no direct individual sign-up.",
    eligibilityDetails:
      "Students form a real student company, making decisions on funding, roles, products and finances, often supported by a business volunteer. Your school registers your class or group via Young Enterprise's Company Connect platform.",
    description:
      "Students set up and run a real student company from scratch — sourcing start-up capital, choosing director roles, launching a product or service and managing company finances.",
    whyRelevant:
      "Directly applies economic thinking — incentives, costs, pricing, cash flow — to a real business you help run, not a simulation.",
    teacherPitch:
      "The fee (£560 state / £2,500 independent, per company) buys a term-to-year-long enterprise project that largely runs itself, with the platform, structure and an optional business volunteer supplied by Young Enterprise. A strong option for widening what your department offers beyond exam content, and it can run flexibly around your timetable.",
    officialUrl: "https://www.young-enterprise.org.uk/what-we-do/programmes/company-programme",
    requiresTeacher: true,
    dateConfidence: "confirmed",
  }),

  entry("bristol-discover-economics-taster", {
    name: "Discover Economics in-school taster session",
    provider: "University of Bristol, School of Economics",
    type: "Taster / event",
    topics: ["Economics"],
    yearGroups: ["Year 12"],
    location: "South West England (schools visited in person, by arrangement)",
    deliveryMode: "in-person",
    ukWide: false,
    costType: "free",
    status: "open",
    recurring: true,
    expectedWindow:
      "Rolling — a one-hour in-school session your teacher can book at any point in the academic year, subject to availability.",
    eligibilitySummary:
      "For Year 12 (and Year 10) students not currently studying Economics; a teacher requests the session — students can't book it directly.",
    eligibilityDetails:
      "A one-hour taster delivered in your school by University of Bristol economics students, covering topics like the cost-of-living crisis and inequality alongside degree, apprenticeship and career routes into Economics.",
    description:
      "A one-off, in-school Economics taster session for students not currently studying the subject, delivered by current Bristol economics students.",
    whyRelevant:
      "A no-commitment way to sample Economics content without travelling anywhere — good for students unsure whether to explore the subject further.",
    teacherPitch:
      "Free, and Bristol's own students deliver the entire session in your classroom — no prep, materials or cost on your side. Aimed at students not yet studying Economics, so it's a useful recruiting tool for your A-level options evening or GCSE cohort.",
    officialUrl: "https://www.bristol.ac.uk/economics/widening-participation-and-outreach/",
    requiresTeacher: true,
    dateConfidence: "confirmed",
  }),

  entry("nuffield-research-placements", {
    name: "Nuffield Research Placements",
    provider: "STEM Learning / Nuffield Foundation",
    type: "Work experience",
    topics: ["Economics", "Data"],
    yearGroups: ["Year 12"],
    minAge: 16,
    location: "UK-wide (placement hosted locally to you)",
    deliveryMode: "in-person",
    ukWide: true,
    costType: "free",
    financialSupport:
      "Free to take part; travel costs reimbursed, and a £100 bursary may be available depending on family circumstances.",
    status: "coming-soon",
    recurring: true,
    expectedWindow:
      "Applications for the next summer's placements typically open in the preceding autumn/winter — the exact 2027 opening date isn't confirmed yet; check the official page.",
    eligibilitySummary:
      "Year 12, aged 16+, studying a relevant subject (including Economics) at A-level, plus a widening-participation criterion (e.g. free school meals, first in family to university, household income under £30,000, or care experience).",
    eligibilityDetails:
      "A 4–6 week self-directed research placement the summer after Year 12, in a university, research institute, company or voluntary organisation, on a project in science, technology, engineering, maths or quantitative social science — Economics projects are eligible. Requires at least 5 GCSEs at grade 6+ including maths, plus one widening-participation criterion.",
    description:
      "A 4–6 week paid-for research placement over the summer after Year 12, working on a real project that can be economics-focused.",
    whyRelevant:
      "Genuine independent research experience — a strong, concrete example for a personal statement, and rare for Economics specifically.",
    officialUrl: "https://www.stem.org.uk/placements",
    wideningParticipation: true,
    dateConfidence: "expected",
  }),

  entry("young-economist-of-the-year", {
    name: "Young Economist of the Year",
    provider: "Royal Economic Society / KPMG UK",
    type: "Essay competition",
    topics: ["Economics", "Public Policy"],
    yearGroups: ["Year 10", "Year 11", "Year 12", "Year 13"],
    location: "UK-wide",
    deliveryMode: "hybrid",
    ukWide: true,
    costType: "free",
    status: "watchlist",
    recurring: true,
    previousCycle: {
      label: "2026 cycle",
      applicationDeadline: "2026-06-29",
      notes:
        "Individual or team entries (2–5 students) responded to one of five assigned topics analysing a contemporary economic problem, as a max 1,000-word written blog or a media entry (video/podcast up to 5 minutes, or a slide deck). That cycle's shortlist and October 2026 final are already in motion and closed to new entrants — they're not a preview of the 2027 cycle. Open to Years 10–13 in England/Wales, Years 11–14 in Northern Ireland, or S3–S6 in Scotland — no prior economics study required.",
    },
    eligibilitySummary:
      "Years 10–13 (England/Wales), Years 11–14 (NI), or S3–S6 (Scotland); no prior economics study required.",
    description:
      "Students analyse a contemporary economic problem facing the UK or the world and submit an original response as a short written or media entry.",
    whyRelevant:
      "A broader, lower-barrier entry point than the more academic essay prizes — open to students who haven't studied Economics yet, and rewards original thinking over technical depth.",
    officialUrl: "https://www.discovereconomics.co.uk/young-economist-of-the-year-2026",
    dateConfidence: "previous-cycle",
  }),

  entry("discover-economics-boe-economists-bristol", {
    name: "Discover Economics with Bank of England Economists",
    provider: "Discover Economics / Bank of England",
    type: "Taster / event",
    topics: ["Economics", "Monetary Policy", "Public Policy"],
    yearGroups: ["Year 12"],
    location: "Bristol",
    deliveryMode: "in-person",
    costType: "free",
    eventStart: "2026-11-13",
    eventEnd: "2026-11-13",
    status: "open",
    recurring: false,
    eligibilitySummary: "For current GCSE and A-level students.",
    eligibilityDetails:
      "Bank of England economists Jack Leslie and Rupal Patel discuss their book 'Money, the Inside Story', covering inflation, the cost-of-living crisis and the future of money, followed by facilitated student discussions on the UK economy, energy, demographics, AI and higher education.",
    description:
      "An in-person talk and discussion with Bank of England economists on inflation, the cost-of-living crisis and monetary policy, aimed at GCSE and A-level students.",
    whyRelevant:
      "A rare chance to hear directly from working Bank of England economists on the policy questions behind the headlines — strong material for wider reading and personal statements.",
    officialUrl:
      "https://www.discovereconomics.co.uk/events/discover-economics-with-bank-of-england-economists-rupal-patel-and-jack-leslie",
    dateConfidence: "confirmed",
  }),
];
