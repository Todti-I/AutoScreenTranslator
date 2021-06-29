function createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = window.screen.width;
    canvas.height = window.screen.height;
    const context = canvas.getContext('2d');

    let isExtra = false;
    let isDrawing = false;
    let currentRect = { left: 0, top: 0, width: 0, height: 0 };

    let rect = { left: 0, top: 0, width: 0, height: 0 };
    let translationRect = { left: 0, top: 0, width: 0, height: 0 };

    canvas.addEventListener('mousedown', e => {
        isDrawing = true;
        currentRect.left = e.offsetX;
        currentRect.top = e.offsetY;
        isExtra = e.button === 2;
    });

    canvas.addEventListener('mousemove', e => {
        if (!isDrawing) return;
        currentRect.width = e.offsetX - currentRect.left;
        currentRect.height = e.offsetY - currentRect.top;
        drawRects(context);
    });

    canvas.addEventListener('mouseup', e => {
        if (!isDrawing) return;
        isDrawing = false;
        currentRect.width = e.offsetX - currentRect.left;
        currentRect.height = e.offsetY - currentRect.top;
        if (Math.abs(currentRect.width * currentRect.height) > 1000) {
            if (isExtra) {
                translationRect = Object.assign({}, currentRect);
                window.api.send('rects-message', { translationRect });
            }
            else {
                rect = Object.assign({}, currentRect);
                window.api.send('rects-message', { rect });
            }
        }
        drawRects(context);
        isExtra = false;
    });

    const drawRects = (context) => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        drawRect(context, !isExtra && isDrawing ? currentRect : rect, 'red');
        drawRect(context, isExtra && isDrawing ? currentRect : translationRect, 'green');
    };

    const drawRect = (context, rect, color) => {
        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = 3;
        context.rect(rect.left, rect.top, rect.width, rect.height);
        context.stroke();
        context.closePath();
    }

    window.api.receive('rects-reply', (data) => {
        if (data.rect) {
            rect = data.rect;
        }
        if (data.translationRect) {
            translationRect = data.translationRect;
        }
        drawRects(context);
    });

    return canvas;
}

const body = document.querySelector('body');
body.append(createCanvas());
window.api.send('rects-message');