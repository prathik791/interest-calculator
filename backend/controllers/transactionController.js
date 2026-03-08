const Transaction = require('../models/Transaction');

// @desc    Add transaction
// @route   POST /api/transactions/add
exports.addTransaction = async (req, res) => {
  try {
    const {
      personName, contact, amount, interestRate, interestType,
      type, date, dueDate, paymentMode, notes
    } = req.body;

    if (!personName || !amount || !interestRate || !type) {
      return res.status(400).json({ success: false, message: 'personName, amount, interestRate and type are required' });
    }

    const transaction = await Transaction.create({
      userId:       req.user._id,
      personName,
      contact:      contact      || '',
      amount:       parseFloat(amount),
      interestRate: parseFloat(interestRate),
      interestType: interestType || 'simple',
      type,
      date:         date         || Date.now(),
      dueDate:      dueDate      || null,
      paymentMode:  paymentMode  || 'cash',
      notes:        notes        || '',
      screenshot:   req.file ? req.file.filename : null,
    });

    res.status(201).json({ success: true, message: 'Transaction added successfully', data: transaction });
  } catch (error) {
    console.error('addTransaction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all transactions
// @route   GET /api/transactions/list
exports.getTransactions = async (req, res) => {
  try {
    const { type, status, personName, page = 1, limit = 100 } = req.query;
    const query = { userId: req.user._id };

    if (type)       query.type   = type;
    if (status)     query.status = status;
    if (personName) query.personName = { $regex: personName, $options: 'i' };

    const total        = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const msPerDay = 1000 * 60 * 60 * 24;

    const updatedTransactions = transactions.map((t) => {
      const P   = t.amount;
      const R   = t.interestRate;
      const start = new Date(t.date);

      // ✅ Use dueDate if set, otherwise use today
      const end = t.dueDate ? new Date(t.dueDate) : new Date();

      const days   = Math.max(0, Math.floor((end - start) / msPerDay));
      const years  = days / 365;
      const months = days / 30;

      const obj = t.toObject();
      obj.calculatedInterest = {
        simple:   parseFloat(((P * R * years) / 100).toFixed(2)),
        compound: parseFloat((P * Math.pow(1 + R / 100, years) - P).toFixed(2)),
        monthly:  parseFloat(((P * R * months) / 1200).toFixed(2)),
        yearly:   parseFloat(((P * R) / 100).toFixed(2)),
      };
      obj.daysElapsed = days;
      return obj;
    });

    res.json({
      success: true,
      data: updatedTransactions,
      pagination: {
        total,
        page:  parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('getTransactions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard summary
// @route   GET /api/transactions/summary
exports.getSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id });

    const msPerDay = 1000 * 60 * 60 * 24;

    let totalGiven         = 0;
    let totalTaken         = 0;
    let totalInterestEarned = 0;  // interest on money given out
    let totalInterestOwed   = 0;  // interest on money taken

    transactions.forEach((t) => {
      const P     = t.amount;
      const R     = t.interestRate;
      const start = new Date(t.date);

      // ✅ FIX: use dueDate when available, else today
      const end   = (t.dueDate && new Date(t.dueDate) > start)
        ? new Date(t.dueDate)
        : new Date();

      const days   = Math.max(0, Math.floor((end - start) / msPerDay));
      const years  = days / 365;

      // use interestType stored on transaction
      let interest = 0;
      if (t.interestType === 'compound') {
        interest = parseFloat((P * Math.pow(1 + R / 100, years) - P).toFixed(2));
      } else {
        interest = parseFloat(((P * R * years) / 100).toFixed(2));
      }

      if (t.type === 'given') {
        totalGiven          += P;
        totalInterestEarned += interest;
      } else {
        totalTaken         += P;
        totalInterestOwed  += interest;
      }
    });

    // Monthly chart data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await Transaction.aggregate([
      { $match: { userId: req.user._id, date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id:   { month: { $month: '$date' }, year: { $year: '$date' }, type: '$type' },
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
          _id:         { personName: '$personName', contact: '$contact', type: '$type' },
          totalAmount: { $sum: '$amount' },
          count:       { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalGiven:          parseFloat(totalGiven.toFixed(2)),
        totalTaken:          parseFloat(totalTaken.toFixed(2)),
        totalInterestEarned: parseFloat(totalInterestEarned.toFixed(2)),
        totalInterestOwed:   parseFloat(totalInterestOwed.toFixed(2)),
        netBalance:          parseFloat((totalGiven - totalTaken).toFixed(2)),
        transactionCount:    transactions.length,
        monthlyData,
        personSummary,
      },
    });
  } catch (error) {
    console.error('getSummary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/update/:id
exports.updateTransaction = async (req, res) => {
  try {
    let transaction = await Transaction.findById(req.params.id);
    if (!transaction)
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (transaction.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const updates = { ...req.body };
    if (req.file)          updates.screenshot   = req.file.filename;
    if (updates.amount)    updates.amount        = parseFloat(updates.amount);
    if (updates.interestRate) updates.interestRate = parseFloat(updates.interestRate);
    if (updates.dueDate === '') updates.dueDate   = null;

    transaction = await Transaction.findByIdAndUpdate(
      req.params.id, updates, { new: true, runValidators: true }
    );
    res.json({ success: true, message: 'Transaction updated', data: transaction });
  } catch (error) {
    console.error('updateTransaction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/delete/:id
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction)
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (transaction.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    console.error('deleteTransaction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export transactions as JSON
// @route   GET /api/transactions/export
exports.exportTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ date: -1 });
    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('exportTransactions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};