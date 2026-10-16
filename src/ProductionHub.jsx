import React from "react";
import { Clapperboard, BookOpen, Mic2, Cat, Sparkles, ArrowUpRight, PlayCircle } from "lucide-react";

const projects = [
  { title: "Drama Hub", tag: "SHORT-FORM STORIES", desc: "Character-driven drama, cliffhangers, and episodic storytelling.", icon: Clapperboard, image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=85", imageAlt: "Cinematic film production equipment", href: "https://incomparable-marshmallow-b3d5c4.netlify.app/", tone: "drama", label: "OPEN DRAMA HUB" },
  { title: "Ember Stories", tag: "KIDS & FAMILY", desc: "Gentle family adventures, discovery, and kindness. Official character artwork will be used here once connected.", icon: Sparkles, image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=85", imageAlt: "Sunlit green forest setting for a family adventure", href: "https://www.tiktok.com/@gspeed25", tone: "ember", label: "VIEW ON TIKTOK" },
  { title: "Dance Movie", tag: "DANCE & PERFORMANCE", desc: "Explore dance-led stories, movement, and performance highlights.", icon: PlayCircle, image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=85", imageAlt: "Stage performance under dramatic lighting", href: "https://www.tiktok.com/@gspeed25", tone: "cats", label: "VIEW ON TIKTOK" },
  { title: "Cat Series", tag: "COMEDY & SHORTS", desc: "Funny cat moments and short-form comedy from the Quik Pik studio.", icon: Cat, image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=85", imageAlt: "Cat looking toward the camera", href: "https://www.tiktok.com/@gspeed25", tone: "cats", label: "VIEW ON TIKTOK" },
  { title: "Books & Digital Products", tag: "READ & CREATE", desc: "Discover creative books, activity ideas, and digital products from the studio.", icon: BookOpen, image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1200&q=85", imageAlt: "Colorful books arranged on a table", href: "https://www.tiktok.com/@gspeed25", tone: "books", label: "OPEN STUDIO PROFILE" },
  { title: "Podcast Studio", tag: "AUDIO STORIES", desc: "Audio concepts, conversations, and original storytelling in development.", icon: Mic2, image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=85", imageAlt: "Podcast microphone in a recording studio", href: null, tone: "podcast", label: "IN PRODUCTION" },
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
   <div className="qp-visual qp-visual-feature">
    <img className="qp-hero-photo" src="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1500&q=90" alt="Cinematic camera and film production setup" fetchPriority="high" onError={e => { e.currentTarget.style.display = "none"; }}/>
    <div className="qp-hero-shade"/>
    <div className="qp-hero-stamp"><Emblem/></div>
    <div className="qp-hero-caption"><span>FEATURED STUDIO</span><strong>Every story starts with a spark.</strong><small>Drama · Family · Comedy · Original ideas</small></div>
    <div className="qp-float qp-float-one">✦ STORY LAB</div><div className="qp-float qp-float-two">★ MADE TO BE WATCHED</div>
   </div>
  </section>
  <section id="studios" className="qp-studios"><div className="qp-section-head"><div><p className="qp-kicker">THE PRODUCTION LINEUP</p><h2>Choose your studio</h2></div><span className="qp-count">06 CREATIVE DIVISIONS</span></div><div className="qp-grid">{projects.map((p,i)=>{const Icon=p.icon;return <article className={"qp-card "+p.tone} key={p.title}><div className="qp-card-art">{p.image && <img className="qp-card-photo" src={p.image} alt={p.imageAlt || ""} loading="lazy" onError={e => { e.currentTarget.style.display = "none"; }}/>}<div className="qp-card-image-shade"/><span className="qp-number">0{i+1}</span><div className="qp-art-icon"><Icon size={30} strokeWidth={1.5}/></div><span className="qp-art-tag">{p.tag}</span>{p.href && <span className="qp-availability">EXPLORE</span>}</div><div className="qp-card-copy"><h3>{p.title}</h3><p>{p.desc}</p>{p.href ? <a href={p.href} target="_blank" rel="noreferrer" className="qp-card-link" aria-label={"Open "+p.title+" in a new tab"}>{p.label}<ArrowUpRight size={16}/></a> : <div className="qp-card-link qp-card-pending"><span>{p.label}</span><span className="qp-status-dot" aria-hidden="true"/></div>}</div></article>})}</div></section>
  <section className="qp-bottom"><div><p className="qp-kicker">MADE FOR THE NEXT STORY</p><h2>Start with one great release.<br/><em>Build from there.</em></h2></div><p>New projects are added as production-ready files pass review. Drafts are clearly identified and nothing is published without owner approval.</p></section>
  <footer className="qp-footer"><span>© {new Date().getFullYear()} Quik Pik Production</span><span>SAFETY · DRAMA · FAMILY</span><a href="https://www.tiktok.com/@gspeed25" target="_blank" rel="noreferrer">Open Quik Pik TikTok ↗</a></footer>
 </main>
}
