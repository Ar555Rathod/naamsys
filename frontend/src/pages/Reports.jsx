import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Search, 
  Table, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  ChevronRight, 
  Loader2,
  Calendar,
  XCircle,
  Printer
} from 'lucide-react';
import api from '../api';

const AVAILABLE_TABLES = [
  { key: 'projects', label: 'Projects', description: 'Active and completed welfare initiatives' },
  { key: 'vendors', label: 'Vendors', description: 'Registered contractors and vendors' },
  { key: 'contractors', label: 'Contractors', description: 'Assigned field workers' },
  { key: 'invoices', label: 'Invoices', description: 'All financial invoice logs' },
  { key: 'workOrders', label: 'Work Orders', description: 'Vendor work agreements and parameters' },
  { key: 'purchaseOrders', label: 'Purchase Orders', description: 'Materials procurement agreements' },
  { key: 'workingSheets', label: 'Working Sheets', description: 'Aggregated payroll and payout schedules' },
  { key: 'bankStatements', label: 'Bank Statements', description: 'Reconciled bank statement release orders' },
  { key: 'auditLogs', label: 'Audit Logs', description: 'Traceability and operator action records' }
];

// Flat formatter for human-readable reports
const flattenRow = (row, table) => {
  if (table === 'projects') {
    return {
      'Project ID': row.project_id,
      'Project Name': row.name,
      'Total Budget': `₹${row.budget.toLocaleString('en-IN')}`,
      'Budget Remaining': `₹${row.budget_remaining.toLocaleString('en-IN')}`,
      'Type of Work': row.type_of_work,
      'Sub Type': row.sub_type,
      'Funding Source': row.source_type,
      'Funding Entity': row.source_type === 'CSR' ? (row.csr?.name || 'N/A') : (row.govt_work_order?.work_order_number || row.individual_donor?.donor_id || 'N/A'),
      'District': row.district_name || 'N/A',
      'Taluka': row.taluka_name || 'N/A',
      'Village': row.village_name || 'N/A',
      'Status': row.status,
      'Created At': new Date(row.created_at).toLocaleDateString()
    };
  }
  if (table === 'invoices') {
    return {
      'Invoice ID': row.invoice_id,
      'Invoice Type': row.invoice_type,
      'Project ID': row.project?.project_id || 'N/A',
      'Project Name': row.project?.name || 'N/A',
      'Beneficiary': row.vendor?.company_name || row.contractor?.full_name || 'N/A',
      'Invoice Date': new Date(row.invoice_date).toLocaleDateString(),
      'Subtotal': `₹${row.subtotal.toLocaleString('en-IN')}`,
      'GST Rate (%)': row.gst_rate,
      'GST Amount': `₹${row.gst_amount.toLocaleString('en-IN')}`,
      'TDS Rate (%)': row.tds_rate,
      'TDS Amount': `₹${row.tds_amount.toLocaleString('en-IN')}`,
      'Net Total': `₹${row.total_amount.toLocaleString('en-IN')}`,
      'Payment Status': row.payment_status,
      'Amount Paid': `₹${row.amount_paid.toLocaleString('en-IN')}`,
      'Particulars': row.particulars || 'N/A',
      'Created At': new Date(row.created_at).toLocaleDateString()
    };
  }
  if (table === 'workOrders') {
    return {
      'WO Number': row.wo_number,
      'Version': `A${row.version}`,
      'Project ID': row.project?.project_id || 'N/A',
      'Project Name': row.project?.name || 'N/A',
      'Vendor': row.vendor?.company_name || 'N/A',
      'Contractor': row.contractor?.full_name || 'N/A',
      'Budget Amount': `₹${row.budget_amount.toLocaleString('en-IN')}`,
      'Status': row.status,
      'Completion Date': new Date(row.completion_date).toLocaleDateString(),
      'Work Scope': row.work_description,
      'Created At': new Date(row.created_at).toLocaleDateString()
    };
  }
  if (table === 'purchaseOrders') {
    return {
      'PO Number': row.po_number,
      'Version': `A${row.version}`,
      'Project ID': row.project?.project_id || 'N/A',
      'Project Name': row.project?.name || 'N/A',
      'Vendor': row.vendor?.company_name || 'N/A',
      'Contractor': row.contractor?.full_name || 'N/A',
      'Total Amount': `₹${row.total_amount.toLocaleString('en-IN')}`,
      'Status': row.status,
      'Delivery Date': new Date(row.delivery_date).toLocaleDateString(),
      'Item Scope': row.item_details,
      'Created At': new Date(row.created_at).toLocaleDateString()
    };
  }
  if (table === 'workingSheets') {
    return {
      'Sheet Number': row.sheet_number,
      'Status': row.status,
      'Total Payout': `₹${row.total_payment.toLocaleString('en-IN')}`,
      'Invoices Linked': row.invoices?.length || 0,
      'Created At': new Date(row.created_at).toLocaleDateString()
    };
  }
  if (table === 'bankStatements') {
    return {
      'Statement Number': row.statement_number,
      'Working Sheet Ref': row.working_sheet?.sheet_number || 'N/A',
      'Total Cleared Payout': `₹${(row.working_sheet?.total_payment || 0).toLocaleString('en-IN')}`,
      'Beneficiaries Cleared': row.working_sheet?.invoices?.length || 0,
      'Settled At': new Date(row.created_at).toLocaleDateString()
    };
  }
  if (table === 'vendors') {
    return {
      'Vendor ID': row.vendor_id,
      'Company Name': row.company_name,
      'PAN': row.pan,
      'GST': row.gst || 'N/A',
      'Owner': row.owner_name,
      'Contact': row.owner_contact,
      'Bank': row.bank_name || 'N/A',
      'Account Number': row.account_no || 'N/A',
      'IFSC': row.ifsc || 'N/A',
      'Created At': new Date(row.created_at).toLocaleDateString()
    };
  }
  if (table === 'contractors') {
    return {
      'Contractor ID': row.contractor_id,
      'Full Name': row.full_name,
      'PAN': row.pan,
      'Contact': row.contact,
      'Bank': row.bank_name || 'N/A',
      'Account Number': row.account_no || 'N/A',
      'IFSC': row.ifsc || 'N/A',
      'Created At': new Date(row.created_at).toLocaleDateString()
    };
  }
  if (table === 'auditLogs') {
    return {
      'Log ID': row.id,
      'User ID': row.user_id,
      'Action': row.action,
      'Module': row.module,
      'Record ID': row.record_id || 'N/A',
      'Log Message': row.new_value || row.old_value || '',
      'Timestamp': new Date(row.timestamp).toLocaleString()
    };
  }
  // Fallback simple copy
  const flat = {};
  Object.keys(row).forEach(k => {
    if (typeof row[k] !== 'object') {
      flat[k] = row[k];
    }
  });
  return flat;
};

