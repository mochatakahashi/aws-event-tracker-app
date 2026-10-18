import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import XIcon from '@mui/icons-material/X';
import LanguageIcon from '@mui/icons-material/Language';
import type { SocialLinks } from '../types/auth';

const ITEMS: { key: keyof SocialLinks; label: string; icon: JSX.Element; color: string }[] = [
  { key: 'linkedIn', label: 'LinkedIn', icon: <LinkedInIcon />, color: '#0A66C2' },
  { key: 'github', label: 'GitHub', icon: <GitHubIcon />, color: '#24292F' },
  { key: 'twitterX', label: 'X', icon: <XIcon />, color: '#000' },
  { key: 'website', label: 'Website', icon: <LanguageIcon />, color: '#7B2D8E' },
];

/** Make "github.com/x" clickable. */
export function toUrl(v: string): string {
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

/** All of a person's social links as buttons. */
export default function SocialLinksRow({ socials, empty = 'No social links yet.' }: { socials?: SocialLinks; empty?: string }) {
  const present = ITEMS.filter((i) => socials?.[i.key]?.trim());
  if (present.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        {empty}
      </Typography>
    );
  }
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="center">
      {present.map((i) => (
        <Button
          key={i.key}
          size="small"
          variant="outlined"
          startIcon={i.icon}
          href={toUrl(socials![i.key]!.trim())}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: i.color, borderColor: 'divider' }}
        >
          {i.label}
        </Button>
      ))}
    </Stack>
  );
}
