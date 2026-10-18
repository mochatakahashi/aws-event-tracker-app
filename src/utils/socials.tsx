import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import XIcon from '@mui/icons-material/X';
import LanguageIcon from '@mui/icons-material/Language';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import type { SocialLinks } from '../types/auth';

export type SocialKey = Exclude<keyof SocialLinks, 'custom'>;

export interface SocialPlatform {
  key: SocialKey;
  label: string;
  icon: JSX.Element;
  color: string;
  placeholder: string;
}

/** Platforms people can add to their profile (they choose which). */
export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { key: 'facebook', label: 'Facebook', icon: <FacebookIcon />, color: '#1877F2', placeholder: 'facebook.com/yourname' },
  { key: 'instagram', label: 'Instagram', icon: <InstagramIcon />, color: '#E1306C', placeholder: 'instagram.com/yourname' },
  { key: 'linkedIn', label: 'LinkedIn', icon: <LinkedInIcon />, color: '#0A66C2', placeholder: 'linkedin.com/in/yourname' },
  { key: 'github', label: 'GitHub', icon: <GitHubIcon />, color: '#24292F', placeholder: 'github.com/yourname' },
  { key: 'twitterX', label: 'X', icon: <XIcon />, color: '#000000', placeholder: 'x.com/yourname' },
  { key: 'tiktok', label: 'TikTok', icon: <MusicNoteRoundedIcon />, color: '#010101', placeholder: 'tiktok.com/@yourname' },
  { key: 'youtube', label: 'YouTube', icon: <YouTubeIcon />, color: '#FF0000', placeholder: 'youtube.com/@yourname' },
  { key: 'website', label: 'Website', icon: <LanguageIcon />, color: '#7B2D8E', placeholder: 'yourwebsite.com' },
];

export const CUSTOM_LINK_ICON = <LinkRoundedIcon />;

/** Make "github.com/x" clickable (and never a javascript: link). */
export function toUrl(v: string): string {
  const t = v.trim();
  if (/^(javascript|data|vbscript):/i.test(t)) return '#';
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

/** Every link a person has, in display order. */
export function socialEntries(socials?: SocialLinks): { id: string; label: string; url: string; icon: JSX.Element; color: string }[] {
  if (!socials) return [];
  const out: { id: string; label: string; url: string; icon: JSX.Element; color: string }[] = SOCIAL_PLATFORMS.filter((p) =>
    socials[p.key]?.trim(),
  ).map((p) => ({
    id: p.key as string,
    label: p.label,
    url: toUrl(socials[p.key]!),
    icon: p.icon,
    color: p.color,
  }));
  (socials.custom ?? []).forEach((c, i) => {
    if (c.label?.trim() && c.url?.trim()) out.push({ id: `custom-${i}`, label: c.label.trim(), url: toUrl(c.url), icon: CUSTOM_LINK_ICON, color: '#5B21B6' });
  });
  return out;
}
