// Lógica del widget. Habla con la API de la intranet a través del proceso principal (window.workmeter).
(() => {
  'use strict';

  const api = window.workmeter;
  const $ = id => document.getElementById(id);

  const REFRESCO_MS = 30000;

  const estado = {
    config: null,
    usuario: null,
    estados: [],        // estados del módulo de tareas
    tareas: [],         // tareas del usuario no finalizadas, con `_base` (s) y `_recibida` (ms) para el cronómetro
    ocupado: false,     // hay un cambio de estado en marcha
    vistaAnterior: 'login',
    avisoTimer: null,
    confirmarFin: null,
    modo: 'minimo',          // modo que se ve ahora ('minimo' = píldora, 'completo' = lista)
    modoPreferido: 'minimo', // el que elige el usuario; el login fuerza 'completo' sin cambiarlo
    selectorAbierto: false,
    miniAviso: ''            // error que se muestra en la píldora (no cabe el recuadro rojo)
  };

  const MAX_FILAS_SELECTOR = 6;
  const ALTO_FILA_SELECTOR = 34;
  const ALTO_MINIMO = 92; // igual que en main.js

  // ---------- Utilidades ----------

  function formatoTiempo(segundos) {
    const s = Math.max(0, Math.floor(segundos));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    return [h, m, r].map(n => String(n).padStart(2, '0')).join(':');
  }

  function formatoCorto(segundos) {
    const s = Math.max(0, Math.floor(segundos));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`;
  }

  function mostrarAviso(texto, ms = 5000) {
    const el = $('aviso');
    el.textContent = texto;
    el.hidden = false;
    estado.miniAviso = texto;
    clearTimeout(estado.avisoTimer);
    estado.avisoTimer = setTimeout(() => { el.hidden = true; estado.miniAviso = ''; pintarMini(); ajustarAltoFormulario(); }, ms);
    pintarMini();
    ajustarAltoFormulario();
  }

  function ocultarAviso() {
    clearTimeout(estado.avisoTimer);
    $('aviso').hidden = true;
    estado.miniAviso = '';
    pintarMini();
    ajustarAltoFormulario();
  }

  function mostrarVista(nombre) {
    for (const id of ['login', 'principal', 'ajustes']) $(`vista-${id}`).hidden = id !== nombre;
    if (nombre !== 'ajustes') estado.vistaAnterior = nombre;
    // Entrar o ajustar necesita sitio: la píldora se amplía por esta vez, sin perder la preferencia.
    if (nombre !== 'principal' && estado.modo === 'minimo') aplicarModo('completo', false);
    if (nombre === 'principal' && estado.modo !== estado.modoPreferido) aplicarModo(estado.modoPreferido);
    $('widget').classList.toggle('formulario', nombre !== 'principal');
    if (nombre === 'principal') api.fijarModo(estado.modo, false); // vuelve al alto normal
    else ajustarAltoFormulario();
  }

  // Login y ajustes: la ventana mide lo que su contenido, sin hueco vacío debajo.
  function ajustarAltoFormulario() {
    setTimeout(() => {
      if (!$('widget').classList.contains('formulario')) return;
      const alto = [...$('widget').children].reduce((t, el) => t + (el.hidden ? 0 : el.offsetHeight), 0);
      api.fijarAlto(alto + 14, true);
    }, 0);
  }

  // ---------- Modo: mínimo (píldora) o completo ----------

  function ponerModoVisual(modo) {
    estado.modo = modo;
    $('widget').classList.toggle('minimo', modo === 'minimo');
    cerrarSelector();
  }

  // persistir=false: cambio temporal (la preferencia guardada no se toca).
  function aplicarModo(modo, persistir = true) {
    ponerModoVisual(modo);
    if (persistir) estado.modoPreferido = modo;
    api.fijarModo(modo, persistir);
  }

  // Llamada a la API. Un 401 fuera del login es sesión caducada o cerrada en el servidor:
  // se vuelve a la pantalla de entrada (como hace la intranet).
  async function llamar(metodo, ruta, cuerpo) {
    const r = await api.api(metodo, ruta, cuerpo);
    if (r.estado === 401 && !ruta.startsWith('/usuarios/login') && estado.usuario) {
      await api.guardarSesion(null);
      ponerUsuario(null);
      estado.tareas = [];
      pintar();
      mostrarVista('login');
      mostrarAviso('La sesión ha caducado. Vuelve a entrar.', 8000);
    }
    return r;
  }

  // Convierte una respuesta fallida en un mensaje legible.
  function mensajeError(resp, porDefecto) {
    if (resp.error) return resp.error;
    const d = resp.datos;
    if (d && typeof d === 'object' && (d.error || d.message)) return d.error || d.message;
    if (typeof d === 'string' && d.length < 140) return d;
    return `${porDefecto} (error ${resp.estado})`;
  }

  // ---------- Estados de las tareas ----------

  const estadoQueCuenta = () => estado.estados.find(e => e.cuentaTiempo && !e.estadoFinal);
  const estadoFinal = () => estado.estados.find(e => e.estadoFinal);
  // «Pausar» devuelve la tarea al estado de espera (el que ni cuenta tiempo, ni bloquea, ni cierra).
  const estadoEspera = () => estado.estados.find(e => !e.cuentaTiempo && !e.estadoBloqueo && !e.estadoFinal);

  const estaCorriendo = t => !!estado.estados.find(e => e.id === t.estadoId && e.cuentaTiempo);

  function segundosActuales(t) {
    const base = t._base || 0;
    return estaCorriendo(t) ? base + (Date.now() - t._recibida) / 1000 : base;
  }

  // ---------- Carga de datos ----------

  async function cargarEstados() {
    const r = await llamar('GET', '/tareas/estados');
    if (!r.ok) throw new Error(mensajeError(r, 'No se pudieron cargar los estados'));
    estado.estados = Array.isArray(r.datos) ? r.datos : [];
    if (!estadoQueCuenta()) throw new Error('El módulo de tareas no tiene un estado que cuente tiempo');
  }

  async function cargarTareas({ silencioso = false } = {}) {
    if (!estado.usuario) return;
    // Si al entrar no había estados (módulo sin configurar), se reintenta en cada refresco.
    if (!estado.estados.length) {
      try { await cargarEstados(); } catch (e) { if (!silencioso && estado.usuario) mostrarAviso(e.message); return; }
    }
    const r = await llamar('GET', `/tareas/usuario/${estado.usuario.id}`);
    if (!estado.usuario) return; // sesión caducada: llamar() ya avisó y volvió al login
    if (!r.ok) {
      if (!silencioso) mostrarAviso(mensajeError(r, 'No se pudieron cargar las tareas'));
      return;
    }
    const ahora = Date.now();
    estado.tareas = (Array.isArray(r.datos) ? r.datos : [])
      .filter(t => !t.estadoFinal)
      .map(t => ({ ...t, _base: t.duracionActivaSegundos || 0, _recibida: ahora }));
    if (!silencioso) ocultarAviso();
    pintar();
  }

  // ---------- Acciones ----------

  async function cambiarEstado(tarea, destino) {
    const r = await llamar('PATCH', `/tareas/${tarea.id}/estado`, {
      estadoId: destino.id,
      usuarioAccionId: estado.usuario.id
    });
    if (!r.ok) throw new Error(mensajeError(r, 'No se pudo cambiar el estado'));
  }

  async function ejecutar(accion) {
    if (estado.ocupado) return;
    estado.ocupado = true;
    pintar();
    try {
      await accion();
    } catch (e) {
      mostrarAviso(e.message || String(e));
    } finally {
      estado.ocupado = false;
      await cargarTareas({ silencioso: true });
    }
  }

  const tareaEnCurso = () => estado.tareas.find(estaCorriendo);

  // La píldora «reanuda» la última tarea con la que se trabajó.
  function recordarUltima(id) {
    try { localStorage.setItem('workmeter.ultima', String(id)); } catch (e) { /* sin almacenamiento: da igual */ }
  }

  function tareaParaReanudar() {
    let ultima = null;
    try { ultima = Number(localStorage.getItem('workmeter.ultima')); } catch (e) { /* idem */ }
    const posibles = estado.tareas.filter(t => !t.estadoBloqueo);
    return posibles.find(t => t.id === ultima) || ordenar(posibles)[0] || null;
  }

  function iniciar(tarea) {
    recordarUltima(tarea.id);
    return ejecutar(async () => {
      // Un solo cronómetro a la vez: las que estuvieran en curso (también las iniciadas desde la
      // intranet) pasan a espera.
      const otras = estado.tareas.filter(t => estaCorriendo(t) && t.id !== tarea.id);
      if (otras.length) {
        const espera = estadoEspera();
        if (!espera) throw new Error('No hay un estado de espera al que pasar la tarea en curso');
        for (const otra of otras) await cambiarEstado(otra, espera);
      }
      await cambiarEstado(tarea, estadoQueCuenta());
    });
  }

  function pausar(tarea) {
    recordarUltima(tarea.id);
    return ejecutar(async () => {
      const espera = estadoEspera();
      if (!espera) throw new Error('No hay un estado de espera al que pasar la tarea');
      await cambiarEstado(tarea, espera);
    });
  }

  function finalizar(tarea) {
    return ejecutar(async () => {
      const fin = estadoFinal();
      if (!fin) throw new Error('No hay un estado final en el módulo de tareas');
      await cambiarEstado(tarea, fin);
    });
  }

  // ---------- Prioridad (mismos niveles y colores que la tabla de la intranet) ----------

  const PRIORIDADES = { 0: ['Urgente', '⚠'], 1: ['Alta', '▲'], 2: ['Media', '–'], 3: ['Baja', '▼'] };

  // Chip de prioridad; con corto=true solo el icono (el texto va en el tooltip).
  function chipPrioridad(t, corto = false) {
    const n = PRIORIDADES[t.prioridad] ? t.prioridad : 2;
    const [texto, icono] = PRIORIDADES[n];
    return `<span class="prio prio-${n}" title="Prioridad ${texto.toLowerCase()}">${icono}${corto ? '' : ' ' + texto}</span>`;
  }

  // ---------- Pintado ----------

  function textoVencimiento(t) {
    if (!t.fechaVencimiento) return '';
    const f = new Date(t.fechaVencimiento);
    if (isNaN(f)) return '';
    const txt = f.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    return t.vencida ? `<span class="vencida">Vencida ${txt}</span>` : `Vence ${txt}`;
  }

  function escapar(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function ordenar(tareas) {
    return [...tareas].sort((a, b) => {
      if (estaCorriendo(a) !== estaCorriendo(b)) return estaCorriendo(a) ? -1 : 1;
      if ((a.prioridad ?? 2) !== (b.prioridad ?? 2)) return (a.prioridad ?? 2) - (b.prioridad ?? 2);
      const va = a.fechaVencimiento ? new Date(a.fechaVencimiento).getTime() : Infinity;
      const vb = b.fechaVencimiento ? new Date(b.fechaVencimiento).getTime() : Infinity;
      return va - vb;
    });
  }

  function pintar() {
    const enCurso = tareaEnCurso();

    $('punto').classList.toggle('activo', !!enCurso);
    $('actual').classList.toggle('corriendo', !!enCurso);
    $('actual-botones').hidden = !enCurso;
    if (enCurso) {
      $('actual-etiqueta').textContent = 'En curso';
      $('actual-titulo').textContent = enCurso.titulo;
      $('actual-titulo').title = enCurso.titulo;
    } else {
      $('actual-etiqueta').textContent = 'Sin tarea en curso';
      $('actual-titulo').textContent = 'Pulsa ▶ en una tarea para empezar';
      $('actual-titulo').title = '';
    }
    $('btn-pausar').disabled = estado.ocupado;
    $('btn-finalizar').disabled = estado.ocupado;
    $('btn-finalizar').textContent = estado.confirmarFin === (enCurso && enCurso.id) ? '¿Seguro?' : 'Finalizar';

    const filtro = $('filtro').value.trim().toLowerCase();
    const visibles = ordenar(estado.tareas).filter(t =>
      !filtro || [t.titulo, t.clienteRelacionadoNombre, t.clientePotencialNombre, t.categoriaNombre]
        .some(v => v && String(v).toLowerCase().includes(filtro)));

    const lista = $('lista');
    if (!visibles.length) {
      lista.innerHTML = `<li class="vacio">${estado.tareas.length ? 'Ninguna tarea coincide.' : 'No tienes tareas pendientes.'}</li>`;
    } else {
      lista.innerHTML = visibles.map(t => {
        const corriendo = estaCorriendo(t);
        const cliente = t.clienteRelacionadoNombre || t.clientePotencialNombre || '';
        // El vencimiento va primero: es lo que no debe quedar cortado en una línea estrecha.
        const meta = [chipPrioridad(t), textoVencimiento(t), escapar(t.estadoNombre), cliente && escapar(cliente)].filter(Boolean).join(' · ');
        return `
          <li class="tarea${corriendo ? ' corriendo' : ''}" data-id="${t.id}" style="--color:${escapar(t.estadoColor || '')}">
            <div class="tarea-info">
              <div class="tarea-titulo" title="${escapar(t.titulo)}">${escapar(t.titulo)}</div>
              <div class="tarea-meta">${meta}</div>
            </div>
            <span class="tarea-tiempo" data-tiempo="${t.id}">${formatoCorto(segundosActuales(t))}</span>
            <button class="btn-play${corriendo ? ' parar' : ''}" data-accion="${corriendo ? 'pausar' : 'iniciar'}"
              title="${corriendo ? 'Pausar' : 'Iniciar cronómetro'}" ${estado.ocupado ? 'disabled' : ''}>${corriendo ? '❚❚' : '▶'}</button>
          </li>`;
      }).join('');
    }
    pintarMini();
    pintarCronometro();
  }

  // Píldora: la tarea en curso (o la que se reanudaría), su tiempo y un solo botón.
  function pintarMini() {
    const enCurso = tareaEnCurso();
    const objetivo = enCurso || tareaParaReanudar();
    const mini = $('mini');
    mini.classList.toggle('corriendo', !!enCurso);
    mini.classList.toggle('pausa', !enCurso);
    mini.classList.toggle('error', !!estado.miniAviso);
    $('mini-punto').classList.toggle('activo', !!enCurso);

    const prio = $('mini-prio');
    prio.hidden = !objetivo || !!estado.miniAviso;
    if (objetivo) prio.innerHTML = chipPrioridad(objetivo);

    const titulo = estado.miniAviso || (objetivo ? objetivo.titulo : 'Sin tareas pendientes');
    $('mini-titulo').textContent = titulo;
    $('mini-info').title = estado.miniAviso || (objetivo ? `${objetivo.titulo} — cambiar de tarea` : 'Cambiar de tarea');

    const play = $('mini-play');
    play.textContent = enCurso ? '❚❚ Pausar' : '▶ Reanudar';
    play.title = enCurso ? 'Pausar' : (objetivo ? `Reanudar: ${objetivo.titulo}` : 'Sin tareas');
    play.setAttribute('aria-label', enCurso ? 'Pausar' : 'Reanudar');
    play.disabled = estado.ocupado || !objetivo;

    if (estado.selectorAbierto) pintarSelector();
  }

  // Selector de tarea de la píldora: unas pocas filas (la en curso, luego por prioridad); si hay más, se sigue en la vista completa.
  function abrirSelector() {
    if (estado.modo !== 'minimo' || !estado.tareas.length) return;
    estado.selectorAbierto = true;
    $('mini-info').setAttribute('aria-expanded', 'true');
    pintarSelector();
  }

  function cerrarSelector() {
    if (!estado.selectorAbierto) return;
    estado.selectorAbierto = false;
    $('mini-lista').hidden = true;
    $('mini-info').setAttribute('aria-expanded', 'false');
    api.fijarAlto(0); // vuelve al alto de la píldora
  }

  function pintarSelector() {
    const todas = ordenar(estado.tareas);
    const filas = todas.slice(0, MAX_FILAS_SELECTOR);
    const hayMas = todas.length > filas.length;
    $('mini-lista').innerHTML = filas.map(t => {
      const corriendo = estaCorriendo(t);
      return `<li class="${corriendo ? 'corriendo' : ''}" data-id="${t.id}" style="--color:${escapar(t.estadoColor || '')}"
                title="${escapar(t.titulo)}">
                <span class="ml-titulo">${escapar(t.titulo)}</span>
                ${chipPrioridad(t, true)}
                <span class="ml-tiempo" data-ml-tiempo="${t.id}">${formatoCorto(segundosActuales(t))}</span>
              </li>`;
    }).join('') + `<li class="ml-mas" data-mas="1">${hayMas ? `Ver las ${todas.length} tareas` : 'Vista completa'} ›</li>`;
    $('mini-lista').hidden = false;
    api.fijarAlto(ALTO_MINIMO + 12 + (filas.length + 1) * ALTO_FILA_SELECTOR);
  }

  // Se llama cada segundo: solo toca los textos que cambian.
  function pintarCronometro() {
    const enCurso = tareaEnCurso();
    const objetivo = enCurso || tareaParaReanudar();
    $('cronometro').textContent = formatoTiempo(enCurso ? segundosActuales(enCurso) : 0);
    $('mini-crono').textContent = formatoTiempo(objetivo ? segundosActuales(objetivo) : 0);
    for (const t of estado.tareas) {
      const ml = document.querySelector(`[data-ml-tiempo="${t.id}"]`);
      if (ml) ml.textContent = formatoCorto(segundosActuales(t));
    }
    for (const t of estado.tareas) {
      const el = document.querySelector(`[data-tiempo="${t.id}"]`);
      if (el) el.textContent = formatoCorto(segundosActuales(t));
    }
  }

  // ---------- Sesión ----------

  function ponerUsuario(usuario) {
    estado.usuario = usuario;
    $('usuario').textContent = usuario ? usuario.nombre : '';
  }

  async function entrarEnPrincipal() {
    mostrarVista('principal');
    try {
      await cargarEstados();
      await cargarTareas();
    } catch (e) {
      // Si la sesión había caducado, ya se avisó y se volvió al login.
      if (estado.usuario) mostrarAviso(e.message || String(e), 8000);
    }
  }

  async function iniciarSesion(ev) {
    ev.preventDefault();
    const boton = $('login-enviar');
    boton.disabled = true;
    boton.textContent = 'Entrando…';
    ocultarAviso();
    try {
      const user = $('login-usuario').value.trim();
      const pass = $('login-clave').value;
      // El backend actual abre la sesión con POST (cookie); uno anterior solo tenía GET con la clave en la URL.
      let r = await api.api('POST', '/usuarios/login', { user, pass });
      if (r.estado === 404 || r.estado === 405) {
        r = await api.api('GET', `/usuarios/login?user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}`);
      }
      if (r.ok && r.datos && r.datos.id != null) {
        $('login-clave').value = '';
        const usuario = r.datos;
        await api.guardarSesion(usuario);
        ponerUsuario(usuario);
        await entrarEnPrincipal();
      } else if (r.estado === 401) {
        mostrarAviso('Usuario o contraseña incorrectos');
      } else {
        mostrarAviso(mensajeError(r, 'No se pudo iniciar sesión'));
      }
    } finally {
      boton.disabled = false;
      boton.textContent = 'Entrar';
    }
  }

  async function cerrarSesion() {
    await api.api('POST', '/usuarios/logout'); // cierra la sesión del servidor; si falla, da igual
    await api.guardarSesion(null);
    ponerUsuario(null);
    estado.tareas = [];
    pintar();
    mostrarVista('login');
  }

  // ---------- Ajustes ----------

  function abrirAjustes() {
    $('ajustes-servidor').value = estado.config.servidor;
    $('btn-cerrar-sesion').hidden = !estado.usuario;
    mostrarVista('ajustes');
  }

  async function guardarAjustes(ev) {
    ev.preventDefault();
    const r = await api.guardarServidor($('ajustes-servidor').value);
    if (!r.ok) return mostrarAviso(r.error);
    estado.config.servidor = r.servidor;
    $('login-servidor').textContent = r.servidor;
    ocultarAviso();
    mostrarVista(estado.vistaAnterior);
    if (estado.usuario) entrarEnPrincipal();
  }

  // ---------- Arranque ----------

  async function init() {
    estado.config = await api.leerConfig();
    $('login-servidor').textContent = estado.config.servidor;
    $('version').textContent = `Workmeter ${estado.config.version}`;
    estado.modoPreferido = estado.config.modo === 'completo' ? 'completo' : 'minimo';
    ponerModoVisual(estado.modoPreferido); // la ventana ya nace con ese alto (main.js)

    // Eventos
    $('form-login').addEventListener('submit', iniciarSesion);
    $('login-cambiar').addEventListener('click', ev => { ev.preventDefault(); abrirAjustes(); });
    $('btn-ajustes').addEventListener('click', abrirAjustes);
    $('ajustes-volver').addEventListener('click', () => mostrarVista(estado.vistaAnterior));
    $('form-ajustes').addEventListener('submit', guardarAjustes);
    $('btn-cerrar-sesion').addEventListener('click', cerrarSesion);
    $('btn-salir').addEventListener('click', () => api.salir());
    $('btn-ocultar').addEventListener('click', () => api.ocultar());
    $('btn-minimo').addEventListener('click', () => aplicarModo('minimo'));
    $('mini-expandir').addEventListener('click', () => aplicarModo('completo'));
    // Cambio hecho desde el menú de la bandeja: main ya ha ajustado la ventana.
    api.alCambiarModo(modo => { estado.modoPreferido = modo; ponerModoVisual(modo); });

    // Píldora: un botón que pausa la tarea en curso o reanuda la última; el título abre el selector.
    $('mini-play').addEventListener('click', () => {
      const enCurso = tareaEnCurso();
      if (enCurso) return pausar(enCurso);
      const objetivo = tareaParaReanudar();
      if (objetivo) iniciar(objetivo);
    });
    $('mini-info').addEventListener('click', () => (estado.selectorAbierto ? cerrarSelector() : abrirSelector()));
    $('mini-lista').addEventListener('click', ev => {
      const fila = ev.target.closest('li');
      if (!fila) return;
      if (fila.dataset.mas) return aplicarModo('completo');
      const tarea = estado.tareas.find(t => String(t.id) === fila.dataset.id);
      cerrarSelector();
      if (tarea && !estaCorriendo(tarea)) iniciar(tarea);
    });
    document.addEventListener('click', ev => {
      if (estado.selectorAbierto && !ev.target.closest('#mini-lista, #mini-info')) cerrarSelector();
    });
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape') cerrarSelector(); });
    window.addEventListener('blur', cerrarSelector);

    $('btn-refrescar').addEventListener('click', () => cargarTareas());
    $('filtro').addEventListener('input', pintar);

    $('lista').addEventListener('click', ev => {
      const boton = ev.target.closest('button[data-accion]');
      if (!boton) return;
      const tarea = estado.tareas.find(t => String(t.id) === boton.closest('.tarea').dataset.id);
      if (!tarea) return;
      boton.dataset.accion === 'iniciar' ? iniciar(tarea) : pausar(tarea);
    });

    $('btn-pausar').addEventListener('click', () => { const t = tareaEnCurso(); if (t) pausar(t); });
    $('btn-finalizar').addEventListener('click', () => {
      const t = tareaEnCurso();
      if (!t) return;
      // Doble pulsación para no cerrar una tarea por error.
      if (estado.confirmarFin === t.id) {
        estado.confirmarFin = null;
        finalizar(t);
      } else {
        estado.confirmarFin = t.id;
        pintar();
        setTimeout(() => { if (estado.confirmarFin === t.id) { estado.confirmarFin = null; pintar(); } }, 3000);
      }
    });

    // Cronómetro y refresco periódico (los cambios hechos desde la intranet también se ven aquí).
    setInterval(pintarCronometro, 1000);
    setInterval(() => { if (estado.usuario && !estado.ocupado) cargarTareas({ silencioso: true }); }, REFRESCO_MS);
    window.addEventListener('focus', () => { if (estado.usuario && !estado.ocupado) cargarTareas({ silencioso: true }); });

    if (estado.config.usuario && estado.config.usuario.id != null) {
      ponerUsuario(estado.config.usuario);
      await entrarEnPrincipal();
    } else {
      mostrarVista('login');
    }
  }

  init();
})();
