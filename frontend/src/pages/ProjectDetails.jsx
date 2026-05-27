import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Users, FileText, Printer, ArrowLeft, Calendar, Landmark, User, FileCheck2, Receipt, Activity, MapPin, UploadCloud } from 'lucide-react';
import api, { getUploadUrl } from '../api';

const isImage = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif') || lower.endsWith('.webp');
};

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjectDetails = useCallback(async () => {
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
  }, [id, navigate]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await api.get(`/config/audit-logs?module=Projects&record_id=${id}`);
      setAuditLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch project audit logs', err);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProjectDetails();
    fetchAuditLogs();
  }, [fetchProjectDetails, fetchAuditLogs]);

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleUpdatePdf = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);

    try {
      // 1. Upload file buffer to TiDB database as BLOB
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newFilename = res.data.filename;

      // 2. Put update to project details
      await api.put(`/projects/${project.id}`, { proposal_pdf: newFilename });
      await fetchProjectDetails();
      alert('Project Proposal PDF updated successfully!');
      
      // 3. Refresh audit logs timeline
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to upload proposal PDF');
    } finally {
      setIsUploading(false);
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

  const budgetUsed = project.budget - project.budget_remaining;
  const progressPercentage = project.budget > 0 ? (budgetUsed / project.budget) * 100 : 0;

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="main-content">


      {/* Navigation and Actions */}
      <div className="page-header no-print" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => navigate(-1)} className="btn" style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '0.1rem' }}>{project.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Project Registration Code: {project.project_id}</span>
              {project.creator && (
                <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(255,255,255,0.04)', padding: '0.15rem 0.5rem', borderRadius: '100px', color: 'var(--text-muted)' }}>
                  <User size={11} color="var(--primary)" /> Created by <strong>{project.creator.name}</strong> on {new Date(project.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </span>
              )}
            </div>
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
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Proposal PDF</span>
                {project.proposal_pdf ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <a href={getUploadUrl(project.proposal_pdf)} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px' }} title={project.proposal_pdf}>
                      📄 View Proposal
                    </a>
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      disabled={isUploading}
                      className="btn" 
                      style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      {isUploading ? '...' : 'Update'}
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={isUploading}
                    className="btn btn-primary" 
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', gap: '0.25rem', marginTop: '0.2rem', display: 'flex', alignItems: 'center' }}
                  >
                    <UploadCloud size={12} /> {isUploading ? 'Uploading...' : 'Upload PDF'}
                  </button>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleUpdatePdf} 
                  accept="application/pdf,image/*" 
                  style={{ display: 'none' }} 
                />
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Execution Timeline</span>
                <span style={{ display: 'flex', marginTop: '0.2rem', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar size={13} /> 
                  {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Start'} - {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'End'}
                </span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Location Coordinates</span>
                <span style={{ display: 'flex', marginTop: '0.2rem', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={13} color="var(--primary)" />
                  Village: {project.village_name || project.village_id || '—'}, Taluka: {project.taluka_name || project.taluka_id || '—'}, District: {project.district_name || project.district_id || '—'}
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
                        <Link to="/work-orders" style={{color: 'inherit', textDecoration: 'none'}}>{w.wo_number} (A{w.version})</Link>
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
                        <Link to="/purchase-orders" style={{color: 'inherit', textDecoration: 'none'}}>{p.po_number} (A{p.version})</Link>
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

        {/* Project Audit Trail & Activity History (High Fidelity Timeline) */}
        <div className="glass-panel" style={{ padding: '1.75rem', overflow: 'hidden', marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} color="var(--primary)" /> Project Audit Trail & Activity Timeline
          </h3>
          {auditLogs.length === 0 ? (
            <p style={{color: 'var(--text-muted)', fontSize: '0.85rem', paddingLeft: '0.5rem'}}>No recorded audit history for this project yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingLeft: '0.5rem', position: 'relative' }}>
              {/* Vertical line connector */}
              <div style={{ position: 'absolute', left: '15px', top: '10px', bottom: '10px', width: '2px', background: 'linear-gradient(180deg, var(--primary) 0%, rgba(255,255,255,0.03) 100%)' }}></div>
              
              {auditLogs.map((log, index) => (
                <div key={log.id} style={{ display: 'flex', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
                  {/* Point Indicator */}
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    background: index === 0 ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)', 
                    border: '3px solid var(--bg-card)', 
                    boxShadow: index === 0 ? '0 0 10px var(--primary)' : 'none',
                    marginTop: '5px',
                    marginLeft: '10px'
                  }}></div>
                  
                  {/* Card Container */}
                  <div className="glass-panel" style={{ 
                    flex: 1, 
                    padding: '0.85rem 1.25rem', 
                    background: index === 0 ? 'rgba(79, 70, 229, 0.04)' : 'rgba(255,255,255,0.01)', 
                    border: index === 0 ? '1px solid rgba(79, 70, 229, 0.15)' : '1px solid rgba(255,255,255,0.03)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: index === 0 ? 'var(--primary)' : 'var(--text-main)' }}>
                        {log.action}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={11} /> {new Date(log.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                      {log.new_value}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <User size={10} color="var(--primary)" /> Performed by: <strong style={{ color: 'var(--text-main)' }}>{log.user.name}</strong> <span style={{ opacity: 0.65 }}>({log.user.role})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* HIGH-FIDELITY OFFICIAL PRINT-ONLY PROJECT DOSSIER REPORT SECTION */}
      {/* ========================================================================= */}
      <div id="dossier-report" className="print-only">
        
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
                  Village: {project.village_name || project.village_id || '—'} | Taluka: {project.taluka_name || project.taluka_id || '—'} | District: {project.district_name || project.district_id || '—'}
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
              {project.proposal_pdf && (
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.6rem 0', color: '#64748b' }}>Proposal PDF Document:</td>
                  <td style={{ padding: '0.6rem 0', fontWeight: 600 }} colSpan="3">
                    {project.proposal_pdf}
                  </td>
                </tr>
              )}
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
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>{w.wo_number} (A{w.version}) {w.is_active ? '' : '(Superseded)'}</td>
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
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>{p.po_number} (A{p.version}) {p.is_active ? '' : '(Superseded)'}</td>
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

        {/* ========================================================================= */}
        {/* PROCUREMENT ORDERS PRINT STACK (LATEST ACTIVE VERSIONS ONLY) */}
        {/* ========================================================================= */}
        {project.purchase_orders && project.purchase_orders.filter(po => po.is_active).map(po => {
          const hasSigned = !!po.duly_signed_url;
          return (
            <React.Fragment key={po.id}>
              {/* ---- SYSTEM-GENERATED PO TEMPLATE ---- */}
              <div style={{ pageBreakBefore: 'always', paddingTop: '2.5rem', fontFamily: 'Inter, sans-serif', color: '#1e293b', textAlign: 'left' }}>
                {/* Cover Branding Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #4F46E5', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
                  <div>
                    <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '-0.025em', margin: 0 }}>NAAM Foundation</h1>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.4rem', lineHeight: '1.4' }}>
                      Plot No 219, Fergusson College Rd, Shivaji Nagar, Pune, MH, 411016<br />
                      Email: finance@naammh.org | Reg: MAH/1196/2015/Pune
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>PURCHASE ORDER</h2>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.4rem', lineHeight: '1.4' }}>
                      PO Ref: <strong>{po.po_number}</strong><br />
                      Version: <strong>A{po.version}</strong><br />
                      Date: {new Date(po.created_at).toLocaleDateString()}<br />
                      {project.creator && <>Issued By: <strong>{project.creator.name}</strong><br /></>}
                      {po.status === 'Approved' && <>Approved By: <strong>Audit Board</strong></>}
                    </p>
                  </div>
                </div>

                {/* Order Specifics Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Supplier / Vendor Details:</h4>
                    <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
                      <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{po.vendor.company_name}</strong>
                      <p style={{ color: '#475569', marginTop: '0.3rem', margin: 0 }}>
                        Owner Name: {po.vendor.owner_name}<br />
                        PAN Card: {po.vendor.pan}<br />
                        GSTIN: {po.vendor.gst || 'N/A'}<br />
                        Contact: {po.vendor.owner_contact}
                      </p>
                      {po.vendor.address_line1 && (
                        <p style={{ color: '#475569', marginTop: '0.3rem', margin: 0 }}>
                          Address: {po.vendor.address_line1}, {po.vendor.address_line2}, {po.vendor.address_line3}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Project Context:</h4>
                    <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
                      <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>Project: {project.project_id}</strong>
                      <p style={{ color: '#475569', marginTop: '0.3rem', margin: 0 }}>
                        Name: {project.name}<br />
                        Type of Operations: {project.type_of_work}<br />
                        Location: {project.village_name || project.village_id || 'N/A'}, Taluka: {project.taluka_name || project.taluka_id || 'N/A'}, Dist: {project.district_name || project.district_id || 'N/A'}
                      </p>
                      {po.contractor && (
                        <p style={{ color: '#475569', marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.4rem', margin: 0 }}>
                          <strong>Sub-Contractor Hired:</strong> {po.contractor.full_name} ({po.contractor.pan})
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items Summary Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2.5rem', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569', width: '70%' }}>Description of Supply/Materials Ordered</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569', width: '30%' }}>Value Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '1.25rem 1rem', fontSize: '0.875rem', verticalAlign: 'top', lineHeight: '1.5' }}>
                        <strong>Material Supply under PO Reference {po.po_number}</strong>
                        <p style={{ color: '#475569', marginTop: '0.5rem', whiteSpace: 'pre-wrap', margin: 0 }}>
                          {po.item_details}
                        </p>
                      </td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', verticalAlign: 'top' }}>
                        ₹{po.total_amount.toLocaleString()}.00
                      </td>
                    </tr>
                    <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                      <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Approved PO Value:</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.15rem', fontWeight: 800, color: '#4F46E5' }}>
                        ₹{po.total_amount.toLocaleString()}.00
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Terms */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '3.5rem', fontSize: '0.8rem', lineHeight: '1.5' }}>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.5rem', margin: 0 }}>Standard Delivery Terms:</h4>
                  <p style={{ margin: '0 0 0.5rem', color: '#475569' }}>
                    All supplies must be delivered in full to site locations by <strong>{new Date(po.delivery_date).toLocaleDateString()}</strong>.
                  </p>
                </div>

                {/* Authorization Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem' }}>
                  <div style={{ textAlign: 'center', width: '220px' }}>
                    <div style={{ borderBottom: '1px solid #cbd5e1', height: '45px', marginBottom: '0.5rem' }}></div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, margin: 0 }}>Vendor/Agency Representative</p>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Authorized Signatory</span>
                  </div>
                  <div style={{ textAlign: 'center', width: '220px' }}>
                    <div style={{ borderBottom: '1px solid #cbd5e1', height: '45px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {po.status === 'Completed' && <span style={{ color: '#10b981', fontStyle: 'italic', fontWeight: 800, fontSize: '0.85rem', border: '2.5px solid #10b981', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>DULY SIGNED</span>}
                      {po.status === 'Approved' && <span style={{ color: '#f59e0b', fontStyle: 'italic', fontWeight: 800, fontSize: '0.85rem', border: '2.5px solid #f59e0b', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>OFFICIALLY APPROVED</span>}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, margin: 0 }}>NAAM Foundation Auditor</p>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Audit Comptroller Code</span>
                  </div>
                </div>
              </div>

              {/* ---- UPLOADED SIGNED COPY IF EXISTS ---- */}
              {hasSigned && (
                <div style={{ pageBreakBefore: 'always', paddingTop: '2.5rem', fontFamily: 'Inter, sans-serif', color: '#1e293b', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #4F46E5', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#4F46E5', margin: 0, textTransform: 'uppercase' }}>Duly Signed Purchase Order Copy</h2>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0' }}>
                        PO Ref: <strong>{po.po_number}</strong> | Version: A{po.version} | Vendor: {po.vendor.company_name}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.85rem', border: '2.5px solid #10b981', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>SIGNED COPY ATTACHED</span>
                    </div>
                  </div>

                  {isImage(po.duly_signed_url) ? (
                    <div style={{ textAlign: 'center', width: '100%', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '8px', background: '#fff' }}>
                      <img
                        src={getUploadUrl(po.duly_signed_url)}
                        alt={`Signed PO ${po.po_number}`}
                        style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                      />
                    </div>
                  ) : (
                    <>
                      {/* Premium fallback card for PDF during printing */}
                      <div style={{ border: '2px dashed #cbd5e1', padding: '2.5rem', borderRadius: '8px', textAlign: 'center', background: '#f8fafc', marginBottom: '2rem' }}>
                        <FileText size={48} style={{ color: '#4F46E5', marginBottom: '1rem', strokeWidth: 1.5 }} />
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Signed PDF Document Attached</h3>
                        <p style={{ fontSize: '0.875rem', color: '#475569', margin: '0 auto 1.5rem auto', maxWidth: '500px', lineHeight: '1.5' }}>
                          The verified signed PDF copy of this Purchase Order is stored in the NAAM document system. 
                          You can scan/click the link below to retrieve or inspect the digital original.
                        </p>
                        <a href={getUploadUrl(po.duly_signed_url)} target="_blank" rel="noreferrer" style={{ display: 'inline-block', fontSize: '0.875rem', fontWeight: 600, color: '#4F46E5', textDecoration: 'underline', wordBreak: 'break-all' }}>
                          {po.duly_signed_url}
                        </a>
                      </div>
                      
                      {/* The interactive screen iframe */}
                      <iframe
                        src={getUploadUrl(po.duly_signed_url)}
                        title={`Signed PO ${po.po_number}`}
                        style={{ width: '100%', height: '75vh', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                        className="hide-on-print"
                      />
                    </>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* ========================================================================= */}
        {/* WORK ORDERS PRINT STACK (LATEST ACTIVE VERSIONS ONLY) */}
        {/* ========================================================================= */}
        {project.work_orders && project.work_orders.filter(wo => wo.is_active).map(wo => {
          const hasSigned = !!wo.duly_signed_url;
          return (
            <React.Fragment key={wo.id}>
              {/* ---- SYSTEM-GENERATED WO TEMPLATE ---- */}
              <div style={{ pageBreakBefore: 'always', paddingTop: '2.5rem', fontFamily: 'Inter, sans-serif', color: '#1e293b', textAlign: 'left' }}>
                {/* Cover Branding Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #4F46E5', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
                  <div>
                    <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '-0.025em', margin: 0 }}>NAAM Foundation</h1>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.4rem', lineHeight: '1.4' }}>
                      Plot No 219, Fergusson College Rd, Shivaji Nagar, Pune, MH, 411016<br />
                      Email: operations@naammh.org | Reg: MAH/1196/2015/Pune
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>WORK ORDER</h2>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.4rem', lineHeight: '1.4' }}>
                      WO Ref: <strong>{wo.wo_number}</strong><br />
                      Version: <strong>A{wo.version}</strong><br />
                      Date: {new Date(wo.created_at).toLocaleDateString()}<br />
                      {project.creator && <>Issued By: <strong>{project.creator.name}</strong><br /></>}
                      {wo.status === 'Approved' && <>Approved By: <strong>Audit Board</strong></>}
                    </p>
                  </div>
                </div>

                {/* Order Specifics Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Contracted Vendor (Agency):</h4>
                    <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
                      <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{wo.vendor.company_name}</strong>
                      <p style={{ color: '#475569', marginTop: '0.3rem', margin: 0 }}>
                        Owner: {wo.vendor.owner_name}<br />
                        PAN Card: {wo.vendor.pan}<br />
                        GSTIN: {wo.vendor.gst || 'N/A'}<br />
                        Remittance Contact: {wo.vendor.owner_contact}
                      </p>
                      {wo.vendor.address_line1 ? (
                        <p style={{ color: '#475569', marginTop: '0.3rem', margin: 0 }}>
                          Address: {wo.vendor.address_line1}, {wo.vendor.address_line2}, {wo.vendor.address_line3}
                        </p>
                      ) : wo.vendor.owner_address && (
                        <p style={{ color: '#475569', marginTop: '0.3rem', margin: 0 }}>Address: {wo.vendor.owner_address}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Project & Sub-Contractor Context:</h4>
                    <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
                      <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>Project: {project.project_id}</strong>
                      <p style={{ color: '#475569', marginTop: '0.3rem', margin: 0 }}>
                        Name: {project.name}<br />
                        Type of Operations: {project.type_of_work}<br />
                        Location: {project.village_name || project.village_id || 'N/A'}, Taluka: {project.taluka_name || project.taluka_id || 'N/A'}, Dist: {project.district_name || project.district_id || 'N/A'}
                      </p>
                      {wo.contractor && (
                        <p style={{ color: '#475569', marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.4rem', margin: 0 }}>
                          <strong>Sub-Contractor Hired:</strong> {wo.contractor.full_name} ({wo.contractor.pan})
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items Summary Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2.5rem', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569', width: '70%' }}>Description of Assigned Work Scope</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569', width: '30%' }}>Value Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '1.25rem 1rem', fontSize: '0.875rem', verticalAlign: 'top', lineHeight: '1.5' }}>
                        <strong>Operations under Work Order Reference {wo.wo_number}</strong>
                        <p style={{ color: '#475569', marginTop: '0.5rem', whiteSpace: 'pre-wrap', margin: 0 }}>
                          {wo.work_description}
                        </p>
                      </td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', verticalAlign: 'top' }}>
                        {wo.budget_amount > 0 ? `₹${wo.budget_amount.toLocaleString()}.00` : 'No direct financial cost'}
                      </td>
                    </tr>
                    {wo.budget_amount > 0 && (
                      <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                        <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Approved Contract Value:</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.15rem', fontWeight: 800, color: '#4F46E5' }}>
                          ₹{wo.budget_amount.toLocaleString()}.00
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Delivery and Schedule Terms */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '3.5rem', fontSize: '0.8rem', lineHeight: '1.5' }}>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.5rem', margin: 0 }}>Standard Delivery Terms & Completion Milestone:</h4>
                  <p style={{ margin: '0 0 0.5rem', color: '#475569' }}>
                    The active operations under this Work Order must be physically executed, reviewed, and finalized by the estimated milestone completion date of <strong>{new Date(wo.completion_date).toLocaleDateString()}</strong>.
                  </p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>
                    * This document represents Version A{wo.version} of the assigned work order number {wo.wo_number} under project registration reference {project.project_id}. Any amendments or modifications override previous version codes.
                  </p>
                </div>

                {/* Authorization Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem' }}>
                  <div style={{ textAlign: 'center', width: '220px' }}>
                    <div style={{ borderBottom: '1px solid #cbd5e1', height: '45px', marginBottom: '0.5rem' }}></div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, margin: 0 }}>Contractor / Vendor Representative</p>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Authorized Acceptor Signatory</span>
                  </div>
                  <div style={{ textAlign: 'center', width: '220px' }}>
                    <div style={{ borderBottom: '1px solid #cbd5e1', height: '45px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {wo.status === 'Completed' && <span style={{ color: '#10b981', fontStyle: 'italic', fontWeight: 800, fontSize: '0.85rem', display: 'inline-block', transform: 'rotate(-4deg)', border: '2.5px solid #10b981', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>DULY SIGNED</span>}
                      {wo.status === 'Approved' && <span style={{ color: '#f59e0b', fontStyle: 'italic', fontWeight: 800, fontSize: '0.85rem', display: 'inline-block', transform: 'rotate(-4deg)', border: '2.5px solid #f59e0b', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>OFFICIALLY APPROVED</span>}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, margin: 0 }}>NAAM Foundation Auditor</p>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Audit Board Signature Code</span>
                  </div>
                </div>
              </div>

              {/* ---- UPLOADED SIGNED COPY IF EXISTS ---- */}
              {hasSigned && (
                <div style={{ pageBreakBefore: 'always', paddingTop: '2.5rem', fontFamily: 'Inter, sans-serif', color: '#1e293b', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #4F46E5', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#4F46E5', margin: 0, textTransform: 'uppercase' }}>Duly Signed Work Order Copy</h2>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0' }}>
                        WO Ref: <strong>{wo.wo_number}</strong> | Version: A{wo.version} | Vendor: {wo.vendor.company_name}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.85rem', border: '2.5px solid #10b981', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>SIGNED COPY ATTACHED</span>
                    </div>
                  </div>

                  {isImage(wo.duly_signed_url) ? (
                    <div style={{ textAlign: 'center', width: '100%', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '8px', background: '#fff' }}>
                      <img
                        src={getUploadUrl(wo.duly_signed_url)}
                        alt={`Signed WO ${wo.wo_number}`}
                        style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                      />
                    </div>
                  ) : (
                    <>
                      {/* Premium fallback card for PDF during printing */}
                      <div style={{ border: '2px dashed #cbd5e1', padding: '2.5rem', borderRadius: '8px', textAlign: 'center', background: '#f8fafc', marginBottom: '2rem' }}>
                        <FileText size={48} style={{ color: '#4F46E5', marginBottom: '1rem', strokeWidth: 1.5 }} />
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Signed PDF Document Attached</h3>
                        <p style={{ fontSize: '0.875rem', color: '#475569', margin: '0 auto 1.5rem auto', maxWidth: '500px', lineHeight: '1.5' }}>
                          The verified signed PDF copy of this Work Order is stored in the NAAM document system. 
                          You can scan/click the link below to retrieve or inspect the digital original.
                        </p>
                        <a href={getUploadUrl(wo.duly_signed_url)} target="_blank" rel="noreferrer" style={{ display: 'inline-block', fontSize: '0.875rem', fontWeight: 600, color: '#4F46E5', textDecoration: 'underline', wordBreak: 'break-all' }}>
                          {wo.duly_signed_url}
                        </a>
                      </div>
                      
                      {/* The interactive screen iframe */}
                      <iframe
                        src={getUploadUrl(wo.duly_signed_url)}
                        title={`Signed WO ${wo.wo_number}`}
                        style={{ width: '100%', height: '75vh', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                        className="hide-on-print"
                      />
                    </>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* ========================================================================= */}
        {/* INVOICES PRINT STACK */}
        {/* ========================================================================= */}
        {project.invoices && project.invoices.map(inv => (
          <div key={inv.id} style={{ pageBreakBefore: 'always', paddingTop: '2.5rem', fontFamily: 'Inter, sans-serif', color: '#1e293b', textAlign: 'left' }}>
            
            {/* Header Branding */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4F46E5', letterSpacing: '-0.025em', textTransform: 'uppercase', margin: 0 }}>NAAM Foundation</h1>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Plot No 219, Fergusson College Rd, Shivaji Nagar, Pune, MH, 411016<br />
                  Email: finance@naammh.org | Reg: MAH/1196/2015/Pune
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>INVOICE SHEET</h2>
                <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500, marginTop: '0.25rem' }}>
                  Invoice Ref: <strong>{inv.invoice_id}</strong><br />
                  Date: {new Date(inv.invoice_date).toLocaleDateString()}<br />
                  {inv.creator && <>Generated By: <strong>{inv.creator.name}</strong></>}
                </p>
              </div>
            </div>

            {/* Invoice Specifics Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Billed From (Contractor / Vendor):</h4>
                {inv.invoice_type === 'TypeA' ? (
                  <div style={{ fontSize: '0.875rem' }}>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{inv.purchase_order?.contractor?.full_name || 'Individual Contractor'}</strong>
                    <p style={{ color: '#475569', marginTop: '0.25rem', margin: 0 }}>
                      Under Vendor Agency: {inv.purchase_order?.vendor?.company_name || 'N/A'}<br />
                      PAN Number: {inv.purchase_order?.contractor?.pan || 'N/A'}<br />
                      GSTIN: {inv.purchase_order?.vendor?.gst || 'N/A'}<br />
                      Contact: {inv.purchase_order?.contractor?.contact}
                    </p>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.875rem' }}>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>NAAM Foundation</strong>
                    <p style={{ color: '#475569', marginTop: '0.25rem', margin: 0 }}>
                      GSTIN: AACTN2388N<br />
                      TDS status: Exempt (12A / 80G Registered)
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Billed To / Project Context:</h4>
                <div style={{ fontSize: '0.875rem' }}>
                  <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>Project: {project.project_id}</strong>
                  <p style={{ color: '#475569', marginTop: '0.25rem', margin: 0 }}>
                    Name: {project.name}<br />
                    Type of Work: {project.type_of_work}<br />
                    Funding Source: {project.source_type} ({inv.invoice_type === 'TypeA' ? 'NAAM Financed' : 'CSR/Govt Receivable'})<br />
                    {inv.purchase_order && <>Linked Purchase Order: <strong>{inv.purchase_order.po_number} (A{inv.purchase_order.version})</strong></>}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Summary Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2.5rem', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Description of Work Done / Supply Delivered</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1.25rem 1rem', fontSize: '0.875rem', verticalAlign: 'top' }}>
                    <strong>{project.type_of_work} Operations</strong>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', margin: 0 }}>
                      {inv.invoice_type === 'TypeA' 
                        ? `Supply and delivery operations completed under Purchase Order ${inv.purchase_order?.po_number || 'N/A'}.`
                        : `CSR / Govt matching funding call for budget allocation under reference ${project.proposal_id || 'N/A'}.`
                      }
                    </p>
                  </td>
                  <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontSize: '0.95rem', fontWeight: 500, verticalAlign: 'top' }}>
                    ₹{inv.subtotal?.toLocaleString() || inv.total_amount?.toLocaleString()}.00
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.875rem', color: '#64748b' }}>Subtotal:</td>
                  <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 500 }}>₹{inv.subtotal?.toLocaleString() || inv.total_amount?.toLocaleString()}.00</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.875rem', color: '#64748b' }}>Taxes & Deductions:</td>
                  <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.875rem', color: '#64748b' }}>₹0.00</td>
                </tr>
                <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Total Amount Billed:</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.1rem', fontWeight: 800, color: '#4F46E5' }}>₹{inv.total_amount.toLocaleString()}.00</td>
                </tr>
              </tbody>
            </table>

            {/* Remittance Bank details */}
            {inv.invoice_type === 'TypeA' && inv.purchase_order?.vendor?.bank_name && (
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '3rem' }}>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.75rem', margin: 0 }}>Beneficiary Remittance Bank Details:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  <div>
                    Bank Name: <strong>{inv.purchase_order.vendor.bank_name}</strong><br />
                    Branch: <strong>{inv.purchase_order.vendor.branch || 'Pune main'}</strong>
                  </div>
                  <div>
                    Account Number: <strong>{inv.purchase_order.vendor.account_no || '••••••••••••'}</strong><br />
                    IFSC Code: <strong>{inv.purchase_order.vendor.ifsc || 'SBIN0007339'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem' }}>
              <div style={{ textAlign: 'center', width: '200px' }}>
                <div style={{ borderBottom: '1px solid #cbd5e1', height: '40px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#10b981', fontStyle: 'italic', fontWeight: 800, fontSize: '0.85rem' }}>PAID INSTANTLY</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, margin: 0 }}>Prepared By Operator</p>
              </div>
              <div style={{ textAlign: 'center', width: '200px' }}>
                <div style={{ borderBottom: '1px solid #cbd5e1', height: '40px', marginBottom: '0.5rem' }}></div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, margin: 0 }}>Approved Auditor Signatory</p>
              </div>
            </div>

          </div>
        ))}

      </div>

    </div>
  );
}
