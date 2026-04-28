"use client";
import { DashboardSkeleton } from '@/components/SkeletonLoader';
import useLeaveData from '@/hooks/useLeaveData';
import UserDetailModal from '@/components/leave/UserDetailModal';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

const fmtDate = (d) => {
  if (!d) return '-';
  try {
    const match = String(d).match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return String(d);
    const [, yyyy, mm, dd] = match;
    const dt = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    const day = dt.toLocaleDateString('en-US', { weekday: 'short' });
    return `${dd}/${mm}/${yyyy}, ${day}`;
  } catch { return String(d); }
};

const TOOL_SECTIONS = [
  {
    label: '👤 ကျောင်းသား & ဝန်ထမ်း',
    color: '#4338CA',
    tools: [
      { name:'Registry',          path:'/management/registry',          desc:'Student & Staff CRUD',   bg:'linear-gradient(135deg,#EEF2FF,#C7D2FE)', icon:'🗂️' },
      { name:'Student Directory', path:'/staff/student-dir',            desc:'ကျောင်းသားစာရင်း ကြည့်',  bg:'linear-gradient(135deg,#F0F9FF,#BAE6FD)', icon:'🎓' },
      { name:'Staff Directory',   path:'/staff/staff-dir',              desc:'ဝန်ထမ်းစာရင်း ကြည့်',    bg:'linear-gradient(135deg,#FDF4FF,#E9D5FF)', icon:'👔' },
      { name:'Staff Permissions', path:'/management/staff-permissions', desc:'Access control',         bg:'linear-gradient(135deg,#FDF4FF,#E9D5FF)', icon:'🔐' },
      { name:'Photo Upload',      path:'/management/photo-upload',      desc:'Bulk photo upload',      bg:'linear-gradient(135deg,#F0FDF4,#BBF7D0)', icon:'📷' },
    ],
  },
  {
    label: '📚 Academic',
    color: '#0369A1',
    tools: [
      { name:'Exam Records',      path:'/management/exam-records',      desc:'Score entry & edit',     bg:'linear-gradient(135deg,#F0F9FF,#BAE6FD)', icon:'📝' },
      { name:'Performance',       path:'/management/performance',       desc:'Exam results & ranks',   bg:'linear-gradient(135deg,#FFFBEB,#FCD34D)', icon:'🏆' },
      { name:'Control Center',    path:'/management/management',        desc:'Timetable & calendar',   bg:'linear-gradient(135deg,#EEF2FF,#C7D2FE)', icon:'⚙️'  },
      { name:'Timetable Rules',   path:'/management/timetable-exceptions', desc:'ကျောင်းပိတ်ရက် exceptions', bg:'linear-gradient(135deg,#FFF1F2,#FECDD3)', icon:'🗓️' },
      { name:'Seasonal Rules',    path:'/management/seasonal-rules',    desc:'ရာသီပိတ်ရက် rules',      bg:'linear-gradient(135deg,#F0FDF4,#A7F3D0)', icon:'🌤️' },
      { name:'House Points',      path:'/staff/points',                 desc:'Award & track points',   bg:'linear-gradient(135deg,#FFFBEB,#FDE68A)', icon:'⭐' },
      { name:'Notes',             path:'/staff/notes',                  desc:'Student notes log',      bg:'linear-gradient(135deg,#F0F9FF,#BAE6FD)', icon:'📒' },
    ],
  },
  {
    label: '💰 Finance & Admin',
    color: '#047857',
    tools: [
      { name:'Fee Collection',    path:'/staff/fees',                   desc:'ကျောင်းလခ မှတ်ရန်',      bg:'linear-gradient(135deg,#F0FDF4,#A7F3D0)', icon:'💰' },
      { name:'Analytics',         path:'/management/analytic',          desc:'School-wide data',       bg:'linear-gradient(135deg,#EFF6FF,#BFDBFE)', icon:'📈' },
      { name:'Communication',     path:'/management/communication',     desc:'Announcements',          bg:'linear-gradient(135deg,#F0FDF4,#BBF7D0)', icon:'📢' },
      { name:'Calendar',          path:'/management/calendar',          desc:'Events & schedule',      bg:'linear-gradient(135deg,#EEF2FF,#C7D2FE)', icon:'📅' },
    ],
  },
  {
    label: '🏫 Facilities',
    color: '#B45309',
    tools: [
      { name:'Hostel',            path:'/staff/hostel',                 desc:'Hostel management',      bg:'linear-gradient(135deg,#F0FDF4,#BBF7D0)', icon:'🏠' },
      { name:'Inventory',         path:'/staff/inventory',              desc:'Stock & assets',         bg:'linear-gradient(135deg,#FEFCE8,#FEF08A)', icon:'📦' },
      { name:'Lost & Found',      path:'/staff/lost-found',             desc:'Lost items tracking',    bg:'linear-gradient(135deg,#FFF1F2,#FECDD3)', icon:'🔍' },
      { name:'Vehicles',          path:'/management/vehicles',          desc:'ယာဉ်မှတ်ပုံတင်',         bg:'linear-gradient(135deg,#F0F9FF,#BAE6FD)', icon:'🚗' },
      { name:'Vendors',           path:'/management/vendors',           desc:'Partners & contacts',    bg:'linear-gradient(135deg,#FDF4FF,#E9D5FF)', icon:'🤝' },
    ],
  },
];

