// Modo oscuro: lo decide la intranet (guarda `tema` = «claro» u «oscuro» en localStorage). Se lee al cargar y cuando cambia.
const CLAVE = 'tema'

function temaGuardado() {
  try {
    return window.localStorage.getItem(CLAVE) || 'claro'
  } catch (e) {
    return 'claro'
  }
}

function aplicar() {
  document.documentElement.classList.toggle('tema-oscuro', temaGuardado() === 'oscuro')
}

export function iniciarTema() {
  aplicar()
  window.addEventListener('storage', (e) => {
    if (e.key === CLAVE || e.key === null) aplicar()
  })
}
