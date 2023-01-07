const { app } = require("electron");
const TabGroup = require("electron-tabs");
const { ipcRenderer } = require("electron/renderer");
const ipc = require('electron').ipcRenderer;

const backBtn = document.getElementById("backBtn");
const forwardBtn = document.getElementById("forwardBtn");
const urlInput = document.getElementById("url");

const tabGroup = document.querySelector("tab-group");

tabGroup.setDefaultTab({
    title: "Neuer Tab",
    src: "file://" +  __dirname + "/public/defaultPage.html",
    active: true,
    iconURL: "./typhon_gradient.ico",
});

const firstTab = tabGroup.addTab({
    title: "Neuer Tab",
    src: "file://" +  __dirname + "/public/defaultPage.html",
    active: true,
    iconURL: "./typhon_gradient.ico",
})

firstTab.once("webview-dom-ready", (tab) => {
    ipc.send("firstTabReady");
});

tabGroup.on("tab-active", (tab, tabGroup) => {
    let webviewUrl = tab.webview.getURL();
    if (!webviewUrl.includes("defaultPage.html") && !webviewUrl.includes("website_not_available.html") && urlInput !== document.activeElement && webviewUrl !== urlInput) {
        urlInput.value = webviewUrl;
    }

    if (!webviewUrl.includes("defaultPage.html") && !webviewUrl.includes("website_not_available.html")) {
        if (tab.webview.canGoForward()) {
            forwardBtn.classList.add("enabled");
        } else {
            forwardBtn.classList.remove("enabled");
        }
    
        if (webView.canGoBack() === true) {
            backBtn.classList.add("enabled");
        } else {
            backBtn.classList.remove("enabled");
        }
        
        tab.setTitle(tab.webview.getTitle())
    }
});

tabGroup.on("tab-removed", (tab, tabGroup) => {
    if (tabGroup.getTabs().length <= 0) {
        tabGroup.addTab({
            title: "Neuer Tab",
            src: "file://" +  __dirname + "/public/defaultPage.html",
            active: true,
            iconURL: "./typhon_gradient.ico",
        });
    }
});

tabGroup.on("tab-added", (tab, tabGroup) => {
    tab.on("webview-dom-ready", (tab) => {
        let windowWidth = document.body.offsetWidth - 180;
        let tabWidth = 150;
        let tabCount = tabGroup.getTabs().length;

        if ((tabCount * tabWidth) > windowWidth) {
            tab.close();
            const rightmostTab = tabGroup.getTabByPosition(-1);
            rightmostTab.activate();
        }
        
        urlInput.focus();
    });
});

tabGroup.getActiveTab().webview.addEventListener('new-window', (e) => {
    console.log("test")
    const protocol = require('url').parse(e.url).protocol
    if (protocol === 'http:' || protocol === 'https:') {
        tabGroup.addTab({
            title: "Neuer Tab",
            src: e.url,
            active: true,
            iconURL: "./typhon_gradient.ico",
        });
    }
})

setInterval(() => {
    let activeTab = tabGroup.getActiveTab();
    let webviewUrl = activeTab.webview.getURL();

    if (urlInput !== document.activeElement && webviewUrl !== urlInput.value && !webviewUrl.includes("website_not_available.html") && !webviewUrl.includes("defaultPage.html")) {
        urlInput.value = webviewUrl;
    }

    if (urlInput !== document.activeElement && (webviewUrl.includes("website_not_available.html") || webviewUrl.includes("defaultPage.html"))) {
        urlInput.value = "";
    }

    activeTab.setTitle(activeTab.webview.getTitle())

    if (activeTab.webview.canGoForward()) {
        forwardBtn.classList.add("enabled");
    } else {
        forwardBtn.classList.remove("enabled");
    }

    if (activeTab.webview.canGoBack() === true) {
        backBtn.classList.add("enabled");
    } else {
        backBtn.classList.remove("enabled");
    }

    activeTab.webview.executeJavaScript("document.querySelectorAll('a').forEach(a => {a.target = '_self'})");
}, 1000)

// https://www.electronjs.org/de/docs/latest/api/webview-tag

urlInput.addEventListener("focus", function (e) {
    var target = e.currentTarget;
    if (target) {
        target.select();
        target.addEventListener("mouseup", function _tempoMouseUp(event) {
            event.preventDefault();
            target.removeEventListener("mouseup", _tempoMouseUp);
        });
    }
});

function goHome() {
    webView.loadURL("https://google.com");
}

function goBack() {
    let activeTab = tabGroup.getActiveTab();
    activeTab.webview.goBack();
    if (activeTab.webview.canGoForward() === true) {
        forwardBtn.classList.add("enabled");
    } else {
        forwardBtn.classList.remove("enabled");
    }
    if (activeTab.webview.canGoBack() === true) {
        backBtn.classList.add("enabled");
    } else {
        backBtn.classList.remove("enabled");
    }
}

function goForward() {
    let activeTab = tabGroup.getActiveTab();
    activeTab.webview.goForward();
    if (activeTab.webview.canGoForward() === true) {
        forwardBtn.classList.add("enabled");
    } else {
        forwardBtn.classList.remove("enabled");
    }
    if (activeTab.webview.canGoBack() === true) {
        backBtn.classList.add("enabled");
    } else {
        backBtn.classList.remove("enabled");
    }
}

function isValidHttpUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (err) {
        return false;
    }
}

function isValidDomain(str) {
    let regex = new RegExp(/^(?!-)[A-Za-z0-9-]+([\-\.]{1}[a-z0-9]+)*\.[A-Za-z]{2,6}$/);

    if (str == null) {
        return false;
    }

    if (regex.test(str) == true) {
        return true;
    } else {
        return false;
    }
}

