/*
 * Valores comunes de los diálogos de SweetAlert en toda la aplicación.
 *
 * Antes cada diálogo decidía lo suyo: unos decían «OK» y otros «Aceptar», Cancelar
 * salía a veces a la izquierda y a veces a la derecha, y en los de borrar el foco
 * caía en el botón rojo (con Intro se borraba). Lo que un diálogo indique a mano
 * se respeta; solo se rellena lo que no dice:
 * - «Aceptar» y «Cancelar» en castellano.
 * - Cancelar a la izquierda y la acción a la derecha, como en los pies de los modales.
 * - En los de peligro (botón rojo), el foco empieza en Cancelar.
 * Los avisos pequeños (toasts) no se tocan.
 */
const ROJO_PELIGRO = ['#d33', '#dd3333', '#dc3545'];

export function conValoresAura(args) {
  let opciones;
  if (args.length === 1 && args[0] && typeof args[0] === 'object') {
    opciones = { ...args[0] };
  } else {
    // Forma corta: fire(título, html, icono)
    const [title, html, icon] = args;
    opciones = { title, html, icon };
  }
  if (opciones.toast) return opciones;
  if (opciones.confirmButtonText === undefined) opciones.confirmButtonText = 'Aceptar';
  if (opciones.showCancelButton) {
    if (opciones.cancelButtonText === undefined) opciones.cancelButtonText = 'Cancelar';
    if (opciones.reverseButtons === undefined) opciones.reverseButtons = true;
    const peligro = ROJO_PELIGRO.includes(String(opciones.confirmButtonColor || '').toLowerCase());
    if (peligro && opciones.focusCancel === undefined && opciones.focusConfirm === undefined) opciones.focusCancel = true;
  }
  return opciones;
}

/** Aplica los valores comunes a Swal.fire (también a quien importa sweetalert2 directamente). */
export function instalarDialogos(Swal) {
  if (Swal.__valoresAura) return;
  const fireOriginal = Swal.fire.bind(Swal);
  Swal.fire = (...args) => fireOriginal(conValoresAura(args));
  Swal.__valoresAura = true;
}
