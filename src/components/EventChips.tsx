import Chip from '@mui/material/Chip';
import type { EventCategory, EventStatus } from '../types/event';
import type { RsvpStatus } from '../types/attendee';
import {
  capitalize,
  categoryColor,
  statusColor,
  rsvpColor,
} from '../utils/eventDisplay';

export function CategoryChip({ category }: { category: EventCategory }) {
  return (
    <Chip
      size="small"
      color={categoryColor(category)}
      label={capitalize(category)}
    />
  );
}

export function StatusChip({ status }: { status: EventStatus }) {
  return (
    <Chip
      size="small"
      color={statusColor(status)}
      label={capitalize(status)}
      variant="outlined"
    />
  );
}

export function RsvpChip({ rsvp }: { rsvp: RsvpStatus }) {
  return (
    <Chip size="small" color={rsvpColor(rsvp)} label={capitalize(rsvp)} />
  );
}
