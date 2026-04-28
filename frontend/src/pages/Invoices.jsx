import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Receipt } from 'lucide-react';
import api from '../api';

export default function Invoices() {
  const [showForm, setShowForm] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [wccs, setWccs] = useState([]);

  const [invoice_type, setInvoiceType] = useState('TypeA');
  const [project_id, setProjectId] = useState('');
  const [wcc_id, setWccId] = useState('');
  const [vendor_id, setVendorId] = useState('');
  const [contractor_id, setContractorId] = useState('');
  const [total_amount, setTotalAmount] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const iRes = await api.get('/invoices'); setInvoices(iRes.data);
      const pRes = await api.get('/projects'); setProjects(pRes.data);
      const vRes = await api.get('/vendors'); setVendors(vRes.data);
      const cRes = await api.get('/vendors/contractors'); setContractors(cRes.data);
      const wRes = await api.get('/wcc'); setWccs(wRes.data.filter(w => w.status === 'Approved'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/invoices', {
        invoice_type,
        project_id,
        wcc_id: wcc_id || null,
        vendor_id: vendor_id || null,
        contractor_id: contractor_id || null,
        subtotal: total_amount,
        total_amount
      });
      setShowForm(false);
      setTotalAmount(''); setWccId(''); setVendorId(''); setContractorId('');
      fetchData();
      alert('Invoice processed successfully!');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        alert(err.response.data.error);
      } else {
        alert('Failed to process invoice');
      }
    }
  };

  const selectedProject = projects.find(p => p.id.toString() === project_id);

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Invoice Engine</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <PlusCircle size={18} /> {showForm ? 'Cancel' : 'Generate Invoice'}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Generate New Invoice</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Invoice Type</label>
              <select value={invoice_type} onChange={e=>setInvoiceType(e.target.value)} className="input-field">
                <option value="TypeA">Type A (Payable to Contractor)</option>
                <option value="TypeB">Type B/C (Receivable from CSR/Govt)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Project</label>
              <select value={project_id} onChange={e=>setProjectId(e.target.value)} className="input-field" required>
                <option value="">-- Select Project --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.project_id} - {p.name}</option>)}
              </select>
            </div>
            
            {invoice_type === 'TypeA' && (
              <>
                <div className="form-group">
                  <label>Linked WCC (Must be Approved)</label>
                  <select value={wcc_id} onChange={e=>{
                    setWccId(e.target.value);
                    const selectedWcc = wccs.find(w => w.id === parseInt(e.target.value));
                    if (selectedWcc) {
                      setContractorId(selectedWcc.contractor_id);
                      setVendorId(selectedWcc.vendor_id);
                    }
                  }} className="input-field" required>
                    <option value="">-- Select Approved WCC --</option>
                    {wccs.filter(w => w.project_id.toString() === project_id.toString()).map(w => (
                      <option key={w.id} value={w.id}>{w.wcc_id} - {new Date(w.completion_date).toLocaleDateString()}</option>
                    ))}
                  </select>
                  <small style={{ color: 'var(--text-muted)' }}>Only Approved WCCs for the selected project are shown.</small>
                </div>

                <div className="form-group">
                  <label>Contractor</label>
                  <select value={contractor_id} onChange={e=>setContractorId(e.target.value)} className="input-field" required disabled={!!wcc_id}>
                    <option value="">-- Select Contractor --</option>
                    {contractors.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Vendor / Agency</label>
                  <select value={vendor_id} onChange={e=>setVendorId(e.target.value)} className="input-field" required disabled={!!wcc_id}>
                    <option value="">-- Select Vendor --</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name}</option>)}
                  </select>
                </div>
              </>
            )}
            
            <div className="form-group">
              <label>Total Amount (₹)</label>
              <input type="number" value={total_amount} onChange={e=>setTotalAmount(e.target.value)} className="input-field" placeholder="Enter total invoice amount" required />
            </div>
            
            {selectedProject && invoice_type === 'TypeA' && (
              <div className="form-group" style={{ gridColumn: '1 / -1', background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--danger)' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--danger)', fontWeight: 500 }}>
                  System Check: Remaining budget for {selectedProject.project_id} is ₹{selectedProject.budget_remaining.toLocaleString()}. 
                  Invoices exceeding this amount will be strictly blocked.
                </p>
              </div>
            )}

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary">Process Invoice</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search invoices..." 
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', width: '100%', fontFamily: 'Inter' }} 
          />
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Project ID</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id}>
                <td style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Receipt size={16} color="var(--primary)" /> {inv.invoice_id}
                </td>
                <td>{inv.project?.project_id}</td>
                <td>
                  <span className={inv.invoice_type === 'TypeA' ? 'badge badge-warning' : 'badge badge-success'}>
                    {inv.invoice_type === 'TypeA' ? 'Payable' : 'Receivable'}
                  </span>
                </td>
                <td>₹{inv.total_amount.toLocaleString()}</td>
                <td>
                  <span className={inv.payment_status === 'Paid' ? 'badge badge-success' : 'badge badge-warning'}>
                    {inv.payment_status}
                  </span>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>No invoices processed yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
