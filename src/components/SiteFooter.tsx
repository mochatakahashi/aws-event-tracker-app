import { Link as RouterLink } from 'react-router-dom';
import ClubSocials from './ClubSocials';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { SITE, mailTo, problemReportLink } from '../siteInfo';
import { APP_VERSION } from '../version';

const linkSx = { color: 'text.secondary', fontWeight: 600, '&:hover': { color: 'primary.main' } } as const;

/**
 * Light footer for the sign-in / sign-up pages, About and the Privacy /
 * Terms pages: contact, Privacy, Terms, the club website, report a problem,
 * credit and version. (The Get Started page uses FooterBand.)
 */
export default function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <Box component="footer" sx={{ mt: compact ? 2 : 4, mb: 2, textAlign: 'center' }} data-testid="site-footer">
      <Box sx={{ mb: 1.25 }}>
        <ClubSocials size={34} />
      </Box>
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
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        Inquiries and concerns: <Link href={mailTo(`[${SITE.appName}] Inquiry`)} underline="hover">{SITE.contactEmail}</Link>
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
        A project by {SITE.projectBy} · v{APP_VERSION}
      </Typography>
    </Box>
  );
}
