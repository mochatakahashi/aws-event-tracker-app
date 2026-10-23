/**
 * Download real .xlsx files (one or more sheets) from plain rows.
 * The Excel writer is loaded only when someone actually exports.
 */

export type ExcelValue = string | number | boolean | Date | null | undefined;

export interface ExcelSheet {
  /** Sheet tab name (Excel allows 31 characters, no []:*?/\). */
  name: string;
  headers: string[];
  rows: ExcelValue[][];
  /** Optional column widths (characters). */
  widths?: number[];
}

function safeSheetName(name: string, used: Set<string>): string {
  let base = name.replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31) || 'Sheet';
  let candidate = base;
  let n = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${n++})`;
    candidate = base.slice(0, 31 - suffix.length) + suffix;
  }
  used.add(candidate.toLowerCase());
  base = candidate;
  return base;
}

export function safeFileName(name: string): string {
  return name.replace(/[^a-z0-9\-_ ]/gi, '').trim().replace(/\s+/g, '-').slice(0, 80) || 'export';
}

export async function downloadExcel(fileName: string, sheets: ExcelSheet[]): Promise<void> {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const used = new Set<string>();
  const data = sheets.map((sheet) => {
    const header = sheet.headers.map((h) => ({ value: h, fontWeight: 'bold' as const }));
    const body = sheet.rows.map((row) =>
      row.map((cell) => (cell === null || cell === undefined || cell === '' ? null : cell)),
    );
    const widths =
      sheet.widths ??
      sheet.headers.map((h, i) =>
        Math.min(
          50,
          Math.max(h.length, ...sheet.rows.map((r) => String(r[i] ?? '').length)) + 2,
        ),
      );
    return {
      data: [header, ...body],
      sheet: safeSheetName(sheet.name, used),
      columns: widths.map((width) => ({ width })),
      stickyRowsCount: 1,
      dateFormat: 'yyyy-mm-dd hh:mm',
    };
  });
  await writeXlsxFile(data as never).toFile(fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
}

/**
 * ISO string → Date for an Excel cell, in Manila time (like the rest of the app). The Excel writer
 * stores a Date's UTC clock time, so shift it by +8 hours: the file shows the same times on any
 * computer, whatever its own time zone.
 */
export function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() + 8 * 3600_000);
}
