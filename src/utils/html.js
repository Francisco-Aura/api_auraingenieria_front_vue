/*
 * Escapado de texto para insertarlo en HTML (p. ej. en `html:` de SweetAlert2,
 * que interpreta el marcado). Todo dato del servidor o del usuario que se meta
 * en una plantilla HTML debe pasar por aquí.
 */
const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escaparHtml(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => ENTIDADES[c]);
}
