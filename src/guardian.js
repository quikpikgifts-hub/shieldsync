// ─────────────────────────────────────────────────────────────────
// GUARDIAN STRATEGIC SECURITY, LLC — Complete Demo Tenant
// Orlando, Florida | Contract Security | 325 Officers | 47 Clients
// ─────────────────────────────────────────────────────────────────

export const GUARDIAN_COMPANY = {
  name:"Guardian Strategic Security, LLC",
  shortName:"Guardian",
  tagline:"Protecting What Matters Most",
  hq:"Orlando, FL",
  founded:"2014",
  license:"FL Class D/G — Lic# B2200348",
  employees:{officers:325,supervisors:22,dispatchers:5,managers:4,admin:8},
  clients:47,
  activeSites:63,
  vehicles:38,
  certifications:["ASIS CPP Certified Staff","FL Class D/G Licensed","ISO 9001:2015","NAPSO Member"],
  primaryColor:"#1A4F8A",
  accentColor:"#C4A227",
  email:"ops@guardianstrategic.com",
  phone:"(407) 555-0192",
  website:"www.guardianstrategic.com",
};

// ─── GUARDIAN USERS ─────────────────────────────────────────────
export const GUARDIAN_USERS = [
  {id:"G-001",email:"ceo@guardian.demo",password:"Guardian2026!",name:"Robert Martinez",role:"Executive",badge:"EXEC-001",av:"RM",title:"Chief Executive Officer",company:"Guardian Strategic Security",active:true,mfaEnabled:true,createdAt:"2024-01-15"},
  {id:"G-002",email:"coo@guardian.demo",password:"Guardian2026!",name:"Sarah Jenkins",role:"Company Admin",badge:"EXEC-002",av:"SJ",title:"Chief Operating Officer",company:"Guardian Strategic Security",active:true,mfaEnabled:true,createdAt:"2024-01-15"},
  {id:"G-003",email:"operations@guardian.demo",password:"Guardian2026!",name:"Michael Thompson",role:"Operations Manager",badge:"OPS-001",av:"MT",title:"Director of Operations",company:"Guardian Strategic Security",active:true,mfaEnabled:false,createdAt:"2024-02-01"},
  {id:"G-004",email:"dispatch@guardian.demo",password:"Guardian2026!",name:"Lisa Brown",role:"Dispatcher",badge:"DISP-001",av:"LB",title:"Dispatch Supervisor",company:"Guardian Strategic Security",active:true,mfaEnabled:false,createdAt:"2024-02-01"},
  {id:"G-005",email:"supervisor@guardian.demo",password:"Guardian2026!",name:"David Wilson",role:"Supervisor",badge:"SUP-401",av:"DW",title:"Field Supervisor — Zone A",company:"Guardian Strategic Security",active:true,mfaEnabled:false,createdAt:"2024-03-10"},
  {id:"G-006",email:"mw@guardian.demo",password:"Guardian2026!",name:"Michael Williams",role:"Officer",badge:"G-0241",av:"MW",title:"Security Officer — Orlando Regional Hospital",company:"Guardian Strategic Security",active:true,mfaEnabled:false,createdAt:"2024-04-01"},
  {id:"G-007",email:"jd@guardian.demo",password:"Guardian2026!",name:"James Davis",role:"Officer",badge:"G-0189",av:"JD",title:"Security Officer — Metro Transit Hub",company:"Guardian Strategic Security",active:true,mfaEnabled:false,createdAt:"2024-04-01"},
  {id:"G-008",email:"at@guardian.demo",password:"Guardian2026!",name:"Ashley Thomas",role:"Officer",badge:"G-0312",av:"AT",title:"Security Officer — Lake Nona Corporate",company:"Guardian Strategic Security",active:true,mfaEnabled:false,createdAt:"2024-05-15"},
  {id:"G-009",email:"rj@guardian.demo",password:"Guardian2026!",name:"Robert Johnson",role:"Officer",badge:"G-0278",av:"RJ",title:"Security Officer — Winter Garden DC",company:"Guardian Strategic Security",active:true,mfaEnabled:false,createdAt:"2024-05-15"},
];

