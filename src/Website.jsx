import React,{useState,useEffect,useRef}from"react";
import{Phone,MessageSquare,Calendar,CheckCircle,X,Menu,ChevronDown,ArrowRight,Lock,Check,ChevronRight,Users,Globe,Award,Clock,Shield,Zap,HelpCircle,TrendingDown}from"lucide-react";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const W={
  bg:"#04040B",
  surface:"#07071A",
  card:"#0A0A1E",
  cardH:"#0E0E26",
  border:"#12123A",
  borderH:"#20204A",
  accent:"#6366F1",
  accentH:"#4F46E5",
  accentB:"rgba(99,102,241,0.08)",
  accentGlow:"rgba(99,102,241,0.22)",
  green:"#10B981",
  greenB:"rgba(16,185,129,0.08)",
  red:"#EF4444",
  redB:"rgba(239,68,68,0.08)",
  amber:"#F59E0B",
  amberB:"rgba(245,158,11,0.08)",
  text:"#EEEEFF",
  textSub:"#6878A0",
  textDim:"#2A3450",
};

// ─────────────────────────────────────────────────────────────
// GLOBAL CSS
// ─────────────────────────────────────────────────────────────
const WCSS=`
*{box-sizing:border-box;margin:0;padding:0}
body{background:#04040B;color:#EEEEFF;font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
html{scroll-behavior:smooth}
input,textarea,button{font-family:inherit}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#12123A;border-radius:2px}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(7px)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes glow{0%,100%{box-shadow:0 0 0 rgba(99,102,241,0)}50%{box-shadow:0 0 60px rgba(99,102,241,.18)}}
@keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
@keyframes stickUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes stepGlow{0%,100%{box-shadow:0 0 0 rgba(99,102,241,0)}50%{box-shadow:0 0 24px rgba(99,102,241,.3)}}
.vd-btn{display:inline-flex;align-items:center;gap:8px;text-decoration:none;transition:all .2s ease;cursor:pointer}
.vd-btn:hover{opacity:.85;transform:translateY(-2px)}
.vd-ghost{display:inline-flex;align-items:center;gap:8px;text-decoration:none;transition:all .2s ease;cursor:pointer}
.vd-ghost:hover{border-color:#6366F1!important;color:#6366F1!important}
.vd-card{transition:all .22s ease}
.vd-card:hover{transform:translateY(-3px);border-color:#20204A!important;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.vd-link{color:#6878A0;text-decoration:none;transition:color .15s}
.vd-link:hover{color:#EEEEFF}
.vd-lk{transition:color .15s}
.vd-lk:hover{color:#6366F1!important}
.vd-tab{transition:all .15s ease;cursor:pointer;border:none;background:none}
.vd-sticky{position:fixed;bottom:0;left:0;right:0;z-index:150;padding:12px 16px 16px;background:rgba(4,4,11,.97);border-top:1px solid #12123A;backdrop-filter:blur(20px);animation:stickUp .3s ease}
input::placeholder,textarea::placeholder{color:#3A4A6A}
input:focus,textarea:focus{outline:none}
@media(max-width:768px){input,textarea,select{font-size:16px!important}}
@media(max-width:380px){.vd-hero-h1{font-size:clamp(32px,9.5vw,40px)!important;letter-spacing:-0.035em!important}.vd-hero-sub{font-size:15px!important}.vd-h2{font-size:clamp(26px,8.5vw,32px)!important}}
@media print{*{background:#fff!important;color:#000!important}nav,footer,.vd-sticky,.no-print{display:none!important}.print-plan{padding:40px!important;max-width:700px!important;margin:0 auto!important}}
`;

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const fmtN=v=>v.toLocaleString();
const fmtM=n=>n>=10000?`$${(n/1000).toFixed(0)}K`:n>=1000?`$${(n/1000).toFixed(1)}K`:`$${n}`;
const _lead={};
const BOOKING_URL=import.meta.env.VITE_BOOKING_URL||"";
const track=(event,params={})=>window.gtag?.("event",event,params);
function getSlots(){
  const s=[];const d=new Date();const labels=["10:00 AM","2:00 PM","4:00 PM"];
  while(s.length<9){d.setDate(d.getDate()+1);const day=d.getDay();if(day!==0&&day!==6){const ds=d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});labels.forEach(t=>s.push({date:ds,time:t,id:`${d.toISOString().slice(0,10)}_${t.replace(/[: ]/g,"")}`}));}}
  return s;
}

// ─────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────
function useInView(ref,threshold=0.2){
  const[v,setV]=useState(false);
  useEffect(()=>{
    const o=new IntersectionObserver(([e])=>{if(e.isIntersecting)setV(true);},{threshold});
    if(ref.current)o.observe(ref.current);
    return()=>o.disconnect();
  },[ref,threshold]);
  return v;
}

// ─────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────
const SLabel=({c,children})=><div style={{fontSize:11,fontWeight:700,color:c||W.accent,letterSpacing:"0.12em",marginBottom:16}}>{children}</div>;

