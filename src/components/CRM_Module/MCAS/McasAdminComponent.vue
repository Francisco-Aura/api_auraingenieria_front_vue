<template>
  <div ref="raiz" class="mcas-container fade-in">
    <!-- Configuración MCAS: mismo esquema que Cartera de Clientes (resumen + panel de tabla).
         Resumen + interruptores del módulo -->
    <div class="stats-panel">
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-layer-group"></i></div>
          <div class="stat-content">
            <div class="stat-value">{{ conjuntosReglas.length }}</div>
            <div class="stat-label">Tablas de comisiones</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-rocket"></i></div>
          <div class="stat-content">
            <div class="stat-value">{{ conjuntosPublicados }}</div>
            <div class="stat-label">Tablas publicadas</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-tags"></i></div>
          <div class="stat-content">
            <div class="stat-value">{{ productosActivos }}</div>
            <div class="stat-label">Productos activos</div>
          </div>
        </div>
        <div class="stat-card stat-card--flags">
          <div class="stat-icon"><i class="fas fa-sliders-h"></i></div>
          <div class="flags-bloque">
            <span class="flags-titulo">Interruptores del módulo</span>
            <div class="flags-grid" role="group" aria-label="Interruptores del módulo MCAS">
              <label
                v-for="f in flagsVista"
                :key="f.codigo"
                class="toggle-switch toggle-switch--compacto"
                :class="{ 'toggle-switch--no-disponible': !f.disponible }"
                :title="f.disponible ? f.ayuda : 'No se pudo cargar el estado de este interruptor'"
              >
                <input
                  type="checkbox"
                  :checked="f.activo"
                  :disabled="!f.disponible || flagEnCurso === f.codigo"
                  @change="toggleFeatureFlag(f, $event)"
                >
                <span class="toggle-slider"></span>
                <span class="toggle-label">{{ f.label }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado del módulo: qué falta para que MCAS calcule y cree servicios -->
    <div class="estado-modulo" :class="moduloListo ? 'estado-modulo--listo' : 'estado-modulo--pendiente'" role="status">
      <div class="estado-modulo-cabecera">
        <i :class="moduloListo ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'" aria-hidden="true"></i>
        <strong>{{ moduloListo
          ? 'MCAS está listo: al guardar un contrato se calcula su propuesta de comisión'
          : 'MCAS todavía no puede calcular todas las comisiones: revise lo marcado en naranja' }}</strong>
      </div>
      <div class="estado-modulo-lista">
        <div v-for="c in estadoModulo" :key="c.id" class="estado-modulo-item" :class="c.ok ? 'is-ok' : 'is-pendiente'">
          <i :class="c.ok ? 'fas fa-check' : 'fas fa-exclamation'" aria-hidden="true"></i>
          <div class="estado-modulo-texto">
            <span class="estado-modulo-titulo">{{ c.titulo }}</span>
            <span class="estado-modulo-detalle">{{ c.detalle }}</span>
            <router-link v-if="c.id === 'switching' || c.id === 'plazos'" to="/dashboard/administracion" class="estado-modulo-enlace">
              <i class="fas fa-external-link-alt"></i> Ir a Administración
            </router-link>
          </div>
        </div>
        <!-- Informativa: no cuenta para «listo» (la retrocesión nunca se descuenta en el alta) -->
        <div class="estado-modulo-item is-info">
          <i class="fas fa-info" aria-hidden="true"></i>
          <div class="estado-modulo-texto">
            <span class="estado-modulo-titulo">Políticas de retrocesión publicadas: {{ errorRetrocesiones ? 'sin datos' : retrocesionesPublicadas }}</span>
            <span class="estado-modulo-detalle">{{ errorRetrocesiones
              ? 'No se pudieron cargar: revíselas en la pestaña Retrocesiones.'
              : 'Informativo: cada propuesta muestra su retrocesión potencial; nunca se descuenta en el alta.' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado por comercializadora y datos pendientes de confirmar (bloque E) -->
    <div class="estado-comercializadoras" role="region" aria-labelledby="mcas-estado-com-titulo">
      <div class="estado-comercializadoras-cabecera">
        <h3 id="mcas-estado-com-titulo"><i class="fas fa-building"></i> Estado por comercializadora</h3>
        <span class="estado-comercializadoras-resumen">{{ resumenComercializadoras }}</span>
        <button type="button" class="btn btn-outline" :aria-expanded="panelComercializadoras ? 'true' : 'false'" @click="panelComercializadoras = !panelComercializadoras">
          <i :class="panelComercializadoras ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          <span>{{ panelComercializadoras ? 'Ocultar detalle' : 'Ver detalle' }}</span>
        </button>
      </div>
      <div v-if="panelComercializadoras" class="estado-com-lista">
        <div v-for="f in comercializadorasConTabla" :key="f.idComercializadora" class="estado-com-fila">
          <div class="estado-com-cabecera">
            <strong class="estado-com-nombre">{{ f.nombre }}</strong>
            <span class="badge" :class="'badge--' + f.tono">{{ f.etiqueta }}</span>
            <span class="estado-com-texto">{{ f.texto }}</span>
          </div>
          <ul v-if="f.pendientes.length" class="estado-com-pendientes">
            <li v-for="(p, k) in f.pendientes" :key="k">
              <span class="badge badge--warning">Pendiente de confirmar</span>
              <span class="estado-com-pendiente-texto">{{ p.texto }}</span>
              <button type="button" class="enlace-pendiente" @click="abrirPendiente(p)">{{ p.etiquetaEnlace }}</button>
            </li>
          </ul>
        </div>
        <div v-if="comercializadorasSinTabla.length" class="estado-com-fila">
          <div class="estado-com-cabecera">
            <span class="badge badge--warning">Pendiente de confirmar</span>
            <span class="estado-com-texto">Sin tabla de comisiones: sus contratos se completan a mano. Pulse una para crear su tabla.</span>
          </div>
          <div class="estado-com-sin-tabla">
            <button
              v-for="f in comercializadorasSinTabla"
              :key="f.idComercializadora"
              type="button"
              class="enlace-pendiente"
              :title="'Crear la tabla de comisiones de ' + f.nombre"
              @click="abrirPendiente(f.pendientes[0])"
            >{{ f.nombre }}</button>
          </div>
        </div>
        <p v-if="!estadoComercializadoras.length" class="estado-com-vacio">Todavía no hay comercializadoras ni tablas de comisiones.</p>
      </div>
    </div>

    <!-- Panel de tabla con pestañas -->
    <div class="card table-panel">
      <div class="table-header">
        <div class="vista-toggle" role="tablist" aria-label="Secciones de la configuración MCAS">
          <button
            v-for="t in tabs"
            :key="t.id"
            type="button"
            role="tab"
            class="btn-view-toggle"
            :class="{ active: tabActivo === t.id }"
            :aria-selected="tabActivo === t.id ? 'true' : 'false'"
            :title="t.ayuda"
            @click="tabActivo = t.id"
          >
            <i :class="t.icono"></i>
            <span>{{ t.label }}</span>
            <span v-if="contadorTab(t.id) !== null" class="toggle-count">{{ contadorTab(t.id) }}</span>
          </button>
        </div>
        <div class="table-actions-horizontal">
          <button class="btn btn-refresh" :disabled="cargandoTab" title="Actualizar datos" @click="actualizarTab">
            <i :class="cargandoTab ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
            <span>Actualizar</span>
          </button>
          <button
            v-if="tabActivo === 'conjuntos'"
            class="btn btn-success"
            :disabled="!idsSeleccionados.length || mutacionEnCurso"
            title="Comprueba y activa de una vez las tablas marcadas en la lista"
            @click="activarSeleccionadas"
          >
            <i class="fas fa-power-off"></i>
            <span>Activar seleccionadas</span>
            <span v-if="idsSeleccionados.length" class="toggle-count">{{ idsSeleccionados.length }}</span>
          </button>
          <button v-if="tabActivo === 'conjuntos'" class="btn btn-primary" @click="abrirModalConjunto()">
            <i class="fas fa-plus"></i>
            <span>Nueva tabla</span>
          </button>
          <button
            v-if="tabActivo === 'reglas'"
            class="btn btn-toggle-baja"
            :disabled="!conjuntoParaReglas || !reglasConjunto.length"
            :title="conjuntoParaReglas ? 'Calcula con un contrato real qué regla aplicaría y cuánto saldría, sin guardar nada' : 'Seleccione antes una tabla de comisiones'"
            @click="abrirSimulacion"
          >
            <i class="fas fa-flask"></i>
            <span>Probar con un contrato</span>
          </button>
          <button
            v-if="tabActivo === 'reglas' && conjuntoParaReglas && conjuntoParaReglas.estado !== 'BORRADOR'"
            class="btn btn-outline"
            title="Copia esta tabla en un borrador nuevo para cambiar importes o reglas"
            @click="abrirNuevaVersion(conjuntoParaReglas)"
          >
            <i class="fas fa-code-branch"></i>
            <span>Nueva versión</span>
          </button>
          <button
            v-if="tabActivo === 'reglas'"
            class="btn btn-primary"
            :disabled="!conjuntoParaReglas || conjuntoParaReglas.estado !== 'BORRADOR'"
            :title="conjuntoEditable ? 'Añadir una regla a la tabla' : 'Solo se pueden añadir reglas a una tabla en borrador'"
            @click="abrirModalRegla()"
          >
            <i class="fas fa-plus"></i>
            <span>Nueva regla</span>
          </button>
          <button
            v-if="tabActivo === 'reglas' && conjuntoActivable"
            class="btn btn-success"
            title="Comprueba la tabla y la pone en uso en el cálculo automático"
            @click="abrirActivacion(conjuntoParaReglas)"
          >
            <i class="fas fa-power-off"></i>
            <span>Activar</span>
          </button>
          <button
            v-if="tabActivo === 'rangos'"
            class="btn btn-outline"
            :disabled="!reglaParaRangos"
            title="Ver y editar los importes de la regla en una rejilla"
            @click="abrirMatriz(reglaParaRangos)"
          >
            <i class="fas fa-table"></i>
            <span>Ver tabla</span>
          </button>
          <button
            v-if="tabActivo === 'rangos'"
            class="btn btn-primary"
            :disabled="!reglaParaRangos || !conjuntoEditable"
            :title="reglaParaRangos && conjuntoEditable ? 'Añadir una fila a la tabla de la regla' : 'Seleccione una regla de una tabla en borrador'"
            @click="abrirModalRango()"
          >
            <i class="fas fa-plus"></i>
            <span>Nueva fila</span>
          </button>
          <button v-if="tabActivo === 'productos'" class="btn btn-primary" @click="abrirModalProducto()">
            <i class="fas fa-plus"></i>
            <span>Nuevo producto</span>
          </button>
          <button v-if="tabActivo === 'retrocesiones'" class="btn btn-primary" @click="abrirModalRetrocesion()">
            <i class="fas fa-plus"></i>
            <span>Nueva política</span>
          </button>
        </div>
      </div>

      <!-- Retrocesiones: recordatorio de que son informativas -->
      <div v-if="tabActivo === 'retrocesiones'" class="context-bar">
        <span class="context-meta">
          <i class="fas fa-info-circle"></i>
          Cada propuesta muestra la retrocesión potencial de la política publicada que le corresponde. Es informativa:
          nunca se descuenta en el alta y solo se aplicaría si el contrato causa baja anticipada.
        </span>
      </div>

      <!-- Vista avanzada: la tabla de la regla fila a fila, tal como la guarda el motor -->
      <div v-if="tabActivo === 'rangos'" class="context-bar">
        <span class="context-meta">
          <i class="fas fa-info-circle"></i>
          Vista avanzada: cada celda de la tabla aparece como una fila por dato (mismo «orden» = misma celda).
          Para cambiar importes es más cómodo «Ver tabla».
        </span>
      </div>

      <!-- Contexto: tabla de comisiones / regla sobre las que se trabaja -->
      <div v-if="tabActivo === 'reglas' || tabActivo === 'rangos'" class="context-bar">
        <div class="context-field">
          <label class="context-label" for="mcas-ctx-conjunto">Tabla de comisiones</label>
          <select id="mcas-ctx-conjunto" v-model="conjuntoParaReglasId" class="toolbar-select" @change="onCambioConjunto">
            <option :value="null">Seleccione una tabla...</option>
            <option v-for="c in conjuntosReglas" :key="c.id" :value="c.id">
              {{ nombreConjunto(c) }} · {{ nombreComercializadora(c.idComercializadora) }} ({{ etiquetaEstadoConjunto(c.estado) }})
            </option>
          </select>
        </div>
        <div v-if="tabActivo === 'rangos'" class="context-field">
          <label class="context-label" for="mcas-ctx-regla">Regla</label>
          <select
            id="mcas-ctx-regla"
            v-model="reglaParaRangosId"
            class="toolbar-select"
            :disabled="!conjuntoParaReglas"
            @change="cargarRangos()"
          >
            <option :value="null">{{ placeholderRegla }}</option>
            <option v-for="r in reglasLookup" :key="r.id" :value="r.id">{{ nombreRegla(r) }} ({{ etiquetaMetodo(r.metodoCalculo) }})</option>
          </select>
        </div>
        <div v-if="conjuntoParaReglas" class="context-info">
          <span class="badge" :class="'badge--' + tonoEstadoConjunto(conjuntoParaReglas.estado)">{{ etiquetaEstadoConjunto(conjuntoParaReglas.estado) }}</span>
          <span class="context-meta"><i class="fas fa-calendar-alt"></i>{{ formatVigencia(conjuntoParaReglas.vigenciaDesde, conjuntoParaReglas.vigenciaHasta) }}</span>
          <span v-if="!conjuntoEditable" class="context-meta"><i class="fas fa-lock"></i>Solo lectura: únicamente las tablas en borrador admiten cambios</span>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th v-if="tabActivo === 'conjuntos'" class="th-col-seleccion">
                <div class="column-header">
                  <div class="column-title column-title--sin-orden">
                    <input
                      type="checkbox"
                      class="casilla-seleccion"
                      :checked="todasSeleccionadas"
                      :disabled="!activablesPagina.length"
                      title="Marcar las tablas de esta página que se pueden activar"
                      aria-label="Marcar las tablas de esta página que se pueden activar"
                      @change="seleccionarPagina($event.target.checked)"
                    >
                  </div>
                </div>
              </th>
              <th
                v-for="col in columnasActivas"
                :key="col.key"
                :class="{ sortable: col.ordenable !== false }"
                :style="{ width: col.ancho }"
              >
                <div class="column-header">
                  <div
                    class="column-title"
                    :class="{ 'column-title--derecha': col.alinear === 'derecha' }"
                    @click="col.ordenable !== false && ordenarPor(col.key)"
                  >
                    <i :class="col.icono + ' mr-2'"></i>{{ col.label }}
                    <i v-if="col.ordenable !== false" :class="iconoOrden(col.key)"></i>
                  </div>
                  <div v-if="col.filtro" class="column-filter-container">
                    <select
                      v-if="col.filtro === 'select'"
                      v-model="filtrosActivos[col.key]"
                      class="column-filter"
                      :aria-label="'Filtrar por ' + col.label"
                      @click.stop
                    >
                      <option value="">TODOS</option>
                      <option v-for="op in opcionesColumna(col)" :key="op.value" :value="op.value">{{ op.label }}</option>
                    </select>
                    <input
                      v-else
                      v-model="filtrosActivos[col.key]"
                      type="text"
                      class="column-filter"
                      placeholder="Filtrar..."
                      :aria-label="'Filtrar por ' + col.label"
                      @click.stop
                    >
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
            <template v-if="cargandoTab">
              <tr v-for="n in 6" :key="'skeleton-' + n" class="skeleton-row">
                <td v-for="col in columnasTotales" :key="col"><div class="skeleton-line skeleton-line--md"></div></td>
              </tr>
            </template>

            <template v-else>
              <!-- Tablas de comisiones -->
              <template v-if="tabActivo === 'conjuntos'">
                <tr
                  v-for="c in filasPaginadas"
                  :key="c.id"
                  class="fila-clicable"
                  :class="{ 'fila-seleccionada': conjuntoParaReglasId === c.id }"
                  title="Seleccionar tabla"
                  @click="seleccionarConjunto(c)"
                >
                  <td class="celda-seleccion" @click.stop>
                    <input
                      v-if="esActivable(c)"
                      type="checkbox"
                      class="casilla-seleccion"
                      :checked="seleccionActivar.includes(c.id)"
                      :aria-label="'Marcar ' + nombreConjunto(c) + ' para activarla'"
                      @change="alternarSeleccion(c)"
                    >
                  </td>
                  <td class="text-truncate" :title="[nombreConjunto(c), c.codigo, c.descripcion].filter(Boolean).join(' · ')">
                    <span class="celda-nombre">{{ nombreConjunto(c) }}</span>
                    <span class="celda-secundaria">
                      <template v-if="c.nombre"><span class="celda-codigo celda-codigo--secundario">{{ c.codigo }}</span> · </template>Versión {{ c.version || '—' }}
                    </span>
                  </td>
                  <td class="text-truncate" :title="nombreComercializadora(c.idComercializadora)">
                    {{ nombreComercializadora(c.idComercializadora) }}
                    <span class="celda-secundaria">{{ nombreGestora(c.idGestora) ? 'Gestora: ' + nombreGestora(c.idGestora) : 'Sin gestora específica' }}</span>
                  </td>
                  <td>
                    <span class="badge" :class="'badge--' + tonoPrecio(c.fasePrecio)">{{ etiquetaOpcion(fases, c.fasePrecio) }}</span>
                    <span v-if="faseBloqueada(c)" class="celda-secundaria aviso-sin-confirmar" title="No se podrá activar mientras el interruptor Indexado esté apagado">
                      <i class="fas fa-lock"></i>Interruptor Indexado apagado
                    </span>
                  </td>
                  <td class="celda-nowrap">{{ formatVigencia(c.vigenciaDesde, c.vigenciaHasta) }}</td>
                  <td><span class="badge" :class="'badge--' + tonoEstadoConjunto(c.estado)">{{ etiquetaEstadoConjunto(c.estado) }}</span></td>
                  <td class="text-truncate" :title="[c.archivoOrigen, c.hojaOrigen].filter(Boolean).join(' · ')">
                    <template v-if="c.archivoOrigen || c.hojaOrigen">
                      {{ c.archivoOrigen || '—' }}
                      <span v-if="c.hojaOrigen" class="celda-secundaria">Hoja: {{ c.hojaOrigen }}</span>
                    </template>
                    <span v-else class="celda-vacia">—</span>
                  </td>
                  <td @click.stop>
                    <div class="action-buttons">
                      <button class="btn-icon btn-view" title="Ver reglas" aria-label="Ver reglas" @click="verReglas(c)">
                        <i class="fas fa-list-ul"></i>
                      </button>
                      <button class="btn-icon btn-edit" title="Editar tabla" aria-label="Editar la tabla de comisiones" :disabled="c.estado !== 'BORRADOR'" @click="abrirModalConjunto(c)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button v-if="c.estado === 'BORRADOR' || c.estado === 'VALIDADO'" class="btn-icon btn-approve" title="Activar tabla" aria-label="Activar la tabla de comisiones" :disabled="mutacionEnCurso" @click="abrirActivacion(c)">
                        <i class="fas fa-power-off"></i>
                      </button>
                      <button v-else class="btn-icon btn-add" title="Nueva versión" aria-label="Crear una nueva versión de la tabla" :disabled="mutacionEnCurso" @click="abrirNuevaVersion(c)">
                        <i class="fas fa-code-branch"></i>
                      </button>
                      <button
                        v-if="c.estado !== 'ARCHIVADO'"
                        class="btn-icon btn-archive"
                        title="Más acciones"
                        aria-label="Más acciones"
                        aria-haspopup="true"
                        :aria-expanded="menuConjunto === c.id ? 'true' : 'false'"
                        :disabled="mutacionEnCurso"
                        @click="alternarMenu(c, $event)"
                      >
                        <i class="fas fa-ellipsis-v"></i>
                      </button>
                      <span v-else class="btn-icon-hueco" aria-hidden="true"></span>
                    </div>
                    <Teleport to="body">
                      <div v-if="menuConjunto === c.id" class="menu-acciones" role="menu" :aria-label="'Más acciones de ' + nombreConjunto(c)" :style="estiloMenu" @click.stop>
                        <button v-if="c.estado === 'BORRADOR'" type="button" role="menuitem" class="menu-acciones-item" title="Marca la tabla como revisada, sin usarla todavía en el cálculo" @click="cambiarEstadoConjunto(c, 'validar')">
                          <i class="fas fa-check-circle"></i><span>Validar</span>
                        </button>
                        <button v-if="c.estado === 'VALIDADO'" type="button" role="menuitem" class="menu-acciones-item" title="Publicar tabla" @click="cambiarEstadoConjunto(c, 'publicar')">
                          <i class="fas fa-rocket"></i><span>Publicar</span>
                        </button>
                        <button v-if="c.estado === 'VALIDADO'" type="button" role="menuitem" class="menu-acciones-item" title="La tabla se podrá editar de nuevo" @click="cambiarEstadoConjunto(c, 'volver-borrador')">
                          <i class="fas fa-undo-alt"></i><span>Volver a borrador</span>
                        </button>
                        <button v-if="c.estado === 'VALIDADO' || c.estado === 'PUBLICADO'" type="button" role="menuitem" class="menu-acciones-item" title="Cerrar vigencia (fijar el último día en que se aplica)" @click="cerrarVigenciaConjunto(c)">
                          <i class="fas fa-calendar-times"></i><span>Cerrar vigencia</span>
                        </button>
                        <button v-if="c.estado === 'PUBLICADO'" type="button" role="menuitem" class="menu-acciones-item" title="Deja de usarse en el cálculo automático" @click="cambiarEstadoConjunto(c, 'archivar')">
                          <i class="fas fa-archive"></i><span>Archivar</span>
                        </button>
                        <button v-if="c.estado === 'BORRADOR'" type="button" role="menuitem" class="menu-acciones-item menu-acciones-item--peligro" title="Eliminar tabla" @click="eliminarConjunto(c)">
                          <i class="fas fa-trash"></i><span>Eliminar</span>
                        </button>
                      </div>
                    </Teleport>
                  </td>
                </tr>
              </template>

              <!-- Reglas de la tabla de comisiones -->
              <template v-if="tabActivo === 'reglas'">
                <tr v-for="r in filasPaginadas" :key="r.id" :class="{ 'fila-seleccionada': reglaParaRangosId === r.id, 'fila-inactiva': !r.activo }">
                  <td><span class="badge badge--neutral">{{ r.prioridad ?? '—' }}</span></td>
                  <td class="celda-regla" :title="[nombreRegla(r), resumenesReglas[r.id].aplica, resumenesReglas[r.id].calcula].join('\n')">
                    <span class="regla-nombre">
                      {{ nombreRegla(r) }}
                      <span v-if="r.nombre" class="celda-codigo celda-codigo--secundario">{{ r.codigo }}</span>
                    </span>
                    <span class="celda-secundaria regla-resumen"><strong>Se aplica a:</strong> {{ resumenesReglas[r.id].aplica }}</span>
                    <span class="celda-secundaria regla-resumen"><strong>Cálculo:</strong> {{ resumenesReglas[r.id].calcula }}</span>
                  </td>
                  <td>
                    <span class="badge" :class="'badge--' + tonoMetodo(r.metodoCalculo)" :title="ayudaMetodo(r.metodoCalculo)">{{ etiquetaMetodo(r.metodoCalculo) }}</span>
                    <span class="celda-secundaria">{{ r.activo ? 'Activa' : 'Inactiva' }}</span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button v-if="esLookup(r)" class="btn-icon btn-view" title="Ver tabla" aria-label="Ver la tabla de importes de la regla" @click="abrirMatriz(r)">
                        <i class="fas fa-table"></i>
                      </button>
                      <span v-else class="btn-icon-hueco" aria-hidden="true"></span>
                      <button v-if="conjuntoEditable" class="btn-icon btn-edit" title="Editar regla" aria-label="Editar regla" @click="abrirModalRegla(r)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button v-else class="btn-icon btn-view" title="Ver regla" aria-label="Ver la regla sin modificarla" @click="abrirModalRegla(r)">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button class="btn-icon btn-delete" title="Eliminar regla" aria-label="Eliminar regla" :disabled="conjuntoParaReglas?.estado !== 'BORRADOR' || mutacionEnCurso" @click="eliminarRegla(r)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </template>

              <!-- Vista avanzada: filas de la tabla de la regla -->
              <template v-if="tabActivo === 'rangos'">
                <tr v-for="v in filasPaginadas" :key="v.id">
                  <td>{{ v.orden ?? '—' }}</td>
                  <td><span class="celda-codigo">{{ v.dimension }}</span></td>
                  <td class="celda-nowrap">{{ formatRango(v) }}</td>
                  <td>{{ v.valorCategoria || '—' }}</td>
                  <td class="text-end celda-importe">{{ formatResultado(v) }}</td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn-icon btn-edit" title="Editar fila de la tabla" aria-label="Editar fila de la tabla" :disabled="!conjuntoEditable" @click="abrirModalRango(v)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn-icon btn-delete" title="Eliminar fila de la tabla" aria-label="Eliminar fila de la tabla" :disabled="!conjuntoEditable || mutacionEnCurso" @click="eliminarRango(v)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </template>

              <!-- Productos comerciales -->
              <template v-if="tabActivo === 'productos'">
                <tr v-for="p in filasPaginadas" :key="p.id" :class="{ 'fila-inactiva': !p.activo }">
                  <td class="text-truncate" :title="[p.nombre, p.codigo, p.codigoZona, p.codigoGo].filter(Boolean).join(' · ')">
                    {{ p.nombre }}
                    <span class="celda-secundaria">
                      <span class="celda-codigo">{{ p.codigo }}</span>
                      <template v-if="p.codigoZona || p.codigoGo"> · {{ [p.codigoZona, p.codigoGo].filter(Boolean).join(' / ') }}</template>
                    </span>
                  </td>
                  <td class="text-truncate" :title="nombreComercializadora(p.idComercializadora)">
                    {{ nombreComercializadora(p.idComercializadora) }}
                    <span class="celda-secundaria">{{ nombreGestora(p.idGestora) ? 'Gestora: ' + nombreGestora(p.idGestora) : 'Sin gestora' }}</span>
                  </td>
                  <td><span class="badge" :class="'badge--' + tonoPrecio(p.tipoPrecio)">{{ etiquetaOpcion(tiposPrecio, p.tipoPrecio) }}</span></td>
                  <td>
                    <span class="tipo-indicator" :class="p.tipoSuministro === 'GAS' ? 'is-gas' : 'is-luz'">
                      <i :class="p.tipoSuministro === 'GAS' ? 'fas fa-fire' : 'fas fa-bolt'"></i>
                      <span>{{ etiquetaOpcion(suministros, p.tipoSuministro) }}</span>
                    </span>
                  </td>
                  <td class="celda-nowrap">{{ formatVigencia(p.activoDesde, p.activoHasta) }}</td>
                  <td><span class="badge" :class="p.activo ? 'badge--success' : 'badge--neutral'">{{ p.activo ? 'Activo' : 'Inactivo' }}</span></td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn-icon btn-edit" :title="p.activo ? 'Editar producto' : 'Editar o reactivar producto'" :aria-label="p.activo ? 'Editar producto' : 'Editar o reactivar producto'" @click="abrirModalProducto(p)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button v-if="p.activo" class="btn-icon btn-delete" title="Dar de baja" aria-label="Dar de baja" :disabled="mutacionEnCurso" @click="darDeBajaProducto(p)">
                        <i class="fas fa-ban"></i>
                      </button>
                      <span v-else class="btn-icon-hueco" aria-hidden="true"></span>
                    </div>
                  </td>
                </tr>
              </template>

              <!-- Políticas de retrocesión -->
              <template v-if="tabActivo === 'retrocesiones'">
                <tr v-for="p in filasPaginadas" :key="p.id" :class="{ 'fila-inactiva': p.estado === 'ARCHIVADO' }">
                  <td class="text-truncate" :title="[nombreComercializadoraPolitica(p), p.nombreGestora, p.codigo].filter(Boolean).join(' · ')">
                    {{ nombreComercializadoraPolitica(p) }}
                    <span class="celda-secundaria">
                      <span class="celda-codigo">{{ p.codigo || 'Sin código' }}</span>
                      <template v-if="p.version"> · v{{ p.version }}</template>
                      <template v-if="p.nombreGestora || p.idGestora"> · {{ p.nombreGestora || nombreGestora(p.idGestora) }}</template>
                    </span>
                  </td>
                  <td>
                    <template v-if="p.segmento">{{ etiquetaOpcion(segmentos, p.segmento) }}</template>
                    <span v-else class="celda-vacia">Todos</span>
                  </td>
                  <td>
                    <span v-if="p.tipoSuministro" class="tipo-indicator" :class="p.tipoSuministro === 'GAS' ? 'is-gas' : 'is-luz'">
                      <i :class="p.tipoSuministro === 'GAS' ? 'fas fa-fire' : 'fas fa-bolt'"></i>
                      <span>{{ etiquetaOpcion(suministros, p.tipoSuministro) }}</span>
                    </span>
                    <span v-else class="celda-vacia">Luz y gas</span>
                  </td>
                  <td class="text-truncate" :title="p.tarifaAcceso || 'Todas las tarifas'">
                    <template v-if="p.tarifaAcceso">{{ p.tarifaAcceso }}</template>
                    <span v-else class="celda-vacia">Todas</span>
                  </td>
                  <td><span class="badge" :class="'badge--' + tonoMetodoRetrocesion(p.metodo)">{{ etiquetaMetodoRetrocesion(p.metodo) }}</span></td>
                  <td class="celda-resumen" :title="[p.resumen, p.descripcion].filter(Boolean).join(' · ')">
                    <span class="resumen-politica">{{ p.resumen || '—' }}</span>
                    <span v-if="tieneTramosSinConfirmar(p)" class="celda-secundaria aviso-sin-confirmar">
                      <i class="fas fa-exclamation-triangle"></i>Unidad sin confirmar
                    </span>
                  </td>
                  <td>
                    <span class="badge" :class="'badge--' + tonoEstadoRetrocesion(p.estado)">{{ etiquetaEstadoRetrocesion(p.estado) }}</span>
                    <span class="celda-secundaria">{{ formatVigencia(p.vigenciaDesde, p.vigenciaHasta) }}</span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button v-if="p.estado === 'BORRADOR'" class="btn-icon btn-edit" title="Editar política" aria-label="Editar política de retrocesión" @click="abrirModalRetrocesion(p)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button v-else class="btn-icon btn-view" title="Ver política" aria-label="Ver política de retrocesión" @click="abrirModalRetrocesion(p)">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button v-if="p.estado === 'BORRADOR'" class="btn-icon btn-add" title="Publicar política" aria-label="Publicar política de retrocesión" :disabled="mutacionEnCurso" @click="cambiarEstadoRetrocesion(p, 'publicar')">
                        <i class="fas fa-rocket"></i>
                      </button>
                      <button v-if="p.estado === 'BORRADOR' || p.estado === 'PUBLICADO'" class="btn-icon btn-archive" title="Archivar política" aria-label="Archivar política de retrocesión" :disabled="mutacionEnCurso" @click="cambiarEstadoRetrocesion(p, 'archivar')">
                        <i class="fas fa-archive"></i>
                      </button>
                      <button v-if="p.estado === 'BORRADOR'" class="btn-icon btn-delete" title="Eliminar política" aria-label="Eliminar política de retrocesión" :disabled="mutacionEnCurso" @click="eliminarRetrocesion(p)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </template>

              <!-- Estado vacío / error -->
              <tr v-if="!filasPaginadas.length">
                <td :colspan="columnasTotales">
                  <div class="empty-state" :class="{ 'empty-state--error': estadoVacio.error }">
                    <i :class="estadoVacio.icono + ' fa-3x'"></i>
                    <p>{{ estadoVacio.texto }}</p>
                    <p v-if="estadoVacio.detalle" class="empty-state-detalle">{{ estadoVacio.detalle }}</p>
                    <button v-if="estadoVacio.error" class="btn btn-refresh" @click="actualizarTab">
                      <i class="fas fa-sync-alt"></i>
                      <span>Reintentar</span>
                    </button>
                    <button v-else-if="estadoVacio.crear" class="btn btn-primary" @click="crearEnTab">
                      <i class="fas fa-plus"></i>
                      <span>{{ estadoVacio.crear }}</span>
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div class="pagination-controls">
        <div class="records-per-page">
          <label for="mcasAdminRecordsPerPage">Registros por página:</label>
          <select id="mcasAdminRecordsPerPage" v-model.number="recordsPerPage" class="form-control">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
        <div class="pagination-info">
          Mostrando {{ paginationStart }} - {{ paginationEnd }} de {{ filasFiltradas.length }} registros
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

    <!-- ===================================================
         MODALES (patrón del modal de Administración)
    =================================================== -->

    <!-- Modal Producto Comercial -->
    <div v-if="modalProducto" class="mcas-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="mcas-modal-producto-titulo" @click.self="cerrarModales">
      <div class="mcas-modal">
        <div class="mcas-modal-header aura-modal-header">
          <div class="mcas-modal-title">
            <div class="mcas-modal-icon"><i :class="formProducto.id ? 'fas fa-edit' : 'fas fa-tags'"></i></div>
            <div class="title-text">
              <h2 id="mcas-modal-producto-titulo">{{ formProducto.id ? 'Editar' : 'Nuevo' }} producto comercial</h2>
              <p>El motor usa el código del producto para seleccionar la regla de comisión</p>
            </div>
          </div>
          <button type="button" class="close-button" title="Cerrar" aria-label="Cerrar" @click="cerrarModales">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form class="mcas-modal-form" novalidate @submit.prevent="guardarProducto">
          <div class="mcas-modal-body">
            <section class="form-section">
              <div class="section-header"><i class="fas fa-id-card"></i><h3>Identificación</h3></div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="mcas-label" for="mcas-prod-comercializadora">Comercializadora <span class="required-asterisk">*</span></label>
                  <select id="mcas-prod-comercializadora" v-model="formProducto.idComercializadora" class="mcas-input" :class="claseError('idComercializadora')" data-autofocus>
                    <option value="">Seleccionar...</option>
                    <option v-for="c in comercializadoras" :key="c.id" :value="c.id">{{ c.nombre }}</option>
                  </select>
                  <small v-if="erroresForm.idComercializadora" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.idComercializadora }}</small>
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-prod-gestora">Gestora</label>
                  <select id="mcas-prod-gestora" v-model="formProducto.idGestora" class="mcas-input">
                    <option :value="null">Sin gestora</option>
                    <option v-for="g in gestoras" :key="g.id" :value="g.id">{{ g.nombre }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-prod-codigo">
                    Código <span class="required-asterisk">*</span>
                    <i class="fas fa-info-circle help-icon" title="Código interno único. El motor lo usa para emparejar con las condiciones de la regla."></i>
                  </label>
                  <input id="mcas-prod-codigo" v-model="formProducto.codigo" class="mcas-input mcas-input--codigo" :class="claseError('codigo')" placeholder="PLAN_PERSONALIZADO">
                  <small v-if="erroresForm.codigo" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.codigo }}</small>
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-prod-nombre">Nombre <span class="required-asterisk">*</span></label>
                  <input id="mcas-prod-nombre" v-model="formProducto.nombre" class="mcas-input" :class="claseError('nombre')" placeholder="Plan Personalizado">
                  <small v-if="erroresForm.nombre" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.nombre }}</small>
                </div>
              </div>
            </section>

            <section class="form-section">
              <div class="section-header"><i class="fas fa-bolt"></i><h3>Características</h3></div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="mcas-label" for="mcas-prod-precio">Tipo de precio <span class="required-asterisk">*</span></label>
                  <select id="mcas-prod-precio" v-model="formProducto.tipoPrecio" class="mcas-input">
                    <option v-for="op in tiposPrecio" :key="op.value" :value="op.value">{{ op.label }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-prod-suministro">Tipo de suministro <span class="required-asterisk">*</span></label>
                  <select id="mcas-prod-suministro" v-model="formProducto.tipoSuministro" class="mcas-input">
                    <option v-for="op in suministros" :key="op.value" :value="op.value">{{ op.label }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-prod-zona">
                    Código de zona
                    <i class="fas fa-info-circle help-icon" title="Ej: ZBR, ZAR (Iberdrola)"></i>
                  </label>
                  <input id="mcas-prod-zona" v-model="formProducto.codigoZona" class="mcas-input" placeholder="ZBR, ZAR...">
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-prod-go">Código GO/OC</label>
                  <input id="mcas-prod-go" v-model="formProducto.codigoGo" class="mcas-input" placeholder="Código GO u OC">
                </div>
              </div>
            </section>

            <section class="form-section">
              <div class="section-header"><i class="fas fa-calendar-alt"></i><h3>Vigencia</h3></div>
              <div class="form-grid form-grid--3">
                <div class="form-group">
                  <label class="mcas-label" for="mcas-prod-desde">Activo desde</label>
                  <input id="mcas-prod-desde" v-model="formProducto.activoDesde" type="date" class="mcas-input">
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-prod-hasta">Activo hasta</label>
                  <input id="mcas-prod-hasta" v-model="formProducto.activoHasta" type="date" class="mcas-input" :class="claseError('activoHasta')">
                  <small v-if="erroresForm.activoHasta" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.activoHasta }}</small>
                </div>
                <div class="form-group">
                  <span class="mcas-label">Estado</span>
                  <label class="toggle-switch">
                    <input v-model="formProducto.activo" type="checkbox">
                    <span class="toggle-slider"></span>
                    <span class="toggle-label">{{ formProducto.activo ? 'Activo' : 'Inactivo' }}</span>
                  </label>
                </div>
              </div>
            </section>
          </div>
          <div class="mcas-modal-footer">
            <span class="footer-note"><span class="required-asterisk">*</span> Campos obligatorios</span>
            <div class="footer-actions">
              <button type="button" class="btn btn-cancel" @click="cerrarModales">
                <i class="fas fa-times"></i>
                <span>Cancelar</span>
              </button>
              <button type="submit" class="btn btn-save" :disabled="mutacionEnCurso">
                <i :class="mutacionEnCurso ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>
                <span>{{ formProducto.id ? 'Actualizar' : 'Guardar' }}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Tabla de comisiones -->
    <div v-if="modalConjunto" class="mcas-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="mcas-modal-conjunto-titulo" @click.self="cerrarModales">
      <div class="mcas-modal">
        <div class="mcas-modal-header aura-modal-header">
          <div class="mcas-modal-title">
            <div class="mcas-modal-icon"><i :class="formConjunto.id ? 'fas fa-edit' : 'fas fa-layer-group'"></i></div>
            <div class="title-text">
              <h2 id="mcas-modal-conjunto-titulo">{{ formConjunto.id ? 'Editar tabla de comisiones' : 'Nueva tabla de comisiones' }}</h2>
              <p>Reglas de comisión de una comercializadora para un periodo de vigencia</p>
            </div>
          </div>
          <button type="button" class="close-button" title="Cerrar" aria-label="Cerrar" @click="cerrarModales">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form class="mcas-modal-form" novalidate @submit.prevent="guardarConjunto">
          <div class="mcas-modal-body">
            <section class="form-section">
              <div class="section-header"><i class="fas fa-id-card"></i><h3>Identificación</h3></div>
              <div class="form-grid">
                <div class="form-group form-group--completo">
                  <label class="mcas-label" for="mcas-conj-nombre">
                    Nombre <span class="required-asterisk">*</span>
                    <i class="fas fa-info-circle help-icon" title="Nombre con el que verá la tabla en las listas. Ej: Endesa 2026-03"></i>
                  </label>
                  <input id="mcas-conj-nombre" v-model="formConjunto.nombre" class="mcas-input" :class="claseError('nombre')" placeholder="Ej: Endesa 2026-03" maxlength="150" data-autofocus>
                  <small v-if="erroresForm.nombre" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.nombre }}</small>
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-conj-codigo">
                    Código interno (opcional; se genera solo)
                    <i class="fas fa-info-circle help-icon" title="Identificador técnico de la tabla. Si lo deja vacío, se genera al guardar."></i>
                  </label>
                  <input id="mcas-conj-codigo" v-model="formConjunto.codigo" class="mcas-input mcas-input--codigo" :class="claseError('codigo')" placeholder="Se genera al guardar">
                  <small v-if="erroresForm.codigo" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.codigo }}</small>
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-conj-version">Versión</label>
                  <input id="mcas-conj-version" v-model="formConjunto.version" class="mcas-input" placeholder="1.0">
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-conj-comercializadora">Comercializadora <span class="required-asterisk">*</span></label>
                  <select id="mcas-conj-comercializadora" v-model="formConjunto.idComercializadora" class="mcas-input" :class="claseError('idComercializadora')">
                    <option value="">Seleccionar...</option>
                    <option v-for="c in comercializadoras" :key="c.id" :value="c.id">{{ c.nombre }}</option>
                  </select>
                  <small v-if="erroresForm.idComercializadora" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.idComercializadora }}</small>
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-conj-gestora">Gestora</label>
                  <select id="mcas-conj-gestora" v-model="formConjunto.idGestora" class="mcas-input">
                    <option :value="null">Sin gestora específica</option>
                    <option v-for="g in gestoras" :key="g.id" :value="g.id">{{ g.nombre }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-conj-fase">
                    Fase de precio <span class="required-asterisk">*</span>
                    <i class="fas fa-info-circle help-icon" title="Si la tabla se aplica a contratos a precio fijo, indexado o a los dos"></i>
                  </label>
                  <select id="mcas-conj-fase" v-model="formConjunto.fasePrecio" class="mcas-input">
                    <option v-for="op in fases" :key="op.value" :value="op.value">{{ op.label }}</option>
                  </select>
                </div>
                <div class="form-group form-group--completo">
                  <label class="mcas-label" for="mcas-conj-descripcion">Descripción</label>
                  <textarea id="mcas-conj-descripcion" v-model="formConjunto.descripcion" class="mcas-input" rows="2" maxlength="1000" placeholder="Opcional: de dónde salen los importes, qué falta por confirmar..."></textarea>
                </div>
              </div>
              <div v-if="avisoFaseIndexada" class="mcas-alert mcas-alert--warning aviso-fase">
                <i class="fas fa-lock"></i>
                <div><strong>No se podrá activar mientras el interruptor Indexado esté apagado.</strong> Puede prepararla en borrador; enciéndalo arriba, en «Interruptores del módulo», cuando la dirección apruebe la fase indexada.</div>
              </div>
            </section>

            <section class="form-section">
              <div class="section-header"><i class="fas fa-calendar-alt"></i><h3>Vigencia</h3></div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="mcas-label" for="mcas-conj-desde">Vigencia desde <span class="required-asterisk">*</span></label>
                  <input id="mcas-conj-desde" v-model="formConjunto.vigenciaDesde" type="date" class="mcas-input" :class="claseError('vigenciaDesde')">
                  <small v-if="erroresForm.vigenciaDesde" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.vigenciaDesde }}</small>
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-conj-hasta">
                    Vigencia hasta
                    <i class="fas fa-info-circle help-icon" title="Dejar vacío si no tiene fecha de caducidad"></i>
                  </label>
                  <input id="mcas-conj-hasta" v-model="formConjunto.vigenciaHasta" type="date" class="mcas-input" :class="claseError('vigenciaHasta')">
                  <small v-if="erroresForm.vigenciaHasta" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.vigenciaHasta }}</small>
                </div>
              </div>
            </section>

            <section class="form-section">
              <div class="section-header"><i class="fas fa-file-excel"></i><h3>Origen documental</h3></div>
              <div class="form-grid form-grid--3">
                <div class="form-group">
                  <label class="mcas-label" for="mcas-conj-archivo">
                    Archivo origen
                    <i class="fas fa-info-circle help-icon" title="Nombre del fichero Excel del que provienen las reglas (solo referencia documental)"></i>
                  </label>
                  <input id="mcas-conj-archivo" v-model="formConjunto.archivoOrigen" class="mcas-input" placeholder="COMISIONES NEXO A 16032026.xlsx">
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-conj-hoja">Hoja origen</label>
                  <input id="mcas-conj-hoja" v-model="formConjunto.hojaOrigen" class="mcas-input" placeholder="ENDESA">
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-conj-fecha-origen">
                    Fecha interna
                    <i class="fas fa-info-circle help-icon" title="Fecha interna del archivo fuente. Puede diferir de la fecha del fichero."></i>
                  </label>
                  <input id="mcas-conj-fecha-origen" v-model="formConjunto.fechaInternaOrigen" type="date" class="mcas-input">
                </div>
              </div>
            </section>

            <div v-if="!formConjunto.id" class="mcas-alert mcas-alert--info">
              <i class="fas fa-lock"></i>
              <div>La tabla se crea en <strong>borrador</strong>. Añada y revise sus reglas y pulse <strong>Activar</strong> cuando esté lista: solo las tablas activas se usan en el cálculo automático.</div>
            </div>
          </div>
          <div class="mcas-modal-footer">
            <span class="footer-note"><span class="required-asterisk">*</span> Campos obligatorios</span>
            <div class="footer-actions">
              <button type="button" class="btn btn-cancel" @click="cerrarModales">
                <i class="fas fa-times"></i>
                <span>Cancelar</span>
              </button>
              <button type="submit" class="btn btn-save" :disabled="mutacionEnCurso">
                <i :class="mutacionEnCurso ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>
                <span>{{ formConjunto.id ? 'Actualizar' : 'Guardar' }}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Regla de Comisión -->
    <div v-if="modalRegla" class="mcas-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="mcas-modal-regla-titulo" @click.self="cerrarModales">
      <div class="mcas-modal mcas-modal--ancho">
        <div class="mcas-modal-header aura-modal-header">
          <div class="mcas-modal-title">
            <div class="mcas-modal-icon"><i :class="soloLecturaRegla ? 'fas fa-eye' : (formRegla.id ? 'fas fa-edit' : 'fas fa-list-ul')"></i></div>
            <div class="title-text">
              <h2 id="mcas-modal-regla-titulo">{{ tituloModalRegla }}</h2>
              <p>Tabla {{ nombreConjunto(conjuntoParaReglas) }}</p>
            </div>
          </div>
          <button type="button" class="close-button" title="Cerrar" aria-label="Cerrar" @click="cerrarModales">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form class="mcas-modal-form" novalidate @submit.prevent="guardarRegla">
          <div class="mcas-modal-body">
            <div v-if="soloLecturaRegla" class="mcas-alert mcas-alert--info">
              <i class="fas fa-lock"></i>
              <div>Tabla {{ etiquetaEstadoConjunto(conjuntoParaReglas?.estado).toLowerCase() }}: solo se pueden modificar las reglas de una tabla en borrador. Para cambiarla, cree una «Nueva versión».</div>
            </div>
            <fieldset class="fieldset-limpio" :disabled="soloLecturaRegla">
            <section class="form-section">
              <div class="section-header"><i class="fas fa-id-card"></i><h3>Definición</h3></div>
              <div class="form-grid">
                <div class="form-group form-group--completo">
                  <label class="mcas-label" for="mcas-regla-nombre">
                    Nombre <span class="required-asterisk">*</span>
                    <i class="fas fa-info-circle help-icon" title="Nombre con el que verá la regla en la lista y en el desglose de cada propuesta. Ej: Endesa · residencial menos de 10 kW"></i>
                  </label>
                  <input id="mcas-regla-nombre" v-model="formRegla.nombre" class="mcas-input" :class="claseError('nombre')" placeholder="Ej: Endesa · pyme luz 3.0TD" maxlength="150" data-autofocus>
                  <small v-if="erroresForm.nombre" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.nombre }}</small>
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-regla-codigo">
                    Código interno (opcional; se genera solo)
                    <i class="fas fa-info-circle help-icon" title="Identificador técnico de la regla dentro de la tabla. Si lo deja vacío, se genera al guardar."></i>
                  </label>
                  <input id="mcas-regla-codigo" v-model="formRegla.codigo" class="mcas-input mcas-input--codigo" :class="claseError('codigo')" placeholder="Se genera al guardar">
                  <small v-if="erroresForm.codigo" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.codigo }}</small>
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-regla-metodo">
                    Método de cálculo <span class="required-asterisk">*</span>
                    <i class="fas fa-info-circle help-icon" :title="ayudaMetodo(formRegla.metodoCalculo)"></i>
                  </label>
                  <select id="mcas-regla-metodo" v-model="formRegla.metodoCalculo" class="mcas-input" :class="claseError('metodoCalculo')" @change="onCambioMetodo">
                    <option v-for="m in metodosCalculo" :key="m.value" :value="m.value">{{ m.label }}</option>
                  </select>
                  <small v-if="erroresForm.metodoCalculo" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.metodoCalculo }}</small>
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-regla-prioridad">
                    Prioridad
                    <i class="fas fa-info-circle help-icon" title="Número de orden en la lista (menor = más arriba). No desempata: si dos reglas coinciden con el mismo contrato, la propuesta queda en error de cálculo."></i>
                  </label>
                  <input id="mcas-regla-prioridad" v-model.number="formRegla.prioridad" type="number" class="mcas-input" :class="claseError('prioridad')">
                  <small v-if="erroresForm.prioridad" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.prioridad }}</small>
                </div>
                <div class="form-group">
                  <span class="mcas-label">Estado</span>
                  <label class="toggle-switch" title="Las reglas inactivas se conservan en la lista, pero el motor no las usa.">
                    <input v-model="formRegla.activo" type="checkbox">
                    <span class="toggle-slider"></span>
                    <span class="toggle-label">{{ formRegla.activo ? 'Regla activa' : 'Regla inactiva' }}</span>
                  </label>
                </div>
                <div class="form-group form-group--completo">
                  <label class="mcas-label" for="mcas-regla-descripcion">Descripción</label>
                  <textarea id="mcas-regla-descripcion" v-model="formRegla.descripcion" class="mcas-input" rows="2" maxlength="1000" placeholder="Opcional: explicación para quien revise la regla"></textarea>
                </div>
              </div>
            </section>

            <!-- Editor visual -->
            <template v-if="!editorRegla.avanzado">
              <section class="form-section">
                <div class="section-header"><i class="fas fa-filter"></i><h3>¿A qué contratos se aplica?</h3></div>
                <p class="form-hint-inline">
                  Elija solo lo que deba cumplir el contrato; lo que quede en «Cualquiera» o vacío no filtra.
                  Si un contrato no tiene informado un dato que usa la regla, su propuesta queda en «Faltan datos».
                </p>
                <div class="form-grid form-grid--3">
                  <div class="form-group">
                    <label class="mcas-label" for="mcas-cond-suministro">Tipo de suministro</label>
                    <select id="mcas-cond-suministro" v-model="editorRegla.condiciones.tipo_suministro" class="mcas-input">
                      <option value="">Cualquiera</option>
                      <option v-for="o in opcionesCondicion.tipo_suministro" :key="o.value" :value="o.value">{{ o.label }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="mcas-label" for="mcas-cond-segmento">Segmento</label>
                    <select id="mcas-cond-segmento" v-model="editorRegla.condiciones.segmento" class="mcas-input">
                      <option value="">Cualquiera</option>
                      <option v-for="o in opcionesCondicion.segmento" :key="o.value" :value="o.value">{{ o.label }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="mcas-label" for="mcas-cond-renovacion">
                      Nuevo o renovación
                      <i class="fas fa-info-circle help-icon" title="Campo «¿Es renovación?» del contrato."></i>
                    </label>
                    <select id="mcas-cond-renovacion" v-model="editorRegla.condiciones.es_renovacion" class="mcas-input" @change="onCambioCondicion('es_renovacion')">
                      <option value="">Cualquiera</option>
                      <option v-for="o in opcionesCondicion.es_renovacion" :key="o.value" :value="o.value">{{ o.label }}</option>
                    </select>
                  </div>
                  <div v-if="editorRegla.condiciones.es_renovacion === 'true' || editorRegla.condiciones.tipo_renovacion" class="form-group">
                    <label class="mcas-label" for="mcas-cond-tipo-renovacion">Tipo de renovación</label>
                    <select id="mcas-cond-tipo-renovacion" v-model="editorRegla.condiciones.tipo_renovacion" class="mcas-input" @change="onCambioCondicion('tipo_renovacion')">
                      <option value="">Cualquiera</option>
                      <option v-for="o in opcionesCondicion.tipo_renovacion" :key="o.value" :value="o.value">{{ o.label }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="mcas-label" for="mcas-cond-alta">
                      Alta nueva
                      <i class="fas fa-info-circle help-icon" title="Campo «Alta nueva» del contrato: primera alta del cliente en la comercializadora."></i>
                    </label>
                    <select id="mcas-cond-alta" v-model="editorRegla.condiciones.alta_nueva" class="mcas-input">
                      <option value="">Cualquiera</option>
                      <option v-for="o in opcionesCondicion.alta_nueva" :key="o.value" :value="o.value">{{ o.label }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="mcas-label" for="mcas-cond-ambito">Ámbito</label>
                    <select id="mcas-cond-ambito" v-model="editorRegla.condiciones.ambito" class="mcas-input">
                      <option value="">Cualquiera</option>
                      <option v-for="o in opcionesCondicion.ambito" :key="o.value" :value="o.value">{{ o.label }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="mcas-label" for="mcas-cond-producto">
                      Producto comercial
                      <i class="fas fa-info-circle help-icon" title="Productos de la comercializadora de la tabla (pestaña Productos). El contrato debe tener elegido ese producto."></i>
                    </label>
                    <select id="mcas-cond-producto" v-model="editorRegla.condiciones.codigo_producto" class="mcas-input">
                      <option value="">Cualquiera</option>
                      <option v-for="o in opcionesProductoRegla" :key="o.value" :value="o.value">{{ o.label }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="mcas-label" for="mcas-cond-tarifa">
                      Tarifa de acceso
                      <i class="fas fa-info-circle help-icon" title="Tarifa de luz o de gas del contrato (tablas maestras Tarifas Luz / Tarifas Gas)."></i>
                    </label>
                    <select id="mcas-cond-tarifa" v-model="editorRegla.condiciones.tarifa_acceso" class="mcas-input">
                      <option value="">Cualquiera</option>
                      <option v-for="o in opcionesTarifaRegla" :key="o.value" :value="o.value">{{ o.label }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="mcas-label" for="mcas-cond-zona">
                      Zona de comisión
                      <i class="fas fa-info-circle help-icon" title="Mismo código que se escribe en el campo «Zona comisión» del contrato (p. ej. ZBR)."></i>
                    </label>
                    <input id="mcas-cond-zona" v-model="editorRegla.condiciones.zona_comision" class="mcas-input" placeholder="Cualquiera">
                  </div>
                </div>

                <div class="rango-condicion">
                  <div class="rango-condicion-titulo">
                    <span class="mcas-label">Consumo anual</span>
                    <select v-model="editorRegla.condiciones.consumoUnidad" class="mcas-input rango-unidad" aria-label="Unidad del consumo">
                      <option value="kwh">kWh</option>
                      <option value="mwh">MWh</option>
                    </select>
                  </div>
                  <div class="form-grid">
                    <div class="form-group">
                      <label class="mcas-label" for="mcas-cond-consumo-min">Desde</label>
                      <input id="mcas-cond-consumo-min" v-model="editorRegla.condiciones.consumoMin" type="number" min="0" step="any" class="mcas-input" placeholder="Sin mínimo">
                      <label class="toggle-switch toggle-switch--compacto toggle-switch--bajo-campo" title="Activo: un consumo igual al mínimo entra (≥). Inactivo: debe ser mayor (>).">
                        <input v-model="editorRegla.condiciones.consumoMinInc" type="checkbox">
                        <span class="toggle-slider"></span>
                        <span class="toggle-label">Incluir el mínimo (≥)</span>
                      </label>
                    </div>
                    <div class="form-group">
                      <label class="mcas-label" for="mcas-cond-consumo-max">Hasta</label>
                      <input id="mcas-cond-consumo-max" v-model="editorRegla.condiciones.consumoMax" type="number" min="0" step="any" class="mcas-input" :class="claseError('consumoMax')" placeholder="Sin máximo">
                      <label class="toggle-switch toggle-switch--compacto toggle-switch--bajo-campo" title="Activo: un consumo igual al máximo entra (≤). Inactivo: debe ser menor (<).">
                        <input v-model="editorRegla.condiciones.consumoMaxInc" type="checkbox">
                        <span class="toggle-slider"></span>
                        <span class="toggle-label">Incluir el máximo (≤)</span>
                      </label>
                      <small v-if="erroresForm.consumoMax" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.consumoMax }}</small>
                    </div>
                  </div>
                </div>

                <div class="rango-condicion">
                  <div class="rango-condicion-titulo">
                    <span class="mcas-label">
                      Potencia de cálculo (kW)
                      <i class="fas fa-info-circle help-icon" title="Campo «Potencia de cálculo (kW)» del contrato."></i>
                    </span>
                  </div>
                  <div class="form-grid">
                    <div class="form-group">
                      <label class="mcas-label" for="mcas-cond-potencia-min">Desde</label>
                      <input id="mcas-cond-potencia-min" v-model="editorRegla.condiciones.potenciaMin" type="number" min="0" step="any" class="mcas-input" placeholder="Sin mínimo">
                      <label class="toggle-switch toggle-switch--compacto toggle-switch--bajo-campo" title="Activo: una potencia igual al mínimo entra (≥). Inactivo: debe ser mayor (>).">
                        <input v-model="editorRegla.condiciones.potenciaMinInc" type="checkbox">
                        <span class="toggle-slider"></span>
                        <span class="toggle-label">Incluir el mínimo (≥)</span>
                      </label>
                    </div>
                    <div class="form-group">
                      <label class="mcas-label" for="mcas-cond-potencia-max">Hasta</label>
                      <input id="mcas-cond-potencia-max" v-model="editorRegla.condiciones.potenciaMax" type="number" min="0" step="any" class="mcas-input" :class="claseError('potenciaMax')" placeholder="Sin máximo">
                      <label class="toggle-switch toggle-switch--compacto toggle-switch--bajo-campo" title="Activo: una potencia igual al máximo entra (≤). Inactivo: debe ser menor (<).">
                        <input v-model="editorRegla.condiciones.potenciaMaxInc" type="checkbox">
                        <span class="toggle-slider"></span>
                        <span class="toggle-label">Incluir el máximo (≤)</span>
                      </label>
                      <small v-if="erroresForm.potenciaMax" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.potenciaMax }}</small>
                    </div>
                  </div>
                </div>
              </section>

              <section class="form-section">
                <div class="section-header"><i class="fas fa-calculator"></i><h3>¿Cómo se calcula la comisión?</h3></div>
                <div class="form-grid">
                  <div v-if="formRegla.metodoCalculo === 'FIXED_AMOUNT'" class="form-group">
                    <label class="mcas-label" for="mcas-calc-importe">Importe de la comisión (€) <span class="required-asterisk">*</span></label>
                    <input id="mcas-calc-importe" v-model="editorRegla.calculo.importe" type="number" min="0" step="any" class="mcas-input" :class="claseError('calcImporte')" placeholder="Ej: 95">
                    <small v-if="erroresForm.calcImporte" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.calcImporte }}</small>
                  </div>
                  <div v-if="formRegla.metodoCalculo === 'RATE_PER_MWH'" class="form-group">
                    <label class="mcas-label" for="mcas-calc-tasa">
                      Tasa (€ por MWh) <span class="required-asterisk">*</span>
                      <i class="fas fa-info-circle help-icon" title="Se multiplica por el consumo anual del contrato en MWh."></i>
                    </label>
                    <input id="mcas-calc-tasa" v-model="editorRegla.calculo.tasa" type="number" min="0" step="any" class="mcas-input" :class="claseError('calcTasa')" placeholder="Ej: 4.05">
                    <small v-if="erroresForm.calcTasa" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.calcTasa }}</small>
                  </div>
                  <template v-if="formRegla.metodoCalculo === 'FEE_PERCENTAGE'">
                    <div class="form-group">
                      <label class="mcas-label" for="mcas-calc-porcentaje">
                        Porcentaje del FEE (%) <span class="required-asterisk">*</span>
                        <i class="fas fa-info-circle help-icon" title="Porcentaje que se aplica al FEE del contrato. Escríbalo en tanto por cien (44 = 44 %)."></i>
                      </label>
                      <input id="mcas-calc-porcentaje" v-model="editorRegla.calculo.porcentaje" type="number" min="0" max="100" step="any" class="mcas-input" :class="claseError('calcPorcentaje')" placeholder="Ej: 44">
                      <small v-if="erroresForm.calcPorcentaje" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.calcPorcentaje }}</small>
                    </div>
                    <div class="form-group">
                      <label class="mcas-label" for="mcas-calc-fee-minimo">
                        FEE mínimo (€/MWh)
                        <i class="fas fa-info-circle help-icon" title="Opcional. Si el FEE del contrato es menor, no se calcula y la propuesta queda en «Error de cálculo»."></i>
                      </label>
                      <input id="mcas-calc-fee-minimo" v-model="editorRegla.calculo.feeMinimo" type="number" min="0" step="any" class="mcas-input" :class="claseError('calcFeeMinimo')" placeholder="Sin mínimo">
                      <small v-if="erroresForm.calcFeeMinimo" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.calcFeeMinimo }}</small>
                    </div>
                  </template>
                  <div v-if="formRegla.metodoCalculo === 'COMPOSITE_SUM'" class="form-group form-group--completo">
                    <span class="mcas-label">Líneas que se suman <span class="required-asterisk">*</span></span>
                    <div v-for="(l, i) in editorRegla.calculo.lineas" :key="i" class="linea-suma">
                      <span class="linea-suma-numero">{{ i + 1 }}</span>
                      <select v-model="l.metodo" class="mcas-input" :aria-label="'Tipo de la línea ' + (i + 1)">
                        <option v-for="t in tiposLinea" :key="t.value" :value="t.value">{{ t.label }}</option>
                      </select>
                      <div class="linea-suma-valor">
                        <input v-model="l.valor" type="number" min="0" step="any" class="mcas-input" :aria-label="'Valor de la línea ' + (i + 1)">
                        <span class="linea-suma-unidad">{{ unidadLinea(l.metodo) }}</span>
                      </div>
                      <input v-model="l.descripcion" class="mcas-input" placeholder="Descripción (opcional)" :aria-label="'Descripción de la línea ' + (i + 1)">
                      <button type="button" class="btn-icon btn-delete" title="Quitar la línea" aria-label="Quitar la línea" @click="quitarLinea(i)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                    <button type="button" class="btn btn-outline btn-anadir-linea" @click="anadirLinea">
                      <i class="fas fa-plus"></i>
                      <span>Añadir línea</span>
                    </button>
                    <small v-if="erroresForm.calcLineas" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.calcLineas }}</small>
                  </div>
                  <div v-if="esMetodoTabla" class="form-group form-group--completo">
                    <div class="mcas-alert mcas-alert--info">
                      <i class="fas fa-table"></i>
                      <div>El importe se busca en una tabla. Guarde la regla y rellene sus importes con <strong>Ver tabla</strong> en la lista de reglas.</div>
                    </div>
                  </div>
                  <div v-if="requiereMotivo" class="form-group form-group--completo">
                    <label class="mcas-label" for="mcas-regla-motivo">
                      Mensaje para el usuario <span class="required-asterisk">*</span>
                      <i class="fas fa-info-circle help-icon" title="Se muestra en la propuesta como motivo de la revisión manual o de que no comisione."></i>
                    </label>
                    <input id="mcas-regla-motivo" v-model="formRegla.motivoManual" class="mcas-input" :class="claseError('motivoManual')" placeholder="Ej: Las renovaciones tácitas no comisionan">
                    <small v-if="erroresForm.motivoManual" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.motivoManual }}</small>
                  </div>
                  <div v-if="!requiereMotivo" class="form-group">
                    <label class="mcas-label" for="mcas-regla-pagos">
                      Nº de pagos sugerido
                      <i class="fas fa-info-circle help-icon" title="Solo se usa si el contrato no indica su propio «Nº de pagos»."></i>
                    </label>
                    <select id="mcas-regla-pagos" v-model="editorRegla.numeroPagos" class="mcas-input">
                      <option value="">Sin sugerencia (1 pago)</option>
                      <option v-for="n in 12" :key="n" :value="n">{{ n === 1 ? '1 pago' : n + ' pagos' }}</option>
                    </select>
                  </div>
                  <div class="form-group" :class="{ 'form-group--completo': requiereMotivo }">
                    <label class="mcas-label" for="mcas-regla-localizador">
                      Localizador de origen
                      <i class="fas fa-info-circle help-icon" title="Referencia a la fila o celda del Excel de comisiones, para trazabilidad."></i>
                    </label>
                    <input id="mcas-regla-localizador" v-model="formRegla.localizadorOrigen" class="mcas-input" placeholder="Ej: ENDESA/Fila_45">
                  </div>
                </div>
              </section>

              <div v-if="hayCondicionesAvanzadas" class="mcas-alert mcas-alert--info">
                <i class="fas fa-code"></i>
                <div>La regla tiene además parámetros avanzados que no aparecen en el formulario (<span class="texto-codigo">{{ clavesAvanzadas }}</span>). Se conservan al guardar; puede verlos en <strong>Editar como JSON</strong>.</div>
              </div>

              <section class="form-section">
                <div class="section-header"><i class="fas fa-eye"></i><h3>Resumen de la regla</h3></div>
                <dl class="resumen-regla">
                  <dt>Se aplica a</dt>
                  <dd>
                    <div class="chips">
                      <span v-for="parte in resumenReglaActual.aplica" :key="parte" class="chip">{{ parte }}</span>
                    </div>
                  </dd>
                  <dt>Cálculo</dt>
                  <dd>{{ resumenReglaActual.calcula }}</dd>
                  <template v-if="resumenReglaActual.ejemplo">
                    <dt>Ejemplo</dt>
                    <dd>{{ resumenReglaActual.ejemplo }}</dd>
                  </template>
                  <template v-if="resumenReglaActual.pago">
                    <dt>Pagos</dt>
                    <dd>{{ resumenReglaActual.pago }}</dd>
                  </template>
                </dl>
              </section>
            </template>

            <!-- Modo avanzado: JSON tal cual lo guarda el motor -->
            <template v-else>
              <div class="mcas-alert mcas-alert--warning">
                <i class="fas fa-code"></i>
                <div>Modo avanzado: edite el JSON exacto que usa el motor. Pulse <strong>Volver al formulario</strong> para seguir con el editor visual.</div>
              </div>
              <section class="form-section">
                <div class="section-header"><i class="fas fa-filter"></i><h3>Condiciones de selección (JSON)</h3></div>
                <p class="form-hint-inline">
                  Vacío = aplica a todos los contratos de la tabla. Campos válidos: <span class="texto-codigo">{{ camposCondicion }}</span>
                </p>
                <textarea
                  id="mcas-regla-condiciones"
                  v-model="formRegla.condicionesJson"
                  class="mcas-input mcas-input--codigo"
                  :class="claseError('condicionesJson')"
                  rows="4"
                  aria-label="Condiciones de selección (JSON)"
                  placeholder='{"tipo_suministro":"LUZ","segmento":"PYME","consumo_min_kwh":50001}'
                ></textarea>
                <small v-if="erroresForm.condicionesJson" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.condicionesJson }}</small>
              </section>
              <section class="form-section">
                <div class="section-header"><i class="fas fa-calculator"></i><h3>Cálculo y pago (JSON)</h3></div>
                <div class="form-grid">
                  <div v-if="usaParametrosCalculo" class="form-group">
                    <label class="mcas-label" for="mcas-regla-calculo">
                      Parámetros de cálculo
                      <i class="fas fa-info-circle help-icon" :title="ayudaCalculoJson(formRegla.metodoCalculo)"></i>
                    </label>
                    <textarea
                      id="mcas-regla-calculo"
                      v-model="formRegla.calculoJson"
                      class="mcas-input mcas-input--codigo"
                      :class="claseError('calculoJson')"
                      rows="3"
                      :placeholder="ejemploCalculoJson(formRegla.metodoCalculo)"
                    ></textarea>
                    <small v-if="erroresForm.calculoJson" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.calculoJson }}</small>
                  </div>
                  <div v-if="requiereMotivo" class="form-group">
                    <label class="mcas-label" for="mcas-regla-motivo-json">Mensaje para el usuario <span class="required-asterisk">*</span></label>
                    <input id="mcas-regla-motivo-json" v-model="formRegla.motivoManual" class="mcas-input" :class="claseError('motivoManual')">
                    <small v-if="erroresForm.motivoManual" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.motivoManual }}</small>
                  </div>
                  <div class="form-group" :class="{ 'form-group--completo': !usaParametrosCalculo && !requiereMotivo }">
                    <label class="mcas-label" for="mcas-regla-pago">
                      Política de pago
                      <i class="fas fa-info-circle help-icon" title="numero_pagos_sugerido: se usa si el contrato no indica su número de pagos."></i>
                    </label>
                    <textarea
                      id="mcas-regla-pago"
                      v-model="formRegla.politicaPagoJson"
                      class="mcas-input mcas-input--codigo"
                      :class="claseError('politicaPagoJson')"
                      rows="3"
                      placeholder='{"numero_pagos_sugerido": 1}'
                    ></textarea>
                    <small v-if="erroresForm.politicaPagoJson" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.politicaPagoJson }}</small>
                  </div>
                  <div class="form-group form-group--completo">
                    <label class="mcas-label" for="mcas-regla-localizador-json">Localizador de origen</label>
                    <input id="mcas-regla-localizador-json" v-model="formRegla.localizadorOrigen" class="mcas-input" placeholder="Ej: ENDESA/Fila_45">
                  </div>
                </div>
              </section>
            </template>
            </fieldset>
          </div>
          <div class="mcas-modal-footer">
            <div class="footer-izquierda">
              <span v-if="soloLecturaRegla" class="footer-note"><i class="fas fa-lock"></i> Solo lectura</span>
              <span v-else class="footer-note"><span class="required-asterisk">*</span> Campos obligatorios</span>
              <button type="button" class="btn btn-outline" :title="editorRegla.avanzado ? 'Volver al editor visual' : 'Ver y editar el JSON exacto que guarda la regla'" @click="alternarModoAvanzado">
                <i :class="editorRegla.avanzado ? 'fas fa-sliders-h' : 'fas fa-code'"></i>
                <span>{{ editorRegla.avanzado ? 'Volver al formulario' : 'Editar como JSON' }}</span>
              </button>
            </div>
            <div class="footer-actions">
              <button type="button" class="btn btn-cancel" @click="cerrarModales">
                <i class="fas fa-times"></i>
                <span>{{ soloLecturaRegla ? 'Cerrar' : 'Cancelar' }}</span>
              </button>
              <button v-if="!soloLecturaRegla" type="submit" class="btn btn-save" :disabled="mutacionEnCurso">
                <i :class="mutacionEnCurso ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>
                <span>{{ formRegla.id ? 'Actualizar' : 'Guardar' }}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Fila de la tabla (vista avanzada) -->
    <div v-if="modalRango" class="mcas-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="mcas-modal-rango-titulo" @click.self="cerrarModales">
      <div class="mcas-modal">
        <div class="mcas-modal-header aura-modal-header">
          <div class="mcas-modal-title">
            <div class="mcas-modal-icon"><i :class="formRango.id ? 'fas fa-edit' : 'fas fa-table'"></i></div>
            <div class="title-text">
              <h2 id="mcas-modal-rango-titulo">{{ formRango.id ? 'Editar fila de la tabla' : 'Nueva fila de la tabla' }}</h2>
              <p>Regla {{ nombreRegla(reglaParaRangos) }} · {{ etiquetaMetodo(reglaParaRangos?.metodoCalculo) }}</p>
            </div>
          </div>
          <button type="button" class="close-button" title="Cerrar" aria-label="Cerrar" @click="cerrarModales">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form class="mcas-modal-form" novalidate @submit.prevent="guardarRango">
          <div class="mcas-modal-body">
            <section class="form-section">
              <div class="section-header"><i class="fas fa-ruler-combined"></i><h3>Dimensión</h3></div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="mcas-label" for="mcas-rango-dimension">
                    Dimensión <span class="required-asterisk">*</span>
                    <i class="fas fa-info-circle help-icon" title="consumo_kwh, consumo_mwh, potencia_kw, tarifa_acceso..."></i>
                  </label>
                  <input id="mcas-rango-dimension" v-model="formRango.dimension" class="mcas-input mcas-input--codigo" :class="claseError('dimension')" list="dimensiones-list" placeholder="consumo_kwh" data-autofocus>
                  <datalist id="dimensiones-list">
                    <option value="consumo_kwh"/>
                    <option value="consumo_mwh"/>
                    <option value="potencia_kw"/>
                    <option value="tarifa_acceso"/>
                    <option value="codigo_producto"/>
                    <option value="segmento"/>
                    <option value="tipo_suministro"/>
                    <option value="zona_comision"/>
                  </datalist>
                  <small v-if="erroresForm.dimension" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.dimension }}</small>
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-rango-orden">
                    Orden / celda <span class="required-asterisk">*</span>
                    <i class="fas fa-info-circle help-icon" title="En una matriz, use el mismo orden en todas las dimensiones que formen la misma celda."></i>
                  </label>
                  <input id="mcas-rango-orden" v-model.number="formRango.orden" type="number" min="1" step="1" class="mcas-input" :class="claseError('orden')">
                  <small v-if="erroresForm.orden" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.orden }}</small>
                </div>
              </div>
            </section>

            <section v-if="!esDimensionTexto" class="form-section">
              <div class="section-header"><i class="fas fa-arrows-alt-h"></i><h3>Rango numérico</h3></div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="mcas-label" for="mcas-rango-min">Valor mínimo</label>
                  <input id="mcas-rango-min" v-model="formRango.valorMin" type="number" step="any" class="mcas-input" :class="claseError('valorMin')" placeholder="Sin mínimo">
                  <label class="toggle-switch toggle-switch--compacto toggle-switch--bajo-campo" title="Si está activo, el valor igual al mínimo entra en el rango (≥). Si no, es estrictamente mayor (>).">
                    <input v-model="formRango.minInclusivo" type="checkbox">
                    <span class="toggle-slider"></span>
                    <span class="toggle-label">Incluir el mínimo (≥)</span>
                  </label>
                  <small v-if="erroresForm.valorMin" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.valorMin }}</small>
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-rango-max">Valor máximo</label>
                  <input id="mcas-rango-max" v-model="formRango.valorMax" type="number" step="any" class="mcas-input" :class="claseError('valorMax')" placeholder="Sin máximo">
                  <label class="toggle-switch toggle-switch--compacto toggle-switch--bajo-campo" title="Si está activo, el valor igual al máximo entra en el rango (≤). Si no, es estrictamente menor (<).">
                    <input v-model="formRango.maxInclusivo" type="checkbox">
                    <span class="toggle-slider"></span>
                    <span class="toggle-label">Incluir el máximo (≤)</span>
                  </label>
                  <small v-if="erroresForm.valorMax" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.valorMax }}</small>
                </div>
              </div>
            </section>

            <section v-else class="form-section">
              <div class="section-header"><i class="fas fa-tag"></i><h3>Categoría</h3></div>
              <div class="form-group">
                <label class="mcas-label" for="mcas-rango-categoria">
                  Valor de categoría <span class="required-asterisk">*</span>
                  <i class="fas fa-info-circle help-icon" title="Para dimensiones de texto (p. ej. tarifa_acceso = 3.0TD)."></i>
                </label>
                <input id="mcas-rango-categoria" v-model="formRango.valorCategoria" class="mcas-input" :class="claseError('valorCategoria')" placeholder="Ej: 3.0TD">
                <small v-if="erroresForm.valorCategoria" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.valorCategoria }}</small>
              </div>
            </section>

            <section class="form-section">
              <div class="section-header"><i class="fas fa-euro-sign"></i><h3>Resultado</h3></div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="mcas-label" for="mcas-rango-resultado">
                    Resultado <span class="required-asterisk">*</span>
                    <i class="fas fa-info-circle help-icon" title="Importe o tasa que devuelve esta celda de la tabla."></i>
                  </label>
                  <input id="mcas-rango-resultado" v-model="formRango.valorResultado" type="number" step="any" class="mcas-input" :class="claseError('valorResultado')">
                  <small v-if="erroresForm.valorResultado" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.valorResultado }}</small>
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-rango-unidad">Unidad del resultado</label>
                  <input id="mcas-rango-unidad" v-model="formRango.unidadResultado" class="mcas-input" placeholder="€ o €/MWh">
                </div>
              </div>
            </section>
          </div>
          <div class="mcas-modal-footer">
            <span class="footer-note"><span class="required-asterisk">*</span> Campos obligatorios</span>
            <div class="footer-actions">
              <button type="button" class="btn btn-cancel" @click="cerrarModales">
                <i class="fas fa-times"></i>
                <span>Cancelar</span>
              </button>
              <button type="submit" class="btn btn-save" :disabled="mutacionEnCurso">
                <i :class="mutacionEnCurso ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>
                <span>{{ formRango.id ? 'Actualizar' : 'Guardar' }}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Probar con un contrato (simulación sin guardar) -->
    <div v-if="modalSimulacion" class="mcas-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="mcas-modal-sim-titulo" @click.self="cerrarModales">
      <div class="mcas-modal mcas-modal--ancho">
        <div class="mcas-modal-header aura-modal-header">
          <div class="mcas-modal-title">
            <div class="mcas-modal-icon"><i class="fas fa-flask"></i></div>
            <div class="title-text">
              <h2 id="mcas-modal-sim-titulo">Probar con un contrato</h2>
              <p>Tabla {{ nombreConjunto(conjuntoParaReglas) }} · {{ etiquetaEstadoConjunto(conjuntoParaReglas?.estado) }} · La prueba no guarda nada</p>
            </div>
          </div>
          <button type="button" class="close-button" title="Cerrar" aria-label="Cerrar" @click="cerrarModales">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form class="mcas-modal-form" novalidate @submit.prevent="ejecutarSimulacion">
          <div class="mcas-modal-body">
            <div class="detalle-stack">
              <section class="form-section">
                <div class="section-header"><i class="fas fa-file-contract"></i><h3>Contrato</h3></div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-sim-contrato">
                    Número de contrato o ID <span class="required-asterisk">*</span>
                    <i class="fas fa-info-circle help-icon" title="Número tal como aparece en Gestión de Contratos (p. ej. CT-2026-004112) o su identificador interno. Se usan los datos actuales del contrato."></i>
                  </label>
                  <div class="sim-contrato">
                    <input id="mcas-sim-contrato" v-model="simulacion.referencia" class="mcas-input" :class="claseError('simContrato')" placeholder="Ej: CT-2026-004112" data-autofocus>
                    <button type="submit" class="btn btn-primary" :disabled="simulacion.cargando">
                      <i :class="simulacion.cargando ? 'fas fa-spinner fa-spin' : 'fas fa-play'"></i>
                      <span>Probar</span>
                    </button>
                  </div>
                  <small v-if="erroresForm.simContrato" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.simContrato }}</small>
                </div>
              </section>

              <template v-if="simulacion.resultado">
                <div v-if="simulacion.resultado.avisos?.length" class="mcas-alert mcas-alert--warning">
                  <i class="fas fa-exclamation-triangle"></i>
                  <div>
                    <strong>Ahora mismo el cálculo automático no aplicaría esta tabla a este contrato:</strong>
                    <ul>
                      <li v-for="aviso in simulacion.resultado.avisos" :key="aviso">{{ aviso }}</li>
                    </ul>
                  </div>
                </div>

                <div class="detalle-resumen">
                  <div class="resumen-item">
                    <span class="resumen-label">Resultado</span>
                    <span class="resumen-valor">
                      <span class="badge" :class="'badge--' + tonoResultadoSimulacion(simulacion.resultado.resultado)">{{ etiquetaResultadoSimulacion(simulacion.resultado.resultado) }}</span>
                    </span>
                  </div>
                  <div class="resumen-item resumen-item--destacado">
                    <span class="resumen-label">Comisión</span>
                    <span class="resumen-valor">{{ simulacion.resultado.importe != null ? formatEuros(simulacion.resultado.importe) : '—' }}</span>
                  </div>
                  <div class="resumen-item">
                    <span class="resumen-label">Número de pagos</span>
                    <span class="resumen-valor">{{ simulacion.resultado.numeroPagos ?? '—' }}</span>
                  </div>
                  <div class="resumen-item">
                    <span class="resumen-label">Regla aplicada</span>
                    <span class="resumen-valor texto-codigo" :title="simulacion.resultado.reglaAplicada || ''">{{ simulacion.resultado.reglaAplicada || '—' }}</span>
                  </div>
                </div>

                <div v-if="simulacion.resultado.mensajes?.length" class="mcas-alert" :class="simulacion.resultado.resultado === 'CALCULADO' ? 'mcas-alert--info' : 'mcas-alert--danger'">
                  <i :class="simulacion.resultado.resultado === 'CALCULADO' ? 'fas fa-info-circle' : 'fas fa-times-circle'"></i>
                  <div>
                    <strong>{{ explicacionResultadoSimulacion(simulacion.resultado.resultado) }}</strong>
                    <ul>
                      <li v-for="m in simulacion.resultado.mensajes" :key="m">{{ m }}</li>
                    </ul>
                  </div>
                </div>

                <section v-if="simulacion.resultado.lineas?.length" class="form-section">
                  <div class="section-header"><i class="fas fa-list-ol"></i><h3>Desglose del cálculo</h3></div>
                  <div class="tabla-detalle">
                    <table class="data-table data-table--compacta">
                      <thead><tr><th>Concepto</th><th>Método</th><th class="text-end">Importe</th></tr></thead>
                      <tbody>
                        <tr v-for="(l, i) in simulacion.resultado.lineas" :key="i">
                          <td>{{ l.descripcion }}</td>
                          <td>{{ etiquetaMetodo(l.metodo) }}</td>
                          <td class="text-end celda-importe">{{ formatEuros(l.importe) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section v-if="simulacion.resultado.calendario?.length" class="form-section">
                  <div class="section-header"><i class="fas fa-calendar-alt"></i><h3>Calendario de pagos que se generaría</h3></div>
                  <div class="tabla-detalle">
                    <table class="data-table data-table--compacta">
                      <thead><tr><th>Pago</th><th>Fecha</th><th class="text-end">Importe</th></tr></thead>
                      <tbody>
                        <tr v-for="c in simulacion.resultado.calendario" :key="c.numero">
                          <td>{{ c.numero }}</td>
                          <td>{{ formatFechaCorta(c.fecha) || '—' }}</td>
                          <td class="text-end celda-importe">{{ formatEuros(c.importe) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section v-if="datosSimulacion.length" class="form-section">
                  <div class="section-header"><i class="fas fa-file-alt"></i><h3>Datos del contrato {{ simulacion.resultado.numeroContrato }} usados en el cálculo</h3></div>
                  <dl class="detalle-grid">
                    <div v-for="d in datosSimulacion" :key="d.etiqueta">
                      <dt>{{ d.etiqueta }}</dt>
                      <dd>{{ d.valor }}</dd>
                    </div>
                  </dl>
                </section>
              </template>

              <div v-else class="mcas-alert mcas-alert--info">
                <i class="fas fa-info-circle"></i>
                <div>
                  Escriba un contrato y pulse <strong>Probar</strong>. Verá qué regla de la tabla le aplica, el importe, el desglose y el calendario de pagos, o por qué no se puede calcular.
                  Sirve para comprobar una tabla en borrador antes de activarla.
                </div>
              </div>
            </div>
          </div>
          <div class="mcas-modal-footer">
            <span class="footer-note"><i class="fas fa-lock"></i> No crea propuestas ni servicios</span>
            <div class="footer-actions">
              <button type="button" class="btn btn-cancel" @click="cerrarModales">
                <i class="fas fa-times"></i>
                <span>Cerrar</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Política de retrocesión -->
    <div v-if="modalRetrocesion" class="mcas-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="mcas-modal-retro-titulo" @click.self="cerrarModales">
      <div class="mcas-modal mcas-modal--ancho">
        <div class="mcas-modal-header aura-modal-header">
          <div class="mcas-modal-title">
            <div class="mcas-modal-icon"><i :class="soloLecturaRetrocesion ? 'fas fa-eye' : (formRetrocesion.id ? 'fas fa-edit' : 'fas fa-undo-alt')"></i></div>
            <div class="title-text">
              <h2 id="mcas-modal-retro-titulo">{{ tituloModalRetrocesion }}</h2>
              <p>{{ formRetrocesion.id
                ? [formRetrocesion.codigo, nombreComercializadora(formRetrocesion.idComercializadora)].filter(Boolean).join(' · ')
                : 'Qué parte de la comisión se devolvería si el contrato causa baja anticipada' }}</p>
            </div>
          </div>
          <button type="button" class="close-button" title="Cerrar" aria-label="Cerrar" @click="cerrarModales">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form class="mcas-modal-form" novalidate @submit.prevent="guardarRetrocesion">
          <div class="mcas-modal-body">
            <div v-if="soloLecturaRetrocesion" class="mcas-alert mcas-alert--info">
              <i class="fas fa-lock"></i>
              <div>Política {{ etiquetaEstadoRetrocesion(formRetrocesion.estado).toLowerCase() }}: solo se pueden modificar las políticas en borrador.</div>
            </div>
            <fieldset class="fieldset-limpio" :disabled="soloLecturaRetrocesion">
              <section class="form-section">
                <div class="section-header"><i class="fas fa-id-card"></i><h3>Identificación</h3></div>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="mcas-label" for="mcas-retro-codigo">
                      Código único <span class="required-asterisk">*</span>
                      <i class="fas fa-info-circle help-icon" title="Identificador estable de la política. Ej: RET-ENDESA-PYME-20260309"></i>
                    </label>
                    <input id="mcas-retro-codigo" v-model="formRetrocesion.codigo" class="mcas-input mcas-input--codigo" :class="claseError('codigo')" placeholder="RET-COMERCIALIZADORA-SEGMENTO-AAAAMMDD" data-autofocus>
                    <small v-if="erroresForm.codigo" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.codigo }}</small>
                  </div>
                  <div class="form-group">
                    <label class="mcas-label" for="mcas-retro-version">Versión <span class="required-asterisk">*</span></label>
                    <input id="mcas-retro-version" v-model="formRetrocesion.version" class="mcas-input" :class="claseError('version')" placeholder="1.0">
                    <small v-if="erroresForm.version" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.version }}</small>
                  </div>
                  <div class="form-group">
                    <label class="mcas-label" for="mcas-retro-comercializadora">Comercializadora <span class="required-asterisk">*</span></label>
                    <select id="mcas-retro-comercializadora" v-model="formRetrocesion.idComercializadora" class="mcas-input" :class="claseError('idComercializadora')">
                      <option value="">Seleccionar...</option>
                      <option v-for="c in comercializadoras" :key="c.id" :value="c.id">{{ c.nombre }}</option>
                    </select>
                    <small v-if="erroresForm.idComercializadora" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.idComercializadora }}</small>
                  </div>
                  <div class="form-group">
                    <label class="mcas-label" for="mcas-retro-gestora">Gestora</label>
                    <select id="mcas-retro-gestora" v-model="formRetrocesion.idGestora" class="mcas-input">
                      <option :value="null">Sin gestora específica</option>
                      <option v-for="g in gestoras" :key="g.id" :value="g.id">{{ g.nombre }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="mcas-label" for="mcas-retro-desde">Vigencia desde <span class="required-asterisk">*</span></label>
                    <input id="mcas-retro-desde" v-model="formRetrocesion.vigenciaDesde" type="date" class="mcas-input" :class="claseError('vigenciaDesde')">
                    <small v-if="erroresForm.vigenciaDesde" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.vigenciaDesde }}</small>
                  </div>
                  <div class="form-group">
                    <label class="mcas-label" for="mcas-retro-hasta">
                      Vigencia hasta
                      <i class="fas fa-info-circle help-icon" title="Dejar vacío si no tiene fecha de caducidad"></i>
                    </label>
                    <input id="mcas-retro-hasta" v-model="formRetrocesion.vigenciaHasta" type="date" class="mcas-input" :class="claseError('vigenciaHasta')">
                    <small v-if="erroresForm.vigenciaHasta" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.vigenciaHasta }}</small>
                  </div>
                </div>
              </section>

              <section class="form-section">
                <div class="section-header"><i class="fas fa-filter"></i><h3>¿A qué contratos se aplica?</h3></div>
                <p class="form-hint-inline">Lo que quede en «Cualquiera» no filtra. Si a un contrato le corresponden varias, se usa la más concreta; si dos empatan, la propuesta lo avisa y no asocia ninguna.</p>
                <div class="form-grid form-grid--3">
                  <div class="form-group">
                    <label class="mcas-label" for="mcas-retro-segmento">Segmento</label>
                    <select id="mcas-retro-segmento" v-model="formRetrocesion.segmento" class="mcas-input">
                      <option value="">Cualquiera</option>
                      <option v-for="o in segmentos" :key="o.value" :value="o.value">{{ o.label }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="mcas-label" for="mcas-retro-suministro">Tipo de suministro</label>
                    <select id="mcas-retro-suministro" v-model="formRetrocesion.tipoSuministro" class="mcas-input">
                      <option value="">Cualquiera</option>
                      <option v-for="o in suministros" :key="o.value" :value="o.value">{{ o.label }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="mcas-label" for="mcas-retro-tarifa">Tarifa de acceso</label>
                    <select id="mcas-retro-tarifa" v-model="formRetrocesion.tarifaAcceso" class="mcas-input">
                      <option value="">Cualquiera</option>
                      <option v-for="o in opcionesTarifaRetrocesion" :key="o.value" :value="o.value">{{ o.label }}</option>
                    </select>
                  </div>
                </div>
              </section>

              <section class="form-section">
                <div class="section-header"><i class="fas fa-calculator"></i><h3>¿Cómo se calcula la retrocesión?</h3></div>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="mcas-label" for="mcas-retro-metodo">
                      Método <span class="required-asterisk">*</span>
                      <i class="fas fa-info-circle help-icon" :title="ayudaMetodoRetrocesion(formRetrocesion.metodo)"></i>
                    </label>
                    <select id="mcas-retro-metodo" v-model="formRetrocesion.metodo" class="mcas-input" :class="claseError('metodo')" @change="onCambioMetodoRetrocesion">
                      <option v-for="m in metodosRetrocesion" :key="m.value" :value="m.value">{{ m.label }}</option>
                    </select>
                    <small v-if="erroresForm.metodo" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.metodo }}</small>
                  </div>
                  <div class="form-group">
                    <span class="mcas-label">Límite</span>
                    <label class="toggle-switch" title="Activo: lo que se devuelva nunca supera lo que ya se ha cobrado de la comisión.">
                      <input v-model="formRetrocesion.limiteImportePagado" type="checkbox">
                      <span class="toggle-slider"></span>
                      <span class="toggle-label">Nunca supera lo cobrado</span>
                    </label>
                  </div>
                  <div class="form-group form-group--completo">
                    <label class="mcas-label" for="mcas-retro-descripcion">
                      Descripción
                      <i class="fas fa-info-circle help-icon" title="Origen (hoja y celdas del Excel) o avisos para el operador."></i>
                    </label>
                    <textarea id="mcas-retro-descripcion" v-model="formRetrocesion.descripcion" class="mcas-input" rows="2" placeholder="Ej: Excel ENDESA D81:G81"></textarea>
                  </div>
                </div>
              </section>

              <section v-if="usaTramosRetrocesion" class="form-section">
                <div class="section-header"><i class="fas fa-stream"></i><h3>Tramos desde la activación</h3></div>
                <p class="form-hint-inline">
                  Cada tramo dice qué se devolvería si el contrato causa baja dentro de ese periodo. «Hasta» vacío = sin final.
                  Los porcentajes se escriben en tanto por cien (60 = 60 %).
                </p>
                <div class="tramos-cabecera" aria-hidden="true">
                  <span></span><span>Unidad</span><span>Desde</span><span>Hasta</span><span>Valor</span><span>Tipo de valor</span><span></span>
                </div>
                <div v-for="(t, i) in formRetrocesion.tramos" :key="i" class="tramo">
                  <div class="tramo-fila">
                    <span class="linea-suma-numero">{{ i + 1 }}</span>
                    <select v-model="t.unidad" class="mcas-input" :class="claseError('tramos.' + i + '.unidad')" :aria-label="'Unidad del tramo ' + (i + 1)">
                      <option v-for="u in unidadesTramo" :key="u.value" :value="u.value">{{ u.label }}</option>
                    </select>
                    <input v-model="t.desde" type="number" min="0" step="1" class="mcas-input" :class="claseError('tramos.' + i + '.desde')" :aria-label="'Desde (tramo ' + (i + 1) + ')'">
                    <input v-model="t.hasta" type="number" min="0" step="1" class="mcas-input" :class="claseError('tramos.' + i + '.hasta')" placeholder="Sin final" :aria-label="'Hasta (tramo ' + (i + 1) + ')'">
                    <div class="linea-suma-valor">
                      <input v-model="t.valor" type="number" min="0" step="any" class="mcas-input" :class="claseError('tramos.' + i + '.valor')" :aria-label="'Valor del tramo ' + (i + 1)">
                      <span class="linea-suma-unidad">{{ unidadValorTramo(t.tipoValor) }}</span>
                    </div>
                    <select :value="t.tipoValor" class="mcas-input" :class="claseError('tramos.' + i + '.tipoValor')" :aria-label="'Tipo de valor del tramo ' + (i + 1)" @change="cambiarTipoTramo(t, $event.target.value)">
                      <option v-for="tv in tiposValorTramo" :key="tv.value" :value="tv.value">{{ tv.label }}</option>
                    </select>
                    <button type="button" class="btn-icon btn-delete" title="Quitar el tramo" aria-label="Quitar el tramo" @click="quitarTramo(i)">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                  <div class="tramo-opciones">
                    <label class="toggle-switch toggle-switch--compacto" title="Activo: el valor «desde» entra en el tramo (≥). Inactivo: debe ser mayor (>).">
                      <input v-model="t.desdeInclusivo" type="checkbox">
                      <span class="toggle-slider"></span>
                      <span class="toggle-label">Incluir «desde» (≥)</span>
                    </label>
                    <label class="toggle-switch toggle-switch--compacto" title="Activo: el valor «hasta» entra en el tramo (≤). Inactivo: debe ser menor (<).">
                      <input v-model="t.hastaInclusivo" type="checkbox">
                      <span class="toggle-slider"></span>
                      <span class="toggle-label">Incluir «hasta» (≤)</span>
                    </label>
                  </div>
                  <div v-if="t.tipoValor === 'SIN_CONFIRMAR'" class="mcas-alert mcas-alert--warning tramo-aviso">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div><strong>Unidad sin confirmar.</strong> El Excel no dice si este valor es un porcentaje, un factor o un importe: confírmelo con el cliente y elija el tipo de valor antes de publicar.</div>
                  </div>
                  <div v-if="t.revisarValor" class="mcas-alert mcas-alert--warning tramo-aviso">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>Revise el valor: ahora se interpreta como porcentaje (0,75 = 0,75 %; para 75 % escriba 75)</div>
                  </div>
                  <small v-for="m in erroresTramo(i)" :key="m" class="error-text tramo-error"><i class="fas fa-exclamation-circle"></i> {{ m }}</small>
                </div>
                <button type="button" class="btn btn-outline btn-anadir-tramo" @click="anadirTramo">
                  <i class="fas fa-plus"></i>
                  <span>Añadir tramo</span>
                </button>
                <small v-if="erroresForm.tramos" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.tramos }}</small>
              </section>

              <div v-else class="mcas-alert mcas-alert--info">
                <i class="fas fa-info-circle"></i>
                <div>{{ formRetrocesion.metodo === 'PRORRATEO'
                  ? 'Prorrateo a 365 días desde la activación: se devolvería la parte de la comisión que corresponda a los días que falten. No lleva tramos.'
                  : 'Esta política indica que no hay retrocesión: no lleva tramos.' }}</div>
              </div>
            </fieldset>
          </div>
          <div class="mcas-modal-footer">
            <span v-if="soloLecturaRetrocesion" class="footer-note"><i class="fas fa-lock"></i> Solo lectura</span>
            <span v-else class="footer-note"><span class="required-asterisk">*</span> Campos obligatorios</span>
            <div class="footer-actions">
              <button type="button" class="btn btn-cancel" @click="cerrarModales">
                <i class="fas fa-times"></i>
                <span>{{ soloLecturaRetrocesion ? 'Cerrar' : 'Cancelar' }}</span>
              </button>
              <button v-if="!soloLecturaRetrocesion" type="submit" class="btn btn-save" :disabled="mutacionEnCurso">
                <i :class="mutacionEnCurso ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>
                <span>{{ formRetrocesion.id ? 'Actualizar' : 'Guardar' }}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Nueva versión de una tabla de comisiones -->
    <div v-if="modalNuevaVersion" class="mcas-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="mcas-modal-version-titulo" @click.self="cerrarModales">
      <div class="mcas-modal">
        <div class="mcas-modal-header aura-modal-header">
          <div class="mcas-modal-title">
            <div class="mcas-modal-icon"><i class="fas fa-code-branch"></i></div>
            <div class="title-text">
              <h2 id="mcas-modal-version-titulo">Nueva versión</h2>
              <p>Copia de «{{ nombreConjunto(conjuntoNuevaVersion) }}» con sus reglas y tramos</p>
            </div>
          </div>
          <button type="button" class="close-button" title="Cerrar" aria-label="Cerrar" @click="cerrarModales">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form class="mcas-modal-form" novalidate @submit.prevent="guardarNuevaVersion">
          <div class="mcas-modal-body">
            <section class="form-section">
              <div class="section-header"><i class="fas fa-id-card"></i><h3>Datos de la nueva versión</h3></div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="mcas-label" for="mcas-version-nombre">Nombre <span class="required-asterisk">*</span></label>
                  <input id="mcas-version-nombre" v-model="formNuevaVersion.nombre" class="mcas-input" :class="claseError('nombre')" maxlength="150" data-autofocus>
                  <small v-if="erroresForm.nombre" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.nombre }}</small>
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-version-desde">
                    Se aplica desde <span class="required-asterisk">*</span>
                    <i class="fas fa-info-circle help-icon" title="Primer día en que se usará. Al activarla, la versión anterior se cierra el día antes."></i>
                  </label>
                  <input id="mcas-version-desde" v-model="formNuevaVersion.vigenciaDesde" type="date" class="mcas-input" :class="claseError('vigenciaDesde')">
                  <small v-if="erroresForm.vigenciaDesde" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ erroresForm.vigenciaDesde }}</small>
                </div>
              </div>
            </section>
            <div class="mcas-alert mcas-alert--info">
              <i class="fas fa-lock"></i>
              <div>La nueva versión se crea en <strong>borrador</strong>. Cambie lo que necesite (importes, reglas) y pulse <strong>Activar</strong>: hasta entonces se sigue usando la versión actual.</div>
            </div>
          </div>
          <div class="mcas-modal-footer">
            <span class="footer-note"><span class="required-asterisk">*</span> Campos obligatorios</span>
            <div class="footer-actions">
              <button type="button" class="btn btn-cancel" @click="cerrarModales">
                <i class="fas fa-times"></i>
                <span>Cancelar</span>
              </button>
              <button type="submit" class="btn btn-save" :disabled="mutacionEnCurso">
                <i :class="mutacionEnCurso ? 'fas fa-spinner fa-spin' : 'fas fa-code-branch'"></i>
                <span>Crear versión</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Activar una tabla de comisiones: comprobación, cambios y avisos -->
    <div v-if="modalActivacion" class="mcas-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="mcas-modal-activar-titulo" @click.self="cerrarModales">
      <div class="mcas-modal mcas-modal--ancho">
        <div class="mcas-modal-header aura-modal-header">
          <div class="mcas-modal-title">
            <div class="mcas-modal-icon"><i class="fas fa-power-off"></i></div>
            <div class="title-text">
              <h2 id="mcas-modal-activar-titulo">Activar tabla de comisiones</h2>
              <p>{{ nombreConjunto(activacion.conjunto) }} · {{ nombreComercializadora(activacion.conjunto?.idComercializadora) }}</p>
            </div>
          </div>
          <button type="button" class="close-button" title="Cerrar" aria-label="Cerrar" @click="cerrarModales">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="mcas-modal-body">
          <div class="detalle-stack">
            <div class="mcas-alert mcas-alert--info">
              <i class="fas fa-info-circle"></i>
              <div>
                Al activar, en un solo paso, se comprueba la tabla, se cierra la versión anterior de la comercializadora el día antes
                y la tabla pasa a usarse en el cálculo automático desde el {{ formatFechaCorta(activacion.conjunto?.vigenciaDesde) || 'día de inicio' }}.
              </div>
            </div>
            <div v-if="activacionBloqueadaIndexado" class="mcas-alert mcas-alert--warning">
              <i class="fas fa-lock"></i>
              <div>No se podrá activar mientras el interruptor Indexado esté apagado. Enciéndalo arriba, en «Interruptores del módulo», cuando la dirección apruebe la fase indexada.</div>
            </div>
            <div v-if="activacion.cargando" class="activacion-cargando" role="status">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Comprobando…</span>
            </div>
            <div v-else-if="activacion.error" class="mcas-alert mcas-alert--danger">
              <i class="fas fa-times-circle"></i>
              <div>
                {{ activacion.error }}
                <div class="activacion-acciones">
                  <button type="button" class="btn btn-refresh" @click="abrirActivacion(activacion.conjunto)">
                    <i class="fas fa-sync-alt"></i>
                    <span>Reintentar</span>
                  </button>
                </div>
              </div>
            </div>
            <template v-else-if="activacion.resultado">
              <div v-if="incidenciasActivacion.length" class="mcas-alert mcas-alert--danger">
                <i class="fas fa-times-circle"></i>
                <div class="activacion-incidencias">
                  <strong>Corrija lo siguiente antes de activar. Pulse cada punto para ir a la regla o a la celda:</strong>
                  <div v-for="g in incidenciasActivacion" :key="g.idRegla ?? 'tabla'" class="activacion-grupo">
                    <span class="activacion-grupo-titulo">{{ g.regla }}</span>
                    <ul>
                      <li v-for="(inc, k) in g.incidencias" :key="k">
                        <button v-if="inc.idRegla != null" type="button" class="enlace-pendiente" @click="irAIncidencia(inc)">{{ inc.mensaje }}</button>
                        <span v-else>{{ inc.mensaje }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div v-else class="mcas-alert mcas-alert--info activacion-ok">
                <i class="fas fa-check-circle"></i>
                <div>La comprobación es correcta: la tabla se puede activar.</div>
              </div>
              <section v-if="activacion.resultado.cambios && activacion.resultado.cambios.length" class="form-section">
                <div class="section-header"><i class="fas fa-exchange-alt"></i><h3>Qué cambiará al activar</h3></div>
                <ul class="activacion-lista">
                  <li v-for="(t, k) in activacion.resultado.cambios" :key="k">{{ t }}</li>
                </ul>
              </section>
              <div v-if="activacion.resultado.avisos && activacion.resultado.avisos.length" class="mcas-alert mcas-alert--warning">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                  <strong>Tenga en cuenta:</strong>
                  <ul>
                    <li v-for="(t, k) in activacion.resultado.avisos" :key="k">{{ t }}</li>
                  </ul>
                </div>
              </div>
            </template>
          </div>
        </div>
        <div class="mcas-modal-footer">
          <span class="footer-note"><i class="fas fa-shield-alt"></i> Solo se activa si la comprobación es correcta</span>
          <div class="footer-actions">
            <button type="button" class="btn btn-cancel" @click="cerrarModales">
              <i class="fas fa-times"></i>
              <span>Cancelar</span>
            </button>
            <button type="button" class="btn btn-save" :disabled="!puedeActivarAhora" @click="activarAhora">
              <i :class="activacion.activando ? 'fas fa-spinner fa-spin' : 'fas fa-power-off'"></i>
              <span>Activar ahora</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de importes en rejilla («Ver tabla») -->
    <McasMatrizEditor
      v-if="modalMatriz && reglaMatriz"
      :key="'matriz-' + reglaMatriz.id"
      :regla="reglaMatriz"
      :editable="conjuntoEditable"
      :orden-resaltado="ordenMatriz"
      @cerrar="cerrarMatriz"
      @guardado="onTablaGuardada"
      @vista-avanzada="irAVistaAvanzada"
    />
  </div>
</template>

<script>
import { compararValores } from '@/utils/orden'
import axios from 'axios'
import { COLORES_DIALOGO, confirmar, mostrarAviso, mostrarError, mostrarExito, textoError } from './mcasDialogs'
// En una sola línea: los tests cargan este <script> en Node (tests/unit/helpers/sfc.js) y solo reconocen import de una línea.
import { OPCIONES_CONDICION, TIPOS_LINEA, condicionesVacias, leerCondiciones, escribirCondiciones, normalizarCondiciones, validarCondiciones, calculoVacio, leerCalculo, escribirCalculo, validarCalculo, lineaVacia, leerPago, escribirPago, resumenRegla, resumenDeRegla, NOMBRES_METODO, aFactor, aPorcentaje } from './mcasReglas'
import { fechaLocalISO } from '@/utils/fechas'
import { comprobacionesModulo } from './mcasEstados'
import { estadoPorComercializadora, comprobacionActivacion, propuestaNuevaVersion, agruparIncidencias, nombreConjunto, nombreRegla } from './mcasActivacion'
import McasMatrizEditor from './McasMatrizEditor.vue'

const METODOS_CALCULO = [
  { value: 'FEE_PERCENTAGE',     corto: '% sobre FEE',      label: '% sobre el FEE del contrato (consumo × FEE × %)' },
  { value: 'RATE_PER_MWH',       corto: 'Tasa €/MWh',       label: 'Tasa por MWh (consumo × tasa)' },
  { value: 'FIXED_AMOUNT',       corto: 'Importe fijo',     label: 'Importe fijo' },
  { value: 'RANGE_LOOKUP',       corto: 'Tabla de rangos',  label: 'Tabla por tramos (una dimensión)' },
  { value: 'MATRIX_LOOKUP',      corto: 'Matriz 2D',        label: 'Matriz 2D (consumo × potencia)' },
  { value: 'MULTI_DIMENSION_LOOKUP', corto: 'Multidimensional', label: 'Matriz multidimensional (varias dimensiones)' },
  { value: 'COMPOSITE_SUM',      corto: 'Suma de líneas',   label: 'Suma de varias líneas' },
  { value: 'MANUAL',             corto: 'Revisión manual',  label: 'Revisión manual (no calcula)' },
  { value: 'NOT_COMMISSIONABLE', corto: 'No comisiona',     label: 'No comisiona (0 €)' },
]
const METODOS_TABLA = ['RANGE_LOOKUP', 'MATRIX_LOOKUP', 'MULTI_DIMENSION_LOOKUP']
const METODOS_CON_MOTIVO = ['MANUAL', 'NOT_COMMISSIONABLE']
const DIMENSIONES_TEXTO = ['tarifa_acceso', 'codigo_producto', 'segmento', 'tipo_suministro', 'zona_comision']
const CAMPOS_CONDICION = [
  'tipo_suministro', 'segmento', 'es_renovacion', 'tipo_renovacion', 'alta_nueva', 'tarifa_acceso', 'codigo_producto',
  'ambito', 'zona_comision', 'consumo_min_kwh', 'consumo_max_kwh', 'consumo_min_inclusivo', 'consumo_max_inclusivo',
  'consumo_min_mwh', 'consumo_max_mwh', 'consumo_min_mwh_inc', 'consumo_max_mwh_inc', 'potencia_min_kw', 'potencia_max_kw',
  'potencia_min_inc', 'potencia_max_inc',
]

const ESTADOS_CONJUNTO = [
  { value: 'BORRADOR',  label: 'Borrador',  tono: 'warning' },
  { value: 'VALIDADO',  label: 'Validado',  tono: 'info' },
  { value: 'PUBLICADO', label: 'Publicado', tono: 'success' },
  { value: 'ARCHIVADO', label: 'Archivado', tono: 'neutral' },
]
const FASES = [
  { value: 'FIJO', label: 'Fijo' },
  { value: 'INDEXADO', label: 'Indexado' },
  { value: 'AMBOS', label: 'Ambos' },
]
const TIPOS_PRECIO = FASES.filter(f => f.value !== 'AMBOS')
const SUMINISTROS = [
  { value: 'LUZ', label: 'Luz' },
  { value: 'GAS', label: 'Gas' },
]
const ACTIVO_INACTIVO = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
]
const SEGMENTOS = [
  { value: 'PYME', label: 'PYME' },
  { value: 'RESIDENCIAL', label: 'Residencial' },
]

