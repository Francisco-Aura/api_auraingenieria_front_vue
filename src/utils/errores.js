/*
 * Mensajes de error del servidor.
 *
 * El backend responde con un motivo escrito para el usuario ({ error: "El CIF ya
 * existe" }, y a veces { detalles: [...] }). Muchas pantallas lo descartaban y
 * mostraban una frase genérica del tipo «No se pudo guardar. Inténtelo de nuevo»,
 * que no dice qué corregir. Estas dos funciones lo recuperan; si el servidor no
 * dice nada (caída de red, 500 sin cuerpo), se queda la frase de siempre.
 */

/** Motivo legible que devuelve el backend, o cadena vacía si no hay ninguno. */
export function detalleApi(error) {
  const data = error?.response?.data;
  let texto = '';
  if (data && typeof data === 'object' && typeof data.error === 'string') texto = data.error;
  else if (typeof data === 'string') texto = data.trim();
  if (Array.isArray(data?.detalles) && data.detalles.length) {
    texto = texto ? `${texto}: ${data.detalles.join(' · ')}` : data.detalles.join(' · ');
  }
  return texto;
}

/** Frase base + el motivo del servidor si lo hay. */
export function textoError(error, base) {
  const detalle = detalleApi(error);
  return detalle ? `${base} ${detalle}` : base;
}
