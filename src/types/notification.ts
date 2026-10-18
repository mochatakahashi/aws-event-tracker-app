/** What an in-app notification is about (drives its icon and color). */
export type NotificationKind =
  | 'account-approved'
  | 'account-declined'
  | 'signup-pending'
  | 'event-assigned'
  | 'task-assigned'
  | 'stamp-approved'
  | 'stamp-declined'
  | 'checked-in'
  | 'certificate'
  | 'registration-approved'
  | 'registration-declined'
  | 'announcement';

/** One notification in a person's in-app inbox. */
export interface AppNotification {
  id: string;
  /** Recipient. */
  personId: string;
  kind: NotificationKind;
  title: string;
  message: string;
  /** In-app route to open, e.g. "/officer" or "/events/evt-1". */
  link?: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
}

/** What callers send; recipients are person ids and/or every admin. */
export interface NewNotification {
  personIds?: string[];
  toRole?: 'admin';
  kind: NotificationKind;
  title: string;
  message: string;
  link?: string;
}
