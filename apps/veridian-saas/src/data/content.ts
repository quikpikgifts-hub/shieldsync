export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  author: { name: string; role: string; initials: string };
  body: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "state-of-ai-incident-reporting-2026",
    title: "The State of AI Incident Reporting in 2026",
    excerpt: "We surveyed 200 security and fleet operations leaders about how AI is changing what a 'finished' report looks like.",
    category: "Industry Report",
    date: "2026-06-02",
    readTime: "7 min read",
    author: { name: "Elena Cho", role: "Head of Research, Veridian AI", initials: "EC" },
    body: [
      "For most of the last decade, operational reporting hasn't changed much: a supervisor sits down after a shift, opens a Word template, and writes from memory. The result is inconsistent quality, inconsistent formatting, and a report that takes anywhere from twenty minutes to two hours depending on who's writing it.",
      "That's starting to shift. In our survey of 200 security, fleet, and compliance leaders, 68% said their teams now use some form of AI assistance for report drafting — up from 19% two years ago. The biggest driver wasn't speed, though speed mattered. It was consistency: leaders wanted every report, from every site and every shift, to read like it came from the same standard.",
      "The organizations seeing the best results treat AI report generation as a structured interview, not a blank prompt. Rather than asking a writer to 'describe what happened,' the most effective tools ask the same eight to twelve questions every time, then assemble the answers into a template that's already been reviewed by a subject-matter expert.",
      "That distinction — structured interview versus open prompt — is the difference between a report you can defend in front of a regulator and one you can't. It's also, unsurprisingly, the model Veridian AI is built around.",
    ],
  },
  {
    slug: "anatomy-of-a-defensible-incident-report",
    title: "The Anatomy of a Defensible Incident Report",
    excerpt: "What separates an incident report that holds up in a legal review from one that gets challenged.",
    category: "Best Practices",
    date: "2026-05-14",
    readTime: "6 min read",
    author: { name: "Marcus Reyes", role: "Director of Security Operations Advisory", initials: "MR" },
    body: [
      "A defensible incident report has five things a hastily written one usually lacks: a precise timeline, named witnesses with contact information, a clear separation between observed fact and inference, photo or video evidence references, and a documented chain of custody for any physical evidence.",
      "The timeline is the piece most reports get wrong. 'Around 11pm' is not a timeline — it's a guess dressed up as a fact. Every entry should be tied to a specific, sourced timestamp: a radio log, a badge swipe, a camera timestamp, or a 911 call record.",
      "Separating fact from inference matters more than most writers realize. 'The subject appeared intoxicated' is an inference. 'The subject's speech was slurred and he was unable to stand without support' is an observation. Reports that blur this line are the ones that get picked apart in a deposition.",
      "This is exactly the structure Veridian AI's incident report template enforces — not because it's clever, but because it's what holds up.",
    ],
  },
  {
    slug: "fleet-safety-reporting-dot-audits",
    title: "What DOT Auditors Actually Look for in Fleet Safety Reports",
    excerpt: "A former DOT compliance officer breaks down the documentation gaps that trigger findings.",
    category: "Fleet & Compliance",
    date: "2026-04-22",
    readTime: "5 min read",
    author: { name: "Dana Whitfield", role: "Fleet Safety Advisor", initials: "DW" },
    body: [
      "Most DOT audit findings aren't about whether an inspection happened — they're about whether it was documented in a way that proves it happened. A verbal 'yeah, I checked the brakes' doesn't survive an audit. A dated, signed inspection report with specific defect codes does.",
      "The most common gap we see is inconsistent defect classification. If one driver writes 'brake light out' and another writes 'rear lamp malfunction' for the same defect category, your fleet's data becomes impossible to trend — and auditors notice when defect language doesn't map to a standard taxonomy.",
      "Standardized templates solve this by design: every driver answers the same structured questions, defects map to the same category list, and the resulting report reads the same whether it came from Ohio or Oregon.",
    ],
  },
  {
    slug: "hr-investigation-documentation-mistakes",
    title: "Five HR Investigation Documentation Mistakes That Create Legal Exposure",
    excerpt: "Common gaps in employee investigation reports — and how to close them before legal review.",
    category: "HR & Compliance",
    date: "2026-03-30",
    readTime: "6 min read",
    author: { name: "Alicia Grant", role: "HR Compliance Advisor", initials: "AG" },
    body: [
      "The most common mistake is inconsistent interview documentation — writing detailed notes for one party and a two-line summary for another. Investigators should use the same structured question set for every interview, regardless of role or seniority.",
      "The second is failing to document the investigation timeline itself: when the complaint was received, when interviews were scheduled, and when findings were communicated. Delay without documentation reads as negligence, even when the actual response was reasonable.",
      "A structured, repeatable investigation report template — the kind Veridian AI generates from a guided interview — closes most of these gaps by making the complete structure impossible to skip.",
    ],
  },
];

