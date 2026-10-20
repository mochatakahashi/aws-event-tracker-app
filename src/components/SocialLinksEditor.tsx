import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import type { SocialLinks } from '../types/auth';
import { CUSTOM_LINK_ICON, SOCIAL_PLATFORMS, type SocialKey } from '../utils/socials';
import { socialLinkError } from '../utils/linkCheck';

/**
 * Pick which links to show: Facebook, Instagram, LinkedIn, GitHub, X, TikTok,
 * YouTube, Website - or any other link with your own name for it.
 */
export default function SocialLinksEditor({ value, onChange }: { value: SocialLinks; onChange: (v: SocialLinks) => void }) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  // Platforms shown as fields: the ones with a value, plus ones just added
  const [shown, setShown] = useState<SocialKey[]>(() => SOCIAL_PLATFORMS.filter((p) => value[p.key]?.trim()).map((p) => p.key));
  const custom = value.custom ?? [];
  const available = SOCIAL_PLATFORMS.filter((p) => !shown.includes(p.key));

  function setKey(key: SocialKey, v: string) {
    onChange({ ...value, [key]: v });
  }
  function removeKey(key: SocialKey) {
    setShown((s) => s.filter((k) => k !== key));
    const next = { ...value };
    delete next[key];
    onChange(next);
  }
  function setCustom(i: number, part: 'label' | 'url', v: string) {
    onChange({ ...value, custom: custom.map((c, j) => (j === i ? { ...c, [part]: v } : c)) });
  }

  return (
    <Box data-testid="social-editor">
      <Stack spacing={1.25}>
        {SOCIAL_PLATFORMS.filter((p) => shown.includes(p.key)).map((p) => (
          <Stack key={p.key} direction="row" spacing={1} alignItems="flex-start">
            <TextField
              size="small"
              fullWidth
              label={p.label}
              placeholder={p.placeholder}
              value={value[p.key] ?? ''}
              onChange={(e) => setKey(p.key, e.target.value)}
              error={Boolean(socialLinkError(p.key, value[p.key]))}
              helperText={socialLinkError(p.key, value[p.key]) || undefined}
              InputProps={{ startAdornment: <Box sx={{ mr: 1, display: 'flex', color: p.color }}>{p.icon}</Box> }}
            />
            <Tooltip title={`Remove ${p.label}`}>
              <IconButton size="small" onClick={() => removeKey(p.key)} aria-label={`Remove ${p.label}`}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ))}
        {custom.map((c, i) => (
          <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
            <TextField
              size="small"
              label="Name"
              placeholder="e.g. Portfolio"
              value={c.label}
              onChange={(e) => setCustom(i, 'label', e.target.value)}
              sx={{ minWidth: { sm: 160 } }}
              inputProps={{ maxLength: 40 }}
            />
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
              <TextField
                size="small"
                fullWidth
                label="Link"
                placeholder="https://…"
                value={c.url}
                onChange={(e) => setCustom(i, 'url', e.target.value)}
                error={Boolean(socialLinkError('custom', c.url))}
                helperText={socialLinkError('custom', c.url) || undefined}
                InputProps={{ startAdornment: <Box sx={{ mr: 1, display: 'flex', color: '#5B21B6' }}>{CUSTOM_LINK_ICON}</Box> }}
              />
              <IconButton
                size="small"
                aria-label={`Remove ${c.label || 'link'}`}
                onClick={() => onChange({ ...value, custom: custom.filter((_, j) => j !== i) })}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        ))}
        {shown.length === 0 && custom.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Add the links you want people to see - Facebook, Instagram, LinkedIn and more.
          </Typography>
        )}
      </Stack>
      <Button size="small" startIcon={<AddRoundedIcon />} onClick={(e) => setAnchor(e.currentTarget)} sx={{ mt: 1.25 }}>
        Add a link
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {available.map((p) => (
          <MenuItem
            key={p.key}
            onClick={() => {
              setShown((s) => [...s, p.key]);
              setAnchor(null);
            }}
          >
            <ListItemIcon sx={{ color: p.color }}>{p.icon}</ListItemIcon>
            {p.label}
          </MenuItem>
        ))}
        <MenuItem
          disabled={custom.length >= 10}
          onClick={() => {
            onChange({ ...value, custom: [...custom, { label: '', url: '' }] });
            setAnchor(null);
          }}
        >
          <ListItemIcon>{CUSTOM_LINK_ICON}</ListItemIcon>
          Other (name it yourself)
        </MenuItem>
      </Menu>
    </Box>
  );
}

/** First problem in a set of social links ('' when they're all fine). */
export function socialsProblem(v: SocialLinks | undefined): string {
  if (!v) return '';
  for (const p of SOCIAL_PLATFORMS) {
    const e = socialLinkError(p.key, v[p.key]);
    if (e) return `${p.label}: ${e}`;
  }
  for (const c of v.custom || []) {
    const e = socialLinkError('custom', c.url);
    if (e) return `${c.label || 'Link'}: ${e}`;
  }
  return '';
}
