<template>
  <modal-component titulo="Horario de funcionamiento" ancho @cerrar="$emit('cerrar')">
    <JornadaCampos :jornada="h" @cambia="(c, val) => cambiar(h, c, val)" />

    <div v-for="(x, i) in h.excepciones" :key="i" class="estudio-jornada">
      <div class="estudio-jornada-cabecera">
        <strong>Otra jornada</strong>
        <button type="button" class="estudio-quitar" @click="quitarJornada(i)">Quitar</button>
      </div>
      <div class="estudio-meses-atajos">
        <button v-for="a in ATAJOS_MESES" :key="a.texto" type="button" class="estudio-atajo" @click="elegirMeses(x, i, a.meses)">{{ a.texto }}</button>
        <button type="button" class="estudio-atajo" @click="x.meses.splice(0)">Ninguno</button>
      </div>
      <div class="estudio-meses" role="group" aria-label="Meses con esta jornada">
        <button v-for="(m, k) in MESES" :key="m" type="button" class="estudio-mes-btn" :class="{ activo: x.meses.includes(k + 1) }"
                :disabled="mesOcupado(k + 1, i)" :aria-pressed="x.meses.includes(k + 1)" @click="alternarMes(x, k + 1)">{{ m }}</button>
      </div>
      <JornadaCampos :jornada="x" @cambia="(c, val) => cambiar(x, c, val)" />
    </div>
    <button v-if="h.excepciones.length < 6 && mesesLibres" type="button" class="secondary estudio-jornada-nueva" @click="anadirJornada">+ Otra jornada en algunos meses</button>

    <template #pie>
      <button type="button" class="secondary" @click="$emit('cerrar')">Cancelar</button>
      <button type="button" @click="$emit('aplicar', h)">Aplicar</button>
    </template>
  </modal-component>
</template>

<script>
import ModalComponent from '../Inventario/ModalComponent.vue'
import JornadaCampos from './JornadaCampos.vue'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const ATAJOS_MESES = [
  { texto: 'Verano', meses: [6, 7, 8, 9] },
  { texto: 'Invierno', meses: [12, 1, 2] }
]

// Todo lo que se puede ajustar del horario cuando solo hay SIPS: se edita una copia y los cambios se aplican al pulsar Aplicar.
export default {
  name: 'Horario-Modal',
  components: { ModalComponent, JornadaCampos },
  props: { horario: { type: Object, required: true } },
  emits: ['cerrar', 'aplicar'],
  data() { return { h: JSON.parse(JSON.stringify(this.horario)), MESES, ATAJOS_MESES } },
  computed: {
    mesesLibres() { return MESES.some((m, k) => !this.h.excepciones.some((x) => x.meses.includes(k + 1))) }
  },
  methods: {
    /** Cambia un campo de una jornada y ajusta al momento los que dependen de él: la salida siempre va después de la entrada. */
    cambiar(j, campo, valor) {
      j[campo] = valor
      if (valor === '') return
      if (campo === 'fuera' || campo === 'finde') j[campo] = Math.min(100, Math.max(0, valor))
      if (campo === 'ini' && Number(j.fin) <= valor) j.fin = Math.min(24, valor + 1)
      if (campo === 'fin' && Number(j.ini) >= valor) j.ini = Math.max(0, valor - 1)
    },
    mesOcupado(mes, indice) {
      return this.h.excepciones.some((x, i) => i !== indice && x.meses.includes(mes))
    },
    alternarMes(x, mes) {
      const i = x.meses.indexOf(mes)
      if (i >= 0) x.meses.splice(i, 1)
      else x.meses.push(mes)
    },
    /** Sustituye los meses de la jornada por un atajo (verano, invierno…), sin tocar los que ya usa otra jornada. */
    elegirMeses(x, indice, meses) {
      x.meses.splice(0, x.meses.length, ...meses.filter((m) => !this.mesOcupado(m, indice)))
    },
    anadirJornada() {
      const h = this.h
      h.excepciones.push({ meses: [], ini: h.ini, fin: h.fin, fuera: h.fuera, finde: h.finde })
    },
    quitarJornada(i) {
      this.h.excepciones.splice(i, 1)
    }
  }
}
</script>
