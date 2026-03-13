"use client";
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

const TOOL_SECTIONS = [
  {
    label: 'Students & Campus',
    tools: [
      { name:'Student Directory', path:'/staff/student-dir',           desc:'View & manage students', bg:'linear-gradient(135deg,#EEF2FF,#C7D2FE)', icon:'🎓' },
      { name:'Hostel',            path:'/staff/hostel',                desc:'Hostel management',      bg:'linear-gradient(135deg,#F0FDF4,#BBF7D0)', icon:'🏠' },
      { name:'House Points',      path:'/staff/points',                desc:'Award & track points',   bg:'linear-gradient(135deg,#FFFBEB,#FDE68A)', icon:'⭐' },
      { name:'Registry Notes',   path:'/staff/notes',                  desc:'Student notes log',      bg:'linear-gradient(135deg,#F0F9FF,#BAE6FD)', icon:'📒' },
    ],
  },
  {
    label: 'Staff & Finance',
    tools: [
      { name:'Staff Directory',  path:'/staff/staff-dir',              desc:'All staff records',      bg:'linear-gradient(135deg,#FDF4FF,#E9D5FF)', icon:'👔' },
      { name:'Fee Collection',   path:'/staff/fees',                   desc:'Record fee payments',    bg:'linear-gradient(135deg,#F0FDF4,#A7F3D0)', icon:'💰' },
      { name:'Performance',      path:'/management/performance',       desc:'Exam results & ranks',   bg:'linear-gradient(135deg,#FFFBEB,#FCD34D)', icon:'🏆' },
      { name:'Analytics',        path:'/management/analytic',          desc:'School-wide data',       bg:'linear-gradient(135deg,#EFF6FF,#BFDBFE)', icon:'📈' },
    ],
  },
  {
    label: 'Operations',
    tools: [
      { name:'Leave Hub',        path:'/management/leave',             desc:'Leave approvals',        bg:'linear-gradient(135deg,#FFF1F2,#FECDD3)', icon:'📄' },
      { name:'Calendar',         path:'/management/calendar',          desc:'Events & timetable',     bg:'linear-gradient(135deg,#EEF2FF,#C7D2FE)', icon:'📅' },
      { name:'Inventory',        path:'/staff/inventory',              desc:'Stock & assets',         bg:'linear-gradient(135deg,#FEFCE8,#FEF08A)', icon:'📦' },
      { name:'Communication',    path:'/management/communication',     desc:'Announcements',          bg:'linear-gradient(135deg,#F0FDF4,#BBF7D0)', icon:'📢' },
      { name:'Permissions',      path:'/management/staff-permissions', desc:'Staff access control',   bg:'linear-gradient(135deg,#FDF4FF,#E9D5FF)', icon:'🔐' },
      { name:'Photo Upload',     path:'/management/photo-upload',      desc:'Student photos',         bg:'linear-gradient(135deg,#F0F9FF,#BAE6FD)', icon:'📸' },
    ],
  },
];