// ─── GUARDIAN SITES ──────────────────────────────────────────────
export const GUARDIAN_SITES_FULL = [
  {
    id:"GS-001",name:"Orlando Regional Hospital",
    type:"Healthcare",client:"Orlando Health System",
    address:"1414 Kuhl Ave, Orlando, FL 32806",
    officers:12,patrolFreq:30,supervisor:"David Wilson",
    health:94,incidents:2,checkpoints:14,lastPatrol:"4m ago",
    status:"Active",contract:"$84,000/mo",x:55,y:42,
    notes:"High-security medical facility. Combative patient protocols active. Code Gray procedures in effect.",
  },
  {
    id:"GS-002",name:"Lake Nona Corporate Campus",
    type:"Corporate",client:"Tavistock Group",
    address:"6900 Tavistock Lakes Blvd, Orlando, FL 32827",
    officers:6,patrolFreq:60,supervisor:"David Wilson",
    health:88,incidents:1,checkpoints:8,lastPatrol:"12m ago",
    status:"Active",contract:"$42,000/mo",x:72,y:25,
    notes:"Class-A office campus. Executive entrance requires escort protocol. Visitor management active.",
  },
  {
    id:"GS-003",name:"Winter Garden Distribution Center",
    type:"Industrial",client:"Amazon Logistics FL",
    address:"2100 Winter Garden Vineland Rd, Winter Garden, FL 34787",
    officers:8,patrolFreq:45,supervisor:"David Wilson",
    health:91,incidents:0,checkpoints:12,lastPatrol:"8m ago",
    status:"Active",contract:"$56,000/mo",x:28,y:62,
    notes:"24/7 operations. Dock access control critical. Vehicle inspection mandatory on entry.",
  },
  {
    id:"GS-004",name:"Resort Security Complex",
    type:"Hospitality",client:"Marriott Vacations Worldwide",
    address:"8800 Worldquest Blvd, Orlando, FL 32821",
    officers:10,patrolFreq:30,supervisor:"David Wilson",
    health:79,incidents:3,checkpoints:11,lastPatrol:"18m ago",
    status:"Alert",contract:"$70,000/mo",x:44,y:74,
    notes:"High guest volume. Lost child protocol active. Current incident under investigation at Pool Deck B.",
  },
  {
    id:"GS-005",name:"Metro Transit Hub",
    type:"Transportation",client:"LYNX Central Florida",
    address:"455 N Garland Ave, Orlando, FL 32801",
    officers:15,patrolFreq:15,supervisor:"David Wilson",
    health:72,incidents:4,checkpoints:18,lastPatrol:"2m ago",
    status:"Active",contract:"$105,000/mo",x:60,y:55,
    notes:"High foot traffic. Aggressive subject alerts elevated. Rapid response protocols in effect.",
  },
];

// ─── GUARDIAN OFFICERS (roster — 30 detailed entries) ────────────
export const GUARDIAN_OFFICERS_ROSTER = [
  {id:"G-0241",name:"Michael Williams",badge:"G-0241",av:"MW",status:"On Patrol",site:"Orlando Regional Hospital",shift:"07:00–19:00",incidents:1,cps:8,fatigue:22,grade:"A",cert:"FL Class D",certExp:"2027-04-30"},
  {id:"G-0189",name:"James Davis",badge:"G-0189",av:"JD",status:"On Patrol",site:"Metro Transit Hub",shift:"06:00–18:00",incidents:2,cps:12,fatigue:38,grade:"B+",cert:"FL Class D/G",certExp:"2026-11-15"},
  {id:"G-0312",name:"Ashley Thomas",badge:"G-0312",av:"AT",status:"On Site",site:"Lake Nona Corporate Campus",shift:"07:00–19:00",incidents:0,cps:4,fatigue:14,grade:"A+",cert:"FL Class D",certExp:"2027-02-28"},
  {id:"G-0278",name:"Robert Johnson",badge:"G-0278",av:"RJ",status:"On Patrol",site:"Winter Garden DC",shift:"06:00–18:00",incidents:0,cps:9,fatigue:28,grade:"A",cert:"FL Class D",certExp:"2026-09-30"},
  {id:"G-0155",name:"Carmen Vasquez",badge:"G-0155",av:"CV",status:"On Site",site:"Orlando Regional Hospital",shift:"07:00–19:00",incidents:0,cps:7,fatigue:18,grade:"A",cert:"FL Class D",certExp:"2027-01-31"},
  {id:"G-0199",name:"Deon Harris",badge:"G-0199",av:"DH",status:"Incident Active",site:"Resort Security Complex",shift:"07:00–19:00",incidents:3,cps:5,fatigue:55,grade:"B",cert:"FL Class D/G",certExp:"2026-12-31"},
  {id:"G-0344",name:"Priya Nair",badge:"G-0344",av:"PN",status:"On Patrol",site:"Metro Transit Hub",shift:"06:00–18:00",incidents:1,cps:14,fatigue:31,grade:"A-",cert:"FL Class D",certExp:"2027-03-15"},
  {id:"G-0291",name:"Tyler Brooks",badge:"G-0291",av:"TB",status:"Break",site:"Orlando Regional Hospital",shift:"07:00–19:00",incidents:0,cps:6,fatigue:44,grade:"B+",cert:"FL Class D",certExp:"2026-08-31"},
  {id:"G-0167",name:"Fatima Diallo",badge:"G-0167",av:"FD",status:"On Patrol",site:"Resort Security Complex",shift:"07:00–19:00",incidents:1,cps:8,fatigue:26,grade:"A-",cert:"FL Class D",certExp:"2027-05-31"},
  {id:"G-0388",name:"Marcus Cole",badge:"G-0388",av:"MC",status:"On Site",site:"Winter Garden DC",shift:"06:00–18:00",incidents:0,cps:10,fatigue:20,grade:"A",cert:"FL Class D",certExp:"2026-10-31"},
  {id:"G-0203",name:"Shannon Pierce",badge:"G-0203",av:"SP",status:"On Patrol",site:"Metro Transit Hub",shift:"06:00–18:00",incidents:2,cps:11,fatigue:42,grade:"B",cert:"FL Class D",certExp:"2026-07-31"},
  {id:"G-0267",name:"Andre Freeman",badge:"G-0267",av:"AF",status:"Clocked In",site:"Lake Nona Corporate Campus",shift:"07:00–19:00",incidents:0,cps:3,fatigue:15,grade:"A",cert:"FL Class D/G",certExp:"2027-06-30"},
  {id:"G-0321",name:"Nicole Torres",badge:"G-0321",av:"NT",status:"On Patrol",site:"Orlando Regional Hospital",shift:"07:00–19:00",incidents:0,cps:7,fatigue:19,grade:"A+",cert:"FL Class D",certExp:"2027-08-31"},
  {id:"G-0140",name:"Kevin Hart",badge:"G-0140",av:"KH",status:"Off Duty",site:"—",shift:"19:00–07:00",incidents:0,cps:0,fatigue:0,grade:"B+",cert:"FL Class D",certExp:"2026-11-30"},
  {id:"G-0356",name:"Denise Chapman",badge:"G-0356",av:"DC",status:"On Patrol",site:"Metro Transit Hub",shift:"06:00–18:00",incidents:1,cps:13,fatigue:35,grade:"B+",cert:"FL Class D",certExp:"2026-09-15"},
];

