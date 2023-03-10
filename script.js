const { app } = require("electron");
const TabGroup = require("electron-tabs");
const { ipcRenderer } = require("electron/renderer");
const { isProxy } = require("util/types");
const ipc = require('electron').ipcRenderer;

const backBtn = document.getElementById("backBtn");
const forwardBtn = document.getElementById("forwardBtn");
const urlInput = document.getElementById("url");

const tabGroup = document.querySelector("tab-group");

function generateId(prefix) {
    if (!prefix || typeof prefix !== "string") {
      prefix = "";
    }
  
    return prefix + Date.now().toString(32) + Math.random().toString(16).replace(/\./g, '');
}

function adjustBookmarksheight() {
    if (document.getElementById("bookmarkListTop").childElementCount <= 0) {
        document.documentElement.style.setProperty("--bookmarkTopHeight", "0px");
    } else {
        document.documentElement.style.setProperty("--bookmarkTopHeight", "40px");
    }
}

adjustBookmarksheight()

tabGroup.setDefaultTab({
    title: "Neuer Tab",
    src: "file://" +  __dirname + "/public/defaultPage.html",
    active: true,
    iconURL: "./assets/typhon_colored_900x900.ico",
});

ipc.once("noPreviousTabs", () => {
    const firstTab = tabGroup.addTab({
        title: "Neuer Tab",
        src: "file://" +  __dirname + "/public/defaultPage.html",
        active: true,
        iconURL: "./assets/typhon_colored_900x900.ico",
    });

    firstTab.once("webview-dom-ready", (tab) => {
        ipc.send("activeTabReady")
    });
});

tabGroup.on("tab-active", (tab, tabGroup) => {
    let webviewUrl = tab.webview.getURL();
    if (!webviewUrl.includes("defaultPage.html") && !webviewUrl.includes("website_not_available.html") && urlInput !== document.activeElement && webviewUrl !== urlInput) {
        urlInput.value = webviewUrl;
    }

    if (webviewUrl.includes("defaultPage.html") && webviewUrl.includes("website_not_available.html") && urlInput !== document.activeElement && webviewUrl !== urlInput) {
        urlInput.value = "";
    }

    if (!webviewUrl.includes("defaultPage.html") && !webviewUrl.includes("website_not_available.html")) {
        if (tab.webview.canGoForward()) {
            forwardBtn.classList.add("enabled");
        } else {
            forwardBtn.classList.remove("enabled");
        }
    
        if (tab.webview.canGoBack() === true) {
            backBtn.classList.add("enabled");
        } else {
            backBtn.classList.remove("enabled");
        }
        
        tab.setTitle(tab.webview.getTitle())
    }

    tab.webview.addEventListener("page-favicon-updated", (favicons) => {
        let favicon = favicons.favicons[favicons.favicons.length - 1];
        if (favicon) {
            tab.setIcon(favicon);
        } else {
            tab.setIcon("./assets/typhon_colored_900x900.ico");
        }
    })

    tab.webview.addEventListener("page-title-updated", (title) => {
        tab.setTitle(title.title);
    });

    tab.webview.addEventListener("did-navigate", (url) => {
        url = url.url;
        if (url !== urlInput.value && !url.includes("website_not_available.html") && !url.includes("defaultPage.html")) {
            urlInput.value = url;
        }
    
        if (urlInput.value.includes("website_not_available.html") || urlInput.value.includes("defaultPage.html")) {
            urlInput.value = "";
            console.log("is default page");
        }

        if (tab.webview.canGoForward()) {
            forwardBtn.classList.add("enabled");
        } else {
            forwardBtn.classList.remove("enabled");
        }
    
        if (tab.webview.canGoBack() === true) {
            backBtn.classList.add("enabled");
        } else {
            backBtn.classList.remove("enabled");
        }
    
        tab.webview.executeJavaScript("document.querySelectorAll('a').forEach(a => {a.target = '_self'})");
    });

    tab.webview.addEventListener("did-navigate-in-page", (url) => {
        url = url.url;

        if (url !== urlInput.value && !url.includes("website_not_available.html") && !url.includes("defaultPage.html")) {
            urlInput.value = url;
        }
    
        if (urlInput.value.includes("website_not_available.html") || urlInput.value.includes("defaultPage.html")) {
            urlInput.value = "";
            console.log("is default page");
        }
    });
});

