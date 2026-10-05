import { describe, expect, it } from 'vitest'
import { calcularClasificacion } from './clasificacion'
import { PUNTOS_POR_DEFECTO, type Dorsal, type Suceso } from './tipos'

/** Carrera de prueba con los dorsales 1 a 6 y los puntos de la RFEP. */
function carrera(sucesos: Suceso[], llegadaFinalCompleta?: Dorsal[]) {
  return {
    configuracion: { vueltasTotales: 10, primerSprintAFalta: 4, frecuencia: 2 as const, ...PUNTOS_POR_DEFECTO },
    participantes: [1, 2, 3, 4, 5, 6].map((dorsal) => ({ dorsal })),
    sucesos,
    llegadaFinalCompleta,
  }
}

const sprint = (aFalta: number, ...llegada: Dorsal[]): Suceso => ({ tipo: 'sprint', aFalta, llegada })

/** Atajo para comparar solo dorsal, puntos y puesto de cada fila. */
function resumen(sucesos: Suceso[], llegadaFinalCompleta?: Dorsal[]) {
  return calcularClasificacion(carrera(sucesos, llegadaFinalCompleta)).filas.map((f) => [f.dorsal, f.puntos, f.puesto])
}

describe('puntos', () => {
  it('suma 2 y 1 en los intermedios y 3, 2 y 1 en el final', () => {
    const filas = resumen([sprint(4, 1, 2), sprint(2, 1, 3), sprint(0, 2, 3, 4)])
    expect(filas.slice(0, 4)).toEqual([
      [2, 4, 1], // empata con el 1, pero el 2 cruzó primero en el final y el 1 no puntuó en él
      [1, 4, 2],
      [3, 3, 3],
      [4, 1, 4],
    ])
  })

  it('un sprint sin registrar no suma nada', () => {
    const filas = resumen([sprint(4), sprint(2, 5, 6)])
    expect(filas[0]).toEqual([5, 2, 1])
  })
})

describe('incidencias', () => {
  it('doblado por una escapada: pierde lo que llevaba pero puede volver a puntuar', () => {
    const { filas } = calcularClasificacion(
      carrera([sprint(4, 1, 2), { tipo: 'doblado', dorsal: 1, por: 'escapada' }, sprint(2, 1, 3)]),
    )
    const uno = filas.find((f) => f.dorsal === 1)!
    expect(uno.puntos).toBe(2) // los 2 del primer sprint se pierden; los 2 del segundo cuentan
    expect(uno.estado).toBe('en-carrera')
  })

  it('doblado por el pelotón: queda eliminado, sin puntos y al final sin puesto', () => {
    const { filas } = calcularClasificacion(carrera([sprint(4, 1, 2), { tipo: 'doblado', dorsal: 1, por: 'peloton' }]))
    expect(filas.at(-1)).toEqual({ dorsal: 1, nombre: undefined, puntos: 0, puesto: null, estado: 'eliminado' })
  })

  it('abandono y descalificación: pierden los puntos y no terminan', () => {
    const { filas } = calcularClasificacion(
      carrera([
        sprint(4, 1, 2),
        { tipo: 'abandono', dorsal: 1 },
        { tipo: 'descalificacion', dorsal: 2 },
      ]),
    )
    expect(filas.filter((f) => f.puesto === null).map((f) => [f.dorsal, f.puntos, f.estado])).toEqual([
      [1, 0, 'abandono'],
      [2, 0, 'descalificado'],
    ])
  })

  it('quien ya no está en carrera no puntúa en sprints posteriores, y se avisa', () => {
    const { filas, avisos } = calcularClasificacion(
      carrera([{ tipo: 'abandono', dorsal: 1 }, sprint(4, 1, 2)]),
    )
    expect(filas.find((f) => f.dorsal === 1)!.puntos).toBe(0)
    expect(filas.find((f) => f.dorsal === 2)!.puntos).toBe(1) // el 2 cruzó segundo: 1 punto
    expect(avisos).toHaveLength(1)
  })
})

describe('desempates', () => {
  it('a igualdad de puntos, gana quien llegó antes en la última vuelta', () => {
    // 1 y 2 empatan a 2 puntos y ninguno puntúa en el final; la llegada completa los separa.
    const sucesos = [sprint(4, 1), sprint(2, 2), sprint(0, 3)]
    expect(resumen(sucesos, [3, 2, 1]).slice(0, 3)).toEqual([
      [3, 3, 1],
      [2, 2, 2],
      [1, 2, 3],
    ])
  })

  it('si la llegada no los separa, comparten puesto y quedan como desempate pendiente', () => {
    const { filas, desempatesPendientes } = calcularClasificacion(carrera([sprint(4, 1), sprint(2, 2), sprint(0, 3)]))
    expect(filas.filter((f) => f.puntos === 2).map((f) => f.puesto)).toEqual([2, 2])
    expect(desempatesPendientes).toEqual([[1, 2]])
  })

  it('los empates a 0 puntos no se piden', () => {
    const { desempatesPendientes, filas } = calcularClasificacion(carrera([sprint(4, 1, 2)]))
    expect(desempatesPendientes).toEqual([]) // el 1 y el 2 tienen puntos distintos; el resto empata a 0
    expect(filas.filter((f) => f.puntos === 0).every((f) => f.puesto === 3)).toBe(true)
  })

  it('agrupa a tres empatados en un solo desempate', () => {
    const { desempatesPendientes } = calcularClasificacion(carrera([sprint(4, 1, 3), sprint(2, 2, 3), sprint(0, 4, 5, 6)]))
    expect(desempatesPendientes).toEqual([[1, 2, 3]])
  })
})

describe('datos incoherentes', () => {
  it('ignora dorsales no inscritos o repetidos y lo avisa', () => {
    const { filas, avisos } = calcularClasificacion(carrera([sprint(4, 99, 1), sprint(2, 3, 3)]))
    expect(filas.find((f) => f.dorsal === 1)!.puntos).toBe(1)
    expect(filas.find((f) => f.dorsal === 3)!.puntos).toBe(2)
    expect(avisos).toHaveLength(2)
  })
})
