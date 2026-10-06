import { describe, expect, it } from 'vitest'
import { agruparPorClub, CLUBES, clubDe, coloresClub, esNuestro, luminancia } from './clubes'
import { LISTAS_INSCRITOS } from './inscritos'

describe('coloresClub', () => {
  it('con un color oscuro, el número y el borde van del mismo color', () => {
    const c = coloresClub('SJN')!
    expect(c.numero).toBe('#0e5f2c')
    expect(c.borde).toBe('#0e5f2c')
    expect(c.raya).toBe('#0e5f2c')
  })

  it('con un color claro, oscurece el número para que se lea', () => {
    const c = coloresClub('PLY')!
    expect(luminancia(c.numero)).toBeLessThan(luminancia('#f2c200'))
    expect(c.raya).toBe('#1a1a1a')
  })

  it('con el blanco de principal, el fondo es blanco y el resto toma el secundario', () => {
    expect(coloresClub('PTO')).toMatchObject({ tinte: '#ffffff', borde: '#d7141a', raya: '#d7141a' })
  })

  it('una raya secundaria blanca se cambia por el color principal', () => {
    expect(coloresClub('NOV')!.raya).toBe('#2a6fd6')
  })

  it('sin club o con un club que no existe, no hay colores', () => {
    expect(coloresClub(undefined)).toBeNull()
    expect(coloresClub('XXX')).toBeNull()
  })
})

describe('clubDe y esNuestro', () => {
  it('las carreras antiguas sin club: los que tienen nombre son de los nuestros', () => {
    expect(clubDe({ nombre: 'Adrián' })).toBe('SJN')
    expect(clubDe({})).toBeUndefined()
    expect(esNuestro({ nombre: 'Adrián' })).toBe(true)
  })

  it('con club, manda el club', () => {
    expect(esNuestro({ nombre: 'Leire', club: 'TXN' })).toBe(false)
    expect(esNuestro({ nombre: 'Adrián', club: 'SJN' })).toBe(true)
  })
})

describe('listas de la Liga 2026', () => {
  it('tienen los inscritos del comunicado, sin dorsales repetidos', () => {
    expect(LISTAS_INSCRITOS.map((l) => l.participantes.length)).toEqual([61, 77, 61, 89])
    for (const lista of LISTAS_INSCRITOS) {
      const dorsales = lista.participantes.map((p) => p.dorsal)
      expect(new Set(dorsales).size).toBe(dorsales.length)
    }
  })

  it('todos los clubes de las listas tienen colores', () => {
    for (const lista of LISTAS_INSCRITOS) {
      for (const p of lista.participantes) expect(CLUBES[p.club], `${lista.id} dorsal ${p.dorsal}`).toBeDefined()
    }
  })
})

describe('agruparPorClub', () => {
  it('pone nuestro club primero y el resto en el orden en que aparecen', () => {
    const grupos = agruparPorClub([
      { dorsal: 1, club: 'TXN' },
      { dorsal: 2, club: 'TXN' },
      { dorsal: 3, club: 'SJN' },
      { dorsal: 4, club: 'CDA' },
    ])
    expect(grupos?.map((g) => [g.club, g.participantes.map((p) => p.dorsal)])).toEqual([
      ['SJN', [3]],
      ['TXN', [1, 2]],
      ['CDA', [4]],
    ])
  })

  it('sin clubes no agrupa', () => {
    expect(agruparPorClub([{ dorsal: 1 }, { dorsal: 2, nombre: 'Adrián' }])).toBeNull()
  })
})