// Retrocesión por baja anticipada (contrato /mcas/politicas-retrocesion). Informativa:
// la propuesta la muestra como «retrocesión potencial» y nunca se descuenta en el alta.
const METODOS_RETROCESION = [
  { value: 'PORCENTAJE', corto: 'Porcentaje', tono: 'success', label: 'Porcentaje de la comisión por tramos',
    ayuda: 'Según los días o meses que dure el contrato, se devolvería un porcentaje de la comisión.' },
  { value: 'FIJO', corto: 'Importe fijo', tono: 'info', label: 'Importe fijo por tramos',
    ayuda: 'Según los días o meses que dure el contrato, se devolvería un importe fijo en euros.' },
  { value: 'PRORRATEO', corto: 'Prorrateo', tono: 'primary', label: 'Prorrateo a 365 días',
    ayuda: 'Se devolvería la parte proporcional de la comisión según los días que falten para cumplir 365 desde la activación. No lleva tramos.' },
  { value: 'NO_APLICA', corto: 'No aplica', tono: 'neutral', label: 'No aplica retrocesión',
    ayuda: 'La comercializadora no reclama nada si el contrato causa baja anticipada. No lleva tramos.' },
]
const METODOS_SIN_TRAMOS = ['PRORRATEO', 'NO_APLICA']
const UNIDADES_TRAMO = [
  { value: 'MESES', label: 'Meses' },
  { value: 'DIAS', label: 'Días' },
]
// PORCENTAJE y FACTOR se guardan como factor (0.6) y se enseñan en % (60).
const TIPOS_VALOR_TRAMO = [
  { value: 'PORCENTAJE', label: 'Porcentaje', unidad: '%' },
  { value: 'FACTOR', label: 'Factor (en %)', unidad: '%' },
  { value: 'IMPORTE_FIJO', label: 'Importe (€)', unidad: '€' },
  { value: 'SIN_CONFIRMAR', label: 'Sin confirmar', unidad: '' },
]
const TIPOS_EN_PORCENTAJE = ['PORCENTAJE', 'FACTOR']
const ESTADOS_RETROCESION = [
  { value: 'BORRADOR', label: 'Borrador', tono: 'warning' },
  { value: 'PUBLICADO', label: 'Publicada', tono: 'success' },
  { value: 'ARCHIVADO', label: 'Archivada', tono: 'neutral' },
]

