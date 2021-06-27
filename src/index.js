const screenshot = require('screenshot-desktop');

const { getIamToken, getTextFromImage, getTranslationFromText } = require('./apiYandex');
const { config } = require('./configManager');
const { hotkeys } = require('./hotkeysManager');

const { app, globalShortcut, ipcMain, BrowserWindow, Menu, Tray } = require('electron');
const electronLocalshortcut = require('electron-localshortcut');
const path = require('path');

let translation;
let lastScreenshot;

let rectsWindow;
let translationWindow;
let settingsWindow;

let tray;

function ensureWindowProvide(window, windowId = -1) {
    if (!window || window.isDestroyed()) {
        switch (windowId) {
            case 0:
                return createRectsWindow();
            case 1:
                return createTranslationWindow();
            case 2:
                return createSettingsWindow();
            default:
                return undefined;
        }
    }
    return window;
};

function updateTransalteWindowPosition() {
    const rect = config.get('extraBlockForTranslation')
        ? config.get('translationRect') : config.get('rect');
    translationWindow = ensureWindowProvide(translationWindow, 1);
    translationWindow.setBounds({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
    });
}

function exitApp() {
    if (ensureWindowProvide(rectsWindow)) {
        rectsWindow.destroy();
    }
    if (ensureWindowProvide(translationWindow)) {
        translationWindow.destroy();
    }
    if (ensureWindowProvide(settingsWindow)) {
        settingsWindow.destroy();
    }
    tray.destroy();
}

function openSettings() {
    hotkeys.unbindAll();
    settingsWindow = ensureWindowProvide(settingsWindow, 2);
    settingsWindow.show();
}

async function createScreenshot() {
    const isRectsVisible = rectsWindow
        && !rectsWindow.isDestroyed()
        && rectsWindow.isVisible();
    const isTranslationVisible = translationWindow
        && !translationWindow.isDestroyed()
        && translationWindow.isVisible();

    if (isRectsVisible) {
        rectsWindow.hide();
    }
    if (isTranslationVisible) {
        translationWindow.hide();
    }

    const imgBuffer = await screenshot({ format: 'png' })
    const data = `data:image/png;base64,${Buffer.from(imgBuffer).toString('base64')}`;

    if (isRectsVisible) {
        rectsWindow.show();
    }
    if (isTranslationVisible) {
        translationWindow.showInactive();
    }

    return data;
}

async function getTranslationFromScreenshot() {
    const img = await createScreenshot();

    const token = await getIamToken(config.get('oAuthToken'));
    if (token.isError) {
        return token.data;
    }

    const text = await getTextFromImage(token.data, config.get('forderId'),
        img, config.get('rect'), config.get('sourceLanguage'));
    if (text.isError) {
        return text.data;
    }

    const translation = await getTranslationFromText(token.data, config.get('forderId'),
        config.get('sourceLanguage'), config.get('translationLanguage'), text.data);

    return translation.data;
};

function createRectsWindow() {
    const rectsWindow = new BrowserWindow({
        fullscreen: true,
        minimizable: false,
        maximizable: false,
        resizable: false,
        show: false,
        closable: false,
        movable: false,
        alwaysOnTop: true,
        frame: false,
        transparent: true,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
        }
    })
    rectsWindow.loadFile(
        path.join(__dirname, 'RectsWindow', 'rectsPage.html'));

    electronLocalshortcut.register(rectsWindow, 'F12', () => {
        rectsWindow.webContents.openDevTools();
    });

    return rectsWindow;
}

