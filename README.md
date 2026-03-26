# ✈ BlackBox – Flight Data Visualizer

A browser-based flight data visualizer that parses GPX or CSV flight logs from
**MSFS 2020** and **ForeFlight** and renders an interactive map and telemetry
charts — entirely client-side, with no data leaving your machine.

---

## Features

| Feature | Detail |
|---|---|
| **Drag & drop upload** | `.gpx` and `.csv` support via `react-dropzone` |
| **2-D flight path map** | `react-leaflet` with OpenStreetMap tiles; auto-fits bounds on load |
| **Dual-axis telemetry chart** | `Chart.js` — Altitude (ft MSL, left) + Ground Speed (kts, right) vs. elapsed time |
| **Computed metrics** | Total distance (NM), max altitude (ft), max ground speed (kts), flight duration |
| **Vertical speed** | Calculated (fpm) at every data point |
| **Dark-mode Cockpit UI** | Tailwind CSS `slate-950` theme |
| **Optimised for large datasets** | Charts downsample to 600 display points; 5 MB file-size gate |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18

### Install & run locally

```bash
npm install
npm run dev
```

Open <http://localhost:5173> in your browser.

### Build for production

```bash
npm run build
# Output is in dist/
```

### Deploy to GitHub Pages

Push the `dist/` folder (or configure a GitHub Actions workflow) to the
`gh-pages` branch.  See the [Vite deployment guide](https://vite.dev/guide/static-deploy.html#github-pages).

---

## Supported File Formats

### GPX (GPS Exchange Format)

Standard `.gpx` files with `<trkpt>` elements containing `lat`, `lon`, `<ele>` (metres), and `<time>` (ISO-8601).

```xml
<trkpt lat="47.6062" lon="-122.3321">
  <ele>152.4</ele>
  <time>2024-06-01T10:00:00Z</time>
</trkpt>
```

### CSV

A `.csv` file with a header row containing the columns `lat`, `lon`, `ele`, `time`
(column names are matched case-insensitively):

```csv
lat,lon,ele,time
47.6062,-122.3321,152.4,2024-06-01T10:00:00Z
47.6120,-122.3400,320.0,2024-06-01T10:01:00Z
```

`ele` should be in **metres**; the app converts to feet on ingest.

---

## Security

See [SECURITY.md](./SECURITY.md) for a full breakdown of security measures including:

- **DOMPurify** sanitisation on all values extracted from uploaded files
- **XML Bomb** defences (5 MB file-size gate + 200 000 node circuit-breaker)
- **Content Security Policy** (strict `<meta>` tag in `index.html`)
- **API key strategy** for future external API integrations

---

## Tech Stack

- [Vite](https://vite.dev/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [react-leaflet](https://react-leaflet.js.org/) / [Leaflet](https://leafletjs.com/)
- [Chart.js](https://www.chartjs.org/) / [react-chartjs-2](https://react-chartjs-2.js.org/)
- [react-dropzone](https://react-dropzone.js.org/)
- [DOMPurify](https://github.com/cure53/DOMPurify)
