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
