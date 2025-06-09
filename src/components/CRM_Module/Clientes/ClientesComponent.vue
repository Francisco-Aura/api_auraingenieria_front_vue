<template>
  <!-- Contenedor principal del módulo de gestión de clientes -->
  <div class="clientes-container fade-in">
    <!-- Loading spinner -->
    <Spinner :isLoading="loading" />

    <!-- Panel superior con stats y botón de crear cliente -->
    <div class="stats-panel">
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ clientes.length }}</div>
            <div class="stat-label">Total Clientes</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-bolt"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalPuntosSuministro }}</div>
            <div class="stat-label">Puntos Suministro</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-industry"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ sectores.length }}</div>
            <div class="stat-label">Sectores</div>
          </div>
        </div>
      </div>
      <div class="action-card">
        <button class="btn btn-primary" @click="abrirFormularioCrearCliente">
          <i class="fas fa-plus"></i>
          <span>Crear Cliente</span>
        </button>
      </div>
    </div>
    
    <!-- Tabla de clientes con nuevo diseño -->
    <div class="card table-panel">
      <div class="table-header">
        <h2><i class="fas fa-users"></i> Cartera de Clientes</h2>
        <div class="table-actions-horizontal">
          <button class="btn btn-export btn-excel" @click="exportarExcel" title="Exportar a Excel">
            <i class="fas fa-file-excel"></i>
            <span>Excel</span>
          </button>
          <button class="btn btn-export btn-pdf" @click="exportarPDF" title="Exportar a PDF" v-show="false">
            <i class="fas fa-file-pdf"></i>
            <span>PDF</span>
          </button>
        </div>
      </div>
      <div class="table-responsive">
        <div class="table-controls" hidden>
          <div class="records-per-page">
            <label for="recordsPerPage">Registros por página:</label>
            <select v-model="recordsPerPage" id="recordsPerPage" class="form-control">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th class="sortable" style="width: 20%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('nombre')">
                    <i class="fas fa-user mr-2"></i>Nombre Cliente
                    <i :class="getSortIcon('nombre')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.nombre" 
                      @input="filterByColumn('nombre', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable" style="width: 15%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('cif')">
                    <i class="fas fa-id-card mr-2"></i>CIF
                    <i :class="getSortIcon('cif')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.cif" 
                      @input="filterByColumn('cif', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable" style="width: 15%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('nombreComercial')">
                    <i class="fas fa-building mr-2"></i>Grupo Empresarial
                    <i :class="getSortIcon('nombreComercial')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.nombreComercial" 
                      @input="filterByColumn('nombreComercial', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable" style="width: 25%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('direccionFiscal')">
                    <i class="fas fa-map-marker-alt mr-2"></i>Dirección Fiscal
                    <i :class="getSortIcon('direccionFiscal')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.direccionFiscal" 
                      @input="filterByColumn('direccionFiscal', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable" style="width: 15%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('numeroPuntosSuministro')">
                    <i class="fas fa-bolt mr-2"></i>PS
                    <i :class="getSortIcon('numeroPuntosSuministro')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.numeroPuntosSuministro" 
                      @input="filterByColumn('numeroPuntosSuministro', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable" style="width: 15%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('usuarioAsignado')">
                    <i class="fas fa-user-tie mr-2"></i>Usuario
                    <i :class="getSortIcon('usuarioAsignado')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.usuarioAsignado" 
                      @input="filterByColumn('usuarioAsignado', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th style="width: 10%">
                <div class="column-header">
                  <div class="column-title">
                    <i class="fas fa-cogs mr-2"></i>Acciones
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cliente in paginatedClientes" :key="cliente.idCliente">
              <td class="text-truncate" :title="cliente.nombre">{{ cliente.nombre }}</td>
              <td class="text-truncate" :title="cliente.cif">{{ cliente.cif }}</td>
              <td class="text-truncate" :title="cliente.nombreComercial">{{ cliente.nombreComercial }}</td>
              <td class="text-truncate" :title="cliente.direccionFiscal">{{ cliente.direccionFiscal }}</td>
              <td>
                <div class="ps-cell">
                  <span class="ps-badge">{{ cliente.numeroPuntosSuministro }}</span>
                  <button class="btn-icon btn-view" @click="verPuntosSuministro(cliente)" title="Ver puntos de suministro">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
              </td>
              <td class="text-truncate" :title="cliente.usuarioAsignado">{{ cliente.usuarioAsignado }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon btn-edit" @click="cargarDatosCliente(cliente.idCliente)" title="Consultar Cliente">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-icon btn-add" @click="abrirFormularioNuevoPunto(cliente)" title="Crear Punto de Suministro">
                    <i class="fas fa-plus-circle"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="paginatedClientes.length === 0">
              <td colspan="6" class="text-center py-4">
                <div class="empty-state">
                  <i class="fas fa-search fa-3x text-muted"></i>
                  <p class="mt-3">No se encontraron clientes que coincidan con la búsqueda</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="pagination-controls">
          <div class="records-per-page">
            <label for="recordsPerPage">Registros por página:</label>
            <select v-model="recordsPerPage" id="recordsPerPage" class="form-control">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          <div class="pagination-info">
            Mostrando {{ paginationStart }} - {{ paginationEnd }} de {{ filteredClientes.length }} registros
          </div>
          <div class="pagination-buttons">
            <button 
              class="btn btn-outline" 
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
            <span class="page-info">Página {{ currentPage }} de {{ totalPages }}</span>
            <button 
              class="btn btn-outline" 
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <PuntosSuministroClienteComponent
      v-if="isModalPuntosOpen"
      :cliente="clienteSeleccionado"
      :puntosSuministro="puntosSuministro"
      @cerrar-modal="cerrarModalPuntos"
    />

    <CreaActualizaClienteComponent
      :formularioVisible="formularioVisible"
      :modoActualizar="modoActualizar"
      :nuevoCliente="clienteSeleccionado"
      :sectores="sectores"
      :usuarios="usuarios"
      :subtipologias="subtipologias"
      @cancelar-formulario="formularioVisible = false"
      @crear-cliente="crearCliente"
      @actualizar-cliente="actualizarCliente"
    />

    <CrearPuntosSuministroComponent
      v-if="showModalPS"
      :ShowModalPS="showModalPS"
      :formulario-visible="showModalPS"
      :cliente="clienteSeleccionado"
      :nuevo-punto="nuevoPunto"
      @guardar-punto-suministro="crearPuntoSuministro"
      @cerrar-formulario="cerrarFormularioNuevoPuntoSuministro"
    />
  </div>
</template>

<script>
import axios from "axios";
import Spinner from "@/components/SpinnerComponent.vue";
import PuntosSuministroClienteComponent from "@/components/CRM_Module/Clientes/PuntosSuministroClienteComponent.vue";
import CreaActualizaClienteComponent from "@/components/CRM_Module/Clientes/CreaActualizaClientesComponent.vue";
import CrearPuntosSuministroComponent from "@/components/CRM_Module/Clientes/CrearPuntosSuministroComponent.vue";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default {
  name: "ClientesComponent",
  components: {
    Spinner,
    PuntosSuministroClienteComponent,
    CreaActualizaClienteComponent,
    CrearPuntosSuministroComponent,
  },
  data() {
    return {
      clientes: [], // Lista de clientes
      filter: "", // Texto del filtro
      columnFilters: {
        nombre: '',
        cif: '',
        nombreComercial: '',
        direccionFiscal: '',
        numeroPuntosSuministro: '',
        usuarioAsignado: ''
      },
      puntosSuministro: [],        // Lista de puntos de suministro
      clienteSeleccionado: {},  // Cliente seleccionado
      isModalPuntosOpen: false,    // Estado para controlar la visibilidad del modal
      loading: false,              // Estado para mostrar un spinner de carga
      formularioVisible: false, // Control de visibilidad del formulario cliente
      modoActualizar: false, // Indica si el formulario está en modo actualizar
      nuevoCliente: this.resetFormularioCliente(), // Datos del nuevo cliente o cliente a actualizar
      sectores: [], // Opciones de sectores
      usuarios: [], // Opciones de usuarios
      subtipologias: [], // Opciones de subtipologías
      isSubmitting: false, // Evita múltiples envíos del formulario
      showModalPS: false, // Estado del modal de puntos de suministro
      nuevoPunto: this.resetFormularioPuntoSuministro(), // Datos del nuevo punto de suministro
      currentPage: 1,
      recordsPerPage: 10,
      sortKey: null,
      sortOrder: null,
    };
  },
  computed: {
    // Lista de clientes filtrados según el texto de búsqueda
    filteredClientes() {
      return this.clientes.filter((cliente) => {
        // Primero aplicamos el filtro general
        const generalFilter = Object.values(cliente).some((value) =>
          String(value).toLowerCase().includes(this.filter.toLowerCase())
        );

        // Luego aplicamos los filtros por columna
        const columnFilters = Object.entries(this.columnFilters).every(([key, value]) => {
          if (!value) return true; // Si no hay filtro para esta columna, no filtra
          const fieldValue = String(cliente[key] || '').toLowerCase();
          return fieldValue.includes(value.toLowerCase());
        });

        return generalFilter && columnFilters;
      });
    },
    // Total de puntos de suministro de todos los clientes
    totalPuntosSuministro() {
      return this.clientes.reduce((total, cliente) => {
        return total + (cliente.numeroPuntosSuministro || 0);
      }, 0);
    },
    sortedClientes() {
      if (!this.sortKey || !this.sortOrder) return this.filteredClientes;
      
      const sorted = [...this.filteredClientes].sort((a, b) => {
        let aValue = a[this.sortKey];
        let bValue = b[this.sortKey];
        
        aValue = aValue ?? '';
        bValue = bValue ?? '';
        
        if (this.sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      return sorted;
    },
    
    paginatedClientes() {
      const start = (this.currentPage - 1) * this.recordsPerPage;
      const end = start + this.recordsPerPage;
      return this.sortedClientes.slice(start, end);
    },
    
    totalPages() {
      return Math.ceil(this.filteredClientes.length / this.recordsPerPage);
    },
    
    paginationStart() {
      return (this.currentPage - 1) * this.recordsPerPage + 1;
    },
    
    paginationEnd() {
      const end = this.currentPage * this.recordsPerPage;
      return end > this.filteredClientes.length ? this.filteredClientes.length : end;
    }
  },
  methods: {
    // Carga la lista de clientes desde el backend
    async fetchClientes() {
      try {
        this.loading = true;
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/clientes/cartera`);
        this.clientes = response.data;
      } catch (error) {
        console.error("Error al cargar clientes:", error);
      } finally {
        this.loading = false;
      }
    },
    // Carga los puntos de suministro asociados a un cliente
    async fetchPuntosSuministro(idCliente) {
      try {
        this.loading = true;
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/cliente/${idCliente}`);
        this.puntosSuministro = response.data;
      } catch (error) {
        alert("No se pudieron cargar los puntos de suministro.");
      } finally {
        this.loading = false;
      }
    },
    // Reinicia el formulario de cliente
    resetFormularioCliente() {
      return {
        nombre: '',
        grupoEmpresarial: '',
        cif: '',
        direccion: '',
        codigoPostal: '',
        poblacion: '',
        provincia: '',
        iban: '',
        nombreAutorizado: '',
        dniAutorizado: '',
        telefonoAutorizado: '',
        emailAutorizado: '',
        idUsuario: null,
        actividad: '',
        codigoSector: null,
        codigoSubtipologia: null,
        notas: '',
        userTelemedida: '',
        passTelemedida: '',
        // Autorizados
        nombreContacto1: '',
        cargoContacto1: '',
        emailContacto1: '',
        telefonoContacto1: '',
        nombreContacto2: '',
        cargoContacto2: '',
        emailContacto2: '',
        telefonoContacto2: '',
        nombreContacto3: '',
        cargoContacto3: '',
        emailContacto3: '',
        telefonoContacto3: '', 
      };
    },
    // Reinicia el formulario de punto de suministro
    resetFormularioPuntoSuministro() {
      return {
        direccion: '',
        codigoPostal: '',
        poblacion: '',
        provincia: '',
        propiedadContador: 0,
        contador: '',
        propiedadModem: 0,
        modem: '',
        observaciones: '',
        fechaInstalacion: '',
        idCliente: null,
        nombreCliente: '',
        cupsluz: '',
        cupsgas: ''
      };
    },    
    // Muestra el modal de puntos de suministro para el cliente seleccionado
    verPuntosSuministro(cliente) {
      try {
        this.clienteSeleccionado = cliente;
        this.isModalPuntosOpen = true; // Abre el modal primero
        this.fetchPuntosSuministro(cliente.idCliente); // Luego carga los puntos
      } catch (error) {
        console.error('Error al mostrar puntos de suministro:', error);
      }
    },
    // Cierra el modal de puntos de suministro
    cerrarModalPuntos() {
        this.isModalPuntosOpen = false; // Cierra el modal
        this.clienteSeleccionado = null; // Limpia el cliente seleccionado
        this.puntosSuministro = []; // Limpia los puntos de suministro cargados
    },       
    // Muestra el modal de creación de cliente
    abrirFormularioCrearCliente() {
      this.nuevoCliente = {}; // Asegúrate de que sea un objeto vacío
      this.formularioVisible = true; // Muestra el formulario
      this.modoActualizar = false; // Asegura que sea modo de creación
    },
    // Cierra el modal de cliente
    cancelarFormulario() {
      this.formularioVisible = false;
      this.nuevoCliente = this.resetFormularioCliente(); // Limpia los datos al cerrar
    },
    // Carga datos para actualizar un cliente
    async cargarDatosCliente(idCliente) {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/clientes/${idCliente}`);
        this.clienteSeleccionado = response.data;
        this.formularioVisible = true;
        this.modoActualizar = true;
      } catch (error) {
          console.error("Error al cargar datos del cliente:", error);
      }
    },
    // Lógica para actualizar cliente
    async actualizarCliente(clienteActualizado) {
      if (!clienteActualizado.id) {
        console.error("El cliente recibido no tiene un ID.");
        return;
      }
      try {
        await axios.put(`${process.env.VUE_APP_API_URL}/api/clientes/${clienteActualizado.id}`, clienteActualizado);
        alert("Cliente actualizado.");
        this.fetchClientes(); // Actualiza la lista de clientes
        this.cancelarFormulario();
      } catch (error) {
        console.error("Error al actualizar cliente:", error);
      }
    },    
    // Lógica para crear cliente
    async crearCliente(clienteRecibido) {
      try {
        if (this.modoActualizar) return; // Evita llamadas erróneas en modo actualización
        await axios.post(`${process.env.VUE_APP_API_URL}/api/clientes`, clienteRecibido);
        alert("Cliente creado con éxito.");
        this.fetchClientes(); // Actualiza la lista
        this.cancelarFormulario(); // Limpia y cierra el formulario
      } catch (error) {
        console.error("Error al crear cliente:", error);
      }
    },
    // Muestra el modal para crear un punto de suministro
    abrirFormularioNuevoPunto(cliente) {
      this.clienteSeleccionado = cliente;
      this.nuevoPunto = this.resetFormularioPuntoSuministro();
      this.nuevoPunto.idCliente = cliente.idCliente; // Asigna el idCliente
      this.nuevoPunto.nombreCliente = cliente.nombre; // Asigna el nombreCliente
      this.showModalPS = true;
    },
    // Cierra el modal de puntos de suministro
    cerrarFormularioNuevoPuntoSuministro() {
      this.showModalPS = false;
    },
    // Crea un nuevo punto de suministro
    async crearPuntoSuministro() {
      try {
        // Adaptamos los datos para que coincidan con el formato que requiere el backend
        // Adaptamos los datos para que coincidan con el formato que requiere el backend
        const datosAdaptados = {
          direccion: this.nuevoPunto.direccion,
          codigoPostal: this.nuevoPunto.codigoPostal,
          poblacion: this.nuevoPunto.poblacion,
          provincia: this.nuevoPunto.provincia,
          propiedadContador: this.nuevoPunto.propiedadContador ? 1 : 0,
          contador: this.nuevoPunto.contador,
          propiedadModem: this.nuevoPunto.propiedadModem ? 1 : 0,
          modem: this.nuevoPunto.modem,
          observaciones: this.nuevoPunto.observaciones,
          fechaInstalacion: this.nuevoPunto.fechaInstalacion,
          cliente: { id: this.nuevoPunto.idCliente }, // Aquí adaptamos el formato para que coincida con el backend
          clienteNombre: this.nuevoPunto.nombreCliente,
          CUPSluz: this.nuevoPunto.cupsluz, // Respeta mayúsculas/minúsculas del modelo
          CUPSgas: this.nuevoPunto.cupsgas,
        };

        await axios.post(
          `${process.env.VUE_APP_API_URL}/api/puntos-suministro`,
          datosAdaptados
        );
        alert("Punto de suministro creado.");
        this.fetchClientes();
        this.cerrarFormularioNuevoPuntoSuministro();
      } catch (error) {
        console.error("Error al crear punto de suministro:", error);
      }
    },    
    sortBy(key) {
      if (this.sortKey === key) {
        // Ciclo: asc -> desc -> null
        if (this.sortOrder === 'asc') {
          this.sortOrder = 'desc';
        } else if (this.sortOrder === 'desc') {
          this.sortKey = null;
          this.sortOrder = null;
        }
      } else {
        this.sortKey = key;
        this.sortOrder = 'asc';
      }
    },
    
    getSortIcon(key) {
      if (this.sortKey !== key) return 'fas fa-sort';
      if (!this.sortOrder) return 'fas fa-sort';
      return this.sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    },

    exportarExcel() {
      try {
        const data = this.filteredClientes.map(cliente => ({
          'Nombre Cliente': cliente.nombre,
          'CIF': cliente.cif,
          'Grupo Empresarial': cliente.nombreComercial,
          'Dirección Fiscal': cliente.direccionFiscal,
          'Puntos Suministro': cliente.numeroPuntosSuministro,
          'Usuario Asignado': cliente.usuarioAsignado
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
        
        // Ajustar el ancho de las columnas
        const wscols = [
          {wch: 30}, // Nombre Cliente
          {wch: 15}, // CIF
          {wch: 25}, // Grupo Empresarial
          {wch: 40}, // Dirección Fiscal
          {wch: 15}, // Puntos Suministro
          {wch: 20}  // Usuario Asignado
        ];
        ws['!cols'] = wscols;

        XLSX.writeFile(wb, 'Cartera_Clientes.xlsx');
      } catch (error) {
        console.error('Error al exportar a Excel:', error);
        this.$toast.error('Error al exportar a Excel');
      }
    },

    exportarPDF() {
      try {
        const doc = new jsPDF();
        
        // Añadir logo
        const logo = new Image();
        logo.src = require('@/assets/logo.png');
        doc.addImage(logo, 'PNG', 14, 10, 30, 30);
        
        // Título
        doc.setFontSize(16);
        doc.setTextColor(51, 51, 51); // Color gris oscuro para el título
        doc.text('Cartera de Clientes', 50, 25);
        
        // Fecha de exportación
        doc.setFontSize(10);
        const fecha = new Date().toLocaleDateString();
        doc.text(`Exportado el: ${fecha}`, 14, 45);

        // Datos de la tabla
        const data = this.filteredClientes.map(cliente => [
          cliente.nombre,
          cliente.cif,
          cliente.direccionFiscal,
          cliente.numeroPuntosSuministro,
          cliente.usuarioAsignado
        ]);

        doc.autoTable({
          head: [['Nombre Cliente', 'CIF', 'Dirección Fiscal', 'PS', 'Usuario']],
          body: data,
          startY: 50,
          styles: { 
            fontSize: 8,
            cellPadding: 3
          },
          headStyles: { 
            fillColor: [255, 193, 7],
            textColor: [51, 51, 51],
            fontStyle: 'bold',
            halign: 'center'
          },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 25 },
            2: { cellWidth: 60 },
            3: { cellWidth: 15 },
            4: { cellWidth: 25 }
          }
        });

        doc.save('Cartera_Clientes.pdf');
      } catch (error) {
        console.error('Error al exportar a PDF:', error);
        this.$toast.error('Error al exportar a PDF');
      }
    },

    mostrarNotificacionSubidaPDF() {
      this.$swal.fire({
        title: 'Subir Contrato',
        text: 'Por favor, selecciona el archivo PDF del contrato',
        icon: 'info',
        confirmButtonText: 'Aceptar'
      }).then(() => {
        this.$refs.pdfInput.click();
      });
    },

    filterByColumn(column, value) {
      this.columnFilters[column] = value;
    },
  },
  async mounted() {
    this.loading = true; // Forzar la visibilidad del spinner
    setTimeout(() => { 
      this.loading = false; 
    }, 2000); // Simular carga por 2 segundos
    //Precargamos los arrays de los combos
    try {
      const [clientes, usuarios, sectores, subtipologias] = await Promise.all([
        axios.get(`${process.env.VUE_APP_API_URL}/api/clientes/cartera`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/usuarios`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/sectores`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/subtipologias`),
      ]);
      this.clientes = clientes.data;
      this.usuarios = usuarios.data;
      this.sectores = sectores.data;
      this.subtipologias = subtipologias.data;
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
    }
  },
  watch: {
    recordsPerPage() {
      this.currentPage = 1;
    }
  }
};
</script>

