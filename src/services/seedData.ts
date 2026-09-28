import type { AppEvent } from '../types/event';
import type { Speaker } from '../types/speaker';
import type { Person, Registration } from '../types/attendee';

/**
 * Seed speakers for the shared directory.
 */
export const seedSpeakers: Speaker[] = [
  {
    id: 'spk-1',
    name: 'Dr. Amara Chen',
    headline: 'Principal Engineer',
    company: 'Nimbus Cloud',
    bio: 'Amara leads platform architecture and speaks widely on distributed systems and developer experience.',
    linkedInUrl: 'https://www.linkedin.com/in/amara-chen',
    avatarUrl: '',
  },
  {
    id: 'spk-2',
    name: 'Marcus Okafor',
    headline: 'Head of Design',
    company: 'Bright Studio',
    bio: 'Marcus focuses on inclusive design systems and has built product teams at several startups.',
    linkedInUrl: 'https://www.linkedin.com/in/marcus-okafor',
    avatarUrl: '',
  },
  {
    id: 'spk-3',
    name: 'Priya Nair',
    headline: 'Data Science Lead',
    company: 'Insight Labs',
    bio: 'Priya works on applied machine learning and enjoys making complex topics approachable.',
    linkedInUrl: 'https://www.linkedin.com/in/priya-nair',
    avatarUrl: '',
  },
  {
    id: 'spk-4',
    name: 'Liam Fitzgerald',
    headline: 'Developer Advocate',
    company: 'OpenForge',
    bio: 'Liam helps developers get productive with open-source tooling and community building.',
    linkedInUrl: 'https://www.linkedin.com/in/liam-fitzgerald',
    avatarUrl: '',
  },
];

/**
 * Seed people for the shared attendee directory. The logged-in "admin" user
 * maps to per-1, "viewer" maps to per-2 (see currentAttendee helper).
 */
export const seedPeople: Person[] = [
  { id: 'per-1', name: 'Admin User', email: 'admin@example.com' },
  { id: 'per-2', name: 'View Only', email: 'viewer@example.com' },
  { id: 'per-3', name: 'Sofia Rossi', email: 'sofia@example.com' },
  { id: 'per-4', name: 'Kenji Tanaka', email: 'kenji@example.com' },
  { id: 'per-5', name: 'Grace Adeyemi', email: 'grace@example.com' },
];

// Helper to build ISO timestamps relative to a fixed reference point so the
// seed always has a spread of upcoming / ongoing / completed events.
function daysFromNow(days: number, hour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const seedEvents: AppEvent[] = [
  {
    id: 'evt-1',
    title: 'CloudConf 2026',
    description:
      'A full-day conference on cloud-native architecture, platform engineering, and scaling teams.',
    category: 'conference',
    status: 'upcoming',
    startAt: daysFromNow(14, 9),
    endAt: daysFromNow(14, 17),
    venue: 'Grand Ballroom, Metro Convention Center',
    capacity: 300,
    speakerIds: ['spk-1', 'spk-3'],
  },
  {
    id: 'evt-2',
    title: 'Design Systems Workshop',
    description:
      'Hands-on workshop building an accessible, themeable design system from scratch.',
    category: 'workshop',
    status: 'upcoming',
    startAt: daysFromNow(7, 13),
    endAt: daysFromNow(7, 16),
    venue: 'Studio B, Bright Studio HQ',
    capacity: 30,
    speakerIds: ['spk-2'],
  },
  {
    id: 'evt-3',
    title: 'Frontend Meetup: September Edition',
    description:
      'Casual evening meetup with lightning talks and networking for frontend developers.',
    category: 'meetup',
    status: 'ongoing',
    startAt: daysFromNow(0, 18),
    endAt: daysFromNow(0, 21),
    venue: 'The Loft, Downtown',
    capacity: 80,
    speakerIds: ['spk-4'],
  },
  {
    id: 'evt-4',
    title: 'Intro to Machine Learning (Webinar)',
    description:
      'A beginner-friendly online session covering the fundamentals of machine learning.',
    category: 'webinar',
    status: 'upcoming',
    startAt: daysFromNow(3, 11),
    endAt: daysFromNow(3, 12),
    venue: 'Online',
    capacity: 0,
    speakerIds: ['spk-3'],
  },
  {
    id: 'evt-5',
    title: 'DevTools Summit (Spring)',
    description:
      'Past summit on developer tooling, CI/CD, and productivity. Recordings available.',
    category: 'conference',
    status: 'completed',
    startAt: daysFromNow(-30, 9),
    endAt: daysFromNow(-30, 17),
    venue: 'Riverside Auditorium',
    capacity: 250,
    speakerIds: ['spk-1', 'spk-4'],
  },
  {
    id: 'evt-6',
    title: 'Accessibility in Practice',
    description:
      'A workshop on building accessible interfaces, from semantics to testing with assistive tech.',
    category: 'workshop',
    status: 'cancelled',
    startAt: daysFromNow(10, 10),
    endAt: daysFromNow(10, 13),
    venue: 'Room 204, Community Hub',
    capacity: 40,
    speakerIds: ['spk-2'],
  },
];

export const seedRegistrations: Registration[] = [
  {
    id: 'reg-1',
    eventId: 'evt-1',
    personId: 'per-1',
    rsvp: 'going',
    checkedIn: false,
    registeredAt: daysFromNow(-2),
  },
  {
    id: 'reg-2',
    eventId: 'evt-2',
    personId: 'per-1',
    rsvp: 'interested',
    checkedIn: false,
    registeredAt: daysFromNow(-1),
  },
  {
    id: 'reg-3',
    eventId: 'evt-1',
    personId: 'per-3',
    rsvp: 'going',
    checkedIn: false,
    registeredAt: daysFromNow(-3),
  },
  {
    id: 'reg-4',
    eventId: 'evt-3',
    personId: 'per-4',
    rsvp: 'going',
    checkedIn: true,
    registeredAt: daysFromNow(-5),
  },
  {
    id: 'reg-5',
    eventId: 'evt-1',
    personId: 'per-5',
    rsvp: 'interested',
    checkedIn: false,
    registeredAt: daysFromNow(-1),
  },
];
