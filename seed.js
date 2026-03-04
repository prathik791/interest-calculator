require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB Connected');
};

const seed = async () => {
  await connectDB();
  const User = require('./models/User');
  const Transaction = require('./models/Transaction');

  await User.deleteMany({});
  await Transaction.deleteMany({});

  // Create demo user
  const user = await User.create({
    name: 'Demo User',
    email: 'demo@test.com',
    password: 'demo123456',
  });

  console.log('✅ Demo user created: demo@test.com / demo123456');

  // Create sample transactions
  const transactions = [
    { personName: 'Rahul Sharma', contact: '9876543210', amount: 50000, interestRate: 12, type: 'given', date: new Date('2024-01-15'), paymentMode: 'bank_transfer', notes: 'Personal loan for business' },
    { personName: 'Priya Patel', contact: '9123456789', amount: 25000, interestRate: 10, type: 'given', date: new Date('2024-02-01'), paymentMode: 'upi', dueDate: new Date('2025-02-01') },
    { personName: 'Amit Kumar', contact: '9988776655', amount: 100000, interestRate: 8, type: 'taken', date: new Date('2024-01-01'), paymentMode: 'cash', notes: 'Home renovation loan' },
    { personName: 'Sunita Verma', contact: '9871234560', amount: 15000, interestRate: 15, type: 'given', date: new Date('2024-03-10'), paymentMode: 'cash' },
    { personName: 'Vikram Singh', contact: '9654321098', amount: 75000, interestRate: 11, type: 'given', date: new Date('2023-12-01'), paymentMode: 'cheque', dueDate: new Date('2025-06-01') },
    { personName: 'Neha Gupta', contact: '9543210987', amount: 30000, interestRate: 9, type: 'taken', date: new Date('2024-02-15'), paymentMode: 'upi' },
    { personName: 'Rahul Sharma', contact: '9876543210', amount: 20000, interestRate: 12, type: 'given', date: new Date('2024-04-01'), paymentMode: 'bank_transfer' },
    { personName: 'Deepak Joshi', contact: '9432109876', amount: 45000, interestRate: 13, type: 'given', date: new Date('2024-03-20'), paymentMode: 'cash' },
  ];

  for (const tx of transactions) {
    await Transaction.create({ ...tx, userId: user._id });
  }

  console.log(`✅ ${transactions.length} sample transactions created`);
  console.log('\n🎉 Seed complete! Login with: demo@test.com / demo123456\n');
  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });
