import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import type { EvalAnswers, EvalQuestion } from '../types/evaluation';
import { checkAnswers, RATING_LABELS } from '../utils/evaluation';

/** The evaluation form: ratings (1 to 5), yes / no, choices and written answers. */
export default function EvaluationDialog({
  open,
  eventTitle,
  questions,
  onClose,
  onSubmit,
}: {
  open: boolean;
  eventTitle: string;
  questions: EvalQuestion[];
  onClose: () => void;
  /** Throws to show an error. */
  onSubmit: (answers: EvalAnswers) => Promise<void>;
}) {
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down('sm'));
  const [answers, setAnswers] = useState<EvalAnswers>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (id: string, v: number | string) => {
    setAnswers((prev) => ({ ...prev, [id]: v }));
    setError('');
  };

  async function submit() {
    const problem = checkAnswers(questions, answers);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSubmit(answers);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send your answers. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullScreen={phone} fullWidth maxWidth="sm" aria-labelledby="eval-title">
      <DialogTitle id="eval-title" sx={{ pb: 0.75, textTransform: 'none', letterSpacing: 0, fontWeight: 800, fontSize: '1.15rem' }}>
        Event evaluation
        <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>
          {eventTitle}. Answer it to get your certificate.
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} data-testid="evaluation-form">
          {questions.map((q, i) => (
            <Box key={q.id} data-testid={`eval-q-${q.id}`}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
                {i + 1}. {q.label}
                {q.required ? (
                  <Typography component="span" color="error" sx={{ ml: 0.5 }} aria-hidden>
                    *
                  </Typography>
                ) : (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                    (optional)
                  </Typography>
                )}
              </Typography>
              {q.type === 'rating' && (
                <>
                  <ToggleButtonGroup
                    exclusive
                    value={answers[q.id] ?? null}
                    onChange={(_, v) => v !== null && set(q.id, v)}
                    aria-label={q.label}
                    sx={{ display: 'flex', '& .MuiToggleButton-root': { flex: 1, fontWeight: 800, py: 1 }, '& .MuiToggleButton-root.Mui-selected, & .MuiToggleButton-root.Mui-selected:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' } }}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <ToggleButton key={n} value={n} aria-label={`${n} - ${RATING_LABELS[n]}`}>
                        {n}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      1 = Poor
                    </Typography>
                    <Typography variant="caption" color={answers[q.id] ? 'primary' : 'text.secondary'} sx={{ fontWeight: 700 }}>
                      {answers[q.id] ? RATING_LABELS[Number(answers[q.id])] : ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      5 = Excellent
                    </Typography>
                  </Stack>
                </>
              )}
              {q.type === 'yesno' && (
                <ToggleButtonGroup
                  exclusive
                  value={answers[q.id] ?? null}
                  onChange={(_, v) => v !== null && set(q.id, v)}
                  aria-label={q.label}
                  sx={{ '& .MuiToggleButton-root': { px: 3, fontWeight: 700, textTransform: 'none' }, '& .MuiToggleButton-root.Mui-selected, & .MuiToggleButton-root.Mui-selected:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' } }}
                >
                  <ToggleButton value="yes">Yes</ToggleButton>
                  <ToggleButton value="no">No</ToggleButton>
                </ToggleButtonGroup>
              )}
              {q.type === 'choice' && (
                <RadioGroup value={answers[q.id] ?? ''} onChange={(e) => set(q.id, e.target.value)} aria-label={q.label}>
                  {(q.options || []).map((o) => (
                    <FormControlLabel key={o} value={o} control={<Radio size="small" />} label={o} />
                  ))}
                </RadioGroup>
              )}
              {q.type === 'text' && (
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={6}
                  value={answers[q.id] ?? ''}
                  onChange={(e) => set(q.id, e.target.value)}
                  inputProps={{ maxLength: 2000, 'aria-label': q.label }}
                  placeholder="Your answer"
                />
              )}
            </Box>
          ))}
        </Stack>
      </DialogContent>
      {error && (
        <Alert severity="error" sx={{ mx: 2, mt: 1.5 }}>
          {error}
        </Alert>
      )}
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} disabled={busy}>
          Later
        </Button>
        <Button variant="contained" onClick={() => void submit()} disabled={busy}>
          {busy ? 'Sending…' : 'Submit evaluation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
