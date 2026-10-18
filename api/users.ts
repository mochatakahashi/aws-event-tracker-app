import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

/**
 * Accounts API (single-table DynamoDB, entityType = 'user', id = person id).
 *
 * GET  /api/users                 → all accounts (no password hashes)
 *   The first admin ("awsapc.admin") is created from ADMIN_PASSWORD when there are no accounts.
 * GET  /api/users?id=per-1        → one account
 * POST /api/users?action=signup   → create a pending account
 * POST /api/users?action=login    → sign in (approved accounts only)
 * POST /api/users?action=password → change password (clears "must change password")
 * POST /api/users?action=create   → { actorId, account } admin creates an approved account with a
 *                                   temporary password that must be changed at first sign-in
 * POST /api/users?action=reset    → { actorId, id, newPassword } admin sets a temporary password
 * POST /api/users?action=award   → { actorId, id, badge, eventId?, note? } admin awards a badge
 * POST /api/users?action=unaward → { actorId, id, awardId } admin takes it back
 * PUT  /api/users?id=per-1        → { changes, actorId } profile / admin changes
 * DELETE /api/users?id=per-1&actorId=per-9 → delete an account (admin only)
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
const SUBCOMMITTEES: Record<string, string[]> = { marketing: ['creatives', 'media'], secretariat: ['finance', 'documents'] };
const PROFILE_FIELDS = [
  'avatarUrl',
  'bio',
  'socials',
  'personalEmail',
  'officerPosition',
  'committee',
  'subcommittee',
  'connections',
  'savedEventIds',
  'tutorialSeen',
];
/** Badges only an admin can give (see src/utils/officerBadges.ts). */
const AWARD_BADGES = ['best-host', 'best-pubmat', 'mvp', 'team-player', 'rising-star'];
const ADMIN_FIELDS = ['role', 'status', 'requestedRole', 'officerHistory', 'rejectionReason'];

const isApcEmail = (email: string) => /^[^\s@]+@(student\.)?apc\.edu\.ph$/i.test(email);
const isEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const needsCommittee = (p?: string) => p === 'director' || p === 'assistant-director' || p === 'associate';

/** At least 6 characters with a capital letter, a small letter, a number and a symbol. */
function passwordError(pw: unknown): string | null {
  if (typeof pw !== 'string') return 'Please enter a password.';
  const missing: string[] = [];
  if (pw.length < 6) missing.push('at least 6 characters');
  if (!/[A-Z]/.test(pw)) missing.push('one capital letter (A–Z)');
  if (!/[a-z]/.test(pw)) missing.push('one small letter (a–z)');
  if (!/[0-9]/.test(pw)) missing.push('one number (0–9)');
  if (!/[^A-Za-z0-9\s]/.test(pw)) missing.push('one special symbol (e.g. ! @ # $ %)');
  return missing.length ? `Password needs: ${missing.join(', ')}.` : null;
}

/** Keep list fields (connections, saved events) as short lists of ids. */
function idList(v: unknown): string[] {
  return Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === 'string' && x.length < 100))].slice(0, 1000) : [];
}

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

/**
 * The first admin account. It is created the first time the users table is
 * empty, with the password from the ADMIN_PASSWORD environment variable
 * (never stored in the code). Change it later on the Profile page.
 */
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'awsapc.admin';

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

  if (items.length === 0 && process.env.ADMIN_PASSWORD) {
    const item = {
      id: 'per-1',
      personId: 'per-1',
      entityType: 'user',
      username: ADMIN_USERNAME,
      email: process.env.ADMIN_EMAIL || 'aws.apcofficial@gmail.com',
      name: 'AWS SBG-APC Admin',
      firstName: 'AWS SBG-APC',
      lastName: 'Admin',
      role: 'admin',
      status: 'approved',
      memberType: 'apc',
      passwordHash: hashPassword(process.env.ADMIN_PASSWORD),
      createdAt: new Date().toISOString(),
    };
    await client.send(new PutCommand({ TableName: tableName, Item: item }));
    items.push(item);
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
    if (d.subcommittee && !(SUBCOMMITTEES[d.committee] || []).includes(d.subcommittee)) {
      return 'Please pick a sub-committee that belongs to your committee.';
    }
  }
  return passwordError(d.password);
}

