import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded';
import NoPhotographyOutlinedIcon from '@mui/icons-material/NoPhotographyOutlined';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { LOGOS } from '../brandAssets';
import { imageSrc } from '../utils/imageUrl';
import { CLUB_HANDLE, STORY_H, STORY_W, drawStory, storyCaption, storyHashtags, type StoryData, type StoryStamp } from '../utils/storyCard';
import type { AppEvent } from '../types/event';
import type { Session, Stamp } from '../types/session';

/** Loads an image for the canvas. Cross-site images without CORS are skipped (they would block the download). */
function loadImage(src?: string, crossOrigin = true): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    if (crossOrigin && !src.startsWith('data:') && !src.startsWith('blob:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const day = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' }) : '';

/** The stamp slots on the card, in session order. */
export function storyStamps(sessions: Session[], stamps: Stamp[]): StoryStamp[] {
  return sessions
    .filter((s) => s.requiresStamp)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((s, i) => ({
      label: `Session ${i + 1}`,
      title: s.title,
      collected: stamps.some((st) => st.sessionId === s.id && st.status === 'approved'),
    }));
}

type PhotoMode = 'profile' | 'custom' | 'none';

/**
 * "Share my stamps": an Instagram story card (1080 x 1920) with the event,
 * "Hi, I'm …", the stamps they got (they pop in like real stamps), the club
 * handle and hashtags. Share opens the phone's share sheet (Instagram,
 * Facebook, Messenger …); Download saves the picture. A photo picked here
 * stays on the device and is not uploaded.
 */
