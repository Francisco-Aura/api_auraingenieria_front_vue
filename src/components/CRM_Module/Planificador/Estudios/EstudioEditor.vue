<template>
  <div class="estudio">
    <div class="back-row">
      <button type="button" class="secondary" @click="volver">← Volver a los estudios</button>
    </div>
    <p v-if="!e && error" class="error">{{ error }}</p>
    <p v-else-if="!e" class="muted">Cargando estudio…</p>
    <template v-else>
      <div class="costs-title">
        <h1>{{ f.cliente || 'Estudio' }}</h1>
        <div class="title-actions">
          <span v-if="sinGuardar" class="muted">Cambios sin guardar</span>
          <span v-else-if="guardadoOk" class="estudio-ok" role="status">✓ Guardado</span>
          <button type="button" :disabled="ocupado" @click="guardar()">{{ ocupado ? 'Trabajando…' : '💾 Guardar y calcular' }}</button>
        </div>
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-if="aviso" class="estudio-aviso" role="status">{{ aviso }}</p>

      <fieldset class="setup-card">
        <legend>Cliente y seguimiento</legend>
        <label class="survey-field">
          Cliente
          <input v-model.trim="f.cliente" maxlength="255" autocomplete="off">
        </label>
        <label class="survey-field">
          Estado
          <select v-model="f.estado">
            <option v-for="s in e.estados" :key="s.id" :value="s.id">{{ s.nombre }}</option>
          </select>
        </label>
        <label class="survey-field wide">
          Observaciones
          <textarea v-model="f.observaciones" rows="3" maxlength="5000" placeholder="Ej.: pendiente de la factura de julio; el cliente lo está hablando con su gestor" />
        </label>
      </fieldset>

      <fieldset class="setup-card">
        <legend>Consumo del cliente</legend>
        <div class="estudio-subida">
          <div>
            <strong>1. SIPS</strong>
            <p class="muted">Excel de la distribuidora con el suministro y las lecturas mensuales. Rellena el CUPS, la tarifa y las potencias contratadas, y con él se estima la curva de consumo.</p>
            <button type="button" class="secondary" :disabled="ocupado" @click="$refs.sips.click()">{{ e.datos.cups ? 'Cambiar el SIPS' : 'Subir el SIPS (.xlsx)' }}</button>
            <input ref="sips" type="file" accept=".xlsx,.xls" hidden @change="subir($event, 'sips')">
          </div>
          <div>
            <strong>2. Curva horaria (recomendado)</strong>
            <p class="muted">Excel o CSV de la distribuidora con el consumo hora a hora (o por cuartos de hora) de un año. Con ella el estudio es mucho más preciso.</p>
            <button type="button" class="secondary" :disabled="ocupado" @click="$refs.curva.click()">{{ e.curva.presente && !e.curva.estimada ? 'Cambiar la curva' : 'Subir la curva (.xlsx / .csv)' }}</button>
            <input ref="curva" type="file" accept=".xlsx,.xls,.csv,.txt" hidden @change="subir($event, 'curva')">
          </div>
        </div>
        <p class="estudio-curva" :class="{ ok: e.curva.presente && !e.curva.estimada, estimada: e.curva.presente && e.curva.estimada }">
          <template v-if="!e.curva.presente">Todavía no hay curva de consumo: sube el SIPS (se estima) o la curva de la distribuidora.</template>
          <template v-else-if="e.curva.estimada">Curva <b>estimada</b> con las lecturas del SIPS y el horario de abajo. Sirve para una primera idea; con la curva real el aprovechamiento solar sale más fino.</template>
          <template v-else>Curva real: <b>{{ e.curva.origen }}</b></template>
        </p>
        <dl v-if="e.datos.cups" class="estudio-suministro">
          <div><dt>CUPS</dt><dd>{{ e.datos.cups }}</dd></div>
          <div><dt>Tarifa</dt><dd>{{ e.datos.tarifa || '—' }}</dd></div>
          <div><dt>Localidad</dt><dd>{{ [e.datos.localidad, e.datos.provincia].filter(Boolean).join(' · ') || '—' }}</dd></div>
          <div v-if="e.datos.potencias"><dt>Potencias contratadas (kW)</dt><dd>{{ e.datos.potencias.map((p, i) => 'P' + (i + 1) + ' ' + fmt(p, 0)).join(' · ') }}</dd></div>
        </dl>
        <div v-if="!e.curva.presente || e.curva.estimada" class="estudio-horario">
          <strong>Horario de funcionamiento (para estimar la curva)</strong>
          <div class="estudio-campos">
            <label class="survey-field">Entrada (h)<input v-model.number="f.horario.ini" type="number" min="0" max="23" step="1"></label>
            <label class="survey-field">Salida (h)<input v-model.number="f.horario.fin" type="number" min="1" max="24" step="1"></label>
            <label class="survey-field">Consumo fuera de horario (%)<input v-model.number="f.horario.fuera" type="number" min="0" max="100" step="1"></label>
            <label class="survey-field">Consumo en fin de semana (%)<input v-model.number="f.horario.finde" type="number" min="0" max="100" step="1"></label>
          </div>
          <p class="muted">Porcentaje respecto al consumo a plena carga en horario laboral. Si la actividad para por la noche y el fin de semana, pon valores bajos.</p>
        </div>
      </fieldset>

      <fieldset class="setup-card">
        <legend>Instalación propuesta</legend>
        <div class="estudio-campos">
          <label class="survey-field">Paneles (kWp)<input v-model.number="f.instalacion.kwp" type="number" min="0" step="0.1"></label>
          <label class="survey-field">Batería (kWh, 0 si no lleva)<input v-model.number="f.instalacion.bateriaKwh" type="number" min="0" step="1"></label>
          <label class="survey-field">Orientación
            <select v-model="f.instalacion.orientacion">
              <option value="este-oeste">Este-Oeste (15°)</option>
              <option value="sur">Sur (30°)</option>
            </select>
          </label>
          <label class="survey-field">Producción (kWh/kWp·año)
            <input v-model.number="f.instalacion.produccionEspecifica" type="number" min="500" max="2500" step="10" :placeholder="f.instalacion.orientacion === 'sur' ? '1.685 (por defecto)' : '1.420 (por defecto)'">
          </label>
        </div>
        <p class="muted">La potencia propuesta al cargar el consumo es la que produce la mitad de lo que consume el cliente en un año: ajústala y pulsa «Guardar y calcular».</p>
      </fieldset>

      <fieldset class="setup-card">
        <legend>Economía (sin IVA)</legend>
        <div class="estudio-campos">
          <label class="survey-field">Precio de los paneles (€/Wp)<input v-model.number="f.economia.precioWp" type="number" min="0.05" max="5" step="0.01"></label>
          <label class="survey-field">Precio de la batería (€/kWh)<input v-model.number="f.economia.precioBateriaKwh" type="number" min="0" step="10"></label>
          <label class="survey-field">Precio medio de la energía (€/kWh)<input v-model.number="f.economia.precioEnergia" type="number" min="0.005" max="1" step="0.005"></label>
          <label class="survey-field">Mantenimiento y seguro (% de la inversión al año)<input v-model.number="f.economia.mantenimientoPct" type="number" min="0" max="10" step="0.1"></label>
          <label class="survey-field">Ahorro anual en potencia (€)<input v-model.number="f.economia.ahorroPotencia" type="number" min="0" step="100"></label>
        </div>
        <details class="estudio-avanzado">
          <summary>Ajustes avanzados</summary>
          <div class="estudio-campos">
            <label class="survey-field">Inversión total fija (€, vacío = calcularla)<input v-model.number="f.economia.inversionTotal" type="number" min="0" step="100"></label>
            <label class="survey-field">Mantenimiento fijo (€/año, vacío = % de la inversión)<input v-model.number="f.economia.mantenimiento" type="number" min="0" step="50"></label>
            <label class="survey-field">Cambio de equipos: año<input v-model.number="f.economia.reposicionAno" type="number" min="1" max="25" step="1"></label>
            <label class="survey-field">Cambio de equipos: importe (€, 0 = ninguno)<input v-model.number="f.economia.reposicion" type="number" min="0" step="1000"></label>
          </div>
        </details>
      </fieldset>

      <fieldset class="setup-card">
        <legend>Resultado</legend>
        <p v-if="!r" class="muted">Todavía no hay resultado: carga el consumo del cliente y pulsa «Guardar y calcular».</p>
        <template v-else>
          <div class="estudio-kpis">
            <div><b>{{ fmt(r.simulacion.cobertura * 100, 0) }} %</b><span>del consumo cubierto</span></div>
            <div><b>{{ fmt(r.simulacion.solarConsumida / 1000, 0) }} MWh</b><span>energía solar consumida al año</span></div>
            <div><b>{{ fmt(r.finanzas.inversion, 0) }} €</b><span>inversión</span></div>
            <div><b>{{ fmt(r.finanzas.ahorroPrimerAno, 0) }} €</b><span>ahorro neto el primer año</span></div>
            <div><b>{{ r.finanzas.retorno ? fmt(r.finanzas.retorno, 1) + ' años' : '—' }}</b><span>retorno de la inversión</span></div>
            <div><b>{{ r.finanzas.tir !== null ? fmt(r.finanzas.tir * 100, 1) + ' %' : '—' }}</b><span>TIR</span></div>
          </div>
          <p class="muted">Consumo anual {{ fmt(r.consumo.consumoAnual / 1000, 0) }} MWh · potencia máxima horaria {{ fmt(r.consumo.potenciaMaxima, 0) }} kW ·
            aprovechamiento de la producción {{ fmt(r.simulacion.aprovechamiento * 100, 0) }} %<template v-if="r.simulacion.bateriaKwh > 0"> · {{ fmt(r.simulacion.ciclos, 0) }} ciclos de batería al año</template></p>
          <div class="estudio-tabla">
            <table>
              <thead>
                <tr><th>Escenario</th><th v-for="s in r.escenarios" :key="s.kwp">{{ fmt(s.kwp, 0) }} kWp</th></tr>
              </thead>
              <tbody>
                <tr><td>Consumo cubierto</td><td v-for="s in r.escenarios" :key="s.kwp">{{ fmt(s.cobertura * 100, 0) }} %</td></tr>
                <tr><td>Inversión</td><td v-for="s in r.escenarios" :key="s.kwp">{{ fmt(s.inversion, 0) }} €</td></tr>
                <tr><td>Ahorro año 1</td><td v-for="s in r.escenarios" :key="s.kwp">{{ fmt(s.ahorroPrimerAno, 0) }} €</td></tr>
                <tr><td>Retorno</td><td v-for="s in r.escenarios" :key="s.kwp">{{ s.retorno ? fmt(s.retorno, 1) + ' años' : '—' }}</td></tr>
                <tr><td>TIR</td><td v-for="s in r.escenarios" :key="s.kwp">{{ s.tir !== null ? fmt(s.tir * 100, 1) + ' %' : '—' }}</td></tr>
              </tbody>
            </table>
          </div>
          <div class="estudio-acciones">
            <button type="button" :disabled="ocupado || sinGuardar" :title="sinGuardar ? 'Guarda primero los cambios' : ''" @click="verInforme">Ver el informe</button>
            <button type="button" class="secondary" :disabled="ocupado || sinGuardar" @click="descargar('pdf')">Descargar PDF</button>
            <button type="button" class="secondary" :disabled="ocupado || sinGuardar" @click="descargar('html')">Descargar HTML</button>
          </div>
        </template>
      </fieldset>

      <div class="estudio-pie">
        <button type="button" class="secondary peligro" :disabled="ocupado" @click="eliminar">Eliminar el estudio</button>
        <span class="muted">Creado {{ fecha(e.creadoEl) }} · última modificación {{ fecha(e.actualizadoEl) }}<template v-if="e.actualizadoPor"> por {{ e.actualizadoPor }}</template></span>
      </div>
    </template>

    <modal-component v-if="informe" titulo="Informe del estudio" ancho @cerrar="informe = ''">
      <iframe class="estudio-informe" sandbox="" :srcdoc="informe" title="Informe del estudio" />
      <template #pie>
        <button type="button" class="secondary" @click="informe = ''">Cerrar</button>
        <button type="button" @click="descargar('pdf')">Descargar PDF</button>
      </template>
    </modal-component>
  </div>
