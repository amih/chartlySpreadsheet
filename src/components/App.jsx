import React, { useState, useCallback, useEffect } from 'react';
import { Header, Footer } from './Layout';
import { Toolbar } from './Toolbar';
import { SpreadsheetCanvas } from './SpreadsheetCanvas';
import { Spreadsheet } from '../spreadsheet';
import { generateCustomerData, generateSalesData, combinedSpreadsheetData } from '../data';

export default function App() {
  const [spreadsheet] = useState(() => {
    const customerData = generateCustomerData();
    const customerIds = customerData.map(c => c.customerId);
    const salesData = generateSalesData(customerIds);
    const { data, columnCount } = combinedSpreadsheetData(customerData, salesData);

    // Create spreadsheet with virtual size of 100 columns and 1000 rows
    return new Spreadsheet(data, columnCount, 1000, 100);
  });

  const [selection, setSelection] = useState(null);
  const [repaintKey, setRepaintKey] = useState(0);

  const handleFormatChange = useCallback(() => {
    setRepaintKey(k => k + 1);
  }, []);

  // Expose client-side API on window and wire onChange to trigger repaints
  useEffect(() => {
    spreadsheet.onChange(() => setRepaintKey(k => k + 1));

    window.chartlySpreadsheetAPI = {
      /** Execute a single command */
      exec: (cmd) => spreadsheet.exec(cmd),
      /** Execute multiple commands in batch */
      execBatch: (commands) => spreadsheet.execBatch(commands),
      /** Direct access to the spreadsheet instance */
      spreadsheet,
    };

    return () => { delete window.chartlySpreadsheetAPI; };
  }, [spreadsheet]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <Toolbar spreadsheet={spreadsheet} selection={selection} onFormatChange={handleFormatChange} />

      <main className="flex-1 min-h-0">
        <SpreadsheetCanvas spreadsheet={spreadsheet} onSelectionChange={setSelection} repaintKey={repaintKey} />
      </main>

      <Footer />
    </div>
  );
}
