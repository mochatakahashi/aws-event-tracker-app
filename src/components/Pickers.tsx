import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import dayjs, { type Dayjs } from 'dayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { renderMultiSectionDigitalClockTimeView } from '@mui/x-date-pickers/timeViewRenderers';

/**
 * Date and time pickers that are easy to use on phones and computers: tap a
 * day on a calendar, then scroll the hour / minute / AM-PM columns. Values
 * stay plain strings in Manila time, the same as the old inputs:
 * "2026-10-25T13:30" (date and time), "2026-10-25" (date), "13:30" (time).
 */

/** Side-by-side pop-up only on wide screens with a mouse; phones and narrow windows get the full sheet. */
const DESKTOP = '@media (min-width: 760px) and (pointer: fine)';

const SCROLL_COLUMNS = {
  hours: renderMultiSectionDigitalClockTimeView,
  minutes: renderMultiSectionDigitalClockTimeView,
  meridiem: renderMultiSectionDigitalClockTimeView,
};

interface Common {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  margin?: 'none' | 'dense' | 'normal';
  helperText?: ReactNode;
  error?: boolean;
  sx?: SxProps<Theme>;
  /** For tests: data-testid on the text box. */
  testId?: string;
}

const parse = (v: string, fmt: string): Dayjs | null => {
  if (!v) return null;
  const d = fmt === 'HH:mm' ? dayjs(`2000-01-01T${v}`) : dayjs(v);
  return d.isValid() ? d : null;
};

function fieldProps(p: Common, errorText?: string) {
  return {
    textField: {
      size: p.size ?? 'small',
      fullWidth: p.fullWidth ?? true,
      required: p.required,
      margin: p.margin,
      error: Boolean(errorText) || p.error,
      helperText: errorText || p.helperText,
      sx: p.sx,
      inputProps: p.testId ? { 'data-testid': p.testId } : undefined,
    },
    // Phones: the picker opens as a sheet with OK / Cancel; computers: a pop-up next to the field
    actionBar: { actions: ['clear', 'cancel', 'accept'] as ('clear' | 'cancel' | 'accept')[] },
  };
}

/** Date and time ("2026-10-25T13:30"). `min` (same format) blocks earlier values, e.g. an end before the start. */
export function DateTimeField(p: Common & { min?: string; minLabel?: string }) {
  const value = parse(p.value, 'datetime');
  const min = p.min ? parse(p.min, 'datetime') : null;
  const tooEarly = Boolean(value && min && value.isBefore(min));
  return (
    <DateTimePicker
      label={p.label}
      desktopModeMediaQuery={DESKTOP}
      value={value}
      disabled={p.disabled}
      onChange={(d) => p.onChange(d && d.isValid() ? d.format('YYYY-MM-DDTHH:mm') : '')}
      minDateTime={min ?? undefined}
      views={['year', 'month', 'day', 'hours', 'minutes']}
      openTo="day"
      format="MMM D, YYYY  h:mm A"
      timeSteps={{ minutes: 5 }}
      viewRenderers={SCROLL_COLUMNS}
      slotProps={fieldProps(p, tooEarly ? `Must be after ${p.minLabel || 'the start'}.` : undefined)}
    />
  );
}

/** Date only ("2026-10-25"). */
export function DateField(p: Common & { min?: string }) {
  return (
    <DatePicker
      label={p.label}
      desktopModeMediaQuery={DESKTOP}
      value={parse(p.value, 'date')}
      disabled={p.disabled}
      onChange={(d) => p.onChange(d && d.isValid() ? d.format('YYYY-MM-DD') : '')}
      minDate={p.min ? parse(p.min, 'date') ?? undefined : undefined}
      format="MMM D, YYYY"
      slotProps={fieldProps(p)}
    />
  );
}

/** Time only ("13:30"). */
export function TimeField(p: Common) {
  return (
    <TimePicker
      label={p.label}
      desktopModeMediaQuery={DESKTOP}
      value={parse(p.value, 'HH:mm')}
      disabled={p.disabled}
      onChange={(d) => p.onChange(d && d.isValid() ? d.format('HH:mm') : '')}
      format="h:mm A"
      timeSteps={{ minutes: 5 }}
      viewRenderers={SCROLL_COLUMNS}
      slotProps={fieldProps(p)}
    />
  );
}
