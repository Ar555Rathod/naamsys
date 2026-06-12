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
  const [selectedStatementsToPrint, setSelectedStatementsToPrint] = useState(null);
  const [selectedSheetsToPrint, setSelectedSheetsToPrint] = useState(null);

  // Multi-select for bulk printing
  const [selectedSheetIds, setSelectedSheetIds] = useState([]);
  const [selectedStatementIds, setSelectedStatementIds] = useState([]);

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
      alert(err.response?.data?.details || err.response?.data?.error || 'Failed to generate working sheet draft');
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
      alert(err.response?.data?.details || err.response?.data?.error || 'Failed to publish working sheet');
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
      alert(err.response?.data?.details || err.response?.data?.error || 'Failed to approve working sheet');
    }
  };

  const getRemittanceBeneficiaryName = (inv) => {
    return inv.purchase_order?.vendor?.company_name || inv.vendor?.company_name || inv.contractor?.full_name || 'N/A';
  };

  const getRemittanceBankDetails = (inv) => {
    const vendorObj = inv.purchase_order?.vendor || inv.vendor || inv.contractor;
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

  const handleExportSheetExcel = (sheet) => {
    if (!sheet || !sheet.invoices || sheet.invoices.length === 0) {
      alert('No invoices in this sheet to export.');
      return;
    }

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    html += `<head><meta charset="utf-8" /><style>table { border-collapse: collapse; } th { background-color: #f1f5f9; font-weight: bold; border: 1px solid #cbd5e1; } td { border: 1px solid #cbd5e1; }</style></head>`;
    html += `<body>`;
    html += `<h2>NAAM FOUNDATION - WORKING SHEET: ${sheet.sheet_number}</h2>`;
    html += `<p>Date of creation: ${new Date(sheet.created_at).toLocaleDateString()}</p>`;
    html += `<table>`;
    
    // Headers
    html += `<thead><tr>`;
    html += `<th>Sr No.</th>`;
    html += `<th>Beneficiary Name</th>`;
    html += `<th>Invoice No.</th>`;
    html += `<th>Invoice Date</th>`;
    html += `<th>PAN No.</th>`;
    html += `<th>Village</th>`;
    html += `<th>Taluka</th>`;
    html += `<th>District</th>`;
    html += `<th>Type of Work</th>`;
    html += `<th>Subtotal</th>`;
    html += `<th>Gst</th>`;
    html += `<th>TDS</th>`;
    html += `<th>Net Total</th>`;
    html += `</tr></thead>`;

    // Rows
    html += `<tbody>`;
    sheet.invoices.forEach((inv, idx) => {
      const p = inv.project;
      const bank = getRemittanceBankDetails(inv);
      html += `<tr>`;
      html += `<td>${idx + 1}</td>`;
      html += `<td>${getRemittanceBeneficiaryName(inv)}</td>`;
      html += `<td>${inv.invoice_id}</td>`;
      html += `<td>${new Date(inv.invoice_date).toLocaleDateString()}</td>`;
      html += `<td>${bank?.pan || 'N/A'}</td>`;
      html += `<td>${p?.village_name || p?.village_id || 'N/A'}</td>`;
      html += `<td>${p?.taluka_name || p?.taluka_id || 'N/A'}</td>`;
      html += `<td>${p?.district_name || p?.district_id || 'N/A'}</td>`;
      html += `<td>${p?.type_of_work || 'N/A'}</td>`;
      html += `<td>${inv.subtotal}</td>`;
      html += `<td>${inv.gst_amount}</td>`;
      html += `<td>${inv.tds_amount}</td>`;
      html += `<td>${inv.total_amount}</td>`;
      html += `</tr>`;
    });

    // Grand Totals row
    const subtotalSum = sheet.invoices.reduce((sum, i) => sum + i.subtotal, 0);
    const gstSum = sheet.invoices.reduce((sum, i) => sum + (i.gst_amount || 0), 0);
    const tdsSum = sheet.invoices.reduce((sum, i) => sum + (i.tds_amount || 0), 0);
    const netSum = sheet.invoices.reduce((sum, i) => sum + i.total_amount, 0);

    html += `<tr style="font-weight: bold;">`;
    html += `<td colspan="9" style="text-align: right;">Grand Total:</td>`;
    html += `<td>${subtotalSum}</td>`;
    html += `<td>${gstSum}</td>`;
    html += `<td>${tdsSum}</td>`;
    html += `<td>${netSum}</td>`;
    html += `</tr>`;

    html += `</tbody></table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Working_Sheet_${sheet.sheet_number}_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 150);
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button 
              className="btn btn-primary"
              disabled={selectedSheetIds.length === 0}
              onClick={() => {
                const selected = workingSheets.filter(s => selectedSheetIds.includes(s.id));
                setSelectedSheetsToPrint(selected);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
            >
              <Printer size={16} /> Print Selected Sheets ({selectedSheetIds.length})
            </button>
          </div>
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      onChange={(e) => {
                        if (e.target.checked) setSelectedSheetIds(workingSheets.map(s => s.id));
                        else setSelectedSheetIds([]);
                      }}
                      checked={selectedSheetIds.length > 0 && selectedSheetIds.length === workingSheets.length}
                    />
                  </th>
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
                  const isChecked = selectedSheetIds.includes(sheet.id);

                  return (
                    <tr key={sheet.id} style={{ background: isChecked ? 'rgba(79, 70, 229, 0.05)' : undefined }}>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {
                            setSelectedSheetIds(prev => prev.includes(sheet.id) ? prev.filter(id => id !== sheet.id) : [...prev, sheet.id]);
                          }}
                        />
                      </td>
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
                            onClick={() => setSelectedSheetsToPrint([sheet])}
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button 
              className="btn btn-primary"
              disabled={selectedStatementIds.length === 0}
              onClick={() => {
                const selected = bankStatements.filter(s => selectedStatementIds.includes(s.id));
                setSelectedStatementsToPrint(selected);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
            >
              <Printer size={16} /> Print Selected Statements ({selectedStatementIds.length})
            </button>
          </div>
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      onChange={(e) => {
                        if (e.target.checked) setSelectedStatementIds(bankStatements.map(s => s.id));
                        else setSelectedStatementIds([]);
                      }}
                      checked={selectedStatementIds.length > 0 && selectedStatementIds.length === bankStatements.length}
                    />
                  </th>
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
                  const isChecked = selectedStatementIds.includes(stmt.id);

                  return (
                    <tr key={stmt.id} style={{ background: isChecked ? 'rgba(79, 70, 229, 0.05)' : undefined }}>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {
                            setSelectedStatementIds(prev => prev.includes(stmt.id) ? prev.filter(id => id !== stmt.id) : [...prev, stmt.id]);
                          }}
                        />
                      </td>
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
                          onClick={() => setSelectedStatementsToPrint([stmt])}
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
      {selectedStatementsToPrint && selectedStatementsToPrint.length > 0 && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'white' }}>
            
            {/* Modal Actions */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
              <span style={{ fontWeight: 600, color: '#1f2937' }}>Bank Remittance Clearance Sheet ({selectedStatementsToPrint.length} Selected)</span>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handlePrintStatement} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                  <Printer size={16} /> Print Release Order
                </button>
                <button onClick={() => setSelectedStatementsToPrint(null)} className="btn btn-danger" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', gap: '0.25rem' }}>
                  <XCircle size={16} /> Close
                </button>
              </div>
            </div>

            {/* Printable Bank Remittance Area */}
            <div id="printable-bank-statement-modal-content" style={{ padding: '2rem', fontFamily: 'Inter, sans-serif', color: '#1e293b', background: 'white', textAlign: 'left' }}>
              
              {selectedStatementsToPrint.map((stmt, index) => (
                <div key={stmt.id} style={{ marginBottom: index === selectedStatementsToPrint.length - 1 ? 0 : '3rem', paddingBottom: index === selectedStatementsToPrint.length - 1 ? 0 : '3rem', borderBottom: index === selectedStatementsToPrint.length - 1 ? 'none' : '2px dashed #cbd5e1' }}>
                  {/* Simplified Header */}
                  <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: 0 }}>
                      NAAM FOUNDATION - BANK STATEMENT
                    </h1>
                    <div style={{ textAlign: 'right', fontSize: '0.9rem', color: '#0f172a', fontWeight: 600 }}>
                      Date of creation: {new Date(stmt.created_at).toLocaleDateString()}<br />
                      Ref: {stmt.statement_number}
                    </div>
                  </div>

                  {/* Beneficiaries Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '10px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderTop: '1px solid #0f172a', borderBottom: '1px solid #0f172a' }}>
                        <th style={{ padding: '4px 6px', textAlign: 'center', color: '#0f172a', fontWeight: 700, border: '1px solid #cbd5e1' }}>Sr. No.</th>
                        <th style={{ padding: '4px 6px', textAlign: 'left', color: '#0f172a', fontWeight: 700, border: '1px solid #cbd5e1' }}>Beneficiary Name</th>
                        <th style={{ padding: '4px 6px', textAlign: 'left', color: '#0f172a', fontWeight: 700, border: '1px solid #cbd5e1' }}>Bank Name</th>
                        <th style={{ padding: '4px 6px', textAlign: 'left', color: '#0f172a', fontWeight: 700, border: '1px solid #cbd5e1' }}>Branch</th>
                        <th style={{ padding: '4px 6px', textAlign: 'left', color: '#0f172a', fontWeight: 700, border: '1px solid #cbd5e1' }}>Account No.</th>
                        <th style={{ padding: '4px 6px', textAlign: 'left', color: '#0f172a', fontWeight: 700, border: '1px solid #cbd5e1' }}>IFSC Code</th>
                        <th style={{ padding: '4px 6px', textAlign: 'right', color: '#0f172a', fontWeight: 700, border: '1px solid #cbd5e1' }}>Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stmt.working_sheet?.invoices?.map((inv, idx) => {
                        const bank = getRemittanceBankDetails(inv);
                        return (
                          <tr key={inv.id} style={{ borderBottom: '1px solid #e2e8f0', height: '24px' }}>
                            <td style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>{idx + 1}</td>
                            <td style={{ padding: '4px 6px', fontWeight: 600, color: '#0f172a', border: '1px solid #e2e8f0' }}>{getRemittanceBeneficiaryName(inv)}</td>
                            <td style={{ padding: '4px 6px', border: '1px solid #e2e8f0' }}>{bank?.bankName || 'N/A'}</td>
                            <td style={{ padding: '4px 6px', border: '1px solid #e2e8f0' }}>{bank?.branch || 'N/A'}</td>
                            <td style={{ padding: '4px 6px', fontFamily: 'monospace', border: '1px solid #e2e8f0' }}>{bank?.accountNo || 'N/A'}</td>
                            <td style={{ padding: '4px 6px', fontFamily: 'monospace', border: '1px solid #e2e8f0' }}>{bank?.ifsc || 'N/A'}</td>
                            <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700, color: '#0f172a', border: '1px solid #e2e8f0' }}>
                              ₹{inv.total_amount.toLocaleString('en-IN')}.00
                            </td>
                          </tr>
                        );
                      })}
                      
                      {/* Totals */}
                      <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                        <td colSpan="6" style={{ padding: '4px 6px', textAlign: 'right', border: '1px solid #e2e8f0', fontSize: '10px' }}>
                          Grand Total:
                        </td>
                        <td style={{ padding: '4px 6px', textAlign: 'right', fontSize: '10px', color: '#0f172a', border: '1px solid #e2e8f0' }}>
                          ₹{stmt.working_sheet?.invoices?.reduce((sum, i) => sum + i.total_amount, 0).toLocaleString('en-IN')}.00
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* HIGH-FIDELITY PRINTABLE WORKING SHEET PREVIEW MODAL */}
      {selectedSheetsToPrint && selectedSheetsToPrint.length > 0 && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'white' }}>
            
            {/* Modal Actions */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
              <span style={{ fontWeight: 600, color: '#1f2937' }}>Working Sheet Details Clearance ({selectedSheetsToPrint.length} Selected)</span>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {selectedSheetsToPrint.length === 1 && (
                  <button onClick={() => handleExportSheetExcel(selectedSheetsToPrint[0])} className="btn" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <FileSpreadsheet size={16} /> Export Excel
                  </button>
                )}
                <button onClick={window.print} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                  <Printer size={16} /> Print Sheet / Export PDF
                </button>
                <button onClick={() => setSelectedSheetsToPrint(null)} className="btn btn-danger" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', gap: '0.25rem' }}>
                  <XCircle size={16} /> Close
                </button>
              </div>
            </div>

            {/* Printable Working Sheet Area */}
            <div id="printable-working-sheet-modal-content" style={{ padding: '0.5rem', fontFamily: 'Inter, sans-serif', color: '#1e293b', background: 'white', textAlign: 'left' }}>
              
              {selectedSheetsToPrint.map((sheet, index) => (
                <div key={sheet.id} style={{ marginBottom: index === selectedSheetsToPrint.length - 1 ? 0 : '3rem', paddingBottom: index === selectedSheetsToPrint.length - 1 ? 0 : '3rem', borderBottom: index === selectedSheetsToPrint.length - 1 ? 'none' : '2px dashed #cbd5e1' }}>
                  {/* Simplified Header */}
                  <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '12px', fontWeight: 'normal', color: '#0f172a', margin: 0 }}>
                      Naam Foundation - Working Sheet
                    </h1>
                    <div style={{ textAlign: 'right', fontSize: '0.9rem', color: '#0f172a', fontWeight: 'normal' }}>
                      Date of creation: {new Date(sheet.created_at).toLocaleDateString()}<br />
                      Ref: {sheet.sheet_number}
                    </div>
                  </div>

                  {/* Invoices List Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '9px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderTop: '1px solid #0f172a', borderBottom: '1px solid #0f172a' }}>
                        <th style={{ padding: '2px 4px', textAlign: 'center', color: '#0f172a', fontWeight: 'normal', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Sr No.</th>
                        <th style={{ padding: '2px 4px', textAlign: 'left', color: '#0f172a', fontWeight: 'normal', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Beneficiary Name</th>
                        <th style={{ padding: '2px 4px', textAlign: 'left', color: '#0f172a', fontWeight: 'normal', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Invoice No.</th>
                        <th style={{ padding: '2px 4px', textAlign: 'left', color: '#0f172a', fontWeight: 'normal', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Invoice Date</th>
                        <th style={{ padding: '2px 4px', textAlign: 'left', color: '#0f172a', fontWeight: 'normal', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>PAN No.</th>
                        <th style={{ padding: '2px 4px', textAlign: 'left', color: '#0f172a', fontWeight: 'normal', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Village</th>
                        <th style={{ padding: '2px 4px', textAlign: 'left', color: '#0f172a', fontWeight: 'normal', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Taluka</th>
                        <th style={{ padding: '2px 4px', textAlign: 'left', color: '#0f172a', fontWeight: 'normal', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>District</th>
                        <th style={{ padding: '2px 4px', textAlign: 'right', color: '#0f172a', fontWeight: 'normal', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Subtotal</th>
                        <th style={{ padding: '2px 4px', textAlign: 'right', color: '#0f172a', fontWeight: 'normal', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Gst</th>
                        <th style={{ padding: '2px 4px', textAlign: 'right', color: '#0f172a', fontWeight: 'normal', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>TDS</th>
                        <th style={{ padding: '2px 4px', textAlign: 'right', color: '#0f172a', fontWeight: 'normal', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Net Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.invoices?.map((inv, idx) => {
                        const p = inv.project;
                        const bank = getRemittanceBankDetails(inv);
                        return (
                          <tr key={inv.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '2px 4px', textAlign: 'center', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{idx + 1}</td>
                            <td style={{ padding: '2px 4px', fontWeight: 'normal', color: '#0f172a', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{getRemittanceBeneficiaryName(inv)}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #e2e8f0', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{inv.invoice_id}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{new Date(inv.invoice_date).toLocaleDateString()}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #e2e8f0', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{bank?.pan || 'N/A'}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{p?.village_name || p?.village_id || 'N/A'}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{p?.taluka_name || p?.taluka_id || 'N/A'}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{p?.district_name || p?.district_id || 'N/A'}</td>
                            <td style={{ padding: '2px 4px', textAlign: 'right', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>₹{inv.subtotal.toLocaleString('en-IN')}.00</td>
                            <td style={{ padding: '2px 4px', textAlign: 'right', color: '#10b981', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                              ₹{inv.gst_amount.toLocaleString('en-IN')}.00
                            </td>
                            <td style={{ padding: '2px 4px', textAlign: 'right', color: '#ef4444', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                              ₹{inv.tds_amount.toLocaleString('en-IN')}.00
                            </td>
                            <td style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 'normal', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                              ₹{inv.total_amount.toLocaleString('en-IN')}.00
                            </td>
                          </tr>
                        );
                      })}
                      
                      {/* Grand Totals */}
                      <tr style={{ background: '#f8fafc', fontWeight: 'normal' }}>
                        <td colSpan="8" style={{ padding: '2px 4px', textAlign: 'right', border: '1px solid #e2e8f0', fontSize: '9px', whiteSpace: 'nowrap' }}>
                          Grand Total:
                        </td>
                        <td style={{ padding: '2px 4px', textAlign: 'right', border: '1px solid #e2e8f0', fontSize: '9px', whiteSpace: 'nowrap' }}>
                          ₹{sheet.invoices?.reduce((sum, i) => sum + i.subtotal, 0).toLocaleString('en-IN')}.00
                        </td>
                        <td style={{ padding: '2px 4px', textAlign: 'right', color: '#10b981', border: '1px solid #e2e8f0', fontSize: '9px', whiteSpace: 'nowrap' }}>
                          ₹{sheet.invoices?.reduce((sum, i) => sum + (i.gst_amount || 0), 0).toLocaleString('en-IN')}.00
                        </td>
                        <td style={{ padding: '2px 4px', textAlign: 'right', color: '#ef4444', border: '1px solid #e2e8f0', fontSize: '9px', whiteSpace: 'nowrap' }}>
                          ₹{sheet.invoices?.reduce((sum, i) => sum + (i.tds_amount || 0), 0).toLocaleString('en-IN')}.00
                        </td>
                        <td style={{ padding: '2px 4px', textAlign: 'right', fontSize: '9px', color: '#4F46E5', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                          ₹{sheet.invoices?.reduce((sum, i) => sum + i.total_amount, 0).toLocaleString('en-IN')}.00
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
