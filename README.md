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
- **Officer Verification Portal (`OfficerDashboardPage`)**: Real-time review queue for officers to verify and approve/decline student stamp requests.
- **Admin Role Management (`AdminDashboardPage`)**: Manage user permissions, promoting attendees to officers or administrators.
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

## 👥 Demo User Accounts

| Username | Password | Role | Name | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `admin` | `admin123` | **Admin** | Admin User | Manage user roles & verify stamps |
| `officer` | `officer123` | **Officer** | Rodmina Jhoy Ibe | Approve attendee stamp requests |
| `attendee` | `attendee123` | **Attendee** | Sofia Rossi | Track event flow, request stamps & network |

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

Open [http://localhost:5173](http://localhost:5173) in your browser and sign in with any of the demo accounts above.

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
│   │   ├── AdminDashboardPage.tsx
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
1. **Live AWS Cloud (Vercel Serverless + DynamoDB + S3)**: When deployed or running with the serverless API, data is written to and read from Amazon DynamoDB tables (`Events`, `Sessions`, `Stamps`) and Amazon S3 bucket (`aws-event-tracker-assets`).
2. **Local Fallback**: If backend endpoints are unreachable or credentials are not configured, client services (`eventService.ts`, `sessionService.ts`) automatically fall back to browser `localStorage` seamlessly.

---

## 📄 Documentation Links

- 📐 [Architecture Documentation](ARCHITECTURE.md)
- 🗺️ [Project Roadmap](ROADMAP.md)
- 📝 [Changelog](CHANGELOG.md)
- 💡 [Architectural Decision Records (ADRs)](DECISIONS.md)

---

&copy; 2026 **AWS Student Builder Group – Asia Pacific College**. Built with ❤️ for AWS Builders.
