/**
 * Spreadsheet class - Core spreadsheet functionality
 */
export class Spreadsheet {
    constructor(data = [], columns = []) {
        this.data = data;
        this.columns = columns;
        this.scrollX = 0;
        this.scrollY = 0;
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
        return this.data[row][this.columns[col].key];
    }

    scroll(deltaX, deltaY) {
        this.scrollX = Math.max(0, this.scrollX + deltaX);
        this.scrollY = Math.max(0, this.scrollY + deltaY);
    }
}
