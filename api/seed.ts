import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const CLUB_NAME = 'AWS Student Builder Group - Asia Pacific College';

const initialEvents = [
  {
    id: 'evt-1',
    entityType: 'event',
    title: 'Tech Barangay: AWS x WordPress x Notion',
    description:
      'A comprehensive tech workshop combining AWS cloud services, WordPress web development, and Notion productivity tools. Join us for hands-on sessions covering technical, leadership, career growth, and diversity topics.',
    modality: 'onsite',
    status: 'upcoming',
    tags: ['technical', 'leadership', 'career-growth', 'diversity'],
    startAt: '2026-11-14T01:00:00.000Z',
    endAt: '2026-11-14T09:00:00.000Z',
    venue: 'Asia Pacific College',
    participants: 130,
    participantsEstimated: true,
    capacity: 130,
    speakerIds: ['spk-1', 'spk-2', 'spk-3'],
    officerIds: ['per-2'],
    club: CLUB_NAME,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'evt-2',
    entityType: 'event',
    title: 'Cloud Watch: Demo Day x Spider-Man: Brand New Day',
    description:
      'A hybrid demo day event where students showcase their cloud projects, combined with a creative Spider-Man themed experience. Features technical demonstrations and leadership skill-building activities.',
    modality: 'hybrid',
    status: 'upcoming',
    tags: ['technical', 'leadership'],
    startAt: '2026-10-17T01:00:00.000Z',
    endAt: '2026-10-17T09:00:00.000Z',
    venue: 'Asia Pacific College',
    participants: 30,
    participantsEstimated: true,
    capacity: 50,
    speakerIds: ['spk-1', 'spk-2'],
    officerIds: ['per-2'],
    club: CLUB_NAME,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'evt-3',
    entityType: 'event',
    title: 'AWS SCD Mega Manila 2026 At Asia Pacific College',
    description:
      'The largest AWS Student Cloud Day event in Manila, hosted at Asia Pacific College. A full-day conference covering technical cloud skills, leadership development, career growth pathways, and diversity in tech. Featuring keynotes, workshops, and networking.',
    modality: 'onsite',
    status: 'accomplished',
    tags: ['technical', 'leadership', 'career-growth', 'diversity'],
    startAt: '2026-09-11T01:00:00.000Z',
    endAt: '2026-09-11T09:00:00.000Z',
    venue: 'Asia Pacific College',
    participants: 380,
    participantsEstimated: true,
    capacity: 400,
    speakerIds: ['spk-1', 'spk-2', 'spk-3', 'spk-5'],
    officerIds: ['per-2'],
    club: CLUB_NAME,
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'evt-4',
    entityType: 'event',
    title: 'Org Fair 2026: Introduce AWS and AWS Tools to Students',
    description:
      'Organization fair introducing AWS Student Builder Group to new and current students. Learn about AWS tools, community benefits, and upcoming events. A hybrid event focused on leadership and diversity outreach.',
    modality: 'hybrid',
    status: 'accomplished',
    tags: ['leadership', 'diversity'],
    startAt: '2026-09-03T01:00:00.000Z',
    endAt: '2026-09-03T09:00:00.000Z',
    venue: 'Asia Pacific College',
    participants: 200,
    participantsEstimated: true,
    capacity: 200,
    speakerIds: ['spk-1', 'spk-2'],
    officerIds: ['per-2'],
    club: CLUB_NAME,
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'evt-5',
    entityType: 'event',
    title: 'AWS Mini Org Fair: Introduce AWS and AWS Tools to Froshies',
    description:
      'A dedicated onsite event for freshmen (froshies) to discover the AWS Student Builder Group. Covers leadership skills and promotes diversity in tech through introductory sessions on AWS tools and community activities.',
    modality: 'onsite',
    status: 'accomplished',
    tags: ['leadership', 'diversity'],
    startAt: '2026-07-10T01:00:00.000Z',
    endAt: '2026-07-10T09:00:00.000Z',
    venue: 'Asia Pacific College',
    participants: 100,
    participantsEstimated: true,
    capacity: 120,
    speakerIds: ['spk-1', 'spk-2'],
    officerIds: ['per-2'],
    club: CLUB_NAME,
    createdAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'evt-6',
    entityType: 'event',
    title: 'AWS Launchpad: Core Services Session Operational Briefing',
    description:
      'An onsite operational briefing session covering AWS core services. This technical and leadership-focused session introduces fundamental AWS infrastructure services to club members through hands-on demonstrations and structured learning.',
    modality: 'onsite',
    status: 'accomplished',
    tags: ['technical', 'leadership'],
    startAt: '2026-05-19T01:00:00.000Z',
    endAt: '2026-05-19T09:00:00.000Z',
    venue: 'Asia Pacific College',
    participants: 20,
    participantsEstimated: false,
    capacity: 30,
    speakerIds: ['spk-1', 'spk-3'],
    officerIds: ['per-2'],
    club: CLUB_NAME,
    createdAt: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 'evt-7',
    entityType: 'event',
    title: 'AWS Launchpad: Intro to Cloud and AWS Ecosystem',
    description:
      'A comprehensive introduction to cloud computing and the AWS ecosystem, held at the Asia Pacific College Auditorium. Covers technical fundamentals, leadership in tech, career growth in cloud computing, and diversity topics. Ideal for beginners.',
    modality: 'onsite',
    status: 'accomplished',
    tags: ['technical', 'leadership', 'career-growth', 'diversity'],
    startAt: '2026-05-21T01:00:00.000Z',
    endAt: '2026-05-21T09:00:00.000Z',
    venue: 'Asia Pacific College - Auditorium',
    participants: 170,
    participantsEstimated: true,
    capacity: 200,
    speakerIds: ['spk-1', 'spk-2', 'spk-3'],
    officerIds: ['per-2'],
    club: CLUB_NAME,
    createdAt: '2026-05-01T00:00:00.000Z',
  },
];

