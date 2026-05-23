import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, Settings as SettingsIcon } from 'lucide-react';
import api from '../api';

const ALL_COLUMNS = [
  { key: 'Project_ID', label: 'Project ID' },
  { key: 'Name', label: 'Name' },
  { key: 'Type', label: 'Type of Work' },
  { key: 'Source', label: 'Funding Source' },
  { key: 'Funding_Entity', label: 'Funding Entity' },
  { key: 'Total_Budget', label: 'Total Budget' },
  { key: 'Budget_Utilized', label: 'Utilized' },
  { key: 'Remaining_Budget', label: 'Remaining' },
  { key: 'Utilized_Percentage', label: '% Used' },
  { key: 'Invoices_Count', label: 'Invoices' },
  { key: 'Status', label: 'Status' }
];

export default function Reports() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedColumns, setSelectedColumns] = useState([
    'Project_ID',
    'Name',
    'Source',
    'Funding_Entity',
    'Total_Budget',
    'Budget_Utilized',
    'Remaining_Budget',
    'Utilized_Percentage',
    'Status'
  ]);
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const res = await api.get('/reports/summary');
      setReportData(res.data);
      setSelectedRows(res.data.map(p => p.Project_ID));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleColumnToggle = (key) => {
    setSelectedColumns(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleRowToggle = (projectId) => {
    setSelectedRows(prev => 
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
  };

  const handleSelectAllRows = () => {
    if (selectedRows.length === reportData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(reportData.map(p => p.Project_ID));
    }
  };

  const selectAllColumns = () => {
    setSelectedColumns(ALL_COLUMNS.map(c => c.key));
  };

  const deselectAllColumns = () => {
    setSelectedColumns([]);
  };

  const handleExportCSV = () => {
    const rowsToExport = reportData.filter(row => selectedRows.includes(row.Project_ID));
    if (rowsToExport.length === 0) {
      alert('Please select at least one project row to export.');
      return;
    }
    if (selectedColumns.length === 0) {
      alert('Please select at least one column to include.');
      return;
    }

    // Get selected headers
    const headers = ALL_COLUMNS.filter(col => selectedColumns.includes(col.key));
    
    // Create CSV rows
    const csvRows = [];
    csvRows.push(headers.map(h => h.label).join(',')); // Add header row

    for (const row of rowsToExport) {
      const values = headers.map(header => {
        const val = row[header.key];
        // Escape quotes and wrap in quotes to handle commas in data
        return `"${String(val !== undefined && val !== null ? val : '').replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    // Add UTF-8 Byte Order Mark (BOM) so Excel reads standard characters and punctuation perfectly
    const csvData = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `NAAM_Customized_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    // Defer removal and revocation to ensure the browser successfully processes the download request before the elements are garbage collected
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 150);
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Reports & Analytics</h1>
        <button 
          className="btn btn-primary" 
          onClick={handleExportCSV} 
          disabled={reportData.length === 0 || selectedColumns.length === 0 || selectedRows.length === 0}
        >
          <Download size={18} /> Export Custom Report ({selectedRows.length} rows)
        </button>
      </div>

      {/* Dynamic Column & Row Configurator Dashboard */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', margin: 0 }}>
          <SettingsIcon size={18} style={{ opacity: 0.8 }} /> Customized Export & View Configurator
        </h3>
        
        {/* Columns Grid Checklist */}
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
            SELECT COLUMNS TO INCLUDE:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {ALL_COLUMNS.map(col => {
              const isChecked = selectedColumns.includes(col.key);
              return (
                <label key={col.key} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.85rem',
                  background: isChecked ? 'rgba(30, 41, 59, 0.05)' : 'rgba(255, 255, 255, 0.4)',
                  border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--border)'}`,
                  color: isChecked ? 'var(--primary)' : 'var(--text-muted)',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: isChecked ? 600 : 400,
                  cursor: 'pointer',
                  margin: 0,
                  transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleColumnToggle(col.key)}
                    style={{ cursor: 'pointer', margin: 0 }}
                  />
                  {col.label}
                </label>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={selectAllColumns} 
            className="btn" 
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: 'rgba(30, 41, 59, 0.06)', color: 'var(--primary)' }}
          >
            Select All Columns
          </button>
          <button 
            onClick={deselectAllColumns} 
            className="btn" 
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Clear All Columns
          </button>
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Active View: <strong>{selectedColumns.length} columns</strong> & <strong>{selectedRows.length}</strong> of <strong>{reportData.length}</strong> project rows selected
            </span>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <FileSpreadsheet size={18} color="var(--primary)" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Interactive Master Budget Table Preview</span>
        </div>
        
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading report data...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', paddingLeft: '1.5rem' }}>
                    <input 
                      type="checkbox" 
                      checked={reportData.length > 0 && selectedRows.length === reportData.length}
                      ref={input => {
                        if (input) {
                          input.indeterminate = selectedRows.length > 0 && selectedRows.length < reportData.length;
                        }
                      }}
                      onChange={handleSelectAllRows}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  {ALL_COLUMNS.filter(col => selectedColumns.includes(col.key)).map(col => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => {
                  const isRowSelected = selectedRows.includes(row.Project_ID);
                  return (
                    <tr key={idx} style={{ 
                      opacity: isRowSelected ? 1 : 0.45, 
                      background: isRowSelected ? 'transparent' : 'rgba(15, 23, 42, 0.02)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                      <td style={{ paddingLeft: '1.5rem' }}>
                        <input 
                          type="checkbox" 
                          checked={isRowSelected}
                          onChange={() => handleRowToggle(row.Project_ID)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      {selectedColumns.includes('Project_ID') && <td style={{ fontWeight: 600 }}>{row.Project_ID}</td>}
                      {selectedColumns.includes('Name') && <td>{row.Name}</td>}
                      {selectedColumns.includes('Type') && <td>{row.Type}</td>}
                      {selectedColumns.includes('Source') && (
                        <td>
                          <span className={`badge ${
                            row.Source === 'CSR' ? 'badge-success' : 
                            row.Source === 'GOVT' ? 'badge-warning' : 'badge-danger'
                          }`} style={{ fontSize: '0.7rem' }}>
                            {row.Source}
                          </span>
                        </td>
                      )}
                      {selectedColumns.includes('Funding_Entity') && <td>{row.Funding_Entity || 'N/A'}</td>}
                      {selectedColumns.includes('Total_Budget') && <td>₹{row.Total_Budget.toLocaleString()}</td>}
                      {selectedColumns.includes('Budget_Utilized') && <td>₹{row.Budget_Utilized.toLocaleString()}</td>}
                      {selectedColumns.includes('Remaining_Budget') && (
                        <td style={{ color: row.Remaining_Budget < (row.Total_Budget * 0.2) ? 'var(--danger)' : 'inherit', fontWeight: row.Remaining_Budget < (row.Total_Budget * 0.2) ? 600 : 'normal' }}>
                          ₹{row.Remaining_Budget.toLocaleString()}
                        </td>
                      )}
                      {selectedColumns.includes('Utilized_Percentage') && (
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '50px', height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: row.Utilized_Percentage, height: '100%', background: 'var(--primary)', borderRadius: '3px' }}></div>
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{row.Utilized_Percentage}</span>
                          </div>
                        </td>
                      )}
                      {selectedColumns.includes('Invoices_Count') && <td>{row.Invoices_Count}</td>}
                      {selectedColumns.includes('Status') && (
                        <td>
                          <span className={`badge ${
                            row.Status === 'Active' ? 'badge-success' : 
                            row.Status === 'Completed' ? 'badge-success' : 'badge-danger'
                          }`} style={{ fontSize: '0.7rem' }}>
                            {row.Status}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {reportData.length === 0 && <tr><td colSpan={selectedColumns.length + 1} style={{textAlign:'center', padding: '2rem', color: 'var(--text-muted)'}}>No budget records found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
