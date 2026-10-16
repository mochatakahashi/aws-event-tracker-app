import { apiJson, isRemoteAvailable } from './apiClient';

/**
 * Email notifications (Amazon SES through `/api/notify`). Only works on the
 * deployed app; locally (`npm run dev`) nothing is sent.
 */

export type Notification =
  | { type: 'account-reviewed'; personId: string }
  | { type: 'event-assigned'; eventId: string; personIds: string[] }
  | { type: 'task-assigned'; taskId: string }
  | { type: 'run-reminders'; actorId: string }
  | { type: 'signup-pending'; personId: string };

export interface NotifyResult {
  sent: number;
  /** Why nothing was sent (e.g. email not set up, or running locally). */
  skipped?: string;
}

export async function notify(n: Notification): Promise<NotifyResult> {
  if (!(await isRemoteAvailable('/api/users'))) {
    return { sent: 0, skipped: 'Emails are only sent from the deployed app.' };
  }
  return apiJson<NotifyResult>('/api/notify', { method: 'POST', body: JSON.stringify(n) });
}

/** Send without blocking the UI; returns a short status line for the admin, or null. */
export async function notifyQuietly(n: Notification): Promise<string | null> {
  try {
    const r = await notify(n);
    if (r.skipped) return `Saved. No email sent: ${r.skipped}`;
    return r.sent > 0 ? `Email sent (${r.sent}).` : null;
  } catch (e) {
    return `Saved, but the email failed: ${e instanceof Error ? e.message : 'unknown error'}`;
  }
}
