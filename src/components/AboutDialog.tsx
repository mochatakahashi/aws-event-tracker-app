import Dialog from '@mui/material/Dialog';
import SiteFooter from './SiteFooter';
import { SITE } from '../siteInfo';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { brand } from '../theme/theme';
import { APP_VERSION } from '../version';

/** About the app: what it is for and the version. */
export default function AboutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="about-title">
      <DialogTitle id="about-title" sx={{ textTransform: 'none', letterSpacing: 0, fontWeight: 800, pb: 0.5 }}>
        AWS SBG-APC Event Tracker
        <Box sx={{ mt: 0.75 }}>
          <Chip size="small" label={`Version ${APP_VERSION}`} sx={{ fontWeight: 700, color: brand.primary }} variant="outlined" data-testid="about-version" />
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          The companion app of the AWS Student Builder Group at Asia Pacific College: event registration and check-in,
          session stamps, certificates, food stubs, officer tasks and notifications.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          A project by {SITE.projectBy}.
        </Typography>
        <SiteFooter compact />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
