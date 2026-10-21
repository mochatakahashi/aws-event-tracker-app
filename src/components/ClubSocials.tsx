import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import { SITE } from '../siteInfo';

const LINKS = [
  { label: 'Facebook', href: SITE.socials.facebook, icon: <FacebookIcon />, color: '#1877F2' },
  { label: 'Instagram', href: SITE.socials.instagram, icon: <InstagramIcon />, color: '#E1306C' },
  { label: 'LinkedIn', href: SITE.socials.linkedIn, icon: <LinkedInIcon />, color: '#0A66C2' },
  { label: 'TikTok', href: SITE.socials.tiktok, icon: <MusicNoteRoundedIcon />, color: '#010101' },
];

/** The club's social media as round icon buttons ("dark" for the footer band). */
export default function ClubSocials({ dark = false, size = 40 }: { dark?: boolean; size?: number }) {
  return (
    <Stack direction="row" spacing={1} justifyContent="center" data-testid="club-socials">
      {LINKS.map((l) => (
        <Tooltip key={l.label} title={`AWS SBG-APC on ${l.label}`}>
          <IconButton
            component="a"
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`AWS SBG-APC on ${l.label}`}
            sx={{
              width: size,
              height: size,
              color: dark ? '#fff' : l.color,
              bgcolor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(123,45,142,0.06)',
              border: dark ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(123,45,142,0.12)',
              transition: 'transform .2s ease, background-color .2s ease, color .2s ease, box-shadow .2s ease',
              '& svg': { fontSize: size * 0.5 },
              '&:hover': {
                transform: 'translateY(-3px) scale(1.06)',
                bgcolor: dark ? '#fff' : l.color,
                color: dark ? l.color : '#fff',
                boxShadow: `0 8px 20px ${l.color}55`,
              },
            }}
          >
            {l.icon}
          </IconButton>
        </Tooltip>
      ))}
    </Stack>
  );
}
