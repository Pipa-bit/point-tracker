// Lista de las carreras terminadas guardadas en el dispositivo. Al tocar una se ven sus resultados
// y se pueden volver a compartir (o resolver un empate que quedó pendiente).

import { useState } from 'react'
import { borrarDelHistorial, cargarHistorial, guardarEnHistorial } from '../almacen'
import type { Carrera } from '../modelo/tipos'
import { resultados } from '../resultados'
import { TEXTOS } from '../textos'
import { PantallaFinal } from './PantallaFinal'

const T = TEXTOS.historialCarreras

export function PantallaHistorial({ alVolver }: { alVolver: () => void }) {
  const [carreras, setCarreras] = useState<Carrera[]>(() => cargarHistorial())
  const [abierta, setAbierta] = useState<Carrera | null>(null)

  if (abierta) {
    return (
      <PantallaFinal
        carrera={abierta}
        modo="historial"
        alCambiar={(cambiada) => {
          guardarEnHistorial(cambiada)
          setAbierta(cambiada)
          setCarreras(cargarHistorial())
        }}
        alSalir={() => setAbierta(null)}
        alBorrar={() => {
          borrarDelHistorial(abierta.id)
          setCarreras(cargarHistorial())
          setAbierta(null)
        }}
      />
    )
  }

  return (
    <main className="pantalla">
      <h1>{T.titulo}</h1>
      {carreras.length === 0 && <p>{T.ninguna}</p>}
      <ul className="lista-juegos">
        {carreras.map((carrera) => {
          const ganador = resultados(carrera).filas[0]
          return (
            <li key={carrera.id}>
              <button className="fila-historial" onClick={() => setAbierta(carrera)}>
                <strong>{carrera.nombre}</strong>
                <span>
                  {resultados(carrera).fecha}
                  {ganador && ` · ${T.ganador}: ${ganador.quien} (${ganador.puntos})`}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="acciones">
        <button onClick={alVolver}>{T.volver}</button>
      </div>
    </main>
  )
}
