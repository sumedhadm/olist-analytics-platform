import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="page">
      <header className="topbar">
        <h2>Olist Analytics</h2>
        <div>
          <span className="muted">{user.email} ({user.role})</span>
          <button className="ghost" onClick={logout}>Log out</button>
        </div>
      </header>

      <nav className="nav">
        <NavLink to="/" end>Overview</NavLink>
        <NavLink to="/sales">Sales</NavLink>
        <NavLink to="/delivery">Delivery</NavLink>
        <NavLink to="/sellers">Sellers</NavLink>
        {user.role === 'admin' && <NavLink to="/admin/new-order">Add order</NavLink>}
      </nav>

      <Outlet />
    </div>
  );
}