import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';
import { alpha } from '@mui/material/styles';

import type { EventUploadItem } from '../types/upload';
import {
  getRecentUploads,
  deleteUploadRecord,
  uploadAndRecordImage,
} from '../services/uploadStorageService';
import { brand } from '../theme/theme';

interface RecentUploadsShelfProps {
  currentUrl?: string;
  onSelect: (url: string) => void;
  eventId?: string;
  category?: 'banner' | 'speaker' | 'gallery';
  title?: string;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'Asset';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatTimeAgo(dateStr: string): string {
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}

export default function RecentUploadsShelf({
  currentUrl,
  onSelect,
  eventId,
  category = 'banner',
  title = 'Recent Event Uploads',
}: RecentUploadsShelfProps) {
  const [uploads, setUploads] = useState<EventUploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState<EventUploadItem | null>(null);

  const loadUploads = useCallback(async () => {
    setLoading(true);
    try {
      const items = await getRecentUploads({ category, limit: 12 });
      setUploads(items);
    } catch (err) {
      console.warn('Failed to load recent uploads:', err);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadUploads();

    const handleSaved = () => loadUploads();
    const handleDeleted = () => loadUploads();

    window.addEventListener('event-upload-saved', handleSaved);
    window.addEventListener('event-upload-deleted', handleDeleted);

    return () => {
      window.removeEventListener('event-upload-saved', handleSaved);
      window.removeEventListener('event-upload-deleted', handleDeleted);
    };
  }, [loadUploads]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const newItem = await uploadAndRecordImage(file, {
        eventId,
        category,
      });
      setUploads((prev) => [newItem, ...prev.filter((x) => x.id !== newItem.id)]);
      onSelect(newItem.url);
    } catch (err: any) {
      alert(err.message || 'Failed to upload picture');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this upload record from storage?')) {
      await deleteUploadRecord(id);
      setUploads((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const latestUploadId = uploads[0]?.id;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 3,
        bgcolor: alpha(brand.primary, 0.02),
        borderColor: alpha(brand.primary, 0.15),
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <StorageRoundedIcon sx={{ color: brand.primary, fontSize: 22 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: brand.textPrimary }}>
            {title}
          </Typography>
          <Chip
            size="small"
            label={`${uploads.length} saved`}
            sx={{
              fontWeight: 700,
              fontSize: '0.72rem',
              bgcolor: alpha(brand.primary, 0.1),
              color: brand.primary,
              height: 22,
            }}
          />
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            component="label"
            size="small"
            variant="outlined"
            startIcon={uploading ? <CircularProgress size={14} /> : <CloudUploadRoundedIcon />}
            disabled={uploading}
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}
          >
            {uploading ? 'Storing...' : 'Upload New Pic'}
            <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
          </Button>
        </Stack>
      </Stack>

      {/* Uploads Shelf / Cards */}
      {loading ? (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <CircularProgress size={24} sx={{ color: brand.primary }} />
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
            Loading stored event pictures...
          </Typography>
        </Box>
      ) : uploads.length === 0 ? (
        <Box
          sx={{
            py: 3,
            px: 2,
            textAlign: 'center',
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <ImageNotSupportedOutlinedIcon sx={{ fontSize: 32, opacity: 0.45, mb: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block' }}>
            No image
          </Typography>
          <Typography variant="caption" color="text.secondary">
            No cloud images uploaded yet. Upload a picture above to save it to storage.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 1.5,
          }}
        >
          {uploads.map((item, index) => {
            const isCurrent = currentUrl === item.url;
            const isLatest = item.id === latestUploadId;

            return (
              <Box
                key={item.id}
                onClick={() => onSelect(item.url)}
                sx={{
                  position: 'relative',
                  borderRadius: 2,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: isCurrent
                    ? brand.primary
                    : isLatest
                    ? alpha(brand.secondary, 0.6)
                    : 'divider',
                  bgcolor: 'background.paper',
                  boxShadow: isCurrent
                    ? `0 0 0 2px ${alpha(brand.primary, 0.25)}, 0 4px 12px rgba(0,0,0,0.08)`
                    : '0 2px 6px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: brand.primary,
                    boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
                  },
                }}
              >
                {/* Image Thumbnail */}
                <Box sx={{ position: 'relative', width: '100%', height: 110, bgcolor: '#0f172a' }}>
                  <Box
                    component="img"
                    src={item.url}
                    alt={item.name}
                    loading="lazy"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />

                  {/* Badges on Thumbnail */}
                  <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{ position: 'absolute', top: 6, left: 6, right: 6, zIndex: 2 }}
                    justifyContent="space-between"
                  >
                    {isLatest ? (
                      <Chip
                        icon={<AutoAwesomeRoundedIcon sx={{ fontSize: '13px !important', color: '#fff !important' }} />}
                        label="Recent Upload"
                        size="small"
                        sx={{
                          bgcolor: brand.secondary,
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.68rem',
                          height: 20,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        }}
                      />
                    ) : (
                      <Chip
                        label={`#${index + 1}`}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(0,0,0,0.5)',
                          backdropFilter: 'blur(4px)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          height: 18,
                        }}
                      />
                    )}

                    {isCurrent && (
                      <Chip
                        icon={<CheckCircleRoundedIcon sx={{ fontSize: '13px !important', color: '#fff !important' }} />}
                        label="Active"
                        size="small"
                        sx={{
                          bgcolor: '#10b981',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.68rem',
                          height: 20,
                        }}
                      />
                    )}
                  </Stack>

                  {/* Hover Actions: Preview */}
                  <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      zIndex: 2,
                    }}
                  >
                    <Tooltip title="Preview image">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewItem(item);
                        }}
                        sx={{
                          bgcolor: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          p: 0.5,
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.85)' },
                        }}
                      >
                        <VisibilityRoundedIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete upload">
                      <IconButton
                        size="small"
                        onClick={(e) => handleDelete(e, item.id)}
                        sx={{
                          bgcolor: 'rgba(0,0,0,0.6)',
                          color: '#f87171',
                          p: 0.5,
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.85)' },
                        }}
                      >
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>

                {/* Card Info Details */}
                <Box sx={{ p: 1.2 }}>
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{
                      fontWeight: 700,
                      display: 'block',
                      color: brand.textPrimary,
                    }}
                    title={item.name}
                  >
                    {item.name}
                  </Typography>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mt: 0.5 }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                      {formatTimeAgo(item.uploadedAt)} · {formatBytes(item.size)}
                    </Typography>

