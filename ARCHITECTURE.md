# AWS SBG-APC Event Tracker — System Architecture 📐

This document describes the architectural layout, data flow, component hierarchies, and design principles of the **AWS SBG-APC Event Tracker** application.

---

## 🏗️ High-Level System Architecture

```mermaid
graph TD
    User["📱💻 User (Attendee / Officer / Admin)"] --> Layout["AppLayout (Sidebar on laptops, Bottom Nav on phones)"]
    
    subgraph Presentation Layer
        Layout --> Dashboard["DashboardPage"]
        Layout --> Flow["EventFlowPage"]
        Layout --> Profile["ProfilePage"]
        Layout --> OfficerDash["OfficerDashboardPage"]
        OfficerDash --> Scanner["OfficerScanPage (camera QR check-in)"]
        Layout --> Pass["EventPassPage (QR pass, calendar, certificate)"]
        Layout --> Notifs["NotificationsPage (bell inbox)"]
        Layout --> Leader["LeaderboardPage (admin monitoring)"]
        Layout --> PersonPage["PersonProfilePage (/people/:id)"]
        AdminHome --> Tracker["ContentTracker (Marketing pubmats)"]
        Public["VerifyCertificatePage (public /verify/:id)"]
        Layout --> AdminHome["AdminHome (admin /home)"]
        AdminHome --> AdminDash["AdminDashboardPage (Manage Accounts)"]
        AdminHome --> AdminAtt["AdminAttendeesPage (Attendees & Stamps, Excel)"]
        AdminHome --> AdminOff["AdminOfficersPage (Officers, Archive)"]
        AdminHome --> AdminTasks["AdminTasksPage (Officer Tasks)"]
        Layout --> Builder["EventBuilderPage"]

        Dashboard --> StampCard["EventStampCard (Circle Stamp Passport)"]
        Flow --> StampCard
        Profile --> QRCard["NetworkingCard (Inline QR Code)"]
        Profile --> AvatarAdjuster["AvatarImageAdjuster (Circular Crop)"]
        Builder --> BannerAdjuster["ImageBannerAdjuster (16:9 Frame)"]
        Builder --> AvatarAdjuster
        Builder --> UploadShelf["RecentUploadsShelf (Recent Uploads Storage)"]
    end

    subgraph State Management Layer
        AuthCtx["AuthContext (User Session & Role)"]
        EventCtx["EventContext (Active Event Selection)"]
    end

    subgraph Client Service Layer
        AuthSvc["authService.ts"]
        EventSvc["eventService.ts"]
        SessionSvc["sessionService.ts"]
        StorageSvc["storageService.ts"]
        UploadStorageSvc["uploadStorageService.ts"]
        RegSvc["registrationService.ts"]
        TaskSvc["taskService.ts"]
        NotifySvc["notifyService.ts (emails)"]
        InAppSvc["notificationService.ts (bell)"]
        IDBStore[("Browser IndexedDB (Persistent File Storage)")]
        LocalStore[("Browser LocalStorage (Fallback)")]
    end

    subgraph Serverless API & AWS Cloud
        VercelAPI["Vercel Serverless Functions (/api/*)"]
        DynamoDB[("Amazon DynamoDB (single table: users, events, sessions, stamps, registrations, tasks, speakers, notifications, uploads)")]
        S3Bucket[("Amazon S3 (banners, avatars, certificate PDFs)")]
        SES[("Gmail SMTP / Amazon SES (Emails)")]
        Cron["Vercel Cron (daily 8:00 AM Manila)"]
    end

    Dashboard -.-> AuthCtx
    Dashboard -.-> EventCtx
    OfficerDash -.-> SessionSvc
    StampCard -.-> SessionSvc
    BannerAdjuster -.-> StorageSvc
    AvatarAdjuster -.-> StorageSvc

    EventSvc --> VercelAPI
    SessionSvc --> VercelAPI
    StorageSvc --> VercelAPI
    EventSvc -.-> LocalStore
    SessionSvc -.-> LocalStore
    AuthSvc --> VercelAPI
    AuthSvc -.-> LocalStore
    RegSvc --> VercelAPI
    TaskSvc --> VercelAPI
    NotifySvc --> VercelAPI
    InAppSvc --> VercelAPI
    InAppSvc -.-> LocalStore
    Scanner -.-> RegSvc
    Pass -.-> RegSvc
    Notifs -.-> InAppSvc
    Scanner -.-> SessionSvc
    Leader -.-> SessionSvc
    Public -.-> RegSvc
    AdminAtt -.-> RegSvc
    AdminTasks -.-> TaskSvc
    Cron --> VercelAPI
    VercelAPI --> SES

    VercelAPI --> DynamoDB
    VercelAPI -. Pre-signed URLs .-> S3Bucket
```

