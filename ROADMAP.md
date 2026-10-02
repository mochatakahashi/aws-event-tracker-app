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

### 🚧 Version 0.3.0 — NFC & QR Verification System (In Progress)
- [ ] **Officer In-Person QR Scanner**: Allow officers to scan attendee QR cards via device camera to automatically approve session stamps.
- [ ] **NFC Badge Tap Integration**: Web NFC API support for physical event badge check-ins.
- [ ] **Offline Stamp Storage (Service Worker / PWA)**: Enable offline stamp caching so attendees can request stamps even with low venue connectivity.

---

### 📅 Version 0.4.0 — Cloud Infrastructure & Live Backend Integration
- [ ] **AWS Amplify / Cognito Authentication**: Replace mock auth with real user pools, SSO (APC Google Workspace), and MFA.
- [ ] **AWS AppSync / GraphQL API**: Connect application to live AWS AppSync GraphQL backend backed by Amazon DynamoDB tables.
- [ ] **Real-Time WebSockets**: Live real-time stamp approval notifications sent to attendees when an officer approves their request.
- [ ] **Amazon S3 Asset Pipeline**: Cloud storage for speaker avatars, event banners, and generated QR cards.

---

### 🚀 Version 1.0.0 — Production Release & Leaderboard
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
| Camera QR Scanner | v0.3.0 | ⏳ Planned | Medium |
| Offline PWA Support | v0.3.0 | ⏳ Planned | Medium |
| AWS Cognito & DynamoDB Sync | v0.4.0 | ⏳ Planned | High |
| Automated PDF Certificates | v1.0.0 | ⏳ Planned | Low |

---

*Last Updated: October 2026*
