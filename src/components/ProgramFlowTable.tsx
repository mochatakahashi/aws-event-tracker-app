import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import type { ProgramRow } from '../types/event';

/**
 * The event's program flow as a table (laptops) or a stacked list (phones).
 * The person-in-charge column is for the team (officers, admins, the adviser), not attendees.
 */
export default function ProgramFlowTable({ rows, showPersonInCharge = true }: { rows: ProgramRow[]; showPersonInCharge?: boolean }) {
  if (!rows.length) return null;
  const heads = showPersonInCharge ? ['Time', 'Duration', 'Activity', 'Person-in-charge'] : ['Time', 'Duration', 'Activity'];
  return (
    <Box data-testid="program-flow">
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5 }}>
        Program Flow
      </Typography>
      {/* Laptops: table */}
      <Box sx={{ display: { xs: 'none', sm: 'block' }, border: `1px solid ${alpha(brand.primary, 0.15)}`, borderRadius: '12px', overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(brand.primary, 0.06) }}>
              {heads.map((h) => (
                <TableCell key={h} sx={{ fontWeight: 800, color: brand.primary, whiteSpace: 'nowrap' }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i} sx={{ '&:nth-of-type(even)': { bgcolor: alpha(brand.primary, 0.02) }, '&:last-child td': { border: 0 } }}>
                <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{r.time}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>{r.duration}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{r.activity}</TableCell>
                {showPersonInCharge && <TableCell sx={{ color: 'text.secondary' }}>{r.personInCharge}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      {/* Phones: stacked */}
      <Stack spacing={1} sx={{ display: { xs: 'flex', sm: 'none' } }}>
        {rows.map((r, i) => (
          <Box key={i} sx={{ p: 1.25, borderRadius: '10px', border: `1px solid ${alpha(brand.primary, 0.12)}` }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: brand.primary }}>
              {r.time}
              {r.duration ? ` · ${r.duration}` : ''}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {r.activity}
            </Typography>
            {showPersonInCharge && r.personInCharge && (
              <Typography variant="caption" color="text.secondary">
                {r.personInCharge}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

const TIME_RE = /^\d{1,2}:\d{2}\s*(AM|PM)?\s*[-–—]\s*\d{1,2}:\d{2}\s*(AM|PM)?$/i;
const HEADERS = /^(comprehensive program design|program flow|time|duration|activity|person[- ]in[- ]charge)$/i;

/**
 * Turn a program pasted from a document into rows. Accepts the usual
 * "Time / Duration / Activity / Person-in-Charge" layout - one cell per line,
 * or tab-separated rows.
 */
export function parseProgramFlow(text: string): ProgramRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l && !HEADERS.test(l));
  const rows: ProgramRow[] = [];
  // Tab / pipe separated rows
  if (text.includes('\t') || /\|/.test(text)) {
    for (const raw of text.split(/\r?\n/)) {
      const cells = raw.split(/\t|\|/).map((c) => c.trim()).filter(Boolean);
      if (cells.length >= 2 && !HEADERS.test(cells[0])) {
        const [time, duration, activity, personInCharge] = cells.length >= 4 ? cells : [cells[0], '', cells[1], cells[2] ?? ''];
        rows.push({ time: time.replace(/\s*[-–—]\s*/, ' – '), duration, activity, personInCharge });
      }
    }
    return rows;
  }
  // One cell per line: a row starts at each time range
  let cur: string[] = [];
  const flush = () => {
    if (!cur.length) return;
    const [time, ...rest] = cur;
    const hasDuration = rest[0] && /^\d+(\.\d+)?\s*(mins?|minutes?|hours?|hrs?)$/i.test(rest[0]);
    const duration = hasDuration ? rest.shift()! : '';
    rows.push({ time: time.replace(/\s*[-–—]\s*/, ' – '), duration, activity: rest[0] ?? '', personInCharge: rest.slice(1).join(' ') });
    cur = [];
  };
  for (const l of lines) {
    if (TIME_RE.test(l)) flush();
    cur.push(l);
  }
  flush();
  return rows.filter((r) => TIME_RE.test(r.time.replace(' – ', '-')) || r.activity);
}
