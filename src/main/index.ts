import { app, BrowserWindow } from 'electron';
import path from 'path';
import { registerDragHandler } from './ipc/dragHandler';
import { registerDDragonHandler } from './ipc/ddragonHandler';
import { registerUpscalerHandler } from './ipc/upscalerHandler';

let mainWindow: BrowserWindow | null = null;
let currentActiveVersion = '14.24.1'; // Updated dynamically on launch

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1040,
    minHeight: 700,
    title: 'League Asset Vault - LoL High-Res Asset Library',
    backgroundColor: '#070b12',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  // Register IPC services
  registerDragHandler(() => currentActiveVersion);
  registerDDragonHandler(
    () => currentActiveVersion,
    (v: string) => {
      currentActiveVersion = v;
    }
  );
  registerUpscalerHandler(
    () => currentActiveVersion,
    () => mainWindow
  );

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
