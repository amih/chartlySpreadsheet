/**
 * Spreadsheet class - Core spreadsheet functionality
 */
export class Spreadsheet {
    constructor(data = [], columns = [], virtualRows = 1000, virtualColumns = 100) {
        this.data = data;
        this.columns = columns;
        this.scrollX = 0;
        this.scrollY = 0;
        this.virtualRows = virtualRows;
        this.virtualColumns = virtualColumns;
        this.cellWidth = 120;
        this.cellHeight = 30;
    }

    getRows() {
        return this.data;
    }

    getColumns() {
        return this.columns;
    }

    addRow(row) {
        this.data.push(row);
    }

    getCell(row, col) {
        if (row < 0 || row >= this.data.length) return null;
        if (col < 0 || col >= this.columns.length) return null;
        return this.data[row][this.columns[col].key];
    }

    scroll(deltaX, deltaY) {
        const maxScrollX = Math.max(0, this.virtualColumns * this.cellWidth - 800);
        const maxScrollY = Math.max(0, this.virtualRows * this.cellHeight - 600);
        
        this.scrollX = Math.max(0, Math.min(maxScrollX, this.scrollX + deltaX));
        this.scrollY = Math.max(0, Math.min(maxScrollY, this.scrollY + deltaY));
    }

    scrollToColumn(col) {
        this.scrollX = Math.max(0, col * this.cellWidth - 100);
    }

    scrollToRow(row) {
        this.scrollY = Math.max(0, row * this.cellHeight - 100);
    }

    getVirtualCanvasWidth() {
        return this.virtualColumns * this.cellWidth + 50; // +50 for row numbers
    }

    getVirtualCanvasHeight() {
        return this.virtualRows * this.cellHeight + 35; // +35 for header
    }

    getScrollPercentX() {
        const maxScroll = Math.max(1, this.getVirtualCanvasWidth() - 800);
        return Math.min(1, this.scrollX / maxScroll);
    }

    getScrollPercentY() {
        const maxScroll = Math.max(1, this.getVirtualCanvasHeight() - 600);
        return Math.min(1, this.scrollY / maxScroll);
    }
}
