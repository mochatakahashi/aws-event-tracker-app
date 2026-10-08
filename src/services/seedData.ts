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

// Helper to build ISO timestamps relative to a fixed reference point
function daysFromNow(days: number, hour = 9, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/**
 * AWS SBG-APC themed events.
 */
export const seedEvents: AppEvent[] = [
  {
    id: 'evt-1',
    title: '[Day 1] AWS Cloud Day APC 2026',
    description:
      'Full-day immersive cloud experience for APC students. Keynotes, workshops, and hands-on labs covering AWS core services, serverless, and AI/ML.',
    category: 'conference',
    status: 'upcoming',
    startAt: daysFromNow(7, 9, 0),
    endAt: daysFromNow(7, 17, 0),
    venue: 'Auditorium, Asia Pacific College',
    capacity: 150,
    speakerIds: ['spk-1', 'spk-2', 'spk-3'],
    officerIds: ['per-2'],
  },
  {
    id: 'evt-2',
    title: '[Day 2] AWS Cloud Day APC 2026',
    description:
      'Day two continues with advanced workshops, hackathon kickoff, and networking sessions. Build real projects on AWS.',
    category: 'conference',
    status: 'upcoming',
    startAt: daysFromNow(8, 9, 0),
    endAt: daysFromNow(8, 17, 0),
    venue: 'Auditorium, Asia Pacific College',
    capacity: 150,
    speakerIds: ['spk-1', 'spk-4', 'spk-5'],
  },
  {
    id: 'evt-3',
    title: 'AWS SBG-APC Monthly Meetup – October',
    description:
      'Monthly community meetup with lightning talks, project showcases, and peer learning on AWS services.',
    category: 'meetup',
    status: 'upcoming',
    startAt: daysFromNow(14, 18, 0),
    endAt: daysFromNow(14, 20, 0),
    venue: 'Room 301, APC Main Building',
    capacity: 50,
    speakerIds: ['spk-2'],
  },
  {
    id: 'evt-4',
    title: 'Intro to AWS Lambda Workshop',
    description:
      'Beginner-friendly workshop on serverless computing with AWS Lambda. Build and deploy your first serverless API.',
    category: 'workshop',
    status: 'upcoming',
    startAt: daysFromNow(3, 14, 0),
    endAt: daysFromNow(3, 17, 0),
    venue: 'Computer Lab 2, APC',
    capacity: 30,
    speakerIds: ['spk-3'],
  },
  {
    id: 'evt-5',
    title: 'AWS SBG-APC Welcome Assembly',
    description:
      'Welcome event for new members of AWS Student Builder Group at APC. Learn about the community, upcoming events, and how to get involved.',
    category: 'meetup',
    status: 'completed',
    startAt: daysFromNow(-14, 15, 0),
    endAt: daysFromNow(-14, 17, 0),
    venue: 'Auditorium, Asia Pacific College',
    capacity: 200,
    speakerIds: ['spk-1', 'spk-2'],
  },
  {
    id: 'evt-6',
    title: 'Cloud Resume Challenge Webinar',
    description:
      'Online session walking through the Cloud Resume Challenge — build your resume website using AWS services.',
    category: 'webinar',
    status: 'completed',
    startAt: daysFromNow(-7, 19, 0),
    endAt: daysFromNow(-7, 20, 30),
    venue: 'Online (Zoom)',
    capacity: 0,
    speakerIds: ['spk-2'],
  },
  {
    id: 'evt-7',
    title: 'WordPress x AWS x Notion',
    description:
      'Learn how to build powerful websites with WordPress on AWS, and organize your productivity using Notion. Join us for a hands-on experience!',
    category: 'workshop',
    status: 'upcoming',
    startAt: daysFromNow(5, 10, 0),
    endAt: daysFromNow(5, 15, 0),
    venue: 'Innovation Center',
    capacity: 100,
    speakerIds: ['spk-1', 'spk-2', 'spk-3'],
  },
];

/**
 * Sessions for Day 1 and Day 2 events.
 */
export const seedSessions: Session[] = [
  // ── Day 1 Sessions ──
  {
    id: 'ses-1',
    eventId: 'evt-1',
    title: 'Event Introduction',
    description: 'Welcome and opening remarks. Overview of the day\'s agenda and what to expect.',
    startTime: daysFromNow(7, 9, 0),
    endTime: daysFromNow(7, 9, 20),
    room: 'Main Hall',
    speakerIds: ['spk-1'],
    type: 'talk',
    status: 'not-started',
    requiresStamp: false,
  },
  {
    id: 'ses-2',
    eventId: 'evt-1',
    title: 'Keynote: Building on AWS',
    description:
      '"Building Production Systems in Plain Language" — Learn how modern cloud architecture makes complex systems accessible to everyone. Discover M-shaped talent and how students can start their cloud journey.',
    startTime: daysFromNow(7, 9, 30),
    endTime: daysFromNow(7, 10, 5),
    room: 'Main Hall',
    speakerIds: ['spk-3'],
    type: 'keynote',
    status: 'not-started',
    requiresStamp: false,
  },
  {
    id: 'ses-3',
    eventId: 'evt-1',
    title: 'Morning Break & Networking',
    description: 'Grab some snacks and meet fellow cloud enthusiasts!',
    startTime: daysFromNow(7, 10, 5),
    endTime: daysFromNow(7, 10, 30),
    room: 'Lobby',
    speakerIds: [],
    type: 'networking',
    status: 'not-started',
    requiresStamp: false,
  },
  {
    id: 'ses-4',
    eventId: 'evt-1',
    title: 'Workshop: Deploy Your First App on AWS',
    description:
      'Hands-on session where you\'ll deploy a web application using AWS Amplify, Lambda, and DynamoDB. Bring your laptop!',
    startTime: daysFromNow(7, 10, 30),
    endTime: daysFromNow(7, 12, 0),
    room: 'Workshop Room A',
    speakerIds: ['spk-4'],
    type: 'workshop',
    status: 'not-started',
    requiresStamp: true,
  },
  {
    id: 'ses-5',
    eventId: 'evt-1',
    title: 'Lunch Break',
    description: 'Enjoy lunch provided by our sponsors. Network with speakers and fellow attendees.',
    startTime: daysFromNow(7, 12, 0),
    endTime: daysFromNow(7, 13, 0),
    room: 'Cafeteria',
    speakerIds: [],
    type: 'break',
    status: 'not-started',
    requiresStamp: false,
  },
  {
    id: 'ses-6',
    eventId: 'evt-1',
    title: 'Panel: Career Paths in Cloud',
    description:
      'Industry professionals share their cloud career journeys, tips for certification, and advice for students entering the tech industry.',
    startTime: daysFromNow(7, 13, 0),
    endTime: daysFromNow(7, 14, 0),
    room: 'Main Hall',
    speakerIds: ['spk-2', 'spk-5'],
    type: 'panel',
    status: 'not-started',
    requiresStamp: false,
  },
  {
    id: 'ses-7',
    eventId: 'evt-1',
    title: 'Workshop: Serverless API with Lambda',
    description:
      'Build a RESTful API from scratch using AWS Lambda and API Gateway. Complete the activity to earn your stamp!',
    startTime: daysFromNow(7, 14, 0),
    endTime: daysFromNow(7, 15, 30),
    room: 'Workshop Room A',
    speakerIds: ['spk-4'],
    type: 'workshop',
    status: 'not-started',
    requiresStamp: true,
  },
  {
    id: 'ses-8',
    eventId: 'evt-1',
    title: 'Closing Remarks & Raffle',
    description: 'Wrap up Day 1, announce stamp leaders, and raffle off prizes!',
    startTime: daysFromNow(7, 15, 30),
    endTime: daysFromNow(7, 16, 0),
    room: 'Main Hall',
    speakerIds: ['spk-1', 'spk-2'],
    type: 'talk',
    status: 'not-started',
    requiresStamp: false,
  },
  // ── Day 2 Sessions ──
  {
    id: 'ses-9',
    eventId: 'evt-2',
    title: 'Day 2 Kickoff',
    description: 'Welcome back! Recap of Day 1 and preview of today\'s agenda.',
    startTime: daysFromNow(8, 9, 0),
    endTime: daysFromNow(8, 9, 20),
    room: 'Main Hall',
    speakerIds: ['spk-1'],
    type: 'talk',
    status: 'not-started',
    requiresStamp: false,
  },
  {
    id: 'ses-10',
    eventId: 'evt-2',
    title: 'Workshop: AI/ML on AWS SageMaker',
    description:
      'Introduction to machine learning on AWS. Train and deploy a model using SageMaker Studio. Complete the lab to earn your stamp!',
    startTime: daysFromNow(8, 9, 30),
    endTime: daysFromNow(8, 11, 30),
    room: 'Workshop Room B',
    speakerIds: ['spk-3'],
    type: 'workshop',
    status: 'not-started',
    requiresStamp: true,
  },
  {
    id: 'ses-11',
    eventId: 'evt-2',
    title: 'Hackathon Kickoff',
    description:
      'Form teams and start building! Use any AWS services to solve a real-world challenge. Prizes for the best solutions.',
    startTime: daysFromNow(8, 13, 0),
    endTime: daysFromNow(8, 16, 0),
    room: 'Innovation Lab',
    speakerIds: ['spk-2', 'spk-4'],
    type: 'workshop',
    status: 'not-started',
    requiresStamp: true,
  },
  {
    id: 'ses-12',
    eventId: 'evt-2',
    title: 'Closing Ceremony & Awards',
    description: 'Hackathon presentations, stamp completion awards, and closing remarks for AWS Cloud Day APC 2026.',
    startTime: daysFromNow(8, 16, 0),
    endTime: daysFromNow(8, 17, 0),
    room: 'Main Hall',
    speakerIds: ['spk-1', 'spk-2'],
    type: 'talk',
    status: 'not-started',
    requiresStamp: false,
  },
  // ── WordPress x AWS x Notion Sessions ──
  {
    id: 'ses-13',
    eventId: 'evt-7',
    title: 'WordPress Campus Connect',
    description: 'Introduction to WordPress. (Note: You need to show your work that you finished before approval from the officer)',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    startTime: daysFromNow(5, 10, 0),
    endTime: daysFromNow(5, 11, 30),
    room: 'Innovation Center Lab 1',
    speakerIds: ['spk-2'],
    type: 'workshop',
    status: 'not-started',
    requiresStamp: true,
  },
  {
    id: 'ses-14',
    eventId: 'evt-7',
    title: 'WordPress on AWS',
    description: 'Learn how to host your WordPress site on AWS infrastructure. (Note: You need to show your work that you finished before approval from the officer)',
    startTime: daysFromNow(5, 12, 30),
    endTime: daysFromNow(5, 14, 0),
    room: 'Innovation Center Lab 1',
    speakerIds: ['spk-3'],
    type: 'workshop',
    status: 'not-started',
    requiresStamp: true,
  },
  {
    id: 'ses-15',
    eventId: 'evt-7',
    title: 'Notion Productivity',
    description: 'Organize your workflows and projects using Notion templates and features. (Note: You need to show your work that you finished before approval from the officer)',
    startTime: daysFromNow(5, 14, 0),
    endTime: daysFromNow(5, 15, 0),
    room: 'Innovation Center Lab 2',
    speakerIds: ['spk-1'],
    type: 'workshop',
    status: 'not-started',
    requiresStamp: true,
  },
];

/**
 * Some seed stamps to demo the feature.
 */
export const seedStamps: Stamp[] = [
  {
    id: 'stp-1',
    sessionId: 'ses-4',
    attendeeId: 'per-2',
    approvedBy: 'per-1',
    approvedAt: daysFromNow(-1),
    status: 'approved',
  },
  {
    id: 'stp-2',
    sessionId: 'ses-7',
    attendeeId: 'per-2',
    approvedBy: 'per-1',
    approvedAt: daysFromNow(-1),
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
    registeredAt: daysFromNow(-5),
  },
  {
    id: 'reg-2',
    eventId: 'evt-2',
    personId: 'per-1',
    rsvp: 'going',
    checkedIn: false,
    registeredAt: daysFromNow(-5),
  },
  {
    id: 'reg-3',
    eventId: 'evt-1',
    personId: 'per-2',
    rsvp: 'going',
    checkedIn: false,
    registeredAt: daysFromNow(-4),
  },
  {
    id: 'reg-4',
    eventId: 'evt-2',
    personId: 'per-2',
    rsvp: 'going',
    checkedIn: false,
    registeredAt: daysFromNow(-4),
  },
  {
    id: 'reg-5',
    eventId: 'evt-1',
    personId: 'per-3',
    rsvp: 'going',
    checkedIn: false,
    registeredAt: daysFromNow(-3),
  },
  {
    id: 'reg-6',
    eventId: 'evt-3',
    personId: 'per-4',
    rsvp: 'going',
    checkedIn: false,
    registeredAt: daysFromNow(-2),
  },
  {
    id: 'reg-7',
    eventId: 'evt-1',
    personId: 'per-5',
    rsvp: 'interested',
    checkedIn: false,
    registeredAt: daysFromNow(-1),
  },
];