                    <Button
                      size="small"
                      variant={isCurrent ? 'contained' : 'text'}
                      color={isCurrent ? 'success' : 'primary'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(item.url);
                      }}
                      sx={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        py: 0.2,
                        px: 1,
                        minWidth: 'auto',
                        textTransform: 'none',
                      }}
                    >
                      {isCurrent ? 'Applied' : 'Use'}
                    </Button>
                  </Stack>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {previewItem && (
          <>
            <DialogTitle
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1.5,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {previewItem.name}
              </Typography>
              <IconButton size="small" onClick={() => setPreviewItem(null)}>
                <CloseRoundedIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0, bgcolor: '#0b1120', textAlign: 'center' }}>
              <Box
                component="img"
                src={previewItem.url}
                alt={previewItem.name}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  display: 'block',
                  mx: 'auto',
                }}
              />
              <Box sx={{ p: 2, bgcolor: 'background.paper', textAlign: 'left' }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Uploaded: {new Date(previewItem.uploadedAt).toLocaleString()} · Size:{' '}
                      {formatBytes(previewItem.size)}
                    </Typography>
                    <Chip
                      size="small"
                      icon={<CloudDoneRoundedIcon />}
                      label={previewItem.storageType === 's3' ? 'AWS S3 Cloud Storage' : 'Persistent File Storage'}
                      sx={{ mt: 0.5, fontSize: '0.7rem' }}
                    />
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<CheckCircleRoundedIcon />}
                    onClick={() => {
                      onSelect(previewItem.url);
                      setPreviewItem(null);
                    }}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Select as Event Banner
                  </Button>
                </Stack>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Paper>
  );
}
