import type { AppEvent } from '../types/event';
import type { Session } from '../types/session';

/**
 * "Add to calendar" helpers: an .ics file (Apple Calendar, Outlook, most apps)
 * and a Google Calendar link. Times are stored in UTC; calendars show them in
 * the viewer's time zone, and the schedule text is written in Manila time.
 */

const TZ = 'Asia/Manila';

/** 20261114T010000Z */
export function icsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function manilaTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
}

/** Plain-text description with the session schedule (Manila time). */
export function calendarDetails(event: AppEvent, sessions: Session[] = [], pageUrl?: string, maxLength = 1500): string {
  const parts: string[] = [];
  if (event.description) parts.push(event.description.trim());
  const schedule = [...sessions]
    .filter((s) => s.startTime)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((s) => `• ${manilaTime(s.startTime)}–${manilaTime(s.endTime)}  ${s.title}${s.room ? ` (${s.room})` : ''}`);
  if (schedule.length > 0) parts.push(`Schedule (Manila time):\n${schedule.join('\n')}`);
  if (pageUrl) parts.push(`Event page: ${pageUrl}`);
  parts.push('Organized by AWS Student Builder Group – Asia Pacific College');
  let text = parts.join('\n\n');
  if (text.length > maxLength) text = `${text.slice(0, maxLength - 1)}…`;
  return text;
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Fold lines longer than 75 bytes (RFC 5545), without splitting a character. */
function fold(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let current = '';
  let bytes = 0;
  for (const ch of line) {
    const size = enc.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (bytes + size > limit) {
      out.push(current);
      current = '';
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join('\r\n ');
}

export function buildIcs(event: AppEvent, sessions: Session[] = [], pageUrl?: string, now = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AWS SBG-APC//Event Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@aws-sbg-apc-event-tracker`,
    `DTSTAMP:${icsDate(now.toISOString())}`,
    `DTSTART:${icsDate(event.startAt)}`,
    `DTEND:${icsDate(event.endAt || event.startAt)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `LOCATION:${escapeIcs(event.venue || '')}`,
    `DESCRIPTION:${escapeIcs(calendarDetails(event, sessions, pageUrl, 4000))}`,
    ...(pageUrl ? [`URL:${pageUrl}`] : []),
    `STATUS:${event.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcs(`${event.title} starts in 1 hour`)}`,
    'TRIGGER:-PT1H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function googleCalendarUrl(event: AppEvent, sessions: Session[] = [], pageUrl?: string): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${icsDate(event.startAt)}/${icsDate(event.endAt || event.startAt)}`,
    details: calendarDetails(event, sessions, pageUrl, 1200),
    location: event.venue || '',
    ctz: TZ,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function icsFileName(event: AppEvent): string {
  const slug = event.title.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'event';
  return `${slug}.ics`;
}

/** Public link to an event page in this app. */
export function eventPageUrl(eventId: string): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}${window.location.pathname}#/events/${eventId}`;
}

/** Save the .ics file in the browser. */
export function downloadIcs(event: AppEvent, sessions: Session[] = []): void {
  const blob = new Blob([buildIcs(event, sessions, eventPageUrl(event.id))], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = icsFileName(event);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
