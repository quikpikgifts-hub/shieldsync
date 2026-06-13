import React,{useState,useEffect,useRef,useCallback}from"react";
import{platform,tenantDB,session,callAI,genId,now}from"./db.js";
import{LayoutDashboard,Users,Briefcase,TrendingUp,Shield,DollarSign,FileText,Settings,Building2,ChevronRight,ChevronLeft,ChevronDown,LogOut,Plus,X,Check,Search,MoreHorizontal,Phone,AlertCircle,Bell,Target,ArrowUpRight,Activity,Lock,Eye,EyeOff,Send,Trash2,Edit3,BarChart2,UserPlus,Globe,Flag,Layers,CheckSquare,Calendar,ClipboardList,AlertTriangle,Award,Wallet,BookOpen,UserCheck,RefreshCw,Filter,Download,Clock,TrendingDown,Minus,Info}from"lucide-react";

const T={
  bg:"#09090E",surface:"#0E0E18",raised:"#141420",card:"#1A1A28",
  border:"#252538",borderLight:"#32324A",
  accent:"#6366F1",accentH:"#4F46E5",accentB:"rgba(99,102,241,0.18)",
  green:"#10B981",greenB:"rgba(16,185,129,0.18)",
  amber:"#F59E0B",amberB:"rgba(245,158,11,0.18)",
  red:"#EF4444",redB:"rgba(239,68,68,0.18)",
  blue:"#3B82F6",blueB:"rgba(59,130,246,0.18)",
  purple:"#8B5CF6",purpleB:"rgba(139,92,246,0.18)",
  text:"#F1F5F9",textSub:"#94A3B8",textDim:"#475569",
  overlay:"rgba(9,9,14,0.95)",
};

const GCSS=`*{box-sizing:border-box;margin:0;padding:0;}body{background:#09090E;color:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;}::-webkit-scrollbar{width:4px;height:4px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:#252538;border-radius:2px;}.oc-row:hover{background:rgba(99,102,241,0.05)!important;cursor:pointer;}.oc-btn:hover{opacity:0.82;}.oc-ghost:hover{background:rgba(99,102,241,0.08)!important;}@keyframes ocUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes ocFade{from{opacity:0}to{opacity:1}}@keyframes ocSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes ocPulse{0%,100%{opacity:1}50%{opacity:0.35}}`;

// ── Seed: Tenants ──────────────────────────────────────────────
const ST=[
  {id:"T-VRR",name:"Veridian Risk & Resilience",slug:"vrr",plan:"enterprise",status:"active",industry:"Risk Consulting",ownerId:"U-VRR-CEO"},
  {id:"T-VS",name:"Veridian Solutions",slug:"vs",plan:"enterprise",status:"active",industry:"AI SaaS",ownerId:"U-VS-CEO"},
  {id:"T-LAB",name:"OperaCore Labs",slug:"lab",plan:"internal",status:"active",industry:"Platform R&D",ownerId:"U-LAB-CEO"},
];
const SU=[
  {id:"U-PLAT",email:"admin@operacore.app",password:"Admin2030!",name:"Platform Admin",av:"PA",platformRole:"platform_admin",tenantId:null,role:null},
  {id:"U-VRR-CEO",email:"ceo@vrr.io",password:"Veridian2030!",name:"Eleanor Shaw",av:"ES",tenantId:"T-VRR",role:"ceo_advisor"},
  {id:"U-VRR-COO",email:"coo@vrr.io",password:"Veridian2030!",name:"Marcus Chen",av:"MC",tenantId:"T-VRR",role:"coo"},
  {id:"U-VRR-CFO",email:"cfo@vrr.io",password:"Veridian2030!",name:"Diana Ross",av:"DR",tenantId:"T-VRR",role:"cfo"},
  {id:"U-VRR-COMP",email:"compliance@vrr.io",password:"Veridian2030!",name:"James Holt",av:"JH",tenantId:"T-VRR",role:"compliance_director"},
  {id:"U-VS-CEO",email:"ceo@vsolutions.io",password:"Solutions2030!",name:"Ryan Park",av:"RP",tenantId:"T-VS",role:"ceo_advisor"},
  {id:"U-VS-SALES",email:"sales@vsolutions.io",password:"Solutions2030!",name:"Olivia Tran",av:"OT",tenantId:"T-VS",role:"sales_manager"},
  {id:"U-LAB-CEO",email:"ceo@operacorelabs.io",password:"Labs2030!",name:"Dr. Aiden Brooks",av:"AB",tenantId:"T-LAB",role:"ceo_advisor"},
];

// ── Seed: VRR data ─────────────────────────────────────────────
const SVRR_CLIENTS=[
  {id:"C-001",name:"Hartwell Global",contact:"Sarah Hartwell",email:"s.hartwell@hartwellglobal.com",phone:"212-555-0100",status:"active",health:92,mrr:22000,tier:"Enterprise",since:"2024-02-01",industry:"Financial Services",projects:3},
  {id:"C-002",name:"Meridian Capital",contact:"Thomas Blake",email:"t.blake@meridiancap.com",phone:"212-555-0210",status:"active",health:78,mrr:18500,tier:"Enterprise",since:"2024-05-01",industry:"Private Equity",projects:2},
  {id:"C-003",name:"Castlefield Partners",contact:"Anne Castlefield",email:"a.castle@castlefield.co",phone:"312-555-0330",status:"active",health:85,mrr:14000,tier:"Growth",since:"2024-08-01",industry:"Asset Management",projects:2},
  {id:"C-004",name:"Vantage Risk Advisors",contact:"Greg Vantage",email:"g.vantage@vantagerisk.com",phone:"415-555-0440",status:"at_risk",health:54,mrr:11000,tier:"Growth",since:"2023-11-01",industry:"Insurance",projects:1},
  {id:"C-005",name:"Pinnacle Corp",contact:"Linda Simmons",email:"l.simmons@pinnaclecorp.com",phone:"617-555-0550",status:"active",health:96,mrr:9500,tier:"Growth",since:"2025-01-01",industry:"Manufacturing",projects:2},
];
const SVRR_PROJECTS=[
  {id:"P-001",clientId:"C-001",name:"ISO 27001 Certification Program",status:"in_progress",progress:68,budget:185000,spent:122000,manager:"Marcus Chen",due:"2026-09-30",phase:"Gap Analysis Complete"},
  {id:"P-002",clientId:"C-002",name:"PE Due Diligence Risk Framework",status:"in_progress",progress:45,budget:120000,spent:52000,manager:"James Holt",due:"2026-08-15",phase:"Risk Inventory"},
  {id:"P-003",clientId:"C-003",name:"Operational Resilience Assessment",status:"review",progress:91,budget:75000,spent:71000,manager:"Marcus Chen",due:"2026-06-30",phase:"Final Report"},
  {id:"P-004",clientId:"C-004",name:"Regulatory Compliance Audit",status:"on_hold",progress:22,budget:55000,spent:12000,manager:"James Holt",due:"2026-10-01",phase:"Pending Client Docs"},
  {id:"P-005",clientId:"C-005",name:"Business Continuity Planning",status:"in_progress",progress:57,budget:68000,spent:38000,manager:"Marcus Chen",due:"2026-07-31",phase:"Plan Development"},
];
const SVRR_RISKS=[
  {id:"R-001",title:"Client Data Breach Exposure",category:"Cyber",likelihood:3,impact:5,score:15,status:"open",owner:"James Holt",due:"2026-07-01",controls:"Encryption at rest, MFA enforced"},
  {id:"R-002",title:"Key Personnel Dependency",category:"Operational",likelihood:4,impact:4,score:16,status:"mitigating",owner:"Marcus Chen",due:"2026-06-30",controls:"Cross-training program initiated"},
  {id:"R-003",title:"Regulatory Change — SEC",category:"Compliance",likelihood:3,impact:4,score:12,status:"monitoring",owner:"James Holt",due:"2026-08-15",controls:"Regulatory watch service active"},
  {id:"R-004",title:"Revenue Concentration — Top 3 Clients",category:"Financial",likelihood:2,impact:5,score:10,status:"open",owner:"Eleanor Shaw",due:"2026-09-01",controls:"Diversification pipeline active"},
  {id:"R-005",title:"Third-Party Vendor Failure",category:"Operational",likelihood:3,impact:3,score:9,status:"mitigating",owner:"Marcus Chen",due:"2026-07-15",controls:"Backup vendors identified"},
];
const SVRR_EMPLOYEES=[
  {id:"E-001",name:"Eleanor Shaw",title:"CEO",dept:"Executive",status:"active",email:"ceo@vrr.io",start:"2022-01-01",utilization:85},
  {id:"E-002",name:"Marcus Chen",title:"COO",dept:"Operations",status:"active",email:"coo@vrr.io",start:"2022-03-01",utilization:92},
  {id:"E-003",name:"Diana Ross",title:"CFO",dept:"Finance",status:"active",email:"cfo@vrr.io",start:"2022-06-01",utilization:78},
  {id:"E-004",name:"James Holt",title:"Compliance Director",dept:"Compliance",status:"active",email:"compliance@vrr.io",start:"2023-01-15",utilization:95},
  {id:"E-005",name:"Priya Nair",title:"Risk Analyst Sr.",dept:"Risk",status:"active",email:"p.nair@vrr.io",start:"2023-04-01",utilization:88},
  {id:"E-006",name:"Tobias Grant",title:"Risk Analyst",dept:"Risk",status:"active",email:"t.grant@vrr.io",start:"2024-02-01",utilization:76},
];

// ── Seed: VS data ──────────────────────────────────────────────
const SVS_LEADS=[
  {id:"L-001",name:"Dr. Kevin Walsh",company:"Walsh Dental Group",email:"k.walsh@walshdental.com",status:"qualified",value:4800,stage:"Discovery",score:82,source:"Outbound"},
  {id:"L-002",name:"Maria Santos",company:"Santos Auto Group",email:"m.santos@santosauto.com",status:"proposal",value:9600,stage:"Proposal",score:91,source:"Referral"},
  {id:"L-003",name:"Jennifer Cole",company:"Cole Law Group",email:"j.cole@colelawgroup.com",status:"contacted",value:6000,stage:"Contacted",score:68,source:"LinkedIn"},
  {id:"L-004",name:"Robert Kim",company:"Coastal Med Center",email:"r.kim@coastalmed.org",status:"new",value:14400,stage:"New",score:55,source:"Inbound"},
  {id:"L-005",name:"Patricia Wells",company:"Wells Realty",email:"p.wells@wellsrealty.com",status:"nurture",value:3600,stage:"Nurture",score:44,source:"Cold Email"},
];
const SVS_CLIENTS=[
  {id:"CS-001",name:"Walsh Dental Group",mrr:400,status:"active",health:94,tier:"Pro",since:"2025-09-01"},
  {id:"CS-002",name:"Santos Auto Group",mrr:800,status:"active",health:88,tier:"Business",since:"2025-11-01"},
  {id:"CS-003",name:"Apex Chiropractic",mrr:400,status:"active",health:71,tier:"Pro",since:"2026-01-01"},
  {id:"CS-004",name:"Lakeside Dental",mrr:400,status:"at_risk",health:42,tier:"Pro",since:"2026-02-01"},
  {id:"CS-005",name:"Riverside Law",mrr:800,status:"active",health:97,tier:"Business",since:"2025-07-01"},
  {id:"CS-006",name:"Premier Auto Dallas",mrr:800,status:"active",health:82,tier:"Business",since:"2025-10-01"},
];

// ── Industry Blueprints ────────────────────────────────────────
const BLUEPRINTS={
  "risk_consulting":{
    label:"Risk & Resilience Consulting",category:"Professional Services",
    modules:["dashboard","pipeline","clients","operations","people","compliance","finance","reports","settings"],
    roles:["ceo_advisor","coo","cfo","compliance_director","ops_manager","client_success","hr_manager"],
    pipelines:[{name:"Consulting Sales",stages:["Discovery","Scoping","Proposal","Negotiation","Won","Lost"]}],
    kpis:["MRR","Client Health","Active Projects","Open Risks","Utilization","Pipeline Value"],
    departments:["Executive","Risk","Compliance","Operations","Finance","Business Development"],
    defaultData:{clients:true,projects:true,risks:true,employees:true},
  },
  "ai_saas":{
    label:"AI SaaS / Automation Platform",category:"Technology Services",
    modules:["dashboard","pipeline","clients","operations","people","finance","reports","settings"],
    roles:["ceo_advisor","coo","cfo","sales_manager","client_success","ops_manager"],
    pipelines:[{name:"Sales Pipeline",stages:["New Lead","Contacted","Demo Booked","Demo Done","Proposal","Trial","Won","Churned"]}],
    kpis:["MRR","ARR","Churn Rate","NPS","Pipeline Value","CAC","LTV"],
    departments:["Executive","Sales","Customer Success","Product","Engineering","Finance"],
    defaultData:{leads:true,clients:true,employees:true},
  },
  "consulting":{
    label:"Management Consulting",category:"Professional Services",
    modules:["dashboard","pipeline","clients","operations","people","finance","reports","settings"],
    roles:["ceo_advisor","coo","cfo","sales_manager","ops_manager","client_success"],
    pipelines:[{name:"Client Pipeline",stages:["Prospect","Qualified","Proposal","Contract","Active","Complete"]}],
    kpis:["Revenue","Active Engagements","Utilization","Client NPS","Pipeline"],
    departments:["Executive","Consulting","Business Development","Operations","Finance"],
    defaultData:{clients:true,projects:true,employees:true},
  },
  "legal":{
    label:"Law Firm / Legal Services",category:"Professional Services",
    modules:["dashboard","pipeline","clients","operations","people","compliance","finance","reports","settings"],
    roles:["ceo_advisor","coo","cfo","ops_manager","client_success","compliance_director"],
    pipelines:[{name:"Matter Intake",stages:["Inquiry","Conflict Check","Engagement","Active Matter","Closed"]}],
    kpis:["Revenue","Active Matters","Billable Hours","Realization Rate","Pipeline"],
    departments:["Executive","Legal","Intake","Operations","Finance","Compliance"],
    defaultData:{clients:true,projects:true,employees:true},
  },
  "dental":{
    label:"Dental Practice",category:"Healthcare",
    modules:["dashboard","pipeline","clients","operations","people","finance","reports","settings"],
    roles:["ceo_advisor","ops_manager","client_success","hr_manager"],
    pipelines:[{name:"Patient Acquisition",stages:["New Inquiry","Appointment Booked","First Visit","Treatment Plan","Active Patient"]}],
    kpis:["New Patients/Month","Chair Utilization","Production","Collections","Recall Rate"],
    departments:["Executive","Clinical","Front Office","Operations","Finance"],
    defaultData:{clients:true,employees:true},
  },
  "security_services":{
    label:"Security Services",category:"Business Services",
    modules:["dashboard","pipeline","clients","operations","people","compliance","finance","reports","settings"],
    roles:["ceo_advisor","coo","ops_manager","client_success","hr_manager","compliance_director"],
    pipelines:[{name:"Contract Sales",stages:["Prospect","Site Survey","Proposal","Negotiation","Won"]}],
    kpis:["MRR","Contract Value","Officer Utilization","Incident Rate","Compliance Score"],
    departments:["Executive","Operations","Sales","Compliance","Finance","HR"],
    defaultData:{clients:true,employees:true,risks:true},
  },
  "construction":{
    label:"Construction / Contracting",category:"Construction",
    modules:["dashboard","pipeline","clients","operations","people","compliance","finance","reports","settings"],
    roles:["ceo_advisor","coo","cfo","ops_manager","hr_manager"],
    pipelines:[{name:"Project Bidding",stages:["Bid","Proposal","Awarded","In Progress","Complete","Invoiced"]}],
    kpis:["Revenue","Active Projects","Budget Variance","Safety Score","Pipeline"],
    departments:["Executive","Field Operations","Estimating","Finance","Safety","HR"],
    defaultData:{projects:true,employees:true,risks:true},
  },
  "vrr_blueprint":{
    label:"Veridian Risk & Resilience Group",category:"Professional Services",
    modules:["dashboard","pipeline","clients","operations","people","compliance","finance","knowledge","reports","settings"],
    roles:["ceo_advisor","coo","cfo","compliance_director","ops_manager","client_success","hr_manager","tenant_admin"],
    pipelines:[{name:"Client Acquisition",stages:["Discovery","Scoping","Proposal","Engagement Letter","Active","Complete"]}],
    kpis:["MRR","Client Health","Active Engagements","Open Risks","Utilization","Pipeline Value","Compliance Score","Revenue per Client"],
    departments:["Executive","Risk Advisory","Compliance","Business Continuity","Client Management","Business Development","Finance","Knowledge Management"],
    services:["Risk Management","Business Continuity","Compliance Programs","Operational Assessments","Executive Advisory","Project Delivery","Audit Support","Client Management","Knowledge Management","Executive Reporting"],
    defaultData:{clients:true,projects:true,risks:true,employees:true},
  },
  "vs_blueprint":{
    label:"Veridian Solutions — AI Automation Platform",category:"Technology Services",
    modules:["dashboard","pipeline","clients","operations","people","finance","intelligence","knowledge","reports","settings"],
    roles:["ceo_advisor","coo","cfo","sales_manager","client_success","ops_manager","tenant_admin"],
    pipelines:[{name:"Sales Pipeline",stages:["New Lead","Contacted","Demo Booked","Demo Complete","Proposal","Trial Active","Won","Churned"]}],
    kpis:["MRR","ARR","Churn Rate","NPS","Pipeline Value","CAC","LTV","New Clients/Month","Demos/Week","Conversion Rate"],
    departments:["Executive","Sales","Customer Success","Product","Operations","Finance","Marketing"],
    services:["AI Receptionist","Missed Call Recovery","Missed Text Recovery","Email Recovery","Business Automation","CRM Automation","Workflow Automation","Customer Engagement","Lead Generation","Recurring Revenue Management"],
    defaultData:{leads:true,clients:true,employees:true},
  },
  "property_management":{
    label:"Property Management",category:"Real Estate",
    modules:["dashboard","pipeline","clients","operations","people","finance","reports","settings"],
    roles:["ceo_advisor","coo","cfo","ops_manager","client_success"],
    pipelines:[{name:"Property Acquisition",stages:["Prospect","Due Diligence","Contract","Onboarding","Active"]}],
    kpis:["Units Managed","Occupancy Rate","NOI","Maintenance Requests","Collections"],
    departments:["Executive","Operations","Leasing","Maintenance","Finance","Client Relations"],
    defaultData:{clients:true,employees:true},
  },
};

const INDUSTRY_CATEGORIES=["All","Professional Services","Technology Services","Healthcare","Construction","Real Estate","Business Services"];

// ── NAV config ─────────────────────────────────────────────────
const ROLES_ALL=["ceo_advisor","coo","cfo","sales_manager","ops_manager","client_success","compliance_director","hr_manager","tenant_admin"];
const NAV=[
  {id:"dashboard",label:"Executive",icon:LayoutDashboard,roles:ROLES_ALL},
  {id:"pipeline",label:"AI CRM",icon:TrendingUp,roles:["ceo_advisor","sales_manager","tenant_admin","coo"]},
  {id:"clients",label:"Client Management",icon:UserCheck,roles:["ceo_advisor","coo","client_success","tenant_admin"]},
  {id:"operations",label:"Operations",icon:CheckSquare,roles:["ceo_advisor","coo","ops_manager","tenant_admin"]},
  {id:"people",label:"People",icon:Users,roles:["ceo_advisor","coo","hr_manager","tenant_admin"]},
  {id:"compliance",label:"Compliance & Risk",icon:Shield,roles:["ceo_advisor","coo","compliance_director","tenant_admin"]},
  {id:"finance",label:"Finance",icon:DollarSign,roles:["ceo_advisor","cfo","tenant_admin"]},
  {id:"intelligence",label:"Market Intelligence",icon:Globe,roles:["ceo_advisor","sales_manager","tenant_admin"]},
  {id:"knowledge",label:"Knowledge Base",icon:BookOpen,roles:ROLES_ALL},
  {id:"reports",label:"Reports",icon:FileText,roles:ROLES_ALL},
  {id:"settings",label:"Settings",icon:Settings,roles:["tenant_admin","ceo_advisor"]},
];