// ─── GUARDIAN VEHICLES ───────────────────────────────────────────
export const GUARDIAN_VEHICLES = [
  {id:"GV-01",plate:"GSS-8421",make:"Ford Explorer",year:2023,status:"Deployed",officer:"Michael Williams",site:"Orlando Regional Hospital",fuel:82,mileage:18420,lastInsp:"Today 06:48",cond:"Excellent",cam:true},
  {id:"GV-02",plate:"GSS-7103",make:"Ford Explorer",year:2023,status:"Deployed",officer:"James Davis",site:"Metro Transit Hub",fuel:64,mileage:22810,lastInsp:"Today 05:55",cond:"Good",cam:true},
  {id:"GV-03",plate:"GSS-6284",make:"Chevy Tahoe",year:2022,status:"Deployed",officer:"Robert Johnson",site:"Winter Garden DC",fuel:71,mileage:34290,lastInsp:"Yesterday",cond:"Good",cam:true},
  {id:"GV-04",plate:"GSS-5512",make:"Toyota Highlander",year:2023,status:"Available",officer:"—",site:"Motor Pool",fuel:91,mileage:12440,lastInsp:"Today 06:00",cond:"Excellent",cam:true},
  {id:"GV-05",plate:"GSS-4897",make:"Ford Explorer",year:2022,status:"Deployed",officer:"Deon Harris",site:"Resort Security Complex",fuel:48,mileage:41380,lastInsp:"2 days ago",cond:"Good",cam:false},
  {id:"GV-06",plate:"GSS-3341",make:"Chevy Tahoe",year:2021,status:"Maintenance",officer:"—",site:"Maintenance Bay",fuel:22,mileage:78920,lastInsp:"3 days ago",cond:"Needs Service",cam:false},
  {id:"GV-07",plate:"GSS-9902",make:"Ford Explorer",year:2023,status:"Available",officer:"—",site:"Motor Pool",fuel:88,mileage:9870,lastInsp:"Yesterday",cond:"Excellent",cam:true},
  {id:"GV-08",plate:"GSS-2218",make:"Toyota Highlander",year:2022,status:"Deployed",officer:"Priya Nair",site:"Metro Transit Hub",fuel:55,mileage:29100,lastInsp:"Yesterday",cond:"Good",cam:true},
];

