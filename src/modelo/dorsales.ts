// Lectura de la lista de dorsales que se escribe al crear una carrera.
// Acepta números sueltos y rangos separados por comas o espacios: "1-24, 30 31".

import type { Dorsal } from './tipos'

export interface ResultadoDorsales {
  /** Dorsales encontrados, sin repetir y ordenados de menor a mayor. */
  dorsales: Dorsal[]
  /** Trozos que no se han entendido, para avisar. */
  errores: string[]
}

/** Rango máximo que se acepta de una vez, para evitar errores como "1-1000". */
const MAXIMO_POR_RANGO = 200

export function leerDorsales(texto: string): ResultadoDorsales {
  const encontrados = new Set<Dorsal>()
  const errores: string[] = []

  // Separa por comas, puntos y coma o espacios, y descarta los trozos vacíos.
  const trozos = texto.split(/[,;\s]+/).filter((t) => t !== '')

  for (const trozo of trozos) {
    const rango = trozo.match(/^(\d+)-(\d+)$/)
    if (rango) {
      const desde = Number(rango[1])
      const hasta = Number(rango[2])
      if (desde > hasta) {
        errores.push(`"${trozo}": el rango va al revés.`)
      } else if (hasta - desde + 1 > MAXIMO_POR_RANGO) {
        errores.push(`"${trozo}": son demasiados dorsales de una vez.`)
      } else {
        for (let d = desde; d <= hasta; d++) encontrados.add(d)
      }
    } else if (/^\d+$/.test(trozo)) {
      encontrados.add(Number(trozo))
    } else {
      errores.push(`"${trozo}" no es un dorsal ni un rango.`)
    }
  }

  return { dorsales: [...encontrados].sort((a, b) => a - b), errores }
}
