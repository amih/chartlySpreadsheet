import React, { useRef, useEffect, useState } from 'react';
import { CanvasRenderer } from '../renderer';

export function SpreadsheetCanvas({ spreadsheet }) {
  const canvasRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });

  useEffect(() => {
    const handleResize = () => {
      if (scrollContainerRef.current) {
        setDimensions({
          width: scrollContainerRef.current.clientWidth,
          height: scrollContainerRef.current.clientHeight
        });
      }
    };

    // Initial size
    const timer = setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const render = (width = dimensions.width, height = dimensions.height) => {
    if (canvasRef.current) {
      const renderer = new CanvasRenderer(
        canvasRef.current,
        spreadsheet,
        width,
        height
      );
      renderer.render();
    }
  };

  useEffect(() => {
    render(dimensions.width, dimensions.height);
  }, [spreadsheet, dimensions]);

  const handleScroll = (e) => {
    const container = e.currentTarget;
    spreadsheet.scrollX = container.scrollLeft;
    spreadsheet.scrollY = container.scrollTop;

    // Move canvas to follow scroll position
    if (canvasRef.current) {
      canvasRef.current.style.left = `${container.scrollLeft}px`;
      canvasRef.current.style.top = `${container.scrollTop}px`;
    }

    render(dimensions.width, dimensions.height);
  };

  // Calculate virtual canvas dimensions
  const canvasWidth = spreadsheet.getVirtualCanvasWidth();
  const canvasHeight = spreadsheet.getVirtualCanvasHeight();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-slate-700 mb-4 pb-3 border-b-2 border-blue-500">
        Spreadsheet
      </h2>
      
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="border border-gray-200 rounded overflow-auto"
        style={{ width: '100%', height: '600px', position: 'relative' }}
      >
        <div style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px`, position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            className="block bg-white"
            style={{ 
              display: 'block',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          />
        </div>
      </div>
    </div>
  );
}
