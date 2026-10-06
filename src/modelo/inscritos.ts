// Listas de inscritos: los participantes de una competición (dorsal, nombre y club), para elegirlas
// al crear la carrera en vez de escribir los dorsales.

import { LIGA_2026 } from './liga2026'
import type { Participante } from './tipos'

export interface ListaInscritos {
  id: string
  /** Lo que se ve en el selector, p. ej. "Liga Nacional 2026 · 1ª masculina". */
  nombre: string
  participantes: Required<Participante>[]
}

export const LISTAS_INSCRITOS: ListaInscritos[] = LIGA_2026
