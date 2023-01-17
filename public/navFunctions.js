const ipc = require('electron').ipcRenderer;

function closeApp() {
    ipc.send('close');
}

function minimizeWindow() {
    ipc.send("minimize");
}

function maximizeWindow() {
    ipc.send("maximize");
}