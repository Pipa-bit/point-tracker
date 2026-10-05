// Acciones sobre una carrera. Nunca modifican la carrera que reciben:
// devuelven una copia nueva, que es lo que React necesita para saber que algo ha cambiado.

import { calcularCuentas } from './cuentas'
import type { Carrera, Dorsal, Suceso } from './tipos'

/** Añade un suceso al final de la lista. */
export function anadirSuceso(carrera: Carrera, suceso: Suceso): Carrera {
  return { ...carrera, sucesos: [...carrera.sucesos, suceso] }
}

/** Registra el sprint que toca con la llegada indicada (vacía = "sin registrar"). Si ya no quedan sprints, no hace nada. */
export function registrarSiguienteSprint(carrera: Carrera, llegada: Dorsal[]): Carrera {
  const { siguienteSprint } = calcularCuentas(carrera)
  if (siguienteSprint === null) return carrera
  return anadirSuceso(carrera, { tipo: 'sprint', aFalta: siguienteSprint.aFalta, llegada })
}

/** Quita el último suceso anotado. */
export function deshacerUltimo(carrera: Carrera): Carrera {
  return { ...carrera, sucesos: carrera.sucesos.slice(0, -1) }
}
