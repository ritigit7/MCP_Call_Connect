const Customer = require('../models/Customer');

// Register new customer
exports.register = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const customer = new Customer({ name, email, phone });
    await customer.save();

    res.status(201).json({
      message: 'Customer registered successfully',
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};