// ─── GUARDIAN CHECKPOINTS ────────────────────────────────────────
export const GUARDIAN_CHECKPOINTS = [
  // Orlando Regional Hospital (14 checkpoints)
  {id:"GCP-001",name:"Main Entrance Lobby",site:"Orlando Regional Hospital",scans:24,missed:0,last:"09:02",freq:30,status:"Current"},
  {id:"GCP-002",name:"Emergency Department Entry",site:"Orlando Regional Hospital",scans:24,missed:0,last:"09:01",freq:30,status:"Current"},
  {id:"GCP-003",name:"Parking Garage Level 1",site:"Orlando Regional Hospital",scans:22,missed:2,last:"07:45",freq:30,status:"Overdue"},
  {id:"GCP-004",name:"ICU Wing — Secured Entry",site:"Orlando Regional Hospital",scans:24,missed:0,last:"09:04",freq:30,status:"Current"},
  {id:"GCP-005",name:"Pharmacy Secure Room",site:"Orlando Regional Hospital",scans:12,missed:0,last:"09:00",freq:60,status:"Current"},
  {id:"GCP-006",name:"Rooftop Helipad Access",site:"Orlando Regional Hospital",scans:8,missed:0,last:"08:15",freq:60,status:"Current"},
  // Lake Nona Corporate Campus (8 checkpoints)
  {id:"GCP-007",name:"Executive Entrance",site:"Lake Nona Corporate Campus",scans:8,missed:0,last:"08:58",freq:60,status:"Current"},
  {id:"GCP-008",name:"Server Room Corridor",site:"Lake Nona Corporate Campus",scans:8,missed:0,last:"08:55",freq:60,status:"Current"},
  {id:"GCP-009",name:"Loading Bay East",site:"Lake Nona Corporate Campus",scans:7,missed:1,last:"07:50",freq:60,status:"Missed"},
  {id:"GCP-010",name:"Parking Structure B",site:"Lake Nona Corporate Campus",scans:8,missed:0,last:"09:10",freq:60,status:"Current"},
  // Winter Garden Distribution Center (12 checkpoints)
  {id:"GCP-011",name:"Dock Gate 1",site:"Winter Garden DC",scans:12,missed:0,last:"09:05",freq:45,status:"Current"},
  {id:"GCP-012",name:"Dock Gate 2",site:"Winter Garden DC",scans:12,missed:0,last:"09:06",freq:45,status:"Current"},
  {id:"GCP-013",name:"Staging Area Alpha",site:"Winter Garden DC",scans:11,missed:1,last:"08:20",freq:45,status:"Overdue"},
  {id:"GCP-014",name:"North Fence Perimeter",site:"Winter Garden DC",scans:12,missed:0,last:"09:08",freq:45,status:"Current"},
  {id:"GCP-015",name:"Control Room Entry",site:"Winter Garden DC",scans:12,missed:0,last:"09:03",freq:45,status:"Current"},
  // Resort Security Complex (11 checkpoints)
  {id:"GCP-016",name:"Main Resort Lobby",site:"Resort Security Complex",scans:18,missed:1,last:"08:30",freq:30,status:"Overdue"},
  {id:"GCP-017",name:"Pool Deck A",site:"Resort Security Complex",scans:16,missed:2,last:"07:30",freq:30,status:"Overdue"},
  {id:"GCP-018",name:"Pool Deck B",site:"Resort Security Complex",scans:14,missed:3,last:"06:45",freq:30,status:"Critical"},
  {id:"GCP-019",name:"Convention Center Entry",site:"Resort Security Complex",scans:18,missed:0,last:"09:00",freq:30,status:"Current"},
  {id:"GCP-020",name:"Valet & Parking Level P1",site:"Resort Security Complex",scans:17,missed:1,last:"08:00",freq:30,status:"Overdue"},
  // Metro Transit Hub (18 checkpoints)
  {id:"GCP-021",name:"Bus Bay Alpha",site:"Metro Transit Hub",scans:48,missed:0,last:"09:12",freq:15,status:"Current"},
  {id:"GCP-022",name:"Bus Bay Beta",site:"Metro Transit Hub",scans:47,missed:1,last:"08:57",freq:15,status:"Overdue"},
  {id:"GCP-023",name:"Main Terminal Entry",site:"Metro Transit Hub",scans:48,missed:0,last:"09:14",freq:15,status:"Current"},
  {id:"GCP-024",name:"Platform 1 North",site:"Metro Transit Hub",scans:46,missed:2,last:"08:29",freq:15,status:"Overdue"},
  {id:"GCP-025",name:"Platform 2 South",site:"Metro Transit Hub",scans:48,missed:0,last:"09:13",freq:15,status:"Current"},
  {id:"GCP-026",name:"Secure Operations Room",site:"Metro Transit Hub",scans:24,missed:0,last:"09:00",freq:30,status:"Current"},
];

