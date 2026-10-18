import { describe, it, expect, beforeEach } from 'vitest';
import {
  getRegistrationsByEvent,
  getRegistrationsByPerson,
  findRegistration,
  registerForEvent,
  cancelRegistration,
  toggleCheckIn,
  countRegistrations,
  __resetRegistrations,
  reviewRegistrations,
} from './registrationService';

describe('registrationService', () => {
  beforeEach(() => {
    __resetRegistrations();
  });

  it('lists registrations for an event', async () => {
    const regs = await getRegistrationsByEvent('evt-1');
    // Seed has 4 registrations for evt-1.
    expect(regs).toHaveLength(4);
  });

  it('lists registrations for a person', async () => {
    const regs = await getRegistrationsByPerson('per-1');
    expect(regs.length).toBeGreaterThanOrEqual(2);
  });

  it('registers a person for an event and finds it', async () => {
    const created = await registerForEvent('evt-4', 'per-1');
    expect(created.rsvp).toBe('pending');
    expect(created.eventId).toBe('evt-4');
    expect(await findRegistration('evt-4', 'per-1')).not.toBeNull();
  });

  it('does not duplicate when registering twice; a declined person can ask again', async () => {
    const reg = await registerForEvent('evt-4', 'per-1');
    const before = await countRegistrations('evt-4');
    await registerForEvent('evt-4', 'per-1');
    expect(await countRegistrations('evt-4')).toBe(before);
    await reviewRegistrations([reg.id], 'declined', 'per-1');
    expect((await findRegistration('evt-4', 'per-1'))?.rsvp).toBe('declined');
    await registerForEvent('evt-4', 'per-1');
    expect((await findRegistration('evt-4', 'per-1'))?.rsvp).toBe('pending');
    await reviewRegistrations([reg.id], 'approved', 'per-1');
    expect((await findRegistration('evt-4', 'per-1'))?.rsvp).toBe('approved');
  });

  it('cannot cancel after check-in', async () => {
    const reg = await registerForEvent('evt-5', 'per-1');
    await toggleCheckIn(reg.id);
    await expect(cancelRegistration('evt-5', 'per-1')).rejects.toThrow(/already checked in/);
  });

  it('cancels a registration', async () => {
    expect(await cancelRegistration('evt-1', 'per-1')).toBe(true);
    expect(await findRegistration('evt-1', 'per-1')).toBeNull();
  });

  it('toggles check-in', async () => {
    const updated = await toggleCheckIn('reg-1');
    expect(updated.checkedIn).toBe(true);
  });
});
