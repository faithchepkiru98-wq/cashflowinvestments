import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ── Shared Premium Styles ──────────────────────────────────────────────────── */
const pageStyle = {
  minHeight: '100vh',
  background: 'radial-gradient(ellipse at 20% 50%, rgba(0,230,118,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(245,166,35,0.04) 0%, transparent 60%), #09090b',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '20px', fontFamily: "'Outfit', sans-serif",
};

const cardStyle = {
  background: 'rgba(18,18,20,0.85)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(245,166,35,0.12)',
  borderRadius: '24px',
  padding: '44px 40px',
  width: '100%', maxWidth: '440px',
  boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(245,166,35,0.03)',
  position: 'relative', overflow: 'hidden',
};

const accentBar = {
  position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
  background: 'linear-gradient(90deg, transparent, #f5a623 40%, #00e676 70%, transparent)',
};

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '13px 16px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  color: 'white', outline: 'none',
  fontSize: '0.95rem', fontFamily: "'Outfit', sans-serif",
  transition: 'border-color 0.2s',
};

const labelStyle = { display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' };

const submitBtn = {
  width: '100%', padding: '15px',
  background: 'linear-gradient(135deg, #f5a623, #e09614)',
  color: '#09090b', fontWeight: '800', fontSize: '1rem',
  border: 'none', borderRadius: '12px', cursor: 'pointer',
  fontFamily: "'Outfit', sans-serif",
  boxShadow: '0 6px 24px rgba(245,166,35,0.25)',
  transition: 'all 0.2s',
};

const Logo = () => (
  <div style={{ textAlign: 'center', marginBottom: '36px' }}>
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #f5a623, #00e676)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>💎</div>
      <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '800', fontSize: '1.4rem', background: 'linear-gradient(90deg, #f5a623, #00e676)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Cashflowvest</span>
    </div>
  </div>
);

/* ── FORGOT PASSWORD ────────────────────────────────────────────────────────── */
export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setMessage(data.message);
    } catch { setMessage('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={pageStyle}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={cardStyle}>
        <div style={accentBar} />
        <Logo />
        <h1 style={{ textAlign: 'center', fontFamily: "'Outfit', sans-serif", fontSize: '1.6rem', marginBottom: '8px', fontWeight: '800' }}>Forgot Password?</h1>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', marginBottom: '32px', fontSize: '0.9rem', lineHeight: '1.6' }}>
          No worries. Enter your email and we'll send you a secure reset link.
        </p>

        {message ? (
          <div style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.25)', borderRadius: '12px', padding: '18px', color: '#00e676', textAlign: 'center', lineHeight: '1.6' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📬</div>
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>
            <button type="submit" disabled={loading} style={{ ...submitBtn, opacity: loading ? 0.7 : 1 }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.boxShadow = '0 8px 32px rgba(245,166,35,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(245,166,35,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              {loading ? 'Sending...' : 'Send Reset Link →'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '0.875rem', color: 'rgba(255,255,255,0.35)' }}>
          Remember it?{' '}
          <Link to="/" style={{ color: '#f5a623', fontWeight: '600', textDecoration: 'none' }}>Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

/* ── RESET PASSWORD ─────────────────────────────────────────────────────────── */
export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const token = new URLSearchParams(window.location.search).get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setIsError(true); setMessage('Passwords do not match.'); return; }
    setLoading(true); setIsError(false);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      setMessage(data.message);
    } catch { setIsError(true); setMessage('Network error. Try again.'); }
    finally { setLoading(false); }
  };

  const success = !isError && message;

  return (
    <div style={pageStyle}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={cardStyle}>
        <div style={accentBar} />
        <Logo />
        <h1 style={{ textAlign: 'center', fontFamily: "'Outfit', sans-serif", fontSize: '1.6rem', marginBottom: '8px', fontWeight: '800' }}>Set New Password</h1>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', marginBottom: '32px', fontSize: '0.9rem' }}>
          Create a strong, unique password to protect your account.
        </p>

        {success ? (
          <div style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.25)', borderRadius: '12px', padding: '22px', color: '#00e676', textAlign: 'center', lineHeight: '1.6' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>✅</div>
            <p style={{ margin: '0 0 16px' }}>{message}</p>
            <Link to="/" style={{ color: '#f5a623', fontWeight: '700', textDecoration: 'none', fontSize: '0.95rem' }}>Go to Login →</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>New Password</label>
              <input type="password" placeholder="Minimum 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>
            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input type="password" placeholder="Repeat your new password" value={confirm} onChange={e => setConfirm(e.target.value)} required style={{ ...inputStyle, borderColor: isError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)' }}
                onFocus={e => e.target.style.borderColor = isError ? 'rgba(239,68,68,0.5)' : 'rgba(245,166,35,0.5)'}
                onBlur={e => e.target.style.borderColor = isError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'} />
            </div>
            {isError && message && (
              <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '-10px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>⚠️ {message}</p>
            )}
            <button type="submit" disabled={loading} style={{ ...submitBtn, opacity: loading ? 0.7 : 1 }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.boxShadow = '0 8px 32px rgba(245,166,35,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(245,166,35,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              {loading ? 'Resetting...' : 'Reset Password →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ── VERIFY EMAIL ────────────────────────────────────────────────────────────── */
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
    <div style={pageStyle}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={cardStyle}>
        <div style={accentBar} />
        <Logo />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>
            {status === 'verifying' ? '⏳' : status === 'done' ? '✅' : '❌'}
          </div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.6rem', marginBottom: '12px', fontWeight: '800' }}>
            {status === 'verifying' ? 'Verifying…' : status === 'done' ? 'Email Verified!' : 'Verification Failed'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px', lineHeight: '1.6' }}>
            {message || 'Please wait while we verify your email address.'}
          </p>
          {status === 'done' && (
            <Link to="/" style={{ ...submitBtn, display: 'inline-block', textDecoration: 'none', textAlign: 'center', padding: '14px 32px', width: 'auto' }}>
              Go to Login →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
