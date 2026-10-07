// Pantalla para preparar una carrera, en tres columnas que caben en el iPad sin desplazar: a la izquierda
// la división (cada una con su lista de inscritos, o «Otra carrera» para escribir los dorsales), en el
// centro el nombre, las vueltas y los puntos, y a la derecha se ve en directo qué sprints habrá, cuántos
// corren de cada club y los errores, con el botón para seguir siempre abajo.
// Si en la división hay patinadores de San Juan, antes de empezar se elige quién de ellos corre.

import { useState, type CSSProperties } from 'react'
import { cargarHistorial, cargarJuegos, guardarJuegos } from '../almacen'
import { calendarioSprints, validarConfiguracion } from '../modelo/calendario'
import { leerDorsales } from '../modelo/dorsales'
import { participantesConEquipo, type JuegoDorsales } from '../modelo/equipo'
import { agruparPorClub, esNuestro } from '../modelo/clubes'
import { LISTAS_INSCRITOS } from '../modelo/inscritos'
import { PUNTOS_POR_DEFECTO, type Carrera, type ConfiguracionCarrera, type Dorsal, type Participante } from '../modelo/tipos'
import { TEXTOS } from '../textos'
import { estiloClub } from './estiloClub'
import { Icono } from './Icono'
import { PantallaConvocatoria } from './PantallaConvocatoria'
import { PantallaHistorial } from './PantallaHistorial'
import { PantallaJuegos } from './PantallaJuegos'

const T = TEXTOS.crearCarrera

/** Valor del selector para «Otra carrera»: los dorsales se escriben a mano. */
const OTRA = 'otra'

/** "Liga Nacional 2026 · 1ª masculina" → "1ª masculina", para los botones de división. */
function nombreCorto(nombre: string): string {
  return nombre.split(' · ').at(-1) ?? nombre
}

/** Convierte "3, 2, 1" en [3, 2, 1]. Devuelve null si algún trozo no es un número. */
function leerPuntos(texto: string): number[] | null {
  const trozos = texto.split(/[,;\s]+/).filter((t) => t !== '')
  if (!trozos.every((t) => /^\d+$/.test(t))) return null
  return trozos.map(Number)
}

/** Monta la carrera vacía, con fecha de hoy y un identificador único. */
function nuevaCarrera(nombre: string, configuracion: ConfiguracionCarrera, participantes: Participante[]): Carrera {
  return {
    id: crypto.randomUUID(),
    nombre,
    fecha: new Date().toISOString().slice(0, 10),
    configuracion,
    participantes,
    sucesos: [],
    estado: 'en-curso',
  }
}

interface Props {
  /** Se llama con la carrera ya creada cuando se pulsa "Empezar carrera". */
  alCrear: (carrera: Carrera) => void
}

