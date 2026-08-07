export const chromelessRoutes = ["/dashboard", "/login", "/signup"];

export const site = {
  name: "Veridian AI",
  tagline: "Professional Safety. Smarter Operations. Powered by AI.",
  description:
    "Veridian AI helps security, fleet, HR, and compliance teams generate professional operational documentation in minutes with AI.",
  url: "https://veridian.ai",
};

export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

export const solutionsNav: NavItem[] = [
  { label: "AI Report Generator", href: "/features#report-generator", description: "Draft any operational report from a short interview." },
  { label: "Security Risk Assessments", href: "/solutions#security", description: "Site surveys, threat matrices, mitigation plans." },
  { label: "Fleet Safety Reports", href: "/solutions#fleet", description: "Inspections, incident write-ups, DOT-ready documentation." },
  { label: "Emergency Action Plans", href: "/solutions#emergency", description: "Evacuation, lockdown, and continuity planning." },
  { label: "HR & Compliance Documentation", href: "/solutions#hr", description: "Investigations, corrective action, OSHA logs." },
];

export const mainNav: NavItem[] = [
  { label: "Solutions", href: "/solutions" },
  { label: "Industries", href: "/industries" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "/resources" },
];

export const footerNav = {
  product: [
    { label: "Features", href: "/features" },
    { label: "Solutions", href: "/solutions" },
    { label: "Pricing", href: "/pricing" },
    { label: "Industries", href: "/industries" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  resources: [
    { label: "Resource Center", href: "/resources" },
    { label: "Blog", href: "/blog" },
    { label: "Documentation", href: "/docs" },
    { label: "Case Studies", href: "/resources#case-studies" },
    { label: "White Papers", href: "/resources#white-papers" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/about#careers" },
    { label: "Security & Trust", href: "/resources#trust" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Terms of Service", href: "/legal/terms" },
    { label: "Data Processing", href: "/legal/dpa" },
  ],
};

export type ReportType = {
  id: string;
  label: string;
  category: string;
  summary: string;
};

export const reportTypes: ReportType[] = [
  { id: "security-risk-assessment", label: "Security Risk Assessment", category: "Security", summary: "Site vulnerability analysis with prioritized mitigations." },
  { id: "fleet-safety-report", label: "Fleet Safety Report", category: "Fleet", summary: "Driver behavior, vehicle condition, and route risk summary." },
  { id: "incident-report", label: "Incident Report", category: "Security", summary: "Structured narrative, timeline, and evidence log." },
  { id: "emergency-action-plan", label: "Emergency Action Plan", category: "Compliance", summary: "Role assignments, evacuation routes, and communication trees." },
  { id: "church-security-plan", label: "Church Security Plan", category: "Community", summary: "Volunteer safety teams, access control, and threat response." },
  { id: "school-safety-plan", label: "School Safety Plan", category: "Education", summary: "Lockdown procedures, visitor management, and drills." },
  { id: "property-risk-assessment", label: "Property Risk Assessment", category: "Property", summary: "Physical security gaps across a managed portfolio." },
  { id: "business-continuity-plan", label: "Business Continuity Plan", category: "Compliance", summary: "Recovery objectives, backup systems, and failover staffing." },
  { id: "vehicle-inspection-report", label: "Vehicle Inspection Report", category: "Fleet", summary: "Pre/post-trip inspection with defect flagging." },
  { id: "employee-investigation-report", label: "Employee Investigation Report", category: "HR", summary: "Findings, witness statements, and recommended action." },
  { id: "corrective-action-report", label: "Corrective Action Report", category: "HR", summary: "Documented performance issue and improvement plan." },
  { id: "osha-report", label: "OSHA Compliance Report", category: "Compliance", summary: "Incident classification mapped to OSHA recordkeeping." },
];

export type Feature = {
  title: string;
  description: string;
  icon: string;
};

export const featureGroups: { title: string; blurb: string; items: Feature[] }[] = [
  {
    title: "Generate",
    blurb: "Turn a five-minute interview into a finished, professional document.",
    items: [
      { title: "AI Report Generator", description: "Answer a short guided interview and get a formatted, professional report — not a blank page.", icon: "Sparkles" },
      { title: "Template Library", description: "120+ vetted templates across security, fleet, HR, and compliance, kept current with best practice.", icon: "LayoutTemplate" },
      { title: "Workflow Automation", description: "Route drafts to reviewers, trigger approvals, and auto-file finished reports by client or site.", icon: "Workflow" },
    ],
  },
  {
    title: "Cover the operation",
    blurb: "One platform for every operational document your teams touch.",
    items: [
      { title: "Security Risk Assessments", description: "Site surveys, threat matrices, and prioritized mitigation plans.", icon: "ShieldAlert" },
      { title: "Fleet Safety Reports", description: "Inspections, driver incident write-ups, and DOT-ready documentation.", icon: "Truck" },
      { title: "Incident Reports", description: "Structured narratives with timeline reconstruction and evidence linking.", icon: "FileWarning" },
      { title: "Emergency Action Plans", description: "Evacuation routes, role assignments, and communication trees.", icon: "Siren" },
      { title: "Church & School Safety Plans", description: "Volunteer teams, lockdown procedures, and visitor management.", icon: "Landmark" },
      { title: "Property Risk Assessments", description: "Physical security gaps across a managed portfolio.", icon: "Building2" },
      { title: "Business Continuity Plans", description: "Recovery objectives, backup systems, and failover staffing.", icon: "GitBranch" },
      { title: "HR & Investigation Reports", description: "Employee investigations, corrective actions, and case files.", icon: "Users" },
      { title: "OSHA & Compliance Docs", description: "Incident classification mapped directly to recordkeeping rules.", icon: "ClipboardCheck" },
    ],
  },
  {
    title: "Operate with confidence",
    blurb: "Enterprise controls for teams that answer to regulators, boards, and clients.",
    items: [
      { title: "Analytics Dashboard", description: "Trend incidents, response times, and report volume across sites.", icon: "BarChart3" },
      { title: "Cloud Storage", description: "Every report versioned, searchable, and retained on your schedule.", icon: "CloudCog" },
      { title: "Digital Signatures", description: "Route for e-signature and lock the final document on completion.", icon: "PenTool" },
      { title: "Audit Logs", description: "Immutable history of every edit, view, and export, per user.", icon: "History" },
    ],
  },
];

export type Industry = {
  slug: string;
  name: string;
  description: string;
  icon: string;
};

export const industries: Industry[] = [
  { slug: "security", name: "Security Companies", description: "Standardize reporting across every guard, site, and shift.", icon: "ShieldCheck" },
  { slug: "law-enforcement", name: "Law Enforcement", description: "Consistent, defensible incident documentation.", icon: "Badge" },
  { slug: "government", name: "Government Agencies", description: "Compliance-ready records for public accountability.", icon: "Landmark" },
  { slug: "fleet", name: "Fleet Management", description: "Inspection and safety reporting at vehicle scale.", icon: "Truck" },
  { slug: "construction", name: "Construction", description: "Jobsite safety plans and incident documentation.", icon: "HardHat" },
  { slug: "healthcare", name: "Healthcare", description: "Facility security and compliance documentation.", icon: "HeartPulse" },
  { slug: "manufacturing", name: "Manufacturing", description: "OSHA reporting and plant safety plans.", icon: "Factory" },
  { slug: "retail", name: "Retail Chains", description: "Loss prevention and incident reports across locations.", icon: "Store" },
  { slug: "hospitality", name: "Hospitality", description: "Guest incident and property risk documentation.", icon: "Hotel" },
  { slug: "schools", name: "Schools", description: "Safety plans, drills, and visitor management records.", icon: "GraduationCap" },
  { slug: "churches", name: "Churches", description: "Volunteer-friendly security and safety planning.", icon: "Church" },
  { slug: "transportation", name: "Transportation", description: "Fleet and terminal safety documentation.", icon: "TrainFront" },
  { slug: "property-management", name: "Property Management", description: "Portfolio-wide risk assessments and incident logs.", icon: "Building2" },
];

export type PricingTier = {
  name: string;
  price: string;
  period?: string;
  description: string;
  cta: string;
  href: string;
  highlighted?: boolean;
  features: string[];
};

export const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Try the AI report generator with no commitment.",
    cta: "Start for free",
    href: "/signup",
    features: ["2 reports per month", "Basic templates", "PDF export", "Email support"],
  },
  {
    name: "Professional",
    price: "$49",
    period: "/month",
    description: "For individual operators and small teams.",
    cta: "Start free trial",
    href: "/signup",
    highlighted: true,
    features: ["Unlimited reports", "Full AI assistant", "PDF export", "Cloud storage", "Priority email support"],
  },
  {
    name: "Business",
    price: "$149",
    period: "/month",
    description: "For growing teams that need collaboration and branding.",
    cta: "Start free trial",
    href: "/signup",
    features: [
      "Everything in Professional",
      "Team accounts & roles",
      "Custom branding on reports",
      "Analytics dashboard",
      "Workflow automation",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For multi-site operations, agencies, and regulated organizations.",
    cta: "Talk to sales",
    href: "/contact",
    features: [
      "Unlimited users",
      "API access",
      "Dedicated support & SLA",
      "Custom AI models",
      "SSO & advanced audit logs",
    ],
  },
];

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  org: string;
  initials: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "What used to take our shift supervisors ninety minutes after every incident now takes eight. The reports are more consistent than the ones we wrote ourselves.",
    name: "Marcus Reyes",
    role: "Director of Security Operations",
    org: "Regional Security Company",
    initials: "MR",
  },
  {
    quote:
      "We run 340 vehicles across four states. Veridian gave every driver and inspector the same reporting standard overnight, and DOT audits stopped being a fire drill.",
    name: "Dana Whitfield",
    role: "Fleet Safety Manager",
    org: "National Logistics Fleet",
    initials: "DW",
  },
  {
    quote:
      "Our property risk assessments used to sit with one consultant. Now every regional manager can generate a defensible assessment the same afternoon.",
    name: "Priya Nair",
    role: "VP of Property Management",
    org: "Commercial Property Group",
    initials: "PN",
  },
  {
    quote:
      "Documentation quality is part of how we're evaluated by the city. Veridian's reports read like they came from our best writer, every time.",
    name: "Captain Ellis Wagner",
    role: "Operations Captain",
    org: "Metro Police Department",
    initials: "EW",
  },
  {
    quote:
      "Investigation write-ups went from a dreaded afternoon to a fifteen-minute interview. Legal actually prefers the structure now.",
    name: "Alicia Grant",
    role: "HR Director",
    org: "Corporate HR Department",
    initials: "AG",
  },
  {
    quote:
      "Our safety plan used to be a PDF nobody read. Now it's a living document our whole staff can update before the fire marshal ever asks.",
    name: "Tom Baumgartner",
    role: "School Administrator",
    org: "K-12 School District",
    initials: "TB",
  },
];

export const faqs = [
  {
    q: "What kind of documents can Veridian AI generate?",
    a: "Security risk assessments, fleet safety and vehicle inspection reports, incident reports, emergency action plans, church and school safety plans, property risk assessments, business continuity plans, HR investigation and corrective action reports, and OSHA compliance documentation — all from the same guided interview flow.",
  },
  {
    q: "Is the output actually usable, or does it need heavy editing?",
    a: "Reports are generated against vetted, industry-specific templates and structured from your interview answers, so they arrive formatted and complete. You can edit any section before export, and every report goes through a preview step before it's finalized.",
  },
  {
    q: "How is our data stored and secured?",
    a: "Reports are stored in your organization's private workspace with role-based access, full audit logging, and encryption in transit and at rest. Enterprise plans support SSO and custom data retention policies.",
  },
  {
    q: "Can multiple people on our team collaborate on a report?",
    a: "Yes. Business and Enterprise plans include team accounts, shared templates, and an approval workflow so a draft can move from author to reviewer to signature without leaving the platform.",
  },
  {
    q: "Do you offer an API or custom integrations?",
    a: "Enterprise plans include API access for programmatic report generation and integration with your existing case management, dispatch, or HRIS systems.",
  },
  {
    q: "What does the free plan include?",
    a: "Two reports per month using our basic template set, with PDF export — enough to fully evaluate the report generator before upgrading.",
  },
];
