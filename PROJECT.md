# Chartly Spreadsheet

A JavaScript spreadsheet project that runs in the browser with canvas rendering and optional node.js calculator mode.

## Features

- **Browser Demo**: Interactive spreadsheet with canvas-based rendering and scrollbars
- **Node.js Calculator Mode**: Run spreadsheet calculations without UI
- **Customer Management**: Table with 15 demo customers (ID, name, email, phone, address, etc.)
- **Sales Tracking**: Table with 40 demo sales records (customer ID, date/time, amount, status)
- **Canvas Rendering**: Efficient drawing of spreadsheet cells with gridlines
- **Scrolling**: Horizontal and vertical scrolling support

## Project Structure

```
├── index.html          # Main HTML file for browser demo
├── app.js              # Browser application entry point
├── styles.css          # Styling for browser UI
├── package.json        # Project dependencies and scripts
├── README.md           # This file
└── src/
    ├── index.js        # Node.js entry point
    ├── demo.js         # Node.js demo with calculations
    ├── spreadsheet.js  # Core spreadsheet class
    ├── renderer.js     # Canvas renderer for display
    └── data.js         # Sample data generator
```

## Installation

No additional dependencies required - this project uses vanilla JavaScript.

## Usage

### Browser Demo

1. Open `index.html` in a web browser
2. View the customer and sales tables rendered on canvas
3. Scroll using mouse wheel to navigate the spreadsheet

### Node.js Calculator Mode

```bash
# Run basic calculator mode
npm start

# Run with auto-reload (requires Node.js with --watch support)
npm run dev

# Run demo with detailed calculations and table output
npm run demo
```

## Data Structure

### Customers Table (15 rows)
- Customer ID
- First Name
- Last Name
- Email
- Phone
- Created At
- Address
- City
- State
- Country

### Sales Table (40 rows)
- Customer ID (references customer list)
- Sale Date and Time
- Total Amount
- Status (Completed, Pending, Cancelled, Processing)

## Features Implemented

- ✅ Spreadsheet class with data management
- ✅ Canvas-based renderer with cell drawing
- ✅ Horizontal and vertical scrolling
- ✅ Sample data generation (customers and sales)
- ✅ Browser UI with responsive layout
- ✅ Node.js calculator mode
- ✅ Grid lines and cell formatting

## Future Enhancements

- Cell editing and formula support
- More advanced calculations
- Data export (CSV, JSON)
- Advanced filtering and sorting
- Keyboard navigation
- Cell selection and copy/paste