function AbsentModal({ persons, title, onClose, onPersonClick }) {
  if (!persons || persons.length === 0) return null;
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding: '16px'
    }} onClick={onClose}>
      <div style={{
        background:'#fff', borderRadius:'24px',
        width:'100%', maxWidth:'520px',
        maxHeight:'85vh', display:'flex', flexDirection:'column',
        boxShadow:'0 8px 40px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding:'20px 20px 16px',
          borderBottom:'1px solid #F1F5F9',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          flexShrink:0
        }}>
          <div>
            <p style={{fontSize:'9px',color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.15em',fontWeight:900,margin:'0 0 3px'}}>Absent Detail</p>
            <p style={{fontSize:'16px',fontWeight:900,color:'#1A1A2E',margin:0}}>{title}</p>
          </div>
          <button onClick={onClose} style={{
            background:'#F1F5F9',border:'none',borderRadius:'10px',
            width:'36px',height:'36px',cursor:'pointer',
            fontSize:'14px',color:'#64748B',display:'flex',alignItems:'center',justifyContent:'center',
          }}>✕</button>
        </div>
        <div style={{padding:'8px 0', overflowY:'auto', flex:1}}>
          {persons.map((p, i) => (
            <div key={i}
              onClick={() => onPersonClick && onPersonClick(p)}
              style={{ padding:'12px 20px', borderBottom: i < persons.length-1 ? '1px solid #F8FAFC' : 'none', cursor: onPersonClick ? 'pointer' : 'default', transition:'background 0.15s' }}
              onMouseEnter={e => { if(onPersonClick) e.currentTarget.style.background='#F8FAFC'; }}
              onMouseLeave={e => { e.currentTarget.style.background=''; }}
            >
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{
                    width:'36px',height:'36px',borderRadius:'12px',
                    background: p.status === 'Approved' ? '#FFF0F0' : '#FFFBEB',
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0,
                  }}>
                    {p.grade ? '🎓' : '👔'}
                  </div>
                  <div>
                    <p style={{fontSize:'14px',fontWeight:900,color:'#1A1A2E',margin:0}}>
                      {p.name || p.id}
                      {onPersonClick && <span style={{fontSize:'8px',color:'#94A3B8',marginLeft:6,fontWeight:600}}>History ›</span>}
                    </p>
                    {p.grade && <p style={{fontSize:'9px',color:'#64748b',margin:'2px 0 0',fontWeight:900,textTransform:'uppercase',letterSpacing:'0.05em'}}>
                      {p.grade === 'Unknown' ? 'Class Unknown' : `Grade ${p.grade}`}{p.section ? ` · ${p.section}` : ''}
                    </p>}
                  </div>
                </div>
                <span style={{
                  fontSize:'9px',fontWeight:900,padding:'4px 10px',borderRadius:'8px',
                  background: p.status === 'Approved' ? '#FEE2E2' : '#FEF3C7',
                  color:      p.status === 'Approved' ? '#DC2626'  : '#D97706',
                  textTransform:'uppercase', letterSpacing:'0.06em', flexShrink:0,
                }}>{p.status}</span>
              </div>
              <div style={{ background:'#F8FAFC', borderRadius:'12px', padding:'12px', display:'flex', flexDirection:'column', gap:'6px' }}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'6px'}}>
                  <span style={{ fontSize:'9px',fontWeight:900,color:'#4338CA', background:'#EEF2FF',padding:'3px 8px',borderRadius:'6px',textTransform:'uppercase' }}>{p.leave_type || 'Leave'}</span>
                  {p.start_date && (
                    <span style={{fontSize:'10px',color:'#475569',fontWeight:700}}>
                      📅 {p.start_date} {p.end_date && p.end_date !== p.start_date ? ` → ${p.end_date}` : ''} {p.total_days ? ` (${p.total_days} day${Number(p.total_days)>1?'s':''})` : ''}
                    </span>
                  )}
                </div>
                {p.reason && p.reason !== '-' && p.reason !== '' && (
                  <p style={{ fontSize:'12px',color:'#334155',margin:'4px 0 0', fontStyle:'italic', lineHeight:1.5 }}>"{p.reason}"</p>
                )}
                {p.remark && p.remark !== '-' && p.remark !== '' && (
                  <div style={{display:'flex',gap:4,alignItems:'flex-start',marginTop:4,background:'#fffbeb',border:'1px solid #fde68a',borderRadius:6,padding:'3px 8px'}}>
                    <span style={{fontSize:10}}>✏️</span>
                    <span style={{fontSize:10,color:'#b45309',fontWeight:700}}>{p.remark}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ManagementDashboard() {
  const router = useRouter();
  const [user,    setUser]   = useState(null);
  const [loading, setLoading]= useState(true);
  const [dash,    setDash]   = useState(null);
  const { statsList, allLeaves, allStudents, loading: leaveLoading } = useLeaveData();
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
    if (!auth || auth.userRole !== 'management') { router.push('/login'); return; }
    setUser(auth);
    fetch(WEB_APP_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({ action:'getDashboardData' }) })
      .then(r => r.json())
      .then(res => { if (res.success) setDash(res); })
      .catch(e => console.error('getDashboardData error:', e))
      .finally(() => setLoading(false));
  }, []);

  const [att,        setAtt]        = useState(null);
  const [attLoading, setAttLoading] = useState(true);
  const todayMM = new Date().toLocaleDateString('en-CA', { timeZone:'Asia/Yangon' });

  const fetchAttendance = useCallback(() => {
    setAttLoading(true);
    fetch(WEB_APP_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({ action:'getAttendance', date:todayMM }) })
      .then(r => r.json())
      .then(res => { if (res.success) setAtt(res); })
      .catch(e => console.error('attendance error:', e))
      .finally(() => setAttLoading(false));
  }, [todayMM]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  // 🔥 ACTIVE STUDENTS ONLY
  const activeStudents = useMemo(() => {
    return allStudents?.filter(s => s.Status === true || String(s.Status).toUpperCase() === 'TRUE') || [];
  }, [allStudents]);

  const totalActive = activeStudents.length;

  // Grade-wise gender breakdown (ACTIVE ONLY)
  const gradeGenderStats = useMemo(() => {
    const gradeMap = new Map();
    activeStudents.forEach(s => {
      const grade = s.Grade || 'Unknown';
      const sex = (s.Sex || '').toString().toUpperCase();
      const isMale = sex === 'M' || sex === 'MALE' || sex === 'ကျား';
      if (!gradeMap.has(grade)) gradeMap.set(grade, { male: 0, female: 0 });
      const entry = gradeMap.get(grade);
      if (isMale) entry.male++;
      else entry.female++;
    });
    const sortedGrades = Array.from(gradeMap.keys()).sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      if (a === 'KG') return -1;
      if (b === 'KG') return 1;
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      return numA - numB;
    });
    return { gradeMap, sortedGrades };
  }, [activeStudents]);

  const activeMale = useMemo(() => {
    return activeStudents.filter(s => {
      const sex = (s.Sex || '').toString().toUpperCase();
      return sex === 'M' || sex === 'MALE' || sex === 'ကျား';
    }).length;
  }, [activeStudents]);
  const activeFemale = totalActive - activeMale;

  // Hostel stats based on ACTIVE students only
  const hostelStats = useMemo(() => {
    const hostelStudents = activeStudents.filter(s => {
      const hostelVal = s['School/Hostel'] || s['School_Hostel'] || '';
      return hostelVal.toString().toLowerCase() === 'hostel';
    });
    const gradeMap = new Map();
    hostelStudents.forEach(s => {
      const grade = s.Grade || 'Unknown';
      const sex = (s.Sex || '').toString().toUpperCase();
      const isMale = sex === 'M' || sex === 'MALE' || sex === 'ကျား';
      if (!gradeMap.has(grade)) gradeMap.set(grade, { male: 0, female: 0 });
      const entry = gradeMap.get(grade);
      if (isMale) entry.male++;
      else entry.female++;
    });
    const sortedGrades = Array.from(gradeMap.keys()).sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      if (a === 'KG') return -1;
      if (b === 'KG') return 1;
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      return numA - numB;
    });
    return { totalHostel: hostelStudents.length, gradeMap, sortedGrades };
  }, [activeStudents]);

  if (loading) return <DashboardSkeleton done={!loading} />;

  const name     = user?.Name || user?.name || user?.['Name (ALL CAPITAL)'] || user?.username || 'Admin';
  const dateStr  = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const events      = dash?.events      || [];
  const leaderboard = dash?.leaderboard || [];
  const leaves      = dash?.leaves      || [];
  const pendingL    = dash?.pendingL    || 0;

  const maleW   = totalActive > 0 ? Math.round(activeMale / totalActive * 100) : 50;
  const femaleW = totalActive > 0 ? Math.round(activeFemale / totalActive * 100) : 50;
  const maxPts  = leaderboard[0]?.total || 1;

  const allAbsentPersons = [
    ...(att?.absentStudents  || []),
    ...(att?.pendingStudents || []),
    ...(att?.absentStaff     || []),
    ...(att?.pendingStaff    || []),
  ];

  const openAbsentModal = (type) => {
    let persons = [];
    let title   = '';
    if (type === 'student') {
      persons = [...(att?.absentStudents||[]), ...(att?.pendingStudents||[])];
      title   = 'Student Absences Today';
    } else if (type === 'staff') {
      persons = [...(att?.absentStaff||[]), ...(att?.pendingStaff||[])];
      title   = 'Staff Absences Today';
    } else {
      persons = allAbsentPersons.filter(p => (p.classKey || 'Unknown') === (type || 'Unknown'));
      title = type && type !== 'Unknown' ? `Class: ${type}` : 'Class: Unknown';
    }
    if (persons.length > 0) setModal({ title, persons });
  };

  const openPersonHistory = (p) => {
    setModal(null);
    const fromStats = statsList.find(s =>
      (p.id && s.id === p.id) || (p.name && s.name === p.name)
    );
    if (fromStats) { setSelectedPerson(fromStats); return; }

    const personLeaves = allLeaves.filter(l =>
      (p.id && l.User_ID === p.id) || (p.name && l.Name === p.name)
    );

    if (personLeaves.length > 0) {
      const leaveTypes = {};
      const reasons = personLeaves.map(l => {
        const days = Number(l.Total_Days) || 1;
        const lt = l.Leave_Type || 'Leave';
        leaveTypes[lt] = (leaveTypes[lt] || 0) + days;
        return {
          start:  l.Start_Date,
          end:    l.End_Date || l.Start_Date,
          text:   l.Reason || '-',
          type:   lt,
          status: l.Status || 'Approved',
          remark: l.Remark || '',
          attachment: l.Attachment_Link || '',
        };
      }).sort((a, b) => (b.start > a.start ? 1 : -1));

      const totalDays = personLeaves.reduce((sum, l) => sum + (Number(l.Total_Days)||1), 0);

      setSelectedPerson({
        id:            p.id || p.name,
        name:          p.name || p.id,
        type:          p.grade ? 'STUDENT' : 'STAFF',
        grade:         p.grade || '',
        section:       p.section || '',
        totalDays,
        consecutiveMax: 0,
        weekCount:     0,
        monthCount:    0,
        leaveTypes,
        reasons,
      });
    } else {
      setSelectedPerson({
        id:            p.id || p.name,
        name:          p.name || p.id,
        type:          p.grade ? 'STUDENT' : 'STAFF',
        grade:         p.grade || '',
        section:       p.section || '',
        totalDays:     Number(p.total_days) || 1,
        consecutiveMax: 0, weekCount: 0, monthCount: 0,
        leaveTypes:    { [p.leave_type || 'Leave']: Number(p.total_days) || 1 },
        reasons: [{
          start:  p.start_date,
          end:    p.end_date,
          text:   p.reason || '-',
          type:   p.leave_type || 'Leave',
          status: p.status || 'Approved',
          remark: p.remark || '',
        }],
      });
    }
  };

  return (
    <>
      {modal && <AbsentModal title={modal.title} persons={modal.persons} onClose={() => setModal(null)} onPersonClick={openPersonHistory}/>}
      {selectedPerson && <UserDetailModal user={selectedPerson} onClose={() => setSelectedPerson(null)} />}
      <div style={{ flex:1, overflowY:'auto', background:'#F5F3EE', WebkitOverflowScrolling:'touch', paddingBottom:'40px' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');
          @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
          @keyframes spin   { to { transform:rotate(360deg) } }
          * { box-sizing:border-box; margin:0; padding:0; }
          .tool-card { transition:transform 0.15s, box-shadow 0.15s; cursor:pointer; }
          .tool-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,0.13) !important; }
          .leave-row:hover { background:#FFFBF0 !important; }
          .abs-pill { cursor:pointer; transition:opacity 0.15s; }
          .abs-pill:hover { opacity:0.75; }
          ::-webkit-scrollbar { width:3px }
          ::-webkit-scrollbar-thumb { background:rgba(0,0,0,0.1); borderRadius:99px }
        `}</style>

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

            {/* ========== TOTAL ACTIVE STUDENTS CARD with Grade/Gender ========== */}
            <div style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(212,175,55,0.18)',
                          borderRadius:16, padding:'14px 16px', marginBottom:10,
                          animation:'fadeUp 0.35s ease 0.05s both' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <div>
                  <p style={{ fontSize:9, color:'rgba(255,255,255,0.35)', textTransform:'uppercase',
                              letterSpacing:'0.12em', fontWeight:600, marginBottom:2 }}>Total Active Students</p>
                  <p style={{ fontFamily:"'Playfair Display',serif", fontSize:34, fontWeight:900,
                              color:'#D4AF37', lineHeight:1 }}>{totalActive}</p>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  <div>
                    <p style={{ fontSize:8, color:'rgba(255,255,255,0.32)', textTransform:'uppercase',
                                letterSpacing:'0.1em', marginBottom:2 }}>Male</p>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:900,
                                     color:'#93C5FD', width:32 }}>{activeMale}</span>
                      <div style={{ width:80, height:4, background:'rgba(255,255,255,0.08)',
                                    borderRadius:99, overflow:'hidden' }}>
                        <div style={{ width:`${maleW}%`, height:'100%',
                                      background:'linear-gradient(90deg,#60A5FA,#93C5FD)', borderRadius:99 }}/>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize:8, color:'rgba(255,255,255,0.32)', textTransform:'uppercase',
                                letterSpacing:'0.1em', marginBottom:2 }}>Female</p>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:900,
                                     color:'#F9A8D4', width:32 }}>{activeFemale}</span>
                      <div style={{ width:80, height:4, background:'rgba(255,255,255,0.08)',
                                    borderRadius:99, overflow:'hidden' }}>
                        <div style={{ width:`${femaleW}%`, height:'100%',
                                      background:'linear-gradient(90deg,#F472B6,#F9A8D4)', borderRadius:99 }}/>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grade-wise gender breakdown (Active only) */}
              <div style={{ marginTop:12, borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:10 }}>
                <p style={{ fontSize:8, color:'rgba(255,255,255,0.4)', textTransform:'uppercase',
                            letterSpacing:'0.1em', marginBottom:8 }}>📊 Grade-wise Gender (Active Students)</p>
                <div style={{ maxHeight:200, overflowY:'auto', paddingRight:4 }}>
                  {gradeGenderStats.sortedGrades.map(grade => {
                    const data = gradeGenderStats.gradeMap.get(grade);
                    if (!data) return null;
                    return (
                      <div key={grade} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6, paddingBottom:4, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ width:70 }}>
                          <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.7)' }}>
                            {grade === 'Unknown' ? 'N/A' : `Grade ${grade}`}
                          </span>
                        </div>
                        <div style={{ display:'flex', gap:20 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ fontSize:11 }}>👨‍🎓</span>
                            <span style={{ fontSize:12, fontWeight:900, color:'#60A5FA' }}>{data.male}</span>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ fontSize:11 }}>👩‍🎓</span>
                            <span style={{ fontSize:12, fontWeight:900, color:'#F472B6' }}>{data.female}</span>
                          </div>
                        </div>
                        <span style={{ fontSize:9, color:'rgba(255,255,255,0.3)' }}>active</span>
                      </div>
                    );
                  })}
                  {gradeGenderStats.sortedGrades.length === 0 && (
                    <p style={{ textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.35)', padding:'8px 0' }}>No active students</p>
                  )}
                </div>
              </div>
            </div>

            {/* Hostel Card (Active only) */}
            <div style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(212,175,55,0.18)',
                          borderRadius:16, padding:'14px 16px', marginBottom:10,
                          animation:'fadeUp 0.35s ease 0.07s both' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <p style={{ fontSize:9, color:'rgba(212,175,55,0.65)', textTransform:'uppercase',
                            letterSpacing:'0.12em', fontWeight:600 }}>🏠 Hostel Students (Active)</p>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700,
                            color:'#D4AF37' }}>{hostelStats.totalHostel} total</p>
              </div>
              <div style={{ maxHeight:200, overflowY:'auto', paddingRight:4 }}>
                {hostelStats.sortedGrades.map(grade => {
                  const data = hostelStats.gradeMap.get(grade);
                  if (!data) return null;
                  return (
                    <div key={grade} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, paddingBottom:6, borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ width:70 }}>
                        <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.8)' }}>
                          {grade === 'Unknown' ? 'N/A' : `Grade ${grade}`}
                        </span>
                      </div>
                      <div style={{ display:'flex', gap:20 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ fontSize:12 }}>👨‍🎓</span>
                          <span style={{ fontSize:13, fontWeight:900, color:'#60A5FA' }}>{data.male}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ fontSize:12 }}>👩‍🎓</span>
                          <span style={{ fontSize:13, fontWeight:900, color:'#F472B6' }}>{data.female}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {hostelStats.totalHostel === 0 && (
                  <p style={{ textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.35)', padding:'12px 0' }}>No active hostel students</p>
                )}
              </div>
            </div>

            {/* Events Card (with End_Date range display) */}
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
                      {e.endDate
                        ? `${fmtDate(e.date)} → ${fmtDate(e.endDate)}`
                        : fmtDate(e.date||e.Date||'')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* House Points Leaderboard */}
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

        <div style={{ maxWidth:500, margin:'0 auto', width:'100%', padding:'16px',
                      display:'flex', flexDirection:'column', gap:18,
                      fontFamily:"'DM Sans',system-ui,sans-serif" }}>

          {/* Today's Attendance */}
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
                { label:'Students', data: att.school, icon:'🎓', type:'student' },
                { label:'Staff',    data: att.staff,  icon:'👔', type:'staff'   },
              ];

              return (
                <div style={{ background:'#fff' }}>
                  {rows.map((r, i) => {
                    if (!r.data) return null;
                    const col = COLOR[r.data.color]    || COLOR.green;
                    const bg  = BG[r.data.color]       || BG.green;
                    const bb  = BADGE_BG[r.data.color] || BADGE_BG.green;
                    const lb  = BADGE_LB[r.data.color] || 'All Clear';
                    const hasAbsent = (r.data.absent || 0) + (r.data.pending || 0) > 0;
                    return (
                      <div key={i} style={{
                        padding:'12px 16px',
                        borderBottom: i < rows.length-1 ? '1px solid #F7F2E8' : 'none',
                        display:'flex', alignItems:'center', gap:12,
                        background: r.data.absent > 0 ? bg : '#fff',
                        cursor: hasAbsent ? 'pointer' : 'default',
                      }}
                      onClick={() => hasAbsent && openAbsentModal(r.type)}>
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
                            {hasAbsent && (
                              <span style={{ fontSize:8, color:'#94A3B8', fontWeight:600 }}>
                                (tap for details)
                              </span>
                            )}
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
                        {hasAbsent && <span style={{ color:'#CBD5E1', fontSize:14 }}>›</span>}
                      </div>
                    );
                  })}

                  {/* Grade breakdown pills */}
                  {att.classes?.some(c => c.absent > 0 || c.pending > 0) && (
                    <div style={{ padding:'10px 16px 14px', borderTop:'1px solid #F7F2E8' }}>
                      <p style={{ fontSize:'8px', color:'#94A3B8', fontWeight:700, textTransform:'uppercase',
                                  letterSpacing:'0.1em', marginBottom:'8px' }}>
                        By Class — tap to see who
                      </p>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {att.classes.filter(c => c.absent > 0 || c.pending > 0).map((c,i) => {
                          const gradeLabel = (c.grade && c.grade !== 'Unknown') ? `${c.grade}` : 'Unknown Class';
                          const countLabel = c.absent > 0 ? `${c.absent} absent` : `${c.pending} pending`;
                          return (
                            <button key={i} className="abs-pill" onClick={() => openAbsentModal(c.grade || 'Unknown')}
                              style={{
                                fontSize:9, fontWeight:900, padding:'6px 12px', borderRadius:99,
                                border:'none', cursor:'pointer',
                                background: c.color==='red'?'#fee2e2':c.color==='yellow'?'#fef3c7':'#f0fdf4',
                                color:      c.color==='red'?'#dc2626':c.color==='yellow'?'#d97706':'#16a34a',
                                textTransform:'uppercase', letterSpacing:'0.06em',
                                display:'flex', alignItems:'center', gap:4,
                              }}>
                              {gradeLabel} · {countLabel}
                              <span style={{ fontSize:10 }}>›</span>
                            </button>
                          );
                        })}
                      </div>
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

          {/* Pending Leaves Card */}
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
                    <p style={{ fontSize:9, color:'#A0AEC0' }}>{l.Leave_Type} · {fmtDate(l.Start_Date)}</p>
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
    </>
  );
}