---

## 🧩 Architectural Layers

### 1. Presentation & Component Layer
- **`AppLayout.tsx`**: Main structural layout wrapper implementing:
  - Sticky mobile `AppBar` (`position="sticky"`, `borderRadius: 0`) with title truncation.
  - Inline collapsible menu (`Collapse`) for mobile navigation without backdrop overlays.
  - Laptop permanent sidebar `Drawer` from the `md` breakpoint (768px; set in `theme.ts`).
  - Fixed `BottomNav` bar on phones (below 768px).
  - Page content centered with `maxWidth: 1280`.
- **Admin pages** (`AdminHome`, `AdminDashboardPage`, `AdminAttendeesPage`, `AdminOfficersPage`, `AdminTasksPage`) share `AdminUi.tsx` (header with back link, stat tiles, empty states, date formatting).
- **`EventStampCard.tsx`**: Self-contained component that computes event session stamp slots dynamically:
  - Reads active event sessions and attendee stamp status.
  - Renders grid of circular slots representing each workshop/session.
  - Handles one-tap stamp requests and displays approval state transitions (`approved`, `pending`, `unclaimed`).
- **`ImageBannerAdjuster.tsx`**: 16:9 interactive banner frame editor with zoom, pan, and 1280×720 export matching preview.
- **`AvatarImageAdjuster.tsx`**: Circular avatar cropper with circular mask preview and pan/zoom controls for attendees and speakers.
- **`NetworkingCard.tsx`**: Inline, non-overlay profile card generating external QR code images using QR Server API.

### 2. State Management Layer
- **`AuthContext.tsx`**:
  - Manages active user session (`User | null`).
  - Handles `login`, `logout` and `setCurrentUser` (after profile changes).
  - Persists the signed-in user in `localStorage` under `aws-event-tracker.user` and refreshes it from the server on startup (so role changes and approvals apply).
- **`EventContext.tsx`**:
  - Maintains currently selected active event (`AppEvent | null`).
  - Persists event context in `localStorage` under `aws-event-tracker.selectedEvent` and refreshes it on startup.

