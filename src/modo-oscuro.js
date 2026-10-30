const CLAVE = 'tema'

export function temaActual() {
  return document.documentElement.classList.contains('tema-oscuro') ? 'oscuro' : 'claro'
}

export function aplicarTema(tema) {
  document.documentElement.classList.toggle('tema-oscuro', tema === 'oscuro')
  try { localStorage.setItem(CLAVE, tema) } catch (e) { /* sin almacenamiento: no se recuerda */ }
}

export function alternarTema() {
  aplicarTema(temaActual() === 'oscuro' ? 'claro' : 'oscuro')
}

// Al cargar, se aplica el tema que se guardó la última vez
let guardado = 'claro'
try { guardado = localStorage.getItem(CLAVE) || 'claro' } catch (e) { /* ignorar */ }
aplicarTema(guardado)