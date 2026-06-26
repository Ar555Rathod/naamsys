import React, { useState, useEffect, useRef } from 'react';
import { Printer, Trash2, UploadCloud, XCircle, FileText, Settings, Calendar, User, Camera, Image } from 'lucide-react';
import api, { getUploadUrl } from '../api';

export default function DailyLogs() {
  const [wos, setWos] = useState([]);
  const [selectedWo, setSelectedWo] = useState(null);
  const [logsList, setLogsList] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Form states
  const [machineName, setMachineName] = useState('');
  const [logDate, setLogDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
  const [startReading, setStartReading] = useState('');
  const [stopReading, setStopReading] = useState('');
  const [dailyHours, setDailyHours] = useState('');
  const [dieselQty, setDieselQty] = useState('');
  const [dieselIssuedBy, setDieselIssuedBy] = useState('');
  const [siteImageName, setSiteImageName] = useState('');
  const [isUploadingSiteImage, setIsUploadingSiteImage] = useState(false);

  const [logsPhotocopyName, setLogsPhotocopyName] = useState('');
  const [isUploadingLogsPhotocopy, setIsUploadingLogsPhotocopy] = useState(false);

  const [selectedPrintLogsWo, setSelectedPrintLogsWo] = useState(null);

  const siteImageInputRef = useRef(null);
  const siteImageCameraInputRef = useRef(null);
  const logsPhotocopyInputRef = useRef(null);

  useEffect(() => {
    // Decode user role from local token
    const token = localStorage.getItem('naam_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser(payload);
      } catch (e) {
        console.error(e);
      }
    }
    fetchWos();
  }, []);

  useEffect(() => {
    // Auto-calculate daily hours when readings change
    if (startReading !== '' && stopReading !== '') {
      const diff = parseFloat(stopReading) - parseFloat(startReading);
      if (!isNaN(diff) && diff >= 0) {
        setDailyHours(diff.toFixed(2));
      } else {
        setDailyHours('');
      }
    } else {
      setDailyHours('');
    }
  }, [startReading, stopReading]);

  const fetchWos = async () => {
    try {
      const res = await api.get('/work-orders');
      setWos(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load Work Orders.');
    }
  };

  const fetchLogs = async (woId) => {
    try {
      const res = await api.get(`/work-orders/${woId}/daily-logs`);
      setLogsList(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch daily logs.');
    }
  };

  const handleWoChange = (woId) => {
    if (!woId) {
      setSelectedWo(null);
      setLogsList([]);
      setMachineName('');
      setLogsPhotocopyName('');
      return;
    }
    const wo = wos.find(w => w.id === parseInt(woId));
    setSelectedWo(wo);
    setMachineName(wo.machine_name || '');
    setLogsPhotocopyName(wo.signed_logs_url || '');
    
    // Reset Form Fields
    setLogDate(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
    setStartReading('');
    setStopReading('');
    setDailyHours('');
    setDieselQty('');
    setDieselIssuedBy('');
    setSiteImageName('');
    
    fetchLogs(wo.id);
  };

  const handleUpdateMachineName = async (e) => {
    e.preventDefault();
    if (!machineName.trim()) {
      alert('Machine Name cannot be empty.');
      return;
    }
    try {
      await api.put(`/work-orders/${selectedWo.id}/machine-name`, { machine_name: machineName });
      alert('Machine Name updated successfully.');
      setSelectedWo(prev => ({ ...prev, machine_name: machineName }));
      setWos(prev => prev.map(w => w.id === selectedWo.id ? { ...w, machine_name: machineName } : w));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update Machine Name.');
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
      alert('Site activity image uploaded successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to upload site activity image');
    } finally {
      setIsUploadingSiteImage(false);
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
      await api.post(`/work-orders/${selectedWo.id}/daily-logs`, payload);
      alert('Daily log added successfully.');
      
      // Reset Form
      setLogDate(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
      setStartReading('');
      setStopReading('');
      setDailyHours('');
      setDieselQty('');
      setDieselIssuedBy('');
      setSiteImageName('');
      
      fetchLogs(selectedWo.id);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add daily log.');
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this log entry?')) return;
    try {
      await api.delete(`/work-orders/daily-logs/${logId}`);
      alert('Daily log entry deleted.');
      fetchLogs(selectedWo.id);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete daily log entry.');
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
      await api.put(`/work-orders/${selectedWo.id}/upload-signed-logs`, { signed_logs_url: filename });
      alert('Signed daily logs photocopy uploaded successfully!');
      setSelectedWo(prev => ({ ...prev, signed_logs_url: filename }));
      setWos(prev => prev.map(w => w.id === selectedWo.id ? { ...w, signed_logs_url: filename } : w));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload signed daily logs photocopy');
    } finally {
      setIsUploadingLogsPhotocopy(false);
    }
  };

  const handlePrintLogs = (wo) => {
    setSelectedPrintLogsWo(wo);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="main-content">
      <div className="page-header no-print">
        <h1 className="page-title">Daily Activity Logs</h1>
      </div>

      {/* Select Assigned Work Order Dropdown */}
      <div className="glass-panel no-print" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontWeight: 600 }}>Select Work Order</label>
          <select 
            value={selectedWo ? selectedWo.id : ''} 
            onChange={e => handleWoChange(e.target.value)} 
            className="input-field"
            style={{ maxWidth: '600px' }}
          >
            <option value="">-- Choose Assigned Work Order --</option>
            {wos.map(w => (
              <option key={w.id} value={w.id}>
                {w.wo_number} — {w.project.name} (Village: {w.project.village_name || 'N/A'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedWo ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="no-print">
          
          {/* Work Order Info Specs Card */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.2rem' }}>Work Order Ref</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{selectedWo.wo_number}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.2rem' }}>Project Name</span>
                <strong style={{ fontSize: '1rem' }}>{selectedWo.project.name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.2rem' }}>Location Specs</span>
                <strong style={{ fontSize: '0.95rem' }}>
                  {selectedWo.project.village_name || 'N/A'}, {selectedWo.project.taluka_name || 'N/A'}, {selectedWo.project.district_name || 'N/A'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.2rem' }}>Contracted Value</span>
                <strong style={{ fontSize: '1rem', color: 'var(--success)' }}>
                  {selectedWo.budget_amount > 0 ? `₹${selectedWo.budget_amount.toLocaleString()}` : '—'}
                </strong>
              </div>
            </div>

            {/* Set Machine Name Subsection */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <form onSubmit={handleUpdateMachineName} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Enter Machine Name (e.g. POCLAIN-210)"
                  value={machineName}
                  onChange={e => setMachineName(e.target.value)}
                  disabled={selectedWo.logs_approved}
                  style={{ flex: 1, margin: 0, minWidth: '260px' }}
                  required
                />
                {!selectedWo.logs_approved && (
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', whiteSpace: 'nowrap' }}>
                    Save Machine Name
                  </button>
                )}
              </form>
              {selectedWo.machine_name && (
                <div style={{ background: 'rgba(79, 70, 229, 0.05)', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}>
                  Active Machine: <strong style={{ color: 'var(--secondary)' }}>{selectedWo.machine_name}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Add Daily Activity Log Form */}
          {!selectedWo.logs_approved ? (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h2 style={{ marginBottom: '1.5rem', fontWeight: 600, fontSize: '1.1rem' }}>Add Daily Entry</h2>
              <form onSubmit={handleAddLog} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" className="input-field" value={logDate} onChange={e => setLogDate(e.target.value)} required disabled />
                </div>
                <div className="form-group">
                  <label>Start Reading (Hours) *</label>
                  <input type="number" step="any" className="input-field" placeholder="e.g. 1205.5" value={startReading} onChange={e => setStartReading(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Stop Reading (Hours) *</label>
                  <input type="number" step="any" className="input-field" placeholder="e.g. 1213.0" value={stopReading} onChange={e => setStopReading(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Daily Hours *</label>
                  <input type="number" step="any" className="input-field" placeholder="Auto calculated" value={dailyHours} onChange={e => setDailyHours(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Diesel (QTY in Liters) - <span style={{ color: 'var(--text-muted)' }}>Opt</span></label>
                  <input type="number" step="any" className="input-field" placeholder="e.g. 60" value={dieselQty} onChange={e => setDieselQty(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Diesel Issued By - <span style={{ color: 'var(--text-muted)' }}>Opt</span></label>
                  <input type="text" className="input-field" placeholder="Issuer Name" value={dieselIssuedBy} onChange={e => setDieselIssuedBy(e.target.value)} />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>On-Site Activity Image - <span style={{ color: 'var(--text-muted)' }}>Optional</span></label>
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

                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 2.5rem' }}>
                    Save Log Entry
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div style={{ background: 'rgba(16, 185, 129, 0.04)', padding: '1rem 1.5rem', borderRadius: '12px', borderLeft: '4px solid var(--success)', fontWeight: 600, color: 'var(--secondary)' }}>
              ✓ This Work Order logs are approved. Form submission is locked.
            </div>
          )}

          {/* Daily Logs Activity Log Sheet Table */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <h3 style={{ padding: '1rem 1.5rem', margin: 0, fontWeight: 600, fontSize: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Daily Activity Log Sheet</span>
              <button className="btn" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: 'var(--primary)', color: 'white' }} onClick={() => handlePrintLogs(selectedWo)}>
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
                  {!selectedWo.logs_approved && <th style={{ textAlign: 'center' }}>Action</th>}
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
                    {!selectedWo.logs_approved && (
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
                    <td colSpan={!selectedWo.logs_approved ? 8 : 7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No daily logs entered yet.
                    </td>
                  </tr>
                ) : (
                  <tr style={{ background: 'rgba(0,0,0,0.02)', fontWeight: 700 }}>
                    <td colSpan={3} style={{ textAlign: 'right' }}>Total Calculated Hours:</td>
                    <td style={{ color: 'var(--primary)' }}>
                      {logsList.reduce((acc, curr) => acc + curr.daily_hours, 0).toFixed(2)} Hrs
                    </td>
                    <td colSpan={!selectedWo.logs_approved ? 5 : 4}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Scanned Copy Upload Section */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontWeight: 600, fontSize: '1rem' }}>Logs Scanned Photocopy Verification</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.85rem' }}>Current Status:</span>
                <span className={`badge badge-${selectedWo.logs_approved ? 'success' : selectedWo.signed_logs_url ? 'warning' : 'secondary'}`}>
                  {selectedWo.logs_approved ? 'APPROVED & READY FOR PO' : selectedWo.signed_logs_url ? 'AWAITING MANAGER APPROVAL' : 'SIGNED PHOTOCOPY PENDING'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input 
                  type="file" 
                  ref={logsPhotocopyInputRef} 
                  accept="application/pdf,image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleLogsPhotocopyChange} 
                  disabled={selectedWo.logs_approved}
                />
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => logsPhotocopyInputRef.current?.click()}
                  disabled={selectedWo.logs_approved || isUploadingLogsPhotocopy}
                >
                  {isUploadingLogsPhotocopy ? 'Uploading Scanned Logs...' : selectedWo.signed_logs_url ? 'Update Scanned Photocopy' : 'Upload Signed Logs Photocopy'}
                </button>
              </div>
            </div>

            {selectedWo.signed_logs_url && (
              <div style={{ background: 'rgba(79, 70, 229, 0.03)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                  📂 {selectedWo.signed_logs_url}
                </span>
                <a href={getUploadUrl(selectedWo.signed_logs_url)} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: 'var(--primary)' }}>Download / View Scanned Copy</a>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="glass-panel no-print" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileText size={48} style={{ margin: '0 auto 1rem', strokeWidth: 1.5 }} />
          <p style={{ fontSize: '1.05rem', fontWeight: 500 }}>Please choose a Work Order from the dropdown to manage or view daily activity log sheets.</p>
        </div>
      )}

      {/* PRINT LAYOUT PORTAL - 30 LANDSCAPE ROWS */}
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
