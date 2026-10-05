// Gestión de los juegos de dorsales del equipo: crear, editar, duplicar (para una temporada nueva) y borrar.

import { useState } from 'react'
import { leerEquipo, textoEquipo, type JuegoDorsales } from '../modelo/equipo'
import { TEXTOS } from '../textos'

const T = TEXTOS.juegos

interface Props {
  juegos: JuegoDorsales[]
  alCambiar: (juegos: JuegoDorsales[]) => void
  alVolver: () => void
}

/** Lo que se está escribiendo en el formulario. `id` es null si el juego aún no existe. */
interface Borrador {
  id: string | null
  nombre: string
  texto: string
}

export function PantallaJuegos({ juegos, alCambiar, alVolver }: Props) {
  const [borrador, setBorrador] = useState<Borrador | null>(null)

  if (borrador === null) {
    return (
      <main className="pantalla">
        <h1>{T.titulo}</h1>
        <p className="ayuda">{T.ayuda}</p>
        {juegos.length === 0 && <p>{T.ninguno}</p>}
        <ul className="lista-juegos">
          {juegos.map((juego) => (
            <li key={juego.id}>
              <span>
                <strong>{juego.nombre}</strong> · {T.patinadores(juego.miembros.length)}
              </span>
              <button onClick={() => setBorrador({ id: juego.id, nombre: juego.nombre, texto: textoEquipo(juego.miembros) })}>
                {T.editar}
              </button>
              <button onClick={() => setBorrador({ id: null, nombre: T.copia(juego.nombre), texto: textoEquipo(juego.miembros) })}>
                {T.duplicar}
              </button>
            </li>
          ))}
        </ul>
        <div className="acciones">
          <button className="boton-principal" onClick={() => setBorrador({ id: null, nombre: '', texto: '' })}>
            {T.nuevo}
          </button>
          <button onClick={alVolver}>{T.volver}</button>
        </div>
      </main>
    )
  }

  const { miembros, errores } = leerEquipo(borrador.texto)
  const sePuedeGuardar = borrador.nombre.trim() !== '' && miembros.length > 0 && errores.length === 0

  function guardar() {
    if (borrador === null) return
    const juego: JuegoDorsales = { id: borrador.id ?? crypto.randomUUID(), nombre: borrador.nombre.trim(), miembros }
    const existe = juegos.some((j) => j.id === juego.id)
    alCambiar(existe ? juegos.map((j) => (j.id === juego.id ? juego : j)) : [...juegos, juego])
    setBorrador(null)
  }

  function borrar() {
    if (borrador?.id && window.confirm(T.confirmarBorrar(borrador.nombre))) {
      alCambiar(juegos.filter((j) => j.id !== borrador.id))
      setBorrador(null)
    }
  }

  return (
    <main className="pantalla">
      <h1>{T.titulo}</h1>
      <div className="formulario">
        <label className="campo campo-ancho">
          {T.nombre}
          <input value={borrador.nombre} onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })} placeholder={T.nombreEjemplo} />
        </label>
        <label className="campo campo-ancho">
          {T.miembros}
          <textarea rows={10} value={borrador.texto} onChange={(e) => setBorrador({ ...borrador, texto: e.target.value })} placeholder={'12 Adrián\n15 Lucía'} />
          <small>{T.miembrosAyuda}</small>
        </label>
      </div>
      {errores.length > 0 && (
        <ul className="errores">
          {errores.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      {miembros.length > 0 && <p className="resumen">{T.patinadores(miembros.length)}</p>}
      <div className="acciones">
        <button className="boton-principal" onClick={guardar} disabled={!sePuedeGuardar}>
          {T.guardar}
        </button>
        {borrador.id && (
          <button className="peligro" onClick={borrar}>
            {T.borrar}
          </button>
        )}
        <button onClick={() => setBorrador(null)}>{T.cancelar}</button>
      </div>
    </main>
  )
}
