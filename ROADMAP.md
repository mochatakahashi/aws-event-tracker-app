# AWS SBG-APC Event Tracker - Product Roadmap 🗺️

This document outlines the development milestones, current status, and future technical roadmap for the **AWS SBG-APC Event Tracker** application.

---

## 🎯 Vision Statement

To provide AWS Student Builder Group members at Asia Pacific College with an intuitive event companion for phones and laptops that streamlines workshop activity verification, networking, and session tracking without friction.

---

## 🏁 Completed Milestones

### ✅ Version 0.1.0 - Initial MVP & Core Architecture
- [x] Initial React + Vite + TypeScript application setup.
- [x] Mock data layer with simulated latency for Events, Sessions, Speakers, and Registrations.
- [x] React Context authentication (`AuthContext`) with multi-role mock accounts (replaced by real accounts in v0.4.0).
- [x] Dashboard view with statistics, upcoming sessions list, and event selection.
- [x] Event Flow schedule page displaying time-grouped sessions.
- [x] Speaker lineup with company details and LinkedIn link integration.

---

### ✅ Version 0.2.0 - Mobile-First Optimization & No-Overlay UX
- [x] **Zero-Overlay UI Refactor**: Removed screen-obscuring backdrop modals (`Dialog`, modal drawers) across mobile viewports.
- [x] **Inline Navigation Drawer**: Converted mobile navigation drawer into a collapsible inline panel (`Collapse`) under top header.
- [x] **Full-Width Edge-to-Edge Header**: Fixed navbar rounded corners (`borderRadius: 0`) and sticky layout positioning (`position="sticky"`).
- [x] **Mobile Bottom Navigation (`BottomNav`)**: Added fixed bottom navigation bar for quick access to main routes on `xs` viewports.
- [x] **Inline Networking QR Card (`NetworkingCard`)**: Converted QR modal into an inline card component toggled directly on the Profile page.

---

### ✅ Version 0.2.5 - Automatic Event Stamp Passport (`EventStampCard`)
- [x] **Dynamic Session Stamp Passport**: Built the `EventStampCard` component that automatically generates circle slots for every required session in the selected event.
- [x] **Visual Circle Statuses**:
  - 🟢 **STAMP APPROVED**: Emerald gradient badge seal with checkmark & officer verification info.
  - 🟠 **PENDING OFFICER APPROVAL**: Amber pulsing indicator badge.
  - ⚪ **UNCLAIMED**: Dashed star slot with one-tap "Request Stamp" button.
- [x] **Passport Completion Indicator**: Automatic progress percentage bar and "PASSPORT COMPLETED 🎉" banner badge upon 100% verification.
- [x] **Officer Queue Improvements**: Updated `OfficerDashboardPage` for quick one-click stamp approvals/declines.

---

### ✅ Version 0.3.1 - Cloud Assets Pipeline & Live DynamoDB Backend
- [x] **Amazon S3 Asset Pipeline**: Cloud storage for event banners and speaker/profile avatars via secure pre-signed URLs (`/api/upload-url`, `storageService.ts`).
- [x] **16:9 Banner Image Adjuster (`ImageBannerAdjuster`)**: Interactive drag, zoom (1× to 3×), and fit-to-frame editor with instant 1280×720 export and dashboard synchronization.
- [x] **Circular Avatar Image Adjuster (`AvatarImageAdjuster`)**: Circular crop preview, pan/drag, and zoom controls for attendee profiles and event speakers.
- [x] **Amazon DynamoDB Serverless API (Vercel Functions)**:
  - Live endpoints for Events (`/api/events`), Sessions (`/api/sessions`), and Stamps (`/api/stamps`).
  - Batch seeding endpoint (`/api/seed`) for initial data provisioning.
  - Hybrid service fallback in `eventService.ts` and `sessionService.ts` for offline/local development resiliency.

---

