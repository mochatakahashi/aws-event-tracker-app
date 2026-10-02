# Changelog 📝

All notable changes to the **AWS SBG-APC Event Tracker** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.5] - 2026-10-02

### Added
- **Official Event Stamp Passport Component (`EventStampCard.tsx`)**:
  - Automatically computes and renders circular stamp slots for every session requiring completion in the selected event.
  - Added visual circle slot statuses:
    - 🟢 **STAMP APPROVED**: Emerald gradient badge seal with double ring border & officer verification info.
    - 🟠 **PENDING OFFICER APPROVAL**: Amber pulsing indicator badge awaiting officer review.
    - ⚪ **UNCLAIMED**: Dashed star slot with one-tap "Request Stamp" button.
  - Added progress completion percentage bar and "PASSPORT COMPLETED 🎉" banner badge.
- **Integrated Stamp Card**: Embedded `EventStampCard` into both `DashboardPage` and `EventFlowPage`.

### Changed
- Refactored `DashboardPage` to replace basic static progress card with the interactive `EventStampCard`.

---

## [0.2.0] - 2026-10-02

### Added
- **Mobile Bottom Navigation (`BottomNav.tsx`)**: Fixed bottom navigation bar for mobile viewports (`xs`) offering one-tap routing to Events, Connect, Flow, Notifications, and More.
- **Inline Navigation Dropdown**: Replaced mobile temporary drawer overlay with an inline expandable `<Collapse>` menu beneath top app bar.

### Changed
- **Zero-Overlay UI Architecture**: Converted screen-blocking modal dialogs (`Dialog`) into inline collapsible cards.
- **Inline Networking QR Card (`NetworkingCard.tsx`)**: Transformed QR card from a modal popup into an inline card component togglable on `ProfilePage`.
- **Navbar Shape & Layout**: Set `borderRadius: 0` on `MuiAppBar` in `theme.ts` and `AppLayout.tsx` for full-width edge-to-edge header styling without curved floating corners.
- Changed header positioning to `position="sticky"` with title text truncation (`textOverflow: 'ellipsis'`).

---

## [0.1.0] - 2026-10-01

### Added
- **Initial MVP Release**:
  - React 18 + Vite + TypeScript application boilerplate.
  - Material UI (MUI) v6 theme inspired by AWS SBG-APC brand colors.
  - Mock service layer (`authService`, `eventService`, `sessionService`, `speakerService`) with simulated latency.
  - Role-based authentication context (`AuthContext`) supporting `admin`, `officer`, and `attendee` roles.
  - Event Flow schedule page displaying time-grouped sessions.
  - Officer Dashboard for approving/declining stamp requests.
  - Admin Dashboard for user role management.
