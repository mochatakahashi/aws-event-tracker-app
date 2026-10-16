import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PersonIcon from '@mui/icons-material/Person';
import ImageBannerAdjuster from '../components/ImageBannerAdjuster';
import AvatarImageAdjuster from '../components/AvatarImageAdjuster';
import RecentUploadsShelf from '../components/RecentUploadsShelf';
import { getEvent, createEvent, updateEvent, deleteEvent } from '../services/eventService';
import { uploadAndRecordImage } from '../services/uploadStorageService';
import {
  createSpeaker,
  getSpeakersByIds,
  updateSpeaker as saveSpeakerChanges,
} from '../services/speakerService';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { brand } from '../theme/theme';
import { EVENT_TAGS, type AppEvent } from '../types/event';
import { tagColor, tagLabel } from '../utils/eventDisplay';

interface SpeakerDraft {
  /** Set when the speaker is already saved in the directory. */
  id?: string;
  name: string;
  headline: string;
  bio: string;
  avatarUrl: string;
}

/** ISO string → value for <input type="datetime-local"> in the browser's own time zone. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedEvent, selectEvent } = useEvent();
  
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [adjustSource, setAdjustSource] = useState<File | string | null>(null);

  // Speaker management with avatar upload
  const [speakers, setSpeakers] = useState<SpeakerDraft[]>([]);
  const [adjustingSpeakerIdx, setAdjustingSpeakerIdx] = useState<number | null>(null);
  const [adjustingSpeakerSource, setAdjustingSpeakerSource] = useState<File | string | null>(null);
  const [uploadingSpeakerAvatar, setUploadingSpeakerAvatar] = useState(false);
  const [speakerUploadProgress, setSpeakerUploadProgress] = useState(0);
  const speakerFileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [formData, setFormData] = useState<Partial<AppEvent>>({
    title: '',
    modality: 'onsite',
    status: 'upcoming',
    tags: [],
    venue: '',
    startAt: toLocalInput(new Date().toISOString()),
    endAt: toLocalInput(new Date(Date.now() + 3600000).toISOString()),
    description: '',
    capacity: 100,
    participants: 0,
    imageUrl: '',
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/home');
      return;
    }
    
    if (isEditing && id) {
      getEvent(id).then(async ev => {
        if (ev) {
          setFormData({
            ...ev,
            startAt: toLocalInput(ev.startAt),
            endAt: toLocalInput(ev.endAt),
          });
          // Load the saved speaker lineup so it can be edited
          const lineup = await getSpeakersByIds(ev.speakerIds || []);
          setSpeakers(lineup.map(sp => ({
            id: sp.id,
            name: sp.name,
            headline: sp.headline || '',
            bio: sp.bio || '',
            avatarUrl: sp.avatarUrl || '',
          })));
        }
      }).finally(() => setLoading(false));
    }
  }, [id, isEditing, user, navigate]);

  const handleChange = (field: keyof AppEvent) => (e: any) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAdjustSource(file);
    e.target.value = '';
  };

  const handleCropAndUpload = async (croppedFile: File) => {
    setUploadingImage(true);
    setUploadProgress(0);
    setUploadError('');

    try {
      const uploadItem = await uploadAndRecordImage(croppedFile, {
        eventId: id,
        eventTitle: formData.title,
        category: 'banner',
        onProgress: (percent) => {
          setUploadProgress(percent);
        },
      });
      setFormData((prev) => ({ ...prev, imageUrl: uploadItem.url }));
      setAdjustSource(null);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload adjusted banner');
      throw err;
    } finally {
      setUploadingImage(false);
    }
  };

  // Speaker avatar upload
  const handleSpeakerAvatarUpload = async (croppedFile: File) => {
    if (adjustingSpeakerIdx === null) return;
    setUploadingSpeakerAvatar(true);
    setSpeakerUploadProgress(0);
    try {
      const uploadItem = await uploadAndRecordImage(croppedFile, {
        eventId: id,
        eventTitle: formData.title,
        category: 'speaker',
        onProgress: (pct) => setSpeakerUploadProgress(pct),
      });
      setSpeakers(prev => prev.map((sp, i) =>
        i === adjustingSpeakerIdx ? { ...sp, avatarUrl: uploadItem.url } : sp
      ));
      setAdjustingSpeakerIdx(null);
      setAdjustingSpeakerSource(null);
    } catch (err: any) {
      alert(err.message || 'Failed to upload speaker photo');
    } finally {
      setUploadingSpeakerAvatar(false);
    }
  };

  const addSpeaker = () => setSpeakers(prev => [...prev, { name: '', headline: '', bio: '', avatarUrl: '' }]);

  const removeSpeaker = (idx: number) => {
    setSpeakers(prev => prev.filter((_, i) => i !== idx));
    if (adjustingSpeakerIdx === idx) {
      setAdjustingSpeakerIdx(null);
      setAdjustingSpeakerSource(null);
    }
  };

  const updateSpeaker = (idx: number, field: keyof SpeakerDraft, value: string) => {
    setSpeakers(prev => prev.map((sp, i) => i === idx ? { ...sp, [field]: value } : sp));
  };

  /** Save the speaker cards to the speaker directory and return their ids. */
  const saveSpeakers = async (): Promise<string[]> => {
    const ids: string[] = [];
    for (const sp of speakers) {
      if (!sp.name.trim()) continue;
      const fields = {
        name: sp.name.trim(),
        headline: sp.headline.trim(),
        bio: sp.bio.trim(),
        avatarUrl: sp.avatarUrl || undefined,
      };
      if (sp.id) {
        await saveSpeakerChanges(sp.id, fields);
        ids.push(sp.id);
      } else {
        const created = await createSpeaker({ ...fields, company: '' });
        ids.push(created.id);
      }
    }
    return ids;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const eventToSave: any = {
        title: formData.title || 'Untitled Event',
        modality: (formData.modality as any) || 'onsite',
        status: (formData.status as any) || 'upcoming',
        tags: formData.tags || [],
        venue: formData.venue || 'TBA',
        startAt: new Date(formData.startAt!).toISOString(),
        endAt: new Date(formData.endAt!).toISOString(),
        description: formData.description || '',
        capacity: Number(formData.capacity) || 100,
        participants: Number(formData.participants) || 0,
        speakerIds: await saveSpeakers(),
        officerIds: formData.officerIds || [],
        // Send '' (not undefined) so removing the banner is persisted too
        imageUrl: formData.imageUrl || '',
      };
      
      let savedEvent;
      if (isEditing && id) {
        savedEvent = await updateEvent(id, eventToSave);
      } else {
        eventToSave.createdAt = new Date().toISOString();
        savedEvent = await createEvent(eventToSave);
      }

      // Keep the cached active event (used by the Dashboard banner) in sync
      if (selectedEvent && selectedEvent.id === savedEvent.id) {
        selectEvent(savedEvent);
      }
      
      navigate(`/events/${savedEvent.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save event');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      setSaving(true);
      await deleteEvent(id);
      navigate('/events');
    }
  };

  if (loading) return <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', py: { xs: 2, md: 4 }, px: { xs: 0, sm: 2 } }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Back
      </Button>
      
      <Typography variant="h2" sx={{ mb: 1 }}>
        {isEditing ? 'Edit Event' : 'Create New Event'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Fill out the details below to publish the event across the application.
      </Typography>

      <Paper component="form" onSubmit={handleSubmit} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3 }}>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
        )}
        
        <Stack spacing={3}>
          <TextField
            label="Event Title"
            required
            fullWidth
            value={formData.title}
            onChange={handleChange('title')}
          />
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Modality</InputLabel>
              <Select value={formData.modality} label="Modality" onChange={handleChange('modality')}>
                <MenuItem value="onsite">Onsite</MenuItem>
                <MenuItem value="hybrid">Hybrid</MenuItem>
                <MenuItem value="virtual">Virtual</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={formData.status} label="Status" onChange={handleChange('status')}>
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="ongoing">Ongoing</MenuItem>
                <MenuItem value="accomplished">Accomplished</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Tags */}
          <Autocomplete
            multiple
            options={EVENT_TAGS}
            getOptionLabel={(t) => tagLabel(t)}
            value={formData.tags || []}
            onChange={(_e, value) => setFormData(prev => ({ ...prev, tags: value }))}
            renderTags={(value, getTagProps) =>
              value.map((tag, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={tag}
                  label={tagLabel(tag)}
                  size="small"
                  sx={{
                    backgroundColor: tagColor(tag) + '18',
                    color: tagColor(tag),
                    fontWeight: 600,
                    border: `1px solid ${tagColor(tag)}40`,
                  }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label="Event Tags" placeholder="Select tags…" />
            )}
          />

          <TextField
            label="Venue / Location"
            required
            fullWidth
            value={formData.venue}
            onChange={handleChange('venue')}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Start Date & Time"
              type="datetime-local"
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.startAt}
              onChange={handleChange('startAt')}
            />
            <TextField
              label="End Date & Time"
              type="datetime-local"
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.endAt}
              onChange={handleChange('endAt')}
            />
          </Stack>

          <TextField
            label="Description"
            multiline
            rows={4}
            fullWidth
            value={formData.description}
            onChange={handleChange('description')}
          />
          
          {/* AWS S3 Banner — Interactive Adjuster / Upload */}
          {
            /* Priority: active adjusting session (new file or explicit re-adjust) */
            adjustSource ? (
              /* Adjusting a newly picked file (or re-adjusting the saved banner) */
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Event Banner
                </Typography>
                <ImageBannerAdjuster
                  source={adjustSource}
                  onCropAndUpload={handleCropAndUpload}
                  onCancel={() => setAdjustSource(null)}
                  onFileReplace={(f) => setAdjustSource(f)}
                  uploading={uploadingImage}
                  uploadProgress={uploadProgress}
                />
              </Box>
            ) : formData.imageUrl ? (
              /* Saved banner — show the current picture */
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Event Banner
                </Typography>
                <Box
                  component="img"
                  key={formData.imageUrl}
                  src={formData.imageUrl}
                  alt="Event banner"
                  sx={{
                    display: 'block',
                    width: '100%',
                    aspectRatio: '16 / 9',
                    objectFit: 'cover',
                    borderRadius: 2,
                    bgcolor: '#0f172a',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                  <Button
                    component="label"
                    size="small"
                    startIcon={<PhotoCameraIcon />}
                    disabled={uploadingImage}
                    sx={{ textTransform: 'none' }}
                  >
                    Change Image
                    <input type="file" hidden accept="image/*" onChange={handleImageFileChange} />
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setAdjustSource(formData.imageUrl || null)}
                    sx={{ textTransform: 'none' }}
                  >
                    Adjust
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                    sx={{ textTransform: 'none', ml: 'auto !important' }}
                  >
                    Remove
                  </Button>
                </Stack>
                {uploadError && (
                  <Alert severity="warning" onClose={() => setUploadError('')} sx={{ mt: 1 }}>
                    {uploadError}
                  </Alert>
                )}
              </Box>
            ) : (
              /* Empty state — show upload button + URL paste field */
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: 'background.default',
                  borderStyle: 'dashed',
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                  Event Banner Image (Amazon S3)
                </Typography>
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                  >
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<CloudUploadIcon />}
                      disabled={uploadingImage}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Upload Image
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageFileChange}
                      />
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Uploads directly to your AWS S3 bucket. Supported: PNG, JPG, WebP.
                    </Typography>
                  </Stack>

                  {uploadError && (
                    <Alert severity="warning" onClose={() => setUploadError('')}>
                      {uploadError}
                    </Alert>
                  )}

                  <TextField
                    label="Or paste Image URL directly"
                    size="small"
                    fullWidth
                    value={formData.imageUrl || ''}
                    onChange={handleChange('imageUrl')}
                    placeholder="https://your-bucket.s3.region.amazonaws.com/events/banner.jpg"
                  />
                </Stack>
              </Paper>
            )
          }

          {/* Stored Pictures & Recent Uploads Shelf */}
          <RecentUploadsShelf
            currentUrl={formData.imageUrl}
            onSelect={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
            eventId={id}
            category="banner"
            title="Recent Uploads Storage (Database & S3)"
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Participants"
              type="number"
              fullWidth
              value={formData.participants}
              onChange={handleChange('participants')}
            />

            <TextField
              label="Max Capacity"
              type="number"
              required
              fullWidth
              value={formData.capacity}
              onChange={handleChange('capacity')}
            />
          </Stack>

          <TextField
            label="Officer IDs (comma-separated person IDs)"
            fullWidth
            value={formData.officerIds ? formData.officerIds.join(', ') : ''}
            onChange={(e) => {
              const val = e.target.value;
              setFormData(prev => ({ ...prev, officerIds: val.split(',').map(s => s.trim()).filter(Boolean) }));
            }}
            placeholder="per-1, per-2"
          />

          <Divider sx={{ my: 2 }} />

          {/* Speakers Section */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Speakers
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addSpeaker}
                sx={{ textTransform: 'none' }}
              >
                Add Speaker
              </Button>
            </Stack>

            {speakers.length === 0 && (
              <Typography variant="caption" color="text.secondary">
                No speakers added yet. Click "Add Speaker" to add one.
              </Typography>
            )}

            <Stack spacing={2}>
              {speakers.map((sp, idx) => (
                <Paper
                  key={idx}
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 2, position: 'relative' }}
                >
                  {/* Speaker avatar adjuster */}
                  {adjustingSpeakerIdx === idx && adjustingSpeakerSource ? (
                    <Box sx={{ mb: 2 }}>
                      <AvatarImageAdjuster
                        label={`${sp.name || 'Speaker'} Photo`}
                        source={adjustingSpeakerSource}
                        onCropAndUpload={handleSpeakerAvatarUpload}
                        onCancel={() => { setAdjustingSpeakerIdx(null); setAdjustingSpeakerSource(null); }}
                        onFileReplace={(f) => setAdjustingSpeakerSource(f)}
                        uploading={uploadingSpeakerAvatar}
                        uploadProgress={speakerUploadProgress}
                      />
                    </Box>
                  ) : (
                    <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
                      {/* Avatar with upload overlay */}
                      <Box sx={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar
                          src={sp.avatarUrl || undefined}
                          sx={{ width: 64, height: 64, border: '2px solid', borderColor: 'divider' }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Tooltip title="Upload speaker photo">
                          <IconButton
                            size="small"
                            onClick={() => speakerFileRefs.current[idx]?.click()}
                            sx={{
                              position: 'absolute',
                              bottom: -4,
                              right: -4,
                              bgcolor: 'background.paper',
                              border: '2px solid',
                              borderColor: 'divider',
                              width: 26,
                              height: 26,
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            <PhotoCameraIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                        <input
                          ref={(el) => { speakerFileRefs.current[idx] = el; }}
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            e.target.value = '';
                            setAdjustingSpeakerIdx(idx);
                            setAdjustingSpeakerSource(file);
                          }}
                        />
                        {sp.avatarUrl && (
                          <Tooltip title="Re-adjust photo">
                            <Typography
                              variant="caption"
                              onClick={() => { setAdjustingSpeakerIdx(idx); setAdjustingSpeakerSource(sp.avatarUrl); }}
                              sx={{ display: 'block', textAlign: 'center', mt: 0.5, cursor: 'pointer', color: 'primary.main', fontSize: '0.65rem' }}
                            >
                              Adjust
                            </Typography>
                          </Tooltip>
                        )}
                      </Box>

                      <Stack spacing={1.5} flex={1}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                          <TextField
                            label="Speaker Name"
                            size="small"
                            fullWidth
                            value={sp.name}
                            onChange={(e) => updateSpeaker(idx, 'name', e.target.value)}
                            required
                          />
                          <TextField
                            label="Title / Role"
                            size="small"
                            fullWidth
                            value={sp.headline}
                            onChange={(e) => updateSpeaker(idx, 'headline', e.target.value)}
                          />
                        </Stack>
                        <TextField
                          label="Short Bio"
                          size="small"
                          fullWidth
                          multiline
                          rows={2}
                          value={sp.bio}
                          onChange={(e) => updateSpeaker(idx, 'bio', e.target.value)}
                        />
                      </Stack>
                    </Stack>
                  )}

                  {/* Remove speaker */}
                  <Tooltip title="Remove speaker">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeSpeaker(idx)}
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Paper>
              ))}
            </Stack>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            {isEditing && (
              <Button 
                variant="outlined" 
                color="error" 
                onClick={handleDelete}
                disabled={saving}
              >
                Delete Event
              </Button>
            )}
            <Button 
              variant="contained" 
              type="submit" 
              disabled={saving}
              sx={{ background: brand.gradient }}
            >
              {saving ? 'Saving...' : 'Save Event'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
