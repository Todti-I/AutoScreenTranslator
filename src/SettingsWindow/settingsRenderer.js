const configKeys = [
    'oAuthToken',
    'forderId',
    'sourceLanguage',
    'translationLanguage',
    'extraBlockForTranslation',
    'hotkeyOpenSettings',
    'hotkeyExitApp',
    'hotkeyTranslate',
    'hotkeyOpenCloseRects',
    'hotkeyCloseRects',
    'hotkeyOpenCloseTranslation',
    'hotkeyCloseTranslation',
    'translationColor',
    'translationFontColor',
    'translationFontSize',
    'translationFontFamily',
]

let config = {};

const translationWindow = document.querySelector('#translationWindow');

window.api.receive('settings-reply', (data) => {
    if (data) {
        config = data;
        loadConfig();
    }
});

window.api.send('settings-message');

function loadConfig() {
    configKeys.forEach(key => {
        const element = document.querySelector(`#${key}`)
        if (element) {
            if (typeof config[key] === 'boolean') {
                element.checked = config[key];
            }
            else element.value = config[key];
        }
    });

    translationWindow.style.backgroundColor = config.translationColor;
    translationWindow.style.outlineColor = config.translationOutlineColor;
    translationWindow.style.color = config.translationFontColor;
    translationWindow.style.fontSize = `${config.translationFontSize}px`;
    translationWindow.style.fontFamily = config.translationFontFamily;
}

function saveConfig() {
    configKeys.forEach(key => {
        const element = document.querySelector(`#${key}`)
        if (element) {
            if (typeof config[key] === 'boolean') {
                config[key] = element.checked;
            }
            else config[key] = element.value;
        }
    });
    config.translationOutlineColor = translationWindow.style.outlineColor;
    window.api.send('settings-message', config);
    closeWindow();
}

function closeWindow() {
    window.api.send('settings-close');
}

function openTab(event, tabName) {
    document.querySelectorAll('.tabcontent')
        .forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tablinks')
        .forEach(t => t.classList.remove('active'))

    document.querySelector(`#${tabName}`).style.display = 'grid';
    event.currentTarget.classList.add('active');
}

function hotkeyDown(event) {
    event.currentTarget.value = event.key;
    return false;
}

let key = '';
let ctrlKey = false;
let shiftKey = false;
let altKey = false;
let metaKey = false;

function hotkeyDown(event) {
    ctrlKey = event.ctrlKey;
    shiftKey = event.shiftKey;
    altKey = event.altKey;
    metaKey = event.metaKey;

    if (event.key !== 'Control' && event.key !== 'Shift'
        && event.key !== 'Alt' && event.key !== 'Meta') {
        key = event.code.split('Key').filter(k => k)[0].
            split('Digit').filter(k => k)[0];
    }
    event.currentTarget.value = (ctrlKey ? 'Ctrl + ' : '')
        + (shiftKey ? 'Shift + ' : '')
        + (altKey ? 'Alt + ' : '')
        + (metaKey ? 'Meta + ' : '')
        + key;

    config[event.currentTarget.id] = event.currentTarget.value;

    event.preventDefault();
}

document.querySelector('#defaultOpen').click();

document.querySelector('#translationFontSize').addEventListener('input',
    (e) => translationWindow.style.fontSize = `${e.currentTarget.value}px`);

document.querySelector('#translationFontFamily').addEventListener('change',
    (e) => translationWindow.style.fontFamily = e.currentTarget.value);
