import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetRegistrations,
  certificateLink,
  checkIn,
  getRegistration,
  registerForEvent,
  toggleCheckIn,
  normalizeCertificateId,
  verifyCertificate,
  certificateState,
  getEvaluation,
  submitEvaluation,
} from './registrationService';
import {
  __resetNotifications,
  createNotification,
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
} from './notificationService';

beforeEach(() => {
  localStorage.clear();
  __resetRegistrations();
  __resetNotifications();
});

describe('check-in', () => {
  it('checks in once, issues a certificate id, and reports repeats', async () => {
    const reg = await registerForEvent('evt-1', 'per-77');
    const first = await checkIn(reg.id, 'per-2');
    expect(first.alreadyCheckedIn).toBe(false);
    expect(first.registration.checkedIn).toBe(true);
    expect(first.registration.checkedInBy).toBe('per-2');
    expect(first.registration.rsvp).toBe('approved');
    expect(first.registration.certificateId).toMatch(/^CERT-\d{4}-/);
    const again = await checkIn(reg.id, 'per-3');
    expect(again.alreadyCheckedIn).toBe(true);
    expect(again.registration.certificateId).toBe(first.registration.certificateId);
  });

  it('toggles check-in off and on', async () => {
    const reg = await registerForEvent('evt-1', 'per-78');
    expect((await toggleCheckIn(reg.id, 'per-1')).checkedIn).toBe(true);
    expect((await toggleCheckIn(reg.id, 'per-1')).checkedIn).toBe(false);
    expect((await getRegistration(reg.id))?.checkedIn).toBe(false);
  });

  it('fails clearly for an unknown pass', async () => {
    await expect(checkIn('reg-nope', 'per-1')).rejects.toThrow(/not found/);
  });

  it('has no certificate link without the API', async () => {
    expect(await certificateLink('reg-1', 'per-1')).toBeNull();
  });
});

describe('certificate verification', () => {
  it('normalizes typed or scanned IDs', () => {
    expect(normalizeCertificateId(' cert-2026-ab12cd34 ')).toBe('CERT-2026-AB12CD34');
    expect(normalizeCertificateId('https://app/#/verify/CERT-2026-AB12CD34')).toBe('CERT-2026-AB12CD34');
    expect(normalizeCertificateId('hello')).toBe('');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('unlocks only after the event ends, and only for people checked in', () => {
    const ev = { startAt: '2026-11-14T09:00:00+08:00', endAt: '2026-11-14T17:00:00+08:00' };
    const during = new Date('2026-11-14T12:00:00+08:00').getTime();
    const after = new Date('2026-11-15T09:00:00+08:00').getTime();
    expect(certificateState({ checkedIn: true }, ev, during)).toBe('after-event');
    expect(certificateState({ checkedIn: true }, ev, after)).toBe('needs-evaluation');
    expect(certificateState({ checkedIn: true, evaluatedAt: '2026-11-14T16:45:00+08:00' }, ev, after)).toBe('ready');
    expect(certificateState({ checkedIn: true }, { ...ev, evaluation: { enabled: false, questions: [] } }, after)).toBe('ready');
    expect(certificateState({ checkedIn: true }, { startAt: '2026-05-01T09:00:00+08:00', endAt: '2026-05-01T12:00:00+08:00' }, after)).toBe('ready');
    expect(certificateState({ checkedIn: false }, ev, during)).toBe('needs-check-in');
    expect(certificateState({ checkedIn: false }, ev, after)).toBe('none');
  });

  it('says "not yet" before the event ends, then verifies after it', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-14T12:00:00+08:00')); // during evt-1
    const reg = await registerForEvent('evt-1', 'per-1');
    const { registration } = await checkIn(reg.id, 'per-1');
    expect((await verifyCertificate(registration.certificateId!)).status).toBe('not-yet');
    vi.setSystemTime(new Date('2026-11-15T09:00:00+08:00'));
    // Ended, but the evaluation isn't answered yet
    expect((await verifyCertificate(registration.certificateId!)).status).toBe('not-yet');
    const form = await getEvaluation('evt-1', 'per-1');
    expect(form.open).toBe(true);
    const answers = Object.fromEntries(
      form.questions.filter((q) => q.required).map((q) => [q.id, q.type === 'rating' ? 5 : q.type === 'yesno' ? 'yes' : q.options?.[0] ?? 'ok']),
    );
    const done = await submitEvaluation('evt-1', 'per-1', answers);
    expect(done.evaluatedAt).toBeTruthy();
    // Events with stamp sessions also need every stamp
    const { getSessionsByEvent, createStamp, approveStamp } = await import('./sessionService');
    const stampSessions = (await getSessionsByEvent('evt-1')).filter((x) => x.requiresStamp);
    if (stampSessions.length) {
      expect((await verifyCertificate(registration.certificateId!)).status).toBe('not-yet');
      for (const ses of stampSessions) {
        const st = await createStamp({ sessionId: ses.id, attendeeId: 'per-1', status: 'pending' });
        await approveStamp(st.id, 'per-2');
      }
    }
    const ok = await verifyCertificate(registration.certificateId!.toLowerCase());
    expect(ok.valid).toBe(true);
    expect(ok.status).toBe('valid');
    await toggleCheckIn(reg.id, 'per-1');
    expect((await verifyCertificate(registration.certificateId!)).status).toBe('revoked');
    expect((await verifyCertificate('CERT-2026-NOPE1234')).status).toBe('not-found');
    expect((await verifyCertificate('nope')).status).toBe('invalid');
  });
});

describe('in-app notifications', () => {
  it('creates, counts and marks notifications read', async () => {
    await createNotification({ personIds: ['per-9'], kind: 'stamp-approved', title: 'Stamp', message: 'ok' });
    await createNotification({ personIds: ['per-9', 'per-8'], kind: 'task-assigned', title: 'Task', message: 'do it', link: '/officer' });
    expect(await getUnreadCount('per-9')).toBe(2);
    expect(await getUnreadCount('per-8')).toBe(1);
    const list = await getNotifications('per-9');
    expect(list[0].createdAt >= list[1].createdAt).toBe(true);
    await markRead(list[0].id);
    expect(await getUnreadCount('per-9')).toBe(1);
    await markAllRead('per-9');
    expect(await getUnreadCount('per-9')).toBe(0);
    expect(await getUnreadCount('per-8')).toBe(1);
  });
});
