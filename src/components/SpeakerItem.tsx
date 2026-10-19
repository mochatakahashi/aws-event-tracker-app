import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import SocialLinksRow from './SocialLinksRow';
import type { Speaker } from '../types/speaker';
import type { SocialLinks } from '../types/auth';
import { imageSrc } from '../utils/imageUrl';

/** What to show for a speaker: their account's live details when linked, else what was typed in. */
export function speakerView(s: Speaker) {
  const p = s.profile;
  const own: SocialLinks | undefined = s.socials ?? (s.linkedInUrl ? { linkedIn: s.linkedInUrl } : undefined);
  return {
    name: p?.name || s.name,
    avatarUrl: p?.avatarUrl || s.avatarUrl,
    // Account links first; anything typed only on the speaker fills the gaps
    socials: p?.socials ? { ...(own || {}), ...p.socials } : own,
    personId: p?.personId,
    officer: p?.role === 'officer',
    // "President, AWS SBG-APC" already names the org, so don't repeat it
    subtitle: [s.headline || p?.title, s.company && !(s.headline || '').includes(s.company) ? s.company : '']
      .filter(Boolean)
      .join(' · '),
  };
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** One speaker with photo, title, bio and social links; tap the name to open their profile when linked. */
export default function SpeakerItem({ speaker, showBio = true }: { speaker: Speaker; showBio?: boolean }) {
  const navigate = useNavigate();
  const v = speakerView(speaker);
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" data-testid={`speaker-${speaker.id}`}>
      <Avatar
        src={imageSrc(v.avatarUrl)}
        sx={{ width: 44, height: 44, bgcolor: alpha(brand.primary, 0.15), color: brand.primary, cursor: v.personId ? 'pointer' : 'default' }}
        onClick={() => v.personId && navigate(`/people/${v.personId}`)}
      >
        {initials(v.name)}
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, cursor: v.personId ? 'pointer' : 'default', '&:hover': v.personId ? { textDecoration: 'underline' } : {} }}
            onClick={() => v.personId && navigate(`/people/${v.personId}`)}
          >
            {v.name}
          </Typography>
          {v.officer && <Chip size="small" label="AWS SBG-APC officer" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.68rem' }} />}
        </Stack>
        {v.subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {v.subtitle}
          </Typography>
        )}
        {showBio && speaker.bio && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {speaker.bio}
          </Typography>
        )}
        {v.socials && (
          <Box sx={{ mt: 0.75 }}>
            <SocialLinksRow socials={v.socials} align="flex-start" empty="" />
          </Box>
        )}
      </Box>
    </Stack>
  );
}
