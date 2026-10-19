# Changelog 📝

All notable changes to the **AWS SBG-APC Event Tracker** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.6.15] - 2026-10-19

### Fixed
- **Tech Barangay sessions showing under Cloud Watch**: in the live database the built-in Tech Barangay workshops (WordPress Campus Connect, WordPress on AWS, Notion Productivity) could point at the Cloud Watch event. Admin Home now detects this and offers **Move them** (one tap moves them to the Tech Barangay event; other sessions are untouched). API: `GET /api/seed` reports `misplacedSessions`, `POST /api/seed?action=fix-sessions` (admin).

### Added
- **Event picker in the session editor** (admins): move any session that's under the wrong event.
- **Speakers linked to accounts**: in the event form, each speaker can be linked to an app account (an officer who speaks, or any member). Their name, photo and social links come from their profile and stay up to date; officers get an *AWS SBG-APC officer* label and tapping a speaker opens their profile.
- **Outside speakers**: name, title, bio, photo, **social links** (any platform) and an optional **email** — if they later create an account with that email, the speaker links to it automatically and shows their own links too.

---

## [0.6.14] - 2026-10-19

### Added
- **Adviser account** (role `adviser`, created by an admin — Add account → Role: Adviser, or change the role in Manage Accounts). View-only: an **Adviser dashboard** with officers, upcoming events, open / done-on-time / late tasks, officer tasks (Open · Done · Late) and events with attendance; Events (view only, no Register) and the Leaderboard. No attendee pages; can't edit events, accounts or tasks (server-checked).
- **Announcements to the officers**: the adviser (or an admin) posts a title + message; every officer and admin gets a notification and sees it under *From the adviser* on their Dashboard. Attendees don't. API: `/api/notifications?action=announcements|announce|announcement`.
- **Adviser sign-off ("papirma")**: officers and admins send *Ask the adviser to sign* (what, details, file link); the adviser **Approves** (optional note) or **Returns** with what needs to change; the requester is notified and the record stays (who, when, comment). API: `?action=signoffs|signoff|signoff-review`.
- **Task comments**: admins and the officers assigned can comment on a task (Officer Dashboard and Officer Tasks); the others on the task are notified. API: `POST /api/tasks?action=comment`.
- **Deadlines at a glance**: *N days left* / *Due today* / *Overdue by N days*, and once done *Done on time* or *Done N days late*. Officer Tasks adds *Done on time* and *Overdue / late* counts.
- **Task reminders**: the daily 8:00 AM job sends a notification + email the day before the deadline, and when a task is overdue (then every 3 days until done). In-app reminders are posted even when email isn't set up.

### Fixed
- **Events didn't show on the deployed app**: the Events page loaded each event's registration count with its own request; on Vercel one slow/failed request left the whole list empty. Events now show right away and the counts come from one request (a failure only leaves the counts at 0).
- The event pass (where the certificate is) no longer shows "Outside Attendee" / "APC Student" beside the name.

---

## [0.6.13] - 2026-10-19

