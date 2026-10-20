import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { formatDateTime } from './AdminUi';
import type { OfficerSummary, TaskRow } from '../utils/taskSummary';

type Dir = 'asc' | 'desc';

function useSort<T>(rows: T[], initial: keyof T, initialDir: Dir = 'asc') {
  const [key, setKey] = useState<keyof T>(initial);
  const [dir, setDir] = useState<Dir>(initialDir);
  const sorted = useMemo(() => {
    const out = [...rows];
    out.sort((a, b) => {
      const x = a[key] as unknown;
      const y = b[key] as unknown;
      // Empty values (e.g. no deadline) always go last
      if (x === undefined || x === '' || x === null) return 1;
      if (y === undefined || y === '' || y === null) return -1;
      const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
      return dir === 'asc' ? c : -c;
    });
    return out;
  }, [rows, key, dir]);
  const label = (k: keyof T, text: string, numeric = false) => (
    <TableSortLabel
      active={key === k}
      direction={key === k ? dir : numeric ? 'desc' : 'asc'}
      onClick={() => {
        if (key === k) setDir(dir === 'asc' ? 'desc' : 'asc');
        else {
          setKey(k);
          setDir(numeric ? 'desc' : 'asc');
        }
      }}
    >
      {text}
    </TableSortLabel>
  );
  return { sorted, label };
}

const headSx = {
  '& th': { fontWeight: 700, whiteSpace: 'nowrap', bgcolor: alpha(brand.primary, 0.06) },
};

const TONE_COLOR = { ok: 'default', warn: 'warning', late: 'error', done: 'success', none: 'default' } as const;
const STATUS_COLOR: Record<string, 'default' | 'warning' | 'success'> = { 'To do': 'default', 'In progress': 'warning', Done: 'success' };

/** The tasks as a sortable table (like a spreadsheet). */
export function TaskTable({ rows }: { rows: TaskRow[] }) {
  const { sorted, label } = useSort(rows, 'dueAt');
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', overflowX: 'auto' }} data-testid="task-table">
      <Table size="small" sx={{ minWidth: 1080 }}>
        <TableHead sx={headSx}>
          <TableRow>
            <TableCell>{label('title', 'Task')}</TableCell>
            <TableCell>{label('committee', 'Committee')}</TableCell>
            <TableCell>{label('subcommittee', 'Sub-committee')}</TableCell>
            <TableCell>{label('forWhat', 'For')}</TableCell>
            <TableCell>{label('assignees', 'Assigned to')}</TableCell>
            <TableCell>{label('statusOrder', 'Status')}</TableCell>
            <TableCell>{label('dueAt', 'Deadline')}</TableCell>
            <TableCell>{label('deadline', 'Progress')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((r) => (
            <TableRow key={r.id} hover>
              <TableCell sx={{ fontWeight: 600, minWidth: 190, maxWidth: 280 }}>{r.title}</TableCell>
              <TableCell>{r.committee}</TableCell>
              <TableCell>{r.subcommittee}</TableCell>
              <TableCell sx={{ minWidth: 170, maxWidth: 240 }}>{r.forWhat}</TableCell>
              <TableCell sx={{ minWidth: 150, maxWidth: 240 }}>{r.assignees}</TableCell>
              <TableCell>
                <Chip size="small" color={STATUS_COLOR[r.status] || 'default'} label={r.status} />
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.dueAt ? formatDateTime(r.dueAt) : ''}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                <Chip size="small" variant="outlined" color={TONE_COLOR[r.tone]} label={r.deadline} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/** One row per officer: how many tasks, done, on time, late, overdue. */
export function OfficerSummaryTable({ rows }: { rows: OfficerSummary[] }) {
  const { sorted, label } = useSort(rows, 'total', 'desc');
  const num = { textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' };
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', overflowX: 'auto' }} data-testid="officer-summary-table">
      <Table size="small" sx={{ minWidth: 720 }}>
        <TableHead sx={headSx}>
          <TableRow>
            <TableCell>{label('name', 'Officer')}</TableCell>
            <TableCell>{label('committee', 'Committee')}</TableCell>
            <TableCell sx={num}>{label('total', 'Tasks', true)}</TableCell>
            <TableCell sx={num}>{label('todo', 'To do', true)}</TableCell>
            <TableCell sx={num}>{label('inProgress', 'In progress', true)}</TableCell>
            <TableCell sx={num}>{label('done', 'Done', true)}</TableCell>
            <TableCell sx={num}>{label('onTime', 'On time', true)}</TableCell>
            <TableCell sx={num}>{label('late', 'Done late', true)}</TableCell>
            <TableCell sx={num}>{label('overdue', 'Overdue', true)}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((r) => (
            <TableRow key={r.personId} hover>
              <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
              <TableCell>{r.committee}</TableCell>
              <TableCell sx={num}>{r.total}</TableCell>
              <TableCell sx={num}>{r.todo}</TableCell>
              <TableCell sx={num}>{r.inProgress}</TableCell>
              <TableCell sx={num}>{r.done}</TableCell>
              <TableCell sx={{ ...num, color: r.onTime ? brand.success : undefined }}>{r.onTime}</TableCell>
              <TableCell sx={{ ...num, color: r.late ? brand.error : undefined }}>{r.late}</TableCell>
              <TableCell sx={{ ...num, color: r.overdue ? brand.error : undefined, fontWeight: r.overdue ? 700 : undefined }}>
                {r.overdue}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length === 0 && <Box sx={{ p: 2, color: 'text.secondary', fontSize: 14 }}>No tasks to count yet.</Box>}
    </TableContainer>
  );
}
