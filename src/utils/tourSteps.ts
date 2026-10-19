import type { UserRole } from '../types/auth';

/** One stop of the app tour. `target` matches a `data-tour` attribute; no target = a centered card. */
export interface TourStep {
  target?: string;
  emoji?: string;
  title: string;
  text: string;
  /** When the target isn't on screen (e.g. not in the phone's bottom bar), highlight this instead and explain how to get there. */
  fallback?: { target: string; text: string };
}

const dashboard: TourStep = {
  target: 'nav-dashboard',
  emoji: '🏠',
  title: 'Dashboard',
  text: 'What’s happening now: the event that’s live, your next event, your registrations and the latest updates.',
};
const events: TourStep = {
  target: 'nav-events',
  emoji: '📅',
  title: 'Events',
  text: 'Find events and register. An officer approves your registration, then you can pick the sessions you’ll attend. Events with ⭐ Stamps have a stamp passport.',
};
const pass: TourStep = {
  target: 'nav-pass',
  emoji: '🎟️',
  title: 'My Event Pass',
  text: 'Your QR pass for approved registrations. Show it at the registration booth to check in. After the event ends, your certificate appears here — view it, download it or share its link.',
  fallback: {
    target: 'profile',
    text: 'Tap your picture → My Event Pass. It’s your QR pass for approved registrations: show it at the registration booth to check in. After the event ends, your certificate appears there too.',
  },
};
const achievements: TourStep = {
  target: 'nav-achievements',
  emoji: '🏆',
  title: 'Achievements',
  text: 'What you’ve completed: stamps earned, events attended, certificates and badges. Stamp passports for live and upcoming events are on your Dashboard and the event page.',
};
const connect: TourStep = {
  target: 'nav-connect',
  emoji: '🤝',
  title: 'Connect',
  text: 'Share your QR profile card and links, send connection requests, approve the ones you get and see your connections.',
};
const bell: TourStep = {
  target: 'nav-notifications',
  emoji: '🔔',
  title: 'Notifications',
  text: 'Approvals, check-ins, stamps, tasks and “your certificate is ready” show up here.',
};
const profile: TourStep = {
  target: 'profile',
  emoji: '👤',
  title: 'Your profile',
  text: 'Tap your picture to edit your profile (name, photo, bio, links), change your password, or replay this tour any time.',
};

/** Steps for each role. */
export function tourSteps(role: UserRole | undefined, partnerStaff = false): TourStep[] {
  const welcome: TourStep = {
    emoji: '✨',
    title: 'AWS SBG-APC Event Tracker',
    text:
      role === 'admin'
        ? 'This quick tour shows where you manage accounts, events, staff and the event day.'
        : 'This quick tour shows where to find events, your pass, stamps and certificates.',
  };
  const done: TourStep = {
    emoji: '🎉',
    title: 'You’re all set!',
    text: 'That’s the tour. You can take it again from your profile.',
  };

  if (role === 'admin') {
    return [
      welcome,
      {
        target: 'nav-dashboard',
        emoji: '🛠️',
        title: 'Admin Dashboard',
        text: 'Manage accounts (approve sign-ups, add accounts), edit events, attendees, officers, tasks and the content tracker. On an event’s page you add sessions and set the event staff.',
      },
      {
        target: 'nav-event-desk',
        emoji: '🧭',
        title: 'Event Desk',
        text: 'Event day in one place: approve registrations, check people in with the QR scanner, and approve stamps after check-in.',
      },
      {
        target: 'nav-leaderboard',
        emoji: '📊',
        title: 'Leaderboard',
        text: 'Rankings and progress of attendees and officers, for monitoring.',
      },
      bell,
      profile,
      done,
    ];
  }

  const base = [welcome, dashboard, events, pass, achievements, connect, bell];
  if (role === 'officer') {
    base.push(
      {
        target: 'nav-officer-dashboard',
        emoji: '🛡️',
        title: 'Officer Dashboard',
        text: 'Your tasks with deadlines, your pubmats in the Content Tracker, and your event duties.',
      },
      {
        target: 'nav-event-desk',
        emoji: '🧭',
        title: 'Event Desk',
        text: 'When an admin puts you on an event’s staff, check people in and approve their stamps here.',
      },
    );
  }
  if (partnerStaff) {
    base.push({
      target: 'nav-event-desk',
      emoji: '🤝',
      title: 'Event Desk (co-organizer staff)',
      text: 'When an admin puts you on a co-organized event’s staff list, you check people in and/or approve stamps here — only the duties you were given.',
    });
  }
  return [...base, profile, done];
}
