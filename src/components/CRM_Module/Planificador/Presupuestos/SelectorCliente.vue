<template>
  <div v-if="modelValue && modelValue.kind === 'existente' && !cambiando" class="cliente-selector chosen">
    <div class="cliente-actual">
      <span class="tag state borrador" title="Cliente de la empresa, vinculado por su id">Cliente</span>
      <span class="customer-summary">
        <strong>{{ modelValue.name }}</strong>
        <span class="muted">{{ modelValue.tradeName && modelValue.tradeName !== modelValue.name ? ' · ' + modelValue.tradeName : '' }}{{ modelValue.cif ? ' · CIF ' + modelValue.cif : '' }}</span>
      </span>
    </div>
    <button type="button" class="enlace-boton" @click="modo = 'buscar'; cambiando = true">Cambiar</button>
  </div>

  <div v-else class="cliente-selector" :class="{ invalid: invalido }">
    <div class="cliente-modos" role="tablist" aria-label="Tipo de cliente">
      <button type="button" role="tab" :aria-selected="modo === 'buscar'" :class="{ on: modo === 'buscar' }" :disabled="!habilitado" @click="modo = 'buscar'">Cliente existente</button>
      <button type="button" role="tab" :aria-selected="modo === 'potencial'" :class="{ on: modo === 'potencial' }" @click="modo = 'potencial'">Cliente potencial nuevo</button>
    </div>

    <template v-if="modo === 'buscar'">
      <label class="cuestionario-campo wide">
        Buscar por nombre, nombre comercial o CIF
        <input v-model="consulta" type="search" placeholder="Ej.: Ingaser" autocomplete="off">
      </label>
      <p v-if="consulta.trim().length > 0 && consulta.trim().length < 2" class="muted campo-pista">Escribe al menos dos letras.</p>
      <p v-if="buscando" class="muted campo-pista">Buscando…</p>
      <p v-if="error" class="paso-nota warn" role="alert">{{ error }} Mientras tanto puedes crear un cliente potencial.</p>
      <ul v-if="resultados && resultados.length > 0" class="cliente-resultados">
        <li v-for="h in resultados" :key="h.id">
          <button type="button" @click="elegir(h)">
            <strong>{{ h.name }}</strong>
            <span class="muted">{{ h.trade_name && h.trade_name !== h.name ? ' · ' + h.trade_name : '' }}{{ h.cif ? ' · CIF ' + h.cif : '' }}</span>
          </button>
        </li>
      </ul>
      <p v-if="resultados && resultados.length === 0 && !buscando" class="muted campo-pista">
        Ningún cliente coincide con «{{ consulta.trim() }}».
        <button type="button" class="enlace-boton" @click="crearPotencial">Crear un cliente potencial</button>
      </p>
    </template>

    <template v-else>
      <p v-if="!habilitado" class="paso-nota warn" role="status">Este servidor no tiene conexión con la intranet: aquí solo se pueden crear clientes potenciales.</p>
      <p v-if="documento === 'presupuesto'" class="muted campo-pista">Un cliente potencial se queda en este presupuesto: no se da de alta en la intranet.</p>
      <div class="cuestionario-fila">
        <label class="cuestionario-campo wide">
          Nombre del cliente
          <input :value="pot.name" placeholder="Ej.: Pedro Ingaser" maxlength="200" @input="editar({ name: $event.target.value })">
        </label>
      </div>
      <p v-if="invalido && !pot.name.trim()" class="error">Pon el nombre del cliente.</p>
      <div class="cuestionario-fila">
        <label class="cuestionario-campo">
          CIF de la empresa{{ documento === 'estudio' ? ' (opcional)' : '' }}
          <input :value="pot.cif" :class="{ 'obligatorio-vacio': cifInvalido && pot.cif.trim().length < 5 }" maxlength="50" placeholder="Ej.: B12345678" @input="editar({ cif: $event.target.value })">
          <span v-if="documento !== 'estudio'" class="muted campo-pista">Obligatorio: sale en la propuesta y hará falta al validar el presupuesto.</span>
        </label>
      </div>
      <div class="cuestionario-fila">
        <label class="cuestionario-campo">Teléfono (opcional) <input :value="pot.phone" inputmode="tel" maxlength="40" @input="editar({ phone: $event.target.value })"></label>
        <label class="cuestionario-campo">Email (opcional) <input :value="pot.email" inputmode="email" maxlength="120" @input="editar({ email: $event.target.value })"></label>
      </div>
    </template>

    <button v-if="modelValue && modelValue.kind === 'existente'" type="button" class="enlace-boton" :title="'Deja el cliente como estaba: ' + modelValue.name" @click="cambiando = false">Cancelar</button>
  </div>
