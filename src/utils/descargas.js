/*
 * Descarga de archivos en el navegador.
 *
 * El patrón (crear un blob, colgar un enlace invisible, pulsarlo y quitarlo) estaba
 * copiado en cinco sitios y dos de ellos —los PDF de contrato— no llamaban a
 * `revokeObjectURL`: cada descarga dejaba el archivo entero retenido en memoria
 * hasta recargar la página.
 */

/** Nombre propuesto por el servidor en la cabecera Content-Disposition, si lo hay. */
export function nombreDeCabecera(cabeceras, alternativo) {
  const disposicion = String((cabeceras && (cabeceras['content-disposition'] || cabeceras['Content-Disposition'])) || '');
  // Entre comillas el nombre puede llevar «;» («Acta; reunión.pdf» se quedaba en «Acta»)
  const coincidencia = disposicion.match(/filename="([^"\n]+)"/) || disposicion.match(/filename=([^";\n]+)/);
  return coincidencia ? coincidencia[1].trim() : alternativo;
}

/** Descarga el contenido con el nombre indicado y libera el blob al terminar. */
export function descargarBlob(contenido, nombreArchivo) {
  const blob = contenido instanceof Blob ? contenido : new Blob([contenido]);
  const url = window.URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.URL.revokeObjectURL(url);
}

/** Descarga la respuesta de axios (responseType: 'blob') respetando su nombre. */
export function descargarRespuesta(respuesta, nombreAlternativo) {
  descargarBlob(respuesta.data, nombreDeCabecera(respuesta.headers, nombreAlternativo));
}
