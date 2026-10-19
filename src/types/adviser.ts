/** A message from the adviser (or an admin) to the officers, shown on their dashboards. */
export interface Announcement {
  id: string;
  audience: 'officers';
  title: string;
  message: string;
  authorId: string;
  authorName: string;
  authorRole: 'adviser' | 'admin';
  createdAt: string;
}

export type SignoffStatus = 'pending' | 'approved' | 'returned';

/** Something an officer or admin needs the adviser to sign / approve ("papirma"). */
export interface SignoffRequest {
  id: string;
  title: string;
  details?: string;
  /** Link to the file (Google Drive, Canva…). */
  link?: string;
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
}
