<template>
  <p v-if="documentos.length === 0" class="muted">Este proyecto no tiene documentos.</p>
  <div v-else class="documents">
    <nav class="doc-list" aria-label="Documentos del proyecto">
      <button v-for="(d, i) in documentos" :key="i" type="button" :class="{ active: i === indice }" @click="abrir(i)">{{ d.title }}</button>
    </nav>

    <article class="doc-page">
      <header class="doc-head">
        <h2>{{ doc.title }}</h2>
        <button type="button" class="secondary" @click="alternarEdicion">{{ editando ? 'Listo' : 'Editar texto' }}</button>
      </header>

      <textarea v-if="editando" :key="indice" class="doc-body" :value="borrador ?? doc.body" spellcheck="false" @input="borrador = $event.target.value" @blur="confirmar" />
      <texto-con-formato v-else :texto="doc.body" />
    </article>
  </div>
</template>

<script>
import TextoConFormato from './TextoConFormato.vue'

// Guías y fichas del proyecto: se leen con formato y se editan como texto
export default {
  name: 'Documentos-Proyecto',
  components: { TextoConFormato },
  props: {
    documentos: { type: Array, required: true },
    alGuardar: { type: Function, required: true }
  },
  data() { return { abierto: 0, editando: false, borrador: null } },
  computed: {
    indice() { return Math.min(this.abierto, this.documentos.length - 1) },
    doc() { return this.documentos[this.indice] }
  },
  methods: {
    confirmar() {
      if (this.borrador !== null && this.borrador !== this.doc.body) {
        this.alGuardar(this.documentos.map((d, i) => (i === this.indice ? { ...d, body: this.borrador } : d)))
      }
      this.borrador = null
    },
    abrir(i) { this.confirmar(); this.editando = false; this.abierto = i },
    alternarEdicion() {
      if (this.editando) this.confirmar()
      this.editando = !this.editando
    }
  }
}
</script>