/** Account record from sign-up style data (shared by sign-up and admin create). */
function buildAccount(d: any, personId: string) {
  const isOfficer = d.accountType === 'officer';
  const isOutside = d.accountType === 'outside';
  const mi = d.middleInitial ? String(d.middleInitial).replace(/\./g, '').trim().toUpperCase() : undefined;
  const email = String(d.email).trim().toLowerCase();
  const committee = isOfficer && needsCommittee(d.officerPosition) ? d.committee : undefined;
  return {
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
    signupType: d.accountType,
    memberType: isOutside ? 'outside' : 'apc',
    studentId: isOutside ? undefined : String(d.studentId).trim(),
    organization: isOutside ? String(d.organization).trim() : undefined,
    officerPosition: isOfficer ? d.officerPosition : undefined,
    committee,
    subcommittee: committee && (SUBCOMMITTEES[committee] || []).includes(d.subcommittee) ? d.subcommittee : undefined,
    passwordHash: hashPassword(d.password),
    createdAt: new Date().toISOString(),
  };
}

async function getAdmin(client: DynamoDBDocumentClient, tableName: string, actorId: unknown) {
  if (typeof actorId !== 'string' || !actorId) return null;
  const actor = (await client.send(new GetCommand({ TableName: tableName, Key: { id: actorId } }))).Item;
  return actor?.entityType === 'user' && actor.role === 'admin' && (actor.status ?? 'approved') === 'approved' ? actor : null;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
      if (users.length === 0) {
        return res.status(503).json({
          error: 'No admin account yet. Set ADMIN_PASSWORD in Vercel (Settings → Environment Variables) and redeploy.',
        });
      }
      const user = findByLogin(users, String(username));
      if (!user || !verifyPassword(String(password), user.passwordHash)) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      if (user.status === 'pending') {
        return res.status(403).json({ error: 'Your account is waiting for admin approval. Please try again once it is approved.' });
      }
      if (user.status === 'rejected') {
        return res.status(403).json({
          error: user.rejectionReason
            ? `Your sign-up was declined: ${user.rejectionReason}. You can sign up again with the correct details.`
            : 'Your sign-up was declined by an admin. Please contact the AWS SBG-APC officers.',
        });
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

      const personId = existing?.id || `per-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const item = {
        ...buildAccount(d, personId),
        role: 'attendee',
        requestedRole: d.accountType === 'officer' ? 'officer' : 'attendee',
        status: 'pending',
      };
      await client.send(new PutCommand({ TableName: tableName, Item: item }));
      return res.status(201).json(sanitize(item));
    }

    if (req.method === 'POST' && action === 'create') {
      const { actorId, account } = req.body || {};
      if (!(await getAdmin(client, tableName, actorId))) {
        return res.status(403).json({ error: 'Only an admin can create accounts.' });
      }
      const invalid = validateSignUp(account);
      if (invalid) return res.status(400).json({ error: invalid });
      const users = await scanUsers(client, tableName);
      const email = String(account.email).trim().toLowerCase();
      const existing = findByLogin(users, email);
      if (existing && existing.status !== 'rejected') {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }
      const personId = existing?.id || `per-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const role = ['admin', 'officer', 'attendee'].includes(account.role)
        ? account.role
        : account.accountType === 'officer'
          ? 'officer'
          : 'attendee';
      const item = {
        ...buildAccount(account, personId),
        role,
        requestedRole: null,
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: actorId,
        createdBy: actorId,
        mustChangePassword: true,
      };
      await client.send(new PutCommand({ TableName: tableName, Item: item }));
      return res.status(201).json(sanitize(item));
    }

    if (req.method === 'POST' && action === 'reset') {
      const { actorId, id, newPassword } = req.body || {};
      if (!(await getAdmin(client, tableName, actorId))) {
        return res.status(403).json({ error: 'Only an admin can reset passwords.' });
      }
      const pwError = passwordError(newPassword);
      if (pwError) return res.status(400).json({ error: pwError });
      const user = (await client.send(new GetCommand({ TableName: tableName, Key: { id } }))).Item;
      if (!user || user.entityType !== 'user') return res.status(404).json({ error: 'User not found' });
      const updated = { ...user, passwordHash: hashPassword(newPassword), mustChangePassword: true, updatedAt: new Date().toISOString() };
      await client.send(new PutCommand({ TableName: tableName, Item: updated }));
      return res.status(200).json(sanitize(updated));
    }

    // Admin-awarded badges (e.g. Best in Pubmat for one event)
    if (req.method === 'POST' && (action === 'award' || action === 'unaward')) {
      const { actorId, id, badge, eventId, note, awardId } = req.body || {};
      if (!(await getAdmin(client, tableName, actorId))) {
        return res.status(403).json({ error: 'Only an admin can award badges.' });
      }
      const user = (await client.send(new GetCommand({ TableName: tableName, Key: { id } }))).Item;
      if (!user || user.entityType !== 'user') return res.status(404).json({ error: 'User not found' });
      const awards: any[] = Array.isArray(user.awards) ? user.awards : [];
      let next: any[];
      if (action === 'award') {
        if (!AWARD_BADGES.includes(badge)) return res.status(400).json({ error: 'Unknown badge.' });
        if (typeof eventId === 'string' && eventId && awards.some((a) => a.badge === badge && a.eventId === eventId)) {
          return res.status(409).json({ error: 'They already have this badge for that event.' });
        }
        next = [
          ...awards,
          {
            id: `awd-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
            badge,
            eventId: typeof eventId === 'string' && eventId ? eventId.slice(0, 100) : undefined,
            note: typeof note === 'string' && note.trim() ? note.trim().slice(0, 200) : undefined,
            awardedBy: actorId,
            awardedAt: new Date().toISOString(),
          },
        ];
      } else {
        next = awards.filter((a) => a.id !== awardId);
      }
      const updated = { ...user, awards: next, updatedAt: new Date().toISOString() };
      await client.send(new PutCommand({ TableName: tableName, Item: updated }));
      return res.status(200).json(sanitize(updated));
    }

    if (req.method === 'POST' && action === 'password') {
      const { id, currentPassword, newPassword } = req.body || {};
      const pwError = passwordError(newPassword);
      if (pwError) return res.status(400).json({ error: pwError });
      if (newPassword === currentPassword) {
        return res.status(400).json({ error: 'Your new password must be different from the current one.' });
      }
      const result = await client.send(new GetCommand({ TableName: tableName, Key: { id } }));
      const user = result.Item;
      if (!user || user.entityType !== 'user' || !verifyPassword(String(currentPassword || ''), user.passwordHash)) {
        return res.status(401).json({ error: 'Your current password is incorrect.' });
      }
      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: { ...user, passwordHash: hashPassword(newPassword), mustChangePassword: false, passwordChangedAt: new Date().toISOString() },
        })
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
      if ('connections' in updates) updates.connections = idList(updates.connections).filter((x) => x !== id);
      if ('savedEventIds' in updates) updates.savedEventIds = idList(updates.savedEventIds);
      if ('tutorialSeen' in updates) updates.tutorialSeen = Boolean(updates.tutorialSeen);
      if (updates.status === 'approved' && target.status !== 'approved') {
        updates.approvedAt = new Date().toISOString();
        updates.approvedBy = actorId;
      }

      const merged = { ...target, ...updates, id, entityType: 'user', updatedAt: new Date().toISOString() };
      await client.send(new PutCommand({ TableName: tableName, Item: merged }));
      return res.status(200).json(sanitize(merged));
    }

    if (req.method === 'DELETE') {
      const id = typeof req.query.id === 'string' ? req.query.id : '';
      const actorId = typeof req.query.actorId === 'string' ? req.query.actorId : '';
      const users = await scanUsers(client, tableName);
      const actor = users.find((u) => u.id === actorId);
      if (actor?.role !== 'admin' || (actor.status ?? 'approved') !== 'approved') {
        return res.status(403).json({ error: 'Only an admin can delete accounts.' });
      }
      if (id === actorId) return res.status(400).json({ error: "You can't delete your own account." });
      if (!users.some((u) => u.id === id)) return res.status(404).json({ error: 'User not found' });
      await client.send(new DeleteCommand({ TableName: tableName, Key: { id } }));
      return res.status(200).json({ success: true, id });
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