// Date extraction logic from raw records
const getRowDateValue = (row, table) => {
  if (table === 'invoices') return new Date(row.invoice_date);
  if (table === 'auditLogs') return new Date(row.timestamp);
  if (table === 'workOrders') return new Date(row.created_at);
  if (table === 'purchaseOrders') return new Date(row.created_at);
  return new Date(row.created_at);
};

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedTable, setSelectedTable] = useState('projects');
  const [tableData, setTableData] = useState([]);
  const [loadingTable, setLoadingTable] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchStats();
    fetchTableData('projects');
  }, []);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/reports/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchTableData = async (tableName) => {
    setLoadingTable(true);
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    try {
      const res = await api.get(`/reports/table/${tableName}`);
      setTableData(res.data);
    } catch (err) {
      console.error(`Failed to fetch report table data for ${tableName}:`, err);
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

  const handleRefresh = () => {
    fetchStats();
    fetchTableData(selectedTable);
  };

  // Live filter operations
  const filteredData = tableData.filter(row => {
    // 1. Search Query Filter (checks inside the human-readable flattened values)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const flat = flattenRow(row, selectedTable);
      const matchesSearch = Object.values(flat).some(value => 
        String(value !== null && value !== undefined ? value : '').toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }

    // 2. Date Range Filter
    if (startDate || endDate) {
      const rowDate = getRowDateValue(row, selectedTable);
      if (isNaN(rowDate.getTime())) return true; // Keep row if date is missing/invalid
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        if (rowDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23,59,59,999);
        if (rowDate > end) return false;
      }
    }

    return true;
  });

  // Export as CSV Format
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert('No rows available in the current view to export.');
      return;
    }

    const flattened = filteredData.map(r => flattenRow(r, selectedTable));
    const headers = Object.keys(flattened[0]);
    const csvRows = [];

    // Headers row
    csvRows.push(headers.map(h => h.toUpperCase()).join(','));

    // Data rows
    flattened.forEach(row => {
      const values = headers.map(h => {
        const val = row[h];
        return `"${String(val !== undefined && val !== null ? val : '').replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    // Add UTF-8 BOM so excel processes Rupee symbols
    const csvData = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NAAM_Report_${selectedTable}_${new Date().toISOString().split('T')[0]}.csv`;
    
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 150);
  };



  const renderHeaders = () => {
    if (filteredData.length === 0) return null;
    const flat = flattenRow(filteredData[0], selectedTable);
    return Object.keys(flat).map(key => (
      <th key={key}>{key}</th>
    ));
  };

  const renderRows = () => {
    return filteredData.map((row, index) => {
      const flat = flattenRow(row, selectedTable);
      return (
        <tr key={row.id || index} className="hover-row">
          {Object.entries(flat).map(([key, val], idx) => {
            const displayedVal = String(val !== null && val !== undefined ? val : '');
            return (
              <td key={idx} style={{ 
                fontFamily: (key.includes('ID') || key.includes('Number') || key.includes('Ref') || key.includes('PAN')) ? 'monospace' : 'inherit',
                fontWeight: key.includes('ID') ? 600 : 'normal'
              }}>
                {displayedVal}
              </td>
            );
          })}
        </tr>
      );
    });
  };

  return (
    <div className="main-content">
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-full-height {
            max-height: none !important;
            overflow: visible !important;
          }
          .print-no-border {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
          }
          .glass-panel {
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            padding: 0 !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>

      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Database size={32} color="var(--primary)" /> Customized Reports Engine
        </h1>
        <button 
          className="btn" 
          style={{ background: 'rgba(30, 41, 59, 0.05)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={handleRefresh}
        >
          <RefreshCw size={18} /> Refresh Live Data
        </button>
      </div>

      {/* Grid Layout: Left panel telemetry tiles, Right panel export settings */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Left Side: Stats Overview */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Table size={18} color="var(--primary)" /> Live Reporting Telemetry
          </h3>

          {loadingStats ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <Loader2 className="animate-spin" size={24} /> &nbsp;Loading report telemetry...
            </div>
          ) : stats ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {Object.entries(stats).map(([key, data]) => (
                <div 
                  key={key} 
                  onClick={() => { setSelectedTable(key); fetchTableData(key); }}
                  style={{ 
                    padding: '0.65rem 0.85rem', 
                    background: selectedTable === key ? 'rgba(30, 41, 59, 0.07)' : 'rgba(255, 255, 255, 0.4)', 
                    border: `1px solid ${selectedTable === key ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {data.label}
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                    {data.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>Failed to retrieve data statistics.</div>
          )}
        </div>

        {/* Right Side: Quick Export Actions */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="var(--success)" /> Export Controls
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineHeight: '1.4' }}>
              Generate structured, human-readable data files immediately. Export as CSV for spreadsheet analysis or print directly to PDF.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn"
              onClick={handleExportCSV}
              disabled={filteredData.length === 0}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                background: 'rgba(30, 41, 59, 0.04)',
                color: 'var(--primary)',
                padding: '0.65rem',
                fontSize: '0.85rem'
              }}
            >
              <Download size={15} /> Export CSV
            </button>
            <button 
              className="btn"
              onClick={() => window.print()}
              disabled={filteredData.length === 0}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                background: 'var(--primary)',
                color: 'white',
                padding: '0.65rem',
                fontSize: '0.85rem'
              }}
            >
              <Printer size={15} /> Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Main Bottom Section: Interactive Customized Reports Explorer */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>Customized Table Explorer</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Query and search tables with location names, budgets, and beneficiary relationships resolved.
            </span>
          </div>

          {/* Action Row Filters */}
          <div className="no-print" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            
            {/* Table Dropdown Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>TABLE:</span>
              <select 
                value={selectedTable} 
                onChange={handleTableChange}
                style={{
                  padding: '0.4rem 1.75rem 0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'white',
                  fontSize: '0.8rem',
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

            {/* Custom Date Range Pickers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'white', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.2rem 0.5rem' }}>
              <Calendar size={14} color="var(--text-muted)" />
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                title="From Date"
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.75rem', color: 'var(--text-main)', width: '110px' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>to</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                title="To Date"
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.75rem', color: 'var(--text-main)', width: '110px' }}
              />
              {(startDate || endDate) && (
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  title="Clear Date Filter"
                >
                  <XCircle size={14} color="var(--text-muted)" />
                </button>
              )}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                placeholder={`Search ${selectedTable}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.4rem 0.75rem 0.4rem 2rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '0.8rem',
                  width: '180px',
                  background: 'rgba(255, 255, 255, 0.7)'
                }}
              />
            </div>

          </div>
        </div>

        {/* Data Table Preview */}
        <div className="print-no-border" style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.2)' }}>
          {loadingTable ? (
            <div style={{ padding: '5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <Loader2 className="animate-spin" size={28} color="var(--primary)" />
              <span style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Processing customized data joints...</span>
            </div>
          ) : filteredData.length > 0 ? (
            <div className="print-full-height" style={{ overflowX: 'auto', maxHeight: '400px' }}>
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
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <Table size={28} style={{ opacity: 0.5 }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>No matching records found in table "{selectedTable}"</span>
              {(searchQuery || startDate || endDate) && <span style={{ fontSize: '0.75rem' }}>Try clearing filters or date ranges.</span>}
            </div>
          )}
        </div>

        {/* Action Description Footer */}
        <div className="no-print" style={{ 
          background: 'rgba(30, 41, 59, 0.02)', 
          border: '1px solid var(--border)', 
          borderRadius: '6px', 
          padding: '0.5rem 0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <ChevronRight size={14} />
          <span><strong>Table Schema Description:</strong> {AVAILABLE_TABLES.find(t => t.key === selectedTable)?.description}</span>
          <span style={{ marginLeft: 'auto' }}>Showing <strong>{filteredData.length}</strong> of <strong>{tableData.length}</strong> records</span>
        </div>
      </div>
    </div>
  );
}
