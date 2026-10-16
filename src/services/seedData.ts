import type { AppEvent } from '../types/event';
import type { Speaker } from '../types/speaker';
import type { Person, Registration } from '../types/attendee';
import type { Session, Stamp } from '../types/session';

/**
 * Seed speakers — AWS SBG-APC themed.
 */
export const seedSpeakers: Speaker[] = [
  {
    id: 'spk-1',
    name: 'Programs Team',
    headline: 'Hosts',
    company: 'AWS SBG-APC',
    bio: 'The AWS Student Builder Group programs team at Asia Pacific College handles event logistics and community engagement.',
    linkedInUrl: '',
    avatarUrl: '',
  },
  {
    id: 'spk-2',
    name: 'Rodmina Jhoy Ibe',
    headline: 'Community Lead',
    company: 'AWS SBG-APC',
    bio: 'Passionate about cloud computing and building the next generation of AWS builders at APC.',
    linkedInUrl: 'https://www.linkedin.com/in/rodmina-jhoy-ibe',
    avatarUrl: '',
  },
  {
    id: 'spk-3',
    name: 'Cloud Innovators',
    headline: 'Guest Speaker',
    company: 'AWS Philippines',
    bio: 'AWS Solutions Architects sharing real-world cloud architecture patterns and best practices.',
    linkedInUrl: '',
    avatarUrl: '',
  },
  {
    id: 'spk-4',
    name: 'TechStart Labs',
    headline: 'Workshop Facilitator',
    company: 'Platinum Sponsor',
    bio: 'Building production systems in plain language. Empowering students with hands-on cloud skills.',
    linkedInUrl: '',
    avatarUrl: '',
  },
  {
    id: 'spk-5',
    name: 'DevOps Guild PH',
    headline: 'Panel Speaker',
    company: 'Community Partner',
    bio: 'Filipino DevOps practitioners sharing CI/CD, infrastructure-as-code, and cloud-native approaches.',
    linkedInUrl: '',
    avatarUrl: '',
  },
];

/**
 * Seed people for the shared attendee directory.
 */
export const seedPeople: Person[] = [
  {
    id: 'per-1',
    name: 'Admin User',
    email: 'admin@awssbg-apc.com',
    bio: 'Platform administrator for AWS SBG-APC Event Tracker.',
    socials: { linkedIn: 'https://linkedin.com/in/admin' },
  },
  {
    id: 'per-2',
    name: 'Rodmina Jhoy Ibe',
    email: 'rodmina@apc.edu.ph',
    studentId: 'APC-2024-001',
    bio: 'CS student & AWS Cloud Club lead at APC. Building the future on AWS.',
    socials: {
      linkedIn: 'https://www.linkedin.com/in/rodmina-jhoy-ibe',
      github: 'https://github.com/mochatakahashi',
    },
  },
  {
    id: 'per-3',
    name: 'Sofia Rossi',
    email: 'sofia@apc.edu.ph',
    studentId: 'APC-2024-042',
    bio: 'IT student passionate about serverless and cloud-native development.',
    socials: { linkedIn: 'https://www.linkedin.com/in/sofia-rossi' },
  },
  {
    id: 'per-4',
    name: 'Kenji Tanaka',
    email: 'kenji@apc.edu.ph',
    studentId: 'APC-2024-088',
    bio: 'Game dev student exploring AWS GameLift and real-time multiplayer.',
    socials: {
      linkedIn: 'https://www.linkedin.com/in/kenji-tanaka',
      github: 'https://github.com/kenjitanaka',
    },
  },
  {
    id: 'per-5',
    name: 'Grace Adeyemi',
    email: 'grace@apc.edu.ph',
    studentId: 'APC-2024-105',
    bio: 'Data science enthusiast. Interested in SageMaker and MLOps.',
    socials: { linkedIn: 'https://www.linkedin.com/in/grace-adeyemi' },
  },
];

const CLUB_NAME = 'AWS Student Builder Group - Asia Pacific College';

/**
 * Real AWS SBG-APC events from the tracker.
 * Ordered chronologically (earliest first).
 */