const ACLARACION_RETROCESION = 'Reservado para la fase 3 (aplicar retrocesiones en bajas): hoy no tiene efecto'
const FLAGS = [
  { codigo: 'MCAS_ENABLED', label: 'Módulo',
    descripcion: 'Cálculo automático de propuestas MCAS', efecto: 'el cálculo automático de propuestas MCAS' },
  { codigo: 'MCAS_FIXED_ENABLED', label: 'Precio fijo',
    descripcion: 'Cálculo para contratos a precio fijo', efecto: 'el cálculo para contratos a precio fijo' },
  { codigo: 'MCAS_INDEXED_ENABLED', label: 'Indexado',
    descripcion: 'Cálculo para contratos indexados (activar solo tras validar los fijos)', efecto: 'el cálculo para contratos indexados' },
  // La retrocesión potencial se asocia siempre (informativa): el indicador queda para aplicarla en bajas.
  { codigo: 'MCAS_RETROCESSION_ENABLED', label: 'Retrocesión',
    descripcion: ACLARACION_RETROCESION, aclaracion: ACLARACION_RETROCESION,
    efecto: 'el interruptor de retrocesión, reservado para la fase 3 (hoy no tiene efecto)' },
]

const TABS = [
  { id: 'conjuntos', label: 'Tablas de comisiones', icono: 'fas fa-layer-group',
    ayuda: 'Cada tabla de comisiones agrupa las reglas de una comercializadora para un periodo de vigencia. Solo las tablas activas se usan en el cálculo automático.' },
  { id: 'reglas', label: 'Reglas', icono: 'fas fa-list-ul',
    ayuda: 'Cada regla dice a qué contratos se aplica y cómo se calcula la comisión. A cada contrato le debe corresponder una sola regla de la tabla.' },
  { id: 'rangos', label: 'Vista avanzada', icono: 'fas fa-list',
    ayuda: 'Los tramos de la tabla de una regla, fila a fila, tal como los guarda el motor. Para cambiar importes es más cómodo «Ver tabla» en la lista de reglas.' },
  { id: 'productos', label: 'Productos', icono: 'fas fa-tags',
    ayuda: 'Ofertas y tarifas de cada comercializadora. El motor usa el código del producto para seleccionar la regla.' },
  { id: 'retrocesiones', label: 'Retrocesiones', icono: 'fas fa-undo-alt',
    ayuda: 'Qué parte de la comisión se devolvería si el contrato causa baja anticipada. Es informativa: la propuesta muestra la retrocesión potencial y nunca se descuenta en el alta.' },
]

