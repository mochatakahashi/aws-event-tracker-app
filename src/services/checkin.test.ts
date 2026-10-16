import { beforeEach, describe, expect, it } from 'vitest';
import {
  __resetRegistrations,
  certificateLink,
  checkIn,
  getRegistration,
  registerForEvent,
  toggleCheckIn,
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
    const reg = await registerForEvent('evt-1', 'per-77', 'declined');
    const first = await checkIn(reg.id, 'per-2');
    expect(first.alreadyCheckedIn).toBe(false);
    expect(first.registration.checkedIn).toBe(true);
    expect(first.registration.checkedInBy).toBe('per-2');
    expect(first.registration.rsvp).toBe('going');
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
