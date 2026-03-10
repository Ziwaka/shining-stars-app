"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

const S = {
  page: { display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', background:'#0f0a1e', color:'#fff', fontFamily:'system-ui,sans-serif' },
  header: {flexShrink:0, zIndex:40, background:'rgba(15,10,30,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between'},
  card:    { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', padding:'16px' },
  input:   { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', padding:'10px 14px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' },
  select:  { width:'100%', background:'rgba(15,10,30,0.9)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', padding:'10px 14px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' },
  label:   { display:'block', fontSize:'9px', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'6px' },
  btn:     { background:'#fbbf24', color:'#0f172a', border:'none', borderRadius:'14px', padding:'12px', fontSize:'13px', fontWeight:900, width:'100%', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.06em' },
  btnSm:   { background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'6px 12px', fontSize:'10px', fontWeight:900, cursor:'pointer', whiteSpace:'nowrap' },
  tabOn:   { background:'#fbbf24', color:'#0f172a', border:'none', borderRadius:'10px', padding:'7px 14px', fontSize:'10px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap' },
  tabOff:  { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)', border:'none', borderRadius:'10px', padding:'7px 14px', fontSize:'10px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap' },
};

const EVENT_TYPES  = ['Holiday','Exam','Sports','Activity','Meeting','Other'];
const EVENT_COLORS = ['#fbbf24','#60a5fa','#34d399','#f87171','#c084fc','#fb923c','#e879f9'];
const DAYS_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const WEEKEND_DAYS = new Set(['Saturday','Sunday']);
// Deterministic pastel color per subject name
const SUBJECT_COLORS = [
  {bg:'rgba(96,165,250,0.15)',  border:'rgba(96,165,250,0.4)',  text:'#93c5fd'},  // blue
  {bg:'rgba(167,139,250,0.15)', border:'rgba(167,139,250,0.4)', text:'#c4b5fd'},  // purple
  {bg:'rgba(52,211,153,0.15)',  border:'rgba(52,211,153,0.4)',  text:'#6ee7b7'},  // green
  {bg:'rgba(251,146,60,0.15)',  border:'rgba(251,146,60,0.4)',  text:'#fdba74'},  // orange
  {bg:'rgba(244,114,182,0.15)', border:'rgba(244,114,182,0.4)', text:'#f9a8d4'},  // pink
  {bg:'rgba(34,211,238,0.15)',  border:'rgba(34,211,238,0.4)',  text:'#67e8f9'},  // cyan
  {bg:'rgba(163,230,53,0.15)',  border:'rgba(163,230,53,0.4)',  text:'#bef264'},  // lime
  {bg:'rgba(251,191,36,0.15)',  border:'rgba(251,191,36,0.4)',  text:'#fbbf24'},  // amber
  {bg:'rgba(248,113,113,0.15)', border:'rgba(248,113,113,0.4)', text:'#fca5a5'},  // red
  {bg:'rgba(45,212,191,0.15)',  border:'rgba(45,212,191,0.4)',  text:'#5eead4'},  // teal
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
const MONTHS       = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function CalendarTimetablePage() {
  const router = useRouter();
  const [user, setUser]         = useState(null);
  const [isMgt, setIsMgt]       = useState(false);
  const [tab, setTab]           = useState('calendar');
  const [cfg, setCfg]           = useState(null);
  const [events, setEvents]     = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState(null);

  // Calendar state
  const today    = new Date();
  const [viewDate, setViewDate] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [eventForm, setEventForm] = useState({ Date:'', End_Date:'', Title:'', Type:'Holiday', Description:'', Target:'All', Color:'#fbbf24' });
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  // Timetable state
  const [selGrade, setSelGrade]   = useState('');
  const [selSection, setSelSection] = useState('');
  const [selDay, setSelDay]         = useState('');
  const [editMode, setEditMode] = useState(false);
  const [ttCells, setTtCells]   = useState({}); // {day_period: {subject,teacher,room}}
  const [teacherView, setTeacherView] = useState('');
  const [staffList, setStaffList]     = useState([]);

  // Config state
  const [cfgTab, setCfgTab]         = useState('periods');
  const [cfgPeriodGrade, setCfgPeriodGrade] = useState('default');
  const [editCfg, setEditCfg]   = useState(null);
  const [dragIdx, setDragIdx]   = useState(null);
  const [conflicts, setConflicts] = useState([]); // [{teacher, day, period, grades:[]}]

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    setUser(u);
    setIsMgt(u.userRole === 'management');
    fetchAll(u);
  }, []);

  const fetchAll = async (u) => {
    setLoading(true);
    try {
      const [cfgRes, evtRes, staffRes] = await Promise.all([
        fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getTimetableConfig' }) }),
        fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getEvents' }) }),
        fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getData', sheetName:'Staff_Directory' }) }),
      ]);
      const cfgData   = await cfgRes.json();
      const evtData   = await evtRes.json();
      const staffData = await staffRes.json();
      if (cfgData.success) {
        // Normalize grades: old format is array ['KG','1',...], new format is object {'KG':['A'],...}
        const rawCfg = cfgData.config;
        if (Array.isArray(rawCfg.grades)) {
          const obj = {};
          rawCfg.grades.forEach(g => { obj[g] = ['A']; });
          rawCfg.grades = obj;
        }
        if (!rawCfg.grades || typeof rawCfg.grades !== 'object') rawCfg.grades = {};
        // Normalize periods_by_grade
        if (!rawCfg.periods_by_grade) rawCfg.periods_by_grade = { default: rawCfg.periods || [] };
        // Normalize isBreak to boolean (GAS sometimes returns string)
        const normPeriods = (arr) => (arr||[]).map((p,i) => ({...p, no: p.no ?? (i+1), isBreak: p.isBreak===true||p.isBreak==='true'||String(p.label).toLowerCase().includes('break')||String(p.label).toLowerCase().includes('lunch')}));
        rawCfg.periods = normPeriods(rawCfg.periods);
        Object.keys(rawCfg.periods_by_grade).forEach(k => { rawCfg.periods_by_grade[k] = normPeriods(rawCfg.periods_by_grade[k]); });
        setCfg(rawCfg);
        setEditCfg(JSON.parse(JSON.stringify(rawCfg)));
        // Restore last selected grade/section from session, fallback to first grade
        const savedGrade = sessionStorage.getItem('tt_grade');
        const savedSec   = sessionStorage.getItem('tt_section');
        const grades     = rawCfg.grades || {};
        const firstG     = (savedGrade && grades[savedGrade]) ? savedGrade : (Object.keys(grades)[0] || '');
        const firstSecs  = grades[firstG] || [];
        const firstSec   = (savedSec && firstSecs.includes(savedSec)) ? savedSec : (Array.isArray(firstSecs) ? firstSecs[0]||'' : '');
        setSelGrade(firstG);
        setSelSection(firstSec);
        if (rawCfg.days?.[0]) setSelDay(rawCfg.days[0]);
      }
      if (evtData.success) setEvents(evtData.data || []);
      if (staffData.success) setStaffList(staffData.data || []);
    } catch {}
    setLoading(false);
  };

  const ttCacheKey = (g, s) => `tt_cells_${g}_${s}`;

  const fetchTimetable = async (grade, section) => {
    if (!grade) return;
    const VDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        // ★ grade ပဲ GAS ပို့မည် — section filter ကို frontend မှာ လုပ်မည်
        const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getTimetable', grade }) });
        const r = await res.json();
        if (r.success) {
          const rows = (r.data || []).filter(row => {
            // ★ Frontend section filter — blank stored = any section
            const stored = String(row.Section || '').trim();
            return !section || stored === '' || stored === String(section).trim();
          });
          const cells = {};
          rows.forEach(row => {
            let day = String(row.Day || '');
            if (!VDAYS.includes(day)) {
              const p = day.split('_');
              day = p.find(x => VDAYS.includes(x)) || day;
            }
            const k = `${day}_${String(row.Period_No)}`;
            cells[k] = { subject: row.Subject, teacher: row.Teacher, asst_teacher: row.Asst_Teacher||'', room: row.Room };
          });
          setTtCells(cells);
          setTimetable(rows);
          return;
        }
      } catch(e) {
        if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  useEffect(() => { if (selGrade && selSection && tab === 'timetable') fetchTimetable(selGrade, selSection); }, [selGrade, selSection, tab]);

  const showMsg = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg(null),3500); };

  // ── CALENDAR HELPERS ──
  const monthKey = `${viewDate.year}-${String(viewDate.month+1).padStart(2,'0')}`;
  const monthEvents = events.filter(e => (e.Date||'').startsWith(monthKey));
  const daysInMonth = new Date(viewDate.year, viewDate.month+1, 0).getDate();
  const firstDow    = (new Date(viewDate.year, viewDate.month, 1).getDay()+6)%7; // Mon=0
  const eventsByDay = {};
  monthEvents.forEach(e => {
    const d = parseInt((e.Date||'').split('-')[2]);
    if (!eventsByDay[d]) eventsByDay[d] = [];
    eventsByDay[d].push(e);
  });

  const handleSaveEvent = async () => {
    if (!eventForm.Date || !eventForm.Title) return showMsg('Date နှင့် Title ထည့်ပါ', 'error');
    setSaving(true);
    try {
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'saveEvent', ...eventForm, Created_By: user?.Name||user?.name||user?.username }) });
      const r = await res.json();
      if (r.success) {
        showMsg(r.message);
        setShowEventForm(false);
        setEventForm({ Date:'', End_Date:'', Title:'', Type:'Holiday', Description:'', Target:'All', Color:'#fbbf24' });
        fetchAll(user);
      } else showMsg(r.message||'Error','error');
    } catch { showMsg('Network error','error'); }
    setSaving(false);
  };

  const handleDeleteEvent = async (e) => {
    if (!confirm(`"${e.Title}" ဖျက်မှာ သေချာပါသလား?`)) return;
    try {
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'deleteEvent', Date:e.Date, Title:e.Title }) });
      const r = await res.json();
      if (r.success) { showMsg(r.message); fetchAll(user); }
    } catch {}
  };

  // ── TIMETABLE HELPERS ──
  const handleCellChange = (day, periodNo, field, value) => {
    const key = `${day}_${String(periodNo)}`;
    console.log('[TT] cellChange key='+key+' field='+field+' val='+value);
    setTtCells(prev => ({ ...prev, [key]: { ...(prev[key]||{}), [field]:value } }));
  };

  const handleSaveTimetable = async () => {
    if (!selGrade || !selSection) return showMsg('Grade နှင့် Section ရွေးပါ', 'error');
    setSaving(true);

    // Build ALL cells at once — single call with allDays:true
    const allCells = [];
    Object.entries(ttCells).forEach(([key, val]) => {
      if (val.subject) {
        const parts = key.split('_');
        const day    = parts[0];
        const period = parts.slice(1).join('_');
        allCells.push({
          Grade:        selGrade,
          Section:      selSection,
          Day:          day,
          Period_No:    period,
          Subject:      val.subject,
          Teacher:      val.teacher      || '',
          Asst_Teacher: val.asst_teacher || '',
          Room:         val.room         || ''
        });
      }
    });

    try {
      // Single GAS call — delete all for this grade+section, then write all cells
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({
        action:     'saveTimetable',
        grade:      selGrade,
        section:    selSection,
        allDays:    true,
        cells:      allCells,
        Updated_By: user?.Name || user?.name || user?.username
      })});
      const r = await res.json();

      if (r.success) {
        showMsg('Timetable သိမ်းပြီးပါပြီ ✓');
        setEditMode(false);
      } else {
        showMsg('မသိမ်းရပါ: ' + (r.message || 'GAS error'), 'error');
      }
    } catch(err) {
      showMsg('Network error — ' + err.message, 'error');
    }
    setSaving(false);
  };

  const handleSaveConfig = async (silent=false) => {
    if (!silent) setSaving(true);
    if (!silent) showMsg('သိမ်းနေသည်…');
    try {
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'saveTimetableConfig', ...editCfg, periods_by_grade: editCfg.periods_by_grade||{default: editCfg.periods||[]} }) });
      const r = await res.json();
      if (r.success) {
        if (!silent) showMsg(r.message || 'Config သိမ်းပြီးပါပြီ ✓');
        const newCfg = JSON.parse(JSON.stringify(editCfg));
        setCfg(newCfg);
      } else {
        showMsg('မသိမ်းရပါ: ' + (r.message||'GAS error'), 'error');
      }
    } catch(e) { showMsg('Network error — ' + e.message, 'error'); }
    if (!silent) setSaving(false);
  };


  // ── Conflict detection ──
  const checkConflicts = async () => {
    if (!cfg) return;
    showMsg('Conflict စစ်နေသည်…');
    try {
      // Fetch all grades' timetables
      const grades = Object.keys(cfg.grades || {});
      const allRows = [];
      await Promise.all(grades.map(async g => {
        const secs = cfg.grades[g] || ['A'];
        await Promise.all(secs.map(async sec => {
          const res = await fetch(WEB_APP_URL,{method:'POST',body:JSON.stringify({action:'getTimetable',grade:g})});
          const r = await res.json();
          if (r.success) {
            (r.data||[]).filter(row=>{
              const stored=String(row.Section||'').trim();
              return !sec||stored===''||stored===sec;
            }).forEach(row=>{
              if(row.Teacher) allRows.push({teacher:row.Teacher,day:row.Day,period:String(row.Period_No),grade:g,section:sec});
              if(row.Asst_Teacher) allRows.push({teacher:row.Asst_Teacher,day:row.Day,period:String(row.Period_No),grade:g,section:sec});
            });
          }
        }));
      }));
      // Group by teacher+day+period
      const map = {};
      allRows.forEach(r=>{
        const k = r.teacher+'|'+r.day+'|'+r.period;
        if(!map[k]) map[k]={teacher:r.teacher,day:r.day,period:r.period,assignments:[]};
        map[k].assignments.push(r.grade+(r.section?'/'+r.section:''));
      });
      const found = Object.values(map).filter(v=>v.assignments.length>1);
      setConflicts(found);
      if(found.length===0) showMsg('Conflict မရှိပါ ✓');
      else showMsg(found.length+' conflict တွေ့ရသည်!','error');
    } catch(e){ showMsg('Error: '+e.message,'error'); }
  };

  // ── Helper: get periods for a grade+section (fallback chain: Grade12A → Grade12 → default) ──
  // Always normalize isBreak at render time — covers old data + GAS string issues
  const fixBreak = (arr) => (arr||[]).map((p,i) => {
    const lbl = String(p.label||'').toLowerCase();
    const autoBreak = ['break','lunch','recess','duty','assembly','prayer','chapel','နားချိန်','အနားယူ'].some(kw=>lbl.includes(kw));
    return { ...p, no: p.no ?? (i+1), isBreak: p.isBreak===true || p.isBreak==='true' || autoBreak };
  });

  const getGradePeriods = (config, grade, section) => {
    if (!config) return [];
    const byGrade = config.periods_by_grade || {};
    const gLabel = grade === 'KG' ? 'KG' : grade ? `Grade ${grade}` : 'default';
    // 1. Try grade+section key e.g. "Grade 12A"
    if (section && byGrade[`${gLabel}${section}`]) return fixBreak(byGrade[`${gLabel}${section}`]);
    // 2. Try grade-only key e.g. "Grade 12"
    if (byGrade[gLabel]) return fixBreak(byGrade[gLabel]);
    // 3. Fallback to default
    return fixBreak(byGrade['default'] || config.periods || []);
  };

  // Teacher view — filter timetable by teacher
  const teacherSchedule = timetable.filter(r => !teacherView || r.Teacher === teacherView);
  const allTeachers = [...new Set([...timetable.map(r=>r.Teacher), ...timetable.map(r=>r.Asst_Teacher)].filter(Boolean))];

  const MAIN_TABS = [
    { id:'calendar',   label:'📅 Calendar' },
    { id:'timetable',  label:'📋 Timetable' },
    ...(isMgt ? [{ id:'config', label:'⚙️ Config' }] : []),
  ];

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>

      <div style={S.header}>
        <button onClick={()=>router.back()} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'14px'}}>← Back</button>
        <div style={{textAlign:'center'}}>
          <p style={{fontWeight:900,fontSize:'13px',textTransform:'uppercase',letterSpacing:'0.1em',margin:0}}>Calendar & Timetable</p>
          <p style={{fontSize:'9px',color:'rgba(255,255,255,0.25)',margin:0,textTransform:'uppercase',letterSpacing:'0.1em'}}>Shining Stars</p>
        </div>
        <button onClick={()=>fetchAll(user)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'18px'}}>↻</button>
      </div>
      <div style={{flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', paddingBottom:'80px'}}>

      {msg && (
        <div style={{position:'fixed',top:'64px',left:'50%',transform:'translateX(-50%)',zIndex:50,padding:'8px 20px',borderRadius:'999px',fontSize:'12px',fontWeight:900,color:'#fff',background:msg.type==='error'?'#ef4444':'#10b981',boxShadow:'0 4px 20px rgba(0,0,0,0.4)',whiteSpace:'nowrap'}}>
          {msg.text}
        </div>
      )}

      <div style={{display:'flex',gap:'6px',padding:'12px 16px 8px',overflowX:'auto'}}>
        {MAIN_TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={tab===t.id?S.tabOn:S.tabOff}>{t.label}</button>)}
      </div>

      <div style={{padding:'0 16px'}}>
        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'70px 0'}}>
            <div style={{width:'32px',height:'32px',border:'3px solid rgba(255,255,255,0.1)',borderTop:'3px solid #fbbf24',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
          </div>
        ) : (
          <>
            {/* ══════════════ CALENDAR ══════════════ */}
            {tab==='calendar' && (
              <div style={{display:'flex',flexDirection:'column',gap:'12px',marginTop:'8px'}}>

                {/* Month nav */}
                <div style={{...S.card,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <button onClick={()=>setViewDate(v=>{ const d=new Date(v.year,v.month-1); return {year:d.getFullYear(),month:d.getMonth()}; })}
                    style={{...S.btnSm,background:'none',border:'none',color:'rgba(255,255,255,0.5)',fontSize:'20px'}}>‹</button>
                  <div style={{textAlign:'center'}}>
                    <p style={{fontWeight:900,fontSize:'16px',color:'#fff',margin:0}}>{MONTHS[viewDate.month]} {viewDate.year}</p>
                    <p style={{fontSize:'9px',color:'rgba(255,255,255,0.3)',margin:0}}>{monthEvents.length} events</p>
                  </div>
                  <button onClick={()=>setViewDate(v=>{ const d=new Date(v.year,v.month+1); return {year:d.getFullYear(),month:d.getMonth()}; })}
                    style={{...S.btnSm,background:'none',border:'none',color:'rgba(255,255,255,0.5)',fontSize:'20px'}}>›</button>
                </div>

                {/* Calendar grid */}
                <div style={{...S.card,padding:'12px'}}>
                  {/* Day headers */}
                  <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px',marginBottom:'4px'}}>
                    {['M','T','W','T','F','S','S'].map((d,i)=>(
                      <div key={i} style={{textAlign:'center',fontSize:'9px',color:'rgba(255,255,255,0.3)',fontWeight:900,padding:'4px 0'}}>{d}</div>
                    ))}
                  </div>
                  {/* Day cells */}
                  <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px'}}>
                    {Array(firstDow).fill(null).map((_,i)=><div key={`e${i}`}/>)}
                    {Array(daysInMonth).fill(null).map((_,i)=>{
                      const day  = i+1;
                      const isToday = day===today.getDate() && viewDate.month===today.getMonth() && viewDate.year===today.getFullYear();
                      const dayEvts = eventsByDay[day] || [];
                      return (
                        <button key={day} onClick={()=>{ setSelectedDay(day); if(isMgt){ setEventForm(f=>({...f,Date:`${viewDate.year}-${String(viewDate.month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`})); setShowEventForm(true); }}}
                          style={{border:'none',borderRadius:'8px',padding:'4px 2px',cursor:isMgt?'pointer':'default',minHeight:'36px',display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',
                            background: isToday?'rgba(251,191,36,0.2)':dayEvts.length?'rgba(255,255,255,0.06)':'transparent',
                            outline: isToday?'1px solid rgba(251,191,36,0.5)':'none'}}>
                          <span style={{fontSize:'11px',fontWeight:900,color:isToday?'#fbbf24':'rgba(255,255,255,0.7)'}}>{day}</span>
                          <div style={{display:'flex',flexWrap:'wrap',gap:'1px',justifyContent:'center'}}>
                            {dayEvts.slice(0,3).map((e,j)=>(
                              <div key={j} style={{width:'5px',height:'5px',borderRadius:'50%',background:e.Color||'#fbbf24'}}/>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Add event button */}
                {isMgt && (
                  <button onClick={()=>{ setEventForm(f=>({...f,Date:''})); setShowEventForm(true); }}
                    style={S.btn}>+ Add Event</button>
                )}

                {/* Event list */}
                {monthEvents.length > 0 && (
                  <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                    <p style={{fontSize:'9px',color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.15em',fontWeight:900}}>This Month</p>
                    {monthEvents.sort((a,b)=>a.Date>b.Date?1:-1).map((e,i)=>(
                      <div key={i} style={{...S.card,padding:'12px 16px',borderLeft:`4px solid ${e.Color||'#fbbf24'}`,display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px',flexWrap:'wrap'}}>
                            <span style={{fontWeight:900,fontSize:'13px'}}>{e.Title}</span>
                            <span style={{fontSize:'8px',padding:'2px 8px',borderRadius:'99px',fontWeight:900,background:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.5)'}}>{e.Type}</span>
                          </div>
                          <p style={{fontSize:'9px',color:'rgba(255,255,255,0.3)',margin:0}}>
                            📅 {e.Date}{e.End_Date&&e.End_Date!==e.Date?' → '+e.End_Date:''} · 👥 {e.Target||'All'}
                          </p>
                          {e.Description && <p style={{fontSize:'11px',color:'rgba(255,255,255,0.45)',marginTop:'4px'}}>{e.Description}</p>}
                        </div>
                        {isMgt && (
                          <button onClick={()=>handleDeleteEvent(e)}
                            style={{background:'none',border:'none',color:'rgba(248,113,113,0.6)',cursor:'pointer',fontSize:'14px',marginLeft:'8px',padding:'4px',flexShrink:0}}>🗑</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {monthEvents.length === 0 && (
                  <div style={{textAlign:'center',padding:'30px 0',color:'rgba(255,255,255,0.2)'}}>
                    {isMgt ? 'Event မရှိသေးပါ — "+ ADD EVENT" ကိုနှိပ်ပါ' : 'Event မရှိသေးပါ'}
                  </div>
                )}
              </div>
            )}

            {/* ══════════════ TIMETABLE ══════════════ */}
            {tab==='timetable' && cfg && (
              <div style={{display:'flex',flexDirection:'column',gap:'12px',marginTop:'8px'}}>
                {/* Controls */}
                <div style={S.card}>
                  <div style={{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'flex-end'}}>
                    <div style={{flex:1,minWidth:'100px'}}>
                      <label style={S.label}>Grade</label>
                      <select value={selGrade} onChange={e=>{const g=e.target.value; setSelGrade(g); setEditMode(false); sessionStorage.setItem('tt_grade',g); const secs=(cfg.grades||{})[g]; const s=Array.isArray(secs)?(secs[0]||''):''; setSelSection(s); sessionStorage.setItem('tt_section',s);}} style={S.select}>
                        {Object.keys(cfg.grades||{}).map(g=><option key={g} value={g} style={{background:'#1a1030'}}>Grade {g}</option>)}
                      </select>
                    </div>
                    <div style={{flex:1,minWidth:'80px'}}>
                      <label style={S.label}>Section</label>
                      <select value={selSection} onChange={e=>{setSelSection(e.target.value);setEditMode(false);sessionStorage.setItem('tt_section',e.target.value);}} style={S.select}>
                        {(Array.isArray((cfg.grades||{})[selGrade])?(cfg.grades||{})[selGrade]:[]).map(s=><option key={s} value={s} style={{background:'#1a1030'}}>{s}</option>)}
                      </select>
                    </div>
                    <div style={{flex:1,minWidth:'100px'}}>
                      <label style={S.label}>Teacher View</label>
                      <select value={teacherView} onChange={e=>setTeacherView(e.target.value)} style={S.select}>
                        <option value="" style={{background:'#1a1030'}}>All Teachers</option>
                        {allTeachers.map(t=><option key={t} value={t} style={{background:'#1a1030'}}>{t}</option>)}
                      </select>
                    </div>
                    {isMgt && (
                      <button onClick={()=>setEditMode(!editMode)}
                        style={{...S.btnSm, background:editMode?'rgba(251,191,36,0.2)':'rgba(255,255,255,0.08)', color:editMode?'#fbbf24':'rgba(255,255,255,0.6)', border:editMode?'1px solid rgba(251,191,36,0.4)':'1px solid rgba(255,255,255,0.1)'}}>
                        {editMode?'✕ Cancel':'✏️ Edit'}
                      </button>
                    )}
                    {isMgt && (
                      <button onClick={checkConflicts}
                        style={{...S.btnSm,background:'rgba(248,113,113,0.1)',color:'rgba(248,113,113,0.8)',border:'1px solid rgba(248,113,113,0.25)',flexShrink:0}}>
                        ⚠ Conflicts
                      </button>
                    )}
                  </div>
                </div>

                {/* Conflict results */}
                {conflicts.length > 0 && (
                  <div style={{background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.25)',borderRadius:'12px',padding:'12px 14px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                      <span style={{fontSize:'10px',fontWeight:900,color:'rgba(248,113,113,0.9)',textTransform:'uppercase',letterSpacing:'0.1em'}}>⚠ Teacher Conflicts တွေ့ရသည်</span>
                      <button onClick={()=>setConflicts([])} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'14px'}}>✕</button>
                    </div>
                    {conflicts.map((c,i)=>(
                      <div key={i} style={{marginBottom:'6px',padding:'6px 10px',background:'rgba(248,113,113,0.07)',borderRadius:'8px',borderLeft:'3px solid rgba(248,113,133,0.5)'}}>
                        <span style={{fontSize:'11px',fontWeight:900,color:'#fca5a5'}}>👤 {c.teacher}</span>
                        <span style={{fontSize:'10px',color:'rgba(255,255,255,0.4)',marginLeft:'8px'}}>{c.day} · Period {c.period}</span>
                        <div style={{fontSize:'9px',color:'rgba(248,113,113,0.6)',marginTop:'2px'}}>→ {c.assignments.join(', ')}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Conflict results */}
                {conflicts.length > 0 && (
                  <div style={{background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.25)',borderRadius:'12px',padding:'12px 14px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                      <span style={{fontSize:'10px',fontWeight:900,color:'rgba(248,113,113,0.9)',textTransform:'uppercase',letterSpacing:'0.1em'}}>⚠ Teacher Conflicts တွေ့ရသည်</span>
                      <button onClick={()=>setConflicts([])} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'14px'}}>✕</button>
                    </div>
                    {conflicts.map((c,i)=>(
                      <div key={i} style={{marginBottom:'6px',padding:'6px 10px',background:'rgba(248,113,113,0.07)',borderRadius:'8px',borderLeft:'3px solid rgba(248,113,113,0.5)'}}>
                        <span style={{fontSize:'11px',fontWeight:900,color:'#fca5a5'}}>👤 {c.teacher}</span>
                        <span style={{fontSize:'10px',color:'rgba(255,255,255,0.4)',marginLeft:'8px'}}>{c.day} · Period {c.period}</span>
                        <div style={{fontSize:'9px',color:'rgba(248,113,113,0.6)',marginTop:'2px'}}>→ {c.assignments.join(', ')}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Timetable grid */}
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',minWidth:'600px'}}>
                    <thead>
                      <tr>
                        <th style={{padding:'8px',fontSize:'9px',color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.1em',textAlign:'left',minWidth:'80px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>Period</th>
                        {(cfg.days||[]).map(d=>(
                          <th key={d} style={{padding:'8px',fontSize:'9px',color:WEEKEND_DAYS.has(d)?'rgba(251,191,36,0.5)':'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.1em',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.08)',fontWeight:900,background:WEEKEND_DAYS.has(d)?'rgba(251,191,36,0.04)':'transparent'}}>
                            {DAYS_SHORT[['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].indexOf(d)]||d.slice(0,3)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {getGradePeriods(cfg, selGrade, selSection).map((p,pi)=>{
                        const pKey = p.no ?? (pi + 1); // single source of truth for period key
                        // console.log('[TT] period pKey='+pKey+' label='+p.label);
                        return (
                        <tr key={pKey} style={{background:p.isBreak?'rgba(251,191,36,0.07)':pi%2===0?'rgba(255,255,255,0.02)':'transparent'}}>
                          <td style={{padding:'8px 6px',borderBottom:'1px solid rgba(255,255,255,0.04)',verticalAlign:'middle',borderLeft:p.isBreak?'3px solid rgba(251,191,36,0.4)':'3px solid transparent'}}>
                            <div style={{fontSize:'10px',fontWeight:900,color:p.isBreak?'rgba(251,191,36,0.7)':'rgba(255,255,255,0.6)'}}>{p.label}</div>
                            <div style={{fontSize:'8px',color:p.isBreak?'rgba(251,191,36,0.35)':'rgba(255,255,255,0.2)'}}>{p.start}–{p.end}</div>
                          </td>
                          {(cfg.days||[]).map(day=>{
                            const key = `${day}_${String(pKey)}`;
                            const cell = ttCells[key] || {};
                            const highlight = teacherView && (cell.teacher===teacherView || cell.asst_teacher===teacherView);
                            const isWeekend = WEEKEND_DAYS.has(day);
                            if (p.isBreak) return (
                              <td key={day} style={{textAlign:'center',padding:'4px',borderBottom:'1px solid rgba(255,255,255,0.04)',background:isWeekend?'rgba(251,191,36,0.04)':'transparent'}}>
                                {p.dutyPerson
                                  ? <div style={{fontSize:'8px',color:'rgba(251,191,36,0.7)',fontWeight:900,lineHeight:1.3}}>⚑<br/>{p.dutyPerson}</div>
                                  : <span style={{fontSize:'9px',color:'rgba(251,191,36,0.2)',fontStyle:'italic'}}>—</span>
                                }
                              </td>
                            );
                            return (
                              <td key={day} style={{padding:'4px',borderBottom:'1px solid rgba(255,255,255,0.04)',verticalAlign:'top',background:isWeekend?'rgba(251,191,36,0.025)':'transparent'}}>
                                {editMode ? (
                                  <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
                                    <select value={cell.subject||''} onChange={e=>handleCellChange(day,pKey,'subject',e.target.value)}
                                      style={{...S.select,padding:'5px 8px',fontSize:'10px',borderRadius:'8px',background:'rgba(255,255,255,0.06)'}}>
                                      <option value="" style={{background:'#1a1030'}}>—</option>
                                      {(cfg.subjects||[]).map(s=><option key={s} value={s} style={{background:'#1a1030'}}>{s}</option>)}
                                    </select>
                                    <select value={cell.teacher||''} onChange={e=>handleCellChange(day,pKey,'teacher',e.target.value)}
                                      style={{...S.select,padding:'5px 8px',fontSize:'10px',borderRadius:'8px',background:'rgba(255,255,255,0.06)'}}>
                                      <option value="" style={{background:'#1a1030'}}>— ဆရာ —</option>
                                      {staffList.map((s,i)=>{
                                        const name = s['Name (ALL CAPITAL)']||s.Name||'';
                                        return name ? <option key={i} value={name} style={{background:'#1a1030'}}>{name}</option> : null;
                                      })}
                                    </select>
                                    <select value={cell.asst_teacher||''} onChange={e=>handleCellChange(day,pKey,'asst_teacher',e.target.value)}
                                      style={{...S.select,padding:'5px 8px',fontSize:'10px',borderRadius:'8px',background:'rgba(255,255,255,0.04)',opacity:0.8}}>
                                      <option value="" style={{background:'#1a1030'}}>— Asst. —</option>
                                      {staffList.map((s,i)=>{
                                        const name = s['Name (ALL CAPITAL)']||s.Name||'';
                                        return name ? <option key={i} value={name} style={{background:'#1a1030'}}>{name}</option> : null;
                                      })}
                                    </select>
                                    <input value={cell.room||''} onChange={e=>handleCellChange(day,pKey,'room',e.target.value)}
                                      placeholder="Room" style={{...S.input,padding:'5px 8px',fontSize:'10px',borderRadius:'8px'}}/>
                                  </div>
                                ) : (() => {
                                    const sc = highlight ? null : getSubjectColor(cfg.subjects||[], cell.subject);
                                    const cellBg     = highlight ? 'rgba(251,191,36,0.12)' : sc ? sc.bg : cell.subject ? 'rgba(255,255,255,0.04)' : 'transparent';
                                    const cellBorder  = highlight ? '1px solid rgba(251,191,36,0.3)' : sc ? `1px solid ${sc.border}` : 'none';
                                    const subjectColor = highlight ? '#fbbf24' : sc ? sc.text : 'rgba(255,255,255,0.8)';
                                    return (
                                  <div style={{background:cellBg,borderRadius:'8px',padding:cell.subject?'6px 8px':'4px',border:cellBorder,minHeight:'36px'}}>
                                    {cell.subject ? (
                                      <>
                                        <div style={{fontSize:'10px',fontWeight:900,color:subjectColor,lineHeight:1.2}}>{cell.subject}</div>
                                        {cell.teacher && <div style={{fontSize:'8px',color:'rgba(255,255,255,0.35)',marginTop:'2px'}}>👤 {cell.teacher}</div>}
                                        {cell.asst_teacher && <div style={{fontSize:'8px',color:'rgba(255,255,255,0.25)',marginTop:'1px'}}>👤 {cell.asst_teacher} <span style={{fontSize:'7px',opacity:0.6}}>(Asst)</span></div>}
                                        {cell.room    && <div style={{fontSize:'8px',color:'rgba(255,255,255,0.25)'}}>🚪 {cell.room}</div>}
                                      </>
                                    ) : (
                                      <div style={{fontSize:'9px',color:'rgba(255,255,255,0.1)',textAlign:'center',paddingTop:'6px'}}>—</div>
                                    )}
                                  </div>
                                    );
                                  })()}
                              </td>
                            );
                          })}
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {editMode && (
                  <button onClick={handleSaveTimetable} disabled={saving}
                    style={{...S.btn,opacity:saving?0.5:1,cursor:saving?'default':'pointer'}}>
                    {saving?'Saving...':'💾 Save — Grade '+selGrade+' / '+selSection}
                  </button>
                )}
              </div>
            )}

            {/* ══════════════ CONFIG (Management only) ══════════════ */}
            {tab==='config' && isMgt && editCfg && (
              <div style={{display:'flex',flexDirection:'column',gap:'12px',marginTop:'8px'}}>
                <div style={{display:'flex',gap:'6px',overflowX:'auto'}}>
                  {['periods','days','grades','subjects'].map(t=>(
                    <button key={t} onClick={()=>setCfgTab(t)}
                      style={cfgTab===t?S.tabOn:{...S.tabOff}}>
                      {t.charAt(0).toUpperCase()+t.slice(1)}
                    </button>
                  ))}
                </div>

                {/* PERIODS config — drag-to-reorder + duty assign */}
                {cfgTab==='periods' && (() => {
                  const byGrade = editCfg.periods_by_grade || { default: editCfg.periods || [] };
                  const gradeMap = Array.isArray(editCfg.grades||{})
                    ? Object.fromEntries((editCfg.grades||[]).map(g=>[g,['A']]))
                    : (editCfg.grades||{});
                  const gradeKeys = ['default', ...Object.entries(gradeMap).flatMap(([g, secs]) => {
                    const gLabel = g==='KG' ? 'KG' : `Grade ${g}`;
                    const sections = Array.isArray(secs) ? secs : ['A'];
                    if (sections.length === 1) return [gLabel];
                    return sections.map(s => `${gLabel}${s}`);
                  })];
                  const activePeriods = byGrade[cfgPeriodGrade] || byGrade['default'] || [];
                  const updatePeriods = (newArr) => {
                    const nb = { ...byGrade, [cfgPeriodGrade]: newArr };
                    setEditCfg(c => ({ ...c, periods_by_grade: nb, periods: nb['default'] || newArr }));
                  };
                  const staffNames = staffList.map(s=>s['Name (ALL CAPITAL)']||s.Name||'').filter(Boolean);

                  // Drag handlers
                  const onDragStart = (i) => setDragIdx(i);
                  const onDragOver  = (e, i) => {
                    e.preventDefault();
                    if (dragIdx === null || dragIdx === i) return;
                    const arr = [...activePeriods];
                    const [moved] = arr.splice(dragIdx, 1);
                    arr.splice(i, 0, moved);
                    setDragIdx(i);
                    updatePeriods(arr);
                  };
                  const onDragEnd = () => setDragIdx(null);

                  return (
                    <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                      {/* Grade selector */}
                      <div style={{...S.card,padding:'10px 14px'}}>
                        <label style={S.label}>Grade အလိုက် Period သတ်မှတ်မည်</label>
                        <select value={cfgPeriodGrade} onChange={e=>setCfgPeriodGrade(e.target.value)}
                          style={{...S.select,marginTop:'6px',fontWeight:900}}>
                          {gradeKeys.map(gk=>(
                            <option key={gk} value={gk} style={{background:'#1a1030'}}>
                              {gk==='default'?'🌐 Default (အတန်းအားလုံး)':gk+(byGrade[gk]?' ✓':'')}
                            </option>
                          ))}
                        </select>
                        {cfgPeriodGrade!=='default' && !byGrade[cfgPeriodGrade] && (
                          <div style={{marginTop:'8px',display:'flex',gap:'8px',alignItems:'center'}}>
                            <span style={{fontSize:'10px',color:'rgba(255,255,255,0.35)'}}>Default periods ကိုသုံးနေသည်</span>
                            <button onClick={()=>{const nb={...byGrade,[cfgPeriodGrade]:JSON.parse(JSON.stringify(byGrade['default']||[]))};setEditCfg(c=>({...c,periods_by_grade:nb}));}}
                              style={{...S.btnSm,padding:'4px 10px',fontSize:'9px',background:'rgba(251,191,36,0.1)',color:'#fbbf24',border:'1px solid rgba(251,191,36,0.3)'}}>
                              + ကိုယ်ပိုင် Period သတ်မှတ်မည်
                            </button>
                          </div>
                        )}
                        {cfgPeriodGrade!=='default' && byGrade[cfgPeriodGrade] && (
                          <button onClick={()=>{const nb={...byGrade};delete nb[cfgPeriodGrade];setEditCfg(c=>({...c,periods_by_grade:nb}));}}
                            style={{...S.btnSm,marginTop:'8px',padding:'4px 10px',fontSize:'9px',color:'rgba(248,113,113,0.6)',border:'1px solid rgba(248,113,113,0.2)'}}>
                            ✕ ဖျက်ပြီး Default ပြန်သုံးမည်
                          </button>
                        )}
                      </div>

                      <p style={{fontSize:'9px',color:'rgba(255,255,255,0.25)',margin:'0 2px',letterSpacing:'0.05em'}}>
                        ☰ ဘယ်ဘက်ဆုံး handle ကို ဆွဲဆြဲ၍ အစဉ်ပြောင်းနိုင်သည်
                      </p>

                      {/* Period rows — draggable */}
                      {activePeriods.map((p,i)=>{
                        const lbl = String(p.label||'').toLowerCase();
                        const isBreakNow = p.isBreak===true||['break','lunch','recess','duty','assembly','prayer','chapel','နားချိန်','အနားယူ'].some(kw=>lbl.includes(kw));
                        return (
                        <div key={i}
                          draggable
                          onDragStart={()=>onDragStart(i)}
                          onDragOver={e=>onDragOver(e,i)}
                          onDragEnd={onDragEnd}
                          style={{...S.card,
                            display:'flex',flexDirection:'column',gap:'8px',
                            opacity:dragIdx===i?0.5:1,
                            border:dragIdx===i?'1px solid rgba(251,191,36,0.5)':isBreakNow?'1px solid rgba(251,191,36,0.3)':'1px solid rgba(255,255,255,0.1)',
                            background:isBreakNow?'rgba(251,191,36,0.04)':'rgba(255,255,255,0.05)',
                            cursor:'grab',userSelect:'none'
                          }}>
                          {/* Top row: drag handle + fields + buttons */}
                          <div style={{display:'grid',gridTemplateColumns:'24px 1fr 1fr 1fr auto',gap:'8px',alignItems:'center'}}>
                            <div style={{fontSize:'14px',color:'rgba(255,255,255,0.2)',textAlign:'center',cursor:'grab'}}>☰</div>
                            <div>
                              <label style={S.label}>Label</label>
                              <input value={p.label} onChange={e=>{const a=[...activePeriods];a[i]={...a[i],label:e.target.value};updatePeriods(a);}} style={S.input}/>
                            </div>
                            <div>
                              <label style={S.label}>Start</label>
                              <input type="time" value={p.start||''} onChange={e=>{const a=[...activePeriods];a[i]={...a[i],start:e.target.value};updatePeriods(a);}} style={S.input}/>
                            </div>
                            <div>
                              <label style={S.label}>End</label>
                              <input type="time" value={p.end||''} onChange={e=>{const a=[...activePeriods];a[i]={...a[i],end:e.target.value};updatePeriods(a);}} style={S.input}/>
                            </div>
                            <div style={{display:'flex',flexDirection:'column',gap:'4px',paddingTop:'14px'}}>
                              <button onClick={()=>{const a=[...activePeriods];a[i]={...a[i],isBreak:!a[i].isBreak};updatePeriods(a);}}
                                style={{...S.btnSm,padding:'4px 8px',fontSize:'8px',
                                  background:isBreakNow?'rgba(251,191,36,0.2)':'rgba(255,255,255,0.06)',
                                  color:isBreakNow?'#fbbf24':'rgba(255,255,255,0.4)'}}>
                                {isBreakNow?'☕ Break':'—'}
                              </button>
                              <button onClick={()=>updatePeriods(activePeriods.filter((_,j)=>j!==i))}
                                style={{...S.btnSm,padding:'4px 8px',fontSize:'8px',color:'rgba(248,113,113,0.7)',border:'1px solid rgba(248,113,113,0.2)'}}>✕</button>
                            </div>
                          </div>
                          {/* Duty assign row — only for break periods */}
                          {isBreakNow && (
                            <div style={{paddingLeft:'32px',display:'flex',alignItems:'center',gap:'8px'}}>
                              <span style={{fontSize:'9px',color:'rgba(251,191,36,0.5)',whiteSpace:'nowrap'}}>⚑ Duty Person</span>
                              <select value={p.dutyPerson||''} onChange={e=>{const a=[...activePeriods];a[i]={...a[i],dutyPerson:e.target.value};updatePeriods(a);}}
                                style={{...S.select,flex:1,padding:'6px 10px',fontSize:'11px',background:'rgba(251,191,36,0.05)',border:'1px solid rgba(251,191,36,0.2)',color:'rgba(255,255,255,0.8)'}}>
                                <option value="" style={{background:'#1a1030'}}>— မသတ်မှတ်ရသေးပါ —</option>
                                {staffNames.map((n,ni)=><option key={ni} value={n} style={{background:'#1a1030'}}>{n}</option>)}
                              </select>
                              {p.dutyPerson && (
                                <button onClick={()=>{const a=[...activePeriods];a[i]={...a[i],dutyPerson:''};updatePeriods(a);}}
                                  style={{background:'none',border:'none',color:'rgba(248,113,113,0.5)',cursor:'pointer',fontSize:'13px',padding:'2px'}}>✕</button>
                              )}
                            </div>
                          )}
                        </div>
                      );})}

                      <button onClick={()=>{const no=activePeriods.length+1;updatePeriods([...activePeriods,{no,label:`Period ${no}`,start:'',end:'',isBreak:false}]);}}
                        style={{...S.btnSm,textAlign:'center'}}>+ Add Period</button>
                    </div>
                  );
                })()}

                {/* DAYS config */}
                {cfgTab==='days' && (
                  <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                    {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d=>(
                      <button key={d} onClick={()=>{ const inc=editCfg.days.includes(d); setEditCfg(c=>({...c,days:inc?c.days.filter(x=>x!==d):[...c.days,d]})); }}
                        style={{...S.card,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',border:editCfg.days.includes(d)?'1px solid rgba(251,191,36,0.4)':'1px solid rgba(255,255,255,0.08)',background:editCfg.days.includes(d)?'rgba(251,191,36,0.06)':'rgba(255,255,255,0.03)'}}>
                        <span style={{fontWeight:900,color:editCfg.days.includes(d)?'#fbbf24':'rgba(255,255,255,0.4)'}}>{d}</span>
                        <span style={{fontSize:'16px'}}>{editCfg.days.includes(d)?'✓':'○'}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* GRADES + SECTIONS config */}
                {cfgTab==='grades' && (
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    {['KG','1','2','3','4','5','6','7','8','9','10','11','12'].map(g=>{
                      const rawGrades = editCfg.grades||{}; const gradeObj = Array.isArray(rawGrades) ? Object.fromEntries(rawGrades.map(g=>[g,['A']])) : rawGrades;
                      const active   = !!gradeObj[g];
                      const sections = gradeObj[g]||[];
                      return (
                        <div key={g} style={{background:'rgba(255,255,255,0.03)',borderRadius:'12px',padding:'12px 14px',border:active?'1px solid rgba(251,191,36,0.25)':'1px solid rgba(255,255,255,0.06)'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom: active?'10px':'0'}}>
                            {/* Grade toggle */}
                            <button onClick={()=>{ const ng={...gradeObj}; if(active){delete ng[g];}else{ng[g]=['A'];} setEditCfg(c=>({...c,grades:ng})); }}
                              style={{minWidth:'52px',padding:'6px 10px',borderRadius:'8px',border:'none',cursor:'pointer',fontWeight:900,fontSize:'13px',background:active?'#fbbf24':'rgba(255,255,255,0.08)',color:active?'#0f172a':'rgba(255,255,255,0.35)'}}>
                              G{g}
                            </button>
                            {active && (
                              <span style={{fontSize:'10px',color:'rgba(255,255,255,0.35)',fontWeight:700}}>
                                {sections.length} section{sections.length!==1?'s':''}
                              </span>
                            )}
                          </div>
                          {active && (
                            <div style={{display:'flex',flexWrap:'wrap',gap:'6px',alignItems:'center'}}>
                              {sections.map((s,si)=>(
                                <div key={si} style={{display:'flex',alignItems:'center',gap:'4px',background:'rgba(251,191,36,0.1)',borderRadius:'8px',padding:'5px 10px',border:'1px solid rgba(251,191,36,0.2)'}}>
                                  <span style={{fontSize:'12px',fontWeight:900,color:'#fbbf24'}}>{s}</span>
                                  <button onClick={()=>{ const ns=sections.filter((_,j)=>j!==si); const ng={...gradeObj,[g]:ns.length?ns:undefined}; if(!ns.length)delete ng[g]; setEditCfg(c=>({...c,grades:ng})); }}
                                    style={{background:'none',border:'none',color:'rgba(248,113,113,0.7)',cursor:'pointer',fontSize:'11px',padding:'0 0 0 2px',fontWeight:900}}>✕</button>
                                </div>
                              ))}
                              {/* Add section button */}
                              <button onClick={()=>{
                                const next = String.fromCharCode(65+sections.length);
                                const ng={...gradeObj,[g]:[...sections,next]};
                                setEditCfg(c=>({...c,grades:ng}));
                              }} style={{padding:'5px 10px',borderRadius:'8px',border:'1px dashed rgba(251,191,36,0.3)',background:'transparent',color:'rgba(251,191,36,0.6)',cursor:'pointer',fontSize:'11px',fontWeight:900}}>
                                + Section
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* SUBJECTS config */}
                {cfgTab==='subjects' && (
                  <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                      {editCfg.subjects.map((s,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',gap:'4px',background:'rgba(255,255,255,0.06)',borderRadius:'99px',padding:'4px 12px',border:'1px solid rgba(255,255,255,0.1)'}}>
                          <span style={{fontSize:'11px',color:'rgba(255,255,255,0.7)'}}>{s}</span>
                          <button onClick={()=>setEditCfg(c=>({...c,subjects:c.subjects.filter((_,j)=>j!==i)}))}
                            style={{background:'none',border:'none',color:'rgba(248,113,113,0.6)',cursor:'pointer',fontSize:'12px',padding:'0 0 0 4px'}}>✕</button>
                        </div>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:'8px'}}>
                      <input id="newSubj" placeholder="Subject နာမည်" style={{...S.input,flex:1}}/>
                      <button onClick={()=>{ const v=document.getElementById('newSubj').value.trim(); if(v){setEditCfg(c=>({...c,subjects:[...c.subjects,v]}));document.getElementById('newSubj').value='';} }}
                        style={{...S.btnSm,flexShrink:0,padding:'10px 16px'}}>+ Add</button>
                    </div>
                  </div>
                )}

                <button onClick={handleSaveConfig} disabled={saving}
                  style={{...S.btn,opacity:saving?0.6:1,cursor:saving?'default':'pointer',marginTop:'4px',
                    background:saving?'rgba(251,191,36,0.5)':'#fbbf24',transition:'all 0.2s'}}>
                  {saving ? '⏳ သိမ်းနေသည်…' : '💾 Save Config'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* EVENT FORM MODAL */}
      {showEventForm && isMgt && (
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(0,0,0,0.7)',backdropFilter:'blur(6px)',paddingBottom:'72px'}}
          onClick={()=>setShowEventForm(false)}>
          <div style={{width:'100%',maxWidth:'420px',background:'#1a1030',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'24px 24px 0 0',padding:'24px',paddingBottom:'32px',display:'flex',flexDirection:'column',gap:'12px',maxHeight:'85dvh',overflowY:'auto'}}
            onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <p style={{fontWeight:900,fontSize:'14px',margin:0}}>Add Event</p>
              <button onClick={()=>setShowEventForm(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div><label style={S.label}>Title *</label><input value={eventForm.Title} onChange={e=>setEventForm(f=>({...f,Title:e.target.value}))} placeholder="e.g. ပြည်ထောင်စုနေ့" style={S.input}/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <div><label style={S.label}>Start Date *</label><input type="date" value={eventForm.Date} onChange={e=>setEventForm(f=>({...f,Date:e.target.value}))} style={S.input}/></div>
              <div><label style={S.label}>End Date</label><input type="date" value={eventForm.End_Date} onChange={e=>setEventForm(f=>({...f,End_Date:e.target.value}))} style={S.input}/></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <div>
                <label style={S.label}>Type</label>
                <select value={eventForm.Type} onChange={e=>setEventForm(f=>({...f,Type:e.target.value}))} style={S.select}>
                  {EVENT_TYPES.map(t=><option key={t} value={t} style={{background:'#1a1030'}}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Target</label>
                <select value={eventForm.Target} onChange={e=>setEventForm(f=>({...f,Target:e.target.value}))} style={S.select}>
                  {['All','Staff','Student','Public'].map(t=><option key={t} value={t} style={{background:'#1a1030'}}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={S.label}>Color</label>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                {EVENT_COLORS.map(c=>(
                  <button key={c} onClick={()=>setEventForm(f=>({...f,Color:c}))}
                    style={{width:'28px',height:'28px',borderRadius:'50%',background:c,border:eventForm.Color===c?'3px solid #fff':'2px solid transparent',cursor:'pointer'}}/>
                ))}
              </div>
            </div>
            <div><label style={S.label}>Description</label><input value={eventForm.Description} onChange={e=>setEventForm(f=>({...f,Description:e.target.value}))} placeholder="Optional" style={S.input}/></div>
            <button onClick={handleSaveEvent} disabled={saving}
              style={{...S.btn,background:eventForm.Color,color:'#fff',opacity:saving?0.5:1}}>
              {saving?'Saving...':'+ Save Event'}
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}