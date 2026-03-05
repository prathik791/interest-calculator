const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  personName: {
    type: String,
    required: [true, 'Person name is required'],
    trim: true,
  },
  contact: {
    type: String,
    trim: true,
    default: '',
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be positive'],
  },
  interestRate: {
    type: Number,
    required: [true, 'Interest rate is required'],
    min: [0, 'Interest rate cannot be negative'],
    max: [100, 'Interest rate cannot exceed 100%'],
  },
  interestType: {
    type: String,
    enum: ['simple', 'compound'],
    default: 'simple',
  },
  type: {
    type: String,
    enum: ['given', 'taken'],
    required: [true, 'Transaction type is required'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now,
  },
  dueDate: {
    type: Date,
    default: null,
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'bank_transfer', 'upi', 'cheque', 'other'],
    default: 'cash',
  },
  status: {
    type: String,
    enum: ['active', 'partial', 'closed'],
    default: 'active',
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  screenshot: {
    type: String,
    default: null,
  },
  notes: {
    type: String,
    default: '',
    maxlength: 500,
  },
  calculatedInterest: {
    simple: { type: Number, default: 0 },
    compound: { type: Number, default: 0 },
    monthly: { type: Number, default: 0 },
    yearly: { type: Number, default: 0 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-calculate interest before save
transactionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  const P = this.amount;
  const R = this.interestRate;
  const startDate = new Date(this.date);
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.max(0, Math.floor((now - startDate) / msPerDay));
  const years = days / 365;
  const months = days / 30;

  this.calculatedInterest = {
    simple: parseFloat(((P * R * years) / 100).toFixed(2)),
    compound: parseFloat((P * Math.pow(1 + R / 100, years) - P).toFixed(2)),
    monthly: parseFloat(((P * R * months) / 1200).toFixed(2)),
    yearly: parseFloat(((P * R) / 100).toFixed(2)),
  };
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
