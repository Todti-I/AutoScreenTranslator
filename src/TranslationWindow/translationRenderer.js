const div = document.querySelector('div');
const loader = document.querySelector('#loader');
loader.style.visibility  = 'hidden';

window.api.receive('translation-reply', (data) => {
    if (data.isLoading) {
        loader.style.visibility  = 'visible';
    }
    else loader.style.visibility  = 'hidden';

    if (data.text) {
        div.textContent = data.text;
        div.style.visibility  = 'visible';
    }
    else div.style.visibility  = 'hidden';
});

const translationBlock = document.querySelector('.translationBlock');
const translationText = document.querySelector('.translationText');

window.api.receive('settings-reply', (data) => {
    if (data) {
        translationBlock.style.backgroundColor = data.translationColor;
        translationBlock.style.outlineColor = data.translationOutlineColor;
        translationText.style.color = data.translationFontColor;
        translationText.style.fontSize = `${data.translationFontSize}px`;
        translationText.style.fontFamily = data.translationFontFamily;
    }
});

window.api.send('settings-message');
window.api.send('translation-message');