# Changelog 📝

All notable changes to the **AWS SBG-APC Event Tracker** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.6.0] - 2026-10-16

### Added
- **🔔 In-app notification center + bell badge**: the Notifications page now shows real notifications stored in DynamoDB (`/api/notifications`) instead of sample data — stamp approved / declined, account approved / declined, assigned to an event, new task, checked in, and new sign-ups (sent to every admin). Unread count on the phone top-bar bell and the laptop sidebar; tap to open the related page; *Mark all as read*; remove. Registered events that are live or start within 24 h are pinned on top.
- **🎟️ Attendee digital event pass (`/pass`)** with a personal QR code per registered event, linked from the Dashboard, the event page ("Show my event pass"), the sidebar and the profile menu. The pass refreshes and turns green after check-in.
- **📷 Officer check-in scanner (`/officer/scan`)** for officers and admins: camera QR scanning (back camera on phones), attendee details and stamp passport, **one-tap Check in**, "already checked in by …" on repeat scans, warning when a pass is for a different event, live "checked in" count, and a name / email / student ID search when the camera can't be used. Opened from the Officer Dashboard and an Admin Dashboard card. Scanning a pass with a phone's normal camera app also opens it.
- **🏅 Certificate of participation**: issued automatically at check-in (`pdf-lib`), stored in S3 under `certificates/<eventId>/<certificateId>.pdf`, downloaded through a short-lived signed link from the pass or event page. If S3 isn't configured or the upload fails, check-in still succeeds and the PDF is generated on download / retried on the next scan.
- **📅 Add to Calendar** on the event page, the registration panel and the pass: Google Calendar link (Manila time zone) or `.ics` file (Apple Calendar / Outlook) with venue, session schedule, event link and a 1-hour reminder.

### Changed
- Admin check-in toggle on Attendees & Achievements uses the same check-in flow, so certificates are issued there too.
- `README`: documents the Gmail SMTP option and the App Password rule (must be created on the `GMAIL_USER` account).

---

## [0.5.3] - 2026-10-16

### Fixed
- **Emails not sending after the Gmail switch**: `api/notify.ts` imported `../lib/mail` without a `.js` extension, which fails on Vercel because the project is an ES module (`"type": "module"`), so `/api/notify` crashed before sending. The Gmail (Nodemailer) sender now lives inside `api/notify.ts` like the other self-contained API files. Spaces in `GMAIL_APP_PASSWORD` are ignored, and the club inbox isn't CC'd on emails already addressed to it.

