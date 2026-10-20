import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { brand } from '../theme/theme';
import { APP_VERSION, WHATS_NEW } from '../version';

/** About the app: what it is, the version and what's new. */
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
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
          What's new
        </Typography>
        {WHATS_NEW.map((r) => (
          <Box key={r.version} sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: brand.primary }}>
              v{r.version}
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {r.items.map((i) => (
                <Typography key={i} component="li" variant="body2">
                  {i}
                </Typography>
              ))}
            </Box>
          </Box>
        ))}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Something not working? Tell an officer or an admin.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
