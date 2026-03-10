"use client";
import { useRouter, usePathname } from 'next/navigation';

export default function StudentMasterLayout({ children }) {
  const router   = useRouter();
  const pathname = usePathname();

  const nav = [
    { icon:'🏫', label:'School',     path:'/student/school-dashboard' },
    { icon:'👤', label:'Profile',    path:'/student/profile' },
    { icon:'⭐', label:'Record',     path:'/student/my-performance' },
    { icon:'🔍', label:'Lost+Found', path:'/student/lost-found' },
  ];

  const logout = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div style={{height:'100dvh',display:'flex',flexDirection:'column',overflow:'hidden',background:'#0f0a1e',color:'#fff',fontFamily:'system-ui,sans-serif',fontWeight:900}}>

      {/* TOP HEADER — flex-shrink:0, always visible */}
      <header style={{flexShrink:0,zIndex:100,background:'#0f0a1e',borderBottom:'4px solid #fbbf24',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',cursor:'pointer'}} onClick={()=>router.push('/student')}>
          <div style={{width:'36px',height:'36px',background:'#fbbf24',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',fontWeight:900,flexShrink:0}}>🌟</div>
          <div>
            <p style={{fontWeight:900,fontSize:'13px',color:'#fff',margin:0,textTransform:'uppercase',letterSpacing:'0.05em'}}>Shining Stars</p>
            <p style={{fontSize:'8px',color:'#fbbf24',margin:0,textTransform:'uppercase',letterSpacing:'0.2em'}}>Student Portal</p>
          </div>
        </div>
        <button onClick={logout} style={{background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'10px',padding:'6px 12px',color:'#f87171',fontSize:'10px',fontWeight:900,cursor:'pointer',textTransform:'uppercase',letterSpacing:'0.06em'}}>
          Logout ⏻
        </button>
      </header>

      {/* MAIN — flex:1, sub-pages fill this */}
      <main style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
        {children}
      </main>

      {/* BOTTOM NAV — flex-shrink:0, always visible */}
      <nav style={{flexShrink:0,background:'#0f0a1e',borderTop:'4px solid #fbbf24',display:'flex',justifyContent:'space-around',alignItems:'center',padding:'8px 0',zIndex:110,boxShadow:'0 -4px 20px rgba(0,0,0,0.4)'}}>
        {nav.map(item => {
          const active = pathname===item.path;
          return (
            <button key={item.path} onClick={()=>router.push(item.path)} style={{background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',padding:'4px 8px',opacity:active?1:0.4,transition:'opacity 0.15s'}}>
              <span style={{fontSize:'20px',filter:active?'drop-shadow(0 0 6px #fbbf24)':'grayscale(1)'}}>{item.icon}</span>
              <span style={{fontSize:'8px',fontWeight:900,textTransform:'uppercase',letterSpacing:'0.08em',color:active?'#fbbf24':'#fff'}}>{item.label}</span>
              {active&&<div style={{width:'16px',height:'2px',background:'#fbbf24',borderRadius:'99px'}}/>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}