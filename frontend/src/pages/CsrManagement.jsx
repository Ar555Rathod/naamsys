import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Building } from 'lucide-react';
import api from '../api';

export default function CsrManagement() {
  const [showForm, setShowForm] = useState(false);
  const [csrs, setCsrs] = useState([]);
  
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [contact_person, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    fetchCsrs();
  }, []);

  const fetchCsrs = async () => {
    try {
      const res = await api.get('/csr');
      setCsrs(res.data);
    } catch (err) {
      console.error('Failed to fetch CSRs', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/csr', {
        name,
        budget: parseFloat(budget),
        contact_person,
        email,
        phone
      });
      setShowForm(false);
      setName(''); setBudget(''); setContactPerson(''); setEmail(''); setPhone('');
      fetchCsrs();
    } catch (err) {
      alert('Failed to register CSR Company');
    }
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">CSR Funding Partners</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <PlusCircle size={18} /> {showForm ? 'Cancel' : 'Register CSR'}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Register New CSR Company</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Company Name</label>
              <input type="text" value={name} onChange={e=>setName(e.target.value)} className="input-field" required />
            </div>
            <div className="form-group">
              <label>Allocated Budget (₹)</label>
              <input type="number" value={budget} onChange={e=>setBudget(e.target.value)} className="input-field" required />
            </div>
            <div className="form-group">
              <label>Contact Person</label>
              <input type="text" value={contact_person} onChange={e=>setContactPerson(e.target.value)} className="input-field" required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="input-field" required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" value={phone} onChange={e=>setPhone(e.target.value)} className="input-field" required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary">Save CSR Partner</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>CSR ID</th>
              <th>Company Name</th>
              <th>Total Budget</th>
              <th>Contact Person</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {csrs.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building size={16} color="var(--primary)" /> {c.csr_id}
                </td>
                <td>{c.name}</td>
                <td>₹{parseFloat(c.budget).toLocaleString()}</td>
                <td>{c.contact_person}</td>
                <td>
                  <span className="badge badge-success">Active</span>
                </td>
              </tr>
            ))}
            {csrs.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>No CSR companies registered yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
