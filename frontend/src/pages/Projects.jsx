import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Search, UploadCloud, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Projects() {
  const [showForm, setShowForm] = useState(false);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [type_of_work, setTypeOfWork] = useState('');
  const [source_type, setSourceType] = useState('CSR');
  const [csr_id, setCsrId] = useState('');
  const [govt_work_order_id, setGovtWorkOrderId] = useState('');
  const [individual_donor_id, setIndividualDonorId] = useState('');
  const [sourceMaxBudget, setSourceMaxBudget] = useState(null);
  const [fundingSources, setFundingSources] = useState([]);
  const [sourceAmount, setSourceAmount] = useState('');
  
  const [proposal_id, setProposalId] = useState('');
  const [financial_year_id, setFinancialYearId] = useState('');
  const [start_date, setStartDate] = useState('');
  const [end_date, setEndDate] = useState('');

  const [district_id, setDistrictId] = useState('');
  const [taluka_id, setTalukaId] = useState('');
  const [village_id, setVillageId] = useState('');
  const [proposal_pdf, setProposalPdf] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProposalPdf(res.data.filename);
      alert('Project Proposal PDF uploaded successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to upload PDF document');
    } finally {
      setIsUploading(false);
    }
  };

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
    const reqBudget = parseFloat(budget) || 0;
    const sumContributions = fundingSources.reduce((sum, s) => sum + s.amount, 0);

    if (Math.abs(reqBudget - sumContributions) > 0.01) {
      alert(`The sum of funding source allocations (₹${sumContributions.toLocaleString()}) must exactly match the project budget (₹${reqBudget.toLocaleString()}).`);
      return;
    }

    try {
      await api.post('/projects', {
        name,
        budget: reqBudget,
        type_of_work,
        sub_type: type_of_work,
        funding_sources: fundingSources.map(s => ({
          source_type: s.source_type,
          id: s.id,
          amount: s.amount
        })),
        proposal_id,
        financial_year_id: financial_year_id ? parseInt(financial_year_id) : undefined,
        start_date: start_date ? new Date(start_date).toISOString() : undefined,
        end_date: end_date ? new Date(end_date).toISOString() : undefined,
        district_id: district_id || undefined,
        taluka_id: taluka_id || undefined,
        village_id: village_id || undefined,
        proposal_pdf: proposal_pdf || undefined
      });
      setShowForm(false);
      setName(''); setProposalId(''); setStartDate(''); setEndDate(''); setBudget(''); setSourceMaxBudget(null);
      setFundingSources([]); setSourceAmount('');
      setTypeOfWork(''); setDistrictId(''); setTalukaId(''); setVillageId(''); setProposalPdf('');
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
              <label>Project Budget (₹)</label>
              <input type="number" value={budget} onChange={e=>setBudget(e.target.value)} className="input-field" placeholder="e.g. 10000000" required />
            </div>

            <div className="form-group">
              <label>Type of Work</label>
              <input type="text" value={type_of_work} onChange={e=>setTypeOfWork(e.target.value)} className="input-field" placeholder="e.g. Desilting, Excavation, Construction" required />
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
              <input type="text" value={district_id} onChange={e=>setDistrictId(e.target.value)} className="input-field" placeholder="Enter District" />
            </div>

            <div className="form-group">
              <label>Taluka</label>
              <input type="text" value={taluka_id} onChange={e=>setTalukaId(e.target.value)} className="input-field" placeholder="Enter Taluka" />
            </div>

            <div className="form-group">
              <label>Village</label>
              <input type="text" value={village_id} onChange={e=>setVillageId(e.target.value)} className="input-field" placeholder="Enter Village" />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Project Proposal Document (PDF) - <span style={{color: 'var(--primary)', fontWeight: 600}}>Optional</span></label>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="application/pdf" 
                style={{ display: 'none' }} 
                onChange={handleFileChange} 
              />
              <div 
                style={{ 
                  border: '2px dashed var(--primary)', 
                  padding: '2rem 1.5rem', 
                  borderRadius: '12px', 
                  background: 'rgba(30, 41, 59, 0.01)', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => {
                  if (!proposal_pdf && !isUploading) {
                    fileInputRef.current?.click();
                  }
                }}
              >
                {isUploading ? (
                  <>
                    <UploadCloud size={40} color="var(--primary)" className="animate-pulse" />
                    <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.95rem' }}>Uploading project proposal document...</span>
                  </>
                ) : proposal_pdf ? (
                  <>
                    <FileText size={40} color="#10b981" />
                    <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.95rem' }}>✓ Proposal PDF Uploaded Successfully</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{proposal_pdf}</strong>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setProposalPdf(''); }} 
                      className="btn btn-danger" 
                      style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem', gap: '0.25rem', marginTop: '0.25rem' }}
                    >
                      Delete Attachment
                    </button>
                  </>
                ) : (
                  <>
                    <UploadCloud size={40} color="var(--primary)" />
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Drag and drop project proposal here or click to upload</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supports PDF document formats up to 10MB</span>
                  </>
                )}
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Funding Source Allocation</h3>
              
              {fundingSources.length > 0 && (
                <div style={{ marginBottom: '1.5rem', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', background: 'rgba(255,255,255,0.01)' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Added Funding Sources</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {fundingSources.map((src, index) => (
                      <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.9rem' }}>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>[{src.source_type}]</span> {src.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <strong style={{ color: 'var(--text-main)' }}>₹{parseFloat(src.amount).toLocaleString()}</strong>
                          <button 
                            type="button" 
                            onClick={() => {
                              setFundingSources(fundingSources.filter((_, i) => i !== index));
                            }} 
                            className="btn btn-danger" 
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
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
                    }} className="input-field">
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
                    }} className="input-field">
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
                    }} className="input-field">
                      <option value="">-- Select Donor --</option>
                      {donors.map(d => <option key={d.id} value={d.id}>{d.name} (Avail: ₹{d.budget_remaining?.toLocaleString()})</option>)}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Contribution Amount (₹)</label>
                  <input 
                    type="number" 
                    value={sourceAmount} 
                    onChange={e=>setSourceAmount(e.target.value)} 
                    className="input-field" 
                    placeholder="e.g. 500000" 
                  />
                  {sourceMaxBudget !== null && (
                    <small style={{ color: 'var(--success)', fontWeight: 500, display: 'block', marginTop: '0.25rem' }}>
                      Max Avail: ₹{sourceMaxBudget.toLocaleString()}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <button 
                    type="button" 
                    onClick={() => {
                      const amt = parseFloat(sourceAmount);
                      if (isNaN(amt) || amt <= 0) {
                        alert('Please enter a valid contribution amount.');
                        return;
                      }
                      let selectedId = '';
                      let selectedName = '';
                      if (source_type === 'CSR') {
                        selectedId = csr_id;
                        const csr = csrs.find(c => c.id === parseInt(csr_id));
                        selectedName = csr ? csr.name : '';
                      } else if (source_type === 'GOVT') {
                        selectedId = govt_work_order_id;
                        const wo = govts.flatMap(g=>g.work_orders).find(w => w.id === parseInt(govt_work_order_id));
                        selectedName = wo ? wo.work_order_number : '';
                      } else if (source_type === 'INDIVIDUAL') {
                        selectedId = individual_donor_id;
                        const d = donors.find(d => d.id === parseInt(individual_donor_id));
                        selectedName = d ? d.name : '';
                      }

                      if (!selectedId) {
                        alert('Please select a funding entity.');
                        return;
                      }

                      if (sourceMaxBudget !== null && amt > sourceMaxBudget) {
                        alert(`Contribution amount exceeds available budget (₹${sourceMaxBudget.toLocaleString()}) for this source.`);
                        return;
                      }

                      const duplicate = fundingSources.find(s => s.source_type === source_type && s.id === selectedId);
                      if (duplicate) {
                        alert('This funding source has already been added.');
                        return;
                      }

                      setFundingSources([...fundingSources, {
                        source_type,
                        id: selectedId,
                        name: selectedName,
                        amount: amt
                      }]);

                      setCsrId('');
                      setGovtWorkOrderId('');
                      setIndividualDonorId('');
                      setSourceAmount('');
                      setSourceMaxBudget(null);
                    }} 
                    className="btn btn-primary"
                    style={{ padding: '0.6rem 1rem' }}
                  >
                    Add Source
                  </button>
                </div>
              </div>

              {(() => {
                const sumContributions = fundingSources.reduce((sum, s) => sum + s.amount, 0);
                const reqBudget = parseFloat(budget) || 0;
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.04)', borderLeft: '4px solid var(--primary)', fontSize: '0.9rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Project Budget: </span>
                      <strong style={{ color: 'var(--text-main)' }}>₹{reqBudget.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Total Allocated: </span>
                      <strong style={{ color: 'var(--text-main)' }}>₹{sumContributions.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Remaining: </span>
                      <strong style={{ color: Math.abs(reqBudget - sumContributions) < 0.01 ? 'var(--success)' : 'var(--danger)' }}>
                        ₹{(reqBudget - sumContributions).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                );
              })()}
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
            value={searchTerm}
            onChange={e=>setSearchTerm(e.target.value)}
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
            {projects.filter(p => 
              p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              p.project_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.type_of_work.toLowerCase().includes(searchTerm.toLowerCase())
            ).map(p => (
              <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ cursor: 'pointer' }} className="hover-row">
                <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{p.project_id}</td>
                <td style={{ fontWeight: 500 }}>{p.name}</td>
                <td>{p.type_of_work}</td>
                <td>₹{p.budget.toLocaleString()}</td>
                <td style={{ color: p.budget_remaining < (p.budget * 0.2) ? 'var(--danger)' : 'var(--text-main)', fontWeight: 500 }}>
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
