// Pantalla de resultados al terminar la carrera.
//
// Si hay empates a puntos que la llegada conocida no resuelve, primero pide el orden en que cruzaron
// la meta en la última vuelta. Después muestra la clasificación final y permite compartirla.

import { useEffect, useState } from 'react'
import { generarImagen } from '../imagenResultados'
import { cambiarEstado, resolverDesempate } from '../modelo/acciones'
import { calcularClasificacion } from '../modelo/clasificacion'
import type { Carrera, Dorsal } from '../modelo/tipos'
import { fechaLegible, resultados, textoResultados } from '../resultados'
import { TEXTOS } from '../textos'

const T = TEXTOS.final
const TC = TEXTOS.clasificacion

interface Props {
  carrera: Carrera
  alCambiar: (carrera: Carrera) => void
  alSalir: () => void
  /** 'historial' = se está viendo una carrera antigua: no se puede volver a ella para seguir anotando. */
  modo?: 'actual' | 'historial'
  /** Solo en el historial: quitarla de la lista. */
  alBorrar?: () => void
}

export function PantallaFinal({ carrera, alCambiar, alSalir, modo = 'actual', alBorrar }: Props) {
  // Orden que se va tocando para deshacer el empate que se muestra ahora.
  const [ordenEmpate, setOrdenEmpate] = useState<Dorsal[]>([])
  const [copiado, setCopiado] = useState(false)
  // La imagen se prepara en cuanto cambian los resultados. Así, al pulsar el botón se comparte al instante:
  // Safari solo deja compartir archivos justo después de un toque, sin esperas de por medio.
  const [imagen, setImagen] = useState<File | null>(null)

  const { filas, desempatesPendientes } = calcularClasificacion(carrera)
  const empate = desempatesPendientes[0]
  const conPuntos = filas.filter((f) => f.estado === 'en-carrera' && f.puntos > 0)
  const sinPuntos = filas.filter((f) => f.estado === 'en-carrera' && f.puntos === 0).length
  const noTerminan = filas.filter((f) => f.estado !== 'en-carrera')
  const texto = textoResultados(carrera)
  const estados: Record<string, string> = TC

  useEffect(() => {
    let vigente = true
    generarImagen(resultados(carrera)).then((blob) => {
      if (vigente && blob) setImagen(new File([blob], `resultados-${carrera.fecha}.png`, { type: 'image/png' }))
    })
    // Si los resultados cambian antes de terminar de dibujar, se descarta la imagen vieja.
    return () => {
      vigente = false
    }
  }, [carrera])

  function tocarEmpatado(dorsal: Dorsal) {
    if (!empate || ordenEmpate.includes(dorsal)) return
    const nuevo = [...ordenEmpate, dorsal]
    // Cuando solo queda uno, su puesto es obvio: se añade solo y se guarda.
    if (nuevo.length >= empate.length - 1) {
      const ultimo = empate.filter((d) => !nuevo.includes(d))
      alCambiar(resolverDesempate(carrera, [...nuevo, ...ultimo]))
      setOrdenEmpate([])
    } else {
      setOrdenEmpate(nuevo)
    }
  }

  async function compartir() {
    // En iPad y móvil abre el menú de compartir del sistema (WhatsApp incluido); si no existe, abre WhatsApp web.
    if (navigator.share) {
      try {
        await navigator.share({ text: texto })
      } catch {
        // El usuario ha cerrado el menú sin compartir.
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
    }
  }

  async function compartirImagen() {
    if (!imagen) return
    if (navigator.canShare?.({ files: [imagen] })) {
      try {
        await navigator.share({ files: [imagen] })
      } catch {
        // Menú cerrado sin compartir.
      }
    } else {
      // Sin menú de compartir (p. ej. en un ordenador): se descarga la imagen.
      const enlace = document.createElement('a')
      enlace.href = URL.createObjectURL(imagen)
      enlace.download = imagen.name
      enlace.click()
      URL.revokeObjectURL(enlace.href)
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
    } catch {
      // Sin permiso para el portapapeles: no hay más que hacer.
    }
  }

  const TH = TEXTOS.historialCarreras

  return (
    <main className="pantalla final">
      <h1>
        {T.titulo}: {carrera.nombre}
      </h1>
      <p>{fechaLegible(carrera.fecha)}</p>

      {empate && (
        <section className="empate" aria-label={T.empate(filas.find((f) => f.dorsal === empate[0])!.puntos)}>
          <h2>{T.empate(filas.find((f) => f.dorsal === empate[0])!.puntos)}</h2>
          <p>{T.ayudaEmpate}</p>
          <div className="rejilla-empate">
            {empate.map((dorsal) => {
              const posicion = ordenEmpate.indexOf(dorsal)
              return (
                <button key={dorsal} className="dorsal" aria-pressed={posicion !== -1} onClick={() => tocarEmpatado(dorsal)}>
                  {dorsal}
                  {posicion !== -1 && <span className="marca">{TEXTOS.carrera.puesto(posicion + 1)}</span>}
                </button>
              )
            })}
          </div>
          {ordenEmpate.length > 0 && <button onClick={() => setOrdenEmpate([])}>{T.borrarEmpate}</button>}
          <p className="errores">{T.pendiente}</p>
        </section>
      )}

      <table className="resultados">
        <tbody>
          {conPuntos.map((fila) => (
            <tr key={fila.dorsal}>
              <td>{TEXTOS.carrera.puesto(fila.puesto!)}</td>
              <td className="nombre">
                {fila.dorsal}
                {fila.nombre && ` ${fila.nombre}`}
              </td>
              <td className="puntos">
                {fila.puntos} {T.puntos}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sinPuntos > 0 && <p>{T.sinPuntos(sinPuntos)}</p>}
      {noTerminan.length > 0 && (
        <p>
          {TC.noTerminan}: {noTerminan.map((f) => `${f.nombre ?? f.dorsal} (${estados[f.estado]})`).join(', ')}
        </p>
      )}

      <div className="acciones">
        <button className="boton-principal" onClick={compartir}>
          {T.compartir}
        </button>
        <button className="boton-principal" onClick={compartirImagen} disabled={!imagen}>
          {T.compartirImagen}
        </button>
        <button onClick={copiar}>{copiado ? T.copiado : T.copiar}</button>
        {(carrera.llegadaFinalCompleta?.length ?? 0) > 0 && (
          // Borra el orden anotado para los empates y los vuelve a pedir.
          <button onClick={() => alCambiar({ ...carrera, llegadaFinalCompleta: [] })}>{T.rehacerEmpates}</button>
        )}
        {modo === 'actual' ? (
          <>
            <button onClick={() => alCambiar(cambiarEstado(carrera, 'en-curso'))}>{T.volver}</button>
            {/* Ya está guardada en el historial, así que no hace falta confirmar. */}
            <button onClick={alSalir}>{TEXTOS.carrera.nuevaCarrera}</button>
            <p className="ayuda">{TH.guardada}</p>
          </>
        ) : (
          <>
            <button onClick={alSalir}>{TH.volver}</button>
            <button
              className="peligro"
              onClick={() => {
                if (window.confirm(TH.confirmarBorrar(carrera.nombre))) alBorrar?.()
              }}
            >
              {TH.borrar}
            </button>
          </>
        )}
      </div>
    </main>
  )
}
