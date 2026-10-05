// Pantalla de la carrera en directo: rejilla de dorsales a la izquierda y panel del sprint a la derecha.
//
// Para registrar un sprint se tocan los dorsales en orden de llegada. Al tocar el último puesto
// que puntúa, el sprint se guarda solo. Tocar otra vez un dorsal ya elegido lo quita.
// Mantener pulsado un dorsal abre el menú de incidencias (doblado, abandono, descalificación).
// Desde el historial se corrige cualquier sprint anterior o se borra una incidencia.

import { useState } from 'react'
import { describirSuceso } from '../describir'
import { anadirSuceso, borrarIncidencia, corregirSprint, deshacerUltimo, registrarSiguienteSprint } from '../modelo/acciones'
import { calcularCuentas } from '../modelo/cuentas'
import type { Carrera, Dorsal, Suceso } from '../modelo/tipos'
import { TEXTOS } from '../textos'
import { BotonDorsal } from './BotonDorsal'
import { ClasificacionEnVivo } from './ClasificacionEnVivo'
import { Historial } from './Historial'
import { MenuIncidencias } from './MenuIncidencias'

const T = TEXTOS.carrera
const TI = TEXTOS.incidencias
const TH = TEXTOS.historial

interface Props {
  carrera: Carrera
  /** Se llama con la carrera actualizada cada vez que se anota o se deshace algo. */
  alCambiar: (carrera: Carrera) => void
  alSalir: () => void
}

