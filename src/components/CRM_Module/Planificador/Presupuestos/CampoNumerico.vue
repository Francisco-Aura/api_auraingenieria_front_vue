<template>
  <span class="num-field">
    <input :class="clase" inputmode="decimal" :aria-label="etiqueta" :value="texto === null ? String(modelValue).replace('.', ',') : texto"
           @input="escribir" @keydown="teclas" @blur="salir">
    <!-- Solo para el ratón: con teclado se usan las flechas del propio campo. -->
    <span class="steppers" aria-hidden="true">
      <button type="button" tabindex="-1" @mousedown.prevent @click="subir(1, $event)">▲</button>
      <button type="button" tabindex="-1" @mousedown.prevent @click="subir(-1, $event)">▼</button>
    </span>
  </span>
</template>

<script>
const redondear = (n) => Math.round(n * 1e4) / 1e4

/** Decimales de lo que se ve en el campo («0,85» → 2, «1,5» → 1, «100» → 0). */
const decimalesDe = (visto) => Math.min(4, ((visto.split(/[.,]/)[1]) || '').trim().length)

// Campo numérico que admite coma decimal y no se «corrige» mientras se escribe (vacío, «1,»…). Sube y baja con las flechas del
// teclado y del ratón; el paso sigue al último decimal que tiene el valor. Con Mayús el paso es ×10 y con Ctrl ×100.
export default {
  name: 'Campo-Numerico',
  props: {
    modelValue: { type: Number, required: true },
    etiqueta: { type: String, required: true },
    clase: { type: String, default: '' },
    // Cuánto suben o bajan las flechas cuando el valor no tiene decimales
    paso: { type: Number, default: 1 }
  },
  // «fin»: el usuario ha terminado de poner el valor (sale del campo o usa las flechas); para quien quiera corregirlo entonces
  emits: ['update:modelValue', 'fin'],
  data() { return { texto: null } },
  methods: {
    salir() {
      this.texto = null
      this.$emit('fin')
    },
    escribir(e) {
      this.texto = e.target.value
      const n = Number(e.target.value.replace(',', '.'))
      if (e.target.value.trim() !== '' && Number.isFinite(n) && n >= 0) this.$emit('update:modelValue', n)
    },
    teclas(e) {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
      e.preventDefault()
      this.subir(e.key === 'ArrowUp' ? 1 : -1, e)
    },
    subir(dir, mods) {
      // Si hay algo a medio escribir y es un número, se parte de ello; si no, del valor guardado.
      const escrito = this.texto === null ? NaN : Number(this.texto.replace(',', '.'))
      const usable = Number.isFinite(escrito) && (this.texto || '').trim() !== ''
      const desde = usable ? escrito : this.modelValue
      const decimales = decimalesDe(usable ? this.texto : String(this.modelValue))
      const base = decimales > 0 ? 10 ** -decimales : this.paso
      const unidad = base * (mods.ctrlKey || mods.metaKey ? 100 : mods.shiftKey ? 10 : 1)
      this.texto = null
      this.$emit('update:modelValue', Math.max(0, redondear(desde + dir * unidad)))
      this.$emit('fin')
    }
  }
}
</script>
