// Cálculo de la clasificación a partir de la lista de sucesos.
//
// Recorre los sucesos en orden, como si se reviviera la carrera:
// - Cada sprint suma puntos a los primeros en cruzar.
// - Doblado por una escapada: pierde los puntos que llevaba, pero sigue y puede volver a puntuar.
//   Si la escapada dobla a todo el pelotón, eso les pasa a todos los que no van escapados.
// - Doblado por el pelotón, abandono o descalificación: pierde los puntos y no termina.
// Después ordena: más puntos primero y, a igualdad de puntos, quien llegó antes en la última vuelta.

import type { Carrera, Dorsal } from './tipos'

export type EstadoPatinador = 'en-carrera' | 'eliminado' | 'abandono' | 'descalificado'

export interface FilaClasificacion {
  dorsal: Dorsal
  nombre?: string
  puntos: number
  /** Puesto en la clasificación; null si no termina. Los empatados comparten puesto. */
  puesto: number | null
  estado: EstadoPatinador
}

export interface Clasificacion {
  /** Primero los que siguen en carrera, por puesto; al final los que no terminan. */
  filas: FilaClasificacion[]
  /**
   * Grupos de patinadores empatados a puntos (más de 0) que la llegada conocida no desempata.
   * Al terminar, la web pedirá el orden de llegada de cada grupo.
   */
  desempatesPendientes: Dorsal[][]
  /** Incoherencias encontradas en los datos (p. ej. un dorsal que no existe). No detienen el cálculo. */
  avisos: string[]
}

type DatosCarrera = Pick<Carrera, 'configuracion' | 'participantes' | 'sucesos' | 'llegadaFinalCompleta'>

export function calcularClasificacion(carrera: DatosCarrera): Clasificacion {
  const { configuracion, participantes, sucesos } = carrera
  const avisos: string[] = []

  // Estado de cada patinador mientras "revivimos" la carrera. Un Map es un diccionario dorsal → datos.
  const patinadores = new Map<Dorsal, { puntos: number; estado: EstadoPatinador }>()
  for (const p of participantes) {
    patinadores.set(p.dorsal, { puntos: 0, estado: 'en-carrera' })
  }

  // Orden de llegada de la última vuelta: lo que se anotó en el sprint final y, detrás, el orden completo si se pidió.
  const llegadaFinal: Dorsal[] = []

  for (const suceso of sucesos) {
    if (suceso.tipo === 'sprint') {
      const esFinal = suceso.aFalta === 0
      const puntos = esFinal ? configuracion.puntosFinal : configuracion.puntosIntermedio
      const vistos = new Set<Dorsal>()

      suceso.llegada.forEach((dorsal, posicion) => {
        const patinador = patinadores.get(dorsal)
        if (!patinador) {
          avisos.push(`Sprint a falta de ${suceso.aFalta}: el dorsal ${dorsal} no está inscrito.`)
          return
        }
        if (vistos.has(dorsal)) {
          avisos.push(`Sprint a falta de ${suceso.aFalta}: el dorsal ${dorsal} aparece dos veces.`)
          return
        }
        vistos.add(dorsal)
        if (patinador.estado !== 'en-carrera') {
          avisos.push(`Sprint a falta de ${suceso.aFalta}: el dorsal ${dorsal} ya no estaba en carrera.`)
          return
        }
        // `?? 0`: si cruza en un puesto que no puntúa, suma 0.
        patinador.puntos += puntos[posicion] ?? 0
        if (esFinal) llegadaFinal.push(dorsal)
      })
      continue
    }

    if (suceso.tipo === 'escapadaDoblaPeloton') {
      for (const dorsal of suceso.escapados) {
        if (!patinadores.has(dorsal)) avisos.push(`Escapada: el dorsal ${dorsal} no está inscrito.`)
      }
      for (const [dorsal, patinador] of patinadores) {
        if (patinador.estado === 'en-carrera' && !suceso.escapados.includes(dorsal)) patinador.puntos = 0
      }
      continue
    }

    // El resto de sucesos afectan a un único patinador.
    const patinador = patinadores.get(suceso.dorsal)
    if (!patinador) {
      avisos.push(`El dorsal ${suceso.dorsal} no está inscrito.`)
      continue
    }
    if (patinador.estado !== 'en-carrera') {
      avisos.push(`El dorsal ${suceso.dorsal} ya no estaba en carrera.`)
      continue
    }
    patinador.puntos = 0
    if (suceso.tipo === 'doblado') {
      if (suceso.por === 'peloton') patinador.estado = 'eliminado'
    } else if (suceso.tipo === 'abandono') {
      patinador.estado = 'abandono'
    } else {
      patinador.estado = 'descalificado'
    }
  }

  for (const dorsal of carrera.llegadaFinalCompleta ?? []) {
    if (!llegadaFinal.includes(dorsal)) llegadaFinal.push(dorsal)
  }

  const filas: FilaClasificacion[] = participantes.map((p) => {
    const { puntos, estado } = patinadores.get(p.dorsal)!
    return { dorsal: p.dorsal, nombre: p.nombre, puntos, puesto: null, estado }
  })
  const enCarrera = filas.filter((f) => f.estado === 'en-carrera')
  const noTerminan = filas.filter((f) => f.estado !== 'en-carrera').sort((a, b) => a.dorsal - b.dorsal)

  // Posición en la llegada final; Infinity si no se conoce (va detrás de los que sí se conocen).
  const posicionLlegada = (dorsal: Dorsal) => {
    const i = llegadaFinal.indexOf(dorsal)
    return i === -1 ? Infinity : i
  }
  // Negativo si `a` va delante, positivo si va detrás, 0 si no se pueden separar (empate).
  const comparar = (a: FilaClasificacion, b: FilaClasificacion) => {
    if (a.puntos !== b.puntos) return b.puntos - a.puntos
    const pa = posicionLlegada(a.dorsal)
    const pb = posicionLlegada(b.dorsal)
    if (pa === pb) return 0 // solo pasa si ninguno de los dos tiene llegada conocida
    return pa - pb
  }
  // A igualdad, por dorsal, para que la lista salga siempre en el mismo orden.
  enCarrera.sort((a, b) => comparar(a, b) || a.dorsal - b.dorsal)

  const desempatesPendientes: Dorsal[][] = []
  enCarrera.forEach((fila, i) => {
    const anterior = enCarrera[i - 1]
    if (anterior && comparar(anterior, fila) === 0) {
      fila.puesto = anterior.puesto
      if (fila.puntos > 0) {
        const grupo = desempatesPendientes.find((g) => g.includes(anterior.dorsal))
        if (grupo) grupo.push(fila.dorsal)
        else desempatesPendientes.push([anterior.dorsal, fila.dorsal])
      }
    } else {
      fila.puesto = i + 1
    }
  })

  return { filas: [...enCarrera, ...noTerminan], desempatesPendientes, avisos }
}
