import { useFlightData } from './hooks/useFlightData';
import { DropZone } from './components/DropZone';
import { FlightMap } from './components/FlightMap';
import { TelemetryChart } from './components/TelemetryChart';

/** Formats seconds into h m s display string */
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

function App() {
  const { points, metadata, isLoading, error, fileName, loadFile, reset } =
    useFlightData();

  const hasData = points.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-sky-400 text-2xl" aria-hidden="true">✈</span>
          <h1 className="text-xl font-bold tracking-widest uppercase text-sky-300">
            BlackBox
          </h1>
          <span className="text-slate-500 text-sm">Flight Data Visualizer</span>
        </div>
        {hasData && (
          <button
            onClick={reset}
            className="text-sm text-slate-400 hover:text-sky-300 transition-colors border border-slate-700 hover:border-sky-600 rounded px-3 py-1"
          >
            ← Load new file
          </button>
        )}
      </header>

      {/* Main content */}
      <main className="px-6 py-6 max-w-screen-2xl mx-auto">

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-sky-400">
            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm tracking-widest">PARSING FLIGHT LOG…</p>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="rounded-xl border border-red-700 bg-red-900/20 p-6 mb-6">
            <p className="text-red-400 font-semibold mb-1">Error</p>
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={reset}
              className="mt-4 text-sm text-slate-300 hover:text-white underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Drop zone */}
        {!isLoading && !hasData && (
          <div className="max-w-2xl mx-auto mt-16">
            <DropZone onFile={loadFile} disabled={isLoading} />
            <p className="text-center text-slate-600 text-xs mt-4">
              MSFS 2020 / ForeFlight GPX or CSV export
            </p>
          </div>
        )}

        {/* Flight data dashboard */}
        {!isLoading && hasData && metadata && (
          <>
            {/* File info bar */}
            <div className="flex flex-wrap gap-4 mb-6 text-sm text-slate-400">
              <span className="text-sky-400 font-semibold">{fileName}</span>
              <span>·</span>
              <span>{points.length.toLocaleString()} data points</span>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Distance" value={`${metadata.totalDistanceNm.toFixed(1)} NM`} />
              <StatCard label="Max Altitude" value={`${Math.round(metadata.maxAltitudeFt).toLocaleString()} ft`} />
              <StatCard label="Max Ground Speed" value={`${Math.round(metadata.maxGroundSpeedKts)} kts`} />
              <StatCard label="Flight Duration" value={formatDuration(metadata.durationSeconds)} />
            </div>

            {/* Map + Chart */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-900" style={{ height: '480px' }}>
                <div className="px-4 py-2 border-b border-slate-700 text-xs text-slate-500 uppercase tracking-widest">
                  Flight Path
                </div>
                <div style={{ height: 'calc(100% - 36px)' }}>
                  <FlightMap points={points} />
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900" style={{ height: '480px' }}>
                <div className="px-4 py-2 border-b border-slate-700 text-xs text-slate-500 uppercase tracking-widest">
                  Altitude &amp; Ground Speed
                </div>
                <div className="p-4" style={{ height: 'calc(100% - 36px)' }}>
                  <TelemetryChart points={points} />
                </div>
              </div>
            </div>

            {/* Departure / Arrival */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-slate-500">
              <div>
                <span className="text-slate-600 uppercase tracking-wider">Departure: </span>
                {metadata.departureTime}
              </div>
              <div className="text-right">
                <span className="text-slate-600 uppercase tracking-wider">Arrival: </span>
                {metadata.arrivalTime}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 px-6 py-4 border-t border-slate-800 text-center text-xs text-slate-700">
        BlackBox Flight Data Visualizer · Built with React, Leaflet &amp; Chart.js
      </footer>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700 px-4 py-3">
      <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-lg font-bold text-sky-300">{value}</p>
    </div>
  );
}

export default App;
