import React,{useState,useEffect,useRef}from"react";
import{Phone,MessageSquare,Calendar,CheckCircle,X,Menu,ChevronDown,Shield,Clock,Users,Globe,Award,Zap,ArrowRight,ChevronRight,Lock,Check,Building2,Briefcase,FileText,HeartHandshake,HelpCircle}from"lucide-react";

const W={
  bg:"#050509",bgAlt:"#09091A",card:"#0D0D1E",cardH:"#111124",
  border:"#18182E",borderH:"#232342",
  accent:"#6366F1",accentH:"#4F46E5",accentB:"rgba(99,102,241,0.1)",accentGlow:"rgba(99,102,241,0.16)",
  green:"#10B981",greenB:"rgba(16,185,129,0.1)",
  red:"#EF4444",redB:"rgba(239,68,68,0.1)",
  amber:"#F59E0B",
  text:"#F1F5F9",textSub:"#8892A6",textDim:"#424F62",
};

const WCSS=`*{box-sizing:border-box;margin:0;padding:0;}body{background:#050509;color:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;}::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:#18182E;border-radius:2px;}html{scroll-behavior:smooth;}input,textarea{font-family:inherit;}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}@keyframes glow{0%,100%{box-shadow:0 0 40px rgba(99,102,241,0.06)}50%{box-shadow:0 0 80px rgba(99,102,241,0.18)}}@keyframes slideR{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}@keyframes stickIn{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}.vd-btn{transition:all 0.15s ease;}.vd-btn:hover{opacity:0.86;transform:translateY(-1px);}.vd-ghost{transition:all 0.15s ease;}.vd-ghost:hover{border-color:#6366F1!important;color:#6366F1!important;}.vd-nl:hover{color:#F1F5F9!important;}.vd-card{transition:all 0.22s ease;}.vd-card:hover{border-color:#232342!important;transform:translateY(-3px);}.vd-lk{transition:color 0.15s;}.vd-lk:hover{color:#6366F1!important;}.vd-sticky{position:fixed;bottom:0;left:0;right:0;z-index:150;padding:12px 16px 16px;background:rgba(5,5,9,0.97);border-top:1px solid #18182E;backdrop-filter:blur(20px);animation:stickIn 0.3s ease;}.vd-ind-pill{transition:all 0.15s ease;}.vd-ind-pill:hover{border-color:#6366F1!important;color:#6366F1!important;background:rgba(99,102,241,0.08)!important;}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@media print{*{background:#fff!important;color:#000!important;border-color:#ddd!important;}nav,footer,.vd-sticky,.vd-no-print{display:none!important;}.vd-print-plan{padding:40px!important;max-width:700px!important;margin:0 auto!important;}}`;

const fmtN=v=>v.toLocaleString();
const fmtM=n=>n>=1000?`$${(n/1000).toFixed(1)}K`:`$${n}`;

// Shared lead state — populated by calculators, consumed by Contact form
const _lead={};

function getSlots(){
  const s=[];const d=new Date();const labels=["10:00 AM","2:00 PM","4:00 PM"];
  while(s.length<9){d.setDate(d.getDate()+1);const day=d.getDay();if(day!==0&&day!==6){const ds=d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});labels.forEach(t=>s.push({date:ds,time:t,id:`${d.toISOString().slice(0,10)}_${t.replace(/[: ]/g,"")}`}));}}
  return s;
}

// ── Sticky Mobile CTA ─────────────────────────────────────────────
function StickyMobileCTA(){
  const[show,setShow]=useState(false);
  useEffect(()=>{
    const h=()=>{
      const y=window.scrollY;
      const contact=document.getElementById("contact");
      const contactY=contact?contact.getBoundingClientRect().top+window.scrollY-200:Infinity;
      setShow(y>400&&y<contactY);
    };
    window.addEventListener("scroll",h,{passive:true});
    return()=>window.removeEventListener("scroll",h);
  },[]);
  if(!show)return null;
  return(
    <div className="vd-sticky" style={{display:"flex",gap:10}}>
      <a href="#calculator" className="vd-btn" style={{flex:1,background:W.accent,color:"#fff",padding:"13px",borderRadius:10,fontSize:14,fontWeight:700,textDecoration:"none",textAlign:"center"}}>Calculate Lost Revenue</a>
      <a href="#contact" className="vd-btn" style={{background:W.card,border:`1px solid ${W.border}`,color:W.text,padding:"13px 18px",borderRadius:10,fontSize:14,fontWeight:600,textDecoration:"none",textAlign:"center"}}>Talk to Us</a>
    </div>
  );
}

