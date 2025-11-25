// // temp.js
// const bcrypt = require('bcryptjs');

// async function main() {
//   const hash = await bcrypt.hash("superadming@123", 10);
//   console.log(hash);
// }

// main();

require('dotenv').config();
const mongoose = require('mongoose');
const SuperAdmin = require('./src/models/SuperAdmin');

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const superAdmin = new SuperAdmin({
      name: 'Super Admin',
      email: 'admin@example.com',
      password: 'admin123456' // Change this!
    });

    await superAdmin.save();

    console.log('✅ SuperAdmin created successfully');
    console.log('Email:', superAdmin.email);
    console.log('Password: admin123456');
    console.log('⚠️ Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createSuperAdmin();