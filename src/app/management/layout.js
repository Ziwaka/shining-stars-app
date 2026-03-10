"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function MgtUniversalLayout({ children }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || "null");
    if (!auth || auth.userRole !== 'management') {
      router.push('/login');
    } else {
      setUser(auth);
    }
  }, [router]);

  const navItems = [
    { name: 'Dashboard',   path: '/management/mgt-dashboard', icon: '📊' },
    { name: 'Leave Hub',   path: '/management/leave',         icon: '📄' },
    { name: 'Calendar',    path: '/management/calendar',      icon: '📅' },
    { name: 'Performance', path: '/management/performance',   icon: '🏆' },
    { name: 'Analytics',   path: '/management/analytic',      icon: '📈' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div style={{height:'100dvh',display:'flex',flexDirection:'column',overflow:'hidden',background:'#020617',color:'#fff',fontFamily:'system-ui,sans-serif',fontWeight:900}}>

      {/* TOP HEADER — flex-shrink:0, always visible, no position needed */}
      <header style={{flexShrink:0,zIndex:100,background:'#020617',borderBottom:'6px solid #fbbf24',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 4px 24px rgba(0,0,0,0.4)'}}>
        <Link href="/management/mgt-dashboard" style={{display:'flex',alignItems:'center',gap:'10px',textDecoration:'none'}}>
          <div style={{width:'36px',height:'36px',background:'#fbbf24',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',flexShrink:0}}>🌟</div>
          <div style={{lineHeight:1}}>
            <p style={{color:'#fff',fontSize:'13px',fontWeight:900,margin:0,textTransform:'uppercase',letterSpacing:'0.05em',fontStyle:'italic'}}>Shining Stars</p>
            <p style={{color:'#fbbf24',fontSize:'8px',margin:'2px 0 0',textTransform:'uppercase',letterSpacing:'0.3em',fontWeight:900}}>Management Hub</p>
          </div>
        </Link>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',lineHeight:1}}>
            <span style={{fontSize:'8px',color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Logged in as</span>
            <span style={{fontSize:'11px',color:'#fbbf24',fontWeight:900,fontStyle:'italic',marginTop:'2px'}}>
              {user?.Name||user?.name||user?.username||user?.['Name (ALL CAPITAL)']||'Admin'}
            </span>
          </div>
          <button onClick={handleLogout} style={{padding:'7px 14px',background:'#dc2626',color:'#fff',fontSize:'9px',fontWeight:900,textTransform:'uppercase',letterSpacing:'0.08em',border:'none',borderRadius:'10px',borderBottom:'3px solid #991b1b',cursor:'pointer'}}>
            Logout ⏻
          </button>
        </div>
      </header>

      {/* MAIN — flex:1, children fill this, overflow:hidden so sub-pages control their own scroll */}
      <main style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
        {children}
      </main>

      {/* BOTTOM NAV — flex-shrink:0, always visible, no position needed */}
      <nav style={{flexShrink:0,background:'#020617',borderTop:'6px solid #fbbf24',display:'flex',justifyContent:'space-around',alignItems:'center',padding:'6px 0 8px',zIndex:110,boxShadow:'0 -8px 32px rgba(0,0,0,0.4)'}}>
        {navItems.map((item) => {
          const isActive = pathname===item.path || (item.path!=='/management/mgt-dashboard' && pathname.startsWith(item.path));
          return (
            <Link key={item.path} href={item.path} style={{textDecoration:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',padding:'4px 10px',opacity:isActive?1:0.4,transition:'opacity 0.15s',transform:isActive?'scale(1.1)':'scale(1)'}}>
              <span style={{fontSize:'22px',filter:isActive?'drop-shadow(0 0 8px #fbbf24)':'grayscale(1)'}}>{item.icon}</span>
              <span style={{fontSize:'8px',textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:900,color:isActive?'#fbbf24':'#fff'}}>{item.name}</span>
              {isActive&&<div style={{width:'16px',height:'2px',background:'#fbbf24',borderRadius:'99px'}}/>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}