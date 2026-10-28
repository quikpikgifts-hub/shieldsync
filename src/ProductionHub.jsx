import React from "react";
import { Clapperboard, BookOpen, Mic2, Cat, Sparkles, ArrowUpRight, PlayCircle } from "lucide-react";

const projects = [
  { title: "Drama Hub", tag: "SHORT-FORM STORIES", desc: "Character-driven drama, cliffhangers, and episodic storytelling.", icon: Clapperboard, href: "/drama", tone: "drama", label: "OPEN DRAMA HUB" },
  { title: "Ember Stories", tag: "PUBLISHED · KIDS & FAMILY", desc: "Explore the Ember collection on the official Quik Pik Productions TikTok profile.", icon: Sparkles, href: "https://www.tiktok.com/@quikpikproductions", tone: "ember", label: "OPEN TIKTOK PROFILE" },
  { title: "Dance Movie", tag: "PUBLISHED · DANCE", desc: "Open the Quik Pik Productions TikTok profile for dance releases. Individual movie links will be added when verified.", icon: PlayCircle, href: "https://www.tiktok.com/@quikpikproductions", tone: "cats", label: "VIEW ON TIKTOK" },
  { title: "Cat Series", tag: "PUBLISHED · COMEDY", desc: "Explore cat comedy releases on the Quik Pik Productions TikTok profile.", icon: Cat, href: "https://www.tiktok.com/@quikpikproductions", tone: "cats", label: "VIEW ON TIKTOK" },
  { title: "Books & Digital Products", tag: "PUBLISHED · READ & CREATE", desc: "Books and digital products are part of the released catalogue. Open the studio profile while individual store links are being connected.", icon: BookOpen, href: "https://www.tiktok.com/@quikpikproductions", tone: "books", label: "OPEN TIKTOK PROFILE" },
  { title: "Podcast Studio", tag: "AUDIO STORIES", desc: "Podcast concepts, episode production, and listening experiences.", icon: Mic2, href: null, tone: "podcast", label: "IN PRODUCTION" },
];

function Emblem(){return <svg viewBox="0 0 240 240" role="img" aria-label="Quik Pik Production QP emblem" className="qp-emblem">
  <defs><path id="qp-arc" d="M 35,120 A 85,85 0 0,1 205,120"/><path id="qp-bottom" d="M 28,133 A 93,93 0 0,0 212,133"/></defs>
  <circle cx="120" cy="120" r="112" fill="#0c2540" stroke="#dfa814" strokeWidth="5"/><circle cx="120" cy="120" r="101" fill="none" stroke="#f0bd2c" strokeWidth="1.5"/>
  <text fill="#f8f1df" fontSize="11" fontWeight="800" letterSpacing="2.3"><textPath href="#qp-arc" startOffset="50%" textAnchor="middle">QUIK PIK PRODUCTION</textPath></text>
  <path d="M78 91 L162 91 L162 130 L120 169 L78 130 Z" fill="none" stroke="#dfa814" strokeWidth="3"/>
  <path d="M78 105 L162 105" stroke="#dfa814" strokeWidth="2"/><text x="120" y="103" textAnchor="middle" fontSize="12" fill="#f4c337">★</text>
  <text x="120" y="142" textAnchor="middle" fontSize="46" fontWeight="900" fill="#fff">QP</text>
  <text fill="#f4c337" fontSize="9" fontWeight="800" letterSpacing="2"><textPath href="#qp-bottom" startOffset="50%" textAnchor="middle">SAFETY · DRAMA · FAMILY</textPath></text>
  <text x="34" y="123" textAnchor="middle" fontSize="10" fill="#f4c337">★</text><text x="206" y="123" textAnchor="middle" fontSize="10" fill="#f4c337">★</text>
</svg>}

export default function ProductionHub(){
 React.useEffect(() => { document.title = "Quik Pik Production | Stories, Characters & Experiences"; const description = document.querySelector('meta[name="description"]'); if (description) description.setAttribute("content", "Explore Quik Pik Production: drama, family stories, comedy, creative books, and audio projects."); }, []);
 return <main className="qp-shell">
  <header className="qp-nav"><a className="qp-brand" href="/"><Emblem/><span><b>QUIK PIK</b><small>PRODUCTION HOUSE</small></span></a><span className="qp-live"><i/> PRODUCTION HUB</span></header>
  <section className="qp-hero">
   <div className="qp-copy"><p className="qp-kicker">STORIES. CHARACTERS. EXPERIENCES.</p><h1>Ideas become<br/><em>something worth watching.</em></h1><p className="qp-sub">One home for Quik Pik’s stories, family adventures, funny cats, books, and audio projects. Choose a studio to explore.</p><div className="qp-actions"><a className="qp-primary" href="#studios"><PlayCircle size={18}/> Explore productions <ArrowUpRight size={16}/></a><span className="qp-no-cost">Built to grow · $0 new spend</span></div></div>
   <div className="qp-visual"><div className="qp-orbit qp-orbit-a"/><div className="qp-orbit qp-orbit-b"/><div className="qp-logo-large"><Emblem/></div><div className="qp-float qp-float-one">✦ STORY LAB</div><div className="qp-float qp-float-two">★ FAMILY · DRAMA · FUN</div></div>
  </section>
  <section id="studios" className="qp-studios"><div className="qp-section-head"><div><p className="qp-kicker">THE PRODUCTION LINEUP</p><h2>Choose your studio</h2></div><span className="qp-count">06 CREATIVE DIVISIONS</span></div><div className="qp-grid">{projects.map((p,i)=>{const Icon=p.icon;return <article className={"qp-card "+p.tone} key={p.title}><div className="qp-card-art"><span className="qp-number">0{i+1}</span><div className="qp-art-icon"><Icon size={36} strokeWidth={1.5}/></div><span className="qp-art-tag">{p.tag}</span>{p.href && <span className="qp-availability">LIVE</span>}</div><div className="qp-card-copy"><h3>{p.title}</h3><p>{p.desc}</p>{p.href ? <a href={p.href} target="_blank" rel="noreferrer" className="qp-card-link" aria-label={"Open "+p.title+" in a new tab"}>{p.label}<ArrowUpRight size={16}/></a> : <div className="qp-card-link qp-card-pending"><span>{p.label}</span><span className="qp-status-dot" aria-hidden="true"/></div>}</div></article>})}</div></section>
  <section className="qp-bottom"><div><p className="qp-kicker">MADE FOR THE NEXT STORY</p><h2>Start with one great release.<br/><em>Build from there.</em></h2></div><p>New projects are added as production-ready files pass review. Drafts are clearly identified and nothing is published without owner approval.</p></section>
  <footer className="qp-footer"><span>© {new Date().getFullYear()} Quik Pik Production</span><span>SAFETY · DRAMA · FAMILY</span><a href="https://www.tiktok.com/@quikpikproductions" target="_blank" rel="noreferrer">Open Quik Pik TikTok ↗</a></footer>
 </main>
}
