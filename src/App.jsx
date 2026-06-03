import React, { Component, useState, useEffect, useRef, useCallback, memo, useMemo, useTransition } from "react";

// ─────────────────────────────────────────────────────────────────
// LOCAL STORAGE LAYER
// ─────────────────────────────────────────────────────────────────
const LS={
  get:(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}},
  del:(k)=>{try{localStorage.removeItem(k);}catch{}},
};
function useLS(key,init){
  const[val,setVal]=useState(()=>LS.get(key,typeof init==="function"?init():init));
  const set=useCallback(v=>{
    setVal(p=>{const n=typeof v==="function"?v(p):v;LS.set(key,n);return n;});
  },[key]);
  return[val,set];
}

// ─────────────────────────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────────────────────────
const AUD_KEY="ss_audit_v1";
function logAction(user,action,detail=""){
  const entries=LS.get(AUD_KEY,[]);
  entries.unshift({
    id:`A${Date.now()}`,ts:new Date().toISOString(),
    user:user?.name||"System",badge:user?.badge||"—",role:user?.role||"—",
    action,detail,
  });
  LS.set(AUD_KEY,entries.slice(0,1000));
}
function getAuditLog(){return LS.get(AUD_KEY,[]);}
function clearAuditLog(){LS.del(AUD_KEY);}

// ─────────────────────────────────────────────────────────────────
// SESSION MANAGEMENT  (8-hour shift TTL)
// ─────────────────────────────────────────────────────────────────
const SS_KEY="ss_v1";
const SS_TTL=8*60*60*1000;
function saveSession(u){LS.set(SS_KEY,{u,exp:Date.now()+SS_TTL});}
function loadSession(){const d=LS.get(SS_KEY,null);if(!d||Date.now()>d.exp){LS.del(SS_KEY);return null;}return d.u;}
function clearSession(){LS.del(SS_KEY);}

// ─────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────
const T={
  bg:"#060910",surface:"#0C1018",raised:"#111822",card:"#131B28",
  border:"#1A2840",borderLight:"#223354",
  accent:"#00C8F0",accentH:"#00A8CC",accentGlow:"rgba(0,200,240,0.10)",accentB:"rgba(0,200,240,0.25)",
  gold:"#F0A020",goldGlow:"rgba(240,160,32,0.10)",
  red:"#F04444",redGlow:"rgba(240,68,68,0.10)",redB:"rgba(240,68,68,0.25)",
  green:"#00D464",greenGlow:"rgba(0,212,100,0.10)",greenB:"rgba(0,212,100,0.25)",
  amber:"#F0A800",purple:"#9B59F0",purpleGlow:"rgba(155,89,240,0.10)",
  text:"#E2EAF4",textSub:"#8A9BBC",textDim:"#384D6A",
  overlay:"rgba(6,9,16,0.93)",
};

const SM=(s)=>({
  "On Patrol":{c:T.accent,p:true},"On Site":{c:T.green,p:true},
  "Incident Active":{c:T.red,p:true},"Clocked In":{c:T.amber,p:false},
  "Break":{c:T.purple,p:false},"Off Duty":{c:T.textDim,p:false},
  "Emergency":{c:T.red,p:true},"En Route":{c:T.gold,p:true},
  "Active":{c:T.red,p:true},"Under Review":{c:T.amber,p:false},
  "Resolved":{c:T.green,p:false},"Closed":{c:T.textDim,p:false},
  "Deployed":{c:T.accent,p:true},"Available":{c:T.green,p:false},
  "Maintenance":{c:T.amber,p:false},
}[s]||{c:T.textDim,p:false});

// ─────────────────────────────────────────────────────────────────
// AUTH USERS  (demo credentials — swap for real IdP in production)
// ─────────────────────────────────────────────────────────────────
const AUTH_USERS=[
  {id:"U-001",email:"admin@shieldsync.com",     password:"Sentinel2025!",name:"Alex Morgan",    role:"Company Admin",badge:"ADMIN-01",av:"AM"},
  {id:"U-002",email:"supervisor@shieldsync.com", password:"Sentinel2025!",name:"Sarah Chen",    role:"Supervisor",   badge:"SUP-001", av:"SC"},
  {id:"U-003",email:"officer@shieldsync.com",   password:"Sentinel2025!",name:"Marcus Webb",   role:"Officer",      badge:"S-0041",  av:"MW"},
  {id:"U-004",email:"client@shieldsync.com",    password:"Sentinel2025!",name:"James Holloway",role:"Client",       badge:"CLT-001", av:"JH"},
];

// ─────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────
const OFFICERS=[
  {id:1,name:"Marcus Webb",badge:"S-0041",av:"MW",status:"On Patrol",site:"Northgate Tower",shift:"06:00–18:00",incidents:2,cps:8},
  {id:2,name:"Diana Reyes",badge:"S-0067",av:"DR",status:"On Site",site:"Harbor Logistics",shift:"06:00–18:00",incidents:0,cps:5},
  {id:3,name:"Theo Okafor",badge:"S-0083",av:"TO",status:"Incident Active",site:"Plaza West",shift:"06:00–18:00",incidents:1,cps:3},
  {id:4,name:"Ava Simmons",badge:"S-0092",av:"AS",status:"Clocked In",site:"Eastside Mall",shift:"06:00–18:00",incidents:0,cps:0},
  {id:5,name:"Jordan Park",badge:"S-0105",av:"JP",status:"Break",site:"Northgate Tower",shift:"06:00–18:00",incidents:0,cps:6},
  {id:6,name:"Elena Voss",badge:"S-0118",av:"EV",status:"Off Duty",site:"—",shift:"18:00–06:00",incidents:0,cps:0},
];
const SITES=[
  {name:"Northgate Tower",x:62,y:22},{name:"Harbor Logistics",x:18,y:70},
  {name:"Plaza West",x:48,y:56,alert:true},{name:"Eastside Mall",x:80,y:64},
];
const INCIDENTS=[
  {id:"INC-2847",type:"Trespass",site:"Plaza West",officer:"Theo Okafor",time:"08:42",sev:"High",status:"Active"},
  {id:"INC-2846",type:"Theft Report",site:"Northgate Tower",officer:"Marcus Webb",time:"07:15",sev:"Medium",status:"Under Review"},
  {id:"INC-2845",type:"Suspicious Vehicle",site:"Harbor Logistics",officer:"Diana Reyes",time:"06:58",sev:"Low",status:"Resolved"},
  {id:"INC-2844",type:"Medical Assist",site:"Eastside Mall",officer:"Ava Simmons",time:"06:23",sev:"High",status:"Resolved"},
  {id:"INC-2843",type:"Property Damage",site:"Northgate Tower",officer:"Marcus Webb",time:"05:47",sev:"Medium",status:"Closed"},
];
const CHECKPOINTS=[
  {id:1,name:"Main Entrance",site:"Northgate Tower",scans:12,missed:0,last:"09:14"},
  {id:2,name:"Parking Deck B",site:"Northgate Tower",scans:8,missed:1,last:"08:55"},
  {id:3,name:"Loading Dock",site:"Harbor Logistics",scans:6,missed:0,last:"09:02"},
  {id:4,name:"Perimeter Gate 3",site:"Plaza West",scans:3,missed:2,last:"07:30"},
  {id:5,name:"Server Room",site:"Eastside Mall",scans:9,missed:0,last:"09:18"},
];
const VEHICLES=[
  {id:"V-01",plate:"TXB 4821",make:"Ford Explorer",status:"Deployed",officer:"Marcus Webb",fuel:78,mileage:42310,lastInsp:"Today 05:48",cond:"Good"},
  {id:"V-02",plate:"RLK 9203",make:"Toyota Highlander",status:"Available",officer:"—",fuel:45,mileage:61892,lastInsp:"Yesterday",cond:"Fair"},
  {id:"V-03",plate:"MPZ 1144",make:"Chevy Tahoe",status:"Maintenance",officer:"—",fuel:20,mileage:88204,lastInsp:"3 days ago",cond:"Needs Service"},
];
const VISITORS_DATA=[
  {id:"V-4421",name:"James Holloway",host:"Building Mgmt",site:"Northgate Tower",in:"08:30",out:"—",badge:"TEMP-312",status:"Active"},
  {id:"V-4420",name:"Samira Patel",host:"IT Dept",site:"Eastside Mall",in:"07:45",out:"09:00",badge:"TEMP-311",status:"Checked Out"},
  {id:"V-4419",name:"Derek Thompson",host:"Security Office",site:"Harbor Logistics",in:"07:00",out:"08:30",badge:"TEMP-310",status:"Checked Out"},
];
const SCHEDULE=[
  {name:"Marcus Webb",site:"Northgate Tower",start:"06:00",end:"18:00",type:"Day",status:"active"},
  {name:"Diana Reyes",site:"Harbor Logistics",start:"06:00",end:"18:00",type:"Day",status:"active"},
  {name:"Theo Okafor",site:"Plaza West",start:"06:00",end:"18:00",type:"Day",status:"active"},
  {name:"Elena Voss",site:"Northgate Tower",start:"18:00",end:"06:00",type:"Night",status:"upcoming"},
  {name:"Sam Torres",site:"Harbor Logistics",start:"18:00",end:"06:00",type:"Night",status:"upcoming"},
  {name:"Ava Simmons",site:"Eastside Mall",start:"06:00",end:"18:00",type:"Day",status:"active"},
];
const EQUIPMENT=[
  {id:"EQ-001",name:"Motorola APX 6000",type:"Radio",status:"Checked Out",officer:"Marcus Webb",badge:"S-0041",checkedOut:"06:00",condition:"Good",serial:"APX-99214"},
  {id:"EQ-002",name:"Tasert X2",type:"CEW",status:"Checked Out",officer:"Theo Okafor",badge:"S-0083",checkedOut:"06:00",condition:"Good",serial:"TX2-44821"},
  {id:"EQ-003",name:"Motorola APX 6000",type:"Radio",status:"Checked Out",officer:"Diana Reyes",badge:"S-0067",checkedOut:"06:00",condition:"Good",serial:"APX-99215"},
  {id:"EQ-004",name:"Bodycam Axon 4",type:"Camera",status:"Available",officer:"—",badge:"—",checkedOut:"—",condition:"Excellent",serial:"AX4-30091"},
  {id:"EQ-005",name:"Pepper Spray OC",type:"OC Spray",status:"Checked Out",officer:"Jordan Park",badge:"S-0105",checkedOut:"06:00",condition:"Good",serial:"OC-10283"},
  {id:"EQ-006",name:"Bodycam Axon 4",type:"Camera",status:"Maintenance",officer:"—",badge:"—",checkedOut:"—",condition:"Needs Service",serial:"AX4-30088"},
  {id:"EQ-007",name:"Handheld Spotlight",type:"Torch",status:"Available",officer:"—",badge:"—",checkedOut:"—",condition:"Good",serial:"TRH-50341"},
  {id:"EQ-008",name:"First Aid Kit",type:"Medical",status:"Checked Out",officer:"Ava Simmons",badge:"S-0092",checkedOut:"06:00",condition:"Good",serial:"FAK-11204"},
];
const LEAVE_REQUESTS=[
  {id:"LV-041",officer:"Jordan Park",badge:"S-0105",type:"Annual",from:"2026-06-14",to:"2026-06-18",days:5,notes:"Family vacation booked.",status:"Pending"},
  {id:"LV-040",officer:"Diana Reyes",badge:"S-0067",type:"Sick",from:"2026-06-05",to:"2026-06-05",days:1,notes:"Medical appointment.",status:"Approved"},
  {id:"LV-039",officer:"Ava Simmons",badge:"S-0092",type:"Training",from:"2026-06-10",to:"2026-06-11",days:2,notes:"First Aid recertification.",status:"Approved"},
  {id:"LV-038",officer:"Marcus Webb",badge:"S-0041",type:"Emergency",from:"2026-06-04",to:"2026-06-04",days:1,notes:"Family emergency.",status:"Pending"},
];
const LEAVE_BALANCES={Annual:18,Sick:10,Training:5,Emergency:3};
const TRAINING_DATA=[
  {id:"TR-001",officer:"Marcus Webb",badge:"S-0041",cert:"SIA Door Supervisor",issuer:"SIA UK",expiry:"2026-08-20",status:"Expiring Soon"},
  {id:"TR-002",officer:"Marcus Webb",badge:"S-0041",cert:"First Aid & CPR",issuer:"Red Cross",expiry:"2027-03-15",status:"Valid"},
  {id:"TR-003",officer:"Diana Reyes",badge:"S-0067",cert:"SIA Door Supervisor",issuer:"SIA UK",expiry:"2027-01-10",status:"Valid"},
  {id:"TR-004",officer:"Diana Reyes",badge:"S-0067",cert:"First Aid & CPR",issuer:"Red Cross",expiry:"2028-06-01",status:"Valid"},
  {id:"TR-005",officer:"Theo Okafor",badge:"S-0083",cert:"SIA Door Supervisor",issuer:"SIA UK",expiry:"2025-11-05",status:"Expired"},
  {id:"TR-006",officer:"Theo Okafor",badge:"S-0083",cert:"Conflict Resolution",issuer:"City & Guilds",expiry:"2027-05-12",status:"Valid"},
  {id:"TR-007",officer:"Ava Simmons",badge:"S-0092",cert:"SIA Door Supervisor",issuer:"SIA UK",expiry:"2027-03-22",status:"Valid"},
  {id:"TR-008",officer:"Jordan Park",badge:"S-0105",cert:"SIA Door Supervisor",issuer:"SIA UK",expiry:"2026-12-01",status:"Valid"},
  {id:"TR-009",officer:"Jordan Park",badge:"S-0105",cert:"First Aid & CPR",issuer:"Red Cross",expiry:"2025-09-14",status:"Expired"},
  {id:"TR-010",officer:"Elena Voss",badge:"S-0118",cert:"SIA Door Supervisor",issuer:"SIA UK",expiry:"2027-06-30",status:"Valid"},
];
const SCAN_LOG_INIT=[
  {id:"SC-001",checkpoint:"Main Entrance",site:"Northgate Tower",officer:"Marcus Webb",badge:"S-0041",ts:"09:14:22",method:"QR"},
  {id:"SC-002",checkpoint:"Server Room",site:"Eastside Mall",officer:"Ava Simmons",badge:"S-0092",ts:"09:18:07",method:"QR"},
  {id:"SC-003",checkpoint:"Loading Dock",site:"Harbor Logistics",officer:"Diana Reyes",badge:"S-0067",ts:"09:02:45",method:"QR"},
  {id:"SC-004",checkpoint:"Parking Deck B",site:"Northgate Tower",officer:"Marcus Webb",badge:"S-0041",ts:"08:55:13",method:"QR"},
];
const PRE_REGISTERED=[
  {id:"PR-001",name:"Claire Hoffman",host:"C-Suite",site:"Northgate Tower",expected:"11:00",purpose:"Board Meeting"},
  {id:"PR-002",name:"Mike Tanaka",host:"IT Dept",site:"Eastside Mall",expected:"13:30",purpose:"Vendor Review"},
];
const AI_INSIGHTS=[
  {text:"Perimeter Gate 3 — 2 missed checkpoints in 2hrs. Plaza West elevated risk pattern.",priority:"critical"},
  {text:"Parking Deck B missed 1 scan. Recommend immediate patrol verification at Northgate Tower.",priority:"high"},
  {text:"Theo Okafor has active incident for 27+ min. Consider dispatching backup to Plaza West.",priority:"high"},
  {text:"Jordan Park at hour 3.5 without logged break. Monitor for fatigue indicators.",priority:"medium"},
  {text:"Patrol completion 94% — above 7-day avg 88%. Operations performing above baseline.",priority:"info"},
  {text:"Certificate alert: Theo Okafor — SIA Door Supervisor expired Nov 2025. Non-compliant deployment.",priority:"critical"},
];
const REPORT_TYPES=["Daily Operations Summary","Incident Report","Patrol Analysis","Workforce Performance","Risk Assessment"];
const NAV=[
  {id:"dashboard",label:"Command",icon:"⚡",roles:["Company Admin","Supervisor","Client"]},
  {id:"myshift",label:"My Shift",icon:"⏱️",roles:["Officer"]},
  {id:"workforce",label:"Workforce",icon:"👮",roles:["Company Admin","Supervisor"]},
  {id:"patrol",label:"Patrol",icon:"🛡️",roles:["Company Admin","Supervisor","Officer"]},
  {id:"fleet",label:"Fleet",icon:"🚗",roles:["Company Admin","Supervisor"]},
  {id:"visitors",label:"Visitors",icon:"🪪",roles:["Company Admin","Supervisor","Officer"]},
  {id:"reports",label:"Reports",icon:"📄",roles:["Company Admin","Supervisor","Client"]},
  {id:"dispatch",label:"Dispatch",icon:"📡",roles:["Company Admin","Supervisor"]},
  {id:"equipment",label:"Equipment",icon:"🔧",roles:["Company Admin","Supervisor","Officer"]},
  {id:"leave",label:"Leave",icon:"📅",roles:["Company Admin","Supervisor","Officer"]},
  {id:"training",label:"Training",icon:"🎓",roles:["Company Admin","Supervisor"]},
  {id:"auditlog",label:"Audit Log",icon:"📋",roles:["Company Admin"]},
];
const KPI_DATA=[
  {label:"Active Officers",value:"5",sub:"1 off duty",icon:"👮",color:T.accent,trend:"+2"},
  {label:"Open Incidents",value:"2",sub:"1 critical",icon:"⚡",color:T.red,trend:"-1"},
  {label:"Patrols Today",value:"38",sub:"94% complete",icon:"🛡️",color:T.green,trend:"+4"},
  {label:"Sites Active",value:"4",sub:"All nominal",icon:"📍",color:T.gold,trend:"0"},
  {label:"Checkpoints",value:"38/42",sub:"4 missed",icon:"✅",color:T.purple,trend:"-2"},
  {label:"Avg Response",value:"4.2m",sub:"↓12% today",icon:"⏱️",color:T.amber,trend:"↓"},
];
const PHOTO_SLOTS=[
  {key:"front",label:"Front"},{key:"rear",label:"Rear"},
  {key:"driverSide",label:"Driver Side"},{key:"passengerSide",label:"Pass. Side"},
  {key:"interior",label:"Interior"},{key:"damage",label:"Damage"},
];
const INSP_STEPS=["Vehicle","Photos","Readings","Notes","Sign & Submit"];

