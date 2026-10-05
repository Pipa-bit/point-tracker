// Lista de todo lo anotado, del más reciente al más antiguo, para corregir errores que no son el último.
// Los sprints se corrigen (se vuelve a elegir la llegada); las incidencias se pueden borrar.

import { describirSuceso } from '../describir'
import type { Suceso } from '../modelo/tipos'
import { TEXTOS } from '../textos'

const T = TEXTOS.historial

interface Props {
  sucesos: Suceso[]
  alCorregir: (indice: number) => void
  alBorrar: (indice: number) => void
  alCerrar: () => void
}

export function Historial({ sucesos, alCorregir, alBorrar, alCerrar }: Props) {
  // Se guarda el índice original de cada suceso antes de darles la vuelta, porque las acciones lo necesitan.
  const recientesPrimero = sucesos.map((suceso, indice) => ({ suceso, indice })).reverse()

  return (
    <div className="menu-fondo">
      <div className="menu historial" role="dialog" aria-modal="true" aria-label={T.titulo}>
        <h2>{T.titulo}</h2>
        {recientesPrimero.length === 0 && <p>{T.vacio}</p>}
        <ol>
          {recientesPrimero.map(({ suceso, indice }) => {
            const texto = describirSuceso(suceso)
            return (
              <li key={indice}>
                <span>{texto}</span>
                {suceso.tipo === 'sprint' ? (
                  <button onClick={() => alCorregir(indice)}>{T.corregir}</button>
                ) : (
                  <button
                    className="peligro"
                    onClick={() => {
                      if (window.confirm(T.confirmarBorrar(texto))) alBorrar(indice)
                    }}
                  >
                    {T.borrar}
                  </button>
                )}
              </li>
            )
          })}
        </ol>
        <button className="cancelar" onClick={alCerrar}>
          {T.cerrar}
        </button>
      </div>
    </div>
  )
}
