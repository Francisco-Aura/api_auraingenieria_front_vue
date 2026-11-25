// Workmeter: widget de escritorio con el cronómetro de tareas de la intranet.
// Ventana sin marco, siempre encima, que arranca con Windows y recuerda su posición.
const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, session, powerMonitor } = require('electron');
const fs = require('fs');
const path = require('path');

const ANCHO = 340;
const ALTO_COMPLETO = 460;
const ALTO_MINIMO = 92; // rectángulo: título, tiempo y un botón
const MARGEN = 16;

const CONFIG_POR_DEFECTO = {
  // Dirección de la intranet (el widget añade /api). En desarrollo, el servidor de `npm run serve`.
  servidor: 'http://localhost:8080',
  usuario: null, // { id, nombre, nivelAcceso, ... } de la última sesión; la contraseña nunca se guarda
  modo: 'minimo', // 'minimo' (píldora) o 'completo' (lista de tareas)
  arrancarConWindows: true,
  inactividadMin: 2, // minutos sin teclado ni ratón tras los que se pausa el cronómetro (0 = no pausar)
  posicion: null // { x, y }
};

let config = { ...CONFIG_POR_DEFECTO };
let ventana = null;
let bandeja = null;
let saliendo = false;

// ---------- Configuración persistente ----------

function rutaConfig() {
  return path.join(app.getPath('userData'), 'config.json');
}

function cargarConfig() {
  try {
    const leida = JSON.parse(fs.readFileSync(rutaConfig(), 'utf8'));
    config = { ...CONFIG_POR_DEFECTO, ...leida };
  } catch (e) {
    config = { ...CONFIG_POR_DEFECTO };
  }
}

function guardarConfig() {
  try {
    fs.mkdirSync(path.dirname(rutaConfig()), { recursive: true });
    fs.writeFileSync(rutaConfig(), JSON.stringify(config, null, 2));
  } catch (e) {
    console.error('No se pudo guardar la configuración:', e);
  }
}

// ---------- Ventana ----------

function altoActual() {
  return config.modo === 'minimo' ? ALTO_MINIMO : ALTO_COMPLETO;
}

// Devuelve una posición que cae dentro de alguna pantalla (por si se desconectó el monitor donde estaba).
function posicionValida(pos, ancho, alto) {
  if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
    const visible = screen.getAllDisplays().some(d => {
      const a = d.workArea;
      return pos.x + ancho > a.x + 40 && pos.x < a.x + a.width - 40 &&
             pos.y + 40 > a.y && pos.y < a.y + a.height - 40;
    });
    if (visible) return pos;
  }
  const a = screen.getPrimaryDisplay().workArea;
  return { x: a.x + a.width - ancho - MARGEN, y: a.y + MARGEN };
}

