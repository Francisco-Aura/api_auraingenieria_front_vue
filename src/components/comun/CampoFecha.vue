<!--
  Campo de fecha de la aplicación: se escribe como siempre (dd/mm/aaaa, o solo números:
  «15102026», «151026») o se elige en un calendario en español con atajos («Hoy», «1 año»…).
  Guarda la fecha como 'AAAA-MM-DD', igual que el <input type="date"> al que sustituye, así
  que los formularios y el servidor no cambian.

  Uso: <CampoFecha id="fechaInicio" v-model="contrato.fechaInicio" :error="!!errores.fechaInicio"
         :atajos="[{ etiqueta: '1 año', valor: '2027-10-31' }]" @change="..." />
  - min / max ('AAAA-MM-DD'): días fuera, apagados en el calendario; si se escriben, se avisa.
  - atajos: botones al pie del calendario ({ etiqueta, valor, detalle? }); «Hoy» va siempre
    primero salvo con :hoy="false". `detalle` sale debajo en pequeño (p. ej. la fecha que pone).
  - abrir-en ('AAAA-MM-DD'): mes que enseña el calendario si el campo está vacío.
  - marcas: días señalados con un punto y su explicación ([{ fecha: 'AAAA-MM-DD', texto }]),
    p. ej. el inicio del contrato en el calendario de la fecha fin.
  - icono: clase de Font Awesome del icono del campo (por defecto, el calendario).
  - borrable: con :borrable="false" no sale la × de borrar (campos estrechos, p. ej. junto a la hora).
  - teleportar: dónde se abre el calendario (por defecto en <body>, para que el modal no lo
    recorte; dentro de un SweetAlert, su capa: ver campoFechaEnDialogo.js).
  - change: solo cuando lo cambia la persona (no cuando el formulario carga un valor).
  Tamaño, borde y letra se ajustan a cada pantalla con variables CSS sobre .campo-fecha
  (--campo-fecha-alto, --campo-fecha-letra, --campo-fecha-borde…; ver CampoFecha.css).
-->
<template>
  <div class="campo-fecha" :class="{ 'campo-fecha--error': error || !!aviso, 'campo-fecha--compacto': compacto }"
       :title="modelValue ? fechaLarga(modelValue) : ''">
    <VueDatePicker
      ref="selector"
      :model-value="modelValue || null"
      model-type="yyyy-MM-dd"
      :locale="IDIOMA"
      :week-start="1"
      :formats="FORMATOS"
      :text-input="opcionesTexto"
      :time-config="SIN_HORA"
      auto-apply
      six-weeks="append"
      :min-date="min || undefined"
      :max-date="max || undefined"
      :start-date="mesInicial"
      :markers="marcadores"
      :input-attrs="atributosInput"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :aria-labels="TEXTOS_ACCESIBLES"
      :ui="CLASES"
      :floating="{ placement: 'bottom-start' }"
      :teleport="teleportar"
      @update:model-value="cambiar"
      @text-input="alEscribir"
      @invalid-date="fueraDeRango"
      @blur="alSalir"
      @open="alAbrir"
      @closed="alCerrar"
    >
      <template #input-icon>
        <i :class="[icono, 'campo-fecha__icono']" aria-hidden="true"></i>
      </template>
      <!-- El hueco tiene que existir desde el principio (la librería mira al montarse qué huecos
           hay): los atajos de la fecha fin aparecen cuando se pone el inicio. -->
      <template #action-extra>
        <div v-if="atajosVisibles.length" class="campo-fecha-atajos">
          <button
            v-for="atajo in atajosVisibles"
            :key="atajo.etiqueta"
            type="button"
            class="campo-fecha-atajo"
            :class="{ 'campo-fecha-atajo--elegido': atajo.valor === modelValue }"
            :disabled="!atajo.valor || estaFuera(atajo.valor)"
            :title="atajo.valor ? fechaLarga(atajo.valor) : ''"
            @click="elegirAtajo(atajo.valor)"
          >
            <span class="campo-fecha-atajo__etiqueta">{{ atajo.etiqueta }}</span>
            <span v-if="atajo.detalle" class="campo-fecha-atajo__detalle">{{ atajo.detalle }}</span>
          </button>
        </div>
      </template>
    </VueDatePicker>
    <small v-if="aviso" class="campo-fecha__aviso" role="alert">
      <i class="fas fa-exclamation-circle"></i> {{ aviso }}
    </small>
  </div>
