import React, { useRef, useEffect } from 'react';
import { CanvasRenderer } from './renderer';

export function SpreadsheetCanvas({ spreadsheet, title }) {
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = React.useState({ width: 800, height: title === 'Customers' ? 300 : 400 });

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: title === 'Customers' ? 300 : 400 });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [title]);

  useEffect(() => {
    if (canvasRef.current) {
      const renderer = new CanvasRenderer(canvasRef.current, spreadsheet);
      renderer.render();
    }
  }, [spreadsheet]);

  const handleWheel = (e) => {
    e.preventDefault();
    spreadsheet.scroll(e.deltaX * 0.1, e.deltaY * 0.1);
    
    if (canvasRef.current) {
      const renderer = new CanvasRenderer(canvasRef.current, spreadsheet);
      renderer.render();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-slate-700 mb-4 pb-3 border-b-2 border-blue-500">
        {title}
      </h2>
      <div className="border border-gray-200 rounded overflow-hidden">
        <canvas
          ref={canvasRef}
          onWheel={handleWheel}
          width={dimensions.width}
          height={dimensions.height}
          className="block w-full bg-white"
        />
      </div>
      <div className="flex gap-3 mt-4">
        <div className="flex-1 h-3 bg-gray-100 border border-gray-300 rounded cursor-pointer hover:bg-gray-200"></div>
        <div className={`w-3 ${title === 'Customers' ? 'h-16' : 'h-20'} bg-gray-100 border border-gray-300 rounded cursor-pointer hover:bg-gray-200`}></div>
      </div>
    </div>
  );
}
