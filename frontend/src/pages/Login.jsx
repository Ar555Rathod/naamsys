import React, { useState } from 'react';
import api from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('naam_token', res.data.token);
      onLogin();
    } catch (err) {
      setError('Invalid credentials or setup required');
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
      <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>NAAM Login</h2>
        {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>Login</button>
        </form>
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button onClick={handleSetup} className="btn" style={{ fontSize: '0.875rem' }}>First time? Run System Setup</button>
        </div>
      </div>
    </div>
  );
}
