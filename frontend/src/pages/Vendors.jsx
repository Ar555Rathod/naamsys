import React, { useState, useEffect } from 'react';
import { PlusCircle, Users, HardHat, User, Mail, Phone, Edit3, XCircle, FolderKanban, Info, CreditCard, PenTool, Receipt, Landmark, Printer } from 'lucide-react';
import api from '../api';

export default function Vendors() {
  const [activeTab, setActiveTab] = useState('vendors');
  const [showForm, setShowForm] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [showAllVendorInvoices, setShowAllVendorInvoices] = useState(false);
  const [showAllContractorInvoices, setShowAllContractorInvoices] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [vendors, setVendors] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [projects, setProjects] = useState([]);
  
  const [previewType, setPreviewType] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  const handlePreviewItem = (type, item) => {
    setPreviewType(type);
    setPreviewData(item);
  };
  
  // Vendor form
  const [company_name, setCompanyName] = useState('');
  const [pan, setPan] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [gst, setGst] = useState('');
  const [owner_name, setOwnerName] = useState('');
  const [owner_contact, setOwnerContact] = useState('');
  const [address_line1, setAddressLine1] = useState('');
  const [address_line2, setAddressLine2] = useState('');
  const [address_line3, setAddressLine3] = useState('');
  const [machine_details, setMachineDetails] = useState('');
  const [operator_details, setOperatorDetails] = useState('');
  const [bank_name, setBankName] = useState('');
  const [branch, setBranch] = useState('');
  const [account_no, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');

  // Contractor form
  const [contractor_name, setContractorName] = useState('');
  const [contractor_pan, setContractorPan] = useState('');
  const [contractor_aadhaar, setContractorAadhaar] = useState('');
  const [contractor_contact, setContractorContact] = useState('');
  const [contractor_address_line1, setContractorAddressLine1] = useState('');
  const [contractor_address_line2, setContractorAddressLine2] = useState('');
  const [contractor_address_line3, setContractorAddressLine3] = useState('');
  const [contractor_bank, setContractorBank] = useState('');
  const [contractor_branch, setContractorBranch] = useState('');
  const [contractor_account, setContractorAccount] = useState('');
  const [contractor_ifsc, setContractorIfsc] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const handleVendorClick = async (vendor) => {
    try {
      const res = await api.get(`/vendors/${vendor.id}`);
      setSelectedVendor(res.data);
    } catch (err) {
      console.error('Failed to fetch vendor details', err);
    }
  };

  const handleContractorClick = async (contractor) => {
    try {
      const res = await api.get(`/vendors/contractors/${contractor.id}`);
      setSelectedContractor(res.data);
    } catch (err) {
      console.error('Failed to fetch contractor details', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const vRes = await api.get('/vendors');
      setVendors(vRes.data);
      const cRes = await api.get('/vendors/contractors');
      setContractors(cRes.data);
      const pRes = await api.get('/projects');
      setProjects(pRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVendorCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        company_name, pan, aadhaar, gst, owner_name, owner_contact,
        address_line1, address_line2, address_line3,
        machine_details, operator_details, bank_name, account_no, ifsc, branch
      };

      if (isEditing) {
        await api.put(`/vendors/${editId}`, payload);
        alert('Vendor details updated successfully!');
      } else {
        await api.post('/vendors', payload);
        alert('Vendor registered successfully!');
      }
      
      resetForm();
      fetchData();
      if (selectedVendor && selectedVendor.id === editId) {
        setSelectedVendor(null);
      }
    } catch (err) {
      alert('Failed to save vendor');
    }
  };

  const handleContractorCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        full_name: contractor_name,
        pan: contractor_pan,
        aadhaar: contractor_aadhaar,
        contact: contractor_contact,
        address_line1: contractor_address_line1,
        address_line2: contractor_address_line2,
        address_line3: contractor_address_line3,
        bank_name: contractor_bank,
        branch: contractor_branch,
        account_no: contractor_account,
        ifsc: contractor_ifsc,
        vendor_id: selectedVendorId,
        project_id: selectedProjectId
      };

      if (isEditing) {
        await api.put(`/vendors/contractors/${editId}`, payload);
        alert('Contractor details updated successfully!');
      } else {
        await api.post('/vendors/contractors', payload);
        alert('Contractor assigned successfully!');
      }

      resetForm();
      fetchData();
      if (selectedContractor && selectedContractor.id === editId) {
        setSelectedContractor(null);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save contractor');
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setShowForm(false);
    
    // Reset vendor form
    setCompanyName(''); setPan(''); setAadhaar(''); setGst(''); setOwnerName(''); setOwnerContact('');
    setAddressLine1(''); setAddressLine2(''); setAddressLine3('');
    setMachineDetails(''); setOperatorDetails(''); setBankName(''); setBranch(''); setAccountNo(''); setIfsc('');
    
    // Reset contractor form
    setContractorName(''); setContractorPan(''); setContractorAadhaar(''); setContractorContact('');
    setContractorAddressLine1(''); setContractorAddressLine2(''); setContractorAddressLine3('');
    setContractorBank(''); setContractorBranch(''); setContractorAccount(''); setContractorIfsc('');
    setSelectedVendorId(''); setSelectedProjectId('');
  };

  const handleVendorEdit = (e, v) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditId(v.id);
    setCompanyName(v.company_name);
    setGst(v.gst || '');
    setPan(v.pan);
    setAadhaar(v.aadhaar || '');
    setOwnerName(v.owner_name);
    setOwnerContact(v.owner_contact);
    setAddressLine1(v.address_line1 || '');
    setAddressLine2(v.address_line2 || '');
    setAddressLine3(v.address_line3 || '');
    setMachineDetails(v.machine_details || '');
    setOperatorDetails(v.operator_details || '');
    setBankName(v.bank_name || '');
    setBranch(v.branch || '');
    setAccountNo(v.account_no || '');
    setIfsc(v.ifsc || '');
    setShowForm(true);
  };

  const handleContractorEdit = (e, c) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditId(c.id);
    setContractorName(c.full_name);
    setContractorPan(c.pan);
    setContractorAadhaar(c.aadhaar || '');
    setContractorContact(c.contact);
    setContractorAddressLine1(c.address_line1 || '');
    setContractorAddressLine2(c.address_line2 || '');
    setContractorAddressLine3(c.address_line3 || '');
    setContractorBank(c.bank_name || '');
    setContractorBranch(c.branch || '');
    setContractorAccount(c.account_no || '');
    setContractorIfsc(c.ifsc || '');
    
    const activeAssignment = c.assignments?.[0];
    if (activeAssignment) {
      setSelectedVendorId(activeAssignment.vendor_id?.toString() || '');
      setSelectedProjectId(activeAssignment.project_id?.toString() || '');
    } else {
      setSelectedVendorId('');
      setSelectedProjectId('');
    }
    
    setShowForm(true);
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Vendors & Contractors</h1>
        <button className="btn btn-primary" onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}>
          <PlusCircle size={18} /> {showForm ? 'Cancel' : `New ${activeTab === 'vendors' ? 'Vendor' : 'Contractor'}`}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => { setActiveTab('vendors'); setShowForm(false); }}
          className="btn" 
          style={{ background: activeTab === 'vendors' ? 'var(--primary)' : 'rgba(0,0,0,0.05)', color: activeTab === 'vendors' ? 'white' : 'var(--text-main)' }}>
          <Users size={18} /> Vendors
        </button>
        <button 
          onClick={() => { setActiveTab('contractors'); setShowForm(false); }}
          className="btn" 
          style={{ background: activeTab === 'contractors' ? 'var(--primary)' : 'rgba(0,0,0,0.05)', color: activeTab === 'contractors' ? 'white' : 'var(--text-main)' }}>
          <HardHat size={18} /> Contractors
        </button>
      </div>

      {showForm && activeTab === 'vendors' && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>{isEditing ? 'Edit Vendor Details' : 'Register New Vendor'}</h2>
          <form onSubmit={handleVendorCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Company/Business Name</label>
              <input type="text" value={company_name} onChange={e=>setCompanyName(e.target.value)} className="input-field" required />
            </div>
            <div className="form-group">
              <label>GST Number</label>
              <input type="text" value={gst} onChange={e=>setGst(e.target.value)} className="input-field" />
            </div>
            <div className="form-group">
              <label>PAN Card Number</label>
              <input type="text" value={pan} onChange={e=>setPan(e.target.value)} className="input-field" required />
            </div>
            <div className="form-group">
              <label>Aadhaar Number</label>
              <input type="text" value={aadhaar} onChange={e=>setAadhaar(e.target.value)} className="input-field" required />
            </div>
            <div className="form-group">
              <label>Owner Name</label>
              <input type="text" value={owner_name} onChange={e=>setOwnerName(e.target.value)} className="input-field" required />
            </div>
            <div className="form-group">
              <label>Owner Contact</label>
              <input type="text" value={owner_contact} onChange={e=>setOwnerContact(e.target.value)} className="input-field" required />
            </div>
            
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label style={{fontWeight: 600, color: 'var(--primary)', marginBottom: '0.75rem'}}>Owner Address (Three-Line Format)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{fontSize: '0.75rem'}}>Address Line 1</label>
                  <input type="text" value={address_line1} onChange={e=>setAddressLine1(e.target.value)} className="input-field" placeholder="Flat/House No, Building" required />
                </div>
                <div className="form-group">
                  <label style={{fontSize: '0.75rem'}}>Address Line 2</label>
                  <input type="text" value={address_line2} onChange={e=>setAddressLine2(e.target.value)} className="input-field" placeholder="Street, Area/Locality" required />
                </div>
                <div className="form-group">
                  <label style={{fontSize: '0.75rem'}}>Address Line 3</label>
                  <input type="text" value={address_line3} onChange={e=>setAddressLine3(e.target.value)} className="input-field" placeholder="City, State, Pincode" required />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Machine Details (e.g. Excavators)</label>
              <textarea value={machine_details} onChange={e=>setMachineDetails(e.target.value)} className="input-field" rows="2"></textarea>
            </div>
            <div className="form-group">
              <label>Operator Details (Up to 6)</label>
              <textarea value={operator_details} onChange={e=>setOperatorDetails(e.target.value)} className="input-field" rows="2"></textarea>
            </div>
            
            <div className="form-group" style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Bank Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Bank Name</label>
                  <input type="text" value={bank_name} onChange={e=>setBankName(e.target.value)} className="input-field" required />
                </div>
                <div className="form-group">
                  <label>Bank Branch</label>
                  <input type="text" value={branch} onChange={e=>setBranch(e.target.value)} className="input-field" placeholder="e.g. Pune Main" />
                </div>
                <div className="form-group">
                  <label>Account Number</label>
                  <input type="text" value={account_no} onChange={e=>setAccountNo(e.target.value)} className="input-field" required />
                </div>
                <div className="form-group">
                  <label>IFSC Code</label>
                  <input type="text" value={ifsc} onChange={e=>setIfsc(e.target.value)} className="input-field" required />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">{isEditing ? 'Update Vendor' : 'Register Vendor'}</button>
              {isEditing && (
                <button type="button" className="btn" style={{background: 'rgba(0,0,0,0.08)'}} onClick={resetForm}>Cancel</button>
              )}
            </div>
          </form>
        </div>
      )}

      {showForm && activeTab === 'contractors' && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>{isEditing ? 'Edit Contractor Details' : 'Hire Sub-Contractor'}</h2>
          <form onSubmit={handleContractorCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={contractor_name} onChange={e=>setContractorName(e.target.value)} className="input-field" required />
            </div>
            <div className="form-group">
              <label>PAN</label>
              <input type="text" value={contractor_pan} onChange={e=>setContractorPan(e.target.value)} className="input-field" required />
            </div>
            <div className="form-group">
              <label>Aadhaar</label>
              <input type="text" value={contractor_aadhaar} onChange={e=>setContractorAadhaar(e.target.value)} className="input-field" required />
            </div>
            <div className="form-group">
              <label>Contact Number</label>
              <input type="text" value={contractor_contact} onChange={e=>setContractorContact(e.target.value)} className="input-field" required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label style={{fontWeight: 600, color: 'var(--primary)', marginBottom: '0.75rem'}}>Address Details (Three-Line Format)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{fontSize: '0.75rem'}}>Address Line 1</label>
                  <input type="text" value={contractor_address_line1} onChange={e=>setContractorAddressLine1(e.target.value)} className="input-field" placeholder="Flat/House No, Building" required />
                </div>
                <div className="form-group">
                  <label style={{fontSize: '0.75rem'}}>Address Line 2</label>
                  <input type="text" value={contractor_address_line2} onChange={e=>setContractorAddressLine2(e.target.value)} className="input-field" placeholder="Street, Area/Locality" required />
                </div>
                <div className="form-group">
                  <label style={{fontSize: '0.75rem'}}>Address Line 3</label>
                  <input type="text" value={contractor_address_line3} onChange={e=>setContractorAddressLine3(e.target.value)} className="input-field" placeholder="City, State, Pincode" required />
                </div>
              </div>
            </div>
            
            <div className="form-group" style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Bank Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Bank Name</label>
                  <input type="text" value={contractor_bank} onChange={e=>setContractorBank(e.target.value)} className="input-field" required />
                </div>
                <div className="form-group">
                  <label>Bank Branch</label>
                  <input type="text" value={contractor_branch} onChange={e=>setContractorBranch(e.target.value)} className="input-field" placeholder="e.g. Pune Main" />
                </div>
                <div className="form-group">
                  <label>Account Number</label>
                  <input type="text" value={contractor_account} onChange={e=>setContractorAccount(e.target.value)} className="input-field" required />
                </div>
                <div className="form-group">
                  <label>IFSC Code</label>
                  <input type="text" value={contractor_ifsc} onChange={e=>setContractorIfsc(e.target.value)} className="input-field" required />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Assign under Vendor</label>
              <select value={selectedVendorId} onChange={e=>setSelectedVendorId(e.target.value)} className="input-field" required>
                <option value="">-- Select Vendor --</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Assign to Project</label>
              <select value={selectedProjectId} onChange={e=>setSelectedProjectId(e.target.value)} className="input-field" required>
                <option value="">-- Select Project --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name} (Budget Rem: ₹{p.budget_remaining})</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">{isEditing ? 'Update Contractor' : 'Hire Contractor'}</button>
              {isEditing && (
                <button type="button" className="btn" style={{background: 'rgba(0,0,0,0.08)'}} onClick={resetForm}>Cancel</button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {activeTab === 'vendors' ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Company Name</th>
                <th>Owner Details</th>
                <th>Address</th>
                <th>PAN</th>
                <th style={{textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.id} onClick={() => handleVendorClick(v)} style={{ cursor: 'pointer' }} className="hover-row">
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={16} /> {v.vendor_id}
                    </div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{v.company_name}</td>
                  <td>{v.owner_name} <br/><small style={{color:'var(--text-muted)'}}>{v.owner_contact}</small></td>
                  <td>
                    {v.address_line1 ? (
                      <div style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>
                        {v.address_line1}<br/>
                        {v.address_line2}<br/>
                        {v.address_line3}
                      </div>
                    ) : v.owner_address || '—'}
                  </td>
                  <td>{v.pan}</td>
                  <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button onClick={(e) => handleVendorEdit(e, v)} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', gap: '0.25rem', background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)' }}>
                        <Edit3 size={13} /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {vendors.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', padding: '2rem', color: 'var(--text-muted)'}}>No vendors registered yet.</td></tr>}
            </tbody>
          </table>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Contractor ID</th>
                <th>Full Name</th>
                <th>PAN / Contact</th>
                <th>Address</th>
                <th>Assigned Vendor</th>
                <th>Assigned Project</th>
                <th style={{textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map(c => (
                <tr key={c.id} onClick={() => handleContractorClick(c)} style={{ cursor: 'pointer' }} className="hover-row">
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <HardHat size={16} /> {c.contractor_id}
                    </div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{c.full_name}</td>
                  <td>{c.pan} <br/><small style={{color:'var(--text-muted)'}}>{c.contact}</small></td>
                  <td>
                    {c.address_line1 ? (
                      <div style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>
                        {c.address_line1}<br/>
                        {c.address_line2}<br/>
                        {c.address_line3}
                      </div>
                    ) : c.address || '—'}
                  </td>
                  <td>{c.assignments?.[0]?.vendor?.company_name || '—'}</td>
                  <td>{c.assignments?.[0]?.project?.name || '—'}</td>
                  <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button onClick={(e) => handleContractorEdit(e, c)} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', gap: '0.25rem', background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)' }}>
                        <Edit3 size={13} /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {contractors.length === 0 && <tr><td colSpan="7" style={{textAlign:'center', padding: '2rem', color: 'var(--text-muted)'}}>No contractors hired yet.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* VENDOR DETAIL MODAL */}
      {selectedVendor && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '1100px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', padding: '2.5rem', position: 'relative' }}>
            
            <button 
              onClick={() => setSelectedVendor(null)} 
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <XCircle size={24} />
            </button>

            {/* Header Branding */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={26} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{selectedVendor.company_name}</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Vendor ID: {selectedVendor.vendor_id}</span>
              </div>
            </div>

            {/* Quick Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Owner / Representative</span>
                <strong style={{ display: 'block', fontSize: '1.1rem', marginTop: '0.25rem' }}>{selectedVendor.owner_name}</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Contact: {selectedVendor.owner_contact}</span>
              </div>
              <div style={{ background: 'rgba(79, 70, 229, 0.05)', border: '1px solid rgba(79, 70, 229, 0.2)', padding: '1rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em', fontWeight: 600 }}>Associated Projects</span>
                <strong style={{ display: 'block', fontSize: '1.25rem', marginTop: '0.25rem' }}>{selectedVendor.projects?.length || 0} Projects</strong>
              </div>
            </div>

            {/* Detail Grid Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.0rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Info size={16} color="var(--primary)" /> Business Credentials
                </h3>
                <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>GSTIN Reference: </span>
                    <strong>{selectedVendor.gst || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>PAN Number: </span>
                    <strong>{selectedVendor.pan}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Aadhaar Reference: </span>
                    <strong>{selectedVendor.aadhaar || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Address details: </span>
                    <span style={{ display: 'block', fontSize: '0.85rem', marginTop: '0.25rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                      {selectedVendor.address_line1 ? (
                        <>
                          {selectedVendor.address_line1}<br/>
                          {selectedVendor.address_line2}<br/>
                          {selectedVendor.address_line3}
                        </>
                      ) : selectedVendor.owner_address || '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.0rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard size={16} color="var(--primary)" /> Bank Remittance Info
                </h3>
                <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Beneficiary Bank: </span>
                    <strong>{selectedVendor.bank_name || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Bank Branch: </span>
                    <strong>{selectedVendor.branch || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Account Number: </span>
                    <strong>{selectedVendor.account_no || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>IFSC Remittance: </span>
                    <strong>{selectedVendor.ifsc || 'N/A'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Logistics & Equipment details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PenTool size={16} color="var(--primary)" /> Heavy Machinery Specs
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: '1.4', margin: 0 }}>
                  {selectedVendor.machine_details || 'No heavy machinery listed.'}
                </p>
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={16} color="var(--primary)" /> Operator Assets
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: '1.4', margin: 0 }}>
                  {selectedVendor.operator_details || 'No active operators assigned.'}
                </p>
              </div>
            </div>

            {/* Linked Purchase Orders, Work Orders, and Invoices */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Receipt size={18} color="var(--primary)" /> Financial Statements & Timeline
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Purchase Orders */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Approved Purchase Orders</span>
                    <span className="badge badge-info" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                      {selectedVendor.purchase_orders?.filter(po => po.is_active && (po.status === 'Approved' || po.status === 'Completed')).length || 0} Total
                    </span>
                  </h4>
                  {(!selectedVendor.purchase_orders || selectedVendor.purchase_orders.filter(po => po.is_active && (po.status === 'Approved' || po.status === 'Completed')).length === 0) ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, padding: '0.5rem 0' }}>No approved POs issued.</p>
                  ) : (
                    <div style={{ overflowX: 'auto', width: '100%', maxHeight: '250px' }}>
                      <table className="data-table" style={{ margin: 0, fontSize: '0.8rem', width: '100%' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <th>PO Ref</th>
                            <th>Created Date</th>
                            <th>Project ID & Name</th>
                            <th>Material / Item Details</th>
                            <th>Delivery Date</th>
                            <th style={{ textAlign: 'right' }}>Total Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedVendor.purchase_orders
                            .filter(po => po.is_active && (po.status === 'Approved' || po.status === 'Completed'))
                            .map(po => (
                              <tr 
                                key={po.id} 
                                style={{ cursor: 'pointer' }} 
                                onClick={() => handlePreviewItem('PO', po)}
                                className="clickable-row-hover"
                                title="Click to view and print PO"
                              >
                                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{po.po_number}</td>
                                <td>{new Date(po.created_at).toLocaleDateString()}</td>
                                <td>
                                  {po.project ? (
                                    <div>
                                      <strong style={{ color: 'var(--text-main)' }}>{po.project.project_id}</strong>
                                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {po.project.name}
                                      </div>
                                    </div>
                                  ) : 'N/A'}
                                </td>
                                <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={po.item_details}>
                                  {po.item_details || 'N/A'}
                                </td>
                                <td>{po.delivery_date ? new Date(po.delivery_date).toLocaleDateString() : 'N/A'}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{po.total_amount.toLocaleString('en-IN')}.00</td>
                                <td>
                                  <span className={po.status === 'Completed' ? 'badge badge-success' : 'badge badge-warning'} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>{po.status}</span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Work Orders */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Approved Work Orders</span>
                    <span className="badge badge-info" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                      {selectedVendor.work_orders?.filter(wo => wo.is_active && (wo.status === 'Approved' || wo.status === 'Completed')).length || 0} Total
                    </span>
                  </h4>
                  {(!selectedVendor.work_orders || selectedVendor.work_orders.filter(wo => wo.is_active && (wo.status === 'Approved' || wo.status === 'Completed')).length === 0) ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, padding: '0.5rem 0' }}>No approved WOs issued.</p>
                  ) : (
                    <div style={{ overflowX: 'auto', width: '100%', maxHeight: '250px' }}>
                      <table className="data-table" style={{ margin: 0, fontSize: '0.8rem', width: '100%' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <th>WO Ref</th>
                            <th>Created Date</th>
                            <th>Project ID & Name</th>
                            <th>Work Description</th>
                            <th>Completion Date</th>
                            <th style={{ textAlign: 'right' }}>Est. Value</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedVendor.work_orders
                            .filter(wo => wo.is_active && (wo.status === 'Approved' || wo.status === 'Completed'))
                            .map(wo => (
                              <tr 
                                key={wo.id} 
                                style={{ cursor: 'pointer' }} 
                                onClick={() => handlePreviewItem('WO', wo)}
                                className="clickable-row-hover"
                                title="Click to view and print WO"
                              >
                                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{wo.wo_number}</td>
                                <td>{new Date(wo.created_at).toLocaleDateString()}</td>
                                <td>
                                  {wo.project ? (
                                    <div>
                                      <strong style={{ color: 'var(--text-main)' }}>{wo.project.project_id}</strong>
                                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {wo.project.name}
                                      </div>
                                    </div>
                                  ) : 'N/A'}
                                </td>
                                <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={wo.work_description}>
                                  {wo.work_description || 'N/A'}
                                </td>
                                <td>{wo.completion_date ? new Date(wo.completion_date).toLocaleDateString() : 'N/A'}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{wo.budget_amount.toLocaleString('en-IN')}.00</td>
                                <td>
                                  <span className={wo.status === 'Completed' ? 'badge badge-success' : 'badge badge-warning'} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>{wo.status}</span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Invoices */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
                  {(() => {
                    const displayedVendorInvoices = selectedVendor.invoices?.filter(inv => {
                      if (showAllVendorInvoices) return true;
                      return inv.payment_status === 'Pending';
                    }) || [];
                    return (
                      <>
                        <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Billed Invoices</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '0.2rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setShowAllVendorInvoices(false); }} 
                                className="btn" 
                                style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem', background: !showAllVendorInvoices ? 'var(--primary)' : 'transparent', color: !showAllVendorInvoices ? 'white' : 'var(--text-muted)', borderRadius: '4px', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                              >
                                Pending Only
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setShowAllVendorInvoices(true); }} 
                                className="btn" 
                                style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem', background: showAllVendorInvoices ? 'var(--primary)' : 'transparent', color: showAllVendorInvoices ? 'white' : 'var(--text-muted)', borderRadius: '4px', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                              >
                                All Invoices
                              </button>
                            </div>
                            <span className="badge badge-info" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                              {displayedVendorInvoices.length} {showAllVendorInvoices ? 'Total' : 'Pending'}
                            </span>
                          </div>
                        </h4>
                        {displayedVendorInvoices.length === 0 ? (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, padding: '0.5rem 0' }}>
                            {showAllVendorInvoices ? 'No invoices generated yet.' : 'No pending invoices.'}
                          </p>
                        ) : (
                          <div style={{ overflowX: 'auto', width: '100%', maxHeight: '250px' }}>
                            <table className="data-table" style={{ margin: 0, fontSize: '0.8rem', width: '100%' }}>
                              <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                  <th>Invoice Ref</th>
                                  <th>Invoice Date</th>
                                  <th>Project ID & Name</th>
                                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                                  <th style={{ textAlign: 'right' }}>GST</th>
                                  <th style={{ textAlign: 'right' }}>TDS</th>
                                  <th style={{ textAlign: 'right' }}>Net Total</th>
                                  <th>Payment Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {displayedVendorInvoices.map(inv => (
                                  <tr 
                                    key={inv.id} 
                                    style={{ cursor: 'pointer' }} 
                                    onClick={() => handlePreviewItem('Invoice', inv)}
                                    className="clickable-row-hover"
                                    title="Click to view and print Invoice"
                                  >
                                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{inv.invoice_id}</td>
                                    <td>{new Date(inv.invoice_date).toLocaleDateString()}</td>
                                    <td>
                                      {inv.project ? (
                                        <div>
                                          <strong style={{ color: 'var(--text-main)' }}>{inv.project.project_id}</strong>
                                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {inv.project.name}
                                          </div>
                                        </div>
                                      ) : 'N/A'}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>₹{inv.subtotal.toLocaleString('en-IN')}.00</td>
                                    <td style={{ textAlign: 'right', color: '#10b981' }}>
                                      {inv.gst_rate > 0 ? `₹${inv.gst_amount.toLocaleString('en-IN')} (${inv.gst_rate}%)` : '₹0.00'}
                                    </td>
                                    <td style={{ textAlign: 'right', color: '#ef4444' }}>
                                      {inv.tds_rate > 0 ? `₹${inv.tds_amount.toLocaleString('en-IN')} (${inv.tds_rate}%)` : '₹0.00'}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{inv.total_amount.toLocaleString('en-IN')}.00</td>
                                    <td>
                                      <span className={inv.payment_status === 'Paid' ? 'badge badge-success' : 'badge badge-warning'} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>{inv.payment_status}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={(e) => { const temp = selectedVendor; setSelectedVendor(null); handleVendorEdit(e, temp); }} 
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.25rem', gap: '0.25rem' }}
              >
                <Edit3 size={16} /> Edit Vendor Details
              </button>
              <button 
                onClick={() => setSelectedVendor(null)} 
                className="btn"
                style={{ background: 'rgba(0,0,0,0.08)', padding: '0.5rem 1.25rem' }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CONTRACTOR DETAIL MODAL */}
      {selectedContractor && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '1100px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', padding: '2.5rem', position: 'relative' }}>
            
            <button 
              onClick={() => setSelectedContractor(null)} 
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <XCircle size={24} />
            </button>

            {/* Header Branding */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HardHat size={26} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{selectedContractor.full_name}</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Contractor ID: {selectedContractor.contractor_id}</span>
              </div>
            </div>

            {/* Details Grid Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.0rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Info size={16} color="var(--primary)" /> Contractor Credentials
                </h3>
                <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Contact Number: </span>
                    <strong>{selectedContractor.contact}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>PAN Number: </span>
                    <strong>{selectedContractor.pan}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Aadhaar Card: </span>
                    <strong>{selectedContractor.aadhaar || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Hiring Address: </span>
                    <span style={{ display: 'block', fontSize: '0.85rem', marginTop: '0.25rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                      {selectedContractor.address_line1 ? (
                        <>
                          {selectedContractor.address_line1}<br/>
                          {selectedContractor.address_line2}<br/>
                          {selectedContractor.address_line3}
                        </>
                      ) : selectedContractor.address || '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.0rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard size={16} color="var(--primary)" /> Bank Remittance Info
                </h3>
                <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Beneficiary Bank: </span>
                    <strong>{selectedContractor.bank_name || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Bank Branch: </span>
                    <strong>{selectedContractor.branch || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Account Number: </span>
                    <strong>{selectedContractor.account_no || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>IFSC Remittance: </span>
                    <strong>{selectedContractor.ifsc || 'N/A'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignments Context */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Landmark size={16} color="var(--primary)" /> Hiring Agency & Project Assignments
              </h3>
              {!selectedContractor.assignments || selectedContractor.assignments.length === 0 ? (
                <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  This contractor is currently unassigned.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Associated Vendor Agency</span>
                    <strong style={{ display: 'block', fontSize: '1.1rem', marginTop: '0.25rem', color: 'var(--primary)' }}>
                      {selectedContractor.assignments[0]?.vendor?.company_name}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Represented by: {selectedContractor.assignments[0]?.vendor?.owner_name}</span>
                  </div>
                  <div style={{ background: 'rgba(79, 70, 229, 0.05)', border: '1px solid rgba(79, 70, 229, 0.2)', padding: '1rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em', fontWeight: 600 }}>Active Assigned Project</span>
                    <strong style={{ display: 'block', fontSize: '1.1rem', marginTop: '0.25rem' }}>
                      {selectedContractor.assignments[0]?.project?.name}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Project ID: {selectedContractor.assignments[0]?.project?.project_id}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Orders and Billing timeline */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Receipt size={18} color="var(--primary)" /> Billing & Claims Ledger
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Purchase Orders */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Approved Purchase Orders</span>
                    <span className="badge badge-info" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                      {selectedContractor.purchase_orders?.filter(po => po.is_active && (po.status === 'Approved' || po.status === 'Completed')).length || 0} Total
                    </span>
                  </h4>
                  {(!selectedContractor.purchase_orders || selectedContractor.purchase_orders.filter(po => po.is_active && (po.status === 'Approved' || po.status === 'Completed')).length === 0) ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, padding: '0.5rem 0' }}>No approved POs issued.</p>
                  ) : (
                    <div style={{ overflowX: 'auto', width: '100%', maxHeight: '250px' }}>
                      <table className="data-table" style={{ margin: 0, fontSize: '0.8rem', width: '100%' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <th>PO Ref</th>
                            <th>Created Date</th>
                            <th>Project ID & Name</th>
                            <th>Material / Item Details</th>
                            <th>Delivery Date</th>
                            <th style={{ textAlign: 'right' }}>Total Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedContractor.purchase_orders
                            .filter(po => po.is_active && (po.status === 'Approved' || po.status === 'Completed'))
                            .map(po => (
                              <tr 
                                key={po.id} 
                                style={{ cursor: 'pointer' }} 
                                onClick={() => handlePreviewItem('PO', po)}
                                className="clickable-row-hover"
                                title="Click to view and print PO"
                              >
                                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{po.po_number}</td>
                                <td>{new Date(po.created_at).toLocaleDateString()}</td>
                                <td>
                                  {po.project ? (
                                    <div>
                                      <strong style={{ color: 'var(--text-main)' }}>{po.project.project_id}</strong>
                                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {po.project.name}
                                      </div>
                                    </div>
                                  ) : 'N/A'}
                                </td>
                                <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={po.item_details}>
                                  {po.item_details || 'N/A'}
                                </td>
                                <td>{po.delivery_date ? new Date(po.delivery_date).toLocaleDateString() : 'N/A'}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{po.total_amount.toLocaleString('en-IN')}.00</td>
                                <td>
                                  <span className={po.status === 'Completed' ? 'badge badge-success' : 'badge badge-warning'} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>{po.status}</span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Work Orders */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Approved Work Orders</span>
                    <span className="badge badge-info" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                      {selectedContractor.work_orders?.filter(wo => wo.is_active && (wo.status === 'Approved' || wo.status === 'Completed')).length || 0} Total
                    </span>
                  </h4>
                  {(!selectedContractor.work_orders || selectedContractor.work_orders.filter(wo => wo.is_active && (wo.status === 'Approved' || wo.status === 'Completed')).length === 0) ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, padding: '0.5rem 0' }}>No approved WOs issued.</p>
                  ) : (
                    <div style={{ overflowX: 'auto', width: '100%', maxHeight: '250px' }}>
                      <table className="data-table" style={{ margin: 0, fontSize: '0.8rem', width: '100%' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <th>WO Ref</th>
                            <th>Created Date</th>
                            <th>Project ID & Name</th>
                            <th>Work Description</th>
                            <th>Completion Date</th>
                            <th style={{ textAlign: 'right' }}>Est. Value</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedContractor.work_orders
                            .filter(wo => wo.is_active && (wo.status === 'Approved' || wo.status === 'Completed'))
                            .map(wo => (
                              <tr 
                                key={wo.id} 
                                style={{ cursor: 'pointer' }} 
                                onClick={() => handlePreviewItem('WO', wo)}
                                className="clickable-row-hover"
                                title="Click to view and print WO"
                              >
                                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{wo.wo_number}</td>
                                <td>{new Date(wo.created_at).toLocaleDateString()}</td>
                                <td>
                                  {wo.project ? (
                                    <div>
                                      <strong style={{ color: 'var(--text-main)' }}>{wo.project.project_id}</strong>
                                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {wo.project.name}
                                      </div>
                                    </div>
                                  ) : 'N/A'}
                                </td>
                                <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={wo.work_description}>
                                  {wo.work_description || 'N/A'}
                                </td>
                                <td>{wo.completion_date ? new Date(wo.completion_date).toLocaleDateString() : 'N/A'}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{wo.budget_amount.toLocaleString('en-IN')}.00</td>
                                <td>
                                  <span className={wo.status === 'Completed' ? 'badge badge-success' : 'badge badge-warning'} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>{wo.status}</span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Invoices */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
                  {(() => {
                    const displayedContractorInvoices = selectedContractor.invoices?.filter(inv => {
                      if (showAllContractorInvoices) return true;
                      return inv.payment_status === 'Pending';
                    }) || [];
                    return (
                      <>
                        <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Invoices Filed</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '0.2rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setShowAllContractorInvoices(false); }} 
                                className="btn" 
                                style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem', background: !showAllContractorInvoices ? 'var(--primary)' : 'transparent', color: !showAllContractorInvoices ? 'white' : 'var(--text-muted)', borderRadius: '4px', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                              >
                                Pending Only
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setShowAllContractorInvoices(true); }} 
                                className="btn" 
                                style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem', background: showAllContractorInvoices ? 'var(--primary)' : 'transparent', color: showAllContractorInvoices ? 'white' : 'var(--text-muted)', borderRadius: '4px', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                              >
                                All Invoices
                              </button>
                            </div>
                            <span className="badge badge-info" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                              {displayedContractorInvoices.length} {showAllContractorInvoices ? 'Total' : 'Pending'}
                            </span>
                          </div>
                        </h4>
                        {displayedContractorInvoices.length === 0 ? (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, padding: '0.5rem 0' }}>
                            {showAllContractorInvoices ? 'No invoices billed yet.' : 'No pending invoices.'}
                          </p>
                        ) : (
                          <div style={{ overflowX: 'auto', width: '100%', maxHeight: '250px' }}>
                            <table className="data-table" style={{ margin: 0, fontSize: '0.8rem', width: '100%' }}>
                              <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                  <th>Invoice Ref</th>
                                  <th>Invoice Date</th>
                                  <th>Project ID & Name</th>
                                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                                  <th style={{ textAlign: 'right' }}>GST</th>
                                  <th style={{ textAlign: 'right' }}>TDS</th>
                                  <th style={{ textAlign: 'right' }}>Net Total</th>
                                  <th>Payment Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {displayedContractorInvoices.map(inv => (
                                  <tr 
                                    key={inv.id} 
                                    style={{ cursor: 'pointer' }} 
                                    onClick={() => handlePreviewItem('Invoice', inv)}
                                    className="clickable-row-hover"
                                    title="Click to view and print Invoice"
                                  >
                                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{inv.invoice_id}</td>
                                    <td>{new Date(inv.invoice_date).toLocaleDateString()}</td>
                                    <td>
                                      {inv.project ? (
                                        <div>
                                          <strong style={{ color: 'var(--text-main)' }}>{inv.project.project_id}</strong>
                                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {inv.project.name}
                                          </div>
                                        </div>
                                      ) : 'N/A'}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>₹{inv.subtotal.toLocaleString('en-IN')}.00</td>
                                    <td style={{ textAlign: 'right', color: '#10b981' }}>
                                      {inv.gst_rate > 0 ? `₹${inv.gst_amount.toLocaleString('en-IN')} (${inv.gst_rate}%)` : '₹0.00'}
                                    </td>
                                    <td style={{ textAlign: 'right', color: '#ef4444' }}>
                                      {inv.tds_rate > 0 ? `₹${inv.tds_amount.toLocaleString('en-IN')} (${inv.tds_rate}%)` : '₹0.00'}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{inv.total_amount.toLocaleString('en-IN')}.00</td>
                                    <td>
                                      <span className={inv.payment_status === 'Paid' ? 'badge badge-success' : 'badge badge-warning'} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>{inv.payment_status}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={(e) => { const temp = selectedContractor; setSelectedContractor(null); handleContractorEdit(e, temp); }} 
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.25rem', gap: '0.25rem' }}
              >
                <Edit3 size={16} /> Edit Contractor Details
              </button>
              <button 
                onClick={() => setSelectedContractor(null)} 
                className="btn"
                style={{ background: 'rgba(0,0,0,0.08)', padding: '0.5rem 1.25rem' }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
      {/* HIGH-FIDELITY PREVIEW MODAL */}
      {previewType && previewData && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'white' }}>
            
            {/* Modal Actions */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-light)' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => window.print()} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', gap: '0.25rem', display: 'flex', alignItems: 'center' }}>
                  <Printer size={16} /> Print Document
                </button>
                <button onClick={() => { setPreviewType(null); setPreviewData(null); }} className="btn btn-danger" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', gap: '0.25rem', display: 'flex', alignItems: 'center' }}>
                  <XCircle size={16} /> Close Preview
                </button>
              </div>
            </div>

            {/* PREVIEW: PURCHASE ORDER */}
            {previewType === 'PO' && (
              <div id="printable-po-modal-content" style={{ padding: '3.5rem', fontFamily: 'Inter, sans-serif', color: '#1e293b', background: 'white', textAlign: 'left' }}>
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
                      PO Ref: <strong>{previewData.po_number}</strong><br />
                      Version: <strong>A{previewData.version}</strong><br />
                      Date: {new Date(previewData.created_at).toLocaleDateString()}<br />
                      {previewData.creator && <>Issued By: <strong>{previewData.creator.name}</strong><br /></>}
                      {previewData.status === 'Approved' && <>Approved By: <strong>Audit Board</strong></>}
                    </p>
                  </div>
                </div>

                {/* Specifics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Supplier / Vendor Details:</h4>
                    <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
                      <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{previewData.vendor?.company_name || selectedVendor?.company_name}</strong>
                      <p style={{ color: '#475569', marginTop: '0.3rem', margin: 0 }}>
                        Owner: {previewData.vendor?.owner_name || selectedVendor?.owner_name}<br />
                        PAN Card: {previewData.vendor?.pan || selectedVendor?.pan}<br />
                        GSTIN: {previewData.vendor?.gst || selectedVendor?.gst || 'N/A'}<br />
                        Contact: {previewData.vendor?.owner_contact || selectedVendor?.owner_contact}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Project Context:</h4>
                    <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
                      <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>Project: {previewData.project?.project_id}</strong>
                      <p style={{ color: '#475569', marginTop: '0.3rem', margin: 0 }}>
                        Name: {previewData.project?.name}<br />
                        Type: {previewData.project?.type_of_work}<br />
                        Location: {previewData.project?.village_name || previewData.project?.village_id || 'N/A'}, Taluka: {previewData.project?.taluka_name || previewData.project?.taluka_id || 'N/A'}, Dist: {previewData.project?.district_name || previewData.project?.district_id || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Table */}
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
                        <strong>Material Supply operations</strong>
                        <p style={{ color: '#475569', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                          {previewData.item_details}
                        </p>
                      </td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', verticalAlign: 'top' }}>
                        ₹{previewData.total_amount?.toLocaleString()}.00
                      </td>
                    </tr>
                    <tr style={{ borderTop: '2px solid #cbd5e1' }}>
                      <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Total PO Value:</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.15rem', fontWeight: 800, color: '#4F46E5' }}>
                        ₹{previewData.total_amount?.toLocaleString()}.00
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* PREVIEW: WORK ORDER */}
            {previewType === 'WO' && (
              <div id="printable-wo-modal-content" style={{ padding: '3.5rem', fontFamily: 'Inter, sans-serif', color: '#1e293b', background: 'white', textAlign: 'left' }}>
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
                      WO Ref: <strong>{previewData.wo_number}</strong><br />
                      Version: <strong>A{previewData.version}</strong><br />
                      Date: {new Date(previewData.created_at).toLocaleDateString()}<br />
                      {previewData.creator && <>Issued By: <strong>{previewData.creator.name}</strong><br /></>}
                      {previewData.status === 'Approved' && <>Approved By: <strong>Audit Board</strong></>}
                    </p>
                  </div>
                </div>

                {/* Specifics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Contracted Vendor (Agency):</h4>
                    <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
                      <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{previewData.vendor?.company_name || selectedVendor?.company_name}</strong>
                      <p style={{ color: '#475569', marginTop: '0.3rem', margin: 0 }}>
                        Owner: {previewData.vendor?.owner_name || selectedVendor?.owner_name}<br />
                        PAN: {previewData.vendor?.pan || selectedVendor?.pan}<br />
                        GSTIN: {previewData.vendor?.gst || selectedVendor?.gst || 'N/A'}<br />
                        Contact: {previewData.vendor?.owner_contact || selectedVendor?.owner_contact}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Project Context:</h4>
                    <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
                      <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>Project: {previewData.project?.project_id}</strong>
                      <p style={{ color: '#475569', marginTop: '0.3rem', margin: 0 }}>
                        Name: {previewData.project?.name}<br />
                        Type: {previewData.project?.type_of_work}<br />
                        Location: {previewData.project?.village_name || previewData.project?.village_id || 'N/A'}, Taluka: {previewData.project?.taluka_name || previewData.project?.taluka_id || 'N/A'}, Dist: {previewData.project?.district_name || previewData.project?.district_id || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Table */}
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
                        <strong>Operations under Work Order</strong>
                        <p style={{ color: '#475569', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                          {previewData.work_description}
                        </p>
                      </td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', verticalAlign: 'top' }}>
                        {previewData.budget_amount > 0 ? `₹${previewData.budget_amount.toLocaleString()}.00` : 'No direct financial cost'}
                      </td>
                    </tr>
                    {previewData.budget_amount > 0 && (
                      <tr style={{ borderTop: '2px solid #cbd5e1' }}>
                        <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Approved Contract Value:</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.15rem', fontWeight: 800, color: '#4F46E5' }}>
                          ₹{previewData.budget_amount.toLocaleString()}.00
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* PREVIEW: INVOICE */}
            {previewType === 'Invoice' && (
              <div id="printable-invoice-modal-content" style={{ padding: '3rem', fontFamily: 'Inter, sans-serif', color: '#1e293b', textAlign: 'left', background: 'white' }}>
                {/* Header Branding */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                  <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4F46E5', letterSpacing: '-0.025em', textTransform: 'uppercase' }}>NAAM Foundation</h1>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                      Plot No 219, Fergusson College Rd, Shivaji Nagar, Pune, MH, 411016<br />
                      Email: naamvikas@naammh.org | Reg. No: MAH/1196/2015/Pune
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>INVOICE SHEET</h2>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500, marginTop: '0.25rem' }}>
                      Invoice Ref: <strong>{previewData.invoice_id}</strong><br />
                      Date: {new Date(previewData.invoice_date).toLocaleDateString()}<br />
                      {previewData.creator && <>Generated By: <strong>{previewData.creator.name}</strong></>}
                    </p>
                  </div>
                </div>

                {/* Invoice Specifics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Billed From (Contractor / Vendor):</h4>
                    <div style={{ fontSize: '0.875rem' }}>
                      <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{previewData.vendor?.company_name || selectedVendor?.company_name || 'N/A'}</strong>
                      <p style={{ color: '#475569', marginTop: '0.25rem' }}>
                        Owner: {previewData.vendor?.owner_name || selectedVendor?.owner_name || 'N/A'}<br />
                        PAN: {previewData.vendor?.pan || selectedVendor?.pan || 'N/A'}<br />
                        GSTIN: {previewData.vendor?.gst || selectedVendor?.gst || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Project & Sub-Contractor Context:</h4>
                    <div style={{ fontSize: '0.875rem' }}>
                      <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>Project: {previewData.project?.project_id}</strong>
                      <p style={{ color: '#475569', marginTop: '0.25rem' }}>
                        Name: {previewData.project?.name}<br />
                        Type of Work: {previewData.project?.type_of_work}<br />
                        Funding: {previewData.project?.source_type} ({(previewData.invoice_type === 'TypeA' || previewData.invoice_type === 'TypeC') ? 'NAAM Financed' : 'CSR/Govt Receivable'})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items Summary Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2.5rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Description of Work Done / Supply Delivered</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '1.25rem 1rem', fontSize: '0.875rem', verticalAlign: 'top' }}>
                        <strong>{previewData.invoice_type === 'TypeC' ? 'General Purchase / Particulars' : `${previewData.project?.type_of_work} Operations`}</strong>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                          {previewData.invoice_type === 'TypeC'
                            ? `Particulars: ${previewData.particulars || 'N/A'}`
                            : `Operations completed under reference PO ${previewData.purchase_order?.po_number || 'N/A'}.`}
                        </p>
                      </td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: 500, verticalAlign: 'top' }}>
                        ₹{(previewData.subtotal || previewData.total_amount).toLocaleString()}.00
                      </td>
                    </tr>
                    
                    <tr>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.875rem', color: '#64748b' }}>Subtotal (Amount):</td>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 500 }}>₹{(previewData.subtotal || previewData.total_amount).toLocaleString()}.00</td>
                    </tr>
                    {previewData.gst_rate > 0 && (
                      <tr>
                        <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.875rem', color: '#64748b' }}>GST ({previewData.gst_rate}%):</td>
                        <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.875rem', color: '#10b981' }}>+ ₹{previewData.gst_amount?.toLocaleString()}.00</td>
                      </tr>
                    )}
                    {previewData.tds_rate > 0 && (
                      <tr>
                        <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.875rem', color: '#64748b' }}>TDS ({previewData.tds_rate}%):</td>
                        <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.875rem', color: '#ef4444' }}>- ₹{previewData.tds_amount?.toLocaleString()}.00</td>
                      </tr>
                    )}
                    <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                      <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Payment (Net Billed Total):</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.1rem', fontWeight: 800, color: '#4F46E5' }}>₹{previewData.total_amount?.toLocaleString()}.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
