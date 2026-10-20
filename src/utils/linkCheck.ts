/**
 * Link checks for social profiles and documents (mirrored in api/users.ts
 * and api/notifications.ts). Links must be https and, where we know the
 * service, point to that service's own site.
 */

/** Domains each social platform uses (subdomains like m. or www. are fine). */
export const SOCIAL_HOSTS: Record<string, string[]> = {
  facebook: ['facebook.com', 'fb.com', 'fb.me'],
  instagram: ['instagram.com', 'instagr.am'],
  linkedIn: ['linkedin.com', 'lnkd.in'],
  github: ['github.com'],
  twitterX: ['x.com', 'twitter.com'],
  tiktok: ['tiktok.com'],
  youtube: ['youtube.com', 'youtu.be'],
};

const SOCIAL_NAMES: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedIn: 'LinkedIn',
  github: 'GitHub',
  twitterX: 'X',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

const onHost = (host: string, domains: string[]) => domains.some((d) => host === d || host.endsWith(`.${d}`));

/** "github.com/x" → URL (adds https://), or null when it isn't a web link. */
export function parseLink(raw: string): URL | null {
  const t = raw.trim();
  if (!t || /\s/.test(t)) return null;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (!u.hostname.includes('.') || u.username || u.password) return null;
    return u;
  } catch {
    return null;
  }
}

/** Problem with a social link for this platform ('' when it's fine or empty). */
export function socialLinkError(key: string, raw: string | undefined): string {
  if (!raw || !raw.trim()) return '';
  const u = parseLink(raw);
  if (!u) return 'Enter a web link, e.g. https://…';
  const domains = SOCIAL_HOSTS[key];
  if (domains && !onHost(u.hostname.toLowerCase(), domains)) {
    return `This isn't a ${SOCIAL_NAMES[key]} link. It should start with ${domains[0]}/`;
  }
  return '';
}

/** Trusted places for documents sent to the adviser. */
export const DOC_SERVICES = 'Google Docs / Slides / Sheets / Drive, Canva, or Microsoft Word / PowerPoint / Excel (OneDrive, SharePoint, Office)';

/**
 * What kind of document a link is ("Google Docs document", "Canva design",
 * "PowerPoint (SharePoint)"…), or null when it isn't from a trusted service.
 */
export function documentKind(raw: string | undefined): string | null {
  if (!raw) return null;
  const u = parseLink(raw);
  if (!u || u.protocol !== 'https:') return null;
  const host = u.hostname.toLowerCase();
  const path = u.pathname.toLowerCase();
  if (host === 'docs.google.com') {
    if (path.startsWith('/document')) return 'Google Docs document';
    if (path.startsWith('/presentation')) return 'Google Slides presentation';
    if (path.startsWith('/spreadsheets')) return 'Google Sheets spreadsheet';
    if (path.startsWith('/forms')) return 'Google Form';
    return 'Google Docs file';
  }
  if (host === 'drive.google.com') return path.includes('/folders/') ? 'Google Drive folder' : 'Google Drive file';
  if (onHost(host, ['canva.com']) || host === 'canva.link') return 'Canva design';
  if (onHost(host, ['sharepoint.com'])) {
    if (path.includes('/:w:/')) return 'Word document (SharePoint)';
    if (path.includes('/:p:/')) return 'PowerPoint presentation (SharePoint)';
    if (path.includes('/:x:/')) return 'Excel spreadsheet (SharePoint)';
    if (path.includes('/:b:/')) return 'PDF (SharePoint)';
    return 'SharePoint file';
  }
  if (host === 'onedrive.live.com' || host === '1drv.ms') return 'OneDrive file';
  if (onHost(host, ['office.com']) || host === 'office.live.com') return 'Microsoft Office file';
  return null;
}
