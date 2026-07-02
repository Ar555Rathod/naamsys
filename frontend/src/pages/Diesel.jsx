import React, { useState, useEffect } from 'react';
import { Fuel, Landmark, ArrowUpRight, ArrowDownLeft, AlertCircle, PlusCircle, CreditCard, CheckCircle2, HelpCircle, FileText, Download, Printer, XCircle } from 'lucide-react';
import api from '../api';

export default function Diesel() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, deposit, draw, setup
  
  // Data States
  const [companies, setCompanies] = useState([]);
  const [pumps, setPumps] = useState([]);
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [orgBudget, setOrgBudget] = useState({ total_budget: 0, budget_remaining: 0 });
  const [invoices, setInvoices] = useState([]);

  // Selected company drilldown for withdrawals
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  // Form States
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyBankName, setNewCompanyBankName] = useState('');
  const [newCompanyBankBranch, setNewCompanyBankBranch] = useState('');
  const [newCompanyAddress, setNewCompanyAddress] = useState('');
  const [newCompanyIfsc, setNewCompanyIfsc] = useState('');
  const [newCompanyAccountNo, setNewCompanyAccountNo] = useState('');
  const [newCompanyPan, setNewCompanyPan] = useState('');

  const [newPumpName, setNewPumpName] = useState('');
  const [newPumpGst, setNewPumpGst] = useState('');
  const [newPumpPan, setNewPumpPan] = useState('');
  const [newPumpContact, setNewPumpContact] = useState('');
  const [newPumpAddress, setNewPumpAddress] = useState('');
  const [newPumpCompanyId, setNewPumpCompanyId] = useState('');

  // Deposit Form States
  const [depositCompanyId, setDepositCompanyId] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositRemarks, setDepositRemarks] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDepositToPrint, setSelectedDepositToPrint] = useState(null);

  // Draw Form States
  const [drawPumpId, setDrawPumpId] = useState('');
  const [drawProjectId, setDrawProjectId] = useState('');
  const [drawVendorId, setDrawVendorId] = useState('');
  const [drawAmount, setDrawAmount] = useState('');

  // Edit Org Budget Modal State
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editTotalBudget, setEditTotalBudget] = useState('');
  const [editRemainingBudget, setEditRemainingBudget] = useState('');

  // Edit Company Modal State
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [editCompanyId, setEditCompanyId] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editCompanyBankName, setEditCompanyBankName] = useState('');
  const [editCompanyBankBranch, setEditCompanyBankBranch] = useState('');
  const [editCompanyAddress, setEditCompanyAddress] = useState('');
  const [editCompanyIfsc, setEditCompanyIfsc] = useState('');
  const [editCompanyAccountNo, setEditCompanyAccountNo] = useState('');
  const [editCompanyPan, setEditCompanyPan] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const bRes = await api.get('/diesel/budget'); setOrgBudget(bRes.data);
      const cRes = await api.get('/diesel/companies'); setCompanies(cRes.data);
      const pRes = await api.get('/diesel/pumps'); setPumps(pRes.data);
      const projRes = await api.get('/projects'); setProjects(projRes.data);
      const venRes = await api.get('/vendors'); setVendors(venRes.data);
      const invRes = await api.get('/invoices'); 
      // filter for diesel invoices
      setInvoices(invRes.data.filter(inv => inv.petrol_pump_id !== null));
    } catch (err) {
      console.error('Failed to fetch diesel data', err);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    try {
      await api.post('/diesel/companies', { 
        name: newCompanyName,
        bank_name: newCompanyBankName,
        branch: newCompanyBankBranch,
        address: newCompanyAddress,
        ifsc: newCompanyIfsc,
        account_no: newCompanyAccountNo,
        pan: newCompanyPan
      });
      setNewCompanyName('');
      setNewCompanyBankName('');
      setNewCompanyBankBranch('');
      setNewCompanyAddress('');
      setNewCompanyIfsc('');
      setNewCompanyAccountNo('');
      setNewCompanyPan('');
      fetchData();
      alert('Fuel Company tieup registered successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to register fuel company');
    }
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    if (!editCompanyName.trim()) return;
    try {
      await api.put(`/diesel/companies/${editCompanyId}`, {
        name: editCompanyName,
        bank_name: editCompanyBankName,
        branch: editCompanyBankBranch,
        address: editCompanyAddress,
        ifsc: editCompanyIfsc,
        account_no: editCompanyAccountNo,
        pan: editCompanyPan
      });
      setShowEditCompanyModal(false);
      fetchData();
      alert('Fuel Company details updated successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update company details');
    }
  };

  const handleCreatePump = async (e) => {
    e.preventDefault();
    if (!newPumpName.trim() || !newPumpCompanyId) {
      alert('Name and Fuel Company are required');
      return;
    }
    try {
      await api.post('/diesel/pumps', {
        name: newPumpName,
        gst: newPumpGst,
        pan: newPumpPan,
        contact: newPumpContact,
        address: newPumpAddress,
        fuel_company_id: parseInt(newPumpCompanyId)
      });
      setNewPumpName(''); setNewPumpGst(''); setNewPumpPan('');
      setNewPumpContact(''); setNewPumpAddress(''); setNewPumpCompanyId('');
      fetchData();
      alert('Petrol Pump registered successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to register petrol pump');
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositCompanyId || !depositAmount) {
      alert('Please select a company and enter an amount');
      return;
    }
    try {
      const res = await api.post('/diesel/deposit', {
        fuel_company_id: parseInt(depositCompanyId),
        amount: parseFloat(depositAmount),
        remarks: depositRemarks,
        deposit_date: depositDate
      });
      // Set the deposit details for printing bank sheet directly
      const fuelCompanyObj = companies.find(c => c.id === parseInt(depositCompanyId));
      setSelectedDepositToPrint({
        ...res.data,
        fuel_company: fuelCompanyObj
      });

      setDepositCompanyId('');
      setDepositAmount('');
      setDepositRemarks('');
      setDepositDate(new Date().toISOString().split('T')[0]);
      fetchData();
      alert('Funds deposited and Bank Sheet generated successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to deposit funds');
    }
  };

  const handleDraw = async (e) => {
    e.preventDefault();
    if (!drawPumpId || !drawProjectId || !drawAmount) {
      alert('All fields are required');
      return;
    }
    try {
      await api.post('/diesel/draw', {
        petrol_pump_id: parseInt(drawPumpId),
        project_id: parseInt(drawProjectId),
        vendor_id: drawVendorId ? parseInt(drawVendorId) : null,
        amount: parseFloat(drawAmount)
      });
      setDrawPumpId('');
      setDrawProjectId('');
      setDrawVendorId('');
      setDrawAmount('');
      fetchData();
      alert('Diesel drawn successfully! Invoices generated and balances updated.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to complete transaction');
    }
  };

  const handleExportWithdrawalsExcel = (company) => {
    const companyWithdrawals = invoices.filter(inv => {
      const pumpObj = pumps.find(p => p.id === inv.petrol_pump_id);
      return pumpObj && pumpObj.fuel_company_id === company.id;
    });

    if (companyWithdrawals.length === 0) {
      alert('No withdrawals to export.');
      return;
    }

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    html += `<head><meta charset="utf-8" /><style>table { border-collapse: collapse; } th { background-color: #f1f5f9; font-weight: bold; border: 1px solid #cbd5e1; } td { border: 1px solid #cbd5e1; }</style></head>`;
    html += `<body>`;
    html += `<h2>DIESEL WITHDRAWALS REPORT: ${company.name}</h2>`;
    html += `<p>Generated Date: ${new Date().toLocaleDateString()}</p>`;
    html += `<table>`;
    html += `<thead><tr><th>Sr No.</th><th>Transaction ID</th><th>Petrol Pump</th><th>Project</th><th>Vendor</th><th>Date</th><th>Amount (₹)</th></tr></thead>`;
    html += `<tbody>`;

    companyWithdrawals.forEach((inv, index) => {
      const pumpName = pumps.find(p => p.id === inv.petrol_pump_id)?.name || 'N/A';
      const vendorName = vendors.find(v => v.id === inv.vendor_id)?.company_name || 'N/A';
      html += `<tr>`;
      html += `<td>${index + 1}</td>`;
      html += `<td>${inv.invoice_id}</td>`;
      html += `<td>${pumpName}</td>`;
      html += `<td>${inv.project?.project_id || 'N/A'}</td>`;
      html += `<td>${vendorName}</td>`;
      html += `<td>${new Date(inv.invoice_date).toLocaleDateString()}</td>`;
      html += `<td>${inv.total_amount}</td>`;
      html += `</tr>`;
    });

    const totalDrawAmt = companyWithdrawals.reduce((sum, inv) => sum + inv.total_amount, 0);
    html += `<tr style="font-weight: bold;"><td colspan="6" style="text-align: right;">Total Withdrawals:</td><td>₹${totalDrawAmt}</td></tr>`;
    html += `</tbody></table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Diesel_Withdrawals_${company.name}_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportWithdrawalsPDF = (company) => {
    window.print();
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const selectedCompanyWithdrawals = selectedCompany
    ? invoices.filter(inv => {
        const pumpObj = pumps.find(p => p.id === inv.petrol_pump_id);
        return pumpObj && pumpObj.fuel_company_id === selectedCompany.id;
      })
    : [];

  // Calculations
  const totalPrepaidReserves = companies.reduce((sum, c) => sum + c.balance, 0);

  return (
    <div className="main-content">
      {/* Beginner-friendly Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Diesel & Fuel Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Manage fuel tieups, deposit prepaid funds, and track OTP-verified diesel withdrawals for projects.
          </p>
        </div>
      </div>

      {/* Top Cards for Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>ORGANIZATION BUDGET</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>₹{orgBudget.budget_remaining.toLocaleString()}</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Out of Total: ₹{orgBudget.total_budget.toLocaleString()}</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL PREPAID RESERVES</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>₹{totalPrepaidReserves.toLocaleString()}</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 500 }}>Active tieups across {companies.length} companies</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>DIESEL INVOICES BILLED</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{invoices.length} Transactions</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deducted from prepaid company balances</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="no-print" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('overview')} 
          style={{ background: 'transparent', border: 'none', color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'overview' ? '2px solid var(--primary)' : 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}
        >
          Overview & Balances
        </button>
        <button 
          onClick={() => setActiveTab('deposit')} 
          style={{ background: 'transparent', border: 'none', color: activeTab === 'deposit' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'deposit' ? '2px solid var(--primary)' : 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}
        >
          Option 1: Deposit Prepaid Funds
        </button>
        <button 
          onClick={() => setActiveTab('draw')} 
          style={{ background: 'transparent', border: 'none', color: activeTab === 'draw' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'draw' ? '2px solid var(--primary)' : 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}
        >
          Option 2: Record Diesel Draw (OTP Verify)
        </button>
        <button 
          onClick={() => setActiveTab('setup')} 
          style={{ background: 'transparent', border: 'none', color: activeTab === 'setup' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'setup' ? '2px solid var(--primary)' : 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}
        >
          Register Fuel Tieups & Pumps
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Fuel Companies Table */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)' }}>Prepaid Balance by Fuel Company</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fuel Company Name</th>
                  <th>Prepaid Balance</th>
                  <th>Cumulative Deposits</th>
                  <th>Associated Petrol Pumps</th>
                  <th>Bank Details / PAN</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No fuel companies registered yet. Go to "Register Fuel Tieups" to get started.
                    </td>
                  </tr>
                ) : (
                  companies.map(c => (
                    <tr 
                      key={c.id} 
                      onClick={() => setSelectedCompanyId(c.id)}
                      style={{ cursor: 'pointer', background: selectedCompanyId === c.id ? 'rgba(79, 70, 229, 0.05)' : undefined }}
                    >
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 700 }}>₹{c.balance.toLocaleString()}</td>
                      <td>₹{c.total_deposited.toLocaleString()}</td>
                      <td>{c.petrol_pumps?.length || 0} Pumps</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {c.bank_name ? `${c.bank_name} (${c.account_no})` : 'N/A'} {c.pan ? `| PAN: ${c.pan}` : ''}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCompanyId(c.id);
                            }}
                          >
                            View Withdrawals
                          </button>
                          <button 
                            className="btn" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditCompanyId(c.id);
                              setEditCompanyName(c.name);
                              setEditCompanyBankName(c.bank_name || '');
                              setEditCompanyBankBranch(c.branch || '');
                              setEditCompanyAddress(c.address || '');
                              setEditCompanyIfsc(c.ifsc || '');
                              setEditCompanyAccountNo(c.account_no || '');
                              setEditCompanyPan(c.pan || '');
                              setShowEditCompanyModal(true);
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Drilldown Withdrawals ledger */}
          {selectedCompany && (
            <div className="glass-panel print-full-height print-no-border" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }} className="no-print">
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Withdrawals from {selectedCompany.name}
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleExportWithdrawalsExcel(selectedCompany)} className="btn" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', fontSize: '0.8rem', background: '#10b981', color: 'white' }}>
                    <Download size={14} /> Export Excel
                  </button>
                  <button onClick={() => handleExportWithdrawalsPDF(selectedCompany)} className="btn btn-primary" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', fontSize: '0.8rem' }}>
                    <Printer size={14} /> Print PDF
                  </button>
                </div>
              </div>

              {/* Printable Header */}
              <div className="only-print" style={{ borderBottom: '2px solid #000', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>NAAM FOUNDATION</h2>
                <h3 style={{ fontSize: '14px', color: '#555' }}>Diesel Withdrawal Report: {selectedCompany.name}</h3>
                <span style={{ fontSize: '12px' }}>Generated Date: {new Date().toLocaleDateString()}</span>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Project</th>
                    <th>Petrol Pump</th>
                    <th>Vendor</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCompanyWithdrawals.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No withdrawals recorded for this fuel company.
                      </td>
                    </tr>
                  ) : (
                    selectedCompanyWithdrawals.map(inv => (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 600 }}>{inv.invoice_id}</td>
                        <td>{inv.project?.project_id || '—'}</td>
                        <td>{pumps.find(p => p.id === inv.petrol_pump_id)?.name || 'Petrol Pump'}</td>
                        <td>{vendors.find(v => v.id === inv.vendor_id)?.company_name || '—'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--danger)' }}>- ₹{inv.total_amount.toLocaleString()}</td>
                        <td>{new Date(inv.invoice_date).toLocaleDateString()}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{inv.particulars}</td>
                      </tr>
                    ))
                  )}
                  {selectedCompanyWithdrawals.length > 0 && (
                    <tr style={{ fontWeight: 'bold', background: 'rgba(0,0,0,0.02)' }}>
                      <td colSpan="4" style={{ textAlign: 'right' }}>Total Withdrawals:</td>
                      <td style={{ color: 'var(--danger)' }}>
                        - ₹{selectedCompanyWithdrawals.reduce((sum, inv) => sum + inv.total_amount, 0).toLocaleString()}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Show cumulative deposits too */}
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '2rem', marginBottom: '1rem' }} className="no-print">
                Deposits Record (Cumulative)
              </h3>
              <table className="data-table no-print">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Remarks</th>
                    <th>Bank Sheet</th>
                  </tr>
                </thead>
                <tbody>
                  {!selectedCompany.deposits || selectedCompany.deposits.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No deposits yet.</td>
                    </tr>
                  ) : (
                    selectedCompany.deposits.map(dep => (
                      <tr key={dep.id}>
                        <td>{new Date(dep.deposit_date).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 600, color: 'var(--success)' }}>+ ₹{dep.amount.toLocaleString()}</td>
                        <td>{dep.remarks}</td>
                        <td>
                          {dep.bank_sheet_no ? (
                            <button 
                              onClick={() => setSelectedDepositToPrint({ ...dep, fuel_company: selectedCompany })}
                              className="btn" 
                              style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(79, 70, 229, 0.08)' }}
                            >
                              <FileText size={12} /> View Bank Sheet
                            </button>
                          ) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Deposit Tab */}
      {activeTab === 'deposit' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>Deposit Prepaid Reserves</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Add funds to the prepaid account of HPCL, BPCL, etc. This amount is directly cut from the Organization's overall budget.
              </p>
            </div>

            <form onSubmit={handleDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Select Fuel Company</label>
                <select value={depositCompanyId} onChange={e=>setDepositCompanyId(e.target.value)} className="input-field" required>
                  <option value="">-- Select Company --</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name} (Balance: ₹{c.balance.toLocaleString()})</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Deposit Date (Custom)</label>
                <input 
                  type="date" 
                  value={depositDate} 
                  onChange={e=>setDepositDate(e.target.value)} 
                  className="input-field" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Deposit Amount (₹)</label>
                <input 
                  type="number" 
                  value={depositAmount} 
                  onChange={e=>setDepositAmount(e.target.value)} 
                  className="input-field" 
                  placeholder="e.g. 500000" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Remarks</label>
                <input 
                  type="text" 
                  value={depositRemarks} 
                  onChange={e=>setDepositRemarks(e.target.value)} 
                  className="input-field" 
                  placeholder="e.g. FY 2026 Quarter 2 Deposit" 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>
                Authorize Deposit <ArrowUpRight size={16} />
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <AlertCircle size={16} /> Helpful Instruction
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                Pre-paying deposits will deduct the amount directly from the Organization's overall budget, making it available as a pool of credit for vendors to draw diesel from at registered petrol pumps.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Draw Tab */}
      {activeTab === 'draw' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>Record Diesel Drawn by Vendor</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                When a vendor draws diesel, record the transaction details. The amount is immediately deducted from the fuel company's balance and from the Project's remaining budget.
              </p>
            </div>

            <form onSubmit={handleDraw} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Select Petrol Pump</label>
                <select value={drawPumpId} onChange={e=>setDrawPumpId(e.target.value)} className="input-field" required>
                  <option value="">-- Select Petrol Pump --</option>
                  {pumps.map(p => <option key={p.id} value={p.id}>{p.name} ({p.fuel_company.name} - Bal: ₹{p.fuel_company.balance.toLocaleString()})</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Select Project</label>
                <select value={drawProjectId} onChange={e=>setDrawProjectId(e.target.value)} className="input-field" required>
                  <option value="">-- Select Project --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.project_id} - {p.name} (Budget: ₹{p.budget_remaining.toLocaleString()})</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Select Vendor (Drawing Diesel)</label>
                <select value={drawVendorId} onChange={e=>setDrawVendorId(e.target.value)} className="input-field">
                  <option value="">-- Select Vendor (Optional) --</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name} ({v.vendor_id})</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Diesel Bill Amount (₹)</label>
                <input 
                  type="number" 
                  value={drawAmount} 
                  onChange={e=>setDrawAmount(e.target.value)} 
                  className="input-field" 
                  placeholder="Enter invoice amount, e.g. 15000" 
                  required 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>
                Record Diesel Draw <ArrowDownLeft size={16} />
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                <CheckCircle2 size={16} /> Double-sided Budget Deduction
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                Submitting this draw transaction does two things automatically:<br />
                1. Deducts the amount from the fuel company's pre-paid balance.<br />
                2. Deducts the amount from the target project's remaining budget.<br />
                3. Automatically creates a paid/settled invoice in the name of the petrol pump!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Setup Tab */}
      {activeTab === 'setup' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Register Fuel Company */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-main)' }}>Register Fuel Company Tieup</h2>
            <form onSubmit={handleCreateCompany} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Company Name (e.g. HPCL, BPCL)</label>
                <input 
                  type="text" 
                  value={newCompanyName} 
                  onChange={e=>setNewCompanyName(e.target.value)} 
                  className="input-field" 
                  placeholder="e.g. HPCL" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Bank Name</label>
                <input 
                  type="text" 
                  value={newCompanyBankName} 
                  onChange={e=>setNewCompanyBankName(e.target.value)} 
                  className="input-field" 
                  placeholder="e.g. State Bank of India" 
                />
              </div>

              <div className="form-group">
                <label>Bank Branch</label>
                <input 
                  type="text" 
                  value={newCompanyBankBranch} 
                  onChange={e=>setNewCompanyBankBranch(e.target.value)} 
                  className="input-field" 
                  placeholder="e.g. Pune Main Branch" 
                />
              </div>

              <div className="form-group">
                <label>IFSC Code</label>
                <input 
                  type="text" 
                  value={newCompanyIfsc} 
                  onChange={e=>setNewCompanyIfsc(e.target.value)} 
                  className="input-field" 
                  placeholder="e.g. SBIN0001234" 
                />
              </div>

              <div className="form-group">
                <label>Account Number</label>
                <input 
                  type="text" 
                  value={newCompanyAccountNo} 
                  onChange={e=>setNewCompanyAccountNo(e.target.value)} 
                  className="input-field" 
                  placeholder="e.g. 12345678901" 
                />
              </div>

              <div className="form-group">
                <label>PAN Details</label>
                <input 
                  type="text" 
                  value={newCompanyPan} 
                  onChange={e=>setNewCompanyPan(e.target.value)} 
                  className="input-field" 
                  placeholder="e.g. ABCDE1234F" 
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input 
                  type="text" 
                  value={newCompanyAddress} 
                  onChange={e=>setNewCompanyAddress(e.target.value)} 
                  className="input-field" 
                  placeholder="Company office address" 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'start' }}>Register Company</button>
            </form>
          </div>

          {/* Register Petrol Pump */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-main)' }}>Register Petrol Pump Station</h2>
            <form onSubmit={handleCreatePump} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Parent Fuel Company</label>
                <select value={newPumpCompanyId} onChange={e=>setNewPumpCompanyId(e.target.value)} className="input-field" required>
                  <option value="">-- Select Company --</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Petrol Pump Name</label>
                <input 
                  type="text" 
                  value={newPumpName} 
                  onChange={e=>setNewPumpName(e.target.value)} 
                  className="input-field" 
                  placeholder="e.g. HPCL Pump Pune Highway" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>GSTIN & PAN (Optional)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" value={newPumpGst} onChange={e=>setNewPumpGst(e.target.value)} className="input-field" placeholder="GSTIN" style={{ flex: 1 }} />
                  <input type="text" value={newPumpPan} onChange={e=>setNewPumpPan(e.target.value)} className="input-field" placeholder="PAN" style={{ flex: 1 }} />
                </div>
              </div>

              <div className="form-group">
                <label>Contact Phone / Details</label>
                <input 
                  type="text" 
                  value={newPumpContact} 
                  onChange={e=>setNewPumpContact(e.target.value)} 
                  className="input-field" 
                  placeholder="Phone number" 
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input 
                  type="text" 
                  value={newPumpAddress} 
                  onChange={e=>setNewPumpAddress(e.target.value)} 
                  className="input-field" 
                  placeholder="Pump location address" 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'start' }}>Register Petrol Pump</button>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE BANK SHEET FOR DEPOSIT MODAL */}
      {selectedDepositToPrint && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'white' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <span style={{ fontWeight: 600, color: '#1f2937' }}>Prepaid Diesel Deposit Bank Release Sheet</span>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => window.print()} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                  <Printer size={16} /> Print Sheet
                </button>
                <button onClick={() => setSelectedDepositToPrint(null)} className="btn btn-danger" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                  Close
                </button>
              </div>
            </div>

            <div id="printable-deposit-bank-sheet" style={{ padding: '2rem', fontFamily: 'Inter, sans-serif', color: '#1e293b', background: 'white', textAlign: 'left' }}>
              <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>NAAM FOUNDATION</h1>
                  <p style={{ fontSize: '11px', color: '#555', margin: '4px 0 0 0' }}>Prepaid Diesel Deposit Bank Remittance Order</p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px' }}>
                  <strong>Sheet No:</strong> {selectedDepositToPrint.bank_sheet_no || 'N/A'}<br />
                  <strong>Date:</strong> {new Date(selectedDepositToPrint.deposit_date).toLocaleDateString()}
                </div>
              </div>

              <p style={{ fontSize: '12px', lineHeight: 1.6 }}>
                To,<br />
                The Branch Manager,<br />
                State Bank of India (NAAM Foundation Corporate Account)<br />
                Pune, Maharashtra.
              </p>

              <p style={{ fontSize: '12px', lineHeight: 1.6, margin: '1rem 0' }}>
                Please authorize the release of prepaid diesel funds for the registered fuel company tie-up listed below. Deduct the specified amount from the NAAM Foundation budget reserve and credit to the beneficiary's corporate bank account.
              </p>

              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1.5rem 0', fontSize: '11px' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', width: '200px' }}>Beneficiary Fuel Company</td>
                    <td style={{ padding: '8px' }}>{selectedDepositToPrint.fuel_company?.name}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>Bank Name</td>
                    <td style={{ padding: '8px' }}>{selectedDepositToPrint.fuel_company?.bank_name || 'N/A'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>Bank Branch</td>
                    <td style={{ padding: '8px' }}>{selectedDepositToPrint.fuel_company?.branch || 'N/A'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>Account Number</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{selectedDepositToPrint.fuel_company?.account_no || 'N/A'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>IFSC Code</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{selectedDepositToPrint.fuel_company?.ifsc || 'N/A'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>PAN Number</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{selectedDepositToPrint.fuel_company?.pan || 'N/A'}</td>
                  </tr>
                  <tr style={{ borderBottom: '2px solid #0f172a', background: '#f8fafc' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', fontSize: '12px' }}>Total Payout Amount</td>
                    <td style={{ padding: '8px', fontWeight: 'bold', fontSize: '12px', color: '#4f46e5' }}>₹{selectedDepositToPrint.amount?.toLocaleString('en-IN')}.00</td>
                  </tr>
                </tbody>
              </table>

              <p style={{ fontSize: '11px', color: '#666', fontStyle: 'italic', marginTop: '1rem' }}>
                Remarks: {selectedDepositToPrint.remarks || 'No remarks provided'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem', fontSize: '12px' }}>
                <div style={{ textAlign: 'center', width: '200px', borderTop: '1px solid #000', paddingTop: '8px' }}>
                  Prepared By (Operator)
                </div>
                <div style={{ textAlign: 'center', width: '200px', borderTop: '1px solid #000', paddingTop: '8px' }}>
                  Authorized Signatory (Admin)
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Company Details Modal */}
      {showEditCompanyModal && (
        <div className="modal-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2rem', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Landmark size={20} color="var(--primary)" /> Edit Fuel Company Details
              </h3>
              <button onClick={() => setShowEditCompanyModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateCompany} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Fuel Company Name *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editCompanyName} 
                  onChange={e => setEditCompanyName(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Bank Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editCompanyBankName} 
                  onChange={e => setEditCompanyBankName(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Bank Branch</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editCompanyBankBranch} 
                  onChange={e => setEditCompanyBankBranch(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>IFSC Code</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editCompanyIfsc} 
                  onChange={e => setEditCompanyIfsc(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editCompanyAccountNo} 
                  onChange={e => setEditCompanyAccountNo(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>PAN Card Details</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editCompanyPan} 
                  onChange={e => setEditCompanyPan(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Corporate Address</label>
                <textarea 
                  className="input-field" 
                  rows="2" 
                  value={editCompanyAddress} 
                  onChange={e => setEditCompanyAddress(e.target.value)} 
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 2rem' }}>Save Changes</button>
                <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }} onClick={() => setShowEditCompanyModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