export default function StampStoryDialog({
  open,
  onClose,
  event,
  sessions,
  stamps,
  person,
}: {
  open: boolean;
  onClose: () => void;
  event: AppEvent;
  sessions: Session[];
  stamps: Stamp[];
  person: { name: string; firstName?: string; avatarUrl?: string };
}) {
  const phone = useMediaQuery(useTheme().breakpoints.down('sm'));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<{ club: HTMLImageElement | null; school: HTMLImageElement | null; profile: HTMLImageElement | null } | null>(null);
  const [custom, setCustom] = useState<HTMLImageElement | null>(null);
  const [mode, setMode] = useState<PhotoMode>('profile');
  const [play, setPlay] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'success' | 'info' | 'error'; text: string } | null>(null);

  const slots = useMemo(() => storyStamps(sessions, stamps), [sessions, stamps]);
  const collected = slots.filter((s) => s.collected).length;
  const complete = slots.length > 0 && collected === slots.length;
  const hashtags = useMemo(() => storyHashtags(event.title, complete), [event.title, complete]);
  const caption = storyCaption(event.title, collected, slots.length, hashtags);
  const first = person.firstName || person.name.split(/\s+/)[0] || '';
  const initials = person.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  // Logos and the profile photo
  useEffect(() => {
    if (!open || images) return;
    let alive = true;
    Promise.all([loadImage(LOGOS.badge, false), loadImage(LOGOS.school, false), loadImage(imageSrc(person.avatarUrl))]).then(([club, school, profile]) => {
      if (alive) setImages({ club, school, profile });
    });
    return () => {
      alive = false;
    };
  }, [open, images, person.avatarUrl]);

  const data = useCallback(
    (): StoryData => ({
      eventTitle: event.title,
      when: [day(event.startAt), event.venue].filter(Boolean).join(' · '),
      firstName: first,
      initials,
      stamps: slots,
      hashtags,
      photo: mode === 'custom' ? custom : mode === 'profile' ? images?.profile : null,
      clubLogo: images?.club,
      schoolLogo: images?.school,
    }),
    [event.title, event.startAt, event.venue, first, initials, slots, hashtags, mode, custom, images],
  );

  // Draw, with the opening animation (skipped for "reduce motion")
  useEffect(() => {
    if (!open || !images) return;
    let raf = 0;
    let cancelled = false;
    const run = async () => {
      try {
        await document.fonts?.ready;
      } catch {
        /* draw anyway */
      }
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx || cancelled) return;
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const d = data();
      if (reduce || play < 0) {
        drawStory(ctx, d, 1);
        return;
      }
      const start = performance.now();
      const ms = 2600;
      const frame = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - start) / ms);
        drawStory(ctx, d, t);
        if (t < 1) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };
    void run();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [open, images, data, play]);

  /** The finished card as a PNG file. */
  async function toFile(): Promise<File> {
    const c = document.createElement('canvas');
    c.width = STORY_W;
    c.height = STORY_H;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('Could not make the picture.');
    drawStory(ctx, data(), 1);
    const blob = await new Promise<Blob | null>((res) => {
      try {
        c.toBlob(res, 'image/png');
      } catch {
        res(null);
      }
    });
    if (!blob) throw new Error('Could not make the picture. Try without the photo.');
    const slug = event.title.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'event';
    return new File([blob], `${slug}-my-stamps.png`, { type: 'image/png' });
  }

  function save(file: File) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function download() {
    setBusy(true);
    setMsg(null);
    try {
      save(await toFile());
      setMsg({ kind: 'success', text: `Saved. Post it as a story and tag ${CLUB_HANDLE}!` });
    } catch (e) {
      setMsg({ kind: 'error', text: e instanceof Error ? e.message : 'Could not save the picture.' });
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    setBusy(true);
    setMsg(null);
    try {
      const file = await toFile();
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({ files: [file], text: caption });
          setMsg({ kind: 'success', text: `Shared! Don't forget to tag ${CLUB_HANDLE}.` });
        } catch (e) {
          if ((e as Error)?.name !== 'AbortError') throw e;
        }
      } else {
        // Computers: save it, then post from the phone
        save(file);
        setMsg({ kind: 'info', text: 'This device can’t share pictures directly, so it was saved instead. Post it from your phone and tag us.' });
      }
    } catch (e) {
      setMsg({ kind: 'error', text: e instanceof Error ? e.message : 'Could not share the picture.' });
    } finally {
      setBusy(false);
    }
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      setMsg({ kind: 'success', text: 'Caption copied. Paste it in your story or post.' });
    } catch {
      setMsg({ kind: 'error', text: 'Could not copy. Select the caption and copy it.' });
    }
  }

  async function pickPhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMsg({ kind: 'error', text: 'Pick a picture file.' });
      return;
    }
    const url = URL.createObjectURL(file);
    const img = await loadImage(url, false);
    if (!img) {
      setMsg({ kind: 'error', text: 'Could not open that picture. Try another one.' });
      return;
    }
    setCustom(img);
    setMode('custom');
    setMsg(null);
  }

  const profileOk = Boolean(images?.profile);

  return (
    <Dialog open={open} onClose={onClose} fullScreen={phone} maxWidth="md" fullWidth aria-labelledby="story-title" data-testid="story-dialog">
      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
          <AutoAwesomeRoundedIcon color="primary" sx={{ mr: 1 }} />
          <Typography id="story-title" variant="h3" sx={{ flex: 1, fontWeight: 800 }}>
            Share my stamps
          </Typography>
          <IconButton aria-label="Close" onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'auto minmax(0, 1fr)' }, gap: { xs: 2, md: 3 }, alignItems: 'start' }}>
          {/* Card preview */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box
              sx={{
                position: 'relative',
                width: { xs: 'min(78vw, 300px)', md: 320 },
                aspectRatio: '9 / 16',
                borderRadius: '22px',
                overflow: 'hidden',
                boxShadow: '0 18px 50px rgba(45,10,62,0.35)',
                bgcolor: '#2D0A3E',
              }}
            >
              <canvas
                ref={canvasRef}
                width={STORY_W}
                height={STORY_H}
                style={{ width: '100%', height: '100%', display: 'block' }}
                aria-label={`Story card: ${person.name}, ${collected} of ${slots.length} stamps at ${event.title}`}
                role="img"
                data-testid="story-canvas"
              />
              {!images && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                  <CircularProgress sx={{ color: '#fff' }} />
                </Box>
              )}
            </Box>
          </Box>

          {/* Actions */}
          <Stack spacing={1.5} sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary">
              Post it as an Instagram story (or on Facebook, TikTok, Messenger) and tag <b>{CLUB_HANDLE}</b>. Add what you learned
              with the story text tool on the lines at the bottom.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button variant="contained" startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <IosShareRoundedIcon />} onClick={() => void share()} disabled={busy || !images}>
                Share
              </Button>
              <Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={() => void download()} disabled={busy || !images}>
                Download
              </Button>
              <Tooltip title="Play the animation again">
                <IconButton aria-label="Play again" onClick={() => setPlay((p) => (p < 0 ? 1 : p + 1))}>
                  <ReplayRoundedIcon />
                </IconButton>
              </Tooltip>
            </Stack>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                Photo on the card
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {profileOk && (
                  <Button size="small" variant={mode === 'profile' ? 'contained' : 'outlined'} startIcon={<AccountCircleRoundedIcon />} onClick={() => setMode('profile')}>
                    Profile photo
                  </Button>
                )}
                <Button size="small" variant={mode === 'custom' ? 'contained' : 'outlined'} startIcon={<AddPhotoAlternateRoundedIcon />} onClick={() => fileRef.current?.click()}>
                  {custom ? 'Change photo' : 'Use another photo'}
                </Button>
                <Button size="small" variant={mode === 'none' ? 'contained' : 'outlined'} startIcon={<NoPhotographyOutlinedIcon />} onClick={() => setMode('none')}>
                  No photo
                </Button>
              </Stack>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                data-testid="story-photo-input"
                onChange={(e) => {
                  void pickPhoto(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                A photo you pick here stays on your device. It isn’t uploaded or saved to your profile.
              </Typography>
            </Box>

            <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'action.hover' }}>
              <Stack direction="row" alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, flex: 1 }}>
                  Caption
                </Typography>
                <Button size="small" startIcon={<ContentCopyRoundedIcon />} onClick={() => void copyCaption()}>
                  Copy
                </Button>
              </Stack>
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }} data-testid="story-caption">
                {caption}
              </Typography>
            </Box>

            {msg && (
              <Alert severity={msg.kind} onClose={() => setMsg(null)} data-testid="story-msg">
                {msg.text}
              </Alert>
            )}
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

