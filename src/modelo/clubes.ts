// Catálogo de clubes de la liga con sus colores. Cada club tiene el mismo color en todas las divisiones.
// El principal es el fondo y el borde del botón del dorsal; el secundario, la raya de la izquierda.

export interface Club {
  nombre: string
  /** Color principal en hexadecimal, p. ej. "#0e5f2c". */
  color: string
  secundario?: string
}

/** Nuestro club: sus patinadores salen siempre en la clasificación aunque tengan 0 puntos. */
export const NUESTRO_CLUB = 'SJN'

export const CLUBES: Record<string, Club> = {
  SJN: { nombre: 'San Juan', color: '#0e5f2c' },
  CDT: { nombre: 'Ciudad del Turia', color: '#e0177d' },
  LGK: { nombre: 'Lagunak', color: '#1a1a1a', secundario: '#f2c200' },
  TXN: { nombre: 'Txantrea', color: '#13296b' },
  PRT: { nombre: 'CPV El Prat', color: '#1f63c6', secundario: '#e0177d' },
  ALM: { nombre: 'Almassora', color: '#c8102e', secundario: '#111111' },
  RVS: { nombre: 'CPV Rivas', color: '#a8d400', secundario: '#1a1a1a' },
  CDA: { nombre: 'CD Amaya', color: '#e3262b' },
  RBD: { nombre: 'SCD Rabadeira', color: '#4aa8e0', secundario: '#ffffff' },
  RLL: { nombre: 'CD Rolling Lemons', color: '#f2b600', secundario: '#1a1a1a' },
  ARG: { nombre: 'CMP Arganda', color: '#ffffff', secundario: '#7cc4ec' },
  SDP: { nombre: 'Sada Patín', color: '#1a1a1a', secundario: '#d7141a' },
  SIE: { nombre: 'CP Siero', color: '#3cc3d6', secundario: '#1b2a5a' },
  PLY: { nombre: 'Patín Pelayo', color: '#f2c200', secundario: '#1a1a1a' },
  PAI: { nombre: 'Paiporta', color: '#13296b', secundario: '#1a1a1a' },
  NVD: { nombre: 'Nuevo Oviedo', color: '#5bb8e8', secundario: '#f2c200' },
  NOV: { nombre: 'AD Novares', color: '#2a6fd6', secundario: '#ffffff' },
  MAR: { nombre: 'Marianistas', color: '#1b2a5a', secundario: '#2e9e48' },
  ALA: { nombre: 'AL-Andalus', color: '#1a1a1a', secundario: '#1f63c6' },
  GRX: { nombre: 'CP GRX', color: '#0f2350', secundario: '#f2c200' },
  PTO: { nombre: 'El Patín de Oro', color: '#ffffff', secundario: '#d7141a' },
  ASP: { nombre: 'Astur Patín', color: '#1f4fc4', secundario: '#d7141a' },
  '2M6': { nombre: 'Segi-2Mil6', color: '#f07a00', secundario: '#1a1a1a' },
}

/**
 * Club de un participante. Las carreras antiguas no guardaban el club, solo el nombre de los nuestros:
 * a esos se les da nuestro club.
 */
export function clubDe(p: { club?: string; nombre?: string }): string | undefined {
  return p.club ?? (p.nombre !== undefined ? NUESTRO_CLUB : undefined)
}

export function esNuestro(p: { club?: string; nombre?: string }): boolean {
  return clubDe(p) === NUESTRO_CLUB
}

/** Colores con los que se pinta un botón de dorsal (como variables CSS). */
export interface ColoresBoton {
  /** Fondo suave. */
  tinte: string
  borde: string
  /** Color del número. */
  numero: string
  /** Raya de la izquierda. */
  raya: string
}

const BLANCO = '#ffffff'

function canales(hex: string): number[] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
}

function aHex(canales: number[]): string {
  return '#' + canales.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')
}

/** Luminancia relativa (la de las normas de accesibilidad WCAG): 0 es negro y 1 es blanco. */
export function luminancia(hex: string): number {
  const [r, g, b] = canales(hex)
    .map((c) => c / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Mezcla el color con blanco: con `proporcion` 0.16 queda un 16 % de color. */
function aclarar(hex: string, proporcion: number): string {
  return aHex(canales(hex).map((c) => c * proporcion + 255 * (1 - proporcion)))
}

function oscurecer(hex: string, factor: number): string {
  return aHex(canales(hex).map((c) => c * factor))
}

/** Los colores claros (amarillo, celeste...) se oscurecen para que el número se lea al sol. */
const LUMINANCIA_CLARO = 0.25

export function coloresClub(codigo: string | undefined): ColoresBoton | null {
  const club = codigo === undefined ? undefined : CLUBES[codigo]
  if (!club) return null
  const { color, secundario } = club
  // Con el blanco de principal, el fondo es blanco y el resto toma el secundario.
  if (color === BLANCO) {
    const otro = secundario ?? '#8a93a6'
    const numero = luminancia(otro) > LUMINANCIA_CLARO ? oscurecer(otro, 0.45) : otro
    return { tinte: BLANCO, borde: otro, numero, raya: otro }
  }
  const claro = luminancia(color) > LUMINANCIA_CLARO
  return {
    tinte: aclarar(color, 0.16),
    borde: claro ? oscurecer(color, 0.8) : color,
    numero: claro ? oscurecer(color, 0.45) : color,
    // Una raya blanca no se vería sobre el fondo claro: entonces va del color principal.
    raya: secundario && secundario !== BLANCO ? secundario : color,
  }
}
