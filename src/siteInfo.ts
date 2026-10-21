import { APP_VERSION } from './version';

/** Contact, credits and links shown in the footer, About, Privacy and Terms. */
export const SITE = {
  appName: 'AWS SBG-APC Event Tracker',
  club: 'AWS Student Builder Group - Asia Pacific College (AWS SBG-APC)',
  contactEmail: 'aws.apcofficial@gmail.com',
  clubWebsite: 'https://aws-sbg-apc.vercel.app',
  /** The club's social media pages. */
  socials: {
    facebook: 'https://www.facebook.com/awssbgapc',
    instagram: 'https://www.instagram.com/awssbgapc',
    linkedIn: 'https://www.linkedin.com/company/awssbgapc/',
    tiktok: 'https://www.tiktok.com/@awssbgapc',
  },
  /** Credit line: "A project by …" (the project lead, not the sole developer). */
  projectBy: 'Rodmina Jhoy Ibe (AWS SBG-APC President)',
  /** Effective date of the Terms of Use and Privacy Notice (also saved when someone agrees). */
  termsVersion: '2026-10-21',
  termsDate: 'October 21, 2026',
};

/** A mailto: link to the club inbox with a subject and body filled in. */
export function mailTo(subject: string, body = ''): string {
  return `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;
}

/** "Report a problem" email with the app version, page and device filled in. */
export function problemReportLink(page = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') || '/' : '/'): string {
  const device = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  return mailTo(
    `[${SITE.appName}] Problem report`,
    `What happened:\n\n\nWhat I expected:\n\n\n---\nApp version: ${APP_VERSION}\nPage: ${page}\nDevice: ${device}`,
  );
}
