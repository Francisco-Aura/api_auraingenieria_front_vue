// Cómo se escriben los importes y datos del contrato en las pantallas (equivale a lo que exportaba ChangesView.tsx).

// useGrouping «always»: en español el separador de miles no sale por defecto con 4 cifras (1200 → 1200).
const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', useGrouping: 'always' })

export const dinero = (n) => euros.format(n)

/** «+1.200,00 €» / «−150,00 €» (con el signo delante; sin signo si es cero). */
export const conSigno = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${euros.format(Math.abs(n))}`

/** Un dato del contrato tal y como se enseña: los importes en euros, el resto tal cual y «—» si no hay valor. */
export function formatoValor(campo, valor) {
  if (valor === null || valor === undefined || valor === '') return '—'
  if (campo && campo.type === 'money') return euros.format(Number(valor))
  return String(valor)
}

/** «Batería (si aplica)» se enseña como «Batería» dentro de una tarea. */
export const etiquetaTarea = (etiqueta) => etiqueta.replace(/\s*\(si aplica\)/i, '')

/** Los campos del contrato como los usan los formularios (todo texto). */
export function formularioDeContrato(campos, valores = {}) {
  return Object.fromEntries(campos.map((c) => [c.key, String(valores[c.key] ?? '')]))
}

/** Lo que se guarda de un cambio al volver a enviarlos todos: sin esto se perdería su presupuesto y su forma de cobro. */
export const entradaDeCambio = (c) => ({
  id: c.id, date: c.date, reason: c.reason, impact: c.impact, set: c.set, budget: c.budget ?? null, payment_mode: c.payment_mode
})
