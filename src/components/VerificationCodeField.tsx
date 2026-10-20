import TextField from '@mui/material/TextField';

/**
 * The 6-digit code from the email. The person types it: no autofill hints
 * (not `one-time-code`), digits only, 6 max.
 */
export default function VerificationCodeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <TextField
      label="6-digit code from your email"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      fullWidth
      size="small"
      margin="dense"
      required
      autoComplete="off"
      name="verify-code-entry"
      inputProps={{
        inputMode: 'numeric',
        maxLength: 6,
        'aria-label': 'Verification code',
        'data-lpignore': 'true',
        'data-1p-ignore': 'true',
        style: { letterSpacing: '0.35em', fontWeight: 700, fontSize: '1.15rem' },
      }}
      helperText="Check your inbox (and spam). The code expires in 10 minutes."
    />
  );
}
