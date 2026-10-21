import type { ReactNode } from 'react';
import ClubSocials from './ClubSocials';
import { LOGOS } from '../brandAssets';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { keyframes } from '@mui/material/styles';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import PrivacyTipOutlinedIcon from '@mui/icons-material/PrivacyTipOutlined';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import { SITE, mailTo, problemReportLink } from '../siteInfo';
import { APP_VERSION } from '../version';

const shift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;
const drift = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, -20px) scale(1.15); }
`;
const driftBack = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1.1); }
  50% { transform: translate(-50px, 15px) scale(0.95); }
`;
const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;
const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(233, 213, 255, 0.45); }
  50% { box-shadow: 0 0 0 10px rgba(233, 213, 255, 0); }
`;

/** One link as a glassy pill with an icon that lifts and glows on hover. */
function Pill({ icon, label, href, to, external }: { icon: ReactNode; label: string; href?: string; to?: string; external?: boolean }) {
  const sx = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.75,
    px: 1.5,
    py: 0.75,
    borderRadius: 999,
    color: '#fff',
    fontSize: '0.8rem',
    fontWeight: 600,
    textDecoration: 'none',
    bgcolor: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.16)',
    backdropFilter: 'blur(6px)',
    transition: 'transform .2s ease, background-color .2s ease, box-shadow .2s ease, border-color .2s ease',
    '& svg': { fontSize: 17, transition: 'transform .25s ease' },
    '&:hover, &:focus-visible': {
      transform: 'translateY(-3px)',
      bgcolor: 'rgba(255,255,255,0.16)',
      borderColor: 'rgba(233,213,255,0.55)',
      boxShadow: '0 8px 24px rgba(192,132,252,0.35)',
      '& svg': { transform: 'scale(1.15) rotate(-6deg)' },
    },
  } as const;
  return to ? (
    <Link component={RouterLink} to={to} sx={sx}>
      {icon}
      {label}
    </Link>
  ) : (
    <Link href={href} sx={sx} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {icon}
      {label}
    </Link>
  );
}

/**
 * The footer band at the bottom of the Get Started page: a curved top,
 * a slowly shifting purple gradient with soft drifting lights, the app
 * name, link pills and the credit. Motion stops for "reduce motion".
 */
export default function FooterBand() {
  return (
    <Box
      component="footer"
      data-testid="site-footer"
      sx={{
        position: 'relative',
        width: '100%',
        mt: { xs: 2, md: 0 },
        color: '#fff',
        overflow: 'hidden',
        background: 'linear-gradient(120deg, #2D0A3E 0%, #4A1259 35%, #7B2D8E 65%, #3B0F52 100%)',
        backgroundSize: '220% 220%',
        animation: `${shift} 16s ease infinite`,
        '@media (prefers-reduced-motion: reduce)': { animation: 'none', '& *': { animation: 'none !important' } },
      }}
    >
      {/* Curved top edge */}
      <Box
        component="svg"
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        aria-hidden
        sx={{ position: 'absolute', top: -1, left: 0, width: '100%', height: { xs: 28, md: 44 }, display: 'block' }}
      >
        <path d="M0,0 L1440,0 L1440,20 C1080,64 720,0 360,34 C200,48 90,40 0,26 Z" fill="#F0E5F9" />
      </Box>

      {/* Soft drifting lights */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          width: 320,
          height: 320,
          borderRadius: '50%',
          left: '8%',
          top: '20%',
          background: 'radial-gradient(circle, rgba(192,132,252,0.45) 0%, rgba(192,132,252,0) 70%)',
          filter: 'blur(10px)',
          animation: `${drift} 14s ease-in-out infinite`,
          pointerEvents: 'none',
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          width: 260,
          height: 260,
          borderRadius: '50%',
          right: '6%',
          bottom: '-20%',
          background: 'radial-gradient(circle, rgba(244,114,182,0.32) 0%, rgba(244,114,182,0) 70%)',
          filter: 'blur(12px)',
          animation: `${driftBack} 18s ease-in-out infinite`,
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ position: 'relative', maxWidth: 1100, mx: 'auto', px: 3, pt: { xs: 6, md: 8 }, pb: 3, textAlign: 'center' }}>
        {/* App name */}
        <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="center" sx={{ mb: 0.75 }}>
          <Box
            component="img"
            src={LOGOS.icon}
            alt=""
            sx={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.85)', animation: `${pulse} 3s ease-in-out infinite` }}
          />
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.05rem', md: '1.2rem' }, letterSpacing: 0.2 }}>{SITE.appName}</Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)', mb: 2.5 }}>
          Events, stamps and certificates for the AWS Student Builder Group at Asia Pacific College.
        </Typography>

        {/* Club and school logos */}
        <Stack direction="row" spacing={{ xs: 2, sm: 3 }} alignItems="center" justifyContent="center" sx={{ mb: 3 }} data-testid="footer-logos">
          <Box
            component="img"
            src={LOGOS.club}
            alt="AWS Student Builder Group - Asia Pacific College"
            loading="lazy"
            sx={{
              height: { xs: 64, sm: 84 },
              width: 'auto',
              px: 1.5,
              py: 0.75,
              borderRadius: '12px',
              bgcolor: '#fff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              transition: 'transform .25s ease',
              '&:hover': { transform: 'translateY(-3px) rotate(-1deg)' },
            }}
          />
          <Box sx={{ width: '1px', alignSelf: 'stretch', bgcolor: 'rgba(255,255,255,0.25)' }} />
          <Box
            component="img"
            src={LOGOS.school}
            alt="Asia Pacific College"
            loading="lazy"
            sx={{ height: { xs: 48, sm: 60 }, width: 'auto', transition: 'transform .25s ease', '&:hover': { transform: 'translateY(-3px)' } }}
          />
        </Stack>

        {/* Links */}
        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
          <Pill icon={<MailOutlineRoundedIcon />} label="Contact us" href={mailTo(`[${SITE.appName}] Inquiry`)} />
          <Pill icon={<PrivacyTipOutlinedIcon />} label="Privacy" to="/privacy" />
          <Pill icon={<GavelRoundedIcon />} label="Terms" to="/terms" />
          <Pill icon={<LanguageRoundedIcon />} label="AWS SBG-APC website" href={SITE.clubWebsite} external />
          <Pill icon={<BugReportOutlinedIcon />} label="Report a problem" href={problemReportLink()} />
        </Stack>

        {/* Social media */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="overline" sx={{ display: 'block', color: 'rgba(255,255,255,0.6)', letterSpacing: 2, mb: 1 }}>
            Follow us
          </Typography>
          <ClubSocials dark />
        </Box>

        {/* Shimmering divider */}
        <Box sx={{ position: 'relative', height: '1px', bgcolor: 'rgba(255,255,255,0.18)', overflow: 'hidden', mb: 2 }}>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent, rgba(233,213,255,0.9), transparent)',
              animation: `${shimmer} 4s linear infinite`,
            }}
          />
        </Box>

        <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.72)' }}>
          Inquiries and concerns:{' '}
          <Link
            href={mailTo(`[${SITE.appName}] Inquiry`)}
            underline="hover"
            sx={{ color: '#E9D5FF', fontWeight: 700 }}
          >
            {SITE.contactEmail}
          </Link>
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 0.25, color: 'rgba(255,255,255,0.6)' }}>
          A project by {SITE.projectBy} · v{APP_VERSION}
        </Typography>
      </Box>
    </Box>
  );
}
