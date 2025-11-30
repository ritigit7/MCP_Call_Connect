const Customer = require('../models/Customer');

// Register new customer
exports.register = async (req, res) => {
  console.log('Registering new customer...');
  try {
    const { name, email, phone } = req.body;
    console.log('Request body:', req.body);

    const customer = new Customer({ name, email, phone });
    await customer.save();
    console.log('Customer created successfully:', customer._id);

    res.status(201).json({
      message: 'Customer registered successfully',
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      }
    });
    console.log('Customer registered successfully:', customer.email);
  } catch (error) {
    console.error('Error in customer registration:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get all customers
exports.getAllCustomers = async (req, res) => {
  console.log('Fetching all customers...');
  try {
    const customers = await Customer.find();
    res.json({ customers });
    console.log('All customers fetched successfully.');
  } catch (error) {
    console.error('Error fetching all customers:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get customer by ID
exports.getCustomerById = async (req, res) => {
  console.log('Fetching customer by ID:', req.params.id);
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      console.log('Customer not found for ID:', req.params.id);
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ customer });
    console.log('Successfully fetched customer by ID:', req.params.id);
  } catch (error) {
    console.error('Error fetching customer by ID:', error.message);
    res.status(500).json({ error: error.message });
  }
};