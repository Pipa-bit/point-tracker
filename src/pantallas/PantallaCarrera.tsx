// Pantalla de la carrera en directo: rejilla de dorsales a la izquierda y panel del sprint a la derecha.
//
// Para registrar un sprint se tocan los dorsales en orden de llegada. Al tocar el último puesto
// que puntúa, el sprint se guarda solo. Tocar otra vez un dorsal ya elegido lo quita.

import { useState } from 'react'
import { deshacerUltimo, registrarSiguienteSprint } from '../modelo/acciones'
import { calcularCuentas } from '../modelo/cuentas'
import type { Carrera, Dorsal, Suceso } from '../modelo/tipos'
import { TEXTOS } from '../textos'

const T = TEXTOS.carrera

interface Props {
  carrera: Carrera
  /** Se llama con la carrera actualizada cada vez que se anota o se deshace algo. */
  alCambiar: (carrera: Carrera) => void
  alSalir: () => void
}

export function PantallaCarrera({ carrera, alCambiar, alSalir }: Props) {
  // Dorsales tocados en el sprint en curso, en orden de llegada. Aún no forman parte de la carrera.
  const [seleccion, setSeleccion] = useState<Dorsal[]>([])

  const { siguienteSprint, sprintsRestantes } = calcularCuentas(carrera)
  const puestos = siguienteSprint?.puntos.length ?? 0
  // `s is ...` le dice a TypeScript que lo encontrado es un sprint, para poder usar `aFalta` y `llegada`.
  const ultimo = carrera.sucesos.findLast((s): s is Extract<Suceso, { tipo: 'sprint' }> => s.tipo === 'sprint')

  function tocarDorsal(dorsal: Dorsal) {
    if (siguienteSprint === null) return
    if (seleccion.includes(dorsal)) {
      setSeleccion(seleccion.filter((d) => d !== dorsal))
      return
    }
    const nueva = [...seleccion, dorsal]
    if (nueva.length === puestos) {
      alCambiar(registrarSiguienteSprint(carrera, nueva))
      setSeleccion([])
    } else {
      setSeleccion(nueva)
    }
  }

  function deshacer() {
    // Si hay un sprint a medias, deshacer quita el último dorsal tocado; si no, el último sprint guardado.
    if (seleccion.length > 0) setSeleccion(seleccion.slice(0, -1))
    else alCambiar(deshacerUltimo(carrera))
  }

  function sinRegistrar() {
    alCambiar(registrarSiguienteSprint(carrera, []))
    setSeleccion([])
  }

  function salir() {
    if (window.confirm(T.confirmarSalir)) alSalir()
  }

  return (
    <main className="carrera">
      <section className="rejilla" aria-label="Dorsales">
        {carrera.participantes.map(({ dorsal }) => {
          const posicion = seleccion.indexOf(dorsal)
          return (
            <button
              key={dorsal}
              className="dorsal"
              aria-pressed={posicion !== -1}
              disabled={siguienteSprint === null}
              onClick={() => tocarDorsal(dorsal)}
            >
              {dorsal}
              {posicion !== -1 && <span className="marca">{T.puesto(posicion + 1)}</span>}
            </button>
          )
        })}
      </section>

      <aside className="panel">
        <h1>{carrera.nombre}</h1>

        {siguienteSprint ? (
          <>
            <h2>{siguienteSprint.esFinal ? T.sprintFinal : `${T.sprintAFalta} ${siguienteSprint.aFalta}`}</h2>
            <ol className="huecos">
              {siguienteSprint.puntos.map((puntos, i) => (
                <li key={i}>
                  <span>{T.puesto(i + 1)}</span>
                  <strong>{seleccion[i] ?? '—'}</strong>
                  <small>{puntos} pt</small>
                </li>
              ))}
            </ol>
            <p>
              {T.quedan}: {sprintsRestantes}
            </p>
          </>
        ) : (
          <h2>{T.terminada}</h2>
        )}

        <button className="boton-deshacer" onClick={deshacer} disabled={seleccion.length === 0 && carrera.sucesos.length === 0}>
          {T.deshacer}
        </button>

        {ultimo && (
          // `key` cambia con cada suceso, así React crea el bloque de nuevo y la animación de aviso se repite.
          <p className="ultimo" key={carrera.sucesos.length}>
            {T.ultimo}: {T.aFalta} {ultimo.aFalta} → {ultimo.llegada.length > 0 ? ultimo.llegada.join(', ') : T.vacio}
          </p>
        )}

        {siguienteSprint && (
          <button onClick={sinRegistrar} disabled={seleccion.length > 0}>
            {T.sinRegistrar}
          </button>
        )}

        <button onClick={salir}>{T.nuevaCarrera}</button>
      </aside>
    </main>
  )
}
