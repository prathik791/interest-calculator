const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  addTransaction,
  getTransactions,
  getSummary,
  updateTransaction,
  deleteTransaction,
  exportTransactions,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '-')}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const types = /jpeg|jpg|png|gif|pdf/;
    if (types.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only images and PDFs are allowed'));
  },
});

router.post('/add', protect, upload.single('screenshot'), addTransaction);
router.get('/list', protect, getTransactions);
router.get('/summary', protect, getSummary);
router.put('/update/:id', protect, upload.single('screenshot'), updateTransaction);
router.delete('/delete/:id', protect, deleteTransaction);
router.get('/export', protect, exportTransactions);

module.exports = router;
