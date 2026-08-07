export type RecentReport = {
  id: string;
  title: string;
  type: string;
  status: "Completed" | "In Review" | "Draft";
  site: string;
  updated: string;
  author: string;
};

export const recentReports: RecentReport[] = [
  { id: "RPT-2291", title: "Northgate Distribution Center — Q3 Risk Assessment", type: "Security Risk Assessment", status: "Completed", site: "Northgate DC", updated: "2 hours ago", author: "Marcus Reyes" },
  { id: "RPT-2290", title: "Unit 48 — Pre-Trip Inspection Defect", type: "Vehicle Inspection Report", status: "Completed", site: "Fleet — Unit 48", updated: "5 hours ago", author: "Dana Whitfield" },
  { id: "RPT-2289", title: "Lobby Access Incident — Aug 6", type: "Incident Report", status: "In Review", site: "Harborview Tower", updated: "Yesterday", author: "Priya Nair" },
  { id: "RPT-2288", title: "Q3 Emergency Action Plan Update", type: "Emergency Action Plan", status: "Draft", site: "Union County Schools", updated: "Yesterday", author: "Tom Baumgartner" },
  { id: "RPT-2287", title: "Corrective Action — Warehouse Safety Violation", type: "Corrective Action Report", status: "Completed", site: "Cascade Manufacturing", updated: "2 days ago", author: "Alicia Grant" },
  { id: "RPT-2286", title: "Sunday Service Security Plan Refresh", type: "Church Security Plan", status: "Completed", site: "Gracepoint Network", updated: "3 days ago", author: "Marcus Reyes" },
];

export type Notification = {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
};

export const notifications: Notification[] = [
  { id: "n1", title: "Report approved", description: "\"Northgate DC — Q3 Risk Assessment\" was approved by Priya Nair.", time: "12m ago", unread: true },
  { id: "n2", title: "Review requested", description: "Tom Baumgartner requested your review on the Emergency Action Plan draft.", time: "1h ago", unread: true },
  { id: "n3", title: "Usage alert", description: "Your workspace has used 82% of this month's report allowance.", time: "6h ago", unread: false },
  { id: "n4", title: "New team member", description: "Alicia Grant joined the HR & Compliance workspace.", time: "1d ago", unread: false },
];

export type ActivityItem = {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
};

export const recentActivity: ActivityItem[] = [
  { id: "a1", actor: "Marcus Reyes", action: "generated", target: "Northgate DC — Q3 Risk Assessment", time: "2h ago" },
  { id: "a2", actor: "Dana Whitfield", action: "exported", target: "Unit 48 — Pre-Trip Inspection Defect", time: "5h ago" },
  { id: "a3", actor: "Priya Nair", action: "approved", target: "Lobby Access Incident — Aug 6", time: "Yesterday" },
  { id: "a4", actor: "Tom Baumgartner", action: "created a draft of", target: "Q3 Emergency Action Plan Update", time: "Yesterday" },
  { id: "a5", actor: "Alicia Grant", action: "commented on", target: "Corrective Action — Warehouse Safety Violation", time: "2 days ago" },
];

export const usageChartData = [
  { month: "Mar", reports: 42 },
  { month: "Apr", reports: 58 },
  { month: "May", reports: 51 },
  { month: "Jun", reports: 67 },
  { month: "Jul", reports: 74 },
  { month: "Aug", reports: 61 },
];

export const reportsByCategory = [
  { category: "Security", value: 38 },
  { category: "Fleet", value: 24 },
  { category: "HR", value: 16 },
  { category: "Compliance", value: 14 },
  { category: "Property", value: 8 },
];

export const clients = [
  { id: "c1", name: "Northgate Distribution Center", industry: "Property Management", reports: 34, seats: 6, status: "Active" },
  { id: "c2", name: "Apex Fleet Logistics", industry: "Fleet", reports: 61, seats: 12, status: "Active" },
  { id: "c3", name: "Harborview Properties", industry: "Property Management", reports: 22, seats: 4, status: "Active" },
  { id: "c4", name: "Union County Schools", industry: "Education", reports: 15, seats: 8, status: "Active" },
  { id: "c5", name: "Gracepoint Churches Network", industry: "Community", reports: 9, seats: 5, status: "Trial" },
  { id: "c6", name: "Cascade Manufacturing", industry: "Manufacturing", reports: 27, seats: 7, status: "Active" },
];

export const invoices = [
  { id: "INV-1042", date: "Aug 1, 2026", amount: "$149.00", status: "Paid" },
  { id: "INV-1031", date: "Jul 1, 2026", amount: "$149.00", status: "Paid" },
  { id: "INV-1020", date: "Jun 1, 2026", amount: "$149.00", status: "Paid" },
  { id: "INV-1009", date: "May 1, 2026", amount: "$49.00", status: "Paid" },
];