function crearVentana() {
  const alto = altoActual();
  const pos = posicionValida(config.posicion, ANCHO, alto);

  ventana = new BrowserWindow({
    width: ANCHO,
    height: alto,
    x: pos.x,
    y: pos.y,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true, // vive en la bandeja, como un widget
    alwaysOnTop: true,
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // Nivel alto para que quede por encima de otras ventanas, también de las maximizadas.
  ventana.setAlwaysOnTop(true, 'screen-saver');
  ventana.setVisibleOnAllWorkspaces(true);
  ventana.setMenuBarVisibility(false);
  ventana.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  ventana.once('ready-to-show', () => ventana.show());

  // Recordar dónde la deja el usuario.
  ventana.on('moved', () => {
    const [x, y] = ventana.getPosition();
    config.posicion = { x, y };
    guardarConfig();
  });

  // Es un widget fijo: cerrarla (Alt+F4) solo la oculta; se sale desde la bandeja.
  ventana.on('close', e => {
    if (!saliendo) {
      e.preventDefault();
      ventana.hide();
    }
  });

  // Sin enlaces externos dentro del widget.
  ventana.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  ventana.webContents.on('will-navigate', e => e.preventDefault());
}

function mostrarVentana() {
  if (!ventana) return;
  if (!ventana.isVisible()) ventana.show();
  ventana.focus();
}

// Cambia el alto de la ventana sin moverla, salvo para que no se salga por abajo de la pantalla.
function ponerAlto(alto) {
  if (!ventana) return;
  const b = ventana.getBounds();
  const area = screen.getDisplayMatching(b).workArea;
  const y = Math.max(area.y, Math.min(b.y, area.y + area.height - alto));
  ventana.setBounds({ x: b.x, y, width: ANCHO, height: alto });
}

// persistir=false: cambio temporal (p. ej. se amplía para pedir el login, pero se recuerda la preferencia).
function ajustarModo(modo, persistir = true) {
  if (modo !== 'minimo' && modo !== 'completo') return;
  config.modo = modo;
  if (persistir) guardarConfig();
  ponerAlto(altoActual());
}

// ---------- Arranque con Windows ----------

function aplicarArranque() {
  // En desarrollo (electron.exe suelto) no se registra: solo la app instalada.
  if (!app.isPackaged) return;
  app.setLoginItemSettings({ openAtLogin: !!config.arrancarConWindows });
}

// ---------- Bandeja ----------

function crearBandeja() {
  const icono = nativeImage
    .createFromPath(path.join(__dirname, 'assets', 'icon.png'))
    .resize({ width: 16, height: 16 });
  bandeja = new Tray(icono);
  bandeja.setToolTip('Workmeter');
  bandeja.on('click', mostrarVentana);
  actualizarMenuBandeja();
}

function actualizarMenuBandeja() {
  if (!bandeja) return;
  bandeja.setContextMenu(Menu.buildFromTemplate([
    { label: 'Mostrar Workmeter', click: mostrarVentana },
    {
      label: 'Vista mínima',
      type: 'checkbox',
      checked: config.modo === 'minimo',
      click: item => {
        const modo = item.checked ? 'minimo' : 'completo';
        ajustarModo(modo);
        ventana && ventana.webContents.send('modo', modo);
      }
    },
    {
      label: 'Iniciar con Windows',
      type: 'checkbox',
      checked: !!config.arrancarConWindows,
      enabled: app.isPackaged,
      click: item => {
        config.arrancarConWindows = item.checked;
        guardarConfig();
        aplicarArranque();
      }
    },
    { type: 'separator' },
    { label: 'Salir', click: salir }
  ]));
}

// ---------- Inactividad ----------
// Avisa a la ventana de que el usuario lleva `segundos` sin trabajar (sin teclado/ratón, pantalla bloqueada o equipo
// suspendido) para que pause el cronómetro y el servidor recorte el tramo a ese momento.

let inactividadAvisada = false;
let sinActividadDesde = null; // bloqueo o suspensión: cuándo empezó

function avisarInactividad(segundos, motivo) {
  if (ventana && !ventana.isDestroyed()) ventana.webContents.send('inactividad', { segundos: Math.max(0, Math.round(segundos)), motivo });
}

function vigilarInactividad() {
  setInterval(() => {
    const limite = Number(config.inactividadMin) * 60;
    if (!(limite > 0)) return;
    const inactivo = powerMonitor.getSystemIdleTime();
    if (inactivo >= limite) {
      if (!inactividadAvisada) {
        inactividadAvisada = true;
        avisarInactividad(inactivo, 'inactividad');
      }
    } else {
      inactividadAvisada = false;
    }
  }, 15000);

  // Al bloquear o suspender se pausa ya; al volver se descuenta lo que estuvo fuera (la suspensión no deja hacer la llamada).
  const empezar = () => { if (sinActividadDesde == null) sinActividadDesde = Date.now(); };
  const terminar = motivo => {
    if (sinActividadDesde == null) return;
    const segundos = (Date.now() - sinActividadDesde) / 1000;
    sinActividadDesde = null;
    inactividadAvisada = false;
    if (segundos >= 30) avisarInactividad(segundos, motivo);
  };
  powerMonitor.on('lock-screen', () => { empezar(); avisarInactividad(0, 'bloqueo'); });
  powerMonitor.on('suspend', empezar);
  powerMonitor.on('unlock-screen', () => terminar('bloqueo'));
  powerMonitor.on('resume', () => terminar('suspension'));
}

function salir() {
  saliendo = true;
  app.quit();
}

// ---------- IPC ----------

ipcMain.handle('config:leer', () => ({
  servidor: config.servidor,
  usuario: config.usuario,
  modo: config.modo,
  empaquetada: app.isPackaged,
  version: app.getVersion()
}));

ipcMain.handle('config:servidor', (_e, servidor) => {
  const limpio = String(servidor || '').trim().replace(/\/+$/, '');
  if (!/^https?:\/\/[^\s/]+/i.test(limpio)) {
    return { ok: false, error: 'La dirección debe empezar por http:// o https://' };
  }
  config.servidor = limpio;
  guardarConfig();
  return { ok: true, servidor: config.servidor };
});

ipcMain.handle('sesion:guardar', (_e, usuario) => {
  config.usuario = usuario || null;
  guardarConfig();
});

ipcMain.handle('ventana:modo', (_e, modo, persistir) => {
  ajustarModo(modo, persistir !== false);
  actualizarMenuBandeja();
});

// Alto temporal de la píldora mientras se despliega el selector de tarea.
// (libre: también fuera de la vista mínima, para que login y ajustes no dejen espacio vacío)
ipcMain.handle('ventana:alto', (_e, alto, libre) => {
  const n = Number(alto);
  if ((config.modo !== 'minimo' && !libre) || !Number.isFinite(n)) return;
  ponerAlto(Math.max(ALTO_MINIMO, Math.min(Math.round(n), 400)));
});

ipcMain.handle('ventana:ocultar', () => ventana && ventana.hide());
ipcMain.handle('app:salir', salir);

// Las peticiones a la API van desde el proceso principal: así no hay CORS ni la página
// del widget necesita hablar con el servidor.
ipcMain.handle('api:peticion', async (_e, { metodo = 'GET', ruta, cuerpo }) => {
  // X-Requested-With: el backend rechaza sin ella cualquier petición que modifique datos (anti-CSRF).
  const cabeceras = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
  if (config.usuario && config.usuario.nombre) {
    // Misma cabecera que pone el front de la intranet en todas las peticiones.
    // Como el navegador, va el nombre tal cual si cabe en latin1 (acentos incluidos); si no, codificado.
    const nombre = String(config.usuario.nombre);
    cabeceras['X-Aura-Usuario-Nombre'] = /^[\u0000-ÿ]*$/.test(nombre) ? nombre : encodeURIComponent(nombre);
  }
  const opciones = { method: metodo, headers: cabeceras, signal: AbortSignal.timeout(15000) };
  if (cuerpo !== undefined) {
    cabeceras['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(cuerpo);
  }
  try {
    // La sesión del backend va en una cookie HttpOnly que fija el login: se usa el fetch de la sesión de
    // Electron (con su almacén de cookies, que la conserva entre arranques) y no el fetch global.
    opciones.credentials = 'include';
    const resp = await session.defaultSession.fetch(`${config.servidor}/api${ruta}`, opciones);
    const texto = await resp.text();
    if (ruta.startsWith('/usuarios/login')) await session.defaultSession.cookies.flushStore();
    let datos = null;
    try { datos = texto ? JSON.parse(texto) : null; } catch (err) { datos = texto; }
    return { ok: resp.ok, estado: resp.status, datos };
  } catch (err) {
    const sinRed = err && (err.name === 'TimeoutError' || err.name === 'AbortError' || err.cause);
    return { ok: false, estado: 0, datos: null, error: sinRed ? 'No se pudo conectar con el servidor' : String(err) };
  }
});

// ---------- Ciclo de vida ----------

const unica = app.requestSingleInstanceLock();
if (!unica) {
  app.quit();
} else {
  app.on('second-instance', mostrarVentana);

  app.whenReady().then(() => {
    cargarConfig();
    aplicarArranque();
    crearVentana();
    crearBandeja();
    vigilarInactividad();
  });

  // Es un widget residente: no sale al cerrar la ventana.
  app.on('window-all-closed', e => { if (!saliendo) e.preventDefault(); });
  app.on('before-quit', () => { saliendo = true; });
}
