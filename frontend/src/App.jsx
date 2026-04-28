import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, FileText, Settings, LogOut, Building, Landmark, FileSpreadsheet, FileCheck2 } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Vendors from './pages/Vendors';
import Invoices from './pages/Invoices';
import CsrManagement from './pages/CsrManagement';
import GovtSchemes from './pages/GovtSchemes';
import Reports from './pages/Reports';
import WccManagement from './pages/WccManagement';
import Donors from './pages/Donors';
import Login from './pages/Login';

function Sidebar({ onLogout }) {
  const location = useLocation();
  
  return (
    <div className="sidebar glass-panel" style={{ borderRadius: 0, borderTop: 0, borderBottom: 0, borderLeft: 0 }}>
      <div className="logo">
        <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          N
        </div>
        NAAM
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          <LayoutDashboard size={20} /> Dashboard
        </Link>
        <Link to="/projects" className={`nav-link ${location.pathname === '/projects' ? 'active' : ''}`}>
          <FolderKanban size={20} /> Projects
        </Link>
        <Link to="/vendors" className={`nav-link ${location.pathname === '/vendors' ? 'active' : ''}`}>
          <Users size={20} /> Vendors
        </Link>
        <Link to="/wcc" className={`nav-link ${location.pathname === '/wcc' ? 'active' : ''}`}>
          <FileCheck2 size={20} /> WCC Approvals
        </Link>
        <Link to="/invoices" className={`nav-link ${location.pathname === '/invoices' ? 'active' : ''}`}>
          <FileText size={20} /> Invoices
        </Link>
        <Link to="/csr" className={`nav-link ${location.pathname === '/csr' ? 'active' : ''}`}>
          <Building size={20} /> CSR Partners
        </Link>
        <Link to="/donors" className={`nav-link ${location.pathname === '/donors' ? 'active' : ''}`}>
          <Users size={20} /> Individual Donors
        </Link>
        <Link to="/govt" className={`nav-link ${location.pathname === '/govt' ? 'active' : ''}`}>
          <Landmark size={20} /> Govt Schemes
        </Link>
        <Link to="/reports" className={`nav-link ${location.pathname === '/reports' ? 'active' : ''}`}>
          <FileSpreadsheet size={20} /> Reports
        </Link>
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Link to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
          <Settings size={20} /> Settings
        </Link>
        <button onClick={onLogout} className="nav-link" style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', color: 'var(--danger)' }}>
          <LogOut size={20} /> Logout
        </button>
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('naam_token');
    if (token) setIsAuthenticated(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('naam_token');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/wcc" element={<WccManagement />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/csr" element={<CsrManagement />} />
          <Route path="/donors" element={<Donors />} />
          <Route path="/govt" element={<GovtSchemes />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
