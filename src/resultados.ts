// Texto de los resultados para compartir por WhatsApp (o pegar donde sea).
//
// Ejemplo:
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

export function textoResultados(carrera: Carrera): string {
  const { filas } = calcularClasificacion(carrera)
  const enCarrera = filas.filter((f) => f.estado === 'en-carrera')
  const conPuntos = enCarrera.filter((f) => f.puntos > 0)
  const sinPuntos = enCarrera.length - conPuntos.length
  const noTerminan = filas.filter((f) => f.estado !== 'en-carrera')

  const lineas = [`🏁 ${carrera.nombre} (${fechaLegible(carrera.fecha)})`]
  for (const fila of conPuntos) {
    const quien = fila.nombre ? `${fila.dorsal} ${fila.nombre}` : `${fila.dorsal}`
    lineas.push(`${TEXTOS.carrera.puesto(fila.puesto!)} ${quien}: ${fila.puntos} ${T.puntos}`)
  }
  if (sinPuntos > 0) lineas.push(T.sinPuntos(sinPuntos))
  if (noTerminan.length > 0) {
    const estados: Record<string, string> = TEXTOS.clasificacion
    const lista = noTerminan.map((f) => `${f.nombre ?? f.dorsal} (${estados[f.estado]})`).join(', ')
    lineas.push(`${TEXTOS.clasificacion.noTerminan}: ${lista}`)
  }
  return lineas.join('\n')
}
