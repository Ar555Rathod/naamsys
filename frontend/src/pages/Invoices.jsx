import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Receipt, Printer, XCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import api from '../api';

export default function Invoices() {
  const location = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [invoice_type, setInvoiceType] = useState('TypeA');
  const [project_id, setProjectId] = useState('');
  const [purchase_order_id, setPurchaseOrderId] = useState('');
  const [vendor_id, setVendorId] = useState('');
  const [contractor_id, setContractorId] = useState('');
  const [total_amount, setTotalAmount] = useState('');
  const [gst_rate, setGstRate] = useState('0');
  const [tds_rate, setTdsRate] = useState('0');
  const [particulars, setParticulars] = useState('');
  const [userRole, setUserRole] = useState('Operator');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
    const token = localStorage.getItem('naam_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || 'Operator');
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    if (location.state?.selectedId && invoices.length > 0) {
      const found = invoices.find(inv => inv.id === location.state.selectedId);
      if (found) {
        setSelectedInvoice(found);
      }
    }
  }, [location.state, invoices]);

  const fetchData = async () => {
    try {
      const iRes = await api.get('/invoices'); setInvoices(iRes.data);
      const pRes = await api.get('/projects'); setProjects(pRes.data);
      const vRes = await api.get('/vendors'); setVendors(vRes.data);
      const cRes = await api.get('/vendors/contractors'); setContractors(cRes.data);
      const poRes = await api.get('/purchase-orders'); setPurchaseOrders(poRes.data.filter(p => p.status === 'Completed'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/invoices', {
        invoice_type,
        project_id: (invoice_type === 'TypeC' && !project_id) ? null : (project_id ? parseInt(project_id) : null),
        purchase_order_id: (invoice_type === 'TypeA' || invoice_type === 'TypeC') ? (purchase_order_id || null) : null,
        vendor_id: (invoice_type === 'TypeB' || invoice_type === 'TypeC') ? (vendor_id ? parseInt(vendor_id) : null) : null,
        contractor_id: contractor_id ? parseInt(contractor_id) : null,
        subtotal: total_amount,
        gst_rate: parseFloat(gst_rate) || 0,
        tds_rate: parseFloat(tds_rate) || 0,
        particulars: invoice_type === 'TypeC' ? (particulars || '') : null
      });
      setShowForm(false);
      setTotalAmount('');
      setPurchaseOrderId('');
      setVendorId('');
      setContractorId('');
      setGstRate('0');
      setTdsRate('0');
      setParticulars('');
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

  const handleToggleStatus = async (invoiceId, newStatus) => {
    try {
      const confirmToggle = window.confirm(`Are you sure you want to change payment status to ${newStatus}? This will trigger project budget adjustments.`);
      if (!confirmToggle) return;

      await api.put(`/invoices/${invoiceId}/payment-status`, {
        payment_status: newStatus
      });
      alert(`Invoice status successfully updated to ${newStatus}!`);
      fetchData();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        alert(err.response.data.error);
      } else {
        alert('Failed to update payment status');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedProject = projects.find(p => p.id.toString() === project_id);

  // Retrieve contextual details for printable preview modal
  const getInvoiceDetails = (inv) => {
    if (!inv) return null;
    const project = projects.find(p => p.id === inv.project_id) || inv.project;
    const vendor = vendors.find(v => v.id === inv.vendor_id);
    const contractor = contractors.find(c => c.id === inv.contractor_id);
    const purchase_order = purchaseOrders.find(p => p.id === inv.purchase_order_id) || inv.purchase_order;
    
    return {
      ...inv,
      project,
      vendor,
      contractor,
      purchase_order
    };
  };

  const modalDetails = getInvoiceDetails(selectedInvoice);

  // Dynamic calculations for preview in form
  const baseAmount = parseFloat(total_amount) || 0;
  const gRate = parseFloat(gst_rate) || 0;
  const tRate = parseFloat(tds_rate) || 0;
  const gstAmount = baseAmount * (gRate / 100);
  const tdsAmount = baseAmount * (tRate / 100);
  const calculatedNetTotal = baseAmount - tdsAmount + gstAmount;

  // Filter invoices based on search
  const filteredInvoices = invoices.filter(inv => {
    const term = searchQuery.toLowerCase();
    const invIdStr = String(inv.invoice_id).toLowerCase();
    const projIdStr = String(inv.project?.project_id || '').toLowerCase();
    const vendorName = String(inv.purchase_order?.vendor?.company_name || inv.vendor?.company_name || '').toLowerCase();
    return invIdStr.includes(term) || projIdStr.includes(term) || vendorName.includes(term);
  });

  return (
    <div className="main-content">
      <div className="page-header no-print">
        <h1 className="page-title">Invoice Ledger</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <PlusCircle size={18} /> {showForm ? 'Cancel' : 'Generate Invoice'}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel no-print" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Generate New Invoice</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Invoice Type</label>
              <select value={invoice_type} onChange={e=>setInvoiceType(e.target.value)} className="input-field">
                <option value="TypeA">Type A (Payable to Contractor/Vendor via PO)</option>
                <option value="TypeB">Type B (Receivable from CSR/Govt)</option>
                <option value="TypeC">Type C (General Invoice - Stationery, Food, etc.)</option>
              </select>
            </div>
             {invoice_type !== 'TypeC' && (
               <div className="form-group">
                 <label>Project</label>
                 <select value={project_id} onChange={e=>setProjectId(e.target.value)} className="input-field" required>
                   <option value="">-- Select Project --</option>
                   {projects.map(p => <option key={p.id} value={p.id}>{p.project_id} - {p.name}</option>)}
                 </select>
               </div>
             )}
            
            {invoice_type === 'TypeA' && (
              <>
                <div className="form-group">
                  <label>Linked Purchase Order (Must be Completed)</label>
                  <select value={purchase_order_id} onChange={e=>{
                    setPurchaseOrderId(e.target.value);
                    const selectedPo = purchaseOrders.find(p => p.id === parseInt(e.target.value));
                    if (selectedPo) {
                      setContractorId(selectedPo.contractor_id || '');
                      setVendorId(selectedPo.vendor_id);
                      setTotalAmount(selectedPo.total_amount.toString());
                    }
                  }} className="input-field" required>
                    <option value="">-- Select Completed PO --</option>
                    {purchaseOrders.filter(p => p.project_id.toString() === project_id.toString()).map(p => (
                      <option key={p.id} value={p.id}>{p.po_number} (A{p.version}) - ₹{p.total_amount.toLocaleString()}</option>
                    ))}
                  </select>
                  <small style={{ color: 'var(--text-muted)' }}>Only Completed POs with uploaded signed copies are shown.</small>
                </div>

                <div className="form-group">
                  <label>Contractor (Optional)</label>
                  <select value={contractor_id} onChange={e=>setContractorId(e.target.value)} className="input-field" disabled={!!purchase_order_id}>
                    <option value="">-- Select Contractor (Optional) --</option>
                    {contractors.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Vendor / Agency</label>
                  <select value={vendor_id} onChange={e=>setVendorId(e.target.value)} className="input-field" required={!contractor_id} disabled={!!purchase_order_id}>
                    <option value="">-- Select Vendor --</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name}</option>)}
                  </select>
                </div>
              </>
            )}

            {invoice_type === 'TypeB' && (
              <>
                <div className="form-group">
                  <label>Vendor (Optional)</label>
                  <select value={vendor_id} onChange={e=>setVendorId(e.target.value)} className="input-field">
                    <option value="">-- Select Vendor --</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Contractor (Optional)</label>
                  <select value={contractor_id} onChange={e=>setContractorId(e.target.value)} className="input-field">
                    <option value="">-- Select Contractor --</option>
                    {contractors.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                </div>
              </>
            )}

            {invoice_type === 'TypeC' && (
              <>
                <div className="form-group">
                  <label>Vendor / Agency (Optional - Required to link PO if selected)</label>
                  <select value={vendor_id} onChange={e=>{
                    setVendorId(e.target.value);
                    setPurchaseOrderId('');
                  }} className="input-field">
                    <option value="">-- No Vendor --</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name}</option>)}
                  </select>
                </div>
                {vendor_id && (
                  <div className="form-group">
                    <label>Linked Purchase Order (Required for Vendor Invoice)</label>
                    <select value={purchase_order_id} onChange={e=>{
                      setPurchaseOrderId(e.target.value);
                      const selectedPo = purchaseOrders.find(p => p.id === parseInt(e.target.value));
                      if (selectedPo) {
                        setTotalAmount(selectedPo.total_amount.toString());
                      }
                    }} className="input-field" required>
                      <option value="">-- Select Completed PO --</option>
                      {purchaseOrders.filter(p => p.vendor_id.toString() === vendor_id.toString()).map(p => (
                        <option key={p.id} value={p.id}>{p.po_number} (A{p.version}) - ₹{p.total_amount.toLocaleString()}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Particulars ( Stationery details, Food details, etc. )</label>
                  <input type="text" value={particulars} onChange={e=>setParticulars(e.target.value)} className="input-field" placeholder="E.g. Stationary bill, Catering charges for site meet" required />
                </div>
              </>
            )}
            
            <div className="form-group">
              <label>Subtotal / Base Amount (₹)</label>
              <input type="number" value={total_amount} onChange={e=>setTotalAmount(e.target.value)} className="input-field" placeholder="Enter base subtotal amount" required />
            </div>

            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label>GST Rate (%)</label>
                <input type="number" min="0" max="100" value={gst_rate} onChange={e=>setGstRate(e.target.value)} className="input-field" />
              </div>
              <div>
                <label>TDS Rate (%)</label>
                <input type="number" min="0" max="100" value={tds_rate} onChange={e=>setTdsRate(e.target.value)} className="input-field" />
              </div>
            </div>

            {baseAmount > 0 && (
              <div style={{ gridColumn: '1 / -1', background: 'rgba(79, 70, 229, 0.05)', padding: '1.25rem', borderRadius: '8px', borderLeft: '4px solid var(--primary)', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em', marginBottom: '0.75rem', fontWeight: 600 }}>Payment Breakdown (Dynamic Preview)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Subtotal (Base)</span>
                    <span style={{ fontWeight: 600 }}>₹{baseAmount.toLocaleString('en-IN')}.00</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>GST (+{gRate}%)</span>
                    <span style={{ fontWeight: 600, color: '#10b981' }}>+ ₹{gstAmount.toLocaleString('en-IN')}.00</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>TDS (-{tRate}%)</span>
                    <span style={{ fontWeight: 600, color: '#ef4444' }}>- ₹{tdsAmount.toLocaleString('en-IN')}.00</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 700 }}>Net Total Payment</span>
                    <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.05rem' }}>₹{calculatedNetTotal.toLocaleString('en-IN')}.00</span>
                  </div>
                </div>
              </div>
            )}
            
            {selectedProject && (invoice_type === 'TypeA' || invoice_type === 'TypeC') && (
              <div className="form-group" style={{ gridColumn: '1 / -1', background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--danger)' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--danger)', fontWeight: 500 }}>
                  System Check: Remaining budget for {selectedProject.project_id} is ₹{selectedProject.budget_remaining.toLocaleString()}. 
                  Invoices exceeding this amount will be strictly blocked.
                </p>
              </div>
            )}

            <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Process & Save Invoice</button>
              <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel no-print" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search invoices by ID, Project, or Vendor..." 
            value={searchQuery}
            onChange={e=>setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', width: '100%', fontFamily: 'Inter' }} 
          />
        </div>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Project ID</th>
                <th>Vendor / Beneficiary</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Payment Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(inv => (
                <tr key={inv.id}>
                   <td style={{ fontWeight: 500 }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       <Receipt size={16} color="var(--primary)" /> {inv.invoice_id}
                     </div>
                     {inv.creator && <small style={{color:'var(--text-muted)', fontSize: '0.7rem', display: 'block', marginTop: '0.15rem'}}>By: {inv.creator.name}</small>}
                   </td>
                  <td>{inv.project?.project_id}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inv.petrol_pump?.name || inv.purchase_order?.vendor?.company_name || inv.vendor?.company_name || inv.contractor?.full_name || 'N/A'}
                  </td>
                  <td>
                    <span className={inv.invoice_type === 'TypeA' ? 'badge badge-warning' : inv.invoice_type === 'TypeC' ? (inv.petrol_pump ? 'badge badge-danger' : 'badge badge-info') : 'badge badge-success'} style={{ background: inv.invoice_type === 'TypeC' ? (inv.petrol_pump ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)') : undefined, color: inv.invoice_type === 'TypeC' ? (inv.petrol_pump ? '#ef4444' : '#3b82f6') : undefined }}>
                      {inv.invoice_type === 'TypeA' ? 'Payable (PO)' : inv.invoice_type === 'TypeC' ? (inv.petrol_pump ? 'Diesel' : 'General Expense') : 'Receivable'}
                    </span>
                  </td>
                  <td>₹{inv.total_amount.toLocaleString('en-IN')}</td>
                  <td>
                    {userRole === 'Admin' || userRole === 'Manager' ? (
                      <select 
                        value={inv.payment_status} 
                        onChange={(e) => handleToggleStatus(inv.id, e.target.value)}
                        className="badge-dropdown"
                        style={{
                          background: inv.payment_status === 'Paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: inv.payment_status === 'Paid' ? '#10b981' : '#f59e0b',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '4px',
                          padding: '0.2rem 0.4rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                          outline: 'none',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value="Pending" style={{ background: '#1e293b', color: 'white' }}>Pending</option>
                        <option value="Paid" style={{ background: '#1e293b', color: 'white' }}>Paid</option>
                      </select>
                    ) : (
                      <span className={inv.payment_status === 'Paid' ? 'badge badge-success' : 'badge badge-warning'}>
                        {inv.payment_status}
                      </span>
                    )}
                  </td>
                  <td>
                    <button 
                      onClick={() => setSelectedInvoice(inv)} 
                      className="btn" 
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.25rem', background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)' }}
                    >
                      <Printer size={13} /> View & Print
                    </button>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && <tr><td colSpan="7" style={{textAlign:'center', padding: '2rem', color: 'var(--text-muted)'}}>No invoices found matching criteria.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Elegant High-Fidelity Printable Invoice Modal */}
      {selectedInvoice && modalDetails && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'white' }}>
            
            {/* Modal Actions */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-light)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Invoice Preview Panel</span>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handlePrint} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                  <Printer size={16} /> Print / Save PDF
                </button>
                <button onClick={() => setSelectedInvoice(null)} className="btn btn-danger" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', gap: '0.25rem' }}>
                  <XCircle size={16} /> Close
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div id="printable-invoice-modal-content" style={{ padding: '3rem', fontFamily: 'Inter, sans-serif', color: '#1e293b' }}>
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
                    Invoice Ref: <strong>{modalDetails.invoice_id}</strong><br />
                    Date: {new Date(modalDetails.invoice_date).toLocaleDateString()}<br />
                    {modalDetails.creator && <>Generated By: <strong>{modalDetails.creator.name}</strong></>}
                  </p>
                </div>
              </div>

              {/* Invoice Specifics Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Billed From (Contractor / Vendor / Petrol Pump):</h4>
                  {(modalDetails.invoice_type === 'TypeA' || modalDetails.invoice_type === 'TypeC') ? (
                    <div style={{ fontSize: '0.875rem' }}>
                      <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{modalDetails.petrol_pump?.name || modalDetails.vendor?.company_name || modalDetails.purchase_order?.vendor?.company_name || modalDetails.contractor?.full_name || 'Individual Contractor'}</strong>
                      <p style={{ color: '#475569', marginTop: '0.25rem' }}>
                        Owner/Parent: {modalDetails.petrol_pump?.fuel_company?.name || modalDetails.vendor?.owner_name || modalDetails.purchase_order?.vendor?.owner_name || 'N/A'}<br />
                        PAN Number: {modalDetails.petrol_pump?.pan || modalDetails.vendor?.pan || modalDetails.purchase_order?.vendor?.pan || 'N/A'}<br />
                        GSTIN: {modalDetails.petrol_pump?.gst || modalDetails.vendor?.gst || modalDetails.purchase_order?.vendor?.gst || 'N/A'}<br />
                        Contact: {modalDetails.petrol_pump?.contact || modalDetails.vendor?.contact || modalDetails.purchase_order?.vendor?.contact || 'N/A'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.875rem' }}>
                      <strong style={{ fontSize: '1rem', color: '#0f172a' }}>NAAM Foundation</strong>
                      <p style={{ color: '#475569', marginTop: '0.25rem' }}>
                        GSTIN: AACTN2388N<br />
                        TDS status: Exempt (12A / 80G Registered)
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Billed To / Project Context:</h4>
                  <div style={{ fontSize: '0.875rem' }}>
                    <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>Project: {modalDetails.project ? modalDetails.project.project_id : 'N/A (General Business Expense)'}</strong>
                    {modalDetails.project ? (
                      <p style={{ color: '#475569', marginTop: '0.25rem' }}>
                        Name: {modalDetails.project.name}<br />
                        Type of Work: {modalDetails.project.type_of_work}<br />
                        Funding Source: {modalDetails.project.source_type} ({(modalDetails.invoice_type === 'TypeA' || modalDetails.invoice_type === 'TypeC') ? 'NAAM Financed' : 'CSR/Govt Receivable'})<br />
                        {modalDetails.purchase_order && <>Linked Purchase Order: <strong>{modalDetails.purchase_order.po_number} (A{modalDetails.purchase_order.version})</strong></>}
                      </p>
                    ) : (
                      <p style={{ color: '#475569', marginTop: '0.25rem' }}>
                        Classification: General Office / Operating Cost<br />
                        Funding Source: NAAM Foundation Internal Funds<br />
                      </p>
                    )}
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
                      <strong>{modalDetails.invoice_type === 'TypeC' ? 'General Purchase / Particulars' : `${modalDetails.project?.type_of_work} Operations`}</strong>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                        {modalDetails.invoice_type === 'TypeA' 
                          ? `Supply and delivery operations completed under Purchase Order ${modalDetails.purchase_order?.po_number || 'N/A'}.`
                          : modalDetails.invoice_type === 'TypeC'
                          ? `Particulars: ${modalDetails.particulars || 'N/A'}`
                          : `CSR / Govt matching funding call for budget allocation under reference ${modalDetails.project?.proposal_id || 'N/A'}.`
                        }
                      </p>
                    </td>
                    <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: 500, verticalAlign: 'top' }}>
                      ₹{modalDetails.subtotal?.toLocaleString('en-IN') || modalDetails.total_amount?.toLocaleString('en-IN')}.00
                    </td>
                  </tr>
                  
                  {/* Totals Calculation */}
                  <tr>
                    <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.875rem', color: '#64748b' }}>Subtotal:</td>
                    <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 500 }}>₹{modalDetails.subtotal?.toLocaleString('en-IN') || modalDetails.total_amount?.toLocaleString('en-IN')}.00</td>
                  </tr>
                  {modalDetails.gst_rate > 0 && (
                    <tr>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.875rem', color: '#64748b' }}>GST ({modalDetails.gst_rate}%):</td>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.875rem', color: '#10b981', fontWeight: 500 }}>+ ₹{modalDetails.gst_amount?.toLocaleString('en-IN')}.00</td>
                    </tr>
                  )}
                  {modalDetails.tds_rate > 0 && (
                    <tr>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.875rem', color: '#64748b' }}>TDS ({modalDetails.tds_rate}%):</td>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500 }}>- ₹{modalDetails.tds_amount?.toLocaleString('en-IN')}.00</td>
                    </tr>
                  )}
                  <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Payment (Net Billed Total):</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.15rem', fontWeight: 800, color: '#4F46E5' }}>₹{modalDetails.total_amount.toLocaleString('en-IN')}.00</td>
                  </tr>
                </tbody>
              </table>

              {/* Payment Info */}
              {(modalDetails.invoice_type === 'TypeA' || modalDetails.invoice_type === 'TypeC') && (modalDetails.vendor?.bank_name || modalDetails.purchase_order?.vendor?.bank_name) && (
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '3rem' }}>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Beneficiary Remittance Bank Details:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8rem' }}>
                    <div>
                      Bank Name: <strong>{modalDetails.vendor?.bank_name || modalDetails.purchase_order?.vendor?.bank_name}</strong><br />
                      Branch: <strong>{modalDetails.vendor?.branch || modalDetails.purchase_order?.vendor?.branch || 'Pune main'}</strong>
                    </div>
                    <div>
                      Account Number: <strong>{modalDetails.vendor?.account_no || modalDetails.purchase_order?.vendor?.account_no || '••••••••••••'}</strong><br />
                      IFSC Code: <strong>{modalDetails.vendor?.ifsc || modalDetails.purchase_order?.vendor?.ifsc || 'SBIN0007339'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Authorization Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <div style={{ borderBottom: '1px solid #cbd5e1', height: '40px', marginBottom: '0.5rem' }}></div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Prepared By Operator</p>
                </div>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <div style={{ borderBottom: '1px solid #cbd5e1', height: '40px', marginBottom: '0.5rem' }}></div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Approved Auditor Signatory</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
