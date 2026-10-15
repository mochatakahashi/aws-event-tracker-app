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
import { brand } from '../theme/theme';

interface ImageBannerAdjusterProps {
  file: File;
  onCropAndUpload: (croppedFile: File) => Promise<void>;
  onCancel: () => void;
  uploading: boolean;
  uploadProgress: number;
}

export default function ImageBannerAdjuster({
  file,
  onCropAndUpload,
  onCancel,
  uploading,
  uploadProgress,
}: ImageBannerAdjusterProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [error, setError] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Load image object URL
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleImageLoad = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Drag handling
  const handlePointerDown = (e: React.PointerEvent) => {
    if (uploading) return;
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

  // Export cropped 16:9 banner
  const handleExportCrop = useCallback(async () => {
    if (!imgRef.current || !containerRef.current) return;
    setError('');

    try {
      const container = containerRef.current;
      const img = imgRef.current;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Target canvas output resolution (standard crisp 16:9 event banner)
      const targetWidth = 1280;
      const targetHeight = 720;

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D rendering context');

      // Fill background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Scale factor between screen container and target canvas
      const scaleToCanvas = targetWidth / containerWidth;

      // Image current rendered dimensions and center
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

      const croppedFile = new File(
        [blob],
        file.name.replace(/\.[^.]+$/, '') + '-banner.jpg',
        { type: 'image/jpeg' }
      );

      await onCropAndUpload(croppedFile);
    } catch (err: any) {
      setError(err.message || 'Failed to crop and process image');
    }
  }, [file, zoom, position, onCropAndUpload]);

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2.5,
        borderRadius: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'primary.main',
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Adjust Event Banner Display Area 📐
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Drag to reposition focal point • Use slider to zoom in/out (16:9 format)
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

        {/* 16:9 Cropping Viewport Container */}
        <Box
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            maxHeight: 400,
            overflow: 'hidden',
            borderRadius: 2,
            bgcolor: '#0f172a',
            cursor: uploading ? 'default' : isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            touchAction: 'none',
            border: '2px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {imageSrc && (
            <Box
              component="img"
              ref={imgRef}
              src={imageSrc}
              alt="Adjustment preview"
              onLoad={handleImageLoad}
              draggable={false}
              sx={{
                position: 'absolute',
                maxWidth: 'none',
                transformOrigin: 'center center',
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.05s ease-out',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Rule-of-thirds grid overlay guide */}
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

          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: '#fff',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 600,
              pointerEvents: 'none',
            }}
          >
            16:9 Banner Format
          </Box>
        </Box>

        {/* Zoom and Reset Controls */}
        <Stack direction="row" spacing={2} alignItems="center">
          <ZoomOutIcon fontSize="small" color="action" />
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.05}
            onChange={(_e, val) => setZoom(val as number)}
            disabled={uploading}
            valueLabelDisplay="auto"
            valueLabelFormat={(val) => `${val.toFixed(1)}x`}
            sx={{ flex: 1 }}
          />
          <ZoomInIcon fontSize="small" color="action" />
          <Button
            size="small"
            variant="text"
            startIcon={<RestartAltIcon />}
            onClick={handleReset}
            disabled={uploading}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Reset
          </Button>
        </Stack>

        {uploading && (
          <Box sx={{ width: '100%' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
              Cropping and Uploading to Amazon S3 ({uploadProgress}%)…
            </Typography>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{ borderRadius: 1, height: 6 }}
            />
          </Box>
        )}

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={onCancel} disabled={uploading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={handleExportCrop}
            disabled={uploading}
            sx={{ background: brand.gradient, fontWeight: 700 }}
          >
            {uploading ? 'Uploading to S3…' : 'Crop & Upload to S3'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
