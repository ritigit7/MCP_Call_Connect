// Simple API testing script
// Run with: node test/api-test.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let agentToken = '';
let agentId = '';
let customerId = '';

async function testAPI() {
  console.log('🧪 Starting API Tests...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health:', health.data);
    console.log('');

    // Test 2: Register Agent
    console.log('2️⃣ Registering Agent...');
    const agentReg = await axios.post(`${BASE_URL}/api/agents/register`, {
      name: 'Test Agent',
      email: `agent${Date.now()}@test.com`,
      password: 'password123'
    });
    agentToken = agentReg.data.token;
    agentId = agentReg.data.agent.id;
    console.log('✅ Agent Registered:', agentReg.data.agent);
    console.log('🔑 Token:', agentToken.substring(0, 20) + '...');
    console.log('');

    // Test 3: Agent Login
    console.log('3️⃣ Testing Agent Login...');
    const login = await axios.post(`${BASE_URL}/api/agents/login`, {
      email: agentReg.data.agent.email,
      password: 'password123'
    });
    console.log('✅ Login successful');
    console.log('');

    // Test 4: Get Agent Profile
    console.log('4️⃣ Getting Agent Profile...');
    const profile = await axios.get(`${BASE_URL}/api/agents/profile`, {
      headers: { Authorization: `Bearer ${agentToken}` }
    });
    console.log('✅ Profile:', profile.data.agent);
    console.log('');

    // Test 5: Register Customer
    console.log('5️⃣ Registering Customer...');
    const customerReg = await axios.post(`${BASE_URL}/api/customers/register`, {
      name: 'Test Customer',
      email: `customer${Date.now()}@test.com`,
      phone: '+1234567890'
    });
    customerId = customerReg.data.customer.id;
    console.log('✅ Customer Registered:', customerReg.data.customer);
    console.log('');

    // Test 6: Get All Customers
    console.log('6️⃣ Getting All Customers...');
    const customers = await axios.get(`${BASE_URL}/api/customers/all`, {
      headers: { Authorization: `Bearer ${agentToken}` }
    });
    console.log('✅ Total Customers:', customers.data.customers.length);
    console.log('');

    // Test 7: Get Call Stats
    console.log('7️⃣ Getting Call Statistics...');
    const stats = await axios.get(`${BASE_URL}/api/calls/stats`, {
      headers: { Authorization: `Bearer ${agentToken}` }
    });
    console.log('✅ Call Stats:', stats.data);
    console.log('');

    console.log('🎉 All tests passed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Agent ID: ${agentId}`);
    console.log(`   - Customer ID: ${customerId}`);
    console.log(`   - Token: ${agentToken.substring(0, 30)}...`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests
testAPI();