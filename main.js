// Modules to control application life and create native browser window
const { Console } = require('console')
const {app, BrowserWindow, Menu, MenuItem, globalShortcut, webContents} = require('electron')
const { webFrame } = require('electron/renderer')
const path = require('path')
const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fetch = require('cross-fetch'); // required 'fetch'

async function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    icon: __dirname + '/typhon_gradient.ico',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
    }
  })

  let blocker = await ElectronBlocker.fromPrebuiltAdsOnly(fetch);
  blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);

  blocker.enableBlockingInSession(mainWindow.webContents.session);

  mainWindow.setMenu(null)

  // and load the index.html of the app.
  mainWindow.loadFile("index.html")

  // Open the DevTools.
  mainWindow.webContents.openDevTools()
}

// const menu = new Menu()
// menu.append(new MenuItem({
//   label: 'Electron',
//   submenu: [{
//     role: 'help',
//     accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Alt+Shift+I',
//     click: () => { console.log('Electron rocks!') }
//   }]
// }))

// Menu.setApplicationMenu(menu)

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  globalShortcut.register('Alt+CommandOrControl+I', () => {
    webFrame.openDevTools()
  })
}).then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
