/* ===============================================================
   Viridian Pressure Wash — site engine
   Shared header/footer injection, data-driven sections,
   mobile nav, quote estimator, and form handling.
   Vanilla JS, no build step. Works from any page in /viridian.
   =============================================================== */
(function () {
  "use strict";

  /* ---------- Business constants ---------- */
  const BIZ = {
    name: "Viridian Pressure Wash",
    tagline: "Clean. Protect. Impress.",
    owner: "Steve Smith",
    city: "Sanford, Florida",
    phone: "407-555-0123",
    phoneHref: "tel:4075550123",
    email: "hello@viridianwash.com",
    web: "ViridianWash.com",
    facebook: "https://facebook.com/ViridianPressureWash",
    instagram: "https://instagram.com/ViridianPressureWash",
    hours: "Mon–Sat 7:30am–6:00pm",
  };

  const AREAS = [
    "Sanford", "Lake Mary", "Longwood", "Oviedo", "Winter Springs",
    "Deltona", "DeBary", "Apopka", "Orlando", "Greater Central Florida",
  ];

  /* Services: residential + commercial. priceLow/priceHigh used by estimator. */
  const SERVICES = {
    residential: [
      { id: "house-wash", icon: "🏠", name: "House Washing", blurb: "Gentle soft-wash that safely lifts algae, mildew, and pollen from siding, stucco, and trim.", low: 150, high: 450, unit: "job" },
      { id: "driveway", icon: "🚗", name: "Driveway Cleaning", blurb: "Surface-cleaned concrete and pavers that look new — oil, rust, and organic staining removed.", low: 100, high: 200, unit: "job" },
      { id: "sidewalk", icon: "🚶", name: "Sidewalk Cleaning", blurb: "Bright, slip-safe walkways and entry paths with even, streak-free results.", low: 75, high: 175, unit: "job" },
      { id: "patio", icon: "⛱️", name: "Patio Cleaning", blurb: "Restore patios and lanais for entertaining — safe on pavers, concrete, and travertine.", low: 100, high: 250, unit: "job" },
      { id: "pool-deck", icon: "🏊", name: "Pool Deck Cleaning", blurb: "Remove algae and grime for a cleaner, safer pool deck the whole family can enjoy.", low: 150, high: 300, unit: "job" },
      { id: "fence", icon: "🪵", name: "Fence Cleaning", blurb: "Vinyl, wood, and aluminum fencing brought back to life, panel by panel.", low: 150, high: 350, unit: "job" },
      { id: "screen", icon: "🪟", name: "Screen Enclosure Cleaning", blurb: "Pool cages and screen rooms cleared of mold, dirt, and cobwebs — frame and mesh.", low: 100, high: 200, unit: "job" },
      { id: "gutter", icon: "🧰", name: "Gutter Exterior Cleaning", blurb: "Erase ugly black tiger-striping from gutter faces for a crisp, finished roofline.", low: 100, high: 250, unit: "job" },
      { id: "roof", icon: "🏚️", name: "Roof Soft Washing", blurb: "Low-pressure roof treatment that kills algae and lichen without damaging shingles or tile.", low: 300, high: 800, unit: "job" },
    ],
    commercial: [
      { id: "storefront", icon: "🏬", name: "Storefront Cleaning", blurb: "Spotless entrances and sidewalks that make a first impression worth keeping.", low: 0.15, high: 0.25, unit: "sqft" },
      { id: "restaurant", icon: "🍽️", name: "Restaurant Sidewalk Cleaning", blurb: "Degrease and brighten dining-area walkways on a recurring schedule.", low: 200, high: 500, unit: "job" },
      { id: "breezeway", icon: "🏢", name: "Apartment Breezeways", blurb: "Multi-unit breezeway and stairwell cleaning that keeps tenants happy.", low: 0.15, high: 0.30, unit: "sqft" },
      { id: "office", icon: "🏛️", name: "Office Buildings", blurb: "Exterior building washes and walkway maintenance for a professional presence.", low: 300, high: 2000, unit: "job" },
      { id: "parking", icon: "🅿️", name: "Parking Lots", blurb: "Large-area lot cleaning, gum and stain removal, and entrance detailing.", low: 0.05, high: 0.15, unit: "sqft" },
      { id: "pm", icon: "🔑", name: "Property Management Services", blurb: "Turnkey exterior upkeep across portfolios with one dependable point of contact.", low: 0, high: 0, unit: "quote" },
      { id: "hoa", icon: "🏘️", name: "HOA Communities", blurb: "Common-area, sidewalk, and entry-monument cleaning on recurring contracts.", low: 0, high: 0, unit: "quote" },
      { id: "small-commercial", icon: "🏪", name: "Small Commercial Buildings", blurb: "Right-sized service for shops, clinics, and small offices across Central Florida.", low: 300, high: 1200, unit: "job" },
    ],
  };

  const VALUES = [
    { t: "Professional", d: "Uniformed, on-time, courteous crews on every visit." },
    { t: "Dependable", d: "Consistent scheduling and results you can count on." },
    { t: "Trustworthy", d: "Transparent, written pricing — no surprises, ever." },
    { t: "Detail-Oriented", d: "No shortcuts on surface prep or finish quality." },
    { t: "Modern", d: "Online quotes, booking, and invoicing — clean and simple." },
    { t: "Community Focused", d: "Locally owned and operated, proudly serving Central Florida." },
  ];

  const REVIEWS = [
    { n: "Maria G.", c: "Lake Mary", r: 5, t: "Our driveway and front walk look brand new. Steve was on time, professional, and the price was exactly what he quoted. Booking again for the roof." },
    { n: "James T.", c: "Sanford", r: 5, t: "Best house wash we've had. No high-pressure damage, careful around the landscaping, and the difference is night and day. Highly recommend." },
    { n: "The Oakmont HOA", c: "Oviedo", r: 5, t: "We signed a quarterly contract for our common areas and entry monuments. Reliable, well-priced, and our residents have noticed the difference." },
    { n: "Priya R.", c: "Winter Springs", r: 5, t: "Pool deck and screen enclosure came out spotless. Easy online quote, friendly service, fair pricing. Couldn't ask for more." },
    { n: "Dave M.", c: "Longwood", r: 5, t: "Pre-listing clean before we sold — driveway, house, and patio. Our agent said the curb appeal sealed the deal. Worth every penny." },
    { n: "Sunrise Plaza Mgmt.", c: "Orlando", r: 5, t: "Storefront sidewalks and breezeways done after hours with zero disruption. Professional invoicing and great communication." },
  ];

  const FAQS = [
    { q: "What's the difference between pressure washing and soft washing?", a: "Pressure washing uses high-pressure water for hard surfaces like concrete driveways and sidewalks. Soft washing uses low pressure plus specialized, surface-safe detergents to clean delicate surfaces like siding, screens, and roofs without causing damage. We choose the right method for every surface." },
    { q: "Do you service my area?", a: "We serve Sanford, Lake Mary, Longwood, Oviedo, Winter Springs, Deltona, DeBary, Apopka, Orlando, and the greater Central Florida area. If you're nearby and not listed, just ask — we may still be able to help." },
    { q: "How much does it cost?", a: "Pricing depends on square footage, surface condition, and access. We publish honest ranges on our Pricing page, and every estimate is provided in writing before any work begins. Bundling services (like a house wash plus driveway) saves money." },
    { q: "Are you licensed and insured?", a: "Yes. Viridian Pressure Wash carries general liability insurance and operates as a registered Florida business. Certificates of insurance are available for commercial clients and property managers on request." },
    { q: "Will the chemicals harm my plants or pets?", a: "We use eco-conscious, biodegradable detergents and pre-wet and rinse surrounding landscaping. Our methods are designed to be safe for your plants, pets, and family when the area is clear during service." },
    { q: "How often should I have my property cleaned?", a: "In Central Florida's humid climate, most homes benefit from a house wash once a year and driveway/walkway cleaning every 6–12 months. Pool decks and screen enclosures often need attention twice a year. We can set up a recurring plan." },
    { q: "Do I need to be home during the service?", a: "Not necessarily. As long as we have access to the areas being cleaned and an outdoor water spigot, many jobs can be completed while you're away. We'll confirm details when you book." },
    { q: "How do I get started?", a: "Request a free quote online or call 407-555-0123. We'll review your property details, send a written estimate (usually same day), and schedule a time that works for you." },
  ];

  const POSTS = [
    { slug: "why-soft-washing-florida", title: "Why Soft Washing Is the Right Choice for Florida Roofs", date: "2026-06-15", excerpt: "Black streaks on your roof aren't dirt — they're algae. Here's why low-pressure soft washing removes them safely without voiding your shingle warranty." },
    { slug: "how-often-pressure-wash", title: "How Often Should You Pressure Wash Your Home in Central Florida?", date: "2026-06-02", excerpt: "Humidity, pollen, and afternoon storms mean Florida properties get dirty fast. A simple seasonal schedule to keep your curb appeal year-round." },
    { slug: "boost-curb-appeal-before-selling", title: "5 Exterior Cleaning Wins Before You List Your Home", date: "2026-05-20", excerpt: "Realtors agree: a clean exterior photographs better and sells faster. These five quick services deliver the biggest before-and-after impact." },
    { slug: "hoa-recurring-cleaning", title: "What HOAs Should Look for in a Pressure Washing Contract", date: "2026-05-06", excerpt: "Common areas, sidewalks, and entry monuments need consistent care. A guide for boards evaluating recurring exterior cleaning partners." },
  ];

  /* Navigation — order matters */
  const NAV = [
    { href: "index.html", label: "Home" },
    { href: "about.html", label: "About" },
    { href: "services.html", label: "Services" },
    { href: "residential.html", label: "Residential" },
    { href: "commercial.html", label: "Commercial" },
    { href: "pricing.html", label: "Pricing" },
    { href: "service-areas.html", label: "Service Areas" },
    { href: "gallery.html", label: "Gallery" },
    { href: "reviews.html", label: "Reviews" },
    { href: "faqs.html", label: "FAQs" },
    { href: "blog.html", label: "Blog" },
    { href: "contact.html", label: "Contact" },
  ];

  /* Expose for any page-level scripts */
  window.VIRIDIAN = { BIZ, AREAS, SERVICES, VALUES, REVIEWS, FAQS, POSTS, NAV };

  /* ---------- Helpers ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const money = (n) => "$" + Math.round(n).toLocaleString();
  const currentPage = () => (location.pathname.split("/").pop() || "index.html");

  /* ---------- Shared header ---------- */
  function renderHeader() {
    const mount = $("#site-header");
    if (!mount) return;
    const page = currentPage();
    const links = NAV.map(n =>
      `<a href="${n.href}" class="${n.href === page ? "active" : ""}">${n.label}</a>`
    ).join("");
    mount.innerHTML = `
      <header class="site-header">
        <div class="container header-inner">
          <a class="brand" href="index.html" aria-label="${BIZ.name} home">
            <img src="assets/logo.svg" alt="${BIZ.name}" class="brand-logo" />
          </a>
          <nav class="main-nav" aria-label="Primary">${links}
            <a href="contact.html" class="nav-cta">Free Quote</a>
          </nav>
          <a href="${BIZ.phoneHref}" class="header-call">📞 ${BIZ.phone}</a>
          <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
        <nav class="mobile-nav" aria-label="Mobile">${links}
          <a href="${BIZ.phoneHref}" class="mobile-call">📞 Call ${BIZ.phone}</a>
        </nav>
      </header>`;

    const toggle = $(".nav-toggle", mount);
    const mnav = $(".mobile-nav", mount);
    toggle.addEventListener("click", () => {
      const open = mnav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    $$(".mobile-nav a", mount).forEach(a =>
      a.addEventListener("click", () => { mnav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); })
    );
  }

  /* ---------- Shared footer ---------- */
  function renderFooter() {
    const mount = $("#site-footer");
    if (!mount) return;
    const svcLinks = SERVICES.residential.slice(0, 5)
      .map(s => `<a href="residential.html">${s.name}</a>`).join("");
    const areaLinks = AREAS.slice(0, 6)
      .map(a => `<a href="service-areas.html">${a}</a>`).join("");
    mount.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-inner">
          <div class="footer-brand">
            <img src="assets/logo.svg" alt="${BIZ.name}" class="footer-logo" />
            <p>Professional, eco-conscious exterior cleaning for homes and businesses across Central Florida. Locally owned by ${BIZ.owner}.</p>
            <div class="footer-social">
              <a href="${BIZ.facebook}" aria-label="Facebook" rel="noopener">Facebook</a>
              <a href="${BIZ.instagram}" aria-label="Instagram" rel="noopener">Instagram</a>
            </div>
          </div>
          <div class="footer-col">
            <h4>Popular Services</h4>${svcLinks}
            <a href="commercial.html">Commercial Services</a>
          </div>
          <div class="footer-col">
            <h4>Service Areas</h4>${areaLinks}
          </div>
          <div class="footer-col">
            <h4>Get in Touch</h4>
            <a href="${BIZ.phoneHref}">${BIZ.phone}</a>
            <a href="mailto:${BIZ.email}">${BIZ.email}</a>
            <a href="contact.html">Request a Free Quote</a>
            <span>${BIZ.hours}</span>
          </div>
        </div>
        <div class="footer-bar">
          <div class="container">
            <span>© <span id="year"></span> ${BIZ.name} · ${BIZ.tagline}</span>
            <span>Licensed &amp; Insured · Based in ${BIZ.city}</span>
          </div>
        </div>
      </footer>`;
    const y = $("#year", mount);
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- Floating mobile call/quote bar ---------- */
  function renderStickyBar() {
    if ($(".sticky-cta")) return;
    const bar = el(`
      <div class="sticky-cta">
        <a href="${BIZ.phoneHref}" class="sticky-call">📞 Call</a>
        <a href="contact.html" class="sticky-quote">Free Quote</a>
      </div>`);
    document.body.appendChild(bar);
  }

  /* ---------- Data-driven section renderers ---------- */
  function serviceCard(s) {
    let price;
    if (s.unit === "sqft") price = `From ${money(s.low * 100) === "$0" ? "" : ""}$${s.low.toFixed(2)}/sq ft`;
    else if (s.unit === "quote") price = "Custom quote";
    else price = `From ${money(s.low)}`;
    return `
      <article class="service-card">
        <div class="service-icon">${s.icon}</div>
        <h3>${s.name}</h3>
        <p>${s.blurb}</p>
        <span class="from">${price}</span>
      </article>`;
  }

  function renderServices() {
    const r = $("#residential-grid");
    if (r) r.innerHTML = SERVICES.residential.map(serviceCard).join("");
    const c = $("#commercial-grid");
    if (c) c.innerHTML = SERVICES.commercial.map(serviceCard).join("");
    const all = $("#all-services-grid");
    if (all) all.innerHTML = [...SERVICES.residential, ...SERVICES.commercial].map(serviceCard).join("");
  }

  function renderValues() {
    const m = $("#values-list");
    if (!m) return;
    m.innerHTML = VALUES.map(v => `<li><strong>${v.t}.</strong> ${v.d}</li>`).join("");
  }

  function renderAreas() {
    const m = $("#areas-grid");
    if (m) m.innerHTML = AREAS.map(a => `<a class="area-chip" href="contact.html">${a}</a>`).join("");
    const inline = $("#areas-inline");
    if (inline) inline.textContent = AREAS.join(", ");
  }

  function stars(n) { return "★".repeat(n) + "☆".repeat(5 - n); }

  function renderReviews() {
    const m = $("#reviews-grid");
    if (!m) return;
    m.innerHTML = REVIEWS.map(rv => `
      <article class="review-card">
        <div class="review-stars" aria-label="${rv.r} out of 5 stars">${stars(rv.r)}</div>
        <p>"${rv.t}"</p>
        <footer><strong>${rv.n}</strong><span>${rv.c}</span></footer>
      </article>`).join("");
  }

  function renderFaqs() {
    const m = $("#faqs-list");
    if (!m) return;
    m.innerHTML = FAQS.map((f, i) => `
      <details class="faq" ${i === 0 ? "open" : ""}>
        <summary>${f.q}</summary>
        <div class="faq-body"><p>${f.a}</p></div>
      </details>`).join("");
  }

  function renderBlog() {
    const m = $("#blog-grid");
    if (!m) return;
    m.innerHTML = POSTS.map(p => {
      const d = new Date(p.date + "T00:00:00");
      const ds = d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      return `
      <article class="post-card">
        <div class="post-thumb" aria-hidden="true">${BIZ.name.split(" ")[0]}</div>
        <div class="post-body">
          <time datetime="${p.date}">${ds}</time>
          <h3>${p.title}</h3>
          <p>${p.excerpt}</p>
          <a class="post-link" href="contact.html">Read more →</a>
        </div>
      </article>`;
    }).join("");
  }

  function renderGallery() {
    const m = $("#gallery-grid");
    if (!m) return;
    const items = [
      ["Driveway Cleaning", "Concrete restored to like-new", "driveway"],
      ["House Soft Wash", "Algae and pollen lifted safely", "house-wash"],
      ["Roof Soft Wash", "Black streaks gone for good", "roof"],
      ["Pool Deck", "Brighter, slip-safer surface", "pool-deck"],
      ["Paver Patio", "Ready for entertaining", "patio"],
      ["Storefront", "A first impression that lasts", "storefront"],
      ["Fence Revival", "Vinyl and wood brought back", "fence"],
      ["Screen Enclosure", "Clear mesh, clean frame", "screen"],
      ["Sidewalk Brightening", "Even, streak-free finish", "sidewalk"],
    ];
    m.innerHTML = items.map(([title, sub]) => `
      <figure class="gallery-item">
        <div class="ba">
          <div class="ba-before"><span>BEFORE</span></div>
          <div class="ba-after"><span>AFTER</span></div>
        </div>
        <figcaption><strong>${title}</strong><span>${sub}</span></figcaption>
      </figure>`).join("");
  }

  /* ---------- Quote estimator + form ---------- */
  function buildServiceOptions(select) {
    const groups = [
      ["Residential", SERVICES.residential],
      ["Commercial", SERVICES.commercial],
    ];
    select.innerHTML = groups.map(([label, list]) =>
      `<optgroup label="${label}">${list.map(s => `<option value="${s.id}">${s.name}</option>`).join("")}</optgroup>`
    ).join("");
  }

  function estimateFor(id) {
    const s = [...SERVICES.residential, ...SERVICES.commercial].find(x => x.id === id);
    if (!s) return null;
    if (s.unit === "quote") return "Custom — we'll prepare a tailored proposal";
    if (s.unit === "sqft") return `$${s.low.toFixed(2)}–$${s.high.toFixed(2)} per sq ft`;
    return `${money(s.low)}–${money(s.high)}`;
  }

  function wireQuoteForm() {
    const form = $("#quote-form");
    if (!form) return;
    const select = $("#quote-service", form);
    if (select) buildServiceOptions(select);

    const box = $("#estimate-box");
    const val = $("#estimate-value");
    const updateEstimate = () => {
      if (!select || !box || !val) return;
      const est = estimateFor(select.value);
      if (est) { val.textContent = est; box.hidden = false; }
    };
    if (select) { select.addEventListener("change", updateEstimate); updateEstimate(); }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const status = $("#form-status", form);
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.name || !data.phone) {
        if (status) { status.textContent = "Please add your name and phone so we can reach you."; status.className = "form-status err"; }
        return;
      }
      if (status) {
        status.textContent = `Thanks, ${data.name.split(" ")[0]}! Your request was captured. In a live deployment this sends to Viridian's inbox — we'll reply with a written estimate, usually same day.`;
        status.className = "form-status ok";
      }
      form.reset();
      if (select) { buildServiceOptions(select); updateEstimate(); }
    });
  }

  /* ---------- Smooth-scroll for same-page anchors ---------- */
  function wireAnchors() {
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: "smooth" }); }
      });
    });
  }

  /* ---------- Init ---------- */
  function init() {
    renderHeader();
    renderFooter();
    renderStickyBar();
    renderServices();
    renderValues();
    renderAreas();
    renderReviews();
    renderFaqs();
    renderBlog();
    renderGallery();
    wireQuoteForm();
    wireAnchors();
    const y = $("#year");
    if (y && !y.textContent) y.textContent = new Date().getFullYear();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
