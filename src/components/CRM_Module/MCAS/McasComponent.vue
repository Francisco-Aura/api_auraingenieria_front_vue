<template>
  <div class="mcas-container fade-in">
    <!-- Comisiones MCAS: mismo esquema que Cartera de Clientes (resumen + panel de tabla).
         Una tarjeta por grupo de estado: cada tarjeta filtra la tabla -->
    <div class="stats-panel">
      <div class="stats-container">
        <button
          v-for="tarjeta in tarjetas"
          :key="tarjeta.id"
          type="button"
          class="stat-card stat-card--filtro"
          :class="{ 'stat-card--activa': grupoActivo === tarjeta.id }"
          :title="tarjeta.ayuda"
          :aria-pressed="grupoActivo === tarjeta.id ? 'true' : 'false'"
          @click="seleccionarGrupo(tarjeta.id)"
        >
          <span class="stat-icon"><i :class="tarjeta.icono"></i></span>
          <span class="stat-content">
            <span class="stat-value">{{ contarEstados(tarjeta.estados) }}</span>
            <span class="stat-label">{{ tarjeta.label }}</span>
          </span>
        </button>
      </div>
    </div>

    <!-- Cómo funciona MCAS en tres pasos: qué genera cada acción.
         Toda propuesta acaba en un servicio (aprobada, rechazada y editada o completada a mano)
         o cerrada sin comisión con «No procede». -->
    <ol class="mcas-guia" aria-label="Cómo funciona MCAS">
      <li class="mcas-guia-paso">
        <span class="mcas-guia-numero" aria-hidden="true">1</span>
        <span><strong>Guarde el contrato</strong> con la pestaña «Comisión MCAS» completa. El tipo de precio y el suministro ya vienen rellenos.</span>
      </li>
      <li class="mcas-guia-paso">
        <span class="mcas-guia-numero" aria-hidden="true">2</span>
        <span><strong>Revise la propuesta</strong>: importe calculado con la regla publicada o motivo por el que requiere revisión.</span>
      </li>
      <li class="mcas-guia-paso">
        <span class="mcas-guia-numero" aria-hidden="true">3</span>
        <span><strong>Apruébela</strong> y se crea el servicio de comisión; puede marcar varias y aprobarlas a la vez. Si la rechaza, se abre la edición para corregir importe y pagos y crear el servicio; las que requieren revisión manual se completan igual. Si no corresponde comisión, use «No procede».</span>
      </li>
    </ol>

    <!-- Tabla de propuestas -->
    <div class="card table-panel">
      <div class="table-header">
        <div class="table-filtros">
          <div class="vista-toggle" role="group" aria-label="Filtrar por tipo de evento">
            <button
              v-for="op in opcionesEvento"
              :key="op.value || 'todas'"
              type="button"
              class="btn-view-toggle"
              :class="{ active: filtroEvento === op.value }"
              :aria-pressed="filtroEvento === op.value ? 'true' : 'false'"
              @click="filtroEvento = op.value"
            >
              <i :class="op.icono"></i>
              <span>{{ op.label }}</span>
              <span class="toggle-count">{{ contarEvento(op.value) }}</span>
            </button>
          </div>
          <select v-model="filtroComercializadora" class="toolbar-select" aria-label="Filtrar por comercializadora" title="Filtrar por comercializadora">
            <option value="">Todas las comercializadoras</option>
            <option v-for="c in comercializadorasDisponibles" :key="c" :value="c">{{ c }}</option>
          </select>
          <button
            type="button"
            class="btn btn-toggle-baja"
            :class="{ active: verHistorico }"
            :aria-pressed="verHistorico ? 'true' : 'false'"
            :title="verHistorico ? 'Ocultar las propuestas antiguas (superadas o desactualizadas por una más reciente)' : 'Ver también las propuestas antiguas (superadas o desactualizadas por una más reciente)'"
            @click="verHistorico = !verHistorico"
          >
            <i class="fas fa-history"></i>
            <span>{{ verHistorico ? 'Ocultar histórico' : 'Ver histórico' }}</span>
          </button>
        </div>
        <div class="table-actions-horizontal">
          <button
            v-if="hayPorAprobar"
            class="btn btn-save"
            :disabled="accionando || !propuestasSeleccionadas.length"
            :title="propuestasSeleccionadas.length ? 'Aprobar de una vez las propuestas marcadas y crear sus servicios' : 'Marque las casillas de las propuestas por aprobar'"
            @click="aprobarSeleccionadas"
          >
            <i class="fas fa-check-double"></i>
            <span>{{ textoAprobarSeleccionadas }}</span>
          </button>
          <button class="btn btn-refresh" :disabled="cargando" title="Actualizar datos" @click="cargar">
            <i :class="cargando ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
            <span>Actualizar</span>
          </button>
          <button class="btn btn-secondary" :disabled="accionando" title="Calcular la propuesta de un contrato a partir de su número" @click="calcularManual">
            <i class="fas fa-calculator"></i>
            <span>Calcular propuesta</span>
          </button>
        </div>
      </div>

      <div class="table-responsive" v-desborde-tabla>
        <table class="data-table data-table--compacta data-table--acciones-fijas">
          <thead>
            <tr>
              <th class="th-col-seleccion">
                <div class="column-header">
                  <div class="column-title column-title--sin-orden">
                    <input
                      type="checkbox"
                      class="casilla-seleccion"
                      :checked="todasVisiblesSeleccionadas"
                      :indeterminate.prop="algunaVisibleSeleccionada && !todasVisiblesSeleccionadas"
                      :disabled="!seleccionablesVisibles.length"
                      title="Seleccionar todas las visibles"
                      aria-label="Seleccionar todas las visibles"
                      @change="alternarSeleccionVisibles($event.target.checked)"
                    >
                  </div>
                </div>
              </th>
              <th class="sortable th-col-cliente">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('nombreCliente')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('nombreCliente')" @keydown.space.prevent="sortBy('nombreCliente')">
                    <i class="fas fa-user mr-2"></i>Cliente / CUPS
                    <i :class="getSortIcon('nombreCliente')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input v-model="columnFilters.cliente" type="text" class="column-filter" placeholder="Filtrar..." title="Nombre del cliente o CUPS" @click.stop>
                  </div>
                </div>
              </th>
              <th class="sortable th-col-contrato">
                <div class="column-header">
                  <div class="column-title" title="Número de contrato y comercializadora" @click="sortBy('numeroContrato')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('numeroContrato')" @keydown.space.prevent="sortBy('numeroContrato')">
                    <i class="fas fa-file-contract mr-2"></i>Contrato · Comercializadora
                    <i :class="getSortIcon('numeroContrato')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input v-model="columnFilters.contrato" type="text" class="column-filter" placeholder="Filtrar..." title="Número de contrato o comercializadora" @click.stop>
                  </div>
                </div>
              </th>
              <th class="sortable th-col-importe">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('importe')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('importe')" @keydown.space.prevent="sortBy('importe')">
                    <i class="fas fa-euro-sign mr-2"></i>Importe
                    <i :class="getSortIcon('importe')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input v-model="columnFilters.importe" type="text" class="column-filter" placeholder="Filtrar..." title="Importe, p. ej. 411 o 411,84" @click.stop>
                  </div>
                </div>
              </th>
              <th class="sortable th-col-estado">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('estado')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('estado')" @keydown.space.prevent="sortBy('estado')">
                    <i class="fas fa-tasks mr-2"></i>Estado
                    <i :class="getSortIcon('estado')"></i>
                  </div>
                  <div class="column-filter-container">
                    <select v-model="columnFilters.estado" class="column-filter" aria-label="Filtrar por estado" @click.stop>
                      <option value="">TODOS</option>
                      <option v-for="e in estadosDisponibles" :key="e.value" :value="e.value">{{ e.label }}</option>
                    </select>
                  </div>
                </div>
              </th>
              <th class="sortable th-col-fecha">
                <div class="column-header">
                  <div class="column-title" title="Fecha en que se creó la propuesta" @click="sortBy('creadoEn')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('creadoEn')" @keydown.space.prevent="sortBy('creadoEn')">
                    <i class="fas fa-calendar-alt mr-2"></i>Fecha
                    <i :class="getSortIcon('creadoEn')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input v-model="columnFilters.fecha" type="text" class="column-filter" placeholder="Filtrar..." title="Fecha dd/mm/aaaa" @click.stop>
                  </div>
                </div>
              </th>
              <th class="th-col-acciones">
                <div class="column-header">
                  <div class="column-title column-title--sin-orden">
                    <i class="fas fa-cogs mr-2"></i>Acciones
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-if="cargando">
              <tr v-for="n in 8" :key="'skeleton-' + n" class="skeleton-row">
                <td v-for="col in 7" :key="col"><div class="skeleton-line skeleton-line--md"></div></td>
              </tr>
            </template>
            <template v-else>
              <tr
                v-for="p in propuestasPaginadas"
                :key="p.id"
                class="fila-clicable"
                :class="{ 'fila-seleccionada': estaSeleccionada(p) }"
                @click="abrirDetalle(p)"
              >
                <td class="celda-seleccion" @click.stop>
                  <input v-if="p.estado === 'PENDIENTE_VALIDACION'" v-model="seleccionadas" type="checkbox" class="casilla-seleccion" :value="p.id" :aria-label="'Seleccionar la propuesta #' + p.id">
                </td>
                <td class="text-truncate" :title="[p.nombreCliente, p.cups].filter(Boolean).join(' · ') || null">
                  <span class="celda-principal">{{ nombreCliente(p) }}</span>
                  <span v-if="p.cups" class="celda-secundaria">{{ p.cups }}</span>
                </td>
                <td class="text-truncate" :title="tituloContrato(p)">
                  <span class="celda-principal">
                    <i v-if="esRenovacion(p)" class="fas fa-sync-alt icono-renovacion" role="img" title="Renovación" aria-label="Renovación"></i>{{ p.numeroContrato || 'Contrato #' + p.idContrato }}
                  </span>
                  <span class="celda-secundaria">{{ p.nombreComercializadora || '—' }}</span>
                </td>
                <td>
                  <span class="celda-importe">{{ formatImporte(importeFila(p)) }}</span>
                  <span v-if="p.numeroPagos" class="celda-secundaria">{{ p.numeroPagos }} {{ p.numeroPagos === 1 ? 'pago' : 'pagos' }}</span>
                </td>
                <td :title="observacion(p) || null">
                  <span class="badge" :class="'badge--' + tonoGrupo(p.estado)">{{ etiquetaGrupo(p.estado) }}</span>
                  <span v-if="detalleEstado(p)" class="celda-secundaria estado-detalle">{{ detalleEstado(p) }}</span>
                  <span v-if="observacion(p)" class="celda-secundaria observacion" :class="{ 'observacion--rechazo': esRechazo(p) }">
                    <i :class="iconoObservacion(p)"></i>{{ observacion(p) }}
                  </span>
                </td>
                <td class="celda-nowrap">{{ formatFecha(p.creadoEn) }}</td>
                <td @click.stop>
                  <div class="action-buttons">
                    <button class="btn-icon btn-view-details" title="Ver detalle" aria-label="Ver detalle" @click="abrirDetalle(p)">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button v-if="p.estado === 'PENDIENTE_VALIDACION'" class="btn-icon btn-approve" title="Aprobar y crear el servicio" aria-label="Aprobar y crear el servicio" :disabled="accionando" @click="aprobar(p)">
                      <i class="fas fa-check-circle"></i>
                    </button>
                    <button v-if="p.estado === 'PENDIENTE_VALIDACION'" class="btn-icon btn-reject" title="Rechazar propuesta" aria-label="Rechazar propuesta" :disabled="accionando" @click="rechazar(p)">
                      <i class="fas fa-times-circle"></i>
                    </button>
                    <button v-if="admiteCompletar(p)" class="btn-icon btn-edit" title="Completar manualmente" aria-label="Completar manualmente" :disabled="accionando" @click="abrirEdicion(p)">
                      <i class="fas fa-keyboard"></i>
                    </button>
                    <button v-if="p.estado === 'EN_EDICION' || p.estado === 'RECHAZADO'" class="btn-icon btn-edit" title="Editar propuesta" aria-label="Editar propuesta" :disabled="accionando" @click="editar(p)">
                      <i class="fas fa-pen"></i>
                    </button>
                    <button v-if="esRecalculable(p.estado)" class="btn-icon btn-renew" title="Recalcular" aria-label="Recalcular" :disabled="accionando" @click="recalcular(p)">
                      <i class="fas fa-redo"></i>
                    </button>
                    <button v-if="admiteNoProcede(p)" class="btn-icon btn-archive" title="No procede: cerrar sin comisión" aria-label="No procede: cerrar sin comisión" :disabled="accionando" @click="descartar(p)">
                      <i class="fas fa-ban"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!propuestasPaginadas.length">
                <td colspan="7">
                  <div class="empty-state" :class="{ 'empty-state--error': errorCarga && !propuestas.length }">
                    <template v-if="errorCarga && !propuestas.length">
                      <i class="fas fa-exclamation-triangle fa-3x"></i>
                      <p>No se pudieron cargar las propuestas de comisión</p>
                      <button class="btn btn-refresh" @click="cargar">
                        <i class="fas fa-sync-alt"></i>
                        <span>Reintentar</span>
                      </button>
                    </template>
                    <template v-else-if="!propuestas.length">
                      <i class="fas fa-inbox fa-3x"></i>
                      <p>Todavía no hay propuestas de comisión</p>
                      <p class="empty-state-detalle">
                        Aparecerán aquí al guardar un contrato con la pestaña «Comisión MCAS» rellena, cuando el interruptor «Módulo»
                        esté encendido en Configuración MCAS. Si la comercializadora del contrato todavía no tiene una tabla de comisiones
                        activa, su propuesta llega a «Necesita atención» para completarla a mano.
                      </p>
                    </template>
                    <template v-else-if="hayFiltros">
                      <i class="fas fa-search fa-3x"></i>
                      <p>No se encontraron propuestas que coincidan con la búsqueda</p>
                    </template>
                    <template v-else>
                      <i class="fas fa-history fa-3x"></i>
                      <p>No hay propuestas en curso</p>
                      <p class="empty-state-detalle">Las que hay son antiguas: pulse «Ver histórico» para verlas.</p>
                    </template>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div class="pagination-controls">
        <div class="records-per-page">
          <label for="mcasRecordsPerPage">Registros por página:</label>
          <select id="mcasRecordsPerPage" v-model.number="recordsPerPage" class="form-control">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
        <div class="pagination-info">
          Mostrando {{ paginationStart }} - {{ paginationEnd }} de {{ propuestasFiltradas.length }} registros
        </div>
        <div class="pagination-buttons">
          <button class="btn btn-outline" :disabled="currentPage === 1" title="Primera página" @click="currentPage = 1">
            <i class="fas fa-angle-double-left"></i>
          </button>
          <button class="btn btn-outline" :disabled="currentPage === 1" title="Página anterior" @click="currentPage--">
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="page-info">Página {{ currentPage }} de {{ totalPages }}</span>
          <button class="btn btn-outline" :disabled="currentPage === totalPages" title="Página siguiente" @click="currentPage++">
            <i class="fas fa-chevron-right"></i>
          </button>
          <button class="btn btn-outline" :disabled="currentPage === totalPages" title="Última página" @click="currentPage = totalPages">
            <i class="fas fa-angle-double-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- ====== Modal de detalle ======
         Bloques en el orden de la maqueta del cliente: datos del contrato, variables
         utilizadas, regla aplicada, resultado, servicio a crear y retrocesión. -->
    <div
      v-if="propuestaDetalle"
      class="mcas-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mcas-detalle-titulo"
      v-cierre-fondo="() => propuestaDetalle.estado !== 'EN_EDICION' && cerrarDetalle()"
    >
      <div class="mcas-modal mcas-modal--ancho">
        <div class="mcas-modal-header aura-modal-header">
          <span class="aura-modal-header__icono" aria-hidden="true"><i class="fas fa-file-invoice-dollar"></i></span>
          <div class="aura-modal-header__titulos">
            <h2 id="mcas-detalle-titulo">
              Propuesta #{{ propuestaDetalle.id }}
              <span class="badge" :class="'badge--' + tonoGrupo(propuestaDetalle.estado)">{{ etiquetaGrupo(propuestaDetalle.estado) }}</span>
              <span v-if="detalleEstado(propuestaDetalle)" class="estado-detalle-cabecera">{{ detalleEstado(propuestaDetalle) }}</span>
            </h2>
            <span class="aura-modal-header__subtitulo">
              <span v-if="propuestaDetalle.nombreCliente"><strong>{{ propuestaDetalle.nombreCliente }}</strong></span>
              <span class="aura-dato"><span class="aura-dato__etiqueta">Contrato</span>{{ propuestaDetalle.numeroContrato || '#' + propuestaDetalle.idContrato }}</span>
              <span v-if="propuestaDetalle.cups" class="aura-dato"><span class="aura-dato__etiqueta">CUPS</span>{{ propuestaDetalle.cups }}</span>
              <span>{{ esRenovacion(propuestaDetalle) ? 'Renovación' : 'Nuevo contrato' }} · Creada el {{ formatFecha(propuestaDetalle.creadoEn) }}</span>
            </span>
          </div>
          <button type="button" class="close-button" title="Cerrar" aria-label="Cerrar" @click="cerrarDetalle">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="mcas-modal-body">
          <div v-if="cargandoDetalle" class="detalle-stack" aria-busy="true">
            <div class="detalle-resumen">
              <div v-for="n in 4" :key="'sk-' + n" class="resumen-item">
                <div class="skeleton-line skeleton-line--sm"></div>
                <div class="skeleton-line skeleton-line--md"></div>
              </div>
            </div>
            <div class="skeleton-line skeleton-line--lg"></div>
            <div class="skeleton-line skeleton-line--md"></div>
            <div class="skeleton-line skeleton-line--lg"></div>
          </div>

          <div v-else class="detalle-stack">
            <div v-if="propuestaDetalle.motivoRechazo" class="mcas-alert mcas-alert--danger">
              <i class="fas fa-times-circle"></i>
              <div><strong>{{ etiquetaMotivo(propuestaDetalle) }}:</strong> {{ propuestaDetalle.motivoRechazo }}</div>
            </div>

            <!-- 1 · Datos del contrato (fotografía guardada con la propuesta) -->
            <section class="form-section">
              <div class="section-header">
                <i class="fas fa-file-contract"></i>
                <h3>Datos del contrato</h3>
              </div>
              <dl class="detalle-grid">
                <div><dt>Cliente</dt><dd>{{ nombreCliente(propuestaDetalle) }}</dd></div>
                <div><dt>CUPS</dt><dd>{{ propuestaDetalle.cups || '—' }}</dd></div>
                <div><dt>Número de contrato</dt><dd>{{ propuestaDetalle.numeroContrato || '—' }}</dd></div>
                <div><dt>Comercializadora</dt><dd>{{ propuestaDetalle.nombreComercializadora || '—' }}</dd></div>
                <div><dt>Gestora</dt><dd>{{ propuestaDetalle.nombreGestora || '—' }}</dd></div>
                <div><dt>Tipo de precio</dt><dd>{{ humanizar(propuestaDetalle.tipoPrecio) }}</dd></div>
                <div><dt>Suministro</dt><dd>{{ humanizar(propuestaDetalle.tipoSuministro) }}</dd></div>
                <div><dt>Segmento</dt><dd>{{ humanizar(propuestaDetalle.segmento) }}</dd></div>
                <div><dt>Nuevo o renovación</dt><dd>{{ esRenovacion(propuestaDetalle) ? 'Renovación' : 'Nuevo contrato' }}</dd></div>
                <div><dt>Tarifa de acceso</dt><dd>{{ propuestaDetalle.tarifaAcceso || '—' }}</dd></div>
                <div><dt>Tarifa de precios (producto)</dt><dd>{{ propuestaDetalle.productoComercial || '—' }}</dd></div>
              </dl>
            </section>

            <!-- 2 · Variables utilizadas en el cálculo -->
            <section class="form-section">
              <div class="section-header">
                <i class="fas fa-sliders-h"></i>
                <h3>Variables utilizadas</h3>
              </div>
              <dl class="detalle-grid detalle-grid--4">
                <div><dt>Consumo anual</dt><dd>{{ formatConsumo(propuestaDetalle.consumoAnualKwh) }}</dd></div>
                <div><dt>Potencia de cálculo</dt><dd>{{ formatPotencia(propuestaDetalle) }}</dd></div>
                <div><dt>FEE del contrato</dt><dd>{{ formatFee(propuestaDetalle.feeEurMwh) }}</dd></div>
                <div><dt>Número de pagos</dt><dd>{{ propuestaDetalle.numeroPagos || '—' }}</dd></div>
              </dl>
            </section>

            <!-- 3 · Regla aplicada (o por qué no se aplicó ninguna): nombre legible y el código debajo -->
            <section class="form-section">
              <div class="section-header">
                <i class="fas fa-book"></i>
                <h3>Regla aplicada</h3>
              </div>
              <dl v-if="propuestaDetalle.codigoRegla" class="detalle-grid detalle-grid--4">
                <div>
                  <dt>Regla</dt>
                  <dd>
                    <span class="dato-principal">{{ nombreRegla(propuestaDetalle) }}</span>
                    <span v-if="propuestaDetalle.nombreRegla" class="dato-secundario celda-codigo">{{ propuestaDetalle.codigoRegla }}</span>
                  </dd>
                </div>
                <div>
                  <dt>Tabla de comisiones</dt>
                  <dd>
                    <span class="dato-principal">{{ conjuntoVersion(propuestaDetalle) }}</span>
                    <span v-if="propuestaDetalle.nombreConjunto" class="dato-secundario celda-codigo">{{ propuestaDetalle.codigoConjunto }}</span>
                  </dd>
                </div>
                <div><dt>Método</dt><dd :title="propuestaDetalle.metodoCalculo">{{ nombreMetodo(propuestaDetalle.metodoCalculo) }}</dd></div>
                <div>
                  <dt>% de aplicación al FEE</dt>
                  <dd>{{ propuestaDetalle.porcentajeAplicacionFee != null ? formatPorcentaje(propuestaDetalle.porcentajeAplicacionFee) : 'No aplica' }}</dd>
                </div>
              </dl>
              <div v-if="advertenciasDetalle.length" class="mcas-alert mcas-alert--warning">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                  <strong>{{ propuestaDetalle.codigoRegla ? 'Advertencias del cálculo' : 'Sin regla aplicada' }}</strong>
                  <ul>
                    <li v-for="(a, i) in advertenciasDetalle" :key="i">{{ a }}</li>
                  </ul>
                </div>
              </div>
              <p v-else-if="!propuestaDetalle.codigoRegla" class="form-hint-inline">No se ha aplicado ninguna regla.</p>
            </section>

            <!-- 4 · Resultado del cálculo -->
            <section class="form-section">
              <div class="section-header">
                <i class="fas fa-calculator"></i>
                <h3>Resultado del cálculo</h3>
              </div>
              <div class="detalle-resumen detalle-resumen--2">
                <div class="resumen-item">
                  <span class="resumen-label">Importe calculado</span>
                  <span class="resumen-valor">{{ formatImporte(propuestaDetalle.importeAutomatico) }}</span>
                </div>
                <div class="resumen-item resumen-item--destacado">
                  <span class="resumen-label">Importe definitivo</span>
                  <span class="resumen-valor">{{ formatImporte(propuestaDetalle.importeDefinitivo) }}</span>
                </div>
              </div>
              <div v-if="lineasDetalle.length" class="tabla-detalle">
                <table class="data-table data-table--compacta">
                  <thead>
                    <tr>
                      <th>Concepto</th>
                      <th>Descripción</th>
                      <th>Método</th>
                      <th class="text-end">{{ desgloseEditado ? 'Calculado' : 'Importe' }}</th>
                      <th v-if="desgloseEditado" class="text-end">Definitivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="l in lineasDetalle" :key="l.id">
                      <td>{{ etiquetaLinea(l.tipoLinea) }}</td>
                      <td>{{ l.descripcion || '—' }}</td>
                      <td :title="l.metodo">{{ nombreMetodo(l.metodo) }}</td>
                      <td class="text-end celda-importe">{{ formatImporte(importeCalculadoLinea(l)) }}</td>
                      <td v-if="desgloseEditado" class="text-end celda-importe">{{ formatImporte(importeDefinitivoLinea(l)) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else class="form-hint-inline">Sin desglose: la comisión no se ha calculado automáticamente.</p>
            </section>

            <!-- 5 · Servicio que crea (o ya creó) la propuesta -->
            <section class="form-section">
              <div class="section-header">
                <i class="fas fa-tools"></i>
                <h3>{{ propuestaDetalle.idServicioCreado ? 'Servicio creado' : 'Servicio a crear' }}</h3>
              </div>
              <p v-if="sinServicio" class="form-hint-inline">Esta propuesta no crea ningún servicio.</p>
              <template v-else>
                <dl class="detalle-grid detalle-grid--4">
                  <div><dt>Producto</dt><dd>Switching</dd></div>
                  <div><dt>Importe</dt><dd>{{ formatImporte(importeServicio) }}</dd></div>
                  <div><dt>Número de pagos</dt><dd>{{ pagosServicio || '—' }}</dd></div>
                  <div v-if="propuestaDetalle.idServicioCreado">
                    <dt>Servicio</dt>
                    <dd class="dato-exito"><i class="fas fa-check-circle"></i> Servicio #{{ propuestaDetalle.idServicioCreado }} creado</dd>
                  </div>
                  <div v-else><dt>Primera cuota</dt><dd>{{ formatFecha(propuestaDetalle.fechaPrimeraAplicacion) }}</dd></div>
                </dl>
                <p v-if="propuestaDetalle.estado === 'EN_EDICION'" class="form-hint-inline">
                  Se creará con el importe y los pagos de la edición; el calendario se recalcula al guardar.
                </p>
                <div v-else-if="calendarioDetalle.length" class="tabla-detalle">
                  <table class="data-table data-table--compacta">
                    <thead>
                      <tr><th>Cuota</th><th>Fecha de pago</th><th class="text-end">Importe</th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="c in calendarioDetalle" :key="c.id">
                        <td>Cuota {{ c.numeroPago }}</td>
                        <td>{{ formatFecha(c.fechaPago) }}</td>
                        <td class="text-end celda-importe">{{ formatImporte(c.importe) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
            </section>

            <!-- 6 · Retrocesión potencial: informativa, nunca se descuenta en el alta -->
            <section class="form-section">
              <div class="section-header">
                <i class="fas fa-shield-alt"></i>
                <h3>Retrocesión potencial</h3>
              </div>
              <div class="mcas-alert mcas-alert--info">
                <i class="fas fa-info-circle"></i>
                <div>
                  <span class="retrocesion-texto">{{ propuestaDetalle.retrocesionPotencial || 'Sin política de retrocesión publicada' }}</span>
                  <p class="retrocesion-nota">No se descuenta en el alta: solo se aplicaría si el contrato causa baja anticipada.</p>
                </div>
              </div>
            </section>

            <!-- 7 · Edición manual (solo EN_EDICION): rechazadas y revisiones manuales -->
            <section v-if="propuestaDetalle.estado === 'EN_EDICION'" class="form-section">
              <div class="section-header">
                <i class="fas fa-edit"></i>
                <h3>Edición manual</h3>
              </div>
              <div v-if="avisoEdicion" class="mcas-alert mcas-alert--warning aviso-edicion" role="status">
                <i class="fas fa-exclamation-triangle"></i>
                <div>{{ avisoEdicion }}</div>
              </div>
              <p v-if="sinImporteCalculado" class="form-hint-inline">
                Introduzca el importe que corresponde a esta comisión: no se ha podido calcular automáticamente. Al guardar se crea el servicio con el importe, los pagos y el motivo indicados.
              </p>
              <p v-else class="form-hint-inline">Los importes calculados se conservan como referencia. Indique los valores corregidos y el motivo del ajuste.</p>
              <div class="form-grid">
                <div class="form-group">
                  <label class="mcas-label" for="mcas-edit-importe">Importe definitivo (€) <span class="required-asterisk">*</span></label>
                  <input
                    id="mcas-edit-importe"
                    ref="importeEdicion"
                    v-model="editForm.importeDefinitivo"
                    type="text"
                    inputmode="decimal"
                    class="mcas-input"
                    :class="{ 'input-error': erroresEdicion.importeDefinitivo }"
                    placeholder="0,00"
                  >
                  <small v-if="erroresEdicion.importeDefinitivo" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresEdicion.importeDefinitivo }}</small>
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-edit-pagos">Número de pagos <span class="required-asterisk">*</span></label>
                  <input
                    id="mcas-edit-pagos"
                    v-model.number="editForm.numeroPagos"
                    type="number"
                    min="1"
                    max="12"
                    class="mcas-input"
                    :class="{ 'input-error': erroresEdicion.numeroPagos }"
                  >
                  <small v-if="erroresEdicion.numeroPagos" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresEdicion.numeroPagos }}</small>
                </div>
                <div class="form-group form-group--completo">
                  <label class="mcas-label" for="mcas-edit-motivo">Motivo de la edición <span class="required-asterisk">*</span></label>
                  <textarea
                    id="mcas-edit-motivo"
                    v-model="editForm.motivo"
                    class="mcas-input"
                    :class="{ 'input-error': erroresEdicion.motivo }"
                    rows="3"
                    placeholder="Razón del ajuste manual..."
                  ></textarea>
                  <small v-if="erroresEdicion.motivo" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresEdicion.motivo }}</small>
                </div>
              </div>
            </section>

            <!-- Historial -->
            <section class="form-section">
              <div class="section-header">
                <i class="fas fa-history"></i>
                <h3>Historial</h3>
              </div>
              <div v-if="auditoriaDetalle.length" class="tabla-detalle">
                <table class="data-table data-table--compacta">
                  <thead>
                    <tr><th>Fecha</th><th>Evento</th><th>Estado</th><th>Usuario</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="a in auditoriaDetalle" :key="a.id">
                      <td>{{ formatFechaHora(a.fechaEvento) }}</td>
                      <td>{{ etiquetaEvento(a.tipoEvento) }}</td>
                      <td>
                        <span v-if="a.estadoNuevo" class="badge" :class="'badge--' + tonoEstado(a.estadoNuevo)">{{ etiquetaEstado(a.estadoNuevo) }}</span>
                        <span v-else class="celda-vacia">—</span>
                      </td>
                      <td>{{ a.usuario || '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else class="form-hint-inline">Sin registros de auditoría.</p>
            </section>

            <!-- Traza del motor: plegada, solo para quien da soporte -->
            <details class="detalle-traza">
              <summary><i class="fas fa-code"></i> Detalles técnicos (para soporte)</summary>
              <pre>{{ formatJson(propuestaDetalle.trazaCalculoJson) }}</pre>
            </details>
          </div>
        </div>

        <div class="mcas-modal-footer">
          <span v-if="propuestaDetalle.idServicioCreado" class="footer-note footer-note--success">
            <i class="fas fa-check-circle"></i> Servicio creado #{{ propuestaDetalle.idServicioCreado }}
          </span>
          <div class="footer-actions">
            <button
              v-if="propuestaDetalle.estado === 'PENDIENTE_VALIDACION'"
              class="btn btn-danger-soft"
              :disabled="accionando || cargandoDetalle"
              @click="rechazar(propuestaDetalle)"
            >
              <i class="fas fa-times-circle"></i>
              <span>Rechazar</span>
            </button>
            <button
              v-if="admiteNoProcede(propuestaDetalle)"
              class="btn btn-secondary btn-no-procede"
              :disabled="accionando || cargandoDetalle"
              title="Cerrar la comisión sin crear ningún servicio"
              @click="descartar(propuestaDetalle)"
            >
              <i class="fas fa-ban"></i>
              <span>No procede</span>
            </button>
            <button class="btn btn-cancel" @click="cerrarDetalle">
              <i class="fas fa-times"></i>
              <span>Cerrar</span>
            </button>
            <button
              v-if="esRecalculable(propuestaDetalle.estado)"
              class="btn"
              :class="recalcularSecundario(propuestaDetalle) ? 'btn-info' : 'btn-save'"
              :disabled="accionando || cargandoDetalle"
              @click="recalcular(propuestaDetalle)"
            >
              <i class="fas fa-redo"></i>
              <span>Recalcular</span>
            </button>
            <button
              v-if="admiteCompletar(propuestaDetalle)"
              class="btn btn-save"
              :disabled="accionando || cargandoDetalle"
              @click="abrirEdicion(propuestaDetalle)"
            >
              <i class="fas fa-keyboard"></i>
              <span>Completar manualmente</span>
            </button>
            <button
              v-if="propuestaDetalle.estado === 'PENDIENTE_VALIDACION'"
              class="btn btn-save"
              :disabled="accionando || cargandoDetalle"
              @click="aprobar(propuestaDetalle)"
            >
              <i class="fas fa-check"></i>
              <span>Aprobar y crear servicio</span>
            </button>
            <button
              v-if="propuestaDetalle.estado === 'RECHAZADO'"
              class="btn btn-save"
              :disabled="accionando || cargandoDetalle"
              @click="abrirEdicion(propuestaDetalle)"
            >
              <i class="fas fa-pen"></i>
              <span>Editar propuesta</span>
            </button>
            <button
              v-if="propuestaDetalle.estado === 'EN_EDICION'"
              class="btn btn-save"
              :disabled="accionando || cargandoDetalle"
              @click="finalizarEdicion"
            >
              <i class="fas fa-save"></i>
              <span>Guardar y crear servicio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ordenTabla } from '@/mixins/ordenTabla';
import { compararValores } from '@/utils/orden'
import axios from 'axios'
import { COLORES_DIALOGO, confirmar, mostrarError, mostrarExito, textoError } from './mcasDialogs'
import { NOMBRES_METODO } from './mcasReglas'
import { ESTADOS_PROPUESTA, GRUPOS_ESTADO, grupoEstadoMcas } from './mcasEstados'
import { avisarPropuestasCambiadas } from '@/services/mcasPendientes'
import { fechaES, fechaHoraES } from '@/utils/fechas'
import { leerDecimal } from '@/utils/numeros'
import { escaparHtml } from '@/utils/html'

// Catálogo de estados de propuesta (compartido con el formulario de contrato).
const ESTADOS = ESTADOS_PROPUESTA

const PENDIENTE = 'PENDIENTE_VALIDACION'
const SUPERADO = 'SUPERADO'
const CERRADA_SIN_COMISION = 'FINALIZADO_NO_COMISIONABLE'

// Aspecto de cada grupo de estado (GRUPOS_ESTADO, compartido): tono del badge,
// icono y ayuda de su tarjeta de resumen.
const ASPECTO_GRUPO = {
  aprobar: { tono: 'primary', icono: 'fas fa-hourglass-half', ayuda: 'Calculadas y pendientes de su aprobación' },
  atencion: { tono: 'warning', icono: 'fas fa-exclamation-triangle', ayuda: 'Faltan datos, revisión manual, error de cálculo o el contrato ha cambiado' },
  correccion: { tono: 'info', icono: 'fas fa-pen', ayuda: 'Rechazadas o en edición: pendientes de corregir y crear el servicio' },
  aprobada: { tono: 'success', icono: 'fas fa-check-circle', ayuda: 'Aprobadas, con o sin edición: servicio creado' },
  cerrada: { tono: 'neutral', icono: 'fas fa-ban', ayuda: 'No procede, no comisionables o canceladas: sin servicio' },
}

// «No procede» se ofrece mientras la comisión sigue abierta, salvo en DESACTUALIZADO:
// el servidor no la descarta (el contrato cambió) y lo útil es «Recalcular».
const GRUPOS_NO_PROCEDE = ['aprobar', 'atencion', 'correccion']
const DESACTUALIZADO = 'DESACTUALIZADO'

// El servidor aprueba como mucho 200 propuestas por petición.
const MAX_LOTE = 200

const OPCIONES_EVENTO = [
  { value: '',               label: 'Todas',            icono: 'fas fa-list' },
  { value: 'NUEVO_CONTRATO', label: 'Nuevos contratos', icono: 'fas fa-star' },
  { value: 'RENOVACION',     label: 'Renovaciones',     icono: 'fas fa-sync-alt' },
]

// EN_EDICION también: si no se puede guardar (p. ej. el contrato ya tiene una comisión
// aprobada), recalcular la deja SUPERADO y calcula otra con los datos actuales.
// FINALIZADO_NO_COMISIONABLE: «Recalcular» reabre la que se cerró con «No procede».
const ESTADOS_RECALCULABLES = ['DESACTUALIZADO', 'ERROR_CALCULO', 'REQUIERE_DATOS', 'REQUIERE_REVISION_MANUAL', 'EN_EDICION', CERRADA_SIN_COMISION]

// Propuestas que ya no crearán servicio: el bloque «Servicio a crear» lo dice en vez de dar cifras.
const ESTADOS_SIN_SERVICIO = [CERRADA_SIN_COMISION, 'CANCELADO', SUPERADO]

// Estados en los que motivoRechazo explica la situación (rechazo o «No procede»).
const ESTADOS_CON_MOTIVO = ['RECHAZADO', 'EN_EDICION', CERRADA_SIN_COMISION]

// De dónde sale la potencia con la que se calculó (traza del motor).
const ORIGEN_POTENCIA = { CONTRATO: 'del contrato', MAYOR_CONTRATADA: 'mayor potencia contratada' }

// Conceptos del desglose y eventos del historial tal como los escribe el servidor.
const ETIQUETAS_LINEA = {
  COMISION_BASE: 'Comisión base', ENERGIA: 'Energía', POTENCIA: 'Potencia', COMPONENTE: 'Componente',
  SERVICIO_ADICIONAL: 'Servicio adicional', CIERRE: 'Cierre', AJUSTE: 'Ajuste manual',
}
const ETIQUETAS_EVENTO = {
  PROPUESTA_CREADA: 'Propuesta creada', PROPUESTA_CALCULADA: 'Propuesta calculada',
  PROPUESTA_DESACTUALIZADA: 'El contrato cambió: propuesta desactualizada', PROPUESTA_RECHAZADA: 'Propuesta rechazada',
  EDICION_ABIERTA: 'Edición abierta', PROPUESTA_APROBADA: 'Aprobada y servicio creado',
  PROPUESTA_FINALIZADA_EDITADA: 'Servicio creado con edición',
  PROPUESTA_DESCARTADA: 'No procede: cerrada sin comisión',
  PROPUESTA_REABIERTA: 'Reabierta con Recalcular', PROPUESTA_SUPERADA: 'Sustituida por un cálculo nuevo',
  COMISION_SIN_SERVICIO: 'Su servicio ya no existe: el contrato se puede volver a comisionar',
}

const AVISO_RECHAZO = 'Propuesta rechazada: corrija los valores y guarde para crear el servicio'
const AVISO_NO_PROCEDE = 'La comisión se cerrará sin crear ningún servicio. Podrá reabrirla con Recalcular.'

// Formateador creado una vez: toLocaleString con opciones crea uno nuevo en cada llamada
// y el filtro de importe de la tabla lo pedía por cada propuesta (las fechas: utils/fechas).
const IMPORTE_ES = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Texto comparable en los filtros: sin tildes, sin mayúsculas y sin espacios a los lados. */
const normalizar = (valor) => String(valor ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()


export default {
  name: 'McasComponent',
  mixins: [ordenTabla],
  data() {
    return {
      propuestas: [],
      cargando: false,
      errorCarga: false,
      opcionesEvento: OPCIONES_EVENTO,
      grupoActivo: '',
      filtroEvento: '',
      filtroComercializadora: '',
      verHistorico: false,
      columnFilters: { cliente: '', contrato: '', estado: '', importe: '', fecha: '' },
      sortKey: 'creadoEn',
      sortOrder: 'desc',
      currentPage: 1,
      recordsPerPage: 10,
      // Aprobación en lote: ids marcados (solo propuestas por aprobar)
      seleccionadas: [],
      // Detalle
      propuestaDetalle: null,
      cargandoDetalle: false,
      detalleRequestId: 0,
      lineasDetalle: [],
      calendarioDetalle: [],
      auditoriaDetalle: [],
      // Edición
      editForm: { importeDefinitivo: null, numeroPagos: 1, motivo: '' },
      erroresEdicion: {},
      avisoEdicion: '',
      accionando: false,
    }
  },
  computed: {
    /** Tarjetas de resumen: una por grupo de estado. */
    tarjetas() {
      return GRUPOS_ESTADO.map(g => ({ ...g, ...ASPECTO_GRUPO[g.id] }))
    },
    /** Estados del filtro de la columna: «Superada» solo con el histórico a la vista. */
    estadosDisponibles() {
      return ESTADOS.filter(e => this.verHistorico || e.value !== SUPERADO)
    },
    /** Propuestas que cuentan en tarjetas, recuentos y lista: el histórico solo con «Ver histórico». */
    propuestasVigentes() {
      return this.verHistorico ? this.propuestas : this.propuestas.filter(p => !this.esHistorico(p))
    },
    propuestasFiltradas() {
      const grupo = this.grupoActivo ? GRUPOS_ESTADO.find(g => g.id === this.grupoActivo) : null
      const f = this.columnFilters
      const cliente = normalizar(f.cliente)
      const contrato = normalizar(f.contrato).replace('#', '')
      const fecha = f.fecha.trim()
      const importe = f.importe.trim()
      return this.propuestasVigentes.filter(p => {
        if (this.filtroEvento && p.tipoEvento !== this.filtroEvento) return false
        if (grupo && !grupo.estados.includes(p.estado)) return false
        if (f.estado && p.estado !== f.estado) return false
        if (this.filtroComercializadora && p.nombreComercializadora !== this.filtroComercializadora) return false
        if (cliente && !normalizar(p.nombreCliente).includes(cliente) && !normalizar(p.cups).includes(cliente)) return false
        if (contrato && ![p.numeroContrato, p.idContrato, p.id, p.nombreComercializadora]
          .some(v => v != null && normalizar(v).includes(contrato))) return false
        if (fecha && !this.formatFecha(p.creadoEn).includes(fecha)) return false
        if (importe && !this.formatImporte(this.importeFila(p)).includes(importe)) return false
        return true
      })
    },
    /** Comercializadoras presentes en las propuestas, para el filtro de la barra superior. */
    comercializadorasDisponibles() {
      return [...new Set(this.propuestas.map(p => p.nombreComercializadora).filter(Boolean))].sort(compararValores)
    },
    propuestasOrdenadas() {
      if (!this.sortKey || !this.sortOrder) return this.propuestasFiltradas
      const dir = this.sortOrder === 'asc' ? 1 : -1
      return [...this.propuestasFiltradas].sort((a, b) => compararValores(this.valorOrden(a), this.valorOrden(b)) * dir)
    },
    propuestasPaginadas() {
      const start = (this.currentPage - 1) * this.recordsPerPage
      return this.propuestasOrdenadas.slice(start, start + this.recordsPerPage)
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.propuestasFiltradas.length / this.recordsPerPage))
    },
    paginationStart() {
      return this.propuestasFiltradas.length ? (this.currentPage - 1) * this.recordsPerPage + 1 : 0
    },
    paginationEnd() {
      return Math.min(this.currentPage * this.recordsPerPage, this.propuestasFiltradas.length)
    },
    hayFiltros() {
      return !!(this.grupoActivo || this.filtroEvento || this.filtroComercializadora
        || Object.values(this.columnFilters).some(v => String(v).trim()))
    },

    // ---- aprobación en lote ----
    hayPorAprobar() {
      return this.propuestas.some(p => p.estado === PENDIENTE)
    },
    /** Filas de la página a la vista que se pueden marcar. */
    seleccionablesVisibles() {
      return this.propuestasPaginadas.filter(p => p.estado === PENDIENTE)
    },
    todasVisiblesSeleccionadas() {
      const visibles = this.seleccionablesVisibles
      return visibles.length > 0 && visibles.every(p => this.seleccionadas.includes(p.id))
    },
    algunaVisibleSeleccionada() {
      return this.seleccionablesVisibles.some(p => this.seleccionadas.includes(p.id))
    },
    /** Lo que se aprobaría: marcadas, aún por aprobar y visibles con los filtros actuales. */
    propuestasSeleccionadas() {
      return this.propuestasFiltradas.filter(p => p.estado === PENDIENTE && this.seleccionadas.includes(p.id))
    },
    totalSeleccionado() {
      return this.propuestasSeleccionadas.reduce((total, p) => total + (Number(this.importeFila(p)) || 0), 0)
    },
    textoAprobarSeleccionadas() {
      const n = this.propuestasSeleccionadas.length
      return n ? `Aprobar seleccionadas (${n} · ${this.formatImporte(this.totalSeleccionado)})` : 'Aprobar seleccionadas'
    },

    // ---- detalle ----
    /** Advertencias ya redactadas para el usuario por el servidor (nunca el JSON técnico). */
    advertenciasDetalle() {
      const lista = this.propuestaDetalle?.advertencias
      return Array.isArray(lista) ? lista.map(String).filter(Boolean) : []
    },
    /** Revisión manual, datos que faltan o error: no hay importe automático de referencia. */
    sinImporteCalculado() {
      return this.propuestaDetalle?.importeAutomatico == null
    },
    sinServicio() {
      return ESTADOS_SIN_SERVICIO.includes(this.propuestaDetalle?.estado)
    },
    /** Finalizada con edición o con un ajuste manual: el desglose enseña «Calculado» y «Definitivo». */
    desgloseEditado() {
      return this.propuestaDetalle?.estado === 'FINALIZADO_EDITADO' || this.lineasDetalle.some(l => l.tipoLinea === 'AJUSTE')
    },
    /** Importe del servicio a crear: en edición, el que se está escribiendo (si es válido). */
    importeServicio() {
      const p = this.propuestaDetalle
      if (!p) return null
      if (p.estado === 'EN_EDICION') {
        const editado = this.normalizarDecimal(this.editForm.importeDefinitivo)
        if (editado !== null && editado >= 0) return editado
      }
      return this.importeFila(p)
    },
    pagosServicio() {
      const p = this.propuestaDetalle
      if (!p) return null
      if (p.estado === 'EN_EDICION') {
        const pagos = Number(this.editForm.numeroPagos)
        if (Number.isInteger(pagos) && pagos >= 1) return pagos
      }
      return p.numeroPagos || null
    },
  },
  watch: {
    columnFilters: { handler() { this.currentPage = 1 }, deep: true },
    grupoActivo() { this.currentPage = 1 },
    filtroEvento() { this.currentPage = 1 },
    filtroComercializadora() { this.currentPage = 1 },
    verHistorico() { this.currentPage = 1 },
    recordsPerPage() { this.currentPage = 1 },
    totalPages(val) {
      if (this.currentPage > val) this.currentPage = val
    },
  },
  mounted() {
    this.cargar()
    document.addEventListener('keydown', this.onKeydown)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onKeydown)
  },
  methods: {
    async cargar() {
      this.cargando = true
      try {
        const { data } = await axios.get('/mcas/propuestas')
        this.propuestas = Array.isArray(data) ? data : []
        this.errorCarga = false
        // Las marcadas que ya no están por aprobar (aprobadas por otro, recalculadas...) se olvidan
        const porAprobar = new Set(this.propuestas.filter(p => p.estado === PENDIENTE).map(p => p.id))
        this.seleccionadas = this.seleccionadas.filter(id => porAprobar.has(id))
      } catch (e) {
        console.error('Error al cargar propuestas MCAS:', e)
        this.errorCarga = true
        mostrarError(this.$swal, 'Error', textoError(e, 'No se pudieron cargar las propuestas de comisión.'))
      } finally {
        this.cargando = false
      }
    },

    /** El contador del menú lateral se actualiza al momento (evento mcas:propuestas-cambiadas). */
    notificarCambio() {
      avisarPropuestasCambiadas()
    },

    /**
     * Abre el detalle. La propuesta ya trae los datos del contrato (cliente, CUPS,
     * comercializadora, FEE...), así que solo se piden el detalle y su historial.
     * Con `editar` el foco va al importe; `aviso` se muestra sobre el formulario.
     */
    async abrirDetalle(p, { editar = false, aviso = '' } = {}) {
      const requestId = ++this.detalleRequestId
      this.propuestaDetalle = { ...p }
      this.cargandoDetalle = true
      this.lineasDetalle = []
      this.calendarioDetalle = []
      this.auditoriaDetalle = []
      this.erroresEdicion = {}
      this.avisoEdicion = ''
      try {
        const [det, audit] = await Promise.all([
          axios.get(`/mcas/propuestas/${p.id}`),
          axios.get(`/mcas/propuestas/${p.id}/auditoria`).catch(() => ({ data: [] })),
        ])
        if (requestId !== this.detalleRequestId) return
        const detalle = det.data
        this.propuestaDetalle = detalle
        this.lineasDetalle = detalle.lineas || []
        this.calendarioDetalle = detalle.calendario || []
        this.auditoriaDetalle = Array.isArray(audit.data) ? audit.data : []
        // Sin importe calculado (revisión manual) el importe empieza vacío: lo escribe el usuario.
        const importe = detalle.importeDefinitivo ?? detalle.importeAutomatico
        this.editForm = {
          importeDefinitivo: importe != null ? String(importe).replace('.', ',') : '',
          numeroPagos: detalle.numeroPagos || 1,
          motivo: '',
        }
        this.avisoEdicion = aviso
      } catch (e) {
        if (requestId !== this.detalleRequestId) return
        this.propuestaDetalle = null
        mostrarError(this.$swal, 'Error', textoError(e, `No se pudo cargar el detalle de la propuesta #${p.id}.`))
      } finally {
        if (requestId === this.detalleRequestId) this.cargandoDetalle = false
      }
      if (editar && requestId === this.detalleRequestId && this.propuestaDetalle?.estado === 'EN_EDICION') {
        this.$nextTick(() => this.$refs.importeEdicion?.focus())
      }
    },

    cerrarDetalle() {
      this.detalleRequestId++
      this.propuestaDetalle = null
      this.cargandoDetalle = false
    },

    async aprobar(p) {
      if (this.accionando) return
      const confirmado = await confirmar(this.$swal, {
        titulo: `¿Aprobar la propuesta #${p.id}?`,
        texto: 'Se creará el servicio definitivo de comisión con el importe calculado.',
        textoConfirmar: 'Sí, aprobar',
      })
      if (!confirmado) return
      this.accionando = true
      try {
        const { data } = await axios.post(`/mcas/propuestas/${p.id}/aprobar`)
        this.cerrarDetalle()
        this.notificarCambio()
        await this.cargar()
        mostrarExito(this.$swal, 'Propuesta aprobada',
          data?.idServicioCreado ? `Se ha creado el servicio #${data.idServicioCreado}.` : `La propuesta #${p.id} se ha aprobado correctamente.`)
      } catch (e) {
        mostrarError(this.$swal, 'Error al aprobar', textoError(e, 'No se pudo aprobar la propuesta.'))
      } finally {
        this.accionando = false
      }
    },

    // ---- aprobación en lote ----
    estaSeleccionada(p) {
      return this.seleccionadas.includes(p.id)
    },
    /** «Seleccionar todas las visibles»: marca o desmarca las por aprobar de la página a la vista. */
    alternarSeleccionVisibles(marcar) {
      const visibles = this.seleccionablesVisibles.map(p => p.id)
      this.seleccionadas = marcar
        ? [...new Set([...this.seleccionadas, ...visibles])]
        : this.seleccionadas.filter(id => !visibles.includes(id))
    },

    /**
     * Aprueba las marcadas (en peticiones de hasta 200). Cada una se aprueba o falla por
     * separado: al terminar se dice cuáles se aprobaron y por qué no el resto.
     */
    async aprobarSeleccionadas() {
      if (this.accionando) return
      const lote = [...this.propuestasSeleccionadas]
      if (!lote.length) return
      const confirmado = await confirmar(this.$swal, {
        titulo: lote.length === 1 ? '¿Aprobar la propuesta seleccionada?' : `¿Aprobar las ${lote.length} propuestas seleccionadas?`,
        texto: `Se creará un servicio de comisión por cada una, por un total de ${this.formatImporte(this.totalSeleccionado)}. Al terminar verá cuáles se han aprobado y cuáles no.`,
        textoConfirmar: 'Sí, aprobar',
      })
      if (!confirmado) return
      this.accionando = true
      const resultados = []
      let fallo = null
      try {
        for (let i = 0; i < lote.length; i += MAX_LOTE) {
          const ids = lote.slice(i, i + MAX_LOTE).map(p => p.id)
          const { data } = await axios.post('/mcas/propuestas/aprobar-lote', { ids })
          if (Array.isArray(data)) resultados.push(...data)
        }
      } catch (e) {
        fallo = e
      }
      try {
        if (resultados.length) {
          this.seleccionadas = []
          this.notificarCambio()
        }
        await this.cargar()
        if (fallo && !resultados.length) {
          mostrarError(this.$swal, 'Error al aprobar', textoError(fallo, 'No se pudieron aprobar las propuestas seleccionadas.'))
        } else {
          this.mostrarResultadoLote(lote, resultados, fallo)
        }
      } finally {
        this.accionando = false
      }
    },

    /** Diálogo final del lote: aprobadas y no aprobadas, cada una con su motivo. */
    mostrarResultadoLote(lote, resultados, fallo) {
      const porId = new Map(lote.map(p => [p.id, p]))
      const aprobadas = resultados.filter(r => r.ok)
      const fallidas = resultados.filter(r => !r.ok)
      const linea = (r) => {
        const p = porId.get(r.id)
        const quien = [p?.numeroContrato || (p?.idContrato ? `Contrato #${p.idContrato}` : null), p?.nombreCliente].filter(Boolean).join(' · ')
        const mensaje = r.mensaje || (r.ok ? 'Aprobada' : 'No se pudo aprobar')
        return `<li><strong>Propuesta #${escaparHtml(r.id)}</strong>${quien ? ` · ${escaparHtml(quien)}` : ''}: ${escaparHtml(mensaje)}</li>`
      }
      const bloque = (lista, titulo, modificador, icono) => (lista.length
        ? `<p class="swal-mcas-lote__titulo swal-mcas-lote__titulo--${modificador}"><i class="${icono}"></i> ${titulo} (${lista.length})</p>`
          + `<ul class="swal-mcas-lote__lista">${lista.map(linea).join('')}</ul>`
        : '')
      const sinRespuesta = lote.length - resultados.length
      const nota = fallo && sinRespuesta > 0
        ? `<p class="swal-mcas-lote__nota">${sinRespuesta} ${sinRespuesta === 1 ? 'propuesta no se ha podido enviar y sigue' : 'propuestas no se han podido enviar y siguen'} por aprobar: ${escaparHtml(textoError(fallo, 'error de conexión'))}</p>`
        : ''
      const todoBien = !fallidas.length && !nota
      const icon = todoBien ? 'success' : (aprobadas.length ? 'warning' : 'error')
      const title = todoBien
        ? (aprobadas.length === 1 ? 'Propuesta aprobada' : 'Propuestas aprobadas')
        : (aprobadas.length ? 'Aprobación con incidencias' : 'No se ha aprobado ninguna propuesta')
      return this.$swal.fire({
        icon,
        title,
        html: `<div class="swal-mcas-lote">${bloque(aprobadas, 'Aprobadas', 'ok', 'fas fa-check-circle')}${bloque(fallidas, 'No aprobadas', 'error', 'fas fa-times-circle')}${nota}</div>`,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: COLORES_DIALOGO.COLOR_CONFIRMAR,
      })
    },

    /**
     * Rechazar no deja la comisión sin salida: el servidor la devuelve en edición y
     * se abre el detalle para corregir importe y pagos y crear el servicio.
     */
    async rechazar(p) {
      if (this.accionando) return
      const { isConfirmed, value: motivo } = await this.$swal.fire({
        title: `¿Rechazar la propuesta #${p.id}?`,
        html: `
          <div class="swal-accion-contenedor">
            <div class="swal-accion-caja swal-accion-caja--danger">
              <div class="swal-accion-caja-header swal-accion-caja-header--danger">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Rechazo de propuesta</span>
              </div>
              <p class="swal-accion-caja-texto swal-accion-caja-texto--danger">La propuesta pasará a edición para que corrija el importe y los pagos y cree el servicio.</p>
            </div>
          </div>
        `,
        icon: 'warning',
        input: 'textarea',
        inputLabel: 'Motivo del rechazo *',
        inputPlaceholder: 'Quedará registrado en el historial de la propuesta...',
        inputValidator: valor => (!valor || !valor.trim() ? 'El motivo del rechazo es obligatorio' : undefined),
        customClass: { input: 'swal-accion-textarea' },
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-times-circle"></i> Rechazar y editar',
        cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
        confirmButtonColor: COLORES_DIALOGO.COLOR_PELIGRO,
      })
      if (!isConfirmed) return
      this.accionando = true
      try {
        const { data } = await axios.post(`/mcas/propuestas/${p.id}/rechazar`, { motivo: motivo.trim() })
        this.notificarCambio()
        await Promise.all([
          this.abrirDetalle({ ...p, ...(data || {}) }, { editar: true, aviso: AVISO_RECHAZO }),
          this.cargar(),
        ])
      } catch (e) {
        mostrarError(this.$swal, 'Error al rechazar', textoError(e, 'No se pudo rechazar la propuesta.'))
      } finally {
        this.accionando = false
      }
    },

    /**
     * «No procede»: cierra la comisión sin crear ningún servicio (p. ej. el cliente no
     * cumple una condición que el motor no comprueba). Se puede reabrir con «Recalcular».
     */
    async descartar(p) {
      if (this.accionando) return
      const { isConfirmed, value: motivo } = await this.$swal.fire({
        title: `¿Cerrar la propuesta #${p.id} sin comisión?`,
        html: `
          <div class="swal-accion-contenedor">
            <div class="swal-accion-caja swal-accion-caja--danger">
              <div class="swal-accion-caja-header swal-accion-caja-header--danger">
                <i class="fas fa-ban"></i>
                <span>No procede</span>
              </div>
              <p class="swal-accion-caja-texto swal-accion-caja-texto--danger">${AVISO_NO_PROCEDE}</p>
            </div>
          </div>
        `,
        icon: 'warning',
        input: 'textarea',
        inputLabel: 'Motivo *',
        inputPlaceholder: 'Por ejemplo: el cliente estuvo menos de un año con la comercializadora...',
        inputValidator: valor => (!valor || !valor.trim() ? 'Indique el motivo por el que no procede' : undefined),
        customClass: { input: 'swal-accion-textarea' },
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-ban"></i> Cerrar sin comisión',
        cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
        confirmButtonColor: COLORES_DIALOGO.COLOR_PELIGRO,
      })
      if (!isConfirmed) return
      this.accionando = true
      try {
        await axios.post(`/mcas/propuestas/${p.id}/descartar`, { motivo: motivo.trim() })
        this.cerrarDetalle()
        this.notificarCambio()
        await this.cargar()
        mostrarExito(this.$swal, 'Comisión cerrada',
          `La propuesta #${p.id} queda en «Cerrada sin comisión». Podrá reabrirla con Recalcular.`)
      } catch (e) {
        mostrarError(this.$swal, 'Error', textoError(e, 'No se pudo cerrar la propuesta.'))
      } finally {
        this.accionando = false
      }
    },

    /** Abre para edición una rechazada o una que requiere revisión manual («Completar manualmente»). */
    async abrirEdicion(p) {
      if (this.accionando) return
      this.accionando = true
      try {
        const { data } = await axios.post(`/mcas/propuestas/${p.id}/editar`)
        this.notificarCambio()
        await Promise.all([
          this.abrirDetalle({ ...p, ...(data || {}), estado: 'EN_EDICION' }, { editar: true }),
          this.cargar(),
        ])
      } catch (e) {
        mostrarError(this.$swal, 'Error', textoError(e, 'No se pudo abrir la propuesta para edición.'))
      } finally {
        this.accionando = false
      }
    },

    /** «Editar» de la tabla: la ya abierta para edición solo se muestra; la rechazada se abre primero. */
    editar(p) {
      return p.estado === 'RECHAZADO' ? this.abrirEdicion(p) : this.abrirDetalle(p, { editar: true })
    },

    async finalizarEdicion() {
      if (this.accionando || !this.propuestaDetalle) return
      const errores = {}
      const importe = this.normalizarDecimal(this.editForm.importeDefinitivo)
      const pagos = Number(this.editForm.numeroPagos)
      if (!String(this.editForm.importeDefinitivo ?? '').trim()) errores.importeDefinitivo = 'Indique el importe definitivo de la comisión'
      else if (importe === null || importe < 0) errores.importeDefinitivo = 'Introduzca un importe válido (0 o superior)'
      if (!Number.isInteger(pagos) || pagos < 1 || pagos > 12) errores.numeroPagos = 'Debe estar entre 1 y 12'
      if (!this.editForm.motivo?.trim()) errores.motivo = 'El motivo de la edición es obligatorio'
      this.erroresEdicion = errores
      if (Object.keys(errores).length) return

      const id = this.propuestaDetalle.id
      const confirmado = await confirmar(this.$swal, {
        titulo: '¿Guardar y crear el servicio?',
        texto: `Se creará el servicio de comisión con ${this.formatImporte(importe)} en ${pagos} ${pagos === 1 ? 'pago' : 'pagos'}.`,
        textoConfirmar: 'Sí, guardar',
      })
      if (!confirmado) return
      this.accionando = true
      try {
        await axios.post(`/mcas/propuestas/${id}/finalizar-editado`, {
          importeDefinitivo: importe,
          numeroPagos: pagos,
          motivo: this.editForm.motivo.trim(),
        })
        this.cerrarDetalle()
        this.notificarCambio()
        await this.cargar()
        mostrarExito(this.$swal, 'Servicio creado', `La propuesta #${id} se ha finalizado con los valores editados.`)
      } catch (e) {
        mostrarError(this.$swal, 'Error al guardar', textoError(e, 'No se pudo finalizar la edición.'))
      } finally {
        this.accionando = false
      }
    },

    async recalcular(p) {
      if (this.accionando) return
      if (p.estado === CERRADA_SIN_COMISION) {
        // Reabre una cerrada con «No procede»
        const confirmado = await confirmar(this.$swal, {
          titulo: `¿Reabrir la propuesta #${p.id}?`,
          texto: 'Se volverá a calcular con los datos actuales del contrato y dejará de estar cerrada sin comisión.',
          textoConfirmar: 'Sí, reabrir',
        })
        if (!confirmado) return
      } else if (p.estado === 'EN_EDICION') {
        // En edición se descarta lo escrito y la propuesta queda superada por la nueva
        const confirmado = await confirmar(this.$swal, {
          titulo: `¿Recalcular la propuesta #${p.id}?`,
          texto: 'Se descartará la edición: la propuesta quedará superada y se calculará otra con los datos actuales del contrato.',
          textoConfirmar: 'Sí, recalcular',
        })
        if (!confirmado) return
      }
      this.accionando = true
      try {
        const { data } = await axios.post(`/mcas/propuestas/${p.id}/recalcular`)
        this.cerrarDetalle()
        this.notificarCambio()
        await this.cargar()
        mostrarExito(this.$swal, 'Propuesta recalculada',
          data?.estado ? `Nuevo estado: ${this.etiquetaEstado(data.estado)}.` : `La propuesta #${p.id} se ha recalculado.`)
      } catch (e) {
        mostrarError(this.$swal, 'Error al recalcular', textoError(e, 'No se pudo recalcular la propuesta.'))
      } finally {
        this.accionando = false
      }
    },

    // ---- calcular propuesta por número de contrato ----

    /**
     * Pide el número de contrato (o su principio), lo busca y calcula la propuesta:
     * con un único contrato se confirma; con varios se elige de una lista.
     */
    async calcularManual() {
      if (this.accionando) return
      const { isConfirmed, value: contratos } = await this.$swal.fire({
        title: 'Calcular propuesta',
        text: 'Escriba el número del contrato. Si no lo recuerda entero, basta con el principio (por ejemplo, CT-2026).',
        icon: 'question',
        input: 'text',
        inputLabel: 'Número de contrato',
        inputPlaceholder: 'CT-2026-0412',
        inputValidator: valor => (!valor || !valor.trim() ? 'Escriba el número de contrato' : undefined),
        showCancelButton: true,
        confirmButtonText: 'Buscar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: COLORES_DIALOGO.COLOR_CONFIRMAR,
        showLoaderOnConfirm: true,
        allowOutsideClick: () => !this.$swal.isLoading(),
        preConfirm: async valor => {
          try {
            const lista = await this.buscarContratos(valor)
            if (!lista.length) {
              this.$swal.showValidationMessage('No hay ningún contrato con ese número. Revíselo o escriba solo el principio.')
              return false
            }
            return lista
          } catch (e) {
            this.$swal.showValidationMessage(escaparHtml(textoError(e, 'No se pudo buscar el contrato.')))
            return false
          }
        },
      })
      if (!isConfirmed || !Array.isArray(contratos) || !contratos.length) return
      const contrato = contratos.length === 1
        ? await this.confirmarContrato(contratos[0])
        : await this.elegirContrato(contratos)
      if (contrato) await this.calcularContrato(contrato)
    },

    async buscarContratos(referencia) {
      const { data } = await axios.get('/mcas/propuestas/buscar-contrato', { params: { ref: String(referencia ?? '').trim() } })
      return Array.isArray(data) ? data : []
    },

    /** «CT-2026-0412 · Talleres Ejemplo, S.L. · CUPS ES00… · ENDESA ENERGIA S.A.U. · desde el 01/09/2026» */
    descripcionContrato(c) {
      return [
        c.numero || `Contrato #${c.id}`,
        c.cliente,
        c.cups ? `CUPS ${c.cups}` : null,
        c.comercializadora,
        c.fechaInicio ? `desde el ${this.formatFecha(c.fechaInicio)}` : null,
      ].filter(Boolean).join(' · ')
    },

    async confirmarContrato(contrato) {
      const confirmado = await confirmar(this.$swal, {
        titulo: '¿Calcular la propuesta de este contrato?',
        texto: this.descripcionContrato(contrato),
        textoConfirmar: 'Sí, calcular',
      })
      return confirmado ? contrato : null
    },

    async elegirContrato(lista) {
      const opciones = lista.map((c, i) => `
        <label class="swal-mcas-contrato">
          <input type="radio" name="mcas-contrato" value="${i}">
          <span class="swal-mcas-contrato__datos">
            <strong>${escaparHtml(c.numero || `Contrato #${c.id}`)}</strong>${c.fechaInicio ? ` <small>desde el ${escaparHtml(this.formatFecha(c.fechaInicio))}</small>` : ''}
            <span class="swal-mcas-contrato__detalle">${escaparHtml([c.cliente, c.cups, c.comercializadora].filter(Boolean).join(' · '))}</span>
          </span>
        </label>`).join('')
      const { isConfirmed, value } = await this.$swal.fire({
        title: 'Elija el contrato',
        html: `
          <div class="swal-mcas-contratos">
            <p class="swal-mcas-contratos__texto">Hay ${lista.length} contratos con ese número. Elija el que quiere calcular.</p>
            <div class="swal-mcas-contratos__lista">${opciones}</div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Calcular',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: COLORES_DIALOGO.COLOR_CONFIRMAR,
        focusConfirm: false,
        preConfirm: () => {
          const marcado = this.$swal.getPopup()?.querySelector('input[name="mcas-contrato"]:checked')
          if (!marcado) {
            this.$swal.showValidationMessage('Elija un contrato de la lista')
            return false
          }
          return Number(marcado.value)
        },
      })
      if (!isConfirmed || value == null) return null
      return lista[value] || null
    },

    async calcularContrato(contrato) {
      if (this.accionando) return
      this.accionando = true
      try {
        const { data } = await axios.post(`/mcas/propuestas/calcular-forzado/${contrato.id}`)
        this.notificarCambio()
        await this.cargar()
        mostrarExito(this.$swal, 'Propuesta generada',
          `Contrato ${contrato.numero || '#' + contrato.id}: ${data?.estado ? this.etiquetaEstado(data.estado) : 'propuesta calculada'}.`)
      } catch (e) {
        mostrarError(this.$swal, 'Error al calcular', textoError(e, 'No se pudo calcular la propuesta.'))
      } finally {
        this.accionando = false
      }
    },

    // ---- filtros y orden ----
    seleccionarGrupo(id) {
      this.grupoActivo = this.grupoActivo === id ? '' : id
      this.columnFilters.estado = ''
    },
    contarEstados(estados) {
      if (!estados) return this.propuestasVigentes.length
      return this.propuestasVigentes.filter(p => estados.includes(p.estado)).length
    },
    contarEvento(tipo) {
      return tipo ? this.propuestasVigentes.filter(p => p.tipoEvento === tipo).length : this.propuestasVigentes.length
    },
    valorOrden(p) {
      switch (this.sortKey) {
        case 'importe': return this.importeFila(p) != null ? Number(this.importeFila(p)) : null
        case 'estado': return this.ordenEstado(p.estado)
        case 'creadoEn': return p.creadoEn ? new Date(p.creadoEn).getTime() : null
        default: return p[this.sortKey]
      }
    },
    /** Orden de los grupos (Por aprobar, Necesita atención...) y, dentro, el del catálogo. */
    ordenEstado(estado) {
      const grupo = GRUPOS_ESTADO.findIndex(g => g.estados.includes(estado))
      const detalle = ESTADOS.findIndex(e => e.value === estado)
      return (grupo < 0 ? GRUPOS_ESTADO.length : grupo) * 100 + Math.max(detalle, 0)
    },
    onKeydown(e) {
      if (e.key === 'Escape' && this.propuestaDetalle && !this.$swal.isVisible()) {
        // Atendido aquí: el Esc general de los modales (services/capasModales.js) no actúa
        e.preventDefault()
        this.cerrarDetalle()
      }
    },

    // ---- estados ----
    etiquetaGrupo(estado) {
      return grupoEstadoMcas(estado)?.label || this.etiquetaEstado(estado)
    },
    tonoGrupo(estado) {
      const grupo = grupoEstadoMcas(estado)
      return grupo ? ASPECTO_GRUPO[grupo.id].tono : this.tonoEstado(estado)
    },
    /** Estado detallado bajo el grupo («Faltan datos»), si dice algo más que el grupo. */
    detalleEstado(p) {
      const grupo = grupoEstadoMcas(p?.estado)
      if (!grupo || grupo.estados.length < 2) return ''
      const detalle = this.etiquetaEstado(p.estado)
      return detalle === grupo.label ? '' : detalle
    },
    tonoEstado(estado) { return ESTADOS.find(e => e.value === estado)?.tono || 'neutral' },
    etiquetaEstado(estado) { return ESTADOS.find(e => e.value === estado)?.label || this.humanizar(estado) },

    // ---- helpers ----
    esRenovacion(p) { return p?.tipoEvento === 'RENOVACION' },
    esRecalculable(estado) { return ESTADOS_RECALCULABLES.includes(estado) },
    /** Revisión manual, datos que faltan o error de cálculo: se completa a mano y crea el servicio. */
    admiteCompletar(p) { return !!p?.admiteEdicionManual && p.estado !== 'RECHAZADO' },
    /** «No procede» mientras la comisión está abierta (por aprobar, necesita atención o en corrección), salvo desactualizada. */
    admiteNoProcede(p) {
      return !!p && p.estado !== DESACTUALIZADO && GRUPOS_NO_PROCEDE.includes(grupoEstadoMcas(p.estado)?.id)
    },
    /**
     * Histórico: superadas y desactualizadas que ya no son la última de su contrato
     * (ultimaDelContrato === false; si el campo no viene, se ven).
     */
    esHistorico(p) {
      return p.estado === SUPERADO || (p.estado === DESACTUALIZADO && p.ultimaDelContrato === false)
    },
    /** En el pie, «Recalcular» cede el color principal a «Completar manualmente» o a «Guardar y crear servicio». */
    recalcularSecundario(p) { return p?.estado === 'EN_EDICION' || this.admiteCompletar(p) },
    /** El motor no calcula el ajuste manual (se guarda a 0): no se enseña como «Calculado». */
    importeCalculadoLinea(l) { return l.tipoLinea === 'AJUSTE' ? null : l.importeAutomatico },
    importeDefinitivoLinea(l) { return l.importeDefinitivo ?? this.importeCalculadoLinea(l) },
    nombreMetodo(metodo) { return NOMBRES_METODO[metodo] || metodo || '—' },
    nombreCliente(p) { return p?.nombreCliente || (p?.idCliente ? `Cliente #${p.idCliente}` : '—') },
    /** Nombre legible de la regla; sin nombre, su código. */
    nombreRegla(p) { return p?.nombreRegla || p?.codigoRegla || '—' },
    /** Tabla de comisiones con su versión: nombre legible o, si no tiene, el código. */
    conjuntoVersion(p) {
      const nombre = p?.nombreConjunto || p?.codigoConjunto
      if (!nombre) return '—'
      return p.versionConjunto != null && p.versionConjunto !== '' ? `${nombre} · versión ${p.versionConjunto}` : nombre
    },
    /** Título de la celda de contrato: comercializadora, gestora, tipo y número de propuesta. */
    tituloContrato(p) {
      return [
        p.nombreComercializadora,
        p.nombreGestora ? `Gestora: ${p.nombreGestora}` : null,
        this.esRenovacion(p) ? 'Renovación' : 'Nuevo contrato',
        `Propuesta #${p.id}`,
      ].filter(Boolean).join(' · ')
    },
    esRechazo(p) { return !!p.motivoRechazo && ['RECHAZADO', 'EN_EDICION'].includes(p.estado) },
    etiquetaMotivo(p) { return p?.estado === CERRADA_SIN_COMISION ? 'Motivo por el que no procede' : 'Motivo de rechazo' },
    importeFila(p) { return p.importeDefinitivo ?? p.importeAutomatico ?? null },
    /** Debajo del estado: el motivo del rechazo o de «No procede», o la primera advertencia (ya en texto humano). */
    observacion(p) {
      if (p.motivoRechazo && ESTADOS_CON_MOTIVO.includes(p.estado)) return p.motivoRechazo
      if (p.estado !== PENDIENTE && Array.isArray(p.advertencias) && p.advertencias.length) return String(p.advertencias[0] ?? '')
      return ''
    },
    iconoObservacion(p) {
      if (this.esRechazo(p)) return 'fas fa-times-circle'
      return p.estado === CERRADA_SIN_COMISION ? 'fas fa-ban' : 'fas fa-exclamation-triangle'
    },
    formatJson(json) {
      if (!json) return '—'
      try { return JSON.stringify(JSON.parse(json), null, 2) } catch { return json }
    },
    etiquetaLinea(tipo) { return ETIQUETAS_LINEA[tipo] || this.humanizar(tipo) },
    etiquetaEvento(tipo) { return ETIQUETAS_EVENTO[tipo] || this.humanizar(tipo) },
    humanizar(valor) {
      if (!valor) return '—'
      const texto = String(valor).replace(/_/g, ' ').toLowerCase()
      return texto.charAt(0).toUpperCase() + texto.slice(1)
    },
    formatImporte(v) {
      return v != null && v !== ''
        ? IMPORTE_ES.format(Number(v)) + ' €'
        : '—'
    },
    formatFee(v) {
      return v != null && v !== '' ? `${Number(v).toLocaleString('es-ES', { maximumFractionDigits: 4 })} €/MWh` : '—'
    },
    /** El porcentaje llega como factor (0,44) y se muestra en % (44 %). */
    formatPorcentaje(factor) {
      return factor != null && factor !== ''
        ? `${(Number(factor) * 100).toLocaleString('es-ES', { maximumFractionDigits: 2 })} %`
        : '—'
    },
    formatConsumo(kwh) {
      if (kwh == null || kwh === '') return '—'
      const n = Number(kwh)
      return `${n.toLocaleString('es-ES')} kWh (${(n / 1000).toLocaleString('es-ES', { maximumFractionDigits: 3 })} MWh)`
    },
    formatPotencia(p) {
      if (p?.potenciaCalculoKw == null || p.potenciaCalculoKw === '') return '—'
      const kw = `${Number(p.potenciaCalculoKw).toLocaleString('es-ES', { maximumFractionDigits: 3 })} kW`
      const origen = ORIGEN_POTENCIA[p.potenciaOrigen]
      return origen ? `${kw} (${origen})` : kw
    },
    // Mismo criterio que el FEE del contrato (ModalContratos.normalizarDecimalMcas): con
    // coma y punto a la vez, el primero es el de miles («1.234,56» se rechazaba aquí)
    normalizarDecimal(v) {
      return leerDecimal(v)
    },
    formatFecha(v) {
      return fechaES(v, '—')
    },
    formatFechaHora(v) {
      return fechaHoraES(v, '—')
    },
  },
}
</script>

<style scoped src="./McasShared.css"></style>
<style scoped src="./McasComponent.css"></style>
