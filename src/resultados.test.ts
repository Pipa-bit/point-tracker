import { describe, expect, it } from 'vitest'
import { PUNTOS_POR_DEFECTO, type Carrera } from './modelo/tipos'
import { fechaLegible, textoResultados } from './resultados'

const carrera: Carrera = {
  id: 'r',
  nombre: 'Liga Nacional, jornada 3',
  fecha: '2026-10-05',
  configuracion: { vueltasTotales: 10, primerSprintAFalta: 2, frecuencia: 2, ...PUNTOS_POR_DEFECTO },
  participantes: [{ dorsal: 1 }, { dorsal: 2, nombre: 'Adrián' }, { dorsal: 3 }, { dorsal: 4 }, { dorsal: 5 }, { dorsal: 6 }],
  sucesos: [
    { tipo: 'sprint', aFalta: 2, llegada: [2, 1] },
    { tipo: 'abandono', dorsal: 6 },
    { tipo: 'doblado', dorsal: 5, por: 'peloton' },
    { tipo: 'sprint', aFalta: 0, llegada: [2, 3, 1] },
  ],
  estado: 'terminada',
}

describe('textoResultados', () => {
  it('lista a los que puntúan, cuenta los que no y nombra a los que no terminan', () => {
    expect(textoResultados(carrera)).toBe(
      [
        '🏁 Liga Nacional, jornada 3 (05/10/2026)',
        '1.º 2 Adrián: 5 pt',
        '2.º 3: 2 pt', // empata con el 1, pero cruzó antes en el final
        '3.º 1: 2 pt',
        '1 patinador sin puntos',
        'No terminan: 5 (eliminado), 6 (abandono)',
      ].join('\n'),
    )
  })

  it('fechaLegible pasa de ISO a día/mes/año', () => {
    expect(fechaLegible('2026-03-09')).toBe('09/03/2026')
  })
})
