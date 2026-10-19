import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { keyframes } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/authService';
import { tourSteps, type TourStep } from '../utils/tourSteps';
import { isPartnerStaff } from '../utils/eventStaff';

/** Ask any page to start the tour (profile menu, Profile page). */
export const START_TOUR_EVENT = 'app-tour:start';
export function startTour() {
  window.dispatchEvent(new Event(START_TOUR_EVENT));
}

const seenKey = (personId: string) => `aws-event-tracker.tour.v1.${personId}`;

// Only transform/opacity animate (GPU-composited) so the tour stays smooth on phones
const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  70% { transform: scale(1.12); opacity: 0; }
  100% { transform: scale(1.12); opacity: 0; }
`;
const pop = keyframes`
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: none; }
`;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function visible(target: string): HTMLElement | null {
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`));
  return (
    all.find((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }) ?? null
  );
}

/**
 * The first visible element for a step (sidebar on laptops, bottom bar on
 * phones). If it isn't on screen, the step's fallback (e.g. the profile
 * picture on phones for My Event Pass) and its own explanation.
 */
function findTarget(step: TourStep): { el: HTMLElement | null; text: string } {
  if (!step.target) return { el: null, text: step.text };
  const el = visible(step.target);
  if (el) return { el, text: step.text };
  if (step.fallback) {
    const alt = visible(step.fallback.target);
    if (alt) return { el: alt, text: step.fallback.text };
  }
  return { el: null, text: step.text };
}

/**
 * A short guided tour for new users. It highlights each part of the app with
 * an animated box and explains it; people can skip at any time, and replay it
 * from the profile menu or the Profile page.
 */
