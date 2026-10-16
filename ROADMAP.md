# AWS SBG-APC Event Tracker — Product Roadmap 🗺️

This document outlines the development milestones, current status, and future technical roadmap for the **AWS SBG-APC Event Tracker** application.

---

## 🎯 Vision Statement

To provide AWS Student Builder Group members at Asia Pacific College with an intuitive, mobile-optimized event companion that streamlines workshop activity verification, networking, and session tracking without friction.

---

## 🏁 Completed Milestones

### ✅ Version 0.1.0 — Initial MVP & Core Architecture
- [x] Initial React + Vite + TypeScript application setup.
- [x] Mock data layer with simulated latency for Events, Sessions, Speakers, and Registrations.
- [x] React Context authentication (`AuthContext`) with hardcoded multi-role demo accounts (`admin`, `officer`, `attendee`).
- [x] Dashboard view with statistics, upcoming sessions list, and event selection.
- [x] Event Flow schedule page displaying time-grouped sessions.
- [x] Speaker lineup with company details and LinkedIn link integration.

---

### ✅ Version 0.2.0 — Mobile-First Optimization & No-Overlay UX
- [x] **Zero-Overlay UI Refactor**: Removed screen-obscuring backdrop modals (`Dialog`, modal drawers) across mobile viewports.
- [x] **Inline Navigation Drawer**: Converted mobile navigation drawer into a collapsible inline panel (`Collapse`) under top header.
- [x] **Full-Width Edge-to-Edge Header**: Fixed navbar rounded corners (`borderRadius: 0`) and sticky layout positioning (`position="sticky"`).
- [x] **Mobile Bottom Navigation (`BottomNav`)**: Added fixed bottom navigation bar for quick access to main routes on `xs` viewports.
- [x] **Inline Networking QR Card (`NetworkingCard`)**: Converted QR modal into an inline card component toggled directly on the Profile page.

---

### ✅ Version 0.2.5 — Automatic Event Stamp Passport (`EventStampCard`)
- [x] **Dynamic Session Stamp Passport**: Built the `EventStampCard` component that automatically generates circle slots for every required session in the selected event.
- [x] **Visual Circle Statuses**:
  - 🟢 **STAMP APPROVED**: Emerald gradient badge seal with checkmark & officer verification info.
  - 🟠 **PENDING OFFICER APPROVAL**: Amber pulsing indicator badge.
  - ⚪ **UNCLAIMED**: Dashed star slot with one-tap "Request Stamp" button.
- [x] **Passport Completion Indicator**: Automatic progress percentage bar and "PASSPORT COMPLETED 🎉" banner badge upon 100% verification.
- [x] **Officer Queue Improvements**: Updated `OfficerDashboardPage` for quick one-click stamp approvals/declines.

---

## 🔮 Upcoming Milestones

### ✅ Version 0.3.1 — Cloud Assets Pipeline & Live DynamoDB Backend
- [x] **Amazon S3 Asset Pipeline**: Cloud storage for event banners and speaker/profile avatars via secure pre-signed URLs (`/api/upload-url`, `storageService.ts`).
- [x] **16:9 Banner Image Adjuster (`ImageBannerAdjuster`)**: Interactive drag, zoom (1× to 3×), and fit-to-frame editor with instant 1280×720 export and dashboard synchronization.
- [x] **Circular Avatar Image Adjuster (`AvatarImageAdjuster`)**: Circular crop preview, pan/drag, and zoom controls for attendee profiles and event speakers.
- [x] **Amazon DynamoDB Serverless API (Vercel Functions)**:
  - Live endpoints for Events (`/api/events`), Sessions (`/api/sessions`), and Stamps (`/api/stamps`).
  - Batch seeding endpoint (`/api/seed`) for initial data provisioning.
  - Hybrid service fallback in `eventService.ts` and `sessionService.ts` for offline/local development resiliency.

---

## 🔮 Upcoming Milestones & Next Steps

### 🚧 Version 0.3.5 — Officer In-Person QR Scanner & Verification (Immediate Next Priority)
- [ ] **Officer In-Person QR Camera Scanner**: Enable officers to scan attendee QR codes (from `NetworkingCard` / attendee passes) via device camera to instantly pull up their stamp passport and approve stamps on the spot.
- [ ] **Attendee Event Pass / Ticket QR**: Dedicated digital event check-in badge containing attendee ID and registered event token.
- [ ] **NFC Badge Tap Integration**: Web NFC API support for physical event badge check-ins.
- [ ] **Offline Stamp Storage (Service Worker / PWA)**: Enable offline stamp caching so attendees can request stamps even with low venue connectivity.

---

### 📅 Version 0.4.0 — Production Auth & Real-Time Sync
- [ ] **AWS Amplify / Cognito Authentication**: Replace mock auth with real user pools, APC Google Workspace SSO, and MFA.
- [ ] **Real-Time Stamp Approvals & Notifications**: Live WebSockets or Server-Sent Events (SSE) notifying attendees immediately when an officer approves their stamp.
- [ ] **Officer In-App Notification Feed**: Push alerts for incoming stamp requests to assigned session officers.

---

### 🚀 Version 1.0.0 — Leaderboard, Gamification & Certificates
- [ ] **Builder Leaderboard & Badges**: Gamified leaderboard ranking attendees by stamp count and workshop activity completions.
- [ ] **Automated Certificate of Attendance**: Automatic PDF certificate generation upon completing 100% of event stamps.
- [ ] **Multi-Event Analytics**: Officer/Admin reporting dashboard showing attendance retention and workshop completion rates.

---

## 📊 Feature Matrix & Status Summary

| Feature | Target Version | Status | Priority |
| :--- | :--- | :--- | :--- |
| Mock Auth & Role Context | v0.1.0 | ✅ Completed | High |
| Schedule & Session Flow | v0.1.0 | ✅ Completed | High |
| Mobile Bottom Navigation | v0.2.0 | ✅ Completed | High |
| No-Overlay UI Architecture | v0.2.0 | ✅ Completed | High |
| Event Stamp Passport Card | v0.2.5 | ✅ Completed | High |
| Officer Stamp Queue | v0.2.5 | ✅ Completed | High |
| 16:9 Banner Adjuster & S3 Upload | v0.3.1 | ✅ Completed | High |
| Circular Avatar Adjuster & S3 Upload | v0.3.1 | ✅ Completed | High |
| Live DynamoDB API & Seeding | v0.3.1 | ✅ Completed | High |
| Officer Camera QR Scanner | v0.3.5 | 🚀 **Next Up** | High |
| Offline PWA Support | v0.3.5 | ⏳ Planned | Medium |
| Real-Time Stamp Notifications | v0.4.0 | ⏳ Planned | High |
| AWS Cognito Authentication | v0.4.0 | ⏳ Planned | High |
| Gamified Leaderboard | v1.0.0 | ⏳ Planned | Medium |
| Automated PDF Certificates | v1.0.0 | ⏳ Planned | Low |

---

*Last Updated: October 2026*
