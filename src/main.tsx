import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { App } from './App'
import { enableMocking } from './mocks/dataMode'

// MSW indítás/kihagyás döntése — WORLDS-PRODUCTION-API-GATE: `VITE_DATA_MODE=api`
// esetén a globális MSW worker EGYÁLTALÁN nem indul (a döntési logika és az
// automatikus teszt: src/mocks/dataMode.ts + __tests__/dataMode.test.ts).
enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
})
