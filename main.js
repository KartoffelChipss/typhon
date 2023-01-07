// Modules to control application life and create native browser window
const { Console } = require('console')
const {app, BrowserWindow, Menu, MenuItem, globalShortcut, webContents} = require('electron')
const { webFrame, ipcRenderer } = require('electron/renderer')
const path = require('path')
const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fetch = require('cross-fetch'); // required 'fetch'
const { ipcMain } = require('electron/main');

var loadingwindow = null;

async function createWindow() {
  // Create the browser window.
  
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  loadingwindow = new BrowserWindow({
    width: 300,
    height: 300,
    frame : false,
    movable : false,
    resizable: false,
    backgroundColor: "#2D2D2D",
    icon: __dirname + '/typhon_gradient.ico',
  })

  loadingwindow.loadFile('loading.html') // To load the activity loader html file
  loadingwindow.show();

  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    frame: false,
    show: false,
    autoHideMenuBar: true,
    icon: __dirname + '/typhon_gradient.ico',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
    }
  })

  let blocker = await ElectronBlocker.fromPrebuiltAdsOnly(fetch);
  blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);

  blocker.enableBlockingInSession(mainWindow.webContents.session);

  mainWindow.setMenu(null)

  const menu = new Menu()
  menu.append(new MenuItem({
    label: 'Webseite',
    submenu: [
    // {
    //   role: 'devtools',
    //   label: "Developer Tools (Not for Users)",
    //   accelerator: 'Alt+CommandOrControl+I',
    //   click: () => {
    //     mainWindow.webContents.isDevToolsOpened() ? mainWindow.webContents.closeDevTools() : mainWindow.webContents.openDevTools();
    //   }
    // },
    {
      role: 'newTab',
      label: "Neuer Tab",
      accelerator: 'CommandOrControl+T',
      click: () => {
        mainWindow.webContents.send("newTab");
      }
    },
    {
      role: 'newWindow',
      label: "Neues Fenster",
      accelerator: 'CommandOrControl+N',
      click: () => {
        createWindow();
      }
    },
    {
      role: 'reloadPage',
      label: "Seite neu laden",
      accelerator: 'CommandOrControl+R',
      click: () => {
        mainWindow.webContents.send("reloadPage");
      }
    },
    {
      role: 'reloadPageWithoutcache',
      label: "Seite ohne cache neu laden",
      accelerator: 'Shift+R',
      click: () => {
        mainWindow.webContents.send("reloadPageWithoutcache");
      }
    },
    {
      role: 'goBack',
      label: "Zuück",
      accelerator: 'CommandOrControl+Left',
      click: () => {
        mainWindow.webContents.send("goBack");
      }
    },
    {
      role: 'goForward',
      label: "Weiter",
      accelerator: 'CommandOrControl+Right',
      click: () => {
        mainWindow.webContents.send("goForward");
      }
    },
    {
      role: 'goToUrlbar',
      label: "Zur Adressleiste wechseln",
      accelerator: 'Alt+D',
      click: () => {
        mainWindow.webContents.send("goToUrlbar");
      }
    },
    {
      role: 'openDevTools',
      label: "DevTools öffnen",
      accelerator: 'CommandOrControl+Alt+D',
      click: () => {
        mainWindow.webContents.send("openWVDevTools");
      }
    }]
  }))
  
  Menu.setApplicationMenu(menu)

  // and load the index.html of the app.
  mainWindow.loadFile("index.html")

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  ipcMain.on("minimize", () => {
    mainWindow.isMinimized() ? mainWindow.restore() : mainWindow.minimize()
  })

  ipcMain.once("firstTabReady", () => {
    console.log("first tab ready recieved");
    mainWindow.show();
    loadingwindow.hide();
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

ipcMain.on("close", () => {
  app.quit()
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
