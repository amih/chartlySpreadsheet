/**
 * Node.js Calculator Mode - Spreadsheet without UI
 */
import { Spreadsheet } from './spreadsheet.js';
import { generateCustomerData, generateSalesData } from './data.js';

console.log('===== Chartly Spreadsheet (Node.js Calculator Mode) =====\n');

// Initialize customer spreadsheet
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

const customerSpreadsheet = new Spreadsheet(customerData, customerColumns);

// Initialize sales spreadsheet
const customerIds = customerData.map(c => c.customerId);
const salesData = generateSalesData(customerIds);
const salesColumns = [
    { key: 'customerId', label: 'Customer ID' },
    { key: 'saleDateTime', label: 'Date & Time' },
    { key: 'totalAmount', label: 'Amount' },
    { key: 'status', label: 'Status' }
];

const salesSpreadsheet = new Spreadsheet(salesData, salesColumns);

// Display customer data
console.log('CUSTOMERS TABLE (15 rows)');
console.log('------------------------');
console.table(customerData);

console.log('\n\nSALES TABLE (40 rows)');
console.log('---------------------');
console.table(salesData);

// Basic calculations
const completedSales = salesData.filter(s => s.status === 'Completed');
const totalRevenue = completedSales.reduce((sum, sale) => {
    const amount = parseFloat(sale.totalAmount.replace('$', ''));
    return sum + amount;
}, 0);

console.log('\n\nCALCULATIONS');
console.log('------------');
console.log(`Total Sales Records: ${salesData.length}`);
console.log(`Completed Sales: ${completedSales.length}`);
console.log(`Total Revenue (Completed): $${totalRevenue.toFixed(2)}`);
console.log(`Average Sale Amount: $${(totalRevenue / completedSales.length).toFixed(2)}`);
console.log(`Unique Customers: ${new Set(customerData.map(c => c.customerId)).size}`);
