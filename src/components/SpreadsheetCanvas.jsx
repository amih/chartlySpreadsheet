import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  renderCorner,
  renderColumnHeaders,
  renderRowNumbers,
  renderBody,
  HEADER_HEIGHT,
  ROW_NUMBER_WIDTH,
  getColumnLetter,
} from '../renderer';

function normalizeSelection(anchor, end) {
  if (!anchor) return null;
  const e = end || anchor;
  return {
    anchorRow: anchor.row,
    anchorCol: anchor.col,
    startRow: Math.min(anchor.row, e.row),
    startCol: Math.min(anchor.col, e.col),
    endRow: Math.max(anchor.row, e.row),
    endCol: Math.max(anchor.col, e.col),
  };
}

const RESIZE_HANDLE_PX = 5;

export function SpreadsheetCanvas({ spreadsheet, onSelectionChange, repaintKey }) {
  const cornerRef = useRef(null);
  const colHeaderRef = useRef(null);
  const rowNumRef = useRef(null);
  const bodyRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const [size, setSize] = useState({ w: 800, h: 600 });
  const [anchor, setAnchor] = useState({ row: 0, col: 0 });
  const [selEnd, setSelEnd] = useState({ row: 0, col: 0 });
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const isDragging = useRef(false);

  // Formula cell-reference cursor: tracks the last inserted ref so repeated arrows replace it
  // { row, col, start, end } where start/end are character offsets in editValue
  const formulaRef = useRef(null);

  // Resize state
  const resizeRef = useRef(null); // { type: 'col'|'row', index, startPos, startSize }

  const prevScroll = useRef({ x: 0, y: 0 });

  // ---- Measure container ----
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setSize({
          w: containerRef.current.clientWidth,
          h: containerRef.current.clientHeight,
        });
      }
    };
    const timer = setTimeout(measure, 50);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, []);

  const bodyW = size.w - ROW_NUMBER_WIDTH;
  const bodyH = size.h - HEADER_HEIGHT;

  // ---- Selection object for renderer ----
  const getSelection = useCallback(() => normalizeSelection(anchor, selEnd), [anchor, selEnd]);

  // ---- Paint helpers ----
  const paintBody = useCallback((sel) => {
    if (bodyRef.current) renderBody(bodyRef.current, spreadsheet, bodyW, bodyH, sel);
  }, [spreadsheet, bodyW, bodyH]);

  const paintAll = useCallback(() => {
    if (cornerRef.current) renderCorner(cornerRef.current);
    if (colHeaderRef.current) renderColumnHeaders(colHeaderRef.current, spreadsheet, bodyW);
    if (rowNumRef.current) renderRowNumbers(rowNumRef.current, spreadsheet, bodyH);
    paintBody(getSelection());
  }, [spreadsheet, bodyW, bodyH, getSelection, paintBody]);

  useEffect(() => {
    paintAll();
  }, [paintAll]);

  // Repaint when format changes from toolbar
  useEffect(() => {
    if (repaintKey > 0) paintBody(getSelection());
  }, [repaintKey, paintBody, getSelection]);

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) onSelectionChange(normalizeSelection(anchor, selEnd));
  }, [anchor, selEnd, onSelectionChange]);

  // ---- Scroll ----
  const handleScroll = (e) => {
    const container = e.currentTarget;
    const newX = container.scrollLeft;
    const newY = container.scrollTop;

    const xChanged = newX !== prevScroll.current.x;
    const yChanged = newY !== prevScroll.current.y;

    spreadsheet.scrollX = newX;
    spreadsheet.scrollY = newY;
    prevScroll.current = { x: newX, y: newY };

    if (bodyRef.current) {
      bodyRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
    }

    if (xChanged && colHeaderRef.current) {
      renderColumnHeaders(colHeaderRef.current, spreadsheet, bodyW);
    }
    if (yChanged && rowNumRef.current) {
      renderRowNumbers(rowNumRef.current, spreadsheet, bodyH);
    }
    if (xChanged || yChanged) {
      paintBody(getSelection());
    }

    if (editingCell) {
      commitEdit();
    }
  };

  // ---- Hit-test using variable sizes ----
  const hitTest = (clientX, clientY) => {
    const rect = scrollContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left + scrollContainerRef.current.scrollLeft;
    const y = clientY - rect.top + scrollContainerRef.current.scrollTop;
    return {
      row: spreadsheet.getRowAtY(y),
      col: spreadsheet.getColAtX(x),
    };
  };

  // ---- Edit helpers ----
  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    spreadsheet.setCell(editingCell.row, editingCell.col, editValue);
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, spreadsheet]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const startEdit = useCallback((row, col) => {
    if (!spreadsheet.isCellEditable(row)) return;
    const columns = spreadsheet.getColumns();
    const currentVal = (columns[col] && spreadsheet.data[row])
      ? String(spreadsheet.data[row][columns[col].key] ?? '')
      : '';
    setEditingCell({ row, col });
    setEditValue(currentVal);
  }, [spreadsheet]);

  // ---- Helper to set single-cell selection ----
  const selectSingle = useCallback((cell) => {
    setAnchor(cell);
    setSelEnd(cell);
  }, []);

  // ---- Scroll a cell into view ----
  const scrollIntoView = useCallback((cell) => {
    if (!scrollContainerRef.current) return;
    const sc = scrollContainerRef.current;
    const cellLeft = spreadsheet.getColLeft(cell.col);
    const cellTop = spreadsheet.getRowTop(cell.row);
    const cellW = spreadsheet.colWidths[cell.col];
    const cellH = spreadsheet.rowHeights[cell.row];
    if (cellLeft < sc.scrollLeft) sc.scrollLeft = cellLeft;
    if (cellLeft + cellW > sc.scrollLeft + bodyW) sc.scrollLeft = cellLeft + cellW - bodyW;
    if (cellTop < sc.scrollTop) sc.scrollTop = cellTop;
    if (cellTop + cellH > sc.scrollTop + bodyH) sc.scrollTop = cellTop + cellH - bodyH;
  }, [spreadsheet, bodyW, bodyH]);

  // ---- Mouse handlers for drag selection ----
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    const cell = hitTest(e.clientX, e.clientY);
    const wasEditing = !!editingCell;

    if (editingCell) {
      commitEdit();
    }

    if (e.shiftKey && anchor) {
      setSelEnd(cell);
    } else {
      setAnchor(cell);
      setSelEnd(cell);
    }

    isDragging.current = true;

    if (wasEditing) {
      setTimeout(() => startEdit(cell.row, cell.col), 0);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const cell = hitTest(e.clientX, e.clientY);
    setSelEnd(cell);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleDoubleClick = (e) => {
    const cell = hitTest(e.clientX, e.clientY);
    selectSingle(cell);
    startEdit(cell.row, cell.col);
  };

  // ---- Copy to clipboard ----
  const copySelection = useCallback(() => {
    const sel = normalizeSelection(anchor, selEnd);
    if (!sel) return;
    const lines = [];
    for (let r = sel.startRow; r <= sel.endRow; r++) {
      const cells = [];
      for (let c = sel.startCol; c <= sel.endCol; c++) {
        cells.push(spreadsheet.evaluateCell(r, c));
      }
      lines.push(cells.join('\t'));
    }
    navigator.clipboard.writeText(lines.join('\n'));
  }, [anchor, selEnd, spreadsheet]);

  // ---- Paste from clipboard ----
  const pasteSelection = useCallback(async () => {
    if (!anchor) return;
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const rows = text.split('\n');
      for (let r = 0; r < rows.length; r++) {
        const cells = rows[r].split('\t');
        for (let c = 0; c < cells.length; c++) {
          spreadsheet.setCell(anchor.row + r, anchor.col + c, cells[c]);
        }
      }
      // Extend selection to cover pasted range
      const endRow = anchor.row + rows.length - 1;
      const endCol = anchor.col + rows[0].split('\t').length - 1;
      setSelEnd({ row: endRow, col: endCol });
      paintBody(getSelection());
    } catch { /* clipboard access denied */ }
  }, [anchor, spreadsheet, paintBody, getSelection]);

  // ---- Keyboard ----
  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault();
      copySelection();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !editingCell) {
      e.preventDefault();
      pasteSelection();
      return;
    }

    if (editingCell) {
      const isFormula = editValue.startsWith('=');

      if (e.key === 'Enter') {
        e.preventDefault();
        formulaRef.current = null;
        commitEdit();
        const next = { row: anchor.row + 1, col: anchor.col };
        selectSingle(next);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        formulaRef.current = null;
        cancelEdit();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        formulaRef.current = null;
        commitEdit();
        const next = { row: anchor.row, col: anchor.col + (e.shiftKey ? -1 : 1) };
        selectSingle(next);
      } else if (isFormula && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        // In formula mode, arrow keys insert/replace a cell reference
        e.preventDefault();
        const input = inputRef.current;
        if (input) {
          const fr = formulaRef.current;
          let refRow, refCol, replaceStart, replaceEnd;
          if (fr) {
            // Move from the previously referenced cell
            refRow = e.key === 'ArrowUp' ? Math.max(0, fr.row - 1)
              : e.key === 'ArrowDown' ? fr.row + 1
              : fr.row;
            refCol = e.key === 'ArrowLeft' ? Math.max(0, fr.col - 1)
              : e.key === 'ArrowRight' ? fr.col + 1
              : fr.col;
            replaceStart = fr.start;
            replaceEnd = fr.end;
          } else {
            // First arrow press — insert at cursor relative to editing cell
            refRow = e.key === 'ArrowUp' ? Math.max(0, editingCell.row - 1)
              : e.key === 'ArrowDown' ? editingCell.row + 1
              : editingCell.row;
            refCol = e.key === 'ArrowLeft' ? Math.max(0, editingCell.col - 1)
              : e.key === 'ArrowRight' ? editingCell.col + 1
              : editingCell.col;
            replaceStart = input.selectionStart;
            replaceEnd = input.selectionEnd;
          }
          const cellRef = getColumnLetter(refCol) + (refRow + 1);
          const newVal = editValue.substring(0, replaceStart) + cellRef + editValue.substring(replaceEnd);
          setEditValue(newVal);
          const newEnd = replaceStart + cellRef.length;
          formulaRef.current = { row: refRow, col: refCol, start: replaceStart, end: newEnd };
          setTimeout(() => {
            input.selectionStart = input.selectionEnd = newEnd;
          }, 0);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        commitEdit();
        const next = { row: Math.max(0, anchor.row - 1), col: anchor.col };
        selectSingle(next);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        commitEdit();
        const next = { row: anchor.row + 1, col: anchor.col };
        selectSingle(next);
      } else if (e.key === 'ArrowLeft' && inputRef.current && inputRef.current.selectionStart === 0) {
        e.preventDefault();
        commitEdit();
        const next = { row: anchor.row, col: Math.max(0, anchor.col - 1) };
        selectSingle(next);
      } else if (e.key === 'ArrowRight' && inputRef.current && inputRef.current.selectionStart === editValue.length) {
        e.preventDefault();
        commitEdit();
        const next = { row: anchor.row, col: anchor.col + 1 };
        selectSingle(next);
      }
      return;
    }

    if (!anchor) return;

    const base = e.shiftKey ? selEnd : anchor;
    const { row, col } = base;
    let newRow = row;
    let newCol = col;

    switch (e.key) {
      case 'ArrowUp':    e.preventDefault(); newRow = Math.max(0, row - 1); break;
      case 'ArrowDown':  e.preventDefault(); newRow = row + 1; break;
      case 'ArrowLeft':  e.preventDefault(); newCol = Math.max(0, col - 1); break;
      case 'ArrowRight': e.preventDefault(); newCol = col + 1; break;
      case 'Enter':
      case 'F2':
        e.preventDefault();
        startEdit(row, col);
        return;
      case 'Tab':
        e.preventDefault();
        newCol = col + (e.shiftKey ? -1 : 1);
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        spreadsheet.setCell(row, col, '');
        paintBody(getSelection());
        return;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setEditingCell({ row, col });
          setEditValue(e.key);
          return;
        }
        return;
    }

    const next = { row: Math.max(0, newRow), col: Math.max(0, newCol) };

    if (e.shiftKey) {
      setSelEnd(next);
      scrollIntoView(next);
    } else {
      selectSingle(next);
      scrollIntoView(next);
    }
  }, [anchor, selEnd, editingCell, commitEdit, cancelEdit, startEdit, selectSingle, scrollIntoView, spreadsheet, paintBody, getSelection, editValue, copySelection, pasteSelection]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  // ---- Column resize handlers ----
  const handleColHeaderMouseDown = (e) => {
    const rect = colHeaderRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left + spreadsheet.scrollX;
    // Check if near a column right edge
    const col = spreadsheet.getColAtX(mx);
    const rightEdge = spreadsheet.getColLeft(col + 1);
    if (Math.abs(mx - rightEdge) <= RESIZE_HANDLE_PX) {
      e.preventDefault();
      e.stopPropagation();
      resizeRef.current = { type: 'col', index: col, startPos: e.clientX, startSize: spreadsheet.colWidths[col] };
      document.body.style.cursor = 'col-resize';

      const onMove = (ev) => {
        const r = resizeRef.current;
        if (!r) return;
        const delta = ev.clientX - r.startPos;
        spreadsheet.setColWidth(r.index, r.startSize + delta);
        renderColumnHeaders(colHeaderRef.current, spreadsheet, bodyW);
        paintBody(getSelection());
      };
      const onUp = () => {
        resizeRef.current = null;
        document.body.style.cursor = '';
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
  };

  const handleColHeaderMouseMove = (e) => {
    if (resizeRef.current) return;
    const rect = colHeaderRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left + spreadsheet.scrollX;
    const col = spreadsheet.getColAtX(mx);
    const rightEdge = spreadsheet.getColLeft(col + 1);
    colHeaderRef.current.style.cursor = Math.abs(mx - rightEdge) <= RESIZE_HANDLE_PX ? 'col-resize' : 'default';
  };

  // ---- Row resize handlers ----
  const handleRowNumMouseDown = (e) => {
    const rect = rowNumRef.current.getBoundingClientRect();
    const my = e.clientY - rect.top + spreadsheet.scrollY;
    const row = spreadsheet.getRowAtY(my);
    const bottomEdge = spreadsheet.getRowTop(row + 1);
    if (Math.abs(my - bottomEdge) <= RESIZE_HANDLE_PX) {
      e.preventDefault();
      e.stopPropagation();
      resizeRef.current = { type: 'row', index: row, startPos: e.clientY, startSize: spreadsheet.rowHeights[row] };
      document.body.style.cursor = 'row-resize';

      const onMove = (ev) => {
        const r = resizeRef.current;
        if (!r) return;
        const delta = ev.clientY - r.startPos;
        spreadsheet.setRowHeight(r.index, r.startSize + delta);
        renderRowNumbers(rowNumRef.current, spreadsheet, bodyH);
        paintBody(getSelection());
      };
      const onUp = () => {
        resizeRef.current = null;
        document.body.style.cursor = '';
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
  };

  const handleRowNumMouseMove = (e) => {
    if (resizeRef.current) return;
    const rect = rowNumRef.current.getBoundingClientRect();
    const my = e.clientY - rect.top + spreadsheet.scrollY;
    const row = spreadsheet.getRowAtY(my);
    const bottomEdge = spreadsheet.getRowTop(row + 1);
    rowNumRef.current.style.cursor = Math.abs(my - bottomEdge) <= RESIZE_HANDLE_PX ? 'row-resize' : 'default';
  };

  // ---- Compute input position ----
  const getInputStyle = () => {
    if (!editingCell || !scrollContainerRef.current) return { display: 'none' };
    const sc = scrollContainerRef.current;
    const left = spreadsheet.getColLeft(editingCell.col) - sc.scrollLeft;
    const top = spreadsheet.getRowTop(editingCell.row) - sc.scrollTop;
    const width = spreadsheet.colWidths[editingCell.col];
    const height = spreadsheet.rowHeights[editingCell.row];
    const fmt = spreadsheet.getCellFormat(editingCell.row, editingCell.col);
    const fontSize = fmt.fontSize || 12;
    const color = fmt.color || '#333';
    return {
      position: 'absolute',
      left, top,
      width,
      height,
      border: '2px solid #2563eb',
      outline: 'none',
      padding: '0 4px',
      font: `${fontSize}px sans-serif`,
      color,
      boxSizing: 'border-box',
      zIndex: 10,
      background: '#fff',
    };
  };

  const virtualW = spreadsheet.getVirtualCanvasWidth();
  const virtualH = spreadsheet.getVirtualCanvasHeight();

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ display: 'grid', gridTemplateColumns: `${ROW_NUMBER_WIDTH}px 1fr`, gridTemplateRows: `${HEADER_HEIGHT}px 1fr`, overflow: 'hidden' }}
      tabIndex={-1}
    >
      <canvas ref={cornerRef} style={{ width: ROW_NUMBER_WIDTH, height: HEADER_HEIGHT }} />
      <canvas
        ref={colHeaderRef}
        style={{ width: bodyW, height: HEADER_HEIGHT, display: 'block' }}
        onMouseDown={handleColHeaderMouseDown}
        onMouseMove={handleColHeaderMouseMove}
      />
      <canvas
        ref={rowNumRef}
        style={{ width: ROW_NUMBER_WIDTH, height: bodyH, display: 'block' }}
        onMouseDown={handleRowNumMouseDown}
        onMouseMove={handleRowNumMouseMove}
      />

      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {editingCell && (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => { formulaRef.current = null; setEditValue(e.target.value); }}
            onBlur={commitEdit}
            style={getInputStyle()}
          />
        )}

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onDoubleClick={handleDoubleClick}
          style={{ overflow: 'auto', width: '100%', height: '100%', position: 'relative' }}
        >
          <div style={{ width: virtualW, height: virtualH }} />
          <canvas
            ref={bodyRef}
            style={{ position: 'absolute', top: 0, left: 0, display: 'block', pointerEvents: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}
