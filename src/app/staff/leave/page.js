"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

const S = {
  page:    { display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden', background:'#fdfcf0', color:'#020617', fontFamily:'system-ui,sans-serif' },
  header:  { flexShrink:0, background:'#020617', borderBottom:'6px solid #fbbf24', padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' },
  body:    { flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', paddingBottom:'80px' },
  card:    { background:'#fff', border:'1px solid #f1f5f9', borderRadius:'20px', padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', marginBottom:'12px' },
  input:   { width:'100%', background:'#fdfcf0', border:'2px solid #e2e8f0', borderRadius:'14px', padding:'12px 14px', color:'#020617', fontSize:'13px', fontWeight:700, outline:'none', boxSizing:'border-box' },
  select:  { width:'100%', background:'#fdfcf0', border:'2px solid #e2e8f0', borderRadius:'14px', padding:'12px 14px', color:'#020617', fontSize:'13px', fontWeight:700, outline:'none', boxSizing:'border-box' },
  label:   { display:'block', fontSize:'9px', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:900, marginBottom:'6px' },
  btnDark: { background:'#020617', color:'#fbbf24', border:'none', borderRadius:'14px', padding:'14px', fontSize:'13px', fontWeight:900, width:'100%', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.06em' },
  tabOn:   { background:'#020617', color:'#fff', border:'none', borderRadius:'10px', padding:'10px 16px', fontSize:'11px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 4px 10px rgba(0,0,0,0.1)' },
  tabOff:  { background:'rgba(0,0,0,0.04)', color:'#94a3b8', border:'none', borderRadius:'10px', padding:'10px 16px', fontSize:'11px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap' },
};

const LEAVE_TYPES = ['Sick Leave','Medical Leave','Personal Leave','Urgent Affair', 'Casual Leave', 'Emergency Leave'];
const METHODS     = ['Phone Call','Telegram','Viber','Directly'];

const cleanDateStr = (d) => {
  if (!d || d === '-') return '-';
  return String(d).split('T')[0];
};

function DurationBadge({ leave }) {
  const dt   = leave.Duration_Type || 'FULL';
  const days = Number(leave.Total_Days || 1);
  if (dt === 'HALF') {
    const part = leave.Half_Day_Part && leave.Half_Day_Part !== '-' ? ` (${leave.Half_Day_Part})` : '';
    return <span style={{background:'#fef3c7',color:'#92400e',fontSize:'9px',fontWeight:900,padding:'3px 8px',borderRadius:'99px',textTransform:'uppercase',whiteSpace:'nowrap'}}>🌗 ½ Day{part}</span>;
  }
  if (dt === 'PERIOD') {
    const cnt   = leave.Period_Count || '?';
    const range = leave.Period_Range && leave.Period_Range !== '-' ? ` ${leave.Period_Range}` : '';
    return <span style={{background:'#ede9fe',color:'#6d28d9',fontSize:'9px',fontWeight:900,padding:'3px 8px',borderRadius:'99px',textTransform:'uppercase',whiteSpace:'nowrap'}}>⏱️ {cnt} Period{Number(cnt)>1?'s':''}{range}</span>;
  }
  return <span style={{background:'#f0fdf4',color:'#16a34a',fontSize:'9px',fontWeight:900,padding:'3px 8px',borderRadius:'99px',textTransform:'uppercase',whiteSpace:'nowrap'}}>📅 {days} Day{days!==1?'s':''}</span>;
}

const DUR_TYPES = [
  { id:'FULL',   label:'Full Day', icon:'📅' },
  { id:'HALF',   label:'½ Day',    icon:'🌗' },
  { id:'PERIOD', label:'Period',   icon:'⏱️' },
];

const WatchlistGroup = ({ title, users, icon, color, bg }) => (
  <div style={{background:bg||'rgba(2,6,23,0.03)',border:'1px solid rgba(0,0,0,0.05)',padding:'16px',borderRadius:'20px',display:'flex',flexDirection:'column',maxHeight:'400px'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px',borderBottom:'1px solid rgba(0,0,0,0.05)',paddingBottom:'10px'}}>
      <p style={{fontSize:'13px',fontWeight:900,textTransform:'uppercase',letterSpacing:'0.05em',color:color,margin:0}}>{icon} {title}</p>
      <span style={{fontSize:'11px',background:'rgba(0,0,0,0.05)',color:'#334155',padding:'4px 10px',borderRadius:'8px',fontWeight:900}}>{users.length}</span>
    </div>
    <div style={{overflowY:'auto',display:'flex',flexDirection:'column',gap:'10px',paddingRight:'4px'}}>
      {users.length === 0 ? <p style={{fontSize:'12px',color:'#94a3b8',textAlign:'center',margin:'20px 0',fontStyle:'italic'}}>No records found</p> : users.map((u,i)=>(
        <div key={i} style={{background:'#fff',borderRadius:'14px',padding:'14px',border:'1px solid #e2e8f0',boxShadow:'0 2px 4px rgba(0,0,0,0.02)'}}>
          <p style={{fontSize:'14px',fontWeight:900,color:'#0f172a',margin:'0 0 8px'}}>{u.name}</p>
          <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'10px'}}>
            <span style={{fontSize:'9px',background:'#f1f5f9',color:'#475569',padding:'3px 8px',borderRadius:'6px',fontWeight:900}}>ID: {u.id}</span>
            {u.type === 'STUDENT' ? (
              <>
                <span style={{fontSize:'9px',background:'#e0e7ff',color:'#4f46e5',padding:'3px 8px',borderRadius:'6px',fontWeight:900}}>STUDENT</span>
                {(u.grade || u.section) && (
                  <span style={{fontSize:'9px',background:'#e0f2fe',color:'#0284c7',padding:'3px 8px',borderRadius:'6px',fontWeight:900}}>
                    {u.grade ? `Grade ${u.grade}` : ''}{u.grade && u.section ? ' | ' : ''}{u.section ? `Class ${u.section}` : ''}
                  </span>
                )}
              </>
            ) : <span style={{fontSize:'9px',background:'#fef3c7',color:'#d97706',padding:'3px 8px',borderRadius:'6px',fontWeight:900}}>STAFF</span>}
          </div>
          {u.reasons && u.reasons.length > 0 && (
            <div style={{borderTop:'1px solid #f1f5f9',paddingTop:'10px'}}>
              <p style={{fontSize:'9px',color:'#94a3b8',textTransform:'uppercase',fontWeight:900,margin:'0 0 6px',letterSpacing:'0.1em'}}>Recent Absences:</p>
              {u.reasons.slice(0,3).map((r,ri)=>(
                <div key={ri} style={{background:'#f8fafc',padding:'8px 10px',borderRadius:'8px',marginBottom:'6px',borderLeft:'3px solid #cbd5e1'}}>
                  <p style={{fontSize:'10px',color:'#64748b',fontWeight:900,margin:'0 0 4px'}}>📅 {r.start} {r.end&&r.end!==r.start?`→ ${r.end}`:''}</p>
                  <p style={{fontSize:'11px',color:'#334155',margin:0,fontStyle:'italic'}}>Reason: {r.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default function StaffLeave() {
  const router = useRouter();
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [registry, setRegistry] = useState({ students:[], staff:[], allLeaves:[], pending:[], history:[] });
  
  // Tabs: NEW, PENDING, HISTORY, ANALYSIS
  const [view, setView]         = useState('NEW'); 
  
  const [target, setTarget]     = useState('STUDENT');
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState('');
  const [msg, setMsg]           = useState(null);
  
  // Analysis States
  const [rangeFilter, setRangeFilter] = useState("ALL");
  const [typeFilter,  setTypeFilter]  = useState("ALL");
  const [watchFilter, setWatchFilter] = useState("TODAY");
  const [historySearchQuery, setHistorySearchQuery] = useState("");

  // History Filter States
  const [histSearch, setHistSearch] = useState("");
  const [histFilter, setHistFilter] = useState("ALL");

  const [form, setForm] = useState({
    category:'School', // School or Guide
    type:'Sick Leave', durType:'FULL',
    start:'', end:'', halfPart:'AM',
    periodCount:1, periodFrom:1, periodTo:1,
    reason:'', notes:'',
    reporter:'', relation:'', phone:'', method:'Phone Call',
  });
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  const calcDays = () => {
    if (form.durType === 'HALF')   return 0.5;
    if (form.durType === 'PERIOD') return Number(form.periodCount) || 1;
    if (!form.start || !form.end)  return 0;
    const d = Math.ceil(Math.abs(new Date(form.end)-new Date(form.start))/86400000)+1;
    return d > 0 ? d : 0;
  };
  const endDateForSave  = () => (form.durType !== 'FULL') ? form.start : form.end;
  const periodRangeLabel= () => {
    if (form.durType !== 'PERIOD') return '';
    const f=Number(form.periodFrom), t=Number(form.periodTo);
    return f===t ? `P${f}` : `P${f}–P${t}`;
  };
  const durationSummary = () => {
    const d = calcDays();
    if (form.durType === 'HALF')   return `½ Day — ${form.halfPart}`;
    if (form.durType === 'PERIOD') return `${form.periodCount} Period${form.periodCount>1?'s':''} (${periodRangeLabel()})`;
    return `${d} day${d!==1?'s':''}`;
  };

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user')||sessionStorage.getItem('user')||'null');
    if (!u) { router.push('/login'); return; }
    const checkPerm = k => u.userRole==='management' || u[k]===true || String(u[k]||'').toUpperCase()==='TRUE';
    if (u.userRole==='management') { setUser(u); fetchData(); return; }
    if (checkPerm('Can_Record_Attendance_&_Leave')) { setUser(u); fetchData(); return; }
    fetch(WEB_APP_URL,{method:'POST',body:JSON.stringify({action:'getStaffPermissions'})})
      .then(r=>r.json()).then(res=>{
        const fresh = res.success && res.data && res.data.find(s=>(s.Staff_ID&&s.Staff_ID.toString()===u.Staff_ID?.toString())||(s.Name&&(s.Name===u['Name (ALL CAPITAL)']||s.Name===u.Name)));
        if (fresh) {
          const up={...u,...fresh}; localStorage.setItem('user',JSON.stringify(up));
          const k='Can_Record_Attendance_&_Leave';
          if(!(up[k]===true||String(up[k]||'').toUpperCase()==='TRUE')){router.push('/staff');return;}
          setUser(up); fetchData(); return;
        }
        router.push('/staff');
      }).catch(()=>router.push('/staff'));
  },[]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(WEB_APP_URL,{method:'POST',body:JSON.stringify({action:'getInitialData'})});
      const r = await res.json();
      if (r.success) {
        const isActive = u => u.Status?.toString().toUpperCase()==='TRUE';
        setRegistry({
          students:(r.students||[]).filter(isActive),
          staff:(r.staffList||r.staff||[]).filter(isActive),
          allLeaves: r.leaves || [],
          pending:(r.leaves||[]).filter(x=>x.Status==='Pending'),
          history:(r.leaves||[]).filter(x=>x.Status!=='Pending').reverse(),
        });
      }
    } catch {}
    setLoading(false);
  };

  const showMsg = (text,type='success') => { setMsg({text,type}); setTimeout(()=>setMsg(null),3000); };

  const handleSubmit = async () => {
    if (!selected||!form.start||!form.reason.trim()) return showMsg('Date နှင့် Reason ဖြည့်ပါ','error');
    if (form.durType==='FULL'&&!form.end) return showMsg('End Date ဖြည့်ပါ','error');
    if (target==='STUDENT'&&(!form.reporter.trim()||!form.relation.trim()||!form.phone.trim())) return showMsg('Reporter details ဖြည့်ပါ','error');
    if (form.durType==='PERIOD'&&Number(form.periodFrom)>Number(form.periodTo)) return showMsg('Period range မှားနေသည်','error');
    setSaving(true);
    const totalDays=calcDays(), endDate=endDateForSave(), pRange=periodRangeLabel();
    const entry=[{
      Date_Applied:new Date().toLocaleDateString('en-CA'), 
      Category:form.category, 
      User_Type:target,
      User_ID:selected['Enrollment No.']||selected['Staff_ID'],
      Name:selected['Name (ALL CAPITAL)']||selected['Name'],
      Leave_Type:form.type, Duration_Type:form.durType,
      Half_Day_Part:form.durType==='HALF'?form.halfPart:'-',
      Period_Count:form.durType==='PERIOD'?form.periodCount:'-',
      Period_Range:form.durType==='PERIOD'?pRange:'-',
      Start_Date:form.start, End_Date:endDate, Total_Days:totalDays,
      Reason:form.reason, Notes:form.notes||'-',
      Reporter_Name:target==='STUDENT'?form.reporter:'-',
      Relationship:target==='STUDENT'?form.relation:'-',
      Phone:target==='STUDENT'?form.phone:'-',
      Method:target==='STUDENT'?form.method:'-',
      Approved_By:'-', Status:'Pending',
    }];
    try {
      const res = await fetch(WEB_APP_URL,{method:'POST',body:JSON.stringify({action:'recordNote',sheetName:'Leave_Records',data:entry})});
      const r = await res.json();
      if (r.success) {
        showMsg('Leave တင်ပြီးပါပြီ ✓');
        setForm({category:'School',type:'Sick Leave',durType:'FULL',start:'',end:'',halfPart:'AM',periodCount:1,periodFrom:1,periodTo:1,reason:'',notes:'',reporter:'',relation:'',phone:'',method:'Phone Call'});
        setSelected(null); setSearch(''); fetchData();
      } else showMsg(r.message||'Error','error');
    } catch { showMsg('Network error','error'); }
    setSaving(false);
  };

  const handleAuth = async (leave,status) => {
    if (user.userRole!=='management') return showMsg('Management Only! Management Account ဖြင့်ဝင်ပါ','error');
    setSaving(true);
    try {
      const res = await fetch(WEB_APP_URL,{method:'POST',body:JSON.stringify({action:'updateLeave',userId:leave.User_ID,name:leave.Name,startDate:leave.Start_Date,status,approvedBy:user.Name})});
      if ((await res.json()).success) { showMsg(`${status} ✓`); fetchData(); setView('PENDING'); }
    } catch {}
    setSaving(false);
  };

  const filtered = (target==='STUDENT'?registry.students:registry.staff).filter(u=>{
    if (!search) return false;
    const s=search.toLowerCase();
    return (u['Name (ALL CAPITAL)']||u['Name']||'').toLowerCase().includes(s)||(u['Enrollment No.']||u['Staff_ID']||'').toString().includes(s);
  });
  const getName = u => u['Name (ALL CAPITAL)']||u['Name']||'';
  const getID   = u => u['Enrollment No.']||u['Staff_ID']||'';

  const getStudentInfo = (userId, name) => {
    const st = registry.students.find(s => s.Student_ID === userId || s['Enrollment No.'] === userId || s['Name (ALL CAPITAL)'] === name || s.Name === name);
    return st ? { grade: st.Grade || '', section: st.Section || st.Class || '' } : { grade:'', section:'' };
  };

  // ── History Filter & Grouping ──
  const filteredHistory = registry.history.filter(h => {
    const matchSearch = (h.Name||'').toLowerCase().includes(histSearch.toLowerCase()) || 
                        (h.Leave_Type||'').toLowerCase().includes(histSearch.toLowerCase());
    const matchType = histFilter === 'ALL' || h.User_Type === histFilter;
    return matchSearch && matchType;
  });

  const groupedHistory = filteredHistory.reduce((acc, l) => {
    const date = cleanDateStr(l.Start_Date);
    if (!acc[date]) acc[date] = [];
    acc[date].push(l);
    return acc;
  }, {});
  
  const sortedHistoryDates = Object.keys(groupedHistory).sort((a,b) => new Date(b) - new Date(a));

  // ── Analysis Data Calculation ──
  const now = new Date();
  const analysisLeaves = registry.allLeaves.filter(l=>{
    const days=(now-new Date(cleanDateStr(l.Start_Date)))/86400000;
    if (rangeFilter==="7D")  return days<=7;
    if (rangeFilter==="30D") return days<=30;
    if (rangeFilter==="90D") return days<=90;
    return true;
  }).filter(l=>typeFilter==="ALL"||l.User_Type===typeFilter);

  const halfDayCount   = analysisLeaves.filter(l=>(l.Duration_Type||'FULL')==='HALF').length;
  const periodCount    = analysisLeaves.filter(l=>(l.Duration_Type||'FULL')==='PERIOD').length;
  const fullDayCount   = analysisLeaves.filter(l=>(l.Duration_Type||'FULL')==='FULL').length;

  const userStats = {};
  const todayStr = new Date().toLocaleDateString('en-CA', {timeZone: 'Asia/Yangon'});
  const nowMs = now.getTime();

  registry.allLeaves.filter(l => l.Status === 'Approved').forEach(l => {
    const k = l.User_ID || l.Name;
    if (!userStats[k]) userStats[k] = { 
      name: l.Name, type: l.User_Type, id: l.User_ID || '-', grade: '', section: '',
      totalDays: 0, last7: 0, last30: 0, last90: 0, periods: [], 
      isAbsentToday: false, reasons: [] 
    };
    
    const cleanS = cleanDateStr(l.Start_Date);
    const cleanE = cleanDateStr(l.End_Date) || cleanS;
    const sd = new Date(cleanS).getTime();
    const ed = new Date(cleanE).getTime();
    const days = Number(l.Total_Days) || 1;
    
    userStats[k].totalDays += days;
    
    const sDateStr = new Date(sd).toLocaleDateString('en-CA', {timeZone: 'Asia/Yangon'});
    const eDateStr = new Date(ed).toLocaleDateString('en-CA', {timeZone: 'Asia/Yangon'});
    if (todayStr >= sDateStr && todayStr <= eDateStr) {
        userStats[k].isAbsentToday = true;
    }
    
    const diffDays = (nowMs - sd) / 86400000;
    if (diffDays <= 7) userStats[k].last7 += days;
    if (diffDays <= 30) userStats[k].last30 += days;
    if (diffDays <= 90) userStats[k].last90 += days;
    
    userStats[k].periods.push({ start: sd, days });
    
    if (l.Reason && l.Reason !== '-') {
      userStats[k].reasons.push({ start: cleanS, end: cleanE, text: l.Reason, type: l.Leave_Type });
    }
  });

  Object.values(userStats).forEach(u => {
    if (u.type === 'STUDENT') {
      const stInfo = getStudentInfo(u.id, u.name);
      u.grade = stInfo.grade;
      u.section = stInfo.section;
    }
    u.reasons.sort((a,b) => new Date(b.start) - new Date(a.start));
    u.periods.sort((a,b) => a.start - b.start);
    let maxC = 0, currC = 0, lastEnd = 0;
    u.periods.forEach(p => {
      if (lastEnd === 0) {
        currC = p.days;
      } else {
        const diffDays = (p.start - lastEnd) / 86400000;
        if (diffDays <= 3) currC += p.days; 
        else currC = p.days;
      }
      if (currC > maxC) maxC = currC;
      lastEnd = p.start + (p.days * 86400000);
    });
    u.maxConsecutive = maxC;
  });

  const statsList = Object.values(userStats);
  
  const watchMap = {
    'TODAY': { title: 'ယနေ့ ပျက်သူ', users: statsList.filter(u => u.isAbsentToday), icon: '📍', color: '#0284c7' },
    'C2':    { title: '၂ ရက်ဆက်တိုက်', users: statsList.filter(u => u.maxConsecutive === 2), icon: '⚠️', color: '#d97706' },
    'C3':    { title: '၃ ရက်ဆက်တိုက်', users: statsList.filter(u => u.maxConsecutive >= 3 && u.maxConsecutive < 5), icon: '🔥', color: '#ea580c' },
    'C5':    { title: '၅ ရက်ဆက်တိုက်', users: statsList.filter(u => u.maxConsecutive === 5), icon: '🚨', color: '#e11d48' },
    'CO5':   { title: '> ၅ ရက်ဆက်တိုက်', users: statsList.filter(u => u.maxConsecutive > 5), icon: '💀', color: '#be123c' },
    'W3':    { title: '၁ ပတ် (≥ ၃ ရက်)', users: statsList.filter(u => u.last7 >= 3), icon: '📅', color: '#4f46e5' },
    'M3':    { title: '၁ လ (≥ ၃ ရက်)', users: statsList.filter(u => u.last30 >= 3), icon: '📆', color: '#9333ea' },
    'M5':    { title: '၃ လ (≥ ၅ ရက်)', users: statsList.filter(u => u.last90 >= 5), icon: '📊', color: '#db2777' },
    'ALL5':  { title: 'All Time (≥ ၅ ရက်)', users: statsList.filter(u => u.totalDays >= 5), icon: '🏆', color: '#475569' }
  };

  const watchTabs = [
    { id: 'TODAY', label: 'ယနေ့' },
    { id: 'C2', label: '၂ ရက်ဆက်' },
    { id: 'C3', label: '၃ ရက်ဆက်' },
    { id: 'C5', label: '၅ ရက်ဆက်' },
    { id: 'CO5', label: '> ၅ ရက်' },
    { id: 'W3', label: '၁ ပတ် (၃)' },
    { id: 'M3', label: '၁ လ (၃)' },
    { id: 'M5', label: '၃ လ (၅)' },
    { id: 'ALL5', label: 'All Time (၅)' }
  ];

  const searchedUsers = historySearchQuery.trim().length >= 2 
    ? statsList.filter(u => 
        u.name.toLowerCase().includes(historySearchQuery.toLowerCase()) || 
        u.id.toLowerCase().includes(historySearchQuery.toLowerCase())
      )
    : [];

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}input[type=date]{color-scheme:light}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.1);border-radius:10px}`}</style>

      {/* Header */}
      <div style={S.header}>
        <button onClick={()=>router.push('/staff')} style={{background:'#fbbf24',color:'#020617',border:'none',borderRadius:'10px',width:'36px',height:'36px',cursor:'pointer',fontSize:'16px',fontWeight:900}}>←</button>
        <div style={{flex:1,marginLeft:'10px'}}>
          <p style={{fontWeight:900,fontSize:'14px',color:'#fff',margin:0,textTransform:'uppercase',letterSpacing:'0.05em'}}>Leave Request</p>
          <p style={{fontSize:'9px',color:'#fbbf24',margin:0,letterSpacing:'0.2em',textTransform:'uppercase'}}>Staff / Teacher Portal</p>
        </div>
        <button onClick={fetchData} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'18px'}}>↻</button>
      </div>

      {/* Toast */}
      {msg&&<div style={{position:'fixed',top:'70px',left:'50%',transform:'translateX(-50%)',zIndex:50,padding:'8px 20px',borderRadius:'999px',fontSize:'12px',fontWeight:900,color:'#fff',background:msg.type==='error'?'#ef4444':'#10b981',boxShadow:'0 4px 20px rgba(0,0,0,0.2)',whiteSpace:'nowrap'}}>{msg.text}</div>}

      {/* Body */}
      <div style={S.body}>
        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'80px 0'}}>
            <div style={{width:'32px',height:'32px',border:'3px solid #e2e8f0',borderTop:'3px solid #fbbf24',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
          </div>
        ) : (
          <div style={{maxWidth:'600px',margin:'0 auto',padding:'16px',display:'flex',flexDirection:'column',gap:'12px'}}>

            {/* Tabs */}
            <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'8px'}}>
              <button onClick={()=>setView('NEW')}     style={view==='NEW'     ?S.tabOn:S.tabOff}>✏️ New</button>
              <button onClick={()=>setView('PENDING')} style={view==='PENDING' ?S.tabOn:S.tabOff}>⏳ Pending ({registry.pending.length})</button>
              <button onClick={()=>setView('HISTORY')} style={view==='HISTORY' ?S.tabOn:S.tabOff}>📋 History</button>
              <button onClick={()=>setView('ANALYSIS')} style={view==='ANALYSIS' ?S.tabOn:S.tabOff}>📊 Analysis</button>
            </div>

            {/* ── NEW — SEARCH & CATEGORY ── */}
            {view==='NEW'&&!selected&&(
              <>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'4px'}}>
                  {['School','Guide'].map(c=>(
                    <button key={c} onClick={()=>setF('category',c)}
                      style={{padding:'14px',borderRadius:'16px',border:form.category===c?'2px solid #020617':'2px solid transparent',
                        background:form.category===c?'#020617':'#fff',color:form.category===c?'#fbbf24':'#64748b',
                        fontWeight:900,fontSize:'13px',textTransform:'uppercase',letterSpacing:'0.05em',cursor:'pointer',
                        boxShadow:form.category===c?'0 6px 15px rgba(0,0,0,0.15)':'0 2px 6px rgba(0,0,0,0.04)', transition:'all 0.2s'}}>
                      {c==='School'?'🏫 School':'📚 Guide'}
                    </button>
                  ))}
                </div>

                <div style={{display:'flex',background:'rgba(0,0,0,0.04)',padding:'4px',borderRadius:'14px',gap:'4px'}}>
                  {['STUDENT','STAFF'].map(t=>(
                    <button key={t} onClick={()=>{setTarget(t);setSearch('');}}
                      style={{flex:1,padding:'10px',borderRadius:'10px',border:'none',cursor:'pointer',fontWeight:900,fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.05em',
                        background:target===t?'#020617':'transparent',color:target===t?'#fff':'#94a3b8'}}>{t}</button>
                  ))}
                </div>

                <div style={S.card}>
                  <label style={S.label}>နာမည် သို့ ID ရှာပါ</label>
                  <input value={search} onChange={e=>setSearch(e.target.value)}
                    placeholder={target==='STUDENT'?'Student name or ID...':'Staff name or ID...'} style={S.input}/>
                  {filtered.length>0&&(
                    <div style={{marginTop:'8px',display:'flex',flexDirection:'column',gap:'6px',maxHeight:'300px',overflowY:'auto'}}>
                      {filtered.map((u,i)=>(
                        <button key={i} onClick={()=>{setSelected(u);setSearch('');}}
                          style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'12px 14px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',textAlign:'left'}}>
                          <div>
                            <p style={{fontWeight:900,fontSize:'13px',color:'#020617',margin:0}}>{getName(u)}</p>
                            <p style={{fontSize:'9px',color:'#94a3b8',margin:'2px 0 0',textTransform:'uppercase',letterSpacing:'0.1em'}}>ID: {getID(u)}</p>
                          </div>
                          <span style={{color:'#94a3b8',fontSize:'16px'}}>→</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {search&&filtered.length===0&&<p style={{textAlign:'center',color:'#94a3b8',fontSize:'12px',padding:'16px 0',margin:0}}>ရှာမတွေ့ပါ</p>}
                </div>
              </>
            )}

            {/* ── NEW — FORM ── */}
            {view==='NEW'&&selected&&(
              <>
                {/* Selected user banner */}
                <div style={{background:'#fef9c3',border:'2px solid #fbbf24',borderRadius:'16px',padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <p style={{fontSize:'9px',color:'#92400e',textTransform:'uppercase',letterSpacing:'0.12em',margin:'0 0 3px',fontWeight:900}}>Target ({form.category})</p>
                    <p style={{fontWeight:900,fontSize:'15px',color:'#020617',margin:0}}>{getName(selected)}</p>
                    <p style={{fontSize:'9px',color:'#92400e',margin:'2px 0 0'}}>ID: {getID(selected)}</p>
                  </div>
                  <button onClick={()=>setSelected(null)} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'10px',padding:'6px 12px',color:'#64748b',fontSize:'11px',fontWeight:900,cursor:'pointer'}}>✕ Change</button>
                </div>

                {/* Leave type */}
                <div style={S.card}>
                  <label style={S.label}>Leave Category</label>
                  <select value={form.type} onChange={e=>setF('type',e.target.value)} style={S.select}>
                    {LEAVE_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>

                {/* ── Duration Type ── */}
                <div style={{...S.card,background:'#f8faff',border:'2px solid #e0e7ff'}}>
                  <label style={{...S.label,color:'#4338ca',marginBottom:'10px'}}>⏱ Duration Type</label>

                  {/* Type pills */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'16px'}}>
                    {DUR_TYPES.map(d=>(
                      <button key={d.id} onClick={()=>setF('durType',d.id)}
                        style={{padding:'10px 6px',borderRadius:'12px',border:'none',cursor:'pointer',fontWeight:900,fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.04em',
                          display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',
                          background:form.durType===d.id?'#4338ca':'#fff',
                          color:form.durType===d.id?'#fff':'#64748b',
                          boxShadow:form.durType===d.id?'0 4px 14px rgba(67,56,202,0.3)':'0 1px 4px rgba(0,0,0,0.06)',
                          transition:'all 0.15s'}}>
                        <span style={{fontSize:'18px'}}>{d.icon}</span>{d.label}
                      </button>
                    ))}
                  </div>

                  {/* FULL DAY */}
                  {form.durType==='FULL'&&(
                    <>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                        <div><label style={S.label}>Start Date *</label><input type="date" value={form.start} onChange={e=>setF('start',e.target.value)} style={S.input}/></div>
                        <div><label style={S.label}>End Date *</label><input type="date" value={form.end} onChange={e=>setF('end',e.target.value)} style={S.input}/></div>
                      </div>
                      {form.start&&form.end&&new Date(form.end)>=new Date(form.start)&&(
                        <div style={{marginTop:'10px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'10px',padding:'8px 12px',textAlign:'center'}}>
                          <span style={{fontWeight:900,fontSize:'20px',color:'#16a34a'}}>{calcDays()}</span>
                          <span style={{fontSize:'11px',color:'#16a34a',marginLeft:'6px',fontWeight:700}}>day{calcDays()!==1?'s':''}</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* HALF DAY */}
                  {form.durType==='HALF'&&(
                    <>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                        <div><label style={S.label}>Date *</label><input type="date" value={form.start} onChange={e=>setF('start',e.target.value)} style={S.input}/></div>
                        <div>
                          <label style={S.label}>Time of Day *</label>
                          <div style={{display:'flex',gap:'6px'}}>
                            {['AM','PM'].map(p=>(
                              <button key={p} onClick={()=>setF('halfPart',p)}
                                style={{flex:1,padding:'12px',borderRadius:'12px',border:'none',cursor:'pointer',fontWeight:900,fontSize:'12px',
                                  background:form.halfPart===p?'#fbbf24':'#f1f5f9',
                                  color:form.halfPart===p?'#020617':'#94a3b8',transition:'all 0.15s'}}>{p}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                      {form.start&&<div style={{marginTop:'10px',background:'#fffbeb',border:'1px solid #fbbf24',borderRadius:'10px',padding:'8px 12px',textAlign:'center'}}><span style={{fontWeight:900,fontSize:'14px',color:'#92400e'}}>½ Day — {form.halfPart} session</span></div>}
                    </>
                  )}

                  {/* PERIOD */}
                  {form.durType==='PERIOD'&&(
                    <>
                      <div style={{marginBottom:'10px'}}><label style={S.label}>Date *</label><input type="date" value={form.start} onChange={e=>setF('start',e.target.value)} style={S.input}/></div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px'}}>
                        <div><label style={S.label}>Period Count *</label>
                          <input type="number" min="1" max="12" value={form.periodCount} onChange={e=>{const v=Math.max(1,parseInt(e.target.value)||1);setF('periodCount',v);}} style={S.input}/>
                        </div>
                        <div><label style={S.label}>From Period</label>
                          <input type="number" min="1" max="12" value={form.periodFrom} onChange={e=>setF('periodFrom',Math.max(1,parseInt(e.target.value)||1))} style={S.input}/>
                        </div>
                        <div><label style={S.label}>To Period</label>
                          <input type="number" min="1" max="12" value={form.periodTo} onChange={e=>setF('periodTo',Math.max(1,parseInt(e.target.value)||1))} style={S.input}/>
                        </div>
                      </div>
                      {form.start&&<div style={{marginTop:'10px',background:'#f5f3ff',border:'1px solid #c4b5fd',borderRadius:'10px',padding:'8px 12px',textAlign:'center'}}><span style={{fontWeight:900,fontSize:'14px',color:'#6d28d9'}}>{form.periodCount} Period{form.periodCount>1?'s':''} ({periodRangeLabel()})</span></div>}
                    </>
                  )}
                </div>

                {/* Student reporter */}
                {target==='STUDENT'&&(
                  <div style={{...S.card,background:'#fffbeb',border:'1px solid rgba(251,191,36,0.3)'}}>
                    <p style={{...S.label,marginBottom:'12px',color:'#92400e'}}>ခွင့်တိုင်သူ အချက်အလက်</p>
                    <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                        <input value={form.reporter} onChange={e=>setF('reporter',e.target.value)} placeholder="Reporter Name *" style={{...S.input,background:'#fff'}}/>
                        <input value={form.relation} onChange={e=>setF('relation',e.target.value)} placeholder="Relationship *" style={{...S.input,background:'#fff'}}/>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                        <input value={form.phone} onChange={e=>setF('phone',e.target.value)} placeholder="Phone *" type="tel" style={{...S.input,background:'#fff'}}/>
                        <select value={form.method} onChange={e=>setF('method',e.target.value)} style={{...S.select,background:'#fff'}}>
                          {METHODS.map(m=><option key={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div style={S.card}>
                  <label style={{...S.label,color:'#ef4444'}}>Reason *</label>
                  <textarea rows={3} value={form.reason} onChange={e=>setF('reason',e.target.value)}
                    placeholder="အကြောင်းပြချက် ရေးပါ..."
                    style={{...S.input,resize:'vertical',minHeight:'80px'}}/>
                </div>

                {/* Notes */}
                <div style={S.card}>
                  <label style={{...S.label,color:'#7c3aed'}}>📝 Notes / Remark <span style={{fontSize:'8px',fontWeight:400,color:'#94a3b8'}}>(Optional)</span></label>
                  <textarea rows={2} value={form.notes} onChange={e=>setF('notes',e.target.value)}
                    placeholder="ထပ်ဆောင်း မှတ်ချက် (optional)..."
                    style={{...S.input,resize:'vertical',minHeight:'60px'}}/>
                </div>

                {/* Summary */}
                {form.start&&(
                  <div style={{background:'#1e1b4b',borderRadius:'14px',padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px'}}>
                    <div>
                      <p style={{fontSize:'8px',color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.12em',margin:'0 0 3px',fontWeight:900}}>Leave Summary</p>
                      <p style={{fontSize:'12px',color:'#fff',fontWeight:900,margin:0}}>{getName(selected)}</p>
                      <p style={{fontSize:'9px',color:'rgba(255,255,255,0.5)',margin:'2px 0 0'}}>{form.type} · {form.start}{form.end&&form.end!==form.start?` → ${form.end}`:''}</p>
                    </div>
                    <div style={{background:'#fbbf24',borderRadius:'10px',padding:'6px 14px',textAlign:'center',flexShrink:0}}>
                      <p style={{fontSize:'12px',fontWeight:900,color:'#020617',margin:0}}>{durationSummary()}</p>
                    </div>
                  </div>
                )}

                <button onClick={handleSubmit} disabled={saving} style={{...S.btnDark,opacity:saving?0.5:1,cursor:saving?'default':'pointer'}}>
                  {saving?'Submitting...':'Submit Leave Request ★'}
                </button>
              </>
            )}

            {/* ── PENDING ── */}
            {view==='PENDING'&&(
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {registry.pending.length===0?(
                  <div style={{textAlign:'center',padding:'50px 0',color:'#94a3b8'}}><div style={{fontSize:'32px',marginBottom:'8px'}}>✓</div><p style={{fontWeight:900}}>Pending leaves မရှိပါ</p></div>
                ):registry.pending.map((l,i)=>{
                  const stInfo = l.User_Type === 'STUDENT' ? getStudentInfo(l.User_ID, l.Name) : {grade:'',section:''};
                  return (
                    <div key={i} style={S.card}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>
                          {l.Category && <span style={{background:'#e0e7ff',border:'1px solid #c7d2fe',color:'#4338ca',fontSize:'8px',fontWeight:900,padding:'2px 10px',borderRadius:'99px',textTransform:'uppercase'}}>{l.Category}</span>}
                          <span style={{background:'#fef9c3',border:'1px solid #fbbf24',color:'#92400e',fontSize:'8px',fontWeight:900,padding:'2px 10px',borderRadius:'99px',textTransform:'uppercase'}}>{l.User_Type}</span>
                          <DurationBadge leave={l}/>
                        </div>
                        <p style={{fontSize:'9px',color:'#94a3b8',flexShrink:0,marginLeft:'8px'}}>{cleanDateStr(l.Date_Applied)}</p>
                      </div>
                      <p style={{fontWeight:900,fontSize:'15px',color:'#020617',margin:'0 0 2px'}}>{l.Name}</p>
                      
                      <div style={{display:'flex', gap:'6px', marginBottom:'10px', flexWrap:'wrap'}}>
                        <span style={{fontSize:'9px',color:'#64748b',background:'#f1f5f9',padding:'2px 6px',borderRadius:'6px',fontWeight:900}}>ID: {l.User_ID}</span>
                        {l.User_Type === 'STUDENT' && (stInfo.grade || stInfo.section) && (
                           <span style={{fontSize:'9px',background:'#e0f2fe',color:'#0284c7',padding:'2px 6px',borderRadius:'6px',fontWeight:900}}>
                             {stInfo.grade ? `Grade ${stInfo.grade}` : ''}{stInfo.grade && stInfo.section ? ' | ' : ''}{stInfo.section ? `Class ${stInfo.section}` : ''}
                           </span>
                        )}
                      </div>

                      <p style={{fontSize:'9px',color:'#94a3b8',margin:'0 0 10px',fontWeight:900}}><span style={{color:'#6366f1'}}>{l.Leave_Type}</span> · {cleanDateStr(l.Start_Date)}{cleanDateStr(l.End_Date)&&cleanDateStr(l.End_Date)!==cleanDateStr(l.Start_Date)?` → ${cleanDateStr(l.End_Date)}`:''}</p>
                      <div style={{background:'#f8fafc',borderLeft:'3px solid #7c3aed',borderRadius:'10px',padding:'10px 12px',marginBottom:'8px'}}>
                        <p style={{fontSize:'9px',color:'#94a3b8',fontWeight:900,margin:'0 0 4px',textTransform:'uppercase',letterSpacing:'0.1em'}}>Reason:</p>
                        <p style={{fontSize:'12px',color:'#334155',margin:0,fontStyle:'italic'}}>"{l.Reason}"</p>
                      </div>
                      {l.Notes&&l.Notes!=='-'&&(
                        <div style={{background:'#f5f3ff',borderLeft:'3px solid #c4b5fd',borderRadius:'10px',padding:'8px 12px',marginBottom:'8px'}}>
                          <p style={{fontSize:'9px',color:'#6d28d9',fontWeight:900,margin:'0 0 2px',textTransform:'uppercase',letterSpacing:'0.08em'}}>📝 Notes</p>
                          <p style={{fontSize:'11px',color:'#5b21b6',margin:0}}>{l.Notes}</p>
                        </div>
                      )}
                      {l.User_Type==='STUDENT'&&<p style={{fontSize:'9px',color:'#94a3b8',margin:'0 0 10px'}}>By: {l.Reporter_Name} ({l.Relationship}) · {l.Phone} · {l.Method}</p>}
                      {user?.userRole==='management'?(
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                          <button onClick={()=>handleAuth(l,'Approved')} disabled={saving} style={{background:'#020617',color:'#fff',border:'none',borderRadius:'12px',padding:'10px',fontSize:'11px',fontWeight:900,cursor:'pointer',textTransform:'uppercase'}}>✓ Approve</button>
                          <button onClick={()=>handleAuth(l,'Rejected')} disabled={saving} style={{background:'#fff',color:'#ef4444',border:'2px solid #fecaca',borderRadius:'12px',padding:'10px',fontSize:'11px',fontWeight:900,cursor:'pointer',textTransform:'uppercase'}}>✕ Reject</button>
                        </div>
                      ):(
                        <div style={{background:'#f1f5f9',color:'#64748b',borderRadius:'10px',padding:'8px',textAlign:'center',fontSize:'10px',fontWeight:900,textTransform:'uppercase',letterSpacing:'0.1em'}}>Awaiting Authorization from Management</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── HISTORY (GROUPED BY DATE & FILTERABLE) ── */}
            {view==='HISTORY'&&(
              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                {/* Search and Filters */}
                <div style={{display:'flex',gap:'8px',marginBottom:'4px',flexWrap:'wrap'}}>
                  <input 
                    placeholder="Search by name or type..." 
                    value={histSearch} 
                    onChange={e=>setHistSearch(e.target.value)} 
                    style={{...S.input, flex:1, minWidth:'150px', background:'#fff', border:'1px solid #cbd5e1'}} 
                  />
                  <select value={histFilter} onChange={e=>setHistFilter(e.target.value)} style={{...S.select, width:'auto', background:'#fff', border:'1px solid #cbd5e1'}}>
                    <option value="ALL">All Roles</option>
                    <option value="STUDENT">Students</option>
                    <option value="STAFF">Staff</option>
                  </select>
                </div>

                {sortedHistoryDates.length === 0 ? (
                  <div style={{textAlign:'center',padding:'50px 0',color:'#94a3b8'}}>History မှတ်တမ်း မရှိသေးပါ / ရှာမတွေ့ပါ</div>
                ) : sortedHistoryDates.map(date => (
                  <div key={date}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px',marginTop:'8px'}}>
                      <span style={{fontSize:'12px',fontWeight:900,color:'#0f172a',background:'#e2e8f0',padding:'4px 10px',borderRadius:'8px'}}>📅 {date}</span>
                      <div style={{flex:1,height:'2px',background:'#f1f5f9',borderRadius:'99px'}}/>
                    </div>
                    
                    <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                      {groupedHistory[date].map((l, i) => {
                        const stInfo = l.User_Type === 'STUDENT' ? getStudentInfo(l.User_ID, l.Name) : {grade:'',section:''};
                        return (
                          <div key={i} style={{background:'#fff',border:'1px solid #f1f5f9',borderRadius:'16px',padding:'14px',boxShadow:'0 2px 4px rgba(0,0,0,0.02)',borderLeft:`4px solid ${l.Status==='Approved'?'#10b981':'#ef4444'}`}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap',marginBottom:'6px'}}>
                                  <p style={{fontWeight:900,fontSize:'14px',color:'#020617',margin:0}}>{l.Name}</p>
                                  <span style={{fontSize:'8px',background:l.User_Type==='STUDENT'?'#e0e7ff':'#fef3c7',color:l.User_Type==='STUDENT'?'#4f46e5':'#d97706',padding:'2px 6px',borderRadius:'6px',fontWeight:900}}>{l.User_Type}</span>
                                  <DurationBadge leave={l}/>
                                </div>
                                
                                <div style={{display:'flex', gap:'6px', marginBottom:'8px', flexWrap:'wrap'}}>
                                  {l.Category && <span style={{fontSize:'9px',color:'#4338ca',background:'#e0e7ff',padding:'2px 6px',borderRadius:'6px',fontWeight:900}}>{l.Category}</span>}
                                  {l.User_Type === 'STUDENT' && (stInfo.grade || stInfo.section) && (
                                     <span style={{fontSize:'9px',background:'#e0f2fe',color:'#0284c7',padding:'2px 6px',borderRadius:'6px',fontWeight:900}}>
                                       {stInfo.grade ? `Grade ${stInfo.grade}` : ''}{stInfo.grade && stInfo.section ? ' | ' : ''}{stInfo.section ? `Class ${stInfo.section}` : ''}
                                     </span>
                                  )}
                                </div>

                                <p style={{fontSize:'10px',color:'#64748b',margin:'0 0 6px',fontWeight:900}}>
                                  <span style={{color:'#6366f1'}}>{l.Leave_Type}</span> · {cleanDateStr(l.Start_Date)}{cleanDateStr(l.End_Date)&&cleanDateStr(l.End_Date)!==cleanDateStr(l.Start_Date)?` → ${cleanDateStr(l.End_Date)}`:''}
                                </p>
                                
                                <div style={{background:'#f8fafc',padding:'8px 10px',borderRadius:'8px',borderLeft:'2px solid #cbd5e1'}}>
                                  <p style={{fontSize:'9px',color:'#94a3b8',fontWeight:900,margin:'0 0 2px',textTransform:'uppercase',letterSpacing:'0.1em'}}>Reason:</p>
                                  <p style={{fontSize:'11px',color:'#334155',margin:0,fontStyle:'italic'}}>"{l.Reason}"</p>
                                </div>

                                {l.Notes&&l.Notes!=='-'&&<p style={{fontSize:'10px',color:'#7c3aed',margin:'6px 0 0',fontStyle:'italic',fontWeight:700}}>📝 {l.Notes}</p>}
                              </div>
                              <div style={{textAlign:'right'}}>
                                <span style={{fontSize:'9px',fontWeight:900,padding:'4px 10px',borderRadius:'99px',flexShrink:0,marginLeft:'12px',
                                  background:l.Status==='Approved'?'#dcfce7':'#fee2e2',
                                  color:l.Status==='Approved'?'#16a34a':'#dc2626'}}>{l.Status}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── ANALYSIS ── */}
            {view==='ANALYSIS'&&(
              <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
                
                {/* Watchlist Section */}
                <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'24px',padding:'20px 16px',boxShadow:'0 10px 30px rgba(0,0,0,0.05)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px'}}>
                    <div style={{width:'4px',height:'16px',background:'#ef4444',borderRadius:'99px'}}/>
                    <h3 style={{fontSize:'12px',color:'#0f172a',fontWeight:900,textTransform:'uppercase',letterSpacing:'0.15em',margin:0}}>Attendance Watchlist</h3>
                  </div>
                  
                  {/* Watchlist Filters */}
                  <div style={{display:'flex',gap:'8px',overflowX:'auto',paddingBottom:'8px',marginBottom:'12px'}}>
                    {watchTabs.map(f => {
                      const count = watchMap[f.id].users.length;
                      const active = watchFilter === f.id;
                      return (
                        <button key={f.id} onClick={() => setWatchFilter(f.id)}
                          style={{
                            flexShrink:0, padding:'10px 12px', borderRadius:'12px', border:'none', cursor:'pointer',
                            fontSize:'10px', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.05em',
                            display:'flex', alignItems:'center', gap:'6px',
                            background: active ? '#020617' : '#f1f5f9',
                            color: active ? '#fff' : '#64748b'
                          }}>
                          {f.label} 
                          <span style={{background:active?'rgba(255,255,255,0.2)':'#e2e8f0',color:active?'#fbbf24':'#475569',padding:'2px 6px',borderRadius:'6px'}}>{count}</span>
                        </button>
                      )
                    })}
                  </div>

                  {watchMap[watchFilter] && <WatchlistGroup {...watchMap[watchFilter]} bg="#f8fafc" color="#0f172a" />}
                </div>

                {/* General Stats Filters */}
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  <div style={{display:'flex',background:'#fff',padding:'4px',borderRadius:'14px',border:'1px solid #e2e8f0',gap:'4px',flex:1,minWidth:'180px'}}>
                    {["ALL","7D","30D","90D"].map(r=>(
                      <button key={r} onClick={()=>setRangeFilter(r)}
                        style={{flex:1,padding:'8px 4px',borderRadius:'10px',border:'none',cursor:'pointer',fontSize:'9px',fontWeight:900,
                          background:rangeFilter===r?'#020617':'transparent',color:rangeFilter===r?'#fff':'#64748b'}}>{r}</button>
                    ))}
                  </div>
                  <div style={{display:'flex',background:'#fff',padding:'4px',borderRadius:'14px',border:'1px solid #e2e8f0',gap:'4px',flex:1,minWidth:'180px'}}>
                    {["ALL","STUDENT","STAFF"].map(t=>(
                      <button key={t} onClick={()=>setTypeFilter(t)}
                        style={{flex:1,padding:'8px 4px',borderRadius:'10px',border:'none',cursor:'pointer',fontSize:'9px',fontWeight:900,
                          background:typeFilter===t?'#fbbf24':'transparent',color:typeFilter===t?'#020617':'#64748b'}}>{t}</button>
                    ))}
                  </div>
                </div>

                {/* KPI Cards */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px'}}>
                  {[
                    {label:"Total Leaves", value:analysisLeaves.length,                                     icon:"📋", bg:'#eff6ff', color:'#2563eb'},
                    {label:"Total Days",   value:analysisLeaves.reduce((s,l)=>s+Number(l.Total_Days||1),0), icon:"📅", bg:'#fef3c7', color:'#d97706'},
                    {label:"Approved",     value:analysisLeaves.filter(l=>l.Status==="Approved").length,     icon:"✅", bg:'#f0fdf4', color:'#16a34a'},
                  ].map((s,i)=>(
                    <div key={i} style={{background:s.bg,padding:'16px 12px',borderRadius:'16px',textAlign:'center',border:`1px solid ${s.color}33`}}>
                      <div style={{fontSize:'20px',marginBottom:'4px'}}>{s.icon}</div>
                      <p style={{fontSize:'22px',fontWeight:900,color:s.color,margin:'0 0 4px',lineHeight:1}}>{s.value}</p>
                      <p style={{fontSize:'8px',fontWeight:900,color:s.color,textTransform:'uppercase',letterSpacing:'0.05em',margin:0,opacity:0.8}}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Duration Type Breakdown */}
                <div style={S.card}>
                  <p style={{fontSize:'10px',fontWeight:900,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 12px'}}>Duration Type Breakdown</p>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px'}}>
                    {[
                      {label:'Full Day', count:fullDayCount, bg:'#f0fdf4', color:'#16a34a', icon:'📅'},
                      {label:'½ Day',    count:halfDayCount, bg:'#fffbeb', color:'#92400e', icon:'🌗'},
                      {label:'Period',   count:periodCount,  bg:'#f5f3ff', color:'#6d28d9', icon:'⏱️'},
                    ].map((x,i)=>(
                      <div key={i} style={{background:x.bg,borderRadius:'12px',padding:'12px 8px',textAlign:'center',border:`1px solid ${x.color}22`}}>
                        <div style={{fontSize:'16px',marginBottom:'4px'}}>{x.icon}</div>
                        <p style={{fontSize:'18px',fontWeight:900,color:x.color,margin:'0 0 2px',lineHeight:1}}>{x.count}</p>
                        <p style={{fontSize:'8px',fontWeight:900,color:x.color,textTransform:'uppercase',margin:0}}>{x.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Individual Search */}
                <div style={{background:'#fff',border:'2px solid #e2e8f0',borderRadius:'20px',padding:'20px 16px',boxShadow:'0 10px 25px rgba(0,0,0,0.05)'}}>
                  <p style={{fontSize:'11px',fontWeight:900,color:'#0284c7',textTransform:'uppercase',letterSpacing:'0.15em',margin:'0 0 12px'}}>🔍 Individual Search</p>
                  <input 
                    value={historySearchQuery} 
                    onChange={e => setHistorySearchQuery(e.target.value)}
                    placeholder="Search student or staff name/ID..."
                    style={{width:'100%',background:'#f8fafc',border:'2px solid #cbd5e1',borderRadius:'12px',padding:'12px',color:'#0f172a',fontSize:'13px',fontWeight:700,outline:'none',marginBottom:'12px'}}
                  />
                  {historySearchQuery.trim().length >= 2 && (
                    <div style={{maxHeight:'350px',overflowY:'auto',display:'flex',flexDirection:'column',gap:'10px',paddingRight:'4px'}}>
                      {searchedUsers.length === 0 ? (
                        <p style={{fontSize:'11px',color:'#94a3b8',textAlign:'center',fontStyle:'italic',margin:'10px 0'}}>No records found.</p>
                      ) : searchedUsers.map((u, i) => (
                        <div key={i} style={{background:'#f1f5f9',padding:'14px',borderRadius:'16px'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                            <div>
                              <p style={{fontSize:'14px',fontWeight:900,color:'#0f172a',margin:'0 0 6px'}}>{u.name}</p>
                              <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                                <span style={{fontSize:'8px',background:'#e2e8f0',color:'#475569',padding:'2px 6px',borderRadius:'6px',fontWeight:900}}>ID: {u.id}</span>
                                {u.type === 'STUDENT' ? (
                                  <>
                                    <span style={{fontSize:'8px',background:'#e0e7ff',color:'#4f46e5',padding:'2px 6px',borderRadius:'6px',fontWeight:900}}>STUDENT</span>
                                    {(u.grade || u.section) && (
                                      <span style={{fontSize:'8px',background:'#e0f2fe',color:'#0284c7',padding:'2px 6px',borderRadius:'6px',fontWeight:900}}>
                                        {u.grade ? `Grade ${u.grade}` : ''}{u.grade && u.section ? ' | ' : ''}{u.section ? `Class ${u.section}` : ''}
                                      </span>
                                    )}
                                  </>
                                ) : <span style={{fontSize:'8px',background:'#fef3c7',color:'#d97706',padding:'2px 6px',borderRadius:'6px',fontWeight:900}}>STAFF</span>}
                              </div>
                            </div>
                            <div style={{textAlign:'right'}}>
                              <p style={{fontSize:'20px',fontWeight:900,color:'#f59e0b',margin:0,lineHeight:1}}>{u.totalDays}</p>
                              <p style={{fontSize:'8px',textTransform:'uppercase',color:'#64748b',margin:'4px 0 0',fontWeight:900}}>Total Days</p>
                            </div>
                          </div>
                          <div style={{borderTop:'1px solid #cbd5e1',paddingTop:'10px',display:'flex',flexDirection:'column',gap:'6px'}}>
                            <p style={{fontSize:'9px',color:'#94a3b8',textTransform:'uppercase',fontWeight:900,margin:'0 0 2px',letterSpacing:'0.1em'}}>Absence Records:</p>
                            {u.reasons.map((r, ri) => (
                              <div key={ri} style={{background:'#fff',padding:'10px',borderRadius:'10px',display:'flex',gap:'10px',alignItems:'center',border:'1px solid #e2e8f0'}}>
                                <div style={{background:'#f8fafc',padding:'6px 8px',borderRadius:'8px',textAlign:'center',minWidth:'55px',border:'1px solid #e2e8f0'}}>
                                  <p style={{fontSize:'9px',color:'#475569',fontWeight:900,margin:0}}>{r.start}</p>
                                  {r.end && r.end !== r.start && <p style={{fontSize:'8px',color:'#94a3b8',fontWeight:900,margin:'2px 0 0'}}>↓<br/>{r.end}</p>}
                                </div>
                                <div style={{flex:1}}>
                                  <span style={{fontSize:'8px',color:'#0284c7',textTransform:'uppercase',fontWeight:900,display:'block',marginBottom:'2px'}}>{r.type}</span>
                                  <p style={{fontSize:'11px',color:'#334155',margin:0,fontStyle:'italic',lineHeight:1.4}}>Reason: {r.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}