export default function ManagementDashboard() {
  const router = useRouter();
  const [user,    setUser]   = useState(null);
  const [loading, setLoading]= useState(true);
  const [dash,    setDash]   = useState(null);

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
    if (!auth || auth.userRole !== 'management') { router.push('/login'); return; }
    setUser(auth);

    fetch(WEB_APP_URL, { method:'POST', body:JSON.stringify({ action:'getDashboardData' }) })
      .then(r => r.json())
      .then(res => { if (res.success) setDash(res); })
      .catch(e => console.error('getDashboardData error:', e))
      .finally(() => setLoading(false));
  }, []);

  // ── Attendance ────────────────────────────────────────────────
  const [att,        setAtt]        = useState(null);
  const [attLoading, setAttLoading] = useState(true);
  const todayMM = new Date().toLocaleDateString('en-CA', { timeZone:'Asia/Yangon' });

  const fetchAttendance = useCallback(() => {
    setAttLoading(true);
    fetch(WEB_APP_URL, { method:'POST', body:JSON.stringify({ action:'getAttendance', date:todayMM }) })
      .then(r => r.json())
      .then(res => { if (res.success) setAtt(res); })
      .catch(e => console.error('attendance error:', e))
      .finally(() => setAttLoading(false));
  }, [todayMM]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const name     = user?.Name || user?.name || user?.['Name (ALL CAPITAL)'] || user?.username || 'Admin';
  const dateStr  = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const totalS      = dash?.totalS      || 0;
  const male        = dash?.male        || 0;
  const female      = dash?.female      || 0;
  const events      = dash?.events      || [];
  const leaderboard = dash?.leaderboard || [];
  const leaves      = dash?.leaves      || [];
  const pendingL    = dash?.pendingL    || 0;

  const maleW   = totalS > 0 ? Math.round(male   / totalS * 100) : 50;
  const femaleW = totalS > 0 ? Math.round(female  / totalS * 100) : 50;
  const maxPts  = leaderboard[0]?.total || 1;

  return (
    <div style={{ flex:1, overflowY:'auto', background:'#F5F3EE', WebkitOverflowScrolling:'touch', paddingBottom:'40px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin   { to { transform:rotate(360deg) } }
        * { box-sizing:border-box; margin:0; padding:0; }
        .tool-card { transition:transform 0.15s, box-shadow 0.15s; cursor:pointer; }
        .tool-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,0.13) !important; }
        .leave-row:hover { background:#FFFBF0 !important; }
        ::-webkit-scrollbar { width:3px }
        ::-webkit-scrollbar-thumb { background:rgba(0,0,0,0.1); border-radius:99px }
      `}</style>

      {/* ── HERO ── */}
      <div style={{ background:'linear-gradient(150deg,#0D0C22 0%,#1A1845 55%,#0E1F3D 100%)',
                    padding:'28px 20px 52px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', bottom:-1, left:0, right:0, height:32,
                      background:'#F5F3EE', borderRadius:'32px 32px 0 0' }}/>
        <div style={{ position:'absolute', top:-70, right:-70, width:240, height:240,
                      borderRadius:'50%', border:'1px solid rgba(212,175,55,0.10)', pointerEvents:'none' }}/>

        <div style={{ maxWidth:500, margin:'0 auto', position:'relative', zIndex:1,
                      fontFamily:"'DM Sans',system-ui,sans-serif" }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
            <div style={{ width:60, height:60, borderRadius:16,
                          background:'linear-gradient(135deg,#D4AF37,#F0D060)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:30, boxShadow:'0 6px 20px rgba(212,175,55,0.4)', flexShrink:0 }}>🏫</div>
            <div>
              <p style={{ fontSize:9, color:'rgba(212,175,55,0.65)', textTransform:'uppercase',
                          letterSpacing:'0.2em', fontWeight:600, marginBottom:3 }}>
                Shining Stars - Ma Thwe
              </p>
              {loading
                ? <div style={{ width:140, height:22, borderRadius:6, background:'rgba(255,255,255,0.08)' }}/>
                : <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700,
                              color:'#fff', lineHeight:1.2 }}>{name}</p>
              }
              <p style={{ fontSize:9, color:'rgba(255,255,255,0.28)', marginTop:3, letterSpacing:'0.06em' }}>
                Full Administrative Authority
              </p>
            </div>
          </div>

          <div style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(212,175,55,0.18)',
                        borderRadius:16, padding:'14px 16px', marginBottom:10,
                        display:'flex', alignItems:'center', animation:'fadeUp 0.35s ease 0.05s both' }}>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:9, color:'rgba(255,255,255,0.35)', textTransform:'uppercase',
                          letterSpacing:'0.12em', fontWeight:600, marginBottom:2 }}>Total Students</p>
              {loading
                ? <div style={{ width:60, height:34, borderRadius:6, background:'rgba(255,255,255,0.08)', marginBottom:4 }}/>
                : <p style={{ fontFamily:"'Playfair Display',serif", fontSize:34, fontWeight:900,
                              color:'#D4AF37', lineHeight:1 }}>{totalS}</p>
              }
              <p style={{ fontSize:9, color:'rgba(255,255,255,0.25)', marginTop:2 }}>Active Enrollment</p>
            </div>
            <div style={{ width:1, background:'rgba(255,255,255,0.1)', alignSelf:'stretch', margin:'0 16px' }}/>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { label:'Male',   val:male,   w:maleW,   c1:'#60A5FA', c2:'#93C5FD' },
                { label:'Female', val:female, w:femaleW, c1:'#F472B6', c2:'#F9A8D4' },
              ].map((g, i) => (
                <div key={i}>
                  <p style={{ fontSize:8, color:'rgba(255,255,255,0.32)', textTransform:'uppercase',
                              letterSpacing:'0.1em', marginBottom:3 }}>{g.label}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:900,
                                   color:g.c2, width:32 }}>{g.val}</span>
                    <div style={{ width:80, height:4, background:'rgba(255,255,255,0.08)',
                                  borderRadius:99, overflow:'hidden' }}>
                      <div style={{ width:`${g.w}%`, height:'100%',
                                    background:`linear-gradient(90deg,${g.c1},${g.c2})`, borderRadius:99 }}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!loading && events.length > 0 && (
            <div style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(212,175,55,0.18)',
                          borderRadius:16, padding:'12px 14px', marginBottom:10,
                          animation:'fadeUp 0.35s ease 0.1s both' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <p style={{ fontSize:9, color:'rgba(255,255,255,0.35)', textTransform:'uppercase',
                            letterSpacing:'0.12em', fontWeight:600 }}>Events This Month</p>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:11, fontWeight:700,
                            color:'#D4AF37' }}>{events.length} events</p>
              </div>
              {events.map((e, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom: i<events.length-1?6:0 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%',
                                background:e.color||e.Color||'#FBBF24', flexShrink:0 }}/>
                  <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.75)',
                                 flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {e.title||e.Title||e.Event_Title}
                  </span>
                  <span style={{ fontSize:9, color:'rgba(255,255,255,0.28)', flexShrink:0 }}>
                    {(e.date||e.Date||'').slice(5).replace('-','/')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!loading && leaderboard.length > 0 && (
            <div style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(212,175,55,0.18)',
                          borderRadius:16, padding:'12px 14px', animation:'fadeUp 0.35s ease 0.15s both' }}>
              <p style={{ fontSize:9, color:'rgba(255,255,255,0.35)', textTransform:'uppercase',
                          letterSpacing:'0.12em', fontWeight:600, marginBottom:10 }}>
                House Points Leaderboard
              </p>
              {leaderboard.map((h, i) => {
                const color = h.color || '#fbbf24';
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10,
                                        marginBottom: i<leaderboard.length-1?7:0 }}>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:900,
                                   color:'rgba(212,175,55,0.45)', width:14 }}>{i+1}</span>
                    <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.7)',
                                   width:70, flexShrink:0, overflow:'hidden',
                                   textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.house}</span>
                    <div style={{ flex:1, height:5, background:'rgba(255,255,255,0.08)',
                                  borderRadius:99, overflow:'hidden' }}>
                      <div style={{ width:`${Math.round(h.total/maxPts*100)}%`, height:'100%',
                                    background:color, borderRadius:99 }}/>
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, color:'#D4AF37',
                                   width:32, textAlign:'right' }}>{h.total}</span>
                  </div>
                );
              })}
            </div>
          )}

          <p style={{ fontSize:9, color:'rgba(255,255,255,0.15)', marginTop:14, letterSpacing:'0.06em' }}>
            {dateStr}
          </p>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ maxWidth:500, margin:'0 auto', width:'100%', padding:'16px',
                    display:'flex', flexDirection:'column', gap:18,
                    fontFamily:"'DM Sans',system-ui,sans-serif" }}>

        {/* ── TODAY'S ATTENDANCE ── */}
        <div style={{ borderRadius:18, overflow:'hidden',
                      boxShadow:'0 4px 16px rgba(0,0,0,0.09)', animation:'fadeUp 0.35s ease 0.1s both' }}>
          <div style={{ background:'linear-gradient(135deg,#1A1845,#2E2C6A)', padding:'11px 16px',
                        display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#D4AF37' }}/>
              <span style={{ fontSize:10, fontWeight:700, color:'#D4AF37',
                             textTransform:'uppercase', letterSpacing:'0.15em' }}>Today's Attendance</span>
              <span style={{ background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.45)',
                             fontSize:8, fontWeight:600, padding:'1px 7px', borderRadius:99 }}>
                {new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'Asia/Yangon'})}
              </span>
            </div>
            <button onClick={fetchAttendance}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:9,
                       color:'rgba(212,175,55,0.55)', fontWeight:600,
                       textTransform:'uppercase', letterSpacing:'0.1em' }}>
              ↻ Refresh
            </button>
          </div>

          {attLoading ? (
            <div style={{ background:'#fff', padding:'24px', display:'flex',
                          alignItems:'center', justifyContent:'center', gap:10 }}>
              <div style={{ width:16, height:16, border:'2px solid rgba(0,0,0,0.1)',
                            borderTop:'2px solid #D4AF37', borderRadius:'50%',
                            animation:'spin 0.8s linear infinite' }}/>
              <span style={{ color:'#bbb', fontSize:11, fontWeight:600 }}>Loading…</span>
            </div>
          ) : att ? (() => {
            const COLOR    = { green:'#16a34a', yellow:'#d97706', red:'#dc2626' };
            const BG       = { green:'#f0fdf4', yellow:'#fffbeb', red:'#fff1f2' };
            const BADGE_BG = { green:'#dcfce7', yellow:'#fef3c7', red:'#fee2e2' };
            const BADGE_LB = { green:'All Clear', yellow:'On Leave', red:'Absent' };

            const rows = [
              { label:'Students', data: att.school, icon:'🎓' },
              { label:'Staff',    data: att.staff,  icon:'👔' },
            ];

            return (
              <div style={{ background:'#fff' }}>
                {rows.map((r, i) => {
                  if (!r.data) return null;
                  const col = COLOR[r.data.color]    || COLOR.green;
                  const bg  = BG[r.data.color]       || BG.green;
                  const bb  = BADGE_BG[r.data.color] || BADGE_BG.green;
                  const lb  = BADGE_LB[r.data.color] || 'All Clear';
                  return (
                    <div key={i} style={{
                      padding:'12px 16px',
                      borderBottom: i < rows.length-1 ? '1px solid #F7F2E8' : 'none',
                      display:'flex', alignItems:'center', gap:12,
                      background: r.data.absent > 0 ? bg : '#fff',
                    }}>
                      <svg width="44" height="44" viewBox="0 0 36 36"
                        style={{ flexShrink:0, transform:'rotate(-90deg)' }}>
                        <circle cx="18" cy="18" r="14" fill="none"
                          stroke="rgba(0,0,0,0.06)" strokeWidth="4"/>
                        <circle cx="18" cy="18" r="14" fill="none"
                          stroke={col} strokeWidth="4"
                          strokeDasharray={`${((r.data.pct||100)/100*87.96).toFixed(1)} 87.96`}
                          strokeLinecap="round"/>
                        <text x="18" y="21" textAnchor="middle" fill={col}
                          fontSize="7" fontWeight="900"
                          transform="rotate(90,18,18)">{r.data.pct||100}%</text>
                      </svg>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                          <span style={{ fontSize:12 }}>{r.icon}</span>
                          <span style={{ fontSize:11, fontWeight:700, color:'#1A1A2E' }}>{r.label}</span>
                          <span style={{ fontSize:8, fontWeight:700, padding:'2px 7px',
                            borderRadius:99, background:bb, color:col,
                            textTransform:'uppercase', letterSpacing:'0.06em' }}>{lb}</span>
                        </div>
                        <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                          <span style={{ fontSize:9, color:'#16a34a', fontWeight:700 }}>
                            ✓ {r.data.present} present
                          </span>
                          {r.data.absent > 0 && (
                            <span style={{ fontSize:9, color:col, fontWeight:700 }}>
                              ✗ {r.data.absent} absent
                            </span>
                          )}
                          {r.data.pending > 0 && (
                            <span style={{ fontSize:9, color:'#d97706', fontWeight:700 }}>
                              ⏳ {r.data.pending} pending
                            </span>
                          )}
                          <span style={{ fontSize:9, color:'#A0AEC0' }}>/ {r.data.total} total</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Grade breakdown */}
                {att.classes?.some(c => c.absent > 0 || c.pending > 0) && (
                  <div style={{ padding:'8px 16px 12px', borderTop:'1px solid #F7F2E8',
                                display:'flex', flexWrap:'wrap', gap:5 }}>
                    {att.classes.filter(c => c.absent > 0 || c.pending > 0).slice(0,6).map((c,i) => (
                      <span key={i} style={{
                        fontSize:8, fontWeight:700, padding:'2px 8px', borderRadius:99,
                        background: c.color==='red'?'#fee2e2':c.color==='yellow'?'#fef3c7':'#f0fdf4',
                        color:      c.color==='red'?'#dc2626':c.color==='yellow'?'#d97706':'#16a34a',
                        textTransform:'uppercase', letterSpacing:'0.06em'
                      }}>
                        {c.grade || '?'} · {c.absent > 0 ? `${c.absent} absent` : `${c.pending} pending`}
                      </span>
                    ))}
                    {att.classes.filter(c => c.absent > 0 || c.pending > 0).length > 6 && (
                      <span style={{ fontSize:8, color:'#A0AEC0', fontWeight:600, padding:'2px 4px' }}>
                        +{att.classes.filter(c => c.absent > 0 || c.pending > 0).length - 6} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })() : (
            <div style={{ background:'#fff', padding:'20px', textAlign:'center',
                          color:'#bbb', fontSize:11, fontWeight:600 }}>
              No attendance data — check GAS connection
            </div>
          )}
        </div>

        {/* Pending Leaves */}
        {!loading && leaves.length > 0 && (
          <div style={{ borderRadius:18, overflow:'hidden',
                        boxShadow:'0 4px 16px rgba(0,0,0,0.09)', animation:'fadeUp 0.35s ease 0.2s both' }}>
            <div style={{ background:'linear-gradient(135deg,#1A1845,#2E2C6A)', padding:'11px 16px',
                          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:'#D4AF37' }}/>
                <span style={{ fontSize:10, fontWeight:700, color:'#D4AF37',
                               textTransform:'uppercase', letterSpacing:'0.15em' }}>Leave Requests</span>
                <span style={{ background:'#D4AF37', color:'#12122A', fontSize:9,
                               fontWeight:800, padding:'1px 8px', borderRadius:99 }}>{pendingL}</span>
              </div>
              <button onClick={() => router.push('/management/leave')}
                style={{ background:'none', border:'none', cursor:'pointer', fontSize:9,
                         color:'rgba(212,175,55,0.55)', fontWeight:600,
                         textTransform:'uppercase', letterSpacing:'0.1em' }}>
                View All →
              </button>
            </div>
            {leaves.map((l, i) => (
              <div key={i} className="leave-row"
                style={{ background:'#fff', padding:'11px 16px', display:'flex',
                         alignItems:'center', justifyContent:'space-between',
                         borderBottom: i<leaves.length-1?'1px solid #F7F2E8':'none' }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:'#1A1A2E', marginBottom:2 }}>{l.Name}</p>
                  <p style={{ fontSize:9, color:'#A0AEC0' }}>{l.Leave_Type} · {l.Start_Date}</p>
                </div>
                <span style={{ fontSize:8, fontWeight:700, color:'#A07020', background:'#FEF9E7',
                               border:'1px solid #E8D060', borderRadius:6, padding:'3px 9px',
                               textTransform:'uppercase', letterSpacing:'0.08em' }}>Pending</span>
              </div>
            ))}
          </div>
        )}

        {/* Tool Sections */}
        {TOOL_SECTIONS.map((sec, si) => (
          <div key={si} style={{ animation:`fadeUp 0.35s ease ${0.22+si*0.06}s both` }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontStyle:'italic',
                          fontWeight:700, color:'#5A4A2A', letterSpacing:'0.04em' }}>{sec.label}</p>
              <div style={{ flex:1, height:1,
                            background:'linear-gradient(90deg,rgba(212,175,55,0.3),transparent)' }}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {sec.tools.map((t, ti) => (
                <div key={ti} className="tool-card" onClick={() => router.push(t.path)}
                  style={{ borderRadius:18, overflow:'hidden',
                           boxShadow:'0 2px 10px rgba(0,0,0,0.08)',
                           border:'1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ width:'100%', height:80, background:t.bg,
                                display:'flex', alignItems:'center',
                                justifyContent:'center', fontSize:40 }}>{t.icon}</div>
                  <div style={{ background:'#fff', padding:'10px 12px 12px' }}>
                    <p style={{ fontSize:12, fontWeight:700, color:'#1E293B', marginBottom:1 }}>{t.name}</p>
                    <p style={{ fontSize:9, color:'#94A3B8' }}>{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
