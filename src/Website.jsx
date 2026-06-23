import React,{useState,useEffect,useRef}from"react";
import{Phone,MessageSquare,Calendar,CheckCircle,X,Menu,ChevronDown,ArrowRight,Lock,Check,ChevronRight,Users,Globe,Award,Clock,Shield,Zap,HelpCircle,TrendingDown,Send,Star,Bot,MessageCircle}from"lucide-react";

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
// CHAT WIDGET — AI CONCIERGE
// ─────────────────────────────────────────────────────────────
function ChatWidget(){
  const GREETING="Hi, I'm Alex from Veridian.\n\nIf your business is missing calls, leads, appointments, or revenue opportunities, tell me what's happening and I'll show you how much revenue may be leaking.";
  const[open,setOpen]=useState(false);
  const[msgs,setMsgs]=useState([{role:"assistant",content:GREETING}]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[showCapture,setShowCapture]=useState(false);
  const[captured,setCaptured]=useState(false);
  const[lead,setLead]=useState({name:"",biz:"",email:"",phone:"",challenge:""});
  const[submitting,setSubmitting]=useState(false);
  const bottomRef=useRef(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,showCapture]);
  const msgCount=msgs.filter(m=>m.role==="user").length;
  const submitLead=async()=>{
    if(!lead.email||submitting)return;
    setSubmitting(true);
    try{
      await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:lead.name,email:lead.email,phone:lead.phone,biz:lead.biz,challenge:lead.challenge||msgs.filter(m=>m.role==="user").map(m=>m.content).join(" / ").slice(0,300)})});
    }catch{}
    setSubmitting(false);
    setCaptured(true);
    setMsgs(m=>[...m,{role:"assistant",content:`Perfect, ${lead.name?lead.name.split(" ")[0]:"I've"} got your details. A Veridian advisor will reach out within 1 business day with your personalized revenue recovery assessment.\n\nReady to move faster? Book your free consultation now.`}]);
  };
  const send=async e=>{
    if(e)e.preventDefault();
    const msg=input.trim();
    if(!msg||loading)return;
    setInput("");
    const next=[...msgs,{role:"user",content:msg}];
    setMsgs(next);
    setLoading(true);
    try{
      const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:msg,history:next.slice(-10)})});
      const d=await r.json();
      const reply=d.reply||"I'd love to help — what's your biggest revenue challenge?";
      setMsgs(m=>[...m,{role:"assistant",content:reply}]);
      if(!showCapture&&!captured&&msgCount>=2){setShowCapture(true);}
    }catch{
      setMsgs(m=>[...m,{role:"assistant",content:"Connection issue. Please use the contact form below — we respond within 1 business day."}]);
    }
    setLoading(false);
  };
  const handleKey=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}};
  const ld=(k,v)=>setLead(l=>({...l,[k]:v}));
  return(
    <>
      {open&&(
        <div style={{position:"fixed",bottom:88,right:20,zIndex:400,width:340,maxHeight:580,background:W.card,border:`1px solid ${W.borderH}`,borderRadius:20,display:"flex",flexDirection:"column",boxShadow:"0 24px 80px rgba(0,0,0,.7)",animation:"fadeUp .2s ease"}}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${W.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${W.accent},${W.accentH})`,display:"flex",alignItems:"center",justifyContent:"center"}}><Bot size={16} style={{color:"#fff"}}/></div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:W.text}}>Alex — Veridian AI</div>
                <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:6,height:6,borderRadius:"50%",background:W.green}}/><div style={{fontSize:10,color:W.green}}>Online now</div></div>
              </div>
            </div>
            <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:W.textSub,cursor:"pointer",padding:4}}><X size={16}/></button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"84%",padding:"10px 14px",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.role==="user"?W.accent:W.surface,color:W.text,fontSize:13,lineHeight:1.55,whiteSpace:"pre-wrap"}}>{m.content}</div>
              </div>
            ))}
            {loading&&<div style={{display:"flex",justifyContent:"flex-start"}}><div style={{padding:"10px 14px",borderRadius:"14px 14px 14px 4px",background:W.surface,display:"flex",gap:5,alignItems:"center"}}><div style={{width:6,height:6,borderRadius:"50%",background:W.textDim,animation:"pulse 1s infinite"}}/><div style={{width:6,height:6,borderRadius:"50%",background:W.textDim,animation:"pulse 1s infinite .2s"}}/><div style={{width:6,height:6,borderRadius:"50%",background:W.textDim,animation:"pulse 1s infinite .4s"}}/></div></div>}
            {showCapture&&!captured&&(
              <div style={{background:W.surface,border:`1px solid ${W.accent}44`,borderRadius:14,padding:14,marginTop:4}}>
                <div style={{fontSize:12,fontWeight:700,color:W.accent,marginBottom:10,letterSpacing:"0.05em"}}>GET YOUR FREE ASSESSMENT</div>
                {[["name","Your name","text"],["biz","Business name","text"],["email","Email address","email"],["phone","Phone (optional)","tel"]].map(([k,ph,t])=>(
                  <input key={k} type={t} placeholder={ph} value={lead[k]} onChange={e=>ld(k,e.target.value)}
                    style={{width:"100%",background:W.card,border:`1px solid ${W.border}`,borderRadius:8,padding:"9px 12px",color:W.text,fontSize:12,outline:"none",marginBottom:8}}/>
                ))}
                <button onClick={submitLead} disabled={!lead.email||submitting} style={{width:"100%",background:W.accent,border:"none",borderRadius:8,padding:"10px",fontSize:13,fontWeight:700,color:"#fff",cursor:!lead.email||submitting?"not-allowed":"pointer",opacity:!lead.email||submitting?0.5:1}}>
                  {submitting?"Sending...":"Send My Assessment Request"}
                </button>
                <div style={{marginTop:8,fontSize:10,color:W.textDim,lineHeight:1.6}}>By submitting, you agree to receive SMS from Veridian. Reply STOP to opt out. <a href="/privacy" style={{color:W.textSub,textDecoration:"none"}}>Privacy Policy</a></div>
              </div>
            )}
            {captured&&(
              <div style={{padding:"10px 14px",background:W.greenB,border:`1px solid ${W.green}44`,borderRadius:12,textAlign:"center"}}>
                <div style={{fontSize:13,color:W.green,fontWeight:700,marginBottom:6}}>✓ We'll be in touch within 1 business day</div>
                <a href="#contact" onClick={()=>setOpen(false)} style={{fontSize:12,color:W.accent,textDecoration:"none",fontWeight:600}}>Book a call instead →</a>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
          <form onSubmit={send} style={{padding:"10px 12px",borderTop:`1px solid ${W.border}`,display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} placeholder="Describe your challenge..." style={{flex:1,background:W.surface,border:`1px solid ${W.border}`,borderRadius:10,padding:"9px 12px",color:W.text,fontSize:13,outline:"none"}}/>
            <button type="submit" disabled={loading||!input.trim()} style={{background:W.accent,border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",opacity:!input.trim()||loading?0.4:1,flexShrink:0}}><Send size={14} style={{color:"#fff"}}/></button>
          </form>
        </div>
      )}
      <button onClick={()=>{setOpen(o=>!o);track("chat_open");}} style={{position:"fixed",bottom:24,right:20,zIndex:400,width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${W.accent},${W.accentH})`,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 24px ${W.accentGlow}`,transition:"transform .2s"}}>
        {open?<X size={22} style={{color:"#fff"}}/>:<MessageCircle size={22} style={{color:"#fff"}}/>}
        {!open&&<div style={{position:"absolute",top:10,right:10,width:10,height:10,borderRadius:"50%",background:W.green,border:`2px solid ${W.card}`}}/>}
      </button>
    </>
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
  const links=[["How It Works","/#how-it-works"],["Missed Call Recovery","/missed-call-text-recovery"],["Pricing","/pricing"],["Industries","/#industries"],["Contact","/#contact"]];
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
        <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
          <a href="/privacy" style={{fontSize:11,color:W.textDim,textDecoration:"none"}}>Privacy Policy</a>
          <a href="/terms" style={{fontSize:11,color:W.textDim,textDecoration:"none"}}>Terms of Service</a>
          <a href="/hvac" style={{fontSize:11,color:W.textDim,textDecoration:"none"}}>HVAC</a>
          <a href="/dashboard" style={{fontSize:11,color:W.textDim,textDecoration:"none",opacity:.4}}>Team Access</a>
        </div>
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
// MCTR CALCULATOR — MISSED CALL FOCUSED
// ─────────────────────────────────────────────────────────────
function MCTRCalculator({isMobile}){
  const[missedCalls,setMissedCalls]=useState(50);
  const[avgValue,setAvgValue]=useState(800);
  const[closeRate,setCloseRate]=useState(35);
  const annualLost=Math.round(missedCalls*(closeRate/100)*avgValue*12);
  const recoverable=Math.round(annualLost*0.68);
  const SlM=({label,val,setVal,min,max,step=1,fmt})=>(
    <div style={{marginBottom:22}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
        <span style={{fontSize:13,color:W.textSub}}>{label}</span>
        <span style={{fontSize:14,fontWeight:700,color:W.text}}>{fmt(val)}</span>
      </div>
      <div style={{position:"relative",height:24,display:"flex",alignItems:"center"}}>
        <div style={{position:"absolute",left:0,right:0,height:4,background:W.border,borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${((val-min)/(max-min))*100}%`,background:W.green,borderRadius:2}}/>
        </div>
        <input type="range" min={min} max={max} step={step} value={val} onChange={e=>setVal(Number(e.target.value))} style={{position:"absolute",inset:0,opacity:0,width:"100%",cursor:"pointer",height:"100%"}}/>
      </div>
    </div>
  );
  return(
    <section id="mctr-calculator" style={{padding:isMobile?"80px 24px":"120px 48px",background:W.bg}}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?40:64}}>
          <SLabel c={W.green}>MISSED CALL REVENUE CALCULATOR</SLabel>
          <h2 style={{fontSize:isMobile?"30px":"48px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.04,marginBottom:16}}>
            How much revenue are<br/>missed calls costing you?
          </h2>
          <p style={{fontSize:isMobile?"14px":"17px",color:W.textSub,maxWidth:440,margin:"0 auto"}}>Three numbers. One result. See your potential revenue being missed.</p>
        </div>
        <div style={{display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:24,alignItems:"start"}}>
          <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?28:40}}>
            <div style={{fontSize:10,fontWeight:700,color:W.textDim,letterSpacing:"0.1em",marginBottom:28}}>YOUR NUMBERS</div>
            <SlM label="Missed calls per month" val={missedCalls} setVal={setMissedCalls} min={5} max={500} step={5} fmt={v=>`${v}`}/>
            <SlM label="Average customer value" val={avgValue} setVal={setAvgValue} min={100} max={20000} step={100} fmt={v=>`$${v.toLocaleString()}`}/>
            <SlM label="Close rate" val={closeRate} setVal={setCloseRate} min={5} max={80} fmt={v=>`${v}%`}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{background:"linear-gradient(135deg,rgba(239,68,68,0.1),rgba(239,68,68,0.04))",border:"1px solid rgba(239,68,68,0.2)",borderRadius:20,padding:isMobile?28:36,textAlign:"center"}}>
              <div style={{fontSize:11,fontWeight:700,color:W.red,letterSpacing:"0.1em",marginBottom:10}}>POTENTIAL REVENUE BEING MISSED</div>
              <div style={{fontSize:isMobile?"48px":"64px",fontWeight:900,color:W.text,letterSpacing:"-0.045em",lineHeight:1}}>{fmtM(annualLost)}</div>
              <div style={{fontSize:13,color:W.textSub,marginTop:10}}>per year from {missedCalls} missed calls/month</div>
            </div>
            <div style={{background:"linear-gradient(135deg,rgba(16,185,129,0.1),rgba(16,185,129,0.04))",border:"1px solid rgba(16,185,129,0.22)",borderRadius:20,padding:isMobile?24:32,textAlign:"center"}}>
              <div style={{fontSize:11,fontWeight:700,color:W.green,letterSpacing:"0.1em",marginBottom:8}}>VERIDIAN RECOVERY POTENTIAL</div>
              <div style={{fontSize:isMobile?"40px":"52px",fontWeight:900,color:W.green,letterSpacing:"-0.04em",lineHeight:1}}>{fmtM(recoverable)}</div>
              <div style={{fontSize:12,color:W.textSub,marginTop:8}}>per year · based on 68% recovery rate</div>
            </div>
            <a href="/#contact" className="vd-btn" style={{background:W.green,color:"#fff",padding:isMobile?16:18,borderRadius:12,fontSize:15,fontWeight:700,justifyContent:"center",textDecoration:"none",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 20px rgba(16,185,129,0.3)"}}>
              Book Free Assessment <ArrowRight size={16}/>
            </a>
            <div style={{fontSize:11,color:W.textDim,textAlign:"center"}}>Starts at $199/month. Representative outcomes — actual results vary.</div>
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
// MISSED CALL TEXT RECOVERY
// ─────────────────────────────────────────────────────────────
function MissedCallTextRecovery({isMobile}){
  const ref=useRef(null);
  const inView=useInView(ref);
  const steps=[
    {n:"01",label:"Prospect Calls",body:"A potential customer dials your number looking for your service.",icon:Phone,color:"#3B82F6"},
    {n:"02",label:"Call Is Missed",body:"Your team is on a job, in a meeting, or after hours. The call goes unanswered.",icon:X,color:W.red},
    {n:"03",label:"Instant Text Sent",body:"In under 60 seconds, Veridian sends a professional text response on your behalf.",icon:MessageSquare,color:W.accent},
    {n:"04",label:"Prospect Replies",body:"The prospect engages. Veridian qualifies the opportunity and captures their information.",icon:MessageSquare,color:"#8B5CF6"},
    {n:"05",label:"Appointment Booked",body:"The qualified lead is automatically scheduled into your calendar. No staff required.",icon:Calendar,color:W.green},
    {n:"06",label:"Revenue Recovered",body:"The job is booked. The revenue that was about to be lost — is now yours.",icon:CheckCircle,color:W.green},
  ];
  const benefits=["Respond in under 60 seconds","Capture lost opportunities","Book more appointments","Recover missed revenue","24/7 availability — nights, weekends, holidays"];
  const roi=[
    {biz:"HVAC Contractor",calls:80,miss:40,recovery:"$67K",period:"/year"},
    {biz:"Plumbing Company",calls:120,miss:35,recovery:"$89K",period:"/year"},
    {biz:"Medical Practice",calls:200,miss:25,recovery:"$102K",period:"/year"},
    {biz:"Law Firm",calls:60,miss:40,recovery:"$148K",period:"/year"},
  ];
  return(
    <section id="missed-call-recovery" style={{padding:isMobile?"80px 24px":"120px 48px",background:W.surface,borderTop:`1px solid ${W.border}`}}>
      <div style={{maxWidth:1160,margin:"0 auto"}} ref={ref}>
        {/* Hero block */}
        <div style={{textAlign:"center",marginBottom:isMobile?56:80}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:100,padding:"5px 16px",marginBottom:24}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:W.green,animation:"pulse 2s infinite"}}/>
            <span style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.1em"}}>MISSED CALL TEXT RECOVERY™</span>
          </div>
          <h2 style={{fontSize:isMobile?"34px":"56px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.04,marginBottom:20}}>
            Every Missed Call Gets an<br/>
            <span style={{background:`linear-gradient(135deg,${W.accent},#10B981)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>Instant Text Response.</span>
          </h2>
          <p style={{fontSize:isMobile?"16px":"20px",color:W.textSub,lineHeight:1.65,maxWidth:600,margin:"0 auto 32px"}}>
            When a prospect calls and nobody answers, Veridian immediately sends a text, captures the lead, qualifies the opportunity, and books the appointment automatically.
          </p>
          <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:12,marginBottom:40}}>
            {benefits.map((b,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:W.card,border:`1px solid ${W.border}`,borderRadius:100,padding:"8px 16px"}}>
                <Check size={12} style={{color:W.green,flexShrink:0}}/>
                <span style={{fontSize:13,color:W.text,fontWeight:500}}>{b}</span>
              </div>
            ))}
          </div>
          <a href="#contact" className="vd-btn" style={{background:`linear-gradient(135deg,${W.accent},${W.accentH})`,color:"#fff",padding:isMobile?"14px 28px":"16px 36px",borderRadius:10,fontSize:isMobile?"15px":"17px",fontWeight:700,boxShadow:`0 4px 20px ${W.accentGlow}`,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:8}}>
            Start Recovering Missed Revenue <ArrowRight size={16}/>
          </a>
        </div>
        {/* 6-step flow */}
        <div style={{marginBottom:isMobile?56:80}}>
          <div style={{textAlign:"center",marginBottom:isMobile?32:48}}>
            <SLabel>HOW IT WORKS</SLabel>
            <h3 style={{fontSize:isMobile?"26px":"36px",fontWeight:900,color:W.text,letterSpacing:"-0.03em"}}>From missed call to booked appointment in minutes.</h3>
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(6,1fr)",gap:isMobile?12:16,position:"relative"}}>
            {steps.map((s,i)=>{
              const Icon=s.icon;
              return(
                <div key={i} className="vd-card" style={{background:W.card,border:`1px solid ${i===2||i===4?s.color+"44":W.border}`,borderRadius:16,padding:isMobile?16:20,textAlign:"center",animation:inView?`fadeUp .4s ease ${i*0.08}s both`:"none",position:"relative"}}>
                  <div style={{width:40,height:40,borderRadius:"50%",background:`${s.color}14`,border:`1.5px solid ${s.color}44`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
                    <Icon size={16} style={{color:s.color}}/>
                  </div>
                  <div style={{fontSize:10,fontWeight:700,color:W.textDim,letterSpacing:"0.08em",marginBottom:6}}>{s.n}</div>
                  <div style={{fontSize:12,fontWeight:700,color:W.text,marginBottom:6,lineHeight:1.3}}>{s.label}</div>
                  <div style={{fontSize:11,color:W.textSub,lineHeight:1.5}}>{s.body}</div>
                </div>
              );
            })}
          </div>
        </div>
        {/* ROI examples */}
        <div>
          <div style={{textAlign:"center",marginBottom:isMobile?28:40}}>
            <SLabel>ROI EXAMPLES</SLabel>
            <h3 style={{fontSize:isMobile?"24px":"32px",fontWeight:900,color:W.text,letterSpacing:"-0.03em",marginBottom:8}}>What recovery looks like for businesses like yours.</h3>
            <p style={{fontSize:14,color:W.textSub}}>Based on 68% recovery rate applied to representative call volumes. Actual results vary.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:14}}>
            {roi.map((r,i)=>(
              <div key={i} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:16,padding:isMobile?18:24,textAlign:"center"}}>
                <div style={{fontSize:11,fontWeight:700,color:W.textDim,letterSpacing:"0.06em",marginBottom:12}}>{r.biz.toUpperCase()}</div>
                <div style={{fontSize:isMobile?"28px":"36px",fontWeight:900,color:W.green,letterSpacing:"-0.04em",lineHeight:1,marginBottom:4}}>{r.recovery}</div>
                <div style={{fontSize:12,color:W.textDim,marginBottom:12}}>{r.period} recovered</div>
                <div style={{fontSize:11,color:W.textSub}}>{r.calls} calls/mo · {r.miss}% miss rate</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// TRY IT YOURSELF — DEMO FLOW
// ─────────────────────────────────────────────────────────────
function TryItYourself({isMobile}){
  const[activeStep,setActiveStep]=useState(0);
  const demoFlow=[
    {n:"1",label:"Prospect Calls",icon:Phone,color:"#3B82F6",body:"A potential customer dials your business number."},
    {n:"2",label:"Call Is Missed",icon:X,color:W.red,body:"Your team is unavailable. The call goes unanswered."},
    {n:"3",label:"Instant Text Sent",icon:MessageSquare,color:W.accent,body:"In under 60 seconds, Veridian sends a text response."},
    {n:"4",label:"Prospect Replies",icon:MessageSquare,color:"#8B5CF6",body:"The prospect engages and the conversation begins."},
    {n:"5",label:"Lead Captured",icon:CheckCircle,color:W.green,body:"Name, business, and need are automatically captured."},
    {n:"6",label:"Appointment Created",icon:Calendar,color:W.green,body:"An appointment opportunity is created and routed."},
  ];
  const smsText="Hi, this is Veridian.\n\nSorry we missed your call.\n\nMany businesses lose revenue when calls go unanswered.\n\nWhat challenge are you trying to solve today?\n\nReply here and we'll respond right away.";
  useEffect(()=>{
    const t=setInterval(()=>setActiveStep(s=>(s+1)%demoFlow.length),2200);
    return()=>clearInterval(t);
  },[]);
  return(
    <section style={{padding:isMobile?"80px 24px":"120px 48px",background:W.surface,borderTop:`1px solid ${W.border}`}}>
      <div style={{maxWidth:1160,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?48:72}}>
          <SLabel c={W.amber}>TRY IT YOURSELF</SLabel>
          <h2 style={{fontSize:isMobile?"30px":"52px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.04,marginBottom:16}}>
            Call. Hang Up.<br/>
            <span style={{background:`linear-gradient(135deg,${W.accent},${W.green})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>Watch What Happens.</span>
          </h2>
          <p style={{fontSize:isMobile?"15px":"18px",color:W.textSub,maxWidth:520,margin:"0 auto"}}>Experience Missed Call Text Recovery™ exactly the way your customers will.</p>
        </div>
        <div style={{display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:32,alignItems:"center"}}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {demoFlow.map((s,i)=>{
              const Icon=s.icon;
              const isActive=i===activeStep;
              const isPast=i<activeStep;
              return(
                <div key={i} onClick={()=>setActiveStep(i)} style={{display:"flex",gap:14,alignItems:"center",padding:"14px 18px",background:isActive?`${s.color}10`:W.card,border:`1px solid ${isActive?s.color:W.border}`,borderRadius:14,cursor:"pointer",opacity:isPast||isActive?1:0.4,transition:"all .3s ease"}}>
                  <div style={{width:34,height:34,borderRadius:"50%",background:`${s.color}15`,border:`1.5px solid ${isActive?s.color:`${s.color}44`}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Icon size={13} style={{color:s.color}}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:isActive?W.text:W.textSub,marginBottom:2}}>{s.label}</div>
                    <div style={{fontSize:11,color:W.textDim,lineHeight:1.4}}>{s.body}</div>
                  </div>
                  {isActive&&<div style={{width:8,height:8,borderRadius:"50%",background:s.color,flexShrink:0,animation:"pulse 1.5s infinite"}}/>}
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
            <div style={{background:"#1C1C1E",borderRadius:28,padding:"24px 14px",width:"100%",maxWidth:300,boxShadow:"0 24px 80px rgba(0,0,0,.65)"}}>
              <div style={{background:"#2C2C2E",borderRadius:18,padding:14,marginBottom:12}}>
                <div style={{fontSize:10,color:"#8E8E93",textAlign:"center",marginBottom:10,letterSpacing:"0.04em"}}>TEXT MESSAGE</div>
                <div style={{background:"#3A3A3C",borderRadius:"16px 16px 16px 4px",padding:"11px 13px",marginBottom:8}}>
                  <div style={{fontSize:12,color:"#FFFFFF",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{activeStep>=2?smsText:"Waiting for missed call..."}</div>
                  {activeStep>=2&&<div style={{fontSize:10,color:"#8E8E93",marginTop:5,textAlign:"right"}}>Delivered</div>}
                </div>
                {activeStep>=3&&(
                  <div style={{background:"#007AFF",borderRadius:"16px 16px 4px 16px",padding:"10px 13px",marginLeft:"auto",maxWidth:"80%",animation:"fadeIn .3s ease"}}>
                    <div style={{fontSize:12,color:"#FFFFFF",lineHeight:1.5}}>I need a quote — storm damage on my roof.</div>
                  </div>
                )}
              </div>
              <div style={{height:3,background:"#3A3A3C",borderRadius:2,margin:"0 12px"}}>
                <div style={{height:"100%",width:`${((activeStep+1)/demoFlow.length)*100}%`,background:W.green,borderRadius:2,transition:"width .5s ease"}}/>
              </div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:11,color:W.textDim,marginBottom:16}}>Step {activeStep+1} of {demoFlow.length}</div>
              <a href="/#contact" className="vd-btn" style={{background:W.accent,color:"#fff",padding:"13px 28px",borderRadius:10,fontSize:14,fontWeight:700,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:8,boxShadow:`0 4px 20px ${W.accentGlow}`}}>
                Book Free Assessment <ArrowRight size={14}/>
              </a>
            </div>
          </div>
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
    {t:"Missed Call Text Recovery™",b:"Every unanswered call gets an immediate professional text response within 60 seconds — before the caller reaches a competitor."},
    {t:"AI Front Desk (Voice + Chat)",b:"Inbound calls answered by your AI receptionist. Website visitors engaged by your AI chat concierge. Every channel covered."},
    {t:"SMS Concierge",b:"Automated SMS nurture sequences keep every prospect engaged until they book or explicitly opt out."},
    {t:"Appointment Booking",b:"Leads are automatically qualified and scheduled into your calendar. No staff involvement required."},
    {t:"Revenue Dashboard",b:"Track every lead, booking, and recovery opportunity in one PIN-protected dashboard."},
  ];
  return(
    <section style={{padding:isMobile?"80px 24px":"120px 48px",background:W.bg}}>
      <div style={{maxWidth:1160,margin:"0 auto"}} ref={ref}>
        <div style={{display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:isMobile?48:80,alignItems:"center"}}>
          <div style={{animation:inView?`fadeUp .5s ease both`:"none"}}>
            <SLabel>ONE PROGRAM. ONE OUTCOME.</SLabel>
            <h2 style={{fontSize:isMobile?"34px":"52px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.04,marginBottom:20}}>
              Veridian 24/7<br/>
              <span style={{background:`linear-gradient(135deg,${W.accent},${W.green})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>Revenue Front Desk™</span>
            </h2>
            <p style={{fontSize:isMobile?"15px":"17px",color:W.textSub,lineHeight:1.72,marginBottom:32,maxWidth:400}}>Every channel. Every lead. Every opportunity — captured, qualified, and booked automatically.</p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <a href="#contact" className="vd-btn" style={{background:W.accent,color:"#fff",padding:isMobile?"14px 28px":"16px 36px",borderRadius:10,fontSize:16,fontWeight:700,boxShadow:`0 4px 20px ${W.accentGlow}`}}>
                Start My Program <ArrowRight size={16}/>
              </a>
              <a href="/pricing" className="vd-ghost" style={{background:"none",border:`1.5px solid ${W.border}`,color:W.text,padding:isMobile?"13px 20px":"15px 28px",borderRadius:10,fontSize:15,fontWeight:600,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:8}}>
                See Pricing <ChevronRight size={15}/>
              </a>
            </div>
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
// PILOT CASE STUDY
// ─────────────────────────────────────────────────────────────
function PilotCaseStudy({isMobile}){
  const outcomes=["Instant response to every missed call","Lead captured automatically — name, need, and contact info","Opportunity routed for follow-up within minutes","Response times reduced from hours (or never) to under 60 seconds","Appointment requests generated without additional staff"];
  return(
    <section style={{padding:isMobile?"80px 24px":"120px 48px",background:W.surface,borderTop:`1px solid ${W.border}`}}>
      <div style={{maxWidth:1000,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?48:64}}>
          <SLabel c={W.green}>CASE STUDY</SLabel>
          <h2 style={{fontSize:isMobile?"30px":"48px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.04,marginBottom:16}}>Missed Call Recovery Pilot</h2>
          <p style={{fontSize:isMobile?"14px":"17px",color:W.textSub,maxWidth:520,margin:"0 auto"}}>A structured deployment of Missed Call Text Recovery™ for a service business losing leads to unanswered calls.</p>
        </div>
        <div style={{display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"repeat(3,1fr)",gap:20,marginBottom:36}}>
          {[
            {label:"CHALLENGE",color:W.red,body:"Businesses lose revenue when calls go unanswered. Prospects don't leave voicemails — they call the next business on the list. Every missed call is a missed opportunity that silently disappears."},
            {label:"SOLUTION",color:W.accent,body:"Veridian deployed Missed Call Text Recovery™. Every unanswered call triggered an immediate professional text response — within 60 seconds, 24 hours a day, 7 days a week, including weekends."},
            {label:"OUTCOME",color:W.green,body:"Response times dropped from hours (or never) to under 60 seconds. Leads were captured automatically and routed for follow-up. No additional staff or technology changes required."},
          ].map((c,i)=>(
            <div key={i} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:18,padding:isMobile?24:32}}>
              <div style={{fontSize:10,fontWeight:700,color:c.color,letterSpacing:"0.1em",marginBottom:14}}>{c.label}</div>
              <p style={{fontSize:14,color:W.textSub,lineHeight:1.75}}>{c.body}</p>
            </div>
          ))}
        </div>
        <div style={{background:"linear-gradient(135deg,rgba(16,185,129,0.08),rgba(16,185,129,0.03))",border:"1px solid rgba(16,185,129,0.22)",borderRadius:20,padding:isMobile?24:40}}>
          <div style={{fontSize:11,fontWeight:700,color:W.green,letterSpacing:"0.1em",marginBottom:24,textAlign:"center"}}>RESULTS</div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:28}}>
            {outcomes.map((o,i)=>(
              <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                  <Check size={11} style={{color:W.green}}/>
                </div>
                <span style={{fontSize:14,color:W.text,lineHeight:1.55}}>{o}</span>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center"}}>
            <a href="/#contact" className="vd-btn" style={{background:W.accent,color:"#fff",padding:"14px 32px",borderRadius:10,fontSize:15,fontWeight:700,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:8,boxShadow:`0 4px 20px ${W.accentGlow}`}}>
              Start Your Pilot <ArrowRight size={16}/>
            </a>
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
                <div style={{marginTop:12,fontSize:11,color:W.textDim,lineHeight:1.65,textAlign:"center"}}>
                  By submitting, you agree to receive SMS text messages from Veridian regarding your inquiry. Reply STOP to opt out at any time. Message &amp; data rates may apply. View our <a href="/privacy" style={{color:W.textSub,textDecoration:"underline"}}>Privacy Policy</a> and <a href="/terms" style={{color:W.textSub,textDecoration:"underline"}}>Terms of Service</a>.
                </div>
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
      <TryItYourself isMobile={isMobile}/>
      <MissedCallTextRecovery isMobile={isMobile}/>
      <ProgramOffer isMobile={isMobile}/>
      <PilotCaseStudy isMobile={isMobile}/>
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
// PRICING PAGE
// ─────────────────────────────────────────────────────────────
function PricingPage({isMobile}){
  const plans=[
    {
      name:"Missed Call Text Recovery™",price:199,setup:299,badge:"START HERE",
      sub:"Recover leads and revenue from calls your business never answered.",
      color:W.green,
      features:[
        "Instant missed-call text back (< 60 seconds)",
        "Lead capture & SMS conversation tracking",
        "Appointment request capture",
        "Email notifications on every lead",
        "Monthly reporting",
        "Up to 100 leads/month",
        "Email support",
      ],
    },
    {
      name:"Revenue Recovery Starter",price:497,setup:499,badge:null,
      sub:"For solo operators and small teams ready to stop losing leads.",
      color:W.textSub,
      features:[
        "Everything in Missed Call Text Recovery™",
        "Full CRM pipeline",
        "Booking automation",
        "Revenue dashboard",
        "Email follow-up sequences (24h, 3d, 7d, 14d)",
        "Up to 200 leads/month",
        "Priority email support",
      ],
    },
    {
      name:"Revenue Recovery Professional",price:997,setup:999,badge:"MOST POPULAR",
      sub:"For established businesses serious about revenue recovery.",
      color:W.accent,
      features:[
        "Everything in Starter",
        "AI Front Desk (voice + inbound calls)",
        "SMS Concierge & nurture campaigns",
        "Website Chat Concierge (Alex AI)",
        "Advanced analytics & reporting",
        "Up to 1,000 leads/month",
        "Priority support",
      ],
    },
    {
      name:"Enterprise Revenue Front Desk™",price:1997,setup:2499,badge:"BEST VALUE",
      sub:"For multi-location operations with custom requirements.",
      color:W.amber,
      features:[
        "Everything in Professional",
        "Multi-location management",
        "Advanced automation workflows",
        "Custom AI persona & voice",
        "CRM integrations (GHL, HubSpot)",
        "Dedicated success manager",
        "SLA + priority support",
      ],
    },
  ];
  return(
    <div style={{minHeight:"100vh",background:W.bg,paddingTop:80}}>
      <div style={{maxWidth:1100,margin:"0 auto",padding:isMobile?"60px 24px 80px":"80px 48px 100px",textAlign:"center"}}>
        <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.12em",marginBottom:16}}>PRICING</div>
        <h1 style={{fontSize:isMobile?32:48,fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.1,marginBottom:16}}>Revenue recovery, fully managed</h1>
        <p style={{fontSize:isMobile?15:18,color:W.textSub,lineHeight:1.7,maxWidth:580,margin:"0 auto 56px"}}>No long-term contracts. Cancel anytime. Every plan starts with a free Revenue Recovery Assessment.</p>
        <div style={{display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"repeat(2,1fr)",gap:20,textAlign:"left"}}>
          {plans.map((p,i)=>(
            <div key={i} className="vd-card" style={{background:W.card,border:`1px solid ${i===0?p.color:W.border}`,borderRadius:20,padding:"28px 26px",position:"relative",boxShadow:i===0?`0 0 40px rgba(16,185,129,0.2)`:undefined}}>
              {p.badge&&<div style={{position:"absolute",top:-1,right:24,background:p.color,color:"#fff",fontSize:10,fontWeight:800,letterSpacing:"0.08em",padding:"5px 12px",borderRadius:"0 0 10px 10px"}}>{p.badge}</div>}
              <div style={{fontSize:11,fontWeight:700,color:p.color,letterSpacing:"0.1em",marginBottom:10}}>{p.name.toUpperCase()}</div>
              <div style={{marginBottom:4}}>
                <span style={{fontSize:44,fontWeight:900,color:W.text,letterSpacing:"-0.04em"}}>${p.price.toLocaleString()}</span>
                <span style={{fontSize:15,color:W.textSub}}>/mo</span>
              </div>
              <div style={{fontSize:13,color:W.amber,fontWeight:600,marginBottom:4}}>+ ${p.setup.toLocaleString()} one-time setup</div>
              <div style={{fontSize:13,color:W.textSub,lineHeight:1.6,marginBottom:24,minHeight:40}}>{p.sub}</div>
              <a href="/#contact" className="vd-btn" style={{display:"flex",justifyContent:"center",background:i===0?p.color:W.surface,color:i===0?"#fff":W.text,border:`1px solid ${i===0?"transparent":W.border}`,borderRadius:10,padding:"12px 20px",fontSize:14,fontWeight:700,textDecoration:"none",marginBottom:24}}>Start Free Assessment →</a>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {p.features.map((f,fi)=>(
                  <div key={fi} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                    <Check size={14} style={{color:p.color,flexShrink:0,marginTop:2}}/>
                    <span style={{fontSize:13,color:W.textSub,lineHeight:1.5}}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:40,background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?"24px":"36px 48px",textAlign:"left"}}>
          <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:16}}>SETUP INCLUDES</div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(5,1fr)",gap:16,marginBottom:0}}>
            {["Configuration","CRM Setup","SMS Setup","Automation Deployment","Testing & Launch"].map((item,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"center"}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:W.accentB,border:"1px solid rgba(99,102,241,0.22)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Check size={10} style={{color:W.accent}}/>
                </div>
                <span style={{fontSize:13,color:W.textSub}}>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{marginTop:24,background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:isMobile?"24px":"36px 48px",display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:28,alignItems:"center",textAlign:"left"}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.1em",marginBottom:10}}>ENTERPRISE REVENUE GUARANTEE</div>
            <div style={{fontSize:isMobile?20:24,fontWeight:800,color:W.text,letterSpacing:"-0.03em",lineHeight:1.3,marginBottom:10}}>Enterprise clients: we guarantee measurable results or we work for free until you see them.</div>
            <div style={{fontSize:13,color:W.textSub,lineHeight:1.7}}>We put our fee on the line because we know what we're doing. Average client sees first recovered revenue within 30 days.</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {[["30-Day Money-Back","No risk on your first month"],["Go Live in 48 Hours","Fast setup, immediate results"],["Cancel Anytime","No long-term contracts required"],["Free Migration","We move your existing leads over"]].map(([t,s],i)=>(
              <div key={i} style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{width:36,height:36,borderRadius:10,background:W.accentB,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Check size={14} style={{color:W.accent}}/></div>
                <div><div style={{fontSize:13,fontWeight:700,color:W.text}}>{t}</div><div style={{fontSize:12,color:W.textDim}}>{s}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div style={{marginTop:24,fontSize:12,color:W.textDim}}>All plans billed monthly. Setup fee is one-time and non-refundable. Annual plans available at 2 months free. Prices in USD.</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DEMO PAGE — PROSPECT DEMO ENVIRONMENT
// ─────────────────────────────────────────────────────────────
function DemoPage({isMobile}){
  const demoMetrics=[
    {l:"Leads Captured",v:"847",sub:"Last 90 days",c:W.accent},
    {l:"Booking Rate",v:"38%",sub:"Leads → consultations",c:W.green},
    {l:"Revenue Recovered",v:"$94K",sub:"Annualized",c:W.green},
    {l:"Avg Response Time",v:"< 2 min",sub:"AI + SMS combined",c:W.amber},
    {l:"Calls Answered",v:"2,341",sub:"Zero missed (AI handled)",c:W.accent},
    {l:"Pipeline Value",v:"$312K",sub:"Active opportunities",c:W.text},
  ];
  const pipeline=[
    {stage:"New Lead",count:12,color:W.textDim},
    {stage:"Contacted",count:8,color:W.accent},
    {stage:"Qualified",count:5,color:W.amber},
    {stage:"Consultation Booked",count:4,color:W.green},
    {stage:"Proposal Sent",count:3,color:W.amber},
    {stage:"Won",count:2,color:W.green},
  ];
  const demoLeads=[
    {name:"Sarah Mitchell",biz:"Elite Plumbing & Drain",priority:"HOT",status:"Consultation Booked",value:"$84K/yr",time:"2 min ago"},
    {name:"Carlos Rivera",biz:"Apex HVAC Services",priority:"HIGH",status:"Contacted",value:"$67K/yr",time:"18 min ago"},
    {name:"Jennifer Walsh",biz:"Walsh Roofing LLC",priority:"HOT",status:"Qualified",value:"$112K/yr",time:"1 hr ago"},
    {name:"David Park",biz:"Summit Electrical",priority:"MEDIUM",status:"New Lead",value:"$38K/yr",time:"3 hr ago"},
  ];
  const PC2={HOT:W.red,HIGH:W.amber,MEDIUM:W.accent};
  return(
    <div style={{minHeight:"100vh",background:W.bg,paddingTop:80}}>
      <div style={{background:`linear-gradient(90deg,${W.accentB},transparent)`,borderBottom:`1px solid ${W.border}`,padding:"10px 24px",textAlign:"center"}}>
        <span style={{fontSize:12,fontWeight:700,color:W.accent,letterSpacing:"0.08em"}}>⚡ LIVE DEMO ENVIRONMENT — This is a fully functional preview. All features shown are production-ready.</span>
      </div>
      <div style={{maxWidth:1200,margin:"0 auto",padding:isMobile?"24px 20px 80px":"40px 48px 80px"}}>
        <div style={{marginBottom:36,textAlign:isMobile?"center":undefined}}>
          <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.12em",marginBottom:8}}>DEMO — ACME HOME SERVICES (SAMPLE CLIENT)</div>
          <div style={{fontSize:isMobile?26:36,fontWeight:900,color:W.text,letterSpacing:"-0.03em",marginBottom:8}}>Your 24/7 Revenue Front Desk™</div>
          <div style={{fontSize:14,color:W.textSub}}>This is what Veridian looks like when it's working for your business.</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:12,marginBottom:24}}>
          {demoMetrics.map((m,i)=>(
            <div key={i} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:14,padding:isMobile?"14px":"20px"}}>
              <div style={{fontSize:10,color:W.textDim,fontWeight:700,letterSpacing:"0.06em",marginBottom:6}}>{m.l.toUpperCase()}</div>
              <div style={{fontSize:isMobile?22:28,fontWeight:900,color:m.c,lineHeight:1,marginBottom:4}}>{m.v}</div>
              <div style={{fontSize:11,color:W.textDim}}>{m.sub}</div>
            </div>
          ))}
        </div>
        <div style={{display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
          <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:16,overflow:"hidden"}}>
            <div style={{padding:"14px 20px",borderBottom:`1px solid ${W.border}`}}>
              <div style={{fontSize:13,fontWeight:700,color:W.text}}>Live Pipeline</div>
            </div>
            {pipeline.map((p,i)=>(
              <div key={i} style={{padding:"12px 20px",borderBottom:i<pipeline.length-1?`1px solid ${W.border}`:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:13,color:W.textSub}}>{p.stage}</div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{height:6,width:Math.max(p.count*8,24),background:p.color,borderRadius:3,opacity:0.7}}/>
                  <div style={{fontSize:13,fontWeight:700,color:p.color,minWidth:20,textAlign:"right"}}>{p.count}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:16,overflow:"hidden"}}>
            <div style={{padding:"14px 20px",borderBottom:`1px solid ${W.border}`}}>
              <div style={{fontSize:13,fontWeight:700,color:W.text}}>Recent Leads — AI Captured</div>
            </div>
            {demoLeads.map((l,i)=>(
              <div key={i} style={{padding:"11px 20px",borderBottom:i<demoLeads.length-1?`1px solid ${W.border}`:"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:W.text,marginBottom:1}}>{l.name}</div>
                    <div style={{fontSize:11,color:W.textSub}}>{l.biz}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:W.green,marginBottom:3}}>{l.value}</div>
                    <span style={{fontSize:10,fontWeight:700,color:PC2[l.priority]||W.textDim,border:`1px solid ${PC2[l.priority]||W.border}`,borderRadius:4,padding:"1px 6px"}}>{l.priority}</span>
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                  <div style={{fontSize:11,color:W.accent}}>{l.status}</div>
                  <div style={{fontSize:10,color:W.textDim}}>{l.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{background:`linear-gradient(135deg,${W.accentB},rgba(16,185,129,0.06))`,border:`1px solid ${W.borderH}`,borderRadius:20,padding:isMobile?"28px 24px":"40px 48px",textAlign:"center"}}>
          <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.12em",marginBottom:12}}>READY TO SEE THIS FOR YOUR BUSINESS?</div>
          <div style={{fontSize:isMobile?24:36,fontWeight:900,color:W.text,letterSpacing:"-0.03em",marginBottom:12}}>We'll build your custom demo in 24 hours</div>
          <div style={{fontSize:14,color:W.textSub,marginBottom:28,lineHeight:1.7,maxWidth:520,margin:"0 auto 28px"}}>Book a free Revenue Recovery Assessment. We'll show you exactly what Veridian captures for businesses like yours — with your numbers, your industry, your pipeline.</div>
          <a href="/#contact" className="vd-btn" style={{background:`linear-gradient(135deg,${W.accent},${W.accentH})`,color:"#fff",padding:"15px 32px",borderRadius:12,fontSize:15,fontWeight:700,textDecoration:"none",display:"inline-flex",boxShadow:`0 4px 24px ${W.accentGlow}`}}>Book My Free Assessment →</a>
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
// ROI PROOF BANNER
// ─────────────────────────────────────────────────────────────
function ROIProofBanner({isMobile}){
  return(
    <div style={{background:"linear-gradient(90deg,rgba(16,185,129,0.1),rgba(99,102,241,0.1))",borderTop:"1px solid rgba(16,185,129,0.18)",borderBottom:"1px solid rgba(16,185,129,0.18)",padding:"16px 24px",textAlign:"center"}}>
      <div style={{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center",gap:isMobile?10:28,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:W.green,animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:13,fontWeight:700,color:W.text}}>Every missed call is a potential customer.</span>
        </div>
        {!isMobile&&<div style={{width:1,height:16,background:W.border}}/>}
        <span style={{fontSize:13,color:W.textSub}}>Missed Call Text Recovery™ responds in <strong style={{color:W.green}}>under 60 seconds.</strong></span>
        <a href="/#contact" className="vd-btn" style={{background:W.green,color:"#fff",padding:"8px 18px",borderRadius:8,fontSize:13,fontWeight:700,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:6,boxShadow:"0 2px 12px rgba(16,185,129,0.3)"}}>
          Start Free <ArrowRight size={13}/>
        </a>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DEMO NUMBER SECTION
// ─────────────────────────────────────────────────────────────
function DemoNumberSection({isMobile}){
  return(
    <section style={{padding:isMobile?"64px 24px":"80px 48px",background:W.bg,borderTop:`1px solid ${W.border}`}}>
      <div style={{maxWidth:800,margin:"0 auto",textAlign:"center"}}>
        <SLabel c={W.green}>TRY IT NOW — LIVE DEMO</SLabel>
        <h2 style={{fontSize:isMobile?"30px":"48px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.04,marginBottom:16}}>
          Call. Hang Up.<br/>Watch What Happens.
        </h2>
        <p style={{fontSize:isMobile?"15px":"18px",color:W.textSub,maxWidth:520,margin:"0 auto 36px",lineHeight:1.65}}>
          Experience Missed Call Text Recovery™ exactly as your customers will. Call the number below, hang up — receive a real text back within 60 seconds.
        </p>
        <div style={{display:"inline-flex",flexDirection:"column",alignItems:"center",gap:14,background:W.card,border:"1px solid rgba(16,185,129,0.3)",borderRadius:24,padding:isMobile?"28px 24px":"40px 64px",boxShadow:"0 0 60px rgba(16,185,129,0.08)"}}>
          <div style={{fontSize:11,fontWeight:700,color:W.green,letterSpacing:"0.14em"}}>DEMO NUMBER</div>
          <a href="tel:+14074705992" style={{fontSize:isMobile?"42px":"64px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1,textDecoration:"none",transition:"color .15s"}}>(407) 470-5992</a>
          <div style={{fontSize:14,color:W.textSub,lineHeight:1.65,maxWidth:360,textAlign:"center"}}>Call this number and hang up. You'll receive a text in under 60 seconds — exactly what your customers experience.</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
            {["< 60s response","Real SMS to your phone","No download required"].map((t,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:6,background:W.surface,border:`1px solid ${W.border}`,borderRadius:100,padding:"5px 13px"}}>
                <Check size={11} style={{color:W.green}}/>
                <span style={{fontSize:12,color:W.textSub,fontWeight:500}}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// INDUSTRY ROI EXAMPLES
// ─────────────────────────────────────────────────────────────
function IndustryROIExamples({isMobile}){
  const examples=[
    {ind:"HVAC",calls:80,value:3200,miss:35,color:"#F59E0B"},
    {ind:"Plumbing",calls:120,value:1800,miss:40,color:"#3B82F6"},
    {ind:"Electrical",calls:65,value:2400,miss:30,color:"#EF4444"},
    {ind:"Security",calls:100,value:8000,miss:25,color:"#8B5CF6"},
    {ind:"Legal",calls:40,value:12000,miss:45,color:"#10B981"},
    {ind:"Medical",calls:180,value:400,miss:30,color:"#6366F1"},
  ];
  return(
    <section style={{padding:isMobile?"80px 24px":"120px 48px",background:W.surface,borderTop:`1px solid ${W.border}`}}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?40:64}}>
          <SLabel>INDUSTRY ROI EXAMPLES</SLabel>
          <h2 style={{fontSize:isMobile?"28px":"44px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.04,marginBottom:16}}>What missed calls cost — by industry.</h2>
          <p style={{fontSize:isMobile?"14px":"17px",color:W.textSub,maxWidth:480,margin:"0 auto"}}>Representative estimates. Actual results vary by call volume and business type.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(3,1fr)",gap:16}}>
          {examples.map((e,i)=>{
            const missedPerMo=Math.round(e.calls*e.miss/100);
            const annualLost=Math.round(missedPerMo*0.35*e.value*12);
            return(
              <div key={i} className="vd-card" style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:18,padding:isMobile?18:28}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:800,color:e.color,letterSpacing:"0.1em"}}>{e.ind.toUpperCase()}</div>
                  <div style={{width:8,height:8,borderRadius:"50%",background:e.color,opacity:0.7}}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:12,color:W.textDim}}>Missed calls/mo</span>
                    <span style={{fontSize:13,fontWeight:700,color:W.textSub}}>{missedPerMo}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:12,color:W.textDim}}>Avg customer value</span>
                    <span style={{fontSize:13,fontWeight:700,color:W.textSub}}>${e.value.toLocaleString()}</span>
                  </div>
                </div>
                <div style={{borderTop:`1px solid ${W.border}`,paddingTop:12}}>
                  <div style={{fontSize:10,fontWeight:700,color:W.red,letterSpacing:"0.06em",marginBottom:4}}>EST. ANNUAL REVENUE LOST</div>
                  <div style={{fontSize:isMobile?"22px":"28px",fontWeight:900,color:W.text,letterSpacing:"-0.04em"}}>{fmtM(annualLost)}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{marginTop:32,background:W.card,border:"1px solid rgba(16,185,129,0.22)",borderRadius:16,padding:isMobile?20:28,textAlign:"center"}}>
          <div style={{fontSize:isMobile?15:17,fontWeight:700,color:W.text,marginBottom:6}}>At $199/month, one recovered customer pays for the entire service — often within the first week.</div>
          <div style={{fontSize:13,color:W.textSub}}>Most industries see positive ROI within 30 days of deployment.</div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// WHY $199
// ─────────────────────────────────────────────────────────────
function WhyPrice({isMobile}){
  return(
    <section style={{padding:isMobile?"80px 24px":"120px 48px",background:W.bg,borderTop:`1px solid ${W.border}`}}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?40:64}}>
          <SLabel c={W.amber}>WHY $199?</SLabel>
          <h2 style={{fontSize:isMobile?"28px":"44px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.04,marginBottom:16}}>
            One recovered customer pays<br/>for the entire year.
          </h2>
        </div>
        <div style={{display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:20,marginBottom:32}}>
          {[
            {label:"THE MATH",color:W.green,items:["1 missed call recovered = $500–$5,000+ in revenue","Veridian costs $199/month = $2,388/year","Recover just 1 customer → you're already ahead","Most clients recover dozens per month"]},
            {label:"THE TRUTH",color:W.accent,items:["You're already losing revenue — the question is how much","The cost of inaction is always higher than $199","We priced this so there's zero excuse not to try","Cancel anytime if it doesn't pay for itself"]},
          ].map((c,i)=>(
            <div key={i} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:18,padding:isMobile?24:32}}>
              <div style={{fontSize:10,fontWeight:700,color:c.color,letterSpacing:"0.1em",marginBottom:18}}>{c.label}</div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {c.items.map((t,j)=>(
                  <div key={j} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:c.color,flexShrink:0,marginTop:7}}/>
                    <span style={{fontSize:14,color:W.textSub,lineHeight:1.55}}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{background:"linear-gradient(135deg,rgba(16,185,129,0.1),rgba(16,185,129,0.04))",border:"1px solid rgba(16,185,129,0.25)",borderRadius:16,padding:isMobile?24:36,textAlign:"center"}}>
          <div style={{fontSize:isMobile?"20px":"26px",fontWeight:800,color:W.text,lineHeight:1.4,marginBottom:12}}>"The risk isn't $199/month.<br/>The risk is another year of missed calls."</div>
          <div style={{fontSize:13,color:W.textSub,marginBottom:24}}>Every month you wait is another month of revenue walking to a competitor who answered.</div>
          <a href="/#contact" className="vd-btn" style={{background:`linear-gradient(135deg,${W.green},#059669)`,color:"#fff",padding:"14px 36px",borderRadius:10,fontSize:15,fontWeight:700,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:8,boxShadow:"0 4px 20px rgba(16,185,129,0.3)"}}>
            Book Free Assessment <ArrowRight size={16}/>
          </a>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// MCTR FAQ
// ─────────────────────────────────────────────────────────────
function MCTRFaq({isMobile}){
  const[open,setOpen]=useState(null);
  const faqs=[
    {q:"Do I keep my current phone number?",a:"Yes — 100%. Veridian works with call forwarding. You keep your existing number, carrier, and setup. When a call goes unanswered, it's forwarded to Veridian, which sends the text back in under 60 seconds. No new phone system required."},
    {q:"How fast do texts go out after a missed call?",a:"Under 60 seconds in most cases. The response fires the moment a call goes unanswered — before the caller has reached the next business on their list. Speed is the entire value proposition."},
    {q:"What happens after hours and on weekends?",a:"Every missed call gets a response — 24 hours a day, 7 days a week, including holidays. There are no gaps. If a prospect calls at 11 PM Saturday, they receive a professional text response within 60 seconds."},
    {q:"Can customers book an appointment by text?",a:"Yes. The SMS conversation captures the prospect's need and creates a follow-up opportunity. Appointment requests are logged and routed to your team. Higher-tier plans include automatic booking directly to your calendar."},
    {q:"Is there a long-term contract?",a:"No. Missed Call Text Recovery™ is month-to-month. Cancel anytime. There is a one-time $299 setup fee to cover configuration, SMS setup, testing, and launch — but no annual commitment and no cancellation penalty."},
  ];
  return(
    <section style={{padding:isMobile?"80px 24px":"120px 48px",background:W.surface,borderTop:`1px solid ${W.border}`}}>
      <div style={{maxWidth:760,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?40:60}}>
          <SLabel>FAQ</SLabel>
          <h2 style={{fontSize:isMobile?"28px":"44px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.04,marginBottom:16}}>Questions about Missed Call Text Recovery™</h2>
        </div>
        <div>
          {faqs.map((f,i)=>(
            <div key={i} style={{borderBottom:`1px solid ${W.border}`}}>
              <button onClick={()=>setOpen(open===i?null:i)} style={{width:"100%",background:"none",border:"none",padding:"20px 0",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",textAlign:"left",gap:16}}>
                <span style={{fontSize:isMobile?"14px":"16px",fontWeight:700,color:W.text,lineHeight:1.35}}>{f.q}</span>
                <div style={{width:24,height:24,borderRadius:"50%",background:open===i?W.greenB:W.card,border:`1px solid ${open===i?"rgba(16,185,129,0.4)":W.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                  <span style={{fontSize:14,color:open===i?W.green:W.textSub,fontWeight:700,lineHeight:1}}>{open===i?"−":"+"}</span>
                </div>
              </button>
              {open===i&&(
                <div style={{paddingBottom:20,animation:"fadeIn .2s ease"}}>
                  <p style={{fontSize:isMobile?"14px":"15px",color:W.textSub,lineHeight:1.75}}>{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{marginTop:36,background:W.accentB,border:"1px solid rgba(99,102,241,0.2)",borderRadius:14,padding:isMobile?20:28,display:"flex",flexDirection:isMobile?"column":"row",alignItems:isMobile?"flex-start":"center",justifyContent:"space-between",gap:16}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:W.text,marginBottom:4}}>Still have questions?</div>
            <div style={{fontSize:13,color:W.textSub}}>We answer within 1 business day — honestly.</div>
          </div>
          <a href="/#contact" className="vd-btn" style={{background:W.accent,color:"#fff",padding:"12px 24px",borderRadius:9,fontSize:14,fontWeight:700,whiteSpace:"nowrap",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:8,boxShadow:`0 4px 16px ${W.accentGlow}`}}>
            Ask Us Directly
          </a>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// MISSED CALL TEXT RECOVERY LANDING PAGE
// ─────────────────────────────────────────────────────────────
function MCTRLandingPage({isMobile}){
  return(
    <div style={{minHeight:"100vh",background:W.bg}}>
      {/* Hero */}
      <section style={{padding:isMobile?"128px 24px 80px":"150px 48px 100px",background:W.surface,borderBottom:`1px solid ${W.border}`,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 70% 60% at 50% 0%,rgba(16,185,129,0.07) 0%,transparent 60%)",pointerEvents:"none"}}/>
        <div style={{maxWidth:900,margin:"0 auto",textAlign:"center",position:"relative",zIndex:1}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:100,padding:"5px 16px",marginBottom:28}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:W.green,animation:"pulse 2s infinite"}}/>
            <span style={{fontSize:11,fontWeight:700,color:W.green,letterSpacing:"0.1em"}}>MISSED CALL TEXT RECOVERY™</span>
          </div>
          <h1 style={{fontSize:isMobile?"40px":"72px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.02,marginBottom:24}}>
            Every Missed Call Gets<br/>
            <span style={{background:`linear-gradient(135deg,${W.green},${W.accent})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>An Instant Response.</span>
          </h1>
          <p style={{fontSize:isMobile?"17px":"21px",color:W.textSub,lineHeight:1.65,maxWidth:640,margin:"0 auto 40px"}}>
            When a prospect calls and nobody answers, Veridian immediately responds by text, captures the lead, and creates an opportunity for follow-up.
          </p>
          <div style={{display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center",marginBottom:20}}>
            <a href="/#contact" className="vd-btn" style={{background:`linear-gradient(135deg,${W.green},#059669)`,color:"#fff",padding:isMobile?"14px 28px":"17px 40px",borderRadius:12,fontSize:isMobile?"16px":"18px",fontWeight:700,boxShadow:"0 4px 24px rgba(16,185,129,0.35)",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:8}}>
              Book Free Assessment <ArrowRight size={16}/>
            </a>
            <a href="#mctr-calculator" className="vd-ghost" style={{background:"none",border:`1.5px solid ${W.border}`,color:W.text,padding:isMobile?"13px 24px":"16px 36px",borderRadius:12,fontSize:isMobile?"16px":"18px",fontWeight:600,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:8}}>
              Calculate Revenue Lost <ChevronRight size={16}/>
            </a>
          </div>
          <div style={{fontSize:12,color:W.textDim}}>Starts at $199/month · $299 one-time setup · Cancel anytime</div>
        </div>
      </section>
      <ROIProofBanner isMobile={isMobile}/>
      <DemoNumberSection isMobile={isMobile}/>
      <MissedCallTextRecovery isMobile={isMobile}/>
      <TryItYourself isMobile={isMobile}/>
      <MCTRCalculator isMobile={isMobile}/>
      <IndustryROIExamples isMobile={isMobile}/>
      <PilotCaseStudy isMobile={isMobile}/>
      <WhyPrice isMobile={isMobile}/>
      <MCTRFaq isMobile={isMobile}/>
      {/* Final CTA */}
      <section style={{padding:isMobile?"80px 24px":"120px 48px",background:W.bg,borderTop:`1px solid ${W.border}`}}>
        <div style={{maxWidth:700,margin:"0 auto",textAlign:"center"}}>
          <SLabel c={W.green}>GET STARTED</SLabel>
          <h2 style={{fontSize:isMobile?"30px":"48px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.04,marginBottom:16}}>Start recovering missed revenue today.</h2>
          <p style={{fontSize:isMobile?"15px":"17px",color:W.textSub,lineHeight:1.72,maxWidth:480,margin:"0 auto 32px"}}>
            Book a free Revenue Recovery Assessment. We'll show you exactly how much you're losing to missed calls — and how fast Missed Call Text Recovery™ turns that around.
          </p>
          <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
            <a href="/#contact" className="vd-btn" style={{background:`linear-gradient(135deg,${W.green},#059669)`,color:"#fff",padding:"16px 40px",borderRadius:12,fontSize:17,fontWeight:700,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:8,boxShadow:"0 4px 24px rgba(16,185,129,0.35)"}}>
              Book Free Assessment <ArrowRight size={16}/>
            </a>
            <a href="/pricing" className="vd-ghost" style={{background:"none",border:`1.5px solid ${W.border}`,color:W.text,padding:"15px 32px",borderRadius:12,fontSize:16,fontWeight:600,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:8}}>
              View Pricing <ChevronRight size={15}/>
            </a>
          </div>
          <div style={{marginTop:24,fontSize:12,color:W.textDim}}>Starts at $199/month · Setup in 5 business days · No long-term contracts</div>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PRIVACY POLICY PAGE
// ─────────────────────────────────────────────────────────────
function PrivacyPage({isMobile}){
  const s={fontSize:14,color:W.textSub,lineHeight:1.85,marginBottom:16};
  const h={fontSize:18,fontWeight:800,color:W.text,marginBottom:10,marginTop:32};
  return(
    <div style={{maxWidth:780,margin:"0 auto",padding:isMobile?"80px 24px 120px":"100px 48px 140px"}}>
      <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.12em",marginBottom:16}}>LEGAL</div>
      <h1 style={{fontSize:isMobile?"32px":"48px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",marginBottom:8}}>Privacy Policy</h1>
      <p style={{fontSize:13,color:W.textDim,marginBottom:40}}>Effective Date: June 1, 2026 · Last Updated: June 20, 2026</p>
      <p style={s}>Veridian Risk &amp; Resilience Group LLC ("Veridian," "we," "us," or "our") operates the website at veridianresiliencegroupllc.org and provides revenue recovery services including Missed Call Text Recovery™. This Privacy Policy describes how we collect, use, and protect your information.</p>
      <div style={h}>1. Information We Collect</div>
      <p style={s}><strong style={{color:W.text}}>Information you provide directly:</strong> When you submit our contact form, chat with Alex AI, or book a consultation, we collect your name, business name, email address, phone number, and any information you share about your business challenges.</p>
      <p style={s}><strong style={{color:W.text}}>Usage data:</strong> We collect standard web analytics data including pages visited, time on site, referring URLs, and browser/device information.</p>
      <p style={s}><strong style={{color:W.text}}>SMS communications:</strong> If you opt in to receive SMS messages, we collect your mobile phone number and maintain records of SMS communications sent and received.</p>
      <div style={h}>2. How We Use Your Information</div>
      <p style={s}>We use the information we collect to: (a) respond to your inquiries and provide our services; (b) send SMS text messages you have consented to receive; (c) send email follow-up communications about our services; (d) analyze and improve our website and services; and (e) comply with legal obligations.</p>
      <div style={h}>3. SMS Text Messaging — TCPA Compliance</div>
      <p style={s}>By submitting our contact form or lead capture form and providing your phone number, you expressly consent to receive recurring SMS text messages from Veridian Risk &amp; Resilience Group LLC at the number you provide, including messages sent by automated technology. Consent is not a condition of any purchase.</p>
      <p style={s}><strong style={{color:W.text}}>Message frequency:</strong> Message frequency varies based on your inquiry and service engagement. You may receive up to 4 messages per month.</p>
      <p style={s}><strong style={{color:W.text}}>Message &amp; data rates:</strong> Standard message and data rates may apply depending on your carrier and plan.</p>
      <p style={s}><strong style={{color:W.text}}>Opt-out:</strong> You may opt out of SMS communications at any time by replying STOP to any message we send. You will receive a single confirmation message and no further SMS messages will be sent.</p>
      <p style={s}><strong style={{color:W.text}}>Help:</strong> Reply HELP to any SMS message for support information or contact us at info@veridianriskgroup.org.</p>
      <div style={h}>4. Information Sharing</div>
      <p style={s}>We do not sell, rent, or trade your personal information to third parties for their marketing purposes. We may share your information with service providers who assist us in operating our website and delivering our services (including Twilio for SMS, Resend for email, Supabase for data storage, and Anthropic for AI features). These providers are contractually obligated to protect your information.</p>
      <div style={h}>5. Data Retention</div>
      <p style={s}>We retain your contact and business information for as long as necessary to provide our services and comply with legal obligations. Lead and booking records are retained for a minimum of 36 months. You may request deletion of your personal information at any time by contacting us at info@veridianriskgroup.org.</p>
      <div style={h}>6. Your Rights (California Residents — CCPA)</div>
      <p style={s}>If you are a California resident, you have the right to: (a) know what personal information we collect and how it is used; (b) request deletion of your personal information; (c) opt out of the sale of personal information (we do not sell personal information); and (d) non-discrimination for exercising your privacy rights. To exercise these rights, contact us at info@veridianriskgroup.org.</p>
      <div style={h}>7. Security</div>
      <p style={s}>We implement industry-standard technical and organizational measures to protect your personal information. However, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security of your information.</p>
      <div style={h}>8. Contact Us</div>
      <p style={s}>For privacy-related questions, data deletion requests, or to opt out of communications:</p>
      <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:14,padding:"20px 24px",marginTop:8}}>
        <div style={{fontSize:14,color:W.text,fontWeight:700,marginBottom:4}}>Veridian Risk &amp; Resilience Group LLC</div>
        <div style={{fontSize:13,color:W.textSub,marginBottom:2}}>Sanford, Florida</div>
        <a href="mailto:info@veridianriskgroup.org" style={{fontSize:13,color:W.accent,display:"block",marginBottom:2}}>info@veridianriskgroup.org</a>
        <a href="tel:+14074705992" style={{fontSize:13,color:W.accent}}>(407) 470-5992</a>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TERMS OF SERVICE PAGE
// ─────────────────────────────────────────────────────────────
function TermsPage({isMobile}){
  const s={fontSize:14,color:W.textSub,lineHeight:1.85,marginBottom:16};
  const h={fontSize:18,fontWeight:800,color:W.text,marginBottom:10,marginTop:32};
  return(
    <div style={{maxWidth:780,margin:"0 auto",padding:isMobile?"80px 24px 120px":"100px 48px 140px"}}>
      <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.12em",marginBottom:16}}>LEGAL</div>
      <h1 style={{fontSize:isMobile?"32px":"48px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",marginBottom:8}}>Terms of Service</h1>
      <p style={{fontSize:13,color:W.textDim,marginBottom:40}}>Effective Date: June 1, 2026 · Last Updated: June 20, 2026</p>
      <p style={s}>These Terms of Service ("Terms") govern your use of the Veridian Risk &amp; Resilience Group LLC ("Veridian," "we," "us," "our") website and services. By accessing our website or purchasing our services, you agree to these Terms.</p>
      <div style={h}>1. Services</div>
      <p style={s}>Veridian provides revenue recovery services for service businesses, including Missed Call Text Recovery™, AI concierge, lead capture automation, and related services as described in our current pricing plans. Service details, features, and pricing are subject to change with 30 days' notice to active clients.</p>
      <div style={h}>2. Subscriptions and Billing</div>
      <p style={s}><strong style={{color:W.text}}>Setup fees:</strong> One-time setup fees are charged at the time of account creation and are non-refundable after the service has been activated and configured.</p>
      <p style={s}><strong style={{color:W.text}}>Monthly subscriptions:</strong> Monthly plans are billed in advance on the same date each month. Cancellations take effect at the end of the current billing period — no partial-month refunds are issued.</p>
      <p style={s}><strong style={{color:W.text}}>Lead limits:</strong> Plans include a monthly lead limit. Exceeding your plan limit may result in service throttling or automatic upgrade to the next tier with your prior consent.</p>
      <div style={h}>3. Acceptable Use</div>
      <p style={s}>You agree not to use Veridian services to: (a) send unsolicited SMS or email communications to individuals who have not consented; (b) violate any applicable law including the Telephone Consumer Protection Act (TCPA), CAN-SPAM Act, or state consumer protection laws; (c) transmit false or misleading information; (d) interfere with or disrupt our services or infrastructure.</p>
      <div style={h}>4. TCPA Compliance — Client Responsibility</div>
      <p style={s}>You are responsible for ensuring that your use of Veridian SMS services complies with the TCPA and all applicable federal, state, and local laws. You represent and warrant that you have obtained all necessary consents from your customers before their contact information is enrolled in any automated messaging program. Veridian provides technology services — you are the "sender" for TCPA purposes and bear primary responsibility for compliance.</p>
      <div style={h}>5. Intellectual Property</div>
      <p style={s}>The Veridian name, logo, "Missed Call Text Recovery™" trademark, "24/7 Revenue Front Desk™" trademark, website content, software, and AI personas are proprietary to Veridian Risk &amp; Resilience Group LLC. You may not copy, reproduce, distribute, or create derivative works without our express written permission.</p>
      <div style={h}>6. Limitation of Liability</div>
      <p style={s}>TO THE MAXIMUM EXTENT PERMITTED BY LAW, VERIDIAN SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST REVENUE OR PROFITS, ARISING FROM YOUR USE OF OUR SERVICES. OUR TOTAL LIABILITY TO YOU SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE SERVICES IN THE 3 MONTHS PRECEDING THE CLAIM.</p>
      <div style={h}>7. Disclaimer of Warranties</div>
      <p style={s}>OUR SERVICES ARE PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT OUR SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT SPECIFIC RESULTS (INCLUDING REVENUE RECOVERY AMOUNTS) WILL BE ACHIEVED. REVENUE RECOVERY ESTIMATES ARE PROJECTIONS ONLY AND ARE NOT GUARANTEES.</p>
      <div style={h}>8. Termination</div>
      <p style={s}>Either party may terminate the service relationship with 30 days' written notice. We may terminate immediately for material breach of these Terms, non-payment, or illegal use of our services. Upon termination, your access to our systems will be discontinued and data may be deleted after a 90-day retention period.</p>
      <div style={h}>9. Governing Law</div>
      <p style={s}>These Terms are governed by the laws of the State of Florida. Any disputes shall be resolved in the courts of Seminole County, Florida, or through binding arbitration administered by the American Arbitration Association under its Commercial Arbitration Rules.</p>
      <div style={h}>10. Contact</div>
      <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:14,padding:"20px 24px",marginTop:8}}>
        <div style={{fontSize:14,color:W.text,fontWeight:700,marginBottom:4}}>Veridian Risk &amp; Resilience Group LLC</div>
        <div style={{fontSize:13,color:W.textSub,marginBottom:2}}>Sanford, Florida</div>
        <a href="mailto:info@veridianriskgroup.org" style={{fontSize:13,color:W.accent,display:"block",marginBottom:2}}>info@veridianriskgroup.org</a>
        <a href="tel:+14074705992" style={{fontSize:13,color:W.accent}}>(407) 470-5992</a>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HVAC LANDING PAGE
// ─────────────────────────────────────────────────────────────
const HVAC_STATS=[
  {label:"Average Service Call Value",value:"$285",sub:"Residential HVAC"},
  {label:"Average Install Value",value:"$6,800",sub:"New system replacement"},
  {label:"Typical Miss Rate",value:"23%",sub:"Industry average"},
  {label:"Annual Revenue at Risk",value:"$78K+",sub:"Per 10 missed calls/day"},
];
const HVAC_OBJECTIONS=[
  {q:"We already have voicemail.",a:"Voicemail is a dead end — 87% of callers who reach voicemail hang up and call the next contractor. Missed Call Text Recovery™ responds in under 60 seconds while the customer is still deciding."},
  {q:"We don't miss that many calls.",a:"Most HVAC owners are surprised when they see the data. 10 missed calls per day at $285 average job value equals $28,500/month in potential revenue. Our calculator shows your exact number."},
  {q:"We already use a call center / answering service.",a:"Answering services cost $300-$900/month and still miss calls after-hours and during peak season. MCTR works 24/7, responds in seconds, and costs $199/month flat."},
  {q:"We're too busy — we can't handle more calls.",a:"That's the best problem to have. Our system qualifies leads and books appointments automatically — you only deal with jobs that are ready to schedule."},
];
const HVAC_TIMELINE=[
  {day:"Day 1",title:"Setup Call (30 min)",desc:"We configure your text-back response, set your business hours, and test the system live with your number."},
  {day:"Day 3",title:"Go Live",desc:"Your MCTR system is active. Every missed call triggers an automatic text within 60 seconds."},
  {day:"Day 7",title:"First Report",desc:"You receive a summary showing every missed call captured, conversation started, and appointment request made."},
  {day:"Day 30",title:"ROI Review",desc:"We review your first month together. Average HVAC client sees 3-7 recovered jobs in month one."},
];

function HVACLandingPage({isMobile}){
  const[oIdx,setOIdx]=useState(null);
  const[calls,setCalls]=useState(15);
  const[val,setVal]=useState(285);
  const miss=0.23;
  const conv=0.35;
  const missedMo=Math.round(calls*30*miss);
  const recMo=Math.round(missedMo*conv);
  const recRevMo=recMo*val;
  const recRevAnn=recRevMo*12;
  const roi=Math.round((recRevAnn-199*12-299)/((199*12)+299)*100);
  return(
    <div>
      {/* Hero */}
      <section style={{padding:isMobile?"100px 24px 80px":"140px 48px 100px",background:`linear-gradient(180deg,${W.surface} 0%,${W.bg} 100%)`,borderBottom:`1px solid ${W.border}`}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:isMobile?48:80,alignItems:"center"}}>
          <div>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:100,padding:"6px 14px",marginBottom:24}}>
              <span style={{fontSize:10,fontWeight:700,color:W.amber,letterSpacing:"0.12em"}}>HVAC CONTRACTORS</span>
            </div>
            <h1 style={{fontSize:isMobile?"36px":"58px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.04,marginBottom:20}}>
              Stop losing HVAC jobs to<br style={{display:isMobile?"none":"block"}}/> <span style={{color:W.amber}}>missed calls.</span>
            </h1>
            <p style={{fontSize:isMobile?"15px":"18px",color:W.textSub,lineHeight:1.75,marginBottom:32,maxWidth:500}}>
              Every missed call during a heat wave or freeze event is a $285–$6,800 job walking to your competitor. Missed Call Text Recovery™ responds in under 60 seconds — 24/7, including nights and weekends.
            </p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <a href="/#contact" className="vd-btn" style={{background:`linear-gradient(135deg,${W.amber},#D97706)`,color:"#fff",padding:"15px 32px",borderRadius:12,fontSize:16,fontWeight:700,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:8,boxShadow:"0 4px 24px rgba(245,158,11,0.35)"}}>
                Get My Free HVAC Assessment <ArrowRight size={15}/>
              </a>
            </div>
            <div style={{marginTop:20,fontSize:12,color:W.textDim}}>$199/month · No contracts · Setup in 5 business days</div>
          </div>
          <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:"28px 32px"}}>
            <div style={{fontSize:11,fontWeight:700,color:W.amber,letterSpacing:"0.12em",marginBottom:20}}>YOUR HVAC RECOVERY ESTIMATE</div>
            {[{label:"Daily calls",value:calls,setValue:setCalls,min:5,max:60,step:5},{label:"Average job value ($)",value:val,setValue:setVal,min:100,max:2000,step:50}].map(({label,value,setValue,min,max,step})=>(
              <div key={label} style={{marginBottom:20}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:12,color:W.textSub,fontWeight:600}}>{label}</span>
                  <span style={{fontSize:14,fontWeight:800,color:W.text}}>{label.includes("$")?`$${value.toLocaleString()}`:value}</span>
                </div>
                <input type="range" min={min} max={max} step={step} value={value} onChange={e=>setValue(Number(e.target.value))}
                  style={{width:"100%",accentColor:W.amber}}/>
              </div>
            ))}
            <div style={{borderTop:`1px solid ${W.border}`,paddingTop:20,marginTop:4}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                {[{l:"Calls recovered/mo",v:`${recMo} jobs`},{l:"Revenue recovered/mo",v:`$${recRevMo.toLocaleString()}`},{l:"Annual recovery",v:`$${recRevAnn.toLocaleString()}`},{l:"First-year ROI",v:`${roi}%`}].map(({l,v})=>(
                  <div key={l} style={{background:W.surface,borderRadius:10,padding:"12px 14px"}}>
                    <div style={{fontSize:10,color:W.textDim,marginBottom:4}}>{l}</div>
                    <div style={{fontSize:16,fontWeight:800,color:W.amber}}>{v}</div>
                  </div>
                ))}
              </div>
              <a href="/#contact" className="vd-btn" style={{display:"flex",background:`linear-gradient(135deg,${W.amber},#D97706)`,color:"#fff",borderRadius:10,padding:"13px 20px",fontSize:14,fontWeight:700,textDecoration:"none",justifyContent:"center",gap:8,boxShadow:"0 4px 20px rgba(245,158,11,0.3)"}}>
                Start Recovering ${recRevMo.toLocaleString()}/mo <ArrowRight size={14}/>
              </a>
            </div>
          </div>
        </div>
      </section>
      {/* Stats */}
      <section style={{padding:isMobile?"60px 24px":"80px 48px",background:W.bg}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:16}}>
          {HVAC_STATS.map((s,i)=>(
            <div key={i} className="vd-card" style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:16,padding:"24px 20px",textAlign:"center"}}>
              <div style={{fontSize:isMobile?"26px":"32px",fontWeight:900,color:W.amber,marginBottom:4}}>{s.value}</div>
              <div style={{fontSize:12,fontWeight:700,color:W.text,marginBottom:4}}>{s.label}</div>
              <div style={{fontSize:11,color:W.textDim}}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>
      {/* How it works for HVAC */}
      <section style={{padding:isMobile?"60px 24px":"100px 48px",background:W.surface,borderTop:`1px solid ${W.border}`,borderBottom:`1px solid ${W.border}`}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:56}}>
            <div style={{fontSize:11,fontWeight:700,color:W.amber,letterSpacing:"0.12em",marginBottom:12}}>HOW IT WORKS FOR HVAC</div>
            <h2 style={{fontSize:isMobile?"28px":"42px",fontWeight:900,color:W.text,letterSpacing:"-0.04em"}}>Customer calls. You miss it. We recover it.</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,1fr)",gap:16}}>
            {[{n:1,t:"Missed Call Detected",d:"A customer calls your number. You're on a job, driving, or after hours. The call goes unanswered.",c:W.red},{n:2,t:"60-Second Text Back",d:"MCTR automatically sends a personalized text message within 60 seconds. The customer is still thinking about you.",c:W.amber},{n:3,t:"Conversation Started",d:"The customer replies. Our system (and optionally Alex AI) keeps the conversation moving — qualifying, scheduling.",c:W.accent},{n:4,t:"Job Booked",d:"The appointment is requested and captured. You get notified. Revenue that was walking out the door is now on your calendar.",c:W.green}].map((step)=>(
              <div key={step.n} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:16,padding:"24px 20px",textAlign:"center"}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:`${step.c}18`,border:`2px solid ${step.c}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:16,fontWeight:900,color:step.c}}>{step.n}</div>
                <div style={{fontSize:14,fontWeight:800,color:W.text,marginBottom:8}}>{step.t}</div>
                <div style={{fontSize:12,color:W.textSub,lineHeight:1.65}}>{step.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Timeline */}
      <section style={{padding:isMobile?"60px 24px":"100px 48px",background:W.bg}}>
        <div style={{maxWidth:780,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:56}}>
            <div style={{fontSize:11,fontWeight:700,color:W.amber,letterSpacing:"0.12em",marginBottom:12}}>ONBOARDING TIMELINE</div>
            <h2 style={{fontSize:isMobile?"28px":"42px",fontWeight:900,color:W.text,letterSpacing:"-0.04em"}}>Live in 5 business days.</h2>
          </div>
          <div style={{position:"relative",paddingLeft:isMobile?0:32}}>
            {HVAC_TIMELINE.map((t,i)=>(
              <div key={i} style={{display:"flex",gap:24,marginBottom:i<HVAC_TIMELINE.length-1?32:0,alignItems:"flex-start"}}>
                <div style={{flexShrink:0,background:`${W.amber}18`,border:`2px solid ${W.amber}`,borderRadius:10,padding:"6px 12px",fontSize:11,fontWeight:800,color:W.amber,whiteSpace:"nowrap"}}>{t.day}</div>
                <div>
                  <div style={{fontSize:15,fontWeight:800,color:W.text,marginBottom:4}}>{t.title}</div>
                  <div style={{fontSize:13,color:W.textSub,lineHeight:1.65}}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Objection handling */}
      <section style={{padding:isMobile?"60px 24px":"100px 48px",background:W.surface,borderTop:`1px solid ${W.border}`,borderBottom:`1px solid ${W.border}`}}>
        <div style={{maxWidth:780,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <div style={{fontSize:11,fontWeight:700,color:W.amber,letterSpacing:"0.12em",marginBottom:12}}>COMMON QUESTIONS</div>
            <h2 style={{fontSize:isMobile?"28px":"40px",fontWeight:900,color:W.text,letterSpacing:"-0.04em"}}>We've heard every objection.</h2>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {HVAC_OBJECTIONS.map((o,i)=>(
              <div key={i} style={{background:W.card,border:`1px solid ${oIdx===i?W.amber:W.border}`,borderRadius:14,overflow:"hidden",transition:"border-color .2s"}}>
                <button onClick={()=>setOIdx(oIdx===i?null:i)} style={{width:"100%",background:"none",border:"none",padding:"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",gap:16}}>
                  <span style={{fontSize:14,fontWeight:700,color:W.text,textAlign:"left"}}>{o.q}</span>
                  <ChevronDown size={16} style={{color:W.textSub,flexShrink:0,transform:oIdx===i?"rotate(180deg)":"none",transition:"transform .2s"}}/>
                </button>
                {oIdx===i&&<div style={{padding:"0 24px 18px",fontSize:13,color:W.textSub,lineHeight:1.75}}>{o.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Final CTA */}
      <section style={{padding:isMobile?"80px 24px":"120px 48px",background:W.bg}}>
        <div style={{maxWidth:680,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:11,fontWeight:700,color:W.amber,letterSpacing:"0.12em",marginBottom:16}}>HVAC CONTRACTORS — GET STARTED</div>
          <h2 style={{fontSize:isMobile?"30px":"48px",fontWeight:900,color:W.text,letterSpacing:"-0.04em",lineHeight:1.04,marginBottom:16}}>Your next job is already calling.</h2>
          <p style={{fontSize:isMobile?"15px":"17px",color:W.textSub,lineHeight:1.72,maxWidth:480,margin:"0 auto 32px"}}>Book a free HVAC Revenue Recovery Assessment. We'll show you exactly how many jobs you're losing to missed calls — and set up Missed Call Text Recovery™ within 5 business days.</p>
          <a href="/#contact" className="vd-btn" style={{background:`linear-gradient(135deg,${W.amber},#D97706)`,color:"#fff",padding:"16px 40px",borderRadius:12,fontSize:17,fontWeight:700,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:8,boxShadow:"0 4px 24px rgba(245,158,11,0.35)"}}>
            Book My Free HVAC Assessment <ArrowRight size={16}/>
          </a>
          <div style={{marginTop:20,fontSize:12,color:W.textDim}}>$199/month · No long-term contracts · Live in 5 business days</div>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CLIENT PORTAL PAGE
// ─────────────────────────────────────────────────────────────
function ClientPortalPage({isMobile}){
  const[pin,setPin]=useState("");
  const[authed,setAuthed]=useState(false);
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState(null);
  const[data,setData]=useState(null);
  const submit=async e=>{
    e.preventDefault();
    if(!pin.trim())return;
    setLoading(true);setErr(null);
    try{
      const r=await fetch(`/api/metrics?pin=${encodeURIComponent(pin)}`);
      if(r.status===401||r.status===403){setErr("Incorrect PIN. Contact info@veridianriskgroup.org to access your portal.");setLoading(false);return;}
      if(!r.ok)throw new Error("Server error");
      const d=await r.json();
      setData(d);setAuthed(true);
    }catch{setErr("Unable to connect. Please try again or contact us directly.");}
    setLoading(false);
  };
  if(!authed){
    return(
      <div style={{minHeight:"80vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px"}}>
        <div style={{width:"100%",maxWidth:400}}>
          <div style={{textAlign:"center",marginBottom:40}}>
            <div style={{width:48,height:48,background:`linear-gradient(135deg,${W.accent},${W.accentH})`,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><Lock size={20} style={{color:"#fff"}}/></div>
            <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.12em",marginBottom:8}}>CLIENT PORTAL</div>
            <h1 style={{fontSize:28,fontWeight:900,color:W.text,marginBottom:8}}>Your Recovery Dashboard</h1>
            <p style={{fontSize:13,color:W.textSub,lineHeight:1.65}}>Enter your client PIN to view your leads, texts sent, and recovery metrics.</p>
          </div>
          <form onSubmit={submit} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,padding:32}}>
            <div style={{marginBottom:20}}>
              <label style={{fontSize:11,fontWeight:700,color:W.textSub,display:"block",marginBottom:8,letterSpacing:"0.05em"}}>CLIENT PIN</label>
              <input type="password" value={pin} onChange={e=>setPin(e.target.value)} placeholder="Enter your PIN" style={{width:"100%",background:W.surface,border:`1px solid ${W.border}`,borderRadius:9,padding:"12px 14px",color:W.text,fontSize:15,outline:"none",letterSpacing:"0.2em",textAlign:"center"}}/>
            </div>
            {err&&<div style={{marginBottom:16,padding:"11px 14px",background:W.redB,border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,fontSize:12,color:W.red,lineHeight:1.55}}>{err}</div>}
            <button type="submit" disabled={loading||!pin.trim()} className="vd-btn" style={{width:"100%",background:W.accent,color:"#fff",border:"none",borderRadius:10,padding:14,fontSize:15,fontWeight:700,cursor:"pointer",justifyContent:"center",opacity:loading||!pin.trim()?0.6:1}}>
              {loading?"Checking...":"Access My Dashboard"}
            </button>
            <div style={{marginTop:20,textAlign:"center",fontSize:12,color:W.textDim}}>Don't have a PIN? <a href="mailto:info@veridianriskgroup.org" style={{color:W.accent,textDecoration:"none"}}>Contact your account manager</a></div>
          </form>
        </div>
      </div>
    );
  }
  const leads=data?.leads||[];
  const totalLeads=leads.length;
  const booked=leads.filter(l=>l.status==="consultation_booked"||l.status==="won").length;
  const hot=leads.filter(l=>l.priority==="HOT").length;
  const recent=leads.slice(0,10);
  return(
    <div style={{maxWidth:1100,margin:"0 auto",padding:isMobile?"80px 24px 120px":"100px 48px 140px"}}>
      <div style={{marginBottom:40}}>
        <div style={{fontSize:11,fontWeight:700,color:W.accent,letterSpacing:"0.12em",marginBottom:8}}>CLIENT PORTAL</div>
        <h1 style={{fontSize:isMobile?"28px":"40px",fontWeight:900,color:W.text,marginBottom:4}}>Your Recovery Dashboard</h1>
        <p style={{fontSize:13,color:W.textSub}}>All metrics are live from your account.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:16,marginBottom:40}}>
        {[{l:"Total Leads",v:totalLeads,c:W.accent},{l:"Consultations Booked",v:booked,c:W.green},{l:"HOT Leads",v:hot,c:W.red},{l:"Active Follow-Ups",v:Math.max(0,totalLeads-booked),c:W.amber}].map(({l,v,c})=>(
          <div key={l} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:16,padding:"20px 22px"}}>
            <div style={{fontSize:11,color:W.textDim,marginBottom:8,fontWeight:600}}>{l}</div>
            <div style={{fontSize:32,fontWeight:900,color:c}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:20,overflow:"hidden"}}>
        <div style={{padding:"20px 24px",borderBottom:`1px solid ${W.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:14,fontWeight:800,color:W.text}}>Recent Leads</div>
          <div style={{fontSize:11,color:W.textDim}}>Last {Math.min(10,totalLeads)} of {totalLeads}</div>
        </div>
        {recent.length===0?(
          <div style={{padding:"48px 24px",textAlign:"center",color:W.textDim,fontSize:13}}>No leads yet. Your recovery system is active and monitoring.</div>
        ):(
          <div>
            {recent.map((l,i)=>(
              <div key={i} style={{padding:"16px 24px",borderBottom:i<recent.length-1?`1px solid ${W.border}`:undefined,display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:W.text}}>{l.name||"Anonymous"}</div>
                  <div style={{fontSize:11,color:W.textDim}}>{l.business||"—"} · {l.email}</div>
                </div>
                <div style={{display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
                  <span style={{fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:100,background:l.priority==="HOT"?W.redB:l.priority==="HIGH"?W.amberB:W.accentB,color:l.priority==="HOT"?W.red:l.priority==="HIGH"?W.amber:W.accent}}>{l.priority}</span>
                  <span style={{fontSize:10,color:W.textDim}}>{l.status||"new"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{marginTop:32,padding:"20px 24px",background:W.card,border:`1px solid ${W.border}`,borderRadius:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div style={{fontSize:13,color:W.textSub}}>Questions about your results? Your account manager is available 24/7.</div>
        <a href="tel:+14074705992" style={{fontSize:14,fontWeight:700,color:W.accent,textDecoration:"none"}}>(407) 470-5992</a>
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
    }else if(path==="/missed-call-text-recovery"){
      document.title="Missed Call Text Recovery™ — Veridian";
    }else if(path==="/hvac"){
      document.title="HVAC Missed Call Recovery — Veridian";
    }else if(path==="/privacy"){
      document.title="Privacy Policy — Veridian";
    }else if(path==="/terms"){
      document.title="Terms of Service — Veridian";
    }else if(path==="/portal"){
      document.title="Client Portal — Veridian";
    }else{
      document.title="Veridian — Turn Missed Calls Into Revenue";
    }
  },[path]);
  const sector=path.startsWith("/industries/")?path.replace("/industries/",""):null;
  const isMCTR=path==="/missed-call-text-recovery";
  const isPrivacy=path==="/privacy";
  const isTerms=path==="/terms";
  const isHVAC=path==="/hvac";
  const isPortal=path==="/portal";
  const isSpecial=sector||path==="/dashboard"||path==="/pricing"||path==="/demo"||isMCTR||isPrivacy||isTerms||isHVAC||isPortal;
  return(
    <div style={{background:W.bg,color:W.text,minHeight:"100vh",paddingBottom:isMobile?80:0}}>
      <WebNav isMobile={isMobile}/>
      {sector&&<IndustryPage sector={sector} isMobile={isMobile}/>}
      {path==="/dashboard"&&<DashboardPage/>}
      {path==="/pricing"&&<PricingPage isMobile={isMobile}/>}
      {path==="/demo"&&<DemoPage isMobile={isMobile}/>}
      {isMCTR&&<MCTRLandingPage isMobile={isMobile}/>}
      {isPrivacy&&<PrivacyPage isMobile={isMobile}/>}
      {isTerms&&<TermsPage isMobile={isMobile}/>}
      {isHVAC&&<HVACLandingPage isMobile={isMobile}/>}
      {isPortal&&<ClientPortalPage isMobile={isMobile}/>}
      {!isSpecial&&<Homepage isMobile={isMobile}/>}
      {!isSpecial&&<WebFooter isMobile={isMobile}/>}
      {(path==="/pricing"||path==="/demo"||isMCTR||isPrivacy||isTerms||isHVAC||isPortal)&&<WebFooter isMobile={isMobile}/>}
      {isMobile&&<StickyMobileCTA/>}
      <ChatWidget/>
    </div>
  );
}
