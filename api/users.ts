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
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import nodemailer from 'nodemailer';

/**
 * Accounts API (single-table DynamoDB, entityType = 'user', id = person id).
 *
 * GET  /api/users                 → all accounts (no password hashes)
 *   The first admin ("awsapc.admin") is created from ADMIN_PASSWORD when there are no accounts.
 * GET  /api/users?id=per-1        → one account
 * POST /api/users?action=signup   → create a pending account
 * POST /api/users?action=login    → sign in (approved accounts only)
 * POST /api/users?action=password → change password (clears "must change password")
 * POST /api/users?action=forgot-password → request password reset email with 6-digit code & link
 * POST /api/users?action=reset-password  → set new password using code or email link token
 * POST /api/users?action=create   → { actorId, account } admin creates an approved account with a
 *                                   temporary password that must be changed at first sign-in
 * POST /api/users?action=reset    → { actorId, id, newPassword } admin sets a temporary password
 * POST /api/users?action=connect | connect-respond | connect-cancel | disconnect → { actorId, id, accept? } connection requests
 * POST /api/users?action=award   → { actorId, id, badge, eventId?, note? } admin awards a badge
 * POST /api/users?action=unaward → { actorId, id, awardId } admin takes it back
 * PUT  /api/users?id=per-1        → { changes, actorId } profile / admin changes
 * DELETE /api/users?id=per-1&actorId=per-9 → delete an account (admin only)
 */

function awsConfig() {
  const accessKeyId = process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'AWS credentials missing. Please set APP_AWS_ACCESS_KEY_ID and APP_AWS_SECRET_ACCESS_KEY in Vercel Project Settings.'
    );
  }
  return { accessKeyId: accessKeyId.trim(), secretAccessKey: secretAccessKey.trim() };
}

function getDynamoDocClient() {
  const region = process.env.APP_AWS_REGION || process.env.AWS_REGION || 'ap-southeast-1';
  const raw = new DynamoDBClient({
    region,
    credentials: awsConfig(),
  });

  return {
    client: DynamoDBDocumentClient.from(raw, {
      marshallOptions: { removeUndefinedValues: true },
    }),
    tableName: process.env.DYNAMODB_TABLE_NAME || 'aws_events',
  };
}

// ─── Email ────────────────────────────────────────────────────────────────────

