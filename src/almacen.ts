// Guardado de la carrera en curso en el propio dispositivo (localStorage del navegador).
//
// Se guarda tras cada cambio, así que si se cierra la web o se queda sin batería,
// al volver a abrirla la carrera sigue donde estaba. Nunca lanza errores: si el
// almacenamiento no está disponible (p. ej. navegación privada), la web sigue funcionando sin guardar.

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
