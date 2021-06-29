const fs = require('fs')

const defaultConfig = {
    oAuthToken: '',
    forderId: '',
    sourceLanguage: 'en',
    translationLanguage: 'ru',
    extraBlockForTranslation: true,
    hotkeyOpenSettings: 'Backslash',
    hotkeyExitApp: 'NumpadSubtract',
    hotkeyTranslate: 'Numpad0',
    hotkeyOpenCloseRects: 'NumpadAdd',
    hotkeyOpenCloseTranslation: 'Numpad1',
    translationColor: 'black',
    translationOutlineColor: 'orange',
    translationFontColor: 'orange',
    translationFontSize: '14',
    translationFontFamily: 'Comic Sans MS',
    rect: { left: 444, top: 544, width: 586, height: 139 },
    translationRect: { left: 1311, top: 162, width: 362, height: 532 },
}

class Config {
    constructor() {
        try {
            const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
            for (let property in defaultConfig) {
                if (!config.hasOwnProperty(property)) {
                    config[property] = defaultConfig[property];
                }
            }
            this._config = config;
        }
        catch (_) {
            this._config = defaultConfig;
        }
    }

    get(key) {
        return this._config[key];
    }

    set(key, value) {
        if (this._config.hasOwnProperty(key)) {
            this._config[key] = value;
        }
    }

    getObject() {
        return Object.assign({}, this._config);
    }

    setObject(config) {
        for (let key in config) {
            if (this._config.hasOwnProperty(key)) {
                this._config[key] = config[key];
            }
        }
        this.save();
    }

    save() {
        fs.writeFile('./config.json', JSON.stringify(this._config), (err) => {
            if (err) {
                throw err;
            }
        });
    }
}

const config = new Config();
module.exports.config = config;

