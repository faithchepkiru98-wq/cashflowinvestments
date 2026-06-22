const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Basic User Model
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    role: { type: String, default: 'user' },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Investment Model
const investmentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    package: { type: String, required: true },
    amount: { type: Number, required: true },
    expectedReturn: { type: String, required: true },
    status: { type: String, default: 'active' }, // active, completed
    createdAt: { type: Date, default: Date.now }
});
const Investment = mongoose.model('Investment', investmentSchema);

// Transaction Model
const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true }, // deposit, withdrawal, investment
    amount: { type: Number, required: true },
    method: { type: String }, // btc, eth, usdt, bank
    status: { type: String, default: 'pending' }, // pending, completed, rejected
    createdAt: { type: Date, default: Date.now }
});
const Transaction = mongoose.model('Transaction', transactionSchema);

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/novavest';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create new user
        const newUser = new User({
            email,
            password: hashedPassword
        });
        
        await newUser.save();
        
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Check user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Create token
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET || 'fallback_secret', 
            { expiresIn: '1d' }
        );
        
        res.status(200).json({ 
            token, 
            user: { id: user._id, email: user.email, role: user.role },
            message: 'Login successful' 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied' });
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token' });
    }
};

// --- USER DASHBOARD ROUTES ---

// Get user data
app.get('/api/user/dashboard', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        const investments = await Investment.find({ userId: req.user.id }).sort({ createdAt: -1 });
        const transactions = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 });
        
        res.json({ user, investments, transactions });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create investment (checkout)
app.post('/api/invest', verifyToken, async (req, res) => {
    try {
        const { package: pkgName, amount, expectedReturn, paymentMethod } = req.body;
        
        // 1. Create a transaction for the deposit
        const transaction = new Transaction({
            userId: req.user.id,
            type: 'deposit',
            amount: Number(amount),
            method: paymentMethod,
            status: 'pending' // Admin needs to approve
        });
        await transaction.save();

        // 2. Create the investment record (could also be marked pending)
        const investment = new Investment({
            userId: req.user.id,
            package: pkgName,
            amount: Number(amount),
            expectedReturn,
            status: 'pending' // Active once deposit is approved
        });
        await investment.save();

        res.status(201).json({ message: 'Investment request submitted. Pending deposit verification.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- ADMIN ROUTES ---
const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Admin access required' });
        }
    });
};

app.get('/api/admin/dashboard', verifyAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        const investments = await Investment.find().populate('userId', 'email').sort({ createdAt: -1 });
        const transactions = await Transaction.find().populate('userId', 'email').sort({ createdAt: -1 });
        
        res.json({ users, investments, transactions });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/admin/transaction/:id/approve', verifyAdmin, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
        
        transaction.status = 'completed';
        await transaction.save();

        // Update user balance/profit logic would go here
        
        res.json({ message: 'Transaction approved', transaction });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
