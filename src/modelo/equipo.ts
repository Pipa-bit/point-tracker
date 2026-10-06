// Juegos de dorsales del equipo: los nombres de "nuestros" patinadores con el dorsal que llevan
// en un tipo de competición (p. ej. "Liga Nacional 2026"; el dorsal es el mismo toda la temporada).
//
// Se escriben como texto, un patinador por línea: "12 Adrián" (también vale "12 - Adrián" o "12: Adrián").

import type { Dorsal, Participante } from './tipos'

/** Un patinador del equipo: dorsal y nombre. */
export type MiembroEquipo = Required<Pick<Participante, 'dorsal' | 'nombre'>>

export interface JuegoDorsales {
  id: string
  /** Tipo de competición y temporada, p. ej. "Liga Nacional 2026". */
  nombre: string
  /** Patinadores del equipo, todos con nombre. */
  miembros: MiembroEquipo[]
}

export interface ResultadoEquipo {
  miembros: MiembroEquipo[]
  errores: string[]
}

export function leerEquipo(texto: string): ResultadoEquipo {
  const miembros: MiembroEquipo[] = []
  const errores: string[] = []
  texto.split('\n').forEach((linea, i) => {
    const limpia = linea.trim()
    if (limpia === '') return
    // Un número, un espacio, guion o dos puntos, y el resto es el nombre.
    const partes = /^(\d+)(?:\s*[-:]\s*|\s+)(.+)$/.exec(limpia)
    if (!partes) {
      errores.push(`Línea ${i + 1}: «${limpia}» debe ser un dorsal y un nombre, por ejemplo «12 Adrián».`)
      return
    }
    const dorsal = Number(partes[1])
    if (miembros.some((m) => m.dorsal === dorsal)) {
      errores.push(`Línea ${i + 1}: el dorsal ${dorsal} está repetido.`)
      return
    }
    miembros.push({ dorsal, nombre: partes[2].trim() })
  })
  miembros.sort((a, b) => a.dorsal - b.dorsal)
  return { miembros, errores }
}

/** Lo contrario de `leerEquipo`, para poder editar un juego ya guardado. */
export function textoEquipo(miembros: MiembroEquipo[]): string {
  return miembros.map((m) => `${m.dorsal} ${m.nombre}`).join('\n')
}

/**
 * Participantes de una carrera: los dorsales escritos más los del equipo (aunque no se hayan escrito),
 * con el nombre puesto a los del equipo.
 */
export function participantesConEquipo(dorsales: Dorsal[], juego: JuegoDorsales | null): Participante[] {
  const nombres = new Map((juego?.miembros ?? []).map((m) => [m.dorsal, m.nombre]))
  const todos = [...new Set([...dorsales, ...nombres.keys()])].sort((a, b) => a - b)
  return todos.map((dorsal) => (nombres.has(dorsal) ? { dorsal, nombre: nombres.get(dorsal)! } : { dorsal }))
}
