import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <header className="bar">
        <Link to="/" className="brand dark">Olist Analytics</Link>

        <nav className="tabs">
          <NavLink to="/app" end>Overview</NavLink>
          <NavLink to="/app/sales">Sales</NavLink>
          <NavLink to="/app/delivery">Delivery</NavLink>
          <NavLink to="/app/sellers">Sellers</NavLink>
          {user.role === 'admin' && <NavLink to="/app/admin/new-order">Add order</NavLink>}
        </nav>

        <div className="who">
          <span>{user.email}</span>
          <span className="role">{user.role}</span>
          <button className="btn-quiet" onClick={logout}>Log out</button>
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}