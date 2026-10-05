// Calendario de sprints: en qué vueltas se puntúa, calculado a partir de la configuración.
//
// Las vueltas se cuentan hacia atrás, como el cuentavueltas. El sprint "a falta de N"
// se puntúa al cruzar meta cuando el cuentavueltas pasa a marcar N (la campana suena
// en N + 1). El sprint final es siempre "a falta de 0".

import type { ConfiguracionCarrera } from './tipos'

/** Un sprint previsto en el calendario. */
export interface SprintPrevisto {
  /** Vueltas que faltan cuando se puntúa (0 = sprint final). */
  aFalta: number
  esFinal: boolean
  /** Puntos de cada puesto, del primero al último que puntúa. */
  puntos: number[]
}

/**
 * Comprueba que la configuración tiene sentido.
 * Devuelve la lista de errores en texto para mostrarlos tal cual; vacía si todo está bien.
 */
export function validarConfiguracion(config: ConfiguracionCarrera): string[] {
  const errores: string[] = []
  const { vueltasTotales, primerSprintAFalta, frecuencia } = config

  if (!Number.isInteger(vueltasTotales) || vueltasTotales < 1) {
    errores.push('Las vueltas totales deben ser un número entero mayor que 0.')
  }
  if (!Number.isInteger(primerSprintAFalta) || primerSprintAFalta < 0) {
    errores.push('El primer sprint debe ser un número entero de vueltas (0 o más).')
  } else if (primerSprintAFalta >= vueltasTotales) {
    errores.push('El primer sprint tiene que ser a falta de menos vueltas que las totales.')
  }
  // Con una sí y una no, la cuenta tiene que cuadrar para acabar justo en el sprint final.
  if (frecuencia === 2 && primerSprintAFalta % 2 !== 0) {
    errores.push('Con sprint una vuelta sí y una no, el primer sprint debe ser a falta de un número par de vueltas.')
  }
  if (config.puntosIntermedio.length === 0 || config.puntosFinal.length === 0) {
    errores.push('Tienen que puntuar al menos un patinador por sprint.')
  }

  return errores
}

/**
 * Lista de sprints de la carrera en orden, del primero al final.
 * Ejemplo: primer sprint a falta de 6, una sí y una no → a falta de 6, 4, 2 y 0 (final).
 * Lanza un error si la configuración no es válida, para no calcular nada con datos incorrectos.
 */
export function calendarioSprints(config: ConfiguracionCarrera): SprintPrevisto[] {
  const errores = validarConfiguracion(config)
  if (errores.length > 0) {
    throw new Error(errores.join(' '))
  }

  const sprints: SprintPrevisto[] = []
  for (let aFalta = config.primerSprintAFalta; aFalta >= 0; aFalta -= config.frecuencia) {
    const esFinal = aFalta === 0
    sprints.push({
      aFalta,
      esFinal,
      puntos: esFinal ? config.puntosFinal : config.puntosIntermedio,
    })
  }
  return sprints
}
