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

    // Create combined data
    const combinedData = [];

    // Row 1: Customer field names
    combinedData.push({
        isFieldHeader: true,
        customerId: 'ID',
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email',
        phone: 'Phone',
        createdAt: 'Created',
        address: 'Address',
        city: 'City',
        state: 'State',
        country: 'Country'
    });

    // Rows 2-16: Customer data (15 rows)
    combinedData.push(...customerData);

    // Row 17: Empty separator row
    combinedData.push({});

    // Row 18: Sales field names
    combinedData.push({
        isFieldHeader: true,
        customerId: 'Cust ID',
        firstName: 'Date',
        lastName: 'Time',
        email: 'Amount',
        phone: 'Status',
        createdAt: '',
        address: '',
        city: '',
        state: '',
        country: ''
    });

    // Rows 19+: Sales data with mappings to show in customer columns
    const mappedSalesData = salesData.map(sale => ({
        customerId: sale.customerId,
        firstName: sale.saleDateTime.split(' ')[0],  // Date in first name column
        lastName: sale.saleDateTime.split(' ')[1] || '',  // Time in last name column
        email: sale.totalAmount,  // Amount in email column
        phone: sale.status,  // Status in phone column
        createdAt: '',
        address: '',
        city: '',
        state: '',
        country: ''
    }));
    combinedData.push(...mappedSalesData);

    // Create combined columns (use customer columns as base)
    const columns = customerColumns;

    return {
        data: combinedData,
        columns: columns,
        customerCount: customerData.length,
        separatorRow: customerData.length + 2,
        salesStartRow: customerData.length + 4,
        salesHeaderRow: customerData.length + 3
    };
}
