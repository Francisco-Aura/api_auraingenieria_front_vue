/*
 * Diálogos SweetAlert2 de las pantallas MCAS con la misma configuración que el
 * resto del CRM (Cartera de Clientes, Puntos de Suministro, Administración):
 * alertas centradas, confirmación en amarillo de marca, cancelación en gris y
 * rojo solo para acciones destructivas. Sin toasts: el patrón de la app para
 * errores y confirmaciones es el diálogo modal.
 */
const COLOR_CONFIRMAR = '#fcd700';
const COLOR_PELIGRO = '#d33';

// El ayudante vive en utils/errores.js: lo usan también Clientes y Tareas.
export { detalleApi, textoError } from '@/utils/errores';

export function mostrarError(swal, titulo, texto) {
  return swal.fire({
    icon: 'error',
    title: titulo,
    text: texto,
    confirmButtonColor: COLOR_CONFIRMAR,
    confirmButtonText: 'Aceptar',
  });
}

export function mostrarExito(swal, titulo, texto) {
  return swal.fire({
    icon: 'success',
    title: titulo,
    text: texto,
    confirmButtonColor: COLOR_CONFIRMAR,
    confirmButtonText: 'Aceptar',
    timer: 2000,
    timerProgressBar: true,
  });
}

export function mostrarAviso(swal, titulo, texto) {
  return swal.fire({
    icon: 'warning',
    title: titulo,
    text: texto,
    confirmButtonColor: COLOR_CONFIRMAR,
    confirmButtonText: 'Entendido',
  });
}

export async function confirmar(swal, { titulo, texto, textoConfirmar = 'Confirmar', peligroso = false, icono }) {
  const { isConfirmed } = await swal.fire({
    icon: icono || (peligroso ? 'warning' : 'question'),
    title: titulo,
    text: texto,
    showCancelButton: true,
    confirmButtonText: textoConfirmar,
    cancelButtonText: 'Cancelar',
    confirmButtonColor: peligroso ? COLOR_PELIGRO : COLOR_CONFIRMAR,
  });
  return isConfirmed;
}

export const COLORES_DIALOGO = { COLOR_CONFIRMAR, COLOR_PELIGRO };
