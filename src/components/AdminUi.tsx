import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';

/** Back button + page title + optional actions, shared by the admin pages. */
export function AdminHeader({
  title,
  subtitle,
  actions,
  back = { label: 'Admin Dashboard', to: '/home' },
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** Where the back button goes (defaults to the Admin Dashboard). */
  back?: { label: string; to: string };
}) {
  const navigate = useNavigate();
  return (
    <Box sx={{ mb: 3 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(back.to)} sx={{ mb: 1.5 }}>
        {back.label}
      </Button>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={1.5}
      >
        <Box>
          <Typography variant="h2">{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {actions}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

/** Small number tile. */
export function StatTile({
  label,
  value,
  color = brand.primary,
}: {
  label: string;
  value: ReactNode;
  color?: string;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        flex: '1 1 130px',
        minWidth: 0,
        p: 1.75,
        borderColor: alpha(color, 0.25),
        bgcolor: alpha(color, 0.03),
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ color, mt: 0.5, fontWeight: 800 }}>
        {value}
      </Typography>
    </Card>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return (
    <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.5} sx={{ mb: 3 }}>
      {children}
    </Stack>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        p: 3,
        textAlign: 'center',
        borderRadius: 2,
        border: '1px dashed',
        borderColor: alpha(brand.primary, 0.25),
        color: 'text.secondary',
      }}
    >
      <Typography variant="body2">{children}</Typography>
    </Box>
  );
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDate(value?: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
