/**
 * Spreadsheet class - Core spreadsheet functionality
 */

const DEFAULT_COL_WIDTH = 120;
const DEFAULT_ROW_HEIGHT = 30;
const MIN_COL_WIDTH = 40;
const MIN_ROW_HEIGHT = 16;

export { DEFAULT_COL_WIDTH, DEFAULT_ROW_HEIGHT, MIN_COL_WIDTH, MIN_ROW_HEIGHT };

export class Spreadsheet {
    constructor(data = [], columns = [], virtualRows = 1000, virtualColumns = 100) {
        this.data = data;
        this.columns = columns;
        this.scrollX = 0;
        this.scrollY = 0;
        this.virtualRows = virtualRows;
        this.virtualColumns = virtualColumns;

        // Per-column widths and per-row heights
        this.colWidths = new Array(virtualColumns).fill(DEFAULT_COL_WIDTH);
        this.rowHeights = new Array(virtualRows).fill(DEFAULT_ROW_HEIGHT);

        // Per-cell formatting (fontSize, color)
        this.cellFormats = new Map();

        // Precomputed prefix sums for fast lookup
        this._colPrefix = null;
        this._rowPrefix = null;
        this._rebuildColPrefix();
        this._rebuildRowPrefix();
    }

    _rebuildColPrefix() {
        const p = new Float64Array(this.virtualColumns + 1);
        for (let i = 0; i < this.virtualColumns; i++) {
            p[i + 1] = p[i] + this.colWidths[i];
        }
        this._colPrefix = p;
    }

    _rebuildRowPrefix() {
        const p = new Float64Array(this.virtualRows + 1);
        for (let i = 0; i < this.virtualRows; i++) {
            p[i + 1] = p[i] + this.rowHeights[i];
        }
        this._rowPrefix = p;
    }

    /** X offset of the left edge of column `col` */
    getColLeft(col) {
        if (col <= 0) return 0;
        if (col > this.virtualColumns) col = this.virtualColumns;
        return this._colPrefix[col];
    }

    /** Y offset of the top edge of row `row` */
    getRowTop(row) {
        if (row <= 0) return 0;
        if (row > this.virtualRows) row = this.virtualRows;
        return this._rowPrefix[row];
    }

