import React, { useState, useRef, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Slider from '@mui/material/Slider';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SaveIcon from '@mui/icons-material/Save';
import ImageIcon from '@mui/icons-material/Image';
import { brand } from '../theme/theme';

interface ImageBannerAdjusterProps {
  /** Accepts a freshly-picked File OR an already-uploaded URL string */
  source: File | string;
  onCropAndUpload: (croppedFile: File) => Promise<void>;
  onCancel: () => void;
  /** Called when user picks a replacement file via "Change Image" */
  onFileReplace?: (file: File) => void;
  uploading: boolean;
  uploadProgress: number;
}

export default function ImageBannerAdjuster({
  source,
  onCropAndUpload,
  onCancel,
  onFileReplace,
  uploading,
  uploadProgress,
}: ImageBannerAdjusterProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  // Base (1×) display size of the image: the largest size that fits entirely
  // inside the 16:9 frame while preserving aspect ratio ("contain").
  const [baseSize, setBaseSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  // Zoom needed for the image to fully cover the frame (used to size the slider range)
  const [coverZoom, setCoverZoom] = useState<number>(1);
  // Zoom is a pure multiplier on top of baseSize — 1 means "fit to frame"
  const [zoom, setZoom] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [error, setError] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle both File objects and URL strings
  useEffect(() => {
    setImageLoaded(false);
    setZoom(1);
    setBaseSize({ w: 0, h: 0 });
    setCoverZoom(1);
    setPosition({ x: 0, y: 0 });

    if (typeof source === 'string') {
      setImageSrc(source);
      return;
    }
    const url = URL.createObjectURL(source);
    setImageSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [source]);

  // Compute the "fit to frame" (contain) size for the current container + image
  const computeFit = useCallback(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img || !img.naturalWidth || !img.naturalHeight) return;
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    if (!containerW || !containerH) return;
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    const scale = Math.min(containerW / naturalW, containerH / naturalH);
    const w = naturalW * scale;
    const h = naturalH * scale;
    setBaseSize({ w, h });
    setCoverZoom(Math.max(containerW / w, containerH / h));
  }, []);

  // On load: start fully visible, centered, at exactly 1×
  const handleImageLoad = () => {
    computeFit();
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setImageLoaded(true);
  };

  // Keep the fit size accurate if the frame is resized (layout changes, window resize)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => computeFit());
    ro.observe(container);
    return () => ro.disconnect();
  }, [computeFit]);

  const maxZoom = Math.max(3, Math.ceil(coverZoom * 10) / 10);

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

  // Reset to "fit to frame" view
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (onFileReplace) onFileReplace(file);
  };

  // Export cropped 16:9 banner at 1280×720
  const handleExportCrop = useCallback(async () => {
    if (!imgRef.current || !containerRef.current) return;
    setError('');
    try {
      const container = containerRef.current;
      const img = imgRef.current;
      const targetWidth = 1280;
      const targetHeight = 720;

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D rendering context');

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const scaleToCanvas = targetWidth / containerWidth;

      const renderedWidth = baseSize.w * zoom;
      const renderedHeight = baseSize.h * zoom;
      if (!renderedWidth || !renderedHeight) throw new Error('Image is not ready yet');
      const imgCenterX = containerWidth / 2 + position.x;
      const imgCenterY = containerHeight / 2 + position.y;

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
      if (!blob) throw new Error('Failed to generate cropped image');

      const sourceName =
        typeof source === 'string'
          ? 'banner.jpg'
          : source.name.replace(/\.[^.]+$/, '') + '-banner.jpg';

      const croppedFile = new File([blob], sourceName, { type: 'image/jpeg' });
      await onCropAndUpload(croppedFile);
    } catch (err: any) {
      setError(err.message || 'Failed to crop and process image');
    }
  }, [source, zoom, position, baseSize, onCropAndUpload]);

  return (
      <Stack spacing={1.5}>
        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* 16:9 Viewport */}
        <Box
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            overflow: 'hidden',
            borderRadius: 2,
            bgcolor: '#0f172a',
            cursor: uploading ? 'default' : !imageLoaded ? 'wait' : isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            touchAction: 'none',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {imageSrc && (
            <Box
              component="img"
              ref={imgRef}
              src={imageSrc}
              alt="Adjustment preview"
              onLoad={handleImageLoad}
              crossOrigin="anonymous"
              draggable={false}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: baseSize.w ? `${baseSize.w}px` : 'auto',
                height: baseSize.h ? `${baseSize.h}px` : 'auto',
                maxWidth: 'none',
                maxHeight: 'none',
                transformOrigin: 'center center',
                transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.05s ease-out',
                pointerEvents: 'none',
                opacity: imageLoaded && baseSize.w ? 1 : 0,
              }}
            />
          )}

          {/* Rule-of-thirds grid */}
          {imageLoaded && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '33.33%',
                  bottom: '33.33%',
                  left: 0,
                  right: 0,
                  borderTop: '1px dashed rgba(255,255,255,0.2)',
                  borderBottom: '1px dashed rgba(255,255,255,0.2)',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: '33.33%',
                  right: '33.33%',
                  top: 0,
                  bottom: 0,
                  borderLeft: '1px dashed rgba(255,255,255,0.2)',
                  borderRight: '1px dashed rgba(255,255,255,0.2)',
                },
              }}
            />
          )}

          {/* Hint badge */}
          {imageLoaded && !isDragging && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                bgcolor: 'rgba(0,0,0,0.55)',
                color: '#fff',
                px: 1,
                py: 0.4,
                borderRadius: 1,
                fontSize: '0.7rem',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              ✥ Drag to reposition
            </Box>
          )}

          {/* Format badge */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.55)',
              color: '#fff',
              px: 1,
              py: 0.4,
              borderRadius: 1,
              fontSize: '0.7rem',
              fontWeight: 600,
              pointerEvents: 'none',
            }}
          >
            16:9 — 1280×720
          </Box>
        </Box>

        {/* Zoom + Reset */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ZoomOutIcon fontSize="small" color="action" />
          <Slider
            value={zoom}
            min={1}
            max={maxZoom}
            step={0.01}
            onChange={(_e, val) => setZoom(val as number)}
            disabled={uploading || !imageLoaded}
            valueLabelDisplay="auto"
            valueLabelFormat={(val) => `${val.toFixed(1)}×`}
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
              Saving banner ({uploadProgress}%)…
            </Typography>
            <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 1, height: 5 }} />
          </Box>
        )}

        {/* Actions */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          {onFileReplace && (
            <>
              <Button
                size="small"
                variant="text"
                startIcon={<ImageIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                sx={{ textTransform: 'none' }}
              >
                Change Image
              </Button>
              <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleReplaceFileChange} />
            </>
          )}
          <Stack direction="row" spacing={1.5} sx={{ ml: 'auto' }}>
            <Button variant="outlined" onClick={onCancel} disabled={uploading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleExportCrop}
              disabled={uploading || !imageLoaded}
              sx={{ background: brand.gradient, fontWeight: 700 }}
            >
              {uploading ? 'Saving…' : 'Save'}
            </Button>
          </Stack>
        </Stack>
      </Stack>
  );
}