async function tryHttps(urlInputValue, activeTab) {
    let isValid = true;

    activeTab.webview.loadURL("https://" + urlInputValue).catch(err => {
        isValid = false;
    }).then(() => {
        return isValid;
    })
}

function go() {
    if(event.key === 'Enter') {
        let activeTab = tabGroup.getActiveTab();
        let urlInputValue = urlInput.value;

        if (!urlInputValue.trim()) {
            return;
        }

        if (isValidHttpUrl(urlInputValue)) {
            activeTab.webview.loadURL(urlInputValue).catch(err => {
                activeTab.webview.loadURL("file://" +  __dirname + "/public/website_not_available.html");
            })
        } else if (isValidDomain(urlInputValue)) {
            isValid = tryHttps(urlInputValue, activeTab).then((isValid) => {
                if (isValid === true) {
                    activeTab.webview.loadURL("https://" + urlInputValue)
                } else {
                    activeTab.webview.loadURL("http://" + urlInputValue).catch(err2 => {
                        console.log("Test")
                        console.error;
                        activeTab.webview.loadURL("file://" +  __dirname + "/public/website_not_available.html");
                    });
                }
            })
        } else {
            let search = urlInputValue.replace(/\s/g, "+");
            activeTab.webview.loadURL(`https://google.com/search?q=${search}`)
        }

        urlInput.value = activeTab.webview.getURL();
        if (activeTab.webview.canGoForward() === true) {
            forwardBtn.classList.add("enabled");
        } else {
            forwardBtn.classList.remove("enabled");
        }
        if (activeTab.webview.canGoBack() === true) {
            backBtn.classList.add("enabled");
        } else {
            backBtn.classList.remove("enabled");
        }     
    }
}

function google() {
    console.log("Test")
    if(event.key === 'Enter') {
        let activeTab = tabGroup.getActiveTab();
        let googleSearchInput = document.getElementById("googleSearchDefault");

        if (!googleSearchInput.value.trim()) {
            return;
        }

        let search = googleSearchInput.value.replace(/\s/g, "+");
        activeTab.webview.loadURL(`https://google.com/search?q=${search}`);

        googleSearchInput.blur();
        googleSearchInput.value = activeTab.webview.getURL();
        if (activeTab.webview.canGoForward() === true) {
            forwardBtn.classList.add("enabled");
        } else {
            forwardBtn.classList.remove("enabled");
        }
        if (activeTab.webview.canGoBack() === true) {
            backBtn.classList.add("enabled");
        } else {
            backBtn.classList.remove("enabled");
        }     
    }
}

function googleWithoutEnter() {
    let activeTab = tabGroup.getActiveTab();
    let googleSearchInput = document.getElementById("googleSearchDefault");

    if (!googleSearchInput.value.trim()) {
        return;
    }

    let search = googleSearchInput.value.replace(/\s/g, "+");
    activeTab.webview.loadURL(`https://google.com/search?q=${search}`);

    googleSearchInput.blur();
    googleSearchInput.value = activeTab.webview.getURL();

    if (activeTab.webview.canGoForward() === true) {
        forwardBtn.classList.add("enabled");
    } else {
        forwardBtn.classList.remove("enabled");
    }

    if (activeTab.webview.canGoBack() === true) {
        backBtn.classList.add("enabled");
    } else {
        backBtn.classList.remove("enabled");
    } 
}

function reloadPage() {
    let activeTab = tabGroup.getActiveTab();
    let webviewUrl = activeTab.webview.getURL();
    if (webviewUrl.includes("website_not_available.html") || webviewUrl.includes("defaultPage.html")) return;
    activeTab.webview.reload();
    urlInput.blur();
    urlInput.value = activeTab.webview.getURL();
}

function reloadOnWNF() {
    console.log("Test")
    let activeTab = tabGroup.getActiveTab();
    activeTab.webview.loadURL(urlInput.value).catch(err => {
        activeTab.webview.loadURL("file://" +  __dirname + "/public/website_not_available.html");
    });
}

function closeApp() {
    ipc.send('close');
}

function minimizeWindow() {
    ipc.send("minimize");
}

ipc.on("newTab", () => {
    const newTab = tabGroup.addTab({
        title: "Neuer Tab",
        src: "file://" +  __dirname + "/public/defaultPage.html",
        active: true,
        iconURL: "./typhon_gradient.ico",
    });
    urlInput.focus();
});

ipc.on("reloadPage", () => {
    reloadPage();
});

ipc.on("reloadPageWithoutcache", () => {
    let activeTab = tabGroup.getActiveTab();
    let webviewUrl = activeTab.webview.getURL();
    if (webviewUrl.includes("website_not_available.html") || webviewUrl.includes("defaultPage.html")) return;
    activeTab.webview.reloadIgnoringCache();
    urlInput.blur();
    urlInput.value = activeTab.webview.getURL();
});

ipc.on("goToUrlbar", () => {
    urlInput.focus();
});

ipc.on("openWVDevTools", () => {
    const activeWebview = tabGroup.getActiveTab().webview;
    activeWebview.isDevToolsOpened() ? activeWebview.closeDevTools() : activeWebview.openDevTools();
});

ipc.on("goBack", () => {
    goBack();
});

ipc.on("goForward", () => {
    goForward();
});

ipc.on('find_request', () => {
    const modalbox = document.getElementById('modalbox');

    if (modalbox.style.display === 'flex') {
        modalbox.style.display = 'none';
    } else {
        modalbox.style.display = 'flex';
    }
    modalbox.querySelectorAll("input")[0].focus();
});

function searchPage(searchInput) {
    let activeTab = tabGroup.getActiveTab();
    activeTab.webview.findInPage(searchInput);
}