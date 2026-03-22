import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRestaurantConfig } from '../hooks/useRestaurantConfig';
import { useAuth } from '../hooks/useAuth';
import { getApiBase } from '../config';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { config } = useRestaurantConfig();
  const { user, logout, isAdmin } = useAuth();
  const serverUrl = getApiBase();

  const handleDisconnect = () => {
    if (confirm('Disconnect from server? You will need to enter the server address again.')) {
      localStorage.removeItem('serverUrl');
      window.location.reload();
    }
  };

  return (
    <>
    {/* Mobile top header with restaurant name */}
    <div className="mobile-top-header">
      <Link to="/" className="mobile-brand-link">
        <span className="logo">{config?.logoEmoji || '\uD83C\uDF7D\uFE0F'}</span>
        <span className="brand-name">{config?.restaurantName || 'Restaurant'}</span>
      </Link>
      <div className="mobile-user-badge">
        <span className={`nav-role-badge ${user?.role}`}>{user?.displayName || user?.username}</span>
      </div>
    </div>
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="logo">{config?.logoEmoji || '\uD83C\uDF7D\uFE0F'}</span>
        <span className="brand-text">
          <span className="brand-name">{config?.restaurantName || 'Restaurant'}</span>
          <span className="brand-subtitle">{config?.subtitle || 'Management System'}</span>
        </span>
      </Link>
      <div className="navbar-links">
        <Link
          to="/"
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          <span className="nav-icon">{'\uD83C\uDF5C'}</span>
          <span>Dashboard</span>
        </Link>
        <Link
          to="/kitchen"
          className={`nav-link ${location.pathname === '/kitchen' ? 'active' : ''}`}
        >
          <span className="nav-icon">{'\uD83D\uDC68\u200D\uD83C\uDF73'}</span>
          <span>Kitchen</span>
        </Link>
        {isAdmin && (
          <Link
            to="/admin"
            className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
          >
            <span className="nav-icon">{'\uD83D\uDEE0\uFE0F'}</span>
            <span>Settings</span>
          </Link>
        )}
        <button
          className="nav-link mobile-only"
          onClick={() => { if (confirm('Are you sure you want to logout?')) { logout(); navigate('/login'); } }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontFamily: 'inherit' }}
        >
          <span className="nav-icon">{'\uD83D\uDEAA'}</span>
          <span>Logout</span>
        </button>
        {serverUrl && (
          <button
            className="nav-link desktop-only"
            onClick={handleDisconnect}
            title={`Connected to ${serverUrl}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span className="nav-icon">{'\uD83D\uDD17'}</span>
            <span>Server</span>
          </button>
        )}
        {user && (
          <>
            <span className="nav-user-info">
              <span className="nav-user-name">{user.displayName || user.username}</span>
              <span className={`nav-role-badge ${user.role}`}>{user.role}</span>
            </span>
            <button
              className="nav-logout-btn"
              onClick={() => { if (confirm('Are you sure you want to logout?')) { logout(); navigate('/login'); } }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
    </>
  );
}