export type DocSection = {
  slug: string;
  title: string;
  pages: { slug: string; title: string }[];
};

export const docsNav: DocSection[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    pages: [
      { slug: "introduction", title: "Introduction" },
      { slug: "quickstart", title: "Quickstart: your first report" },
      { slug: "account-setup", title: "Account & workspace setup" },
    ],
  },
  {
    slug: "core-concepts",
    title: "Core Concepts",
    pages: [
      { slug: "report-templates", title: "Report templates" },
      { slug: "ai-generation", title: "How AI generation works" },
      { slug: "teams-roles", title: "Teams & roles" },
    ],
  },
  {
    slug: "integrations",
    title: "Integrations",
    pages: [
      { slug: "api-overview", title: "API overview" },
      { slug: "webhooks", title: "Webhooks" },
      { slug: "sso", title: "Single sign-on (SSO)" },
    ],
  },
];

export type DocPage = {
  title: string;
  description: string;
  body: { heading: string; paragraphs: string[] }[];
};

export const docsContent: Record<string, DocPage> = {
  introduction: {
    title: "Introduction",
    description: "What Veridian AI does and how the documentation is organized.",
    body: [
      {
        heading: "What is Veridian AI?",
        paragraphs: [
          "Veridian AI is a platform for generating professional operational documentation — security risk assessments, fleet safety reports, incident reports, HR investigations, and compliance filings — from a short guided interview rather than a blank page.",
          "Every report type is backed by a template reviewed against industry and regulatory conventions, so the AI is structuring your answers into a known-good format rather than freely generating content from an open prompt.",
        ],
      },
      {
        heading: "How these docs are organized",
        paragraphs: [
          "Getting Started walks through creating a workspace and generating your first report. Core Concepts explains how templates, AI generation, and team roles work under the hood. Integrations covers the API, webhooks, and SSO for connecting Veridian AI to your existing systems.",
        ],
      },
    ],
  },
  quickstart: {
    title: "Quickstart: your first report",
    description: "Generate a complete report in under five minutes.",
    body: [
      {
        heading: "1. Choose a report type",
        paragraphs: ["From your dashboard, select Generate Report and choose a template — for example, Security Risk Assessment or Vehicle Inspection Report."],
      },
      {
        heading: "2. Answer the guided interview",
        paragraphs: ["Each template asks between five and twelve structured questions. Answers can be typed, dictated, or pasted from existing notes."],
      },
      {
        heading: "3. Review the generated draft",
        paragraphs: ["Veridian AI assembles your answers into the full report. Every section is editable before you export — nothing is finalized automatically."],
      },
      {
        heading: "4. Export or share",
        paragraphs: ["Download as PDF, email it directly to a recipient, or save it to your workspace for your team to review."],
      },
    ],
  },
  "account-setup": {
    title: "Account & workspace setup",
    description: "Configure your organization's workspace, branding, and default templates.",
    body: [
      {
        heading: "Creating a workspace",
        paragraphs: ["Workspaces are the top-level container for your organization's reports, templates, and team members. Business and Enterprise plans support multiple workspaces for multi-site operations."],
      },
      {
        heading: "Custom branding",
        paragraphs: ["Business and Enterprise plans can add a logo, color palette, and letterhead footer that apply automatically to every exported report."],
      },
    ],
  },
  "report-templates": {
    title: "Report templates",
    description: "How templates are structured and how to request a custom one.",
    body: [
      {
        heading: "Template structure",
        paragraphs: ["Every template defines a fixed set of sections (for example: Summary, Findings, Risk Rating, Recommendations) and the interview questions that populate each section."],
      },
      {
        heading: "Requesting a custom template",
        paragraphs: ["Enterprise customers can request custom templates matched to an internal format or a specific regulatory requirement. Contact your account team to scope a custom template."],
      },
    ],
  },
  "ai-generation": {
    title: "How AI generation works",
    description: "What happens between submitting your interview answers and receiving a draft.",
    body: [
      {
        heading: "Structured generation, not open prompting",
        paragraphs: [
          "Veridian AI does not generate reports from a single open-ended prompt. Your interview answers are mapped to the fixed sections of the selected template, and generation happens per-section, which is why output stays consistent across users and reports.",
        ],
      },
      {
        heading: "Review before export",
        paragraphs: ["Every generated report is presented in an editable preview before it can be exported. This is intentional — Veridian AI treats the AI draft as a first pass, not a final document."],
      },
    ],
  },
  "teams-roles": {
    title: "Teams & roles",
    description: "Role-based access for authors, reviewers, and administrators.",
    body: [
      {
        heading: "Roles",
        paragraphs: [
          "Author: can generate and edit reports. Reviewer: can approve or request changes on submitted reports. Admin: manages workspace settings, billing, and user roles.",
        ],
      },
    ],
  },
  "api-overview": {
    title: "API overview",
    description: "Programmatic report generation for Enterprise customers.",
    body: [
      {
        heading: "Authentication",
        paragraphs: ["The API uses scoped API keys issued per workspace. Keys are managed from Settings → API Access on Enterprise plans."],
      },
      {
        heading: "Generating a report",
        paragraphs: ["POST /v1/reports with a template ID and a JSON object of interview answers returns a report ID and status. Poll GET /v1/reports/:id or configure a webhook for completion notifications."],
      },
    ],
  },
  webhooks: {
    title: "Webhooks",
    description: "Receive real-time notifications when reports are generated or approved.",
    body: [
      {
        heading: "Available events",
        paragraphs: ["report.generated, report.approved, report.exported. Each webhook payload includes the report ID, workspace ID, and a signed timestamp for verification."],
      },
    ],
  },
  sso: {
    title: "Single sign-on (SSO)",
    description: "Configure SAML-based SSO for your organization.",
    body: [
      {
        heading: "Supported providers",
        paragraphs: ["Okta, Azure AD, and any SAML 2.0-compliant identity provider are supported on Enterprise plans."],
      },
    ],
  },
};

export type CaseStudy = { slug: string; title: string; org: string; result: string };

export const caseStudies: CaseStudy[] = [
  { slug: "regional-security-group", title: "Cutting report turnaround from 90 minutes to 8", org: "Regional Security Company, 340 officers", result: "91% faster incident reporting" },
  { slug: "national-logistics-fleet", title: "Standardizing safety reporting across 4 states", org: "National Logistics Fleet, 340 vehicles", result: "Zero DOT documentation findings" },
  { slug: "commercial-property-group", title: "Scaling risk assessments across a growing portfolio", org: "Commercial Property Group, 60 properties", result: "5x more assessments completed per quarter" },
];

export type WhitePaper = { slug: string; title: string; description: string };

export const whitePapers: WhitePaper[] = [
  { slug: "ai-governance-for-safety-reporting", title: "AI Governance for Safety Reporting", description: "A framework for evaluating AI-generated operational documentation before deployment." },
  { slug: "osha-recordkeeping-playbook", title: "The OSHA Recordkeeping Playbook", description: "Mapping common workplace incidents to correct OSHA recordkeeping classifications." },
];
