import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import { LatLngBounds, LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { FlightPoint } from '../types/FlightTypes';

// ---------------------------------------------------------------------------
// Inner component: auto-fits map bounds when points change
// ---------------------------------------------------------------------------
function BoundsFitter({ bounds }: { bounds: LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [bounds, map]);
  return null;
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------
interface FlightMapProps {
  points: FlightPoint[];
}

/**
 * Renders the 2-D flight-path map using react-leaflet.
 * The map bounds are automatically fitted to the entire flight path on load.
 */
export function FlightMap({ points }: FlightMapProps) {
  const mapRef = useRef(null);

  const positions = useMemo(
    () => points.map((p): [number, number] => [p.lat, p.lon]),
    [points],
  );

  const bounds = useMemo(() => {
    if (positions.length === 0) return null;
    return new LatLngBounds(positions.map((p) => new LatLng(p[0], p[1])));
  }, [positions]);

  const defaultCenter: [number, number] = [20, 0];

  return (
    <MapContainer
      ref={mapRef}
      center={defaultCenter}
      zoom={3}
      className="w-full h-full rounded-xl"
      style={{ background: '#0f172a' }}
    >
      {/* OpenStreetMap tiles – no API key required */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        // Keep max zoom within OSM's published limit to prevent blank tiles
        maxZoom={19}
      />
      {positions.length > 1 && (
        <Polyline
          positions={positions}
          pathOptions={{ color: '#38bdf8', weight: 2, opacity: 0.9 }}
        />
      )}
      <BoundsFitter bounds={bounds} />
    </MapContainer>
  );
}
