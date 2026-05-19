# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ShieldSync Sentinel is a physical security operations dashboard — a single-page React application for managing officers, incidents, vehicle inspections, dispatch, and AI-assisted reporting. It is deployed on Vercel and targets both desktop and mobile.

## Architecture

**No build system.** There is no `package.json`, no `node_modules`, and no build step. The project consists of three files:

- `index.html` — The entire React application as a JSX component file (misleadingly named `.html`; it is actually JSX/React source). This file `export default function App()` is the root component.
- `styles.css` — CSS classes for the legacy vanilla-JS auth screens and dashboard layout (`.auth-bg`, `.sidebar`, `.topbar`, `.panel`, etc.). These coexist with the inline styles used in the React code.
- `README.md` — Describes the original Firebase-backed vanilla JS version; the current code has no Firebase integration (all data is hardcoded).

**Two coexisting style systems:**
- `styles.css` uses BEM-style class names (`.auth-card`, `.stat-card`, `.nav-item`), fonts loaded via `@import` (Bebas Neue, DM Sans, JetBrains Mono), and CSS custom properties (`--accent`, `--bg`, etc.).
- `index.html` (React) uses a JavaScript design token object `T` (e.g. `T.accent`, `T.bg`, `T.red`) with all styles applied inline. The inline system is entirely self-contained and does not depend on `styles.css`.

## Key Patterns in `index.html`

**Design tokens** — All colors, backgrounds, and glows are defined in the `T` constant at the top of the file. Never hardcode color values; always reference `T.*`.

**Status color mapping** — `SM(statusString)` returns `{c: color, p: isPulsing}` for any known status label. Used by `Pill`, `Av`, and officer cards.

**Primitive components** — `Pill`, `Card`, `CB` (card body), `SH` (section header), `Av` (avatar), `FuelBar`, `PBar`, `Dots`, `ModalWrap` are the shared building blocks. Compose from these instead of reimplementing.

**Static data** — `OFFICERS`, `SITES`, `INCIDENTS`, `CHECKPOINTS`, `VEHICLES`, `VISITORS`, `SCHEDULE` are hardcoded constants. There is no backend or database. Any "submit" or "dispatch" action updates local React state only.

**Role-based navigation** — `NAV` defines navigation items with a `roles` array. `App` filters `NAV` by the current `role` state, and if the active module becomes unavailable for the new role, it resets to the first available module.

**Modal system** — `App` holds a single `modal` state object (`{type, ...data}`). Modules call `openModal({type:"incident"})` or `openModal({type:"inspection", vehicle:v})`. `App` renders `InspModal` or `IncModal` conditionally at the root.

**Claude API integration** — `AICopilot`, `IncModal`, and `Reports` all call `https://api.anthropic.com/v1/messages` directly from the browser using `fetch`. The model is `claude-sonnet-4-20250514`. **The `x-api-key` header is not present in the source** — API calls will fail with a 401 unless the key is injected at runtime or the header is added. Failures are caught and shown as error messages inline; no silent failures.

**Responsive layout** — `App` listens to `window.resize` and sets `isMobile` (breakpoint: 768px). Mobile uses `MobileNav` (fixed bottom bar) and hides `Sidebar`. The desktop sidebar has a collapse toggle.

## Modules

| Module ID   | Component     | Access Roles                         | Key Interactions                     |
|-------------|---------------|--------------------------------------|--------------------------------------|
| `dashboard` | `Dashboard`   | Company Admin, Supervisor, Client    | Opens incident modal, shows AI copilot, live map |
| `workforce` | `Workforce`   | Company Admin, Supervisor            | Officer cards + schedule             |
| `patrol`    | `Patrol`      | Company Admin, Supervisor, Officer   | Checkpoint status + patrol stats     |
| `fleet`     | `Fleet`       | Company Admin, Supervisor            | Opens vehicle inspection modal       |
| `visitors`  | `Visitors`    | Company Admin, Supervisor, Officer   | Visitor log + check-in stub          |
| `reports`   | `Reports`     | Company Admin, Supervisor, Client    | AI-generated PDF-style reports       |
| `dispatch`  | `Dispatch`    | Company Admin, Supervisor            | Officer dispatch with local state    |

## Deployment

Push to `main` → Vercel auto-deploys to `shieldsync-app.vercel.app`. No build command is configured; Vercel serves the static files directly.

## Known Gaps (as of current state)

- No authentication — the app opens directly to the dashboard with no login gate.
- Role switching is a UI-only dropdown in the sidebar/mobile bar; there is no session persistence or server-side role enforcement.
- All data mutations (incident submit, dispatch, inspection submit) update local state and are lost on refresh.
- The Anthropic API key is missing from API calls; AI features return connection errors without it.
- `styles.css` and the inline-style React system are not unified; `styles.css` applies only to elements rendered by the vanilla-JS portions (if any remain) or is unused dead code.
