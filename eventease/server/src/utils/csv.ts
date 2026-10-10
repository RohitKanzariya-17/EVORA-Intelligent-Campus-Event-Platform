/**
 * Sanitize a string to prevent CSV formula injection attacks
 * Prevents Excel/Sheets execution of =, +, -, @, \t, \r
 */
export const sanitizeCsvCell = (val: unknown): string => {
  if (val === null || val === undefined) {
    return '""';
  }

  let str = String(val).trim();

  // If the cell begins with dangerous spreadsheet formula triggers, prepend a single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape inner double quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
};

/**
 * Convert rows to CSV string with headers and formula injection protection
 */
export const buildCsvString = (headers: string[], rows: (string | number | null | undefined)[][]): string => {
  const headerLine = headers.map(sanitizeCsvCell).join(',');
  const rowLines = rows.map((row) => row.map(sanitizeCsvCell).join(','));
  return [headerLine, ...rowLines].join('\r\n');
};
