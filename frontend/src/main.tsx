import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import ErrorBoundary from './components/system/ErrorBoundary'
import './styles/globals.css'

const App = lazy(() => import('./App'))

const bootShellStyle: React.CSSProperties = {
  minHeight: '100vh',
  width: '100vw',
  display: 'grid',
  placeItems: 'center',
  padding: 24,
  color: '#dbe6ef',
  background: 'radial-gradient(circle at 30% 0%, rgba(100,244,162,.12), transparent 32%), #05070a',
  fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const bootCardStyle: React.CSSProperties = {
  width: 'min(760px, 100%)',
  display: 'grid',
  gap: 14,
  padding: 24,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,.14)',
  background: 'linear-gradient(180deg, rgba(22,30,40,.94), rgba(10,14,20,.9))',
  boxShadow: '0 24px 70px rgba(0,0,0,.45)',
}

const bootActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const bootButtonStyle: React.CSSProperties = {
  minHeight: 36,
  padding: '0 13px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,.16)',
  color: '#e7f0f6',
  background: 'rgba(255,255,255,.07)',
  cursor: 'pointer',
}

function clearLocalUiState() {
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith('ghost-beam'))
      .forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // The boot fallback must never throw while trying to recover.
  }
}

function openLocalUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

function BootDiagnostics({ error, reset }: { error?: Error, reset?: () => void }) {
  const frontendUrl = window.location.href
  const backendHealthUrl = 'http://127.0.0.1:8000/health'
  const backendDocsUrl = 'http://127.0.0.1:8000/docs'
  const hasError = Boolean(error)
  return (
    <main style={bootShellStyle}>
      <section style={bootCardStyle} role="alert" aria-live="assertive">
        <div>
          <p style={{ margin: '0 0 6px', color: '#64f4a2', fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            {hasError ? 'Ghost Beam boot recovery' : 'Ghost Beam startup'}
          </p>
          <h1 style={{ margin: 0, fontSize: 28 }}>{hasError ? 'Ghost Beam failed to boot' : 'Ghost Beam is starting'}</h1>
          <p style={{ margin: '8px 0 0', color: '#9dacb8', lineHeight: 1.45 }}>
            {hasError
              ? 'The control room hit a startup error before the full UI could render. The fallback shell is active, so the page is not blank.'
              : 'Loading the control room, 3D twin, and experiment runner. This can take a moment after a fresh local restart.'}
          </p>
        </div>
        <div style={{ display: 'grid', gap: 6, color: '#b9c7d1', fontSize: 13 }}>
          <span><strong style={{ color: '#e7f0f6' }}>Frontend loaded:</strong> yes</span>
          <span><strong style={{ color: '#e7f0f6' }}>Frontend URL:</strong> {frontendUrl}</span>
          <span><strong style={{ color: '#e7f0f6' }}>Backend health:</strong> {backendHealthUrl}</span>
          <span><strong style={{ color: '#e7f0f6' }}>API docs:</strong> {backendDocsUrl}</span>
          <span><strong style={{ color: '#e7f0f6' }}>3D chunk status:</strong> {hasError ? 'not loaded or failed before render' : 'loading'}</span>
          <span><strong style={{ color: '#e7f0f6' }}>Local UI state:</strong> can be cleared below</span>
          <span><strong style={{ color: '#e7f0f6' }}>Last error:</strong> {error?.message ?? 'none yet'}</span>
        </div>
        <div style={bootActionsStyle}>
          <button style={bootButtonStyle} type="button" onClick={() => window.location.reload()}>Reload</button>
          <button
            style={bootButtonStyle}
            type="button"
            onClick={() => {
              clearLocalUiState()
              window.location.reload()
            }}
          >
            Clear Local UI State
          </button>
          <button style={bootButtonStyle} type="button" onClick={() => openLocalUrl(backendHealthUrl)}>Open Backend Health</button>
          <button style={bootButtonStyle} type="button" onClick={() => openLocalUrl(backendDocsUrl)}>Open API Docs</button>
          {reset && <button style={bootButtonStyle} type="button" onClick={reset}>Retry UI</button>}
        </div>
        <p style={{ margin: 0, color: '#7f8f9c', fontSize: 12, lineHeight: 1.45 }}>
          Common fix: restart the backend on `127.0.0.1:8000` and frontend on `127.0.0.1:5173`, then reload.
        </p>
      </section>
    </main>
  )
}

const root = document.getElementById('root')
const rootHost = window as typeof window & {
  __ghostBeamRoot?: ReturnType<typeof ReactDOM.createRoot>
}

if (!root) {
  document.body.innerHTML = '<main style="min-height:100vh;display:grid;place-items:center;background:#05070a;color:#dbe6ef;font-family:system-ui,sans-serif"><section style="max-width:680px;padding:24px;border:1px solid rgba(255,255,255,.14);border-radius:16px;background:#101820"><h1>Ghost Beam failed to boot</h1><p>Root element #root was not found.</p></section></main>'
} else {
  try {
    const appRoot = rootHost.__ghostBeamRoot ?? ReactDOM.createRoot(root)
    rootHost.__ghostBeamRoot = appRoot
    appRoot.render(
      <React.StrictMode>
        <ErrorBoundary fallback={(error, reset) => <BootDiagnostics error={error} reset={reset} />}>
          <Suspense fallback={<BootDiagnostics />}>
            <App />
          </Suspense>
        </ErrorBoundary>
      </React.StrictMode>,
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown render error'
    root.innerHTML = `<main style="min-height:100vh;display:grid;place-items:center;background:#05070a;color:#dbe6ef;font-family:system-ui,sans-serif"><section style="max-width:760px;padding:24px;border:1px solid rgba(255,255,255,.14);border-radius:16px;background:#101820"><h1>Ghost Beam failed to boot</h1><p>${message}</p><button onclick="window.location.reload()" style="min-height:36px;padding:0 13px;border-radius:10px;border:1px solid rgba(255,255,255,.16);color:#e7f0f6;background:rgba(255,255,255,.07)">Reload</button></section></main>`
  }
}
