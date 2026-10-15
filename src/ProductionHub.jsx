import React from "react";
import { ArrowUpRight, PlayCircle } from "lucide-react";

const TIKTOK_URL = "https://www.tiktok.com/@gspeed25";

const projects = [
  { title: "Drama Hub", tag: "DRAMA SERIES", desc: "Character-driven drama, cliffhangers, and episodic storytelling.", art: "drama", href: "https://incomparable-marshmallow-b3d5c4.netlify.app/", tone: "drama", label: "OPEN DRAMA HUB", status: "AVAILABLE" },
  { title: "Ember’s Big Discoveries", tag: "KIDS & FAMILY", desc: "Gentle discovery stories, learning adventures, and the Ember family world.", art: "ember", href: TIKTOK_URL, tone: "ember", label: "VIEW RELEASES", status: "RELEASED CATALOGUE" },
  { title: "Dance Movie", tag: "DANCE FILM", desc: "The Quik Pik dance movie and related dance releases.", art: "dance", href: TIKTOK_URL, tone: "dance", label: "VIEW RELEASES", status: "RELEASED CATALOGUE" },
  { title: "Cat Series", tag: "CAT COMEDY", desc: "The cat series, funny moments, and related short-form releases.", art: "cats", href: TIKTOK_URL, tone: "cats", label: "VIEW RELEASES", status: "RELEASED CATALOGUE" },
  { title: "Books & Digital Products", tag: "BOOKS & ACTIVITIES", desc: "Explore the Quik Pik books and digital product catalogue.", art: "books", href: TIKTOK_URL, tone: "books", label: "VIEW CATALOGUE", status: "RELEASED CATALOGUE" },
  { title: "Podcast Studio", tag: "AUDIO & TALK", desc: "Podcast concepts, episode production, and audio storytelling.", art: "podcast", tone: "podcast", label: "STUDIO DETAILS", status: "STUDIO PREVIEW" },
];

function Emblem() {
  return <svg viewBox="0 0 120 120" role="img" aria-label="Quik Pik Productions emblem" className="qp-emblem">
    <circle cx="60" cy="60" r="55" fill="#0c2540" stroke="#dfa814" strokeWidth="3" />
    <circle cx="60" cy="60" r="48" fill="none" stroke="#f0bd2c" strokeWidth="1" />
    <path d="M37 38H83V65L60 86L37 65Z" fill="none" stroke="#dfa814" strokeWidth="2" />
    <path d="M37 48H83" stroke="#dfa814" strokeWidth="1.5" />
    <text x="60" y="47" textAnchor="middle" fontSize="8" fill="#f4c337">★</text>
    <text x="60" y="69" textAnchor="middle" fontSize="29" fontWeight="900" fill="#fff">QP</text>
  </svg>;
}

function CoverArt({ type, title }) {
  const palettes = {
    drama: ["#120f20", "#8d263e", "#f4c46c"],
    ember: ["#113b43", "#3b9b83", "#f5d98b"],
    dance: ["#160f35", "#c73e83", "#72e1e5"],
    cats: ["#22143f", "#8559c5", "#ffc86e"],
    books: ["#4a2b20", "#bd7d36", "#f8e7ba"],
    podcast: ["#142c46", "#4d6d91", "#d4e4f3"],
  };
  const [base, glow, accent] = palettes[type] || palettes.drama;
  return <div className={"qp-cover qp-cover-" + type} role="img" aria-label={title + " cover artwork"}>
    <div className="qp-cover-glow" style={{ background: glow }} />
    <div className="qp-cover-frame" />
    {type === "drama" && <><div className="qp-drama-moon" /><div className="qp-drama-silhouette qp-drama-one" /><div className="qp-drama-silhouette qp-drama-two" /><div className="qp-cover-eyebrow">AN ORIGINAL SERIES</div><div className="qp-cover-main">THE<br />NEXT<br /><em>CHAPTER</em></div><div className="qp-cover-sub">SECRETS · CHOICES · CONSEQUENCES</div></>}
    {type === "ember" && <><div className="qp-valley-hill qp-hill-one" /><div className="qp-valley-hill qp-hill-two" /><div className="qp-firefly f1" /><div className="qp-firefly f2" /><div className="qp-firefly f3" /><div className="qp-cover-eyebrow">QUIK PIK KIDS & FAMILY</div><div className="qp-cover-main">EMBER’S<br /><em>BIG</em><br />DISCOVERIES</div><div className="qp-cover-sub">EXPLORE · LEARN · BE KIND</div></>}
    {type === "dance" && <><div className="qp-stage-light light-one" /><div className="qp-stage-light light-two" /><div className="qp-stage-floor" /><div className="qp-dance-silhouette dancer-one" /><div className="qp-dance-silhouette dancer-two" /><div className="qp-cover-eyebrow">A QUIK PIK FEATURE</div><div className="qp-cover-main">FEEL<br />THE <em>BEAT</em></div><div className="qp-cover-sub">MUSIC · MOVEMENT · ENERGY</div></>}
    {type === "cats" && <><div className="qp-cat-orbit orbit-one" /><div className="qp-cat-orbit orbit-two" /><div className="qp-cat-shape cat-one" /><div className="qp-cat-shape cat-two" /><div className="qp-cover-eyebrow">COMEDY SERIES</div><div className="qp-cover-main">CAT<br /><em>MOVES</em></div><div className="qp-cover-sub">SMALL PAWS. BIG PERSONALITIES.</div></>}
    {type === "books" && <><div className="qp-book book-one" /><div className="qp-book book-two" /><div className="qp-book book-three" /><div className="qp-cover-eyebrow">READ · MAKE · DISCOVER</div><div className="qp-cover-main">BOOKS &<br /><em>CREATIONS</em></div><div className="qp-cover-sub">DIGITAL BOOKS · ACTIVITY PAGES</div></>}
    {type === "podcast" && <><div className="qp-mic-ring" /><div className="qp-mic" /><div className="qp-cover-eyebrow">QUIK PIK AUDIO</div><div className="qp-cover-main">THE<br /><em>MIC</em> IS<br />YOURS</div><div className="qp-cover-sub">CONVERSATIONS & STORIES</div></>}
    <div className="qp-cover-footer"><span>QUIK PIK PRODUCTIONS</span><span>QP</span></div>
    <style>{".qp-cover{--cover-base:" + base + ";--cover-glow:" + glow + ";--cover-accent:" + accent + "}"}</style>
  </div>;
}

