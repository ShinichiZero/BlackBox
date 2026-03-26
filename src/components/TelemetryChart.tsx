import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { FlightPoint } from '../types/FlightTypes';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

/** Downsample points to at most `maxPoints` evenly-spaced entries for performance. */
function downsample<T>(arr: T[], maxPoints: number): T[] {
  if (arr.length <= maxPoints) return arr;
  const step = arr.length / maxPoints;
  return Array.from({ length: maxPoints }, (_, i) => arr[Math.round(i * step)]);
}

interface TelemetryChartProps {
  points: FlightPoint[];
}

/**
 * Dual-axis line chart showing Altitude (ft, left axis) and Ground Speed (kts, right axis)
 * over normalised time (X-axis).
 *
 * Downsampled to 600 points for large datasets to keep the browser responsive.
 */
export function TelemetryChart({ points }: TelemetryChartProps) {
  const MAX_DISPLAY_POINTS = 600;
  const sampled = useMemo(
    () => downsample(points, MAX_DISPLAY_POINTS),
    [points],
  );

  const labels = useMemo(() => {
    if (sampled.length === 0) return [];
    const t0 = sampled[0].timeMs;
    return sampled.map((p) => {
      const elapsed = (p.timeMs - t0) / 1000;
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = Math.floor(elapsed % 60);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    });
  }, [sampled]);

  const data = useMemo<ChartData<'line'>>(
    () => ({
      labels,
      datasets: [
        {
          label: 'Altitude (ft MSL)',
          data: sampled.map((p) => Math.round(p.altitudeFt)),
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56,189,248,0.15)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          yAxisID: 'yAlt',
        },
        {
          label: 'Ground Speed (kts)',
          data: sampled.map((p) => Math.round(p.groundSpeedKts)),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.10)',
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          yAxisID: 'ySpd',
        },
      ],
    }),
    [sampled, labels],
  );

  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false, // disable for large datasets
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          labels: { color: '#94a3b8', font: { size: 12 } },
        },
        title: {
          display: false,
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#e2e8f0',
          bodyColor: '#94a3b8',
          borderColor: '#334155',
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#64748b',
            maxTicksLimit: 10,
            maxRotation: 0,
          },
          grid: { color: '#1e293b' },
        },
        yAlt: {
          type: 'linear',
          position: 'left',
          title: {
            display: true,
            text: 'Altitude (ft MSL)',
            color: '#38bdf8',
          },
          ticks: { color: '#38bdf8' },
          grid: { color: '#1e293b' },
        },
        ySpd: {
          type: 'linear',
          position: 'right',
          title: {
            display: true,
            text: 'Ground Speed (kts)',
            color: '#f59e0b',
          },
          ticks: { color: '#f59e0b' },
          grid: { drawOnChartArea: false },
        },
      },
    }),
    [],
  );

  return (
    <div className="relative w-full h-full">
      <Line data={data} options={options} />
    </div>
  );
}
