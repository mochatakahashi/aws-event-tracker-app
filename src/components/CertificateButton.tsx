import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import { certificateLink, certificateShareLink, certificateState, getEvaluation, submitEvaluation } from '../services/registrationService';
import type { Registration } from '../types/attendee';
import type { AppEvent } from '../types/event';
import type { EvalQuestion } from '../types/evaluation';
import { evaluationOpen, evaluationOpensAt, evaluationQuestions, evaluationRequired } from '../utils/evaluation';
import EvaluationDialog from './EvaluationDialog';

const when = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'the event ends';

const timeOnly = (ms: number) =>
  new Date(ms).toLocaleString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/**
 * Certificate of participation: unlocks after the event ends, only for people
 * checked in at it who answered the event evaluation (it opens 30 minutes
 * before the event ends). Then: View, Download, and a shareable link with the unique code.
 */
export default function CertificateButton({
  registration: initial,
  personId,
  event,
  autoOpenEvaluation = false,
  onChange,
}: {
  registration: Registration;
  personId: string;
  event: (Pick<AppEvent, 'startAt' | 'endAt'> & Partial<Pick<AppEvent, 'id' | 'title' | 'speakerIds' | 'evaluation'>>) | null | undefined;
  /** Open the form right away when it's open (from the reminder link). */
  autoOpenEvaluation?: boolean;
  onChange?: (registration: Registration) => void;
}) {
  const [registration, setRegistration] = useState(initial);
  useEffect(() => setRegistration(initial), [initial]);
  // Re-check every 30 seconds so the evaluation appears on time (30 minutes before the end)
  const [now, setNow] = useState(() => Date.now());
  const needsEval = Boolean(registration.checkedIn && !registration.evaluatedAt && evaluationRequired(event));
  useEffect(() => {
    if (!needsEval) return;
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, [needsEval]);
  const evalIsOpen = needsEval && evaluationOpen(event, now);
  const [questions, setQuestions] = useState<EvalQuestion[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [thanks, setThanks] = useState(false);
  useEffect(() => {
    if (!evalIsOpen || !event?.id) return;
    let alive = true;
    getEvaluation(event.id, personId)
      .then((st) => {
        if (!alive) return;
        setQuestions(st.questions);
        if (st.response) {
          // Already answered (e.g. on another device)
          setRegistration((r) => ({ ...r, evaluatedAt: st.response!.submittedAt }));
        } else if (autoOpenEvaluation) setFormOpen(true);
      })
      .catch(() => alive && setQuestions(evaluationQuestions(event)));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evalIsOpen, event?.id, personId]);
  const state = certificateState(registration, event, now);

  const evaluation = evalIsOpen ? (
    <Box
      data-testid="evaluation-prompt"
      sx={{ p: 1.75, mb: 1.5, borderRadius: '12px', border: `1px solid ${alpha(brand.primary, 0.35)}`, bgcolor: alpha(brand.primary, 0.06) }}
    >
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <RateReviewRoundedIcon sx={{ color: brand.primary, mt: 0.25 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            The evaluation is open
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
            Answer it to get your certificate. It takes about 2 minutes.
          </Typography>
          <Button variant="contained" size="small" disabled={!questions} onClick={() => setFormOpen(true)} sx={{ borderRadius: '10px', fontWeight: 700 }}>
            Answer the evaluation
          </Button>
        </Box>
      </Stack>
      {questions && (
        <EvaluationDialog
          open={formOpen}
          eventTitle={event?.title || 'This event'}
          questions={questions}
          onClose={() => setFormOpen(false)}
          onSubmit={async (answers) => {
            const updated = await submitEvaluation(event!.id!, personId, answers);
            setRegistration(updated);
            onChange?.(updated);
            setFormOpen(false);
            setThanks(true);
          }}
        />
      )}
    </Box>
  ) : thanks ? (
    <Box data-testid="evaluation-thanks" sx={{ mb: 1.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, color: brand.primary }}>
        Thanks for answering the evaluation!
      </Typography>
    </Box>
  ) : null;
  const [links, setLinks] = useState<{ view: string; download: string } | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const code = registration.certificateId;

  useEffect(() => {
    if (state !== 'ready') return;
    Promise.all([certificateLink(registration.id, personId), certificateLink(registration.id, personId, true)])
      .then(([view, download]) => setLinks(view && download ? { view, download } : null))
      .catch(() => setLinks(null));
  }, [registration.id, personId, state]);

  if (state !== 'ready') {
    const opensAt = evaluationOpensAt(event);
    const text =
      state === 'needs-evaluation'
        ? 'Your certificate unlocks as soon as you answer the event evaluation.'
        : state === 'after-event' && needsEval
          ? evalIsOpen
            ? `You're checked in. Your certificate unlocks after the event ends (${when(event?.endAt)}) once you've answered the evaluation.`
            : `You're checked in. The event evaluation opens at ${opensAt ? timeOnly(opensAt) : 'the end'}; answer it to get your certificate after the event ends (${when(event?.endAt)}).`
        : state === 'after-event'
        ? `You're checked in. Your certificate unlocks after the event ends (${when(event?.endAt)}).`
        : state === 'needs-check-in'
          ? 'Get checked in at the event to earn a certificate. It unlocks after the event ends.'
          : "No certificate for this event - you weren't checked in at the venue.";
    return (
      <>
      {evaluation}
      <Box
        data-testid="certificate-locked"
        sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, color: 'text.secondary', p: 1.5, borderRadius: '12px', bgcolor: alpha(brand.primary, 0.04) }}
      >
        <LockOutlinedIcon fontSize="small" sx={{ mt: 0.25 }} />
        <Typography variant="body2">{text}</Typography>
      </Box>
      </>
    );
  }

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(certificateShareLink(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked - the Verify link still works */
    }
  }

  return (
    <Box data-testid="certificate-ready">
      {evaluation}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <WorkspacePremiumIcon sx={{ color: brand.primary }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Your certificate is ready
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<VisibilityRoundedIcon />}
          disabled={!links}
          component="a"
          href={links?.view}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ borderRadius: '12px', fontWeight: 700 }}
        >
          View
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<DownloadRoundedIcon />}
          disabled={!links}
          component="a"
          href={links?.download}
          download
          sx={{ borderRadius: '12px', fontWeight: 700 }}
        >
          Download
        </Button>
      </Stack>
      {code && (
        <Box sx={{ mt: 1.25, p: 1.25, borderRadius: '12px', bgcolor: alpha(brand.primary, 0.05) }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Certificate code
          </Typography>
          <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 0.5 }} data-testid="certificate-code">
            {code}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
            <Button size="small" startIcon={<LinkRoundedIcon />} onClick={() => void copy()}>
              {copied ? 'Link copied!' : 'Copy link'}
            </Button>
            <Link component={RouterLink} to={`/verify/${code}`} variant="body2">
              Open certificate page
            </Link>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Anyone with the link can check it's genuine and view or download it.
          </Typography>
        </Box>
      )}
      {links === null && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
          Certificates open from the deployed app.
        </Typography>
      )}
    </Box>
  );
}