tabGroup.on("tab-removed", (tab, tabGroup) => {
    if (tabGroup.getTabs().length <= 0) {
        tabGroup.addTab({
            title: "Neuer Tab",
            src: "file://" +  __dirname + "/public/defaultPage.html",
            active: true,
            iconURL: "./assets/typhon_colored_900x900.ico",
        });
    }
});

tabGroup.on("tab-added", (tab, tabGroup) => {
    tab.webview.addEventListener("page-favicon-updated", (favicons) => {
        console.log("Favicon updated!");
        let favicon = favicons.favicons[favicons.favicons.length - 1];
        console.log(favicon)
        if (favicon) {
            tab.setIcon(favicon);
        } else {
            tab.setIcon("./assets/typhon_colored_900x900.ico");
        }
    });

    tab.webview.addEventListener("page-title-updated", (title) => {
        console.log("Title updated!");
        tab.setTitle(title.title);
    });

    tab.webview.addEventListener("did-navigate", (url) => {
        url = url.url;
        if (url !== urlInput.value && !url.includes("website_not_available.html") && !url.includes("defaultPage.html")) {
            urlInput.value = url;
        }
    
        if (urlInput.value.includes("website_not_available.html") || urlInput.value.includes("defaultPage.html")) {
            urlInput.value = "";
            console.log("is default page");
        }

        if (tab.webview.canGoForward()) {
            forwardBtn.classList.add("enabled");
        } else {
            forwardBtn.classList.remove("enabled");
        }
    
        if (tab.webview.canGoBack() === true) {
            backBtn.classList.add("enabled");
        } else {
            backBtn.classList.remove("enabled");
        }
    
        tab.webview.executeJavaScript("document.querySelectorAll('a').forEach(a => {a.target = '_self'})");
    });

    tab.webview.addEventListener("did-navigate-in-page", (url) => {
        url = url.url;

        if (url !== urlInput.value && !url.includes("website_not_available.html") && !url.includes("defaultPage.html")) {
            urlInput.value = url;
        }
    
        if (urlInput.value.includes("website_not_available.html") || urlInput.value.includes("defaultPage.html")) {
            urlInput.value = "";
            console.log("is default page");
        }
    });

    tab.once("webview-dom-ready", (tab) => {
        urlInput.value = "";
    });

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

let activeTab = tabGroup.getActiveTab();
if (activeTab) {
    activeTab.webview.addEventListener('new-window', (e) => {
        console.log("test")
        const protocol = require('url').parse(e.url).protocol
        if (protocol === 'http:' || protocol === 'https:') {
            tabGroup.addTab({
                title: "Neuer Tab",
                src: e.url,
                active: true,
                iconURL: "./assets/typhon_colored_900x900.ico",
            });
        }
    })
}

// setInterval(() => {
//     let activeTab = tabGroup.getActiveTab();
//     let webviewUrl = activeTab.webview.getURL();

//     if (urlInput !== document.activeElement && webviewUrl !== urlInput.value && !webviewUrl.includes("website_not_available.html") && !webviewUrl.includes("defaultPage.html")) {
//         urlInput.value = webviewUrl;
//     }

//     if (urlInput !== document.activeElement && (urlInput.value.includes("website_not_available.html") || urlInput.value.includes("defaultPage.html"))) {
//         urlInput.value = "";
//     }

//     //activeTab.setTitle(activeTab.webview.getTitle())

//     if (activeTab.webview.canGoForward()) {
//         forwardBtn.classList.add("enabled");
//     } else {
//         forwardBtn.classList.remove("enabled");
//     }

//     if (activeTab.webview.canGoBack() === true) {
//         backBtn.classList.add("enabled");
//     } else {
//         backBtn.classList.remove("enabled");
//     }

//     activeTab.webview.executeJavaScript("document.querySelectorAll('a').forEach(a => {a.target = '_self'})");

// }, 1000)

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
    //let regex = new RegExp(/^(?!-)[A-Za-z0-9-]+([\-\.]{1}[a-z0-9]+)*\.[A-Za-z]{2,6}$/);
    let regex = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi);

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
    let allTabs = tabGroup.getTabs();

    let tabs = [];
    allTabs.forEach(tabb => {
        let tabURl = tabb.webview.getURL();

        if (tabb.id === tabGroup.getActiveTab().id) {
            tabs.unshift({url: tabURl, title: tabb.title, active: true});
        } else {
            tabs.unshift({url: tabURl, title: tabb.title, active: false});
        }

    })

    console.log(tabs)
    ipc.send('close', tabs);
}

