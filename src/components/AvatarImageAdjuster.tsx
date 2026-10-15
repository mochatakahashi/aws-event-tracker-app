import React, { useState, useRef, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Slider from '@mui/material/Slider';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import { brand } from '../theme/theme';

interface AvatarImageAdjusterProps {
  /** Title shown at the top, e.g. "Profile Photo" */
  label?: string;
  /** Accepts a freshly-picked File OR an already-uploaded URL string */
  source: File | string;
  /** Size of the circular output in pixels (default 400) */
  outputSize?: number;
  onCropAndUpload: (croppedFile: File) => Promise<void>;
  onCancel: () => void;
  /** Called when user swaps to a new file from inside the adjuster */
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
    setPosition({ x: 0, y: 0 });

    if (typeof source === 'string') {
      setImageSrc(source);
      return;
    }

    const url = URL.createObjectURL(source);
    setImageSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [source]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
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

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (onFileReplace) onFileReplace(file);
  };

  // Export as circular crop
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

      // Circular clipping mask
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const containerSize = container.clientWidth; // square container
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

  const previewSize = 260; // px — the circular viewport shown on screen

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: 'background.paper',
        border: '2px solid',
        borderColor: 'primary.main',
      }}
    >
      <Stack spacing={1.5}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Adjust {label} 🖼
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Drag to reposition • Zoom to resize
            </Typography>
          </Box>
          <Button size="small" color="inherit" startIcon={<CloseIcon />} onClick={onCancel} disabled={uploading}>
            Cancel
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Circular crop viewport */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <Box
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            sx={{
              position: 'relative',
              width: previewSize,
              height: previewSize,
              borderRadius: '50%',
              overflow: 'hidden',
              bgcolor: '#1a1a2e',
              cursor: uploading ? 'default' : !imageLoaded ? 'wait' : isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
              border: '3px solid',
              borderColor: 'primary.main',
              boxShadow: `0 0 0 4px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.25)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {!imageLoaded && (
              <Typography variant="caption" color="text.disabled" sx={{ userSelect: 'none' }}>
                Loading…
              </Typography>
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
                sx={{
                  position: 'absolute',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  transformOrigin: 'center center',
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.05s ease-out',
                  pointerEvents: 'none',
                  opacity: imageLoaded ? 1 : 0,
                }}
              />
            )}

            {/* Subtle crosshair center guide */}
            {imageLoaded && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '10%',
                    right: '10%',
                    height: '1px',
                    bgcolor: 'rgba(255,255,255,0.15)',
                    transform: 'translateY(-50%)',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: '50%',
                    top: '10%',
                    bottom: '10%',
                    width: '1px',
                    bgcolor: 'rgba(255,255,255,0.15)',
                    transform: 'translateX(-50%)',
                  },
                }}
              />
            )}
          </Box>

          {/* Drag hint */}
          {imageLoaded && !isDragging && (
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ opacity: 0.5 }}>
              <OpenWithIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption" sx={{ fontSize: '0.68rem' }}>
                Drag or use arrow keys to reposition image
              </Typography>
            </Stack>
          )}
        </Box>

        {/* Zoom slider */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 1 }}>
          <ZoomOutIcon fontSize="small" color="action" />
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.05}
            onChange={(_e, val) => setZoom(val as number)}
            disabled={uploading || !imageLoaded}
            valueLabelDisplay="auto"
            valueLabelFormat={(val) => `${val.toFixed(1)}×`}
            sx={{ flex: 1 }}
          />
          <ZoomInIcon fontSize="small" color="action" />
          <Tooltip title="Reset position & zoom">
            <span>
              <Button
                size="small"
                variant="text"
                startIcon={<RestartAltIcon />}
                onClick={handleReset}
                disabled={uploading || !imageLoaded}
                sx={{ whiteSpace: 'nowrap', minWidth: 0, px: 1 }}
              >
                Reset
              </Button>
            </span>
          </Tooltip>
        </Stack>

        {/* Upload progress */}
        {uploading && (
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
              Uploading to Amazon S3 ({uploadProgress}%)…
            </Typography>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{ borderRadius: 1, height: 5 }}
            />
          </Box>
        )}

        {/* Actions */}
        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
          {onFileReplace && (
            <>
              <Button
                size="small"
                variant="text"
                startIcon={<ImageIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                sx={{ textTransform: 'none', fontSize: '0.78rem' }}
              >
                Change Photo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept="image/*"
                onChange={handleReplaceFile}
              />
            </>
          )}

          <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
            <Button variant="outlined" size="small" onClick={onCancel} disabled={uploading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<CloudUploadIcon />}
              onClick={handleExportCrop}
              disabled={uploading || !imageLoaded}
              sx={{ background: brand.gradient, fontWeight: 700 }}
            >
              {uploading ? 'Uploading…' : 'Save & Upload'}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
