# AWS SBG-APC Event Tracker ☁️📱

**AWS SBG-APC Event Tracker** is a web application for the **AWS Student Builder Group – Asia Pacific College** that works on phones and laptops. It is the companion app for attendees, officers and admins during cloud events, workshops and meetups: sign-ups with admin approval, event registration and check-in, session stamps, officer tasks, and email notifications.

---

## 🌟 Key Features

### 👤 Attendee Experience
- **Official Event Stamp Passport (`EventStampCard`)**:
  - Automatically generates circular stamp slots for every session requiring activity completion in the selected event.
  - Visual status indicators:
    - 🟢 **STAMP APPROVED**: Emerald gradient badge seal with officer verification.
    - 🟠 **PENDING OFFICER APPROVAL**: Amber pulsing indicator awaiting review.
    - ⚪ **UNCLAIMED**: Dashed star slot with one-tap "Request Stamp" functionality.
  - Progress tracking with a completion bar and "PASSPORT COMPLETED 🎉" status badge.
- **Event Flow & Real-Time Schedule**: View time-grouped sessions with room locations, speaker profiles, and activity requirements.
- **Inline Networking QR Card (`NetworkingCard`)**: Generate a scannable QR code linking to your LinkedIn/social profiles without dark modal overlays.
- **My Registrations**: Manage event RSVPs (`going`, `interested`, `declined`) and view upcoming events.
- **🎟️ Digital Event Pass (`/pass`)**: a personal QR code for each registered event. It turns green the moment an officer scans it.
- **📅 Add to Calendar**: one tap on the event page or pass — **Google Calendar** link, or an **.ics** file for Apple Calendar / Outlook — with Manila time, venue, the session schedule and a 1-hour reminder.
- **🏅 Certificate of Participation**: unlocked at check-in; a PDF with the attendee's name, event, date, venue and a certificate ID, downloaded from the pass or event page.

### ✍️ Sign Up & Accounts
- **Three sign-up types**: APC Student (APC email + student ID), Outside Attendee (any email + school/organization, no student ID) and Officer (APC email, optional personal Gmail, student ID, position and committee).
- **Name format**: First Name, M.I. (optional), Last Name — shown as "Juan D. Dela Cruz".
- **Admin approval for everyone**: new accounts are *pending* and can't sign in until an admin approves them. A declined person sees the reason (if given) and can sign up again with the same email.
- **Email sign-in** (no Google sign-in), **Change password** on the Profile page, and profile photo, bio and social links saved to the account.
- **Officer hierarchy**: President → VP Internal → VP External → Directors → Assistant Directors → Associates; committees: Secretariat, Operations, Marketing, Technicals, Relations.

### 🛡️ Officer & Admin Capabilities
- **Admin Dashboard** (`/home` for admins): Manage Accounts, Edit Events, Attendees & Achievements, Officers, Officer Tasks, and **Send reminders now**.
- **Manage Accounts (`AdminDashboardPage`)**: approve or decline sign-ups (optional reason with quick picks), change roles, search, and delete accounts.
- **Attendees & Achievements (`AdminAttendeesPage`)**: per-event attendee list with check-in, stamp finishers per session, people who finished every session, and **Excel (.xlsx) downloads** for profs.
- **Officers (`AdminOfficersPage`)**: officers in hierarchy order with events volunteered (and their event role), stamps approved and task progress; edit position/committee; **archive** one officer or the whole school-year batch (they become alumni attendees, listed under *Past batches*); delete; Excel download.
- **Officer Tasks (`AdminTasksPage`)**: assign tasks (optional event and due date) to one or more officers.
- **Officer Dashboard (`OfficerDashboardPage`)**: the officer's tasks (Start / Mark done / Reopen), the stamp approval queue, and **Open scanner**.
- **Check-in Scanner (`/officer/scan`, officers and admins)**: scans an attendee's QR pass with the phone or laptop camera, shows their name, affiliation and stamp passport, and checks them in with **one tap** (which also issues their certificate). A *"Can't scan? Find the attendee"* search works without a camera. Re-scanning says who already checked them in.
- **Assign officers to events** on the event page (admins only), listed in hierarchy order.

