<template>
  <p v-if="error" class="error">No se ha podido cargar el catálogo: {{ error }}</p>
  <p v-else-if="!catalogo || !resumen" class="muted">Cargando catálogo…</p>
  <div v-else class="costs" :class="{ locked: bloqueado }">
    <div class="back-row"><button type="button" class="secondary" @click="$emit('volver')">← Presupuestos</button></div>
    <div class="costs-title">
      <div class="title-block">
        <span class="step-kicker">Presupuestador</span>
        <h1>{{ estado.client.trim() || 'Sin nombre' }}<small v-if="estado.reference.trim()" class="muted"> · {{ estado.reference.trim() }}</small></h1>
      </div>
    </div>

    <tira-variantes v-if="presupuesto.remote" :presupuesto-id="presupuesto.id" :refrescar="presupuesto.remote.status + '|' + estadoPropuesta"
                    @abrir="$emit('abrir-variante', $event)" @nueva="$emit('duplicar')" @eliminada="$emit('variante-eliminada', $event)" />

    <div v-if="validado" class="budget-tabs" role="tablist" aria-label="Secciones del presupuesto validado">
      <button type="button" role="tab" :aria-selected="pestana === 'propuesta'" :class="{ active: pestana === 'propuesta' }" @click="pestana = 'propuesta'">Propuesta al cliente</button>
      <button type="button" role="tab" :aria-selected="pestana === 'presupuesto'" :class="{ active: pestana === 'presupuesto' }" @click="pestana = 'presupuesto'">Presupuesto</button>
    </div>

    <section v-if="validado && pestana === 'propuesta'" class="proposal-page" aria-label="Propuesta al cliente">
      <seccion-propuesta :presupuesto-id="presupuesto.id" @estado="estadoPropuesta = $event" />
      <caja-estado :presupuesto="presupuesto" :guardando="guardando" :estado-propuesta="estadoPropuesta" :sin-guardar="sucio" @estado="$emit('estado', $event)" />
      <p v-if="errorGuardar" class="error" role="alert">{{ errorGuardar }}</p>
    </section>

    <template v-else>
      <section class="save-bar" :class="remoto ? 'shared' : 'local'" aria-label="Dónde se guarda este presupuesto">
        <div class="save-where">
          <template v-if="remoto && bloqueado">
            <strong><svg class="estado-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>{{ ETIQUETA_BLOQUEO[remoto.status] }}</strong>
            <span v-if="AYUDA_BLOQUEO[remoto.status]" class="muted"> · {{ AYUDA_BLOQUEO[remoto.status] }}</span>
          </template>
          <template v-else-if="remoto">
            <strong><svg class="estado-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="9" cy="8" r="3.2" /><path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" /><path d="M16 4.8a3.2 3.2 0 0 1 0 6M21 20v-1a5 5 0 0 0-3.5-4.7" /></svg>Borrador compartido</strong>
            <span class="muted"> · lo ven y lo pueden modificar todos · versión {{ remoto.version }}{{ remoto.owner ? ' · creado por ' + remoto.owner : '' }}{{ remoto.updatedAt ? ' · guardado ' + fechaHora(remoto.updatedAt) + (remoto.updatedBy ? ' por ' + remoto.updatedBy : '') : '' }}</span>
          </template>
          <template v-else>
            <strong><svg class="estado-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M7 3v5h8V3M7 21v-7h10v7" /></svg>Local</strong><span class="muted"> · solo está en este navegador: nadie más lo ve</span>
          </template>
          <span v-if="sucio" class="tag issue warn" :title="editado ? 'Hay cambios en este navegador que todavía no están guardados en el servidor' : 'Los precios se han actualizado con los del inventario: guarda para fijarlos en el borrador'">
            {{ editado ? 'Cambios sin guardar' : 'Precios actualizados' }}
          </span>
        </div>
        <div class="save-actions">
          <template v-if="!bloqueado">
            <button type="button" :disabled="guardando || (!!remoto && !sucio)" :title="remoto ? 'Guarda los cambios en el servidor para todos' : 'Lo guarda en el servidor: lo verán y podrán modificarlo todos los usuarios de la intranet'" @click="$emit('guardar')">
              {{ guardando ? 'Guardando…' : remoto ? 'Guardar cambios' : 'Guardar y compartir' }}
            </button>
            <button v-if="remoto && editado" type="button" class="secondary" :disabled="guardando" title="Deshace los cambios sin guardar: vuelve a como estaba la última vez que se guardó" @click="$emit('descartar')">Descartar cambios</button>
          </template>
          <!-- Los del servidor se duplican con «Nueva variante», en la tira de variantes -->
          <button v-if="!remoto || remoto.status === 'descartado'" type="button" class="secondary" title="Crea una copia local con la que puedes trabajar sin tocar este presupuesto" @click="$emit('duplicar')">Duplicar</button>
        </div>
        <p v-if="errorGuardar && !conflicto" class="error save-msg" role="alert">{{ errorGuardar }}</p>
        <div v-if="conflicto && conflicto.kind === 'version'" class="save-conflict" role="alert">
          <p><strong>⚠ No se han guardado tus cambios.</strong> {{ conflicto.message }}</p>
          <div class="save-actions">
            <button type="button" class="secondary" :disabled="guardando" @click="$emit('resolver', 'servidor')">Cargar su versión (descarto mis cambios)</button>
            <button type="button" class="secondary" :disabled="guardando" @click="$emit('resolver', 'sobrescribir')">Guardar la mía encima</button>
            <button type="button" class="secondary" :disabled="guardando" @click="$emit('resolver', 'copia')">Guardar mis cambios como copia local</button>
          </div>
        </div>
        <div v-if="conflicto && conflicto.kind === 'deleted'" class="save-conflict" role="alert">
          <p><strong>⚠ Este borrador ya no existe en el servidor:</strong> su autor lo ha eliminado.</p>
          <div class="save-actions">
            <button type="button" class="secondary" :disabled="guardando" @click="$emit('resolver', 'recrear')">Volver a guardarlo y compartirlo</button>
            <button type="button" class="secondary" :disabled="guardando" @click="$emit('resolver', 'local')">Dejarlo como local</button>
          </div>
        </div>
      </section>

      <section class="costs-head" aria-label="Parámetros del presupuesto">
        <div class="params-head">
          <strong>Parámetros del presupuesto</strong>
          <button type="button" class="link-btn" :disabled="bloqueado" @click="$emit('editar-parametros')">Editar parámetros</button>
          <div class="head-actions">
            <button v-if="conInventario" type="button" class="secondary" title="Los precios y las características de los equipos se editan en el inventario" @click="$emit('abrir-inventario')">Precios en el inventario</button>
          </div>
        </div>
        <ul class="param-list">
          <li>
            <span class="muted">Cliente</span>
            <strong v-if="estado.customer">
              {{ estado.customer.name }}<span v-if="estado.customer.kind === 'existente' && estado.customer.cif" class="muted"> · CIF {{ estado.customer.cif }}</span>
              <span v-if="estado.customer.kind === 'potencial'" class="tag state local" title="Aún no existe en la intranet">Potencial</span>
            </strong>
            <span v-else class="tag issue warn" title="Elige el cliente en «Editar parámetros»: hace falta para guardarlo y compartirlo">Sin cliente</span>
          </li>
          <li><span class="muted">Potencia a instalar</span> <strong>{{ estado.survey.targetKwp > 0 ? estado.survey.targetKwp.toLocaleString('es-ES') + ' kWp' : '—' }}</strong></li>
          <li><span class="muted">Paneles</span> <strong>{{ estado.moduleCount }} × {{ estado.moduleWp }} Wp</strong></li>
          <li><span class="muted">Cubierta</span> <strong>{{ ROOF_LABEL[estado.survey.roof] }}</strong></li>
          <li><span class="muted">Suministro</span> <strong>{{ estado.survey.supply === 'monofasico' ? 'Monofásico' : estado.survey.supply === 'trifasico' ? 'Trifásico' : '—' }}</strong></li>
          <li class="calc" title="Potencia de los paneles del presupuesto"><span class="muted">Potencia instalada</span> <strong>{{ (resumen.wp / 1000).toLocaleString('es-ES', { maximumFractionDigits: 2 }) }} kWp</strong></li>
          <li class="calc" title="Coste total dividido entre la potencia instalada (en el Excel, «COSTE RATIO W/P»)"><span class="muted">Coste ratio W/p</span> <strong>{{ ratio(resumen.costRatio) }} €/Wp</strong></li>
        </ul>
      </section>

      <div class="costs-body" :class="{ review: bloqueado }">
        <fieldset v-if="!bloqueado" class="locked-fieldset">
          <pasos-presupuesto :catalogo="catalogo" :estado="estado" :avisos="avisos" :presupuesto-id="presupuesto.id" @cambiar="cambiar" @anadir="anadirProducto"
                             @quitar="quitarProducto" @ficha="fichaAbierta = $event" @editar-parametros="$emit('editar-parametros')" />
        </fieldset>

        <aside class="costs-summary" aria-label="Presupuesto de costes">
          <div class="summary-head">
            <h2>Presupuesto del proyecto</h2>
            <button type="button" class="secondary" :disabled="bloqueado || estado.lines.length === 0" title="Quita todas las filas del presupuesto, de todos los pasos" @click="vaciarFilas">Vaciar filas</button>
          </div>
          <div v-if="estado.lines.length > 1" class="order-switch" role="group" aria-label="Orden de las filas">
            <span class="muted">Orden</span>
            <button type="button" :class="{ active: orden === 'insercion' }" :aria-pressed="orden === 'insercion'" title="Las filas salen como las fuiste añadiendo" @click="elegirOrden('insercion')">De inserción</button>
            <button type="button" :class="{ active: orden === 'fijo' }" :aria-pressed="orden === 'fijo'" title="Las filas salen siempre en el mismo orden: el de los pasos (paneles, estructura, inversor…) y, dentro, por nombre. El PDF sale siempre así." @click="elegirOrden('fijo')">Fijo</button>
          </div>
          <!-- Siempre a la vista al recorrer una lista larga: se cambia el precio de venta viendo el beneficio -->
          <div class="sale-bar">
            <div class="sale-cell"><label><span>Precio de venta (€/Wp)</span><campo-numerico :model-value="estado.saleRatio" etiqueta="Precio de venta en euros por Wp" :paso="0.01" @update:model-value="cambiar({ saleRatio: $event })" /></label></div>
            <div class="sale-cell"><span>Presupuesto</span><strong class="sale-value">{{ eur(resumen.budget) }}</strong></div>
            <div class="sale-cell profit" :class="{ loss: resumen.profit < 0 }"><span>Beneficio</span><strong class="sale-value">{{ eur(resumen.profit) }} <small>{{ pct(resumen.margin) }}</small></strong></div>
          </div>
          <p v-if="sinPrecio > 0" class="step-note warn no-price-note" role="status">
            ⚠ {{ sinPrecio }} {{ sinPrecio === 1 ? 'fila sin precio' : 'filas sin precio' }}: el coste del presupuesto no está completo. Pon el precio en la propia fila o en el inventario.
          </p>
          <div v-if="cambiosPrecio.length > 0" class="price-notice" role="status">
            <button type="button" class="icon-btn" aria-label="Cerrar el aviso" @click="cambiosPrecio = []">×</button>
            <strong>Precios actualizados desde el inventario</strong>
            <ul><li v-for="(c, i) in cambiosPrecio" :key="i">{{ c.name }}: {{ eur(c.from) }} → <strong>{{ eur(c.to) }}</strong></li></ul>
          </div>
          <div v-if="avisos.length > 0" class="compat-banner" role="alert">
            <strong>{{ errores > 0 ? '⛔' : '⚠' }} {{ errores > 0 ? errores + ' incompatibilidad' + (errores === 1 ? '' : 'es') : '' }}{{ errores > 0 && revisar > 0 ? ' y ' : '' }}{{ revisar > 0 ? revisar + ' para revisar' : '' }}</strong>
            <p class="muted">Cambia los productos marcados: cada fila lleva su aviso.</p>
            <ul>
              <li v-for="i in avisos" :key="i.id" :class="levelClass(i.level)"><span class="issue-step">{{ tituloPaso(i.step) }}</span> {{ i.message }}</li>
            </ul>
          </div>
          <p v-if="estado.lines.length === 0" class="muted">Añade equipos desde las pestañas: aquí se irán sumando los costes del proyecto.</p>

          <template v-for="partida in catalogo.partidas" :key="partida.key">
            <div v-if="filasDe(partida.key).length > 0" class="partida">
              <div class="partida-head">
                <h3>{{ partida.label }}</h3>
                <span>
                  <span class="muted ratio" title="Coste ratio W/p de la partida">{{ ratio(porWp(resumen.byPartida[partida.key] || 0)) }} €/Wp</span>
                  <strong>{{ eur(resumen.byPartida[partida.key] || 0) }}</strong>
                </span>
              </div>
              <table class="line-table">
                <thead><tr><th>Concepto</th><th class="num">Cant.</th><th class="num">Precio ud.</th><th class="num" title="Total de la fila y, debajo, su coste ratio W/p">Total · €/Wp</th><th /></tr></thead>
                <tbody>
                  <template v-for="linea in filasDe(partida.key)" :key="linea.id">
                    <tr :class="claseFila(linea)">
                      <td>
                        <button v-if="productoDe(linea)" type="button" class="product-link" title="Ver la ficha técnica" @click="fichaAbierta = productoDe(linea)">{{ lineName(linea) }}</button>
                        <template v-else>{{ lineName(linea) }}</template>
                        <span class="muted"> · {{ linea.unit }}</span>
                      </td>
                      <td class="num">
                        <campo-numerico :clase="'qty' + (linea.auto || linea.perPanel || (linea.clamp && estado.strings && estado.strings.length) ? ' auto' : '')" :etiqueta="'Cantidad de ' + lineName(linea)"
                                        :model-value="effectiveQty(linea, estado)" @update:model-value="cambiarLinea(linea.id, { qty: $event, auto: false, perPanel: undefined, clamp: undefined })" />
                      </td>
                      <td class="num">
                        <campo-numerico :etiqueta="'Precio unitario de ' + lineName(linea)" :model-value="linea.price" @update:model-value="cambiarLinea(linea.id, { price: $event, priceEdited: true })" />
                        <button v-if="linea.priceEdited" type="button" class="link-btn manual-price" title="Precio puesto a mano: ya no sigue al inventario. Pulsa para volver a usar el del inventario." @click="volverAlInventario(linea.id)">↺ del inventario</button>
                      </td>
                      <td class="num">{{ eur(lineTotal(linea, estado)) }}<div class="muted ratio" title="Coste ratio W/p de la fila">{{ ratio(porWp(lineTotal(linea, estado))) }}</div></td>
                      <td class="num"><button type="button" class="icon-btn trash" title="Quitar la fila" :aria-label="'Quitar ' + lineName(linea)" @click="quitarLinea(linea.id)">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                      </button></td>
                    </tr>
                    <tr v-if="(avisosPorFila.get(linea.id) || []).length > 0" class="issue-row">
                      <td colspan="5">
                        <div v-for="i in avisosPorFila.get(linea.id)" :key="i.id" class="line-issue" :class="levelClass(i.level)" role="alert"><strong>{{ i.level === 'error' ? 'Incompatible' : 'Revisar' }}:</strong> {{ i.message }}</div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </template>

          <dl class="totals">
            <div><dt>Coste total</dt><dd>{{ eur(resumen.cost) }}</dd></div>
            <div><dt>Coste ratio W/p</dt><dd>{{ ratio(resumen.costRatio) }} €/Wp</dd></div>
            <div><dt>Presupuesto <span class="muted">({{ estado.saleRatio.toLocaleString('es-ES') }} €/Wp × {{ resumen.wp.toLocaleString('es-ES') }} Wp)</span></dt><dd>{{ eur(resumen.budget) }}</dd></div>
            <div class="profit" :class="{ loss: resumen.profit < 0 }"><dt>Beneficio</dt><dd>{{ eur(resumen.profit) }} <span>({{ pct(resumen.margin) }})</span></dd></div>
          </dl>
          <div v-if="estado.lines.length > 0" class="export-box">
            <strong>Exportar a PDF</strong>
            <div class="export-actions">
              <button type="button" :disabled="errores > 0 || exportando !== null" title="Con los costes, el coste por Wp y el beneficio: para uso interno" @click="exportar('interno')">{{ exportando === 'interno' ? 'Generando…' : 'PDF interno' }}</button>
              <button type="button" class="secondary" :disabled="errores > 0 || exportando !== null" title="La propuesta para el cliente en PDF (presentación con la instalación, el precio de venta y la página de firma, sin costes ni beneficio)" @click="exportar('cliente')">{{ exportando === 'cliente' ? 'Generando…' : 'PDF para el cliente' }}</button>
              <button type="button" class="secondary" :disabled="errores > 0 || exportando !== null" title="La misma propuesta como archivo HTML: se abre en el navegador y se puede mandar tal cual" @click="exportar('html')">{{ exportando === 'html' ? 'Generando…' : 'HTML de la propuesta' }}</button>
            </div>
            <p v-if="errorExportar" class="error" role="alert">{{ errorExportar }}</p>
            <p v-if="errores > 0" class="step-note warn export-blocked" role="status">Con {{ errores }} incompatibilidad{{ errores === 1 ? '' : 'es' }} sin resolver no se podrá exportar: cambia los productos marcados.</p>
          </div>
          <caja-estado v-if="!revisando" :presupuesto="presupuesto" :guardando="guardando" :estado-propuesta="estadoPropuesta" :sin-guardar="sucio" @estado="$emit('estado', $event)" />
        </aside>
      </div>
      <div v-if="revisando" class="review-bar" role="region" aria-label="Validación del presupuesto">
        <strong>Pendiente de validar</strong>
        <caja-estado :presupuesto="presupuesto" :guardando="guardando" :estado-propuesta="''" :sin-guardar="sucio" @estado="$emit('estado', $event)" />
      </div>
    </template>

    <!-- El producto se edita sin salir del presupuesto: al guardar, sus filas toman el precio nuevo del inventario -->
    <ficha-producto-modal
      v-if="productoEditando" :key="productoEditando" :catalogo="catalogo" :producto-id="productoEditando" :marcas="marcas" :proveedores="proveedores" :sencilla="true" :ocupado="ocupadoInventario"
      @cerrar="productoEditando = null" @guardado="alGuardarProducto" @borrado="alGuardarProducto" @recargar="cargarCatalogo" @revisar="revisarPrecios"
    />
    <ficha-tecnica-modal v-if="fichaAbierta" :producto="catalogo.items.find((i) => i.id === fichaAbierta.id) || fichaAbierta" :categoria="catalogo.categories.find((c) => c.key === fichaAbierta.category)" @cerrar="fichaAbierta = null" @editar="editarDesdeFicha" />
  </div>
