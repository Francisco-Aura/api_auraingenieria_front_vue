const CLAVE = 'tema'

export function aplicarTema(tema) {
  document.documentElement.classList.toggle('tema-oscuro', tema === 'oscuro')
  try { localStorage.setItem(CLAVE, tema) } catch (e) { /* sin almacenamiento: no se recuerda */ }
}

export function alternarTema() {
  aplicarTema(document.documentElement.classList.contains('tema-oscuro') ? 'claro' : 'oscuro')
}

let guardado = 'claro'
try { guardado = localStorage.getItem(CLAVE) || 'claro' } catch (e) { /* ignorar */ }
aplicarTema(guardado)