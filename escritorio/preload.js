const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('workmeeter', {
  leerConfig: () => ipcRenderer.invoke('config:leer'),
  guardarServidor: servidor => ipcRenderer.invoke('config:servidor', servidor),
  guardarSesion: usuario => ipcRenderer.invoke('sesion:guardar', usuario),
  api: (metodo, ruta, cuerpo) => ipcRenderer.invoke('api:peticion', { metodo, ruta, cuerpo }),
  fijarCompacto: compacto => ipcRenderer.invoke('ventana:compacto', compacto),
  ocultar: () => ipcRenderer.invoke('ventana:ocultar'),
  salir: () => ipcRenderer.invoke('app:salir'),
  alCambiarCompacto: fn => ipcRenderer.on('compacto', (_e, valor) => fn(valor))
});
