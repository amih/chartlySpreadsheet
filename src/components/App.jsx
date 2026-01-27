import React, { useState } from 'react';
import { Header, Footer } from './Layout';
import { SpreadsheetCanvas } from './SpreadsheetCanvas';
import { Spreadsheet } from '../spreadsheet';
import { generateCustomerData, generateSalesData, combinedSpreadsheetData } from '../data';

export default function App() {
  const [spreadsheet] = useState(() => {
    const customerData = generateCustomerData();
    const customerIds = customerData.map(c => c.customerId);
    const salesData = generateSalesData(customerIds);
    const { data, columns } = combinedSpreadsheetData(customerData, salesData);
    
    // Create spreadsheet with virtual size of 100 columns and 1000 rows
    return new Spreadsheet(data, columns, 1000, 100);
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <SpreadsheetCanvas spreadsheet={spreadsheet} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
