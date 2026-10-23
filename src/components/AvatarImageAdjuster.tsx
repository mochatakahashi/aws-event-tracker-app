import React, { useState, useRef, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Slider from '@mui/material/Slider';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import { brand } from '../theme/theme';

interface AvatarImageAdjusterProps {
  label?: string;
  /** Accepts a freshly-picked File OR an already-uploaded URL string */
  source: File | string;
  /** Output circle diameter in pixels (default 400) */
  outputSize?: number;
  onCropAndUpload: (croppedFile: File) => Promise<void>;
  onCancel: () => void;
  onFileReplace?: (file: File) => void;
  uploading: boolean;
  uploadProgress: number;
}

export default function AvatarImageAdjuster({
  label = 'Profile Photo',
  source,
  outputSize = 400,
  onCropAndUpload,
  onCancel,
  onFileReplace,
  uploading,
  uploadProgress,
}: AvatarImageAdjusterProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [fitScale, setFitScale] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Support both File and URL string
  useEffect(() => {
    setImageLoaded(false);
    setZoom(1);
    setFitScale(1);
    setPosition({ x: 0, y: 0 });

    if (typeof source === 'string') {
      setImageSrc(source);
      return;
    }
    const url = URL.createObjectURL(source);
    setImageSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [source]);

  // On load: scale image to cover the circular frame (no empty space)
  const handleImageLoad = () => {
    if (containerRef.current && imgRef.current) {
      const containerSize = containerRef.current.clientWidth; // square
      const naturalW = imgRef.current.naturalWidth || 1;
      const naturalH = imgRef.current.naturalHeight || 1;
      // Cover: ensure image fills the circle (use max so no empty corners)
      const scale = Math.max(containerSize / naturalW, containerSize / naturalH);
      setFitScale(scale);
      setZoom(scale);
    }
    setPosition({ x: 0, y: 0 });
    setImageLoaded(true);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (uploading || !imageLoaded) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || uploading) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  };

  // Arrow keys move the photo (Shift moves faster)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (uploading || !imageLoaded) return;
    const step = e.shiftKey ? 20 : 5;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    setPosition((p) => ({ x: p.x + d[0], y: p.y + d[1] }));
  };

  const handleReset = () => {
    setZoom(fitScale);
    setPosition({ x: 0, y: 0 });
  };

  const handleReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (onFileReplace) onFileReplace(file);
  };

  // Export as circular-cropped JPEG
  const handleExportCrop = useCallback(async () => {
    if (!imgRef.current || !containerRef.current) return;
    setError('');
    try {
      const container = containerRef.current;
      const img = imgRef.current;
      const size = outputSize;

      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D rendering context');

      // Circular clip
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const containerSize = container.clientWidth;
      const scaleToCanvas = size / containerSize;

      const renderedWidth = img.clientWidth * zoom;
      const renderedHeight = img.clientHeight * zoom;
      const imgCenterX = containerSize / 2 + position.x;
      const imgCenterY = containerSize / 2 + position.y;

      const destX = (imgCenterX - renderedWidth / 2) * scaleToCanvas;
      const destY = (imgCenterY - renderedHeight / 2) * scaleToCanvas;
      const destWidth = renderedWidth * scaleToCanvas;
      const destHeight = renderedHeight * scaleToCanvas;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, destX, destY, destWidth, destHeight);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
      );
      if (!blob) throw new Error('Failed to generate cropped avatar');

      const sourceName =
        typeof source === 'string'
          ? 'avatar.jpg'
          : source.name.replace(/\.[^.]+$/, '') + '-avatar.jpg';

      const croppedFile = new File([blob], sourceName, { type: 'image/jpeg' });
      await onCropAndUpload(croppedFile);
    } catch (err: any) {
      setError(err.message || 'Failed to crop and process image');
    }
  }, [source, zoom, position, outputSize, onCropAndUpload]);

  const previewSize = 220;

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack spacing={1.5}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Adjust {label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Drag to reposition • Zoom to resize
            </Typography>
          </Box>
          <IconButton size="small" aria-label="Close" onClick={onCancel} disabled={uploading}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Circular crop viewport */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Box
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="img"
            aria-label="Photo position. Use the arrow keys to move it."
            data-testid="avatar-crop"
            sx={{
              position: 'relative',
              width: previewSize,
              height: previewSize,
              borderRadius: '50%',
              overflow: 'hidden',
              bgcolor: 'grey.200',
              cursor: uploading ? 'default' : !imageLoaded ? 'wait' : isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
              border: '2px solid',
              borderColor: 'divider',
            }}
          >
            {!imageLoaded && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="caption" color="text.disabled">Loading…</Typography>
              </Box>
            )}

            {imageSrc && (
              <Box
                component="img"
                ref={imgRef}
                src={imageSrc}
                alt="Avatar preview"
                onLoad={handleImageLoad}
                crossOrigin="anonymous"
                draggable={false}
                onError={() => {
                  setImageLoaded(false);
                  setError("This photo couldn't be loaded here. Tap Change photo and pick it again.");
                }}
                sx={{
                  // Centered in the circle, then moved and zoomed (the saved crop uses the same math)
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  transformOrigin: 'center center',
                  transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.05s ease-out',
                  pointerEvents: 'none',
                  opacity: imageLoaded ? 1 : 0,
                }}
              />
            )}
          </Box>

          {/* Drag hint */}
          {imageLoaded && (
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ opacity: 0.5 }}>
              <OpenWithIcon sx={{ fontSize: 13 }} />
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                Drag or use arrow keys to reposition image
              </Typography>
            </Stack>
          )}
        </Box>

        {/* Zoom slider */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ZoomOutIcon fontSize="small" color="action" />
          <Slider
            value={zoom}
            min={fitScale}
            max={fitScale * 3}
            step={fitScale * 0.02}
            onChange={(_e, val) => setZoom(val as number)}
            disabled={uploading || !imageLoaded}
            valueLabelDisplay="auto"
            valueLabelFormat={(val) => `${(val / fitScale).toFixed(1)}×`}
            sx={{ flex: 1 }}
          />
          <ZoomInIcon fontSize="small" color="action" />
          <Button
            size="small"
            variant="text"
            startIcon={<RestartAltIcon />}
            onClick={handleReset}
            disabled={uploading || !imageLoaded}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Reset
          </Button>
        </Stack>

        {/* Upload progress */}
        {uploading && (
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
              Saving your photo… {uploadProgress}%
            </Typography>
            <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 1, height: 5 }} />
          </Box>
        )}

        {/* Actions: Save is the main button (full width on phones); Change photo and Cancel below it */}
        <Stack direction={{ xs: 'column', sm: 'row-reverse' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={handleExportCrop}
            disabled={uploading || !imageLoaded}
            sx={{ background: brand.gradient, fontWeight: 700 }}
            data-testid="photo-save"
          >
            {uploading ? 'Saving…' : 'Save photo'}
          </Button>
          <Stack direction="row" spacing={1} justifyContent={{ xs: 'space-between', sm: 'flex-start' }} sx={{ flex: { sm: 1 } }}>
            {onFileReplace && (
              <>
                <Button size="small" startIcon={<ImageIcon />} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  Change photo
                </Button>
                <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleReplaceFile} />
              </>
            )}
            <Button size="small" color="inherit" onClick={onCancel} disabled={uploading} sx={{ ml: { sm: 'auto' } }}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
