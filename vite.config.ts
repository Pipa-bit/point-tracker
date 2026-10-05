import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'

/**
 * Genera `sw.js` (el service worker) al compilar, con la lista de todos los archivos de la web.
 * La versión cambia cuando cambia cualquier archivo, y así el iPad descarga la nueva al abrir la web con conexión.
 */
function serviceWorker(): Plugin {
  return {
    name: 'point-tracker-service-worker',
    apply: 'build',
    generateBundle(_opciones, bundle) {
      const publicos = ['favicon.svg', 'manifest.webmanifest', 'icono-192.png', 'icono-512.png', 'apple-touch-icon.png']
      const archivos = ['./', './index.html', ...Object.keys(bundle).map((f) => `./${f}`), ...publicos.map((f) => `./${f}`)]
      const version = createHash('sha256').update(Object.keys(bundle).sort().join()).digest('hex').slice(0, 10)
      const codigo = readFileSync('sw-plantilla.js', 'utf8')
        .replace('__VERSION__', version)
        .replace('__ARCHIVOS__', JSON.stringify([...new Set(archivos)], null, 2))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: codigo })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serviceWorker()],
  // Rutas relativas para que funcione en GitHub Pages (usuario.github.io/point-tracker/).
  base: './',
})
