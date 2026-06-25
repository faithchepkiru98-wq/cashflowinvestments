const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// Trust proxy is required when hosting on platforms like Render, Heroku, etc.
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

// ─── FEATURE 3: Rate Limiting ───────────────────────────────────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { message: 'Too many attempts. Please try again in 15 minutes.' }
});

app.use('/api/auth', authLimiter);

// ─── EMAIL TRANSPORTER (Feature 1 & 2) ─────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ─── PLATFORM SETTINGS (mutable at runtime by admin) ────────────────────────
// Initial values come from environment variables. Admin can update them live
// via the /api/admin/settings endpoints without restarting the server.
const platformSettings = {
    btc:          process.env.BTC_WALLET   || '',
    eth:          process.env.ETH_WALLET   || '',
    usdt:         process.env.USDT_WALLET  || '',
    bank:         process.env.BANK_DETAILS || '',
    siteName:     process.env.SITE_NAME    || 'Cashflowvest',
    minDeposit:   Number(process.env.MIN_DEPOSIT)  || 200,
    minWithdraw:  Number(process.env.MIN_WITHDRAW) || 50,
    supportEmail: process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || '',
};

// Keep backward-compat alias used by /api/wallet-addresses
const WALLET_ADDRESSES = platformSettings;

// ─── MODELS ──────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
    name:                { type: String },
    phone:               { type: String },
    email:               { type: String, required: true, unique: true },
    password:            { type: String, required: true },
    balance:             { type: Number, default: 0 },
    profit:              { type: Number, default: 0 },
    role:                { type: String, default: 'user' },
    isVerified:          { type: Boolean, default: true },
    verificationToken:   { type: String },
    resetPasswordToken:  { type: String },
    resetPasswordExpiry: { type: Date },
    referralCode:        { type: String, unique: true, sparse: true },
    referredBy:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    referralBonusPaid:   { type: Boolean, default: false },
    kycStatus:           { type: String, default: 'none' }, // none, pending, approved, rejected
    kycDocument:         { type: String }, // URL or base64 of ID doc
    createdAt:           { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// ─── NOTIFICATION MODEL ───────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message:   { type: String, required: true },
    type:      { type: String, default: 'info' }, // info, success, warning, error
    read:      { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const Notification = mongoose.model('Notification', notificationSchema);

// ─── BROADCAST MODEL ─────────────────────────────────────────────────────────
const broadcastSchema = new mongoose.Schema({
    title:     { type: String, required: true },
    message:   { type: String, required: true },
    type:      { type: String, default: 'info' }, // info, success, warning
    createdAt: { type: Date, default: Date.now }
});
const Broadcast = mongoose.model('Broadcast', broadcastSchema);

// Investment packages durations (in hours)
const PACKAGE_DURATIONS = {
    'Starter':  6,
    'Basic':    9,
    'Bronze':   12,
    'Silver':   15,
    'Gold':     24,
    'Diamond':  48
};

const investmentSchema = new mongoose.Schema({
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    package:        { type: String, required: true },
    amount:         { type: Number, required: true },
    expectedReturn: { type: String, required: true },
    returnAmount:   { type: Number },
    status:         { type: String, default: 'pending' }, // pending, active, completed
    endsAt:         { type: Date },
    createdAt:      { type: Date, default: Date.now }
});
const Investment = mongoose.model('Investment', investmentSchema);

const transactionSchema = new mongoose.Schema({
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type:          { type: String, required: true }, // deposit, withdrawal
    amount:        { type: Number, required: true },
    method:        { type: String },
    walletAddress: { type: String },
    txId:          { type: String },
    contactInfo:   { type: String },
    status:        { type: String, default: 'pending' },
    investmentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Investment' },
    createdAt:     { type: Date, default: Date.now }
});
const Transaction = mongoose.model('Transaction', transactionSchema);

// ─── DB CONNECTION ────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cashflowvest';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const generateReferralCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

const notify = async (userId, message, type = 'info') => {
    try { await new Notification({ userId, message, type }).save(); } catch {}
};

const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({ from: `"Cashflowvest" <${process.env.EMAIL_USER}>`, to, subject, html });
        return true;
    } catch (err) {
        console.error('Email error:', err.message);
        return false;
    }
};

