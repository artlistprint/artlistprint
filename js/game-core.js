let drawCanvas, drawCtx;
let templateCanvas, templateCtx;

let currentTool = 'brush'; // 'brush', 'fill', 'eraser', 'pan'
let currentColor = '#e74c3c';
let brushSize = 20;
let brushOpacity = 0.9;
let isDrawing = false;

// Zoom и Pan
let zoomScale = 1;
let panX = 0, panY = 0;
let isPanning = false, startPanX = 0, startPanY = 0;

function initCanvas(imgSrc) {
    drawCanvas = document.getElementById('drawing-canvas');
    drawCtx = drawCanvas.getContext('2d', { willReadFrequently: true });

    templateCanvas = document.getElementById('template-canvas');
    templateCtx = templateCanvas.getContext('2d', { willReadFrequently: true });

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imgSrc;
    img.onload = function() {
        const w = img.naturalWidth || 800;
        const h = img.naturalHeight || 1000;

        drawCanvas.width = templateCanvas.width = w;
        drawCanvas.height = templateCanvas.height = h;

        // Формируем прозрачную маску для верхнего слоя
        templateCtx.clearRect(0, 0, w, h);
        templateCtx.drawImage(img, 0, 0, w, h);

        const imgData = templateCtx.getImageData(0, 0, w, h);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
            // Удаляем белый фон (делаем 100% прозрачным)
            if (d[i] > 200 && d[i+1] > 200 && d[i+2] > 200) {
                d[i+3] = 0;
            }
        }
        templateCtx.putImageData(imgData, 0, 0);
        resetCanvas();
        resetPanZoom();
    };

    bindEvents();
}

function resetCanvas() {
    if (!drawCtx) return;
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    drawCtx.fillStyle = '#FFFFFF';
    drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
}

function setTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.getElementById('btn-' + tool);
    if (btn) btn.classList.add('active');

    const container = document.getElementById('canvas-container');
    if (tool === 'pan') {
        container.style.cursor = 'grab';
    } else {
        container.style.cursor = 'crosshair';
    }
}

function setColor(hex, elem) {
    currentColor = hex;
    document.getElementById('custom-color').value = hex;
    if (elem) {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        elem.classList.add('active');
    }
}

function updateToolSettings() {
    brushSize = parseInt(document.getElementById('tool-size').value);
    brushOpacity = parseFloat(document.getElementById('tool-opacity').value);
}

/* Привязчик событий */
function bindEvents() {
    const container = document.getElementById('canvas-container');

    container.onmousedown = (e) => {
        if (currentTool === 'pan') {
            isPanning = true; startPanX = e.clientX - panX; startPanY = e.clientY - panY;
            container.style.cursor = 'grabbing';
        } else {
            startDraw(e);
        }
    };

    container.onmousemove = (e) => {
        if (isPanning) {
            panX = e.clientX - startPanX; panY = e.clientY - startPanY;
            applyTransform();
        } else {
            draw(e);
        }
    };

    container.onmouseup = container.onmouseleave = () => {
        isPanning = false;
        if (currentTool === 'pan') container.style.cursor = 'grab';
        stopDraw();
    };

    // Zoom колесиком
    container.onwheel = (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        zoomScale = Math.max(0.5, Math.min(3.0, zoomScale * zoomFactor));
        applyTransform();
    };
}

function applyTransform() {
    const wrapper = document.getElementById('canvas-wrapper');
    if (wrapper) {
        wrapper.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    }
}

function resetPanZoom() {
    zoomScale = 1; panX = 0; panY = 0;
    applyTransform();
}

function getCanvasCoords(e) {
    const rect = drawCanvas.getBoundingClientRect();
    return {
        x: Math.round((e.clientX - rect.left) * (drawCanvas.width / rect.width)),
        y: Math.round((e.clientY - rect.top) * (drawCanvas.height / rect.height))
    };
}

function startDraw(e) {
    isDrawing = true;
    const coords = getCanvasCoords(e);
    if (currentTool === 'fill') {
        floodFill(coords.x, coords.y, currentColor);
    } else {
        drawCtx.beginPath();
        drawCtx.moveTo(coords.x, coords.y);
    }
}