<style scoped>
/* Grid layout para el contenedor principal */
.clientes-container {
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  gap: 20px;
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

/* Panel de estadísticas */
.stats-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.stats-container {
  display: flex;
  flex: 1;
  gap: 20px;
}

.stat-card {
  background-color: var(--surface-color);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  flex: 1;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background-color: var(--primary-light);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.action-card {
  background-color: var(--primary-color);
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  padding: 16px 20px;
  min-width: 200px;
}

.action-card .btn {
  width: 100%;
  height: 100%;
  background: transparent;
  color: black;
  font-size: 1.3rem;
  font-weight: 600;
  border-radius: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.action-card .btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: white;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}


.table-header {
  background-color: white;
  color: var(--text-primary);
  padding: 15px 20px;
  border-top-left-radius: var(--border-radius);
  border-top-right-radius: var(--border-radius);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-actions-horizontal {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn-export {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-excel {
  background-color: #217346;
  color: white;
  border: none;
}

.btn-excel:hover {
  background-color: #1e6b3d;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(33, 115, 70, 0.2);
}

.btn-pdf {
  background-color: #dc3545;
  color: white;
  border: none;
}

.btn-pdf:hover {
  background-color: #c82333;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.2);
}

.btn-export i {
  font-size: 1.2em;
}

.btn-icon {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
  margin: 0;
}

.btn-icon i {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.btn-icon.btn-edit {
  color: #2196f3; /* Azul para editar */
}
.btn-icon.btn-edit:hover {
  background-color: rgba(33,150,243,0.1);
}

.btn-icon.btn-view {
  color: #43a047; /* Verde para ver */
}
.btn-icon.btn-view:hover {
  background-color: rgba(67,160,71,0.1);
}

.btn-icon.btn-add {
  color: #ff9800; /* Naranja para agregar */
}
.btn-icon.btn-add:hover {
  background-color: rgba(255,152,0,0.1);
}

.ps-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.ps-badge {
  background-color: var(--primary-light);
  color: black;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
}

.table-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
}

.records-per-page {
  display: flex;
  align-items: center;
  gap: 10px;
}

.records-per-page label {
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 14px; /* Reducir tamaño de fuente */
}

.records-per-page select {
  width: auto; /* Ajustar ancho */
  padding: 6px 8px; /* Ajustar padding */
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: white;
  color: var(--text-primary);
  cursor: pointer;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background-color: var(--hover-color);
}

.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: var(--surface-color);
  border-top: 1px solid var(--border-color);
}

.pagination-info {
  color: var(--text-secondary);
  font-size: 0.9rem;
  background-color: white;
  padding: 8px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: white;
  padding: 8px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.page-info {
  color: var(--text-primary);
  font-weight: 500;
  padding: 0 10px;
}

.btn-outline {
  background: white;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  min-width: 40px;
}

.btn-outline:hover:not(:disabled) {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f5f5f5;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 0;
}

.data-table th {
  background-color: var(--surface-color);
  color: var(--text-primary);
  font-weight: 600;
  padding: 15px;
  text-align: left;
  border-bottom: 2px solid var(--border-color);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table td {
  padding: 12px 15px;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
  height: 52px; /* Altura fija para las filas */
}

.text-truncate {
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-responsive {
  overflow-x: auto;
  background-color: white;
  border-radius: 0 0 var(--border-radius) var(--border-radius);
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  min-width: 120px; /* Ancho mínimo para los botones de acción */
}

.column-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.column-title {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.column-title:hover {
  background-color: var(--hover-color);
}

.column-filter-container {
  position: relative;
}

.column-filter {
  width: 100%;
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  background-color: white;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.column-filter:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.1);
}

.column-filter::placeholder {
  color: var(--text-secondary);
  opacity: 0.7;
}

.data-table th {
  padding: 12px;
  vertical-align: top;
  background-color: var(--surface-color);
  border-bottom: 2px solid var(--border-color);
}

.data-table th i {
  margin-left: 4px;
  font-size: 0.9em;
  color: var(--text-secondary);
}

.sortable .column-title {
  color: var(--text-primary);
  font-weight: 600;
}

.sortable .column-title:hover {
  color: var(--primary-color);
}
</style>

 