"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const S = {
  page: { display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden', background:'#0f0a1e', color:'#fff', fontFamily:'system-ui,sans-serif' },
  header: { zIndex:40, background:'rgba(15,10,30,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  card:   { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', padding:'16px' },
};

export default function StudentCalendarPage() {
  const router = useRouter();
  const today  = new Date();
  const [user, setUser]       = useState(null);
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState({ year: today.getFullYear(), month: today.getMonth() });

  useEffect(() => {
    const saved = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.userRole !== 'student') { router.push('/login'); return; }
    setUser(u);
    fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getEvents' }) })
      .then(r => r.json()).then(d => { if (d.success) setEvents(d.data || []); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const monthKey     = `${viewDate.year}-${String(viewDate.month+1).padStart(2,'0')}`;
  const monthEvents  = events.filter(e => (e.Date||'').startsWith(monthKey) && (e.Target==='All'||e.Target==='Student'||!e.Target));
  const upcomingAll  = events.filter(e => e.Date >= today.toISOString().split('T')[0] && (e.Target==='All'||e.Target==='Student'||!e.Target)).sort((a,b)=>a.Date>b.Date?1:-1).slice(0,8);

  const daysInMonth  = new Date(viewDate.year, viewDate.month+1, 0).getDate();
  const firstDow     = (new Date(viewDate.year, viewDate.month, 1).getDay()+6)%7;
  const eventsByDay  = {};
  monthEvents.forEach(e => { const d=parseInt((e.Date||'').split('-')[2]); if(!eventsByDay[d])eventsByDay[d]=[]; eventsByDay[d].push(e); });

  const prevMonth = () => setViewDate(v => { const d=new Date(v.year,v.month-1); return {year:d.getFullYear(),month:d.getMonth()}; });
  const nextMonth = () => setViewDate(v => { const d=new Date(v.year,v.month+1); return {year:d.getFullYear(),month:d.getMonth()}; });

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>

      <div style={S.header}>
        <button onClick={() => router.push('/student')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'14px' }}>← Home</button>
        <p style={{ fontWeight:900, fontSize:'13px', textTransform:'uppercase', letterSpacing:'0.1em', margin:0 }}>📅 Events Calendar</p>
        <div style={{ width:'40px' }}/>
      </div>
      <div style={{flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', paddingBottom:'80px'}}>

      <div style={{ padding:'16px', maxWidth:'480px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'12px' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
            <div style={{ width:'32px', height:'32px', border:'3px solid rgba(255,255,255,0.1)', borderTop:'3px solid #fbbf24', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
          </div>
        ) : (
          <>
            {/* Calendar grid */}
            <div style={S.card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                <button onClick={prevMonth} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'20px', padding:'0 8px' }}>‹</button>
                <p style={{ fontWeight:900, fontSize:'15px', color:'#fff', margin:0 }}>{MONTHS[viewDate.month]} {viewDate.year}</p>
                <button onClick={nextMonth} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'20px', padding:'0 8px' }}>›</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px', marginBottom:'4px' }}>
                {['M','T','W','T','F','S','S'].map((d,i) => (
                  <div key={i} style={{ textAlign:'center', fontSize:'9px', color:'rgba(255,255,255,0.25)', fontWeight:900, padding:'4px 0' }}>{d}</div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
                {Array(firstDow).fill(null).map((_,i) => <div key={`e${i}`}/>)}
                {Array(daysInMonth).fill(null).map((_,i) => {
                  const day = i+1;
                  const isToday = day===today.getDate() && viewDate.month===today.getMonth() && viewDate.year===today.getFullYear();
                  const dayEvts = eventsByDay[day] || [];
                  return (
                    <div key={day} style={{ borderRadius:'8px', padding:'4px 2px', minHeight:'36px', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px',
                      background: isToday ? 'rgba(251,191,36,0.15)' : dayEvts.length ? 'rgba(255,255,255,0.04)' : 'transparent',
                      outline: isToday ? '1px solid rgba(251,191,36,0.4)' : 'none' }}>
                      <span style={{ fontSize:'11px', fontWeight:900, color: isToday ? '#fbbf24' : 'rgba(255,255,255,0.6)' }}>{day}</span>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'1px', justifyContent:'center' }}>
                        {dayEvts.slice(0,3).map((e,j) => <div key={j} style={{ width:'5px', height:'5px', borderRadius:'50%', background:e.Color||'#fbbf24' }}/>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming events */}
            <div>
              <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.15em', fontWeight:900, margin:'0 0 10px' }}>Upcoming Events</p>
              {upcomingAll.length === 0 ? (
                <div style={{ textAlign:'center', padding:'30px 0', color:'rgba(255,255,255,0.2)' }}>Upcoming events မရှိသေးပါ</div>
              ) : upcomingAll.map((e,i) => {
                const urgent = e.Is_Priority === true || e.Is_Priority === 'TRUE';
                return (
                  <div key={i} style={{ ...S.card, padding:'12px 16px', marginBottom:'8px', borderLeft:`4px solid ${e.Color||'#fbbf24'}`, background: urgent?'rgba(239,68,68,0.07)':'rgba(255,255,255,0.04)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'8px' }}>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px', flexWrap:'wrap' }}>
                          {urgent && <span style={{ background:'#dc2626', color:'#fff', fontSize:'8px', fontWeight:900, padding:'1px 8px', borderRadius:'99px' }}>URGENT</span>}
                          <span style={{ background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.4)', fontSize:'8px', fontWeight:900, padding:'1px 8px', borderRadius:'99px' }}>{e.Type||'Event'}</span>
                        </div>
                        <p style={{ fontWeight:900, fontSize:'13px', color:'#fff', margin:'0 0 3px' }}>{e.Title}</p>
                        {e.Description && <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', margin:0 }}>{e.Description}</p>}
                      </div>
                      <div style={{ flexShrink:0, textAlign:'right' }}>
                        <p style={{ fontWeight:900, fontSize:'11px', color: e.Color||'#fbbf24', margin:0 }}>{e.Date}</p>
                        {e.End_Date && e.End_Date!==e.Date && <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)', margin:'2px 0 0' }}>→ {e.End_Date}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* This month events */}
            {monthEvents.length > 0 && (
              <div>
                <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.15em', fontWeight:900, margin:'0 0 10px' }}>This Month — {MONTHS[viewDate.month]}</p>
                {monthEvents.sort((a,b)=>a.Date>b.Date?1:-1).map((e,i) => (
                  <div key={i} style={{ display:'flex', gap:'12px', alignItems:'flex-start', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`${e.Color||'#fbbf24'}22`, border:`1px solid ${e.Color||'#fbbf24'}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:'9px', fontWeight:900, color:e.Color||'#fbbf24' }}>{(e.Date||'').split('-')[2]}</span>
                    </div>
                    <div>
                      <p style={{ fontWeight:900, fontSize:'12px', color:'#fff', margin:'0 0 2px' }}>{e.Title}</p>
                      <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.3)', margin:0 }}>{e.Type||'Event'}{e.Description?' · '+e.Description:''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </div>
  );
}