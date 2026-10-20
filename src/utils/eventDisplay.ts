import type { EventModality, EventStatus, EventTag } from '../types/event';
import type { RsvpStatus } from '../types/attendee';

type MuiColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'info'
  | 'warning'
  | 'error'
  | 'success';

/** Chip color for an event modality. */
export function modalityColor(modality: EventModality): MuiColor {
  switch (modality) {
    case 'onsite':
      return 'primary';
    case 'hybrid':
      return 'secondary';
    case 'virtual':
      return 'info';
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
    case 'accomplished':
      return 'default';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
}

/** CSS color for an event tag. */
export function tagColor(tag: EventTag): string {
  switch (tag) {
    case 'technical':
      return '#3B82F6';   // blue
    case 'leadership':
      return '#8B5CF6';   // purple
    case 'career-growth':
      return '#F59E0B';   // amber
    case 'diversity':
      return '#EC4899';   // pink
    default:
      return '#6B7280';
  }
}

/** Human-friendly label for a tag. */
export function tagLabel(tag: EventTag): string {
  switch (tag) {
    case 'technical':
      return 'Technical';
    case 'leadership':
      return 'Leadership';
    case 'career-growth':
      return 'Career Growth';
    case 'diversity':
      return 'Diversity';
    default:
      return tag;
  }
}

/** Chip color for an RSVP status. */
export function rsvpColor(rsvp: RsvpStatus): MuiColor {
  switch (rsvp) {
    case 'approved':
      return 'success';
    case 'pending':
      return 'warning';
    case 'declined':
      return 'error';
    default:
      return 'default';
  }
}

/** Human-friendly, capitalized label. */
export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const PH_TZ = 'Asia/Manila';

/** Format an ISO timestamp as a date + time in Philippine Standard Time. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-US', {
    timeZone: PH_TZ,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** Format an ISO timestamp as a date only in Philippine Standard Time. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', {
    timeZone: PH_TZ,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Format a start/end range compactly (same-day ranges collapse the date) in Philippine Standard Time. */
export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startIso} – ${endIso}`;
  }
  const startDateStr = start.toLocaleDateString('en-CA', { timeZone: PH_TZ });
  const endDateStr = end.toLocaleDateString('en-CA', { timeZone: PH_TZ });
  const sameDay = startDateStr === endDateStr;
  const timeOpts: Intl.DateTimeFormatOptions = {
    timeZone: PH_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  if (sameDay) {
    return `${formatDate(startIso)}, ${start.toLocaleTimeString(
      'en-US',
      timeOpts
    )} – ${end.toLocaleTimeString('en-US', timeOpts)}`;
  }
  return `${formatDateTime(startIso)} – ${formatDateTime(endIso)}`;
}
