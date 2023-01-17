// Modules to control application life and create native browser window
const { Console } = require('console')
const {app, BrowserWindow, Menu, MenuItem, globalShortcut, webContents, screen, clipboard} = require('electron')
const { webFrame, ipcRenderer } = require('electron/renderer')
const path = require('path')
const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fetch = require('cross-fetch'); // required 'fetch'
const { ipcMain } = require('electron/main');
const Store = require('electron-store');
const contextMenu = require('electron-context-menu');
const checkInternetConnected = require('check-internet-connected');

var loadingwindow = null;
let rightClickPosition = null;
let openedWindows = false;

const store = new Store();

app.whenReady().then(async () => {

  loadingwindow = new BrowserWindow({
    width: 300,
    height: 300,
    frame : false,
    movable : false,
    resizable: false,
    backgroundColor: "#2D2D2D",
    icon: __dirname + '/assets/typhon_colored_900x900.ico',
  })

  loadingwindow.loadFile('loading.html') // To load the activity loader html file
  loadingwindow.show();

  const checkInternetConfig = {
    timeout: 5000,
    retries: 5,
    domain: 'https://www.w3.org/',
  }

  checkInternetConnected(checkInternetConfig)
    .then(async (result) => {

      if (openedWindows === true) return;
    
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
        icon: __dirname + '/assets/typhon_colored_900x900.ico',
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          nodeIntegration: true,
          contextIsolation: false,
          webviewTag: true,
        }
      })
    
      let blocker = await ElectronBlocker.fromPrebuiltAdsOnly(fetch).catch(console.error);
      blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).catch(console.error);
    
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
      mainWindow.webContents.openDevTools()
    
      ipcMain.on("minimize", () => {
        mainWindow.isMinimized() ? mainWindow.restore() : mainWindow.minimize();
      });
    
      ipcMain.on("maximize", () => {
        mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
      });
    
      ipcMain.on("delData", (e, dataType) => {
        if (dataType === "pos") {
          store.delete("lastBounds");
        }
    
        if (dataType === "lastTabs") {
          store.delete("lastTabs");
        }
    
        if (dataType === "bookmarks") {
          store.delete("bookmarks");
        }
    
        if (dataType === "all") {
          store.delete("lastBounds");
          store.delete("lastTabs");
          store.delete("bookmarks");
        }
    
        mainWindow.webContents.send("delDataConfirm");
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
    
      let bookmarks = store.get("bookmarks");
      mainWindow.webContents.send("bookmarks", bookmarks);
    
      ipcMain.on("activeTabReady", () => {
        console.log("App ready");
        mainWindow.show();
        openedWindows = true;
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
    
      ipcMain.on("addBookmark", (e, bookmark) => {
        if (!store.get("bookmarks")) {
          store.set("bookmarks", []);
          console.log("No Bookmarks found");
        }
    
        let bookmarks = store.get("bookmarks");
        bookmarks.unshift(bookmark);
        store.set("bookmarks", bookmarks);
      });
    
      mainWindow.webContents.on('did-finish-load', () => {
        contextMenu({
          window: mainWindow,
          labels: {
            selectAll: 'Alles auswählen',
            cut: 'Ausschneiden',
            copy: 'Kopieren',
            paste: 'Einfügen',
            save: 'Bild speichern',
            saveImageAs: 'Bild speichern unter…',
            copyImageAddress: 'Bildadresse kopieren',
            copyLink: 'Link kopieren',
            saveLinkAs: 'Link speichern unter…',
            inspect: 'Element untersuchen'
          },
          prepend: (defaultActions, params, mainWindow) => [
            {
              label: 'Neuer Tab',
              accelerator: 'CommandOrControl+T',
              click: () => {
                newTab();
              }
            },
            {
              label: "Link in neuem tab öffnen",
              visible: params.linkURL.length > 0,
              click: () => {
                linkInNewTab(params.linkURL);
              }
            },
            {
              label: 'Zurück',
              accelerator: 'CommandOrControl+Left',
              click: () => {
                goBack();
              }
            },
            {
              label: 'Weiter',
              accelerator: 'CommandOrControl+Right',
              click: () => {
                goForward();
              }
            },
            {
              label: 'Neu laden',
              accelerator: 'CommandOrControl+R',
              click: () => {
                reloadPage();
              }
            },
            {
              type: 'separator',
            },
            {
              label: 'Kopieren',
              accelerator: 'CommandOrControl+C',
              visible: params.selectionText.trim().length > 0,
              click: () => {
                clipboard.writeText(params.selectionText);
              }
            },
            {
              label: 'Ausschneiden',
              accelerator: 'CommandOrControl+X',
              visible: params.selectionText.trim().length > 0 && params.isEditable,
              click: () => {
                clipboard.writeText(params.selectionText);
                params.selectionText = "";
              }
            }
          ],
          append: (defaultActions, params, mainWindow) => [],
          showCopyImageAddress: true,
          showSaveImageAs: true,
          showInspectElement: false,
          showSaveLinkAs: false,
          showCopyImage: false,
          cut: false,
          copy: false,
          paste: true,
          save: true,
          saveImageAs: true,
          copyLink: true,
          saveLinkAs: true,
          inspect: true,
          showSearchWithGoogle: false,
          showLearnSpelling: false,
          showLookUpSelection: false,
          showSelectAll: true,
          showCopyLink: true,
        });
      });
    
      app.on("web-contents-created", (e, contents) => { 
        if (contents.getType() == "webview") {
            // set context menu in webview contextMenu({ window: contents, });
            contextMenu({
              window: contents,
              labels: {
                selectAll: 'Alles auswählen',
                copy: "Kopieren",
                cut: 'Ausschneiden',
                paste: 'Einfügen',
                save: 'Bild speichern',
                saveImageAs: 'Bild speichern unter…',
                copyImageAddress: 'Bildadresse kopieren',
                copyLink: 'Link kopieren',
                saveLinkAs: 'Link speichern unter…',
                inspect: 'Element untersuchen',
              },
              prepend: (defaultActions, params, mainWindow) => [
                {
                  label: 'Neuer Tab',
                  accelerator: 'CommandOrControl+T',
                  click: () => {
                    newTab();
                  }
                },
                {
                  label: "Link in neuem tab öffnen",
                  visible: params.linkURL.length > 0,
                  click: () => {
                    linkInNewTab(params.linkURL);
                  }
                },
                {
                  label: 'Zurück',
                  accelerator: 'CommandOrControl+Left',
                  click: () => {
                    goBack();
                  }
                },
                {
                  label: 'Weiter',
                  accelerator: 'CommandOrControl+Right',
                  click: () => {
                    goForward();
                  }
                },
                {
                  label: 'Neu laden',
                  accelerator: 'CommandOrControl+R',
                  click: () => {
                    reloadPage();
                  }
                },
                {
                  type: 'separator',
                },
                {
                  label: 'Kopieren',
                  accelerator: 'CommandOrControl+C',
                  visible: params.selectionText.trim().length > 0,
                  click: () => {
                    clipboard.writeText(params.selectionText);
                  }
                },
                {
                  label: 'Ausschneiden',
                  accelerator: 'CommandOrControl+X',
                  visible: params.selectionText.trim().length > 0 && params.isEditable,
                  click: () => {
                    clipboard.writeText(params.selectionText);
                    params.selectionText = "";
                  }
                }
              ],
              append: (defaultActions, params, mainWindow) => [
                {
                  label: 'Element untersuchen',
                  accelerator: "CommandOrControl+Alt+D",
                  click: () => {
                    inspecElement(params.x, params.y)
                  }
                }
              ],
              showCopyImageAddress: true,
              showSaveImageAs: true,
              showInspectElement: false,
              showSaveLinkAs: false,
              showCopyImage: false,
              cut: false,
              copy: false,
              paste: true,
              save: true,
              saveImageAs: true,
              copyLink: true,
              saveLinkAs: true,
              inspect: true,
              showSearchWithGoogle: false,
              showLearnSpelling: false,
              showLookUpSelection: false,
              showSelectAll: true,
              showCopyLink: true,
            });
        }
      });
    
      function newTab() {
        mainWindow.webContents.send("newTab");
      }
    
      function goBack() {
        mainWindow.webContents.send("goBack");
      }
    
      function goForward() {
        mainWindow.webContents.send("goForward");
      }
    
      function reloadPage() {
        mainWindow.webContents.send("reloadPage");
      }
    
      function linkInNewTab(clickedLink) {
        mainWindow.webContents.send("linkInNewTab", clickedLink)
      }
    
      function openDevTools() {
        mainWindow.webContents.send("openWVDevTools");
      }
    
      function inspecElement(x, y) {
        mainWindow.webContents.send("inspectElement", x, y);
      }
    })
    .catch((ex) => {
      console.log("No Internet!")
      console.log(ex)

      loadingwindow.hide()

      noInternetWindow = new BrowserWindow({
        width: 1000,
        height: 1000,
        frame: false,
        backgroundColor: "#2D2D2D",
        icon: __dirname + '/assets/typhon_colored_900x900.ico',
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        }
      });

      noInternetWindow.maximize();
      noInternetWindow.loadFile("./public/noInternet.html")
      noInternetWindow.show();

      ipcMain.on("minimize", () => {
        noInternetWindow.isMinimized() ? noInternetWindow.restore() : noInternetWindow.minimize();
      });
    
      ipcMain.on("maximize", () => {
        noInternetWindow.isMaximized() ? noInternetWindow.unmaximize() : noInternetWindow.maximize();
      });

      ipcMain.on("close", (e, tabs) => {
        app.quit();
      });
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