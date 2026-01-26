/**
 * Main application file - Browser demo
 */
import { Spreadsheet } from './spreadsheet.js';
import { CanvasRenderer } from './renderer.js';
import { generateCustomerData, generateSalesData } from './data.js';

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

// Set canvas sizes
function resizeCanvases() {
    const customersCanvas = document.getElementById('customers-canvas');
    const salesCanvas = document.getElementById('sales-canvas');

    if (customersCanvas) {
        customersCanvas.width = customersCanvas.clientWidth;
        customersCanvas.height = 300;
    }

    if (salesCanvas) {
        salesCanvas.width = salesCanvas.clientWidth;
        salesCanvas.height = 400;
    }
}

// Render spreadsheets
function render() {
    const customersCanvas = document.getElementById('customers-canvas');
    const salesCanvas = document.getElementById('sales-canvas');

    if (customersCanvas) {
        const customerRenderer = new CanvasRenderer(customersCanvas, customerSpreadsheet);
        customerRenderer.render();
    }

    if (salesCanvas) {
        const salesRenderer = new CanvasRenderer(salesCanvas, salesSpreadsheet);
        salesRenderer.render();
    }
}

// Add scroll event listeners
document.addEventListener('wheel', (e) => {
    if (e.target.tagName === 'CANVAS') {
        e.preventDefault();
        
        const canvas = e.target;
        const canvasId = canvas.id;
        const spreadsheet = canvasId === 'customers-canvas' ? customerSpreadsheet : salesSpreadsheet;

        spreadsheet.scroll(e.deltaX * 0.1, e.deltaY * 0.1);
        render();
    }
}, { passive: false });

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    resizeCanvases();
    render();
});

// Handle window resize
window.addEventListener('resize', () => {
    resizeCanvases();
    render();
});
