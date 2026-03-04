# 💰 Interest Calculator WebApp

A **production-ready full-stack application** for tracking loans, calculating interest, and managing financial transactions. Built with React.js, Node.js/Express, and MongoDB.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the App](#running-the-app)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Demo Credentials](#demo-credentials)

---

## ✨ Features

- 🔐 **JWT Authentication** — Register, login, bcrypt password hashing
- 📊 **Dashboard** — Summary cards, Chart.js bar/doughnut charts
- 💳 **Transaction Management** — Add, edit, delete, filter transactions
- 📐 **Interest Calculator** — Simple, compound, monthly, yearly auto-calculation
- 👥 **Account Linking** — Per-person balance tracking
- ⏰ **Cron Reminders** — Daily due date checks via node-cron
- 📄 **PDF Export** — jsPDF with autotable
- 📊 **Excel Export** — SheetJS (xlsx)
- 📎 **File Uploads** — Screenshot/document with multer
- 🎨 **Modern Dark UI** — Space-themed, Syne font, fully responsive

---

## 🛠 Tech Stack

| Layer       | Technology                |
|-------------|---------------------------|
| Frontend    | React.js 18, React Router |
| Charts      | Chart.js, react-chartjs-2 |
| Backend     | Node.js, Express.js       |
| Database    | MongoDB, Mongoose         |
| Auth        | JWT, bcryptjs             |
| Uploads     | Multer                    |
| Cron Jobs   | node-cron                 |
| PDF Export  | jsPDF, jspdf-autotable    |
| Excel       | SheetJS (xlsx)            |
| Styling     | Custom CSS, Google Fonts  |

---

## 📁 Project Structure

```
interest-calculator/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Register, Login, GetMe
│   │   └── transactionController.js  # CRUD + Summary
│   ├── middleware/
│   │   └── auth.js               # JWT protect middleware
│   ├── models/
│   │   ├── User.js               # User schema
│   │   └── Transaction.js        # Transaction schema
│   ├── routes/
│   │   ├── auth.js               # /api/auth/*
│   │   └── transactions.js       # /api/transactions/*
│   ├── utils/
│   │   └── cronJobs.js           # Scheduled reminders
│   ├── uploads/                  # Uploaded files
│   ├── .env                      # Environment variables
│   ├── package.json
│   ├── seed.js                   # Demo data seeder
│   └── server.js                 # Express app entry
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/
│   │   │       └── Layout.js     # Sidebar + main layout
│   │   ├── context/
│   │   │   └── AuthContext.js    # Auth state management
│   │   ├── pages/
│   │   │   ├── WelcomePage.js    # Landing page
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── DashboardPage.js  # Charts + summary
│   │   │   ├── TransactionsPage.js
│   │   │   ├── AddTransactionPage.js
│   │   │   └── ReportsPage.js
│   │   ├── utils/
│   │   │   ├── api.js            # Axios instance
│   │   │   └── calculations.js  # Interest formulas
│   │   ├── App.js                # Routes
│   │   ├── index.js
│   │   └── index.css             # Global styles
│   ├── .env
│   └── package.json
│
├── package.json                  # Root scripts
└── README.md
```

---

## 📦 Prerequisites

Before starting, make sure you have installed:

1. **Node.js** (v16 or higher)
   ```bash
   # Check version
   node --version
   # Download from: https://nodejs.org/
   ```

2. **MongoDB** (local or cloud)
   
   **Option A — Local MongoDB:**
   ```bash
   # macOS (Homebrew)
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community
   
   # Ubuntu/Debian
   sudo apt-get install mongodb
   sudo systemctl start mongodb
   
   # Windows: Download installer from https://www.mongodb.com/try/download/community
   ```
   
   **Option B — MongoDB Atlas (Cloud, Free):**
   - Go to https://cloud.mongodb.com
   - Create free account → Create cluster → Get connection string
   - Replace `MONGODB_URI` in `.env` with your Atlas URI

3. **npm** (comes with Node.js)

---

## ⚙️ Installation & Setup

### Step 1: Clone / Download the Project

```bash
# If using git
git clone <your-repo-url>
cd interest-calculator

# Or extract the zip and navigate to the folder
cd interest-calculator
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

You should see packages like express, mongoose, bcryptjs, jsonwebtoken, etc. being installed.

### Step 3: Configure Backend Environment

The `.env` file is already created at `backend/.env`. Edit it if needed:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/interest_calculator
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2024
JWT_EXPIRE=7d
NODE_ENV=development
UPLOAD_PATH=./uploads
```

> ⚠️ **Important:** Change `JWT_SECRET` to a random string in production!

**For MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/interest_calculator?retryWrites=true&w=majority
```

### Step 4: Install Frontend Dependencies

```bash
# From project root
cd frontend
npm install
```

This installs React, Chart.js, jsPDF, SheetJS, axios, etc.

### Step 5: Configure Frontend Environment

The `.env` file is already at `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_UPLOADS_URL=http://localhost:5000/uploads
```

> If your backend runs on a different port, update `REACT_APP_API_URL`.

---

## 🚀 Running the App

### Terminal 1 — Start Backend

```bash
cd backend

# Development mode (auto-restart on changes)
npm run dev

# OR Production mode
npm start
```

Expected output:
```
🚀 Interest Calculator API running on http://localhost:5000
📡 Environment: development
🗄️  MongoDB: mongodb://localhost:27017/interest_calculator
✅ MongoDB Connected: localhost
⏰ Cron jobs scheduled: Daily reminders (9 AM) + Weekly summary (Mon 8 AM)
```

### Terminal 2 — Start Frontend

```bash
cd frontend
npm start
```

Browser opens automatically at **http://localhost:3000**

---

## 🌱 Seed Demo Data (Optional)

To populate the database with sample transactions:

```bash
cd backend
node seed.js
```

Output:
```
✅ MongoDB Connected
✅ Demo user created: demo@test.com / demo123456
✅ 8 sample transactions created
🎉 Seed complete!
```

---

## 🔑 Demo Credentials

After seeding:

| Field    | Value             |
|----------|-------------------|
| Email    | demo@test.com     |
| Password | demo123456        |

---

## 📡 API Documentation

### Authentication

| Method | Endpoint              | Description       | Auth |
|--------|-----------------------|-------------------|------|
| POST   | /api/auth/register    | Register user     | No   |
| POST   | /api/auth/login       | Login user        | No   |
| GET    | /api/auth/me          | Get current user  | Yes  |

**Register Request:**
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Login Request:**
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response (both):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "name": "John Doe", "email": "john@example.com" }
}
```

### Transactions

All transaction routes require `Authorization: Bearer <token>` header.

| Method | Endpoint                          | Description             |
|--------|-----------------------------------|-------------------------|
| POST   | /api/transactions/add             | Add transaction         |
| GET    | /api/transactions/list            | Get all (with filters)  |
| GET    | /api/transactions/summary         | Dashboard summary       |
| PUT    | /api/transactions/update/:id      | Update transaction      |
| DELETE | /api/transactions/delete/:id      | Delete transaction      |
| GET    | /api/transactions/export          | Export all transactions |

**Add Transaction (multipart/form-data):**
```
personName: "Rahul Sharma"
contact: "9876543210"
amount: 50000
interestRate: 12
interestType: "simple"
type: "given"
date: "2024-01-15"
dueDate: "2025-01-15"
paymentMode: "bank_transfer"
notes: "Personal loan"
screenshot: <file> (optional)
```

**List Transactions Query Params:**
```
GET /api/transactions/list?type=given&status=active&personName=Rahul&page=1&limit=20
```

---

## 📐 Interest Formulas

| Type     | Formula                               |
|----------|---------------------------------------|
| Simple   | `(P × R × T) / 100`                  |
| Compound | `P × (1 + R/100)^T - P`              |
| Monthly  | `(P × R × months) / 1200`            |
| Yearly   | `(P × R) / 100`                      |

Where: P = Principal, R = Rate (%), T = Time (years)

---

## 🗄️ Database Schemas

### User
```
name        String (required)
email       String (unique, required)
password    String (hashed, required)
createdAt   Date
```

### Transaction
```
userId        ObjectId → User
personName    String
contact       String
amount        Number
interestRate  Number (0-100)
interestType  'simple' | 'compound'
type          'given' | 'taken'
date          Date
dueDate       Date (optional)
paymentMode   'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'other'
status        'active' | 'partial' | 'closed'
amountPaid    Number
screenshot    String (filename)
notes         String
calculatedInterest {
  simple, compound, monthly, yearly
}
```

---

## ⏰ Cron Jobs

Automatically scheduled in `backend/utils/cronJobs.js`:

- **Daily at 9:00 AM** — Checks transactions with due dates in the next 3 days and logs reminders
- **Every Monday at 8:00 AM** — Weekly transaction summary

To add WhatsApp/SMS: Edit `cronJobs.js` and uncomment/add the SMS integration code.

---

## 🔧 Troubleshooting

**MongoDB connection fails:**
```bash
# Check if MongoDB is running
sudo systemctl status mongodb        # Linux
brew services list | grep mongodb   # macOS

# Start MongoDB
sudo systemctl start mongodb        # Linux
brew services start mongodb-community  # macOS
```

**Port already in use:**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9       # macOS/Linux
netstat -ano | findstr :5000        # Windows (then taskkill /PID <pid> /F)
```

**Frontend can't connect to backend:**
- Ensure backend is running on port 5000
- Check `frontend/.env` has correct `REACT_APP_API_URL`
- Check browser console for CORS errors

**npm install fails:**
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 🚢 Production Deployment

### Backend (e.g., Railway, Render, Heroku):
1. Set environment variables in the platform dashboard
2. Change `NODE_ENV=production`
3. Update `MONGODB_URI` to your Atlas URI
4. Change `JWT_SECRET` to a secure random string

### Frontend (e.g., Vercel, Netlify):
1. Set `REACT_APP_API_URL` to your deployed backend URL
2. Run `npm run build`
3. Deploy the `build/` folder

---

## 📜 License

MIT License — Free to use and modify.

---

**Built with ❤️ | Interest Calculator WebApp v1.0.0**
