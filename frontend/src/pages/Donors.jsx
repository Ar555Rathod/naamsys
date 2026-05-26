import React, { useState, useEffect } from 'react';
import { PlusCircle, HeartHandshake, Edit, Trash2, User, Mail, Phone, Edit3, XCircle, FolderKanban, Info } from 'lucide-react';
import api from '../api';

export default function Donors() {
  const [donors, setDonors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [donorProjects, setDonorProjects] = useState([]);

  const [name, setName] = useState('');
  const [pan, setPan] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [budget, setBudget] = useState('');

  const handleRowClick = async (donor) => {
    try {
      const res = await api.get(`/donors/${donor.id}`);
      setSelectedDonor(res.data);
      setDonorProjects(res.data.projects || []);
    } catch (err) {
      console.error('Failed to fetch donor details', err);
    }
  };

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
        await api.put(`/donors/${editId}`, { name, pan, contact, email, budget: parseFloat(budget) });
      } else {
        await api.post('/donors', { name, pan, contact, email, budget: parseFloat(budget) });
      }
      resetForm();
      fetchDonors();
      if (selectedDonor && selectedDonor.id === editId) {
        setSelectedDonor(null);
      }
    } catch (err) {
      alert('Failed to save donor');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this donor?')) {
      try {
        await api.delete(`/donors/${id}`);
        fetchDonors();
        if (selectedDonor && selectedDonor.id === id) {
          setSelectedDonor(null);
        }
      } catch (err) {
        alert('Failed to delete donor. Make sure no projects are linked to it.');
      }
    }
  };

  const handleEdit = (e, d) => {
    e.stopPropagation();
    setEditMode(true);
    setEditId(d.id);
    setName(d.name);
    setPan(d.pan || '');
    setContact(d.contact || '');
    setEmail(d.email || '');
    setBudget(d.budget.toString());
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
              <th style={{textAlign: 'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {donors.map(d => (
              <tr key={d.id} onClick={() => handleRowClick(d)} style={{ cursor: 'pointer' }} className="hover-row">
                <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <HeartHandshake size={16} /> {d.donor_id}
                  </div>
                </td>
                <td style={{ fontWeight: 500 }}>{d.name}</td>
                <td>{d.contact} <br/><small style={{color:'var(--text-muted)'}}>{d.email}</small></td>
                <td>₹{d.budget.toLocaleString()}</td>
                <td style={{ color: d.budget_remaining < d.budget * 0.2 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                  ₹{d.budget_remaining.toLocaleString()}
                </td>
                <td style={{textAlign: 'center'}} onClick={e=>e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button onClick={(e) => handleEdit(e, d)} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', gap: '0.25rem', background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)' }}>
                      <Edit size={13} /> Edit
                    </button>
                    <button onClick={(e) => handleDelete(e, d.id)} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', gap: '0.25rem', background: 'rgba(239, 68, 68, 0.08)', color: 'var(--danger)' }}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {donors.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', padding: '2rem', color: 'var(--text-muted)'}}>No donors registered yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* GORGEOUS HIGH-FIDELITY VIEW DETAILS MODAL */}
      {selectedDonor && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', padding: '2.5rem', position: 'relative' }}>
            
            <button 
              onClick={() => setSelectedDonor(null)} 
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <XCircle size={24} />
            </button>

            {/* Branding Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HeartHandshake size={26} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{selectedDonor.name}</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Donor Reference Code: {selectedDonor.donor_id}</span>
              </div>
            </div>

            {/* Financial Grid Card Dashboard */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>MoU Total Allocation</span>
                <strong style={{ display: 'block', fontSize: '1.25rem', marginTop: '0.25rem' }}>₹{selectedDonor.budget.toLocaleString()}</strong>
              </div>
              <div style={{ background: 'rgba(79, 70, 229, 0.05)', border: '1px solid rgba(79, 70, 229, 0.2)', padding: '1rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em', fontWeight: 600 }}>Remaining Committed Fund</span>
                <strong style={{ display: 'block', fontSize: '1.25rem', marginTop: '0.25rem', color: 'var(--success)' }}>₹{selectedDonor.budget_remaining.toLocaleString()}</strong>
              </div>
            </div>

            {/* Details and Contact Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={16} color="var(--primary)" /> Primary Contact Details
                </h3>
                <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-main)' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Representative: </span>
                    <strong>{selectedDonor.name}</strong>
                  </div>
                  {selectedDonor.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Mail size={14} color="var(--text-muted)" /> <span>{selectedDonor.email}</span>
                    </div>
                  )}
                  {selectedDonor.contact && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Phone size={14} color="var(--text-muted)" /> <span>{selectedDonor.contact}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Info size={16} color="var(--primary)" /> Registration Info
                </h3>
                <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>PAN Card Reference: </span>
                    <strong>{selectedDonor.pan || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Registered At: </span>
                    <span>{new Date(selectedDonor.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* List of Projects funded by this Donor */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FolderKanban size={16} color="var(--primary)" /> Funded Projects
              </h3>
              {donorProjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No active projects funded by this donor yet.
                </div>
              ) : (
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead>
                      <tr style={{background: 'rgba(0,0,0,0.02)'}}>
                        <th style={{fontSize: '0.75rem', padding: '0.5rem 1rem'}}>Project ID</th>
                        <th style={{fontSize: '0.75rem', padding: '0.5rem 1rem'}}>Project Name</th>
                        <th style={{fontSize: '0.75rem', padding: '0.5rem 1rem', textAlign: 'right'}}>Project Budget</th>
                        <th style={{fontSize: '0.75rem', padding: '0.5rem 1rem'}}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donorProjects.map(p => (
                        <tr key={p.id}>
                          <td style={{fontSize: '0.8rem', padding: '0.5rem 1rem', fontWeight: 500}}>{p.project_id}</td>
                          <td style={{fontSize: '0.8rem', padding: '0.5rem 1rem'}}>{p.name}</td>
                          <td style={{fontSize: '0.8rem', padding: '0.5rem 1rem', textAlign: 'right', fontWeight: 600}}>₹{p.budget.toLocaleString()}</td>
                          <td style={{fontSize: '0.8rem', padding: '0.5rem 1rem'}}>
                            <span className="badge badge-success" style={{fontSize: '0.7rem', padding: '0.15rem 0.4rem'}}>{p.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={(e) => { const temp = selectedDonor; setSelectedDonor(null); handleEdit(e, temp); }} 
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.25rem', gap: '0.25rem' }}
              >
                <Edit3 size={16} /> Edit Details
              </button>
              <button 
                onClick={() => setSelectedDonor(null)} 
                className="btn"
                style={{ background: 'rgba(0,0,0,0.08)', padding: '0.5rem 1.25rem' }}
              >
                Close
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
