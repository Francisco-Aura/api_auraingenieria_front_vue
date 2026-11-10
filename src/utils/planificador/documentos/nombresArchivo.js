// Nombres con los que se guardan los archivos que se suben a una tarea (en Dropbox). El planificador propone uno a
// partir del documento requerido y la persona lo puede cambiar antes de subir (por ejemplo, para poner el número de
// la factura, que solo ella conoce).
const CONTRACT_TAG = 'AURA RENOVABLES';
/** Extensión con su punto («.pdf»), o '' si el nombre no tiene una reconocible. */
export function extensionOf(name) {
    const i = name.lastIndexOf('.');
    return i > 0 && name.length - i <= 8 ? name.slice(i) : '';
}
/** Si el nombre escrito no lleva extensión, se le pone la del archivo original. */
export function withExtension(name, original) {
    const clean = name.trim();
    return extensionOf(clean) ? clean : `${clean}${extensionOf(original)}`;
}
/**
 * Nombre propuesto para un archivo:
 * - el contrato firmado, como en la carpeta de contrato: «CONTRATO INSTALACION FV_AURA RENOVABLES_ALPEMA_PUNTA BALLENA firmado.pdf»;
 * - el resto de documentos requeridos, con el nombre del requisito («Albarán de entrega.pdf»), y con número si ya hay otro
 *   para ese mismo requisito o si son fotos («Fotos de paneles colocados 1.jpg»);
 * - «Otra documentación» (sin requisito): se deja el nombre original.
 */
export function suggestFileName({ requirement, original, projectLabel, existing, }) {
    const label = requirement.trim();
    if (!label)
        return original;
    const ext = extensionOf(original);
    if (/contrato firmado/i.test(label) && projectLabel) {
        return `CONTRATO INSTALACION FV_${CONTRACT_TAG}_${projectLabel} firmado${ext}`;
    }
    const base = label
        .replace(/\s*\((?:mínimo|minimo)[^)]*\)/i, '') // «(mínimo 3)» no es parte del nombre
        .replace(/[<>:"/\\|?*]+/g, '-')
        .trim();
    const numbered = /^fotos?\b/i.test(base) || existing > 0;
    return `${base}${numbered ? ` ${existing + 1}` : ''}${ext}`;
}
