// Clasificación en directo para el panel de la carrera, al estilo de la torre de tiempos de la F1:
// puesto, dorsal, nombre, puntos y distancia al líder. Los que no terminan van abajo con un código corto.

import { clubDe, esNuestro } from '../modelo/clubes'
import type { CuentasEnDirecto } from '../modelo/cuentas'
import type { EstadoPatinador } from '../modelo/clasificacion'
import { TEXTOS } from '../textos'
import { estiloClub } from './estiloClub'

const T = TEXTOS.clasificacion

export function ClasificacionEnVivo({ cuentas }: { cuentas: CuentasEnDirecto }) {
  const { clasificacion, lider, liderAsegurado, porPatinador } = cuentas
  // Se listan los que tienen puntos y, aunque tengan 0, los de nuestro equipo.
  // El resto empata a 0 y ocuparía media pantalla.
  const enTorre = clasificacion.filas.filter((f) => f.estado === 'en-carrera' && (f.puntos > 0 || esNuestro(f)))
  const noTerminan = clasificacion.filas.filter((f) => f.estado !== 'en-carrera')

  return (
    <section className="tarjeta torre" aria-label={T.titulo}>
      <header className="torre-cabecera">
        <h2>{T.titulo}</h2>
        <span className="etiqueta">{T.columnas}</span>
      </header>

      <div className="torre-filas">
        {enTorre.length === 0 && noTerminan.length === 0 && <p className="ayuda">{T.nadie}</p>}

        {enTorre.map((fila) => {
          const cuentasFila = porPatinador.find((c) => c.dorsal === fila.dorsal)!
          const esLider = fila.dorsal === lider
          let distancia = <span className="distancia">−{cuentasFila.puntosHastaLider}</span>
          if (esLider) distancia = <span className="distancia lider">{liderAsegurado ? T.asegurado : T.lider}</span>
          else if (!cuentasFila.puedeAlcanzarLider) distancia = <span className="distancia sin-opciones">{T.fueraDeAlcance}</span>
          return (
            <div key={fila.dorsal} className={esNuestro(fila) ? 'fila-torre equipo' : 'fila-torre'}>
              {/* Con 0 puntos no hay puesto: todos los que no han puntuado empatan. */}
              <span className="puesto">{fila.puntos > 0 ? fila.puesto : '·'}</span>
              <span className="raya" style={estiloClub(clubDe(fila))} />
              <span className="numero">{fila.dorsal}</span>
              <span className="nombre">{fila.nombre}</span>
              <span className="puntos">{fila.puntos}</span>
              {distancia}
            </div>
          )
        })}

        {noTerminan.map((fila) => (
          <div key={fila.dorsal} className={esNuestro(fila) ? 'fila-torre fuera equipo' : 'fila-torre fuera'}>
            <span className="puesto" />
            <span className="raya" style={estiloClub(clubDe(fila))} />
            <span className="numero">{fila.dorsal}</span>
            <span className="nombre">{fila.nombre}</span>
            <span className="puntos">0</span>
            <span className="distancia">{TEXTOS.codigos[fila.estado as Exclude<EstadoPatinador, 'en-carrera'>]}</span>
          </div>
        ))}
      </div>

      {liderAsegurado && <p className="nota">{T.notaAsegurado}</p>}

      {clasificacion.avisos.length > 0 && (
        <ul className="errores">
          {clasificacion.avisos.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
