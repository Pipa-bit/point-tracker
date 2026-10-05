// Pantalla para preparar una carrera: reglas, vueltas, dorsales y, si se quiere, el equipo con sus nombres.
// Mientras se rellena, muestra en directo qué sprints habrá y avisa de los errores.

import { useState } from 'react'
import { cargarJuegos, guardarJuegos } from '../almacen'
import { calendarioSprints, validarConfiguracion } from '../modelo/calendario'
import { leerDorsales } from '../modelo/dorsales'
import { participantesConEquipo, type JuegoDorsales } from '../modelo/equipo'
import { PUNTOS_POR_DEFECTO, type Carrera, type ConfiguracionCarrera, type Participante } from '../modelo/tipos'
import { TEXTOS } from '../textos'
import { PantallaJuegos } from './PantallaJuegos'

const T = TEXTOS.crearCarrera

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
  const [nombre, setNombre] = useState('')
  const [vueltas, setVueltas] = useState('')
  const [primerSprint, setPrimerSprint] = useState('')
  const [frecuencia, setFrecuencia] = useState<1 | 2>(2)
  const [puntosIntermedio, setPuntosIntermedio] = useState(PUNTOS_POR_DEFECTO.puntosIntermedio.join(', '))
  const [puntosFinal, setPuntosFinal] = useState(PUNTOS_POR_DEFECTO.puntosFinal.join(', '))
  const [textoDorsales, setTextoDorsales] = useState('')
  const [juegos, setJuegos] = useState<JuegoDorsales[]>(() => cargarJuegos())
  const [juegoId, setJuegoId] = useState('')
  const [viendoJuegos, setViendoJuegos] = useState(false)

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
  const { dorsales, errores: erroresDorsales } = leerDorsales(textoDorsales)
  const juego = juegos.find((j) => j.id === juegoId) ?? null
  const participantes = participantesConEquipo(dorsales, juego)
  const delEquipo = participantes.filter((p) => p.nombre).length

  const camposVacios = vueltas === '' || primerSprint === ''
  const errores = camposVacios ? [] : validarConfiguracion(config)
  if (intermedio === null || final === null) errores.push('Los puntos deben ser números separados por comas.')
  errores.push(...erroresDorsales)
  if ((textoDorsales !== '' || juego) && participantes.length < 2) errores.push('Hacen falta al menos dos dorsales.')

  const sprints = !camposVacios && errores.length === 0 ? calendarioSprints(config) : []
  const sePuedeEmpezar = !camposVacios && errores.length === 0 && participantes.length >= 2 && nombre.trim() !== ''

  function empezar() {
    alCrear(nuevaCarrera(nombre.trim(), config, participantes))
  }

  return (
    <main className="pantalla">
      <h1>{T.titulo}</h1>

      <div className="formulario">
        <label className="campo campo-ancho">
          {T.nombre}
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={T.nombreEjemplo} />
        </label>

        <label className="campo">
          {T.vueltasTotales}
          <input inputMode="numeric" value={vueltas} onChange={(e) => setVueltas(e.target.value)} />
        </label>

        <label className="campo">
          {T.primerSprint}
          <input inputMode="numeric" value={primerSprint} onChange={(e) => setPrimerSprint(e.target.value)} />
        </label>

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

        <label className="campo">
          {T.puntosIntermedio}
          <input value={puntosIntermedio} onChange={(e) => setPuntosIntermedio(e.target.value)} />
        </label>

        <label className="campo">
          {T.puntosFinal}
          <input value={puntosFinal} onChange={(e) => setPuntosFinal(e.target.value)} />
        </label>

        <label className="campo campo-ancho">
          {T.dorsales}
          <input value={textoDorsales} onChange={(e) => setTextoDorsales(e.target.value)} placeholder="1-24" />
          <small>{T.dorsalesAyuda}</small>
        </label>

        <label className="campo campo-ancho">
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
      </div>

      {errores.length > 0 && (
        <ul className="errores">
          {errores.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {sprints.length > 0 && (
        <p className="resumen">
          {T.resumenSprints}{' '}
          {sprints.map((s) => (s.esFinal ? `${s.aFalta} (${T.final})` : s.aFalta)).join(', ')}.
          {participantes.length > 0 && ` ${participantes.length} ${T.participantes}`}
          {delEquipo > 0 && ` (${delEquipo} ${T.delEquipo})`}
          {participantes.length > 0 && '.'}
        </p>
      )}

      <button className="boton-principal" disabled={!sePuedeEmpezar} onClick={empezar}>
        {T.empezar}
      </button>
    </main>
  )
}
