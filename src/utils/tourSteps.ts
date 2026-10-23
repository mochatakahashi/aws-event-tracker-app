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
  text: 'What’s happening now: the event you’re at (with your stamp passport while it’s on), your next event, your registrations and the latest updates. It updates by itself.',
};
const events: TourStep = {
  target: 'nav-events',
  emoji: '📅',
  title: 'Events',
  text: 'Find events and register. The event team accepts your registration, then you can pick the sessions you’ll attend. Events with ⭐ Stamps: once the event starts, ask for each session’s stamp; the team gives it after you’re checked in at the door.',
};
const pass: TourStep = {
  target: 'nav-pass',
  emoji: '🎟️',
  title: 'My Event Pass',
  text: 'Your QR pass for accepted registrations. Show it at the door to check in. After the event ends, your certificate appears here - view it, download it or share its link.',
  fallback: {
    target: 'profile',
    text: 'Tap your picture → My Event Pass. It’s your QR pass for accepted registrations: show it at the door to check in. After the event ends, your certificate appears there too.',
  },
};
const achievements: TourStep = {
  target: 'nav-achievements',
  emoji: '🏆',
  title: 'Achievements',
  text: 'What you’ve completed: stamps earned, events attended, certificates and badges, plus Share my stamps to post your stamp card on Instagram and other socials.',
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
  text: 'Approvals, check-ins, stamps, tasks and “your certificate is ready” show up here. Mark each one as read or unread, or delete it.',
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

  if (role === 'adviser') {
    return [
      { ...welcome, text: 'This quick tour shows where you follow the org’s work, sign requests and post announcements.' },
      {
        target: 'nav-dashboard',
        emoji: '🧑‍🏫',
        title: 'Adviser dashboard',
        text: 'Requests to sign (approve, or return with a comment), announcements to the officers, officer tasks (open, done on time, late) and events with attendance.',
      },
      { target: 'nav-events', emoji: '📅', title: 'Events', text: 'Every event with its details, sessions and team - view only.' },
      { target: 'nav-leaderboard', emoji: '📊', title: 'Leaderboard', text: 'How active attendees and officers are.' },
      bell,
      profile,
      done,
    ];
  }
  if (role === 'admin') {
    return [
      welcome,
      {
        target: 'nav-dashboard',
        emoji: '🛠️',
        title: 'Admin Dashboard',
        text: 'Manage accounts (approve sign-ups, add accounts), events, attendees, officers, tasks, adviser sign-offs and announcements. In Edit event you add sessions and stamps; on the event page you set the event staff (check-in, stamps, food).',
      },
      {
        target: 'nav-event-desk',
        emoji: '🧭',
        title: 'Event Desk',
        text: 'Event day in one place, as separate steps: accept registrations, check people in at the door with the QR scanner, and give stamps after each session.',
      },
      {
        target: 'nav-leaderboard',
        emoji: '📊',
        title: 'Leaderboard',
        text: 'Rankings and progress of attendees and officers, for monitoring.',
        fallback: { target: 'nav-dashboard', text: 'On a phone: open the Admin Dashboard and tap Leaderboard. It shows the rankings and progress of attendees and officers.' },
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
        text: 'Your tasks with deadlines, your pubmats in the Content Tracker, adviser sign-offs (if your role sends them) and your event duties.',
      },
      {
        target: 'nav-event-desk',
        emoji: '🧭',
        title: 'Event Desk',
        text: 'When an admin puts you on an event’s staff, you do your duties here: check people in at the door, or give stamps after a session.',
        fallback: {
          target: 'nav-officer-dashboard',
          text: 'On a phone: tap Officer, then Open Event Desk. When an admin puts you on an event’s staff, you check people in at the door or give stamps after a session there.',
        },
      },
    );
  }
  if (partnerStaff) {
    base.push({
      target: 'nav-event-desk',
      emoji: '🤝',
      title: 'Event Desk (co-organizer staff)',
      text: 'When an admin puts you on a co-organized event’s staff list, you check people in and/or give stamps here - only the duties you were given.',
    });
  }
  return [...base, profile, done];
}
