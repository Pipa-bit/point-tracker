// Todos los sprints de la carrera en una fila, para la barra de arriba: los ya registrados con el dorsal
// que ganó, el siguiente en negro y el final en rojo. De un vistazo se ve en qué punto va la carrera.

import { calendarioSprints } from '../modelo/calendario'
import type { Carrera } from '../modelo/tipos'
import { TEXTOS } from '../textos'

const T = TEXTOS.carrera

/** Cuántos sprints caben en la barra. Si hay más, se ven los últimos ya hechos y los siguientes. */
const MAXIMO_VISIBLES = 15
/** Sprints ya hechos que se siguen viendo a la izquierda del actual. */
const HECHOS_VISIBLES = 3

interface Props {
  carrera: Carrera
  /** Vueltas que faltan en el sprint que toca registrar; null si ya están todos. */
  siguiente: number | null
}

export function LineaSprints({ carrera, siguiente }: Props) {
  const sprints = calendarioSprints(carrera.configuracion)
  // Ganador de cada sprint ya registrado (undefined si se dejó sin registrar).
  const ganadores = new Map(carrera.sucesos.flatMap((s) => (s.tipo === 'sprint' ? [[s.aFalta, s.llegada[0]] as const] : [])))

  // Con muchos sprints (una carrera larga con sprint en cada vuelta) no caben todos:
  // se enseña una ventana alrededor del actual, y el final siempre al fondo.
  const actual = sprints.findIndex((s) => s.aFalta === siguiente)
  const inicio = Math.max(0, Math.min((actual === -1 ? sprints.length : actual) - HECHOS_VISIBLES, sprints.length - MAXIMO_VISIBLES))
  const visibles = sprints.slice(inicio, inicio + MAXIMO_VISIBLES)
  const final = sprints.at(-1)
  if (final && !visibles.includes(final)) visibles[visibles.length - 1] = final

  return (
    <ol className="linea-sprints" aria-label={T.sprints}>
      {visibles.map((s) => {
        const hecho = ganadores.has(s.aFalta)
        const clase = s.aFalta === siguiente ? 'ahora' : hecho ? 'hecho' : s.esFinal ? 'final' : undefined
        return (
          <li key={s.aFalta} className={clase}>
            {s.esFinal ? T.final : s.aFalta}
            {clase === 'ahora' && <small>{T.ahora}</small>}
            {hecho && <small>{ganadores.get(s.aFalta) ?? '—'}</small>}
          </li>
        )
      })}
    </ol>
  )
}