function minimizeWindow() {
    ipc.send("minimize");
}

function maximizeWindow() {
    ipc.send("maximize");
}

function toggleSettings() {
    const settingsContainer = document.getElementById("settingsOuter");
    if (settingsContainer.style.display === "flex") {
        settingsContainer.style.display = "none";
    } else {
        settingsContainer.style.display = "flex";
    }
}

function toggleBookmarks() {
    const bookmarkContainer = document.getElementById("bookmarksOuter");
    if (bookmarkContainer.style.display === "flex") {
        bookmarkContainer.style.display = "none";
    } else {
        bookmarkContainer.style.display = "flex";
    }
}

var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var content = this.nextElementSibling;
        if (content.style.maxHeight){
            content.style.maxHeight = null;
            this.getElementsByClassName("collapsible-icon")[0].style.transform = "rotate(0deg)";
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
            this.getElementsByClassName("collapsible-icon")[0].style.transform = "rotate(180deg)";
        } 
    });
}

function showBanner(msg, type) {
    const banner = document.getElementById("banner");
    const title = banner.getElementsByTagName("h3")[0];

    banner.classList.add(type);
    title.innerHTML = msg;
    banner.style.display = "block";

    setTimeout(() => {
        banner.style.display = "none";
        banner.classList.remove(type);
        title.innerHTML = "Message";
    }, 4000)
}

function delData(dataType) {
    ipc.send("delData", dataType);
}

function addBookmark() {
    let activeTab = tabGroup.getActiveTab();
    let webviewUrl = activeTab.webview.getURL();
    let bookmarkTitle;
    let bookmarkUrl;
    let bookmarkFolder;

    if (!document.getElementById("bookmarkTitle").value) {
        bookmarkTitle = activeTab.getTitle();
    } else {
        bookmarkTitle = document.getElementById("bookmarkTitle").value;
    }

    if (!document.getElementById("bookmarkFolder").value) {
        bookmarkFolder = "favorites";
    } else {
        bookmarkFolder = document.getElementById("bookmarkFolder").value;
    }

    ipc.send("addBookmark", {
        title: bookmarkTitle,
        icon: activeTab.getIcon(),
        url: webviewUrl,
        type: "bookmark",
        id: generateId("bm"),
    }, bookmarkFolder);

    document.getElementById("bookmarkModal").style.display = "none";
}

function delBookmark(bookmarkid, folder) {
    ipc.send("delBookmark", bookmarkid, folder);
}

function openAddBookmarks() {
    let activeTab = tabGroup.getActiveTab();
    let webviewUrl = activeTab.webview.getURL();

    document.getElementById("bookmarkModal").style.display = "flex";
    document.getElementById("bookmarkModal").getElementsByTagName("input")[0].value = activeTab.getTitle();
}

ipc.on("delDataConfirm", () => {
    showBanner("Daten erfolgreich gel??scht!", "alert-success");
});

