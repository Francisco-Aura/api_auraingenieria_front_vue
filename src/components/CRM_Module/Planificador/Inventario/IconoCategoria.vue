<template>
  <svg class="cat-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
       stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="trazos" />
</template>

<script>
// Trazos (viewBox 24×24) del icono de cada categoría del catálogo.
const TRAZOS = {
  modulos: '<path d="M4 8h16l-2 9H6L4 8z"/><path d="M9.3 8l-.6 9M14.7 8l.6 9M5 12.5h14"/>',
  estructura: '<path d="M3 19h18M6 19l6-12 6 12M9 14h6"/>',
  inversores: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M7 12c1.5-3 3-3 4.5 0s3 3 4.5 0"/>',
  baterias: '<rect x="3" y="8" width="16" height="8" rx="2"/><path d="M21 11v2M8 12h4"/>',
  contadores: '<circle cx="12" cy="12" r="8"/><path d="M12 12l3-3M8 15h8"/>',
  monitorizacion: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 20h8M12 17v3M6 13l3-3 3 2 4-4"/>',
  cableado: '<path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 01-10 0V8zM12 16v5"/>',
  protecciones: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z"/>',
  mano_obra: '<path d="M4 17h16M6 17a6 6 0 0112 0M12 7v4"/>',
  logistica: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
  tierra: '<path d="M12 3v9M5 12h14M7.5 16h9M10 20h4"/>',
  auxiliar: '<path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6z"/>',
  todas: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
  proyecto: '<path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5"/>',
  administrativos: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18"/>'
}
const POR_DEFECTO = '<path d="M4 12l8-8h8v8l-8 8-8-8zM15.5 8.5h.01"/>'

export default {
  name: 'Icono-Categoria',
  props: { nombre: { type: String, required: true } },
  computed: {
    // Contenido fijo del propio código (no viene de datos del usuario)
    trazos() { return TRAZOS[this.nombre] || POR_DEFECTO }
  }
}
</script>
