import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import { updateSpeaker } from '../services/speakerService';
import type { Speaker } from '../types/speaker';

/** Admin: edit a speaker's name, title, organization, bio and email right from the event page. */
export default function SpeakerEditDialog({
  speaker,
  onClose,
  onSaved,
}: {
  speaker: Speaker | null;
  onClose: () => void;
  onSaved: (s: Speaker) => void;
}) {
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!speaker) return;
    setName(speaker.name || '');
    setHeadline(speaker.headline || '');
    setCompany(speaker.company || '');
    setBio(speaker.bio || '');
    setEmail(speaker.email || '');
    setError('');
  }, [speaker]);

  async function save() {
    if (!speaker) return;
    if (!name.trim()) return setError('The speaker needs a name.');
    setBusy(true);
    setError('');
    try {
      const saved = await updateSpeaker(speaker.id, {
        name: name.trim(),
        headline: headline.trim(),
        company: company.trim(),
        bio: bio.trim(),
        email: email.trim(),
      });
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the speaker.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={Boolean(speaker)} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ textTransform: 'none', letterSpacing: 0, fontWeight: 800 }}>Edit speaker</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5} data-testid="speaker-edit-form">
          {speaker?.profile && (
            <Typography variant="body2" color="text.secondary">
              Linked to {speaker.profile.name}'s account: their name, photo and links come from the account.
            </Typography>
          )}
          <TextField label="Name" size="small" value={name} onChange={(e) => setName(e.target.value)} required inputProps={{ maxLength: 120 }} />
          <TextField label="Title / role" size="small" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. President, AWS SBG-APC" inputProps={{ maxLength: 160 }} />
          <TextField label="Organization" size="small" value={company} onChange={(e) => setCompany(e.target.value)} helperText="Leave empty if the title already names it." inputProps={{ maxLength: 120 }} />
          <TextField label="Bio" size="small" value={bio} onChange={(e) => setBio(e.target.value)} multiline minRows={3} inputProps={{ maxLength: 1500 }} />
          <TextField label="Email (optional)" size="small" value={email} onChange={(e) => setEmail(e.target.value)} helperText="When they sign up with this email, the card links to their account." inputProps={{ maxLength: 200 }} />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => void save()} disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