ipc.on("newTab", () => {
    const newTab = tabGroup.addTab({
        title: "Neuer Tab",
        src: "file://" +  __dirname + "/public/defaultPage.html",
        active: true,
        iconURL: "./assets/typhon_colored_900x900.ico",
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

ipc.on("inspectelement", (e) => {
    console.log("Inspect element")
    console.log(e)
});

ipc.on("openTab", (e, tab) => {
    let tabURL;
    if (!tab.url || !tab.url.trim() || tab.url.includes("/typhon/undefined") || tab.url === "") {
        tabURL = "file:///C:/Users/janst/development-local/GITHub-Desktop/typhon/public/defaultPage.html";
    } else {
        tabURL = tab.url
    }

    ipc.send("consoleLog", tabURL)

    let newTab = tabGroup.addTab({
        title: tab.title,
        src: tabURL,
        iconURL: "./assets/typhon_colored_900x900.ico",
    })
    
    if (tab.active === true) {
        newTab.activate();
        newTab.on("webview-dom-ready", (tab) => {
            ipc.send("activeTabReady");
        });
    }
});

function openLinkinnewTab(link) {
    const newTab = tabGroup.addTab({
        title: "Neuer Tab",
        src: link,
        active: true,
        iconURL: "./assets/typhon_colored_900x900.ico",
    });

    urlInput.value = link;
}

ipc.on("linkInNewTab", (e, openLink) => {
    openLinkinnewTab(openLink);
});

ipc.on("inspectElement", (e, x, y) => {
    console.log(x)
    console.log(y)
    let activeTab = tabGroup.getActiveTab();
    activeTab.webview.inspectElement(x, y);
});

ipc.on("bookmarks", (e, bookmarks) => {
    const bookmarkContainer = document.getElementById("bookmaks-content");
    const favoritesContainer = document.getElementById("favorites-content");
    const bookmarkListTop = document.getElementById("bookmarkListTop");
    bookmarkContainer.innerHTML = "";
    bookmarks.moreBookmarks.items.forEach(bookmark => {
        bookmarkContainer.innerHTML += `<div style="display: flex; justify-content: space-between; align-items: center;" id="moreBookmarks_${bookmark.id}"><div style="display: flex; justify-content: space-between; align-items: center;"><img src="${bookmark.icon}" onclick="openLinkinnewTab('${bookmark.url}'); toggleBookmarks();" style="height: 25px;" class="moreBookmarksIcon"><button type="button" onclick="openLinkinnewTab('${bookmark.url}'); toggleBookmarks();" class="otherBookmarks-bookmark">${bookmark.title}</button></div><button type="button" class="closeBtn-normal" onclick="delBookmark('${bookmark.id}', 'moreBookmarks')"><i class="material-icons" style="padding-top: 3px;">close</i></button></div>`;
    });

    bookmarkListTop.innerHTML = "";
    favoritesContainer.innerHTML = "";
    bookmarks.favorites.items.forEach(bookmark => {
        bookmarkListTop.innerHTML += `<div class="bookmark" onclick="openLinkinnewTab('${bookmark.url}')" data-link="${bookmark.url}" data-id="favorites_${bookmark.id}"><img src="${bookmark.icon}"><p>${bookmark.title}</p></div>`;
        favoritesContainer.innerHTML += `<div style="display: flex; justify-content: space-between; align-items: center;" id="moreBookmarks_${bookmark.id}"><div style="display: flex; justify-content: space-between; align-items: center;"><img src="${bookmark.icon}" onclick="openLinkinnewTab('${bookmark.url}'); toggleBookmarks();" style="height: 25px;" class="moreBookmarksIcon"><button type="button" onclick="openLinkinnewTab('${bookmark.url}'); toggleBookmarks();" class="otherBookmarks-bookmark">${bookmark.title}</button></div><button type="button" class="closeBtn-normal" onclick="delBookmark('${bookmark.id}', 'favorites')"><i class="material-icons" style="padding-top: 3px;">close</i></button></div>`;
    });

    adjustBookmarksheight();
});