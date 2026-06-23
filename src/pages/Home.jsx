import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    
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
    
    return () => window.removeEventListener('scroll', handleScroll);
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
      <header className="navbar" style={{
        background: isScrolled ? 'rgba(19, 23, 34, 0.95)' : 'rgba(19, 23, 34, 0.8)',
        boxShadow: isScrolled ? '0 4px 20px rgba(0, 0, 0, 0.5)' : 'none'
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
            background: isMobileMenuOpen ? 'rgba(19, 23, 34, 0.98)' : '',
            padding: isMobileMenuOpen ? '20px' : '',
            borderBottom: isMobileMenuOpen ? '1px solid var(--border-color)' : '',
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
            background: isMobileMenuOpen ? 'rgba(11, 17, 32, 0.98)' : '',
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
          background: 'rgba(0,0,0,0.8)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            padding: '40px',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '400px',
            border: '1px solid var(--border-color)',
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
                  </div>
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
        <section id="home" className="hero">
          <div className="hero-bg-glow"></div>
          <div className="container hero-content">
            <h1 className="hero-title">Smart Investment Solutions for <span className="text-gradient">Modern Investors</span></h1>
            <p className="hero-subtitle">Experience high returns and secure asset management with cutting-edge strategies tailored for your financial growth.</p>
            <div className="hero-actions">
              <a href="#packages" onClick={(e) => handleSmoothScroll(e, '#packages')} className="btn btn-primary btn-lg">Start Investing Today</a>
              <a href="#features" onClick={(e) => handleSmoothScroll(e, '#features')} className="btn btn-outline btn-lg">View Packages</a>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card">
                <h3 className="stat-value">$50M+</h3>
                <p className="stat-label">Assets Under Management</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-value">25k+</h3>
                <p className="stat-label">Active Investors</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-value">45%</h3>
                <p className="stat-label">Average Annual Return</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-value">24/7</h3>
                <p className="stat-label">Expert Support</p>
              </div>
            </div>
          </div>
        </section>

        <section id="packages" className="packages section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Investment <span className="text-gradient">Packages</span></h2>
              <p className="section-desc">Choose the perfect investment plan tailored to your financial goals.</p>
            </div>
            <div className="packages-grid">
              <div className="package-card">
                <div className="package-header">
                  <h3>Cardano</h3>
                  <div className="return-badge">10% Returns</div>
                </div>
                <div className="package-price">
                  <span className="amount">$200 - $500</span>
                </div>
                <ul className="package-features">
                  <li><i className="icon-check"></i> 6 Hours Duration</li>
                  <li><i className="icon-check"></i> 24/7 Support</li>
                  <li><i className="icon-check"></i> Instant Withdrawals</li>
                </ul>
                <a href="#invest" onClick={(e) => handleInvestClick(e, 'Cardano')} className="btn btn-outline btn-block">Invest Now</a>
              </div>
              <div className="package-card popular">
                <div className="popular-badge">Most Popular</div>
                <div className="package-header">
                  <h3>Solana</h3>
                  <div className="return-badge">12% Returns</div>
                </div>
                <div className="package-price">
                  <span className="amount">$1,000 - $3,000</span>
                </div>
                <ul className="package-features">
                  <li><i className="icon-check"></i> 9 Hours Duration</li>
                  <li><i className="icon-check"></i> 24/7 Support</li>
                  <li><i className="icon-check"></i> Instant Withdrawals</li>
                </ul>
                <a href="#invest" onClick={(e) => handleInvestClick(e, 'Solana')} className="btn btn-primary btn-block">Invest Now</a>
              </div>
              <div className="package-card">
                <div className="package-header">
                  <h3>Bronze</h3>
                  <div className="return-badge">15% Returns</div>
                </div>
                <div className="package-price">
                  <span className="amount">$5,000 - $8,000</span>
                </div>
                <ul className="package-features">
                  <li><i className="icon-check"></i> 12 Hours Duration</li>
                  <li><i className="icon-check"></i> 24/7 Support</li>
                  <li><i className="icon-check"></i> Instant Withdrawals</li>
                </ul>
                <a href="#invest" onClick={(e) => handleInvestClick(e, 'Bronze')} className="btn btn-outline btn-block">Invest Now</a>
              </div>
              <div className="package-card">
                <div className="package-header">
                  <h3>Platinum</h3>
                  <div className="return-badge">20% Returns</div>
                </div>
                <div className="package-price">
                  <span className="amount">$12,000 - $15,000</span>
                </div>
                <ul className="package-features">
                  <li><i className="icon-check"></i> 12 Hours Duration</li>
                  <li><i className="icon-check"></i> Dedicated Manager</li>
                  <li><i className="icon-check"></i> Priority Support</li>
                </ul>
                <a href="#invest" onClick={(e) => handleInvestClick(e, 'Platinum')} className="btn btn-outline btn-block">Invest Now</a>
              </div>
              <div className="package-card">
                <div className="package-header">
                  <h3>Gold</h3>
                  <div className="return-badge">25% Returns</div>
                </div>
                <div className="package-price">
                  <span className="amount">$20,000 - $25,000</span>
                </div>
                <ul className="package-features">
                  <li><i className="icon-check"></i> 15 Hours Duration</li>
                  <li><i className="icon-check"></i> Dedicated Manager</li>
                  <li><i className="icon-check"></i> Priority Support</li>
                </ul>
                <a href="#invest" onClick={(e) => handleInvestClick(e, 'Gold')} className="btn btn-outline btn-block">Invest Now</a>
              </div>
              <div className="package-card premium">
                <div className="package-header">
                  <h3>Swift</h3>
                  <div className="return-badge">30% Returns</div>
                </div>
                <div className="package-price">
                  <span className="amount">$30,000 - $40,000</span>
                </div>
                <ul className="package-features">
                  <li><i className="icon-check"></i> 1 Day Duration</li>
                  <li><i className="icon-check"></i> VIP Manager</li>
                  <li><i className="icon-check"></i> Exclusive Perks</li>
                </ul>
                <a href="#invest" onClick={(e) => handleInvestClick(e, 'Swift')} className="btn btn-primary btn-block">Invest Now</a>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="features section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Why Choose <span className="text-gradient">Cashflowvest?</span></h2>
              <p className="section-desc">We provide the best tools and environment for your investments to thrive.</p>
            </div>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🛡️</div>
                <h3>Secure & Licensed</h3>
                <p>Your funds are protected by industry-leading security protocols and full regulatory compliance.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📈</div>
                <h3>High Returns</h3>
                <p>Our expert strategies consistently deliver above-average market returns for our investors.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h3>Fast Payouts</h3>
                <p>Enjoy quick and seamless withdrawals directly to your preferred wallet or bank account.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">👥</div>
                <h3>Expert Team</h3>
                <p>A dedicated team of seasoned financial professionals working around the clock for you.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>Real-Time Analytics</h3>
                <p>Monitor your portfolio performance 24/7 with our advanced real-time dashboard.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🌍</div>
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
            <div className="testimonials-grid">
              <div className="testimonial-card">
                <p className="quote">"BetaPrime has completely transformed how I manage my crypto portfolio. The returns are consistently impressive."</p>
                <div className="author">
                  <div className="avatar">ST</div>
                  <div>
                    <h4>Sarah Thompson</h4>
                    <span>Pro Investor</span>
                  </div>
                </div>
              </div>
              <div className="testimonial-card">
                <p className="quote">"I was skeptical at first, but Cashflowvest proved their worth within the first week. Instant payouts are a game changer."</p>
                <div className="author">
                  <div className="avatar">MJ</div>
                  <div>
                    <h4>Michael Johnson</h4>
                    <span>Business Owner</span>
                  </div>
                </div>
              </div>
              <div className="testimonial-card">
                <p className="quote">"The 24/7 support team is incredible. They walked me through everything and helped me choose the right package."</p>
                <div className="author">
                  <div className="avatar">DC</div>
                  <div>
                    <h4>David Chen</h4>
                    <span>Software Engineer</span>
                  </div>
                </div>
              </div>
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
        <div className="container footer-bottom">
          <p>&copy; 2026 Cashflowvest. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

export default Home;