### Changed
- Email now goes through Gmail SMTP when `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set (Amazon SES is the fallback). Every user email is CC'd to and replies go to aws.apcofficial@gmail.com.

---

## [0.5.2] - 2026-10-16

### Changed
- **Decline email**: declined sign-ups get an email from the AWS SBG-APC address (`SES_FROM_EMAIL`) with the admin's reason, a "Sign up again" link, and Reply-To set to aws.apcofficial@gmail.com so they can answer directly. Approval emails use the same Reply-To.
- If SES can't send an approval/decline email (for example, SES is still in sandbox mode and the address isn't verified), the admin sees a warning in Manage Accounts explaining why, and the failure is also emailed to aws.apcofficial@gmail.com. Successful sends show who the email went to.

---

## [0.5.1] - 2026-10-16

### Changed
- **Laptop layout**: the sidebar layout now starts at 768px wide (was 900px), so laptops with display scaling no longer get the phone layout with the bottom bar. Page content is centered with a max width on large screens.
- **Wider screens use the space**: Welcome page is a two-column hero; Select Event shows events in 2–3 columns; Profile puts the password card beside the profile; Connect shows About and Social Links side by side; Officer Dashboard shows tasks and stamp requests side by side; Manage Accounts, Attendees and Achievements lists use two columns; Officer Tasks puts the form beside the task list; admins' event pages use the full width; the Event Builder form is wider.
- Phones keep the single-column layout and bottom bar.

### Documentation
- README, ARCHITECTURE, DECISIONS (ADR-009 email/cron, ADR-010 built-in admin, ADR-011 responsive layout) and ROADMAP updated for v0.4.0–v0.5.1: sign-up types, admin approval, notifications, archive batches, deployment variables, phone/laptop layouts.

---

## [0.5.0] - 2026-10-16

### Added
- **Email notifications (Amazon SES, `/api/notify`)**: account approved / declined (with the reason), officer assigned to an event (with their event role), new task, plus a daily 8:00 AM (Manila) Vercel Cron job for "event tomorrow", "see you today" and "task due tomorrow" reminders. Officers receive emails on both their APC and personal email. Admins can also press **Send reminders now** on the Admin Dashboard. Each reminder is sent once; moving an event's date re-arms its reminders.
- **Admin alerts to `aws.apcofficial@gmail.com`**: an email for every new sign-up waiting for approval (with their details and a link to review), and a report when reminder emails fail or the daily job breaks. The `awsapc.admin` account uses this email, so the admin can also sign in with it.
- **Decline reason**: when declining a sign-up, the admin can pick a quick reason (missing name, wrong email, not an APC email, wrong student ID, duplicate) or type one. It's optional, shown to the person when they try to sign in, and included in the email.
- **Archive officers by school-year batch**: archive one officer or **all current officers** at the end of a school year. They become alumni attendees (can still sign in and join events) and their position and committee are kept under **Past batches**.
- **Delete accounts** (admin only, with an inline confirmation) from Manage Accounts and the Officers page.

### Changed
- **Removed all demo accounts** and the demo sign-in panel. The only built-in account is the admin **`awsapc.admin`**, whose password comes from the `ADMIN_PASSWORD` environment variable (deployed) or `VITE_LOCAL_ADMIN_PASSWORD` in `.env.local` (local) — no password is stored in the code.
- `/api/seed` no longer creates sample stamps for demo people.

---

## [0.4.0] - 2026-10-16

### Added
- **Accounts in DynamoDB (`/api/users`)**: Sign up, sign in, profiles and roles are now stored in the database, so every login and device sees the same accounts. Passwords are hashed with scrypt; password hashes are never returned by the API. 
- **Admin approval for every new account**: New sign-ups stay **pending** and cannot sign in until an admin approves them in **Manage Accounts**. Officer sign-ups are approved straight into the officer role; declined people can sign up again with the same email.
- **New sign-up form**:
  - Account type: **APC Student**, **Outside Attendee**, or **Officer**.
  - Full name split into **First Name**, **M.I.** (optional) and **Last Name** (shown as "First M. Last").
  - APC students and officers must use an **APC email** (`@apc.edu.ph` / `@student.apc.edu.ph`) and enter their **APC Student ID**; officers can add an optional **personal email** (e.g. Gmail).
  - Outside attendees can use any email, are **not** asked for a student ID, and are asked for their **school / organization**.
  - Officers pick their **position** in the hierarchy (President → VP Internal → VP External → Directors → Assistant Directors → Associates) and, for Directors / Assistant Directors / Associates, their **committee** (Secretariat, Operations, Marketing, Technicals, Relations).
- **Admin dashboard** (`/home` for admins) with five areas:
  - **Manage Accounts** (`/admin`): pending sign-ups with full details, Approve / Decline, search and role changes.
  - **Edit Events** (`/events`).
  - **Attendees & Achievements** (`/admin/attendees`): per-event attendee list with check-in, plus stamp monitoring per session, the list of people who finished every session, and **Excel (.xlsx) downloads** for profs (summary, finishers, and one sheet per session).
  - **Officers** (`/admin/officers`): officers in hierarchy order with events volunteered (and their event role), stamps approved, and task progress; admins can correct an officer's position / committee; Excel download.
  - **Officer Tasks** (`/admin/tasks`): assign tasks (with optional event and due date) to one or more officers.
- **My Tasks** on the **Officer Dashboard**: officers see tasks assigned to them and can Start / Mark done / Reopen.
- **Registrations, tasks and speakers in DynamoDB**: new `/api/registrations`, `/api/tasks` and `/api/speakers` functions (local fallback in `localStorage` when `/api` is not running).
- **Change password** on the Profile page.

### Changed
- Removed **Continue with Google** from Sign In and Sign Up (APC email is the main login). Sign in accepts an email.
- Profile photo, bio and social links are now saved to the account (they were lost on refresh before), and the photo shows in the header and Connect page.
- Speakers added in the Event Builder (including their photos) are now saved and reloaded when editing an event.
- Only admins see the **Assign an Officer** form on an event page, and the list only offers officers, in hierarchy order with their title.
- Demo account shortcuts on the login page only show in local development.

### Fixed
- **Event times shifting when editing**: the Event Builder showed UTC times in the date/time fields, so each save moved the event by the time-zone offset. It now uses the browser's local time.
- **API safety**: `/api/events`, `/api/sessions` and `/api/stamps` now only read, update or delete records of their own type, so they can't return or overwrite user accounts stored in the same table.

---

## [0.3.1] - 2026-10-16

### Added
- **Circular Avatar Image Adjuster (`AvatarImageAdjuster.tsx`)**:
  - Interactive avatar adjuster featuring a circular viewport preview, pan/drag positioning, zoom slider (1× to 3×), and direct S3 upload via pre-signed URLs.
  - Wired into `ProfilePage.tsx` for updating personal profile avatars with instant preview, change, and remove actions.
  - Wired into `EventBuilderPage.tsx` for speaker headshots with full crop control and instant preview.
- **AWS Cloud Backend & DynamoDB / S3 Serverless API (Vercel)**:
  - **`/api/events`**: GET and POST handlers for live event records in Amazon DynamoDB.
  - **`/api/sessions`**: GET and POST handlers for event session records in DynamoDB.
  - **`/api/stamps`**: GET stamps, POST request stamp, and PUT approve/decline stamp handlers backed by DynamoDB.
  - **`/api/upload-url`**: Generates S3 pre-signed upload URLs for secure direct-to-S3 asset uploads.
  - **`/api/seed`**: Dedicated serverless endpoint for seeding default events, sessions, and stamps into DynamoDB.
  - **`storageService.ts`**: Client-side integration for requesting pre-signed S3 upload URLs and streaming image blobs directly to S3.
  - **Hybrid Service Fallback**: `eventService.ts` and `sessionService.ts` seamlessly communicate with live `/api/*` routes when available, gracefully falling back to `localStorage`.
  - Configured `vercel.json` with SPA routing rewrites and API route declarations.

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
