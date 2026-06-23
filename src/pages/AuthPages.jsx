import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setMessage(data.message);
    } catch { setMessage('Network error. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px' }}>
        <h2 style={{ marginBottom: '8px' }}>Forgot Password</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '0.9rem' }}>Enter your email and we'll send a reset link.</p>
        {message ? (
          <div style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid #00e676', borderRadius: '8px', padding: '15px', color: '#00e676', marginBottom: '20px' }}>{message}</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'white', outline: 'none', width: '100%' }} />
            <button type="submit" disabled={loading} className="btn btn-primary btn-block">{loading ? 'Sending...' : 'Send Reset Link'}</button>
          </form>
        )}
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Remember it? <Link to="/" style={{ color: 'var(--accent-blue)' }}>Back to Home</Link>
        </p>
      </div>
    </div>
  );
}

export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const token = new URLSearchParams(window.location.search).get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setMessage('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      setMessage(data.message);
    } catch { setMessage('Network error. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px' }}>
        <h2 style={{ marginBottom: '8px' }}>Reset Password</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '0.9rem' }}>Create a new secure password for your account.</p>
        {message ? (
          <div style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid #00e676', borderRadius: '8px', padding: '15px', color: '#00e676' }}>{message} <Link to="/" style={{ color: 'var(--accent-blue)', marginLeft: '5px' }}>Login →</Link></div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="password" placeholder="New Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'white', outline: 'none', width: '100%' }} />
            <input type="password" placeholder="Confirm Password" value={confirm} onChange={e => setConfirm(e.target.value)} required
              style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'white', outline: 'none', width: '100%' }} />
            {message && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{message}</p>}
            <button type="submit" disabled={loading} className="btn btn-primary btn-block">{loading ? 'Resetting...' : 'Reset Password'}</button>
          </form>
        )}
      </div>
    </div>
  );
}

export function VerifyEmail() {
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const token = new URLSearchParams(window.location.search).get('token');

  React.useEffect(() => {
    fetch(`${API_URL}/api/auth/verify?token=${token}`)
      .then(r => r.json())
      .then(d => { setStatus('done'); setMessage(d.message); })
      .catch(() => { setStatus('error'); setMessage('Verification failed. The link may be expired.'); });
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '50px', maxWidth: '420px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>{status === 'verifying' ? '⏳' : status === 'done' ? '✅' : '❌'}</div>
        <h2 style={{ marginBottom: '15px' }}>{status === 'verifying' ? 'Verifying...' : status === 'done' ? 'Email Verified!' : 'Verification Failed'}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>{message || 'Please wait while we verify your email.'}</p>
        {status === 'done' && <Link to="/" className="btn btn-primary">Go to Login</Link>}
      </div>
    </div>
  );
}
