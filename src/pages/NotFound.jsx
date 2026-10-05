import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-main)',
      color: 'white',
      textAlign: 'center',
      padding: '20px',
      fontFamily: 'Inter, sans-serif'
    }}>
      <AlertCircle size={80} color="#f5a623" style={{ marginBottom: '20px' }} />
      <h1 style={{ fontSize: '4rem', margin: '0 0 10px', fontFamily: 'Outfit, sans-serif' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', margin: '0 0 20px', color: 'var(--text-secondary)' }}>Page Not Found</h2>
      <p style={{ maxWidth: '400px', marginBottom: '30px', color: 'var(--text-secondary)' }}>
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link to="/" style={{
        background: 'linear-gradient(135deg, #00e676, #00b35c)',
        color: '#09090b',
        textDecoration: 'none',
        padding: '12px 24px',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '1rem',
        boxShadow: '0 4px 15px rgba(0,230,118,0.2)'
      }}>
        Return to Home
      </Link>
    </div>
  );
}
