import { useState, useCallback } from 'react';
import type { FlightPoint, FlightMetadata } from '../types/FlightTypes';
import { validateFile } from '../utils/fileValidator';
import { parseGPX, parseCSV } from '../utils/parsers';
import { haversine } from '../utils/haversine';

export interface FlightDataState {
  points: FlightPoint[];
  metadata: FlightMetadata | null;
  isLoading: boolean;
  error: string | null;
  fileName: string | null;
}

export interface UseFlightDataReturn extends FlightDataState {
  loadFile: (file: File) => void;
  reset: () => void;
}

const INITIAL_STATE: FlightDataState = {
  points: [],
  metadata: null,
  isLoading: false,
  error: null,
  fileName: null,
};

/** Computes summary metadata from an array of FlightPoints. */
function computeMetadata(points: FlightPoint[]): FlightMetadata {
  let totalDistanceNm = 0;
  let maxAltitudeFt = -Infinity;
  let maxGroundSpeedKts = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    totalDistanceNm += haversine(prev.lat, prev.lon, curr.lat, curr.lon);
    maxAltitudeFt = Math.max(maxAltitudeFt, curr.altitudeFt);
    maxGroundSpeedKts = Math.max(maxGroundSpeedKts, curr.groundSpeedKts);
  }

  if (points.length > 0) {
    maxAltitudeFt = Math.max(maxAltitudeFt, points[0].altitudeFt);
  }

  const durationSeconds =
    points.length > 1
      ? (points[points.length - 1].timeMs - points[0].timeMs) / 1000
      : 0;

  return {
    totalDistanceNm,
    maxAltitudeFt: maxAltitudeFt === -Infinity ? 0 : maxAltitudeFt,
    maxGroundSpeedKts,
    durationSeconds,
    departureTime: points[0]?.time ?? '',
    arrivalTime: points[points.length - 1]?.time ?? '',
  };
}

/**
 * Custom hook that manages all flight-data state.
 * Accepts a file drop event, validates, parses, and stores the result.
 */
export function useFlightData(): UseFlightDataReturn {
  const [state, setState] = useState<FlightDataState>(INITIAL_STATE);

  const loadFile = useCallback((file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setState((s) => ({ ...s, error: validation.error ?? 'Invalid file.' }));
      return;
    }

    setState({ ...INITIAL_STATE, isLoading: true, fileName: file.name });

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const isGPX = file.name.toLowerCase().endsWith('.gpx');
        const points = isGPX ? parseGPX(text) : parseCSV(text);
        const metadata = computeMetadata(points);
        setState({
          points,
          metadata,
          isLoading: false,
          error: null,
          fileName: file.name,
        });
      } catch (err) {
        setState({
          ...INITIAL_STATE,
          error: err instanceof Error ? err.message : 'Failed to parse file.',
          fileName: file.name,
        });
      }
    };

    reader.onerror = () => {
      setState({
        ...INITIAL_STATE,
        error: 'Failed to read file.',
        fileName: file.name,
      });
    };

    reader.readAsText(file);
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return { ...state, loadFile, reset };
}