### 3. Service, Serverless & Cloud Storage Layer
- **`sessionService.ts`**: Handles session lookup, stamp creation (`createStamp`), stamp approvals (`approveStamp`), and declines (`declineStamp`). Connects to `/api/stamps` and `/api/sessions` with local fallback.
- **`eventService.ts`**: Handles event CRUD operations, connecting to `/api/events` with local fallback.
- **`storageService.ts`**: Requests S3 pre-signed upload URLs from `/api/upload-url` and streams cropped images directly to Amazon S3.
- **`api/` (Vercel Functions)**: Self-contained serverless microservices connecting to AWS SDK v3 DynamoDB client (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`) and S3 client (`@aws-sdk/client-s3`).
- **`authService.ts`**: Sign up, sign in, approval (`approveUser` / `rejectUser`), profile and role updates and password changes through `/api/users` (scrypt-hashed passwords), with a `localStorage` fallback.
- **`notifyService.ts` → `/api/notify`**: Email notifications through Amazon SES (account approved/declined, event assignment, new task) and a daily Vercel Cron job (8:00 AM Manila) for event and task reminders.
- **`registrationService.ts` / `taskService.ts` / `speakerService.ts`**: Registrations and check-in, officer tasks, and the speaker directory through `/api/registrations`, `/api/tasks` and `/api/speakers`, with `localStorage` fallback (`apiClient.ts`).
- **`seedData.ts`**: Initial events/sessions used by the local fallback.
- **`notificationService.ts` → `/api/notifications`**: In-app inbox (`entityType = 'notification'`: `personId`, `kind`, `title`, `message`, `link`, `read`). Created by the page that performed the action (stamp review, account review, assignment, task, check-in, sign-up → every admin via `toRole: 'admin'`). The bell badge (`useUnreadNotifications`) refreshes on changes, window focus and every 30 s.
- **Check-in & certificates (`/api/registrations?action=checkin|checkout|certificate`)**: the QR pass encodes `…/#/officer/scan?pass=<registrationId>`. Check-in requires an admin `actorId`, or an officer listed in the event's `checkinOfficerIds`, sets `checkedIn/checkedInAt/checkedInBy`, and reserves a unique certificate code (checked against existing codes). **The certificate unlocks only after the event's `endAt`, and only for checked-in registrations**: `GET ?action=certificate&id=&personId=` (owner / check-in staff) or `&certificateId=<code>` (anyone with the link), `&download=1` for an attachment instead of inline. The first open after the event dates it to the event's end and stores the PDF (`pdf-lib` → `s3://$AWS_S3_BUCKET_NAME/certificates/<eventId>/<code>.pdf`), served through a 10-minute signed link; with no bucket, or if the upload fails, the PDF is generated on the fly. `action=verify` returns `valid`, `not-yet`, `revoked` or `not-found`. The daily run posts a "certificate ready" bell notice and email to everyone checked in, once per event, for events that ended in the last week.
- **`utils/calendar.ts`**: RFC 5545 `.ics` builder (UTC times, escaping, line folding, 1-hour alarm) and Google Calendar `TEMPLATE` links with `ctz=Asia/Manila`.

### 4. Notifications — email (Gmail SMTP / Amazon SES) and in-app

Emails go through Gmail SMTP when `GMAIL_USER` + `GMAIL_APP_PASSWORD` are set, otherwise Amazon SES. In-app notifications (the bell) are written by the page that performed the action:

| In-app notification | Recipient | Created by |
| :--- | :--- | :--- |
| New sign-up waiting | Every admin (`toRole: 'admin'`) | Sign-up page |
| Account approved / declined (with reason) | The person | Manage Accounts |
| Assigned to an event | That officer | Event page (admin) |
| New task | Assigned officers | Officer Tasks |
| Stamp approved / declined | The attendee | Officer Dashboard |
| Checked in (certificate ready) | The attendee | Event Desk |

Emails:
| Trigger | Recipients | Sent by |
| :--- | :--- | :--- |
| New sign-up waiting | Admin inbox (`ADMIN_NOTIFY_EMAIL`, default `aws.apcofficial@gmail.com`) | Sign-up page → `/api/notify` |
| Account approved / declined (with reason) | The person | Manage Accounts → `/api/notify` |
| Officer assigned to an event | That officer (APC + personal email) | Event page → `/api/notify` |
| New task | Assigned officers | Officer Tasks → `/api/notify` |
| Event tomorrow / "See you today" | Registered attendees + assigned officers | Daily Vercel Cron → `/api/notify` |
| Task due tomorrow | Assigned officers | Daily Vercel Cron |
| Failed reminders / daily job error | Admin inbox | Daily Vercel Cron |

Each reminder is sent once (flags stored on the event/task); moving an event's date re-arms its reminders. Without Gmail or `SES_FROM_EMAIL` settings, no email is sent and the app says so (in-app notifications still work).

### 5. QR check-in & certificates

```mermaid
sequenceDiagram
    participant A as Attendee (My Event Pass)
    participant O as Officer (Event Desk)
    participant API as /api/registrations
    participant DB as DynamoDB
    participant S3 as Amazon S3
    A->>A: QR = …/#/officer/scan?pass=<registrationId>
    O->>O: Camera reads QR (jsQR)
    O->>API: GET ?id=<registrationId> (+ person, stamps)
    O->>API: POST ?action=checkin {id, actorId}
    API->>DB: verify actor is admin or on the event's check-in staff, set checkedIn
    API->>S3: put certificates/<eventId>/<certificateId>.pdf (pdf-lib)
    API-->>O: registration (+ certificateId)
    A->>API: GET ?action=certificate&id&personId
    API-->>A: 302 to 10-minute signed S3 link (or PDF built on the fly)
```

- **Event staff (who may do what)**: each event stores `officerIds` + `officerRoles` and two duty lists, `stampOfficerIds` and `checkinOfficerIds`. Only an admin changes them, through `PUT /api/events?id=…&action=staff`; ordinary event edits keep the lists and prune anyone no longer assigned. `/api/stamps` (approve / decline) and `/api/registrations` (check-in / undo / opening someone else's certificate) look up the actor and allow admins, or officers on the matching list for **that** event. New stamps are always `pending`; a plain registration `PUT` can't set `checkedIn`. The client mirrors the rule in `utils/eventStaff.ts` (`canDo`) to hide what an officer can't do.
- **Event Desk** (`OfficerScanPage` + `StampRequestsPanel` + `EventAttendeesPanel`): for the selected event it loads registrations, sessions and that event's stamps, refreshing every 20 s; the sidebar badge comes from `useDeskCounts` (pending stamps at events where the user may approve). `PUT /api/stamps` only approves when the attendee has a checked-in registration for the session's event (`409 NOT_CHECKED_IN` otherwise), so *Check in & approve* calls check-in first, then approve.
- **Registrations**: `rsvp` is the status — `pending` (new), `approved`, `declined`; older `going`/`interested` are read as approved/pending. Only admins and the event's check-in team change it (`PUT ?id=` with `actorId`, or `POST ?action=review` in bulk); check-in sets `approved`; `DELETE` refuses checked-in registrations.
- **Sessions**: `POST/PUT/DELETE /api/sessions` require an admin `actorId` and keep only session fields; the event page's **SessionEditor** uses them.
- **Pictures**: `/api/upload-url` returns `/api/uploads?action=image&key=events/…`, which redirects to a 1-hour signed S3 link (works with a private bucket). `utils/imageUrl.ts` rewrites older public S3 links the same way when events, speakers and people are loaded.
- **App tour** (`TutorialTour`, `utils/tourSteps.ts`): steps per role point at elements marked `data-tour="…"`; the first visible one is highlighted (sidebar or bottom bar). Finishing or skipping sets `tutorialSeen` on the account.
- **Session picks**: `registration.sessionIds` holds the sessions a registered attendee plans to attend; only they can change it (`PUT /api/registrations?id=` with their `personId`), and the server keeps only that event's sessions. `useSessionPicks` turns an event's registrations into per-session "going" counts (people who declined are skipped). The event's `participants` stays the single expected number for the whole event; events may have no sessions.
- **Stamps at the booth**: the scanner lists the event's stamp sessions (live ones first). *Approve stamp* reuses `sessionService` — it creates the stamp if the attendee never requested it, then approves it with the officer's id — and notifies the attendee.
- **Verification**: every certificate carries a QR code to `…/#/verify/<certificateId>` (built from `APP_URL` or the request host). `GET /api/registrations?action=verify&certificateId=` is public and returns only what is printed on the certificate (name, event, dates, venue, issue date) plus `valid` / `revoked` / `not-found`.
- **Accounts**: passwords need 6+ characters with upper, lower, number and symbol (`utils/people.ts` `PASSWORD_RULES`, mirrored in `api/users.ts`). `POST /api/users?action=create` (admin) makes an approved account with `mustChangePassword: true`; `action=reset` (admin) sets a new temporary password; `action=password` clears the flag. `ProtectedRoute` sends flagged accounts to `/change-password`. `savedEventIds` is a profile field the owner can edit. **Connections** are mutual and change only through `POST /api/users?action=connect|connect-respond|connect-cancel|disconnect` (`{ actorId, id, accept? }`): a request is stored as `connectionRequests` on the receiver and `sentConnectionRequests` on the sender; approving links both `connections` lists; a request crossing an existing one connects right away. The client (`connectionAction`, `components/ConnectButton.tsx`) sends `connection-request` / `connection-accepted` notifications. **Socials** (`socials`: linkedIn, github, twitterX, website, facebook, instagram, tiktok, youtube, `custom[]` of `{label,url}`, max 10) are cleaned by `cleanSocials()` in `api/users.ts` (no `javascript:`/`data:` links, 300-char cap); `utils/socials.tsx` lists the platforms for `SocialLinksEditor` / `SocialLinksRow`. **Speakers** may carry `personId` (linked account), `email` (auto-links when an account with it exists) and `socials`; `getSpeakersByIds()` adds the account's live `profile` (name, photo, socials, officer title) and `components/SpeakerItem.tsx` shows it. `api/seed.ts` also reports built-in Tech Barangay sessions attached to another event and moves them (`?action=fix-sessions`). **Adviser** (`role: 'adviser'`, admin-created): `components/AdviserHome.tsx` at `/home`; announcements (`entityType: 'announcement'`) and sign-off requests (`entityType: 'signoff'`, pending → approved / returned) live behind `?action=` routes in `api/notifications.ts` (`services/adviserService.ts`, components `AnnouncementsCard`, `SignoffPanel`); admin-only APIs keep rejecting the adviser. **Task comments** (`comments[]`, `POST /api/tasks?action=comment`, admins + assignees) and `deadlineInfo()` in `types/task.ts`; the daily job (`runReminders` in `api/notify.ts`) posts bell notices + emails for tasks due tomorrow and overdue ones every 3 days (`dueReminderSentAt`, `overdueReminderAt`), and runs the in-app part even without email. **Co-organizer staff**: attendee accounts with `partnerOrg` (admin-only field, cleared if the role changes); `utils/eventStaff.ts` `canDo()` / `isPartnerStaff()` / `mayWorkEvents()` and the server checks in `api/stamps.ts` (`stampApprover`) and `api/registrations.ts` (`requireCheckinStaff`) accept them when they're on the event's duty lists. Events carry `coOrganizers` (≤ 5 names, cleaned in `pruneStaff`). **Officer-added tasks**: `POST /api/tasks?action=propose` (officer → `approval: 'pending'`, assigned to themselves) and `action=review` (admin → approved/declined + `reviewNote`); `PUT` refuses status changes while not approved; `isApprovedTask()` keeps unapproved tasks out of the leaderboard and badges. **Event Desk counts** (`hooks/useDeskCounts.ts`) are per event over non-cancelled events the user can stamp, refreshed on a `DESK_CHANGED` window event fired after desk actions. **Profile edits** (`PUT /api/users`) accept first/middle/last name (display name recomputed), student ID (APC) or organization (outside), personal email, bio. Stamp passports (`EventStampCard` with an `event` prop and `hideWhenEmpty`) render on the Dashboard and event page for live/upcoming registered events with stamps; Achievements shows only completed items and certificates.
- **Tasks & pubmats** (`api/tasks.ts`): tasks carry `committee`, `subcommittee` and a deadline; `kind: 'pubmat'` items carry a `pubmat` object (designee / caption writer / poster ids, stage, post date, http(s) file link, notes) and appear in the Marketing **Content Tracker**. `assigneeIds` is everyone on the pubmat so the Officer Dashboard, notifications and the daily due reminders work unchanged.
- **Events**: `eventService` applies `liveStatus()` (`utils/eventStatus.ts`) so ended events are *accomplished* (Past) and running ones *ongoing*, regardless of the stored status. `GET /api/seed` lists built-in club events missing from DynamoDB; `POST /api/seed` (admin) adds only those.
- **Leaderboard** (`utils/leaderboard.ts`, `utils/badges.ts`, data from `useBoardData`): two boards ranked by achievement points, listing everyone with an approved account (0 points included; admins excluded). *Attendees* (all non-admins, so officers appear too): 10 per approved stamp (one per person and session), +5 for workshops (session `type: 'workshop'`), 15 per check-in, 20 per badge. *Officers*: 5 per stamp approved (`approvedBy`), 5 per check-in done (`checkedInBy`), 20 per completed task, 25 per event volunteered (`officerIds`), 20 per officer badge (`utils/officerBadges.ts`: automatic ones from that work, *Event Host* from `officerRoles = host`, *Content Creator* from a posted pubmat, plus admin-awarded ones stored in `user.awards` via `POST /api/users?action=award|unaward`). Equal points share a rank. With an event filter only that event counts and badge points are left out; badges are always computed from all events. The leaderboard is admin-only; attendees and officers see their own stats and badges on the Achievements page (`MyStandingCard`).

---

## 🎨 Responsive & "No-Overlays" Design Principles

1. **Inline Flow over Modal Popups**:
   - Replaced `<Dialog>` and full-screen backdrop modals with inline `<Card>` and `<Collapse>` elements.
   - Eliminates z-index conflicts, focus-trap bugs, and dark backdrop screens on mobile devices.

2. **Edge-to-Edge Header & Bottom Bar**:
   - Navigation header uses `position="sticky"` with `borderRadius: 0` to prevent floating card overlays.
   - Bottom navigation bar (`BottomNav`) is fixed at `bottom: 0` with `zIndex: 1200` and padded content offset (`pb: 10`).

3. **Responsive Layouts (phone & laptop)**:
   - Breakpoints (`theme.ts`): `sm` 600, `md` 768 (sidebar layout), `lg` 1100, `xl` 1536.
   - Phones: one column. Laptops: CSS grids with 2–3 columns (event picker, admin lists), side-by-side sections (Profile, Connect, Officer Dashboard, Officer Tasks), and a two-column Welcome page.

---

## 🗄️ Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    AppEvent ||--|{ Session : contains
    AppEvent ||--|{ Registration : tracks
    User ||--|| Person : maps_to
    Person ||--|{ Registration : registers
    Person ||--|{ Stamp : requests
    Session ||--|{ Stamp : awards

    AppEvent {
        string id PK
        string title
        string category
        string status
        string startAt
        string endAt
        int participants
        list officerIds
        map officerRoles
        list stampOfficerIds
        list checkinOfficerIds
    }

    Session {
        string id PK
        string eventId FK
        string title
        string room
        boolean requiresStamp
    }

    Stamp {
        string id PK
        string sessionId FK
        string attendeeId FK
        string approvedBy FK
        string status
    }

    User {
        string personId PK
        string email
        string role
        string status
        string signupType
        boolean mustChangePassword
        string subcommittee
        list connections
        list savedEventIds
        list awards
        string memberType
        string studentId
        string organization
        string officerPosition
        string committee
    }

    OfficerTask {
        string id PK
        string title
        string eventId FK
        string status
        string dueAt
        string committee
        string subcommittee
        string kind
        map pubmat
    }

    Registration {
        string id PK
        string eventId FK
        string personId FK
        string rsvp
        list sessionIds
        boolean checkedIn
        string checkedInAt
        string checkedInBy FK
        string certificateId
        string certificateKey
    }

    Notification {
        string id PK
        string personId FK
        string kind
        string title
        string link
        boolean read
        string createdAt
    }

    Speaker {
        string id PK
        string name
        string avatarUrl
    }

    User ||--o{ OfficerTask : "assigned to"
    User ||--o{ Notification : receives
    AppEvent ||--o{ Speaker : features
    AppEvent ||--o{ User : "officers assigned" 
```

---

## 🔒 Security & Access Control (RBAC)

| Role | Permissions |
| :--- | :--- |
| **public (signed out)** | Welcome, sign-in, sign-up, and **certificate verification** (`/verify/:id`). |
| **any signed-in account with a temporary password** | Only **Set your own password** (`/change-password`) until it's changed. |
| **`attendee`** | View schedule, request stamps, edit personal bio/socials, view own stamp card, show the QR event pass, add events to a calendar, download own certificate after check-in, read own notifications, view the **leaderboard** and own badges. |
| **`officer`** | All attendee privileges + `OfficerDashboardPage`: see and complete assigned tasks, approve/decline stamp requests and check attendees in (in the **Event Desk**, `/officer/scan` — stamps only after check-in) **only at events where an admin put them on the staff list for that duty**, update their **Content Tracker** items (status, file link, notes). |
| **`admin`** | All officer privileges + approve/decline sign-ups (optional reason), change roles and delete accounts (`/admin`), monitor attendees and stamp finishers with Excel export (`/admin/attendees`), officer achievements, archive batches (`/admin/officers`), assign officer tasks (`/admin/tasks`), edit events, assign officers and set the **event staff list** (who can approve stamps / check in), **award officer badges**, send reminders. |

The built-in admin is `awsapc.admin` (password from `ADMIN_PASSWORD`). There are no demo accounts. Admin actions — and check-ins (`/api/registrations?action=checkin`, officer or admin) — are checked on the server against the acting account's role; the app does not yet use signed sessions (see ADR-008). A certificate can only be downloaded by its owner or by an officer/admin.

New accounts have `status: 'pending'` and cannot sign in until an admin approves them. Officer hierarchy: President → VP Internal → VP External → Directors → Assistant Directors → Associates; committees: Secretariat, Operations, Marketing, Technicals, Relations.

---

*Last Updated: October 2026*