export default function ProductionHub() {
  React.useEffect(() => {
    document.title = "Quik Pik Productions | Films, Stories & Books";
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", "Explore Quik Pik Productions: Drama Hub, Ember’s Big Discoveries, dance films, cat comedy, books, and creative projects.");
  }, []);

  return <main className="qp-shell">
    <header className="qp-nav">
      <a className="qp-brand" href="/" aria-label="Quik Pik Productions home"><Emblem /><span><b>QUIK PIK</b><small>PRODUCTIONS</small></span></a>
      <span className="qp-live"><i /> OFFICIAL PRODUCTION HUB</span>
    </header>
    <section className="qp-hero">
      <div className="qp-copy"><p className="qp-kicker">FILMS. STORIES. CHARACTERS.</p><h1>Welcome to<br /><em>Quik Pik Productions.</em></h1><p className="qp-sub">One home for drama, family adventures, dance films, cat comedy, books, and original ideas. Choose a production to explore.</p><div className="qp-actions"><a className="qp-primary" href="#studios"><PlayCircle size={18} /> Explore productions <ArrowUpRight size={16} /></a><span className="qp-no-cost">Original stories · One creative home</span></div></div>
      <div className="qp-visual"><div className="qp-orbit qp-orbit-a" /><div className="qp-orbit qp-orbit-b" /><div className="qp-logo-large"><Emblem /></div><div className="qp-float qp-float-one">✦ ORIGINAL STORIES</div><div className="qp-float qp-float-two">★ FILM · FAMILY · FUN</div></div>
    </section>
    <section id="studios" className="qp-studios"><div className="qp-section-head"><div><p className="qp-kicker">THE PRODUCTION LINEUP</p><h2>Explore the catalogue</h2></div><span className="qp-count">FILMS · SERIES · BOOKS</span></div>
      <div className="qp-grid">{projects.map((p, i) => <article className={"qp-card " + p.tone} key={p.title}>
        <div className="qp-card-art"><span className="qp-number">0{i + 1}</span><CoverArt type={p.art} title={p.title} /><span className="qp-art-tag">{p.tag}</span><span className={"qp-availability " + (p.status === "STUDIO PREVIEW" ? "qp-availability-preview" : "")}>{p.status}</span></div>
        <div className="qp-card-copy"><h3>{p.title}</h3><p>{p.desc}</p>{p.href ? <a href={p.href} target={p.href === TIKTOK_URL ? "_self" : "_blank"} rel={p.href === TIKTOK_URL ? undefined : "noreferrer"} className="qp-card-link" aria-label={"Open " + p.title}>{p.label}<ArrowUpRight size={16} /></a> : <div className="qp-card-link qp-card-pending"><span>{p.label}</span><span className="qp-status-dot" aria-hidden="true" /></div>}</div>
      </article>)}</div>
    </section>
    <section className="qp-bottom"><div><p className="qp-kicker">THE NEXT STORY STARTS HERE</p><h2>Made to be watched.<br /><em>Built to be remembered.</em></h2></div><p>Released titles belong in the catalogue. New work is identified honestly, and nothing is published or sold without owner approval.</p></section>
    <footer className="qp-footer"><span>© {new Date().getFullYear()} Quik Pik Productions</span><span>FILM · FAMILY · STORIES</span><a href={TIKTOK_URL} target="_self" rel={undefined}>Open Quik Pik TikTok ↗</a></footer>
  </main>;
}
