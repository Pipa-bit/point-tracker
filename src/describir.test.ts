import { describe, expect, it } from 'vitest'
import { describirSuceso } from './describir'

describe('describirSuceso', () => {
  it('describe sprints intermedios, el final y los sin registrar', () => {
    expect(describirSuceso({ tipo: 'sprint', aFalta: 4, llegada: [7, 3] })).toBe('Sprint a falta de 4 → 7, 3')
    expect(describirSuceso({ tipo: 'sprint', aFalta: 0, llegada: [1, 2, 3] })).toBe('Sprint final → 1, 2, 3')
    expect(describirSuceso({ tipo: 'sprint', aFalta: 2, llegada: [] })).toBe('Sprint a falta de 2 → sin registrar')
  })

  it('describe las incidencias', () => {
    expect(describirSuceso({ tipo: 'doblado', dorsal: 5, por: 'peloton' })).toBe('Dorsal 5 doblado por el pelotón')
    expect(describirSuceso({ tipo: 'doblado', dorsal: 5, por: 'escapada' })).toBe('Dorsal 5 doblado por una escapada')
    expect(describirSuceso({ tipo: 'abandono', dorsal: 9 })).toBe('Dorsal 9 abandona')
    expect(describirSuceso({ tipo: 'descalificacion', dorsal: 9 })).toBe('Dorsal 9 descalificado')
    expect(describirSuceso({ tipo: 'escapadaDoblaPeloton', escapados: [3, 7] })).toBe('La escapada (3, 7) dobla al pelotón')
  })
})
