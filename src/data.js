/**
 * Sample data generator for demo
 */
export function generateCustomerData() {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica', 'James', 'Mary', 'William', 'Patricia', 'Charles', 'Linda', 'Joseph'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Denver', 'Washington'];
    const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'CA', 'TX', 'FL', 'CO', 'DC'];
    const countries = ['USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA'];

    const customers = [];
    for (let i = 1; i <= 15; i++) {
        const firstName = firstNames[i % firstNames.length];
        const lastName = lastNames[i % lastNames.length];
        customers.push({
            customerId: i,
            firstName: firstName,
            lastName: lastName,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
            phone: `555-${String(1000 + i).slice(-4)}`,
            createdAt: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
            address: `${100 + i * 10} Main St`,
            city: cities[i % cities.length],
            state: states[i % states.length],
            country: 'USA'
        });
    }
    return customers;
}

export function generateSalesData(customerIds) {
    const statuses = ['Completed', 'Pending', 'Cancelled', 'Processing'];
    const sales = [];

    for (let i = 1; i <= 40; i++) {
        const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
        const amount = (Math.random() * 900 + 100).toFixed(2);
        const date = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        const time = `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;

        sales.push({
            customerId: customerId,
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            createdAt: '',
            address: '',
            city: '',
            state: '',
            country: '',
            saleDateTime: `${date.toISOString().split('T')[0]} ${time}`,
            totalAmount: `$${amount}`,
            status: statuses[Math.floor(Math.random() * statuses.length)]
        });
    }
    return sales;
}

export function combinedSpreadsheetData(customerData, salesData) {
    const fields = ['customerId', 'firstName', 'lastName', 'email', 'phone', 'createdAt', 'address', 'city', 'state', 'country'];
    const columnCount = fields.length;

    const data = {};
    let r = 0;

    // Helper to write an object row as numeric-keyed sparse row
    const writeObj = (rowIdx, obj) => {
        const row = {};
        for (let c = 0; c < fields.length; c++) {
            const v = obj[fields[c]];
            if (v != null && v !== '') row[c] = v;
        }
        data[rowIdx] = row;
    };

    // Row 0: Customer field headers
    writeObj(r++, {
        customerId: 'ID', firstName: 'First Name', lastName: 'Last Name',
        email: 'Email', phone: 'Phone', createdAt: 'Created',
        address: 'Address', city: 'City', state: 'State', country: 'Country'
    });
    data[0]._isFieldHeader = true;

    // Rows 1-15: Customer data
    for (const cust of customerData) {
        writeObj(r++, cust);
    }

    // Row 16: Empty separator (sparse — just skip, no entry needed)
    r++;

    // Row 17: Sales field headers
    writeObj(r, {
        customerId: 'Cust ID', firstName: 'Date', lastName: 'Time',
        email: 'Amount', phone: 'Status', createdAt: '', address: '',
        city: '', state: '', country: ''
    });
    data[r]._isFieldHeader = true;
    r++;

    // Rows 18+: Sales data mapped to customer columns
    for (const sale of salesData) {
        writeObj(r++, {
            customerId: sale.customerId,
            firstName: sale.saleDateTime.split(' ')[0],
            lastName: sale.saleDateTime.split(' ')[1] || '',
            email: sale.totalAmount,
            phone: sale.status,
            createdAt: '', address: '', city: '', state: '', country: ''
        });
    }

    return { data, columnCount };
}