</template>

<script>
import TiraVariantes from './TiraVariantes.vue'
import SeccionPropuesta from './SeccionPropuesta.vue'
import CajaEstado from './CajaEstado.vue'
import CampoNumerico from './CampoNumerico.vue'
import PasosPresupuesto from './PasosPresupuesto.vue'
import FichaTecnicaModal from './FichaTecnicaModal.vue'
import FichaProductoModal from '../Inventario/FichaProductoModal.vue'
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import {
  effectiveQty, eur, lineName, lineTotal, newLine, parseCosts, pct, ratio, summarize, syncWithCatalog
} from '@/utils/planificador/motor/costes'
import { checkCompatibility, currentStrings, issuesByLine, levelClass, rebalanceStrings, sizeInverters } from '@/utils/planificador/motor/compatibilidad'
import { descargarArchivo, imprimirHtml } from '@/utils/planificador/documentos/descarga'
import { fuseQuantity } from '@/utils/planificador/motor/protecciones'
import { ROOF_LABEL, STEPS, sortFixed, withMargin } from '@/utils/planificador/motor/pasosConfig'
import { canonical, isDirty } from '@/utils/planificador/almacenPresupuestos'

const ETIQUETA_BLOQUEO = { borrador: 'Borrador', enviado: 'Enviado al cliente', validado: 'Validado', descartado: 'Descartado' }
const AYUDA_BLOQUEO = { borrador: '', enviado: 'no se puede editar: para cambiar algo, duplícalo', validado: '', descartado: 'se validó otra variante de su oferta: no se puede editar' }

