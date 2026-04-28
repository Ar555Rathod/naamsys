import React, { useState, useEffect } from 'react';
import { PlusCircle, FileCheck2, CheckCircle, XCircle } from 'lucide-react';
import api from '../api';

export default function WccManagement() {
  const [wccs, setWccs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [contractors, setContractors] = useState([]);

  const [project_id, setProjectId] = useState('');
  const [vendor_id, setVendorId] = useState('');
  const [contractor_id, setContractorId] = useState('');
  const [work_description, setWorkDescription] = useState('');
  const [completion_date, setCompletionDate] = useState('');

  useEffect(() => {
    fetchWccs();
    fetchData();
  }, []);

  const fetchWccs = async () => {
    try {
      const res = await api.get('/wcc');
      setWccs(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchData = async () => {
    try {
      const pRes = await api.get('/projects'); setProjects(pRes.data);
      const vRes = await api.get('/vendors'); setVendors(vRes.data);
      const cRes = await api.get('/vendors/contractors'); setContractors(cRes.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/wcc', {
        project_id, vendor_id, contractor_id, work_description, completion_date
      });
      setShowForm(false);
      setProjectId(''); setVendorId(''); setContractorId(''); setWorkDescription(''); setCompletionDate('');
      fetchWccs();
    } catch (err) {
      alert('Failed to submit WCC');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/wcc/${id}/status`, { status, remarks: status === 'Approved' ? 'Verified by Admin' : 'Rejected' });
      fetchWccs();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Work Completion Certificates (WCC)</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <PlusCircle size={18} /> {showForm ? 'Cancel' : 'Submit WCC'}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Submit WCC</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            <div className="form-group">
              <label>Project</label>
              <select value={project_id} onChange={e=>setProjectId(e.target.value)} className="input-field" required>
                <option value="">-- Select Project --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.project_id})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Vendor</label>
              <select value={vendor_id} onChange={e=>setVendorId(e.target.value)} className="input-field" required>
                <option value="">-- Select Vendor --</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Contractor</label>
              <select value={contractor_id} onChange={e=>setContractorId(e.target.value)} className="input-field" required>
                <option value="">-- Select Contractor --</option>
                {contractors.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Completion Date</label>
              <input type="date" value={completion_date} onChange={e=>setCompletionDate(e.target.value)} className="input-field" required />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Work Description</label>
              <textarea value={work_description} onChange={e=>setWorkDescription(e.target.value)} className="input-field" rows="3" required></textarea>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary">Submit for Approval</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>WCC ID</th>
              <th>Project</th>
              <th>Contractor / Vendor</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {wccs.map(w => (
              <tr key={w.id}>
                <td style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileCheck2 size={16} color="var(--primary)" /> {w.wcc_id}
                </td>
                <td>{w.project.name}</td>
                <td>{w.contractor.full_name} <br/><small style={{color:'var(--text-muted)'}}>{w.vendor.company_name}</small></td>
                <td>{new Date(w.completion_date).toLocaleDateString()}</td>
                <td>
                  <span className={`badge badge-${w.status === 'Approved' ? 'success' : w.status === 'Rejected' ? 'danger' : 'warning'}`}>
                    {w.status}
                  </span>
                </td>
                <td>
                  {w.status === 'Pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => updateStatus(w.id, 'Approved')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--success)' }} title="Approve">
                        <CheckCircle size={20} />
                      </button>
                      <button onClick={() => updateStatus(w.id, 'Rejected')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} title="Reject">
                        <XCircle size={20} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {wccs.length === 0 && <tr><td colSpan="6" style={{textAlign:'center'}}>No WCCs found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
