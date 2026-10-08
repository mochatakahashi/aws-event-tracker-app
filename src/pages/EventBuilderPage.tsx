import { useEffect, useState } from 'react';
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
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getEvent, createEvent, updateEvent, deleteEvent } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import { brand } from '../theme/theme';
import type { AppEvent } from '../types/event';

export default function EventBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<Partial<AppEvent>>({
    title: '',
    category: 'conference',
    status: 'upcoming',
    venue: '',
    startAt: new Date().toISOString().slice(0, 16),
    endAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    description: '',
    capacity: 100,
    imageUrl: '',
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/home');
      return;
    }
    
    if (isEditing && id) {
      getEvent(id).then(ev => {
        if (ev) {
          setFormData({
            ...ev,
            startAt: new Date(ev.startAt).toISOString().slice(0, 16),
            endAt: new Date(ev.endAt).toISOString().slice(0, 16),
          });
        }
      }).finally(() => setLoading(false));
    }
  }, [id, isEditing, user, navigate]);

  const handleChange = (field: keyof AppEvent) => (e: any) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const eventToSave: any = {
        title: formData.title || 'Untitled Event',
        category: (formData.category as any) || 'conference',
        status: (formData.status as any) || 'upcoming',
        venue: formData.venue || 'TBA',
        startAt: new Date(formData.startAt!).toISOString(),
        endAt: new Date(formData.endAt!).toISOString(),
        description: formData.description || '',
        capacity: Number(formData.capacity) || 100,
        speakerIds: formData.speakerIds || [],
        officerIds: formData.officerIds || [],
        imageUrl: formData.imageUrl || undefined,
      };
      
      let savedEvent;
      if (isEditing && id) {
        savedEvent = await updateEvent(id, eventToSave);
      } else {
        eventToSave.createdAt = new Date().toISOString();
        savedEvent = await createEvent(eventToSave);
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
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4, px: { xs: 2, sm: 3 } }}>
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
              <InputLabel>Category</InputLabel>
              <Select value={formData.category} label="Category" onChange={handleChange('category')}>
                <MenuItem value="conference">Conference</MenuItem>
                <MenuItem value="meetup">Meetup</MenuItem>
                <MenuItem value="workshop">Workshop</MenuItem>
                <MenuItem value="hackathon">Hackathon</MenuItem>
                <MenuItem value="webinar">Webinar</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={formData.status} label="Status" onChange={handleChange('status')}>
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="ongoing">Ongoing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Stack>

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
          
          <TextField
            label="Image URL (Optional)"
            fullWidth
            value={formData.imageUrl || ''}
            onChange={handleChange('imageUrl')}
            placeholder="https://example.com/image.jpg"
          />

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

          <TextField
            label="Max Capacity"
            type="number"
            required
            fullWidth
            value={formData.capacity}
            onChange={handleChange('capacity')}
          />

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