function createTranslationWindow() {
    const translationWindow = new BrowserWindow({
        minimizable: false,
        maximizable: false,
        resizable: false,
        show: false,
        closable: false,
        movable: false,
        frame: false,
        transparent: true,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    translationWindow.setAlwaysOnTop(true, 'screen-saver');

    translationWindow.loadFile(
        path.join(__dirname, 'TranslationWindow', 'translationPage.html'));

    electronLocalshortcut.register(translationWindow, 'F12', () => {
        translationWindow.webContents.openDevTools();
    });

    return translationWindow;
}

function createSettingsWindow() {
    const settingsWindow = new BrowserWindow({
        title: 'Настройки AST',
        backgroundColor: '#ededed',
        width: 500,
        height: 575,
        minimizable: false,
        maximizable: false,
        resizable: false,
        show: false,
        autoHideMenuBar: true,
        center: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
        }
    });
    settingsWindow.removeMenu();
    settingsWindow.loadFile(
        path.join(__dirname, 'SettingsWindow', 'settingsPage.html'));

    electronLocalshortcut.register(settingsWindow, 'F12', () => {
        settingsWindow.webContents.openDevTools();
    });

    return settingsWindow;
}

function createTray() {
    const tray = new Tray(path.join(__dirname, 'images', 'icon.png'));
    tray.setToolTip('Auto Screen Translator');

    tray.on('click', openSettings);

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Настройки', click: openSettings },
        { label: 'Выйти', click: exitApp },
    ])

    tray.setContextMenu(contextMenu);
    return tray;
}

ipcMain.on('rects-message', (event, arg) => {
    if (!arg) {
        event.reply('rects-reply', {
            rect: config.get('rect'),
            translationRect: config.get('translationRect'),
            img: lastScreenshot,
        });
        return;
    }

    const fixRect = (rect) => {
        if (rect.width < 0) {
            rect.left += rect.width;
            rect.width = Math.abs(rect.width);
        }
        if (rect.height < 0) {
            rect.top += rect.height;
            rect.height = Math.abs(rect.height);
        }
        return rect;
    }

    if (arg.rect) {
        config.set('rect', fixRect(arg.rect));
    }
    if (arg.translationRect) {
        config.set('translationRect', fixRect(arg.translationRect));
    }
    updateTransalteWindowPosition();
});

ipcMain.on('translation-message', (event, arg) => {
    if (!arg) {
        event.reply('translation-reply', { text: translation });
        return;
    }
});

ipcMain.on('settings-message', (event, arg) => {
    if (!arg) {
        event.reply('settings-reply', config.getObject());
        return
    }
    config.setObject(arg);
    updateTransalteWindowPosition();
    translationWindow.reload();
});

ipcMain.on('settings-close', () => {
    settingsWindow.close();
    hotkeys.updateAllBinds();
});

app.allowRendererProcessReuse = true;

app.commandLine.appendSwitch('enable-features', 'FormControlsRefresh')

app.on('ready', () => {
    rectsWindow = createRectsWindow();
    translationWindow = createTranslationWindow();
    tray = createTray();

    hotkeys.bind('hotkeyOpenSettings', openSettings);

    hotkeys.bind('hotkeyExitApp', () => {
        exitApp();
    });

    hotkeys.bind('hotkeyOpenCloseRects', async () => {
        rectsWindow = ensureWindowProvide(rectsWindow, 0);
        if (rectsWindow.isVisible()) {
            rectsWindow.hide();
            return;
        }
        lastScreenshot = await createScreenshot();
        rectsWindow.webContents.send('rects-reply', {
            rect: config.get('rect'),
            translationRect: config.get('translationRect'),
            img: lastScreenshot,
        });
        rectsWindow.show();
    });

    let isLoading = false;
    hotkeys.bind('hotkeyTranslate', async () => {
        if (isLoading) {
            return;
        }
        isLoading = true;
        updateTransalteWindowPosition();
        translationWindow.webContents.send('translation-reply', { isLoading });
        translationWindow.showInactive();
        translation = await getTranslationFromScreenshot();
        isLoading = false;
        translationWindow.webContents.send('translation-reply', { text: translation, isLoading });
    });

    hotkeys.bind('hotkeyOpenCloseTranslation', () => {
        updateTransalteWindowPosition();
        if (translationWindow.isVisible()) {
            translationWindow.hide();
        }
        else translationWindow.showInactive();
    });

    console.log('>>> ASP launched');
})

app.on('window-all-closed', () => {
    config.save();
    globalShortcut.unregisterAll();
    app.quit()
});