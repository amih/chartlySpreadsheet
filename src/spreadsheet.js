/**
 * Spreadsheet class - Core spreadsheet functionality
 */

const DEFAULT_COL_WIDTH = 120;
const DEFAULT_ROW_HEIGHT = 30;
const MIN_COL_WIDTH = 40;
const MIN_ROW_HEIGHT = 16;

export { DEFAULT_COL_WIDTH, DEFAULT_ROW_HEIGHT, MIN_COL_WIDTH, MIN_ROW_HEIGHT };

export class Spreadsheet {
    constructor(data = {}, columnCount = 0, virtualRows = 1000, virtualColumns = 100) {
        this.data = data;           // sparse: { rowIndex: { colIndex: value, ... }, ... }
        this.columnCount = columnCount;
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

    getCell(row, col) {
        if (row < 0 || col < 0) return null;
        return this.data[row]?.[col] ?? null;
    }

    setCell(row, col, value) {
        if (row < 0 || col < 0) return;
        if (!this.data[row]) this.data[row] = {};
        if (col >= this.columnCount) this.columnCount = col + 1;
        this.data[row][col] = value;
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

    // ── Client-side Command API ────────────────────────────────────

    /**
     * Execute a command object to manipulate the spreadsheet.
     *
     * Supported commands:
     *
     *   { command: "getValue", row, col, [rowCount, colCount] }
     *       Single cell → raw value. Range (`rowCount`/`colCount` provided) → 2D array.
     *   { command: "getFormula", row, col, [rowCount, colCount] }
     *       Single cell → formula string or null. Range → 2D array of formula|null.
     *   { command: "getDisplay", row, col, [rowCount, colCount] }
     *       Single cell → evaluated display string. Range → 2D array.
     *   { command: "setValue", row, col, value }
     *       Scalar value → sets single cell. 2D array → writes block starting at (row, col).
     *   { command: "getFormat", row, col, [rowCount, colCount] }
     *       Single cell → format object. Range → 2D array of format objects.
     *   { command: "setFormat", row, col, format, [rowCount, colCount] }
     *       Single cell or range. format: { fontSize?, color?, bgColor?, bold?, italic? }
     *   { command: "getColWidth", col }           → column width in px
     *   { command: "getRowHeight", row }          → row height in px
     *   { command: "setColWidth", col, width }    → set column width (min 40)
     *   { command: "setRowHeight", row, height }  → set row height (min 16)
     *   { command: "cellToRef", row, col }        → Excel-style ref string (e.g. "A1", "D4")
     *   { command: "refToCell", ref }              → { row, col } (0-indexed) or null
     *   { command: "getAllData" }                 → 2D array of all data with minimal dimensions
     *   { command: "setData", row, col, data: [ {field: value, ...}, ... ] }
     *       Writes an array of row-objects starting at (row, col).
     *       Row 0 of output = header row (field names), subsequent rows = values.
     *       All objects are assumed to have the same keys.
     *
     * Read commands return data. Write commands return the Spreadsheet instance for chaining.
     */
    exec(cmd) {
        if (!cmd || !cmd.command) cmd = { command: 'help' };
        switch (cmd.command) {
            case 'help':
                return [
                    { command: 'getValue',   example: "{ command: 'getValue', row: 0, col: 0 }",                                         description: 'Get raw value of a single cell' },
                    { command: 'getValue',   example: "{ command: 'getValue', row: 0, col: 0, rowCount: 5, colCount: 3 }",                   description: 'Get raw values of a range (returns 2D array)' },
                    { command: 'getFormula', example: "{ command: 'getFormula', row: 0, col: 0 }",                                       description: 'Get formula string (e.g. "=SUM(A1:A5)") or null if not a formula' },
                    { command: 'getFormula', example: "{ command: 'getFormula', row: 0, col: 0, rowCount: 5, colCount: 3 }",                 description: 'Get formulas for a range (returns 2D array of string|null)' },
                    { command: 'getDisplay', example: "{ command: 'getDisplay', row: 0, col: 0 }",                                      description: 'Get evaluated display value (formulas resolved)' },
                    { command: 'getDisplay', example: "{ command: 'getDisplay', row: 0, col: 0, rowCount: 5, colCount: 3 }",                description: 'Get display values for a range (returns 2D array)' },
                    { command: 'setValue',   example: "{ command: 'setValue', row: 0, col: 0, value: 'Hello' }",                         description: 'Set a single cell value' },
                    { command: 'setValue',   example: "{ command: 'setValue', row: 0, col: 0, value: [['a','b'],['c','d']] }",             description: 'Set a block of values from a 2D array' },
                    { command: 'getFormat',  example: "{ command: 'getFormat', row: 0, col: 0 }",                                                description: 'Get formatting of a single cell (returns { fontSize?, color?, bgColor?, bold?, italic? })' },
                    { command: 'getFormat',  example: "{ command: 'getFormat', row: 0, col: 0, rowCount: 5, colCount: 3 }",                          description: 'Get formatting for a range (returns 2D array of format objects)' },
                    { command: 'setFormat',  example: "{ command: 'setFormat', row: 0, col: 0, format: { fontSize: 18, color: '#e53e3e', bgColor: '#ffffcc', bold: true, italic: false } }", description: 'Set formatting on a single cell (all format props optional)' },
                    { command: 'setFormat',  example: "{ command: 'setFormat', row: 0, col: 0, rowCount: 5, colCount: 3, format: { bold: true } }",     description: 'Set formatting on a range' },
                    { command: 'getColWidth',  example: "{ command: 'getColWidth', col: 0 }",                                               description: 'Get width of a column in pixels' },
                    { command: 'getRowHeight', example: "{ command: 'getRowHeight', row: 0 }",                                            description: 'Get height of a row in pixels' },
                    { command: 'setColWidth',  example: "{ command: 'setColWidth', col: 0, width: 200 }",                                 description: 'Set width of a column in pixels (min 40)' },
                    { command: 'setRowHeight', example: "{ command: 'setRowHeight', row: 0, height: 50 }",                                description: 'Set height of a row in pixels (min 16)' },
                    { command: 'cellToRef',  example: "{ command: 'cellToRef', row: 0, col: 0 }",                                              description: 'Convert row/col to Excel-style reference (returns "A1")' },
                    { command: 'refToCell',  example: "{ command: 'refToCell', ref: 'A1' }",                                                description: 'Convert Excel-style reference to row/col (returns { row: 0, col: 0 })' },
                    { command: 'getAllData',  example: "{ command: 'getAllData' }",                                                          description: 'Get all data as 2D array with minimal dimensions (no trailing empty rows/cols)' },
                    { command: 'setData',    example: "{ command: 'setData', row: 0, col: 0, data: [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }] }", description: 'Write JSON objects with auto-generated header row at given position' },
                    { command: 'help',       example: "{ command: 'help' }",                                                             description: 'Show this help' },
                ];

            case 'getValue': {
                const isRange = cmd.rowCount != null && cmd.colCount != null;
                if (!isRange) {
                    const val = this.getCell(cmd.row, cmd.col);
                    return val == null ? '' : val;
                }
                const endRow = cmd.row + cmd.rowCount - 1;
                const endCol = cmd.col + cmd.colCount - 1;
                const result = [];
                for (let r = cmd.row; r <= endRow; r++) {
                    const row = [];
                    for (let c = cmd.col; c <= endCol; c++) {
                        const v = this.getCell(r, c);
                        row.push(v == null ? '' : v);
                    }
                    result.push(row);
                }
                return result;
            }

            case 'getFormula': {
                const isRange = cmd.rowCount != null && cmd.colCount != null;
                const formulaOf = (r, c) => {
                    const raw = this.getCell(r, c);
                    const s = raw == null ? '' : String(raw);
                    return s.startsWith('=') ? s : null;
                };
                if (!isRange) return formulaOf(cmd.row, cmd.col);
                const endRow = cmd.row + cmd.rowCount - 1;
                const endCol = cmd.col + cmd.colCount - 1;
                const result = [];
                for (let r = cmd.row; r <= endRow; r++) {
                    const row = [];
                    for (let c = cmd.col; c <= endCol; c++) {
                        row.push(formulaOf(r, c));
                    }
                    result.push(row);
                }
                return result;
            }

            case 'getDisplay': {
                const isRange = cmd.rowCount != null && cmd.colCount != null;
                if (!isRange) return this.evaluateCell(cmd.row, cmd.col);
                const endRow = cmd.row + cmd.rowCount - 1;
                const endCol = cmd.col + cmd.colCount - 1;
                const result = [];
                for (let r = cmd.row; r <= endRow; r++) {
                    const row = [];
                    for (let c = cmd.col; c <= endCol; c++) {
                        row.push(this.evaluateCell(r, c));
                    }
                    result.push(row);
                }
                return result;
            }

            case 'setValue': {
                if (Array.isArray(cmd.value)) {
                    const values = cmd.value;
                    for (let r = 0; r < values.length; r++) {
                        const rowVals = values[r];
                        for (let c = 0; c < rowVals.length; c++) {
                            this.setCell(cmd.row + r, cmd.col + c, rowVals[c]);
                        }
                    }
                } else {
                    this.setCell(cmd.row, cmd.col, cmd.value);
                }
                break;
            }

            case 'getFormat': {
                const isRange = cmd.rowCount != null && cmd.colCount != null;
                if (!isRange) return this.getCellFormat(cmd.row, cmd.col);
                const endRow = cmd.row + cmd.rowCount - 1;
                const endCol = cmd.col + cmd.colCount - 1;
                const result = [];
                for (let r = cmd.row; r <= endRow; r++) {
                    const row = [];
                    for (let c = cmd.col; c <= endCol; c++) {
                        row.push(this.getCellFormat(r, c));
                    }
                    result.push(row);
                }
                return result;
            }

            case 'setFormat': {
                const isRange = cmd.rowCount != null && cmd.colCount != null;
                if (!isRange) {
                    this.setCellFormat(cmd.row, cmd.col, cmd.format);
                } else {
                    const endRow = cmd.row + cmd.rowCount - 1;
                    const endCol = cmd.col + cmd.colCount - 1;
                    this.setRangeFormat(cmd.row, cmd.col, endRow, endCol, cmd.format);
                }
                break;
            }

            case 'getColWidth': {
                return this.colWidths[cmd.col];
            }

            case 'getRowHeight': {
                return this.rowHeights[cmd.row];
            }

            case 'setColWidth': {
                this.setColWidth(cmd.col, cmd.width);
                break;
            }

            case 'setRowHeight': {
                this.setRowHeight(cmd.row, cmd.height);
                break;
            }

            case 'cellToRef': {
                // row: 0, col: 0 → "A1"
                let col = cmd.col;
                let letter = '';
                let num = col;
                while (num >= 0) {
                    letter = String.fromCharCode(65 + (num % 26)) + letter;
                    num = Math.floor(num / 26) - 1;
                }
                return `${letter}${cmd.row + 1}`;
            }

            case 'refToCell': {
                // ref: "A1" → { row: 0, col: 0 }
                const parsed = this._parseCellRef(cmd.ref.toUpperCase());
                if (!parsed) return null;
                return parsed;
            }

            case 'getAllData': {
                // Find max row and max col with actual data
                let maxRow = -1, maxCol = -1;
                for (const rKey of Object.keys(this.data)) {
                    const r = Number(rKey);
                    const row = this.data[r];
                    if (!row) continue;
                    for (const cKey of Object.keys(row)) {
                        if (cKey.startsWith('_')) continue;
                        const c = Number(cKey);
                        if (row[c] != null && row[c] !== '') {
                            if (r > maxRow) maxRow = r;
                            if (c > maxCol) maxCol = c;
                        }
                    }
                }
                if (maxRow < 0 || maxCol < 0) return [];
                const result = [];
                for (let r = 0; r <= maxRow; r++) {
                    const row = [];
                    for (let c = 0; c <= maxCol; c++) {
                        const v = this.getCell(r, c);
                        row.push(v == null ? '' : v);
                    }
                    result.push(row);
                }
                return result;
            }

            case 'setData': {
                const { row: topRow, col: topCol, data } = cmd;
                if (!Array.isArray(data) || data.length === 0) break;
                const fields = Object.keys(data[0]);
                // Write header row
                for (let c = 0; c < fields.length; c++) {
                    this.setCell(topRow, topCol + c, fields[c]);
                }
                // Write data rows
                for (let r = 0; r < data.length; r++) {
                    for (let c = 0; c < fields.length; c++) {
                        const v = data[r][fields[c]];
                        this.setCell(topRow + 1 + r, topCol + c, v == null ? '' : v);
                    }
                }
                break;
            }

            default:
                console.warn(`Unknown spreadsheet command: ${cmd.command}`);
        }
        this._onChange?.();
        return this;
    }

    /**
     * Execute multiple commands in batch, triggering a single onChange at the end.
     */
    execBatch(commands) {
        const cb = this._onChange;
        this._onChange = null; // suppress per-command notifications
        for (const cmd of commands) {
            this.exec(cmd);
        }
        this._onChange = cb;
        this._onChange?.();
        return this;
    }

    /**
     * Register a callback invoked after every exec/execBatch.
     */
    onChange(fn) {
        this._onChange = fn;
    }
}
