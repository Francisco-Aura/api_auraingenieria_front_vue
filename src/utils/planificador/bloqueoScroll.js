/**
 * Con una ventana emergente abierta, la pantalla de detrás no se desplaza.
 * Cuenta las ventanas abiertas (puede haber una encima de otra) y solo libera el scroll al cerrar la última.
 * Compensa el ancho de la barra de desplazamiento que desaparece, para que nada dé un salto.
 */
let abiertas = 0
let anterior = null

export function bloquearScroll() {
  abiertas++
  if (abiertas > 1) return
  const html = document.documentElement
  const body = document.body
  const barra = window.innerWidth - html.clientWidth
  anterior = { overflow: html.style.overflow, relleno: body.style.paddingRight }
  html.style.overflow = 'hidden'
  if (barra > 0) body.style.paddingRight = barra + 'px'
}

export function liberarScroll() {
  if (abiertas === 0) return
  abiertas--
  if (abiertas > 0 || !anterior) return
  document.documentElement.style.overflow = anterior.overflow
  document.body.style.paddingRight = anterior.relleno
  anterior = null
}