    /** Find column index at pixel x (relative to content origin) */
    getColAtX(x) {
        if (x <= 0) return 0;
        // Binary search on prefix sums
        let lo = 0, hi = this.virtualColumns - 1;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (this._colPrefix[mid] <= x) lo = mid; else hi = mid - 1;
        }
        return lo;
    }

    /** Find row index at pixel y (relative to content origin) */
    getRowAtY(y) {
        if (y <= 0) return 0;
        let lo = 0, hi = this.virtualRows - 1;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (this._rowPrefix[mid] <= y) lo = mid; else hi = mid - 1;
        }
        return lo;
    }

    setColWidth(col, width) {
        this.colWidths[col] = Math.max(MIN_COL_WIDTH, width);
        this._rebuildColPrefix();
    }

    setRowHeight(row, height) {
        this.rowHeights[row] = Math.max(MIN_ROW_HEIGHT, height);
        this._rebuildRowPrefix();
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

    _ensureRow(row) {
        if (row < 0) return;
        while (this.data.length <= row) {
            this.data.push({});
        }
    }

    _ensureCol(col) {
        if (col < 0) return;
        while (this.columns.length <= col) {
            const idx = this.columns.length;
            this.columns.push({ key: `col${idx}`, label: `Col ${idx}` });
        }
    }

    getCell(row, col) {
        if (row < 0 || col < 0) return null;
        if (row >= this.data.length || col >= this.columns.length) return null;
        return this.data[row][this.columns[col].key];
    }

    setCell(row, col, value) {
        if (row < 0 || col < 0) return;
        this._ensureRow(row);
        this._ensureCol(col);
        this.data[row][this.columns[col].key] = value;
    }

    isCellEditable(row) {
        return row >= 0;
    }

    getCellFormat(row, col) {
        return this.cellFormats.get(`${row},${col}`) || {};
    }

    setCellFormat(row, col, fmt) {
        const key = `${row},${col}`;
        const existing = this.cellFormats.get(key) || {};
        this.cellFormats.set(key, { ...existing, ...fmt });
    }

    setRangeFormat(startRow, startCol, endRow, endCol, fmt) {
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                this.setCellFormat(r, c, fmt);
            }
        }
    }

    /** Parse a cell reference like "A1" into {row, col} (0-indexed) */
    _parseCellRef(ref) {
        const m = ref.match(/^([A-Z]+)(\d+)$/);
        if (!m) return null;
        let col = 0;
        for (const ch of m[1]) {
            col = col * 26 + (ch.charCodeAt(0) - 64);
        }
        col -= 1; // 0-indexed
        const row = parseInt(m[2], 10) - 1; // 0-indexed
        return { row, col };
    }

    /** Get numeric value of a cell for formula use */
    _getCellValue(row, col, visited) {
        const key = `${row},${col}`;
        if (visited.has(key)) return NaN; // circular ref
        visited.add(key);
        const raw = this.getCell(row, col);
        if (raw == null || raw === '') return 0;
        const s = String(raw);
        if (s.startsWith('=')) {
            const result = this._evaluate(s.substring(1), visited);
            return typeof result === 'number' ? result : NaN;
        }
        const n = Number(s.replace(/^\$/, ''));
        return isNaN(n) ? 0 : n;
    }

    /** Expand a range like A1:A5 into array of numeric values */
    _expandRange(startRef, endRef, visited) {
        const s = this._parseCellRef(startRef);
        const e = this._parseCellRef(endRef);
        if (!s || !e) return [];
        const values = [];
        for (let r = Math.min(s.row, e.row); r <= Math.max(s.row, e.row); r++) {
            for (let c = Math.min(s.col, e.col); c <= Math.max(s.col, e.col); c++) {
                values.push(this._getCellValue(r, c, new Set(visited)));
            }
        }
        return values;
    }

    /** Evaluate a formula expression (without the leading =) */
    _evaluate(expr, visited) {
        try {
            // Handle range functions: SUM, AVG, MIN, MAX, COUNT
            let processed = expr.replace(
                /\b(SUM|AVG|AVERAGE|MIN|MAX|COUNT)\(([A-Z]+\d+):([A-Z]+\d+)\)/gi,
                (_, fn, start, end) => {
                    const vals = this._expandRange(start.toUpperCase(), end.toUpperCase(), visited);
                    const nums = vals.filter(v => !isNaN(v));
                    switch (fn.toUpperCase()) {
                        case 'SUM': return nums.reduce((a, b) => a + b, 0);
                        case 'AVG':
                        case 'AVERAGE': return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
                        case 'MIN': return nums.length ? Math.min(...nums) : 0;
                        case 'MAX': return nums.length ? Math.max(...nums) : 0;
                        case 'COUNT': return nums.length;
                        default: return 0;
                    }
                }
            );

            // Replace remaining cell references with their values
            processed = processed.replace(/\b([A-Z]+)(\d+)\b/gi, (_, letters, digits) => {
                const ref = this._parseCellRef(letters.toUpperCase() + digits);
                if (!ref) return '0';
                return this._getCellValue(ref.row, ref.col, new Set(visited));
            });

            // Evaluate the resulting math expression safely
            const result = new Function(`"use strict"; return (${processed});`)();
            return typeof result === 'number' && isFinite(result) ? result : '#ERR';
        } catch {
            return '#ERR';
        }
    }

    /** Returns the display value for a cell — evaluates formulas */
    evaluateCell(row, col) {
        const raw = this.getCell(row, col);
        if (raw == null || raw === '') return '';
        const s = String(raw);
        if (!s.startsWith('=')) return s;
        const result = this._evaluate(s.substring(1), new Set([`${row},${col}`]));
        return String(result);
    }

    getVirtualCanvasWidth() {
        return this._colPrefix[this.virtualColumns];
    }

    getVirtualCanvasHeight() {
        return this._rowPrefix[this.virtualRows];
    }
}