// ─── GUARDIAN INCIDENTS ──────────────────────────────────────────
export const GUARDIAN_INCIDENTS = [
  {id:"GINC-1041",type:"Combative Patient",site:"Orlando Regional Hospital",officer:"Michael Williams",time:"08:22",sev:"Critical",status:"Active",priority:1,assigned:"Michael Williams",narrative:"Patient in ER Bay 4 became combative during triage. Code Gray activated. Officer Williams and hospital staff contained. Law enforcement notified."},
  {id:"GINC-1040",type:"Suspicious Person",site:"Metro Transit Hub",officer:"James Davis",time:"07:48",sev:"High",status:"Investigating",priority:2,assigned:"James Davis",narrative:"Male subject observed pacing platform 2 for 40+ minutes. No ticket, no destination. Identified by Officer Davis. Subject claims to be waiting for friend."},
  {id:"GINC-1039",type:"Unauthorized Access",site:"Resort Security Complex",officer:"Deon Harris",time:"07:15",sev:"High",status:"Investigating",priority:2,assigned:"Deon Harris",narrative:"Guest reported non-registered individual in Pool Deck B restricted area. Officer Harris responded. Subject claims room access badge malfunction."},
  {id:"GINC-1038",type:"Vehicle Accident",site:"Winter Garden DC",officer:"Robert Johnson",time:"06:44",sev:"Medium",status:"Resolved",priority:3,assigned:"Robert Johnson",narrative:"Minor collision at Dock Gate 2. Vendor truck clipped parked fleet vehicle GSS-0341. No injuries. Photos captured. Insurance report filed."},
  {id:"GINC-1037",type:"Lost Child",site:"Resort Security Complex",officer:"Fatima Diallo",time:"06:20",sev:"High",status:"Resolved",priority:2,assigned:"Fatima Diallo",narrative:"8-year-old child separated from family at resort pool. Child located at front desk 14 minutes after report. Family reunited. Incident closed."},
  {id:"GINC-1036",type:"Medical Emergency",site:"Metro Transit Hub",officer:"Priya Nair",time:"05:58",sev:"Critical",status:"Resolved",priority:1,assigned:"Priya Nair",narrative:"Adult male collapsed on Platform 1. Officer Nair administered CPR. EMS arrived in 6 minutes. Patient transported to Orlando Regional. Full recovery expected."},
  {id:"GINC-1035",type:"Trespassing",site:"Lake Nona Corporate Campus",officer:"Ashley Thomas",time:"05:30",sev:"Medium",status:"Closed",priority:3,assigned:"Ashley Thomas",narrative:"Individual found sleeping in parking structure B. No threat. Individual moved on voluntarily. No criminal charges."},
  {id:"GINC-1034",type:"Property Damage",site:"Metro Transit Hub",officer:"Shannon Pierce",time:"04:15",sev:"Low",status:"Closed",priority:4,assigned:"Shannon Pierce",narrative:"Graffiti discovered on Platform 2 shelter. Documented with photos. Maintenance notified. Cleaned by 06:30."},
  {id:"GINC-1033",type:"Workplace Violence Alert",site:"Orlando Regional Hospital",officer:"Nicole Torres",time:"03:42",sev:"High",status:"Closed",priority:2,assigned:"Nicole Torres",narrative:"Verbal altercation between two staff members in break room escalated to physical contact. Both parties separated. HR notified. No injuries."},
  {id:"GINC-1032",type:"Noise Complaint",site:"Resort Security Complex",officer:"Deon Harris",time:"02:18",sev:"Low",status:"Closed",priority:4,assigned:"Deon Harris",narrative:"Complaint from room 412 about noise from adjacent room 414. Officer Harris contacted guests. Volume reduced. No further action required."},
];

// ─── PATROL ROUTES ───────────────────────────────────────────────
export const GUARDIAN_PATROL_ROUTES = [
  {
    id:"GPR-001",name:"Hospital Alpha Route",site:"Orlando Regional Hospital",
    freq:"30 min",duration:"22 min",officer:"Michael Williams",
    stops:["Main Entrance Lobby","Emergency Department Entry","ICU Wing — Secured Entry","Parking Garage Level 1","Pharmacy Secure Room"],
    status:"Active",lastComplete:"09:02",nextDue:"09:32",compliance:96,
  },
  {
    id:"GPR-002",name:"Hospital Beta Route",site:"Orlando Regional Hospital",
    freq:"30 min",duration:"18 min",officer:"Carmen Vasquez",
    stops:["Rooftop Helipad Access","Staff Parking West","Loading Dock Rear","Ambulance Bay","Surgical Wing Entry"],
    status:"Active",lastComplete:"08:48",nextDue:"09:18",compliance:94,
  },
  {
    id:"GPR-003",name:"Transit Hub Express",site:"Metro Transit Hub",
    freq:"15 min",duration:"12 min",officer:"James Davis",
    stops:["Main Terminal Entry","Bus Bay Alpha","Platform 1 North","Platform 2 South","Bus Bay Beta"],
    status:"Active",lastComplete:"09:14",nextDue:"09:29",compliance:91,
  },
  {
    id:"GPR-004",name:"Corporate Perimeter",site:"Lake Nona Corporate Campus",
    freq:"60 min",duration:"35 min",officer:"Ashley Thomas",
    stops:["Executive Entrance","Server Room Corridor","Loading Bay East","Parking Structure B","Visitor Lobby"],
    status:"Active",lastComplete:"08:58",nextDue:"09:58",compliance:88,
  },
  {
    id:"GPR-005",name:"Distribution Center Full",site:"Winter Garden DC",
    freq:"45 min",duration:"30 min",officer:"Robert Johnson",
    stops:["Dock Gate 1","Dock Gate 2","Staging Area Alpha","North Fence Perimeter","Control Room Entry"],
    status:"Active",lastComplete:"09:05",nextDue:"09:50",compliance:93,
  },
  {
    id:"GPR-006",name:"Resort Grounds",site:"Resort Security Complex",
    freq:"30 min",duration:"25 min",officer:"Deon Harris",
    stops:["Main Resort Lobby","Pool Deck A","Pool Deck B","Convention Center Entry","Valet & Parking Level P1"],
    status:"Alert",lastComplete:"08:30",nextDue:"09:00",compliance:74,
  },
];

