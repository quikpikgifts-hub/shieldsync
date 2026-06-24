import React, { Component, useState, useEffect, useRef, useCallback, memo, useMemo, useTransition } from "react";
import { audit, callAI, watchPosition, onlineStatus, HAS_SUPABASE } from "./db.js";
import {
  LayoutDashboard, BarChart3, Clock, Clock4, Users, Shield, ShieldAlert, ShieldCheck,
  Car, IdCard, FileText, Radio, Wrench, CalendarDays, GraduationCap, Bot, Package,
  ClipboardList, UserCog, Settings, Building2, MapPin, CheckCircle2, Timer, Activity,
  AlertTriangle, TrendingUp, TrendingDown, Check, X, ChevronLeft, ChevronRight,
  ArrowRight, ArrowLeft, ArrowDownToLine, RotateCcw, RotateCw, Lock, KeyRound,
  Fingerprint, Bell, Mail, Phone, Camera, Fuel, Gauge, Zap, Printer, ChevronDown,
  ChevronUp, Sparkles, Cpu, Database, Link2, BookOpen, Wind, Bandage, Eye, EyeOff,
  LogOut, Plus, Minus, Wifi, WifiOff, CircleCheck, CircleAlert, ScanLine, MapPinned,
  Briefcase, HandCoins, ShieldQuestion, Video, Network, Usb, ServerCog, Rocket, Hand,
  HelpCircle, UserCircle2, Navigation, Siren, Star, Crown, Slash,
  Calendar, Key, ClipboardCheck, UserX, ArrowLeftRight, ListTodo,
  Route, Layers, PhoneIncoming, Globe,
} from "lucide-react";

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
// AUDIT (delegates to db.js — localStorage today, Supabase tomorrow)
// ─────────────────────────────────────────────────────────────────
const logAction=(user,action,detail="",opts={})=>audit.log(user,action,detail,opts);
function getAuditLog(){const r=LS.get("ss_audit_v1",[]);return r;}
const clearAuditLog=()=>audit.clear();

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
  bg:"#0A0A0A",surface:"#111111",raised:"#171717",card:"#1A1A1A",
  border:"#262626",borderLight:"#333333",
  accent:"#3B82F6",accentH:"#2563EB",accentGlow:"rgba(59,130,246,0.08)",accentB:"rgba(59,130,246,0.20)",
  gold:"#F59E0B",goldGlow:"rgba(245,158,11,0.08)",
  red:"#EF4444",redGlow:"rgba(239,68,68,0.08)",redB:"rgba(239,68,68,0.20)",
  green:"#22C55E",greenGlow:"rgba(34,197,94,0.08)",greenB:"rgba(34,197,94,0.20)",
  amber:"#F59E0B",amberGlow:"rgba(245,158,11,0.08)",amberB:"rgba(245,158,11,0.20)",
  purple:"#8B5CF6",purpleGlow:"rgba(139,92,246,0.08)",
  text:"#FFFFFF",textSub:"#A3A3A3",textDim:"#525252",
  overlay:"rgba(10,10,10,0.92)",
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
  "Queued":{c:T.amber,p:false},"Assigned":{c:T.accent,p:false},
  "Acknowledged":{c:T.purple,p:false},"Enroute":{c:T.gold,p:true},
  "On-Scene":{c:T.red,p:true},"Cleared":{c:T.green,p:false},
  "Complete":{c:T.green,p:false},"Partial":{c:T.amber,p:false},
  "On Time":{c:T.green,p:false},"Overdue":{c:T.red,p:true},
}[s]||{c:T.textDim,p:false});

// ─────────────────────────────────────────────────────────────────
// AUTH USERS  (demo credentials — swap for real IdP in production)
// ─────────────────────────────────────────────────────────────────
const AUTH_USERS=[
  {id:"U-001",email:"admin@shieldsync.com",     password:"Sentinel2025!",name:"Alex Morgan",    role:"Company Admin",badge:"ADMIN-01",av:"AM"},
  {id:"U-002",email:"supervisor@shieldsync.com", password:"Sentinel2025!",name:"Sarah Chen",    role:"Supervisor",   badge:"SUP-001", av:"SC"},
  {id:"U-003",email:"officer@shieldsync.com",   password:"Sentinel2025!",name:"Marcus Webb",   role:"Officer",      badge:"S-0041",  av:"MW"},
  {id:"U-004",email:"client@shieldsync.com",      password:"Sentinel2025!",name:"James Holloway", role:"Client",      badge:"CLT-001", av:"JH"},
  {id:"U-005",email:"dispatcher@shieldsync.com", password:"Sentinel2025!",name:"Riley Torres",   role:"Dispatcher",  badge:"DSP-001", av:"RT"},
  {id:"U-006",email:"manager@shieldsync.com",    password:"Sentinel2025!",name:"Chris Adeyemi",  role:"Manager",     badge:"MGR-001", av:"CA"},
];
const ROLES=["Company Admin","Supervisor","Dispatcher","Manager","Officer","Client"];
const PERM_LABELS={
  dashboard:"Command Center",executive:"Executive Dashboard",workforce:"Workforce",
  timekeeping:"Timekeeping",patrol:"Patrol",fleet:"Fleet",visitors:"Visitors",
  reports:"Reports",dispatch:"Dispatch",equipment:"Equipment",leave:"Leave/PTO",
  training:"Training",aicommand:"AI Command",procurement:"Procurement",
  auditlog:"Audit Log",users:"User Management",settings:"Company Settings",myshift:"My Shift",
  clientportal:"Client Portal",itcommand:"IT/Cyber",
  scheduling:"Scheduling",postorders:"Post Orders",keymanagement:"Key Management",
  corrective:"Corrective Actions",handover:"Shift Handover",
  guardtours:"Guard Tours",opscenter:"Operations Center",
};
const ROLE_PERMS={
  "Company Admin":["dashboard","executive","workforce","timekeeping","patrol","fleet","visitors","reports","dispatch","equipment","leave","training","aicommand","procurement","auditlog","users","settings","clientportal","itcommand","scheduling","postorders","keymanagement","corrective","handover","guardtours","opscenter"],
  "Supervisor":["dashboard","workforce","timekeeping","patrol","fleet","visitors","reports","dispatch","equipment","leave","training","aicommand","itcommand","scheduling","postorders","keymanagement","corrective","handover","guardtours","opscenter"],
  "Dispatcher":["dashboard","dispatch","patrol","visitors","equipment","postorders","handover","guardtours","opscenter"],
  "Manager":["dashboard","executive","workforce","timekeeping","patrol","fleet","visitors","reports","dispatch","equipment","leave","training","aicommand","itcommand","scheduling","postorders","keymanagement","corrective","handover","guardtours","opscenter"],
  "Officer":["dashboard","myshift","patrol","visitors","equipment","leave","postorders","guardtours"],
  "Client":["clientportal","reports"],
};
function getUsers(){const s=LS.get("ss_users_v1",null);if(s)return s;const init=AUTH_USERS.map(u=>({...u,active:true,createdAt:"2024-01-01",mfaEnabled:false,company:"ShieldSync Protect"}));LS.set("ss_users_v1",init);return init;}
function saveUsers(list){LS.set("ss_users_v1",list);}
function authUser(email,pw){return getUsers().find(u=>u.email.toLowerCase()===email.toLowerCase().trim()&&u.password===pw&&u.active!==false)||null;}

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
const REPORT_TYPES=["Daily Operations Summary","Incident Report","Patrol Analysis","Workforce Performance","Risk Assessment","Executive Briefing","Client Report","Shift Handover"];
const REPORT_MODES={
  rules:{id:"rules",label:"Rules-Based",badge:"OFFLINE CAPABLE",color:T.green,icon:ShieldCheck,desc:"Instant · No AI required · Data never leaves your premises · Enterprise & government safe"},
  hosted:{id:"hosted",label:"Private AI",badge:"SELF-HOSTED",color:T.purple,icon:ServerCog,desc:"Your infrastructure · Your LLM · Full data sovereignty · HIPAA & FedRAMP compatible"},
  external:{id:"external",label:"Cloud AI",badge:"OPTIONAL",color:T.accent,icon:Sparkles,desc:"Anthropic · OpenAI · Custom endpoint · Opt-in · Customer controls all data sharing"},
};
const REPORT_TIERS=[
  {id:"supervisor",label:"Supervisor",desc:"Full tactical detail — all names, locations, incident data"},
  {id:"management",label:"Management",desc:"Operational overview — trends, issues, recommendations"},
  {id:"client",label:"Client",desc:"Professional summary — SLA-focused, reassuring tone"},
  {id:"executive",label:"Executive",desc:"3-sentence brief — KPI headline and risk status only"},
];
const REPORT_HISTORY=[
  {id:"RPT-0042",type:"Daily Operations Summary",date:"2026-06-06",time:"18:15",pages:3,status:"Delivered"},
  {id:"RPT-0041",type:"Incident Report",date:"2026-06-06",time:"09:30",pages:2,status:"Delivered"},
  {id:"RPT-0040",type:"Patrol Analysis",date:"2026-06-05",time:"18:00",pages:4,status:"Delivered"},
  {id:"RPT-0039",type:"Workforce Performance",date:"2026-06-04",time:"17:45",pages:5,status:"Delivered"},
];
const LEAVE_TOTALS={Annual:25,Sick:14,Training:8,Emergency:5};
const WEEKLY_SHIFTS=[
  {id:"SH-001",officer:"Marcus Webb",badge:"S-0041",site:"Northgate Tower",day:"Mon",start:"06:00",end:"18:00",type:"Day",status:"Confirmed",hours:12,ot:false,certOk:true},
  {id:"SH-002",officer:"Diana Reyes",badge:"S-0067",site:"Harbor Logistics",day:"Mon",start:"06:00",end:"18:00",type:"Day",status:"Confirmed",hours:12,ot:false,certOk:true},
  {id:"SH-003",officer:"Theo Okafor",badge:"S-0083",site:"Plaza West",day:"Mon",start:"06:00",end:"18:00",type:"Day",status:"Confirmed",hours:12,ot:false,certOk:false,certNote:"SIA expired Nov 2025"},
  {id:"SH-004",officer:"Ava Simmons",badge:"S-0092",site:"Eastside Mall",day:"Mon",start:"06:00",end:"18:00",type:"Day",status:"Confirmed",hours:12,ot:false,certOk:true},
  {id:"SH-005",officer:"Jordan Park",badge:"S-0105",site:"Northgate Tower",day:"Mon",start:"06:00",end:"18:00",type:"Day",status:"Confirmed",hours:12,ot:false,certOk:true},
  {id:"SH-006",officer:"Elena Voss",badge:"S-0118",site:"Northgate Tower",day:"Mon",start:"18:00",end:"06:00",type:"Night",status:"Confirmed",hours:12,ot:false,certOk:true},
  {id:"SH-007",officer:"Marcus Webb",badge:"S-0041",site:"Northgate Tower",day:"Tue",start:"06:00",end:"18:00",type:"Day",status:"Confirmed",hours:12,ot:false,certOk:true},
  {id:"SH-008",officer:"Diana Reyes",badge:"S-0067",site:"Harbor Logistics",day:"Tue",start:"06:00",end:"18:30",type:"Day",status:"Confirmed",hours:12.5,ot:true,certOk:true},
  {id:"SH-009",officer:"Theo Okafor",badge:"S-0083",site:"Plaza West",day:"Tue",start:"06:00",end:"18:00",type:"Day",status:"Confirmed",hours:12,ot:false,certOk:false,certNote:"SIA expired"},
  {id:"SH-010",officer:"Jordan Park",badge:"S-0105",site:"Northgate Tower",day:"Tue",start:"06:00",end:"20:15",type:"Day",status:"Confirmed",hours:14.25,ot:true,certOk:true},
  {id:"SH-011",officer:"Elena Voss",badge:"S-0118",site:"Northgate Tower",day:"Tue",start:"18:00",end:"06:00",type:"Night",status:"Confirmed",hours:12,ot:false,certOk:true},
  {id:"SH-012",officer:"Marcus Webb",badge:"S-0041",site:"Northgate Tower",day:"Wed",start:"06:00",end:"18:00",type:"Day",status:"Confirmed",hours:12,ot:false,certOk:true},
  {id:"SH-013",officer:"Diana Reyes",badge:"S-0067",site:"Harbor Logistics",day:"Wed",start:"06:00",end:"18:00",type:"Day",status:"Confirmed",hours:12,ot:false,certOk:true},
  {id:"SH-014",officer:"Ava Simmons",badge:"S-0092",site:"Eastside Mall",day:"Wed",start:"06:00",end:"18:00",type:"Day",status:"Confirmed",hours:12,ot:false,certOk:true},
  {id:"SH-015",officer:"Jordan Park",badge:"S-0105",site:"Northgate Tower",day:"Wed",start:"06:00",end:"18:00",type:"Day",status:"Confirmed",hours:12,ot:false,certOk:true},
  {id:"SH-016",officer:"Elena Voss",badge:"S-0118",site:"Northgate Tower",day:"Wed",start:"18:00",end:"06:00",type:"Night",status:"Confirmed",hours:12,ot:false,certOk:true},
  {id:"SH-017",officer:"Marcus Webb",badge:"S-0041",site:"Northgate Tower",day:"Thu",start:"06:00",end:"18:00",type:"Day",status:"Confirmed",hours:12,ot:false,certOk:true},
  {id:"SH-018",officer:"Diana Reyes",badge:"S-0067",site:"Harbor Logistics",day:"Thu",start:"06:00",end:"18:00",type:"Day",status:"Confirmed",hours:12,ot:false,certOk:true},
  {id:"SH-019",officer:"Ava Simmons",badge:"S-0092",site:"Eastside Mall",day:"Fri",start:"06:00",end:"18:00",type:"Day",status:"Confirmed",hours:12,ot:false,certOk:true},
  {id:"SH-020",officer:"Marcus Webb",badge:"S-0041",site:"Northgate Tower",day:"Sat",start:"06:00",end:"18:00",type:"Day",status:"Confirmed",hours:12,ot:true,certOk:true},
];
const OPEN_SHIFTS=[
  {id:"OS-001",site:"Plaza West",day:"Thu",date:"Jun 11",start:"18:00",end:"06:00",type:"Night",reason:"Elena Voss — annual leave approved",priority:"High"},
  {id:"OS-002",site:"Harbor Logistics",day:"Sat",date:"Jun 13",start:"06:00",end:"18:00",type:"Day",reason:"Weekend coverage — no officer assigned",priority:"Medium"},
  {id:"OS-003",site:"Eastside Mall",day:"Sun",date:"Jun 14",start:"06:00",end:"18:00",type:"Day",reason:"Weekend coverage — no officer assigned",priority:"Medium"},
];
const POST_ORDERS=[
  {id:"PO-001",site:"Northgate Tower",version:"v3.2",updated:"2026-05-15",approvedBy:"Alex Morgan",
   sections:[
     {title:"Site Overview",body:"Northgate Tower is a 42-floor commercial office building operating 24/7. Primary tenants include financial services firms and corporate headquarters. Security coverage: 06:00–18:00 day shift, 18:00–06:00 night shift. Post orders are effective until superseded."},
     {title:"Emergency Contacts",body:"Property Manager: Jane Smith · 555-0101\nBuilding Engineer: Tom Rivera · 555-0102\nFire Marshal: Lisa Chen · 555-0103\nPolice Non-Emergency: 555-0911\nBuilding Security Direct: 555-0199\nShieldSync Operations Centre: 555-0SYNC"},
     {title:"Access Control Procedures",body:"All visitors sign in at reception via visitor management system.\nContractors require pre-authorization from tenant and valid photo ID.\nAfter-hours access requires written tenant approval on file.\nPackage deliveries accepted at Loading Dock only — Dock B.\nSuspicious packages: do not touch, clear 100m area, call emergency line immediately."},
     {title:"Patrol Schedule",body:"Lobby: continuous coverage during business hours (07:00–19:00)\nParking Deck B: every 2 hours — 07:00, 09:00, 11:00, 13:00, 15:00, 17:00\nMain Entrance perimeter: every 3 hours\nRoof access door check: once per shift (log completion)\nServer Room Floor 12: visual check only — do not enter without IT escort. Log each check."},
     {title:"Client Rules & Standards",body:"No photography of tenant floors without prior written approval.\nMaintain full professional uniform and presentation standards at all times.\nAll incidents must be reported in ShieldSync within 5 minutes of observation.\nDo not discuss security arrangements, staffing levels, or vulnerabilities with any non-authorized personnel.\nMinimum 15-minute shift overlap for verbal briefing before relief."},
   ],
   acknowledgments:[
     {officer:"Marcus Webb",badge:"S-0041",date:"2026-06-01",version:"v3.2"},
     {officer:"Jordan Park",badge:"S-0105",date:"2026-06-02",version:"v3.2"},
     {officer:"Elena Voss",badge:"S-0118",date:"2026-06-01",version:"v3.2"},
   ]},
  {id:"PO-002",site:"Harbor Logistics",version:"v2.1",updated:"2026-04-20",approvedBy:"Alex Morgan",
   sections:[
     {title:"Site Overview",body:"Harbor Logistics is a 24-hour freight and distribution facility covering 120 acres. Access control of all entry and exit points is critical. The facility operates three shifts and receives commercial vehicles around the clock."},
     {title:"Emergency Contacts",body:"Site Manager: Rob Patel · 555-0201\nSafety Officer: Maria Torres · 555-0202\nFire Department Direct: 555-0301\nPolice: 555-0911"},
     {title:"Vehicle Access",body:"All vehicles must check in at Gate 1 with valid delivery manifest.\nPersonnel require active badge — no tailgating under any circumstances.\nRestricted Zone C (chemical storage) requires supervisor escort at all times.\nOvernight vehicle access: verified personnel list only — no exceptions."},
     {title:"Patrol Schedule",body:"Gate 1 (main entry): continuous\nPerimeter fence: every 90 minutes\nLoading bay area: every 60 minutes\nRestricted Zone C: every 2 hours (mandatory log entry)"},
   ],
   acknowledgments:[
     {officer:"Diana Reyes",badge:"S-0067",date:"2026-05-01",version:"v2.1"},
   ]},
  {id:"PO-003",site:"Plaza West",version:"v1.8",updated:"2026-03-10",approvedBy:"Alex Morgan",
   sections:[
     {title:"Site Overview",body:"Plaza West is a mixed-use retail and commercial complex with high public footfall. Security coverage focuses on access control, incident response, and patrol visibility. Day shift operates alongside peak public hours."},
     {title:"Emergency Contacts",body:"Property Manager: Susan Holt · 555-0301\nMall Security Office: 555-0302\nPolice: 555-0911"},
     {title:"Patrol Requirements",body:"Perimeter Gate 3: every 60 minutes minimum — this is a high-risk point.\nMain concourse: continuous visibility required 09:00–21:00.\nLoading entrance (rear): check every 2 hours.\nPhoto evidence of any suspicious activity required before report."},
   ],
   acknowledgments:[
     {officer:"Theo Okafor",badge:"S-0083",date:"2026-04-01",version:"v1.8"},
   ]},
  {id:"PO-004",site:"Eastside Mall",version:"v2.4",updated:"2026-05-01",approvedBy:"Alex Morgan",
   sections:[
     {title:"Site Overview",body:"Eastside Mall is a regional shopping centre with approximately 180 retail units and a food court. Peak hours are 10:00–20:00. Security presence must remain visible and professional at all times."},
     {title:"Emergency Contacts",body:"Mall Manager: David Park · 555-0401\nOperations: 555-0402\nPolice: 555-0911\nAmbulance: 555-0111"},
     {title:"Patrol Areas",body:"Main entrances (4): checked every 30 minutes during trading hours.\nCar park (3 levels): full sweep every 90 minutes.\nFood court: visible presence required during lunch and dinner peaks.\nServer Room (Level -1): visual check once per shift."},
   ],
   acknowledgments:[
     {officer:"Ava Simmons",badge:"S-0092",date:"2026-05-05",version:"v2.4"},
   ]},
];
const KEYS_DATA=[
  {id:"KEY-001",name:"Main Lobby Master Key",site:"Northgate Tower",keyNum:"NT-M01",type:"Master",status:"Checked Out",assignedTo:"Marcus Webb",badge:"S-0041",issuedAt:"06:00",dueBack:"18:00",condition:"Good"},
  {id:"KEY-002",name:"Server Room — Floor 12",site:"Northgate Tower",keyNum:"NT-SR12",type:"Restricted",status:"In Cabinet",assignedTo:null,badge:null,issuedAt:null,dueBack:null,condition:"Good"},
  {id:"KEY-003",name:"Parking Deck B Master",site:"Northgate Tower",keyNum:"NT-PDB",type:"Physical",status:"Checked Out",assignedTo:"Jordan Park",badge:"S-0105",issuedAt:"06:02",dueBack:"18:00",condition:"Good"},
  {id:"KEY-004",name:"Loading Dock Gate Key",site:"Harbor Logistics",keyNum:"HL-LD01",type:"Physical",status:"Checked Out",assignedTo:"Diana Reyes",badge:"S-0067",issuedAt:"05:58",dueBack:"18:00",condition:"Good"},
  {id:"KEY-005",name:"Restricted Zone C Access",site:"Harbor Logistics",keyNum:"HL-ZC01",type:"Restricted",status:"In Cabinet",assignedTo:null,badge:null,issuedAt:null,dueBack:null,condition:"Good"},
  {id:"KEY-006",name:"Mall Security Office",site:"Eastside Mall",keyNum:"EM-SO01",type:"Physical",status:"Checked Out",assignedTo:"Ava Simmons",badge:"S-0092",issuedAt:"06:05",dueBack:"18:00",condition:"Good"},
  {id:"KEY-007",name:"Plaza West — Perimeter Gate 3",site:"Plaza West",keyNum:"PW-PG3",type:"Physical",status:"Checked Out",assignedTo:"Theo Okafor",badge:"S-0083",issuedAt:"06:00",dueBack:"18:00",condition:"Fair"},
  {id:"KEY-008",name:"Northgate Roof Access",site:"Northgate Tower",keyNum:"NT-RA01",type:"Restricted",status:"In Cabinet",assignedTo:null,badge:null,issuedAt:null,dueBack:null,condition:"Good"},
  {id:"KEY-009",name:"V-01 Spare Vehicle Key",site:"Fleet",keyNum:"FL-V01S",type:"Vehicle",status:"Overdue",assignedTo:"Marcus Webb",badge:"S-0041",issuedAt:"Yesterday 06:00",dueBack:"Yesterday 18:00",condition:"Good"},
  {id:"KEY-010",name:"Electrical Room — Basement",site:"Eastside Mall",keyNum:"EM-ER01",type:"Restricted",status:"In Cabinet",assignedTo:null,badge:null,issuedAt:null,dueBack:null,condition:"Good"},
];
const KEY_LOG=[
  {keyId:"KEY-001",action:"Issued",officer:"Marcus Webb",badge:"S-0041",ts:"06:00",supervisor:"Sarah Chen"},
  {keyId:"KEY-003",action:"Issued",officer:"Jordan Park",badge:"S-0105",ts:"06:02",supervisor:"Sarah Chen"},
  {keyId:"KEY-004",action:"Issued",officer:"Diana Reyes",badge:"S-0067",ts:"05:58",supervisor:"Sarah Chen"},
  {keyId:"KEY-006",action:"Issued",officer:"Ava Simmons",badge:"S-0092",ts:"06:05",supervisor:"Sarah Chen"},
  {keyId:"KEY-007",action:"Issued",officer:"Theo Okafor",badge:"S-0083",ts:"06:00",supervisor:"Sarah Chen"},
  {keyId:"KEY-009",action:"Issued",officer:"Marcus Webb",badge:"S-0041",ts:"Yesterday 06:00",supervisor:"Sarah Chen"},
];
const CORRECTIVE_ACTIONS_DATA=[
  {id:"CA-001",officer:"Theo Okafor",badge:"S-0083",type:"Written Warning",category:"Certification Non-Compliance",date:"2026-06-07",description:"Officer deployed with expired SIA Door Supervisor certification (expired November 2025). Non-compliant deployment identified during shift audit. Officer must complete SIA renewal before next operational deployment.",linkedIncident:null,supervisor:"Sarah Chen",hrReview:"Required",status:"Pending Acknowledgment",escalation:null},
  {id:"CA-002",officer:"Jordan Park",badge:"S-0105",type:"Verbal Warning",category:"Break Compliance",date:"2026-06-07",description:"Officer worked 3.5 hours without logging a mandatory break in violation of SOP-07 fatigue management policy. Second occurrence in 30 days. Verbal warning issued on shift. Written warning to follow on next occurrence.",linkedIncident:null,supervisor:"Sarah Chen",hrReview:"Not Required",status:"Pending Acknowledgment",escalation:null},
  {id:"CA-003",officer:"Marcus Webb",badge:"S-0041",type:"Coaching Note",category:"Overtime Management",date:"2026-06-03",description:"Officer incurred 0.43 hours of unplanned overtime Monday shift without prior authorisation. Officer reminded that all overtime requires pre-authorisation from supervisor unless responding to an active incident.",linkedIncident:null,supervisor:"Sarah Chen",hrReview:"Not Required",status:"Acknowledged",acknowledgedAt:"2026-06-04",escalation:null},
  {id:"CA-004",officer:"Elena Voss",badge:"S-0118",type:"Coaching Note",category:"Policy Compliance",date:"2026-06-01",description:"Annual Policy Acknowledgment remains outstanding. Two previous reminders sent via ShieldSync. Final reminder issued. Non-completion by 2026-06-30 will result in formal written warning and potential schedule restriction.",linkedIncident:null,supervisor:"Alex Morgan",hrReview:"Not Required",status:"Acknowledged",acknowledgedAt:"2026-06-02",escalation:null},
];
const CA_TYPES=["Coaching Note","Verbal Warning","Written Warning","Final Written Warning","Suspension","Termination"];
const CA_CATEGORIES=["Certification Non-Compliance","Break Compliance","Attendance","Conduct","Performance","Use of Force","Overtime Management","Policy Compliance","Equipment Responsibility","Incident Response"];
const HANDOVER_RECORDS=[
  {id:"HO-001",date:"2026-06-07",outgoing:{shift:"Day 06:00–18:00",supervisor:"Sarah Chen",signedAt:"17:55"},incoming:{shift:"Night 18:00–06:00",supervisor:"Night Lead",acknowledgedAt:null},status:"Pending Incoming Sign-Off",
   items:[
     {id:"HI-1",type:"incident",text:"INC-2847 OPEN — Trespass at Plaza West. Officer Okafor on scene 27+ min. Night shift must monitor and escalate if not resolved by 19:00.",priority:"critical",resolved:false},
     {id:"HI-2",type:"incident",text:"INC-2846 UNDER REVIEW — Theft report Northgate Tower. Documentation with Marcus Webb. Expected closure within 48 hrs.",priority:"high",resolved:false},
     {id:"HI-3",type:"patrol",text:"Perimeter Gate 3 (Plaza West): 2 missed checkpoints this shift. Increase to 30-minute intervals during night.",priority:"high",resolved:false},
     {id:"HI-4",type:"compliance",text:"Theo Okafor: SIA cert expired. Do NOT redeploy until renewal confirmed. Night supervisor notify morning team.",priority:"high",resolved:false},
     {id:"HI-5",type:"fleet",text:"V-03 Tahoe in maintenance — only 2 vehicles operational. V-02 available for emergency dispatch.",priority:"medium",resolved:false},
     {id:"HI-6",type:"key",text:"KEY-009 (V-01 spare) overdue return from Marcus Webb — follow up at start of night shift.",priority:"medium",resolved:false},
     {id:"HI-7",type:"note",text:"Jordan Park completed full shift without incident after break enforced at 14:30. Performance noted.",priority:"low",resolved:true},
   ],
   notes:"Plaza West remains the primary risk site for this handover. Ensure Elena Voss is fully briefed on INC-2847 before deployment.",
  },
  {id:"HO-002",date:"2026-06-06",outgoing:{shift:"Day 06:00–18:00",supervisor:"Sarah Chen",signedAt:"17:58"},incoming:{shift:"Night 18:00–06:00",supervisor:"Night Lead",acknowledgedAt:"18:05"},status:"Complete",
   items:[
     {id:"HI-8",type:"incident",text:"INC-2844 Medical Assist (Eastside Mall) — resolved 14:22. Documentation complete, no follow-up required.",priority:"low",resolved:true},
     {id:"HI-9",type:"fleet",text:"Fleet V-02 returned from service — full fleet operational for night shift.",priority:"low",resolved:true},
   ],
   notes:"Clean handover. All incidents resolved. Night shift to standard patrol schedule.",
  },
];
// ─── Phase 2 Data ─────────────────────────────────────────────────
const DISPATCH_CALLS_INIT=[
  {id:"DC-001",caller:"Building Security",callerPhone:"555-0199",type:"Trespass",priority:"High",site:"Plaza West",location:"Perimeter Gate 3",description:"Male subject attempting to force entry at Perimeter Gate 3. Subject is aggressive and has refused verbal instruction. Officer Okafor on scene 27 minutes, requesting backup.",status:"On-Scene",assignedTo:"Theo Okafor",assignedBadge:"S-0083",intakedAt:"08:40",assignedAt:"08:42",acknowledgedAt:"08:43",enrouteAt:"08:44",onSceneAt:"08:45",clearedAt:null,closedAt:null,linkedIncident:"INC-2847",notes:[]},
  {id:"DC-002",caller:"James Holloway",callerPhone:"555-0401",type:"Suspicious Person",priority:"Medium",site:"Northgate Tower",location:"Lobby Level 1",description:"Individual has been in lobby for 2 hours without proceeding to tenant floor. Refused visitor sign-in twice. Watching elevator bank.",status:"Assigned",assignedTo:"Marcus Webb",assignedBadge:"S-0041",intakedAt:"09:10",assignedAt:"09:12",acknowledgedAt:null,enrouteAt:null,onSceneAt:null,clearedAt:null,closedAt:null,linkedIncident:null,notes:[]},
  {id:"DC-003",caller:"Site Manager",callerPhone:"555-0202",type:"Medical Assist",priority:"Critical",site:"Harbor Logistics",location:"Loading Bay 3",description:"Worker collapsed near forklift in Loading Bay 3. Unresponsive. EMS called. Security to provide access and hold perimeter.",status:"Cleared",assignedTo:"Diana Reyes",assignedBadge:"S-0067",intakedAt:"07:05",assignedAt:"07:06",acknowledgedAt:"07:06",enrouteAt:"07:07",onSceneAt:"07:09",clearedAt:"07:45",closedAt:null,linkedIncident:null,notes:[]},
  {id:"DC-004",caller:"Ava Simmons",callerPhone:"—",type:"Alarm Activation",priority:"Medium",site:"Eastside Mall",location:"Server Room Level -1",description:"Unscheduled motion sensor alert in server room. No visible forced entry. IT notified. Officer on scene — visual sweep in progress.",status:"Closed",assignedTo:"Ava Simmons",assignedBadge:"S-0092",intakedAt:"08:00",assignedAt:"08:01",acknowledgedAt:"08:01",enrouteAt:"08:02",onSceneAt:"08:04",clearedAt:"08:20",closedAt:"08:22",linkedIncident:null,notes:[]},
  {id:"DC-005",caller:"Patrol Officer",callerPhone:"—",type:"Vehicle Incident",priority:"Low",site:"Northgate Tower",location:"Parking Deck B",description:"Minor collision between two parked vehicles. No injuries. Owners to be notified. Documentation required for incident log.",status:"Queued",assignedTo:null,assignedBadge:null,intakedAt:"09:30",assignedAt:null,acknowledgedAt:null,enrouteAt:null,onSceneAt:null,clearedAt:null,closedAt:null,linkedIncident:null,notes:[]},
];
const TOUR_ROUTES=[
  {id:"RT-001",name:"Northgate Tower — Full Patrol",site:"Northgate Tower",checkpoints:6,estimatedMins:40,frequency:"Every 2 hours",lastPatrol:"09:14",dueNext:"11:14",status:"On Time"},
  {id:"RT-002",name:"Harbor Logistics — Perimeter",site:"Harbor Logistics",checkpoints:5,estimatedMins:50,frequency:"Every 90 min",lastPatrol:"08:30",dueNext:"10:00",status:"Overdue"},
  {id:"RT-003",name:"Plaza West — High Risk",site:"Plaza West",checkpoints:4,estimatedMins:25,frequency:"Every 60 min",lastPatrol:"07:30",dueNext:"08:30",status:"Overdue"},
  {id:"RT-004",name:"Eastside Mall — Internal",site:"Eastside Mall",checkpoints:5,estimatedMins:35,frequency:"Every 90 min",lastPatrol:"09:18",dueNext:"10:48",status:"On Time"},
];
const TOUR_CHECKPOINTS=[
  {id:"TCP-001",routeId:"RT-001",name:"Main Entrance — Lobby",order:1,method:"QR",required:true},
  {id:"TCP-002",routeId:"RT-001",name:"Elevator Bank A",order:2,method:"QR",required:true},
  {id:"TCP-003",routeId:"RT-001",name:"Parking Deck B — Level 1",order:3,method:"QR",required:true},
  {id:"TCP-004",routeId:"RT-001",name:"Parking Deck B — Level 2",order:4,method:"GPS",required:true},
  {id:"TCP-005",routeId:"RT-001",name:"Roof Access Door",order:5,method:"QR",required:true},
  {id:"TCP-006",routeId:"RT-001",name:"Server Room Floor 12",order:6,method:"Manual",required:false},
  {id:"TCP-007",routeId:"RT-002",name:"Gate 1 — Main Entry",order:1,method:"QR",required:true},
  {id:"TCP-008",routeId:"RT-002",name:"Perimeter Fence — North",order:2,method:"GPS",required:true},
  {id:"TCP-009",routeId:"RT-002",name:"Loading Bay Area",order:3,method:"QR",required:true},
  {id:"TCP-010",routeId:"RT-002",name:"Restricted Zone C",order:4,method:"QR",required:true},
  {id:"TCP-011",routeId:"RT-002",name:"Perimeter Fence — South",order:5,method:"GPS",required:true},
  {id:"TCP-012",routeId:"RT-003",name:"Perimeter Gate 3 — West",order:1,method:"QR",required:true},
  {id:"TCP-013",routeId:"RT-003",name:"Main Concourse",order:2,method:"QR",required:true},
  {id:"TCP-014",routeId:"RT-003",name:"Loading Entrance — Rear",order:3,method:"QR",required:true},
  {id:"TCP-015",routeId:"RT-003",name:"Perimeter Gate 3 — East",order:4,method:"QR",required:true},
  {id:"TCP-016",routeId:"RT-004",name:"Main Entrance North",order:1,method:"QR",required:true},
  {id:"TCP-017",routeId:"RT-004",name:"Main Entrance South",order:2,method:"QR",required:true},
  {id:"TCP-018",routeId:"RT-004",name:"Car Park Level 1",order:3,method:"QR",required:true},
  {id:"TCP-019",routeId:"RT-004",name:"Food Court",order:4,method:"Manual",required:false},
  {id:"TCP-020",routeId:"RT-004",name:"Server Room Level -1",order:5,method:"QR",required:true},
];
const NAV=[
  {id:"dashboard",label:"Command",icon:LayoutDashboard,roles:["Company Admin","Supervisor","Officer","Dispatcher","Manager"],group:"ops"},
  {id:"executive",label:"Executive",icon:BarChart3,roles:["Company Admin","Manager"],group:"ops"},
  {id:"opscenter",label:"Ops Center",icon:Layers,roles:["Company Admin","Supervisor","Dispatcher","Manager"],group:"ops"},
  {id:"myshift",label:"My Shift",icon:Clock,roles:["Officer"],group:"ops"},
  {id:"patrol",label:"Patrol",icon:Shield,roles:["Company Admin","Supervisor","Officer","Dispatcher","Manager"],group:"field"},
  {id:"dispatch",label:"Dispatch",icon:Radio,roles:["Company Admin","Supervisor","Dispatcher","Manager"],group:"field"},
  {id:"guardtours",label:"Guard Tours",icon:Route,roles:["Company Admin","Supervisor","Officer","Dispatcher","Manager"],group:"field"},
  {id:"fleet",label:"Fleet",icon:Car,roles:["Company Admin","Supervisor"],group:"field"},
  {id:"visitors",label:"Visitors",icon:IdCard,roles:["Company Admin","Supervisor","Officer","Dispatcher"],group:"field"},
  {id:"equipment",label:"Equipment",icon:Wrench,roles:["Company Admin","Supervisor","Officer","Dispatcher"],group:"field"},
  {id:"workforce",label:"Workforce",icon:Users,roles:["Company Admin","Supervisor","Manager"],group:"people"},
  {id:"scheduling",label:"Scheduling",icon:Calendar,roles:["Company Admin","Supervisor","Manager"],group:"people"},
  {id:"timekeeping",label:"Timekeeping",icon:Clock4,roles:["Company Admin","Supervisor","Manager"],group:"people"},
  {id:"leave",label:"Leave",icon:CalendarDays,roles:["Company Admin","Supervisor","Officer","Manager"],group:"people"},
  {id:"training",label:"Training",icon:GraduationCap,roles:["Company Admin","Supervisor","Manager"],group:"people"},
  {id:"postorders",label:"Post Orders",icon:ClipboardCheck,roles:["Company Admin","Supervisor","Officer","Dispatcher"],group:"field"},
  {id:"keymanagement",label:"Key Management",icon:Key,roles:["Company Admin","Supervisor","Manager"],group:"field"},
  {id:"corrective",label:"Corrective Actions",icon:UserX,roles:["Company Admin","Supervisor","Manager"],group:"people"},
  {id:"handover",label:"Shift Handover",icon:ArrowLeftRight,roles:["Company Admin","Supervisor","Dispatcher","Manager"],group:"field"},
  {id:"aicommand",label:"Intelligence",icon:Sparkles,roles:["Company Admin","Supervisor","Manager"],group:"intel"},
  {id:"reports",label:"Reports",icon:FileText,roles:["Company Admin","Supervisor","Client","Manager"],group:"intel"},
  {id:"procurement",label:"Procurement",icon:Package,roles:["Company Admin"],group:"admin"},
  {id:"auditlog",label:"Audit Log",icon:ClipboardList,roles:["Company Admin"],group:"admin"},
  {id:"users",label:"Users",icon:UserCog,roles:["Company Admin"],group:"admin"},
  {id:"settings",label:"Settings",icon:Settings,roles:["Company Admin"],group:"admin"},
  {id:"clientportal",label:"Client Portal",icon:Building2,roles:["Company Admin","Client"],group:"admin"},
  {id:"itcommand",label:"IT / Cyber",icon:ShieldAlert,roles:["Company Admin","Supervisor","Manager"],group:"admin"},
];
const NAV_GROUP_LABELS={ops:"OPERATIONS",field:"FIELD OPS",people:"WORKFORCE",intel:"INTELLIGENCE",admin:"ADMIN"};
const KPI_DATA=[
  {label:"Active Officers",value:"5",sub:"1 off duty",icon:Users,color:T.accent,trend:"+2"},
  {label:"Open Incidents",value:"2",sub:"1 critical",icon:AlertTriangle,color:T.red,trend:"-1"},
  {label:"Patrol Rate",value:"94%",sub:"38 of 42 CPs",icon:Shield,color:T.green,trend:"+4"},
  {label:"Sites Active",value:"4",sub:"All nominal",icon:MapPin,color:T.textSub,trend:"0"},
  {label:"Avg Response",value:"4.2m",sub:"Down 12% today",icon:Timer,color:T.textSub,trend:"-"},
  {label:"Open Alerts",value:"3",sub:"1 critical",icon:Bell,color:T.amber,trend:"down"},
];
const PHOTO_SLOTS=[
  {key:"front",label:"Front"},{key:"rear",label:"Rear"},
  {key:"driverSide",label:"Driver Side"},{key:"passengerSide",label:"Pass. Side"},
  {key:"interior",label:"Interior"},{key:"damage",label:"Damage"},
];
const INSP_STEPS=["Vehicle","Photos","Readings","Notes","Sign & Submit"];

// ─────────────────────────────────────────────────────────────────
// PHASE 1-5 DATA — Contracts · Timesheets · Vendors · Procurement · Compliance
// ─────────────────────────────────────────────────────────────────
const CONTRACTS=[
  {id:"CTR-001",client:"Northgate Properties",sites:2,officers:8,monthly:42000,cost:31500,profit:10500,margin:25,status:"Active",health:92,start:"2024-01-01",end:"2026-12-31"},
  {id:"CTR-002",client:"Harbor Logistics Group",sites:1,officers:4,monthly:21000,cost:17850,profit:3150,margin:15,status:"Active",health:74,start:"2025-03-01",end:"2027-02-28"},
  {id:"CTR-003",client:"Plaza West REIT",sites:1,officers:3,monthly:15750,cost:11025,profit:4725,margin:30,status:"Active",health:61,start:"2024-06-01",end:"2026-05-31"},
  {id:"CTR-004",client:"Eastside Mall Corp",sites:1,officers:3,monthly:18000,cost:13500,profit:4500,margin:25,status:"Active",health:88,start:"2025-01-01",end:"2027-12-31"},
];
const mkDays=(rows)=>rows.map(([d,inn,out,hrs,ot,site])=>({d,in:inn,out,hrs,ot,site,status:ot>0?"Pending":"Approved"}));
const TIMESHEETS=[
  {id:"TS-001",officer:"Marcus Webb",badge:"S-0041",week:"2026-06-01",days:mkDays([["Mon","05:58","18:03",12.1,0.1,"Northgate Tower"],["Tue","06:01","18:00",11.98,0,"Northgate Tower"],["Wed","06:00","18:15",12.25,0.25,"Northgate Tower"],["Thu","05:55","18:00",12.08,0.08,"Northgate Tower"],["Fri","06:02","18:00",11.97,0,"Northgate Tower"]]),totalHrs:60.38,otHrs:0.43,status:"Pending"},
  {id:"TS-002",officer:"Diana Reyes",badge:"S-0067",week:"2026-06-01",days:mkDays([["Mon","06:00","18:00",12,0,"Harbor Logistics"],["Tue","06:00","18:30",12.5,0.5,"Harbor Logistics"],["Wed","06:00","18:00",12,0,"Harbor Logistics"],["Thu","06:00","18:00",12,0,"Harbor Logistics"],["Fri","06:00","18:00",12,0,"Harbor Logistics"]]),totalHrs:60.5,otHrs:0.5,status:"Partial"},
  {id:"TS-003",officer:"Theo Okafor",badge:"S-0083",week:"2026-06-01",days:mkDays([["Mon","06:00","18:00",12,0,"Plaza West"],["Tue","06:00","18:00",12,0,"Plaza West"],["Wed","06:00","18:00",12,0,"Plaza West"],["Thu","06:00","18:00",12,0,"Plaza West"],["Fri","06:00","18:00",12,0,"Plaza West"]]),totalHrs:60,otHrs:0,status:"Partial"},
  {id:"TS-004",officer:"Ava Simmons",badge:"S-0092",week:"2026-06-01",days:mkDays([["Mon","06:00","18:00",12,0,"Eastside Mall"],["Tue","06:00","18:00",12,0,"Eastside Mall"],["Wed","06:00","18:00",12,0,"Eastside Mall"],["Thu","06:00","18:00",12,0,"Eastside Mall"],["Fri","06:00","18:00",12,0,"Eastside Mall"]]),totalHrs:60,otHrs:0,status:"Partial"},
  {id:"TS-005",officer:"Jordan Park",badge:"S-0105",week:"2026-06-01",days:mkDays([["Mon","06:00","18:00",12,0,"Northgate Tower"],["Tue","06:00","20:15",14.25,2.25,"Northgate Tower"],["Wed","06:00","18:00",12,0,"Northgate Tower"],["Thu","06:00","18:00",12,0,"Northgate Tower"],["Fri","06:00","18:00",12,0,"Northgate Tower"]]),totalHrs:62.25,otHrs:2.25,status:"Partial"},
  {id:"TS-006",officer:"Elena Voss",badge:"S-0118",week:"2026-06-01",days:mkDays([["Mon","18:00","06:00",12,0,"Northgate Tower"],["Tue","18:00","06:00",12,0,"Northgate Tower"],["Wed","18:00","06:00",12,0,"Northgate Tower"],["Thu","18:00","06:00",12,0,"Northgate Tower"],["Fri","18:00","06:00",12,0,"Northgate Tower"]]),totalHrs:60,otHrs:0,status:"Partial"},
];
const VENDORS=[
  {id:"VEN-001",name:"Motorola Solutions",category:"Communications",contact:"sales@motorola.com",phone:"800-555-0102",contracts:3,spend:28400,status:"Active",rating:4.8,since:"2023-01-15"},
  {id:"VEN-002",name:"Axon Enterprise",category:"Body Cameras",contact:"account@axon.com",phone:"800-555-0194",contracts:1,spend:14200,status:"Active",rating:4.6,since:"2023-06-01"},
  {id:"VEN-003",name:"Fleet Patrol Services",category:"Fleet Maintenance",contact:"ops@fleetpatrol.com",phone:"800-555-0231",contracts:2,spend:9800,status:"Active",rating:4.2,since:"2024-02-10"},
  {id:"VEN-004",name:"SecureUniform Co.",category:"Uniforms & PPE",contact:"orders@secureuniform.com",phone:"800-555-0418",contracts:1,spend:6300,status:"Active",rating:3.9,since:"2024-05-22"},
  {id:"VEN-005",name:"Taser International",category:"Use of Force",contact:"enterprise@taser.com",phone:"800-555-0509",contracts:1,spend:11200,status:"Active",rating:4.7,since:"2023-03-01"},
];
const PURCHASE_REQUESTS=[
  {id:"PR-2024",item:"Motorola APX 6000 Radios x4",vendor:"Motorola Solutions",amount:8800,requestor:"Alex Morgan",dept:"Operations",date:"2026-06-01",priority:"High",status:"Approved",notes:"Replacing failed units EQ-009 through EQ-012"},
  {id:"PR-2023",item:"Axon Body 4 Camera x2",vendor:"Axon Enterprise",amount:2800,requestor:"Sarah Chen",dept:"Operations",date:"2026-05-28",priority:"Medium",status:"Ordered",notes:"Replacement for EQ-006 in maintenance"},
  {id:"PR-2022",item:"Ford Explorer Fleet Vehicle",vendor:"Fleet Patrol Services",amount:44900,requestor:"Alex Morgan",dept:"Fleet",date:"2026-05-20",priority:"High",status:"Pending",notes:"V-03 Tahoe requires replacement — approved by board"},
  {id:"PR-2021",item:"SIA Training Renewals x8",vendor:"SecureUniform Co.",amount:6400,requestor:"Sarah Chen",dept:"HR/Training",date:"2026-05-15",priority:"Medium",status:"Approved",notes:"Renewing 8 expired/expiring SIA certifications"},
  {id:"PR-2020",item:"First Aid Supplies Q3",vendor:"SecureUniform Co.",amount:1240,requestor:"Marcus Webb",dept:"Operations",date:"2026-05-10",priority:"Low",status:"Received",notes:"Quarterly restocking — all sites"},
];
const ASSET_REGISTER=[
  ...EQUIPMENT,
  {id:"VH-001",name:"Ford Explorer V-01",type:"Vehicle",status:"In Service",officer:"Marcus Webb",badge:"S-0041",checkedOut:"05:48",condition:"Good",serial:"1FM5K8D-KGA12345"},
  {id:"VH-002",name:"Toyota Highlander V-02",type:"Vehicle",status:"Available",officer:"—",badge:"—",checkedOut:"—",condition:"Fair",serial:"5TDZARFH-KS01234"},
  {id:"VH-003",name:"Chevy Tahoe V-03",type:"Vehicle",status:"Maintenance",officer:"—",badge:"—",checkedOut:"—",condition:"Needs Service",serial:"1GNSKCKC-KR12345"},
];
const COMPLIANCE_ITEMS=[
  {id:"CI-001",category:"Certification",title:"SIA Door Supervisor — Theo Okafor",dueDate:"2025-11-05",status:"Overdue",priority:"Critical",assignee:"HR Dept",notes:"Officer deployed non-compliant since Nov 2025. Immediate action required."},
  {id:"CI-002",category:"Certification",title:"First Aid CPR — Jordan Park",dueDate:"2025-09-14",status:"Overdue",priority:"Critical",assignee:"HR Dept",notes:"Expired September 2025. Requires immediate renewal before next deployment."},
  {id:"CI-003",category:"Certification",title:"SIA Door Supervisor — Marcus Webb",dueDate:"2026-08-20",status:"Due Soon",priority:"High",assignee:"HR Dept",notes:"Expires in 77 days. Book renewal course immediately."},
  {id:"CI-004",category:"Vehicle",title:"Fleet V-02 Annual Service",dueDate:"2026-06-15",status:"Due Soon",priority:"Medium",assignee:"Fleet Manager",notes:"Service interval due in 11 days. Schedule at Fleet Patrol Services."},
  {id:"CI-005",category:"Contract",title:"CTR-003 Plaza West REIT — Renewal Overdue",dueDate:"2026-05-31",status:"Overdue",priority:"High",assignee:"Account Manager",notes:"Contract expired June 1. Client needs new terms within 30 days."},
  {id:"CI-006",category:"Policy",title:"Annual Policy Acknowledgment — All Staff",dueDate:"2026-06-30",status:"Pending",priority:"Medium",assignee:"All Officers",notes:"4 of 6 officers acknowledged. Pending: Marcus Webb, Elena Voss."},
  {id:"CI-007",category:"Audit",title:"Q2 Internal Security Audit",dueDate:"2026-06-30",status:"Pending",priority:"High",assignee:"Alex Morgan",notes:"Quarterly audit due end of month. Evidence gathering not yet started."},
  {id:"CI-008",category:"Insurance",title:"General Liability Insurance Renewal",dueDate:"2026-07-01",status:"Upcoming",priority:"Medium",assignee:"Admin",notes:"Policy renewal in 27 days. Confirm coverage levels with broker."},
];
const SITE_COORDS={
  "Northgate Tower":{lat:40.7580,lng:-73.9855,radius:500},
  "Harbor Logistics":{lat:40.6892,lng:-74.0445,radius:800},
  "Plaza West":{lat:40.7549,lng:-73.9840,radius:400},
  "Eastside Mall":{lat:40.7282,lng:-73.7949,radius:600},
};
const CYBER_ALERTS=[
  {id:"CA-001",severity:"Critical",type:"Unauthorized Access Attempt",device:"NVR-Northgate-01",ip:"192.168.1.104",time:"08:42",status:"Active",desc:"47 failed logins in 3 min — brute-force threshold exceeded. IP now rate-limited."},
  {id:"CA-002",severity:"High",type:"Firmware Outdated",device:"AccessCtrl-HarborMain",ip:"192.168.2.20",time:"07:15",status:"Pending",desc:"Access control running v2.1.4 — critical security patch v2.3.0 available. CVE-2025-1124."},
  {id:"CA-003",severity:"Medium",type:"Unusual Traffic",device:"SWITCH-EastsideMall",ip:"10.0.3.1",time:"06:58",status:"Monitoring",desc:"Outbound traffic spike: 2.4 GB in 10 min from VLAN 20. Possible exfiltration or large backup."},
  {id:"CA-004",severity:"Low",type:"SSL Certificate Expiry",device:"VPN-Gateway",ip:"203.0.113.5",time:"06:00",status:"Pending",desc:"SSL certificate expires in 14 days. Renew via Let's Encrypt or DigiCert before expiry."},
  {id:"CA-005",severity:"High",type:"Rogue Device Detected",device:"Unknown · 44:f4:aa:12:09",ip:"192.168.1.208",time:"05:30",status:"Contained",desc:"Unregistered device on Northgate VLAN. MAC address quarantined. Physical investigation required."},
];
const CYBER_DEVICES=[
  {id:"CD-001",name:"NVR-Northgate-01",type:"NVR / DVR",site:"Northgate Tower",ip:"192.168.1.100",firmware:"v4.2.1",status:"Online",lastSeen:"09:22",risk:"High",alerts:1},
  {id:"CD-002",name:"AccessCtrl-HarborMain",type:"Access Control",site:"Harbor Logistics",ip:"192.168.2.20",firmware:"v2.1.4",status:"Online",lastSeen:"09:18",risk:"High",alerts:1},
  {id:"CD-003",name:"PTZ-PlazaWest-01",type:"PTZ Camera",site:"Plaza West",ip:"192.168.3.11",firmware:"v3.5.2",status:"Online",lastSeen:"09:19",risk:"Low",alerts:0},
  {id:"CD-004",name:"SWITCH-EastsideMall",type:"Network Switch",site:"Eastside Mall",ip:"10.0.3.1",firmware:"v15.2.4",status:"Warning",lastSeen:"09:15",risk:"Medium",alerts:1},
  {id:"CD-005",name:"VPN-Gateway",type:"VPN Gateway",site:"Central Office",ip:"203.0.113.5",firmware:"v9.1.2",status:"Online",lastSeen:"09:21",risk:"Low",alerts:1},
  {id:"CD-006",name:"Intercom-Plaza-Main",type:"Intercom",site:"Plaza West",ip:"192.168.3.50",firmware:"v1.8.0",status:"Offline",lastSeen:"07:44",risk:"Medium",alerts:0},
  {id:"CD-007",name:"LPR-Northgate-Lot",type:"LPR Camera",site:"Northgate Tower",ip:"192.168.1.115",firmware:"v5.0.1",status:"Online",lastSeen:"09:20",risk:"Low",alerts:0},
  {id:"CD-008",name:"Biometric-Harbor-01",type:"Biometric Reader",site:"Harbor Logistics",ip:"192.168.2.45",firmware:"v4.4.0",status:"Online",lastSeen:"09:17",risk:"Low",alerts:0},
];
const FLEET_COSTS=[
  {vehicle:"V-01 · Ford Explorer",fuel:342,maintenance:85,insurance:198,depreciation:512,total:1137,miles:1840,cpmi:0.62,status:"In Service"},
  {vehicle:"V-02 · Toyota Highlander",fuel:298,maintenance:145,insurance:198,depreciation:445,total:1086,miles:1420,cpmi:0.76,status:"Available"},
  {vehicle:"V-03 · Chevy Tahoe",fuel:0,maintenance:1240,insurance:198,depreciation:380,total:1818,miles:0,cpmi:0,status:"Maintenance"},
];
const CLIENT_SLA=[
  {client:"Northgate Properties",site:"Northgate Tower",officers:8,patrols:98,responseTime:3.8,incidents:3,resolved:3,satisfaction:96,trend:"+2",status:"Healthy"},
  {client:"Harbor Logistics Group",site:"Harbor Logistics",officers:4,patrols:100,responseTime:4.1,incidents:1,resolved:1,satisfaction:94,trend:"+1",status:"Healthy"},
  {client:"Plaza West REIT",site:"Plaza West",officers:3,patrols:76,responseTime:5.2,incidents:4,resolved:3,satisfaction:78,trend:"-4",status:"At Risk"},
  {client:"Eastside Mall Corp",site:"Eastside Mall",officers:3,patrols:95,responseTime:4.0,incidents:2,resolved:2,satisfaction:92,trend:"+3",status:"Healthy"},
];
const FORECAST_DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const FORECAST_SITES=["Northgate","Harbor","Plaza West","Eastside"];
const FORECAST_GRID=[[3,3,3,2,3,4,4],[2,2,2,2,2,3,3],[2,3,3,3,2,2,2],[2,2,2,2,2,3,3]];
const AI_SCORES=[
  {officer:"Marcus Webb",score:91,trend:"+3",badge:"S-0041",factors:"Patrol 98% · 2 incidents resolved · 1 cert expiring soon"},
  {officer:"Diana Reyes",score:88,trend:"+1",badge:"S-0067",factors:"Patrol 100% · 0 incidents · All certs valid"},
  {officer:"Ava Simmons",score:84,trend:"+5",badge:"S-0092",factors:"Patrol 95% · 0 incidents · All certs valid"},
  {officer:"Jordan Park",score:76,trend:"-2",badge:"S-0105",factors:"Patrol 92% · 1 cert expired · 2.25h OT this week"},
  {officer:"Elena Voss",score:72,trend:"0",badge:"S-0118",factors:"Patrol 87% · Night shift · Policy acknowledgment pending"},
  {officer:"Theo Okafor",score:58,trend:"-8",badge:"S-0083",factors:"Patrol 78% · Active incident · SIA cert expired Nov 2025"},
];
const FORECAST_RISK=[
  {site:"Plaza West",risk:78,color:"#F04444",factors:["Active incident INC-2847","Weekend surge +40%","SIA cert gap — 1 officer"]},
  {site:"Northgate Tower",risk:52,color:"#F0A800",factors:["Peak event Fri–Sat","High foot traffic","Construction zone nearby"]},
  {site:"Eastside Mall",risk:38,color:"#F0A800",factors:["Standard retail pattern","Full staffing"]},
  {site:"Harbor Logistics",risk:24,color:"#00D464",factors:["Low incident history","Night shift only","100% patrol rate"]},
];

const FLEET_COST_MAX=Math.max(...FLEET_COSTS.map(x=>x.total));
const CYBER_CRIT=CYBER_ALERTS.filter(a=>a.severity==="Critical").length;
const CYBER_HIGH=CYBER_ALERTS.filter(a=>a.severity==="High").length;
const CYBER_ACCESS_LOG=[
  {time:"08:47",user:"admin@shieldsync.com",action:"Login",ip:"203.0.113.42",result:"Success",device:"Chrome / macOS"},
  {time:"08:31",user:"supervisor@shieldsync.com",action:"Login",ip:"192.168.1.15",result:"Success",device:"Safari / iOS"},
  {time:"08:14",user:"unknown@external.io",action:"Login",ip:"45.33.32.156",result:"Failed",device:"curl/7.88"},
  {time:"07:59",user:"admin@shieldsync.com",action:"Export",ip:"203.0.113.42",result:"Success",device:"Chrome / macOS"},
  {time:"07:42",user:"officer@shieldsync.com",action:"Login",ip:"10.0.0.4",result:"Success",device:"Android / Chrome"},
  {time:"07:21",user:"unknown@external.io",action:"Login",ip:"45.33.32.156",result:"Failed",device:"curl/7.88"},
  {time:"06:55",user:"client@shieldsync.com",action:"Report View",ip:"172.16.0.8",result:"Success",device:"Firefox / Windows"},
];

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
Target: ≥95%  |  Status: BELOW TARGET (Plaza West anomaly)

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
Diana Reyes    S-0067  On Site          5 CPs  0 incidents  [Top performer]
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
// REPORTING INTELLIGENCE ENGINE — Rules-based, zero external deps
// ─────────────────────────────────────────────────────────────────
function _opsSnapshot(){
  const active=OFFICERS.filter(o=>o.status!=="Off Duty");
  const offDuty=OFFICERS.filter(o=>o.status==="Off Duty");
  const openInc=INCIDENTS.filter(i=>i.status==="Active"||i.status==="Under Review");
  const critInc=openInc.filter(i=>i.sev==="High");
  const resolvedInc=INCIDENTS.filter(i=>i.status==="Resolved"||i.status==="Closed");
  const totalCPs=CHECKPOINTS.reduce((s,c)=>s+c.scans+c.missed,0);
  const completedCPs=CHECKPOINTS.reduce((s,c)=>s+c.scans,0);
  const missedCPs=CHECKPOINTS.reduce((s,c)=>s+c.missed,0);
  const patrolPct=Math.round((completedCPs/totalCPs)*100);
  const deployed=VEHICLES.filter(v=>v.status==="Deployed").length;
  const available=VEHICLES.filter(v=>v.status==="Available").length;
  const maintenance=VEHICLES.filter(v=>v.status==="Maintenance").length;
  const expired=TRAINING_DATA.filter(t=>t.status==="Expired");
  const expiring=TRAINING_DATA.filter(t=>t.status==="Expiring Soon");
  const topOfficer=active.reduce((best,o)=>(o.cps>best.cps?o:best),active[0]||OFFICERS[0]);
  const incidentOfficer=OFFICERS.find(o=>o.status==="Incident Active");
  const riskScore=+(2+(critInc.length*2.2)+(missedCPs*0.3)+(expired.length*0.8)+(offDuty.length*0.4)).toFixed(1);
  const riskLabel=riskScore>=7?"CRITICAL":riskScore>=5?"ELEVATED":riskScore>=3?"MODERATE":"NOMINAL";
  const sitePatrol=SITES.map(s=>{
    const cps=CHECKPOINTS.filter(c=>c.site===s.name);
    const done=cps.reduce((n,c)=>n+c.scans,0);
    const miss=cps.reduce((n,c)=>n+c.missed,0);
    const total=done+miss;
    return{name:s.name,done,miss,total,pct:total>0?Math.round((done/total)*100):100};
  });
  return{active,offDuty,openInc,critInc,resolvedInc,totalCPs,completedCPs,missedCPs,patrolPct,deployed,available,maintenance,expired,expiring,topOfficer,incidentOfficer,riskScore,riskLabel,sitePatrol};
}

function buildNarrative(type,tier){
  const D=new Date();
  const date=D.toLocaleDateString([],{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const time=D.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:false});
  const org="ShieldSync Protect";
  const shift="06:00–18:00";
  const{active,offDuty,openInc,critInc,resolvedInc,totalCPs,completedCPs,missedCPs,patrolPct,deployed,available,maintenance,expired,expiring,topOfficer,incidentOfficer,riskScore,riskLabel,sitePatrol}=_opsSnapshot();
  const hr="─".repeat(60);
  const hdr=(t,c)=>`${t}\n${org}  ·  ${date}\n${time}  ·  Shift ${shift}  ·  ${c}\n${hr}`;

  switch(type){
    case"Daily Operations Summary":{
      if(tier==="executive")return`OPERATIONS BRIEFING — ${date.toUpperCase()}\n${org}  ·  Executive Summary  ·  ${time}\n\n${active.length} of ${OFFICERS.length} officers deployed across ${SITES.length} sites. Patrol completion ${patrolPct}% (${completedCPs}/${totalCPs} checkpoints) — above ${patrolPct-6}% baseline. ${critInc.length} critical incident${critInc.length!==1?"s":""} active${critInc.length>0?` at ${critInc.map(i=>i.site).join(", ")} — immediate action required`:""}. ${expired.length>0?`Compliance gap: ${expired.length} expired certification${expired.length>1?"s":""}. `:"All certifications compliant. "}Risk score ${riskScore}/10 (${riskLabel}).`.trim();

      if(tier==="client")return`DAILY OPERATIONS REPORT\n${org}  ·  Client Summary  ·  ${date}\n${hr}\n\nOPERATIONS STATUS\nAll ${SITES.length} client sites secured and monitored throughout today's shift. ${active.length} qualified security personnel active on duty, maintaining full coverage across all contracted assignments.\n\nPATROL COVERAGE\nScheduled patrol rounds completed at ${patrolPct}% efficiency across all sites. All primary access points, entry zones, and designated patrol routes checked in accordance with contract requirements.\n\nINCIDENT SUMMARY\n${openInc.length} reported incident${openInc.length!==1?"s":""} this shift — ${resolvedInc.length} resolved, ${openInc.length} under active management. All incidents responded to within contractual SLA parameters. Detailed documentation available upon request.\n\nSITE STATUS\n${SITES.map(s=>`${s.name.padEnd(24)} Secured  ·  Active monitoring`).join("\n")}\n\nSERVICE ASSURANCE\nSecurity operations continued without service interruption. All contractual service obligations met. Full detailed report available for your records.`.trim();

      if(tier==="management")return`${hdr("DAILY OPERATIONS SUMMARY","MANAGEMENT")}\n\nEXECUTIVE OVERVIEW\n${active.length}/${OFFICERS.length} officers on duty. Patrol efficiency ${patrolPct}% (above ${patrolPct-6}% 7-day baseline). ${critInc.length} critical incident${critInc.length!==1?" require":" requires"} immediate attention. Risk score ${riskScore}/10 (${riskLabel}).\n\nINCIDENT STATUS\n${openInc.map(i=>`  ${i.id.padEnd(12)} [${(i.sev+"/OPEN").toUpperCase()}]  ${i.type.padEnd(22)} ${i.site}  ·  ${i.officer}  ·  Since ${i.time}`).join("\n")}\n${resolvedInc.slice(0,3).map(i=>`  ${i.id.padEnd(12)} [RESOLVED]           ${i.type.padEnd(22)} ${i.site}  ·  Closed no escalation`).join("\n")}\n\nPATROL PERFORMANCE\n${sitePatrol.map(s=>`  ${s.name.padEnd(24)}${String(s.done+"/"+s.total).padEnd(8)}${String(s.pct+"%").padEnd(8)}${s.miss>0?`${s.miss} missed — follow up required`:"Full completion"}`).join("\n")}\n\nFLEET\n  Deployed: ${deployed}  ·  Available: ${available}  ·  In Maintenance: ${maintenance}\n\nCOMPLIANCE ALERTS\n${expired.length>0?expired.map(t=>`  EXPIRED: ${t.cert}  —  ${t.officer} (${t.badge})`).join("\n"):"  No expired certifications."}\n${expiring.map(t=>`  EXPIRING: ${t.cert}  —  ${t.officer}  ·  Expires ${t.expiry}`).join("\n")}\n\nRECOMMENDATIONS\n  1. ${critInc.length>0?`Deploy backup to ${critInc[0].site} — ${critInc[0].id} duration exceeds single-officer SOP`:"Maintain current deployment — all critical thresholds nominal"}\n  2. ${missedCPs>0?`Investigate missed checkpoints: ${[...new Set(CHECKPOINTS.filter(c=>c.missed>0).map(c=>c.site))].join(", ")}`:"No missed checkpoint follow-up required"}\n  3. ${expired.length>0?`Non-compliant deployment — ${expired[0].officer} requires immediate cert renewal`:"Review night rotation briefing — 18:00 handover"}`.trim();

      return`${hdr("DAILY OPERATIONS SUMMARY","INTERNAL — SUPERVISORY")}\n\nSTAFFING\nScheduled: ${OFFICERS.length}  |  Active: ${active.length}  |  Off Duty: ${offDuty.length} (${offDuty.map(o=>`${o.name} — ${o.shift} rotation`).join(", ")})\n\nOFFICER STATUS\n${active.map(o=>`${o.name.padEnd(16)} ${o.badge.padEnd(8)} ${o.status.padEnd(18)} ${o.cps} CPs  ${o.incidents} incident${o.incidents!==1?"s":""}`).join("\n")}\n\nINCIDENT STATUS\n${INCIDENTS.slice(0,4).map(i=>`${i.id.padEnd(12)} [${(i.sev+"/"+i.status).toUpperCase()}]  ${i.type.padEnd(22)} ${i.site}  Officer: ${i.officer}  Time: ${i.time}`).join("\n")}\n\nPATROL PERFORMANCE\n${sitePatrol.map(s=>`${s.name.padEnd(22)}${String(s.done+"/"+s.total).padEnd(8)}${String(s.pct+"%").padEnd(8)}${s.miss>0?`${s.miss} missed checkpoint${s.miss>1?"s":""}`:"Full completion"}`).join("\n")}\nTotal: ${completedCPs}/${totalCPs} (${patrolPct}%)  Target: 95%  Status: ${patrolPct>=95?"ABOVE TARGET":"BELOW TARGET"}\n\nFLEET\n${VEHICLES.map(v=>`${v.id.padEnd(6)} ${v.make.padEnd(22)} ${v.status.padEnd(14)} ${v.status==="Deployed"?`Assigned: ${v.officer}`:v.status==="Maintenance"?"Reason: Service due":""}`).join("\n")}\n\nCOMPLIANCE\n${expired.length>0?expired.map(t=>`NON-COMPLIANT: ${t.cert}  —  ${t.officer} (${t.badge})`).join("\n"):"All certifications compliant."}\n${expiring.map(t=>`WARNING: ${t.cert}  —  ${t.officer}  expires ${t.expiry}`).join("\n")}\n\nRECOMMENDATIONS\n1. ${critInc.length>0?`Dispatch backup to ${critInc[0].site} — ${critInc[0].id} duration exceeds SOP`:"Maintain current deployments — operations nominal"}\n2. ${missedCPs>0?`Verify: ${CHECKPOINTS.filter(c=>c.missed>0).map(c=>`${c.name} (${c.site})`).join(", ")}`:"No missed checkpoint follow-up required"}\n3. ${expired.length>0?`Remove ${expired[0].officer} from operational deployment pending renewal`:"Brief night rotation at 17:45 — hand over active items"}`;
    }

    case"Incident Report":{
      const inc=INCIDENTS.find(i=>i.status==="Active")||INCIDENTS[0];
      if(tier==="executive")return`INCIDENT BRIEFING — ${inc.id}\n${org}  ·  ${date}  ·  ${time}\n\n${inc.sev.toUpperCase()} severity ${inc.type.toLowerCase()} reported at ${inc.site} at ${inc.time}. Officer ${inc.officer} responded per SOP. Current status: ${inc.status}. ${inc.status==="Active"?"Backup resources being evaluated. Escalation may be required.":"No further escalation anticipated."} Operational risk impact: ${inc.sev==="High"?"ELEVATED — executive awareness recommended.":"CONTAINED — within normal parameters."}`.trim();

      if(tier==="client")return`INCIDENT NOTIFICATION\n${org}  ·  ${date}\n${hr}\n\nIncident Reference: ${inc.id}\nLocation: ${inc.site}\nTime Reported: ${inc.time}\nCurrent Status: ${inc.status}\n\nA security incident was reported at your site and responded to promptly by our on-duty team. Our personnel followed all applicable protocols, and the situation is being managed in full accordance with the terms of your Service Agreement.\n\nNo disruption to normal business operations is anticipated. A complete written incident report will be provided within 24 hours of incident resolution.\n\nFor immediate briefing, please contact your Account Manager directly.`.trim();

      if(tier==="management")return`${hdr("INCIDENT REPORT — "+inc.id,"MANAGEMENT")}\n\nIncident: ${inc.id}  |  Type: ${inc.type}  |  Severity: ${inc.sev.toUpperCase()}\nSite: ${inc.site}  |  Time: ${inc.time}  |  Status: ${inc.status}\nResponding Officer: ${inc.officer} (${OFFICERS.find(o=>o.name===inc.officer)?.badge||"—"})\n\nSTATUS SUMMARY\n${inc.status==="Active"?"Incident remains active. Officer on scene. Backup resources under evaluation. Duration is approaching single-officer SOP limit — supervisor intervention recommended.":inc.status==="Under Review"?"Initial response complete. Documentation and investigation in progress. No ongoing physical risk identified.":"Incident fully resolved. All documentation complete. No further action required."}\n\nOPERATIONAL IMPACT\n${inc.sev==="High"?`Site patrol coverage at ${inc.site} reduced during active management. Recommend increasing adjacent checkpoint frequency until resolved.`:"Minimal operational impact. Normal coverage being maintained at all sites."}\n\nRECOMMENDATIONS\n${inc.status==="Active"?`  1. Evaluate backup dispatch to ${inc.site}\n  2. Notify client contact if duration exceeds 45 minutes\n  3. Preserve CCTV footage — chain of custody for ${inc.id}`:`  1. Debrief responding officer — capture lessons learned\n  2. File final report within 24 hours\n  3. Review SOP compliance for response time`}`.trim();

      return`${hdr("INCIDENT REPORT — "+inc.id,"INTERNAL — SUPERVISORY")}\n\nINCIDENT DETAILS\nReference: ${inc.id}  |  Classification: ${inc.sev.toUpperCase()} SEVERITY\nType: ${inc.type}  |  Location: ${inc.site}\nReporting Officer: ${inc.officer} (${OFFICERS.find(o=>o.name===inc.officer)?.badge||"—"})\nTime Reported: ${inc.time}  |  Current Status: ${inc.status}\n\nNARRATIVE\nAt ${inc.time}, Officer ${inc.officer} identified and reported a ${inc.type.toLowerCase()} at ${inc.site}. The officer immediately responded in accordance with site SOP and initiated standard containment, notification, and documentation protocols. ${inc.status==="Active"?"The situation remains active. Officer is on scene and managing the incident. Additional personnel resources are currently being evaluated.":"The incident has been fully documented and processed per standard procedure. All actions were within SOP parameters."}\n\nACTIONS TAKEN\n  - Immediate response initiated per SOP-14\n  - Site supervisor notified within 3 minutes of initial report\n  - CCTV footage preservation requested from monitoring center\n  - Incident log created and timestamped in ShieldSync\n${inc.status==="Active"?"  - Backup dispatch under active evaluation":"  - Subject processed and situation fully stabilized"}\n\nSITE PATROL CONTEXT\n${inc.status==="Active"?`Active scene at ${inc.site}. Checkpoint coverage affected during incident management.\n${CHECKPOINTS.filter(c=>c.site===inc.site).map(c=>`  ${c.name}: ${c.scans} scans completed, ${c.missed} missed  (last scan ${c.last})`).join("\n")}`:"Incident resolved — full patrol coverage restored at this site."}\n\nSTATUS: ${inc.status.toUpperCase()}`;
    }

    case"Patrol Analysis":{
      if(tier==="executive")return`PATROL BRIEFING — ${date.toUpperCase()}\n${org}  ·  ${time}\n\nPatrol completion ${patrolPct}% across ${SITES.length} sites (${completedCPs}/${totalCPs} checkpoints). Target: 95%. ${patrolPct>=95?"All sites above compliance threshold.":"Below target — "+missedCPs+" missed checkpoint"+(missedCPs>1?"s":"")+". "+sitePatrol.filter(s=>s.pct<95).map(s=>s.name).join(", ")+" require corrective action."} ${critInc.length>0?`Active incident at ${critInc[0].site} accounts for primary patrol reduction — adjusted rate ${Math.round(((completedCPs)/(totalCPs-missedCPs+0.01))*100)}% above target.`:"No patrol anomalies linked to active incidents."}`.trim();

      if(tier==="client")return`PATROL COMPLIANCE REPORT\n${org}  ·  ${date}\n${hr}\n\nSERVICE PERIOD\nShift: ${shift}  |  Sites: ${SITES.length}  |  Total Patrol Points: ${totalCPs}\n\nCOMPLIANCE SUMMARY\nPatrol rounds completed at ${patrolPct}% of all scheduled checkpoints. All primary security zones covered per your contract requirements.\n\nSITE-BY-SITE COVERAGE\n${sitePatrol.map(s=>`${s.name.padEnd(24)} ${s.pct}% coverage  ·  ${s.pct>=95?"Compliant":"Under review"}`).join("\n")}\n\nSERVICE ASSURANCE\n${patrolPct>=95?"All sites maintained patrol compliance above the contractual threshold. Your facilities are being actively monitored to the agreed standard.":"We are actively reviewing the patrol variance noted above and have initiated corrective measures to restore full compliance during the current shift."}\n\nFor questions regarding patrol coverage, contact your Account Manager.`.trim();

      if(tier==="management")return`${hdr("PATROL ANALYSIS","MANAGEMENT")}\n\nSUMMARY\nCompletion: ${patrolPct}%  (${completedCPs}/${totalCPs})  Target: 95%  Variance: ${patrolPct-95}%  Status: ${patrolPct>=95?"ABOVE TARGET":"BELOW TARGET"}\n\nSITE BREAKDOWN\n${sitePatrol.map(s=>`  ${s.name.padEnd(24)}${String(s.done+"/"+s.total).padEnd(8)}${String(s.pct+"%").padEnd(8)}${s.pct>=95?"Compliant":s.miss+" missed — follow-up required"}`).join("\n")}\n\nTREND CONTEXT\n  7-Day average: ${patrolPct-6}%  |  Today: ${patrolPct}%  |  Trend: ${patrolPct>=(patrolPct-6)?"Above baseline":"Below baseline"}\n\nANOMALY ANALYSIS\n${CHECKPOINTS.filter(c=>c.missed>0).map(c=>`  ${c.name} (${c.site}): ${c.missed} missed  ·  Last scan ${c.last}  ·  ${INCIDENTS.find(i=>i.site===c.site&&i.status==="Active")?"LINKED: Active incident at this site":"No linked incidents"}`).join("\n")||"  No anomalies detected."}\n\nRECOMMENDATIONS\n${CHECKPOINTS.filter(c=>c.missed>0).map((c,i)=>`  ${i+1}. Verify ${c.name}, ${c.site} — schedule compensatory patrol, increase next-shift frequency`).join("\n")||"  1. Maintain current patrol schedule — all checkpoints nominal"}`.trim();

      return`${hdr("PATROL ANALYSIS","INTERNAL — SUPERVISORY")}\n\nCOMPLETION METRICS\nScheduled: ${totalCPs}  |  Completed: ${completedCPs}  |  Missed: ${missedCPs}\nTarget: 95%  |  Achieved: ${patrolPct}%  |  Status: ${patrolPct>=95?"ABOVE TARGET":"BELOW TARGET"}\n\nCHECKPOINT DETAIL\n${CHECKPOINTS.map(c=>`${c.name.padEnd(24)} ${c.site.padEnd(22)} Scans: ${c.scans.toString().padEnd(4)} Missed: ${c.missed}  Last: ${c.last}`).join("\n")}\n\nSITE SUMMARY\n${sitePatrol.map(s=>`${s.name.padEnd(22)}${String(s.done+"/"+s.total).padEnd(8)}${String(s.pct+"%").padEnd(8)}${s.miss>0?`${s.miss} missed — ${INCIDENTS.find(i=>i.site===s.name&&i.status==="Active")?"active incident linked":"follow-up required"}`:"Full completion"}`).join("\n")}\n\nOFFICER PATROL PERFORMANCE\n${OFFICERS.filter(o=>o.status!=="Off Duty").map(o=>`${o.name.padEnd(18)} ${o.badge}  Site: ${o.site.padEnd(22)} ${o.cps} CPs${o.incidents>0?`  ${o.incidents} active incident`:""}${o.status==="Incident Active"?"  [INCIDENT SCENE — reduced patrol expected]":""}`).join("\n")}\n\n${missedCPs>0?`ADJUSTED RATE: Excluding active incident scene, effective completion rate ${Math.round(((completedCPs)/(totalCPs-2))*100)}% — above 95% target.`:"All officers meeting patrol standards."}`;
    }

    case"Workforce Performance":{
      if(tier==="executive")return`WORKFORCE BRIEFING — ${date.toUpperCase()}\n${org}  ·  ${time}\n\nDay shift ${active.length}/${OFFICERS.length} officers active across ${SITES.length} sites. Top performer: ${topOfficer.name} (${topOfficer.cps} checkpoints, ${topOfficer.incidents} incidents). ${expired.length>0?expired.length+" certification gap"+(expired.length>1?"s":"")+` — non-compliant deployment identified (${expired.map(t=>t.officer).join(", ")}). Immediate HR action required.`:"All certifications compliant."} Night rotation (${offDuty.map(o=>o.name).join(", ")}) commencing at 18:00.`.trim();

      if(tier==="client")return`WORKFORCE STATUS REPORT\n${org}  ·  ${date}\n${hr}\n\nSTAFFING SUMMARY\nFully qualified team deployed across ${SITES.length} sites throughout today's shift. All contracted positions covered per service agreement.\n\nSERVICE COVERAGE\n${SITES.map(s=>{const off=active.find(o=>o.site===s.name);return`${s.name.padEnd(24)} ${off?off.status:"Active coverage"}  ·  Staffed`}).join("\n")}\n\nSERVICE ASSURANCE\nAll security personnel are qualified, certified, and active on deployment per assignment schedule. A qualified night rotation team will maintain service continuity from 18:00 onwards.`.trim();

      if(tier==="management")return`${hdr("WORKFORCE PERFORMANCE","MANAGEMENT")}\n\nSTAFFING\nScheduled: ${OFFICERS.length}  ·  Active: ${active.length}  ·  Off Duty: ${offDuty.length}\nDeployment Rate: ${Math.round(active.length/OFFICERS.length*100)}%\n\nPERFORMANCE SUMMARY\n${active.map(o=>`  ${o.name.padEnd(18)} ${o.badge.padEnd(8)} ${o.status.padEnd(18)} ${o.cps} CPs  ${o.incidents} incidents`).join("\n")}\n\nCOMPLIANCE STATUS\n${expired.length>0?`  NON-COMPLIANT: ${expired.map(t=>`${t.officer} — ${t.cert} expired ${t.expiry}`).join("; ")}`:"  All active officers hold valid certifications."}\n\nHIGHLIGHTS\n  Top performer: ${topOfficer.name} — ${topOfficer.cps} checkpoints, ${topOfficer.incidents} incidents\n  Night rotation ready: ${offDuty.map(o=>o.name).join(", ")} — 18:00 handover\n\nHR ACTIONS REQUIRED\n${expired.length>0?expired.map((t,i)=>`  ${i+1}. ${t.officer}: ${t.cert} — arrange renewal immediately`).join("\n"):"  None — all compliance requirements met"}`.trim();

      return`${hdr("WORKFORCE PERFORMANCE","INTERNAL — SUPERVISORY")}\n\nSTAFFING\nScheduled: ${OFFICERS.length}  |  Active: ${active.length}  |  Off Duty: ${offDuty.length} (${offDuty.map(o=>`${o.name} — ${o.shift}`).join(", ")})\n\nOFFICER STATUS\n${OFFICERS.map(o=>`${o.name.padEnd(16)} ${o.badge.padEnd(8)} ${o.status.padEnd(18)} ${o.cps} CPs  ${o.incidents} incident${o.incidents!==1?"s":""}  Site: ${o.site}`).join("\n")}\n\nPERFORMANCE HIGHLIGHTS\n  Outstanding: ${topOfficer.name} — ${topOfficer.cps} checkpoints, ${topOfficer.incidents} incidents, full patrol coverage\n${incidentOfficer?`  Active scene: ${incidentOfficer.name} — incident management reducing patrol count (expected)\n`:""}  Night rotation: ${offDuty.map(o=>o.name).join(", ")} — briefing required at 17:45\n\nCERTIFICATION STATUS\n${TRAINING_DATA.slice(0,6).map(t=>`  ${t.officer.padEnd(18)} ${t.cert.padEnd(28)} ${t.status.toUpperCase()}  Exp: ${t.expiry}`).join("\n")}\n\nACTION ITEMS\n${expired.length>0?expired.map((t,i)=>`  ${i+1}. URGENT: ${t.officer} (${OFFICERS.find(o=>o.name===t.officer)?.badge||"—"}) — ${t.cert} expired. Remove from live deployment until renewed.`).join("\n"):"  No HR actions required."}`;
    }

    case"Risk Assessment":{
      const risks=[
        ...critInc.map(i=>({level:"HIGH",site:i.site,detail:`Active ${i.type.toLowerCase()} ${i.id} — single officer on scene. Duration approaching SOP limit. Immediate backup recommended.`})),
        ...(missedCPs>0?[{level:"MEDIUM",site:CHECKPOINTS.filter(c=>c.missed>0)[0].site,detail:`${missedCPs} missed checkpoint${missedCPs>1?"s":""} — ${CHECKPOINTS.filter(c=>c.missed>0).map(c=>c.name).join(", ")}. Possible correlation with active incident.`}]:[]),
        ...(expired.length>0?[{level:"MEDIUM",site:"Personnel",detail:`${expired.length} expired certification${expired.length>1?"s":""} — ${expired.map(t=>`${t.officer} (${t.cert})`).join(", ")}. Non-compliant deployment — legal and regulatory exposure.`}]:[]),
        ...(maintenance>0?[{level:"LOW",site:"Fleet",detail:`${maintenance} vehicle${maintenance>1?"s":""} in maintenance — reduced fleet capacity. Monitor for operational impact if incident escalation requires vehicle response.`}]:[]),
      ];
      const baseline=(riskScore-2.4).toFixed(1);

      if(tier==="executive")return`RISK BRIEFING — ${date.toUpperCase()}\n${org}  ·  ${time}\n\nOperational risk score: ${riskScore}/10 (${riskLabel}). 7-day baseline: ${baseline}/10. ${risks.filter(r=>r.level==="HIGH").length} high-priority risk${risks.filter(r=>r.level==="HIGH").length!==1?"s":""} active${risks.filter(r=>r.level==="HIGH").length>0?` — ${risks.filter(r=>r.level==="HIGH").map(r=>r.site).join(", ")} require executive awareness`:""}. ${critInc.length>0?`Active incident at ${critInc[0].site} is primary risk driver.`:"All risk indicators within acceptable parameters."} ${expired.length>0?`Compliance gap: ${expired.length} unresolved certification${expired.length>1?"s":""} — regulatory exposure.`:"No compliance gaps."}`.trim();

      if(tier==="client")return`SECURITY STATUS BRIEFING\n${org}  ·  ${date}\n${hr}\n\nAll ${SITES.length} client sites are actively monitored, secured, and staffed in accordance with contracted service levels.\n\n${critInc.length>0?`A security response is currently active at ${critInc.map(i=>i.site).join(", ")}. Our team is on scene managing the situation according to all applicable protocols. You will be notified promptly upon resolution.`:"No high-priority incidents affecting client sites at this time."}\n\nAll patrol, access control, and monitoring obligations are being met. ShieldSync Protect maintains proactive 24/7 risk monitoring across all protected sites. Your safety and service continuity are our priority.`.trim();

      if(tier==="management")return`${hdr("RISK ASSESSMENT","MANAGEMENT — SENSITIVE")}\n\nOVERALL RISK SCORE: ${riskScore}/10 (${riskLabel})\n7-Day Baseline: ${baseline}/10  |  Trend: ${riskScore>parseFloat(baseline)?"Above baseline — investigate drivers":"Within normal range"}\n\nRISK REGISTER\n${risks.map(r=>`  [${r.level}] ${r.site}\n  ${r.detail}`).join("\n\n")||"  No significant risks identified."}\n\nSITE RISK MATRIX\n${sitePatrol.map(s=>{const siteInc=INCIDENTS.filter(i=>i.site===s.name&&(i.status==="Active"||i.status==="Under Review")).length;const level=siteInc>0?"HIGH":s.pct<90?"MEDIUM":"LOW";return`  ${s.name.padEnd(22)} ${level.padEnd(10)} ${siteInc>0?`Active incident (${siteInc})`:"Patrol nominal"}`}).join("\n")}\n\nPRIORITY ACTIONS\n${risks.map((r,i)=>`  ${i+1}. [${r.level}] ${r.site} — ${r.detail.split(".")[0]}`).join("\n")||"  1. Maintain current security posture — risk levels nominal"}`.trim();

      return`${hdr("RISK ASSESSMENT","INTERNAL — SENSITIVE")}\n\nCRITICAL RISK FACTORS\n${risks.map(r=>`[${r.level}] ${r.site}\n${r.detail}`).join("\n\n")||"No critical risk factors identified."}\n\nSITE RISK MATRIX\n${sitePatrol.map(s=>{const siteInc=INCIDENTS.filter(i=>i.site===s.name&&(i.status==="Active"||i.status==="Under Review")).length;const miss=CHECKPOINTS.filter(c=>c.site===s.name&&c.missed>0).length;const level=siteInc>0?"HIGH":s.pct<90||miss>0?"MEDIUM":"LOW";const action=level==="HIGH"?"Immediate backup + full perimeter sweep":level==="MEDIUM"?"Increase patrol frequency + investigate anomaly":"Maintain current coverage";return`${s.name.padEnd(22)} ${level.padEnd(8)} — ${action}`}).join("\n")}\n\nOVERALL RISK SCORE: ${riskScore}/10 (${riskLabel})\n7-Day Baseline: ${baseline}/10\n\nPRIORITY ACTIONS\n${risks.map((r,i)=>`${i+1}. [${r.level}] ${r.site}: ${r.detail.split(".")[0]}`).join("\n")||"1. Maintain current security posture"}\n${risks.length+1}. Ensure night rotation is fully briefed on all active items at 17:45 before 18:00 handover`;
    }

    case"Executive Briefing":{
      const fleetMTD=FLEET_COSTS.reduce((s,v)=>s+v.total,0);
      return`${hdr("EXECUTIVE SECURITY BRIEFING","EYES ONLY")}\n\nOPERATIONAL STATUS\nRisk Score: ${riskScore}/10 (${riskLabel})  |  Patrol: ${patrolPct}%  |  Avg Response: 4.2 min\n\nKEY METRICS\n  Officers deployed:    ${active.length}/${OFFICERS.length} (${Math.round(active.length/OFFICERS.length*100)}%)\n  Sites secured:        ${SITES.length}/${SITES.length} (100%)\n  Incidents today:      ${INCIDENTS.length} total  ·  ${openInc.length} open  ·  ${resolvedInc.length} resolved\n  Patrol completion:    ${patrolPct}% (target 95%)\n  Fleet availability:   ${available}/${VEHICLES.length} vehicles ready\n  Compliance gaps:      ${expired.length>0?expired.length+` (${expired.map(t=>t.officer).join(", ")})`:"None"}\n\nINCIDENT STATUS\n${openInc.length>0?openInc.map(i=>`  ${i.sev.toUpperCase()} — ${i.type} at ${i.site}  ·  Officer: ${i.officer}  ·  Status: ${i.status}`).join("\n"):"  No open incidents."}\n\nFINANCIAL CONTEXT\n  Labour deployed:      ${active.length} × 12h shift = ${active.length*12} officer-hours today\n  Fleet cost MTD:       $${fleetMTD.toLocaleString()}\n  SLA risk exposure:    ${CLIENT_SLA.filter(c=>c.status==="At Risk").length>0?`${CLIENT_SLA.filter(c=>c.status==="At Risk").map(c=>c.client).join(", ")} — at risk`:"None identified"}\n\nSTRATEGIC RECOMMENDATIONS\n  1. ${critInc.length>0?`Resolve ${critInc[0].id} at ${critInc[0].site} — SLA exposure and single-officer liability risk`:"Maintain current operational posture — all KPIs above threshold"}\n  2. ${expired.length>0?`Initiate cert renewal programme — ${expired.length} compliance gap${expired.length>1?"s":""} create regulatory exposure`:"Review weekend staffing model — patrol rates historically drop 6% Sat/Sun"}\n  3. ${maintenance>0?`Prioritise V-03 return to service — current fleet at ${Math.round(available/VEHICLES.length*100)}% availability`:"Fleet fully operational — consider preventative maintenance scheduling"}`;
    }

    case"Client Report":{
      const sla=CLIENT_SLA[0];
      return`${hdr("CLIENT SECURITY REPORT","CLIENT COPY")}\n\nPrepared for: ${sla.client}\nSite:         ${sla.site}\nReport Period: Today  ·  Shift ${shift}\nAccount:       ShieldSync Protect — Enterprise Services\n\nEXECUTIVE SUMMARY\nSecurity operations at ${sla.site} are performing at ${sla.satisfaction}% client satisfaction. Patrol compliance at ${sla.patrols}% — above the contractual minimum of 90%. Average response time ${sla.responseTime} minutes.\n\nSERVICE METRICS THIS PERIOD\n  Patrol compliance:    ${sla.patrols}%      (Contract minimum: 90%+)\n  Avg response time:    ${sla.responseTime} min      (SLA target: <5 min)\n  Incidents:            ${sla.incidents} reported  ·  ${sla.resolved} resolved\n  Client satisfaction:  ${sla.satisfaction}%        (Industry benchmark: 85%)\n  Officers assigned:    ${sla.officers}\n  Contract health:      ${sla.trend} trend this period\n\nINCIDENT LOG\n${INCIDENTS.filter(i=>i.site===sla.site).map(i=>`  ${i.id.padEnd(12)} ${i.type.padEnd(24)} ${i.time}  ·  Status: ${i.status}`).join("\n")||"  No incidents recorded at this site today."}\n\nPATROL COVERAGE\n${CHECKPOINTS.filter(c=>c.site===sla.site).map(c=>`  ${c.name.padEnd(24)} ${c.scans} scans completed  ·  ${c.missed>0?`${c.missed} missed — under review`:"Fully compliant"}`).join("\n")||"  Standard patrol rounds completed."}\n\nSERVICE COMMITMENT\nShieldSync Protect is committed to delivering the highest standard of security services at your facility. This report is issued in accordance with our Service Level Agreement. For escalations or questions, contact your Account Manager directly.\n\nSatisfaction trend: ${sla.trend} this period.`;
    }

    case"Shift Handover":{
      const nightOfficers=OFFICERS.filter(o=>o.status==="Off Duty");
      return`${hdr("SHIFT HANDOVER REPORT","HANDOVER DOCUMENT")}\n\nHandover: ${time}  ·  Outgoing: Day Shift ${shift}  ·  Incoming: Night Shift 18:00–06:00\n\nOPERATIONS AT HANDOVER\n  Sites secured:        ${SITES.length}/${SITES.length}\n  Open incidents:       ${openInc.length}${openInc.length>0?"  *** NIGHT SHIFT — ACTIVE ITEMS REQUIRE FOLLOW-UP ***":""}\n  Patrol rate (today):  ${patrolPct}%\n  Equipment:            All checked-out items accounted for\n\nACTIVE INCIDENTS — NIGHT SHIFT MUST MONITOR\n${openInc.length>0?openInc.map(i=>`  ${i.id.padEnd(12)} ${i.sev.toUpperCase()}/OPEN  ${i.type} at ${i.site}\n  Responding: ${i.officer}  ·  Since: ${i.time}  ·  Night shift to confirm resolution or escalate.\n`).join(""):"  No open incidents. Night shift deploying to clear-state operations."}\n\nSITE STATUS AT HANDOVER\n${sitePatrol.map(s=>`  ${s.name.padEnd(22)} ${s.pct>=95?"Nominal  ":"Review  "}Patrol: ${s.pct}%  ${CHECKPOINTS.filter(c=>c.site===s.name&&c.missed>0).length>0?"— MISSED CHECKPOINTS: FOLLOW UP REQUIRED":""}`).join("\n")}\n\nEQUIPMENT HANDOVER\n${EQUIPMENT.filter(e=>e.status==="Checked Out").map(e=>`  ${e.id.padEnd(8)} ${e.name.padEnd(22)} Assigned: ${e.officer} (${e.badge})`).join("\n")}\n\nINCOMING SHIFT BRIEFING\n${nightOfficers.length>0?`Incoming officers: ${nightOfficers.map(o=>o.name).join(", ")}\n`:""}  1. ${openInc.length>0?`Follow up on open incident${openInc.length>1?"s":""}: ${openInc.map(i=>i.id).join(", ")}`:"Operations handed over clear — maintain standard patrol schedule"}\n  2. ${missedCPs>0?`Verify missed checkpoints: ${CHECKPOINTS.filter(c=>c.missed>0).map(c=>`${c.name} (${c.site})`).join(", ")}`:"No missed checkpoint remediation required"}\n  3. ${expired.length>0?`Compliance note: ${expired.map(t=>t.officer).join(", ")} — certification expired. Night supervisor is aware.`:"All certifications compliant for night deployment"}\n  4. Radio check on Channel 4 at 18:15 once all incoming officers have checked in\n\nHandover certified by: Day Shift Supervisor  ·  ${time}`;
    }

    default:return"Report type not recognised.";
  }
}

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
        <div style={{display:"flex",justifyContent:"center",marginBottom:14}}><AlertTriangle size={32} color={T.red} strokeWidth={1.5}/></div>
        <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:8}}>Module Error</div>
        <div style={{fontSize:13,color:T.textSub,marginBottom:24,maxWidth:340,margin:"0 auto 24px",lineHeight:1.6}}>{this.state.err.message}</div>
        <button onClick={()=>this.setState({err:null})} style={{background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,padding:"11px 24px",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13,display:"inline-flex",alignItems:"center",gap:7}}><RotateCcw size={13} strokeWidth={2}/>Retry</button>
      </div>
    );
    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────
function dlCSV(rows,filename){
  const sanitize=v=>{const s=String(v).replace(/"/g,'""');return /^[=+\-@\t\r]/.test(s)?`'${s}`:s;};
  const csv=rows.map(r=>r.map(v=>`"${sanitize(v)}"`).join(",")).join("\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  const a=document.createElement("a");
  a.href=url;a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),150);
}
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
function SH({title,action,icon,sub}){
  const Icon=icon&&typeof icon!=="string"?icon:null;
  const ActionIco=action?.icon||null;
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {Icon?<Icon size={13} color={T.textDim} strokeWidth={2}/>:icon?<span style={{fontSize:13}}>{icon}</span>:null}
          <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:T.textDim}}>{title}</span>
        </div>
        {sub&&<div style={{fontSize:11,color:T.textDim,marginTop:3,lineHeight:1.4}}>{sub}</div>}
      </div>
      {action&&<button onClick={action.fn} className="ss-ghost-btn" style={{background:T.raised,border:`1px solid ${T.border}`,color:T.textSub,fontSize:11,fontWeight:500,padding:"6px 12px",borderRadius:6,cursor:"pointer",WebkitTapHighlightColor:"transparent",display:"inline-flex",alignItems:"center",gap:5,flexShrink:0,transition:"all 0.12s"}}>{ActionIco&&<ActionIco size={11} strokeWidth={2}/>}{action.label}</button>}
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
function AuthScreen({onLogin,onRegister}){
  const[tab,setTab]=useState("login");
  const[email,setEmail]=useState("");
  const[pw,setPw]=useState("");
  const[showPw,setShowPw]=useState(false);
  const[err,setErr]=useState("");
  const[showDemo,setShowDemo]=useState(false);
  const[pending,startTransition]=useTransition();
  const[reg,setReg]=useState({company:"",name:"",email:"",pw:"",pw2:"",industry:"Security Services",size:"11-50"});
  const[regErr,setRegErr]=useState("");
  const[regDone,setRegDone]=useState(false);
  const[forgotStep,setForgotStep]=useState(0);
  const[forgotEmail,setForgotEmail]=useState("");
  const[forgotCode,setForgotCode]=useState("");
  const[forgotNewPw,setForgotNewPw]=useState("");
  const[forgotErr,setForgotErr]=useState("");
  const[codeSent,setCodeSent]=useState(false);
  const DEMO_CODE="123456";
  const inp=(ex={})=>({width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",color:T.text,fontSize:14,outline:"none",transition:"border-color .2s",boxSizing:"border-box",...ex});

  const attempt=()=>{
    if(!email.trim()||!pw){setErr("Please enter your email and password.");return;}
    setErr("");
    startTransition(async()=>{
      await new Promise(r=>setTimeout(r,850));
      const u=authUser(email,pw);
      if(u){saveSession(u);logAction(u,"LOGIN",`Signed in from ${navigator.userAgent.includes("Mobile")?"mobile":"desktop"}`);onLogin(u);}
      else setErr("Incorrect email or password. Please try again.");
    });
  };
  const regUpd=(k,v)=>setReg(r=>({...r,[k]:v}));
  const submitReg=()=>{
    if(!reg.company.trim()||!reg.name.trim()||!reg.email.trim()||!reg.pw){setRegErr("All fields are required.");return;}
    if(!/\S+@\S+\.\S+/.test(reg.email)){setRegErr("Please enter a valid email address.");return;}
    if(reg.pw.length<8){setRegErr("Password must be at least 8 characters.");return;}
    if(reg.pw!==reg.pw2){setRegErr("Passwords do not match.");return;}
    const users=getUsers();
    if(users.find(u=>u.email.toLowerCase()===reg.email.toLowerCase())){setRegErr("An account with this email already exists.");return;}
    const newUser={id:`U-${Date.now()}`,email:reg.email,password:reg.pw,name:reg.name,role:"Company Admin",badge:"ADMIN-NEW",av:reg.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2),active:true,createdAt:new Date().toISOString().slice(0,10),mfaEnabled:false,company:reg.company,isNewCompany:true};
    saveUsers([...users,newUser]);
    setRegErr("");setRegDone(true);
    onRegister&&onRegister(newUser);
  };
  const forgotSend=()=>{
    if(!forgotEmail.trim()){setForgotErr("Enter your email.");return;}
    const u=getUsers().find(u=>u.email.toLowerCase()===forgotEmail.toLowerCase());
    if(!u){setForgotErr("No account found with that email.");return;}
    setForgotErr("");setForgotStep(2);setCodeSent(true);
  };
  const forgotVerify=()=>{
    if(forgotCode!==DEMO_CODE){setForgotErr("Invalid code — check the demo hint below");return;}
    setForgotErr("");setForgotStep(3);
  };
  const forgotReset=()=>{
    if(forgotNewPw.length<8){setForgotErr("Minimum 8 characters.");return;}
    saveUsers(getUsers().map(u=>u.email.toLowerCase()===forgotEmail.toLowerCase()?{...u,password:forgotNewPw}:u));
    setForgotErr("");setForgotStep(4);
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
        select:focus{outline:none;border-color:${T.accentB}!important;}
      `}</style>
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}} preserveAspectRatio="none">
        {[...Array(22)].map((_,i)=><line key={`v${i}`} x1={`${i*4.76}%`} y1="0" x2={`${i*4.76}%`} y2="100%" stroke={T.accent} strokeWidth=".5" opacity=".05"/>)}
        {[...Array(16)].map((_,i)=><line key={`h${i}`} x1="0" y1={`${i*6.67}%`} x2="100%" y2={`${i*6.67}%`} stroke={T.accent} strokeWidth=".5" opacity=".05"/>)}
      </svg>
      <div style={{position:"absolute",top:"5%",left:"50%",transform:"translateX(-50%)",width:"90vw",maxWidth:800,height:"55vh",background:`radial-gradient(ellipse at center,${T.accentGlow} 0%,transparent 65%)`,pointerEvents:"none",animation:"glow 4s ease-in-out infinite"}}/>

      <div style={{textAlign:"center",marginBottom:24,animation:"ssUp .35s ease",position:"relative",zIndex:1}}>
        <div style={{width:66,height:66,borderRadius:20,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",boxShadow:`0 0 40px ${T.accent}30`}}><Shield size={30} color="#fff" strokeWidth={2}/></div>
        <div style={{fontSize:32,fontWeight:900,color:T.text,letterSpacing:"-0.03em",fontFamily:"'Syne',system-ui"}}>ShieldSync</div>
        <div style={{fontSize:9,color:T.textDim,letterSpacing:"0.24em",textTransform:"uppercase",marginTop:5}}>SENTINEL · ENTERPRISE SECURITY PLATFORM</div>
      </div>

      {/* Tab bar — hidden during forgot-password flow */}
      {forgotStep===0&&(
        <div style={{display:"flex",gap:2,background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:3,marginBottom:16,position:"relative",zIndex:1,animation:"ssUp .4s ease .04s both"}}>
          {[["login","Sign In"],["register","Register Company"]].map(([k,lb])=>(
            <button key={k} onClick={()=>{setTab(k);setErr("");setRegErr("");}}
              style={{padding:"8px 20px",borderRadius:9,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,transition:"all .15s",background:tab===k?T.accent:"transparent",color:tab===k?"#000":T.textSub}}>
              {lb}
            </button>
          ))}
        </div>
      )}

      <div style={{width:"min(450px,100%)",background:T.surface,border:`1px solid ${T.border}`,borderRadius:22,padding:32,boxShadow:`0 48px 96px rgba(0,0,0,0.7),0 0 0 1px ${T.border}`,animation:"ssUp .45s ease .08s both",position:"relative",zIndex:1}}>

        {/* ── FORGOT PASSWORD ── */}
        {forgotStep>0&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}>
              <button onClick={()=>{setForgotStep(0);setForgotErr("");setForgotCode("");}} style={{background:"none",border:`1px solid ${T.border}`,color:T.textSub,width:30,height:30,borderRadius:8,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
              <div>
                <div style={{fontSize:17,fontWeight:800,color:T.text}}>
                  {forgotStep===1?"Forgot Password":forgotStep===2?"Check Your Email":forgotStep===3?"New Password":"Reset Complete"}
                </div>
                <div style={{fontSize:12,color:T.textSub,marginTop:2}}>
                  {forgotStep===1?"Enter your registered email"
                   :forgotStep===2?`Code sent to ${forgotEmail} · demo: ${DEMO_CODE}`
                   :forgotStep===3?"Choose a new secure password"
                   :"Sign in with your new password"}
                </div>
              </div>
            </div>
            {forgotErr&&<div style={{background:T.redGlow,border:`1px solid ${T.redB}`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:T.red}}>{forgotErr}</div>}
            {forgotStep===4&&(
              <button onClick={()=>{setForgotStep(0);setForgotEmail("");setForgotNewPw("");setTab("login");}}
                style={{width:"100%",background:`linear-gradient(135deg,${T.green},${T.accent})`,border:"none",borderRadius:12,padding:14,color:"#000",fontWeight:800,fontSize:15,cursor:"pointer"}}>
                Sign In with New Password →
              </button>
            )}
            {forgotStep===1&&(
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <input value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} placeholder="your@email.com" style={inp()} onKeyDown={e=>e.key==="Enter"&&forgotSend()}/>
                <button onClick={forgotSend} style={{background:`linear-gradient(135deg,${T.accent},${T.accentH})`,border:"none",borderRadius:12,padding:14,color:"#000",fontWeight:800,fontSize:15,cursor:"pointer"}}>Send Reset Code</button>
              </div>
            )}
            {forgotStep===2&&(
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <input value={forgotCode} onChange={e=>setForgotCode(e.target.value.replace(/\D/,"").slice(0,6))} placeholder="6-digit code" maxLength={6}
                  style={inp({textAlign:"center",fontSize:24,letterSpacing:"0.3em",fontFamily:"monospace"})} onKeyDown={e=>e.key==="Enter"&&forgotVerify()}/>
                <button onClick={forgotVerify} style={{background:`linear-gradient(135deg,${T.accent},${T.accentH})`,border:"none",borderRadius:12,padding:14,color:"#000",fontWeight:800,fontSize:15,cursor:"pointer"}}>Verify Code</button>
              </div>
            )}
            {forgotStep===3&&(
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <input type="password" value={forgotNewPw} onChange={e=>setForgotNewPw(e.target.value)} placeholder="New password (min 8 chars)" style={inp()} onKeyDown={e=>e.key==="Enter"&&forgotReset()}/>
                <button onClick={forgotReset} style={{background:`linear-gradient(135deg,${T.accent},${T.accentH})`,border:"none",borderRadius:12,padding:14,color:"#000",fontWeight:800,fontSize:15,cursor:"pointer"}}>Reset Password</button>
              </div>
            )}
          </div>
        )}

        {/* ── SIGN IN ── */}
        {forgotStep===0&&tab==="login"&&(
          <div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:19,fontWeight:800,color:T.text}}>Secure Access</div>
              <div style={{fontSize:12,color:T.textSub,marginTop:4,lineHeight:1.6}}>Authorized personnel only. All sessions are monitored and logged.</div>
            </div>
            {err&&<div style={{background:T.redGlow,border:`1px solid ${T.redB}`,borderRadius:10,padding:"11px 14px",marginBottom:16,fontSize:13,color:T.red,display:"flex",gap:9,alignItems:"center"}}><AlertTriangle size={14} strokeWidth={2}/><span>{err}</span></div>}
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={{fontSize:10,color:T.textSub,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:7}}>Email Address</label>
                <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&attempt()} placeholder="you@yourcompany.com" autoComplete="email" style={inp()}/>
              </div>
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                  <label style={{fontSize:10,color:T.textSub,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>Password</label>
                  <button onClick={()=>{setForgotStep(1);setForgotEmail(email);}} style={{background:"none",border:"none",color:T.accent,fontSize:11,cursor:"pointer",padding:0,fontWeight:600}}>Forgot password?</button>
                </div>
                <div style={{position:"relative"}}>
                  <input type={showPw?"text":"password"} value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&attempt()} placeholder="••••••••••" autoComplete="current-password" style={inp({paddingRight:44})}/>
                  <button onClick={()=>setShowPw(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:T.textSub,cursor:"pointer",padding:4,display:"flex",alignItems:"center"}}>{showPw?<EyeOff size={16} strokeWidth={1.8}/>:<Eye size={16} strokeWidth={1.8}/>}</button>
                </div>
              </div>
              <button onClick={attempt} disabled={pending}
                style={{width:"100%",marginTop:4,background:pending?T.raised:`linear-gradient(135deg,${T.accent},${T.accentH})`,border:pending?`1px solid ${T.border}`:"none",borderRadius:12,padding:"14px",color:pending?T.textSub:"#000",fontWeight:800,fontSize:15,cursor:pending?"not-allowed":"pointer",transition:"all .2s"}}>
                {pending?"Verifying credentials…":"Sign In →"}
              </button>
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:22,marginTop:20,paddingTop:16,borderTop:`1px solid ${T.border}`}}>
              {[[Lock,"TLS 1.3"],[ShieldCheck,"SOC 2 Ready"],[CheckCircle2,"ISO 27001"]].map(([Ic,lb])=>(
                <div key={lb} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:T.textDim}}><Ic size={11} color={T.textDim} strokeWidth={2}/><span>{lb}</span></div>
              ))}
            </div>
            <div style={{marginTop:14}}>
              <button onClick={()=>setShowDemo(p=>!p)} style={{width:"100%",background:"none",border:"none",color:T.textDim,fontSize:11,cursor:"pointer",padding:"6px 0",letterSpacing:"0.03em"}}>
                {showDemo?"Hide demo access":"Demo access · Sales & Procurement"}
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
        )}

        {/* ── REGISTER COMPANY ── */}
        {forgotStep===0&&tab==="register"&&(
          regDone?(
            <div style={{textAlign:"center",padding:"24px 0"}}>
              <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><Building2 size={44} color={T.green} strokeWidth={1.5}/></div>
              <div style={{fontSize:18,fontWeight:800,color:T.green,marginBottom:10}}>Company Registered!</div>
              <div style={{fontSize:13,color:T.textSub,lineHeight:1.7,marginBottom:22}}>
                <strong style={{color:T.text}}>{reg.company}</strong> is set up. Sign in to start your onboarding.
              </div>
              <button onClick={()=>{setTab("login");setEmail(reg.email);setPw(reg.pw);}}
                style={{background:`linear-gradient(135deg,${T.accent},${T.accentH})`,border:"none",borderRadius:12,padding:14,color:"#000",fontWeight:800,fontSize:15,cursor:"pointer",width:"100%"}}>
                Continue to Sign In →
              </button>
            </div>
          ):(
            <div>
              <div style={{marginBottom:18}}>
                <div style={{fontSize:18,fontWeight:800,color:T.text}}>Register Your Company</div>
                <div style={{fontSize:12,color:T.textSub,marginTop:4,lineHeight:1.6}}>You'll be the Company Admin with full platform access.</div>
              </div>
              {regErr&&<div style={{background:T.redGlow,border:`1px solid ${T.redB}`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:T.red}}>{regErr}</div>}
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {[{label:"Company Name",k:"company",ph:"Acme Security Inc."},{label:"Your Full Name",k:"name",ph:"John Smith"},{label:"Admin Email",k:"email",ph:"admin@yourcompany.com",type:"email"}].map(({label,k,ph,type})=>(
                  <div key={k}>
                    <label style={{fontSize:10,color:T.textSub,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:6}}>{label}</label>
                    <input type={type||"text"} value={reg[k]} onChange={e=>regUpd(k,e.target.value)} placeholder={ph} style={inp()}/>
                  </div>
                ))}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div>
                    <label style={{fontSize:10,color:T.textSub,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:6}}>Industry</label>
                    <select value={reg.industry} onChange={e=>regUpd("industry",e.target.value)} style={inp({appearance:"none",cursor:"pointer"})}>
                      {["Security Services","Property Management","Logistics","Retail","Healthcare","Government","Other"].map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:10,color:T.textSub,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:6}}>Company Size</label>
                    <select value={reg.size} onChange={e=>regUpd("size",e.target.value)} style={inp({appearance:"none",cursor:"pointer"})}>
                      {["1-10","11-50","51-200","201-500","500+"].map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                {[{label:"Password",k:"pw",ph:"Min 8 characters"},{label:"Confirm Password",k:"pw2",ph:"Repeat password"}].map(({label,k,ph})=>(
                  <div key={k}>
                    <label style={{fontSize:10,color:T.textSub,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:6}}>{label}</label>
                    <input type="password" value={reg[k]} onChange={e=>regUpd(k,e.target.value)} placeholder={ph} style={inp()} onKeyDown={e=>k==="pw2"&&e.key==="Enter"&&submitReg()}/>
                  </div>
                ))}
                <button onClick={submitReg} style={{background:`linear-gradient(135deg,${T.accent},${T.accentH})`,border:"none",borderRadius:12,padding:14,color:"#000",fontWeight:800,fontSize:15,cursor:"pointer",marginTop:4}}>Create Company Account →</button>
                <div style={{fontSize:11,color:T.textDim,textAlign:"center",lineHeight:1.6}}>By registering you agree to our Terms of Service and Privacy Policy.</div>
              </div>
            </div>
          )
        )}
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
          <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><IdCard size={48} color={T.green} strokeWidth={1.5}/></div>
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
            <button onClick={onClose} style={{background:"none",border:`1px solid ${T.border}`,color:T.textSub,width:34,height:34,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={14} strokeWidth={2.5}/></button>
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
              <span style={{display:"flex",alignItems:"center",gap:7,justifyContent:"center"}}><CheckCircle2 size={15} strokeWidth={2}/>Check In Visitor</span>
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
const LiveMap=memo(function LiveMap({officers,positions}){
  // Use animated positions if provided, fall back to static data
  const pos=positions||officers.filter(o=>o.status!=="Off Duty").map(o=>({...o,cx:o.x,cy:o.y}));
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
              {ofs.map((o)=>{
                const p=pos.find(x=>x.id===o.id);
                const cx=p?p.cx:o.x; const cy=p?p.cy:o.y;
                return(
                  <div key={o.id} title={`${o.name} — ${o.status}`} style={{position:"absolute",left:`${cx}%`,top:`${cy}%`,transform:"translate(-50%,-50%)",transition:"left 3.5s ease, top 3.5s ease",zIndex:4}}>
                    <div style={{width:9,height:9,borderRadius:"50%",background:SM(o.status).c,border:"2px solid rgba(255,255,255,.3)",boxShadow:`0 0 7px ${SM(o.status).c}`}}/>
                    <div style={{position:"absolute",top:11,left:"50%",transform:"translateX(-50%)",background:"rgba(6,9,16,.9)",border:`1px solid ${SM(o.status).c}30`,padding:"2px 5px",borderRadius:4,whiteSpace:"nowrap",fontSize:8,color:SM(o.status).c,fontWeight:800}}>{o.av}</div>
                  </div>
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
      const reply=await callAI(apiMsgs,AI_SYS,1000);
      setMsgs(p=>[...p,{role:"ai",text:reply||"No response."}]);
    }catch{setMsgs(p=>[...p,{role:"ai",text:DEMO_NOTE+(DEMO_AI[msg]||DEMO_FALLBACK)}]);}
    setLoading(false);
  },[inp,msgs,loading]);

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:280}}>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,paddingBottom:4}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",flexDirection:m.role==="user"?"row-reverse":"row"}}>
            {m.role==="ai"&&<div style={{width:26,height:26,borderRadius:8,flexShrink:0,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center"}}><Cpu size={13} color="#fff" strokeWidth={2}/></div>}
            <div style={{maxWidth:"82%",padding:"9px 13px",borderRadius:m.role==="user"?"12px 12px 3px 12px":"12px 12px 12px 3px",background:m.role==="user"?`linear-gradient(135deg,${T.accent}20,${T.purple}15)`:T.raised,border:`1px solid ${m.role==="user"?T.accentB:T.border}`,fontSize:13,lineHeight:1.6,color:T.text}}>
              {m.text}
            </div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{width:26,height:26,borderRadius:8,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center"}}><Cpu size={13} color="#fff" strokeWidth={2}/></div>
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
          <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><CheckCircle2 size={52} color={T.green} strokeWidth={1.5}/></div>
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
            <button onClick={onClose} style={{background:"none",border:`1px solid ${T.border}`,color:T.textSub,width:34,height:34,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={14} strokeWidth={2.5}/></button>
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
              <div style={{marginTop:4,padding:"10px 14px",background:T.accentGlow,border:`1px solid ${T.accentB}`,borderRadius:9,fontSize:12,color:T.accent,display:"flex",alignItems:"center",gap:6}}>
                <MapPin size={11} strokeWidth={2}/>GPS tagged · {new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})} · Inspector logged
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
                        <div style={{position:"absolute",top:4,right:4,background:T.green,width:18,height:18,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}><Check size={10} strokeWidth={3} color="#000"/></div>
                      </>
                    ):(
                      <>
                        <Camera size={22} color={T.textDim} strokeWidth={1.5} style={{marginBottom:4}}/>
                        <span style={{fontSize:10,color:T.textSub,textAlign:"center",padding:"0 4px"}}>{sl.label}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div style={{marginTop:12,fontSize:11,color:T.textSub,textAlign:"center"}}>{pc}/6 photos{pc===6&&" · All areas captured"}</div>
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
                <div style={{fontSize:12,color:T.text,display:"flex",alignItems:"center",gap:5}}><Camera size={11} strokeWidth={2}/>{pc}/6 photos</div>
                <div style={{fontSize:12,color:T.text,display:"flex",alignItems:"center",gap:5}}><Gauge size={11} strokeWidth={2}/>Mileage: {mileage} mi</div>
                <div style={{fontSize:12,color:T.text,display:"flex",alignItems:"center",gap:5}}><Fuel size={11} strokeWidth={2}/>Fuel: {fuel}%</div>
                {dmg&&<div style={{fontSize:12,color:T.amber,display:"flex",alignItems:"center",gap:5}}><AlertTriangle size={11} strokeWidth={2}/>Damage notes recorded</div>}
              </div>
            </div>
          )}
          {step===4&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{padding:"14px 16px",background:T.raised,borderRadius:9,fontSize:12,color:T.textSub,lineHeight:1.6}}>
                By signing, you confirm this inspection is accurate and complete. This report will be archived and sent to your supervisor.
              </div>
              <div onClick={()=>!signed&&setSigOpen(true)} style={{padding:"20px",background:signed?T.greenGlow:T.raised,border:`2px ${signed?"solid":"dashed"} ${signed?T.green:T.border}`,borderRadius:12,textAlign:"center",cursor:signed?"default":"pointer",WebkitTapHighlightColor:"transparent"}}>
                {signed?<div style={{color:T.green,fontWeight:800,fontSize:15,display:"flex",alignItems:"center",gap:6}}><Check size={14} strokeWidth={2.5}/>Digitally Signed</div>:<div style={{color:T.textSub,fontSize:13}}>Tap to sign digitally →</div>}
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
              <button onClick={()=>signed&&setDone(true)} disabled={!signed} style={{flex:2,background:signed?T.green:T.raised,border:`1px solid ${signed?T.green:T.border}`,color:signed?"#000":T.textDim,padding:"13px",borderRadius:12,cursor:signed?"pointer":"not-allowed",fontWeight:800,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}><CheckCircle2 size={15} strokeWidth={2}/>Submit Inspection</button>
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
function IncModal({onClose,showToast,user,onSave}){
  const[form,setForm]=useState({type:"Trespass",site:"Northgate Tower",desc:"",sev:"Medium"});
  const[done,setDone]=useState(false);
  const[gen,setGen]=useState(false);
  const[ai,setAi]=useState("");
  const[incidentId]=useState(()=>"INC-"+String(Math.floor(Math.random()*9000)+1000));
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));

  const genNarrative=async()=>{
    if(!form.desc)return;setGen(true);
    try{
      const text=await callAI(
        [{role:"user",content:`Type: ${form.type}\nSite: ${form.site}\nSeverity: ${form.sev}\nNotes: ${form.desc}\n\nWrite a formal incident report narrative.`}],
        "You are a professional security report writer. Generate a formal, concise incident report narrative from officer notes. Professional security language, 3-5 sentences.",
        1000
      );
      setAi(text||"");
    }catch{setAi(`At ${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}, the responding officer documented a ${form.type.toLowerCase()} incident at ${form.site}. ${form.desc?form.desc+" ":""}Appropriate containment measures were initiated per site security protocol (SOP-14). The incident has been logged and escalated to the shift supervisor for review and follow-up action. All parties have been notified per standard operating procedure.`);}
    setGen(false);
  };

  const submit=()=>{
    const now=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    const newInc={id:incidentId,type:form.type,site:form.site,officer:user?.name||"Officer",time:now,sev:form.sev,status:"Open",desc:form.desc,narrative:ai};
    const existing=LS.get("ss_incidents_v1",INCIDENTS);
    LS.set("ss_incidents_v1",[newInc,...existing]);
    onSave?.(newInc);
    logAction(user,"INCIDENT_CREATE",`${incidentId} — ${form.type} @ ${form.site} (${form.sev})`);
    setDone(true);
    showToast(`${incidentId} created and submitted for supervisor review`,"success");
  };

  if(done)return(
    <ModalWrap>
      <Card style={{width:"min(440px,92vw)",textAlign:"center"}}>
        <CB style={{padding:"48px 32px"}}>
          <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><ClipboardList size={52} color={T.green} strokeWidth={1.5}/></div>
          <div style={{fontSize:18,fontWeight:800,color:T.green,marginBottom:8}}>Incident Logged</div>
          <div style={{fontSize:13,color:T.textSub}}>{incidentId} created and submitted for supervisor review.</div>
          <button onClick={onClose} style={{marginTop:24,background:T.green,border:"none",color:"#000",padding:"13px 36px",borderRadius:12,fontWeight:800,cursor:"pointer",fontSize:14,width:"100%"}}>Done</button>
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
              <div style={{fontSize:18,fontWeight:800,color:T.text}}>{incidentId}</div>
            </div>
            <button onClick={onClose} style={{background:"none",border:`1px solid ${T.border}`,color:T.textSub,width:34,height:34,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={14} strokeWidth={2.5}/></button>
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
              <span style={{display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}><Cpu size={13} strokeWidth={2}/>{gen?"Generating…":"Generate AI Narrative"}</span>
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
// Live event ticker — simulates the real-time event stream from a WebSocket backend
const LIVE_TICKER=[
  {t:12000,msg:"Marcus Webb — Checkpoint scanned: Main Entrance",type:"scan"},
  {t:25000,msg:"INC-2847 update — subject contained at Plaza West",type:"success"},
  {t:40000,msg:"Jordan Park — Break ended, returning to patrol",type:"info"},
  {t:57000,msg:"V-02 Highlander dispatched — authorised by Supervisor Chen",type:"dispatch"},
  {t:73000,msg:"Diana Reyes — Checkpoint scanned: Loading Dock",type:"scan"},
  {t:88000,msg:"Lone worker check-in pending — Jordan Park",type:"warning"},
  {t:104000,msg:"INC-2847 resolved — subject processed by Northgate PD",type:"success"},
  {t:119000,msg:"Ava Simmons — Started patrol route, Eastside Mall",type:"info"},
];

function Dashboard({openModal,showToast,isMobile,incidents=INCIDENTS}){
  const[feed,setFeed]=useState([]);
  const[positions,setPositions]=useState(
    OFFICERS.filter(o=>o.status!=="Off Duty").map(o=>({...o,cx:o.x,cy:o.y}))
  );

  useEffect(()=>{
    const timers=LIVE_TICKER.map(e=>setTimeout(()=>{
      setFeed(f=>[{...e,id:Date.now(),time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})},...f.slice(0,19)]);
      if(e.type==="warning")showToast(e.msg,"error");
      else if(e.type==="success")showToast(e.msg,"success");
    },e.t));
    return()=>timers.forEach(clearTimeout);
  },[]);

  useEffect(()=>{
    const t=setInterval(()=>{
      setPositions(prev=>prev.map(p=>({
        ...p,
        cx:Math.max(4,Math.min(96,p.cx+(Math.random()-0.5)*1.8)),
        cy:Math.max(4,Math.min(96,p.cy+(Math.random()-0.5)*1.8)),
      })));
    },3500);
    return()=>clearInterval(t);
  },[]);

  const criticalAlerts=AI_INSIGHTS.filter(a=>a.priority==="critical");
  const activeOfficers=OFFICERS.filter(o=>o.status!=="Off Duty");

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>

      {/* 1 — CRITICAL ALERTS */}
      {criticalAlerts.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {criticalAlerts.map((a,i)=>(
            <div key={i} style={{display:"flex",gap:12,alignItems:"center",padding:"12px 16px",background:`${T.red}0a`,border:`1px solid ${T.red}30`,borderRadius:10}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:T.red,flexShrink:0,animation:"ssB 1s infinite"}}/>
              <span style={{flex:1,fontSize:13,color:T.text,lineHeight:1.5}}>{a.text}</span>
              <Pill label="CRITICAL" color={T.red}/>
            </div>
          ))}
        </div>
      )}

      {/* 2 — METRICS STRIP */}
      <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?3:6},1fr)`,gap:isMobile?6:8}}>
        {KPI_DATA.map(k=>{
          const Ic=k.icon;
          return(
            <div key={k.label} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 14px 12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <Ic size={14} color={k.color} strokeWidth={2}/>
                <span style={{fontSize:10,fontWeight:700,color:k.color,opacity:0.85}}>{k.trend}</span>
              </div>
              <div style={{fontSize:22,fontWeight:900,color:T.text,lineHeight:1,letterSpacing:"-0.02em"}}>{k.value}</div>
              <div style={{fontSize:11,fontWeight:600,color:T.textSub,marginTop:4,lineHeight:1.3}}>{k.label}</div>
            </div>
          );
        })}
      </div>

      {/* 3 — ACTIVE OPERATIONS: map + live feed */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(0,1.6fr) minmax(0,1fr)",gap:12}}>
        <Card>
          <CB>
            <SH title="Active Operations" icon={Navigation} sub={`${activeOfficers.length} units deployed · ${SITES.length} sites`}/>
            <LiveMap officers={OFFICERS} positions={positions}/>
          </CB>
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {/* Officer status */}
          <Card style={{flex:1}}>
            <CB style={{height:"100%"}}>
              <SH title="Field Units" icon={Shield} sub={`${activeOfficers.filter(o=>o.status==="On Patrol").length} on patrol`}/>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {OFFICERS.map(o=>{
                  const c=SM(o.status).c;
                  const pulse=SM(o.status).p;
                  return(
                    <div key={o.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:T.raised,borderRadius:8}}>
                      <Av initials={o.av} color={c} size={28}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.name}</div>
                        <div style={{fontSize:10,color:T.textSub,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.site}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:c,animation:pulse?"ssB 1.2s infinite":"none"}}/>
                        <span style={{fontSize:10,color:c,fontWeight:700,whiteSpace:"nowrap"}}>{o.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CB>
          </Card>
          {/* Live feed */}
          {feed.length>0&&(
            <Card>
              <CB>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:T.green,animation:"ssB 1s infinite"}}/>
                  <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.textSub}}>Live Feed</span>
                  <span style={{fontSize:10,color:T.textDim,marginLeft:"auto"}}>{feed.length} events</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {feed.slice(0,4).map((e,i)=>{
                    const c=e.type==="success"?T.green:e.type==="warning"?T.red:e.type==="dispatch"?T.gold:e.type==="scan"?T.accent:T.textSub;
                    return(
                      <div key={e.id} style={{display:"flex",gap:8,alignItems:"center",padding:"6px 8px",background:T.raised,borderRadius:6,animation:i===0?"ssUp 0.2s ease":"none"}}>
                        <div style={{width:5,height:5,borderRadius:"50%",background:c,flexShrink:0}}/>
                        <span style={{flex:1,fontSize:11,color:T.text,lineHeight:1.4}}>{e.msg}</span>
                        <span style={{fontSize:10,color:T.textDim,fontFamily:"monospace",flexShrink:0}}>{e.time}</span>
                      </div>
                    );
                  })}
                </div>
              </CB>
            </Card>
          )}
        </div>
      </div>

      {/* 4 — RECENT INCIDENTS */}
      <Card>
        <CB>
          <SH title="Incidents" icon={ShieldAlert} action={{icon:Plus,label:"New Incident",fn:()=>openModal({type:"incident"})}}/>
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
                {incidents.map((inc,i)=>(
                  <tr key={inc.id} className="ss-row" style={{borderBottom:i<incidents.length-1?`1px solid ${T.border}20`:"none"}}>
                    <td style={{padding:"10px 10px",color:T.accent,fontWeight:700,fontFamily:"monospace",whiteSpace:"nowrap",fontSize:12}}>{inc.id}</td>
                    <td style={{padding:"10px 10px",color:T.text,whiteSpace:"nowrap"}}>{inc.type}</td>
                    <td style={{padding:"10px 10px",color:T.textSub,whiteSpace:"nowrap"}}>{inc.site}</td>
                    <td style={{padding:"10px 10px",color:T.text,whiteSpace:"nowrap"}}>{inc.officer}</td>
                    <td style={{padding:"10px 10px",color:T.textSub,fontFamily:"monospace",fontSize:12}}>{inc.time}</td>
                    <td style={{padding:"10px 10px"}}><Pill label={inc.sev} color={inc.sev==="High"?T.red:inc.sev==="Medium"?T.amber:T.textSub}/></td>
                    <td style={{padding:"10px 10px"}}><Pill label={inc.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CB>
      </Card>

      {/* 5 — OPERATIONAL INTELLIGENCE */}
      <Card>
        <CB>
          <SH title="Operational Intelligence" icon={Sparkles} sub="AI-generated risk signals — updated continuously"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:8}}>
            {AI_INSIGHTS.map((ins,i)=>{
              const c={critical:T.red,high:T.amber,medium:T.gold,info:T.accent}[ins.priority]||T.textSub;
              return(
                <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"11px 14px",background:T.raised,border:`1px solid ${c}20`,borderRadius:9}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:c,marginTop:4,flexShrink:0,animation:ins.priority==="critical"?"ssB 1s infinite":"none"}}/>
                  <p style={{margin:0,fontSize:12,color:T.text,lineHeight:1.55,flex:1}}>{ins.text}</p>
                  <Pill label={ins.priority} color={c}/>
                </div>
              );
            })}
          </div>
        </CB>
      </Card>

    </div>
  );
}

function Workforce({isMobile}){
  const[search,setSearch]=useState("");
  const[sf,setSf]=useState("All");
  const active=OFFICERS.filter(o=>o.status!=="Off Duty").length;
  const withInc=OFFICERS.filter(o=>o.incidents>0).length;
  const onPatrol=OFFICERS.filter(o=>o.status==="On Patrol").length;
  const sfColor=(s)=>s==="All"?T.accent:SM(s).c;
  const filtered=OFFICERS.filter(o=>{
    const ms=!search||[o.name,o.badge,o.site].some(x=>x.toLowerCase().includes(search.toLowerCase()));
    return ms&&(sf==="All"||o.status===sf);
  });
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:10}}>
        {[[Users,"Total Officers",OFFICERS.length,T.accent],[ShieldCheck,"Active Now",active,T.green],[AlertTriangle,"Active Incidents",withInc,withInc>0?T.red:T.textDim],[Navigation,"On Patrol",onPatrol,T.accent]].map(([Icon,l,v,c])=>(
          <Card key={l} glow={c}>
            <CB style={{padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div><div style={{fontSize:26,fontWeight:900,color:c,lineHeight:1}}>{v}</div><div style={{fontSize:10,color:T.textSub,marginTop:4}}>{l}</div></div>
                <Icon size={18} color={c} strokeWidth={1.5} style={{opacity:0.45}}/>
              </div>
            </CB>
          </Card>
        ))}
      </div>
      <Card>
        <CB style={{padding:"12px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:700,color:T.text}}>Shift Coverage</div>
            <div style={{fontSize:12,fontWeight:800,color:active>=5?T.green:active>=4?T.amber:T.red}}>{Math.round(active/OFFICERS.length*100)}% — {active}/{OFFICERS.length} on duty</div>
          </div>
          <PBar value={active} max={OFFICERS.length} color={active>=5?T.green:active>=4?T.amber:T.red}/>
          <div style={{display:"flex",gap:12,marginTop:10,flexWrap:"wrap"}}>
            {["On Patrol","On Site","Incident Active","Clocked In","Break","Off Duty"].map(s=>{const n=OFFICERS.filter(o=>o.status===s).length;return n?<div key={s} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:T.textSub}}><div style={{width:6,height:6,borderRadius:"50%",background:SM(s).c}}/>{s} ({n})</div>:null;})}
          </div>
        </CB>
      </Card>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, badge, or site…" style={{flex:1,minWidth:150,background:T.surface,border:`1px solid ${T.border}`,color:T.text,padding:"10px 14px",borderRadius:10,fontSize:12,outline:"none"}}/>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["All","On Patrol","Incident Active","Off Duty"].map(s=>(
            <button key={s} onClick={()=>setSf(s)} style={{background:sf===s?`${sfColor(s)}22`:T.raised,border:`1px solid ${sf===s?sfColor(s):T.border}`,color:sf===s?T.text:T.textSub,padding:"8px 12px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{s}</button>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(265px,1fr))",gap:12}}>
        {filtered.length===0
          ?<div style={{gridColumn:"1/-1",padding:40,textAlign:"center",color:T.textSub,fontSize:13}}>No officers match your search.</div>
          :filtered.map(o=>{
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
                      <div style={{fontSize:12,color:T.text,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.site}</div>
                    </div>
                    <div style={{background:T.raised,borderRadius:8,padding:"9px 12px"}}>
                      <div style={{fontSize:10,color:T.textSub,marginBottom:2}}>Checkpoints</div>
                      <div style={{fontSize:12,color:T.accent,fontWeight:800}}>{o.cps} hit</div>
                    </div>
                  </div>
                  {o.incidents>0&&<div style={{marginTop:10,padding:"9px 12px",background:T.redGlow,borderRadius:8,border:`1px solid ${T.redB}`,fontSize:12,color:T.red,fontWeight:700,display:"flex",alignItems:"center",gap:6}}><AlertTriangle size={12} strokeWidth={2}/>{o.incidents} active incident{o.incidents>1?"s":""}</div>}
                </CB>
              </Card>
            );
          })
        }
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

function Patrol({user,showToast,openModal,isMobile}){
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
        showToast(`${cp.name} scanned successfully`,"success");
        setScanning(false);setScanTarget(null);setScanProgress(0);
      }
    },55);
  };
  useEffect(()=>()=>clearInterval(scanRef.current),[]);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(138px,1fr))",gap:10}}>
        {[["38","Total Patrols",T.accent,Shield],["36","Completed",T.green,CheckCircle2],["4","Missed CPs",T.red,AlertTriangle],["42m","Avg Duration",T.gold,Timer]].map(([v,l,c,Ic])=>(
          <Card key={l}>
            <CB style={{textAlign:"center",padding:"16px 12px"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:8}}><Ic size={18} color={c} strokeWidth={1.8}/></div>
              <div style={{fontSize:26,fontWeight:700,color:c}}>{v}</div>
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
              <Camera size={28} color={T.accent} strokeWidth={1.5}/>
            </div>
            <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:4}}>{scanTarget.name}</div>
            <div style={{fontSize:11,color:T.textSub,marginBottom:16}}>{scanTarget.site}</div>
            <div style={{height:6,background:T.raised,borderRadius:3,marginBottom:16,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${scanProgress}%`,background:`linear-gradient(90deg,${T.accent},${T.green})`,borderRadius:3,transition:"width 0.05s linear"}}/>
            </div>
            <div style={{fontSize:12,color:T.accent,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>{scanProgress<100?"Reading code…":<><Check size={12} strokeWidth={2.5}/>Confirmed</>}</div>
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

      <Card>
        <CB>
          <SH title="Pre-Patrol Vehicle Inspection" icon={Car} sub="Tap Inspect to photograph and log vehicle condition before departure"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
            {VEHICLES.map(v=>{
              const c=SM(v.status).c;
              return(
                <div key={v.id} style={{background:T.raised,borderRadius:12,padding:"14px 16px",border:`1px solid ${T.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:800,color:T.text}}>{v.make}</div>
                      <div style={{fontSize:11,color:T.accent,fontFamily:"monospace",marginTop:2}}>{v.plate}</div>
                    </div>
                    <Pill label={v.status}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
                    {[["Officer",v.officer],["Last Insp.",v.lastInsp]].map(([l,val])=>(
                      <div key={l} style={{background:T.bg,borderRadius:7,padding:"7px 9px"}}>
                        <div style={{fontSize:10,color:T.textSub}}>{l}</div>
                        <div style={{fontSize:11,color:T.text,fontWeight:700,marginTop:1}}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <FuelBar pct={v.fuel}/>
                  <button
                    onClick={()=>openModal&&openModal({type:"inspection",vehicle:v})}
                    style={{width:"100%",marginTop:12,background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,padding:"10px",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}
                  ><Camera size={12} strokeWidth={2}/>Inspect &amp; Capture Photos</button>
                </div>
              );
            })}
          </div>
        </CB>
      </Card>
    </div>
  );
}

function Fleet({openModal,isMobile}){
  const[tab,setTab]=useState("vehicles");
  const totalCost=FLEET_COSTS.reduce((s,v)=>s+v.total,0);
  const totalMiles=FLEET_COSTS.reduce((s,v)=>s+v.miles,0);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",gap:6}}>
        {[["vehicles",Car,"Vehicles"],["costs",TrendingUp,"Cost Analytics"]].map(([t,Ic,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?T.accentGlow:T.raised,border:`1px solid ${tab===t?T.accentB:T.border}`,color:tab===t?T.accent:T.textSub,padding:"8px 14px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",gap:5}}><Ic size={12} strokeWidth={2}/>{l}</button>
        ))}
      </div>

      {tab==="vehicles"&&(
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
                  <button onClick={()=>openModal({type:"inspection",vehicle:v})} style={{width:"100%",marginTop:14,background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,padding:"11px",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><ClipboardList size={13} strokeWidth={2}/>Start Inspection</button>
                </CB>
              </Card>
            );
          })}
        </div>
      )}

      {tab==="costs"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(3,1fr)",gap:10}}>
            {[
              {label:"Total Monthly Cost",value:`$${totalCost.toLocaleString()}`,color:T.accent},
              {label:"Total Miles (MTD)",value:totalMiles.toLocaleString(),color:T.gold},
              {label:"Avg Cost/Mile",value:`$${(totalCost/totalMiles).toFixed(2)}`,color:T.amber},
            ].map(s=>(
              <Card key={s.label} glow={s.color}>
                <CB style={{textAlign:"center",padding:"14px 12px"}}>
                  <div style={{fontSize:22,fontWeight:900,color:s.color}}>{s.value}</div>
                  <div style={{fontSize:10,color:T.textSub,marginTop:3}}>{s.label}</div>
                </CB>
              </Card>
            ))}
          </div>
          <Card>
            <CB>
              <SH title="Fleet Cost Breakdown — Current Month"/>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {FLEET_COSTS.map(v=>(
                  <div key={v.vehicle} style={{background:T.raised,borderRadius:10,padding:"13px 15px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:T.text}}>{v.vehicle}</div>
                        <div style={{fontSize:10,color:T.textSub,marginTop:2}}>{v.miles.toLocaleString()} mi · ${v.cpmi}/mi · <span style={{color:v.status==="In Service"?T.green:T.amber}}>{v.status}</span></div>
                      </div>
                      <div style={{fontSize:18,fontWeight:900,color:T.accent}}>${v.total.toLocaleString()}</div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:isMobile?4:6}}>
                      {[["Fuel",v.fuel,T.amber],["Maint.",v.maintenance,T.gold],["Insurance",v.insurance,T.accent],["Deprec.",v.depreciation,T.purple]].map(([l,val,c])=>(
                        <div key={l} style={{textAlign:"center",background:T.bg,borderRadius:7,padding:"8px 6px"}}>
                          <div style={{fontSize:11,fontWeight:700,color:c}}>${val}</div>
                          <div style={{fontSize:9,color:T.textDim,marginTop:2}}>{l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{marginTop:9}}>
                      <PBar value={v.total} max={FLEET_COST_MAX} color={T.accent}/>
                    </div>
                  </div>
                ))}
              </div>
            </CB>
          </Card>
        </div>
      )}
    </div>
  );
}

function Visitors({openModal,user,showToast,isMobile}){
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
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:isMobile?6:10}}>
        {[["Active",active,T.green],["Checked Out",out,T.textSub],["Watchlist","0",T.red]].map(([l,v,c])=>(
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
                <div style={{width:36,height:36,borderRadius:10,background:T.accentGlow,border:`1px solid ${T.accentB}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><UserCircle2 size={18} color={T.accent} strokeWidth={1.8}/></div>
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

// ─────────────────────────────────────────────────────────────────
// SCHEDULING MODULE
// ─────────────────────────────────────────────────────────────────
const SCHED_OFFICER_LIST=[
  {name:"Marcus Webb",badge:"S-0041",certOk:true},
  {name:"Diana Reyes",badge:"S-0067",certOk:true},
  {name:"Theo Okafor",badge:"S-0083",certOk:false,certNote:"SIA Door Supervisor expired Nov 2025"},
  {name:"Ava Simmons",badge:"S-0092",certOk:true},
  {name:"Jordan Park",badge:"S-0105",certOk:true},
  {name:"Elena Voss",badge:"S-0118",certOk:true},
];
const SCHED_SITES=["Northgate Tower","Harbor Logistics","Plaza West","Eastside Mall"];

function calcShiftHours(start,end){
  const[sh,sm]=start.split(":").map(Number);
  const[eh,em]=end.split(":").map(Number);
  let mins=(eh*60+em)-(sh*60+sm);
  if(mins<=0)mins+=24*60;
  return Math.round(mins/60*100)/100;
}

function ScheduleModule({user,showToast,isMobile}){
  const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const EMPTY={officer:"",badge:"",site:"Northgate Tower",day:"Mon",start:"06:00",end:"18:00",status:"Confirmed"};

  const[shifts,setShifts]=useLS("ss_schedule_shifts",WEEKLY_SHIFTS);
  const[openShifts,setOpenShifts]=useLS("ss_schedule_open",OPEN_SHIFTS);
  const[dayFilter,setDayFilter]=useState("All");
  const[siteFilter,setSiteFilter]=useState("All");
  const[showForm,setShowForm]=useState(false);
  const[editTarget,setEditTarget]=useState(null);
  const[form,setForm]=useState(EMPTY);
  const[certOverride,setCertOverride]=useState(false);
  const[deleteId,setDeleteId]=useState(null);

  const isSup=["Company Admin","Supervisor"].includes(user?.role);

  const sites=[...new Set(shifts.map(s=>s.site))];
  const filtered=shifts.filter(s=>(dayFilter==="All"||s.day===dayFilter)&&(siteFilter==="All"||s.site===siteFilter));
  const otCount=shifts.filter(s=>s.ot).length;
  const certWarn=shifts.filter(s=>!s.certOk).length;
  const totalHours=shifts.reduce((a,s)=>a+s.hours,0);

  const officerInfo=(badge)=>SCHED_OFFICER_LIST.find(o=>o.badge===badge)||{certOk:true};
  const formOfficer=SCHED_OFFICER_LIST.find(o=>o.badge===form.badge);
  const formCertOk=formOfficer?formOfficer.certOk:true;

  const hasConflict=(badge,day,start,end,excludeId=null)=>{
    const toMins=(t)=>{const[h,m]=t.split(":").map(Number);return h*60+m;};
    let ns=toMins(start),ne=toMins(end);
    if(ne<=ns)ne+=1440;
    return shifts.some(s=>{
      if(s.id===excludeId||s.badge!==badge||s.day!==day)return false;
      let es=toMins(s.start),ee=toMins(s.end);
      if(ee<=es)ee+=1440;
      return ns<ee&&ne>es;
    });
  };

  const openCreate=()=>{setForm(EMPTY);setEditTarget(null);setCertOverride(false);setShowForm(true);};
  const openEdit=(s)=>{
    setForm({officer:s.officer,badge:s.badge,site:s.site,day:s.day,start:s.start,end:s.end,status:s.status});
    setEditTarget(s);setCertOverride(!s.certOk);setShowForm(true);
  };
  const closeForm=()=>{setShowForm(false);setEditTarget(null);setForm(EMPTY);setCertOverride(false);};

  const handleOfficerSelect=(e)=>{
    const o=SCHED_OFFICER_LIST.find(o=>o.name===e.target.value)||{};
    setForm(p=>({...p,officer:o.name||"",badge:o.badge||""}));
    setCertOverride(false);
  };

  const handleSave=()=>{
    if(!form.officer||!form.site||!form.day||!form.start||!form.end){
      showToast("All fields required","error");return;
    }
    if(!formCertOk&&!certOverride){
      showToast("Expired certification — supervisor must check the override box to confirm","error");return;
    }
    if(hasConflict(form.badge,form.day,form.start,form.end,editTarget?.id)){
      showToast(`Conflict: ${form.officer} already has a shift on ${form.day} that overlaps these times`,"error");return;
    }
    const hours=calcShiftHours(form.start,form.end);
    const ot=hours>12;
    const certOk=formCertOk;
    const shType=parseInt(form.start.split(":")[0],10)>=18||parseInt(form.start.split(":")[0],10)<6?"Night":"Day";

    if(editTarget){
      const prev=editTarget;
      setShifts(p=>p.map(s=>s.id===prev.id?{...s,...form,hours,ot,certOk,type:shType}:s));
      logAction(user,"SHIFT_EDITED",`${form.officer} ${form.day} ${form.start}–${form.end} at ${form.site}`,
        {prevValue:`${prev.officer} ${prev.day} ${prev.start}–${prev.end}`,newValue:`${form.officer} ${form.day} ${form.start}–${form.end}`});
      showToast("Shift updated","success");
    } else {
      const id=`SH-U${Date.now().toString(36).toUpperCase()}`;
      setShifts(p=>[...p,{...form,id,hours,ot,certOk,type:shType}]);
      logAction(user,"SHIFT_CREATED",`${form.officer} ${form.day} ${form.start}–${form.end} at ${form.site}`,
        {prevValue:null,newValue:`${form.officer} ${form.day} ${form.start}–${form.end} at ${form.site}`});
      showToast("Shift created","success");
    }
    closeForm();
  };

  const handleDelete=(id)=>{
    const s=shifts.find(x=>x.id===id);
    setShifts(p=>p.filter(x=>x.id!==id));
    logAction(user,"SHIFT_DELETED",`${s?.officer} ${s?.day} ${s?.start}–${s?.end}`,
      {prevValue:`${s?.officer} ${s?.day} at ${s?.site}`,newValue:null});
    showToast("Shift deleted","success");
    setDeleteId(null);
  };

  const typeColor=(t)=>t==="Night"?T.purple:T.accent;
  const statusColor=(s)=>s==="Confirmed"?T.green:s==="Pending"?T.amber:T.textDim;
  const today=new Date();
  const weekLabel=`${today.toLocaleDateString([],{month:"short",day:"numeric"})} week`;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <SH icon={Calendar} title="Scheduling" sub={weekLabel}/>
        {isSup&&(
          <button onClick={openCreate} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,background:T.accent,color:"#fff",border:"none",borderRadius:7,padding:"8px 16px",cursor:"pointer",fontWeight:700,flexShrink:0}}>
            <Plus size={13} strokeWidth={2.5}/> Add Shift
          </button>
        )}
      </div>

      {certWarn>0&&(
        <div style={{background:T.redGlow,border:`1px solid ${T.redB}`,borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
          <AlertTriangle size={15} color={T.red} strokeWidth={2}/>
          <span style={{fontSize:13,color:T.red,fontWeight:700}}>{certWarn} shift{certWarn>1?"s":""} assigned to officers with expired certifications — cannot be deployed without supervisor override</span>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12}}>
        {[
          {label:"Total Shifts",val:shifts.length,color:T.accent,icon:Calendar},
          {label:"Scheduled Hours",val:`${totalHours.toFixed(0)}h`,color:T.green,icon:Clock4},
          {label:"Overtime Shifts",val:otCount,color:otCount>0?T.amber:T.textDim,icon:AlertTriangle},
          {label:"Cert Blocked",val:certWarn,color:certWarn>0?T.red:T.textDim,icon:ShieldAlert},
        ].map(s=>(
          <Card key={s.label} style={{padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:11,color:T.textSub,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>{s.label}</div>
                <div style={{fontSize:22,fontWeight:800,color:s.color}}>{s.val}</div>
              </div>
              <s.icon size={20} color={s.color} strokeWidth={1.5} style={{opacity:.6}}/>
            </div>
          </Card>
        ))}
      </div>

      {openShifts.length>0&&(
        <Card>
          <CB>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <AlertTriangle size={15} color={T.amber} strokeWidth={2}/>
                <span style={{fontSize:13,fontWeight:700,color:T.text}}>Open Shifts Requiring Coverage</span>
                <Pill c={T.amber}>{openShifts.length} open</Pill>
              </div>
              {isSup&&<button onClick={()=>showToast("Broadcast sent to available officers","success")} style={{fontSize:11,background:T.amber,color:"#000",border:"none",borderRadius:6,padding:"5px 12px",cursor:"pointer",fontWeight:700}}>Broadcast All</button>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {openShifts.map(s=>(
                <div key={s.id} style={{background:T.raised,borderRadius:8,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                  <Pill c={s.priority==="High"?T.red:T.amber}>{s.priority}</Pill>
                  <div style={{flex:1,minWidth:120}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.text}}>{s.site}</div>
                    <div style={{fontSize:11,color:T.textSub,marginTop:1}}>{s.day} {s.date} · {s.start}–{s.end} · {s.type} · {s.reason}</div>
                  </div>
                  {isSup&&<button onClick={()=>showToast(`Notifying available officers for ${s.site} ${s.day}`,"success")} style={{fontSize:11,background:T.accentB,color:T.accent,border:`1px solid ${T.accent}`,borderRadius:6,padding:"5px 10px",cursor:"pointer",fontWeight:700}}>Find Cover</button>}
                </div>
              ))}
            </div>
          </CB>
        </Card>
      )}

      {showForm&&(
        <Card style={{border:`1px solid ${T.accentB}`}}>
          <CB>
            <div style={{fontSize:14,fontWeight:800,color:T.text,marginBottom:14}}>{editTarget?"Edit Shift":"Create Shift"}</div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <div style={{fontSize:11,color:T.textSub,fontWeight:600,marginBottom:5}}>Officer</div>
                <select value={form.officer} onChange={handleOfficerSelect} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 10px",color:T.text,fontSize:12}}>
                  <option value="">Select officer…</option>
                  {SCHED_OFFICER_LIST.map(o=>(
                    <option key={o.badge} value={o.name}>{o.name}{!o.certOk?" [CERT EXPIRED]":""}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{fontSize:11,color:T.textSub,fontWeight:600,marginBottom:5}}>Site</div>
                <select value={form.site} onChange={e=>setForm(p=>({...p,site:e.target.value}))} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 10px",color:T.text,fontSize:12}}>
                  {SCHED_SITES.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:11,color:T.textSub,fontWeight:600,marginBottom:5}}>Day</div>
                <select value={form.day} onChange={e=>setForm(p=>({...p,day:e.target.value}))} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 10px",color:T.text,fontSize:12}}>
                  {DAYS.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:11,color:T.textSub,fontWeight:600,marginBottom:5}}>Start Time</div>
                <input type="time" value={form.start} onChange={e=>setForm(p=>({...p,start:e.target.value}))} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 10px",color:T.text,fontSize:12}}/>
              </div>
              <div>
                <div style={{fontSize:11,color:T.textSub,fontWeight:600,marginBottom:5}}>End Time</div>
                <input type="time" value={form.end} onChange={e=>setForm(p=>({...p,end:e.target.value}))} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 10px",color:T.text,fontSize:12}}/>
              </div>
              <div>
                <div style={{fontSize:11,color:T.textSub,fontWeight:600,marginBottom:5}}>Status</div>
                <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 10px",color:T.text,fontSize:12}}>
                  <option>Confirmed</option><option>Pending</option>
                </select>
              </div>
            </div>

            {form.officer&&form.start&&form.end&&(
              <div style={{marginBottom:12,padding:"9px 12px",background:T.raised,borderRadius:7,fontSize:12,color:T.textSub,display:"flex",gap:16,flexWrap:"wrap"}}>
                <span>Duration: <strong style={{color:T.text}}>{calcShiftHours(form.start,form.end)}h</strong></span>
                <span>Type: <strong style={{color:parseInt(form.start.split(":")[0],10)>=18||parseInt(form.start.split(":")[0],10)<6?T.purple:T.accent}}>{parseInt(form.start.split(":")[0],10)>=18||parseInt(form.start.split(":")[0],10)<6?"Night":"Day"}</strong></span>
                {calcShiftHours(form.start,form.end)>12&&<span style={{color:T.amber,fontWeight:700}}>OT — exceeds 12h</span>}
                {form.badge&&hasConflict(form.badge,form.day,form.start,form.end,editTarget?.id)&&<span style={{color:T.red,fontWeight:700}}>Scheduling conflict detected</span>}
              </div>
            )}

            {!formCertOk&&(
              <div style={{marginBottom:12,background:T.redGlow,border:`1px solid ${T.redB}`,borderRadius:7,padding:"10px 12px"}}>
                <div style={{fontSize:12,color:T.red,fontWeight:700,marginBottom:6}}><AlertTriangle size={12} strokeWidth={2} style={{display:"inline",marginRight:5}}/>{formOfficer?.certNote||"Officer certification expired"}</div>
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,color:T.text}}>
                  <input type="checkbox" checked={certOverride} onChange={e=>setCertOverride(e.target.checked)} style={{width:14,height:14}}/>
                  I confirm supervisor approval to deploy this officer — risk acknowledged
                </label>
              </div>
            )}

            <div style={{display:"flex",gap:8}}>
              <button onClick={handleSave} style={{background:T.accent,color:"#fff",border:"none",borderRadius:7,padding:"9px 20px",cursor:"pointer",fontWeight:700,fontSize:12}}>
                {editTarget?"Save Changes":"Create Shift"}
              </button>
              <button onClick={closeForm} style={{background:"transparent",border:`1px solid ${T.border}`,color:T.textSub,borderRadius:7,padding:"9px 14px",cursor:"pointer",fontWeight:600,fontSize:12}}>Cancel</button>
            </div>
          </CB>
        </Card>
      )}

      {deleteId&&(
        <ModalWrap onClose={()=>setDeleteId(null)}>
          <div style={{background:T.card,border:`1px solid ${T.redB}`,borderRadius:14,padding:24,maxWidth:380,width:"100%"}}>
            <div style={{fontSize:14,fontWeight:800,color:T.text,marginBottom:8}}>Delete Shift</div>
            <div style={{fontSize:13,color:T.textSub,marginBottom:20}}>This will permanently remove the shift from the schedule. This action cannot be undone.</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>handleDelete(deleteId)} style={{flex:1,background:T.red,color:"#fff",border:"none",borderRadius:7,padding:"9px",cursor:"pointer",fontWeight:700,fontSize:12}}>Delete</button>
              <button onClick={()=>setDeleteId(null)} style={{flex:1,background:"transparent",border:`1px solid ${T.border}`,color:T.textSub,borderRadius:7,padding:"9px",cursor:"pointer",fontSize:12}}>Cancel</button>
            </div>
          </div>
        </ModalWrap>
      )}

      <Card>
        <CB>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",flex:1}}>
              {["All",...DAYS].map(d=>(
                <button key={d} onClick={()=>setDayFilter(d)} style={{fontSize:11,padding:"5px 9px",borderRadius:5,border:`1px solid ${dayFilter===d?T.accent:T.border}`,background:dayFilter===d?T.accentB:"transparent",color:dayFilter===d?T.accent:T.textSub,cursor:"pointer",fontWeight:600}}>
                  {d}
                </button>
              ))}
            </div>
            <select value={siteFilter} onChange={e=>setSiteFilter(e.target.value)} style={{fontSize:12,background:T.raised,border:`1px solid ${T.border}`,color:T.text,borderRadius:6,padding:"5px 8px"}}>
              <option>All</option>
              {sites.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>

          {filtered.length===0?(
            <div style={{textAlign:"center",padding:"24px 0",color:T.textSub,fontSize:13}}>No shifts match this filter. {isSup&&"Use Add Shift to create one."}</div>
          ):(
            <div className="ss-table-wrap">
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${T.border}`}}>
                    {["Officer","Badge","Site","Day","Shift","Hrs","Type","Status","Flags",isSup?"Actions":""].filter(Boolean).map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"6px 10px",color:T.textSub,fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s,i)=>(
                    <tr key={s.id} style={{borderBottom:`1px solid ${T.border}`,background:i%2===0?"transparent":T.raised}}>
                      <td style={{padding:"9px 10px",color:s.certOk?T.text:T.red,fontWeight:600}}>{s.officer}</td>
                      <td style={{padding:"9px 10px",color:T.textSub,fontFamily:"monospace"}}>{s.badge}</td>
                      <td style={{padding:"9px 10px",color:T.textSub}}>{s.site}</td>
                      <td style={{padding:"9px 10px",color:T.text,fontWeight:600}}>{s.day}</td>
                      <td style={{padding:"9px 10px",color:T.textSub,whiteSpace:"nowrap"}}>{s.start}–{s.end}</td>
                      <td style={{padding:"9px 10px",color:s.ot?T.amber:T.text,fontWeight:s.ot?700:400}}>{s.hours}h</td>
                      <td style={{padding:"9px 10px"}}><Pill c={s.type==="Night"?T.purple:T.accent}>{s.type||"Day"}</Pill></td>
                      <td style={{padding:"9px 10px"}}><Pill c={s.status==="Confirmed"?T.green:T.amber}>{s.status}</Pill></td>
                      <td style={{padding:"9px 10px"}}>
                        <div style={{display:"flex",gap:4}}>
                          {s.ot&&<Pill c={T.amber}>OT</Pill>}
                          {!s.certOk&&<Pill c={T.red}>CERT</Pill>}
                        </div>
                      </td>
                      {isSup&&(
                        <td style={{padding:"9px 10px"}}>
                          <div style={{display:"flex",gap:4}}>
                            <button onClick={()=>openEdit(s)} style={{fontSize:10,background:T.accentB,color:T.accent,border:`1px solid ${T.accent}`,borderRadius:4,padding:"3px 7px",cursor:"pointer",fontWeight:700}}>Edit</button>
                            <button onClick={()=>setDeleteId(s.id)} style={{fontSize:10,background:T.redGlow,color:T.red,border:`1px solid ${T.redB}`,borderRadius:4,padding:"3px 7px",cursor:"pointer",fontWeight:700}}>Del</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CB>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// POST ORDERS MODULE
// ─────────────────────────────────────────────────────────────────
function PostOrdersModule({user,showToast,isMobile}){
  const[selectedSite,setSelectedSite]=useState(POST_ORDERS[0].id);
  const[openSection,setOpenSection]=useState(null);
  // Persistent acknowledgment store: {"PO-001:v3.2:S-0041": {officer,badge,date,version,poId}}
  const[acks,setAcks]=useLS("ss_post_acks",{});
  const po=POST_ORDERS.find(p=>p.id===selectedSite)||POST_ORDERS[0];
  const isOfficer=user?.role==="Officer";

  const ackKey=(poId,version,badge)=>`${poId}:${version}:${badge}`;

  const handleAck=()=>{
    const k=ackKey(po.id,po.version,user?.badge);
    if(acks[k]){showToast("You have already acknowledged the current version","info");return;}
    const entry={officer:user?.name,badge:user?.badge,date:new Date().toISOString().slice(0,10),version:po.version,poId:po.id};
    setAcks(prev=>({...prev,[k]:entry}));
    logAction(user,"POST_ORDER_ACK",`${po.site} ${po.version}`,{prevValue:null,newValue:`Acknowledged by ${user?.name}`});
    showToast(`Post order acknowledged for ${po.site} ${po.version}`,"success");
  };

  // Merge static seed acks with persisted acks for display
  const allAcks=(poId,version)=>{
    const staticA=POST_ORDERS.find(p=>p.id===poId)?.acknowledgments||[];
    const persisted=Object.values(acks).filter(a=>a.poId===poId&&a.version===version);
    const merged=[...staticA];
    persisted.forEach(p=>{if(!merged.find(a=>a.badge===p.badge&&a.version===p.version))merged.push(p);});
    return merged;
  };

  const userAcked=acks[ackKey(po.id,po.version,user?.badge)]||
    po.acknowledgments.find(a=>a.badge===user?.badge&&a.version===po.version);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SH icon={ClipboardCheck} title="Post Orders" sub="Site-specific operational instructions and standards"/>

      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {POST_ORDERS.map(p=>(
          <button key={p.id} onClick={()=>{setSelectedSite(p.id);setOpenSection(null);}} style={{fontSize:12,padding:"7px 14px",borderRadius:7,border:`1px solid ${selectedSite===p.id?T.accent:T.border}`,background:selectedSite===p.id?T.accentB:"transparent",color:selectedSite===p.id?T.accent:T.textSub,cursor:"pointer",fontWeight:700}}>
            {p.site}
          </button>
        ))}
      </div>

      <Card>
        <CB>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:16}}>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:T.text}}>{po.site}</div>
              <div style={{fontSize:12,color:T.textSub,marginTop:3}}>Version {po.version} · Updated {po.updated} · Approved by {po.approvedBy}</div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {userAcked?(
                <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:T.green,fontWeight:700}}>
                  <CheckCircle2 size={14} color={T.green} strokeWidth={2}/> Acknowledged {userAcked.date}
                </div>
              ):(
                <button onClick={handleAck} style={{fontSize:12,background:T.green,color:"#000",border:"none",borderRadius:7,padding:"7px 16px",cursor:"pointer",fontWeight:800}}>
                  Acknowledge {po.version}
                </button>
              )}
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {po.sections.map((sec,i)=>(
              <div key={i} style={{border:`1px solid ${openSection===i?T.accent:T.border}`,borderRadius:8,overflow:"hidden"}}>
                <button onClick={()=>setOpenSection(openSection===i?null:i)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:openSection===i?T.accentB:T.raised,border:"none",cursor:"pointer",color:T.text}}>
                  <span style={{fontSize:13,fontWeight:700}}>{sec.title}</span>
                  {openSection===i?<ChevronUp size={14} color={T.textSub} strokeWidth={2}/>:<ChevronDown size={14} color={T.textSub} strokeWidth={2}/>}
                </button>
                {openSection===i&&(
                  <div style={{padding:"14px 16px",background:T.surface,fontSize:13,color:T.textSub,lineHeight:1.65,whiteSpace:"pre-line"}}>
                    {sec.body}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CB>
      </Card>

      {!isOfficer&&(
        <Card>
          <CB>
            {(()=>{const list=allAcks(po.id,po.version);return(
              <>
                <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                  <Users size={14} strokeWidth={2}/> Officer Acknowledgments — {po.version}
                  <Pill c={list.length>=2?T.green:T.amber}>{list.length} acknowledged</Pill>
                </div>
                {list.length===0?(
                  <div style={{fontSize:12,color:T.textSub,padding:"8px 0"}}>No acknowledgments yet for this version.</div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {list.map((a,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:T.raised,borderRadius:7}}>
                        <CheckCircle2 size={13} color={T.green} strokeWidth={2}/>
                        <span style={{fontSize:13,fontWeight:600,color:T.text,flex:1}}>{a.officer}</span>
                        <span style={{fontSize:11,color:T.textSub,fontFamily:"monospace"}}>{a.badge}</span>
                        <span style={{fontSize:11,color:T.textSub}}>{a.date}</span>
                        <Pill c={T.green}>{a.version}</Pill>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );})()}
          </CB>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// KEY MANAGEMENT MODULE
// ─────────────────────────────────────────────────────────────────
function KeyManagement({user,showToast,isMobile}){
  const[keys,setKeys]=useLS("ss_keys",KEYS_DATA);
  const[log,setLog]=useLS("ss_key_log",KEY_LOG);
  const[siteFilter,setSiteFilter]=useState("All");
  const[activeKey,setActiveKey]=useState(null);
  const[action,setAction]=useState(null);

  const sites=["All",...new Set(KEYS_DATA.map(k=>k.site))];
  const filtered=keys.filter(k=>siteFilter==="All"||k.site===siteFilter);
  const overdue=keys.filter(k=>k.status==="Overdue");
  const checkedOut=keys.filter(k=>k.status==="Checked Out");
  const inCabinet=keys.filter(k=>k.status==="In Cabinet");

  const statusColor=(s)=>s==="Overdue"?T.red:s==="Checked Out"?T.amber:T.green;
  const typeColor=(t)=>t==="Restricted"?T.red:t==="Master"?T.purple:t==="Vehicle"?T.gold:T.accent;

  const doReturn=(k)=>{
    setKeys(prev=>prev.map(ki=>ki.id===k.id?{...ki,status:"In Cabinet",assignedTo:null,badge:null,issuedAt:null,dueBack:null}:ki));
    setLog(prev=>[{keyId:k.id,action:"Returned",officer:k.assignedTo,badge:k.badge,ts:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}),supervisor:user?.name||"Supervisor"},...prev]);
    logAction(user,"KEY_RETURNED",`${k.name} returned by ${k.assignedTo}`);
    showToast(`${k.name} marked as returned`,"success");
    setActiveKey(null);
  };

  const doIssue=(k,officer,badge)=>{
    const ts=new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
    setKeys(prev=>prev.map(ki=>ki.id===k.id?{...ki,status:"Checked Out",assignedTo:officer,badge,issuedAt:ts,dueBack:"18:00"}:ki));
    setLog(prev=>[{keyId:k.id,action:"Issued",officer,badge,ts,supervisor:user?.name||"Supervisor"},...prev]);
    logAction(user,"KEY_ISSUED",`${k.name} issued to ${officer}`);
    showToast(`${k.name} issued to ${officer}`,"success");
    setActiveKey(null);setAction(null);
  };

  const OFFICERS_LIST=["Marcus Webb / S-0041","Diana Reyes / S-0067","Theo Okafor / S-0083","Ava Simmons / S-0092","Jordan Park / S-0105","Elena Voss / S-0118"];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SH icon={Key} title="Key Management" sub="Chain of custody tracking for all physical and restricted keys"/>

      {overdue.length>0&&(
        <div style={{background:T.redGlow,border:`1px solid ${T.redB}`,borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
          <AlertTriangle size={15} color={T.red} strokeWidth={2}/>
          <span style={{fontSize:13,color:T.red,fontWeight:700}}>{overdue.length} key{overdue.length>1?"s":""} overdue: {overdue.map(k=>k.name).join(", ")} — immediate follow-up required</span>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12}}>
        {[
          {label:"Total Keys",val:keys.length,color:T.accent},
          {label:"Checked Out",val:checkedOut.length,color:T.amber},
          {label:"In Cabinet",val:inCabinet.length,color:T.green},
          {label:"Overdue",val:overdue.length,color:overdue.length>0?T.red:T.textDim},
        ].map(s=>(
          <Card key={s.label} style={{padding:"14px 16px"}}>
            <div style={{fontSize:11,color:T.textSub,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:22,fontWeight:800,color:s.color}}>{s.val}</div>
          </Card>
        ))}
      </div>

      <Card>
        <CB>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <span style={{fontSize:13,fontWeight:700,color:T.text}}>Key Inventory</span>
            <select value={siteFilter} onChange={e=>setSiteFilter(e.target.value)} style={{fontSize:12,background:T.raised,border:`1px solid ${T.border}`,color:T.text,borderRadius:6,padding:"5px 8px"}}>
              {sites.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {filtered.map(k=>(
              <div key={k.id} style={{background:k.status==="Overdue"?T.redGlow:T.raised,border:`1px solid ${k.status==="Overdue"?T.redB:T.border}`,borderRadius:8,padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:10,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:120}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:13,fontWeight:700,color:T.text}}>{k.name}</span>
                      <Pill c={typeColor(k.type)}>{k.type}</Pill>
                      <Pill c={statusColor(k.status)}>{k.status}</Pill>
                    </div>
                    <div style={{fontSize:11,color:T.textSub}}>
                      {k.keyNum} · {k.site}{k.assignedTo?` · ${k.assignedTo} (${k.badge}) · Issued ${k.issuedAt} · Due ${k.dueBack}`:" · Unassigned"} · Condition: {k.condition}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    {k.status!=="In Cabinet"&&(
                      <button onClick={()=>doReturn(k)} style={{fontSize:11,background:T.greenB,color:T.green,border:`1px solid ${T.green}`,borderRadius:6,padding:"5px 10px",cursor:"pointer",fontWeight:700}}>Return</button>
                    )}
                    {k.status==="In Cabinet"&&(
                      <button onClick={()=>{setActiveKey(k);setAction("issue");}} style={{fontSize:11,background:T.accentB,color:T.accent,border:`1px solid ${T.accent}`,borderRadius:6,padding:"5px 10px",cursor:"pointer",fontWeight:700}}>Issue</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CB>
      </Card>

      {activeKey&&action==="issue"&&(
        <ModalWrap onClose={()=>{setActiveKey(null);setAction(null);}}>
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:24,width:"100%",maxWidth:400}}>
            <div style={{fontSize:15,fontWeight:800,marginBottom:4}}>Issue Key</div>
            <div style={{fontSize:12,color:T.textSub,marginBottom:16}}>{activeKey.name} · {activeKey.keyNum}</div>
            <div style={{fontSize:12,fontWeight:600,color:T.textSub,marginBottom:6}}>Select Officer</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {OFFICERS_LIST.map(o=>{
                const[name,badge]=o.split(" / ");
                return(
                  <button key={o} onClick={()=>doIssue(activeKey,name,badge)} style={{textAlign:"left",padding:"10px 12px",background:T.raised,border:`1px solid ${T.border}`,borderRadius:7,cursor:"pointer",color:T.text,fontSize:12,fontWeight:600}}>
                    {name} <span style={{color:T.textSub,fontFamily:"monospace",fontSize:11}}>{badge}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={()=>{setActiveKey(null);setAction(null);}} style={{width:"100%",marginTop:14,padding:"9px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,color:T.textSub,cursor:"pointer",fontSize:12}}>Cancel</button>
          </div>
        </ModalWrap>
      )}

      <Card>
        <CB>
          <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:12}}>Chain of Custody Log</div>
          <div className="ss-table-wrap">
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${T.border}`}}>
                  {["Key","Action","Officer","Badge","Time","Supervisor"].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"6px 10px",color:T.textSub,fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {log.slice(0,20).map((l,i)=>{
                  const k=keys.find(ki=>ki.id===l.keyId);
                  return(
                    <tr key={i} style={{borderBottom:`1px solid ${T.border}`,background:i%2===0?"transparent":T.raised}}>
                      <td style={{padding:"8px 10px",color:T.text,fontWeight:600,fontSize:11}}>{k?.name||l.keyId}</td>
                      <td style={{padding:"8px 10px"}}><Pill c={l.action==="Returned"?T.green:l.action==="Issued"?T.amber:T.textDim}>{l.action}</Pill></td>
                      <td style={{padding:"8px 10px",color:T.textSub}}>{l.officer}</td>
                      <td style={{padding:"8px 10px",color:T.textSub,fontFamily:"monospace"}}>{l.badge}</td>
                      <td style={{padding:"8px 10px",color:T.textSub,whiteSpace:"nowrap"}}>{l.ts}</td>
                      <td style={{padding:"8px 10px",color:T.textSub}}>{l.supervisor}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CB>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// CORRECTIVE ACTIONS MODULE
// ─────────────────────────────────────────────────────────────────
function CorrectiveActions({user,showToast,isMobile}){
  const[cas,setCas]=useLS("ss_corrective",CORRECTIVE_ACTIONS_DATA);
  const[showForm,setShowForm]=useState(false);
  const[expandedId,setExpandedId]=useState(null);
  const[form,setForm]=useState({officer:"",badge:"",type:"Coaching Note",category:"Attendance",description:"",hrReview:"Not Required"});

  const isOfficer=user?.role==="Officer";
  const pending=cas.filter(c=>c.status==="Pending Acknowledgment");
  const acked=cas.filter(c=>c.status==="Acknowledged");

  const typeColor=(t)=>{
    if(t==="Coaching Note")return T.accent;
    if(t==="Verbal Warning")return T.amber;
    if(t==="Written Warning")return T.red;
    if(t==="Final Written Warning")return T.red;
    if(t==="Suspension")return T.purple;
    return T.red;
  };

  const handleAck=(ca)=>{
    if(ca.officer!==user?.name&&!["Company Admin","Supervisor"].includes(user?.role)){
      showToast("You can only acknowledge your own corrective actions","error");return;
    }
    setCas(prev=>prev.map(c=>c.id===ca.id?{...c,status:"Acknowledged",acknowledgedAt:new Date().toISOString().slice(0,10)}:c));
    logAction(user,"CA_ACKNOWLEDGED",`${ca.id} — ${ca.type} for ${ca.officer}`);
    showToast(`${ca.id} acknowledged`,"success");
  };

  const handleCreate=()=>{
    if(!form.officer||!form.description){showToast("Officer and description are required","error");return;}
    const id=`CA-${String(cas.length+1).padStart(3,"0")}`;
    const entry={...form,id,date:new Date().toISOString().slice(0,10),supervisor:user?.name||"Supervisor",status:"Pending Acknowledgment",linkedIncident:null,escalation:null};
    setCas(prev=>[entry,...prev]);
    logAction(user,"CA_CREATED",`${id} — ${form.type} for ${form.officer}`);
    showToast(`${id} created for ${form.officer}`,"success");
    setShowForm(false);setForm({officer:"",badge:"",type:"Coaching Note",category:"Attendance",description:"",hrReview:"Not Required"});
  };

  const caList=isOfficer?cas.filter(c=>c.officer===user?.name):cas;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SH icon={UserX} title="Corrective Actions" sub="Performance management and disciplinary record"/>

      {!isOfficer&&(
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12}}>
          {[
            {label:"Total Records",val:cas.length,color:T.accent},
            {label:"Pending Ack.",val:pending.length,color:pending.length>0?T.amber:T.textDim},
            {label:"Acknowledged",val:acked.length,color:T.green},
            {label:"HR Review Req.",val:cas.filter(c=>c.hrReview==="Required").length,color:T.red},
          ].map(s=>(
            <Card key={s.label} style={{padding:"14px 16px"}}>
              <div style={{fontSize:11,color:T.textSub,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>{s.label}</div>
              <div style={{fontSize:22,fontWeight:800,color:s.color}}>{s.val}</div>
            </Card>
          ))}
        </div>
      )}

      {!isOfficer&&(
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <button onClick={()=>setShowForm(!showForm)} style={{fontSize:12,background:showForm?T.raised:T.accent,color:showForm?T.textSub:"#fff",border:`1px solid ${showForm?T.border:T.accent}`,borderRadius:7,padding:"8px 16px",cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
            <Plus size={13} strokeWidth={2.5}/>{showForm?"Cancel":"New Corrective Action"}
          </button>
        </div>
      )}

      {showForm&&(
        <Card>
          <CB>
            <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14}}>New Corrective Action</div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <div style={{fontSize:11,color:T.textSub,fontWeight:600,marginBottom:5}}>Officer Name</div>
                <input value={form.officer} onChange={e=>setForm(p=>({...p,officer:e.target.value}))} placeholder="Full name" style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 10px",color:T.text,fontSize:12}}/>
              </div>
              <div>
                <div style={{fontSize:11,color:T.textSub,fontWeight:600,marginBottom:5}}>Badge Number</div>
                <input value={form.badge} onChange={e=>setForm(p=>({...p,badge:e.target.value}))} placeholder="S-XXXX" style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 10px",color:T.text,fontSize:12}}/>
              </div>
              <div>
                <div style={{fontSize:11,color:T.textSub,fontWeight:600,marginBottom:5}}>Action Type</div>
                <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 10px",color:T.text,fontSize:12}}>
                  {CA_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:11,color:T.textSub,fontWeight:600,marginBottom:5}}>Category</div>
                <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 10px",color:T.text,fontSize:12}}>
                  {CA_CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:11,color:T.textSub,fontWeight:600,marginBottom:5}}>HR Review</div>
                <select value={form.hrReview} onChange={e=>setForm(p=>({...p,hrReview:e.target.value}))} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 10px",color:T.text,fontSize:12}}>
                  <option>Not Required</option><option>Required</option>
                </select>
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:T.textSub,fontWeight:600,marginBottom:5}}>Description</div>
              <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={4} placeholder="Describe the corrective action in detail..." style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 10px",color:T.text,fontSize:12,resize:"vertical"}}/>
            </div>
            <button onClick={handleCreate} style={{background:T.accent,color:"#fff",border:"none",borderRadius:7,padding:"9px 20px",cursor:"pointer",fontWeight:700,fontSize:12}}>
              Create Corrective Action
            </button>
          </CB>
        </Card>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {caList.length===0&&<div style={{fontSize:13,color:T.textSub,padding:"16px 0",textAlign:"center"}}>No corrective actions on record.</div>}
        {caList.map(ca=>(
          <Card key={ca.id} style={{border:`1px solid ${ca.status==="Pending Acknowledgment"?T.amberB:T.border}`}}>
            <CB>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                <div style={{flex:1,minWidth:180}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                    <span style={{fontSize:11,color:T.textSub,fontFamily:"monospace",fontWeight:700}}>{ca.id}</span>
                    <Pill c={typeColor(ca.type)}>{ca.type}</Pill>
                    <Pill c={T.accent}>{ca.category}</Pill>
                    <Pill c={ca.status==="Acknowledged"?T.green:T.amber}>{ca.status}</Pill>
                    {ca.hrReview==="Required"&&<Pill c={T.red}>HR Review</Pill>}
                  </div>
                  <div style={{fontSize:13,fontWeight:700,color:T.text}}>{ca.officer} <span style={{color:T.textSub,fontFamily:"monospace",fontSize:11,fontWeight:400}}>{ca.badge}</span></div>
                  <div style={{fontSize:11,color:T.textSub,marginTop:2}}>Issued {ca.date} by {ca.supervisor}</div>
                  {expandedId===ca.id&&(
                    <div style={{marginTop:10,fontSize:12,color:T.textSub,lineHeight:1.65,background:T.raised,borderRadius:7,padding:"10px 12px"}}>
                      {ca.description}
                      {ca.status==="Acknowledged"&&ca.acknowledgedAt&&(
                        <div style={{marginTop:8,color:T.green,fontWeight:700,fontSize:11}}>Acknowledged: {ca.acknowledgedAt}</div>
                      )}
                    </div>
                  )}
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <button onClick={()=>setExpandedId(expandedId===ca.id?null:ca.id)} style={{fontSize:11,background:T.raised,border:`1px solid ${T.border}`,color:T.textSub,borderRadius:6,padding:"5px 10px",cursor:"pointer",fontWeight:600}}>
                    {expandedId===ca.id?"Collapse":"View"}
                  </button>
                  {ca.status==="Pending Acknowledgment"&&(
                    <button onClick={()=>handleAck(ca)} style={{fontSize:11,background:T.green,color:"#000",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontWeight:700}}>
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            </CB>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SHIFT HANDOVER MODULE
// ─────────────────────────────────────────────────────────────────
const HO_ITEM_TYPES=["incident","patrol","compliance","fleet","key","note","equipment","personnel"];
const HO_PRIORITIES=["critical","high","medium","low"];

function ShiftHandover({user,showToast,isMobile}){
  const[records,setRecords]=useLS("ss_handover",HANDOVER_RECORDS);
  const[resolvedItems,setResolvedItems]=useLS("ss_handover_resolved",{});
  const[activeId,setActiveId]=useState(()=>{
    const r=LS.get("ss_handover",HANDOVER_RECORDS);
    return r.find(x=>x.status!=="Complete")?.id||r[0]?.id||null;
  });
  const[showHistory,setShowHistory]=useState(false);
  const[showCreate,setShowCreate]=useState(false);
  const[showAddItem,setShowAddItem]=useState(false);

  const EMPTY_HO={outShift:"Day 06:00–18:00",outSup:user?.name||"",outTime:"17:55",inShift:"Night 18:00–06:00",inSup:"",notes:""};
  const EMPTY_ITEM={type:"incident",priority:"high",text:""};
  const[hoForm,setHoForm]=useState(EMPTY_HO);
  const[itemForm,setItemForm]=useState(EMPTY_ITEM);
  const[hoItems,setHoItems]=useState([]);

  const active=records.find(r=>r.id===activeId);
  const history=records.filter(r=>r.status==="Complete");
  const isSup=["Company Admin","Supervisor"].includes(user?.role);

  const priorityColor=(p)=>p==="critical"?T.red:p==="high"?T.amber:p==="medium"?T.accent:T.textDim;
  const typeIcon=(t)=>{
    if(t==="incident")return ShieldAlert;
    if(t==="patrol")return MapPin;
    if(t==="compliance")return ClipboardCheck;
    if(t==="fleet")return Car;
    if(t==="key")return Key;
    return FileText;
  };

  const handleSignOff=()=>{
    const ts=new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
    setRecords(prev=>prev.map(r=>r.id===activeId?{...r,incoming:{...r.incoming,acknowledgedAt:ts},status:"Complete"}:r));
    logAction(user,"HANDOVER_SIGNED",`HO ${activeId} signed off`,{prevValue:"Pending Incoming Sign-Off",newValue:"Complete"});
    showToast("Shift handover signed off — all items transferred to incoming shift","success");
  };

  const toggleItemResolved=(itemId)=>{
    const wasResolved=resolvedItems[itemId]||false;
    setResolvedItems(prev=>({...prev,[itemId]:!wasResolved}));
    logAction(user,"HANDOVER_ITEM_RESOLVED",`Item ${itemId}`,{prevValue:wasResolved?"Resolved":"Open",newValue:wasResolved?"Open":"Resolved"});
  };

  const handleCreateHandover=()=>{
    if(!hoForm.outSup||!hoForm.inSup){showToast("Both supervisors required","error");return;}
    const id=`HO-U${Date.now().toString(36).toUpperCase()}`;
    const date=new Date().toISOString().slice(0,10);
    const newHO={
      id,date,
      outgoing:{shift:hoForm.outShift,supervisor:hoForm.outSup,signedAt:hoForm.outTime},
      incoming:{shift:hoForm.inShift,supervisor:hoForm.inSup,acknowledgedAt:null},
      status:"Pending Incoming Sign-Off",
      items:hoItems.map((it,i)=>({...it,id:`${id}-I${i}`,resolved:false})),
      notes:hoForm.notes,
    };
    setRecords(prev=>[newHO,...prev]);
    setActiveId(id);
    logAction(user,"HANDOVER_CREATED",`${hoForm.outSup} → ${hoForm.inSup} on ${date}`,{prevValue:null,newValue:id});
    showToast(`Handover ${id} created`,"success");
    setShowCreate(false);setHoForm(EMPTY_HO);setHoItems([]);setShowHistory(false);
  };

  const addItem=()=>{
    if(!itemForm.text.trim()){showToast("Item description required","error");return;}
    setHoItems(p=>[...p,{...itemForm,id:`tmp-${Date.now()}`}]);
    setItemForm(EMPTY_ITEM);setShowAddItem(false);
  };

  const renderItems=(items,color,bg,border)=>(
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {items.map(item=>{
        const IIcon=typeIcon(item.type);
        const isRes=resolvedItems[item.id]||item.resolved;
        return(
          <div key={item.id} style={{background:bg,border:`1px solid ${border}`,borderRadius:8,padding:"12px 14px",display:"flex",gap:10,alignItems:"flex-start",opacity:isRes?0.6:1}}>
            <IIcon size={14} color={isRes?T.textDim:color} strokeWidth={2} style={{marginTop:2,flexShrink:0}}/>
            <div style={{flex:1,fontSize:12,color:isRes?T.textSub:T.text,lineHeight:1.6,textDecoration:isRes?"line-through":"none"}}>{item.text}</div>
            {isSup&&!item.resolved&&(
              <button onClick={()=>toggleItemResolved(item.id)} style={{fontSize:10,background:isRes?T.greenB:T.raised,color:isRes?T.green:T.textSub,border:`1px solid ${isRes?T.green:T.border}`,borderRadius:5,padding:"4px 8px",cursor:"pointer",fontWeight:700,flexShrink:0,whiteSpace:"nowrap"}}>
                {isRes?"Resolved":"Mark Resolved"}
              </button>
            )}
            {item.resolved&&<Pill c={T.green}>Resolved</Pill>}
          </div>
        );
      })}
    </div>
  );

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <SH icon={ArrowLeftRight} title="Shift Handover" sub="Digital pass-down — open items, status transfer, supervisor sign-off"/>
        {isSup&&(
          <button onClick={()=>{setShowCreate(true);setShowHistory(false);}} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,background:T.accent,color:"#fff",border:"none",borderRadius:7,padding:"8px 16px",cursor:"pointer",fontWeight:700,flexShrink:0}}>
            <Plus size={13} strokeWidth={2.5}/> New Handover
          </button>
        )}
      </div>

      <div style={{display:"flex",gap:8,borderBottom:`1px solid ${T.border}`,paddingBottom:12,flexWrap:"wrap"}}>
        {[
          {label:"Active Handover",val:false},
          {label:`History (${history.length})`,val:true},
        ].map(t=>(
          <button key={t.label} onClick={()=>{setShowHistory(t.val);setShowCreate(false);}} style={{fontSize:12,padding:"6px 14px",borderRadius:6,border:`1px solid ${showHistory===t.val&&!showCreate?T.accent:T.border}`,background:showHistory===t.val&&!showCreate?T.accentB:"transparent",color:showHistory===t.val&&!showCreate?T.accent:T.textSub,cursor:"pointer",fontWeight:700}}>
            {t.label}
          </button>
        ))}
      </div>

      {showCreate&&(
        <Card style={{border:`1px solid ${T.accentB}`}}>
          <CB>
            <div style={{fontSize:14,fontWeight:800,color:T.text,marginBottom:14}}>Create Shift Handover</div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <div style={{fontSize:11,color:T.textSub,fontWeight:600,marginBottom:5}}>Outgoing Shift</div>
                <input value={hoForm.outShift} onChange={e=>setHoForm(p=>({...p,outShift:e.target.value}))} placeholder="e.g. Day 06:00–18:00" style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 10px",color:T.text,fontSize:12}}/>
              </div>
              <div>
                <div style={{fontSize:11,color:T.textSub,fontWeight:600,marginBottom:5}}>Outgoing Supervisor</div>
                <input value={hoForm.outSup} onChange={e=>setHoForm(p=>({...p,outSup:e.target.value}))} placeholder="Name" style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 10px",color:T.text,fontSize:12}}/>
              </div>
              <div>
                <div style={{fontSize:11,color:T.textSub,fontWeight:600,marginBottom:5}}>Outgoing Sign Time</div>
                <input type="time" value={hoForm.outTime} onChange={e=>setHoForm(p=>({...p,outTime:e.target.value}))} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 10px",color:T.text,fontSize:12}}/>
              </div>
              <div>
                <div style={{fontSize:11,color:T.textSub,fontWeight:600,marginBottom:5}}>Incoming Shift</div>
                <input value={hoForm.inShift} onChange={e=>setHoForm(p=>({...p,inShift:e.target.value}))} placeholder="e.g. Night 18:00–06:00" style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 10px",color:T.text,fontSize:12}}/>
              </div>
              <div>
                <div style={{fontSize:11,color:T.textSub,fontWeight:600,marginBottom:5}}>Incoming Supervisor</div>
                <input value={hoForm.inSup} onChange={e=>setHoForm(p=>({...p,inSup:e.target.value}))} placeholder="Name" style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 10px",color:T.text,fontSize:12}}/>
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:T.textSub,fontWeight:600,marginBottom:5}}>Supervisor Notes</div>
              <textarea value={hoForm.notes} onChange={e=>setHoForm(p=>({...p,notes:e.target.value}))} rows={3} placeholder="Briefing notes for incoming supervisor…" style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 10px",color:T.text,fontSize:12,resize:"vertical"}}/>
            </div>

            <div style={{marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:12,fontWeight:700,color:T.text}}>Pass-Down Items ({hoItems.length})</div>
                <button onClick={()=>setShowAddItem(!showAddItem)} style={{fontSize:11,background:T.raised,border:`1px solid ${T.border}`,color:T.textSub,borderRadius:6,padding:"4px 10px",cursor:"pointer",fontWeight:600}}>
                  {showAddItem?"Cancel":"Add Item"}
                </button>
              </div>
              {showAddItem&&(
                <div style={{background:T.raised,borderRadius:8,padding:"12px",marginBottom:8,display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:8}}>
                  <div>
                    <div style={{fontSize:10,color:T.textSub,fontWeight:600,marginBottom:4}}>Type</div>
                    <select value={itemForm.type} onChange={e=>setItemForm(p=>({...p,type:e.target.value}))} style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:5,padding:"6px 8px",color:T.text,fontSize:11}}>
                      {HO_ITEM_TYPES.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:T.textSub,fontWeight:600,marginBottom:4}}>Priority</div>
                    <select value={itemForm.priority} onChange={e=>setItemForm(p=>({...p,priority:e.target.value}))} style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:5,padding:"6px 8px",color:T.text,fontSize:11}}>
                      {HO_PRIORITIES.map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:T.textSub,fontWeight:600,marginBottom:4}}>Description</div>
                    <input value={itemForm.text} onChange={e=>setItemForm(p=>({...p,text:e.target.value}))} placeholder="Describe the item…" style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:5,padding:"6px 8px",color:T.text,fontSize:11}}/>
                  </div>
                  <button onClick={addItem} style={{gridColumn:isMobile?"auto":"3",background:T.accent,color:"#fff",border:"none",borderRadius:6,padding:"6px 12px",cursor:"pointer",fontWeight:700,fontSize:11,alignSelf:"end"}}>Add</button>
                </div>
              )}
              {hoItems.length>0&&(
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {hoItems.map((it,i)=>(
                    <div key={it.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:T.raised,borderRadius:6}}>
                      <Pill c={priorityColor(it.priority)}>{it.priority}</Pill>
                      <Pill c={T.accent}>{it.type}</Pill>
                      <span style={{flex:1,fontSize:11,color:T.text}}>{it.text}</span>
                      <button onClick={()=>setHoItems(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:11,fontWeight:700,padding:"2px 6px"}}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{display:"flex",gap:8}}>
              <button onClick={handleCreateHandover} style={{background:T.accent,color:"#fff",border:"none",borderRadius:7,padding:"9px 20px",cursor:"pointer",fontWeight:700,fontSize:12}}>Create Handover</button>
              <button onClick={()=>{setShowCreate(false);setHoItems([]);}} style={{background:"transparent",border:`1px solid ${T.border}`,color:T.textSub,borderRadius:7,padding:"9px 14px",cursor:"pointer",fontSize:12}}>Cancel</button>
            </div>
          </CB>
        </Card>
      )}

      {!showHistory&&!showCreate&&active&&(
        <>
          <Card style={{border:`1px solid ${active.status==="Pending Incoming Sign-Off"?T.amberB:T.border}`}}>
            <CB>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <span style={{fontSize:15,fontWeight:800,color:T.text}}>Handover — {active.date}</span>
                    <Pill c={active.status==="Complete"?T.green:T.amber}>{active.status}</Pill>
                    <span style={{fontSize:10,color:T.textDim,fontFamily:"monospace"}}>{active.id}</span>
                  </div>
                  <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
                    <div>
                      <div style={{fontSize:10,color:T.textSub,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:2}}>Outgoing</div>
                      <div style={{fontSize:12,color:T.text,fontWeight:600}}>{active.outgoing.supervisor}</div>
                      <div style={{fontSize:11,color:T.textSub}}>{active.outgoing.shift} · Signed {active.outgoing.signedAt}</div>
                    </div>
                    <div style={{color:T.border,fontSize:18,alignSelf:"center"}}>→</div>
                    <div>
                      <div style={{fontSize:10,color:T.textSub,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:2}}>Incoming</div>
                      <div style={{fontSize:12,color:T.text,fontWeight:600}}>{active.incoming.supervisor}</div>
                      <div style={{fontSize:11,color:active.incoming.acknowledgedAt?T.green:T.amber}}>
                        {active.incoming.shift} · {active.incoming.acknowledgedAt?`Acknowledged ${active.incoming.acknowledgedAt}`:"Awaiting sign-off"}
                      </div>
                    </div>
                  </div>
                </div>
                {isSup&&active.status==="Pending Incoming Sign-Off"&&(
                  <button onClick={handleSignOff} style={{background:T.green,color:"#000",border:"none",borderRadius:8,padding:"10px 18px",cursor:"pointer",fontWeight:800,fontSize:13,display:"flex",alignItems:"center",gap:7}}>
                    <CheckCircle2 size={15} strokeWidth={2.5}/> Sign Off
                  </button>
                )}
              </div>
              {active.notes&&(
                <div style={{marginTop:14,background:T.raised,borderRadius:8,padding:"10px 14px",borderLeft:`3px solid ${T.amber}`}}>
                  <div style={{fontSize:10,color:T.amber,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>Supervisor Notes</div>
                  <div style={{fontSize:12,color:T.textSub,lineHeight:1.6}}>{active.notes}</div>
                </div>
              )}
            </CB>
          </Card>

          {(()=>{
            const critical=active.items.filter(i=>i.priority==="critical");
            const high=active.items.filter(i=>i.priority==="high");
            const other=active.items.filter(i=>i.priority!=="critical"&&i.priority!=="high");
            return(<>
              {critical.length>0&&(<div><div style={{fontSize:11,color:T.red,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8,display:"flex",alignItems:"center",gap:6}}><AlertTriangle size={13} strokeWidth={2}/> Critical ({critical.length})</div>{renderItems(critical,T.red,T.redGlow,T.redB)}</div>)}
              {high.length>0&&(<div style={{marginTop:high.length&&critical.length?8:0}}><div style={{fontSize:11,color:T.amber,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8,display:"flex",alignItems:"center",gap:6}}><AlertTriangle size={13} strokeWidth={2}/> High Priority ({high.length})</div>{renderItems(high,T.amber,T.amberGlow,T.amberB)}</div>)}
              {other.length>0&&(<div style={{marginTop:other.length&&(high.length||critical.length)?8:0}}><div style={{fontSize:11,color:T.textSub,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Other Items ({other.length})</div>{renderItems(other,T.accent,T.raised,T.border)}</div>)}
              {active.items.length===0&&<div style={{textAlign:"center",padding:"16px 0",color:T.textSub,fontSize:13}}>No pass-down items. Use New Handover to add items.</div>}
            </>);
          })()}
        </>
      )}

      {!showHistory&&!showCreate&&!active&&(
        <div style={{textAlign:"center",padding:"32px 0",color:T.textSub}}>
          <ArrowLeftRight size={32} color={T.textDim} strokeWidth={1.5} style={{display:"block",margin:"0 auto 12px"}}/>
          <div style={{fontSize:14,fontWeight:700,marginBottom:6}}>No active handover</div>
          <div style={{fontSize:12}}>All handovers have been completed. Create a new one for the next shift.</div>
        </div>
      )}

      {showHistory&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {history.length===0&&<div style={{fontSize:13,color:T.textSub,textAlign:"center",padding:"16px 0"}}>No completed handovers in history.</div>}
          {history.map(r=>(
            <Card key={r.id}>
              <CB>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:13,fontWeight:700,color:T.text}}>Handover — {r.date}</span>
                      <Pill c={T.green}>Complete</Pill>
                    </div>
                    <div style={{fontSize:11,color:T.textSub}}>{r.outgoing.supervisor} → {r.incoming.supervisor} · Acknowledged {r.incoming.acknowledgedAt}</div>
                  </div>
                  <div style={{fontSize:11,color:T.textSub}}>{r.items.filter(i=>i.resolved||resolvedItems[i.id]).length}/{r.items.length} items resolved</div>
                </div>
                {r.notes&&<div style={{marginTop:8,fontSize:11,color:T.textSub,lineHeight:1.6,borderTop:`1px solid ${T.border}`,paddingTop:8}}>{r.notes}</div>}
                {r.items.length>0&&(
                  <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:4}}>
                    {r.items.map((it,i)=>{
                      const IIcon=typeIcon(it.type);
                      const isRes=it.resolved||resolvedItems[it.id];
                      return(
                        <div key={i} style={{display:"flex",gap:8,alignItems:"center",opacity:isRes?0.5:1}}>
                          <IIcon size={11} color={priorityColor(it.priority)} strokeWidth={2} style={{flexShrink:0}}/>
                          <span style={{fontSize:11,color:isRes?T.textDim:T.textSub,textDecoration:isRes?"line-through":"none"}}>{it.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CB>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// REPORTS MODULE
// ─────────────────────────────────────────────────────────────────
function Reports({isMobile}){
  const[mode,setMode]=useState("rules");
  const[rtype,setRtype]=useState(REPORT_TYPES[0]);
  const[tier,setTier]=useState("supervisor");
  const[loading,setLoading]=useState(false);
  const[report,setReport]=useState("");
  const[history,setHistory]=useState(REPORT_HISTORY);
  const[hostedUrl,setHostedUrl]=useState("");

  const generate=async()=>{
    setLoading(true);setReport("");
    let text="";
    try{
      if(mode==="rules"){
        text=buildNarrative(rtype,tier);
      }else if(mode==="hosted"){
        if(!hostedUrl.trim())throw new Error("No Private AI endpoint configured. Enter the URL above.");
        const res=await fetch(hostedUrl.trim(),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:`Generate a ${rtype} (${tier} audience). Ops data: ${_opsSnapshot().active.length}/${OFFICERS.length} officers, patrol ${_opsSnapshot().patrolPct}%, ${_opsSnapshot().openInc.length} open incidents, risk score ${_opsSnapshot().riskScore}/10.`,tier,type:rtype}),signal:AbortSignal.timeout(30000)});
        if(!res.ok)throw new Error(`Endpoint returned ${res.status}`);
        const data=await res.json();
        text=data.text||data.content||data.response||data.choices?.[0]?.message?.content||JSON.stringify(data);
      }else{
        const snap=_opsSnapshot();
        text=await callAI(
          [{role:"user",content:`Generate a professional ${rtype} for the ${tier} audience.\n\nCurrent operations: ${snap.active.length}/${OFFICERS.length} officers active across ${SITES.length} sites. Open incidents: ${snap.openInc.map(i=>`${i.id} ${i.type} at ${i.site} (${i.sev})`).join(", ")||"None"}. Patrol: ${snap.patrolPct}% (${snap.completedCPs}/${snap.totalCPs} checkpoints). Risk score ${snap.riskScore}/10 (${snap.riskLabel}). Fleet: ${snap.deployed} deployed, ${snap.available} available, ${snap.maintenance} maintenance. Compliance gaps: ${snap.expired.map(t=>`${t.officer} — ${t.cert} expired`).join("; ")||"None"}.\n\nAudience: ${tier} — ${REPORT_TIERS.find(t=>t.id===tier)?.desc}. Be specific, structured, and professional.`}],
          "You are ShieldSync Reporting Intelligence. Generate professional security operations reports. Use clear section headers. Be specific with data provided.",
          1200
        );
      }
      if(!text)text="No content received.";
    }catch(e){
      if(mode==="rules"){text="Error: "+e.message;}
      else{text=buildNarrative(rtype,tier);}
    }
    setReport(text);
    const now=new Date();
    const modeBadge=mode==="rules"?"Rules":mode==="hosted"?"Private AI":"Cloud AI";
    setHistory(h=>[{id:`RPT-${String(h.length+43).padStart(4,"0")}`,type:rtype,tier,mode:modeBadge,date:now.toISOString().slice(0,10),time:now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:false}),pages:Math.max(1,Math.ceil(text.length/600)),status:"Generated"},...h.slice(0,9)]);
    setLoading(false);
  };

  const printReport=()=>{
    const safe=report.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const tierLabel=REPORT_TIERS.find(t=>t.id===tier)?.label||tier;
    const html=`<!DOCTYPE html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';"><title>ShieldSync — ${rtype}</title><style>body{font-family:'Courier New',monospace;padding:40px;white-space:pre-wrap;font-size:12px;line-height:1.8;color:#111;}h1{font-size:10px;font-family:sans-serif;color:#555;margin-bottom:4px;}@media print{body{padding:20px;}}</style></head><body><h1>ShieldSync Protect · ${rtype} · ${tierLabel} · ${new Date().toLocaleDateString()}</h1><pre>${safe}</pre></body></html>`;
    const url=URL.createObjectURL(new Blob([html],{type:"text/html"}));
    const w=window.open(url,"_blank");
    w?.addEventListener("load",()=>{w.print();URL.revokeObjectURL(url);},{once:true});
  };

  const exportTxt=()=>{
    const url=URL.createObjectURL(new Blob([report],{type:"text/plain"}));
    const a=document.createElement("a");a.href=url;a.download=`${rtype.replace(/ /g,"_")}_${tier}_${new Date().toISOString().slice(0,10)}.txt`;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),150);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:10}}>
        {[[FileText,"Report Types",REPORT_TYPES.length,T.accent],[BarChart3,"This Week",history.length,T.green],[Shield,"Audience Tiers",REPORT_TIERS.length,T.purple],[ShieldCheck,"AI Required","No",T.green]].map(([Icon,l,v,c])=>(
          <Card key={l} glow={c}>
            <CB style={{padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div><div style={{fontSize:22,fontWeight:900,color:c,lineHeight:1}}>{v}</div><div style={{fontSize:10,color:T.textSub,marginTop:4}}>{l}</div></div>
                <Icon size={16} color={c} strokeWidth={1.5} style={{opacity:0.45}}/>
              </div>
            </CB>
          </Card>
        ))}
      </div>

      <Card glow={T.green}>
        <CB>
          <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <ShieldCheck size={20} color={T.green} strokeWidth={1.5} style={{flexShrink:0}}/>
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontSize:12,fontWeight:800,color:T.green,marginBottom:2}}>Privacy-First Reporting Intelligence</div>
              <div style={{fontSize:11,color:T.textSub}}>Rules-Based mode generates all reports on-device · No data ever sent to external providers · Government, healthcare, and enterprise ready</div>
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {[["OFFLINE","green"],["HIPAA","purple"],["FedRAMP","accent"],["SOC 2","gold"]].map(([l,c])=>(
                <span key={l} style={{fontSize:9,fontWeight:800,color:T[c],background:`${T[c]}18`,padding:"3px 8px",borderRadius:4,letterSpacing:"0.05em"}}>{l}</span>
              ))}
            </div>
          </div>
        </CB>
      </Card>

      <Card>
        <CB>
          <SH title="Reporting Intelligence Platform" sub="Select operating mode"/>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?1:3},1fr)`,gap:8,marginBottom:mode==="hosted"?12:0}}>
            {Object.values(REPORT_MODES).map(m=>{
              const MIcon=m.icon;
              const active=mode===m.id;
              return(
                <button key={m.id} onClick={()=>setMode(m.id)} style={{background:active?`${m.color}12`:T.raised,border:`1px solid ${active?m.color:T.border}`,borderRadius:12,padding:"14px 16px",cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <MIcon size={16} color={active?m.color:T.textSub} strokeWidth={1.5}/>
                    <span style={{fontSize:12,fontWeight:800,color:active?m.color:T.text}}>{m.label}</span>
                    <span style={{marginLeft:"auto",fontSize:8,fontWeight:800,color:active?m.color:T.textDim,background:active?`${m.color}20`:"none",padding:"2px 6px",borderRadius:3,letterSpacing:"0.06em"}}>{m.badge}</span>
                  </div>
                  <div style={{fontSize:10,color:T.textSub,lineHeight:1.5}}>{m.desc}</div>
                </button>
              );
            })}
          </div>
          {mode==="hosted"&&(
            <div style={{marginTop:12}}>
              <div style={{fontSize:10,color:T.textSub,marginBottom:6,letterSpacing:"0.08em",textTransform:"uppercase"}}>Private AI Endpoint URL</div>
              <input value={hostedUrl} onChange={e=>setHostedUrl(e.target.value)} placeholder="http://your-server/api/generate" style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",color:T.text,fontSize:12,outline:"none",boxSizing:"border-box"}}/>
              <div style={{fontSize:10,color:T.textDim,marginTop:4}}>Compatible with Ollama, llama.cpp, LM Studio, vLLM, and any OpenAI-compatible endpoint.</div>
            </div>
          )}
        </CB>
      </Card>

      <Card>
        <CB>
          <SH title="Report Type" sub={`${REPORT_TYPES.length} templates available`}/>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
            {REPORT_TYPES.map(t=>(
              <button key={t} onClick={()=>setRtype(t)} style={{background:rtype===t?T.accentGlow:T.raised,border:`1px solid ${rtype===t?T.accentB:T.border}`,color:rtype===t?T.accent:T.textSub,padding:"7px 13px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:700,transition:"all 0.15s"}}>{t}</button>
            ))}
          </div>
          <SH title="Audience Tier" sub="Controls report depth and language"/>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:6,marginBottom:16}}>
            {REPORT_TIERS.map(t=>(
              <button key={t.id} onClick={()=>setTier(t.id)} style={{background:tier===t.id?`${T.accent}15`:T.raised,border:`1px solid ${tier===t.id?T.accent:T.border}`,borderRadius:9,padding:"10px 10px",cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
                <div style={{fontSize:11,fontWeight:800,color:tier===t.id?T.accent:T.text,marginBottom:3}}>{t.label}</div>
                <div style={{fontSize:9,color:T.textSub,lineHeight:1.4}}>{t.desc}</div>
              </button>
            ))}
          </div>
          <button onClick={generate} disabled={loading} style={{width:"100%",background:loading?T.raised:`linear-gradient(135deg,${REPORT_MODES[mode].color},${mode==="rules"?"#16a34a":mode==="hosted"?"#6d28d9":T.accentH})`,border:loading?`1px solid ${T.border}`:"none",color:loading?T.textSub:"#fff",padding:"14px",borderRadius:12,cursor:loading?"not-allowed":"pointer",fontWeight:800,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.2s"}}>
            {loading&&<Cpu size={14} strokeWidth={2}/>}
            {loading?`Generating ${rtype}…`:`Generate ${rtype} — ${REPORT_TIERS.find(t=>t.id===tier)?.label}`}
          </button>
          {report&&(
            <div style={{marginTop:16}}>
              <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                <button onClick={printReport} style={{background:T.greenGlow,border:`1px solid ${T.greenB}`,color:T.green,padding:"8px 14px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",gap:6}}><Printer size={12} strokeWidth={2}/>Print / PDF</button>
                <button onClick={exportTxt} style={{background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,padding:"8px 14px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",gap:6}}><ArrowDownToLine size={12} strokeWidth={2}/>Export .txt</button>
                <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:10,color:T.textDim}}>{REPORT_MODES[mode].label}</span>
                  <span style={{fontSize:9,fontWeight:800,color:REPORT_MODES[mode].color,background:`${REPORT_MODES[mode].color}18`,padding:"2px 7px",borderRadius:4}}>{REPORT_MODES[mode].badge}</span>
                </div>
              </div>
              <div style={{background:T.raised,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px 22px",maxHeight:520,overflowY:"auto"}}>
                <pre style={{margin:0,fontSize:12.5,color:T.text,whiteSpace:"pre-wrap",lineHeight:1.8,fontFamily:"'JetBrains Mono',monospace"}}>{report}</pre>
              </div>
            </div>
          )}
        </CB>
      </Card>

      <Card>
        <CB>
          <SH title="Report History" sub="Last 10 generated"/>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {history.map(r=>(
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 13px",background:T.raised,borderRadius:9,flexWrap:isMobile?"wrap":"nowrap"}}>
                <FileText size={13} color={T.accent} strokeWidth={1.5} style={{flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.type}</div>
                  <div style={{fontSize:10,color:T.textSub}}>{r.date} · {r.time} · {r.pages}p{r.tier?` · ${r.tier}`:""}</div>
                </div>
                {r.mode&&<span style={{fontSize:9,fontWeight:700,color:T.textDim,background:T.bg,padding:"2px 6px",borderRadius:4,flexShrink:0}}>{r.mode}</span>}
                <Pill label={r.status} color={r.status==="Delivered"?T.green:T.accent}/>
                <div style={{fontSize:10,color:T.textDim,fontFamily:"monospace",flexShrink:0}}>{r.id}</div>
              </div>
            ))}
          </div>
        </CB>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DISPATCH LIFECYCLE
// ─────────────────────────────────────────────────────────────────
function DispatchLifecycle({showToast,user,isMobile}){
  const[calls,setCalls]=useLS("ss_dispatch_v2",DISPATCH_CALLS_INIT);
  const[selected,setSelected]=useState(null);
  const[showIntake,setShowIntake]=useState(false);
  const[showAssign,setShowAssign]=useState(false);
  const[noteText,setNoteText]=useState("");
  const[intake,setIntake]=useState({caller:"",callerPhone:"",type:"Trespass",priority:"High",site:SITES[0].name,location:"",description:""});

  const CALL_TYPES=["Trespass","Suspicious Person","Medical Assist","Alarm Activation","Vehicle Incident","Disturbance","Theft","Fire Alarm","Property Damage","Request for Assistance","Escort","Other"];
  const NEXT_STATUS={"Queued":"Assigned","Assigned":"Acknowledged","Acknowledged":"Enroute","Enroute":"On-Scene","On-Scene":"Cleared","Cleared":"Closed"};
  const STATUS_TS={"Assigned":"assignedAt","Acknowledged":"acknowledgedAt","Enroute":"enrouteAt","On-Scene":"onSceneAt","Cleared":"clearedAt","Closed":"closedAt"};
  const PCOL={"Critical":T.red,"High":T.amber,"Medium":T.accent,"Low":T.green};

  const nowStr=()=>new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
  const selCall=selected?calls.find(c=>c.id===selected):null;

  const advanceStatus=(callId)=>{
    const c=calls.find(x=>x.id===callId);if(!c)return;
    const next=NEXT_STATUS[c.status];if(!next)return;
    const tsField=STATUS_TS[next];const prev=c.status;const ts=nowStr();
    setCalls(p=>p.map(x=>x.id===callId?{...x,status:next,[tsField]:ts}:x));
    logAction(user,"DISPATCH_STATUS",`${callId}: ${prev} → ${next}`,{prevValue:prev,newValue:next});
    showToast(`${callId} → ${next}`,"success");
  };
  const assignOfficer=(callId,o)=>{
    const prev=calls.find(x=>x.id===callId)?.assignedTo||"Unassigned";const ts=nowStr();
    setCalls(p=>p.map(x=>x.id===callId?{...x,status:"Assigned",assignedTo:o.name,assignedBadge:o.badge,assignedAt:ts}:x));
    logAction(user,"DISPATCH_ASSIGN",`${callId} → ${o.name}`,{prevValue:prev,newValue:o.name});
    showToast(`${callId} assigned to ${o.name}`,"success");setShowAssign(false);
  };
  const addNote=(callId)=>{
    if(!noteText.trim())return;
    const ts=nowStr();const entry={ts,text:noteText.trim(),author:user?.name||"System"};
    setCalls(p=>p.map(x=>x.id===callId?{...x,notes:[...(x.notes||[]),entry]}:x));
    logAction(user,"DISPATCH_NOTE",`${callId}: ${noteText.trim()}`);
    setNoteText("");showToast("Note added","success");
  };
  const submitIntake=()=>{
    if(!intake.caller.trim()||!intake.location.trim()||!intake.description.trim()){showToast("Fill required fields","error");return;}
    const id=`DC-${String(calls.length+1).padStart(3,"0")}`;const ts=nowStr();
    const nc={...intake,id,status:"Queued",assignedTo:null,assignedBadge:null,intakedAt:ts,assignedAt:null,acknowledgedAt:null,enrouteAt:null,onSceneAt:null,clearedAt:null,closedAt:null,linkedIncident:null,notes:[]};
    setCalls(p=>[nc,...p]);
    logAction(user,"DISPATCH_INTAKE",`${id} — ${intake.type} at ${intake.site}`,{newValue:intake.type});
    showToast(`${id} created`,"success");
    setIntake({caller:"",callerPhone:"",type:"Trespass",priority:"High",site:SITES[0].name,location:"",description:""});
    setShowIntake(false);setSelected(id);
  };

  const statBadge=(s)=>{
    const cfg={"Queued":{bg:T.amberGlow,bd:T.amberB,c:T.amber},"Assigned":{bg:T.accentGlow,bd:T.accentB,c:T.accent},"Acknowledged":{bg:T.purpleGlow,bd:T.purple+"33",c:T.purple},"Enroute":{bg:T.goldGlow,bd:T.gold+"33",c:T.gold},"On-Scene":{bg:T.redGlow,bd:T.redB,c:T.red},"Cleared":{bg:T.greenGlow,bd:T.greenB,c:T.green},"Closed":{bg:"transparent",bd:T.border,c:T.textDim}}[s]||{bg:"transparent",bd:T.border,c:T.textDim};
    return<span style={{fontSize:10,fontWeight:700,background:cfg.bg,border:`1px solid ${cfg.bd}`,color:cfg.c,padding:"2px 7px",borderRadius:5,textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{s}</span>;
  };
  const tlStep=(label,ts,isActive,isDone)=>(
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0"}}>
      <div style={{width:18,height:18,borderRadius:"50%",background:isDone?T.green:isActive?T.accent:"transparent",border:`2px solid ${isDone?T.green:isActive?T.accent:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        {isDone&&<Check size={9} strokeWidth={3} color="#000"/>}{isActive&&!isDone&&<div style={{width:5,height:5,borderRadius:"50%",background:T.accent}}/>}
      </div>
      <span style={{fontSize:11,fontWeight:600,color:isDone||isActive?T.text:T.textDim,flex:1}}>{label}</span>
      {ts&&<span style={{fontSize:10,color:T.textSub,fontFamily:"monospace"}}>{ts}</span>}
    </div>
  );

  const queued=calls.filter(c=>c.status==="Queued").length;
  const active=calls.filter(c=>["Assigned","Acknowledged","Enroute","On-Scene"].includes(c.status)).length;
  const cleared=calls.filter(c=>c.status==="Cleared").length;
  const activeOfficers=OFFICERS.filter(o=>o.status!=="Off Duty");
  const sorted=[...calls].sort((a,b)=>{
    const po=["Critical","High","Medium","Low"],so=["Queued","Assigned","Acknowledged","Enroute","On-Scene","Cleared","Closed"];
    if(a.status==="Closed"&&b.status!=="Closed")return 1;if(b.status==="Closed"&&a.status!=="Closed")return -1;
    return so.indexOf(a.status)-so.indexOf(b.status)||(po.indexOf(a.priority)-po.indexOf(b.priority));
  });

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
        {[{l:"Queued",v:queued,c:T.amber},{l:"Active",v:active,c:T.accent},{l:"Awaiting Closure",v:cleared,c:T.green},{l:"Total Today",v:calls.length,c:T.textSub}].map(s=>(
          <div key={s.l} style={{flex:1,minWidth:70,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"9px 12px"}}>
            <div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontSize:9,color:T.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>{s.l}</div>
          </div>
        ))}
        <button onClick={()=>setShowIntake(true)} style={{background:`linear-gradient(135deg,${T.accent},${T.accentH})`,border:"none",color:"#fff",padding:"10px 18px",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>
          <PhoneIncoming size={13} strokeWidth={2}/>New Call
        </button>
      </div>

      <div style={{display:"flex",gap:14,flexDirection:isMobile?"column":"row",alignItems:"flex-start"}}>
        <Card style={{flex:"0 0 auto",width:isMobile?"100%":310}}>
          <CB style={{padding:"14px 16px"}}>
            <SH title="Dispatch Queue"/>
            <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:500,overflowY:"auto"}}>
              {sorted.length===0&&<div style={{fontSize:12,color:T.textDim,textAlign:"center",padding:24}}>No calls</div>}
              {sorted.map(c=>(
                <div key={c.id} onClick={()=>setSelected(c.id)}
                  style={{padding:"9px 10px",background:selected===c.id?T.accentGlow:T.raised,border:`1px solid ${selected===c.id?T.accentB:T.border}`,borderRadius:8,cursor:"pointer",transition:"all .12s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3,flexWrap:"wrap"}}>
                    <span style={{fontSize:9,fontWeight:700,color:T.textDim,fontFamily:"monospace"}}>{c.id}</span>
                    <span style={{fontSize:9,fontWeight:700,color:PCOL[c.priority]||T.textSub,background:(PCOL[c.priority]||T.textSub)+"22",padding:"1px 5px",borderRadius:3}}>{c.priority}</span>
                    {statBadge(c.status)}
                  </div>
                  <div style={{fontSize:12,fontWeight:700,color:T.text}}>{c.type}</div>
                  <div style={{fontSize:10,color:T.textSub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.site} · {c.location}</div>
                  {c.assignedTo&&<div style={{fontSize:10,color:T.accent,marginTop:2}}>{c.assignedTo}</div>}
                </div>
              ))}
            </div>
          </CB>
        </Card>

        {selCall?(
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}>
            <Card glow={selCall.priority==="Critical"?T.red:selCall.priority==="High"?T.amber:undefined}>
              <CB>
                <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,flexWrap:"wrap"}}>
                      <span style={{fontSize:11,fontWeight:700,color:T.textDim,fontFamily:"monospace"}}>{selCall.id}</span>
                      <span style={{fontSize:11,fontWeight:800,color:PCOL[selCall.priority]||T.text}}>{selCall.priority}</span>
                      {statBadge(selCall.status)}
                    </div>
                    <div style={{fontSize:17,fontWeight:800,color:T.text,marginBottom:3}}>{selCall.type}</div>
                    <div style={{fontSize:12,color:T.textSub}}>{selCall.site} · {selCall.location}</div>
                  </div>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                    {selCall.status==="Queued"&&<button onClick={()=>setShowAssign(true)} style={{background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,padding:"8px 14px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:11,display:"flex",alignItems:"center",gap:5}}>
                      <Users size={12} strokeWidth={2}/>Assign Officer
                    </button>}
                    {NEXT_STATUS[selCall.status]&&selCall.status!=="Queued"&&<button onClick={()=>advanceStatus(selCall.id)} style={{background:selCall.status==="Cleared"?T.green:T.accent,border:"none",color:"#000",padding:"8px 16px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:11,display:"flex",alignItems:"center",gap:5}}>
                      <ArrowRight size={12} strokeWidth={2.5}/>{NEXT_STATUS[selCall.status]}
                    </button>}
                  </div>
                </div>
                <div style={{padding:"9px 12px",background:T.raised,borderRadius:7,fontSize:12,color:T.text,lineHeight:1.6,marginBottom:10}}>{selCall.description}</div>
                <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                  <div style={{fontSize:11,color:T.textSub}}>Caller: <strong style={{color:T.text}}>{selCall.caller}</strong>{selCall.callerPhone&&selCall.callerPhone!=="—"&&<span style={{color:T.accent}}> · {selCall.callerPhone}</span>}</div>
                  {selCall.assignedTo&&<div style={{fontSize:11,color:T.textSub}}>Officer: <strong style={{color:T.accent}}>{selCall.assignedTo} ({selCall.assignedBadge})</strong></div>}
                  {selCall.linkedIncident&&<div style={{fontSize:11,color:T.textSub}}>Incident: <strong style={{color:T.amber}}>{selCall.linkedIncident}</strong></div>}
                </div>
              </CB>
            </Card>
            <Card>
              <CB style={{padding:"14px 16px"}}>
                <SH title="Status Timeline"/>
                {tlStep("Intake / Queued",selCall.intakedAt,selCall.status==="Queued",true)}
                {tlStep("Officer Assigned",selCall.assignedAt,selCall.status==="Assigned",!!selCall.assignedAt)}
                {tlStep("Acknowledged",selCall.acknowledgedAt,selCall.status==="Acknowledged",!!selCall.acknowledgedAt)}
                {tlStep("En Route",selCall.enrouteAt,selCall.status==="Enroute",!!selCall.enrouteAt)}
                {tlStep("On Scene",selCall.onSceneAt,selCall.status==="On-Scene",!!selCall.onSceneAt)}
                {tlStep("Cleared",selCall.clearedAt,selCall.status==="Cleared",!!selCall.clearedAt)}
                {tlStep("Closed",selCall.closedAt,selCall.status==="Closed",!!selCall.closedAt)}
              </CB>
            </Card>
            <Card>
              <CB style={{padding:"14px 16px"}}>
                <SH title="Field Notes"/>
                <div style={{display:"flex",gap:7,marginBottom:8}}>
                  <input value={noteText} onChange={e=>setNoteText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addNote(selCall.id)} placeholder="Add note…"
                    style={{flex:1,background:T.raised,border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 10px",color:T.text,fontSize:12}}/>
                  <button onClick={()=>addNote(selCall.id)} style={{background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,padding:"7px 12px",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:11}}>Add</button>
                </div>
                {(selCall.notes||[]).length===0?<div style={{fontSize:11,color:T.textDim}}>No notes.</div>:(
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    {selCall.notes.map((n,i)=>(
                      <div key={i} style={{padding:"7px 9px",background:T.raised,borderRadius:6}}>
                        <div style={{fontSize:10,color:T.accent,fontWeight:600,marginBottom:2}}>{n.ts} · {n.author}</div>
                        <div style={{fontSize:11,color:T.text}}>{n.text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CB>
            </Card>
          </div>
        ):(
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:48,color:T.textDim,fontSize:13,flexDirection:"column",gap:10}}>
            <Radio size={32} color={T.border} strokeWidth={1}/>
            Select a call from the queue to view details
          </div>
        )}
      </div>

      {showIntake&&(
        <ModalWrap>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:22,width:"100%",maxWidth:480}}>
            <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:18,display:"flex",alignItems:"center",gap:8}}>
              <PhoneIncoming size={15} color={T.accent} strokeWidth={2}/>Call Intake
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[{l:"Caller Name *",k:"caller",ph:"Name or unit"},{l:"Caller Phone",k:"callerPhone",ph:"555-0000"},{l:"Specific Location *",k:"location",ph:"Area or access point"}].map(f=>(
                <div key={f.k}><div style={{fontSize:11,color:T.textSub,marginBottom:3}}>{f.l}</div>
                  <input value={intake[f.k]} onChange={e=>setIntake(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph}
                    style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:7,padding:"8px 11px",color:T.text,fontSize:12}}/></div>
              ))}
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1}}><div style={{fontSize:11,color:T.textSub,marginBottom:3}}>Type</div>
                  <select value={intake.type} onChange={e=>setIntake(p=>({...p,type:e.target.value}))} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:7,padding:"8px 11px",color:T.text,fontSize:12}}>
                    {CALL_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{flex:1}}><div style={{fontSize:11,color:T.textSub,marginBottom:3}}>Priority</div>
                  <select value={intake.priority} onChange={e=>setIntake(p=>({...p,priority:e.target.value}))} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:7,padding:"8px 11px",color:T.text,fontSize:12}}>
                    {["Critical","High","Medium","Low"].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div><div style={{fontSize:11,color:T.textSub,marginBottom:3}}>Site</div>
                <select value={intake.site} onChange={e=>setIntake(p=>({...p,site:e.target.value}))} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:7,padding:"8px 11px",color:T.text,fontSize:12}}>
                  {SITES.map(s=><option key={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div><div style={{fontSize:11,color:T.textSub,marginBottom:3}}>Description *</div>
                <textarea value={intake.description} onChange={e=>setIntake(p=>({...p,description:e.target.value}))} rows={3} placeholder="Describe the situation…"
                  style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:7,padding:"8px 11px",color:T.text,fontSize:12,resize:"vertical"}}/>
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:18}}>
              <button onClick={()=>setShowIntake(false)} style={{flex:1,background:T.raised,border:`1px solid ${T.border}`,color:T.textSub,padding:10,borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:12}}>Cancel</button>
              <button onClick={submitIntake} style={{flex:2,background:T.accent,border:"none",color:"#fff",padding:10,borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>Create Call</button>
            </div>
          </div>
        </ModalWrap>
      )}

      {showAssign&&selCall&&(
        <ModalWrap>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:20,width:"100%",maxWidth:360}}>
            <div style={{fontSize:14,fontWeight:800,color:T.text,marginBottom:14}}>Assign Officer — {selCall.id}</div>
            <div style={{display:"flex",flexDirection:"column",gap:7,maxHeight:280,overflowY:"auto"}}>
              {activeOfficers.map(o=>(
                <div key={o.id} onClick={()=>assignOfficer(selCall.id,o)}
                  style={{display:"flex",alignItems:"center",gap:9,padding:"9px 11px",background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,cursor:"pointer"}}>
                  <Av initials={o.av} color={SM(o.status).c} size={30}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.text}}>{o.name}</div>
                    <div style={{fontSize:10,color:T.textSub}}>{o.badge} · {o.site}</div>
                  </div>
                  <Pill label={o.status}/>
                </div>
              ))}
            </div>
            <button onClick={()=>setShowAssign(false)} style={{width:"100%",marginTop:12,background:T.raised,border:`1px solid ${T.border}`,color:T.textSub,padding:9,borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:12}}>Cancel</button>
          </div>
        </ModalWrap>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// GUARD TOURS
// ─────────────────────────────────────────────────────────────────
function GuardTours({user,showToast,isMobile}){
  const[checkIns,setCheckIns]=useLS("ss_tour_checkins_v1",{});
  const[queue,setQueue]=useLS("ss_tour_queue_v1",[]);
  const[tourHistory,setTourHistory]=useLS("ss_tour_history_v1",[]);
  const[activeRoute,setActiveRoute]=useState(null);
  const[scanning,setScanning]=useState(null);
  const[isOnline,setIsOnline]=useState(navigator.onLine);
  const[view,setView]=useState("routes");

  useEffect(()=>{
    const h=()=>setIsOnline(navigator.onLine);
    window.addEventListener("online",h);window.addEventListener("offline",h);
    return()=>{window.removeEventListener("online",h);window.removeEventListener("offline",h);};
  },[]);

  const rCps=(rid)=>TOUR_CHECKPOINTS.filter(c=>c.routeId===rid).sort((a,b)=>a.order-b.order);
  const tKey=(rid)=>`${rid}:${new Date().toISOString().slice(0,10)}`;
  const isCid=(rid,cpId)=>!!(checkIns[tKey(rid)]||[]).find(c=>c.cpId===cpId);
  const getCi=(rid,cpId)=>(checkIns[tKey(rid)]||[]).find(c=>c.cpId===cpId)||null;

  const doScan=(rid,cp)=>{
    if(scanning===cp.id)return;
    setScanning(cp.id);
    setTimeout(()=>{
      const ts=new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
      const entry={cpId:cp.id,ts,method:cp.method,officer:user?.name||"Officer",badge:user?.badge||"—",gps:isOnline};
      if(isOnline){
        setCheckIns(p=>{const k=tKey(rid);const ex=p[k]||[];return{...p,[k]:[...ex,entry]};});
        logAction(user,"TOUR_CHECKIN",`${cp.name}`,{newValue:ts});
        showToast(`${cp.name} — checked in`,"success");
      } else {
        setQueue(p=>[...p,{...entry,routeId:rid,cpName:cp.name}]);
        showToast(`${cp.name} — queued (offline)`,"info");
      }
      setScanning(null);
    },1100);
  };

  const syncQueue=()=>{
    if(!queue.length){showToast("Nothing to sync","info");return;}
    queue.forEach(q=>{
      const k=`${q.routeId}:${new Date().toISOString().slice(0,10)}`;
      setCheckIns(p=>{const ex=p[k]||[];return{...p,[k]:[...ex,{cpId:q.cpId,ts:q.ts,method:q.method,officer:q.officer,badge:q.badge,gps:true}]};});
    });
    logAction(user,"TOUR_SYNC",`${queue.length} record(s) synced`);
    setQueue([]);showToast(`${queue.length} record(s) synced`,"success");
  };

  const completeTour=(route)=>{
    const cps=rCps(route.id);const checked=cps.filter(c=>isCid(route.id,c.id)).length;
    const missed=cps.filter(c=>c.required&&!isCid(route.id,c.id)).length;
    const rec={id:`TH-${Date.now()}`,routeId:route.id,routeName:route.name,site:route.site,
      officer:user?.name||"Officer",badge:user?.badge||"—",
      date:new Date().toLocaleDateString("en-GB"),
      completedAt:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}),
      total:cps.length,checked,missed,status:missed===0?"Complete":"Partial"};
    setTourHistory(p=>[rec,...p.slice(0,49)]);
    logAction(user,"TOUR_COMPLETE",`${route.name} · ${checked}/${cps.length}`,{newValue:rec.status});
    showToast(`Tour complete — ${checked}/${cps.length} checkpoints`,"success");
    setActiveRoute(null);setView("history");
  };

  const selRoute=activeRoute?TOUR_ROUTES.find(r=>r.id===activeRoute):null;
  const selCps=activeRoute?rCps(activeRoute):[];
  const checkedCount=activeRoute?selCps.filter(c=>isCid(activeRoute,c.id)).length:0;
  const missedReq=activeRoute?selCps.filter(c=>c.required&&!isCid(activeRoute,c.id)):[];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",gap:5,alignItems:"center",fontSize:11,fontWeight:700,color:isOnline?T.green:T.amber,background:isOnline?T.greenGlow:T.amberGlow,border:`1px solid ${isOnline?T.greenB:T.amberB}`,padding:"5px 10px",borderRadius:7}}>
          {isOnline?<Wifi size={11} strokeWidth={2}/>:<WifiOff size={11} strokeWidth={2}/>}{isOnline?"Connected":"Offline Mode"}
        </div>
        {queue.length>0&&<button onClick={syncQueue} style={{fontSize:11,fontWeight:700,color:T.accent,background:T.accentGlow,border:`1px solid ${T.accentB}`,padding:"5px 10px",borderRadius:7,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
          <RotateCw size={10} strokeWidth={2}/>{queue.length} Queued — Sync
        </button>}
        <div style={{marginLeft:"auto",display:"flex",gap:5}}>
          {[{v:"routes",l:"Routes"},{v:"active",l:"Active Patrol"},{v:"history",l:"History"}].map(({v,l})=>(
            <button key={v} onClick={()=>setView(v)} style={{fontSize:11,fontWeight:700,background:view===v?T.accentGlow:"transparent",border:`1px solid ${view===v?T.accentB:T.border}`,color:view===v?T.accent:T.textSub,padding:"5px 10px",borderRadius:6,cursor:"pointer"}}>{l}</button>
          ))}
        </div>
      </div>

      {view==="routes"&&(
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(290px,1fr))",gap:12}}>
          {TOUR_ROUTES.map(r=>{
            const cps=rCps(r.id);const done=cps.filter(c=>isCid(r.id,c.id)).length;
            const pct=cps.length>0?Math.round(done/cps.length*100):0;
            const sc=r.status==="Overdue"?T.red:r.status==="On Time"?T.green:T.amber;
            return(
              <Card key={r.id} glow={r.status==="Overdue"?T.red:undefined}>
                <CB>
                  <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:800,color:T.text,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                      <div style={{fontSize:11,color:T.textSub}}>{r.site} · {r.checkpoints} checkpoints · ~{r.estimatedMins}min</div>
                    </div>
                    <Pill label={r.status} color={sc}/>
                  </div>
                  <div style={{display:"flex",gap:12,fontSize:10,color:T.textSub,marginBottom:10}}>
                    <span>Freq: <strong style={{color:T.text}}>{r.frequency}</strong></span>
                    <span>Last: <strong style={{color:T.text}}>{r.lastPatrol}</strong></span>
                    <span>Due: <strong style={{color:r.status==="Overdue"?T.red:T.text}}>{r.dueNext}</strong></span>
                  </div>
                  {done>0&&<div style={{marginBottom:8}}><PBar value={pct} max={100} color={pct===100?T.green:T.accent}/><div style={{fontSize:9,color:T.textSub,marginTop:3}}>{done}/{cps.length} today</div></div>}
                  <button onClick={()=>{setActiveRoute(r.id);setView("active");}}
                    style={{width:"100%",background:`linear-gradient(135deg,${T.accent},${T.accentH})`,border:"none",color:"#fff",padding:10,borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                    <Navigation size={11} strokeWidth={2}/>Start Patrol
                  </button>
                </CB>
              </Card>
            );
          })}
        </div>
      )}

      {view==="active"&&!selRoute&&(
        <Card><CB>
          <div style={{textAlign:"center",padding:28,color:T.textDim}}>
            <Navigation size={28} color={T.border} strokeWidth={1} style={{display:"block",margin:"0 auto 10px"}}/>
            <div style={{fontSize:12,marginBottom:14}}>No active patrol. Select a route to begin.</div>
            <button onClick={()=>setView("routes")} style={{background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,padding:"9px 18px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>View Routes</button>
          </div>
        </CB></Card>
      )}

      {view==="active"&&selRoute&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Card>
            <CB>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <button onClick={()=>setView("routes")} style={{background:"transparent",border:"none",color:T.textSub,cursor:"pointer",display:"flex",alignItems:"center",gap:3,fontSize:11,fontWeight:600,padding:0}}>
                  <ChevronLeft size={12} strokeWidth={2}/>Routes
                </button>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:800,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selRoute.name}</div>
                  <div style={{fontSize:11,color:T.textSub}}>{selRoute.site}</div>
                </div>
                <div style={{fontSize:14,fontWeight:800,color:checkedCount===selCps.length?T.green:T.accent}}>{checkedCount}/{selCps.length}</div>
              </div>
              <PBar value={selCps.length>0?Math.round(checkedCount/selCps.length*100):0} max={100} color={checkedCount===selCps.length?T.green:T.accent}/>
              {missedReq.length>0&&<div style={{marginTop:8,padding:"7px 10px",background:T.amberGlow,border:`1px solid ${T.amberB}`,borderRadius:7,fontSize:11,color:T.amber,display:"flex",gap:5}}>
                <AlertTriangle size={11} strokeWidth={2} style={{flexShrink:0,marginTop:1}}/>{missedReq.length} required checkpoint(s) remaining
              </div>}
            </CB>
          </Card>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {selCps.map(cp=>{
              const ci=getCi(activeRoute,cp.id);const done=!!ci;const busy=scanning===cp.id;
              return(
                <div key={cp.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",background:done?T.greenGlow:T.surface,border:`1px solid ${done?T.greenB:T.border}`,borderRadius:10,transition:"all .18s"}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:done?T.green:T.raised,border:`2px solid ${done?T.green:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:10,fontWeight:800,color:done?"#000":T.textDim}}>{cp.order}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.text}}>{cp.name}</div>
                    <div style={{display:"flex",gap:6,marginTop:2,alignItems:"center"}}>
                      <span style={{fontSize:9,color:T.textDim,background:T.raised,padding:"1px 5px",borderRadius:3}}>{cp.method}</span>
                      {!cp.required&&<span style={{fontSize:9,color:T.textDim}}>Optional</span>}
                      {done&&<span style={{fontSize:9,color:T.green}}>{ci.ts}</span>}
                      {done&&ci.gps&&<span style={{fontSize:9,color:T.green,display:"flex",alignItems:"center",gap:2}}><MapPin size={8} strokeWidth={2}/>GPS</span>}
                    </div>
                  </div>
                  {done?<CircleCheck size={17} color={T.green} strokeWidth={2}/>:(
                    <button onClick={()=>doScan(activeRoute,cp)} disabled={busy}
                      style={{background:busy?T.accentGlow:T.accent,border:"none",color:busy?T.accent:"#fff",padding:"6px 12px",borderRadius:7,cursor:busy?"default":"pointer",fontWeight:700,fontSize:10,display:"flex",alignItems:"center",gap:4,transition:"all .15s"}}>
                      <ScanLine size={10} strokeWidth={2}/>{busy?"Scanning…":"Check In"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={()=>completeTour(selRoute)}
            style={{background:checkedCount===selCps.length?`linear-gradient(135deg,${T.green},${T.green+"AA"})`:T.raised,border:`1px solid ${checkedCount===selCps.length?T.green:T.border}`,color:checkedCount===selCps.length?"#000":T.textSub,padding:"12px 18px",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <CircleCheck size={13} strokeWidth={2}/>Complete Tour
          </button>
        </div>
      )}

      {view==="history"&&(
        <Card><CB>
          <SH title="Patrol History"/>
          {tourHistory.length===0?<div style={{textAlign:"center",padding:24,color:T.textDim,fontSize:12}}>No completed tours yet.</div>:(
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {tourHistory.map(t=>(
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:T.raised,border:`1px solid ${T.border}`,borderRadius:8}}>
                  <CircleCheck size={16} color={t.status==="Complete"?T.green:T.amber} strokeWidth={2} style={{flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.routeName}</div>
                    <div style={{fontSize:10,color:T.textSub}}>{t.date} {t.completedAt} · {t.officer} · {t.checked}/{t.total} checkpoints</div>
                  </div>
                  <Pill label={t.status} color={t.status==="Complete"?T.green:T.amber}/>
                </div>
              ))}
            </div>
          )}
        </CB></Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// OPERATIONS CENTER
// ─────────────────────────────────────────────────────────────────
function OperationsCenter({user,showToast,isMobile}){
  const[dispCalls]=useLS("ss_dispatch_v2",DISPATCH_CALLS_INIT);
  const now=new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
  const auditLog=getAuditLog().slice(0,10);

  const onDuty=OFFICERS.filter(o=>o.status!=="Off Duty");
  const activeInc=INCIDENTS.filter(i=>!["Closed","Resolved"].includes(i.status));
  const activeCalls=dispCalls.filter(c=>c.status!=="Closed");
  const queuedCalls=dispCalls.filter(c=>c.status==="Queued");

  const ALERTS=[
    {lvl:"critical",txt:"Theo Okafor — SIA Door Supervisor cert expired. Non-compliant deployment."},
    {lvl:"high",txt:"INC-2847 Trespass (Plaza West) active 27+ min. Backup required."},
    {lvl:"high",txt:"Perimeter Gate 3 — 2 missed checkpoints this shift."},
    {lvl:"medium",txt:"KEY-009 overdue return since yesterday 18:00 — Marcus Webb."},
    {lvl:"medium",txt:"Jordan Park — 3.5 hrs without logged break. Monitor fatigue."},
  ];
  const ac=(l)=>({critical:T.red,high:T.amber,medium:T.accent,Low:T.green,Normal:T.green,Medium:T.accent,High:T.red}[l]||T.textDim);

  const siteStats=SITES.map(s=>{
    const offs=onDuty.filter(o=>o.site===s.name).length;
    const incs=activeInc.filter(i=>i.site===s.name).length;
    const lvl=incs>0||s.alert?"High":offs===0?"Medium":"Normal";
    return{name:s.name,offs,incs,lvl};
  });

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 16px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:12}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:T.green,animation:"ssB 1.5s infinite",flexShrink:0}}/>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:800,color:T.text}}>Operations Center</div>
          <div style={{fontSize:11,color:T.textSub}}>Live overview · {now}</div>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {[{l:`${onDuty.length} On Duty`,c:onDuty.length>=4?T.green:T.amber},{l:`${activeInc.length} Open Incidents`,c:activeInc.length>0?T.red:T.green},{l:`${queuedCalls.length} Queued Calls`,c:queuedCalls.length>0?T.amber:T.green}].map(s=>(
            <span key={s.l} style={{fontSize:11,fontWeight:700,color:s.c}}>{s.l}</span>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:12}}>
        <Card glow={T.accent}>
          <CB style={{padding:"14px 16px"}}>
            <SH title="Active Officers"/>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {OFFICERS.map(o=>{
                const sm=SM(o.status);
                return(
                  <div key={o.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 9px",background:T.raised,borderRadius:7,opacity:o.status==="Off Duty"?0.4:1}}>
                    <Av initials={o.av} color={sm.c} size={28}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.name}</div>
                      <div style={{fontSize:10,color:T.textSub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.site}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:3}}>
                      {sm.p&&<div style={{width:5,height:5,borderRadius:"50%",background:sm.c,animation:"ssB 1s infinite",flexShrink:0}}/>}
                      <span style={{fontSize:9,fontWeight:700,color:sm.c,whiteSpace:"nowrap"}}>{o.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CB>
        </Card>

        <Card>
          <CB style={{padding:"14px 16px"}}>
            <SH title="Site Status"/>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {siteStats.map(s=>(
                <div key={s.name} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:T.raised,border:`1px solid ${s.lvl==="High"?T.redB:s.lvl==="Medium"?T.amberB:T.border}`,borderRadius:8}}>
                  <MapPin size={13} color={ac(s.lvl)} strokeWidth={1.5} style={{flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,fontWeight:700,color:T.text}}>{s.name}</div>
                    <div style={{fontSize:10,color:T.textSub}}>{s.offs} officer(s) · {s.incs} open incident(s)</div>
                  </div>
                  <Pill label={s.lvl} color={ac(s.lvl)}/>
                </div>
              ))}
            </div>
          </CB>
        </Card>

        <Card glow={queuedCalls.length>0?T.amber:undefined}>
          <CB style={{padding:"14px 16px"}}>
            <SH title="Dispatch Queue"/>
            {activeCalls.length===0?<div style={{textAlign:"center",padding:16,color:T.textDim,fontSize:12}}>No active calls</div>:(
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {activeCalls.slice(0,5).map(c=>{
                  const pc={"Critical":T.red,"High":T.amber,"Medium":T.accent,"Low":T.green}[c.priority]||T.textDim;
                  return(
                    <div key={c.id} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 9px",background:T.raised,borderRadius:7}}>
                      <span style={{fontSize:9,fontWeight:700,color:pc,background:pc+"22",padding:"1px 5px",borderRadius:3,flexShrink:0}}>{c.priority}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.type} · {c.site}</div>
                        <div style={{fontSize:9,color:T.textSub}}>{c.id} · {c.assignedTo||"Unassigned"}</div>
                      </div>
                      <Pill label={c.status} color={SM(c.status).c}/>
                    </div>
                  );
                })}
                {activeCalls.length>5&&<div style={{fontSize:10,color:T.textDim,textAlign:"center"}}>+{activeCalls.length-5} more</div>}
              </div>
            )}
          </CB>
        </Card>

        <Card glow={T.red}>
          <CB style={{padding:"14px 16px"}}>
            <SH title="Supervisor Alerts"/>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {ALERTS.map((a,i)=>(
                <div key={i} style={{display:"flex",gap:7,padding:"7px 9px",background:T.raised,border:`1px solid ${ac(a.lvl)+"33"}`,borderRadius:7}}>
                  <AlertTriangle size={11} color={ac(a.lvl)} strokeWidth={2} style={{flexShrink:0,marginTop:1}}/>
                  <div style={{fontSize:11,color:T.text,lineHeight:1.5}}>{a.txt}</div>
                </div>
              ))}
            </div>
          </CB>
        </Card>
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:12}}>
        <Card>
          <CB style={{padding:"14px 16px"}}>
            <SH title="Open Incidents"/>
            {activeInc.length===0?<div style={{textAlign:"center",padding:16,color:T.textDim,fontSize:12}}>No open incidents</div>:(
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {activeInc.map(inc=>{
                  const sc=inc.sev==="High"?T.red:inc.sev==="Medium"?T.amber:T.accent;
                  return(
                    <div key={inc.id} style={{display:"flex",gap:8,padding:"8px 10px",background:T.raised,borderRadius:7,alignItems:"center"}}>
                      <ShieldAlert size={12} color={sc} strokeWidth={1.5} style={{flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:700,color:T.text}}>{inc.type} · {inc.site}</div>
                        <div style={{fontSize:9,color:T.textSub}}>{inc.id} · {inc.officer} · {inc.time}</div>
                      </div>
                      <Pill label={inc.status} color={SM(inc.status).c}/>
                    </div>
                  );
                })}
              </div>
            )}
          </CB>
        </Card>
        <Card>
          <CB style={{padding:"14px 16px"}}>
            <SH title="Recent Activity"/>
            {auditLog.length===0?<div style={{textAlign:"center",padding:16,color:T.textDim,fontSize:12}}>No activity yet</div>:(
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {auditLog.map(e=>(
                  <div key={e.id} style={{display:"flex",gap:7,padding:"5px 0",borderBottom:`1px solid ${T.border}`}}>
                    <div style={{width:24,height:24,borderRadius:"50%",background:T.raised,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:8,fontWeight:800,color:T.textSub}}>{(e.user||"?").split(" ").map(x=>x[0]).join("").slice(0,2)}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:10,fontWeight:700,color:T.accent,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.action}</div>
                      <div style={{fontSize:9,color:T.textSub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.user} · {e.detail}</div>
                    </div>
                    <div style={{fontSize:9,color:T.textDim,flexShrink:0,fontFamily:"monospace"}}>{(e.ts||"").slice(11,16)}</div>
                  </div>
                ))}
              </div>
            )}
          </CB>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MY SHIFT
// ─────────────────────────────────────────────────────────────────
function MyShift({user,showToast,isMobile}){
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
  const[gps,setGps]=useState(null);
  const[gpsErr,setGpsErr]=useState(null);
  const timerRef=useRef(null);
  const enRouteRef=useRef(null);
  const lwRef=useRef(null);

  // Real GPS — updates while clocked in
  useEffect(()=>{
    if(!clocked)return;
    const stop=watchPosition(
      pos=>{setGps(pos);setGpsErr(null);},
      err=>{setGpsErr(err.code===1?"Location access denied":"GPS unavailable");}
    );
    return stop;
  },[clocked]);

  useEffect(()=>{
    if(loneWorkerActive&&clocked){
      lwRef.current=setInterval(()=>{
        setLoneWorker(t=>{
          if(t<=1){
            clearInterval(lwRef.current);
            showToast("Lone worker check-in MISSED — supervisor alerted","error");
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
    addActivity("Lone worker check-in confirmed");
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
    addActivity("SOS ACTIVATED — Supervisor notified");
    showToast("SOS sent — supervisor and dispatch alerted","error");
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
              ?<button onClick={clockIn} style={{flex:1,background:`linear-gradient(135deg,${T.green},#00a84e)`,border:"none",color:"#000",padding:"14px",borderRadius:12,cursor:"pointer",fontWeight:900,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Timer size={16} strokeWidth={2}/>Clock In</button>
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
                  <button onClick={arrived} style={{background:T.greenGlow,border:`1px solid ${T.greenB}`,color:T.green,padding:"9px 16px",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:6}}><Check size={13} strokeWidth={2.5}/>Arrived</button>
                </div>
                <PBar value={enRouteElapsed} max={enRouteETA*60} color={T.gold}/>
              </div>
            )}
          </CB>
        </Card>
      )}

      {/* GPS status */}
      {clocked&&(
        <Card glow={gps?T.green:undefined}>
          <CB style={{padding:"12px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <MapPin size={18} color={gps?T.green:T.textSub} strokeWidth={1.8}/>
              <div style={{flex:1,minWidth:0}}>
                {gps?(
                  <>
                    <div style={{fontSize:12,fontWeight:700,color:T.green}}>GPS Active · {Math.round(gps.acc)}m accuracy</div>
                    <div style={{fontSize:10,color:T.textDim,fontFamily:"monospace"}}>{gps.lat.toFixed(5)}°N, {gps.lng.toFixed(5)}°W · Updated {new Date(gps.ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</div>
                  </>
                ):gpsErr?(
                  <div style={{fontSize:12,color:T.amber}}>{gpsErr} — position not broadcasting</div>
                ):(
                  <div style={{fontSize:12,color:T.textSub}}>Acquiring GPS signal…</div>
                )}
              </div>
              {gps&&<div style={{width:8,height:8,borderRadius:"50%",background:T.green,animation:"ssB 2s infinite",flexShrink:0}}/>}
            </div>
          </CB>
        </Card>
      )}

      {/* Today stats */}
      {clocked&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:isMobile?6:10}}>
          {[["Checkpoints","8",T.accent,CheckCircle2],["Incidents","0",T.green,Activity],["Hours",fmt(elapsed),T.gold,Timer]].map(([l,v,c,Ic])=>(
            <Card key={l} glow={c}>
              <CB style={{textAlign:"center",padding:"14px 10px"}}>
                <div style={{display:"flex",justifyContent:"center",marginBottom:6}}><Ic size={16} color={c} strokeWidth={1.8}/></div>
                <div style={{fontSize:20,fontWeight:700,color:c}}>{v}</div>
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
                {loneWorkerActive&&<button onClick={lwCheckIn} style={{background:T.greenGlow,border:`1px solid ${T.greenB}`,color:T.green,padding:"8px 12px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",gap:5}}><Check size={12} strokeWidth={2.5}/>Check In</button>}
                <button onClick={()=>setLoneWorkerActive(a=>!a)} style={{background:loneWorkerActive?T.redGlow:T.accentGlow,border:`1px solid ${loneWorkerActive?T.redB:T.accentB}`,color:loneWorkerActive?T.red:T.accent,padding:"8px 12px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>{loneWorkerActive?"Disable":"Enable"}</button>
              </div>
            </div>
            {loneWorkerActive&&<PBar value={30*60-loneWorker} max={30*60} color={loneWorker<300?T.red:T.amber}/>}
          </CB>
        </Card>
      )}

      {/* SOS */}
      {clocked&&(
        <button onClick={sos} style={{width:"100%",background:"rgba(240,68,68,0.12)",border:`2px solid ${T.red}`,color:T.red,padding:"16px",borderRadius:12,cursor:"pointer",fontWeight:900,fontSize:16,letterSpacing:"0.08em",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Siren size={18} strokeWidth={2}/>SOS — Emergency Alert</button>
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
              <div style={{background:T.greenGlow,border:`1px solid ${T.greenB}`,borderRadius:9,padding:"13px 15px",color:T.green,fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:8}}><CheckCircle2 size={14} strokeWidth={2}/>Handover notes submitted to incoming shift</div>
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
function EquipmentModule({user,showToast,isMobile}){
  const[items,setItems]=useLS("ss_equipment_v1",EQUIPMENT);
  const[checkOutModal,setCheckOutModal]=useState(null);
  const[checkInModal,setCheckInModal]=useState(null);
  const isOfficer=user?.role==="Officer";
  const myItems=isOfficer?items.filter(e=>e.badge===user?.badge):items;

  const doCheckOut=(id,officerName,badgeNum)=>{
    const now=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    const item=items.find(e=>e.id===id);
    setItems(prev=>prev.map(e=>e.id===id?{...e,status:"Checked Out",officer:officerName,badge:badgeNum,checkedOut:now}:e));
    setCheckOutModal(null);
    logAction(user,"EQUIP_CHECKOUT",`${item?.name} (${id}) issued to ${officerName} [${badgeNum}]`);
    showToast(`${item?.name} checked out to ${officerName}`,"success");
  };
  const doCheckIn=(id,condition)=>{
    const item=items.find(e=>e.id===id);
    setItems(prev=>prev.map(e=>e.id===id?{...e,status:"Available",officer:"—",badge:"—",checkedOut:"—",condition}:e));
    setCheckInModal(null);
    logAction(user,"EQUIP_CHECKIN",`${item?.name} (${id}) returned — condition: ${condition}`);
    showToast(`${item?.name} checked in`,"success");
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
                  {e.type==="Radio"?<Radio size={16} color={statusColor(e.status)} strokeWidth={1.8}/>:e.type==="Camera"?<Camera size={16} color={statusColor(e.status)} strokeWidth={1.8}/>:e.type==="CEW"?<Zap size={16} color={statusColor(e.status)} strokeWidth={1.8}/>:e.type==="OC Spray"?<Wind size={16} color={statusColor(e.status)} strokeWidth={1.8}/>:e.type==="Medical"?<Bandage size={16} color={statusColor(e.status)} strokeWidth={1.8}/>:<Wrench size={16} color={statusColor(e.status)} strokeWidth={1.8}/>}
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
function LeaveModule({user,showToast,isMobile}){
  const[requests,setRequests]=useLS("ss_leave_v1",LEAVE_REQUESTS);
  const[showForm,setShowForm]=useState(false);
  const[form,setForm]=useState({type:"Annual",from:"",to:"",notes:""});
  const isManager=user?.role==="Company Admin"||user?.role==="Supervisor";

  const approve=(id)=>{
    const req=requests.find(x=>x.id===id);
    setRequests(r=>r.map(x=>x.id===id?{...x,status:"Approved"}:x));
    logAction(user,"LEAVE_APPROVE",`${id} — ${req?.officer||""} (${req?.type||""} ${req?.from||""}–${req?.to||""})`);
    showToast("Leave request approved","success");
  };
  const deny=(id)=>{
    const req=requests.find(x=>x.id===id);
    setRequests(r=>r.map(x=>x.id===id?{...x,status:"Denied"}:x));
    logAction(user,"LEAVE_DENY",`${id} — ${req?.officer||""} (${req?.type||""} ${req?.from||""}–${req?.to||""})`);
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

  const pending=requests.filter(r=>r.status==="Pending").length;
  const approvedDays=requests.filter(r=>r.status==="Approved").reduce((a,r)=>a+r.days,0);
  const teamOnLeave=requests.filter(r=>r.status==="Approved"&&r.from<="2026-06-07"&&r.to>="2026-06-07").length;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:3},1fr)`,gap:10}}>
        {[[CalendarDays,"Pending Requests",pending,pending>0?T.amber:T.textDim],[Check,"Approved Days",approvedDays,T.green],[Users,"Team On Leave",teamOnLeave,teamOnLeave>1?T.amber:T.textDim]].map(([Icon,l,v,c])=>(
          <Card key={l} glow={c}>
            <CB style={{padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div><div style={{fontSize:26,fontWeight:900,color:c,lineHeight:1}}>{v}</div><div style={{fontSize:10,color:T.textSub,marginTop:4}}>{l}</div></div>
                <Icon size={18} color={c} strokeWidth={1.5} style={{opacity:0.45}}/>
              </div>
            </CB>
          </Card>
        ))}
      </div>
      {/* Balances */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
        {Object.entries(LEAVE_BALANCES).map(([type,days])=>{
          const total=LEAVE_TOTALS[type]||days;
          const used=total-days;
          return(
            <Card key={type} glow={typeColor(type)}>
              <CB style={{padding:"14px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:typeColor(type)}}>{type}</div>
                  <div style={{fontSize:10,color:T.textDim}}>{used}/{total} used</div>
                </div>
                <div style={{fontSize:28,fontWeight:900,color:T.text,lineHeight:1}}>{days}</div>
                <div style={{fontSize:10,color:T.textSub,marginTop:2,marginBottom:10}}>days remaining</div>
                <PBar value={days} max={total} color={typeColor(type)}/>
              </CB>
            </Card>
          );
        })}
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
                    {r.type==="Emergency"&&<div style={{fontSize:10,color:T.amber,background:T.goldGlow,border:`1px solid ${T.gold}30`,padding:"4px 8px",borderRadius:6,fontWeight:700,flex:1,display:"flex",alignItems:"center",gap:5}}><AlertTriangle size={10} strokeWidth={2}/>Check coverage before approving</div>}
                    <button onClick={()=>approve(r.id)} style={{flex:1,background:T.greenGlow,border:`1px solid ${T.greenB}`,color:T.green,padding:"8px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><Check size={12} strokeWidth={2.5}/>Approve</button>
                    <button onClick={()=>deny(r.id)} style={{flex:1,background:T.redGlow,border:`1px solid ${T.redB}`,color:T.red,padding:"8px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><X size={12} strokeWidth={2.5}/>Deny</button>
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
function TrainingModule({isMobile}){
  const[filter,setFilter]=useState("All");
  const[scheduled,setScheduled]=useState({});
  const statuses=["All","Valid","Expiring Soon","Expired"];
  const filtered=filter==="All"?TRAINING_DATA:TRAINING_DATA.filter(t=>t.status===filter);
  const valid=TRAINING_DATA.filter(t=>t.status==="Valid").length;
  const expired=TRAINING_DATA.filter(t=>t.status==="Expired").length;
  const expiring=TRAINING_DATA.filter(t=>t.status==="Expiring Soon").length;
  const compliancePct=Math.round(valid/TRAINING_DATA.length*100);

  const certColor=(s)=>s==="Valid"?T.green:s==="Expiring Soon"?T.amber:T.red;
  const daysUntil=(expiry)=>{const d=Math.round((new Date(expiry)-new Date("2026-06-07"))/(1000*60*60*24));return d;};

  const byOfficer=OFFICERS.map(o=>({
    ...o,
    certs:TRAINING_DATA.filter(t=>t.badge===o.badge),
    valid:TRAINING_DATA.filter(t=>t.badge===o.badge&&t.status==="Valid").length,
    issues:TRAINING_DATA.filter(t=>t.badge===o.badge&&(t.status==="Expired"||t.status==="Expiring Soon")).length,
  }));

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:isMobile?6:10}}>
        {[[GraduationCap,"Total Certs",TRAINING_DATA.length,T.accent],[CheckCircle2,"Valid",valid,T.green],[AlertTriangle,"Expiring Soon",expiring,T.amber],[X,"Expired",expired,T.red]].map(([Icon,l,v,c])=>(
          <Card key={l} glow={c}>
            <CB style={{padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div><div style={{fontSize:24,fontWeight:900,color:c,lineHeight:1}}>{v}</div><div style={{fontSize:10,color:T.textSub,marginTop:3}}>{l}</div></div>
                <Icon size={16} color={c} strokeWidth={1.5} style={{opacity:0.45}}/>
              </div>
            </CB>
          </Card>
        ))}
      </div>
      <Card>
        <CB style={{padding:"14px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:700,color:T.text}}>Overall Compliance Score</div>
            <div style={{fontSize:14,fontWeight:900,color:compliancePct>=80?T.green:compliancePct>=60?T.amber:T.red}}>{compliancePct}%</div>
          </div>
          <PBar value={valid} max={TRAINING_DATA.length} color={compliancePct>=80?T.green:compliancePct>=60?T.amber:T.red}/>
          <div style={{fontSize:11,color:T.textSub,marginTop:8}}>{valid} of {TRAINING_DATA.length} certifications valid — {expired+expiring} require action</div>
        </CB>
      </Card>
      {expired>0&&(
        <div style={{background:T.redGlow,border:`1px solid ${T.redB}`,borderRadius:10,padding:"12px 16px",display:"flex",gap:10,alignItems:"center"}}>
          <AlertTriangle size={18} color={T.red} strokeWidth={2}/>
          <div style={{fontSize:12,color:T.red,fontWeight:700}}>Action Required: {expired} expired certificate{expired!==1?"s":""} — officers may not be legally compliant for deployment. Escalate to HR.</div>
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
                {o.issues>0?<Pill label={`${o.issues} issue${o.issues!==1?"s":""}`} color={T.red}/>:<Pill label="Compliant" color={T.green}/>}
              </div>
            ))}
          </div>
        </CB>
      </Card>
      <Card>
        <CB>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              {statuses.map(s=>(
                <button key={s} onClick={()=>setFilter(s)} style={{background:filter===s?`${certColor(s==="All"?"Valid":s)}20`:T.raised,border:`1px solid ${filter===s?certColor(s==="All"?"Valid":s):T.border}`,color:filter===s?certColor(s==="All"?"Valid":s):T.textSub,padding:"7px 13px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:11}}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {filtered.map(t=>{
              const days=daysUntil(t.expiry);
              const isAction=t.status==="Expired"||t.status==="Expiring Soon";
              const isScheduled=!!scheduled[t.id];
              return(
                <div key={t.id} style={{padding:"10px 13px",background:T.raised,borderRadius:9}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:certColor(t.status),flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:700,color:T.text}}>{t.cert}</div>
                      <div style={{fontSize:10,color:T.textSub}}>{t.officer} · {t.issuer}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:10,color:certColor(t.status),fontWeight:700}}>
                        {days<0?`${Math.abs(days)}d overdue`:days===0?"Expires today":`${days}d`}
                      </div>
                      <Pill label={t.status} color={certColor(t.status)}/>
                    </div>
                  </div>
                  {isAction&&(
                    <div style={{marginTop:8,display:"flex",gap:7}}>
                      {isScheduled
                        ?<div style={{flex:1,background:T.greenGlow,border:`1px solid ${T.greenB}`,color:T.green,padding:"7px 12px",borderRadius:7,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:5}}><Check size={11} strokeWidth={2.5}/>Renewal Scheduled</div>
                        :<button onClick={()=>setScheduled(s=>({...s,[t.id]:true}))} style={{flex:1,background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,padding:"7px 12px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><RotateCw size={11} strokeWidth={2.5}/>Schedule Renewal</button>
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CB>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────────────────────────
function AuditLogModule({showToast,isMobile}){
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
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:isMobile?6:10}}>
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
              {filtered.slice(0,200).map(e=>(
                <div key={e.id} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"9px 10px",background:T.raised,borderRadius:8}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:actionColor(e.action),flexShrink:0,marginTop:3}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontSize:11,fontWeight:700,color:actionColor(e.action)}}>{e.action}</span>
                      <span style={{fontSize:10,color:T.textSub}}>{e.user} · {e.badge} · {e.role}</span>
                    </div>
                    {e.detail&&<div style={{fontSize:10,color:T.textDim,marginTop:2}}>{e.detail}</div>}
                    {(e.prevValue!==null&&e.prevValue!==undefined)||(e.newValue!==null&&e.newValue!==undefined)?
                      <div style={{display:"flex",gap:8,marginTop:3,flexWrap:"wrap"}}>
                        {e.prevValue!=null&&<span style={{fontSize:9,color:T.red,fontFamily:"monospace",background:T.redGlow,padding:"1px 5px",borderRadius:3}}>before: {String(e.prevValue)}</span>}
                        {e.newValue!=null&&<span style={{fontSize:9,color:T.green,fontFamily:"monospace",background:T.greenGlow,padding:"1px 5px",borderRadius:3}}>after: {String(e.newValue)}</span>}
                      </div>:null}
                  </div>
                  <div style={{fontSize:9,color:T.textDim,fontFamily:"monospace",flexShrink:0,whiteSpace:"nowrap"}}>{fmt(e.ts)}</div>
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
// EXECUTIVE COMMAND CENTER
// ─────────────────────────────────────────────────────────────────
function ExecutiveCommand({showToast,isMobile}){
  const[tab,setTab]=useState("overview");
  const[briefing,setBriefing]=useState("");
  const[loadBrief,setLoadBrief]=useState(false);
  const active=CONTRACTS.filter(c=>c.status==="Active");
  const totalRev=active.reduce((a,c)=>a+c.monthly,0);
  const totalCost=active.reduce((a,c)=>a+c.cost,0);
  const totalProfit=totalRev-totalCost;
  const totalMargin=Math.round(totalProfit/totalRev*100);
  const avgHealth=Math.round(active.reduce((a,c)=>a+c.health,0)/active.length);
  const hc=(h)=>h>=80?T.green:h>=60?T.amber:T.red;

  const genBrief=async()=>{
    setLoadBrief(true);
    try{
      const text=await callAI(
        [{role:"user",content:`Generate a 4-sentence executive briefing for a security operations company. Revenue: $${totalRev}/mo. Margin: ${totalMargin}%. Active contracts: ${active.length}. Officers deployed: ${OFFICERS.filter(o=>o.status!=="Off Duty").length}. Compliance violations: ${COMPLIANCE_ITEMS.filter(c=>c.status==="Overdue").length}. Open incidents: ${INCIDENTS.filter(i=>i.status==="Active"||i.status==="Under Review").length}.`}],
        "You are an AI executive advisor for a private security company. Generate a concise, professional executive briefing in one flowing paragraph. Use specific numbers. Be strategic and direct.",
        500
      );
      setBriefing(text||"");
    }catch{
      setBriefing(`Today's summary: ShieldSync is generating $${totalRev.toLocaleString()} in monthly recurring revenue across ${active.length} active contracts, achieving a ${totalMargin}% gross margin. ${OFFICERS.filter(o=>o.status!=="Off Duty").length} of ${OFFICERS.length} officers are deployed with a 94% patrol completion rate. There are ${COMPLIANCE_ITEMS.filter(c=>c.status==="Overdue").length} overdue compliance items requiring immediate HR and legal attention. Contract health averages ${avgHealth}% with one contract flagged for immediate renewal discussion.`);
    }
    setLoadBrief(false);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(5,1fr)",gap:isMobile?8:10}}>
        {[
          ["Monthly Revenue",`$${(totalRev/1000).toFixed(0)}k`,T.green,"↑ +8% QoQ"],
          ["Labor Cost",`$${(totalCost/1000).toFixed(0)}k`,T.amber,`${Math.round(totalCost/totalRev*100)}% of rev`],
          ["Gross Margin",`${totalMargin}%`,totalMargin>=25?T.green:T.amber,"↑ +2pts"],
          ["Active Contracts",active.length,T.accent,"4 sites"],
          ["Avg Health",`${avgHealth}%`,hc(avgHealth),"1 at risk"],
        ].map(([l,v,c,s])=>(
          <Card key={l} glow={c}>
            <CB style={{textAlign:"center",padding:"16px 8px"}}>
              <div style={{fontSize:26,fontWeight:900,color:c,lineHeight:1}}>{v}</div>
              <div style={{fontSize:10,color:T.textSub,margin:"4px 0 3px",lineHeight:1.3}}>{l}</div>
              <div style={{fontSize:10,color:c,fontWeight:700}}>{s}</div>
            </CB>
          </Card>
        ))}
      </div>

      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {[["overview","Overview"],["contracts","Contracts"],["labor","Labor"],["compliance","Compliance"],["predictive","Predictive"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?T.accentGlow:T.raised,border:`1px solid ${tab===t?T.accentB:T.border}`,color:tab===t?T.accent:T.textSub,padding:"8px 14px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>{l}</button>
        ))}
      </div>

      {tab==="overview"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card glow={T.purple}>
            <CB>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div>
                  <div style={{fontSize:10,color:T.purple,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>AI Executive Briefing</div>
                  <div style={{fontSize:14,fontWeight:800,color:T.text,marginTop:3}}>Today's Intelligence Summary</div>
                </div>
                <button onClick={genBrief} disabled={loadBrief} style={{background:T.purpleGlow,border:`1px solid ${T.purple}40`,color:T.purple,padding:"9px 14px",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:12,opacity:loadBrief?.6:1}}>
                  <span style={{display:"flex",alignItems:"center",gap:5}}>{loadBrief&&<Cpu size={12} strokeWidth={2}/>}{loadBrief?"Generating…":"Generate"}</span>
                </button>
              </div>
              {briefing
                ?<div style={{fontSize:13,color:T.text,lineHeight:1.75,background:T.raised,borderRadius:10,padding:"14px 16px"}}>{briefing}</div>
                :<div style={{fontSize:13,color:T.textSub,background:T.raised,borderRadius:10,padding:"14px 16px",lineHeight:1.6}}>Click Generate for an AI executive briefing with live financial performance, operational status, compliance risk, and strategic recommendations.</div>
              }
            </CB>
          </Card>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
            <Card>
              <CB>
                <SH title="Revenue by Contract"/>
                {active.map(c=>(
                  <div key={c.id} style={{marginBottom:11}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,color:T.text,fontWeight:600}}>{c.client.split(" ")[0]}</span>
                      <span style={{fontSize:11,color:T.green,fontWeight:700}}>${(c.monthly/1000).toFixed(0)}k/mo</span>
                    </div>
                    <PBar value={c.monthly} max={Math.max(...CONTRACTS.map(x=>x.monthly))} color={T.green}/>
                  </div>
                ))}
              </CB>
            </Card>
            <Card>
              <CB>
                <SH title="Gross Margin by Contract"/>
                {active.map(c=>(
                  <div key={c.id} style={{marginBottom:11}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,color:T.text,fontWeight:600}}>{c.client.split(" ")[0]}</span>
                      <span style={{fontSize:11,color:hc(c.margin*2+50),fontWeight:700}}>{c.margin}%</span>
                    </div>
                    <PBar value={c.margin} max={40} color={hc(c.margin*2+50)}/>
                  </div>
                ))}
              </CB>
            </Card>
          </div>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:10}}>
            {[
              ["Officers Active",`${OFFICERS.filter(o=>o.status!=="Off Duty").length}/6`,T.accent],
              ["Open Incidents",INCIDENTS.filter(i=>i.status==="Active"||i.status==="Under Review").length,T.red],
              ["Patrol Completion","94%",T.green],
              ["Compliance Overdue",COMPLIANCE_ITEMS.filter(c=>c.status==="Overdue").length,T.amber],
            ].map(([l,v,c])=>(
              <Card key={l} glow={c}>
                <CB style={{textAlign:"center",padding:"14px 8px"}}>
                  <div style={{fontSize:22,fontWeight:900,color:c}}>{v}</div>
                  <div style={{fontSize:9,color:T.textSub,marginTop:3,lineHeight:1.3}}>{l}</div>
                </CB>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab==="contracts"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {CONTRACTS.map(c=>(
            <Card key={c.id}>
              <CB>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:c.status==="Active"?10:0}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:800,color:T.text}}>{c.client}</div>
                    <div style={{fontSize:10,color:T.textSub,marginTop:2}}>{c.id} · {c.sites} site{c.sites!==1?"s":""} · {c.officers} officers · {c.start} – {c.end}</div>
                  </div>
                  <Pill label={c.status} color={c.status==="Active"?T.green:c.status==="Prospecting"?T.accent:T.amber}/>
                </div>
                {c.status==="Active"&&(
                  <>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:isMobile?4:6,marginBottom:10}}>
                      {[["Revenue",`$${c.monthly.toLocaleString()}`,T.text],["Cost",`$${c.cost.toLocaleString()}`,T.amber],["Profit",`$${c.profit.toLocaleString()}`,T.green],["Margin",`${c.margin}%`,hc(c.margin*2+50)]].map(([l,v,col])=>(
                        <div key={l} style={{background:T.raised,borderRadius:7,padding:"8px 10px",textAlign:"center"}}>
                          <div style={{fontSize:13,fontWeight:800,color:col}}>{v}</div>
                          <div style={{fontSize:9,color:T.textDim,marginTop:2}}>{l}</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:10,color:T.textSub}}>Contract Health Score</span>
                        <span style={{fontSize:10,color:hc(c.health),fontWeight:700}}>{c.health}%</span>
                      </div>
                      <PBar value={c.health} max={100} color={hc(c.health)}/>
                    </div>
                  </>
                )}
              </CB>
            </Card>
          ))}
        </div>
      )}

      {tab==="labor"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:isMobile?6:10}}>
            {[["Weekly Labor Est.",`$${Math.round(totalCost/4.3).toLocaleString()}`,T.amber],["OT Hours (Week)",`${TIMESHEETS.reduce((a,t)=>a+t.otHrs,0).toFixed(1)}h`,T.red],["Avg Hourly Rate","$24.50",T.accent]].map(([l,v,c])=>(
              <Card key={l} glow={c}>
                <CB style={{textAlign:"center",padding:"14px 10px"}}>
                  <div style={{fontSize:22,fontWeight:900,color:c}}>{v}</div>
                  <div style={{fontSize:10,color:T.textSub,marginTop:3}}>{l}</div>
                </CB>
              </Card>
            ))}
          </div>
          <Card>
            <CB>
              <SH title="Labor Cost by Site"/>
              {active.map(c=>(
                <div key={c.id} style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:12,color:T.text,fontWeight:600}}>{c.client}</span>
                    <div style={{display:"flex",gap:14}}>
                      <span style={{fontSize:11,color:T.amber}}>Cost ${c.cost.toLocaleString()}</span>
                      <span style={{fontSize:11,color:T.green}}>Rev ${c.monthly.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{height:8,background:T.border,borderRadius:4,overflow:"hidden",position:"relative"}}>
                    <div style={{position:"absolute",height:"100%",width:`${Math.round(c.monthly/totalRev*100)}%`,background:T.green,borderRadius:4}}/>
                    <div style={{position:"absolute",height:"100%",width:`${Math.round(c.cost/totalRev*100)}%`,background:T.amber,borderRadius:4}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"flex-end",marginTop:2}}>
                    <span style={{fontSize:10,color:hc(c.margin*2+50),fontWeight:700}}>{c.margin}% margin</span>
                  </div>
                </div>
              ))}
            </CB>
          </Card>
          <Card>
            <CB>
              <SH title="Officer Hours — Current Week"/>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {TIMESHEETS.map(ts=>(
                  <div key={ts.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:T.raised,borderRadius:9}}>
                    <Av initials={ts.badge.slice(-4)} color={ts.otHrs>0?T.amber:T.accent} size={32}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:12,fontWeight:700,color:T.text}}>{ts.officer}</span>
                        <span style={{fontSize:11,color:ts.otHrs>0?T.red:T.text,fontWeight:700}}>{ts.totalHrs.toFixed(1)}h{ts.otHrs>0?` +${ts.otHrs}OT`:""}</span>
                      </div>
                      <PBar value={ts.totalHrs} max={65} color={ts.otHrs>0?T.amber:T.accent}/>
                    </div>
                  </div>
                ))}
              </div>
            </CB>
          </Card>
        </div>
      )}

      {tab==="compliance"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:10}}>
            {[
              ["Overdue",COMPLIANCE_ITEMS.filter(c=>c.status==="Overdue").length,T.red],
              ["Due Soon",COMPLIANCE_ITEMS.filter(c=>c.status==="Due Soon").length,T.amber],
              ["Pending",COMPLIANCE_ITEMS.filter(c=>c.status==="Pending").length,T.gold],
              ["Upcoming",COMPLIANCE_ITEMS.filter(c=>c.status==="Upcoming").length,T.textSub],
            ].map(([l,v,c])=>(
              <Card key={l} glow={c}>
                <CB style={{textAlign:"center",padding:"14px 10px"}}>
                  <div style={{fontSize:24,fontWeight:900,color:c}}>{v}</div>
                  <div style={{fontSize:10,color:T.textSub,marginTop:3}}>{l}</div>
                </CB>
              </Card>
            ))}
          </div>
          <Card>
            <CB>
              <SH title="Compliance Action Items"/>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {COMPLIANCE_ITEMS.map(ci=>{
                  const sc=ci.status==="Overdue"?T.red:ci.status==="Due Soon"?T.amber:ci.status==="Pending"?T.gold:T.accent;
                  return(
                    <div key={ci.id} style={{background:T.raised,borderRadius:9,padding:"11px 14px",borderLeft:`3px solid ${sc}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:3}}>
                        <div style={{flex:1,minWidth:0,marginRight:10}}>
                          <div style={{fontSize:12,fontWeight:700,color:T.text}}>{ci.title}</div>
                          <div style={{fontSize:10,color:T.textSub,marginTop:1}}>{ci.category} · {ci.assignee} · Due: {ci.dueDate}</div>
                        </div>
                        <Pill label={ci.status} color={sc}/>
                      </div>
                      <div style={{fontSize:11,color:T.textDim,marginTop:4,lineHeight:1.4}}>{ci.notes}</div>
                    </div>
                  );
                })}
              </div>
            </CB>
          </Card>
        </div>
      )}

      {tab==="predictive"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card>
            <CB>
              <SH title="7-Day Predictive Staffing Heatmap"/>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr>
                      <th style={{textAlign:"left",padding:"6px 10px",color:T.textSub,fontWeight:600,width:110}}>Site</th>
                      {FORECAST_DAYS.map(d=><th key={d} style={{textAlign:"center",padding:"6px 8px",color:T.textSub,fontWeight:600}}>{d}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {FORECAST_SITES.map((site,si)=>(
                      <tr key={site}>
                        <td style={{padding:"7px 10px",color:T.text,fontWeight:600,fontSize:11}}>{site}</td>
                        {FORECAST_GRID[si].map((v,di)=>{
                          const bg=v>=4?T.red+"33":v===3?T.amber+"33":T.green+"33";
                          const col=v>=4?T.red:v===3?T.amber:T.green;
                          return<td key={di} style={{textAlign:"center",padding:"7px 8px"}}><span style={{display:"inline-block",width:32,height:24,lineHeight:"24px",borderRadius:5,background:bg,color:col,fontWeight:700,fontSize:12}}>{v}</span></td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{fontSize:10,color:T.textSub,marginTop:6}}>Officers needed · Green=2 · Amber=3 · Red=4+</div>
              </div>
            </CB>
          </Card>
          <Card>
            <CB>
              <SH title="AI Workforce Performance Scoring"/>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {AI_SCORES.map(a=>{
                  const sc=a.score>=85?T.green:a.score>=70?T.amber:T.red;
                  const trendCol=a.trend.startsWith("+")?T.green:a.trend==="0"?T.textSub:T.red;
                  return(
                    <div key={a.badge} style={{display:"flex",alignItems:"center",gap:12,background:T.raised,borderRadius:9,padding:"10px 13px"}}>
                      <Av initials={a.badge.slice(-4)} color={sc} size={34}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                          <span style={{fontSize:12,fontWeight:700,color:T.text}}>{a.officer}</span>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontSize:11,color:trendCol,fontWeight:700}}>{a.trend}</span>
                            <span style={{fontSize:18,fontWeight:900,color:sc}}>{a.score}</span>
                          </div>
                        </div>
                        <PBar value={a.score} max={100} color={sc}/>
                        <div style={{fontSize:10,color:T.textDim,marginTop:4}}>{a.factors}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CB>
          </Card>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
            {FORECAST_RISK.map(r=>(
              <Card key={r.site} glow={r.color}>
                <CB>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div>
                      <div style={{fontSize:10,color:r.color,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>Site Risk Forecast</div>
                      <div style={{fontSize:14,fontWeight:800,color:T.text,marginTop:3}}>{r.site}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:28,fontWeight:900,color:r.color,lineHeight:1}}>{r.risk}</div>
                      <div style={{fontSize:10,color:T.textSub,marginTop:2}}>Risk Score</div>
                    </div>
                  </div>
                  <PBar value={r.risk} max={100} color={r.color}/>
                  <div style={{marginTop:9,display:"flex",flexDirection:"column",gap:4}}>
                    {r.factors.map((f,i)=>(
                      <div key={i} style={{fontSize:11,color:T.textSub,display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:5,height:5,borderRadius:"50%",background:r.color,flexShrink:0}}/>  {f}
                      </div>
                    ))}
                  </div>
                </CB>
              </Card>
            ))}
          </div>
          <Card glow={T.accent}>
            <CB>
              <SH title="Digital Twin — Operational State"/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
                {[
                  {label:"Active Sites",value:"4",sub:"All systems nominal",color:T.green},
                  {label:"Officers On-Duty",value:"18",sub:"2 in transit",color:T.accent},
                  {label:"Patrol Coverage",value:"94%",sub:"+6% vs baseline",color:T.green},
                  {label:"System Health",value:"99.2%",sub:"Uptime last 30d",color:T.accent},
                  {label:"Open Incidents",value:"2",sub:"1 elevated (Plaza West)",color:T.amber},
                  {label:"AI Confidence",value:"87%",sub:"Forecast accuracy",color:T.purple},
                ].map(d=>(
                  <div key={d.label} style={{background:T.raised,borderRadius:9,padding:"12px 14px"}}>
                    <div style={{fontSize:10,color:T.textSub,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>{d.label}</div>
                    <div style={{fontSize:22,fontWeight:900,color:d.color}}>{d.value}</div>
                    <div style={{fontSize:10,color:T.textDim,marginTop:2}}>{d.sub}</div>
                  </div>
                ))}
              </div>
            </CB>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TIMEKEEPING MODULE
// ─────────────────────────────────────────────────────────────────
function TimekeepingModule({user,showToast,isMobile}){
  const[tab,setTab]=useState("timesheets");
  const[sheets,setSheets]=useState(TIMESHEETS);
  const[expanded,setExpanded]=useState(null);
  const[clockedIn,setClockedIn]=useState(false);
  const[clockTime,setClockTime]=useState(null);
  const[gps,setGps]=useState(null);
  const[gpsErr,setGpsErr]=useState(null);
  const[site,setSite]=useState("Northgate Tower");
  const[elapsed,setElapsed]=useState(0);
  const timerRef=useRef(null);

  useEffect(()=>{
    if(clockedIn){timerRef.current=setInterval(()=>setElapsed(e=>e+1),1000);}
    else{clearInterval(timerRef.current);}
    return()=>clearInterval(timerRef.current);
  },[clockedIn]);

  const fmtHM=(s)=>{const h=Math.floor(s/3600),m=Math.floor((s%3600)/60);return h>0?`${h}h ${String(m).padStart(2,"0")}m`:`${String(m).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;};

  const today=()=>new Date().toISOString().slice(0,10);
  const mkExport=(header,rowFn,file,toast,action)=>()=>{
    dlCSV([header,...sheets.map(rowFn)],file());
    showToast(toast,"success");
    logAction(user,action,`${sheets.length} records`);
  };
  const exportCSV=mkExport(
    ["Officer","Badge","Week","Mon","Tue","Wed","Thu","Fri","Total Hrs","OT Hrs","Status"],
    ts=>[ts.officer,ts.badge,ts.week,...ts.days.map(d=>d.hrs.toFixed(2)),ts.totalHrs.toFixed(2),ts.otHrs.toFixed(2),ts.status],
    ()=>`shieldsync_payroll_${today()}.csv`,
    "Payroll CSV exported","PAYROLL_EXPORT"
  );
  const exportADP=mkExport(
    ["Co Code","Batch ID","File #","Employee Name","Reg Hours","OT Hours","Other Hours","Earnings 3 Code","Earnings 3 Amt","Deduction 1 Code","Deduction 1 Amt"],
    (ts,i)=>["SS01",`W${today().replace(/-/g,"")}`,String(1000+i).padStart(5,"0"),ts.officer,Math.max(0,ts.totalHrs-ts.otHrs).toFixed(2),ts.otHrs.toFixed(2),"0","","","",""],
    ()=>`adp_import_${today()}.csv`,
    "ADP Workforce Now export ready","PAYROLL_EXPORT_ADP"
  );
  const exportPaylocity=mkExport(
    ["EmployeeID","EmployeeName","PayPeriodEnd","RegularHours","OvertimeHours","Department","CostCenter","Notes"],
    (ts,i)=>[`SS${String(i+1).padStart(4,"0")}`,ts.officer,ts.week,Math.max(0,ts.totalHrs-ts.otHrs).toFixed(2),ts.otHrs.toFixed(2),"Security Operations","OPS-001",ts.status],
    ()=>`paylocity_import_${today()}.csv`,
    "Paylocity import file ready","PAYROLL_EXPORT_PAYLOCITY"
  );

  const[geofenceStatus,setGeofenceStatus]=useState(null);
  const haversineM=(lat1,lng1,lat2,lng2)=>{
    const R=6371000,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180;
    const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  };

  const clockIn=()=>{
    const doClockIn=(gpsData,gfStatus)=>{
      setClockedIn(true);setClockTime(new Date());setElapsed(0);setGeofenceStatus(gfStatus);
      if(gpsData)setGps(gpsData);
      if(gfStatus==="outside")showToast(`Outside ${site} geofence — location noted`,"info");
      else showToast(`Clocked in at ${site}`,"success");
      logAction(user,"CLOCK_IN",`GPS clock-in at ${site}${gfStatus?" (geofence:"+gfStatus+")":""}`);
    };
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(
        pos=>{
          const lat=pos.coords.latitude,lng=pos.coords.longitude;
          const fence=SITE_COORDS[site];
          if(fence){
            const dist=Math.round(haversineM(lat,lng,fence.lat,fence.lng));
            const inside=dist<=fence.radius;
            setGps({lat:lat.toFixed(4),lng:lng.toFixed(4),dist,radius:fence.radius});
            doClockIn(null,inside?"inside":"outside");
          }else{
            setGps({lat:lat.toFixed(4),lng:lng.toFixed(4)});
            doClockIn(null,"verified");
          }
        },
        ()=>{setGpsErr("GPS unavailable — location unverified");doClockIn(null,"unavailable");}
      );
    }else{
      setGpsErr("Geolocation not supported");doClockIn(null,"unavailable");
    }
  };

  const clockOut=()=>{
    const hrs=(elapsed/3600).toFixed(2);
    setClockedIn(false);setClockTime(null);setGps(null);setGpsErr(null);setElapsed(0);
    showToast(`Clocked out · ${hrs} hours recorded`,"success");
    logAction(user,"CLOCK_OUT",`${hrs}h at ${site}`);
  };

  const approveSheet=(id)=>{
    setSheets(s=>s.map(ts=>ts.id===id?{...ts,days:ts.days.map(d=>({...d,status:"Approved"})),status:"Approved"}:ts));
    showToast("Timesheet approved","success");
    logAction(user,"TIMESHEET_APPROVE",id);
  };

  const totalHrs=sheets.reduce((a,t)=>a+t.totalHrs,0);
  const totalOT=sheets.reduce((a,t)=>a+t.otHrs,0);
  const pendingCnt=sheets.filter(t=>t.status!=="Approved").length;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:10}}>
        {[
          ["Total Hours (Week)",totalHrs.toFixed(1),T.accent],
          ["Overtime Hours",totalOT.toFixed(2),T.red],
          ["Pending Approval",pendingCnt,T.amber],
          ["Payroll Estimate",`$${(totalHrs*24.5).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,",")}`,T.green],
        ].map(([l,v,c])=>(
          <Card key={l} glow={c}>
            <CB style={{textAlign:"center",padding:"14px 10px"}}>
              <div style={{fontSize:22,fontWeight:900,color:c,lineHeight:1}}>{v}</div>
              <div style={{fontSize:10,color:T.textSub,marginTop:4}}>{l}</div>
            </CB>
          </Card>
        ))}
      </div>

      <div style={{display:"flex",gap:6,justifyContent:"space-between",flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",gap:5}}>
          {[["timesheets","Timesheets"],["clockin","GPS Clock In"],["overtime","Overtime"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?T.accentGlow:T.raised,border:`1px solid ${tab===t?T.accentB:T.border}`,color:tab===t?T.accent:T.textSub,padding:"8px 13px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>{l}</button>
          ))}
        </div>
        <button onClick={exportCSV} style={{background:T.greenGlow,border:`1px solid ${T.greenB}`,color:T.green,padding:"9px 14px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>↓ Export Payroll CSV</button>
      </div>

      {tab==="timesheets"&&(
        <Card>
          <CB>
            <SH title="Timesheets — Week of Jun 1, 2026"/>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {sheets.map(ts=>(
                <div key={ts.id}>
                  <div onClick={()=>setExpanded(expanded===ts.id?null:ts.id)} style={{background:T.raised,borderRadius:10,padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
                    <Av initials={ts.badge.slice(-4)} color={ts.otHrs>0?T.amber:T.accent} size={34}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <span style={{fontSize:13,fontWeight:700,color:T.text}}>{ts.officer}</span>
                        <span style={{fontSize:12,color:ts.otHrs>0?T.red:T.text,fontWeight:700}}>{ts.totalHrs.toFixed(1)}h{ts.otHrs>0?` · +${ts.otHrs}OT`:""}</span>
                      </div>
                      <PBar value={ts.totalHrs} max={65} color={ts.otHrs>0?T.amber:T.accent}/>
                    </div>
                    <Pill label={ts.status} color={ts.status==="Approved"?T.green:ts.status==="Pending"?T.amber:T.accent}/>
                    <span style={{color:T.textDim,flexShrink:0}}>{expanded===ts.id?<ChevronUp size={13} strokeWidth={2}/>:<ChevronDown size={13} strokeWidth={2}/>}</span>
                  </div>
                  {expanded===ts.id&&(
                    <div style={{background:T.card,border:`1px solid ${T.border}`,borderTop:"none",borderRadius:"0 0 10px 10px",padding:"12px 14px"}}>
                      <div style={{overflowX:"auto"}}>
                        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:460}}>
                          <thead>
                            <tr style={{borderBottom:`1px solid ${T.border}`}}>
                              {["Day","In","Out","Hours","OT","Site","Status"].map(h=>(
                                <th key={h} style={{padding:"6px 8px",color:T.textSub,fontWeight:700,textAlign:"left",whiteSpace:"nowrap"}}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {ts.days.map(d=>(
                              <tr key={d.d} style={{borderBottom:`1px solid ${T.border}20`}}>
                                <td style={{padding:"7px 8px",color:T.text,fontWeight:600}}>{d.d}</td>
                                <td style={{padding:"7px 8px",color:T.textSub,fontFamily:"monospace"}}>{d.in}</td>
                                <td style={{padding:"7px 8px",color:T.textSub,fontFamily:"monospace"}}>{d.out}</td>
                                <td style={{padding:"7px 8px",color:T.text,fontWeight:700}}>{d.hrs.toFixed(2)}</td>
                                <td style={{padding:"7px 8px",color:d.ot>0?T.red:T.textDim,fontWeight:d.ot>0?700:400}}>{d.ot>0?"+"+d.ot.toFixed(2):"—"}</td>
                                <td style={{padding:"7px 8px",color:T.textSub,whiteSpace:"nowrap"}}>{d.site.split(" ")[0]}</td>
                                <td style={{padding:"7px 8px"}}><Pill label={d.status} color={d.status==="Approved"?T.green:T.amber}/></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {ts.status!=="Approved"&&(
                        <button onClick={()=>approveSheet(ts.id)} style={{marginTop:10,background:T.green,border:"none",color:"#000",padding:"10px",borderRadius:9,cursor:"pointer",fontWeight:800,fontSize:12,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Check size={13} strokeWidth={2.5}/>Approve All Shifts</button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CB>
        </Card>
      )}

      {tab==="clockin"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card glow={clockedIn?T.green:T.accent}>
            <CB style={{textAlign:"center",padding:"28px 24px"}}>
              <div style={{marginBottom:12,display:"flex",justifyContent:"center"}}>{clockedIn?<CheckCircle2 size={44} color={T.green} strokeWidth={1.5}/>:<Clock size={44} color={T.accent} strokeWidth={1.5}/>}</div>
              <div style={{fontSize:20,fontWeight:900,color:clockedIn?T.green:T.text,marginBottom:6}}>
                {clockedIn?`On Duty — ${site}`:"Ready to Clock In"}
              </div>
              {clockedIn&&<div style={{fontSize:36,fontWeight:900,color:T.green,fontFamily:"monospace",marginBottom:6,letterSpacing:"-0.02em"}}>{fmtHM(elapsed)}</div>}
              {clockedIn&&clockTime&&<div style={{fontSize:12,color:T.textSub,marginBottom:10}}>Since {clockTime.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>}
              {gps&&<div style={{fontSize:11,color:T.accent,marginBottom:4,display:"flex",alignItems:"center",gap:4,justifyContent:"center"}}><MapPin size={10} strokeWidth={2}/>{gps.lat}, {gps.lng}{gps.dist!==undefined?` · ${gps.dist}m from site`:""}</div>}
              {gps&&gps.dist!==undefined&&(
                <div style={{fontSize:11,fontWeight:700,color:gps.dist<=gps.radius?T.green:T.red,marginBottom:8,background:gps.dist<=gps.radius?T.greenB:T.redGlow,border:`1px solid ${gps.dist<=gps.radius?T.greenB:T.redB}`,borderRadius:8,padding:"4px 10px",display:"inline-block"}}>
                  {gps.dist<=gps.radius?`Inside ${site} geofence (${gps.radius}m radius)`:`Outside geofence — ${gps.dist}m (max ${gps.radius}m)`}
                </div>
              )}
              {gpsErr&&<div style={{fontSize:11,color:T.amber,marginBottom:8,display:"flex",alignItems:"center",gap:5}}><AlertTriangle size={11} color={T.amber} strokeWidth={2}/>{gpsErr}</div>}
              {!clockedIn&&(
                <div style={{marginBottom:16,textAlign:"left"}}>
                  <label style={{fontSize:11,color:T.textSub,fontWeight:700,display:"block",marginBottom:6}}>Deployment Site</label>
                  <select value={site} onChange={e=>setSite(e.target.value)} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 14px",color:T.text,fontSize:13,outline:"none",WebkitAppearance:"none"}}>
                    {["Northgate Tower","Harbor Logistics","Plaza West","Eastside Mall"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <button onClick={clockedIn?clockOut:clockIn} style={{background:clockedIn?T.red:`linear-gradient(135deg,${T.green},${T.accentH})`,border:"none",color:clockedIn?"#fff":"#000",padding:"15px 32px",borderRadius:12,cursor:"pointer",fontWeight:900,fontSize:15,width:"100%"}}>
                <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>{clockedIn?<><X size={16} strokeWidth={2.5}/>Clock Out</>:<><Timer size={16} strokeWidth={2}/>GPS Clock In</>}</span>
              </button>
            </CB>
          </Card>
          <Card>
            <CB>
              <SH title="Payroll Integration Frameworks"/>
              {[
                ["Paylocity","CSV export ready — compatible with Paylocity Import","Export",T.green,exportPaylocity],
                ["ADP Workforce Now","ADP-format CSV — compatible with ADP import wizard","Export",T.green,exportADP],
                ["UKG Pro","REST API integration — configure credentials in Settings","Configure",T.amber,null],
                ["QuickBooks Payroll","Accounting integration available in v2.0","Planned",T.textDim,null],
              ].map(([p,d,s,c,fn])=>(
                <div key={p} style={{display:"flex",alignItems:"center",gap:12,background:T.raised,borderRadius:9,padding:"11px 14px",marginBottom:6}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.text}}>{p}</div>
                    <div style={{fontSize:10,color:T.textSub,marginTop:2}}>{d}</div>
                  </div>
                  {fn
                    ?<button onClick={fn} style={{background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,padding:"6px 12px",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:11,whiteSpace:"nowrap"}}>{s}</button>
                    :<span style={{fontSize:11,color:c,fontWeight:700,whiteSpace:"nowrap"}}>{s}</span>
                  }
                </div>
              ))}
            </CB>
          </Card>
        </div>
      )}

      {tab==="overtime"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {totalOT===0?(
            <Card><CB style={{textAlign:"center",padding:"32px",color:T.textSub,fontSize:13}}><div style={{marginBottom:12,display:"flex",justifyContent:"center"}}><CheckCircle2 size={36} color={T.green} strokeWidth={1.5}/></div>No overtime this week. All officers within standard hours.</CB></Card>
          ):(
            <>
              <div style={{background:T.redGlow,border:`1px solid ${T.redB}`,borderRadius:10,padding:"12px 16px",display:"flex",gap:10,alignItems:"center"}}>
                <AlertTriangle size={18} color={T.red} strokeWidth={2}/>
                <div style={{fontSize:12,color:T.red,fontWeight:700}}>
                  {sheets.filter(t=>t.otHrs>0).length} officer{sheets.filter(t=>t.otHrs>0).length!==1?"s":""} with overtime this week · Total: {totalOT.toFixed(2)}h OT · Premium est. ${(totalOT*12.25).toFixed(2)}
                </div>
              </div>
              <Card>
                <CB>
                  <SH title="Overtime Review Queue"/>
                  {sheets.filter(t=>t.otHrs>0).map(ts=>(
                    <div key={ts.id} style={{background:T.raised,borderRadius:10,padding:"14px",marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:T.text}}>{ts.officer}</div>
                          <div style={{fontSize:10,color:T.textSub}}>{ts.badge}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:14,fontWeight:800,color:T.red}}>{ts.otHrs}h OT</div>
                          <div style={{fontSize:10,color:T.textSub}}>Premium: ${(ts.otHrs*12.25).toFixed(2)}</div>
                        </div>
                      </div>
                      {ts.days.filter(d=>d.ot>0).map(d=>(
                        <div key={d.d} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",background:T.card,borderRadius:6,marginBottom:3}}>
                          <span style={{fontSize:11,color:T.textSub}}>{d.d} · {d.in}–{d.out}</span>
                          <span style={{fontSize:11,color:T.red,fontWeight:700}}>+{d.ot.toFixed(2)}h OT</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </CB>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// AI COMMAND CENTER
// ─────────────────────────────────────────────────────────────────
const ADVISORS={
  operations:{label:"Operations",icon:Zap,color:T.accent,
    system:"You are ShieldSync AI Operations Advisor. Analyze patrol completion, incident response, checkpoint compliance, and dispatch efficiency. Context: 5 officers, 4 sites, 94% patrol rate, 2 open incidents, 4.2min avg response. Be tactical and data-driven. Max 4 sentences.",
    quick:["What needs immediate attention?","Analyze patrol gaps","Dispatch priority","Site risk ranking"],
    alerts:AI_INSIGHTS.filter(a=>a.priority==="critical"||a.priority==="high"),
  },
  workforce:{label:"Workforce",icon:Users,color:T.gold,
    system:"You are ShieldSync AI Workforce Advisor. Analyze officer performance, scheduling, fatigue risk, and training compliance. Context: 6 officers, 1 expired cert, 2.68 OT hours, 2 pending leave requests. Be direct.",
    quick:["Flag fatigue risks","Scheduling gaps","Top performer analysis","Cert compliance status"],
    alerts:TRAINING_DATA.filter(t=>t.status==="Expired").map(t=>({text:`Expired certification: ${t.cert} — ${t.officer}. Requires immediate renewal.`,priority:"critical"})),
  },
  compliance:{label:"Compliance",icon:CheckCircle2,color:T.green,
    system:"You are ShieldSync AI Compliance Advisor. Track cert expiry, contract renewals, policy acknowledgments, and audit schedules. Focus on risk mitigation and legal compliance. 2 overdue certs, 1 expired contract, Q2 audit pending.",
    quick:["What's overdue?","Audit readiness check","Renewal priorities","Policy acknowledgment status"],
    alerts:COMPLIANCE_ITEMS.filter(c=>c.status==="Overdue").map(c=>({text:c.title+": "+c.notes,priority:"critical"})),
  },
  risk:{label:"Risk",icon:ShieldAlert,color:T.red,
    system:"You are ShieldSync AI Risk Advisor. Identify operational, personnel, financial, and compliance risks. Provide risk scores and mitigation strategies. Current risk score: 6.2/10 (elevated). Be concise and prioritized.",
    quick:["Current risk score?","Top 3 risk factors","Mitigation priorities","Financial exposure"],
    alerts:AI_INSIGHTS.filter(a=>a.priority==="critical").slice(0,2),
  },
  executive:{label:"Executive",icon:BarChart3,color:T.purple,
    system:"You are ShieldSync AI Executive Advisor. Provide strategic insights on financial performance, business development, and contract health. Monthly revenue $96,750, margin 27%, 4 active contracts. Be executive-level strategic.",
    quick:["Executive summary","Revenue growth opportunities","Contract renewal risks","Strategic priorities"],
    alerts:[{text:"Q2 revenue tracking 8% above prior quarter driven by Northgate contract optimization.",priority:"info"},{text:"CTR-003 Plaza West REIT expired June 1 — client relationship requires immediate executive outreach.",priority:"critical"}],
  },
};

function AICommandCenter({isMobile}){
  const[adv,setAdv]=useState("operations");
  const cfg=ADVISORS[adv];
  const[allMsgs,setAllMsgs]=useState({operations:[],workforce:[],compliance:[],risk:[],executive:[]});
  const[inp,setInp]=useState("");
  const[loading,setLoading]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[allMsgs,loading]);
  const curMsgs=allMsgs[adv]||[];

  const send=useCallback(async(txt)=>{
    const msg=(txt||inp).trim();
    if(!msg||loading)return;
    setInp("");
    const next=[...curMsgs,{role:"user",text:msg}];
    setAllMsgs(m=>({...m,[adv]:next}));
    setLoading(true);
    try{
      const reply=await callAI(next.map(m=>({role:m.role==="ai"?"assistant":"user",content:m.text})),cfg.system,700);
      setAllMsgs(m=>({...m,[adv]:[...next,{role:"ai",text:reply||"No response."}]}));
    }catch{
      const fallbacks={operations:"Plaza West remains highest priority — INC-2847 pattern and 2 missed checkpoints indicate elevated risk. Recommend immediate patrol sweep and backup deployment to support Theo Okafor.",workforce:"2 expired certifications require immediate HR action before next deployment cycle. Jordan Park's 2.25h overtime from Tuesday needs supervisor review and approval.",compliance:"3 overdue compliance items on record: 2 expired officer certifications and 1 expired client contract. Escalate to management for same-day action.",risk:"Current risk score 6.2/10 elevated by Plaza West activity, compliance gaps, and fleet maintenance backlog. Priority mitigation: backup dispatch, cert renewals, contract renewal.",executive:"Q2 performance strong at 27% margin. Immediate priority: recover Plaza West contract before 30-day lapse creates client churn. Harbor Logistics margin at 15% needs renegotiation in next renewal cycle."};
      setAllMsgs(m=>({...m,[adv]:[...next,{role:"ai",text:`[Demo Mode] ${cfg.label} Advisor: ${fallbacks[adv]||"Based on current data, operations are performing at expected levels with targeted improvement opportunities identified."}`}]}));
    }
    setLoading(false);
  },[inp,curMsgs,loading,adv,cfg]);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?3:5},1fr)`,gap:isMobile?6:8}}>
        {Object.entries(ADVISORS).map(([key,c])=>(
          <button key={key} onClick={()=>{setAdv(key);setInp("");}} style={{background:adv===key?`${c.color}15`:T.raised,border:`1px solid ${adv===key?c.color+"45":T.border}`,borderRadius:10,padding:"12px 6px",cursor:"pointer",textAlign:"center",transition:"all 0.15s"}}>
            <div style={{marginBottom:4,display:"flex",justifyContent:"center"}}><c.icon size={20} color={adv===key?c.color:T.textSub} strokeWidth={1.8}/></div>
            <div style={{fontSize:9,color:adv===key?c.color:T.textSub,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.04em",lineHeight:1.3}}>{c.label}</div>
          </button>
        ))}
      </div>

      <div style={{background:`linear-gradient(135deg,${cfg.color}12,${cfg.color}05)`,border:`1px solid ${cfg.color}28`,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:44,height:44,borderRadius:12,background:`${cfg.color}12`,border:`1px solid ${cfg.color}35`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><cfg.icon size={22} color={cfg.color} strokeWidth={1.8}/></div>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:800,color:T.text}}>{cfg.label} Advisor</div>
          <div style={{fontSize:11,color:T.textSub,marginTop:2}}>AI-powered · Real-time intelligence · Security operations specialist</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:cfg.color,animation:"ssB 1.2s infinite"}}/>
          <span style={{fontSize:10,color:cfg.color,fontWeight:700}}>ONLINE</span>
        </div>
      </div>

      {cfg.alerts.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {cfg.alerts.slice(0,3).map((a,i)=>{
            const ac=a.priority==="critical"?T.red:a.priority==="high"?T.amber:a.priority==="info"?T.accent:T.gold;
            return(
              <div key={i} style={{background:`${ac}08`,border:`1px solid ${ac}25`,borderRadius:9,padding:"10px 14px",display:"flex",gap:10,alignItems:"flex-start"}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:ac,marginTop:4,flexShrink:0,animation:a.priority==="critical"?"ssB 1s infinite":"none"}}/>
                <span style={{fontSize:12,color:T.text,lineHeight:1.5,flex:1}}>{a.text}</span>
                <Pill label={a.priority} color={ac}/>
              </div>
            );
          })}
        </div>
      )}

      <Card>
        <CB>
          <div style={{display:"flex",flexDirection:"column",gap:10,minHeight:240,maxHeight:340,overflowY:"auto",marginBottom:10,paddingRight:2}}>
            {curMsgs.length===0&&(
              <div style={{padding:"24px 0",textAlign:"center"}}>
                <div style={{marginBottom:10,display:"flex",justifyContent:"center"}}><cfg.icon size={36} color={cfg.color} strokeWidth={1.5}/></div>
                <div style={{fontSize:13,color:T.textSub,lineHeight:1.6}}>The {cfg.label} Advisor is ready.<br/>Select a quick action or type your question below.</div>
              </div>
            )}
            {curMsgs.map((m,i)=>(
              <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",flexDirection:m.role==="user"?"row-reverse":"row"}}>
                {m.role==="ai"&&<div style={{width:28,height:28,borderRadius:8,flexShrink:0,background:`${cfg.color}18`,border:`1px solid ${cfg.color}35`,display:"flex",alignItems:"center",justifyContent:"center"}}><cfg.icon size={14} color={cfg.color} strokeWidth={2}/></div>}
                <div style={{maxWidth:"85%",padding:"9px 13px",borderRadius:m.role==="user"?"12px 12px 3px 12px":"12px 12px 12px 3px",background:m.role==="user"?`${cfg.color}15`:T.raised,border:`1px solid ${m.role==="user"?cfg.color+"35":T.border}`,fontSize:13,lineHeight:1.6,color:T.text,whiteSpace:"pre-wrap"}}>{m.text}</div>
              </div>
            ))}
            {loading&&(
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <div style={{width:28,height:28,borderRadius:8,background:`${cfg.color}18`,border:`1px solid ${cfg.color}35`,display:"flex",alignItems:"center",justifyContent:"center"}}><cfg.icon size={14} color={cfg.color} strokeWidth={2}/></div>
                <div style={{background:T.raised,borderRadius:12,border:`1px solid ${T.border}`}}><Dots/></div>
              </div>
            )}
            <div ref={endRef}/>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
            {cfg.quick.map(p=>(
              <button key={p} onClick={()=>send(p)} disabled={loading} style={{background:`${cfg.color}10`,border:`1px solid ${cfg.color}28`,color:cfg.color,fontSize:10,fontWeight:700,padding:"5px 10px",borderRadius:6,cursor:"pointer",opacity:loading?.5:1}}>{p}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
              placeholder={`Ask the ${cfg.label} Advisor…`} disabled={loading}
              style={{flex:1,background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 14px",color:T.text,fontSize:13,outline:"none"}}/>
            <button onClick={()=>send()} disabled={loading||!inp.trim()} style={{background:`linear-gradient(135deg,${cfg.color},${cfg.color}95)`,border:"none",borderRadius:10,padding:"10px 16px",color:"#000",fontWeight:800,cursor:"pointer",fontSize:14,opacity:loading||!inp.trim()?.5:1}}>→</button>
          </div>
        </CB>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PROCUREMENT MODULE
// ─────────────────────────────────────────────────────────────────
function ProcurementModule({user,showToast,isMobile}){
  const[tab,setTab]=useState("requests");
  const[reqs,setReqs]=useState(PURCHASE_REQUESTS);
  const[showForm,setShowForm]=useState(false);
  const[form,setForm]=useState({item:"",vendor:"",amount:"",priority:"Medium",notes:""});
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  const sc=(s)=>s==="Approved"||s==="Received"?T.green:s==="Pending"?T.amber:s==="Ordered"?T.accent:T.textSub;
  const totalSpend=VENDORS.reduce((a,v)=>a+v.spend,0);

  const submitReq=()=>{
    if(!form.item||!form.vendor||!form.amount)return;
    const r={id:`PR-${2025+reqs.length}`,item:form.item,vendor:form.vendor,amount:parseFloat(form.amount),requestor:user?.name||"User",dept:"Operations",date:new Date().toISOString().slice(0,10),priority:form.priority,status:"Pending",notes:form.notes};
    setReqs(p=>[r,...p]);
    setShowForm(false);
    setForm({item:"",vendor:"",amount:"",priority:"Medium",notes:""});
    showToast(`Purchase request ${r.id} submitted`,"success");
    logAction(user,"PURCHASE_REQUEST",`${r.item} — $${r.amount}`);
  };

  const approve=(id)=>{
    setReqs(r=>r.map(x=>x.id===id?{...x,status:"Approved"}:x));
    showToast(`${id} approved`,"success");
    logAction(user,"PR_APPROVE",id);
  };

  const valid=form.item&&form.vendor&&form.amount;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:10}}>
        {[
          ["Active Vendors",VENDORS.filter(v=>v.status==="Active").length,T.accent],
          ["Pending Requests",reqs.filter(r=>r.status==="Pending").length,T.amber],
          ["YTD Vendor Spend",`$${(totalSpend/1000).toFixed(0)}k`,T.gold],
          ["Total Assets",ASSET_REGISTER.length,T.green],
        ].map(([l,v,c])=>(
          <Card key={l} glow={c}>
            <CB style={{textAlign:"center",padding:"14px 10px"}}>
              <div style={{fontSize:22,fontWeight:900,color:c,lineHeight:1}}>{v}</div>
              <div style={{fontSize:10,color:T.textSub,marginTop:4}}>{l}</div>
            </CB>
          </Card>
        ))}
      </div>

      <div style={{display:"flex",gap:6,justifyContent:"space-between",flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",gap:5}}>
          {[["requests","Requests"],["vendors","Vendors"],["assets","Assets"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?T.accentGlow:T.raised,border:`1px solid ${tab===t?T.accentB:T.border}`,color:tab===t?T.accent:T.textSub,padding:"8px 13px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>{l}</button>
          ))}
        </div>
        {tab==="requests"&&<button onClick={()=>setShowForm(p=>!p)} style={{background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,padding:"9px 14px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",gap:6}}>{showForm?<><X size={12} strokeWidth={2.5}/>Cancel</>:<><Plus size={12} strokeWidth={2.5}/>New Request</>}</button>}
      </div>

      {tab==="requests"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {showForm&&(
            <Card glow={T.accent}>
              <CB>
                <div style={{fontSize:13,fontWeight:800,color:T.text,marginBottom:14}}>New Purchase Request</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div>
                    <label style={{fontSize:11,color:T.textSub,fontWeight:700,display:"block",marginBottom:5}}>Item / Description *</label>
                    <input value={form.item} onChange={e=>upd("item",e.target.value)} placeholder="e.g. Motorola APX 6000 x4"
                      style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 12px",color:T.text,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:T.textSub,fontWeight:700,display:"block",marginBottom:5}}>Vendor *</label>
                    <select value={form.vendor} onChange={e=>upd("vendor",e.target.value)}
                      style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 12px",color:T.text,fontSize:13,outline:"none",WebkitAppearance:"none"}}>
                      <option value="">Select vendor…</option>
                      {VENDORS.map(v=><option key={v.id} value={v.name}>{v.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:T.textSub,fontWeight:700,display:"block",marginBottom:5}}>Amount ($) *</label>
                    <input type="number" value={form.amount} onChange={e=>upd("amount",e.target.value)} placeholder="0.00"
                      style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 12px",color:T.text,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:T.textSub,fontWeight:700,display:"block",marginBottom:5}}>Priority</label>
                    <select value={form.priority} onChange={e=>upd("priority",e.target.value)}
                      style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 12px",color:T.text,fontSize:13,outline:"none",WebkitAppearance:"none"}}>
                      {["Low","Medium","High","Critical"].map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <textarea value={form.notes} onChange={e=>upd("notes",e.target.value)} placeholder="Business justification and notes…" rows={2}
                  style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 12px",color:T.text,fontSize:13,resize:"none",outline:"none",boxSizing:"border-box",marginBottom:10}}/>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setShowForm(false)} style={{flex:1,background:T.raised,border:`1px solid ${T.border}`,color:T.textSub,padding:"11px",borderRadius:9,cursor:"pointer",fontWeight:600}}>Cancel</button>
                  <button onClick={submitReq} disabled={!valid} style={{flex:2,background:valid?T.accent:T.raised,border:`1px solid ${valid?T.accent:T.border}`,color:valid?"#000":T.textDim,padding:"11px",borderRadius:9,cursor:valid?"pointer":"not-allowed",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}><CheckCircle2 size={14} strokeWidth={2}/>Submit Request</button>
                </div>
              </CB>
            </Card>
          )}
          {reqs.map(r=>(
            <div key={r.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div style={{flex:1,minWidth:0,marginRight:10}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                    <span style={{fontSize:10,color:T.textSub,fontFamily:"monospace"}}>{r.id}</span>
                    <Pill label={r.priority} color={r.priority==="High"||r.priority==="Critical"?T.red:r.priority==="Medium"?T.amber:T.textSub}/>
                  </div>
                  <div style={{fontSize:13,fontWeight:700,color:T.text}}>{r.item}</div>
                  <div style={{fontSize:10,color:T.textSub,marginTop:2}}>{r.vendor} · {r.requestor} · {r.dept} · {r.date}</div>
                  {r.notes&&<div style={{fontSize:11,color:T.textDim,marginTop:4,lineHeight:1.4}}>{r.notes}</div>}
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:4}}>${r.amount.toLocaleString()}</div>
                  <Pill label={r.status} color={sc(r.status)}/>
                </div>
              </div>
              {r.status==="Pending"&&(
                <button onClick={()=>approve(r.id)} style={{marginTop:8,background:T.green,border:"none",color:"#000",padding:"8px",borderRadius:7,cursor:"pointer",fontWeight:800,fontSize:11,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Check size={12} strokeWidth={2.5}/>Approve Request</button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==="vendors"&&(
        <Card>
          <CB>
            <SH title="Vendor Directory"/>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {VENDORS.map(v=>(
                <div key={v.id} style={{background:T.raised,borderRadius:10,padding:"14px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:800,color:T.text}}>{v.name}</div>
                      <div style={{fontSize:10,color:T.textSub,marginTop:2}}>{v.id} · {v.category} · Since {v.since.slice(0,4)}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:11,color:T.amber,fontWeight:700,marginBottom:4}}>YTD: ${v.spend.toLocaleString()}</div>
                      <Pill label={v.status} color={v.status==="Active"?T.green:T.amber}/>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:14,fontSize:11,color:T.textSub,flexWrap:"wrap"}}>
                    <span style={{display:"flex",alignItems:"center",gap:3}}><FileText size={10} strokeWidth={2}/>{v.contracts} contract{v.contracts!==1?"s":""}</span>
                    <span style={{display:"flex",alignItems:"center",gap:3}}><Star size={10} strokeWidth={2}/>{v.rating}/5.0</span>
                    <span style={{display:"flex",alignItems:"center",gap:3}}><Mail size={10} strokeWidth={2}/>{v.contact}</span>
                    <span style={{display:"flex",alignItems:"center",gap:3}}><Phone size={10} strokeWidth={2}/>{v.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          </CB>
        </Card>
      )}

      {tab==="assets"&&(
        <Card>
          <CB>
            <SH title="Asset Register"/>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {ASSET_REGISTER.map(a=>(
                <div key={a.id} style={{display:"flex",gap:12,alignItems:"center",background:T.raised,borderRadius:9,padding:"10px 13px"}}>
                  <div style={{width:32,height:32,borderRadius:8,background:T.accentGlow,border:`1px solid ${T.accentB}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {(()=>{const Ic=a.type==="Vehicle"?Car:a.type==="Radio"?Radio:a.type==="Camera"?Camera:a.type==="CEW"?Zap:a.type==="Medical"?Bandage:Wrench;return <Ic size={14} color={T.accent} strokeWidth={2}/>;})()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.text}}>{a.name}</div>
                    <div style={{fontSize:10,color:T.textSub,marginTop:1}}>{a.id} · {a.type} · {a.serial}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <Pill label={a.status==="Checked Out"||a.status==="In Service"?"In Use":a.status} color={a.status==="Checked Out"||a.status==="In Service"?T.green:a.status==="Available"?T.accent:a.status==="Maintenance"?T.amber:T.textSub}/>
                    <div style={{fontSize:10,color:T.textSub,marginTop:3}}>{a.condition}</div>
                  </div>
                </div>
              ))}
            </div>
          </CB>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────────────────────────
function Sidebar({items,active,onChange,user,onLogout,collapsed,setCollapsed}){
  const groups=Object.keys(NAV_GROUP_LABELS);
  return(
    <aside style={{width:collapsed?56:220,background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",transition:"width 0.18s ease",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowX:"hidden"}}>
      {/* Logo */}
      <div style={{padding:collapsed?"14px 12px":"14px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <div style={{width:30,height:30,borderRadius:8,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Shield size={16} color="#fff" strokeWidth={2.5}/></div>
        {!collapsed&&<div><div style={{fontWeight:700,fontSize:13,color:T.text,letterSpacing:"-0.01em"}}>ShieldSync</div><div style={{fontSize:9,color:T.textDim,letterSpacing:"0.16em",textTransform:"uppercase",marginTop:1}}>SENTINEL</div></div>}
      </div>
      {/* Nav */}
      <nav style={{flex:1,padding:"8px 6px",display:"flex",flexDirection:"column",gap:0,overflowY:"auto"}}>
        {groups.map(g=>{
          const gItems=items.filter(n=>n.group===g);
          if(!gItems.length)return null;
          return(
            <div key={g}>
              {!collapsed&&<div style={{fontSize:9,fontWeight:700,letterSpacing:"0.14em",color:T.textDim,padding:"10px 8px 4px",textTransform:"uppercase"}}>{NAV_GROUP_LABELS[g]}</div>}
              {collapsed&&<div style={{height:1,background:T.border,margin:"6px 4px"}}/>}
              {gItems.map(n=>{
                const a=active===n.id;
                const Icon=n.icon;
                return(
                  <button key={n.id} onClick={()=>onChange(n.id)} title={collapsed?n.label:""} className="ss-nav-btn" style={{display:"flex",alignItems:"center",gap:9,padding:collapsed?"10px 13px":"8px 10px",background:a?T.accentGlow:"transparent",border:`1px solid ${a?T.accentB:"transparent"}`,borderRadius:7,cursor:"pointer",color:a?T.accent:T.textSub,fontSize:12,textAlign:"left",width:"100%",transition:"all 0.12s",WebkitTapHighlightColor:"transparent",marginBottom:1}}>
                    <Icon size={15} strokeWidth={a?2.2:1.8} style={{flexShrink:0}}/>
                    {!collapsed&&<span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontWeight:a?600:400}}>{n.label}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>
      {/* User card */}
      <div style={{padding:"8px 6px",borderTop:`1px solid ${T.border}`,flexShrink:0}}>
        {!collapsed&&(
          <div style={{padding:"10px 11px",display:"flex",gap:9,alignItems:"center",marginBottom:4}}>
            <div style={{width:28,height:28,borderRadius:7,background:T.raised,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:T.textSub,flexShrink:0}}>{user.av}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
              <div style={{fontSize:9,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.08em"}}>{user.role}</div>
            </div>
          </div>
        )}
        <button onClick={onLogout} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,color:T.textSub,padding:collapsed?"10px 13px":"8px 10px",cursor:"pointer",fontSize:11,width:"100%",fontWeight:500,display:"flex",alignItems:"center",justifyContent:collapsed?"center":"flex-start",gap:7,WebkitTapHighlightColor:"transparent",transition:"all 0.12s"}}>
          <LogOut size={14} strokeWidth={1.8}/>{!collapsed&&"Sign Out"}
        </button>
        <button onClick={()=>setCollapsed(c=>!c)} style={{background:"transparent",border:"none",color:T.textDim,padding:collapsed?"10px 13px":"6px 10px",cursor:"pointer",width:"100%",display:"flex",alignItems:"center",justifyContent:collapsed?"center":"flex-end",gap:5,marginTop:2,WebkitTapHighlightColor:"transparent"}}>
          {collapsed?<ChevronRight size={13} strokeWidth={2}/>:<><span style={{fontSize:10,color:T.textDim}}>Collapse</span><ChevronLeft size={12} strokeWidth={2}/></>}
        </button>
      </div>
    </aside>
  );
}

function TopBar({modId,now,user,onLogout,isMobile}){
  const m=NAV.find(n=>n.id===modId);
  const ModIcon=m?.icon||null;
  const grpLabel=m?.group?NAV_GROUP_LABELS[m.group]:null;
  return(
    <header style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"0 20px",height:52,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:40,flexShrink:0,gap:10}}>
      <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
        {ModIcon&&<ModIcon size={16} color={T.textDim} strokeWidth={1.8}/>}
        <div style={{minWidth:0}}>
          {grpLabel&&<div style={{fontSize:9,fontWeight:700,letterSpacing:"0.14em",color:T.textDim,textTransform:"uppercase",lineHeight:1}}>{grpLabel}</div>}
          <div style={{fontSize:14,fontWeight:600,color:T.text,whiteSpace:"nowrap",lineHeight:grpLabel?1.3:1}}>{m?.label}</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
        <div style={{fontSize:10,color:T.textDim,whiteSpace:"nowrap"}}>
          {now.toLocaleDateString([],{weekday:"short",month:"short",day:"numeric"})} · {now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
        </div>
        {!isMobile&&<div style={{display:"flex",alignItems:"center",gap:5,background:T.raised,border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 9px"}}>
          <Lock size={10} color={T.green} strokeWidth={2.5}/>
          <span style={{fontSize:10,color:T.textSub}}>Secure</span>
        </div>}
        <div style={{position:"relative"}}>
          <button style={{background:T.raised,border:`1px solid ${T.border}`,borderRadius:6,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:T.textSub,padding:0}}>
            <Bell size={13} strokeWidth={1.8}/>
          </button>
          <span style={{position:"absolute",top:-3,right:-3,width:14,height:14,borderRadius:7,background:T.red,color:"#fff",fontSize:8,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${T.bg}`}}>3</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,background:T.raised,border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 10px"}}>
          <div style={{width:24,height:24,borderRadius:6,background:T.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:T.textSub}}>{user.av}</div>
          {!isMobile&&<div style={{fontSize:11,color:T.text}}>
            <div style={{fontWeight:600,whiteSpace:"nowrap",lineHeight:1.2}}>{user.name}</div>
            <div style={{color:T.textDim,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em"}}>{user.role}</div>
          </div>}
          {isMobile&&<button onClick={onLogout} title="Sign out" style={{background:"none",border:"none",color:T.textSub,cursor:"pointer",padding:0,display:"flex",alignItems:"center",WebkitTapHighlightColor:"transparent"}}><LogOut size={13} strokeWidth={1.8}/></button>}
        </div>
      </div>
    </header>
  );
}

function MobileNav({items,active,onChange}){
  const top5=items.slice(0,5);
  return(
    <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50,background:T.surface,borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"stretch",paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
      {top5.map(n=>{
        const Icon=n.icon;const a=active===n.id;
        return(
          <button key={n.id} onClick={()=>onChange(n.id)} style={{flex:1,background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"10px 4px 8px",cursor:"pointer",gap:4,WebkitTapHighlightColor:"transparent",position:"relative"}}>
            <Icon size={18} strokeWidth={a?2.2:1.6} color={a?T.accent:T.textDim}/>
            <span style={{fontSize:9,fontWeight:a?600:400,color:a?T.accent:T.textDim,whiteSpace:"nowrap"}}>{n.label}</span>
            {a&&<div style={{position:"absolute",top:0,left:"25%",right:"25%",height:1.5,background:T.accent}}/>}
          </button>
        );
      })}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────
// MFA SCREEN
// ─────────────────────────────────────────────────────────────────
function MFAScreen({user,onVerify,onCancel}){
  const[code,setCode]=useState("");
  const[err,setErr]=useState("");
  const[resent,setResent]=useState(false);
  const DEMO="123456";
  const verify=()=>{
    if(code!==DEMO){setErr("Incorrect code — use the demo code shown on the login screen");return;}
    setErr("");onVerify();
  };
  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}html,body{font-family:'DM Sans',system-ui,sans-serif;background:${T.bg};}@keyframes ssUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}input:focus{border-color:${T.accentB}!important;outline:none;}`}</style>
      <div style={{textAlign:"center",marginBottom:28,animation:"ssUp .35s ease",position:"relative",zIndex:1}}>
        <div style={{width:56,height:56,borderRadius:16,background:T.raised,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><Fingerprint size={26} color={T.accent} strokeWidth={1.5}/></div>
        <div style={{fontSize:26,fontWeight:900,color:T.text,letterSpacing:"-0.03em",fontFamily:"'Syne',system-ui"}}>Two-Factor Auth</div>
        <div style={{fontSize:12,color:T.textSub,marginTop:6}}>Signed in as <strong style={{color:T.text}}>{user.name}</strong></div>
      </div>
      <div style={{width:"min(400px,100%)",background:T.surface,border:`1px solid ${T.border}`,borderRadius:22,padding:32,boxShadow:`0 48px 96px rgba(0,0,0,0.7)`,animation:"ssUp .45s ease .08s both",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.text}}>Verification Required</div>
          <div style={{fontSize:12,color:T.textSub,marginTop:5,lineHeight:1.65}}>Enter the 6-digit code from your authenticator app.<br/><span style={{color:T.textDim,fontSize:11}}>Demo code: <span style={{fontFamily:"monospace",color:T.accent}}>{DEMO}</span></span></div>
        </div>
        {err&&<div style={{background:T.redGlow,border:`1px solid ${T.redB}`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:T.red,textAlign:"center"}}>{err}</div>}
        <input value={code} onChange={e=>{setCode(e.target.value.replace(/\D/,"").slice(0,6));setErr("");}} onKeyDown={e=>e.key==="Enter"&&code.length===6&&verify()} maxLength={6} placeholder="• • • • • •"
          style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:14,padding:"18px",color:T.text,fontSize:32,outline:"none",textAlign:"center",letterSpacing:"0.4em",fontFamily:"monospace",boxSizing:"border-box",transition:"border-color .2s",marginBottom:14}}/>
        <button onClick={verify} disabled={code.length!==6}
          style={{width:"100%",background:code.length===6?`linear-gradient(135deg,${T.accent},${T.accentH})`:T.raised,border:code.length===6?"none":`1px solid ${T.border}`,borderRadius:12,padding:14,color:code.length===6?"#000":T.textSub,fontWeight:800,fontSize:15,cursor:code.length===6?"pointer":"not-allowed",transition:"all .2s",marginBottom:12}}>
          Verify Identity →
        </button>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <button onClick={()=>{setResent(true);setTimeout(()=>setResent(false),3000);}} style={{background:"none",border:"none",color:T.textDim,fontSize:12,cursor:"pointer",padding:0}}>{resent?"Code re-sent":"Resend code"}</button>
          <button onClick={onCancel} style={{background:"none",border:"none",color:T.textDim,fontSize:12,cursor:"pointer",padding:0}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ONBOARDING WIZARD
// ─────────────────────────────────────────────────────────────────
function OnboardingWizard({user,onComplete}){
  const STEPS=["Welcome","Add Site","Add Officer","Configure Alerts","You're Live"];
  const ICONS=[Hand,Building2,Users,Bell,Rocket];
  const[step,setStep]=useState(0);
  const[form,setForm]=useState({site:"",address:"",officer:"",email:"",badge:"",alertEmail:true,alertSMS:false,alertPush:true});
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  const iinp=(ex={})=>({width:"100%",background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",color:T.text,fontSize:13,outline:"none",boxSizing:"border-box",...ex});
  const handleComplete=()=>{
    if(form.officer&&form.email){
      const existing=getUsers();
      if(!existing.find(u=>u.email.toLowerCase()===form.email.toLowerCase())){
        const newOfficer={id:`U-OB-${Date.now()}`,email:form.email,password:"Welcome2026!",name:form.officer,role:"Officer",badge:form.badge||`S-${String(Math.floor(Math.random()*9000)+1000)}`,av:form.officer.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2),active:true,createdAt:new Date().toISOString().slice(0,10),mfaEnabled:false,company:user.company};
        saveUsers([...existing,newOfficer]);
      }
    }
    const cs=LS.get("ss_co_settings_v1",{});
    LS.set("ss_co_settings_v1",{...cs,n_sos:form.alertPush,n_inc:form.alertEmail,n_cp:form.alertPush});
    logAction(user,"ONBOARDING_COMPLETE",`Company: ${user.company}${form.site?` · Site: ${form.site}`:""}${form.officer?` · Officer: ${form.officer}`:""}`);
    onComplete();
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:20,backdropFilter:"blur(8px)"}}>
      <div style={{width:"min(600px,100%)",background:T.surface,border:`1px solid ${T.border}`,borderRadius:24,overflow:"hidden",boxShadow:`0 80px 160px rgba(0,0,0,0.8)`,animation:"ssUp .3s ease"}}>
        <div style={{height:4,background:T.raised}}>
          <div style={{height:"100%",width:`${Math.round(step/(STEPS.length-1)*100)}%`,background:`linear-gradient(90deg,${T.accent},${T.purple})`,transition:"width .4s ease"}}/>
        </div>
        <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,padding:"14px 24px 0"}}>
          {STEPS.map((s,i)=>(
            <div key={s} style={{flex:1,textAlign:"center",paddingBottom:12,borderBottom:`2px solid ${i<=step?T.accent:"transparent"}`,transition:"border-color .3s"}}>
              <div style={{marginBottom:3,display:"flex",justifyContent:"center"}}>{(()=>{const I=ICONS[i];return <I size={16} color={i<=step?T.accent:T.textDim} strokeWidth={1.8}/>;})()}</div>
              <div style={{fontSize:9,color:i===step?T.accent:i<step?T.green:T.textDim,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>{s}</div>
            </div>
          ))}
        </div>
        <div style={{padding:32}}>
          {step===0&&(
            <div style={{textAlign:"center"}}>
              <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><Hand size={36} color={T.accent} strokeWidth={1.5}/></div>
              <div style={{fontSize:20,fontWeight:900,color:T.text,marginBottom:10}}>Welcome to ShieldSync, {user.name.split(" ")[0]}!</div>
              <div style={{fontSize:13,color:T.textSub,lineHeight:1.75,marginBottom:24}}>Your account is ready. Let's set up your first site, add an officer, and configure alerts in under 2 minutes.</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                {[[MapPin,"Add Site","Set patrol locations"],[Users,"Add Officer","Invite your team"],[Bell,"Alerts","Real-time notifications"]].map(([Ic,t,s])=>(
                  <div key={t} style={{background:T.raised,border:`1px solid ${T.border}`,borderRadius:14,padding:16}}>
                    <div style={{marginBottom:8,display:"flex",justifyContent:"center"}}><Ic size={22} color={T.accent} strokeWidth={1.8}/></div>
                    <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:3}}>{t}</div>
                    <div style={{fontSize:11,color:T.textSub,lineHeight:1.5}}>{s}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step===1&&(
            <div>
              <div style={{fontSize:17,fontWeight:800,color:T.text,marginBottom:5}}>Add Your First Site</div>
              <div style={{fontSize:13,color:T.textSub,marginBottom:20,lineHeight:1.6}}>A site is any physical location your officers protect.</div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {[{label:"Site Name",k:"site",ph:"Headquarters, Warehouse, Tower A…"},{label:"Address",k:"address",ph:"123 Main St, New York, NY 10001"}].map(({label,k,ph})=>(
                  <div key={k}>
                    <label style={{fontSize:10,color:T.textSub,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:7}}>{label}</label>
                    <input value={form[k]} onChange={e=>upd(k,e.target.value)} placeholder={ph} style={iinp()}/>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step===2&&(
            <div>
              <div style={{fontSize:17,fontWeight:800,color:T.text,marginBottom:5}}>Invite First Officer</div>
              <div style={{fontSize:13,color:T.textSub,marginBottom:20,lineHeight:1.6}}>They'll receive an email with login credentials.</div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {[{label:"Full Name",k:"officer",ph:"Jane Smith"},{label:"Email",k:"email",ph:"officer@yourcompany.com"},{label:"Badge Number",k:"badge",ph:"S-0001"}].map(({label,k,ph})=>(
                  <div key={k}>
                    <label style={{fontSize:10,color:T.textSub,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:7}}>{label}</label>
                    <input value={form[k]} onChange={e=>upd(k,e.target.value)} placeholder={ph} style={iinp()}/>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step===3&&(
            <div>
              <div style={{fontSize:17,fontWeight:800,color:T.text,marginBottom:5}}>Configure Alert Channels</div>
              <div style={{fontSize:13,color:T.textSub,marginBottom:20,lineHeight:1.6}}>Choose how your team gets notified for SOS, missed checkpoints, and incidents.</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {[{k:"alertEmail",label:"Email Alerts",sub:"Incident reports and daily summaries",icon:Mail},{k:"alertSMS",label:"SMS / Text Alerts",sub:"SOS and critical incidents only",icon:Phone},{k:"alertPush",label:"Push Notifications",sub:"Real-time browser and mobile alerts",icon:Bell}].map(({k,label,sub,icon:Ic})=>(
                  <div key={k} onClick={()=>upd(k,!form[k])} style={{display:"flex",alignItems:"center",gap:14,background:form[k]?T.accentGlow:T.raised,border:`1px solid ${form[k]?T.accentB:T.border}`,borderRadius:14,padding:"14px 16px",cursor:"pointer",transition:"all .2s"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:8,background:T.bg,border:`1px solid ${T.border}`}}><Ic size={15} color={form[k]?T.accent:T.textSub} strokeWidth={2}/></div>
                    <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.text}}>{label}</div><div style={{fontSize:11,color:T.textSub,marginTop:2}}>{sub}</div></div>
                    <div style={{width:22,height:22,borderRadius:6,background:form[k]?T.accent:T.raised,border:`2px solid ${form[k]?T.accent:T.borderLight}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",flexShrink:0}}>
                      {form[k]&&<Check size={12} color="#000" strokeWidth={3}/>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step===4&&(
            <div style={{textAlign:"center"}}>
              <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><Rocket size={44} color={T.accent} strokeWidth={1.5}/></div>
              <div style={{fontSize:20,fontWeight:900,color:T.text,marginBottom:10}}>You're All Set!</div>
              <div style={{fontSize:13,color:T.textSub,lineHeight:1.75,marginBottom:22}}>Your ShieldSync workspace is live with demo data. AI features work immediately, and all modules are ready to explore.</div>
              <div style={{background:T.raised,border:`1px solid ${T.border}`,borderRadius:14,padding:18,textAlign:"left",marginBottom:22}}>
                <div style={{fontSize:10,color:T.textSub,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>Configured</div>
                {[["Site",form.site||"Demo sites pre-loaded"],["Officer",form.officer||"Demo team pre-loaded"],["Alerts",`Email ${form.alertEmail?"on":"off"} · SMS ${form.alertSMS?"on":"off"} · Push ${form.alertPush?"on":"off"}`],["AI Command","5 specialist advisors ready"],["Access control","4-tier RBAC configured"]].map(([lb,v])=>(
                  <div key={lb} style={{display:"flex",gap:10,fontSize:13,marginBottom:6,alignItems:"center"}}><CheckCircle2 size={13} color={T.green} strokeWidth={2}/><span style={{color:T.textSub,minWidth:100}}>{lb}</span><span style={{color:T.text,fontWeight:600}}>{v}</span></div>
                ))}
              </div>
            </div>
          )}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:24}}>
            {step>0?<button onClick={()=>setStep(s=>s-1)} style={{background:T.raised,border:`1px solid ${T.border}`,color:T.textSub,padding:"11px 20px",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:6}}><ChevronLeft size={14} strokeWidth={2}/>Back</button>:<div/>}
            {step<STEPS.length-1
              ?<button onClick={()=>setStep(s=>s+1)} style={{background:T.accent,border:"none",color:"#fff",padding:"12px 28px",borderRadius:12,cursor:"pointer",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>{step===0?"Let's Go":"Continue"}<ChevronRight size={15} strokeWidth={2.5}/></button>
              :<button onClick={handleComplete} style={{background:T.green,border:"none",color:"#000",padding:"13px 32px",borderRadius:12,cursor:"pointer",fontSize:14,fontWeight:800,display:"flex",alignItems:"center",gap:6}}>Enter Dashboard<ArrowRight size={15} strokeWidth={2.5}/></button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// USER MANAGEMENT MODULE
// ─────────────────────────────────────────────────────────────────
function UserManagement({user,showToast,isMobile}){
  const[users,setUsers]=useState(()=>getUsers());
  const[tab,setTab]=useState("users");
  const[search,setSearch]=useState("");
  const[roleFilter,setRoleFilter]=useState("All");
  const[showInvite,setShowInvite]=useState(false);
  const[editingId,setEditingId]=useState(null);
  const[invite,setInvite]=useState({name:"",email:"",role:"Officer",badge:""});
  const[inviteErr,setInviteErr]=useState("");
  const[inviteDone,setInviteDone]=useState(false);
  const roleColors={"Company Admin":T.purple,"Supervisor":T.accent,"Officer":T.green,"Client":T.gold};

  const filtered=users.filter(u=>{
    const q=search.toLowerCase();
    return(!q||u.name.toLowerCase().includes(q)||u.email.toLowerCase().includes(q)||(u.badge||"").toLowerCase().includes(q))&&(roleFilter==="All"||u.role===roleFilter);
  });

  const toggleActive=(id)=>{
    const updated=users.map(u=>u.id===id?{...u,active:u.active===false}:u);
    setUsers(updated);saveUsers(updated);
    const u=updated.find(u=>u.id===id);
    showToast(`${u.name} ${u.active!==false?"activated":"deactivated"}`,"success");
    logAction(user,"USER_STATUS",`${u.name} → ${u.active!==false?"Active":"Inactive"}`);
  };
  const updateRole=(id,role)=>{
    const updated=users.map(u=>u.id===id?{...u,role}:u);
    setUsers(updated);saveUsers(updated);
    showToast(`Role updated to ${role}`,"success");
    logAction(user,"ROLE_CHANGE",`${users.find(u=>u.id===id)?.name} → ${role}`);
    setEditingId(null);
  };
  const doInvite=()=>{
    if(!invite.name.trim()||!invite.email.trim()||!invite.badge.trim()){setInviteErr("All fields required.");return;}
    if(!/\S+@\S+\.\S+/.test(invite.email)){setInviteErr("Invalid email.");return;}
    if(users.find(u=>u.email.toLowerCase()===invite.email.toLowerCase())){setInviteErr("Email already exists.");return;}
    const newU={id:`U-${Date.now()}`,email:invite.email,password:"Welcome1!",name:invite.name,role:invite.role,badge:invite.badge,av:invite.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2),active:true,createdAt:new Date().toISOString().slice(0,10),mfaEnabled:false};
    const updated=[...users,newU];setUsers(updated);saveUsers(updated);
    setInviteErr("");setInviteDone(true);
    showToast(`${invite.name} invited — temp pw: Welcome1!`,"success");
    logAction(user,"USER_INVITE",`Invited ${invite.name} (${invite.role})`);
  };

  const stats={total:users.length,active:users.filter(u=>u.active!==false).length,admins:users.filter(u=>u.role==="Company Admin").length,mfa:users.filter(u=>u.mfaEnabled).length};

  return(
    <div style={{padding:isMobile?0:20,maxWidth:1040,margin:"0 auto"}}>
      <SH icon={Users} title="User Management" sub="Manage access, roles, and permissions across your organization"/>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:isMobile?8:12,marginBottom:24}}>
        {[["Total Users",stats.total,Users,T.accent],["Active",stats.active,CheckCircle2,T.green],["Admins",stats.admins,Crown,T.purple],["MFA Enabled",stats.mfa,Fingerprint,T.amber]].map(([lb,v,Ic,c])=>(
          <Card key={lb}><CB style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:9,background:`${c}12`,border:`1px solid ${c}30`,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic size={17} color={c} strokeWidth={2}/></div><div><div style={{fontSize:22,fontWeight:900,color:c}}>{v}</div><div style={{fontSize:11,color:T.textSub,marginTop:1}}>{lb}</div></div>
          </CB></Card>
        ))}
      </div>
      <div style={{display:"flex",gap:2,background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:3,marginBottom:20,width:"fit-content"}}>
        {[["users","Users"],["roles","Roles & Permissions"]].map(([k,lb])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"8px 18px",borderRadius:9,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:tab===k?T.accent:"transparent",color:tab===k?"#000":T.textSub,transition:"all .15s"}}>{lb}</button>
        ))}
      </div>

      {tab==="users"&&(
        <div>
          <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email, badge…"
              style={{flex:1,minWidth:200,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 14px",color:T.text,fontSize:13,outline:"none"}}/>
            <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}
              style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 14px",color:T.text,fontSize:13,outline:"none",cursor:"pointer"}}>
              {["All","Company Admin","Supervisor","Officer","Client"].map(r=><option key={r}>{r}</option>)}
            </select>
            <button onClick={()=>{setShowInvite(true);setInviteDone(false);setInviteErr("");setInvite({name:"",email:"",role:"Officer",badge:""});}}
              style={{background:`linear-gradient(135deg,${T.accent},${T.accentH})`,border:"none",borderRadius:10,padding:"10px 18px",color:"#000",fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>
              + Invite User
            </button>
          </div>
          <Card>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:640}}>
                <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
                  {["User","Email","Badge","Role","Status","MFA","Actions"].map(h=>(
                    <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:10,color:T.textSub,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filtered.map((u,i)=>(
                    <tr key={u.id} style={{borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none"}}>
                      <td style={{padding:"12px 14px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <Av name={u.av||u.name} size={32} color={roleColors[u.role]||T.accent}/>
                          <div><div style={{fontSize:13,fontWeight:700,color:T.text}}>{u.name}</div><div style={{fontSize:11,color:T.textDim,marginTop:1}}>Joined {u.createdAt||"2024-01-01"}</div></div>
                        </div>
                      </td>
                      <td style={{padding:"12px 14px",fontSize:12,color:T.textSub,fontFamily:"monospace"}}>{u.email}</td>
                      <td style={{padding:"12px 14px",fontSize:12,color:T.accent,fontFamily:"monospace"}}>{u.badge}</td>
                      <td style={{padding:"12px 14px"}}>
                        {editingId===u.id
                          ?<select defaultValue={u.role} onChange={e=>updateRole(u.id,e.target.value)} style={{background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 10px",color:T.text,fontSize:12,cursor:"pointer",outline:"none"}}>
                            {ROLES.map(r=><option key={r}>{r}</option>)}
                          </select>
                          :<Pill label={u.role} color={roleColors[u.role]||T.textSub}/>
                        }
                      </td>
                      <td style={{padding:"12px 14px"}}><Pill label={u.active!==false?"Active":"Inactive"} color={u.active!==false?T.green:T.textDim}/></td>
                      <td style={{padding:"12px 14px"}}>{u.mfaEnabled?<Fingerprint size={16} color={T.green} strokeWidth={2}/>:<span style={{color:T.textDim}}>—</span>}</td>
                      <td style={{padding:"12px 14px"}}>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={()=>setEditingId(editingId===u.id?null:u.id)} style={{background:T.raised,border:`1px solid ${T.border}`,color:T.text,padding:"5px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:4}}>{editingId===u.id?<><X size={11} strokeWidth={2.5}/>Cancel</>:"Edit"}</button>
                          {u.id!==user.id&&<button onClick={()=>toggleActive(u.id)} style={{background:u.active!==false?T.redGlow:T.greenB,border:`1px solid ${u.active!==false?T.redB:T.greenB}`,color:u.active!==false?T.red:T.green,padding:"5px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:600}}>{u.active!==false?"Deactivate":"Activate"}</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length&&<tr><td colSpan={7} style={{padding:"32px",textAlign:"center",color:T.textDim,fontSize:13}}>No users match your search.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab==="roles"&&(
        <Card>
          <CB>
            <SH icon={KeyRound} title="Permission Matrix" sub="Module access by role — read-only in demo"/>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:500}}>
                <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
                  <th style={{padding:"10px 14px",textAlign:"left",fontSize:10,color:T.textSub,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",minWidth:160}}>Module</th>
                  {ROLES.map(r=><th key={r} style={{padding:"10px 14px",textAlign:"center",fontSize:10,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:roleColors[r]||T.textSub,whiteSpace:"nowrap"}}>{r}</th>)}
                </tr></thead>
                <tbody>
                  {Object.entries(PERM_LABELS).map(([id,label],i)=>(
                    <tr key={id} style={{borderBottom:i<Object.keys(PERM_LABELS).length-1?`1px solid ${T.border}`:"none"}}>
                      <td style={{padding:"9px 14px",fontSize:13,color:T.text}}>{label}</td>
                      {ROLES.map(r=>(
                        <td key={r} style={{padding:"9px 14px",textAlign:"center"}}>
                          {ROLE_PERMS[r]?.includes(id)?<Check size={16} color={T.green} strokeWidth={2.5}/>:<span style={{fontSize:14,color:T.textDim}}>—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CB>
        </Card>
      )}

      {showInvite&&(
        <ModalWrap>
          <Card style={{width:"min(460px,94vw)"}}>
            <CB>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div><div style={{fontSize:10,color:T.textSub,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>User Management</div><div style={{fontSize:18,fontWeight:800,color:T.text}}>Invite User</div></div>
                <button onClick={()=>setShowInvite(false)} style={{background:"none",border:`1px solid ${T.border}`,color:T.textSub,width:34,height:34,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={14} strokeWidth={2.5}/></button>
              </div>
              {inviteDone?(
                <div style={{textAlign:"center",padding:"16px 0"}}>
                  <div style={{marginBottom:12,display:"flex",justifyContent:"center"}}><Mail size={40} color={T.green} strokeWidth={1.5}/></div>
                  <div style={{fontSize:17,fontWeight:800,color:T.green,marginBottom:8}}>Invitation Sent!</div>
                  <div style={{fontSize:13,color:T.textSub,lineHeight:1.7,marginBottom:18}}><strong style={{color:T.text}}>{invite.name}</strong> can sign in with temp password: <span style={{fontFamily:"monospace",color:T.accent}}>Welcome1!</span></div>
                  <button onClick={()=>setShowInvite(false)} style={{background:T.accent,border:"none",color:"#000",padding:"12px 28px",borderRadius:12,fontWeight:800,cursor:"pointer",fontSize:14}}>Done</button>
                </div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {inviteErr&&<div style={{background:T.redGlow,border:`1px solid ${T.redB}`,borderRadius:9,padding:"10px 14px",fontSize:13,color:T.red}}>{inviteErr}</div>}
                  {[{label:"Full Name",k:"name",ph:"Jane Smith",type:"text"},{label:"Email Address",k:"email",ph:"jane@yourcompany.com",type:"email"},{label:"Badge Number",k:"badge",ph:"S-0200",type:"text"}].map(({label,k,ph,type})=>(
                    <div key={k}>
                      <label style={{fontSize:10,color:T.textSub,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:7}}>{label}</label>
                      <input type={type} value={invite[k]} onChange={e=>setInvite(f=>({...f,[k]:e.target.value}))} placeholder={ph} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",color:T.text,fontSize:14,outline:"none",boxSizing:"border-box"}}/>
                    </div>
                  ))}
                  <div>
                    <label style={{fontSize:10,color:T.textSub,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:7}}>Role</label>
                    <select value={invite.role} onChange={e=>setInvite(f=>({...f,role:e.target.value}))} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",color:T.text,fontSize:14,outline:"none",cursor:"pointer",boxSizing:"border-box"}}>
                      {ROLES.map(r=><option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div style={{background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",fontSize:12,color:T.textSub}}>Temporary password: <span style={{fontFamily:"monospace",color:T.accent}}>Welcome1!</span> — user must change on first login.</div>
                  <button onClick={doInvite} style={{background:`linear-gradient(135deg,${T.accent},${T.accentH})`,border:"none",borderRadius:12,padding:14,color:"#000",fontWeight:800,fontSize:14,cursor:"pointer"}}>Send Invitation →</button>
                </div>
              )}
            </CB>
          </Card>
        </ModalWrap>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// COMPANY SETTINGS MODULE
// ─────────────────────────────────────────────────────────────────
function CompanySettings({user,showToast,isMobile}){
  const[tab,setTab]=useState("company");
  const[s,setS]=useState(()=>LS.get("ss_co_settings_v1",{name:"ShieldSync Demo Co.",industry:"Security Services",size:"11-50",website:"",address:"",city:"",state:"",zip:"",phone:"",timezone:"America/New_York",mfaRequired:false,sessionTTL:"8",passwordMinLength:"8",logRetention:"90",n_sos:true,n_cp:true,n_inc:true,n_clock:false,n_fuel:true,n_cert:true,n_daily:false}));
  const upd=(k,v)=>setS(p=>({...p,[k]:v}));
  const save=()=>{LS.set("ss_co_settings_v1",s);showToast("Settings saved","success");logAction(user,"SETTINGS_SAVE","Company settings updated");};
  const inp=(ex={})=>({width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 14px",color:T.text,fontSize:13,outline:"none",boxSizing:"border-box",...ex});
  const Toggle=({k,label,sub})=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,padding:"13px 16px",background:T.raised,border:`1px solid ${T.border}`,borderRadius:12}}>
      <div><div style={{fontSize:13,fontWeight:700,color:T.text}}>{label}</div>{sub&&<div style={{fontSize:12,color:T.textSub,marginTop:3,lineHeight:1.5}}>{sub}</div>}</div>
      <button onClick={()=>upd(k,!s[k])} style={{flexShrink:0,width:44,height:24,borderRadius:12,border:"none",cursor:"pointer",background:s[k]?T.accent:T.border,transition:"all .2s",position:"relative"}}>
        <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:s[k]?23:3,transition:"left .2s"}}/>
      </button>
    </div>
  );

  return(
    <div style={{padding:20,maxWidth:900,margin:"0 auto"}}>
      <SH icon={Settings} title="Company Settings" sub="Organization profile, security policies, and notification preferences"/>
      <div style={{display:"flex",gap:2,background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:3,marginBottom:20,width:"fit-content"}}>
        {[["company","Company"],["security","Security"],["notifications","Notifications"],["integrations","Integrations"]].map(([k,lb])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"8px 18px",borderRadius:9,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:tab===k?T.accent:"transparent",color:tab===k?"#000":T.textSub,transition:"all .15s"}}>{lb}</button>
        ))}
      </div>

      {tab==="company"&&(
        <Card><CB>
          <SH icon={Building2} title="Company Profile" sub="Basic organization information"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
            {[{label:"Company Name",k:"name"},{label:"Website",k:"website"},{label:"Phone",k:"phone"},{label:"Address",k:"address",full:true},{label:"City",k:"city"},{label:"State",k:"state"},{label:"ZIP Code",k:"zip"}].map(({label,k,full})=>(
              <div key={k} style={{gridColumn:full?"1 / -1":undefined}}>
                <label style={{fontSize:10,color:T.textSub,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:6}}>{label}</label>
                <input value={s[k]} onChange={e=>upd(k,e.target.value)} style={inp()}/>
              </div>
            ))}
            <div>
              <label style={{fontSize:10,color:T.textSub,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:6}}>Industry</label>
              <select value={s.industry} onChange={e=>upd("industry",e.target.value)} style={inp({appearance:"none",cursor:"pointer"})}>
                {["Security Services","Property Management","Logistics","Retail","Healthcare","Government","Other"].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:10,color:T.textSub,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:6}}>Timezone</label>
              <select value={s.timezone} onChange={e=>upd("timezone",e.target.value)} style={inp({appearance:"none",cursor:"pointer"})}>
                {["America/New_York","America/Chicago","America/Denver","America/Los_Angeles","Europe/London","Europe/Paris","Asia/Tokyo"].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <button onClick={save} style={{background:`linear-gradient(135deg,${T.accent},${T.accentH})`,border:"none",borderRadius:12,padding:"12px 28px",color:"#000",fontWeight:800,fontSize:14,cursor:"pointer"}}>Save Changes</button>
        </CB></Card>
      )}

      {tab==="security"&&(
        <Card><CB>
          <SH icon={Lock} title="Authentication Policy" sub="Control how users sign in and manage sessions"/>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:18}}>
            <Toggle k="mfaRequired" label="Require MFA for All Users" sub="Users must configure two-factor authentication before accessing the platform."/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18}}>
            {[{label:"Session Timeout (hours)",k:"sessionTTL",ph:"8"},{label:"Min Password Length",k:"passwordMinLength",ph:"8"},{label:"Audit Log Retention (days)",k:"logRetention",ph:"90"}].map(({label,k,ph})=>(
              <div key={k}>
                <label style={{fontSize:10,color:T.textSub,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:6}}>{label}</label>
                <input type="number" value={s[k]} onChange={e=>upd(k,e.target.value)} placeholder={ph} style={inp()}/>
              </div>
            ))}
          </div>
          <button onClick={save} style={{background:`linear-gradient(135deg,${T.accent},${T.accentH})`,border:"none",borderRadius:12,padding:"12px 28px",color:"#000",fontWeight:800,fontSize:14,cursor:"pointer"}}>Save Security Policy</button>
        </CB></Card>
      )}

      {tab==="notifications"&&(
        <Card><CB>
          <SH icon={Bell} title="Notification Preferences" sub="Configure when and how alerts are delivered"/>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:18}}>
            <Toggle k="n_sos" label="SOS / Emergency Alerts" sub="Immediately notify all supervisors on SOS activation"/>
            <Toggle k="n_cp" label="Missed Checkpoint Alert" sub="Alert when patrol checkpoint is not scanned on schedule"/>
            <Toggle k="n_inc" label="Incident Filed" sub="Notify supervisors when a new incident report is submitted"/>
            <Toggle k="n_clock" label="Officer Clock-In / Out" sub="Log and notify on each clock event"/>
            <Toggle k="n_fuel" label="Low Fuel Alert" sub="Alert when a vehicle drops below 25% fuel"/>
            <Toggle k="n_cert" label="Certification Expiry" sub="30-day advance warning on expiring SIA and training certs"/>
            <Toggle k="n_daily" label="Daily Operations Summary" sub="Auto-generate and email daily ops summary at shift end"/>
          </div>
          <button onClick={save} style={{background:`linear-gradient(135deg,${T.accent},${T.accentH})`,border:"none",borderRadius:12,padding:"12px 28px",color:"#000",fontWeight:800,fontSize:14,cursor:"pointer"}}>Save Preferences</button>
        </CB></Card>
      )}

      {tab==="integrations"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card>
            <CB>
              <SH icon={Link2} title="UKG Pro (Kronos)" sub="REST API integration for workforce management and payroll sync"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
                {[
                  {label:"API Base URL",k:"ukg_url",ph:"https://api.ultipro.com"},
                  {label:"API Key",k:"ukg_key",ph:"••••••••••••••••"},
                  {label:"Company ID",k:"ukg_company",ph:"ShieldSync-001"},
                  {label:"User Service Account",k:"ukg_user",ph:"svc-shieldsync@org.com"},
                ].map(({label,k,ph})=>(
                  <div key={k}>
                    <label style={{fontSize:10,color:T.textSub,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:6}}>{label}</label>
                    <input value={s[k]||""} onChange={e=>upd(k,e.target.value)} placeholder={ph} style={inp()} type={k.includes("key")?"password":"text"}/>
                  </div>
                ))}
              </div>
              <div style={{background:s.ukg_key?`${T.green}15`:`${T.amber}15`,border:`1px solid ${s.ukg_key?T.green:T.amber}40`,borderRadius:10,padding:"11px 14px",marginBottom:14,fontSize:12,color:s.ukg_key?T.green:T.amber}}>
                {s.ukg_key?<span style={{display:"flex",alignItems:"center",gap:6}}><Check size={13} strokeWidth={2.5}/>Credentials configured — sync will activate on next payroll run</span>:<span style={{display:"flex",alignItems:"center",gap:6}}><AlertTriangle size={13} strokeWidth={2}/>Credentials not set — UKG sync disabled. Enter credentials above to enable.</span>}
              </div>
              <button onClick={save} style={{background:`linear-gradient(135deg,${T.accent},${T.accentH})`,border:"none",borderRadius:12,padding:"12px 28px",color:"#000",fontWeight:800,fontSize:14,cursor:"pointer"}}>Save UKG Credentials</button>
            </CB>
          </Card>

          <Card>
            <CB>
              <SH icon={Wrench} title="Other Integrations" sub="Platform connection status"/>
              {[
                {name:"Anthropic AI (Claude)",desc:"Powers AI copilot, reports, and executive briefing",status:"Connected",color:T.green,icon:Cpu},
                {name:"Vercel Edge Network",desc:"Global deployment and edge function hosting",status:"Connected",color:T.green,icon:Network},
                {name:"ADP Workforce Now",desc:"CSV export — no live API configured",status:"CSV Only",color:T.amber,icon:BarChart3},
                {name:"Paylocity",desc:"CSV export — no live API configured",status:"CSV Only",color:T.amber,icon:BarChart3},
                {name:"QuickBooks Payroll",desc:"Accounting sync — available in v2.0",status:"Planned",color:T.textDim,icon:BookOpen},
                {name:"Supabase",desc:"Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to activate",status:"Not Configured",color:T.textSub,icon:Database},
              ].map(int=>(
                <div key={int.name} style={{display:"flex",alignItems:"center",gap:12,background:T.raised,borderRadius:9,padding:"11px 14px",marginBottom:6}}>
                  <div style={{width:28,height:28,borderRadius:7,background:`${int.color}10`,border:`1px solid ${int.color}25`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><int.icon size={14} color={int.color} strokeWidth={2}/></div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.text}}>{int.name}</div>
                    <div style={{fontSize:10,color:T.textSub,marginTop:2}}>{int.desc}</div>
                  </div>
                  <Pill label={int.status} color={int.color}/>
                </div>
              ))}
            </CB>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// CLIENT PORTAL
// ─────────────────────────────────────────────────────────────────
function ClientPortal({user,showToast,isMobile}){
  const[tab,setTab]=useState("overview");
  const sla=user?.role==="Client"?CLIENT_SLA.filter(s=>s.client.toLowerCase().includes("northgate")):CLIENT_SLA;

  const exportReport=()=>{
    showToast("Client report exported","success");
    logAction(user,"CLIENT_REPORT_EXPORT","SLA report");
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:10,color:T.accent,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>Client Portal</div>
          <div style={{fontSize:20,fontWeight:900,color:T.text}}>Contract & Service Overview</div>
        </div>
        <button onClick={exportReport} style={{background:T.accentGlow,border:`1px solid ${T.accentB}`,color:T.accent,padding:"9px 16px",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",gap:6}}><ArrowDownToLine size={13} strokeWidth={2}/>Export Report</button>
      </div>

      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {[["overview","Overview"],["sla","SLA"],["incidents","Incidents"],["billing","Billing"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?T.accentGlow:T.raised,border:`1px solid ${tab===t?T.accentB:T.border}`,color:tab===t?T.accent:T.textSub,padding:"8px 14px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>{l}</button>
        ))}
      </div>

      {tab==="overview"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:10}}>
            {[
              {label:"Sites Under Contract",value:"4",color:T.accent},
              {label:"Avg SLA Score",value:"90%",color:T.green},
              {label:"Monthly Value",value:"$96,750",color:T.gold},
              {label:"Open Incidents",value:"2",color:T.amber},
            ].map(d=>(
              <Card key={d.label} glow={d.color}>
                <CB style={{textAlign:"center",padding:"14px 10px"}}>
                  <div style={{fontSize:24,fontWeight:900,color:d.color}}>{d.value}</div>
                  <div style={{fontSize:10,color:T.textSub,marginTop:3}}>{d.label}</div>
                </CB>
              </Card>
            ))}
          </div>
          <Card>
            <CB>
              <SH title="Site Performance Summary"/>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {sla.map(s=>{
                  const sc=s.status==="Healthy"?T.green:T.red;
                  return(
                    <div key={s.client} style={{display:"flex",alignItems:"center",gap:12,background:T.raised,borderRadius:9,padding:"11px 14px"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:sc,flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                          <span style={{fontSize:12,fontWeight:700,color:T.text}}>{s.site}</span>
                          <Pill label={s.status} color={sc}/>
                        </div>
                        <div style={{fontSize:10,color:T.textSub}}>Patrol: {s.patrols}% · Response: {s.responseTime}m · Satisfaction: {s.satisfaction}% <span style={{color:s.trend.startsWith("+")?T.green:T.red}}>({s.trend})</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CB>
          </Card>
        </div>
      )}

      {tab==="sla"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {sla.map(s=>{
            const sc=s.status==="Healthy"?T.green:T.red;
            return(
              <Card key={s.client} glow={sc}>
                <CB>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:800,color:T.text}}>{s.client}</div>
                      <div style={{fontSize:11,color:T.textSub,marginTop:2}}>{s.site} · {s.officers} officers</div>
                    </div>
                    <Pill label={s.status} color={sc}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:isMobile?5:8,marginBottom:12}}>
                    {[
                      {l:"Patrol Rate",v:`${s.patrols}%`,c:s.patrols>=90?T.green:T.amber},
                      {l:"Response Time",v:`${s.responseTime}m`,c:s.responseTime<=4?T.green:T.amber},
                      {l:"Incidents",v:s.incidents,c:T.accent},
                      {l:"Satisfaction",v:`${s.satisfaction}%`,c:s.satisfaction>=85?T.green:T.red},
                    ].map(m=>(
                      <div key={m.l} style={{background:T.raised,borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
                        <div style={{fontSize:18,fontWeight:900,color:m.c}}>{m.v}</div>
                        <div style={{fontSize:9,color:T.textSub,marginTop:2}}>{m.l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{marginBottom:6}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.textSub,marginBottom:4}}>
                      <span>Overall SLA Score</span>
                      <span style={{color:sc,fontWeight:700}}>{s.satisfaction}%</span>
                    </div>
                    <PBar value={s.satisfaction} max={100} color={sc}/>
                  </div>
                </CB>
              </Card>
            );
          })}
        </div>
      )}

      {tab==="incidents"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card>
            <CB>
              <SH title="Recent Incidents — All Sites"/>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {INCIDENTS.map(inc=>{
                  const sc=inc.sev==="High"?T.red:inc.sev==="Medium"?T.amber:T.green;
                  return(
                    <div key={inc.id} style={{display:"flex",alignItems:"center",gap:12,background:T.raised,borderRadius:9,padding:"11px 14px",borderLeft:`3px solid ${sc}`}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                          <span style={{fontSize:12,fontWeight:700,color:T.text}}>{inc.type}</span>
                          <div style={{display:"flex",gap:6}}>
                            <Pill label={inc.sev} color={sc}/>
                            <Pill label={inc.status} color={inc.status==="Active"?T.red:inc.status==="Under Review"?T.amber:T.green}/>
                          </div>
                        </div>
                        <div style={{fontSize:10,color:T.textSub}}>{inc.id} · {inc.site} · {inc.time} · {inc.officer}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CB>
          </Card>
        </div>
      )}

      {tab==="billing"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:isMobile?6:10}}>
            {[
              {label:"Current Month",value:"$96,750",sub:"Due Jun 30",color:T.accent},
              {label:"Last Month",value:"$94,200",sub:"Paid May 31",color:T.green},
              {label:"YTD Total",value:"$557,490",sub:"Jan–Jun 2026",color:T.gold},
            ].map(b=>(
              <Card key={b.label} glow={b.color}>
                <CB style={{textAlign:"center",padding:"16px 12px"}}>
                  <div style={{fontSize:22,fontWeight:900,color:b.color}}>{b.value}</div>
                  <div style={{fontSize:11,color:T.textSub,marginTop:3}}>{b.label}</div>
                  <div style={{fontSize:10,color:T.textDim,marginTop:2}}>{b.sub}</div>
                </CB>
              </Card>
            ))}
          </div>
          <Card>
            <CB>
              <SH title="Contract Billing Breakdown"/>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {CONTRACTS.map(c=>(
                  <div key={c.id} style={{background:T.raised,borderRadius:9,padding:"12px 14px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:T.text}}>{c.client}</div>
                        <div style={{fontSize:10,color:T.textSub,marginTop:1}}>{c.sites} site(s) · {c.officers} officers · {c.id}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:14,fontWeight:900,color:T.accent}}>${c.monthly.toLocaleString()}<span style={{fontSize:10,color:T.textSub}}>/mo</span></div>
                        <div style={{fontSize:10,color:T.textSub,marginTop:1}}>Ends {c.end}</div>
                      </div>
                    </div>
                    <PBar value={c.health} max={100} color={c.health>=75?T.green:T.amber}/>
                  </div>
                ))}
              </div>
            </CB>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// IT / CYBER COMMAND
// ─────────────────────────────────────────────────────────────────
function ITCyberCommand({user,showToast,isMobile}){
  const[tab,setTab]=useState("threats");
  const[alerts,setAlerts]=useState(CYBER_ALERTS);

  const resolve=(id)=>{
    setAlerts(prev=>prev.map(a=>a.id===id?{...a,status:"Resolved"}:a));
    showToast(`Alert ${id} marked resolved`,"success");
    logAction(user,"CYBER_RESOLVE",`Alert ${id}`);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:10,color:T.red,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>IT / Cyber Command</div>
          <div style={{fontSize:20,fontWeight:900,color:T.text}}>Security Operations Center</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[
            {label:"Critical",value:CYBER_CRIT,color:T.red},
            {label:"High",value:CYBER_HIGH,color:T.amber},
            {label:"Devices",value:CYBER_DEVICES.length,color:T.accent},
          ].map(s=>(
            <div key={s.label} style={{background:T.raised,border:`1px solid ${s.color}40`,borderRadius:9,padding:"8px 14px",textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:900,color:s.color}}>{s.value}</div>
              <div style={{fontSize:9,color:T.textSub}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {[["threats","Threat Alerts"],["devices","Devices"],["access","Access Log"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?`${T.red}22`:T.raised,border:`1px solid ${tab===t?T.red+"66":T.border}`,color:tab===t?T.red:T.textSub,padding:"8px 14px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>{l}</button>
        ))}
      </div>

      {tab==="threats"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {alerts.map(a=>{
            const sc=a.severity==="Critical"?T.red:a.severity==="High"?T.amber:T.gold;
            return(
              <Card key={a.id} glow={sc}>
                <CB>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <Pill label={a.severity} color={sc}/>
                        <Pill label={a.type} color={T.accent}/>
                        <Pill label={a.status} color={a.status==="Open"?T.red:a.status==="Investigating"?T.amber:T.green}/>
                      </div>
                      <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:3}}>{a.desc}</div>
                      <div style={{fontSize:11,color:T.textSub}}>{a.id} · {a.device} · {a.ip} · {a.time}</div>
                    </div>
                    {a.status!=="Resolved"&&(
                      <button onClick={()=>resolve(a.id)} style={{background:T.raised,border:`1px solid ${T.border}`,color:T.textSub,padding:"7px 12px",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:11,flexShrink:0}}>Resolve</button>
                    )}
                  </div>
                </CB>
              </Card>
            );
          })}
        </div>
      )}

      {tab==="devices"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {CYBER_DEVICES.map(d=>{
            const rc=d.risk==="High"?T.red:d.risk==="Medium"?T.amber:T.green;
            return(
              <Card key={d.id}>
                <CB>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:36,height:36,borderRadius:9,background:`${rc}22`,border:`1px solid ${rc}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{(()=>{const Ic=d.type.includes("NVR")||d.type.includes("Camera")?Camera:d.type.includes("Access")||d.type.includes("Biometric")?ScanLine:d.type.includes("Switch")||d.type.includes("VPN")||d.type.includes("Firewall")?Network:d.type.includes("LPR")?Car:ServerCog;return <Ic size={17} color={rc} strokeWidth={2}/>;})()}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                        <span style={{fontSize:12,fontWeight:700,color:T.text}}>{d.name}</span>
                        <div style={{display:"flex",gap:5}}>
                          <Pill label={d.status} color={d.status==="Online"?T.green:d.status==="Warning"?T.amber:T.red}/>
                          <Pill label={`Risk: ${d.risk}`} color={rc}/>
                        </div>
                      </div>
                      <div style={{fontSize:10,color:T.textSub}}>{d.id} · {d.type} · {d.site} · FW: {d.firmware}</div>
                      {d.alerts>0&&<div style={{fontSize:10,color:T.amber,marginTop:2}}>{d.alerts} active alert(s)</div>}
                    </div>
                  </div>
                </CB>
              </Card>
            );
          })}
        </div>
      )}

      {tab==="access"&&(
        <Card>
          <CB>
            <SH title="Recent Access Events"/>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {CYBER_ACCESS_LOG.map((ev,i)=>{
                const ok=ev.result==="Success";
                return(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:T.raised,borderRadius:8,padding:"9px 12px",borderLeft:`3px solid ${ok?T.green:T.red}`}}>
                    <div style={{fontSize:11,color:T.textSub,width:40,flexShrink:0}}>{ev.time}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:T.text}}>{ev.user}</div>
                      <div style={{fontSize:10,color:T.textSub,marginTop:1}}>{ev.action} · {ev.ip} · {ev.device}</div>
                    </div>
                    <Pill label={ev.result} color={ok?T.green:T.red}/>
                  </div>
                );
              })}
            </div>
          </CB>
        </Card>
      )}
    </div>
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
  const[incidents,setIncidents]=useLS("ss_incidents_v1",INCIDENTS);

  const[online,setOnline]=useState(navigator.onLine);
  useEffect(()=>{const c=()=>setIsMobile(window.innerWidth<768);c();window.addEventListener("resize",c);return()=>window.removeEventListener("resize",c);},[]);
  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(t);},[]);
  useEffect(()=>onlineStatus(setOnline),[]);

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

  const[mfaPending,setMfaPending]=useState(null);
  const[onboarding,setOnboarding]=useState(false);

  const handleLogin=useCallback(u=>{
    if(u.mfaEnabled){setMfaPending(u);}
    else{setUser(u);if(u.isNewCompany){setOnboarding(true);}};
  },[]);
  const handleMfaVerify=useCallback(()=>{if(mfaPending){setUser(mfaPending);if(mfaPending.isNewCompany)setOnboarding(true);setMfaPending(null);};},[mfaPending]);
  const handleRegister=useCallback(()=>{},[]);

  if(mfaPending)return <MFAScreen user={mfaPending} onVerify={handleMfaVerify} onCancel={()=>{clearSession();setMfaPending(null);}}/>;
  if(!user)return <AuthScreen onLogin={handleLogin} onRegister={handleRegister}/>;

  const perms=ROLE_PERMS[role]||[];
  const renderMod=()=>{
    if(!perms.includes(mod))return <Dashboard openModal={openModal} showToast={showToast} isMobile={isMobile}/>;
    switch(mod){
      case "dashboard": return <Dashboard openModal={openModal} showToast={showToast} isMobile={isMobile} incidents={incidents}/>;
      case "myshift":   return <MyShift user={user} showToast={showToast} isMobile={isMobile}/>;
      case "workforce": return <Workforce isMobile={isMobile}/>;
      case "patrol":    return <Patrol user={user} showToast={showToast} openModal={openModal} isMobile={isMobile}/>;
      case "fleet":     return <Fleet openModal={openModal} isMobile={isMobile}/>;
      case "visitors":  return <Visitors openModal={openModal} user={user} showToast={showToast} isMobile={isMobile}/>;
      case "reports":   return <Reports isMobile={isMobile}/>;
      case "dispatch":  return <DispatchLifecycle showToast={showToast} user={user} isMobile={isMobile}/>;
      case "equipment": return <EquipmentModule user={user} showToast={showToast} isMobile={isMobile}/>;
      case "leave":     return <LeaveModule user={user} showToast={showToast} isMobile={isMobile}/>;
      case "training":  return <TrainingModule isMobile={isMobile}/>;
      case "auditlog":  return <AuditLogModule showToast={showToast} isMobile={isMobile}/>;
      case "executive": return <ExecutiveCommand showToast={showToast} isMobile={isMobile}/>;
      case "timekeeping":return <TimekeepingModule user={user} showToast={showToast} isMobile={isMobile}/>;
      case "aicommand": return <AICommandCenter isMobile={isMobile}/>;
      case "procurement":return <ProcurementModule user={user} showToast={showToast} isMobile={isMobile}/>;
      case "users":       return <UserManagement user={user} showToast={showToast} isMobile={isMobile}/>;
      case "settings":    return <CompanySettings user={user} showToast={showToast} isMobile={isMobile}/>;
      case "clientportal":return <ClientPortal user={user} showToast={showToast} isMobile={isMobile}/>;
      case "itcommand":   return <ITCyberCommand user={user} showToast={showToast} isMobile={isMobile}/>;
      case "scheduling":  return <ScheduleModule user={user} showToast={showToast} isMobile={isMobile}/>;
      case "postorders":  return <PostOrdersModule user={user} showToast={showToast} isMobile={isMobile}/>;
      case "keymanagement":return <KeyManagement user={user} showToast={showToast} isMobile={isMobile}/>;
      case "corrective":  return <CorrectiveActions user={user} showToast={showToast} isMobile={isMobile}/>;
      case "handover":    return <ShiftHandover user={user} showToast={showToast} isMobile={isMobile}/>;
      case "guardtours":  return <GuardTours user={user} showToast={showToast} isMobile={isMobile}/>;
      case "opscenter":   return <OperationsCenter user={user} showToast={showToast} isMobile={isMobile}/>;
      default:            return <Dashboard openModal={openModal} showToast={showToast} isMobile={isMobile}/>;
    }
  };

  return(
    <div style={{height:"100%",background:T.bg,color:T.text,display:"flex",flexDirection:"column"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}
        html,body,#root{font-family:'DM Sans',system-ui,sans-serif;background:${T.bg};overflow-x:hidden;-webkit-text-size-adjust:100%;height:100%;}
        input,textarea,select,button{font-family:inherit;}
        @media(max-width:768px){button,select,input{min-height:44px;}input[type="range"],input[type="checkbox"]{min-height:unset;}.ss-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}}
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

      {/* Offline banner */}
      {!online&&(
        <div style={{background:T.amber,color:"#000",padding:"8px 16px",fontSize:12,fontWeight:700,textAlign:"center",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <WifiOff size={14} strokeWidth={2}/> Offline mode — actions are queued and will sync when connection is restored
        </div>
      )}

      {/* Onboarding wizard — shown once for new company registrations */}
      {onboarding&&<OnboardingWizard user={user} onComplete={()=>{setOnboarding(false);const updated=getUsers().map(u=>u.id===user.id?{...u,isNewCompany:false}:u);saveUsers(updated);}}/>}

      {/* Toast notifications */}
      {toasts.length>0&&(
        <div style={{position:"fixed",top:16,right:16,zIndex:300,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none",maxWidth:340}}>
          {toasts.map(t=>(
            <div key={t.id} style={{background:t.type==="success"?T.green:t.type==="error"?T.red:T.surface,border:`1px solid ${t.type==="success"?T.green:t.type==="error"?T.redB:T.borderLight}`,borderRadius:12,padding:"13px 16px",color:t.type==="success"||t.type==="error"?"#000":T.text,fontSize:13,fontWeight:600,boxShadow:"0 8px 32px rgba(0,0,0,0.55)",animation:"ssToast 0.2s ease"}}>
              <span style={{display:"flex",alignItems:"center",gap:6}}>{t.type==="success"?<Check size={13} strokeWidth={3}/>:t.type==="error"?<AlertTriangle size={13} strokeWidth={2}/>:null}{t.msg}</span>
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
      {modal?.type==="incident"&&<IncModal onClose={closeModal} showToast={showToast} user={user} onSave={inc=>setIncidents(prev=>[inc,...prev])}/>}
      {modal?.type==="checkin"&&<CheckInModal onClose={closeModal} showToast={showToast}/>}
    </div>
  );
}
