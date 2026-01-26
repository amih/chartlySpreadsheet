import React, { useState } from 'react';
import { Header, Footer } from './Layout';
import { SpreadsheetCanvas } from './SpreadsheetCanvas';
import { Spreadsheet } from '../spreadsheet';
import { generateCustomerData, generateSalesData } from '../data';

export default function App() {
  const [customerSpreadsheet] = useState(() => {
    const customerData = generateCustomerData();
    const customerColumns = [
      { key: 'customerId', label: 'ID' },
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'createdAt', label: 'Created' },
      { key: 'address', label: 'Address' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'country', label: 'Country' }
    ];
    return new Spreadsheet(customerData, customerColumns);
  });

  const [salesSpreadsheet] = useState(() => {
    const customerData = generateCustomerData();
    const customerIds = customerData.map(c => c.customerId);
    const salesData = generateSalesData(customerIds);
    const salesColumns = [
      { key: 'customerId', label: 'Customer ID' },
      { key: 'saleDateTime', label: 'Date & Time' },
      { key: 'totalAmount', label: 'Amount' },
      { key: 'status', label: 'Status' }
    ];
    return new Spreadsheet(salesData, salesColumns);
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <SpreadsheetCanvas spreadsheet={customerSpreadsheet} title="Customers" />
          <SpreadsheetCanvas spreadsheet={salesSpreadsheet} title="Sales" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
