import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Search, FileCheck2, History, Edit3, CheckCircle, UploadCloud, Printer, XCircle, Building, User, Calendar, FileText, Trash2, Camera, Image } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import api, { getUploadUrl } from '../api';

export default function WorkOrders() {
  const location = useLocation();
  const [wos, setWos] = useState([]);
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [contractors, setContractors] = useState([]);
  
  const [showForm, setShowForm] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyWoNumber, setHistoryWoNumber] = useState('');
  const [selectedPrintWo, setSelectedPrintWo] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  
  // Daily Log state variables
  const [selectedLogsWo, setSelectedLogsWo] = useState(null);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logsList, setLogsList] = useState([]);
  const [machineName, setMachineName] = useState('');
  
  // Daily Log Form states
  const [logDate, setLogDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
  const [startReading, setStartReading] = useState('');
  const [stopReading, setStopReading] = useState('');
  const [dailyHours, setDailyHours] = useState('');
  const [dieselQty, setDieselQty] = useState('');
  const [dieselIssuedBy, setDieselIssuedBy] = useState('');
  const [siteImageName, setSiteImageName] = useState('');
  const [isUploadingSiteImage, setIsUploadingSiteImage] = useState(false);
  const siteImageInputRef = useRef(null);
  const siteImageCameraInputRef = useRef(null);

  // Signed photocopy upload states
  const [logsPhotocopyName, setLogsPhotocopyName] = useState('');
  const [isUploadingLogsPhotocopy, setIsUploadingLogsPhotocopy] = useState(false);
  const logsPhotocopyInputRef = useRef(null);

  // Log Print state
  const [selectedPrintLogsWo, setSelectedPrintLogsWo] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('naam_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser(payload);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Compute daily hours automatically based on readings
  useEffect(() => {
    if (startReading && stopReading) {
      const diff = parseFloat(stopReading) - parseFloat(startReading);
      if (!isNaN(diff) && diff >= 0) {
        setDailyHours(diff.toFixed(2));
      }
    }
  }, [startReading, stopReading]);

  const fetchLogs = async (woId) => {
    try {
      const res = await api.get(`/work-orders/${woId}/daily-logs`);
      setLogsList(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch daily logs.');
    }
  };

  const handleOpenLogs = (wo) => {
    setSelectedLogsWo(wo);
    setMachineName(wo.machine_name || '');
    setLogsPhotocopyName(wo.signed_logs_url || '');
    setLogDate(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
    setStartReading('');
    setStopReading('');
    setDailyHours('');
    setDieselQty('');
    setDieselIssuedBy('');
    setSiteImageName('');
    fetchLogs(wo.id);
    setShowLogsModal(true);
  };

  const handleUpdateMachineName = async (e) => {
    e.preventDefault();
    if (!machineName.trim()) {
      alert('Machine Name cannot be empty.');
      return;
    }
    try {
      await api.put(`/work-orders/${selectedLogsWo.id}/machine-name`, { machine_name: machineName });
      alert('Machine Name updated successfully.');
      setSelectedLogsWo(prev => ({ ...prev, machine_name: machineName }));
      setWos(prev => prev.map(w => w.id === selectedLogsWo.id ? { ...w, machine_name: machineName } : w));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update Machine Name.');
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!logDate || !startReading || !stopReading || !dailyHours) {
      alert('Date, Start Reading, Stop Reading, and Daily Hours are mandatory.');
      return;
    }
    try {
      const payload = {
        date: logDate,
        start_reading: parseFloat(startReading),
        stop_reading: parseFloat(stopReading),
        daily_hours: parseFloat(dailyHours),
        diesel_qty: dieselQty ? parseFloat(dieselQty) : null,
        diesel_issued_by: dieselIssuedBy || null,
        site_image_url: siteImageName || null
      };
      await api.post(`/work-orders/${selectedLogsWo.id}/daily-logs`, payload);
      alert('Daily log added successfully.');
      setLogDate(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
      setStartReading('');
      setStopReading('');
      setDailyHours('');
      setDieselQty('');
      setDieselIssuedBy('');
      setSiteImageName('');
      fetchLogs(selectedLogsWo.id);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add daily log.');
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this log entry?')) return;
    try {
      await api.delete(`/work-orders/daily-logs/${logId}`);
      alert('Daily log entry deleted successfully.');
      fetchLogs(selectedLogsWo.id);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete daily log entry.');
    }
  };

  const handleSiteImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setIsUploadingSiteImage(true);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSiteImageName(res.data.filename);
      alert('Site image uploaded successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to upload site image');
    } finally {
      setIsUploadingSiteImage(false);
    }
  };

  const handleLogsPhotocopyChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setIsUploadingLogsPhotocopy(true);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const filename = res.data.filename;
      setLogsPhotocopyName(filename);
      
      await api.put(`/work-orders/${selectedLogsWo.id}/upload-signed-logs`, { signed_logs_url: filename });
      alert('Signed daily logs photocopy uploaded successfully!');
      
      setSelectedLogsWo(prev => ({ ...prev, signed_logs_url: filename }));
      setWos(prev => prev.map(w => w.id === selectedLogsWo.id ? { ...w, signed_logs_url: filename } : w));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to upload signed daily logs photocopy');
    } finally {
      setIsUploadingLogsPhotocopy(false);
    }
  };

  const handleLogsApproval = async (approved) => {
    try {
      await api.put(`/work-orders/${selectedLogsWo.id}/logs-approval`, { logs_approved: approved });
      alert(`Daily logs ${approved ? 'approved' : 'rejected'} successfully.`);
      
      const newStatus = approved ? 'Completed' : 'SentToVendor';
      setSelectedLogsWo(prev => ({ ...prev, logs_approved: approved, status: newStatus }));
      setWos(prev => prev.map(w => w.id === selectedLogsWo.id ? { ...w, logs_approved: approved, status: newStatus } : w));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update logs approval status.');
    }
  };

  const handlePrintLogs = (wo) => {
    setSelectedPrintLogsWo(wo);
    setTimeout(() => {
      window.print();
    }, 200);
  };


  // Form states
  const [isAmending, setIsAmending] = useState(false);
  const [amendWoNumber, setAmendWoNumber] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editWoNumber, setEditWoNumber] = useState('');

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

  useEffect(() => {
    if (location.state?.selectedId && wos.length > 0) {
      const found = wos.find(w => w.id === location.state.selectedId);
      if (found) {
        setSelectedPrintWo(found);
      }
    }
  }, [location.state, wos]);

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
      if (isEditing) {
        await api.put(`/work-orders/${editId}`, {
          project_id,
          vendor_id,
          contractor_id: contractor_id || null,
          work_description,
          completion_date,
          budget_amount: budget_amount ? parseFloat(budget_amount) : 0,
          status,
          remarks: remarks || `In-place edit in Draft mode`
        });
        alert('Work Order updated successfully.');
      } else if (isAmending) {
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
      setIsEditing(false);
      setEditId(null);
      setEditWoNumber('');
      setProjectId(''); setVendorId(''); setContractorId(''); setWorkDescription(''); setCompletionDate(''); setBudgetAmount(''); setStatus('Draft'); setRemarks('');
      fetchWos();
    } catch (err) {
      alert('Failed to submit Work Order');
    }
  };

  const handleEditClick = (wo) => {
    setIsEditing(true);
    setIsAmending(false);
    setEditId(wo.id);
    setEditWoNumber(wo.wo_number);
    setProjectId(wo.project_id.toString());
    setVendorId(wo.vendor_id.toString());
    setContractorId(wo.contractor_id ? wo.contractor_id.toString() : '');
    setWorkDescription(wo.work_description);
    setCompletionDate(new Date(wo.completion_date).toISOString().split('T')[0]);
    setBudgetAmount(wo.budget_amount ? wo.budget_amount.toString() : '');
    setStatus(wo.status);
    setRemarks(wo.remarks || '');
    setShowForm(true);
  };

  const handleAmendClick = (wo) => {
    setIsAmending(true);
    setIsEditing(false);
    setEditId(null);
    setEditWoNumber('');
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
  const handlePrint = (wo) => {
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
        {currentUser?.role !== 'Vendor' && (
          <button className="btn btn-primary" onClick={() => {
            setIsAmending(false);
            setIsEditing(false);
            setEditId(null);
            setEditWoNumber('');
            setAmendWoNumber('');
            setProjectId(''); setVendorId(''); setContractorId(''); setWorkDescription(''); setCompletionDate(''); setBudgetAmount(''); setStatus('Draft'); setRemarks('');
            setShowForm(!showForm);
          }}>
            <PlusCircle size={18} /> {showForm ? 'Cancel' : 'Create Work Order'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass-panel no-print" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>
            {isEditing ? `Edit Work Order: ${editWoNumber} (Draft Mode)` : isAmending ? `Amend Work Order: ${amendWoNumber} (Creates Next Version)` : 'Create New Work Order'}
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

            {(isAmending || isEditing) && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Remarks / Rationale</label>
                <input type="text" value={remarks} onChange={e=>setRemarks(e.target.value)} className="input-field" placeholder="e.g. Scope extension, adjusted completion timeline" required={isAmending} />
              </div>
            )}

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Detailed Work Scope / Description</label>
              <textarea value={work_description} onChange={e=>setWorkDescription(e.target.value)} className="input-field" rows="4" placeholder="Describe the physical work to be executed..." required></textarea>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary">
                {isEditing ? 'Save Changes' : isAmending ? 'Generate Amended Version' : 'Save Work Order'}
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
                  A{w.version}
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
                  <span className={`badge badge-${w.status === 'Completed' ? 'success' : w.status === 'SentToVendor' ? 'info' : 'secondary'}`}>
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

                    <button onClick={() => handleOpenLogs(w)} className="btn btn-icon" style={{background: 'rgba(16, 185, 129, 0.08)', color: 'var(--secondary)', padding: '0.4rem'}} title="Daily Logs">
                      <FileText size={15} />
                    </button>

                    {currentUser?.role !== 'Vendor' && w.status === 'Draft' && (
                      <button onClick={() => handleEditClick(w)} className="btn btn-icon" style={{background: 'rgba(59, 130, 246, 0.08)', color: 'var(--primary)', padding: '0.4rem'}} title="Edit Draft Order">
                        <Edit3 size={15} />
                      </button>
                    )}

                    {currentUser?.role !== 'Vendor' && w.status !== 'Draft' && (
                      <button onClick={() => handleAmendClick(w)} className="btn btn-icon" style={{background: 'rgba(0,0,0,0.05)', padding: '0.4rem'}} title="Amend Order">
                        <Edit3 size={15} />
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
                        A{h.version} {h.is_active && <span style={{fontSize: '0.65rem', background: 'var(--primary)', color: 'white', padding: '0.1rem 0.3rem', borderRadius: '4px', marginLeft: '0.25rem'}}>ACTIVE</span>}
                        {h.creator && <div style={{fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.15rem'}}>By: {h.creator.name}</div>}
                      </td>
                      <td style={{fontSize: '0.8rem'}}>{new Date(h.created_at).toLocaleString()}</td>
                      <td style={{fontSize: '0.8rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={h.work_description}>{h.work_description}</td>
                      <td style={{fontSize: '0.8rem', fontWeight: 600}}>{h.budget_amount > 0 ? `₹${h.budget_amount.toLocaleString()}` : '—'}</td>
                      <td>
                        <span className={`badge badge-${h.status === 'Completed' ? 'success' : h.status === 'SentToVendor' ? 'info' : 'secondary'}`} style={{fontSize: '0.7rem'}}>
                          {h.status === 'SentToVendor' ? 'Sent To Vendor' : h.status}
                        </span>
                      </td>
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
                    Version: <strong>A{selectedPrintWo.version}</strong><br />
                    Date: {new Date(selectedPrintWo.created_at).toLocaleDateString()}<br />
                    {selectedPrintWo.creator && <>Issued By: <strong>{selectedPrintWo.creator.name}</strong><br /></>}
                    {selectedPrintWo.status === 'Completed' && <>Status: <strong>Completed</strong></>}
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
                  * This document represents Version A{selectedPrintWo.version} of the assigned work order number {selectedPrintWo.wo_number} under project registration reference {selectedPrintWo.project.project_id}. Any amendments or modifications override previous version codes.
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
                    {selectedPrintWo.status === 'Completed' && <span style={{ color: '#10b981', fontStyle: 'italic', fontWeight: 800, fontSize: '0.85rem', display: 'inline-block', transform: 'rotate(-4deg)', border: '2.5px solid #10b981', padding: '0.1rem 0.4rem', borderRadius: '4px', marginTop: '10px' }}>OFFICIALLY COMPLETED</span>}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, margin: 0 }}>NAAM Foundation Auditor</p>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Audit Board Signature Code</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DAILY LOG SHEET MANAGER MODAL */}
      {showLogsModal && selectedLogsWo && (
        <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', padding: '2.5rem', position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Modal Close Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontWeight: 700, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText color="var(--secondary)" /> Daily Log Sheet Manager
                </h2>
                <small style={{ color: 'var(--text-muted)' }}>Work Order Reference: {selectedLogsWo.wo_number}</small>
              </div>
              <button onClick={() => setShowLogsModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <XCircle size={24} />
              </button>
            </div>

            {/* Context Info Box */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'var(--bg-light)', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', flexShrink: 0 }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Project:</span>
                <strong>{selectedLogsWo.project.name} ({selectedLogsWo.project.project_id})</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Type of Work:</span>
                <strong>{selectedLogsWo.project.type_of_work}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Location:</span>
                <strong>
                  {selectedLogsWo.project.village_name || 'N/A'}, {selectedLogsWo.project.taluka_name || 'N/A'}, {selectedLogsWo.project.district_name || 'N/A'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Vendor:</span>
                <strong>{selectedLogsWo.vendor.company_name}</strong>
              </div>
            </div>

            {/* Machine Name section */}
            <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Machine Name Registration</h4>
              <form onSubmit={handleUpdateMachineName} style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Enter Machine Name once (e.g., JCB-3DX)" 
                  value={machineName} 
                  onChange={e => setMachineName(e.target.value)} 
                  disabled={selectedLogsWo.logs_approved || currentUser?.role !== 'Vendor'}
                  style={{ flex: 1, margin: 0 }}
                  required
                />
                {currentUser?.role === 'Vendor' && !selectedLogsWo.logs_approved && (
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', whiteSpace: 'nowrap' }}>
                    Save Machine Name
                  </button>
                )}
              </form>
              {selectedLogsWo.machine_name && (
                <small style={{ color: 'var(--secondary)', fontWeight: 600 }}>Active machine on-site: {selectedLogsWo.machine_name}</small>
              )}
            </div>

            {/* Log Entry Form (Vendor Side, only when not approved) */}
            {currentUser?.role === 'Vendor' && !selectedLogsWo.logs_approved && (
              <div className="glass-panel" style={{ padding: '1.5rem', flexShrink: 0 }}>
                <h3 style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '1rem' }}>Add Daily Entry</h3>
                <form onSubmit={handleAddLog} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Date *</label>
                    <input type="date" className="input-field" value={logDate} onChange={e => setLogDate(e.target.value)} required disabled />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Start Reading (Hrs) *</label>
                    <input type="number" step="any" className="input-field" placeholder="e.g. 1024.5" value={startReading} onChange={e => setStartReading(e.target.value)} required />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Stop Reading (Hrs) *</label>
                    <input type="number" step="any" className="input-field" placeholder="e.g. 1032.0" value={stopReading} onChange={e => setStopReading(e.target.value)} required />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Daily Hours *</label>
                    <input type="number" step="any" className="input-field" placeholder="Auto calculated" value={dailyHours} onChange={e => setDailyHours(e.target.value)} required />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Diesel (QTY/LTR) - <span style={{ color: 'var(--text-muted)' }}>Opt</span></label>
                    <input type="number" step="any" className="input-field" placeholder="Liters refueled" value={dieselQty} onChange={e => setDieselQty(e.target.value)} />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Diesel Issued By - <span style={{ color: 'var(--text-muted)' }}>Opt</span></label>
                    <input type="text" className="input-field" placeholder="Name of issuer" value={dieselIssuedBy} onChange={e => setDieselIssuedBy(e.target.value)} />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                    <label>On-Site Site Image - <span style={{ color: 'var(--text-muted)' }}>Optional</span></label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input 
                        type="file" 
                        ref={siteImageInputRef} 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={handleSiteImageChange} 
                      />
                      <input 
                        type="file" 
                        ref={siteImageCameraInputRef} 
                        accept="image/*" 
                        capture="environment" 
                        style={{ display: 'none' }} 
                        onChange={handleSiteImageChange} 
                      />
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button 
                          type="button" 
                          className="btn" 
                          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0,0,0,0.05)', fontSize: '0.85rem', padding: '0.6rem 1rem' }} 
                          onClick={() => siteImageInputRef.current?.click()}
                          disabled={isUploadingSiteImage}
                        >
                          <Image size={16} /> Choose from Gallery
                        </button>
                        <button 
                          type="button" 
                          className="btn" 
                          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0,0,0,0.05)', fontSize: '0.85rem', padding: '0.6rem 1rem' }} 
                          onClick={() => siteImageCameraInputRef.current?.click()}
                          disabled={isUploadingSiteImage}
                        >
                          <Camera size={16} /> Take Photo
                        </button>
                      </div>
                      {isUploadingSiteImage && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Uploading...</span>
                      )}
                      {siteImageName && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--secondary)', fontSize: '0.85rem', fontWeight: 600 }}>✓ site_image attached</span>
                          <a href={getUploadUrl(siteImageName)} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'underline' }}>View Preview</a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 2rem' }}>
                      Add Daily Log Entry
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Daily Logs Table */}
            <div className="glass-panel" style={{ overflow: 'hidden', flexShrink: 0 }}>
              <h3 style={{ padding: '1rem 1.5rem', margin: 0, fontWeight: 600, fontSize: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Daily Activity Log Sheet</span>
                <button className="btn" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: 'var(--primary)', color: 'white' }} onClick={() => handlePrintLogs(selectedLogsWo)}>
                  <Printer size={13} /> Print Log Sheet
                </button>
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Start Reading (Hrs)</th>
                    <th>Stop Reading (Hrs)</th>
                    <th>Daily Hours</th>
                    <th>Diesel (QTY/LTR)</th>
                    <th>Diesel Issued By</th>
                    <th style={{ textAlign: 'center' }}>Site Image</th>
                    {currentUser?.role === 'Vendor' && !selectedLogsWo.logs_approved && <th style={{ textAlign: 'center' }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {logsList.map(log => (
                    <tr key={log.id}>
                      <td>{new Date(log.date).toLocaleDateString()}</td>
                      <td>{log.start_reading}</td>
                      <td>{log.stop_reading}</td>
                      <td style={{ fontWeight: 600 }}>{log.daily_hours} Hrs</td>
                      <td>{log.diesel_qty !== null ? `${log.diesel_qty} Ltr` : '—'}</td>
                      <td>{log.diesel_issued_by || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        {log.site_image_url ? (
                          <a href={getUploadUrl(log.site_image_url)} target="_blank" rel="noreferrer" className="badge badge-success" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                            View Image
                          </a>
                        ) : '—'}
                      </td>
                      {currentUser?.role === 'Vendor' && !selectedLogsWo.logs_approved && (
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => handleDeleteLog(log.id)} className="btn btn-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', color: 'var(--danger)', padding: '0.3rem' }} title="Delete Log Entry">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {logsList.length === 0 ? (
                    <tr>
                      <td colSpan={currentUser?.role === 'Vendor' && !selectedLogsWo.logs_approved ? 8 : 7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No daily logs entered yet.
                      </td>
                    </tr>
                  ) : (
                    <tr style={{ background: 'rgba(0,0,0,0.02)', fontWeight: 700 }}>
                      <td colSpan={3} style={{ textAlign: 'right' }}>Total Calculated Hours:</td>
                      <td style={{ color: 'var(--primary)' }}>
                        {logsList.reduce((acc, curr) => acc + curr.daily_hours, 0).toFixed(2)} Hrs
                      </td>
                      <td colSpan={currentUser?.role === 'Vendor' && !selectedLogsWo.logs_approved ? 4 : 3}></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Logs Status, Upload and Approval section */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontWeight: 600, fontSize: '1rem' }}>Logs Scanned Photocopy Verification</h3>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.85rem' }}>Current Status:</span>
                  <span className={`badge badge-${selectedLogsWo.logs_approved ? 'success' : selectedLogsWo.signed_logs_url ? 'warning' : 'secondary'}`}>
                    {selectedLogsWo.logs_approved ? 'APPROVED & READY FOR PO' : selectedLogsWo.signed_logs_url ? 'AWAITING MANAGER APPROVAL' : 'SIGNED PHOTOCOPY PENDING'}
                  </span>
                </div>

                {/* Vendor uploads photocopy */}
                {currentUser?.role === 'Vendor' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input 
                      type="file" 
                      ref={logsPhotocopyInputRef} 
                      accept="application/pdf,image/*" 
                      style={{ display: 'none' }} 
                      onChange={handleLogsPhotocopyChange} 
                      disabled={selectedLogsWo.logs_approved}
                    />
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={() => logsPhotocopyInputRef.current?.click()}
                      disabled={selectedLogsWo.logs_approved || isUploadingLogsPhotocopy}
                    >
                      {isUploadingLogsPhotocopy ? 'Uploading Scanned Logs...' : selectedLogsWo.signed_logs_url ? 'Update Scanned Photocopy' : 'Upload Signed Logs Photocopy'}
                    </button>
                  </div>
                )}

                {/* Manager / Admin Approves photocopy */}
                {(currentUser?.role === 'Admin' || currentUser?.role === 'Manager') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {selectedLogsWo.signed_logs_url ? (
                      <a href={getUploadUrl(selectedLogsWo.signed_logs_url)} target="_blank" rel="noreferrer" className="btn" style={{ background: 'rgba(0,0,0,0.05)', fontSize: '0.85rem' }}>
                        View Uploaded Scanned Copy
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>No photocopy uploaded by vendor yet.</span>
                    )}

                    <button 
                      type="button" 
                      className={`btn btn-${selectedLogsWo.logs_approved ? 'danger' : 'success'}`}
                      onClick={() => handleLogsApproval(!selectedLogsWo.logs_approved)}
                      disabled={!selectedLogsWo.signed_logs_url}
                    >
                      {selectedLogsWo.logs_approved ? 'Unapprove Signed Copy' : 'Approve Final Signed Copy'}
                    </button>
                  </div>
                )}
              </div>

              {selectedLogsWo.signed_logs_url && (
                <div style={{ background: 'rgba(79, 70, 229, 0.03)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                    📂 {selectedLogsWo.signed_logs_url}
                  </span>
                  <a href={getUploadUrl(selectedLogsWo.signed_logs_url)} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: 'var(--primary)' }}>Download</a>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem', flexShrink: 0 }}>
              <button onClick={() => setShowLogsModal(false)} className="btn" style={{ background: 'rgba(0,0,0,0.08)', padding: '0.5rem 1.5rem' }}>Close Manager</button>
            </div>
          </div>
        </div>
      )}

      {selectedPrintLogsWo && (() => {
        const filledLogs = logsList || [];
        const totalRowsCount = 30;
        const rows = [];
        for (let i = 0; i < totalRowsCount; i++) {
          if (i < filledLogs.length) {
            rows.push(filledLogs[i]);
          } else {
            rows.push({ id: `empty-${i}`, date: null, start_reading: '', stop_reading: '', daily_hours: '', diesel_qty: null, diesel_issued_by: '' });
          }
        }
        const page1Rows = rows.slice(0, 15);
        const page2Rows = rows.slice(15, 30);
        return (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '95vw', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'white' }}>
              
              <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>Daily Logs Record Print Preview (Landscape Layout - 30 Logs across 2 Pages)</span>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => window.print()} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                    <Printer size={16} /> Print / Save PDF
                  </button>
                  <button onClick={() => setSelectedPrintLogsWo(null)} className="btn btn-danger" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', gap: '0.25rem' }}>
                    <XCircle size={16} /> Close
                  </button>
                </div>
              </div>

              {/* Printable Frame Area */}
              <div id="printable-daily-logs-modal-content" style={{ padding: '0.5cm', fontFamily: 'Inter, sans-serif', color: '#000', background: 'white', width: '100%' }}>
                
                {/* PAGE 1 CONTAINER */}
                <div className="page-break-after" style={{ minHeight: '100%' }}>
                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#000', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>NAAM FOUNDATION</h1>
                    <span style={{ fontSize: '0.75rem', color: '#555', fontWeight: 600 }}>DAILY LOG SHEET - PAGE 1</span>
                  </div>

                  {/* Specific Context Specs (Template-aligned layout) */}
                  <div style={{ margin: '0 0 0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '11px', borderBottom: '1.5px solid #000', paddingBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                      <span>
                        <strong>Village Name - </strong> 
                        <span style={{ borderBottom: '1px solid #000', paddingBottom: '1px', display: 'inline-block', minWidth: '150px', fontWeight: 600 }}>
                          {selectedPrintLogsWo.project.village_name || 'N/A'}
                        </span>
                      </span>
                      <span>
                        <strong>Tal - </strong> 
                        <span style={{ borderBottom: '1px solid #000', paddingBottom: '1px', display: 'inline-block', minWidth: '150px', fontWeight: 600 }}>
                          {selectedPrintLogsWo.project.taluka_name || 'N/A'}
                        </span>
                      </span>
                      <span>
                        <strong>Dist - </strong> 
                        <span style={{ borderBottom: '1px solid #000', paddingBottom: '1px', display: 'inline-block', minWidth: '150px', fontWeight: 600 }}>
                          {selectedPrintLogsWo.project.district_name || 'N/A'}
                        </span>
                      </span>
                    </div>
                    <div>
                      <span>
                        <strong>Project Details - </strong> 
                        <span style={{ borderBottom: '1px solid #000', paddingBottom: '1px', display: 'inline-block', minWidth: '450px', fontWeight: 600 }}>
                          {selectedPrintLogsWo.project.project_id} - {selectedPrintLogsWo.project.name}
                        </span>
                      </span>
                    </div>
                    <div>
                      <span>
                        <strong>Machine Name - </strong> 
                        <span style={{ borderBottom: '1px solid #000', paddingBottom: '1px', display: 'inline-block', minWidth: '250px', fontWeight: 600 }}>
                          {selectedPrintLogsWo.machine_name || 'N/A'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Logs Table Page 1 */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', fontSize: '9px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '1.5px solid #000' }}>
                        <th style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '5%' }}>Sr. No</th>
                        <th style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '10%' }}>Date</th>
                        <th style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '12%' }}>Start Reading</th>
                        <th style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '12%' }}>Stop Reading</th>
                        <th style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '10%' }}>Daily Hrs.</th>
                        <th style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '10%' }}>Diesel QTY/LTR</th>
                        <th style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '13%' }}>Diesel Issued By</th>
                        <th style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '11%' }}>Diesel Issued Sign</th>
                        <th style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '17%' }}>Site Incharge Name & Sign</th>
                      </tr>
                    </thead>
                    <tbody>
                      {page1Rows.map((row, idx) => {
                        const isReal = row.id !== undefined && !row.id.toString().startsWith('empty-');
                        return (
                          <tr key={row.id || `p1-${idx}`} style={{ borderBottom: '1px solid #000' }}>
                            <td style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center' }}>{idx + 1}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center' }}>{isReal ? new Date(row.date).toLocaleDateString() : ''}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center' }}>{isReal ? row.start_reading : ''}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center' }}>{isReal ? row.stop_reading : ''}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center', fontWeight: isReal ? 'bold' : 'normal' }}>{isReal ? row.daily_hours : ''}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center' }}>{isReal && row.diesel_qty !== null ? row.diesel_qty : ''}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center' }}>{isReal ? row.diesel_issued_by || '' : ''}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #000' }}></td>
                            <td style={{ padding: '2px 4px', border: '1px solid #000' }}></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* PAGE 2 CONTAINER */}
                <div style={{ marginTop: '0' }}>
                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                    <h1 className="print-only" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#000', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.2rem 0' }}>NAAM FOUNDATION</h1>
                    <span style={{ fontSize: '0.75rem', color: '#555', fontWeight: 600 }}>DAILY LOG SHEET - PAGE 2</span>
                  </div>

                  {/* Logs Table Page 2 */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', marginBottom: '0.5rem', fontSize: '9px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '1.5px solid #000' }}>
                        <th style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '5%' }}>Sr. No</th>
                        <th style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '10%' }}>Date</th>
                        <th style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '12%' }}>Start Reading</th>
                        <th style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '12%' }}>Stop Reading</th>
                        <th style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '10%' }}>Daily Hrs.</th>
                        <th style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '10%' }}>Diesel QTY/LTR</th>
                        <th style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '13%' }}>Diesel Issued By</th>
                        <th style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '11%' }}>Diesel Issued Sign</th>
                        <th style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '17%' }}>Site Incharge Name & Sign</th>
                      </tr>
                    </thead>
                    <tbody>
                      {page2Rows.map((row, idx) => {
                        const realIndex = 15 + idx;
                        const isReal = row.id !== undefined && !row.id.toString().startsWith('empty-');
                        return (
                          <tr key={row.id || `p2-${idx}`} style={{ borderBottom: '1px solid #000' }}>
                            <td style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center' }}>{realIndex + 1}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center' }}>{isReal ? new Date(row.date).toLocaleDateString() : ''}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center' }}>{isReal ? row.start_reading : ''}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center' }}>{isReal ? row.stop_reading : ''}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center', fontWeight: isReal ? 'bold' : 'normal' }}>{isReal ? row.daily_hours : ''}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center' }}>{isReal && row.diesel_qty !== null ? row.diesel_qty : ''}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #000', textAlign: 'center' }}>{isReal ? row.diesel_issued_by || '' : ''}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #000' }}></td>
                            <td style={{ padding: '2px 4px', border: '1px solid #000' }}></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Bottom calculations & physical signatures layout */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.5rem' }}>
                    
                    {/* Cumulative Totals Box (Bottom Left) */}
                    <div>
                      <table style={{ width: '220px', borderCollapse: 'collapse', border: '1.5px solid #000', fontSize: '9px' }}>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #000' }}>
                            <td style={{ border: '1px solid #000', padding: '3px 5px', fontWeight: 'bold', width: '70%' }}>Total Readings (Hours)</td>
                            <td style={{ border: '1px solid #000', padding: '3px 5px', textAlign: 'center', fontWeight: 'bold' }}>
                              {logsList.reduce((acc, curr) => acc + (curr.daily_hours || 0), 0).toFixed(2)}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ border: '1px solid #000', padding: '3px 5px', fontWeight: 'bold' }}>Total Diesel (Ltrs)</td>
                            <td style={{ border: '1px solid #000', padding: '3px 5px', textAlign: 'center', fontWeight: 'bold' }}>
                              {logsList.reduce((acc, curr) => acc + (curr.diesel_qty || 0), 0).toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Hand-signed Signatures (Bottom Right) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '320px', fontSize: '9px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <span style={{ fontWeight: 'bold' }}>Cont. Incharge Sign:</span>
                        <span style={{ width: '150px', borderBottom: '1px solid #000', display: 'inline-block' }}></span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <span style={{ fontWeight: 'bold' }}>Site Incharge / Sarpanch Sign:</span>
                        <span style={{ width: '150px', borderBottom: '1px solid #000', display: 'inline-block' }}></span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
