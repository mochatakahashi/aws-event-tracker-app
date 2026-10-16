import { describe, expect, it } from 'vitest';
import { buildIcs, calendarDetails, googleCalendarUrl, icsDate, icsFileName } from './calendar';
import { parsePass, passLink } from './pass';
import type { AppEvent } from '../types/event';
import type { Session } from '../types/session';

const event: AppEvent = {
  id: 'evt-9',
  title: 'Tech Barangay: AWS, WordPress; Notion',
  description: 'Hands-on builds.\nBring a laptop.',
  modality: 'onsite',
  status: 'upcoming',
  tags: [],
  startAt: '2026-11-14T01:00:00.000Z', // 9:00 AM Manila
  endAt: '2026-11-14T09:00:00.000Z',
  venue: 'APC Makati, 2F Hall',
  participants: 0,
  capacity: 0,
  speakerIds: [],
};
const sessions = [
  { id: 's2', eventId: 'evt-9', title: 'Workshop', startTime: '2026-11-14T03:00:00.000Z', endTime: '2026-11-14T04:30:00.000Z', room: 'Lab 1' },
  { id: 's1', eventId: 'evt-9', title: 'Keynote', startTime: '2026-11-14T01:30:00.000Z', endTime: '2026-11-14T02:00:00.000Z', room: '' },
] as Session[];

describe('calendar', () => {
  it('formats UTC calendar dates', () => {
    expect(icsDate('2026-11-14T01:00:00.000Z')).toBe('20261114T010000Z');
  });

  it('lists sessions in Manila time, sorted', () => {
    const text = calendarDetails(event, sessions, 'https://app/#/events/evt-9');
    expect(text).toContain('• 9:30 AM–10:00 AM  Keynote');
    expect(text).toContain('• 11:00 AM–12:30 PM  Workshop (Lab 1)');
    expect(text.indexOf('Keynote')).toBeLessThan(text.indexOf('Workshop'));
    expect(text).toContain('Event page: https://app/#/events/evt-9');
  });

  it('builds a valid .ics with escaping, folding and a reminder', () => {
    const ics = buildIcs(event, sessions, 'https://app/#/events/evt-9', new Date('2026-10-16T00:00:00Z'));
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('DTSTART:20261114T010000Z');
    expect(ics).toContain('DTEND:20261114T090000Z');
    expect(ics).toContain('SUMMARY:Tech Barangay: AWS\\, WordPress\; Notion');
    expect(ics).toContain('UID:evt-9@aws-sbg-apc-event-tracker');
    expect(ics).toContain('TRIGGER:-PT1H');
    const lines = ics.split('\r\n');
    expect(lines.every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
  });

  it('builds a Google Calendar link with Manila time zone', () => {
    const url = new URL(googleCalendarUrl(event, sessions));
    expect(url.hostname).toBe('calendar.google.com');
    expect(url.searchParams.get('dates')).toBe('20261114T010000Z/20261114T090000Z');
    expect(url.searchParams.get('ctz')).toBe('Asia/Manila');
    expect(url.searchParams.get('location')).toBe('APC Makati, 2F Hall');
    expect(url.searchParams.get('text')).toBe(event.title);
  });

  it('makes a safe file name', () => {
    expect(icsFileName(event)).toBe('Tech-Barangay-AWS-WordPress-Notion.ics');
  });
});

describe('event pass', () => {
  it('round-trips a registration id through the QR link', () => {
    expect(parsePass(passLink('reg-1729-555'))).toBe('reg-1729-555');
    expect(parsePass('reg-1')).toBe('reg-1');
  });
  it('rejects QR codes that are not passes', () => {
    expect(parsePass('https://example.com')).toBeNull();
    expect(parsePass('per-1')).toBeNull();
    expect(parsePass('')).toBeNull();
  });
});
