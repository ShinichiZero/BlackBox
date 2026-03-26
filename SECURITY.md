# BlackBox – Security Documentation

## 1. Threat Model Summary

BlackBox is a **client-side-only** React/TypeScript application that parses
user-supplied flight logs (GPX / CSV) entirely in the browser.  No data ever
leaves the user's machine.  The primary attack surfaces are:

| Attack Surface | Risk | Mitigation |
|---|---|---|
| User-supplied XML (GPX) | XML Bomb / XSS via malicious element content | File-size gate + node-count limit + DOMPurify |
| User-supplied CSV | XSS via formula injection / malicious string values | DOMPurify sanitisation on every field |
| Third-party CDN/tile server | Supply-chain / MitM | Strict CSP `connect-src` limiting connections to OSM only |
| Browser `innerHTML` / `dangerouslySetInnerHTML` | XSS | Banned – see §2 |

---

## 2. XSS Prevention (DOMPurify)

Every string value extracted from external GPX/CSV files is passed through
[`DOMPurify.sanitize()`](https://github.com/cure53/DOMPurify) with
`{ ALLOWED_TAGS: [], ALLOWED_ATTR: [] }` **before** being stored in state or
rendered to the DOM.  This strips all HTML/SVG/MathML markup and attributes.

**Policy**: `innerHTML` and `dangerouslySetInnerHTML` are **banned** from the
codebase.  All dynamic content is rendered via React's safe text interpolation
(`{value}`).

Relevant files:
- `src/utils/parsers.ts` – `sanitise()` helper applied to every extracted field

---

## 3. XML Bomb / Billion-Laughs Defence

Two layers of protection prevent a malicious GPX from freezing the browser tab:

1. **File-size gate** (`src/utils/fileValidator.ts`):  
   Files larger than **5 MB** are rejected *before* any content is read into
   memory (`File.size` check, no `FileReader` involved).

2. **Node-count circuit breaker** (`src/utils/parsers.ts`):  
   After `DOMParser.parseFromString()` returns, the total element count is
   checked against a limit of **200,000 nodes**.  If exceeded, parsing is
   aborted with a user-facing error.

---

## 4. Content Security Policy (CSP)

A `<meta http-equiv="Content-Security-Policy">` tag in `index.html` enforces:

```
default-src 'self';
script-src  'self';
style-src   'self' 'unsafe-inline';
img-src     'self' data: https://*.tile.openstreetmap.org;
connect-src 'self' https://*.tile.openstreetmap.org;
object-src  'none';
base-uri    'self';
```

**Rationale for `style-src 'unsafe-inline'`**: Leaflet injects inline styles at
runtime for map markers and overlays.  All other directives are as strict as
possible without breaking functionality.

**Note for production deployments**: Prefer a server-sent `Content-Security-Policy`
HTTP *response header* over the `<meta>` tag, as headers cannot be bypassed by
injecting content before the `<head>` element.

---

## 5. API Key Strategy (Static Site / GitHub Pages)

BlackBox currently uses **only OpenStreetMap tile URLs** – no API key is
required.  If you add a paid mapping or aviation-data API in the future, follow
this strategy:

### 5.1 HTTP Referrer Restrictions

Most API providers (Google Maps, Mapbox, AviationStack, etc.) allow you to
restrict a key so it only works when the HTTP `Referer` header matches an
allow-list:

1. Log in to the API provider's dashboard.
2. Navigate to **Credentials → API Key → Restrictions**.
3. Under **Application restrictions**, choose **HTTP referrers (websites)**.
4. Add your exact GitHub Pages origin, e.g.:
   ```
   https://<your-username>.github.io/*
   https://<your-username>.github.io/BlackBox/*
   ```
5. Save.  Requests from any other origin (including `localhost`) will be denied
   with a 403.

### 5.2 Never commit API keys

- Store keys in a `.env` file locally (already `.gitignore`'d).
- Reference them in code as `import.meta.env.VITE_MY_API_KEY`.
- Provide a `.env.example` file with placeholder values, committed to the repo:
  ```
  VITE_MY_API_KEY=your_api_key_here
  ```
- In your GitHub Actions workflow, inject secrets via GitHub Secrets
  (`Settings → Secrets → Actions`) and reference them as environment variables
  during the `vite build` step.

### 5.3 Update `connect-src` in CSP

When adding a new API endpoint, add its exact origin to the `connect-src`
directive in `index.html`, e.g.:

```
connect-src 'self' https://*.tile.openstreetmap.org https://api.aviationstack.com;
```

---

## 6. Dependency Audit

Run `npm audit` regularly to check for known vulnerabilities in dependencies.
The CI pipeline should fail builds that introduce high/critical severity issues.

---

## 7. Outstanding / Accepted Risks

| Item | Status |
|---|---|
| `style-src 'unsafe-inline'` required by Leaflet | Accepted – no known exploit path for style injection in this context |
| CSP via `<meta>` tag rather than HTTP header | Accepted for static-site deployment; upgrade to HTTP header if hosting on a configurable server |
