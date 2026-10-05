// Resultados listos para compartir: como texto para WhatsApp, o como datos para dibujar la imagen.
//
// Ejemplo de texto:
//   🏁 Liga Nacional, jornada 3 (05/10/2026)
//   1.º 7 Adrián: 12 pt
//   2.º 3: 8 pt
//   ...
//   15 patinadores sin puntos
//   No terminan: 5 (abandono), 9 (eliminado)

import { calcularClasificacion } from './modelo/clasificacion'
import type { Carrera } from './modelo/tipos'
import { TEXTOS } from './textos'

const T = TEXTOS.final

/** "2026-10-05" → "05/10/2026" */
export function fechaLegible(fechaIso: string): string {
  const [anio, mes, dia] = fechaIso.split('-')
  return `${dia}/${mes}/${anio}`
}

export interface Resultados {
  titulo: string
  fecha: string
  /** Solo los que han puntuado, en orden. */
  filas: { puesto: string; quien: string; puntos: string }[]
  /** Líneas finales: cuántos no puntúan y quiénes no terminan. */
  pie: string[]
}

/** Lo que se comparte, una sola vez para el texto y para la imagen. */
export function resultados(carrera: Carrera): Resultados {
  const { filas } = calcularClasificacion(carrera)
  const enCarrera = filas.filter((f) => f.estado === 'en-carrera')
  const conPuntos = enCarrera.filter((f) => f.puntos > 0)
  const sinPuntos = enCarrera.length - conPuntos.length
  const noTerminan = filas.filter((f) => f.estado !== 'en-carrera')

  const pie: string[] = []
  if (sinPuntos > 0) pie.push(T.sinPuntos(sinPuntos))
  if (noTerminan.length > 0) {
    const estados: Record<string, string> = TEXTOS.clasificacion
    const lista = noTerminan.map((f) => `${f.nombre ?? f.dorsal} (${estados[f.estado]})`).join(', ')
    pie.push(`${TEXTOS.clasificacion.noTerminan}: ${lista}`)
  }

  return {
    titulo: carrera.nombre,
    fecha: fechaLegible(carrera.fecha),
    filas: conPuntos.map((f) => ({
      puesto: TEXTOS.carrera.puesto(f.puesto!),
      quien: f.nombre ? `${f.dorsal} ${f.nombre}` : `${f.dorsal}`,
      puntos: `${f.puntos} ${T.puntos}`,
    })),
    pie,
  }
}

export function textoResultados(carrera: Carrera): string {
  const r = resultados(carrera)
  return [`🏁 ${r.titulo} (${r.fecha})`, ...r.filas.map((f) => `${f.puesto} ${f.quien}: ${f.puntos}`), ...r.pie].join('\n')
}