// ── Shared Nav ───────────────────────────────────────────────────
function WebNav({isMobile,page="home"}){
  const[scrolled,setScrolled]=useState(false);
  const[open,setOpen]=useState(false);
  useEffect(()=>{
    const h=()=>setScrolled(window.scrollY>50);
    window.addEventListener("scroll",h,{passive:true});
    return()=>window.removeEventListener("scroll",h);
  },[]);
  const mobileLinks=[{l:"Solutions",h:"/#solutions"},{l:"Interactive Demo",h:"/#demo"},{l:"Revenue Calculator",h:"/#calculator"},{l:"Enterprise",h:"/enterprise"},{l:"Contact",h:"/#contact"}];
  return(
    <>
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:200,padding:isMobile?"14px 20px":"16px 56px",display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all 0.2s ease",background:scrolled?"rgba(5,5,9,0.97)":W.bg,borderBottom:scrolled?`1px solid ${W.border}`:"1px solid transparent",backdropFilter:scrolled?"blur(20px)":"none"}}>
        <a href="/" style={{textDecoration:"none",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,background:W.accent,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{color:"#fff",fontWeight:900,fontSize:15,letterSpacing:"-0.04em"}}>V</span>
          </div>
          <div>
              <div style={{fontSize:17,fontWeight:800,color:W.text,letterSpacing:"-0.025em",lineHeight:1.1}}>Veridian</div>
              <div style={{fontSize:9,fontWeight:700,color:W.accent,letterSpacing:"0.08em"}}>RISK & RESILIENCE GROUP</div>
            </div>
        </a>
        {!isMobile&&(
          <div style={{display:"flex",gap:28,alignItems:"center"}}>
            <a href="/#solutions" className="vd-nl" style={{color:W.textSub,fontSize:14,fontWeight:500,textDecoration:"none",transition:"color 0.15s"}}>Solutions</a>
            <a href="/#demo" className="vd-nl" style={{color:W.textSub,fontSize:14,fontWeight:500,textDecoration:"none",transition:"color 0.15s"}}>Interactive Demo</a>
            <a href="/#calculator" className="vd-nl" style={{color:W.textSub,fontSize:14,fontWeight:500,textDecoration:"none",transition:"color 0.15s"}}>Revenue Calculator</a>
            <a href="/enterprise" className="vd-nl" style={{color:W.textSub,fontSize:14,fontWeight:500,textDecoration:"none",transition:"color 0.15s"}}>Enterprise</a>
            <a href="/#contact" className="vd-nl" style={{color:W.textSub,fontSize:14,fontWeight:500,textDecoration:"none",transition:"color 0.15s"}}>Contact</a>
          </div>
        )}
        {!isMobile&&<a href="/#contact" className="vd-btn" style={{background:W.accent,color:"#fff",padding:"10px 22px",borderRadius:9,fontSize:14,fontWeight:600,textDecoration:"none"}}>Book Consultation</a>}
        {isMobile&&<button onClick={()=>setOpen(true)} style={{background:"none",border:`1px solid ${W.border}`,borderRadius:8,padding:"8px 11px",color:W.text,cursor:"pointer",display:"flex"}}><Menu size={18}/></button>}
      </nav>
      {isMobile&&open&&(
        <div style={{position:"fixed",inset:0,zIndex:300,background:W.bg,display:"flex",flexDirection:"column",padding:"20px 24px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:56}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,background:W.accent,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontWeight:900,fontSize:15}}>V</span></div>
              <div><div style={{fontSize:17,fontWeight:800,color:W.text,lineHeight:1.1}}>Veridian</div><div style={{fontSize:9,fontWeight:700,color:W.accent,letterSpacing:"0.08em"}}>RISK & RESILIENCE GROUP</div></div>
            </div>
            <button onClick={()=>setOpen(false)} style={{background:"none",border:`1px solid ${W.border}`,borderRadius:8,padding:"8px 11px",color:W.textSub,cursor:"pointer"}}><X size={18}/></button>
          </div>
          <div style={{flex:1}}>
            {mobileLinks.map(l=><a key={l.l} href={l.h} onClick={()=>setOpen(false)} style={{display:"block",fontSize:28,fontWeight:700,color:W.text,textDecoration:"none",padding:"20px 0",borderBottom:`1px solid ${W.border}`}}>{l.l}</a>)}
          </div>
          <a href="/#contact" onClick={()=>setOpen(false)} className="vd-btn" style={{display:"block",background:W.accent,color:"#fff",padding:"18px",borderRadius:12,fontSize:16,fontWeight:700,textDecoration:"none",textAlign:"center",marginTop:40}}>Book Consultation</a>
        </div>
      )}
    </>
  );
}

// ── Shared Footer ─────────────────────────────────────────────────
function WebFooter({isMobile}){
  return(
    <footer style={{borderTop:`1px solid ${W.border}`,padding:isMobile?"28px 24px":"36px 56px",background:W.bgAlt}}>
      <div style={{maxWidth:1200,margin:"0 auto",display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr auto 1fr",gap:isMobile?20:0,alignItems:"center"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <div style={{width:26,height:26,background:W.accent,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontWeight:900,fontSize:13}}>V</span></div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:W.text,lineHeight:1.1}}>Veridian</div>
              <div style={{fontSize:9,fontWeight:700,color:W.accent,letterSpacing:"0.07em"}}>RISK & RESILIENCE GROUP</div>
            </div>
          </div>
          <div style={{fontSize:12,color:W.textDim,marginTop:6}}>Sanford, Florida 32773</div>
          <div style={{fontSize:12,color:W.textDim}}>Serving Nationwide</div>
        </div>
        <div style={{textAlign:"center",display:"flex",flexDirection:"column",gap:3}}>
          <div style={{fontSize:10,fontWeight:700,color:W.textDim,letterSpacing:"0.08em",marginBottom:6}}>CONTACT</div>
          <div style={{fontSize:11,color:W.textDim}}>Steve Smith — Managing Member</div>
          <a href="tel:+14074705992" className="vd-lk" style={{fontSize:13,fontWeight:600,color:W.text,textDecoration:"none"}}>(407) 470-5992</a>
          <div style={{fontSize:11,color:W.textDim,marginTop:6}}>Skeeter — Director of Operations</div>
          <a href="tel:+16892485965" className="vd-lk" style={{fontSize:13,fontWeight:600,color:W.text,textDecoration:"none"}}>(689) 248-5965</a>
          <a href="mailto:info@veridianrisk.com" className="vd-lk" style={{fontSize:12,color:W.textSub,textDecoration:"none",marginTop:6}}>info@veridianrisk.com</a>
        </div>
        <div style={{textAlign:isMobile?"left":"right",fontSize:12,color:W.textDim}}>&copy; {new Date().getFullYear()} Veridian Risk & Resilience Group. All rights reserved.</div>
      </div>
    </footer>
  );
}

// ── Section Label ─────────────────────────────────────────────────
const SLabel=({children})=><div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.12em",marginBottom:20}}>{children}</div>;
const SHead=({children,size=56,mobile=34})=><h2 style={{fontSize:`clamp(${mobile}px,5vw,${size}px)`,fontWeight:900,color:W.text,letterSpacing:"-0.035em",lineHeight:1.04,marginBottom:20}}>{children}</h2>;

// ═══════════════════════════════════════════════════════════════════
// HOMEPAGE
// ═══════════════════════════════════════════════════════════════════

function Hero({isMobile}){
  return(
    <section style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",position:"relative",overflow:"hidden",padding:isMobile?"120px 24px 80px":"150px 56px 110px"}}>
      <div style={{position:"absolute",top:"40%",left:"50%",transform:"translate(-50%,-50%)",width:900,height:900,background:"radial-gradient(circle,rgba(99,102,241,0.06) 0%,transparent 65%)",pointerEvents:"none"}}/>
      <div style={{maxWidth:1200,margin:"0 auto",width:"100%",position:"relative",zIndex:1}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:W.accentB,border:"1px solid rgba(99,102,241,0.22)",borderRadius:100,padding:"6px 16px",marginBottom:40}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:W.green,animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:12,fontWeight:600,color:W.accent,letterSpacing:"0.06em"}}>MISSED CALL RECOVERY & AUTOMATION</span>
        </div>
        <h1 style={{fontSize:isMobile?"44px":"88px",fontWeight:900,color:W.text,lineHeight:1.02,letterSpacing:"-0.04em",marginBottom:28,maxWidth:960}}>
          Stop Losing Customers<br/><span style={{color:W.accent}}>to Missed Calls</span>
        </h1>
        <p style={{fontSize:isMobile?"17px":"22px",color:W.textSub,lineHeight:1.6,maxWidth:580,marginBottom:52,fontWeight:400}}>
          Veridian captures missed calls, automates follow-up, books appointments, and recovers revenue — automatically.
        </p>
        <div style={{display:"flex",gap:14,flexWrap:"wrap",alignItems:"center",marginBottom:64}}>
          <a href="#calculator" className="vd-btn" style={{background:W.accent,color:"#fff",padding:isMobile?"14px 28px":"17px 36px",borderRadius:10,fontSize:isMobile?"15px":"17px",fontWeight:700,textDecoration:"none",letterSpacing:"-0.01em"}}>Calculate Lost Revenue</a>
          <a href="#demo" className="vd-ghost" style={{background:"none",border:`1.5px solid ${W.border}`,color:W.text,padding:isMobile?"13px 26px":"16px 34px",borderRadius:10,fontSize:isMobile?"15px":"17px",fontWeight:600,textDecoration:"none"}}>Watch Live Demo</a>
        </div>
        <div style={{display:"flex",gap:isMobile?20:48,flexWrap:"wrap"}}>
          {[{n:"68%",l:"of missed calls recovered"},{n:"< 60s",l:"automated response time"},{n:"10+",l:"years of experience"}].map(s=>(
            <div key={s.l} style={{minWidth:0}}>
              <div style={{fontSize:isMobile?"22px":"30px",fontWeight:900,color:W.text,letterSpacing:"-0.025em"}}>{s.n}</div>
              <div style={{fontSize:11,color:W.textSub,marginTop:3}}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:36,padding:"14px 20px",background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.18)",borderRadius:10,display:"inline-flex",alignItems:"center",gap:8}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:W.green,animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:12,color:W.green,fontWeight:600}}>Currently accepting new clients — response within one business day</span>
        </div>
      </div>
      <div style={{position:"absolute",bottom:40,left:"50%",transform:"translateX(-50%)",animation:"bounce 2s infinite"}}><ChevronDown size={20} style={{color:W.textDim}}/></div>
    </section>
  );
}

function StatsBar({isMobile}){
  const s=[
    {v:"68%",l:"Missed Call Recovery",sub:"Average across all clients"},
    {v:"60s",l:"Response Time",sub:"From missed call to first contact"},
    {v:"10+",l:"Years of Experience",sub:"Real operators behind the platform"},
    {v:"24/7",l:"Always Available",sub:"No breaks, no gaps in coverage"},
  ];
  return(
    <div style={{background:W.bgAlt,borderTop:`1px solid ${W.border}`,borderBottom:`1px solid ${W.border}`,padding:isMobile?"28px 20px":"36px 56px"}}>
      <div style={{maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:isMobile?20:0}}>
        {s.map((x,i)=>(
          <div key={i} style={{textAlign:"center",padding:isMobile?"0 8px":"0 20px",borderRight:!isMobile&&i<3?`1px solid ${W.border}`:"none"}}>
            <div style={{fontSize:isMobile?"28px":"44px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1}}>{x.v}</div>
            <div style={{fontSize:isMobile?"11px":"12px",color:W.text,marginTop:6,fontWeight:600}}>{x.l}</div>
            {!isMobile&&<div style={{fontSize:11,color:W.textDim,marginTop:3}}>{x.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Calculator (section 2 per directive) ─────────────────────────
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
    <div style={{marginBottom:22}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontSize:13,color:W.textSub,fontWeight:500}}>{label}</span>
        <span style={{fontSize:14,fontWeight:700,color:W.text}}>{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e=>set(Number(e.target.value))} style={{width:"100%",accentColor:W.accent,cursor:"pointer",height:4}}/>
    </div>
  );
  return(
    <section id="calculator" style={{padding:isMobile?"80px 24px":"120px 56px",background:W.bg}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?48:80}}>
          <SLabel>REVENUE CALCULATOR</SLabel>
          <SHead>How Much Revenue<br/>Are You Losing?</SHead>
          <p style={{fontSize:isMobile?"15px":"18px",color:W.textSub,maxWidth:480,margin:"0 auto"}}>Enter your numbers. See exactly what Veridian recovers for you.</p>
        </div>
        <div style={{display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:28,alignItems:"start"}}>
          <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?24:40}}>
            <div style={{fontSize:13,fontWeight:700,color:W.textSub,marginBottom:28,letterSpacing:"0.04em"}}>YOUR NUMBERS</div>
            <Sl label="Monthly incoming calls" value={calls} set={setCalls} min={50} max={2000} step={50} fmt={v=>fmtN(v)}/>
            <Sl label="Missed call rate" value={miss} set={setMiss} min={5} max={60} fmt={v=>`${v}%`}/>
            <Sl label="Average customer value" value={val} set={setVal} min={100} max={10000} step={100} fmt={v=>`$${fmtN(v)}`}/>
            <Sl label="Lead-to-customer conversion" value={conv} set={setConv} min={10} max={80} fmt={v=>`${v}%`}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{background:"linear-gradient(135deg,rgba(99,102,241,0.12),rgba(99,102,241,0.04))",border:"1px solid rgba(99,102,241,0.26)",borderRadius:20,padding:isMobile?28:44,textAlign:"center",animation:"glow 3s infinite"}}>
              <div style={{fontSize:12,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:12}}>ANNUAL RECOVERY POTENTIAL</div>
              <div style={{fontSize:isMobile?"52px":"72px",fontWeight:900,color:W.text,letterSpacing:"-0.045em",lineHeight:1}}>{fmtM(annual)}</div>
              <div style={{fontSize:13,color:W.textSub,marginTop:12}}>in revenue you're currently leaving behind</div>
            </div>
            {[
              {l:"Missed calls/month",v:fmtN(missed)},
              {l:"Missed opportunities",v:fmtN(opps)},
              {l:"Revenue lost monthly",v:fmtM(lostMo),c:W.red},
              {l:"Revenue recovered monthly",v:fmtM(recMo),c:W.green,s:"68% recovery with Veridian"},
            ].map((r,i)=>(
              <div key={i} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:14,padding:"16px 22px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:13,color:W.textSub}}>{r.l}</div>{r.s&&<div style={{fontSize:11,color:W.textDim,marginTop:2}}>{r.s}</div>}</div>
                <div style={{fontSize:20,fontWeight:800,color:r.c||W.text}}>{r.v}</div>
              </div>
            ))}
            <a href="#contact" onClick={()=>{Object.assign(_lead,{calls,miss,val,conv,missed,lostMo,recMo,annual});window.dispatchEvent(new CustomEvent("veridian:calcdata",{detail:{..._lead}}));}} className="vd-btn" style={{display:"block",background:W.accent,color:"#fff",padding:"17px",borderRadius:12,fontSize:15,fontWeight:700,textDecoration:"none",textAlign:"center"}}>Get My Recovery Plan</a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Auto-Play Demo (section 3) ────────────────────────────────────
const DS=[
  {label:"Customer Calls",detail:"Prospect dials in",color:"#3B82F6",screen:"call"},
  {label:"No Answer",detail:"Call goes unanswered",color:W.red,screen:"miss"},
  {label:"Text Sent Instantly",detail:"Veridian responds in < 60s",color:W.accent,screen:"out"},
  {label:"Customer Replies",detail:"68% respond within 10 min",color:"#8B5CF6",screen:"in"},
  {label:"Appointment Booked",detail:"Confirmed automatically",color:W.green,screen:"book"},
  {label:"Revenue Recovered",detail:"Lead converted, customer retained",color:W.green,screen:"win"},
];
function PhoneScreen({step}){
  const s=DS[step];
  return(
    <div style={{width:252,background:"#070710",border:"7px solid #161630",borderRadius:38,overflow:"hidden",boxShadow:"0 40px 100px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.03)",minHeight:480,display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{background:"#070710",padding:"18px 20px 10px",display:"flex",justifyContent:"space-between",fontSize:11,color:W.textSub,fontWeight:600}}><span>9:41</span><span>100%</span></div>
      <div key={step} style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"16px 18px",animation:"fadeIn 0.25s ease"}}>
        {s.screen==="call"&&<div style={{textAlign:"center"}}><div style={{width:72,height:72,borderRadius:"50%",background:"rgba(59,130,246,0.12)",border:"2px solid rgba(59,130,246,0.4)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px"}}><Phone size={28} style={{color:"#3B82F6"}}/></div><div style={{fontSize:11,color:W.textSub,letterSpacing:"0.1em",marginBottom:8}}>INCOMING CALL</div><div style={{fontSize:17,fontWeight:700,color:W.text,marginBottom:4}}>+1 (555) 847-2291</div><div style={{fontSize:12,color:W.textSub,marginBottom:28}}>Unknown Caller</div><div style={{display:"flex",gap:14,justifyContent:"center"}}><div style={{width:52,height:52,borderRadius:"50%",background:W.red,display:"flex",alignItems:"center",justifyContent:"center"}}><X size={20} style={{color:"#fff"}}/></div><div style={{width:52,height:52,borderRadius:"50%",background:W.green,display:"flex",alignItems:"center",justifyContent:"center"}}><Phone size={20} style={{color:"#fff"}}/></div></div></div>}
        {s.screen==="miss"&&<div style={{textAlign:"center"}}><div style={{width:72,height:72,borderRadius:"50%",background:W.redB,border:"2px solid rgba(239,68,68,0.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px"}}><Phone size={28} style={{color:W.red}}/></div><div style={{fontSize:11,color:W.red,letterSpacing:"0.1em",marginBottom:8}}>MISSED CALL</div><div style={{fontSize:17,fontWeight:700,color:W.text,marginBottom:4}}>+1 (555) 847-2291</div><div style={{fontSize:12,color:W.textSub,marginBottom:18}}>Just now</div><div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.16)",borderRadius:10,padding:"12px 14px",fontSize:12,color:W.textSub,lineHeight:1.5}}>73% of callers never leave a voicemail. Without follow-up, this lead is lost.</div></div>}
        {(s.screen==="out"||s.screen==="in")&&<div><div style={{fontSize:11,color:W.textSub,textAlign:"center",marginBottom:14,letterSpacing:"0.08em"}}>MESSAGES</div><div style={{display:"flex",justifyContent:"flex-end",marginBottom:6}}><div style={{background:W.accent,borderRadius:"16px 16px 4px 16px",padding:"10px 13px",maxWidth:"85%",fontSize:12,color:"#fff",lineHeight:1.5}}>Hi! Sorry we missed you — are you still looking for assistance?</div></div><div style={{fontSize:10,color:W.textDim,textAlign:"right",marginBottom:14}}>Veridian · 60 seconds ago</div>{s.screen==="in"&&<><div style={{display:"flex",justifyContent:"flex-start",marginBottom:6,animation:"slideR 0.3s ease"}}><div style={{background:"#1A1A32",borderRadius:"16px 16px 16px 4px",padding:"10px 13px",maxWidth:"85%",fontSize:12,color:W.text,lineHeight:1.5}}>Yes! I need a commercial cleaning quote.</div></div><div style={{fontSize:10,color:W.textDim}}>Customer · Just now</div></>}</div>}
        {s.screen==="book"&&<div style={{textAlign:"center"}}><div style={{width:72,height:72,borderRadius:"50%",background:W.greenB,border:"2px solid rgba(16,185,129,0.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px"}}><Calendar size={28} style={{color:W.green}}/></div><div style={{fontSize:11,color:W.green,letterSpacing:"0.1em",marginBottom:8}}>APPOINTMENT CONFIRMED</div><div style={{fontSize:16,fontWeight:700,color:W.text,marginBottom:4}}>Wednesday, June 18</div><div style={{fontSize:14,color:W.textSub,marginBottom:18}}>2:00 PM — 3:00 PM</div><div style={{background:W.greenB,border:"1px solid rgba(16,185,129,0.18)",borderRadius:10,padding:"11px",fontSize:12,color:W.textSub}}>Confirmation sent automatically</div></div>}
        {s.screen==="win"&&<div style={{textAlign:"center"}}><div style={{width:72,height:72,borderRadius:"50%",background:W.greenB,border:"2px solid rgba(16,185,129,0.38)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",animation:"glow 2s infinite"}}><CheckCircle size={28} style={{color:W.green}}/></div><div style={{fontSize:11,color:W.green,letterSpacing:"0.1em",marginBottom:8}}>REVENUE RECOVERED</div><div style={{fontSize:26,fontWeight:900,color:W.text,marginBottom:4}}>$2,400</div><div style={{fontSize:12,color:W.textSub,marginBottom:18}}>Service opportunity captured</div>{[{l:"Response time",v:"4 minutes",c:W.green},{l:"Without Veridian",v:"Lost",c:W.red}].map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderTop:`1px solid ${W.border}`}}><span style={{fontSize:11,color:W.textSub}}>{r.l}</span><span style={{fontSize:11,color:r.c,fontWeight:700}}>{r.v}</span></div>)}</div>}
      </div>
    </div>
  );
}
function AutoDemo({isMobile}){
  const[step,setStep]=useState(0);
  const[paused,setPaused]=useState(false);
  const tRef=useRef(null);
  useEffect(()=>{if(paused)return;tRef.current=setTimeout(()=>setStep(s=>(s+1)%DS.length),2500);return()=>clearTimeout(tRef.current);},[step,paused]);
  const pick=i=>{setStep(i);setPaused(true);setTimeout(()=>setPaused(false),8000);};
  return(
    <section id="demo" style={{padding:isMobile?"80px 24px":"120px 56px",background:W.bgAlt}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?48:80}}>
          <SLabel>LIVE SIMULATION</SLabel>
          <SHead>See Revenue Recovered<br/>in Real Time</SHead>
          <p style={{fontSize:isMobile?"15px":"18px",color:W.textSub,maxWidth:500,margin:"0 auto"}}>A customer calls. Nobody answers. Watch Veridian recover the revenue — automatically, in under 5 minutes, zero staff involvement.</p>
        </div>
        <div style={{display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:isMobile?36:80,alignItems:"center"}}>
          <div>
            {DS.map((s,i)=>(
              <div key={i} onClick={()=>pick(i)} style={{display:"flex",gap:16,alignItems:"flex-start",padding:"12px 0",cursor:"pointer",opacity:i===step?1:0.32,transition:"opacity 0.2s",borderBottom:i<DS.length-1?`1px solid ${W.border}`:"none"}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:i===step?DS[i].color:"transparent",border:`2px solid ${i===step?DS[i].color:W.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
                  <span style={{fontSize:12,fontWeight:700,color:i===step?"#fff":W.textDim}}>{i+1}</span>
                </div>
                <div style={{paddingTop:4}}><div style={{fontSize:14,fontWeight:700,color:i===step?W.text:W.textSub,marginBottom:2}}>{s.label}</div><div style={{fontSize:12,color:W.textDim}}>{s.detail}</div></div>
              </div>
            ))}
            <div style={{marginTop:20,height:3,background:W.border,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${((step+1)/DS.length)*100}%`,background:W.accent,transition:"width 0.35s ease",borderRadius:2}}/></div>
            <div style={{marginTop:28,display:"flex",gap:14,flexWrap:"wrap"}}>
              <a href="#calculator" className="vd-btn" style={{background:W.accent,color:"#fff",padding:"13px 24px",borderRadius:10,fontSize:14,fontWeight:700,textDecoration:"none"}}>Calculate My Recovery</a>
              <a href="#contact" className="vd-ghost" style={{background:"none",border:`1.5px solid ${W.border}`,color:W.text,padding:"12px 22px",borderRadius:10,fontSize:14,fontWeight:600,textDecoration:"none"}}>Talk to Us</a>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"center"}}><PhoneScreen step={step}/></div>
        </div>
      </div>
    </section>
  );
}

// ── Feature Sections ──────────────────────────────────────────────
function FeatureVisual({type}){
  if(type==="recovery"){
    return(
      <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:28,maxWidth:480}}>
        <div style={{fontSize:11,fontWeight:700,color:W.textSub,letterSpacing:"0.08em",marginBottom:20}}>BEFORE VS. AFTER VERIDIAN</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
          {[{t:"Before",calls:"45 missed",rev:"$22,500 lost",c:W.redB,bc:"rgba(239,68,68,0.2)",tc:W.red},
            {t:"After",calls:"7 missed",rev:"$15,300 back",c:W.greenB,bc:"rgba(16,185,129,0.2)",tc:W.green}].map((x,i)=>(
            <div key={i} style={{background:x.c,border:`1px solid ${x.bc}`,borderRadius:12,padding:18}}>
              <div style={{fontSize:11,fontWeight:700,color:x.tc,marginBottom:12}}>{x.t}</div>
              <div style={{fontSize:14,fontWeight:700,color:W.text,marginBottom:4}}>{x.calls}/mo</div>
              <div style={{fontSize:12,color:x.tc,fontWeight:600}}>{x.rev}</div>
            </div>
          ))}
        </div>
        <div style={{background:W.bgAlt,borderRadius:12,padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:12,color:W.textSub}}>Recovery rate</span>
            <span style={{fontSize:13,fontWeight:700,color:W.green}}>68%</span>
          </div>
          <div style={{height:6,background:W.border,borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",width:"68%",background:W.green,borderRadius:3}}/>
          </div>
          <div style={{fontSize:11,color:W.textDim,marginTop:8}}>Average across all Veridian clients</div>
        </div>
      </div>
    );
  }
  if(type==="frontdesk"){
    return(
      <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:28,maxWidth:480}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div style={{fontSize:13,fontWeight:700,color:W.text}}>Your Business — Never Offline</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:W.green,animation:"pulse 2s infinite"}}/><span style={{fontSize:12,color:W.green,fontWeight:600}}>Live</span></div>
        </div>
        {[{t:"8:14 AM",l:"Incoming call answered",stat:"Qualified"},
          {t:"9:02 AM",l:"Incoming call answered",stat:"Booked"},
          {t:"11:47 AM",l:"Incoming call answered",stat:"Qualified"},
          {t:"2:31 PM",l:"Incoming call answered",stat:"Booked"},
          {t:"5:18 PM",l:"Incoming call answered",stat:"Follow-up"}].map((r,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<4?`1px solid ${W.border}`:"none"}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:W.accentB,display:"flex",alignItems:"center",justifyContent:"center"}}><Phone size={12} style={{color:W.accent}}/></div>
              <div><div style={{fontSize:12,fontWeight:600,color:W.text}}>{r.l}</div><div style={{fontSize:11,color:W.textDim}}>{r.t}</div></div>
            </div>
            <span style={{fontSize:11,fontWeight:600,color:W.green,background:W.greenB,padding:"3px 8px",borderRadius:4}}>{r.stat}</span>
          </div>
        ))}
        <div style={{marginTop:16,padding:"12px 16px",background:W.accentB,borderRadius:10,display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:12,color:W.textSub}}>Calls missed today</span>
          <span style={{fontSize:13,fontWeight:800,color:W.green}}>0</span>
        </div>
      </div>
    );
  }
  if(type==="followup"){
    const msgs=[
      {time:"9:47 AM",who:"system",text:"Missed call from +1 (555) 847-2291",type:"event"},
      {time:"9:47 AM",who:"out",text:"Hi! Sorry we missed you — we'd love to help. Are you still interested?"},
      {time:"9:51 AM",who:"in",text:"Yes! I need a quote for landscaping."},
      {time:"9:52 AM",who:"out",text:"Perfect! I've scheduled a free estimate for Thursday at 2 PM. Does that work?"},
      {time:"9:53 AM",who:"in",text:"That works great, thank you!"},
    ];
    return(
      <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:24,maxWidth:480}}>
        <div style={{fontSize:13,fontWeight:700,color:W.text,marginBottom:20}}>How a Missed Call Becomes a Booked Appointment</div>
        {msgs.map((m,i)=>(
          <div key={i} style={{marginBottom:12}}>
            {m.type==="event"?
              <div style={{textAlign:"center",padding:"6px 0"}}><span style={{fontSize:11,color:W.textDim,background:W.bgAlt,padding:"3px 10px",borderRadius:10}}>{m.time} · {m.text}</span></div>
            :m.who==="out"?
              <div style={{display:"flex",justifyContent:"flex-end"}}><div style={{background:W.accent,borderRadius:"14px 14px 3px 14px",padding:"9px 13px",maxWidth:"80%",fontSize:12,color:"#fff",lineHeight:1.45}}>{m.text}</div></div>
            :
              <div style={{display:"flex",justifyContent:"flex-start"}}><div style={{background:"#1A1A30",borderRadius:"14px 14px 14px 3px",padding:"9px 13px",maxWidth:"80%",fontSize:12,color:W.text,lineHeight:1.45}}>{m.text}</div></div>
            }
          </div>
        ))}
        <div style={{marginTop:16,padding:"12px 16px",background:W.greenB,border:`1px solid rgba(16,185,129,0.2)`,borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:12,color:W.green,fontWeight:600}}>Lead converted</span>
          <span style={{fontSize:11,color:W.textSub}}>4 minutes · zero staff time</span>
        </div>
      </div>
    );
  }
  return null;
}

