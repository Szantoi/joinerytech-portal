import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * A `@spaceos/portal-ui` könyvtár-buildje (PORTALUI-PUBLISH).
 *
 * A csomag ma forrást exportál, ezért a portálon kívül nem fogyasztható. Ez a
 * build ad neki `dist`-et; a típusokat NEM ez állítja elő, hanem a
 * `tsconfig.build.json` (`tsc --emitDeclarationOnly`) — így nem kell új
 * plugin-függőség, és a `.d.ts` ugyanabból a fordítóból jön, ami a repót őrzi.
 *
 * A csomag NEM hoz saját CSS-t: a megjelenést Tailwind-osztálynevek adják, amik
 * a JS-be beégetett stringek. A fogyasztónak ezért a saját Tailwind-jével
 * végig kell néznie a csomagot — ez a README-ben ki van mondva, mert ez a
 * leggyakoribb „nálam nem néz ki jól" ok.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      // A peer-ek NEM kerülhetnek a bundle-be: két React-példány a fogyasztónál
      // néma hook-hibákat okoz, a `react-hot-toast` pedig saját providert visz.
      external: ['react', 'react-dom', 'react/jsx-runtime', 'clsx', 'react-hot-toast'],
    },
    sourcemap: true,
    emptyOutDir: true,
  },
})
