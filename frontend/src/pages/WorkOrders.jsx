import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Search, FileCheck2, History, Edit3, CheckCircle, UploadCloud, Printer, XCircle, Building, User, Calendar, FileText } from 'lucide-react';
import api, { getUploadUrl } from '../api';

export default function WorkOrders() {
  const [wos, setWos] = useState([]);
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [contractors, setContractors] = useState([]);
  
  const [showForm, setShowForm] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyWoNumber, setHistoryWoNumber] = useState('');
  
  const [uploadingWoId, setUploadingWoId] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [mockFileName, setMockFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [selectedPrintWo, setSelectedPrintWo] = useState(null);

  // Form states
  const [isAmending, setIsAmending] = useState(false);
  const [amendWoNumber, setAmendWoNumber] = useState('');

  const [project_id, setProjectId] = useState('');
  const [vendor_id, setVendorId] = useState('');
  const [contractor_id, setContractorId] = useState('');
  const [work_description, setWorkDescription] = useState('');
  const [completion_date, setCompletionDate] = useState('');
  const [budget_amount, setBudgetAmount] = useState('');
  const [status, setStatus] = useState('Draft');
  const [remarks, setRemarks] = useState('');

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchWos();
    fetchData();
  }, []);

  const fetchWos = async () => {
    try {
      const res = await api.get('/work-orders');
      setWos(res.data);
    } catch (err) { console.error('Failed to fetch Work Orders', err); }
  };

  const fetchData = async () => {
    try {
      const pRes = await api.get('/projects'); setProjects(pRes.data);
      const vRes = await api.get('/vendors'); setVendors(vRes.data);
      const cRes = await api.get('/vendors/contractors'); setContractors(cRes.data);
    } catch (err) { console.error('Failed to fetch data', err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isAmending) {
        await api.post('/work-orders/amend', {
          wo_number: amendWoNumber,
          work_description,
          completion_date,
          budget_amount: budget_amount ? parseFloat(budget_amount) : 0,
          contractor_id: contractor_id || null,
          status,
          remarks: remarks || `Amended version creation`
        });
        alert('Work Order amended successfully (New version created).');
      } else {
        await api.post('/work-orders', {
          project_id,
          vendor_id,
          contractor_id: contractor_id || null,
          work_description,
          completion_date,
          budget_amount: budget_amount ? parseFloat(budget_amount) : 0,
          status
        });
        alert('Work Order created successfully.');
      }
      
      // Reset Form
      setShowForm(false);
      setIsAmending(false);
      setAmendWoNumber('');
      setProjectId(''); setVendorId(''); setContractorId(''); setWorkDescription(''); setCompletionDate(''); setBudgetAmount(''); setStatus('Draft'); setRemarks('');
      fetchWos();
    } catch (err) {
      alert('Failed to submit Work Order');
    }
  };

  const handleAmendClick = (wo) => {
    setIsAmending(true);
    setAmendWoNumber(wo.wo_number);
    setProjectId(wo.project_id.toString());
    setVendorId(wo.vendor_id.toString());
    setContractorId(wo.contractor_id ? wo.contractor_id.toString() : '');
    setWorkDescription(wo.work_description);
    setCompletionDate(new Date(wo.completion_date).toISOString().split('T')[0]);
    setBudgetAmount(wo.budget_amount ? wo.budget_amount.toString() : '');
    setStatus('Draft');
    setRemarks('');
    setShowForm(true);
  };

  const handleViewHistory = async (wo) => {
    try {
      const res = await api.get(`/work-orders/history/${wo.wo_number}`);
      setSelectedHistory(res.data);
      setHistoryWoNumber(wo.wo_number);
      setShowHistoryModal(true);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch history');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/work-orders/${id}/status`, { status: 'Approved', remarks: 'Work Order approved by Admin Signatory' });
      alert('Work Order approved successfully.');
      fetchWos();
    } catch (err) {
      alert('Failed to approve Work Order.');
    }
  };

  const handleUploadClick = (wo) => {
    setUploadingWoId(wo.id);
    setMockFileName('');
    setShowUploadModal(true);
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
      setMockFileName(res.data.filename);
      alert('Signed Work Order PDF uploaded successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to upload PDF copy');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!mockFileName) {
      alert('Please upload a duly signed PDF file from your device first.');
      return;
    }
    try {
      await api.put(`/work-orders/${uploadingWoId}/upload-signed`, { duly_signed_url: mockFileName });
      alert('Duly signed copy uploaded successfully! Work Order status is now Completed.');
      setShowUploadModal(false);
      setUploadingWoId(null);
      fetchWos();
    } catch (err) {
      alert('Failed to upload signed copy.');
    }
  };

  const handlePrint = (wo) => {
    if (wo.duly_signed_url) {
      window.open(getUploadUrl(wo.duly_signed_url), '_blank');
      return;
    }
    setSelectedPrintWo(wo);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const filteredWos = wos.filter(w => 
    w.wo_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.vendor.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="main-content">


      <div className="page-header no-print">
        <h1 className="page-title">Work Orders</h1>
        <button className="btn btn-primary" onClick={() => {
          setIsAmending(false);
          setAmendWoNumber('');
          setProjectId(''); setVendorId(''); setContractorId(''); setWorkDescription(''); setCompletionDate(''); setBudgetAmount(''); setStatus('Draft'); setRemarks('');
          setShowForm(!showForm);
        }}>
          <PlusCircle size={18} /> {showForm ? 'Cancel' : 'Create Work Order'}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel no-print" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>
            {isAmending ? `Amend Work Order: ${amendWoNumber} (Creates Next Version)` : 'Create New Work Order'}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            <div className="form-group">
              <label>Project</label>
              <select value={project_id} onChange={e=>setProjectId(e.target.value)} className="input-field" required disabled={isAmending}>
                <option value="">-- Select Project --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.project_id})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Vendor (Mandatory)</label>
              <select value={vendor_id} onChange={e=>setVendorId(e.target.value)} className="input-field" required disabled={isAmending}>
                <option value="">-- Select Vendor --</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Contractor (Optional)</label>
              <select value={contractor_id} onChange={e=>setContractorId(e.target.value)} className="input-field">
                <option value="">-- Select Contractor (Optional) --</option>
                {contractors.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Estimated Completion Date</label>
              <input type="date" value={completion_date} onChange={e=>setCompletionDate(e.target.value)} className="input-field" required />
            </div>

            <div className="form-group">
              <label>Work Order Value (₹) - <span style={{color: 'var(--primary)', fontWeight: 500}}>Optional</span></label>
              <input type="number" value={budget_amount} onChange={e=>setBudgetAmount(e.target.value)} className="input-field" placeholder="MoU / WO cost if applicable" />
            </div>

            <div className="form-group">
              <label>Initial Status</label>
              <select value={status} onChange={e=>setStatus(e.target.value)} className="input-field">
                <option value="Draft">Draft (Internal Review)</option>
                <option value="SentToVendor">Sent to Vendor (Awaiting Approval)</option>
              </select>
            </div>

            {isAmending && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Amendment Remarks / Rationale</label>
                <input type="text" value={remarks} onChange={e=>setRemarks(e.target.value)} className="input-field" placeholder="e.g. Scope extension, adjusted completion timeline" required={isAmending} />
              </div>
            )}

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Detailed Work Scope / Description</label>
              <textarea value={work_description} onChange={e=>setWorkDescription(e.target.value)} className="input-field" rows="4" placeholder="Describe the physical work to be executed..." required></textarea>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary">
                {isAmending ? 'Generate Amended Version' : 'Save Work Order'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Listing Panel */}
      <div className="glass-panel no-print" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search active Work Orders..." 
            value={searchTerm}
            onChange={e=>setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', width: '100%', fontFamily: 'Inter' }} 
          />
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>WO Number</th>
              <th>Version</th>
              <th>Project</th>
              <th>Vendor / Contractor</th>
              <th>Value (₹)</th>
              <th>Timeline</th>
              <th>Status</th>
              <th style={{textAlign: 'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWos.map(w => (
              <tr key={w.id} className="hover-row">
                <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileCheck2 size={16} /> {w.wo_number}
                  </div>
                </td>
                <td style={{fontWeight: 500}}>
                  V{w.version}
                  {w.creator && <><br/><small style={{color:'var(--text-muted)', fontSize: '0.7rem'}}>By: {w.creator.name}</small></>}
                </td>
                <td>{w.project.name} <br/><small style={{color:'var(--text-muted)'}}>{w.project.project_id}</small></td>
                <td>
                  <strong>{w.vendor.company_name}</strong>
                  {w.contractor && <><br/><small style={{color:'var(--text-muted)'}}>Sub-Contractor: {w.contractor.full_name}</small></>}
                </td>
                <td style={{fontWeight: 600}}>{w.budget_amount > 0 ? `₹${w.budget_amount.toLocaleString()}` : '—'}</td>
                <td>{new Date(w.completion_date).toLocaleDateString()}</td>
                <td>
                  <span className={`badge badge-${w.status === 'Completed' ? 'success' : w.status === 'Approved' ? 'warning' : w.status === 'SentToVendor' ? 'info' : 'secondary'}`}>
                    {w.status === 'SentToVendor' ? 'Sent To Vendor' : w.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                    <button onClick={() => handleViewHistory(w)} className="btn btn-icon" style={{background: 'rgba(255,255,255,0.03)', padding: '0.4rem'}} title="Version History">
                      <History size={15} />
                    </button>
                    
                    <button onClick={() => handlePrint(w)} className="btn btn-icon" style={{background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)', padding: '0.4rem'}} title="Print Work Order">
                      <Printer size={15} />
                    </button>

                    {w.status !== 'Completed' && (
                      <button onClick={() => handleAmendClick(w)} className="btn btn-icon" style={{background: 'rgba(0,0,0,0.05)', padding: '0.4rem'}} title="Amend Order">
                        <Edit3 size={15} />
                      </button>
                    )}

                    {(w.status === 'Draft' || w.status === 'SentToVendor') && (
                      <button onClick={() => handleApprove(w.id)} className="btn btn-icon" style={{background: 'rgba(16, 185, 129, 0.08)', color: 'var(--success)', padding: '0.4rem'}} title="Admin Approve">
                        <CheckCircle size={15} />
                      </button>
                    )}

                    {w.status === 'Approved' && (
                      <button onClick={() => handleUploadClick(w)} className="btn" style={{padding: '0.35rem 0.6rem', fontSize: '0.75rem', gap: '0.2rem', background: 'var(--primary)', color: 'white'}} title="Upload Signed Copy">
                        <UploadCloud size={13} /> Sign
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredWos.length === 0 && <tr><td colSpan="8" style={{textAlign:'center', color: 'var(--text-muted)'}}>No active Work Orders found.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* VERSION HISTORY MODAL */}
      {showHistoryModal && (
        <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '750px', background: 'var(--bg-card)', padding: '2.5rem', position: 'relative' }}>
            <button onClick={() => setShowHistoryModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <XCircle size={24} />
            </button>
            <h2 style={{ marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History color="var(--primary)" /> Version History: {historyWoNumber}
            </h2>
            <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr style={{background: 'rgba(0,0,0,0.02)'}}>
                    <th>Ver</th>
                    <th>Created At</th>
                    <th>Description</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Signed Copy</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedHistory.map(h => (
                    <tr key={h.id} style={{ opacity: h.is_active ? 1 : 0.65, background: h.is_active ? 'rgba(79, 70, 229, 0.02)' : 'transparent' }}>
                      <td style={{fontWeight: 700}}>
                        V{h.version} {h.is_active && <span style={{fontSize: '0.65rem', background: 'var(--primary)', color: 'white', padding: '0.1rem 0.3rem', borderRadius: '4px', marginLeft: '0.25rem'}}>ACTIVE</span>}
                        {h.creator && <div style={{fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.15rem'}}>By: {h.creator.name}</div>}
                      </td>
                      <td style={{fontSize: '0.8rem'}}>{new Date(h.created_at).toLocaleString()}</td>
                      <td style={{fontSize: '0.8rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={h.work_description}>{h.work_description}</td>
                      <td style={{fontSize: '0.8rem', fontWeight: 600}}>{h.budget_amount > 0 ? `₹${h.budget_amount.toLocaleString()}` : '—'}</td>
                      <td>
                        <span className={`badge badge-${h.status === 'Completed' ? 'success' : h.status === 'Approved' ? 'warning' : h.status === 'SentToVendor' ? 'info' : 'secondary'}`} style={{fontSize: '0.7rem'}}>
                          {h.status}
                        </span>
                      </td>
                      <td style={{fontSize: '0.8rem'}}>{h.duly_signed_url ? <span style={{color: 'var(--success)', fontWeight: 500}}>Uploaded</span> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setShowHistoryModal(false)} className="btn" style={{background: 'rgba(0,0,0,0.08)', padding: '0.5rem 1.5rem'}}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MOCK UPLOAD SIGNED COPY MODAL */}
      {showUploadModal && (
        <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-card)', padding: '2.5rem', position: 'relative' }}>
            <button onClick={() => setShowUploadModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <XCircle size={24} />
            </button>
            <h2 style={{ marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UploadCloud color="var(--primary)" /> Upload Signed Work Order
            </h2>
            <form onSubmit={handleUploadSubmit}>
              <div 
                className="form-group" 
                style={{ textAlign: 'center', border: '2px dashed var(--primary)', padding: '2.5rem 1.5rem', borderRadius: '12px', background: 'rgba(79, 70, 229, 0.02)', cursor: 'pointer', marginBottom: '1.5rem' }}
                onClick={() => {
                  if (!isUploading) {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="application/pdf" 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange} 
                />
                {isUploading ? (
                  <>
                    <UploadCloud size={48} color="var(--primary)" className="animate-pulse" style={{margin: '0 auto 1rem'}} />
                    <p style={{fontWeight: 500, margin: '0 0 0.25rem'}}>Uploading signed copy document...</p>
                  </>
                ) : (
                  <>
                    <UploadCloud size={48} color="var(--primary)" style={{margin: '0 auto 1rem'}} />
                    <p style={{fontWeight: 500, margin: '0 0 0.25rem'}}>{mockFileName ? '✓ Signed Copy Attached' : 'Drag and drop duly signed copy here or click to browse'}</p>
                    <small style={{color:'var(--text-muted)', display: 'block'}}>Supports PDF, JPG, PNG up to 10MB</small>
                  </>
                )}
                {mockFileName && (
                  <div style={{ marginTop: '1rem', background: 'rgba(16, 185, 129, 0.08)', padding: '0.5rem', borderRadius: '6px', border: '1px solid #10b981', color: '#10b981', fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mockFileName}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" style={{padding: '0.5rem 1.5rem'}}>Confirm Upload</button>
                <button type="button" onClick={() => setShowUploadModal(false)} className="btn" style={{background: 'rgba(0,0,0,0.08)', padding: '0.5rem 1.5rem'}}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREMIUM HIGH-FIDELITY PRINT PREVIEW MODAL */}
      {selectedPrintWo && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'white' }}>
            
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-light)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Work Order Print Preview</span>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => window.print()} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                  <Printer size={16} /> Print / Save PDF
                </button>
                <button onClick={() => setSelectedPrintWo(null)} className="btn btn-danger" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', gap: '0.25rem' }}>
                  <XCircle size={16} /> Close
                </button>
              </div>
            </div>

            {/* Printable Frame Area */}
            <div id="printable-wo-modal-content" style={{ padding: '3.5rem', fontFamily: 'Inter, sans-serif', color: '#1e293b', background: 'white' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #cbd5e1', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '-0.025em', margin: 0 }}>NAAM Foundation</h1>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.4rem', lineHeight: '1.4' }}>
                    Plot No 219, Fergusson College Rd, Shivaji Nagar, Pune, MH, 411016<br />
                    Email: operations@naammh.org | Reg: MAH/1196/2015/Pune
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>WORK ORDER</h2>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.4rem', lineHeight: '1.4' }}>
                    WO Ref: <strong>{selectedPrintWo.wo_number}</strong><br />
                    Version: <strong>V{selectedPrintWo.version}</strong><br />
                    Date: {new Date(selectedPrintWo.created_at).toLocaleDateString()}<br />
                    {selectedPrintWo.creator && <>Issued By: <strong>{selectedPrintWo.creator.name}</strong><br /></>}
                    {selectedPrintWo.status === 'Approved' && <>Approved By: <strong>Audit Board</strong></>}
                  </p>
                </div>
              </div>

              {/* Order Specifics Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Contracted Vendor (Agency):</h4>
                  <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
                    <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{selectedPrintWo.vendor.company_name}</strong>
                    <p style={{ color: '#475569', marginTop: '0.3rem', margin: 0 }}>
                      Owner: {selectedPrintWo.vendor.owner_name}<br />
                      PAN Card: {selectedPrintWo.vendor.pan}<br />
                      GSTIN: {selectedPrintWo.vendor.gst || 'N/A'}<br />
                      Remittance Contact: {selectedPrintWo.vendor.owner_contact}
                    </p>
                    {selectedPrintWo.vendor.address_line1 ? (
                      <p style={{ color: '#475569', marginTop: '0.3rem', margin: 0 }}>
                        Address: {selectedPrintWo.vendor.address_line1}, {selectedPrintWo.vendor.address_line2}, {selectedPrintWo.vendor.address_line3}
                      </p>
                    ) : selectedPrintWo.vendor.owner_address && (
                      <p style={{ color: '#475569', marginTop: '0.3rem', margin: 0 }}>Address: {selectedPrintWo.vendor.owner_address}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Project & Sub-Contractor Context:</h4>
                  <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
                    <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>Project: {selectedPrintWo.project.project_id}</strong>
                    <p style={{ color: '#475569', marginTop: '0.3rem', margin: 0 }}>
                      Name: {selectedPrintWo.project.name}<br />
                      Type of Operations: {selectedPrintWo.project.type_of_work}<br />
                      Location: {selectedPrintWo.project.village_name || selectedPrintWo.project.village_id || 'N/A'}, Taluka: {selectedPrintWo.project.taluka_name || selectedPrintWo.project.taluka_id || 'N/A'}, Dist: {selectedPrintWo.project.district_name || selectedPrintWo.project.district_id || 'N/A'}
                    </p>
                    {selectedPrintWo.contractor && (
                      <p style={{ color: '#475569', marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.4rem', margin: 0 }}>
                        <strong>Sub-Contractor Hired:</strong> {selectedPrintWo.contractor.full_name} ({selectedPrintWo.contractor.pan})
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Summary Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2.5rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569', width: '70%' }}>Description of Assigned Work Scope</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569', width: '30%' }}>Value Reference</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1.25rem 1rem', fontSize: '0.875rem', verticalAlign: 'top', lineHeight: '1.5' }}>
                      <strong>Operations under Work Order Reference {selectedPrintWo.wo_number}</strong>
                      <p style={{ color: '#475569', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                        {selectedPrintWo.work_description}
                      </p>
                    </td>
                    <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', verticalAlign: 'top' }}>
                      {selectedPrintWo.budget_amount > 0 ? `₹${selectedPrintWo.budget_amount.toLocaleString()}.00` : 'No direct financial cost'}
                    </td>
                  </tr>
                  
                  {selectedPrintWo.budget_amount > 0 && (
                    <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                      <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Approved Contract Value:</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.15rem', fontWeight: 800, color: '#4F46E5' }}>
                        ₹{selectedPrintWo.budget_amount.toLocaleString()}.00
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Delivery and Schedule Terms */}
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '3.5rem', fontSize: '0.8rem', lineHeight: '1.5' }}>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.5rem', margin: 0 }}>Standard Delivery Terms & Completion Milestone:</h4>
                <p style={{ margin: '0 0 0.5rem', color: '#475569' }}>
                  The active operations under this Work Order must be physically executed, reviewed, and finalized by the estimated milestone completion date of <strong>{new Date(selectedPrintWo.completion_date).toLocaleDateString()}</strong>.
                </p>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>
                  * This document represents Version V{selectedPrintWo.version} of the assigned work order number {selectedPrintWo.wo_number} under project registration reference {selectedPrintWo.project.project_id}. Any amendments or modifications override previous version codes.
                </p>
              </div>

              {/* Authorization Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem' }}>
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ borderBottom: '1px solid #cbd5e1', height: '45px', marginBottom: '0.5rem' }}></div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, margin: 0 }}>Contractor / Vendor Representative</p>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Authorized Acceptor Signatory</span>
                </div>
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ borderBottom: '1px solid #cbd5e1', height: '45px', marginBottom: '0.5rem' }}>
                    {selectedPrintWo.status === 'Completed' && <span style={{ color: '#10b981', fontStyle: 'italic', fontWeight: 800, fontSize: '0.85rem', display: 'inline-block', transform: 'rotate(-4deg)', border: '2.5px solid #10b981', padding: '0.1rem 0.4rem', borderRadius: '4px', marginTop: '10px' }}>DULY SIGNED & LOCKED</span>}
                    {selectedPrintWo.status === 'Approved' && <span style={{ color: '#f59e0b', fontStyle: 'italic', fontWeight: 800, fontSize: '0.85rem', display: 'inline-block', transform: 'rotate(-4deg)', border: '2.5px solid #f59e0b', padding: '0.1rem 0.4rem', borderRadius: '4px', marginTop: '10px' }}>OFFICIALLY APPROVED</span>}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, margin: 0 }}>NAAM Foundation Auditor</p>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Audit Board Signature Code</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
