import React, { useState, useEffect } from 'react';
import { PlusCircle, Users, HardHat } from 'lucide-react';
import api from '../api';

export default function Vendors() {
  const [activeTab, setActiveTab] = useState('vendors');
  const [showForm, setShowForm] = useState(false);
  
  const [vendors, setVendors] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // Vendor form
  const [company_name, setCompanyName] = useState('');
  const [pan, setPan] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [gst, setGst] = useState('');
  const [owner_name, setOwnerName] = useState('');
  const [owner_contact, setOwnerContact] = useState('');
  const [machine_details, setMachineDetails] = useState('');
  const [operator_details, setOperatorDetails] = useState('');
  const [bank_name, setBankName] = useState('');
  const [account_no, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');

  // Contractor form
  const [contractor_name, setContractorName] = useState('');
  const [contractor_pan, setContractorPan] = useState('');
  const [contractor_aadhaar, setContractorAadhaar] = useState('');
  const [contractor_contact, setContractorContact] = useState('');
  const [contractor_address, setContractorAddress] = useState('');
  const [contractor_bank, setContractorBank] = useState('');
  const [contractor_account, setContractorAccount] = useState('');
  const [contractor_ifsc, setContractorIfsc] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

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
      await api.post('/vendors', {
        company_name, pan, aadhaar, gst, owner_name, owner_contact,
        machine_details, operator_details, bank_name, account_no, ifsc
      });
      setShowForm(false);
      setCompanyName(''); setPan(''); setAadhaar(''); setGst(''); setOwnerName(''); setOwnerContact('');
      setMachineDetails(''); setOperatorDetails(''); setBankName(''); setAccountNo(''); setIfsc('');
      fetchData();
    } catch (err) {
      alert('Failed to register vendor');
    }
  };

  const handleContractorCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/vendors/contractors', {
        full_name: contractor_name,
        pan: contractor_pan,
        aadhaar: contractor_aadhaar,
        contact: contractor_contact,
        address: contractor_address,
        bank_name: contractor_bank,
        account_no: contractor_account,
        ifsc: contractor_ifsc,
        vendor_id: selectedVendorId,
        project_id: selectedProjectId
      });
      setShowForm(false);
      setContractorName(''); setContractorPan(''); setContractorAadhaar(''); setContractorContact(''); setContractorAddress('');
      setContractorBank(''); setContractorAccount(''); setContractorIfsc('');
      alert('Contractor assigned successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to hire contractor');
    }
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Vendors & Contractors</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
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
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Register New Vendor</h2>
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
                  <label>Account Number</label>
                  <input type="text" value={account_no} onChange={e=>setAccountNo(e.target.value)} className="input-field" required />
                </div>
                <div className="form-group">
                  <label>IFSC Code</label>
                  <input type="text" value={ifsc} onChange={e=>setIfsc(e.target.value)} className="input-field" required />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary">Register Vendor</button>
            </div>
          </form>
        </div>
      )}

      {showForm && activeTab === 'contractors' && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Hire Sub-Contractor</h2>
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
              <label>Address</label>
              <input type="text" value={contractor_address} onChange={e=>setContractorAddress(e.target.value)} className="input-field" required />
            </div>
            
            <div className="form-group" style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Bank Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Bank Name</label>
                  <input type="text" value={contractor_bank} onChange={e=>setContractorBank(e.target.value)} className="input-field" required />
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
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary">Hire Contractor</button>
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
                <th>Owner Name</th>
                <th>PAN</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 500 }}>{v.vendor_id}</td>
                  <td>{v.company_name}</td>
                  <td>{v.owner_name}</td>
                  <td>{v.pan}</td>
                  <td><span className="badge badge-success">Active</span></td>
                </tr>
              ))}
              {vendors.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>No vendors registered yet.</td></tr>}
            </tbody>
          </table>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Contractor ID</th>
                <th>Full Name</th>
                <th>PAN</th>
                <th>Contact</th>
                <th>Assigned Vendor</th>
                <th>Assigned Project</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.contractor_id}</td>
                  <td>{c.full_name}</td>
                  <td>{c.pan}</td>
                  <td>{c.contact}</td>
                  <td>{c.assignments?.[0]?.vendor?.company_name || '—'}</td>
                  <td>{c.assignments?.[0]?.project?.name || '—'}</td>
                </tr>
              ))}
              {contractors.length === 0 && <tr><td colSpan="6" style={{textAlign:'center'}}>No contractors hired yet.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
