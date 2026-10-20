import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import nodemailer from 'nodemailer';

/**
 * Email notifications through Gmail SMTP (Nodemailer) or Amazon SES.
 *
 * POST /api/notify { type: 'account-reviewed', personId }          → approved / declined (with reason)
 * POST /api/notify { type: 'event-assigned', eventId, personIds }  → officers assigned to an event
 * POST /api/notify { type: 'task-assigned', taskId }               → officers given a task
 * POST /api/notify { type: 'run-reminders', actorId }              → admin runs today's reminders now
 * POST /api/notify { type: 'signup-pending', personId }            → tells the admin a sign-up is waiting
 * POST /api/notify { type: 'after-event' }                         → after-event notices now (the app calls it; max every 5 min)
 * GET  /api/notify  (Vercel Cron, daily 8:00 AM Manila)             → reminders:
 *        - event tomorrow → registered attendees + assigned officers
 *        - event today    → "See you today!"
 *        - task due tomorrow → its officers
 *        - event ended (last 7 days) → to everyone checked in (email + bell): "answer the evaluation
 *          to get your certificate", or "your certificate is ready" if they already answered it
 *
 * Environment variables:
 *   GMAIL_USER          Gmail address (e.g. aws.apcofficial@gmail.com)
 *   GMAIL_APP_PASSWORD  16-character Google App Password (prefers Gmail SMTP if set)
 *   SES_FROM_EMAIL      verified SES sender, e.g. "AWS SBG-APC <notifications@apcsbg.org>"
 *   SES_REGION          SES region (defaults to APP_AWS_REGION / ap-southeast-1)
 *   SES_ACCESS_KEY_ID / SES_SECRET_ACCESS_KEY  optional send-only IAM keys for SES
 *                       (otherwise the app's APP_AWS_* keys are used)
 *   EMAIL_PROVIDER      'ses' or 'gmail' (unset: Gmail when set up, else SES). With 'ses',
 *                       a failed SES send (e.g. sandbox) falls back to Gmail when it's set up.
 *   APP_URL             public app URL for links (defaults to this deployment's host)
 *   CRON_SECRET         protects the daily cron call (Vercel sends it automatically)
 *   ADMIN_NOTIFY_EMAIL  where admin alerts go (new sign-ups, failed emails);
 *                       defaults to aws.apcofficial@gmail.com
 */

const TZ = 'Asia/Manila';
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || 'aws.apcofficial@gmail.com';

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
  const raw = new DynamoDBClient({ region, credentials: awsConfig() });
  return {
    client: DynamoDBDocumentClient.from(raw, { marshallOptions: { removeUndefinedValues: true } }),
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
    ? `<p style="margin:24px 0"><a href="${esc(appUrl + mail.button.path)}" style="background:#7B2D8E;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;display:inline-block">${esc(mail.button.label)}</a></p>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#F8F4FC;font-family:Segoe UI,Arial,sans-serif;color:#1A0A2E">
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="background:linear-gradient(135deg,#7B2D8E,#A855C8);color:#fff;border-radius:12px 12px 0 0;padding:16px 24px;font-weight:700">AWS SBG-APC Event Tracker</div>
<div style="background:#fff;border-radius:0 0 12px 12px;padding:24px;border:1px solid #E8D5F5;border-top:0">
<h2 style="margin:0 0 12px;font-size:20px">${esc(mail.heading)}</h2>
${mail.lines.map((l) => `<p style="margin:0 0 10px;line-height:1.5">${esc(l)}</p>`).join('')}
${button}
<p style="margin:24px 0 0;font-size:12px;color:#6B5B7B">AWS Student Builder Group – Asia Pacific College</p>
</div></div></body></html>`;
}

