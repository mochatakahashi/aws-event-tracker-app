# AWS SBG-APC Event Tracker ☁️📱

**AWS SBG-APC Event Tracker** is a high-performance, mobile-first web application designed for the **AWS Student Builder Group – Asia Pacific College**. It serves as an all-in-one companion app for students, speakers, and officers during cloud events, conferences, workshops, and meetups.

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

### 🛡️ Officer & Admin Capabilities
- **Officer Dashboard (`OfficerDashboardPage`)**: Tasks assigned by an admin (Start / Mark done) and the stamp review queue.
- **Account Approval (`AdminDashboardPage`)**: Every new sign-up waits for an admin to approve or decline it; admins also change roles.
- **Attendee & Stamp Monitoring (`AdminAttendeesPage`)**: Per-event attendee list with check-in, stamp finishers per session, and Excel downloads for profs.
- **Officer Achievements (`AdminOfficersPage`)**: Officers in hierarchy order with events volunteered, stamps approved and task progress.
- **Officer Tasks (`AdminTasksPage`)**: Assign tasks to one or more officers.
- **Sign-up types**: APC Student (APC email + student ID), Outside Attendee (any email + organization) and Officer (APC email, optional personal email, position and committee).
- **Multi-Role Support**: Built-in access control for `attendee`, `officer`, and `admin` roles.

### 🎨 Cloud Media & Interactive Image Adjusters
- **16:9 Banner Image Adjuster (`ImageBannerAdjuster`)**: Interactive frame cropper with 1×–3× zoom, drag positioning, and direct export/upload of 1280×720 banners.
- **Circular Avatar Image Adjuster (`AvatarImageAdjuster`)**: Circular mask cropper for attendee profile pictures and event speaker headshots with direct S3 pre-signed upload.
- **Direct-to-S3 Cloud Pipeline**: Client-side canvas export uploaded directly to Amazon S3 via secure pre-signed URLs (`/api/upload-url`).

### 📱 Mobile-First & Overlay-Free UX
- **No Overlays**: Replaced screen-obscuring backdrop modals and popups with inline expandable cards and collapse panels.
- **Sticky Edge-to-Edge Navigation**: Clean 0-radius top app bar with text truncation for seamless mobile viewing.
- **Fixed Bottom Navigation Bar (`BottomNav`)**: Thumb-friendly navigation bar for mobile viewports (`xs`) giving instant access to Events, Profile/Connect, Schedule Flow, Notifications, and More.

---

## 🔐 Admin Account

There are no demo accounts. The app has one built-in admin, **`awsapc.admin`** (email `aws.apcofficial@gmail.com`; you can sign in with either):

- **Deployed (Vercel):** set `ADMIN_PASSWORD` in Vercel → Settings → Environment Variables before the first sign-in. The account is created with that password the first time the database has no accounts. Change it any time on **Profile → Change password**.
- **Local (`npm run dev`):** create a `.env.local` file (not committed) with `VITE_LOCAL_ADMIN_PASSWORD=your-password`, then restart `npm run dev`.

Everyone else signs up and waits for the admin to approve them.

## ✉️ Email Notifications (Amazon SES)

Emails are sent for: account approved / declined (with the reason), officer assigned to an event, new task, and every day at 8:00 AM (Manila) — event tomorrow, "see you today", and task due tomorrow. Officers get them on both their APC email and personal email. The admin inbox (`aws.apcofficial@gmail.com`) gets an email for every new sign-up waiting for approval, and a report if any reminder email fails or the daily job breaks.

Set these in Vercel → Settings → Environment Variables:

| Variable | Example | Notes |
| :--- | :--- | :--- |
| `SES_FROM_EMAIL` | `AWS SBG-APC <aws.apcofficial@gmail.com>` | Must be verified in Amazon SES |
| `SES_REGION` | `ap-southeast-1` | Optional; defaults to `APP_AWS_REGION` |
| `APP_URL` | `https://your-app.vercel.app` | Optional; used for links in emails |
| `CRON_SECRET` | any long random string | Protects the daily reminder job (`vercel.json` → `crons`) |
| `ADMIN_NOTIFY_EMAIL` | `aws.apcofficial@gmail.com` | Optional; admin alerts (new sign-ups waiting, failed emails). This is the default |

The AWS access key also needs the `ses:SendEmail` permission. While SES is in sandbox mode it can only email verified addresses — request production access in the SES console.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Material UI (MUI) v6
- **Routing**: React Router v6
- **Testing**: Vitest + React Testing Library
- **State Management**: React Context (`AuthContext`, `EventContext`) + LocalStorage Persistence

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
│   ├── registrations.ts   # Event registrations & check-in
│   ├── tasks.ts           # Officer tasks assigned by admins
│   ├── speakers.ts        # Speaker directory (with photos)
│   ├── notify.ts          # Email notifications (Amazon SES) + daily reminder cron
│   ├── upload-url.ts      # S3 pre-signed upload URL generator
│   └── seed.ts            # Batch database seeding endpoint
├── public/                # Static public assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── AppLayout.tsx           # Main layout with sticky header & mobile bottom nav
│   │   ├── AvatarImageAdjuster.tsx # Circular avatar cropper with S3 upload
│   │   ├── BottomNav.tsx           # Mobile bottom navigation bar
│   │   ├── EventStampCard.tsx      # Automatic circle stamp passport card
│   │   ├── ImageBannerAdjuster.tsx # 16:9 banner frame adjuster with S3 upload
│   │   ├── NetworkingCard.tsx      # Inline modal-free QR card
│   │   ├── ProtectedRoute.tsx      # Auth route guard
│   │   ├── SessionCard.tsx         # Flow session card
│   │   └── StampBadge.tsx          # Circle badge indicator
│   ├── context/           # Global React Contexts
│   │   ├── AuthContext.tsx         # Auth state & localStorage persistence
│   │   └── EventContext.tsx        # Active event selection state
│   ├── pages/             # Page route views
│   │   ├── AdminDashboardPage.tsx   # Manage Accounts (approvals, roles)
│   │   ├── AdminAttendeesPage.tsx   # Attendees, check-in, stamp finishers, Excel
│   │   ├── AdminOfficersPage.tsx    # Officer achievements & volunteered events
│   │   ├── AdminTasksPage.tsx       # Assign officer tasks
│   │   ├── DashboardPage.tsx
│   │   ├── EventBuilderPage.tsx
│   │   ├── EventDetailPage.tsx
│   │   ├── EventFlowPage.tsx
│   │   ├── EventsPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── MorePage.tsx
│   │   ├── NotificationsPage.tsx
│   │   ├── OfficerDashboardPage.tsx
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
│   │   ├── apiClient.ts            # /api detection + localStorage fallback helpers
│   │   ├── storageService.ts       # S3 pre-signed upload client
│   │   └── seedData.ts
│   ├── theme/             # MUI theme configuration & brand tokens
│   │   └── theme.ts
│   └── types/             # Shared TypeScript declarations
│       ├── attendee.ts
│       ├── auth.ts
│       ├── event.ts
│       ├── session.ts
│       └── speaker.ts
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
