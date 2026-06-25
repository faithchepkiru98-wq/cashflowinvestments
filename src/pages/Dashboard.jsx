import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Wallet, ArrowDownCircle, List, LogOut, Crown } from 'lucide-react';

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
  if (h > 0) return `${h}h ${m}m left`;
  if (m > 0) return `${m}m ${s}s left`;
  return `${s}s left`;
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
  const [copied, setCopied] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  
  // Progressive packages — starts at $50, each tier unlocks higher returns.
  // Durations live on the server (PACKAGE_DURATIONS); client only needs display info.
  const packages = {
    'Starter':  { returns: '8%',  min: 50,    max: 499,   badge: '🌱', color: '#10b981' },
    'Basic':    { returns: '10%', min: 500,   max: 1999,  badge: '⭐', color: '#00b0ff' },
    'Bronze':   { returns: '15%', min: 2000,  max: 4999,  badge: '🥉', color: '#cd7f32' },
    'Silver':   { returns: '20%', min: 5000,  max: 14999, badge: '🥈', color: '#9ca3af' },
    'Gold':     { returns: '25%', min: 15000, max: 29999, badge: '🥇', color: '#f5a623' },
    'Diamond':  { returns: '30%', min: 30000, max: 100000,badge: '💎', color: '#818cf8' },
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
      if (walletRes.ok) {
        setWalletAddresses(await walletRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleInvest = (pkgName) => {
    setSelectedPackage({ name: pkgName, ...packages[pkgName] });
    setAmount(packages[pkgName].min);
    setTxId('');
    setContactInfo('');
    setPaymentMethod('usdt');
    setIsCheckoutOpen(true);
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
          amount: amount,
          method: paymentMethod,
          walletAddress: txId // Reusing txId state for walletAddress to save state vars
        })
      });
      const data = await response.json();
      if (response.ok) {
        addToast(data.message, 'success');
        setAmount('');
        setTxId('');
        fetchDashboardData(token);
        setActiveTab('transactions');
      } else {
        addToast(data.message, 'error');
      }
    } catch {
      addToast('Network error', 'error');
    }
  };

  if (!user) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', border: '3px solid #00e676', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: 'var(--text-secondary)' }}>Loading your dashboard…</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
      {/* Toast Notifications */}
      <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === 'success' ? '#064e3b' : '#7f1d1d',
            border: `1px solid ${t.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: 'white', padding: '14px 20px', borderRadius: '10px', minWidth: '280px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)', fontSize: '0.9rem', animation: 'slideIn 0.3s ease'
          }}>
            {t.type === 'success' ? '✅' : '❌'} {t.message}
          </div>
        ))}
      </div>
      {/* Dashboard Nav */}
      <header className="navbar" style={{ background: 'rgba(19, 23, 34, 1)', borderBottom: '1px solid var(--border-color)', padding: '15px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" className="logo">
            <div className="logo-icon"></div>
            <span>Cashflowvest Dashboard</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
             {user?.role === 'admin' && (
               <Link to="/admin" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.9rem', background: '#f5a623', color: '#000', border: 'none' }}>
                 👑 Admin Panel
               </Link>
             )}
             <span style={{ color: 'var(--text-secondary)' }}>Welcome, <span style={{ color: 'white' }}>{user.name || user.email.split('@')[0]}</span></span>
             <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>Logout</button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="container" style={{ display: 'flex', flex: 1, padding: '40px 20px', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* Sidebar */}
        <aside style={{ width: '100%', maxWidth: '220px', display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
          {[
            { key: 'overview',     label: 'Overview',       icon: LayoutDashboard,    color: '#00e676' },
            { key: 'invest',       label: 'New Investment', icon: TrendingUp,          color: '#00b0ff' },
            { key: 'investments',  label: 'My Investments', icon: Wallet,              color: '#f5a623' },
            { key: 'transactions', label: 'Transactions',   icon: List,                color: '#818cf8' },
            { key: 'withdraw',     label: 'Withdraw Funds', icon: ArrowDownCircle,     color: '#ef4444' },
          ].map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: activeTab === key ? `${color}18` : 'transparent',
                color: activeTab === key ? color : 'var(--text-secondary)',
                border: 'none', padding: '13px 16px', borderRadius: '10px',
                textAlign: 'left', cursor: 'pointer', fontSize: '0.92rem', fontWeight: activeTab === key ? '600' : '400',
                borderLeft: activeTab === key ? `3px solid ${color}` : '3px solid transparent',
                transition: 'all 0.2s', width: '100%'
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <button onClick={handleLogout} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'transparent', color: 'var(--text-secondary)',
              border: 'none', padding: '13px 16px', borderRadius: '10px',
              textAlign: 'left', cursor: 'pointer', fontSize: '0.92rem',
              borderLeft: '3px solid transparent', transition: 'all 0.2s', width: '100%'
            }}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, minWidth: '300px', background: 'var(--bg-card)', borderRadius: '16px', padding: '30px', border: '1px solid var(--border-color)' }}>
          
          {activeTab === 'overview' && (
            <div>
              <h2 style={{ marginBottom: '20px', fontSize: '1.8rem' }}>Account Overview</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <LiveBalance baseBalance={dashboardData.user?.balance} investments={dashboardData.investments || []} />
                </div>
                <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '10px' }}>Active Investments</p>
                  <h3 style={{ fontSize: '2rem', color: 'var(--accent-blue)' }}>{dashboardData.investments?.filter(i => i.status === 'active').length || 0}</h3>
                </div>
                <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '10px' }}>Total Profit</p>
                  <h3 style={{ fontSize: '2rem', color: '#10b981' }}>${dashboardData.user?.profit?.toLocaleString() || '0.00'}</h3>
                </div>
              </div>
              
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

              
              <div style={{ background: 'var(--bg-main)', padding: '30px', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
                <h3 style={{ marginBottom: '15px' }}>Ready to grow your portfolio?</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Explore our high-yield investment packages and start earning today.</p>
                <button onClick={() => setActiveTab('invest')} className="btn btn-primary">View Packages</button>
              </div>
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div>
              <h2 style={{ marginBottom: '20px', fontSize: '1.8rem' }}>Withdraw Funds</h2>
              <div style={{ background: 'var(--bg-main)', padding: '25px', borderRadius: '12px', border: '1px solid var(--border-color)', maxWidth: '500px' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Available Balance: <strong style={{ color: '#00e676', fontSize: '1.2rem' }}>${dashboardData.user?.balance?.toLocaleString() || '0.00'}</strong></p>
                
                <form onSubmit={handleWithdrawalSubmit}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Amount to Withdraw (USD)</label>
                    <input 
                      type="number" 
                      min="50"
                      max={dashboardData.user?.balance || 0}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      placeholder="Min $50"
                      style={{ width: '100%', padding: '15px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white', outline: 'none' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Withdrawal Method</label>
                    <select 
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={{ width: '100%', padding: '15px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white', outline: 'none', appearance: 'none' }}>
                      <option value="usdt">USDT (TRC20)</option>
                      <option value="btc">Bitcoin (BTC)</option>
                      <option value="eth">Ethereum (ETH)</option>
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: '30px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Destination Wallet Address</label>
                    <input 
                      type="text" 
                      value={txId} // Reusing txId for wallet address
                      onChange={(e) => setTxId(e.target.value)}
                      required
                      placeholder={`Enter your ${paymentMethod.toUpperCase()} address`}
                      style={{ width: '100%', padding: '15px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white', outline: 'none' }}
                    />
                  </div>
                  
                  <button type="submit" style={{ width: '100%', background: '#ef4444', color: 'white', fontWeight: 'bold', padding: '15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem' }} disabled={!dashboardData.user || dashboardData.user.balance < 50}>
                    Request Withdrawal
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'invest' && (
            <div>
              <h2 style={{ marginBottom: '20px', fontSize: '1.8rem' }}>Available Packages</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {Object.keys(packages).map((pkg) => (
                  <div key={pkg} style={{ background: 'var(--bg-main)', border: `1px solid ${packages[pkg].color}40`, borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: packages[pkg].color }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.5rem' }}>{packages[pkg].badge}</span> {pkg}
                      </h3>
                      <span style={{ color: packages[pkg].color, background: `${packages[pkg].color}20`, padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        {packages[pkg].returns} Return
                      </span>
                    </div>
                    <p style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px' }}>
                      ${packages[pkg].min.toLocaleString()} - ${packages[pkg].max.toLocaleString()}
                    </p>
                    <button
                      onClick={() => handleInvest(pkg)}
                      className="btn btn-block"
                      style={{
                        background: `${packages[pkg].color}15`,
                        color: packages[pkg].color,
                        border: `1px solid ${packages[pkg].color}60`,
                        fontWeight: '700',
                        fontSize: '0.95rem',
                        padding: '12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = packages[pkg].color; e.currentTarget.style.color = '#131722'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = `${packages[pkg].color}15`; e.currentTarget.style.color = packages[pkg].color; }}
                    >
                      Invest Now →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'investments' && (
            <div>
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
              <h2 style={{ marginBottom: '20px', fontSize: '1.8rem' }}>Transaction History</h2>
              <div style={{ background: 'var(--bg-main)', borderRadius: '8px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                  <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <tr>
                      <th style={{ padding: '15px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Date</th>
                      <th style={{ padding: '15px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Type</th>
                      <th style={{ padding: '15px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Amount</th>
                      <th style={{ padding: '15px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.transactions?.length > 0 ? (
                      dashboardData.transactions.map(tx => (
                        <tr key={tx._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '15px' }}>{new Date(tx.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '15px', textTransform: 'capitalize' }}>{tx.type} {tx.method ? `(${tx.method.toUpperCase()})` : ''}</td>
                          <td style={{ padding: '15px' }}>${tx.amount.toLocaleString()}</td>
                          <td style={{ padding: '15px' }}>
                            <span style={{ 
                              color: tx.status === 'completed' ? '#10b981' : tx.status === 'pending' ? '#f59e0b' : '#ef4444' 
                            }}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>No transactions found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && selectedPackage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2000, backdropFilter: 'blur(5px)', overflowY: 'auto', padding: '20px'
        }}>
          <div style={{
            background: '#11100b', padding: '40px', borderRadius: '24px',
            width: '100%', maxWidth: '500px', border: '1px solid #332d16', position: 'relative',
            fontFamily: 'Inter, sans-serif'
          }}>
            <button 
              onClick={() => setIsCheckoutOpen(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#888', fontSize: '1.5rem', cursor: 'pointer' }}
            >&times;</button>
            
            {/* Header section like image */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div style={{ border: '1px solid #f5a623', color: '#f5a623', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  B
                </div>
                <div>
                  <h2 style={{ color: 'white', margin: 0, fontSize: '1.4rem' }}>Pay with Crypto</h2>
                  <p style={{ color: '#f5a623', margin: 0, fontSize: '0.9rem', fontWeight: '600' }}>
                    {selectedPackage.name.toUpperCase()} — {selectedPackage.returns} Return
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCheckoutSubmit}>
              
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#888', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Enter Investment Amount
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#1a1811', border: '1px solid #332d16', borderRadius: '12px', padding: '0 15px' }}>
                  <span style={{ color: '#f5a623', fontSize: '1.2rem', fontWeight: 'bold' }}>$</span>
                  <input 
                    type="number" 
                    min={selectedPackage.min} 
                    max={selectedPackage.max}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    style={{
                      width: '100%', padding: '15px 10px', background: 'transparent', border: 'none',
                      color: 'white', outline: 'none', fontSize: '1.2rem', fontWeight: 'bold'
                    }}
                  />
                </div>
                <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '8px' }}>
                  Min: ${selectedPackage.min.toLocaleString()} - Max: ${selectedPackage.max.toLocaleString()}
                </p>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#888', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Select Crypto Network
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['usdt', 'btc', 'eth'].map(coin => (
                    <button
                      key={coin}
                      type="button"
                      onClick={() => setPaymentMethod(coin)}
                      style={{
                        flex: 1, padding: '12px 0', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                        background: paymentMethod === coin ? 'rgba(245, 166, 35, 0.1)' : 'transparent',
                        border: paymentMethod === coin ? '1px solid #f5a623' : '1px solid #332d16',
                        color: paymentMethod === coin ? '#f5a623' : '#888'
                      }}
                    >
                      {coin === 'usdt' ? 'USDT (TRC20)' : coin.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {walletAddresses && (
                <div style={{ marginBottom: '30px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', color: '#888', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Send To This Address
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#1a1811', border: '1px solid #332d16', borderRadius: '12px', padding: '15px' }}>
                    <div style={{ color: '#f5a623', marginRight: '15px' }}>💳</div>
                    <div style={{ flex: 1, color: '#f5a623', wordBreak: 'break-all', fontSize: '0.95rem', fontFamily: 'monospace' }}>
                      {walletAddresses[paymentMethod]}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { navigator.clipboard.writeText(walletAddresses[paymentMethod]); setCopied(true); setTimeout(()=>setCopied(false), 2000); }}
                      style={{ background: 'transparent', border: '1px solid #332d16', color: '#f5a623', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', marginLeft: '10px' }}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  
                  {paymentMethod === 'usdt' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px', color: '#888', fontSize: '0.85rem' }}>
                      <span style={{ color: '#f5a623' }}>⚠️</span> Only send USDT on the <strong style={{ color: '#f5a623' }}>TRC20 (TRON)</strong> network to this address
                    </div>
                  )}

                  <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '15px', marginTop: '15px', display: 'flex', gap: '10px' }}>
                    <span style={{ color: '#ef4444' }}>⚠️</span>
                    <p style={{ color: '#888', margin: 0, fontSize: '0.85rem' }}>
                      Sending on the wrong network will result in <strong style={{ color: '#ef4444' }}>permanent loss of funds</strong>.
                    </p>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#888', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Submit Your Payment Proof
                </label>
                
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '5px' }}>Transaction Hash (TX ID)</p>
                  <input 
                    type="text" 
                    value={txId}
                    onChange={(e) => setTxId(e.target.value)}
                    placeholder="e.g. 0xabc123..."
                    required
                    style={{
                      width: '100%', padding: '15px', borderRadius: '10px',
                      background: '#1a1811', border: '1px solid #332d16',
                      color: 'white', outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '5px' }}>Telegram Username or Email</p>
                  <input 
                    type="text" 
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="Where should we contact you?"
                    required
                    style={{
                      width: '100%', padding: '15px', borderRadius: '10px',
                      background: '#1a1811', border: '1px solid #332d16',
                      color: 'white', outline: 'none'
                    }}
                  />
                </div>
              </div>

              <button type="submit" style={{ 
                width: '100%', background: '#f5a623', color: '#11100b', 
                fontWeight: 'bold', fontSize: '1.1rem', padding: '16px', 
                border: 'none', borderRadius: '12px', cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(245, 166, 35, 0.2)', transition: 'all 0.2s'
              }}>
                Submit Payment Proof ✅
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
