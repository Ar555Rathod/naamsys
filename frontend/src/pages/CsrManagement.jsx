import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Building, User, Mail, Phone, IndianRupee, Edit3, XCircle, FolderKanban, Info } from 'lucide-react';
import api from '../api';

export default function CsrManagement() {
  const [csrs, setCsrs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCsr, setSelectedCsr] = useState(null);
  const [csrProjects, setCsrProjects] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [admin_cost_type, setAdminCostType] = useState('PERCENT'); // 'PERCENT' or 'RUPEE'
  const [admin_cost_value, setAdminCostValue] = useState('');
  const [contact_person, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleRowClick = async (csr) => {
    try {
      const res = await api.get(`/csr/${csr.id}`);
      setSelectedCsr(res.data);
      setCsrProjects(res.data.projects || []);
    } catch (err) {
      console.error('Failed to fetch CSR details', err);
    }
  };

  const handleEditClick = (e, csr) => {
    e.stopPropagation(); // prevent modal opening
    setIsEditing(true);
    setEditId(csr.id);
    setName(csr.name);
    setBudget(csr.budget.toString());
    setAdminCostType(csr.admin_cost_type || 'PERCENT');
    setAdminCostValue(csr.admin_cost_value?.toString() || '0');
    setContactPerson(csr.contact_person || '');
    setEmail(csr.email || '');
    setPhone(csr.phone || '');
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        budget: parseFloat(budget),
        admin_cost_type,
        admin_cost_value: parseFloat(admin_cost_value) || 0,
        contact_person,
        email,
        phone
      };

      if (isEditing) {
        await api.put(`/csr/${editId}`, payload);
        alert('CSR Company updated successfully!');
      } else {
        await api.post('/csr', payload);
        alert('CSR Company registered successfully!');
      }
      
      // Reset
      setShowForm(false);
      setIsEditing(false);
      setEditId(null);
      setName(''); setBudget(''); setContactPerson(''); setEmail(''); setPhone('');
      setAdminCostType('PERCENT'); setAdminCostValue('');
      fetchCsrs();
      
      // If modal was open, refresh it or close it
      if (selectedCsr && selectedCsr.id === editId) {
        setSelectedCsr(null);
      }
    } catch (err) {
      alert('Failed to save CSR Partner');
    }
  };

  const originalBudget = parseFloat(budget) || 0;
  const adminCostVal = parseFloat(admin_cost_value) || 0;
  const computedAdminCost = admin_cost_type === 'PERCENT' ? (originalBudget * adminCostVal) / 100 : adminCostVal;
  const computedAvailableBudget = originalBudget - computedAdminCost;

  const filteredCsrs = csrs.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.csr_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">CSR Funding Partners</h1>
        <button className="btn btn-primary" onClick={() => {
          setIsEditing(false);
          setEditId(null);
          setName(''); setBudget(''); setContactPerson(''); setEmail(''); setPhone('');
          setAdminCostType('PERCENT'); setAdminCostValue('');
          setShowForm(!showForm);
        }}>
          <PlusCircle size={18} /> {showForm ? 'Cancel' : 'Register CSR'}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>
            {isEditing ? 'Edit CSR Company Details' : 'Register New CSR Company'}
          </h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Company Name</label>
              <input type="text" value={name} onChange={e=>setName(e.target.value)} className="input-field" placeholder="e.g. Tata Trusts" required />
            </div>
            <div className="form-group">
              <label>Total MoU Budget (₹)</label>
              <input type="number" value={budget} onChange={e=>setBudget(e.target.value)} className="input-field" placeholder="e.g. 10000000" required />
            </div>
            
            <div className="form-group">
              <label>Admin Cost Option</label>
              <select value={admin_cost_type} onChange={e=>{setAdminCostType(e.target.value); setAdminCostValue('');}} className="input-field">
                <option value="PERCENT">Percentage (%)</option>
                <option value="RUPEE">Rupees (₹)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Admin Cost Value {admin_cost_type === 'PERCENT' ? '(%)' : '(₹)'}</label>
              <input 
                type="number" 
                value={admin_cost_value} 
                onChange={e=>setAdminCostValue(e.target.value)} 
                className="input-field" 
                placeholder={admin_cost_type === 'PERCENT' ? 'e.g. 5' : 'e.g. 50000'} 
                required 
              />
            </div>

            {/* Premium Budget Preview Widget */}
            <div className="form-group" style={{ gridColumn: '1 / -1', background: 'rgba(79, 70, 229, 0.04)', padding: '1.25rem', borderRadius: '8px', borderLeft: '4px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Calculated Admin Cost:</span>
                <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>₹{computedAdminCost.toLocaleString()}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Available Project Budget:</span>
                <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--success)', marginTop: '0.25rem' }}>₹{computedAvailableBudget.toLocaleString()}</strong>
              </div>
            </div>

            <div className="form-group">
              <label>Contact Person</label>
              <input type="text" value={contact_person} onChange={e=>setContactPerson(e.target.value)} className="input-field" placeholder="e.g. John Doe" required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="input-field" placeholder="e.g. contact@tatatrusts.org" required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" value={phone} onChange={e=>setPhone(e.target.value)} className="input-field" placeholder="e.g. +91 9876543210" required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">{isEditing ? 'Update CSR' : 'Save CSR Partner'}</button>
              {isEditing && (
                <button type="button" className="btn" style={{background: 'rgba(0,0,0,0.08)'}} onClick={() => {
                  setIsEditing(false);
                  setEditId(null);
                  setShowForm(false);
                }}>Cancel</button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* CSR Listing Panel */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search CSR partners by company name, ID or contact person..." 
            value={searchTerm}
            onChange={e=>setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', width: '100%', fontFamily: 'Inter' }} 
          />
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>CSR ID</th>
              <th>Company Name</th>
              <th>Total MoU Budget</th>
              <th>Available Budget</th>
              <th>Remaining Budget</th>
              <th>Contact Person</th>
              <th style={{textAlign: 'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCsrs.map(c => (
              <tr key={c.id} onClick={() => handleRowClick(c)} style={{ cursor: 'pointer' }} className="hover-row">
                <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building size={16} /> {c.csr_id}
                  </div>
                </td>
                <td style={{ fontWeight: 500 }}>{c.name}</td>
                <td>₹{c.budget.toLocaleString()}</td>
                <td style={{color: 'var(--success)', fontWeight: 500}}>₹{(c.available_budget || c.budget).toLocaleString()}</td>
                <td style={{fontWeight: 600}}>₹{c.budget_remaining.toLocaleString()}</td>
                <td>{c.contact_person}</td>
                <td style={{textAlign: 'center'}} onClick={e=>e.stopPropagation()}>
                  <button 
                    onClick={(e) => handleEditClick(e, c)} 
                    className="btn" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', gap: '0.25rem', background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)' }}
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                </td>
              </tr>
            ))}
            {filteredCsrs.length === 0 && (
              <tr>
                <td colSpan="7" style={{textAlign:'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No CSR companies matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* GORGEOUS HIGH-FIDELITY VIEW DETAILS MODAL */}
      {selectedCsr && (() => {
        const availBudget = selectedCsr.available_budget && selectedCsr.available_budget > 0 
          ? selectedCsr.available_budget 
          : (selectedCsr.budget - (selectedCsr.admin_cost_amount || 0));
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', padding: '2.5rem', position: 'relative' }}>
              
              <button 
                onClick={() => setSelectedCsr(null)} 
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <XCircle size={24} />
              </button>

              {/* Branding Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building size={26} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{selectedCsr.name}</h2>
                  <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>CSR Reference Number: {selectedCsr.csr_id}</span>
                </div>
              </div>

              {/* Financial Grid Card Dashboard */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>MoU Total Budget</span>
                  <strong style={{ display: 'block', fontSize: '1.25rem', marginTop: '0.25rem' }}>₹{selectedCsr.budget.toLocaleString()}</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Admin Deducted ({selectedCsr.admin_cost_type === 'PERCENT' ? `${selectedCsr.admin_cost_value}%` : 'Fixed'})</span>
                  <strong style={{ display: 'block', fontSize: '1.25rem', marginTop: '0.25rem', color: 'var(--danger)' }}>- ₹{selectedCsr.admin_cost_amount?.toLocaleString() || '0'}</strong>
                </div>
                <div style={{ background: 'rgba(79, 70, 229, 0.05)', border: '1px solid rgba(79, 70, 229, 0.2)', padding: '1rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em', fontWeight: 600 }}>Remaining Available</span>
                  <strong style={{ display: 'block', fontSize: '1.25rem', marginTop: '0.25rem', color: 'var(--success)' }}>₹{selectedCsr.budget_remaining.toLocaleString()}</strong>
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
                      <strong>{selectedCsr.contact_person}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Mail size={14} color="var(--text-muted)" /> <span>{selectedCsr.email}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Phone size={14} color="var(--text-muted)" /> <span>{selectedCsr.phone}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Info size={16} color="var(--primary)" /> Budget Overview Info
                  </h3>
                  <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Net Available Budget: </span>
                      <strong style={{color: 'var(--success)'}}>₹{availBudget.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Allocated to Projects: </span>
                      <strong>₹{(availBudget - selectedCsr.budget_remaining).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Registered At: </span>
                      <span>{new Date(selectedCsr.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* List of Projects funded by this CSR Partner */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FolderKanban size={16} color="var(--primary)" /> Linked Allocated Projects
                </h3>
                {csrProjects.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No active projects funded by this partner yet.
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
                        {csrProjects.map(p => (
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
                  onClick={(e) => { setSelectedCsr(null); handleEditClick(e, selectedCsr); }} 
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1.25rem', gap: '0.25rem' }}
                >
                  <Edit3 size={16} /> Edit Details
                </button>
                <button 
                  onClick={() => setSelectedCsr(null)} 
                  className="btn"
                  style={{ background: 'rgba(0,0,0,0.08)', padding: '0.5rem 1.25rem' }}
                >
                  Close
                </button>
              </div>
              
            </div>
          </div>
        );
      })()}

    </div>
  );
}
