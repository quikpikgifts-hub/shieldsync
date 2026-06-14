import React,{useState,useEffect,useRef}from"react";
import{Phone,MessageSquare,Calendar,CheckCircle,X,Menu,ChevronDown,Shield,Clock,Users,Globe,Award,TrendingUp,Zap,ChevronRight}from"lucide-react";

const W={
  bg:"#06060F",bgAlt:"#0A0A18",card:"#0E0E20",cardH:"#121228",
  border:"#1A1A32",borderH:"#262644",
  accent:"#6366F1",accentH:"#4F46E5",accentB:"rgba(99,102,241,0.1)",accentGlow:"rgba(99,102,241,0.18)",
  green:"#10B981",greenB:"rgba(16,185,129,0.12)",
  red:"#EF4444",redB:"rgba(239,68,68,0.12)",
  amber:"#F59E0B",
  text:"#F1F5F9",textSub:"#8892A6",textDim:"#424F62",
};

const WCSS=`*{box-sizing:border-box;margin:0;padding:0;}body{background:#06060F;color:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;}::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:#1A1A32;border-radius:3px;}html{scroll-behavior:smooth;}input,textarea{font-family:inherit;}@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}@keyframes glow{0%,100%{box-shadow:0 0 30px rgba(99,102,241,0.08)}50%{box-shadow:0 0 60px rgba(99,102,241,0.2)}}@keyframes slideR{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}@keyframes ring{0%{transform:rotate(-12deg)}25%{transform:rotate(12deg)}50%{transform:rotate(-8deg)}75%{transform:rotate(8deg)}100%{transform:rotate(0)}}@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}.vd-btn{transition:all 0.15s ease;}.vd-btn:hover{opacity:0.88;transform:translateY(-1px);}.vd-ghost{transition:all 0.15s ease;}.vd-ghost:hover{border-color:#6366F1!important;color:#6366F1!important;}.vd-nl:hover{color:#F1F5F9!important;}.vd-card{transition:all 0.2s ease;}.vd-card:hover{border-color:#262644!important;transform:translateY(-3px);}.vd-link:hover{color:#6366F1!important;}`;

const fmtN=(v)=>v.toLocaleString();
const fmtM=(n)=>n>=1000?`$${(n/1000).toFixed(1)}K`:`$${n}`;

