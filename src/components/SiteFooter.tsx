import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { SITE, mailTo, problemReportLink } from '../siteInfo';
import { APP_VERSION } from '../version';
import { brand } from '../theme/theme';


/**
 * Footer for the sign-in / sign-up pages and inside the app: contact,
 * Privacy, Terms, the club website, report a problem, credit and version.
 */
export default function SiteFooter({ compact = false, variant = 'plain' }: { compact?: boolean; variant?: 'plain' | 'band' }) {
  const band = variant === 'band';
  // The band is a full-width dark footer (Get Started page); plain sits under a card
  const muted = band ? 'rgba(255,255,255,0.72)' : 'text.secondary';
  const linkSx = { color: band ? '#fff' : 'text.secondary', fontWeight: 600, '&:hover': { color: band ? '#E9D5FF' : 'primary.main' } } as const;
  return (
    <Box
      component="footer"
      sx={
        band
          ? { width: '100%', background: brand.gradientDark, color: '#fff', textAlign: 'center', px: 2, pt: 3, pb: 3.5 }
          : { mt: compact ? 2 : 4, mb: 2, textAlign: 'center' }
      }
      data-testid="site-footer"
    >
      <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.75 }}>
        <Link href={mailTo(`[${SITE.appName}] Inquiry`)} variant="caption" underline="hover" sx={linkSx}>
          Contact us
        </Link>
        <Link component={RouterLink} to="/privacy" variant="caption" underline="hover" sx={linkSx}>
          Privacy
        </Link>
        <Link component={RouterLink} to="/terms" variant="caption" underline="hover" sx={linkSx}>
          Terms
        </Link>
        <Link href={SITE.clubWebsite} target="_blank" rel="noopener noreferrer" variant="caption" underline="hover" sx={linkSx}>
          AWS SBG-APC website
        </Link>
        <Link href={problemReportLink()} variant="caption" underline="hover" sx={linkSx}>
          Report a problem
        </Link>
      </Stack>
      <Typography variant="caption" sx={{ display: 'block', color: muted }}>
        Inquiries and concerns:{' '}
        <Link href={mailTo(`[${SITE.appName}] Inquiry`)} underline="hover" sx={band ? { color: '#E9D5FF', fontWeight: 600 } : undefined}>
          {SITE.contactEmail}
        </Link>
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', mt: 0.25, color: muted }}>
        A project by {SITE.projectBy} · v{APP_VERSION}
      </Typography>
    </Box>
  );
}
