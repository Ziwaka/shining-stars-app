"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const S = {
  page:   { minHeight:'100vh', background:'#0f0a1e', color:'#fff', fontFamily:'system-ui,sans-serif', paddingBottom:'80px' },
  header: { position:'sticky', top:0, zIndex:40, background:'rgba(15,10,30,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  card:   { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', padding:'16px' },
};

export default function StudentTimetablePage() {
  const router = useRouter();
  const [user, setUser]       = useState(null);
  const [cfg, setCfg]         = useState(null);
  const [cells, setCells]     = useState({});
  const [selDay, setSelDay]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.userRole !== 'student') { router.push('/login'); return; }
    setUser(u);

    // Default to today's day
    const todayDay = DAYS[new Date().getDay()];
    setSelDay(todayDay);
    fetchAll(u);
  }, []);

  const fetchAll = async (u) => {
    try {
      const grade = u.Grade?.toString() || '';
      const [cfgRes, ttRes] = await Promise.all([
        fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getTimetableConfig' }) }),
        fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getTimetable', grade }) }),
      ]);
      const cfgData = await cfgRes.json();
      const ttData  = await ttRes.json();
      if (cfgData.success) setCfg(cfgData.config);
      if (ttData.success) {
        const map = {};
        (ttData.data || []).forEach(r => { map[`${r.Day}_${r.Period_No}`] = r; });
        setCells(map);
      }
    } catch {}
    setLoading(false);
  };

  const todayDay = DAYS[new Date().getDay()];
  const activeDays = cfg?.days || DAYS.slice(0,5);
  const periods    = cfg?.periods || [];
  const dayPeriods = periods.filter(p => !p.isBreak);

  // Today's schedule
  const todaySchedule = periods.map(p => ({
    ...p,
    cell: cells[`${selDay}_${p.no}`] || null,
  }));

  const currentHour = new Date().getHours();
  const currentMin  = new Date().getMinutes();
  const nowMins = currentHour * 60 + currentMin;
  const timeToMins = (t) => { if (!t) return 0; const [h,m] = t.split(':').map(Number); return h*60+(m||0); };

  const getCurrentPeriod = () => {
    for (const p of periods) {
      if (p.start && p.end) {
        if (nowMins >= timeToMins(p.start) && nowMins < timeToMins(p.end)) return p.no;
      }
    }
    return null;
  };
  const currentPeriod = selDay === todayDay ? getCurrentPeriod() : null;

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>

      <div style={S.header}>
        <button onClick={() => router.push('/student')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'14px' }}>← Home</button>
        <div style={{ textAlign:'center' }}>
          <p style={{ fontWeight:900, fontSize:'13px', textTransform:'uppercase', letterSpacing:'0.1em', margin:0 }}>Timetable</p>
          <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)', margin:0 }}>{user?.Grade ? `Grade ${user.Grade}` : ''}</p>
        </div>
        <div style={{ width:'40px' }}/>
      </div>

      <div style={{ padding:'16px', maxWidth:'480px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'12px' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
            <div style={{ width:'32px', height:'32px', border:'3px solid rgba(255,255,255,0.1)', borderTop:'3px solid #fbbf24', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
          </div>
        ) : (
          <>
            {/* Day selector */}
            <div style={{ display:'flex', gap:'6px', overflowX:'auto', paddingBottom:'4px' }}>
              {activeDays.map(day => {
                const isToday = day === todayDay;
                const isSel   = day === selDay;
                const idx     = DAYS.indexOf(day);
                return (
                  <button key={day} onClick={() => setSelDay(day)}
                    style={{ flexShrink:0, padding:'8px 14px', borderRadius:'12px', border:'none', cursor:'pointer', fontWeight:900, fontSize:'10px', textAlign:'center',
                      background: isSel ? '#fbbf24' : isToday ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.05)',
                      color: isSel ? '#0f172a' : isToday ? '#fbbf24' : 'rgba(255,255,255,0.4)',
                      outline: isToday && !isSel ? '1px solid rgba(251,191,36,0.3)' : 'none' }}>
                    {DAYS_SHORT[idx] || day.slice(0,3)}
                    {isToday && <div style={{ fontSize:'7px', marginTop:'2px', opacity:0.7 }}>TODAY</div>}
                  </button>
                );
              })}
            </div>

            {/* Schedule list */}
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              {todaySchedule.length === 0 ? (
                <div style={{ textAlign:'center', padding:'50px 0', color:'rgba(255,255,255,0.2)' }}>Timetable မသတ်မှတ်ရသေးပါ</div>
              ) : todaySchedule.map((p, i) => {
                const isCurrent = currentPeriod === p.no;
                const isPast    = selDay === todayDay && p.end && nowMins > timeToMins(p.end);
                const isBreak   = p.isBreak;
                const c         = p.cell;

                if (isBreak) return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'6px 8px' }}>
                    <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.15)', minWidth:'80px', textAlign:'right' }}>{p.start}–{p.end}</div>
                    <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.05)' }}/>
                    <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.15)', fontStyle:'italic' }}>{p.label}</div>
                    <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.05)' }}/>
                  </div>
                );

                return (
                  <div key={i} style={{
                    background: isCurrent ? 'rgba(251,191,36,0.1)' : isPast ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isCurrent ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    borderLeft: `4px solid ${isCurrent ? '#fbbf24' : c ? '#60a5fa' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius:'12px', padding:'12px 14px',
                    display:'flex', alignItems:'center', gap:'12px',
                    opacity: isPast ? 0.5 : 1,
                  }}>
                    <div style={{ flexShrink:0, textAlign:'center', minWidth:'52px' }}>
                      <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)', marginBottom:'2px' }}>{p.start}</div>
                      <div style={{ fontSize:'9px', color: isCurrent ? '#fbbf24' : 'rgba(255,255,255,0.2)', fontWeight:900 }}>{p.label}</div>
                      <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)' }}>{p.end}</div>
                    </div>
                    <div style={{ flex:1 }}>
                      {c ? (
                        <>
                          <p style={{ fontWeight:900, fontSize:'13px', color: isCurrent ? '#fbbf24' : '#fff', margin:'0 0 3px' }}>{c.Subject}</p>
                          <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                            {c.Teacher && <span style={{ fontSize:'9px', color:'rgba(255,255,255,0.3)' }}>👤 {c.Teacher}</span>}
                            {c.Room    && <span style={{ fontSize:'9px', color:'rgba(255,255,255,0.3)' }}>🚪 {c.Room}</span>}
                          </div>
                        </>
                      ) : (
                        <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.2)', fontStyle:'italic', margin:0 }}>— သတ်မှတ်မထားပါ —</p>
                      )}
                    </div>
                    {isCurrent && (
                      <div style={{ flexShrink:0, background:'#fbbf24', color:'#0f172a', fontSize:'8px', fontWeight:900, padding:'3px 8px', borderRadius:'99px', textTransform:'uppercase' }}>Now</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Full week grid (compact) */}
            <div style={S.card}>
              <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.15em', fontWeight:900, margin:'0 0 12px' }}>Weekly Overview</p>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'420px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding:'4px 6px', fontSize:'8px', color:'rgba(255,255,255,0.25)', textAlign:'left', fontWeight:900, letterSpacing:'0.1em', textTransform:'uppercase' }}>Period</th>
                      {activeDays.map(d => (
                        <th key={d} style={{ padding:'4px 6px', fontSize:'8px', color: d===todayDay?'#fbbf24':'rgba(255,255,255,0.25)', textAlign:'center', fontWeight:900, textTransform:'uppercase' }}>
                          {DAYS_SHORT[DAYS.indexOf(d)] || d.slice(0,3)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.filter(p=>!p.isBreak).map((p,i) => (
                      <tr key={i}>
                        <td style={{ padding:'4px 6px', fontSize:'8px', color:'rgba(255,255,255,0.3)', whiteSpace:'nowrap' }}>{p.label}</td>
                        {activeDays.map(day => {
                          const c = cells[`${day}_${p.no}`];
                          const isNow = day===todayDay && currentPeriod===p.no;
                          return (
                            <td key={day} style={{ padding:'4px 6px', textAlign:'center' }}>
                              <div style={{ fontSize:'9px', fontWeight:900, color: isNow ? '#fbbf24' : c ? '#60a5fa' : 'rgba(255,255,255,0.1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'60px' }}>
                                {c?.Subject?.split(' ')[0] || '—'}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}