// ─── EQUIPMENT INVENTORY ─────────────────────────────────────────
export const GUARDIAN_EQUIPMENT = [
  // Body Cameras
  {id:"GEQ-001",type:"Body Camera",make:"Axon Body 3",serial:"AX3-88421",assignedTo:"Michael Williams",badge:"G-0241",site:"Orlando Regional Hospital",status:"Active",battery:78,lastSync:"09:00"},
  {id:"GEQ-002",type:"Body Camera",make:"Axon Body 3",serial:"AX3-88422",assignedTo:"James Davis",badge:"G-0189",site:"Metro Transit Hub",status:"Active",battery:61,lastSync:"08:45"},
  {id:"GEQ-003",type:"Body Camera",make:"Axon Body 3",serial:"AX3-88423",assignedTo:"Ashley Thomas",badge:"G-0312",site:"Lake Nona Corporate",status:"Active",battery:91,lastSync:"09:05"},
  {id:"GEQ-004",type:"Body Camera",make:"Axon Body 3",serial:"AX3-88424",assignedTo:"Robert Johnson",badge:"G-0278",site:"Winter Garden DC",status:"Active",battery:83,lastSync:"09:02"},
  // Radios
  {id:"GEQ-010",type:"Radio",make:"Motorola APX 6000",serial:"MOT-44821",assignedTo:"Michael Williams",badge:"G-0241",site:"Orlando Regional Hospital",status:"Active",battery:88,lastSync:"08:00"},
  {id:"GEQ-011",type:"Radio",make:"Motorola APX 6000",serial:"MOT-44822",assignedTo:"James Davis",badge:"G-0189",site:"Metro Transit Hub",status:"Active",battery:72,lastSync:"08:00"},
  {id:"GEQ-012",type:"Radio",make:"Motorola APX 6000",serial:"MOT-44823",assignedTo:"Ashley Thomas",badge:"G-0312",site:"Lake Nona Corporate",status:"Active",battery:94,lastSync:"08:00"},
  {id:"GEQ-013",type:"Radio",make:"Motorola APX 6000",serial:"MOT-44824",assignedTo:"Robert Johnson",badge:"G-0278",site:"Winter Garden DC",status:"Active",battery:81,lastSync:"08:00"},
  {id:"GEQ-014",type:"Radio",make:"Motorola APX 6000",serial:"MOT-44825",assignedTo:"Deon Harris",badge:"G-0199",site:"Resort Security Complex",status:"Low Battery",battery:18,lastSync:"07:30"},
  // Access Cards
  {id:"GEQ-020",type:"Access Card",make:"HID Global",serial:"HID-00241",assignedTo:"Michael Williams",badge:"G-0241",site:"Orlando Regional Hospital",status:"Active",battery:null,lastSync:"—"},
  {id:"GEQ-021",type:"Access Card",make:"HID Global",serial:"HID-00189",assignedTo:"James Davis",badge:"G-0189",site:"Metro Transit Hub",status:"Active",battery:null,lastSync:"—"},
  // Mobile Devices
  {id:"GEQ-030",type:"Mobile Device",make:"Samsung Galaxy XCover 6",serial:"SAM-78241",assignedTo:"Michael Williams",badge:"G-0241",site:"Orlando Regional Hospital",status:"Active",battery:71,lastSync:"09:01"},
  {id:"GEQ-031",type:"Mobile Device",make:"Samsung Galaxy XCover 6",serial:"SAM-78242",assignedTo:"James Davis",badge:"G-0189",site:"Metro Transit Hub",status:"Active",battery:55,lastSync:"08:58"},
  {id:"GEQ-032",type:"Mobile Device",make:"Samsung Galaxy XCover 6",serial:"SAM-78243",assignedTo:"Ashley Thomas",badge:"G-0312",site:"Lake Nona Corporate",status:"Active",battery:88,lastSync:"09:04"},
];

