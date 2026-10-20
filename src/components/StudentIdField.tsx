import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { STUDENT_ID_ERROR, formatStudentId, isValidStudentId } from '../utils/people';

/**
 * APC student ID input: digits only, the dash is added while typing, and
 * it stops at 11 characters (2026-140242).
 */
export default function StudentIdField({
  value,
  onChange,
  label = 'APC student ID',
  showError,
  helperText,
  ...rest
}: Omit<TextFieldProps, 'value' | 'onChange'> & {
  value: string;
  onChange: (v: string) => void;
  /** Show the format error (e.g. after the person leaves the field or presses save). */
  showError?: boolean;
}) {
  const bad = Boolean(value) && !isValidStudentId(value);
  return (
    <TextField
      {...rest}
      label={label}
      value={value}
      onChange={(e) => onChange(formatStudentId(e.target.value))}
      error={(showError ?? bad) && bad}
      helperText={(showError ?? true) && bad && value.length >= 11 ? STUDENT_ID_ERROR : helperText ?? 'Format: 2026-140242'}
      placeholder="2026-140242"
      inputProps={{ ...(rest.inputProps || {}), inputMode: 'numeric', maxLength: 11, autoComplete: 'off', 'aria-label': typeof label === 'string' ? label : 'Student ID' }}
    />
  );
}
