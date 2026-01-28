import React, { useState, useRef, useEffect } from 'react';

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32];

const PRESET_COLORS = [
  '#ffffff', '#333333', '#e53e3e', '#dd6b20',
  '#d69e2e', '#38a169', '#3182ce', '#805ad5',
  '#d53f8c', '#1a202c', '#9b2c2c', '#7b341e',
  '#744210', '#276749', '#2a4365', '#553c9a',
];

export function Toolbar({ spreadsheet, selection, onFormatChange }) {
  const anchorFormat = selection
    ? spreadsheet.getCellFormat(selection.anchorRow, selection.anchorCol)
    : {};

  const currentSize = anchorFormat.fontSize || 12;
  const currentColor = anchorFormat.color || '#333333';
  const currentBgColor = anchorFormat.bgColor || '#fafafa';
  const currentBold = !!anchorFormat.bold;
  const currentItalic = !!anchorFormat.italic;

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const pickerRef = useRef(null);
  const bgPickerRef = useRef(null);
  const colorInputRef = useRef(null);
  const bgColorInputRef = useRef(null);

  const applyFormat = (fmt) => {
    if (!selection) return;
    spreadsheet.setRangeFormat(selection.startRow, selection.startCol, selection.endRow, selection.endCol, fmt);
    if (onFormatChange) onFormatChange();
  };

  const pickColor = (color) => {
    applyFormat({ color });
    setShowColorPicker(false);
  };

  const pickBgColor = (bgColor) => {
    applyFormat({ bgColor });
    setShowBgColorPicker(false);
  };

  // Close pickers on outside click
  useEffect(() => {
    if (!showColorPicker && !showBgColorPicker) return;
    const handleClick = (e) => {
      if (showColorPicker && pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowColorPicker(false);
      }
      if (showBgColorPicker && bgPickerRef.current && !bgPickerRef.current.contains(e.target)) {
        setShowBgColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showColorPicker, showBgColorPicker]);

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

      <div className="relative flex items-center gap-1" ref={bgPickerRef}>
        <span className="text-gray-600">Bg</span>
        <button
          onClick={() => setShowBgColorPicker(!showBgColorPicker)}
          className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
          style={{ backgroundColor: currentBgColor }}
          title="Background color"
        />
        {showBgColorPicker && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg p-2 z-50">
            <div className="grid grid-cols-4 gap-1 mb-2">
              <button
                onClick={() => pickBgColor('#fafafa')}
                className="w-6 h-6 rounded border cursor-pointer text-xs"
                style={{ backgroundColor: '#fafafa', borderColor: currentBgColor === '#fafafa' ? '#2563eb' : '#d1d5db', borderWidth: currentBgColor === '#fafafa' ? 2 : 1 }}
                title="Default (no fill)"
              />
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => pickBgColor(c)}
                  className="w-6 h-6 rounded border cursor-pointer"
                  style={{ backgroundColor: c, borderColor: c === currentBgColor ? '#2563eb' : '#d1d5db', borderWidth: c === currentBgColor ? 2 : 1 }}
                />
              ))}
            </div>
            <div className="border-t border-gray-200 pt-2 flex items-center gap-1">
              <span className="text-xs text-gray-500">Custom</span>
              <input
                ref={bgColorInputRef}
                type="color"
                value={currentBgColor}
                onChange={(e) => pickBgColor(e.target.value)}
                className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
                style={{ padding: 0 }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => applyFormat({ bold: !currentBold })}
          className={`w-7 h-7 border rounded cursor-pointer font-bold text-sm ${currentBold ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}
          title="Bold"
        >B</button>
        <button
          onClick={() => applyFormat({ italic: !currentItalic })}
          className={`w-7 h-7 border rounded cursor-pointer italic text-sm ${currentItalic ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}
          title="Italic"
        >I</button>
      </div>
    </div>
  );
}
