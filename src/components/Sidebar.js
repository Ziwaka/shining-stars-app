"use client";
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

// ══════════════════════════════════════════════════════════════
//  Shining Stars — Staff Layout  (Mobile Responsive v2)
//
//  Mobile  (<768px) : Bottom navigation bar  (management style)
//  Desktop (≥768px) : Side navigation bar    (original style)
//
//  ပြင်ဆင်ချက် — Sidebar w-80 က mobile မှာ ကျိုးတာကို fix
// ══════════════════════════════════════════════════════════════

export default function DashboardLayout({ children }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Detect mobile on mount + resize
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close sidebar when route changes (mobile)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    router.push("/login");
  };

  // Bottom nav items (mobile) — keep concise, max 5
  const bottomNav = [
    { name: 'Home',    path: '/staff',           icon: '🏠' },
    { name: 'Profile', path: '/staff/profile',   icon: '👤' },
    { name: 'Leave',   path: '/staff/leave',     icon: '🗓️' },
    { name: 'Students',path: '/staff/student-dir',icon: '🎓' },
    { name: 'Staff',   path: '/staff/staff-dir', icon: '👔' },
  ];

  // Sidebar items (desktop) — full list
  const menuItems = [
    { name: 'Staff Home',       path: '/staff',              icon: '🏠' },
    { name: 'My Profile',       path: '/staff/profile',      icon: '👤' },
    { name: 'Leave Hub',        path: '/staff/leave',        icon: '🗓️' },
    { name: 'Staff Directory',  path: '/staff/staff-dir',    icon: '👔' },
    { name: 'Student Directory',path: '/staff/student-dir',  icon: '🎓' },
  ];

  // ── MOBILE LAYOUT ─────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{
        height: '100dvh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', background: '#F8FAFC',
        color: '#020617', fontFamily: 'system-ui,sans-serif',
      }}>

        {/* Mobile Header */}
        <header style={{
          flexShrink: 0, zIndex: 100,
          background: '#1E3A8A',
          borderBottom: '3px solid #fbbf24',
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 3px 16px rgba(0,0,0,0.25)',
        }}>
          {/* Logo */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            onClick={() => router.push('/staff')}
          >
            <div style={{
              background: 'white', padding: '6px 8px',
              borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}>
              <span style={{ fontSize: 18, color: '#1E3A8A' }}>⭐</span>
            </div>
            <div style={{ lineHeight: 1 }}>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 800, margin: 0, letterSpacing: '0.04em' }}>
                SHINING STARS
              </p>
              <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.55)', margin: '2px 0 0',
                          textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700 }}>
                Staff Portal
              </p>
            </div>
          </div>

          {/* Logout */}
          <button onClick={handleLogout} style={{
            padding: '7px 13px',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff', fontSize: 10, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            borderRadius: 10, cursor: 'pointer',
          }}>
            Logout ⏻
          </button>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav style={{
          flexShrink: 0,
          background: '#1E3A8A',
          borderTop: '3px solid #fbbf24',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          padding: '6px 0 10px', zIndex: 110,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.25)',
        }}>
          {bottomNav.map(item => {
            const isActive = item.path === '/staff'
              ? pathname === '/staff'
              : pathname.startsWith(item.path);

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 3, padding: '4px 8px',
                  opacity: isActive ? 1 : 0.45,
                  transform: isActive ? 'translateY(-2px)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{
                  fontSize: 20,
                  filter: isActive ? 'drop-shadow(0 0 6px rgba(251,191,36,0.8))' : 'none',
                }}>
                  {item.icon}
                </span>
                <span style={{
                  fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.05em',
                  fontWeight: 800,
                  color: isActive ? '#fbbf24' : 'rgba(255,255,255,0.6)',
                }}>
                  {item.name}
                </span>
                {isActive && (
                  <div style={{
                    width: 18, height: 2.5,
                    background: '#fbbf24', borderRadius: 99,
                    boxShadow: '0 0 6px rgba(251,191,36,0.6)',
                  }} />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  // ── DESKTOP LAYOUT (original sidebar, improved) ───────────
  return (
    <div style={{
      display: 'flex', minHeight: '100dvh',
      background: '#F8FAFC', fontFamily: 'system-ui,sans-serif',
    }}>

      {/* Desktop Sidebar */}
      <aside style={{
        width: 280, background: '#1E3A8A', color: 'white',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100dvh',
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        borderRight: '4px solid #020617', zIndex: 50,
        flexShrink: 0,
      }}>

        {/* Logo */}
        <div style={{
          padding: '32px 24px 24px', borderBottom: '2px solid rgba(255,255,255,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            background: 'white', padding: '16px 18px',
            borderRadius: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            transform: 'rotate(3deg)',
          }}>
            <span style={{ fontSize: 28, color: '#1E3A8A' }}>⭐</span>
          </div>
          <h2 style={{
            fontSize: 18, fontWeight: 900, textTransform: 'uppercase',
            fontStyle: 'italic', letterSpacing: '-0.02em', margin: '8px 0 0',
            textAlign: 'center',
          }}>
            SHINING STARS
          </h2>
          <p style={{
            fontSize: 9, color: 'rgba(255,255,255,0.45)', margin: 0,
            textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 700,
          }}>
            Staff Portal
          </p>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {menuItems.map(item => {
            const isActive = item.path === '/staff'
              ? pathname === '/staff'
              : pathname.startsWith(item.path);

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 14, padding: '13px 20px',
                  borderRadius: '1.5rem', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: '0.06em', transition: 'all 0.2s',
                  background: isActive ? '#fff' : 'transparent',
                  color: isActive ? '#1E3A8A' : 'rgba(255,255,255,0.65)',
                  boxShadow: isActive ? '0 8px 24px rgba(0,0,0,0.15)' : 'none',
                  transform: isActive ? 'scale(1.02)' : 'none',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                  }
                }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px', borderTop: '2px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: 14, padding: '13px 20px',
              borderRadius: '1.5rem', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.06em', transition: 'all 0.2s',
              background: 'transparent',
              color: 'rgba(255,255,255,0.45)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
            }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {children}
      </main>
    </div>
  );
}
