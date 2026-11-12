<template>
  <div>
    <div class="rh-nav-mes">
      <button type="button" class="rh-btn rh-btn-circulo" aria-label="Mes anterior" @click="$emit('mes', -1)">❮</button>
      <h2 aria-live="polite">{{ MESES[mes - 1] }} {{ anio }}</h2>
      <button type="button" class="rh-btn rh-btn-circulo" aria-label="Mes siguiente" @click="$emit('mes', 1)">❯</button>
      <button type="button" class="rh-btn rh-hoy" @click="$emit('hoy')">Hoy</button>
    </div>

    <p id="rh-ayuda-calendario" class="rh-nota" style="margin: 8px 0">
      Elige qué marcar y pulsa (o arrastra con el ratón) sobre los días. Clic derecho en un día para quitar su marca.
    </p>
    <div class="rh-pinceles" role="group" aria-label="Qué marcar" style="margin-bottom: 10px">
      <button
        v-for="p in PINCELES"
        :key="p.estado"
        type="button"
        class="rh-pincel"
        :class="`rh-e-${p.estado}`"
        :aria-pressed="pincel === p.estado"
        @click="$emit('pincel', p.estado)"
      >{{ p.nombre }}</button>
      <button type="button" class="rh-pincel rh-pincel-neutro" :aria-pressed="pincel === 'HORAS'" @click="$emit('pincel', 'HORAS')">
        <svg class="rh-icono" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
        Horas
      </button>
    </div>

    <div class="rh-cuadricula" role="group" :aria-label="`Días de ${MESES[mes - 1].toLowerCase()} de ${anio}`" aria-describedby="rh-ayuda-calendario">
      <div v-for="l in CABECERA" :key="l" class="rh-cabecera-dia" aria-hidden="true">{{ l }}</div>
      <template v-for="(n, i) in celdas" :key="n === null ? `v${i}` : n">
        <div v-if="n === null" class="rh-vacio"></div>
        <button
          v-else
          type="button"
          :data-fecha="fecha(n)"
          :disabled="esFinDeSemana(fecha(n))"
          class="rh-dia"
          :class="clasesDia(n)"
          :aria-label="etiquetaDia(n)"
          @pointerdown="alPulsar($event, n)"
          @pointerenter="alEntrar($event, n)"
          @click="alClic(n)"
          @contextmenu.prevent="$emit('quitar', fecha(n))"
        >
          <b>{{ n }}{{ tieneHorasPropias(n) ? ' ✎' : '' }}</b>
          <span aria-hidden="true">{{ TEXTO_ESTADO[estadoDe(fecha(n), ctx)] }}</span>
        </button>
      </template>
    </div>
  </div>
</template>

<script>
import { diaSemana, diasDelMes, iso, MESES } from '@/utils/registroHorario/fechas';
import { antesDelAlta, esFinDeSemana, estadoDe, PINCELES, TEXTO_ESTADO } from '@/utils/registroHorario/jornada';

// Calendario del mes con «pinceles»: se elige qué marcar y se pulsa o arrastra sobre los días.
export default {
  name: 'CalendarioRegistro',
  props: {
    anio: { type: Number, required: true },
    mes: { type: Number, required: true },
    hoy: { type: String, required: true },
    ctx: { type: Object, required: true }, // { festivos, marcas, alta }
    limite: { type: String, default: null },
    pincel: { type: String, required: true }
  },
  emits: ['pincel', 'mes', 'hoy', 'pintar', 'quitar', 'horas'],
  data() {
    return { MESES, PINCELES, TEXTO_ESTADO, CABECERA: ['L', 'M', 'X', 'J', 'V', 'S', 'D'] };
  },
  computed: {
    celdas() {
      const huecos = diaSemana(this.anio, this.mes, 1);
      return [...Array(huecos).fill(null), ...Array.from({ length: diasDelMes(this.anio, this.mes) }, (_, i) => i + 1)];
    }
  },
  created() {
    this.arrastrando = false;
  },
  mounted() {
    window.addEventListener('pointerup', this.parar);
    window.addEventListener('pointercancel', this.parar);
  },
  beforeUnmount() {
    window.removeEventListener('pointerup', this.parar);
    window.removeEventListener('pointercancel', this.parar);
  },
  methods: {
    esFinDeSemana,
    estadoDe,
    fecha(n) {
      return iso(this.anio, this.mes, n);
    },
    parar() {
      this.arrastrando = false;
    },
    aplicar(n) {
      if (this.pincel !== 'HORAS') this.$emit('pintar', this.fecha(n), this.pincel);
    },
    alPulsar(e, n) {
      if (e.pointerType !== 'mouse' || e.button !== 0 || this.pincel === 'HORAS') return;
      this.arrastrando = true;
      this.aplicar(n);
    },
    alEntrar(e, n) {
      if (this.arrastrando && e.pointerType === 'mouse') this.aplicar(n);
    },
    alClic(n) {
      if (this.pincel === 'HORAS') this.$emit('horas', this.fecha(n));
      else this.aplicar(n);
    },
    apagado(n) {
      const f = this.fecha(n);
      return (this.limite !== null && f > this.limite) || antesDelAlta(f, this.ctx.alta);
    },
    tieneHorasPropias(n) {
      const f = this.fecha(n);
      const est = estadoDe(f, this.ctx);
      return f in this.ctx.marcas.horas && (est === 'MANANA' || est === 'TARDE');
    },
    clasesDia(n) {
      const f = this.fecha(n);
      return {
        [`rh-e-${estadoDe(f, this.ctx)}`]: true,
        'rh-apagado': this.apagado(n),
        'rh-finde': esFinDeSemana(f),
        'rh-es-hoy': f === this.hoy
      };
    },
    etiquetaDia(n) {
      const f = this.fecha(n);
      const est = estadoDe(f, this.ctx);
      const finde = esFinDeSemana(f);
      const estado = finde ? 'fin de semana, no se marca' : TEXTO_ESTADO[est] === '—' ? 'libre' : TEXTO_ESTADO[est];
      return `${n} de ${MESES[this.mes - 1].toLowerCase()}: ${estado}${this.tieneHorasPropias(n) ? ', con horas propias' : ''}${this.apagado(n) ? ', saldrá en blanco' : ''}`;
    }
  }
};
</script>
