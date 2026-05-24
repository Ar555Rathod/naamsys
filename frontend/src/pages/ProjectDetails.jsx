import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FolderKanban, Building, Users, FileText, IndianRupee, Printer, ArrowLeft, Calendar, Landmark, User, FileCheck2, Receipt, Activity, MapPin } from 'lucide-react';
import api from '../api';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);
    } catch (err) {
      console.error('Failed to fetch project details', err);
      alert('Project not found or failed to load details.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading project details...</p>
      </div>
    );
  }

  if (!project) return null;

  // Calculations
  const totalInvoiced = project.invoices
    .filter(i => i.invoice_type === 'TypeA')
    .reduce((sum, inv) => sum + inv.total_amount, 0);
  
  const totalReceivables = project.invoices
    .filter(i => i.invoice_type !== 'TypeA')
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  const budgetUsed = project.budget - project.budget_remaining;
  const progressPercentage = project.budget > 0 ? (budgetUsed / project.budget) * 100 : 0;

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="main-content">
      {/* Absolute Print Layout CSS injected dynamically */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #dossier-report, #dossier-report * {
            visibility: visible !important;
          }
          #dossier-report {
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
          .page-break-after {
            page-break-after: always !important;
          }
        }
      ` }} />

      {/* Navigation and Actions */}
      <div className="page-header no-print" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => navigate(-1)} className="btn" style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '0.1rem' }}>{project.name}</h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Project Registration Code: {project.project_id}</span>
          </div>
        </div>
        <button onClick={handlePrintDossier} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem' }}>
          <Printer size={18} /> Print Project Dossier
        </button>
      </div>

      {/* Visual Hub Area for Screen Display (Hidden during Print) */}
      <div className="no-print">
        
        {/* Core Financial Indicators */}
        <div className="summary-grid" style={{ marginBottom: '2rem' }}>
          <div className="glass-panel summary-card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <span className="label">Total MoU Allocation</span>
            <span className="value">₹{project.budget.toLocaleString()}</span>
          </div>
          <div className="glass-panel summary-card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <span className="label">Total Billed Invoices</span>
            <span className="value">₹{totalInvoiced.toLocaleString()}</span>
          </div>
          <div className="glass-panel summary-card" style={{ background: 'rgba(16, 185, 129, 0.04)', borderLeft: '4px solid var(--success)' }}>
            <span className="label" style={{ color: 'var(--success)' }}>Remaining Available Balance</span>
            <span className="value" style={{ color: 'var(--success)' }}>₹{project.budget_remaining.toLocaleString()}</span>
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>MoU Budget Allocation Progress</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              ₹{budgetUsed.toLocaleString()} Spent ({progressPercentage.toFixed(1)}%)
            </span>
          </div>
          <div className="progress-container" style={{ height: '8px' }}>
            <div 
              className="progress-bar" 
              style={{ 
                width: `${Math.min(progressPercentage, 100)}%`,
                background: progressPercentage > 90 ? 'var(--danger)' : 'var(--primary)'
              }}
            ></div>
          </div>
        </div>

        {/* Double Column: General Info and Source Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          
          {/* Metadata info */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="var(--primary)" /> Project Details & Milestones
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Scope/Type of Work</span>
                <strong style={{ display: 'block', marginTop: '0.2rem' }}>{project.type_of_work}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Operation Status</span>
                <span className="badge badge-success" style={{ marginTop: '0.2rem', display: 'inline-block' }}>{project.status}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Proposal ID</span>
                <span style={{ display: 'block', marginTop: '0.2rem' }}>{project.proposal_id || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Execution Timeline</span>
                <span style={{ display: 'block', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar size={13} /> 
                  {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Start'} - {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'End'}
                </span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Location Coordinates</span>
                <span style={{ display: 'block', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={13} color="var(--primary)" />
                  Village: {project.village_id || '—'}, Taluka: {project.taluka_id || '—'}, District: {project.district_id || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Funding Source Card */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Landmark size={18} color="var(--primary)" /> Funding Source Allocation
            </h2>
            
            {project.source_type === 'CSR' && project.csr && (
              <div style={{ fontSize: '0.9rem' }}>
                <span style={{ fontSize: '0.7rem', background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                  CSR PARTNER FUNDING
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.75rem', marginBottom: '0.75rem' }}>{project.csr.name}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <div>CSR ID: <strong style={{color: 'var(--text-main)'}}>{project.csr.csr_id}</strong></div>
                  <div>MoU Representative: <strong style={{color: 'var(--text-main)'}}>{project.csr.contact_person}</strong></div>
                  <div>Email: <span style={{color: 'var(--text-main)'}}>{project.csr.email}</span> | Phone: <span style={{color: 'var(--text-main)'}}>{project.csr.phone}</span></div>
                </div>
              </div>
            )}

            {project.source_type === 'GOVT' && project.govt_work_order && (
              <div style={{ fontSize: '0.9rem' }}>
                <span style={{ fontSize: '0.7rem', background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                  GOVERNMENT WORK ORDER
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.75rem', marginBottom: '0.75rem' }}>{project.govt_work_order.work_order_number}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <div>Govt Dept / Scheme: <strong style={{color: 'var(--text-main)'}}>{project.govt_work_order.govt?.scheme_dept || '—'}</strong></div>
                  <div>Type of Work: <strong style={{color: 'var(--text-main)'}}>{project.govt_work_order.govt?.type_of_work || '—'}</strong></div>
                  <div>Original Budget: <strong style={{color: 'var(--text-main)'}}>₹{project.govt_work_order.budget.toLocaleString()}</strong></div>
                </div>
              </div>
            )}

            {project.source_type === 'INDIVIDUAL' && project.individual_donor && (
              <div style={{ fontSize: '0.9rem' }}>
                <span style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.08)', color: 'var(--success)', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                  INDIVIDUAL PHILANTHROPIC DONOR
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.75rem', marginBottom: '0.75rem' }}>{project.individual_donor.name}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <div>Donor ID: <strong style={{color: 'var(--text-main)'}}>{project.individual_donor.donor_id}</strong></div>
                  <div>PAN / Identification: <strong style={{color: 'var(--text-main)'}}>{project.individual_donor.pan || '—'}</strong></div>
                  <div>Contact: <span style={{color: 'var(--text-main)'}}>{project.individual_donor.contact}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vendors and Contractors Assignments */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          
          {/* Vendors */}
          <div className="glass-panel" style={{ padding: '1.75rem', overflow: 'hidden' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} color="var(--primary)" /> Assigned Vendors & Agencies
            </h3>
            {project.vendor_projects.length === 0 ? (
              <p style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>No vendors assigned to this project yet.</p>
            ) : (
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Vendor ID</th>
                    <th>Company Name</th>
                    <th>Owner Details</th>
                  </tr>
                </thead>
                <tbody>
                  {project.vendor_projects.map(vp => (
                    <tr key={vp.id}>
                      <td style={{fontSize: '0.8rem', fontWeight: 600}}>{vp.vendor.vendor_id}</td>
                      <td style={{fontSize: '0.8rem', fontWeight: 500}}>{vp.vendor.company_name}</td>
                      <td style={{fontSize: '0.8rem'}}>{vp.vendor.owner_name} <br/><small style={{color:'var(--text-muted)'}}>{vp.vendor.owner_contact}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Contractors */}
          <div className="glass-panel" style={{ padding: '1.75rem', overflow: 'hidden' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} color="var(--primary)" /> Sub-Contractors assignments
            </h3>
            {project.contractor_assignments.length === 0 ? (
              <p style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>No contractors assigned to this project yet.</p>
            ) : (
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Contractor</th>
                    <th>Contact</th>
                    <th>Vendor Agency</th>
                  </tr>
                </thead>
                <tbody>
                  {project.contractor_assignments.map(ca => (
                    <tr key={ca.id}>
                      <td style={{fontSize: '0.8rem', fontWeight: 600}}>{ca.contractor.full_name}</td>
                      <td style={{fontSize: '0.8rem'}}>{ca.contractor.contact}</td>
                      <td style={{fontSize: '0.8rem', fontWeight: 500}}>{ca.vendor.company_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Work Orders and Purchase Orders Timeline */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          
          {/* Work Orders */}
          <div className="glass-panel" style={{ padding: '1.75rem', overflow: 'hidden' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCheck2 size={16} color="var(--primary)" /> Work Orders List
            </h3>
            {project.work_orders.length === 0 ? (
              <p style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>No Work Orders created for this project yet.</p>
            ) : (
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>WO Ref</th>
                    <th>Vendor</th>
                    <th>Timeline</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {project.work_orders.filter(w=>w.is_active).map(w => (
                    <tr key={w.id}>
                      <td style={{fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)'}}>
                        <Link to="/work-orders" style={{color: 'inherit', textDecoration: 'none'}}>{w.wo_number} (V{w.version})</Link>
                      </td>
                      <td style={{fontSize: '0.8rem'}}>{w.vendor.company_name}</td>
                      <td style={{fontSize: '0.8rem'}}>{new Date(w.completion_date).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge badge-${w.status === 'Completed' ? 'success' : w.status === 'Approved' ? 'warning' : 'secondary'}`} style={{fontSize: '0.7rem', padding: '0.15rem 0.35rem'}}>
                          {w.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Purchase Orders */}
          <div className="glass-panel" style={{ padding: '1.75rem', overflow: 'hidden' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={16} color="var(--primary)" /> Purchase Orders List
            </h3>
            {project.purchase_orders.length === 0 ? (
              <p style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>No Purchase Orders created for this project yet.</p>
            ) : (
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>PO Ref</th>
                    <th>Vendor</th>
                    <th>Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {project.purchase_orders.filter(p=>p.is_active).map(p => (
                    <tr key={p.id}>
                      <td style={{fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)'}}>
                        <Link to="/purchase-orders" style={{color: 'inherit', textDecoration: 'none'}}>{p.po_number} (V{p.version})</Link>
                      </td>
                      <td style={{fontSize: '0.8rem'}}>{p.vendor.company_name}</td>
                      <td style={{fontSize: '0.8rem', fontWeight: 600}}>₹{p.total_amount.toLocaleString()}</td>
                      <td>
                        <span className={`badge badge-${p.status === 'Completed' ? 'success' : p.status === 'Approved' ? 'warning' : 'secondary'}`} style={{fontSize: '0.7rem', padding: '0.15rem 0.35rem'}}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="glass-panel" style={{ padding: '1.75rem', overflow: 'hidden', marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={16} color="var(--primary)" /> Invoiced Accounts History
          </h3>
          {project.invoices.length === 0 ? (
            <p style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>No invoices have been billed against this project yet.</p>
          ) : (
            <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Remittance Vendor</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Remittance Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {project.invoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{fontSize: '0.8rem', fontWeight: 600}}>{inv.invoice_id}</td>
                    <td style={{fontSize: '0.8rem'}}>
                      {inv.invoice_type === 'TypeA' ? (
                        inv.purchase_order ? (
                          <strong>{inv.purchase_order.vendor.company_name}</strong>
                        ) : 'Payable'
                      ) : 'NAAM Foundation'}
                    </td>
                    <td>
                      <span className={inv.invoice_type === 'TypeA' ? 'badge badge-warning' : 'badge badge-success'} style={{fontSize: '0.75rem', padding: '0.15rem 0.4rem'}}>
                        {inv.invoice_type === 'TypeA' ? 'Payable' : 'Receivable'}
                      </span>
                    </td>
                    <td style={{fontSize: '0.8rem', fontWeight: 600}}>₹{inv.total_amount.toLocaleString()}</td>
                    <td style={{fontSize: '0.8rem'}}>{new Date(inv.invoice_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${inv.payment_status === 'Paid' ? 'success' : 'warning'}`} style={{fontSize: '0.7rem', padding: '0.15rem 0.35rem'}}>
                        {inv.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* HIGH-FIDELITY OFFICIAL PRINT-ONLY PROJECT DOSSIER REPORT SECTION */}
      {/* ========================================================================= */}
      <div id="dossier-report" style={{ display: 'none', background: 'white', color: '#1e293b' }}>
        
        {/* Cover Branding Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #4F46E5', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '-0.025em', margin: 0 }}>NAAM Foundation</h1>
            <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginTop: '0.3rem' }}>
              Official Project Audit Dossier & Operational Report
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Report Date: {new Date().toLocaleDateString()}</span>
            <div style={{ marginTop: '0.4rem', border: '1px solid #cbd5e1', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#4F46E5', background: '#f8fafc', display: 'inline-block' }}>
              PROJECT STATUS: {project.status.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Section 1: Project Metadata */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '0.4rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
            1. General Project Information
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.6rem 0', color: '#64748b', width: '30%' }}>Project Code:</td>
                <td style={{ padding: '0.6rem 0', fontWeight: 700, color: '#0f172a' }}>{project.project_id}</td>
                <td style={{ padding: '0.6rem 0', color: '#64748b', width: '30%' }}>Operation Scope:</td>
                <td style={{ padding: '0.6rem 0', fontWeight: 700, color: '#0f172a' }}>{project.type_of_work}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.6rem 0', color: '#64748b' }}>Project Name:</td>
                <td style={{ padding: '0.6rem 0', fontWeight: 700 }} colSpan="3">{project.name}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.6rem 0', color: '#64748b' }}>Location Details:</td>
                <td style={{ padding: '0.6rem 0', fontWeight: 500 }} colSpan="3">
                  Village: {project.village_id || '—'} | Taluka: {project.taluka_id || '—'} | District: {project.district_id || '—'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.6rem 0', color: '#64748b' }}>Funding Source:</td>
                <td style={{ padding: '0.6rem 0', fontWeight: 700 }}>
                  {project.source_type} 
                  {project.csr && ` (${project.csr.name})`}
                  {project.govt_work_order && ` (${project.govt_work_order.work_order_number})`}
                  {project.individual_donor && ` (${project.individual_donor.name})`}
                </td>
                <td style={{ padding: '0.6rem 0', color: '#64748b' }}>Proposal / MoU Reference:</td>
                <td style={{ padding: '0.6rem 0', fontWeight: 500 }}>{project.proposal_id || 'N/A'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.6rem 0', color: '#64748b' }}>Timeline Period:</td>
                <td style={{ padding: '0.6rem 0', fontWeight: 500 }}>
                  {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'} to {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}
                </td>
                <td style={{ padding: '0.6rem 0', color: '#64748b' }}>Registered On:</td>
                <td style={{ padding: '0.6rem 0', fontWeight: 500 }}>{new Date(project.created_at).toLocaleDateString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Financial Accounts Summary */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '0.4rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
            2. Financial Audit Sheet
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ border: '1px solid #cbd5e1', padding: '0.85rem', borderRadius: '4px', textAlign: 'center', background: '#f8fafc' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>MoU Allocated Budget</span>
              <strong style={{ display: 'block', fontSize: '1.15rem', color: '#0f172a', marginTop: '0.2rem' }}>₹{project.budget.toLocaleString()}.00</strong>
            </div>
            <div style={{ border: '1px solid #cbd5e1', padding: '0.85rem', borderRadius: '4px', textAlign: 'center', background: '#f8fafc' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Cumulative Invoiced Amount</span>
              <strong style={{ display: 'block', fontSize: '1.15rem', color: '#ef4444', marginTop: '0.2rem' }}>- ₹{totalInvoiced.toLocaleString()}.00</strong>
            </div>
            <div style={{ border: '1px solid #cbd5e1', padding: '0.85rem', borderRadius: '4px', textAlign: 'center', background: '#f8fafc' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Remaining Unspent Balance</span>
              <strong style={{ display: 'block', fontSize: '1.15rem', color: '#10b981', marginTop: '0.2rem' }}>₹{project.budget_remaining.toLocaleString()}.00</strong>
            </div>
          </div>
        </div>

        {/* Section 3: Vendor & Contractor Roster */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '0.4rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
            3. Hired Agencies & Personnel Roster
          </h2>
          <h4 style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Assigned Vendors:</h4>
          {project.vendor_projects.length === 0 ? (
            <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#94a3b8' }}>No active vendor assignments.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '0.4rem 0.75rem' }}>Vendor ID</th>
                  <th style={{ padding: '0.4rem 0.75rem' }}>Agency Company Name</th>
                  <th style={{ padding: '0.4rem 0.75rem' }}>Owner Name</th>
                  <th style={{ padding: '0.4rem 0.75rem' }}>PAN Card</th>
                  <th style={{ padding: '0.4rem 0.75rem' }}>Contact</th>
                </tr>
              </thead>
              <tbody>
                {project.vendor_projects.map(vp => (
                  <tr key={vp.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>{vp.vendor.vendor_id}</td>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{vp.vendor.company_name}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{vp.vendor.owner_name}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{vp.vendor.pan}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{vp.vendor.owner_contact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h4 style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Assigned Sub-Contractors:</h4>
          {project.contractor_assignments.length === 0 ? (
            <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#94a3b8' }}>No sub-contractors registered.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '0.4rem 0.75rem' }}>Contractor Name</th>
                  <th style={{ padding: '0.4rem 0.75rem' }}>PAN Card</th>
                  <th style={{ padding: '0.4rem 0.75rem' }}>Contact No</th>
                  <th style={{ padding: '0.4rem 0.75rem' }}>Reporting Vendor Agency</th>
                </tr>
              </thead>
              <tbody>
                {project.contractor_assignments.map(ca => (
                  <tr key={ca.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>{ca.contractor.full_name}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{ca.contractor.pan}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{ca.contractor.contact}</td>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{ca.vendor.company_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="page-break-after"></div>

        {/* Section 4: Work Orders & Purchase Orders */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '0.4rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
            4. Operations Procurement Orders History
          </h2>
          <h4 style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Work Orders (WO):</h4>
          {project.work_orders.length === 0 ? (
            <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#94a3b8', marginBottom: '1.5rem' }}>No Work Orders compiled.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '0.4rem 0.75rem' }}>WO Ref Code</th>
                  <th style={{ padding: '0.4rem 0.75rem' }}>Contracted Agency</th>
                  <th style={{ padding: '0.4rem 0.75rem' }}>Milestone Date</th>
                  <th style={{ padding: '0.4rem 0.75rem', textAlign: 'right' }}>Est. Value</th>
                  <th style={{ padding: '0.4rem 0.75rem' }}>Current Status</th>
                </tr>
              </thead>
              <tbody>
                {project.work_orders.map(w => (
                  <tr key={w.id} style={{ borderBottom: '1px solid #e2e8f0', opacity: w.is_active ? 1 : 0.55 }}>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>{w.wo_number} (V{w.version}) {w.is_active ? '' : '(Superseded)'}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{w.vendor.company_name}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{new Date(w.completion_date).toLocaleDateString()}</td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>{w.budget_amount > 0 ? `₹${w.budget_amount.toLocaleString()}` : '—'}</td>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{w.status.toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h4 style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Purchase Orders (PO):</h4>
          {project.purchase_orders.length === 0 ? (
            <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#94a3b8' }}>No Purchase Orders compiled.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '0.4rem 0.75rem' }}>PO Ref Code</th>
                  <th style={{ padding: '0.4rem 0.75rem' }}>Supplier Agency</th>
                  <th style={{ padding: '0.4rem 0.75rem' }}>Delivery Date</th>
                  <th style={{ padding: '0.4rem 0.75rem', textAlign: 'right' }}>PO Value</th>
                  <th style={{ padding: '0.4rem 0.75rem' }}>Current Status</th>
                </tr>
              </thead>
              <tbody>
                {project.purchase_orders.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0', opacity: p.is_active ? 1 : 0.55 }}>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>{p.po_number} (V{p.version}) {p.is_active ? '' : '(Superseded)'}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{p.vendor.company_name}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{new Date(p.delivery_date).toLocaleDateString()}</td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>₹{p.total_amount.toLocaleString()}</td>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{p.status.toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Section 5: Billed Invoices Accounts */}
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '0.4rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
            5. Invoiced Billing Statements History
          </h2>
          {project.invoices.length === 0 ? (
            <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#94a3b8' }}>No invoices billed against this project.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '0.4rem 0.75rem' }}>Invoice Reference ID</th>
                  <th style={{ padding: '0.4rem 0.75rem' }}>Invoice Type</th>
                  <th style={{ padding: '0.4rem 0.75rem', textAlign: 'right' }}>Total Amount Billed</th>
                  <th style={{ padding: '0.4rem 0.75rem' }}>Billing Date</th>
                  <th style={{ padding: '0.4rem 0.75rem' }}>Remittance Status</th>
                </tr>
              </thead>
              <tbody>
                {project.invoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>{inv.invoice_id}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{inv.invoice_type === 'TypeA' ? 'Payable (Expense)' : 'Receivable (Income)'}</td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>₹{inv.total_amount.toLocaleString()}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{new Date(inv.invoice_date).toLocaleDateString()}</td>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{inv.payment_status.toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Audit Signoff Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #cbd5e1', paddingTop: '2.5rem', marginTop: '4rem' }}>
          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ borderBottom: '1px solid #94a3b8', height: '40px', marginBottom: '0.5rem' }}></div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, margin: 0 }}>Prepared By Operator Representative</p>
            <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Systems Audit Sign</span>
          </div>
          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ borderBottom: '1px solid #94a3b8', height: '40px', marginBottom: '0.5rem' }}></div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, margin: 0 }}>NAAM Managing Board Comptroller</p>
            <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Executive Board seal</span>
          </div>
        </div>

      </div>

    </div>
  );
}