export default function TutorialTour() {
  const { user, setCurrentUser } = useAuth();
  const steps = useMemo(() => (user ? tourSteps(user.role, isPartnerStaff(user)) : []), [user]);
  const [mode, setMode] = useState<'off' | 'offer' | 'tour'>('off');
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [stepText, setStepText] = useState('');
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // First visit: offer the tour (their choice to take it or skip)
  useEffect(() => {
    if (!user || user.mustChangePassword) return;
    let seen = Boolean(user.tutorialSeen);
    try {
      seen = seen || localStorage.getItem(seenKey(user.personId)) === '1';
    } catch {
      /* storage blocked */
    }
    if (!seen) setMode('offer');
  }, [user]);

  useEffect(() => {
    const start = () => {
      setIndex(0);
      setMode('tour');
    };
    window.addEventListener(START_TOUR_EVENT, start);
    return () => window.removeEventListener(START_TOUR_EVENT, start);
  }, []);

  const finish = useCallback(async () => {
    setMode('off');
    if (!user) return;
    try {
      localStorage.setItem(seenKey(user.personId), '1');
    } catch {
      /* ignore */
    }
    if (!user.tutorialSeen) {
      try {
        setCurrentUser(await updateProfile(user.personId, { tutorialSeen: true }));
      } catch {
        /* offline: the local flag is enough */
      }
    }
  }, [user, setCurrentUser]);

  const step = steps[index];

  // Follow the highlighted element (scrolling, resizing)
  useLayoutEffect(() => {
    if (mode !== 'tour' || !step) return;
    let frame = 0;
    const measure = () => {
      const { el, text } = findTarget(step);
      setStepText(text);
      if (!el) return setRect(null);
      const r = el.getBoundingClientRect();
      const next = { top: Math.round(r.top - 6), left: Math.round(r.left - 6), width: Math.round(r.width + 12), height: Math.round(r.height + 12) };
      // Skip re-renders when nothing moved
      setRect((cur) =>
        cur && cur.top === next.top && cur.left === next.left && cur.width === next.width && cur.height === next.height ? cur : next,
      );
    };
    // At most one measurement per frame while scrolling / resizing
    const onMove = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };
    findTarget(step).el?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    measure();
    const t = window.setTimeout(measure, 350);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, { capture: true, passive: true });
    return () => {
      window.clearTimeout(t);
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, { capture: true });
    };
  }, [mode, step, reduceMotion]);

  useEffect(() => {
    if (mode === 'off') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') void finish();
      if (mode === 'tour' && e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, steps.length - 1));
      if (mode === 'tour' && e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, finish, steps.length]);

  if (!user || mode === 'off' || steps.length === 0) return null;

  const firstName = user.firstName || user.name?.split(' ')[0] || 'there';

  // Card position: beside the highlighted box when there's room, else centered
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(360, vw - 32);
  let cardPos: Record<string, number | string> = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  if (mode === 'tour' && rect) {
    if (rect.left + rect.width + 16 + cardW < vw) {
      cardPos = { top: Math.min(Math.max(16, rect.top), vh - 260), left: rect.left + rect.width + 16 };
    } else if (rect.top > vh / 2) {
      cardPos = { bottom: vh - rect.top + 16, left: Math.max(16, Math.min(rect.left, vw - cardW - 16)) };
    } else {
      cardPos = { top: rect.top + rect.height + 16, left: Math.max(16, Math.min(rect.left, vw - cardW - 16)) };
    }
  }

  return createPortal(
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="App tour"
      data-testid="app-tour"
      sx={{ position: 'fixed', inset: 0, zIndex: 2000 }}
    >
      {/* Dim backdrop with a cut-out box around what we're explaining */}
      {mode === 'tour' && rect ? (
        <Box
          data-testid="tour-spotlight"
          style={{
            // Position with transform (no layout work while moving)
            transform: `translate3d(${rect.left}px, ${rect.top}px, 0)`,
            width: rect.width,
            height: rect.height,
          }}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            borderRadius: '14px',
            border: `3px solid ${brand.accent ?? '#F59E0B'}`,
            boxShadow: '0 0 0 9999px rgba(26, 10, 46, 0.6)',
            transition: reduceMotion ? 'none' : 'transform 0.3s cubic-bezier(.2,.8,.2,1), width 0.3s cubic-bezier(.2,.8,.2,1), height 0.3s cubic-bezier(.2,.8,.2,1)',
            willChange: 'transform',
            pointerEvents: 'none',
            // Pulsing ring: its own layer, only transform + opacity animate
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: -6,
              borderRadius: '18px',
              border: '3px solid rgba(168, 85, 200, 0.9)',
              animation: reduceMotion ? 'none' : `${pulse} 1.6s ease-out infinite`,
              willChange: 'transform, opacity',
            },
          }}
        />
      ) : (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(26, 10, 46, 0.6)' }} />
      )}

      <Paper
        key={`${mode}-${index}`}
        elevation={8}
        sx={{
          position: 'fixed',
          ...cardPos,
          width: cardW,
          p: 2.5,
          borderRadius: '18px',
          animation: reduceMotion ? 'none' : `${pop} 0.3s ease`,
        }}
      >
        {mode === 'offer' ? (
          <>
            <Typography sx={{ fontSize: 36, lineHeight: 1 }} aria-hidden>
              👋
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>
              Welcome, {firstName}!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Want a quick tour? It takes about a minute and shows where everything is. You can skip it now and take it
              later from your profile.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button variant="contained" onClick={() => setMode('tour')} sx={{ flex: 1 }}>
                Show me around
              </Button>
              <Button onClick={() => void finish()} sx={{ flex: 1 }}>
                Skip
              </Button>
            </Stack>
          </>
        ) : (
          step && (
            <>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: 1 }}>
                Step {index + 1} of {steps.length}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {step.emoji ? `${step.emoji} ` : ''}
                {step.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {stepText || step.text}
              </Typography>
              {/* Progress dots */}
              <Stack direction="row" spacing={0.5} sx={{ mt: 1.75 }} aria-hidden>
                {steps.map((_, i) => (
                  <Box
                    key={i}
                    sx={{
                      width: i === index ? 18 : 7,
                      height: 7,
                      borderRadius: 4,
                      bgcolor: i <= index ? brand.primary : 'divider',
                      transition: reduceMotion ? 'none' : 'all 0.25s ease',
                    }}
                  />
                ))}
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                <Button size="small" onClick={() => void finish()} sx={{ color: 'text.secondary' }}>
                  Skip tour
                </Button>
                <Box sx={{ flex: 1 }} />
                {index > 0 && (
                  <Button size="small" onClick={() => setIndex((i) => i - 1)}>
                    Back
                  </Button>
                )}
                {index < steps.length - 1 ? (
                  <Button size="small" variant="contained" onClick={() => setIndex((i) => i + 1)}>
                    Next
                  </Button>
                ) : (
                  <Button size="small" variant="contained" onClick={() => void finish()}>
                    Done
                  </Button>
                )}
              </Stack>
            </>
          )
        )}
      </Paper>
    </Box>,
    document.body,
  );
}
