const { app, BrowserWindow } = require('electron');
const path = require('path');
const log = require('electron-log');

// Redirect console to electron-log
console.log = log.info;
console.error = log.error;
log.info('Electron main process started');

// Start Koa server
require('./main');   // this starts server on port 3001

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Load your Koa app
    win.loadURL('http://localhost:3001/app/login');

    // Open DevTools for debugging
 //   win.webContents.openDevTools();

    // Capture renderer console logs
   // win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    //    log.info(`[Renderer] ${message} (line: ${line})`);
    //});
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});