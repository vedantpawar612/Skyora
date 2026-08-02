const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('skyoraDesktop', {
  platform: process.platform,
});
