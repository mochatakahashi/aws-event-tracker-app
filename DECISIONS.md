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
- **Negative**: There are no server-side sessions yet - the API trusts the `actorId` sent by the app for admin actions (it checks that account's role, but the id itself is not signed). Moving sign-in to Amazon Cognito (or signed tokens) is the next step before handling sensitive data. Table scans are fine at club scale but would need indexes for large data.

---

## ADR-009: Email Notifications with Amazon SES and Vercel Cron

### Status
**Accepted** - sending partly superseded by ADR-012 (Gmail SMTP is preferred when configured; SES remains the fallback)

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

## ADR-012: Gmail SMTP (Nodemailer) for Email, Self-contained API Functions

### Status
**Accepted**

### Context
Amazon SES stays in sandbox mode (verified recipients only) until AWS grants production access, which blocked approval/decline emails to new users. The club already owns `aws.apcofficial@gmail.com`.

### Decision
- Send email through **Gmail SMTP with Nodemailer** when `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set; otherwise fall back to SES. Every user email is CC'd to and replies go to the club inbox.
- Keep each file in `api/` **self-contained** (no imports from other project folders). The project is an ES module (`"type": "module"`), and an extensionless import such as `../lib/mail` fails on Vercel with `ERR_MODULE_NOT_FOUND`, which took down `/api/notify`.
- Send failures are explained to the admin (e.g. Gmail error 535 = App Password created on a different Google account) and reported to the admin inbox.

### Consequences
- **Positive**: Works without SES production access; simple setup.
- **Negative**: Gmail limits sending (~500/day) and needs an App Password with 2-Step Verification; some helper code is repeated across API files.

---

## ADR-013: In-app Notifications Stored in DynamoDB with Polling

### Status
**Accepted**

### Context
Users need updates (stamps, approvals, assignments, tasks, check-in) even when email is unavailable, and the Notifications page only had sample data.

### Decision
- A `notification` record per recipient in the same DynamoDB table (`/api/notifications`), created by the page that performed the action (`notifyInApp`, which never blocks the action). Admin-wide notices use `toRole: 'admin'`, resolved on the server.
- The bell badge (`useUnreadNotifications`) refreshes after any change in the app, on window focus and every 30 seconds. Links must be in-app paths.

### Consequences
- **Positive**: No new AWS service; works with the localStorage fallback; real-time enough for events.
- **Negative**: Polling, not push (WebSockets/SSE planned for v0.7.0); table scans per request are fine at club scale only.

---

## ADR-014: QR Event Pass, Camera Check-in and PDF Certificates

### Status
**Accepted**

### Context
On-site check-in at APC workshops was manual, and professors/attendees wanted proof of participation.

### Decision
- The pass QR encodes the app link `…/#/officer/scan?pass=<registrationId>` (drawn with `qrcode`), so it also opens the scanner from a phone's normal camera app.
- The scanner uses `getUserMedia` + **`jsqr`** (works on iPhone Safari, unlike the native `BarcodeDetector`), with a name/email/student ID search fallback. One tap = check-in only; stamps are still approved from the Officer Dashboard.
- Check-in goes through `POST /api/registrations?action=checkin`, which requires an approved officer/admin `actorId`, then builds the certificate with **`pdf-lib`** (pure JavaScript, no native binaries on Vercel) and stores it privately in S3 under `certificates/<eventId>/<certificateId>.pdf`. Downloads redirect to a 10-minute signed link. An S3 failure never blocks check-in; it is retried on the next scan or download, and without a bucket the PDF is generated on the fly.

### Consequences
- **Positive**: Fast door check-in from any phone; certificates without manual work; the bucket stays private.
- **Negative**: The camera requires https; a registration id in the QR is not a secret (check-in still needs an officer account); standard PDF fonts only cover Latin characters (others are simplified).

---

## ADR-015: Booth Stamps in the Scanner, Public Certificate Verification, Client-side Leaderboard

### Status
**Accepted**

### Context
Officers at workshop booths had to leave the scanner to approve stamps; certificates needed a way for outsiders to confirm they're real; attendees wanted to see how they rank.

### Decision
- **Scanner stamps** reuse the existing stamp API (create-if-missing, then approve) instead of a new endpoint, so the Officer Dashboard queue and the scanner stay consistent.
- **Verification** is a public route outside sign-in. The API answers by certificate ID with only the fields printed on the certificate; certificate IDs are random (32-character alphabet, 8 characters) so they can't be guessed. Undoing a check-in marks the certificate *revoked* instead of deleting it.
- **Leaderboard and badges** are computed in the browser from stamps, sessions, registrations, tasks and events (`utils/leaderboard.ts`, `utils/badges.ts`, unit-tested) - no new table or API function. (With `api/uploads.ts` added in v0.6.5 the project now has 12 functions, the Vercel Hobby maximum, so new server features should be added as `?action=` routes inside existing files.)
- Rankings use **achievement points** so everyone is listed (not only people with stamps), with separate **Attendees** and **Officers** boards so attendance and officer work are both visible; officers appear on both. Personal standing and badges live on the Achievements page, while the leaderboard page stays a shared ranking.

### Consequences
- **Positive**: No new infrastructure; one place defines the badge rules; verification works for anyone with the link or QR.
- **Negative**: The leaderboard downloads all stamps (fine at club scale; a server-side aggregate would be needed for thousands of attendees). Certificates issued before v0.6.5 have no QR code, but their IDs can still be verified on the page.

---

## ADR-016: Persistent Event Picture Storage (IndexedDB + DynamoDB Hybrid) & Recent Uploads Shelf

### Status
**Accepted**

### Context
Event organizers and officers frequently upload event banners and speaker photos. When creating new events or reopening the Event Builder, there was no persistent shelf to view or select previously/recently uploaded pictures, and local development without active S3 credentials would fail on upload.

### Decision
- Store uploaded image assets in persistent client-side **IndexedDB** (`uploadStorageService.ts`) with a serverless DynamoDB endpoint (`/api/uploads`, entityType `upload`).
- Provide the **`RecentUploadsShelf`** component that automatically loads stored uploads, prominently badging the latest upload with **"⭐ Recent Upload"**, showing file dimensions/sizes, relative upload times, and offering a one-click **"Use as Banner"** action and full-res preview lightbox.
- If Amazon S3 is offline or not configured in local development (`npm run dev`), the upload seamlessly falls back to storing the image directly in IndexedDB persistent storage as a data URL, registering it in the recent uploads database without throwing errors.

### Consequences
- **Positive**: Zero upload crashes during offline or local development; officers can reuse previously uploaded photos with 1 click; recent uploads load immediately.
- **Negative**: High-resolution images stored in IndexedDB consume local client storage (addressed by limiting metadata cache and supporting direct S3 cloud storage).

---

## ADR-016: Admin-managed Accounts, Committee Work and Personal (not Ranked) Progress

### Status
**Accepted**

### Context
The club needed to onboard people directly (hand over an email and temporary password), enforce stronger passwords, run Marketing pubmats from the app instead of a Google Sheet, organise tasks by committee, and keep rankings for officers' monitoring only.

### Decision
- **Temporary passwords** are hashed like any password; the account is flagged `mustChangePassword` and the client route guard allows only the change-password page until it's cleared. Admins can reset to a new temporary password; there is no email-based reset yet.
- **Pubmats are tasks** (`kind: 'pubmat'`) in the existing tasks API instead of a new function (the project is at Vercel Hobby's 12-function limit). Roles (designee, caption writer, poster) live in the `pubmat` object; their union is `assigneeIds`, so notifications, reminders and dashboards reuse task logic.
- **Connections** are a one-way list on the user record (the other person is notified and can add back). Profile summaries show only public profile data and achievements - no email.
- **Leaderboard admin-only**: attendees and officers see their own progress and badges; rankings are a monitoring tool.
- **Event status is derived from dates** on read, so a forgotten status update can't hide a past event.

### Consequences
- **Positive**: No new infrastructure or functions; one task model; clear onboarding.
- **Negative**: Server-side checks still trust the `actorId` sent by the app (see ADR-008); any signed-in user can update a pubmat through the API even though the UI limits it to assignees and admins.

---

## ADR-017: Per-event Staff Permissions, Session Picks and Awarded Badges

### Status
**Accepted**

### Context
Any officer could approve stamps and check people in at any event, and session cards showed a fake, identical "going" number. The club wanted only officers who are tasked for an event to do these, a real count per session (people choose sessions; the expected number belongs to the whole event), and officer badges for things like hosting and the best pubmat.

### Decision
- **Staff list on the event**, not on tasks: `stampOfficerIds` and `checkinOfficerIds` next to the existing `officerIds`/`officerRoles`. Changed only through an admin-checked `action=staff`; enforced in the stamps and registrations APIs per event. Admins keep both rights everywhere.
- **Session choice on the registration** (`sessionIds`) instead of a new record type: no extra function (12-function limit), one read gives every session's count, and only registered people can pick.
- **Officer badges**: automatic ones computed on the client from existing data (like attendee badges); admin-awarded ones stored as `awards` on the user record, written only by `action=award|unaward` (not a profile field, so people can't award themselves).

### Consequences
- **Positive**: Least privilege at events with one checkbox per officer; real attendance signals per session; recognition without new infrastructure.
- **Negative**: Existing events start with empty duty lists, so only admins can approve/check in until staff are set (Admin Home warns). Server checks still trust the `actorId` sent by the app (ADR-008) until signed sessions arrive.


---

## ADR-018: One Event Desk, Approval Gates, and Co-organizer Staff as Marked Attendees

### Status
**Accepted** (v0.6.9 – v0.6.13)

### Context
Event-day work was spread over several pages; registrations, certificates, connections and officers' own tasks had no approval step; and a co-organized event needs people from a partner org (APC students, but not AWS SBG-APC officers) to help at the registration booth or stamp booths without getting officer tools.

### Decision
- **Event Desk** (`/officer/scan`) holds scan, stamp requests and attendees per event; stamps are approved only after check-in.
- **Approval gates** everywhere it matters: registrations (Pending → Approved/Declined by admins or the check-in team), certificates (unlock after the event, checked-in people only), AWS SBG-APC connections (the other person approves), and **officer-added tasks** (an admin approves before they count).
- **Co-organizer staff are attendee accounts with an admin-set `partnerOrg`**, not a new role. They reuse the existing per-event duty lists (ADR-017), so the same server checks apply; everything officer-only keeps checking `role === 'officer'`. Admins create them (or mark an existing attendee) - no self sign-up for staff.
- New server features stay inside existing functions as `?action=` routes (12-function limit).

### Consequences
- **Positive**: least privilege for outside helpers with no new screens or role plumbing; one place for event-day work; nothing counts until a person with authority approves it.
- **Negative**: co-organizer staff appear in the officers' *Event team* list on the event page (labelled with their org); the server still trusts `actorId` (ADR-008) until signed sessions arrive.


---

## ADR-019: Adviser as a View-only Role with Two Write Actions

### Status
**Accepted** (v0.6.14)

### Context
The org's adviser wants to follow how the org is doing, approve documents ("papirma") and post announcements, without being able to change events, accounts or tasks.

### Decision
- A separate **`adviser` role**, created only by an admin. Every existing admin-only check keeps rejecting it, so it's view-only by default.
- Its only writes are **announcements** (to officers and admins only, as the club chose) and **sign-off decisions**, stored as `announcement` / `signoff` records behind `?action=` routes in `api/notifications.ts` (12-function limit).
- Sign-off requests carry a **file link** instead of an upload, so documents stay in the org's Drive.

### Consequences
- **Positive**: the adviser sees the org's state and leaves an auditable approval trail with no risk of accidental edits.
- **Negative**: a document edited after approval isn't detected (the link points to a live file); the server still trusts `actorId` (ADR-008).

---

## ADR-020: Official Event Info as a Versioned Data File the Admin Applies

### Status
**Accepted** (v0.6.17)

### Context
The officers gave the official details of existing events (descriptions, dates, venues, program flow, speakers). The live database can't be edited from the development environment, and the details keep changing.

### Decision
- The details live in `src/data/clubEventInfo.ts` (mirrored in `api/seed.ts`) with a **version number**; events store the `infoVersion` they have.
- Admin Home shows "N events have older info" and **Update them** applies it (admin-only), keeping pictures, staff lists and anything not in the file.
- Nothing is made up: details the club hasn't given are left empty and asked for.

### Consequences
- **Positive**: one reviewed source, applied once by an admin, repeatable after each change.
- **Negative**: an admin's later manual edit to a field in the file is overwritten when a newer version is applied.

---

## ADR-021: Saved Copy of the Last Good Data Instead of Static Info for Old Events

### Status
**Accepted** (v0.6.20)

### Context
If DynamoDB (or the connection) fails, pages went blank or fell back to the old built-in sample data. Hard-coding old events in the app was considered.

### Decision
- Every successful GET is saved in the browser; on a network error or a 5xx the saved copy is shown with a notice and the time it was saved.
- **Writes are not faked offline**: they show an error instead of saving only on that device.
- The built-in club info stays only as the last resort for a browser that never loaded the data. Saved copies are cleared on sign-out.

### Consequences
- **Positive**: one source of truth (the database); admin edits are never shadowed by code; pages keep working through short outages.
- **Negative**: a device that never opened a page has no copy of it; data can be stale until the database is back.

---

## ADR-022: Evaluation Gates the Certificate, with Reminders Triggered by App Use

### Status
**Accepted** (v0.6.21)

### Context
The club wants every attendee to answer the event evaluation, opening 30 minutes before the end, and no certificate without it. Vercel Hobby crons run only once a day.

### Decision
- The form is **built into the app** (standard questions, editable per event), so completion is known and the certificate can be locked **server-side** (download and public verify).
- It applies to events ending from 2026-10-20 on; older certificates stay valid. An admin can turn it off per event.
- After the event, one reminder (bell + email) per checked-in attendee who hasn't answered. Besides the daily cron, any signed-in page load asks the server to run the after-event notices (at most every 5 minutes, per-person flags, 8-second budget), so reminders go out soon after an event ends.

### Consequences
- **Positive**: complete feedback, results and CSV in the app, no Google Form to reconcile.
- **Update (v0.6.24)**: events with stamp sessions also need every stamp for the certificate (same start date; admins can turn it off per event for parallel sessions). Admins and the adviser no longer register for events: they monitor.
- **Negative**: reminder timing depends on someone opening the app (otherwise 8 AM the next day); answers can't be changed after submitting.

---

## ADR-023: Share Links Go Through the API for Link Previews

### Status
**Accepted** (v0.6.22)

### Context
The app uses hash routes (`/#/...`), which social apps can't read, so a pasted event link showed no preview. Signed-out people opening a link only saw the sign-in page.

### Decision
- The shared link is `/api/events?action=share&id=...`: a tiny HTML page with Open Graph tags (title, date, venue, picture) that redirects to `/#/e/<id>` (no new serverless function: 12-function limit).
- `/#/e/<id>` is a **public preview** with Sign in (returns to the event) / Create an account; signed-in people go to the event page.

### Consequences
- **Update (v0.6.25)**: the same link with `&register=1` is each event's automatic **registration link** (stored in `externalUrl`, shown to admins with a QR code); it ends on a one-tap Register box rather than registering silently, so people confirm the event and the approval flow stays the same.
- **Positive**: rich previews in Messenger / Facebook / Discord, and a friendly landing page for new people.
- **Negative**: event pictures saved inside the record (no S3) can't be used as previews; event details are visible without signing in (same as a public poster).

---

## ADR-024: Amazon SES on the Club's Own Domain, with Send-only Keys and a Gmail Fallback

### Status
**Accepted** (v0.6.26). SES production access requested.

### Context
Emails were sent from a Gmail account with an App Password: daily sending limits, and messages from a personal-looking address. The club bought `apcsbg.org` and set up Amazon SES for it.

### Decision
- Send from **`notifications@apcsbg.org`** through SES in `ap-southeast-1`, with the domain verified by DKIM.
- SES gets its **own IAM user that can only send email**, with keys in `SES_ACCESS_KEY_ID` / `SES_SECRET_ACCESS_KEY`. The app's DynamoDB / S3 keys stay separate, so neither key can do the other's job.
- `EMAIL_PROVIDER` switches between SES and Gmail without code changes. While SES is still in the sandbox, `ses` falls back to Gmail for rejected recipients.
- Keys and account details live only in Vercel's environment variables, never in the repository or docs.

### Consequences
- **Positive**: emails come from the club's domain, with higher limits and better deliverability; a leaked SES key can only send email.
- **Negative**: two sets of AWS keys to manage and rotate; until production access is granted, SES only reaches verified addresses (Gmail covers the rest).

---

*Last Updated: October 2026*

