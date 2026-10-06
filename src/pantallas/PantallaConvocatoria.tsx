// Antes de empezar una carrera de liga, se elige quién de San Juan corre, como quien elige personajes en un juego.
// Salen todos marcados; al tocar una carta se apaga y ese dorsal no aparecerá en la rejilla ni en la clasificación.

import type { Dorsal, Participante } from '../modelo/tipos'
import { TEXTOS } from '../textos'

const T = TEXTOS.convocatoria

interface Props {
  nombreCarrera: string
  /** Patinadores de San Juan inscritos en la división. */
  nuestros: Participante[]
  /** Dorsales que no corren. */
  fuera: ReadonlySet<Dorsal>
  alCambiar: (fuera: Set<Dorsal>) => void
  alEmpezar: () => void
  alVolver: () => void
}

/** Hueco de la foto, mientras no haya fotos de cada uno. */
function Silueta() {
  return (
    <svg className="silueta" viewBox="0 0 100 110" aria-hidden="true">
      <circle cx="50" cy="30" r="20" />
      <path d="M8 110c0-28 19-46 42-46s42 18 42 46z" />
    </svg>
  )
}

export function PantallaConvocatoria({ nombreCarrera, nuestros, fuera, alCambiar, alEmpezar, alVolver }: Props) {
  const corren = nuestros.filter((p) => !fuera.has(p.dorsal)).length

  function alternar(dorsal: Dorsal) {
    const nuevo = new Set(fuera)
    if (nuevo.has(dorsal)) nuevo.delete(dorsal)
    else nuevo.add(dorsal)
    alCambiar(nuevo)
  }

  return (
    <main className="convocatoria">
      <header className="barra">
        <h1>
          {T.titulo} <span className="sub">{nombreCarrera}</span>
        </h1>
        <button className="chip" onClick={() => alCambiar(new Set())} disabled={fuera.size === 0}>
          {T.marcarTodos}
        </button>
        <button className="chip" onClick={alVolver}>
          {T.volver}
        </button>
      </header>

      <div className="cartas">
        {nuestros.map((p) => {
          const corre = !fuera.has(p.dorsal)
          const [nombre, ...apellidos] = (p.nombre ?? '').split(' ')
          return (
            <button
              key={p.dorsal}
              className="carta"
              aria-pressed={corre}
              aria-label={`${p.nombre ?? ''}, ${p.dorsal}`}
              onClick={() => alternar(p.dorsal)}
            >
              <span className="numero">{p.dorsal}</span>
              <span className="codigo">{p.club}</span>
              <span className="estado">{corre ? T.corre : T.noCorre}</span>
              <Silueta />
              <span className="nombre">
                <b>{nombre}</b>
                <span>{apellidos.join(' ')}</span>
              </span>
            </button>
          )
        })}
      </div>

      <footer className="barra-inferior">
        <p className="contador">
          <b>{corren}</b> {T.deCorren(nuestros.length)}
        </p>
        <button className="boton-principal" onClick={alEmpezar}>
          {T.empezar}
        </button>
      </footer>
    </main>
  )
}
