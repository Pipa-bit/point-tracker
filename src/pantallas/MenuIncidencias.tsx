// Menú que aparece al mantener pulsado un dorsal: doblado, abandono o descalificación.

import { useRef } from 'react'
import type { Dorsal, Suceso } from '../modelo/tipos'
import { TEXTOS } from '../textos'

const T = TEXTOS.incidencias

interface Props {
  dorsal: Dorsal
  alElegir: (suceso: Suceso) => void
  alCancelar: () => void
}

export function MenuIncidencias({ dorsal, alElegir, alCancelar }: Props) {
  // El menú se abre con el dedo aún apoyado, y al soltarlo el navegador manda un "click" al fondo.
  // Para no cerrarlo en ese momento, el fondo solo lo cierra si el toque también empezó en él.
  const empezoEnElFondo = useRef(false)

  return (
    // Tocar fuera del menú lo cierra sin anotar nada.
    <div
      className="menu-fondo"
      onPointerDown={(e) => (empezoEnElFondo.current = e.target === e.currentTarget)}
      onClick={(e) => {
        if (empezoEnElFondo.current && e.target === e.currentTarget) alCancelar()
      }}
    >
      <div className="menu" role="dialog" aria-modal="true" aria-label={T.titulo(dorsal)}>
        <h2>{T.titulo(dorsal)}</h2>
        <button onClick={() => alElegir({ tipo: 'doblado', dorsal, por: 'peloton' })}>
          {T.dobladoPeloton}
          <small>{T.dobladoPelotonDetalle}</small>
        </button>
        <button onClick={() => alElegir({ tipo: 'doblado', dorsal, por: 'escapada' })}>
          {T.dobladoEscapada}
          <small>{T.dobladoEscapadaDetalle}</small>
        </button>
        <button onClick={() => alElegir({ tipo: 'abandono', dorsal })}>{T.abandono}</button>
        <button onClick={() => alElegir({ tipo: 'descalificacion', dorsal })}>{T.descalificacion}</button>
        <button className="cancelar" onClick={alCancelar}>
          {T.cancelar}
        </button>
      </div>
    </div>
  )
}
