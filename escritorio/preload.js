const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('workmeter', {
  leerConfig: () => ipcRenderer.invoke('config:leer'),
  guardarServidor: servidor => ipcRenderer.invoke('config:servidor', servidor),
  guardarSesion: usuario => ipcRenderer.invoke('sesion:guardar', usuario),
  api: (metodo, ruta, cuerpo) => ipcRenderer.invoke('api:peticion', { metodo, ruta, cuerpo }),
  fijarModo: (modo, persistir = true) => ipcRenderer.invoke('ventana:modo', modo, persistir),
  fijarAlto: (alto, libre = false) => ipcRenderer.invoke('ventana:alto', alto, libre),
  ocultar: () => ipcRenderer.invoke('ventana:ocultar'),
  salir: () => ipcRenderer.invoke('app:salir'),
  alCambiarModo: fn => ipcRenderer.on('modo', (_e, valor) => fn(valor))
});
