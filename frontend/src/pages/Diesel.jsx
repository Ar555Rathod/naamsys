import React, { useState, useEffect } from 'react';
import { Fuel, Landmark, ArrowUpRight, ArrowDownLeft, AlertCircle, PlusCircle, CreditCard, Key, ShieldCheck, CheckCircle2, HelpCircle } from 'lucide-react';
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

  // Form States
  const [newCompanyName, setNewCompanyName] = useState('');
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

  // Draw Form States
  const [drawPumpId, setDrawPumpId] = useState('');
  const [drawProjectId, setDrawProjectId] = useState('');
  const [drawVendorId, setDrawVendorId] = useState('');
  const [drawAmount, setDrawAmount] = useState('');
  const [drawOtp, setDrawOtp] = useState('');
  
  // OTP Simulation States
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [otpGenerated, setOtpGenerated] = useState(false);

  // Edit Org Budget Modal State
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editTotalBudget, setEditTotalBudget] = useState('');
  const [editRemainingBudget, setEditRemainingBudget] = useState('');

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
      await api.post('/diesel/companies', { name: newCompanyName });
      setNewCompanyName('');
      fetchData();
      alert('Fuel Company tieup registered successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to register fuel company');
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
      await api.post('/diesel/deposit', {
        fuel_company_id: parseInt(depositCompanyId),
        amount: parseFloat(depositAmount),
        remarks: depositRemarks
      });
      setDepositCompanyId('');
      setDepositAmount('');
      setDepositRemarks('');
      fetchData();
      alert('Funds deposited successfully! Balance updated.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to deposit funds');
    }
  };

  const generateSimulatedOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(code);
    setOtpGenerated(true);
  };

  const handleDraw = async (e) => {
    e.preventDefault();
    if (!drawPumpId || !drawProjectId || !drawAmount || !drawOtp) {
      alert('All fields including OTP are required');
      return;
    }
    try {
      await api.post('/diesel/draw', {
        petrol_pump_id: parseInt(drawPumpId),
        project_id: parseInt(drawProjectId),
        vendor_id: drawVendorId ? parseInt(drawVendorId) : null,
        amount: parseFloat(drawAmount),
        otp_code: drawOtp
      });
      setDrawPumpId('');
      setDrawProjectId('');
      setDrawVendorId('');
      setDrawAmount('');
      setDrawOtp('');
      setSimulatedOtp('');
      setOtpGenerated(false);
      fetchData();
      alert('Diesel drawn successfully! Invoices generated and balances updated.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to complete transaction');
    }
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    try {
      await api.post('/diesel/budget', {
        total_budget: parseFloat(editTotalBudget),
        budget_remaining: parseFloat(editRemainingBudget)
      });
      setShowBudgetModal(false);
      fetchData();
      alert('Organization budget updated successfully!');
    } catch (err) {
      alert('Failed to update budget');
    }
  };

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
            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => {
              setEditTotalBudget(orgBudget.total_budget.toString());
              setEditRemainingBudget(orgBudget.budget_remaining.toString());
              setShowBudgetModal(true);
            }}>Edit Budget</span>
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
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '2rem' }}>
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
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No fuel companies registered yet. Go to "Register Fuel Tieups" to get started.
                    </td>
                  </tr>
                ) : (
                  companies.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 700 }}>₹{c.balance.toLocaleString()}</td>
                      <td>₹{c.total_deposited.toLocaleString()}</td>
                      <td>{c.petrol_pumps?.length || 0} Pumps</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Transactions/Draw ledger */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)' }}>Recent Diesel Withdrawals</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Project</th>
                  <th>Petrol Pump</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Remarks / Logs</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No diesel draw transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  invoices.map(inv => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 600 }}>{inv.invoice_id}</td>
                      <td>{inv.project?.project_id || '—'}</td>
                      <td>{pumps.find(p => p.id === inv.petrol_pump_id)?.name || 'Petrol Pump'}</td>
                      <td style={{ fontWeight: 600, color: 'var(--danger)' }}>- ₹{inv.total_amount.toLocaleString()}</td>
                      <td>{new Date(inv.invoice_date).toLocaleDateString()}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{inv.particulars}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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

              {/* Simulated OTP Section */}
              <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Key size={14} /> OTP Verification Code
                  </label>
                  <button type="button" onClick={generateSimulatedOtp} className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    Simulate OTP Send
                  </button>
                </div>
                
                {otpGenerated && (
                  <div style={{ marginBottom: '0.75rem', padding: '0.5rem', background: 'rgba(16, 185, 129, 0.05)', color: 'var(--success)', fontSize: '0.8rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={14} /> Simulated OTP sent to vendor: <strong>{simulatedOtp}</strong>
                  </div>
                )}

                <input 
                  type="text" 
                  value={drawOtp} 
                  onChange={e=>setDrawOtp(e.target.value)} 
                  className="input-field" 
                  placeholder="Enter the 6-digit OTP code" 
                  maxLength={6}
                  required 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>
                Verify & Draw Diesel <ArrowDownLeft size={16} />
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

      {/* Edit Org Budget Modal */}
      {showBudgetModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '400px', background: 'var(--bg-main)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Update Organization Budget</h3>
            <form onSubmit={handleUpdateBudget} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Total Budget (₹)</label>
                <input 
                  type="number" 
                  value={editTotalBudget} 
                  onChange={e=>setEditTotalBudget(e.target.value)} 
                  className="input-field" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Remaining Budget (₹)</label>
                <input 
                  type="number" 
                  value={editRemainingBudget} 
                  onChange={e=>setEditRemainingBudget(e.target.value)} 
                  className="input-field" 
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                <button type="button" onClick={() => setShowBudgetModal(false)} className="btn" style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