async function sendMail(mail: Mail, appUrl: string): Promise<boolean> {
  const to = [...new Set(mail.to.filter(Boolean).map((e) => e.trim().toLowerCase()))];
  if (to.length === 0) return false;

  // CC required notification addresses (skip if already in 'to')
  const defaultCc = ['aws.apcofficial@gmail.com', 'raibe@student.apc.edu.ph'];
  const envCc = (process.env.NOTIFICATION_CC_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const cc = [...new Set([...defaultCc, ...envCc])].filter((c) => !to.includes(c));

  const text = [mail.heading, '', ...mail.lines, mail.button ? `\n${mail.button.label}: ${appUrl}${mail.button.path}` : '']
    .join('\n');
  const html = renderHtml(mail, appUrl);

  // Which service sends: EMAIL_PROVIDER = 'ses' | 'gmail' (defaults to 'ses' when AWS credentials exist).
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');
  const hasGmail = Boolean(gmailUser && gmailPass);
  const from = process.env.SES_FROM_EMAIL?.trim() || 'notifications@apcsbg.org';
  const provider = (process.env.EMAIL_PROVIDER || (hasGmail ? 'gmail' : 'ses')).trim().toLowerCase();
  const useSes = provider === 'ses' || (provider !== 'gmail' && Boolean(from));

  const viaGmail = async () => {
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: gmailUser!, pass: gmailPass! } });
    await transporter.sendMail({
      from: `"AWS SBG-APC" <${gmailUser}>`,
      to: to.join(', '),
      ...(cc.length > 0 ? { cc: cc.join(', ') } : {}),
      replyTo: gmailUser,
      subject: mail.subject,
      html,
      text,
    });
    return true;
  };

  if (useSes) {
    // Amazon SES (domain apcsbg.org). Its own send-only keys when set, else the app's AWS keys.
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
          // Replies (e.g. "I fixed my email") go to the org inbox.
          ReplyToAddresses: [ADMIN_NOTIFY_EMAIL],
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
      if (provider === 'ses' || !hasGmail) throw err;
      console.warn('SES send failed, sending through Gmail instead:', err);
      return viaGmail();
    }
  }

  if (hasGmail && provider !== 'ses') return viaGmail();
  return false;
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

