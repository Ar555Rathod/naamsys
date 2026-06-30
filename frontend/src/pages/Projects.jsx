import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Search, UploadCloud, FileText, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Projects() {
  const [showForm, setShowForm] = useState(false);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Project Fields
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [type_of_work, setTypeOfWork] = useState('');
  const [proposal_id, setProposalId] = useState('');
  const [start_date, setStartDate] = useState('');
  const [end_date, setEndDate] = useState('');
  const [district_id, setDistrictId] = useState('');
  const [taluka_id, setTalukaId] = useState('');
  const [village_id, setVillageId] = useState('');
  const [proposal_pdf, setProposalPdf] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Unified Funding Partner Fields
  const [funding_type, setFundingType] = useState('CSR');
  const [funding_name, setFundingName] = useState('');
  const [funding_pan, setFundingPan] = useState('');
  const [funding_govt_dept, setFundingGovtDept] = useState('');
  const [funding_contact_person, setFundingContactPerson] = useState('');
  const [funding_email, setFundingEmail] = useState('');
  const [funding_phone, setFundingPhone] = useState('');
  const [admin_cost_percent, setAdminCostPercent] = useState('0');

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

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
      alert('Agreement Copy / MoU PDF uploaded successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const reqBudget = parseFloat(budget) || 0;
    if (reqBudget <= 0) {
      alert('Please enter a valid Project Budget.');
      return;
    }

    try {
      await api.post('/projects', {
        name,
        budget: reqBudget,
        type_of_work,
        sub_type: type_of_work,
        proposal_id,
        start_date: start_date ? new Date(start_date).toISOString() : undefined,
        end_date: end_date ? new Date(end_date).toISOString() : undefined,
        district_id: district_id || undefined,
        taluka_id: taluka_id || undefined,
        village_id: village_id || undefined,
        proposal_pdf: proposal_pdf || undefined,
        // Unified fields
        funding_type,
        funding_name,
        funding_pan: funding_type === 'INDIVIDUAL' ? funding_pan : undefined,
        funding_govt_dept: funding_type === 'GOVT' ? funding_govt_dept : undefined,
        funding_contact_person: funding_contact_person || undefined,
        funding_email: funding_email || undefined,
        funding_phone: funding_phone || undefined,
        funding_mou_pdf: proposal_pdf || undefined,
        admin_cost_percent: parseFloat(admin_cost_percent) || 0
      });

      setShowForm(false);
      // Reset form
      setName(''); setBudget(''); setTypeOfWork(''); setProposalId('');
      setStartDate(''); setEndDate(''); setDistrictId(''); setTalukaId(''); setVillageId('');
      setProposalPdf(''); setFundingType('CSR'); setFundingName(''); setFundingPan('');
      setFundingGovtDept(''); setFundingContactPerson(''); setFundingEmail(''); setFundingPhone('');
      setAdminCostPercent('0');
      fetchProjects();
      alert('New Project registered successfully!');
    } catch (err) {
      console.error('Failed to create project', err);
      alert(err.response?.data?.error || 'Failed to register project');
    }
  };

  // Calculations for display
  const parsedBudget = parseFloat(budget) || 0;
  const parsedPercent = parseFloat(admin_cost_percent) || 0;
  const calculatedAdminCost = parsedBudget * (parsedPercent / 100);
  const calculatedTotalCost = parsedBudget + calculatedAdminCost;

  return (
    <div className="main-content">
      {/* Beginner-friendly Header */}
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Project Registration Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Register new projects, specify funding partners, set admin costs, and view active budgets.
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '0.6rem 1.2rem', gap: '0.5rem', fontWeight: 600 }}
        >
          <PlusCircle size={18} /> {showForm ? 'Cancel Registration' : 'Register New Project'}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2rem', border: '1px solid var(--primary-light)' }}>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '2rem' }}>
            <h2 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Register a New Project</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Fill in the project details below. All details about the funding partner and admin costs are recorded here.
            </p>
          </div>

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Step 1: Project Metadata */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <span style={{ background: 'var(--primary)', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>1</span>
                Basic Project Information
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    Project Name
                    <HelpCircle size={14} className="text-muted" title="The human-readable name of the project" />
                  </label>
                  <input type="text" value={name} onChange={e=>setName(e.target.value)} className="input-field" placeholder="e.g. Desilting of Village Lake" required />
                </div>
                
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    Type of Work
                  </label>
                  <input type="text" value={type_of_work} onChange={e=>setTypeOfWork(e.target.value)} className="input-field" placeholder="e.g. Desilting, Excavation, Construction" required />
                </div>

                <div className="form-group">
                  <label>Proposal ID (Optional)</label>
                  <input type="text" value={proposal_id} onChange={e=>setProposalId(e.target.value)} className="input-field" placeholder="e.g. PROP-2026-104" />
                </div>

                <div className="form-group">
                  <label>Duration / Time Period (Start - End)</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="date" value={start_date} onChange={e=>setStartDate(e.target.value)} className="input-field" />
                    <input type="date" value={end_date} onChange={e=>setEndDate(e.target.value)} className="input-field" />
                  </div>
                </div>

                <div className="form-group">
                  <label>District (Optional)</label>
                  <input type="text" value={district_id} onChange={e=>setDistrictId(e.target.value)} className="input-field" placeholder="e.g. Pune" />
                </div>

                <div className="form-group">
                  <label>Taluka & Village (Optional)</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" value={taluka_id} onChange={e=>setTalukaId(e.target.value)} className="input-field" placeholder="Taluka" style={{ flex: 1 }} />
                    <input type="text" value={village_id} onChange={e=>setVillageId(e.target.value)} className="input-field" placeholder="Village" style={{ flex: 1 }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Funding Partner Details */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <span style={{ background: 'var(--primary)', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>2</span>
                Funding Partner Details
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Funding Partner Type</label>
                  <select value={funding_type} onChange={e=>setFundingType(e.target.value)} className="input-field">
                    <option value="CSR">CSR Partner</option>
                    <option value="GOVT">Government Project / Scheme</option>
                    <option value="INDIVIDUAL">Individual Donor</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Funding Partner Name</label>
                  <input type="text" value={funding_name} onChange={e=>setFundingName(e.target.value)} className="input-field" placeholder="e.g. Tata Trusts / Dept of Water / John Doe" required />
                </div>

                {funding_type === 'INDIVIDUAL' && (
                  <div className="form-group">
                    <label>PAN Number (Optional)</label>
                    <input type="text" value={funding_pan} onChange={e=>setFundingPan(e.target.value)} className="input-field" placeholder="e.g. ABCDE1234F" />
                  </div>
                )}

                {funding_type === 'GOVT' && (
                  <div className="form-group">
                    <label>Government Department / Scheme</label>
                    <input type="text" value={funding_govt_dept} onChange={e=>setFundingGovtDept(e.target.value)} className="input-field" placeholder="e.g. Jal Yukta Shivar" />
                  </div>
                )}

                <div className="form-group">
                  <label>Contact Person Name</label>
                  <input type="text" value={funding_contact_person} onChange={e=>setFundingContactPerson(e.target.value)} className="input-field" placeholder="Contact person name" />
                </div>

                <div className="form-group">
                  <label>Contact Email & Phone</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="email" value={funding_email} onChange={e=>setFundingEmail(e.target.value)} className="input-field" placeholder="Email Address" style={{ flex: 1 }} />
                    <input type="text" value={funding_phone} onChange={e=>setFundingPhone(e.target.value)} className="input-field" placeholder="Phone Number" style={{ flex: 1 }} />
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Upload MoU / Agreement Document (PDF)</label>
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
                      padding: '1.5rem', 
                      borderRadius: '12px', 
                      background: 'rgba(30, 41, 59, 0.01)', 
                      textAlign: 'center',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                    onClick={() => {
                      if (!proposal_pdf && !isUploading) {
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    {isUploading ? (
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Uploading document...</span>
                    ) : proposal_pdf ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>✓ MoU PDF Uploaded: {proposal_pdf}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setProposalPdf(''); }} className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>Remove</button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud size={30} color="var(--primary)" />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Click to upload Agreement/MoU document</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Budget and Admin Cost */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <span style={{ background: 'var(--primary)', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>3</span>
                Budget & Admin Cost Settings
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Project Budget (₹)</label>
                  <input 
                    type="number" 
                    value={budget} 
                    onChange={e=>setBudget(e.target.value)} 
                    className="input-field" 
                    placeholder="Enter baseline budget, e.g. 500000" 
                    required 
                  />
                  <small style={{ color: 'var(--text-muted)' }}>This is the baseline budget used for project work orders & contracts.</small>
                </div>

                <div className="form-group">
                  <label>Admin Cost Percentage (%)</label>
                  <input 
                    type="number" 
                    value={admin_cost_percent} 
                    onChange={e=>setAdminCostPercent(e.target.value)} 
                    className="input-field" 
                    placeholder="Enter percentage, e.g. 5" 
                  />
                  <small style={{ color: 'var(--text-muted)' }}>Admin costs are calculated as x% of the project budget.</small>
                </div>
              </div>

              {/* Automatic Calculation Preview */}
              {parsedBudget > 0 && (
                <div style={{ marginTop: '1.5rem', padding: '1.5rem', borderRadius: '12px', background: 'rgba(79, 70, 229, 0.05)', border: '1px solid rgba(79, 70, 229, 0.1)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', textAlign: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Baseline Budget</span>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--text-main)' }}>₹{parsedBudget.toLocaleString()}</h4>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Admin Cost ({parsedPercent}%)</span>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--primary)' }}>+ ₹{calculatedAdminCost.toLocaleString()}</h4>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Funding Cost</span>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.25rem', color: '#10b981' }}>₹{calculatedTotalCost.toLocaleString()}</h4>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontWeight: 600 }}>
                Register Project <ArrowRight size={16} />
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', padding: '0.75rem 1.5rem' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Search & List Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Type here to search projects by name, ID, or type of work..." 
            value={searchTerm}
            onChange={e=>setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', width: '100%', fontFamily: 'Inter', fontSize: '0.95rem' }} 
          />
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Project ID</th>
              <th>Project Name</th>
              <th>Type of Work</th>
              <th>Funding Partner</th>
              <th>Base Budget</th>
              <th>Admin Cost</th>
              <th>Total Cost</th>
              <th>Remaining Budget</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {projects.filter(p => 
              p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              p.project_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.type_of_work.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (p.funding_name || '').toLowerCase().includes(searchTerm.toLowerCase())
            ).map(p => (
              <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ cursor: 'pointer' }} className="hover-row">
                <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{p.project_id}</td>
                <td style={{ fontWeight: 500 }}>{p.name}</td>
                <td>{p.type_of_work}</td>
                <td>
                  {p.funding_name ? (
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', display: 'block' }}>{p.funding_type}</span>
                      <span>{p.funding_name}</span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Legacy Project</span>
                  )}
                </td>
                <td>₹{p.budget.toLocaleString()}</td>
                <td>
                  {p.admin_cost_amount > 0 ? (
                    <span>₹{p.admin_cost_amount.toLocaleString()} ({p.admin_cost_percent}%)</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                  )}
                </td>
                <td>₹{(p.total_cost || p.budget).toLocaleString()}</td>
                <td style={{ color: p.budget_remaining < (p.budget * 0.2) ? 'var(--danger)' : 'var(--text-main)', fontWeight: 500 }}>
                  ₹{p.budget_remaining.toLocaleString()}
                </td>
                <td>
                  <span className={`badge ${p.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
