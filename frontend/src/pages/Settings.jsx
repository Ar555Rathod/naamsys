import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Users, History, ShieldAlert, PlusCircle } from 'lucide-react';
import api from '../api';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('config');
  const [currentUser, setCurrentUser] = useState(null);

  // Configurations States
  const [gstList, setGstList] = useState([]);
  const [tdsList, setTdsList] = useState([]);
  const [fyList, setFyList] = useState([]);

  const [gstName, setGstName] = useState('');
  const [gstRate, setGstRate] = useState('');
  const [tdsName, setTdsName] = useState('');
  const [tdsRate, setTdsRate] = useState('');
  const [tdsCategory, setTdsCategory] = useState('Contractors');
  const [fyLabel, setFyLabel] = useState('');
  const [fyStart, setFyStart] = useState('');
  const [fyEnd, setFyEnd] = useState('');
  const [fyIsActive, setFyIsActive] = useState(false);

  // User Admin States
  const [usersList, setUsersList] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Operator');
  const [vendorsList, setVendorsList] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');

  // Audit Logs States
  const [auditLogs, setAuditLogs] = useState([]);
  const [searchLogQuery, setSearchLogQuery] = useState('');

  useEffect(() => {
    // Decode user role from JWT token
    const token = localStorage.getItem('naam_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser(payload);
      } catch (err) {
        console.error('Failed to parse token payload', err);
      }
    }

    fetchConfigs();
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && currentUser?.role === 'Admin') {
      fetchUsers();
      fetchVendors();
    } else if (activeTab === 'audit' && (currentUser?.role === 'Admin' || currentUser?.role === 'Manager')) {
      fetchAuditLogs();
    }
  }, [activeTab, currentUser]);

  const fetchConfigs = async () => {
    try {
      const gstRes = await api.get('/config/gst'); setGstList(gstRes.data);
      const tdsRes = await api.get('/config/tds'); setTdsList(tdsRes.data);
      const fyRes = await api.get('/config/fy'); setFyList(fyRes.data);
    } catch (err) {
      console.error('Failed to fetch configurations', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/config/users');
      setUsersList(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await api.get('/vendors');
      setVendorsList(res.data);
    } catch (err) {
      console.error('Failed to fetch vendors', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/config/audit-logs');
      setAuditLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    }
  };

  // Creation Submits
  const handleCreateGst = async (e) => {
    e.preventDefault();
    try {
      await api.post('/config/gst', { name: gstName, rate: gstRate });
      setGstName(''); setGstRate('');
      fetchConfigs();
      alert('GST Config Slab successfully created.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create GST');
    }
  };

  const handleCreateTds = async (e) => {
    e.preventDefault();
    try {
      await api.post('/config/tds', { name: tdsName, rate: tdsRate, category: tdsCategory });
      setTdsName(''); setTdsRate('');
      fetchConfigs();
      alert('TDS Config Slab successfully created.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create TDS');
    }
  };

  const handleCreateFy = async (e) => {
    e.preventDefault();
    try {
      await api.post('/config/fy', { label: fyLabel, start_date: fyStart, end_date: fyEnd, is_active: fyIsActive });
      setFyLabel(''); setFyStart(''); setFyEnd(''); setFyIsActive(false);
      fetchConfigs();
      alert('Financial Year successfully created.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create FY');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/config/users', { name: newUserName, email: newUserEmail, password: newUserPassword, role: newUserRole });
      setNewUserName(''); setNewUserEmail(''); setNewUserPassword('');
      fetchUsers();
      alert('New user successfully registered.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to register user.');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/config/users/${userId}/status`, { is_active: !currentStatus });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update user status.');
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const term = searchLogQuery.toLowerCase();
    return (
      log.action?.toLowerCase().includes(term) ||
      log.module?.toLowerCase().includes(term) ||
      log.new_value?.toLowerCase().includes(term) ||
      log.user?.name?.toLowerCase().includes(term) ||
      log.user?.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">System Settings & Admin</h1>
      </div>

      {/* Tabs Navbar */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem', paddingBottom: '0.2rem' }}>
        <button 
          onClick={() => setActiveTab('config')}
          className={`btn ${activeTab === 'config' ? 'btn-primary' : ''}`}
          style={{ background: activeTab !== 'config' ? 'transparent' : undefined, color: activeTab !== 'config' ? 'var(--text-muted)' : undefined }}
        >
          <SettingsIcon size={18} /> Configuration Master
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`btn ${activeTab === 'users' ? 'btn-primary' : ''}`}
          style={{ background: activeTab !== 'users' ? 'transparent' : undefined, color: activeTab !== 'users' ? 'var(--text-muted)' : undefined }}
        >
          <Users size={18} /> User Administration
        </button>
        <button 
          onClick={() => setActiveTab('audit')}
          className={`btn ${activeTab === 'audit' ? 'btn-primary' : ''}`}
          style={{ background: activeTab !== 'audit' ? 'transparent' : undefined, color: activeTab !== 'audit' ? 'var(--text-muted)' : undefined }}
        >
          <History size={18} /> Compliance Audit Trail
        </button>
      </div>

      {/* Configuration Master Tab */}
      {activeTab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {currentUser?.role !== 'Admin' && (
            <p style={{ color: 'var(--text-muted)', background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '8px', fontWeight: 500 }}>
              ⚠️ You have read-only permissions for settings. Creation of configuration models is reserved for System Administrators.
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* GST Config */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>GST Tax Slabs</h3>
              {currentUser?.role === 'Admin' && (
                <form onSubmit={handleCreateGst} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <input type="text" value={gstName} onChange={e=>setGstName(e.target.value)} className="input-field" placeholder="Name (e.g. GST-18)" required />
                  <input type="number" step="0.01" value={gstRate} onChange={e=>setGstRate(e.target.value)} className="input-field" placeholder="Rate %" required />
                  <button type="submit" className="btn btn-primary"><PlusCircle size={16} /></button>
                </form>
              )}
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Slab</th>
                    <th>Rate %</th>
                    <th>Date Configured</th>
                  </tr>
                </thead>
                <tbody>
                  {gstList.map(gst => (
                    <tr key={gst.id}>
                      <td>{gst.name}</td>
                      <td>{gst.rate}%</td>
                      <td>{new Date(gst.effective_from).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {gstList.length === 0 && <tr><td colSpan="3" style={{textAlign:'center', color:'var(--text-muted)'}}>No GST slabs active.</td></tr>}
                </tbody>
              </table>
            </div>

            {/* TDS Config */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>TDS Tax Categories</h3>
              {currentUser?.role === 'Admin' && (
                <form onSubmit={handleCreateTds} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" value={tdsName} onChange={e=>setTdsName(e.target.value)} className="input-field" placeholder="Name (e.g. 194C-Indiv)" required />
                    <input type="number" step="0.01" value={tdsRate} onChange={e=>setTdsRate(e.target.value)} className="input-field" placeholder="Rate %" required />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select value={tdsCategory} onChange={e=>setTdsCategory(e.target.value)} className="input-field">
                      <option value="Contractors">Contractors (e.g. Section 194C)</option>
                      <option value="Professional Services">Professional Services</option>
                      <option value="Rent">Rent</option>
                    </select>
                    <button type="submit" className="btn btn-primary" style={{ width: '60px' }}><PlusCircle size={16} /></button>
                  </div>
                </form>
              )}
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Section/Type</th>
                    <th>Rate %</th>
                  </tr>
                </thead>
                <tbody>
                  {tdsList.map(tds => (
                    <tr key={tds.id}>
                      <td>{tds.name}</td>
                      <td>{tds.category}</td>
                      <td>{tds.rate}%</td>
                    </tr>
                  ))}
                  {tdsList.length === 0 && <tr><td colSpan="3" style={{textAlign:'center', color:'var(--text-muted)'}}>No TDS slabs defined.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Years */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Financial Years Slabs</h3>
            {currentUser?.role === 'Admin' && (
              <form onSubmit={handleCreateFy} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 1fr 1fr', gap: '0.8rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                <input type="text" value={fyLabel} onChange={e=>setFyLabel(e.target.value)} className="input-field" placeholder="Label (e.g. FY 2026-27)" required />
                <input type="date" value={fyStart} onChange={e=>setFyStart(e.target.value)} className="input-field" required />
                <input type="date" value={fyEnd} onChange={e=>setFyEnd(e.target.value)} className="input-field" required />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <input type="checkbox" checked={fyIsActive} onChange={e=>setFyIsActive(e.target.checked)} /> Active
                </label>
                <button type="submit" className="btn btn-primary">Create</button>
              </form>
            )}
            <table className="data-table">
              <thead>
                <tr>
                  <th>Financial Label</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Active Status</th>
                </tr>
              </thead>
              <tbody>
                {fyList.map(fy => (
                  <tr key={fy.id}>
                    <td style={{ fontWeight: 600 }}>{fy.label}</td>
                    <td>{new Date(fy.start_date).toLocaleDateString()}</td>
                    <td>{new Date(fy.end_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${fy.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {fy.is_active ? 'Current Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Administration Tab */}
      {activeTab === 'users' && (
        currentUser?.role === 'Admin' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
            {/* Create User Form */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Create User Account</h3>
              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Full Name</label>
                  <input type="text" value={newUserName} onChange={e=>setNewUserName(e.target.value)} className="input-field" placeholder="e.g. Sanjeev Gurram" required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Email Address</label>
                  <input type="email" value={newUserEmail} onChange={e=>setNewUserEmail(e.target.value)} className="input-field" placeholder="name@naammh.org" required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Password</label>
                  <input type="password" value={newUserPassword} onChange={e=>setNewUserPassword(e.target.value)} className="input-field" placeholder="Minimum 6 characters" required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>System Role Permission</label>
                  <select value={newUserRole} onChange={e=>setNewUserRole(e.target.value)} className="input-field">
                    <option value="Operator">Operator (Data Entry)</option>
                    <option value="Manager">Manager (Approver)</option>
                    <option value="Admin">Admin (Full System Controls)</option>
                    <option value="Vendor">Vendor Portal User</option>
                  </select>
                </div>
                {newUserRole === 'Vendor' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Associate Vendor Profile</label>
                    <select value={selectedVendorId} onChange={e=>setSelectedVendorId(e.target.value)} className="input-field" required>
                      <option value="">-- Select Vendor --</option>
                      {vendorsList.map(v => (
                        <option key={v.id} value={v.id}>{v.company_name} ({v.vendor_id})</option>
                      ))}
                    </select>
                  </div>
                )}
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}>
                  Register User
                </button>
              </form>
            </div>
 
            {/* Users List */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Active Portal Accounts</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Account Profile</th>
                    <th>Permissions Role</th>
                    <th>Registration Date</th>
                    <th>Access Status</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{user.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                        {user.role === 'Vendor' && user.vendor && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500, marginTop: '0.1rem' }}>
                            Vendor: {user.vendor.company_name}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${user.role === 'Admin' ? 'badge-danger' : user.role === 'Manager' ? 'badge-warning' : user.role === 'Vendor' ? 'badge-info' : 'badge-success'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                          <input 
                            type="checkbox" 
                            checked={user.is_active} 
                            disabled={user.id === currentUser?.id}
                            onChange={() => handleToggleUserStatus(user.id, user.is_active)}
                          /> 
                          {user.is_active ? 'Active' : 'Locked'}
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <ShieldAlert size={48} color="var(--danger)" style={{ marginBottom: '1.5rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>Access Restrained</h3>
            <p style={{ color: 'var(--text-muted)' }}>User Administration privileges are locked. Contact NAAM Database Administrators to request access.</p>
          </div>
        )
      )}

      {/* Compliance Audit Trail Tab */}
      {activeTab === 'audit' && (
        currentUser?.role === 'Admin' || currentUser?.role === 'Manager' ? (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 600 }}>Compliance Audit Trails</h3>
              <input 
                type="text" 
                value={searchLogQuery} 
                onChange={e=>setSearchLogQuery(e.target.value)} 
                className="input-field" 
                placeholder="Search audit trail logs..." 
                style={{ maxWidth: '300px' }}
              />
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ whiteSpace: 'nowrap' }}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Permission</th>
                    <th>Action</th>
                    <th>Module</th>
                    <th>Value Changes / Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{log.user?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.user?.email}</div>
                      </td>
                      <td>
                        <span className={`badge ${log.user?.role === 'Admin' ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.7rem' }}>
                          {log.user?.role}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{log.action}</td>
                      <td>{log.module}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.new_value || log.old_value || 'N/A'}
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', color:'var(--text-muted)'}}>No compliance logs matched the filter queries.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <ShieldAlert size={48} color="var(--danger)" style={{ marginBottom: '1.5rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>Access Restrained</h3>
            <p style={{ color: 'var(--text-muted)' }}>Audit Log monitoring is reserved for Executive Managers and System Administrators.</p>
          </div>
        )
      )}
    </div>
  );
}