</template>

<script>
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { es } from 'date-fns/locale';
import '@vuepic/vue-datepicker/dist/main.css';
import { fechaLocalISO, fechaES, interpretarFechaEscrita } from '@/utils/fechas';

const FECHA_LARGA = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const DIAS_SEMANA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

export default {
  name: 'CampoFecha',
  components: { VueDatePicker },
  props: {
    modelValue: { type: String, default: '' },
    id: { type: String, default: undefined },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    readonly: { type: Boolean, default: false },
    error: { type: Boolean, default: false },
    min: { type: String, default: '' },
    max: { type: String, default: '' },
    abrirEn: { type: String, default: '' },
    atajos: { type: Array, default: () => [] },
    hoy: { type: Boolean, default: true },
    compacto: { type: Boolean, default: false },
    placeholder: { type: String, default: 'dd/mm/aaaa' },
    marcas: { type: Array, default: () => [] },
    icono: { type: String, default: 'fas fa-calendar-alt' },
    teleportar: { type: [Boolean, String, Object], default: true },
    borrable: { type: Boolean, default: true },
  },
  emits: ['update:modelValue', 'change'],
  data() {
    return {
      // Aviso bajo el campo si lo escrito no es una fecha o se sale de lo permitido
      aviso: '',
      textoEscrito: '',
    };
  },
  created() {
    // Configuración fija de la librería (no hace falta que sea reactiva)
    this.IDIOMA = es;
    this.FORMATOS = { input: 'dd/MM/yyyy', month: 'LLLL' };
    this.SIN_HORA = { enableTimePicker: false };
    this.CLASES = { input: 'campo-fecha__input', menu: 'campo-fecha-menu' };
    this.TEXTOS_ACCESIBLES = {
      toggleOverlay: 'Abrir o cerrar', menu: 'Calendario', input: 'Fecha (dd/mm/aaaa)',
      openYearsOverlay: 'Elegir año', openMonthsOverlay: 'Elegir mes',
      nextMonth: 'Mes siguiente', prevMonth: 'Mes anterior', nextYear: 'Año siguiente', prevYear: 'Año anterior',
      clearInput: 'Borrar la fecha', calendarIcon: 'Abrir el calendario',
      day: (dia) => this.fechaLarga(fechaLocalISO(dia?.value)),
      weekDay: (dia) => DIAS_SEMANA[dia] || '',
    };
    this.opcionesTexto = {
      format: (texto) => interpretarFechaEscrita(texto),
      enterSubmit: true,
      tabSubmit: true,
      applyOnBlur: true,
      openMenu: 'open',
    };
  },
  beforeUnmount() {
    clearTimeout(this.temporizadorAviso);
    window.removeEventListener('keydown', this.escapeSoloCierraCalendario, true);
  },
  computed: {
    atributosInput() {
      // Sin la × de borrar si no se puede cambiar
      return { id: this.id, required: this.required, clearable: this.borrable && !this.readonly && !this.disabled, autocomplete: 'off' };
    },
    marcadores() {
      return this.marcas
        .filter((m) => m && /^\d{4}-\d{2}-\d{2}$/.test(String(m.fecha || '')))
        .map((m) => {
          const [a, mes, d] = m.fecha.split('-').map(Number);
          return { date: new Date(a, mes - 1, d), type: 'dot', tooltip: m.texto ? [{ text: m.texto, color: '#8a6d00' }] : undefined };
        });
    },
    // Los que se salen de lo permitido no se enseñan (un botón apagado solo estorba)
    atajosVisibles() {
      const hoy = this.hoy ? [{ etiqueta: 'Hoy', valor: fechaLocalISO() }] : [];
      return hoy.concat(this.atajos).filter((a) => a && a.etiqueta && a.valor && !this.estaFuera(a.valor));
    },
    // Mes que enseña el calendario vacío: el pedido, o el primero que se puede elegir (si hoy
    // queda fuera, abría en un mes con todos los días apagados)
    mesInicial() {
      if (this.modelValue) return undefined;
      if (this.abrirEn) return this.abrirEn;
      const hoy = fechaLocalISO();
      if (this.min && this.min > hoy) return this.min;
      if (this.max && this.max < hoy) return this.max;
      return undefined;
    },
  },
  methods: {
    alAbrir() {
      this.aviso = '';
      window.addEventListener('keydown', this.escapeSoloCierraCalendario, true);
    },
    alCerrar() {
      window.removeEventListener('keydown', this.escapeSoloCierraCalendario, true);
    },
    // Con el calendario abierto, Esc cierra solo el calendario. La tecla se para aquí (fase de
    // captura en window, antes que nadie): si no, cerraba también el modal de debajo
    // (services/capasModales.js) o el SweetAlert en el que está el campo.
    escapeSoloCierraCalendario(evento) {
      if (evento.key !== 'Escape') return;
      evento.preventDefault();
      evento.stopPropagation();
      this.$refs.selector?.closeMenu?.();
    },
    cambiar(valor) {
      const nuevo = valor ? fechaLocalISO(valor) : '';
      this.aviso = '';
      this.textoEscrito = '';
      if (nuevo === (this.modelValue || '')) return;
      this.$emit('update:modelValue', nuevo);
      this.$emit('change', nuevo);
    },
    elegirAtajo(valor) {
      this.cambiar(valor);
      this.$refs.selector?.closeMenu?.();
    },
    alEscribir(evento) {
      this.textoEscrito = typeof evento === 'string' ? evento : (evento?.target?.value ?? '');
      this.aviso = '';
    },
    // Al salir, si lo escrito no se entiende, la librería vuelve a la fecha anterior sin decir
    // nada: se avisa para que no parezca que se ha quedado puesta.
    alSalir() {
      const texto = this.textoEscrito.trim();
      this.textoEscrito = '';
      if (texto && !interpretarFechaEscrita(texto)) {
        this.avisar(this.modelValue
          ? `«${texto}» no es una fecha; se queda el ${fechaES(this.modelValue)}.`
          : `«${texto}» no es una fecha. Escríbala así: 15/10/2026.`);
      }
    },
    fueraDeRango(fecha) {
      const iso = fechaLocalISO(fecha);
      this.textoEscrito = '';
      if (this.min && iso < this.min) this.avisar(`No puede ser anterior al ${fechaES(this.min)}.`);
      else if (this.max && iso > this.max) this.avisar(`No puede ser posterior al ${fechaES(this.max)}.`);
      else this.avisar('Esa fecha no se puede elegir aquí.');
    },
    // El campo ya ha vuelto a su fecha buena: el aviso se va solo a los pocos segundos
    avisar(texto) {
      this.aviso = texto;
      clearTimeout(this.temporizadorAviso);
      this.temporizadorAviso = setTimeout(() => { this.aviso = ''; }, 8000);
    },
    estaFuera(iso) {
      return (!!this.min && iso < this.min) || (!!this.max && iso > this.max);
    },
    fechaLarga(iso) {
      if (!iso) return '';
      const [a, m, d] = iso.split('-').map(Number);
      const texto = FECHA_LARGA.format(new Date(a, m - 1, d));
      return texto.charAt(0).toUpperCase() + texto.slice(1);
    },
  },
};
</script>

<style src="./CampoFecha.css"></style>