// ─────────────────────────────────────────────────────────────────
// AI DEMO MODE  — shown when API key is not configured
// ─────────────────────────────────────────────────────────────────
const DEMO_NOTE="[Demo Mode — configure API key to enable live AI]\n\n";
const DEMO_AI={
  "Which sites have missed checkpoints?":"Plaza West (2 missed — elevated, related to INC-2847 active scene) and Northgate Tower Parking Deck B (1 missed). Plaza West is priority — 54.5% checkpoint completion this shift vs 100% at Harbor Logistics and Eastside Mall.",
  "Summarize today's ops.":"Operations nominal across 3 of 4 sites. Plaza West elevated due to active trespass INC-2847 (27+ min, single officer). Patrol efficiency 94% above 88% baseline. 2 open incidents, 3 resolved. V-03 in maintenance, V-02 available for emergency dispatch.",
  "Who is highest risk?":"Theo Okafor is highest-risk — solo on active trespass at Plaza West 27+ minutes past protocol. Jordan Park approaching fatigue threshold (3.5 hrs without break). Recommend dispatching Park to Plaza West — resolves both gaps simultaneously.",
  "Recommend staffing changes.":"1) Dispatch Jordan Park to Plaza West immediately — cuts INC-2847 resolution time and covers fatigue risk. 2) Diana Reyes available as secondary from Harbor Logistics (100% completion). 3) Brief Elena Voss on Plaza West situation for night shift handover at 18:00.",
};
const DEMO_FALLBACK="Based on current operations: Plaza West shows elevated risk with INC-2847 active 27+ min. Patrol efficiency at 94% is above baseline. Recommend dispatching Jordan Park to Plaza West. Northgate Tower Parking Deck B needs patrol verification.";
const DEMO_REPORTS={
  "Daily Operations Summary":`DAILY OPERATIONS SUMMARY
${new Date().toLocaleDateString([],{weekday:"long",year:"numeric",month:"long",day:"numeric"})}  |  Shift 06:00–18:00  |  INTERNAL

EXECUTIVE OVERVIEW
All 4 sites operational. 5 of 6 officers on duty. Patrol efficiency 94% — above 7-day baseline of 88%. Two open incidents, one requiring immediate backup.

INCIDENT STATUS
• INC-2847 [HIGH/ACTIVE] — Trespass, Plaza West. Officer Okafor on scene 27+ min. Backup dispatched.
• INC-2846 [MEDIUM/REVIEW] — Theft report, Northgate Tower. Documentation in progress.
• INC-2845, INC-2844 [RESOLVED] — Closed without escalation.

PATROL PERFORMANCE
38 patrols conducted, 36 completed (94.7%). 4 missed checkpoints:
• Perimeter Gate 3 (Plaza West): 2 missed — elevated risk
• Parking Deck B (Northgate Tower): 1 missed — monitor

FLEET
V-01 Explorer: Deployed (Webb)  |  V-02 Highlander: Available  |  V-03 Tahoe: Maintenance

RECOMMENDATIONS
1. Dispatch backup to Plaza West — INC-2847 duration exceeds SOP
2. Increase Perimeter Gate 3 frequency
3. Enforce Jordan Park break within 30 min`,

  "Incident Report":`INCIDENT REPORT — INC-2847
Classification: HIGH SEVERITY  |  Status: ACTIVE

Location: Plaza West — Perimeter Gate 3
Officer: S-0083 Theo Okafor  |  Reported: 08:42  |  Duration: 27+ min

NARRATIVE
At 08:42, Officer Okafor observed an unauthorized individual attempting access to the restricted loading area via the east perimeter gate. The subject was unresponsive to verbal commands and did not possess valid credentials. Officer established visual contact and initiated containment protocol per SOP-14.

ACTIONS TAKEN
• Area secured, access point locked
• Site supervisor notified at 08:45
• CCTV footage requested from monitoring center
• Subject detained pending ID verification

STATUS: Awaiting verification. Backup recommended to support officer and process subject.`,

  "Patrol Analysis":`PATROL ANALYSIS — Current Shift
Sites: 4  |  Period: 06:00–09:20

COMPLETION METRICS
Scheduled: 42 checkpoints  |  Completed: 38 (90.5%)  |  Missed: 4
Target: ≥95%  |  Status: ⚠ BELOW TARGET (Plaza West anomaly)

SITE BREAKDOWN
Northgate Tower:    20/21  95.2%  — 1 missed, Parking Deck B
Harbor Logistics:    9/9  100.0%  — Full completion
Plaza West:          3/5   60.0%  — Active incident INC-2847
Eastside Mall:       9/9  100.0%  — Full completion

OFFICER PERFORMANCE
Top: Marcus Webb — 8 checkpoints, 0 missed
Review: Theo Okafor — 3 checkpoints (active incident reducing patrol time)

NOTE: Excluding INC-2847 scene, effective completion rate is 97.6% — above target.`,

  "Workforce Performance":`WORKFORCE PERFORMANCE
Shift: 06:00–18:00  |  Day Shift

STAFFING
Scheduled: 6  |  Active: 5  |  Off Duty: 1 (Elena Voss — Night rotation)

OFFICER STATUS
Marcus Webb    S-0041  On Patrol        8 CPs  2 incidents
Diana Reyes    S-0067  On Site          5 CPs  0 incidents  ★ Top performer
Theo Okafor    S-0083  Incident Active  3 CPs  1 incident
Ava Simmons    S-0092  Clocked In       0 CPs  0 incidents
Jordan Park    S-0105  Break            6 CPs  0 incidents

HIGHLIGHTS
• Diana Reyes: Flawless patrol, 0 missed, 0 incidents — exceed standard
• Jordan Park: 6 checkpoints pre-break — strong first-half
• Marcus Webb: High incident load — monitor for fatigue

Night rotation (Voss, Torres) ready for 18:00 handover.`,

  "Risk Assessment":`RISK ASSESSMENT — Current Shift
Classification: SENSITIVE INTERNAL

CRITICAL RISK FACTORS
[HIGH] Plaza West — Active trespass 27+ min, single officer on scene, 2 missed checkpoint pattern. Possible pre-surveillance by subject. Immediate backup required.

[MEDIUM] Northgate Tower — Theft report INC-2846 under review. 1 missed scan at Parking Deck B. Possible correlation — investigate.

[MEDIUM] Personnel — Jordan Park at 3.5 hours without logged break. Fatigue risk for final 6 hours of shift.

SITE RISK MATRIX
Plaza West        HIGH    — Immediate backup + perimeter sweep
Northgate Tower   MEDIUM  — CCTV review + Deck B patrol
Harbor Logistics  LOW     — Maintain current coverage
Eastside Mall     LOW     — Maintain current coverage

OVERALL RISK SCORE: 6.2/10 (Elevated — INC-2847 primary driver)
7-Day Baseline: 3.8/10

PRIORITY ACTIONS
1. Dispatch Jordan Park → Plaza West immediately
2. Request CCTV review — Northgate Tower, INC-2846
3. Mandatory break for Jordan Park within 30 min
4. Schedule V-03 return-to-service inspection`,
};

