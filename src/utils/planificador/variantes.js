/**
 * Cómo se llama cada versión de un proyecto: «Versión 1», «Versión 2»… por orden de creación, o el nombre que le haya puesto quien
 * la hizo («Con batería»), que sustituye al de por defecto.
 */
export function variantLabels(variants) {
    const ordered = [...variants].sort((a, b) => a.created_at.localeCompare(b.created_at));
    return new Map(ordered.map((v, i) => [v.id, v.variant_name.trim() ? v.variant_name.trim() : `Versión ${i + 1}`]));
}