interface Mail {
  to: string[];
  subject: string;
  heading: string;
  lines: string[];
  button?: { label: string; path: string };
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function renderHtml(mail: Mail, appUrl: string): string {
  const button = mail.button
    ? `<p style="margin:24px 0"><a href="${esc(appUrl + mail.button.path)}" style="background:#7B2D8E;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block">${esc(mail.button.label)}</a></p>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#F8F4FC;font-family:Segoe UI,Arial,sans-serif;color:#1A0A2E">
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="background:linear-gradient(135deg,#7B2D8E,#A855C8);color:#fff;border-radius:12px 12px 0 0;padding:16px 24px;font-weight:700">AWS SBG-APC Event Tracker</div>
<div style="background:#fff;border-radius:0 0 12px 12px;padding:24px;border:1px solid #E8D5F5;border-top:0">
<h2 style="margin:0 0 12px;font-size:20px">${esc(mail.heading)}</h2>
${mail.lines.map((l) => `<p style="margin:0 0 10px;line-height:1.5">${l}</p>`).join('')}
${button}
<p style="margin:24px 0 0;font-size:12px;color:#6B5B7B">AWS Student Builder Group – Asia Pacific College</p>
</div></div></body></html>`;
}

async function sendUserMail(mail: Mail, appUrl: string): Promise<boolean> {
  const to = [...new Set(mail.to.filter(Boolean).map((e) => e.trim().toLowerCase()))];
  if (to.length === 0) return false;

  const defaultCc = ['aws.apcofficial@gmail.com', 'raibe@student.apc.edu.ph'];
  const envCc = (process.env.NOTIFICATION_CC_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const cc = [...new Set([...defaultCc, ...envCc])];

  const text = [mail.heading, '', ...mail.lines.map((l) => l.replace(/<[^>]+>/g, '')), mail.button ? `\n${mail.button.label}: ${appUrl}${mail.button.path}` : ''].join('\n');
  const html = renderHtml(mail, appUrl);

  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');
  const hasGmail = Boolean(gmailUser && gmailPass);
  const from = process.env.SES_FROM_EMAIL?.trim() || 'notifications@apcsbg.org';
  const provider = (process.env.EMAIL_PROVIDER || 'ses').trim().toLowerCase();
  const useSes = provider !== 'gmail';

  const viaGmail = async () => {
    if (!hasGmail) return false;
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: gmailUser!, pass: gmailPass! } });
    await transporter.sendMail({
      from: `"AWS SBG-APC" <${gmailUser}>`,
      to: to.join(', '),
      ...(cc.length > 0 ? { cc: cc.join(', ') } : {}),
      subject: mail.subject,
      html,
      text,
    });
    return true;
  };

  if (useSes) {
    const sesKey = process.env.SES_ACCESS_KEY_ID?.trim();
    const sesSecret = process.env.SES_SECRET_ACCESS_KEY?.trim();
    const ses = new SESv2Client({
      region: process.env.SES_REGION || process.env.APP_AWS_REGION || process.env.AWS_REGION || 'ap-southeast-1',
      credentials: sesKey && sesSecret ? { accessKeyId: sesKey, secretAccessKey: sesSecret } : awsConfig(),
    });
    try {
      const fromAddress = from.includes('<') ? from : `"AWS SBG-APC" <${from}>`;
      await ses.send(
        new SendEmailCommand({
          FromEmailAddress: fromAddress,
          Destination: {
            ToAddresses: to,
            ...(cc.length > 0 ? { CcAddresses: cc } : {}),
          },
          ReplyToAddresses: ['aws.apcofficial@gmail.com'],
          Content: {
            Simple: {
              Subject: { Data: mail.subject, Charset: 'UTF-8' },
              Body: { Html: { Data: html, Charset: 'UTF-8' }, Text: { Data: text, Charset: 'UTF-8' } },
            },
          },
        })
      );
      return true;
    } catch (err) {
      if (provider !== 'gmail') throw err;
      console.warn('SES send failed, falling back to Gmail:', err);
      return viaGmail();
    }
  }

  if (provider === 'gmail' && hasGmail) return viaGmail();
  return false;
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
  'savedEventIds',
  'tutorialSeen',
  // Name and school details (checked below; the email / login can't be changed here)
  'firstName',
  'middleInitial',
  'lastName',
  'organization',
  'studentId',
];
const OFFICER_FIELDS = ['officerPosition', 'committee', 'subcommittee'];
/** Badges only an admin can give (see src/utils/officerBadges.ts). */
const AWARD_BADGES = ['best-host', 'best-pubmat', 'mvp', 'team-player', 'rising-star'];
const ADMIN_FIELDS = ['role', 'status', 'requestedRole', 'officerHistory', 'rejectionReason', 'partnerOrg', 'email'];

/** Co-organizer staff org name: trimmed, max 60 characters, or null to remove. */
function cleanPartnerOrg(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, 60) : null;
}

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

