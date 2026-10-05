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
    whatsapp:     process.env.WHATSAPP || '',
    telegram:     process.env.TELEGRAM || '',
};

// Keep backward-compat alias used by /api/wallet-addresses
const WALLET_ADDRESSES = platformSettings;

// ─── MODELS ──────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
    name:                { type: String },
    phone:               { type: String },
    email:               { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:            { type: String, required: true },
    balance:             { type: Number, default: 0 },
    profit:              { type: Number, default: 0 },
    role:                { type: String, default: 'user' },
    isVerified:          { type: Boolean, default: false },
    verificationCode:    { type: String },
    verificationCodeExpiry: { type: Date },
    verificationToken:   { type: String },
    resetPasswordToken:  { type: String },
    resetPasswordExpiry: { type: Date },
    referralCode:        { type: String, unique: true, sparse: true },
    referredBy:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    referralBonusPaid:   { type: Boolean, default: false },
    kycStatus:           { type: String, default: 'none' }, // none, pending, approved, rejected
    kycDocument:         { type: String }, // URL or base64 of ID doc
    kycAddressDocument:  { type: String }, // URL or base64 of Address doc
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

// ─── MESSAGE MODEL (SUPPORT CHAT) ─────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
    sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null for general support
    text:     { type: String, required: true },
    isAdmin:  { type: Boolean, default: false },
    isRead:   { type: Boolean, default: false },
    createdAt:{ type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);


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

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
})
    .then(() => console.log('Connected to MongoDB successfully'))
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
        console.error('Make sure MONGODB_URI is properly set and your IP is whitelisted (0.0.0.0/0 on MongoDB Atlas).');
    });

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected.');
});

// ─── HEALTH CHECK ROUTE ───────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    const state = mongoose.connection.readyState;
    const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    const isConnected = state === 1;

    res.status(isConnected ? 200 : 503).json({
        status: isConnected ? 'ok' : 'degraded',
        database: {
            status: stateMap[state] || 'unknown',
            connected: isConnected,
            host: mongoose.connection.host || 'none'
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// ─── EMAIL TEST ROUTE ─────────────────────────────────────────────────────────
app.get('/api/test-email', async (req, res) => {
    const to = req.query.to;
    if (!to) {
        return res.status(400).json({ error: 'Please provide an email query param, e.g. /api/test-email?to=your_email@gmail.com' });
    }

    if (!process.env.RESEND_API_KEY && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
        return res.status(500).json({ 
            error: 'No email configuration found in Render environment variables. Please add RESEND_API_KEY.',
            envCheck: {
                hasResendKey: !!process.env.RESEND_API_KEY,
                hasEmailUser: !!process.env.EMAIL_USER,
                hasEmailPass: !!process.env.EMAIL_PASS
            }
        });
    }

    if (process.env.RESEND_API_KEY) {
        const fromAddress = process.env.RESEND_FROM || process.env.EMAIL_FROM || 'Cashflowvest <onboarding@resend.dev>';
        try {
            const apiRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: fromAddress,
                    to: [to],
                    subject: 'Test Email from Cashflowvest',
                    html: '<h2>Hello!</h2><p>This is a test email confirming that Resend email delivery is working successfully.</p>'
                })
            });

            const data = await apiRes.json();
            return res.status(apiRes.ok ? 200 : 400).json({
                status: apiRes.ok ? 'success' : 'failed',
                statusCode: apiRes.status,
                from: fromAddress,
                to,
                resendResponse: data
            });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    // Gmail fallback test
    try {
        await transporter.sendMail({
            from: `"Cashflowvest" <${process.env.EMAIL_USER}>`,
            to,
            subject: 'Test Email from Cashflowvest',
            html: '<p>Test email via Gmail SMTP.</p>'
        });
        return res.json({ status: 'success', method: 'gmail', to });
    } catch (err) {
        return res.status(500).json({ error: err.message, method: 'gmail' });
    }
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const generateReferralCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

const notify = async (userId, message, type = 'info') => {
    try { await new Notification({ userId, message, type }).save(); } catch {}
};

const sendEmail = async (to, subject, html) => {
    try {
        // ── 1. Resend API (Preferred) ──────────────────────────────────────
        if (process.env.RESEND_API_KEY) {
            const fromAddress = process.env.RESEND_FROM || process.env.EMAIL_FROM || 'Cashflowvest <onboarding@resend.dev>';
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: fromAddress,
                    to: [to],
                    subject,
                    html
                })
            });

            const data = await res.json();
            if (!res.ok) {
                console.error('❌ Resend API error:', data.message || data);
                return false;
            }

            console.log(`✅ Email sent via Resend successfully to ${to} (ID: ${data.id})`);
            return true;
        }

        // ── 2. Gmail / Nodemailer Fallback ─────────────────────────────────
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail({ from: `"Cashflowvest" <${process.env.EMAIL_USER}>`, to, subject, html });
            console.log(`✅ Email sent via Gmail SMTP successfully to ${to}`);
            return true;
        }

        console.warn('⚠️ sendEmail skipped: Neither RESEND_API_KEY nor EMAIL_USER/EMAIL_PASS are set in Render environment!');
        return false;
    } catch (err) {
        console.error('❌ Email error:', err.message);
        return false;
    }
};