// ─── GUARDIAN AI ALERTS ──────────────────────────────────────────
export const GUARDIAN_AI_ALERTS = [
  {id:"GAI-001",severity:"Warning",icon:"📊",msg:"Officer G-0199 (Harris) completed 74% of assigned patrols this week — below the 90% threshold. Supervisor review recommended.",time:"09:08",site:"Resort Security Complex",action:"Review Officer"},
  {id:"GAI-002",severity:"Info",icon:"📡",msg:"Metro Transit Hub generated 4 incidents in the last 24 hours — 3× the 7-day average. Increased patrol density recommended.",time:"09:02",site:"Metro Transit Hub",action:"Adjust Coverage"},
  {id:"GAI-003",severity:"Warning",icon:"⏱️",msg:"Average response time at Orlando Regional Hospital increased 18% over the past 7 days (3.2m → 3.8m). Root cause analysis available.",time:"08:55",site:"Orlando Regional Hospital",action:"View Analysis"},
  {id:"GAI-004",severity:"Info",icon:"🪪",msg:"Officer G-0140 (Hart): FL Class D license expires in 47 days (2026-11-30). Renewal workflow should begin now.",time:"08:41",site:"All Sites",action:"Start Renewal"},
  {id:"GAI-005",severity:"Critical",icon:"🚨",msg:"Pool Deck B checkpoint missed 3 consecutive scans. SLA breach risk in 12 minutes. Supervisor notified automatically.",time:"08:35",site:"Resort Security Complex",action:"Dispatch Officer"},
  {id:"GAI-006",severity:"Info",icon:"🌙",msg:"Night shift utilization at Metro Transit Hub is 94% — 2 officers covering 18 checkpoints. Coverage gap identified for 02:00–04:00 window.",time:"08:20",site:"Metro Transit Hub",action:"Review Staffing"},
  {id:"GAI-007",severity:"Info",icon:"💰",msg:"Client Orlando Health System contract renewal in 62 days. Client satisfaction score: 88/100. Renewal probability: High.",time:"08:00",site:"Orlando Regional Hospital",action:"Prepare Renewal"},
];

// ─── GUARDIAN KPI DATA ───────────────────────────────────────────
export const GUARDIAN_KPI = {
  activeOfficers:{value:"41",sub:"of 47 scheduled",trend:"+2",color:"accent"},
  openIncidents:{value:"3",sub:"1 critical",trend:"-2",color:"red"},
  patrolCompliance:{value:"88%",sub:"Target 95%",trend:"-3%",color:"amber"},
  avgResponse:{value:"3.8m",sub:"↑18% this week",trend:"↑",color:"gold"},
  sitesActive:{value:"5/5",sub:"All nominal",trend:"0",color:"green"},
  clientSatisfaction:{value:"91",sub:"/ 100 avg",trend:"+2",color:"purple"},
  officerUtilization:{value:"87%",sub:"Peak shift",trend:"+1%",color:"accent"},
  checkpointRate:{value:"92%",sub:"Today",trend:"-1%",color:"amber"},
};

// ─── GUARDIAN DAR REPORTS ────────────────────────────────────────
export const GUARDIAN_DAR_REPORTS = [
  {
    id:"DAR-2847",site:"Orlando Regional Hospital",date:"2026-06-05",
    officer:"Michael Williams",badge:"G-0241",shift:"07:00–19:00",
    patrolsCompleted:4,checkpointsScanned:18,incidentsReported:1,
    summary:"Shift began at 0700 with vehicle inspection and site walkthrough. All clear at 0702. Emergency Department entrance congested at 0830 due to code gray activation in ER Bay 4. Officer Williams responded and assisted clinical staff in securing the area. Law enforcement arrived at 0850 and situation resolved. Remainder of shift proceeded without incident. All checkpoints cleared except Parking Garage Level 1 at 0945 — no access due to maintenance crew. Reported to supervisor. Shift ended at 1900 with full handover to Officer Nicole Torres.",
    status:"Submitted",supervisor:"David Wilson",
  },
  {
    id:"DAR-2846",site:"Metro Transit Hub",date:"2026-06-05",
    officer:"James Davis",badge:"G-0189",shift:"06:00–18:00",
    patrolsCompleted:5,checkpointsScanned:22,incidentsReported:2,
    summary:"Shift started at 0600. GINC-1040 initiated at 0748 — suspicious individual on Platform 2. Individual was identified, questioned, and cleared. No further action required. GINC medical emergency at 0558 (prior shift overlap): assisted Officer Nair with CPR until EMS arrival. All bus bay checkpoints completed on schedule. Platform 1 North missed at 1400 due to high passenger congestion. Supervisor notified via radio at 1402. Coverage resumed at 1412.",
    status:"Submitted",supervisor:"David Wilson",
  },
];