// ── Nav ──────────────────────────────────────────────────────────
function WebNav({isMobile}){
  const[scrolled,setScrolled]=useState(false);
  const[open,setOpen]=useState(false);
  useEffect(()=>{
    const h=()=>setScrolled(window.scrollY>40);
    window.addEventListener("scroll",h,{passive:true});
    return()=>window.removeEventListener("scroll",h);
  },[]);
  const links=[{l:"Solutions",h:"#solutions"},{l:"Demo",h:"#demo"},{l:"Revenue Calculator",h:"#calculator"},{l:"Contact",h:"#contact"}];
  return(
    <>
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,padding:isMobile?"14px 20px":"16px 48px",display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all 0.2s ease",background:scrolled?"rgba(6,6,15,0.96)":W.bg,borderBottom:scrolled?`1px solid ${W.border}`:"1px solid transparent",backdropFilter:scrolled?"blur(16px)":"none"}}>
        <a href="/" style={{textDecoration:"none",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,background:W.accent,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{color:"#fff",fontWeight:900,fontSize:15,letterSpacing:"-0.04em"}}>V</span>
          </div>
          <span style={{fontSize:17,fontWeight:800,color:W.text,letterSpacing:"-0.02em"}}>Veridian</span>
        </a>
        {!isMobile&&<div style={{display:"flex",gap:32}}>{links.map(l=><a key={l.l} href={l.h} className="vd-nl" style={{color:W.textSub,fontSize:14,fontWeight:500,textDecoration:"none",transition:"color 0.15s"}}>{l.l}</a>)}</div>}
        {!isMobile&&<a href="#contact" className="vd-btn" style={{background:W.accent,color:"#fff",padding:"10px 22px",borderRadius:8,fontSize:14,fontWeight:600,textDecoration:"none"}}>Get Started</a>}
        {isMobile&&<button onClick={()=>setOpen(true)} style={{background:"none",border:`1px solid ${W.border}`,borderRadius:8,padding:"8px 11px",color:W.text,cursor:"pointer",display:"flex",alignItems:"center"}}><Menu size={18}/></button>}
      </nav>
      {isMobile&&open&&(
        <div style={{position:"fixed",inset:0,zIndex:200,background:W.bg,display:"flex",flexDirection:"column",padding:"20px 24px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:48}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:30,height:30,background:W.accent,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontWeight:900,fontSize:15}}>V</span></div>
              <span style={{fontSize:17,fontWeight:800,color:W.text}}>Veridian</span>
            </div>
            <button onClick={()=>setOpen(false)} style={{background:"none",border:`1px solid ${W.border}`,borderRadius:8,padding:"8px 11px",color:W.textSub,cursor:"pointer"}}><X size={18}/></button>
          </div>
          <div style={{flex:1}}>
            {links.map(l=><a key={l.l} href={l.h} onClick={()=>setOpen(false)} style={{display:"block",fontSize:26,fontWeight:700,color:W.text,textDecoration:"none",padding:"18px 0",borderBottom:`1px solid ${W.border}`}}>{l.l}</a>)}
          </div>
          <a href="#contact" onClick={()=>setOpen(false)} className="vd-btn" style={{display:"block",background:W.accent,color:"#fff",padding:"17px",borderRadius:12,fontSize:16,fontWeight:700,textDecoration:"none",textAlign:"center",marginTop:32}}>Get Started</a>
        </div>
      )}
    </>
  );
}

// ── Hero ─────────────────────────────────────────────────────────
function Hero({isMobile}){
  return(
    <section style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",position:"relative",overflow:"hidden",padding:isMobile?"120px 24px 80px":"140px 48px 100px"}}>
      <div style={{position:"absolute",top:"35%",left:"50%",transform:"translate(-50%,-50%)",width:isMobile?360:800,height:isMobile?360:800,background:"radial-gradient(circle,rgba(99,102,241,0.07) 0%,transparent 68%)",pointerEvents:"none"}}/>
      <div style={{maxWidth:1200,margin:"0 auto",width:"100%",position:"relative",zIndex:1}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:W.accentB,border:"1px solid rgba(99,102,241,0.25)",borderRadius:100,padding:"6px 14px",marginBottom:36}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:W.green,animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:12,fontWeight:600,color:W.accent,letterSpacing:"0.05em"}}>MISSED CALL RECOVERY & AUTOMATION</span>
        </div>
        <h1 style={{fontSize:isMobile?"42px":"80px",fontWeight:900,color:W.text,lineHeight:1.03,letterSpacing:"-0.035em",marginBottom:28,maxWidth:940}}>
          Stop Losing Customers<br/><span style={{color:W.accent}}>to Missed Calls</span>
        </h1>
        <p style={{fontSize:isMobile?"17px":"21px",color:W.textSub,lineHeight:1.65,maxWidth:600,marginBottom:48,fontWeight:400}}>
          Veridian captures missed calls, automates follow-up, books appointments, and recovers revenue — automatically.
        </p>
        <div style={{display:"flex",gap:14,flexWrap:"wrap",alignItems:"center",marginBottom:56}}>
          <a href="#calculator" className="vd-btn" style={{background:W.accent,color:"#fff",padding:isMobile?"14px 28px":"16px 34px",borderRadius:10,fontSize:isMobile?"15px":"16px",fontWeight:700,textDecoration:"none",letterSpacing:"-0.01em"}}>Calculate Lost Revenue</a>
          <a href="#demo" className="vd-ghost" style={{background:"none",border:`1.5px solid ${W.border}`,color:W.text,padding:isMobile?"13px 26px":"15px 32px",borderRadius:10,fontSize:isMobile?"15px":"16px",fontWeight:600,textDecoration:"none"}}>Watch Live Demo</a>
        </div>
        <div style={{display:"flex",gap:40,flexWrap:"wrap"}}>
          {[{n:"68%",l:"of missed calls recovered"},{n:"< 60s",l:"automated response time"},{n:"10+",l:"years operational experience"}].map(s=>(
            <div key={s.l}>
              <div style={{fontSize:isMobile?"22px":"27px",fontWeight:800,color:W.text,letterSpacing:"-0.02em"}}>{s.n}</div>
              <div style={{fontSize:12,color:W.textSub,marginTop:3}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{position:"absolute",bottom:36,left:"50%",transform:"translateX(-50%)",animation:"bounce 2s infinite"}}><ChevronDown size={20} style={{color:W.textDim}}/></div>
    </section>
  );
}

// ── Stats Bar ─────────────────────────────────────────────────────
function StatsBar({isMobile}){
  const s=[{v:"68%",l:"Missed Call Recovery Rate"},{v:"60s",l:"Average Response Time"},{v:"10+",l:"Years of Experience"},{v:"24/7",l:"Human + Technology Support"}];
  return(
    <section style={{background:W.bgAlt,borderTop:`1px solid ${W.border}`,borderBottom:`1px solid ${W.border}`,padding:"36px 48px"}}>
      <div style={{maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:isMobile?28:0}}>
        {s.map((item,i)=>(
          <div key={i} style={{textAlign:"center",padding:"0 20px",borderRight:!isMobile&&i<3?`1px solid ${W.border}`:"none"}}>
            <div style={{fontSize:isMobile?"30px":"40px",fontWeight:900,color:W.text,letterSpacing:"-0.03em",lineHeight:1}}>{item.v}</div>
            <div style={{fontSize:12,color:W.textSub,marginTop:6,fontWeight:500}}>{item.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Auto-Play Demo ────────────────────────────────────────────────
const DSTEPS=[
  {label:"Customer Calls",detail:"Incoming call from a new prospect",color:"#3B82F6",screen:"call"},
  {label:"No Answer",detail:"Call goes unanswered — no voicemail left",color:"#EF4444",screen:"miss"},
  {label:"Instant Text Sent",detail:"Veridian responds automatically within 60 seconds",color:W.accent,screen:"out"},
  {label:"Customer Responds",detail:"68% of prospects reply within 10 minutes",color:"#8B5CF6",screen:"in"},
  {label:"Appointment Booked",detail:"Calendar confirmed — no manual work required",color:"#10B981",screen:"book"},
  {label:"Revenue Recovered",detail:"Lead converted. Customer retained.",color:"#10B981",screen:"win"},
];

function PhoneScreen({step}){
  const s=DSTEPS[step];
  return(
    <div style={{width:256,background:"#08080F",border:"8px solid #181830",borderRadius:40,overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.55),0 0 0 1px rgba(255,255,255,0.04)",minHeight:500,display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{background:"#08080F",padding:"18px 20px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11,color:W.textSub,fontWeight:600}}>
        <span>9:41</span><span>●●●● 100%</span>
      </div>
      <div key={step} style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"20px 18px",animation:"fadeIn 0.3s ease"}}>
        {s.screen==="call"&&(
          <div style={{textAlign:"center"}}>
            <div style={{width:76,height:76,borderRadius:"50%",background:"rgba(59,130,246,0.12)",border:"2px solid rgba(59,130,246,0.4)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",animation:"ring 0.9s ease 0.3s"}}>
              <Phone size={30} style={{color:"#3B82F6"}}/>
            </div>
            <div style={{fontSize:11,color:W.textSub,letterSpacing:"0.1em",marginBottom:8}}>INCOMING CALL</div>
            <div style={{fontSize:17,fontWeight:700,color:W.text,marginBottom:4}}>+1 (555) 847-2291</div>
            <div style={{fontSize:12,color:W.textSub,marginBottom:28}}>Unknown Caller</div>
            <div style={{display:"flex",gap:14,justifyContent:"center"}}>
              <div style={{width:54,height:54,borderRadius:"50%",background:"#EF4444",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={20} style={{color:"#fff"}}/></div>
              <div style={{width:54,height:54,borderRadius:"50%",background:"#10B981",display:"flex",alignItems:"center",justifyContent:"center"}}><Phone size={20} style={{color:"#fff"}}/></div>
            </div>
          </div>
        )}
        {s.screen==="miss"&&(
          <div style={{textAlign:"center"}}>
            <div style={{width:76,height:76,borderRadius:"50%",background:W.redB,border:"2px solid rgba(239,68,68,0.35)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
              <Phone size={30} style={{color:"#EF4444"}}/>
            </div>
            <div style={{fontSize:11,color:"#EF4444",letterSpacing:"0.1em",marginBottom:8}}>MISSED CALL</div>
            <div style={{fontSize:17,fontWeight:700,color:W.text,marginBottom:4}}>+1 (555) 847-2291</div>
            <div style={{fontSize:12,color:W.textSub,marginBottom:20}}>Just now</div>
            <div style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:10,padding:"12px 14px",fontSize:12,color:W.textSub,lineHeight:1.55}}>
              73% of callers never leave a voicemail. Without follow-up, this revenue is gone.
            </div>
          </div>
        )}
        {(s.screen==="out"||s.screen==="in")&&(
          <div>
            <div style={{fontSize:11,color:W.textSub,textAlign:"center",marginBottom:16,letterSpacing:"0.08em"}}>MESSAGES</div>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:6}}>
              <div style={{background:W.accent,borderRadius:"16px 16px 4px 16px",padding:"10px 14px",maxWidth:"85%",fontSize:12,color:"#fff",lineHeight:1.55}}>Hi! We're sorry we missed your call. Are you still looking for a quote?</div>
            </div>
            <div style={{fontSize:10,color:W.textDim,textAlign:"right",marginBottom:14}}>Veridian · 60 seconds ago</div>
            {s.screen==="in"&&(
              <>
                <div style={{display:"flex",justifyContent:"flex-start",marginBottom:6,animation:"slideR 0.3s ease"}}>
                  <div style={{background:"#1A1A32",borderRadius:"16px 16px 16px 4px",padding:"10px 14px",maxWidth:"85%",fontSize:12,color:W.text,lineHeight:1.55}}>Yes! I need a quote for commercial services.</div>
                </div>
                <div style={{fontSize:10,color:W.textDim}}>Customer · Just now</div>
              </>
            )}
          </div>
        )}
        {s.screen==="book"&&(
          <div style={{textAlign:"center"}}>
            <div style={{width:76,height:76,borderRadius:"50%",background:W.greenB,border:"2px solid rgba(16,185,129,0.35)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
              <Calendar size={30} style={{color:"#10B981"}}/>
            </div>
            <div style={{fontSize:11,color:"#10B981",letterSpacing:"0.1em",marginBottom:8}}>CONFIRMED</div>
            <div style={{fontSize:16,fontWeight:700,color:W.text,marginBottom:4}}>Wednesday, June 18</div>
            <div style={{fontSize:14,color:W.textSub,marginBottom:20}}>2:00 PM — 3:00 PM</div>
            <div style={{background:W.greenB,border:"1px solid rgba(16,185,129,0.2)",borderRadius:10,padding:"11px",fontSize:12,color:W.textSub}}>Confirmation sent automatically</div>
          </div>
        )}
        {s.screen==="win"&&(
          <div style={{textAlign:"center"}}>
            <div style={{width:76,height:76,borderRadius:"50%",background:W.greenB,border:"2px solid rgba(16,185,129,0.4)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",animation:"glow 2s infinite"}}>
              <CheckCircle size={30} style={{color:"#10B981"}}/>
            </div>
            <div style={{fontSize:11,color:"#10B981",letterSpacing:"0.1em",marginBottom:8}}>REVENUE RECOVERED</div>
            <div style={{fontSize:24,fontWeight:900,color:W.text,marginBottom:4}}>$2,400</div>
            <div style={{fontSize:12,color:W.textSub,marginBottom:20}}>Service opportunity captured</div>
            {[{l:"Response time",v:"4 minutes",c:"#10B981"},{l:"Without Veridian",v:"Lost",c:"#EF4444"}].map((r,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderTop:`1px solid ${W.border}`}}>
                <span style={{fontSize:11,color:W.textSub}}>{r.l}</span>
                <span style={{fontSize:11,color:r.c,fontWeight:700}}>{r.v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AutoDemo({isMobile}){
  const[step,setStep]=useState(0);
  const[paused,setPaused]=useState(false);
  const tRef=useRef(null);
  useEffect(()=>{
    if(paused)return;
    tRef.current=setTimeout(()=>setStep(s=>(s+1)%DSTEPS.length),3000);
    return()=>clearTimeout(tRef.current);
  },[step,paused]);
  const pick=(i)=>{setStep(i);setPaused(true);setTimeout(()=>setPaused(false),9000);};
  return(
    <section id="demo" style={{padding:isMobile?"64px 24px":"100px 48px",background:W.bgAlt}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?40:64}}>
          <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:16}}>LIVE SIMULATION</div>
          <h2 style={{fontSize:isMobile?"30px":"54px",fontWeight:900,color:W.text,letterSpacing:"-0.03em",lineHeight:1.06,marginBottom:16}}>
            See Revenue Recovery<br/>In Real Time
          </h2>
          <p style={{fontSize:isMobile?"15px":"18px",color:W.textSub,maxWidth:520,margin:"0 auto",lineHeight:1.65}}>
            A customer calls. Nobody answers. Veridian takes over — and recovers the revenue automatically.
          </p>
        </div>
        <div style={{display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:isMobile?32:80,alignItems:"center"}}>
          {/* Steps */}
          <div>
            {DSTEPS.map((s,i)=>(
              <div key={i} onClick={()=>pick(i)} style={{display:"flex",gap:16,alignItems:"flex-start",padding:"14px 0",cursor:"pointer",opacity:i===step?1:0.38,transition:"opacity 0.25s ease",borderBottom:i<DSTEPS.length-1?`1px solid ${W.border}`:"none"}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:i===step?DSTEPS[i].color:"transparent",border:`2px solid ${i===step?DSTEPS[i].color:W.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.25s ease"}}>
                  <span style={{fontSize:12,fontWeight:700,color:i===step?"#fff":W.textDim}}>{i+1}</span>
                </div>
                <div style={{paddingTop:5}}>
                  <div style={{fontSize:14,fontWeight:700,color:i===step?W.text:W.textSub,marginBottom:2}}>{s.label}</div>
                  <div style={{fontSize:12,color:W.textDim}}>{s.detail}</div>
                </div>
              </div>
            ))}
            <div style={{marginTop:20,height:3,background:W.border,borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${((step+1)/DSTEPS.length)*100}%`,background:W.accent,transition:"width 0.4s ease",borderRadius:2}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:7}}>
              <span style={{fontSize:11,color:W.textDim}}>Step {step+1} of {DSTEPS.length}</span>
              <span style={{fontSize:11,color:W.textDim}}>Auto-advancing every 3s</span>
            </div>
          </div>
          {/* Phone */}
          <div style={{display:"flex",justifyContent:"center"}}>
            <PhoneScreen step={step}/>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Revenue Calculator ────────────────────────────────────────────
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
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontSize:13,color:W.textSub,fontWeight:500}}>{label}</span>
        <span style={{fontSize:14,fontWeight:700,color:W.text}}>{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e=>set(Number(e.target.value))} style={{width:"100%",accentColor:W.accent,cursor:"pointer",height:4}}/>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
        <span style={{fontSize:10,color:W.textDim}}>{fmt(min)}</span>
        <span style={{fontSize:10,color:W.textDim}}>{fmt(max)}</span>
      </div>
    </div>
  );
  return(
    <section id="calculator" style={{padding:isMobile?"64px 24px":"100px 48px",background:W.bg}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?40:64}}>
          <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:16}}>REVENUE CALCULATOR</div>
          <h2 style={{fontSize:isMobile?"30px":"54px",fontWeight:900,color:W.text,letterSpacing:"-0.03em",lineHeight:1.06,marginBottom:16}}>
            How Much Revenue<br/>Are You Losing?
          </h2>
          <p style={{fontSize:isMobile?"15px":"18px",color:W.textSub,maxWidth:520,margin:"0 auto"}}>Enter your numbers. See your monthly and annual revenue recovery potential.</p>
        </div>
        <div style={{display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:28,alignItems:"start"}}>
          <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?24:36}}>
            <div style={{fontSize:14,fontWeight:700,color:W.text,marginBottom:28}}>Your Business Numbers</div>
            <Sl label="Monthly incoming calls" value={calls} set={setCalls} min={50} max={2000} step={50} fmt={v=>fmtN(v)}/>
            <Sl label="Estimated missed call rate" value={miss} set={setMiss} min={5} max={60} fmt={v=>`${v}%`}/>
            <Sl label="Average customer value" value={val} set={setVal} min={100} max={10000} step={100} fmt={v=>`$${fmtN(v)}`}/>
            <Sl label="Lead-to-customer conversion rate" value={conv} set={setConv} min={10} max={80} fmt={v=>`${v}%`}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{background:"linear-gradient(135deg,rgba(99,102,241,0.14),rgba(99,102,241,0.05))",border:"1px solid rgba(99,102,241,0.28)",borderRadius:20,padding:isMobile?24:36,textAlign:"center",animation:"glow 3s infinite"}}>
              <div style={{fontSize:12,fontWeight:700,color:W.accent,letterSpacing:"0.08em",marginBottom:12}}>ANNUAL RECOVERY POTENTIAL</div>
              <div style={{fontSize:isMobile?"48px":"64px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1}}>{fmtM(annual)}</div>
              <div style={{fontSize:13,color:W.textSub,marginTop:10}}>in revenue you're currently leaving behind</div>
            </div>
            {[
              {l:"Missed calls per month",v:fmtN(missed),s:"going unanswered"},
              {l:"Missed opportunities",v:fmtN(opps),s:"potential customers lost"},
              {l:"Monthly revenue lost",v:fmtM(lostMo),c:"#EF4444"},
              {l:"Monthly revenue recovered",v:fmtM(recMo),c:"#10B981",s:"with Veridian (68% recovery rate)"},
            ].map((r,i)=>(
              <div key={i} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:14,padding:"18px 22px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13,color:W.textSub,fontWeight:500}}>{r.l}</div>
                  {r.s&&<div style={{fontSize:11,color:W.textDim,marginTop:2}}>{r.s}</div>}
                </div>
                <div style={{fontSize:20,fontWeight:800,color:r.c||W.text}}>{r.v}</div>
              </div>
            ))}
            <a href="#contact" className="vd-btn" style={{display:"block",background:W.accent,color:"#fff",padding:"17px",borderRadius:12,fontSize:15,fontWeight:700,textDecoration:"none",textAlign:"center"}}>
              Get My Recovery Plan
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Solutions ─────────────────────────────────────────────────────
function Solutions({isMobile}){
  const sols=[
    {tag:"AI Front Desk",h:"Answer Every Call Even When Nobody Is Available",b:"Veridian's AI Front Desk answers incoming calls, qualifies leads, and routes inquiries 24 hours a day, 7 days a week. Customers never reach voicemail. Every call becomes an opportunity.",pts:["24/7 call coverage","Instant lead qualification","Zero missed opportunities"]},
    {tag:"Follow-Up Automation",h:"Convert More Leads Without Hiring More Staff",b:"Automated follow-up sequences contact leads at exactly the right time, with exactly the right message — from initial inquiry to confirmed appointment. No manual work required.",pts:["Automated text and email sequences","Intelligent timing and personalization","Automatic appointment booking"]},
    {tag:"Missed Call Recovery",h:"Recover Revenue You Didn't Know You Were Losing",b:"Every missed call triggers an immediate, personalized response. Veridian reaches the prospect, qualifies their need, and books the appointment — recovering revenue that would otherwise walk out the door.",pts:["60-second automatic response","68% average recovery rate","Full revenue tracking"]},
  ];
  return(
    <section id="solutions" style={{padding:isMobile?"64px 24px":"100px 48px",background:W.bgAlt}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?40:64}}>
          <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:16}}>SOLUTIONS</div>
          <h2 style={{fontSize:isMobile?"30px":"54px",fontWeight:900,color:W.text,letterSpacing:"-0.03em",lineHeight:1.06}}>
            Three Ways Veridian<br/>Recovers Your Revenue
          </h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:24}}>
          {sols.map((s,i)=>(
            <div key={i} className="vd-card" style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:32,display:"flex",flexDirection:"column"}}>
              <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.08em",marginBottom:16}}>{s.tag}</div>
              <h3 style={{fontSize:isMobile?"18px":"20px",fontWeight:800,color:W.text,lineHeight:1.3,marginBottom:16,letterSpacing:"-0.02em"}}>{s.h}</h3>
              <p style={{fontSize:14,color:W.textSub,lineHeight:1.7,flex:1,marginBottom:24}}>{s.b}</p>
              <div style={{borderTop:`1px solid ${W.border}`,paddingTop:20}}>
                {s.pts.map((p,j)=>(
                  <div key={j} style={{display:"flex",alignItems:"center",gap:10,marginBottom:j<s.pts.length-1?10:0}}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:W.accent,flexShrink:0}}/>
                    <span style={{fontSize:12,color:W.textSub,fontWeight:500}}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Trust ─────────────────────────────────────────────────────────
function Trust({isMobile}){
  const pts=[
    {I:Award,t:"10+ Years of Experience",b:"Built by operators with real-world experience running service businesses — not by technologists guessing at your problems."},
    {I:Users,t:"Human Support, Always",b:"Every client has access to a dedicated support team. Technology handles the automation. Humans handle the relationship."},
    {I:Globe,t:"Nationwide Service",b:"Serving businesses across the country. Local expertise backed by national infrastructure and operations."},
    {I:Clock,t:"Fast Response Guarantee",b:"We respond within the same business day. Your customers deserve fast responses — and so do you."},
    {I:Shield,t:"Business-First Approach",b:"We measure success by your revenue recovery — not by feature counts, platform metrics, or seat licenses."},
    {I:Zap,t:"Technology-Enabled Delivery",b:"Sophisticated automation under the hood. Simple, clear outcomes on your end. No training or software expertise required."},
  ];
  return(
    <section style={{padding:isMobile?"64px 24px":"100px 48px",background:W.bg}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?40:64}}>
          <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:16}}>TRUST</div>
          <h2 style={{fontSize:isMobile?"30px":"54px",fontWeight:900,color:W.text,letterSpacing:"-0.03em",lineHeight:1.06}}>
            Why Businesses Trust Veridian
          </h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:20}}>
          {pts.map((p,i)=>{const Icon=p.I;return(
            <div key={i} className="vd-card" style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:16,padding:28}}>
              <div style={{width:42,height:42,borderRadius:11,background:W.accentB,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:18}}>
                <Icon size={19} style={{color:W.accent}}/>
              </div>
              <div style={{fontSize:15,fontWeight:700,color:W.text,marginBottom:10}}>{p.t}</div>
              <p style={{fontSize:13,color:W.textSub,lineHeight:1.65}}>{p.b}</p>
            </div>
          );})}
        </div>
      </div>
    </section>
  );
}

// ── Founder ───────────────────────────────────────────────────────
function Founder({isMobile}){
  return(
    <section style={{padding:isMobile?"64px 24px":"100px 48px",background:W.bgAlt,borderTop:`1px solid ${W.border}`}}>
      <div style={{maxWidth:860,margin:"0 auto",textAlign:"center"}}>
        <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:24}}>WHY VERIDIAN EXISTS</div>
        <h2 style={{fontSize:isMobile?"28px":"52px",fontWeight:900,color:W.text,letterSpacing:"-0.03em",lineHeight:1.08,marginBottom:32}}>
          Built by Operators.<br/><span style={{color:W.accent}}>Not by Technologists.</span>
        </h2>
        <p style={{fontSize:isMobile?"16px":"19px",color:W.textSub,lineHeight:1.78,marginBottom:28,maxWidth:700,margin:"0 auto 28px"}}>
          Veridian was founded by operators with decades of experience running and scaling service businesses. We watched good companies lose customers — not because of bad service, but because of a missed call, a slow response, or a follow-up that never happened.
        </p>
        <p style={{fontSize:isMobile?"16px":"19px",color:W.textSub,lineHeight:1.78,maxWidth:700,margin:"0 auto 52px"}}>
          We built Veridian to solve exactly those three problems. Not with more staff. Not with complicated software. With intelligent automation that works the way your business works.
        </p>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:20,textAlign:"left"}}>
          {[
            {t:"Missed Revenue",b:"Every unanswered call is revenue walking out the door. Veridian closes that door."},
            {t:"Slow Response",b:"Speed wins customers. Veridian responds in under 60 seconds, every time, automatically."},
            {t:"Poor Follow-Up",b:"Most leads die from neglect. Automated follow-up converts them into paying customers."},
          ].map((m,i)=>(
            <div key={i} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:14,padding:24}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:W.accent,marginBottom:14}}/>
              <div style={{fontSize:14,fontWeight:700,color:W.text,marginBottom:8}}>{m.t}</div>
              <div style={{fontSize:13,color:W.textSub,lineHeight:1.65}}>{m.b}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Results ───────────────────────────────────────────────────────
function Results({isMobile}){
  const stats=[
    {v:"68%",l:"of missed calls recovered",s:"Average across all clients"},
    {v:"< 4 min",l:"average time to first contact",s:"From missed call to live conversation"},
    {v:"10+",l:"years of operational experience",s:"Expertise behind every automation"},
    {v:"24/7",l:"automated coverage",s:"No breaks, no gaps, no missed revenue"},
  ];
  return(
    <section style={{padding:isMobile?"64px 24px":"100px 48px",background:W.bg}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?40:64}}>
          <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:16}}>OUTCOMES</div>
          <h2 style={{fontSize:isMobile?"30px":"54px",fontWeight:900,color:W.text,letterSpacing:"-0.03em",lineHeight:1.06}}>
            The Results Speak<br/>for Themselves
          </h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:20}}>
          {stats.map((s,i)=>(
            <div key={i} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?24:32,textAlign:"center"}}>
              <div style={{fontSize:isMobile?"34px":"50px",fontWeight:900,color:W.accent,letterSpacing:"-0.04em",lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:13,fontWeight:600,color:W.text,marginTop:14,marginBottom:5}}>{s.l}</div>
              <div style={{fontSize:11,color:W.textDim}}>{s.s}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Industries ────────────────────────────────────────────────────
function Industries({isMobile}){
  const inds=[
    {t:"Security Companies",p:"Missed calls from prospects mean lost patrol and guard contracts.",sol:"24/7 call capture with instant follow-up and proposal scheduling.",roi:"Recover lost bid opportunities"},
    {t:"Property Management",p:"Maintenance requests and tenant inquiries go unanswered after hours.",sol:"Automated intake, routing, and appointment scheduling around the clock.",roi:"Reduce tenant churn with faster response"},
    {t:"Contractors",p:"Job site work means missed calls. Missed calls mean lost bids to competitors who answered first.",sol:"Instant text response captures every inquiry while you're on the job.",roi:"Stop losing bids to faster competitors"},
    {t:"Medical Practices",p:"Missed appointment calls lead to empty schedule slots and lost patient revenue.",sol:"Automated booking, confirmation, and re-engagement for no-shows.",roi:"Fill schedule gaps automatically"},
    {t:"Law Firms",p:"Potential clients call once. If nobody answers, they call the next firm on the list.",sol:"Immediate response captures intake and books consultations automatically.",roi:"Convert more inquiries to retained clients"},
  ];
  return(
    <section style={{padding:isMobile?"64px 24px":"100px 48px",background:W.bgAlt}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?40:64}}>
          <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:16}}>INDUSTRIES</div>
          <h2 style={{fontSize:isMobile?"30px":"54px",fontWeight:900,color:W.text,letterSpacing:"-0.03em",lineHeight:1.06,marginBottom:16}}>
            Built for Your Industry
          </h2>
          <p style={{fontSize:isMobile?"15px":"18px",color:W.textSub,maxWidth:500,margin:"0 auto"}}>Revenue recovery challenges differ by industry. Veridian is configured to solve yours.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:20}}>
          {inds.map((ind,i)=>(
            <div key={i} className="vd-card" style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:16,padding:28}}>
              <div style={{fontSize:12,fontWeight:700,color:W.accent,letterSpacing:"0.06em",marginBottom:14}}>{ind.t.toUpperCase()}</div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:600,color:"#EF4444",letterSpacing:"0.04em",marginBottom:6}}>CHALLENGE</div>
                <p style={{fontSize:13,color:W.textSub,lineHeight:1.6}}>{ind.p}</p>
              </div>
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:600,color:W.green,letterSpacing:"0.04em",marginBottom:6}}>SOLUTION</div>
                <p style={{fontSize:13,color:W.textSub,lineHeight:1.6}}>{ind.sol}</p>
              </div>
              <div style={{borderTop:`1px solid ${W.border}`,paddingTop:14}}>
                <span style={{fontSize:12,color:W.accent,fontWeight:600}}>{ind.roi}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Contact ───────────────────────────────────────────────────────
