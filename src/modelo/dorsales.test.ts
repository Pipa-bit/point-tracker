import { describe, expect, it } from 'vitest'
import { leerDorsales } from './dorsales'

describe('leerDorsales', () => {
  it('entiende rangos y números sueltos', () => {
    expect(leerDorsales('1-5, 10 12').dorsales).toEqual([1, 2, 3, 4, 5, 10, 12])
  })

  it('quita repetidos y ordena', () => {
    expect(leerDorsales('7, 3, 3-5').dorsales).toEqual([3, 4, 5, 7])
  })

  it('un texto vacío no da dorsales ni errores', () => {
    expect(leerDorsales('  ')).toEqual({ dorsales: [], errores: [] })
  })

  it('avisa de lo que no entiende pero conserva lo demás', () => {
    const { dorsales, errores } = leerDorsales('1-3, abc, 9-7, 1-500')
    expect(dorsales).toEqual([1, 2, 3])
    expect(errores).toHaveLength(3)
  })
})
