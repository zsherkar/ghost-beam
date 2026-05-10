# Ghost Beam Deployment Guide

Ghost Beam supports two deployment modes:

1. **Full live app on Render**: FastAPI serves the React/Three.js frontend and all backend APIs from one web service.
2. **Static visual demo on GitHub Pages**: a read-only React build with embedded fixture data for UI review when the backend is unavailable.

The local development workflow remains unchanged:

- Frontend: `http://127.0.0.1:5173/`
- Backend: `http://127.0.0.1:8000/`
- Backend docs: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/health`

Ghost Beam remains local/synthetic by design. Deployment does not enable real hardware control, EPICS writes, live facility eLogs, paid APIs, public tunnels, external uploads, or automatic public dataset downloads.

## Full Render Deployment

Use Render for the complete backend-powered Ghost Beam experience.

The Docker image:

- builds the frontend with Vite
- installs the FastAPI/JAX backend dependencies
- copies the built frontend into the runtime image
- starts `uvicorn`
- serves the React app from `/`
- preserves API routes such as `/health`, `/docs`, `/experiment/*`, `/benchmark/*`, `/data-sources/*`, and `/public-data/*`

Expected URLs after deployment:

- App: `https://<render-service>.onrender.com/`
- Health: `https://<render-service>.onrender.com/health`
- API docs: `https://<render-service>.onrender.com/docs`
- Platform version: `https://<render-service>.onrender.com/platform/version`

### Render Dashboard Steps

1. Push the reviewed repository to GitHub.
2. In Render, choose **New -> Web Service**.
3. Select `zsherkar/ghost-beam`.
4. Choose **Docker** runtime.
5. Set the health check path to `/health`.
6. Keep the Dockerfile path as `./Dockerfile`.
7. Let Render use the start command from the Dockerfile.
8. After deploy, verify `/`, `/health`, `/docs`, `/platform/version`, and `/data-sources`.

If using the Blueprint:

1. In Render, choose **New -> Blueprint**.
2. Select this repository.
3. Review `render.yaml`.
4. Create the service.

The current `render.yaml` tracks `master` because this local checkout is on `master`. If the GitHub default branch is renamed to `main`, update `render.yaml` before deploying.

### Local Docker Validation

```powershell
cd "D:\Building\Ghost Beam"
docker build -t ghost-beam .
docker run --rm -p 8000:10000 ghost-beam
```

Then open:

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/platform/version`
- `http://127.0.0.1:8000/data-sources`

## Static GitHub Pages Deployment

Use GitHub Pages for a persistent visual/read-only demo.

Target URL:

`https://zsherkar.github.io/ghost-beam/`

This build uses `VITE_STATIC_DEMO_MODE=true` and embedded fixtures. It preserves the Ghost Beam UI, guided Drifted Twin story, Decision Record/Diagnosis previews, benchmark summary, evidence bundle preview, recorded fixture status, and data-source registry panels without needing FastAPI/JAX at runtime.

Static mode is intentionally not the full app. It cannot run backend JAX evaluation, persist backend artifacts, or expose FastAPI docs.

### GitHub Pages Settings

1. Push the reviewed repository to GitHub.
2. Open repository **Settings -> Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to `master` or `main`.
5. The workflow `.github/workflows/deploy-pages.yml` builds `frontend/dist` with:

```powershell
npm run build:pages
```

### Local Static Build

```powershell
cd "D:\Building\Ghost Beam\frontend"
npm run build:pages
npm run preview -- --host 127.0.0.1 --port 4173
```

For the Pages base path, open:

`http://127.0.0.1:4173/ghost-beam/`

Confirm the static banner appears:

`Static GitHub Pages demo: visual/read-only mode with embedded fixtures. Use Render for the full backend-powered app.`

## Environment Variables

Backend:

- `PORT`: Render-provided port. Docker defaults to `10000`.
- `GHOSTBEAM_DEPLOYMENT`: deployment label such as `render`.
- `GHOSTBEAM_FRONTEND_DIST`: absolute path to built frontend files.
- `GHOSTBEAM_ARTIFACT_DIR`: directory for generated reports, benchmark files, and evidence bundles.
- `GHOSTBEAM_CORS_ORIGINS`: comma-separated local development origins if needed.
- `GHOSTBEAM_REAL_HARDWARE_WRITES`: must remain `false`.

Frontend:

- `VITE_API_BASE_URL`: explicit API base URL. Leave unset for same-origin production.
- `VITE_STATIC_DEMO_MODE`: set to `true` for GitHub Pages fixture mode.
- `VITE_DEPLOY_TARGET`: set to `pages` for GitHub Pages base path `/ghost-beam/`.

## Artifact Persistence

Render free/starter-style deployments have ephemeral container storage unless a persistent disk is configured. Ghost Beam writes generated reports, benchmark files, and evidence bundles to `GHOSTBEAM_ARTIFACT_DIR`, which defaults to `/tmp/ghostbeam-artifacts` in Docker.

For the demo, generated files can be downloaded during a live session. They may not persist after redeploys, restarts, or spin-downs unless persistent storage is added.

## Safety and Scope

Deployment does not change the Ghost Beam safety model:

- no real accelerator hardware
- no EPICS writes
- no live facility eLogs
- no live camera feeds
- no public data auto-downloads
- no paid APIs
- no external uploads
- no public tunnels required
- public data adapters are read-only/local-slice only

## Troubleshooting

### Blank Page on Render

1. Check `/health`.
2. Check `/docs`.
3. Confirm the Docker build completed the frontend step.
4. Confirm `GHOSTBEAM_FRONTEND_DIST=/app/frontend/dist`.
5. Check browser network errors for missing `/assets/*` files.

### Render Health Check Fails

1. Confirm the service is using Docker runtime.
2. Confirm the health path is `/health`.
3. Confirm the container binds to `0.0.0.0` and uses `${PORT:-10000}`.
4. Check Render logs for Python dependency install failures.

### GitHub Pages Assets 404

1. Confirm the workflow ran `npm run build:pages`.
2. Confirm `VITE_DEPLOY_TARGET=pages`.
3. Confirm Vite built with base `/ghost-beam/`.
4. Open `https://zsherkar.github.io/ghost-beam/`, not the domain root.

### Static Mode Calls Backend

1. Confirm `VITE_STATIC_DEMO_MODE=true` during build.
2. Confirm the static banner appears.
3. Re-run `npm run build:pages`.

### Local Dev Backend Unreachable

Start backend:

```powershell
cd "D:\Building\Ghost Beam\backend"
$env:PYTHONPATH="D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend"
python -m uvicorn ghostbeam.api.main:app --reload --host 127.0.0.1 --port 8000
```

Start frontend:

```powershell
cd "D:\Building\Ghost Beam\frontend"
npm run dev -- --host 127.0.0.1 --port 5173
```
