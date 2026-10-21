/**
 * A message from the adviser (or an admin). Pinned at the top of the
 * dashboard for 24 hours, then kept in the announcements list.
 * 'officers': officers, admins and the adviser. 'everyone': all members (admin only).
 */
export interface Announcement {
  id: string;
  audience: 'officers' | 'everyone';
  title: string;
  message: string;
  authorId: string;
  authorName: string;
  authorRole: 'adviser' | 'admin';
  createdAt: string;
  /** Pinned on dashboards until this time (24 hours after posting). */
  expiresAt?: string;
  editedAt?: string;
}

const DAY = 24 * 3600 * 1000;
/** Whether the announcement is still pinned at the top of dashboards. */
export function isPinned(a: Announcement, now = Date.now()): boolean {
  const until = Date.parse(a.expiresAt || '') || Date.parse(a.createdAt) + DAY;
  return now < until;
}

export type SignoffStatus = 'pending' | 'approved' | 'returned';

/** Something an officer or admin needs the adviser to sign / approve ("papirma"). */
export interface SignoffRequest {
  id: string;
  title: string;
  details?: string;
  /** Link to the file (Google Drive, Canva…). */
  link?: string;
  /** What kind of file the link is (e.g. "Google Docs document"), set by the server. */
  linkKind?: string;
  eventId?: string;
  requestedBy: string;
  requestedByName: string;
  status: SignoffStatus;
  /** The adviser's note (required when returning it). */
  comment?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt: string;
  /** Set when deleted; kept 30 days (until purgeAfter) so it can be restored. */
  deletedAt?: string;
  deletedBy?: string;
  deletedByName?: string;
  purgeAfter?: string;
}