// Presupuestador: cálculo de costes de una instalación. Los equipos y precios salen del inventario; el presupuesto empieza vacío,
// con los datos de partida ya fijados. Este componente solo edita: dónde se guarda (local o borrador compartido) lo decide el contenedor.
export default {
  name: 'Editor-Presupuesto-Component',
  components: { TiraVariantes, SeccionPropuesta, CajaEstado, CampoNumerico, PasosPresupuesto, FichaTecnicaModal, FichaProductoModal },
  props: {
    conInventario: { type: Boolean, default: false },
    presupuesto: { type: Object, required: true },
    guardando: { type: Boolean, default: false },
    errorGuardar: { type: String, default: null },
    conflicto: { type: Object, default: null }
  },
  emits: ['abrir-inventario', 'cambiar', 'numeros', 'volver', 'editar-parametros', 'guardar', 'descartar', 'duplicar', 'abrir-variante', 'variante-eliminada', 'estado', 'resolver'],
  data() {
    return {
      ETIQUETA_BLOQUEO, AYUDA_BLOQUEO, ROOF_LABEL, catalogo: null, error: null, cambiosPrecio: [], ordenVista: null,
      fichaAbierta: null, productoEditando: null, marcas: [], proveedores: [], ocupadoInventario: false, exportando: null, errorExportar: null, estadoPropuesta: '', pestana: this.presupuesto.remote && this.presupuesto.remote.status === 'validado' ? 'propuesta' : 'presupuesto'
    }
  },
  computed: {
    estado() { return this.presupuesto.state },
    remoto() { return this.presupuesto.remote },
    bloqueado() { return !!this.remoto && this.remoto.status !== 'borrador' },
    // El inversor elegido (la primera fila de inversores): al cambiarlo se vuelven a calcular las unidades que hacen falta para los strings
    claveInversor() {
      if (!this.catalogo) return ''
      const fila = this.estado.lines.find((l) => l.itemId && (this.catalogo.items.find((i) => i.id === l.itemId) || {}).category === 'inversores')
      return fila ? fila.itemId : ''
    },
    // Cuántas unidades del inversor elegido lleva el presupuesto (para repartir los strings entre sus entradas al cambiarlas)
    unidadesInversor() {
      if (!this.claveInversor) return 0
      return this.estado.lines.filter((l) => l.itemId === this.claveInversor).reduce((s, l) => s + effectiveQty(l, this.estado), 0)
    },
    validado() { return !!this.remoto && this.remoto.status === 'validado' },
    revisando() { return !!this.remoto && this.remoto.status === 'enviado' },
    sucio() { return isDirty(this.presupuesto) },
    // Los precios siguen al inventario: si solo ha cambiado eso desde que se guardó, hay algo que guardar pero nada que descartar
    editado() {
      if (!this.sucio || !this.remoto || !this.catalogo) return this.sucio
      try {
        const guardado = parseCosts(JSON.parse(this.remoto.syncedJson))
        return canonical(this.estado) !== canonical(syncWithCatalog(guardado, this.catalogo).state)
      } catch (e) {
        return true
      }
    },
    resumen() { return this.catalogo ? summarize(this.estado, this.catalogo) : null },
    avisos() { return this.catalogo ? checkCompatibility(this.estado, this.catalogo) : [] },
    avisosPorFila() { return issuesByLine(this.avisos) },
    errores() { return this.avisos.filter((i) => i.level === 'error').length },
    revisar() { return this.avisos.filter((i) => i.level === 'warn').length },
    sinPrecio() { return this.estado.lines.filter((l) => l.price <= 0).length },
    orden() { return this.bloqueado ? this.ordenVista || this.estado.order : this.estado.order }
  },
  watch: {
    validado(v) { this.pestana = v ? 'propuesta' : 'presupuesto' },
    // Lo que enseña la lista de este presupuesto (potencia, paneles, importe)
    resumen(r) { if (r) this.$emit('numeros', { kwp: r.wp / 1000, panels: this.estado.moduleCount, total: r.budget }) },
    'estado.moduleCount'() { this.ajustarInversores(); if (this.resumen) this.$emit('numeros', { kwp: this.resumen.wp / 1000, panels: this.estado.moduleCount, total: this.resumen.budget }) },
    // El borrador en curso sigue al catálogo: con cada versión nueva, sus filas toman los precios del inventario
    catalogo() { this.seguirCatalogo(); this.ajustarInversores() },
    // Los inversores que hacen falta para los strings se asignan solos: al cambiar los strings, los paneles o el inversor elegido se suben las
    // unidades hasta que haya entradas para todos (si se bajan a mano después, se respeta)
    'estado.strings'() { this.ajustarInversores() },
    claveInversor() { this.ajustarInversores() },
    // Si se cambian a mano las unidades del inversor, los strings se vuelven a repartir entre sus entradas (si hace falta)
    unidadesInversor() { this.ajustarInversores() }
  },
  mounted() {
    this.cargarCatalogo()
    // Un cambio en el inventario se refleja al volver a esta pantalla o a esta pestaña
    this.alVolver = () => { if (document.visibilityState === 'visible') planificadorApi.catalogo().then((c) => { this.catalogo = c }, () => undefined) }
    document.addEventListener('visibilitychange', this.alVolver)
    window.addEventListener('focus', this.alVolver)
  },
  beforeUnmount() {
    document.removeEventListener('visibilitychange', this.alVolver)
    window.removeEventListener('focus', this.alVolver)
  },
  methods: {
    productoDe(linea) { return linea.itemId && this.catalogo ? this.catalogo.items.find((i) => i.id === linea.itemId) || null : null },
    ajustarInversores() {
      if (!this.catalogo || this.bloqueado || !this.claveInversor) return
      const ajustado = sizeInverters(this.estado, this.catalogo)
      if (ajustado) this.$emit('cambiar', ajustado)
    },
    vaciarFilas() { if (window.confirm('Se quitarán todas las filas del presupuesto, de todos los pasos. ¿Continuar?')) this.cambiar({ lines: [] }) },
    eur, pct, ratio, lineName, lineTotal, effectiveQty, levelClass,
    // PDF del presupuesto en curso: el servidor lo maqueta (con costes y beneficio, o solo el precio de venta para el cliente). Con
    // incompatibilidades sin resolver no se puede exportar: un PDF con equipos que no casan entre sí no debe salir.
    async exportar(modo) {
      if (this.errores > 0 || !this.catalogo) return
      this.exportando = modo
      this.errorExportar = null
      const estado = this.estado
      try {
        if (modo === 'cliente' || modo === 'html') {
          await this.propuestaParaElCliente(modo)
          return
        }
        const { blob, nombre } = await planificadorApi.pdfPresupuesto({
          client: estado.client, moduleWp: estado.moduleWp, moduleCount: estado.moduleCount, saleRatio: estado.saleRatio,
          // El diseño de strings que vale ahora (a medida o automático): paneles de cada string y entrada del inversor
          strings: currentStrings(estado, this.catalogo).map((s) => ({ panels: s.panels, input: s.input })),
          // El PDF sale siempre en el orden fijo de los pasos, esté como esté la pantalla
          lines: sortFixed(estado.lines, (id) => this.catalogo.items.find((i) => i.id === id)).map((l) => ({
            group: l.group, equipment: l.equipment, model: l.model, supplier: l.supplier, unit: l.unit, qty: effectiveQty(l, estado), price: l.price
          }))
        }, modo)
        descargarArchivo(blob, nombre)
      } catch (e) {
        this.errorExportar = mensajeError(e)
      } finally {
        this.exportando = null
      }
    },
    // El documento para el cliente es la propuesta (la misma presentación que luego se entrega desde la pestaña «Propuesta al cliente»),
    // sacada del presupuesto tal como está. En PDF la hace el servidor con Chrome; si no lo tiene (501), se abre el cuadro de impresión del
    // navegador para guardarla como PDF y, si tampoco deja, se descarga el HTML.
    async propuestaParaElCliente(formato) {
      const estado = this.estado
      const cuerpo = {
        name: [estado.client, estado.reference].filter(Boolean).join(' · '),
        // El diseño de strings que vale ahora (vacío con microinversores o sin panel), no uno viejo guardado
        data: { ...estado, strings: currentStrings(estado, this.catalogo).map((x) => ({ panels: x.panels, input: x.input })) },
        kwp: this.resumen.wp / 1000,
        panels: estado.moduleCount,
        budget_total: this.resumen.budget
      }
      if (formato === 'cliente') {
        try {
          const pdf = await planificadorApi.propuestaPdfDelBorrador(cuerpo)
          descargarArchivo(pdf.blob, pdf.nombre)
          return
        } catch (e) {
          if (!(e && e.response && e.response.status === 501)) throw e
        }
      }
      const { blob, nombre } = await planificadorApi.propuestaDelBorrador(cuerpo)
      if (formato === 'html') {
        descargarArchivo(blob, nombre)
        return
      }
      try {
        // El PDF se propone guardar con el mismo nombre que la propuesta HTML («Propuesta cliente · proyecto»)
        await imprimirHtml(await blob.text(), nombre.replace(/\.html$/i, ''))
      } catch (e) {
        descargarArchivo(blob, nombre)
      }
    },
    fechaHora(iso) { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) },
    tituloPaso(clave) { const p = STEPS.find((x) => x.key === clave); return p ? p.title : clave },
    async cargarCatalogo() {
      try { this.catalogo = await planificadorApi.catalogo() } catch (e) { this.error = mensajeError(e) }
    },
    // Editar un producto desde el presupuestador (el lápiz de su ficha, que se abre desde el nombre): se abre su ficha del inventario con las listas de marcas y
    // proveedores; al guardar se vuelve a leer el catálogo y las filas del borrador toman el precio nuevo (aviso «Precios actualizados»)
    editarDesdeFicha() {
      const item = this.fichaAbierta
      this.fichaAbierta = null
      if (item) this.editarProducto(item)
    },
    async editarProducto(item) {
      try {
        const [m, p] = await Promise.all([planificadorApi.marcas(), planificadorApi.proveedores()])
        this.marcas = m.map((x) => x.name)
        this.proveedores = p.map((x) => x.name)
      } catch (e) { /* sin las listas se edita igualmente: se vuelven a pedir al abrir otro producto */ }
      this.productoEditando = item.id
    },
    async alGuardarProducto() {
      this.productoEditando = null
      await this.cargarCatalogo()
    },
    async revisarPrecios(ids) {
      this.ocupadoInventario = true
      try {
        await planificadorApi.marcarRevisados(ids)
        await this.cargarCatalogo()
      } catch (e) {
        this.error = mensajeError(e)
      } finally {
        this.ocupadoInventario = false
      }
    },
    seguirCatalogo() {
      if (!this.catalogo || this.bloqueado) return
      const r = syncWithCatalog(this.estado, this.catalogo)
      if (r.state === this.estado) return
      this.$emit('cambiar', r.state)
      if (r.changes.length > 0) this.cambiosPrecio = [...r.changes, ...this.cambiosPrecio].slice(0, 12)
    },
    // Si cambian los paneles y ya hay strings repartidos, se reparten de nuevo los paneles entre los mismos strings
    cambiar(cambios) {
      const siguiente = { ...this.estado, ...cambios }
      this.$emit('cambiar', 'moduleCount' in cambios && this.catalogo ? { ...siguiente, strings: rebalanceStrings(siguiente, this.catalogo) } : siguiente)
    },
    cambiarLinea(id, cambios) { this.$emit('cambiar', { ...this.estado, lines: this.estado.lines.map((l) => (l.id === id ? { ...l, ...cambios } : l)) }) },
    quitarLinea(id) { this.$emit('cambiar', { ...this.estado, lines: this.estado.lines.filter((l) => l.id !== id) }) },
    elegirOrden(siguiente) { if (this.bloqueado) this.ordenVista = siguiente; else this.cambiar({ order: siguiente }) },
    filasDe(partida) {
      const dentro = this.estado.lines.filter((l) => l.group === partida)
      return this.orden === 'fijo' ? sortFixed(dentro, (id) => this.catalogo.items.find((i) => i.id === id)) : dentro
    },
    porWp(euros) { return this.resumen.wp > 0 ? euros / this.resumen.wp : 0 },
    claseFila(linea) {
      const delas = this.avisosPorFila.get(linea.id)
      return delas ? 'has-issue ' + (delas.some((i) => i.level === 'error') ? 'bad' : 'warn') : undefined
    },
    volverAlInventario(id) {
      const r = syncWithCatalog({ ...this.estado, lines: this.estado.lines.map((l) => (l.id === id ? { ...l, priceEdited: false } : l)) }, this.catalogo)
      this.$emit('cambiar', r.state)
    },
    // Al añadir un equipo, la cantidad sale de lo decidido antes: los paneles fijan la potencia del módulo; el cable, los metros con su margen
    anadirProducto(item) {
      const categoria = this.catalogo.categories.find((c) => c.key === item.category)
      const linea = newLine(item, categoria ? categoria.label : item.category)
      const { cableMeters, acMeters } = this.estado.survey
      if (item.category === 'modulos') {
        const wp = Number(item.attrs.potencia_wp)
        this.$emit('cambiar', { ...this.estado, moduleWp: wp > 0 ? wp : this.estado.moduleWp, lines: [...this.estado.lines, linea] })
        return
      }
      if (item.category === 'cableado' && item.unit === 'm') {
        const metros = item.attrs.tipo === 'CC' ? cableMeters : item.attrs.tipo === 'AC' ? acMeters : 0
        if (metros > 0) linea.qty = withMargin(metros)
      }
      // Los fusibles (y portafusibles) de continua van por string: tantos como strings por polaridades
      const fusibles = fuseQuantity(item, this.estado, this.catalogo)
      if (fusibles) linea.qty = fusibles
      this.$emit('cambiar', { ...this.estado, lines: [...this.estado.lines, linea] })
    },
    quitarProducto(itemId) {
      const primera = this.estado.lines.find((l) => l.itemId === itemId)
      if (primera) this.$emit('cambiar', { ...this.estado, lines: this.estado.lines.filter((l) => l.id !== primera.id) })
    }
  }
}
</script>
