import { describe, expect, it } from 'vitest';
import { canDo, defaultDutiesForRole, staffEvents } from './eventStaff';
import { goingCounts } from '../hooks/useSessionPicks';
import type { AppEvent } from '../types/event';
import type { Registration } from '../types/attendee';

const ev = (id: string, stamps: string[] = [], checkin: string[] = []) =>
  ({ id, officerIds: [...stamps, ...checkin], stampOfficerIds: stamps, checkinOfficerIds: checkin }) as AppEvent;

describe('event staff list', () => {
  const officer = { role: 'officer', personId: 'o1' };

  it('lets admins do everything', () => {
    expect(canDo({ role: 'admin', personId: 'a' }, ev('E'), 'stamps')).toBe(true);
    expect(canDo({ role: 'admin', personId: 'a' }, ev('E'), 'checkin')).toBe(true);
  });

  it('lets an officer do only the ticked duty at that event', () => {
    const e = ev('E', ['o1'], []);
    expect(canDo(officer, e, 'stamps')).toBe(true);
    expect(canDo(officer, e, 'checkin')).toBe(false);
    expect(canDo(officer, ev('F'), 'stamps')).toBe(false);
  });

  it('never lets attendees or signed-out users', () => {
    expect(canDo({ role: 'attendee', personId: 'o1' }, ev('E', ['o1'], ['o1']), 'stamps')).toBe(false);
    expect(canDo(null, ev('E', ['o1']), 'stamps')).toBe(false);
  });

  it('lists the events where an officer has any duty', () => {
    expect(staffEvents(officer, [ev('A', ['o1']), ev('B', [], ['o1']), ev('C')]).map((e) => e.id)).toEqual(['A', 'B']);
  });

  it('suggests duties from the event role', () => {
    expect(defaultDutiesForRole('Registration Booth')).toEqual(['checkin']);
    expect(defaultDutiesForRole('lead')).toEqual(['stamps', 'checkin']);
    expect(defaultDutiesForRole('media')).toEqual([]);
  });
});

describe('session going counts', () => {
  it('counts each person once per session and skips people who can’t go', () => {
    const reg = (personId: string, sessionIds: string[], rsvp: Registration['rsvp'] = 'approved') =>
      ({ id: personId, eventId: 'E', personId, rsvp, checkedIn: false, registeredAt: '', sessionIds }) as Registration;
    const counts = goingCounts([reg('a', ['s1', 's2', 's1']), reg('b', ['s1']), reg('c', ['s2'], 'declined'), reg('d', [])]);
    expect(counts.get('s1')).toBe(2);
    expect(counts.get('s2')).toBe(1);
    expect(counts.get('s3')).toBeUndefined();
  });
});
