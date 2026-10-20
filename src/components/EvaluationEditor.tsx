import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import type { EvalQuestion, EvalQuestionType, EventEvaluation } from '../types/evaluation';
import { standardQuestions } from '../utils/evaluation';

const TYPES: { value: EvalQuestionType; label: string }[] = [
  { value: 'rating', label: 'Rating 1 to 5' },
  { value: 'yesno', label: 'Yes / No' },
  { value: 'choice', label: 'Multiple choice' },
  { value: 'text', label: 'Written answer' },
];

/**
 * Admin: the event's evaluation form. Starts with the standard questions;
 * questions can be edited, reordered, removed or added.
 */
export default function EvaluationEditor({
  value,
  hasSpeakers,
  onChange,
}: {
  value: EventEvaluation | undefined;
  hasSpeakers: boolean;
  onChange: (next: EventEvaluation) => void;
}) {
  const enabled = value?.enabled !== false;
  const questions = value?.questions?.length ? value.questions : standardQuestions(hasSpeakers);
  const save = (qs: EvalQuestion[], on = enabled) => onChange({ enabled: on, questions: qs });
  const patch = (i: number, changes: Partial<EvalQuestion>) => save(questions.map((q, j) => (j === i ? { ...q, ...changes } : q)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...questions];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    save(next);
  };

  return (
    <Box data-testid="evaluation-editor">
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={1} sx={{ mb: 0.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Evaluation form
        </Typography>
        <FormControlLabel
          control={<Switch checked={enabled} onChange={(e) => save(questions, e.target.checked)} />}
          label="Needed for the certificate"
        />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Opens for checked-in attendees 30 minutes before the event ends. Their certificate unlocks once they answer it, and
        anyone who hasn't answered gets a reminder (app + email) after the event.
      </Typography>
      {enabled && (
        <Stack spacing={1.25}>
          {questions.map((q, i) => (
            <Paper key={q.id} variant="outlined" sx={{ p: 1.5, borderRadius: '12px', borderColor: alpha(brand.primary, 0.2) }} data-testid={`eval-edit-${i}`}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-start' }}>
                <TextField
                  size="small"
                  fullWidth
                  label={`Question ${i + 1}`}
                  value={q.label}
                  onChange={(e) => patch(i, { label: e.target.value })}
                  inputProps={{ maxLength: 200 }}
                />
                <TextField
                  select
                  size="small"
                  label="Type"
                  value={q.type}
                  onChange={(e) => {
                    const type = e.target.value as EvalQuestionType;
                    patch(i, { type, options: type === 'choice' ? (q.options?.length ? q.options : ['', '']) : undefined });
                  }}
                  sx={{ minWidth: { sm: 170 } }}
                >
                  {TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              {q.type === 'choice' && (
                <Stack spacing={0.75} sx={{ mt: 1, pl: { sm: 2 } }}>
                  {(q.options || []).map((o, k) => (
                    <Stack key={k} direction="row" spacing={1} alignItems="center">
                      <TextField
                        size="small"
                        fullWidth
                        label={`Choice ${k + 1}`}
                        value={o}
                        onChange={(e) => patch(i, { options: (q.options || []).map((x, m) => (m === k ? e.target.value : x)) })}
                        inputProps={{ maxLength: 80 }}
                      />
                      <IconButton
                        size="small"
                        aria-label={`Remove choice ${k + 1}`}
                        disabled={(q.options || []).length <= 2}
                        onClick={() => patch(i, { options: (q.options || []).filter((_, m) => m !== k) })}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                  {(q.options || []).length < 10 && (
                    <Button size="small" startIcon={<AddIcon />} onClick={() => patch(i, { options: [...(q.options || []), ''] })} sx={{ alignSelf: 'flex-start' }}>
                      Add choice
                    </Button>
                  )}
                </Stack>
              )}
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={q.required} onChange={(e) => patch(i, { required: e.target.checked })} />}
                  label={<Typography variant="body2">Required</Typography>}
                />
                <Stack direction="row">
                  <Tooltip title="Move up">
                    <span>
                      <IconButton size="small" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                        <ArrowUpwardRoundedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Move down">
                    <span>
                      <IconButton size="small" aria-label="Move down" disabled={i === questions.length - 1} onClick={() => move(i, 1)}>
                        <ArrowDownwardRoundedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Remove question">
                    <span>
                      <IconButton
                        size="small"
                        aria-label={`Remove question ${i + 1}`}
                        disabled={questions.length <= 1}
                        onClick={() => save(questions.filter((_, j) => j !== i))}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </Stack>
            </Paper>
          ))}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              disabled={questions.length >= 25}
              onClick={() => save([...questions, { id: `q-${Date.now().toString(36)}`, type: 'text', label: '', required: false }])}
              sx={{ textTransform: 'none' }}
            >
              Add question
            </Button>
            <Button
              size="small"
              color="inherit"
              startIcon={<RestartAltRoundedIcon />}
              onClick={() => save(standardQuestions(hasSpeakers))}
              sx={{ textTransform: 'none' }}
            >
              Use the standard questions
            </Button>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
