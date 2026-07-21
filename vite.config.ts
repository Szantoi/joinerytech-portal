/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Heavy, independently-cacheable vendors get their own chunks so a
        // page-chunk change doesn't invalidate them (F1-C bundle hygiene).
        // Function form — Vite 8 (Rolldown) types no longer accept the object form.
        manualChunks(id: string) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'recharts'
          if (id.includes('node_modules/@dnd-kit/')) return 'dnd-kit'
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
    // STAB-FE-TEST-GATE worker/pool budget — dev machine baseline: 16 logical
    // CPUs, ~16GB RAM (measured via `os.cpus().length` / `os.totalmem()`).
    // Vitest 4 defaults maxWorkers to `cpuCount - 1` (here: 15) with pool
    // 'forks' (one OS process per worker, isolate: true). 15 concurrent forks
    // each bootstrapping Vite/jsdom caused severe CPU thrashing in practice —
    // a run that took 9s for 2 files in isolation did not finish in 10+
    // minutes for the full ~150-file suite at the default worker count.
    // Capping maxWorkers keeps peak RAM well under budget (observed ~1.5GB
    // for the heaviest single worker pre-fix; 4 workers × that ceiling is
    // ~6GB, leaving headroom for the OS/IDE on a 16GB box) while still
    // parallelizing enough that the suite doesn't degrade to serial.
    // Revisit this number if the dev-machine spec changes (see baseline
    // above) — it is a budget choice, not a Vitest default.
    pool: 'forks',
    maxWorkers: 4,
  },
})
