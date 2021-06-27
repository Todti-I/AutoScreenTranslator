const fetch = require('node-fetch');
const Jimp = require('jimp');

let tokenJson;

module.exports.getIamToken = async (oAuthToken) => {
    if (tokenJson && tokenJson.oAuthToken === oAuthToken
        && new Date(tokenJson.expiresAt) - Date.now() > 1000 * 60 * 60 * 11) {
        return { isError: false, data: tokenJson.iamToken };
    }
    console.log('>Update Iam Token');
    const response = await fetch('https://iam.api.cloud.yandex.net/iam/v1/tokens', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 'yandexPassportOauthToken': oAuthToken })
    });

    const json = await response.json();

    if (response.status === 200) {
        tokenJson = Object.assign(json, { oAuthToken });
        return { isError: false, data: tokenJson.iamToken };
    }

    return { isError: true, data: `[Iam Token Yandex] (${json.code}) ${json.message}` };
}

module.exports.getTranslationFromText = async (iamToken, folderId,
    sourceLanguage, translationLanguage, text) => {
    const options = {
        'folderId': folderId,
        'sourceLanguageCode': sourceLanguage,
        'targetLanguageCode': translationLanguage,
        'texts': [text],
    };

    const response = await fetch('https://translate.api.cloud.yandex.net/translate/v2/translate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${iamToken}`
        },
        body: JSON.stringify(options)
    });

    const json = await response.json();

    if (response.status === 200) {
        return { isError: false, data: json.translations[0].text };
    }
    return { isError: true, data: `[Yandex Translate API] (${json.code}) ${json.message}` };
}

module.exports.getTextFromImage = async (iamToken, folderId, image, rect, language) => {
    const croppedImage = await cropImage(image, rect);
    const base64 = croppedImage.split(',')[1];
    const options = {
        'folderId': folderId,
        'analyze_specs': [{
            'content': base64,
            'features': [{
                'type': 'TEXT_DETECTION',
                'text_detection_config': {
                    'language_codes': [language]
                }
            }]
        }]
    };

    const response = await fetch('https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${iamToken}`
        },
        body: JSON.stringify(options)
    });

    const json = await response.json();

    if (response.status === 200) {
        try {
            const text = json.results[0].results[0].textDetection.pages[0].blocks
                .map(b => b.lines
                    .map(l => l.words
                        .map(w => w.text)
                        .join(' '))
                    .join(' '))
                .join('\n');
            return { isError: false, data: text };
        }
        catch (err) {
            return { isError: true, data: 'Текст не распознан' };;
        }
    }

    return { isError: true, data: `[Yandex Vision API] (${json.code}) ${json.message}` };
}

async function cropImage(img, rect) {
    const base64 = img.split(',')[1];

    const image = await Jimp.read(Buffer.from(base64, 'base64'));
    image.crop(rect.left, rect.top, rect.width, rect.height);

    return await image.getBase64Async(Jimp.MIME_PNG);
};