/*
 * Comportamiento común de todos los modales de la aplicación.
 *
 * - Mientras hay un modal abierto, la pantalla de detrás no se desplaza con la rueda
 *   del ratón. El body recibe la clase aura-modal-abierto (overflow: hidden, en
 *   shared-ui.css) y un relleno a la derecha del ancho de la barra de desplazamiento
 *   que desaparece, para que nada dé un salto. Los avisos pequeños (toasts) no
 *   cuentan, y los diálogos de SweetAlert ya hacen lo mismo por su cuenta.
 * - Esc cierra el modal que está encima, igual que su botón de cerrar (con las
 *   mismas preguntas si hay cambios sin guardar). Si hay un diálogo de SweetAlert
 *   abierto, Esc es suyo; si una pantalla ya atiende su Esc, llama a preventDefault.
 */
import Swal from 'sweetalert2';

export const SELECTOR_MODAL = '.modal-overlay, .mcas-modal-overlay, .tareas-panel-overlay, [aria-modal="true"]:not(.swal2-popup)';

const SELECTOR_CERRAR = '.close-button, .btn-close-modal, .btn-close, .modal-close';

let bloqueado = false;

function capasAbiertas() {
  // Solo las que se ven (un v-show oculto no cuenta)
  return [...document.querySelectorAll(SELECTOR_MODAL)].filter((capa) => capa.getClientRects().length > 0);
}

export function actualizarBloqueo() {
  const hayModal = capasAbiertas().length > 0;
  if (hayModal === bloqueado) return;
  bloqueado = hayModal;
  const body = document.body;
  if (hayModal) {
    const barra = window.innerWidth - document.documentElement.clientWidth;
    if (barra > 0) body.style.paddingRight = `${barra}px`;
    body.classList.add('aura-modal-abierto');
  } else {
    body.style.paddingRight = '';
    body.classList.remove('aura-modal-abierto');
  }
}

/** Botón de cerrar del modal que está encima (el último abierto), o null. */
export function cerrarDeLaCapaSuperior() {
  const capas = capasAbiertas();
  for (let i = capas.length - 1; i >= 0; i--) {
    const cerrar = [...capas[i].querySelectorAll(SELECTOR_CERRAR)].find((boton) => boton.closest(SELECTOR_MODAL) === capas[i]);
    if (cerrar) return cerrar;
  }
  return null;
}

export function alPulsarEscape(evento) {
  if (evento.key !== 'Escape' || evento.defaultPrevented || Swal.isVisible()) return;
  const cerrar = cerrarDeLaCapaSuperior();
  if (cerrar && !cerrar.disabled) {
    evento.preventDefault();
    cerrar.click();
  }
}

export function instalarCapasModales() {
  let pendiente = false;
  new MutationObserver(() => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      pendiente = false;
      actualizarBloqueo();
    });
  }).observe(document.body, { childList: true, subtree: true });
  // En window: se atiende después de los Esc propios de cada pantalla (que llaman a
  // preventDefault cuando lo han hecho ellos)
  window.addEventListener('keydown', alPulsarEscape);
}
