import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const initialEvents = [
  {
    id: 'evt-1',
    title: 'Cloud Watch: Demo Day x Spider-Man: Brand New Day',
    modality: 'hybrid',
    status: 'upcoming',
    tags: ['aws', 'cloud', 'architecture', 'hackathon'],
    venue: 'Asia Pacific College — Multipurpose Hall',
    startAt: '2026-10-17T09:00:00.000Z',
    endAt: '2026-10-17T17:00:00.000Z',
    description: 'Annual flagship student builder demo day showcasing cloud solutions built on AWS.',
    capacity: 250,
    participants: 184,
    speakerIds: ['spk-1', 'spk-2', 'spk-3'],
    officerIds: ['per-1', 'per-2'],
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'evt-2',
    title: 'Tech Barangay: AWS x WordPress x Notion',
    modality: 'onsite',
    status: 'upcoming',
    tags: ['aws', 'devops', 'community'],
    venue: 'Asia Pacific College — Room 408',
    startAt: '2026-11-14T09:00:00.000Z',
    endAt: '2026-11-14T17:00:00.000Z',
    description: 'Community-driven hands-on workshop deploying scalable websites using AWS Lightsail, WordPress, and Notion integrations.',
    capacity: 120,
    participants: 96,
    speakerIds: ['spk-2', 'spk-4'],
    officerIds: ['per-1'],
    imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80',
    createdAt: '2026-09-15T00:00:00.000Z',
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

    for (const evt of initialEvents) {
      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: evt,
        })
      );
    }

    return res.status(200).json({
      success: true,
      message: `Successfully seeded ${initialEvents.length} events into DynamoDB table '${tableName}'!`,
      events: initialEvents,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || 'Failed to seed DynamoDB',
    });
  }
}
