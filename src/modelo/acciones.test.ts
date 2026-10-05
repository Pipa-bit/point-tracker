import { describe, expect, it } from 'vitest'
import { deshacerUltimo, registrarSiguienteSprint } from './acciones'
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
