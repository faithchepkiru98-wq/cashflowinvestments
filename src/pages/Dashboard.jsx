import React, { useState, useEffect, useRef, Component } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Wallet, ArrowDownCircle, List, LogOut, Bell, ShieldCheck, X, Settings, Users, MessageCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// ── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('Dashboard render error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ color: 'white', marginBottom: '8px' }}>Something went wrong loading this tab</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '16px', color: '#ef4444' }}>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer' }}>Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function calcLiveEarnings(inv) {
  const pct    = parseFloat(inv.expectedReturn) / 100;
  const total  = inv.amount * pct;
  const startMs  = new Date(inv.createdAt).getTime();
  const endMs    = inv.endsAt ? new Date(inv.endsAt).getTime() : startMs + 6 * 3600000;
  const durMs    = Math.max(endMs - startMs, 1);
  const elapsed  = Math.min(Date.now() - startMs, durMs);
  return (total * elapsed) / durMs;
}

function formatTimeLeft(endsAt) {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return 'Completed';
  const h  = Math.floor(ms / 3600000);
  const m  = Math.floor((ms % 3600000) / 60000);
  const s  = Math.floor((ms % 60000) / 1000);
  const hStr = h > 0 ? `${String(h).padStart(2,'0')}:` : '';
  return `${hStr}${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} left`;
}