### ✅ Version 0.4.0 - Real Accounts, Approval & Admin Monitoring
- [x] **Accounts in DynamoDB** (`/api/users`) with scrypt-hashed passwords; email sign-in; Google sign-in removed.
- [x] **Sign-up types**: APC Student, Outside Attendee, Officer (position + committee); First / M.I. / Last name.
- [x] **Admin approval** for every new account.
- [x] **Admin Dashboard**: Manage Accounts, Edit Events, Attendees & Achievements (Excel for profs), Officers, Officer Tasks.
- [x] **Officer tasks** visible on the Officer Dashboard.
- [x] Registrations, speakers, profile photos/bios saved to the database.

---

### ✅ Version 0.5.0 - Email Notifications, Archive Batches, No Demo Accounts
- [x] **Amazon SES emails**: approval/decline (with reason), event assignment, new task, daily reminders (Vercel Cron), admin alerts to `aws.apcofficial@gmail.com`.
- [x] **Decline reasons** (optional, with quick picks).
- [x] **Archive officers by school year** (alumni attendees, Past batches) and delete accounts.
- [x] **Demo accounts removed**; built-in `awsapc.admin` from `ADMIN_PASSWORD`.

---

### ✅ Version 0.5.1 - Phone & Laptop Layouts
- [x] Sidebar layout from 768px; laptop grids and side-by-side sections; phones unchanged.

---

### ✅ Version 0.6.0 - Notification Center, QR Check-in, Calendar & Certificates
- [x] **In-app notification center + bell badge** (stamps, account review, event assignment, tasks, check-in, new sign-ups for admins).
- [x] **Attendee digital event pass** with a personal QR code.
- [x] **Officer camera scanner** that opens the attendee's stamp passport and checks them in with one tap (plus name search fallback).
- [x] **Add to Calendar** - Google Calendar link and `.ics` download.
- [x] **Certificate of participation** - PDF issued at check-in and stored in S3.

---

### ✅ Version 0.6.7 - Accounts, Committees, Content Tracker, Connect & Dashboard
- [x] **Password rules** (capital, small letter, number, symbol, 6+), **admin-created accounts with temporary passwords**, forced first change, admin password reset.
- [x] **Sub-committees** (Marketing: Creatives, Media · Secretariat: Finance, Documents) and **"Signed up as"** for admins.
- [x] **Committee task board** with deadlines and the **Marketing Content Tracker** (designee, caption writer, poster, status, post date, file link) + caption guidelines.
- [x] **Connect**: profile QR, in-app scanner, profile summaries, connections with achievements.
- [x] **Live dashboard**, pass on the event page, **saved events**, date-based Past events, admin-only leaderboard.

---

### ✅ Version 0.6.8 - Session Picks, Event Staff Permissions & Officer Badges
- [x] **Pick your sessions**: one expected count per event; each session shows its real "going" count; events can have no sessions.
- [x] **Event staff list**: only officers an admin ticks can approve stamps / check people in at that event (server-enforced).
- [x] **Officer badges**: automatic (incl. Event Host, Content Creator) and admin-awarded (Best Host, Best in Pubmat, MVP, Team Player, Rising Star).

---

### ✅ Version 0.6.9 - Event Desk
- [x] **Event Desk**: scanner, stamp requests and attendee list for each event in one page; stamps approved after check-in (**Check in & approve**).

---

### ✅ Versions 0.6.16 - 0.6.30 - Event Info, Announcements, Evaluation & Sharing
- [x] **Event duty card** for assigned officers and co-organizer staff (v0.6.16).
- [x] **Program flow table** and the club's official event info applied by the admin (v0.6.17 - v0.6.18).
- [x] **Officers-only events** (v0.6.19).
- [x] **Pinned announcements** (24 hours, editable, officers or everyone), **saved copy when the database is down**, **last sign-in** for admins, tour only on the first sign-in, type-in session speakers, profile photo fix, officer comments on all their tasks (v0.6.20).
- [x] **Event evaluation** required for the certificate, with reminders after the event and results with CSV (v0.6.21).
- [x] **Share an event** with link previews and a public event page (v0.6.22); share from event cards, phone share-sheet fix, and speaker edit / remove on the event page (v0.6.23); all stamps for the certificate, admins monitor only, person-in-charge for the team only (v0.6.24); automatic registration link with QR and one-tap register (v0.6.25); SES on apcsbg.org (v0.6.26); local dev API, email copies, API reference docs (v0.6.27); emailed codes for password changes, working Forgot password, sign-in lock (v0.6.28); committee tasks for Directors, Assistant Directors, VPs and the President (v0.6.29); whole-org or event tasks, table and per-officer views, Excel download (v0.6.30).