function Contact({isMobile}){
  const[f,setF]=useState({name:"",biz:"",phone:"",email:"",challenge:""});
  const[sent,setSent]=useState(false);
  const[loading,setLoading]=useState(false);
  const sub=async(e)=>{e.preventDefault();setLoading(true);await new Promise(r=>setTimeout(r,1200));setSent(true);setLoading(false);};
  const FI=({label,k,type="text",placeholder=""})=>(
    <div style={{marginBottom:18}}>
      <label style={{fontSize:12,fontWeight:600,color:W.textSub,display:"block",marginBottom:7,letterSpacing:"0.04em"}}>{label}</label>
      <input type={type} value={f[k]} onChange={e=>setF(x=>({...x,[k]:e.target.value}))} placeholder={placeholder}
        style={{width:"100%",background:W.bgAlt,border:`1px solid ${W.border}`,borderRadius:8,padding:"12px 14px",color:W.text,fontSize:14,outline:"none"}}/>
    </div>
  );
  return(
    <section id="contact" style={{padding:isMobile?"64px 24px":"100px 48px",background:W.bg}}>
      <div style={{maxWidth:680,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?40:56}}>
          <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:16}}>CONTACT</div>
          <h2 style={{fontSize:isMobile?"28px":"48px",fontWeight:900,color:W.text,letterSpacing:"-0.03em",lineHeight:1.08,marginBottom:16}}>
            Start Recovering<br/>Revenue Today
          </h2>
          <p style={{fontSize:isMobile?"15px":"17px",color:W.textSub,lineHeight:1.65}}>Tell us about your business and we'll show you exactly how much revenue you're losing — and how to get it back.</p>
        </div>
        {sent?(
          <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?32:48,textAlign:"center"}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:W.greenB,border:`1px solid ${W.green}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
              <CheckCircle size={24} style={{color:W.green}}/>
            </div>
            <div style={{fontSize:20,fontWeight:800,color:W.text,marginBottom:12}}>We'll be in touch shortly</div>
            <div style={{fontSize:14,color:W.textSub,lineHeight:1.65}}>Your information has been received. A member of our team will reach out within one business day with your personalized revenue recovery assessment.</div>
          </div>
        ):(
          <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?24:40}}>
            <form onSubmit={sub}>
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
                <textarea value={f.challenge} onChange={e=>setF(x=>({...x,challenge:e.target.value}))} placeholder="Describe your biggest revenue or customer follow-up challenge..." rows={3}
                  style={{width:"100%",background:W.bgAlt,border:`1px solid ${W.border}`,borderRadius:8,padding:"12px 14px",color:W.text,fontSize:14,outline:"none",resize:"vertical"}}/>
              </div>
              <button type="submit" disabled={loading} className="vd-btn" style={{width:"100%",background:W.accent,color:"#fff",border:"none",borderRadius:10,padding:"17px",fontSize:15,fontWeight:700,cursor:"pointer"}}>
                {loading?"Submitting...":"Get My Free Revenue Assessment"}
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────
function WebFooter({isMobile}){
  return(
    <footer style={{borderTop:`1px solid ${W.border}`,padding:isMobile?"32px 24px":"40px 48px",background:W.bgAlt}}>
      <div style={{maxWidth:1200,margin:"0 auto",display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr auto 1fr",gap:isMobile?24:0,alignItems:"center"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{width:26,height:26,background:W.accent,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:"#fff",fontWeight:900,fontSize:13}}>V</span>
            </div>
            <span style={{fontSize:15,fontWeight:800,color:W.text}}>Veridian</span>
          </div>
          <div style={{fontSize:12,color:W.textDim}}>Revenue Recovery & Business Automation</div>
        </div>
        <div style={{textAlign:"center",display:"flex",flexDirection:"column",gap:7}}>
          <a href="tel:+18005550100" className="vd-link" style={{fontSize:13,color:W.textSub,textDecoration:"none",transition:"color 0.15s"}}>+1 (800) 555-0100</a>
          <a href="mailto:hello@veridian.io" className="vd-link" style={{fontSize:13,color:W.textSub,textDecoration:"none",transition:"color 0.15s"}}>hello@veridian.io</a>
          <div style={{fontSize:12,color:W.textDim}}>Nationwide Service</div>
        </div>
        <div style={{textAlign:isMobile?"left":"right"}}>
          <div style={{fontSize:12,color:W.textDim}}>&copy; {new Date().getFullYear()} Veridian. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}

// ── Website Root ──────────────────────────────────────────────────
export default function Website(){
  const[isMobile,setIsMobile]=useState(window.innerWidth<768);
  useEffect(()=>{
    const style=document.createElement("style");
    style.textContent=WCSS;
    document.head.appendChild(style);
    document.title="Veridian — Stop Losing Customers to Missed Calls";
    const m=document.querySelector('meta[name="description"]');
    if(m)m.content="Veridian captures missed calls, automates follow-up, books appointments, and recovers revenue automatically. Calculate how much you're losing today.";
    const onR=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener("resize",onR,{passive:true});
    return()=>window.removeEventListener("resize",onR);
  },[]);
  return(
    <div style={{background:W.bg,color:W.text,minHeight:"100vh"}}>
      <WebNav isMobile={isMobile}/>
      <Hero isMobile={isMobile}/>
      <StatsBar isMobile={isMobile}/>
      <AutoDemo isMobile={isMobile}/>
      <Calculator isMobile={isMobile}/>
      <Solutions isMobile={isMobile}/>
      <Trust isMobile={isMobile}/>
      <Founder isMobile={isMobile}/>
      <Results isMobile={isMobile}/>
      <Industries isMobile={isMobile}/>
      <Contact isMobile={isMobile}/>
      <WebFooter isMobile={isMobile}/>
    </div>
  );
}
