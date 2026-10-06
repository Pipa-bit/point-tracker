import { describe, expect, it } from 'vitest'
import {
  borrarCarreraActual,
  borrarDelHistorial,
  cargarCarreraActual,
  cargarHistorial,
  cargarJuegos,
  cargarVista,
  guardarCarreraActual,
  guardarEnHistorial,
  guardarJuegos,
  guardarVista,
} from './almacen'
import { PUNTOS_POR_DEFECTO, type Carrera } from './modelo/tipos'

/** Imita el localStorage del navegador con un Map. */
function almacenFalso() {
  const datos = new Map<string, string>()
  return {
    datos,
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
  }
}

const carrera: Carrera = {
  id: 'abc',
  nombre: 'Prueba',
  fecha: '2026-10-05',
  configuracion: { vueltasTotales: 10, primerSprintAFalta: 4, frecuencia: 2, ...PUNTOS_POR_DEFECTO },
  participantes: [{ dorsal: 1 }, { dorsal: 2, nombre: 'Adrián' }],
  sucesos: [{ tipo: 'sprint', aFalta: 4, llegada: [2, 1] }],
  estado: 'en-curso',
}

describe('almacén de la carrera actual', () => {
  it('lo que se guarda se recupera igual', () => {
    const almacen = almacenFalso()
    guardarCarreraActual(carrera, almacen)
    expect(cargarCarreraActual(almacen)).toEqual(carrera)
  })

  it('sin nada guardado devuelve null', () => {
    expect(cargarCarreraActual(almacenFalso())).toBeNull()
  })

  it('borrar deja el almacén vacío', () => {
    const almacen = almacenFalso()
    guardarCarreraActual(carrera, almacen)
    borrarCarreraActual(almacen)
    expect(cargarCarreraActual(almacen)).toBeNull()
  })

  it('ignora datos corruptos en lugar de fallar', () => {
    const almacen = almacenFalso()
    almacen.setItem('point-tracker:carrera-actual', '{esto no es json')
    expect(cargarCarreraActual(almacen)).toBeNull()
    almacen.setItem('point-tracker:carrera-actual', '{"hola": 1}')
    expect(cargarCarreraActual(almacen)).toBeNull()
  })

  it('si no hay almacenamiento disponible no falla', () => {
    expect(() => guardarCarreraActual(carrera, null)).not.toThrow()
    expect(cargarCarreraActual(null)).toBeNull()
  })
})

describe('almacén de juegos de dorsales', () => {
  it('lo que se guarda se recupera igual', () => {
    const almacen = almacenFalso()
    const juegos = [{ id: 'j', nombre: 'Liga 2026', miembros: [{ dorsal: 12, nombre: 'Adrián' }] }]
    guardarJuegos(juegos, almacen)
    expect(cargarJuegos(almacen)).toEqual(juegos)
  })

  it('sin nada guardado o con datos dañados devuelve una lista vacía', () => {
    const almacen = almacenFalso()
    expect(cargarJuegos(almacen)).toEqual([])
    almacen.setItem('point-tracker:juegos-dorsales', '{roto')
    expect(cargarJuegos(almacen)).toEqual([])
  })
})

describe('historial', () => {
  const otra: Carrera = { ...carrera, id: 'def', nombre: 'Otra' }

  it('guarda la más reciente primero y sustituye en su sitio la que ya estaba', () => {
    const almacen = almacenFalso()
    guardarEnHistorial(carrera, almacen)
    guardarEnHistorial(otra, almacen)
    expect(cargarHistorial(almacen).map((c) => c.id)).toEqual(['def', 'abc'])
    guardarEnHistorial({ ...carrera, nombre: 'Corregida' }, almacen)
    expect(cargarHistorial(almacen).map((c) => c.nombre)).toEqual(['Otra', 'Corregida'])
  })

  it('borra solo la indicada', () => {
    const almacen = almacenFalso()
    guardarEnHistorial(carrera, almacen)
    guardarEnHistorial(otra, almacen)
    borrarDelHistorial('abc', almacen)
    expect(cargarHistorial(almacen).map((c) => c.id)).toEqual(['def'])
  })
})

describe('vista de la rejilla', () => {
  it('por equipos si no se ha elegido nunca, y recuerda la elegida', () => {
    const almacen = almacenFalso()
    expect(cargarVista(almacen)).toBe('equipos')
    guardarVista('dorsal', almacen)
    expect(cargarVista(almacen)).toBe('dorsal')
    expect(cargarVista(null)).toBe('equipos')
  })
})
