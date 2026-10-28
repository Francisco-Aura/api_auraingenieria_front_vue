#!/usr/bin/env node
/*
 * Genera el modo oscuro de los colores escritos a mano en el CSS de la intranet.
 *
 * Recorre los .css (y los <style> sin `src` de los .vue) de `src/`, y por cada regla con colores claros u
 * oscuros neutros escribe otra regla igual, precedida de `html.tema-oscuro`, con esos colores convertidos:
 *   - fondos claros  -> fondos oscuros del mismo tono (el blanco pasa al azul pizarra del tema)
 *   - bordes claros  -> bordes oscuros
 *   - textos oscuros -> textos claros (los colores vivos se aclaran para que se lean)
 * Lo que ya es oscuro, vivo o translúcido (botones amarillos, rojos, verdes, sombras, velos) no se toca, y el
 * color del texto no se cambia en una regla cuyo fondo se queda como estaba (por ejemplo, texto negro sobre amarillo).
 *
 * No modifica ningún archivo existente: solo escribe `src/styles/tema-oscuro.generated.css`.
 *
 * Uso (desde la carpeta de la intranet):
 *     node scripts/generar-tema-oscuro.js
 * Opcional:  node scripts/generar-tema-oscuro.js <carpeta-src> <archivo-salida>
 *
 * Hay que volver a ejecutarlo cuando cambien los colores de algún CSS.
 */
'use strict'

const fs = require('fs')
const path = require('path')

const SRC = path.resolve(process.argv[2] || path.join(__dirname, '..', 'src'))
const OUT = path.resolve(process.argv[3] || path.join(SRC, 'styles', 'tema-oscuro.generated.css'))
const SKIP_FILES = new Set(['tokens.css', 'tema-oscuro.css', 'tema-oscuro.generated.css'])
const PREFIX = 'html.tema-oscuro'
// Reglas cuyo selector coincida con alguna de estas expresiones no se convierten (p. ej. /\.mi-interruptor/)
const EXCLUDE_SELECTORS = []

// ---------------------------------------------------------------------------------------------- color

function parseColor(raw) {
  const s = raw.trim().toLowerCase()
  if (s === 'white') return { r: 255, g: 255, b: 255, a: 1 }
  if (s === 'black') return { r: 0, g: 0, b: 0, a: 1 }
  let m = /^#([0-9a-f]{3,8})$/.exec(s)
  if (m) {
    let h = m[1]
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('')
    if (h.length !== 6 && h.length !== 8) return null
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    }
  }
  m = /^rgba?\(([^)]*)\)$/.exec(s)
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean)
    if (parts.length < 3) return null
    const ch = parts.slice(0, 3).map((p) => (p.endsWith('%') ? Math.round(parseFloat(p) * 2.55) : parseFloat(p)))
    if (ch.some(Number.isNaN)) return null
    let a = 1
    if (parts[3] !== undefined) {
      a = parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3])
      if (Number.isNaN(a)) a = 1
    }
    return { r: ch[0], g: ch[1], b: ch[2], a }
  }
  return null
}

function toHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return { h, s, l }
}

function fromHsl(h, s, l, a) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const to = (v) => Math.max(0, Math.min(255, Math.round((v + m) * 255)))
  if (a < 0.995) return `rgba(${to(r)}, ${to(g)}, ${to(b)}, ${Math.round(a * 100) / 100})`
  return '#' + [to(r), to(g), to(b)].map((v) => v.toString(16).padStart(2, '0')).join('')
}

const clamp01 = (v) => Math.max(0, Math.min(1, v))

/** Fondo claro -> fondo oscuro del mismo tono. null = no se toca. */
function darkBackground(color) {
  if (color.a < 0.6) return null
  const { h, s, l } = toHsl(color)
  if (l < 0.72) return null
  const neutral = s < 0.12
  return fromHsl(neutral ? 213 : h, neutral ? 0.18 : Math.min(s * 0.5, 0.4), 0.13 + (1 - l) * 0.7, color.a)
}

/** Borde claro -> borde oscuro. */
function darkBorder(color) {
  if (color.a < 0.6) return null
  const { h, s, l } = toHsl(color)
  if (l < 0.72) return null
  const neutral = s < 0.12
  return fromHsl(neutral ? 213 : h, neutral ? 0.16 : Math.min(s * 0.5, 0.4), 0.22 + (1 - l) * 0.8, color.a)
}

