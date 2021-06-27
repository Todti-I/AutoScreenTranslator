const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
    'api', {
    send: (channel, data) => {
        const validChannels = ['rects-message', 'translation-message',
            'settings-message', 'settings-close'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        const validChannels = ['rects-reply', 'translation-reply', 'settings-reply'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
});