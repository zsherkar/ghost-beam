import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/system/ErrorBoundary'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary fallback={(error, reset) => (
      <main className="app-shell app-error-shell">
        <section className="glass-card fatal-error-card">
          <h1>Ghost Beam</h1>
          <h2>Control room UI failed to render.</h2>
          <p>{error.message}</p>
          <button type="button" onClick={reset}>Retry UI</button>
        </section>
      </main>
    )}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
