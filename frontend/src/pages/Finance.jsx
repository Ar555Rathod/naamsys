import React, { useState, useEffect } from 'react';
import { Landmark, FileSpreadsheet, PlusCircle, CheckCircle2, Send, Printer, XCircle, ChevronRight, AlertTriangle, Building, FileText, Check, ShieldAlert } from 'lucide-react';
import api from '../api';

export default function Finance() {
  const [activeTab, setActiveTab] = useState('unlinked'); // 'unlinked' | 'sheets' | 'statements'
  const [userRole, setUserRole] = useState('Operator');
  
  // Data lists
  const [unlinkedInvoices, setUnlinkedInvoices] = useState([]);
  const [workingSheets, setWorkingSheets] = useState([]);
  const [bankStatements, setBankStatements] = useState([]);

  // Selections
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  
  // Admin Approvals view
  const [selectedSheetForApproval, setSelectedSheetForApproval] = useState(null);
  const [approvedInvoiceIds, setApprovedInvoiceIds] = useState([]);

  // Bank Statement View
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState(null);

  useEffect(() => {
    // Determine user role on mount
    const token = localStorage.getItem('naam_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || 'Operator');
      } catch (e) {
        console.error(e);
      }
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const unlinkedRes = await api.get('/finance/unlinked-invoices');
      setUnlinkedInvoices(unlinkedRes.data);

      const sheetsRes = await api.get('/finance/working-sheets');
      setWorkingSheets(sheetsRes.data);

      const statementsRes = await api.get('/finance/bank-statements');
      setBankStatements(statementsRes.data);
    } catch (err) {
      console.error('Failed to fetch finance module data:', err);
    }
  };

  // Enforce access control
  if (userRole !== 'Admin' && userRole !== 'Manager') {
    return (
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem', maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <ShieldAlert size={64} color="var(--danger)" style={{ opacity: 0.9 }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Access Restricted</h1>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
            The Finance Ledger and Bank Statement system is restricted to Authorized Finance Signatories (Admins and Managers) only.
          </p>
        </div>
      </div>
    );
  }

  // Calculate current selection total for sheet creation
  const selectedInvoicesObjects = unlinkedInvoices.filter(inv => selectedInvoiceIds.includes(inv.id));
  const selectionTotal = selectedInvoicesObjects.reduce((sum, inv) => sum + inv.total_amount, 0);
  const LIMIT = 2500000; // 25 Lakhs limit

  const handleToggleInvoiceSelection = (id) => {
    const targetInvoice = unlinkedInvoices.find(inv => inv.id === id);
    if (!targetInvoice) return;

    if (selectedInvoiceIds.includes(id)) {
      setSelectedInvoiceIds(prev => prev.filter(item => item !== id));
    } else {
      if (selectionTotal + targetInvoice.total_amount > LIMIT) {
        alert('Visual Block: Selecting this invoice would exceed the ₹25 Lakhs (₹25,00,000) cumulative payment limit for a single Working Sheet.');
        return;
      }
      setSelectedInvoiceIds(prev => [...prev, id]);
    }
  };

  const handleCreateDraftSheet = async () => {
    if (selectedInvoiceIds.length === 0) {
      alert('Please select at least one invoice.');
      return;
    }
    try {
      await api.post('/finance/working-sheets', {
        invoice_ids: selectedInvoiceIds
      });
      alert('Working Sheet Draft created successfully!');
      setSelectedInvoiceIds([]);
      fetchData();
      setActiveTab('sheets');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to generate working sheet draft');
    }
  };

  const handlePublishSheet = async (sheetId) => {
    try {
      const confirmPublish = window.confirm('Are you sure you want to publish this Working Sheet? This will make it available to the Admin for approval and payment clearance.');
      if (!confirmPublish) return;

      await api.put(`/finance/working-sheets/${sheetId}/publish`);
      alert('Working Sheet published to Admin successfully!');
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to publish working sheet');
    }
  };

  // Admin Approval logic
  const handleOpenApprovalModal = (sheet) => {
    setSelectedSheetForApproval(sheet);
    setApprovedInvoiceIds(sheet.invoices.map(i => i.id));
  };

  const handleToggleApprovalInvoice = (id) => {
    const targetInvoice = selectedSheetForApproval.invoices.find(i => i.id === id);
    if (!targetInvoice) return;

    const currentlyApprovedObjects = selectedSheetForApproval.invoices.filter(i => approvedInvoiceIds.includes(i.id));
    const currentApprovedTotal = currentlyApprovedObjects.reduce((sum, i) => sum + i.total_amount, 0);

    if (approvedInvoiceIds.includes(id)) {
      if (approvedInvoiceIds.length === 1) {
        alert('A Working Sheet must contain at least 1 invoice.');
        return;
      }
      setApprovedInvoiceIds(prev => prev.filter(item => item !== id));
    } else {
      if (currentApprovedTotal + targetInvoice.total_amount > LIMIT) {
        alert('Visual Block: Selecting this invoice would exceed the ₹25 Lakhs (₹25,00,000) cumulative payment limit.');
        return;
      }
      setApprovedInvoiceIds(prev => [...prev, id]);
    }
  };

  const approvedInvoicesObjects = selectedSheetForApproval ? selectedSheetForApproval.invoices.filter(i => approvedInvoiceIds.includes(i.id)) : [];
  const approvedTotal = approvedInvoicesObjects.reduce((sum, i) => sum + i.total_amount, 0);

  const handleApproveSheet = async () => {
    try {
      const confirmApprove = window.confirm(`Are you sure you want to approve this Working Sheet? This will:\n1. Transition all approved invoices to PAID.\n2. Deduct respective amounts from project budgets.\n3. Automatically generate a Bank Statement for remittance.`);
      if (!confirmApprove) return;

      await api.put(`/finance/working-sheets/${selectedSheetForApproval.id}/approve`, {
        approved_invoice_ids: approvedInvoiceIds
      });
      
      alert('Working Sheet approved and Bank Statement generated successfully!');
      setSelectedSheetForApproval(null);
      fetchData();
      setActiveTab('statements');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to approve working sheet');
    }
  };

  const getRemittanceBeneficiaryName = (inv) => {
    return inv.purchase_order?.vendor?.company_name || inv.vendor?.company_name || inv.contractor?.full_name || 'N/A';
  };

  const getRemittanceBankDetails = (inv) => {
    const vendorObj = inv.purchase_order?.vendor || inv.vendor;
    if (vendorObj && vendorObj.bank_name) {
      return {
        bankName: vendorObj.bank_name,
        branch: vendorObj.branch || 'Pune Main',
        accountNo: vendorObj.account_no || 'N/A',
        ifsc: vendorObj.ifsc || 'N/A',
        pan: vendorObj.pan || 'N/A'
      };
    }
    return null;
  };

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="main-content">
      {/* Page Header */}
      <div className="page-header no-print">
        <h1 className="page-title">Finance Engine</h1>
        <div style={{ display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <button 
            className={`btn ${activeTab === 'unlinked' ? 'btn-primary' : ''}`} 
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', background: activeTab !== 'unlinked' ? 'transparent' : undefined }}
            onClick={() => setActiveTab('unlinked')}
          >
            <PlusCircle size={15} /> Link Invoices
          </button>
          <button 
            className={`btn ${activeTab === 'sheets' ? 'btn-primary' : ''}`} 
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', background: activeTab !== 'sheets' ? 'transparent' : undefined }}
            onClick={() => setActiveTab('sheets')}
          >
            <FileSpreadsheet size={15} /> Working Sheets
          </button>
          <button 
            className={`btn ${activeTab === 'statements' ? 'btn-primary' : ''}`} 
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', background: activeTab !== 'statements' ? 'transparent' : undefined }}
            onClick={() => setActiveTab('statements')}
          >
            <Landmark size={15} /> Bank Statements
          </button>
        </div>
      </div>

      {/* TAB 1: Link Invoices & Generate Working Sheet */}
      {activeTab === 'unlinked' && (
        <div className="no-print">
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--primary)' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.25rem' }}>Compile Finance Working Sheet</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Select pending unlinked invoices to bundle into a Working Sheet. Total cannot exceed the ₹25 Lakhs limit.
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Selected Cumulative Total</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: selectionTotal > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                  ₹{selectionTotal.toLocaleString('en-IN')}.00
                </span>
                <span style={{ display: 'block', fontSize: '0.7rem', color: selectionTotal > 2000000 ? 'var(--danger)' : 'var(--text-muted)' }}>
                  Limit: ₹25,00,000.00
                </span>
              </div>
              <button 
                onClick={handleCreateDraftSheet} 
                className="btn btn-primary"
                disabled={selectedInvoiceIds.length === 0}
                style={{ padding: '0.75rem 1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
              >
                <FileSpreadsheet size={18} /> Generate Draft Sheet ({selectedInvoiceIds.length})
              </button>
            </div>
          </div>

          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>Select</th>
                  <th>Invoice ID</th>
                  <th>Vendor / Contractor</th>
                  <th>Project ID</th>
                  <th>Location</th>
                  <th>Type of Work</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                  <th style={{ textAlign: 'right' }}>GST</th>
                  <th style={{ textAlign: 'right' }}>TDS</th>
                  <th style={{ textAlign: 'right' }}>Payment Total</th>
                </tr>
              </thead>
              <tbody>
                {unlinkedInvoices.map(inv => {
                  const isChecked = selectedInvoiceIds.includes(inv.id);
                  const p = inv.project;
                  const locationStr = p 
                    ? [p.village_name, p.taluka_name, p.district_name].filter(Boolean).join(', ') 
                    : 'N/A';
                  
                  return (
                    <tr 
                      key={inv.id} 
                      onClick={() => handleToggleInvoiceSelection(inv.id)}
                      style={{ cursor: 'pointer', background: isChecked ? 'rgba(79, 70, 229, 0.05)' : undefined }}
                    >
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => handleToggleInvoiceSelection(inv.id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td style={{ fontWeight: 600 }}>{inv.invoice_id}</td>
                      <td>{getRemittanceBeneficiaryName(inv)}</td>
                      <td>{p?.project_id || 'N/A'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {locationStr || 'N/A'}
                      </td>
                      <td>{p?.type_of_work || 'N/A'}</td>
                      <td style={{ textAlign: 'right' }}>₹{inv.subtotal.toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right', color: '#10b981', fontSize: '0.85rem' }}>
                        {inv.gst_rate > 0 ? `+₹${inv.gst_amount.toLocaleString('en-IN')} (${inv.gst_rate}%)` : '₹0'}
                      </td>
                      <td style={{ textAlign: 'right', color: '#ef4444', fontSize: '0.85rem' }}>
                        {inv.tds_rate > 0 ? `-₹${inv.tds_amount.toLocaleString('en-IN')} (${inv.tds_rate}%)` : '₹0'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                        ₹{inv.total_amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
                {unlinkedInvoices.length === 0 && (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No pending unlinked invoices available to process. All invoices are currently paid or linked.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* TAB 2: Working Sheets Ledger */}
      {activeTab === 'sheets' && (
        <div className="no-print">
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="data-table">
              <thead>
                <tr>
                  <th>Sheet Number</th>
                  <th>Status</th>
                  <th>Invoices Linked</th>
                  <th>Total Payment</th>
                  <th>Prepared Date</th>
                  <th>Approval Details</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workingSheets.map(sheet => {
                  const dateStr = new Date(sheet.created_at).toLocaleDateString();
                  const appDateStr = sheet.approved_at ? new Date(sheet.approved_at).toLocaleDateString() : null;

                  return (
                    <tr key={sheet.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FileSpreadsheet size={16} color="var(--primary)" /> {sheet.sheet_number}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          sheet.status === 'Approved' ? 'badge-success' : 
                          sheet.status === 'Published' ? 'badge-info' : 'badge-warning'
                        }`}>
                          {sheet.status}
                        </span>
                      </td>
                      <td>{sheet.invoices?.length || 0} Invoices</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{sheet.total_payment.toLocaleString('en-IN')}</td>
                      <td>{dateStr}</td>
                      <td>
                        {sheet.status === 'Approved' ? (
                          <div style={{ fontSize: '0.8rem' }}>
                            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 500 }}>
                              <CheckCircle2 size={12} /> Approved
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>On {appDateStr}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Awaiting clearance</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => setSelectedSheet(sheet)}
                            className="btn"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center', background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)' }}
                          >
                            <Printer size={13} /> View & Print
                          </button>
                          {sheet.status === 'Draft' && (
                            <button 
                              onClick={() => handlePublishSheet(sheet.id)}
                              className="btn btn-primary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                            >
                              <Send size={12} /> Publish to Admin
                            </button>
                          )}
                          {sheet.status === 'Published' && userRole === 'Admin' && (
                            <button 
                              onClick={() => handleOpenApprovalModal(sheet)}
                              className="btn btn-success"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                            >
                              <Check size={14} /> Review & Approve
                            </button>
                          )}
                          {sheet.status === 'Published' && userRole !== 'Admin' && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingRight: '0.5rem' }}>
                              Published (Awaiting Admin)
                            </span>
                          )}
                          {sheet.status === 'Approved' && (
                            <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', paddingRight: '0.5rem' }}>
                              <Check size={14} /> Cleared
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {workingSheets.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No Working Sheets generated yet. Link invoices in the first tab to generate a sheet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* TAB 3: Bank Remittance Statements */}
      {activeTab === 'statements' && (
        <div className="no-print">
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="data-table">
              <thead>
                <tr>
                  <th>Statement Reference</th>
                  <th>Source Working Sheet</th>
                  <th>Beneficiaries Included</th>
                  <th>Total Payment Cleared</th>
                  <th>Cleared By Admin</th>
                  <th>Settlement Date</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {bankStatements.map(stmt => {
                  const dateStr = new Date(stmt.created_at).toLocaleDateString();
                  const totalRemit = stmt.working_sheet?.invoices?.reduce((sum, i) => sum + i.total_amount, 0) || 0;

                  return (
                    <tr key={stmt.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Landmark size={16} color="var(--primary)" /> {stmt.statement_number}
                        </div>
                      </td>
                      <td>{stmt.working_sheet?.sheet_number || 'N/A'}</td>
                      <td>{stmt.working_sheet?.invoices?.length || 0} Vendors</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{totalRemit.toLocaleString('en-IN')}</td>
                      <td>Finance Auditor Signed</td>
                      <td>{dateStr}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => setSelectedStatement(stmt)}
                          className="btn" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.25rem', background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)' }}
                        >
                          <Printer size={13} /> View & Print Statement
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {bankStatements.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No Bank Remittance Statements generated yet. Approving published Working Sheets will automatically generate statements.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* ADMIN REVIEW & APPROVAL MODAL */}
      {selectedSheetForApproval && (
        <div className="modal-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '950px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-light)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Admin Review: Working Sheet {selectedSheetForApproval.sheet_number}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  Select or deselect specific invoices to approve. Enforces the ₹25 Lakhs visual and physical budget cap.
                </p>
              </div>
              <button onClick={() => setSelectedSheetForApproval(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <XCircle size={22} />
              </button>
            </div>

            {/* Invoices List for Toggle */}
            <div style={{ overflow: 'auto', maxHeight: '45vh', border: '1px solid var(--border)', borderRadius: '8px', width: '100%' }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ width: '50px', textAlign: 'center' }}>Approve</th>
                    <th>Invoice ID</th>
                    <th>Vendor / Contractor</th>
                    <th>Project</th>
                    <th>Location</th>
                    <th>Type of Work</th>
                    <th style={{ textAlign: 'right' }}>Net Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSheetForApproval.invoices.map(inv => {
                    const isApproved = approvedInvoiceIds.includes(inv.id);
                    const p = inv.project;
                    const loc = p ? [p.village_name, p.taluka_name, p.district_name].filter(Boolean).join(', ') : 'N/A';

                    return (
                      <tr 
                        key={inv.id}
                        onClick={() => handleToggleApprovalInvoice(inv.id)}
                        style={{ cursor: 'pointer', background: isApproved ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.02)' }}
                      >
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox"
                            checked={isApproved}
                            onChange={() => handleToggleApprovalInvoice(inv.id)}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                        </td>
                        <td style={{ fontWeight: 600 }}>{inv.invoice_id}</td>
                        <td>{getRemittanceBeneficiaryName(inv)}</td>
                        <td>{p?.project_id || 'N/A'}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{loc}</td>
                        <td>{p?.type_of_work || 'N/A'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: isApproved ? 'var(--primary)' : 'var(--text-muted)' }}>
                          ₹{inv.total_amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Approval Limits & Confirm Box */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', padding: '1.25rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <AlertTriangle size={24} color={approvedTotal > LIMIT ? 'var(--danger)' : 'var(--warning)'} />
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cleared Release Net Total</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                    ₹{approvedTotal.toLocaleString('en-IN')}.00
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                    Approved: {approvedInvoiceIds.length} of {selectedSheetForApproval.invoices.length} Invoices (Max Limit: ₹25 Lakhs)
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={handleApproveSheet}
                  className="btn btn-success"
                  disabled={approvedInvoiceIds.length === 0 || approvedTotal > LIMIT}
                  style={{ padding: '0.75rem 2rem', fontWeight: 600 }}
                >
                  Confirm & Clear Release Statement
                </button>
                <button 
                  onClick={() => setSelectedSheetForApproval(null)} 
                  className="btn" 
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HIGH-FIDELITY PRINTABLE BANK REMITTANCE STATEMENT MODAL */}
      {selectedStatement && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'white' }}>
            
            {/* Modal Actions */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <span style={{ fontWeight: 600, color: '#1f2937' }}>Bank Remittance Clearance Sheet</span>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handlePrintStatement} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                  <Printer size={16} /> Print Release Order
                </button>
                <button onClick={() => setSelectedStatement(null)} className="btn btn-danger" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', gap: '0.25rem' }}>
                  <XCircle size={16} /> Close
                </button>
              </div>
            </div>

            {/* Printable Bank Remittance Area */}
            <div id="printable-bank-statement-modal-content" style={{ padding: '3.5rem', fontFamily: 'Inter, sans-serif', color: '#1e293b', background: 'white', textAlign: 'left' }}>
              
              {/* Header Letterhead */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2.5px solid #4F46E5', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#4F46E5', letterSpacing: '-0.025em', textTransform: 'uppercase' }}>NAAM Foundation</h1>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', lineHeight: '1.4' }}>
                    Plot No 219, Fergusson College Rd, Shivaji Nagar, Pune, MH, 411016<br />
                    Email: finance@naammh.org | Registered Trust Reg: MAH/1196/2015/Pune
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.025em' }}>BANK REMITTANCE ORDER</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, marginTop: '0.25rem' }}>
                    Statement Ref: <strong>{selectedStatement.statement_number}</strong><br />
                    Linked Working Sheet: <strong>{selectedStatement.working_sheet?.sheet_number}</strong><br />
                    Clearance Date: {new Date(selectedStatement.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Remittance Description */}
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '2rem', fontSize: '0.85rem', lineHeight: '1.5' }}>
                <p>
                  <strong>TO: The Bank Manager, State Bank of India (SBI), Pune Main Branch</strong><br />
                  Please authorize and release NEFT/RTGS payments to the following beneficiaries as listed below. 
                  These payments are cleared and approved against matching vendor invoices compiled in Working Sheet <strong>{selectedStatement.working_sheet?.sheet_number}</strong>. 
                  Kindly debit the total clearance amount from the <strong>NAAM Trust Operations Current Account</strong>.
                </p>
              </div>

              {/* Beneficiaries Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2.5rem', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: '#475569', fontWeight: 600 }}>Sr. No.</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Beneficiary Name (Vendor/Contractor)</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: '#475569', fontWeight: 600 }}>PAN Number</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Bank Account Details</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: '#475569', fontWeight: 600 }}>IFSC Code</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Invoice Context</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#475569', fontWeight: 600 }}>Amount Released</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStatement.working_sheet?.invoices?.map((inv, idx) => {
                    const bank = getRemittanceBankDetails(inv);
                    return (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#0f172a' }}>{getRemittanceBeneficiaryName(inv)}</td>
                        <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace' }}>{bank?.pan || 'N/A'}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          {bank ? (
                            <>
                              <strong>{bank.bankName}</strong><br />
                              A/C: <span style={{ fontFamily: 'monospace' }}>{bank.accountNo}</span>
                            </>
                          ) : (
                            <span style={{ color: '#ef4444' }}>No bank details on profile</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace', fontWeight: 500 }}>{bank?.ifsc || 'N/A'}</td>
                        <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                          Ref: {inv.invoice_id}<br />
                          Proj: {inv.project?.project_id}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          ₹{inv.total_amount.toLocaleString('en-IN')}.00
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* Totals */}
                  <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
                    <td colSpan="6" style={{ padding: '1rem 0.5rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                      Grand Cumulative Net Clearance Release Total:
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right', fontSize: '1rem', fontWeight: 900, color: '#4F46E5' }}>
                      ₹{selectedStatement.working_sheet?.invoices?.reduce((sum, i) => sum + i.total_amount, 0).toLocaleString('en-IN')}.00
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5rem' }}>
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ borderBottom: '1.5px dashed #cbd5e1', height: '40px', marginBottom: '0.5rem' }}></div>
                  <p style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Finance Officer Signature</p>
                  <p style={{ fontSize: '0.7rem', color: '#64748b' }}>Prepared By Authorized Signatory</p>
                </div>
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ borderBottom: '1.5px dashed #cbd5e1', height: '40px', marginBottom: '0.5rem' }}></div>
                  <p style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Trustee Signatory / Chairperson</p>
                  <p style={{ fontSize: '0.7rem', color: '#64748b' }}>Chief Executive Clearance Sign</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* HIGH-FIDELITY PRINTABLE WORKING SHEET PREVIEW MODAL */}
      {selectedSheet && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'white' }}>
            
            {/* Modal Actions */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <span style={{ fontWeight: 600, color: '#1f2937' }}>Working Sheet Details Clearance</span>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={window.print} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                  <Printer size={16} /> Print Sheet / Export PDF
                </button>
                <button onClick={() => setSelectedSheet(null)} className="btn btn-danger" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', gap: '0.25rem' }}>
                  <XCircle size={16} /> Close
                </button>
              </div>
            </div>

            {/* Printable Working Sheet Area */}
            <div id="printable-working-sheet-modal-content" style={{ padding: '3.5rem', fontFamily: 'Inter, sans-serif', color: '#1e293b', background: 'white', textAlign: 'left' }}>
              
              {/* Header Letterhead */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2.5px solid #4F46E5', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#4F46E5', letterSpacing: '-0.025em', textTransform: 'uppercase' }}>NAAM Foundation</h1>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', lineHeight: '1.4' }}>
                    Plot No 219, Fergusson College Rd, Shivaji Nagar, Pune, MH, 411016<br />
                    Email: finance@naammh.org | Registered Trust Reg: MAH/1196/2015/Pune
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.025em' }}>FINANCE WORKING SHEET</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, marginTop: '0.25rem' }}>
                    Sheet Ref: <strong>{selectedSheet.sheet_number}</strong><br />
                    Status: <strong style={{ color: selectedSheet.status === 'Approved' ? '#10b981' : selectedSheet.status === 'Published' ? '#3b82f6' : '#f59e0b' }}>{selectedSheet.status.toUpperCase()}</strong><br />
                    Compiled Date: {new Date(selectedSheet.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Compilation Info */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '2rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  Working Sheet consists of <strong>{selectedSheet.invoices?.length || 0} invoices</strong> compiled for release review.
                </div>
                <div>
                  Release Limit Check: <strong style={{ color: '#10b981' }}>Within ₹25L Visual Cap</strong>
                </div>
              </div>

              {/* Invoices List Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2.5rem', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '0.75rem 0.4rem', textAlign: 'center', color: '#475569', fontWeight: 600 }}>Sr. No.</th>
                    <th style={{ padding: '0.75rem 0.4rem', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Invoice ID & Date</th>
                    <th style={{ padding: '0.75rem 0.4rem', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Beneficiary Name & PAN</th>
                    <th style={{ padding: '0.75rem 0.4rem', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Project ID & Location</th>
                    <th style={{ padding: '0.75rem 0.4rem', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Type of Work</th>
                    <th style={{ padding: '0.75rem 0.4rem', textAlign: 'right', color: '#475569', fontWeight: 600 }}>Subtotal</th>
                    <th style={{ padding: '0.75rem 0.4rem', textAlign: 'right', color: '#475569', fontWeight: 600 }}>GST</th>
                    <th style={{ padding: '0.75rem 0.4rem', textAlign: 'right', color: '#475569', fontWeight: 600 }}>TDS</th>
                    <th style={{ padding: '0.75rem 0.4rem', textAlign: 'right', color: '#475569', fontWeight: 600 }}>Net Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSheet.invoices?.map((inv, idx) => {
                    const p = inv.project;
                    const loc = p ? [p.village_name, p.taluka_name, p.district_name].filter(Boolean).join(', ') : 'N/A';
                    const bank = getRemittanceBankDetails(inv);
                    return (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem 0.4rem', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ padding: '0.75rem 0.4rem' }}>
                          <strong>{inv.invoice_id}</strong><br />
                          <span style={{ color: '#64748b' }}>{new Date(inv.invoice_date).toLocaleDateString()}</span>
                        </td>
                        <td style={{ padding: '0.75rem 0.4rem' }}>
                          <strong>{getRemittanceBeneficiaryName(inv)}</strong><br />
                          PAN: <span style={{ fontFamily: 'monospace' }}>{bank?.pan || 'N/A'}</span>
                        </td>
                        <td style={{ padding: '0.75rem 0.4rem' }}>
                          <strong>{p?.project_id || 'N/A'}</strong><br />
                          <span style={{ color: '#64748b', fontSize: '0.65rem' }}>{loc}</span>
                        </td>
                        <td style={{ padding: '0.75rem 0.4rem' }}>{p?.type_of_work || 'N/A'}</td>
                        <td style={{ padding: '0.75rem 0.4rem', textAlign: 'right' }}>₹{inv.subtotal.toLocaleString('en-IN')}.00</td>
                        <td style={{ padding: '0.75rem 0.4rem', textAlign: 'right', color: '#10b981' }}>
                          {inv.gst_rate > 0 ? `+₹${inv.gst_amount.toLocaleString('en-IN')} (${inv.gst_rate}%)` : '₹0.00'}
                        </td>
                        <td style={{ padding: '0.75rem 0.4rem', textAlign: 'right', color: '#ef4444' }}>
                          {inv.tds_rate > 0 ? `-₹${inv.tds_amount.toLocaleString('en-IN')} (${inv.tds_rate}%)` : '₹0.00'}
                        </td>
                        <td style={{ padding: '0.75rem 0.4rem', textAlign: 'right', fontWeight: 700 }}>
                          ₹{inv.total_amount.toLocaleString('en-IN')}.00
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* Grand Totals */}
                  <tr style={{ background: '#f8fafc', borderTop: '2.5px solid #cbd5e1', fontWeight: 700 }}>
                    <td colSpan="5" style={{ padding: '1rem 0.5rem', textAlign: 'right', fontSize: '0.8rem' }}>
                      Grand Release Totals:
                    </td>
                    <td style={{ padding: '1rem 0.4rem', textAlign: 'right' }}>
                      ₹{selectedSheet.invoices?.reduce((sum, i) => sum + i.subtotal, 0).toLocaleString('en-IN')}.00
                    </td>
                    <td style={{ padding: '1rem 0.4rem', textAlign: 'right', color: '#10b981' }}>
                      +₹{selectedSheet.invoices?.reduce((sum, i) => sum + (i.gst_amount || 0), 0).toLocaleString('en-IN')}.00
                    </td>
                    <td style={{ padding: '1rem 0.4rem', textAlign: 'right', color: '#ef4444' }}>
                      -₹{selectedSheet.invoices?.reduce((sum, i) => sum + (i.tds_amount || 0), 0).toLocaleString('en-IN')}.00
                    </td>
                    <td style={{ padding: '1rem 0.4rem', textAlign: 'right', fontSize: '0.85rem', color: '#4F46E5' }}>
                      ₹{selectedSheet.invoices?.reduce((sum, i) => sum + i.total_amount, 0).toLocaleString('en-IN')}.00
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5rem' }}>
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ borderBottom: '1.5px dashed #cbd5e1', height: '40px', marginBottom: '0.5rem' }}></div>
                  <p style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Compiled By Manager</p>
                  <p style={{ fontSize: '0.7rem', color: '#64748b' }}>Operations Preparing Officer</p>
                </div>
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ borderBottom: '1.5px dashed #cbd5e1', height: '40px', marginBottom: '0.5rem' }}></div>
                  <p style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Approved Trust Signatory</p>
                  <p style={{ fontSize: '0.7rem', color: '#64748b' }}>Chief Finance Clearing Officer</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
