/**
 * Canvas Renderer - Draws spreadsheet on canvas with scrollbars
 */
export class CanvasRenderer {
    constructor(canvas, spreadsheet) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.spreadsheet = spreadsheet;
        this.cellWidth = 120;
        this.cellHeight = 30;
        this.headerHeight = 35;
        this.padding = 10;
    }

    render() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        this.canvas.width = width;
        this.canvas.height = height;

        // Clear canvas
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, width, height);

        // Draw header
        this.drawHeader();

        // Draw rows
        this.drawRows();

        // Draw gridlines
        this.drawGridlines();
    }

    drawHeader() {
        const columns = this.spreadsheet.getColumns();
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.headerHeight);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';

        let x = this.padding;
        for (const column of columns) {
            this.ctx.fillText(column.label, x + 5, this.headerHeight / 2);
            x += this.cellWidth;
        }
    }

    drawRows() {
        const rows = this.spreadsheet.getRows();
        const columns = this.spreadsheet.getColumns();
        const startRow = Math.floor(this.spreadsheet.scrollY / this.cellHeight);
        const startCol = Math.floor(this.spreadsheet.scrollX / this.cellWidth);

        let y = this.headerHeight;

        for (let i = startRow; i < rows.length && y < this.canvas.height; i++) {
            let x = this.padding;

            for (let j = startCol; j < columns.length && x < this.canvas.width; j++) {
                const cell = rows[i][columns[j].key];
                this.drawCell(x, y, String(cell || ''));
                x += this.cellWidth;
            }

            y += this.cellHeight;
        }
    }

    drawCell(x, y, text) {
        this.ctx.fillStyle = '#f9f9f9';
        this.ctx.fillRect(x, y, this.cellWidth, this.cellHeight);

        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, this.cellWidth, this.cellHeight);

        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';

        const truncated = text.length > 12 ? text.substring(0, 12) + '...' : text;
        this.ctx.fillText(truncated, x + 5, y + this.cellHeight / 2);
    }

    drawGridlines() {
        this.ctx.strokeStyle = '#eee';
        this.ctx.lineWidth = 0.5;

        // Vertical lines
        for (let x = this.padding; x < this.canvas.width; x += this.cellWidth) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = this.headerHeight; y < this.canvas.height; y += this.cellHeight) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
}