// ─── FEATURE 1: Email Verification ──────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            console.error('Registration rejected: Database not connected (readyState:', mongoose.connection.readyState, ')');
            return res.status(503).json({ 
                message: 'Database connection unavailable. Please verify MONGODB_URI in your Render Dashboard / environment.' 
            });
        }

        let { name, email, password, phone, referredByCode } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        email = email.toString().trim().toLowerCase();

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        let referredById = null;
        if (referredByCode) {
            const referrer = await User.findOne({ referralCode: referredByCode.toString().trim().toUpperCase() });
            if (referrer) referredById = referrer._id;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const newUser = new User({
            name,
            phone,
            email,
            password: hashedPassword,
            verificationCode,
            verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
            verificationToken,
            isVerified: false,
            referralCode: generateReferralCode(),
            referredBy: referredById
        });

        await newUser.save();

        await sendEmail(email, 'Your Cashflowvest Verification Code', `
            <div style="font-family:sans-serif;max-width:540px;margin:auto;background:#131722;color:#f3f4f6;padding:36px;border-radius:12px;border:1px solid rgba(0,230,118,0.2);">
                <h1 style="color:#00e676;font-size:1.6rem;margin-bottom:8px;">Welcome, ${name}!</h1>
                <p style="color:#9ca3af;font-size:0.95rem;line-height:1.6;">Thank you for registering with Cashflowvest. Please use the 6-digit verification code below to activate your account:</p>
                <div style="background:#0a0c10;border:1px dashed #00e676;border-radius:10px;padding:24px;text-align:center;margin:24px 0;">
                    <div style="font-size:2.5rem;font-weight:bold;letter-spacing:10px;color:#00e676;font-family:monospace;">${verificationCode}</div>
                    <div style="color:#6b7280;font-size:0.8rem;margin-top:6px;">Valid for 15 minutes</div>
                </div>
                <p style="color:#9ca3af;font-size:0.85rem;">If you did not sign up for an account, please ignore this email.</p>
            </div>
        `);

        res.status(201).json({
            message: 'Verification code sent to your email. Please enter the code below to complete registration.',
            requiresVerification: true,
            email: newUser.email
        });
    } catch (error) {
        console.error('Registration error:', error);
        const isDbError = error.name === 'MongooseError' || error.name === 'MongoServerSelectionError' || error.name === 'MongoNetworkError';
        const msg = isDbError 
            ? 'Database error: unable to reach the database. Please verify MONGODB_URI.' 
            : (process.env.NODE_ENV !== 'production' ? (error.message || 'Server error') : 'Server error');
        res.status(500).json({ message: msg });
    }
});

