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

## ADR-006: Direct-to-S3 Presigned Image Upload Pipeline & In-Browser Cropping

### Status
**Accepted**

### Context
Event banner images and attendee/speaker profile photos need to be high quality yet properly sized (16:9 for banners, 1:1 circular for avatars). Processing uploads through a custom server backend introduces compute overhead, payload limits, and latency.

### Decision
Implement in-browser interactive image adjustment with direct-to-S3 pre-signed upload URLs:
- **`ImageBannerAdjuster.tsx`**: Renders a fixed 16:9 viewport with zoom (1×–3×), drag-to-position, and containment calculations. Generates an exact 1280×720 JPEG blob via HTML5 Canvas.
- **`AvatarImageAdjuster.tsx`**: Renders a circular crop mask with zoom and pan controls. Generates a square JPEG blob via HTML5 Canvas.
- **`api/upload-url.ts`**: AWS Lambda / Vercel Serverless Function that uses `@aws-sdk/s3-request-presigner` (`PutObjectCommand`) to issue temporary pre-signed upload URLs.
- **`storageService.ts`**: Direct PUT upload from browser client to Amazon S3 bucket (`aws-event-tracker-assets`), eliminating proxy bottlenecks.

### Consequences
- **Positive**: Zero backend image processing load, fast uploads, pixel-accurate previews matching saved outputs, no server upload bandwidth costs.
- **Negative**: Requires valid AWS IAM credentials configured in serverless environment for S3 URL generation.

---

## ADR-007: Vercel Serverless Functions with Amazon DynamoDB & Hybrid Fallback

### Status
**Accepted**

### Context
Transitioning from purely local mock data to live cloud storage requires scalable endpoints for Events, Sessions, and Stamps, while maintaining offline development capabilities and zero disruption to frontend components.

### Decision
Deploy lightweight serverless API functions on Vercel backed by Amazon DynamoDB (`@aws-sdk/lib-dynamodb` DocumentClient):
- Created endpoints `/api/events`, `/api/sessions`, `/api/stamps`, and `/api/seed`.
- Built hybrid fallback handling inside `eventService.ts` and `sessionService.ts`: the client attempts to reach live `/api/*` endpoints first and transparently falls back to `localStorage` when offline or when backend credentials are not provisioned.

### Consequences
- **Positive**: Seamless live deployment on Vercel with instant cloud persistence, seamless offline/local fallback, zero changes required to presentation components.
- **Negative**: Requires keeping DynamoDB schemas and frontend TypeScript types strictly aligned.

---

## ADR-008: Accounts, Approval and Officer Tasks in DynamoDB

### Status
**Accepted**

### Context
Accounts, registrations and officer data lived in in-memory mock services, so sign-ups never reached the admin, and anything changed in one login (photos, registrations, tasks) disappeared or was invisible to other logins and devices.

### Decision
- Store accounts (`entityType: 'user'`, id = person id), registrations, officer tasks and speakers in the existing single DynamoDB table, behind new Vercel functions `/api/users`, `/api/registrations`, `/api/tasks` and `/api/speakers`.
- Hash passwords on the server with scrypt; never return hashes.
- Every new account starts as `pending` and cannot sign in until an admin approves it. Officer sign-ups record their requested role, position and committee, and become officers on approval.
- Keep the hybrid pattern: services detect a working JSON `/api` and otherwise use `localStorage` (shared helper `apiClient.ts`).
- Existing endpoints only touch records of their own type.

### Consequences
- **Positive**: One source of truth across logins and devices; admins control who gets in; officer work (events, stamps, tasks) can be monitored and exported.
- **Negative**: There are no server-side sessions yet — the API trusts the `actorId` sent by the app for admin actions (it checks that account's role, but the id itself is not signed). Moving sign-in to Amazon Cognito (or signed tokens) is the next step before handling sensitive data. Table scans are fine at club scale but would need indexes for large data.

---

## ADR-009: Email Notifications with Amazon SES and Vercel Cron

### Status
**Accepted**

### Context
Officers and attendees need reminders (assignment, event tomorrow, event day, tasks) and the admin needs to know about new sign-ups and failures, without anyone keeping the app open.

### Decision
- One serverless function, `/api/notify`, sends all emails through **Amazon SES** (same AWS account and keys as DynamoDB/S3).
- In-app actions (approve/decline, assign officer, new task, new sign-up) call `/api/notify` right after saving.
- A **Vercel Cron** job (`vercel.json`, `0 0 * * *` = 8:00 AM Manila) calls `GET /api/notify` (protected by `CRON_SECRET`) for event and task reminders. Sent flags on records prevent duplicates.
- Officers get emails on their APC and personal email; admin alerts go to `ADMIN_NOTIFY_EMAIL` (default `aws.apcofficial@gmail.com`).

### Consequences
- **Positive**: No extra service or account; reminders work while the app is closed; failures are reported to the admin.
- **Negative**: SES starts in sandbox mode (only verified addresses) until production access is granted; sending from a Gmail address may land in spam until a custom domain is used; Vercel Hobby crons run once per day.

---

## ADR-010: Built-in Admin from Environment, No Demo Accounts

### Status
**Accepted**

### Context
Public demo accounts with known passwords are unsafe once the app holds real student data.

### Decision
Remove all demo accounts. The only built-in account is `awsapc.admin`, created on first use from `ADMIN_PASSWORD` (Vercel) or `VITE_LOCAL_ADMIN_PASSWORD` (`.env.local`, local only). No password is stored in the code.

### Consequences
- **Positive**: No public credentials; the admin can change the password in the app.
- **Negative**: A fresh deployment can't be used until `ADMIN_PASSWORD` is set.

---

## ADR-011: Responsive Layout for Phones and Laptops

### Status
**Accepted** (extends ADR-002 and ADR-005)

### Context
Laptops with display scaling (e.g. 1280px at 150% ≈ 853px) fell below the old 900px breakpoint and got the phone layout, and several pages were single narrow columns even on wide screens.

### Decision
- Move the `md` breakpoint to **768px** (sidebar layout) and `lg` to 1100px in `theme.ts`.
- Use CSS grid on laptops (2–3 columns, side-by-side sections) and center content with a 1280px max width.
- Keep the single-column layout and bottom navigation on phones.

### Consequences
- **Positive**: The desktop UI appears on scaled laptop screens; wide screens are used well; phones are unchanged.
- **Negative**: Tablets in portrait (768px+) now get the sidebar layout.

---

*Last Updated: October 2026*
