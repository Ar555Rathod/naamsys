import React, { useState, useEffect } from 'react';
import { PlusCircle, Landmark } from 'lucide-react';
import api from '../api';

export default function GovtSchemes() {
  const [showForm, setShowForm] = useState(false);
  const [showWOForm, setShowWOForm] = useState(false);
  const [selectedSchemeId, setSelectedSchemeId] = useState(null);
  
  const [schemes, setSchemes] = useState([]);
  
  const [scheme_dept, setSchemeDept] = useState('');
  const [type_of_work, setTypeOfWork] = useState('Road Construction');
  const [sub_type, setSubType] = useState('');
  
  const [district_id, setDistrictId] = useState('');
  const [taluka_id, setTalukaId] = useState('');
  const [village_id, setVillageId] = useState('');

  const [locations, setLocations] = useState([]);
  const [availableTalukas, setAvailableTalukas] = useState([]);
  const [availableVillages, setAvailableVillages] = useState([]);

  const [wo_number, setWoNumber] = useState('');
  const [wo_budget, setWoBudget] = useState('');
  const [wo_desc, setWoDesc] = useState('');

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
      await api.post('/govt', { 
        scheme_dept, 
        type_of_work, 
        sub_type,
        district_id: district_id ? parseInt(district_id) : null,
        taluka_id: taluka_id ? parseInt(taluka_id) : null,
        village_id: village_id ? parseInt(village_id) : null
      });
      setShowForm(false);
      setSchemeDept(''); setSubType(''); setDistrictId(''); setTalukaId(''); setVillageId('');
      fetchSchemes();
    } catch (err) {
      alert('Failed to register scheme');
    }
  };

  const handleCreateWO = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/govt/${selectedSchemeId}/work-orders`, {
        work_order_number: wo_number,
        budget: parseFloat(wo_budget),
        description: wo_desc
      });
      setShowWOForm(false);
      setWoNumber(''); setWoBudget(''); setWoDesc('');
      fetchSchemes();
    } catch (err) {
      alert('Failed to add Work Order');
    }
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Government Schemes</h1>
        <button className="btn btn-primary" onClick={() => {setShowForm(!showForm); setShowWOForm(false);}}>
          <PlusCircle size={18} /> {showForm ? 'Cancel' : 'New Scheme'}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Register Government Scheme</h2>
          <form onSubmit={handleCreateScheme} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Department Name</label>
              <input type="text" value={scheme_dept} onChange={e=>setSchemeDept(e.target.value)} className="input-field" placeholder="e.g. Zilla Parishad" required />
            </div>
            <div className="form-group">
              <label>Type of Work</label>
              <select value={type_of_work} onChange={e=>setTypeOfWork(e.target.value)} className="input-field">
                <option>Road Construction</option>
                <option>Water Conservation</option>
                <option>Infrastructure</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Sub Type / Details</label>
              <input type="text" value={sub_type} onChange={e=>setSubType(e.target.value)} className="input-field" required />
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

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary">Save Scheme</button>
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
              <th>Work Orders</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schemes.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Landmark size={16} color="var(--primary)" /> {s.govt_id}
                </td>
                <td>{s.scheme_dept}</td>
                <td>{s.type_of_work} ({s.sub_type})</td>
                <td>
                  {s.work_orders.length === 0 ? 'No Work Orders' : (
                    <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                      {s.work_orders.map(wo => (
                        <li key={wo.id}>{wo.work_order_number} - ₹{parseFloat(wo.budget).toLocaleString()}</li>
                      ))}
                    </ul>
                  )}
                </td>
                <td>
                  <button 
                    className="btn" 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                    onClick={() => { setSelectedSchemeId(s.id); setShowWOForm(true); setShowForm(false); }}
                  >
                    + Add WO
                  </button>
                </td>
              </tr>
            ))}
            {schemes.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>No Govt Schemes registered yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
