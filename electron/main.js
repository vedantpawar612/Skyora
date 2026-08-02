const { app, BrowserWindow, protocol, session, shell, net, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const DIST = path.join(__dirname, '..', 'dist');
const START_URL = process.env.ELECTRON_START_URL;
const isDev = Boolean(START_URL);

// Must run before app.whenReady(). `standard` gives app:// a real origin so
// localStorage / IndexedDB (Firebase auth persistence) work; `supportFetchAPI`
// lets MediaPipe's FilesetResolver fetch the bundled WASM.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true,
    },
  },
]);

function registerAppProtocol() {
  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    const pathname = path.normalize(decodeURIComponent(url.pathname));
    let target = path.join(DIST, pathname);
    if (!target.startsWith(DIST)) {
      return new Response('forbidden', { status: 403 });
    }
    if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      target = path.join(DIST, 'index.html'); // SPA fallback
    }
    return net.fetch(pathToFileURL(target).toString());
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0A0E21',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.once('ready-to-show', () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.loadURL(START_URL || 'app://skyora/');
  return win;
}

app.whenReady().then(() => {
  if (!isDev) {
    Menu.setApplicationMenu(null);
    registerAppProtocol();
  }

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(permission === 'media');
  });
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => permission === 'media');

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
