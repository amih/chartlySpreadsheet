/**
 * Canvas Renderer - Draws spreadsheet on canvas with scrollbars
 */
export class CanvasRenderer {
    constructor(canvas, spreadsheet, viewportWidth, viewportHeight) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.spreadsheet = spreadsheet;
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
        this.cellWidth = 120;
        this.cellHeight = 30;
        this.headerHeight = 35;
        this.rowNumberWidth = 50;
        this.padding = 10;
    }

    render() {
        // Set canvas to viewport size
        this.canvas.width = this.viewportWidth;
        this.canvas.height = this.viewportHeight;

        // Clear canvas
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

        // Draw row numbers header
        this.drawRowNumberHeader();

        // Draw column headers
        this.drawColumnHeaders();

        // Draw rows
        this.drawRows();

        // Draw gridlines
        this.drawGridlines();
    }

    drawRowNumberHeader() {
        this.ctx.fillStyle = '#e5e7eb';
        this.ctx.fillRect(0, 0, this.rowNumberWidth, this.headerHeight);

        this.ctx.strokeStyle = '#d1d5db';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(0, 0, this.rowNumberWidth, this.headerHeight);
    }

    drawColumnHeaders() {
        const scrollStartCol = Math.floor(this.spreadsheet.scrollX / this.cellWidth);

        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(this.rowNumberWidth, 0, this.viewportWidth - this.rowNumberWidth, this.headerHeight);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        let x = this.rowNumberWidth - (this.spreadsheet.scrollX % this.cellWidth);
        for (let i = scrollStartCol; i < scrollStartCol + Math.ceil((this.viewportWidth - this.rowNumberWidth) / this.cellWidth) + 1; i++) {
            if (x > this.viewportWidth) break;

            const headerText = this.getColumnLetter(i);
            this.ctx.fillText(headerText, x + this.cellWidth / 2, this.headerHeight / 2);

            this.ctx.strokeStyle = '#d1d5db';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, 0, this.cellWidth, this.headerHeight);

            x += this.cellWidth;
        }
    }

    drawRows() {
        const rows = this.spreadsheet.getRows();
        const columns = this.spreadsheet.getColumns();
        const startRow = Math.floor(this.spreadsheet.scrollY / this.cellHeight);
        const startCol = Math.floor(this.spreadsheet.scrollX / this.cellWidth);
        
        const visibleRows = Math.ceil((this.viewportHeight - this.headerHeight) / this.cellHeight) + 1;
        const visibleCols = Math.ceil((this.viewportWidth - this.rowNumberWidth) / this.cellWidth) + 1;

        let y = this.headerHeight - (this.spreadsheet.scrollY % this.cellHeight);

        for (let i = startRow; i < startRow + visibleRows; i++) {
            if (y > this.viewportHeight) break;

            const row = rows[i];
            const rowExists = i < rows.length && row;

            // Draw row number
            this.ctx.fillStyle = '#f3f4f6';
            this.ctx.fillRect(0, y, this.rowNumberWidth, this.cellHeight);
            this.ctx.strokeStyle = '#d1d5db';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(0, y, this.rowNumberWidth, this.cellHeight);

            this.ctx.fillStyle = '#666';
            this.ctx.font = '11px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(String(i + 1), this.rowNumberWidth / 2, y + this.cellHeight / 2);

            // Draw cells
            let x = this.rowNumberWidth - (this.spreadsheet.scrollX % this.cellWidth);
            for (let j = startCol; j < startCol + visibleCols; j++) {
                if (x > this.viewportWidth) break;

                if (rowExists && row.isFieldHeader) {
                    // Draw field header row (field names)
                    this.ctx.fillStyle = '#e5e7eb';
                    this.ctx.fillRect(x, y, this.cellWidth, this.cellHeight);
                    this.ctx.strokeStyle = '#d1d5db';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(x, y, this.cellWidth, this.cellHeight);
                    this.ctx.fillStyle = '#1f2937';
                    this.ctx.font = 'bold 12px sans-serif';
                    this.ctx.textAlign = 'left';
                    this.ctx.textBaseline = 'middle';
                    if (columns[j]) {
                        const text = row[columns[j].key] || '';
                        this.ctx.fillText(text, x + 5, y + this.cellHeight / 2);
                    }
                } else if (rowExists && row.isHeader) {
                    // Draw section header row
                    this.ctx.fillStyle = '#1f2937';
                    this.ctx.fillRect(x, y, this.cellWidth, this.cellHeight);
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = 'bold 12px sans-serif';
                    this.ctx.textAlign = 'left';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(row.label, x + 5, y + this.cellHeight / 2);
                } else if (rowExists && columns[j]) {
                    const cell = row[columns[j].key];
                    this.drawCell(x, y, String(cell || ''));
                } else {
                    // Empty cell
                    this.drawCell(x, y, '');
                }
                x += this.cellWidth;
            }

            y += this.cellHeight;
        }
    }

    drawCell(x, y, text) {
        this.ctx.fillStyle = '#fafafa';
        this.ctx.fillRect(x, y, this.cellWidth, this.cellHeight);

        this.ctx.strokeStyle = '#e5e7eb';
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
        const startCol = Math.floor(this.spreadsheet.scrollX / this.cellWidth);
        const visibleCols = Math.ceil((this.viewportWidth - this.rowNumberWidth) / this.cellWidth) + 1;

        this.ctx.strokeStyle = '#e5e7eb';
        this.ctx.lineWidth = 0.5;

        // Vertical lines
        let x = this.rowNumberWidth - (this.spreadsheet.scrollX % this.cellWidth);
        for (let i = 0; i <= visibleCols; i++) {
            if (x > this.viewportWidth) break;
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.headerHeight);
            this.ctx.lineTo(x, this.viewportHeight);
            this.ctx.stroke();
            x += this.cellWidth;
        }

        // Horizontal lines
        let y = this.headerHeight - (this.spreadsheet.scrollY % this.cellHeight);
        while (y < this.viewportHeight) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.rowNumberWidth, y);
            this.ctx.lineTo(this.viewportWidth, y);
            this.ctx.stroke();
            y += this.cellHeight;
        }
    }

    getColumnLetter(index) {
        let letter = '';
        let num = index;
        while (num >= 0) {
            letter = String.fromCharCode(65 + (num % 26)) + letter;
            num = Math.floor(num / 26) - 1;
        }
        return letter;
    }
}