</template>

<script>
import { planificadorApi, mensajeError } from '@/services/planificadorApi'

// Elegir el cliente de un presupuesto: uno de los de la empresa (se busca en la intranet por nombre, nombre comercial o CIF y
// se vincula por su id) o, si todavía no existe, un cliente potencial, que se queda en el presupuesto hasta que se valide.
export default {
  name: 'Selector-Cliente',
  props: {
    modelValue: { type: Object, default: null },
    // Nombre con el que rellenar el cliente potencial (el texto que tenía un presupuesto anterior a la vinculación)
    nombreSugerido: { type: String, default: '' },
    invalido: { type: Boolean, default: false },
    // Marca en rojo el CIF del cliente potencial si falta (se pone al intentar guardar)
    cifInvalido: { type: Boolean, default: false },
    // Dónde se usa («presupuesto» o «estudio»): cambia los textos; solo en el presupuesto el CIF es obligatorio
    documento: { type: String, default: 'presupuesto' }
  },
  emits: ['update:modelValue', 'modo'],
  data() {
    const v = this.modelValue
    return {
      cambiando: v === null,
      modo: v && v.kind === 'potencial' ? 'potencial' : 'buscar',
      consulta: '', resultados: null, buscando: false, habilitado: true, error: null, secuencia: 0, temporizador: null,
      pot: v && v.kind === 'potencial'
        ? { name: v.name, phone: v.phone, email: v.email, cif: v.cif }
        : { name: this.nombreSugerido, phone: '', email: '', cif: '' }
    }
  },
  watch: {
    consulta() { this.programarBusqueda() },
    modo: { immediate: true, handler(m, antes) { this.$emit('modo', m); if (antes !== undefined) this.programarBusqueda() } }
  },
  mounted() {
    // Un presupuesto de antes de la vinculación trae solo el nombre: pasa a ser un cliente potencial con ese nombre
    if (this.modelValue === null && this.nombreSugerido.trim()) {
      this.modo = 'potencial'
      this.$emit('update:modelValue', { kind: 'potencial', name: this.nombreSugerido.trim(), phone: '', email: '', cif: '' })
    }
    // Si este servidor no tiene conexión con la intranet, se empieza directamente por el cliente potencial
    planificadorApi.buscarClientes('').then((r) => {
      this.habilitado = r.enabled
      if (!r.enabled) this.modo = 'potencial'
    }, () => undefined)
  },
  beforeUnmount() { window.clearTimeout(this.temporizador) },
  methods: {
    // Búsqueda con una pequeña espera mientras se escribe; los resultados viejos no pisan a los nuevos
    programarBusqueda() {
      window.clearTimeout(this.temporizador)
      const q = this.consulta.trim()
      if (!this.cambiando || this.modo !== 'buscar' || q.length < 2) {
        this.resultados = null
        this.buscando = false
        return
      }
      const mia = ++this.secuencia
      this.buscando = true
      this.temporizador = window.setTimeout(() => {
        planificadorApi.buscarClientes(q).then((r) => {
          if (mia !== this.secuencia) return
          this.habilitado = r.enabled
          if (!r.enabled) this.modo = 'potencial'
          this.resultados = r.items
          this.error = null
          this.buscando = false
        }, (e) => {
          if (mia !== this.secuencia) return
          this.resultados = null
          this.error = mensajeError(e)
          this.buscando = false
        })
      }, 300)
    },
    elegir(h) {
      this.$emit('update:modelValue', { kind: 'existente', id: h.id, name: h.name, tradeName: h.trade_name, cif: h.cif })
      this.cambiando = false
      this.consulta = ''
      this.resultados = null
    },
    // El cliente potencial se guarda a medida que se escribe, sin botón: sin nombre no hay cliente
    editar(cambios) {
      this.pot = { ...this.pot, ...cambios }
      const p = this.pot
      this.$emit('update:modelValue', p.name.trim() ? { kind: 'potencial', name: p.name.trim(), phone: p.phone.trim(), email: p.email.trim(), cif: p.cif.trim() } : null)
    },
    crearPotencial() {
      this.modo = 'potencial'
      this.editar({ name: this.pot.name || this.consulta.trim() })
    }
  }
}
</script>