---

## 🔮 Upcoming Milestones & Next Steps

### 🚧 Version 0.6.5 - On-site Extras & Email Notification Delivery
- [ ] **Instant Email Delivery via Official AWS Email (Amazon SES)**: Migrate email delivery from personal Gmail App Password to the official AWS sender address through Amazon SES. **In progress**: domain `apcsbg.org` verified in SES (DKIM), sender `notifications@apcsbg.org`, send-only IAM keys in Vercel, `EMAIL_PROVIDER` switch with Gmail fallback (v0.6.26); waiting for AWS to grant production access, then set `EMAIL_PROVIDER=ses`.
- [x] **Custom domain**: the app runs on `https://apcsbg.org`.
- [x] **Approve stamps from the scanner** (officer picks the session and approves on the spot).
- [ ] **`.ics` attached to event emails** (the custom email domain is done: `apcsbg.org`).
- [x] **Certificate verification page** (`/#/verify/:id`, QR code on every certificate).
- [x] **Builder Leaderboard & achievement badges** (moved up from v1.0.0).
- [x] **Event Picture Storage & Recent Uploads Shelf**: IndexedDB persistent client storage and `/api/uploads` DynamoDB endpoint showing recent uploads on load with 1-click banner application.
- [x] **Event Seed Synchronization**: Updated all 7 past and upcoming events with official attendee estimates across local and cloud databases.
- [ ] **NFC Badge Tap Integration**: Web NFC API support for physical event badge check-ins.
- [ ] **Offline Stamp Storage (Service Worker / PWA)**: Enable offline stamp caching so attendees can request stamps even with low venue connectivity.

---

### 📅 Version 0.7.0 - Production Auth & Real-Time Sync
- [ ] **AWS Cognito Authentication / signed sessions**: Replace the current app-level account checks with signed tokens (and optionally APC Google Workspace SSO and MFA).
- [ ] **Real-Time Stamp Approvals & Notifications**: Live WebSockets or Server-Sent Events (SSE) notifying attendees immediately when an officer approves their stamp.
- [ ] **Officer In-App Notification Feed**: Push alerts for incoming stamp requests to assigned session officers.

---

### 🚀 Version 1.0.0 - Leaderboard, Gamification & Certificates
- [x] **Builder Leaderboard & Badges**: delivered in v0.6.5.
- [ ] **Certificate of Completion**: a second certificate for attendees who complete 100% of event stamps.
- [ ] **Multi-Event Analytics**: Officer/Admin reporting dashboard showing attendance retention, workshop completion rates and evaluation trends across events.

---

## 📊 Feature Matrix & Status Summary

