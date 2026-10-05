// Frase corta que describe un suceso, para el aviso de "Último registrado".
// Así, antes de pulsar Deshacer, se ve exactamente qué se va a quitar.

import type { Suceso } from './modelo/tipos'
import { TEXTOS } from './textos'

export function describirSuceso(suceso: Suceso): string {
  switch (suceso.tipo) {
    case 'sprint': {
      const nombre = suceso.aFalta === 0 ? TEXTOS.carrera.sprintFinal : `${TEXTOS.carrera.sprintAFalta} ${suceso.aFalta}`
      const llegada = suceso.llegada.length > 0 ? suceso.llegada.join(', ') : TEXTOS.carrera.vacio
      return `${nombre} → ${llegada}`
    }
    case 'doblado':
      return `Dorsal ${suceso.dorsal} doblado por ${suceso.por === 'peloton' ? 'el pelotón' : 'una escapada'}`
    case 'abandono':
      return `Dorsal ${suceso.dorsal} abandona`
    case 'descalificacion':
      return `Dorsal ${suceso.dorsal} descalificado`
    case 'escapadaDoblaPeloton':
      return `La escapada (${suceso.escapados.join(', ')}) dobla al pelotón`
  }
}
