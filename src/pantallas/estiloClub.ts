// Convierte los colores de un club en variables CSS para el atributo `style`.
// Las reglas de `.con-club` en index.css las usan para el fondo, el borde, el número y la raya.

import type { CSSProperties } from 'react'
import { coloresClub, luminancia } from '../modelo/clubes'

export function estiloClub(club: string | undefined): CSSProperties | undefined {
  const colores = coloresClub(club)
  if (!colores) return undefined
  // CSSProperties no conoce las variables propias (--algo), por eso se indica el tipo a mano.
  return {
    '--club-tinte': colores.tinte,
    '--club-borde': colores.borde,
    '--club-numero': colores.numero,
    '--club-raya': colores.raya,
    // Texto encima del color del borde (la cabecera de la columna): oscuro si el color es claro.
    '--sobre-club': luminancia(colores.borde) > 0.4 ? '#0b1020' : '#fff',
  } as CSSProperties
}