/** Texto oscuro -> claro; el vivo se aclara; el blanco y el amarillo de marca se quedan. */
function lightText(color) {
  if (color.a < 0.5) return null
  const { h, s, l } = toHsl(color)
  if (l >= 0.85) return null
  if (s <= 0.35) {
    const neutral = s < 0.08
    return fromHsl(neutral ? 213 : h, neutral ? 0.12 : s * 0.8, clamp01(0.95 - 0.55 * l), color.a)
  }
  if (h >= 38 && h <= 58 && s > 0.8 && l >= 0.4) return null
  if (l < 0.62) return fromHsl(h, Math.min(s, 0.85), Math.min(0.82, Math.max(0.68, l + 0.3)), color.a)
  return null
}

// `white` y `black` solo cuentan como color si no son parte de un nombre (p. ej. `var(--white)` no es un color)
const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|(?<![\w-])(?:white|black)(?![\w-])/g

function mapValue(value, mapper) {
  let changed = false
  let keptOpaque = false
  // `color-mix(in srgb, #f59e0b 24%, transparent)` es un tinte translúcido: su color no es un fondo vivo
  const inMix = /color-mix\(/i.test(value)
  const out = value.replace(COLOR_RE, (token) => {
    const color = parseColor(token)
    if (!color) return token
    const mapped = mapper(color)
    if (mapped) {
      changed = true
      return mapped
    }
    if (color.a >= 0.6 && !inMix) keptOpaque = true
    return token
  })
  return { value: out, changed, keptOpaque }
}

// ---------------------------------------------------------------------------------------------- reglas

const BG_PROP = /^background(-color|-image)?$/
const BORDER_PROP = /^(border(-top|-right|-bottom|-left)?(-color)?|outline(-color)?)$/
const TEXT_PROP = /^(color|fill|stroke|caret-color|text-decoration-color)$/
// Variables oscuras que algunas reglas usan como COLOR DE TEXTO: en modo oscuro el texto es el del tema
const DARK_TEXT_VAR = /var\(--(color-text-dark|secondary-color)\)/g
// Variables que son un color vivo u oscuro (el texto de esa regla se pensó para ese fondo)
const COLORED_VAR = /var\(--(primary(?!-light)|color-brand|color-orange|success|danger|warning|info|accent|secondary-color|color-danger|color-success|color-text-dark|color-action)/

function darkDeclarations(decls) {
  const out = []
  let backgroundStays = false

  for (const d of decls) {
    if (!BG_PROP.test(d.prop)) continue
    if (/url\(/i.test(d.value) || COLORED_VAR.test(d.value)) {
      backgroundStays = true
      continue
    }
    const r = mapValue(d.value, darkBackground)
    if (r.changed) out.push({ ...d, value: r.value })
    if (r.keptOpaque) backgroundStays = true
  }
  for (const d of decls) {
    if (BORDER_PROP.test(d.prop)) {
      const r = mapValue(d.value, darkBorder)
      if (r.changed) out.push({ ...d, value: r.value })
    } else if (TEXT_PROP.test(d.prop) && !backgroundStays) {
      const r = mapValue(d.value, lightText)
      const v = r.value.replace(DARK_TEXT_VAR, 'var(--color-text)')
      if (r.changed || v !== d.value) out.push({ ...d, value: v })
    }
  }
  return out
}

// ---------------------------------------------------------------------------------------------- análisis del CSS

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

function matchingBrace(text, open) {
  let depth = 0
  let quote = null
  for (let i = open; i < text.length; i++) {
    const ch = text[i]
    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = null
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

function parseDeclarations(body) {
  const decls = []
  let depth = 0
  let quote = null
  let start = 0
  const flush = (end) => {
    const chunk = body.slice(start, end).trim()
    start = end + 1
    const colon = chunk.indexOf(':')
    if (colon < 1) return
    const prop = chunk.slice(0, colon).trim().toLowerCase()
    let value = chunk.slice(colon + 1).trim()
    const important = /!\s*important\s*$/i.test(value)
    if (important) value = value.replace(/!\s*important\s*$/i, '').trim()
    if (prop && value && !prop.startsWith('--')) decls.push({ prop, value, important })
  }
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = null
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (ch === ';' && depth === 0) flush(i)
  }
  flush(body.length)
  return decls
}

function splitSelectors(list) {
  const parts = []
  let depth = 0
  let start = 0
  for (let i = 0; i < list.length; i++) {
    const ch = list[i]
    if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    else if (ch === ',' && depth === 0) {
      parts.push(list.slice(start, i))
      start = i + 1
    }
  }
  parts.push(list.slice(start))
  return parts.map((s) => s.trim()).filter(Boolean)
}

function prefixSelector(selector) {
  const s = selector
    .replace(/::v-deep\(([^)]*)\)/g, '$1')
    .replace(/:deep\(([^)]*)\)/g, '$1')
    .replace(/:global\(([^)]*)\)/g, '$1')
    .replace(/(::v-deep|>>>|\/deep\/)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!s || /^(html|:root)(?![\w-])/.test(s)) return null
  return `${PREFIX} ${s}`
}

let ruleCount = 0

function convertBlock(css, indent) {
  const lines = []
  let i = 0
  while (i < css.length) {
    while (i < css.length && /\s/.test(css[i])) i++
    if (i >= css.length) break
    let j = i
    let depth = 0
    while (j < css.length && !((css[j] === '{' || css[j] === ';') && depth === 0)) {
      if (css[j] === '(') depth++
      else if (css[j] === ')') depth--
      j++
    }
    if (j >= css.length) break
    const prelude = css.slice(i, j).trim()
    if (css[j] === ';') {
      i = j + 1
      continue
    }
    const close = matchingBrace(css, j)
    if (close < 0) break
    const body = css.slice(j + 1, close)
    i = close + 1

    if (prelude.startsWith('@')) {
      if (/^@(media|supports|layer)\b/i.test(prelude)) {
        const inner = convertBlock(body, indent + '  ')
        if (inner.length) lines.push(`${indent}${prelude} {`, ...inner, `${indent}}`)
      }
      continue
    }
    const selectors = splitSelectors(prelude)
      .filter((sel) => !EXCLUDE_SELECTORS.some((re) => re.test(sel)))
      .map(prefixSelector)
      .filter(Boolean)
    if (!selectors.length) continue
    const decls = darkDeclarations(parseDeclarations(body))
    if (!decls.length) continue
    ruleCount++
    lines.push(`${indent}${selectors.join(`,\n${indent}`)} {`)
    for (const d of decls) lines.push(`${indent}  ${d.prop}: ${d.value}${d.important ? ' !important' : ''};`)
    lines.push(`${indent}}`)
  }
  return lines
}

// ---------------------------------------------------------------------------------------------- archivos

function walk(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, found)
    else if (/\.(css|vue)$/i.test(entry.name) && !SKIP_FILES.has(entry.name)) found.push(full)
  }
  return found
}

function cssOf(file) {
  const text = fs.readFileSync(file, 'utf8')
  if (!file.endsWith('.vue')) return text
  const blocks = []
  const re = /<style(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/style>/gi
  let m
  while ((m = re.exec(text))) blocks.push(m[1])
  return blocks.join('\n')
}

const files = walk(SRC).sort()
const parts = [
  '/*',
  ' * GENERADO por scripts/generar-tema-oscuro.js: no se edita a mano.',
  ' * Colores claros/oscuros escritos a mano en los CSS, convertidos para el modo oscuro (html.tema-oscuro).',
  ' * Para regenerarlo:  node scripts/generar-tema-oscuro.js',
  ' */',
  '',
]
let withRules = 0
for (const file of files) {
  const before = ruleCount
  const lines = convertBlock(stripComments(cssOf(file)), '')
  if (ruleCount > before) {
    withRules++
    parts.push(`/* ---- ${path.relative(SRC, file).replace(/\\/g, '/')} ---- */`, ...lines, '')
  }
}
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, parts.join('\n'), 'utf8')
console.log(`Listo: ${ruleCount} reglas de ${withRules} archivos (de ${files.length} revisados) -> ${path.relative(process.cwd(), OUT)}`)
