// Pantalla de la carrera en directo: rejilla de dorsales a la izquierda y panel del sprint a la derecha.
//
// Para registrar un sprint se tocan los dorsales en orden de llegada. Al tocar el último puesto
// que puntúa, el sprint se guarda solo. Tocar otra vez un dorsal ya elegido lo quita.
// Mantener pulsado un dorsal abre el menú de incidencias (doblado, abandono, descalificación).
// Desde el historial se corrige cualquier sprint anterior o se borra una incidencia.

import { useState, type CSSProperties } from 'react'
import { describirSuceso } from '../describir'
import { anadirSuceso, borrarIncidencia, cambiarEstado, corregirSprint, deshacerUltimo, registrarSiguienteSprint } from '../modelo/acciones'
import { clubDe, esNuestro } from '../modelo/clubes'
import { calcularCuentas } from '../modelo/cuentas'
import type { Carrera, Dorsal, Suceso } from '../modelo/tipos'
import { TEXTOS } from '../textos'
import { BotonDorsal } from './BotonDorsal'
import { estiloClub } from './estiloClub'
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
  // Columnas de la rejilla según cuántos corren, para que quepan todos sin desplazar:
  // 24 dorsales caben en 6 columnas, pero los 89 de una división necesitan 11.
  const columnas = Math.max(6, Math.ceil(Math.sqrt(carrera.participantes.length * 1.2)))
  const { siguienteSprint, sprintsRestantes } = cuentas
  const puestos = siguienteSprint?.puntos.length ?? 0
  const ultimo = carrera.sucesos.at(-1)
  // Dorsales que ya no corren (eliminados, abandonos, descalificados): no se pueden tocar.
  const sprintCorregido = correccion && carrera.sucesos[correccion.indice]
  const puestosCorreccion =
    sprintCorregido?.tipo === 'sprint'
      ? (sprintCorregido.aFalta === 0 ? carrera.configuracion.puntosFinal : carrera.configuracion.puntosIntermedio).length
      : 0
  // Para cada uno que ya no corre, su código corto (DOB, ABA, DSQ), que se ve en su botón.
  const fuera = new Map(
    cuentas.clasificacion.filas.flatMap((f) => (f.estado === 'en-carrera' ? [] : [[f.dorsal, TEXTOS.codigos[f.estado]] as const])),
  )

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

  // Lo que dice la cabecera del sprint: «a falta de N» con el número en grande, o el sprint final.
  const cabecera = siguienteSprint === null
    ? { etiqueta: T.terminada, valor: null }
    : siguienteSprint.esFinal
      ? { etiqueta: T.ultimaVuelta, valor: T.sprintFinal }
      : { etiqueta: T.sprintAFalta, valor: String(siguienteSprint.aFalta) }

  return (
    <main className="carrera">
      <section className="columna-rejilla">
        <header className="barra">
          <h1>{carrera.nombre}</h1>
          <button className="chip" onClick={salir}>
            {T.nuevaCarrera}
          </button>
        </header>

        <div className="rejilla" aria-label="Dorsales" style={{ '--columnas': columnas } as CSSProperties}>
          {carrera.participantes.map((participante) => {
            const { dorsal, nombre } = participante
            const club = clubDe(participante)
            const nuestro = esNuestro(participante)
            const posicion = (correccion?.llegada ?? seleccion).indexOf(dorsal)
            // Al corregir un sprint antiguo se puede elegir a cualquiera: entonces quizá aún corría.
            const estaFuera = correccion === null && fuera.has(dorsal)
            const esEscapado = escapados?.includes(dorsal) ?? false
            const estilo = estiloClub(club)
            const clases = ['dorsal', estilo && 'con-club', estaFuera && 'fuera', esEscapado && 'escapado'].filter(Boolean).join(' ')
            return (
              <BotonDorsal
                key={dorsal}
                className={clases}
                estilo={estilo}
                pulsado={posicion !== -1 || esEscapado}
                desactivado={estaFuera}
                alTocar={() => tocarDorsal(dorsal)}
                alMantener={() => escapados === null && correccion === null && setMenuDe(dorsal)}
              >
                {dorsal}
                {/* Debajo del número: el nombre de pila si es de los nuestros y, si no, el código del club. */}
                {(nuestro ? nombre : club) && <span className="nombre-dorsal">{nuestro ? nombre?.split(' ')[0] : club}</span>}
                {posicion !== -1 && <span className="marca">{T.puesto(posicion + 1)}</span>}
                {estaFuera && <span className="marca">{fuera.get(dorsal)}</span>}
              </BotonDorsal>
            )
          })}
        </div>

        {correccion === null && escapados === null && (
          <div className="herramientas">
            {siguienteSprint && (
              <button onClick={sinRegistrar} disabled={seleccion.length > 0}>
                {T.sinRegistrar}
              </button>
            )}
            <button onClick={() => setEscapados([])} disabled={seleccion.length > 0}>
              {TI.escapadaDobla}
            </button>
            <button onClick={() => setHistorialAbierto(true)} disabled={seleccion.length > 0}>
              {TH.abrir}
            </button>
          </div>
        )}
        <p className="ayuda">{TI.ayuda}</p>
      </section>

      <aside className="panel">
        {correccion !== null && sprintCorregido?.tipo === 'sprint' ? (
          <div className="tarjeta sprint corrigiendo">
            <h2>
              {TH.corrigiendo}: {sprintCorregido.aFalta === 0 ? T.sprintFinal : `${T.sprintAFalta} ${sprintCorregido.aFalta}`}
            </h2>
            <p className="ayuda">{TH.ayudaCorregir}</p>
            <ol className="huecos">
              {Array.from({ length: puestosCorreccion }, (_, i) => (
                <li key={i} className={correccion.llegada[i] ? 'lleno' : ''}>
                  <small>{T.puesto(i + 1)}</small>
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
          <div className="tarjeta sprint">
            <h2>{TI.tocaEscapados}</h2>
            <p className="ayuda">{TI.escapadaDetalle}</p>
            <p className="escapados">{escapados.length > 0 ? escapados.join(', ') : '—'}</p>
            <button className="boton-principal" onClick={confirmarEscapada} disabled={escapados.length === 0}>
              {TI.confirmar}
            </button>
            <button onClick={() => setEscapados(null)}>{TI.cancelar}</button>
          </div>
        ) : (
          <div className="tarjeta sprint">
            <div className="cabecera-sprint">
              <div>
                <div className="etiqueta">{cabecera.etiqueta}</div>
                {cabecera.valor && (
                  <div className={siguienteSprint?.esFinal ? 'a-falta final' : 'a-falta'}>{cabecera.valor}</div>
                )}
              </div>
              <div className="datos">
                <div>
                  <span className="etiqueta">{T.quedan}</span>
                  <b>{sprintsRestantes}</b>
                </div>
                <div>
                  <span className="etiqueta">{T.enJuego}</span>
                  <b>{cuentas.puntosEnJuego}</b>
                </div>
              </div>
            </div>

            {siguienteSprint ? (
              <ol className="huecos">
                {siguienteSprint.puntos.map((puntos, i) => (
                  <li key={i} className={seleccion[i] ? 'lleno' : ''}>
                    <small>{T.puesto(i + 1)}</small>
                    <strong>{seleccion[i] ?? '—'}</strong>
                    <small>{puntos} pt</small>
                  </li>
                ))}
              </ol>
            ) : (
              <button className="boton-principal" onClick={() => alCambiar(cambiarEstado(carrera, 'terminada'))}>
                {TEXTOS.final.terminar}
              </button>
            )}

            <button className="boton-deshacer" onClick={deshacer} disabled={seleccion.length === 0 && carrera.sucesos.length === 0}>
              {T.deshacer}
            </button>

            {ultimo && (
              // `key` cambia con cada suceso, así React crea el bloque de nuevo y la animación de aviso se repite.
              <p className="ultimo" key={carrera.sucesos.length}>
                {T.ultimo}: <b>{describirSuceso(ultimo)}</b>
              </p>
            )}
          </div>
        )}

        <ClasificacionEnVivo cuentas={cuentas} />
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
