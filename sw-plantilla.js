// Service worker: guarda la web en el dispositivo para que funcione sin conexión.
// Este archivo es una plantilla: al compilar, vite.config.ts rellena la versión y la lista de archivos.

const CACHE = 'point-tracker-__VERSION__'
const ARCHIVOS = __ARCHIVOS__

// Al instalarse, descarga y guarda todos los archivos de la web.
self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ARCHIVOS)))
  self.skipWaiting()
})

// Al activarse una versión nueva, borra las copias de versiones anteriores.
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request
  if (peticion.method !== 'GET' || new URL(peticion.url).origin !== self.location.origin) return

  if (peticion.mode === 'navigate') {
    // La página: primero se intenta la red (para recibir actualizaciones) y, sin conexión, la copia guardada.
    evento.respondWith(fetch(peticion).catch(() => caches.match('./index.html', { ignoreSearch: true })))
    return
  }
  // El resto (código, estilos, iconos): la copia guardada, y si no la hay, la red.
  evento.respondWith(caches.match(peticion).then((guardada) => guardada ?? fetch(peticion)))
})