// Columnas por pestaña: `valor` alimenta filtro y orden (salvo `orden` explícito).
const COLUMNAS = {
  conjuntos: [
    { key: 'nombre', label: 'Tabla de comisiones', icono: 'fas fa-layer-group', ancho: '20%', filtro: 'texto',
      valor: (c, vm) => [vm.nombreConjunto(c), c.codigo, c.version].filter(Boolean).join(' '), orden: (c, vm) => vm.nombreConjunto(c) },
    { key: 'comercializadora', label: 'Comercializadora', icono: 'fas fa-building', ancho: '17%', filtro: 'texto',
      valor: (c, vm) => [vm.nombreComercializadora(c.idComercializadora), vm.nombreGestora(c.idGestora)].filter(Boolean).join(' '),
      orden: (c, vm) => vm.nombreComercializadora(c.idComercializadora) },
    { key: 'fase', label: 'Fase', icono: 'fas fa-tag', ancho: '9%', filtro: 'select', opciones: FASES, valor: c => c.fasePrecio },
    { key: 'vigencia', label: 'Vigencia', icono: 'fas fa-calendar-alt', ancho: '17%', filtro: 'texto',
      valor: (c, vm) => vm.formatVigencia(c.vigenciaDesde, c.vigenciaHasta), orden: c => c.vigenciaDesde },
    { key: 'estado', label: 'Estado', icono: 'fas fa-tasks', ancho: '10%', filtro: 'select', opciones: ESTADOS_CONJUNTO, valor: c => c.estado },
    { key: 'origen', label: 'Origen', icono: 'fas fa-file-excel', ancho: '14%', filtro: 'texto',
      valor: c => [c.archivoOrigen, c.hojaOrigen].filter(Boolean).join(' ') },
  ],
  reglas: [
    { key: 'prioridad', label: 'Prioridad', icono: 'fas fa-sort-numeric-down', ancho: '9%', filtro: 'texto', valor: r => r.prioridad },
    { key: 'regla', label: 'Regla', icono: 'fas fa-list-ul', ancho: '62%', filtro: 'texto',
      valor: (r, vm) => [vm.nombreRegla(r), r.codigo, vm.resumenesReglas[r.id]?.aplica, vm.resumenesReglas[r.id]?.calcula]
        .filter(Boolean).join(' '),
      orden: (r, vm) => vm.nombreRegla(r) },
    { key: 'metodo', label: 'Método', icono: 'fas fa-calculator', ancho: '17%', filtro: 'select',
      opciones: METODOS_CALCULO.map(m => ({ value: m.value, label: m.corto })), valor: r => r.metodoCalculo },
  ],
  rangos: [
    { key: 'orden', label: 'Orden', icono: 'fas fa-sort-numeric-down', ancho: '9%', filtro: 'texto', valor: v => v.orden },
    { key: 'dimension', label: 'Dimensión', icono: 'fas fa-ruler-combined', ancho: '18%', filtro: 'texto', valor: v => v.dimension },
    { key: 'rango', label: 'Rango', icono: 'fas fa-arrows-alt-h', ancho: '26%', filtro: 'texto',
      valor: (v, vm) => vm.formatRango(v), orden: v => (v.valorMin != null && v.valorMin !== '' ? Number(v.valorMin) : null) },
    { key: 'categoria', label: 'Categoría', icono: 'fas fa-tag', ancho: '16%', filtro: 'texto', valor: v => v.valorCategoria },
    { key: 'resultado', label: 'Resultado', icono: 'fas fa-euro-sign', ancho: '17%', filtro: 'texto', alinear: 'derecha',
      valor: (v, vm) => vm.formatResultado(v), orden: v => Number(v.valorResultado) },
  ],
  productos: [
    { key: 'producto', label: 'Producto', icono: 'fas fa-tag', ancho: '24%', filtro: 'texto',
      valor: p => [p.nombre, p.codigo, p.codigoZona, p.codigoGo].filter(Boolean).join(' '), orden: p => p.nombre },
    { key: 'comercializadora', label: 'Comercializadora', icono: 'fas fa-building', ancho: '19%', filtro: 'select',
      opciones: vm => vm.opcionesComercializadoraProductos, valor: p => String(p.idComercializadora),
      orden: (p, vm) => vm.nombreComercializadora(p.idComercializadora) },
    { key: 'tipoPrecio', label: 'Precio', icono: 'fas fa-euro-sign', ancho: '9%', filtro: 'select', opciones: TIPOS_PRECIO, valor: p => p.tipoPrecio },
    { key: 'suministro', label: 'Suministro', icono: 'fas fa-bolt', ancho: '10%', filtro: 'select', opciones: SUMINISTROS, valor: p => p.tipoSuministro },
    { key: 'vigencia', label: 'Vigencia', icono: 'fas fa-calendar-alt', ancho: '16%', filtro: 'texto',
      valor: (p, vm) => vm.formatVigencia(p.activoDesde, p.activoHasta), orden: p => p.activoDesde },
    { key: 'estado', label: 'Estado', icono: 'fas fa-toggle-on', ancho: '9%', filtro: 'select', opciones: ACTIVO_INACTIVO, valor: p => String(!!p.activo) },
  ],
  retrocesiones: [
    { key: 'comercializadora', label: 'Comercializadora', icono: 'fas fa-building', ancho: '19%', filtro: 'select',
      opciones: vm => vm.opcionesComercializadoraRetrocesiones, valor: p => String(p.idComercializadora),
      orden: (p, vm) => vm.nombreComercializadoraPolitica(p) },
    { key: 'segmento', label: 'Segmento', icono: 'fas fa-users', ancho: '10%', filtro: 'select', opciones: SEGMENTOS, valor: p => p.segmento },
    { key: 'suministro', label: 'Suministro', icono: 'fas fa-bolt', ancho: '10%', filtro: 'select', opciones: SUMINISTROS, valor: p => p.tipoSuministro },
    { key: 'tarifa', label: 'Tarifa', icono: 'fas fa-plug', ancho: '8%', filtro: 'texto', valor: p => p.tarifaAcceso },
    { key: 'metodo', label: 'Método', icono: 'fas fa-calculator', ancho: '11%', filtro: 'select',
      opciones: METODOS_RETROCESION.map(m => ({ value: m.value, label: m.corto })), valor: p => p.metodo },
    { key: 'resumen', label: 'Resumen', icono: 'fas fa-align-left', ancho: '23%', filtro: 'texto', ordenable: false,
      valor: p => [p.resumen, p.descripcion].filter(Boolean).join(' ') },
    { key: 'estado', label: 'Estado', icono: 'fas fa-tasks', ancho: '9%', filtro: 'select', opciones: ESTADOS_RETROCESION, valor: p => p.estado },
  ],
}

