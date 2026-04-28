import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, FileText, CheckSquare, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const pRes = await api.get('/projects');
      setProjects(pRes.data);
      const vRes = await api.get('/vendors');
      setVendors(vRes.data);
      const iRes = await api.get('/invoices');
      setInvoices(iRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    }
  };

  const pendingInvoices = invoices.filter(i => i.payment_status === 'Pending').length;

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <Link to="/projects" className="btn btn-primary" style={{textDecoration: 'none'}}>
          <PlusCircle size={18} /> New Project
        </Link>
      </div>

      <div className="summary-grid">
        <div className="glass-panel summary-card">
          <span className="label">Total Projects</span>
          <span className="value">{projects.length}</span>
        </div>
        <div className="glass-panel summary-card">
          <span className="label">Active Vendors</span>
          <span className="value">{vendors.length}</span>
        </div>
        <div className="glass-panel summary-card">
          <span className="label">Total CSR/Govt Entities</span>
          <span className="value">--</span>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Project Budget Overview</h2>
        
        {projects.length === 0 && <p style={{color: 'var(--text-muted)'}}>No projects created yet.</p>}
        {projects.map(p => {
          const used = p.budget - p.budget_remaining;
          const percentage = p.budget > 0 ? (used / p.budget) * 100 : 0;
          return (
            <div key={p.id} style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 500 }}>{p.project_id} - {p.name}</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  ₹{used.toLocaleString()} / ₹{p.budget.toLocaleString()} used
                  {percentage > 90 && <span className="badge badge-danger" style={{ marginLeft: '1rem' }}>LOW BUDGET</span>}
                  {p.budget_remaining === 0 && <span className="badge badge-danger" style={{ marginLeft: '1rem' }}>EXHAUSTED</span>}
                </span>
              </div>
              <div className="progress-container">
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${Math.min(percentage, 100)}%`,
                    background: percentage > 90 ? 'var(--danger)' : 'var(--primary)'
                  }}
                ></div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="summary-grid">
        <div className="glass-panel summary-card" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)' }}>
            <CheckSquare size={20} />
            <span className="label">Pending WCCs</span>
          </div>
          <span className="value">0</span>
        </div>
        <div className="glass-panel summary-card" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
            <FileText size={20} />
            <span className="label">Pending Invoices</span>
          </div>
          <span className="value">{pendingInvoices}</span>
        </div>
      </div>
    </div>
  );
}
