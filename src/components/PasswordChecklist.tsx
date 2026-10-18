import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import { brand } from '../theme/theme';
import { PASSWORD_RULES } from '../utils/people';

/** Live checklist of the password rules under a password field. */
export default function PasswordChecklist({ password }: { password: string }) {
  return (
    <Box
      component="ul"
      aria-label="Password requirements"
      sx={{ listStyle: 'none', p: 0, m: 0, mt: 0.5, display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 0.25 }}
    >
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(password);
        return (
          <Box component="li" key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {ok ? (
              <CheckCircleRoundedIcon sx={{ fontSize: 16, color: brand.success }} />
            ) : (
              <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
            )}
            <Typography variant="caption" sx={{ color: ok ? brand.success : 'text.secondary', fontWeight: ok ? 600 : 400 }}>
              {r.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
