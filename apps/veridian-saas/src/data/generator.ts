export type InterviewField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "date" | "select";
  placeholder?: string;
  options?: string[];
};

export const interviewFields: InterviewField[] = [
  { id: "site", label: "Site or location name", type: "text", placeholder: "e.g. Northgate Distribution Center" },
  { id: "date", label: "Date of occurrence", type: "date" },
  { id: "reportedBy", label: "Reported by", type: "text", placeholder: "Full name and title" },
  {
    id: "severity",
    label: "Severity level",
    type: "select",
    options: ["Low", "Moderate", "High", "Critical"],
  },
  {
    id: "peopleInvolved",
    label: "People involved",
    type: "textarea",
    placeholder: "List names, roles, and contact information for anyone involved or witnessing the event.",
  },
  {
    id: "summary",
    label: "What happened?",
    type: "textarea",
    placeholder: "Describe the situation in your own words — Veridian AI will structure it into the final report.",
  },
  {
    id: "actionsTaken",
    label: "Actions taken so far",
    type: "textarea",
    placeholder: "Immediate response, notifications made, containment steps, etc.",
  },
  {
    id: "recommendations",
    label: "Recommended next steps (optional)",
    type: "textarea",
    placeholder: "Any follow-up actions or mitigations you'd like included.",
  },
];

export const analysisSteps = [
  "Structuring interview responses",
  "Cross-referencing report template",
  "Drafting findings and recommendations",
  "Formatting final document",
];