function RecoverySection({isMobile}){
  return(
    <section id="solutions" style={{padding:isMobile?"80px 24px":"120px 56px",background:W.bg}}>
      <div style={{maxWidth:1200,margin:"0 auto",display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:isMobile?48:80,alignItems:"center"}}>
        <div>
          <SLabel>MISSED CALL RECOVERY</SLabel>
          <SHead>Recover Revenue You Didn't Know You Were Losing</SHead>
          <p style={{fontSize:isMobile?"16px":"18px",color:W.textSub,lineHeight:1.72,marginBottom:32}}>Every missed call is a customer choosing your competitor. Veridian responds within 60 seconds — automatically — so no call ever goes unanswered again.</p>
          <div style={{marginBottom:32,display:"flex",flexDirection:"column",gap:14}}>
            {["60-second automatic response to every missed call","68% average recovery rate across all clients","Full revenue tracking with before/after reporting"].map((p,i)=>(
              <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start"}}><div style={{width:20,height:20,borderRadius:"50%",background:W.greenB,border:`1px solid rgba(16,185,129,0.3)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}><Check size={11} style={{color:W.green}}/></div><span style={{fontSize:15,color:W.textSub}}>{p}</span></div>
            ))}
          </div>
          <a href="#contact" className="vd-btn" style={{display:"inline-flex",alignItems:"center",gap:8,background:W.accent,color:"#fff",padding:"14px 28px",borderRadius:10,fontSize:15,fontWeight:700,textDecoration:"none"}}>Start Recovering Revenue <ArrowRight size={16}/></a>
        </div>
        <div style={{display:"flex",justifyContent:isMobile?"center":"flex-end"}}><FeatureVisual type="recovery"/></div>
      </div>
    </section>
  );
}

