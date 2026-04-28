import React, { useState, useEffect } from 'react';
import { PlusCircle, Search } from 'lucide-react';
import api from '../api';

export default function Projects() {
  const [showForm, setShowForm] = useState(false);
  const [projects, setProjects] = useState([]);
  
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [type_of_work, setTypeOfWork] = useState('Desilting');
  const [source_type, setSourceType] = useState('CSR');
  const [csr_id, setCsrId] = useState('');
  const [govt_work_order_id, setGovtWorkOrderId] = useState('');
  const [individual_donor_id, setIndividualDonorId] = useState('');
  const [sourceMaxBudget, setSourceMaxBudget] = useState(null);
  
  const [proposal_id, setProposalId] = useState('');
  const [financial_year_id, setFinancialYearId] = useState('');
  const [start_date, setStartDate] = useState('');
  const [end_date, setEndDate] = useState('');

  const [district_id, setDistrictId] = useState('');
  const [taluka_id, setTalukaId] = useState('');
  const [village_id, setVillageId] = useState('');

  const [csrs, setCsrs] = useState([]);
  const [govts, setGovts] = useState([]);
  const [donors, setDonors] = useState([]);
  const [locations, setLocations] = useState([]);
  const [availableTalukas, setAvailableTalukas] = useState([]);
  const [availableVillages, setAvailableVillages] = useState([]);

  useEffect(() => {
    fetchProjects();
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const csrRes = await api.get('/csr'); setCsrs(csrRes.data);
      const govtRes = await api.get('/govt'); setGovts(govtRes.data);
      const donRes = await api.get('/donors'); setDonors(donRes.data);
      const locRes = await api.get('/locations'); setLocations(locRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', {
        name,
        budget,
        type_of_work,
        sub_type: type_of_work,
        source_type,
        csr_id: source_type === 'CSR' ? parseInt(csr_id) : undefined,
        govt_work_order_id: source_type === 'GOVT' ? parseInt(govt_work_order_id) : undefined,
        individual_donor_id: source_type === 'INDIVIDUAL' ? parseInt(individual_donor_id) : undefined,
        proposal_id,
        financial_year_id: financial_year_id ? parseInt(financial_year_id) : undefined,
        start_date: start_date ? new Date(start_date).toISOString() : undefined,
        end_date: end_date ? new Date(end_date).toISOString() : undefined,
        district_id: district_id ? parseInt(district_id) : undefined,
        taluka_id: taluka_id ? parseInt(taluka_id) : undefined,
        village_id: village_id ? parseInt(village_id) : undefined
      });
      setShowForm(false);
      setName(''); setProposalId(''); setStartDate(''); setEndDate(''); setBudget(''); setSourceMaxBudget(null);
      fetchProjects();
    } catch (err) {
      console.error('Failed to create project', err);
      alert(err.response?.data?.error || 'Failed to create project');
    }
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Projects Management</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <PlusCircle size={18} /> {showForm ? 'Cancel' : 'New Project'}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Create New Project</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Project Name</label>
              <input type="text" value={name} onChange={e=>setName(e.target.value)} className="input-field" placeholder="Enter project name" required />
            </div>
            
            <div className="form-group">
              <label>Proposal ID</label>
              <input type="text" value={proposal_id} onChange={e=>setProposalId(e.target.value)} className="input-field" placeholder="e.g. PROP-2026-001" />
            </div>

            <div className="form-group">
              <label>Type of Work</label>
              <select value={type_of_work} onChange={e=>setTypeOfWork(e.target.value)} className="input-field">
                <option value="Desilting">Desilting</option>
                <option value="Excavation">Excavation</option>
                <option value="Construction">Construction</option>
              </select>
            </div>

            <div className="form-group">
              <label>Time Period (Start Date - End Date)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="date" value={start_date} onChange={e=>setStartDate(e.target.value)} className="input-field" />
                <input type="date" value={end_date} onChange={e=>setEndDate(e.target.value)} className="input-field" />
              </div>
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

            <div className="form-group" style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Funding Source Allocation</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Source Type</label>
                  <select value={source_type} onChange={e=>{
                    setSourceType(e.target.value); 
                    setCsrId(''); setGovtWorkOrderId(''); setIndividualDonorId(''); 
                    setSourceMaxBudget(null);
                  }} className="input-field">
                    <option value="CSR">CSR Funding</option>
                    <option value="GOVT">Government Work Order</option>
                    <option value="INDIVIDUAL">Individual Donor</option>
                  </select>
                </div>
                
                {source_type === 'CSR' && (
                  <div className="form-group">
                    <label>Select CSR Partner</label>
                    <select value={csr_id} onChange={e=>{
                      setCsrId(e.target.value);
                      const csr = csrs.find(c => c.id === parseInt(e.target.value));
                      if (csr) setSourceMaxBudget(csr.budget_remaining);
                    }} className="input-field" required>
                      <option value="">-- Select CSR --</option>
                      {csrs.map(c => <option key={c.id} value={c.id}>{c.name} (Avail: ₹{c.budget_remaining?.toLocaleString()})</option>)}
                    </select>
                  </div>
                )}

                {source_type === 'GOVT' && (
                  <div className="form-group">
                    <label>Select Govt Work Order</label>
                    <select value={govt_work_order_id} onChange={e=>{
                      setGovtWorkOrderId(e.target.value);
                      const wo = govts.flatMap(g=>g.work_orders).find(w => w.id === parseInt(e.target.value));
                      if (wo) setSourceMaxBudget(wo.budget_remaining);
                    }} className="input-field" required>
                      <option value="">-- Select Work Order --</option>
                      {govts.flatMap(g => g.work_orders.map(wo => (
                        <option key={wo.id} value={wo.id}>{wo.work_order_number} ({g.scheme_dept}) - Avail: ₹{wo.budget_remaining?.toLocaleString()}</option>
                      )))}
                    </select>
                  </div>
                )}

                {source_type === 'INDIVIDUAL' && (
                  <div className="form-group">
                    <label>Select Individual Donor</label>
                    <select value={individual_donor_id} onChange={e=>{
                      setIndividualDonorId(e.target.value);
                      const d = donors.find(d => d.id === parseInt(e.target.value));
                      if (d) setSourceMaxBudget(d.budget_remaining);
                    }} className="input-field" required>
                      <option value="">-- Select Donor --</option>
                      {donors.map(d => <option key={d.id} value={d.id}>{d.name} (Avail: ₹{d.budget_remaining?.toLocaleString()})</option>)}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Allocated Project Budget (₹)</label>
                <input type="number" value={budget} onChange={e=>setBudget(e.target.value)} className="input-field" placeholder="Enter manual budget for this project" required />
                {sourceMaxBudget !== null && (
                  <small style={{ color: parseFloat(budget) > sourceMaxBudget ? 'var(--danger)' : 'var(--success)', fontWeight: 500 }}>
                    Maximum Available from Source: ₹{sourceMaxBudget.toLocaleString()}
                  </small>
                )}
              </div>
            </div>
            
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary">Create Project</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', width: '100%', fontFamily: 'Inter' }} 
          />
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Project ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Total Budget</th>
              <th>Remaining Budget</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 500 }}>{p.project_id}</td>
                <td>{p.name}</td>
                <td>{p.type_of_work}</td>
                <td>₹{p.budget.toLocaleString()}</td>
                <td style={{ color: p.budget_remaining < (p.budget * 0.2) ? 'var(--danger)' : 'var(--text-main)' }}>
                  ₹{p.budget_remaining.toLocaleString()}
                </td>
                <td>
                  <span className="badge badge-success">{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