### 🔔 Notifications
- **In-app notification center with a bell badge** (unread count in the phone top bar and the laptop sidebar, refreshed every 30 s): stamp approved/declined, account approved/declined, assigned to an event, new task, checked in, and — for admins — new sign-ups waiting. Tap one to open the related page; *Mark all as read* and remove. Events you registered for that are live or start within 24 hours are pinned on top.
- **Emails** through **Gmail SMTP** (`GMAIL_USER` + `GMAIL_APP_PASSWORD`) or **Amazon SES** for account approved/declined, event assignment and new tasks, plus a **daily 8:00 AM (Manila)** job for "event tomorrow", "see you today" and "task due tomorrow".
- The admin inbox (`aws.apcofficial@gmail.com`) is alerted about new sign-ups and failed emails.

### 🎨 Cloud Media & Interactive Image Adjusters
- **16:9 Banner Image Adjuster (`ImageBannerAdjuster`)**: Interactive frame cropper with 1×–3× zoom, drag positioning, and direct export/upload of 1280×720 banners.
- **Circular Avatar Image Adjuster (`AvatarImageAdjuster`)**: Circular mask cropper for attendee profile pictures and event speaker headshots with direct S3 pre-signed upload.
- **Direct-to-S3 Cloud Pipeline**: Client-side canvas export uploaded directly to Amazon S3 via secure pre-signed URLs (`/api/upload-url`).

### 📱💻 Phone & Laptop Layouts, Overlay-Free UX
- **Phones (< 768px)**: single-column pages, sticky top bar and a thumb-friendly **bottom navigation bar** (`BottomNav`).
- **Laptops (≥ 768px)**: a permanent **sidebar**, and pages that use the width — two-column Welcome, 2–3 column event picker, side-by-side Profile/Connect/Officer Dashboard sections, two-column admin lists, and the task form beside the task list. Content is centered with a max width of 1280px on large screens.
- **No Overlays**: inline expandable cards and confirmations instead of screen-obscuring dialogs.

---

## 🔐 Admin Account

There are no demo accounts. The app has one built-in admin, **`awsapc.admin`** (email `aws.apcofficial@gmail.com`; you can sign in with either):

- **Deployed (Vercel):** set `ADMIN_PASSWORD` in Vercel → Settings → Environment Variables before the first sign-in. The account is created with that password the first time the database has no accounts. Change it any time on **Profile → Change password**.
- **Local (`npm run dev`):** create a `.env.local` file (not committed) with `VITE_LOCAL_ADMIN_PASSWORD=your-password`, then restart `npm run dev`.

Everyone else signs up and waits for the admin to approve them.

## ✉️ Email Notifications (Gmail or Amazon SES)

When `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set, emails go through Gmail SMTP (Nodemailer); otherwise through Amazon SES. The Google **App Password must be created while signed in to the same account as `GMAIL_USER`** (that account needs 2-Step Verification), or Gmail rejects the login with error 535. In-app notifications work either way.

Emails are sent for: account approved / declined (with the reason), officer assigned to an event, new task, and every day at 8:00 AM (Manila) — event tomorrow, "see you today", and task due tomorrow. Officers get them on both their APC email and personal email. The admin inbox (`aws.apcofficial@gmail.com`) gets an email for every new sign-up waiting for approval, and a report if any reminder email fails or the daily job breaks.

Set these in Vercel → Settings → Environment Variables:

| Variable | Example | Notes |
| :--- | :--- | :--- |
| `GMAIL_USER` | `aws.apcofficial@gmail.com` | Gmail sender (preferred when set) |
| `GMAIL_APP_PASSWORD` | 16-character Google App Password | Created on the `GMAIL_USER` account |
| `SES_FROM_EMAIL` | `AWS SBG-APC <aws.apcofficial@gmail.com>` | SES sender (used when Gmail isn't set); must be verified in Amazon SES |
| `SES_REGION` | `ap-southeast-1` | Optional; defaults to `APP_AWS_REGION` |
| `APP_URL` | `https://your-app.vercel.app` | Optional; used for links in emails |
| `CRON_SECRET` | any long random string | Protects the daily reminder job (`vercel.json` → `crons`) |
| `ADMIN_NOTIFY_EMAIL` | `aws.apcofficial@gmail.com` | Optional; admin alerts (new sign-ups waiting, failed emails). This is the default |

