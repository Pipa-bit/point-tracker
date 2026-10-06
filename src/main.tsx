import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Registra el service worker (solo en la versión publicada): guarda la web para usarla sin conexión.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // Si ya había una versión guardada y se acaba de activar una nueva, se recarga la página una vez
  // para verla ya. Sin esto, la versión nueva solo aparecía al volver a abrir la web.
  // La carrera en curso no se pierde: está guardada en el dispositivo.
  const habiaVersion = navigator.serviceWorker.controller !== null
  let recargada = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!habiaVersion || recargada) return
    recargada = true
    window.location.reload()
  })
  navigator.serviceWorker.register('./sw.js').catch(() => {})
}
