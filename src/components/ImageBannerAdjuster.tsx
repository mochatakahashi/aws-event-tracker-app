import React, { useState, useRef, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
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
import { brand } from '../theme/theme';

interface ImageBannerAdjusterProps {
  /** Accepts a freshly-picked File OR an already-uploaded URL string */
  source: File | string;
  onCropAndUpload: (croppedFile: File) => Promise<void>;
  onCancel: () => void;
  /** Called when user picks a new replacement file via "Change Image" */
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

  // Drag handling
  const handlePointerDown = (e: React.PointerEvent) => {
    if (uploading || !imageLoaded) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || uploading) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (onFileReplace) {
      onFileReplace(file);
    }
  };

  // Export cropped 16:9 banner as a File and upload to S3
  const handleExportCrop = useCallback(async () => {
    if (!imgRef.current || !containerRef.current) return;
    setError('');

    try {
      const container = containerRef.current;
      const img = imgRef.current;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Output at a crisp 1280×720 (16:9) resolution
      const targetWidth = 1280;
      const targetHeight = 720;

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D rendering context');

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      const scaleToCanvas = targetWidth / containerWidth;

      const renderedWidth = img.clientWidth * zoom;
      const renderedHeight = img.clientHeight * zoom;

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
  }, [source, zoom, position, onCropAndUpload]);

  const isExistingUrl = typeof source === 'string';

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2.5,
        borderRadius: 3,
        bgcolor: 'background.paper',
        border: '2px solid',
        borderColor: 'primary.main',
      }}
    >
      <Stack spacing={2}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {isExistingUrl ? 'Adjust Banner Focus Area 📐' : 'Adjust & Upload Event Banner 📐'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Drag to reposition • Zoom in/out • Grid lines help with composition (16:9 format)
            </Typography>
          </Box>
          <Button
            size="small"
            color="inherit"
            startIcon={<CloseIcon />}
            onClick={onCancel}
            disabled={uploading}
          >
            Cancel
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* 16:9 Cropping Viewport */}
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
            cursor: uploading
              ? 'default'
              : !imageLoaded
              ? 'wait'
              : isDragging
              ? 'grabbing'
              : 'grab',
            userSelect: 'none',
            touchAction: 'none',
            border: '2px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {!imageLoaded && (
            <Typography variant="caption" color="text.disabled">
              Loading image…
            </Typography>
          )}

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

          {/* Rule-of-thirds grid overlay */}
          {imageLoaded && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                border: '2px dashed rgba(255, 255, 255, 0.4)',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '33.33%',
                  bottom: '33.33%',
                  left: 0,
                  right: 0,
                  borderTop: '1px dashed rgba(255, 255, 255, 0.2)',
                  borderBottom: '1px dashed rgba(255, 255, 255, 0.2)',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: '33.33%',
                  right: '33.33%',
                  top: 0,
                  bottom: 0,
                  borderLeft: '1px dashed rgba(255, 255, 255, 0.2)',
                  borderRight: '1px dashed rgba(255, 255, 255, 0.2)',
                },
              }}
            />
          )}

          {/* Badges */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.75)',
              color: '#fff',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.7rem',
              fontWeight: 700,
              pointerEvents: 'none',
            }}
          >
            16:9 — 1280×720
          </Box>

          {imageLoaded && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                bgcolor: 'rgba(0,0,0,0.75)',
                color: 'rgba(255,255,255,0.85)',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.7rem',
                pointerEvents: 'none',
              }}
            >
              🖱 Drag to reposition
            </Box>
          )}
        </Box>

        {/* Zoom + Reset */}
        <Stack direction="row" spacing={2} alignItems="center">
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
          <Box sx={{ width: '100%' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
              Cropping and uploading to Amazon S3 ({uploadProgress}%)…
            </Typography>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{ borderRadius: 1, height: 6 }}
            />
          </Box>
        )}

        {/* Action Buttons */}
        <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="center">
          {/* Left: change image */}
          {onFileReplace && (
            <>
              <Button
                variant="text"
                size="small"
                startIcon={<ImageIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                sx={{ textTransform: 'none' }}
              >
                Change Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept="image/*"
                onChange={handleReplaceFileChange}
              />
            </>
          )}

          {/* Right: cancel + crop & upload */}
          <Stack direction="row" spacing={1.5} sx={{ ml: 'auto' }}>
            <Button variant="outlined" onClick={onCancel} disabled={uploading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={handleExportCrop}
              disabled={uploading || !imageLoaded}
              sx={{ background: brand.gradient, fontWeight: 700 }}
            >
              {uploading ? 'Uploading to S3…' : 'Crop & Upload to S3'}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