function FrontDeskSection({isMobile}){
  return(
    <section style={{padding:isMobile?"80px 24px":"120px 56px",background:W.bgAlt}}>
      <div style={{maxWidth:1200,margin:"0 auto",display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:isMobile?48:80,alignItems:"center"}}>
        <div style={{order:isMobile?1:0,display:"flex",justifyContent:isMobile?"center":"flex-start"}}><FeatureVisual type="frontdesk"/></div>
        <div style={{order:isMobile?0:1}}>
          <SLabel>AI FRONT DESK</SLabel>
          <SHead>Answer Every Call Even When Nobody Is Available</SHead>
          <p style={{fontSize:isMobile?"16px":"18px",color:W.textSub,lineHeight:1.72,marginBottom:32}}>Veridian answers incoming calls 24 hours a day, qualifies leads, and routes inquiries — so your business is always open, even when your team isn't.</p>
          <div style={{marginBottom:32,display:"flex",flexDirection:"column",gap:14}}>
            {["24/7 availability — no voicemail, no missed opportunities","Instant lead qualification on every call","Seamless handoff to your team for warm leads"].map((p,i)=>(
              <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start"}}><div style={{width:20,height:20,borderRadius:"50%",background:W.greenB,border:`1px solid rgba(16,185,129,0.3)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}><Check size={11} style={{color:W.green}}/></div><span style={{fontSize:15,color:W.textSub}}>{p}</span></div>
            ))}
          </div>
          <a href="#contact" className="vd-btn" style={{display:"inline-flex",alignItems:"center",gap:8,background:W.accent,color:"#fff",padding:"14px 28px",borderRadius:10,fontSize:15,fontWeight:700,textDecoration:"none"}}>Never Miss Another Call <ArrowRight size={16}/></a>
        </div>
      </div>
    </section>
  );
}

function FollowUpSection({isMobile}){
  return(
    <section style={{padding:isMobile?"80px 24px":"120px 56px",background:W.bg}}>
      <div style={{maxWidth:1200,margin:"0 auto",display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:isMobile?48:80,alignItems:"center"}}>
        <div>
          <SLabel>FOLLOW-UP AUTOMATION</SLabel>
          <SHead>Convert More Leads Without Hiring More Staff</SHead>
          <p style={{fontSize:isMobile?"16px":"18px",color:W.textSub,lineHeight:1.72,marginBottom:32}}>Most leads die from neglect — not from lack of interest. Veridian follows up at exactly the right time, with exactly the right message, and books the appointment automatically.</p>
          <div style={{marginBottom:32,display:"flex",flexDirection:"column",gap:14}}>
            {["Automated text and email sequences triggered by missed calls","Intelligent timing — reaches prospects when they're most likely to respond","Books appointments directly to your calendar without manual work"].map((p,i)=>(
              <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start"}}><div style={{width:20,height:20,borderRadius:"50%",background:W.greenB,border:`1px solid rgba(16,185,129,0.3)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}><Check size={11} style={{color:W.green}}/></div><span style={{fontSize:15,color:W.textSub}}>{p}</span></div>
            ))}
          </div>
          <a href="#contact" className="vd-btn" style={{display:"inline-flex",alignItems:"center",gap:8,background:W.accent,color:"#fff",padding:"14px 28px",borderRadius:10,fontSize:15,fontWeight:700,textDecoration:"none"}}>Automate Your Follow-Up <ArrowRight size={16}/></a>
        </div>
        <div style={{display:"flex",justifyContent:isMobile?"center":"flex-end"}}><FeatureVisual type="followup"/></div>
      </div>
    </section>
  );
}

function Trust({isMobile}){
  const pts=[
    {I:Award,t:"10+ Years of Experience",b:"Built by operators who ran service businesses — not technologists guessing at your problems."},
    {I:Users,t:"Human Support, Always",b:"Every client has a dedicated support contact. Technology handles automation. Humans handle the relationship."},
    {I:Globe,t:"Nationwide Service",b:"Local expertise backed by national infrastructure. Wherever you operate, we operate."},
    {I:Clock,t:"Same-Day Response",b:"We answer within the same business day. Your customers deserve speed — and so do you."},
    {I:Shield,t:"Business-First Approach",b:"Our measure of success is your revenue recovered — not features delivered or seats sold."},
    {I:Zap,t:"Technology-Enabled",b:"Sophisticated automation under the hood. Simple, clear outcomes on your end. No training needed."},
  ];
  return(
    <section style={{padding:isMobile?"80px 24px":"120px 56px",background:W.bgAlt}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?48:80}}>
          <SLabel>TRUST</SLabel>
          <SHead>Why Businesses Trust Veridian</SHead>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:20}}>
          {pts.map((p,i)=>{const Icon=p.I;return(
            <div key={i} className="vd-card" style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:16,padding:28}}>
              <div style={{width:42,height:42,borderRadius:11,background:W.accentB,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:18}}><Icon size={19} style={{color:W.accent}}/></div>
              <div style={{fontSize:15,fontWeight:700,color:W.text,marginBottom:10}}>{p.t}</div>
              <p style={{fontSize:13,color:W.textSub,lineHeight:1.65}}>{p.b}</p>
            </div>
          );})}
        </div>
      </div>
    </section>
  );
}

function SocialProof({isMobile}){
  const outcomes=[
    {industry:"Security Companies",metric:"3–5x",label:"More Bid Opportunities Captured",detail:"When patrol and guard contract inquiries are answered immediately — not after the prospect called someone else."},
    {industry:"Medical Practices",metric:"12–18",label:"Additional Appointments Per Month",detail:"From calls that previously reached voicemail and never came back."},
    {industry:"Contractors",metric:"68%",label:"of Missed Calls Recovered",detail:"Inquiries received while on the job site, converted to estimates and booked jobs."},
  ];
  return(
    <section style={{padding:isMobile?"64px 24px":"80px 56px",background:W.bg,borderTop:`1px solid ${W.border}`}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <SLabel>TYPICAL OUTCOMES</SLabel>
          <div style={{fontSize:isMobile?"24px":"36px",fontWeight:800,color:W.text,letterSpacing:"-0.025em",lineHeight:1.1}}>What Businesses Recover<br/>With Veridian</div>
          <div style={{fontSize:12,color:W.textDim,marginTop:12}}>Representative outcomes by industry. Actual results vary by call volume, industry, and market.</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:20,marginBottom:40}}>
          {outcomes.map((o,i)=>(
            <div key={i} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:16,padding:isMobile?22:28}}>
              <div style={{fontSize:isMobile?"36px":"44px",fontWeight:900,color:W.accent,letterSpacing:"-0.04em",lineHeight:1,marginBottom:8}}>{o.metric}</div>
              <div style={{fontSize:13,fontWeight:700,color:W.text,marginBottom:12}}>{o.label}</div>
              <p style={{fontSize:13,color:W.textSub,lineHeight:1.65,marginBottom:20}}>{o.detail}</p>
              <div style={{borderTop:`1px solid ${W.border}`,paddingTop:12}}>
                <span style={{fontSize:11,fontWeight:600,color:W.textDim,letterSpacing:"0.06em"}}>{o.industry.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center"}}>
          <a href="#contact" className="vd-btn" style={{display:"inline-flex",alignItems:"center",gap:8,background:"none",border:`1.5px solid ${W.border}`,color:W.text,padding:"12px 28px",borderRadius:10,fontSize:14,fontWeight:600,textDecoration:"none"}}>See What Veridian Recovers for Your Business <ArrowRight size={15}/></a>
        </div>
      </div>
    </section>
  );
}

function Founder({isMobile}){
  return(
    <section style={{padding:isMobile?"80px 24px":"120px 56px",background:W.bgAlt,borderTop:`1px solid ${W.border}`}}>
      <div style={{maxWidth:800,margin:"0 auto",textAlign:"center"}}>
        <SLabel>WHY VERIDIAN EXISTS</SLabel>
        <SHead mobile={28}>Built by Operators.<br/><span style={{color:W.accent}}>Not by Technologists.</span></SHead>
        <p style={{fontSize:isMobile?"16px":"20px",color:W.textSub,lineHeight:1.75,marginBottom:24,fontWeight:400}}>Veridian was founded by operators with decades of experience running service businesses. We watched good companies lose customers not because of bad service — but because of a missed call, a slow response, or a follow-up that never happened.</p>
        <p style={{fontSize:isMobile?"16px":"20px",color:W.textSub,lineHeight:1.75,marginBottom:56,fontWeight:400}}>We built Veridian to fix those three problems. Not with more staff. Not with complicated software. With automation that works the way your business works.</p>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:20,textAlign:"left"}}>
          {[{t:"Missed Revenue",b:"Every unanswered call is revenue walking out the door. We close that door."},{t:"Slow Response",b:"Speed wins customers. Veridian responds in under 60 seconds, every time."},{t:"Poor Follow-Up",b:"Most leads die from neglect. Automated follow-up converts them instead."}].map((m,i)=>(
            <div key={i} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:14,padding:24}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:W.accent,marginBottom:14}}/>
              <div style={{fontSize:15,fontWeight:700,color:W.text,marginBottom:8}}>{m.t}</div>
              <div style={{fontSize:13,color:W.textSub,lineHeight:1.65}}>{m.b}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Results({isMobile}){
  const s=[{v:"68%",l:"Recovery Rate",sub:"Average across all clients"},{v:"< 4 min",l:"Time to First Contact",sub:"From missed call to reply"},{v:"10+",l:"Years of Experience",sub:"Real operators behind the platform"},{v:"24/7",l:"Automated Coverage",sub:"No breaks, no missed revenue"}];
  return(
    <section style={{padding:isMobile?"80px 24px":"120px 56px",background:W.bgAlt}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?48:80}}>
          <SLabel>OUTCOMES</SLabel>
          <SHead>The Results Speak<br/>for Themselves</SHead>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:20,marginBottom:48}}>
          {s.map((x,i)=><div key={i} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?24:36,textAlign:"center"}}><div style={{fontSize:isMobile?"36px":"52px",fontWeight:900,color:W.accent,letterSpacing:"-0.04em",lineHeight:1}}>{x.v}</div><div style={{fontSize:14,fontWeight:600,color:W.text,marginTop:14,marginBottom:5}}>{x.l}</div><div style={{fontSize:11,color:W.textDim}}>{x.sub}</div></div>)}
        </div>
        <div style={{textAlign:"center"}}>
          <a href="#contact" className="vd-btn" style={{display:"inline-flex",alignItems:"center",gap:8,background:W.accent,color:"#fff",padding:"15px 32px",borderRadius:10,fontSize:15,fontWeight:700,textDecoration:"none"}}>Start Recovering Revenue Today <ArrowRight size={16}/></a>
        </div>
      </div>
    </section>
  );
}

