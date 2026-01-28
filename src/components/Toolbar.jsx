import React, { useState, useRef, useEffect } from 'react';

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32];

const PRESET_COLORS = [
  '#333333', '#e53e3e', '#dd6b20', '#d69e2e',
  '#38a169', '#3182ce', '#805ad5', '#d53f8c',
  '#1a202c', '#9b2c2c', '#7b341e', '#744210',
  '#276749', '#2a4365', '#553c9a', '#97266d',
];

export function Toolbar({ spreadsheet, selection, onFormatChange }) {
  const anchorFormat = selection
    ? spreadsheet.getCellFormat(selection.anchorRow, selection.anchorCol)
    : {};

  const currentSize = anchorFormat.fontSize || 12;
  const currentColor = anchorFormat.color || '#333333';

  const [showColorPicker, setShowColorPicker] = useState(false);
  const pickerRef = useRef(null);
  const colorInputRef = useRef(null);

  const applyFormat = (fmt) => {
    if (!selection) return;
    spreadsheet.setRangeFormat(selection.startRow, selection.startCol, selection.endRow, selection.endCol, fmt);
    if (onFormatChange) onFormatChange();
  };

  const pickColor = (color) => {
    applyFormat({ color });
    setShowColorPicker(false);
  };

  // Close picker on outside click
  useEffect(() => {
    if (!showColorPicker) return;
    const handleClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showColorPicker]);

  return (
    <div className="bg-gray-100 border-b border-gray-300 px-4 py-1 flex items-center gap-3 text-sm">
      <label className="flex items-center gap-1">
        <span className="text-gray-600">Size</span>
        <select
          value={currentSize}
          onChange={(e) => applyFormat({ fontSize: Number(e.target.value) })}
          className="border border-gray-300 rounded px-1 py-0.5 bg-white text-sm"
        >
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>

      <div className="relative flex items-center gap-1" ref={pickerRef}>
        <span className="text-gray-600">Color</span>
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
          style={{ backgroundColor: currentColor }}
          title="Text color"
        />
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg p-2 z-50">
            <div className="grid grid-cols-4 gap-1 mb-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => pickColor(c)}
                  className="w-6 h-6 rounded border cursor-pointer"
                  style={{
                    backgroundColor: c,
                    borderColor: c === currentColor ? '#2563eb' : '#d1d5db',
                    borderWidth: c === currentColor ? 2 : 1,
                  }}
                />
              ))}
            </div>
            <div className="border-t border-gray-200 pt-2 flex items-center gap-1">
              <span className="text-xs text-gray-500">Custom</span>
              <input
                ref={colorInputRef}
                type="color"
                value={currentColor}
                onChange={(e) => pickColor(e.target.value)}
                className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
                style={{ padding: 0 }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
