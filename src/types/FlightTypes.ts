/** A single recorded data point in a flight log. */
export interface FlightPoint {
  /** Latitude in decimal degrees */
  lat: number;
  /** Longitude in decimal degrees */
  lon: number;
  /** Altitude in feet (MSL) – converted from metres on ingest */
  altitudeFt: number;
  /** ISO-8601 timestamp string */
  time: string;
  /** Unix epoch milliseconds, derived from `time` */
  timeMs: number;
  /** Ground speed in knots, calculated from haversine distance between adjacent points */
  groundSpeedKts: number;
  /** Vertical speed in feet-per-minute, calculated from adjacent altitude deltas */
  verticalSpeedFpm: number;
}

/** Summary statistics computed from the full set of FlightPoints. */
export interface FlightMetadata {
  /** Total great-circle distance in nautical miles */
  totalDistanceNm: number;
  /** Highest altitude recorded (ft) */
  maxAltitudeFt: number;
  /** Highest ground speed recorded (kts) */
  maxGroundSpeedKts: number;
  /** Flight duration in seconds */
  durationSeconds: number;
  /** ISO-8601 departure timestamp */
  departureTime: string;
  /** ISO-8601 arrival timestamp */
  arrivalTime: string;
}