// ─────────────────────────────────────────────────────────────────
// ERROR BOUNDARY
// ─────────────────────────────────────────────────────────────────
class ErrorBoundary extends Component{
  state={err:null};
  static getDerivedStateFromError(e){return{err:e};}
  componentDidCatch(e,info){console.error("[ShieldSync Module Error]",e,info);}
  render(){
    if(this.state.err)return(
      <div style={{padding:48,textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:14}}>⚠️</div>
        <div style={{fontSize:16,fontWeight:800,color:T.red,marginBottom:8}}>Module Error</div>
        <div style={{fontSize:13,color:T.textSub,marginBottom:24,maxWidth:340,margin:"0 auto 24px",lineHeight:1.6}}>{this.state.err.message}</div>
        <button onClick={()=>this.setState({err:null})} style={{background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,padding:"11px 24px",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13}}>↺ Retry Module</button>
      </div>
    );
    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────
function Pill({label,color}){
  const{c}=SM(label);const col=color||c;
  return(
    <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"2px 9px",borderRadius:20,fontSize:10,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",background:`${col}18`,color:col,border:`1px solid ${col}30`,whiteSpace:"nowrap"}}>
      {col!==T.textDim&&<span style={{width:5,height:5,borderRadius:"50%",background:col,display:"inline-block",flexShrink:0}}/>}
      {label}
    </span>
  );
}
function Card({children,glow,style={},onClick}){
  return(
    <div onClick={onClick} style={{background:T.card,borderRadius:14,border:`1px solid ${glow?glow+"35":T.border}`,boxShadow:glow?`0 0 22px ${glow}12`:"none",overflow:"hidden",cursor:onClick?"pointer":"default",...style}}>
      {children}
    </div>
  );
}
function CB({children,style={}}){return<div style={{padding:"18px 20px",...style}}>{children}</div>;}
function SH({title,action}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:T.textSub}}>{title}</span>
      {action&&<button onClick={action.fn} style={{background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,fontSize:11,fontWeight:700,padding:"9px 14px",borderRadius:8,cursor:"pointer",WebkitTapHighlightColor:"transparent",minHeight:38,display:"flex",alignItems:"center"}}>{action.label}</button>}
    </div>
  );
}
function Av({initials,color,size=40}){
  return(
    <div style={{width:size,height:size,borderRadius:Math.round(size*.28),background:`linear-gradient(135deg,${color}30,${color}10)`,border:`1.5px solid ${color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.32,fontWeight:800,color,flexShrink:0}}>
      {initials}
    </div>
  );
}
function FuelBar({pct}){
  const c=pct>50?T.green:pct>25?T.amber:T.red;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.textSub,marginBottom:4}}>
        <span>Fuel</span><span style={{color:c,fontWeight:700}}>{pct}%</span>
      </div>
      <div style={{height:3,background:T.border,borderRadius:2}}>
        <div style={{height:"100%",width:`${pct}%`,background:c,borderRadius:2}}/>
      </div>
    </div>
  );
}
function PBar({value,max,color=T.accent}){
  return(
    <div style={{height:4,background:T.border,borderRadius:2,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${Math.round(value/max*100)}%`,background:color,borderRadius:2}}/>
    </div>
  );
}
function Dots(){
  return(
    <div style={{display:"flex",gap:5,padding:"10px 14px"}}>
      {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:T.accent,animation:`ssDots 0.9s ${i*.2}s ease-in-out infinite`}}/>)}
    </div>
  );
}
function ModalWrap({children}){
  return(
    <div style={{position:"fixed",inset:0,background:T.overlay,display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16,overflowY:"auto"}}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// AUTH SCREEN
// ─────────────────────────────────────────────────────────────────
function AuthScreen({onLogin}){
  const[email,setEmail]=useState("");
  const[pw,setPw]=useState("");
  const[showPw,setShowPw]=useState(false);
  const[err,setErr]=useState("");
  const[showDemo,setShowDemo]=useState(false);
  const[pending,startTransition]=useTransition();

  const attempt=()=>{
    if(!email.trim()||!pw){setErr("Please enter your email and password.");return;}
    setErr("");
    startTransition(async()=>{
      await new Promise(r=>setTimeout(r,850));
      const u=AUTH_USERS.find(u=>u.email.toLowerCase()===email.toLowerCase().trim()&&u.password===pw);
      if(u){saveSession(u);logAction(u,"LOGIN",`Signed in from ${navigator.userAgent.includes("Mobile")?"mobile":"desktop"}`);onLogin(u);}
      else setErr("Incorrect email or password. Please try again.");
    });
  };

  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased;}
        html,body{font-family:'DM Sans',system-ui,sans-serif;background:${T.bg};}
        @keyframes ssUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{opacity:.07}50%{opacity:.15}}
        input:focus{border-color:${T.accentB}!important;}
      `}</style>

      {/* Ambient grid */}
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}} preserveAspectRatio="none">
        {[...Array(22)].map((_,i)=><line key={`v${i}`} x1={`${i*4.76}%`} y1="0" x2={`${i*4.76}%`} y2="100%" stroke={T.accent} strokeWidth=".5" opacity=".05"/>)}
        {[...Array(16)].map((_,i)=><line key={`h${i}`} x1="0" y1={`${i*6.67}%`} x2="100%" y2={`${i*6.67}%`} stroke={T.accent} strokeWidth=".5" opacity=".05"/>)}
      </svg>
      <div style={{position:"absolute",top:"5%",left:"50%",transform:"translateX(-50%)",width:"90vw",maxWidth:800,height:"55vh",background:`radial-gradient(ellipse at center,${T.accentGlow} 0%,transparent 65%)`,pointerEvents:"none",animation:"glow 4s ease-in-out infinite"}}/>

      {/* Branding */}
      <div style={{textAlign:"center",marginBottom:36,animation:"ssUp .35s ease",position:"relative",zIndex:1}}>
        <div style={{width:66,height:66,borderRadius:20,background:`linear-gradient(135deg,${T.accent},${T.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 16px",boxShadow:`0 0 60px ${T.accent}38,0 0 120px ${T.accent}12`}}>⚡</div>
        <div style={{fontSize:34,fontWeight:900,color:T.text,letterSpacing:"-0.03em",fontFamily:"'Syne',system-ui"}}>ShieldSync</div>
        <div style={{fontSize:9,color:T.textDim,letterSpacing:"0.24em",textTransform:"uppercase",marginTop:6}}>SENTINEL · ENTERPRISE SECURITY PLATFORM</div>
      </div>

      {/* Card */}
      <div style={{width:"min(420px,100%)",background:T.surface,border:`1px solid ${T.border}`,borderRadius:22,padding:32,boxShadow:`0 48px 96px rgba(0,0,0,0.7),0 0 0 1px ${T.border}`,animation:"ssUp .45s ease .08s both",position:"relative",zIndex:1}}>
        <div style={{marginBottom:22}}>
          <div style={{fontSize:19,fontWeight:800,color:T.text,letterSpacing:"-0.01em"}}>Secure Access</div>
          <div style={{fontSize:12,color:T.textSub,marginTop:4,lineHeight:1.6}}>Authorized personnel only. All sessions are monitored and logged.</div>
        </div>

        {err&&(
          <div style={{background:T.redGlow,border:`1px solid ${T.redB}`,borderRadius:10,padding:"11px 14px",marginBottom:16,fontSize:13,color:T.red,display:"flex",gap:9,alignItems:"center"}}>
            <span style={{flexShrink:0,fontSize:15}}>⚠</span><span>{err}</span>
          </div>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={{fontSize:10,color:T.textSub,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:7}}>Email Address</label>
            <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&attempt()} placeholder="you@yourcompany.com" autoComplete="email"
              style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",color:T.text,fontSize:14,outline:"none",transition:"border-color .2s",boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{fontSize:10,color:T.textSub,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:7}}>Password</label>
            <div style={{position:"relative"}}>
              <input type={showPw?"text":"password"} value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&attempt()} placeholder="••••••••••" autoComplete="current-password"
                style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 44px 12px 14px",color:T.text,fontSize:14,outline:"none",transition:"border-color .2s",boxSizing:"border-box"}}/>
              <button onClick={()=>setShowPw(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:T.textSub,cursor:"pointer",fontSize:15,lineHeight:1,padding:4}}>{showPw?"●":"○"}</button>
            </div>
          </div>
          <button onClick={attempt} disabled={pending}
            style={{width:"100%",marginTop:4,background:pending?T.raised:`linear-gradient(135deg,${T.accent},${T.accentH})`,border:pending?`1px solid ${T.border}`:"none",borderRadius:12,padding:"14px",color:pending?T.textSub:"#000",fontWeight:800,fontSize:15,cursor:pending?"not-allowed":"pointer",transition:"all .2s",letterSpacing:"-0.01em"}}>
            {pending?"Verifying credentials…":"Sign In →"}
          </button>
        </div>

        {/* Trust signals */}
        <div style={{display:"flex",justifyContent:"center",gap:22,marginTop:22,paddingTop:18,borderTop:`1px solid ${T.border}`}}>
          {[["🔒","TLS 1.3"],["🛡","SOC 2 Ready"],["✓","ISO 27001"]].map(([ic,lb])=>(
            <div key={lb} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:T.textDim}}>
              <span style={{color:T.textSub}}>{ic}</span><span>{lb}</span>
            </div>
          ))}
        </div>

        {/* Demo credentials */}
        <div style={{marginTop:16}}>
          <button onClick={()=>setShowDemo(p=>!p)} style={{width:"100%",background:"none",border:"none",color:T.textDim,fontSize:11,cursor:"pointer",padding:"6px 0",letterSpacing:"0.03em"}}>
            {showDemo?"▲ Hide demo access":"▼ Demo access · Sales & Procurement"}
          </button>
          {showDemo&&(
            <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:6}}>
              <div style={{fontSize:10,color:T.textDim,letterSpacing:"0.1em",textTransform:"uppercase",textAlign:"center",marginBottom:4}}>Click a role to auto-fill</div>
              {AUTH_USERS.map(u=>(
                <button key={u.id} onClick={()=>{setEmail(u.email);setPw(u.password);setErr("");}}
                  style={{background:T.raised,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 13px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",textAlign:"left",WebkitTapHighlightColor:"transparent"}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:T.text}}>{u.name}</div>
                    <div style={{fontSize:10,color:T.textSub,marginTop:1,fontFamily:"monospace"}}>{u.email}</div>
                  </div>
                  <div style={{fontSize:9,fontWeight:700,color:T.accent,background:T.accentGlow,border:`1px solid ${T.accentB}`,padding:"3px 9px",borderRadius:5,whiteSpace:"nowrap",flexShrink:0,marginLeft:8}}>{u.role}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{marginTop:20,fontSize:10,color:T.textDim,textAlign:"center",position:"relative",zIndex:1,lineHeight:1.8}}>
        © 2025 ShieldSync Inc. · All access is logged and monitored.<br/>
        Unauthorized access is prohibited and subject to prosecution.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// VISITOR CHECK-IN MODAL
// ─────────────────────────────────────────────────────────────────
function CheckInModal({onClose,showToast}){
  const[form,setForm]=useState({name:"",host:"",site:"Northgate Tower",duration:"2"});
  const[done,setDone]=useState(false);
  const[badge]=useState("TEMP-"+(313+Math.floor(Math.random()*87)));
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  const valid=form.name.trim()&&form.host.trim();

  const submit=()=>{
    if(!valid)return;
    setDone(true);
    showToast(`${form.name} checked in at ${form.site} · Badge ${badge}`,"success");
  };

  if(done)return(
    <ModalWrap>
      <Card style={{width:"min(400px,92vw)",textAlign:"center"}}>
        <CB style={{padding:"44px 32px"}}>
          <div style={{fontSize:48,marginBottom:14}}>🪪</div>
          <div style={{fontSize:18,fontWeight:800,color:T.green,marginBottom:10}}>Check-In Complete</div>
          <div style={{fontSize:13,color:T.textSub,lineHeight:1.65}}>
            <strong style={{color:T.text}}>{form.name}</strong> is now checked in at {form.site}.<br/>Badge <span style={{color:T.accent,fontFamily:"monospace"}}>{badge}</span> issued · Host notified.
          </div>
          <button onClick={onClose} style={{marginTop:26,background:T.green,border:"none",color:"#000",padding:"13px",borderRadius:12,fontWeight:800,cursor:"pointer",fontSize:14,width:"100%"}}>Done →</button>
        </CB>
      </Card>
    </ModalWrap>
  );

  return(
    <ModalWrap>
      <Card style={{width:"min(460px,94vw)"}}>
        <CB>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div>
              <div style={{fontSize:10,color:T.textSub,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>Visitor Management</div>
              <div style={{fontSize:18,fontWeight:800,color:T.text}}>New Check-In</div>
            </div>
            <button onClick={onClose} style={{background:"none",border:`1px solid ${T.border}`,color:T.textSub,width:34,height:34,borderRadius:8,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <label style={{fontSize:11,color:T.textSub,fontWeight:700,display:"block",marginBottom:6}}>Visitor Full Name *</label>
              <input value={form.name} onChange={e=>upd("name",e.target.value)} placeholder="John Smith"
                style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",color:T.text,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{fontSize:11,color:T.textSub,fontWeight:700,display:"block",marginBottom:6}}>Host / Department *</label>
              <input value={form.host} onChange={e=>upd("host",e.target.value)} placeholder="IT Department · Building Management"
                style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",color:T.text,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={{fontSize:11,color:T.textSub,fontWeight:700,display:"block",marginBottom:6}}>Site</label>
                <select value={form.site} onChange={e=>upd("site",e.target.value)} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",color:T.text,fontSize:13,outline:"none",WebkitAppearance:"none"}}>
                  {["Northgate Tower","Harbor Logistics","Plaza West","Eastside Mall"].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,color:T.textSub,fontWeight:700,display:"block",marginBottom:6}}>Duration</label>
                <select value={form.duration} onChange={e=>upd("duration",e.target.value)} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",color:T.text,fontSize:13,outline:"none",WebkitAppearance:"none"}}>
                  {[["1","≤ 1 hour"],["2","≤ 2 hours"],["4","Half day"],["8","Full day"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div style={{background:T.raised,borderRadius:9,padding:"11px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:T.textSub}}>Auto-assigned badge</span>
              <span style={{fontSize:13,color:T.accent,fontFamily:"monospace",fontWeight:800}}>{badge}</span>
            </div>
            <button onClick={submit} disabled={!valid}
              style={{background:valid?T.green:T.raised,border:`1px solid ${valid?T.green:T.border}`,color:valid?"#000":T.textDim,padding:"13px",borderRadius:12,cursor:valid?"pointer":"not-allowed",fontWeight:800,fontSize:14}}>
              Check In Visitor ✓
            </button>
          </div>
        </CB>
      </Card>
    </ModalWrap>
  );
}

// ─────────────────────────────────────────────────────────────────
// LIVE MAP
// ─────────────────────────────────────────────────────────────────
const LiveMap=memo(function LiveMap({officers}){
  const siteOfs={};
  officers.forEach(o=>{if(o.site!=="—"){if(!siteOfs[o.site])siteOfs[o.site]=[];siteOfs[o.site].push(o);}});
  return(
    <div style={{position:"relative",width:"100%",paddingBottom:"56%",background:"#050810",borderRadius:10,overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0}}>
        <svg width="100%" height="100%" style={{position:"absolute",inset:0,opacity:.06}}>
          {[...Array(10)].map((_,i)=><line key={`v${i}`} x1={`${(i+1)*9.09}%`} y1="0" x2={`${(i+1)*9.09}%`} y2="100%" stroke={T.accent} strokeWidth="1"/>)}
          {[...Array(7)].map((_,i)=><line key={`h${i}`} x1="0" y1={`${(i+1)*12.5}%`} x2="100%" y2={`${(i+1)*12.5}%`} stroke={T.accent} strokeWidth="1"/>)}
        </svg>
        <svg width="100%" height="100%" style={{position:"absolute",inset:0,opacity:.12}}>
          <line x1="18%" y1="70%" x2="48%" y2="56%" stroke={T.textDim} strokeWidth="1.5" strokeDasharray="5,5"/>
          <line x1="48%" y1="56%" x2="62%" y2="22%" stroke={T.textDim} strokeWidth="1.5" strokeDasharray="5,5"/>
          <line x1="48%" y1="56%" x2="80%" y2="64%" stroke={T.textDim} strokeWidth="1.5" strokeDasharray="5,5"/>
        </svg>
        {SITES.map(site=>{
          const ofs=siteOfs[site.name]||[];
          const hasInc=ofs.some(o=>o.status==="Incident Active");
          const col=hasInc?T.red:T.accent;
          return(
            <div key={site.name} style={{position:"absolute",left:`${site.x}%`,top:`${site.y}%`,transform:"translate(-50%,-50%)"}}>
              {hasInc&&[1,2].map(n=>(
                <div key={n} style={{position:"absolute",inset:-(n*9),borderRadius:"50%",border:`1px solid ${T.red}`,opacity:.45/n,animation:`ssRing ${.8+n*.4}s ease-out ${n*.3}s infinite`}}/>
              ))}
              <div style={{width:14,height:14,borderRadius:"50%",background:col,boxShadow:`0 0 10px ${col}`,border:"2px solid rgba(255,255,255,.25)",position:"relative",zIndex:2}}/>
              <div style={{position:"absolute",top:18,left:"50%",transform:"translateX(-50%)",background:"rgba(6,9,16,.92)",border:`1px solid ${T.border}`,padding:"3px 8px",borderRadius:5,whiteSpace:"nowrap",fontSize:9,color:T.textSub,fontWeight:700,zIndex:3}}>
                {site.name}{ofs.length>0&&<span style={{color:col,marginLeft:5}}>· {ofs.length}</span>}
              </div>
              {ofs.map((o,i)=>{
                const angle=(i/Math.max(ofs.length,1))*Math.PI*2;
                const r=10,x=Math.cos(angle)*r,y=Math.sin(angle)*r;
                return(
                  <div key={o.id} title={`${o.name} — ${o.status}`} style={{position:"absolute",top:"50%",left:"50%",transform:`translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`,width:7,height:7,borderRadius:"50%",background:SM(o.status).c,border:"1.5px solid rgba(0,0,0,.4)",boxShadow:`0 0 5px ${SM(o.status).c}`,zIndex:2}}/>
                );
              })}
            </div>
          );
        })}
        <div style={{position:"absolute",top:10,right:12,display:"flex",alignItems:"center",gap:5,fontSize:10,color:T.green,fontWeight:700}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:T.green,boxShadow:`0 0 6px ${T.green}`,animation:"ssB 1s infinite"}}/>LIVE SYNC
        </div>
        <div style={{position:"absolute",bottom:10,left:12,display:"flex",gap:10}}>
          {[["Patrol",T.accent],["Incident",T.red],["Break",T.purple]].map(([l,c])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:T.textSub}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:c}}/>
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────
// AI COPILOT
// ─────────────────────────────────────────────────────────────────
const QUICK=["Which sites have missed checkpoints?","Summarize today's ops.","Who is highest risk?","Recommend staffing changes."];
const AI_SYS=`You are ShieldSync AI — elite operational intelligence assistant for a security workforce platform.
Context: 5 officers active, 4 sites (Northgate Tower, Harbor Logistics, Plaza West, Eastside Mall).
Open: INC-2847 Trespass @ Plaza West (HIGH/Active), INC-2846 Theft @ Northgate (MEDIUM/Under Review).
Patrol: 94% (4 missed CPs). Avg response 4.2 min. V-01 Deployed, V-02 Available, V-03 Maintenance.
Rules: Be direct, tactical, data-driven. Max 3-4 sentences. No filler.`;

function AICopilot(){
  const[msgs,setMsgs]=useState([{role:"ai",text:"ShieldSync AI online. 4 sites monitored, 5 officers active, 2 open incidents. Patrol efficiency 94%. What do you need?"}]);
  const[inp,setInp]=useState("");
  const[loading,setLoading]=useState(false);
  const endRef=useRef(null);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,loading]);

  const send=useCallback(async(txt)=>{
    const msg=(txt||inp).trim();
    if(!msg||loading)return;
    setInp("");
    const next=[...msgs,{role:"user",text:msg}];
    setMsgs(next);setLoading(true);
    const apiMsgs=next.map(m=>({role:m.role==="ai"?"assistant":"user",content:m.text}));
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,system:AI_SYS,messages:apiMsgs}),
      });
      if(!res.ok)throw new Error(`${res.status}`);
      const data=await res.json();
      const reply=data.content?.find(b=>b.type==="text")?.text||"No response.";
      setMsgs(p=>[...p,{role:"ai",text:reply}]);
    }catch{setMsgs(p=>[...p,{role:"ai",text:DEMO_NOTE+(DEMO_AI[msg]||DEMO_FALLBACK)}]);}
    setLoading(false);
  },[inp,msgs,loading]);

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:280}}>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,paddingBottom:4}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",flexDirection:m.role==="user"?"row-reverse":"row"}}>
            {m.role==="ai"&&<div style={{width:26,height:26,borderRadius:8,flexShrink:0,background:`linear-gradient(135deg,${T.accent},${T.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>⚡</div>}
            <div style={{maxWidth:"82%",padding:"9px 13px",borderRadius:m.role==="user"?"12px 12px 3px 12px":"12px 12px 12px 3px",background:m.role==="user"?`linear-gradient(135deg,${T.accent}20,${T.purple}15)`:T.raised,border:`1px solid ${m.role==="user"?T.accentB:T.border}`,fontSize:13,lineHeight:1.6,color:T.text}}>
              {m.text}
            </div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{width:26,height:26,borderRadius:8,background:`linear-gradient(135deg,${T.accent},${T.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>⚡</div>
            <div style={{background:T.raised,borderRadius:12,border:`1px solid ${T.border}`}}><Dots/></div>
          </div>
        )}
        <div ref={endRef}/>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,margin:"10px 0 8px"}}>
        {QUICK.map(p=>(
          <button key={p} onClick={()=>send(p)} disabled={loading} style={{background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,fontSize:10,fontWeight:700,padding:"4px 9px",borderRadius:6,cursor:"pointer",opacity:loading?.5:1}}>
            {p}
          </button>
        ))}
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Ask ShieldSync AI…" disabled={loading} style={{flex:1,background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 14px",color:T.text,fontSize:13,outline:"none",WebkitAppearance:"none"}}/>
        <button onClick={()=>send()} disabled={loading||!inp.trim()} style={{background:`linear-gradient(135deg,${T.accent},${T.accentH})`,border:"none",borderRadius:10,padding:"10px 16px",color:"#000",fontWeight:800,cursor:"pointer",fontSize:14,opacity:loading||!inp.trim()?.5:1}}>→</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// VEHICLE INSPECTION MODAL
// ─────────────────────────────────────────────────────────────────
function InspModal({vehicle,onClose}){
  const[step,setStep]=useState(0);
  const[photos,setPhotos]=useState({});
  const[mileage,setMileage]=useState(String(vehicle.mileage));
  const[fuel,setFuel]=useState(String(vehicle.fuel));
  const[dmg,setDmg]=useState("");
  const[notes,setNotes]=useState("");
  const[signed,setSigned]=useState(false);
  const[done,setDone]=useState(false);
  const[sigOpen,setSigOpen]=useState(false);
  const[sigDrawn,setSigDrawn]=useState(false);
  const fileRef=useRef(null);
  const[slot,setSlot]=useState(null);
  const canvRef=useRef(null);
  const drawing=useRef(false);

  const pickFile=useCallback((k)=>{setSlot(k);setTimeout(()=>fileRef.current?.click(),50);},[]);
  const onFile=useCallback((e)=>{
    const f=e.target.files?.[0];if(!f||!slot)return;
    const r=new FileReader();
    r.onload=(ev)=>setPhotos(p=>({...p,[slot]:ev.target.result}));
    r.readAsDataURL(f);e.target.value="";
  },[slot]);

  const onSD=(e)=>{drawing.current=true;const cv=canvRef.current,rc=cv.getBoundingClientRect(),ctx=cv.getContext("2d");ctx.beginPath();ctx.moveTo((e.touches?.[0]?.clientX??e.clientX)-rc.left,(e.touches?.[0]?.clientY??e.clientY)-rc.top);setSigDrawn(true);};
  const onSM=(e)=>{if(!drawing.current)return;e.preventDefault();const cv=canvRef.current,rc=cv.getBoundingClientRect(),ctx=cv.getContext("2d");ctx.lineTo((e.touches?.[0]?.clientX??e.clientX)-rc.left,(e.touches?.[0]?.clientY??e.clientY)-rc.top);ctx.strokeStyle=T.accent;ctx.lineWidth=2.5;ctx.lineCap="round";ctx.stroke();};
  const onSE=()=>{drawing.current=false;};
  const clearSig=()=>{canvRef.current?.getContext("2d").clearRect(0,0,500,160);setSigDrawn(false);};
  const acceptSig=()=>{if(sigDrawn){setSigned(true);setSigOpen(false);}};
  const pc=Object.keys(photos).length;

  if(done)return(
    <ModalWrap>
      <Card style={{width:"min(440px,92vw)",textAlign:"center"}}>
        <CB style={{padding:"48px 32px"}}>
          <div style={{fontSize:52,marginBottom:16}}>✅</div>
          <div style={{fontSize:20,fontWeight:800,color:T.green,marginBottom:8}}>Inspection Submitted</div>
          <div style={{fontSize:13,color:T.textSub,lineHeight:1.6}}>Vehicle {vehicle.plate} inspection logged.<br/>Sent to supervisor for review.</div>
          <div style={{marginTop:16,fontSize:11,color:T.textDim}}>{pc} photo{pc!==1?"s":""} captured · Mileage: {mileage} · Fuel: {fuel}%</div>
          <button onClick={onClose} style={{marginTop:28,background:T.green,border:"none",color:"#000",padding:"13px 36px",borderRadius:12,fontWeight:800,cursor:"pointer",fontSize:14,width:"100%"}}>Done →</button>
        </CB>
      </Card>
    </ModalWrap>
  );

  return(
    <ModalWrap>
      {sigOpen&&(
        <div style={{position:"fixed",inset:0,background:T.overlay,zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:16}}>
          <Card style={{width:"min(480px,94vw)"}}>
            <CB>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <span style={{fontWeight:800,fontSize:15,color:T.text}}>Digital Signature</span>
                <button onClick={()=>setSigOpen(false)} style={{background:"none",border:`1px solid ${T.border}`,color:T.textSub,padding:"4px 10px",borderRadius:6,cursor:"pointer"}}>Cancel</button>
              </div>
              <div style={{fontSize:12,color:T.textSub,marginBottom:10}}>Draw your signature below to confirm inspection</div>
              <canvas ref={canvRef} width={460} height={160}
                onMouseDown={onSD} onMouseMove={onSM} onMouseUp={onSE} onMouseLeave={onSE}
                onTouchStart={onSD} onTouchMove={onSM} onTouchEnd={onSE}
                style={{width:"100%",height:160,background:T.raised,borderRadius:10,border:`1px solid ${T.border}`,display:"block",cursor:"crosshair",touchAction:"none"}}/>
              <div style={{display:"flex",gap:10,marginTop:14}}>
                <button onClick={clearSig} style={{flex:1,background:T.raised,border:`1px solid ${T.border}`,color:T.textSub,padding:"11px",borderRadius:10,cursor:"pointer",fontWeight:600}}>Clear</button>
                <button onClick={acceptSig} disabled={!sigDrawn} style={{flex:2,background:sigDrawn?T.green:T.raised,border:`1px solid ${sigDrawn?T.green:T.border}`,color:sigDrawn?"#000":T.textDim,padding:"11px",borderRadius:10,cursor:sigDrawn?"pointer":"not-allowed",fontWeight:800}}>Accept Signature</button>
              </div>
            </CB>
          </Card>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFile} style={{display:"none"}}/>
      <Card style={{width:"min(560px,94vw)",maxHeight:"90vh",overflowY:"auto"}}>
        <CB>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
            <div>
              <div style={{fontSize:10,color:T.textSub,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>Vehicle Inspection</div>
              <div style={{fontSize:18,fontWeight:800,color:T.text}}>{vehicle.make}</div>
              <div style={{fontSize:12,color:T.accent,fontFamily:"monospace",marginTop:2}}>{vehicle.plate} · {vehicle.id}</div>
            </div>
            <button onClick={onClose} style={{background:"none",border:`1px solid ${T.border}`,color:T.textSub,width:34,height:34,borderRadius:8,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",gap:3,marginBottom:8}}>
              {INSP_STEPS.map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=step?T.accent:T.border,transition:"background 0.3s"}}/>)}
            </div>
            <div style={{fontSize:10,fontWeight:700,color:T.accent,letterSpacing:"0.1em",textTransform:"uppercase"}}>Step {step+1}/{INSP_STEPS.length}: {INSP_STEPS[step]}</div>
          </div>
          {step===0&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[["Vehicle ID",vehicle.id],["License Plate",vehicle.plate],["Make / Model",vehicle.make],["Assigned Officer",vehicle.officer||"Unassigned"],["Condition",vehicle.cond],["Last Inspection",vehicle.lastInsp]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 14px",background:T.raised,borderRadius:9,gap:10}}>
                  <span style={{fontSize:12,color:T.textSub,flexShrink:0}}>{l}</span>
                  <span style={{fontSize:13,color:T.text,fontWeight:700,textAlign:"right"}}>{v}</span>
                </div>
              ))}
              <div style={{marginTop:4,padding:"10px 14px",background:T.accentGlow,border:`1px solid ${T.accentB}`,borderRadius:9,fontSize:12,color:T.accent}}>
                📍 GPS tagged · {new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})} · Inspector logged
              </div>
            </div>
          )}
          {step===1&&(
            <div>
              <div style={{fontSize:12,color:T.textSub,marginBottom:14,lineHeight:1.5}}>Tap each slot to capture or upload a photo.</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {PHOTO_SLOTS.map(sl=>(
                  <div key={sl.key} onClick={()=>pickFile(sl.key)} style={{aspectRatio:"1",background:photos[sl.key]?"transparent":T.raised,border:`2px ${photos[sl.key]?"solid":"dashed"} ${photos[sl.key]?T.green:T.border}`,borderRadius:10,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden",position:"relative",WebkitTapHighlightColor:"transparent"}}>
                    {photos[sl.key]?(
                      <>
                        <img src={photos[sl.key]} alt={sl.label} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                        <div style={{position:"absolute",top:4,right:4,background:T.green,width:18,height:18,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#000"}}>✓</div>
                      </>
                    ):(
                      <>
                        <span style={{fontSize:22,marginBottom:4}}>📷</span>
                        <span style={{fontSize:10,color:T.textSub,textAlign:"center",padding:"0 4px"}}>{sl.label}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div style={{marginTop:12,fontSize:11,color:T.textSub,textAlign:"center"}}>{pc}/6 photos{pc===6&&" · ✅ All areas captured"}</div>
            </div>
          )}
          {step===2&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div>
                <label style={{fontSize:12,color:T.textSub,display:"block",marginBottom:7,fontWeight:600}}>Current Mileage (miles)</label>
                <input type="number" value={mileage} onChange={e=>setMileage(e.target.value)} inputMode="numeric" style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",color:T.text,fontSize:16,outline:"none",boxSizing:"border-box",WebkitAppearance:"none"}}/>
              </div>
              <div>
                <label style={{fontSize:12,color:T.textSub,display:"block",marginBottom:7,fontWeight:600}}>Fuel Level: <span style={{color:T.accent,fontWeight:800}}>{fuel}%</span></label>
                <input type="range" min={0} max={100} value={fuel} onChange={e=>setFuel(e.target.value)} style={{width:"100%",accentColor:T.accent,height:24}}/>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.textDim,marginTop:2}}><span>Empty</span><span>Full</span></div>
              </div>
              <div>
                <label style={{fontSize:12,color:T.textSub,display:"block",marginBottom:7,fontWeight:600}}>Damage Notes <span style={{color:T.textDim,fontWeight:400}}>(if any)</span></label>
                <textarea value={dmg} onChange={e=>setDmg(e.target.value)} placeholder="Describe any visible damage…" rows={4} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",color:T.text,fontSize:13,resize:"none",outline:"none",boxSizing:"border-box",lineHeight:1.5}}/>
              </div>
            </div>
          )}
          {step===3&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={{fontSize:12,color:T.textSub,display:"block",marginBottom:7,fontWeight:600}}>General Inspection Notes</label>
                <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Equipment status, safety observations…" rows={6} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",color:T.text,fontSize:13,resize:"none",outline:"none",boxSizing:"border-box",lineHeight:1.6}}/>
              </div>
              <div style={{padding:"12px 14px",background:T.raised,borderRadius:9,display:"flex",flexDirection:"column",gap:5}}>
                <div style={{fontSize:11,color:T.textSub,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>Summary</div>
                <div style={{fontSize:12,color:T.text}}>📷 {pc}/6 photos</div>
                <div style={{fontSize:12,color:T.text}}>📊 Mileage: {mileage} mi</div>
                <div style={{fontSize:12,color:T.text}}>⛽ Fuel: {fuel}%</div>
                {dmg&&<div style={{fontSize:12,color:T.amber}}>⚠️ Damage notes recorded</div>}
              </div>
            </div>
          )}
          {step===4&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{padding:"14px 16px",background:T.raised,borderRadius:9,fontSize:12,color:T.textSub,lineHeight:1.6}}>
                By signing, you confirm this inspection is accurate and complete. This report will be archived and sent to your supervisor.
              </div>
              <div onClick={()=>!signed&&setSigOpen(true)} style={{padding:"20px",background:signed?T.greenGlow:T.raised,border:`2px ${signed?"solid":"dashed"} ${signed?T.green:T.border}`,borderRadius:12,textAlign:"center",cursor:signed?"default":"pointer",WebkitTapHighlightColor:"transparent"}}>
                {signed?<div style={{color:T.green,fontWeight:800,fontSize:15}}>✓ Digitally Signed</div>:<div style={{color:T.textSub,fontSize:13}}>Tap to sign digitally →</div>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[["Photos",`${pc}/6`,pc===6?T.green:T.amber],["Mileage",`${mileage} mi`,T.text],["Fuel",`${fuel}%`,parseInt(fuel)>25?T.text:T.red],["Signature",signed?"Done":"Needed",signed?T.green:T.amber]].map(([l,v,c])=>(
                  <div key={l} style={{background:T.raised,borderRadius:8,padding:"10px 12px"}}>
                    <div style={{fontSize:10,color:T.textSub}}>{l}</div>
                    <div style={{fontSize:13,fontWeight:700,color:c,marginTop:3}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{display:"flex",gap:10,marginTop:22}}>
            {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{flex:1,background:T.raised,border:`1px solid ${T.border}`,color:T.text,padding:"13px",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:14}}>← Back</button>}
            {step<INSP_STEPS.length-1?(
              <button onClick={()=>setStep(s=>s+1)} style={{flex:2,background:`linear-gradient(135deg,${T.accent},${T.accentH})`,border:"none",color:"#000",padding:"13px",borderRadius:12,cursor:"pointer",fontWeight:800,fontSize:14}}>Continue →</button>
            ):(
              <button onClick={()=>signed&&setDone(true)} disabled={!signed} style={{flex:2,background:signed?T.green:T.raised,border:`1px solid ${signed?T.green:T.border}`,color:signed?"#000":T.textDim,padding:"13px",borderRadius:12,cursor:signed?"pointer":"not-allowed",fontWeight:800,fontSize:14}}>Submit Inspection ✓</button>
            )}
          </div>
        </CB>
      </Card>
    </ModalWrap>
  );
}

// ─────────────────────────────────────────────────────────────────
// INCIDENT MODAL
// ─────────────────────────────────────────────────────────────────
function IncModal({onClose,showToast}){
  const[form,setForm]=useState({type:"Trespass",site:"Northgate Tower",desc:"",sev:"Medium"});
  const[done,setDone]=useState(false);
  const[gen,setGen]=useState(false);
  const[ai,setAi]=useState("");
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));

  const genNarrative=async()=>{
    if(!form.desc)return;setGen(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,system:"You are a professional security report writer. Generate a formal, concise incident report narrative from officer notes. Professional security language, 3-5 sentences.",messages:[{role:"user",content:`Type: ${form.type}\nSite: ${form.site}\nSeverity: ${form.sev}\nNotes: ${form.desc}\n\nWrite a formal incident report narrative.`}]})});
      if(!res.ok)throw new Error(`${res.status}`);
      const data=await res.json();
      setAi(data.content?.[0]?.text||"");
    }catch{setAi(`At ${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}, the responding officer documented a ${form.type.toLowerCase()} incident at ${form.site}. ${form.desc?form.desc+" ":""}Appropriate containment measures were initiated per site security protocol (SOP-14). The incident has been logged and escalated to the shift supervisor for review and follow-up action. All parties have been notified per standard operating procedure.`);}
    setGen(false);
  };

  const submit=()=>{
    setDone(true);
    showToast("INC-2848 created and submitted for supervisor review","success");
  };

  if(done)return(
    <ModalWrap>
      <Card style={{width:"min(440px,92vw)",textAlign:"center"}}>
        <CB style={{padding:"48px 32px"}}>
          <div style={{fontSize:52,marginBottom:16}}>📋</div>
          <div style={{fontSize:18,fontWeight:800,color:T.green,marginBottom:8}}>Incident Logged</div>
          <div style={{fontSize:13,color:T.textSub}}>INC-2848 created and submitted for supervisor review.</div>
          <button onClick={onClose} style={{marginTop:24,background:T.green,border:"none",color:"#000",padding:"13px 36px",borderRadius:12,fontWeight:800,cursor:"pointer",fontSize:14,width:"100%"}}>Done →</button>
        </CB>
      </Card>
    </ModalWrap>
  );

  return(
    <ModalWrap>
      <Card style={{width:"min(520px,94vw)",maxHeight:"90vh",overflowY:"auto"}}>
        <CB>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div>
              <div style={{fontSize:10,color:T.textSub,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>New Incident</div>
              <div style={{fontSize:18,fontWeight:800,color:T.text}}>INC-2848</div>
            </div>
            <button onClick={onClose} style={{background:"none",border:`1px solid ${T.border}`,color:T.textSub,width:34,height:34,borderRadius:8,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <label style={{fontSize:11,color:T.textSub,display:"block",marginBottom:6,fontWeight:700}}>Type</label>
                <select value={form.type} onChange={e=>upd("type",e.target.value)} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:9,padding:"11px 12px",color:T.text,fontSize:13,cursor:"pointer",WebkitAppearance:"none"}}>
                  {["Trespass","Theft Report","Suspicious Vehicle","Medical Assist","Property Damage","Disturbance","Fire Alarm","Other"].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,color:T.textSub,display:"block",marginBottom:6,fontWeight:700}}>Severity</label>
                <select value={form.sev} onChange={e=>upd("sev",e.target.value)} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:9,padding:"11px 12px",color:T.text,fontSize:13,cursor:"pointer",WebkitAppearance:"none"}}>
                  {["Low","Medium","High","Critical"].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{fontSize:11,color:T.textSub,display:"block",marginBottom:6,fontWeight:700}}>Site</label>
              <select value={form.site} onChange={e=>upd("site",e.target.value)} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:9,padding:"11px 12px",color:T.text,fontSize:13,cursor:"pointer",WebkitAppearance:"none"}}>
                {["Northgate Tower","Harbor Logistics","Plaza West","Eastside Mall"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:11,color:T.textSub,display:"block",marginBottom:6,fontWeight:700}}>Officer Notes</label>
              <textarea value={form.desc} onChange={e=>upd("desc",e.target.value)} placeholder="Describe what happened, persons involved, actions taken…" rows={5} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",color:T.text,fontSize:13,resize:"none",outline:"none",boxSizing:"border-box",lineHeight:1.6}}/>
            </div>
            <button onClick={genNarrative} disabled={gen||!form.desc} style={{background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,padding:"11px",borderRadius:10,cursor:form.desc?"pointer":"not-allowed",fontWeight:700,fontSize:13,opacity:!form.desc?.5:1}}>
              {gen?"⚡ Generating…":"⚡ Generate AI Narrative"}
            </button>
            {ai&&(
              <div style={{background:T.accentGlow,border:`1px solid ${T.accentB}`,borderRadius:10,padding:"14px 16px"}}>
                <div style={{fontSize:10,color:T.accent,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>AI Narrative</div>
                <div style={{fontSize:13,color:T.text,lineHeight:1.7}}>{ai}</div>
              </div>
            )}
            <button onClick={submit} style={{background:`linear-gradient(135deg,${T.red},#C03030)`,border:"none",color:"#fff",padding:"14px",borderRadius:12,cursor:"pointer",fontWeight:800,fontSize:14}}>Submit Incident Report</button>
          </div>
        </CB>
      </Card>
    </ModalWrap>
  );
}

// ─────────────────────────────────────────────────────────────────
// MODULES
// ─────────────────────────────────────────────────────────────────
function Dashboard({openModal}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(148px,1fr))",gap:10}}>
        {KPI_DATA.map(k=>(
          <Card key={k.label} glow={k.color}>
            <CB style={{padding:"16px 18px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <span style={{fontSize:22}}>{k.icon}</span>
                <span style={{fontSize:10,fontWeight:800,color:k.color,background:`${k.color}18`,padding:"2px 7px",borderRadius:4}}>{k.trend}</span>
              </div>
              <div style={{fontSize:26,fontWeight:900,color:k.color,lineHeight:1}}>{k.value}</div>
              <div style={{fontSize:12,fontWeight:700,color:T.text,marginTop:5}}>{k.label}</div>
              <div style={{fontSize:11,color:T.textSub,marginTop:2}}>{k.sub}</div>
            </CB>
          </Card>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.5fr) minmax(0,1fr)",gap:16}}>
        <Card><CB><SH title="Live Operations Map"/><LiveMap officers={OFFICERS}/></CB></Card>
        <Card style={{display:"flex",flexDirection:"column"}}>
          <CB style={{flex:1,display:"flex",flexDirection:"column"}}>
            <SH title="ShieldSync AI Copilot"/>
            <div style={{flex:1}}><AICopilot/></div>
          </CB>
        </Card>
      </div>
      <Card>
        <CB>
          <SH title="AI Risk Intelligence"/>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {AI_INSIGHTS.map((ins,i)=>{
              const c={critical:T.red,high:T.amber,medium:T.gold,info:T.accent}[ins.priority]||T.textSub;
              return(
                <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"11px 14px",background:`${c}08`,border:`1px solid ${c}22`,borderRadius:10}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:c,marginTop:5,flexShrink:0}}/>
                  <p style={{margin:0,fontSize:13,color:T.text,lineHeight:1.55,flex:1}}>{ins.text}</p>
                  <Pill label={ins.priority} color={c}/>
                </div>
              );
            })}
          </div>
        </CB>
      </Card>
      <Card>
        <CB>
          <SH title="Recent Incidents" action={{label:"+ New Incident",fn:()=>openModal({type:"incident"})}}/>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:540}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${T.border}`}}>
                  {["ID","Type","Site","Officer","Time","Severity","Status"].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"7px 10px",color:T.textSub,fontWeight:700,fontSize:10,letterSpacing:"0.07em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INCIDENTS.map(inc=>(
                  <tr key={inc.id} style={{borderBottom:`1px solid ${T.border}20`}}>
                    <td style={{padding:"11px 10px",color:T.accent,fontWeight:800,fontFamily:"monospace",whiteSpace:"nowrap"}}>{inc.id}</td>
                    <td style={{padding:"11px 10px",color:T.text,whiteSpace:"nowrap"}}>{inc.type}</td>
                    <td style={{padding:"11px 10px",color:T.textSub,whiteSpace:"nowrap"}}>{inc.site}</td>
                    <td style={{padding:"11px 10px",color:T.text,whiteSpace:"nowrap"}}>{inc.officer}</td>
                    <td style={{padding:"11px 10px",color:T.textSub}}>{inc.time}</td>
                    <td style={{padding:"11px 10px"}}><Pill label={inc.sev} color={inc.sev==="High"?T.red:inc.sev==="Medium"?T.amber:T.textSub}/></td>
                    <td style={{padding:"11px 10px"}}><Pill label={inc.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CB>
      </Card>
    </div>
  );
}

function Workforce(){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(265px,1fr))",gap:12}}>
        {OFFICERS.map(o=>{
          const c=SM(o.status).c;
          return(
            <Card key={o.id} glow={c}>
              <CB>
                <div style={{display:"flex",gap:14,alignItems:"center"}}>
                  <Av initials={o.av} color={c} size={44}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:800,fontSize:14,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.name}</div>
                    <div style={{fontSize:11,color:T.textSub,marginTop:1}}>{o.badge} · {o.shift}</div>
                    <div style={{marginTop:7}}><Pill label={o.status}/></div>
                  </div>
                </div>
                <div style={{marginTop:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div style={{background:T.raised,borderRadius:8,padding:"9px 12px"}}>
                    <div style={{fontSize:10,color:T.textSub,marginBottom:2}}>Site</div>
                    <div style={{fontSize:12,color:T.text,fontWeight:700}}>{o.site}</div>
                  </div>
                  <div style={{background:T.raised,borderRadius:8,padding:"9px 12px"}}>
                    <div style={{fontSize:10,color:T.textSub,marginBottom:2}}>Checkpoints</div>
                    <div style={{fontSize:12,color:T.accent,fontWeight:800}}>{o.cps} hit</div>
                  </div>
                </div>
                {o.incidents>0&&<div style={{marginTop:10,padding:"9px 12px",background:T.redGlow,borderRadius:8,border:`1px solid ${T.redB}`,fontSize:12,color:T.red,fontWeight:700}}>⚡ {o.incidents} active incident{o.incidents>1?"s":""}</div>}
              </CB>
            </Card>
          );
        })}
      </div>
      <Card>
        <CB>
          <SH title="Today's Schedule"/>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {SCHEDULE.map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:T.raised,borderRadius:10}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:s.status==="active"?T.green:T.amber,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.text}}>{s.name}</div>
                  <div style={{fontSize:11,color:T.textSub}}>{s.site}</div>
                </div>
                <div style={{fontSize:11,color:T.textSub,whiteSpace:"nowrap"}}>{s.start} – {s.end}</div>
                <Pill label={s.type} color={s.type==="Day"?T.gold:T.purple}/>
                <Pill label={s.status} color={s.status==="active"?T.green:T.amber}/>
              </div>
            ))}
          </div>
        </CB>
      </Card>
    </div>
  );
}

function Patrol({user,showToast}){
  const[scanLog,setScanLog]=useLS("ss_scans",SCAN_LOG_INIT);
  const[scanning,setScanning]=useState(false);
  const[scanTarget,setScanTarget]=useState(null);
  const[scanProgress,setScanProgress]=useState(0);
  const scanRef=useRef(null);

  const startScan=(cp)=>{
    if(scanning)return;
    setScanTarget(cp);setScanProgress(0);setScanning(true);
    let p=0;
    scanRef.current=setInterval(()=>{
      p+=3;setScanProgress(p);
      if(p>=100){
        clearInterval(scanRef.current);
        const now=new Date();
        const ts=now.toLocaleTimeString([],{hour12:false});
        const entry={id:`SC-${Date.now()}`,checkpoint:cp.name,site:cp.site,officer:user?.name||"Officer",badge:user?.badge||"—",ts,method:"QR"};
        setScanLog(l=>[entry,...l.slice(0,99)]);
        logAction(user,"CHECKPOINT_SCAN",`${cp.name} — ${cp.site}`);
        showToast(`✓ ${cp.name} scanned successfully`,"success");
        setScanning(false);setScanTarget(null);setScanProgress(0);
      }
    },55);
  };
  useEffect(()=>()=>clearInterval(scanRef.current),[]);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(138px,1fr))",gap:10}}>
        {[["38","Total Patrols",T.accent,"🛡️"],["36","Completed",T.green,"✅"],["4","Missed CPs",T.red,"⚠️"],["42m","Avg Duration",T.gold,"⏱️"]].map(([v,l,c,icon])=>(
          <Card key={l} glow={c}>
            <CB style={{textAlign:"center",padding:"16px 12px"}}>
              <div style={{fontSize:22,marginBottom:8}}>{icon}</div>
              <div style={{fontSize:28,fontWeight:900,color:c}}>{v}</div>
              <div style={{fontSize:11,color:T.textSub,marginTop:4}}>{l}</div>
            </CB>
          </Card>
        ))}
      </div>

      {/* QR Scan modal */}
      {scanning&&scanTarget&&(
        <ModalWrap>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:18,padding:28,width:"100%",maxWidth:340,textAlign:"center"}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:T.textSub,marginBottom:12}}>Scanning QR Code</div>
            <div style={{width:160,height:160,margin:"0 auto 16px",borderRadius:12,background:T.raised,border:`2px solid ${T.accentB}`,position:"relative",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{position:"absolute",top:0,left:0,width:"100%",height:3,background:`linear-gradient(90deg,transparent,${T.accent},transparent)`,animation:"ssQR 1s ease-in-out infinite"}}/>
              {["tl","tr","bl","br"].map(c=>(
                <div key={c} style={{position:"absolute",...(c==="tl"?{top:8,left:8}:c==="tr"?{top:8,right:8}:c==="bl"?{bottom:8,left:8}:{bottom:8,right:8}),width:20,height:20,borderTop:c.startsWith("t")?`3px solid ${T.accent}`:"none",borderBottom:c.startsWith("b")?`3px solid ${T.accent}`:"none",borderLeft:c.endsWith("l")?`3px solid ${T.accent}`:"none",borderRight:c.endsWith("r")?`3px solid ${T.accent}`:"none"}}/>
              ))}
              <div style={{fontSize:28}}>📷</div>
            </div>
            <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:4}}>{scanTarget.name}</div>
            <div style={{fontSize:11,color:T.textSub,marginBottom:16}}>{scanTarget.site}</div>
            <div style={{height:6,background:T.raised,borderRadius:3,marginBottom:16,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${scanProgress}%`,background:`linear-gradient(90deg,${T.accent},${T.green})`,borderRadius:3,transition:"width 0.05s linear"}}/>
            </div>
            <div style={{fontSize:12,color:T.accent}}>{scanProgress<100?"Reading code…":"Confirmed ✓"}</div>
          </div>
        </ModalWrap>
      )}

      <Card>
        <CB>
          <SH title="Checkpoint Status"/>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {CHECKPOINTS.map(cp=>{
              const total=cp.scans+cp.missed;
              const c=cp.missed>1?T.red:cp.missed>0?T.amber:T.green;
              return(
                <div key={cp.id} style={{padding:"13px 15px",background:T.raised,borderRadius:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:T.text}}>{cp.name}</div>
                      <div style={{fontSize:11,color:T.textSub,marginTop:2}}>{cp.site} · Last: {cp.last}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:14,fontWeight:800,color:c}}>{cp.scans}/{total}</div>
                        {cp.missed>0&&<div style={{fontSize:10,color:T.red,fontWeight:700}}>{cp.missed} missed</div>}
                      </div>
                      <button onClick={()=>startScan(cp)} style={{background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,padding:"6px 10px",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:11}}>QR</button>
                    </div>
                  </div>
                  <PBar value={cp.scans} max={total} color={c}/>
                </div>
              );
            })}
          </div>
        </CB>
      </Card>

      <Card>
        <CB>
          <SH title="Scan Log"/>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {scanLog.slice(0,10).map(s=>(
              <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:T.raised,borderRadius:8}}>
                <div style={{fontSize:10,color:T.textDim,fontFamily:"monospace",flexShrink:0,width:60}}>{s.ts}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.text}}>{s.checkpoint}</div>
                  <div style={{fontSize:10,color:T.textSub}}>{s.site} · {s.officer}</div>
                </div>
                <Pill label={s.method} color={T.green}/>
              </div>
            ))}
          </div>
        </CB>
      </Card>
    </div>
  );
}