| Feature | Target Version | Status | Priority |
| :--- | :--- | :--- | :--- |
| Mock Auth & Role Context | v0.1.0 | ✅ Completed (replaced in v0.4.0) | High |
| Schedule & Session Flow | v0.1.0 | ✅ Completed | High |
| Mobile Bottom Navigation | v0.2.0 | ✅ Completed | High |
| No-Overlay UI Architecture | v0.2.0 | ✅ Completed | High |
| Event Stamp Passport Card | v0.2.5 | ✅ Completed | High |
| Officer Stamp Queue | v0.2.5 | ✅ Completed | High |
| 16:9 Banner Adjuster & S3 Upload | v0.3.1 | ✅ Completed | High |
| Circular Avatar Adjuster & S3 Upload | v0.3.1 | ✅ Completed | High |
| Live DynamoDB API & Seeding | v0.3.1 | ✅ Completed | High |
| Accounts, Sign-up Types & Admin Approval | v0.4.0 | ✅ Completed | High |
| Attendee/Stamp Monitoring & Excel Export | v0.4.0 | ✅ Completed | High |
| Officer Tasks & Achievements | v0.4.0 | ✅ Completed | High |
| Email Notifications (SES) & Daily Reminders | v0.5.0 | ✅ Completed | High |
| Officer Archive by School Year | v0.5.0 | ✅ Completed | Medium |
| Phone & Laptop Layouts | v0.5.1 | ✅ Completed | High |
| In-App Notification Bell | v0.6.0 | ✅ Completed | High |
| Attendee QR Pass & Officer Camera Scanner | v0.6.0 | ✅ Completed | High |
| Add to Calendar (.ics / Google) | v0.6.0 | ✅ Completed | Medium |
| Certificate of Participation (PDF → S3) | v0.6.0 | ✅ Completed | Medium |
| Stamp Approval from Scanner | v0.6.5 | ✅ Completed | Medium |
| Certificate Verification Page | v0.6.5 | ✅ Completed | Medium |
| Instant Email via AWS Email (SES) | v0.6.26 | 🚧 Domain verified, waiting for SES production access | High |
| Custom domain (apcsbg.org) | v0.6.26 | ✅ Completed | High |
| Local dev runs the real API (Vite middleware) | v0.6.27 | ✅ Completed | Medium |
| Password codes by email, Forgot password, sign-in lock | v0.6.28 | ✅ Completed | High |
| Committee tasks for leads (Directors, VPs, President) | v0.6.29 | ✅ Completed | High |
| Whole-org / event tasks, table view, Excel summary | v0.6.30 | ✅ Completed | Medium |
| Offline PWA Support | v0.6.5 | ⏳ Planned | Medium |
| Real-Time Stamp Notifications | v0.7.0 | ⏳ Planned | High |
| AWS Cognito Authentication | v0.7.0 | ⏳ Planned | High |
| Builder Leaderboard & Badges | v0.6.5 | ✅ Completed (admin-only since v0.6.7) | Medium |
| Password Rules, Admin-created Accounts, Temp Passwords | v0.6.7 | ✅ Completed | High |
| Committee Task Board & Marketing Content Tracker | v0.6.7 | ✅ Completed | High |
| Connect: Profile QR, Scanner, Connections | v0.6.7 | ✅ Completed | Medium |
| Live Dashboard & Saved Events | v0.6.7 | ✅ Completed | Medium |
| Session Picks & Real "Going" Counts | v0.6.8 | ✅ Completed | Medium |
| Event Staff Permissions (stamps / check-in) | v0.6.8 | ✅ Completed | High |
| Officer Badges (automatic + awarded) | v0.6.8 | ✅ Completed | Medium |
| Event Desk (scan · stamp requests · attendees) | v0.6.9 | ✅ Completed | High |
| Certificates after the event (code, link, view/download) | v0.6.10 | ✅ Completed | High |
| Registration approval, sessions editor, app tour | v0.6.11 | ✅ Completed | High |
| Connection requests, custom social links, achievements & passports rework | v0.6.12 | ✅ Completed | Medium |
| Co-organizer staff, officer-added tasks, profile editing, desk badge fix | v0.6.13 | ✅ Completed | High |
| Adviser account (announcements, sign-off), task comments, deadlines & reminders | v0.6.14 | ✅ Completed | High |
| Speakers linked to accounts, session move / misplaced-session fix | v0.6.15 | ✅ Completed | Medium |
| Event duty card (officers / co-organizer staff) | v0.6.16 | ✅ Completed | Medium |
| Program flow table & official event info | v0.6.17 | ✅ Completed | High |
| Officers-only events | v0.6.19 | ✅ Completed | Medium |
| Pinned announcements, saved copy when offline, last sign-in | v0.6.20 | ✅ Completed | High |
| Event evaluation (certificate gate, reminders, results) | v0.6.21 | ✅ Completed | High |
| Share an event (link previews, public event page) | v0.6.22 | ✅ Completed | Medium |
| Speakers lineup edit / remove on the event page | v0.6.23 | ✅ Completed | Medium |
| All stamps for the certificate, admins monitor only | v0.6.24 | ✅ Completed | High |
| Automatic registration link + QR, one-tap register | v0.6.25 | ✅ Completed | High |
| Certificate of Completion (100% stamps) | v1.0.0 | ⏳ Planned | Low |

---

*Last Updated: October 2026*