export const seedEvents: AppEvent[] = [
  {
    id: 'evt-1',
    title: 'Tech Barangay: AWS x WordPress x Notion',
    description:
      'A comprehensive tech workshop combining AWS cloud services, WordPress web development, and Notion productivity tools. Join us for hands-on sessions covering technical, leadership, career growth, and diversity topics.',
    modality: 'onsite',
    status: 'upcoming',
    tags: ['technical', 'leadership', 'career-growth', 'diversity'],
    startAt: '2026-11-14T09:00:00+08:00',
    endAt: '2026-11-14T17:00:00+08:00',
    venue: 'Asia Pacific College',
    participants: 130,
    participantsEstimated: true,
    capacity: 130,
    speakerIds: ['spk-1', 'spk-2', 'spk-3'],
    officerIds: ['per-2'],
    club: CLUB_NAME,
  },
  {
    id: 'evt-2',
    title: 'Cloud Watch: Demo Day x Spider-Man: Brand New Day',
    description:
      'A hybrid demo day event where students showcase their cloud projects, combined with a creative Spider-Man themed experience. Features technical demonstrations and leadership skill-building activities.',
    modality: 'hybrid',
    status: 'upcoming',
    tags: ['technical', 'leadership'],
    startAt: '2026-10-17T09:00:00+08:00',
    endAt: '2026-10-17T17:00:00+08:00',
    venue: 'Asia Pacific College',
    participants: 30,
    participantsEstimated: true,
    capacity: 50,
    speakerIds: ['spk-1', 'spk-2'],
    officerIds: ['per-2'],
    externalUrl: 'https://example.com/cloud-watch-2026',
    club: CLUB_NAME,
  },
  {
    id: 'evt-3',
    title: 'AWS SCD Mega Manila 2026 At Asia Pacific College',
    description:
      'The largest AWS Student Cloud Day event in Manila, hosted at Asia Pacific College. A full-day conference covering technical cloud skills, leadership development, career growth pathways, and diversity in tech. Featuring keynotes, workshops, and networking.',
    modality: 'onsite',
    status: 'accomplished',
    tags: ['technical', 'leadership', 'career-growth', 'diversity'],
    startAt: '2026-09-11T09:00:00+08:00',
    endAt: '2026-09-11T17:00:00+08:00',
    venue: 'Asia Pacific College',
    participants: 380,
    participantsEstimated: true,
    capacity: 400,
    speakerIds: ['spk-1', 'spk-2', 'spk-3', 'spk-5'],
    officerIds: ['per-2'],
    externalUrl: 'https://example.com/scd-mega-manila-2026',
    club: CLUB_NAME,
  },
  {
    id: 'evt-4',
    title: 'Org Fair 2026: Introduce AWS and AWS Tools to Students',
    description:
      'Organization fair introducing AWS Student Builder Group to new and current students. Learn about AWS tools, community benefits, and upcoming events. A hybrid event focused on leadership and diversity outreach.',
    modality: 'hybrid',
    status: 'accomplished',
    tags: ['leadership', 'diversity'],
    startAt: '2026-09-03T09:00:00+08:00',
    endAt: '2026-09-03T17:00:00+08:00',
    venue: 'Asia Pacific College',
    participants: 200,
    participantsEstimated: true,
    capacity: 200,
    speakerIds: ['spk-1', 'spk-2'],
    officerIds: ['per-2'],
    externalUrl: 'https://example.com/org-fair-2026',
    club: CLUB_NAME,
  },
  {
    id: 'evt-5',
    title: 'AWS Mini Org Fair: Introduce AWS and AWS Tools to Froshies',
    description:
      'A dedicated onsite event for freshmen (froshies) to discover the AWS Student Builder Group. Covers leadership skills and promotes diversity in tech through introductory sessions on AWS tools and community activities.',
    modality: 'onsite',
    status: 'accomplished',
    tags: ['leadership', 'diversity'],
    startAt: '2026-07-10T09:00:00+08:00',
    endAt: '2026-07-10T17:00:00+08:00',
    venue: 'Asia Pacific College',
    participants: 100,
    participantsEstimated: false,
    capacity: 120,
    speakerIds: ['spk-1', 'spk-2'],
    officerIds: ['per-2'],
    externalUrl: 'https://example.com/mini-org-fair-2026',
    club: CLUB_NAME,
  },
  {
    id: 'evt-6',
    title: 'AWS Launchpad: Core Services Session Operational Briefing',
    description:
      'An onsite operational briefing session covering AWS core services. This technical and leadership-focused session introduces fundamental AWS infrastructure services to club members through hands-on demonstrations and structured learning.',
    modality: 'onsite',
    status: 'accomplished',
    tags: ['technical', 'leadership'],
    startAt: '2026-05-19T09:00:00+08:00',
    endAt: '2026-05-19T17:00:00+08:00',
    venue: 'Asia Pacific College',
    participants: 20,
    participantsEstimated: false,
    capacity: 30,
    speakerIds: ['spk-1', 'spk-3'],
    officerIds: ['per-2'],
    externalUrl: 'https://example.com/launchpad-core-services',
    club: CLUB_NAME,
  },
  {
    id: 'evt-7',
    title: 'AWS Launchpad: Intro to Cloud and AWS Ecosystem',
    description:
      'A comprehensive introduction to cloud computing and the AWS ecosystem, held at the Asia Pacific College Auditorium. Covers technical fundamentals, leadership in tech, career growth in cloud computing, and diversity topics. Ideal for beginners.',
    modality: 'onsite',
    status: 'accomplished',
    tags: ['technical', 'leadership', 'career-growth', 'diversity'],
    startAt: '2026-05-21T09:00:00+08:00',
    endAt: '2026-05-21T17:00:00+08:00',
    venue: 'Asia Pacific College - Auditorium',
    participants: 170,
    participantsEstimated: false,
    capacity: 200,
    speakerIds: ['spk-1', 'spk-2', 'spk-3'],
    officerIds: ['per-2'],
    externalUrl: 'https://example.com/launchpad-intro-cloud',
    club: CLUB_NAME,
  },
];

