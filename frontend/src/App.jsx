import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, FileText, Settings as SettingsIcon, LogOut, Building, Landmark, FileSpreadsheet, FileCheck2, Receipt } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Vendors from './pages/Vendors';
import Invoices from './pages/Invoices';
import CsrManagement from './pages/CsrManagement';
import GovtSchemes from './pages/GovtSchemes';
import Reports from './pages/Reports';
import WorkOrders from './pages/WorkOrders';
import PurchaseOrders from './pages/PurchaseOrders';
import ProjectDetails from './pages/ProjectDetails';
import Donors from './pages/Donors';
import Login from './pages/Login';
import Settings from './pages/Settings';
import ResetPassword from './pages/ResetPassword';
import Finance from './pages/Finance';

function Sidebar({ onLogout }) {
  const location = useLocation();
  const [userRole, setUserRole] = useState('Operator');

  useEffect(() => {
    const token = localStorage.getItem('naam_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || 'Operator');
      } catch (e) {
        console.error(e);
      }
    }
  }, [location]);
  
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
        <Link to="/projects" className={`nav-link ${location.pathname === '/projects' ? 'active' : '' || location.pathname.startsWith('/projects/')}`}>
          <FolderKanban size={20} /> Projects
        </Link>
        <Link to="/vendors" className={`nav-link ${location.pathname === '/vendors' ? 'active' : ''}`}>
          <Users size={20} /> Vendors
        </Link>
        <Link to="/work-orders" className={`nav-link ${location.pathname === '/work-orders' ? 'active' : ''}`}>
          <FileCheck2 size={20} /> Work Orders
        </Link>
        <Link to="/purchase-orders" className={`nav-link ${location.pathname === '/purchase-orders' ? 'active' : ''}`}>
          <Receipt size={20} /> Purchase Orders
        </Link>
        <Link to="/invoices" className={`nav-link ${location.pathname === '/invoices' ? 'active' : ''}`}>
          <FileText size={20} /> Invoices
        </Link>
        {(userRole === 'Admin' || userRole === 'Manager') && (
          <Link to="/finance" className={`nav-link ${location.pathname === '/finance' ? 'active' : ''}`}>
            <Landmark size={20} /> Finance
          </Link>
        )}
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
        {userRole === 'Admin' && (
          <Link to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
            <SettingsIcon size={20} /> Settings
          </Link>
        )}
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

  const isResetPage = window.location.pathname === '/reset-password';

  if (!isAuthenticated && !isResetPage) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <Router>
      {isResetPage ? (
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      ) : (
        <div className="app-container">
          <Sidebar onLogout={handleLogout} />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/work-orders" element={<WorkOrders />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/csr" element={<CsrManagement />} />
            <Route path="/donors" element={<Donors />} />
            <Route path="/govt" element={<GovtSchemes />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      )}
    </Router>
  );
}

export default App;