async function scanAll(client: DynamoDBDocumentClient, tableName: string): Promise<any[]> {
  const items: any[] = [];
  let ExclusiveStartKey: Record<string, any> | undefined;
  do {
    const page = await client.send(new ScanCommand({ TableName: tableName, ExclusiveStartKey }));
    items.push(...(page.Items || []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

const isEvent = (i: any) => i.entityType === 'event' || (!i.entityType && String(i.id || '').startsWith('evt-'));
const addresses = (u: any) => [u?.email, u?.personalEmail].filter(Boolean) as string[];
const firstName = (u: any) => u?.firstName || String(u?.name || '').split(' ')[0] || 'there';
const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/** YYYY-MM-DD in Manila time. */
function manilaDay(d: Date | string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(d)
  );
}

function whenText(startAt: string, endAt?: string): string {
  const day = new Date(startAt).toLocaleDateString('en-PH', { timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const t = (x: string) => new Date(x).toLocaleTimeString('en-PH', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
  return endAt ? `${day}, ${t(startAt)} – ${t(endAt)}` : `${day}, ${t(startAt)}`;
}

// ─── Messages ─────────────────────────────────────────────────────────────────

function accountMail(u: any): Mail | null {
  if (u.status === 'approved') {
    return {
      to: addresses(u),
      subject: 'Your AWS SBG-APC account is approved',
      heading: `Welcome, ${firstName(u)}!`,
      lines: [
        u.role === 'officer'
          ? 'Your officer account has been approved. You can now sign in and see your Officer Dashboard.'
          : 'Your account has been approved. You can now sign in to join events and collect stamps.',
      ],
      button: { label: 'Sign in', path: '/#/login' },
    };
  }
  if (u.status === 'rejected') {
    return {
      to: addresses(u),
      subject: 'Your AWS SBG-APC sign-up needs another look',
      heading: `Hi ${firstName(u)},`,
      lines: [
        'Your sign-up for the AWS SBG-APC Event Tracker was declined by the admin.',
        u.rejectionReason ? `Reason: ${u.rejectionReason}` : 'No reason was given. Please double-check your details.',
        'You can sign up again with the same email and the corrected details.',
        `Questions? Just reply to this email or write to ${ADMIN_NOTIFY_EMAIL}.`,
      ],
      button: { label: 'Sign up again', path: '/#/signup' },
    };
  }
  return null;
}

function eventAssignedMail(u: any, ev: any): Mail {
  const role = titleCase(ev.officerRoles?.[u.id] || 'Officer');
  return {
    to: addresses(u),
    subject: `You're assigned to ${ev.title}`,
    heading: `Hi ${firstName(u)}, you're on the team!`,
    lines: [
      `You've been assigned to ${ev.title} as ${role}.`,
      `When: ${whenText(ev.startAt, ev.endAt)}`,
      `Where: ${ev.venue || 'TBA'}`,
      "We'll send you a reminder the day before.",
    ],
    button: { label: 'View event', path: `/#/events/${ev.id}` },
  };
}

function taskMail(u: any, task: any, ev: any, kind: 'assigned' | 'due' | 'overdue'): Mail {
  const lines = [
    kind === 'assigned'
      ? `You have a new task: ${task.title}`
      : kind === 'due'
        ? `Reminder: "${task.title}" is due tomorrow.`
        : `"${task.title}" is past its deadline and isn't marked done yet. Please finish it or tell your admin.`,
  ];
  const COMMITTEE: Record<string, string> = {
    secretariat: 'Secretariat', operations: 'Operations', marketing: 'Marketing', technicals: 'Technicals', relations: 'Relations',
  };
  const SUB: Record<string, string> = { creatives: 'Creatives', media: 'Media', finance: 'Finance', documents: 'Documents' };
  if (task.committee) lines.push(`Committee: ${COMMITTEE[task.committee] || task.committee}${task.subcommittee ? ` · ${SUB[task.subcommittee] || task.subcommittee}` : ''}`);
  if (task.kind === 'pubmat' && task.pubmat) {
    const roles = [
      task.pubmat.designeeIds?.includes(u.id) && 'creatives designee',
      task.pubmat.captionWriterIds?.includes(u.id) && 'caption writer',
      task.pubmat.posterIds?.includes(u.id) && 'poster',
    ].filter(Boolean);
    if (roles.length) lines.push(`Your role: ${roles.join(', ')}`);
    if (task.pubmat.postDate) lines.push(`Post date: ${whenText(task.pubmat.postDate)}`);
    if (task.pubmat.captionWriterIds?.includes(u.id)) {
      lines.push('Caption guidelines: https://docs.google.com/document/d/1dMMyBQtYgGwg87Q45XHGTZEVlBsrX366VMgDBryfc1k/edit?usp=sharing');
    }
  } else if (task.description) {
    lines.push(task.description);
  }
  if (task.kind === 'pubmat' && task.pubmat?.details) lines.push(task.pubmat.details);
  if (ev) lines.push(`Event: ${ev.title}`);
  if (task.dueAt) lines.push(`Deadline: ${whenText(task.dueAt)}`);
  return {
    to: addresses(u),
    subject: kind === 'assigned' ? `New task: ${task.title}` : kind === 'due' ? `Due tomorrow: ${task.title}` : `Overdue: ${task.title}`,
    heading: `Hi ${firstName(u)},`,
    lines,
    button: { label: 'Open my tasks', path: '/#/officer' },
  };
}

function eventReminderMail(u: any, ev: any, kind: 'tomorrow' | 'today', isOfficer: boolean): Mail {
  const role = isOfficer ? titleCase(ev.officerRoles?.[u.id] || 'Officer') : '';
  const lines =
    kind === 'tomorrow'
      ? [`${ev.title} is tomorrow!`, `When: ${whenText(ev.startAt, ev.endAt)}`, `Where: ${ev.venue || 'TBA'}`]
      : [`See you today at ${ev.title}!`, `When: ${whenText(ev.startAt, ev.endAt)}`, `Where: ${ev.venue || 'TBA'}`];
  if (isOfficer) lines.push(`You're on duty as ${role}.`);
  else if (kind === 'today') lines.push('Bring your phone to collect your session stamps.');
  return {
    to: addresses(u),
    subject: kind === 'tomorrow' ? `Reminder: ${ev.title} is tomorrow` : `See you today at ${ev.title}!`,
    heading: kind === 'tomorrow' ? `Hi ${firstName(u)}, see you tomorrow!` : `Hi ${firstName(u)}, see you today!`,
    lines,
    button: { label: 'Open the event', path: `/#/events/${ev.id}` },
  };
}

// ─── Reminders (cron) ─────────────────────────────────────────────────────────

// Evaluation rules (keep in sync with src/utils/evaluation.ts and api/registrations.ts)
const EVAL_REQUIRED_FROM = '2026-10-20T00:00:00+08:00';
function evalRequired(ev: any): boolean {
  if (!ev || ev.evaluation?.enabled === false) return false;
  const end = ev.endAt || ev.startAt;
  return Boolean(end) && new Date(end).getTime() >= new Date(EVAL_REQUIRED_FROM).getTime();
}

/**
 * When an event ends, tell everyone who was checked in (bell + email), once each,
 * for events that ended in the last week:
 *  - answered the evaluation (or none needed) → "your certificate is ready"
 *  - not answered yet → "answer the evaluation to get your certificate"
 * Stops at `deadline` (ms) and picks up where it left off next time.
 * Returns emails sent.
 */
async function afterEventNotices(
  client: DynamoDBDocumentClient,
  tableName: string,
  events: any[],
  regs: any[],
  users: Map<string, any>,
  trySend: ((mail: Mail) => Promise<boolean>) | null,
  deadline = Date.now() + 8000,
  /** Everything in the table (sessions and stamps are read from it). */
  items: any[] = [],
): Promise<number> {
  let sent = 0;
  const now = Date.now();
  for (const ev of events) {
    const end = ev.endAt || ev.startAt;
    if (ev.status === 'cancelled' || !end || ev.remindersSent?.certificates) continue;
    const endMs = new Date(end).getTime();
    if (endMs > now || now - endMs > 7 * 24 * 3600 * 1000) continue;
    const needsEval = evalRequired(ev);
    // Events with stamp sessions: the certificate needs every stamp
    const stampSessions = ev.stampsRequired !== false && new Date(end).getTime() >= new Date(EVAL_REQUIRED_FROM).getTime()
      ? items.filter((x: any) => (x.entityType === 'session' || (!x.entityType && String(x.id).startsWith('ses-'))) && x.eventId === ev.id && x.requiresStamp)
      : [];
    const stampsLeft = (personId: string) => {
      if (!stampSessions.length) return [] as string[];
      const got = new Set(
        items
          .filter((x: any) => (x.entityType === 'stamp' || (!x.entityType && String(x.id).startsWith('stp-'))) && x.attendeeId === personId && x.status === 'approved')
          .map((x: any) => x.sessionId),
      );
      return stampSessions.filter((x: any) => !got.has(x.id)).map((x: any) => String(x.title || 'Session'));
    };
    let finished = true;
    for (const r of regs.filter((x) => x.eventId === ev.id && x.checkedIn && !x.afterEventNoticeAt)) {
      if (Date.now() > deadline) {
        finished = false;
        break;
      }
      const u = users.get(r.personId);
      if (!u) continue;
      const askEval = needsEval && !r.evaluatedAt;
      const missing = stampsLeft(r.personId);
      const stampLine = missing.length
        ? `Your certificate also needs all ${stampSessions.length} stamps of this event: you have ${stampSessions.length - missing.length}. Missing: ${missing.join(', ')}. If you joined those sessions, ask the officers to approve your stamps.`
        : '';
      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            id: `ntf-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
            entityType: 'notification',
            personId: u.id,
            kind: askEval ? 'evaluation' : 'certificate',
            title: askEval
              ? `Answer the evaluation for ${ev.title} 📝`
              : missing.length
                ? `Your certificate for ${ev.title} needs all stamps`
                : `Your certificate for ${ev.title} is ready 🎓`,
            message: askEval
              ? `Thanks for coming! Answer the short evaluation to get your certificate. It takes about 2 minutes.${stampLine ? ` ${stampLine}` : ''}`.slice(0, 600)
              : missing.length
                ? stampLine.slice(0, 600)
                : `View or download it from your event pass. Certificate code: ${r.certificateId || '-'}.`,
            link: askEval ? `/events/${ev.id}?evaluate=1` : `/pass?event=${ev.id}`,
            read: false,
            createdAt: new Date().toISOString(),
          },
        })
      );
      const mail: Mail = !askEval && missing.length
        ? {
            to: addresses(u),
            subject: `Your certificate for ${ev.title} needs all stamps`,
            heading: `Thanks for coming, ${firstName(u)}!`,
            lines: [stampLine],
            button: { label: 'Open my event pass', path: `/#/pass?event=${ev.id}` },
          }
        : askEval
        ? {
            to: addresses(u),
            subject: `Answer the evaluation for ${ev.title} to get your certificate`,
            heading: `Thanks for coming, ${firstName(u)}!`,
            lines: [
              `We hope you enjoyed ${ev.title}. Please answer the short evaluation form. It takes about 2 minutes and helps us make the next event better.`,
              'Your Certificate of Participation unlocks as soon as you answer it.',
              ...(stampLine ? [stampLine] : []),
            ],
            button: { label: 'Answer the evaluation', path: `/#/events/${ev.id}?evaluate=1` },
          }
        : {
            to: addresses(u),
            subject: `Your certificate for ${ev.title} is ready`,
            heading: `Congratulations, ${firstName(u)}!`,
            lines: [
              `Thank you for attending ${ev.title}. Your Certificate of Participation is ready.`,
              ...(r.certificateId ? [`Certificate code: ${r.certificateId}`] : []),
              'Open your event pass to view or download it, or share the certificate link so others can check it.',
            ],
            button: { label: 'Get my certificate', path: `/#/pass?event=${ev.id}` },
          };
      if (trySend && (await trySend(mail))) sent++;
      // Remember it per person, so a run cut short continues without sending twice
      r.afterEventNoticeAt = new Date().toISOString();
      await client.send(new PutCommand({ TableName: tableName, Item: { ...r, afterEventNoticeAt: r.afterEventNoticeAt } }));
    }
    if (!finished) break;
    await client.send(
      new PutCommand({
        TableName: tableName,
        Item: { ...ev, remindersSent: { ...(ev.remindersSent || {}), certificates: new Date().toISOString() } },
      })
    );
  }

  return sent;
}

/**
 * Run the after-event notices soon after events end, without waiting for the
 * daily cron: the app calls this (any signed-in page load); at most once every 5 minutes.
 */
async function afterEventSweep(client: DynamoDBDocumentClient, tableName: string, appUrl: string, emailOn: boolean) {
  const marker = (await client.send(new GetCommand({ TableName: tableName, Key: { id: 'sys-after-event-sweep' } }))).Item;
  if (marker?.at && Date.now() - new Date(marker.at).getTime() < 5 * 60 * 1000) return { skipped: 'ran recently', sent: 0 };
  await client.send(new PutCommand({ TableName: tableName, Item: { id: 'sys-after-event-sweep', entityType: 'system', at: new Date().toISOString() } }));
  const items = await scanAll(client, tableName);
  const events = items.filter(isEvent);
  const now = Date.now();
  const due = events.some((ev) => {
    const end = ev.endAt || ev.startAt;
    const endMs = end ? new Date(end).getTime() : NaN;
    return ev.status !== 'cancelled' && !ev.remindersSent?.certificates && endMs <= now && now - endMs <= 7 * 24 * 3600 * 1000;
  });
  if (!due) return { sent: 0 };
  const users = new Map(items.filter((i) => i.entityType === 'user').map((u) => [u.id, u]));
  const regs = items.filter((i) => i.entityType === 'registration');
  const trySend = emailOn
    ? async (mail: Mail) => {
        try {
          return await sendMail(mail, appUrl);
        } catch (err) {
          console.error('After-event email failed:', err);
          return false;
        }
      }
    : null;
  return { sent: await afterEventNotices(client, tableName, events, regs, users, trySend, Date.now() + 8000, items) };
}



/**
 * The daily job. Without email set up (emailOn = false) it still posts the
 * in-app notices (certificates ready, task reminders); event reminder emails
 * are skipped and stay due.
 */
async function runReminders(client: DynamoDBDocumentClient, tableName: string, appUrl: string, emailOn = true) {
  const items = await scanAll(client, tableName);
  const users = new Map(items.filter((i) => i.entityType === 'user').map((u) => [u.id, u]));
  const events = items.filter(isEvent);
  const regs = items.filter((i) => i.entityType === 'registration');
  const tasks = items.filter((i) => i.entityType === 'task');

  const today = manilaDay(new Date());
  const tomorrow = manilaDay(new Date(Date.now() + 24 * 3600 * 1000));
  let sent = 0;
  const failures: string[] = [];
  /** Send one email; a failure is recorded instead of stopping the whole run. */
  const trySend = async (mail: Mail) => {
    if (!emailOn) return false;
    try {
      return await sendMail(mail, appUrl);
    } catch (err: any) {
      failures.push(`${mail.to.join(', ')} - "${mail.subject}": ${err?.message || err}`);
      return false;
    }
  };

  for (const ev of emailOn ? events : []) {
    if (ev.status === 'cancelled' || !ev.startAt) continue;
    const day = manilaDay(ev.startAt);
    const kind = day === tomorrow ? 'tomorrow' : day === today ? 'today' : null;
    if (!kind) continue;
    const flag = kind === 'tomorrow' ? 'dayBefore' : 'dayOf';
    if (ev.remindersSent?.[flag]) continue;

    const officerIds: string[] = ev.officerIds || [];
    const attendeeIds = regs
      .filter((r) => r.eventId === ev.id && (r.rsvp === 'approved' || r.rsvp === 'going'))
      .map((r) => r.personId)
      .filter((id) => !officerIds.includes(id));
    for (const id of officerIds) {
      const u = users.get(id);
      if (u && (await trySend(eventReminderMail(u, ev, kind, true)))) sent++;
    }
    for (const id of attendeeIds) {
      const u = users.get(id);
      if (u && (await trySend(eventReminderMail(u, ev, kind, false)))) sent++;
    }
    await client.send(
      new PutCommand({
        TableName: tableName,
        Item: { ...ev, remindersSent: (ev.remindersSent = { ...(ev.remindersSent || {}), [flag]: new Date().toISOString() }) },
      })
    );
  }

  sent += await afterEventNotices(client, tableName, events, regs, users, emailOn ? trySend : null, Date.now() + 8000, items);

  // Unfinished tasks: a reminder the day before the deadline, then when it's overdue
  // (and every 3 days after) until it's done - bell + email to each assignee.
  const DAY = 24 * 3600 * 1000;
  for (const task of tasks) {
    if (task.status === 'done' || !task.dueAt) continue;
    if (task.approval && task.approval !== 'approved') continue; // officer-added, not approved yet
    const ev = events.find((e) => e.id === task.eventId);
    const dueMs = new Date(task.dueAt).getTime();
    const now = Date.now();
    let kind: 'due' | 'overdue' | null = null;
    if (!task.dueReminderSentAt && manilaDay(task.dueAt) === tomorrow) kind = 'due';
    else if (dueMs < now && (!task.overdueReminderAt || now - new Date(task.overdueReminderAt).getTime() >= 3 * DAY - 3600 * 1000)) kind = 'overdue';
    if (!kind) continue;
    const daysLate = Math.max(1, Math.ceil((now - dueMs) / DAY));
    for (const id of task.assigneeIds || []) {
      const u = users.get(id);
      if (!u) continue;
      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            id: `ntf-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
            entityType: 'notification',
            personId: u.id,
            kind: 'task-assigned',
            title: kind === 'due' ? `Due tomorrow: ${task.title}` : `Overdue: ${task.title}`,
            message:
              kind === 'due'
                ? `Deadline ${whenText(task.dueAt)}. Mark it done on your Officer Dashboard when you finish.`
                : `This task was due ${whenText(task.dueAt)} (${daysLate} day${daysLate === 1 ? '' : 's'} ago) and isn't done yet.`,
            link: '/officer',
            read: false,
            createdAt: new Date().toISOString(),
          },
        }),
      );
      if (await trySend(taskMail(u, task, ev, kind))) sent++;
    }
    const stamp = new Date().toISOString();
    await client.send(
      new PutCommand({
        TableName: tableName,
        Item: kind === 'due' ? { ...task, dueReminderSentAt: stamp } : { ...task, overdueReminderAt: stamp },
      }),
    );
  }
  if (failures.length > 0) {
    await reportToAdmin(
      `${failures.length} reminder email(s) could not be sent`,
      ['These reminder emails failed during the daily run:', ...failures.slice(0, 30)],
      appUrl,
    );
  }
  return sent;
}

/** Plain-language explanation of email errors (SES or Gmail/SMTP). */
function sesErrorText(err: any): string {
  const msg = String(err?.message || err);
  if (/invalid login|badauth|username and password not accepted/i.test(msg)) {
    return 'Gmail authentication failed. Please check GMAIL_USER and ensure GMAIL_APP_PASSWORD is a valid 16-character Google App Password (not standard account password). Details: ' + msg;
  }
  if (/not verified/i.test(msg)) {
    return 'Amazon SES is still in sandbox mode, so it only emails verified addresses. Request production access in the SES console (Account dashboard → Request production access). Details: ' + msg;
  }
  if (/not authorized|AccessDenied/i.test(msg)) {
    return 'The AWS key is not allowed to send email (needs ses:SendEmail). Details: ' + msg;
  }
  return msg;
}

/** Email the admin inbox about something that needs attention. Never throws. */
async function reportToAdmin(subject: string, lines: string[], appUrl: string, button?: Mail['button']) {
  try {
    await sendMail({ to: [ADMIN_NOTIFY_EMAIL], subject: `[AWS SBG-APC] ${subject}`, heading: subject, lines, button }, appUrl);
  } catch (err) {
    console.error('Could not email the admin:', err);
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const host = (req.headers?.['x-forwarded-host'] || req.headers?.host || '') as string;
  const isLocalHost = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  const defaultProto = isLocalHost ? 'http' : 'https';
  const proto = (req.headers?.['x-forwarded-proto'] as string) || defaultProto;
  const detectedUrl = host ? `${proto}://${host}` : '';
  const appUrl = (process.env.APP_URL || detectedUrl).replace(/\/$/, '');
  const hasGmail = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  const notConfigured = !process.env.SES_FROM_EMAIL && !hasGmail;

  try {
    const { client, tableName } = getDynamoDocClient();
    const get = async (id: string) =>
      id ? (await client.send(new GetCommand({ TableName: tableName, Key: { id } }))).Item : undefined;

    // Daily cron
    if (req.method === 'GET') {
      const secret = process.env.CRON_SECRET;
      if (!secret || req.headers?.authorization !== `Bearer ${secret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (notConfigured) {
        // No email set up: still post the in-app notices (certificates, task reminders)
        await runReminders(client, tableName, appUrl, false);
        return res.status(200).json({ sent: 0, skipped: 'Email configuration is not set (GMAIL_USER/GMAIL_APP_PASSWORD or SES_FROM_EMAIL)' });
      }
      try {
        return res.status(200).json({ sent: await runReminders(client, tableName, appUrl) });
      } catch (err: any) {
        await reportToAdmin('The daily reminder job failed', [`Error: ${err?.message || err}`, 'Check the Vercel logs for /api/notify.'], appUrl);
        throw err;
      }
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = req.body || {};
    // After an event ends: evaluation reminders / certificate notices (bell always, email when set up)
    if (body.type === 'after-event') {
      return res.status(200).json(await afterEventSweep(client, tableName, appUrl, !notConfigured));
    }
    if (notConfigured && body.type === 'run-reminders') {
      const actor = await get(body.actorId);
      if (actor?.entityType !== 'user' || actor.role !== 'admin') return res.status(403).json({ error: 'Only an admin can run reminders.' });
      await runReminders(client, tableName, appUrl, false);
      return res.status(200).json({ sent: 0, skipped: 'In-app reminders posted. Email is not set up yet (set GMAIL_USER and GMAIL_APP_PASSWORD, or SES_FROM_EMAIL).' });
    }
    if (notConfigured) {
      return res.status(200).json({ sent: 0, skipped: 'Email is not set up yet (set GMAIL_USER and GMAIL_APP_PASSWORD, or SES_FROM_EMAIL).' });
    }

    let sent = 0;
    switch (body.type) {
      case 'account-reviewed': {
        const u = await get(body.personId);
        if (u?.entityType !== 'user') return res.status(404).json({ error: 'User not found' });
        const mail = accountMail(u);
        if (!mail) break;
        if (addresses(u).length === 0) {
          return res.status(200).json({ sent: 0, skipped: 'This account has no email address.' });
        }
        try {
          if (await sendMail(mail, appUrl)) sent++;
        } catch (err: any) {
          const reason = sesErrorText(err);
          await reportToAdmin(
            `Could not email ${u.name} (${u.status === 'rejected' ? 'decline' : 'approval'} notice)`,
            [`To: ${addresses(u).join(', ')}`, `Error: ${reason}`],
            appUrl,
          );
          return res.status(200).json({ sent: 0, failed: reason });
        }
        return res.status(200).json({ sent, to: addresses(u) });
      }
      case 'event-assigned': {
        const ev = await get(body.eventId);
        if (!ev || !isEvent(ev)) return res.status(404).json({ error: 'Event not found' });
        for (const id of (body.personIds || []) as string[]) {
          if (!(ev.officerIds || []).includes(id)) continue;
          const u = await get(id);
          if (u?.entityType === 'user' && (await sendMail(eventAssignedMail(u, ev), appUrl))) sent++;
        }
        break;
      }
      case 'task-assigned': {
        const task = await get(body.taskId);
        if (task?.entityType !== 'task') return res.status(404).json({ error: 'Task not found' });
        const ev = task.eventId ? await get(task.eventId) : undefined;
        for (const id of task.assigneeIds || []) {
          const u = await get(id);
          if (u?.entityType === 'user' && (await sendMail(taskMail(u, task, ev, 'assigned'), appUrl))) sent++;
        }
        break;
      }
      case 'signup-pending': {
        const u = await get(body.personId);
        if (u?.entityType !== 'user' || u.status !== 'pending') return res.status(404).json({ error: 'No pending sign-up' });
        const type =
          u.requestedRole === 'officer'
            ? `Officer${u.officerPosition ? ` (${titleCase(String(u.officerPosition).replace(/-/g, ' '))}${u.committee ? ` - ${titleCase(u.committee)}` : ''})` : ''}`
            : u.memberType === 'outside'
              ? 'Outside attendee'
              : 'APC student';
        await reportToAdmin(
          `New sign-up waiting for approval: ${u.name}`,
          [
            `Type: ${type}`,
            `Email: ${u.email}${u.personalEmail ? ` (personal: ${u.personalEmail})` : ''}`,
            u.memberType === 'outside' ? `Organization: ${u.organization || '-'}` : `Student ID: ${u.studentId || '-'}`,
          ],
          appUrl,
          { label: 'Review sign-ups', path: '/#/admin' },
        );
        sent = 1;
        break;
      }
      case 'run-reminders': {
        const actor = await get(body.actorId);
        if (actor?.entityType !== 'user' || actor.role !== 'admin') {
          return res.status(403).json({ error: 'Only an admin can run reminders.' });
        }
        sent = await runReminders(client, tableName, appUrl);
        break;
      }
      default:
        return res.status(400).json({ error: 'Unknown notification type' });
    }
    return res.status(200).json({ sent });
  } catch (err: any) {
    console.error('Notify API Error:', err);
    return res.status(500).json({ error: err.message || 'Could not send the email', code: err.name || 'API_ERROR' });
  }
}
