import type { EventCategory, EventStatus } from '../types/event';
import type { RsvpStatus } from '../types/attendee';

type MuiColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'info'
  | 'warning'
  | 'error'
  | 'success';

/** Chip color for an event category. */
export function categoryColor(category: EventCategory): MuiColor {
  switch (category) {
    case 'conference':
      return 'primary';
    case 'workshop':
      return 'secondary';
    case 'meetup':
      return 'info';
    case 'webinar':
      return 'success';
    default:
      return 'default';
  }
}

/** Chip color for an event status. */
export function statusColor(status: EventStatus): MuiColor {
  switch (status) {
    case 'upcoming':
      return 'info';
    case 'ongoing':
      return 'success';
    case 'completed':
      return 'default';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
}

/** Chip color for an RSVP status. */
export function rsvpColor(rsvp: RsvpStatus): MuiColor {
  switch (rsvp) {
    case 'going':
      return 'success';
    case 'interested':
      return 'warning';
    case 'declined':
      return 'default';
    default:
      return 'default';
  }
}

/** Human-friendly, capitalized label. */
export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Format an ISO timestamp as a date + time. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format an ISO timestamp as a date only. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Format a start/end range compactly (same-day ranges collapse the date). */
export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startIso} – ${endIso}`;
  }
  const sameDay = start.toDateString() === end.toDateString();
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };
  if (sameDay) {
    return `${formatDate(startIso)}, ${start.toLocaleTimeString(
      undefined,
      timeOpts,
    )} – ${end.toLocaleTimeString(undefined, timeOpts)}`;
  }
  return `${formatDateTime(startIso)} – ${formatDateTime(endIso)}`;
}
