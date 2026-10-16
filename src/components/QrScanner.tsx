import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import NoPhotographyOutlinedIcon from '@mui/icons-material/NoPhotographyOutlined';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';

interface Props {
  /** Called with the decoded text. The scanner keeps running unless `paused`. */
  onResult: (text: string) => void;
  /** Stop decoding (camera stays on so resuming is instant). */
  paused?: boolean;
}

type CameraState = 'idle' | 'starting' | 'on' | 'error';

/** Camera QR scanner (getUserMedia + jsQR). Prefers the back camera on phones. */
export default function QrScanner({ onResult, paused = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pausedRef = useRef(paused);
  const onResultRef = useRef(onResult);
  const [state, setState] = useState<CameraState>('idle');
  const [message, setMessage] = useState('');

  pausedRef.current = paused;
  onResultRef.current = onResult;

  function stop() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('error');
      setMessage(
        window.isSecureContext
          ? 'This browser cannot open the camera. Use search instead.'
          : 'The camera only works on the secure (https) app link. Use search instead.',
      );
      return;
    }
    setState('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return stop();
      video.srcObject = stream;
      await video.play();
      setState('on');
    } catch (e) {
      const name = (e as DOMException)?.name;
      setState('error');
      setMessage(
        name === 'NotAllowedError'
          ? 'Camera permission was blocked. Allow camera access for this site in your browser settings, then try again.'
          : name === 'NotFoundError'
            ? 'No camera was found on this device. Use search instead.'
            : 'Could not start the camera. Close other apps using it and try again.',
      );
    }
  }

  // Decode loop
  useEffect(() => {
    if (state !== 'on') return;
    let raf = 0;
    let last = 0;
    let alive = true;
    let jsQR: typeof import('jsqr').default | null = null;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    import('jsqr').then((m) => (jsQR = m.default));

    const tick = (t: number) => {
      if (!alive) return;
      raf = requestAnimationFrame(tick);
      const video = videoRef.current;
      if (!jsQR || !ctx || !video || pausedRef.current || t - last < 180 || video.readyState < 2) return;
      last = t;
      // Downscale for speed; QR codes on phone screens are large.
      const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      if (!canvas.width || !canvas.height) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
      if (code?.data) onResultRef.current(code.data);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [state]);

  // Start on mount, release the camera on unmount
  useEffect(() => {
    void start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1',
        maxHeight: '70vh',
        borderRadius: '20px',
        overflow: 'hidden',
        bgcolor: '#120821',
      }}
    >
      <Box
        component="video"
        ref={videoRef}
        muted
        playsInline
        aria-label="Camera preview"
        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: state === 'on' ? 'block' : 'none' }}
      />

      {state === 'on' && (
        <>
          {/* Aiming frame */}
          <Box
            sx={{
              position: 'absolute',
              inset: '18%',
              borderRadius: '18px',
              boxShadow: `0 0 0 9999px ${alpha('#000', 0.35)}`,
              border: `3px solid ${paused ? alpha('#fff', 0.4) : '#fff'}`,
              transition: 'border-color .2s',
            }}
          />
          <Typography
            variant="caption"
            sx={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', color: '#fff', fontWeight: 600 }}
          >
            {paused ? 'Paused' : 'Point the camera at the attendee’s QR pass'}
          </Typography>
        </>
      )}

      {state === 'starting' && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff' }}>
          <CircularProgress color="inherit" />
        </Box>
      )}

      {(state === 'error' || state === 'idle') && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            p: 3,
            textAlign: 'center',
            color: '#fff',
          }}
        >
          <NoPhotographyOutlinedIcon sx={{ fontSize: 44, opacity: 0.7 }} />
          <Typography variant="body2" sx={{ color: alpha('#fff', 0.85), maxWidth: 320 }}>
            {message || 'The camera is off.'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<CameraAltRoundedIcon />}
            onClick={() => void start()}
            sx={{ bgcolor: '#fff', color: brand.primary, '&:hover': { bgcolor: alpha('#fff', 0.9) } }}
          >
            Try camera again
          </Button>
        </Box>
      )}
    </Box>
  );
}