// Verify 6-digit email code
app.post('/api/auth/verify-code', async (req, res) => {
    try {
        let { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ message: 'Email and verification code are required' });
        }
        email = email.toString().trim().toLowerCase();
        code = code.toString().trim();

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.isVerified) {
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET || 'fallback_secret',
                { expiresIn: '7d' }
            );
            return res.json({
                message: 'Account is already verified!',
                token,
                user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role, referralCode: user.referralCode }
            });
        }

        if (!user.verificationCode || user.verificationCode !== code) {
            return res.status(400).json({ message: 'Invalid verification code. Please check your email and try again.' });
        }

        if (user.verificationCodeExpiry && user.verificationCodeExpiry < new Date()) {
            return res.status(400).json({ message: 'Verification code has expired. Please click "Resend Code".' });
        }

        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpiry = undefined;
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Email verified successfully! Welcome to Cashflowvest.',
            token,
            user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role, referralCode: user.referralCode }
        });
    } catch (error) {
        console.error('Verification code error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Resend 6-digit email code
app.post('/api/auth/resend-code', async (req, res) => {
    try {
        let { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });
        email = email.toString().trim().toLowerCase();

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'Account is already verified' });

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = verificationCode;
        user.verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        await sendEmail(email, 'Your Cashflowvest Verification Code', `
            <div style="font-family:sans-serif;max-width:540px;margin:auto;background:#131722;color:#f3f4f6;padding:36px;border-radius:12px;border:1px solid rgba(0,230,118,0.2);">
                <h1 style="color:#00e676;font-size:1.6rem;margin-bottom:8px;">New Verification Code</h1>
                <p style="color:#9ca3af;font-size:0.95rem;line-height:1.6;">Here is your new 6-digit verification code:</p>
                <div style="background:#0a0c10;border:1px dashed #00e676;border-radius:10px;padding:24px;text-align:center;margin:24px 0;">
                    <div style="font-size:2.5rem;font-weight:bold;letter-spacing:10px;color:#00e676;font-family:monospace;">${verificationCode}</div>
                    <div style="color:#6b7280;font-size:0.8rem;margin-top:6px;">Valid for 15 minutes</div>
                </div>
            </div>
        `);

        res.json({ message: 'A new 6-digit code has been sent to your email.' });
    } catch (error) {
        console.error('Resend code error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify email token (link fallback)
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
        // Fast-fail if DB is not connected
        if (mongoose.connection.readyState !== 1) {
            console.error('Login attempt rejected: Database not connected (readyState:', mongoose.connection.readyState, ')');
            return res.status(503).json({ 
                message: 'Database connection unavailable. Please verify MONGODB_URI in your Render Dashboard / environment.' 
            });
        }

        let { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        email = email.toString().trim().toLowerCase();

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        if (!user.password) {
            return res.status(400).json({ message: 'Invalid account credentials. Please reset your password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        if (!user.isVerified) {
            return res.status(403).json({ 
                message: 'Please enter the verification code sent to your email to activate your account.',
                requiresVerification: true,
                email: user.email
            });
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
        const isDbError = error.name === 'MongooseError' || error.name === 'MongoServerSelectionError' || error.name === 'MongoNetworkError';
        const msg = isDbError 
            ? 'Database error: unable to reach the database. Please verify MONGODB_URI.' 
            : (process.env.NODE_ENV !== 'production' ? (error.message || 'Server error') : 'Server error');
        res.status(500).json({ message: msg });
    }
});

// ─── ADMIN CREATOR ROUTE ──────────────────────────────────────────────────────
// First-time: works with no secret if zero admins exist (bootstrap mode)
// After first admin exists: requires ADMIN_SECRET_KEY query param for security
app.get('/api/auth/make-me-admin/:email', async (req, res) => {
    try {
        const adminCount = await User.countDocuments({ role: 'admin' });

        // If admins already exist, require secret key
        if (adminCount > 0) {
            if (!process.env.ADMIN_SECRET_KEY || req.query.secret !== process.env.ADMIN_SECRET_KEY) {
                return res.status(403).send(`
                    <h1>🔒 Forbidden</h1>
                    <p>An admin already exists. Provide the correct <code>?secret=YOUR_KEY</code> to promote another admin.</p>
                    <p>Find your ADMIN_SECRET_KEY in the Render Dashboard → Environment Variables.</p>
                `);
            }
        }

        const user = await User.findOneAndUpdate(
            { email: req.params.email },
            { role: 'admin' },
            { new: true }
        );
        if (!user) return res.send(`
            <h1>❌ User Not Found</h1>
            <p>No account found with email: <strong>${req.params.email}</strong></p>
            <p>Make sure you have registered and verified your email first.</p>
        `);

        console.log(`[Admin Bootstrap] ${user.email} promoted to admin (first admin: ${adminCount === 0})`);
        res.send(`
            <div style="font-family:sans-serif;max-width:500px;margin:80px auto;padding:40px;background:#0a0c10;color:#f3f4f6;border-radius:16px;border:1px solid #00e676;text-align:center;">
                <div style="font-size:3rem;">👑</div>
                <h1 style="color:#00e676;margin:16px 0 8px;">You are now an Admin!</h1>
                <p style="color:#9ca3af;">Account: <strong style="color:white;">${user.email}</strong></p>
                <p style="color:#9ca3af;margin-top:20px;">Go back to the website, <strong style="color:white;">log out</strong>, then <strong style="color:white;">log back in</strong> to access the Admin Panel.</p>
                <a href="https://cashflowvest.space" style="display:inline-block;margin-top:24px;background:#00e676;color:#000;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Go to Website →</a>
            </div>
        `);
    } catch (err) {
        console.error('Make-admin error:', err);
        res.status(500).send('<h1>Error making admin. Check server logs.</h1>');
    }
});

// Check if any admin exists (useful for debugging)
app.get('/api/auth/admin-status', async (req, res) => {
    try {
        const count = await User.countDocuments({ role: 'admin' });
        res.json({ adminExists: count > 0, adminCount: count });
    } catch { res.status(500).json({ message: 'Server error' }); }
});

// ─── FEATURE 2: Password Reset ──────────────────────────────────────────────
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        let { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });
        email = email.toString().trim().toLowerCase();

        const user = await User.findOne({ email });
        if (!user) {
            console.log(`Forgot password requested for non-existing email: ${email}`);
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken  = resetToken;
        user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
        const sent = await sendEmail(email, 'Reset Your Cashflowvest Password', `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#131722;color:#f3f4f6;padding:40px;border-radius:12px;">
              <h1 style="color:#f5a623;">Password Reset Request</h1>
              <p>Click below to reset your password. This link is valid for 1 hour.</p>
              <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#f5a623,#ff6b35);color:#131722;font-weight:bold;padding:14px 28px;border-radius:8px;text-decoration:none;margin:20px 0;">Reset My Password</a>
              <p style="color:#9ca3af;font-size:0.85rem;">If you didn't request this, ignore this email. Your password is safe.</p>
            </div>
        `);

        if (!sent) {
            console.warn(`Password reset email could not be delivered to ${email}. Check EMAIL_USER and EMAIL_PASS.`);
        }

        res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
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
    } catch (err) {
        return res.status(400).json({ message: 'Invalid token' });
    }
    next();
};

const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role === 'admin') next();
        else res.status(403).json({ message: 'Admin access required' });
    });
};

