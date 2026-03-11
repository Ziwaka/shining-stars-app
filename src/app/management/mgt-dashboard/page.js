"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

// ── Design tokens — matches management layout ─────────────────────────────────
const C = {
  bg      : '#0F0E1A',
  surf    : '#1A1830',
  surf2   : '#221F38',
  border  : 'rgba(158,158,202,0.15)',
  lav     : '#9E9ECA',
  lavDark : '#6B6BA8',
  ink     : '#E2E2F0',
  muted   : 'rgba(226,226,240,0.45)',
  faint   : 'rgba(226,226,240,0.20)',
  gold    : '#FCD34D',
  green   : '#34D399',
  red     : '#F87171',
  blue    : '#93C5FD',
  shadow  : '0 2px 12px rgba(0,0,0,0.30)',
  shadowL : '0 6px 24px rgba(0,0,0,0.40)',
};

const TOOLS = [
  // Student & Campus
  { name:'Student Dir',    path:'/staff/student-dir',              icon:'🎓', color:'#A5B4FC' },
  { name:'Hostel',         path:'/staff/hostel',                   icon:'🏠', color:'#6EE7B7' },
  { name:'House Points',   path:'/staff/points',                   icon:'⭐', color:'#FCD34D' },
  { name:'Registry Notes', path:'/staff/notes',                    icon:'📒', color:'#93C5FD' },
  // Staff & Finance
  { name:'Staff Dir',      path:'/staff/staff-dir',                icon:'👔', color:'#C4B5FD' },
  { name:'Fees',           path:'/staff/fees',                     icon:'💰', color:'#6EE7B7' },
  { name:'Performance',    path:'/management/performance',          icon:'🏆', color:'#FCD34D' },
  { name:'Analytics',      path:'/management/analytic',            icon:'📈', color:'#93C5FD' },
  // Operations
  { name:'Leave Hub',      path:'/management/leave',               icon:'📄', color:'#FCA5A5' },
  { name:'Calendar',       path:'/management/calendar',            icon:'📅', color:'#A5B4FC' },
  { name:'Inventory',      path:'/management/inventory',           icon:'📦', color:'#FDE68A' },
  { name:'Communicate',    path:'/management/communication',       icon:'📢', color:'#6EE7B7' },
  { name:'Permissions',    path:'/management/staff-permissions',   icon:'🔐', color:'#C4B5FD' },
  { name:'Photo Upload',   path:'/management/photo-upload',        icon:'📸', color:'#93C5FD' },
];

