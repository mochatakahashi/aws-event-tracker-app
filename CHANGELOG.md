# Changelog 📝

All notable changes to the **AWS SBG-APC Event Tracker** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.1] - 2026-10-16

### Fixed
- **Event Banner Adjuster (`ImageBannerAdjuster.tsx`) – over-zoomed uploads**: Newly uploaded banner images no longer open heavily zoomed in or off-center.
  - The image is now scaled to fit entirely inside the 16:9 frame (contain) and centered by default.
  - Zoom is now a true multiplier that starts at exactly **1×** (fit to frame); the slider ranges from 1× to 3× (or higher when needed to fill the frame).
  - **Reset** returns to 1× and centered.
  - The fit is recalculated when the frame is resized (`ResizeObserver`).
  - The exported 1280×720 banner now uses the same sizing and centering as the on-screen preview, so the upload matches what the user sees.
- **Event banner not updating on the Dashboard**: The selected event is cached in `localStorage`, so the Dashboard kept showing the old banner after an edit.
  - `EventBuilderPage` now updates the cached selected event after **Save Event** when the edited event is the active one.
  - `EventContext` refreshes the cached selected event from the event service on startup.
- **Removing a banner now persists**: The form sends `imageUrl: ''` instead of `undefined`, so the update no longer keeps the old image.

### Changed
- **Minimal banner adjuster UI**: Removed the outlined card wrapper and header (title, instructions line, and duplicate top Cancel button); the adjuster now sits inline in the Event Builder form.
- **Banner flow is now Upload → adjust → Save**: The adjuster button is **"Save"** (with "Saving banner (…%)" progress) instead of "Crop & Upload to S3", and the empty-state button reads **"Upload Image"**.
- **Saved banner preview**: After saving, the Event Builder shows the updated banner as a 16:9 picture with **Change Image**, **Adjust**, and **Remove** actions, instead of reopening the adjuster with another upload button.

---

## [0.3.0] - 2026-10-08

### Added
- **Dynamic Event Details Organization**: Added a prominent purple Organizer block in `EventDetailPage`.
- **Expandable Speakers Lineup**: Implemented a "See more" / "See less" interactive toggle for the speakers list in the event details page.
- **Enhanced Officer Assignment**: 
  - Added dropdown options for assigning event roles (`Creatives`, `Media`, `Lead`, `Host`, `Usher`, `Registration Booth`).
  - Implemented dynamic user dropdown fetching all registered attendees for easy officer assignment.
  - Dynamically displays the assigned custom role underneath the officer's name.

### Changed
- **Admin Events UI Overhaul**: 
  - Removed clutter on the `EventsPage` by hiding the assigned officers list from individual event cards (visible inside event details).
  - Removed "Update" and "Delete" buttons from the event cards list.
- **Global Layout & Responsiveness**: 
  - Enforced strict horizontal boundaries (`maxWidth: 100vw`, `overflowX: hidden`) on `AppLayout.tsx` to fix unintended horizontal scrolling and wrapping glitches on mobile devices.

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
