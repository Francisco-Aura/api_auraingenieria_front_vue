// Cómo se llama la carpeta de un proyecto en Dropbox: «aammdd_EMPRESA_LUGAR» (p. ej. 260202_ALPEMA_PUNTA BALLENA).
// Solo funciones puras (sin React ni red).
/** «260201_BONAQUIA» → «BONAQUIA»: el nombre sin el prefijo de fecha. */
export const withoutDatePrefix = (folder) => folder.replace(/^\d{6}_/, '');
/** «…/2026/260202_ALPEMA_PUNTA BALLENA» → «ALPEMA_PUNTA BALLENA»: cómo se llama el proyecto en Dropbox, sin la fecha. */
export const projectLabelOf = (dropboxPath) => withoutDatePrefix(dropboxPath.replace(/\/+$/, '').split('/').pop() ?? '');
// Formas jurídicas al final del nombre: S.L., S.L.U., S.A., S.A.U., S.L.L., S.COOP, C.B. (con o sin puntos y espacios)
const LEGAL_FORM = /[,\s]+(S\.?\s?L\.?\s?U\.?|S\.?\s?L\.?\s?L\.?|S\.?\s?A\.?\s?U\.?|S\.?\s?COOP\.?|S\.?\s?L\.?|S\.?\s?A\.?|C\.?\s?B\.?)\s*$/i;
/** «BONAQUIA, S.L. (CAMPING DEL AGUA)» → «BONAQUIA»: la empresa en corto, sin forma jurídica ni lo que va entre paréntesis. */
export function shortCompany(name) {
    const base = name.replace(/\([^)]*\)/g, ' ').trim().toUpperCase();
    return base
        .replace(LEGAL_FORM, '')
        .replace(/[.,;:]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
/** «BONAQUIA, S.L. (CAMPING DEL AGUA)» → «CAMPING DEL AGUA»: lo que va entre paréntesis, por si indica el lugar. */
export function suggestedPlace(name) {
    const m = /\(([^)]+)\)/.exec(name);
    return m ? m[1].replace(/\s+/g, ' ').trim().toUpperCase() : '';
}
/** Lo que va tras la fecha en el nombre de la carpeta: «ALPEMA_PUNTA BALLENA» (el lugar es opcional). */
export const folderBase = (company, place) => [company, place]
    .map((part) => part.replace(/\s+/g, ' ').trim().toUpperCase())
    .filter(Boolean)
    .join('_');

/** Ruta de una carpeta de Dropbox sin la carpeta base del servidor (más corta y legible). */
export const relativoABase = (ruta, base) => base && ruta.toLowerCase().startsWith(base.toLowerCase()) ? ruta.slice(base.length).replace(/^\//, '') : ruta;
