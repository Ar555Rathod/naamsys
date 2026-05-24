import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Receipt, Printer, XCircle } from 'lucide-react';
import api from '../api';

export default function Invoices() {
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

  useEffect(() => {
    fetchData();
  }, []);

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
        project_id,
        purchase_order_id: purchase_order_id || null,
        vendor_id: vendor_id || null,
        contractor_id: contractor_id || null,
        subtotal: total_amount,
        total_amount
      });
      setShowForm(false);
      setTotalAmount(''); setPurchaseOrderId(''); setVendorId(''); setContractorId('');
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

  return (
    <div className="main-content">
      {/* Dynamic inline print styles injected only when invoice modal is active */}
      {selectedInvoice && (
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-invoice-modal-content, #printable-invoice-modal-content * {
              visibility: visible !important;
            }
            #printable-invoice-modal-content {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
              color: black !important;
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .no-print {
              display: none !important;
            }
          }
        ` }} />
      )}

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
                      <option key={p.id} value={p.id}>{p.po_number} (V{p.version}) - ₹{p.total_amount.toLocaleString()}</option>
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
                  <select value={vendor_id} onChange={e=>setVendorId(e.target.value)} className="input-field" required disabled={!!purchase_order_id}>
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
              <th>Action</th>
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
            {invoices.length === 0 && <tr><td colSpan="6" style={{textAlign:'center'}}>No invoices processed yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Elegant High-Fidelity Printable Invoice Modal */}
      {selectedInvoice && modalDetails && (
        <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'white' }}>
            
            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-light)' }}>
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
                    Date: {new Date(modalDetails.invoice_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Invoice Specifics Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Billed From (Contractor / Vendor):</h4>
                  {modalDetails.invoice_type === 'TypeA' ? (
                    <div style={{ fontSize: '0.875rem' }}>
                      <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{modalDetails.contractor?.full_name || 'Individual Contractor'}</strong>
                      <p style={{ color: '#475569', marginTop: '0.25rem' }}>
                        Under Vendor Agency: {modalDetails.vendor?.company_name || 'N/A'}<br />
                        PAN Number: {modalDetails.contractor?.pan || 'N/A'}<br />
                        GSTIN: {modalDetails.vendor?.gst || 'N/A'}<br />
                        Contact: {modalDetails.contractor?.contact}
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
                    <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>Project: {modalDetails.project?.project_id}</strong>
                    <p style={{ color: '#475569', marginTop: '0.25rem' }}>
                      Name: {modalDetails.project?.name}<br />
                      Type of Work: {modalDetails.project?.type_of_work}<br />
                      Funding Source: {modalDetails.project?.source_type} ({modalDetails.invoice_type === 'TypeA' ? 'NAAM Financed' : 'CSR/Govt Receivable'})<br />
                      {modalDetails.purchase_order && <>Linked Purchase Order: <strong>{modalDetails.purchase_order.po_number} (V{modalDetails.purchase_order.version})</strong></>}
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
                      <strong>{modalDetails.project?.type_of_work} Operations</strong>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                        {modalDetails.invoice_type === 'TypeA' 
                          ? `Supply and delivery operations completed under Purchase Order ${modalDetails.purchase_order?.po_number || 'N/A'}.`
                          : `CSR / Govt matching funding call for budget allocation under reference ${modalDetails.project?.proposal_id || 'N/A'}.`
                        }
                      </p>
                    </td>
                    <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: 500, verticalAlign: 'top' }}>
                      ₹{modalDetails.subtotal?.toLocaleString() || modalDetails.total_amount?.toLocaleString()}.00
                    </td>
                  </tr>
                  
                  {/* Totals Calculation */}
                  <tr>
                    <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.875rem', color: '#64748b' }}>Subtotal:</td>
                    <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 500 }}>₹{modalDetails.subtotal?.toLocaleString() || modalDetails.total_amount?.toLocaleString()}.00</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.875rem', color: '#64748b' }}>Taxes & Deductions:</td>
                    <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.875rem', color: '#64748b' }}>₹0.00</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Total Amount Billed:</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.1rem', fontWeight: 800, color: '#4F46E5' }}>₹{modalDetails.total_amount.toLocaleString()}.00</td>
                  </tr>
                </tbody>
              </table>

              {/* Payment Info */}
              {modalDetails.invoice_type === 'TypeA' && modalDetails.vendor?.bank_name && (
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '3rem' }}>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Beneficiary Remittance Bank Details:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8rem' }}>
                    <div>
                      Bank Name: <strong>{modalDetails.vendor.bank_name}</strong><br />
                      Branch: <strong>{modalDetails.vendor.branch || 'Pune main'}</strong>
                    </div>
                    <div>
                      Account Number: <strong>{modalDetails.vendor.account_no || '••••••••••••'}</strong><br />
                      IFSC Code: <strong>{modalDetails.vendor.ifsc || 'SBIN0007339'}</strong>
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
