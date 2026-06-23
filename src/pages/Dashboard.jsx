import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

// ── Live Investment Gains Card ───────────────────────────────────────────────
function InvestmentCard({ inv, packages }) {
  const pkgData = packages[inv.package] || {};
  const pct = parseFloat(pkgData.returns) || 0; // e.g. 10 for "10%"

  // Total gain the investor should earn over the full duration (30 days)
  const totalGain = (inv.amount * pct) / 100;
  const durationMs = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

  // How much has elapsed since the investment was created
  const startTime = new Date(inv.createdAt).getTime();
  const calcEarned = () => {
    if (inv.status !== 'active') return totalGain;
    const elapsed = Math.min(Date.now() - startTime, durationMs);
    return (totalGain * elapsed) / durationMs;
  };

  const [earned, setEarned] = useState(calcEarned);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (inv.status !== 'active') return;
    intervalRef.current = setInterval(() => {
      setEarned(calcEarned());
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [inv._id]);

  const progress = Math.min((earned / totalGain) * 100, 100);
  const elapsed = Date.now() - startTime;
  const daysLeft = Math.max(0, Math.ceil((durationMs - elapsed) / (1000 * 60 * 60 * 24)));

  return (
    <div style={{ background: 'var(--bg-main)', border: `1px solid ${inv.status === 'active' ? 'rgba(0,230,118,0.2)' : 'var(--border-color)'}`, borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Glow effect for active */}
      {inv.status === 'active' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #00e676, transparent)' }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{inv.package}</h3>
          <span style={{ color: '#f5a623', fontSize: '0.85rem', fontWeight: 'bold' }}>{pkgData.returns} monthly return</span>
        </div>
        <span style={{
          color: inv.status === 'active' ? '#10b981' : '#f59e0b',
          background: inv.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
          border: `1px solid ${inv.status === 'active' ? '#10b981' : '#f59e0b'}`,
          padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600', textTransform: 'capitalize'
        }}>{inv.status}</span>
      </div>

      {/* Principal */}
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Principal Invested</p>
      <p style={{ color: 'white', fontSize: '1.6rem', fontWeight: 'bold', marginBottom: '20px' }}>
        ${inv.amount.toLocaleString()}
      </p>

      {/* Live Gains */}
      <div style={{ background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '6px' }}>
          {inv.status === 'active' ? '⚡ Live Earnings' : '✅ Total Earned'}
        </p>
        <p style={{ color: '#00e676', fontSize: '2rem', fontWeight: '800', fontFamily: 'monospace', letterSpacing: '-1px' }}>
          +${earned.toFixed(4)}
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px' }}>
          of ${totalGain.toLocaleString(undefined, { maximumFractionDigits: 2 })} total return
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Progress</span>
          <span style={{ color: '#00e676', fontSize: '0.78rem', fontWeight: 'bold' }}>{progress.toFixed(2)}%</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '10px', width: `${progress}%`,
            background: 'linear-gradient(90deg, #00e676, #00b0ff)',
            transition: 'width 1s linear',
            boxShadow: '0 0 10px rgba(0,230,118,0.5)'
          }} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <span>📅 Started: {new Date(inv.createdAt).toLocaleDateString()}</span>
        {inv.status === 'active' && <span>⏳ {daysLeft}d left</span>}
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
  
  const packages = {
    'Cardano': { returns: '10%', min: 200, max: 500 },
    'Solana': { returns: '12%', min: 1000, max: 3000 },
    'Bronze': { returns: '15%', min: 5000, max: 8000 },
    'Platinum': { returns: '20%', min: 12000, max: 15000 },
    'Gold': { returns: '25%', min: 20000, max: 25000 },
    'Swift': { returns: '30%', min: 30000, max: 40000 }
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

  if (!user) return <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}>Loading dashboard...</div>;

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
        <aside style={{ width: '100%', maxWidth: '250px', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
          <button 
            onClick={() => setActiveTab('overview')}
            style={{ 
              background: activeTab === 'overview' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              color: activeTab === 'overview' ? 'var(--accent-blue)' : 'var(--text-primary)',
              border: 'none', padding: '15px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
              borderLeft: activeTab === 'overview' ? '3px solid var(--accent-blue)' : '3px solid transparent',
              transition: 'all 0.2s'
            }}>
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('invest')}
            style={{ 
              background: activeTab === 'invest' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              color: activeTab === 'invest' ? 'var(--accent-blue)' : 'var(--text-primary)',
              border: 'none', padding: '15px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
              borderLeft: activeTab === 'invest' ? '3px solid var(--accent-blue)' : '3px solid transparent',
              transition: 'all 0.2s'
            }}>
            New Investment
          </button>
          <button 
            onClick={() => setActiveTab('investments')}
            style={{ 
              background: activeTab === 'investments' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              color: activeTab === 'investments' ? 'var(--accent-blue)' : 'var(--text-primary)',
              border: 'none', padding: '15px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
              borderLeft: activeTab === 'investments' ? '3px solid var(--accent-blue)' : '3px solid transparent',
              transition: 'all 0.2s'
            }}>
            My Investments
          </button>
          <button 
            onClick={() => setActiveTab('transactions')}
            style={{ 
              background: activeTab === 'transactions' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              color: activeTab === 'transactions' ? 'var(--accent-blue)' : 'var(--text-primary)',
              border: 'none', padding: '15px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
              borderLeft: activeTab === 'transactions' ? '3px solid var(--accent-blue)' : '3px solid transparent',
              transition: 'all 0.2s'
            }}>
            Transactions
          </button>
          <button 
            onClick={() => setActiveTab('withdraw')}
            style={{ 
              background: activeTab === 'withdraw' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
              color: activeTab === 'withdraw' ? '#ef4444' : 'var(--text-primary)',
              border: 'none', padding: '15px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
              borderLeft: activeTab === 'withdraw' ? '3px solid #ef4444' : '3px solid transparent',
              transition: 'all 0.2s'
            }}>
            Withdraw Funds
          </button>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, minWidth: '300px', background: 'var(--bg-card)', borderRadius: '16px', padding: '30px', border: '1px solid var(--border-color)' }}>
          
          {activeTab === 'overview' && (
            <div>
              <h2 style={{ marginBottom: '20px', fontSize: '1.8rem' }}>Account Overview</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '10px' }}>Total Balance</p>
                  <h3 style={{ fontSize: '2rem', color: 'white' }}>${dashboardData.user?.balance?.toLocaleString() || '0.00'}</h3>
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
              <div style={{ background: 'rgba(129, 140, 248, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(129, 140, 248, 0.2)', marginBottom: '40px' }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: '#818cf8' }}>👑 Admin Activation</h3>
                <p style={{ margin: '0 0 15px 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Open this link in your browser to upgrade your account to Admin, then logout and log back in.</p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    readOnly
                    value={`https://novavest-backend.onrender.com/api/auth/make-me-admin/${user?.email}`}
                    style={{ flex: 1, background: 'rgba(129,140,248,0.1)', color: '#818cf8', padding: '10px 15px', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid rgba(129,140,248,0.3)', outline: 'none', fontFamily: 'monospace' }}
                  />
                  <button onClick={() => {
                    const link = `https://novavest-backend.onrender.com/api/auth/make-me-admin/${user?.email}`;
                    navigator.clipboard.writeText(link);
                    addToast('Admin link copied! Open it in your browser.', 'success');
                  }} style={{ background: '#818cf8', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    Copy Link
                  </button>
                  <a href={`https://novavest-backend.onrender.com/api/auth/make-me-admin/${user?.email}`} target="_blank" rel="noreferrer"
                    style={{ background: 'transparent', color: '#818cf8', border: '1px solid #818cf8', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', textDecoration: 'none' }}>
                    Open ↗
                  </a>
                </div>
              </div>
              
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
                  <div key={pkg} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <h3 style={{ fontSize: '1.2rem' }}>{pkg}</h3>
                      <span style={{ color: 'var(--accent-blue)', background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{packages[pkg].returns} Return</span>
                    </div>
                    <p style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px' }}>
                      ${packages[pkg].min.toLocaleString()} - ${packages[pkg].max.toLocaleString()}
                    </p>
                    <button onClick={() => handleInvest(pkg)} className="btn btn-outline btn-block" style={{ borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}>
                      Invest Now
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
              <div style={{ background: 'var(--bg-main)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
