import React, { useState, useEffect } from 'react';
import { PlusCircle, Landmark, Edit, Trash2, User, Mail, Phone, Edit3, XCircle, FolderKanban, Info, IndianRupee } from 'lucide-react';
import api from '../api';

export default function GovtSchemes() {
  const [showForm, setShowForm] = useState(false);
  const [showWOForm, setShowWOForm] = useState(false);
  const [selectedSchemeId, setSelectedSchemeId] = useState(null);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [schemes, setSchemes] = useState([]);
  
  const [scheme_dept, setSchemeDept] = useState('');
  const [type_of_work, setTypeOfWork] = useState('Road Construction');
  const [sub_type, setSubType] = useState('');
  
  const [budget, setBudget] = useState('');
  const [admin_cost_type, setAdminCostType] = useState('PERCENT'); // 'PERCENT' or 'RUPEE'
  const [admin_cost_value, setAdminCostValue] = useState('');
  const [contact_person, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [district_id, setDistrictId] = useState('');
  const [taluka_id, setTalukaId] = useState('');
  const [village_id, setVillageId] = useState('');

  const [locations, setLocations] = useState([]);
  const [availableTalukas, setAvailableTalukas] = useState([]);
  const [availableVillages, setAvailableVillages] = useState([]);

  const [wo_number, setWoNumber] = useState('');
  const [wo_budget, setWoBudget] = useState('');
  const [wo_desc, setWoDesc] = useState('');

  const handleRowClick = async (scheme) => {
    try {
      const res = await api.get(`/govt/${scheme.id}`);
      setSelectedScheme(res.data);
    } catch (err) {
      console.error('Failed to fetch scheme details', err);
    }
  };

  useEffect(() => {
    fetchSchemes();
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await api.get('/locations');
      setLocations(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchSchemes = async () => {
    try {
      const res = await api.get('/govt');
      setSchemes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateScheme = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        scheme_dept, 
        type_of_work, 
        sub_type,
        budget: parseFloat(budget) || 0,
        admin_cost_type,
        admin_cost_value: parseFloat(admin_cost_value) || 0,
        contact_person,
        email,
        phone,
        district_id: district_id ? parseInt(district_id) : null,
        taluka_id: taluka_id ? parseInt(taluka_id) : null,
        village_id: village_id ? parseInt(village_id) : null
      };

      if (editMode) {
        await api.put(`/govt/${editId}`, payload);
        alert('Government scheme updated successfully!');
      } else {
        await api.post('/govt', payload);
        alert('Government scheme registered successfully!');
      }

      resetForm();
      fetchSchemes();
      if (selectedScheme && selectedScheme.id === editId) {
        setSelectedScheme(null);
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to save scheme';
      alert(`Failed to save scheme: ${errMsg}`);
    }
  };

  const handleCreateWO = async (e) => {
    e.preventDefault();
    try {
      const parsedBudget = parseFloat(wo_budget);
      const parentScheme = schemes.find(s => s.id === selectedSchemeId);
      if (parentScheme && parentScheme.budget_remaining < parsedBudget) {
        alert(`Insufficient budget remaining in the Government Scheme! Available: ₹${parentScheme.budget_remaining.toLocaleString()}`);
        return;
      }

      await api.post(`/govt/${selectedSchemeId}/work-orders`, {
        work_order_number: wo_number,
        budget: parsedBudget,
        description: wo_desc
      });
      setShowWOForm(false);
      setWoNumber(''); setWoBudget(''); setWoDesc('');
      alert('Work Order added successfully!');
      fetchSchemes();
      
      // Refresh details modal
      if (selectedScheme && selectedScheme.id === selectedSchemeId) {
        const res = await api.get(`/govt/${selectedSchemeId}`);
        setSelectedScheme(res.data);
      }
    } catch (err) {
      alert('Failed to add Work Order');
    }
  };

  const handleEdit = (e, s) => {
    e.stopPropagation();
    setEditMode(true);
    setEditId(s.id);
    setSchemeDept(s.scheme_dept);
    setTypeOfWork(s.type_of_work);
    setSubType(s.sub_type || '');
    setBudget(s.budget ? s.budget.toString() : '');
    setAdminCostType(s.admin_cost_type || 'PERCENT');
    setAdminCostValue(s.admin_cost_value ? s.admin_cost_value.toString() : '');
    setContactPerson(s.contact_person || '');
    setEmail(s.email || '');
    setPhone(s.phone || '');
    setDistrictId(s.district_id?.toString() || '');
    
    if (s.district_id) {
      const district = locations.find(d => d.id === s.district_id);
      setAvailableTalukas(district ? district.talukas : []);
      if (s.taluka_id && district) {
        const taluka = district.talukas.find(t => t.id === s.taluka_id);
        setAvailableVillages(taluka ? taluka.villages : []);
      }
    }
    setTalukaId(s.taluka_id?.toString() || '');
    setVillageId(s.village_id?.toString() || '');
    setShowForm(true);
    setShowWOForm(false);
  };

  const resetForm = () => {
    setEditMode(false);
    setEditId(null);
    setSchemeDept(''); setSubType(''); setDistrictId(''); setTalukaId(''); setVillageId('');
    setBudget(''); setAdminCostType('PERCENT'); setAdminCostValue('');
    setContactPerson(''); setEmail(''); setPhone('');
    setAvailableTalukas([]); setAvailableVillages([]);
    setShowForm(false);
  };

  const originalBudget = parseFloat(budget) || 0;
  const adminCostVal = parseFloat(admin_cost_value) || 0;
  const computedAdminCost = admin_cost_type === 'PERCENT' ? (originalBudget * adminCostVal) / 100 : adminCostVal;
  const computedAvailableBudget = originalBudget - computedAdminCost;

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Government Schemes</h1>
        <button className="btn btn-primary" onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}>
          <PlusCircle size={18} /> {showForm ? 'Cancel' : 'New Scheme'}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>{editMode ? 'Edit Government Scheme' : 'Register Government Scheme'}</h2>
          <form onSubmit={handleCreateScheme} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Department Name</label>
              <input type="text" value={scheme_dept} onChange={e=>setSchemeDept(e.target.value)} className="input-field" placeholder="e.g. Zilla Parishad" required />
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
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="input-field" placeholder="e.g. contact@gov.in" required />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" value={phone} onChange={e=>setPhone(e.target.value)} className="input-field" placeholder="e.g. +91 9876543210" required />
            </div>

            <div className="form-group">
              <label>Type of Work</label>
              <select value={type_of_work} onChange={e=>setTypeOfWork(e.target.value)} className="input-field">
                <option>Road Construction</option>
                <option>Water Conservation</option>
                <option>Infrastructure</option>
              </select>
            </div>

            <div className="form-group">
              <label>Sub Type / Details</label>
              <input type="text" value={sub_type} onChange={e=>setSubType(e.target.value)} className="input-field" placeholder="e.g. Concrete Road Building" required />
            </div>

            <div className="form-group">
              <label>District</label>
              <select value={district_id} onChange={e => {
                setDistrictId(e.target.value);
                setTalukaId(''); setVillageId('');
                const district = locations.find(d => d.id === parseInt(e.target.value));
                setAvailableTalukas(district ? district.talukas : []);
                setAvailableVillages([]);
              }} className="input-field">
                <option value="">-- Select District --</option>
                {locations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Taluka</label>
              <select value={taluka_id} onChange={e => {
                setTalukaId(e.target.value);
                setVillageId('');
                const taluka = availableTalukas.find(t => t.id === parseInt(e.target.value));
                setAvailableVillages(taluka ? taluka.villages : []);
              }} className="input-field" disabled={!district_id}>
                <option value="">-- Select Taluka --</option>
                {availableTalukas.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Village</label>
              <select value={village_id} onChange={e=>setVillageId(e.target.value)} className="input-field" disabled={!taluka_id}>
                <option value="">-- Select Village --</option>
                {availableVillages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary">{editMode ? 'Update Scheme' : 'Save Scheme'}</button>
              {editMode && (
                <button type="button" className="btn" style={{background: 'rgba(0,0,0,0.08)'}} onClick={resetForm}>Cancel</button>
              )}
            </div>
          </form>
        </div>
      )}

      {showWOForm && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--primary)' }}>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Add Work Order to Scheme</h2>
          <form onSubmit={handleCreateWO} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Work Order Number</label>
              <input type="text" value={wo_number} onChange={e=>setWoNumber(e.target.value)} className="input-field" required />
            </div>
            <div className="form-group">
              <label>Allocated Budget (₹)</label>
              <input type="number" value={wo_budget} onChange={e=>setWoBudget(e.target.value)} className="input-field" required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <input type="text" value={wo_desc} onChange={e=>setWoDesc(e.target.value)} className="input-field" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">Save Work Order</button>
              <button type="button" className="btn" onClick={() => setShowWOForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Scheme ID</th>
              <th>Department</th>
              <th>Type of Work</th>
              <th style={{textAlign: 'right'}}>Total MoU Budget</th>
              <th style={{textAlign: 'right'}}>Available Budget</th>
              <th style={{textAlign: 'right'}}>Remaining Budget</th>
              <th style={{textAlign: 'center'}}>Work Orders</th>
              <th style={{textAlign: 'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schemes.map(s => {
              const totalMoUBudget = s.budget || 0;
              const availableBudget = s.available_budget || totalMoUBudget;
              const remainingBudget = s.budget_remaining || 0;
              return (
                <tr key={s.id} onClick={() => handleRowClick(s)} style={{ cursor: 'pointer' }} className="hover-row">
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Landmark size={16} /> {s.govt_id}
                    </div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{s.scheme_dept}</td>
                  <td>{s.type_of_work} <br/><small style={{color:'var(--text-muted)'}}>{s.sub_type}</small></td>
                  <td style={{textAlign: 'right'}}>₹{totalMoUBudget.toLocaleString()}</td>
                  <td style={{textAlign: 'right', color: 'var(--success)', fontWeight: 500}}>₹{availableBudget.toLocaleString()}</td>
                  <td style={{textAlign: 'right', fontWeight: 600}}>₹{remainingBudget.toLocaleString()}</td>
                  <td style={{textAlign: 'center'}}>
                    <span className="badge badge-success" style={{background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)'}}>
                      {s.work_orders?.length || 0} Orders
                    </span>
                  </td>
                  <td style={{textAlign: 'center'}} onClick={e=>e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button 
                         className="btn" 
                         style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', gap: '0.25rem', background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)' }}
                         onClick={(e) => handleEdit(e, s)}
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      <button 
                         className="btn btn-primary" 
                         style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', gap: '0.25rem' }}
                         onClick={() => { setSelectedSchemeId(s.id); setShowWOForm(true); setShowForm(false); }}
                      >
                        + Add WO
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {schemes.length === 0 && <tr><td colSpan="8" style={{textAlign:'center', padding: '2rem', color: 'var(--text-muted)'}}>No Govt Schemes registered yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* GORGEOUS HIGH-FIDELITY VIEW DETAILS MODAL */}
      {selectedScheme && (() => {
        const totalBudget = selectedScheme.budget || 0;
        const adminCostAmount = selectedScheme.admin_cost_amount || 0;
        const availableBudget = selectedScheme.available_budget || totalBudget;
        const remainingBudget = selectedScheme.budget_remaining || 0;
        
        // Find all projects linked to this scheme's work orders
        const linkedProjects = selectedScheme.work_orders?.flatMap(wo => 
          wo.projects?.map(proj => ({
            ...proj,
            wo_number: wo.work_order_number
          })) || []
        ) || [];

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', padding: '2.5rem', position: 'relative' }}>
              
              <button 
                onClick={() => setSelectedScheme(null)} 
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <XCircle size={24} />
              </button>

              {/* Branding Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Landmark size={26} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{selectedScheme.scheme_dept}</h2>
                  <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Government ID: {selectedScheme.govt_id}</span>
                </div>
              </div>

              {/* Financial Grid Card Dashboard */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>MoU Budget</span>
                  <strong style={{ display: 'block', fontSize: '1.1rem', marginTop: '0.25rem' }}>₹{totalBudget.toLocaleString()}</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Admin Deducted ({selectedScheme.admin_cost_type === 'PERCENT' ? `${selectedScheme.admin_cost_value}%` : 'Fixed'})</span>
                  <strong style={{ display: 'block', fontSize: '1.1rem', marginTop: '0.25rem', color: 'var(--danger)' }}>- ₹{adminCostAmount.toLocaleString()}</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Available Budget</span>
                  <strong style={{ display: 'block', fontSize: '1.1rem', marginTop: '0.25rem', color: 'var(--success)', fontWeight: 500 }}>₹{availableBudget.toLocaleString()}</strong>
                </div>
                <div style={{ background: 'rgba(79, 70, 229, 0.05)', border: '1px solid rgba(79, 70, 229, 0.2)', padding: '1rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em', fontWeight: 600 }}>Remaining Balance</span>
                  <strong style={{ display: 'block', fontSize: '1.15rem', marginTop: '0.25rem', color: 'var(--primary)' }}>₹{remainingBudget.toLocaleString()}</strong>
                </div>
              </div>

              {/* Details, Location, and Representative Contact Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Info size={16} color="var(--primary)" /> Specifications
                  </h3>
                  <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-main)' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Department: </span>
                      <strong style={{ display: 'block', marginTop: '0.15rem' }}>{selectedScheme.scheme_dept}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Work Category: </span>
                      <strong style={{ display: 'block', marginTop: '0.15rem' }}>{selectedScheme.type_of_work}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Sub-type / Details: </span>
                      <span style={{ display: 'block', marginTop: '0.15rem' }}>{selectedScheme.sub_type || '—'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Landmark size={16} color="var(--primary)" /> Location Context
                  </h3>
                  <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>District: </span>
                      <strong style={{ display: 'block', marginTop: '0.15rem' }}>{selectedScheme.district_name || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Taluka: </span>
                      <strong style={{ display: 'block', marginTop: '0.15rem' }}>{selectedScheme.taluka_name || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Village: </span>
                      <strong style={{ display: 'block', marginTop: '0.15rem' }}>{selectedScheme.village_name || '—'}</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={16} color="var(--primary)" /> Representative
                  </h3>
                  <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Contact Person: </span>
                      <strong style={{ display: 'block', marginTop: '0.15rem' }}>{selectedScheme.contact_person || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Email Address: </span>
                      <strong style={{ display: 'block', marginTop: '0.15rem', wordBreak: 'break-all' }}>{selectedScheme.email || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Phone Number: </span>
                      <strong style={{ display: 'block', marginTop: '0.15rem' }}>{selectedScheme.phone || '—'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* List of Government Work Orders under this Scheme */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FolderKanban size={16} color="var(--primary)" /> Linked Government Work Orders
                  </h3>
                  <button 
                    onClick={() => { setSelectedSchemeId(selectedScheme.id); setShowWOForm(true); setShowForm(false); }}
                    className="btn btn-primary"
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', gap: '0.25rem' }}
                  >
                    + Add WO
                  </button>
                </div>
                {(!selectedScheme.work_orders || selectedScheme.work_orders.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No work orders linked to this scheme yet.
                  </div>
                ) : (
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <table className="data-table" style={{ margin: 0 }}>
                      <thead>
                        <tr style={{background: 'rgba(0,0,0,0.02)'}}>
                          <th style={{fontSize: '0.75rem', padding: '0.5rem 1rem'}}>WO Number</th>
                          <th style={{fontSize: '0.75rem', padding: '0.5rem 1rem', textAlign: 'right'}}>Total Budget</th>
                          <th style={{fontSize: '0.75rem', padding: '0.5rem 1rem', textAlign: 'right'}}>Remaining</th>
                          <th style={{fontSize: '0.75rem', padding: '0.5rem 1rem'}}>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedScheme.work_orders.map(wo => (
                          <tr key={wo.id}>
                            <td style={{fontSize: '0.8rem', padding: '0.5rem 1rem', fontWeight: 600, color: 'var(--primary)'}}>{wo.work_order_number}</td>
                            <td style={{fontSize: '0.8rem', padding: '0.5rem 1rem', textAlign: 'right', fontWeight: 500}}>₹{wo.budget.toLocaleString()}</td>
                            <td style={{fontSize: '0.8rem', padding: '0.5rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--success)'}}>₹{wo.budget_remaining.toLocaleString()}</td>
                            <td style={{fontSize: '0.8rem', padding: '0.5rem 1rem'}}>{wo.description || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* List of Projects Converted from WOs */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FolderKanban size={16} color="var(--primary)" /> Converted Project Instances
                </h3>
                {linkedProjects.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No converted projects linked to this scheme's work orders.
                  </div>
                ) : (
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <table className="data-table" style={{ margin: 0 }}>
                      <thead>
                        <tr style={{background: 'rgba(0,0,0,0.02)'}}>
                          <th style={{fontSize: '0.75rem', padding: '0.5rem 1rem'}}>Project ID</th>
                          <th style={{fontSize: '0.75rem', padding: '0.5rem 1rem'}}>Project Name</th>
                          <th style={{fontSize: '0.75rem', padding: '0.5rem 1rem'}}>Linked Govt WO</th>
                          <th style={{fontSize: '0.75rem', padding: '0.5rem 1rem', textAlign: 'right'}}>Project Budget</th>
                          <th style={{fontSize: '0.75rem', padding: '0.5rem 1rem'}}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {linkedProjects.map(p => (
                          <tr key={p.id}>
                            <td style={{fontSize: '0.8rem', padding: '0.5rem 1rem', fontWeight: 500}}>{p.project_id}</td>
                            <td style={{fontSize: '0.8rem', padding: '0.5rem 1rem'}}>{p.name}</td>
                            <td style={{fontSize: '0.8rem', padding: '0.5rem 1rem', fontWeight: 500, color: 'var(--primary)'}}>{p.wo_number}</td>
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
                  onClick={(e) => { const temp = selectedScheme; setSelectedScheme(null); handleEdit(e, temp); }} 
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1.25rem', gap: '0.25rem' }}
                >
                  <Edit3 size={16} /> Edit Scheme
                </button>
                <button 
                  onClick={() => setSelectedScheme(null)} 
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