export function CrearCarrera({ alCrear }: Props) {
  // Los campos se guardan como texto tal cual se escriben; se convierten al calcular.
  const [nombre, setNombre] = useState(LISTAS_INSCRITOS[0]?.nombre ?? '')
  const [vueltas, setVueltas] = useState('')
  const [primerSprint, setPrimerSprint] = useState('')
  const [frecuencia, setFrecuencia] = useState<1 | 2>(2)
  const [puntosIntermedio, setPuntosIntermedio] = useState(PUNTOS_POR_DEFECTO.puntosIntermedio.join(', '))
  const [puntosFinal, setPuntosFinal] = useState(PUNTOS_POR_DEFECTO.puntosFinal.join(', '))
  // Lista de inscritos elegida, o OTRA para escribir los dorsales a mano.
  const [listaId, setListaId] = useState(LISTAS_INSCRITOS[0]?.id ?? OTRA)
  const [textoDorsales, setTextoDorsales] = useState('')
  const [juegos, setJuegos] = useState<JuegoDorsales[]>(() => cargarJuegos())
  const [juegoId, setJuegoId] = useState('')
  const [viendoJuegos, setViendoJuegos] = useState(false)
  const [viendoHistorial, setViendoHistorial] = useState(false)
  // Pantalla de quién corre de San Juan, y los dorsales que se han quitado en ella.
  const [eligiendo, setEligiendo] = useState(false)
  const [fuera, setFuera] = useState<Set<Dorsal>>(() => new Set())
  // Solo para el número del botón; se vuelve a leer al volver del historial porque allí se pueden borrar.
  const [carrerasGuardadas, setCarrerasGuardadas] = useState(() => cargarHistorial().length)

  if (viendoHistorial) {
    return (
      <PantallaHistorial
        alVolver={() => {
          setCarrerasGuardadas(cargarHistorial().length)
          setViendoHistorial(false)
        }}
      />
    )
  }

  if (viendoJuegos) {
    return (
      <PantallaJuegos
        juegos={juegos}
        alCambiar={(nuevos) => {
          setJuegos(nuevos)
          guardarJuegos(nuevos)
        }}
        alVolver={() => setViendoJuegos(false)}
      />
    )
  }

  // Todo lo que sigue se recalcula en cada pulsación: React vuelve a ejecutar la función del componente.
  const intermedio = leerPuntos(puntosIntermedio)
  const final = leerPuntos(puntosFinal)
  const config: ConfiguracionCarrera = {
    vueltasTotales: Number(vueltas),
    primerSprintAFalta: Number(primerSprint),
    frecuencia,
    puntosIntermedio: intermedio ?? [],
    puntosFinal: final ?? [],
  }
  const lista = LISTAS_INSCRITOS.find((l) => l.id === listaId) ?? null
  const { dorsales, errores: erroresDorsales } = lista ? { dorsales: [], errores: [] } : leerDorsales(textoDorsales)
  const juego = juegos.find((j) => j.id === juegoId) ?? null
  const participantes: Participante[] = lista ? lista.participantes : participantesConEquipo(dorsales, juego)
  const delEquipo = participantes.filter(esNuestro).length
  const clubes = agruparPorClub(participantes)
  // Solo las listas de inscritos pasan por la convocatoria; en "Otra carrera" ya se escriben los que corren.
  const nuestrosInscritos = lista ? lista.participantes.filter(esNuestro) : []

  const camposVacios = vueltas === '' || primerSprint === ''
  const errores = camposVacios ? [] : validarConfiguracion(config)
  if (intermedio === null || final === null) errores.push('Los puntos deben ser números separados por comas.')
  errores.push(...erroresDorsales)
  if ((lista || textoDorsales !== '' || juego) && participantes.length < 2) errores.push('Hacen falta al menos dos dorsales.')

  const sprints = !camposVacios && errores.length === 0 ? calendarioSprints(config) : []
  const sePuedeEmpezar = !camposVacios && errores.length === 0 && participantes.length >= 2 && nombre.trim() !== ''

  function empezar() {
    alCrear(nuevaCarrera(nombre.trim(), config, participantes.filter((p) => !fuera.has(p.dorsal))))
  }

  function elegirLista(id: string) {
    setListaId(id)
    setFuera(new Set())
    const elegida = LISTAS_INSCRITOS.find((l) => l.id === id)
    setNombre(elegida ? elegida.nombre : '')
  }

  if (eligiendo) {
    return (
      <PantallaConvocatoria
        nombreCarrera={nombre.trim()}
        nuestros={nuestrosInscritos}
        fuera={fuera}
        alCambiar={setFuera}
        alEmpezar={empezar}
        alVolver={() => setEligiendo(false)}
      />
    )
  }

  return (
    <main className="crear-carrera">
      <header className="barra">
        <h1>{T.titulo}</h1>
        <button className="boton-menu" onClick={() => setViendoHistorial(true)}>
          <Icono nombre="lista" />
          {TEXTOS.historialCarreras.abrir(carrerasGuardadas)}
        </button>
      </header>

      {/* Izquierda: qué división corre. Una ficha por lista de inscritos y otra para escribir los dorsales. */}
      <section className="crear-divisiones" aria-label={T.competicion}>
        <h2>{T.queDivision}</h2>
        {LISTAS_INSCRITOS.map((l) => {
          const deSanJuan = l.participantes.filter(esNuestro).length
          return (
            <button key={l.id} className="division" aria-pressed={listaId === l.id} onClick={() => elegirLista(l.id)}>
              <b>{nombreCorto(l.nombre)}</b>
              <span>{T.inscritos(l.participantes.length, deSanJuan)}</span>
            </button>
          )
        })}
        <button className="division otra" aria-pressed={lista === null} onClick={() => elegirLista(OTRA)}>
          <b>{T.otraCarrera}</b>
          <span>{T.otraCarreraAyuda}</span>
        </button>
      </section>

      {/* Centro: nombre, vueltas y puntos. Los números se cambian con − y + para no sacar el teclado. */}
      <section className="tarjeta crear-reglas">
        <label className="campo">
          {T.nombre}
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={T.nombreEjemplo} />
          {lista && <small>{T.nombreAyuda}</small>}
        </label>

        {lista === null && (
          <>
            <label className="campo">
              {T.dorsales}
              <input value={textoDorsales} onChange={(e) => setTextoDorsales(e.target.value)} placeholder="1-24" />
              <small>{T.dorsalesAyuda}</small>
            </label>

            <label className="campo">
              {T.equipo}
              <span className="fila-equipo">
                <select value={juegoId} onChange={(e) => setJuegoId(e.target.value)}>
                  <option value="">{T.sinEquipo}</option>
                  {juegos.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.nombre}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => setViendoJuegos(true)}>
                  {T.gestionarEquipos}
                </button>
              </span>
            </label>
          </>
        )}

        <div className="dos-campos">
          <Paso etiqueta={T.vueltasTotales} valor={vueltas} alCambiar={setVueltas} />
          <Paso etiqueta={T.primerSprint} valor={primerSprint} alCambiar={setPrimerSprint} />
        </div>

        <fieldset className="campo">
          <legend>{T.frecuencia}</legend>
          <div className="selector">
            <button type="button" aria-pressed={frecuencia === 1} onClick={() => setFrecuencia(1)}>
              {T.cadaVuelta}
            </button>
            <button type="button" aria-pressed={frecuencia === 2} onClick={() => setFrecuencia(2)}>
              {T.unaSiUnaNo}
            </button>
          </div>
        </fieldset>

        <div className="dos-campos">
          <FichasPuntos etiqueta={T.puntosIntermedio} texto={puntosIntermedio} alCambiar={setPuntosIntermedio} />
          <FichasPuntos etiqueta={T.puntosFinal} texto={puntosFinal} alCambiar={setPuntosFinal} />
        </div>
      </section>

      {/* Derecha: lo que va a salir, en directo, y el botón para seguir siempre a la vista abajo. */}
      <aside className="tarjeta crear-resumen" aria-label={T.resumen}>
        <h2>{T.resumenSprints}</h2>
        <div className="sprints-previstos">
          {sprints.length === 0 && <span className="ayuda">{T.sinSprints}</span>}
          {sprints.map((s) => (
            <span key={s.aFalta} className={s.esFinal ? 'final' : undefined}>
              {s.esFinal ? T.final : s.aFalta}
            </span>
          ))}
        </div>

        <p className="dato-grande">
          <b>{participantes.length}</b> {clubes ? T.enClubes(clubes.length) : T.participantes}
          {!clubes && delEquipo > 0 && ` (${delEquipo} ${T.delEquipo})`}
        </p>
        {clubes && (
          <div className="recuento-clubes">
            {clubes.map((g) => (
              <div
                key={g.club}
                className={g.club === 'SJN' ? 'recuento nuestro' : 'recuento'}
                style={{ ...estiloClub(g.club), '--parte': `${(g.participantes.length / Math.max(...clubes.map((c) => c.participantes.length))) * 100}%` } as CSSProperties}
              >
                <b>{g.club}</b>
                <span className="barrita" />
                <span className="cuantos">{g.participantes.length}</span>
              </div>
            ))}
          </div>
        )}

        {errores.length > 0 && (
          <ul className="errores">
            {errores.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}

        {nuestrosInscritos.length > 0 ? (
          <button className="boton-principal" disabled={!sePuedeEmpezar} onClick={() => setEligiendo(true)}>
            {T.elegirQuienCorre}
            <small>{T.deSanJuan(nuestrosInscritos.length)}</small>
          </button>
        ) : (
          <button className="boton-principal" disabled={!sePuedeEmpezar} onClick={empezar}>
            {T.empezar}
          </button>
        )}
      </aside>
    </main>
  )
}

/** Número con botones − y + a los lados. En el centro también se puede escribir. */
function Paso({ etiqueta, valor, alCambiar }: { etiqueta: string; valor: string; alCambiar: (valor: string) => void }) {
  const numero = Number(valor) || 0
  return (
    <div className="campo">
      {etiqueta}
      <div className="paso">
        <button type="button" aria-label={`${etiqueta}: uno menos`} disabled={numero <= 1} onClick={() => alCambiar(String(numero - 1))}>
          −
        </button>
        <input inputMode="numeric" aria-label={etiqueta} value={valor} placeholder="—" onChange={(e) => alCambiar(e.target.value)} />
        <button type="button" aria-label={`${etiqueta}: uno más`} onClick={() => alCambiar(String(numero + 1))}>
          +
        </button>
      </div>
    </div>
  )
}

/**
 * Puntos de cada puesto como fichas («3» «2» «1»): cada una se puede escribir, y con − y + se quita
 * o se añade un puesto que puntúa. Por dentro sigue siendo el texto «3, 2, 1» que lee `leerPuntos`.
 */
function FichasPuntos({ etiqueta, texto, alCambiar }: { etiqueta: string; texto: string; alCambiar: (texto: string) => void }) {
  const valores = texto.split(',').map((v) => v.trim())
  const cambiar = (nuevos: string[]) => alCambiar(nuevos.join(', '))
  return (
    <div className="campo">
      {etiqueta}
      <div className="fichas">
        {valores.map((v, i) => (
          <input
            key={i}
            inputMode="numeric"
            aria-label={`${etiqueta}: ${i + 1}.º`}
            value={v}
            onChange={(e) => cambiar(valores.map((otro, j) => (j === i ? e.target.value : otro)))}
          />
        ))}
        <button type="button" aria-label={`${etiqueta}: un puesto menos`} disabled={valores.length <= 1} onClick={() => cambiar(valores.slice(0, -1))}>
          −
        </button>
        <button type="button" aria-label={`${etiqueta}: un puesto más`} onClick={() => cambiar([...valores, '1'])}>
          +
        </button>
      </div>
    </div>
  )
}
