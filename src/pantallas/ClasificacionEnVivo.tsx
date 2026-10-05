// Clasificación en directo para el panel de la carrera: puntos, distancia al líder y si aún puede alcanzarle.

import type { CuentasEnDirecto } from '../modelo/cuentas'
import type { EstadoPatinador } from '../modelo/clasificacion'
import { TEXTOS } from '../textos'

const T = TEXTOS.clasificacion

const ESTADOS: Record<Exclude<EstadoPatinador, 'en-carrera'>, string> = {
  eliminado: T.eliminado,
  abandono: T.abandono,
  descalificado: T.descalificado,
}

export function ClasificacionEnVivo({ cuentas }: { cuentas: CuentasEnDirecto }) {
  const { clasificacion, lider, liderAsegurado, puntosEnJuego, porPatinador } = cuentas
  // Solo se listan los que tienen puntos: el resto empata a 0 y ocuparía media pantalla.
  const conPuntos = clasificacion.filas.filter((f) => f.estado === 'en-carrera' && f.puntos > 0)
  const noTerminan = clasificacion.filas.filter((f) => f.estado !== 'en-carrera')

  return (
    <section className="clasificacion" aria-label={T.titulo}>
      <h2>{T.titulo}</h2>
      <p>
        {T.enJuego}: <strong>{puntosEnJuego}</strong>
      </p>

      {conPuntos.length === 0 ? (
        <p>{T.nadie}</p>
      ) : (
        <table>
          <tbody>
            {conPuntos.map((fila) => {
              const cuentasFila = porPatinador.find((c) => c.dorsal === fila.dorsal)!
              const esLider = fila.dorsal === lider
              return (
                <tr key={fila.dorsal} className={cuentasFila.puedeAlcanzarLider || esLider ? '' : 'sin-opciones'}>
                  <td>{fila.puesto}.º</td>
                  <td className="nombre">{fila.nombre ?? fila.dorsal}</td>
                  <td className="puntos">{fila.puntos}</td>
                  <td className="distancia">
                    {esLider
                      ? liderAsegurado
                        ? T.asegurado
                        : T.lider
                      : cuentasFila.puedeAlcanzarLider
                        ? `−${cuentasFila.puntosHastaLider}`
                        : T.fueraDeAlcance}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {liderAsegurado && <p className="nota">{T.notaAsegurado}</p>}

      {noTerminan.length > 0 && (
        <p className="no-terminan">
          {T.noTerminan}: {noTerminan.map((f) => `${f.nombre ?? f.dorsal} (${ESTADOS[f.estado as keyof typeof ESTADOS]})`).join(', ')}
        </p>
      )}

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
