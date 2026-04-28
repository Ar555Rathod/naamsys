import React, { useState, useEffect } from 'react';
import { PlusCircle, HeartHandshake, Edit, Trash2 } from 'lucide-react';
import api from '../api';

export default function Donors() {
  const [donors, setDonors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const [name, setName] = useState('');
  const [pan, setPan] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [budget, setBudget] = useState('');

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    try {
      const res = await api.get('/donors');
      setDonors(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.put(`/donors/${editId}`, { name, pan, contact, email, budget });
      } else {
        await api.post('/donors', { name, pan, contact, email, budget });
      }
      resetForm();
      fetchDonors();
    } catch (err) {
      alert('Failed to save donor');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this donor?')) {
      try {
        await api.delete(`/donors/${id}`);
        fetchDonors();
      } catch (err) {
        alert('Failed to delete donor. Make sure no projects are linked to it.');
      }
    }
  };

  const handleEdit = (d) => {
    setEditMode(true);
    setEditId(d.id);
    setName(d.name);
    setPan(d.pan || '');
    setContact(d.contact || '');
    setEmail(d.email || '');
    setBudget(d.budget);
    setShowForm(true);
  };

  const resetForm = () => {
    setEditMode(false);
    setEditId(null);
    setName(''); setPan(''); setContact(''); setEmail(''); setBudget('');
    setShowForm(false);
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Individual Donors / Partners</h1>
        <button className="btn btn-primary" onClick={() => { if(showForm) resetForm(); else setShowForm(true); }}>
          <PlusCircle size={18} /> {showForm ? 'Cancel' : 'Register Donor'}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>{editMode ? 'Edit Donor' : 'Register New Donor'}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Full Name / Entity Name</label>
              <input type="text" value={name} onChange={e=>setName(e.target.value)} className="input-field" required />
            </div>
            <div className="form-group">
              <label>PAN Number</label>
              <input type="text" value={pan} onChange={e=>setPan(e.target.value)} className="input-field" />
            </div>
            <div className="form-group">
              <label>Contact Number</label>
              <input type="text" value={contact} onChange={e=>setContact(e.target.value)} className="input-field" />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="input-field" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Total Budget / Committed Fund (₹)</label>
              <input type="number" value={budget} onChange={e=>setBudget(e.target.value)} className="input-field" required />
              {editMode && <small style={{ color: 'var(--warning)' }}>Warning: Editing the total budget will automatically adjust the remaining budget.</small>}
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary">{editMode ? 'Update Donor' : 'Register Donor'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Donor ID</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Total Budget</th>
              <th>Budget Remaining</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {donors.map(d => (
              <tr key={d.id}>
                <td style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HeartHandshake size={16} color="var(--primary)" /> {d.donor_id}
                </td>
                <td>{d.name}</td>
                <td>{d.contact} <br/><small>{d.email}</small></td>
                <td>₹{d.budget.toLocaleString()}</td>
                <td style={{ color: d.budget_remaining < d.budget * 0.2 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                  ₹{d.budget_remaining.toLocaleString()}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleEdit(d)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}>
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(d.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {donors.length === 0 && <tr><td colSpan="6" style={{textAlign:'center'}}>No donors registered yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
