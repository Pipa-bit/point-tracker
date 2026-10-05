import { describe, expect, it } from 'vitest'
import { leerEquipo, participantesConEquipo, textoEquipo, type JuegoDorsales } from './equipo'

describe('leerEquipo', () => {
  it('lee un patinador por línea en varios formatos y los ordena por dorsal', () => {
    const { miembros, errores } = leerEquipo('12 Adrián Gómez\n\n 3 - Lucía\n7: Marcos ')
    expect(errores).toEqual([])
    expect(miembros).toEqual([
      { dorsal: 3, nombre: 'Lucía' },
      { dorsal: 7, nombre: 'Marcos' },
      { dorsal: 12, nombre: 'Adrián Gómez' },
    ])
  })

  it('avisa de líneas sin dorsal o sin nombre y de dorsales repetidos', () => {
    const { miembros, errores } = leerEquipo('Adrián\n12\n5 Ana\n5 Eva')
    expect(miembros).toEqual([{ dorsal: 5, nombre: 'Ana' }])
    expect(errores).toHaveLength(3)
  })

  it('textoEquipo devuelve un texto que se vuelve a leer igual', () => {
    const { miembros } = leerEquipo('12 Adrián\n3 Lucía')
    expect(leerEquipo(textoEquipo(miembros)).miembros).toEqual(miembros)
  })
})

describe('participantesConEquipo', () => {
  const juego: JuegoDorsales = { id: 'j', nombre: 'Liga 2026', miembros: [{ dorsal: 3, nombre: 'Lucía' }, { dorsal: 40, nombre: 'Adrián' }] }

  it('pone nombre a los del equipo y añade los que no se escribieron', () => {
    expect(participantesConEquipo([1, 2, 3], juego)).toEqual([{ dorsal: 1 }, { dorsal: 2 }, { dorsal: 3, nombre: 'Lucía' }, { dorsal: 40, nombre: 'Adrián' }])
  })

  it('sin juego, solo los dorsales escritos', () => {
    expect(participantesConEquipo([2, 1], null)).toEqual([{ dorsal: 1 }, { dorsal: 2 }])
  })
})
