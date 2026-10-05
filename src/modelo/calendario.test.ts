import { describe, expect, it } from 'vitest'
import { calendarioSprints, validarConfiguracion } from './calendario'
import { PUNTOS_POR_DEFECTO, type ConfiguracionCarrera } from './tipos'

/** Crea una configuración con los puntos de la RFEP, cambiando solo lo que se indique. */
function config(cambios: Partial<ConfiguracionCarrera>): ConfiguracionCarrera {
  return { vueltasTotales: 30, primerSprintAFalta: 20, frecuencia: 2, ...PUNTOS_POR_DEFECTO, ...cambios }
}

describe('calendarioSprints', () => {
  it('con una sí y una no, va de dos en dos hasta el final', () => {
    const sprints = calendarioSprints(config({ primerSprintAFalta: 6, frecuencia: 2 }))
    expect(sprints.map((s) => s.aFalta)).toEqual([6, 4, 2, 0])
  })

  it('con sprint en todas las vueltas, va de una en una hasta el final', () => {
    const sprints = calendarioSprints(config({ primerSprintAFalta: 3, frecuencia: 1 }))
    expect(sprints.map((s) => s.aFalta)).toEqual([3, 2, 1, 0])
  })

  it('solo el último es el final y reparte 3, 2 y 1; los demás reparten 2 y 1', () => {
    const sprints = calendarioSprints(config({ primerSprintAFalta: 4, frecuencia: 2 }))
    expect(sprints.map((s) => s.esFinal)).toEqual([false, false, true])
    expect(sprints[0].puntos).toEqual([2, 1])
    expect(sprints[2].puntos).toEqual([3, 2, 1])
  })

  it('el ejemplo de 30 vueltas desde a falta de 20 tiene 11 sprints', () => {
    expect(calendarioSprints(config({})).length).toBe(11)
  })

  it('si solo hay sprint final, el calendario tiene un único sprint', () => {
    const sprints = calendarioSprints(config({ primerSprintAFalta: 0 }))
    expect(sprints).toEqual([{ aFalta: 0, esFinal: true, puntos: [3, 2, 1] }])
  })

  it('no calcula nada si la configuración es incorrecta', () => {
    expect(() => calendarioSprints(config({ primerSprintAFalta: 19, frecuencia: 2 }))).toThrow()
  })
})

describe('validarConfiguracion', () => {
  it('acepta una configuración correcta', () => {
    expect(validarConfiguracion(config({}))).toEqual([])
  })

  it('rechaza un primer sprint impar con una sí y una no', () => {
    expect(validarConfiguracion(config({ primerSprintAFalta: 19, frecuencia: 2 }))).toHaveLength(1)
  })

  it('rechaza un primer sprint a falta de tantas vueltas como las totales o más', () => {
    expect(validarConfiguracion(config({ vueltasTotales: 20, primerSprintAFalta: 20 }))).toHaveLength(1)
  })

  it('rechaza vueltas negativas o decimales', () => {
    expect(validarConfiguracion(config({ vueltasTotales: 0 }))).not.toEqual([])
    expect(validarConfiguracion(config({ primerSprintAFalta: 2.5, frecuencia: 1 }))).not.toEqual([])
  })

  it('rechaza un sprint en el que no puntúa nadie', () => {
    expect(validarConfiguracion(config({ puntosIntermedio: [] }))).toHaveLength(1)
  })
})
