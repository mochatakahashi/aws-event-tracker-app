import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { getEvaluationSummary, type EvaluationSummary } from '../services/registrationService';
import type { AppEvent } from '../types/event';

const when = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

function csvCell(v: unknown): string {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Evaluation results for an event: how many answered, the average rating per
 * question, yes / no and choice counts, the written answers, who hasn't
 * answered yet, and a CSV download. For admins, the adviser and the event's officers.
 */
export default function EvaluationResults({ event, viewer }: { event: AppEvent; viewer: { personId: string; role?: string } | null | undefined }) {
  const allowed =
    viewer && (viewer.role === 'admin' || viewer.role === 'adviser' || (viewer.role === 'officer' && (event.officerIds || []).includes(viewer.personId)));
  const [data, setData] = useState<EvaluationSummary | null>(null);
  const [showText, setShowText] = useState<string | null>(null);
  const [showPending, setShowPending] = useState(false);

  useEffect(() => {
    if (!allowed) return;
    getEvaluationSummary(event.id, viewer!.personId)
      .then(setData)
      .catch(() => setData(null));
  }, [allowed, event.id, viewer]);

  if (!allowed || !data || !data.required) return null;
  // Only once the form has opened
  if (data.opensAt && Date.now() < new Date(data.opensAt).getTime() && data.responses.length === 0) return null;

  const n = data.responses.length;

  function download() {
    const head = ['Name', 'Submitted', ...data!.questions.map((q) => q.label)];
    const rows = data!.responses.map((r) => [r.personName || r.personId, when(r.submittedAt), ...data!.questions.map((q) => r.answers[q.id] ?? '')]);
    const csv = [head, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/[^\w]+/g, '-').slice(0, 60)}-evaluation.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Box data-testid="evaluation-results" sx={{ mt: 4 }}>
      <Divider sx={{ mb: 3 }} />
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap spacing={1} sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <RateReviewRoundedIcon sx={{ color: brand.primary }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Evaluation results
          </Typography>
        </Stack>
        <Button size="small" variant="outlined" startIcon={<DownloadRoundedIcon />} disabled={n === 0} onClick={download}>
          Download CSV
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} data-testid="evaluation-count">
        {n} of {data.checkedIn} checked-in attendee{data.checkedIn === 1 ? '' : 's'} answered
        {data.pending.length > 0 && (
          <>
            {' · '}
            <Button size="small" sx={{ p: 0, minWidth: 0, verticalAlign: 'baseline' }} onClick={() => setShowPending((v) => !v)}>
              {showPending ? 'hide' : `${data.pending.length} haven't yet`}
            </Button>
          </>
        )}
      </Typography>
      <Collapse in={showPending} unmountOnExit>
        <Typography variant="body2" sx={{ mb: 2, p: 1.25, borderRadius: '10px', bgcolor: alpha(brand.primary, 0.04) }}>
          {data.pending.map((p) => p.name || p.personId).join(', ')}
        </Typography>
      </Collapse>
      <Stack spacing={2}>
        {data.questions.map((q) => {
          const answers = data.responses.map((r) => r.answers[q.id]).filter((a) => a !== undefined && a !== '');
          if (q.type === 'rating') {
            const nums = answers.map(Number).filter((x) => x >= 1 && x <= 5);
            const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
            return (
              <Box key={q.id} data-testid={`result-${q.id}`}>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {q.label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
                    {nums.length ? `${avg.toFixed(2)} / 5` : '-'}
                  </Typography>
                </Stack>
                <LinearProgress variant="determinate" value={(avg / 5) * 100} sx={{ height: 8, borderRadius: 4, mt: 0.5 }} aria-label={`${q.label}: average ${avg.toFixed(2)} of 5`} />
              </Box>
            );
          }
          if (q.type === 'yesno' || q.type === 'choice') {
            const opts = q.type === 'yesno' ? ['yes', 'no'] : q.options || [];
            return (
              <Box key={q.id} data-testid={`result-${q.id}`}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {q.label}
                </Typography>
                {opts.map((o) => {
                  const c = answers.filter((a) => a === o).length;
                  const pct = answers.length ? Math.round((c / answers.length) * 100) : 0;
                  return (
                    <Stack key={o} direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
                      <Typography variant="caption" sx={{ width: 110, flexShrink: 0, textTransform: q.type === 'yesno' ? 'capitalize' : 'none' }} noWrap>
                        {o}
                      </Typography>
                      <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                      <Typography variant="caption" sx={{ width: 64, textAlign: 'right' }}>
                        {c} ({pct}%)
                      </Typography>
                    </Stack>
                  );
                })}
              </Box>
            );
          }
          return (
            <Box key={q.id} data-testid={`result-${q.id}`}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {q.label}
                </Typography>
                <Button size="small" disabled={answers.length === 0} onClick={() => setShowText((v) => (v === q.id ? null : q.id))}>
                  {showText === q.id ? 'Hide' : `${answers.length} answer${answers.length === 1 ? '' : 's'}`}
                </Button>
              </Stack>
              <Collapse in={showText === q.id} unmountOnExit>
                <Stack spacing={0.75} sx={{ mt: 0.5 }}>
                  {data.responses
                    .filter((r) => r.answers[q.id])
                    .map((r) => (
                      <Box key={r.id} sx={{ p: 1, borderRadius: '8px', bgcolor: alpha(brand.primary, 0.04) }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                          {String(r.answers[q.id])}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {r.personName || r.personId}
                        </Typography>
                      </Box>
                    ))}
                </Stack>
              </Collapse>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