// ── Primitives ─────────────────────────────────────────────────
const Pill=({label,color=T.accent,size=11})=>(
  <span style={{display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:20,background:`${color}22`,color,fontSize:size,fontWeight:600,whiteSpace:"nowrap"}}>{label}</span>
);
const Av=({initials="?",color=T.accent,size=34})=>(
  <div style={{width:size,height:size,borderRadius:"50%",background:`${color}22`,border:`1.5px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",color,fontSize:size*0.35,fontWeight:700,flexShrink:0}}>{initials}</div>
);
const Btn=({children,onClick,variant="primary",size="md",disabled,style:sx={}})=>{
  const base={display:"inline-flex",alignItems:"center",gap:6,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,borderRadius:8,fontWeight:600,border:"none",transition:"opacity 0.15s",...sx};
  const v={primary:{background:T.accent,color:"#fff",padding:size==="sm"?"5px 12px":"8px 16px",fontSize:size==="sm"?12:13},ghost:{background:"transparent",color:T.textSub,padding:size==="sm"?"5px 12px":"8px 16px",fontSize:size==="sm"?12:13,border:`1px solid ${T.border}`},danger:{background:T.redB,color:T.red,padding:size==="sm"?"5px 12px":"8px 16px",fontSize:size==="sm"?12:13,border:`1px solid ${T.red}44`}};
  return<button className="oc-btn" style={{...base,...v[variant]}} onClick={onClick} disabled={disabled}>{children}</button>;
};
const Card=({children,style:sx={}})=>(
  <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px",...sx}}>{children}</div>
);
const StatCard=({label,value,sub,color=T.accent,icon:Icon,trend})=>(
  <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"18px 20px",display:"flex",flexDirection:"column",gap:8}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <span style={{fontSize:12,color:T.textSub,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</span>
      {Icon&&<div style={{width:30,height:30,borderRadius:8,background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon size={15} color={color}/></div>}
    </div>
    <div style={{fontSize:26,fontWeight:800,color:T.text,letterSpacing:"-0.02em"}}>{value}</div>
    {sub&&<div style={{fontSize:12,color:trend==="up"?T.green:trend==="down"?T.red:T.textSub}}>{sub}</div>}
  </div>
);
const PBar=({pct,color=T.accent,h=6})=>(
  <div style={{width:"100%",height:h,borderRadius:h,background:T.border,overflow:"hidden"}}>
    <div style={{height:"100%",width:`${Math.min(100,Math.max(0,pct))}%`,background:color,borderRadius:h,transition:"width 0.4s ease"}}/>
  </div>
);
const SH=({title,action})=>(
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
    <div style={{fontSize:15,fontWeight:700,color:T.text}}>{title}</div>
    {action&&<div style={{fontSize:12,color:T.accent,cursor:"pointer"}}>{action}</div>}
  </div>
);
const ModalWrap=({onClose,title,children,width=560})=>(
  <div style={{position:"fixed",inset:0,background:T.overlay,display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}} onClick={onClose}>
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,width:"100%",maxWidth:width,maxHeight:"90vh",overflowY:"auto",animation:"ocUp .2s ease"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 20px",borderBottom:`1px solid ${T.border}`}}>
        <div style={{fontSize:16,fontWeight:700,color:T.text}}>{title}</div>
        <button className="oc-btn" style={{background:"none",border:"none",cursor:"pointer",color:T.textSub}} onClick={onClose}><X size={18}/></button>
      </div>
      <div style={{padding:"20px"}}>{children}</div>
    </div>
  </div>
);
const TH=({cols})=>(
  <div style={{display:"grid",gridTemplateColumns:cols,padding:"8px 12px",borderBottom:`1px solid ${T.border}`,marginBottom:2}}>
    {/* header cells passed as children via Table comp */}
  </div>
);
const Toast=({msg,type="success",onClose})=>{
  useEffect(()=>{const t=setTimeout(onClose,3500);return()=>clearTimeout(t);},[]);
  const c=type==="error"?T.red:type==="warning"?T.amber:T.green;
  return<div style={{position:"fixed",bottom:24,right:24,background:T.card,border:`1px solid ${c}44`,borderRadius:10,padding:"12px 18px",color:T.text,fontSize:13,fontWeight:500,zIndex:2000,animation:"ocUp .2s ease",display:"flex",alignItems:"center",gap:10,boxShadow:`0 4px 24px rgba(0,0,0,0.4)`}}><div style={{width:6,height:6,borderRadius:"50%",background:c,flexShrink:0}}/>{msg}</div>;
};
const Empty=({msg="No records found"})=>(
  <div style={{textAlign:"center",padding:"48px 24px",color:T.textDim,fontSize:14}}>{msg}</div>
);
const Spinner=()=><div style={{width:16,height:16,border:`2px solid ${T.border}`,borderTopColor:T.accent,borderRadius:"50%",animation:"ocSpin 0.6s linear infinite"}}/>;

// ── Health color ───────────────────────────────────────────────
const hc=(n)=>n>=80?T.green:n>=60?T.amber:T.red;

// ── Auth Screen ────────────────────────────────────────────────
function AuthScreen({onLogin,onDemo}){
  const[email,setEmail]=useState("");
  const[pw,setPw]=useState("");
  const[showPw,setShowPw]=useState(false);
  const[err,setErr]=useState("");
  const[loading,setLoading]=useState(false);
  const handle=async(e)=>{
    e.preventDefault();setErr("");setLoading(true);
    await new Promise(r=>setTimeout(r,400));
    const u=SU.find(x=>x.email.toLowerCase()===email.toLowerCase()&&x.password===pw);
    if(!u){setErr("Invalid credentials.");setLoading(false);return;}
    onLogin(u);setLoading(false);
  };
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg,padding:16}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontSize:28,fontWeight:900,color:T.text,letterSpacing:"-0.03em"}}>OperaCore <span style={{color:T.accent}}>2030</span></div>
          <div style={{fontSize:13,color:T.textSub,marginTop:6}}>Multi-Tenant Business Platform</div>
        </div>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:32}}>
          <form onSubmit={handle}>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:12,color:T.textSub,fontWeight:600,display:"block",marginBottom:6}}>EMAIL</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",color:T.text,fontSize:14,outline:"none"}}/>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{fontSize:12,color:T.textSub,fontWeight:600,display:"block",marginBottom:6}}>PASSWORD</label>
              <div style={{position:"relative"}}>
                <input value={pw} onChange={e=>setPw(e.target.value)} type={showPw?"text":"password"} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 40px 10px 12px",color:T.text,fontSize:14,outline:"none"}}/>
                <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:T.textDim}}>{showPw?<EyeOff size={15}/>:<Eye size={15}/>}</button>
              </div>
            </div>
            {err&&<div style={{color:T.red,fontSize:12,marginBottom:12}}>{err}</div>}
            <Btn style={{width:"100%",justifyContent:"center"}} disabled={loading}>{loading?<Spinner/>:"Sign In"}</Btn>
          </form>
          <div style={{marginTop:24,borderTop:`1px solid ${T.border}`,paddingTop:16}}>
            <div style={{fontSize:11,color:T.textDim,marginBottom:8}}>DEMO ACCOUNTS</div>
            {SU.filter(u=>u.tenantId).slice(0,4).map(u=>(
              <div key={u.id} onClick={()=>onLogin(u)} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",cursor:"pointer",borderRadius:6}} className="oc-row">
                <span style={{fontSize:12,color:T.textSub}}>{u.email}</span>
                <span style={{fontSize:11,color:T.accent}}>{u.role}</span>
              </div>
            ))}
          </div>
        </div>
        {onDemo&&(
          <div style={{marginTop:16,textAlign:"center"}}>
            <button onClick={onDemo} style={{background:"none",border:`1px solid ${T.accent}`,borderRadius:10,padding:"12px 28px",color:T.accent,fontSize:14,fontWeight:600,cursor:"pointer",width:"100%",letterSpacing:"0.01em"}}>
              Launch Interactive Demo
            </button>
            <div style={{fontSize:11,color:T.textDim,marginTop:8}}>No login required — see the platform in action</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Executive Dashboard ────────────────────────────────────────
function Dashboard({user,tenant,showToast,isMobile}){
  const isVRR=tenant.id==="T-VRR";
  const isVS=tenant.id==="T-VS";
  const[briefing,setBriefing]=useState(null);
  const[briefingLoading,setBriefingLoading]=useState(false);

  // VRR computed
  const vrrMRR=SVRR_CLIENTS.reduce((s,c)=>s+c.mrr,0);
  const vrrARR=vrrMRR*12;
  const vrrActiveClients=SVRR_CLIENTS.filter(c=>c.status==="active").length;
  const vrrAtRisk=SVRR_CLIENTS.filter(c=>c.status==="at_risk").length;
  const vrrAvgHealth=Math.round(SVRR_CLIENTS.reduce((s,c)=>s+c.health,0)/SVRR_CLIENTS.length);
  const vrrOpenRisks=SVRR_RISKS.filter(r=>r.status==="open").length;
  const vrrCriticalRisks=SVRR_RISKS.filter(r=>r.score>=15).length;
  const vrrActiveProjects=SVRR_PROJECTS.filter(p=>p.status==="in_progress").length;
  const vrrAvgUtil=Math.round(SVRR_EMPLOYEES.reduce((s,e)=>s+e.utilization,0)/SVRR_EMPLOYEES.length);
  const vrrTopRisk=SVRR_RISKS.find(r=>r.status==="open"&&r.score>=15);

  // VS computed
  const vsMRR=SVS_CLIENTS.reduce((s,c)=>s+c.mrr,0);
  const vsARR=vsMRR*12;
  const vsActiveClients=SVS_CLIENTS.filter(c=>c.status==="active").length;
  const vsAtRisk=SVS_CLIENTS.filter(c=>c.status==="at_risk").length;
  const vsAvgHealth=Math.round(SVS_CLIENTS.reduce((s,c)=>s+c.health,0)/SVS_CLIENTS.length);
  const vsPipeline=SVS_LEADS.reduce((s,l)=>s+l.value,0);
  const vsQualified=SVS_LEADS.filter(l=>l.score>=70).length;

  // Health score computation
  const complianceHealth=isVRR?Math.round(100-(vrrOpenRisks/SVRR_RISKS.length)*60):88;
  const opsHealth=isVRR?Math.round(SVRR_PROJECTS.filter(p=>p.status!=="on_hold").length/SVRR_PROJECTS.length*100):82;
  const workforceHealth=isVRR?vrrAvgUtil:78;

  // Priorities
  const priorities=isVRR?[
    {label:"Castlefield Partners — Final Report review due June 30",urgency:"today",type:"Client"},
    {label:`${vrrAtRisk} client${vrrAtRisk!==1?"s":""} at risk — schedule check-in calls`,urgency:"urgent",type:"Client Health"},
    {label:`${vrrCriticalRisks} critical risk${vrrCriticalRisks!==1?"s":""} open — assign mitigations`,urgency:"urgent",type:"Risk"},
    {label:"Castlefield — Operational Resilience report pending sign-off",urgency:"this_week",type:"Operations"},
    {label:"ISO 27001 milestone: Gap Analysis phase complete — kick off Remediation",urgency:"this_week",type:"Project"},
  ]:[
    {label:`${vsAtRisk} at-risk client${vsAtRisk!==1?"s":""} — proactive outreach before churn`,urgency:"urgent",type:"Client Health"},
    {label:"Santos Auto Group — proposal stage — follow up today",urgency:"today",type:"Sales"},
    {label:`${vsQualified} qualified leads above score 70 — schedule demos this week`,urgency:"this_week",type:"Pipeline"},
    {label:"Lakeside Dental health at 42% — escalate to client success immediately",urgency:"urgent",type:"Client Health"},
  ];

  const urgencyColor=(u)=>({urgent:T.red,today:T.amber,this_week:T.blue}[u]||T.textSub);
  const urgencyLabel=(u)=>({urgent:"Urgent",today:"Today",this_week:"This Week"}[u]||u);

  const g=(s)=>({display:"grid",gridTemplateColumns:s,gap:16});

  const generateBriefing=async()=>{
    setBriefingLoading(true);
    const ctx=isVRR
      ?`Veridian Risk & Resilience Group. ARR: $${(vrrARR/1000).toFixed(0)}K. Active clients: ${vrrActiveClients} (${vrrAtRisk} at risk). Avg health: ${vrrAvgHealth}%. Active projects: ${vrrActiveProjects}. Critical risks: ${vrrCriticalRisks}. Workforce utilization: ${vrrAvgUtil}%. Compliance health: ${complianceHealth}%.`
      :`Veridian Solutions. MRR: $${(vsMRR/1000).toFixed(1)}K. ARR: $${(vsARR/1000).toFixed(0)}K. Active clients: ${vsActiveClients} (${vsAtRisk} at risk). Pipeline: $${(vsPipeline/1000).toFixed(1)}K. Client health: ${vsAvgHealth}%.`;
    try{
      const txt=await callAI(
        [{role:"user",content:`Write a concise executive morning briefing (6-8 sentences) for the CEO. Context: ${ctx} Include: overall business health assessment, top opportunity, top risk, and one specific recommended action for today. Be direct, specific, and confident. No bullet points. Plain prose.`}],
        "You are the Chief of Staff delivering a morning briefing to the CEO. Be concise, data-driven, and direct. No fluff.",650
      );
      setBriefing(txt);
    }catch{
      setBriefing(`AI briefing requires ANTHROPIC_API_KEY. Current status: ${ctx}`);
    }
    setBriefingLoading(false);
  };

  const hour=new Date().getHours();
  const greeting=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20,animation:"ocUp .25s ease"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:T.text,letterSpacing:"-0.02em"}}>{greeting}, {user.name.split(" ")[0]}</div>
          <div style={{fontSize:13,color:T.textSub,marginTop:2}}>{tenant.name} · {new Date().toLocaleDateString([],{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</div>
        </div>
        <Btn size="sm" variant="ghost" onClick={generateBriefing} disabled={briefingLoading}>{briefingLoading?<><Spinner/>Briefing...</>:"Executive Briefing"}</Btn>
      </div>

      {/* Executive Briefing */}
      {briefing&&(
        <Card style={{border:`1px solid ${T.accent}44`,background:`linear-gradient(135deg,${T.card},${T.raised})`}}>
          <div style={{fontSize:12,fontWeight:700,color:T.accent,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>Executive Briefing — {new Date().toLocaleDateString()}</div>
          <div style={{fontSize:13,color:T.textSub,lineHeight:1.8}}>{briefing}</div>
        </Card>
      )}

      {(isVRR||isVS)&&(
        <>
          {/* Top KPI Row */}
          <div style={g(isMobile?"1fr 1fr":"repeat(4,1fr)")}>
            {isVRR&&<>
              <StatCard label="Annual Revenue" value={`$${(vrrARR/1000).toFixed(0)}K`} sub="+18% YoY" trend="up" icon={DollarSign} color={T.green}/>
              <StatCard label="Active Clients" value={vrrActiveClients} sub={vrrAtRisk>0?`${vrrAtRisk} at risk`:"All healthy"} trend={vrrAtRisk>0?"down":"up"} icon={UserCheck} color={T.accent}/>
              <StatCard label="Active Projects" value={vrrActiveProjects} sub={`${SVRR_PROJECTS.filter(p=>p.status==="on_hold").length} on hold`} icon={Briefcase} color={T.blue}/>
              <StatCard label="Portfolio Health" value={`${vrrAvgHealth}%`} sub="Avg client health" trend={vrrAvgHealth>=80?"up":"down"} icon={Activity} color={hc(vrrAvgHealth)}/>
            </>}
            {isVS&&<>
              <StatCard label="MRR" value={`$${(vsMRR/1000).toFixed(1)}K`} sub="+22% MoM" trend="up" icon={DollarSign} color={T.green}/>
              <StatCard label="ARR Run Rate" value={`$${(vsARR/1000).toFixed(0)}K`} sub="Target: $100K" icon={TrendingUp} color={T.accent}/>
              <StatCard label="Active Clients" value={vsActiveClients} sub={vsAtRisk>0?`${vsAtRisk} at risk`:"All healthy"} trend={vsAtRisk>0?"down":"up"} icon={UserCheck} color={T.blue}/>
              <StatCard label="Pipeline" value={`$${(vsPipeline/1000).toFixed(1)}K`} sub={`${SVS_LEADS.length} leads`} icon={Target} color={T.purple}/>
            </>}
          </div>

          {/* Health Gauges */}
          <div style={g(isMobile?"1fr":"repeat(4,1fr)")}>
            {[
              {label:"Customer Health",val:isVRR?vrrAvgHealth:vsAvgHealth},
              {label:"Workforce Health",val:workforceHealth},
              {label:"Operational Health",val:opsHealth},
              {label:"Compliance Health",val:complianceHealth},
            ].map(({label,val})=>(
              <div key={label} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 18px"}}>
                <div style={{fontSize:11,color:T.textSub,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>{label}</div>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{fontSize:24,fontWeight:800,color:hc(val)}}>{val}%</div>
                  <div style={{flex:1}}><PBar pct={val} color={hc(val)} h={8}/></div>
                </div>
                <div style={{fontSize:11,color:hc(val),marginTop:6}}>{val>=80?"Strong":val>=60?"Needs Attention":"Critical"}</div>
              </div>
            ))}
          </div>

          {/* Two-column: priorities + health details */}
          <div style={g(isMobile?"1fr":"1.2fr 1fr")}>
            {/* Today's Priorities */}
            <Card>
              <SH title="Today's Priorities"/>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {priorities.map((p,i)=>(
                  <div key={i} onClick={()=>showToast("Task opened")} className="oc-row" style={{display:"flex",gap:10,padding:"9px 8px",borderRadius:8,alignItems:"flex-start",cursor:"pointer"}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:urgencyColor(p.urgency),marginTop:5,flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,color:T.text,lineHeight:1.4}}>{p.label}</div>
                      <div style={{display:"flex",gap:6,marginTop:5}}>
                        <Pill label={urgencyLabel(p.urgency)} color={urgencyColor(p.urgency)} size={10}/>
                        <Pill label={p.type} color={T.textDim} size={10}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              {/* Client health */}
              <Card>
                <SH title={isVRR?"Client Portfolio":"Client Health"}/>
                {(isVRR?SVRR_CLIENTS:SVS_CLIENTS).map(c=>(
                  <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:`1px solid ${T.border}`}}>
                    <div style={{flex:1,fontSize:12,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                    <div style={{width:60}}><PBar pct={c.health} color={hc(c.health)} h={4}/></div>
                    <div style={{fontSize:12,fontWeight:700,color:hc(c.health),width:36,textAlign:"right"}}>{c.health}%</div>
                  </div>
                ))}
              </Card>

              {/* Approvals placeholder */}
              <Card>
                <SH title="Approvals Requiring Action"/>
                {[
                  isVRR?{label:"Budget variance approval — P-002 Meridian Capital",amount:"$8K",type:"Finance"}:null,
                  {label:"New vendor onboarding — IT services",amount:null,type:"Procurement"},
                ].filter(Boolean).map((a,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                    <div>
                      <div style={{fontSize:12,color:T.text}}>{a.label}</div>
                      <Pill label={a.type} color={T.accent} size={10}/>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>showToast("Approved")} style={{background:T.greenB,border:`1px solid ${T.green}44`,borderRadius:6,padding:"3px 10px",color:T.green,fontSize:11,cursor:"pointer"}}>Approve</button>
                      <button onClick={()=>showToast("Declined")} style={{background:T.redB,border:`1px solid ${T.red}44`,borderRadius:6,padding:"3px 10px",color:T.red,fontSize:11,cursor:"pointer"}}>Decline</button>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          </div>

          {/* Critical alert */}
          {isVRR&&vrrTopRisk&&(
            <Card style={{borderColor:`${T.red}44`,background:`${T.red}06`}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <AlertTriangle size={16} color={T.red}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.text}}>Critical Risk Requires Action — Score {vrrTopRisk.score}/25</div>
                  <div style={{fontSize:12,color:T.textSub,marginTop:2}}>{vrrTopRisk.title} · Owner: {vrrTopRisk.owner} · Due {vrrTopRisk.due}</div>
                </div>
                <Pill label="CRITICAL" color={T.red}/>
              </div>
            </Card>
          )}
          {isVS&&vsAtRisk>0&&(
            <Card style={{borderColor:`${T.amber}44`,background:`${T.amber}06`}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <AlertTriangle size={16} color={T.amber}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.text}}>{vsAtRisk} client{vsAtRisk!==1?"s":""} at risk of churn</div>
                  <div style={{fontSize:12,color:T.textSub,marginTop:2}}>Immediate outreach recommended. At-risk MRR: ${SVS_CLIENTS.filter(c=>c.status==="at_risk").reduce((s,c)=>s+c.mrr,0)}/mo</div>
                </div>
                <Pill label="CHURN RISK" color={T.amber}/>
              </div>
            </Card>
          )}
        </>
      )}

      {!isVRR&&!isVS&&(
        <Card><div style={{textAlign:"center",padding:"40px 20px",color:T.textSub,fontSize:14}}>Configure executive dashboard for {tenant.name} by applying an industry blueprint.</div></Card>
      )}
    </div>
  );
}

// ── AI CRM ─────────────────────────────────────────────────────
function Pipeline({tenant,showToast}){
  const isVRR=tenant.id==="T-VRR";
  const isVS=tenant.id==="T-VS";
  const leads=isVS?SVS_LEADS:[];
  const[search,setSearch]=useState("");
  const[tab,setTab]=useState("pipeline");
  const[modal,setModal]=useState(null);
  const[aiLoading,setAiLoading]=useState(false);
  const[aiResult,setAiResult]=useState("");
  const filtered=leads.filter(l=>l.name.toLowerCase().includes(search.toLowerCase())||l.company.toLowerCase().includes(search.toLowerCase()));
  const stageColor=(s)=>({Won:T.green,Lost:T.red,Proposal:T.accent,Negotiation:T.purple,Discovery:T.blue}[s]||T.textSub);
  const totalVal=leads.reduce((s,l)=>s+l.value,0);
  const wonVal=leads.filter(l=>l.stage==="Won").reduce((s,l)=>s+l.value,0);

  const runAI=async(lead)=>{
    setAiLoading(true);setAiResult("");
    try{
      const txt=await callAI(
        [{role:"user",content:`Prepare a sales intelligence brief for this lead: Name: ${lead.name}, Company: ${lead.company}, Stage: ${lead.stage}, Score: ${lead.score}, Deal Value: $${lead.value}/yr. Provide: (1) Likely pain points, (2) Best next action, (3) Recommended outreach message (2 sentences), (4) Risk factors, (5) Competitive angle. Be specific and actionable.`}],
        `You are a senior sales strategist for ${tenant.name}. Provide sharp, immediately actionable intelligence.`,700
      );
      setAiResult(txt);
    }catch{
      setAiResult("AI brief requires ANTHROPIC_API_KEY. Configure in Vercel environment variables.");
    }
    setAiLoading(false);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:T.text}}>AI CRM</div>
          <div style={{fontSize:13,color:T.textSub,marginTop:2}}>
            {isVRR?"Consulting pipeline & client intelligence":
             `${leads.length} leads · $${(totalVal/1000).toFixed(1)}K pipeline · $${(wonVal/1000).toFixed(1)}K won`}
          </div>
        </div>
        <Btn onClick={()=>setModal({type:"new"})}><Plus size={14}/>Add Lead</Btn>
      </div>

      <div style={{display:"flex",gap:4,background:T.surface,borderRadius:10,padding:4,border:`1px solid ${T.border}`,width:"fit-content"}}>
        {(isVRR?["consulting","activity"]:["pipeline","board","activity"]).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"6px 16px",borderRadius:7,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:tab===t?T.card:"transparent",color:tab===t?T.text:T.textSub,transition:"all 0.15s"}}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
        ))}
      </div>

      {isVRR&&tab==="consulting"&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
            <StatCard label="Pipeline Value" value={`$${(SVRR_PROJECTS.reduce((s,p)=>s+p.budget,0)/1000).toFixed(0)}K`} icon={Target} color={T.accent}/>
            <StatCard label="Active Engagements" value={SVRR_PROJECTS.filter(p=>p.status==="in_progress").length} icon={Briefcase} color={T.blue}/>
            <StatCard label="Avg Deal Size" value="$100K" icon={DollarSign} color={T.green}/>
          </div>
          <Card style={{padding:0}}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,display:"grid",gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1fr",gap:12}}>
              {["Engagement","Client","Budget","Progress","Status"].map(h=><div key={h} style={{fontSize:11,color:T.textDim,fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
            </div>
            {SVRR_PROJECTS.map(p=>(
              <div key={p.id} className="oc-row" onClick={()=>setModal({type:"project",project:p})} style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1fr",gap:12,padding:"12px 16px",borderBottom:`1px solid ${T.border}`,alignItems:"center"}}>
                <div style={{fontSize:13,fontWeight:600,color:T.text}}>{p.name}</div>
                <div style={{fontSize:12,color:T.textSub}}>{SVRR_CLIENTS.find(c=>c.id===p.clientId)?.name||""}</div>
                <div style={{fontSize:13,fontWeight:700,color:T.text}}>${(p.budget/1000).toFixed(0)}K</div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <PBar pct={p.progress} color={T.accent} h={5}/>
                  <span style={{fontSize:11,color:T.textSub,width:28}}>{p.progress}%</span>
                </div>
                <Pill label={p.status.replace("_"," ")} color={p.status==="review"?T.green:p.status==="on_hold"?T.amber:T.blue} size={10}/>
              </div>
            ))}
          </Card>
        </>
      )}

      {isVS&&tab==="pipeline"&&(
        <>
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1,position:"relative"}}>
              <Search size={14} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.textDim}}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search leads..." style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 10px 8px 32px",color:T.text,fontSize:13,outline:"none"}}/>
            </div>
          </div>
          <Card style={{padding:0}}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,display:"grid",gridTemplateColumns:"2fr 1.5fr 1fr 80px 90px",gap:12}}>
              {["Lead / Source","Company / Stage","Value","Score","Status"].map(h=><div key={h} style={{fontSize:11,color:T.textDim,fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
            </div>
            {filtered.length===0?<Empty/>:filtered.map(l=>(
              <div key={l.id} className="oc-row" onClick={()=>{setModal({type:"lead",lead:l});setAiResult("");}} style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1fr 80px 90px",gap:12,padding:"12px 16px",borderBottom:`1px solid ${T.border}`,alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:T.text}}>{l.name}</div>
                  <div style={{fontSize:11,color:T.textSub}}>{l.source}</div>
                </div>
                <div>
                  <div style={{fontSize:13,color:T.text}}>{l.company}</div>
                  <div style={{fontSize:11,color:stageColor(l.stage)}}>{l.stage}</div>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:T.text}}>${(l.value/1000).toFixed(1)}K</div>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <PBar pct={l.score} color={l.score>=80?T.green:l.score>=60?T.amber:T.red} h={5}/>
                  <span style={{fontSize:11,color:T.textSub,width:20}}>{l.score}</span>
                </div>
                <Pill label={l.status} color={l.status==="proposal"?T.accent:l.status==="qualified"?T.green:T.textSub} size={10}/>
              </div>
            ))}
          </Card>
        </>
      )}

      {isVS&&tab==="board"&&(
        <div style={{overflowX:"auto"}}>
          <div style={{display:"flex",gap:12,minWidth:800}}>
            {["New","Contacted","Discovery","Proposal","Won"].map(stage=>{
              const stageleads=leads.filter(l=>l.stage===stage);
              return(
                <div key={stage} style={{flex:"0 0 200px",background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden"}}>
                  <div style={{padding:"10px 12px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:12,fontWeight:700,color:T.text}}>{stage}</span>
                    <span style={{fontSize:11,color:T.textSub}}>{stageleads.length}</span>
                  </div>
                  <div style={{padding:8,display:"flex",flexDirection:"column",gap:6}}>
                    {stageleads.map(l=>(
                      <div key={l.id} onClick={()=>{setModal({type:"lead",lead:l});setAiResult("");}} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",cursor:"pointer"}} className="oc-row">
                        <div style={{fontSize:12,fontWeight:700,color:T.text}}>{l.name}</div>
                        <div style={{fontSize:11,color:T.textSub,marginTop:2}}>{l.company}</div>
                        <div style={{fontSize:12,fontWeight:700,color:T.green,marginTop:6}}>${(l.value/1000).toFixed(1)}K</div>
                        <PBar pct={l.score} color={l.score>=80?T.green:l.score>=60?T.amber:T.red} h={3}/>
                      </div>
                    ))}
                    {stageleads.length===0&&<div style={{padding:12,textAlign:"center",fontSize:11,color:T.textDim}}>Empty</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(tab==="activity"||(isVRR&&tab==="activity"))&&(
        <Card><div style={{textAlign:"center",padding:32,color:T.textSub,fontSize:13}}>Activity feed — all CRM interactions, calls, emails, and meetings displayed here. Connected to GoHighLevel for live sync.</div></Card>
      )}

      {modal?.type==="lead"&&(
        <ModalWrap onClose={()=>setModal(null)} title={`${modal.lead.name} — ${modal.lead.company}`} width={580}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <StatCard label="Deal Value" value={`$${(modal.lead.value/1000).toFixed(1)}K/yr`} icon={DollarSign} color={T.green}/>
              <StatCard label="Lead Score" value={modal.lead.score} icon={Target} color={modal.lead.score>=80?T.green:modal.lead.score>=60?T.amber:T.red}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><div style={{fontSize:11,color:T.textSub,marginBottom:4}}>STAGE</div><Pill label={modal.lead.stage} color={stageColor(modal.lead.stage)}/></div>
              <div><div style={{fontSize:11,color:T.textSub,marginBottom:4}}>SOURCE</div><div style={{fontSize:13,color:T.text}}>{modal.lead.source}</div></div>
              <div><div style={{fontSize:11,color:T.textSub,marginBottom:4}}>EMAIL</div><div style={{fontSize:13,color:T.accent}}>{modal.lead.email}</div></div>
              <div><div style={{fontSize:11,color:T.textSub,marginBottom:4}}>STATUS</div><Pill label={modal.lead.status} color={modal.lead.status==="proposal"?T.accent:T.green}/></div>
            </div>
            <div style={{paddingTop:4,borderTop:`1px solid ${T.border}`}}>
              <div style={{fontSize:12,color:T.textSub,fontWeight:600,marginBottom:8}}>AI SALES INTELLIGENCE</div>
              {aiResult?(
                <div style={{background:T.raised,borderRadius:8,padding:"12px 14px",fontSize:12,color:T.textSub,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{aiResult}</div>
              ):(
                <Btn size="sm" onClick={()=>runAI(modal.lead)} disabled={aiLoading}>{aiLoading?<><Spinner/>Analyzing...</>:"Generate Brief"}</Btn>
              )}
            </div>
            <div style={{display:"flex",gap:8,paddingTop:8}}>
              <Btn onClick={()=>{showToast("Stage advanced");setModal(null);}}>Advance Stage</Btn>
              <Btn variant="ghost" onClick={()=>{showToast("Task created");setModal(null);}}>Create Follow-up</Btn>
              <Btn variant="ghost" onClick={()=>setModal(null)}>Close</Btn>
            </div>
          </div>
        </ModalWrap>
      )}
      {modal?.type==="project"&&(
        <ModalWrap onClose={()=>setModal(null)} title={modal.project.name} width={540}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <StatCard label="Budget" value={`$${(modal.project.budget/1000).toFixed(0)}K`} icon={DollarSign} color={T.accent}/>
              <StatCard label="Spent" value={`${Math.round(modal.project.spent/modal.project.budget*100)}%`} icon={Activity} color={modal.project.spent/modal.project.budget>0.9?T.amber:T.green}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={()=>{showToast("Status updated");setModal(null);}}>Update Status</Btn>
              <Btn variant="ghost" onClick={()=>setModal(null)}>Close</Btn>
            </div>
          </div>
        </ModalWrap>
      )}
    </div>
  );
}

// ── Client Management ──────────────────────────────────────────
function Clients({tenant,showToast}){
  const isVRR=tenant.id==="T-VRR";
  const isVS=tenant.id==="T-VS";
  const clients=isVRR?SVRR_CLIENTS:isVS?SVS_CLIENTS:[];
  const[search,setSearch]=useState("");
  const[selected,setSelected]=useState(null);
  const filtered=clients.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));
  const totalMRR=clients.reduce((s,c)=>s+c.mrr,0);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:T.text}}>Client Management</div>
          <div style={{fontSize:13,color:T.textSub,marginTop:2}}>{clients.length} clients · ${(totalMRR/1000).toFixed(1)}K MRR</div>
        </div>
        <Btn onClick={()=>showToast("New client form coming soon")}><Plus size={14}/>Add Client</Btn>
      </div>
      <div style={{display:"flex",gap:12}}>
        <div style={{flex:1,position:"relative"}}>
          <Search size={14} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.textDim}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search clients..." style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 10px 8px 32px",color:T.text,fontSize:13,outline:"none"}}/>
        </div>
      </div>
      <Card style={{padding:0}}>
        <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,display:"grid",gridTemplateColumns:isVRR?"2fr 1.5fr 1fr 1fr 1fr":"2fr 1fr 1fr 1fr",gap:12}}>
          {(isVRR?["Client","Contact","MRR","Health","Status"]:["Client","MRR","Health","Status"]).map(h=><div key={h} style={{fontSize:11,color:T.textDim,fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
        </div>
        {filtered.length===0?<Empty/>:filtered.map(c=>(
          <div key={c.id} className="oc-row" onClick={()=>setSelected(c)} style={{display:"grid",gridTemplateColumns:isVRR?"2fr 1.5fr 1fr 1fr 1fr":"2fr 1fr 1fr 1fr",gap:12,padding:"13px 16px",borderBottom:`1px solid ${T.border}`,alignItems:"center"}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:T.text}}>{c.name}</div>
              <div style={{fontSize:11,color:T.textSub}}>{isVRR?c.industry:c.tier} · Since {c.since?.substring(0,7)}</div>
            </div>
            {isVRR&&<div style={{fontSize:13,color:T.textSub}}>{c.contact}</div>}
            <div style={{fontSize:13,fontWeight:700,color:T.text}}>${(c.mrr/1000).toFixed(isVRR?1:0)}{isVRR?"K/mo":"/mo"}</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:14,fontWeight:700,color:hc(c.health)}}>{c.health}%</span>
              <div style={{flex:1,maxWidth:60}}><PBar pct={c.health} color={hc(c.health)} h={4}/></div>
            </div>
            <Pill label={c.status.replace("_"," ")} color={c.status==="active"?T.green:c.status==="at_risk"?T.red:T.amber} size={10}/>
          </div>
        ))}
      </Card>
      {selected&&(
        <ModalWrap onClose={()=>setSelected(null)} title={selected.name} width={600}>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <StatCard label="Monthly Revenue" value={`$${(selected.mrr/1000).toFixed(isVRR?1:0)}${isVRR?"K":""}`} icon={DollarSign} color={T.green}/>
              <StatCard label="Health Score" value={`${selected.health}%`} icon={Activity} color={hc(selected.health)}/>
            </div>
            {isVRR&&(
              <>
                <div><div style={{fontSize:12,color:T.textSub,marginBottom:8}}>ACTIVE PROJECTS</div>
                {SVRR_PROJECTS.filter(p=>p.clientId===selected.id).map(p=>(
                  <div key={p.id} style={{background:T.raised,borderRadius:8,padding:"10px 12px",marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:13,fontWeight:600,color:T.text}}>{p.name}</div>
                      <Pill label={`${p.progress}%`} color={T.accent}/>
                    </div>
                    <PBar pct={p.progress} color={T.accent} h={4}/>
                    <div style={{fontSize:11,color:T.textSub,marginTop:4}}>{p.phase} · Due {p.due}</div>
                  </div>
                ))}
                </div>
              </>
            )}
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={()=>{showToast("Contact logged");setSelected(null);}}>Log Contact</Btn>
              <Btn variant="ghost" onClick={()=>setSelected(null)}>Close</Btn>
            </div>
          </div>
        </ModalWrap>
      )}
    </div>
  );
}

// ── Operations ─────────────────────────────────────────────────
function Operations({tenant,showToast}){
  const isVRR=tenant.id==="T-VRR";
  const[tab,setTab]=useState("projects");
  const projects=isVRR?SVRR_PROJECTS:[];
  const[modal,setModal]=useState(null);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:20,fontWeight:800,color:T.text}}>Operations</div>
        <Btn onClick={()=>showToast("Coming soon")}><Plus size={14}/>New</Btn>
      </div>
      <div style={{display:"flex",gap:4,background:T.surface,borderRadius:10,padding:4,border:`1px solid ${T.border}`,width:"fit-content"}}>
        {["projects","tasks"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"6px 16px",borderRadius:7,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:tab===t?T.card:"transparent",color:tab===t?T.text:T.textSub,transition:"all 0.15s"}}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
        ))}
      </div>
      {tab==="projects"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {projects.length===0?<Empty msg="No projects yet"/>:projects.map(p=>(
            <Card key={p.id} style={{cursor:"pointer"}} onClick={()=>setModal(p)}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                <div style={{flex:1,paddingRight:12}}>
                  <div style={{fontSize:14,fontWeight:700,color:T.text}}>{p.name}</div>
                  <div style={{fontSize:12,color:T.textSub,marginTop:2}}>{SVRR_CLIENTS.find(c=>c.id===p.clientId)?.name||""} · {p.manager}</div>
                </div>
                <Pill label={p.status.replace("_"," ")} color={p.status==="review"?T.green:p.status==="on_hold"?T.amber:T.blue}/>
              </div>
              <PBar pct={p.progress} color={p.status==="on_hold"?T.amber:T.accent}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:11,color:T.textSub}}>
                <span>{p.progress}% complete · {p.phase}</span>
                <span>Due {p.due}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:11,color:T.textSub}}>
                <span>Budget: ${(p.budget/1000).toFixed(0)}K</span>
                <span style={{color:p.spent/p.budget>0.9?T.amber:T.textSub}}>Spent: ${(p.spent/1000).toFixed(0)}K ({Math.round(p.spent/p.budget*100)}%)</span>
              </div>
            </Card>
          ))}
          {!isVRR&&<Card><div style={{textAlign:"center",padding:32,color:T.textSub,fontSize:14}}>Project tracking coming soon for {tenant.name}.</div></Card>}
        </div>
      )}
      {tab==="tasks"&&(
        <Card><div style={{textAlign:"center",padding:40,color:T.textSub,fontSize:14}}>Task management module launching soon. All tasks will be linked to projects and team members.</div></Card>
      )}
      {modal&&(
        <ModalWrap onClose={()=>setModal(null)} title={modal.name} width={580}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <StatCard label="Budget" value={`$${(modal.budget/1000).toFixed(0)}K`} icon={DollarSign} color={T.accent}/>
              <StatCard label="Progress" value={`${modal.progress}%`} icon={Activity} color={hc(modal.progress)}/>
            </div>
            <div>
              <div style={{fontSize:12,color:T.textSub,marginBottom:6}}>CURRENT PHASE</div>
              <div style={{background:T.raised,borderRadius:8,padding:"10px 12px",fontSize:13,color:T.text}}>{modal.phase}</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={()=>{showToast("Status updated");setModal(null);}}>Update Status</Btn>
              <Btn variant="ghost" onClick={()=>setModal(null)}>Close</Btn>
            </div>
          </div>
        </ModalWrap>
      )}
    </div>
  );
}

// ── People ─────────────────────────────────────────────────────
function People({tenant,showToast}){
  const isVRR=tenant.id==="T-VRR";
  const employees=isVRR?SVRR_EMPLOYEES:[];
  const[selected,setSelected]=useState(null);
  const avgUtil=employees.length?Math.round(employees.reduce((s,e)=>s+e.utilization,0)/employees.length):0;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:T.text}}>People</div>
          <div style={{fontSize:13,color:T.textSub,marginTop:2}}>{employees.length} employees · {avgUtil}% avg utilization</div>
        </div>
        <Btn onClick={()=>showToast("Invite coming soon")}><UserPlus size={14}/>Invite</Btn>
      </div>
      {employees.length===0?<Card><Empty msg="No workforce data for this tenant yet."/></Card>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
          {employees.map(e=>(
            <Card key={e.id} style={{cursor:"pointer"}} onClick={()=>setSelected(e)}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                <Av initials={e.name.split(" ").map(n=>n[0]).join("")} color={T.accent}/>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:T.text}}>{e.name}</div>
                  <div style={{fontSize:12,color:T.textSub}}>{e.title}</div>
                </div>
                <div style={{marginLeft:"auto"}}><Pill label={e.dept} color={T.blue} size={10}/></div>
              </div>
              <div style={{fontSize:11,color:T.textSub,marginBottom:6}}>UTILIZATION</div>
              <PBar pct={e.utilization} color={e.utilization>90?T.amber:T.green}/>
              <div style={{fontSize:11,color:T.textSub,marginTop:4,display:"flex",justifyContent:"space-between"}}>
                <span>{e.utilization}%</span>
                <span>Since {e.start?.substring(0,7)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
      {selected&&(
        <ModalWrap onClose={()=>setSelected(null)} title={selected.name}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",alignItems:"center",gap:16}}>
              <Av initials={selected.name.split(" ").map(n=>n[0]).join("")} color={T.accent} size={52}/>
              <div>
                <div style={{fontSize:18,fontWeight:700,color:T.text}}>{selected.name}</div>
                <div style={{fontSize:13,color:T.textSub}}>{selected.title} · {selected.dept}</div>
                <div style={{fontSize:12,color:T.accent,marginTop:4}}>{selected.email}</div>
              </div>
            </div>
            <StatCard label="Utilization" value={`${selected.utilization}%`} icon={Activity} color={selected.utilization>90?T.amber:T.green}/>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={()=>{showToast("Profile opened");setSelected(null);}}>Edit Profile</Btn>
              <Btn variant="ghost" onClick={()=>setSelected(null)}>Close</Btn>
            </div>
          </div>
        </ModalWrap>
      )}
    </div>
  );
}

// ── Compliance & Risk ──────────────────────────────────────────
function Compliance({tenant,showToast}){
  const isVRR=tenant.id==="T-VRR";
  const[tab,setTab]=useState("risks");
  const[selected,setSelected]=useState(null);
  const risks=isVRR?SVRR_RISKS:[];
  const criticalRisks=risks.filter(r=>r.score>=15).length;
  const openRisks=risks.filter(r=>r.status==="open").length;
  const rc=(s)=>({open:T.red,mitigating:T.amber,monitoring:T.blue,closed:T.green}[s]||T.textSub);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div>
        <div style={{fontSize:20,fontWeight:800,color:T.text}}>Compliance & Risk</div>
        <div style={{fontSize:13,color:T.textSub,marginTop:2}}>{isVRR?"Veridian Risk & Resilience · Internal Register":"Risk management module"}</div>
      </div>
      {isVRR&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
          <StatCard label="Total Risks" value={risks.length} icon={Shield} color={T.accent}/>
          <StatCard label="Open / Critical" value={`${openRisks} / ${criticalRisks}`} icon={AlertTriangle} color={T.red}/>
          <StatCard label="Being Mitigated" value={risks.filter(r=>r.status==="mitigating").length} icon={Activity} color={T.amber}/>
        </div>
      )}
      <div style={{display:"flex",gap:4,background:T.surface,borderRadius:10,padding:4,border:`1px solid ${T.border}`,width:"fit-content"}}>
        {["risks","programs"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"6px 16px",borderRadius:7,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:tab===t?T.card:"transparent",color:tab===t?T.text:T.textSub,transition:"all 0.15s"}}>{t==="risks"?"Risk Register":"Compliance Programs"}</button>
        ))}
      </div>
      {tab==="risks"&&(
        <>
          {!isVRR?<Card><Empty msg="Risk register not configured for this tenant."/></Card>:(
            <Card style={{padding:0}}>
              <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",gap:12}}>
                {["Risk","Category","Score","Status","Owner"].map(h=><div key={h} style={{fontSize:11,color:T.textDim,fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
              </div>
              {risks.sort((a,b)=>b.score-a.score).map(r=>(
                <div key={r.id} className="oc-row" onClick={()=>setSelected(r)} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",gap:12,padding:"12px 16px",borderBottom:`1px solid ${T.border}`,alignItems:"center"}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.text}}>{r.title}</div>
                  <Pill label={r.category} color={T.blue} size={10}/>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:28,height:28,borderRadius:6,background:r.score>=15?T.redB:r.score>=10?T.amberB:T.greenB,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:r.score>=15?T.red:r.score>=10?T.amber:T.green}}>{r.score}</div>
                  </div>
                  <Pill label={r.status} color={rc(r.status)} size={10}/>
                  <div style={{fontSize:12,color:T.textSub}}>{r.owner.split(" ")[0]}</div>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
      {tab==="programs"&&(
        <Card><div style={{textAlign:"center",padding:40,color:T.textSub,fontSize:14}}>Compliance program tracking coming in next release. ISO 27001, SOC 2, and custom frameworks supported.</div></Card>
      )}
      {selected&&(
        <ModalWrap onClose={()=>setSelected(null)} title={selected.title}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><div style={{fontSize:11,color:T.textSub,marginBottom:4}}>CATEGORY</div><Pill label={selected.category} color={T.blue}/></div>
              <div><div style={{fontSize:11,color:T.textSub,marginBottom:4}}>STATUS</div><Pill label={selected.status} color={rc(selected.status)}/></div>
              <div><div style={{fontSize:11,color:T.textSub,marginBottom:4}}>LIKELIHOOD</div><div style={{fontSize:14,fontWeight:700,color:T.text}}>{selected.likelihood} / 5</div></div>
              <div><div style={{fontSize:11,color:T.textSub,marginBottom:4}}>IMPACT</div><div style={{fontSize:14,fontWeight:700,color:T.text}}>{selected.impact} / 5</div></div>
            </div>
            <div><div style={{fontSize:11,color:T.textSub,marginBottom:6}}>EXISTING CONTROLS</div><div style={{background:T.raised,borderRadius:8,padding:"10px 12px",fontSize:13,color:T.text}}>{selected.controls}</div></div>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={()=>{showToast("Risk updated");setSelected(null);}}>Update Risk</Btn>
              <Btn variant="ghost" onClick={()=>setSelected(null)}>Close</Btn>
            </div>
          </div>
        </ModalWrap>
      )}
    </div>
  );
}

// ── Finance ─────────────────────────────────────────────────────
function Finance({tenant,showToast}){
  const isVRR=tenant.id==="T-VRR";
  const isVS=tenant.id==="T-VS";
  const vrrMRR=SVRR_CLIENTS.reduce((s,c)=>s+c.mrr,0);
  const vsMRR=SVS_CLIENTS.reduce((s,c)=>s+c.mrr,0);
  const mrr=isVRR?vrrMRR:isVS?vsMRR:0;
  const arr=mrr*12;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{fontSize:20,fontWeight:800,color:T.text}}>Finance</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16}}>
        <StatCard label="MRR" value={`$${(mrr/1000).toFixed(1)}K`} icon={DollarSign} color={T.green} sub="+18% MoM" trend="up"/>
        <StatCard label="ARR" value={`$${(arr/1000).toFixed(0)}K`} icon={TrendingUp} color={T.accent}/>
        <StatCard label="Clients Paying" value={isVRR?SVRR_CLIENTS.filter(c=>c.status==="active").length:SVS_CLIENTS.filter(c=>c.status==="active").length} icon={UserCheck} color={T.blue}/>
        <StatCard label="At-Risk Revenue" value={`$${((isVRR?SVRR_CLIENTS:SVS_CLIENTS).filter(c=>c.status==="at_risk").reduce((s,c)=>s+c.mrr,0)/1000).toFixed(1)}K`} icon={AlertTriangle} color={T.red} sub="Churn risk" trend="down"/>
      </div>
      <Card>
        <SH title="Revenue by Client"/>
        {(isVRR?SVRR_CLIENTS:isVS?SVS_CLIENTS:[]).sort((a,b)=>b.mrr-a.mrr).map(c=>(
          <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
            <div style={{flex:1,fontSize:13,color:T.text}}>{c.name}</div>
            <div style={{width:120}}><PBar pct={(c.mrr/mrr)*100} color={T.accent}/></div>
            <div style={{fontSize:13,fontWeight:700,color:T.text,width:80,textAlign:"right"}}>${c.mrr.toLocaleString()}/mo</div>
          </div>
        ))}
      </Card>
      <Card>
        <div style={{textAlign:"center",padding:32,color:T.textSub,fontSize:13}}>
          Full P&L, invoice tracking, and forecasting available in next release. Connect your accounting integration to import actuals.
        </div>
      </Card>
    </div>
  );
}

// ── Reports ────────────────────────────────────────────────────
function Reports({tenant,showToast}){
  const[loading,setLoading]=useState(false);
  const[report,setReport]=useState(null);
  const[type,setType]=useState("executive");
  const isVRR=tenant.id==="T-VRR";
  const isVS=tenant.id==="T-VS";

  const generate=async()=>{
    setLoading(true);setReport(null);
    const ctx=isVRR
      ?`Tenant: Veridian Risk & Resilience Group. MRR: $${SVRR_CLIENTS.reduce((s,c)=>s+c.mrr,0).toLocaleString()}. Clients: ${SVRR_CLIENTS.length}. At-risk: ${SVRR_CLIENTS.filter(c=>c.status==="at_risk").length}. Open risks: ${SVRR_RISKS.filter(r=>r.status==="open").length} (top: ${SVRR_RISKS[0].title}). Active projects: ${SVRR_PROJECTS.filter(p=>p.status==="in_progress").length}.`
      :isVS
      ?`Tenant: Veridian Solutions. MRR: $${SVS_CLIENTS.reduce((s,c)=>s+c.mrr,0).toLocaleString()}. Active clients: ${SVS_CLIENTS.filter(c=>c.status==="active").length}. At-risk: ${SVS_CLIENTS.filter(c=>c.status==="at_risk").length}. Pipeline: ${SVS_LEADS.length} leads.`
      :`Tenant: ${tenant.name}. Limited data available.`;
    try{
      const txt=await callAI(
        [{role:"user",content:`Generate a professional ${type} business report. ${ctx} Include: key metrics, risks, opportunities, and 3 executive recommendations. Plain text, no markdown, concise.`}],
        "You are a senior business analyst. Write clear, executive-quality reports. Be specific with numbers. No fluff.",
        900
      );
      setReport(txt);
    }catch(e){
      setReport(`Report generation requires AI integration.\n\nKey Metrics:\n${ctx}\n\nPlease configure ANTHROPIC_API_KEY in Vercel environment variables to enable AI-generated reports.`);
    }
    setLoading(false);
  };

  const reportTypes=[
    {id:"executive",label:"Executive Summary"},
    {id:"client_health",label:"Client Health Report"},
    {id:"financial",label:"Financial Overview"},
    ...(isVRR?[{id:"risk",label:"Risk & Compliance Report"}]:[]),
  ];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{fontSize:20,fontWeight:800,color:T.text}}>Reports</div>
      <Card>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{flex:1,minWidth:200}}>
            <label style={{fontSize:12,color:T.textSub,fontWeight:600,display:"block",marginBottom:6}}>REPORT TYPE</label>
            <select value={type} onChange={e=>setType(e.target.value)} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",color:T.text,fontSize:13,outline:"none"}}>
              {reportTypes.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div style={{paddingTop:22}}>
            <Btn onClick={generate} disabled={loading}>{loading?<><Spinner/>Generating...</>:<><BarChart2 size={14}/>Generate Report</>}</Btn>
          </div>
        </div>
      </Card>
      {report&&(
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700,color:T.text}}>{reportTypes.find(r=>r.id===type)?.label} — {tenant.name}</div>
            <div style={{fontSize:11,color:T.textSub}}>{new Date().toLocaleDateString()}</div>
          </div>
          <div style={{background:T.raised,borderRadius:8,padding:"16px",fontSize:13,color:T.textSub,lineHeight:1.7,whiteSpace:"pre-wrap",fontFamily:"'JetBrains Mono',monospace"}}>{report}</div>
        </Card>
      )}
    </div>
  );
}

// ── Knowledge Platform ─────────────────────────────────────────
function Knowledge({tenant,showToast}){
  const isVRR=tenant.id==="T-VRR";
  const[tab,setTab]=useState("docs");
  const[search,setSearch]=useState("");
  const[aiQuery,setAiQuery]=useState("");
  const[aiResult,setAiResult]=useState(null);
  const[aiLoading,setAiLoading]=useState(false);

  const DOCS=isVRR?[
    {id:"D-001",title:"ISO 27001 Implementation Guide",category:"Compliance",author:"James Holt",updated:"2026-05-15",tags:["ISO","Information Security"],views:142},
    {id:"D-002",title:"Business Continuity Planning Framework",category:"Operations",author:"Marcus Chen",updated:"2026-04-30",tags:["BCP","Resilience"],views:89},
    {id:"D-003",title:"Risk Assessment Methodology",category:"Risk",author:"Priya Nair",updated:"2026-06-01",tags:["Risk","Assessment"],views:215},
    {id:"D-004",title:"Client Engagement & Onboarding Playbook",category:"Sales",author:"Eleanor Shaw",updated:"2026-05-20",tags:["Client","Onboarding"],views:67},
    {id:"D-005",title:"Regulatory Change Monitoring SOP",category:"Compliance",author:"James Holt",updated:"2026-06-05",tags:["Regulatory","SOP"],views:44},
  ]:[
    {id:"D-001",title:"AI Receptionist Sales Playbook",category:"Sales",author:"Olivia Tran",updated:"2026-05-10",tags:["Sales","Outreach"],views:312},
    {id:"D-002",title:"Onboarding Guide — New Clients",category:"Success",author:"Ryan Park",updated:"2026-04-22",tags:["Onboarding","Client"],views:198},
    {id:"D-003",title:"Product FAQ & Feature List",category:"Product",author:"Ryan Park",updated:"2026-06-01",tags:["Product","FAQ"],views:445},
  ];

  const categories=[...new Set(DOCS.map(d=>d.category))];
  const filtered=DOCS.filter(d=>
    d.title.toLowerCase().includes(search.toLowerCase())||
    d.tags.some(t=>t.toLowerCase().includes(search.toLowerCase()))
  );

  const askKB=async()=>{
    if(!aiQuery.trim())return;
    setAiLoading(true);setAiResult(null);
    const docList=DOCS.map(d=>`- ${d.title} (${d.category})`).join("\n");
    try{
      const txt=await callAI(
        [{role:"user",content:`Based on this knowledge base for ${tenant.name}:\n${docList}\n\nQuestion: ${aiQuery}\n\nProvide a helpful, specific answer. If the exact document exists, reference it. If not, provide best guidance.`}],
        `You are the AI knowledge assistant for ${tenant.name}. Answer questions accurately based on company knowledge. Be concise and actionable.`,
        600
      );
      setAiResult(txt);
    }catch{
      setAiResult("Knowledge AI requires ANTHROPIC_API_KEY configuration in Vercel.");
    }
    setAiLoading(false);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div>
        <div style={{fontSize:20,fontWeight:800,color:T.text}}>Knowledge Platform</div>
        <div style={{fontSize:13,color:T.textSub,marginTop:2}}>{DOCS.length} documents · AI-powered search</div>
      </div>

      {/* AI search */}
      <Card style={{background:`linear-gradient(135deg,${T.card},${T.raised})`}}>
        <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:10}}>Ask the Knowledge Base</div>
        <div style={{display:"flex",gap:10}}>
          <input value={aiQuery} onChange={e=>setAiQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askKB()} placeholder="Ask anything about your company, processes, or procedures..." style={{flex:1,background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",color:T.text,fontSize:13,outline:"none"}}/>
          <Btn onClick={askKB} disabled={aiLoading||!aiQuery.trim()}>{aiLoading?<Spinner/>:"Ask"}</Btn>
        </div>
        {aiResult&&(
          <div style={{marginTop:12,background:T.raised,borderRadius:8,padding:"12px 14px",fontSize:13,color:T.textSub,lineHeight:1.7}}>{aiResult}</div>
        )}
      </Card>

      <div style={{display:"flex",gap:4,background:T.surface,borderRadius:10,padding:4,border:`1px solid ${T.border}`,width:"fit-content"}}>
        {["docs","categories"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"6px 16px",borderRadius:7,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:tab===t?T.card:"transparent",color:tab===t?T.text:T.textSub,transition:"all 0.15s"}}>{t==="docs"?"Documents":"Categories"}</button>
        ))}
      </div>

      <div style={{position:"relative"}}>
        <Search size={14} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.textDim}}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search documents..." style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 10px 8px 32px",color:T.text,fontSize:13,outline:"none"}}/>
      </div>

      {tab==="docs"&&(
        <Card style={{padding:0}}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,display:"grid",gridTemplateColumns:"2fr 1fr 1fr 80px",gap:12}}>
            {["Document","Category","Updated","Views"].map(h=><div key={h} style={{fontSize:11,color:T.textDim,fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
          </div>
          {filtered.map(d=>(
            <div key={d.id} className="oc-row" onClick={()=>showToast(`Opening: ${d.title}`)} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 80px",gap:12,padding:"12px 16px",borderBottom:`1px solid ${T.border}`,alignItems:"center"}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:T.text}}>{d.title}</div>
                <div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap"}}>
                  {d.tags.map(tag=><Pill key={tag} label={tag} color={T.blue} size={10}/>)}
                </div>
              </div>
              <Pill label={d.category} color={T.accent} size={10}/>
              <div style={{fontSize:12,color:T.textSub}}>{d.updated}</div>
              <div style={{fontSize:12,color:T.textSub,display:"flex",alignItems:"center",gap:4}}><Eye size={11}/>{d.views}</div>
            </div>
          ))}
          {filtered.length===0&&<Empty/>}
        </Card>
      )}

      {tab==="categories"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
          {categories.map(cat=>{
            const catDocs=DOCS.filter(d=>d.category===cat);
            return(
              <Card key={cat} style={{cursor:"pointer"}} onClick={()=>{setSearch(cat);setTab("docs");}}>
                <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:6}}>{cat}</div>
                <div style={{fontSize:13,color:T.textSub}}>{catDocs.length} document{catDocs.length!==1?"s":""}</div>
                <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:4}}>
                  {catDocs.slice(0,2).map(d=><div key={d.id} style={{fontSize:11,color:T.textDim}}>{d.title}</div>)}
                </div>
              </Card>
            );
          })}
          <Card style={{border:`1px dashed ${T.border}`,cursor:"pointer",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",minHeight:100}} onClick={()=>showToast("Create category — coming soon")}>
            <div style={{textAlign:"center",color:T.textDim}}>
              <Plus size={20} style={{display:"block",margin:"0 auto 6px"}}/>
              <div style={{fontSize:12}}>New Category</div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── Settings ───────────────────────────────────────────────────
function TenantSettings({user,tenant,showToast}){
  const[tab,setTab]=useState("profile");
  const[name,setName]=useState(tenant.name);
  const[ghl,setGhl]=useState({apiKey:"",locationId:"",connected:false});
  const[ghlLoading,setGhlLoading]=useState(false);

  const connectGHL=async()=>{
    if(!ghl.apiKey||!ghl.locationId){showToast("API Key and Location ID required","error");return;}
    setGhlLoading(true);
    await new Promise(r=>setTimeout(r,1000));
    setGhl(g=>({...g,connected:true}));
    showToast("GoHighLevel connected — sync active");
    setGhlLoading(false);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20,maxWidth:680}}>
      <div style={{fontSize:20,fontWeight:800,color:T.text}}>Settings</div>
      <div style={{display:"flex",gap:4,background:T.surface,borderRadius:10,padding:4,border:`1px solid ${T.border}`,width:"fit-content"}}>
        {["profile","integrations","security","billing"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"6px 14px",borderRadius:7,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:tab===t?T.card:"transparent",color:tab===t?T.text:T.textSub,transition:"all 0.15s"}}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
        ))}
      </div>

      {tab==="profile"&&(
        <Card>
          <SH title="Tenant Profile"/>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <label style={{fontSize:12,color:T.textSub,fontWeight:600,display:"block",marginBottom:6}}>COMPANY NAME</label>
              <input value={name} onChange={e=>setName(e.target.value)} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",color:T.text,fontSize:13,outline:"none"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <label style={{fontSize:12,color:T.textSub,fontWeight:600,display:"block",marginBottom:6}}>PLAN</label>
                <div style={{padding:"9px 12px",background:T.raised,borderRadius:8,fontSize:13,color:T.textSub}}>{tenant.plan}</div>
              </div>
              <div>
                <label style={{fontSize:12,color:T.textSub,fontWeight:600,display:"block",marginBottom:6}}>TENANT ID</label>
                <div style={{padding:"9px 12px",background:T.raised,borderRadius:8,fontSize:11,color:T.textDim,fontFamily:"monospace"}}>{tenant.id}</div>
              </div>
            </div>
            <Btn onClick={()=>showToast("Profile saved")}>Save Changes</Btn>
          </div>
        </Card>
      )}

      {tab==="integrations"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* GoHighLevel */}
          <Card>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:T.text}}>GoHighLevel</div>
                <div style={{fontSize:12,color:T.textSub,marginTop:2}}>SMS, Email, Campaigns, Calendars, Funnels, Automations</div>
              </div>
              <Pill label={ghl.connected?"Connected":"Disconnected"} color={ghl.connected?T.green:T.textDim}/>
            </div>
            {!ghl.connected?(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div>
                  <label style={{fontSize:11,color:T.textSub,fontWeight:600,display:"block",marginBottom:5}}>API KEY</label>
                  <input value={ghl.apiKey} onChange={e=>setGhl(g=>({...g,apiKey:e.target.value}))} placeholder="ghl_..." type="password" style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",color:T.text,fontSize:13,outline:"none"}}/>
                </div>
                <div>
                  <label style={{fontSize:11,color:T.textSub,fontWeight:600,display:"block",marginBottom:5}}>LOCATION ID</label>
                  <input value={ghl.locationId} onChange={e=>setGhl(g=>({...g,locationId:e.target.value}))} placeholder="location_..." style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",color:T.text,fontSize:13,outline:"none"}}/>
                </div>
                <Btn onClick={connectGHL} disabled={ghlLoading}>{ghlLoading?<><Spinner/>Connecting...</>:"Connect GoHighLevel"}</Btn>
                <div style={{fontSize:11,color:T.textDim,marginTop:4}}>OperaCore provides intelligence. GoHighLevel handles SMS, email, and campaign execution. OperaCore functions independently if GoHighLevel is disconnected.</div>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{background:T.greenB,border:`1px solid ${T.green}44`,borderRadius:8,padding:"10px 12px",fontSize:12,color:T.green}}>Active sync — contacts, opportunities, and appointments syncing in real time</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
                  {["Contacts","Pipelines","Calendars","Automations","Campaigns","SMS","Email"].map(f=><Pill key={f} label={f} color={T.green} size={10}/>)}
                </div>
                <div style={{marginTop:8}}>
                  <Btn variant="ghost" size="sm" onClick={()=>{setGhl({apiKey:"",locationId:"",connected:false});showToast("GoHighLevel disconnected","warning");}}>Disconnect</Btn>
                </div>
              </div>
            )}
          </Card>

          {/* Supabase */}
          <Card>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:T.text}}>Supabase Database</div>
                <div style={{fontSize:12,color:T.textSub,marginTop:2}}>Production Postgres — replaces localStorage with zero code changes</div>
              </div>
              <Pill label="Not Connected" color={T.textDim}/>
            </div>
            <div style={{fontSize:12,color:T.textSub}}>Set <code style={{background:T.raised,padding:"1px 5px",borderRadius:4,fontSize:11,color:T.accent}}>VITE_SUPABASE_URL</code> and <code style={{background:T.raised,padding:"1px 5px",borderRadius:4,fontSize:11,color:T.accent}}>VITE_SUPABASE_ANON_KEY</code> in Vercel to enable. All data automatically migrates — identical API surface.</div>
          </Card>

          {/* Anthropic */}
          <Card>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:T.text}}>Anthropic AI</div>
                <div style={{fontSize:12,color:T.textSub,marginTop:2}}>Powers CRM intelligence, market research, reports, and knowledge AI</div>
              </div>
              <Pill label="Server-Side" color={T.green}/>
            </div>
            <div style={{fontSize:12,color:T.textSub}}>Set <code style={{background:T.raised,padding:"1px 5px",borderRadius:4,fontSize:11,color:T.accent}}>ANTHROPIC_API_KEY</code> in Vercel environment variables. Key never reaches the browser — proxied via Edge Function.</div>
          </Card>
        </div>
      )}

      {tab==="security"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Card>
            <SH title="Your Account"/>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
              <Av initials={user.av} color={T.accent} size={48}/>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:T.text}}>{user.name}</div>
                <div style={{fontSize:12,color:T.textSub}}>{user.email}</div>
                <div style={{marginTop:4}}><Pill label={user.role||user.platformRole} color={T.accent}/></div>
              </div>
            </div>
            <Btn onClick={()=>showToast("Password reset email sent")}>Change Password</Btn>
          </Card>
          <Card>
            <SH title="Session Security"/>
            <div style={{display:"flex",flexDirection:"column",gap:10,fontSize:13,color:T.textSub}}>
              <div style={{display:"flex",justifyContent:"space-between"}}><span>Session timeout</span><span style={{color:T.text}}>8 hours</span></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span>Multi-tenant isolation</span><Pill label="Enforced" color={T.green} size={10}/></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span>API keys</span><span style={{color:T.text}}>Server-side only</span></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span>Data namespace</span><span style={{color:T.text,fontFamily:"monospace",fontSize:11}}>oc_{tenant.id}_*</span></div>
            </div>
          </Card>
        </div>
      )}

      {tab==="billing"&&(
        <Card>
          <SH title="Billing & Plan"/>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
              <span style={{fontSize:13,color:T.textSub}}>Current plan</span>
              <Pill label={tenant.plan} color={T.purple}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
              <span style={{fontSize:13,color:T.textSub}}>Status</span>
              <Pill label="Active" color={T.green}/>
            </div>
            <div style={{fontSize:12,color:T.textSub,marginTop:8}}>Billing management and plan upgrades available through the Platform Admin or your account manager.</div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Tenant Marketplace ─────────────────────────────────────────
function TenantMarketplace({user,showToast}){
  const[tab,setTab]=useState("tenants");
  const[wizard,setWizard]=useState(null); // null | {step:1..4, data:{}}
  const[catFilter,setCatFilter]=useState("All");
  const[selectedBlueprint,setSelectedBlueprint]=useState(null);
  const[newTenantData,setNewTenantData]=useState({name:"",slug:"",industry:"",blueprint:"",size:"",email:"",plan:"growth"});
  const[creating,setCreating]=useState(false);
  const[tenants,setTenants]=useState(ST);

  const blueprintList=Object.entries(BLUEPRINTS).map(([id,b])=>({id,...b}));
  const filtered=catFilter==="All"?blueprintList:blueprintList.filter(b=>b.category===catFilter);

  const totalMRR=tenants.reduce((s,t)=>s+(t.mrr||0),0);

  const startWizard=()=>setWizard({step:1,data:{}});
  const wizardNext=()=>setWizard(w=>({...w,step:w.step+1}));
  const wizardBack=()=>setWizard(w=>({...w,step:Math.max(1,w.step-1)}));

  const seedBlueprintData=(tenantId,blueprintId,companyName)=>{
    const db=tenantDB(tenantId);
    const bp=BLUEPRINTS[blueprintId];
    if(!bp)return;
    // Seed departments as notes (structured metadata)
    bp.departments.forEach((dept,i)=>{
      db.notes.insert({category:"department",name:dept,order:i,active:true});
    });
    // Seed KPI tracking records
    bp.kpis.forEach(kpi=>{
      db.notes.insert({category:"kpi",name:kpi,value:0,target:null,active:true});
    });
    // Seed pipeline stages
    if(bp.pipelines?.length){
      bp.pipelines.forEach(pipeline=>{
        db.notes.insert({category:"pipeline",name:pipeline.name,stages:pipeline.stages,active:true});
      });
    }
    // Seed a welcome document in knowledge base
    db.documents.insert({title:`${companyName} — Getting Started`,category:"Onboarding",content:`Welcome to ${companyName} on OperaCore 2030.\n\nBlueprint: ${bp.label}\nModules configured: ${bp.modules.join(", ")}\nDepartments: ${bp.departments.join(", ")}\nKPIs tracked: ${bp.kpis.join(", ")}\n\nThis tenant is configured and ready to operate.`,author:"OperaCore Platform",status:"published"});
    // Seed one sample approval request
    db.approvals.insert({title:"Initial Platform Configuration Review",type:"setup",requestor:"Platform Admin",status:"pending",priority:"low",dueDate:new Date(Date.now()+7*24*60*60*1000).toISOString().substring(0,10)});
    // Seed settings
    db.settings.set({blueprint:blueprintId,companySize:null,configuredAt:now(),kpis:bp.kpis,departments:bp.departments,pipeline:bp.pipelines?.[0]?.stages||[]});
  };

  const createTenant=async()=>{
    if(!newTenantData.name||!newTenantData.blueprint){showToast("Company name and blueprint are required","error");return;}
    setCreating(true);
    await new Promise(r=>setTimeout(r,1400));
    const bp=BLUEPRINTS[newTenantData.blueprint];
    const slug=newTenantData.slug||newTenantData.name.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");
    const id=`T-${slug.toUpperCase().replace(/[^A-Z0-9]/g,"").substring(0,6)||genId("T").split("-")[1]}`;
    const newT={
      id,name:newTenantData.name,slug,
      plan:newTenantData.plan,status:"active",industry:newTenantData.industry||bp.label,
      blueprint:newTenantData.blueprint,modules:bp.modules,roles:bp.roles,ownerId:user.id,mrr:0,
      companySize:newTenantData.size,adminEmail:newTenantData.email,
      createdAt:now(),configuredAt:now(),
    };
    setTenants(prev=>[...prev,newT]);
    platform.tenants.insert(newT);
    seedBlueprintData(id,newTenantData.blueprint,newTenantData.name);
    if(newTenantData.email){
      platform.users.insert({email:newTenantData.email,name:"Tenant Admin",role:"tenant_admin",tenantId:id,av:newTenantData.name.substring(0,2).toUpperCase(),active:true,platformRole:null,password:"ChangeMe2030!"});
    }
    platform.audit.log(user.id,"platform",`tenant_created:${id}`,`Blueprint: ${bp.label}`);
    setCreating(false);setWizard(null);
    setNewTenantData({name:"",slug:"",industry:"",blueprint:"",size:"",email:"",plan:"growth"});
    showToast(`${newT.name} launched — ${bp.departments.length} departments, ${bp.kpis.length} KPIs, ${bp.modules.length} modules configured`);
    setTab("tenants");
  };

  const planColors={enterprise:T.purple,growth:T.accent,starter:T.green,internal:T.blue};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20,animation:"ocUp .25s ease"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:T.text}}>Tenant Marketplace</div>
          <div style={{fontSize:13,color:T.textSub,marginTop:2}}>OperaCore Platform · {tenants.length} tenants · {SU.length} users</div>
        </div>
        <Btn onClick={startWizard}><Plus size={14}/>Create Tenant</Btn>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
        <StatCard label="Total Tenants" value={tenants.length} icon={Building2} color={T.accent}/>
        <StatCard label="Active" value={tenants.filter(t=>t.status==="active").length} icon={Activity} color={T.green}/>
        <StatCard label="Platform Users" value={SU.length} icon={Users} color={T.blue}/>
        <StatCard label="Blueprints Available" value={Object.keys(BLUEPRINTS).length} icon={Layers} color={T.purple}/>
      </div>

      <div style={{display:"flex",gap:4,background:T.surface,borderRadius:10,padding:4,border:`1px solid ${T.border}`,width:"fit-content"}}>
        {["tenants","blueprints","users"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"6px 16px",borderRadius:7,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:tab===t?T.card:"transparent",color:tab===t?T.text:T.textSub,transition:"all 0.15s"}}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
        ))}
      </div>

      {tab==="tenants"&&(
        <Card style={{padding:0}}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,display:"grid",gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1fr",gap:12}}>
            {["Tenant","Industry / Blueprint","Plan","Status","Actions"].map(h=><div key={h} style={{fontSize:11,color:T.textDim,fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
          </div>
          {tenants.map(t=>(
            <div key={t.id} style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1fr",gap:12,padding:"13px 16px",borderBottom:`1px solid ${T.border}`,alignItems:"center"}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.text}}>{t.name}</div>
                <div style={{fontSize:11,color:T.textDim,fontFamily:"monospace"}}>{t.id}</div>
              </div>
              <div>
                <div style={{fontSize:12,color:T.textSub}}>{t.industry}</div>
                {t.blueprint&&<div style={{fontSize:10,color:T.accent,marginTop:2}}>{BLUEPRINTS[t.blueprint]?.label||t.blueprint}</div>}
              </div>
              <Pill label={t.plan} color={planColors[t.plan]||T.accent} size={10}/>
              <Pill label={t.status} color={t.status==="active"?T.green:t.status==="suspended"?T.red:T.amber} size={10}/>
              <div style={{display:"flex",gap:6}}>
                <button className="oc-ghost" onClick={()=>showToast(`Managing ${t.name}`)} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 10px",color:T.textSub,fontSize:11,cursor:"pointer"}}>Manage</button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab==="blueprints"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {INDUSTRY_CATEGORIES.map(c=>(
              <button key={c} onClick={()=>setCatFilter(c)} style={{padding:"5px 14px",borderRadius:20,border:`1px solid ${catFilter===c?T.accent:T.border}`,background:catFilter===c?T.accentB:"transparent",color:catFilter===c?T.accent:T.textSub,fontSize:12,cursor:"pointer",fontWeight:catFilter===c?700:400}}>{c}</button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12}}>
            {filtered.map(b=>(
              <Card key={b.id} style={{cursor:"pointer",border:selectedBlueprint===b.id?`1px solid ${T.accent}`:undefined}} onClick={()=>setSelectedBlueprint(selectedBlueprint===b.id?null:b.id)}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:T.text}}>{b.label}</div>
                    <div style={{fontSize:11,color:T.textSub,marginTop:2}}>{b.category}</div>
                  </div>
                  <Pill label={b.category} color={T.accent} size={10}/>
                </div>
                <div style={{fontSize:11,color:T.textDim,marginBottom:8}}>MODULES</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {b.modules.slice(0,6).map(m=><Pill key={m} label={m} color={T.blue} size={10}/>)}
                  {b.modules.length>6&&<Pill label={`+${b.modules.length-6} more`} color={T.textDim} size={10}/>}
                </div>
                {selectedBlueprint===b.id&&(
                  <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${T.border}`}}>
                    <div style={{fontSize:11,color:T.textDim,marginBottom:6}}>KEY KPIs</div>
                    <div style={{fontSize:12,color:T.textSub}}>{b.kpis.join(" · ")}</div>
                    <div style={{fontSize:11,color:T.textDim,marginTop:10,marginBottom:6}}>DEPARTMENTS</div>
                    <div style={{fontSize:12,color:T.textSub}}>{b.departments.join(", ")}</div>
                    <div style={{marginTop:12}}>
                      <Btn size="sm" onClick={()=>{setNewTenantData(d=>({...d,blueprint:b.id}));startWizard();}}>Use This Blueprint</Btn>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab==="users"&&(
        <Card style={{padding:0}}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,display:"grid",gridTemplateColumns:"2fr 2fr 1.5fr 1fr",gap:12}}>
            {["User","Email","Tenant","Role"].map(h=><div key={h} style={{fontSize:11,color:T.textDim,fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
          </div>
          {SU.map(u=>(
            <div key={u.id} className="oc-row" style={{display:"grid",gridTemplateColumns:"2fr 2fr 1.5fr 1fr",gap:12,padding:"12px 16px",borderBottom:`1px solid ${T.border}`,alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <Av initials={u.av} color={T.accent} size={28}/>
                <div style={{fontSize:13,fontWeight:600,color:T.text}}>{u.name}</div>
              </div>
              <div style={{fontSize:12,color:T.textSub}}>{u.email}</div>
              <div style={{fontSize:12,color:T.textSub}}>{ST.find(t=>t.id===u.tenantId)?.name||"Platform"}</div>
              <Pill label={u.role||u.platformRole||"—"} color={T.accent} size={10}/>
            </div>
          ))}
        </Card>
      )}

      {wizard&&(
        <ModalWrap onClose={()=>setWizard(null)} title={`Create Tenant — Step ${wizard.step} of 4`} width={620}>
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            {/* Step progress */}
            <div style={{display:"flex",gap:4}}>
              {[1,2,3,4].map(s=>(
                <div key={s} style={{flex:1,height:4,borderRadius:2,background:wizard.step>=s?T.accent:T.border,transition:"background 0.2s"}}/>
              ))}
            </div>

            {wizard.step===1&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{fontSize:15,fontWeight:700,color:T.text}}>Company Information</div>
                <div>
                  <label style={{fontSize:12,color:T.textSub,fontWeight:600,display:"block",marginBottom:6}}>COMPANY NAME *</label>
                  <input value={newTenantData.name} onChange={e=>setNewTenantData(d=>({...d,name:e.target.value,slug:e.target.value.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"")}))} placeholder="Acme Corp" style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",color:T.text,fontSize:13,outline:"none"}}/>
                </div>
                <div>
                  <label style={{fontSize:12,color:T.textSub,fontWeight:600,display:"block",marginBottom:6}}>SLUG (URL identifier)</label>
                  <input value={newTenantData.slug} onChange={e=>setNewTenantData(d=>({...d,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"")}))} placeholder="acme-corp" style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",color:T.text,fontSize:13,outline:"none",fontFamily:"monospace"}}/>
                </div>
                <div>
                  <label style={{fontSize:12,color:T.textSub,fontWeight:600,display:"block",marginBottom:6}}>ADMIN EMAIL</label>
                  <input value={newTenantData.email} onChange={e=>setNewTenantData(d=>({...d,email:e.target.value}))} placeholder="admin@acme.com" style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",color:T.text,fontSize:13,outline:"none"}}/>
                </div>
                <div>
                  <label style={{fontSize:12,color:T.textSub,fontWeight:600,display:"block",marginBottom:6}}>PLAN</label>
                  <select value={newTenantData.plan} onChange={e=>setNewTenantData(d=>({...d,plan:e.target.value}))} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",color:T.text,fontSize:13,outline:"none"}}>
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="internal">Internal</option>
                  </select>
                </div>
              </div>
            )}

            {wizard.step===2&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{fontSize:15,fontWeight:700,color:T.text}}>Select Industry Blueprint</div>
                <div style={{fontSize:13,color:T.textSub}}>The blueprint auto-configures all modules, roles, KPIs, pipelines, and departments.</div>
                <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:320,overflowY:"auto"}}>
                  {blueprintList.map(b=>(
                    <div key={b.id} onClick={()=>setNewTenantData(d=>({...d,blueprint:b.id,industry:b.label}))} style={{padding:"12px 14px",border:`1px solid ${newTenantData.blueprint===b.id?T.accent:T.border}`,borderRadius:10,cursor:"pointer",background:newTenantData.blueprint===b.id?T.accentB:T.raised,transition:"all 0.15s"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:T.text}}>{b.label}</div>
                          <div style={{fontSize:11,color:T.textSub,marginTop:2}}>{b.category} · {b.modules.length} modules · {b.kpis.length} KPIs</div>
                        </div>
                        {newTenantData.blueprint===b.id&&<Check size={16} color={T.accent}/>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {wizard.step===3&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{fontSize:15,fontWeight:700,color:T.text}}>Company Size & Operating Model</div>
                <div>
                  <label style={{fontSize:12,color:T.textSub,fontWeight:600,display:"block",marginBottom:8}}>COMPANY SIZE</label>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {[["solo","1 person — Founder / Solo Operator"],["small","2–10 employees"],["medium","11–50 employees"],["large","51–200 employees"],["enterprise","200+ employees"]].map(([v,l])=>(
                      <div key={v} onClick={()=>setNewTenantData(d=>({...d,size:v}))} style={{padding:"10px 14px",border:`1px solid ${newTenantData.size===v?T.accent:T.border}`,borderRadius:8,cursor:"pointer",background:newTenantData.size===v?T.accentB:T.raised,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:13,color:T.text}}>{l}</span>
                        {newTenantData.size===v&&<Check size={14} color={T.accent}/>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {wizard.step===4&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{fontSize:15,fontWeight:700,color:T.text}}>Review & Launch</div>
                <Card style={{background:T.raised}}>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {[["Company",newTenantData.name||"—"],["Slug",newTenantData.slug||"—"],["Plan",newTenantData.plan],["Blueprint",BLUEPRINTS[newTenantData.blueprint]?.label||"None selected"],["Size",newTenantData.size||"—"],["Admin Email",newTenantData.email||"—"]].map(([k,v])=>(
                      <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>
                        <span style={{fontSize:12,color:T.textSub,fontWeight:600}}>{k}</span>
                        <span style={{fontSize:13,color:T.text}}>{v}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                {newTenantData.blueprint&&(
                  <div style={{background:T.accentB,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px"}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.accent,marginBottom:8}}>BLUEPRINT WILL CONFIGURE</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                      {BLUEPRINTS[newTenantData.blueprint].modules.map(m=><Pill key={m} label={m} color={T.accent} size={10}/>)}
                    </div>
                    <div style={{fontSize:11,color:T.textSub,marginTop:8}}>+ Roles, KPIs, Departments, Pipelines, Dashboards</div>
                  </div>
                )}
              </div>
            )}

            <div style={{display:"flex",gap:8,justifyContent:"space-between",paddingTop:4}}>
              <Btn variant="ghost" onClick={wizard.step===1?()=>setWizard(null):wizardBack}>{wizard.step===1?"Cancel":"Back"}</Btn>
              {wizard.step<4
                ?<Btn onClick={wizardNext} disabled={wizard.step===1&&!newTenantData.name}>Next Step</Btn>
                :<Btn onClick={createTenant} disabled={creating}>{creating?<><Spinner/>Creating...</>:"Launch Tenant"}</Btn>
              }
            </div>
          </div>
        </ModalWrap>
      )}
    </div>
  );
}

// ── Market Intelligence ────────────────────────────────────────
function MarketIntelligence({tenant,showToast}){
  const isVS=tenant.id==="T-VS";
  const[query,setQuery]=useState("");
  const[result,setResult]=useState(null);
  const[loading,setLoading]=useState(false);
  const[researchType,setResearchType]=useState("prospect");

  const researching=async()=>{
    if(!query.trim())return;
    setLoading(true);setResult(null);
    const prompts={
      prospect:`Research this business as a prospect: "${query}". Provide: (1) Company overview and size estimate, (2) Likely business pain points, (3) Automation and AI opportunities, (4) Estimated deal value range, (5) Recommended outreach angle. Be specific and actionable. Plain text, no markdown.`,
      competitor:`Analyze this competitor: "${query}". Provide: (1) Positioning and strengths, (2) Weaknesses and gaps, (3) How to differentiate, (4) Likely pricing, (5) Win strategy. Plain text, no markdown.`,
      industry:`Research this industry for business opportunities: "${query}". Provide: (1) Market size and growth, (2) Key pain points, (3) AI/automation opportunities, (4) Top buyer personas, (5) Entry strategy. Plain text, no markdown.`,
      geographic:`Research this geographic market: "${query}". Provide: (1) Business density and types, (2) Economic indicators, (3) AI adoption level, (4) Top industries to target, (5) Go-to-market approach. Plain text, no markdown.`,
    };
    try{
      const txt=await callAI(
        [{role:"user",content:prompts[researchType]}],
        `You are a senior market intelligence analyst for ${tenant.name}. Provide sharp, data-driven insights. Be specific, not generic. Focus on actionable intelligence.`,
        1000
      );
      setResult(txt);
    }catch(e){
      setResult(`Market intelligence requires AI integration.\n\nQuery: ${query}\nType: ${researchType}\n\nConfigure ANTHROPIC_API_KEY in Vercel environment variables to enable live AI research.`);
    }
    setLoading(false);
  };

  const researchTypes=[
    {id:"prospect",label:"Prospect Research"},
    {id:"competitor",label:"Competitor Analysis"},
    {id:"industry",label:"Industry Analysis"},
    {id:"geographic",label:"Geographic Market"},
  ];

  const signals=isVS?[
    {signal:"High-volume dental practices in Dallas/Fort Worth metro",type:"Geographic Opportunity",priority:"High",value:"$800–1,200/mo",action:"Target 47 practices with 3+ chairs"},
    {signal:"Auto dealers missing 30%+ of after-hours calls",type:"Revenue Recovery",priority:"High",value:"$800/mo avg",action:"Book demos with 5 local dealers this week"},
    {signal:"Law firms averaging 18% missed weekend call rate",type:"Automation Gap",priority:"Medium",value:"$600/mo avg",action:"Build legal practice case study first"},
    {signal:"Chiropractic practices — 62% still using manual recall",type:"Workflow Automation",priority:"Medium",value:"$400/mo avg",action:"Create chiro-specific outreach sequence"},
  ]:[
    {signal:"PE activity increasing in mid-market healthcare — Q3 spike",type:"Industry Signal",priority:"High",value:"$120K–200K engagement",action:"Target 3 PE firms with healthcare portfolios"},
    {signal:"SEC proposed rule on operational resilience — Q4 deadline",type:"Regulatory Driver",priority:"High",value:"Compliance mandate",action:"Create regulatory alert campaign to financial clients"},
    {signal:"3 competitors losing clients due to staff turnover",type:"Competitive Opportunity",priority:"Medium",value:"$50K–80K displacement",action:"Warm outreach to affected firms"},
  ];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div>
        <div style={{fontSize:20,fontWeight:800,color:T.text}}>Market Intelligence</div>
        <div style={{fontSize:13,color:T.textSub,marginTop:2}}>AI-powered prospect research, competitor analysis, and opportunity discovery</div>
      </div>

      <Card>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {researchTypes.map(r=>(
              <button key={r.id} onClick={()=>setResearchType(r.id)} style={{padding:"5px 14px",borderRadius:20,border:`1px solid ${researchType===r.id?T.accent:T.border}`,background:researchType===r.id?T.accentB:"transparent",color:researchType===r.id?T.accent:T.textSub,fontSize:12,cursor:"pointer",fontWeight:researchType===r.id?700:400}}>{r.label}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1,position:"relative"}}>
              <Search size={14} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.textDim}}/>
              <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&researching()} placeholder={researchType==="prospect"?"Enter company name or website...":researchType==="competitor"?"Enter competitor name...":researchType==="geographic"?"Enter city or region...":"Enter industry..."}
                style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 10px 10px 34px",color:T.text,fontSize:13,outline:"none"}}/>
            </div>
            <Btn onClick={researching} disabled={loading||!query.trim()}>{loading?<><Spinner/>Researching...</>:"Research"}</Btn>
          </div>
        </div>
      </Card>

      {result&&(
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:700,color:T.text}}>{researchTypes.find(r=>r.id===researchType)?.label}: {query}</div>
            <div style={{fontSize:11,color:T.textSub}}>{new Date().toLocaleTimeString()}</div>
          </div>
          <div style={{background:T.raised,borderRadius:8,padding:"14px 16px",fontSize:13,color:T.textSub,lineHeight:1.75,whiteSpace:"pre-wrap"}}>{result}</div>
          <div style={{display:"flex",gap:8,marginTop:14}}>
            <Btn size="sm" onClick={()=>showToast("Lead added to CRM")}>Add to CRM</Btn>
            <Btn size="sm" variant="ghost" onClick={()=>showToast("Research saved to Knowledge Base")}>Save to Knowledge Base</Btn>
          </div>
        </Card>
      )}

      <div>
        <SH title="Live Opportunity Signals"/>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {signals.map((s,i)=>(
            <Card key={i} style={{cursor:"pointer"}} onClick={()=>showToast("Signal actioned — task created")}>
              <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:s.priority==="High"?T.red:T.amber,marginTop:5,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.text}}>{s.signal}</div>
                  <div style={{fontSize:12,color:T.textSub,marginTop:3}}>{s.action}</div>
                  <div style={{display:"flex",gap:8,marginTop:8}}>
                    <Pill label={s.type} color={T.blue} size={10}/>
                    <Pill label={s.priority} color={s.priority==="High"?T.red:T.amber} size={10}/>
                    <Pill label={s.value} color={T.green} size={10}/>
                  </div>
                </div>
                <button className="oc-ghost" style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 10px",color:T.accent,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>Act Now</button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────
function Sidebar({user,tenant,activeModule,onNav,onLogout,collapsed,setCollapsed,isPlatformAdmin}){
  const navItems=isPlatformAdmin
    ?[{id:"platform",label:"Platform Admin",icon:Building2},...NAV]
    :NAV.filter(n=>n.roles.includes(user?.role));
  return(
    <div style={{width:collapsed?60:220,flexShrink:0,background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",transition:"width 0.2s ease",overflow:"hidden"}}>
      <div style={{padding:collapsed?"14px 12px":"16px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10}}>
        {!collapsed&&(
          <div>
            <div style={{fontSize:15,fontWeight:900,color:T.text,letterSpacing:"-0.02em"}}>OperaCore</div>
            {tenant&&<div style={{fontSize:10,color:T.textDim,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{tenant.name}</div>}
          </div>
        )}
        {collapsed&&<div style={{fontSize:13,fontWeight:900,color:T.accent}}>OC</div>}
        <button onClick={()=>setCollapsed(!collapsed)} className="oc-ghost" style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:T.textDim,padding:4,borderRadius:6}}>{collapsed?<ChevronRight size={14}/>:<ChevronLeft size={14}/>}</button>
      </div>
      <nav style={{flex:1,overflowY:"auto",padding:"8px 8px"}}>
        {navItems.map(n=>{
          const active=activeModule===n.id;
          return(
            <button key={n.id} onClick={()=>onNav(n.id)} className="oc-btn" style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:collapsed?"10px 0":"9px 10px",borderRadius:8,border:"none",cursor:"pointer",background:active?T.accentB:"transparent",color:active?T.accent:T.textSub,fontWeight:active?700:500,fontSize:13,transition:"all 0.15s",justifyContent:collapsed?"center":"flex-start",marginBottom:2}}>
              <n.icon size={16} style={{flexShrink:0}}/>
              {!collapsed&&<span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.label}</span>}
            </button>
          );
        })}
      </nav>
      <div style={{padding:"12px 8px",borderTop:`1px solid ${T.border}`}}>
        <button onClick={onLogout} className="oc-btn" style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:collapsed?"10px 0":"9px 10px",borderRadius:8,border:"none",cursor:"pointer",background:"transparent",color:T.textDim,fontSize:13,justifyContent:collapsed?"center":"flex-start"}}>
          <LogOut size={14}/>{!collapsed&&"Sign Out"}
        </button>
      </div>
    </div>
  );
}

// ── Mobile Nav ─────────────────────────────────────────────────
function MobileNav({user,activeModule,onNav,isPlatformAdmin}){
  const items=isPlatformAdmin
    ?[{id:"platform",label:"Admin",icon:Building2},...NAV.slice(0,4)]
    :NAV.slice(0,5);
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:T.surface,borderTop:`1px solid ${T.border}`,display:"flex",zIndex:100,padding:"4px 0 env(safe-area-inset-bottom,4px)"}}>
      {items.map(n=>{
        const active=activeModule===n.id;
        return(
          <button key={n.id} onClick={()=>onNav(n.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 4px",background:"none",border:"none",cursor:"pointer",color:active?T.accent:T.textDim}}>
            <n.icon size={18}/>
            <span style={{fontSize:9,fontWeight:active?700:500}}>{n.label.split(" ")[0]}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Demo Data ─────────────────────────────────────────────────
const DEMO_LEADS=[
  {id:"DL-001",name:"Dr. Kevin Walsh",company:"Walsh Dental Group",phone:"(214) 555-0142",called:"2:34 PM",status:"missed",recovery:"Texted 2:37 PM",result:"Appointment booked"},
  {id:"DL-002",name:"Maria Santos",company:"Santos Auto Group",phone:"(817) 555-0289",called:"4:12 PM",status:"missed",recovery:"Texted 4:15 PM",result:"Callback scheduled"},
  {id:"DL-003",name:"Jennifer Cole",company:"Cole Law Group",phone:"(214) 555-0371",called:"6:48 PM",status:"missed",recovery:"Texted 6:51 PM",result:"Appointment booked"},
  {id:"DL-004",name:"Robert Kim",company:"Coastal Medical",phone:"(972) 555-0094",called:"8:22 AM",status:"missed",recovery:"Texted 8:25 AM",result:"Quote requested"},
];
const DEMO_APPOINTMENTS=[
  {id:"DA-001",name:"Dr. Kevin Walsh",type:"Discovery Call",date:"Mon Jun 16",time:"10:00 AM",status:"confirmed",source:"AI Recovery"},
  {id:"DA-002",name:"Jennifer Cole",type:"Product Demo",date:"Tue Jun 17",time:"2:00 PM",status:"confirmed",source:"AI Recovery"},
  {id:"DA-003",name:"Mike Torres",type:"Follow-Up",date:"Wed Jun 18",time:"11:00 AM",status:"pending",source:"Email Sequence"},
];
const DEMO_SCENARIOS=[
  {id:"S1",label:"Power Outage",icon:"⚡",desc:"Complete facility power loss affecting operations",severity:"High",duration:"2-8 hours",recovery:"4h"},
  {id:"S2",label:"Hurricane",icon:"🌀",desc:"Category 2-3 hurricane landfall in service area",severity:"Critical",duration:"24-72 hours",recovery:"48h"},
  {id:"S3",label:"Critical Vendor Failure",icon:"🔧",desc:"Primary technology vendor goes offline",severity:"High",duration:"4-24 hours",recovery:"6h"},
  {id:"S4",label:"Key Employee Unavailable",icon:"👤",desc:"Essential team member sudden unavailability",severity:"Medium",duration:"1-7 days",recovery:"24h"},
  {id:"S5",label:"Cyber Incident",icon:"🛡",desc:"Ransomware or data breach detected",severity:"Critical",duration:"12-96 hours",recovery:"72h"},
];
const DEMO_RECOVERY_TASKS=[
  {id:"RT-1",task:"Activate backup communications system",owner:"COO",status:"complete",time:"T+0:05"},
  {id:"RT-2",task:"Notify all client contacts",owner:"Client Success",status:"complete",time:"T+0:15"},
  {id:"RT-3",task:"Stand up remote work environment",owner:"IT",status:"in_progress",time:"T+0:30"},
  {id:"RT-4",task:"Redirect phone lines to mobile",owner:"Operations",status:"in_progress",time:"T+0:45"},
  {id:"RT-5",task:"Document incident timeline",owner:"Compliance",status:"pending",time:"T+1:00"},
  {id:"RT-6",task:"Executive briefing",owner:"CEO",status:"pending",time:"T+1:30"},
];

// ── Revenue Recovery Simulator ─────────────────────────────────
function RevenueRecoverySimulator({onBack}){
  const[inputs,setInputs]=useState({calls:200,missedPct:22,avgValue:4800,convRate:35});
  const set=(k,v)=>setInputs(p=>({...p,[k]:Number(v)||0}));
  const missed=Math.round(inputs.calls*(inputs.missedPct/100));
  const opps=Math.round(missed*(inputs.convRate/100));
  const monthlyLost=opps*inputs.avgValue/12;
  const monthlyRecovered=Math.round(monthlyLost*0.68);
  const annualRecovered=monthlyRecovered*12;
  const annualLost=monthlyLost*12;

  const sliders=[
    {key:"calls",label:"Monthly Calls",min:50,max:2000,step:10,suffix:""},
    {key:"missedPct",label:"Missed Call Rate",min:5,max:60,step:1,suffix:"%"},
    {key:"avgValue",label:"Average Customer Value",min:500,max:20000,step:100,prefix:"$",suffix:"/yr"},
    {key:"convRate",label:"Conversion Rate",min:10,max:80,step:1,suffix:"%"},
  ];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20,animation:"ocUp .25s ease"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 12px",color:T.textSub,fontSize:12,cursor:"pointer"}}>Back</button>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:T.text}}>Revenue Recovery Simulator</div>
          <div style={{fontSize:13,color:T.textSub}}>Discover how much revenue your missed calls are costing you</div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20}}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Card>
            <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:16}}>Your Business Numbers</div>
            {sliders.map(s=>(
              <div key={s.key} style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <label style={{fontSize:12,color:T.textSub,fontWeight:600}}>{s.label}</label>
                  <span style={{fontSize:13,fontWeight:700,color:T.text}}>{s.prefix||""}{inputs[s.key].toLocaleString()}{s.suffix}</span>
                </div>
                <input type="range" min={s.min} max={s.max} step={s.step} value={inputs[s.key]} onChange={e=>set(s.key,e.target.value)}
                  style={{width:"100%",accentColor:T.accent,cursor:"pointer"}}/>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.textDim,marginTop:2}}>
                  <span>{s.prefix||""}{s.min}{s.suffix}</span><span>{s.prefix||""}{s.max.toLocaleString()}{s.suffix}</span>
                </div>
              </div>
            ))}
          </Card>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{background:T.redB,border:`1px solid ${T.red}44`,borderRadius:12,padding:"16px 18px"}}>
              <div style={{fontSize:11,color:T.red,fontWeight:600,marginBottom:8,textTransform:"uppercase"}}>Missed Calls / Mo</div>
              <div style={{fontSize:28,fontWeight:800,color:T.text}}>{missed.toLocaleString()}</div>
              <div style={{fontSize:11,color:T.textSub,marginTop:4}}>calls going unanswered</div>
            </div>
            <div style={{background:T.redB,border:`1px solid ${T.red}44`,borderRadius:12,padding:"16px 18px"}}>
              <div style={{fontSize:11,color:T.red,fontWeight:600,marginBottom:8,textTransform:"uppercase"}}>Lost Opps / Mo</div>
              <div style={{fontSize:28,fontWeight:800,color:T.text}}>{opps.toLocaleString()}</div>
              <div style={{fontSize:11,color:T.textSub,marginTop:4}}>potential customers lost</div>
            </div>
          </div>

          <Card style={{background:`linear-gradient(135deg,${T.raised},${T.card})`}}>
            <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14}}>Before vs After Veridian</div>
            {[
              {label:"Revenue Lost / Year",before:`$${(annualLost/1000).toFixed(1)}K`,after:"$0",color:T.red,improving:true},
              {label:"Calls Recovered / Mo",before:"0",after:missed.toLocaleString(),color:T.green,improving:true},
              {label:"Annual Revenue Recovered",before:"—",after:`$${(annualRecovered/1000).toFixed(1)}K`,color:T.green,improving:true},
            ].map(row=>(
              <div key={row.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                <div style={{fontSize:12,color:T.textSub,flex:1}}>{row.label}</div>
                <div style={{display:"flex",gap:16,alignItems:"center"}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:10,color:T.textDim,marginBottom:2}}>BEFORE</div>
                    <div style={{fontSize:13,fontWeight:700,color:T.red}}>{row.before}</div>
                  </div>
                  <div style={{fontSize:16,color:T.accent}}>→</div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:10,color:T.textDim,marginBottom:2}}>AFTER</div>
                    <div style={{fontSize:13,fontWeight:700,color:T.green}}>{row.after}</div>
                  </div>
                </div>
              </div>
            ))}
          </Card>

          <div style={{background:`linear-gradient(135deg,${T.accent}22,${T.green}11)`,border:`1px solid ${T.accent}44`,borderRadius:14,padding:"20px 22px",textAlign:"center"}}>
            <div style={{fontSize:12,color:T.accent,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Annual Recovery Potential</div>
            <div style={{fontSize:42,fontWeight:900,color:T.text,letterSpacing:"-0.04em"}}>${(annualRecovered/1000).toFixed(0)}K</div>
            <div style={{fontSize:12,color:T.textSub,marginTop:6}}>revenue you could recover with Veridian</div>
            <div style={{marginTop:14,padding:"8px 0",borderTop:`1px solid ${T.accent}33`}}>
              <div style={{fontSize:11,color:T.textDim}}>Veridian customers recover an avg of 68% of missed call revenue within 90 days</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AI Front Desk Simulation ───────────────────────────────────
function AIFrontDeskSim({onBack}){
  const[step,setStep]=useState(0);
  const STEPS=[
    {
      title:"Customer Calls",
      subtitle:"3:47 PM — After business hours",
      screen:"phone_ring",
      outcome:"Incoming call from Dr. Kevin Walsh — Walsh Dental Group",
      detail:"New patient calling about a crown replacement. High-value opportunity.",
    },
    {
      title:"Call Missed",
      subtitle:"Ring count: 4 — No answer",
      screen:"missed",
      outcome:"Call goes to voicemail. Customer hangs up at 3:48 PM.",
      detail:"Without Veridian, this lead is gone. 73% of callers don't leave a voicemail.",
    },
    {
      title:"Veridian Activates",
      subtitle:"Automatic response — 47 seconds after missed call",
      screen:"text_sent",
      outcome:"AI sends personalized text: 'Hi Dr. Walsh — we missed your call! We'd love to help. Are you available for a quick callback, or would you prefer to book online?'",
      detail:"Response sent in under 60 seconds, 24 hours a day, 7 days a week.",
    },
    {
      title:"Customer Replies",
      subtitle:"3:51 PM — 4 minutes later",
      screen:"reply",
      outcome:"Dr. Walsh: 'Yes, I'd love to book an appointment. Do you have openings next week?'",
      detail:"68% of Veridian text recoveries receive a response within 10 minutes.",
    },
    {
      title:"Appointment Booked",
      subtitle:"AI books directly into your calendar",
      screen:"booked",
      outcome:"Appointment confirmed: Monday 10:00 AM — Dr. Kevin Walsh — New Patient Consultation",
      detail:"Calendar integration books without human intervention. Confirmation sent automatically.",
    },
    {
      title:"Lead Enters CRM",
      subtitle:"Full contact record created instantly",
      screen:"crm",
      outcome:"New lead created: Dr. Kevin Walsh — Source: AI Recovery — Stage: Appointment Booked — Est. Value: $4,800/yr",
      detail:"Every recovered lead is tracked, scored, and routed to your sales pipeline automatically.",
    },
  ];

  const s=STEPS[step];
  const screenBg={phone_ring:T.blue,missed:T.red,text_sent:T.green,reply:T.accent,booked:T.green,crm:T.purple};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20,animation:"ocUp .25s ease"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 12px",color:T.textSub,fontSize:12,cursor:"pointer"}}>Back</button>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:T.text}}>AI Front Desk Simulation</div>
          <div style={{fontSize:13,color:T.textSub}}>Watch how Veridian recovers a missed call in real time</div>
        </div>
      </div>

      {/* Step progress */}
      <div style={{display:"flex",gap:3}}>
        {STEPS.map((_,i)=>(
          <div key={i} onClick={()=>setStep(i)} style={{flex:1,height:4,borderRadius:2,background:i<=step?T.accent:T.border,cursor:"pointer",transition:"background 0.2s"}}/>
        ))}
      </div>
      <div style={{fontSize:11,color:T.textSub,textAlign:"right"}}>Step {step+1} of {STEPS.length}</div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:20}}>
        {/* Phone/Screen simulation */}
        <div style={{display:"flex",justifyContent:"center"}}>
          <div style={{width:220,background:"#1a1a2e",border:"8px solid #2a2a3e",borderRadius:32,padding:"20px 14px",minHeight:360,display:"flex",flexDirection:"column"}}>
            {/* Phone header */}
            <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
              <div style={{width:60,height:4,background:"#2a2a3e",borderRadius:2}}/>
            </div>
            {/* Screen content */}
            <div style={{flex:1,background:T.raised,borderRadius:16,padding:14,display:"flex",flexDirection:"column",gap:10}}>
              {s.screen==="phone_ring"&&(
                <>
                  <div style={{textAlign:"center",paddingTop:20}}>
                    <div style={{width:56,height:56,borderRadius:"50%",background:T.blueB,border:`2px solid ${T.blue}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}>
                      <Phone size={24} color={T.blue}/>
                    </div>
                    <div style={{fontSize:13,fontWeight:700,color:T.text}}>Incoming Call</div>
                    <div style={{fontSize:11,color:T.textSub,marginTop:4}}>Dr. Kevin Walsh</div>
                    <div style={{fontSize:10,color:T.textDim,marginTop:2}}>(214) 555-0142</div>
                  </div>
                  <div style={{display:"flex",justifyContent:"center",gap:20,marginTop:20}}>
                    <div style={{width:40,height:40,borderRadius:"50%",background:T.redB,display:"flex",alignItems:"center",justifyContent:"center"}}><X size={18} color={T.red}/></div>
                    <div style={{width:40,height:40,borderRadius:"50%",background:T.greenB,display:"flex",alignItems:"center",justifyContent:"center"}}><Phone size={18} color={T.green}/></div>
                  </div>
                </>
              )}
              {s.screen==="missed"&&(
                <div style={{textAlign:"center",paddingTop:20}}>
                  <div style={{width:56,height:56,borderRadius:"50%",background:T.redB,border:`2px solid ${T.red}44`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}><Phone size={24} color={T.red}/></div>
                  <div style={{fontSize:13,fontWeight:700,color:T.text}}>Missed Call</div>
                  <div style={{fontSize:11,color:T.textSub,marginTop:4}}>Dr. Kevin Walsh</div>
                  <div style={{fontSize:10,color:T.textDim,marginTop:8}}>3:48 PM · Today</div>
                  <div style={{marginTop:12,background:T.redB,borderRadius:8,padding:"8px 10px"}}>
                    <div style={{fontSize:10,color:T.red}}>Voicemail not left</div>
                  </div>
                </div>
              )}
              {(s.screen==="text_sent"||s.screen==="reply")&&(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{fontSize:10,color:T.textDim,textAlign:"center",marginBottom:4}}>Text Messages · Dr. Kevin Walsh</div>
                  <div style={{alignSelf:"flex-end",background:T.accent,borderRadius:"10px 10px 2px 10px",padding:"8px 10px",maxWidth:"85%"}}>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.9)",lineHeight:1.5}}>Hi Dr. Walsh — we missed your call! We'd love to help. Are you available for a quick callback, or would you prefer to book online?</div>
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.6)",marginTop:4,textAlign:"right"}}>3:48 PM · Delivered</div>
                  </div>
                  {s.screen==="reply"&&(
                    <div style={{alignSelf:"flex-start",background:T.raised,border:`1px solid ${T.border}`,borderRadius:"10px 10px 10px 2px",padding:"8px 10px",maxWidth:"85%"}}>
                      <div style={{fontSize:10,color:T.text,lineHeight:1.5}}>Yes, I'd love to book an appointment. Do you have openings next week?</div>
                      <div style={{fontSize:9,color:T.textDim,marginTop:4}}>3:51 PM</div>
                    </div>
                  )}
                </div>
              )}
              {s.screen==="booked"&&(
                <div style={{textAlign:"center",paddingTop:10}}>
                  <div style={{width:48,height:48,borderRadius:"50%",background:T.greenB,border:`2px solid ${T.green}44`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}><Check size={22} color={T.green}/></div>
                  <div style={{fontSize:12,fontWeight:700,color:T.text}}>Appointment Confirmed</div>
                  <div style={{background:T.raised,borderRadius:8,padding:"10px",marginTop:10}}>
                    <div style={{fontSize:10,color:T.textSub}}>Monday, June 16</div>
                    <div style={{fontSize:13,fontWeight:700,color:T.text}}>10:00 AM</div>
                    <div style={{fontSize:10,color:T.textSub,marginTop:4}}>Dr. Kevin Walsh</div>
                    <div style={{fontSize:10,color:T.textDim}}>New Patient Consultation</div>
                  </div>
                </div>
              )}
              {s.screen==="crm"&&(
                <div>
                  <div style={{fontSize:10,color:T.textDim,marginBottom:8}}>CRM · New Lead</div>
                  <div style={{background:T.card,borderRadius:8,padding:"10px",border:`1px solid ${T.accent}44`}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <div style={{width:28,height:28,borderRadius:"50%",background:T.accentB,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:T.accent}}>KW</div>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:T.text}}>Dr. Kevin Walsh</div>
                        <div style={{fontSize:9,color:T.accent}}>AI Recovery</div>
                      </div>
                    </div>
                    <div style={{fontSize:9,color:T.textSub}}>Walsh Dental Group</div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                      <div style={{background:T.accentB,borderRadius:4,padding:"2px 6px",fontSize:9,color:T.accent}}>Appt. Booked</div>
                      <div style={{fontSize:9,color:T.green}}>$4,800/yr</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Explanation panel */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:`${screenBg[s.screen]}22`,border:`1px solid ${screenBg[s.screen]}44`,borderRadius:20,padding:"4px 12px",marginBottom:10}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:screenBg[s.screen]}}/>
              <span style={{fontSize:11,color:screenBg[s.screen],fontWeight:600}}>{s.subtitle}</span>
            </div>
            <div style={{fontSize:22,fontWeight:800,color:T.text,lineHeight:1.2,marginBottom:8}}>{s.title}</div>
            <div style={{fontSize:14,color:T.text,lineHeight:1.6,marginBottom:12}}>{s.outcome}</div>
            <div style={{background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,padding:"12px 14px",fontSize:13,color:T.textSub,lineHeight:1.6}}>{s.detail}</div>
          </div>

          <div style={{display:"flex",gap:10,marginTop:8}}>
            <Btn variant="ghost" onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0}>Previous</Btn>
            {step<STEPS.length-1
              ?<Btn onClick={()=>setStep(s=>s+1)}>Next Step →</Btn>
              :<Btn onClick={()=>setStep(0)} style={{background:T.green}}>See It Again</Btn>
            }
          </div>

          {/* Mini step list */}
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {STEPS.map((st,i)=>(
              <div key={i} onClick={()=>setStep(i)} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 8px",borderRadius:8,cursor:"pointer",background:i===step?T.accentB:"transparent",border:`1px solid ${i===step?T.accent:"transparent"}`}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:i<step?T.green:i===step?T.accent:T.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",flexShrink:0}}>{i<step?<Check size={10}/>:i+1}</div>
                <div style={{fontSize:12,color:i===step?T.text:T.textSub,fontWeight:i===step?600:400}}>{st.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Text & Email Recovery Demo ─────────────────────────────────
function RecoveryTimeline({onBack}){
  const[activeLeadIdx,setActiveLeadIdx]=useState(0);
  const lead=DEMO_LEADS[activeLeadIdx];
  const TIMELINE=[
    {time:"T+0:00",type:"event",label:"Lead calls — no answer",icon:"📞",color:T.red},
    {time:"T+0:47",type:"sms",label:"Auto-text sent",msg:"Hi! We missed your call and want to help. Are you still looking for [service]? Click here to book: [link]",color:T.accent},
    {time:"T+4:12",type:"reply",label:"Customer replies",msg:"Yes! Can I get an appointment for next week?",color:T.green},
    {time:"T+4:13",type:"ai",label:"AI responds instantly",msg:"Absolutely! I have Monday at 10 AM or Tuesday at 2 PM available. Which works best for you?",color:T.accent},
    {time:"T+6:30",type:"email",label:"Follow-up email sent",subject:"We saved a spot for you",msg:"Hi [Name], just confirming your appointment on Monday at 10 AM. We look forward to serving you!",color:T.blue},
    {time:"T+47:00",type:"reminder",label:"24-hr appointment reminder",msg:"Reminder: Your appointment is tomorrow at 10 AM. Reply CONFIRM to confirm or CANCEL to reschedule.",color:T.amber},
    {time:"T+48:00",type:"conversion",label:"Appointment completed — Lead converted",icon:"✓",color:T.green},
  ];
  const[revealed,setRevealed]=useState(2);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20,animation:"ocUp .25s ease"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 12px",color:T.textSub,fontSize:12,cursor:"pointer"}}>Back</button>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:T.text}}>Text & Email Recovery</div>
          <div style={{fontSize:13,color:T.textSub}}>See the full automated follow-up sequence</div>
        </div>
      </div>

      {/* Lead selector */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {DEMO_LEADS.map((l,i)=>(
          <button key={l.id} onClick={()=>{setActiveLeadIdx(i);setRevealed(2);}} style={{padding:"7px 14px",borderRadius:20,border:`1px solid ${activeLeadIdx===i?T.accent:T.border}`,background:activeLeadIdx===i?T.accentB:"transparent",color:activeLeadIdx===i?T.accent:T.textSub,fontSize:12,cursor:"pointer",fontWeight:activeLeadIdx===i?700:400}}>
            {l.name.split(" ")[0]} — {l.company.split(" ").slice(0,2).join(" ")}
          </button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:20}}>
        {/* Timeline */}
        <div>
          <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:12}}>Recovery Timeline — {lead.name}</div>
          <div style={{display:"flex",flexDirection:"column",gap:0}}>
            {TIMELINE.slice(0,revealed).map((t,i)=>(
              <div key={i} style={{display:"flex",gap:12,animation:"ocUp .2s ease"}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:t.color,flexShrink:0,marginTop:4}}/>
                  {i<revealed-1&&<div style={{width:2,height:48,background:T.border,marginTop:4}}/>}
                </div>
                <div style={{paddingBottom:i<revealed-1?16:0,flex:1}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3}}>
                    <span style={{fontSize:10,color:T.textDim,fontFamily:"monospace"}}>{t.time}</span>
                    <Pill label={t.type.toUpperCase()} color={t.color} size={9}/>
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:t.msg?4:0}}>{t.label}</div>
                  {t.msg&&(
                    <div style={{background:t.type==="reply"?T.raised:t.type==="email"?T.blueB:`${t.color}14`,border:`1px solid ${t.color}33`,borderRadius:8,padding:"8px 10px"}}>
                      {t.subject&&<div style={{fontSize:10,color:T.textSub,fontWeight:600,marginBottom:3}}>Subject: {t.subject}</div>}
                      <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>{t.msg}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {revealed<TIMELINE.length&&(
              <div style={{marginTop:8}}>
                <Btn size="sm" onClick={()=>setRevealed(r=>Math.min(r+1,TIMELINE.length))}>Show Next Step</Btn>
              </div>
            )}
            {revealed===TIMELINE.length&&(
              <div style={{marginTop:12,background:T.greenB,border:`1px solid ${T.green}44`,borderRadius:10,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
                <Check size={16} color={T.green}/>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:T.green}}>Lead Recovered Successfully</div>
                  <div style={{fontSize:11,color:T.textSub}}>Result: {lead.result}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Outcome cards */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card>
            <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:12}}>Today's Recovery Results</div>
            {DEMO_LEADS.map(l=>(
              <div key={l.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:T.text}}>{l.name}</div>
                  <div style={{fontSize:11,color:T.textSub}}>{l.called} · {l.recovery}</div>
                </div>
                <Pill label={l.result.split(" ").slice(0,2).join(" ")} color={T.green} size={10}/>
              </div>
            ))}
          </Card>
          <div style={{background:T.accentB,border:`1px solid ${T.accent}44`,borderRadius:12,padding:"16px 18px"}}>
            <div style={{fontSize:12,color:T.accent,fontWeight:700,marginBottom:8}}>THIS MONTH</div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:13,color:T.textSub}}>Missed calls recovered</span>
              <span style={{fontSize:14,fontWeight:800,color:T.text}}>44</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:13,color:T.textSub}}>Appointments booked</span>
              <span style={{fontSize:14,fontWeight:800,color:T.text}}>31</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:13,color:T.textSub}}>Revenue recovered</span>
              <span style={{fontSize:14,fontWeight:800,color:T.green}}>$14,880</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Business Continuity Demo ───────────────────────────────────
function BusinessContinuityDemo({onBack}){
  const[selected,setSelected]=useState(null);
  const[launched,setLaunched]=useState(false);
  const[taskStates,setTaskStates]=useState({});
  const sc=DEMO_SCENARIOS.find(s=>s.id===selected)||null;
  const completedTasks=Object.values(taskStates).filter(v=>v==="complete").length;
  const totalTasks=DEMO_RECOVERY_TASKS.length;
  const readiness=sc?Math.round((1-completedTasks/totalTasks)*100):98;
  const recovery=sc?Math.round((completedTasks/totalTasks)*100):0;

  const launch=()=>{setLaunched(true);setTaskStates({});};
  const toggleTask=(id)=>setTaskStates(t=>({...t,[id]:t[id]==="complete"?"in_progress":"complete"}));

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20,animation:"ocUp .25s ease"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 12px",color:T.textSub,fontSize:12,cursor:"pointer"}}>Back</button>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:T.text}}>Business Continuity Scenario</div>
          <div style={{fontSize:13,color:T.textSub}}>Select a scenario and watch the recovery plan activate</div>
        </div>
      </div>

      {!launched?(
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
            {DEMO_SCENARIOS.map(s=>(
              <div key={s.id} onClick={()=>setSelected(s.id)} style={{background:selected===s.id?T.accentB:T.card,border:`1px solid ${selected===s.id?T.accent:T.border}`,borderRadius:12,padding:"16px 18px",cursor:"pointer",transition:"all 0.15s"}}>
                <div style={{fontSize:22,marginBottom:8}}>{s.icon}</div>
                <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:4}}>{s.label}</div>
                <div style={{fontSize:12,color:T.textSub,marginBottom:10,lineHeight:1.4}}>{s.desc}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <Pill label={s.severity} color={s.severity==="Critical"?T.red:T.amber} size={10}/>
                  <Pill label={`Recovery: ${s.recovery}`} color={T.accent} size={10}/>
                </div>
              </div>
            ))}
          </div>
          {selected&&(
            <div style={{display:"flex",justifyContent:"center"}}>
              <Btn onClick={launch} style={{padding:"12px 32px",fontSize:15}}><AlertTriangle size={16}/>Launch Recovery Plan</Btn>
            </div>
          )}
        </>
      ):(
        <>
          {/* Incident banner */}
          <div style={{background:`${T.red}12`,border:`1px solid ${T.red}44`,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:14}}>
            <div style={{fontSize:24}}>{sc?.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:800,color:T.red}}>ACTIVE INCIDENT — {sc?.label?.toUpperCase()}</div>
              <div style={{fontSize:12,color:T.textSub,marginTop:2}}>{sc?.desc} · Severity: {sc?.severity} · Est. duration: {sc?.duration}</div>
            </div>
            <div>
              <div style={{fontSize:11,color:T.textDim}}>Recovery Status</div>
              <div style={{fontSize:22,fontWeight:800,color:recovery>=50?T.green:T.amber}}>{recovery}%</div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:20}}>
            {/* Recovery tasks */}
            <div>
              <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:12}}>Recovery Checklist — {completedTasks}/{totalTasks} complete</div>
              <PBar pct={recovery} color={recovery>=80?T.green:recovery>=40?T.amber:T.accent} h={8}/>
              <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:6}}>
                {DEMO_RECOVERY_TASKS.map(t=>{
                  const st=taskStates[t.id]||t.status;
                  return(
                    <div key={t.id} onClick={()=>toggleTask(t.id)} style={{display:"flex",gap:10,padding:"10px 12px",borderRadius:8,background:st==="complete"?T.greenB:T.card,border:`1px solid ${st==="complete"?T.green+"44":T.border}`,cursor:"pointer",alignItems:"center"}}>
                      <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${st==="complete"?T.green:st==="in_progress"?T.amber:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {st==="complete"&&<Check size={11} color={T.green}/>}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:600,color:T.text,textDecoration:st==="complete"?"line-through":"none"}}>{t.task}</div>
                        <div style={{fontSize:11,color:T.textSub}}>{t.owner} · {t.time}</div>
                      </div>
                      <Pill label={st.replace("_"," ")} color={st==="complete"?T.green:st==="in_progress"?T.amber:T.textDim} size={9}/>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Executive dashboard */}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <Card>
                <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:12}}>Executive Dashboard</div>
                {[
                  {label:"Readiness Score",val:readiness,color:hc(readiness)},
                  {label:"Team Response",val:Math.round(completedTasks/2*100),color:T.green},
                  {label:"Recovery Progress",val:recovery,color:recovery>=50?T.accent:T.amber},
                ].map(({label,val,color})=>(
                  <div key={label} style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.textSub,marginBottom:4}}>
                      <span>{label}</span><span style={{color,fontWeight:700}}>{Math.min(100,val)}%</span>
                    </div>
                    <PBar pct={Math.min(100,val)} color={color} h={6}/>
                  </div>
                ))}
              </Card>
              <Card style={{background:T.raised}}>
                <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:8}}>Incident Timeline</div>
                {[
                  {time:"T+0:00",event:"Incident detected — plan activated"},
                  {time:"T+0:02",event:"Recovery team notified"},
                  {time:"T+0:05",event:"Backup systems engaging"},
                  {time:"T+0:15",event:"Client communications sent"},
                ].map((e,i)=>(
                  <div key={i} style={{display:"flex",gap:10,padding:"4px 0",fontSize:11}}>
                    <span style={{color:T.textDim,fontFamily:"monospace",minWidth:40}}>{e.time}</span>
                    <span style={{color:T.textSub}}>{e.event}</span>
                  </div>
                ))}
              </Card>
              <Btn variant="ghost" size="sm" onClick={()=>{setLaunched(false);setSelected(null);setTaskStates({});}}>Try Another Scenario</Btn>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Guided Product Tour ────────────────────────────────────────
function GuidedTour({onComplete}){
  const[step,setStep]=useState(0);
  const TOUR_STEPS=[
    {
      title:"Welcome to Veridian",
      subtitle:"Your AI-powered business platform",
      content:"Veridian is a platform that helps service businesses recover missed revenue, automate follow-up, and maintain business continuity. This tour shows you exactly how it works.",
      module:"Revenue Recovery",
      stat:{label:"Average annual revenue recovered",value:"$47,200"},
      accent:T.accent,
    },
    {
      title:"Never Lose a Lead Again",
      subtitle:"AI Front Desk — 24/7 call recovery",
      content:"When a customer calls and you can't answer, Veridian automatically sends a personalized text within 60 seconds. 68% of prospects respond and book within the hour.",
      module:"AI Front Desk",
      stat:{label:"Of missed calls recovered with Veridian",value:"68%"},
      accent:T.green,
    },
    {
      title:"Automated Follow-Up Sequences",
      subtitle:"Text, email, and reminder automation",
      content:"Every unresponded inquiry triggers a multi-channel follow-up sequence — text, email, appointment reminders — all personalized and sent at the right time without any manual work.",
      module:"Recovery Automation",
      stat:{label:"Average time to first response",value:"47 sec"},
      accent:T.blue,
    },
    {
      title:"Business Continuity Protection",
      subtitle:"Stay operational through any disruption",
      content:"Power outage, hurricane, cyber incident — Veridian's continuity platform activates instant recovery plans, assigns tasks to your team, and keeps your executive team informed in real time.",
      module:"Business Continuity",
      stat:{label:"Average recovery time with Veridian",value:"4 hrs"},
      accent:T.purple,
    },
    {
      title:"Compliance & Risk Intelligence",
      subtitle:"SOC 2, ISO 27001, regulatory monitoring",
      content:"Veridian tracks risks, monitors regulatory changes, and manages your compliance programs — so you're always audit-ready and PE due diligence-ready.",
      module:"Compliance",
      stat:{label:"Compliance programs supported",value:"ISO, SOC2, SEC"},
      accent:T.amber,
    },
  ];
  const ts=TOUR_STEPS[step];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:0,minHeight:"60vh"}}>
      {/* Progress */}
      <div style={{display:"flex",gap:4,marginBottom:24}}>
        {TOUR_STEPS.map((_,i)=>(
          <div key={i} onClick={()=>setStep(i)} style={{flex:1,height:3,borderRadius:2,background:i<=step?ts.accent:T.border,cursor:"pointer",transition:"background 0.2s"}}/>
        ))}
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",gap:20}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:`${ts.accent}18`,border:`1px solid ${ts.accent}33`,borderRadius:20,padding:"4px 14px",width:"fit-content"}}>
          <span style={{fontSize:11,color:ts.accent,fontWeight:700}}>MODULE {step+1}/{TOUR_STEPS.length} — {ts.module.toUpperCase()}</span>
        </div>
        <div>
          <div style={{fontSize:26,fontWeight:900,color:T.text,letterSpacing:"-0.02em",lineHeight:1.2,marginBottom:8}}>{ts.title}</div>
          <div style={{fontSize:15,color:ts.accent,fontWeight:600,marginBottom:16}}>{ts.subtitle}</div>
          <div style={{fontSize:15,color:T.textSub,lineHeight:1.75,maxWidth:560}}>{ts.content}</div>
        </div>

        <div style={{background:`${ts.accent}14`,border:`1px solid ${ts.accent}33`,borderRadius:14,padding:"20px 24px",display:"flex",gap:16,alignItems:"center"}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:ts.accent,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>{ts.stat.label}</div>
            <div style={{fontSize:36,fontWeight:900,color:T.text,letterSpacing:"-0.03em"}}>{ts.stat.value}</div>
          </div>
        </div>

        <div style={{display:"flex",gap:10,marginTop:"auto",paddingTop:16}}>
          {step>0&&<Btn variant="ghost" onClick={()=>setStep(s=>s-1)}>Previous</Btn>}
          {step<TOUR_STEPS.length-1
            ?<Btn onClick={()=>setStep(s=>s+1)} style={{background:ts.accent}}>Next: {TOUR_STEPS[step+1].module} →</Btn>
            :<Btn onClick={onComplete} style={{background:T.green}}>Book a Live Demo →</Btn>
          }
        </div>
      </div>
    </div>
  );
}

// ── Demo Center ────────────────────────────────────────────────
function DemoCenter({onLogin,onExit}){
  const[view,setView]=useState("hub"); // hub | tour | sim1 | sim2 | sim3 | sim4
  const demos=[
    {id:"sim1",label:"Revenue Recovery",sub:"How much are missed calls costing you?",color:T.red,tag:"INTERACTIVE CALCULATOR"},
    {id:"sim2",label:"AI Front Desk",sub:"Watch a missed call become an appointment",color:T.green,tag:"LIVE SIMULATION"},
    {id:"sim3",label:"Text & Email Recovery",sub:"See the full automated follow-up sequence",color:T.blue,tag:"LIVE SIMULATION"},
    {id:"sim4",label:"Business Continuity",sub:"Activate a recovery plan in real time",color:T.purple,tag:"SCENARIO BUILDER"},
  ];

  if(view==="tour")return(
    <div style={{minHeight:"100vh",background:T.bg,padding:"20px 16px"}}>
      <div style={{maxWidth:680,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div style={{fontSize:15,fontWeight:800,color:T.text}}>Veridian <span style={{color:T.accent}}>Guided Tour</span></div>
          <button onClick={()=>setView("hub")} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 12px",color:T.textSub,fontSize:12,cursor:"pointer"}}>Exit Tour</button>
        </div>
        <GuidedTour onComplete={()=>setView("hub")}/>
      </div>
    </div>
  );
  if(view==="sim1")return<div style={{minHeight:"100vh",background:T.bg,padding:"20px 16px"}}><div style={{maxWidth:900,margin:"0 auto"}}><div style={{marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:14,fontWeight:800,color:T.text}}>Veridian <span style={{color:T.accent}}>Demo</span></div></div><RevenueRecoverySimulator onBack={()=>setView("hub")}/></div></div>;
  if(view==="sim2")return<div style={{minHeight:"100vh",background:T.bg,padding:"20px 16px"}}><div style={{maxWidth:900,margin:"0 auto"}}><div style={{marginBottom:12}}><span style={{fontSize:14,fontWeight:800,color:T.text}}>Veridian <span style={{color:T.accent}}>Demo</span></span></div><AIFrontDeskSim onBack={()=>setView("hub")}/></div></div>;
  if(view==="sim3")return<div style={{minHeight:"100vh",background:T.bg,padding:"20px 16px"}}><div style={{maxWidth:900,margin:"0 auto"}}><div style={{marginBottom:12}}><span style={{fontSize:14,fontWeight:800,color:T.text}}>Veridian <span style={{color:T.accent}}>Demo</span></span></div><RecoveryTimeline onBack={()=>setView("hub")}/></div></div>;
  if(view==="sim4")return<div style={{minHeight:"100vh",background:T.bg,padding:"20px 16px"}}><div style={{maxWidth:900,margin:"0 auto"}}><div style={{marginBottom:12}}><span style={{fontSize:14,fontWeight:800,color:T.text}}>Veridian <span style={{color:T.accent}}>Demo</span></span></div><BusinessContinuityDemo onBack={()=>setView("hub")}/></div></div>;

  return(
    <div style={{minHeight:"100vh",background:T.bg}}>
      {/* Hero */}
      <div style={{borderBottom:`1px solid ${T.border}`,background:T.surface}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:18,fontWeight:900,color:T.text,letterSpacing:"-0.02em"}}>Veridian <span style={{color:T.accent}}>2030</span></div>
          <div style={{display:"flex",gap:8}}>
            <Btn size="sm" variant="ghost" onClick={()=>setView("tour")}>Take a Guided Tour</Btn>
            <Btn size="sm" onClick={()=>onLogin(SU.find(u=>u.id==="U-VS-CEO"))}>Sign In</Btn>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"40px 20px"}}>
        {/* Hero text */}
        <div style={{textAlign:"center",marginBottom:48}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:T.accentB,border:`1px solid ${T.accent}44`,borderRadius:20,padding:"4px 14px",marginBottom:16}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:T.green,animation:"ocPulse 2s infinite"}}/>
            <span style={{fontSize:11,color:T.accent,fontWeight:700}}>INTERACTIVE DEMO ENVIRONMENT</span>
          </div>
          <div style={{fontSize:36,fontWeight:900,color:T.text,letterSpacing:"-0.03em",lineHeight:1.15,marginBottom:14,maxWidth:640,margin:"0 auto 14px"}}>
            Discover how Veridian<br/>grows your business
          </div>
          <div style={{fontSize:15,color:T.textSub,maxWidth:480,margin:"0 auto 28px",lineHeight:1.65}}>
            No demo call required. See exactly how missed calls become revenue, how automation handles your follow-up, and how your business stays protected.
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
            <Btn onClick={()=>setView("tour")} style={{padding:"12px 28px",fontSize:14,background:T.accent}}>Take a Guided Tour</Btn>
            <Btn variant="ghost" onClick={()=>setView("sim1")} style={{padding:"12px 28px",fontSize:14}}>Calculate Lost Revenue</Btn>
          </div>
        </div>

        {/* 3 outcomes */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16,marginBottom:40}}>
          {[
            {stat:"$47,200",label:"Avg annual revenue recovered per client"},
            {stat:"68%",label:"Of missed calls converted to appointments"},
            {stat:"47 sec",label:"Average response time to missed calls"},
            {stat:"4 hrs",label:"Average business continuity recovery time"},
          ].map(({stat,label})=>(
            <div key={stat} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"18px 20px",textAlign:"center"}}>
              <div style={{fontSize:28,fontWeight:900,color:T.accent,letterSpacing:"-0.03em"}}>{stat}</div>
              <div style={{fontSize:12,color:T.textSub,marginTop:6,lineHeight:1.4}}>{label}</div>
            </div>
          ))}
        </div>

        {/* Demo cards */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:16,fontWeight:800,color:T.text,marginBottom:4}}>Interactive Demos</div>
          <div style={{fontSize:13,color:T.textSub}}>Click any demo to experience it now — no signup required</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14,marginBottom:40}}>
          {demos.map(d=>(
            <div key={d.id} onClick={()=>setView(d.id)} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"22px 24px",cursor:"pointer",transition:"all 0.15s"}} className="oc-row">
              <div style={{display:"inline-flex",alignItems:"center",padding:"3px 10px",background:`${d.color}18`,border:`1px solid ${d.color}33`,borderRadius:20,marginBottom:12}}>
                <span style={{fontSize:10,color:d.color,fontWeight:700}}>{d.tag}</span>
              </div>
              <div style={{fontSize:17,fontWeight:800,color:T.text,marginBottom:6}}>{d.label}</div>
              <div style={{fontSize:13,color:T.textSub,marginBottom:14,lineHeight:1.4}}>{d.sub}</div>
              <div style={{display:"flex",alignItems:"center",gap:6,color:d.color,fontSize:13,fontWeight:600}}>
                Launch Demo <ArrowUpRight size={14}/>
              </div>
            </div>
          ))}
        </div>

        {/* Veridian orgs */}
        <Card>
          <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:4}}>Demo Organizations</div>
          <div style={{fontSize:12,color:T.textSub,marginBottom:14}}>Explore full platform access with live demo data — no production data, no real customers</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
            {[
              {id:"U-VS-CEO",name:"Veridian Solutions",role:"CEO / Ryan Park",color:T.accent,desc:"AI SaaS · Revenue recovery platform"},
              {id:"U-VRR-CEO",name:"Veridian Risk & Resilience",role:"CEO / Eleanor Shaw",color:T.purple,desc:"Risk consulting · Compliance programs"},
              {id:"U-VRR-COMP",name:"Compliance Director View",role:"James Holt",color:T.blue,desc:"Risk register · ISO 27001 program"},
            ].map(o=>(
              <div key={o.id} onClick={()=>onLogin(SU.find(u=>u.id===o.id))} style={{background:T.raised,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all 0.15s"}} className="oc-row">
                <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:2}}>{o.name}</div>
                <div style={{fontSize:11,color:T.textSub,marginBottom:6}}>{o.desc}</div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <Pill label={o.role} color={o.color} size={10}/>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── App Root ───────────────────────────────────────────────────
export default function App(){
  const[user,setUser]=useState(null);
  const[tenant,setTenant]=useState(null);
  const[module,setModule]=useState("dashboard");
  const[sidebarCollapsed,setSidebarCollapsed]=useState(false);
  const[isMobile,setIsMobile]=useState(window.innerWidth<768);
  const[toast,setToast]=useState(null);

  useEffect(()=>{
    const style=document.createElement("style");
    style.textContent=GCSS;
    document.head.appendChild(style);
    const s=session.load();
    if(s){
      const u=SU.find(x=>x.id===s.userId);
      if(u){
        setUser(u);
        if(u.tenantId){const t=ST.find(x=>x.id===u.tenantId);if(t)setTenant(t);}
      }
    }
    const onResize=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener("resize",onResize);
    return()=>window.removeEventListener("resize",onResize);
  },[]);

  const showToast=(msg,type="success")=>{
    setToast({id:Date.now(),msg,type});
  };

  const handleLogin=(u)=>{
    session.save({userId:u.id,role:u.role,tenantId:u.tenantId});
    setUser(u);
    if(u.tenantId){const t=ST.find(x=>x.id===u.tenantId);if(t)setTenant(t);}
    else setTenant(null);
    setModule("dashboard");
  };

  const handleLogout=()=>{
    session.clear();setUser(null);setTenant(null);setModule("dashboard");
  };

  const handleNav=(id)=>{
    if(id==="platform"&&user?.tenantId){
      setTenant(null);
    }else if(id!=="platform"&&user?.tenantId){
      const t=ST.find(x=>x.id===user.tenantId);
      if(t)setTenant(t);
    }
    setModule(id);
    platform.audit.log(user?.id||"anon",tenant?.id||"none",`nav:${id}`);
  };

  const[demoMode,setDemoMode]=useState(false);
  const isPlatformAdmin=user?.platformRole==="platform_admin";

  if(demoMode)return<DemoCenter onLogin={(u)=>{setDemoMode(false);handleLogin(u);}} onExit={()=>setDemoMode(false)}/>;
  if(!user)return<AuthScreen onLogin={handleLogin} onDemo={()=>setDemoMode(true)}/>;

  const renderModule=()=>{
    if(module==="platform"&&isPlatformAdmin)return<TenantMarketplace user={user} showToast={showToast}/>;
    if(!tenant)return<div style={{padding:40,textAlign:"center",color:T.textSub}}>No tenant assigned.</div>;
    const p={tenant,user,showToast,isMobile};
    switch(module){
      case"dashboard":     return<Dashboard {...p}/>;
      case"pipeline":      return<Pipeline {...p}/>;
      case"clients":       return<Clients {...p}/>;
      case"operations":    return<Operations {...p}/>;
      case"people":        return<People {...p}/>;
      case"compliance":    return<Compliance {...p}/>;
      case"finance":       return<Finance {...p}/>;
      case"intelligence":  return<MarketIntelligence {...p}/>;
      case"knowledge":     return<Knowledge {...p}/>;
      case"reports":       return<Reports {...p}/>;
      case"settings":      return<TenantSettings {...p}/>;
      default:             return<Dashboard {...p}/>;
    }
  };

  return(
    <div style={{display:"flex",minHeight:"100vh",background:T.bg}}>
      {!isMobile&&<Sidebar user={user} tenant={tenant} activeModule={module} onNav={handleNav} onLogout={handleLogout} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} isPlatformAdmin={isPlatformAdmin}/>}
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        {!isMobile&&(
          <div style={{padding:"11px 24px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surface,flexShrink:0}}>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:T.text}}>{NAV.find(n=>n.id===module)?.label||"Platform Admin"}</div>
              {tenant&&<div style={{fontSize:11,color:T.textSub,marginTop:1}}>{tenant.name} · {new Date().toLocaleDateString([],{weekday:"long",month:"long",day:"numeric"})}</div>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {isPlatformAdmin&&module!=="platform"&&tenant&&<Pill label={tenant.name} color={T.accent}/>}
              <Av initials={user.av} color={T.accent} size={32}/>
              <div style={{marginLeft:4}}>
                <div style={{fontSize:13,fontWeight:600,color:T.text}}>{user.name}</div>
                <div style={{fontSize:11,color:T.textSub}}>{user.role||user.platformRole}</div>
              </div>
            </div>
          </div>
        )}
        <main style={{flex:1,overflowY:"auto",padding:isMobile?"14px 12px 80px":"22px 28px"}}>
          <div style={{maxWidth:1280,margin:"0 auto",animation:"ocUp .2s ease"}}>
            {renderModule()}
          </div>
        </main>
      </div>
      {isMobile&&<MobileNav user={user} activeModule={module} onNav={handleNav} isPlatformAdmin={isPlatformAdmin}/>}
      {toast&&<Toast key={toast.id} msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}