</template>

<script>
import ModalComponent from '../Inventario/ModalComponent.vue'
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { descargarArchivo, imprimirHtml } from '@/utils/planificador/documentos/descarga'

/** Lo que se edita en la pantalla, a partir de lo que devuelve el servidor (los porcentajes del horario van de 0 a 100). */
function formaDe(e) {
  const d = e.datos
  const copia = (o) => JSON.parse(JSON.stringify(o || {}))
  const hor = copia(d.horario)
  return {
    cliente: e.cliente,
    estado: e.estado,
    observaciones: e.observaciones,
    instalacion: copia(d.instalacion),
    economia: copia(d.economia),
    horario: { ini: hor.ini, fin: hor.fin, fuera: Math.round((hor.fraccionFuera ?? 0.15) * 100), finde: Math.round((hor.fraccionFinde ?? 0.1) * 100) }
  }
}

/** Lo que se envía al guardar: los vacíos de los campos opcionales viajan como cadena vacía y el servidor los toma como «sin valor». */
function cuerpoDe(f) {
  const v = (x) => (x === null || x === undefined ? '' : x)
  return {
    cliente: f.cliente,
    estado: f.estado,
    observaciones: f.observaciones,
    datos: {
      instalacion: { kwp: v(f.instalacion.kwp), bateriaKwh: v(f.instalacion.bateriaKwh) === '' ? 0 : f.instalacion.bateriaKwh, orientacion: f.instalacion.orientacion, produccionEspecifica: v(f.instalacion.produccionEspecifica) },
      economia: {
        precioWp: v(f.economia.precioWp), precioBateriaKwh: v(f.economia.precioBateriaKwh), precioEnergia: v(f.economia.precioEnergia),
        mantenimientoPct: v(f.economia.mantenimientoPct), ahorroPotencia: v(f.economia.ahorroPotencia) === '' ? 0 : f.economia.ahorroPotencia,
        inversionTotal: v(f.economia.inversionTotal), mantenimiento: v(f.economia.mantenimiento),
        reposicionAno: v(f.economia.reposicionAno), reposicion: v(f.economia.reposicion) === '' ? 0 : f.economia.reposicion
      },
      horario: { ini: v(f.horario.ini), fin: v(f.horario.fin), fraccionFuera: f.horario.fuera === '' ? '' : f.horario.fuera / 100, fraccionFinde: f.horario.finde === '' ? '' : f.horario.finde / 100 }
    }
  }
}

