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
} from './registrationService';

describe('registrationService', () => {
  beforeEach(() => {
    __resetRegistrations();
  });

  it('lists registrations for an event', async () => {
    const regs = await getRegistrationsByEvent('evt-1');
    // Seed has 3 registrations for evt-1.
    expect(regs).toHaveLength(3);
  });

  it('lists registrations for a person', async () => {
    const regs = await getRegistrationsByPerson('per-1');
    expect(regs.length).toBeGreaterThanOrEqual(2);
  });

  it('registers a person for an event and finds it', async () => {
    const created = await registerForEvent('evt-4', 'per-1', 'going');
    expect(created.eventId).toBe('evt-4');
    expect(await findRegistration('evt-4', 'per-1')).not.toBeNull();
  });

  it('updates rsvp instead of duplicating when already registered', async () => {
    await registerForEvent('evt-4', 'per-1', 'going');
    const before = await countRegistrations('evt-4');
    await registerForEvent('evt-4', 'per-1', 'interested');
    const after = await countRegistrations('evt-4');
    expect(after).toBe(before);
    expect((await findRegistration('evt-4', 'per-1'))?.rsvp).toBe('interested');
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
