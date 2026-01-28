# Chartly Spreadsheet

A high-performance canvas-based spreadsheet built with React and Vite.

## Features

### Rendering
- Canvas-based rendering for performance (no DOM per-cell)
- Hi-DPI / Retina display support via `devicePixelRatio` scaling
- Four separate canvases: corner, column headers, row numbers, and body
- Frozen column headers and row numbers that don't repaint during scroll
- Virtual scrolling with 1000 rows and 100 columns
- Gridlines and cell borders

### Layout
- Full-screen layout with no browser scrollbar
- CSS Grid for frozen header/row-number panels
- Responsive — fills browser window on resize

### Selection
- Click to select a cell (blue border highlight)
- Drag to select a range of cells (blue fill overlay)
- Shift+Click to extend selection
- Shift+Arrow keys to extend selection incrementally
- Arrow keys to move selection
- Tab / Shift+Tab to move horizontally
- Default selection on cell A1 at startup

### Editing
- Double-click or press Enter/F2 to enter edit mode
- Type any character to begin editing immediately
- Enter commits and moves down, Tab commits and moves right
- Escape cancels the edit
- Arrow keys exit edit mode and move focus (Left/Right only at cursor boundaries)
- Click another cell while editing commits the current edit and enters edit on the new cell
- Delete/Backspace clears the selected cell
- All cells are editable, including header rows

### Formulas
- Cells starting with `=` are evaluated as formulas
- Cell references: `=A1`, `=B3+C3`
- Arithmetic: `=A1*2+B1/3`
- Range functions: `SUM`, `AVG`/`AVERAGE`, `MIN`, `MAX`, `COUNT`
- Rectangular ranges: `=SUM(C3:E5)` sums all cells in the 3x3 block
- Circular reference detection (displays `#ERR`)
- Invalid formulas display `#ERR`
- Editing a formula cell shows the raw formula; the cell displays the computed result
- Arrow keys during formula editing insert/replace cell references at the cursor
- Repeated arrow keys move the referenced cell instead of inserting duplicates

### Copy & Paste
- Ctrl+C / Cmd+C copies the selected range as tab-separated text to the clipboard
- Copies evaluated values, not raw formulas
- Ctrl+V / Cmd+V pastes tab-separated text starting at the focused cell
- Newlines in pasted text create new rows; tabs create new columns

### Toolbar
- Font size selector (8–32px) applies to the selected cell range
- Text color picker with 16 preset swatches in a 4×4 grid
- Custom color option via native color input
- Color picker dropdown closes on outside click
- Formatting is per-cell and persists across scroll and selection changes

### Resizable Columns and Rows
- Drag the right edge of a column header to resize the column
- Drag the bottom edge of a row number to resize the row
- Cursor changes to `col-resize` / `row-resize` when hovering near edges
- Minimum column width: 40px, minimum row height: 16px
- Default column width: 120px, default row height: 30px
- Prefix-sum arrays with binary search for O(log n) hit-testing of variable-size cells

### Data
- Editing any cell outside the initial data auto-expands the data model
- Demo dataset with 15 customers and 40 sales records
- Combined view with field headers, customer data, separator, and sales data
- ISO 8601 date format

## Tech Stack
- React 18
- Vite
- Tailwind CSS
- HTML5 Canvas API

## Project Structure

```
├── index.html                        # Main HTML file
├── package.json                      # Dependencies and scripts
└── src/
    ├── main.jsx                      # Entry point
    ├── spreadsheet.js                # Core data model (sizes, prefix sums, binary search)
    ├── renderer.js                   # Canvas rendering (4 regions, hi-DPI)
    ├── data.js                       # Sample data generator
    └── components/
        ├── App.jsx                   # Root app layout
        ├── Layout.jsx                # Header and footer
        ├── Toolbar.jsx               # Font size and color picker toolbar
        └── SpreadsheetCanvas.jsx     # Main component (selection, editing, resize, scroll)
```

## Usage

```bash
npm install
npm run dev
```