The AWS access key also needs the `ses:SendEmail` permission. While SES is in sandbox mode it can only email verified addresses, so approval/decline emails to new users will fail (Manage Accounts shows a warning and the admin inbox gets a report). Request production access in the SES console (**Account dashboard → Request production access**) so every user can receive emails.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Material UI (MUI) v6
- **Routing**: React Router v6
- **Testing**: Vitest + React Testing Library
- **State Management**: React Context (`AuthContext`, `EventContext`) + LocalStorage Persistence
- **Backend**: Vercel Serverless Functions + AWS SDK v3 (Amazon DynamoDB, Amazon S3, Amazon SES), Vercel Cron for daily reminders
- **Excel export**: `write-excel-file` (loaded only when exporting)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

```bash
# Clone repository
git clone https://github.com/mochatakahashi/aws-event-tracker-app.git

# Navigate into project directory
cd aws-event-tracker-app

# Install dependencies
npm install

# Launch development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser and sign in as `awsapc.admin` (see Admin Account above).

> With `npm run dev` the `/api` functions don't run, so data stays in this browser and no emails or S3 uploads happen. Use your Vercel deployment (or `vercel dev`) to test the database, uploads and emails.

### Deploying (Vercel)

Set these in Vercel → Settings → Environment Variables, then redeploy:

| Variable | Purpose |
| :--- | :--- |
| `APP_AWS_ACCESS_KEY_ID`, `APP_AWS_SECRET_ACCESS_KEY` | IAM user keys (DynamoDB, S3 and `ses:SendEmail` access) |
| `APP_AWS_REGION` | AWS region, e.g. `ap-southeast-1` |
| `DYNAMODB_TABLE_NAME` | Table name (default `aws_events`) |
| `AWS_S3_BUCKET_NAME` | Bucket for banners, photos and certificates (`certificates/<eventId>/<certificateId>.pdf`). The IAM user needs `s3:PutObject` and `s3:GetObject`; the bucket can stay private (downloads use 10-minute signed links). Without it, certificates are generated on the fly instead of stored |
| `ADMIN_PASSWORD` | First password for `awsapc.admin` |
| `GMAIL_USER` + `GMAIL_APP_PASSWORD` or `SES_FROM_EMAIL`, and `CRON_SECRET` (+ optional `SES_REGION`, `APP_URL`, `ADMIN_NOTIFY_EMAIL`) | Email notifications — see above |

> The camera scanner needs the **https** app link (browsers only allow the camera on secure pages). On the deployed Vercel URL this works automatically.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with HMR |
| `npm run build` | Type-checks (`tsc -b`) and builds production bundle |
| `npm run preview` | Previews the production build locally |
| `npm test` | Runs the Vitest test suite once |
| `npm run test:watch` | Runs Vitest in watch mode |

---

## 📁 Project Structure

```
aws-event-tracker-app/
├── api/                   # Vercel Serverless Functions (AWS SDK v3)
│   ├── events.ts          # DynamoDB events CRUD
│   ├── sessions.ts        # DynamoDB sessions CRUD
│   ├── stamps.ts          # DynamoDB stamp requests & approvals
│   ├── users.ts           # Accounts: sign up, sign in (scrypt), approval, profiles
│   ├── registrations.ts   # Event registrations, QR check-in, certificate PDFs (pdf-lib → S3)
│   ├── notifications.ts   # In-app notification inbox (bell)
│   ├── tasks.ts           # Officer tasks assigned by admins
│   ├── speakers.ts        # Speaker directory (with photos)
│   ├── notify.ts          # Email notifications (Gmail SMTP / Amazon SES) + daily reminder cron
│   ├── upload-url.ts      # S3 pre-signed upload URL generator
│   └── seed.ts            # Batch database seeding endpoint
├── public/                # Static public assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── AddToCalendarButton.tsx # Google Calendar link / .ics download
│   │   ├── AdminHome.tsx           # Admin dashboard cards + "Send reminders now"
│   │   ├── AdminUi.tsx             # Shared admin header, stat tiles, date helpers
│   │   ├── AppLayout.tsx           # Layout: sidebar on laptops, bottom nav on phones
│   │   ├── AvatarImageAdjuster.tsx # Circular avatar cropper with S3 upload
│   │   ├── BottomNav.tsx           # Mobile bottom navigation bar
│   │   ├── CertificateButton.tsx   # Certificate download (unlocked at check-in)
│   │   ├── EventStampCard.tsx      # Automatic circle stamp passport card
│   │   ├── ImageBannerAdjuster.tsx # 16:9 banner frame adjuster with S3 upload
│   │   ├── NetworkingCard.tsx      # Inline modal-free QR card
│   │   ├── ProtectedRoute.tsx      # Auth route guard
│   │   ├── QrScanner.tsx           # Camera QR scanner (getUserMedia + jsQR)
│   │   ├── SessionCard.tsx         # Flow session card
│   │   └── StampBadge.tsx          # Circle badge indicator
│   ├── context/           # Global React Contexts
│   │   ├── AuthContext.tsx         # Auth state & localStorage persistence
│   │   └── EventContext.tsx        # Active event selection state
│   ├── pages/             # Page route views
│   │   ├── AdminDashboardPage.tsx   # Manage Accounts (approvals, decline reasons, roles, delete)
│   │   ├── AdminAttendeesPage.tsx   # Attendees, check-in, stamp finishers, Excel
│   │   ├── AdminOfficersPage.tsx    # Officer achievements, archive batches, past batches
│   │   ├── AdminTasksPage.tsx       # Assign officer tasks
│   │   ├── DashboardPage.tsx
│   │   ├── EventBuilderPage.tsx
│   │   ├── EventDetailPage.tsx
│   │   ├── EventFlowPage.tsx
│   │   ├── EventPassPage.tsx        # Attendee QR pass, calendar, certificate
│   │   ├── EventsPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── MorePage.tsx
│   │   ├── NotificationsPage.tsx    # In-app notification center
│   │   ├── OfficerDashboardPage.tsx
│   │   ├── OfficerScanPage.tsx      # Check-in scanner
│   │   ├── ProfilePage.tsx
│   │   ├── SelectEventPage.tsx
│   │   ├── SessionDetailPage.tsx
│   │   ├── SignUpPage.tsx
│   │   └── WelcomePage.tsx
│   ├── services/          # Cloud API & service layer
│   │   ├── authService.ts
│   │   ├── eventService.ts
│   │   ├── registrationService.ts
│   │   ├── sessionService.ts
│   │   ├── speakerService.ts
│   │   ├── taskService.ts
│   │   ├── notifyService.ts        # Triggers email notifications (/api/notify)
│   │   ├── notificationService.ts  # In-app notifications (/api/notifications)
│   │   ├── apiClient.ts            # /api detection + localStorage fallback helpers
│   │   ├── storageService.ts       # S3 pre-signed upload client
│   │   └── seedData.ts
│   ├── theme/             # MUI theme configuration & brand tokens
│   │   └── theme.ts
│   ├── types/             # Shared TypeScript declarations
│   │   ├── attendee.ts
│   │   ├── auth.ts                 # User, sign-up data, officer position/committee
│   │   ├── event.ts
│   │   ├── session.ts
│   │   ├── speaker.ts
│   │   └── task.ts                 # Officer tasks
│   └── utils/
│       ├── people.ts               # Name format, APC email check, officer hierarchy
│       └── excelExport.ts          # .xlsx downloads
├── ARCHITECTURE.md        # Technical architecture documentation
├── CHANGELOG.md           # Version release history
├── DECISIONS.md           # Architectural Decision Records (ADRs)
├── ROADMAP.md             # Project roadmap & upcoming features
├── README.md              # Project documentation
├── vercel.json            # Vercel deployment & routing config
└── package.json
```

---

## 🔌 Cloud Backend & Database Integration

The application operates in a **Hybrid Mode**:
1. **Live AWS Cloud (Vercel Serverless + DynamoDB + S3)**: When deployed or running with the serverless API (`vercel dev`), accounts, events, sessions, stamps, registrations, officer tasks and speakers are stored in one DynamoDB table (each record has an `entityType`), and images in the Amazon S3 bucket. Everyone sees the same data on every device.
2. **Local Fallback**: With `npm run dev` the `/api` functions don't run, so the services fall back to this browser's `localStorage`. Different logins in the same browser still see each other's changes, but nothing is shared with other devices, and uploads to S3 don't work.

---

## 📄 Documentation Links

- 📐 [Architecture Documentation](ARCHITECTURE.md)
- 🗺️ [Project Roadmap](ROADMAP.md)
- 📝 [Changelog](CHANGELOG.md)
- 💡 [Architectural Decision Records (ADRs)](DECISIONS.md)

---

&copy; 2026 **AWS Student Builder Group – Asia Pacific College**. Built with ❤️ for AWS Builders.