### Added
- **Co-organizer staff for co-organized events** (partner orgs that aren't AWS SBG-APC): events get **Co-organizer(s)** (shown as *Co-organized by AWS SBG-APC and …*); an admin marks an attendee account as **Co-organizer staff · <org>** (Add account → *Co-organizer staff for*, or the 🤝 button on any attendee) and puts them on an event's staff list (*Co-organizer* role, check-in pre-ticked). They get only the Event Desk for those events and only their duties' tabs, plus a Dashboard card — no officer features. Server-checked in the stamps and registrations APIs; `partnerOrg` is admin-only.
- **Officers add their own tasks** → *Waiting for approval* → an admin approves (joins the board, counts on the leaderboard) or declines with a reason; both sides are notified. API: `POST /api/tasks?action=propose | review`. Pending tasks can't be marked done.
- **Officer Dashboard request lists by duty**: *Stamp requests* (approve / decline inline) only for stamp-team officers, *Registration & check-in* (approve / decline waiting registrations) only for check-in-team officers.
- **Edit profile** (Profile → Edit profile): name, M.I., student ID or school/organization, personal email, bio and social links; the display name follows. Email / sign-in stays locked.
- **Replay the app tour from your profile picture** (top-bar avatar on phones, sidebar avatar on laptops → *Replay the app tour*).

### Fixed
- **App tour on phones**: the *My Event Pass* step highlighted nothing (it isn't in the bottom bar) — it now points at your profile picture and says *Tap your picture → My Event Pass*. The tour animation is smoother: the highlight box moves with GPU transforms, the pulse ring animates only transform/opacity, and scroll/resize updates are limited to one per frame.
- **Admin saw a stamp-request count with no requests on the Event Desk**: the menu badge counted every event while the desk showed one, and it only refreshed every minute. The badge now counts only what the desk can show, updates right after approving/declining, the event picker shows each event's count, and the desk links to requests waiting at another event.

### Changed
- Officer Dashboard link only for officers (being on an event's staff list no longer shows it). Event Desk tabs follow your duties.
- Server: officer position/committee can only be changed by officers themselves or an admin; profile fields are length-checked; personal email must be valid.

---

## [0.6.12] - 2026-10-18

### Added
- **AWS SBG-APC connection requests**: **Connect** sends a request; the other person gets a notification with **Approve / Decline** and sees it under *Connection requests* on Connect. Sender sees **Requested** (Cancel). Connecting back to someone who already asked you accepts their request. Both get a notice when it's accepted. API: `POST /api/users?action=connect | connect-respond | connect-cancel | disconnect`.
- **Connection count** on every profile and on your Connect card (*N AWS SBG-APC connections*).
- **More social links**: Facebook, Instagram, TikTok, YouTube (plus LinkedIn, GitHub, X, Website) and **custom links** with your own name (up to 10). Pick only the ones you want with **Add a link**.
- **Certificates on Achievements** with View, Download and Copy link.

### Changed
- **Stamp passports moved** off Achievements: they show on the **Dashboard** and the **event page** for live or upcoming events you're registered for that have stamps.
- **My achievements** lists completed things only: stamps earned, events attended, certificates, *My progress* and badges.
- Connections can no longer be written through a profile update; they change only through requests.
- Theme: the purple gradient applies to primary buttons only, so green **Approve** and red buttons keep their colours.

### Fixed
- Connect page quick links showed only LinkedIn and GitHub (Website, X and others were missing); all saved links now show.

---

## [0.6.11] - 2026-10-18

### Added
- **First-time app tour** (skippable): animated highlight boxes and step cards for attendees, officers and admins; remembered on the account (`tutorialSeen`); replay from the profile menu, sidebar or Profile.
- **Registration approval**: status **Pending → Approved / Declined**, set by admins or the event's check-in team in **Event Desk → Attendees** (Approve, Decline, **Approve all**); attendees are notified. API: `POST /api/registrations?action=review`, `PUT …{ rsvp, actorId }`.
- **Sessions editor** on the event page (admins): add, edit and delete sessions, including whether each has a stamp.
- **⭐ Stamps** badge on events with stamp activities; *No stamps at this event* on others.

### Changed
- Attendees can no longer edit their registration status (no Going / Interested / Declined buttons). Older `going` / `interested` records read as Approved / Pending.
- **No cancelling after check-in** (hidden in the app and refused by the server).
- The event pass appears once a registration is approved; checking in at the door also approves.
- Event photos / uploads on the event page are admin-only.
- Sessions API: only admins can add, change or delete sessions; only session fields are stored.
- Event form: the "Officer IDs" text box is gone — officers, roles and duties are set under **Event staff** on the event page.

### Fixed
- **Uploaded event picture didn't show**: pictures now open through the app (`/api/uploads?action=image`, a signed link), so they work with a private S3 bucket; old public S3 links are converted automatically. Without S3, the picture is shrunk to fit the database instead of silently failing, and saving an event shows the real error instead of pretending it saved.
- Speaker **Remove** button overlapped the speaker fields in the event form.
- Removed the "Show only …" button under the leaderboard.
- Sessions from the built-in sample data no longer appear when the live database has none.

---

## [0.6.10] - 2026-10-18

### Changed
- **Certificates unlock after the event ends**, and only for people checked in at it; registered no-shows get none. Check-in now just reserves the **unique certificate code** (checked against existing codes); the PDF is dated the day the event ended.

### Added
- **View**, **Download** and **Copy link** for the certificate on the pass and event page; clear messages before the event ends, when not checked in, and for no-shows.
- **Public certificate link** (`/#/verify/<code>`): anyone with it can view or download the PDF (`GET /api/registrations?action=certificate&certificateId=<code>[&download=1]`); codes from a running event show *Not issued yet*.
- **"Your certificate is ready"** bell notice and email from the daily run, once per event, to everyone who was checked in (the bell notice is posted even without email set up).

---

## [0.6.9] - 2026-10-18

### Added
- **Event Desk** (`/officer/scan`, replaces the Check-in Scanner page): one place per event with tabs **Scan** (QR check-in + booth stamps), **Stamp requests** (approve / decline, with a waiting count) and **Attendees** (check-in list with search, filters, stamps and session picks, one-tap check-in). Opens on a tab/event from links (`?tab=stamps&event=…`). Admin sidebar, Admin Home and the phone bottom bar link to it with the number of stamp requests waiting.
- **Check in & approve**: approve a stamp for someone who isn't checked in yet in one tap (check-in team only).
- **Can't scan? Find the attendee** now lists everyone registered (not checked in first) before you type, so staff can just tap a name; typing narrows the list.

### Changed
- **Stamps are approved after check-in**: the server refuses to approve a stamp until the attendee is checked in to that event (`409 NOT_CHECKED_IN`); the scan result shows *Check in first*.
- The Officer Dashboard no longer approves stamps itself; it shows how many requests are waiting per event and links to the Event Desk.

### Fixed
- Opening a pass link while the Event Desk was on another tab didn't show the scanned attendee.

---

## [0.6.8] - 2026-10-18

### Added
- **Pick your sessions**: the event keeps one expected-participants number; registered attendees tap **I'll attend** on the sessions they'll go to (event page, session page). Each session shows its own real **"N going"** count. API: `PUT /api/registrations?id=` with `{ personId, sessionIds }` (own registration only; only that event's sessions are kept).
- **Event staff list** on the event page (admins): assign officers with a role and tick **Approve stamps** / **Check people in** per officer (roles pre-tick a default: Lead → both, Registration Booth → check-in, Usher → stamps). Officers are notified of new duties; officers can be removed from an event. API: `PUT /api/events?id=…&action=staff` (admin only).
- **Officer duties** on the Officer Dashboard, and a warning on Admin Home for upcoming events with nobody on stamps or check-in.
- **Officer badges**: automatic (First Duty, Stamp Master, Door Keeper, Task Finisher, Content Creator, Event Host, Event Regular) and **admin-awarded** (Best Host, Best in Pubmat, Event MVP, Team Player, Rising Star — optionally per event, with a note). Shown on Achievements, profiles and the admin leaderboard (+20 points each). API: `POST /api/users?action=award|unaward` (admin only).

### Changed
- **Only officers on an event's staff list can approve/decline stamps and check people in** at that event (admins always can). Enforced in `/api/stamps` and `/api/registrations`; the scanner only lists the officer's events and hides buttons they can't use; the stamp queue only shows their events.
- New stamp requests are always *pending* (the server ignores a client-sent `approved`), and `PUT /api/registrations` can no longer set `checkedIn` (check-in only through `action=checkin`).
- Ordinary event edits can't change the duty lists; removing an officer from an event removes their duties.
- Officer leaderboard: +20 per officer badge (all-events view).
- Events with no sessions: the schedule/passport and dashboard say it's one program instead of showing empty or Tech Barangay-specific text.

### Fixed
- Session cards showed a hard-coded **"+15 Going" / "+12 Going"** and a fixed "10 OCT" date on every session.
- Approving or declining a stamp that the server refused looked successful (it fell back to a local copy); the error is now shown.
- The info button on *Select Event* cards was a button inside a button (same bug as the old bookmark); it now sits outside the card's click area.

### Notes
- **No new packages** — `npm install` isn't needed for this update.
- After deploying, set the **Event staff** for upcoming events; until then only admins can approve stamps or check people in.

---

## [0.6.7] - 2026-10-18

### Added
- **Password rules for everyone**: at least 6 characters with a capital letter, a small letter, a number and a special symbol, with a live checklist (sign-up, change password, admin forms); enforced by the server too.
- **Admin "Add account"**: create approved accounts (APC student, outside attendee or officer with position/committee/sub-committee) with a generated temporary password and *Copy login details*. **Reset password** per account. Temporary passwords must be changed at first sign-in (**Set your own password** page; the rest of the app is blocked until then).
- **Change password page** (`/change-password`), linked from the profile menu and Profile.
- **Sub-committees**: Marketing → Creatives, Media; Secretariat → Finance, Documents — at sign-up, in Add account, and in the admin Officers page.
- **"Signed up as …"** on every account in Manage Accounts (type, position, committee, sub-committee).
- **Committee task board**: Officer Tasks grouped by committee with sub-committee filters; tasks have a required deadline (date + time), committee and sub-committee; emails include the committee.
- **Marketing Content Tracker** (pubmats): designee, caption writer, poster, status, post date, file link, notes, draft deadline; assigned officers notified with their role and can update their items from the Officer Dashboard; **caption guidelines** link.
- **Connect**: networking QR now opens a profile summary (bio, all social links, achievements); **Scan QR** in Connect; **Add connection** and **My connections** with their achievements; the other person is notified.
- **Live dashboard** for attendees and officers: Happening now / Up next, At the selected event, Your registrations, Latest updates, Your work (officers).
- **Event pass on the event page** (inline QR) once registered.
- **Save events**: the bookmark icon now saves events to your account; **Events → Saved** tab.
- **Import club events** (admin home): adds the built-in club events missing from the live database.

### Changed
- **Leaderboard is admin-only** (monitoring), with progress bars; attendees and officers see their own progress and badges on Achievements, no rankings.
- **Event status follows the dates**: ended events show under **Past** automatically (fixes past events missing on Vercel). Achievements "Events attended" now counts check-ins.
- `/api/seed` no longer overwrites events: `GET` only reports missing club events, `POST` (admin only) adds just the missing ones.

### Fixed
- **Bookmark icon opened the event instead of saving it** — the button was inside the clickable card (a button inside a button). It now sits outside the card's click area.
- Long titles no longer push cards off the screen on phones (grid columns can shrink).

---

## [0.6.6] - 2026-10-18

### Changed
- **Leaderboard ranks everyone by achievement points**, not only people with approved stamps. Two tabs:
  - **Attendees** (officers included): 10 per approved stamp, +5 for a workshop, 15 per event check-in, 20 per badge (badge points only in the *All events* view).
  - **Officers**: 5 per stamp approved, 5 per attendee checked in, 20 per task completed, 25 per event volunteered for.
  - Each row shows the person's stats; *How points work* explains the scoring; "You're #N of M with X points" for the signed-in user. The podium only shows people with points; the list shows everyone (0 included). Event filter now lists all events.
- **Your standing and My badges moved to the Achievements page** (`MyStandingCard`): rank and points as an attendee, plus as an officer for officers, and the five badges.

---

## [0.6.5] - 2026-10-16

### Added
- **🎯 Approve stamps from the Check-in Scanner**: after scanning a pass, every stamp session of the event is listed with **Approve stamp** (sessions happening now first, marked *Now*; requested ones marked *Requested*). Works whether or not the attendee requested the stamp, updates the passport progress immediately, and notifies the attendee.
- **📜 Certificate verification page** (`/#/verify` and `/#/verify/:id`, public): look up a certificate ID or scan the new **"Scan to verify" QR code** printed on certificates. Shows *Verified*, *No longer valid* (check-in undone) or *Not found*, with only the details printed on the certificate. The pass and event page link to it next to the certificate ID. API: `GET /api/registrations?action=verify&certificateId=`.
- **🏆 Builder Leaderboard & achievement badges** (`/leaderboard`, sidebar + Achievements page): ranking by approved stamps and completed workshops per event or across all events, top-3 podium, *Your standing*, and five badges — First Stamp, Workshop Warrior, Cloud Explorer, Full Passport Complete, Multi-Event Builder.
- **🖼️ Persistent Event Picture Storage & Recent Uploads Database**:
  - Implemented persistent client-side file storage using IndexedDB (`uploadStorageService.ts`) and a serverless DynamoDB endpoint (`/api/uploads`) for all uploaded event pictures, banners, and speaker photos.
  - Added the **Recent Uploads Shelf (`RecentUploadsShelf`)** component in both `EventBuilderPage` and `EventDetailPage`: automatically displays the recent uploads on load with a prominent **"⭐ Recent Upload"** badge, thumbnail previews, file sizes, upload timestamps, 1-click **"Use as Banner"** application, full-screen lightbox preview, and delete controls.
  - Zero-friction upload fallback: if AWS S3 is offline or credentials are not yet set up in local development, pictures are stored directly in local IndexedDB file storage and registered in the database without failing.
- **📅 Synchronized Seed Events & Participant Estimates**:
  - Synchronized all 7 past and upcoming events in both `src/services/seedData.ts` and `api/seed.ts` with accurate expected and estimated participant numbers:
    - *Tech Barangay: AWS x WordPress x Notion* (130 est)
    - *Cloud Watch: Demo Day x Spider-Man: Brand New Day* (30 est)
    - *AWS Student Community Day Mega Manila 2026* (380 est)
    - *Organization Fair 2026* (200 est)
    - *Mini-Org Fair* (100+ expected)
    - *AWS Launchpad: Intro to Cloud and AWS Ecosystem* (170 pax expected)
    - *AWS Launchpad: Core Services* (20 pax)

### Changed
- **🚫 Removed static placeholder images**: Removed hardcoded static asset paths, pre-seeded sample uploads, and Unsplash stock photos across `seedData.ts`, `uploadStorageService.ts`, `EventsPage.tsx`, `EventDetailPage.tsx`, `SessionCard.tsx`, and `EventStampCard.tsx`. Events and sessions without cloud-uploaded pictures now cleanly render a branded **"No image"** placeholder instead of fake static pictures.

### Notes
- **Nothing new to install**: these features use packages already added in v0.6.0 (`qrcode` is now also used on the server for the certificate QR). Run `npm install` only if you haven't since v0.6.0.
- Certificates issued before this version have no QR code; their IDs still verify on the page.

---

## [0.6.2] - 2026-10-16

### Added
- **Local admin authentication auto-sync**: `authService.ts` now automatically injects and syncs the built-in admin account (`awsapc.admin` / `aws.apcofficial@gmail.com`) into browser `localStorage` whenever `VITE_LOCAL_ADMIN_PASSWORD` is configured in `.env.local` or `.env`. Prevents stale local caches from blocking sign-in.
- **Automated commit-msg Git hook**: local hook to ensure commit messages remain clean without unintended co-author lines.

### Changed
- **Environment variables security**: updated `.gitignore` to explicitly ignore `.env` and `.env.*` to prevent secrets from ever being tracked in Git, with safe dummy templates maintained in `.env.example`.
- **Roadmap & feature backlog**: recorded official AWS sender email migration (Amazon SES) as a pending work item in `ROADMAP.md` for instant automated notification delivery (account approvals, decline reasons, event assignments, and daily cron reminders).
- **Repository hygiene**: removed temporary screenshot artifacts and cleaned git history so all commits are solely attributed to the repository owner.

---

## [0.6.1] - 2026-10-16

### Documentation
- **README**: new *What to install on your computer* (Node.js, Git, optional Vercel CLI), a table of every npm package and the version it was added in (v0.6.0 adds `qrcode`, `jsqr`, `pdf-lib`), first-time setup with `.env.local`, *Updating an existing copy* (`git pull` → `npm install`), *What works locally vs. deployed*, and a deployed-app **setup checklist** (Vercel variables, IAM policy including the new `certificates/*` S3 access, Gmail App Password on the right account, S3 CORS, cron, end-to-end test).
- **`.env.example`**: lists `AWS_S3_BUCKET_NAME`, `ADMIN_PASSWORD`, `CRON_SECRET` and `APP_URL`.
- **ARCHITECTURE**: diagram includes the pass, scanner and notification pages, in-app notification table, QR check-in & certificate sequence diagram, `Notification` entity and new registration fields, updated roles.
- **DECISIONS**: ADR-012 (Gmail SMTP + self-contained API functions), ADR-013 (in-app notifications), ADR-014 (QR pass, camera check-in, PDF certificates).

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