function draw(e) {
    if (!isDrawing || currentTool === 'fill' || currentTool === 'pan') return;
    const coords = getCanvasCoords(e);

    drawCtx.lineWidth = brushSize;
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';

    if (currentTool === 'eraser') {
        drawCtx.strokeStyle = '#ffffff';
        drawCtx.globalAlpha = 1.0;
    } else {
        drawCtx.strokeStyle = currentColor;
        drawCtx.globalAlpha = brushOpacity;
    }

    drawCtx.lineTo(coords.x, coords.y);
    drawCtx.stroke();
}

function stopDraw() {
    if (isDrawing) {
        isDrawing = false;
        drawCtx.beginPath();
        drawCtx.globalAlpha = 1.0;
    }
}

/* Оптимизированная заливка без вылетов и с расширением под контур */
function floodFill(startX, startY, fillHex) {
    const width = drawCanvas.width;
    const height = drawCanvas.height;

    const drawImgData = drawCtx.getImageData(0, 0, width, height);
    const drawData = drawImgData.data;

    const tmplImgData = templateCtx.getImageData(0, 0, width, height);
    const tmplData = tmplImgData.data;

    const startIdx = (startY * width + startX) * 4;

    // Клик по черному контуру (альфа > 150 и темный цвет < 80) — игнорируем
    if (tmplData[startIdx + 3] > 150 && tmplData[startIdx] < 80) return;

    const fillRgb = hexToRgb(fillHex);
    const targetR = drawData[startIdx];
    const targetG = drawData[startIdx + 1];
    const targetB = drawData[startIdx + 2];

    const tolerance = 40;
    const expandPixels = 2; // Перекрытие полупрозрачного контура в пикселях

    const filledMask = new Uint8Array(width * height);
    // Использование числа вместо массива координат убирает подвисания и переполнение стека
    const stack = [startY * width + startX];

    while (stack.length > 0) {
        const pos = stack.pop();
        if (filledMask[pos]) continue;

        const x = pos % width;
        const y = Math.floor(pos / width);
        const idx = pos * 4;

        // Порог остановки заливки у границы линии
        if (tmplData[idx + 3] > 180 && tmplData[idx] < 70) continue;

        const r = drawData[idx];
        const g = drawData[idx + 1];
        const b = drawData[idx + 2];

        if (Math.abs(r - targetR) <= tolerance &&
            Math.abs(g - targetG) <= tolerance &&
            Math.abs(b - targetB) <= tolerance) {

            filledMask[pos] = 1;

            if (x > 0) stack.push(pos - 1);
            if (x < width - 1) stack.push(pos + 1);
            if (y > 0) stack.push(pos - width);
            if (y < height - 1) stack.push(pos + width);
        }
    }

    // Дилатация: расширяем заливку под сглаженные края контура
    const finalMask = new Uint8Array(filledMask);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pos = y * width + x;
            if (filledMask[pos] === 1) {
                for (let dy = -expandPixels; dy <= expandPixels; dy++) {
                    for (let dx = -expandPixels; dx <= expandPixels; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nPos = ny * width + nx;
                            const nIdx = nPos * 4;
                            // Не заходим только на глубокий черный центр
                            if (tmplData[nIdx + 3] <= 200 || tmplData[nIdx] >= 60) {
                                finalMask[nPos] = 1;
                            }
                        }
                    }
                }
            }
        }
    }

    // Применяем заливку к пикселям холста
    for (let i = 0; i < width * height; i++) {
        if (finalMask[i] === 1) {
            const idx = i * 4;
            drawData[idx] = fillRgb[0];
            drawData[idx + 1] = fillRgb[1];
            drawData[idx + 2] = fillRgb[2];
            drawData[idx + 3] = 255;
        }
    }

    drawCtx.putImageData(drawImgData, 0, 0);
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

/* Экспорт без потери качества */
function saveCanvas() {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = drawCanvas.width;
    exportCanvas.height = drawCanvas.height;
    const exportCtx = exportCanvas.getContext('2d');

    exportCtx.drawImage(drawCanvas, 0, 0);
    exportCtx.drawImage(templateCanvas, 0, 0);

    const link = document.createElement('a');
    link.download = 'artlistprint-coloring.jpg';
    link.href = exportCanvas.toDataURL('image/jpeg', 0.95);
    link.click();
}