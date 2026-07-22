import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { ShieldCheck, TrendingUp, Zap, Users, BarChart3, Globe } from 'lucide-react';
import { useRef } from 'react';

// ── Animated Stat Counter ─────────────────────────────────────────────────────────────
function AnimatedStat({ target, prefix = '', suffix = '', duration = 2000, label }) {
  const [count, setCount] = React.useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const step = (now) => {
          const elapsed = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - elapsed, 3); // cubic ease-out
          setCount(Math.floor(eased * target));
          if (elapsed < 1) requestAnimationFrame(step);
          else setCount(target);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <div ref={ref} className="stat-card">
      <h3 className="stat-value">{prefix}{count.toLocaleString()}{suffix}</h3>
      <p className="stat-label">{label}</p>
    </div>
  );
}

// ── Live Crypto Price Ticker ───────────────────────────────────────────────────
function CryptoTicker() {
  const [prices, setPrices] = React.useState({ BTC: 64200, ETH: 3450, USDT: 1.00 });

  React.useEffect(() => {
    // In a real app, this would fetch from Binance/CoinGecko API.
    // For now, we simulate slight fluctuations.
    const interval = setInterval(() => {
      setPrices(prev => ({
        BTC: prev.BTC + (Math.random() * 10 - 5),
        ETH: prev.ETH + (Math.random() * 4 - 2),
        USDT: 1.00 // Stable
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: '#0a0a0a', borderBottom: '1px solid #333', padding: '6px 0', fontSize: '0.8rem', color: '#9ca3af', overflow: 'hidden', whiteSpace: 'nowrap' }}>
      <div style={{ display: 'flex', gap: '30px', animation: 'marquee 20s linear infinite', width: 'max-content' }}>
        <style>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
        {/* Double the items for seamless marquee */}
        {[...Array(2)].map((_, i) => (
          <React.Fragment key={i}>
            <span><span style={{ color: '#f5a623', fontWeight: 'bold' }}>BTC</span> ${prices.BTC.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span><span style={{ color: '#627eea', fontWeight: 'bold' }}>ETH</span> ${prices.ETH.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span><span style={{ color: '#26a17b', fontWeight: 'bold' }}>USDT</span> ${prices.USDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span><span style={{ color: '#10b981' }}>▲ Market Active</span></span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ── ROI Calculator ─────────────────────────────────────────────────────────────
function RoiCalculator({ onInvest }) {
  const packages = {
    'Starter':  { returns: 8,  min: 50,    max: 499,   durationHrs: 6,  color: '#10b981' },
    'Basic':    { returns: 10, min: 500,   max: 1999,  durationHrs: 9,  color: '#00b0ff' },
    'Bronze':   { returns: 15, min: 2000,  max: 4999,  durationHrs: 12, color: '#cd7f32' },
    'Silver':   { returns: 20, min: 5000,  max: 14999, durationHrs: 15, color: '#9ca3af' },
    'Gold':     { returns: 25, min: 15000, max: 29999, durationHrs: 24, color: '#f5a623' },
    'Diamond':  { returns: 30, min: 30000, max: 100000,durationHrs: 48, color: '#818cf8' },
  };

  const [selectedPkg, setSelectedPkg] = React.useState('Starter');
  const [amount, setAmount] = React.useState(packages['Starter'].min);

  const pkg = packages[selectedPkg];
  
  React.useEffect(() => {
    // Keep amount within bounds when switching packages
    if (amount < pkg.min) setAmount(pkg.min);
    if (amount > pkg.max) setAmount(pkg.max);
  }, [selectedPkg, pkg.min, pkg.max, amount]);

  const profit = (amount * pkg.returns) / 100;
  const total = amount + profit;

  return (
    <div style={{ background: '#131722', borderRadius: '16px', padding: '30px', border: `1px solid ${pkg.color}40`, maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
        {Object.keys(packages).map(name => (
          <button
            key={name}
            onClick={() => setSelectedPkg(name)}
            style={{
              flex: 1, minWidth: '100px', padding: '10px', borderRadius: '8px', cursor: 'pointer',
              background: selectedPkg === name ? `${packages[name].color}20` : 'transparent',
              color: selectedPkg === name ? packages[name].color : '#9ca3af',
              border: `1px solid ${selectedPkg === name ? packages[name].color : '#333'}`,
              fontWeight: selectedPkg === name ? 'bold' : 'normal',
              transition: 'all 0.2s'
            }}
          >
            {name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center' }}>
        <div style={{ flex: '1 1 300px' }}>
          <label style={{ display: 'block', color: '#9ca3af', marginBottom: '10px', fontSize: '0.9rem' }}>Investment Amount ($)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={pkg.min}
            max={pkg.max}
            style={{ width: '100%', background: '#0a0a0a', border: `1px solid ${pkg.color}60`, color: 'white', padding: '15px', borderRadius: '8px', fontSize: '1.2rem', outline: 'none' }}
          />
          <input 
            type="range" 
            min={pkg.min} 
            max={pkg.max} 
            value={amount} 
            onChange={(e) => setAmount(Number(e.target.value))}
            style={{ width: '100%', marginTop: '15px', accentColor: pkg.color }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', fontSize: '0.8rem', marginTop: '5px' }}>
            <span>Min: ${pkg.min.toLocaleString()}</span>
            <span>Max: ${pkg.max.toLocaleString()}</span>
          </div>
        </div>

        <div style={{ flex: '1 1 300px', background: '#0a0a0a', padding: '25px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <span style={{ color: '#9ca3af' }}>Duration:</span>
            <span style={{ color: 'white', fontWeight: 'bold' }}>{pkg.durationHrs} Hours</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <span style={{ color: '#9ca3af' }}>Net Profit ({pkg.returns}%):</span>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>+${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid #333' }}>
            <span style={{ color: '#9ca3af' }}>Total Return:</span>
            <span style={{ color: pkg.color, fontWeight: 'bold', fontSize: '1.2rem' }}>${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <button 
            onClick={() => onInvest(selectedPkg)}
            style={{ width: '100%', padding: '15px', borderRadius: '8px', border: 'none', background: pkg.color, color: '#0a0a0a', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
          >
            Invest in {selectedPkg} Now
          </button>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [authModal, setAuthModal] = useState({ isOpen: false, type: 'login' });
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [walletAddresses, setWalletAddresses] = useState(null);
  
  const navigate = useNavigate();

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
  
    if (score < 2) return { score, label: 'Weak', color: '#ef4444' };
    if (score < 4) return { score, label: 'Medium', color: '#f5a623' };
    return { score, label: 'Strong', color: '#10b981' };
  };

  const strength = getPasswordStrength(password);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    
    // Intersection Observer for animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });
    
    // Check if logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    if(targetId === '#') return;
    const targetElement = document.querySelector(targetId);
    if(targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 80,
        behavior: 'smooth'
      });
      setIsMobileMenuOpen(false);
    }
  };

  const openAuthModal = (e, type) => {
    e.preventDefault();
    setAuthModal({ isOpen: true, type });
    setMessage('');
    setName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (authModal.type === 'register') {
      const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])(?=.{8,})");
      if (!strongRegex.test(password)) {
        setMessage("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
        setIsLoading(false);
        return;
      }
      if (!phone) {
        setMessage("Please provide a valid phone number.");
        setIsLoading(false);
        return;
      }
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const endpoint = authModal.type === 'login' 
        ? `${API_URL}/api/auth/login` 
        : `${API_URL}/api/auth/register`;
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authModal.type === 'login' ? { email, password } : { name, email, password, phone })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        
        if (authModal.type === 'login') {
          setAuthModal({ isOpen: false, type: 'login' });
          navigate('/dashboard'); // Redirect to dashboard
        } else {
          // Fetch wallet addresses for the next step
          try {
            const walletRes = await fetch(`${API_URL}/api/wallet-addresses`, {
              headers: { 'Authorization': `Bearer ${data.token}` }
            });
            if (walletRes.ok) {
              const wallets = await walletRes.json();
              setWalletAddresses(wallets);
            }
          } catch (err) {
            console.error('Failed to fetch wallets');
          }
          setMessage('Registration successful! Next: Crypto Deposit.');
          setAuthModal({ ...authModal, type: 'crypto_deposit' });
        }
      } else {
        setMessage(data.message || 'An error occurred');
      }
    } catch (error) {
      setMessage('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvestClick = (e, packageName) => {
    e.preventDefault();
    if (!user) {
      setAuthModal({ isOpen: true, type: 'login' });
      setMessage(`Please login to invest in the ${packageName} package.`);
    } else {
      navigate('/dashboard', { state: { selectedPackage: packageName } });
    }
  };

  return (
    <>
      <CryptoTicker />
      <header className="navbar" style={{
        background: isScrolled ? 'rgba(9, 9, 11, 0.95)' : 'rgba(9, 9, 11, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: isScrolled ? '0 4px 30px rgba(0, 0, 0, 0.6)' : 'none'
      }}>
        <div className="container nav-content">
          <div className="logo">
            <div className="logo-icon"></div>
            <span>Cashflowvest</span>
          </div>
          <nav className="nav-links" style={{
            display: isMobileMenuOpen ? 'flex' : '',
            flexDirection: isMobileMenuOpen ? 'column' : '',
            position: isMobileMenuOpen ? 'absolute' : '',
            top: isMobileMenuOpen ? '100%' : '',
            left: isMobileMenuOpen ? '0' : '',
            width: isMobileMenuOpen ? '100%' : '',
            background: isMobileMenuOpen ? 'rgba(9, 9, 11, 0.98)' : '',
            padding: isMobileMenuOpen ? '20px' : '',
            borderBottom: isMobileMenuOpen ? '1px solid rgba(255,255,255,0.06)' : '',
            gap: isMobileMenuOpen ? '20px' : ''
          }}>
            <a href="#home" onClick={(e) => handleSmoothScroll(e, '#home')}>Home</a>
            <a href="#packages" onClick={(e) => handleSmoothScroll(e, '#packages')}>Packages</a>
            <a href="#features" onClick={(e) => handleSmoothScroll(e, '#features')}>Features</a>
            <a href="#testimonials" onClick={(e) => handleSmoothScroll(e, '#testimonials')}>Testimonials</a>
            <a href="#contact" onClick={(e) => handleSmoothScroll(e, '#contact')}>Contact</a>
          </nav>
          <div className="nav-actions" style={{
            display: isMobileMenuOpen ? 'flex' : '',
            position: isMobileMenuOpen ? 'absolute' : '',
            top: isMobileMenuOpen ? 'calc(100% + 220px)' : '',
            left: isMobileMenuOpen ? '0' : '',
            width: isMobileMenuOpen ? '100%' : '',
            background: isMobileMenuOpen ? 'rgba(9, 9, 11, 0.98)' : '',
            padding: isMobileMenuOpen ? '20px' : '',
            justifyContent: isMobileMenuOpen ? 'center' : ''
          }}>
            {user ? (
               <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                 <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Dashboard</button>
                 <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Logout</button>
               </div>
            ) : (
               <>
                 <a href="#login" onClick={(e) => openAuthModal(e, 'login')} className="btn btn-outline">Login</a>
                 <a href="#register" onClick={(e) => openAuthModal(e, 'register')} className="btn btn-primary">Sign Up</a>
               </>
            )}
          </div>
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        </div>
      </header>

      {/* Auth Modal */}
      {authModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}>
          <div style={{
            background: 'rgba(24, 24, 27, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '44px',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '420px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setAuthModal({ ...authModal, isOpen: false })}
              style={{
                position: 'absolute', top: '15px', right: '15px',
                background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                fontSize: '1.5rem', cursor: 'pointer'
              }}
            >&times;</button>
            <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>
              {authModal.type === 'login' ? 'Welcome Back' : authModal.type === 'crypto_deposit' ? 'Crypto Deposit' : 'Create Account'}
            </h2>
            
            {message && (
              <div style={{ 
                padding: '10px', 
                marginBottom: '20px', 
                borderRadius: '8px', 
                background: message.includes('successful') ? 'rgba(16, 185, 129, 0.1)' : 'var(--warning-bg)',
                color: message.includes('successful') ? '#10b981' : 'var(--warning-border)',
                textAlign: 'center',
                fontSize: '0.875rem'
              }}>
                {message}
              </div>
            )}

            {authModal.type === 'crypto_deposit' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', color: 'var(--text-secondary)' }}>
                <p style={{ textAlign: 'center', marginBottom: '10px' }}>To activate your account and start investing, please make a deposit to one of the following addresses:</p>
                {walletAddresses && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ background: 'var(--bg-main)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <strong style={{ color: 'white', display: 'block', marginBottom: '5px' }}>Bitcoin (BTC)</strong>
                      <code style={{ color: 'var(--accent-blue)', wordBreak: 'break-all' }}>{walletAddresses.btc}</code>
                    </div>
                    <div style={{ background: 'var(--bg-main)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <strong style={{ color: 'white', display: 'block', marginBottom: '5px' }}>Ethereum (ETH)</strong>
                      <code style={{ color: 'var(--accent-blue)', wordBreak: 'break-all' }}>{walletAddresses.eth}</code>
                    </div>
                    <div style={{ background: 'var(--bg-main)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <strong style={{ color: 'white', display: 'block', marginBottom: '5px' }}>USDT (TRC20)</strong>
                      <code style={{ color: 'var(--accent-blue)', wordBreak: 'break-all' }}>{walletAddresses.usdt}</code>
                    </div>
                  </div>
                )}
                <button 
                  onClick={() => { setAuthModal({ isOpen: false, type: 'login' }); navigate('/dashboard'); }} 
                  className="btn btn-primary btn-block" 
                  style={{ marginTop: '15px' }}
                >
                  I have made a deposit
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {authModal.type === 'register' && (
                    <>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Full Name</label>
                        <input 
                          type="text" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          style={{
                            width: '100%', padding: '12px', borderRadius: '8px',
                            background: 'var(--bg-main)', border: '1px solid var(--border-color)',
                            color: 'white', outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Phone Number</label>
                        <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px' }}>
                          <PhoneInput
                            placeholder="Enter phone number"
                            value={phone}
                            onChange={setPhone}
                            defaultCountry="US"
                            className="custom-phone"
                            style={{ color: 'white', outline: 'none', height: '44px' }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Email</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{
                        width: '100%', padding: '12px', borderRadius: '8px',
                        background: 'var(--bg-main)', border: '1px solid var(--border-color)',
                        color: 'white', outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Password</label>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{
                        width: '100%', padding: '12px', borderRadius: '8px',
                        background: 'var(--bg-main)', border: '1px solid var(--border-color)',
                        color: 'white', outline: 'none', paddingRight: '50px'
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: '10px', top: '35px',
                        background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                        cursor: 'pointer', fontSize: '0.875rem'
                      }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                    {authModal.type === 'register' && password.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', gap: '5px', height: '4px', marginBottom: '5px' }}>
                          <div style={{ flex: 1, background: strength.score >= 1 ? strength.color : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: 'all 0.3s' }}></div>
                          <div style={{ flex: 1, background: strength.score >= 2 ? strength.color : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: 'all 0.3s' }}></div>
                          <div style={{ flex: 1, background: strength.score >= 3 ? strength.color : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: 'all 0.3s' }}></div>
                          <div style={{ flex: 1, background: strength.score >= 4 ? strength.color : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: 'all 0.3s' }}></div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: strength.color, fontWeight: 'bold' }}>{strength.label} Password</span>
                      </div>
                    )}
                  </div>
                  {authModal.type === 'login' && (
                    <div style={{ textAlign: 'right', marginTop: '-5px' }}>
                      <a href="/forgot-password" onClick={(e) => { e.preventDefault(); setAuthModal({ ...authModal, isOpen: false }); navigate('/forgot-password'); }} style={{ color: 'var(--accent-blue)', fontSize: '0.8rem' }}>Forgot Password?</a>
                    </div>
                  )}
                  <button type="submit" disabled={isLoading} className="btn btn-primary btn-block" style={{ marginTop: '10px' }}>
                    {isLoading ? 'Processing...' : (authModal.type === 'login' ? 'Login' : 'Sign Up')}
                  </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {authModal.type === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setAuthModal({ ...authModal, type: authModal.type === 'login' ? 'register' : 'login' });
                      setMessage('');
                    }}
                    style={{ color: 'var(--accent-blue)' }}
                  >
                    {authModal.type === 'login' ? 'Sign Up' : 'Login'}
                  </a>
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <main>
        {/* Live Payouts Ticker */}
        <div style={{ background: '#0a0a0a', borderBottom: '1px solid rgba(0,230,118,0.1)', padding: '10px 0', overflow: 'hidden', whiteSpace: 'nowrap', display: 'flex', marginTop: '68px' }}>
          <div style={{ display: 'inline-block', animation: 'scrollTicker 30s linear infinite' }}>
            {[...Array(2)].map((_, i) => (
              <span key={i} style={{ display: 'inline-flex', gap: '60px' }}>
                <span style={{ color: '#00e676', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#00e676', fontWeight: '800' }}>✓</span> alex*** withdrew $4,250 · USDT</span>
                <span style={{ color: '#00e676', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}><span style={{ fontWeight: '800' }}>✓</span> mark_99 withdrew $1,100 · BTC</span>
                <span style={{ color: '#00e676', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}><span style={{ fontWeight: '800' }}>✓</span> sarah.t withdrew $8,500 · ETH</span>
                <span style={{ color: '#00e676', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}><span style={{ fontWeight: '800' }}>✓</span> crypto_king withdrew $12,400 · USDT</span>
                <span style={{ color: '#00e676', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}><span style={{ fontWeight: '800' }}>✓</span> david_w withdrew $2,300 · BTC</span>
                <span style={{ color: 'rgba(0,230,118,0.5)', marginRight: '60px' }}>|</span>
              </span>
            ))}
          </div>
        </div>

        <section id="home" className="hero animate-on-scroll">
          <div className="hero-bg-glow"></div>
          <div className="container hero-content">
            <h1 className="hero-title">Smart Investment Solutions for <span className="text-gradient">Modern Investors</span></h1>
            <p className="hero-subtitle">Experience high returns and secure asset management with cutting-edge strategies tailored for your financial growth.</p>
            <div className="hero-actions">
              <a href="#packages" onClick={(e) => handleSmoothScroll(e, '#packages')} className="btn btn-primary btn-lg">Start Investing Today</a>
              <a href="#features" onClick={(e) => handleSmoothScroll(e, '#features')} className="btn btn-outline btn-lg">View Packages</a>
            </div>
            
            <div className="stats-grid glass-panel">
              <AnimatedStat target={50} prefix="$" suffix="M+" label="Assets Under Management" />
              <AnimatedStat target={25000} suffix="+" label="Active Investors" />
              <AnimatedStat target={45} suffix="%" label="Average Annual Return" />
              <div className="stat-card">
                <h3 className="stat-value">24/7</h3>
                <p className="stat-label">Expert Support</p>
              </div>
            </div>
          </div>
        </section>

        <section id="packages" className="packages animate-on-scroll">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Investment <span className="text-gradient">Packages</span></h2>
              <p className="section-desc">Choose the perfect investment plan tailored to your financial goals.</p>
            </div>
            <div className="packages-grid">
              <div className="package-card">
                <div className="package-header">
                  <h3><span style={{ fontSize: '1.2rem', marginRight: '5px' }}>🌱</span>Starter</h3>
                  <div className="return-badge" style={{ background: '#10b98120', color: '#10b981' }}>8% Returns</div>
                </div>
                <div className="package-price">
                  <span className="amount">$50 - $499</span>
                </div>
                <ul className="package-features">
                  <li><i className="icon-check"></i> 6 Hours Duration</li>
                  <li><i className="icon-check"></i> 24/7 Support</li>
                  <li><i className="icon-check"></i> Instant Withdrawals</li>
                </ul>
                <a href="#invest" onClick={(e) => handleInvestClick(e, 'Starter')} className="btn btn-block" style={{ background: '#10b98115', color: '#10b981', border: '1px solid #10b98160', transition: 'all 0.2s', boxShadow: '0 0 10px #10b98140' }} onMouseEnter={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#131722'; e.currentTarget.style.boxShadow = '0 0 20px #10b981'; }} onMouseLeave={e => { e.currentTarget.style.background = '#10b98115'; e.currentTarget.style.color = '#10b981'; e.currentTarget.style.boxShadow = '0 0 10px #10b98140'; }}>Invest Now</a>
              </div>
              <div className="package-card popular">
                <div className="popular-badge">Most Popular</div>
                <div className="package-header">
                  <h3><span style={{ fontSize: '1.2rem', marginRight: '5px' }}>⭐</span>Basic</h3>
                  <div className="return-badge" style={{ background: '#00b0ff20', color: '#00b0ff' }}>10% Returns</div>
                </div>
                <div className="package-price">
                  <span className="amount">$500 - $1,999</span>
                </div>
                <ul className="package-features">
                  <li><i className="icon-check"></i> 9 Hours Duration</li>
                  <li><i className="icon-check"></i> 24/7 Support</li>
                  <li><i className="icon-check"></i> Instant Withdrawals</li>
                </ul>
                <a href="#invest" onClick={(e) => handleInvestClick(e, 'Basic')} className="btn btn-block" style={{ background: '#00b0ff15', color: '#00b0ff', border: '1px solid #00b0ff60', transition: 'all 0.2s', boxShadow: '0 0 10px #00b0ff40' }} onMouseEnter={e => { e.currentTarget.style.background = '#00b0ff'; e.currentTarget.style.color = '#131722'; e.currentTarget.style.boxShadow = '0 0 20px #00b0ff'; }} onMouseLeave={e => { e.currentTarget.style.background = '#00b0ff15'; e.currentTarget.style.color = '#00b0ff'; e.currentTarget.style.boxShadow = '0 0 10px #00b0ff40'; }}>Invest Now</a>
              </div>
              <div className="package-card">
                <div className="package-header">
                  <h3><span style={{ fontSize: '1.2rem', marginRight: '5px' }}>🥉</span>Bronze</h3>
                  <div className="return-badge" style={{ background: '#cd7f3220', color: '#cd7f32' }}>15% Returns</div>
                </div>
                <div className="package-price">
                  <span className="amount">$2,000 - $4,999</span>
                </div>
                <ul className="package-features">
                  <li><i className="icon-check"></i> 12 Hours Duration</li>
                  <li><i className="icon-check"></i> 24/7 Support</li>
                  <li><i className="icon-check"></i> Instant Withdrawals</li>
                </ul>
                <a href="#invest" onClick={(e) => handleInvestClick(e, 'Bronze')} className="btn btn-block" style={{ background: '#cd7f3215', color: '#cd7f32', border: '1px solid #cd7f3260', transition: 'all 0.2s', boxShadow: '0 0 10px #cd7f3240' }} onMouseEnter={e => { e.currentTarget.style.background = '#cd7f32'; e.currentTarget.style.color = '#131722'; e.currentTarget.style.boxShadow = '0 0 20px #cd7f32'; }} onMouseLeave={e => { e.currentTarget.style.background = '#cd7f3215'; e.currentTarget.style.color = '#cd7f32'; e.currentTarget.style.boxShadow = '0 0 10px #cd7f3240'; }}>Invest Now</a>
              </div>
              <div className="package-card">
                <div className="package-header">
                  <h3><span style={{ fontSize: '1.2rem', marginRight: '5px' }}>🥈</span>Silver</h3>
                  <div className="return-badge" style={{ background: '#9ca3af20', color: '#9ca3af' }}>20% Returns</div>
                </div>
                <div className="package-price">
                  <span className="amount">$5,000 - $14,999</span>
                </div>
                <ul className="package-features">
                  <li><i className="icon-check"></i> 15 Hours Duration</li>
                  <li><i className="icon-check"></i> Dedicated Manager</li>
                  <li><i className="icon-check"></i> Priority Support</li>
                </ul>
                <a href="#invest" onClick={(e) => handleInvestClick(e, 'Silver')} className="btn btn-block" style={{ background: '#9ca3af15', color: '#9ca3af', border: '1px solid #9ca3af60', transition: 'all 0.2s', boxShadow: '0 0 10px #9ca3af40' }} onMouseEnter={e => { e.currentTarget.style.background = '#9ca3af'; e.currentTarget.style.color = '#131722'; e.currentTarget.style.boxShadow = '0 0 20px #9ca3af'; }} onMouseLeave={e => { e.currentTarget.style.background = '#9ca3af15'; e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.boxShadow = '0 0 10px #9ca3af40'; }}>Invest Now</a>
              </div>
              <div className="package-card">
                <div className="package-header">
                  <h3><span style={{ fontSize: '1.2rem', marginRight: '5px' }}>🥇</span>Gold</h3>
                  <div className="return-badge" style={{ background: '#f5a62320', color: '#f5a623' }}>25% Returns</div>
                </div>
                <div className="package-price">
                  <span className="amount">$15,000 - $29,999</span>
                </div>
                <ul className="package-features">
                  <li><i className="icon-check"></i> 24 Hours Duration</li>
                  <li><i className="icon-check"></i> Dedicated Manager</li>
                  <li><i className="icon-check"></i> Priority Support</li>
                </ul>
                <a href="#invest" onClick={(e) => handleInvestClick(e, 'Gold')} className="btn btn-block" style={{ background: '#f5a62315', color: '#f5a623', border: '1px solid #f5a62360', transition: 'all 0.2s', boxShadow: '0 0 10px #f5a62340' }} onMouseEnter={e => { e.currentTarget.style.background = '#f5a623'; e.currentTarget.style.color = '#131722'; e.currentTarget.style.boxShadow = '0 0 20px #f5a623'; }} onMouseLeave={e => { e.currentTarget.style.background = '#f5a62315'; e.currentTarget.style.color = '#f5a623'; e.currentTarget.style.boxShadow = '0 0 10px #f5a62340'; }}>Invest Now</a>
              </div>
              <div className="package-card premium">
                <div className="package-header">
                  <h3><span style={{ fontSize: '1.2rem', marginRight: '5px' }}>💎</span>Diamond</h3>
                  <div className="return-badge" style={{ background: '#818cf820', color: '#818cf8' }}>30% Returns</div>
                </div>
                <div className="package-price">
                  <span className="amount">$30,000 - $100,000</span>
                </div>
                <ul className="package-features">
                  <li><i className="icon-check"></i> 48 Hours Duration</li>
                  <li><i className="icon-check"></i> VIP Manager</li>
                  <li><i className="icon-check"></i> Exclusive Perks</li>
                </ul>
                <a href="#invest" onClick={(e) => handleInvestClick(e, 'Diamond')} className="btn btn-block" style={{ background: '#818cf815', color: '#818cf8', border: '1px solid #818cf860', transition: 'all 0.2s', boxShadow: '0 0 10px #818cf840' }} onMouseEnter={e => { e.currentTarget.style.background = '#818cf8'; e.currentTarget.style.color = '#131722'; e.currentTarget.style.boxShadow = '0 0 20px #818cf8'; }} onMouseLeave={e => { e.currentTarget.style.background = '#818cf815'; e.currentTarget.style.color = '#818cf8'; e.currentTarget.style.boxShadow = '0 0 10px #818cf840'; }}>Invest Now</a>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="features animate-on-scroll">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Why Choose <span className="text-gradient">Cashflowvest?</span></h2>
              <p className="section-desc">We provide the best tools and environment for your investments to thrive.</p>
            </div>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon"><ShieldCheck size={48} color="var(--accent-blue)" /></div>
                <h3>Secure & Licensed</h3>
                <p>Your funds are protected by industry-leading security protocols and full regulatory compliance.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><TrendingUp size={48} color="var(--accent-blue)" /></div>
                <h3>High Returns</h3>
                <p>Our expert strategies consistently deliver above-average market returns for our investors.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><Zap size={48} color="var(--accent-blue)" /></div>
                <h3>Fast Payouts</h3>
                <p>Enjoy quick and seamless withdrawals directly to your preferred wallet or bank account.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><Users size={48} color="var(--accent-blue)" /></div>
                <h3>Expert Team</h3>
                <p>A dedicated team of seasoned financial professionals working around the clock for you.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><BarChart3 size={48} color="var(--accent-blue)" /></div>
                <h3>Real-Time Analytics</h3>
                <p>Monitor your portfolio performance 24/7 with our advanced real-time dashboard.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><Globe size={48} color="var(--accent-blue)" /></div>
                <h3>Global Reach</h3>
                <p>Accessible from anywhere in the world, breaking down geographical financial barriers.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="testimonials section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">What Our <span className="text-gradient">Investors Say</span></h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
              {[
                { initials: 'ST', name: 'Sarah Thompson', role: 'Pro Investor', quote: '"Cashflowvest has completely transformed how I manage my crypto portfolio. The returns are consistently impressive."', stars: 5 },
                { initials: 'MJ', name: 'Michael Johnson', role: 'Business Owner', quote: '"I was skeptical at first, but Cashflowvest proved their worth within the first week. Instant payouts are a game changer."', stars: 5 },
                { initials: 'DC', name: 'David Chen', role: 'Software Engineer', quote: '"The 24/7 support team is incredible. They walked me through everything and helped me choose the right package."', stars: 5 },
              ].map(t => (
                <div key={t.name} style={{
                  background: 'rgba(24,24,27,0.7)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '20px',
                  padding: '36px 28px',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}>
                  <div style={{ color: '#f5a623', fontSize: '1rem', letterSpacing: '2px' }}>{'★'.repeat(t.stars)}</div>
                  <p style={{ fontSize: '1.05rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', lineHeight: '1.7', flexGrow: 1 }}>{t.quote}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #00e676, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#022c22', fontSize: '1rem', fontFamily: 'Outfit, sans-serif', flexShrink: 0 }}>{t.initials}</div>
                    <div>
                      <p style={{ fontWeight: '700', color: 'white', marginBottom: '2px' }}>{t.name}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROI Calculator Section */}
        <section className="section animate-on-scroll" style={{ paddingTop: 0 }}>
          <div className="container">
            <div style={{ background: 'rgba(18,18,20,0.8)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: '28px', padding: '60px 50px', boxShadow: '0 0 60px rgba(0,230,118,0.05)' }}>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2 className="section-title">💰 Investment <span className="text-gradient">Calculator</span></h2>
                <p className="section-desc">See exactly how much you'll earn before you invest.</p>
              </div>
              <RoiCalculator onInvest={(pkg) => { if (isLoggedIn) navigate('/dashboard', { state: { selectedPackage: pkg } }); else setAuthModal({ isOpen: true, type: 'login' }); }} />
            </div>
          </div>
        </section>

        <section className="cta-section section">
          <div className="container">
            <div className="cta-banner">
              <div className="cta-content">
                <h2>Start Your Investment Journey</h2>
                <p>Join thousands of investors worldwide and start earning today.</p>
              </div>
              <div className="cta-actions">
                <a href="#register" onClick={(e) => openAuthModal(e, 'register')} className="btn btn-primary btn-lg">Create Free Account</a>
                <a href="#login" onClick={(e) => openAuthModal(e, 'login')} className="btn btn-outline btn-lg">Login to Dashboard</a>
              </div>
            </div>
            
            <div className="risk-disclosure">
              <h4>⚠️ Risk Disclosure</h4>
              <p>Trading and investing in digital assets involves significant risk and can result in the loss of your invested capital. You should not invest more than you can afford to lose and should ensure that you fully understand the risks involved. Past performance is not indicative of future results.</p>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="footer">
        <div className="container footer-content">
          <div className="footer-col">
            <div className="logo">
              <div className="logo-icon"></div>
              <span>Cashflowvest</span>
            </div>
            <p>Smart Investment Solutions for Modern Investors.</p>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <a href="#home">Home</a>
            <a href="#packages">Packages</a>
            <a href="#features">Features</a>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#risk">Risk Policy</a>
          </div>
          <div className="footer-col">
            <h4>Contact Us</h4>
            <p>Email: support@Cashflowvest.co.ke</p>
            <p>Location: New York, USA</p>
          </div>
        </div>
        
        {/* Trust Badges */}
        <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '20px 0', marginTop: '30px', marginBottom: '30px', display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '1.5rem', color: '#10b981' }}>🔒</span> 256-bit SSL Secure
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '1.5rem', color: '#3b82f6' }}>🛡️</span> DDoS Protected
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '1.5rem', color: '#f5a623' }}>⚡</span> Secure Crypto Gateway
          </div>
        </div>

        <div className="container footer-bottom">
          <p>&copy; 2026 Cashflowvest. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

export default Home;
