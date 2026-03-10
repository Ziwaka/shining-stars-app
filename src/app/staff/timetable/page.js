"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const S = {
  page:   { display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden', background:'#0f0a1e', color:'#fff', fontFamily:'system-ui,sans-serif' },
  header: { flexShrink:0, background:'rgba(15,10,30,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  card:   { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', padding:'16px' },
};

const fixBreak = (p) =>
  p.isBreak===true || p.isBreak==='true' ||
  String(p.label).toLowerCase().includes('break') ||
  String(p.label).toLowerCase().includes('lunch') ||
  String(p.label).toLowerCase().includes('recess');

export default function StaffTimetablePage() {
  const router = useRouter();
  const [user, setUser]       = useState(null);
  const [cfg, setCfg]         = useState(null);
  const [rows, setRows]       = useState([]);
  const [selDay, setSelDay]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    setUser(u);
    setSelDay(DAYS[new Date().getDay()]);
    fetchAll(u);
  }, []);

  const teacherName = (u) => u?.['Name (ALL CAPITAL)'] || u?.Name || u?.name || u?.username || '';

  const fetchAll = async (u) => {
    const name = teacherName(u);
    try {
      const [cfgRes, ttRes] = await Promise.all([
        fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getTimetableConfig' }) }),
        fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getTimetable', teacher: name }) }),
      ]);
      const cfgData = await cfgRes.json();
      const ttData  = await ttRes.json();
      if (cfgData.success) {
        const raw = cfgData.config;
        // Use periods_by_grade default if periods is empty
        if (!raw.periods?.length) {
          const pbg = raw.periods_by_grade || {};
          raw.periods = pbg['default'] || pbg[Object.keys(pbg)[0]] || [];
        }
        if (raw.periods) raw.periods = raw.periods.map((p,i) => ({ ...p, no: p.no ?? (i+1), isBreak: fixBreak(p) }));
        setCfg(raw);
      }
      if (ttData.success) setRows(ttData.data || []);
    } catch {}
    setLoading(false);
  };

  const todayDay   = DAYS[new Date().getDay()];
  const activeDays = cfg?.days || [];
  const periods    = cfg?.periods || [];
  const nowMins    = new Date().getHours()*60 + new Date().getMinutes();
  const toMins     = (t) => { if(!t) return 0; const[h,m]=t.split(':').map(Number); return h*60+(m||0); };
  const currentPeriod = selDay===todayDay
    ? (periods.find(p => !fixBreak(p) && p.start && toMins(p.start)<=nowMins && nowMins<toMins(p.end))?.no ?? null)
    : null;
  const getCell = (day, periodNo) => rows.find(r => r.Day===day && String(r.Period_No)===String(periodNo)) || null;

  // ── PRINT ──────────────────────────────────────────────────
  const handlePrint = () => {
    const name = teacherName(user);
    let html = `<html><head><title>${name} - Personal Timetable</title><style>
      body{font-family:Arial,sans-serif;font-size:11px;color:#000;padding:24px;margin:0}
      h2{margin:0 0 2px;font-size:18px}p.sub{margin:0 0 16px;color:#666;font-size:11px}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #ccc;padding:7px 9px;text-align:center;font-size:10px;vertical-align:top}
      th{background:#f5f5f5;font-weight:bold}td.period{text-align:left;white-space:nowrap;color:#555}
      .break-row td{background:#fffbea;color:#92400e;font-style:italic;text-align:center}
      strong{display:block;font-size:11px}.grade{font-size:9px;color:#888}.room{font-size:9px;color:#555}
      @media print{@page{margin:1cm}}</style></head><body>
    <h2>📅 ${name}</h2>
    <p class="sub">Personal Timetable · Shining Stars School · ${new Date().toLocaleDateString()}</p>
    <table><thead><tr><th>Period</th><th>Time</th>${activeDays.map(d=>`<th>${DAYS_SHORT[DAYS.indexOf(d)]||d.slice(0,3)}</th>`).join('')}</tr></thead><tbody>`;
    periods.forEach(p => {
      if (fixBreak(p)) {
        html += `<tr class="break-row"><td colspan="${activeDays.length+2}">${p.label}&nbsp;&nbsp;${p.start||''}–${p.end||''}</td></tr>`;
      } else {
        html += `<tr><td class="period">${p.label}</td><td class="period">${p.start||''}–${p.end||''}</td>`;
        activeDays.forEach(day => {
          const r = rows.find(r=>r.Day===day && String(r.Period_No)===String(p.no));
          html += r
            ? `<td><strong>${r.Subject}</strong>${r.Grade?`<span class="grade"> G${r.Grade}${r.Section||''}</span>`:''}${r.Room?`<span class="room"> 🚪${r.Room}</span>`:''}</td>`
            : `<td style="color:#ddd">—</td>`;
        });
        html += `</tr>`;
      }
    });
    html += `</tbody></table></body></html>`;
    const w = window.open('','_blank','width=1000,height=700');
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => w.print(), 400);
  };

  // ── CSV EXPORT ─────────────────────────────────────────────
  const handleExcel = () => {
    const name = teacherName(user);
    let csv = `Personal Timetable - ${name}\nShining Stars School · ${new Date().toLocaleDateString()}\n\n`;
    csv += `Period,Time,${activeDays.map(d=>DAYS_SHORT[DAYS.indexOf(d)]||d.slice(0,3)).join(',')}\n`;
    periods.forEach(p => {
      if (fixBreak(p)) {
        csv += `"${p.label} (Break)","${p.start||''}-${p.end||''}",${activeDays.map(()=>'').join(',')}\n`;
      } else {
        const cells = activeDays.map(day => {
          const r = rows.find(r=>r.Day===day && String(r.Period_No)===String(p.no));
          return r ? `"${r.Subject}${r.Grade?' G'+r.Grade+(r.Section||''):''}${r.Room?' R:'+r.Room:''}"` : '';
        });
        csv += `"${p.label}","${p.start||''}-${p.end||''}",${cells.join(',')}\n`;
      }
    });
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href=url; a.download=`Timetable_${name.replace(/\s+/g,'_')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>
      <div style={S.header}>
        <button onClick={()=>router.back()} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'14px'}}>← Back</button>
        <div style={{textAlign:'center'}}>
          <p style={{fontWeight:900,fontSize:'13px',textTransform:'uppercase',letterSpacing:'0.1em',margin:0}}>My Timetable</p>
          <p style={{fontSize:'9px',color:'rgba(255,255,255,0.3)',margin:0}}>{user ? teacherName(user) : ''}</p>
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          <button onClick={handleExcel} title="CSV Export"
            style={{background:'rgba(52,211,153,0.15)',border:'1px solid rgba(52,211,153,0.3)',color:'#6ee7b7',borderRadius:'10px',padding:'6px 12px',cursor:'pointer',fontSize:'13px'}}>
            📊 CSV
          </button>
          <button onClick={handlePrint} title="Print"
            style={{background:'rgba(96,165,250,0.15)',border:'1px solid rgba(96,165,250,0.3)',color:'#93c5fd',borderRadius:'10px',padding:'6px 12px',cursor:'pointer',fontSize:'13px'}}>
            🖨️
          </button>
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',paddingBottom:'80px'}}>
        <div style={{padding:'16px',maxWidth:'640px',margin:'0 auto',display:'flex',flexDirection:'column',gap:'12px'}}>
          {loading ? (
            <div style={{display:'flex',justifyContent:'center',padding:'60px 0'}}>
              <div style={{width:'32px',height:'32px',border:'3px solid rgba(255,255,255,0.1)',borderTop:'3px solid #fbbf24',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
            </div>
          ) : (
            <>
              {/* Day tabs */}
              <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'4px'}}>
                {activeDays.map(day => {
                  const isToday = day===todayDay; const isSel = day===selDay;
                  const idx = DAYS.indexOf(day);
                  const hasClass = rows.some(r=>r.Day===day);
                  return (
                    <button key={day} onClick={()=>setSelDay(day)}
                      style={{flexShrink:0,padding:'8px 14px',borderRadius:'12px',border:'none',cursor:'pointer',fontWeight:900,fontSize:'10px',
                        background:isSel?'#fbbf24':isToday?'rgba(251,191,36,0.1)':'rgba(255,255,255,0.05)',
                        color:isSel?'#0f172a':isToday?'#fbbf24':hasClass?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.3)',
                        outline:isToday&&!isSel?'1px solid rgba(251,191,36,0.3)':'none'}}>
                      {DAYS_SHORT[idx]||day.slice(0,3)}
                      {isToday && <div style={{fontSize:'7px',marginTop:'2px',opacity:0.7}}>TODAY</div>}
                    </button>
                  );
                })}
              </div>

              {/* Day detail */}
              <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                {periods.length===0 ? (
                  <div style={{textAlign:'center',padding:'40px 0',color:'rgba(255,255,255,0.2)'}}>Config မသတ်မှတ်ရသေးပါ</div>
                ) : periods.map((p,i) => {
                  const isBreak = fixBreak(p);
                  const cell    = isBreak ? null : getCell(selDay, p.no);
                  const isCurrent = currentPeriod===p.no;
                  const isPast  = selDay===todayDay && p.end && nowMins>toMins(p.end);
                  if (isBreak) return (
                    <div key={i} style={{display:'flex',alignItems:'center',gap:'12px',padding:'6px 8px'}}>
                      <div style={{fontSize:'9px',color:'rgba(255,255,255,0.15)',minWidth:'80px',textAlign:'right'}}>{p.start}–{p.end}</div>
                      <div style={{flex:1,height:'1px',background:'rgba(255,255,255,0.05)'}}/>
                      <div style={{fontSize:'9px',color:'rgba(255,255,255,0.15)',fontStyle:'italic'}}>{p.label}</div>
                      <div style={{flex:1,height:'1px',background:'rgba(255,255,255,0.05)'}}/>
                    </div>
                  );
                  return (
                    <div key={i} style={{
                      background:isCurrent?'rgba(251,191,36,0.1)':cell?'rgba(96,165,250,0.07)':'rgba(255,255,255,0.03)',
                      border:`1px solid ${isCurrent?'rgba(251,191,36,0.4)':cell?'rgba(96,165,250,0.2)':'rgba(255,255,255,0.06)'}`,
                      borderLeft:`4px solid ${isCurrent?'#fbbf24':cell?'#60a5fa':'rgba(255,255,255,0.06)'}`,
                      borderRadius:'12px',padding:'12px 14px',display:'flex',alignItems:'center',gap:'12px',opacity:isPast?0.5:1}}>
                      <div style={{flexShrink:0,textAlign:'center',minWidth:'52px'}}>
                        <div style={{fontSize:'9px',color:'rgba(255,255,255,0.25)',marginBottom:'2px'}}>{p.start}</div>
                        <div style={{fontSize:'9px',color:isCurrent?'#fbbf24':'rgba(255,255,255,0.3)',fontWeight:900}}>{p.label}</div>
                        <div style={{fontSize:'9px',color:'rgba(255,255,255,0.25)'}}>{p.end}</div>
                      </div>
                      <div style={{flex:1}}>
                        {cell ? (
                          <>
                            <p style={{fontWeight:900,fontSize:'14px',color:isCurrent?'#fbbf24':'#93c5fd',margin:'0 0 4px'}}>{cell.Subject}</p>
                            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                              {cell.Grade && <span style={{fontSize:'9px',color:'rgba(255,255,255,0.4)',background:'rgba(255,255,255,0.07)',padding:'2px 8px',borderRadius:'6px'}}>Grade {cell.Grade}{cell.Section||''}</span>}
                              {cell.Room  && <span style={{fontSize:'9px',color:'rgba(255,255,255,0.35)'}}>🚪 {cell.Room}</span>}
                              {cell.Asst_Teacher && <span style={{fontSize:'9px',color:'rgba(255,255,255,0.3)'}}>👤 {cell.Asst_Teacher} <span style={{opacity:0.5}}>(Asst)</span></span>}
                            </div>
                          </>
                        ) : (
                          <p style={{fontSize:'11px',color:'rgba(255,255,255,0.15)',fontStyle:'italic',margin:0}}>— အားချိန် —</p>
                        )}
                      </div>
                      {isCurrent && cell && (
                        <div style={{flexShrink:0,background:'#fbbf24',color:'#0f172a',fontSize:'8px',fontWeight:900,padding:'3px 8px',borderRadius:'99px',textTransform:'uppercase'}}>Now</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Weekly grid */}
              <div style={S.card}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                  <p style={{fontSize:'9px',color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'0.15em',fontWeight:900,margin:0}}>Weekly Overview</p>
                  <span style={{fontSize:'9px',color:'rgba(255,255,255,0.25)'}}>{rows.length} class{rows.length!==1?'es':''}</span>
                </div>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',minWidth:'400px'}}>
                    <thead>
                      <tr>
                        <th style={{padding:'4px 6px',fontSize:'8px',color:'rgba(255,255,255,0.25)',textAlign:'left',fontWeight:900,textTransform:'uppercase'}}>Period</th>
                        {activeDays.map(d=>(
                          <th key={d} style={{padding:'4px 6px',fontSize:'8px',color:d===todayDay?'#fbbf24':'rgba(255,255,255,0.25)',textAlign:'center',fontWeight:900,textTransform:'uppercase'}}>
                            {DAYS_SHORT[DAYS.indexOf(d)]||d.slice(0,3)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {periods.filter(p=>!fixBreak(p)).map((p,i)=>(
                        <tr key={i}>
                          <td style={{padding:'4px 6px',fontSize:'8px',color:'rgba(255,255,255,0.3)',whiteSpace:'nowrap'}}>{p.label}</td>
                          {activeDays.map(day=>{
                            const r = rows.find(r=>r.Day===day && String(r.Period_No)===String(p.no));
                            const isNow = day===todayDay && currentPeriod===p.no;
                            return (
                              <td key={day} style={{padding:'4px 6px',textAlign:'center'}}>
                                <div style={{fontSize:'9px',fontWeight:900,color:isNow?'#fbbf24':r?'#93c5fd':'rgba(255,255,255,0.1)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'60px'}}>
                                  {r?(r.Subject?.split(' ')[0]||'—'):'—'}
                                </div>
                                {r?.Grade && <div style={{fontSize:'7px',color:'rgba(255,255,255,0.2)'}}>G{r.Grade}{r.Section||''}</div>}
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
    </div>
  );
}