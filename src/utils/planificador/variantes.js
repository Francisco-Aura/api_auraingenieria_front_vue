/** Cómo se llama cada variante de una oferta: el nombre que le puso quien la hizo o, sin él, «Versión N» por orden de creación. */
export function variantLabels(variants) {
    const ordered = [...variants].sort((a, b) => a.created_at.localeCompare(b.created_at));
    return new Map(ordered.map((v, i) => [v.id, v.variant_name.trim() || `Versión ${i + 1}`]));
}
