import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

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
  const [paymentMethod, setPaymentMethod] = useState('btc');
  
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
          paymentMethod: paymentMethod
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Investment submitted securely.');
        setIsCheckoutOpen(false);
        fetchDashboardData(token);
        setActiveTab('transactions');
      } else {
        alert(data.message || 'Error submitting investment');
      }
    } catch (error) {
      alert('Network error during checkout');
    }
  };

  if (!user || isLoading) return <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}>Loading dashboard...</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Dashboard Nav */}
      <header className="navbar" style={{ background: 'rgba(11, 17, 32, 1)', borderBottom: '1px solid var(--border-color)', padding: '15px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" className="logo">
            <div className="logo-icon"></div>
            <span>Novavest Dashboard</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
             <span style={{ color: 'var(--text-secondary)' }}>Welcome, <span style={{ color: 'white' }}>{user.email.split('@')[0]}</span></span>
             <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>Logout</button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="container" style={{ display: 'flex', flex: 1, padding: '40px 20px', gap: '30px' }}>
        
        {/* Sidebar */}
        <aside style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, background: 'var(--bg-card)', borderRadius: '16px', padding: '30px', border: '1px solid var(--border-color)' }}>
          
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
              
              <div style={{ background: 'var(--bg-main)', padding: '30px', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
                <h3 style={{ marginBottom: '15px' }}>Ready to grow your portfolio?</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Explore our high-yield investment packages and start earning today.</p>
                <button onClick={() => setActiveTab('invest')} className="btn btn-primary">View Packages</button>
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
              <h2 style={{ marginBottom: '20px', fontSize: '1.8rem' }}>My Investments</h2>
              {dashboardData.investments?.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  {dashboardData.investments.map(inv => (
                    <div key={inv._id} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <h3 style={{ fontSize: '1.2rem' }}>{inv.package}</h3>
                        <span style={{ color: inv.status === 'active' ? '#10b981' : '#f59e0b', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', textTransform: 'capitalize' }}>{inv.status}</span>
                      </div>
                      <p style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '10px' }}>
                        ${inv.amount.toLocaleString()}
                      </p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Expected Return: {inv.expectedReturn}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '10px' }}>Date: {new Date(inv.createdAt).toLocaleDateString()}</p>
                    </div>
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
          background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2000, backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'var(--bg-card)', padding: '40px', borderRadius: '16px',
            width: '100%', maxWidth: '450px', border: '1px solid var(--border-color)', position: 'relative'
          }}>
            <button 
              onClick={() => setIsCheckoutOpen(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}
            >&times;</button>
            
            <h2 style={{ marginBottom: '10px' }}>Checkout</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Complete your investment securely.</p>
            
            <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '8px', marginBottom: '25px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Package:</span>
                <strong style={{ color: 'white' }}>{selectedPackage.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Expected Return:</span>
                <strong style={{ color: '#10b981' }}>{selectedPackage.returns}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Limits:</span>
                <strong style={{ color: 'white' }}>${selectedPackage.min.toLocaleString()} - ${selectedPackage.max.toLocaleString()}</strong>
              </div>
            </div>

            <form onSubmit={handleCheckoutSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Investment Amount (USD)</label>
                <input 
                  type="number" 
                  min={selectedPackage.min} 
                  max={selectedPackage.max}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '15px', borderRadius: '8px',
                    background: 'var(--bg-main)', border: '1px solid var(--accent-blue)',
                    color: 'white', outline: 'none', fontSize: '1.1rem'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Select Payment Method</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{
                    width: '100%', padding: '15px', borderRadius: '8px',
                    background: 'var(--bg-main)', border: '1px solid var(--border-color)',
                    color: 'white', outline: 'none', fontSize: '1rem', appearance: 'none'
                  }}>
                  <option value="btc">Bitcoin (BTC)</option>
                  <option value="eth">Ethereum (ETH)</option>
                  <option value="usdt">Tether (USDT TRC20)</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary btn-block" style={{ fontSize: '1.1rem', padding: '15px' }}>
                Confirm & Proceed to Payment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