// ─── GUARDIAN SCHEDULE ───────────────────────────────────────────
export const GUARDIAN_SCHEDULE = [
  // Day shift - June 5
  {officer:"Michael Williams",badge:"G-0241",site:"Orlando Regional Hospital",shift:"07:00–19:00",day:"Thu",status:"On Duty"},
  {officer:"James Davis",badge:"G-0189",site:"Metro Transit Hub",shift:"06:00–18:00",day:"Thu",status:"On Duty"},
  {officer:"Ashley Thomas",badge:"G-0312",site:"Lake Nona Corporate Campus",shift:"07:00–19:00",day:"Thu",status:"On Duty"},
  {officer:"Robert Johnson",badge:"G-0278",site:"Winter Garden DC",shift:"06:00–18:00",day:"Thu",status:"On Duty"},
  {officer:"Carmen Vasquez",badge:"G-0155",site:"Orlando Regional Hospital",shift:"07:00–19:00",day:"Thu",status:"On Duty"},
  {officer:"Deon Harris",badge:"G-0199",site:"Resort Security Complex",shift:"07:00–19:00",day:"Thu",status:"On Duty"},
  {officer:"Priya Nair",badge:"G-0344",site:"Metro Transit Hub",shift:"06:00–18:00",day:"Thu",status:"On Duty"},
  {officer:"Tyler Brooks",badge:"G-0291",site:"Orlando Regional Hospital",shift:"07:00–19:00",day:"Thu",status:"On Duty"},
  {officer:"Fatima Diallo",badge:"G-0167",site:"Resort Security Complex",shift:"07:00–19:00",day:"Thu",status:"On Duty"},
  {officer:"Marcus Cole",badge:"G-0388",site:"Winter Garden DC",shift:"06:00–18:00",day:"Thu",status:"On Duty"},
  // Night shift
  {officer:"Kevin Hart",badge:"G-0140",site:"Orlando Regional Hospital",shift:"19:00–07:00",day:"Thu",status:"Scheduled"},
  {officer:"Nicole Torres",badge:"G-0321",site:"Orlando Regional Hospital",shift:"19:00–07:00",day:"Thu",status:"Scheduled"},
];

// ─── LIVE SIMULATION EVENTS ──────────────────────────────────────
export function buildGuardianLiveEvents(){
  return[
    {t:8000, msg:"📡 Officer G-0241 (Williams) clocked in at Orlando Regional Hospital — on time",type:"success"},
    {t:18000,msg:"🛡️ Checkpoint scan: Main Terminal Entry (Metro Transit) — verified by G-0189",type:"info"},
    {t:31000,msg:"⚡ NEW INCIDENT: Suspicious Person @ Metro Transit Hub — assigned to James Davis",type:"error"},
    {t:44000,msg:"✅ Patrol complete: Hospital Alpha Route — 100% checkpoints cleared",type:"success"},
    {t:58000,msg:"⚠️ AI Alert: Pool Deck B — 3 consecutive missed scans. Supervisor notified automatically",type:"error"},
    {t:72000,msg:"📊 Guardian KPI: Patrol compliance 88% — 7% below SLA threshold. Corrective action in progress",type:"info"},
    {t:87000,msg:"📡 Client dashboard accessed: Orlando Health System — viewing live patrol status",type:"info"},
    {t:103000,msg:"✅ Incident GINC-1039 closed — AI narrative drafted and ready for client delivery",type:"success"},
    {t:119000,msg:"🪪 Certification alert: Officer G-0140 (Hart) FL Class D expires in 47 days — renewal triggered",type:"info"},
    {t:134000,msg:"🚗 Vehicle GSS-8421 — post-shift inspection submitted with 6 photos by Officer Williams",type:"success"},
    {t:148000,msg:"📅 Night shift briefing auto-generated — 8 officers, 5 sites, 3 open incidents",type:"success"},
    {t:162000,msg:"📡 Dispatch: Officer Fatima Diallo reassigned to Resort Pool Deck coverage — gap filled",type:"info"},
    {t:176000,msg:"⚡ ESCALATION: Resort Security — 3rd missed patrol in 90 min. Ops Manager Thompson notified",type:"error"},
    {t:191000,msg:"✅ All Metro Transit Hub checkpoints cleared — James Davis patrol compliance: 94%",type:"success"},
    {t:205000,msg:"🤖 AI Insight: Winter Garden DC — 0 incidents in 7 days. Recommend sharing as client win",type:"info"},
  ];
}

// ─── SUPABASE TENANT CONFIG ──────────────────────────────────────
export const GUARDIAN_TENANT_ID = "ten_guardian_strategic_001";
