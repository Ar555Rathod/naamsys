import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Search, 
  Table, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  FileSpreadsheet, 
  ChevronRight, 
  Loader2 
} from 'lucide-react';
import api from '../api';

const AVAILABLE_TABLES = [
  { key: 'users', label: 'Users', description: 'System operators and administrators' },
  { key: 'projects', label: 'Projects', description: 'Active and completed welfare initiatives' },
  { key: 'vendors', label: 'Vendors', description: 'Registered contractors and vendors' },
  { key: 'contractors', label: 'Contractors', description: 'Assigned field workers' },
  { key: 'csrCompanies', label: 'CSR Partners', description: 'Corporate funding entities' },
  { key: 'govtEntries', label: 'Govt Schemes', description: 'Government department entries' },
  { key: 'govtWorkOrders', label: 'Govt Work Orders', description: 'Official government work sanctions' },
  { key: 'individualDonors', label: 'Individual Donors', description: 'Private philanthropic sponsors' },
  { key: 'invoices', label: 'Invoices', description: 'All financial invoice logs' },
  { key: 'invoiceLineItems', label: 'Invoice Line Items', description: 'Individual invoice itemizations' },
  { key: 'workOrders', label: 'Work Orders', description: 'Vendor work agreements and parameters' },
  { key: 'purchaseOrders', label: 'Purchase Orders', description: 'Materials procurement agreements' },
  { key: 'uploadedFiles', label: 'Uploaded Files', description: 'Binary PDF & Image uploads stored as Blobs' },
  { key: 'auditLogs', label: 'Audit Logs', description: 'Traceability and operator action records' },
  { key: 'configGsts', label: 'GST Configs', description: 'Configured tax brackets' },
  { key: 'configTds', label: 'TDS Configs', description: 'Configured tax withholding categories' },
  { key: 'financialYears', label: 'Financial Years', description: 'Welfare fiscal year divisions' },
  { key: 'locationDistricts', label: 'Districts', description: 'District divisions' },
  { key: 'locationTalukas', label: 'Talukas', description: 'Taluka subdivisions' },
  { key: 'locationVillages', label: 'Villages', description: 'Village mapping logs' },
  { key: 'workingSheets', label: 'Working Sheets', description: 'Aggregated payroll and payout schedules' },
  { key: 'bankStatements', label: 'Bank Statements', description: 'Reconciled bank file uploads' }
];