// ─── FEATURE 4: Wallet Addresses ─────────────────────────────────────────────
app.get('/api/wallet-addresses', verifyToken, (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.json(WALLET_ADDRESSES);
});

// ─── ADMIN: Get Platform Settings ────────────────────────────────────────────
app.get('/api/admin/settings', verifyAdmin, (req, res) => {
    res.json(platformSettings);
});

// ─── ADMIN: Update Platform Settings ─────────────────────────────────────────
app.put('/api/admin/settings', verifyAdmin, (req, res) => {
    const allowed = ['btc', 'eth', 'usdt', 'bank', 'siteName', 'minDeposit', 'minWithdraw', 'supportEmail', 'whatsapp', 'telegram'];
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
        const { document, addressDocument } = req.body; // base64 or URL string
        if (!document || !addressDocument) return res.status(400).json({ message: 'Both National ID and Proof of Address are required' });
        await User.findByIdAndUpdate(req.user.id, { kycStatus: 'pending', kycDocument: document, kycAddressDocument: addressDocument });
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

// ─── USER SETTINGS & REFERRALS ───────────────────────────────────────────────
app.put('/api/user/settings', verifyToken, async (req, res) => {
    try {
        const { name, phone, password } = req.body;
        const updates = {};
        if (name) updates.name = name;
        if (phone) updates.phone = phone;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(password, salt);
        }
        await User.findByIdAndUpdate(req.user.id, updates);
        res.json({ message: 'Settings updated successfully' });
    } catch { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/user/referrals', verifyToken, async (req, res) => {
    try {
        const referrals = await User.find({ referredBy: req.user.id }, 'name email createdAt referralBonusPaid');
        const bonusEarned = referrals.filter(r => r.referralBonusPaid).length * 10;
        res.json({ referrals, bonusEarned });
    } catch { res.status(500).json({ message: 'Server error' }); }
});

// ─── SUPPORT CHAT ────────────────────────────────────────────────────────────
app.get('/api/chat', verifyToken, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [{ sender: req.user.id }, { receiver: req.user.id }]
        }).sort({ createdAt: 1 });
        res.json(messages);
    } catch { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/chat', verifyToken, async (req, res) => {
    try {
        if (!req.body.text) return res.status(400).json({ message: 'Message text required' });
        const message = new Message({ sender: req.user.id, text: req.body.text, isAdmin: false });
        await message.save();
        res.status(201).json(message);
    } catch { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/admin/chat/users', verifyAdmin, async (req, res) => {
    try {
        const userIds = await Message.distinct('sender', { isAdmin: false });
        const users = await User.find({ _id: { $in: userIds } }, 'name email');
        res.json(users);
    } catch { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/admin/chat/:userId', verifyAdmin, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [{ sender: req.params.userId }, { receiver: req.params.userId }]
        }).sort({ createdAt: 1 });
        res.json(messages);
    } catch { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/admin/chat/:userId', verifyAdmin, async (req, res) => {
    try {
        if (!req.body.text) return res.status(400).json({ message: 'Text required' });
        const message = new Message({
            sender: req.user.id,
            receiver: req.params.userId,
            text: req.body.text,
            isAdmin: true
        });
        await message.save();
        await notify(req.params.userId, `💬 Support replied: "${req.body.text.substring(0, 40)}..."`, 'info');
        res.status(201).json(message);
    } catch { res.status(500).json({ message: 'Server error' }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