export function PantallaCarrera({ carrera, alCambiar, alSalir }: Props) {
  // Dorsales tocados en el sprint en curso, en orden de llegada. Aún no forman parte de la carrera.
  const [seleccion, setSeleccion] = useState<Dorsal[]>([])
  // Dorsal cuyo menú de incidencias está abierto (null = ninguno).
  const [menuDe, setMenuDe] = useState<Dorsal | null>(null)
  // Mientras no es null, los toques eligen a los escapados que doblan al pelotón en vez de anotar el sprint.
  const [escapados, setEscapados] = useState<Dorsal[] | null>(null)
  const [historialAbierto, setHistorialAbierto] = useState(false)
  // Sprint del historial que se está corrigiendo: su posición en la lista de sucesos y la nueva llegada.
  const [correccion, setCorreccion] = useState<{ indice: number; llegada: Dorsal[] } | null>(null)

  const cuentas = calcularCuentas(carrera)
  const { siguienteSprint, sprintsRestantes } = cuentas
  const puestos = siguienteSprint?.puntos.length ?? 0
  const ultimo = carrera.sucesos.at(-1)
  // Dorsales que ya no corren (eliminados, abandonos, descalificados): no se pueden tocar.
  const sprintCorregido = correccion && carrera.sucesos[correccion.indice]
  const puestosCorreccion =
    sprintCorregido?.tipo === 'sprint'
      ? (sprintCorregido.aFalta === 0 ? carrera.configuracion.puntosFinal : carrera.configuracion.puntosIntermedio).length
      : 0
  const fuera = new Set(cuentas.clasificacion.filas.filter((f) => f.estado !== 'en-carrera').map((f) => f.dorsal))

  function tocarDorsal(dorsal: Dorsal) {
    if (correccion !== null) {
      const { llegada } = correccion
      if (llegada.includes(dorsal)) setCorreccion({ ...correccion, llegada: llegada.filter((d) => d !== dorsal) })
      else if (llegada.length < puestosCorreccion) setCorreccion({ ...correccion, llegada: [...llegada, dorsal] })
      return
    }
    if (escapados !== null) {
      setEscapados(escapados.includes(dorsal) ? escapados.filter((d) => d !== dorsal) : [...escapados, dorsal])
      return
    }
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

  function anotarIncidencia(suceso: Suceso) {
    alCambiar(anadirSuceso(carrera, suceso))
    setMenuDe(null)
    // Si estaba elegido en el sprint a medias y ya no corre, se quita de la selección.
    if ('dorsal' in suceso && !(suceso.tipo === 'doblado' && suceso.por === 'escapada')) {
      setSeleccion(seleccion.filter((d) => d !== suceso.dorsal))
    }
  }

  function confirmarEscapada() {
    if (escapados === null || escapados.length === 0) return
    alCambiar(anadirSuceso(carrera, { tipo: 'escapadaDoblaPeloton', escapados }))
    setEscapados(null)
  }

  function empezarCorreccion(indice: number) {
    const suceso = carrera.sucesos[indice]
    if (suceso?.tipo !== 'sprint') return
    setHistorialAbierto(false)
    setSeleccion([])
    setCorreccion({ indice, llegada: suceso.llegada })
  }

  function guardarCorreccion() {
    if (correccion === null) return
    alCambiar(corregirSprint(carrera, correccion.indice, correccion.llegada))
    setCorreccion(null)
  }

  function deshacer() {
    // Si hay un sprint a medias, deshacer quita el último dorsal tocado; si no, el último suceso guardado.
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
          const posicion = (correccion?.llegada ?? seleccion).indexOf(dorsal)
          // Al corregir un sprint antiguo se puede elegir a cualquiera: entonces quizá aún corría.
          const estaFuera = correccion === null && fuera.has(dorsal)
          const esEscapado = escapados?.includes(dorsal) ?? false
          const clases = ['dorsal', estaFuera && 'fuera', esEscapado && 'escapado'].filter(Boolean).join(' ')
          return (
            <BotonDorsal
              key={dorsal}
              className={clases}
              pulsado={posicion !== -1 || esEscapado}
              desactivado={estaFuera}
              alTocar={() => tocarDorsal(dorsal)}
              alMantener={() => escapados === null && correccion === null && setMenuDe(dorsal)}
            >
              {dorsal}
              {posicion !== -1 && <span className="marca">{T.puesto(posicion + 1)}</span>}
              {estaFuera && <span className="marca">{TI.fuera}</span>}
            </BotonDorsal>
          )
        })}
      </section>

      <aside className="panel">
        <h1>{carrera.nombre}</h1>

        {correccion !== null && sprintCorregido?.tipo === 'sprint' ? (
          <div className="corrigiendo">
            <h2>
              {TH.corrigiendo}: {sprintCorregido.aFalta === 0 ? T.sprintFinal : `${T.sprintAFalta} ${sprintCorregido.aFalta}`}
            </h2>
            <p className="ayuda">{TH.ayudaCorregir}</p>
            <ol className="huecos">
              {Array.from({ length: puestosCorreccion }, (_, i) => (
                <li key={i}>
                  <span>{T.puesto(i + 1)}</span>
                  <strong>{correccion.llegada[i] ?? '—'}</strong>
                </li>
              ))}
            </ol>
            <button className="boton-principal" onClick={guardarCorreccion}>
              {TH.guardar}
            </button>
            <button onClick={() => setCorreccion(null)}>{TH.cancelar}</button>
          </div>
        ) : escapados !== null ? (
          <>
            <h2>{TI.tocaEscapados}</h2>
            <p className="ayuda">{TI.escapadaDetalle}</p>
            <p>
              <strong>{escapados.length > 0 ? escapados.join(', ') : '—'}</strong>
            </p>
            <button className="boton-principal" onClick={confirmarEscapada} disabled={escapados.length === 0}>
              {TI.confirmar}
            </button>
            <button onClick={() => setEscapados(null)}>{TI.cancelar}</button>
          </>
        ) : (
          <>
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
                {T.ultimo}: {describirSuceso(ultimo)}
              </p>
            )}

            {siguienteSprint && (
              <button onClick={sinRegistrar} disabled={seleccion.length > 0}>
                {T.sinRegistrar}
              </button>
            )}

            <p className="ayuda">{TI.ayuda}</p>
            <button onClick={() => setEscapados([])} disabled={seleccion.length > 0}>
              {TI.escapadaDobla}
            </button>
            <button onClick={() => setHistorialAbierto(true)} disabled={seleccion.length > 0}>
              {TH.abrir}
            </button>
          </>
        )}

        <ClasificacionEnVivo cuentas={cuentas} />

        <button onClick={salir}>{T.nuevaCarrera}</button>
      </aside>

      {historialAbierto && (
        <Historial
          sucesos={carrera.sucesos}
          alCorregir={empezarCorreccion}
          alBorrar={(indice) => alCambiar(borrarIncidencia(carrera, indice))}
          alCerrar={() => setHistorialAbierto(false)}
        />
      )}
      {menuDe !== null && <MenuIncidencias dorsal={menuDe} alElegir={anotarIncidencia} alCancelar={() => setMenuDe(null)} />}
    </main>
  )
}