function Fleet({openModal}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(285px,1fr))",gap:12}}>
        {VEHICLES.map(v=>{
          const c=SM(v.status).c;
          return(
            <Card key={v.id} glow={c}>
              <CB>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div>
                    <div style={{fontSize:16,fontWeight:800,color:T.text}}>{v.make}</div>
                    <div style={{fontSize:12,color:T.accent,fontFamily:"monospace",marginTop:2}}>{v.plate}</div>
                  </div>
                  <Pill label={v.status}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                  {[["Officer",v.officer],["Mileage",v.mileage.toLocaleString()+" mi"],["Last Insp.",v.lastInsp],["Condition",v.cond]].map(([l,val])=>(
                    <div key={l} style={{background:T.raised,borderRadius:8,padding:"9px 11px"}}>
                      <div style={{fontSize:10,color:T.textSub}}>{l}</div>
                      <div style={{fontSize:12,color:T.text,fontWeight:700,marginTop:2}}>{val}</div>
                    </div>
                  ))}
                </div>
                <FuelBar pct={v.fuel}/>
                <button onClick={()=>openModal({type:"inspection",vehicle:v})} style={{width:"100%",marginTop:14,background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,padding:"11px",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13}}>📋 Start Inspection</button>
              </CB>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Visitors({openModal,user,showToast}){
  const[visitors,setVisitors]=useLS("ss_visitors",VISITORS_DATA);
  const active=visitors.filter(v=>v.status==="Active").length;
  const out=visitors.filter(v=>v.status==="Checked Out").length;

  const checkOut=(id)=>{
    const now=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    setVisitors(v=>v.map(x=>x.id===id?{...x,status:"Checked Out",out:now}:x));
    logAction(user,"VISITOR_CHECKOUT",`Visitor ${id} checked out`);
    showToast("Visitor checked out","success");
  };
  const checkInPreReg=(pr)=>{
    const now=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    const bnum=`TEMP-${Math.floor(Math.random()*900)+100}`;
    const newV={id:`V-${Date.now()}`,name:pr.name,host:pr.host,site:pr.site,in:now,out:"—",badge:bnum,status:"Active"};
    setVisitors(v=>[newV,...v]);
    logAction(user,"VISITOR_CHECKIN",`Pre-registered: ${pr.name} (${pr.purpose})`);
    showToast(`${pr.name} checked in — Badge ${bnum}`,"success");
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        {[["Active",active,T.green],["Out Today",out,T.textSub],["Watchlist","0",T.red]].map(([l,v,c])=>(
          <Card key={l} glow={c}>
            <CB style={{textAlign:"center"}}>
              <div style={{fontSize:30,fontWeight:900,color:c}}>{v}</div>
              <div style={{fontSize:11,color:T.textSub,marginTop:5}}>{l}</div>
            </CB>
          </Card>
        ))}
      </div>

      {PRE_REGISTERED.length>0&&(
        <Card glow={T.purple}>
          <CB>
            <SH title="Expected Arrivals"/>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {PRE_REGISTERED.map(pr=>(
                <div key={pr.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:T.raised,borderRadius:9}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.text}}>{pr.name}</div>
                    <div style={{fontSize:11,color:T.textSub}}>{pr.host} · {pr.site} · {pr.purpose}</div>
                  </div>
                  <div style={{fontSize:11,color:T.purple,fontWeight:700,flexShrink:0}}>{pr.expected}</div>
                  <button onClick={()=>checkInPreReg(pr)} style={{background:T.greenGlow,border:`1px solid ${T.greenB}`,color:T.green,padding:"7px 12px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:11,flexShrink:0}}>Check In</button>
                </div>
              ))}
            </div>
          </CB>
        </Card>
      )}

      <Card>
        <CB>
          <SH title="Visitor Log" action={{label:"+ Check In",fn:()=>openModal({type:"checkin"})}}/>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {visitors.map(v=>(
              <div key={v.id} style={{display:"flex",gap:12,alignItems:"center",padding:"12px 14px",background:T.raised,borderRadius:10}}>
                <div style={{width:36,height:36,borderRadius:10,background:T.accentGlow,border:`1px solid ${T.accentB}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>👤</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.name}</div>
                  <div style={{fontSize:11,color:T.textSub}}>Host: {v.host} · {v.site}</div>
                </div>
                <div style={{textAlign:"right",fontSize:11,color:T.textSub,flexShrink:0}}><div>In: {v.in}</div><div>Out: {v.out}</div></div>
                <div style={{textAlign:"right",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
                  <div style={{fontSize:10,color:T.textDim,fontFamily:"monospace"}}>{v.badge}</div>
                  <Pill label={v.status} color={v.status==="Active"?T.green:T.textSub}/>
                  {v.status==="Active"&&<button onClick={()=>checkOut(v.id)} style={{fontSize:10,background:T.raised,border:`1px solid ${T.border}`,color:T.textSub,padding:"3px 8px",borderRadius:5,cursor:"pointer",fontWeight:700}}>Check Out</button>}
                </div>
              </div>
            ))}
          </div>
        </CB>
      </Card>
    </div>
  );
}

function Reports(){
  const[rtype,setRtype]=useState(REPORT_TYPES[0]);
  const[loading,setLoading]=useState(false);
  const[report,setReport]=useState("");

  const generate=async()=>{
    setLoading(true);setReport("");
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,system:"You are ShieldSync AI Report Generator. Write professional, structured security operations reports. Use ALL CAPS section headers. Be specific with data.",messages:[{role:"user",content:`Generate a ${rtype} for today's operations.\n\nData: 5/6 officers active, 4 sites (Northgate Tower, Harbor Logistics, Plaza West, Eastside Mall). Open incidents: INC-2847 Trespass @ Plaza West (HIGH/Active), INC-2846 Theft @ Northgate (MEDIUM/Under Review). Resolved: INC-2845, INC-2844. Patrols: 38 conducted, 94% completion, 4 missed checkpoints. Avg response: 4.2 min (↓12% vs yesterday). Fleet: V-01 Deployed, V-02 Available, V-03 Maintenance. Visitors: 1 active, 2 checked out.\n\nMake it client-ready and professional.`}]})});
      if(!res.ok)throw new Error(`${res.status}`);
      const data=await res.json();
      setReport(data.content?.[0]?.text||"No content received.");
    }catch{setReport(DEMO_REPORTS[rtype]||"Report template unavailable.");}
    setLoading(false);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Card>
        <CB>
          <SH title="AI Report Generator"/>
          <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:16}}>
            {REPORT_TYPES.map(t=>(
              <button key={t} onClick={()=>setRtype(t)} style={{background:rtype===t?T.accentGlow:T.raised,border:`1px solid ${rtype===t?T.accentB:T.border}`,color:rtype===t?T.accent:T.textSub,padding:"8px 14px",borderRadius:9,cursor:"pointer",fontSize:12,fontWeight:700,transition:"all 0.15s"}}>{t}</button>
            ))}
          </div>
          <button onClick={generate} disabled={loading} style={{width:"100%",background:loading?T.raised:`linear-gradient(135deg,${T.accent},${T.accentH})`,border:loading?`1px solid ${T.border}`:"none",color:loading?T.textSub:"#000",padding:"14px",borderRadius:12,cursor:loading?"not-allowed":"pointer",fontWeight:800,fontSize:14,marginBottom:report?16:0}}>
            {loading?"⚡ Generating Report…":`Generate ${rtype}`}
          </button>
          {report&&(
            <div>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <button onClick={()=>{
                  const w=window.open("","_blank");
                  w.document.write(`<!DOCTYPE html><html><head><title>ShieldSync — ${rtype}</title><style>body{font-family:monospace;padding:40px;white-space:pre-wrap;font-size:13px;line-height:1.75;color:#111;}@media print{body{padding:20px;}}</style></head><body>${report.replace(/&/g,"&amp;").replace(/</g,"&lt;")}</body></html>`);
                  w.document.close();w.print();
                }} style={{background:T.greenGlow,border:`1px solid ${T.greenB}`,color:T.green,padding:"9px 14px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>🖨 Print / PDF</button>
                <button onClick={()=>{
                  const blob=new Blob([report],{type:"text/plain"});
                  const url=URL.createObjectURL(blob);
                  const a=document.createElement("a");a.href=url;a.download=`${rtype.replace(/ /g,"_")}.txt`;a.click();URL.revokeObjectURL(url);
                }} style={{background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,padding:"9px 14px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>⬇ Export</button>
              </div>
              <div style={{background:T.raised,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px 22px"}}>
                <pre style={{margin:0,fontSize:13,color:T.text,whiteSpace:"pre-wrap",lineHeight:1.75,fontFamily:"inherit"}}>{report}</pre>
              </div>
            </div>
          )}
        </CB>
      </Card>
    </div>
  );
}

function Dispatch({showToast,user}){
  const[dispatched,setDispatched]=useState({});
  const[radioState,setRadioState]=useState("idle");
  const[notifPerm,setNotifPerm]=useState(typeof Notification!=="undefined"?Notification.permission:"denied");

  const enableNotifs=async()=>{
    if(typeof Notification==="undefined"){showToast("Notifications not supported in this browser","error");return;}
    const p=await Notification.requestPermission();
    setNotifPerm(p);
    if(p==="granted")showToast("Push notifications enabled","success");
  };
  const pushNotif=(title,body)=>{
    if(typeof Notification!=="undefined"&&Notification.permission==="granted"){
      new Notification(title,{body,icon:"/favicon.svg"});
    }
  };

  const dispatchOfficer=(o,dest)=>{
    setDispatched(p=>({...p,[o.id]:dest}));
    logAction(user,"DISPATCH",`${o.name} → ${dest}`);
    showToast(`${o.name} dispatched to ${dest}`,"success");
    pushNotif("ShieldSync Dispatch",`${o.name} dispatched to ${dest}`);
  };

  const radioAll=()=>{
    if(radioState!=="idle")return;
    setRadioState("broadcasting");
    setTimeout(()=>{
      setRadioState("sent");
      logAction(user,"RADIO_ALL","All-units broadcast on Channel 4");
      showToast("All active field units notified · Broadcast on Channel 4","success");
      pushNotif("ShieldSync Radio","All-units broadcast transmitted on Channel 4");
      setTimeout(()=>setRadioState("idle"),5000);
    },1800);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Card glow={T.red}>
        <CB>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:T.red,animation:"ssB 1s infinite"}}/>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.red}}>Priority: INC-2847 Trespass — Plaza West</span>
          </div>
          <div style={{fontSize:13,color:T.text,lineHeight:1.6,marginBottom:14}}>Theo Okafor has been handling an active trespass at Plaza West for 27 min. Backup dispatch recommended.</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>setDispatched(p=>({...p,5:"Plaza West"}))}
              style={{background:dispatched[5]?T.greenGlow:T.red,border:`1px solid ${dispatched[5]?T.greenB:"transparent"}`,color:dispatched[5]?T.green:"#fff",padding:"11px 20px",borderRadius:10,cursor:"pointer",fontWeight:800,fontSize:13,transition:"all .2s"}}>
              {dispatched[5]?"✓ Jordan Park Dispatched":"Dispatch Jordan Park →"}
            </button>
            <button onClick={radioAll} disabled={radioState!=="idle"}
              style={{background:radioState==="sent"?T.greenGlow:radioState==="broadcasting"?T.accentGlow:T.raised,border:`1px solid ${radioState==="sent"?T.greenB:radioState==="broadcasting"?T.accentB:T.border}`,color:radioState==="sent"?T.green:radioState==="broadcasting"?T.accent:T.textSub,padding:"11px 16px",borderRadius:10,cursor:radioState==="idle"?"pointer":"default",fontWeight:700,fontSize:13,transition:"all .2s"}}>
              {radioState==="broadcasting"?"📡 Broadcasting…":radioState==="sent"?"✓ All Units Notified · CH-4":"📡 Radio All Units"}
            </button>
          </div>
        </CB>
      </Card>
      <Card>
        <CB>
          <SH title="Field Units"/>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {OFFICERS.filter(o=>o.status!=="Off Duty").map(o=>{
              const c=SM(o.status).c;
              return(
                <div key={o.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:T.raised,borderRadius:10}}>
                  <Av initials={o.av} color={c} size={36}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.text}}>{o.name}</div>
                    <div style={{fontSize:11,color:T.textSub}}>{o.badge} · {o.site}</div>
                  </div>
                  <Pill label={o.status}/>
                  {dispatched[o.id]?(
                    <div style={{fontSize:11,color:T.green,fontWeight:700,whiteSpace:"nowrap",background:T.greenGlow,border:`1px solid ${T.greenB}`,padding:"5px 10px",borderRadius:7}}>→ {dispatched[o.id]}</div>
                  ):(
                    <button onClick={()=>dispatchOfficer(o,"Plaza West")}
                      style={{background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>Dispatch</button>
                  )}
                </div>
              );
            })}
          </div>
        </CB>
      </Card>
      {notifPerm!=="granted"&&(
        <Card glow={T.purple}>
          <CB style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:3}}>Enable Push Notifications</div>
              <div style={{fontSize:11,color:T.textSub}}>Receive instant dispatch and emergency alerts on this device.</div>
            </div>
            <button onClick={enableNotifs} style={{background:`linear-gradient(135deg,${T.purple},${T.accent})`,border:"none",color:"#000",padding:"10px 16px",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:12,flexShrink:0}}>Enable →</button>
          </CB>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MY SHIFT
// ─────────────────────────────────────────────────────────────────
function MyShift({user,showToast}){
  const[clocked,setClocked]=useState(false);
  const[clockInTime,setClockInTime]=useState(null);
  const[elapsed,setElapsed]=useState(0);
  const[shiftStatus,setShiftStatus]=useState("On Patrol");
  const[enRoute,setEnRoute]=useState(false);
  const[enRouteDest,setEnRouteDest]=useState("");
  const[enRouteETA,setEnRouteETA]=useState(0);
  const[enRouteElapsed,setEnRouteElapsed]=useState(0);
  const[activity,setActivity]=useLS("ss_shift_activity",[
    {time:"08:55",text:"Checkpoint scanned — Parking Deck B"},
    {time:"08:41",text:"Checkpoint scanned — Main Entrance"},
    {time:"07:58",text:"Patrol route started — Northgate Tower"},
    {time:"06:00",text:"Shift started"},
  ]);
  const[loneWorker,setLoneWorker]=useState(30*60);
  const[loneWorkerActive,setLoneWorkerActive]=useState(false);
  const[handoverNote,setHandoverNote]=useState("");
  const[handoverSent,setHandoverSent]=useState(false);
  const timerRef=useRef(null);
  const enRouteRef=useRef(null);
  const lwRef=useRef(null);

  useEffect(()=>{
    if(loneWorkerActive&&clocked){
      lwRef.current=setInterval(()=>{
        setLoneWorker(t=>{
          if(t<=1){
            clearInterval(lwRef.current);
            showToast("⚠️ Lone worker check-in MISSED — supervisor alerted","error");
            logAction(user,"LONE_WORKER_MISSED","Automatic alert triggered");
            return 30*60;
          }
          return t-1;
        });
      },1000);
    }else{
      clearInterval(lwRef.current);
    }
    return()=>clearInterval(lwRef.current);
  },[loneWorkerActive,clocked]);

  const lwCheckIn=()=>{
    setLoneWorker(30*60);
    addActivity("Lone worker check-in confirmed ✓");
    showToast("Check-in confirmed — next in 30 min","success");
    logAction(user,"LONE_WORKER_CHECKIN","Manual check-in");
  };

  useEffect(()=>{
    if(clocked){
      timerRef.current=setInterval(()=>setElapsed(e=>e+1),1000);
    }else{
      clearInterval(timerRef.current);
    }
    return()=>clearInterval(timerRef.current);
  },[clocked]);

  useEffect(()=>{
    if(enRoute&&enRouteETA>0){
      enRouteRef.current=setInterval(()=>{
        setEnRouteElapsed(e=>{
          if(e+1>=enRouteETA*60){
            clearInterval(enRouteRef.current);
            return enRouteETA*60;
          }
          return e+1;
        });
      },1000);
    }else{
      clearInterval(enRouteRef.current);
    }
    return()=>clearInterval(enRouteRef.current);
  },[enRoute,enRouteETA]);

  const fmt=(s)=>{
    const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;
    return h>0?`${h}h ${String(m).padStart(2,"0")}m`:`${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  };

  const addActivity=(text)=>{
    const t=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    setActivity(a=>[{time:t,text},...a.slice(0,19)]);
  };
  const clockIn=()=>{
    const t=new Date();
    setClocked(true);setClockInTime(t);setElapsed(0);
    addActivity("Clocked in — shift started");
    logAction(user,"CLOCK_IN","Shift started");
    showToast("Shift started — have a safe tour","success");
  };
  const clockOut=()=>{
    setClocked(false);setEnRoute(false);setLoneWorkerActive(false);
    addActivity("Clocked out — shift ended");
    logAction(user,"CLOCK_OUT",`Shift ended after ${fmt(elapsed)}`);
    showToast("Shift ended — stay safe","info");
  };
  const startEnRoute=()=>{
    if(!enRouteDest)return;
    const eta=Math.floor(Math.random()*8)+3;
    setEnRouteETA(eta);setEnRouteElapsed(0);setEnRoute(true);
    setShiftStatus("En Route");
    addActivity(`En route to ${enRouteDest} — ETA ${eta} min`);
    showToast(`En route to ${enRouteDest}. ETA ${eta} min`,"info");
  };
  const arrived=()=>{
    setEnRoute(false);setShiftStatus("On Site");
    addActivity(`Arrived at ${enRouteDest}`);
    showToast(`Arrived at ${enRouteDest}`,"success");
    setEnRouteDest("");
  };
  const sos=()=>{
    addActivity("🚨 SOS ACTIVATED — Supervisor notified");
    showToast("🚨 SOS sent — supervisor and dispatch alerted","error");
  };

  const SHIFT_DURATION=12*3600;
  const pct=clocked?Math.min(100,Math.round(elapsed/SHIFT_DURATION*100)):0;
  const destinations=["Plaza West","Northgate Tower","Harbor Logistics","Eastside Mall","Command Post"];
  const etaRemaining=enRoute?Math.max(0,enRouteETA*60-enRouteElapsed):0;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Clock card */}
      <Card glow={clocked?T.green:T.border}>
        <CB>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:T.textSub,marginBottom:6}}>Current Shift</div>
              {clocked
                ?<div style={{fontSize:42,fontWeight:900,color:T.green,fontFamily:"monospace",letterSpacing:"-0.02em",lineHeight:1}}>{fmt(elapsed)}</div>
                :<div style={{fontSize:28,fontWeight:900,color:T.textDim}}>Not Clocked In</div>
              }
              {clocked&&clockInTime&&<div style={{fontSize:11,color:T.textSub,marginTop:4}}>Since {clockInTime.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})} · {pct}% of 12h shift</div>}
            </div>
            <Pill label={clocked?shiftStatus:"Off Duty"} color={clocked?SM(shiftStatus).c:T.textDim}/>
          </div>
          {clocked&&(
            <div style={{marginBottom:16}}>
              <PBar value={elapsed} max={SHIFT_DURATION} color={T.green}/>
            </div>
          )}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {!clocked
              ?<button onClick={clockIn} style={{flex:1,background:`linear-gradient(135deg,${T.green},#00a84e)`,border:"none",color:"#000",padding:"14px",borderRadius:12,cursor:"pointer",fontWeight:900,fontSize:15}}>⏱ Clock In</button>
              :<>
                {["On Patrol","On Site","Break"].map(s=>(
                  <button key={s} onClick={()=>{setShiftStatus(s);addActivity(`Status changed to ${s}`);}} style={{flex:1,background:shiftStatus===s?`${SM(s).c}20`:T.raised,border:`1px solid ${shiftStatus===s?SM(s).c:T.border}`,color:shiftStatus===s?SM(s).c:T.textSub,padding:"9px 8px",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:11}}>{s}</button>
                ))}
                <button onClick={clockOut} style={{flex:1,background:T.raised,border:`1px solid ${T.redB}`,color:T.red,padding:"9px 12px",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:12}}>Clock Out</button>
              </>
            }
          </div>
        </CB>
      </Card>

      {/* En Route */}
      {clocked&&(
        <Card glow={enRoute?T.gold:undefined}>
          <CB>
            <SH title="En Route"/>
            {!enRoute?(
              <div style={{display:"flex",gap:8}}>
                <select value={enRouteDest} onChange={e=>setEnRouteDest(e.target.value)} style={{flex:1,background:T.raised,border:`1px solid ${T.border}`,color:enRouteDest?T.text:T.textDim,padding:"10px 12px",borderRadius:9,fontSize:13,cursor:"pointer"}}>
                  <option value="">Select destination…</option>
                  {destinations.map(d=><option key={d}>{d}</option>)}
                </select>
                <button onClick={startEnRoute} disabled={!enRouteDest} style={{background:enRouteDest?T.accentGlow:T.raised,border:`1px solid ${enRouteDest?T.accentB:T.border}`,color:enRouteDest?T.accent:T.textDim,padding:"10px 16px",borderRadius:9,cursor:enRouteDest?"pointer":"not-allowed",fontWeight:700,fontSize:13}}>Go →</button>
              </div>
            ):(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:T.text}}>{enRouteDest}</div>
                    <div style={{fontSize:11,color:T.gold}}>ETA: {Math.ceil(etaRemaining/60)} min remaining</div>
                  </div>
                  <button onClick={arrived} style={{background:T.greenGlow,border:`1px solid ${T.greenB}`,color:T.green,padding:"9px 16px",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:13}}>✓ Arrived</button>
                </div>
                <PBar value={enRouteElapsed} max={enRouteETA*60} color={T.gold}/>
              </div>
            )}
          </CB>
        </Card>
      )}

      {/* Today stats */}
      {clocked&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {[["Checkpoints","8",T.accent,"✅"],["Incidents","0",T.green,"⚡"],["Hours",fmt(elapsed),T.gold,"⏱️"]].map(([l,v,c,icon])=>(
            <Card key={l} glow={c}>
              <CB style={{textAlign:"center",padding:"14px 10px"}}>
                <div style={{fontSize:18,marginBottom:6}}>{icon}</div>
                <div style={{fontSize:20,fontWeight:900,color:c}}>{v}</div>
                <div style={{fontSize:10,color:T.textSub,marginTop:3}}>{l}</div>
              </CB>
            </Card>
          ))}
        </div>
      )}

      {/* Lone Worker */}
      {clocked&&(
        <Card glow={loneWorkerActive&&loneWorker<300?T.red:loneWorkerActive?T.amber:undefined}>
          <CB>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:loneWorkerActive?10:0}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.text}}>Lone Worker Protection</div>
                {loneWorkerActive&&<div style={{fontSize:11,color:loneWorker<300?T.red:T.amber,marginTop:3}}>Next check-in in {Math.floor(loneWorker/60)}:{String(loneWorker%60).padStart(2,"0")}</div>}
              </div>
              <div style={{display:"flex",gap:7}}>
                {loneWorkerActive&&<button onClick={lwCheckIn} style={{background:T.greenGlow,border:`1px solid ${T.greenB}`,color:T.green,padding:"8px 12px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>✓ Check In</button>}
                <button onClick={()=>setLoneWorkerActive(a=>!a)} style={{background:loneWorkerActive?T.redGlow:T.accentGlow,border:`1px solid ${loneWorkerActive?T.redB:T.accentB}`,color:loneWorkerActive?T.red:T.accent,padding:"8px 12px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>{loneWorkerActive?"Disable":"Enable"}</button>
              </div>
            </div>
            {loneWorkerActive&&<PBar value={30*60-loneWorker} max={30*60} color={loneWorker<300?T.red:T.amber}/>}
          </CB>
        </Card>
      )}

      {/* SOS */}
      {clocked&&(
        <button onClick={sos} style={{width:"100%",background:"rgba(240,68,68,0.12)",border:`2px solid ${T.red}`,color:T.red,padding:"16px",borderRadius:12,cursor:"pointer",fontWeight:900,fontSize:16,letterSpacing:"0.08em"}}>🚨 SOS — Emergency Alert</button>
      )}

      {/* Shift Handover */}
      {clocked&&(
        <Card>
          <CB>
            <SH title="Shift Handover Notes"/>
            {!handoverSent?(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <textarea value={handoverNote} onChange={e=>setHandoverNote(e.target.value)} rows={3} placeholder="Outstanding incidents, patrol notes, equipment status…" style={{background:T.raised,border:`1px solid ${T.border}`,color:T.text,padding:"11px 13px",borderRadius:9,fontSize:12,resize:"vertical",outline:"none"}}/>
                <button onClick={()=>{if(!handoverNote.trim())return;logAction(user,"HANDOVER_NOTES",handoverNote.slice(0,120));setHandoverSent(true);showToast("Handover notes submitted","success");}} style={{background:handoverNote.trim()?T.accentGlow:T.raised,border:`1px solid ${handoverNote.trim()?T.accentB:T.border}`,color:handoverNote.trim()?T.accent:T.textDim,padding:"10px",borderRadius:9,cursor:handoverNote.trim()?"pointer":"not-allowed",fontWeight:700,fontSize:13}}>Submit Handover</button>
              </div>
            ):(
              <div style={{background:T.greenGlow,border:`1px solid ${T.greenB}`,borderRadius:9,padding:"13px 15px",color:T.green,fontWeight:700,fontSize:13}}>✓ Handover notes submitted to incoming shift</div>
            )}
          </CB>
        </Card>
      )}

      {/* Activity */}
      <Card>
        <CB>
          <SH title="Recent Activity"/>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {activity.slice(0,6).map((a,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 10px",background:T.raised,borderRadius:8}}>
                <div style={{fontSize:10,color:T.textDim,fontFamily:"monospace",paddingTop:1,flexShrink:0,width:36}}>{a.time}</div>
                <div style={{fontSize:12,color:T.textSub,lineHeight:1.45}}>{a.text}</div>
              </div>
            ))}
          </div>
        </CB>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// EQUIPMENT TRACKING
// ─────────────────────────────────────────────────────────────────
function EquipmentModule({user,showToast}){
  const[items,setItems]=useState(EQUIPMENT);
  const[checkOutModal,setCheckOutModal]=useState(null);
  const[checkInModal,setCheckInModal]=useState(null);
  const isOfficer=user?.role==="Officer";
  const myItems=isOfficer?items.filter(e=>e.badge===user?.badge):items;

  const doCheckOut=(id,officerName,badgeNum)=>{
    const now=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    setItems(prev=>prev.map(e=>e.id===id?{...e,status:"Checked Out",officer:officerName,badge:badgeNum,checkedOut:now}:e));
    setCheckOutModal(null);
    showToast(`${items.find(e=>e.id===id)?.name} checked out to ${officerName}`,"success");
  };
  const doCheckIn=(id,condition)=>{
    setItems(prev=>prev.map(e=>e.id===id?{...e,status:"Available",officer:"—",badge:"—",checkedOut:"—",condition}:e));
    setCheckInModal(null);
    showToast(`${items.find(e=>e.id===id)?.name} checked in`,"success");
  };

  const statusColor=(s)=>s==="Checked Out"?T.accent:s==="Available"?T.green:T.amber;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10}}>
        {[
          ["Total",items.length,T.accent],
          ["Out",items.filter(e=>e.status==="Checked Out").length,T.gold],
          ["Available",items.filter(e=>e.status==="Available").length,T.green],
          ["Service",items.filter(e=>e.status==="Maintenance").length,T.amber],
        ].map(([l,v,c])=>(
          <Card key={l} glow={c}>
            <CB style={{textAlign:"center",padding:"14px 10px"}}>
              <div style={{fontSize:26,fontWeight:900,color:c}}>{v}</div>
              <div style={{fontSize:10,color:T.textSub,marginTop:4}}>{l}</div>
            </CB>
          </Card>
        ))}
      </div>

      <Card>
        <CB>
          <SH title={isOfficer?"My Equipment":"All Equipment"}/>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {(isOfficer?myItems:items).map(e=>(
              <div key={e.id} style={{display:"flex",gap:12,alignItems:"center",padding:"12px 14px",background:T.raised,borderRadius:10}}>
                <div style={{width:36,height:36,borderRadius:9,background:`${statusColor(e.status)}18`,border:`1px solid ${statusColor(e.status)}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                  {e.type==="Radio"?"📻":e.type==="Camera"?"📷":e.type==="CEW"?"⚡":e.type==="OC Spray"?"💨":e.type==="Medical"?"🩹":"🔧"}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.name}</div>
                  <div style={{fontSize:10,color:T.textSub,marginTop:1}}>{e.type} · {e.serial}</div>
                  {e.status==="Checked Out"&&<div style={{fontSize:10,color:T.textDim,marginTop:1}}>{e.officer} · Out since {e.checkedOut}</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5,flexShrink:0}}>
                  <Pill label={e.status} color={statusColor(e.status)}/>
                  {e.status==="Available"&&!isOfficer&&<button onClick={()=>setCheckOutModal(e)} style={{fontSize:10,background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,padding:"4px 9px",borderRadius:6,cursor:"pointer",fontWeight:700}}>Check Out</button>}
                  {e.status==="Checked Out"&&(isOfficer?e.badge===user?.badge:true)&&<button onClick={()=>setCheckInModal(e)} style={{fontSize:10,background:T.greenGlow,border:`1px solid ${T.greenB}`,color:T.green,padding:"4px 9px",borderRadius:6,cursor:"pointer",fontWeight:700}}>Check In</button>}
                </div>
              </div>
            ))}
            {isOfficer&&myItems.length===0&&<div style={{textAlign:"center",padding:24,color:T.textSub,fontSize:13}}>No equipment currently checked out to you.</div>}
          </div>
        </CB>
      </Card>

      {checkOutModal&&(
        <CheckOutModalEq item={checkOutModal} onClose={()=>setCheckOutModal(null)} onConfirm={doCheckOut}/>
      )}
      {checkInModal&&(
        <CheckInModalEq item={checkInModal} onClose={()=>setCheckInModal(null)} onConfirm={doCheckIn}/>
      )}
    </div>
  );
}

function CheckOutModalEq({item,onClose,onConfirm}){
  const[officer,setOfficer]=useState("");
  const[badge,setBadge]=useState("");
  return(
    <ModalWrap>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:24,width:"100%",maxWidth:420}}>
        <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:4}}>Check Out Equipment</div>
        <div style={{fontSize:12,color:T.textSub,marginBottom:20}}>{item.name} · {item.serial}</div>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
          <input value={officer} onChange={e=>setOfficer(e.target.value)} placeholder="Officer name" style={{background:T.raised,border:`1px solid ${T.border}`,color:T.text,padding:"11px 14px",borderRadius:9,fontSize:13,outline:"none"}}/>
          <input value={badge} onChange={e=>setBadge(e.target.value)} placeholder="Badge number" style={{background:T.raised,border:`1px solid ${T.border}`,color:T.text,padding:"11px 14px",borderRadius:9,fontSize:13,outline:"none"}}/>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onClose} style={{flex:1,background:T.raised,border:`1px solid ${T.border}`,color:T.textSub,padding:"11px",borderRadius:9,cursor:"pointer",fontWeight:700}}>Cancel</button>
          <button onClick={()=>officer&&badge&&onConfirm(item.id,officer,badge)} style={{flex:2,background:officer&&badge?T.accentGlow:T.raised,border:`1px solid ${officer&&badge?T.accentB:T.border}`,color:officer&&badge?T.accent:T.textDim,padding:"11px",borderRadius:9,cursor:officer&&badge?"pointer":"not-allowed",fontWeight:700}}>Confirm Check Out</button>
        </div>
      </div>
    </ModalWrap>
  );
}

function CheckInModalEq({item,onClose,onConfirm}){
  const[cond,setCond]=useState("Good");
  const conditions=["Excellent","Good","Fair","Needs Service"];
  return(
    <ModalWrap>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:24,width:"100%",maxWidth:420}}>
        <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:4}}>Check In Equipment</div>
        <div style={{fontSize:12,color:T.textSub,marginBottom:20}}>{item.name} · {item.serial}</div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.textSub,marginBottom:10}}>Condition Assessment</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {conditions.map(c=>{
              const col=c==="Excellent"?T.green:c==="Good"?T.accent:c==="Fair"?T.amber:T.red;
              return<button key={c} onClick={()=>setCond(c)} style={{flex:1,minWidth:"calc(50% - 4px)",background:cond===c?`${col}20`:T.raised,border:`1px solid ${cond===c?col:T.border}`,color:cond===c?col:T.textSub,padding:"10px 8px",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:12}}>{c}</button>;
            })}
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onClose} style={{flex:1,background:T.raised,border:`1px solid ${T.border}`,color:T.textSub,padding:"11px",borderRadius:9,cursor:"pointer",fontWeight:700}}>Cancel</button>
          <button onClick={()=>onConfirm(item.id,cond)} style={{flex:2,background:T.greenGlow,border:`1px solid ${T.greenB}`,color:T.green,padding:"11px",borderRadius:9,cursor:"pointer",fontWeight:700}}>Confirm Check In</button>
        </div>
      </div>
    </ModalWrap>
  );
}

// ─────────────────────────────────────────────────────────────────
// LEAVE / PTO
// ─────────────────────────────────────────────────────────────────
function LeaveModule({user,showToast}){
  const[requests,setRequests]=useState(LEAVE_REQUESTS);
  const[showForm,setShowForm]=useState(false);
  const[form,setForm]=useState({type:"Annual",from:"",to:"",notes:""});
  const isManager=user?.role==="Company Admin"||user?.role==="Supervisor";

  const approve=(id)=>{
    setRequests(r=>r.map(x=>x.id===id?{...x,status:"Approved"}:x));
    showToast("Leave request approved","success");
  };
  const deny=(id)=>{
    setRequests(r=>r.map(x=>x.id===id?{...x,status:"Denied"}:x));
    showToast("Leave request denied","info");
  };
  const submit=()=>{
    if(!form.from||!form.to)return;
    const from=new Date(form.from),to=new Date(form.to);
    const days=Math.max(1,Math.round((to-from)/(1000*60*60*24))+1);
    const id=`LV-${Math.floor(Math.random()*900)+100}`;
    setRequests(r=>[{id,officer:user?.name||"Officer",badge:user?.badge||"—",type:form.type,from:form.from,to:form.to,days,notes:form.notes,status:"Pending"},...r]);
    setForm({type:"Annual",from:"",to:"",notes:""});
    setShowForm(false);
    showToast("Leave request submitted","success");
  };

  const statusColor=(s)=>s==="Approved"?T.green:s==="Pending"?T.amber:T.red;
  const typeColor=(t)=>t==="Annual"?T.accent:t==="Sick"?T.red:t==="Training"?T.purple:T.gold;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Balances */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
        {Object.entries(LEAVE_BALANCES).map(([type,days])=>(
          <Card key={type} glow={typeColor(type)}>
            <CB style={{padding:"14px 16px"}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:typeColor(type),marginBottom:8}}>{type}</div>
              <div style={{fontSize:30,fontWeight:900,color:T.text}}>{days}</div>
              <div style={{fontSize:10,color:T.textSub,marginTop:2}}>days available</div>
            </CB>
          </Card>
        ))}
      </div>

      {/* Request form toggle */}
      {!showForm
        ?<button onClick={()=>setShowForm(true)} style={{width:"100%",background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,padding:"13px",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:13}}>+ New Leave Request</button>
        :(
          <Card>
            <CB>
              <SH title="New Request"/>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {["Annual","Sick","Training","Emergency"].map(t=>(
                    <button key={t} onClick={()=>setForm(f=>({...f,type:t}))} style={{flex:1,minWidth:"calc(50% - 4px)",background:form.type===t?`${typeColor(t)}20`:T.raised,border:`1px solid ${form.type===t?typeColor(t):T.border}`,color:form.type===t?typeColor(t):T.textSub,padding:"9px",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:12}}>{t}</button>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div>
                    <div style={{fontSize:10,color:T.textSub,marginBottom:4}}>From</div>
                    <input type="date" value={form.from} onChange={e=>setForm(f=>({...f,from:e.target.value}))} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,color:T.text,padding:"10px",borderRadius:8,fontSize:12}}/>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:T.textSub,marginBottom:4}}>To</div>
                    <input type="date" value={form.to} onChange={e=>setForm(f=>({...f,to:e.target.value}))} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,color:T.text,padding:"10px",borderRadius:8,fontSize:12}}/>
                  </div>
                </div>
                <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Notes (optional)" rows={2} style={{background:T.raised,border:`1px solid ${T.border}`,color:T.text,padding:"10px 12px",borderRadius:9,fontSize:12,resize:"vertical",outline:"none"}}/>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setShowForm(false)} style={{flex:1,background:T.raised,border:`1px solid ${T.border}`,color:T.textSub,padding:"11px",borderRadius:9,cursor:"pointer",fontWeight:700}}>Cancel</button>
                  <button onClick={submit} style={{flex:2,background:form.from&&form.to?T.accentGlow:T.raised,border:`1px solid ${form.from&&form.to?T.accentB:T.border}`,color:form.from&&form.to?T.accent:T.textDim,padding:"11px",borderRadius:9,cursor:form.from&&form.to?"pointer":"not-allowed",fontWeight:700}}>Submit Request</button>
                </div>
              </div>
            </CB>
          </Card>
        )
      }

      {/* Requests list */}
      <Card>
        <CB>
          <SH title="Leave Requests"/>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {requests.map(r=>(
              <div key={r.id} style={{padding:"12px 14px",background:T.raised,borderRadius:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:isManager&&r.status==="Pending"?10:0}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                      <span style={{fontSize:13,fontWeight:700,color:T.text}}>{r.officer}</span>
                      <Pill label={r.type} color={typeColor(r.type)}/>
                      <Pill label={r.status} color={statusColor(r.status)}/>
                    </div>
                    <div style={{fontSize:11,color:T.textSub}}>{r.from} → {r.to} · {r.days} day{r.days!==1?"s":""}</div>
                    {r.notes&&<div style={{fontSize:11,color:T.textDim,marginTop:3,fontStyle:"italic"}}>{r.notes}</div>}
                  </div>
                  <div style={{fontSize:10,color:T.textDim,fontFamily:"monospace",flexShrink:0,marginLeft:8}}>{r.id}</div>
                </div>
                {isManager&&r.status==="Pending"&&(
                  <div style={{display:"flex",gap:7,marginTop:10}}>
                    {r.type==="Emergency"&&<div style={{fontSize:10,color:T.amber,background:T.goldGlow,border:`1px solid ${T.gold}30`,padding:"4px 8px",borderRadius:6,fontWeight:700,flex:1}}>⚠ Check coverage before approving</div>}
                    <button onClick={()=>approve(r.id)} style={{flex:1,background:T.greenGlow,border:`1px solid ${T.greenB}`,color:T.green,padding:"8px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>✓ Approve</button>
                    <button onClick={()=>deny(r.id)} style={{flex:1,background:T.redGlow,border:`1px solid ${T.redB}`,color:T.red,padding:"8px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>✕ Deny</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CB>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TRAINING TRACKER
// ─────────────────────────────────────────────────────────────────
function TrainingModule(){
  const[filter,setFilter]=useState("All");
  const statuses=["All","Valid","Expiring Soon","Expired"];
  const filtered=filter==="All"?TRAINING_DATA:TRAINING_DATA.filter(t=>t.status===filter);
  const expired=TRAINING_DATA.filter(t=>t.status==="Expired").length;
  const expiring=TRAINING_DATA.filter(t=>t.status==="Expiring Soon").length;

  const certColor=(s)=>s==="Valid"?T.green:s==="Expiring Soon"?T.amber:T.red;

  const byOfficer=OFFICERS.map(o=>({
    ...o,
    certs:TRAINING_DATA.filter(t=>t.badge===o.badge),
    valid:TRAINING_DATA.filter(t=>t.badge===o.badge&&t.status==="Valid").length,
    issues:TRAINING_DATA.filter(t=>t.badge===o.badge&&(t.status==="Expired"||t.status==="Expiring Soon")).length,
  }));

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        {[["Total Certs",TRAINING_DATA.length,T.accent],["Expiring Soon",expiring,T.amber],["Expired",expired,T.red]].map(([l,v,c])=>(
          <Card key={l} glow={c}>
            <CB style={{textAlign:"center",padding:"14px 10px"}}>
              <div style={{fontSize:26,fontWeight:900,color:c}}>{v}</div>
              <div style={{fontSize:10,color:T.textSub,marginTop:3}}>{l}</div>
            </CB>
          </Card>
        ))}
      </div>
      {expired>0&&(
        <div style={{background:T.redGlow,border:`1px solid ${T.redB}`,borderRadius:10,padding:"12px 16px",display:"flex",gap:10,alignItems:"center"}}>
          <span style={{fontSize:18}}>⚠️</span>
          <div style={{fontSize:12,color:T.red,fontWeight:700}}>Action Required: {expired} expired certificate{expired!==1?"s":" "} — officers may not be legally compliant for deployment. Escalate to HR.</div>
        </div>
      )}
      <Card>
        <CB>
          <SH title="Compliance Overview"/>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {byOfficer.filter(o=>o.status!=="Off Duty").map(o=>(
              <div key={o.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:T.raised,borderRadius:9}}>
                <Av initials={o.av} color={o.issues>0?T.red:T.green} size={32}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.text}}>{o.name}</div>
                  <div style={{fontSize:10,color:T.textSub}}>{o.certs.length} certs · {o.valid} valid</div>
                </div>
                {o.issues>0
                  ?<Pill label={`${o.issues} issue${o.issues!==1?"s":""}`} color={T.red}/>
                  :<Pill label="Compliant" color={T.green}/>
                }
              </div>
            ))}
          </div>
        </CB>
      </Card>
      <Card>
        <CB>
          <div style={{display:"flex",gap:7,marginBottom:14,flexWrap:"wrap"}}>
            {statuses.map(s=>(
              <button key={s} onClick={()=>setFilter(s)} style={{background:filter===s?`${certColor(s)}20`:T.raised,border:`1px solid ${filter===s?certColor(s):T.border}`,color:filter===s?certColor(s):T.textSub,padding:"7px 13px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:11}}>{s}</button>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {filtered.map(t=>(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 13px",background:T.raised,borderRadius:9}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:certColor(t.status),flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.text}}>{t.cert}</div>
                  <div style={{fontSize:10,color:T.textSub}}>{t.officer} · {t.issuer}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:10,color:certColor(t.status),fontWeight:700}}>{t.expiry}</div>
                  <Pill label={t.status} color={certColor(t.status)}/>
                </div>
              </div>
            ))}
          </div>
        </CB>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────────────────────────
function AuditLogModule({showToast}){
  const[log,setLog]=useState(()=>getAuditLog());
  const[filter,setFilter]=useState("");

  const refresh=()=>setLog(getAuditLog());
  const clear=()=>{clearAuditLog();setLog([]);showToast("Audit log cleared","info");};

  const fmt=(iso)=>{
    const d=new Date(iso);
    return d.toLocaleDateString([],{month:"short",day:"numeric"})+" "+d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
  };
  const actionColor=(a)=>a==="LOGIN"?T.accent:a.includes("DISPATCH")||a.includes("RADIO")?T.red:a.includes("CLOCK")||a.includes("LONE_WORKER")?T.green:a.includes("CHECKOUT")||a.includes("CHECKIN")?T.gold:T.textSub;

  const filtered=filter?log.filter(e=>e.action.toLowerCase().includes(filter.toLowerCase())||e.user.toLowerCase().includes(filter.toLowerCase())):log;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        {[["Total Events",log.length,T.accent],["This Session",log.filter(e=>e.ts>new Date(Date.now()-SS_TTL).toISOString()).length,T.green],["Users",new Set(log.map(e=>e.user)).size,T.gold]].map(([l,v,c])=>(
          <Card key={l} glow={c}>
            <CB style={{textAlign:"center",padding:"14px 10px"}}>
              <div style={{fontSize:26,fontWeight:900,color:c}}>{v}</div>
              <div style={{fontSize:10,color:T.textSub,marginTop:3}}>{l}</div>
            </CB>
          </Card>
        ))}
      </div>
      <Card>
        <CB>
          <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center"}}>
            <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter by action or user…" style={{flex:1,background:T.raised,border:`1px solid ${T.border}`,color:T.text,padding:"9px 12px",borderRadius:8,fontSize:12,outline:"none"}}/>
            <button onClick={refresh} style={{background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,padding:"9px 12px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>↻</button>
            <button onClick={clear} style={{background:T.redGlow,border:`1px solid ${T.redB}`,color:T.red,padding:"9px 12px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>Clear</button>
          </div>
          {filtered.length===0?(
            <div style={{textAlign:"center",padding:24,color:T.textSub,fontSize:13}}>No audit events recorded yet. Actions taken in the platform are logged here.</div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {filtered.slice(0,100).map(e=>(
                <div key={e.id} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"9px 10px",background:T.raised,borderRadius:8}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:actionColor(e.action),flexShrink:0,marginTop:3}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontSize:11,fontWeight:700,color:actionColor(e.action)}}>{e.action}</span>
                      <span style={{fontSize:10,color:T.textSub}}>{e.user} · {e.role}</span>
                    </div>
                    {e.detail&&<div style={{fontSize:10,color:T.textDim,marginTop:2}}>{e.detail}</div>}
                  </div>
                  <div style={{fontSize:9,color:T.textDim,fontFamily:"monospace",flexShrink:0}}>{fmt(e.ts)}</div>
                </div>
              ))}
            </div>
          )}
        </CB>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────────────────────────
function Sidebar({items,active,onChange,user,onLogout,collapsed,setCollapsed}){
  return(
    <aside style={{width:collapsed?58:210,background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",transition:"width 0.2s ease",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowX:"hidden"}}>
      <div style={{padding:collapsed?"14px 11px":"16px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:32,height:32,borderRadius:10,background:`linear-gradient(135deg,${T.accent},${T.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>⚡</div>
        {!collapsed&&<div><div style={{fontWeight:900,fontSize:14,color:T.text,letterSpacing:"-0.02em"}}>ShieldSync</div><div style={{fontSize:9,color:T.textDim,letterSpacing:"0.18em",textTransform:"uppercase"}}>SENTINEL</div></div>}
      </div>
      <nav style={{flex:1,padding:"10px 7px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto"}}>
        {items.map(n=>{
          const a=active===n.id;
          return(
            <button key={n.id} onClick={()=>onChange(n.id)} title={collapsed?n.label:""} style={{display:"flex",alignItems:"center",gap:10,padding:collapsed?"11px 11px":"10px 12px",background:a?T.accentGlow:"none",border:`1px solid ${a?T.accentB:"transparent"}`,borderRadius:10,cursor:"pointer",color:a?T.accent:T.textSub,fontWeight:a?700:500,fontSize:13,textAlign:"left",width:"100%",transition:"all 0.15s",WebkitTapHighlightColor:"transparent"}}>
              <span style={{fontSize:16,flexShrink:0}}>{n.icon}</span>
              {!collapsed&&<span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{n.label}</span>}
            </button>
          );
        })}
      </nav>
      <div style={{padding:"10px 7px",borderTop:`1px solid ${T.border}`,display:"flex",flexDirection:"column",gap:6}}>
        {!collapsed&&(
          <div style={{background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 12px",display:"flex",gap:10,alignItems:"center"}}>
            <div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${T.accent}35,${T.purple}25)`,border:`1px solid ${T.accentB}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:T.accent,flexShrink:0}}>{user.av}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
              <div style={{fontSize:9,color:T.textDim,letterSpacing:"0.08em",textTransform:"uppercase",marginTop:1}}>{user.role}</div>
            </div>
          </div>
        )}
        <button onClick={onLogout} style={{background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,color:T.textSub,padding:"9px",cursor:"pointer",fontSize:11,width:"100%",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6,WebkitTapHighlightColor:"transparent"}}>
          {collapsed?"×":<><span style={{fontSize:13}}>↩</span><span>Sign Out</span></>}
        </button>
        <button onClick={()=>setCollapsed(c=>!c)} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:8,color:T.textDim,padding:"7px",cursor:"pointer",fontSize:11,width:"100%",fontWeight:600}}>
          {collapsed?"→":"← Collapse"}
        </button>
      </div>
    </aside>
  );
}

function TopBar({modId,now,user,onLogout,isMobile}){
  const m=NAV.find(n=>n.id===modId);
  return(
    <header style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:40,flexShrink:0,gap:10}}>
      <div style={{minWidth:0}}>
        <div style={{fontSize:17,fontWeight:900,color:T.text,whiteSpace:"nowrap"}}>{m?.label}</div>
        <div style={{fontSize:10,color:T.textSub,marginTop:1}}>
          {now.toLocaleDateString([],{weekday:"short",month:"short",day:"numeric"})} · {now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        {!isMobile&&<div style={{display:"flex",alignItems:"center",gap:5,background:`${T.green}10`,border:`1px solid ${T.green}28`,borderRadius:8,padding:"5px 10px"}}>
          <span style={{fontSize:11}}>🔒</span>
          <span style={{fontSize:10,color:T.green,fontWeight:700}}>Secure</span>
        </div>}
        <div style={{display:"flex",alignItems:"center",gap:6,background:T.redGlow,border:`1px solid ${T.redB}`,borderRadius:8,padding:isMobile?"6px 8px":"6px 11px"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:T.red,animation:"ssB 1s infinite"}}/>
          {!isMobile&&<span style={{fontSize:11,color:T.red,fontWeight:700,whiteSpace:"nowrap"}}>2 Active</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,padding:"7px 12px"}}>
          <div style={{width:26,height:26,borderRadius:7,background:`linear-gradient(135deg,${T.accent}35,${T.purple}25)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:T.accent}}>{user.av}</div>
          {!isMobile&&<div style={{fontSize:11,color:T.text}}>
            <div style={{fontWeight:700,whiteSpace:"nowrap"}}>{user.name}</div>
            <div style={{color:T.textDim,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em"}}>{user.role}</div>
          </div>}
          {isMobile&&(
            <button onClick={onLogout} title="Sign out" style={{background:"none",border:"none",color:T.textSub,cursor:"pointer",fontSize:14,padding:"4px 6px",WebkitTapHighlightColor:"transparent",minWidth:32,minHeight:32,display:"flex",alignItems:"center",justifyContent:"center"}}>↩</button>
          )}
        </div>
      </div>
    </header>
  );
}

function MobileNav({items,active,onChange}){
  const scroll=items.length>5;
  return(
    <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50,background:T.surface,borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"stretch",overflowX:scroll?"auto":"visible",WebkitOverflowScrolling:"touch",paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
      {items.map(n=>(
        <button key={n.id} onClick={()=>onChange(n.id)} style={{flex:scroll?0:items.length<=3?0:1,flexShrink:0,minWidth:scroll?72:items.length<=3?100:0,background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"12px 6px 10px",cursor:"pointer",gap:4,WebkitTapHighlightColor:"transparent",position:"relative"}}>
          <span style={{fontSize:20,lineHeight:1}}>{n.icon}</span>
          <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.04em",color:active===n.id?T.accent:T.textDim,transition:"color 0.15s",whiteSpace:"nowrap"}}>{n.label}</span>
          {active===n.id&&<div style={{position:"absolute",top:0,left:"20%",right:"20%",height:2,background:T.accent,borderRadius:"0 0 2px 2px"}}/>}
        </button>
      ))}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────
export default function App(){
  const[user,setUser]=useState(()=>loadSession());
  const[mod,setMod]=useState("dashboard");
  const[modal,setModal]=useState(null);
  const[collapsed,setCollapsed]=useState(false);
  const[now,setNow]=useState(new Date());
  const[isMobile,setIsMobile]=useState(false);
  const[toasts,setToasts]=useState([]);

  useEffect(()=>{const c=()=>setIsMobile(window.innerWidth<768);c();window.addEventListener("resize",c);return()=>window.removeEventListener("resize",c);},[]);
  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(t);},[]);

  const role=user?.role||"Company Admin";
  const visNav=useMemo(()=>NAV.filter(n=>n.roles.includes(role)),[role]);

  useEffect(()=>{if(user&&!visNav.find(n=>n.id===mod))setMod(visNav[0]?.id||"dashboard");},[visNav]);

  const openModal=useCallback(m=>setModal(m),[]);
  const closeModal=useCallback(()=>setModal(null),[]);

  const showToast=useCallback((msg,type="info")=>{
    const id=Date.now();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),4500);
  },[]);

  const logout=useCallback(()=>{logAction(user,"LOGOUT","Session ended");clearSession();setUser(null);setMod("dashboard");setModal(null);},[user]);

  if(!user)return <AuthScreen onLogin={u=>setUser(u)}/>;

  const renderMod=()=>{
    switch(mod){
      case "dashboard": return <Dashboard openModal={openModal} showToast={showToast}/>;
      case "myshift":   return <MyShift user={user} showToast={showToast}/>;
      case "workforce": return <Workforce/>;
      case "patrol":    return <Patrol user={user} showToast={showToast}/>;
      case "fleet":     return <Fleet openModal={openModal}/>;
      case "visitors":  return <Visitors openModal={openModal} user={user} showToast={showToast}/>;
      case "reports":   return <Reports/>;
      case "dispatch":  return <Dispatch showToast={showToast} user={user}/>;
      case "equipment": return <EquipmentModule user={user} showToast={showToast}/>;
      case "leave":     return <LeaveModule user={user} showToast={showToast}/>;
      case "training":  return <TrainingModule/>;
      case "auditlog":  return <AuditLogModule showToast={showToast}/>;
      default:          return <Dashboard openModal={openModal} showToast={showToast}/>;
    }
  };

  return(
    <div style={{height:"100%",background:T.bg,color:T.text,display:"flex",flexDirection:"column"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}
        html,body,#root{font-family:'DM Sans',system-ui,sans-serif;background:${T.bg};overflow-x:hidden;-webkit-text-size-adjust:100%;height:100%;}
        input,textarea,select,button{font-family:inherit;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px;}
        select option{background:${T.raised};color:${T.text};}
        @keyframes ssB{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes ssRing{0%{transform:scale(1);opacity:.45}100%{transform:scale(2.2);opacity:0}}
        @keyframes ssUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ssDots{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
        @keyframes glow{0%,100%{opacity:.07}50%{opacity:.15}}
        @keyframes ssToast{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
        @keyframes ssQR{0%{top:0;opacity:1}50%{top:calc(100% - 3px);opacity:.7}100%{top:0;opacity:1}}
      `}</style>

      {/* Toast notifications */}
      {toasts.length>0&&(
        <div style={{position:"fixed",top:16,right:16,zIndex:300,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none",maxWidth:340}}>
          {toasts.map(t=>(
            <div key={t.id} style={{background:t.type==="success"?T.green:t.type==="error"?T.red:T.surface,border:`1px solid ${t.type==="success"?T.green:t.type==="error"?T.redB:T.borderLight}`,borderRadius:12,padding:"13px 16px",color:t.type==="success"||t.type==="error"?"#000":T.text,fontSize:13,fontWeight:600,boxShadow:"0 8px 32px rgba(0,0,0,0.55)",animation:"ssToast 0.2s ease"}}>
              {t.type==="success"?"✓ ":t.type==="error"?"⚠ ":""}{t.msg}
            </div>
          ))}
        </div>
      )}

      <div style={{display:"flex",flex:1,position:"relative"}}>
        {!isMobile&&(
          <Sidebar items={visNav} active={mod} onChange={setMod} user={user} onLogout={logout} collapsed={collapsed} setCollapsed={setCollapsed}/>
        )}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,minHeight:0}}>
          <TopBar modId={mod} now={now} user={user} onLogout={logout} isMobile={isMobile}/>
          <main style={{flex:1,overflowY:"auto",padding:isMobile?"14px 14px 84px":"20px 24px",animation:isMobile?"none":"ssUp 0.22s ease",WebkitOverflowScrolling:"touch"}}>
            <ErrorBoundary key={mod}>
              {renderMod()}
            </ErrorBoundary>
          </main>
        </div>
      </div>

      {isMobile&&<MobileNav items={visNav} active={mod} onChange={setMod}/>}

      {modal?.type==="inspection"&&<InspModal vehicle={modal.vehicle} onClose={closeModal}/>}
      {modal?.type==="incident"&&<IncModal onClose={closeModal} showToast={showToast}/>}
      {modal?.type==="checkin"&&<CheckInModal onClose={closeModal} showToast={showToast}/>}
    </div>
  );
}
