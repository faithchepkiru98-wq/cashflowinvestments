import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// ── Toast Notification ──────────────────────────────────────────────────────
function Toast({ toasts, removeToast }) {
  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'success' ? '#064e3b' : t.type === 'error' ? '#7f1d1d' : '#1e3a5f',
          border: `1px solid ${t.type === 'success' ? '#10b981' : t.type === 'error' ? '#ef4444' : '#3b82f6'}`,
          color: 'white', padding: '14px 20px', borderRadius: '10px', minWidth: '280px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px',
          animation: 'slideIn 0.3s ease'
        }}>
          <span style={{ fontSize: '0.9rem' }}>
            {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'} {t.message}
          </span>
          <button onClick={() => removeToast(t.id)} style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
        </div>
      ))}
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────────────────────
function AnimatedStatCard({ label, value, prefix = '', color = '#00e676', bg, border, icon }) {
  const [display, setDisplay] = React.useState(0);
  const prevRef = React.useRef(0);
  React.useEffect(() => {
    const numericStr = String(value).replace(/[^0-9.]/g, '');
    const target = Number(numericStr) || 0;
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

  const displayVal = Number.isInteger(Number(String(value).replace(/[^0-9.]/g, ''))) 
    ? Math.round(display).toLocaleString() 
    : display.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <div style={{ 
      background: 'rgba(255, 255, 255, 0.02)', 
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      padding: '24px', 
      borderRadius: '16px', 
      border: '1px solid rgba(255, 255, 255, 0.05)', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '20px',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'default'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = `0 8px 24px ${color ? color.replace(')', ', 0.15)').replace('rgb', 'rgba') : 'rgba(255,255,255,0.05)'}`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      <div style={{ 
        fontSize: '1.8rem', 
        width: '60px', 
        height: '60px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: color ? `${color}15` : 'rgba(255,255,255,0.05)',
        borderRadius: '16px'
      }}>{icon}</div>
      <div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>{label}</p>
        <h3 style={{ fontSize: '1.6rem', color: 'white', margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: '500' }}>{prefix}{displayVal}</h3>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ 
      background: 'rgba(255, 255, 255, 0.02)', 
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      padding: '24px', 
      borderRadius: '16px', 
      border: '1px solid rgba(255, 255, 255, 0.05)', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '20px',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'default'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = `0 8px 24px ${color ? color.replace(')', ', 0.15)').replace('rgb', 'rgba') : 'rgba(255,255,255,0.05)'}`;
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = `0 12px 32px ${color ? color.replace(')', ', 0.15)').replace('rgb', 'rgba') : 'rgba(0,0,0,0.2)'}`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      <div style={{ 
        fontSize: '1.8rem', 
        width: '60px', 
        height: '60px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: color ? `${color}15` : 'rgba(255,255,255,0.05)',
        borderRadius: '16px'
      }}>{icon}</div>
      <div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>{label}</p>
        <h3 style={{ fontSize: '1.6rem', color: 'white', margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: '500' }}>{value}</h3>
      </div>
    </div>
  );
}

// ── Badge ───────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const colors = {
    pending:   { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
    completed: { bg: 'rgba(16,185,129,0.15)',  text: '#10b981' },
    active:    { bg: 'rgba(16,185,129,0.15)',  text: '#10b981' },
    rejected:  { bg: 'rgba(239,68,68,0.15)',   text: '#ef4444' },
    admin:     { bg: 'rgba(129,140,248,0.15)', text: '#818cf8' },
    user:      { bg: 'rgba(16,185,129,0.15)',  text: '#10b981' },
  };
  const c = colors[status] || colors.user;
  return (
    <span style={{ background: c.bg, color: c.text, padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600', textTransform: 'uppercase' }}>
      {status}
    </span>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
function AdminDashboard() {
  const [user, setUser]           = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [adminData, setAdminData] = useState({ users: [], investments: [], transactions: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts]       = useState([]);
  const [editUser, setEditUser]   = useState(null);
  const [editBalance, setEditBalance] = useState('');
  const [settings, setSettings]   = useState(null);
  const [settingsDraft, setSettingsDraft] = useState({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [broadcasts, setBroadcasts] = useState([]);
  const [newBroadcast, setNewBroadcast] = useState({ title: '', message: '', type: 'info' });
  const [viewingDocument, setViewingDocument] = useState(null);
  const [chatUsers, setChatUsers] = useState([]);
  const [activeChatUserId, setActiveChatUserId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = React.useRef(null);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Toast helpers
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const fetchAdminData = useCallback(async (token) => {
    try {
      const [dataRes, settingsRes, broadcastRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/settings`,  { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/broadcasts`,      { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      if (dataRes.ok) setAdminData(await dataRes.json());
      else if (dataRes.status === 403) { addToast('Admin access required', 'error'); navigate('/'); }
      if (settingsRes.ok) {
        const s = await settingsRes.json();
        setSettings(s);
        setSettingsDraft(s);
      }
      if (broadcastRes.ok) setBroadcasts(await broadcastRes.json());
    } catch { addToast('Failed to load admin data', 'error'); }
    finally { setIsLoading(false); }
  }, [API_URL, navigate]);

  useEffect(() => {
    const token     = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (!token || !savedUser) { navigate('/'); return; }
    const parsed = JSON.parse(savedUser);
    if (parsed.role !== 'admin') { navigate('/dashboard'); return; }
    setUser(parsed);
    fetchAdminData(token);
  }, [navigate, fetchAdminData]);

  const handleTransaction = async (txId, action) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/transaction/${txId}/${action}`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message || `Transaction ${action}d`, 'success');
        fetchAdminData(token);
      } else addToast(data.message || 'Action failed', 'error');
    } catch { addToast('Network error', 'error'); }
  };

  const handleUpdateBalance = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/user/${editUser._id}/balance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ balance: Number(editBalance) })
      });
      const data = await res.json();
      if (res.ok) { addToast('Balance updated!', 'success'); setEditUser(null); fetchAdminData(token); }
      else addToast(data.message || 'Failed to update', 'error');
    } catch { addToast('Network error', 'error'); }
  };

  const handleUpdateRole = async (userId, newRole) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/user/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) { addToast(`Role updated to ${newRole}`, 'success'); fetchAdminData(token); }
      else addToast('Failed to update role', 'error');
    } catch { addToast('Network error', 'error'); }
  };

  const handleUpdateKyc = async (userId, status) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/user/${userId}/kyc`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) { addToast(`KYC ${status}`, 'success'); fetchAdminData(token); }
      else addToast('Failed to update KYC', 'error');
    } catch { addToast('Network error', 'error'); }
  };

  const handleAddBroadcast = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newBroadcast)
      });
      if (res.ok) { addToast('Broadcast sent!', 'success'); setNewBroadcast({ title: '', message: '', type: 'info' }); fetchAdminData(token); }
      else addToast('Failed to send broadcast', 'error');
    } catch { addToast('Network error', 'error'); }
  };

  const handleDeleteBroadcast = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/broadcast/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { addToast('Broadcast deleted', 'success'); fetchAdminData(token); }
      else addToast('Failed to delete broadcast', 'error');
    } catch { addToast('Network error', 'error'); }
  };

  const handleSaveSettings = async () => {
    const token = localStorage.getItem('token');
    setIsSavingSettings(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(settingsDraft)
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(data.settings);
        setSettingsDraft(data.settings);
        addToast('Settings saved successfully!', 'success');
      } else {
        addToast(data.message || 'Failed to save settings', 'error');
      }
    } catch { addToast('Network error', 'error'); }
    finally { setIsSavingSettings(false); }
  };

  const fetchChatUsers = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/admin/chat/users`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setChatUsers(await res.json());
  };

  const fetchChatMessages = async (userId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/admin/chat/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setChatMessages(await res.json());
  };

  useEffect(() => {
    if (activeTab === 'support') {
      fetchChatUsers();
      if (activeChatUserId) fetchChatMessages(activeChatUserId);
      const interval = setInterval(() => {
        fetchChatUsers();
        if (activeChatUserId) fetchChatMessages(activeChatUserId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, activeChatUserId]);

  useEffect(() => {
    if (activeTab === 'support' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const sendAdminMessage = async (e, directMessage = null) => {
    if (e) e.preventDefault();
    const textToSend = directMessage || chatInput;
    if (!textToSend.trim() || !activeChatUserId) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/admin/chat/${activeChatUserId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ text: textToSend })
    });
    if (res.ok) {
      const newMsg = await res.json();
      setChatMessages(prev => [...prev, newMsg]);
      if (!directMessage) setChatInput('');
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  if (isLoading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '1.2rem' }}>
      Loading admin panel...
    </div>
  );

  const deposits     = adminData.transactions.filter(tx => tx.type === 'deposit');
  const withdrawals  = adminData.transactions.filter(tx => tx.type === 'withdrawal');
  const pendingDeps  = deposits.filter(tx => tx.status === 'pending').length;
  const pendingWithd = withdrawals.filter(tx => tx.status === 'pending').length;

  const navItems = [
    { key: 'overview',    label: '📊 Overview' },
    { key: 'deposits',    label: '💰 Deposits',    badge: pendingDeps },
    { key: 'withdrawals', label: '📤 Withdrawals', badge: pendingWithd },
    { key: 'investments', label: '📈 Investments' },
    { key: 'users',       label: '👥 Users' },
    { key: 'support',     label: '💬 Support Chat' },
    { key: 'broadcasts',  label: '📢 Broadcasts' },
    { key: 'settings',    label: '⚙️ Settings' },
  ];

  const thStyle = { padding: '14px 16px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.88rem', verticalAlign: 'middle', background: 'transparent', whiteSpace: 'nowrap' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      <style>{`@keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <header style={{ 
        background: 'rgba(15, 20, 30, 0.7)', 
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)', 
        padding: '16px 0', 
        position: 'sticky', 
        top: 0, 
        zIndex: 100 
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" className="logo">
            <div className="logo-icon" style={{ background: 'linear-gradient(135deg,#00e676,#f5a623)' }}></div>
            <span>Cashflowvest <span style={{ color: '#f5a623', fontSize: '0.8rem' }}>ADMIN</span></span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Logged in as <strong style={{ color: 'white' }}>{user?.email}</strong>
            </span>
            <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Logout</button>
          </div>
        </div>
      </header>

      <div className="container" style={{ display: 'flex', flex: 1, marginTop: '80px', paddingBottom: '40px', gap: '25px', flexWrap: 'wrap' }}>

        {/* Sidebar */}
        <aside style={{ width: '100%', maxWidth: '220px', flexShrink: 0, position: 'sticky', top: '100px', alignSelf: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {navItems.map(item => (
              <button key={item.key} onClick={() => setActiveTab(item.key)} style={{
                background: activeTab === item.key ? 'rgba(0,230,118,0.1)' : 'transparent',
                color: activeTab === item.key ? '#00e676' : 'var(--text-secondary)',
                border: 'none', padding: '14px 18px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontWeight: activeTab === item.key ? '600' : '500',
                boxShadow: activeTab === item.key ? 'inset 3px 0 0 #00e676, 0 4px 12px rgba(0,0,0,0.1)' : 'none'
              }}>
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, minWidth: '300px' }}>
          {/* Stats Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
            <div style={{flex: '1 1 200px'}}><AnimatedStatCard label="Total Users"        value={adminData.users.length}                        color="white"    icon="👥" /></div>
            <div style={{flex: '1 1 200px'}}><AnimatedStatCard label="Total Invested"     value={deposits.filter(d=>d.status==='completed').reduce((s,d)=>s+d.amount,0)} prefix="$" color="#00e676" icon="💰" /></div>
            <div style={{flex: '1 1 200px'}}><AnimatedStatCard label="Pending Deposits"   value={pendingDeps}                                   color="#f59e0b"  icon="⏳" /></div>
            <div style={{flex: '1 1 200px'}}><AnimatedStatCard label="Pending Withdrawals" value={pendingWithd}                                 color="#ef4444"  icon="📤" /></div>
          </div>

          {/* Content Card */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 25px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
                {navItems.find(n => n.key === activeTab)?.label}
              </h2>
              <button onClick={() => fetchAdminData(localStorage.getItem('token'))} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                🔄 Refresh
              </button>
            </div>

            {/* Table-based tabs: Deposits, Withdrawals, Investments, Users */}
            {activeTab !== 'settings' && activeTab !== 'broadcasts' && (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: '750px', borderCollapse: 'collapse', textAlign: 'left' }}>
                {/* ── DEPOSITS ── */}
                {activeTab === 'deposits' && (<>
                  <thead><tr>
                    <th style={thStyle}>User</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Method</th>
                    <th style={thStyle}>TX Hash</th>
                    <th style={thStyle}>Contact</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {deposits.length === 0 ? (
                      <tr><td colSpan="8" style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No deposits yet.</td></tr>
                    ) : deposits.map(tx => (
                      <tr key={tx._id} style={{ transition: 'background 0.15s' }}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: '500', color: 'white' }}>{tx.userId?.email || '—'}</div>
                        </td>
                        <td style={{ ...tdStyle, color: '#00e676', fontWeight: '700', fontSize: '1rem' }}>${tx.amount?.toLocaleString()}</td>
                        <td style={tdStyle}><span style={{ textTransform: 'uppercase', color: '#f5a623', fontWeight: '600' }}>{tx.method || '—'}</span></td>
                        <td style={tdStyle}>
                          {tx.txId ? (
                            <span style={{ fontFamily: 'monospace', color: '#9ca3af', fontSize: '0.8rem' }} title={tx.txId}>
                              {tx.txId.slice(0, 14)}...
                            </span>
                          ) : <span style={{ color: '#555' }}>—</span>}
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{tx.contactInfo || '—'}</td>
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(tx.createdAt).toLocaleDateString()}</td>
                        <td style={tdStyle}><Badge status={tx.status} /></td>
                        <td style={tdStyle}>
                          {tx.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleTransaction(tx._id, 'approve')} style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid #10b981', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                                ✓ Approve
                              </button>
                              <button onClick={() => handleTransaction(tx._id, 'reject')} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid #ef4444', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                                ✗ Reject
                              </button>
                            </div>
                          )}
                          {tx.status !== 'pending' && <span style={{ color: '#555', fontSize: '0.85rem' }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>)}

                {/* ── WITHDRAWALS ── */}
                {activeTab === 'withdrawals' && (<>
                  <thead><tr>
                    <th style={thStyle}>User</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Method</th>
                    <th style={thStyle}>Wallet Address</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {withdrawals.length === 0 ? (
                      <tr><td colSpan="7" style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No withdrawal requests yet.</td></tr>
                    ) : withdrawals.map(tx => (
                      <tr key={tx._id}>
                        <td style={tdStyle}><div style={{ fontWeight: '500', color: 'white' }}>{tx.userId?.email || '—'}</div></td>
                        <td style={{ ...tdStyle, color: '#ef4444', fontWeight: '700', fontSize: '1rem' }}>${tx.amount?.toLocaleString()}</td>
                        <td style={tdStyle}><span style={{ textTransform: 'uppercase', color: '#f5a623', fontWeight: '600' }}>{tx.method || '—'}</span></td>
                        <td style={tdStyle}>
                          <span style={{ fontFamily: 'monospace', color: '#9ca3af', fontSize: '0.8rem' }}>
                            {tx.walletAddress ? `${tx.walletAddress.slice(0, 20)}...` : '—'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(tx.createdAt).toLocaleDateString()}</td>
                        <td style={tdStyle}><Badge status={tx.status} /></td>
                        <td style={tdStyle}>
                          {tx.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleTransaction(tx._id, 'approve')} style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid #10b981', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                                ✓ Approve
                              </button>
                              <button onClick={() => handleTransaction(tx._id, 'reject')} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid #ef4444', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                                ✗ Reject
                              </button>
                            </div>
                          )}
                          {tx.status !== 'pending' && <span style={{ color: '#555', fontSize: '0.85rem' }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>)}

                {/* ── INVESTMENTS ── */}
                {activeTab === 'investments' && (<>
                  <thead><tr>
                    <th style={thStyle}>User</th>
                    <th style={thStyle}>Package</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Expected Return</th>
                    <th style={thStyle}>Ends At</th>
                    <th style={thStyle}>Status</th>
                  </tr></thead>
                  <tbody>
                    {adminData.investments.length === 0 ? (
                      <tr><td colSpan="6" style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No investments yet.</td></tr>
                    ) : adminData.investments.map(inv => (
                      <tr key={inv._id}>
                        <td style={tdStyle}><div style={{ fontWeight: '500', color: 'white' }}>{inv.userId?.email || '—'}</div></td>
                        <td style={{ ...tdStyle, color: '#f5a623', fontWeight: '600' }}>{inv.package}</td>
                        <td style={{ ...tdStyle, color: 'white', fontWeight: '700' }}>${inv.amount?.toLocaleString()}</td>
                        <td style={{ ...tdStyle, color: '#00e676' }}>{inv.expectedReturn}</td>
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {inv.endsAt ? new Date(inv.endsAt).toLocaleString() : '—'}
                        </td>
                        <td style={tdStyle}><Badge status={inv.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </>)}

                {/* ── USERS ── */}
                {activeTab === 'users' && (<>
                  <thead><tr>
                    <th style={{...thStyle, width: '15%'}}>Name</th>
                    <th style={{...thStyle, width: '20%'}}>Email</th>
                    <th style={{...thStyle, width: '15%'}}>Phone</th>
                    <th style={{...thStyle, width: '10%'}}>Balance</th>
                    <th style={{...thStyle, width: '10%'}}>Role</th>
                    <th style={{...thStyle, width: '10%'}}>KYC</th>
                    <th style={{...thStyle, width: '10%'}}>Joined</th>
                    <th style={{...thStyle, width: '10%'}}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {adminData.users.length === 0 ? (
                      <tr><td colSpan="8" style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No users yet.</td></tr>
                    ) : adminData.users.map(u => (
                      <tr key={u._id}>
                        <td style={{ ...tdStyle, fontWeight: '500', color: 'white' }}>{u.name || '—'}</td>
                        <td style={tdStyle}>{u.email}</td>
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.phone || '—'}</td>
                        <td style={{ ...tdStyle, color: '#00e676', fontWeight: '600' }}>${(u.balance || 0).toLocaleString()}</td>
                        <td style={tdStyle}><Badge status={u.role} /></td>
                        <td style={tdStyle}>
                          <span style={{ color: u.kycStatus === 'approved' ? '#00e676' : u.kycStatus === 'pending' ? '#f5a623' : u.kycStatus === 'rejected' ? '#ef4444' : '#9ca3af', fontSize: '0.85rem', fontWeight: 'bold' }}>
                            {u.kycStatus || 'none'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td style={tdStyle}>
                          <div style={{display:'flex', gap:'5px', flexWrap:'wrap'}}>
                            <button onClick={() => { setEditUser(u); setEditBalance(u.balance || 0); }} style={{ background: 'rgba(245,166,35,0.15)', color: '#f5a623', border: '1px solid #f5a623', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                              ✏️ Edit Balance
                            </button>
                            {u.role === 'user' ? (
                              <button onClick={() => handleUpdateRole(u._id, 'admin')} style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8', border: '1px solid #818cf8', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                👑 Make Admin
                              </button>
                            ) : (
                              <button onClick={() => handleUpdateRole(u._id, 'user')} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid #ef4444', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                ⬇️ Revoke Admin
                              </button>
                            )}
                            {u.kycDocument && (
                              <>
                                <button onClick={() => setViewingDocument(u.kycDocument)} style={{ background: 'rgba(0,176,255,0.15)', color: '#00b0ff', border: '1px solid #00b0ff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                  📄 View ID
                                </button>
                                {u.kycStatus !== 'approved' && (
                                  <button onClick={() => handleUpdateKyc(u._id, 'approved')} style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid #10b981', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                    ✅ Approve KYC
                                  </button>
                                )}
                                {u.kycStatus === 'approved' && (
                                  <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid #10b981', padding: '5px 10px', borderRadius: '6px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                    ✅ Already Approved
                                  </span>
                                )}
                                {u.kycStatus !== 'rejected' && u.kycStatus !== 'approved' && (
                                  <button onClick={() => handleUpdateKyc(u._id, 'rejected')} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid #ef4444', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                    ❌ Reject KYC
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>)}
              </table>
            </div>
            )}

            {/* ── SUPPORT TAB ── */}
            {activeTab === 'support' && (
              <div style={{ display: 'flex', height: '600px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <div style={{ width: '30%', borderRight: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Outfit, sans-serif' }}>Conversations</h2>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {chatUsers.map(u => (
                      <div key={u._id} onClick={() => setActiveChatUserId(u._id)} style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', background: activeChatUserId === u._id ? 'rgba(245,166,35,0.1)' : 'transparent', borderLeft: activeChatUserId === u._id ? '3px solid #f5a623' : '3px solid transparent' }}>
                        <div style={{ fontWeight: '600' }}>{u.name || u.email.split('@')[0]}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                      </div>
                    ))}
                    {chatUsers.length === 0 && <div style={{ padding: '20px', color: 'var(--text-secondary)', textAlign: 'center' }}>No active chats</div>}
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {activeChatUserId ? (
                    <>
                      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                          {(chatUsers.find(u => u._id === activeChatUserId)?.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <h2 style={{ margin: 0, fontSize: '1rem', fontFamily: 'Outfit, sans-serif' }}>{chatUsers.find(u => u._id === activeChatUserId)?.name || chatUsers.find(u => u._id === activeChatUserId)?.email?.split('@')[0]}</h2>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{chatUsers.find(u => u._id === activeChatUserId)?.email}</p>
                        </div>
                      </div>
                      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {chatMessages.map(msg => (
                          <div key={msg._id} style={{ alignSelf: msg.isAdmin ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                            <div style={{ background: msg.isAdmin ? 'rgba(0,176,255,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${msg.isAdmin ? 'rgba(0,176,255,0.2)' : 'rgba(255,255,255,0.1)'}`, padding: '12px 16px', borderRadius: msg.isAdmin ? '16px 16px 4px 16px' : '16px 16px 16px 4px', fontSize: '0.95rem', color: 'white' }}>
                              {msg.text}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', textAlign: msg.isAdmin ? 'right' : 'left', display: 'flex', alignItems: 'center', justifyContent: msg.isAdmin ? 'flex-end' : 'flex-start', gap: '4px' }}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {msg.isAdmin && <span style={{ color: '#00b0ff', fontSize: '0.75rem', letterSpacing: '-2px' }}>✓✓</span>}
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                      
                      {/* Admin Quick Replies */}
                      <div style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <style>{`.quick-reply-scroll::-webkit-scrollbar { display: none; }`}</style>
                        <div className="quick-reply-scroll" style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                          {["Hello! How can I help you?", "Your withdrawal is being processed.", "Please complete your KYC verification.", "Thank you for your patience."].map((msg, i) => (
                            <button 
                              key={i} 
                              onClick={() => sendAdminMessage(null, msg)}
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '16px', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                            >
                              {msg}
                            </button>
                          ))}
                        </div>
                      </div>

                      <form onSubmit={sendAdminMessage} style={{ padding: '15px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
                        <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a reply..." style={{ flex: 1, background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 16px', color: 'white', outline: 'none' }} />
                        <button type="submit" disabled={!chatInput.trim()} style={{ background: '#f5a623', color: '#09090b', border: 'none', padding: '0 20px', borderRadius: '12px', fontWeight: 'bold', cursor: chatInput.trim() ? 'pointer' : 'not-allowed' }}>Reply</button>
                      </form>
                    </>
                  ) : (
                    <div style={{ margin: 'auto', color: 'var(--text-secondary)' }}>Select a conversation to start chatting</div>
                  )}
                </div>
              </div>
            )}

            {/* ── BROADCASTS TAB ── */}
            {activeTab === 'broadcasts' && (
            <div style={{ padding: '25px' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: '1.3rem' }}>📢 Send Broadcast</h2>
              <form onSubmit={handleAddBroadcast} style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '30px' }}>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <input type="text" placeholder="Broadcast Title" required value={newBroadcast.title} onChange={e => setNewBroadcast({...newBroadcast, title: e.target.value})} style={{ flex: 2, padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }} />
                  <select value={newBroadcast.type} onChange={e => setNewBroadcast({...newBroadcast, type: e.target.value})} style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }}>
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                  </select>
                </div>
                <textarea placeholder="Broadcast Message..." required value={newBroadcast.message} onChange={e => setNewBroadcast({...newBroadcast, message: e.target.value})} style={{ width: '100%', height: '80px', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', marginBottom: '15px', resize: 'none' }} />
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Send Broadcast to All Users</button>
              </form>

              <h2 style={{ margin: '0 0 20px', fontSize: '1.3rem' }}>Recent Broadcasts</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {broadcasts.map(b => (
                  <div key={b._id} style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px', fontSize: '1.1rem', color: b.type === 'success' ? '#00e676' : b.type === 'warning' ? '#f5a623' : '#00b0ff' }}>{b.title}</h3>
                      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{b.message}</p>
                    </div>
                    <button onClick={() => handleDeleteBroadcast(b._id)} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
                  </div>
                ))}
                {broadcasts.length === 0 && <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No recent broadcasts.</p>}
              </div>
            </div>
            )}

            {/* ── SETTINGS TAB ── */}
            {activeTab === 'settings' && (
            <div style={{ padding: '25px' }}>
              <h2 style={{ margin: '0 0 6px', fontSize: '1.3rem' }}>⚙️ Platform Settings</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '0.88rem' }}>
                Changes take effect immediately for all users — no server restart needed.<br />
                To make changes permanent across restarts, update the corresponding environment variable in Render.
              </p>

              {/* Crypto Wallet Addresses */}
              <section style={{ background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', padding: '24px', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#f5a623' }}>🔑 Crypto Deposit Addresses</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '20px' }}>These are the addresses shown to users when they make a deposit. Set via <code style={{color:'#818cf8'}}>BTC_WALLET</code>, <code style={{color:'#818cf8'}}>ETH_WALLET</code>, <code style={{color:'#818cf8'}}>USDT_WALLET</code> env vars.</p>
                {[
                  { key: 'btc',  label: '₿ Bitcoin (BTC)',   placeholder: 'bc1q... or 1... or 3...',   envVar: 'BTC_WALLET'  },
                  { key: 'eth',  label: '⬡ Ethereum (ETH)',  placeholder: '0x...',                     envVar: 'ETH_WALLET'  },
                  { key: 'usdt', label: '₮ USDT (TRC20)',    placeholder: 'T...',                      envVar: 'USDT_WALLET' },
                  { key: 'bank', label: '🏦 Bank Details',   placeholder: 'Account name, number, SWIFT…', envVar: 'BANK_DETAILS' },
                ].map(({ key, label, placeholder, envVar }) => (
                  <div key={key} style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '7px' }}>
                      <span style={{ color: 'white', fontWeight: '600', fontSize: '0.88rem' }}>{label}</span>
                      <code style={{ color: '#555', fontSize: '0.72rem' }}>env: {envVar}</code>
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id={`setting-${key}`}
                        type="text"
                        value={settingsDraft[key] || ''}
                        onChange={e => setSettingsDraft(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={placeholder}
                        style={{ flex: 1, padding: '11px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', outline: 'none', fontFamily: 'monospace', fontSize: '0.88rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(settingsDraft[key] || ''); addToast(`${label} address copied!`, 'info'); }}
                        title="Copy to clipboard"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '8px', padding: '0 12px', cursor: 'pointer', fontSize: '1rem' }}
                      >📋</button>
                    </div>
                    {settings && settings[key] !== settingsDraft[key] && (
                      <p style={{ color: '#f59e0b', fontSize: '0.75rem', marginTop: '4px' }}>⚠️ Unsaved change</p>
                    )}
                  </div>
                ))}
              </section>

              {/* General Settings */}
              <section style={{ background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', padding: '24px', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#00b0ff' }}>🌐 General Settings</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '20px' }}>Platform-wide configuration.</p>
                {[
                  { key: 'siteName',     label: 'Site Name',             type: 'text',   placeholder: 'Cashflowvest',      envVar: 'SITE_NAME'     },
                  { key: 'supportEmail', label: 'Support Email',         type: 'email',  placeholder: 'support@example.com', envVar: 'SUPPORT_EMAIL' },
                  { key: 'minDeposit',   label: 'Min Deposit (USD)',     type: 'number', placeholder: '200',               envVar: 'MIN_DEPOSIT'   },
                  { key: 'minWithdraw',  label: 'Min Withdrawal (USD)',  type: 'number', placeholder: '50',                envVar: 'MIN_WITHDRAW'  },
                  { key: 'whatsapp',     label: 'WhatsApp Link',         type: 'text',   placeholder: 'https://wa.me/...', envVar: 'WHATSAPP'      },
                  { key: 'telegram',     label: 'Telegram Link',         type: 'text',   placeholder: 'https://t.me/...',  envVar: 'TELEGRAM'      },
                ].map(({ key, label, type, placeholder, envVar }) => (
                  <div key={key} style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '7px' }}>
                      <span style={{ color: 'white', fontWeight: '600', fontSize: '0.88rem' }}>{label}</span>
                      <code style={{ color: '#555', fontSize: '0.72rem' }}>env: {envVar}</code>
                    </label>
                    <input
                      id={`setting-${key}`}
                      type={type}
                      value={settingsDraft[key] !== undefined ? settingsDraft[key] : ''}
                      onChange={e => setSettingsDraft(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    />
                    {settings && String(settings[key]) !== String(settingsDraft[key]) && (
                      <p style={{ color: '#f59e0b', fontSize: '0.75rem', marginTop: '4px' }}>⚠️ Unsaved change</p>
                    )}
                  </div>
                ))}
              </section>

              {/* Env Var Reference */}
              <section style={{ background: 'rgba(129,140,248,0.05)', borderRadius: '14px', border: '1px solid rgba(129,140,248,0.2)', padding: '20px', marginBottom: '25px' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '0.95rem', color: '#818cf8' }}>📖 Environment Variable Reference</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '12px' }}>Set these in your Render dashboard under <strong style={{color:'white'}}>Environment → Environment Variables</strong> for permanent storage.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
                  {[
                    ['BTC_WALLET',    'Bitcoin deposit address'],
                    ['ETH_WALLET',    'Ethereum deposit address'],
                    ['USDT_WALLET',   'USDT (TRC20) deposit address'],
                    ['BANK_DETAILS',  'Bank transfer instructions'],
                    ['SITE_NAME',     'Platform display name'],
                    ['SUPPORT_EMAIL', 'Admin / support email shown to users'],
                    ['MIN_DEPOSIT',   'Minimum deposit in USD'],
                    ['MIN_WITHDRAW',  'Minimum withdrawal in USD'],
                    ['WHATSAPP',      'WhatsApp Contact Link'],
                    ['TELEGRAM',      'Telegram Contact Link'],
                  ].map(([name, desc]) => (
                    <div key={name} style={{ background: 'var(--bg-main)', borderRadius: '8px', padding: '10px 14px' }}>
                      <code style={{ color: '#818cf8', fontSize: '0.82rem', fontWeight: '700' }}>{name}</code>
                      <p style={{ color: 'var(--text-secondary)', margin: '3px 0 0', fontSize: '0.78rem' }}>{desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Save / Reset */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  id="save-settings-btn"
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  style={{ flex: 1, background: '#00e676', color: '#131722', fontWeight: '700', border: 'none', padding: '14px', borderRadius: '10px', cursor: isSavingSettings ? 'not-allowed' : 'pointer', fontSize: '1rem', opacity: isSavingSettings ? 0.7 : 1, transition: 'opacity 0.2s' }}
                >
                  {isSavingSettings ? '⏳ Saving…' : '💾 Save All Settings'}
                </button>
                <button
                  onClick={() => { setSettingsDraft(settings || {}); addToast('Changes discarded', 'info'); }}
                  style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '14px 22px', borderRadius: '10px', cursor: 'pointer', fontSize: '1rem' }}
                >
                  ↩ Reset
                </button>
              </div>
            </div>
            )}
          </div>{/* /Content Card */}
        </main>
      </div>

      {/* Edit Balance Modal */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '35px', width: '100%', maxWidth: '420px' }}>
            <h3 style={{ marginBottom: '5px' }}>Edit User Balance</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '25px', fontSize: '0.9rem' }}>{editUser.email}</p>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>New Balance (USD)</label>
            <input
              type="number"
              value={editBalance}
              onChange={e => setEditBalance(e.target.value)}
              style={{ width: '100%', padding: '13px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', outline: 'none', fontSize: '1.1rem', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleUpdateBalance} style={{ flex: 1, background: '#00e676', color: '#131722', fontWeight: '700', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}>
                Save
              </button>
              <button onClick={() => setEditUser(null)} style={{ flex: 1, background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {viewingDocument && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }} onClick={() => setViewingDocument(null)}>
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: '15px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'white' }}>KYC Document</h3>
              <button onClick={() => setViewingDocument(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', background: '#000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {viewingDocument.startsWith('data:image') ? (
                <img src={viewingDocument} alt="KYC Document" style={{ maxWidth: '100%', objectFit: 'contain' }} />
              ) : (
                <iframe src={viewingDocument} style={{ width: '100%', height: '600px', border: 'none' }} title="KYC Document" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