export default {
  name: 'Estudio-Editor',
  components: { ModalComponent },
  props: { id: { type: String, required: true } },
  emits: ['volver', 'cambiado'],
  data() {
    return { e: null, f: null, guardado: '', error: '', aviso: '', ocupado: false, guardadoOk: false, informe: '' }
  },
  computed: {
    r() { return this.e && this.e.resultado && this.e.resultado.simulacion ? this.e.resultado : null },
    sinGuardar() { return !!this.f && JSON.stringify(cuerpoDe(this.f)) !== this.guardado }
  },
  mounted() { this.cargar() },
  methods: {
    async cargar() {
      try {
        this.poner(await planificadorApi.estudio(this.id))
      } catch (e) {
        this.error = 'No se ha podido abrir el estudio: ' + mensajeError(e)
      }
    },
    poner(e) {
      this.e = e
      this.f = formaDe(e)
      this.guardado = JSON.stringify(cuerpoDe(this.f))
      this.aviso = e.aviso || ''
    },
    /** Guarda los cambios y recalcula. Devuelve true si salió bien. */
    async guardar() {
      this.ocupado = true
      this.error = ''
      this.guardadoOk = false
      try {
        this.poner(await planificadorApi.guardarEstudio(this.id, cuerpoDe(this.f)))
        this.guardadoOk = true
        this.$emit('cambiado')
        window.setTimeout(() => { this.guardadoOk = false }, 4000)
        return true
      } catch (e) {
        this.error = mensajeError(e)
        return false
      } finally {
        this.ocupado = false
      }
    },
    /** Sube el SIPS o la curva. Antes guarda lo que haya sin guardar: la respuesta del servidor sustituye a la pantalla. */
    async subir(evento, tipo) {
      const archivo = evento.target.files && evento.target.files[0]
      evento.target.value = ''
      if (!archivo) return
      if (this.sinGuardar && !(await this.guardar())) return
      this.ocupado = true
      this.error = ''
      try {
        const e = await (tipo === 'sips' ? planificadorApi.subirSips(this.id, archivo) : planificadorApi.subirCurva(this.id, archivo))
        this.poner(e)
        this.$emit('cambiado')
      } catch (err) {
        this.error = mensajeError(err)
      } finally {
        this.ocupado = false
      }
    },
    async verInforme() {
      this.ocupado = true
      this.error = ''
      try {
        const { blob } = await planificadorApi.informeEstudioHtml(this.id)
        this.informe = await blob.text()
      } catch (e) {
        this.error = mensajeError(e)
      } finally {
        this.ocupado = false
      }
    },
    async descargar(formato) {
      this.ocupado = true
      this.error = ''
      try {
        if (formato === 'html') {
          const { blob, nombre } = await planificadorApi.informeEstudioHtml(this.id)
          descargarArchivo(blob, nombre)
        } else {
          try {
            const { blob, nombre } = await planificadorApi.informeEstudioPdf(this.id)
            descargarArchivo(blob, nombre)
          } catch (e) {
            // Sin Chrome en el servidor: se imprime el HTML desde el navegador
            if (!(e && e.response && e.response.status === 501)) throw e
            const { blob, nombre } = await planificadorApi.informeEstudioHtml(this.id)
            await imprimirHtml(await blob.text(), nombre.replace(/\.html$/, ''))
          }
        }
      } catch (e) {
        this.error = mensajeError(e)
      } finally {
        this.ocupado = false
      }
    },
    async eliminar() {
      if (!window.confirm('¿Eliminar el estudio de «' + this.e.cliente + '»? No se puede deshacer.')) return
      try {
        await planificadorApi.borrarEstudio(this.id)
        this.$emit('volver')
      } catch (e) {
        this.error = mensajeError(e)
      }
    },
    volver() {
      if (this.sinGuardar && !window.confirm('Hay cambios sin guardar. ¿Salir sin guardarlos?')) return
      this.$emit('volver')
    },
    fmt(n, d) { return n === null || n === undefined || n === '' || Number.isNaN(Number(n)) ? '—' : Number(n).toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d }) },
    fecha(iso) {
      const d = new Date(iso)
      return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }
}
</script>