const initialSessions = [
  {
    id: 'ses-1',
    entityType: 'session',
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
    entityType: 'session',
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
    entityType: 'session',
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



export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const region = process.env.APP_AWS_REGION || process.env.AWS_REGION || 'ap-southeast-1';
    const accessKeyId = process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
    const tableName = process.env.DYNAMODB_TABLE_NAME || 'aws_events';

    if (!accessKeyId || !secretAccessKey) {
      return res.status(503).json({
        error: 'AWS credentials not configured yet in Vercel.',
      });
    }

    const raw = new DynamoDBClient({
      region,
      credentials: {
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
      },
    });

    const docClient = DynamoDBDocumentClient.from(raw, {
      marshallOptions: { removeUndefinedValues: true },
    });

    const all = [...initialEvents, ...initialSessions];
    const missing: any[] = [];
    for (const item of all) {
      const found = await docClient.send(new GetCommand({ TableName: tableName, Key: { id: item.id } }));
      if (!found.Item) missing.push(item);
    }
    const missingEvents = missing.filter((i) => initialEvents.includes(i));

    // GET: only report what's missing (never writes)
    if (req.method !== 'POST') {
      return res.status(200).json({
        missingEvents: missingEvents.map((e: any) => ({ id: e.id, title: e.title, startAt: e.startAt })),
        missingSessions: missing.length - missingEvents.length,
      });
    }

    // POST: admin only, and only adds what's missing (never overwrites edits)
    const actorId = (req.body || {}).actorId;
    const actor = typeof actorId === 'string' && actorId
      ? (await docClient.send(new GetCommand({ TableName: tableName, Key: { id: actorId } }))).Item
      : undefined;
    if (actor?.entityType !== 'user' || actor.role !== 'admin') {
      return res.status(403).json({ error: 'Only an admin can import the club events.' });
    }
    for (const item of missing) {
      await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
    }
    return res.status(200).json({
      success: true,
      addedEvents: missingEvents.length,
      addedSessions: missing.length - missingEvents.length,
      message: missing.length
        ? `Added ${missingEvents.length} event(s) and ${missing.length - missingEvents.length} session(s). Existing events were not changed.`
        : 'All club events are already in the database.',
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || 'Failed to seed DynamoDB',
    });
  }
}