/** "Share my stamps" button: shows when the person has at least one stamp at the event. */
export function ShareStampsButton({
  event,
  sessions,
  stamps,
  person,
  variant = 'contained',
  fullWidth,
  onDark,
}: {
  event: AppEvent;
  sessions: Session[];
  stamps: Stamp[];
  person: { name: string; firstName?: string; avatarUrl?: string } | null | undefined;
  variant?: 'contained' | 'outlined';
  fullWidth?: boolean;
  /** White button for the purple passport header. */
  onDark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const mine = useMemo(() => {
    const ids = new Set(sessions.filter((s) => s.eventId === event.id && s.requiresStamp).map((s) => s.id));
    return { sessions: sessions.filter((s) => ids.has(s.id)), stamps: stamps.filter((st) => ids.has(st.sessionId)) };
  }, [sessions, stamps, event.id]);
  if (!person || !mine.stamps.some((st) => st.status === 'approved')) return null;
  return (
    <>
      <Button
        variant={variant}
        fullWidth={fullWidth}
        startIcon={<AutoAwesomeRoundedIcon />}
        onClick={() => setOpen(true)}
        data-testid={`share-stamps-${event.id}`}
        sx={
          onDark
            ? { bgcolor: '#fff', color: '#4A1259', fontWeight: 800, '&:hover': { bgcolor: '#F5E8FF' }, boxShadow: '0 6px 18px rgba(0,0,0,0.2)' }
            : { fontWeight: 800 }
        }
      >
        Share my stamps
      </Button>
      {open && <StampStoryDialog open onClose={() => setOpen(false)} event={event} sessions={mine.sessions} stamps={mine.stamps} person={person} />}
    </>
  );
}
