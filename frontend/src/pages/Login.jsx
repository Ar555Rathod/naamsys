import React, { useState } from 'react';
import api from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgot, setIsForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('naam_token', res.data.token);
      onLogin();
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials or account is inactive.');
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setSuccess(res.data.message);
      setForgotEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request reset link.');
    }
  };

  const handleSetup = async () => {
    try {
      await api.post('/auth/setup');
      alert('Admin setup complete. You can now login with admin@naam.org / admin123');
    } catch (err) {
      alert('Setup failed or already done.');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-light)' }}>
      <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '420px', transition: 'all 0.3s ease' }}>
        
        {!isForgot ? (
          <>
            <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              NAAM Portal Login
            </h2>
            {error && <p style={{ color: 'var(--danger)', marginBottom: '1.2rem', textAlign: 'center', fontSize: '0.875rem', background: 'rgba(239, 68, 68, 0.08)', padding: '0.5rem', borderRadius: '6px' }}>{error}</p>}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="Enter your email" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="••••••••" required />
              </div>
              
              <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
                <button type="button" onClick={() => { setIsForgot(true); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.825rem', fontWeight: 500 }}>
                  Forgot Password?
                </button>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}>Login</button>
            </form>
            
            <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <button onClick={handleSetup} className="btn" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                First time? Run System Setup
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              Reset Password
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              Enter your email address and we'll log a secure password-reset link to the server console log files.
            </p>
            
            {error && <p style={{ color: 'var(--danger)', marginBottom: '1.2rem', textAlign: 'center', fontSize: '0.875rem', background: 'rgba(239, 68, 68, 0.08)', padding: '0.5rem', borderRadius: '6px' }}>{error}</p>}
            {success && <p style={{ color: 'var(--secondary)', marginBottom: '1.2rem', textAlign: 'center', fontSize: '0.875rem', background: 'rgba(16, 185, 129, 0.08)', padding: '0.6rem', borderRadius: '6px', fontWeight: 500 }}>{success}</p>}
            
            <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Email Address</label>
                <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className="input-field" placeholder="yourname@naam.org" required />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>Request Reset Link</button>
            </form>
            
            <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <button onClick={() => { setIsForgot(false); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                ← Back to Login
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
