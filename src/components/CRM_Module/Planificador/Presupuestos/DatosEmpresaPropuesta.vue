<template>
  <div class="datos-empresa">
    <label v-if="conCif" class="cuestionario-campo wide">
      CIF de la empresa
      <input :value="modelValue.cif" :class="{ 'obligatorio-vacio': cifInvalido && (modelValue.cif || '').trim().length < 5 }" placeholder="Ej.: B12345678" maxlength="30" autocomplete="off"
             @input="cambiar({ cif: $event.target.value })">
    </label>
    <div class="cuestionario-campo wide">
      Logo de la empresa
      <div class="propuesta-logo">
        <button type="button" class="propuesta-logo-caja" title="Haz clic o arrastra una imagen para subir el logo" @click="$refs.logo.click()" @dragover.prevent @drop.prevent="soltar($event, 'logo')">
          <img v-if="modelValue.logo" :src="modelValue.logo" alt="Logo de la empresa del cliente">
          <span v-else class="muted">+ Subir logo</span>
        </button>
        <div>
          <button v-if="modelValue.logo" type="button" class="enlace-boton" @click="cambiar({ logo: '' })">Quitar el logo</button>
          <p v-if="errorLogo" class="error" role="alert">{{ errorLogo }}</p>
        </div>
        <input ref="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden @change="subir($event, 'logo')">
      </div>
    </div>
    <div class="cuestionario-campo wide">
      Encaje de los paneles
      <div class="propuesta-logo">
        <button type="button" class="propuesta-logo-caja propuesta-encaje-caja" title="Haz clic o arrastra una imagen para subir el encaje" @click="$refs.encaje.click()" @dragover.prevent @drop.prevent="soltar($event, 'encaje')">
          <img v-if="modelValue.encaje" :src="modelValue.encaje" alt="Encaje de los paneles en el proyecto">
          <span v-else class="muted">+ Subir encaje</span>
        </button>
        <div>
          <button v-if="modelValue.encaje" type="button" class="enlace-boton" @click="cambiar({ encaje: '' })">Quitar el encaje</button>
          <p v-if="errorEncaje" class="error" role="alert">{{ errorEncaje }}</p>
        </div>
        <input ref="encaje" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden @change="subir($event, 'encaje')">
      </div>
    </div>
  </div>
</template>

<script>
import { prepararLogo, prepararEncaje } from '@/utils/planificador/logo'

// Lo de la empresa del cliente que comparten todos los documentos de una propuesta: su CIF, su logo y el encaje de los paneles.
// modelValue = { cif, logo, encaje }; las imágenes se reducen en el navegador antes de guardarse.
export default {
  name: 'Datos-Empresa-Propuesta',
  props: {
    modelValue: { type: Object, required: true },
    // El CIF de un cliente potencial se escribe en su ficha: aquí solo se pide el de uno de la intranet
    conCif: { type: Boolean, default: true },
    cifInvalido: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  data() {
    return { errorLogo: '', errorEncaje: '' }
  },
  methods: {
    cambiar(cambios) { this.$emit('update:modelValue', { ...this.modelValue, ...cambios }) },
    subir(evento, cual) {
      const archivo = evento.target.files && evento.target.files[0]
      evento.target.value = ''
      if (archivo) this.guardar(archivo, cual)
    },
    soltar(evento, cual) {
      const archivo = evento.dataTransfer.files && evento.dataTransfer.files[0]
      if (archivo && archivo.type.startsWith('image/')) this.guardar(archivo, cual)
    },
    guardar(archivo, cual) {
      const error = cual === 'logo' ? 'errorLogo' : 'errorEncaje'
      this[error] = ''
      const preparar = cual === 'logo' ? prepararLogo(archivo, 700) : prepararEncaje(archivo)
      preparar.then((uri) => this.cambiar({ [cual]: uri }), (e) => { this[error] = e.message })
    }
  }
}
</script>
