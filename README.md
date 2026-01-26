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

Install dependencies:

```bash
npm install
```

## Usage

### Browser Demo (React + Vite)

```bash
# Start the development server
npm run dev

# Build for production
npm run build

# Preview production build
npm preview
```

### Node.js Calculator Mode

```bash
# Run basic calculator mode
npm run node-start

# Run with auto-reload
npm run node-dev

# Run demo with detailed calculations
npm run node-demo
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

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Canvas**: HTML5 Canvas API
- **Backend Calculator**: Node.js
- **Package Manager**: npm

- Cell editing and formula support
- More advanced calculations
- Data export (CSV, JSON)
- Advanced filtering and sorting
- Keyboard navigation
- Cell selection and copy/paste

