# EventHub — Frontend

A React + Vite + TypeScript single-page app for discovering and registering for
real-world events: conferences, workshops, meetups, and webinars. It ships with
a mock, in-memory data layer so the entire UI runs with no backend. The mock
services are shaped like a real API so they can be swapped for actual endpoints
later without touching the components.

## Features

Attendee experience (current focus):

- **Login** with mock auth (validated against a hardcoded user list, session
  persisted to `localStorage`)
- **Dashboard** with summary cards (upcoming events, total events,
  registrations, speakers), an events-by-category chart, and an upcoming-events
  list
- **Browse events** with search and category/status filters, showing when each
  event runs, its venue, and availability
- **Event detail** with the speaker lineup (including LinkedIn links) and a
  **Register / RSVP** flow that is capacity-aware
- **My Registrations** listing the events you have signed up for, with RSVP
  status and the ability to cancel

Admin-facing (partial, more to come):

- **Create / edit events** including speaker assignment from a shared directory
  and adding a new speaker via a (mock) LinkedIn import

## Roles

The logged-in user maps to a person in the attendee directory.

| Username  | Password    | Role     | Maps to      |
| --------- | ----------- | -------- | ------------ |
| admin     | admin123    | admin    | Admin User   |
| attendee  | attendee123 | attendee | Sofia Rossi  |

Admins additionally see the **New Event** navigation item. Full admin
management screens (attendee lists, check-in, speaker management) are planned
for a later pass.

## Tech stack

- React 18 + TypeScript
- Vite (dev server + build)
- Material UI (MUI) v6 + `@mui/x-charts`
- React Router v6
- Vitest + React Testing Library

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173) and sign in with
one of the accounts above.

## Scripts

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `npm run dev`        | Start the Vite dev server            |
| `npm run build`      | Type-check and build for production  |
| `npm run preview`    | Preview the production build locally |
| `npm test`           | Run the test suite once (Vitest)     |
| `npm run test:watch` | Run tests in watch mode              |

## Project structure

```
src/
  components/    Reusable UI (layout, route guard, chips)
  context/       AuthContext (auth state + localStorage persistence)
  pages/         Route-level screens (login, dashboard, browse, detail,
                 my registrations, event form)
  services/      Mock API layer (event / speaker / registration) + seed data
  theme/         Shared MUI theme
  types/         Shared TypeScript types (event, speaker, attendee, auth)
  utils/         Display helpers (colors, date formatting)
  test/          Test setup + provider render helper
```

## Data model

- **Event** — title, description, category (conference / workshop / meetup /
  webinar), status (upcoming / ongoing / completed / cancelled), start & end
  datetime, venue, capacity (0 = unlimited), and assigned speaker ids
- **Speaker** — a shared directory entry (name, headline, company, bio,
  optional LinkedIn + avatar URLs), assignable to any number of events
- **Person** — a shared attendee-directory entry (name, email)
- **Registration** — links a person to an event (the "ticket"): RSVP status
  (going / interested / declined), check-in flag, and a timestamp

## Mock data layer → real backend

The app talks to service modules that simulate async network calls:

- `src/services/eventService.ts` — event CRUD + speaker assignment
- `src/services/speakerService.ts` — speaker directory + LinkedIn lookup
- `src/services/registrationService.ts` — people + registrations

Every function returns a `Promise` with simulated latency, exactly as a real
HTTP client would. To connect a real backend, replace the function bodies with
`fetch`/SDK calls and keep the same signatures. The components need no changes.

### A note on the LinkedIn import

LinkedIn profile data is not publicly retrievable from a URL without an
approved partner integration. `lookupLinkedInProfile` in `speakerService.ts` is
a **mock**: it derives a plausible name from the profile URL slug and fills
placeholder details, simulating the shape of what a real integration would
return. Swap it for a real integration (or a backend proxy) later.

> Note: the hardcoded users and passwords in `authService.ts` exist only
> because there is no backend yet. Never ship credentials in client code in a
> real application.
