import { describe, expect, it } from 'vitest'
import { calcularCuentas } from './cuentas'
import { PUNTOS_POR_DEFECTO, type Dorsal, type Suceso } from './tipos'

/** Carrera de prueba: sprints a falta de 6, 4, 2 y 0 (final); dorsales 1 a 4. */
function carrera(sucesos: Suceso[]) {
  return {
    configuracion: { vueltasTotales: 10, primerSprintAFalta: 6, frecuencia: 2 as const, ...PUNTOS_POR_DEFECTO },
    participantes: [1, 2, 3, 4].map((dorsal) => ({ dorsal })),
    sucesos,
  }
}

const sprint = (aFalta: number, ...llegada: Dorsal[]): Suceso => ({ tipo: 'sprint', aFalta, llegada })

describe('sprints pendientes', () => {
  it('al empezar quedan todos: 2 + 2 + 2 + 3 = 9 puntos en juego', () => {
    const cuentas = calcularCuentas(carrera([]))
    expect(cuentas.siguienteSprint?.aFalta).toBe(6)
    expect(cuentas.sprintsRestantes).toBe(4)
    expect(cuentas.puntosEnJuego).toBe(9)
    expect(cuentas.lider).toBeNull()
  })

  it('un sprint "sin registrar" cuenta como hecho y se pasa al siguiente', () => {
    const cuentas = calcularCuentas(carrera([sprint(6)]))
    expect(cuentas.siguienteSprint?.aFalta).toBe(4)
    expect(cuentas.puntosEnJuego).toBe(7)
  })

  it('al terminar no queda ningún sprint', () => {
    const cuentas = calcularCuentas(carrera([sprint(6, 1), sprint(4, 1), sprint(2, 1), sprint(0, 1)]))
    expect(cuentas.siguienteSprint).toBeNull()
    expect(cuentas.puntosEnJuego).toBe(0)
  })
})

describe('alcanzar al líder', () => {
  it('calcula cuánto le falta a cada uno y si todavía puede', () => {
    // Tras dos sprints: 1 = 4 puntos, 2 = 2 puntos. Quedan 2 + 3 = 5 en juego.
    const cuentas = calcularCuentas(carrera([sprint(6, 1, 2), sprint(4, 1, 2)]))
    expect(cuentas.lider).toBe(1)
    const dos = cuentas.porPatinador.find((c) => c.dorsal === 2)!
    expect(dos).toEqual({ dorsal: 2, maximoAlcanzable: 7, puntosHastaLider: 2, puedeAlcanzarLider: true })
    expect(cuentas.liderAsegurado).toBe(false)
  })

  it('empatar al líder cuenta como alcanzarle (se decide en la llegada final)', () => {
    // 1 = 6 puntos (tres sprints ganados). Solo queda el final (3): quien tenga 3 puede empatar.
    const cuentas = calcularCuentas(carrera([sprint(6, 1, 2), sprint(4, 1, 2), sprint(2, 1, 2)]))
    const dos = cuentas.porPatinador.find((c) => c.dorsal === 2)!
    expect(dos.maximoAlcanzable).toBe(6)
    expect(dos.puedeAlcanzarLider).toBe(true)
    expect(cuentas.liderAsegurado).toBe(false)
  })

  it('el líder queda asegurado cuando nadie puede llegar a sus puntos', () => {
    // 1 = 6 puntos y el resto 0. Solo queda el final (3 puntos): nadie llega a 6.
    const cuentas = calcularCuentas(carrera([sprint(6, 1), sprint(4, 1), sprint(2, 1)]))
    expect(cuentas.liderAsegurado).toBe(true)
  })

  it('si al líder le doblan, deja de serlo', () => {
    const cuentas = calcularCuentas(
      carrera([sprint(6, 1, 2), sprint(4, 1), sprint(2, 1), { tipo: 'doblado', dorsal: 1, por: 'escapada' }]),
    )
    expect(cuentas.lider).toBe(2)
    expect(cuentas.liderAsegurado).toBe(false)
  })

  it('los que ya no están en carrera no aparecen en las cuentas', () => {
    const cuentas = calcularCuentas(carrera([{ tipo: 'abandono', dorsal: 3 }]))
    expect(cuentas.porPatinador.map((c) => c.dorsal)).toEqual([1, 2, 4])
  })
})