// ── Animated Number Stat Card ───────────────────────────────────────────────────
function AnimatedStatCard({ label, value, prefix = '$', color = '#00e676', bg, border }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => {
    const target = Number(value) || 0;
    const start  = prevRef.current;
    prevRef.current = target;
    if (start === target) return;
    const duration = 800;
    const startTime = performance.now();
    const step = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(start + (target - start) * ease);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return (
    <div style={{ background: bg, padding: '20px', borderRadius: '16px', border }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '10px' }}>{label}</p>
      <h3 style={{ fontSize: '2rem', color, fontFamily: 'Outfit, sans-serif', fontWeight: '800', margin: 0 }}>
        {prefix}{display.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </h3>
    </div>
  );
}

// ── Live Balance Ticker (Overview) ───────────────────────────────────────────
function LiveBalance({ baseBalance, investments }) {
  const activeInvs = investments.filter(inv => inv.status === 'active');

  const computeTotal = () =>
    (baseBalance || 0) + activeInvs.reduce((sum, inv) => sum + calcLiveEarnings(inv), 0);

  const [total, setTotal] = useState(computeTotal);

  useEffect(() => {
    setTotal(computeTotal());
    if (!activeInvs.length) return;
    const t = setInterval(() => setTotal(computeTotal()), 1000);
    return () => clearInterval(t);
  }, [baseBalance, investments]);

  const hasActive = activeInvs.length > 0;
  return (
    <div style={{ position: 'relative' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '8px' }}>Total Balance</p>
      <h3 style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'monospace', letterSpacing: '-1px',
        background: hasActive ? 'linear-gradient(90deg,#00e676,#00b0ff)' : 'none',
        WebkitBackgroundClip: hasActive ? 'text' : 'unset',
        WebkitTextFillColor: hasActive ? 'transparent' : 'white',
        color: hasActive ? 'transparent' : 'white'
      }}>
        ${total.toFixed(hasActive ? 4 : 2)}
      </h3>
      {hasActive && (
        <span style={{ fontSize: '0.72rem', color: '#00e676', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e676', display: 'inline-block', animation: 'pulse 1s infinite' }} />
          Live — earning now
        </span>
      )}
    </div>
  );
}

// ── Live Investment Card ──────────────────────────────────────────────────────
function InvestmentCard({ inv, packages }) {
  const pkgData    = packages[inv.package] || {};
  const pct        = parseFloat(pkgData.returns || inv.expectedReturn) || 0;
  const totalGain  = (inv.amount * pct) / 100;

  const startMs = new Date(inv.createdAt).getTime();
  const endMs   = inv.endsAt ? new Date(inv.endsAt).getTime() : startMs + 6 * 3600000;
  const durMs   = Math.max(endMs - startMs, 1);

  const getEarned = () => {
    if (inv.status !== 'active') return totalGain;
    return calcLiveEarnings(inv);
  };

  const [earned, setEarned]     = useState(getEarned);
  const [timeLeft, setTimeLeft] = useState(() => inv.endsAt ? formatTimeLeft(inv.endsAt) : '');
  const intervalRef = useRef(null);

  useEffect(() => {
    if (inv.status !== 'active') return;
    intervalRef.current = setInterval(() => {
      setEarned(getEarned());
      if (inv.endsAt) setTimeLeft(formatTimeLeft(inv.endsAt));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [inv._id]);

  const progress = Math.min(totalGain > 0 ? (earned / totalGain) * 100 : 0, 100);

  return (
    <div style={{ background: 'var(--bg-main)', border: `1px solid ${inv.status === 'active' ? 'rgba(0,230,118,0.2)' : 'var(--border-color)'}`, borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {inv.status === 'active' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #00e676, transparent)' }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{inv.package}</h3>
          <span style={{ color: '#f5a623', fontSize: '0.85rem', fontWeight: 'bold' }}>{pkgData.returns || inv.expectedReturn} return</span>
        </div>
        <span style={{
          color: inv.status === 'active' ? '#10b981' : '#f59e0b',
          background: inv.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
          border: `1px solid ${inv.status === 'active' ? '#10b981' : '#f59e0b'}`,
          padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600', textTransform: 'capitalize'
        }}>{inv.status}</span>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Principal Invested</p>
      <p style={{ color: 'white', fontSize: '1.6rem', fontWeight: 'bold', marginBottom: '20px' }}>${inv.amount.toLocaleString()}</p>

      <div style={{ background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '6px' }}>
          {inv.status === 'active' ? '⚡ Live Earnings' : '✅ Total Earned'}
        </p>
        <p style={{ color: '#00e676', fontSize: '2rem', fontWeight: '800', fontFamily: 'monospace', letterSpacing: '-1px' }}>+${earned.toFixed(4)}</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px' }}>of ${totalGain.toLocaleString(undefined, { maximumFractionDigits: 2 })} total return</p>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Progress</span>
          <span style={{ color: '#00e676', fontSize: '0.78rem', fontWeight: 'bold' }}>{progress.toFixed(2)}%</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '10px', width: `${progress}%`, background: 'linear-gradient(90deg, #00e676, #00b0ff)', transition: 'width 1s linear', boxShadow: '0 0 10px rgba(0,230,118,0.5)' }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <span>📅 Started: {new Date(inv.createdAt).toLocaleDateString()}</span>
        {inv.status === 'active' && inv.endsAt && (
          <span style={{ color: '#f5a623', fontWeight: '600' }}>⏳ {timeLeft}</span>
        )}
      </div>
    </div>
  );
}

function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({ user: null, investments: [], transactions: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('usdt');
  const [walletAddresses, setWalletAddresses] = useState(null);
  const [txId, setTxId] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  // Dedicated withdraw form state (isolated from invest modal state)
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('usdt');
  const [withdrawWallet, setWithdrawWallet] = useState('');
  const [copied, setCopied] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [kycFile, setKycFile] = useState(null);
  const [kycAddressFile, setKycAddressFile] = useState(null);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasSentMessage, setHasSentMessage] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  
  // Progressive packages — starts at $50, each tier unlocks higher returns.
  // Durations live on the server (PACKAGE_DURATIONS); client only needs display info.
  const packages = {
    'Starter':  { returns: '42%', min: 50,    max: 499,   badge: '🌱', color: '#10b981' },
    'Basic':    { returns: '48%', min: 500,   max: 1999,  badge: '⭐', color: '#00b0ff' },
    'Bronze':   { returns: '54%', min: 2000,  max: 4999,  badge: '🥉', color: '#cd7f32' },
    'Silver':   { returns: '60%', min: 5000,  max: 14999, badge: '🥈', color: '#9ca3af' },
    'Gold':     { returns: '65%', min: 15000, max: 29999, badge: '🥇', color: '#f5a623' },
    'Diamond':  { returns: '70%', min: 30000, max: 100000,badge: '💎', color: '#818cf8' },
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (!token || !savedUser) {
      navigate('/');
      return;
    }
    
    setUser(JSON.parse(savedUser));
    fetchDashboardData(token);
    
    // Check if we came from "Invest Now" button on Home page
    if (location.state && location.state.selectedPackage) {
      handleInvest(location.state.selectedPackage);
      // Clear the state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title)
    }
  }, [navigate, location]);

  const fetchDashboardData = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/user/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
      const walletRes = await fetch(`${API_URL}/api/wallet-addresses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (walletRes.ok) setWalletAddresses(await walletRes.json());

      // Fetch notifications & broadcasts
      const nRes = await fetch(`${API_URL}/api/notifications`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (nRes.ok) setNotifications(await nRes.json());
      const bRes = await fetch(`${API_URL}/api/broadcasts`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (bRes.ok) setBroadcasts(await bRes.json());
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChatMessages = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/chat`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const msgs = await res.json();
      setChatMessages(prev => {
        if (!isChatOpen) {
          const prevAdminCount = prev.filter(m => m.isAdmin).length;
          const newAdminCount = msgs.filter(m => m.isAdmin).length;
          if (newAdminCount > prevAdminCount) {
            setUnreadCount(c => c + (newAdminCount - prevAdminCount));
            playNotifSound();
          }
        }
        return msgs;
      });
    }
  };

  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
      fetchChatMessages();
      const interval = setInterval(fetchChatMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isChatOpen]);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (isChatOpen && chatInputRef.current) {
      setTimeout(() => chatInputRef.current?.focus(), 350);
    }
  }, [isChatOpen]);

  useEffect(() => {
    if (isChatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const sendChatMessage = async (e, directMessage = null) => {
    if (e) e.preventDefault();
    const textToSend = directMessage || chatInput;
    if (!textToSend.trim()) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ text: textToSend })
    });
    if (res.ok) {
      const newMsg = await res.json();
      setChatMessages(prev => [...prev, newMsg]);
      if (!directMessage) setChatInput('');
      setHasSentMessage(true);
      // Typing indicator for 2.5s
      setShowTyping(true);
      setTimeout(() => setShowTyping(false), 2500);
    }
  };

  // Play a soft notification ping using Web Audio API
  const playNotifSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  const markNotifsRead = async () => {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/api/notifications/read-all`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const submitKyc = async () => {
    if (!kycFile || !kycAddressFile) {
      addToast('Please select both National ID and Proof of Address', 'error');
      return;
    }
    setKycSubmitting(true);
    
    try {
      const getBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });

      const [documentBase64, addressDocumentBase64] = await Promise.all([
        getBase64(kycFile),
        getBase64(kycAddressFile)
      ]);

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/user/kyc`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: documentBase64, addressDocument: addressDocumentBase64 })
      });
      const data = await res.json();
      addToast(data.message, res.ok ? 'success' : 'error');
      if (res.ok) fetchDashboardData(token);
    } catch (err) {
      console.error('KYC submission error:', err);
      addToast('Failed to read files. Please try again.', 'error');
    } finally {
      setKycSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const wAmount = Number(withdrawAmount);
    if (!wAmount || wAmount < 50) return addToast('Minimum withdrawal is $50', 'error');
    if (wAmount > dashboardData.user.balance) return addToast('Insufficient balance', 'error');
    if (!withdrawWallet) return addToast('Please enter your wallet address', 'error');
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/transactions/withdraw`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: wAmount, method: withdrawMethod, txId: withdrawWallet })
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Withdrawal requested successfully');
        setWithdrawAmount('');
        setWithdrawWallet('');
        fetchDashboardData(token);
      } else {
        addToast(data.message || 'Withdrawal failed', 'error');
      }
    } catch (err) {
      addToast('An error occurred during withdrawal', 'error');
    }
  };

  const handleInvest = async (pkgName) => {
    setSelectedPackage({ name: pkgName, ...packages[pkgName] });
    setAmount(packages[pkgName].min);
    setTxId('');
    setContactInfo('');
    setPaymentMethod('usdt');
    setIsCheckoutOpen(true);
    
    // Refresh wallet addresses when opening modal in case they were updated
    const token = localStorage.getItem('token');
    try {
      const walletRes = await fetch(`${API_URL}/api/wallet-addresses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (walletRes.ok) setWalletAddresses(await walletRes.json());
    } catch (e) {
      console.error('Failed to refresh wallet addresses');
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_URL}/api/invest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          package: selectedPackage.name,
          amount: amount,
          expectedReturn: selectedPackage.returns,
          paymentMethod: paymentMethod,
          txId: txId,
          contactInfo: contactInfo
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        addToast(data.message || 'Investment submitted! Awaiting confirmation.', 'success');
        setIsCheckoutOpen(false);
        fetchDashboardData(token);
        setActiveTab('transactions');
      } else {
        addToast(data.message || 'Error submitting investment', 'error');
      }
    } catch (error) {
      addToast('Network error during checkout', 'error');
    }
  };

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          amount: withdrawAmount,
          method: withdrawMethod,
          walletAddress: withdrawWallet
        })
      });
      const data = await response.json();
      if (response.ok) {
        addToast(data.message, 'success');
        setWithdrawAmount('');
        setWithdrawWallet('');
        setWithdrawMethod('usdt');
        fetchDashboardData(token);
        setActiveTab('transactions');
      } else {
        addToast(data.message || 'Withdrawal failed', 'error');
      }
    } catch {
      addToast('Network error', 'error');
    }
  };

  if (!user || isLoading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      <header className="navbar" style={{ background: 'rgba(9, 9, 11, 0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '15px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: '180px', height: '32px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ width: '140px', height: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
        </div>
      </header>
      <div className="container" style={{ display: 'flex', flex: 1, marginTop: '80px', paddingBottom: '40px', gap: '30px' }}>
        <aside style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} style={{ height: '48px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', animation: 'pulse 1.5s infinite', animationDelay: `${i * 0.1}s` }} />
          ))}
        </aside>
        <main style={{ flex: 1, background: 'rgba(24,24,27,0.6)', borderRadius: '20px', padding: '32px', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ width: '250px', height: '36px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '30px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: '120px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', animation: 'pulse 1.5s infinite', animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <div style={{ height: '250px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
        </main>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notifications */}
      <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === 'success' ? 'rgba(6,78,59,0.9)' : 'rgba(127,29,29,0.9)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${t.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
            color: 'white', padding: '14px 20px', borderRadius: '14px', minWidth: '280px',
            boxShadow: `0 8px 32px ${t.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
            fontSize: '0.9rem', animation: 'slideIn 0.3s ease'
          }}>
            {t.type === 'success' ? '✅' : '❌'} {t.message}
          </div>
        ))}
      </div>
      {/* Dashboard Nav */}
      <header className="navbar" style={{ background: 'rgba(9, 9, 11, 0.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '15px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" className="logo">
            <div className="logo-icon"></div>
            <span>Cashflowvest Dashboard</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user?.role === 'admin' && (
              <Link to="/admin" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.9rem', background: '#f5a623', color: '#000', border: 'none' }}>
                👑 Admin Panel
              </Link>
            )}
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setShowNotifs(v => !v); if (!showNotifs) markNotifsRead(); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', position: 'relative', padding: '6px' }}
              >
                <Bell size={22} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span style={{ position: 'absolute', top: '2px', right: '2px', background: '#ef4444', color: 'white', borderRadius: '50%', fontSize: '0.65rem', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div style={{ position: 'absolute', right: 0, top: '110%', width: '320px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 500, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Notifications</span>
                    <button onClick={() => setShowNotifs(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={16} /></button>
                  </div>
                  <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', padding: '20px', textAlign: 'center', fontSize: '0.9rem' }}>No notifications yet.</p>
                    ) : notifications.map(n => (
                      <div key={n._id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', background: n.read ? 'transparent' : 'rgba(0,230,118,0.04)' }}>
                        <p style={{ fontSize: '0.85rem', color: n.type === 'error' ? '#ef4444' : n.type === 'success' ? '#00e676' : 'var(--text-primary)', margin: 0 }}>{n.message}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span style={{ color: 'var(--text-secondary)' }}>Welcome, <span style={{ color: 'white' }}>{user.name || user.email?.split('@')[0]}</span></span>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="container" style={{ display: 'flex', flex: 1, marginTop: '80px', paddingBottom: '40px', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* Sidebar */}
        <aside style={{ width: '100%', maxWidth: '220px', display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0, position: 'sticky', top: '100px', alignSelf: 'flex-start', overflowY: 'auto', maxHeight: 'calc(100vh - 120px)', paddingRight: '4px' }}>
          {[
            { key: 'overview',     label: 'Overview',       icon: LayoutDashboard,    color: '#00e676' },
            { key: 'invest',       label: 'New Investment', icon: TrendingUp,          color: '#00b0ff' },
            { key: 'investments',  label: 'My Investments', icon: Wallet,              color: '#f5a623' },
            { key: 'transactions', label: 'Transactions',   icon: List,                color: '#818cf8' },
            { key: 'withdraw',     label: 'Withdraw Funds', icon: ArrowDownCircle,     color: '#ef4444' },
            { key: 'referrals',    label: 'My Referrals',   icon: Users,               color: '#a78bfa' },
            { key: 'kyc',          label: 'KYC Verify',     icon: ShieldCheck,         color: '#06b6d4' },
            { key: 'settings',     label: 'Settings',       icon: Settings,            color: '#94a3b8' },
          ].map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: activeTab === key ? `${color}15` : 'transparent',
                color: activeTab === key ? color : 'var(--text-secondary)',
                border: 'none', padding: '13px 16px', borderRadius: '12px',
                textAlign: 'left', cursor: 'pointer', fontSize: '0.92rem',
                fontWeight: activeTab === key ? '700' : '500',
                fontFamily: 'Outfit, sans-serif',
                borderLeft: activeTab === key ? `3px solid ${color}` : '3px solid transparent',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', width: '100%',
                boxShadow: activeTab === key ? `0 4px 15px ${color}15` : 'none'
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button onClick={handleLogout} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'transparent', color: 'var(--text-secondary)',
              border: 'none', padding: '13px 16px', borderRadius: '12px',
              textAlign: 'left', cursor: 'pointer', fontSize: '0.92rem',
              fontFamily: 'Outfit, sans-serif',
              borderLeft: '3px solid transparent', transition: 'all 0.2s', width: '100%'
            }}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, minWidth: '300px', background: 'rgba(24,24,27,0.6)', backdropFilter: 'blur(16px)', borderRadius: '20px', padding: '32px', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <style>{`@keyframes tabFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .tab-content { animation: tabFadeIn 0.25s ease forwards; }`}</style>
          <ErrorBoundary key={activeTab}>


          {activeTab === 'overview' && (
            <div className="tab-content">
              <h2 style={{ marginBottom: '20px', fontSize: '1.8rem' }}>Account Overview</h2>

              {/* Broadcast Banners */}
              {broadcasts.map(b => (
                <div key={b._id} style={{
                  background: b.type === 'success' ? 'rgba(0,230,118,0.08)' : b.type === 'warning' ? 'rgba(245,166,35,0.08)' : 'rgba(0,176,255,0.08)',
                  border: `1px solid ${b.type === 'success' ? '#00e676' : b.type === 'warning' ? '#f5a623' : '#00b0ff'}40`,
                  borderRadius: '10px', padding: '14px 18px', marginBottom: '16px',
                  display: 'flex', gap: '12px', alignItems: 'flex-start'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>{b.type === 'success' ? '✅' : b.type === 'warning' ? '⚠️' : '📢'}</span>
                  <div>
                    <p style={{ fontWeight: '600', marginBottom: '2px', fontSize: '0.95rem' }}>{b.title}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>{b.message}</p>
                  </div>
                </div>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div style={{ background: 'rgba(0,230,118,0.04)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(0,230,118,0.12)' }}>
                  <LiveBalance baseBalance={dashboardData.user?.balance} investments={dashboardData.investments || []} />
                </div>
                <AnimatedStatCard
                  label="Active Investments"
                  value={dashboardData.investments?.filter(i => i.status === 'active').length || 0}
                  prefix=""
                  color="#00b0ff"
                  bg="rgba(0,176,255,0.04)"
                  border="1px solid rgba(0,176,255,0.12)"
                />
                <AnimatedStatCard
                  label="Total Profit"
                  value={dashboardData.user?.profit || 0}
                  color="#10b981"
                  bg="rgba(16,185,129,0.04)"
                  border="1px solid rgba(16,185,129,0.12)"
                />
              </div>

              {/* Portfolio Chart */}
              {dashboardData.transactions?.length > 0 && (() => {
                const chartData = dashboardData.transactions
                  .filter(tx => tx.status === 'completed')
                  .slice().reverse()
                  .reduce((acc, tx) => {
                    const last = acc.length > 0 ? acc[acc.length - 1].balance : 0;
                    const delta = tx.type === 'deposit' ? tx.amount : -tx.amount;
                    acc.push({ date: new Date(tx.createdAt).toLocaleDateString(), balance: Math.max(0, last + delta) });
                    return acc;
                  }, []);
                return chartData.length > 1 ? (
                  <div style={{ background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px', marginBottom: '30px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Portfolio Growth</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00e676" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `$${v}`} />
                        <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }} formatter={v => [`$${v}`, 'Balance']} />
                        <Area type="monotone" dataKey="balance" stroke="#00e676" strokeWidth={2} fill="url(#balGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : null;
              })()}

              {/* KYC inline banner (overview) — click goes to dedicated tab */}
              {(() => {
                const kycStatus = dashboardData.user?.kycStatus || 'none';
                const kycColor = { none: '#9ca3af', pending: '#f5a623', approved: '#00e676', rejected: '#ef4444' }[kycStatus];
                return (
                  <div
                    onClick={() => setActiveTab('kyc')}
                    style={{ background: 'var(--bg-main)', padding: '16px 20px', borderRadius: '12px', border: `1px solid ${kycColor}40`, marginBottom: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = kycColor}
                    onMouseLeave={e => e.currentTarget.style.borderColor = `${kycColor}40`}
                  >
                    <ShieldCheck size={26} color={kycColor} />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '0.95rem' }}>KYC Verification</h3>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: kycColor, fontWeight: '600', textTransform: 'capitalize' }}>
                        {kycStatus === 'none' ? 'Not submitted — click to verify' : kycStatus === 'pending' ? 'Under review' : kycStatus}
                      </p>
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>›</span>
                  </div>
                );
              })()}
              
              {/* Referral Section */}
              <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>Your Referral Link</h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Share this link and earn bonuses when friends sign up.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%', maxWidth: '400px' }}>
                  <input 
                    type="text" 
                    readOnly 
                    value={dashboardData.user?.referralCode ? `${window.location.origin}/?ref=${dashboardData.user.referralCode}` : 'Loading...'} 
                    style={{ flex: 1, background: 'rgba(245, 166, 35, 0.1)', color: '#f5a623', padding: '10px 15px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold', border: '1px solid rgba(245, 166, 35, 0.3)', outline: 'none' }} 
                  />
                  <button onClick={() => { 
                    const link = `${window.location.origin}/?ref=${dashboardData.user?.referralCode}`;
                    navigator.clipboard.writeText(link); 
                    addToast('Referral link copied!', 'success'); 
                  }} style={{ background: 'var(--accent-blue)', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Copy Link
                  </button>
                </div>
              </div>

              {/* Admin Activation Link */}

              
              {/* Ready to Grow CTA */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(0,230,118,0.06) 0%, rgba(6,182,212,0.06) 100%)',
                padding: '32px 30px',
                borderRadius: '16px',
                textAlign: 'center',
                border: '1px solid rgba(0,230,118,0.15)',
                boxShadow: '0 0 40px rgba(0,230,118,0.04)'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🚀</div>
                <h3 style={{ marginBottom: '10px', fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem' }}>Ready to grow your portfolio?</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>Explore our high-yield investment packages and start earning today.</p>
                <button onClick={() => setActiveTab('invest')} className="btn btn-primary">View Packages →</button>
              </div>
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div className="tab-content">
              <h2 style={{ marginBottom: '8px', fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif' }}>Withdraw Funds</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '0.9rem' }}>Funds are processed within 24–48 hours.</p>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '28px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', maxWidth: '520px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: '12px', padding: '16px 20px', marginBottom: '28px' }}>
                  <div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Available Balance</p>
                    <p style={{ color: '#00e676', fontSize: '1.6rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif', margin: 0 }}>${(dashboardData.user?.balance || 0).toLocaleString()}</p>
                  </div>
                  <span style={{ fontSize: '2rem' }}>💰</span>
                </div>

                <form onSubmit={handleWithdrawalSubmit}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}>Amount (USD)</label>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0 16px' }}>
                      <span style={{ color: '#00e676', fontWeight: '700', marginRight: '8px' }}>$</span>
                      <input
                        type="number"
                        min="50"
                        max={dashboardData.user?.balance || 0}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        required
                        placeholder="Min $50"
                        style={{ width: '100%', padding: '16px 0', background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '1rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}>Withdrawal Method</label>
                    <select
                      value={withdrawMethod}
                      onChange={(e) => setWithdrawMethod(e.target.value)}
                      style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                      <option value="usdt">USDT (TRC20)</option>
                      <option value="btc">Bitcoin (BEP20)</option>
                      <option value="eth">Ethereum (BEP20)</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '28px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}>Destination Wallet Address</label>
                    <input
                      type="text"
                      value={withdrawWallet}
                      onChange={(e) => setWithdrawWallet(e.target.value)}
                      required
                      placeholder={`Enter your ${withdrawMethod.toUpperCase()} address`}
                      style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', fontFamily: 'monospace', fontSize: '0.9rem' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!dashboardData.user || (dashboardData.user.balance || 0) < 50}
                    style={{ width: '100%', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', fontWeight: '700', padding: '16px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', fontFamily: 'Outfit, sans-serif', boxShadow: '0 4px 15px rgba(239,68,68,0.2)', transition: 'all 0.2s' }}
                  >
                    Request Withdrawal
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'invest' && (
            <div>
              <h2 style={{ marginBottom: '8px', fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif' }}>Available Packages</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '0.9rem' }}>Choose a package and start growing your portfolio today.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                {Object.keys(packages).map((pkg) => (
                  <div key={pkg} style={{
                    background: `linear-gradient(160deg, rgba(24,24,27,1) 0%, ${packages[pkg].color}08 100%)`,
                    border: `1px solid ${packages[pkg].color}25`,
                    borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: `0 4px 20px ${packages[pkg].color}08`
                  }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${packages[pkg].color}, transparent)` }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Outfit, sans-serif' }}>
                        <span style={{ fontSize: '1.6rem' }}>{packages[pkg].badge}</span> {pkg}
                      </h3>
                      <span style={{ color: packages[pkg].color, background: `${packages[pkg].color}15`, border: `1px solid ${packages[pkg].color}30`, padding: '4px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', fontFamily: 'Outfit, sans-serif' }}>
                        {packages[pkg].returns} Return
                      </span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.25rem', fontWeight: '800', marginBottom: '6px', fontFamily: 'Outfit, sans-serif' }}>
                      ${packages[pkg].min.toLocaleString()} – ${packages[pkg].max.toLocaleString()}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '20px' }}>Investment range</p>
                    <button
                      onClick={() => handleInvest(pkg)}
                      className="btn btn-block"
                      style={{
                        background: `${packages[pkg].color}12`,
                        color: packages[pkg].color,
                        border: `1px solid ${packages[pkg].color}40`,
                        fontWeight: '700',
                        fontSize: '0.95rem',
                        padding: '13px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: `0 0 0 ${packages[pkg].color}00`
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = packages[pkg].color; e.currentTarget.style.color = '#09090b'; e.currentTarget.style.boxShadow = `0 6px 24px ${packages[pkg].color}30`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = `${packages[pkg].color}12`; e.currentTarget.style.color = packages[pkg].color; e.currentTarget.style.boxShadow = `0 0 0 ${packages[pkg].color}00`; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      Invest Now →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'investments' && (
            <div className="tab-content">
              <h2 style={{ marginBottom: '8px', fontSize: '1.8rem' }}>My Investments</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '25px', fontSize: '0.9rem' }}>Live gains update in real-time based on your package rate.</p>
              {dashboardData.investments?.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  {dashboardData.investments.map(inv => (
                    <InvestmentCard key={inv._id} inv={inv} packages={packages} />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📊</div>
                  <p>You don't have any active investments yet.</p>
                  <button onClick={() => setActiveTab('invest')} className="btn btn-outline" style={{ marginTop: '20px' }}>Browse Packages</button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h2 style={{ marginBottom: '8px', fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif' }}>Transaction History</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>A full record of all your deposits and withdrawals.</p>
              <div className="table-responsive" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'Outfit, sans-serif' }}>Date</th>
                      <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'Outfit, sans-serif' }}>Type</th>
                      <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'Outfit, sans-serif' }}>Amount</th>
                      <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'Outfit, sans-serif' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.transactions?.length > 0 ? (
                      dashboardData.transactions.map(tx => (
                        <tr key={tx._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{new Date(tx.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '16px 20px', textTransform: 'capitalize', fontWeight: '600' }}>{tx.type} {tx.method ? <span style={{ color: 'var(--text-secondary)', fontWeight: '400', fontSize: '0.85rem' }}>({tx.method.toUpperCase()})</span> : ''}</td>
                          <td style={{ padding: '16px 20px', fontWeight: '700', fontFamily: 'Outfit, sans-serif', color: tx.type === 'withdrawal' ? '#ef4444' : '#00e676' }}>
                            {tx.type === 'withdrawal' ? '-' : '+'}${tx.amount.toLocaleString()}
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <span style={{ 
                              color: tx.status === 'completed' ? '#10b981' : tx.status === 'pending' ? '#f59e0b' : '#ef4444',
                              background: tx.status === 'completed' ? 'rgba(16,185,129,0.08)' : tx.status === 'pending' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                              border: `1px solid ${tx.status === 'completed' ? 'rgba(16,185,129,0.2)' : tx.status === 'pending' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
                              padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', textTransform: 'capitalize'
                            }}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📋</div>
                          No transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SUPPORT WIDGET IS NOW FLOATING, NOT A TAB ── */}

          {activeTab === 'withdraw' && (
            <div className="tab-content">
              <h2 style={{ marginBottom: '8px', fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif' }}>Withdraw Funds</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>Fast and secure withdrawals to your crypto wallet.</p>
              
              <div style={{ background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.2)', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Available for Withdrawal</p>
                  <p style={{ color: '#00e676', fontSize: '1.5rem', fontWeight: '800', fontFamily: 'monospace' }}>${dashboardData.user?.balance?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0.00'}</p>
                </div>
                {dashboardData.user?.balance < 50 && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600' }}>
                    Min. withdrawal is $50
                  </div>
                )}
              </div>

              <div style={{ maxWidth: '480px' }}>
                <form onSubmit={handleWithdraw}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}>Amount to Withdraw (USD)</label>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0 16px', transition: 'border-color 0.2s' }}>
                      <span style={{ color: '#00e676', fontWeight: '700', marginRight: '8px' }}>$</span>
                      <input 
                        type="number" 
                        min="50"
                        max={dashboardData.user?.balance || 0}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        required
                        placeholder="Min $50"
                        style={{ width: '100%', padding: '16px 0', background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '1rem' }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}>Withdrawal Method</label>
                    <select 
                      value={withdrawMethod}
                      onChange={(e) => setWithdrawMethod(e.target.value)}
                      style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                      <option value="usdt">USDT (TRC20)</option>
                      <option value="btc">Bitcoin (BEP20)</option>
                      <option value="eth">Ethereum (BEP20)</option>
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: '28px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}>Destination Wallet Address</label>
                    <input 
                      type="text" 
                      value={withdrawWallet}
                      onChange={(e) => setWithdrawWallet(e.target.value)}
                      required
                      placeholder={`Enter your ${withdrawMethod ? withdrawMethod.toUpperCase() : 'USDT'} address`}
                      style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', fontFamily: 'monospace', fontSize: '0.9rem' }}
                    />
                  </div>
                  
                  <button type="submit" style={{ width: '100%', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', fontWeight: '700', padding: '16px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', fontFamily: 'Outfit, sans-serif', boxShadow: '0 4px 15px rgba(239,68,68,0.2)', transition: 'all 0.2s' }} disabled={!dashboardData.user || dashboardData.user.balance < 50}>
                    Request Withdrawal
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── KYC TAB ── */}
          {activeTab === 'kyc' && (() => {
            const kycStatus = dashboardData.user?.kycStatus || 'none';
            const kycColor = { none: '#06b6d4', pending: '#f5a623', approved: '#00e676', rejected: '#ef4444' }[kycStatus];
            return (
              <div className="tab-content">
                <h2 style={{ marginBottom: '8px', fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif' }}>🛡️ KYC Verification</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '0.9rem' }}>
                  Submit your identity documents to unlock full withdrawal access.
                </p>

                {/* Status Banner */}
                <div style={{ background: `${kycColor}10`, border: `1px solid ${kycColor}40`, borderRadius: '14px', padding: '20px 24px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${kycColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShieldCheck size={24} color={kycColor} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '1rem', color: kycColor, textTransform: 'capitalize' }}>
                      {kycStatus === 'none' ? 'Not Submitted' : kycStatus === 'pending' ? 'Under Review' : kycStatus === 'approved' ? 'Verified ✓' : 'Rejected — Please Resubmit'}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {kycStatus === 'none' && 'Upload your National ID and Proof of Address below to get verified.'}
                      {kycStatus === 'pending' && 'Your documents are being reviewed. This usually takes 24–48 hours.'}
                      {kycStatus === 'approved' && 'You are fully verified. All withdrawal limits are unlocked.'}
                      {kycStatus === 'rejected' && 'Your submission was rejected. Please upload clearer documents and try again.'}
                    </p>
                  </div>
                </div>

                {(kycStatus === 'none' || kycStatus === 'rejected') && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                    {/* National ID Card */}
                    <label htmlFor="kyc-file-tab" style={{ cursor: 'pointer' }}>
                      <div style={{ background: 'var(--bg-main)', border: `2px dashed ${kycFile ? '#00e676' : 'rgba(255,255,255,0.15)'}`, borderRadius: '16px', padding: '32px 20px', textAlign: 'center', transition: 'border-color 0.2s' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{kycFile ? '✅' : '🪪'}</div>
                        <p style={{ fontWeight: '700', marginBottom: '6px' }}>National ID / Passport</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0 0 14px' }}>JPG, PNG or PDF · Max 5MB</p>
                        {kycFile ? (
                          <p style={{ color: '#00e676', fontSize: '0.85rem', fontWeight: '600', wordBreak: 'break-all' }}>{kycFile.name}</p>
                        ) : (
                          <span style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4', padding: '8px 18px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }}>Choose File</span>
                        )}
                      </div>
                      <input type="file" id="kyc-file-tab" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => setKycFile(e.target.files[0])} />
                    </label>

                    {/* Proof of Address Card */}
                    <label htmlFor="kyc-address-tab" style={{ cursor: 'pointer' }}>
                      <div style={{ background: 'var(--bg-main)', border: `2px dashed ${kycAddressFile ? '#00e676' : 'rgba(255,255,255,0.15)'}`, borderRadius: '16px', padding: '32px 20px', textAlign: 'center', transition: 'border-color 0.2s' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{kycAddressFile ? '✅' : '🏠'}</div>
                        <p style={{ fontWeight: '700', marginBottom: '6px' }}>Proof of Address</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0 0 14px' }}>Utility bill or bank statement</p>
                        {kycAddressFile ? (
                          <p style={{ color: '#00e676', fontSize: '0.85rem', fontWeight: '600', wordBreak: 'break-all' }}>{kycAddressFile.name}</p>
                        ) : (
                          <span style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4', padding: '8px 18px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }}>Choose File</span>
                        )}
                      </div>
                      <input type="file" id="kyc-address-tab" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => setKycAddressFile(e.target.files[0])} />
                    </label>
                  </div>
                )}

                {(kycStatus === 'none' || kycStatus === 'rejected') && (
                  <button
                    onClick={submitKyc}
                    disabled={!kycFile || !kycAddressFile || kycSubmitting}
                    style={{
                      width: '100%', background: (kycFile && kycAddressFile) ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : 'rgba(255,255,255,0.05)',
                      color: (kycFile && kycAddressFile) ? 'white' : 'var(--text-secondary)',
                      border: 'none', padding: '16px', borderRadius: '12px', fontWeight: '700', fontSize: '1rem',
                      cursor: (kycFile && kycAddressFile) ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s', fontFamily: 'Outfit, sans-serif',
                      boxShadow: (kycFile && kycAddressFile) ? '0 4px 20px rgba(6,182,212,0.3)' : 'none'
                    }}
                  >
                    {kycSubmitting ? '⏳ Submitting...' : (!kycFile || !kycAddressFile) ? 'Upload Both Documents to Continue' : '🛡️ Submit for Verification'}
                  </button>
                )}
              </div>
            );
          })()}

          {/* ── REFERRALS TAB ── */}
          {activeTab === 'referrals' && (
            <ReferralsTab token={localStorage.getItem('token')} user={dashboardData.user} />
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === 'settings' && (
            <SettingsTab user={dashboardData.user} token={localStorage.getItem('token')} onUpdate={() => window.location.reload()} addToast={addToast} />
          )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && selectedPackage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2000, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', overflowY: 'auto', padding: '20px'
        }}>
          <div style={{
            background: 'rgba(15,14,12,0.95)',
            backdropFilter: 'blur(20px)',
            padding: '40px', borderRadius: '28px',
            width: '100%', maxWidth: '520px',
            border: '1px solid rgba(245,166,35,0.2)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(245,166,35,0.04)',
            position: 'relative',
            fontFamily: 'Inter, sans-serif'
          }}>
            <button 
              onClick={() => setIsCheckoutOpen(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#888', fontSize: '1.2rem', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#888'; }}
            >&times;</button>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', color: '#f5a623', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px', fontSize: '1.8rem' }}>
                  {selectedPackage.badge || '💎'}
                </div>
                <div>
                  <h2 style={{ color: 'white', margin: '0 0 4px', fontSize: '1.4rem', fontFamily: 'Outfit, sans-serif' }}>Pay with Crypto</h2>
                  <p style={{ color: '#f5a623', margin: 0, fontSize: '0.9rem', fontWeight: '600' }}>
                    {selectedPackage.name.toUpperCase()} — {selectedPackage.returns} Return
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCheckoutSubmit}>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#888', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Investment Amount</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: '14px', padding: '0 18px' }}>
                  <span style={{ color: '#f5a623', fontSize: '1.3rem', fontWeight: '800', marginRight: '8px' }}>$</span>
                  <input 
                    type="number" 
                    min={selectedPackage.min} 
                    max={selectedPackage.max}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    style={{ width: '100%', padding: '16px 0', background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '1.3rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}
                  />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginTop: '8px' }}>
                  Range: ${selectedPackage.min.toLocaleString()} – ${selectedPackage.max.toLocaleString()}
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#888', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Select Network</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['usdt', 'btc', 'eth'].map(coin => (
                    <button
                      key={coin}
                      type="button"
                      onClick={() => setPaymentMethod(coin)}
                      style={{
                        flex: 1, padding: '12px 0', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem',
                        background: paymentMethod === coin ? 'rgba(245,166,35,0.12)' : 'rgba(255,255,255,0.03)',
                        border: paymentMethod === coin ? '1px solid rgba(245,166,35,0.5)' : '1px solid rgba(255,255,255,0.08)',
                        color: paymentMethod === coin ? '#f5a623' : '#666',
                        boxShadow: paymentMethod === coin ? '0 0 16px rgba(245,166,35,0.1)' : 'none'
                      }}
                    >
                      {coin === 'usdt' ? 'USDT (TRC20)' : `${coin.toUpperCase()} (BEP20)`}
                    </button>
                  ))}
                </div>
              </div>

              {walletAddresses && (
                <div style={{ marginBottom: '28px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', color: '#888', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Send To This Address</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: '14px', padding: '16px 18px', gap: '12px' }}>
                    <div style={{ flex: 1, color: '#f5a623', wordBreak: 'break-all', fontSize: '0.88rem', fontFamily: 'monospace', lineHeight: '1.5' }}>
                      {walletAddresses[paymentMethod]}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { navigator.clipboard.writeText(walletAddresses[paymentMethod]); setCopied(true); setTimeout(()=>setCopied(false), 2000); }}
                      style={{ background: copied ? 'rgba(0,230,118,0.15)' : 'rgba(245,166,35,0.1)', border: `1px solid ${copied ? 'rgba(0,230,118,0.4)' : 'rgba(245,166,35,0.3)'}`, color: copied ? '#00e676' : '#f5a623', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                    >
                      {copied ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                  
                  {paymentMethod === 'usdt' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', color: '#888', fontSize: '0.82rem', padding: '10px 14px', background: 'rgba(245,166,35,0.04)', borderRadius: '8px', border: '1px solid rgba(245,166,35,0.1)' }}>
                      <span>⚡</span> Only send USDT on the <strong style={{ color: '#f5a623' }}>TRC20 (TRON)</strong> network
                    </div>
                  )}

                  {(paymentMethod === 'btc' || paymentMethod === 'eth') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', color: '#888', fontSize: '0.82rem', padding: '10px 14px', background: 'rgba(245,166,35,0.04)', borderRadius: '8px', border: '1px solid rgba(245,166,35,0.1)' }}>
                      <span>⚡</span> Only send {paymentMethod.toUpperCase()} on the <strong style={{ color: '#f5a623' }}>BEP20 (BSC)</strong> network
                    </div>
                  )}

                  <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '14px 16px', marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ color: '#ef4444', fontSize: '1rem' }}>⚠️</span>
                    <p style={{ color: '#888', margin: 0, fontSize: '0.82rem', lineHeight: '1.5' }}>
                      Wrong network = <strong style={{ color: '#ef4444' }}>permanent loss of funds</strong>. Always verify before sending.
                    </p>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#888', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Payment Proof</label>
                
                <div style={{ marginBottom: '14px' }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginBottom: '8px' }}>Transaction Hash (TX ID)</p>
                  <input 
                    type="text" 
                    value={txId}
                    onChange={(e) => setTxId(e.target.value)}
                    placeholder="e.g. 0xabc123..."
                    required
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', outline: 'none', fontFamily: 'monospace', fontSize: '0.88rem' }}
                  />
                </div>
                
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginBottom: '8px' }}>Telegram Username or Email</p>
                  <input 
                    type="text" 
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="Where should we contact you?"
                    required
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', outline: 'none', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <button type="submit" style={{ 
                width: '100%', background: 'linear-gradient(135deg, #f5a623, #e09614)', color: '#09090b', 
                fontWeight: '800', fontSize: '1.05rem', padding: '18px', 
                border: 'none', borderRadius: '14px', cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif',
                boxShadow: '0 6px 24px rgba(245,166,35,0.25)', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(245,166,35,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(245,166,35,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Submit Payment Proof ✅
              </button>
            </form>
          </div>
        </div>
      )}
      {/* ── FLOATING SUPPORT WIDGET ── */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        
        {/* Chat Window */}
        {isChatOpen && (
          <div style={{ 
            width: '350px', height: '500px', background: 'white', borderRadius: '16px', overflow: 'hidden', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)', marginBottom: '15px', display: 'flex', flexDirection: 'column',
            animation: 'slideIn 0.3s ease', border: '1px solid #e5e7eb'
          }}>
          <div style={{ background: '#00b16a', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span onClick={() => setIsChatOpen(false)} style={{ cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}>{'<'}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontFamily: 'Arial, sans-serif' }}>Customer Support</h3>
                  <p style={{ margin: 0, fontSize: '0.72rem', opacity: 0.85 }}>We typically reply within a few hours</p>
                </div>
              </div>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setIsChatOpen(false)} />
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {chatMessages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: '#9ca3af' }}>
                  <MessageCircle size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>Send us a message and we'll reply shortly.</p>
                </div>
              ) : (
                chatMessages.map(msg => (
                  <div key={msg._id} style={{ alignSelf: msg.isAdmin ? 'flex-start' : 'flex-end', maxWidth: '85%' }}>
                    <div style={{ 
                      background: msg.isAdmin ? '#e5e7eb' : '#00b16a', 
                      color: msg.isAdmin ? '#1f2937' : 'white', 
                      padding: '10px 14px', 
                      borderRadius: msg.isAdmin ? '14px 14px 14px 4px' : '14px 14px 4px 14px', 
                      fontSize: '0.9rem', lineHeight: '1.4' 
                    }}>
                      {msg.text}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '4px', textAlign: msg.isAdmin ? 'left' : 'right' }}>
                      {msg.isAdmin ? 'Support · ' : ''}{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
              {/* Typing indicator */}
              {showTyping && (
                <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                  <div style={{ background: '#e5e7eb', padding: '10px 16px', borderRadius: '14px 14px 14px 4px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <style>{`@keyframes typingDot { 0%,80%,100%{transform:scale(0);opacity:0.4} 40%{transform:scale(1);opacity:1} } .td{width:7px;height:7px;background:#9ca3af;border-radius:50%;animation:typingDot 1.2s infinite ease-in-out;} .td:nth-child(2){animation-delay:.15s} .td:nth-child(3){animation-delay:.3s}`}</style>
                    <div className="td"/><div className="td"/><div className="td"/>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '4px' }}>Support is typing...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Replies - hide after first message sent */}
            {!hasSentMessage && (
              <div style={{ padding: '10px 12px', background: 'white', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`.quick-reply-scroll::-webkit-scrollbar { display: none; }`}</style>
                <div className="quick-reply-scroll" style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                  {["How do I deposit?", "What are the investment plans?", "My withdrawal is pending"].map((msg, i) => (
                    <button 
                      key={i} 
                      onClick={() => sendChatMessage(null, msg)}
                      style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', padding: '6px 12px', borderRadius: '16px', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#e5e7eb'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div style={{ background: 'white', borderTop: '1px solid #e5e7eb', padding: '12px' }}>
              <form onSubmit={sendChatMessage} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  ref={chatInputRef}
                  type="text" 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)} 
                  placeholder="Type here and press enter.." 
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.9rem', padding: '8px', color: '#374151', background: 'transparent' }} 
                />
                <button type="submit" disabled={!chatInput.trim()} style={{ background: 'transparent', border: 'none', color: '#00b16a', cursor: chatInput.trim() ? 'pointer' : 'default', fontWeight: 'bold' }}>
                  <TrendingUp size={20} style={{ transform: 'rotate(45deg)', opacity: chatInput.trim() ? 1 : 0.5 }} />
                </button>
              </form>
            </div>
            
            {/* Branding Footer */}
            <div style={{ textAlign: 'center', padding: '6px', background: '#f3f4f6', fontSize: '0.7rem', color: '#9ca3af', borderTop: '1px solid #e5e7eb' }}>
              ⚡ Powered by Cashflowvest
            </div>
          </div>
        )}

        {/* Floating Toggle Button */}
        {!isChatOpen && (
          <button 
            onClick={() => { setIsChatOpen(true); setUnreadCount(0); }}
            style={{ 
              width: '60px', height: '60px', borderRadius: '50%', background: '#00b16a', color: 'white',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(0, 177, 106, 0.4)', transition: 'transform 0.2s', position: 'relative'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <MessageCircle size={30} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', borderRadius: '50%', fontSize: '0.7rem', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 2px 6px rgba(239,68,68,0.5)', animation: 'pulse 1.5s infinite' }}>
                {unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

    </div>
  );
}

// ── REFERRALS TAB COMPONENT ───────────────────────────────────────────────────
function ReferralsTab({ token, user }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/user/referrals', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const referralLink = user?.referralCode ? `${window.location.origin}/?ref=${user.referralCode}` : '';

  return (
    <div>
      <h2 style={{ marginBottom: '8px', fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif' }}>My Referrals</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '0.9rem' }}>
        Earn <strong style={{ color: '#a78bfa' }}>$10</strong> for every friend who signs up and makes their first deposit.
      </p>

      {/* Referral Link Card */}
      <div style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(129,140,248,0.04))', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
        <p style={{ color: '#a78bfa', fontWeight: '700', marginBottom: '10px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Referral Link</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input readOnly value={referralLink} style={{ flex: 1, minWidth: '200px', background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: '10px', padding: '12px 16px', color: '#a78bfa', fontFamily: 'monospace', fontSize: '0.85rem', outline: 'none' }} />
          <button onClick={() => { navigator.clipboard.writeText(referralLink); }} style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.35)', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' }}>
            Copy Link
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Referrals', value: loading ? '—' : (data?.referrals?.length ?? 0), color: '#a78bfa', icon: '👥' },
          { label: 'Bonuses Earned', value: loading ? '—' : `$${data?.bonusEarned ?? 0}`, color: '#00e676', icon: '💰' },
          { label: 'Pending Bonuses', value: loading ? '—' : `$${((data?.referrals?.length ?? 0) - (data?.referrals?.filter(r => r.referralBonusPaid).length ?? 0)) * 10}`, color: '#f5a623', icon: '⏳' },
        ].map(s => (
          <div key={s.label} style={{ background: `${s.color}08`, border: `1px solid ${s.color}20`, borderRadius: '14px', padding: '20px' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Referrals Table */}
      <div style={{ background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontFamily: 'Outfit, sans-serif' }}>Referred Users</h3>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : data?.referrals?.length > 0 ? (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Name', 'Email', 'Joined', 'Bonus Status'].map(h => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.referrals.map(r => (
                  <tr key={r._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: '600' }}>{r.name}</td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{r.email}</td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', background: r.referralBonusPaid ? 'rgba(0,230,118,0.08)' : 'rgba(245,158,11,0.08)', color: r.referralBonusPaid ? '#00e676' : '#f59e0b', border: `1px solid ${r.referralBonusPaid ? 'rgba(0,230,118,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                        {r.referralBonusPaid ? '✅ Paid' : '⏳ Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🤝</div>
            <p>No referrals yet. Share your link to start earning!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SETTINGS TAB COMPONENT ────────────────────────────────────────────────────
function SettingsTab({ user, token, onUpdate, addToast }) {
  const [form, setForm] = React.useState({ name: user?.name || '', phone: user?.phone || '', password: '', confirmPassword: '' });
  const [saving, setSaving] = React.useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      addToast('Passwords do not match', 'error'); return;
    }
    setSaving(true);
    const body = { name: form.name, phone: form.phone };
    if (form.password) body.password = form.password;
    try {
      const r = await fetch('/api/user/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const d = await r.json();
      if (r.ok) { addToast(d.message || 'Settings saved!', 'success'); setTimeout(onUpdate, 1000); }
      else addToast(d.message || 'Failed to save', 'error');
    } catch { addToast('Network error', 'error'); }
    setSaving(false);
  };

  const kycColors = { none: '#94a3b8', pending: '#f59e0b', approved: '#00e676', rejected: '#ef4444' };
  const kycLabel = { none: 'Not Submitted', pending: '⏳ Pending Review', approved: '✅ Approved', rejected: '❌ Rejected' };
  const kycStatus = user?.kycStatus || 'none';

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '13px 16px', color: 'white', fontFamily: 'Outfit, sans-serif', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' };

  return (
    <div>
      <h2 style={{ marginBottom: '8px', fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif' }}>Account Settings</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '0.9rem' }}>Manage your profile and security settings.</p>

      {/* KYC Status Banner */}
      <div style={{ background: `${kycColors[kycStatus]}10`, border: `1px solid ${kycColors[kycStatus]}30`, borderRadius: '14px', padding: '18px 22px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <ShieldCheck size={28} color={kycColors[kycStatus]} />
        <div>
          <p style={{ margin: 0, fontWeight: '700', color: kycColors[kycStatus], fontFamily: 'Outfit, sans-serif' }}>KYC Verification: {kycLabel[kycStatus]}</p>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            {kycStatus === 'none' && 'Submit your documents in the KYC tab to unlock full withdrawal access.'}
            {kycStatus === 'pending' && 'Your documents are under review. We\'ll notify you once complete.'}
            {kycStatus === 'approved' && 'Your identity is verified. You have full platform access.'}
            {kycStatus === 'rejected' && 'Your submission was rejected. Please resubmit with clearer documents.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '520px' }}>
        {/* Profile Info */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '1rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Outfit, sans-serif' }}>Profile Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: '600' }}>Full Name</label>
              <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: '600' }}>Phone Number</label>
              <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Your phone number" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: '600' }}>Email Address</label>
              <input style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} value={user?.email || ''} readOnly />
              <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Email cannot be changed.</p>
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '1rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Outfit, sans-serif' }}>Change Password</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: '600' }}>New Password</label>
              <input type="password" style={inputStyle} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Leave blank to keep current" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: '600' }}>Confirm Password</label>
              <input type="password" style={inputStyle} value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Repeat new password" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} style={{ background: 'linear-gradient(135deg, #94a3b8, #64748b)', color: 'white', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif', opacity: saving ? 0.7 : 1, transition: 'all 0.2s' }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

export default Dashboard;
