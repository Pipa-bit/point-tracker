// Modelo de datos de Point Tracker.
//
// Una carrera se guarda como su configuración más la lista ordenada de sucesos
// (sprints, doblajes, abandonos...). La clasificación NO se guarda: se calcula
// siempre desde cero a partir de esa lista. Así deshacer es quitar el último
// suceso y corregir es cambiar uno, sin "restar a mano".

/** Número de dorsal de un patinador. */
export type Dorsal = number

/** Reglas de una carrera concreta. Se rellenan a partir de la plantilla por defecto. */
export interface ConfiguracionCarrera {
  /** Vueltas totales de la carrera. */
  vueltasTotales: number
  /** Vuelta del primer sprint, contada hacia atrás como el cuentavueltas (p. ej. 20 = "a falta de 20"). */
  primerSprintAFalta: number
  /** 1 = sprint en todas las vueltas; 2 = una sí y una no. */
  frecuencia: 1 | 2
  /** Puntos de cada puesto en un sprint intermedio, del primero al último que puntúa. Ej.: [2, 1]. */
  puntosIntermedio: number[]
  /** Puntos de cada puesto en el sprint final. Ej.: [3, 2, 1]. */
  puntosFinal: number[]
}

/** Valores de la RFEP que se proponen al crear una carrera (las vueltas se indican en cada una). */
export const PUNTOS_POR_DEFECTO: Pick<ConfiguracionCarrera, 'puntosIntermedio' | 'puntosFinal'> = {
  puntosIntermedio: [2, 1],
  puntosFinal: [3, 2, 1],
}

/** Un patinador inscrito en la carrera. */
export interface Participante {
  dorsal: Dorsal
  /** Solo para los patinadores del equipo; el resto se identifica por el dorsal. */
  nombre?: string
}

/** Algo que ocurre durante la carrera, en el orden en que se anota. */
export type Suceso =
  /** Un sprint. `llegada` son los dorsales en orden de cruce; vacía si se dejó "sin registrar". */
  | { tipo: 'sprint'; aFalta: number; llegada: Dorsal[] }
  /** Doblado por el pelotón (queda eliminado) o por una escapada (sigue en carrera). En ambos casos pierde sus puntos. */
  | { tipo: 'doblado'; dorsal: Dorsal; por: 'peloton' | 'escapada' }
  /** Abandono o descalificación: pierde los puntos y no termina. */
  | { tipo: 'abandono' | 'descalificacion'; dorsal: Dorsal }

/** Una carrera completa tal y como se guarda en el dispositivo. */
export interface Carrera {
  id: string
  nombre: string
  /** Fecha en formato ISO, p. ej. "2026-10-05". */
  fecha: string
  configuracion: ConfiguracionCarrera
  participantes: Participante[]
  /** Lista ordenada de todo lo que ha pasado. Es la única fuente de verdad. */
  sucesos: Suceso[]
  /**
   * Orden de llegada de la última vuelta más allá de los que puntúan.
   * Opcional: solo se pide al terminar si hace falta para deshacer un empate.
   */
  llegadaFinalCompleta?: Dorsal[]
  estado: 'en-curso' | 'terminada'
}
