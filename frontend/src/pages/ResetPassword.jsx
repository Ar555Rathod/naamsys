import React, { useState } from 'react';
import api from '../api';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Invalid reset link: Missing verification token.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { token, password });
      setSuccess(res.data.message);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-light)' }}>
      <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '420px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
          Create New Password
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          Please enter your secure new password credentials below.
        </p>

        {error && <p style={{ color: 'var(--danger)', marginBottom: '1.2rem', textAlign: 'center', fontSize: '0.875rem', background: 'rgba(239, 68, 68, 0.08)', padding: '0.5rem', borderRadius: '6px' }}>{error}</p>}
        {success && (
          <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
            <p style={{ color: 'var(--secondary)', fontSize: '0.875rem', background: 'rgba(16, 185, 129, 0.08)', padding: '0.6rem', borderRadius: '6px', fontWeight: 500, marginBottom: '1rem' }}>{success}</p>
            <a href="/" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block', width: '100%' }}>Go to Login Page</a>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>New Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="input-field" 
                placeholder="Minimum 6 characters" 
                required 
                disabled={loading}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Confirm Password</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                className="input-field" 
                placeholder="Confirm password" 
                required 
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} disabled={loading}>
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
