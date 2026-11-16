<template>
  <div v-if="!remoto || remoto.status !== 'descartado'" class="estado-caja">
    <template v-if="accion.tipo === 'validar'">
      <button type="button" @click="validar">Validar presupuesto</button>
      <span class="muted">Es el que elige el jefe: el resto de variantes de su oferta se descartan.</span>
    </template>
    <span v-else-if="accion.tipo === 'esperar'" class="muted">Enviado al cliente. Solo quien valida puede elegirlo.</span>
    <span v-else-if="accion.tipo === 'elegido'" class="muted">Validado: es el presupuesto elegido de su oferta.</span>
    <span v-else-if="accion.tipo === 'bloqueado'" class="muted">No se puede quitar la validación: la propuesta ya está {{ accion.propuesta === 'aprobada' ? 'aprobada' : 'entregada al cliente' }}.</span>
    <template v-else-if="accion.tipo === 'desvalidar'">
      <button type="button" class="secondary" @click="preguntar('Se quitará la validación y las variantes descartadas de su oferta volverán a Enviado. ¿Continuar?', 'unvalidate')">Quitar validación</button>
      <span class="muted">Las variantes descartadas de su oferta volverán a Enviado.</span>
    </template>
    <template v-else-if="accion.tipo === 'enviar'">
      <button type="button" class="secondary" :disabled="guardando || !accion.habilitado" :title="!remoto ? 'Guárdalo y compártelo primero' : sinGuardar ? 'Guarda primero los cambios' : undefined"
              @click="preguntar('Este presupuesto pasará a «Enviado» y ya no se podrá editar. Para cambiar algo, se duplicará como variante. ¿Marcarlo como entregado?', 'send')">
        Marcar como entregado
      </button>
      <span class="muted">{{ !remoto ? 'Guárdalo y compártelo primero.' : sinGuardar ? 'Guarda primero los cambios.' : 'Cuando ya lo hayas revisado y mandado al cliente: desde ahí no se edita.' }}</span>
    </template>
  </div>
</template>

<script>
import { esValidador } from '@/services/usuarioActual'
import { accionesDeEstado } from '@/utils/planificador/listaPresupuestos'

const REGISTRAR_CLIENTES_POTENCIALES = false

// Estado del presupuesto compartido: marcarlo como enviado al cliente y, para quien valida, validarlo.
export default {
  name: 'Caja-Estado',
  props: {
    presupuesto: { type: Object, required: true },
    guardando: { type: Boolean, default: false },
    estadoPropuesta: { type: String, default: '' },
    sinGuardar: { type: Boolean, default: false }
  },
  emits: ['estado'],
  computed: {
    remoto() { return this.presupuesto.remote },
    accion() { return this.remoto ? accionesDeEstado({ estado: this.remoto.status, esValidador: esValidador(), estadoPropuesta: this.estadoPropuesta, sinGuardar: this.sinGuardar }) : { tipo: 'enviar', habilitado: false } }
  },
  methods: {
    preguntar(texto, accion) { if (window.confirm(texto)) this.$emit('estado', { accion }) },
    // Un cliente potencial se da de alta en la intranet al validar: hace falta su CIF (si el presupuesto no lo trae, se pide aquí)
    validar() {
      const cliente = this.presupuesto.state.customer
      // Desconectado: validar ya no da de alta al potencial en la intranet (ni pide CIF)
      const potencial = REGISTRAR_CLIENTES_POTENCIALES && !!cliente && cliente.kind === 'potencial'
      let cif = ''
      if (potencial && !cliente.cif) {
        cif = (window.prompt('«' + cliente.name + '» es un cliente potencial y se dará de alta en la intranet al validar.\n\nEscribe su CIF:') || '').trim()
        if (!cif) return
      }
      const alta = potencial ? ' El cliente «' + cliente.name + '» se dará de alta en la intranet.' : ''
      if (window.confirm('Se validará este presupuesto y se descartarán las demás variantes de su oferta.' + alta + ' ¿Continuar?')) this.$emit('estado', { accion: 'validate', cif })
    }
  }
}
</script>
