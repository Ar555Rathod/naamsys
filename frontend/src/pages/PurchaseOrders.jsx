import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Search, FileCheck2, History, Edit3, CheckCircle, UploadCloud, Printer, XCircle, Building, User, Calendar, Receipt } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import api, { getUploadUrl } from '../api';

export default function PurchaseOrders() {
  const location = useLocation();
  const [pos, setPos] = useState([]);
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [contractors, setContractors] = useState([]);
  
  const [showForm, setShowForm] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyPoNumber, setHistoryPoNumber] = useState('');
  
  const [uploadingPoId, setUploadingPoId] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [mockFileName, setMockFileName] = useState('');
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
      setMockFileName(res.data.filename);
      alert('Signed Purchase Order PDF uploaded successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to upload PDF copy');
    } finally {
      setIsUploading(false);
    }
  };

  const [selectedPrintPo, setSelectedPrintPo] = useState(null);

  // Form states
  const [isAmending, setIsAmending] = useState(false);
  const [amendPoNumber, setAmendPoNumber] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editPoNumber, setEditPoNumber] = useState('');

  const [project_id, setProjectId] = useState('');
  const [vendor_id, setVendorId] = useState('');
  const [contractor_id, setContractorId] = useState('');
  const [work_order_id, setWorkOrderId] = useState('');
  const [approvedWos, setApprovedWos] = useState([]);
  const [item_details, setItemDetails] = useState('');
  const [delivery_date, setDeliveryDate] = useState('');
  const [total_amount, setTotalAmount] = useState('');
  const [status, setStatus] = useState('Draft');
  const [remarks, setRemarks] = useState('');

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPos();
    fetchData();
  }, []);

  useEffect(() => {
    if (location.state?.selectedId && pos.length > 0) {
      const found = pos.find(p => p.id === location.state.selectedId);
      if (found) {
        setSelectedPrintPo(found);
      }
    }
  }, [location.state, pos]);

  const fetchPos = async () => {
    try {
      const res = await api.get('/purchase-orders');
      setPos(res.data);
    } catch (err) { console.error('Failed to fetch Purchase Orders', err); }
  };

  const fetchData = async () => {
    try {
      const pRes = await api.get('/projects'); setProjects(pRes.data);
      const vRes = await api.get('/vendors'); setVendors(vRes.data);
      const cRes = await api.get('/vendors/contractors'); setContractors(cRes.data);
      const woRes = await api.get('/work-orders');
      setApprovedWos(woRes.data.filter(w => w.status === 'Completed'));
    } catch (err) { console.error('Failed to fetch data', err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing && !isAmending && !work_order_id) {
      alert('Please link a completed Work Order.');
      return;
    }
    try {
      const payload = {
        project_id,
        vendor_id,
        contractor_id: contractor_id || null,
        work_order_id: parseInt(work_order_id),
        item_details,
        delivery_date,
        total_amount: parseFloat(total_amount),
        status
      };

      if (isEditing) {
        await api.put(`/purchase-orders/${editId}`, {
          project_id,
          vendor_id,
          contractor_id: contractor_id || null,
          item_details,
          delivery_date,
          total_amount: parseFloat(total_amount),
          status,
          remarks: remarks || `In-place edit in Draft mode`
        });
        alert('Purchase Order updated successfully.');
      } else if (isAmending) {
        await api.post('/purchase-orders/amend', {
          po_number: amendPoNumber,
          item_details,
          delivery_date,
          total_amount: parseFloat(total_amount),
          contractor_id: contractor_id || null,
          status,
          remarks: remarks || `Amended version creation`
        });
        alert('Purchase Order amended successfully (New version created).');
      } else {
        await api.post('/purchase-orders', payload);
        alert('Purchase Order created successfully.');
      }
      
      // Reset Form
      setShowForm(false);
      setIsAmending(false);
      setAmendPoNumber('');
      setIsEditing(false);
      setEditId(null);
      setEditPoNumber('');
      setProjectId(''); setVendorId(''); setContractorId(''); setWorkOrderId(''); setItemDetails(''); setDeliveryDate(''); setTotalAmount(''); setStatus('Draft'); setRemarks('');
      fetchPos();
    } catch (err) {
      alert('Failed to submit Purchase Order');
    }
  };

  const handleWorkOrderChange = (woId) => {
    setWorkOrderId(woId);
    if (!woId) {
      setProjectId('');
      setVendorId('');
      setContractorId('');
      return;
    }
    const selectedWo = approvedWos.find(w => w.id === parseInt(woId));
    if (selectedWo) {
      setProjectId(selectedWo.project_id.toString());
      setVendorId(selectedWo.vendor_id.toString());
      setContractorId(selectedWo.contractor_id ? selectedWo.contractor_id.toString() : '');
      if (selectedWo.work_description) {
        setItemDetails(`As per Work Order ${selectedWo.wo_number}:\n${selectedWo.work_description}`);
      }
      if (selectedWo.budget_amount) {
        setTotalAmount(selectedWo.budget_amount.toString());
      }
    }
  };

  const handleEditClick = (po) => {
    setIsEditing(true);
    setIsAmending(false);
    setEditId(po.id);
    setEditPoNumber(po.po_number);
    setProjectId(po.project_id.toString());
    setVendorId(po.vendor_id.toString());
    setContractorId(po.contractor_id ? po.contractor_id.toString() : '');
    setWorkOrderId(po.work_order_id ? po.work_order_id.toString() : '');
    setItemDetails(po.item_details);
    setDeliveryDate(new Date(po.delivery_date).toISOString().split('T')[0]);
    setTotalAmount(po.total_amount.toString());
    setStatus(po.status);
    setRemarks(po.remarks || '');
    setShowForm(true);
  };

  const handleAmendClick = (po) => {
    setIsAmending(true);
    setIsEditing(false);
    setEditId(null);
    setEditPoNumber('');
    setAmendPoNumber(po.po_number);
    setProjectId(po.project_id.toString());
    setVendorId(po.vendor_id.toString());
    setContractorId(po.contractor_id ? po.contractor_id.toString() : '');
    setWorkOrderId(po.work_order_id ? po.work_order_id.toString() : '');
    setItemDetails(po.item_details);
    setDeliveryDate(new Date(po.delivery_date).toISOString().split('T')[0]);
    setTotalAmount(po.total_amount.toString());
    setStatus('Draft');
    setRemarks('');
    setShowForm(true);
  };

  const handleViewHistory = async (po) => {
    try {
      const res = await api.get(`/purchase-orders/history/${po.po_number}`);
      setSelectedHistory(res.data);
      setHistoryPoNumber(po.po_number);
      setShowHistoryModal(true);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch history');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/purchase-orders/${id}/status`, { status: 'Approved', remarks: 'Purchase Order approved by Admin Auditor' });
      alert('Purchase Order approved successfully.');
      fetchPos();
    } catch (err) {
      alert('Failed to approve Purchase Order.');
    }
  };

  const handleUploadClick = (po) => {
    setUploadingPoId(po.id);
    setMockFileName('');
    setShowUploadModal(true);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!mockFileName) {
      alert('Please upload a duly signed PDF file from your device first.');
      return;
    }
    try {
      await api.put(`/purchase-orders/${uploadingPoId}/upload-signed`, { duly_signed_url: mockFileName });
      alert('Duly signed copy uploaded successfully! Purchase Order status is now Completed and allowed for invoice creation.');
      setShowUploadModal(false);
      setUploadingPoId(null);
      fetchPos();
    } catch (err) {
      alert('Failed to upload signed copy.');
    }
  };

  const handlePrint = (po) => {
    if (po.duly_signed_url) {
      window.open(getUploadUrl(po.duly_signed_url), '_blank');
      // Ensure no print preview modal remains open
      setSelectedPrintPo(null);
      return;
    }
    setSelectedPrintPo(po);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const filteredPos = pos.filter(p => 
    p.po_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.vendor.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="main-content">


      <div className="page-header no-print">
        <h1 className="page-title">Purchase Orders</h1>
        <button className="btn btn-primary" onClick={() => {
          setIsAmending(false);
          setIsEditing(false);
          setEditId(null);
          setEditPoNumber('');
          setAmendPoNumber('');
          setProjectId(''); setVendorId(''); setContractorId(''); setItemDetails(''); setDeliveryDate(''); setTotalAmount(''); setStatus('Draft'); setRemarks('');
          setShowForm(!showForm);
        }}>
          <PlusCircle size={18} /> {showForm ? 'Cancel' : 'Create Purchase Order'}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel no-print" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>
            {isEditing ? `Edit Purchase Order: ${editPoNumber} (Draft Mode)` : isAmending ? `Amend Purchase Order: ${amendPoNumber} (Creates Next Version)` : 'Create New Purchase Order'}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Link Completed Work Order (Required)</label>
              <select value={work_order_id} onChange={e=>handleWorkOrderChange(e.target.value)} className="input-field" required disabled={isAmending}>
                <option value="">-- Select Completed Work Order --</option>
                {approvedWos.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.wo_number} - {w.vendor.company_name} ({w.project.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Project</label>
              <select value={project_id} onChange={e=>setProjectId(e.target.value)} className="input-field" required disabled={isAmending || !!work_order_id}>
                <option value="">-- Select Project --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.project_id})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Vendor (Mandatory)</label>
              <select value={vendor_id} onChange={e=>setVendorId(e.target.value)} className="input-field" required disabled={isAmending || !!work_order_id}>
                <option value="">-- Select Vendor --</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Contractor (Optional)</label>
              <select value={contractor_id} onChange={e=>setContractorId(e.target.value)} className="input-field" disabled={!!work_order_id}>
                <option value="">-- Select Contractor (Optional) --</option>
                {contractors.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Delivery / Implementation Date</label>
              <input type="date" value={delivery_date} onChange={e=>setDeliveryDate(e.target.value)} className="input-field" required />
            </div>

            <div className="form-group">
              <label>Total PO Amount (₹)</label>
              <input type="number" value={total_amount} onChange={e=>setTotalAmount(e.target.value)} className="input-field" placeholder="e.g. 250000" required />
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
                <input type="text" value={remarks} onChange={e=>setRemarks(e.target.value)} className="input-field" placeholder="e.g. Price adjustment, modified specifications" required={isAmending} />
              </div>
            )}

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Item Description & Technical Specifications</label>
              <textarea value={item_details} onChange={e=>setItemDetails(e.target.value)} className="input-field" rows="4" placeholder="Detail the goods, parts, materials, or supply scope to be purchased..." required></textarea>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary">
                {isEditing ? 'Save Changes' : isAmending ? 'Generate Amended Version' : 'Save Purchase Order'}
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
            placeholder="Search active Purchase Orders..." 
            value={searchTerm}
            onChange={e=>setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', width: '100%', fontFamily: 'Inter' }} 
          />
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Version</th>
              <th>Project</th>
              <th>Vendor / Contractor</th>
              <th>PO Value (₹)</th>
              <th>Timeline</th>
              <th>Status</th>
              <th style={{textAlign: 'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPos.map(p => (
              <tr key={p.id} className="hover-row">
                <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Receipt size={16} /> {p.po_number}
                  </div>
                </td>
                <td style={{fontWeight: 500}}>
                  A{p.version}
                  {p.creator && <><br/><small style={{color:'var(--text-muted)', fontSize: '0.7rem'}}>By: {p.creator.name}</small></>}
                </td>
                <td>{p.project.name} <br/><small style={{color:'var(--text-muted)'}}>{p.project.project_id}</small></td>
                <td>
                  <strong>{p.vendor.company_name}</strong>
                  {p.contractor && <><br/><small style={{color:'var(--text-muted)'}}>Sub-Contractor: {p.contractor.full_name}</small></>}
                </td>
                <td style={{fontWeight: 600}}>₹{p.total_amount.toLocaleString()}</td>
                <td>{new Date(p.delivery_date).toLocaleDateString()}</td>
                <td>
                  <span className={`badge badge-${p.status === 'Completed' ? 'success' : p.status === 'Approved' ? 'warning' : p.status === 'SentToVendor' ? 'info' : 'secondary'}`}>
                    {p.status === 'SentToVendor' ? 'Sent To Vendor' : p.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                    <button onClick={() => handleViewHistory(p)} className="btn btn-icon" style={{background: 'rgba(255,255,255,0.03)', padding: '0.4rem'}} title="Version History">
                      <History size={15} />
                    </button>
                    
                    <button onClick={() => handlePrint(p)} className="btn btn-icon" style={{background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)', padding: '0.4rem'}} title="Print Purchase Order">
                      <Printer size={15} />
                    </button>

                    {p.status !== 'Completed' && (
                      p.status === 'Draft' ? (
                        <button onClick={() => handleEditClick(p)} className="btn btn-icon" style={{background: 'rgba(59, 130, 246, 0.08)', color: 'var(--primary)', padding: '0.4rem'}} title="Edit Draft Order">
                          <Edit3 size={15} />
                        </button>
                      ) : (
                        <button onClick={() => handleAmendClick(p)} className="btn btn-icon" style={{background: 'rgba(0,0,0,0.05)', padding: '0.4rem'}} title="Amend Order">
                          <Edit3 size={15} />
                        </button>
                      )
                    )}

                    {(p.status === 'Draft' || p.status === 'SentToVendor') && (
                      <button onClick={() => handleApprove(p.id)} className="btn btn-icon" style={{background: 'rgba(16, 185, 129, 0.08)', color: 'var(--success)', padding: '0.4rem'}} title="Admin Approve">
                        <CheckCircle size={15} />
                      </button>
                    )}

                    {(p.status === 'Approved' || p.status === 'Completed') && (
                      <button onClick={() => handleUploadClick(p)} className="btn" style={{padding: '0.35rem 0.6rem', fontSize: '0.75rem', gap: '0.2rem', background: 'var(--primary)', color: 'white'}} title="Upload Signed Copy">
                        <UploadCloud size={13} /> Sign
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredPos.length === 0 && <tr><td colSpan="8" style={{textAlign:'center', color: 'var(--text-muted)'}}>No active Purchase Orders found.</td></tr>}
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
              <History color="var(--primary)" /> Version History: {historyPoNumber}
            </h2>
            <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr style={{background: 'rgba(0,0,0,0.02)'}}>
                    <th>Ver</th>
                    <th>Created At</th>
                    <th>Items</th>
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
                      <td style={{fontSize: '0.8rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={h.item_details}>{h.item_details}</td>
                      <td style={{fontSize: '0.8rem', fontWeight: 600}}>₹{h.total_amount.toLocaleString()}</td>
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
              <UploadCloud color="var(--primary)" /> Upload Signed Purchase Order
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
      {selectedPrintPo && !selectedPrintPo.duly_signed_url && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'white' }}>
            
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-light)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Purchase Order Print Preview</span>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => window.print()} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                  <Printer size={16} /> Print / Save PDF
                </button>
                <button onClick={() => setSelectedPrintPo(null)} className="btn btn-danger" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', gap: '0.25rem' }}>
                  <XCircle size={16} /> Close
                </button>
              </div>
            </div>

            {/* Printable Frame Area */}
            <div id="printable-po-modal-content" style={{ padding: '3.5rem', fontFamily: 'Inter, sans-serif', color: '#1e293b', background: 'white' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #4F46E5', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '-0.025em', margin: 0 }}>NAAM Foundation</h1>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.4rem', lineHeight: '1.4' }}>
                    Plot No 219, Fergusson College Rd, Shivaji Nagar, Pune, MH, 411016<br />
                    Email: finance@naammh.org | Reg: MAH/1196/2015/Pune
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>PURCHASE ORDER</h2>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.4rem', lineHeight: '1.4' }}>
                    PO Ref: <strong>{selectedPrintPo.po_number}</strong><br />
                    Version: <strong>A{selectedPrintPo.version}</strong><br />
                    Date: {new Date(selectedPrintPo.created_at).toLocaleDateString()}<br />
                    {selectedPrintPo.creator && <>Issued By: <strong>{selectedPrintPo.creator.name}</strong><br /></>}
                    {selectedPrintPo.status === 'Approved' && <>Approved By: <strong>Audit Board</strong></>}
                  </p>
                </div>
              </div>

              {/* Order Specifics Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Supplier / Vendor Details:</h4>
                  <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
                    <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{selectedPrintPo.vendor.company_name}</strong>
                    <p style={{ color: '#475569', marginTop: '0.3rem', margin: 0 }}>
                      Owner Name: {selectedPrintPo.vendor.owner_name}<br />
                      PAN Card: {selectedPrintPo.vendor.pan}<br />
                      GSTIN: {selectedPrintPo.vendor.gst || 'N/A'}<br />
                      Contact: {selectedPrintPo.vendor.owner_contact}
                    </p>
                    {selectedPrintPo.vendor.address_line1 ? (
                      <p style={{ color: '#475569', marginTop: '0.3rem', margin: 0 }}>
                        Address: {selectedPrintPo.vendor.address_line1}, {selectedPrintPo.vendor.address_line2}, {selectedPrintPo.vendor.address_line3}
                      </p>
                    ) : selectedPrintPo.vendor.owner_address && (
                      <p style={{ color: '#475569', marginTop: '0.3rem', margin: 0 }}>Address: {selectedPrintPo.vendor.owner_address}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Ship To & Project Billing Details:</h4>
                  <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
                    <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>NAAM Project: {selectedPrintPo.project.project_id}</strong>
                    <p style={{ color: '#475569', marginTop: '0.3rem', margin: 0 }}>
                      Project Name: {selectedPrintPo.project.name}<br />
                      Location: {selectedPrintPo.project.village_name || selectedPrintPo.project.village_id || 'N/A'}, Taluka: {selectedPrintPo.project.taluka_name || selectedPrintPo.project.taluka_id || 'N/A'}, Dist: {selectedPrintPo.project.district_name || selectedPrintPo.project.district_id || 'N/A'}<br />
                      MoU Reference: {selectedPrintPo.project.proposal_id || 'N/A'}
                    </p>
                    {selectedPrintPo.contractor && (
                      <p style={{ color: '#475569', marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.4rem', margin: 0 }}>
                        <strong>Assignee Contractor:</strong> {selectedPrintPo.contractor.full_name} ({selectedPrintPo.contractor.pan})
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Summary Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2.5rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569', width: '70%' }}>Description of Goods / Supply Items</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569', width: '30%' }}>PO Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1.25rem 1rem', fontSize: '0.875rem', verticalAlign: 'top', lineHeight: '1.5' }}>
                      <strong>Material Supply and Delivery under PO Reference {selectedPrintPo.po_number}</strong>
                      <p style={{ color: '#475569', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                        {selectedPrintPo.item_details}
                      </p>
                    </td>
                    <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', verticalAlign: 'top' }}>
                      ₹{selectedPrintPo.total_amount.toLocaleString()}.00
                    </td>
                  </tr>
                  
                  <tr style={{ borderTop: '2px solid #cbd5e1' }}>
                    <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Total PO Value (Inclusive of Taxes):</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.15rem', fontWeight: 800, color: '#4F46E5' }}>
                      ₹{selectedPrintPo.total_amount.toLocaleString()}.00
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Delivery and Schedule Terms */}
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '3.5rem', fontSize: '0.8rem', lineHeight: '1.5' }}>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.5rem', margin: 0 }}>MoU Standard Purchase Order Terms:</h4>
                <p style={{ margin: '0 0 0.5rem', color: '#475569' }}>
                  The supply items or materials under this Purchase Order must be delivered and installed at the designated site location by the delivery date of <strong>{new Date(selectedPrintPo.delivery_date).toLocaleDateString()}</strong>.
                </p>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>
                  * This Purchase Order requires a Duly Signed Copy to be executed and uploaded back to the NAAM Foundation Portal. Only after verification can billing and invoice creation be authorized against this order.
                </p>
              </div>

              {/* Authorization Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem' }}>
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ borderBottom: '1px solid #cbd5e1', height: '45px', marginBottom: '0.5rem' }}></div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, margin: 0 }}>Vendor / Supplier Authorized Signatory</p>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Acceptor Acceptance Signature</span>
                </div>
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ borderBottom: '1px solid #cbd5e1', height: '45px', marginBottom: '0.5rem' }}>
                    {selectedPrintPo.status === 'Completed' && <span style={{ color: '#10b981', fontStyle: 'italic', fontWeight: 800, fontSize: '0.85rem', display: 'inline-block', transform: 'rotate(-4deg)', border: '2.5px solid #10b981', padding: '0.1rem 0.4rem', borderRadius: '4px', marginTop: '10px' }}>DULY SIGNED & COMPLETED</span>}
                    {selectedPrintPo.status === 'Approved' && <span style={{ color: '#f59e0b', fontStyle: 'italic', fontWeight: 800, fontSize: '0.85rem', display: 'inline-block', transform: 'rotate(-4deg)', border: '2.5px solid #f59e0b', padding: '0.1rem 0.4rem', borderRadius: '4px', marginTop: '10px' }}>OFFICIALLY APPROVED</span>}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, margin: 0 }}>NAAM Foundation Comptroller</p>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Audit / Budget Comptroller Signature</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
