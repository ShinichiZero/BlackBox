import DOMPurify from 'dompurify';
import type { FlightPoint } from '../types/FlightTypes';
import { haversine } from './haversine';

/** Conversion factor: metres → feet */
const METRES_TO_FEET = 3.28084;

/** Maximum node count to guard against deeply nested / recursive XML structures */
const MAX_XML_NODES = 200_000;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Sanitise a string value extracted from external data before any further use. */
function sanitise(value: string): string {
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Derives ground-speed (kts) and vertical-speed (fpm) for every point in-place.
 * The first point always gets 0 for both values.
 */
function enrichPoints(raw: Omit<FlightPoint, 'groundSpeedKts' | 'verticalSpeedFpm'>[]): FlightPoint[] {
  return raw.map((pt, i) => {
    if (i === 0) {
      return { ...pt, groundSpeedKts: 0, verticalSpeedFpm: 0 };
    }
    const prev = raw[i - 1];
    const dtHours = (pt.timeMs - prev.timeMs) / 3_600_000;
    const dtMinutes = (pt.timeMs - prev.timeMs) / 60_000;

    const distNm = haversine(prev.lat, prev.lon, pt.lat, pt.lon);
    const groundSpeedKts = dtHours > 0 ? distNm / dtHours : 0;

    const altDeltaFt = pt.altitudeFt - prev.altitudeFt;
    const verticalSpeedFpm = dtMinutes > 0 ? altDeltaFt / dtMinutes : 0;

    return { ...pt, groundSpeedKts, verticalSpeedFpm };
  });
}

// ---------------------------------------------------------------------------
// GPX parser
// ---------------------------------------------------------------------------

/**
 * Parses a GPX (XML) string and returns an array of FlightPoints.
 *
 * Security measures:
 *  - All string values extracted from the XML are sanitised with DOMPurify.
 *  - The total node count is limited to MAX_XML_NODES to prevent XML-bomb DoS.
 *  - DOMParser is used (never eval / innerHTML).
 */
export function parseGPX(text: string): FlightPoint[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'application/xml');

  // Check for parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid GPX: XML parse error.');
  }

  // Circuit-breaker: count all nodes to guard against deeply-nested bombs
  const allNodes = doc.getElementsByTagName('*');
  if (allNodes.length > MAX_XML_NODES) {
    throw new Error(
      `GPX file exceeds maximum node limit (${MAX_XML_NODES.toLocaleString()} nodes). File may be malformed.`,
    );
  }

  const trkpts = Array.from(doc.getElementsByTagName('trkpt'));
  if (trkpts.length === 0) {
    throw new Error('No track points (<trkpt>) found in GPX file.');
  }

  const raw: Omit<FlightPoint, 'groundSpeedKts' | 'verticalSpeedFpm'>[] = [];

  for (const pt of trkpts) {
    const latStr = sanitise(pt.getAttribute('lat') ?? '');
    const lonStr = sanitise(pt.getAttribute('lon') ?? '');
    const eleStr = sanitise(pt.getElementsByTagName('ele')[0]?.textContent ?? '');
    const timeStr = sanitise(pt.getElementsByTagName('time')[0]?.textContent ?? '');

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    const eleM = parseFloat(eleStr);
    const timeMs = new Date(timeStr).getTime();

    if (
      !isFinite(lat) || lat < -90 || lat > 90 ||
      !isFinite(lon) || lon < -180 || lon > 180 ||
      !isFinite(eleM) ||
      isNaN(timeMs)
    ) {
      continue; // skip malformed points
    }

    raw.push({
      lat,
      lon,
      altitudeFt: eleM * METRES_TO_FEET,
      time: timeStr,
      timeMs,
    });
  }

  if (raw.length === 0) {
    throw new Error('No valid track points could be parsed from the GPX file.');
  }

  return enrichPoints(raw);
}

// ---------------------------------------------------------------------------
// CSV parser
// ---------------------------------------------------------------------------

/**
 * Parses a CSV string with headers `lat`, `lon`, `ele`, `time`.
 * Header names are matched case-insensitively.
 *
 * Security measures:
 *  - All values are sanitised with DOMPurify.
 *  - No eval / innerHTML used.
 */
export function parseCSV(text: string): FlightPoint[] {
  // Normalise line endings
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  if (lines.length < 2) {
    throw new Error('CSV file must contain a header row and at least one data row.');
  }

  const headers = lines[0].split(',').map((h) => sanitise(h.trim()).toLowerCase());

  const latIdx = headers.indexOf('lat');
  const lonIdx = headers.indexOf('lon');
  const eleIdx = headers.indexOf('ele');
  const timeIdx = headers.indexOf('time');

  if (latIdx < 0 || lonIdx < 0 || eleIdx < 0 || timeIdx < 0) {
    throw new Error(
      'CSV is missing required columns. Expected: lat, lon, ele, time.',
    );
  }

  const raw: Omit<FlightPoint, 'groundSpeedKts' | 'verticalSpeedFpm'>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',').map((c) => sanitise(c.trim()));

    const lat = parseFloat(cols[latIdx] ?? '');
    const lon = parseFloat(cols[lonIdx] ?? '');
    const eleM = parseFloat(cols[eleIdx] ?? '');
    const timeStr = cols[timeIdx] ?? '';
    const timeMs = new Date(timeStr).getTime();

    if (
      !isFinite(lat) || lat < -90 || lat > 90 ||
      !isFinite(lon) || lon < -180 || lon > 180 ||
      !isFinite(eleM) ||
      isNaN(timeMs)
    ) {
      continue; // skip malformed rows
    }

    raw.push({
      lat,
      lon,
      altitudeFt: eleM * METRES_TO_FEET,
      time: timeStr,
      timeMs,
    });
  }

  if (raw.length === 0) {
    throw new Error('No valid data rows could be parsed from the CSV file.');
  }

  return enrichPoints(raw);
}
