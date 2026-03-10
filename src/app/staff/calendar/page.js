"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

const S = {
  page:   { display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden', background:'#0f0a1e', color:'#fff', fontFamily:'system-ui,sans-serif' },
  header: { zIndex:40, background:'rgba(15,10,30,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  card:   { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', padding:'16px' },
  select: { width:'100%', background:'rgba(15,10,30,0.9)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', padding:'10px 14px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' },
  label:  { display:'block', fontSize:'9px', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'6px' },
  btnSm:  { background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'6px 12px', fontSize:'10px', fontWeight:900, cursor:'pointer', whiteSpace:'nowrap' },
  tabOn:  { background:'#fbbf24', color:'#0f172a', border:'none', borderRadius:'10px', padding:'7px 14px', fontSize:'10px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap' },
  tabOff: { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)', border:'none', borderRadius:'10px', padding:'7px 14px', fontSize:'10px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap' },
};

const DAYS_FULL    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS       = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKEND_DAYS = new Set(['Saturday','Sunday']);

const SUBJECT_COLORS = [
  {bg:'rgba(96,165,250,0.15)',  border:'rgba(96,165,250,0.4)',  text:'#93c5fd'},
  {bg:'rgba(167,139,250,0.15)', border:'rgba(167,139,250,0.4)', text:'#c4b5fd'},
  {bg:'rgba(52,211,153,0.15)',  border:'rgba(52,211,153,0.4)',  text:'#6ee7b7'},
  {bg:'rgba(251,146,60,0.15)',  border:'rgba(251,146,60,0.4)',  text:'#fdba74'},
  {bg:'rgba(244,114,182,0.15)', border:'rgba(244,114,182,0.4)', text:'#f9a8d4'},
  {bg:'rgba(34,211,238,0.15)',  border:'rgba(34,211,238,0.4)',  text:'#67e8f9'},
  {bg:'rgba(163,230,53,0.15)',  border:'rgba(163,230,53,0.4)',  text:'#bef264'},
  {bg:'rgba(251,191,36,0.15)',  border:'rgba(251,191,36,0.4)',  text:'#fbbf24'},
  {bg:'rgba(248,113,113,0.15)', border:'rgba(248,113,113,0.4)', text:'#fca5a5'},
  {bg:'rgba(45,212,191,0.15)',  border:'rgba(45,212,191,0.4)',  text:'#5eead4'},
];
const subjectColorMap = {};
const getSubjectColor = (subjectList, subject) => {
  if (!subject) return null;
  if (!subjectColorMap[subject]) {
    const idx = subjectList.indexOf(subject);
    subjectColorMap[subject] = SUBJECT_COLORS[(idx >= 0 ? idx : Object.keys(subjectColorMap).length) % SUBJECT_COLORS.length];
  }
  return subjectColorMap[subject];
};

// isBreak / isDuty detection
const isBreakPeriod = (p) =>
  p.isBreak === true || p.isBreak === 'true' ||
  ['break','lunch','recess','duty','assembly','chapel','prayer'].some(kw =>
    String(p.label || '').toLowerCase().includes(kw)
  );

const normPeriods = (arr) =>
  (arr || []).map((p, i) => ({ ...p, no: p.no ?? (i + 1), isBreak: isBreakPeriod(p) }));

// Normalize grades — old format was array, new is object {grade:[sections]}
const normalizeGrades = (raw) => {
  if (!raw) return {};
  if (Array.isArray(raw)) {
    const obj = {};
    raw.forEach(g => { obj[String(g)] = ['A']; });
    return obj;
  }
  if (typeof raw === 'object') return raw;
  return {};
};

export default function StaffCalendarPage() {
  const router = useRouter();
  const [user, setUser]           = useState(null);
  const [tab, setTab]             = useState('calendar');
  const [cfg, setCfg]             = useState(null);
  const [events, setEvents]       = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [ttCells, setTtCells]     = useState({});
  const [loading, setLoading]     = useState(true);
  const [msg, setMsg]             = useState(null);

  const today = new Date();
  const [viewDate, setViewDate]     = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDay, setSelectedDay] = useState(null);
  const [selGrade, setSelGrade]     = useState('');
  const [selSection, setSelSection] = useState('');
  const [teacherView, setTeacherView] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    setUser(u);
    fetchAll(u);
  }, []);

  const fetchAll = async (u) => {
    setLoading(true);
    try {
      const [cfgRes, evtRes] = await Promise.all([
        fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getTimetableConfig' }) }),
        fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getEvents' }) }),
      ]);
      const cfgData = await cfgRes.json();
      const evtData = await evtRes.json();

      if (cfgData.success) {
        const raw = cfgData.config || {};
        // ★ Normalize grades — always object
        raw.grades = normalizeGrades(raw.grades);
        // ★ Normalize periods
        if (!raw.periods_by_grade) raw.periods_by_grade = { default: raw.periods || [] };
        raw.periods = normPeriods(raw.periods);
        Object.keys(raw.periods_by_grade).forEach(k => {
          raw.periods_by_grade[k] = normPeriods(raw.periods_by_grade[k]);
        });
        setCfg(raw);

        // Restore saved grade/section
        const savedG = sessionStorage.getItem('staff_tt_grade');
        const savedS = sessionStorage.getItem('staff_tt_section');
        const grades  = raw.grades || {};
        const firstG  = (savedG && grades[savedG]) ? savedG : (Object.keys(grades)[0] || '');
        const secs    = grades[firstG] || [];
        const firstS  = (savedS && Array.isArray(secs) && secs.includes(savedS))
          ? savedS
          : (Array.isArray(secs) ? (secs[0] || '') : '');
        setSelGrade(firstG);
        setSelSection(firstS);
      }
      if (evtData.success) setEvents(evtData.data || []);
    } catch {}
    setLoading(false);
  };

  // ★ Grade-only fetch — section filter on frontend
  const fetchTimetable = useCallback(async (grade, section) => {
    if (!grade) return;
    try {
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'getTimetable', grade })
      });
      const r = await res.json();
      if (r.success) {
        // ★ Filter section on frontend
        const rows = (r.data || []).filter(row => {
          const stored = String(row.Section || '').trim();
          return !section || stored === '' || stored === String(section).trim();
        });
        const VDAYS = new Set(DAYS_FULL);
        const cells = {};
        rows.forEach(row => {
          let day = String(row.Day || '');
          if (!VDAYS.has(day)) {
            const parts = day.split('_');
            day = parts.find(x => VDAYS.has(x)) || day;
          }
          cells[`${day}_${String(row.Period_No)}`] = {
            subject:      row.Subject      || '',
            teacher:      row.Teacher      || '',
            asst_teacher: row.Asst_Teacher || '',
            room:         row.Room         || '',
          };
        });
        setTtCells(cells);
        setTimetable(rows);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (selGrade && tab === 'timetable') fetchTimetable(selGrade, selSection);
  }, [selGrade, selSection, tab]);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  };

  // Calendar helpers
  const monthKey    = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, '0')}`;
  const monthEvents = events.filter(e => {
    if (!(e.Date || '').startsWith(monthKey)) return false;
    const t = e.Target || 'All';
    return t === 'All' || t === 'Staff';
  });
  const daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate();
  const firstDow    = new Date(viewDate.year, viewDate.month, 1).getDay();
  const eventsByDay = {};
  monthEvents.forEach(e => {
    const d = parseInt((e.Date || '').split('-')[2]);
    if (!eventsByDay[d]) eventsByDay[d] = [];
    eventsByDay[d].push(e);
  });

  // Timetable helpers
  const getGradePeriods = (config, grade, section) => {
    if (!config) return [];
    const byGrade = config.periods_by_grade || {};
    const gLabel  = grade === 'KG' ? 'KG' : grade ? `Grade ${grade}` : 'default';
    if (section && byGrade[`${gLabel}${section}`]) return byGrade[`${gLabel}${section}`];
    if (byGrade[gLabel])    return byGrade[gLabel];
    if (byGrade['default']) return byGrade['default'];
    return normPeriods(config.periods || []);
  };

  const allTeachers = [...new Set(
    [...timetable.map(r => r.Teacher), ...timetable.map(r => r.Asst_Teacher || '')].filter(Boolean)
  )];

  const grades    = cfg ? (cfg.grades || {}) : {};
  const gradeKeys = Object.keys(grades);
  const sections  = selGrade && Array.isArray(grades[selGrade]) ? grades[selGrade] : [];
  const periods   = getGradePeriods(cfg, selGrade, selSection);

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>

      {/* Header */}
      <div style={S.header}>
        <button onClick={() => router.back()} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'14px' }}>← Back</button>
        <div style={{ textAlign:'center' }}>
          <p style={{ fontWeight:900, fontSize:'13px', textTransform:'uppercase', letterSpacing:'0.1em', margin:0 }}>Calendar & Timetable</p>
          <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)', margin:0 }}>Shining Stars</p>
        </div>
        <button onClick={() => fetchAll(user)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'18px' }}>↻</button>
      </div>

      <div style={{ flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', paddingBottom:'80px' }}>
        {msg && (
          <div style={{ position:'fixed', top:'64px', left:'50%', transform:'translateX(-50%)', zIndex:50, padding:'8px 20px', borderRadius:'999px', fontSize:'12px', fontWeight:900, color:'#fff', background:msg.type==='error'?'#ef4444':'#10b981', boxShadow:'0 4px 20px rgba(0,0,0,0.4)', whiteSpace:'nowrap' }}>
            {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex', gap:'6px', padding:'12px 16px 8px', overflowX:'auto' }}>
          {[{ id:'calendar', label:'📅 Calendar' }, { id:'timetable', label:'📋 Timetable' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={tab === t.id ? S.tabOn : S.tabOff}>{t.label}</button>
          ))}
        </div>

        <div style={{ padding:'0 16px' }}>
          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'70px 0' }}>
              <div style={{ width:'32px', height:'32px', border:'3px solid rgba(255,255,255,0.1)', borderTop:'3px solid #fbbf24', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
            </div>
          ) : (
            <>
              {/* ══════════ CALENDAR TAB ══════════ */}
              {tab === 'calendar' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginTop:'8px' }}>
                  {/* Month nav */}
                  <div style={{ ...S.card, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <button onClick={() => setViewDate(v => { const d = new Date(v.year, v.month - 1); return { year:d.getFullYear(), month:d.getMonth() }; })}
                      style={{ ...S.btnSm, background:'none', border:'none', color:'rgba(255,255,255,0.5)', fontSize:'20px' }}>‹</button>
                    <div style={{ textAlign:'center' }}>
                      <p style={{ fontWeight:900, fontSize:'16px', color:'#fff', margin:0 }}>{MONTHS[viewDate.month]} {viewDate.year}</p>
                      <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.3)', margin:0 }}>{monthEvents.length} events</p>
                    </div>
                    <button onClick={() => setViewDate(v => { const d = new Date(v.year, v.month + 1); return { year:d.getFullYear(), month:d.getMonth() }; })}
                      style={{ ...S.btnSm, background:'none', border:'none', color:'rgba(255,255,255,0.5)', fontSize:'20px' }}>›</button>
                  </div>

                  {/* Calendar grid — Sun start */}
                  <div style={{ ...S.card, padding:'12px' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px', marginBottom:'4px' }}>
                      {['S','M','T','W','T','F','S'].map((d, i) => (
                        <div key={i} style={{ textAlign:'center', fontSize:'9px', color: i===0||i===6 ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.3)', fontWeight:900, padding:'4px 0' }}>{d}</div>
                      ))}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
                      {Array(firstDow).fill(null).map((_, i) => <div key={`e${i}`} />)}
                      {Array(daysInMonth).fill(null).map((_, i) => {
                        const day     = i + 1;
                        const dow     = (firstDow + i) % 7;
                        const isWknd  = dow === 0 || dow === 6;
                        const isToday = day === today.getDate() && viewDate.month === today.getMonth() && viewDate.year === today.getFullYear();
                        const dayEvts = eventsByDay[day] || [];
                        return (
                          <div key={day} onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                            style={{ borderRadius:'8px', padding:'4px 2px', cursor:'pointer', minHeight:'36px', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px',
                              background: selectedDay===day ? 'rgba(251,191,36,0.15)' : isToday ? 'rgba(251,191,36,0.12)' : dayEvts.length ? 'rgba(255,255,255,0.06)' : 'transparent',
                              outline: isToday ? '1px solid rgba(251,191,36,0.4)' : 'none' }}>
                            <span style={{ fontSize:'11px', fontWeight:900, color: isToday?'#fbbf24':isWknd?'rgba(251,191,36,0.5)':'rgba(255,255,255,0.7)' }}>{day}</span>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:'1px', justifyContent:'center' }}>
                              {dayEvts.slice(0, 3).map((e, j) => <div key={j} style={{ width:'5px', height:'5px', borderRadius:'50%', background:e.Color||'#fbbf24' }} />)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected day events */}
                  {selectedDay && (eventsByDay[selectedDay] || []).length > 0 && (
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                      <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.15em', fontWeight:900, margin:0 }}>{MONTHS[viewDate.month]} {selectedDay}</p>
                      {eventsByDay[selectedDay].map((e, i) => (
                        <div key={i} style={{ ...S.card, padding:'12px 16px', borderLeft:`4px solid ${e.Color||'#fbbf24'}` }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px', flexWrap:'wrap' }}>
                            <span style={{ fontWeight:900, fontSize:'13px' }}>{e.Title}</span>
                            <span style={{ fontSize:'8px', padding:'2px 8px', borderRadius:'99px', fontWeight:900, background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.5)' }}>{e.Type}</span>
                          </div>
                          <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.3)', margin:0 }}>📅 {e.Date}{e.End_Date && e.End_Date !== e.Date ? ' → ' + e.End_Date : ''}</p>
                          {e.Description && <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.45)', marginTop:'4px' }}>{e.Description}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Month event list */}
                  {monthEvents.length > 0 && (
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                      <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.15em', fontWeight:900 }}>This Month</p>
                      {[...monthEvents].sort((a, b) => a.Date > b.Date ? 1 : -1).map((e, i) => (
                        <div key={i} style={{ ...S.card, padding:'12px 16px', borderLeft:`4px solid ${e.Color||'#fbbf24'}` }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px', flexWrap:'wrap' }}>
                            <span style={{ fontWeight:900, fontSize:'13px' }}>{e.Title}</span>
                            <span style={{ fontSize:'8px', padding:'2px 8px', borderRadius:'99px', fontWeight:900, background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.5)' }}>{e.Type}</span>
                          </div>
                          <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.3)', margin:0 }}>📅 {e.Date}{e.End_Date && e.End_Date !== e.Date ? ' → ' + e.End_Date : ''}</p>
                          {e.Description && <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.45)', marginTop:'4px' }}>{e.Description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {monthEvents.length === 0 && (
                    <div style={{ textAlign:'center', padding:'30px 0', color:'rgba(255,255,255,0.2)' }}>Event မရှိသေးပါ</div>
                  )}
                </div>
              )}

              {/* ══════════ TIMETABLE TAB ══════════ */}
              {tab === 'timetable' && cfg && (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginTop:'8px' }}>
                  {/* Controls */}
                  <div style={S.card}>
                    <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'flex-end' }}>
                      {/* Grade */}
                      <div style={{ flex:1, minWidth:'100px' }}>
                        <label style={S.label}>Grade</label>
                        <select value={selGrade} onChange={e => {
                          const g = e.target.value;
                          setSelGrade(g);
                          sessionStorage.setItem('staff_tt_grade', g);
                          const secs = grades[g] || [];
                          const s    = Array.isArray(secs) ? (secs[0] || '') : '';
                          setSelSection(s);
                          sessionStorage.setItem('staff_tt_section', s);
                        }} style={S.select}>
                          {gradeKeys.map(g => (
                            <option key={g} value={g} style={{ background:'#1a1030' }}>Grade {g}</option>
                          ))}
                        </select>
                      </div>
                      {/* Section — only show if multiple sections */}
                      {sections.length > 1 && (
                        <div style={{ flex:1, minWidth:'80px' }}>
                          <label style={S.label}>Section</label>
                          <select value={selSection} onChange={e => {
                            setSelSection(e.target.value);
                            sessionStorage.setItem('staff_tt_section', e.target.value);
                          }} style={S.select}>
                            {sections.map(s => (
                              <option key={s} value={s} style={{ background:'#1a1030' }}>{s}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {/* Teacher filter */}
                      {allTeachers.length > 0 && (
                        <div style={{ flex:1, minWidth:'100px' }}>
                          <label style={S.label}>Teacher Filter</label>
                          <select value={teacherView} onChange={e => setTeacherView(e.target.value)} style={S.select}>
                            <option value="" style={{ background:'#1a1030' }}>All Teachers</option>
                            {allTeachers.map(t => (
                              <option key={t} value={t} style={{ background:'#1a1030' }}>{t}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timetable grid */}
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'600px' }}>
                      <thead>
                        <tr>
                          <th style={{ padding:'8px', fontSize:'9px', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.1em', textAlign:'left', minWidth:'80px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>Period</th>
                          {(cfg.days || []).map(d => (
                            <th key={d} style={{ padding:'8px', fontSize:'9px', color:WEEKEND_DAYS.has(d)?'rgba(251,191,36,0.5)':'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.1em', textAlign:'center', borderBottom:'1px solid rgba(255,255,255,0.08)', fontWeight:900, background:WEEKEND_DAYS.has(d)?'rgba(251,191,36,0.04)':'transparent' }}>
                              {DAYS_SHORT[DAYS_FULL.indexOf(d)] || d.slice(0, 3)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {periods.map((p, pi) => {
                          const pKey     = p.no ?? (pi + 1);
                          const isDuty   = String(p.label||'').toLowerCase().includes('duty');
                          const isAssem  = String(p.label||'').toLowerCase().includes('assembly') || String(p.label||'').toLowerCase().includes('prayer');
                          // Color coding for special rows
                          const rowBg    = p.isBreak
                            ? (isDuty   ? 'rgba(251,113,133,0.07)'
                              : isAssem ? 'rgba(167,139,250,0.07)'
                              :           'rgba(251,191,36,0.07)')
                            : pi % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
                          const rowBorderColor = p.isBreak
                            ? (isDuty   ? 'rgba(251,113,133,0.5)'
                              : isAssem ? 'rgba(167,139,250,0.5)'
                              :           'rgba(251,191,36,0.4)')
                            : 'transparent';
                          const labelColor = p.isBreak
                            ? (isDuty   ? 'rgba(251,113,133,0.9)'
                              : isAssem ? 'rgba(167,139,250,0.9)'
                              :           'rgba(251,191,36,0.8)')
                            : 'rgba(255,255,255,0.6)';
                          const timeColor = p.isBreak
                            ? (isDuty   ? 'rgba(251,113,133,0.4)'
                              : isAssem ? 'rgba(167,139,250,0.4)'
                              :           'rgba(251,191,36,0.35)')
                            : 'rgba(255,255,255,0.2)';

                          return (
                            <tr key={pKey} style={{ background: rowBg }}>
                              {/* Period label */}
                              <td style={{ padding:'8px 6px', borderBottom:'1px solid rgba(255,255,255,0.04)', verticalAlign:'middle', borderLeft:`3px solid ${rowBorderColor}` }}>
                                <div style={{ fontSize:'10px', fontWeight:900, color: labelColor }}>
                                  {isDuty ? '⚑ ' : isAssem ? '🙏 ' : p.isBreak ? '☕ ' : ''}{p.label}
                                </div>
                                <div style={{ fontSize:'8px', color: timeColor }}>{p.start}–{p.end}</div>
                              </td>
                              {/* Day cells */}
                              {(cfg.days || []).map(day => {
                                const key      = `${day}_${String(pKey)}`;
                                const cell     = ttCells[key] || {};
                                const highlight = teacherView && (cell.teacher === teacherView || cell.asst_teacher === teacherView);
                                const isWknd   = WEEKEND_DAYS.has(day);

                                // Break/duty rows — show label across all days
                                if (p.isBreak) {
                                  return (
                                    <td key={day} style={{ textAlign:'center', padding:'6px', borderBottom:'1px solid rgba(255,255,255,0.04)', background:isWknd?'rgba(251,191,36,0.03)':'transparent' }}>
                                      <span style={{ fontSize:'9px', color: labelColor, fontStyle:'italic', opacity:0.5 }}>
                                        {isDuty ? 'Duty' : isAssem ? 'Assembly' : '—'}
                                      </span>
                                    </td>
                                  );
                                }

                                const sc          = highlight ? null : getSubjectColor(cfg.subjects || [], cell.subject);
                                const cellBg      = highlight ? 'rgba(251,191,36,0.12)' : sc ? sc.bg : cell.subject ? 'rgba(255,255,255,0.04)' : 'transparent';
                                const cellBorder  = highlight ? '1px solid rgba(251,191,36,0.3)' : sc ? `1px solid ${sc.border}` : 'none';
                                const subjectColor = highlight ? '#fbbf24' : sc ? sc.text : 'rgba(255,255,255,0.8)';

                                return (
                                  <td key={day} style={{ padding:'4px', borderBottom:'1px solid rgba(255,255,255,0.04)', verticalAlign:'top', background:isWknd?'rgba(251,191,36,0.025)':'transparent' }}>
                                    <div style={{ background:cellBg, borderRadius:'8px', padding:cell.subject?'6px 8px':'4px', border:cellBorder, minHeight:'36px' }}>
                                      {cell.subject ? (
                                        <>
                                          <div style={{ fontSize:'10px', fontWeight:900, color:subjectColor, lineHeight:1.2 }}>{cell.subject}</div>
                                          {cell.teacher      && <div style={{ fontSize:'8px', color:'rgba(255,255,255,0.35)', marginTop:'2px' }}>👤 {cell.teacher}</div>}
                                          {cell.asst_teacher && <div style={{ fontSize:'8px', color:'rgba(255,255,255,0.25)', marginTop:'1px' }}>👤 {cell.asst_teacher} <span style={{ fontSize:'7px', opacity:0.6 }}>(Asst)</span></div>}
                                          {cell.room         && <div style={{ fontSize:'8px', color:'rgba(255,255,255,0.25)' }}>🚪 {cell.room}</div>}
                                        </>
                                      ) : (
                                        <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.1)', textAlign:'center', paddingTop:'6px' }}>—</div>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {timetable.length === 0 && (
                    <div style={{ textAlign:'center', padding:'30px 0', color:'rgba(255,255,255,0.2)' }}>
                      Grade {selGrade} {selSection} — Timetable မသတ်မှတ်ရသေးပါ
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}