/**
 * Cómo se llama cada variante de un proyecto: «v1», «v2»… por orden de creación y, si quien la hizo le puso nombre, «v2 · Con
 * batería». El número deja ver de un vistazo en qué orden se fueron haciendo.
 */
export function variantLabels(variants) {
    const ordered = [...variants].sort((a, b) => a.created_at.localeCompare(b.created_at));
    return new Map(ordered.map((v, i) => [v.id, v.variant_name.trim() ? `v${i + 1} · ${v.variant_name.trim()}` : `v${i + 1}`]));
}
