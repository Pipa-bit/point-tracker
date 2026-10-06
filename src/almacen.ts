// Guardado de la carrera en curso en el propio dispositivo (localStorage del navegador).
//
// Se guarda tras cada cambio, así que si se cierra la web o se queda sin batería,
// al volver a abrirla la carrera sigue donde estaba. Nunca lanza errores: si el
// almacenamiento no está disponible (p. ej. navegación privada), la web sigue funcionando sin guardar.

import type { JuegoDorsales } from './modelo/equipo'
import type { Carrera } from './modelo/tipos'

const CLAVE = 'point-tracker:carrera-actual'

/** Lo mínimo de `Storage` que usamos. Recibirlo como parámetro permite probarlo en los tests. */
type Almacen = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** El almacenamiento del navegador, o null si no está disponible. */
function almacenPorDefecto(): Almacen | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function guardarCarreraActual(carrera: Carrera, almacen = almacenPorDefecto()): void {
  try {
    almacen?.setItem(CLAVE, JSON.stringify(carrera))
  } catch {
    // Sin espacio o sin permiso: no se puede hacer nada más.
  }
}

/** Devuelve la carrera guardada, o null si no hay ninguna o lo guardado no parece una carrera. */
export function cargarCarreraActual(almacen = almacenPorDefecto()): Carrera | null {
  try {
    const texto = almacen?.getItem(CLAVE)
    if (!texto) return null
    const datos = JSON.parse(texto)
    // Comprobación básica de la forma, por si se guardó con una versión antigua o se corrompió.
    if (typeof datos?.id !== 'string' || !Array.isArray(datos.sucesos) || !Array.isArray(datos.participantes)) {
      return null
    }
    return datos as Carrera
  } catch {
    return null
  }
}

export function borrarCarreraActual(almacen = almacenPorDefecto()): void {
  try {
    almacen?.removeItem(CLAVE)
  } catch {
    // Igual que al guardar.
  }
}

/**
 * Pide al navegador que no borre los datos de la web aunque falte espacio.
 * En iPad, junto con instalarla en la pantalla de inicio, evita que Safari los elimine.
 */
export function pedirAlmacenamientoPersistente(): void {
  navigator.storage?.persist?.().catch(() => {})
}

const CLAVE_JUEGOS = 'point-tracker:juegos-dorsales'

/** Juegos de dorsales del equipo guardados en el dispositivo (lista vacía si no hay o están dañados). */
export function cargarJuegos(almacen = almacenPorDefecto()): JuegoDorsales[] {
  try {
    const datos = JSON.parse(almacen?.getItem(CLAVE_JUEGOS) ?? '[]')
    return Array.isArray(datos) ? datos.filter((j) => typeof j?.id === 'string' && Array.isArray(j.miembros)) : []
  } catch {
    return []
  }
}

export function guardarJuegos(juegos: JuegoDorsales[], almacen = almacenPorDefecto()): void {
  try {
    almacen?.setItem(CLAVE_JUEGOS, JSON.stringify(juegos))
  } catch {
    // Igual que al guardar la carrera.
  }
}

const CLAVE_HISTORIAL = 'point-tracker:historial'

/** Carreras terminadas guardadas en el dispositivo, la más reciente primero. */
export function cargarHistorial(almacen = almacenPorDefecto()): Carrera[] {
  try {
    const datos = JSON.parse(almacen?.getItem(CLAVE_HISTORIAL) ?? '[]')
    return Array.isArray(datos) ? datos.filter((c) => typeof c?.id === 'string' && Array.isArray(c.sucesos)) : []
  } catch {
    return []
  }
}

function escribirHistorial(carreras: Carrera[], almacen: Almacen | null): void {
  try {
    almacen?.setItem(CLAVE_HISTORIAL, JSON.stringify(carreras))
  } catch {
    // Igual que al guardar la carrera.
  }
}

/** Guarda una carrera nueva al principio del historial. Si ya estaba (se ha corregido después), la sustituye en su sitio. */
export function guardarEnHistorial(carrera: Carrera, almacen = almacenPorDefecto()): void {
  const historial = cargarHistorial(almacen)
  const yaEstaba = historial.some((c) => c.id === carrera.id)
  escribirHistorial(yaEstaba ? historial.map((c) => (c.id === carrera.id ? carrera : c)) : [carrera, ...historial], almacen)
}

export function borrarDelHistorial(id: string, almacen = almacenPorDefecto()): void {
  escribirHistorial(
    cargarHistorial(almacen).filter((c) => c.id !== id),
    almacen,
  )
}

/** Cómo se ordena la rejilla de la carrera: una columna por club o todos por número de dorsal. */
export type VistaRejilla = 'equipos' | 'dorsal'

const CLAVE_VISTA = 'point-tracker:vista-rejilla'

/** La última vista elegida en este dispositivo; por equipos si no se ha elegido nunca. */
export function cargarVista(almacen = almacenPorDefecto()): VistaRejilla {
  try {
    return almacen?.getItem(CLAVE_VISTA) === 'dorsal' ? 'dorsal' : 'equipos'
  } catch {
    return 'equipos'
  }
}

export function guardarVista(vista: VistaRejilla, almacen = almacenPorDefecto()): void {
  try {
    almacen?.setItem(CLAVE_VISTA, vista)
  } catch {
    // Igual que al guardar la carrera.
  }
}
