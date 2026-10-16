import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';

/**
 * Accounts API (single-table DynamoDB, entityType = 'user', id = person id).
 *
 * GET  /api/users                 → all accounts (no password hashes)
 * GET  /api/users?id=per-1        → one account
 * POST /api/users?action=signup   → create a pending account
 * POST /api/users?action=login    → sign in (approved accounts only)
 * POST /api/users?action=password → change password
 * PUT  /api/users?id=per-1        → { changes, actorId } profile / admin changes
 */

function getDynamoDocClient() {
  const region = process.env.APP_AWS_REGION || process.env.AWS_REGION || 'ap-southeast-1';
  const accessKeyId = process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'AWS credentials missing. Please set APP_AWS_ACCESS_KEY_ID and APP_AWS_SECRET_ACCESS_KEY in Vercel Project Settings.'
    );
  }

  const raw = new DynamoDBClient({
    region,
    credentials: {
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
    },
  });

  return {
    client: DynamoDBDocumentClient.from(raw, {
      marshallOptions: { removeUndefinedValues: true },
    }),
    tableName: process.env.DYNAMODB_TABLE_NAME || 'aws_events',
  };
}

// ─── Passwords ────────────────────────────────────────────────────────────────

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password: string, stored: string | undefined): boolean {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === candidate.length && timingSafeEqual(candidate, expected);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const POSITIONS = ['president', 'vp-internal', 'vp-external', 'director', 'assistant-director', 'associate'];
const COMMITTEES = ['secretariat', 'operations', 'marketing', 'technicals', 'relations'];
const PROFILE_FIELDS = ['avatarUrl', 'bio', 'socials', 'personalEmail', 'officerPosition', 'committee'];
const ADMIN_FIELDS = ['role', 'status', 'requestedRole'];

const isApcEmail = (email: string) => /^[^\s@]+@(student\.)?apc\.edu\.ph$/i.test(email);
const isEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const needsCommittee = (p?: string) => p === 'director' || p === 'assistant-director' || p === 'associate';

function sanitize(item: any) {
  if (!item) return item;
  const { passwordHash: _hash, entityType: _type, id: _id, ...user } = item;
  void _hash;
  void _type;
  void _id;
  return user;
}

function formatName(first: string, mi: string | undefined, last: string) {
  return [first.trim(), mi ? `${mi}.` : '', last.trim()].filter(Boolean).join(' ');
}

/** Demo accounts created the first time the users table is empty. */
const DEMO_USERS = [
  { personId: 'per-1', username: 'admin', password: 'admin123', name: 'Admin User', firstName: 'Admin', lastName: 'User', email: 'admin@awssbg-apc.com', role: 'admin', status: 'approved', memberType: 'apc' },
  { personId: 'per-2', username: 'rj', password: 'rj123', name: 'Rodmina Jhoy Ibe', firstName: 'Rodmina Jhoy', lastName: 'Ibe', email: 'rodmina@apc.edu.ph', role: 'officer', status: 'approved', memberType: 'apc', studentId: 'APC-2024-001' },
  { personId: 'per-3', username: 'sofia', password: 'sofia123', name: 'Sofia Rossi', firstName: 'Sofia', lastName: 'Rossi', email: 'sofia@apc.edu.ph', role: 'attendee', status: 'approved', memberType: 'apc', studentId: 'APC-2024-042' },
  { personId: 'per-4', username: 'kenji', password: 'kenji123', name: 'Kenji Tanaka', firstName: 'Kenji', lastName: 'Tanaka', email: 'kenji@apc.edu.ph', role: 'attendee', status: 'approved', memberType: 'apc', studentId: 'APC-2024-088' },
  { personId: 'per-5', username: 'grace', password: 'grace123', name: 'Grace Adeyemi', firstName: 'Grace', lastName: 'Adeyemi', email: 'grace@apc.edu.ph', role: 'attendee', status: 'approved', memberType: 'apc', studentId: 'APC-2024-105' },
];

async function scanUsers(client: DynamoDBDocumentClient, tableName: string): Promise<any[]> {
  const items: any[] = [];
  let ExclusiveStartKey: Record<string, any> | undefined;
  do {
    const page = await client.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: 'entityType = :t',
        ExpressionAttributeValues: { ':t': 'user' },
        ExclusiveStartKey,
      })
    );
    items.push(...(page.Items || []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  if (items.length === 0) {
    const now = new Date().toISOString();
    for (const demo of DEMO_USERS) {
      const { password, ...rest } = demo;
      const item = { ...rest, id: demo.personId, entityType: 'user', passwordHash: hashPassword(password), createdAt: now };
      await client.send(new PutCommand({ TableName: tableName, Item: item }));
      items.push(item);
    }
  }
  return items;
}

function findByLogin(users: any[], login: string) {
  const id = login.trim().toLowerCase();
  return users.find(
    (u) => String(u.username || '').toLowerCase() === id || String(u.email || '').toLowerCase() === id
  );
}

function validateSignUp(d: any): string | null {
  const type = d?.accountType;
  if (!['apc-student', 'outside', 'officer'].includes(type)) return 'Please choose how you are signing up.';
  if (!d.firstName?.trim() || !d.lastName?.trim()) return 'Please enter your first and last name.';
  if (d.middleInitial && !/^[A-Za-z]{1,2}\.?$/.test(String(d.middleInitial).trim())) {
    return 'Middle initial should be one or two letters.';
  }
  const email = String(d.email || '').trim();
  if (!isEmail(email)) return 'Please enter a valid email address.';
  if (type !== 'outside' && !isApcEmail(email)) return 'Please use your APC email (@apc.edu.ph or @student.apc.edu.ph).';
  if (d.personalEmail && !isEmail(String(d.personalEmail).trim())) return 'Please enter a valid personal email.';
  if (type !== 'outside' && !d.studentId?.trim()) return 'Please enter your APC student ID.';
  if (type === 'outside' && !d.organization?.trim()) return 'Please enter your school, company or organization.';
  if (type === 'officer') {
    if (!POSITIONS.includes(d.officerPosition)) return 'Please select your officer position.';
    if (needsCommittee(d.officerPosition) && !COMMITTEES.includes(d.committee)) return 'Please select your committee.';
  }
  if (typeof d.password !== 'string' || d.password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { client, tableName } = getDynamoDocClient();
    const action = typeof req.query.action === 'string' ? req.query.action : '';

    if (req.method === 'GET') {
      const users = await scanUsers(client, tableName);
      const { id } = req.query;
      if (id && typeof id === 'string') {
        const found = users.find((u) => u.id === id);
        if (!found) return res.status(404).json({ error: 'User not found' });
        return res.status(200).json(sanitize(found));
      }
      return res.status(200).json(users.map(sanitize));
    }

    if (req.method === 'POST' && action === 'login') {
      const { username, password } = req.body || {};
      if (!username || !password) return res.status(400).json({ error: 'Email and password are required.' });
      const users = await scanUsers(client, tableName);
      const user = findByLogin(users, String(username));
      if (!user || !verifyPassword(String(password), user.passwordHash)) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      if (user.status === 'pending') {
        return res.status(403).json({ error: 'Your account is waiting for admin approval. Please try again once it is approved.' });
      }
      if (user.status === 'rejected') {
        return res.status(403).json({ error: 'Your sign-up was declined by an admin. Please contact the AWS SBG-APC officers.' });
      }
      return res.status(200).json(sanitize(user));
    }

    if (req.method === 'POST' && action === 'signup') {
      const d = req.body || {};
      const invalid = validateSignUp(d);
      if (invalid) return res.status(400).json({ error: invalid });

      const users = await scanUsers(client, tableName);
      const email = String(d.email).trim().toLowerCase();
      const existing = findByLogin(users, email);
      if (existing && existing.status !== 'rejected') {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const isOfficer = d.accountType === 'officer';
      const isOutside = d.accountType === 'outside';
      const mi = d.middleInitial ? String(d.middleInitial).replace(/\./g, '').trim().toUpperCase() : undefined;
      const personId = existing?.id || `per-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const item = {
        id: personId,
        entityType: 'user',
        personId,
        username: email,
        email,
        name: formatName(d.firstName, mi, d.lastName),
        firstName: String(d.firstName).trim(),
        middleInitial: mi,
        lastName: String(d.lastName).trim(),
        personalEmail: isOfficer && d.personalEmail ? String(d.personalEmail).trim() : undefined,
        role: 'attendee',
        requestedRole: isOfficer ? 'officer' : 'attendee',
        status: 'pending',
        memberType: isOutside ? 'outside' : 'apc',
        studentId: isOutside ? undefined : String(d.studentId).trim(),
        organization: isOutside ? String(d.organization).trim() : undefined,
        officerPosition: isOfficer ? d.officerPosition : undefined,
        committee: isOfficer && needsCommittee(d.officerPosition) ? d.committee : undefined,
        passwordHash: hashPassword(d.password),
        createdAt: new Date().toISOString(),
      };
      await client.send(new PutCommand({ TableName: tableName, Item: item }));
      return res.status(201).json(sanitize(item));
    }

    if (req.method === 'POST' && action === 'password') {
      const { id, currentPassword, newPassword } = req.body || {};
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters.' });
      }
      const result = await client.send(new GetCommand({ TableName: tableName, Key: { id } }));
      const user = result.Item;
      if (!user || user.entityType !== 'user' || !verifyPassword(String(currentPassword || ''), user.passwordHash)) {
        return res.status(401).json({ error: 'Your current password is incorrect.' });
      }
      await client.send(
        new PutCommand({ TableName: tableName, Item: { ...user, passwordHash: hashPassword(newPassword) } })
      );
      return res.status(200).json({ success: true });
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const { changes = {}, actorId } = req.body || {};
      if (!id || typeof id !== 'string') return res.status(400).json({ error: 'User id is required' });

      const users = await scanUsers(client, tableName);
      const target = users.find((u) => u.id === id);
      if (!target) return res.status(404).json({ error: 'User not found' });
      const actor = users.find((u) => u.id === actorId);
      const actorIsAdmin = actor?.role === 'admin' && (actor.status ?? 'approved') === 'approved';

      const wantsAdminFields = Object.keys(changes).some((k) => ADMIN_FIELDS.includes(k));
      if (wantsAdminFields && !actorIsAdmin) {
        return res.status(403).json({ error: 'Only an admin can change roles or approve accounts.' });
      }
      if (!actorIsAdmin && actorId !== id) {
        return res.status(403).json({ error: 'You can only edit your own profile.' });
      }

      const allowed = actorIsAdmin ? [...PROFILE_FIELDS, ...ADMIN_FIELDS] : PROFILE_FIELDS;
      const updates: Record<string, any> = {};
      for (const key of allowed) {
        if (key in changes) updates[key] = changes[key];
      }
      if (updates.status === 'approved' && target.status !== 'approved') {
        updates.approvedAt = new Date().toISOString();
        updates.approvedBy = actorId;
      }

      const merged = { ...target, ...updates, id, entityType: 'user', updatedAt: new Date().toISOString() };
      await client.send(new PutCommand({ TableName: tableName, Item: merged }));
      return res.status(200).json(sanitize(merged));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Users API Error:', err);
    return res.status(500).json({
      error: err.message || 'Internal server error',
      code: err.name || 'API_ERROR',
    });
  }
}