export default function Backup() {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [userRole, setUserRole] = useState('Operator');

  // Table Explorer State
  const [selectedTable, setSelectedTable] = useState('projects');
  const [tableData, setTableData] = useState([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Decode role from token
    const token = localStorage.getItem('naam_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || 'Operator');
      } catch (e) {
        console.error('Error decoding role token:', e);
      }
    }

    fetchStats();
    fetchTableData('projects');
  }, []);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/backup/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch backup stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchTableData = async (tableName) => {
    setLoadingTable(true);
    setSearchQuery('');
    try {
      const res = await api.get(`/backup/table/${tableName}`);
      setTableData(res.data);
    } catch (err) {
      console.error(`Failed to fetch records for ${tableName}:`, err);
      setTableData([]);
    } finally {
      setLoadingTable(false);
    }
  };

  const handleTableChange = (e) => {
    const table = e.target.value;
    setSelectedTable(table);
    fetchTableData(table);
  };

  const handleDownloadBackup = async () => {
    if (userRole !== 'Admin') {
      alert('Access Denied: Only users with the Admin role can download a full database backup.');
      return;
    }

    setDownloading(true);
    try {
      const response = await api.get('/backup/download', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `naam_database_backup_${date}.json`);
      document.body.appendChild(link);
      link.click();
      
      // Defer clean-up to ensure browser triggers download safely
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 150);
    } catch (error) {
      console.error('Failed to download backup:', error);
      alert('Failed to download backup: ' + (error.response?.data?.error || error.message));
    } finally {
      setDownloading(false);
    }
  };

  // Client-side search logic
  const filteredData = tableData.filter(row => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return Object.values(row).some(value => 
      String(value !== null && value !== undefined ? value : '').toLowerCase().includes(query)
    );
  });

  // Export current filtered table view as CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert('No rows available in the current view to export.');
      return;
    }

    const headers = Object.keys(filteredData[0]);
    const csvRows = [];

    // Header Row
    csvRows.push(headers.map(h => h.toUpperCase().replace(/_/g, ' ')).join(','));

    // Data Rows
    for (const row of filteredData) {
      const values = headers.map(header => {
        const val = row[header];
        return `"${String(val !== undefined && val !== null ? val : '').replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    // Prepend UTF-8 BOM so Excel reads columns and currency/Indian symbols flawlessly
    const csvData = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NAAM_Table_${selectedTable}_${new Date().toISOString().split('T')[0]}.csv`;
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 150);
  };

  // Dynamic header renderer
  const renderHeaders = () => {
    if (filteredData.length === 0) return null;
    return Object.keys(filteredData[0]).map(key => (
      <th key={key}>{key.replace(/_/g, ' ').toUpperCase()}</th>
    ));
  };

  // Dynamic row renderer
  const renderRows = () => {
    return filteredData.map((row, index) => (
      <tr key={row.id || index}>
        {Object.entries(row).map(([key, val], idx) => {
          let displayedVal = String(val !== null && val !== undefined ? val : '');
          
          // Format date columns nicely
          if ((key.endsWith('_at') || key.endsWith('_date') || key === 'timestamp' || key === 'effective_from') && val) {
            try {
              displayedVal = new Date(val).toLocaleString();
            } catch (e) {}
          }
          
          // Truncate long strings for tabular view compatibility
          if (displayedVal.length > 50) {
            displayedVal = displayedVal.substring(0, 47) + '...';
          }

          return (
            <td key={idx} style={{ 
              fontFamily: (key === 'id' || key.endsWith('_id') || key.endsWith('_number')) ? 'monospace' : 'inherit',
              fontWeight: key === 'id' ? 600 : 'normal'
            }}>
              {displayedVal}
            </td>
          );
        })}
      </tr>
    ));
  };

  return (
    <div className="main-content">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Database size={32} color="var(--primary)" /> Database Backups & Data Explorer
        </h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn" 
            style={{ background: 'rgba(30, 41, 59, 0.05)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => { fetchStats(); fetchTableData(selectedTable); }}
          >
            <RefreshCw size={18} /> Refresh Live Data
          </button>
        </div>
      </div>

      {/* Grid Layout: Left panel stats, Right panel backup button */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Left Side: Stats Overview */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Table size={18} color="var(--primary)" /> Database Table Metrics
          </h3>

          {loadingStats ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <Loader2 className="animate-spin" size={24} /> &nbsp;Loading table telemetry...
            </div>
          ) : stats ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '1rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {Object.entries(stats).map(([key, data]) => (
                <div 
                  key={key} 
                  onClick={() => { setSelectedTable(key); fetchTableData(key); }}
                  style={{ 
                    padding: '0.75rem 1rem', 
                    background: selectedTable === key ? 'rgba(30, 41, 59, 0.07)' : 'rgba(255, 255, 255, 0.4)', 
                    border: `1px solid ${selectedTable === key ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {data.label}
                  </span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    {data.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>Failed to retrieve table statistics.</div>
          )}
        </div>

        {/* Right Side: Unified Backup Generator */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="var(--success)" /> Local Database Backup
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.75rem', lineHeight: '1.4' }}>
              Generate a single, comprehensive offline JSON snapshot containing all project entries, budgets, vendors, invoices, activity logs, and attached PDFs (converted cleanly to base64 text).
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {userRole !== 'Admin' && (
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.08)', 
                border: '1px solid rgba(239, 68, 68, 0.2)', 
                borderRadius: '8px', 
                padding: '0.6rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                color: 'var(--danger)'
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>Backup downloads are locked to the <strong>Admin</strong> role. Your role is: <strong>{userRole}</strong>.</span>
              </div>
            )}

            <button 
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              disabled={downloading || userRole !== 'Admin'}
              onClick={handleDownloadBackup}
            >
              {downloading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Compiling & Zipping Database...
                </>
              ) : (
                <>
                  <Download size={18} /> Compile & Download Full Backup
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Bottom Section: Interactive Live Database Explorer */}
      <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>Live Database Explorer</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Inspect, filter, and extract spreadsheet records for individual database components. Showing last 1,000 records.
            </span>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            
            {/* Table Dropdown Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>TABLE:</span>
              <select 
                value={selectedTable} 
                onChange={handleTableChange}
                style={{
                  padding: '0.5rem 2rem 0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'white',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                {AVAILABLE_TABLES.map(t => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Client Search */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                placeholder={`Search ${selectedTable}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.5rem 1rem 0.5rem 2.25rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '0.85rem',
                  width: '220px',
                  background: 'rgba(255, 255, 255, 0.7)'
                }}
              />
            </div>

            {/* CSV Exporter */}
            <button 
              className="btn"
              onClick={handleExportCSV}
              disabled={filteredData.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(30, 41, 59, 0.05)',
                color: 'var(--primary)',
                border: 'none',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem'
              }}
            >
              <FileSpreadsheet size={16} /> Export to CSV
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.2)' }}>
          {loadingTable ? (
            <div style={{ padding: '6rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <Loader2 className="animate-spin" size={32} color="var(--primary)" />
              <span style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>Querying TiDB Cloud...</span>
            </div>
          ) : filteredData.length > 0 ? (
            <div style={{ overflowX: 'auto', maxHeight: '450px' }}>
              <table className="data-table" style={{ whiteSpace: 'nowrap', borderCollapse: 'collapse', width: '100%' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--bg-card)' }}>
                  <tr>
                    {renderHeaders()}
                  </tr>
                </thead>
                <tbody>
                  {renderRows()}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <Table size={32} style={{ opacity: 0.5 }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>No matching records found in table "{selectedTable}"</span>
              {searchQuery && <span style={{ fontSize: '0.8rem' }}>Try refining your search keyword.</span>}
            </div>
          )}
        </div>

        {/* Dynamic description footer */}
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.03)', 
          border: '1px solid var(--border)', 
          borderRadius: '8px', 
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <ChevronRight size={16} />
          <span><strong>Table Schema Description:</strong> {AVAILABLE_TABLES.find(t => t.key === selectedTable)?.description}</span>
        </div>
      </div>
    </div>
  );
}
