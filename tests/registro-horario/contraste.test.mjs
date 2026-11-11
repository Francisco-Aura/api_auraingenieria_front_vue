import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * Contraste AA de los pares texto/fondo declarados en RegistroHorarioComponent.css, en claro y en oscuro.
 * Las variables son `var(--de-la-intranet, #reserva)`: se comprueba el valor de reserva, que es el actual de la intranet.
 */
const css = readFileSync(new URL('../../src/components/CRM_Module/RegistroHorario/RegistroHorarioComponent.css', import.meta.url), 'utf8')

function variables(selector) {
  const inicio = css.indexOf(selector + ' {')
  assert.ok(inicio >= 0, `no está el bloque ${selector}`)
  const bloque = css.slice(inicio).split('}')[0]
  return Object.fromEntries([...bloque.matchAll(/--([\w-]+):\s*(?:var\([^,)]+,\s*)?(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]))
}

function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contraste = (a, b) => {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

const claro = variables('.registro-horario')
const oscuro = { ...claro, ...variables('html.tema-oscuro .registro-horario') }

// [texto, fondo, mínimo]
const PARES = [
  ['rh-texto', 'rh-fondo', 4.5], ['rh-texto', 'rh-tarjeta', 4.5], ['rh-texto', 'rh-campo', 4.5],
  ['rh-suave', 'rh-tarjeta', 4.5], ['rh-suave', 'rh-fondo', 4.5], ['rh-suave', 'rh-campo', 4.5],
  // botón principal (amarillo con texto negro) y botones de contorno al pasar el ratón
  ['rh-sobre-acento', 'rh-acento', 4.5], ['rh-sobre-acento', 'rh-acento-h', 4.5],
  ['rh-enlace', 'rh-tarjeta', 4.5], ['rh-enlace', 'rh-fondo', 4.5],
  ['rh-aviso', 'rh-aviso-fondo', 4.5], ['rh-error', 'rh-error-fondo', 4.5], ['rh-ok', 'rh-ok-fondo', 4.5],
  ['rh-error', 'rh-tarjeta', 4.5], ['rh-deshabilitado', 'rh-tarjeta', 4.5],
  ['e-MANANA-fg', 'e-MANANA-bg', 4.5], ['e-TARDE-fg', 'e-TARDE-bg', 4.5], ['e-FESTIVO-fg', 'e-FESTIVO-bg', 4.5],
  ['e-VACACIONES-fg', 'e-VACACIONES-bg', 4.5], ['e-PERMISO-fg', 'e-PERMISO-bg', 4.5],
  ['e-ENFERMEDAD-fg', 'e-ENFERMEDAD-bg', 4.5], ['e-LIBRE-fg', 'e-LIBRE-bg', 4.5], ['e-APAGADO-fg', 'e-APAGADO-bg', 4.5],
  // bordes de los controles, foco y día de hoy frente a lo que tienen detrás (3:1, WCAG 1.4.11)
  ['rh-borde-control', 'rh-tarjeta', 3], ['rh-borde-control', 'rh-campo', 3],
  ['rh-foco', 'rh-tarjeta', 3], ['rh-foco', 'rh-campo', 3], ['rh-foco', 'rh-fondo', 3]
]

for (const [nombre, v] of [['claro', claro], ['oscuro', oscuro]]) {
  for (const [fg, bg, minimo] of PARES) {
    test(`contraste AA en tema ${nombre}: ${fg} sobre ${bg} ≥ ${minimo}:1`, () => {
      assert.ok(v[fg], `falta --${fg}`)
      assert.ok(v[bg], `falta --${bg}`)
      const c = contraste(v[fg], v[bg])
      assert.ok(c >= minimo, `${fg} ${v[fg]} sobre ${bg} ${v[bg]}: ${c.toFixed(2)}:1`)
    })
  }
}
