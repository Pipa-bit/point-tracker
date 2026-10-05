// Cuentas en directo: qué sprint toca, cuántos puntos quedan en juego y quién puede alcanzar al líder.
//
// El máximo que puede sumar un patinador es ganar todos los sprints que quedan.
// Alguien "puede alcanzar" al líder si con ese máximo llega a sus puntos actuales:
// el empate cuenta, porque se decide en la llegada de la última vuelta.

import { calendarioSprints, type SprintPrevisto } from './calendario'
import { calcularClasificacion, type Clasificacion } from './clasificacion'
import type { Carrera, Dorsal } from './tipos'

export interface CuentasPatinador {
  dorsal: Dorsal
  /** Puntos actuales más todos los que quedan en juego. */
  maximoAlcanzable: number
  /** Puntos que le separan del líder (0 si es el líder o va empatado con él). */
  puntosHastaLider: number
  /** Si ganando todo lo que queda llegaría al menos a los puntos actuales del líder. */
  puedeAlcanzarLider: boolean
}

export interface CuentasEnDirecto {
  clasificacion: Clasificacion
  /** Próximo sprint por registrar; null si ya están todos. */
  siguienteSprint: SprintPrevisto | null
  /** Sprints que quedan por registrar (incluido el final). */
  sprintsRestantes: number
  /** Máximo que puede sumar todavía un solo patinador. */
  puntosEnJuego: number
  /** Dorsal del líder; null si no hay nadie en carrera con puntos. */
  lider: Dorsal | null
  /** Nadie puede alcanzarle salvo que le doblen o le descalifiquen. */
  liderAsegurado: boolean
  /** Cuentas de cada patinador que sigue en carrera. */
  porPatinador: CuentasPatinador[]
}

type DatosCarrera = Pick<Carrera, 'configuracion' | 'participantes' | 'sucesos' | 'llegadaFinalCompleta'>

export function calcularCuentas(carrera: DatosCarrera): CuentasEnDirecto {
  const clasificacion = calcularClasificacion(carrera)

  // Un sprint cuenta como hecho en cuanto se registra, aunque sea "sin registrar" (llegada vacía).
  const registrados = new Set(carrera.sucesos.flatMap((s) => (s.tipo === 'sprint' ? [s.aFalta] : [])))
  const pendientes = calendarioSprints(carrera.configuracion).filter((s) => !registrados.has(s.aFalta))
  const puntosEnJuego = pendientes.reduce((total, s) => total + s.puntos[0], 0)

  const enCarrera = clasificacion.filas.filter((f) => f.estado === 'en-carrera')
  const primero = enCarrera[0]
  const lider = primero && primero.puntos > 0 ? primero : null

  const porPatinador = enCarrera.map((f) => {
    const maximoAlcanzable = f.puntos + puntosEnJuego
    return {
      dorsal: f.dorsal,
      maximoAlcanzable,
      puntosHastaLider: lider ? lider.puntos - f.puntos : 0,
      puedeAlcanzarLider: lider ? maximoAlcanzable >= lider.puntos : true,
    }
  })

  const liderAsegurado =
    lider !== null && porPatinador.every((c) => c.dorsal === lider.dorsal || !c.puedeAlcanzarLider)

  return {
    clasificacion,
    siguienteSprint: pendientes[0] ?? null,
    sprintsRestantes: pendientes.length,
    puntosEnJuego,
    lider: lider?.dorsal ?? null,
    liderAsegurado,
    porPatinador,
  }
}