export default function ManagementDashboard() {
  const router = useRouter();
  const [user,         setUser]    = useState(null);
  const [stats,        setStats]   = useState({ totalS:0, male:0, female:0, pendingL:0 });
  const [pendingLeaves,setPending] = useState([]);
  const [loading,      setLoading] = useState(true);
  const [hovered,      setHovered] = useState(null);

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
    if (!auth || auth.userRole !== 'management') { router.push('/login'); return; }
    setUser(auth);

    fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getInitialData' }) })
      .then(r => r.json())
      .then(res => {
        if (!res.success) return;
        const students = res.students || [];
        const leaves   = res.leaves   || [];
        const active = students.filter(s =>
          s.Status === true || String(s.Status).toUpperCase() === 'TRUE'
        );
        setStats({
          totalS  : active.length,
          male    : active.filter(x => ['M','MALE','ကျား'].includes(String(x.Sex||'').toUpperCase())).length,
          female  : active.filter(x => ['F','FEMALE','မ'].includes(String(x.Sex||'').toUpperCase())).length,
          pendingL: leaves.filter(l => l.Status === 'Pending').length,
        });
        setPending(leaves.filter(l => l.Status === 'Pending').slice(0, 4));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayName = user?.Name || user?.name || user?.['Name (ALL CAPITAL)'] || user?.username || 'Admin';

  const STATS = [
    { label:'Students', value:stats.totalS, icon:'🎓', accent:C.lav,   click:null },
    { label:'Male',     value:stats.male,   icon:'👦', accent:C.blue,  click:null },
    { label:'Female',   value:stats.female, icon:'👧', accent:'#F9A8D4', click:null },
    { label:'Pending Leaves', value:stats.pendingL, icon:'⏳', accent:C.gold,
      click:() => router.push('/management/leave') },
  ];

  return (
    <div style={{
      flex:1, display:'flex', flexDirection:'column',
      background:C.bg, color:C.ink,
      fontFamily:"'DM Sans', system-ui, sans-serif",
      overflowY:'auto', WebkitOverflowScrolling:'touch',
      paddingBottom:'24px',
    }}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        * { box-sizing: border-box }
        .tool-btn { transition: background 0.15s, transform 0.12s, box-shadow 0.12s }
        .tool-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.40) }
        .stat-btn { transition: transform 0.12s, box-shadow 0.12s }
        .stat-btn:hover { transform: translateY(-1px) }
      `}</style>

      {/* ── Welcome strip ── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.surf} 0%, ${C.surf2} 100%)`,
        borderBottom: `1px solid ${C.border}`,
        padding: '20px 20px 18px',
        animation: 'fadeUp 0.4s ease',
      }}>
        <div style={{ maxWidth:'640px', margin:'0 auto' }}>
          {loading ? (
            <div style={{ height:'44px', display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'20px', height:'20px',
                border:`2px solid ${C.border}`, borderTop:`2px solid ${C.lav}`,
                borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
              <span style={{ color:C.faint, fontSize:'12px' }}>Loading...</span>
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
              <div>
                <p style={{ fontSize:'9px', color:C.muted, textTransform:'uppercase',
                            letterSpacing:'0.20em', margin:'0 0 4px', fontWeight:600 }}>
                  Management Hub
                </p>
                <h1 style={{ fontSize:'20px', fontWeight:800, color:C.ink,
                             margin:'0 0 2px', letterSpacing:'0.01em' }}>
                  {displayName}
                </h1>
                <p style={{ fontSize:'10px', color:C.lav, margin:0, fontWeight:600 }}>
                  Shining Stars - Ma Thwe &nbsp;·&nbsp; Full Authority
                </p>
              </div>
              {/* Live date */}
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <p style={{ fontSize:'11px', color:C.lav, margin:'0 0 2px', fontWeight:700 }}>
                  {new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
                </p>
                <p style={{ fontSize:'9px', color:C.faint, margin:0, textTransform:'uppercase',
                            letterSpacing:'0.08em' }}>
                  {new Date().toLocaleDateString('en-GB',{weekday:'long'})}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth:'640px', margin:'0 auto', padding:'16px',
                    width:'100%', display:'flex', flexDirection:'column', gap:'16px' }}>

        {/* ── Stats row ── */}
        {!loading && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px' }}>
            {STATS.map((s, i) => (
              <button key={i} className="stat-btn"
                onClick={s.click || undefined}
                style={{
                  background : C.surf,
                  border     : `1px solid ${C.border}`,
                  borderTop  : `3px solid ${s.accent}`,
                  borderRadius: '14px',
                  padding    : '12px 8px 10px',
                  cursor     : s.click ? 'pointer' : 'default',
                  textAlign  : 'center',
                  boxShadow  : C.shadow,
                }}>
                <div style={{ fontSize:'18px', marginBottom:'4px' }}>{s.icon}</div>
                <div style={{ fontSize:'20px', fontWeight:800, color:s.accent, lineHeight:1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize:'8px', color:C.muted, textTransform:'uppercase',
                              letterSpacing:'0.08em', marginTop:'4px', fontWeight:600,
                              lineHeight:1.3 }}>
                  {s.label}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Pending leaves quick view ── */}
        {!loading && pendingLeaves.length > 0 && (
          <div style={{
            background:C.surf, border:`1px solid ${C.border}`,
            borderLeft:`3px solid ${C.gold}`,
            borderRadius:'14px', overflow:'hidden',
            boxShadow:C.shadow,
          }}>
            {/* Header */}
            <div style={{
              padding:'10px 14px',
              borderBottom:`1px solid ${C.border}`,
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:'13px' }}>⏳</span>
                <span style={{ fontSize:'10px', fontWeight:800, color:C.gold,
                               textTransform:'uppercase', letterSpacing:'0.1em' }}>
                  Pending Leaves
                </span>
                <span style={{
                  background:C.gold, color:C.bg, fontSize:'8px',
                  fontWeight:800, padding:'1px 7px', borderRadius:'99px',
                }}>
                  {stats.pendingL}
                </span>
              </div>
              <button onClick={() => router.push('/management/leave')}
                style={{ background:'none', border:'none', cursor:'pointer',
                         fontSize:'9px', color:C.lav, fontWeight:700,
                         textTransform:'uppercase', letterSpacing:'0.08em' }}>
                View All →
              </button>
            </div>
            {/* Rows */}
            {pendingLeaves.map((l, i) => (
              <div key={i} style={{
                padding:'9px 14px',
                borderBottom: i < pendingLeaves.length-1 ? `1px solid ${C.border}` : 'none',
                display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px',
              }}>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontWeight:700, fontSize:'12px', color:C.ink,
                               margin:'0 0 1px', whiteSpace:'nowrap',
                               overflow:'hidden', textOverflow:'ellipsis' }}>
                    {l.Name}
                  </p>
                  <p style={{ fontSize:'9px', color:C.muted, margin:0 }}>
                    {l.Leave_Type} · {l.Start_Date}
                  </p>
                </div>
                <span style={{
                  flexShrink:0, fontSize:'8px', padding:'2px 9px',
                  borderRadius:'99px', fontWeight:700,
                  background:'rgba(252,211,77,0.12)', color:C.gold,
                  textTransform:'uppercase', letterSpacing:'0.06em',
                }}>
                  Pending
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Tools grid ── */}
        <div>
          <p style={{ fontSize:'9px', color:C.muted, textTransform:'uppercase',
                      letterSpacing:'0.18em', fontWeight:700, margin:'0 0 10px' }}>
            Quick Access
          </p>
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))',
            gap:'8px',
          }}>
            {TOOLS.map((t, i) => (
              <button key={i} className="tool-btn"
                onClick={() => router.push(t.path)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background   : hovered === i ? C.surf2 : C.surf,
                  border       : `1px solid ${hovered === i
                                    ? t.color+'55'
                                    : C.border}`,
                  borderRadius : '16px',
                  padding      : '14px 8px 12px',
                  cursor       : 'pointer',
                  display      : 'flex',
                  flexDirection: 'column',
                  alignItems   : 'center',
                  gap          : '7px',
                  boxShadow    : C.shadow,
                }}>
                <div style={{
                  width:'38px', height:'38px',
                  background:`${t.color}18`,
                  borderRadius:'12px',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'20px',
                }}>
                  {t.icon}
                </div>
                <span style={{
                  fontSize:'9px', fontWeight:700, color:C.muted,
                  textAlign:'center', lineHeight:1.3,
                  textTransform:'uppercase', letterSpacing:'0.04em',
                }}>
                  {t.name}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}