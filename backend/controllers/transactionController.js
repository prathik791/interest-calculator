const Transaction = require('../models/Transaction');

// @desc    Add transaction
// @route   POST /api/transactions/add
exports.addTransaction = async (req, res) => {
  try {
    const { personName, contact, amount, interestRate, interestType, type, date, dueDate, paymentMode, notes } = req.body;

    const transaction = await Transaction.create({
      userId: req.user._id,
      personName,
      contact,
      amount: parseFloat(amount),
      interestRate: parseFloat(interestRate),
      interestType: interestType || 'simple',
      type,
      date: date || Date.now(),
      dueDate: dueDate || null,
      paymentMode: paymentMode || 'cash',
      notes: notes || '',
      screenshot: req.file ? req.file.filename : null,
    });

    res.status(201).json({ success: true, message: 'Transaction added successfully', data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all transactions
// @route   GET /api/transactions/list
exports.getTransactions = async (req, res) => {
  try {
    const { type, status, personName, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };

    if (type) query.type = type;
    if (status) query.status = status;
    if (personName) query.personName = { $regex: personName, $options: 'i' };

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Recalculate interest dynamically
    const updatedTransactions = transactions.map((t) => {
      const P = t.amount;
      const R = t.interestRate;
      const startDate = new Date(t.date);
      const now = new Date();
      const msPerDay = 1000 * 60 * 60 * 24;
      const days = Math.max(0, Math.floor((now - startDate) / msPerDay));
      const years = days / 365;
      const months = days / 30;

      const obj = t.toObject();
      obj.calculatedInterest = {
        simple: parseFloat(((P * R * years) / 100).toFixed(2)),
        compound: parseFloat((P * Math.pow(1 + R / 100, years) - P).toFixed(2)),
        monthly: parseFloat(((P * R * months) / 1200).toFixed(2)),
        yearly: parseFloat(((P * R) / 100).toFixed(2)),
      };
      obj.daysElapsed = days;
      return obj;
    });

    res.json({
      success: true,
      data: updatedTransactions,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard summary
// @route   GET /api/transactions/summary
exports.getSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id });

    let totalGiven = 0, totalTaken = 0, totalInterestEarned = 0, totalInterestOwed = 0;

    transactions.forEach((t) => {
      const P = t.amount;
      const R = t.interestRate;
      const startDate = new Date(t.date);
      const now = new Date();
      const days = Math.max(0, Math.floor((now - startDate) / (1000 * 60 * 60 * 24)));
      const years = days / 365;
      const interest = parseFloat(((P * R * years) / 100).toFixed(2));

      if (t.type === 'given') {
        totalGiven += t.amount;
        totalInterestEarned += interest;
      } else {
        totalTaken += t.amount;
        totalInterestOwed += interest;
      }
    });

    // Monthly chart data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await Transaction.aggregate([
      { $match: { userId: req.user._id, date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: '$date' }, year: { $year: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Per-person summary
    const personSummary = await Transaction.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: { personName: '$personName', contact: '$contact', type: '$type' },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalGiven: parseFloat(totalGiven.toFixed(2)),
        totalTaken: parseFloat(totalTaken.toFixed(2)),
        totalInterestEarned: parseFloat(totalInterestEarned.toFixed(2)),
        totalInterestOwed: parseFloat(totalInterestOwed.toFixed(2)),
        netBalance: parseFloat((totalGiven - totalTaken).toFixed(2)),
        transactionCount: transactions.length,
        monthlyData,
        personSummary,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/update/:id
exports.updateTransaction = async (req, res) => {
  try {
    let transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updates = { ...req.body };
    if (req.file) updates.screenshot = req.file.filename;
    if (updates.amount) updates.amount = parseFloat(updates.amount);
    if (updates.interestRate) updates.interestRate = parseFloat(updates.interestRate);

    transaction = await Transaction.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Transaction updated', data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/delete/:id
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export transactions as JSON (for PDF/Excel on frontend)
// @route   GET /api/transactions/export
exports.exportTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ date: -1 });
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
