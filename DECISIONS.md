# Architecture Decision Records (ADRs) 💡

This document records the architectural and design decisions made for the **AWS SBG-APC Event Tracker** application, following the Architecture Decision Record (ADR) format.

---

## ADR-001: React 18 + Vite + Material UI (MUI) v6 Tech Stack

### Status
**Accepted**

### Context
We needed a lightweight, rapid, modern web stack for building an event companion SPA for AWS SBG-APC.

### Decision
Select **React 18 + Vite + TypeScript** with **Material UI (MUI) v6**:
- Vite provides instant HMR development speed and fast production bundler output.
- MUI v6 provides styled components (`Box`, `Card`, `Stack`, `Chip`) and custom theme token system (`createTheme`) for AWS SBG-APC branding.

### Consequences
- **Positive**: High developer velocity, type-safe props, rapid design iteration.
- **Negative**: Bundle size includes MUI library components (mitigated via Vite tree-shaking).

---

## ADR-002: Zero-Overlay / Modal-Free Mobile UX Architecture

### Status
**Accepted**

### Context
Full-screen popup modals, dialog backdrops, and modal drawers on mobile viewports often obscure critical background context, create awkward focus traps, and degrade mobile user experience on small screens (320px–480px).

### Decision
Eliminate backdrop modal popups (`Dialog`, modal drawer backdrops) in favor of **Inline Expandable Components**:
- Converted `NetworkingCard` from a `<Dialog>` modal to an inline `<Card>` toggled on the Profile page.
- Converted mobile drawer navigation into a smooth inline `<Collapse>` panel underneath the sticky header.

### Consequences
- **Positive**: Clean mobile UX, no screen darkening or modal backdrop bugs, seamless inline scrolling.
- **Negative**: Requires careful layout flow and padding structure to avoid content shifts.

---

## ADR-003: Dynamic Circle Stamp Slots for Event Passport Card

### Status
**Accepted**

### Context
Attendees need an intuitive, gamified way to see which event sessions require activity stamps and track their approval status in real time.

### Decision
Create a specialized **`EventStampCard` Component**:
- Automatically queries the active event sessions and computes circular stamp slots for each required session.
- Employs color-coded visual circle badges (🟢 Emerald Approved, 🟠 Amber Pending, ⚪ Dashed Unclaimed).
- Provides one-tap stamp requesting directly from the card.

### Consequences
- **Positive**: High visual appeal, immediate clarity on stamp progress, interactive one-tap requests.
- **Negative**: Requires fetching sessions and stamps asynchronously, handled via React state.

---

## ADR-004: In-Memory Service Layer with LocalStorage Persistence

### Status
**Accepted**

### Context
The application needs to run standalone without requiring a live backend server for demos and early user testing, while mirroring realistic async REST API calls.

### Decision
Build async service modules in `src/services/` that encapsulate data mutations in `localStorage` with simulated network delay (`delay(100ms)`).

### Consequences
- **Positive**: Instant offline local development, zero backend maintenance cost, clean transition path to AWS Amplify/DynamoDB by keeping function signatures intact.
- **Negative**: Data is local to the browser instance unless synced with backend endpoints.

---

## ADR-005: Sticky Edge-to-Edge Mobile Navbar (0-Radius Header)

### Status
**Accepted**

### Context
Default MUI `Paper` theme rules applied a 16px `border-radius` to `AppBar`, causing the navbar to appear as a floating rounded box that overlaid page content on mobile devices.

### Decision
- Override `MuiAppBar` styles with `borderRadius: 0` in `theme.ts` and `AppLayout.tsx`.
- Configure header to use `position="sticky"` with text truncation (`textOverflow: 'ellipsis'`).

### Consequences
- **Positive**: Standard full-width top navigation bar styling, zero content overlap.
- **Negative**: None.

---

*Last Updated: October 2026*
