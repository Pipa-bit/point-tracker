// Botón de un dorsal en la rejilla: un toque normal anota el sprint y mantenerlo pulsado abre el menú de incidencias.

import { useRef, type ReactNode } from 'react'

/** Milisegundos que hay que mantener pulsado para que cuente como "toque largo". */
const DURACION_TOQUE_LARGO = 500

interface Props {
  className: string
  pulsado: boolean
  desactivado: boolean
  alTocar: () => void
  alMantener: () => void
  children: ReactNode
}

export function BotonDorsal({ className, pulsado, desactivado, alTocar, alMantener, children }: Props) {
  // useRef guarda un valor entre pintados sin volver a pintar al cambiarlo.
  const temporizador = useRef<number | null>(null)
  // Si el toque largo ya ha abierto el menú, el "click" que llega al soltar se ignora.
  const mantenido = useRef(false)

  function empezar() {
    mantenido.current = false
    temporizador.current = window.setTimeout(() => {
      mantenido.current = true
      alMantener()
    }, DURACION_TOQUE_LARGO)
  }

  function cancelar() {
    if (temporizador.current !== null) window.clearTimeout(temporizador.current)
    temporizador.current = null
  }

  return (
    <button
      className={className}
      aria-pressed={pulsado}
      disabled={desactivado}
      onPointerDown={empezar}
      onPointerUp={cancelar}
      onPointerLeave={cancelar}
      onPointerCancel={cancelar}
      onClick={() => {
        if (mantenido.current) mantenido.current = false
        else alTocar()
      }}
      // Clic derecho en ordenador, y algunos navegadores lo lanzan también con el toque largo.
      onContextMenu={(e) => {
        e.preventDefault()
        cancelar()
        if (!mantenido.current) {
          mantenido.current = true
          alMantener()
        }
      }}
    >
      {children}
    </button>
  )
}
