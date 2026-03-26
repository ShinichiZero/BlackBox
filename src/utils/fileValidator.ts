/** Maximum accepted file size: 5 MB */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Accepted MIME types / extensions */
const ACCEPTED_TYPES = new Set([
  'application/gpx+xml',
  'text/xml',
  'application/xml',
  'text/csv',
  'text/plain', // some OS file pickers report CSV as text/plain
]);

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a File object BEFORE reading its contents into memory.
 *
 * Checks:
 *  1. File size ≤ 5 MB  (XML-bomb / DoS defence)
 *  2. File extension is .gpx or .csv
 *  3. MIME type is one of the accepted types (advisory only – may be empty string)
 */
export function validateFile(file: File): ValidationResult {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 5 MB.`,
    };
  }

  const name = file.name.toLowerCase();
  if (!name.endsWith('.gpx') && !name.endsWith('.csv')) {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload a .gpx or .csv file.',
    };
  }

  // MIME type check is advisory; browsers may report '' for unknown types
  if (file.type && !ACCEPTED_TYPES.has(file.type)) {
    return {
      valid: false,
      error: `Unexpected MIME type "${file.type}". Expected GPX (XML) or CSV.`,
    };
  }

  return { valid: true };
}