function FormField({label,value,onChange,type="text",placeholder="",autoComplete,inputMode}){
  const[focused,setFocused]=useState(false);
  return(
    <div style={{marginBottom:18}}>
      <label style={{fontSize:11,fontWeight:700,color:W.textSub,display:"block",marginBottom:7,letterSpacing:"0.05em"}}>{label}</label>
      <input type={type} value={value} onChange={onChange}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        style={{width:"100%",background:W.surface,border:`1px solid ${focused?W.accent:W.border}`,borderRadius:9,padding:"12px 14px",color:W.text,fontSize:14,outline:"none",transition:"border-color .15s",boxShadow:focused?`0 0 0 3px ${W.accentB}`:"none"}}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STICKY MOBILE CTA
// ─────────────────────────────────────────────────────────────
function StickyMobileCTA(){
  const[show,setShow]=useState(false);
  useEffect(()=>{
    const h=()=>{const y=window.scrollY;const el=document.getElementById("contact");const cy=el?el.getBoundingClientRect().top+window.scrollY-200:Infinity;setShow(y>300&&y<cy);};
    window.addEventListener("scroll",h,{passive:true});return()=>window.removeEventListener("scroll",h);
  },[]);
  if(!show)return null;
  return(
    <div className="vd-sticky" style={{display:"flex",gap:10}}>
      <a href="#calculator" className="vd-btn" style={{flex:1,background:W.accent,color:"#fff",padding:14,borderRadius:10,fontSize:14,fontWeight:700,justifyContent:"center"}}>Calculate Lost Revenue</a>
      <a href="#contact" style={{background:W.card,border:`1px solid ${W.border}`,color:W.text,padding:"14px 18px",borderRadius:10,fontSize:14,fontWeight:600,textDecoration:"none",display:"flex",alignItems:"center"}}>Talk to Us</a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────────────────────
function WebNav({isMobile}){
  const[scrolled,setScrolled]=useState(false);
  const[open,setOpen]=useState(false);
  useEffect(()=>{
    const h=()=>setScrolled(window.scrollY>48);
    window.addEventListener("scroll",h,{passive:true});return()=>window.removeEventListener("scroll",h);
  },[]);
  const links=[["How It Works","/#how-it-works"],["Revenue Calculator","/#calculator"],["Industries","/#industries"],["Contact","/#contact"]];
  const Logo=()=>(
    <a href="/" style={{textDecoration:"none",display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:32,height:32,background:`linear-gradient(135deg,${W.accent},${W.accentH})`,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 2px 12px ${W.accentGlow}`}}>
        <span style={{color:"#fff",fontWeight:900,fontSize:15,letterSpacing:"-0.04em"}}>V</span>
      </div>
      <span style={{fontSize:17,fontWeight:800,color:W.text,letterSpacing:"-0.03em"}}>Veridian</span>
    </a>
  );
  return(
    <>
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:200,padding:isMobile?"14px 20px":"14px 48px",display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all .25s ease",background:scrolled?"rgba(4,4,11,.96)":W.bg,borderBottom:scrolled?`1px solid ${W.border}`:"1px solid transparent",backdropFilter:scrolled?"blur(24px)":"none"}}>
        <Logo/>
        {!isMobile&&(
          <div style={{display:"flex",gap:4,alignItems:"center"}}>
            {links.map(([l,h])=><a key={l} href={h} className="vd-link" style={{fontSize:13,fontWeight:500,padding:"7px 13px",borderRadius:7}}>{l}</a>)}
          </div>
        )}
        {!isMobile&&<a href="#contact" className="vd-btn" style={{background:W.accent,color:"#fff",padding:"9px 20px",borderRadius:8,fontSize:13,fontWeight:700}}>Get Started</a>}
        {isMobile&&<button onClick={()=>setOpen(true)} style={{background:"none",border:`1px solid ${W.border}`,borderRadius:8,padding:"8px 11px",color:W.text,cursor:"pointer",display:"flex"}}><Menu size={18}/></button>}
      </nav>
      {isMobile&&open&&(
        <div style={{position:"fixed",inset:0,zIndex:300,background:W.bg,display:"flex",flexDirection:"column",padding:"20px 24px",animation:"fadeIn .15s ease"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:48}}>
            <Logo/>
            <button onClick={()=>setOpen(false)} style={{background:"none",border:`1px solid ${W.border}`,borderRadius:8,padding:"8px 11px",color:W.textSub,cursor:"pointer"}}><X size={18}/></button>
          </div>
          <div style={{flex:1}}>
            {links.map(([l,h])=>(
              <a key={l} href={h} onClick={()=>setOpen(false)} style={{display:"block",fontSize:28,fontWeight:700,color:W.text,textDecoration:"none",padding:"18px 0",borderBottom:`1px solid ${W.border}`}}>{l}</a>
            ))}
          </div>
          <a href="#contact" onClick={()=>setOpen(false)} className="vd-btn" style={{background:W.accent,color:"#fff",padding:18,borderRadius:12,fontSize:16,fontWeight:700,justifyContent:"center",marginTop:40}}>Get Started</a>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────
function WebFooter({isMobile}){
  const lk={fontSize:13,color:W.textSub,textDecoration:"none",display:"block",marginBottom:10};
  const col={fontSize:10,fontWeight:700,color:W.textDim,letterSpacing:"0.1em",marginBottom:16};
  return(
    <footer style={{borderTop:`1px solid ${W.border}`,background:W.surface}}>
      <div style={{maxWidth:1160,margin:"0 auto",padding:isMobile?"44px 24px":"60px 48px 48px",display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"2fr 1fr 1fr 1fr",gap:isMobile?36:40}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:30,height:30,background:`linear-gradient(135deg,${W.accent},${W.accentH})`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontWeight:900,fontSize:14}}>V</span></div>
            <span style={{fontSize:16,fontWeight:800,color:W.text,letterSpacing:"-0.02em"}}>Veridian</span>
          </div>
          <p style={{fontSize:13,color:W.textSub,lineHeight:1.75,maxWidth:240,marginBottom:16}}>Revenue recovery for service businesses. We turn missed calls into booked appointments.</p>
          <div style={{fontSize:12,color:W.textDim}}>Sanford, Florida · Nationwide</div>
        </div>
        <div>
          <div style={col}>SERVICES</div>
          {[["How It Works","/#how-it-works"],["Revenue Calculator","/#calculator"],["Recovery Program","/#how-it-works"],["Industries","/#industries"]].map(([l,h])=><a key={l} href={h} className="vd-link" style={lk}>{l}</a>)}
        </div>
        <div>
          <div style={col}>INDUSTRIES</div>
          {[["Security","/industries/security"],["Contractors","/industries/contractors"],["Medical","/industries/medical"],["Law Firms","/industries/law"],["Property Mgmt","/industries/property-management"]].map(([l,h])=><a key={l} href={h} className="vd-link" style={lk}>{l}</a>)}
        </div>
        <div>
          <div style={col}>CONTACT</div>
          <div style={{fontSize:12,color:W.textDim,marginBottom:4}}>Steve Smith · Managing Member</div>
          <a href="tel:+14074705992" className="vd-lk" style={{...lk,color:W.text,fontWeight:600}}>(407) 470-5992</a>
          <div style={{fontSize:12,color:W.textDim,marginBottom:4,marginTop:8}}>Skeeter · Director of Operations</div>
          <a href="tel:+16892485965" className="vd-lk" style={{...lk,color:W.text,fontWeight:600}}>(689) 248-5965</a>
          <a href="mailto:info@veridianriskgroup.org" className="vd-lk" style={{...lk,marginTop:8}}>info@veridianriskgroup.org</a>
        </div>
      </div>
      <div style={{borderTop:`1px solid ${W.border}`,padding:isMobile?"16px 24px":"14px 48px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div style={{fontSize:11,color:W.textDim}}>&copy; {new Date().getFullYear()} Veridian Risk &amp; Resilience Group. All rights reserved.</div>
        <a href="/dashboard" style={{fontSize:11,color:W.textDim,textDecoration:"none",opacity:.4}}>Team Access</a>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────
// HERO — ANIMATED RECOVERY JOURNEY
// ─────────────────────────────────────────────────────────────
const JOURNEY=[
  {icon:Phone,label:"Customer Calls",sub:"Prospect dials your number",color:"#3B82F6"},
  {icon:X,label:"No Answer",sub:"Call goes unanswered",color:W.red},
  {icon:MessageSquare,label:"Instant Response",sub:"Veridian replies in < 60s",color:W.accent},
  {icon:MessageSquare,label:"Customer Replies",sub:"Conversation started",color:"#8B5CF6"},
  {icon:Calendar,label:"Appointment Booked",sub:"Confirmed and scheduled",color:W.green},
  {icon:CheckCircle,label:"Revenue Recovered",sub:"Lead converted",color:W.green},
];

function RecoveryJourney(){
  const[active,setActive]=useState(0);
  const[paused,setPaused]=useState(false);
  useEffect(()=>{
    if(paused)return;
    const t=setTimeout(()=>setActive(a=>(a+1)%JOURNEY.length),1800);
    return()=>clearTimeout(t);
  },[active,paused]);
  return(
    <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:"28px 32px",minWidth:0}}>
      <div style={{fontSize:10,fontWeight:700,color:W.accent,letterSpacing:"0.12em",marginBottom:24}}>REVENUE RECOVERY IN REAL TIME</div>
      <div style={{position:"relative",paddingLeft:40}}>
        {/* Vertical line */}
        <div style={{position:"absolute",left:15,top:20,bottom:20,width:1,background:`linear-gradient(180deg,${W.border},${W.accent}44,${W.border})`}}/>
        {JOURNEY.map((s,i)=>{
          const Icon=s.icon;
          const isActive=i===active;
          const isPast=i<active;
          return(
            <div key={i} onClick={()=>{setActive(i);setPaused(true);setTimeout(()=>setPaused(false),5000);}}
              style={{display:"flex",alignItems:"flex-start",gap:16,marginBottom:i<JOURNEY.length-1?20:0,cursor:"pointer",opacity:isActive?1:isPast?0.45:0.25,transition:"all .4s ease"}}>
              <div style={{position:"absolute",left:0,width:32,height:32,borderRadius:"50%",background:isActive?`${s.color}18`:W.surface,border:`2px solid ${isActive?s.color:W.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .4s ease",boxShadow:isActive?`0 0 20px ${s.color}44`:"none"}}>
                <Icon size={13} style={{color:isActive?s.color:W.textDim}}/>
              </div>
              <div style={{paddingTop:4}}>
                <div style={{fontSize:14,fontWeight:700,color:isActive?W.text:W.textSub,marginBottom:2,transition:"color .3s"}}>{s.label}</div>
                <div style={{fontSize:12,color:isActive?W.textSub:W.textDim}}>{s.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Progress */}
      <div style={{marginTop:24,height:2,background:W.border,borderRadius:1,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${((active+1)/JOURNEY.length)*100}%`,background:W.accent,transition:"width .4s ease",borderRadius:1}}/>
      </div>
      <div style={{marginTop:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:11,color:W.textDim}}>Step {active+1} of {JOURNEY.length}</div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:W.green,animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:11,color:W.green,fontWeight:600}}>LIVE</span>
        </div>
      </div>
    </div>
  );
}

function Hero({isMobile}){
  return(
    <section style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",position:"relative",overflow:"hidden",padding:isMobile?"128px 24px 80px":"144px 48px 100px"}}>
      {/* Background glow */}
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 80% 60% at 50% 0%,rgba(99,102,241,0.06) 0%,transparent 60%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:"50%",right:"5%",width:500,height:500,background:"radial-gradient(circle,rgba(99,102,241,0.04) 0%,transparent 60%)",pointerEvents:"none"}}/>
      <div style={{maxWidth:1160,margin:"0 auto",width:"100%",position:"relative",zIndex:1}}>
        <div style={{display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:isMobile?0:72,alignItems:"center"}}>
          {/* Left */}
          <div>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,background:W.accentB,border:"1px solid rgba(99,102,241,0.2)",borderRadius:100,padding:"5px 14px",marginBottom:32}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:W.green,animation:"pulse 2s infinite"}}/>
              <span style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.08em"}}>VERIDIAN REVENUE RECOVERY PROGRAM™</span>
            </div>
            <h1 className="vd-hero-h1" style={{fontSize:isMobile?"44px":"72px",fontWeight:900,color:W.text,lineHeight:1.02,letterSpacing:"-0.04em",marginBottom:24}}>
              Every Missed Call<br/>
              <span style={{background:`linear-gradient(135deg,${W.accent},#8B5CF6)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>Costs Revenue.</span>
            </h1>
            <p className="vd-hero-sub" style={{fontSize:isMobile?"17px":"20px",color:W.textSub,lineHeight:1.65,maxWidth:480,marginBottom:40}}>
              Businesses lose thousands every month from missed calls, delayed responses, and abandoned opportunities. Veridian recovers that revenue — booking appointments and capturing every opportunity your team couldn't reach.
            </p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
              <a href="#calculator" className="vd-btn" style={{background:W.accent,color:"#fff",padding:isMobile?"14px 28px":"16px 36px",borderRadius:10,fontSize:isMobile?"15px":"17px",fontWeight:700,boxShadow:`0 4px 20px ${W.accentGlow}`}}>
                Calculate Lost Revenue <ArrowRight size={16}/>
              </a>
              <a href="#contact" className="vd-ghost" style={{background:"none",border:`1.5px solid ${W.border}`,color:W.text,padding:isMobile?"13px 24px":"15px 32px",borderRadius:10,fontSize:isMobile?"15px":"17px",fontWeight:600}}>
                Get My Recovery Plan
              </a>
            </div>
            <div style={{fontSize:12,color:W.textDim,marginBottom:isMobile?44:0}}>No obligation. Results in 60 seconds.</div>
            {/* Mini stats */}
            {!isMobile&&(
              <div style={{display:"flex",gap:40,marginTop:44,paddingTop:36,borderTop:`1px solid ${W.border}`}}>
                {[{n:"68%",l:"of missed calls recovered"},{n:"<60s",l:"first response time"},{n:"10+",l:"years in the field"}].map(s=>(
                  <div key={s.l}>
                    <div style={{fontSize:26,fontWeight:900,color:W.text,letterSpacing:"-0.03em"}}>{s.n}</div>
                    <div style={{fontSize:11,color:W.textSub,marginTop:4}}>{s.l}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Right — Journey */}
          {!isMobile&&<RecoveryJourney/>}
        </div>
      </div>
      <div style={{position:"absolute",bottom:36,left:"50%",transform:"translateX(-50%)",animation:"bounce 2s infinite"}}><ChevronDown size={20} style={{color:W.textDim}}/></div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// BEFORE / AFTER
// ─────────────────────────────────────────────────────────────
function BeforeAfter({isMobile}){
  const ref=useRef(null);
  const inView=useInView(ref);
  const before=[
    "Missed call → lead gone forever",
    "Delayed response → prospect calls competitor",
    "No follow-up → opportunity abandoned",
    "After-hours calls → unanswered, untracked",
    "Unknown losses → revenue invisible",
  ];
  const after=[
    "Every call answered within 60 seconds",
    "First to respond → first to win the business",
    "Systematic follow-up → no lead left behind",
    "24/7 coverage → every hour is revenue hours",
    "Monthly reports → revenue tracked in dollars",
  ];
  return(
    <section style={{padding:isMobile?"80px 24px":"120px 48px",background:W.surface,borderTop:`1px solid ${W.border}`}}>
      <div style={{maxWidth:1160,margin:"0 auto"}} ref={ref}>
        <div style={{textAlign:"center",marginBottom:isMobile?48:72}}>
          <SLabel c={W.red}>THE COST OF DOING NOTHING</SLabel>
          <h2 style={{fontSize:isMobile?"34px":"52px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.04,marginBottom:16}}>
            Two versions of your business.
          </h2>
          <p style={{fontSize:isMobile?"15px":"17px",color:W.textSub,maxWidth:420,margin:"0 auto"}}>Every missed call is a choice. Recover it — or lose it.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?16:24,marginBottom:36}}>
          <div style={{background:"linear-gradient(160deg,rgba(239,68,68,0.06) 0%,rgba(239,68,68,0.02) 100%)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:20,padding:isMobile?28:40,animation:inView?`fadeUp .5s ease .1s both`:"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:28}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <X size={12} style={{color:W.red}}/>
              </div>
              <span style={{fontSize:11,fontWeight:700,color:W.red,letterSpacing:"0.1em"}}>WITHOUT VERIDIAN</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {before.map((t,i)=>{
                const[bad,outcome]=t.split("→");
                return(
                  <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    <div style={{width:20,height:20,borderRadius:"50%",background:"rgba(239,68,68,0.07)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                      <X size={9} style={{color:W.red}}/>
                    </div>
                    <div style={{fontSize:14,color:W.text,lineHeight:1.4}}>
                      <span style={{fontWeight:600}}>{bad.trim()}</span>
                      {outcome&&<span style={{color:W.red}}> →{outcome}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:28,padding:"14px 18px",background:"rgba(239,68,68,0.05)",borderRadius:10,borderTop:"1px solid rgba(239,68,68,0.12)"}}>
              <div style={{fontSize:20,fontWeight:900,color:W.red,letterSpacing:"-0.02em"}}>$0 recovered</div>
              <div style={{fontSize:12,color:W.textSub,marginTop:3}}>Every missed call stays lost</div>
            </div>
          </div>
          <div style={{background:"linear-gradient(160deg,rgba(16,185,129,0.07) 0%,rgba(16,185,129,0.02) 100%)",border:"1px solid rgba(16,185,129,0.18)",borderRadius:20,padding:isMobile?28:40,animation:inView?`fadeUp .5s ease .2s both`:"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:28}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.25)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <CheckCircle size={12} style={{color:W.green}}/>
              </div>
              <span style={{fontSize:11,fontWeight:700,color:W.green,letterSpacing:"0.1em"}}>WITH VERIDIAN</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {after.map((t,i)=>{
                const[action,outcome]=t.split("→");
                return(
                  <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    <div style={{width:20,height:20,borderRadius:"50%",background:"rgba(16,185,129,0.07)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                      <Check size={9} style={{color:W.green}}/>
                    </div>
                    <div style={{fontSize:14,color:W.text,lineHeight:1.4}}>
                      <span style={{fontWeight:600}}>{action.trim()}</span>
                      {outcome&&<span style={{color:W.green}}> →{outcome}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:28,padding:"14px 18px",background:"rgba(16,185,129,0.05)",borderRadius:10,borderTop:"1px solid rgba(16,185,129,0.12)"}}>
              <div style={{fontSize:20,fontWeight:900,color:W.green,letterSpacing:"-0.02em"}}>Revenue recovered</div>
              <div style={{fontSize:12,color:W.textSub,marginTop:3}}>Every missed call becomes an opportunity</div>
            </div>
          </div>
        </div>
        <div style={{textAlign:"center"}}>
          <a href="#calculator" className="vd-btn" style={{background:W.accent,color:"#fff",padding:"14px 32px",borderRadius:10,fontSize:15,fontWeight:700,boxShadow:`0 4px 16px ${W.accentGlow}`}}>
            Calculate What You're Losing <ArrowRight size={16}/>
          </a>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// REVENUE CALCULATOR
// ─────────────────────────────────────────────────────────────
function Calculator({isMobile}){
  const[calls,setCalls]=useState(200);
  const[miss,setMiss]=useState(30);
  const[val,setVal]=useState(500);
  const[conv,setConv]=useState(40);
  const missed=Math.round(calls*miss/100);
  const opps=Math.round(missed*conv/100);
  const lostMo=opps*val;
  const recMo=Math.round(lostMo*0.68);
  const annual=recMo*12;
  const Sl=({label,value,set,min,max,step=1,fmt})=>(
    <div style={{marginBottom:24}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
        <span style={{fontSize:13,color:W.textSub}}>{label}</span>
        <span style={{fontSize:14,fontWeight:700,color:W.text}}>{fmt(value)}</span>
      </div>
      <div style={{position:"relative",height:24,display:"flex",alignItems:"center"}}>
        <div style={{position:"absolute",left:0,right:0,height:4,background:W.border,borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${((value-min)/(max-min))*100}%`,background:W.accent,borderRadius:2}}/>
        </div>
        <input type="range" min={min} max={max} step={step} value={value} onChange={e=>set(Number(e.target.value))} style={{position:"absolute",inset:0,opacity:0,width:"100%",cursor:"pointer",height:"100%"}}/>
      </div>
    </div>
  );
  return(
    <section id="calculator" style={{padding:isMobile?"80px 24px":"120px 48px",background:W.surface}}>
      <div style={{maxWidth:1160,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?48:72}}>
          <SLabel>REVENUE CALCULATOR</SLabel>
          <h2 style={{fontSize:isMobile?"34px":"56px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.04,marginBottom:16}}>
            How much revenue<br/>are you losing?
          </h2>
          <p style={{fontSize:isMobile?"15px":"18px",color:W.textSub,maxWidth:440,margin:"0 auto"}}>Move the sliders. See the number. Then decide what to do about it.</p>
        </div>
        <div style={{display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:28,alignItems:"start"}}>
          {/* Sliders */}
          <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?28:44}}>
            <div style={{fontSize:11,fontWeight:700,color:W.textDim,letterSpacing:"0.1em",marginBottom:32}}>YOUR NUMBERS</div>
            <Sl label="Monthly incoming calls" value={calls} set={setCalls} min={50} max={2000} step={50} fmt={v=>fmtN(v)}/>
            <Sl label="Missed call rate" value={miss} set={setMiss} min={5} max={60} fmt={v=>`${v}%`}/>
            <Sl label="Average customer value" value={val} set={setVal} min={100} max={10000} step={100} fmt={v=>`$${fmtN(v)}`}/>
            <Sl label="Lead-to-customer conversion" value={conv} set={setConv} min={10} max={80} fmt={v=>`${v}%`}/>
          </div>
          {/* Results */}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{background:"linear-gradient(135deg,rgba(239,68,68,0.08),rgba(239,68,68,0.03))",border:"1px solid rgba(239,68,68,0.18)",borderRadius:20,padding:isMobile?28:36,textAlign:"center"}}>
              <div style={{fontSize:11,fontWeight:700,color:W.red,letterSpacing:"0.1em",marginBottom:12}}>REVENUE LOST ANNUALLY</div>
              <div style={{fontSize:isMobile?"52px":"72px",fontWeight:900,color:W.text,letterSpacing:"-0.045em",lineHeight:1}}>{fmtM(lostMo*12)}</div>
              <div style={{fontSize:13,color:W.textSub,marginTop:10}}>slipping away from {fmtN(missed)} missed calls/month</div>
            </div>
            <div style={{background:"linear-gradient(135deg,rgba(99,102,241,0.1),rgba(99,102,241,0.04))",border:"1px solid rgba(99,102,241,0.22)",borderRadius:20,padding:isMobile?24:32,textAlign:"center"}}>
              <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:8}}>VERIDIAN RECOVERY POTENTIAL</div>
              <div style={{fontSize:isMobile?"44px":"60px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1}}>{fmtM(annual)}</div>
              <div style={{fontSize:12,color:W.textSub,marginTop:8}}>per year · based on 68% recovery rate</div>
            </div>
            <a href="#contact" onClick={()=>{Object.assign(_lead,{calls,miss,val,conv,missed,lostMo,recMo,annual});window.dispatchEvent(new CustomEvent("veridian:calcdata",{detail:{..._lead}}));track("calculator_cta_click",{value:annual,currency:"USD"});}}
              className="vd-btn" style={{background:W.accent,color:"#fff",padding:isMobile?16:18,borderRadius:12,fontSize:15,fontWeight:700,justifyContent:"center",boxShadow:`0 6px 24px ${W.accentGlow}`}}>
              Get My Recovery Plan <ArrowRight size={16}/>
            </a>
            <div style={{fontSize:11,color:W.textDim,textAlign:"center"}}>Representative outcomes. Results vary by industry and call volume.</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// HOW IT WORKS
// ─────────────────────────────────────────────────────────────
function HowItWorks({isMobile}){
  const ref=useRef(null);
  const inView=useInView(ref);
  const steps=[
    {n:"01",title:"You miss a call",body:"A prospect calls. Your team is busy or unavailable. Before Veridian, this lead was gone — silently, permanently, to a competitor who answered.",color:W.red},
    {n:"02",title:"Response in 60 seconds",body:"Veridian replies before the caller reaches the next business on their list. Professional, immediate, and specific to your business.",color:W.accent},
    {n:"03",title:"Appointment booked",body:"The caller is qualified and scheduled — no staff involvement, no phone tag. A confirmed appointment appears on your calendar automatically.",color:"#8B5CF6"},
    {n:"04",title:"Revenue recovered",body:"The job is booked. The patient is scheduled. The contract is on the table. Revenue that would have been lost — recovered.",color:W.green},
  ];
  return(
    <section id="how-it-works" style={{padding:isMobile?"80px 24px":"120px 48px",background:W.bg}}>
      <div style={{maxWidth:1160,margin:"0 auto"}} ref={ref}>
        <div style={{textAlign:"center",marginBottom:isMobile?48:80}}>
          <SLabel>HOW REVENUE IS RECOVERED</SLabel>
          <h2 style={{fontSize:isMobile?"34px":"56px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.04,marginBottom:16}}>
            Four steps.<br/>
            <span style={{background:`linear-gradient(135deg,${W.accent},#8B5CF6,${W.green})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>One outcome.</span>
          </h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,1fr)",gap:isMobile?16:24}}>
          {steps.map((s,i)=>(
            <div key={i} className="vd-card" style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:18,padding:isMobile?24:32,animation:inView?`fadeUp .5s ease ${i*0.1}s both`:"none"}}>
              <div style={{fontSize:40,fontWeight:900,color:W.border,letterSpacing:"-0.04em",marginBottom:20,lineHeight:1}}>{s.n}</div>
              <div style={{width:40,height:3,background:s.color,borderRadius:2,marginBottom:20}}/>
              <div style={{fontSize:16,fontWeight:700,color:W.text,marginBottom:12,lineHeight:1.3}}>{s.title}</div>
              <p style={{fontSize:13,color:W.textSub,lineHeight:1.7}}>{s.body}</p>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:48}}>
          <a href="#contact" className="vd-btn" style={{background:W.accent,color:"#fff",padding:"15px 36px",borderRadius:10,fontSize:15,fontWeight:700,boxShadow:`0 4px 20px ${W.accentGlow}`}}>
            Start Recovering Revenue <ArrowRight size={16}/>
          </a>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// RESULTS
// ─────────────────────────────────────────────────────────────
function Results({isMobile}){
  const ref=useRef(null);
  const inView=useInView(ref);
  const stats=[
    {v:"68%",l:"Recovery Rate",sub:"Of missed calls converted to revenue",c:W.accent},
    {v:"<60s",l:"Response Time",sub:"From missed call to first contact",c:W.green},
    {v:"10+",l:"Years of Experience",sub:"Operating, not theorizing",c:W.accent},
    {v:"24/7",l:"Always Available",sub:"No breaks, no gaps, no lost leads",c:W.green},
  ];
  return(
    <section id="results" style={{padding:isMobile?"80px 24px":"120px 48px",background:W.surface}}>
      <div style={{maxWidth:1160,margin:"0 auto"}} ref={ref}>
        <div style={{textAlign:"center",marginBottom:isMobile?48:72}}>
          <SLabel>RESULTS</SLabel>
          <h2 style={{fontSize:isMobile?"34px":"56px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.04,marginBottom:16}}>
            What recovery looks like.
          </h2>
          <p style={{fontSize:isMobile?"15px":"18px",color:W.textSub,maxWidth:440,margin:"0 auto"}}>Numbers from the field. Representative outcomes — actual results vary by call volume and industry.</p>
        </div>
        {/* Stat cards */}
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:16,marginBottom:48}}>
          {stats.map((s,i)=>(
            <div key={i} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:18,padding:isMobile?20:32,textAlign:"center",animation:inView?`fadeUp .5s ease ${i*0.1}s both`:"none"}}>
              <div style={{fontSize:isMobile?"36px":"52px",fontWeight:900,color:s.c,letterSpacing:"-0.04em",lineHeight:1,marginBottom:12}}>{s.v}</div>
              <div style={{fontSize:13,fontWeight:700,color:W.text,marginBottom:6}}>{s.l}</div>
              <div style={{fontSize:11,color:W.textDim,lineHeight:1.5}}>{s.sub}</div>
            </div>
          ))}
        </div>
        <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:16,padding:isMobile?24:36,textAlign:"center"}}>
          <div style={{display:"inline-block",background:W.accentB,border:"1px solid rgba(99,102,241,0.22)",borderRadius:6,padding:"4px 12px",fontSize:10,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:14}}>FOUNDING CLIENT PROGRAM</div>
          <div style={{fontSize:isMobile?"18px":"22px",fontWeight:800,color:W.text,marginBottom:12}}>Now accepting founding clients.</div>
          <p style={{fontSize:13,color:W.textSub,lineHeight:1.72,maxWidth:520,margin:"0 auto 20px"}}>We are currently onboarding a limited number of founding clients. Participants receive priority onboarding, direct access to leadership, and monthly recovery reporting.</p>
          <a href="#contact" className="vd-btn" style={{background:W.accent,color:"#fff",padding:"12px 28px",borderRadius:9,fontSize:14,fontWeight:700,boxShadow:`0 4px 16px ${W.accentGlow}`,textDecoration:"none",display:"inline-flex"}}>
            Apply for Founding Access <ArrowRight size={15}/>
          </a>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// PROGRAM OFFER
// ─────────────────────────────────────────────────────────────
function ProgramOffer({isMobile}){
  const ref=useRef(null);
  const inView=useInView(ref);
  const features=[
    {t:"Missed Call Recovery",b:"Every unanswered call gets an immediate professional response within 60 seconds — before the caller reaches a competitor."},
    {t:"Customer Follow-Up",b:"Systematic outreach sequences that keep every prospect engaged until they book or explicitly opt out."},
    {t:"Appointment Recovery",b:"Every no-show and cancelled slot is re-engaged automatically with a new scheduling offer."},
    {t:"Lead Re-Engagement",b:"Dormant prospects are recontacted with a relevant, personalized offer — turning old leads into new revenue."},
    {t:"Revenue Tracking",b:"Monthly reports showing exactly what was recovered — in dollars, before and after Veridian."},
  ];
  return(
    <section style={{padding:isMobile?"80px 24px":"120px 48px",background:W.bg}}>
      <div style={{maxWidth:1160,margin:"0 auto"}} ref={ref}>
        <div style={{display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:isMobile?48:80,alignItems:"center"}}>
          <div style={{animation:inView?`fadeUp .5s ease both`:"none"}}>
            <SLabel>ONE PROGRAM. ONE OUTCOME.</SLabel>
            <h2 style={{fontSize:isMobile?"34px":"52px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.04,marginBottom:20}}>
              Veridian Revenue<br/>
              <span style={{background:`linear-gradient(135deg,${W.accent},${W.green})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>Recovery Program™</span>
            </h2>
            <p style={{fontSize:isMobile?"15px":"17px",color:W.textSub,lineHeight:1.72,marginBottom:32,maxWidth:400}}>Everything needed to capture and convert missed calls into revenue — in one program, with one team, for one outcome.</p>
            <a href="#contact" className="vd-btn" style={{background:W.accent,color:"#fff",padding:isMobile?"14px 28px":"16px 36px",borderRadius:10,fontSize:16,fontWeight:700,boxShadow:`0 4px 20px ${W.accentGlow}`}}>
              Start My Recovery Program <ArrowRight size={16}/>
            </a>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {features.map((f,i)=>(
              <div key={i} className="vd-card" style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:14,padding:isMobile?18:22,display:"flex",gap:14,alignItems:"flex-start",animation:inView?`fadeUp .4s ease ${i*0.07}s both`:"none"}}>
                <div style={{width:26,height:26,borderRadius:7,background:W.accentB,border:`1px solid rgba(99,102,241,0.16)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                  <Check size={12} style={{color:W.accent}}/>
                </div>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:W.text,marginBottom:3}}>{f.t}</div>
                  <p style={{fontSize:12,color:W.textSub,lineHeight:1.65,margin:0}}>{f.b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// INDUSTRIES
// ─────────────────────────────────────────────────────────────
const IND_DATA=[
  {id:"security",name:"Security Companies",problem:"Security buyers call 3–5 companies and retain the first one that responds. If your dispatcher is on a call, that patrol contract goes to whoever answered.",loss:"$84K–$216K/yr",lossDetail:"Two missed patrol bids per month at $3,500–$9,000 each.",recovery:"$57K–$147K/yr",solution:"Every inquiry gets an immediate response. Site assessments scheduled. Follow-up automated.",outcome:"2–4 additional patrol contracts per month from inquiries that previously went unanswered."},
  {id:"property-management",name:"Property Management",problem:"Tenants don't leave voicemails. They call. If no one answers, they file complaints, break leases, or never sign one. Every unanswered inquiry is a vacancy extending.",loss:"$21K–$84K/yr",lossDetail:"Three leasing calls missed per month at $1,750 average vacancy cost.",recovery:"$14K–$57K/yr",solution:"After-hours maintenance requests captured. Leasing inquiries qualified. Showings scheduled automatically.",outcome:"Fewer tenant complaints, faster lease-up, and zero calls going unanswered after hours."},
  {id:"contractors",name:"Contractors",problem:"You're on a job site. Your phone rings. You can't answer it. That caller found a quote in 90 seconds — from someone who did answer. Your bid was never submitted.",loss:"$96K–$240K/yr",lossDetail:"Eight missed bids per month at $2,500–$12,000 average job value.",recovery:"$65K–$163K/yr",solution:"Every missed call gets a response in 60 seconds. Job details collected. Estimate appointments booked to your calendar.",outcome:"Contractors report winning 2–4 additional jobs per month from inquiries that went unanswered before Veridian."},
  {id:"medical",name:"Medical Practices",problem:"Patients who can't reach your front desk don't wait. They find the next available provider. Every missed call is an empty appointment slot and a lost patient relationship.",loss:"$48K–$192K/yr",lossDetail:"Ten missed new patient calls per week at $200–$800 average value.",recovery:"$33K–$131K/yr",solution:"Patient inquiries answered 24/7. Appointments scheduled. No-shows re-engaged. Zero added front desk workload.",outcome:"Medical practices recover an average of 12 additional appointment slots per month from previously missed calls."},
  {id:"law",name:"Law Firms",problem:"Potential clients call 2–3 firms. They retain the first one that responds professionally. If they reach your voicemail, the probability of them waiting for a callback is less than 25%.",loss:"$60K–$600K/yr",lossDetail:"One retained client per month missed at $5,000–$50,000 average fee.",recovery:"$41K–$408K/yr",solution:"Every inquiry receives a professional response. Consultations scheduled. Practice area qualification handled automatically.",outcome:"Law firms report a 45% increase in consultation bookings from the same call volume — zero additional intake staff."},
];

function Industries({isMobile}){
  const[active,setActive]=useState(0);
  const d=IND_DATA[active];
  return(
    <section id="industries" style={{padding:isMobile?"80px 24px":"120px 48px",background:W.bg}}>
      <div style={{maxWidth:1160,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?40:64}}>
          <SLabel>INDUSTRIES</SLabel>
          <h2 style={{fontSize:isMobile?"34px":"56px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.04,marginBottom:16}}>
            Built for your business.
          </h2>
          <p style={{fontSize:isMobile?"15px":"18px",color:W.textSub,maxWidth:440,margin:"0 auto"}}>Revenue recovery challenges differ by industry. Veridian is configured for yours.</p>
        </div>
        {/* Tabs */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:32,justifyContent:isMobile?"flex-start":"center"}}>
          {IND_DATA.map((ind,i)=>(
            <button key={ind.id} onClick={()=>setActive(i)} className="vd-tab"
              style={{padding:"8px 18px",borderRadius:100,fontSize:13,fontWeight:600,color:i===active?W.text:W.textSub,background:i===active?W.card:"none",border:`1px solid ${i===active?W.accent:W.border}`}}>
              {ind.name}
            </button>
          ))}
        </div>
        {/* Content */}
        <div key={active} style={{animation:"fadeIn .25s ease",display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:20}}>
          {/* Left — Risk */}
          <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?24:36}}>
            <div style={{fontSize:10,fontWeight:700,color:W.red,letterSpacing:"0.1em",marginBottom:16}}>ANNUAL REVENUE AT RISK</div>
            <div style={{fontSize:isMobile?"36px":"48px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1,marginBottom:8}}>{d.loss}</div>
            <div style={{fontSize:13,color:W.textSub,marginBottom:24,paddingBottom:24,borderBottom:`1px solid ${W.border}`}}>{d.lossDetail}</div>
            <p style={{fontSize:isMobile?"14px":"15px",color:W.textSub,lineHeight:1.75}}>{d.problem}</p>
          </div>
          {/* Right — Recovery + Outcome */}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{background:"linear-gradient(135deg,rgba(16,185,129,0.08),rgba(16,185,129,0.03))",border:"1px solid rgba(16,185,129,0.22)",borderRadius:20,padding:isMobile?24:32}}>
              <div style={{fontSize:10,fontWeight:700,color:W.green,letterSpacing:"0.1em",marginBottom:12}}>RECOVERY POTENTIAL</div>
              <div style={{fontSize:isMobile?"36px":"48px",fontWeight:900,color:W.green,letterSpacing:"-0.04em",lineHeight:1,marginBottom:8}}>{d.recovery}</div>
              <div style={{fontSize:12,color:W.textSub}}>based on 68% average recovery rate</div>
            </div>
            <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?24:32,flex:1}}>
              <div style={{fontSize:10,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:12}}>EXPECTED OUTCOME</div>
              <p style={{fontSize:isMobile?"14px":"15px",color:W.text,lineHeight:1.72}}>{d.outcome}</p>
            </div>
            <a href={`/industries/${d.id}`} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,fontWeight:600,color:W.accent,textDecoration:"none"}}>Full {d.name} overview <ChevronRight size={14}/></a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// TRUST
// ─────────────────────────────────────────────────────────────
function Trust({isMobile}){
  const ref=useRef(null);
  const inView=useInView(ref);
  const pts=[
    {I:Award,t:"Built by operators",b:"We ran service businesses. We watched revenue disappear from missed calls. We built Veridian to stop it."},
    {I:Users,t:"Human support, always",b:"Every client has a dedicated contact. No tickets. No bots. Real people who understand your business."},
    {I:Globe,t:"Nationwide coverage",b:"Wherever you operate, Veridian operates. Florida-based, nationwide in practice."},
    {I:Clock,t:"Same-day response",b:"We answer within the same business day. Your clients deserve speed — and so do you."},
    {I:Shield,t:"Outcome-focused",b:"We measure success by revenue recovered. Not features deployed. Not seats sold."},
    {I:Zap,t:"No commitment to start",b:"Free consultation. We show you your recovery potential before you commit anything."},
  ];
  return(
    <section style={{padding:isMobile?"80px 24px":"120px 48px",background:W.surface}}>
      <div style={{maxWidth:1160,margin:"0 auto"}} ref={ref}>
        <div style={{textAlign:"center",marginBottom:isMobile?48:72}}>
          <SLabel>WHY VERIDIAN</SLabel>
          <h2 style={{fontSize:isMobile?"34px":"56px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.04,marginBottom:16}}>
            We don't sell software.<br/>We recover revenue.
          </h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:16}}>
          {pts.map((p,i)=>{const Icon=p.I;return(
            <div key={i} className="vd-card" style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:18,padding:isMobile?24:32,animation:inView?`fadeUp .5s ease ${i*0.08}s both`:"none"}}>
              <div style={{width:44,height:44,borderRadius:12,background:W.accentB,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20}}>
                <Icon size={19} style={{color:W.accent}}/>
              </div>
              <div style={{fontSize:15,fontWeight:700,color:W.text,marginBottom:10}}>{p.t}</div>
              <p style={{fontSize:13,color:W.textSub,lineHeight:1.7}}>{p.b}</p>
            </div>
          );})}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────
function FAQ({isMobile}){
  const[open,setOpen]=useState(null);
  const faqs=[
    {q:"How quickly can we start?",a:"Most clients are fully live within 5 business days. Onboarding requires a simple call forwarding setup — no new phone system, no IT project, no disruption to your current operations. We handle all configuration."},
    {q:"Do I need to change phone providers?",a:"No. Veridian works with any business phone number. The setup is a simple call forwarding change that takes minutes — your existing number, carrier, and team stay exactly as they are."},
    {q:"How do appointments get booked?",a:"Veridian responds to every missed call, qualifies the prospect, and schedules appointments directly to your calendar — automatically. No staff action required. The appointment appears as if your team booked it."},
    {q:"What industries do you work with?",a:"Security companies, property management, contractors, medical practices, and law firms are our primary verticals. Any service business that books appointments, closes projects, or retains clients over the phone is a strong fit."},
    {q:"How is pricing determined?",a:"Pricing is based on your call volume and the services included in your Recovery Program. We discuss specifics during your free consultation — after we've reviewed your actual numbers and built your recovery estimate."},
    {q:"What happens after I contact Veridian?",a:"We respond within one business day. We'll schedule a 30-minute call to review where revenue is being lost and determine if Veridian is the right fit — at no cost and no obligation. If we're not the right fit, we'll tell you."},
  ];
  return(
    <section style={{padding:isMobile?"80px 24px":"120px 48px",background:W.bg,borderTop:`1px solid ${W.border}`}}>
      <div style={{maxWidth:760,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?48:64}}>
          <SLabel>FAQ</SLabel>
          <h2 style={{fontSize:isMobile?"30px":"48px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.04,marginBottom:16}}>
            Questions before the first call.
          </h2>
        </div>
        <div>
          {faqs.map((f,i)=>(
            <div key={i} style={{borderBottom:`1px solid ${W.border}`}}>
              <button onClick={()=>setOpen(open===i?null:i)} style={{width:"100%",background:"none",border:"none",padding:"22px 0",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",textAlign:"left",gap:16}}>
                <span style={{fontSize:isMobile?"14px":"16px",fontWeight:700,color:W.text,lineHeight:1.35}}>{f.q}</span>
                <div style={{width:24,height:24,borderRadius:"50%",background:open===i?W.accentB:W.card,border:`1px solid ${open===i?W.accent:W.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                  <span style={{fontSize:14,color:open===i?W.accent:W.textSub,fontWeight:700,lineHeight:1}}>{open===i?"−":"+"}</span>
                </div>
              </button>
              {open===i&&(
                <div style={{paddingBottom:22,animation:"fadeIn .2s ease"}}>
                  <p style={{fontSize:isMobile?"14px":"15px",color:W.textSub,lineHeight:1.75}}>{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{marginTop:40,background:W.accentB,border:`1px solid rgba(99,102,241,0.2)`,borderRadius:14,padding:isMobile?20:28,display:"flex",flexDirection:isMobile?"column":"row",alignItems:isMobile?"flex-start":"center",justifyContent:"space-between",gap:16}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:W.text,marginBottom:4}}>Still have questions?</div>
            <div style={{fontSize:13,color:W.textSub}}>No scripts, no pressure — just honest answers.</div>
          </div>
          <a href="#contact" className="vd-btn" style={{background:W.accent,color:"#fff",padding:"12px 24px",borderRadius:9,fontSize:14,fontWeight:700,whiteSpace:"nowrap",boxShadow:`0 4px 16px ${W.accentGlow}`}}>
            Ask Us Directly
          </a>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// CONTACT
// ─────────────────────────────────────────────────────────────
function Contact({isMobile}){
  const[f,setF]=useState({name:"",biz:"",phone:"",email:"",challenge:""});
  const[step,setStep]=useState("form");
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState(null);
  const[calcHint,setCalcHint]=useState(null);
  const[leadId,setLeadId]=useState(null);
  const[slot,setSlot]=useState(null); // eslint-disable-line no-unused-vars
  const[plan,setPlan]=useState(null);
  const[planLoading,setPlanLoading]=useState(false);
  const[bookingLoading,setBookingLoading]=useState(false);
  const[taFocused,setTaFocused]=useState(false);
  useEffect(()=>{
    const h=e=>setCalcHint({...e.detail});
    window.addEventListener("veridian:calcdata",h);
    if(_lead.annual>0)setCalcHint({..._lead});
    return()=>window.removeEventListener("veridian:calcdata",h);
  },[]);
  const sub=async e=>{
    e.preventDefault();
    if(!f.name.trim()||!f.email.trim()){setErr("Name and email are required.");return;}
    setLoading(true);setErr(null);
    const payload={...f};
    if(calcHint?.annual>0){payload.calcData={calls:calcHint.calls,miss:calcHint.miss,val:calcHint.val,conv:calcHint.conv,missedPerMonth:calcHint.missed,lostMonthly:calcHint.lostMo,recoveryMonthly:calcHint.recMo,annualPotential:calcHint.annual};}
    try{
      const r=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await r.json();
      if(!r.ok||!data.success)throw new Error(data.error||"Submission failed");
      setLeadId(data.leadId||null);setStep("success");track("contact_form_submit",{lead_id:data.leadId});
    }catch{setErr("Something went wrong — please try again or email us directly.");}
    setLoading(false);
  };
  const confirmBooking=async()=>{
    setBookingLoading(true);
    const payload={leadId,name:f.name,email:f.email,biz:f.biz,phone:f.phone};
    console.log("[confirmBooking] payload →",JSON.stringify(payload));
    let dbResult=null;
    try{
      const r=await fetch("/api/book",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      let data={};
      try{data=await r.json();}catch(e){console.warn("[confirmBooking] could not parse response JSON",e);}
      dbResult={http:r.status,bookingInserted:data.bookingInserted,bookingId:data.bookingId,bookingStatus:data.bookingStatus,bookingBody:data.bookingBody,error:data.error};
      console.log("[confirmBooking] response →",JSON.stringify(dbResult));
      if(!r.ok){
        console.error("[confirmBooking] HTTP error",r.status,data.error||"");
      }else if(data.bookingInserted!==true){
        console.error("[confirmBooking] NOT inserted — bookingStatus:",data.bookingStatus,"bookingBody:",data.bookingBody);
      }else{
        console.log("[confirmBooking] ✓ saved — bookingId:",data.bookingId);
      }
    }catch(err){
      console.error("[confirmBooking] network error",err?.message);
      dbResult={error:err?.message};
    }
    track("consultation_booked",{bookingId:dbResult?.bookingId,inserted:dbResult?.bookingInserted});
    setStep("booked");
    setBookingLoading(false);
  };
  const generatePlan=async()=>{
    setStep("plan");setPlanLoading(true);
    const ch=calcHint;
    const prompt=`Generate a revenue recovery plan for this service business.\nBusiness: ${f.biz||"Service business"}\nChallenge: ${f.challenge||"Missed calls and follow-up"}\n${ch?.annual>0?`Calculator:\n- Monthly calls: ${ch.calls}, Miss rate: ${ch.miss}%, Avg value: $${ch.val}, Conv: ${ch.conv}%\n- Missed/mo: ${ch.missed}, At risk: $${ch.lostMo}/mo, Recovery: $${ch.recMo}/mo, Annual: $${ch.annual}`:"No calculator data."}\n\nProvide the plan with EXACTLY these 4 headers:\n\nRECOMMENDED SERVICES\n[3 Veridian services specific to their situation]\n\nEXPECTED OUTCOMES\n[3 quantified outcomes using their numbers]\n\nESTIMATED RECOVERY POTENTIAL\n[Monthly, annual, per-call breakdown]\n\nNEXT STEPS\n[Day 1, Day 2-3, Day 4, Day 5+ timeline]\n\nUnder 350 words. Use their actual numbers. Revenue-focused only.`;
    try{
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:prompt}],system:"You are a revenue recovery specialist. Be specific, concise, use the client's actual numbers.",max_tokens:600})});
      const data=await r.json();setPlan(data.text||null);
    }catch{setPlan(null);}
    setPlanLoading(false);
  };
  return(
    <section id="contact" style={{padding:isMobile?"80px 24px":"120px 48px",background:W.surface}}>
      <div style={{maxWidth:1160,margin:"0 auto",display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:isMobile?48:80,alignItems:"start"}}>
        {/* Left — intro */}
        <div style={{paddingTop:isMobile?0:8}}>
          <SLabel>START YOUR RECOVERY PROGRAM</SLabel>
          <h2 style={{fontSize:isMobile?"34px":"52px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.06,marginBottom:20}}>
            Where is revenue<br/>slipping through?
          </h2>
          <p style={{fontSize:isMobile?"15px":"17px",color:W.textSub,lineHeight:1.72,marginBottom:36}}>Tell us about your business. We'll show you exactly what's being lost and how to recover it — at no cost, no obligation, in 30 minutes.</p>
          <div style={{display:"flex",flexDirection:"column",gap:16,marginBottom:40}}>
            {[{I:Clock,t:"Response within one business day"},{I:CheckCircle,t:"No obligation, no pressure"},{I:Shield,t:"Free revenue recovery consultation"}].map((p,i)=>{const Icon=p.I;return(
              <div key={i} style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{width:32,height:32,borderRadius:9,background:W.greenB,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon size={14} style={{color:W.green}}/></div>
                <span style={{fontSize:14,color:W.textSub}}>{p.t}</span>
              </div>
            );})}
          </div>
          <div style={{padding:"20px 24px",background:W.card,border:`1px solid ${W.border}`,borderRadius:14}}>
            <div style={{fontSize:11,fontWeight:700,color:W.textDim,letterSpacing:"0.08em",marginBottom:12}}>DIRECT LINE</div>
            <div style={{fontSize:13,color:W.textSub,marginBottom:4}}>Steve Smith · Managing Member</div>
            <a href="tel:+14074705992" style={{fontSize:16,fontWeight:700,color:W.text,textDecoration:"none",display:"block",marginBottom:14}}>(407) 470-5992</a>
            <div style={{fontSize:13,color:W.textSub,marginBottom:4}}>Skeeter · Director of Operations</div>
            <a href="tel:+16892485965" style={{fontSize:16,fontWeight:700,color:W.text,textDecoration:"none"}}>(689) 248-5965</a>
          </div>
        </div>
        {/* Right — form */}
        <div>
          {step==="form"&&(
            <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?24:40}}>
              {calcHint?.annual>0&&(
                <div style={{background:W.accentB,border:"1px solid rgba(99,102,241,0.2)",borderRadius:10,padding:"14px 18px",marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontSize:10,fontWeight:700,color:W.accent,letterSpacing:"0.08em",marginBottom:2}}>YOUR RECOVERY ESTIMATE</div><div style={{fontSize:12,color:W.textSub}}>From the calculator</div></div>
                  <div style={{fontSize:22,fontWeight:900,color:W.text}}>{fmtM(calcHint.annual)}<span style={{fontSize:11,color:W.textDim,fontWeight:400}}>/yr</span></div>
                </div>
              )}
              <form onSubmit={sub}>
                <div style={{display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:isMobile?0:16}}>
                  <FormField label="YOUR NAME" value={f.name} onChange={e=>setF(x=>({...x,name:e.target.value}))} placeholder="First and last name" autoComplete="name"/>
                  <FormField label="BUSINESS NAME" value={f.biz} onChange={e=>setF(x=>({...x,biz:e.target.value}))} placeholder="Company name" autoComplete="organization"/>
                </div>
                <div style={{display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:isMobile?0:16}}>
                  <FormField label="PHONE" value={f.phone} onChange={e=>setF(x=>({...x,phone:e.target.value}))} type="tel" placeholder="+1 (555) 000-0000" autoComplete="tel" inputMode="tel"/>
                  <FormField label="EMAIL" value={f.email} onChange={e=>setF(x=>({...x,email:e.target.value}))} type="email" placeholder="you@company.com" autoComplete="email"/>
                </div>
                <div style={{marginBottom:24}}>
                  <label style={{fontSize:11,fontWeight:700,color:W.textSub,display:"block",marginBottom:7,letterSpacing:"0.05em"}}>WHERE IS REVENUE SLIPPING THROUGH THE CRACKS?</label>
                  <textarea value={f.challenge} onChange={e=>setF(x=>({...x,challenge:e.target.value}))} onFocus={()=>setTaFocused(true)} onBlur={()=>setTaFocused(false)} placeholder="Missed calls, slow follow-up, lost appointments — tell us where the biggest gaps are..." rows={4} style={{width:"100%",background:W.surface,border:`1px solid ${taFocused?W.accent:W.border}`,borderRadius:9,padding:"12px 14px",color:W.text,fontSize:14,outline:"none",resize:"vertical",lineHeight:1.6,boxShadow:taFocused?`0 0 0 3px ${W.accentB}`:"none",transition:"border-color .15s"}}/>
                </div>
                {err&&<div style={{marginBottom:14,padding:"11px 14px",background:W.redB,border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,fontSize:13,color:W.red}}>{err}</div>}
                <button type="submit" disabled={loading} className="vd-btn" style={{width:"100%",background:W.accent,color:"#fff",border:"none",borderRadius:10,padding:16,fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,justifyContent:"center",boxShadow:`0 4px 20px ${W.accentGlow}`}}>
                  {loading?"Sending...":"Start Recovering Revenue"}
                </button>
              </form>
            </div>
          )}
          {step==="success"&&(
            <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?28:44,textAlign:"center"}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:W.greenB,border:`1px solid ${W.green}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}><CheckCircle size={24} style={{color:W.green}}/></div>
              <div style={{fontSize:20,fontWeight:800,color:W.text,marginBottom:8}}>You're on our radar.</div>
              <div style={{fontSize:14,color:W.textSub,lineHeight:1.65,marginBottom:24}}>We'll be in touch within one business day. Want to skip the wait?</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <button onClick={()=>setStep("booking")} className="vd-btn" style={{background:W.accent,color:"#fff",border:"none",borderRadius:10,padding:15,fontSize:14,fontWeight:700,cursor:"pointer",width:"100%",justifyContent:"center"}}>Book My Free Consultation</button>
                {calcHint?.annual>0&&<button onClick={generatePlan} style={{background:"none",border:`1px solid ${W.border}`,borderRadius:10,padding:13,fontSize:14,fontWeight:600,color:W.text,cursor:"pointer",width:"100%"}}>Generate My Recovery Plan</button>}
              </div>
            </div>
          )}
          {step==="booking"&&(
            <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?24:40}}>
              <div style={{textAlign:"center",marginBottom:28}}>
                <div style={{fontSize:18,fontWeight:800,color:W.text,marginBottom:6}}>Book Your Free Consultation</div>
                <div style={{fontSize:13,color:W.textSub}}>30 minutes — we'll review your numbers and build your recovery plan live.</div>
              </div>
              {BOOKING_URL?(
                <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer"
                  onClick={()=>track("booking_calendar_opened")}
                  className="vd-btn" style={{display:"flex",background:W.accent,color:"#fff",borderRadius:10,padding:16,fontSize:15,fontWeight:700,textDecoration:"none",justifyContent:"center",marginBottom:16,boxShadow:`0 4px 20px ${W.accentGlow}`}}>
                  Open Booking Calendar <ArrowRight size={15} style={{marginLeft:6}}/>
                </a>
              ):(
                <div style={{background:W.accentB,border:"1px solid rgba(99,102,241,0.2)",borderRadius:10,padding:"20px 24px",marginBottom:16,textAlign:"center"}}>
                  <div style={{fontSize:12,fontWeight:700,color:W.textSub,letterSpacing:"0.06em",marginBottom:10}}>CALL TO SCHEDULE</div>
                  <a href="tel:+14074705992" style={{fontSize:20,fontWeight:800,color:W.accent,textDecoration:"none",display:"block",marginBottom:4}}>(407) 470-5992</a>
                  <div style={{fontSize:12,color:W.textSub}}>Steve Smith · Managing Member</div>
                </div>
              )}
              <div style={{fontSize:12,color:W.textDim,textAlign:"center",marginBottom:14}}>Once you've selected a time, click below to confirm your spot.</div>
              <button onClick={confirmBooking} disabled={bookingLoading} className="vd-btn"
                style={{width:"100%",background:W.greenB,color:W.green,border:`1px solid rgba(16,185,129,0.3)`,borderRadius:10,padding:13,fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:10,justifyContent:"center"}}>
                {bookingLoading?"Confirming...":"✓ I've Booked My Consultation"}
              </button>
              <button onClick={()=>setStep("success")} style={{background:"none",border:"none",color:W.textDim,fontSize:13,cursor:"pointer",width:"100%",padding:8}}>← Back</button>
            </div>
          )}
          {step==="booked"&&(
            <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?28:44,textAlign:"center"}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:W.greenB,border:`1px solid ${W.green}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}><Calendar size={24} style={{color:W.green}}/></div>
              <div style={{fontSize:20,fontWeight:800,color:W.text,marginBottom:8}}>Consultation Confirmed</div>
              <div style={{fontSize:14,color:W.textSub,lineHeight:1.65,marginBottom:20,maxWidth:340,margin:"12px auto 20px"}}>Check your email for confirmation details. We'll send prep notes before the call so we arrive with your numbers ready.</div>
              {calcHint?.annual>0&&<button onClick={generatePlan} style={{background:"none",border:`1px solid ${W.border}`,borderRadius:10,padding:"12px 24px",fontSize:13,fontWeight:600,color:W.text,cursor:"pointer"}}>Generate My Recovery Plan While You Wait</button>}
            </div>
          )}
          {step==="plan"&&(
            <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?24:40}}>
              {planLoading?(
                <div style={{textAlign:"center",padding:"48px 0"}}>
                  <div style={{width:40,height:40,borderRadius:"50%",border:`3px solid ${W.accent}`,borderTopColor:"transparent",animation:"spin .7s linear infinite",margin:"0 auto 20px"}}/>
                  <div style={{fontSize:14,color:W.textSub}}>Generating your recovery plan...</div>
                </div>
              ):(
                <>
                  <div className="no-print" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
                    <div style={{fontSize:17,fontWeight:800,color:W.text}}>Your Revenue Recovery Plan</div>
                    <button onClick={()=>window.print()} style={{background:W.accentB,border:"1px solid rgba(99,102,241,0.22)",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,color:W.accent,cursor:"pointer"}}>Print / PDF</button>
                  </div>
                  {plan?(
                    <div className="print-plan" style={{fontSize:13,color:W.textSub,lineHeight:1.85,whiteSpace:"pre-wrap"}}>{plan}</div>
                  ):(
                    <div style={{padding:"28px 0",textAlign:"center"}}>
                      <div style={{fontSize:14,color:W.textSub,marginBottom:10}}>Your recovery plan is being prepared.</div>
                      <div style={{fontSize:12,color:W.textDim}}>We'll walk through it together on the consultation call.</div>
                    </div>
                  )}
                  <div style={{marginTop:24,paddingTop:18,borderTop:`1px solid ${W.border}`,display:"flex",gap:10}}>
                    <button onClick={()=>setStep("success")} style={{background:"none",border:`1px solid ${W.border}`,borderRadius:9,padding:"10px 18px",fontSize:13,fontWeight:600,color:W.textSub,cursor:"pointer"}}>← Back</button>
                    <button onClick={()=>setStep("booking")} className="vd-btn" style={{flex:1,background:W.accent,color:"#fff",border:"none",borderRadius:9,padding:10,fontSize:14,fontWeight:700,cursor:"pointer",justifyContent:"center"}}>Book a Consultation</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// HOMEPAGE COMPOSITION
// ─────────────────────────────────────────────────────────────
function Homepage({isMobile}){
  return(
    <>
      <Hero isMobile={isMobile}/>
      <BeforeAfter isMobile={isMobile}/>
      <Calculator isMobile={isMobile}/>
      <HowItWorks isMobile={isMobile}/>
      <ProgramOffer isMobile={isMobile}/>
      <Industries isMobile={isMobile}/>
      <Results isMobile={isMobile}/>
      <Trust isMobile={isMobile}/>
      <FAQ isMobile={isMobile}/>
      <Contact isMobile={isMobile}/>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// INDUSTRY CALCULATOR (used by IndustryPage)
// ─────────────────────────────────────────────────────────────
const INDUSTRY_DEFAULTS={
  "security":{calls:150,miss:35,val:8000,conv:25},
  "property-management":{calls:100,miss:40,val:2000,conv:35},
  "contractors":{calls:80,miss:45,val:5000,conv:30},
  "medical":{calls:200,miss:30,val:300,conv:60},
  "law":{calls:60,miss:40,val:15000,conv:20},
};
function IndustryCalculator({sector,isMobile}){
  const def=INDUSTRY_DEFAULTS[sector]||{calls:100,miss:30,val:1000,conv:35};
  const[calls,setCalls]=useState(def.calls);
  const[miss,setMiss]=useState(def.miss);
  const[val,setVal]=useState(def.val);
  const[conv,setConv]=useState(def.conv);
  const missed=Math.round(calls*miss/100);
  const opps=Math.round(missed*conv/100);
  const lostMo=opps*val;
  const recMo=Math.round(lostMo*0.68);
  const annual=recMo*12;
  const fmt$=n=>n>=1000?`$${(n/1000).toFixed(1)}K`:`$${n}`;
  const Sl=({label,value,set,min,max,step=1,fmt})=>(
    <div style={{marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
        <span style={{fontSize:13,color:W.textSub}}>{label}</span>
        <span style={{fontSize:13,fontWeight:700,color:W.text}}>{fmt(value)}</span>
      </div>
      <div style={{position:"relative",height:24,display:"flex",alignItems:"center"}}>
        <div style={{position:"absolute",left:0,right:0,height:4,background:W.border,borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${((value-min)/(max-min))*100}%`,background:W.accent,borderRadius:2}}/>
        </div>
        <input type="range" min={min} max={max} step={step} value={value} onChange={e=>set(Number(e.target.value))} style={{position:"absolute",inset:0,opacity:0,width:"100%",cursor:"pointer",height:"100%"}}/>
      </div>
    </div>
  );
  return(
    <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:16,padding:isMobile?24:36,marginBottom:48}}>
      <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.08em",marginBottom:20}}>YOUR RECOVERY ESTIMATE</div>
      <div style={{display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:isMobile?0:32,alignItems:"start"}}>
        <div>
          <Sl label="Monthly incoming calls" value={calls} set={setCalls} min={20} max={2000} step={10} fmt={v=>v.toLocaleString()}/>
          <Sl label="Missed call rate" value={miss} set={setMiss} min={5} max={70} fmt={v=>`${v}%`}/>
          <Sl label="Average customer value" value={val} set={setVal} min={100} max={50000} step={100} fmt={v=>`$${v.toLocaleString()}`}/>
          <Sl label="Lead-to-customer conversion" value={conv} set={setConv} min={5} max={80} fmt={v=>`${v}%`}/>
        </div>
        <div>
          <div style={{background:"linear-gradient(135deg,rgba(99,102,241,0.12),rgba(99,102,241,0.04))",border:"1px solid rgba(99,102,241,0.26)",borderRadius:14,padding:isMobile?20:28,textAlign:"center",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:8}}>ANNUAL RECOVERY POTENTIAL</div>
            <div style={{fontSize:isMobile?"40px":"52px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1}}>{fmt$(annual)}</div>
            <div style={{fontSize:12,color:W.textSub,marginTop:8}}>recoverable with Veridian</div>
          </div>
          {[{l:"Missed calls/month",v:missed.toLocaleString()},{l:"Revenue lost monthly",v:fmt$(lostMo),c:W.red},{l:"Recovery potential (68%)",v:fmt$(recMo),c:W.green}].map((r,i)=>(
            <div key={i} style={{background:W.surface,border:`1px solid ${W.border}`,borderRadius:10,padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:12,color:W.textSub}}>{r.l}</span>
              <span style={{fontSize:15,fontWeight:800,color:r.c||W.text}}>{r.v}</span>
            </div>
          ))}
          <a href="/#contact" onClick={()=>{Object.assign(_lead,{calls,miss,val,conv,missed,lostMo,recMo,annual});window.dispatchEvent(new CustomEvent("veridian:calcdata",{detail:{..._lead}}));}} className="vd-btn" style={{display:"block",background:W.accent,color:"#fff",padding:14,borderRadius:10,fontSize:14,fontWeight:700,textDecoration:"none",textAlign:"center",marginTop:14,justifyContent:"center"}}>Get My Recovery Plan</a>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// INDUSTRY DATA
// ─────────────────────────────────────────────────────────────
const INDUSTRY_DATA={
  "security":{
    name:"Security Companies",
    headline:"Stop Losing Patrol Contracts to Competitors Who Answer First",
    problem:"Every missed call from a prospect could be a multi-year patrol contract walking to a competitor. Security buyers call multiple companies — the first to respond almost always wins the bid.",
    loss:"The average commercial security contract is worth $3,500–$18,000 per year. Losing even two bids per month to unanswered calls represents $84,000 or more in annual revenue loss.",
    solution:"Veridian answers every prospect call, collects their property details, and schedules a site assessment — even when your team is on patrol or unavailable. Every lead gets an immediate, professional response.",
    roi:"Security companies using Veridian recover an average of 68% of calls that previously went unanswered — with no additional headcount.",
    outcomes:["Immediate response to every inquiry — 24/7","Site assessment scheduling without dispatcher involvement","Patrol bid follow-up and re-engagement","Existing client service request capture"],
  },
  "property-management":{
    name:"Property Management",
    headline:"Answer Every Maintenance Call and Tenant Inquiry — Without Exception",
    problem:"Property managers handle hundreds of inbound calls daily — maintenance requests, lease inquiries, showings, and complaints. After hours, on weekends, or when staff is overwhelmed, calls go to voicemail. Tenants don't leave voicemails. They leave.",
    loss:"A single tenant vacancy costs an average of $1,750 per month in lost rent, plus turnover costs. Poor responsiveness is the leading driver of tenant non-renewal.",
    solution:"Veridian captures every after-hours maintenance request, qualifies showing inquiries, and routes urgent calls immediately — reducing tenant frustration and accelerating lease conversions.",
    roi:"Property management companies report 40% fewer tenant complaints and faster lease-up rates after implementing Veridian's recovery program.",
    outcomes:["24/7 maintenance request capture and routing","Showing scheduling without staff involvement","Tenant inquiry qualification","Urgency-based call routing"],
  },
  "contractors":{
    name:"Contractors",
    headline:"Win More Bids By Being the First Company to Respond",
    problem:"When you're on a job site, your phone rings — and you can't answer it. That caller is looking for a quote. If you don't respond within minutes, they're calling the next contractor on the list.",
    loss:"The average residential service contract is worth $2,500–$12,000. A contractor missing 8 calls per month at a 40% close rate is leaving $96,000 or more per year on the table.",
    solution:"Veridian responds to every missed call within 60 seconds, collects job details, and schedules estimate appointments directly to your calendar — while you're still on the jobsite.",
    roi:"Contractors using Veridian report winning 2–4 additional jobs per month from inquiries that previously went unanswered.",
    outcomes:["Instant response while you're on the job","Estimate scheduling without phone tag","Job type qualification","Quote request follow-up sequences"],
  },
  "medical":{
    name:"Medical Practices",
    headline:"Fill Every Appointment Slot With Patients Who Called and Couldn't Get Through",
    problem:"Patients who can't reach your front desk don't wait. They search for the next available provider. Empty appointment slots from missed calls represent direct, measurable revenue loss every single day.",
    loss:"A single missed new patient call represents $200–$800 in lost revenue — plus the lifetime value of a recurring patient relationship. At 10 missed calls per week, that's $4,000–$16,000 monthly.",
    solution:"Veridian captures every patient inquiry, schedules appointments, handles appointment reminders, and re-engages no-shows — without adding front desk workload.",
    roi:"Medical practices using Veridian fill an average of 12 additional appointment slots per month from previously unanswered calls.",
    outcomes:["24/7 appointment scheduling","New patient inquiry capture","Appointment reminders and confirmation","No-show re-engagement sequences"],
  },
  "law":{
    name:"Law Firms",
    headline:"Capture Every Potential Client Before They Call the Next Firm",
    problem:"People searching for legal representation call 2–3 firms and retain the first one that responds professionally. If a potential client reaches your voicemail, the probability of them waiting for a callback is less than 25%.",
    loss:"The average retained client is worth $5,000–$50,000 in legal fees depending on practice area. Missing just one retained client per month represents significant annual revenue loss.",
    solution:"Veridian answers every incoming call, conducts a professional intake, and schedules a consultation — presenting your firm as responsive and ready to help from the first interaction.",
    roi:"Law firms using Veridian report a 45% increase in consultation bookings from the same call volume — without hiring additional intake staff.",
    outcomes:["24/7 professional client intake","Consultation scheduling without receptionist","Practice area qualification","Follow-up for unscheduled inquiries"],
  },
};

// ─────────────────────────────────────────────────────────────
// INDUSTRY PAGE
// ─────────────────────────────────────────────────────────────
function IndustryPage({sector,isMobile}){
  const d=INDUSTRY_DATA[sector];
  if(!d)return<div style={{minHeight:"100vh",background:W.bg,display:"flex",alignItems:"center",justifyContent:"center",paddingTop:80}}><div style={{textAlign:"center"}}><div style={{fontSize:18,color:W.textSub,marginBottom:16}}>Industry not found.</div><a href="/" style={{color:W.accent,textDecoration:"none"}}>← Back to home</a></div></div>;
  const siblings=Object.entries(INDUSTRY_DATA).filter(([k])=>k!==sector);
  return(
    <div style={{minHeight:"100vh",background:W.bg}}>
      <section style={{padding:isMobile?"120px 24px 64px":"150px 48px 80px",background:W.surface,borderBottom:`1px solid ${W.border}`}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{marginBottom:20}}><a href="/" style={{fontSize:12,color:W.textSub,textDecoration:"none"}}>Home</a><span style={{color:W.textDim,margin:"0 8px"}}>/</span><a href="/#industries" style={{fontSize:12,color:W.textSub,textDecoration:"none"}}>Industries</a><span style={{color:W.textDim,margin:"0 8px"}}>/</span><span style={{fontSize:12,color:W.textDim}}>{d.name}</span></div>
          <SLabel>{d.name.toUpperCase()}</SLabel>
          <h1 style={{fontSize:isMobile?"34px":"60px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.05,marginBottom:24}}>{d.headline}</h1>
          <p style={{fontSize:isMobile?"16px":"19px",color:W.textSub,lineHeight:1.7,maxWidth:700}}>{d.problem}</p>
        </div>
      </section>
      <div style={{maxWidth:1000,margin:"0 auto",padding:isMobile?"40px 24px":"80px 48px"}}>
        <div style={{background:W.redB,border:"1px solid rgba(239,68,68,0.18)",borderRadius:16,padding:isMobile?24:36,marginBottom:48}}>
          <div style={{fontSize:11,fontWeight:700,color:W.red,letterSpacing:"0.08em",marginBottom:12}}>REVENUE AT RISK</div>
          <p style={{fontSize:isMobile?"15px":"18px",color:W.text,lineHeight:1.7}}>{d.loss}</p>
        </div>
        <IndustryCalculator sector={sector} isMobile={isMobile}/>
        <div style={{marginBottom:48}}>
          <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.08em",marginBottom:16}}>THE VERIDIAN SOLUTION</div>
          <p style={{fontSize:isMobile?"16px":"18px",color:W.textSub,lineHeight:1.75,marginBottom:28}}>{d.solution}</p>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
            {d.outcomes.map((o,i)=>(
              <div key={i} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:12,padding:"16px 20px",display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:W.greenB,border:"1px solid rgba(16,185,129,0.25)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}><Check size={11} style={{color:W.green}}/></div>
                <span style={{fontSize:13,color:W.textSub,lineHeight:1.5}}>{o}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{background:"linear-gradient(135deg,rgba(16,185,129,0.08),rgba(16,185,129,0.03))",border:"1px solid rgba(16,185,129,0.22)",borderRadius:16,padding:isMobile?24:36,marginBottom:64,textAlign:"center"}}>
          <div style={{fontSize:11,fontWeight:700,color:W.green,letterSpacing:"0.08em",marginBottom:12}}>RESULTS</div>
          <p style={{fontSize:isMobile?"17px":"20px",color:W.text,lineHeight:1.65,fontWeight:500}}>{d.roi}</p>
        </div>
        <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?28:44,textAlign:"center",marginBottom:64}}>
          <div style={{fontSize:20,fontWeight:800,color:W.text,marginBottom:12}}>Ready to recover your revenue?</div>
          <p style={{fontSize:15,color:W.textSub,marginBottom:28}}>See exactly what Veridian recovers for {d.name.toLowerCase()}.</p>
          <a href="/#contact" className="vd-btn" style={{background:W.accent,color:"#fff",padding:"15px 32px",borderRadius:10,fontSize:15,fontWeight:700,marginRight:12}}>Get Started</a>
          <a href="/#calculator" className="vd-ghost" style={{background:"none",border:`1.5px solid ${W.border}`,color:W.text,padding:"14px 30px",borderRadius:10,fontSize:15,fontWeight:600}}>Calculate My Recovery</a>
        </div>
        <div style={{fontSize:11,fontWeight:700,color:W.textDim,letterSpacing:"0.1em",marginBottom:20}}>OTHER INDUSTRIES</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:14}}>
          {siblings.map(([k,v])=>(
            <a key={k} href={`/industries/${k}`} className="vd-card" style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:12,padding:"16px 20px",textDecoration:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:14,fontWeight:600,color:W.text}}>{v.name}</span>
              <ChevronRight size={16} style={{color:W.textDim}}/>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REVENUE DASHBOARD (internal — /dashboard)
// ─────────────────────────────────────────────────────────────
function DashboardPage(){
  const[pin,setPin]=useState("");
  const[authed,setAuthed]=useState(false);
  const[leads,setLeads]=useState([]);
  const[configured,setConfigured]=useState(true);
  const[fetching,setFetching]=useState(false);
  const[authErr,setAuthErr]=useState(null);
  const[fuStats,setFuStats]=useState(null);
  const[updatingId,setUpdatingId]=useState(null);
  const fetchLeads=async(p)=>{
    const r=await fetch("/api/leads",{headers:{Authorization:`Bearer ${p}`}});
    if(r.status===401)return null;
    const data=await r.json();
    setLeads(data.leads||[]);setConfigured(data.configured!==false);return data;
  };
  const fetchFuStats=async(p)=>{
    try{const r=await fetch("/api/follow-up",{headers:{Authorization:`Bearer ${p}`}});if(r.ok){const d=await r.json();setFuStats(d.stats||null);}}catch{}
  };
  const tryAuth=async e=>{
    e.preventDefault();setFetching(true);setAuthErr(null);
    const data=await fetchLeads(pin);
    if(!data){setAuthErr("Incorrect PIN.");setFetching(false);return;}
    setAuthed(true);setFetching(false);fetchFuStats(pin);
  };
  const refresh=async()=>{await fetchLeads(pin);fetchFuStats(pin);};
  const updateStatus=async(leadId,action,value)=>{
    setUpdatingId(leadId);
    await fetch("/api/leads",{method:"PATCH",headers:{Authorization:`Bearer ${pin}`,"Content-Type":"application/json"},body:JSON.stringify({leadId,action,value})});
    await fetchLeads(pin);setUpdatingId(null);
  };
  const total=leads.length;
  const hot=leads.filter(l=>l.priority==="HOT").length;
  const high=leads.filter(l=>l.priority==="HIGH").length;
  const pipeline=leads.reduce((s,l)=>s+(l.calcData?.annualPotential||0),0);
  const appointments=leads.filter(l=>l.booked).length;
  const proposals=leads.filter(l=>l.proposalSent).length;
  const won=leads.filter(l=>l.clientWon).length;
  const monthlyRevenue=leads.filter(l=>l.clientWon&&l.monthlyRevenue).reduce((s,l)=>s+l.monthlyRevenue,0);
  const avgRecovery=total>0?Math.round(pipeline/total):0;
  const PC={HOT:W.red,HIGH:W.amber,MEDIUM:W.accent,LOW:W.textDim,STANDARD:W.textDim};
  if(!authed)return(
    <div style={{minHeight:"100vh",background:W.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 24px"}}>
      <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:40,width:"100%",maxWidth:360,textAlign:"center"}}>
        <div style={{width:48,height:48,borderRadius:"50%",background:W.accentB,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}><Lock size={20} style={{color:W.accent}}/></div>
        <div style={{fontSize:18,fontWeight:800,color:W.text,marginBottom:6}}>Command Center</div>
        <div style={{fontSize:13,color:W.textSub,marginBottom:28}}>Revenue Operations — PIN Required</div>
        <form onSubmit={tryAuth}>
          <input type="password" value={pin} onChange={e=>setPin(e.target.value)} placeholder="PIN" style={{width:"100%",background:W.surface,border:`1px solid ${W.border}`,borderRadius:8,padding:"12px 14px",color:W.text,fontSize:18,outline:"none",marginBottom:12,textAlign:"center",letterSpacing:"0.3em"}}/>
          {authErr&&<div style={{fontSize:12,color:W.red,marginBottom:10}}>{authErr}</div>}
          <button type="submit" disabled={fetching} className="vd-btn" style={{width:"100%",background:W.accent,color:"#fff",border:"none",borderRadius:9,padding:13,fontSize:14,fontWeight:700,cursor:"pointer",justifyContent:"center"}}>{fetching?"Connecting...":"Access Command Center"}</button>
        </form>
        <div style={{marginTop:20,fontSize:11,color:W.textDim}}>Set DASH_PIN in Vercel env vars (default: 0000)</div>
      </div>
    </div>
  );
  const metrics=[
    {l:"Total Leads",v:total,sub:"All time"},
    {l:"HOT Leads",v:hot,sub:"Immediate priority",c:W.red},
    {l:"HIGH Leads",v:high,sub:"Respond today",c:W.amber},
    {l:"Appointments",v:appointments,sub:"Booked consultations",c:W.green},
    {l:"Proposals Sent",v:proposals,sub:"In evaluation"},
    {l:"Clients Won",v:won,sub:"Closed",c:W.green},
    {l:"Revenue Pipeline",v:pipeline>=1000?`$${(pipeline/1000).toFixed(0)}K`:`$${pipeline}`,sub:"Annual recovery potential"},
    {l:"Avg Recovery",v:avgRecovery>=1000?`$${(avgRecovery/1000).toFixed(1)}K`:`$${avgRecovery}`,sub:"Per lead"},
    {l:"Monthly Revenue",v:monthlyRevenue>0?`$${monthlyRevenue.toLocaleString()}/mo`:"—",sub:"From won clients",c:monthlyRevenue>0?W.green:undefined},
  ];
  return(
    <div style={{minHeight:"100vh",background:W.bg,paddingTop:80}}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"40px 24px 80px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:32}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:4}}>VERIDIAN</div>
            <div style={{fontSize:24,fontWeight:900,color:W.text,letterSpacing:"-0.03em"}}>Revenue Command Center</div>
          </div>
          <button onClick={refresh} style={{background:W.accentB,border:"1px solid rgba(99,102,241,0.22)",borderRadius:9,padding:"9px 18px",fontSize:13,fontWeight:600,color:W.accent,cursor:"pointer"}}>Refresh</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}}>
          {metrics.map((m,i)=>(
            <div key={i} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:14,padding:22}}>
              <div style={{fontSize:10,color:W.textDim,fontWeight:700,letterSpacing:"0.06em",marginBottom:8}}>{m.l.toUpperCase()}</div>
              <div style={{fontSize:30,fontWeight:900,color:m.c||W.text,letterSpacing:"-0.03em",lineHeight:1,marginBottom:4}}>{m.v}</div>
              <div style={{fontSize:11,color:W.textDim}}>{m.sub}</div>
            </div>
          ))}
        </div>
        {fuStats&&(
          <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:14,padding:20,marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.06em",marginBottom:14}}>FOLLOW-UP QUEUE</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
              {fuStats.map(s=>(
                <div key={s.sequence} style={{textAlign:"center"}}>
                  <div style={{fontSize:11,color:W.textDim,marginBottom:4}}>{s.sequence.toUpperCase()}</div>
                  <div style={{fontSize:20,fontWeight:800,color:s.due>0?W.amber:W.text}}>{s.queued}</div>
                  {s.due>0&&<div style={{fontSize:10,color:W.amber}}>{s.due} due</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:16,overflow:"hidden"}}>
          <div style={{padding:"16px 24px",borderBottom:`1px solid ${W.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:14,fontWeight:700,color:W.text}}>Lead Pipeline</div>
            <div style={{fontSize:12,color:W.textDim}}>{total} leads</div>
          </div>
          {leads.length===0?(
            <div style={{padding:"40px 24px",textAlign:"center"}}>
              <div style={{fontSize:14,color:W.textSub,marginBottom:8}}>{configured?"No leads yet.":"Vercel KV not configured."}</div>
              <div style={{fontSize:12,color:W.textDim,lineHeight:1.7,whiteSpace:"pre-line"}}>{configured?"Leads appear here after contact form submissions.":"Add Vercel KV: Dashboard → Storage → Create KV Database → Connect to project.\nSet KV_REST_API_URL + KV_REST_API_TOKEN in env vars."}</div>
            </div>
          ):(
            leads.map((l,i)=>(
              <div key={l.leadId||i} style={{padding:"14px 24px",borderBottom:i<leads.length-1?`1px solid ${W.border}`:"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:l.leadId?6:0}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:W.text,marginBottom:1}}>{l.contact?.name||"Unknown"}</div>
                    <div style={{fontSize:12,color:W.textSub}}>{l.contact?.business||l.contact?.email||""}</div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                    {l.clientWon&&<span style={{fontSize:10,color:W.green,fontWeight:700,background:W.greenB,padding:"2px 6px",borderRadius:4}}>WON</span>}
                    {l.proposalSent&&!l.clientWon&&<span style={{fontSize:10,color:W.amber,fontWeight:700,padding:"2px 6px",borderRadius:4,background:W.amberB}}>PROPOSAL</span>}
                    {l.booked&&<span style={{fontSize:10,color:W.accent,fontWeight:600}}>Booked</span>}
                    {l.calcData?.annualPotential>0&&<div style={{fontSize:12,fontWeight:700,color:W.green}}>{fmtM(l.calcData.annualPotential)}/yr</div>}
                    <span style={{fontSize:10,fontWeight:700,color:PC[l.priority]||W.textDim,border:`1px solid ${PC[l.priority]||W.border}`,borderRadius:4,padding:"2px 7px"}}>{l.priority||"NEW"}</span>
                    <div style={{fontSize:10,color:W.textDim}}>{l.timestamp?new Date(l.timestamp).toLocaleDateString():"—"}</div>
                  </div>
                </div>
                {l.leadId&&(
                  <div style={{display:"flex",gap:6,marginTop:4}}>
                    {!l.proposalSent&&<button onClick={()=>updateStatus(l.leadId,"proposal")} disabled={updatingId===l.leadId} style={{background:"none",border:`1px solid ${W.border}`,borderRadius:6,padding:"3px 10px",fontSize:11,color:W.textSub,cursor:"pointer"}}>Proposal Sent</button>}
                    {!l.clientWon&&<button onClick={()=>{const rev=prompt("Monthly revenue from this client ($):","");if(rev)updateStatus(l.leadId,"won",rev);}} disabled={updatingId===l.leadId} style={{background:"none",border:`1px solid ${W.green}`,borderRadius:6,padding:"3px 10px",fontSize:11,color:W.green,cursor:"pointer"}}>Mark Won</button>}
                    {l.clientWon&&<button onClick={()=>updateStatus(l.leadId,"unmark_won")} disabled={updatingId===l.leadId} style={{background:"none",border:`1px solid ${W.textDim}`,borderRadius:6,padding:"3px 10px",fontSize:11,color:W.textDim,cursor:"pointer"}}>Unmark Won</button>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        {!configured&&(
          <div style={{background:W.accentB,border:"1px solid rgba(99,102,241,0.18)",borderRadius:14,padding:22,marginTop:18}}>
            <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.06em",marginBottom:10}}>SETUP REQUIRED</div>
            <div style={{fontSize:13,color:W.textSub,lineHeight:1.8}}>
              1. Vercel Dashboard → Storage → Create KV Database → Connect project (auto-sets KV_REST_API_URL + KV_REST_API_TOKEN)<br/>
              2. Set DASH_PIN, RESEND_API_KEY, TEAM_EMAIL, FROM_DOMAIN in Vercel env vars<br/>
              3. Set CRON_SECRET — Vercel Cron sends follow-ups daily at 9 AM UTC (Vercel Pro required)<br/>
              4. Set GOHIGHLEVEL_API_KEY + GOHIGHLEVEL_LOCATION_ID for CRM sync<br/>
              5. Optional: ANTHROPIC_API_KEY for AI recovery plan generation
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WEBSITE ROUTING
// ─────────────────────────────────────────────────────────────
export default function Website(){
  const[isMobile,setIsMobile]=useState(window.innerWidth<768);
  const path=window.location.pathname;
  useEffect(()=>{
    const style=document.createElement("style");
    style.textContent=WCSS;
    document.head.appendChild(style);
    const onR=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener("resize",onR,{passive:true});
    return()=>window.removeEventListener("resize",onR);
  },[]);
  useEffect(()=>{
    if(path.startsWith("/industries/")){
      const sector=path.replace("/industries/","");
      const d=INDUSTRY_DATA[sector];
      document.title=d?`${d.name} — Veridian`:"Industries — Veridian";
    }else if(path==="/dashboard"){
      document.title="Command Center — Veridian";
    }else{
      document.title="Veridian — Turn Missed Calls Into Revenue";
    }
  },[path]);
  const sector=path.startsWith("/industries/")?path.replace("/industries/",""):null;
  return(
    <div style={{background:W.bg,color:W.text,minHeight:"100vh",paddingBottom:isMobile?80:0}}>
      <WebNav isMobile={isMobile}/>
      {sector&&<IndustryPage sector={sector} isMobile={isMobile}/>}
      {path==="/dashboard"&&<DashboardPage/>}
      {!sector&&path!=="/dashboard"&&<Homepage isMobile={isMobile}/>}
      {!sector&&path!=="/dashboard"&&<WebFooter isMobile={isMobile}/>}
      {isMobile&&<StickyMobileCTA/>}
    </div>
  );
}
