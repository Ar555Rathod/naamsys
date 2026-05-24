import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, FileText, CheckSquare, PlusCircle, Search, IndianRupee, FolderKanban } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const pRes = await api.get('/projects'); setProjects(pRes.data);
      const vRes = await api.get('/vendors'); setVendors(vRes.data);
      const iRes = await api.get('/invoices'); setInvoices(iRes.data);
      const poRes = await api.get('/purchase-orders'); setPurchaseOrders(poRes.data);
      const woRes = await api.get('/work-orders'); setWorkOrders(woRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    }
  };

  const pendingInvoices = invoices.filter(i => i.payment_status === 'Pending').length;
  const pendingOrders = [...purchaseOrders, ...workOrders].filter(o => o.status === 'Draft' || o.status === 'SentToVendor').length;

  const totalRemainingBudget = projects.reduce((sum, p) => sum + p.budget_remaining, 0);
  const totalAllocatedBudget = projects.reduce((sum, p) => sum + p.budget, 0);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.project_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.type_of_work.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <Link to="/projects" className="btn btn-primary" style={{textDecoration: 'none'}}>
          <PlusCircle size={18} /> New Project
        </Link>
      </div>

      {/* Grid of Key Financial & Statistical Cards */}
      <div className="summary-grid" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel summary-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <span className="label">Total Projects</span>
          <span className="value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderKanban size={22} color="var(--primary)" /> {projects.length}
          </span>
        </div>
        <div className="glass-panel summary-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <span className="label">Active Vendors</span>
          <span className="value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={22} color="#3b82f6" /> {vendors.length}
          </span>
        </div>
        <div className="glass-panel summary-card" style={{ background: 'rgba(16, 185, 129, 0.05)', borderLeft: '4px solid var(--success)' }}>
          <span className="label" style={{ color: 'var(--success)' }}>Total Remaining Budget</span>
          <span className="value" style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            ₹{totalRemainingBudget.toLocaleString()}
          </span>
          <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
            Out of ₹{totalAllocatedBudget.toLocaleString()} total allocation
          </small>
        </div>
      </div>

      {/* SEARCHABLE Clickable Project List */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontWeight: 600, margin: 0 }}>Project Budget & Operations Overview</h2>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.04)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', width: '320px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={searchTerm}
              onChange={e=>setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', width: '100%', fontFamily: 'Inter', fontSize: '0.9rem' }} 
            />
          </div>
        </div>
        
        {projects.length === 0 && <p style={{color: 'var(--text-muted)'}}>No projects created yet.</p>}
        {filteredProjects.length === 0 && projects.length > 0 && <p style={{color: 'var(--text-muted)'}}>No projects match your search.</p>}
        
        {filteredProjects.map(p => {
          const used = p.budget - p.budget_remaining;
          const percentage = p.budget > 0 ? (used / p.budget) * 100 : 0;
          return (
            <Link 
              key={p.id} 
              to={`/projects/${p.id}`} 
              style={{ display: 'block', textDecoration: 'none', color: 'inherit', marginBottom: '1.5rem' }}
              className="clickable-project-card"
            >
              <div 
                style={{ 
                  padding: '1.25rem', 
                  borderRadius: '10px', 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid var(--border)',
                  transition: 'all 0.25s ease'
                }}
                className="hover-card-glow"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{p.project_id} - {p.name}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '1rem', textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {p.type_of_work}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    <span style={{fontWeight: 600, color: 'var(--text-main)'}}>₹{p.budget_remaining.toLocaleString()}</span> remaining / ₹{p.budget.toLocaleString()} budget
                    {percentage > 90 && <span className="badge badge-danger" style={{ marginLeft: '0.75rem', fontSize: '0.7rem' }}>LOW BUDGET</span>}
                    {p.budget_remaining === 0 && <span className="badge badge-danger" style={{ marginLeft: '0.75rem', fontSize: '0.7rem' }}>EXHAUSTED</span>}
                  </div>
                </div>
                <div className="progress-container" style={{height: '6px'}}>
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${Math.min(percentage, 100)}%`,
                      background: percentage > 90 ? 'var(--danger)' : 'var(--primary)'
                    }}
                  ></div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Pending Items Summaries */}
      <div className="summary-grid">
        <div className="glass-panel summary-card" style={{ flex: 1, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', marginBottom: '0.5rem' }}>
            <CheckSquare size={20} />
            <span className="label" style={{color: '#f59e0b'}}>Awaiting Approvals</span>
          </div>
          <span className="value">{pendingOrders}</span>
          <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
            Work Orders & Purchase Orders needing admin review
          </small>
        </div>
        <div className="glass-panel summary-card" style={{ flex: 1, borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', marginBottom: '0.5rem' }}>
            <FileText size={20} />
            <span className="label" style={{color: '#ef4444'}}>Pending Invoices</span>
          </div>
          <span className="value">{pendingInvoices}</span>
          <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
            Unpaid Type A/B/C invoices
          </small>
        </div>
      </div>
    </div>
  );
}
