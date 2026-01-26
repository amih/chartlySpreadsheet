/**
 * Node.js entry point - Calculator mode
 */
import { Spreadsheet } from './spreadsheet.js';
import { generateCustomerData, generateSalesData } from './data.js';

const customerData = generateCustomerData();
const salesData = generateSalesData(customerData.map(c => c.customerId));

console.log('Chartly Spreadsheet Calculator Mode');
console.log(`Customers: ${customerData.length}`);
console.log(`Sales: ${salesData.length}`);
