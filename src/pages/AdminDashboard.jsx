import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function AdminDashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (!token || !savedUser) {
      navigate('/');
      return;
    }
    
    // In a real app, you would check if user.role === 'admin'
    // For this demo, we'll just let anyone who logs in see it for demonstration
    setUser(JSON.parse(savedUser));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Admin Nav */}
      <header className="navbar" style={{ background: '#1e1b4b', borderBottom: '1px solid rgba(99, 102, 241, 0.2)', padding: '15px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" className="logo">
            <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}></div>
            <span>Novavest Admin</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
             <span style={{ background: 'rgba(236, 72, 153, 0.2)', color: '#ec4899', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>ADMIN</span>
             <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>Logout</button>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <div className="container" style={{ display: 'flex', flex: 1, padding: '40px 20px', gap: '30px' }}>
        
        {/* Sidebar */}
        <aside style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            onClick={() => setActiveTab('users')}
            style={{ 
              background: activeTab === 'users' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              color: activeTab === 'users' ? '#818cf8' : 'var(--text-primary)',
              border: 'none', padding: '15px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
              borderLeft: activeTab === 'users' ? '3px solid #818cf8' : '3px solid transparent',
              transition: 'all 0.2s'
            }}>
            Manage Users
          </button>
          <button 
            onClick={() => setActiveTab('investments')}
            style={{ 
              background: activeTab === 'investments' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              color: activeTab === 'investments' ? '#818cf8' : 'var(--text-primary)',
              border: 'none', padding: '15px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
              borderLeft: activeTab === 'investments' ? '3px solid #818cf8' : '3px solid transparent',
              transition: 'all 0.2s'
            }}>
            Active Investments
          </button>
          <button 
            onClick={() => setActiveTab('deposits')}
            style={{ 
              background: activeTab === 'deposits' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              color: activeTab === 'deposits' ? '#818cf8' : 'var(--text-primary)',
              border: 'none', padding: '15px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
              borderLeft: activeTab === 'deposits' ? '3px solid #818cf8' : '3px solid transparent',
              transition: 'all 0.2s'
            }}>
            Pending Deposits
          </button>
          <button 
            onClick={() => setActiveTab('withdrawals')}
            style={{ 
              background: activeTab === 'withdrawals' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              color: activeTab === 'withdrawals' ? '#818cf8' : 'var(--text-primary)',
              border: 'none', padding: '15px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
              borderLeft: activeTab === 'withdrawals' ? '3px solid #818cf8' : '3px solid transparent',
              transition: 'all 0.2s'
            }}>
            Withdrawal Requests
          </button>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, background: 'var(--bg-card)', borderRadius: '16px', padding: '30px', border: '1px solid var(--border-color)' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
            <div style={{ background: 'var(--bg-main)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '5px' }}>Total Users</p>
              <h3 style={{ fontSize: '1.5rem', color: 'white' }}>124</h3>
            </div>
            <div style={{ background: 'var(--bg-main)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '5px' }}>Total Invested</p>
              <h3 style={{ fontSize: '1.5rem', color: '#818cf8' }}>$45,200</h3>
            </div>
            <div style={{ background: 'var(--bg-main)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '5px' }}>Pending Deposits</p>
              <h3 style={{ fontSize: '1.5rem', color: '#f59e0b' }}>3</h3>
            </div>
            <div style={{ background: 'var(--bg-main)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '5px' }}>Pending Withdrawals</p>
              <h3 style={{ fontSize: '1.5rem', color: '#ef4444' }}>1</h3>
            </div>
          </div>

          <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', textTransform: 'capitalize' }}>
            {activeTab.replace('-', ' ')}
          </h2>

          <div style={{ background: 'var(--bg-main)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                <tr>
                  <th style={{ padding: '15px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>User/Email</th>
                  <th style={{ padding: '15px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Details</th>
                  <th style={{ padding: '15px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Status</th>
                  <th style={{ padding: '15px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {/* Mock Data based on active tab */}
                {activeTab === 'users' && (
                  <tr>
                    <td style={{ padding: '15px', borderBottom: '1px solid var(--border-color)' }}>{user.email}</td>
                    <td style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Joined recently</td>
                    <td style={{ padding: '15px', borderBottom: '1px solid var(--border-color)' }}><span style={{ color: '#10b981' }}>Active</span></td>
                    <td style={{ padding: '15px', borderBottom: '1px solid var(--border-color)' }}>
                      <button style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Ban</button>
                    </td>
                  </tr>
                )}
                
                {activeTab === 'deposits' && (
                  <tr>
                    <td style={{ padding: '15px', borderBottom: '1px solid var(--border-color)' }}>investor@example.com</td>
                    <td style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', color: 'white' }}>$1,000 via BTC</td>
                    <td style={{ padding: '15px', borderBottom: '1px solid var(--border-color)' }}><span style={{ color: '#f59e0b' }}>Pending</span></td>
                    <td style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
                      <button style={{ background: '#10b981', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                      <button style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                    </td>
                  </tr>
                )}

                {(activeTab === 'investments' || activeTab === 'withdrawals') && (
                  <tr>
                    <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>No records to display.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
