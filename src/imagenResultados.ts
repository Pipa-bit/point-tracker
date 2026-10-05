// Dibuja los resultados en una imagen PNG para mandarla por WhatsApp.
// Se usa un <canvas> del navegador: no hace falta ninguna librería.

import type { Resultados } from './resultados'

const ANCHO = 1080
const MARGEN = 60
const ALTO_FILA = 72
const AZUL = '#0047b3'
const FUENTE = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

/** Parte un texto en líneas que quepan en `ancho` píxeles. */
function partirEnLineas(ctx: CanvasRenderingContext2D, texto: string, ancho: number): string[] {
  const lineas: string[] = []
  let actual = ''
  for (const palabra of texto.split(' ')) {
    const prueba = actual ? `${actual} ${palabra}` : palabra
    if (ctx.measureText(prueba).width > ancho && actual) {
      lineas.push(actual)
      actual = palabra
    } else {
      actual = prueba
    }
  }
  if (actual) lineas.push(actual)
  return lineas
}

export function generarImagen(r: Resultados): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)

  // Primero se calcula el alto, porque cambiar el tamaño del canvas lo borra.
  ctx.font = `28px ${FUENTE}`
  const lineasPie = r.pie.flatMap((linea) => partirEnLineas(ctx, linea, ANCHO - 2 * MARGEN))
  const altoCabecera = 200
  canvas.width = ANCHO
  canvas.height = altoCabecera + r.filas.length * ALTO_FILA + 40 + lineasPie.length * 40 + MARGEN

  // Fondo blanco y cabecera azul con el nombre y la fecha.
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = AZUL
  ctx.fillRect(0, 0, ANCHO, altoCabecera - 40)
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.font = `bold 48px ${FUENTE}`
  ctx.fillText(partirEnLineas(ctx, r.titulo, ANCHO - 2 * MARGEN)[0], MARGEN, 65)
  ctx.font = `32px ${FUENTE}`
  ctx.fillText(r.fecha, MARGEN, 120)

  // Una fila por patinador que ha puntuado: puesto, dorsal y nombre, puntos a la derecha.
  let y = altoCabecera
  r.filas.forEach((fila, i) => {
    if (i % 2 === 1) {
      ctx.fillStyle = '#eef3fb'
      ctx.fillRect(0, y, ANCHO, ALTO_FILA)
    }
    const centro = y + ALTO_FILA / 2
    ctx.fillStyle = '#000'
    ctx.textAlign = 'left'
    ctx.font = `36px ${FUENTE}`
    ctx.fillText(fila.puesto, MARGEN, centro)
    ctx.font = `bold 36px ${FUENTE}`
    ctx.fillText(fila.quien, MARGEN + 110, centro)
    ctx.textAlign = 'right'
    ctx.fillText(fila.puntos, ANCHO - MARGEN, centro)
    y += ALTO_FILA
  })

  ctx.textAlign = 'left'
  ctx.fillStyle = '#555'
  ctx.font = `28px ${FUENTE}`
  y += 40
  for (const linea of lineasPie) {
    ctx.fillText(linea, MARGEN, y)
    y += 40
  }

  return new Promise((resolver) => canvas.toBlob(resolver, 'image/png'))
}
