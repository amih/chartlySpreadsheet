import React from 'react';

export function Header() {
  return (
    <header className="bg-slate-700 text-white shadow-md py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Chartly Spreadsheet Demo</h1>
        <p className="text-gray-300 text-lg">Interactive spreadsheet with customers and sales data</p>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-slate-800 text-gray-400 text-center py-4 text-sm">
      <p>Chartly Spreadsheet &copy; 2026</p>
    </footer>
  );
}
