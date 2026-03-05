import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { path: '/transactions', icon: '◈', label: 'Transactions' },
  { path: '/add-transaction', icon: '⊕', label: 'Add Transaction' },
  { path: '/reports', icon: '◫', label: 'Reports' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 98 }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: collapsed ? '72px' : '260px',
        minHeight: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: mobileOpen ? 0 : undefined,
        zIndex: 99,
        transition: 'width 0.25s ease',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '24px 0' : '28px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--border)',
        }}>
          {!collapsed && (
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                ₹ Interest
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Calculator
              </div>
            </div>
          )}
          {collapsed && <span style={{ fontSize: '22px' }}>₹</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '20px', display: 'flex',
              alignItems: 'center', padding: '4px',
            }}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: collapsed ? '14px 0' : '12px 24px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: active ? '700' : '500',
                  background: active ? 'var(--accent-glow)' : 'transparent',
                  borderRight: active ? '3px solid var(--accent)' : '3px solid transparent',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!active) { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-primary)'; }
                }}
                onMouseLeave={(e) => {
                  if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }
                }}
              >
                <span style={{ fontSize: '20px', lineHeight: 1 }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div style={{
          padding: collapsed ? '16px 0' : '20px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: 'var(--accent)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: '700', fontSize: '15px',
            flexShrink: 0,
          }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--red)', fontSize: '12px', fontFamily: 'Syne, sans-serif',
                  fontWeight: '600', padding: 0,
                }}
              >
                Sign out →
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        marginLeft: collapsed ? '72px' : '260px',
        transition: 'margin-left 0.25s ease',
        minHeight: '100vh',
        padding: '32px',
      }}>
        {/* Mobile hamburger */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: 'none', position: 'fixed', top: '16px', left: '16px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '8px 12px', cursor: 'pointer',
            color: 'var(--text-primary)', zIndex: 97,
          }}
        >
          ☰
        </button>
        <div className="fade-in">{children}</div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          aside { left: ${mobileOpen ? '0' : '-260px'} !important; width: 260px !important; }
          main { margin-left: 0 !important; padding: 20px 16px !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