/**
 * Sessions for Tech Barangay event.
 * Only Tech Barangay has sessions and uses the session activity stamp system.
 */
export const seedSessions: Session[] = [
  // ── Tech Barangay Sessions ──
  {
    id: 'ses-1',
    eventId: 'evt-1',
    title: 'WordPress Campus Connect',
    description: 'Introduction to WordPress. (Note: You need to show your work that you finished before approval from the officer)',
    startTime: '2026-11-14T10:00:00+08:00',
    endTime: '2026-11-14T11:30:00+08:00',
    room: 'Lab 1',
    speakerIds: ['spk-2'],
    type: 'workshop',
    status: 'not-started',
    requiresStamp: true,
  },
  {
    id: 'ses-2',
    eventId: 'evt-1',
    title: 'WordPress on AWS',
    description: 'Learn how to host your WordPress site on AWS infrastructure. (Note: You need to show your work that you finished before approval from the officer)',
    startTime: '2026-11-14T12:30:00+08:00',
    endTime: '2026-11-14T14:00:00+08:00',
    room: 'Lab 1',
    speakerIds: ['spk-3'],
    type: 'workshop',
    status: 'not-started',
    requiresStamp: true,
  },
  {
    id: 'ses-3',
    eventId: 'evt-1',
    title: 'Notion Productivity',
    description: 'Organize your workflows and projects using Notion templates and features. (Note: You need to show your work that you finished before approval from the officer)',
    startTime: '2026-11-14T14:00:00+08:00',
    endTime: '2026-11-14T15:00:00+08:00',
    room: 'Lab 2',
    speakerIds: ['spk-1'],
    type: 'workshop',
    status: 'not-started',
    requiresStamp: true,
  },
];

/**
 * Seed stamps for Tech Barangay sessions.
 */
export const seedStamps: Stamp[] = [
  {
    id: 'stp-1',
    sessionId: 'ses-1',
    attendeeId: 'per-2',
    approvedBy: 'per-1',
    approvedAt: '2026-11-14T11:35:00+08:00',
    status: 'approved',
  },
  {
    id: 'stp-2',
    sessionId: 'ses-2',
    attendeeId: 'per-2',
    approvedBy: 'per-1',
    approvedAt: '2026-11-14T13:50:00+08:00',
    status: 'pending',
  },
];

export const seedRegistrations: Registration[] = [
  {
    id: 'reg-1',
    eventId: 'evt-1',
    personId: 'per-1',
    rsvp: 'going',
    checkedIn: false,
    registeredAt: '2026-11-01T09:00:00+08:00',
  },
  {
    id: 'reg-2',
    eventId: 'evt-2',
    personId: 'per-1',
    rsvp: 'going',
    checkedIn: false,
    registeredAt: '2026-10-10T09:00:00+08:00',
  },
  {
    id: 'reg-3',
    eventId: 'evt-1',
    personId: 'per-2',
    rsvp: 'going',
    checkedIn: false,
    registeredAt: '2026-11-02T09:00:00+08:00',
  },
  {
    id: 'reg-4',
    eventId: 'evt-2',
    personId: 'per-2',
    rsvp: 'going',
    checkedIn: false,
    registeredAt: '2026-10-11T09:00:00+08:00',
  },
  {
    id: 'reg-5',
    eventId: 'evt-3',
    personId: 'per-2',
    rsvp: 'going',
    checkedIn: true,
    registeredAt: '2026-09-01T09:00:00+08:00',
  },
  {
    id: 'reg-6',
    eventId: 'evt-1',
    personId: 'per-3',
    rsvp: 'going',
    checkedIn: false,
    registeredAt: '2026-11-03T09:00:00+08:00',
  },
  {
    id: 'reg-7',
    eventId: 'evt-3',
    personId: 'per-4',
    rsvp: 'going',
    checkedIn: true,
    registeredAt: '2026-09-02T09:00:00+08:00',
  },
  {
    id: 'reg-8',
    eventId: 'evt-1',
    personId: 'per-5',
    rsvp: 'interested',
    checkedIn: false,
    registeredAt: '2026-11-05T09:00:00+08:00',
  },
];
