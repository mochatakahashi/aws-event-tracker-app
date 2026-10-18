import { describe, expect, it } from 'vitest';
import { attendeeBoard, officerBoard, type BoardData } from './leaderboard';
import type { Session } from '../types/session';

const sess = (id: string, eventId: string, type: Session['type'] = 'workshop') =>
  ({ id, eventId, title: id, type, requiresStamp: true, startTime: '', endTime: '', room: '', speakerIds: [], status: 'completed', description: '' }) as Session;

const data: BoardData = {
  people: [
    { id: 'adm', name: 'Admin', email: '', role: 'admin' },
    { id: 'off', name: 'Olive Officer', email: '', role: 'officer' },
    { id: 'off2', name: 'Oscar Officer', email: '', role: 'officer' },
    { id: 'a1', name: 'Ana', email: '', role: 'attendee' },
    { id: 'a2', name: 'Ben', email: '', role: 'attendee' },
    { id: 'a3', name: 'Cara', email: '', role: 'attendee' },
  ],
  sessions: [sess('s1', 'E1'), sess('s2', 'E1', 'talk'), sess('s3', 'E2')],
  stamps: [
    { id: '1', sessionId: 's1', attendeeId: 'a1', status: 'approved', approvedBy: 'off' },
    { id: '2', sessionId: 's2', attendeeId: 'a1', status: 'approved', approvedBy: 'off' },
    { id: '3', sessionId: 's3', attendeeId: 'a2', status: 'approved', approvedBy: 'off2' },
    { id: '4', sessionId: 's1', attendeeId: 'a2', status: 'pending' },
    { id: '5', sessionId: 's1', attendeeId: 'off2', status: 'approved', approvedBy: 'off' },
  ],
  registrations: [
    { id: 'r1', eventId: 'E1', personId: 'a1', rsvp: 'going', checkedIn: true, checkedInBy: 'off', registeredAt: '' },
    { id: 'r2', eventId: 'E2', personId: 'a2', rsvp: 'going', checkedIn: true, checkedInBy: 'off2', registeredAt: '' },
    { id: 'r3', eventId: 'E1', personId: 'a3', rsvp: 'going', checkedIn: false, registeredAt: '' },
  ],
  tasks: [
    { id: 't1', title: 't', assigneeIds: ['off2'], status: 'done', createdBy: 'adm', createdAt: '', eventId: 'E2' },
    { id: 't2', title: 't', assigneeIds: ['off'], status: 'todo', createdBy: 'adm', createdAt: '' },
  ],
  events: [
    { id: 'E1', officerIds: ['off'] },
    { id: 'E2', officerIds: ['off2'] },
  ] as BoardData['events'],
};

describe('attendee board', () => {
  it('lists every non-admin, including 0 points, with officers as attendees too', () => {
    const rows = attendeeBoard(data);
    expect(rows.map((r) => r.personId)).not.toContain('adm');
    expect(rows.map((r) => r.personId)).toEqual(expect.arrayContaining(['off', 'off2', 'a3']));
    expect(rows.find((r) => r.personId === 'a3')!.points).toBe(0);
  });

  it('scores stamps, workshop bonus, check-ins and badges', () => {
    const a1 = attendeeBoard(data).find((r) => r.personId === 'a1')!;
    // 2 stamps (20) + 1 workshop (5) + 1 check-in (15) + badges first-stamp & full-passport (40)
    expect(a1.badges).toEqual(['first-stamp', 'full-passport']);
    expect(a1.points).toBe(80);
    expect(a1.rank).toBe(1);
  });

  it('filters by event and leaves out badge points', () => {
    const rows = attendeeBoard(data, 'E2');
    const a2 = rows.find((r) => r.personId === 'a2')!;
    expect(a2.points).toBe(10 + 5 + 15);
    expect(rows.find((r) => r.personId === 'a1')!.points).toBe(0);
  });

  it('shares ranks on equal points', () => {
    const rows = attendeeBoard(data);
    const zeros = rows.filter((r) => r.points === 0);
    expect(new Set(zeros.map((r) => r.rank)).size).toBe(1);
  });
});

describe('officer board', () => {
  it('lists only officers and scores their work', () => {
    const rows = officerBoard(data);
    expect(rows.map((r) => r.personId).sort()).toEqual(['off', 'off2']);
    const off = rows.find((r) => r.personId === 'off')!;
    // 3 stamps approved (15) + 1 check-in (5) + 0 tasks + 1 event (25) + First Duty badge (20)
    expect([off.stampsApproved, off.checkInsDone, off.tasksDone, off.eventsVolunteered, off.points]).toEqual([3, 1, 0, 1, 65]);
    expect(off.badges.map((b) => b.badge.id)).toEqual(['first-duty']);
    const off2 = rows.find((r) => r.personId === 'off2')!;
    // 1 stamp (5) + 1 check-in (5) + 1 task (20) + 1 event (25) + First Duty (20)
    expect(off2.points).toBe(75);
    expect(rows[0].personId).toBe('off2');
  });

  it('filters by event (badge points left out)', () => {
    const off = officerBoard(data, 'E2').find((r) => r.personId === 'off')!;
    expect(off.points).toBe(0);
    expect(officerBoard(data, 'E1').find((r) => r.personId === 'off')!.points).toBe(15 + 5 + 25);
  });

  it('adds 20 points per awarded badge, each time it is given', () => {
    const awarded: BoardData = {
      ...data,
      people: data.people.map((p) =>
        p.id === 'off'
          ? {
              ...p,
              awards: [
                { id: 'w1', badge: 'best-pubmat', eventId: 'E1', awardedBy: 'adm', awardedAt: '' },
                { id: 'w2', badge: 'best-pubmat', eventId: 'E2', awardedBy: 'adm', awardedAt: '' },
              ],
            }
          : p,
      ),
    };
    const off = officerBoard(awarded).find((r) => r.personId === 'off')!;
    expect(off.points).toBe(65 + 40);
    expect(off.badges.find((b) => b.badge.id === 'best-pubmat')!.count).toBe(2);
  });
});
