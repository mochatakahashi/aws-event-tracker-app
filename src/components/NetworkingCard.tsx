import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import type { SocialLinks } from '../types/auth';

interface NetworkingCardProps {
  open?: boolean;
  onClose?: () => void;
  name: string;
  socials?: SocialLinks;
}

export default function NetworkingCard({ open = true, onClose, name, socials }: NetworkingCardProps) {
  if (!open) return null;

  const linkedInUrl = socials?.linkedIn ?? '';
  const qrData = linkedInUrl || socials?.github || socials?.website || '';
  const qrUrl = qrData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`
    : '';

  function handleCopy() {
    if (linkedInUrl) {
      navigator.clipboard.writeText(linkedInUrl);
    }
  }

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: `0 4px 20px ${alpha(brand.primary, 0.08)}`,
        mb: 3,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: brand.gradientDark,
          color: '#fff',
          p: 3,
          pb: 3,
          position: 'relative',
          textAlign: 'center',
        }}
      >
        {onClose && (
          <IconButton
            onClick={onClose}
            sx={{ position: 'absolute', top: 8, right: 8, color: 'rgba(255,255,255,0.7)' }}
          >
            <CloseIcon />
          </IconButton>
        )}
        <Typography
          variant="h6"
          sx={{
            color: brand.accent,
            mb: 0.5,
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
          }}
        >
          MY NETWORKING CARD
        </Typography>
        <Typography variant="h2" sx={{ color: '#fff', fontWeight: 700 }}>
          {name}
        </Typography>
      </Box>

      <CardContent sx={{ p: 3, textAlign: 'center' }}>
        {qrUrl ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Point a camera at the QR code to open your profile.
            </Typography>
            <Box
              sx={{
                display: 'inline-flex',
                p: 2,
                borderRadius: 3,
                border: `1px solid ${alpha(brand.primary, 0.15)}`,
                mb: 2,
              }}
            >
              <img
                src={qrUrl}
                alt="QR Code"
                width={200}
                height={200}
                style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
              />
            </Box>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
            Add social links in your profile to generate a QR code.
          </Typography>
        )}

        {linkedInUrl && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography
              variant="h6"
              sx={{ color: brand.primary, mb: 1, fontSize: '0.7rem', textAlign: 'left' }}
            >
              LINKEDIN URL
            </Typography>
            <TextField
              value={linkedInUrl}
              size="small"
              fullWidth
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleCopy}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ mb: 1.5 }}
            />
            <Button
              variant="text"
              startIcon={<OpenInNewIcon />}
              href={linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: brand.primary, fontWeight: 600 }}
            >
              Open LinkedIn
            </Button>
          </>
        )}

        {/* Social icons */}
        {(socials?.github || socials?.twitterX) && (
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
            {socials?.linkedIn && (
              <IconButton
                href={socials.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: '#0A66C2' }}
              >
                <LinkedInIcon />
              </IconButton>
            )}
            {socials?.github && (
              <IconButton
                href={socials.github}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: '#333' }}
              >
                <GitHubIcon />
              </IconButton>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