// ─── FEATURE 1: Email Verification ──────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationToken = crypto.randomBytes(32).toString('hex');

        const newUser = new User({
            name,
            phone,
            email,
            password: hashedPassword,
            verificationToken,
            isVerified: true,
            referralCode: generateReferralCode()
        });

        await newUser.save();

        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify?token=${verificationToken}`;
        const emailSent = await sendEmail(email, 'Welcome to Cashflowvest!', `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#131722;color:#f3f4f6;padding:40px;border-radius:12px;">
              <h1 style="color:#00e676;">Welcome, ${name}!</h1>
              <p>Thank you for joining Cashflowvest. We are excited to have you on board.</p>
              <p>Your unique referral code is: <strong style="color:#f5a623;font-size:1.2rem;">${newUser.referralCode}</strong></p>
              <p>Share this code with your friends and earn bonuses!</p>
              <p>Click the button below to verify your email and activate your account.</p>
              <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#00e676,#00b0ff);color:#131722;font-weight:bold;padding:14px 28px;border-radius:8px;text-decoration:none;margin:20px 0;">Verify My Account</a>
              <p style="color:#9ca3af;font-size:0.85rem;">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
            </div>
        `);

        const token = jwt.sign(
            { id: newUser._id, role: newUser.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Registration successful! Proceed to deposit.',
            token,
            user: { id: newUser._id, name: newUser.name, phone: newUser.phone, email: newUser.email, role: newUser.role, referralCode: newUser.referralCode }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify email token
app.get('/api/auth/verify', async (req, res) => {
    try {
        const { token } = req.query;
        const user = await User.findOne({ verificationToken: token });
        if (!user) return res.status(400).json({ message: 'Invalid or expired verification link.' });

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.json({ message: 'Email verified! You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before logging in. Check your inbox.' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            token,
            user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role, referralCode: user.referralCode },
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── ADMIN CREATOR ROUTE (SECURED) ───────────────────────────────────────────
app.get('/api/auth/make-me-admin/:email', async (req, res) => {
    try {
        // Prevent unauthorized users from becoming admin
        if (!process.env.ADMIN_SECRET_KEY || req.query.secret !== process.env.ADMIN_SECRET_KEY) {
            return res.status(403).send('<h1>Forbidden: Invalid or missing secret key.</h1>');
        }

        const user = await User.findOneAndUpdate({ email: req.params.email }, { role: 'admin' });
        if (!user) return res.send('<h1>User not found! Check your email spelling.</h1>');
        res.send('<h1>Success! You are now an Admin! 👑</h1><h2>Go back to the website, LOGOUT, and LOG BACK IN.</h2>');
    } catch {
        res.send('<h1>Error making admin.</h1>');
    }
});

// ─── FEATURE 2: Password Reset ──────────────────────────────────────────────
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken  = resetToken;
        user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
        await sendEmail(email, 'Reset Your Cashflowvest Password', `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#131722;color:#f3f4f6;padding:40px;border-radius:12px;">
              <h1 style="color:#f5a623;">Password Reset Request</h1>
              <p>Click below to reset your password. This link is valid for 1 hour.</p>
              <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#f5a623,#ff6b35);color:#131722;font-weight:bold;padding:14px 28px;border-radius:8px;text-decoration:none;margin:20px 0;">Reset My Password</a>
              <p style="color:#9ca3af;font-size:0.85rem;">If you didn't request this, ignore this email. Your password is safe.</p>
            </div>
        `);

        res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await User.findOne({
            resetPasswordToken:  token,
            resetPasswordExpiry: { $gt: new Date() }
        });
        if (!user) return res.status(400).json({ message: 'Invalid or expired reset link.' });

        const salt = await bcrypt.genSalt(10);
        user.password            = await bcrypt.hash(password, salt);
        user.resetPasswordToken  = undefined;
        user.resetPasswordExpiry = undefined;
        await user.save();

        res.json({ message: 'Password reset successfully! You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        next();
    } catch {
        res.status(400).json({ message: 'Invalid token' });
    }
};

const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role === 'admin') next();
        else res.status(403).json({ message: 'Admin access required' });
    });
};

// ─── FEATURE 4: Wallet Addresses ─────────────────────────────────────────────
app.get('/api/wallet-addresses', verifyToken, (req, res) => {
    res.json(WALLET_ADDRESSES);
});

// ─── ADMIN: Get Platform Settings ────────────────────────────────────────────
app.get('/api/admin/settings', verifyAdmin, (req, res) => {
    res.json(platformSettings);
});

// ─── ADMIN: Update Platform Settings ─────────────────────────────────────────
app.put('/api/admin/settings', verifyAdmin, (req, res) => {
    const allowed = ['btc', 'eth', 'usdt', 'bank', 'siteName', 'minDeposit', 'minWithdraw', 'supportEmail'];
    const updates = {};

    for (const key of allowed) {
        if (req.body[key] !== undefined) {
            platformSettings[key] = key === 'minDeposit' || key === 'minWithdraw'
                ? Number(req.body[key])
                : String(req.body[key]).trim();
            updates[key] = platformSettings[key];
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided.' });
    }

    console.log('[Admin Settings Updated]', updates);
    res.json({ message: 'Settings updated successfully.', settings: platformSettings });
});

// ─── USER DASHBOARD ───────────────────────────────────────────────────────────
app.get('/api/user/dashboard', verifyToken, async (req, res) => {
    try {
        const user        = await User.findById(req.user.id).select('-password -verificationToken -resetPasswordToken');
        const investments = await Investment.find({ userId: req.user.id }).sort({ createdAt: -1 });
        const transactions = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json({ user, investments, transactions });
    } catch {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── FEATURE 5: Investment with Timer ────────────────────────────────────────
app.post('/api/invest', verifyToken, async (req, res) => {
    try {
        const { package: pkgName, amount, expectedReturn, paymentMethod, txId, contactInfo } = req.body;

        const returnPct  = parseFloat(expectedReturn) / 100;
        const returnAmt  = parseFloat(amount) * (1 + returnPct);
        const durationHrs = PACKAGE_DURATIONS[pkgName] || 6;
        const endsAt     = new Date(Date.now() + durationHrs * 60 * 60 * 1000);

        const transaction = new Transaction({
            userId: req.user.id,
            type:   'deposit',
            amount: Number(amount),
            method: paymentMethod,
            txId,
            contactInfo,
            status: 'pending'
        });
        await transaction.save();

        const investment = new Investment({
            userId:         req.user.id,
            package:        pkgName,
            amount:         Number(amount),
            expectedReturn,
            returnAmount:   returnAmt,
            status:         'pending',
            endsAt,
        });
        await investment.save();

        transaction.investmentId = investment._id;
        await transaction.save();

        res.status(201).json({
            message: 'Investment submitted! Awaiting deposit confirmation.',
            investment: { id: investment._id, endsAt }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── FEATURE 6: Withdrawal Request ────────────────────────────────────────────
app.post('/api/withdraw', verifyToken, async (req, res) => {
    try {
        const { amount, method, walletAddress } = req.body;
        const user = await User.findById(req.user.id);

        if (user.balance < Number(amount)) {
            return res.status(400).json({ message: 'Insufficient balance.' });
        }

        const withdrawal = new Transaction({
            userId:        req.user.id,
            type:          'withdrawal',
            amount:        Number(amount),
            method,
            walletAddress,
            status:        'pending'
        });
        await withdrawal.save();

        // Deduct balance immediately, admin will confirm payout
        user.balance -= Number(amount);
        await user.save();

        res.status(201).json({ message: 'Withdrawal request submitted. Processing within 24 hours.' });
    } catch {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── ADMIN ROUTES ──────────────────────────────────────────────────────────────
app.get('/api/admin/dashboard', verifyAdmin, async (req, res) => {
    try {
        const users        = await User.find().select('-password').sort({ createdAt: -1 });
        const investments  = await Investment.find().populate('userId', 'email').sort({ createdAt: -1 });
        const transactions = await Transaction.find().populate('userId', 'email').sort({ createdAt: -1 });
        res.json({ users, investments, transactions });
    } catch {
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/admin/transaction/:id/approve', verifyAdmin, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id).populate('userId');
        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

        transaction.status = 'completed';
        await transaction.save();

        const txUser = await User.findById(transaction.userId);

        if (transaction.type === 'deposit' && transaction.investmentId) {
            const investment = await Investment.findById(transaction.investmentId);
            if (investment) {
                investment.status = 'active';
                await investment.save();
            }
            await User.findByIdAndUpdate(transaction.userId, { $inc: { balance: transaction.amount } });

            // ── Referral reward ──────────────────────────────────────────────
            if (txUser && txUser.referredBy && !txUser.referralBonusPaid) {
                const referralBonus = 10; // $10 referral reward
                await User.findByIdAndUpdate(txUser.referredBy, { $inc: { balance: referralBonus } });
                await User.findByIdAndUpdate(txUser._id, { referralBonusPaid: true });
                await notify(txUser.referredBy, `🎉 You earned a $${referralBonus} referral bonus! Your referral made their first deposit.`, 'success');
            }

            // ── Notify user ──────────────────────────────────────────────────
            if (txUser) {
                await notify(txUser._id, `✅ Your deposit of $${transaction.amount} has been approved and credited to your account.`, 'success');
                sendEmail(txUser.email, 'Deposit Approved - Cashflowvest', `
                    <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#131722;color:#f3f4f6;padding:40px;border-radius:12px;">
                      <h1 style="color:#00e676;">Deposit Approved ✅</h1>
                      <p>Your deposit of <strong>$${transaction.amount}</strong> has been approved. Your investment is now active!</p>
                      <p style="color:#9ca3af;">Login to your dashboard to track your live earnings.</p>
                    </div>`);
            }
        }

        if (transaction.type === 'withdrawal') {
            if (txUser) {
                await notify(txUser._id, `💸 Your withdrawal of $${transaction.amount} has been approved and is being processed.`, 'success');
                sendEmail(txUser.email, 'Withdrawal Approved - Cashflowvest', `
                    <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#131722;color:#f3f4f6;padding:40px;border-radius:12px;">
                      <h1 style="color:#00e676;">Withdrawal Approved 💸</h1>
                      <p>Your withdrawal request of <strong>$${transaction.amount}</strong> has been approved. Funds are being sent to your wallet.</p>
                    </div>`);
            }
        }

        res.json({ message: 'Transaction approved successfully', transaction });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/admin/transaction/:id/reject', verifyAdmin, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

        transaction.status = 'rejected';
        await transaction.save();

        const txUser = await User.findById(transaction.userId);

        if (transaction.type === 'withdrawal') {
            await User.findByIdAndUpdate(transaction.userId, { $inc: { balance: transaction.amount } });
        }

        if (txUser) {
            const msg = transaction.type === 'deposit'
                ? `❌ Your deposit of $${transaction.amount} was rejected. Please contact support.`
                : `❌ Your withdrawal of $${transaction.amount} was rejected and refunded to your balance.`;
            await notify(txUser._id, msg, 'error');
            sendEmail(txUser.email, 'Transaction Update - Cashflowvest', `
                <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#131722;color:#f3f4f6;padding:40px;border-radius:12px;">
                  <h1 style="color:#ef4444;">Transaction Rejected ❌</h1>
                  <p>${msg}</p>
                  <p style="color:#9ca3af;">If you believe this is a mistake, please contact our support team.</p>
                </div>`);
        }

        res.json({ message: 'Transaction rejected', transaction });
    } catch {
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin: update user balance manually
app.put('/api/admin/user/:id/balance', verifyAdmin, async (req, res) => {
    try {
        const { balance } = req.body;
        await User.findByIdAndUpdate(req.params.id, { balance: Number(balance) });
        res.json({ message: 'Balance updated successfully' });
    } catch {
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin: update user role
app.put('/api/admin/user/:id/role', verifyAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        await User.findByIdAndUpdate(req.params.id, { role });
        res.json({ message: `User role updated to ${role}` });
    } catch {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
app.get('/api/notifications', verifyToken, async (req, res) => {
    try {
        const notifs = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(30);
        res.json(notifs);
    } catch { res.status(500).json({ message: 'Server error' }); }
});

app.put('/api/notifications/read-all', verifyToken, async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
        res.json({ message: 'All marked as read' });
    } catch { res.status(500).json({ message: 'Server error' }); }
});

// ─── ADMIN BROADCAST ─────────────────────────────────────────────────────────
app.get('/api/broadcasts', verifyToken, async (req, res) => {
    try {
        const broadcasts = await Broadcast.find().sort({ createdAt: -1 }).limit(5);
        res.json(broadcasts);
    } catch { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/admin/broadcast', verifyAdmin, async (req, res) => {
    try {
        const { title, message, type } = req.body;
        if (!title || !message) return res.status(400).json({ message: 'Title and message required' });
        const broadcast = new Broadcast({ title, message, type: type || 'info' });
        await broadcast.save();
        res.status(201).json({ message: 'Broadcast sent to all users', broadcast });
    } catch { res.status(500).json({ message: 'Server error' }); }
});

app.delete('/api/admin/broadcast/:id', verifyAdmin, async (req, res) => {
    try {
        await Broadcast.findByIdAndDelete(req.params.id);
        res.json({ message: 'Broadcast deleted' });
    } catch { res.status(500).json({ message: 'Server error' }); }
});

// ─── KYC ─────────────────────────────────────────────────────────────────────
app.post('/api/user/kyc', verifyToken, async (req, res) => {
    try {
        const { document } = req.body; // base64 or URL string
        if (!document) return res.status(400).json({ message: 'Document required' });
        await User.findByIdAndUpdate(req.user.id, { kycStatus: 'pending', kycDocument: document });
        res.json({ message: 'KYC submitted for review' });
    } catch { res.status(500).json({ message: 'Server error' }); }
});

app.put('/api/admin/user/:id/kyc', verifyAdmin, async (req, res) => {
    try {
        const { status } = req.body; // 'approved' or 'rejected'
        if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
        const user = await User.findByIdAndUpdate(req.params.id, { kycStatus: status }, { new: true });
        const msg = status === 'approved'
            ? '✅ Your KYC verification has been approved! You can now make large withdrawals.'
            : '❌ Your KYC verification was rejected. Please resubmit with a clearer document.';
        await notify(user._id, msg, status === 'approved' ? 'success' : 'error');
        res.json({ message: `KYC ${status}`, user });
    } catch { res.status(500).json({ message: 'Server error' }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
