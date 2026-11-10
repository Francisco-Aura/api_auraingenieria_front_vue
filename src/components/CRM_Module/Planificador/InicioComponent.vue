<template>
  <div class="home">
    <h1>Planificador</h1>
    <p class="muted home-lead">¿Con qué quieres trabajar?</p>
    <div class="home-cards">
      <button v-for="t in tarjetas" :key="t.area" type="button" class="home-card" @click="$emit('abrir', t.area)">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path v-for="(d, i) in t.trazos" :key="i" :d="d" />
          <rect v-for="(r, i) in t.rectangulos" :key="'r' + i" :x="r.x" :y="r.y" :width="r.w" :height="r.h" :rx="r.rx" />
        </svg>
        <strong>{{ t.titulo }}</strong>
        <span>{{ t.texto }}</span>
        <b v-if="(pendientes[t.area] || 0) > 0" class="home-badge" :title="pendientes[t.area] + ' pendientes (por validar o con la propuesta entregada al cliente)'" :aria-label="pendientes[t.area] + ' pendientes'">{{ pendientes[t.area] }}</b>
      </button>
    </div>
  </div>
</template>

<script>
const TARJETAS = [
  {
    area: 'costing',
    titulo: 'Presupuestador',
    texto: 'Elegir los equipos paso a paso, con su compatibilidad, y calcular el coste de la instalación.',
    rectangulos: [{ x: 5, y: 3, w: 14, h: 18, rx: 2 }],
    trazos: ['M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01']
  },
  {
    area: 'projects',
    titulo: 'Proyectos',
    texto: 'Crea proyectos y haz el seguimiento de sus tareas, fechas, documentos y cambios.',
    rectangulos: [{ x: 4, y: 5, w: 16, h: 15, rx: 2 }],
    trazos: ['M8 3v4M16 3v4M4 10h16M8 14h3M8 17h6']
  },
  {
    area: 'inventory',
    titulo: 'Inventario',
    texto: 'Dar de alta los productos y completar sus características: lo que se guarda aquí es lo que se elige al presupuestar.',
    rectangulos: [],
    trazos: ['M3 8l9-5 9 5v8l-9 5-9-5V8z', 'M3 8l9 5 9-5M12 13v8']
  }
]

// Pantalla de inicio: elegir con qué se va a trabajar. Solo enseña lo que está activado en este servidor.
export default {
  name: 'Inicio-Component',
  props: {
    disponibles: { type: Array, default: () => [] },
    // Número de cosas pendientes de cada área (se enseña sobre su tarjeta; 0 no enseña nada)
    pendientes: { type: Object, default: () => ({}) }
  },
  emits: ['abrir'],
  computed: {
    tarjetas() { return TARJETAS.filter((t) => this.disponibles.includes(t.area)) }
  }
}
</script>
