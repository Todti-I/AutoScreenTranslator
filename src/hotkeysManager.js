const { globalShortcut } = require('electron');
const { config } = require('./configManager');

const hotkeysName = [
    'hotkeyOpenSettings',
    'hotkeyExitApp',
    'hotkeyTranslate',
    'hotkeyOpenCloseRects',
    'hotkeyOpenCloseTranslation',
];

const fixKey = (key) => key.toLowerCase()
    .replace('numpadenter', 'enter')
    .replace('numpaddivide', 'numdiv')
    .replace('numpadmultiply', 'nummult')
    .replace('numpadsubtract', 'numsub')
    .replace('numpaddecimal', 'numdec')
    .replace('numpad', 'num')
    .replace('minus', '-')
    .replace('equal', '=')
    .replace('comma', ',')
    .replace('period', '.')
    .replace('semicolon', ';')
    .replace('bracketleft', '[')
    .replace('bracketright', ']')
    .replace('backquote', '`')
    .replace('quote', '\'')
    .replace('backslash', '\\')
    .replace('slash', '/');


class Hotkeys {
    constructor() {
        this._hotkeys = {};
        hotkeysName.forEach(k => this._hotkeys[k] = undefined);
    }

    bind(name, func) {
        if (this._hotkeys.hasOwnProperty(name)) {
            this._hotkeys[name] = func;
        }
        const key = config.get(name);
        if (!key) {
            console.log(`No bind - ${name}`);
            return;
        }
        try {
            globalShortcut.register(fixKey(key), func);
        }
        catch (_) {
            console.log(`${key} is bad (${fixKey(key)})`)
        }
    }

    unbindAll() {
        globalShortcut.unregisterAll();
    }

    updateAllBinds() {
        this.unbindAll();
        hotkeysName.forEach(name => {
            this.bind(name, this._hotkeys[name]);
        });
    }
}

const hotkeys = new Hotkeys();
module.exports.hotkeys = hotkeys;