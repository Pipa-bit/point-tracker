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

/** Cambia la llegada de un sprint ya anotado (corregir un error). Si en esa posición no hay un sprint, no hace nada. */
export function corregirSprint(carrera: Carrera, indice: number, llegada: Dorsal[]): Carrera {
  const suceso = carrera.sucesos[indice]
  if (suceso?.tipo !== 'sprint') return carrera
  const sucesos = carrera.sucesos.with(indice, { ...suceso, llegada })
  return { ...carrera, sucesos }
}

/**
 * Borra una incidencia (doblado, abandono...) del historial, aunque no sea la última.
 * Los sprints no se borran, solo se corrigen: si se quitase uno, el calendario se descuadraría.
 */
export function borrarIncidencia(carrera: Carrera, indice: number): Carrera {
  const suceso = carrera.sucesos[indice]
  if (suceso === undefined || suceso.tipo === 'sprint') return carrera
  return { ...carrera, sucesos: carrera.sucesos.filter((_, i) => i !== indice) }
}
