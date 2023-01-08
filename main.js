// Modules to control application life and create native browser window
const { Console } = require('console')
const {app, BrowserWindow, Menu, MenuItem, globalShortcut, webContents, screen} = require('electron')
const { webFrame, ipcRenderer } = require('electron/renderer')
const path = require('path')
const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fetch = require('cross-fetch'); // required 'fetch'
const { ipcMain } = require('electron/main');
const Store = require('electron-store');

var loadingwindow = null;
let rightClickPosition = null;

const store = new Store();

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
    icon: __dirname + '/assets/typhon_gradient_max.ico',
  })

  loadingwindow.loadFile('loading.html') // To load the activity loader html file
  loadingwindow.show();

  const screenHeight = screen.getPrimaryDisplay().workAreaSize.height;
  const screenWidth = screen.getPrimaryDisplay().workAreaSize.width;

  let bounds = {};
  let pastBounds = store.get("lastBounds");
  if (pastBounds) {
    bounds = {
      height: pastBounds.height,
      width: pastBounds.width,
      y: pastBounds.y,
      x: pastBounds.x,
    }
  } else {
    bounds = {
      height: Math.floor(screenHeight * 0.8),
      width: Math.floor(screenWidth * 0.6),
      y: (screenHeight / 2) - (Math.floor(screenHeight * 0.8) / 2),
      x: (screenWidth / 2) - (Math.floor(screenWidth * 0.6) / 2),
    }
  }

  const mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    y: bounds.y,
    x: bounds.x,
    frame: false,
    show: false,
    autoHideMenuBar: true,
    icon: __dirname + '/assets/typhon_gradient_max.ico',
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
      role: 'searchOnPage',
      label: "Auf dieser Seite suchen",
      accelerator: 'CommandOrControl+F',
      click: () => {
        mainWindow.webContents.send('find_request', '');
      }
    },
    {
      role: 'openDevTools',
      label: "DevTools öffnen",
      accelerator: 'CommandOrControl+Alt+D',
      click: () => {
        mainWindow.webContents.send("openWVDevTools");
      }
    },
    {
      role: 'deleteStorage',
      label: "Alle gespeicherten Daten löschen",
      accelerator: 'CommandOrControl+Shift+Alt+Delete',
      click: () => {
        store.delete("lastBounds");
        store.delete("lastTabs");
        console.log("Deleted Data");
      }
    }]
  }))
  
  Menu.setApplicationMenu(menu)

  // Rightclickmenu
  const rightClickMenu = new Menu();
  const rightClickMenuItem = new MenuItem({
    label: "Untersuchen",
    click: () => {
      mainWindow.webContents.send("inspectelement");
    }
  });
  rightClickMenu.append(rightClickMenuItem);

  ipcMain.on("show-context-menu", (e) => {
    rightClickMenu.popup(BrowserWindow.fromWebContents(e.sender));
  })

  mainWindow.loadFile("index.html")

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  ipcMain.on("minimize", () => {
    mainWindow.isMinimized() ? mainWindow.restore() : mainWindow.minimize();
  });

  ipcMain.on("maximize", () => {
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  });

  const previouslyOpenTabs = store.get("lastTabs");

  mainWindow.once("ready-to-show", () => {
    if (!previouslyOpenTabs || previouslyOpenTabs.length <= 0) {
      console.log("No previous tabs found!")
      mainWindow.webContents.send("noPreviousTabs");
    } else {
      previouslyOpenTabs.forEach(tab => {
        mainWindow.webContents.send("openTab", tab);
      })
    }
  })

  ipcMain.on("activeTabReady", () => {
    console.log("App ready");
    mainWindow.show();
    if (pastBounds && pastBounds.maximized === true) {
      mainWindow.maximize();
    }
    loadingwindow.hide();
    store.set("lastTabs", []);
  });
  
  mainWindow.webContents.on('found-in-page', (event, result) => {
    if (result.finalUpdate) {
      mainWindow.webContents.stopFindInPage('keepSelection');
    }
  });

  // app.on('activate', function () {
  //   // On macOS it's common to re-create a window in the app when the
  //   // dock icon is clicked and there are no other windows open.
  //   if (BrowserWindow.getAllWindows().length === 0) createWindow()
  // })
  ipcMain.on("close", (e, tabs) => {
    store.set("lastTabs", tabs)
  
    if (mainWindow.isMaximized()) {
      let lastbounds = {
        maximized: true,
        height: Math.floor(screenHeight * 0.8),
        width: Math.floor(screenWidth * 0.6),
        y: (screenHeight / 2) - (Math.floor(screenHeight * 0.8) / 2),
        x: (screenWidth / 2) - (Math.floor(screenWidth * 0.6) / 2),
      }
      store.set("lastBounds", lastbounds);
    } else {
      store.set("lastBounds", mainWindow.getBounds());
      store.set("lastBounds.maximized", false)
    }
  
    app.quit()
  });
})


ipcMain.on("consoleLog", (e, msg) => {
  console.log(msg);
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
});