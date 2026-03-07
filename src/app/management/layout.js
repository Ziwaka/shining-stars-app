"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function MgtUniversalLayout({ children }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
    if (!auth || auth.userRole !== 'management') { router.push('/login'); }
    else setUser(auth);
  }, [router]);

  const navItems = [
    { name:'Dashboard',   path:'/management/mgt-dashboard', icon:'📊' },
    { name:'Leave',       path:'/management/leave',          icon:'📄' },
    { name:'Performance', path:'/management/performance',    icon:'🏆' },
    { name:'Analytics',   path:'/management/analytic',       icon:'📈' },
    { name:'Calendar',    path:'/management/calendar',       icon:'📅' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div style={{ minHeight:'100vh', background:'#f0f9ff', display:'flex', flexDirection:'column', fontFamily:'system-ui,sans-serif', color:'#020617' }}>

      {/* HEADER */}
      <header style={{ position:'sticky', top:0, zIndex:100, background:'#020617', borderBottom:'6px solid #fbbf24', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', boxShadow:'0 4px 20px rgba(0,0,0,0.4)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', flexShrink:0 }} onClick={() => router.push('/management/mgt-dashboard')}>
          <div style={{ width:'36px', height:'36px', background:'#fbbf24', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>🌟</div>
          <div>
            <p style={{ fontWeight:900, fontSize:'13px', color:'#fff', margin:0, textTransform:'uppercase', letterSpacing:'0.05em' }}>Shining Stars</p>
            <p style={{ fontSize:'8px', color:'#fbbf24', margin:0, textTransform:'uppercase', letterSpacing:'0.25em' }}>Management Hub</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ textAlign:'right' }}>
            <p style={{ fontSize:'8px', color:'rgba(255,255,255,0.4)', margin:0, textTransform:'uppercase', letterSpacing:'0.1em' }}>Logged in as</p>
            <p style={{ fontSize:'11px', color:'#fbbf24', fontWeight:900, margin:'1px 0 0', fontStyle:'italic' }}>{user?.Name || user?.name || 'Admin'}</p>
          </div>
          <button onClick={handleLogout}
            style={{ background:'#dc2626', color:'#fff', border:'none', borderRadius:'10px', padding:'7px 12px', fontSize:'10px', fontWeight:900, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'3px solid #991b1b' }}>
            Logout ⏻
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main style={{ flex:1, width:'100%', paddingBottom:'80px' }}>{children}</main>

      {/* BOTTOM NAV */}
      <nav style={{ position:'fixed', bottom:0, left:0, width:'100%', background:'#020617', borderTop:'6px solid #fbbf24', display:'flex', justifyContent:'space-around', alignItems:'center', padding:'8px 0 10px', zIndex:110, boxSizing:'border-box' }}>
        {navItems.map(item => {
          const active = pathname.startsWith(item.path);
          return (
            <button key={item.path} onClick={() => router.push(item.path)}
              style={{ background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'4px 6px', opacity:active?1:0.4, transition:'opacity 0.15s', minWidth:'52px' }}>
              <span style={{ fontSize:'20px', filter:active?'drop-shadow(0 0 8px #fbbf24)':'grayscale(1)' }}>{item.icon}</span>
              <span style={{ fontSize:'7px', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.06em', color:active?'#fbbf24':'#fff', whiteSpace:'nowrap' }}>{item.name}</span>
              {active && <div style={{ width:'14px', height:'2px', background:'#fbbf24', borderRadius:'99px' }}/>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}