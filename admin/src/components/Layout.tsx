import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/users', label: 'Users' },
  { to: '/documents', label: 'Documents' },
  { to: '/vehicles', label: 'Vehicles' },
  { to: '/requests', label: 'Requests' },
];

export function Layout(): React.JSX.Element {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          🚐 <span>VTC Admin</span>
        </div>
        <nav>
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <button
          className="btn ghost logout"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Log out
        </button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
