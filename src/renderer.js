/**
 * Canvas Renderer - Draws spreadsheet on canvas with separate regions
 * for frozen headers and row numbers.
 */

const HEADER_HEIGHT = 35;
const ROW_NUMBER_WIDTH = 50;

/** Set up canvas for hi-DPI rendering. Returns the 2d context already scaled. */
function setupCanvas(canvas, w, h) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return ctx;
}

/** Renders the top-left corner cell */
export function renderCorner(canvas) {
    const ctx = setupCanvas(canvas, ROW_NUMBER_WIDTH, HEADER_HEIGHT);
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, ROW_NUMBER_WIDTH, HEADER_HEIGHT);
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, ROW_NUMBER_WIDTH, HEADER_HEIGHT);
}

/** Renders column headers with variable widths */
export function renderColumnHeaders(canvas, spreadsheet, viewportWidth) {
    const ctx = setupCanvas(canvas, viewportWidth, HEADER_HEIGHT);
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, viewportWidth, HEADER_HEIGHT);

    const scrollX = spreadsheet.scrollX;
    const startCol = spreadsheet.getColAtX(scrollX);
    let x = spreadsheet.getColLeft(startCol) - scrollX;

    for (let i = startCol; x < viewportWidth && i < spreadsheet.virtualColumns; i++) {
        const w = spreadsheet.colWidths[i];

        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(x, 0, w, HEADER_HEIGHT);
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, 0, w, HEADER_HEIGHT);

        ctx.fillStyle = '#666';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(getColumnLetter(i), x + w / 2, HEADER_HEIGHT / 2);

        x += w;
    }
}

/** Renders row numbers with variable heights */
export function renderRowNumbers(canvas, spreadsheet, viewportHeight) {
    const ctx = setupCanvas(canvas, ROW_NUMBER_WIDTH, viewportHeight);

    const scrollY = spreadsheet.scrollY;
    const startRow = spreadsheet.getRowAtY(scrollY);
    let y = spreadsheet.getRowTop(startRow) - scrollY;

    for (let i = startRow; y < viewportHeight && i < spreadsheet.virtualRows; i++) {
        const h = spreadsheet.rowHeights[i];

        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, y, ROW_NUMBER_WIDTH, h);
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, y, ROW_NUMBER_WIDTH, h);

        ctx.fillStyle = '#666';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), ROW_NUMBER_WIDTH / 2, y + h / 2);

        y += h;
    }
}

/** Renders the main data body */
export function renderBody(canvas, spreadsheet, viewportWidth, viewportHeight, selectedCell) {
    const ctx = setupCanvas(canvas, viewportWidth, viewportHeight);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    const scrollX = spreadsheet.scrollX;
    const scrollY = spreadsheet.scrollY;
    const startRow = spreadsheet.getRowAtY(scrollY);
    const startCol = spreadsheet.getColAtX(scrollX);

    // Draw cells
    let y = spreadsheet.getRowTop(startRow) - scrollY;
    for (let i = startRow; y < viewportHeight && i < spreadsheet.virtualRows; i++) {
        const rh = spreadsheet.rowHeights[i];
        const row = spreadsheet.data[i];

        let x = spreadsheet.getColLeft(startCol) - scrollX;
        for (let j = startCol; x < viewportWidth && j < spreadsheet.virtualColumns; j++) {
            const cw = spreadsheet.colWidths[j];

            if (row && row._isFieldHeader) {
                ctx.fillStyle = '#e5e7eb';
                ctx.fillRect(x, y, cw, rh);
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, cw, rh);
                ctx.fillStyle = '#1f2937';
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                const text = row[j] != null ? String(row[j]) : '';
                ctx.fillText(text, x + 5, y + rh / 2);
            } else {
                const display = spreadsheet.evaluateCell(i, j);
                drawCell(ctx, x, y, cw, rh, display, spreadsheet.getCellFormat(i, j));
            }
            x += cw;
        }
        y += rh;
    }

    // Gridlines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;

    // Vertical gridlines
    let gx = spreadsheet.getColLeft(startCol) - scrollX;
    for (let i = startCol; gx < viewportWidth && i < spreadsheet.virtualColumns; i++) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, viewportHeight);
        ctx.stroke();
        gx += spreadsheet.colWidths[i];
    }

    // Horizontal gridlines
    let gy = spreadsheet.getRowTop(startRow) - scrollY;
    for (let i = startRow; gy < viewportHeight && i < spreadsheet.virtualRows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(viewportWidth, gy);
        ctx.stroke();
        gy += spreadsheet.rowHeights[i];
    }

    // Draw selection range highlight
    if (selectedCell) {
        const sel = selectedCell;

        if (sel.startRow !== undefined) {
            const rx1 = spreadsheet.getColLeft(sel.startCol) - scrollX;
            const ry1 = spreadsheet.getRowTop(sel.startRow) - scrollY;
            const rx2 = spreadsheet.getColLeft(sel.endCol + 1) - scrollX;
            const ry2 = spreadsheet.getRowTop(sel.endRow + 1) - scrollY;

            const clampX1 = Math.max(0, rx1);
            const clampY1 = Math.max(0, ry1);
            const clampX2 = Math.min(viewportWidth, rx2);
            const clampY2 = Math.min(viewportHeight, ry2);

            if (clampX2 > clampX1 && clampY2 > clampY1) {
                ctx.fillStyle = 'rgba(37,99,235,0.1)';
                ctx.fillRect(clampX1, clampY1, clampX2 - clampX1, clampY2 - clampY1);
                ctx.strokeStyle = '#2563eb';
                ctx.lineWidth = 2;
                ctx.strokeRect(rx1 + 1, ry1 + 1, rx2 - rx1 - 2, ry2 - ry1 - 2);
            }
        }

        if (sel.anchorRow !== undefined) {
            const ax = spreadsheet.getColLeft(sel.anchorCol) - scrollX;
            const ay = spreadsheet.getRowTop(sel.anchorRow) - scrollY;
            const aw = spreadsheet.colWidths[sel.anchorCol] || 120;
            const ah = spreadsheet.rowHeights[sel.anchorRow] || 30;
            if (ax + aw > 0 && ax < viewportWidth && ay + ah > 0 && ay < viewportHeight) {
                ctx.strokeStyle = '#2563eb';
                ctx.lineWidth = 2;
                ctx.strokeRect(ax + 1, ay + 1, aw - 2, ah - 2);
            }
        }
    }
}

function drawCell(ctx, x, y, w, h, text, format) {
    const bgColor = (format && format.bgColor) || '#fafafa';
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    const fontSize = (format && format.fontSize) || 12;
    const color = (format && format.color) || '#333';
    const bold = (format && format.bold) ? 'bold ' : '';
    const italic = (format && format.italic) ? 'italic ' : '';
    ctx.fillStyle = color;
    ctx.font = `${italic}${bold}${fontSize}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const charWidth = fontSize * 0.6;
    const maxChars = Math.max(1, Math.floor((w - 10) / charWidth));
    const truncated = text.length > maxChars ? text.substring(0, maxChars) + '...' : text;
    ctx.fillText(truncated, x + 5, y + h / 2);
}

function getColumnLetter(index) {
    let letter = '';
    let num = index;
    while (num >= 0) {
        letter = String.fromCharCode(65 + (num % 26)) + letter;
        num = Math.floor(num / 26) - 1;
    }
    return letter;
}

export { HEADER_HEIGHT, ROW_NUMBER_WIDTH, getColumnLetter };
