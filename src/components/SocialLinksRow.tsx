import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { SocialLinks } from '../types/auth';
import { socialEntries, toUrl } from '../utils/socials';

export { toUrl };

/** All of a person's social links (standard platforms and their own custom ones) as buttons. */
export default function SocialLinksRow({
  socials,
  empty = 'No social links yet.',
  align = 'center',
}: {
  socials?: SocialLinks;
  empty?: string;
  align?: 'center' | 'flex-start';
}) {
  const links = socialEntries(socials);
  if (links.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        {empty}
      </Typography>
    );
  }
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent={align} data-testid="social-links">
      {links.map((l) => (
        <Button
          key={l.id}
          size="small"
          variant="outlined"
          startIcon={l.icon}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: l.color, borderColor: 'divider', textTransform: 'none' }}
        >
          {l.label}
        </Button>
      ))}
    </Stack>
  );
}