function IndustriesTeaser({isMobile}){
  const inds=[
    {t:"Security Companies",slug:"security",p:"Missed patrol bids go to competitors who answered first."},
    {t:"Property Management",slug:"property-management",p:"After-hours maintenance calls and tenant inquiries fall through the cracks."},
    {t:"Contractors",slug:"contractors",p:"On-site work means missed calls. Missed calls mean lost bids."},
    {t:"Medical Practices",slug:"medical",p:"Missed appointment calls become empty schedule slots."},
    {t:"Law Firms",slug:"law",p:"Potential clients call once. If nobody answers, they call the next firm."},
  ];
  const pills=["Security","Property Management","Contractors","Medical","Law Firms"];
  return(
    <section style={{padding:isMobile?"80px 24px":"120px 56px",background:W.bg}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?48:80}}>
          <SLabel>INDUSTRIES</SLabel>
          <SHead>Built for Your Industry</SHead>
          <p style={{fontSize:isMobile?"15px":"18px",color:W.textSub,maxWidth:480,margin:"0 auto",marginBottom:24}}>Revenue recovery challenges differ by industry. Veridian is configured for yours.</p>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
            {pills.map((p,i)=>(
              <a key={i} href={`/industries/${inds[i].slug}`} className="vd-ind-pill" style={{fontSize:12,fontWeight:600,color:W.textSub,background:W.card,border:`1px solid ${W.border}`,borderRadius:100,padding:"6px 16px",textDecoration:"none",transition:"all 0.15s"}}>{p}</a>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:20}}>
          {inds.map((ind,i)=>(
            <a key={i} href={`/industries/${ind.slug}`} className="vd-card" style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:16,padding:28,textDecoration:"none",display:"block"}}>
              <div style={{fontSize:12,fontWeight:700,color:W.accent,letterSpacing:"0.06em",marginBottom:14}}>{ind.t.toUpperCase()}</div>
              <p style={{fontSize:14,color:W.textSub,lineHeight:1.6,marginBottom:16}}>{ind.p}</p>
              <div style={{display:"flex",alignItems:"center",gap:6,color:W.accent,fontSize:13,fontWeight:600}}>
                See how Veridian helps <ChevronRight size={14}/>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact({isMobile}){
  const[f,setF]=useState({name:"",biz:"",phone:"",email:"",challenge:""});
  const[step,setStep]=useState("form");
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState(null);
  const[calcHint,setCalcHint]=useState(null);
  const[leadId,setLeadId]=useState(null);
  const[slot,setSlot]=useState(null);
  const[plan,setPlan]=useState(null);
  const[planLoading,setPlanLoading]=useState(false);
  const[bookingLoading,setBookingLoading]=useState(false);
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
      setLeadId(data.leadId||null);
      setStep("success");
    }catch(ex){setErr("Something went wrong — please try again or email us directly.");}
    setLoading(false);
  };
  const confirmBooking=async()=>{
    if(!slot)return;
    setBookingLoading(true);
    try{await fetch("/api/book",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({leadId,slot,name:f.name,email:f.email,biz:f.biz})});}catch{}
    setStep("booked");setBookingLoading(false);
  };
  const generatePlan=async()=>{
    setStep("plan");setPlanLoading(true);
    const ch=calcHint;
    const prompt=`Generate a revenue recovery plan for this service business.\nBusiness: ${f.biz||"Service business"}\nChallenge: ${f.challenge||"Missed calls and follow-up"}\n${ch?.annual>0?`Calculator:\n- Monthly calls: ${ch.calls}, Miss rate: ${ch.miss}%, Avg value: $${ch.val}, Conv: ${ch.conv}%\n- Missed/mo: ${ch.missed}, At risk: $${ch.lostMo}/mo, Recovery: $${ch.recMo}/mo, Annual: $${ch.annual}`:"No calculator data."}\n\nProvide the plan with EXACTLY these 4 headers:\n\nRECOMMENDED SERVICES\n[3 Veridian services specific to their situation]\n\nEXPECTED OUTCOMES\n[3 quantified outcomes using their numbers]\n\nESTIMATED RECOVERY POTENTIAL\n[Monthly, annual, per-call breakdown]\n\nNEXT STEPS\n[Day 1, Day 2-3, Day 4, Day 5+ timeline]\n\nUnder 350 words. Use their actual numbers. Revenue-focused only.`;
    try{
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:prompt}],system:"You are a revenue recovery specialist. Be specific, concise, use the client's actual numbers.",max_tokens:600})});
      const data=await r.json();
      setPlan(data.text||null);
    }catch{setPlan(null);}
    setPlanLoading(false);
  };
  const slots=getSlots();
  const PC={HOT:W.red,HIGH:W.amber,MEDIUM:W.accent,LOW:W.textDim};
  const FI=({label,k,type="text",placeholder=""})=>(
    <div style={{marginBottom:18}}>
      <label style={{fontSize:12,fontWeight:600,color:W.textSub,display:"block",marginBottom:7,letterSpacing:"0.04em"}}>{label}</label>
      <input type={type} value={f[k]} onChange={e=>setF(x=>({...x,[k]:e.target.value}))} placeholder={placeholder} style={{width:"100%",background:W.bgAlt,border:`1px solid ${W.border}`,borderRadius:8,padding:"12px 14px",color:W.text,fontSize:14,outline:"none"}}/>
    </div>
  );
  return(
    <section id="contact" style={{padding:isMobile?"80px 24px":"120px 56px",background:W.bgAlt}}>
      <div style={{maxWidth:640,margin:"0 auto"}}>
        {step==="form"&&<>
          <div style={{textAlign:"center",marginBottom:isMobile?40:64}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:100,padding:"6px 14px",marginBottom:20}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:W.green,animation:"pulse 2s infinite"}}/>
              <span style={{fontSize:12,fontWeight:600,color:W.green}}>Responding to new client inquiries now</span>
            </div>
            <SLabel>GET STARTED</SLabel>
            <SHead mobile={28}>Start Recovering<br/>Revenue Today</SHead>
            <p style={{fontSize:isMobile?"15px":"17px",color:W.textSub,lineHeight:1.65}}>Tell us about your business. We'll show you exactly how much revenue you're losing — and how to recover it.</p>
          </div>
          <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?24:40}}>
            <form onSubmit={sub}>
              {calcHint?.annual>0&&(
                <div style={{background:W.accentB,border:`1px solid rgba(99,102,241,0.22)`,borderRadius:10,padding:"14px 18px",marginBottom:22,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.06em",marginBottom:3}}>YOUR ESTIMATED RECOVERY</div><div style={{fontSize:12,color:W.textSub}}>From your calculator inputs</div></div>
                  <div style={{fontSize:24,fontWeight:900,color:W.text,letterSpacing:"-0.03em"}}>{fmtM(calcHint.annual)}<span style={{fontSize:11,color:W.textDim,fontWeight:400}}>/yr</span></div>
                </div>
              )}
              <div style={{display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:isMobile?0:16}}>
                <FI label="YOUR NAME" k="name" placeholder="First and last name"/>
                <FI label="BUSINESS NAME" k="biz" placeholder="Company name"/>
              </div>
              <div style={{display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:isMobile?0:16}}>
                <FI label="PHONE" k="phone" type="tel" placeholder="+1 (555) 000-0000"/>
                <FI label="EMAIL" k="email" type="email" placeholder="you@company.com"/>
              </div>
              <div style={{marginBottom:24}}>
                <label style={{fontSize:12,fontWeight:600,color:W.textSub,display:"block",marginBottom:7,letterSpacing:"0.04em"}}>BIGGEST CHALLENGE</label>
                <textarea value={f.challenge} onChange={e=>setF(x=>({...x,challenge:e.target.value}))} placeholder="What's your biggest revenue or customer follow-up challenge?" rows={3} style={{width:"100%",background:W.bgAlt,border:`1px solid ${W.border}`,borderRadius:8,padding:"12px 14px",color:W.text,fontSize:14,outline:"none",resize:"vertical"}}/>
              </div>
              {err&&<div style={{marginBottom:14,padding:"12px 14px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,fontSize:13,color:W.red}}>{err}</div>}
              <button type="submit" disabled={loading} className="vd-btn" style={{width:"100%",background:W.accent,color:"#fff",border:"none",borderRadius:10,padding:"17px",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1}}>
                {loading?"Submitting...":"Get My Free Revenue Assessment"}
              </button>
            </form>
          </div>
        </>}
        {step==="success"&&(
          <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?28:44,textAlign:"center"}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:W.greenB,border:`1px solid ${W.green}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><CheckCircle size={24} style={{color:W.green}}/></div>
            <div style={{fontSize:20,fontWeight:800,color:W.text,marginBottom:6}}>Lead Captured</div>
            {calcHint?.annual>0&&(
              <div style={{background:W.accentB,border:`1px solid rgba(99,102,241,0.22)`,borderRadius:12,padding:"16px 20px",margin:"16px 0 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{textAlign:"left"}}><div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.06em",marginBottom:3}}>RECOVERY POTENTIAL</div><div style={{fontSize:12,color:W.textSub}}>Identified</div></div>
                <div style={{fontSize:28,fontWeight:900,color:W.text,letterSpacing:"-0.03em"}}>{fmtM(calcHint.annual)}<span style={{fontSize:11,color:W.textDim,fontWeight:400}}>/yr</span></div>
              </div>
            )}
            <div style={{fontSize:14,color:W.textSub,lineHeight:1.65,marginBottom:24}}>A member of our team will be in touch within one business day. Or skip the wait:</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button onClick={()=>setStep("booking")} className="vd-btn" style={{background:W.accent,color:"#fff",border:"none",borderRadius:10,padding:"15px",fontSize:15,fontWeight:700,cursor:"pointer",width:"100%"}}>Book My Free Consultation</button>
              {calcHint?.annual>0&&<button onClick={generatePlan} style={{background:"none",border:`1px solid ${W.border}`,borderRadius:10,padding:"13px",fontSize:14,fontWeight:600,color:W.text,cursor:"pointer",width:"100%"}}>Generate My Recovery Plan</button>}
            </div>
          </div>
        )}
        {step==="booking"&&(
          <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?24:40}}>
            <div style={{textAlign:"center",marginBottom:28}}>
              <div style={{fontSize:18,fontWeight:800,color:W.text,marginBottom:6}}>Book Your Free Consultation</div>
              <div style={{fontSize:13,color:W.textSub}}>30 minutes — we'll review your numbers and build your recovery plan live.</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
              {slots.map(s=>(
                <button key={s.id} onClick={()=>setSlot(s)} style={{background:slot?.id===s.id?W.accentB:W.bgAlt,border:`1.5px solid ${slot?.id===s.id?W.accent:W.border}`,borderRadius:10,padding:"12px 8px",cursor:"pointer",textAlign:"center",transition:"all 0.15s"}}>
                  <div style={{fontSize:11,fontWeight:700,color:slot?.id===s.id?W.accent:W.text,marginBottom:3}}>{s.date}</div>
                  <div style={{fontSize:11,color:slot?.id===s.id?W.accent:W.textSub}}>{s.time}</div>
                </button>
              ))}
            </div>
            {slot&&<button onClick={confirmBooking} disabled={bookingLoading} className="vd-btn" style={{width:"100%",background:W.green,color:"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:10}}>
              {bookingLoading?"Confirming...":"Confirm — "+slot.date+" at "+slot.time}
            </button>}
            <button onClick={()=>setStep("success")} style={{background:"none",border:"none",color:W.textDim,fontSize:13,cursor:"pointer",width:"100%",padding:"8px"}}>← Back</button>
          </div>
        )}
        {step==="booked"&&(
          <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?28:44,textAlign:"center"}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:W.greenB,border:`1px solid ${W.green}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><Calendar size={24} style={{color:W.green}}/></div>
            <div style={{fontSize:20,fontWeight:800,color:W.text,marginBottom:6}}>Consultation Confirmed</div>
            <div style={{background:W.bgAlt,border:`1px solid ${W.border}`,borderRadius:12,padding:"16px 20px",margin:"16px auto 16px",display:"inline-block"}}>
              <div style={{fontSize:16,fontWeight:700,color:W.text}}>{slot?.date}</div>
              <div style={{fontSize:13,color:W.textSub}}>{slot?.time} — 30 minutes</div>
            </div>
            <div style={{fontSize:14,color:W.textSub,lineHeight:1.65,marginBottom:20}}>Check your email for confirmation details. We'll send a calendar invite and prep notes.</div>
            {calcHint?.annual>0&&<button onClick={generatePlan} style={{background:"none",border:`1px solid ${W.border}`,borderRadius:10,padding:"12px 24px",fontSize:13,fontWeight:600,color:W.text,cursor:"pointer"}}>Generate My Recovery Plan While You Wait</button>}
          </div>
        )}
        {step==="plan"&&(
          <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?24:40}}>
            {planLoading?(
              <div style={{textAlign:"center",padding:"48px 0"}}>
                <div style={{width:44,height:44,borderRadius:"50%",border:`3px solid ${W.accent}`,borderTopColor:"transparent",animation:"spin 0.7s linear infinite",margin:"0 auto 20px"}}/>
                <div style={{fontSize:14,color:W.textSub}}>Generating your recovery plan...</div>
              </div>
            ):(
              <>
                <div className="vd-no-print" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
                  <div style={{fontSize:17,fontWeight:800,color:W.text}}>Your Revenue Recovery Plan</div>
                  <button onClick={()=>window.print()} style={{background:W.accentB,border:`1px solid rgba(99,102,241,0.22)`,borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,color:W.accent,cursor:"pointer"}}>Print / PDF</button>
                </div>
                {plan?(
                  <div className="vd-print-plan" style={{fontSize:13,color:W.textSub,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{plan}</div>
                ):(
                  <div style={{padding:"28px 0",textAlign:"center"}}>
                    <div style={{fontSize:14,color:W.textSub,marginBottom:10}}>AI plan generation requires ANTHROPIC_API_KEY to be set in Vercel environment variables.</div>
                    <div style={{fontSize:12,color:W.textDim}}>Contact us directly — we'll build your plan on our consultation call.</div>
                  </div>
                )}
                <div style={{marginTop:24,paddingTop:18,borderTop:`1px solid ${W.border}`,display:"flex",gap:10}}>
                  <button onClick={()=>setStep("success")} style={{background:"none",border:`1px solid ${W.border}`,borderRadius:9,padding:"10px 18px",fontSize:13,fontWeight:600,color:W.textSub,cursor:"pointer"}}>← Back</button>
                  <button onClick={()=>setStep("booking")} className="vd-btn" style={{flex:1,background:W.accent,color:"#fff",border:"none",borderRadius:9,padding:"10px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Book a Consultation</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

const HAS_VIDEOS=false;
function VideoSection({isMobile}){
  if(!HAS_VIDEOS)return null;
  const videos=[
    {title:"Missed Call Recovery Demo",sub:"See how a missed call becomes a booked appointment in under 5 minutes.",id:"recovery"},
    {title:"AI Front Desk in Action",sub:"24/7 customer intake — no staff, no missed opportunities.",id:"frontdesk"},
    {title:"Customer Follow-Up Automation",sub:"From first contact to confirmed appointment, fully automated.",id:"followup"},
  ];
  return(
    <section style={{padding:isMobile?"80px 24px":"120px 56px",background:W.bg}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?48:72}}>
          <SLabel>VIDEO DEMOS</SLabel>
          <SHead>See Veridian in Action</SHead>
          <p style={{fontSize:isMobile?"15px":"18px",color:W.textSub,maxWidth:480,margin:"0 auto"}}>Watch how Veridian captures missed calls and turns them into booked revenue — automatically.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:20}}>
          {videos.map(v=>(
            <div key={v.id} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:16,overflow:"hidden"}}>
              <div style={{width:"100%",aspectRatio:"16/9",background:W.bgAlt,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                <div style={{width:56,height:56,borderRadius:"50%",background:W.accent,display:"flex",alignItems:"center",justifyContent:"center",opacity:0.9}}>
                  <div style={{width:0,height:0,borderStyle:"solid",borderWidth:"10px 0 10px 18px",borderColor:`transparent transparent transparent #fff`,marginLeft:4}}/>
                </div>
              </div>
              <div style={{padding:"18px 20px 24px"}}>
                <div style={{fontSize:14,fontWeight:700,color:W.text,marginBottom:6}}>{v.title}</div>
                <p style={{fontSize:13,color:W.textSub,lineHeight:1.55}}>{v.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Homepage({isMobile}){
  return(
    <>
      <Hero isMobile={isMobile}/>
      <StatsBar isMobile={isMobile}/>
      <Calculator isMobile={isMobile}/>
      <AutoDemo isMobile={isMobile}/>
      <VideoSection isMobile={isMobile}/>
      <RecoverySection isMobile={isMobile}/>
      <FrontDeskSection isMobile={isMobile}/>
      <FollowUpSection isMobile={isMobile}/>
      <Trust isMobile={isMobile}/>
      <SocialProof isMobile={isMobile}/>
      <Founder isMobile={isMobile}/>
      <Results isMobile={isMobile}/>
      <IndustriesTeaser isMobile={isMobile}/>
      <Contact isMobile={isMobile}/>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ENTERPRISE PAGE
// ═══════════════════════════════════════════════════════════════════
function EnterprisePage({isMobile}){
  const faqs=[
    {q:"What is your implementation timeline?",a:"Most clients are live within 5 business days. We handle all configuration, testing, and go-live support. No technical work is required on your end."},
    {q:"Do you integrate with our existing phone system?",a:"Yes. Veridian works alongside your current phone system without replacements or complex integrations. Setup requires a simple call forwarding configuration."},
    {q:"What happens if Veridian goes offline?",a:"Our infrastructure runs with 99.9% uptime SLA. In the rare event of an outage, calls route normally to your existing lines. Missed call recovery resumes automatically when service is restored."},
    {q:"How is our customer data handled?",a:"All data is encrypted in transit and at rest. We never sell or share customer data. Data is retained per your contract terms and deleted upon request."},
    {q:"What support is included?",a:"All plans include a dedicated account manager, same-business-day email support, and phone support during business hours. Enterprise clients receive priority support with a 4-hour response SLA."},
    {q:"Can Veridian scale with our business?",a:"Yes. Our infrastructure scales automatically. Whether you're handling 50 or 5,000 missed calls per month, Veridian handles the volume without configuration changes."},
  ];
  return(
    <div style={{minHeight:"100vh",background:W.bg}}>
      {/* Header */}
      <section style={{padding:isMobile?"120px 24px 64px":"150px 56px 80px",background:W.bgAlt,borderBottom:`1px solid ${W.border}`}}>
        <div style={{maxWidth:800,margin:"0 auto",textAlign:"center"}}>
          <SLabel>ENTERPRISE READINESS</SLabel>
          <SHead mobile={32}>Everything You Need<br/>to Make a Confident Decision</SHead>
          <p style={{fontSize:isMobile?"15px":"19px",color:W.textSub,lineHeight:1.65}}>Veridian is built for businesses that take operations seriously. Here's everything procurement, legal, and operations teams ask about.</p>
        </div>
      </section>
      <div style={{maxWidth:1000,margin:"0 auto",padding:isMobile?"40px 24px":"80px 56px"}}>
        {/* Company */}
        <div style={{marginBottom:64}}>
          <div style={{fontSize:12,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:20}}>COMPANY</div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:20}}>
            {[{t:"Company Name",v:"Veridian"},{t:"Type",v:"Privately Held"},{t:"Founded",v:"2020"},{t:"Headquarters",v:"United States"},{t:"Service Area",v:"Nationwide"},{t:"Team Size",v:"Operational team + technology infrastructure"}].map((r,i)=>(
              <div key={i} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:12,padding:"18px 22px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,color:W.textSub}}>{r.t}</span>
                <span style={{fontSize:14,fontWeight:600,color:W.text}}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Support Model */}
        <div style={{marginBottom:64}}>
          <div style={{fontSize:12,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:20}}>SUPPORT MODEL</div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:20}}>
            {[{t:"Dedicated Account Manager",b:"Every client receives a named account manager as their single point of contact."},{t:"Response Times",b:"Email support: same business day. Phone support: during business hours. Enterprise: 4-hour SLA."},{t:"Ongoing Optimization",b:"Monthly performance reviews, configuration tuning, and strategy calls included at no extra cost."}].map((x,i)=>(
              <div key={i} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:14,padding:24}}>
                <div style={{fontSize:14,fontWeight:700,color:W.text,marginBottom:10}}>{x.t}</div>
                <p style={{fontSize:13,color:W.textSub,lineHeight:1.65}}>{x.b}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Implementation */}
        <div style={{marginBottom:64}}>
          <div style={{fontSize:12,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:20}}>IMPLEMENTATION PROCESS</div>
          <div style={{display:"flex",flexDirection:"column",gap:0}}>
            {[{step:"Day 1",t:"Kickoff & Configuration",b:"Account setup, call routing configuration, response message customization."},{step:"Day 2–3",t:"Testing & Validation",b:"Live testing of all recovery sequences. We verify every scenario before going live."},{step:"Day 4",t:"Soft Launch",b:"Go live with monitoring. We actively watch your first live calls and recoveries."},{step:"Day 5+",t:"Full Operation",b:"System fully operational. Monthly reviews begin. Ongoing optimization included."}].map((x,i)=>(
              <div key={i} style={{display:"flex",gap:20,padding:"20px 0",borderBottom:`1px solid ${W.border}`}}>
                <div style={{width:56,fontSize:11,fontWeight:700,color:W.accent,paddingTop:2,flexShrink:0}}>{x.step}</div>
                <div><div style={{fontSize:14,fontWeight:700,color:W.text,marginBottom:4}}>{x.t}</div><div style={{fontSize:13,color:W.textSub}}>{x.b}</div></div>
              </div>
            ))}
          </div>
        </div>
        {/* Security */}
        <div style={{marginBottom:64}}>
          <div style={{fontSize:12,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:20}}>SECURITY PRACTICES</div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:16}}>
            {[{t:"Data Encryption",b:"All data encrypted in transit (TLS 1.3) and at rest (AES-256)."},{t:"Access Controls",b:"Role-based access with multi-factor authentication required."},{t:"Data Retention",b:"Customer data retained per contract terms. Full deletion available on request."},{t:"No Data Sharing",b:"We never sell, share, or use your customer data for any purpose other than service delivery."}].map((x,i)=>(
              <div key={i} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:12,padding:22,display:"flex",gap:14}}>
                <div style={{width:36,height:36,borderRadius:9,background:W.accentB,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Lock size={16} style={{color:W.accent}}/></div>
                <div><div style={{fontSize:14,fontWeight:700,color:W.text,marginBottom:6}}>{x.t}</div><div style={{fontSize:13,color:W.textSub,lineHeight:1.6}}>{x.b}</div></div>
              </div>
            ))}
          </div>
        </div>
        {/* Service Commitments */}
        <div style={{marginBottom:64}}>
          <div style={{fontSize:12,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:20}}>SERVICE COMMITMENTS</div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:16}}>
            {[{t:"99.9% Uptime SLA",b:"Infrastructure reliability guaranteed."},{t:"60-Second Response",b:"Missed call recovery fires within 60 seconds, every time."},{t:"Monthly Reporting",b:"Full performance reports delivered monthly."}].map((x,i)=>(
              <div key={i} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:12,padding:22}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><Check size={14} style={{color:W.green}}/><div style={{fontSize:14,fontWeight:700,color:W.text}}>{x.t}</div></div>
                <p style={{fontSize:13,color:W.textSub}}>{x.b}</p>
              </div>
            ))}
          </div>
        </div>
        {/* FAQ */}
        <div style={{marginBottom:64}}>
          <div style={{fontSize:12,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:20}}>FREQUENTLY ASKED QUESTIONS</div>
          <div style={{display:"flex",flexDirection:"column",gap:0}}>
            {faqs.map((f,i)=>(
              <div key={i} style={{padding:"24px 0",borderBottom:i<faqs.length-1?`1px solid ${W.border}`:"none"}}>
                <div style={{fontSize:15,fontWeight:700,color:W.text,marginBottom:10}}>{f.q}</div>
                <p style={{fontSize:14,color:W.textSub,lineHeight:1.7}}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{background:"linear-gradient(135deg,rgba(99,102,241,0.1),rgba(99,102,241,0.04))",border:"1px solid rgba(99,102,241,0.22)",borderRadius:20,padding:isMobile?28:44,textAlign:"center"}}>
          <div style={{fontSize:20,fontWeight:800,color:W.text,marginBottom:12}}>Ready to move forward?</div>
          <p style={{fontSize:15,color:W.textSub,marginBottom:24}}>Contact our team for a custom proposal, security documentation, or contract review.</p>
          <a href="/#contact" className="vd-btn" style={{display:"inline-block",background:W.accent,color:"#fff",padding:"14px 32px",borderRadius:10,fontSize:15,fontWeight:700,textDecoration:"none"}}>Contact Our Team</a>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// INDUSTRY PAGES
// ═══════════════════════════════════════════════════════════════════
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
        <span style={{fontSize:13,color:W.textSub,fontWeight:500}}>{label}</span>
        <span style={{fontSize:13,fontWeight:700,color:W.text}}>{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e=>set(Number(e.target.value))} style={{width:"100%",accentColor:W.accent,cursor:"pointer",height:4}}/>
    </div>
  );
  return(
    <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:16,padding:isMobile?24:36,marginBottom:48}}>
      <div style={{fontSize:12,fontWeight:700,color:W.accent,letterSpacing:"0.08em",marginBottom:20}}>YOUR RECOVERY ESTIMATE</div>
      <div style={{display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:isMobile?0:32,alignItems:"start"}}>
        <div>
          <Sl label="Monthly incoming calls" value={calls} set={setCalls} min={20} max={2000} step={10} fmt={v=>v.toLocaleString()}/>
          <Sl label="Missed call rate" value={miss} set={setMiss} min={5} max={70} fmt={v=>`${v}%`}/>
          <Sl label="Average customer value" value={val} set={setVal} min={100} max={50000} step={100} fmt={v=>`$${v.toLocaleString()}`}/>
          <Sl label="Lead-to-customer conversion" value={conv} set={setConv} min={5} max={80} fmt={v=>`${v}%`}/>
        </div>
        <div>
          <div style={{background:"linear-gradient(135deg,rgba(99,102,241,0.12),rgba(99,102,241,0.04))",border:"1px solid rgba(99,102,241,0.26)",borderRadius:14,padding:isMobile?20:28,textAlign:"center",marginBottom:14,animation:"glow 3s infinite"}}>
            <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:8}}>ANNUAL RECOVERY POTENTIAL</div>
            <div style={{fontSize:isMobile?"40px":"52px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1}}>{fmt$(annual)}</div>
            <div style={{fontSize:12,color:W.textSub,marginTop:8}}>in revenue recoverable with Veridian</div>
          </div>
          {[{l:"Missed calls/month",v:missed.toLocaleString()},{l:"Revenue lost monthly",v:fmt$(lostMo),c:W.red},{l:"Recovery potential (68%)",v:fmt$(recMo),c:W.green}].map((r,i)=>(
            <div key={i} style={{background:W.bgAlt,border:`1px solid ${W.border}`,borderRadius:10,padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:12,color:W.textSub}}>{r.l}</span>
              <span style={{fontSize:15,fontWeight:800,color:r.c||W.text}}>{r.v}</span>
            </div>
          ))}
          <a href="/#contact" onClick={()=>{Object.assign(_lead,{calls,miss,val,conv,missed,lostMo,recMo,annual});window.dispatchEvent(new CustomEvent("veridian:calcdata",{detail:{..._lead}}));}} className="vd-btn" style={{display:"block",background:W.accent,color:"#fff",padding:"14px",borderRadius:10,fontSize:14,fontWeight:700,textDecoration:"none",textAlign:"center",marginTop:14}}>Get My Recovery Plan</a>
        </div>
      </div>
    </div>
  );
}

const INDUSTRY_DATA={
  "security":{
    name:"Security Companies",
    headline:"Stop Losing Patrol Contracts to Competitors Who Answer First",
    problem:"Every missed call from a prospect could be a multi-year patrol contract walking to a competitor. Security buyers call multiple companies — the first to respond almost always wins the bid.",
    loss:"The average commercial security contract is worth $3,500–$18,000 per year. Losing even two bids per month to unanswered calls represents $84,000 or more in annual revenue loss.",
    solution:"Veridian answers every prospect call, collects their property details, and schedules a site assessment — even when your team is on patrol or unavailable. Every lead gets an immediate, professional response.",
    roi:"Security companies using Veridian recover an average of 68% of calls that previously went unanswered — with no additional headcount.",
    outcomes:["Immediate response to every inquiry — 24/7","Site assessment scheduling without dispatcher involvement","Patrol bid follow-up automation","Existing client service request capture"],
  },
  "property-management":{
    name:"Property Management",
    headline:"Answer Every Maintenance Call and Tenant Inquiry — Automatically",
    problem:"Property managers handle hundreds of inbound calls daily — maintenance requests, lease inquiries, showings, and complaints. After hours, on weekends, or when staff is overwhelmed, calls go to voicemail. Tenants don't leave voicemails. They leave.",
    loss:"A single tenant vacancy costs an average of $1,750 per month in lost rent, plus turnover costs. Poor responsiveness is the leading driver of tenant non-renewal.",
    solution:"Veridian captures every after-hours maintenance request, qualifies showing inquiries, and routes urgent calls immediately — reducing tenant frustration and accelerating lease conversions.",
    roi:"Property management companies report 40% fewer tenant complaints and faster lease-up rates after implementing Veridian's automated response system.",
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

function IndustryPage({sector,isMobile}){
  const d=INDUSTRY_DATA[sector];
  if(!d)return<div style={{minHeight:"100vh",background:W.bg,display:"flex",alignItems:"center",justifyContent:"center",paddingTop:80}}><div style={{textAlign:"center"}}><div style={{fontSize:18,color:W.textSub,marginBottom:16}}>Industry page not found.</div><a href="/" style={{color:W.accent,textDecoration:"none"}}>Back to home</a></div></div>;
  const siblings=Object.entries(INDUSTRY_DATA).filter(([k])=>k!==sector);
  return(
    <div style={{minHeight:"100vh",background:W.bg}}>
      {/* Hero */}
      <section style={{padding:isMobile?"120px 24px 64px":"150px 56px 80px",background:W.bgAlt,borderBottom:`1px solid ${W.border}`}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{marginBottom:20}}><a href="/industries/security" style={{fontSize:12,color:W.textSub,textDecoration:"none"}} className="vd-lk">Industries</a><span style={{color:W.textDim,margin:"0 8px"}}>/</span><span style={{fontSize:12,color:W.textDim}}>{d.name}</span></div>
          <SLabel>{d.name.toUpperCase()}</SLabel>
          <h1 style={{fontSize:isMobile?"36px":"64px",fontWeight:900,color:W.text,letterSpacing:"-0.035em",lineHeight:1.05,marginBottom:24}}>{d.headline}</h1>
          <p style={{fontSize:isMobile?"16px":"20px",color:W.textSub,lineHeight:1.7,maxWidth:700}}>{d.problem}</p>
        </div>
      </section>
      <div style={{maxWidth:1000,margin:"0 auto",padding:isMobile?"40px 24px":"80px 56px"}}>
        {/* Revenue Loss */}
        <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:16,padding:isMobile?24:36,marginBottom:48}}>
          <div style={{fontSize:12,fontWeight:700,color:W.red,letterSpacing:"0.08em",marginBottom:12}}>REVENUE AT RISK</div>
          <p style={{fontSize:isMobile?"15px":"18px",color:W.text,lineHeight:1.7}}>{d.loss}</p>
        </div>
        <IndustryCalculator sector={sector} isMobile={isMobile}/>
        {/* Solution */}
        <div style={{marginBottom:48}}>
          <div style={{fontSize:12,fontWeight:700,color:W.accent,letterSpacing:"0.08em",marginBottom:16}}>THE VERIDIAN SOLUTION</div>
          <p style={{fontSize:isMobile?"16px":"19px",color:W.textSub,lineHeight:1.75,marginBottom:28}}>{d.solution}</p>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
            {d.outcomes.map((o,i)=>(
              <div key={i} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:12,padding:"16px 20px",display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:W.greenB,border:`1px solid rgba(16,185,129,0.25)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}><Check size={11} style={{color:W.green}}/></div>
                <span style={{fontSize:13,color:W.textSub,lineHeight:1.5}}>{o}</span>
              </div>
            ))}
          </div>
        </div>
        {/* ROI */}
        <div style={{background:"linear-gradient(135deg,rgba(16,185,129,0.1),rgba(16,185,129,0.04))",border:"1px solid rgba(16,185,129,0.22)",borderRadius:16,padding:isMobile?24:36,marginBottom:64,textAlign:"center"}}>
          <div style={{fontSize:12,fontWeight:700,color:W.green,letterSpacing:"0.08em",marginBottom:12}}>RESULTS</div>
          <p style={{fontSize:isMobile?"17px":"21px",color:W.text,lineHeight:1.65,fontWeight:500}}>{d.roi}</p>
        </div>
        {/* CTA */}
        <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?28:44,textAlign:"center",marginBottom:64}}>
          <div style={{fontSize:20,fontWeight:800,color:W.text,marginBottom:12}}>Ready to stop losing revenue to missed calls?</div>
          <p style={{fontSize:15,color:W.textSub,marginBottom:28}}>See exactly how much Veridian recovers for {d.name.toLowerCase()}.</p>
          <a href="/#contact" className="vd-btn" style={{display:"inline-block",background:W.accent,color:"#fff",padding:"15px 32px",borderRadius:10,fontSize:15,fontWeight:700,textDecoration:"none",marginRight:12}}>Get Started</a>
          <a href="/#calculator" className="vd-ghost" style={{display:"inline-block",background:"none",border:`1.5px solid ${W.border}`,color:W.text,padding:"14px 30px",borderRadius:10,fontSize:15,fontWeight:600,textDecoration:"none"}}>Calculate My Recovery</a>
        </div>
        {/* Other Industries */}
        <div>
          <div style={{fontSize:12,fontWeight:700,color:W.textDim,letterSpacing:"0.08em",marginBottom:20}}>OTHER INDUSTRIES</div>
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
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// REVENUE DASHBOARD (internal — /dashboard)
// ═══════════════════════════════════════════════════════════════════
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
    setLeads(data.leads||[]);
    setConfigured(data.configured!==false);
    return data;
  };
  const fetchFuStats=async(p)=>{
    try{const r=await fetch("/api/follow-up",{headers:{Authorization:`Bearer ${p}`}});if(r.ok){const d=await r.json();setFuStats(d.stats||null);}}catch{}
  };
  const tryAuth=async e=>{
    e.preventDefault();setFetching(true);setAuthErr(null);
    const data=await fetchLeads(pin);
    if(!data){setAuthErr("Incorrect PIN.");setFetching(false);return;}
    setAuthed(true);setFetching(false);
    fetchFuStats(pin);
  };
  const refresh=async()=>{await fetchLeads(pin);fetchFuStats(pin);};
  const updateStatus=async(leadId,action,value)=>{
    setUpdatingId(leadId);
    await fetch("/api/leads",{method:"PATCH",headers:{Authorization:`Bearer ${pin}`,"Content-Type":"application/json"},body:JSON.stringify({leadId,action,value})});
    await fetchLeads(pin);
    setUpdatingId(null);
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
          <input type="password" value={pin} onChange={e=>setPin(e.target.value)} placeholder="PIN" style={{width:"100%",background:W.bgAlt,border:`1px solid ${W.border}`,borderRadius:8,padding:"12px 14px",color:W.text,fontSize:18,outline:"none",marginBottom:12,textAlign:"center",letterSpacing:"0.3em"}}/>
          {authErr&&<div style={{fontSize:12,color:W.red,marginBottom:10}}>{authErr}</div>}
          <button type="submit" disabled={fetching} className="vd-btn" style={{width:"100%",background:W.accent,color:"#fff",border:"none",borderRadius:9,padding:"13px",fontSize:14,fontWeight:700,cursor:"pointer"}}>
            {fetching?"Connecting...":"Access Command Center"}
          </button>
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
          <button onClick={refresh} style={{background:W.accentB,border:`1px solid rgba(99,102,241,0.22)`,borderRadius:9,padding:"9px 18px",fontSize:13,fontWeight:600,color:W.accent,cursor:"pointer"}}>Refresh</button>
        </div>
        {/* 9-Metric Grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}}>
          {metrics.map((m,i)=>(
            <div key={i} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:14,padding:22}}>
              <div style={{fontSize:10,color:W.textDim,fontWeight:700,letterSpacing:"0.06em",marginBottom:8}}>{m.l.toUpperCase()}</div>
              <div style={{fontSize:30,fontWeight:900,color:m.c||W.text,letterSpacing:"-0.03em",lineHeight:1,marginBottom:4}}>{m.v}</div>
              <div style={{fontSize:11,color:W.textDim}}>{m.sub}</div>
            </div>
          ))}
        </div>
        {/* Follow-Up Queue Status */}
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
        {/* Lead Pipeline */}
        <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:16,overflow:"hidden"}}>
          <div style={{padding:"16px 24px",borderBottom:`1px solid ${W.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:14,fontWeight:700,color:W.text}}>Lead Pipeline</div>
            <div style={{fontSize:12,color:W.textDim}}>{total} leads</div>
          </div>
          {leads.length===0?(
            <div style={{padding:"40px 24px",textAlign:"center"}}>
              <div style={{fontSize:14,color:W.textSub,marginBottom:8}}>{configured?"No leads yet.":"Vercel KV not configured."}</div>
              <div style={{fontSize:12,color:W.textDim,lineHeight:1.7,whiteSpace:"pre-line"}}>{configured?"Leads will appear here once the contact form receives submissions.":"Add Vercel KV: Dashboard → Storage → Create KV Database → Connect to project.\nSet KV_REST_API_URL + KV_REST_API_TOKEN in env vars."}</div>
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
                    {l.proposalSent&&!l.clientWon&&<span style={{fontSize:10,color:W.amber,fontWeight:700,padding:"2px 6px",borderRadius:4,background:"rgba(245,158,11,0.1)"}}>PROPOSAL</span>}
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
          <div style={{background:"rgba(99,102,241,0.06)",border:`1px solid rgba(99,102,241,0.18)`,borderRadius:14,padding:22,marginTop:18}}>
            <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.06em",marginBottom:10}}>SETUP REQUIRED</div>
            <div style={{fontSize:13,color:W.textSub,lineHeight:1.8}}>
              1. Vercel Dashboard → Storage → Create KV Database → Connect project (auto-sets KV_REST_API_URL + KV_REST_API_TOKEN)<br/>
              2. Set DASH_PIN, RESEND_API_KEY, TEAM_EMAIL, FROM_DOMAIN in Vercel env vars<br/>
              3. Set CRON_SECRET — Vercel Cron sends follow-ups daily at 9 AM UTC (Vercel Pro required)<br/>
              4. Set GOHIGHLEVEL_API_KEY + GOHIGHLEVEL_LOCATION_ID for CRM sync<br/>
              5. Optional: GOHIGHLEVEL_PIPELINE_ID + GOHIGHLEVEL_STAGE_ID for auto-opportunities<br/>
              6. Set ANTHROPIC_API_KEY for AI recovery plan generation
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// WEBSITE ROOT — ROUTING
// ═══════════════════════════════════════════════════════════════════
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
  // Set page-specific title
  useEffect(()=>{
    if(path==="/enterprise"){document.title="Enterprise Readiness — Veridian";}
    else if(path.startsWith("/industries/")){
      const sector=path.replace("/industries/","");
      const d=INDUSTRY_DATA[sector];
      document.title=d?`${d.name} — Veridian`:"Industries — Veridian";
    }else{document.title="Veridian — Stop Losing Customers to Missed Calls";}
  },[path]);
  const sector=path.startsWith("/industries/")?path.replace("/industries/",""):null;
  return(
    <div style={{background:W.bg,color:W.text,minHeight:"100vh",paddingBottom:isMobile?80:0}}>
      <WebNav isMobile={isMobile} page={path==="/enterprise"?"enterprise":sector?"industry":"home"}/>
      <div style={{paddingTop:0}}>
        {path==="/enterprise"&&<EnterprisePage isMobile={isMobile}/>}
        {path==="/dashboard"&&<DashboardPage/>}
        {sector&&<IndustryPage sector={sector} isMobile={isMobile}/>}
        {!path.startsWith("/industries/")&&path!=="/enterprise"&&path!=="/dashboard"&&<Homepage isMobile={isMobile}/>}
      </div>
      <WebFooter isMobile={isMobile}/>
      {isMobile&&<StickyMobileCTA/>}
    </div>
  );
}