function filtrosIniciales() {
  return Object.fromEntries(Object.entries(COLUMNAS).map(([tab, cols]) =>
    [tab, Object.fromEntries(cols.filter(c => c.filtro).map(c => [c.key, '']))]))
}


// El motor y la validación del conjunto exigen objetos JSON ({...}), no listas ni valores sueltos.
function jsonValido(texto) {
  if (!texto || !String(texto).trim()) return true
  try {
    const valor = JSON.parse(texto)
    return !!valor && typeof valor === 'object' && !Array.isArray(valor)
  } catch {
    return false
  }
}

function escaparHtml(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

/** Lo que, si cambia, obliga a volver a pedir las reglas de una tabla para el panel. */
function firmaPanel(c) {
  return [c?.estado, c?.vigenciaDesde, c?.vigenciaHasta, c?.version, c?.fechaAprobacion].map(v => v ?? '').join('|')
}

function activacionVacia(conjunto = null) {
  return { conjunto, cargando: false, resultado: null, error: '', activando: false }
}

function editorReglaVacio() {
  return {
    avanzado: false,
    condiciones: condicionesVacias(), condExtras: {},
    calculo: calculoVacio(), calcExtras: {},
    numeroPagos: '', pagoExtras: {},
  }
}

const RESULTADOS_SIMULACION = {
  CALCULADO: { label: 'Calculada', tono: 'success', explicacion: 'Observaciones del cálculo:' },
  REQUIERE_DATOS: { label: 'Faltan datos', tono: 'warning', explicacion: 'Al contrato le faltan datos para calcular:' },
  REQUIERE_REVISION_MANUAL: { label: 'Revisión manual', tono: 'warning', explicacion: 'La propuesta quedaría en revisión manual:' },
  NO_COMISIONABLE: { label: 'No comisionable', tono: 'neutral', explicacion: 'La propuesta se cerraría como no comisionable:' },
  ERROR_CALCULO: { label: 'Error de cálculo', tono: 'danger', explicacion: 'La configuración no permite calcular:' },
}

function esVacio(v) {
  return v === null || v === undefined || String(v).trim() === ''
}

// ---- Políticas de retrocesión: servidor ⇄ formulario ----
function tramoVacio(metodo, anterior = null) {
  return {
    id: null,
    unidad: anterior?.unidad || 'MESES',
    // Un tramo nuevo empieza donde acaba el anterior.
    desde: anterior ? (esVacio(anterior.hasta) ? '' : anterior.hasta) : 0,
    hasta: '',
    desdeInclusivo: true,
    hastaInclusivo: false,
    valor: '',
    tipoValor: metodo === 'FIJO' ? 'IMPORTE_FIJO' : 'PORCENTAJE',
    revisarValor: false,
  }
}

function tramoAFormulario(t) {
  return {
    id: t.id ?? null,
    unidad: t.unidad || 'MESES',
    desde: t.desdeValor ?? '',
    hasta: t.hastaValor ?? '',
    desdeInclusivo: t.desdeInclusivo !== false,
    hastaInclusivo: t.hastaInclusivo === true,
    // Un valor sin confirmar se enseña tal cual: no se sabe si es %, factor o €.
    valor: TIPOS_EN_PORCENTAJE.includes(t.tipoValor) ? aPorcentaje(t.valor) : (t.valor ?? ''),
    tipoValor: t.tipoValor || 'PORCENTAJE',
    // Solo del formulario (no viaja): avisa al pasar de «Sin confirmar» a un tipo en %.
    revisarValor: false,
  }
}

function tramoAPayload(t, indice) {
  return {
    id: t.id ?? null,
    unidad: t.unidad,
    desdeValor: Number(t.desde),
    hastaValor: esVacio(t.hasta) ? null : Number(t.hasta),
    desdeInclusivo: !!t.desdeInclusivo,
    hastaInclusivo: !!t.hastaInclusivo,
    valor: TIPOS_EN_PORCENTAJE.includes(t.tipoValor) ? aFactor(t.valor) : Number(t.valor),
    tipoValor: t.tipoValor,
    prioridad: indice + 1,
  }
}

function politicaAFormulario(p) {
  if (!p) {
    return {
      id: null, codigo: '', version: '1.0', idComercializadora: '', idGestora: null, vigenciaDesde: '', vigenciaHasta: '',
      tipoSuministro: '', segmento: '', tarifaAcceso: '', metodo: 'PORCENTAJE', limiteImportePagado: true, descripcion: '',
      estado: 'BORRADOR', tramos: [tramoVacio('PORCENTAJE')],
    }
  }
  const prioridad = (t) => (t.prioridad ?? Number.MAX_SAFE_INTEGER)
  return {
    id: p.id ?? null,
    codigo: p.codigo || '',
    version: p.version ?? '',
    idComercializadora: p.idComercializadora ?? '',
    idGestora: p.idGestora ?? null,
    vigenciaDesde: p.vigenciaDesde || '',
    vigenciaHasta: p.vigenciaHasta || '',
    tipoSuministro: p.tipoSuministro || '',
    segmento: p.segmento || '',
    tarifaAcceso: p.tarifaAcceso || '',
    metodo: p.metodo || 'PORCENTAJE',
    limiteImportePagado: p.limiteImportePagado !== false,
    descripcion: p.descripcion || '',
    estado: p.estado || 'BORRADOR',
    tramos: [...(p.tramos || [])].sort((a, b) => prioridad(a) - prioridad(b)).map(tramoAFormulario),
  }
}

/** Solo los campos de McasPoliticaRetrocesionDTO que decide el usuario (sin nombres, resumen ni estado). */
function politicaAPayload(f) {
  const nulo = (v) => (esVacio(v) ? null : v)
  return {
    id: f.id ?? null,
    codigo: String(f.codigo ?? '').trim(),
    idComercializadora: f.idComercializadora,
    idGestora: nulo(f.idGestora),
    version: String(f.version ?? '').trim(),
    vigenciaDesde: f.vigenciaDesde,
    vigenciaHasta: nulo(f.vigenciaHasta),
    tipoSuministro: nulo(f.tipoSuministro),
    segmento: nulo(f.segmento),
    tarifaAcceso: nulo(f.tarifaAcceso),
    metodo: f.metodo,
    limiteImportePagado: !!f.limiteImportePagado,
    descripcion: nulo(String(f.descripcion ?? '').trim()),
    tramos: METODOS_SIN_TRAMOS.includes(f.metodo) ? [] : (f.tramos || []).map(tramoAPayload),
  }
}

function validarTramo(t, prefijo) {
  const errores = {}
  const enteroNoNegativo = (v) => !esVacio(v) && Number.isInteger(Number(v)) && Number(v) >= 0
  if (esVacio(t.unidad)) errores[`${prefijo}.unidad`] = 'Elija la unidad (meses o días)'
  if (!enteroNoNegativo(t.desde)) errores[`${prefijo}.desde`] = '«Desde» debe ser un número entero mayor o igual que 0'
  if (!esVacio(t.hasta)) {
    if (!enteroNoNegativo(t.hasta)) errores[`${prefijo}.hasta`] = '«Hasta» debe ser un número entero mayor o igual que 0'
    else if (enteroNoNegativo(t.desde) && Number(t.hasta) <= Number(t.desde)) errores[`${prefijo}.hasta`] = '«Hasta» debe ser mayor que «desde»'
  }
  const valor = Number(t.valor)
  if (esVacio(t.valor) || !Number.isFinite(valor) || valor < 0) errores[`${prefijo}.valor`] = 'Indique el valor (un número mayor o igual que 0)'
  else if (TIPOS_EN_PORCENTAJE.includes(t.tipoValor) && valor > 100) errores[`${prefijo}.valor`] = 'El porcentaje debe estar entre 0 y 100'
  if (esVacio(t.tipoValor)) errores[`${prefijo}.tipoValor`] = 'Elija el tipo de valor'
  return errores
}

export default {
  name: 'McasAdminComponent',
  components: { McasMatrizEditor },
  data() {
    return {
      tabs: TABS,
      tabActivo: 'conjuntos',
      metodosCalculo: METODOS_CALCULO,
      fases: FASES,
      tiposPrecio: TIPOS_PRECIO,
      suministros: SUMINISTROS,
      segmentos: SEGMENTOS,
      metodosRetrocesion: METODOS_RETROCESION,
      unidadesTramo: UNIDADES_TRAMO,
      tiposValorTramo: TIPOS_VALOR_TRAMO,
      camposCondicion: CAMPOS_CONDICION.join(', '),
      opcionesCondicion: OPCIONES_CONDICION,
      tiposLinea: TIPOS_LINEA,
      tarifasLuz: [],
      tarifasGas: [],
      comercializadoras: [],
      gestoras: [],
      // Administración › Productos y Pago Plazos (los usa el servicio de comisión)
      productosServicio: [],
      pagosPlazos: [],
      // Indicadores del módulo
      featureFlags: [],
      flagsError: false,
      flagEnCurso: null,
      // Datos por pestaña
      conjuntosReglas: [],
      cargandoConjuntos: false,
      errorConjuntos: false,
      conjuntoParaReglasId: null,
      reglasConjunto: [],
      cargandoReglas: false,
      errorReglas: false,
      reglaParaRangosId: null,
      valoresRango: [],
      cargandoRangos: false,
      errorRangos: false,
      productos: [],
      cargandoProductos: false,
      errorProductos: false,
      politicasRetrocesion: [],
      cargandoRetrocesiones: false,
      errorRetrocesiones: false,
      reglasRequestId: 0,
      rangosRequestId: 0,
      // Tabla
      filtros: filtrosIniciales(),
      orden: { conjuntos: {}, reglas: { key: 'prioridad', dir: 'asc' }, rangos: { key: 'orden', dir: 'asc' }, productos: {}, retrocesiones: {} },
      currentPage: 1,
      recordsPerPage: 10,
      // Modales
      modalProducto: false,
      formProducto: {},
      modalConjunto: false,
      formConjunto: {},
      modalRegla: false,
      formRegla: {},
      editorRegla: editorReglaVacio(),
      modalSimulacion: false,
      simulacion: { referencia: '', cargando: false, resultado: null },
      modalRango: false,
      formRango: {},
      modalRetrocesion: false,
      formRetrocesion: politicaAFormulario(null),
      soloLecturaRetrocesion: false,
      soloLecturaRegla: false,
      erroresForm: {},
      mutacionEnCurso: false,
      // Estado por comercializadora (reglas de cada tabla, para los datos pendientes).
      // Las firmas evitan volver a pedir tablas sin cambios; el contador descarta respuestas
      // viejas y las marcas protegen lo que trae «Reglas» mientras el panel está cargando.
      reglasPorConjunto: {},
      reglasPanelRequestId: 0,
      reglasPanelFirmas: {},
      reglasPanelSecuencia: 0,
      reglasPanelMarcas: {},
      panelComercializadoras: true,
      // Activación, nueva versión y menú «Más acciones»
      seleccionActivar: [],
      menuConjunto: null,
      estiloMenu: {},
      modalActivacion: false,
      activacion: activacionVacia(),
      modalNuevaVersion: false,
      formNuevaVersion: {},
      // Tabla de importes en rejilla («Ver tabla»)
      modalMatriz: false,
      reglaMatriz: null,
      ordenMatriz: null,
    }
  },
  computed: {
    conjuntoParaReglas() {
      return this.conjuntosReglas.find(c => c.id === this.conjuntoParaReglasId) || null
    },
    reglaParaRangos() {
      return this.reglasConjunto.find(r => r.id === this.reglaParaRangosId) || null
    },
    conjuntoEditable() {
      return this.conjuntoParaReglas?.estado === 'BORRADOR'
    },
    conjuntoActivable() {
      return this.esActivable(this.conjuntoParaReglas)
    },
    indexadoActivo() {
      return this.featureFlags.some(f => f.codigo === 'MCAS_INDEXED_ENABLED' && f.activo === true)
    },
    avisoFaseIndexada() {
      return !!this.formConjunto.fasePrecio && this.formConjunto.fasePrecio !== 'FIJO' && !this.indexadoActivo
    },
    // ---- estado por comercializadora y pendientes (bloque E) ----
    estadoComercializadoras() {
      return estadoPorComercializadora({
        conjuntos: this.conjuntosReglas,
        comercializadoras: this.comercializadoras,
        politicas: this.politicasRetrocesion,
        reglasPorConjunto: this.reglasPorConjunto,
        hoy: fechaLocalISO(),
        indexadoActivo: this.indexadoActivo,
      })
    },
    comercializadorasConTabla() {
      return this.estadoComercializadoras.filter(f => f.estado !== 'SIN_TABLA' || f.pendientes.some(p => p.tipo !== 'sin-tabla'))
    },
    comercializadorasSinTabla() {
      return this.estadoComercializadoras.filter(f => f.estado === 'SIN_TABLA' && f.pendientes.every(p => p.tipo === 'sin-tabla'))
    },
    resumenComercializadoras() {
      const filas = this.estadoComercializadoras
      const activas = filas.filter(f => f.estado === 'ACTIVA').length
      const porActivar = filas.filter(f => f.pendienteActivar).length
      const sinTabla = filas.filter(f => f.estado === 'SIN_TABLA').length
      const marcas = filas.reduce((n, f) => n + f.pendientes.length, 0)
      const partes = [activas === 1 ? '1 activa' : `${activas} activas`]
      if (porActivar) partes.push(porActivar === 1 ? '1 pendiente de activar' : `${porActivar} pendientes de activar`)
      if (sinTabla) partes.push(`${sinTabla} sin tabla`)
      partes.push(marcas === 1 ? '1 dato pendiente de confirmar' : `${marcas} datos pendientes de confirmar`)
      return partes.join(' · ')
    },
    // ---- activación ----
    idsSeleccionados() {
      const activables = new Set(this.conjuntosReglas.filter(c => this.esActivable(c)).map(c => c.id))
      return this.seleccionActivar.filter(id => activables.has(id))
    },
    activablesPagina() {
      return this.tabActivo === 'conjuntos' ? this.filasPaginadas.filter(c => this.esActivable(c)) : []
    },
    todasSeleccionadas() {
      return this.activablesPagina.length > 0 && this.activablesPagina.every(c => this.seleccionActivar.includes(c.id))
    },
    incidenciasActivacion() {
      return agruparIncidencias(this.activacion.resultado?.incidencias || [])
    },
    activacionBloqueadaIndexado() {
      const c = this.activacion.conjunto
      return !!c && !!c.fasePrecio && c.fasePrecio !== 'FIJO' && !this.indexadoActivo
    },
    puedeActivarAhora() {
      const r = this.activacion.resultado
      return !!r && r.puedeActivar === true && !this.incidenciasActivacion.length && !this.activacion.cargando
        && !this.activacion.activando && !this.activacionBloqueadaIndexado && !this.mutacionEnCurso
    },
    conjuntoNuevaVersion() {
      return this.conjuntosReglas.find(c => c.id === this.formNuevaVersion.idOrigen) || null
    },
    // ---- lista de reglas legible ----
    resumenesReglas() {
      return Object.fromEntries(this.reglasConjunto.map(r => [r.id, this.resumenFilaRegla(r)]))
    },
    tituloModalRegla() {
      if (this.soloLecturaRegla) return 'Regla de comisión'
      return this.formRegla.id ? 'Editar regla de comisión' : 'Nueva regla de comisión'
    },
    reglasLookup() {
      return this.reglasConjunto.filter(r => METODOS_TABLA.includes(r.metodoCalculo))
    },
    placeholderRegla() {
      if (!this.conjuntoParaReglas) return 'Seleccione antes una tabla de comisiones'
      return this.reglasLookup.length ? 'Seleccione una regla...' : 'La tabla no tiene reglas que busquen el importe en una tabla'
    },
    conjuntosPublicados() {
      return this.conjuntosReglas.filter(c => c.estado === 'PUBLICADO').length
    },
    productosActivos() {
      return this.productos.filter(p => p.activo).length
    },
    retrocesionesPublicadas() {
      return this.politicasRetrocesion.filter(p => p.estado === 'PUBLICADO').length
    },
    opcionesComercializadoraRetrocesiones() {
      const opciones = new Map()
      for (const p of this.politicasRetrocesion) {
        if (p.idComercializadora != null && !opciones.has(String(p.idComercializadora))) {
          opciones.set(String(p.idComercializadora), this.nombreComercializadoraPolitica(p))
        }
      }
      return [...opciones].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, 'es'))
    },
    usaTramosRetrocesion() {
      return !METODOS_SIN_TRAMOS.includes(this.formRetrocesion.metodo)
    },
    tituloModalRetrocesion() {
      if (this.soloLecturaRetrocesion) return 'Política de retrocesión'
      return this.formRetrocesion.id ? 'Editar política de retrocesión' : 'Nueva política de retrocesión'
    },
    opcionesTarifaRetrocesion() {
      const suministro = this.formRetrocesion.tipoSuministro
      const nombres = [
        ...(suministro !== 'GAS' ? this.tarifasLuz : []),
        ...(suministro !== 'LUZ' ? this.tarifasGas : []),
      ].map(t => t.nombre).filter(n => n && n !== 'Sin Tarifa')
      const unicos = [...new Set(nombres)]
      const actual = this.formRetrocesion.tarifaAcceso
      if (actual && !unicos.includes(actual)) unicos.push(actual)
      return unicos.map(n => ({ value: n, label: n }))
    },
    estadoModulo() {
      // «Listo» exige además que ninguna comercializadora tenga un borrador sin versión vigente.
      return [
        ...comprobacionesModulo({
          flags: this.featureFlags,
          conjuntos: this.conjuntosReglas,
          productosServicio: this.productosServicio,
          pagosPlazos: this.pagosPlazos,
          hoy: fechaLocalISO(),
          nombreComercializadora: (id) => this.nombreComercializadora(id),
        }),
        comprobacionActivacion(this.estadoComercializadoras),
      ]
    },
    moduloListo() {
      return this.estadoModulo.every(c => c.ok)
    },
    flagsVista() {
      return FLAGS.map(f => {
        const flag = this.featureFlags.find(x => x.codigo === f.codigo)
        const descripcion = flag?.descripcion || f.descripcion
        // Si el servidor trae su propia descripción, la aclaración va debajo como ayuda secundaria.
        const ayuda = f.aclaracion && descripcion !== f.aclaracion ? `${descripcion}\n${f.aclaracion}` : descripcion
        return { ...f, descripcion, ayuda, activo: !!flag?.activo, disponible: !!flag }
      })
    },
    opcionesComercializadoraProductos() {
      const ids = [...new Set(this.productos.map(p => p.idComercializadora).filter(id => id != null))]
      return ids
        .map(id => ({ value: String(id), label: this.nombreComercializadora(id) }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es'))
    },
    // ---- tabla de la pestaña activa ----
    columnasActivas() {
      return COLUMNAS[this.tabActivo]
    },
    columnasTotales() {
      return this.columnasActivas.length + 1 + (this.tabActivo === 'conjuntos' ? 1 : 0)
    },
    filtrosActivos() {
      return this.filtros[this.tabActivo]
    },
    filasTab() {
      switch (this.tabActivo) {
        case 'conjuntos': return this.conjuntosReglas
        case 'reglas': return this.conjuntoParaReglas ? this.reglasConjunto : []
        case 'rangos': return this.reglaParaRangos ? this.valoresRango : []
        case 'retrocesiones': return this.politicasRetrocesion
        default: return this.productos
      }
    },
    cargandoTab() {
      return {
        conjuntos: this.cargandoConjuntos, reglas: this.cargandoReglas, rangos: this.cargandoRangos,
        productos: this.cargandoProductos, retrocesiones: this.cargandoRetrocesiones,
      }[this.tabActivo]
    },
    errorTab() {
      return {
        conjuntos: this.errorConjuntos, reglas: this.errorReglas, rangos: this.errorRangos,
        productos: this.errorProductos, retrocesiones: this.errorRetrocesiones,
      }[this.tabActivo]
    },
    filasFiltradas() {
      const activos = this.columnasActivas.filter(c => c.filtro && String(this.filtrosActivos[c.key] || '').trim())
      if (!activos.length) return this.filasTab
      return this.filasTab.filter(fila => activos.every(col => {
        const filtro = String(this.filtrosActivos[col.key]).trim()
        const valor = col.valor(fila, this)
        if (col.filtro === 'select') return String(valor ?? '') === filtro
        return String(valor ?? '').toLowerCase().includes(filtro.toLowerCase())
      }))
    },
    filasOrdenadas() {
      const { key, dir } = this.orden[this.tabActivo]
      const col = key && this.columnasActivas.find(c => c.key === key)
      if (!col || !dir) return this.filasFiltradas
      const obtener = col.orden || col.valor
      const signo = dir === 'asc' ? 1 : -1
      return [...this.filasFiltradas].sort((a, b) => compararValores(obtener(a, this), obtener(b, this)) * signo)
    },
    filasPaginadas() {
      const start = (this.currentPage - 1) * this.recordsPerPage
      return this.filasOrdenadas.slice(start, start + this.recordsPerPage)
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filasFiltradas.length / this.recordsPerPage))
    },
    paginationStart() {
      return this.filasFiltradas.length ? (this.currentPage - 1) * this.recordsPerPage + 1 : 0
    },
    paginationEnd() {
      return Math.min(this.currentPage * this.recordsPerPage, this.filasFiltradas.length)
    },
    estadoVacio() {
      const nombres = {
        conjuntos: 'las tablas de comisiones', reglas: 'las reglas de la tabla',
        rangos: 'los tramos de la tabla', productos: 'los productos comerciales',
        retrocesiones: 'las políticas de retrocesión',
      }
      if (this.errorTab) return { error: true, icono: 'fas fa-exclamation-triangle', texto: `No se pudieron cargar ${nombres[this.tabActivo]}` }
      if (this.tabActivo === 'reglas' && !this.conjuntoParaReglas) {
        return { icono: 'fas fa-layer-group', texto: 'Seleccione una tabla de comisiones',
          detalle: 'Elija una tabla en el selector superior o pulse «Ver reglas» en la pestaña Tablas de comisiones.' }
      }
      if (this.tabActivo === 'rangos' && !this.reglaParaRangos) {
        return { icono: 'fas fa-table', texto: 'Seleccione una regla que busque el importe en una tabla',
          detalle: 'La vista avanzada muestra, fila a fila, los tramos de esas reglas. Para cambiar importes es más cómodo «Ver tabla».' }
      }
      if (this.filasTab.length) return { icono: 'fas fa-search', texto: 'No se encontraron registros que coincidan con la búsqueda' }
      switch (this.tabActivo) {
        case 'conjuntos': return { icono: 'fas fa-layer-group', texto: 'Todavía no hay tablas de comisiones', crear: 'Crear primera tabla' }
        case 'reglas': return { icono: 'fas fa-list-ul', texto: 'Esta tabla aún no tiene reglas', crear: this.conjuntoEditable ? 'Crear primera regla' : null }
        case 'rangos': return { icono: 'fas fa-table', texto: 'Esta regla aún no tiene tramos', crear: this.conjuntoEditable ? 'Crear primera fila' : null }
        case 'retrocesiones': return { icono: 'fas fa-undo-alt', texto: 'Todavía no hay políticas de retrocesión', crear: 'Crear primera política' }
        default: return { icono: 'fas fa-tags', texto: 'Todavía no hay productos comerciales', crear: 'Crear primer producto' }
      }
    },
    // ---- formulario de regla / rango ----
    requiereMotivo() {
      return METODOS_CON_MOTIVO.includes(this.formRegla.metodoCalculo)
    },
    esMetodoTabla() {
      return METODOS_TABLA.includes(this.formRegla.metodoCalculo)
    },
    usaParametrosCalculo() {
      return !this.requiereMotivo && !this.esMetodoTabla
    },
    esDimensionTexto() {
      return DIMENSIONES_TEXTO.includes(String(this.formRango.dimension || '').trim())
    },
    // ---- editor visual de reglas ----
    productosDelConjunto() {
      const id = this.conjuntoParaReglas?.idComercializadora
      return this.productos.filter(p => p.idComercializadora === id)
    },
    opcionesProductoRegla() {
      const opciones = this.productosDelConjunto.map(p => ({
        value: p.codigo,
        label: `${p.nombre} (${p.codigo})${p.activo ? '' : ' · dado de baja'}`,
      }))
      const actual = this.editorRegla.condiciones.codigo_producto
      if (actual && !opciones.some(o => o.value === actual)) opciones.push({ value: actual, label: `${actual} (no está dado de alta)` })
      return opciones
    },
    opcionesTarifaRegla() {
      const suministro = this.editorRegla.condiciones.tipo_suministro
      const nombres = [
        ...(suministro !== 'GAS' ? this.tarifasLuz : []),
        ...(suministro !== 'LUZ' ? this.tarifasGas : []),
      ].map(t => t.nombre).filter(Boolean)
      const unicos = [...new Set(nombres)]
      const actual = this.editorRegla.condiciones.tarifa_acceso
      if (actual && !unicos.includes(actual)) unicos.push(actual)
      return unicos.map(n => ({ value: n, label: n }))
    },
    nombreProductoRegla() {
      const codigo = this.editorRegla.condiciones.codigo_producto
      return this.productosDelConjunto.find(p => p.codigo === codigo)?.nombre || null
    },
    resumenReglaActual() {
      return resumenRegla({
        metodo: this.formRegla.metodoCalculo,
        condiciones: this.editorRegla.condiciones,
        calculo: this.editorRegla.calculo,
        motivo: this.formRegla.motivoManual,
        numeroPagos: this.editorRegla.numeroPagos,
        nombreProducto: this.nombreProductoRegla,
      })
    },
    clavesAvanzadas() {
      const e = this.editorRegla
      return [...Object.keys(e.condExtras), ...Object.keys(e.calcExtras), ...Object.keys(e.pagoExtras)].join(', ')
    },
    hayCondicionesAvanzadas() {
      return this.clavesAvanzadas.length > 0
    },
    // ---- prueba con un contrato ----
    datosSimulacion() {
      const d = this.simulacion.resultado?.datosContrato
      if (!d || !Object.keys(d).length) return []
      const siNo = v => (v === true ? 'Sí' : v === false ? 'No' : v)
      const conUnidad = (v, unidad) => (v === null || v === undefined ? null : `${this.formatNumero(v)} ${unidad}`)
      const filas = [
        ['Tipo de precio', d.tipoPrecio], ['Tipo de suministro', d.tipoSuministro], ['Segmento', d.segmento],
        ['¿Es renovación?', siNo(d.esRenovacion)], ['Tipo de renovación', d.tipoRenovacion], ['Alta nueva', siNo(d.altaNueva)],
        ['Ámbito', d.ambito], ['Zona de comisión', d.zonaComision], ['Producto comercial', d.codigoProducto],
        ['Tarifa de acceso', d.tarifaAcceso], ['Consumo anual', conUnidad(d.consumoKwh, 'kWh')],
        ['FEE del contrato', conUnidad(d.feeEurMwh, '€/MWh')], ['Potencia de cálculo', conUnidad(d.potenciaKw, 'kW')],
        ['Nº de pagos del contrato', d.numeroPagos], ['Fecha de inicio', this.formatFechaCorta(d.fechaInicio)],
      ]
      return filas.map(([etiqueta, valor]) => ({ etiqueta, valor: esVacio(valor) ? 'Sin informar' : valor }))
    },
  },
  watch: {
    tabActivo() {
      this.currentPage = 1
      this.cerrarMenu()
    },
    filtros: { handler() { this.currentPage = 1 }, deep: true },
    recordsPerPage() { this.currentPage = 1 },
    totalPages(val) {
      if (this.currentPage > val) this.currentPage = val
    },
    // Una vez mostrado un error, la validación se reevalúa en vivo al corregir.
    formProducto: { handler() { this.revalidar(this.modalProducto, this.validarProducto) }, deep: true },
    formConjunto: { handler() { this.revalidar(this.modalConjunto, this.validarConjunto) }, deep: true },
    formRegla: { handler() { this.revalidar(this.modalRegla, this.validarRegla) }, deep: true },
    formRango: { handler() { this.revalidar(this.modalRango, this.validarRango) }, deep: true },
    formRetrocesion: { handler() { this.revalidar(this.modalRetrocesion, this.validarRetrocesion) }, deep: true },
    formNuevaVersion: { handler() { this.revalidar(this.modalNuevaVersion, this.validarNuevaVersion) }, deep: true },
    editorRegla: { handler() { this.revalidar(this.modalRegla, this.validarRegla) }, deep: true },
  },
  async mounted() {
    document.addEventListener('keydown', this.onKeydown)
    // El menú «Más acciones» se pinta en <body>: se cierra al pulsar fuera, desplazar o cambiar el tamaño.
    document.addEventListener('click', this.cerrarMenu)
    window.addEventListener('scroll', this.cerrarMenu, true)
    window.addEventListener('resize', this.cerrarMenu)
    await Promise.all([
      this.cargarCatalogos(),
      this.cargarConjuntos({ silencioso: true }),
      this.cargarProductos({ silencioso: true }),
      this.cargarFeatureFlags(),
      // Su fallo se ve en «Estado del módulo» y en la pestaña, sin bloquear el resto.
      this.cargarRetrocesiones({ silencioso: true }),
    ])
    if (this.errorConjuntos || this.errorProductos || this.flagsError) {
      mostrarAviso(this.$swal, 'Error de carga',
        'No se pudieron cargar todos los datos de configuración MCAS. Algunas funcionalidades podrían no estar disponibles.')
    }
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onKeydown)
    document.removeEventListener('click', this.cerrarMenu)
    window.removeEventListener('scroll', this.cerrarMenu, true)
    window.removeEventListener('resize', this.cerrarMenu)
  },
  methods: {
    // -----------------------------------------------
    // Carga de datos
    // -----------------------------------------------
    async cargarCatalogos() {
      const [com, ges, luz, gas, prod, plazos] = await Promise.all([
        axios.get('/comercializadoras').catch(() => ({ data: [] })),
        axios.get('/gestoras').catch(() => ({ data: [] })),
        axios.get('/tarifas-luz').catch(() => ({ data: [] })),
        axios.get('/tarifas-gas').catch(() => ({ data: [] })),
        axios.get('/productos').catch(() => ({ data: [] })),
        axios.get('/pagos-plazos').catch(() => ({ data: [] })),
      ])
      this.comercializadoras = Array.isArray(com.data) ? com.data : []
      this.gestoras = Array.isArray(ges.data) ? ges.data : []
      this.tarifasLuz = Array.isArray(luz.data) ? luz.data : []
      this.tarifasGas = Array.isArray(gas.data) ? gas.data : []
      this.productosServicio = Array.isArray(prod.data) ? prod.data : []
      this.pagosPlazos = Array.isArray(plazos.data) ? plazos.data : []
    },
    async cargarFeatureFlags() {
      try {
        const { data } = await axios.get('/configuracion-modulos/mcas')
        this.featureFlags = Array.isArray(data) ? data : []
        this.flagsError = false
      } catch (e) {
        console.error('Error al cargar los interruptores MCAS:', e)
        this.featureFlags = []
        this.flagsError = true
      }
    },
    async cargarConjuntos({ silencioso = false, forzarPanel = false } = {}) {
      this.cargandoConjuntos = true
      try {
        const { data } = await axios.get('/mcas/conjuntos-reglas')
        this.conjuntosReglas = Array.isArray(data) ? data : []
        this.errorConjuntos = false
        if (this.conjuntoParaReglasId && !this.conjuntoParaReglas) this.limpiarSeleccionConjunto()
        this.cargarReglasPanel({ forzar: forzarPanel })
      } catch (e) {
        console.error('Error al cargar las tablas de comisiones MCAS:', e)
        this.errorConjuntos = true
        if (!silencioso) mostrarError(this.$swal, 'Error', textoError(e, 'No se pudieron cargar las tablas de comisiones.'))
      } finally {
        this.cargandoConjuntos = false
      }
    },
    async cargarProductos({ silencioso = false } = {}) {
      this.cargandoProductos = true
      try {
        const { data } = await axios.get('/mcas/productos-comerciales')
        this.productos = Array.isArray(data) ? data : []
        this.errorProductos = false
      } catch (e) {
        console.error('Error al cargar productos MCAS:', e)
        this.errorProductos = true
        if (!silencioso) mostrarError(this.$swal, 'Error', textoError(e, 'No se pudieron cargar los productos comerciales.'))
      } finally {
        this.cargandoProductos = false
      }
    },
    async cargarRetrocesiones({ silencioso = false } = {}) {
      this.cargandoRetrocesiones = true
      try {
        const { data } = await axios.get('/mcas/politicas-retrocesion')
        this.politicasRetrocesion = Array.isArray(data) ? data : []
        this.errorRetrocesiones = false
      } catch (e) {
        console.error('Error al cargar políticas de retrocesión MCAS:', e)
        this.errorRetrocesiones = true
        if (!silencioso) mostrarError(this.$swal, 'Error', textoError(e, 'No se pudieron cargar las políticas de retrocesión.'))
      } finally {
        this.cargandoRetrocesiones = false
      }
    },
    async cargarReglas({ silencioso = false } = {}) {
      const requestId = ++this.reglasRequestId
      const conjuntoId = this.conjuntoParaReglasId
      if (!conjuntoId) {
        this.reglasConjunto = []
        this.errorReglas = false
        this.cargandoReglas = false
        return
      }
      this.cargandoReglas = true
      try {
        const { data } = await axios.get(`/mcas/conjuntos-reglas/${conjuntoId}/reglas`)
        if (requestId !== this.reglasRequestId) return
        this.reglasConjunto = Array.isArray(data) ? data : []
        this.reglasPorConjunto = { ...this.reglasPorConjunto, [conjuntoId]: this.reglasConjunto }
        this.reglasPanelMarcas = { ...this.reglasPanelMarcas, [conjuntoId]: ++this.reglasPanelSecuencia }
        const conjunto = this.conjuntosReglas.find(c => c.id === conjuntoId)
        if (conjunto) this.reglasPanelFirmas = { ...this.reglasPanelFirmas, [conjuntoId]: firmaPanel(conjunto) }
        this.errorReglas = false
        if (this.reglaParaRangosId && !this.reglaParaRangos) {
          this.reglaParaRangosId = null
          this.valoresRango = []
        }
      } catch (e) {
        if (requestId !== this.reglasRequestId) return
        console.error('Error al cargar reglas MCAS:', e)
        this.errorReglas = true
        if (!silencioso) mostrarError(this.$swal, 'Error', textoError(e, 'No se pudieron cargar las reglas de la tabla.'))
      } finally {
        if (requestId === this.reglasRequestId) this.cargandoReglas = false
      }
    },
    async cargarRangos({ silencioso = false } = {}) {
      const requestId = ++this.rangosRequestId
      const reglaId = this.reglaParaRangosId
      if (!reglaId) {
        this.valoresRango = []
        this.errorRangos = false
        this.cargandoRangos = false
        return
      }
      this.cargandoRangos = true
      try {
        const { data } = await axios.get(`/mcas/reglas/${reglaId}/valores-rango`)
        if (requestId !== this.rangosRequestId) return
        this.valoresRango = Array.isArray(data) ? data : []
        this.errorRangos = false
      } catch (e) {
        if (requestId !== this.rangosRequestId) return
        console.error('Error al cargar los tramos de la tabla MCAS:', e)
        this.errorRangos = true
        if (!silencioso) mostrarError(this.$swal, 'Error', textoError(e, 'No se pudieron cargar los tramos de la tabla.'))
      } finally {
        if (requestId === this.rangosRequestId) this.cargandoRangos = false
      }
    },
    actualizarTab() {
      this.cargarFeatureFlags()
      switch (this.tabActivo) {
        case 'conjuntos': return this.cargarConjuntos({ forzarPanel: true })
        case 'reglas': return Promise.all([this.cargarConjuntos({ forzarPanel: true }), this.cargarReglas()])
        case 'rangos': return Promise.all([this.cargarConjuntos({ forzarPanel: true }), this.cargarReglas(), this.cargarRangos()])
        case 'retrocesiones': return this.cargarRetrocesiones()
        default: return this.cargarProductos()
      }
    },
    async toggleFeatureFlag(f, event) {
      // El interruptor no cambia hasta confirmar y guardar en el servidor.
      if (event?.target) event.target.checked = f.activo
      const activar = !f.activo
      let texto = `Se ${activar ? 'activará' : 'desactivará'} ${f.efecto}.`
      if (activar && f.codigo === 'MCAS_INDEXED_ENABLED') {
        texto = 'La fase INDEXADO solo debe activarse tras validar los contratos a precio fijo.'
      }
      const confirmado = await confirmar(this.$swal, {
        titulo: `¿${activar ? 'Activar' : 'Desactivar'} "${f.label}"?`,
        texto,
        textoConfirmar: activar ? 'Sí, activar' : 'Sí, desactivar',
        peligroso: !activar && f.codigo === 'MCAS_ENABLED',
        icono: activar && f.codigo !== 'MCAS_ENABLED' && f.codigo !== 'MCAS_FIXED_ENABLED' ? 'warning' : undefined,
      })
      if (!confirmado) return
      this.flagEnCurso = f.codigo
      try {
        await axios.post(`/configuracion-modulos/${f.codigo}/${activar ? 'activar' : 'desactivar'}`)
        await this.cargarFeatureFlags()
      } catch (e) {
        mostrarError(this.$swal, 'Error', textoError(e, 'No se pudo cambiar el interruptor.'))
      } finally {
        this.flagEnCurso = null
      }
    },

    // -----------------------------------------------
    // Selección de conjunto / regla
    // -----------------------------------------------
    seleccionarConjunto(c) {
      if (this.conjuntoParaReglasId === c.id) return
      this.conjuntoParaReglasId = c.id
      this.onCambioConjunto()
    },
    onCambioConjunto() {
      this.reglaParaRangosId = null
      this.valoresRango = []
      this.reglasConjunto = []
      this.cargarReglas()
    },
    limpiarSeleccionConjunto() {
      this.conjuntoParaReglasId = null
      this.reglaParaRangosId = null
      this.reglasConjunto = []
      this.valoresRango = []
    },
    verReglas(c) {
      if (this.conjuntoParaReglasId !== c.id) {
        this.conjuntoParaReglasId = c.id
        this.onCambioConjunto()
      }
      this.tabActivo = 'reglas'
    },
    verRangos(r) {
      if (this.reglaParaRangosId !== r.id) {
        this.reglaParaRangosId = r.id
        this.cargarRangos()
      }
      this.tabActivo = 'rangos'
    },

    // -----------------------------------------------
    // Tabla
    // -----------------------------------------------
    ordenarPor(key) {
      const actual = this.orden[this.tabActivo]
      if (actual.key !== key) {
        this.orden[this.tabActivo] = { key, dir: 'asc' }
      } else if (actual.dir === 'asc') {
        this.orden[this.tabActivo] = { key, dir: 'desc' }
      } else {
        this.orden[this.tabActivo] = {}
      }
    },
    iconoOrden(key) {
      const { key: actual, dir } = this.orden[this.tabActivo]
      if (actual !== key || !dir) return 'fas fa-sort'
      return dir === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'
    },
    opcionesColumna(col) {
      return typeof col.opciones === 'function' ? col.opciones(this) : col.opciones
    },
    contadorTab(id) {
      switch (id) {
        case 'conjuntos': return this.conjuntosReglas.length
        case 'reglas': return this.conjuntoParaReglas ? this.reglasConjunto.length : null
        case 'rangos': return this.reglaParaRangos ? this.valoresRango.length : null
        case 'retrocesiones': return this.politicasRetrocesion.length
        default: return this.productos.length
      }
    },
    crearEnTab() {
      switch (this.tabActivo) {
        case 'conjuntos': return this.abrirModalConjunto()
        case 'reglas': return this.abrirModalRegla()
        case 'rangos': return this.abrirModalRango()
        case 'retrocesiones': return this.abrirModalRetrocesion()
        default: return this.abrirModalProducto()
      }
    },

    // -----------------------------------------------
    // Modales
    // -----------------------------------------------
    abrirModal(nombre) {
      this.erroresForm = {}
      this[nombre] = true
      this.$nextTick(() => this.$refs.raiz?.querySelector('.mcas-modal [data-autofocus]')?.focus())
    },
    cerrarModales() {
      this.modalProducto = false
      this.modalConjunto = false
      this.modalRegla = false
      this.modalRango = false
      this.modalSimulacion = false
      this.modalRetrocesion = false
      this.modalNuevaVersion = false
      this.modalActivacion = false
      this.erroresForm = {}
      this.cerrarMenu()
    },
    onKeydown(e) {
      if (e.key !== 'Escape' || this.$swal.isVisible()) return
      if (this.menuConjunto !== null) {
        this.cerrarMenu()
        return
      }
      // La rejilla atiende su propio Escape (pregunta antes de perder cambios).
      if (this.modalMatriz) return
      if (this.modalProducto || this.modalConjunto || this.modalRegla || this.modalRango || this.modalSimulacion
        || this.modalRetrocesion || this.modalNuevaVersion || this.modalActivacion) {
        this.cerrarModales()
      }
    },
    claseError(campo) {
      return { 'input-error': !!this.erroresForm[campo] }
    },
    revalidar(abierto, validador) {
      if (abierto && Object.keys(this.erroresForm).length) this.erroresForm = validador()
    },
    aplicarValidacion(validador) {
      this.erroresForm = validador()
      const campos = Object.keys(this.erroresForm)
      if (!campos.length) return true
      this.$nextTick(() => this.$refs.raiz?.querySelector('.mcas-modal .input-error')?.focus())
      return false
    },

    // -----------------------------------------------
    // CRUD Productos
    // -----------------------------------------------
    abrirModalProducto(p = null) {
      this.formProducto = p
        ? { ...p }
        : { activo: true, tipoPrecio: 'FIJO', tipoSuministro: 'LUZ', idComercializadora: '', idGestora: null }
      this.abrirModal('modalProducto')
    },
    validarProducto() {
      const f = this.formProducto
      const errores = {}
      if (esVacio(f.idComercializadora)) errores.idComercializadora = 'Seleccione una comercializadora'
      if (esVacio(f.codigo)) errores.codigo = 'El código es obligatorio'
      if (esVacio(f.nombre)) errores.nombre = 'El nombre es obligatorio'
      if (f.activoDesde && f.activoHasta && f.activoHasta < f.activoDesde) errores.activoHasta = 'Debe ser posterior a la fecha de inicio'
      return errores
    },
    async guardarProducto() {
      if (this.mutacionEnCurso || !this.aplicarValidacion(this.validarProducto)) return
      const payload = { ...this.formProducto, codigo: this.formProducto.codigo.trim(), nombre: this.formProducto.nombre.trim() }
      this.mutacionEnCurso = true
      try {
        if (payload.id) {
          await axios.put(`/mcas/productos-comerciales/${payload.id}`, payload)
        } else {
          await axios.post('/mcas/productos-comerciales', payload)
        }
        this.cerrarModales()
        await this.cargarProductos()
        mostrarExito(this.$swal, 'Producto guardado', `El producto "${payload.nombre}" se ha guardado correctamente.`)
      } catch (e) {
        mostrarError(this.$swal, 'Error al guardar', textoError(e, 'No se pudo guardar el producto comercial.'))
      } finally {
        this.mutacionEnCurso = false
      }
    },
    async darDeBajaProducto(p) {
      if (this.mutacionEnCurso) return
      const confirmado = await confirmar(this.$swal, {
        titulo: '¿Dar de baja el producto?',
        texto: `"${p.nombre}" dejará de ofrecerse en los contratos. Podrá reactivarlo más adelante desde Editar.`,
        textoConfirmar: 'Sí, dar de baja',
        peligroso: true,
      })
      if (!confirmado) return
      this.mutacionEnCurso = true
      try {
        await axios.delete(`/mcas/productos-comerciales/${p.id}`)
        await this.cargarProductos()
        mostrarExito(this.$swal, 'Producto dado de baja', `El producto "${p.nombre}" se ha dado de baja.`)
      } catch (e) {
        mostrarError(this.$swal, 'Error al dar de baja', textoError(e, 'No se pudo dar de baja el producto comercial.'))
      } finally {
        this.mutacionEnCurso = false
      }
    },

    // -----------------------------------------------
    // CRUD Conjuntos
    // -----------------------------------------------
    abrirModalConjunto(c = null, valores = {}) {
      this.formConjunto = c
        ? { nombre: '', descripcion: '', ...c }
        : { nombre: '', descripcion: '', codigo: '', fasePrecio: 'FIJO', version: '1.0', idComercializadora: '', idGestora: null, ...valores }
      this.abrirModal('modalConjunto')
    },
    validarConjunto() {
      const f = this.formConjunto
      const errores = {}
      if (esVacio(f.nombre)) errores.nombre = 'Indique un nombre para la tabla'
      if (f.id && esVacio(f.codigo)) errores.codigo = 'Una tabla ya guardada necesita su código interno'
      if (esVacio(f.idComercializadora)) errores.idComercializadora = 'Seleccione una comercializadora'
      if (esVacio(f.vigenciaDesde)) errores.vigenciaDesde = 'Indique desde cuándo es vigente'
      if (f.vigenciaDesde && f.vigenciaHasta && f.vigenciaHasta < f.vigenciaDesde) errores.vigenciaHasta = 'Debe ser posterior a la fecha de inicio'
      return errores
    },
    async guardarConjunto() {
      if (this.mutacionEnCurso || !this.aplicarValidacion(this.validarConjunto)) return
      const f = this.formConjunto
      const payload = {
        ...f,
        nombre: String(f.nombre ?? '').trim(),
        descripcion: String(f.descripcion ?? '').trim() || null,
        // Vacío al crear: el servidor genera el código interno.
        codigo: String(f.codigo ?? '').trim() || null,
      }
      this.mutacionEnCurso = true
      try {
        if (payload.id) {
          await axios.put(`/mcas/conjuntos-reglas/${payload.id}`, payload)
        } else {
          await axios.post('/mcas/conjuntos-reglas', payload)
        }
        this.cerrarModales()
        await this.cargarConjuntos()
        mostrarExito(this.$swal, 'Tabla guardada', `La tabla de comisiones "${payload.nombre}" se ha guardado correctamente.`)
      } catch (e) {
        mostrarError(this.$swal, 'Error al guardar', textoError(e, 'No se pudo guardar la tabla de comisiones.'))
      } finally {
        this.mutacionEnCurso = false
      }
    },
    async cambiarEstadoConjunto(c, accion) {
      this.cerrarMenu()
      if (this.mutacionEnCurso) return
      const nombre = nombreConjunto(c)
      const acciones = {
        validar: {
          titulo: '¿Validar la tabla sin activarla?',
          texto: `"${nombre}" quedará validada: sus reglas ya no se podrán editar (salvo que vuelva a borrador) y todavía no se usará en el cálculo. Para usarla, pulse «Activar».`,
          confirmar: 'Sí, validar', estado: 'validada',
        },
        publicar: {
          titulo: '¿Publicar la tabla?',
          texto: `Las reglas de "${nombre}" pasarán a usarse en el cálculo automático de comisiones. «Activar» hace lo mismo y además comprueba la tabla y cierra la versión anterior.`,
          confirmar: 'Sí, publicar', estado: 'publicada', icono: 'warning',
        },
        'volver-borrador': {
          titulo: '¿Volver a borrador?',
          texto: `"${nombre}" se podrá editar de nuevo. Cuando esté lista, actívela otra vez.`,
          confirmar: 'Sí, volver a borrador', estado: 'en borrador',
        },
        archivar: {
          titulo: '¿Archivar la tabla?',
          texto: `"${nombre}" dejará de usarse en el cálculo automático de comisiones.`,
          confirmar: 'Sí, archivar', estado: 'archivada', icono: 'warning',
        },
      }[accion]
      const confirmado = await confirmar(this.$swal, {
        titulo: acciones.titulo, texto: acciones.texto, textoConfirmar: acciones.confirmar, icono: acciones.icono,
      })
      if (!confirmado) return
      this.mutacionEnCurso = true
      try {
        await axios.post(`/mcas/conjuntos-reglas/${c.id}/${accion}`)
        await this.cargarConjuntos()
        mostrarExito(this.$swal, 'Estado actualizado', `La tabla "${nombre}" está ahora ${acciones.estado}.`)
      } catch (e) {
        mostrarError(this.$swal, 'Error', textoError(e, 'No se pudo cambiar el estado de la tabla.'))
      } finally {
        this.mutacionEnCurso = false
      }
    },
    async eliminarConjunto(c) {
      this.cerrarMenu()
      if (this.mutacionEnCurso) return
      const nombre = nombreConjunto(c)
      const confirmado = await confirmar(this.$swal, {
        titulo: '¿Eliminar la tabla?',
        texto: `Se eliminará "${nombre}" y todas sus reglas. Esta acción no se puede deshacer.`,
        textoConfirmar: 'Sí, eliminar',
        peligroso: true,
      })
      if (!confirmado) return
      this.mutacionEnCurso = true
      try {
        await axios.delete(`/mcas/conjuntos-reglas/${c.id}`)
        if (this.conjuntoParaReglasId === c.id) this.limpiarSeleccionConjunto()
        this.seleccionActivar = this.seleccionActivar.filter(id => id !== c.id)
        await this.cargarConjuntos()
        mostrarExito(this.$swal, 'Tabla eliminada', `La tabla "${nombre}" se ha eliminado.`)
      } catch (e) {
        mostrarError(this.$swal, 'Error al eliminar', textoError(e, 'No se pudo eliminar la tabla de comisiones.'))
      } finally {
        this.mutacionEnCurso = false
      }
    },

    async cerrarVigenciaConjunto(c) {
      this.cerrarMenu()
      if (this.mutacionEnCurso) return
      const hoy = fechaLocalISO()
      const nombreHtml = c.nombre ? `${escaparHtml(c.nombre)} (${escaparHtml(c.codigo)})` : escaparHtml(c.codigo)
      const { isConfirmed, value: hasta } = await this.$swal.fire({
        title: '¿Cerrar la vigencia de la tabla?',
        html: `
          <div class="swal-accion-contenedor">
            <div class="swal-accion-caja">
              <p class="swal-accion-caja-texto">La tabla <strong>${nombreHtml}</strong> se seguirá aplicando a los contratos que empiecen hasta el día indicado (incluido). Desde el día siguiente podrá aplicarse la nueva versión.</p>
            </div>
            <label for="swal-vigencia-hasta" class="swal-accion-label">
              <i class="fas fa-calendar-alt"></i>
              Último día de vigencia *
            </label>
            <input type="date" id="swal-vigencia-hasta" class="swal2-input swal-accion-input"
              value="${escaparHtml(c.vigenciaHasta || hoy)}" min="${escaparHtml(c.vigenciaDesde || '')}"${c.vigenciaHasta ? ` max="${escaparHtml(c.vigenciaHasta)}"` : ''}>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        focusConfirm: false,
        confirmButtonText: '<i class="fas fa-calendar-times"></i> Cerrar vigencia',
        cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
        confirmButtonColor: COLORES_DIALOGO.COLOR_CONFIRMAR,
        preConfirm: () => {
          const valor = document.getElementById('swal-vigencia-hasta')?.value
          if (!valor) {
            this.$swal.showValidationMessage('Indique el último día de vigencia')
            return false
          }
          return valor
        },
      })
      if (!isConfirmed) return
      this.mutacionEnCurso = true
      try {
        await axios.post(`/mcas/conjuntos-reglas/${c.id}/cerrar-vigencia`, null, { params: { hasta } })
        await this.cargarConjuntos()
        mostrarExito(this.$swal, 'Vigencia cerrada', `La tabla "${nombreConjunto(c)}" se aplica hasta el ${this.formatFechaCorta(hasta)}.`)
      } catch (e) {
        mostrarError(this.$swal, 'Error al cerrar la vigencia', textoError(e, 'No se pudo cerrar la vigencia de la tabla.'))
      } finally {
        this.mutacionEnCurso = false
      }
    },

    // -----------------------------------------------
    // CRUD Reglas
    // -----------------------------------------------
    abrirModalRegla(r = null) {
      if (!r && !this.conjuntoEditable) return
      // Fuera de borrador la regla se abre para consultarla (mismo patrón que «Ver política»).
      this.soloLecturaRegla = !!r && !this.conjuntoEditable
      this.formRegla = r
        ? { nombre: '', descripcion: '', ...r }
        : { nombre: '', descripcion: '', codigo: '', prioridad: 100, activo: true, metodoCalculo: 'FEE_PERCENTAGE' }
      const error = this.cargarEditorDesdeJson()
      this.abrirModal('modalRegla')
      if (error) this.erroresForm = { condicionesJson: `${error}. Corríjalo aquí o vuelva al formulario.` }
    },
    /** JSON guardado → editor visual. Si no se puede leer, deja la regla en modo avanzado. */
    cargarEditorDesdeJson() {
      const f = this.formRegla
      const cond = leerCondiciones(f.condicionesJson)
      const calc = leerCalculo(f.metodoCalculo, f.calculoJson)
      const pago = leerPago(f.politicaPagoJson)
      const error = cond.error || calc.error || pago.error
      this.editorRegla = {
        avanzado: !!error,
        condiciones: cond.form, condExtras: cond.extras,
        calculo: calc.form, calcExtras: calc.extras,
        numeroPagos: pago.numeroPagos, pagoExtras: pago.extras,
      }
      return error
    },
    /** Editor visual → JSON exacto que guarda la regla. */
    volcarEditorEnJson() {
      const e = this.editorRegla
      this.formRegla.condicionesJson = escribirCondiciones(e.condiciones, e.condExtras)
      this.formRegla.calculoJson = escribirCalculo(this.formRegla.metodoCalculo, e.calculo, e.calcExtras)
      this.formRegla.politicaPagoJson = escribirPago(this.requiereMotivo ? '' : e.numeroPagos, e.pagoExtras)
    },
    alternarModoAvanzado() {
      if (!this.editorRegla.avanzado) {
        this.volcarEditorEnJson()
        this.editorRegla.avanzado = true
        this.erroresForm = {}
        return
      }
      const errores = this.validarRegla()
      if (errores.condicionesJson || errores.calculoJson || errores.politicaPagoJson) {
        this.erroresForm = errores
        return
      }
      this.cargarEditorDesdeJson()
      this.erroresForm = {}
    },
    onCambioMetodo() {
      // Los parámetros avanzados del método anterior no sirven para el nuevo.
      this.editorRegla.calcExtras = {}
      if (this.formRegla.metodoCalculo === 'COMPOSITE_SUM' && !this.editorRegla.calculo.lineas.length)
        this.editorRegla.calculo.lineas = [lineaVacia()]
    },
    onCambioCondicion(campo) {
      normalizarCondiciones(this.editorRegla.condiciones, campo)
    },
    anadirLinea() {
      this.editorRegla.calculo.lineas.push(lineaVacia())
    },
    quitarLinea(indice) {
      this.editorRegla.calculo.lineas.splice(indice, 1)
    },
    unidadLinea(metodo) {
      return TIPOS_LINEA.find(t => t.value === metodo)?.unidad || ''
    },
    validarRegla() {
      const f = this.formRegla
      const errores = {}
      if (esVacio(f.nombre)) errores.nombre = 'Indique un nombre para la regla'
      if (f.id && esVacio(f.codigo)) errores.codigo = 'Una regla ya guardada necesita su código interno'
      if (esVacio(f.metodoCalculo)) errores.metodoCalculo = 'Seleccione un método de cálculo'
      if (!esVacio(f.prioridad) && !Number.isInteger(Number(f.prioridad))) errores.prioridad = 'Debe ser un número entero'
      if (METODOS_CON_MOTIVO.includes(f.metodoCalculo) && esVacio(f.motivoManual)) errores.motivoManual = 'Indique el mensaje que verá el usuario'
      if (this.editorRegla.avanzado) {
        const mensaje = 'Debe ser un objeto JSON válido, p. ej. {"clave": valor}'
        if (!jsonValido(f.condicionesJson)) errores.condicionesJson = mensaje
        if (this.usaParametrosCalculo && !jsonValido(f.calculoJson)) errores.calculoJson = mensaje
        if (!jsonValido(f.politicaPagoJson)) errores.politicaPagoJson = mensaje
      } else {
        Object.assign(errores,
          validarCondiciones(this.editorRegla.condiciones),
          validarCalculo(f.metodoCalculo, this.editorRegla.calculo))
      }
      return errores
    },
    async guardarRegla() {
      if (this.soloLecturaRegla || this.mutacionEnCurso || !this.aplicarValidacion(this.validarRegla)) return
      if (!this.editorRegla.avanzado) this.volcarEditorEnJson()
      const f = this.formRegla
      const payload = {
        ...f,
        nombre: String(f.nombre ?? '').trim(),
        descripcion: String(f.descripcion ?? '').trim() || null,
        // Vacío al crear: el servidor genera el código interno.
        codigo: String(f.codigo ?? '').trim() || null,
      }
      this.mutacionEnCurso = true
      try {
        if (payload.id) {
          await axios.put(`/mcas/reglas/${payload.id}`, payload)
        } else {
          await axios.post(`/mcas/conjuntos-reglas/${this.conjuntoParaReglas.id}/reglas`, payload)
        }
        this.cerrarModales()
        await this.cargarReglas()
        mostrarExito(this.$swal, 'Regla guardada', `La regla "${nombreRegla(payload)}" se ha guardado correctamente.`)
      } catch (e) {
        mostrarError(this.$swal, 'Error al guardar', textoError(e, 'No se pudo guardar la regla.'))
      } finally {
        this.mutacionEnCurso = false
      }
    },
    async eliminarRegla(r) {
      if (this.mutacionEnCurso) return
      const confirmado = await confirmar(this.$swal, {
        titulo: '¿Eliminar la regla?',
        texto: `Se eliminará "${nombreRegla(r)}" y los tramos de su tabla.`,
        textoConfirmar: 'Sí, eliminar',
        peligroso: true,
      })
      if (!confirmado) return
      this.mutacionEnCurso = true
      try {
        await axios.delete(`/mcas/reglas/${r.id}`)
        await this.cargarReglas()
        mostrarExito(this.$swal, 'Regla eliminada', `La regla "${nombreRegla(r)}" se ha eliminado.`)
      } catch (e) {
        mostrarError(this.$swal, 'Error al eliminar', textoError(e, 'No se pudo eliminar la regla.'))
      } finally {
        this.mutacionEnCurso = false
      }
    },

    // -----------------------------------------------
    // Probar con un contrato (sin guardar)
    // -----------------------------------------------
    abrirSimulacion() {
      if (!this.conjuntoParaReglas) return
      this.simulacion = { referencia: this.simulacion.referencia, cargando: false, resultado: null }
      this.abrirModal('modalSimulacion')
    },
    async ejecutarSimulacion() {
      if (this.simulacion.cargando) return
      const referencia = String(this.simulacion.referencia || '').trim()
      if (!referencia) {
        this.erroresForm = { simContrato: 'Indique el número o el ID del contrato' }
        return
      }
      this.erroresForm = {}
      this.simulacion.cargando = true
      try {
        const { data } = await axios.get('/mcas/simulaciones', {
          params: { conjunto: this.conjuntoParaReglas.id, contrato: referencia },
        })
        this.simulacion.resultado = data
      } catch (e) {
        this.simulacion.resultado = null
        this.erroresForm = { simContrato: textoError(e, 'No se pudo probar la tabla con ese contrato.') }
      } finally {
        this.simulacion.cargando = false
      }
    },
    etiquetaResultadoSimulacion(r) {
      return RESULTADOS_SIMULACION[r]?.label || r
    },
    tonoResultadoSimulacion(r) {
      return RESULTADOS_SIMULACION[r]?.tono || 'neutral'
    },
    explicacionResultadoSimulacion(r) {
      return RESULTADOS_SIMULACION[r]?.explicacion || ''
    },

    // -----------------------------------------------
    // CRUD Rangos
    // -----------------------------------------------
    abrirModalRango(v = null) {
      if (!v && (!this.reglaParaRangos || !this.conjuntoEditable)) return
      this.formRango = v
        ? { ...v }
        : { minInclusivo: true, maxInclusivo: false, orden: this.valoresRango.length + 1 }
      this.abrirModal('modalRango')
    },
    validarRango() {
      const f = this.formRango
      const errores = {}
      const dimension = String(f.dimension || '').trim()
      if (!dimension) errores.dimension = 'La dimensión es obligatoria'
      if (!Number.isInteger(f.orden) || f.orden < 1) errores.orden = 'Debe ser un entero mayor que cero'
      if (esVacio(f.valorResultado)) errores.valorResultado = 'El resultado es obligatorio'
      if (DIMENSIONES_TEXTO.includes(dimension)) {
        if (esVacio(f.valorCategoria)) errores.valorCategoria = 'Obligatorio para dimensiones de texto'
      } else if (!esVacio(f.valorMin) && !esVacio(f.valorMax) && Number(f.valorMax) < Number(f.valorMin)) {
        errores.valorMax = 'Debe ser mayor o igual que el mínimo'
      }
      return errores
    },
    async guardarRango() {
      if (this.mutacionEnCurso || !this.aplicarValidacion(this.validarRango)) return
      const payload = { ...this.formRango, dimension: String(this.formRango.dimension).trim() }
      // Una dimensión de texto usa categoría y no admite mínimo/máximo, y viceversa.
      if (DIMENSIONES_TEXTO.includes(payload.dimension)) {
        payload.valorMin = null
        payload.valorMax = null
      } else {
        payload.valorCategoria = null
      }
      this.mutacionEnCurso = true
      try {
        if (payload.id) {
          await axios.put(`/mcas/valores-rango/${payload.id}`, payload)
        } else {
          await axios.post(`/mcas/reglas/${this.reglaParaRangos.id}/valores-rango`, payload)
        }
        this.cerrarModales()
        await this.cargarRangos()
        mostrarExito(this.$swal, 'Fila guardada', 'La fila de la tabla se ha guardado correctamente.')
      } catch (e) {
        mostrarError(this.$swal, 'Error al guardar', textoError(e, 'No se pudo guardar la fila de la tabla.'))
      } finally {
        this.mutacionEnCurso = false
      }
    },
    async eliminarRango(v) {
      if (this.mutacionEnCurso) return
      const confirmado = await confirmar(this.$swal, {
        titulo: '¿Eliminar la fila de la tabla?',
        texto: `Se eliminará la fila ${v.orden ?? ''} de ${v.dimension}.`,
        textoConfirmar: 'Sí, eliminar',
        peligroso: true,
      })
      if (!confirmado) return
      this.mutacionEnCurso = true
      try {
        await axios.delete(`/mcas/valores-rango/${v.id}`)
        await this.cargarRangos()
        mostrarExito(this.$swal, 'Fila eliminada', 'La fila de la tabla se ha eliminado.')
      } catch (e) {
        mostrarError(this.$swal, 'Error al eliminar', textoError(e, 'No se pudo eliminar la fila de la tabla.'))
      } finally {
        this.mutacionEnCurso = false
      }
    },

    // -----------------------------------------------
    // CRUD Políticas de retrocesión
    // -----------------------------------------------
    abrirModalRetrocesion(p = null) {
      // Solo los borradores se modifican; el resto se abre para consultar sus tramos.
      this.soloLecturaRetrocesion = !!p && p.estado !== 'BORRADOR'
      this.formRetrocesion = politicaAFormulario(p)
      this.abrirModal('modalRetrocesion')
    },
    onCambioMetodoRetrocesion() {
      const f = this.formRetrocesion
      if (METODOS_SIN_TRAMOS.includes(f.metodo)) return
      if (!f.tramos.length) f.tramos.push(tramoVacio(f.metodo))
      // Los tramos aún sin valor toman el tipo propio del método elegido.
      for (const t of f.tramos) if (esVacio(t.valor)) t.tipoValor = tramoVacio(f.metodo).tipoValor
    },
    anadirTramo() {
      const tramos = this.formRetrocesion.tramos
      tramos.push(tramoVacio(this.formRetrocesion.metodo, tramos[tramos.length - 1] || null))
    },
    quitarTramo(indice) {
      this.formRetrocesion.tramos.splice(indice, 1)
    },
    // Un valor sin confirmar (p. ej. 0,75) pasa a leerse en % (0,75 %): se avisa y no se toca el número.
    cambiarTipoTramo(t, nuevo) {
      if (t.tipoValor === 'SIN_CONFIRMAR' && TIPOS_EN_PORCENTAJE.includes(nuevo)) t.revisarValor = true
      else if (!TIPOS_EN_PORCENTAJE.includes(nuevo)) t.revisarValor = false
      t.tipoValor = nuevo
    },
    erroresTramo(indice) {
      const prefijo = `tramos.${indice}.`
      return Object.entries(this.erroresForm).filter(([clave]) => clave.startsWith(prefijo)).map(([, mensaje]) => mensaje)
    },
    unidadValorTramo(tipoValor) {
      return TIPOS_VALOR_TRAMO.find(t => t.value === tipoValor)?.unidad || ''
    },
    validarRetrocesion() {
      const f = this.formRetrocesion
      const errores = {}
      if (esVacio(f.codigo)) errores.codigo = 'El código es obligatorio'
      if (esVacio(f.version)) errores.version = 'La versión es obligatoria'
      if (esVacio(f.idComercializadora)) errores.idComercializadora = 'Seleccione una comercializadora'
      if (esVacio(f.metodo)) errores.metodo = 'Seleccione el método'
      if (esVacio(f.vigenciaDesde)) errores.vigenciaDesde = 'Indique desde cuándo es vigente'
      if (f.vigenciaDesde && f.vigenciaHasta && f.vigenciaHasta < f.vigenciaDesde) errores.vigenciaHasta = 'Debe ser posterior a la fecha de inicio'
      if (!METODOS_SIN_TRAMOS.includes(f.metodo)) {
        const tramos = f.tramos || []
        if (!tramos.length) errores.tramos = 'Añada al menos un tramo: solo el prorrateo y «No aplica» van sin tramos'
        tramos.forEach((t, i) => Object.assign(errores, validarTramo(t, `tramos.${i}`)))
      }
      return errores
    },
    async guardarRetrocesion() {
      if (this.soloLecturaRetrocesion || this.mutacionEnCurso || !this.aplicarValidacion(this.validarRetrocesion)) return
      const payload = politicaAPayload(this.formRetrocesion)
      this.mutacionEnCurso = true
      try {
        if (payload.id) {
          await axios.put(`/mcas/politicas-retrocesion/${payload.id}`, payload)
        } else {
          await axios.post('/mcas/politicas-retrocesion', payload)
        }
        this.cerrarModales()
        await this.cargarRetrocesiones()
        mostrarExito(this.$swal, 'Política guardada', `La política "${payload.codigo}" se ha guardado correctamente.`)
      } catch (e) {
        mostrarError(this.$swal, 'Error al guardar', textoError(e, 'No se pudo guardar la política de retrocesión.'))
      } finally {
        this.mutacionEnCurso = false
      }
    },
    async cambiarEstadoRetrocesion(p, accion) {
      if (this.mutacionEnCurso) return
      const nombre = this.nombrePolitica(p)
      // El servidor tampoco la publicaría: se explica antes de preguntar.
      if (accion === 'publicar' && this.tieneTramosSinConfirmar(p)) {
        mostrarError(this.$swal, 'No se puede publicar',
          `La política "${nombre}" tiene tramos con la unidad sin confirmar. Confírmela con el cliente y edite esos tramos antes de publicarla.`)
        return
      }
      const acciones = {
        publicar: {
          titulo: '¿Publicar la política de retrocesión?',
          texto: `"${nombre}" se mostrará como retrocesión potencial en las nuevas propuestas de ${this.nombreComercializadoraPolitica(p)}. No se descuenta en el alta.`,
          confirmar: 'Sí, publicar', estado: 'publicada', error: 'No se pudo publicar la política de retrocesión.',
        },
        archivar: {
          titulo: '¿Archivar la política de retrocesión?',
          texto: `"${nombre}" dejará de asociarse a las nuevas propuestas de comisión.`,
          confirmar: 'Sí, archivar', estado: 'archivada', error: 'No se pudo archivar la política de retrocesión.',
        },
      }[accion]
      const confirmado = await confirmar(this.$swal, {
        titulo: acciones.titulo, texto: acciones.texto, textoConfirmar: acciones.confirmar, icono: 'warning',
      })
      if (!confirmado) return
      this.mutacionEnCurso = true
      try {
        await axios.post(`/mcas/politicas-retrocesion/${p.id}/${accion}`)
        await this.cargarRetrocesiones()
        mostrarExito(this.$swal, 'Estado actualizado', `La política "${nombre}" está ahora ${acciones.estado}.`)
      } catch (e) {
        mostrarError(this.$swal, 'Error', textoError(e, acciones.error))
      } finally {
        this.mutacionEnCurso = false
      }
    },
    async eliminarRetrocesion(p) {
      if (this.mutacionEnCurso) return
      const nombre = this.nombrePolitica(p)
      const confirmado = await confirmar(this.$swal, {
        titulo: '¿Eliminar la política de retrocesión?',
        texto: `Se eliminará "${nombre}" con sus tramos. Esta acción no se puede deshacer.`,
        textoConfirmar: 'Sí, eliminar',
        peligroso: true,
      })
      if (!confirmado) return
      this.mutacionEnCurso = true
      try {
        await axios.delete(`/mcas/politicas-retrocesion/${p.id}`)
        await this.cargarRetrocesiones()
        mostrarExito(this.$swal, 'Política eliminada', `La política "${nombre}" se ha eliminado.`)
      } catch (e) {
        mostrarError(this.$swal, 'Error al eliminar', textoError(e, 'No se pudo eliminar la política de retrocesión.'))
      } finally {
        this.mutacionEnCurso = false
      }
    },
    nombrePolitica(p) {
      return p.codigo || `#${p.id}`
    },
    nombreComercializadoraPolitica(p) {
      return p.nombreComercializadora || this.nombreComercializadora(p.idComercializadora)
    },
    tieneTramosSinConfirmar(p) {
      return (p.tramos || []).some(t => t.tipoValor === 'SIN_CONFIRMAR')
    },
    etiquetaMetodoRetrocesion(m) {
      return METODOS_RETROCESION.find(x => x.value === m)?.corto || m || '—'
    },
    tonoMetodoRetrocesion(m) {
      return METODOS_RETROCESION.find(x => x.value === m)?.tono || 'neutral'
    },
    ayudaMetodoRetrocesion(m) {
      return METODOS_RETROCESION.find(x => x.value === m)?.ayuda || ''
    },
    etiquetaEstadoRetrocesion(estado) {
      return this.etiquetaOpcion(ESTADOS_RETROCESION, estado)
    },
    tonoEstadoRetrocesion(estado) {
      return ESTADOS_RETROCESION.find(e => e.value === estado)?.tono || 'neutral'
    },

    // -----------------------------------------------
    // Nombres legibles y resumen de cada regla
    // -----------------------------------------------
    nombreConjunto,
    nombreRegla,
    resumenFilaRegla(r) {
      const codigo = leerCondiciones(r.condicionesJson).form.codigo_producto
      const nombreProducto = codigo ? (this.productosDelConjunto.find(p => p.codigo === codigo)?.nombre || null) : null
      const resumen = resumenDeRegla(r, { nombreProducto })
      return { aplica: resumen.aplica.join(' · '), calcula: resumen.calcula }
    },

    // -----------------------------------------------
    // Estado por comercializadora: reglas de cada tabla y enlaces de lo pendiente
    // -----------------------------------------------
    /**
     * Reglas de cada tabla no archivada para las marcas del panel. Solo pide las tablas
     * nuevas o que han cambiado (estado, vigencia, versión), salvo con `forzar` («Actualizar»).
     * Una respuesta de una recarga anterior se descarta, y nunca pisa lo que haya traído
     * después la pestaña Reglas para esa misma tabla.
     */
    async cargarReglasPanel({ forzar = false } = {}) {
      const requestId = ++this.reglasPanelRequestId
      const inicio = this.reglasPanelSecuencia
      const tablas = this.conjuntosReglas.filter(c => c.estado !== 'ARCHIVADO')
      const firmas = Object.fromEntries(tablas.map(c => [c.id, firmaPanel(c)]))
      const aPedir = tablas.filter(c => forzar || !(c.id in this.reglasPorConjunto) || this.reglasPanelFirmas[c.id] !== firmas[c.id])
      const pares = await Promise.all(aPedir.map(c => axios.get(`/mcas/conjuntos-reglas/${c.id}/reglas`)
        .then(({ data }) => [c.id, Array.isArray(data) ? data : []])
        .catch(() => [c.id, null])))
      if (requestId !== this.reglasPanelRequestId) return
      const recibidas = new Map(pares)
      const mapa = {}
      const firmasNuevas = {}
      for (const c of tablas) {
        const lista = recibidas.get(c.id)
        const masNuevo = (this.reglasPanelMarcas[c.id] || 0) > inicio
        if (lista && !masNuevo) {
          mapa[c.id] = lista
          firmasNuevas[c.id] = firmas[c.id]
        } else if (c.id in this.reglasPorConjunto) {
          // Sin cambios, ya actualizada por «Reglas» o la petición falló: se conserva lo que había.
          mapa[c.id] = this.reglasPorConjunto[c.id]
          if (this.reglasPanelFirmas[c.id] !== undefined) firmasNuevas[c.id] = this.reglasPanelFirmas[c.id]
        }
      }
      this.reglasPorConjunto = mapa
      this.reglasPanelFirmas = firmasNuevas
    },
    /** Selecciona la tabla (si no lo estaba) y espera a tener sus reglas. */
    async seleccionarYCargar(c) {
      if (this.conjuntoParaReglasId !== c.id) {
        this.conjuntoParaReglasId = c.id
        this.reglaParaRangosId = null
        this.valoresRango = []
        this.reglasConjunto = []
        await this.cargarReglas()
      } else if (!this.reglasConjunto.length) {
        await this.cargarReglas()
      }
    },
    async abrirPendiente(p) {
      const enlace = p?.enlace || {}
      switch (enlace.tipo) {
        case 'tabla': {
          const c = this.conjuntosReglas.find(x => x.id === enlace.id)
          if (c) this.verReglas(c)
          return
        }
        case 'regla': {
          const c = this.conjuntosReglas.find(x => x.id === enlace.idConjunto)
          if (!c) return
          await this.seleccionarYCargar(c)
          this.tabActivo = 'reglas'
          const r = this.reglasConjunto.find(x => x.id === enlace.id)
          if (r) this.abrirModalRegla(r)
          return
        }
        case 'politica': {
          this.tabActivo = 'retrocesiones'
          const politica = this.politicasRetrocesion.find(x => x.id === enlace.id)
          if (politica) this.abrirModalRetrocesion(politica)
          return
        }
        case 'nueva-tabla':
          this.tabActivo = 'conjuntos'
          this.abrirModalConjunto(null, { idComercializadora: enlace.idComercializadora })
          return
        default:
      }
    },

    // -----------------------------------------------
    // Activar (comprobar + cerrar la versión anterior + publicar) y activar en lote
    // -----------------------------------------------
    esActivable(c) {
      return c?.estado === 'BORRADOR' || c?.estado === 'VALIDADO'
    },
    faseBloqueada(c) {
      return this.esActivable(c) && !!c.fasePrecio && c.fasePrecio !== 'FIJO' && !this.indexadoActivo
    },
    alternarSeleccion(c) {
      if (!this.esActivable(c)) return
      const i = this.seleccionActivar.indexOf(c.id)
      if (i >= 0) this.seleccionActivar.splice(i, 1)
      else this.seleccionActivar.push(c.id)
    },
    seleccionarPagina(marcar) {
      const ids = this.activablesPagina.map(c => c.id)
      this.seleccionActivar = marcar
        ? [...new Set([...this.seleccionActivar, ...ids])]
        : this.seleccionActivar.filter(id => !ids.includes(id))
    },
    async abrirActivacion(c) {
      if (!c) return
      this.cerrarMenu()
      this.activacion = { ...activacionVacia(c), cargando: true }
      if (!this.modalActivacion) this.abrirModal('modalActivacion')
      try {
        const { data } = await axios.get(`/mcas/conjuntos-reglas/${c.id}/comprobacion`)
        if (this.activacion.conjunto?.id !== c.id) return
        this.activacion.resultado = {
          puedeActivar: data?.puedeActivar === true,
          incidencias: Array.isArray(data?.incidencias) ? data.incidencias : [],
          cambios: Array.isArray(data?.cambios) ? data.cambios : [],
          avisos: Array.isArray(data?.avisos) ? data.avisos : [],
        }
      } catch (e) {
        console.error('Error al comprobar la tabla de comisiones MCAS:', e)
        this.activacion.error = textoError(e, 'No se pudo comprobar la tabla.')
      } finally {
        this.activacion.cargando = false
      }
    },
    async activarAhora() {
      if (!this.puedeActivarAhora) return
      const c = this.activacion.conjunto
      this.activacion.activando = true
      this.mutacionEnCurso = true
      try {
        await axios.post(`/mcas/conjuntos-reglas/${c.id}/activar`, { cerrarVigenciaAnterior: true })
        this.modalActivacion = false
        this.seleccionActivar = this.seleccionActivar.filter(id => id !== c.id)
        await this.cargarConjuntos({ silencioso: true })
        mostrarExito(this.$swal, 'Tabla activada',
          `"${nombreConjunto(c)}" se usa en el cálculo automático desde el ${this.formatFechaCorta(c.vigenciaDesde) || 'día de inicio'}.`)
      } catch (e) {
        const datos = e?.response?.data
        if (Array.isArray(datos?.incidencias) && datos.incidencias.length) {
          this.activacion.resultado = { cambios: [], avisos: [], ...(this.activacion.resultado || {}), puedeActivar: false, incidencias: datos.incidencias }
        }
        mostrarError(this.$swal, 'No se ha activado', textoError(e, 'No se pudo activar la tabla.'))
      } finally {
        this.activacion.activando = false
        this.mutacionEnCurso = false
      }
    },
    /** Desde una incidencia de la comprobación: abre su regla o, si es una tabla, su celda. */
    async irAIncidencia(inc) {
      const c = this.activacion.conjunto || this.conjuntoParaReglas
      if (!c || inc?.idRegla == null) return
      this.cerrarModales()
      await this.seleccionarYCargar(c)
      this.tabActivo = 'reglas'
      const r = this.reglasConjunto.find(x => x.id === inc.idRegla)
      if (!r) {
        mostrarAviso(this.$swal, 'Regla no encontrada', 'La regla de esta incidencia ya no está en la tabla. Actualice la lista.')
        return
      }
      if (this.esLookup(r) && inc.orden != null) this.abrirMatriz(r, Number(inc.orden))
      else this.abrirModalRegla(r)
    },
    async activarSeleccionadas() {
      const ids = this.idsSeleccionados
      if (!ids.length || this.mutacionEnCurso) return
      const confirmado = await confirmar(this.$swal, {
        titulo: ids.length === 1 ? '¿Activar la tabla marcada?' : `¿Activar las ${ids.length} tablas marcadas?`,
        texto: 'Cada tabla se comprueba antes de activarla y, al activarla, se cierra la versión anterior de su comercializadora. Las que tengan errores no se activan.',
        textoConfirmar: 'Sí, activar',
        icono: 'warning',
      })
      if (!confirmado) return
      const nombres = new Map(this.conjuntosReglas.map(c => [c.id, nombreConjunto(c)]))
      this.mutacionEnCurso = true
      try {
        const { data } = await axios.post('/mcas/conjuntos-reglas/activar-lote', { ids })
        const resultados = Array.isArray(data) ? data : []
        const activadas = resultados.filter(r => r.ok)
        const fallidas = resultados.filter(r => !r.ok)
        // Las que no se activan siguen marcadas para revisarlas.
        this.seleccionActivar = fallidas.map(r => r.id)
        await this.cargarConjuntos({ silencioso: true })
        const lista = fallidas
          .map(r => `<li><strong>${escaparHtml(nombres.get(r.id) || `#${r.id}`)}</strong>: ${escaparHtml(r.mensaje || 'No se pudo activar')}</li>`)
          .join('')
        this.$swal.fire({
          icon: fallidas.length ? 'warning' : 'success',
          title: fallidas.length ? 'Activación parcial' : 'Tablas activadas',
          html: `
            <div class="swal-accion-contenedor">
              <div class="swal-accion-caja swal-accion-caja--success">
                <p class="swal-accion-caja-texto swal-accion-caja-texto--success">Se han activado ${activadas.length} de ${resultados.length} tablas.</p>
              </div>
              ${fallidas.length ? `
              <div class="swal-accion-caja swal-accion-caja--danger">
                <p class="swal-accion-caja-texto swal-accion-caja-texto--danger">No se han activado (siguen marcadas en la lista para que las revise):</p>
                <ul class="swal-accion-caja-texto">${lista}</ul>
              </div>` : ''}
            </div>`,
          confirmButtonColor: COLORES_DIALOGO.COLOR_CONFIRMAR,
          confirmButtonText: 'Entendido',
        })
      } catch (e) {
        mostrarError(this.$swal, 'Error', textoError(e, 'No se pudieron activar las tablas marcadas.'))
      } finally {
        this.mutacionEnCurso = false
      }
    },
    alternarMenu(c, evento) {
      if (this.menuConjunto === c.id) {
        this.cerrarMenu()
        return
      }
      const rect = evento?.currentTarget?.getBoundingClientRect?.()
      const ancho = 240
      if (rect) {
        const left = `${Math.round(Math.max(8, rect.right - ancho))}px`
        const haciaArriba = typeof window !== 'undefined' && rect.bottom + 260 > window.innerHeight
        this.estiloMenu = haciaArriba
          ? { left, bottom: `${Math.round(window.innerHeight - rect.top + 4)}px` }
          : { left, top: `${Math.round(rect.bottom + 4)}px` }
      } else {
        this.estiloMenu = {}
      }
      this.menuConjunto = c.id
    },
    cerrarMenu() {
      if (this.menuConjunto !== null) this.menuConjunto = null
    },

    // -----------------------------------------------
    // Nueva versión de una tabla
    // -----------------------------------------------
    abrirNuevaVersion(c) {
      if (!c) return
      this.cerrarMenu()
      const propuesta = propuestaNuevaVersion(c, { hoy: fechaLocalISO(), nombreComercializadora: this.nombreComercializadora(c.idComercializadora) })
      this.formNuevaVersion = { idOrigen: c.id, ...propuesta }
      this.abrirModal('modalNuevaVersion')
    },
    validarNuevaVersion() {
      const f = this.formNuevaVersion
      const errores = {}
      if (esVacio(f.nombre)) errores.nombre = 'Indique el nombre de la nueva versión'
      if (esVacio(f.vigenciaDesde)) errores.vigenciaDesde = 'Indique desde qué día se aplica'
      else {
        const origen = this.conjuntoNuevaVersion
        if (origen?.vigenciaDesde && f.vigenciaDesde <= origen.vigenciaDesde) {
          errores.vigenciaDesde = `Debe ser posterior al inicio de la versión actual (${this.formatFechaCorta(origen.vigenciaDesde)})`
        }
      }
      return errores
    },
    async guardarNuevaVersion() {
      if (this.mutacionEnCurso || !this.aplicarValidacion(this.validarNuevaVersion)) return
      const { idOrigen, vigenciaDesde } = this.formNuevaVersion
      const nombre = String(this.formNuevaVersion.nombre).trim()
      this.mutacionEnCurso = true
      try {
        const { data } = await axios.post(`/mcas/conjuntos-reglas/${idOrigen}/nueva-version`, { vigenciaDesde, nombre })
        this.cerrarModales()
        await this.cargarConjuntos({ silencioso: true })
        if (data?.id != null) {
          // Queda seleccionada la nueva versión (en borrador) para seguir trabajando con ella.
          this.conjuntoParaReglasId = data.id
          this.onCambioConjunto()
        }
        this.$swal.fire({
          icon: 'info',
          title: 'Nueva versión creada en borrador',
          text: `"${data?.nombre || nombre}" tiene ya las mismas reglas y tramos que la versión actual, pero está en borrador: todavía no se usa en el cálculo. `
            + `Cambie lo que necesite y pulse «Activar»; la versión actual se cerrará el día antes del ${this.formatFechaCorta(vigenciaDesde)}.`,
          confirmButtonColor: COLORES_DIALOGO.COLOR_CONFIRMAR,
          confirmButtonText: 'Entendido',
        })
      } catch (e) {
        mostrarError(this.$swal, 'Error', textoError(e, 'No se pudo crear la nueva versión.'))
      } finally {
        this.mutacionEnCurso = false
      }
    },

    // -----------------------------------------------
    // Tabla de importes en rejilla («Ver tabla»)
    // -----------------------------------------------
    abrirMatriz(r, orden = null) {
      if (!r) return
      this.reglaMatriz = r
      this.ordenMatriz = orden ?? null
      this.modalMatriz = true
    },
    cerrarMatriz() {
      this.modalMatriz = false
      this.reglaMatriz = null
      this.ordenMatriz = null
    },
    onTablaGuardada() {
      if (this.reglaMatriz && this.reglaParaRangosId === this.reglaMatriz.id) this.cargarRangos({ silencioso: true })
    },
    irAVistaAvanzada() {
      const r = this.reglaMatriz
      this.cerrarMatriz()
      if (r) this.verRangos(r)
    },

    // -----------------------------------------------
    // Helpers de presentación
    // -----------------------------------------------
    nombreComercializadora(id) {
      if (id == null || id === '') return '—'
      return this.comercializadoras.find(c => c.id === id)?.nombre || `#${id}`
    },
    nombreGestora(id) {
      return id ? (this.gestoras.find(g => g.id === id)?.nombre || `#${id}`) : null
    },
    etiquetaOpcion(opciones, valor) {
      return opciones.find(o => o.value === valor)?.label || valor || '—'
    },
    etiquetaEstadoConjunto(estado) {
      return this.etiquetaOpcion(ESTADOS_CONJUNTO, estado)
    },
    tonoEstadoConjunto(estado) {
      return ESTADOS_CONJUNTO.find(e => e.value === estado)?.tono || 'neutral'
    },
    tonoPrecio(valor) {
      return { FIJO: 'primary', INDEXADO: 'warning', AMBOS: 'info' }[valor] || 'neutral'
    },
    tonoMetodo(m) {
      if (['FEE_PERCENTAGE', 'RATE_PER_MWH'].includes(m)) return 'success'
      if (['FIXED_AMOUNT', 'COMPOSITE_SUM'].includes(m)) return 'info'
      if (METODOS_TABLA.includes(m)) return 'primary'
      if (m === 'MANUAL') return 'warning'
      return 'neutral'
    },
    esLookup(r) {
      return METODOS_TABLA.includes(r.metodoCalculo)
    },
    etiquetaMetodo(m) {
      return METODOS_CALCULO.find(x => x.value === m)?.corto || NOMBRES_METODO[m] || m || '—'
    },
    formatFechaCorta(valor) {
      if (!valor) return ''
      const [anio, mes, dia] = String(valor).slice(0, 10).split('-')
      return dia && mes && anio ? `${dia}/${mes}/${anio}` : String(valor)
    },
    formatVigencia(desde, hasta) {
      if (!desde && !hasta) return '—'
      if (!hasta) return `Desde ${this.formatFechaCorta(desde)}`
      if (!desde) return `Hasta ${this.formatFechaCorta(hasta)}`
      return `${this.formatFechaCorta(desde)} → ${this.formatFechaCorta(hasta)}`
    },
    formatNumero(v) {
      return Number(v).toLocaleString('es-ES', { maximumFractionDigits: 4 })
    },
    formatEuros(v) {
      if (v === null || v === undefined || v === '') return '—'
      return `${Number(v).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
    },
    formatRango(v) {
      if (!esVacio(v.valorCategoria)) return '—'
      const partes = []
      if (!esVacio(v.valorMin)) partes.push(`${v.minInclusivo ? '≥' : '>'} ${this.formatNumero(v.valorMin)}`)
      if (!esVacio(v.valorMax)) partes.push(`${v.maxInclusivo ? '≤' : '<'} ${this.formatNumero(v.valorMax)}`)
      return partes.length ? partes.join(' y ') : 'Cualquier valor'
    },
    formatResultado(v) {
      if (esVacio(v.valorResultado)) return '—'
      return `${this.formatNumero(v.valorResultado)} ${v.unidadResultado || '€'}`
    },
    ayudaMetodo(m) {
      const map = {
        FIXED_AMOUNT: 'Siempre el mismo importe, sea cual sea el consumo.',
        RANGE_LOOKUP: 'El importe depende del tramo en que cae un dato del contrato (consumo, potencia, tarifa...). Los tramos se rellenan con «Ver tabla».',
        MATRIX_LOOKUP: 'El importe depende de la combinación de consumo y potencia. Las celdas se rellenan con «Ver tabla».',
        MULTI_DIMENSION_LOOKUP: 'El importe depende de la combinación de dos o más datos del contrato. Las celdas se rellenan con «Ver tabla».',
        RATE_PER_MWH: 'Consumo anual en MWh × una tasa fija en €/MWh.',
        FEE_PERCENTAGE: 'Consumo anual en MWh × FEE del contrato × un porcentaje.',
        COMPOSITE_SUM: 'Suma de varias líneas: importes fijos, tasas por MWh, % sobre el FEE o % de las líneas anteriores.',
        MANUAL: 'No calcula: deja la propuesta en revisión manual con un mensaje.',
        NOT_COMMISSIONABLE: 'No comisiona: cierra la propuesta con importe 0 y un mensaje.',
      }
      return map[m] || m
    },
    ayudaCalculoJson(m) {
      const map = {
        FIXED_AMOUNT:   'Objeto con campo "importe"',
        RATE_PER_MWH:   'Objeto con campo "tasa_eur_mwh"',
        FEE_PERCENTAGE: 'Objeto con "porcentaje_aplicacion_fee" (factor decimal, ej: 0.44) y opcionalmente "fee_minimo_eur_mwh"',
      }
      return map[m] || 'Parámetros específicos del método'
    },
    ejemploCalculoJson(m) {
      const map = {
        FIXED_AMOUNT:   '{"importe": 411.84}',
        RATE_PER_MWH:   '{"tasa_eur_mwh": 4.05}',
        FEE_PERCENTAGE: '{"porcentaje_aplicacion_fee": 0.44, "fee_minimo_eur_mwh": 5.0}',
      }
      return map[m] || '{}'
    },
  },
}
</script>

<style scoped src="./McasShared.css"></style>
<style scoped src="./McasAdminComponent.css"></style>
