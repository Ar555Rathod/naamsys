import React, { useState, useEffect } from 'react';
import { Users, PlusCircle, Search, Trash2, Edit2, Landmark, Mail, Phone, Briefcase, IndianRupee } from 'lucide-react';
import api from '../api';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editEmployeeId, setEditEmployeeId] = useState(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('Supervisor');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');

  const designations = [
    'Supervisor',
    'Driver',
    'Site Engineer',
    'Accountant',
    'Project Manager',
    'Office Assistant',
    'Operator'
  ];

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load employees list.');
    }
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setDesignation('Supervisor');
    setSalaryAmount('');
    setBankName('');
    setAccountNumber('');
    setIfsc('');
    setEditEmployeeId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !designation || !salaryAmount) {
      alert('Full Name, Designation, and Salary Amount are required.');
      return;
    }

    const payload = {
      full_name: fullName,
      email,
      phone,
      designation,
      salary_amount: parseFloat(salaryAmount),
      bank_name: bankName,
      account_number: accountNumber,
      ifsc
    };

    try {
      if (editEmployeeId) {
        await api.put(`/employees/${editEmployeeId}`, payload);
        alert('Employee updated successfully!');
      } else {
        await api.post('/employees', payload);
        alert('Employee registered successfully!');
      }
      resetForm();
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (emp) => {
    setEditEmployeeId(emp.id);
    setFullName(emp.full_name);
    setEmail(emp.email || '');
    setPhone(emp.phone || '');
    setDesignation(emp.designation);
    setSalaryAmount(emp.salary_amount.toString());
    setBankName(emp.bank_name || '');
    setAccountNumber(emp.account_number || '');
    setIfsc(emp.ifsc || '');
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await api.delete(`/employees/${id}`);
      fetchEmployees();
      alert('Employee deleted successfully.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete employee');
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="main-content">
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={28} color="var(--primary)" /> Employee Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Register staff, configure monthly salaries, and manage employee bank details.
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlusCircle size={16} /> Register Employee
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-main)' }}>
            {editEmployeeId ? 'Edit Employee Record' : 'Register New Employee'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  className="input-field" 
                  placeholder="e.g. Rahul Sharma" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Designation / Role *</label>
                <select 
                  value={designation} 
                  onChange={e => setDesignation(e.target.value)} 
                  className="input-field"
                  required
                >
                  {designations.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="input-field" 
                  placeholder="e.g. rahul@example.com" 
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  className="input-field" 
                  placeholder="e.g. +91 98765 43210" 
                />
              </div>

              <div className="form-group">
                <label>Monthly Basic Salary (₹) *</label>
                <input 
                  type="number" 
                  value={salaryAmount} 
                  onChange={e => setSalaryAmount(e.target.value)} 
                  className="input-field" 
                  placeholder="e.g. 25000" 
                  required 
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)' }}>
                <Landmark size={15} /> Bank Transfer Information (Optional)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Bank Name</label>
                  <input 
                    type="text" 
                    value={bankName} 
                    onChange={e => setBankName(e.target.value)} 
                    className="input-field" 
                    placeholder="e.g. State Bank of India" 
                  />
                </div>
                <div className="form-group">
                  <label>Account Number</label>
                  <input 
                    type="text" 
                    value={accountNumber} 
                    onChange={e => setAccountNumber(e.target.value)} 
                    className="input-field" 
                    placeholder="e.g. 10023948577" 
                  />
                </div>
                <div className="form-group">
                  <label>IFSC Code</label>
                  <input 
                    type="text" 
                    value={ifsc} 
                    onChange={e => setIfsc(e.target.value)} 
                    className="input-field" 
                    placeholder="e.g. SBIN0001234" 
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                {editEmployeeId ? 'Save Changes' : 'Register Employee'}
              </button>
              <button type="button" onClick={resetForm} className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search employees by ID, Name, or Designation..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', width: '100%', fontFamily: 'Inter' }} 
          />
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Full Name</th>
                <th>Designation</th>
                <th>Monthly Salary</th>
                <th>Contact Details</th>
                <th>Bank Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr key={emp.id}>
                  <td style={{ fontWeight: 600 }}>{emp.employee_id}</td>
                  <td>{emp.full_name}</td>
                  <td>
                    <span className="badge badge-info" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}>
                      {emp.designation}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>₹{emp.salary_amount.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.8rem' }}>
                      {emp.email && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}><Mail size={12} /> {emp.email}</span>}
                      {emp.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}><Phone size={12} /> {emp.phone}</span>}
                    </div>
                  </td>
                  <td>
                    {emp.account_number ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <strong>{emp.bank_name}</strong><br />
                        A/C: {emp.account_number} (IFSC: {emp.ifsc})
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Not configured</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleEdit(emp)} className="btn btn-icon" style={{ padding: '0.35rem', background: 'rgba(79,70,229,0.05)', color: 'var(--primary)' }} title="Edit Employee">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(emp.id)} className="btn btn-icon" style={{ padding: '0.35rem', background: 'rgba(239,68,68,0.05)', color: 'var(--danger)' }} title="Delete Employee">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No employee records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
