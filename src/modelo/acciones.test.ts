import { describe, expect, it } from 'vitest'
import { calcularClasificacion } from './clasificacion'
import { borrarIncidencia, corregirSprint, deshacerUltimo, registrarSiguienteSprint, resolverDesempate } from './acciones'
import { PUNTOS_POR_DEFECTO, type Carrera } from './tipos'

function carreraVacia(): Carrera {
  return {
    id: 'prueba',
    nombre: 'Prueba',
    fecha: '2026-10-05',
    configuracion: { vueltasTotales: 10, primerSprintAFalta: 2, frecuencia: 2, ...PUNTOS_POR_DEFECTO },
    participantes: [1, 2, 3].map((dorsal) => ({ dorsal })),
    sucesos: [],
    estado: 'en-curso',
  }
}

describe('registrarSiguienteSprint', () => {
  it('anota el sprint que toca, en orden', () => {
    let carrera = registrarSiguienteSprint(carreraVacia(), [1, 2])
    carrera = registrarSiguienteSprint(carrera, [3, 2, 1])
    expect(carrera.sucesos).toEqual([
      { tipo: 'sprint', aFalta: 2, llegada: [1, 2] },
      { tipo: 'sprint', aFalta: 0, llegada: [3, 2, 1] },
    ])
  })

  it('no modifica la carrera original', () => {
    const original = carreraVacia()
    registrarSiguienteSprint(original, [1, 2])
    expect(original.sucesos).toEqual([])
  })

  it('cuando ya no quedan sprints no añade nada', () => {
    let carrera = registrarSiguienteSprint(carreraVacia(), [1, 2])
    carrera = registrarSiguienteSprint(carrera, [3, 2, 1])
    expect(registrarSiguienteSprint(carrera, [1, 2]).sucesos).toHaveLength(2)
  })
})

describe('deshacerUltimo', () => {
  it('quita el último suceso y el sprint vuelve a tocar', () => {
    const carrera = deshacerUltimo(registrarSiguienteSprint(carreraVacia(), [1, 2]))
    expect(carrera.sucesos).toEqual([])
    expect(registrarSiguienteSprint(carrera, [3, 1]).sucesos[0]).toEqual({ tipo: 'sprint', aFalta: 2, llegada: [3, 1] })
  })
})

describe('corregir el historial', () => {
  function conSucesos(): Carrera {
    return {
      ...carreraVacia(),
      sucesos: [
        { tipo: 'sprint', aFalta: 2, llegada: [1, 2] },
        { tipo: 'abandono', dorsal: 3 },
        { tipo: 'sprint', aFalta: 0, llegada: [2, 1] },
      ],
    }
  }

  it('corregirSprint cambia solo la llegada de ese sprint', () => {
    const corregida = corregirSprint(conSucesos(), 0, [2, 3])
    expect(corregida.sucesos[0]).toEqual({ tipo: 'sprint', aFalta: 2, llegada: [2, 3] })
    expect(corregida.sucesos.slice(1)).toEqual(conSucesos().sucesos.slice(1))
  })

  it('corregirSprint no toca nada si en esa posición no hay un sprint', () => {
    const carrera = conSucesos()
    expect(corregirSprint(carrera, 1, [1])).toBe(carrera)
    expect(corregirSprint(carrera, 9, [1])).toBe(carrera)
  })

  it('borrarIncidencia quita una incidencia del medio, pero nunca un sprint', () => {
    const carrera = conSucesos()
    expect(borrarIncidencia(carrera, 1).sucesos).toEqual([carrera.sucesos[0], carrera.sucesos[2]])
    expect(borrarIncidencia(carrera, 0)).toBe(carrera)
  })
})

describe('resolverDesempate', () => {
  // 1 y 2 empatan a 3 puntos y ninguno cruza entre los tres primeros del final: la web no sabe quién va delante.
  function conEmpate(): Carrera {
    return {
      ...carreraVacia(),
      configuracion: { ...carreraVacia().configuracion, primerSprintAFalta: 4 },
      participantes: [1, 2, 3, 4, 5].map((dorsal) => ({ dorsal })),
      sucesos: [
        { tipo: 'sprint', aFalta: 4, llegada: [1, 2] },
        { tipo: 'sprint', aFalta: 2, llegada: [2, 1] },
        { tipo: 'sprint', aFalta: 0, llegada: [3, 4, 5] },
      ],
    }
  }

  it('con el orden de llegada el empate queda resuelto', () => {
    expect(calcularClasificacion(conEmpate()).desempatesPendientes).toEqual([[1, 2]])
    const resuelta = resolverDesempate(conEmpate(), [2, 1])
    const { filas, desempatesPendientes } = calcularClasificacion(resuelta)
    expect(desempatesPendientes).toEqual([])
    expect(filas.slice(0, 3).map((f) => [f.dorsal, f.puesto])).toEqual([
      [3, 1], // también tiene 3 puntos, pero puntuó en el final y va delante
      [2, 2],
      [1, 3],
    ])
  })

  it('no repite dorsales que ya estaban en la llegada', () => {
    const una = resolverDesempate(conEmpate(), [2, 1])
    expect(resolverDesempate(una, [1, 2]).llegadaFinalCompleta).toEqual([2, 1])
  })
})
