import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { App } from './App'

// Enable MSW in development mode
async function enableMocking() {
  if (import.meta.env.MODE !== 'development') {
    return
  }

  // WORLDS-PRODUCTION-API-GATE kapu (modules/production/services/config.ts):
  // VITE_DATA_MODE=api esetén a globális MSW worker EGYÁLTALÁN nem indul —
  // a production modul (és minden más handler) a valós hosztokat hívja.
  // Dev-default (a flag hiányában) változatlanul `mock`.
  if (import.meta.env.VITE_DATA_MODE === 'api') {
    return
  }

  const { worker } = await import('./mocks/browser')

  return worker.start({
    onUnhandledRequest: 'bypass'
  })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
})