const SOCIAL_KEYS = ['linkedIn', 'github', 'twitterX', 'website', 'facebook', 'instagram', 'tiktok', 'youtube'];
/** Links only (no javascript:/data:), short, and at most 10 custom ones. */
function cleanSocials(v: unknown) {
  const out: Record<string, any> = {};
  if (!v || typeof v !== 'object') return out;
  const link = (x: unknown) => {
    if (typeof x !== 'string') return undefined;
    const t = x.trim().slice(0, 300);
    return t && !/^(javascript|data|vbscript):/i.test(t) ? t : undefined;
  };
  for (const k of SOCIAL_KEYS) {
    const u = link((v as any)[k]);
    if (u) out[k] = u;
  }
  const custom = Array.isArray((v as any).custom) ? (v as any).custom : [];
  out.custom = custom
    .map((c: any) => ({ label: typeof c?.label === 'string' ? c.label.trim().slice(0, 40) : '', url: link(c?.url) }))
    .filter((c: any) => c.label && c.url)
    .slice(0, 10);
  return out;
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
    (u) =>
      String(u.username || '').toLowerCase() === id ||
      String(u.email || '').toLowerCase() === id ||
      String(u.personalEmail || '').toLowerCase() === id
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

    const host = (req.headers?.['x-forwarded-host'] || req.headers?.host || '') as string;
    const isLocalHost = host.startsWith('localhost') || host.startsWith('127.0.0.1');
    const defaultProto = isLocalHost ? 'http' : 'https';
    const proto = (req.headers?.['x-forwarded-proto'] as string) || defaultProto;
    const detectedUrl = host ? `${proto}://${host}` : '';
    const appUrl = (process.env.APP_URL || detectedUrl).replace(/\/$/, '');

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
      // Remember when they sign in (admins see it); the app tour is offered only
      // on someone's very first sign-in (new accounts, not ones that predate this)
      const now = new Date();
      const since = Date.parse(user.approvedAt || user.createdAt || '') || 0;
      const firstSignIn = !user.lastLoginAt && !user.tutorialSeen && now.getTime() - since < 14 * 24 * 3600 * 1000;
      const signedIn = { ...user, lastLoginAt: now.toISOString(), loginCount: (Number(user.loginCount) || 0) + 1 };
      await client.send(new PutCommand({ TableName: tableName, Item: signedIn }));
      return res.status(200).json({ ...sanitize(signedIn), firstSignIn });
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
      const role = ['admin', 'officer', 'attendee', 'adviser'].includes(account.role)
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
        // Co-organizer staff (partner org) - attendee accounts only
        partnerOrg: role === 'attendee' ? cleanPartnerOrg(account.partnerOrg) : null,
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

    // AWS SBG-APC connections: request → the other person approves or declines
    //   action=connect { actorId, id }          send a request (or accept theirs if they already asked)
    //   action=connect-respond { actorId, id, accept }  approve / decline a request from id
    //   action=connect-cancel { actorId, id }   take back a request you sent
    //   action=disconnect { actorId, id }       remove a connection (both sides)
    if (req.method === 'POST' && ['connect', 'connect-respond', 'connect-cancel', 'disconnect'].includes(action)) {
      const { actorId, id, accept } = req.body || {};
      if (typeof actorId !== 'string' || typeof id !== 'string' || actorId === id) {
        return res.status(400).json({ error: 'Pick someone else to connect with.' });
      }
      const [me, other] = (await Promise.all(
        [actorId, id].map(async (k) => (await client.send(new GetCommand({ TableName: tableName, Key: { id: k } }))).Item),
      )) as any[];
      const active = (u: any) => u?.entityType === 'user' && (u.status ?? 'approved') === 'approved';
      if (!active(me) || !active(other)) return res.status(404).json({ error: 'That account was not found.' });
      const list = (u: any, k: string): string[] => (Array.isArray(u[k]) ? u[k] : []);
      const without = (arr: string[], x: string) => arr.filter((v) => v !== x);
      const withId = (arr: string[], x: string) => (arr.includes(x) ? arr : [...arr, x]);
      const now = new Date().toISOString();
      let status: 'connected' | 'requested' | 'declined' | 'cancelled' | 'removed';

      if (action === 'connect') {
        if (list(me, 'connections').includes(id) && list(other, 'connections').includes(actorId)) {
          status = 'connected';
        } else if (list(me, 'connectionRequests').includes(id)) {
          // They already asked you: connecting accepts it
          me.connections = withId(list(me, 'connections'), id);
          other.connections = withId(list(other, 'connections'), actorId);
          me.connectionRequests = without(list(me, 'connectionRequests'), id);
          other.sentConnectionRequests = without(list(other, 'sentConnectionRequests'), actorId);
          status = 'connected';
        } else {
          other.connectionRequests = withId(list(other, 'connectionRequests'), actorId);
          me.sentConnectionRequests = withId(list(me, 'sentConnectionRequests'), id);
          status = 'requested';
        }
      } else if (action === 'connect-respond') {
        if (!list(me, 'connectionRequests').includes(id)) {
          return res.status(404).json({ error: 'That connection request is no longer waiting.' });
        }
        me.connectionRequests = without(list(me, 'connectionRequests'), id);
        other.sentConnectionRequests = without(list(other, 'sentConnectionRequests'), actorId);
        if (accept) {
          me.connections = withId(list(me, 'connections'), id);
          other.connections = withId(list(other, 'connections'), actorId);
          status = 'connected';
        } else {
          status = 'declined';
        }
      } else if (action === 'connect-cancel') {
        me.sentConnectionRequests = without(list(me, 'sentConnectionRequests'), id);
        other.connectionRequests = without(list(other, 'connectionRequests'), actorId);
        status = 'cancelled';
      } else {
        me.connections = without(list(me, 'connections'), id);
        other.connections = without(list(other, 'connections'), actorId);
        status = 'removed';
      }
      await client.send(new PutCommand({ TableName: tableName, Item: { ...me, updatedAt: now } }));
      await client.send(new PutCommand({ TableName: tableName, Item: { ...other, updatedAt: now } }));
      return res.status(200).json({ status, me: sanitize(me), other: sanitize(other) });
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

    if (req.method === 'POST' && action === 'forgot-password') {
      const { email } = req.body || {};
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Please enter your registered email address.' });
      }
      const users = await scanUsers(client, tableName);
      const user = findByLogin(users, email);
      if (!user) {
        return res.status(200).json({
          success: true,
          message: 'If an account exists with that email, a password reset code and link have been sent.',
        });
      }

      const token = randomBytes(24).toString('hex');
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

      const updated = {
        ...user,
        resetToken: token,
        resetCode: code,
        resetExpiresAt: expiresAt,
        updatedAt: new Date().toISOString(),
      };
      await client.send(new PutCommand({ TableName: tableName, Item: updated }));

      const recipients = [user.email, user.personalEmail].filter(Boolean) as string[];
      try {
        await sendUserMail(
          {
            to: recipients,
            subject: 'Reset your AWS SBG-APC Event Tracker password',
            heading: 'Password Reset Request',
            lines: [
              `Hello ${esc(user.firstName || user.name || 'there')},`,
              `We received a request to reset your password for your AWS SBG-APC Event Tracker account (<strong>${esc(user.email)}</strong>).`,
              'Your 6-digit password reset code is:',
              `<div style="font-size:32px;font-weight:700;letter-spacing:6px;color:#7B2D8E;padding:12px 0">${esc(code)}</div>`,
              'You can enter this code in the app, or click the button below to choose your new password directly:',
              '<span style="color:#6B5B7B;font-size:13px">This code and link are valid for 1 hour. If you did not request this, you can safely ignore this email.</span>',
            ],
            button: {
              label: 'Reset My Password',
              path: `/#/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`,
            },
          },
          appUrl
        );
      } catch (err: any) {
        console.error('Failed to send reset email:', err);
        return res.status(500).json({
          error: `Could not send reset email (${err?.message || 'SES error'}). Please contact the AWS SBG-APC officers.`,
        });
      }

      return res.status(200).json({
        success: true,
        message: `Password reset code sent to ${user.email}. Please check your inbox and spam/junk folder.`,
        ...(isLocalHost ? { devCode: code } : {}),
      });
    }

    if (req.method === 'POST' && action === 'reset-password') {
      const { email, code, newPassword } = req.body || {};
      if (!email || !code || !newPassword) {
        return res.status(400).json({ error: 'Email, reset code, and new password are required.' });
      }
      const pwError = passwordError(newPassword);
      if (pwError) return res.status(400).json({ error: pwError });

      const users = await scanUsers(client, tableName);
      const user = findByLogin(users, String(email));
      if (!user) {
        return res.status(404).json({ error: 'Account not found.' });
      }

      const inputCode = String(code).trim().toLowerCase();
      const validCode = user.resetCode && String(user.resetCode).trim().toLowerCase() === inputCode;
      const validToken = user.resetToken && String(user.resetToken).trim().toLowerCase() === inputCode;

      if (!validCode && !validToken) {
        return res.status(400).json({ error: 'Invalid or incorrect reset code. Please check your email or request a new code.' });
      }

      if (!user.resetExpiresAt || Date.now() > new Date(user.resetExpiresAt).getTime()) {
        return res.status(400).json({ error: 'This reset code has expired. Please request a new one.' });
      }

      const updated = {
        ...user,
        passwordHash: hashPassword(newPassword),
        resetCode: undefined,
        resetToken: undefined,
        resetExpiresAt: undefined,
        mustChangePassword: false,
        passwordChangedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await client.send(new PutCommand({ TableName: tableName, Item: updated }));

      const recipients = [user.email, user.personalEmail].filter(Boolean) as string[];
      try {
        await sendUserMail(
          {
            to: recipients,
            subject: 'Your AWS SBG-APC password was successfully reset',
            heading: 'Password Updated',
            lines: [
              `Hello ${esc(user.firstName || user.name || 'there')},`,
              `Your password for <strong>${esc(user.email)}</strong> was successfully updated.`,
              'You can now sign in with your new password.',
              '<span style="color:#6B5B7B;font-size:13px">If you did not make this change, please contact the AWS SBG-APC officers immediately.</span>',
            ],
            button: { label: 'Sign In Now', path: '/#/login' },
          },
          appUrl
        );
      } catch (e) {
        console.warn('Could not send confirmation email:', e);
      }

      return res.status(200).json({
        success: true,
        message: 'Your password has been successfully reset! You can now sign in.',
      });
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
        // Officer details are only for officers (or set by an admin)
        if (OFFICER_FIELDS.includes(key) && !actorIsAdmin && target.role !== 'officer') continue;
        if (key in changes) updates[key] = changes[key];
      }
      // Name: both parts required, short; the display name follows
      for (const k of ['firstName', 'lastName']) {
        if (k in updates) {
          const v = typeof updates[k] === 'string' ? updates[k].trim() : '';
          if (!v || v.length > 50) return res.status(400).json({ error: 'First and last name are required (up to 50 characters).' });
          updates[k] = v;
        }
      }
      if ('middleInitial' in updates) {
        const mi = typeof updates.middleInitial === 'string' ? updates.middleInitial.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2) : '';
        updates.middleInitial = mi || undefined;
      }
      if (['firstName', 'middleInitial', 'lastName'].some((k) => k in updates)) {
        const first = updates.firstName ?? target.firstName ?? String(target.name || '').split(' ')[0];
        const last = updates.lastName ?? target.lastName ?? '';
        const mi = 'middleInitial' in updates ? updates.middleInitial : target.middleInitial;
        updates.name = formatName(first, mi, last);
      }
      // School / organization for outside attendees; student ID for APC accounts
      const outside = (target.memberType ?? (target.signupType === 'outside' ? 'outside' : 'apc')) === 'outside';
      if ('organization' in updates) {
        if (!outside && !actorIsAdmin) delete updates.organization;
        else {
          const v = typeof updates.organization === 'string' ? updates.organization.trim().slice(0, 100) : '';
          if (!v) return res.status(400).json({ error: 'School / organization is required.' });
          updates.organization = v;
        }
      }
      if ('studentId' in updates) {
        if (outside && !actorIsAdmin) delete updates.studentId;
        else {
          const v = typeof updates.studentId === 'string' ? updates.studentId.trim().slice(0, 20) : '';
          if (!v) return res.status(400).json({ error: 'Student ID is required.' });
          updates.studentId = v;
        }
      }
      if ('personalEmail' in updates) {
        const v = typeof updates.personalEmail === 'string' ? updates.personalEmail.trim() : '';
        if (v && !isEmail(v)) return res.status(400).json({ error: 'Enter a valid personal email.' });
        updates.personalEmail = v || undefined;
      }
      if ('email' in updates) {
        if (!actorIsAdmin) delete updates.email;
        else {
          const v = typeof updates.email === 'string' ? updates.email.trim().toLowerCase() : '';
          if (!v || !isEmail(v)) return res.status(400).json({ error: 'Enter a valid email address.' });
          updates.email = v;
        }
      }
      if ('bio' in updates) updates.bio = typeof updates.bio === 'string' ? updates.bio.slice(0, 500) : '';
      if ('partnerOrg' in updates) updates.partnerOrg = cleanPartnerOrg(updates.partnerOrg);
      // Co-organizer staff are attendee accounts; moving someone to officer/admin drops it
      if ((updates.role ?? target.role) !== 'attendee') updates.partnerOrg = null;
      if ('savedEventIds' in updates) updates.savedEventIds = idList(updates.savedEventIds);
      if ('tutorialSeen' in updates) updates.tutorialSeen = Boolean(updates.tutorialSeen);
      if ('socials' in updates) updates.socials = cleanSocials(updates.socials);
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
