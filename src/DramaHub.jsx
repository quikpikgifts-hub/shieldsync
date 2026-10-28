import React from "react";
import { ArrowLeft, ArrowUpRight, Clapperboard, PlayCircle, Sparkles } from "lucide-react";

const TIKTOK = "https://www.tiktok.com/@quikpikproductions";
const stories = [
  { title: "Character Drama", type: "SERIES CONCEPT", description: "Character-led stories built around secrets, choices and cliffhangers.", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85", alt: "Portrait used as character concept artwork", tone: "amber" },
  { title: "The Lead", type: "CHARACTER GALLERY", description: "A home for lead characters, supporting cast profiles and story connections.", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85", alt: "Portrait used as character concept artwork", tone: "rose" },
  { title: "Cinematic Stories", type: "FILM & EPISODES", description: "Movie posters, episode artwork, trailers and released cuts in one catalogue.", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85", alt: "Cinema seats representing the film catalogue", tone: "blue" },
  { title: "Ember Stories", type: "FAMILY & KIDS", description: "A separate collection for Ember and family-friendly stories—not the whole Drama Hub.", image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=85", alt: "Family together outdoors, used as family-story concept artwork", tone: "green" },
];
export default function DramaHub() {
  React.useEffect(() => { document.title = "Drama Hub | Quik Pik Productions"; }, []);
  return <main className="dh-shell">
    <header className="dh-nav"><a href="/" className="dh-brand"><span className="dh-mark">QP</span><span><b>QUIK PIK</b><small>DRAMA & STORY HUB</small></span></a><a className="dh-tiktok" href={TIKTOK} target="_blank" rel="noopener noreferrer">Open TikTok profile <ArrowUpRight size={16}/></a></header>
    <section className="dh-hero"><div><p className="dh-kicker">CHARACTERS · FILMS · EPISODES</p><h1>Every story deserves<br/><em>its own spotlight.</em></h1><p>Explore Quik Pik’s drama concepts, character gallery, films and episodic stories. Ember is one collection within the hub—not the entire destination.</p><a className="dh-primary" href="#catalogue"><PlayCircle size={18}/> Explore the catalogue</a></div><div className="dh-hero-art"><img src="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=85" alt="Cinema screen and seats representing film productions"/><span><Clapperboard size={16}/> STORY WORLD</span></div></section>
    <section id="catalogue" className="dh-catalogue"><div className="dh-section-head"><div><p className="dh-kicker">THE STORY LIBRARY</p><h2>Explore the productions</h2></div><span>CONCEPT ART IS LABELLED</span></div><div className="dh-grid">{stories.map((s,i)=><article className={"dh-card "+s.tone} key={s.title}><div className="dh-image"><img src={s.image} alt={s.alt} loading="lazy"/><span>{String(i+1).padStart(2,"0")}</span><label>{s.type}</label></div><div className="dh-card-body"><h3>{s.title}</h3><p>{s.description}</p><a href={TIKTOK} target="_blank" rel="noopener noreferrer">Visit Quik Pik on TikTok <ArrowUpRight size={15}/></a></div></article>)}</div><p className="dh-note"><Sparkles size={15}/> Images on this page are illustrative concept artwork, not verified stills from released Quik Pik films. Replace them with approved character portraits, official posters and movie stills when those assets are available.</p></section>
    <footer className="dh-footer"><a href="/"><ArrowLeft size={15}/> Back to Production Hub</a><span>Assisted distribution · no automatic publishing</span></footer>
  </main>;
}
