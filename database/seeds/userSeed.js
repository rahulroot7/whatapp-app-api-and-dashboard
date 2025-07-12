const mongoose = require('../../app');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');

const seedUser = async () => {
  try {

    const adminEmail = 'admin@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin user already exists.');
      return process.exit(0);
    }

    const adminUser = new User({
      name: 'Admin',
      first_name: 'Admin',
      last_name: 'User',
      email: adminEmail,
      phone: '9999999999',
      password: '12345678',
      status: '1',
      email_verified: true
    });

    await adminUser.save();
    console.log('Admin user created successfully.');
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }finally {
    mongoose.connection.close(); 
  }
};

module.exports = seedUser;