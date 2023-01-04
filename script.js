
const webView = document.getElementById("myWebview");
const backBtn = document.getElementById("backBtn");
const forwardBtn = document.getElementById("forwardBtn");
const urlInput = document.getElementById("url");

// https://www.electronjs.org/de/docs/latest/api/webview-tag

setInterval(function () {
    if (webView.canGoForward() === true) {
        forwardBtn.classList.add("enabled");
    } else {
        forwardBtn.classList.remove("enabled");
    }
    if (webView.canGoBack() === true) {
        backBtn.classList.add("enabled");
    } else {
        backBtn.classList.remove("enabled");
    }

    if (urlInput !== document.activeElement && webView.getURL() !== urlInput) {
        urlInput.value = webView.getURL();
    }
}, 1000)

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
    webView.goBack();
    if (webView.canGoForward() === true) {
        forwardBtn.classList.add("enabled");
    } else {
        forwardBtn.classList.remove("enabled");
    }
    if (webView.canGoBack() === true) {
        backBtn.classList.add("enabled");
    } else {
        backBtn.classList.remove("enabled");
    }
}

function goForward() {
    webView.goForward();
    if (webView.canGoForward() === true) {
        forwardBtn.classList.add("enabled");
    } else {
        forwardBtn.classList.remove("enabled");
    }
    if (webView.canGoBack() === true) {
        backBtn.classList.add("enabled");
    } else {
        backBtn.classList.remove("enabled");
    }
}

function go() {
    if(event.key === 'Enter') {
        webView.loadURL(urlInput.value);
        urlInput.blur();
        urlInput.value = webView.getURL();
        if (webView.canGoForward() === true) {
            forwardBtn.classList.add("enabled");
        } else {
            forwardBtn.classList.remove("enabled");
        }
        if (webView.canGoBack() === true) {
            backBtn.classList.add("enabled");
        } else {
            backBtn.classList.remove("enabled");
        }     
    }
}

function reloadPage() {
    webView.reload();
    urlInput.blur();
    urlInput.value = webView.getURL();
}