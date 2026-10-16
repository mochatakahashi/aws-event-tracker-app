# AWS SBG-APC Event Tracker — System Architecture 📐

This document describes the architectural layout, data flow, component hierarchies, and design principles of the **AWS SBG-APC Event Tracker** application.

---

## 🏗️ High-Level System Architecture

```mermaid
graph TD
    User["📱 User (Attendee / Officer / Admin)"] --> Layout["AppLayout (Sticky Header & Bottom Nav)"]
    
    subgraph Presentation Layer
        Layout --> Dashboard["DashboardPage"]
        Layout --> Flow["EventFlowPage"]
        Layout --> Profile["ProfilePage"]
        Layout --> OfficerDash["OfficerDashboardPage"]
        Layout --> AdminDash["AdminDashboardPage"]
        Layout --> Builder["EventBuilderPage"]

        Dashboard --> StampCard["EventStampCard (Circle Stamp Passport)"]
        Flow --> StampCard
        Profile --> QRCard["NetworkingCard (Inline QR Code)"]
        Profile --> AvatarAdjuster["AvatarImageAdjuster (Circular Crop)"]
        Builder --> BannerAdjuster["ImageBannerAdjuster (16:9 Frame)"]
        Builder --> AvatarAdjuster
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
        LocalStore[("Browser LocalStorage (Fallback)")]
    end

    subgraph Serverless API & AWS Cloud
        VercelAPI["Vercel Serverless Functions (/api/*)"]
        DynamoDB[("Amazon DynamoDB (Events, Sessions, Stamps)")]
        S3Bucket[("Amazon S3 (Banners & Avatars)")]
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
    AuthSvc --> LocalStore

    VercelAPI --> DynamoDB
    VercelAPI -. Pre-signed URLs .-> S3Bucket
```

---

## 🧩 Architectural Layers

### 1. Presentation & Component Layer
- **`AppLayout.tsx`**: Main structural layout wrapper implementing:
  - Sticky mobile `AppBar` (`position="sticky"`, `borderRadius: 0`) with title truncation.
  - Inline collapsible menu (`Collapse`) for mobile navigation without backdrop overlays.
  - Desktop permanent sidebar `Drawer` for `md+` screen sizes.
  - Fixed mobile `BottomNav` bar for thumb-friendly navigation on `xs` viewports.
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
  - Handles authentication operations (`login`, `logout`, `signup`).
  - Persists session tokens and user state in `localStorage` under `aws-event-tracker.auth.v2`.
- **`EventContext.tsx`**:
  - Maintains currently selected active event (`AppEvent | null`).
  - Persists event context in `localStorage` under `aws-event-tracker.selectedEvent.v2`.

### 3. Service, Serverless & Cloud Storage Layer
- **`sessionService.ts`**: Handles session lookup, stamp creation (`createStamp`), stamp approvals (`approveStamp`), and declines (`declineStamp`). Connects to `/api/stamps` and `/api/sessions` with local fallback.
- **`eventService.ts`**: Handles event CRUD operations, connecting to `/api/events` with local fallback.
- **`storageService.ts`**: Requests S3 pre-signed upload URLs from `/api/upload-url` and streams cropped images directly to Amazon S3.
- **`api/` (Vercel Functions)**: Self-contained serverless microservices connecting to AWS SDK v3 DynamoDB client (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`) and S3 client (`@aws-sdk/client-s3`).
- **`authService.ts`**: Handles credentials lookup and role updates (`updateUserRole`).
- **`seedData.ts`**: Provides initial dataset seeded into `localStorage` on first load.

---

## 🎨 Mobile-First & "No-Overlays" Design Principles

1. **Inline Flow over Modal Popups**:
   - Replaced `<Dialog>` and full-screen backdrop modals with inline `<Card>` and `<Collapse>` elements.
   - Eliminates z-index conflicts, focus-trap bugs, and dark backdrop screens on mobile devices.

2. **Edge-to-Edge Header & Bottom Bar**:
   - Navigation header uses `position="sticky"` with `borderRadius: 0` to prevent floating card overlays.
   - Bottom navigation bar (`BottomNav`) is fixed at `bottom: 0` with `zIndex: 1200` and padded content offset (`pb: 10`).

3. **Responsive Grid Layouts**:
   - Grid containers adapt automatically: 1 column on mobile (`xs`), 2 columns on tablet (`sm`), and 3 columns on desktop (`md`).

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
        string username PK
        string role
        string personId FK
    }
```

---

## 🔒 Security & Access Control (RBAC)

| Role | Permissions |
| :--- | :--- |
| **`attendee`** | View schedule, request stamps, edit personal bio/socials, view own stamp card. |
| **`officer`** | All attendee privileges + access `OfficerDashboardPage` to approve/decline stamp requests. |
| **`admin`** | All officer privileges + access `AdminDashboardPage` to change user roles. |

---

*Last Updated: October 2026*
