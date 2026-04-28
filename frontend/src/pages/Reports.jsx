import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import api from '../api';

export default function Reports() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const res = await api.get('/reports/summary');
      setReportData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) return;

    // Get headers
    const headers = Object.keys(reportData[0]);
    
    // Create CSV rows
    const csvRows = [];
    csvRows.push(headers.join(',')); // Add header row

    for (const row of reportData) {
      const values = headers.map(header => {
        const val = row[header];
        // Escape quotes and wrap in quotes to handle commas in data
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `NAAM_Budget_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Reports & Analytics</h1>
        <button className="btn btn-primary" onClick={handleExportCSV} disabled={reportData.length === 0}>
          <Download size={18} /> Export CSV (Tally Ready)
        </button>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <FileSpreadsheet size={18} color="var(--primary)" />
          <span style={{ fontWeight: 500 }}>Master Project Budget Report</span>
        </div>
        
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading report data...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th>Project ID</th>
                  <th>Name</th>
                  <th>Source</th>
                  <th>Funding Entity</th>
                  <th>Total Budget</th>
                  <th>Utilized</th>
                  <th>Remaining</th>
                  <th>% Used</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{row.Project_ID}</td>
                    <td>{row.Name}</td>
                    <td><span className="badge badge-warning">{row.Source}</span></td>
                    <td>{row.Funding_Entity || 'N/A'}</td>
                    <td>₹{row.Total_Budget.toLocaleString()}</td>
                    <td>₹{row.Budget_Utilized.toLocaleString()}</td>
                    <td style={{ color: row.Remaining_Budget < (row.Total_Budget * 0.2) ? 'var(--danger)' : 'inherit' }}>
                      ₹{row.Remaining_Budget.toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '50px', height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px' }}>
                          <div style={{ width: row.Utilized_Percentage, height: '100%', background: 'var(--primary)', borderRadius: '3px' }}></div>
                        </div>
                        <span style={{ fontSize: '0.8rem' }}>{row.Utilized_Percentage}</span>
                      </div>
                    </td>
                    <td>{row.Status}</td>
                  </tr>
                ))}
                {reportData.length === 0 && <tr><td colSpan="9" style={{textAlign:'center'}}>No data available to report.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
