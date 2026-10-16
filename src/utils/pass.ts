/**
 * Event pass QR codes. The QR holds a link to the officer scanner with the
 * registration id, so it also works with a phone's normal camera app
 * (officers land on the check-in screen).
 */

const PREFIX = '/officer/scan?pass=';

export function passLink(registrationId: string): string {
  const base = typeof window === 'undefined' ? '' : `${window.location.origin}${window.location.pathname}`;
  return `${base}#${PREFIX}${encodeURIComponent(registrationId)}`;
}

/** Registration id from a scanned QR / typed code, or null if it isn't a pass. */
export function parsePass(text: string): string | null {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const fromLink = raw.match(/[?&]pass=([^&#\s]+)/);
  const id = fromLink ? decodeURIComponent(fromLink[1]) : raw;
  return /^reg-[A-Za-z0-9_-]{1,80}$/.test(id) ? id : null;
}
