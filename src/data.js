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
            createdAt: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString(),
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
            saleDateTime: `${date.toLocaleDateString()} ${time}`,
            totalAmount: `$${amount}`,
            status: statuses[Math.floor(Math.random() * statuses.length)]
        });
    }
    return sales;
}
