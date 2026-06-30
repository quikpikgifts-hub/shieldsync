# Viridian Pressure Wash — Launch Package

**Clean. Protect. Impress.**
Owner: Steve Smith · Sanford, Florida · Mobile Pressure Washing & Exterior Cleaning · Serving Greater Central Florida

A complete, launch-ready startup package: a 12-page marketing/booking **website**, a full written **business package**, and **vehicle wrap** design mockups for the 2012 Mazda5 Grand Touring.

---

## 1. Website (launch-ready)

A fast, mobile-responsive, static website. No build step — open `index.html` or deploy the `viridian/` folder to any static host (Vercel, Netlify, GitHub Pages, Cloudflare Pages).

**Pages:** Home · About · Services · Residential · Commercial · Pricing · Service Areas · Gallery · Reviews · FAQs · Blog · Contact

**Features:** premium responsive design · click-to-call · sticky mobile call/quote bar · quote request form with instant ballpark estimator · before/after gallery · reviews · FAQ accordion (with FAQ schema) · service-area map · LocalBusiness schema · SEO title/meta per page · social links.

| File | Purpose |
|---|---|
| `index.html` … `contact.html` | The 12 pages |
| `styles.css` | Brand stylesheet (navy/green/aqua, Montserrat/Open Sans) |
| `app.js` | Site engine: shared header/footer, data (services, pricing, areas, reviews, FAQs, blog), nav, quote estimator, form |
| `assets/logo.svg` | Primary logo |

### Run locally
```bash
cd viridian
python3 -m http.server 8080   # then open http://localhost:8080
```

### Go live — connect the quote form
The contact/quote form is a front-end demo (it does not transmit data). To accept real leads, point it at a backend such as **Formspree**, **Netlify Forms**, or your CRM (Jobber / Housecall Pro). See the `wireQuoteForm()` handler in `app.js`.

### Before launch
- Replace the placeholder **phone** (`407-555-0123`), **email**, and **social URLs** in `app.js` (`BIZ` object).
- Swap gallery placeholder tiles for **real before/after photos** in `/assets`.
- Connect **Google Business Profile**, **Search Console**, and analytics.
- Add real **Google reviews** once collected.

---

## 2. Business Package (`/docs`)

| Doc | Contents |
|---|---|
| `01-business-plan.md` | Executive summary, mission/vision, market & competitive analysis, SWOT, pricing strategy, 1/3/5-year plans, exit strategy |
| `02-startup-checklist.md` | Registration, licensing, insurance, banking, equipment, vehicle, branding, marketing, sales, scaling |
| `03-financial-plan.md` | Startup budget, monthly expenses, low/med/high revenue projections, break-even, cash flow, annual goals |
| `04-branding-guide.md` | Logo, color palette (HEX), typography, voice, applications |
| `05-seo-plan.md` | Title tags, metas, schema, keywords, service/city pages, blog, internal linking, local SEO |
| `06-google-business-profile.md` | Categories, description, services, photos, review templates, posts, FAQ seeds |
| `07-marketing-plan.md` | 30/60/90-day launch strategy, channels, referral program, content engine |
| `08-sales-system.md` | Phone scripts, text/email templates, follow-up sequences, estimate/invoice, review & referral scripts |
| `09-equipment-vehicle-setup.md` | Equipment list, Mazda5 cargo layout, weight distribution, trailer expansion plan |
| `10-vehicle-wrap-design.md` | Wrap design spec, element placement, readability rules, production notes |

---

## 3. Vehicle Wrap Mockups (`/wrap`)

Open **`wrap/wrap-mockups.html`** in a browser to view all five views together.

| File | View |
|---|---|
| `wrap-driver-side.svg` | Driver side (full layout) |
| `wrap-passenger-side.svg` | Passenger side (mirrored) |
| `wrap-rear.svg` | Rear hatch (traffic-readable) |
| `wrap-front.svg` | Front / hood |
| `wrap-top.svg` | Roof (aerial/drone) |

> These are **vector design schematics** — layout, copy, color, and placement for a wrap shop — not photo-composites of the actual car. Provide them to your installer with the manufacturer's 2012 Mazda5 wrap template for print-ready artwork. Details in `docs/10-vehicle-wrap-design.md`.

---

## Brand Quick Reference

| | |
|---|---|
| Deep Navy | `#0B1F3A` |
| Viridian Green | `#0C6B3A` |
| Aqua Blue | `#1FA7E1` |
| White / Light Gray | `#FFFFFF` / `#E0E0E0` |
| Headings / Body | Montserrat ExtraBold / Open Sans |
| Tagline | Clean. Protect. Impress. |
