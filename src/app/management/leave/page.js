"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const getDisplayName = s => s['Name (ALL CAPITAL)'] || s['အမည်'] || s.Name || '';
const calcDays = (s, e) => { if(!s||!e) return 0; const d=Math.ceil((new Date(e)-new Date(s))/86400000)+1; return d>0?d:0; };
const LEAVE_DEFAULTS = ['Casual Leave','Medical Leave','Emergency Leave','Personal Leave', 'Sick Leave', 'Funeral', 'Personal Affair'];

// Date တွေနောက်က T... ဖြုတ်ဖို့ Helper function
const cleanDateStr = (d) => {
  if (!d || d === '-') return '-';
  return String(d).split('T')[0];
};

// ── Duration badge ────────────────────────────────────────────────────────────
function DurationBadge({ leave, big }) {
  const dt   = leave.Duration_Type || leave.Leave_Mode === 'Half Day' ? 'HALF' : leave.Leave_Mode === 'Period-wise' ? 'PERIOD' : 'FULL';
  const days = Number(leave.Total_Days || 1);
  const sz   = big ? { fontSize:'9px', padding:'3px 10px' } : { fontSize:'8px', padding:'2px 8px' };
  
  if (dt === 'HALF') {
    const part = leave.Half_Day_Part && leave.Half_Day_Part !== '-' ? ` (${leave.Half_Day_Part})` : '';
    return <span style={{...sz, background:'#fef3c7', color:'#92400e', fontWeight:900, borderRadius:'99px', textTransform:'uppercase', whiteSpace:'nowrap'}}>🌗 ½ Day{part}</span>;
  }
  if (dt === 'PERIOD') {
    const cnt   = leave.Period_Count && leave.Period_Count !== '-' ? leave.Period_Count : '?';
    const range = leave.Period_Range && leave.Period_Range !== '-' ? ` ${leave.Period_Range}` : '';
    return <span style={{...sz, background:'#ede9fe', color:'#6d28d9', fontWeight:900, borderRadius:'99px', textTransform:'uppercase', whiteSpace:'nowrap'}}>⏱️ {cnt} Period{Number(cnt)>1?'s':''}{range}</span>;
  }
  return <span style={{...sz, background:'#f0fdf4', color:'#16a34a', fontWeight:900, borderRadius:'99px', textTransform:'uppercase', whiteSpace:'nowrap'}}>📅 {days} Day{days!==1?'s':''}</span>;
}

// ── Watchlist Group UI (Detailed Card Layout) ─────────────────────────────────
const WatchlistGroup = ({ title, users, icon, color }) => (
  <div className="bg-white/5 border border-white/10 p-4 rounded-3xl flex flex-col max-h-[500px]">
    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3 shrink-0">
      <p className={`text-[12px] md:text-[14px] font-black uppercase tracking-widest leading-tight ${color}`}>{icon} {title}</p>
      <span className="text-[11px] px-3 py-1.5 rounded-lg font-black bg-white/10 text-white shrink-0">{users.length} Total</span>
    </div>
    <div className="space-y-3 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {users.length === 0 ? <p className="text-[11px] text-white/30 italic text-center py-10">No records found for this category</p> : users.map((u,i)=>(
        <div key={i} className="bg-slate-900/60 rounded-2xl p-4 border border-white/5 flex flex-col gap-2">
          <div>
            <p className="text-[14px] font-bold text-slate-100 leading-tight">{u.name}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[9px] px-2 py-1 rounded-md bg-white/10 text-slate-300 font-black tracking-widest">{u.id}</span>
              {u.type === 'STUDENT' ? (
                <>
                  <span className="text-[9px] px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-300 font-bold uppercase tracking-widest">Student</span>
                  {(u.grade || u.section) && (
                    <span className="text-[9px] px-2 py-1 rounded-md bg-sky-500/20 text-sky-300 font-bold uppercase tracking-widest whitespace-nowrap">
                      {u.grade ? `G-${u.grade}` : ''}{u.grade && u.section ? ' · ' : ''}{u.section}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[9px] px-2 py-1 rounded-md bg-amber-500/20 text-amber-300 font-bold uppercase tracking-widest">Staff</span>
              )}
            </div>
          </div>
          {u.reasons && u.reasons.length > 0 && (
            <div className="border-t border-white/5 pt-3 space-y-2 mt-2">
              <p className="text-[9px] uppercase tracking-widest text-slate-500 font-black">Absence Reasons (Recent):</p>
              {u.reasons.slice(0, 2).map((r, ri) => (
                <div key={ri} className="text-[11px] bg-white/5 p-2.5 rounded-xl">
                  <span className="text-slate-400 font-black text-[9px] block mb-1">📅 {r.start}{r.end && r.end !== r.start ? ` → ${r.end}` : ''}</span>
                  <span className="text-slate-300 italic">{r.text}</span>
                </div>
              ))}
              {u.reasons.length > 2 && (
                <p className="text-[9px] text-sky-400 font-bold italic text-center pt-1 mt-1">
                  Use search below to see {u.reasons.length - 2} more records
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default function ManagementLeaveHub() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [proc,      setProc]      = useState(false);
  const [tab,       setTab]       = useState("QUEUE");
  const [rangeFilter, setRangeFilter] = useState("ALL");
  const [typeFilter,  setTypeFilter]  = useState("ALL");
  
  // Watchlist & Search States
  const [watchFilter, setWatchFilter] = useState("TODAY"); 
  const [historySearchQuery, setHistorySearchQuery] = useState("");

  // ── Submit Form States ─────────────────────────────────────────────────────
  const [allStaff, setAllStaff]       = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [otherTarget, setOtherTarget] = useState('STAFF');
  const [otherSearch, setOtherSearch] = useState('');
  const [otherSel, setOtherSel]       = useState(null);
  const [saving, setSaving]           = useState(false);
  const [otherForm, setOtherForm]     = useState({
    Category: 'School', // Category (School / Guide)
    Leave_Type:'Casual Leave', Start_Date:'', End_Date:'', Reason:'',
    Leave_Mode:'Full Day', Time_Detail:'', Attachment_Link:'',
    Reporter_Name:'', Relationship:'', Phone:'', Method:'Phone Call',
    Status: 'Approved' 
  });

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user')||sessionStorage.getItem('user')||"null");
    if (!auth||auth.userRole!=='management') { router.push('/login'); return; }
    setUser(auth);
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch(WEB_APP_URL,{method:'POST',body:JSON.stringify({action:'getInitialData'})});
      const r   = await res.json();
      if (r.success) {
        setAllLeaves((r.leaves||[]).map((l,i)=>({...l,_rowIndex:i+2})));
        const active = s => String(s.Status||'TRUE').toUpperCase() !== 'FALSE';
        setAllStaff((r.staffList||r.staff||[]).filter(active));
        setAllStudents((r.students||[]).filter(active));
      }
    } catch(e){console.error(e);}
    finally{setLoading(false);}
  };

  const handleAction = async (leave, status) => {
    if (!user?.Name) return alert("Session Expired.");
    setProc(true);
    try {
      const cleanDate = cleanDateStr(leave.Start_Date);
      const res = await fetch(WEB_APP_URL,{method:'POST',body:JSON.stringify({action:'updateLeave',rowIndex:leave._rowIndex,userId:leave.User_ID,name:leave.Name,startDate:cleanDate,status,approvedBy:user.Name})});
      const r   = await res.json();
      if (r.success) {
        setAllLeaves(prev=>prev.map(l=>l._rowIndex===leave._rowIndex?{...l,Status:status,Approved_By:user.Name}:l));
      } else alert("FAIL: "+r.message);
    } catch { alert("Network Error"); }
    finally{setProc(false);}
  };

  const handleOtherSubmit = async () => {
    if (!otherSel)                return alert('တစ်ဦး ရွေးပါ');
    if (!otherForm.Leave_Type)    return alert('Leave Type ရွေးပါ');
    if (!otherForm.Start_Date)    return alert('Start Date ထည့်ပါ');
    if (!otherForm.End_Date)      return alert('End Date ထည့်ပါ');
    if (!otherForm.Reason.trim()) return alert('Reason ဖြည့်ပါ');
    if (otherTarget==='STUDENT' && !otherForm.Reporter_Name.trim()) return alert('Reporter Name ဖြည့်ပါ');
    if (otherTarget==='STUDENT' && !otherForm.Phone.trim()) return alert('Phone ဖြည့်ပါ');
    if ((otherForm.Leave_Mode === 'Half Day' || otherForm.Leave_Mode === 'Period-wise') && !otherForm.Time_Detail.trim()) {
      return alert('Half-day / Period-wise အတွက် အချိန်အသေးစိတ် ထည့်ပါ');
    }
    if (otherForm.End_Date < otherForm.Start_Date) return alert('End Date မှားနေသည်');
    
    const days = calcDays(otherForm.Start_Date, otherForm.End_Date);
    setSaving(true);
    try {
      const isStaff = otherTarget === 'STAFF';
      const mmToday = new Date().toLocaleDateString('en-CA', {timeZone: 'Asia/Yangon'});
      const entry = [{
        Date_Applied: mmToday,
        Category: otherForm.Category,
        User_Type: otherTarget,
        User_ID: otherSel['Enrollment No.'] || otherSel.Student_ID || otherSel.Staff_ID || '',
        Name: getDisplayName(otherSel),
        Leave_Type: otherForm.Leave_Type,
        Start_Date: otherForm.Start_Date,
        End_Date: otherForm.End_Date,
        Total_Days: days,
        Reason: otherForm.Reason.trim(),
        Leave_Mode: otherForm.Leave_Mode,
        Leave_Detail: otherForm.Time_Detail.trim() || '-',
        Attachment_Link: otherForm.Attachment_Link || '-',
        Reporter_Name: isStaff ? (user.Name||user.username||'Management') : otherForm.Reporter_Name,
        Relationship: isStaff ? 'Management' : otherForm.Relationship,
        Phone: isStaff ? '-' : otherForm.Phone,
        Method: isStaff ? 'Direct' : otherForm.Method,
        Approved_By: otherForm.Status === 'Approved' ? (user.Name||'Management') : '-',
        Status: otherForm.Status
      }];
      
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'recordNote', sheetName:'Leave_Records', data: entry }) });
      const r = await res.json();
      if (r.success) {
        alert('Leave Form တင်ပြီးပါပြီ ✓');
        setOtherSel(null); setOtherSearch('');
        setOtherForm(f=>({
          ...f, Start_Date:'', End_Date:'', Reason:'', Leave_Mode:'Full Day', Time_Detail:'', Attachment_Link:'', Reporter_Name:'', Relationship:'', Phone:''
        }));
        fetchLeaves(); 
        setTab(otherForm.Status === 'Pending' ? 'QUEUE' : 'HISTORY');
      } else alert(r.message||'Error');
    } catch { alert('Network error'); }
    setSaving(false);
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const pending = allLeaves.filter(x=>x.Status==="Pending");
  const history = allLeaves.filter(x=>x.Status!=="Pending");

  const now = new Date();
  const analysisLeaves = allLeaves.filter(l=>{
    const days=(now-new Date(cleanDateStr(l.Start_Date)))/86400000;
    if (rangeFilter==="7D")  return days<=7;
    if (rangeFilter==="30D") return days<=30;
    if (rangeFilter==="90D") return days<=90;
    return true;
  }).filter(l=>typeFilter==="ALL"||l.User_Type===typeFilter);

  const leaveCounts = analysisLeaves.reduce((acc,l)=>{
    const k=l.Name||"Unknown";
    if (!acc[k]) acc[k]={name:k,type:l.User_Type,count:0,days:0};
    acc[k].count++; acc[k].days+=Number(l.Total_Days||1); return acc;
  },{});
  const topLeaves = Object.values(leaveCounts).sort((a,b)=>b.days-a.days).slice(0,10);

  const leaveTypeCount = analysisLeaves.reduce((acc,l)=>{
    const t=l.Leave_Type||"Other"; acc[t]=(acc[t]||0)+1; return acc;
  },{});
  const leaveTypes   = Object.entries(leaveTypeCount).sort((a,b)=>b[1]-a[1]);
  const maxTypeCount = leaveTypes[0]?.[1]||1;

  const monthlyData = Array.from({length:6},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-(5-i),1);
    const label=d.toLocaleDateString('en-US',{month:'short'});
    const count=allLeaves.filter(l=>{
      const ld=new Date(cleanDateStr(l.Start_Date));
      return ld.getFullYear()===d.getFullYear()&&ld.getMonth()===d.getMonth();
    }).length;
    return {label,count};
  });
  const maxMonthCount=Math.max(...monthlyData.map(m=>m.count),1);

  // ── Watchlist & Detailed Search Calculation ───────────────────────────────
  const userStats = {};
  const todayStr = new Date().toLocaleDateString('en-CA', {timeZone: 'Asia/Yangon'});
  const nowMs = now.getTime();

  allLeaves.filter(l => l.Status === 'Approved').forEach(l => {
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
      const st = allStudents.find(s => s.Student_ID === u.id || s['Enrollment No.'] === u.id || s['Name (ALL CAPITAL)'] === u.name || s.Name === u.name);
      u.grade = st ? (st.Grade || '') : '';
      u.section = st ? (st.Class || st.Section || '') : '';
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
    'TODAY': { title: 'ယနေ့ ပျက်သူ', users: statsList.filter(u => u.isAbsentToday), icon: '📍', color: 'text-sky-400' },
    'C2':    { title: '၂ ရက်ဆက်တိုက်', users: statsList.filter(u => u.maxConsecutive === 2), icon: '⚠️', color: 'text-amber-400' },
    'C3':    { title: '၃ ရက်ဆက်တိုက်', users: statsList.filter(u => u.maxConsecutive >= 3 && u.maxConsecutive < 5), icon: '🔥', color: 'text-orange-400' },
    'C5':    { title: '၅ ရက်ဆက်တိုက်', users: statsList.filter(u => u.maxConsecutive === 5), icon: '🚨', color: 'text-rose-400' },
    'CO5':   { title: '> ၅ ရက်ဆက်တိုက်', users: statsList.filter(u => u.maxConsecutive > 5), icon: '💀', color: 'text-rose-600' },
    'W3':    { title: '၁ ပတ် (≥ ၃ ရက်)', users: statsList.filter(u => u.last7 >= 3), icon: '📅', color: 'text-indigo-400' },
    'M3':    { title: '၁ လ (≥ ၃ ရက်)', users: statsList.filter(u => u.last30 >= 3), icon: '📆', color: 'text-purple-400' },
    'M5':    { title: '၃ လ (≥ ၅ ရက်)', users: statsList.filter(u => u.last90 >= 5), icon: '📊', color: 'text-pink-400' },
    'ALL5':  { title: 'All Time (≥ ၅ ရက်)', users: statsList.filter(u => u.totalDays >= 5), icon: '🏆', color: 'text-slate-300' }
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

  // Derived for History Search
  const searchedUsers = historySearchQuery.trim().length >= 2 
    ? statsList.filter(u => 
        u.name.toLowerCase().includes(historySearchQuery.toLowerCase()) || 
        u.id.toLowerCase().includes(historySearchQuery.toLowerCase())
      )
    : [];

  const TABS = [
    {id:"QUEUE",    label:"Queue",    badge:pending.length},
    {id:"SUBMIT",   label:"Submit",   badge:null},
    {id:"ANALYSIS", label:"Analysis", badge:null},
    {id:"HISTORY",  label:"History",  badge:history.length},
  ];

  const othDays = calcDays(otherForm.Start_Date, otherForm.End_Date);
  const otherList = otherTarget==='STAFF' ? allStaff : allStudents;
  const filteredOther = otherSearch.length >= 2
    ? otherList.filter(s => {
        const n = (s['Name (ALL CAPITAL)'] || s.Name || '').toLowerCase();
        const m = s['အမည်'] || '';
        const id = s['Enrollment No.'] || s.Staff_ID || s.Student_ID || '';
        return n.includes(otherSearch.toLowerCase()) || m.includes(otherSearch) || id.includes(otherSearch);
      }).slice(0,8)
    : [];

  const halfDayCount   = analysisLeaves.filter(l=>(l.Duration_Type||'FULL')==='HALF').length;
  const periodCount    = analysisLeaves.filter(l=>(l.Duration_Type||'FULL')==='PERIOD').length;
  const fullDayCount   = analysisLeaves.filter(l=>(l.Duration_Type||'FULL')==='FULL').length;

  if (loading||proc) return (
    <div className="min-h-[50vh] flex items-center justify-center font-black text-[#4c1d95] animate-pulse uppercase italic tracking-widest text-lg">
      {proc?"Processing...":"Loading Leave Hub..."}
    </div>
  );

  return (
    <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch'}}
      className="bg-[#F0F9FF] font-black text-slate-950 p-4 md:p-6 pb-36">
      <div className="max-w-[960px] mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-slate-950 rounded-[2.5rem] p-7 border-b-[10px] border-[#fbbf24] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-56 h-56 bg-[#fbbf24]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"/>
          <div className="z-10">
            <p className="text-[#fbbf24] text-[9px] uppercase tracking-[0.4em] font-black mb-2">Management Zone</p>
            <h1 className="text-3xl md:text-5xl italic uppercase font-black text-white tracking-tighter leading-none">Leave Hub</h1>
          </div>
          <div className="flex gap-4 z-10 flex-wrap justify-center">
            <div className="bg-white/10 rounded-2xl px-5 py-3 text-center border border-white/10">
              <p className="text-2xl font-black text-white">{pending.length}</p>
              <p className="text-[8px] uppercase tracking-widest text-amber-400 font-black">Pending</p>
            </div>
            <div className="bg-white/10 rounded-2xl px-5 py-3 text-center border border-white/10">
              <p className="text-2xl font-black text-white">{allLeaves.length}</p>
              <p className="text-[8px] uppercase tracking-widest text-slate-400 font-black">Total</p>
            </div>
            <button onClick={fetchLeaves}
              className="bg-white/10 rounded-2xl px-4 py-3 border border-white/10 text-white text-xl hover:bg-white/20 transition-all">↻</button>
          </div>
        </div>

        {/* MAIN TABS */}
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 gap-1 overflow-x-auto">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex-1 py-3.5 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap
                ${tab===t.id?'bg-slate-950 text-white shadow-md':'text-slate-400 hover:text-slate-700'}`}>
              {t.label}
              {t.badge!==null&&t.badge>0&&(
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black ${tab===t.id?'bg-[#fbbf24] text-slate-950':'bg-slate-100 text-slate-500'}`}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ══ QUEUE ══ */}
        {tab==="QUEUE"&&(
          <div className="space-y-5">
            {pending.length===0?(
              <div className="py-24 text-center">
                <p className="text-6xl mb-4">✅</p>
                <p className="font-black uppercase italic text-slate-300 text-xl tracking-widest">Queue Empty</p>
              </div>
            ):pending.map((l,i)=>(
              <div key={i} className="bg-white p-6 rounded-[2.5rem] border-b-[10px] border-slate-200 shadow-xl space-y-4 hover:border-[#fbbf24] transition-all">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-amber-100 text-amber-700 text-[8px] px-3 py-1 rounded-full font-black uppercase">{l.User_Type}</span>
                    <DurationBadge leave={l} big/>
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase">{cleanDateStr(l.Date_Applied)}</span>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                    {l.User_Type==="STUDENT"?"🎓":"👔"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-black italic uppercase text-slate-950 leading-none truncate">{l.Name}</h3>
                    <p className="text-[9px] text-slate-400 font-black uppercase mt-1">ID: {l.User_ID} · {l.Leave_Type}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-black text-slate-950">{l.Total_Days}</p>
                    <p className="text-[8px] uppercase text-slate-400 font-black">
                      {(l.Duration_Type||'FULL')==='HALF'?'half':'days'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 text-sm italic text-slate-600">"{l.Reason}"</div>

                <p className="text-[9px] font-black text-slate-400 uppercase">
                  📅 {cleanDateStr(l.Start_Date)}{cleanDateStr(l.End_Date)&&cleanDateStr(l.End_Date)!==cleanDateStr(l.Start_Date)?` → ${cleanDateStr(l.End_Date)}`:''}
                  {l.Half_Day_Part&&l.Half_Day_Part!=='-'&&<span className="ml-2">· {l.Half_Day_Part} Session</span>}
                  {l.Period_Range&&l.Period_Range!=='-'&&<span className="ml-2">· Periods: {l.Period_Range}</span>}
                  {l.Reporter_Name&&l.Reporter_Name!=='-'&&(
                    <span className="ml-3 break-all block mt-1">· Reporter: {l.Reporter_Name} ({l.Relationship}) {l.Phone}</span>
                  )}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button onClick={()=>handleAction(l,"Approved")}
                    className="py-4 bg-emerald-500 text-white rounded-[1.5rem] font-black uppercase shadow-lg border-b-4 border-emerald-800 active:scale-95 transition-all hover:bg-emerald-600">
                    ✓ Approve
                  </button>
                  <button onClick={()=>handleAction(l,"Rejected")}
                    className="py-4 bg-rose-500 text-white rounded-[1.5rem] font-black uppercase shadow-lg border-b-4 border-rose-800 active:scale-95 transition-all hover:bg-rose-600">
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ SUBMIT (NEW FORM) ══ */}
        {tab==="SUBMIT"&&(
          <div className="space-y-6">
            
            {/* Category (School/Guide) */}
            <div className="grid grid-cols-2 gap-3">
              {['School','Guide'].map(c=>(
                <button key={c} onClick={()=>setOtherForm(f=>({...f,Category:c}))}
                  className={`py-4 px-2 rounded-[1.5rem] font-black uppercase text-xs transition-all flex flex-col items-center gap-2 border-b-4
                    ${otherForm.Category===c?'bg-indigo-600 text-white border-indigo-800 shadow-lg':'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}>
                  <span className="text-2xl leading-none">{c==='School'?'🏫':'📚'}</span>{c}
                </button>
              ))}
            </div>

            {/* Target Selector */}
            <div className="grid grid-cols-2 gap-3">
              {[{id:'STAFF',icon:'👔',label:'Staff Leave'},{id:'STUDENT',icon:'🎓',label:'Student Leave'}].map(t=>(
                <button key={t.id} onClick={()=>{setOtherTarget(t.id);setOtherSel(null);setOtherSearch('');}}
                  className={`py-4 px-2 rounded-[1.5rem] font-black uppercase text-xs transition-all flex flex-col items-center gap-2 border-b-4
                    ${otherTarget===t.id?'bg-[#fbbf24] text-slate-900 border-amber-600 shadow-lg':'bg-white text-slate-400 border-slate-200'}`}>
                  <span className="text-2xl leading-none">{t.icon}</span>{t.label}
                </button>
              ))}
            </div>

            {/* Person Search / Selected */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">{otherTarget==='STAFF'?'Select Staff':'Select Student'}</label>
              {otherSel ? (
                <div className="flex justify-between items-center bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div>
                    <p className="font-black text-sm text-amber-700 m-0 uppercase">{getDisplayName(otherSel)}</p>
                    <p className="text-[10px] font-bold text-amber-500 m-0 mt-1 uppercase tracking-wider">{otherSel['Enrollment No.']||otherSel.Staff_ID}</p>
                  </div>
                  <button onClick={()=>{setOtherSel(null);setOtherSearch('');}} className="w-8 h-8 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold">✕</button>
                </div>
              ) : (
                <div className="relative">
                  <input value={otherSearch} onChange={e=>setOtherSearch(e.target.value)}
                    placeholder="Search by name or ID..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]" autoComplete="off"/>
                  {filteredOther.length>0&&(
                    <div className="absolute top-full left-0 right-0 z-20 bg-white border border-slate-200 rounded-2xl mt-2 overflow-hidden max-h-48 overflow-y-auto shadow-xl">
                      {filteredOther.map((s,i)=>(
                        <button key={i} onClick={()=>{setOtherSel(s);setOtherSearch('');}}
                          className={`w-full px-5 py-3 text-left hover:bg-slate-50 transition-colors ${i<filteredOther.length-1?'border-b border-slate-100':''}`}>
                          <div className="text-sm font-bold text-slate-800">{getDisplayName(s)}</div>
                          <div className="text-[10px] font-bold text-slate-400 tracking-wider mt-1">{s['Enrollment No.']||s.Staff_ID}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Leave Type */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Leave Type</label>
              <div className="flex flex-wrap gap-2">
                {LEAVE_DEFAULTS.map(lt=>(
                  <button key={lt} onClick={()=>setOtherForm(f=>({...f,Leave_Type:lt}))}
                    className={`px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-wide transition-all
                      ${otherForm.Leave_Type===lt?'bg-slate-900 text-white shadow-md':'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                    {lt}
                  </button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Start Date</label>
                  <input type="date" value={otherForm.Start_Date} onChange={e=>setOtherForm(f=>({...f,Start_Date:e.target.value}))} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">End Date</label>
                  <input type="date" value={otherForm.End_Date} min={otherForm.Start_Date} onChange={e=>setOtherForm(f=>({...f,End_Date:e.target.value}))} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]"/>
                </div>
              </div>
              {othDays>0&&<p className="text-center text-[10px] font-black text-amber-600 uppercase mt-3 tracking-widest bg-amber-50 py-1.5 rounded-lg">{othDays} day{othDays>1?'s':''} total</p>}
            </div>

            {/* Leave Mode */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Leave Mode</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Full Day','Half Day','Period-wise'].map(m=>(
                  <button key={m} onClick={()=>setOtherForm(f=>({...f,Leave_Mode:m}))}
                    className={`px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-wide transition-all
                      ${otherForm.Leave_Mode===m?'bg-slate-900 text-white shadow-md':'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                    {m}
                  </button>
                ))}
              </div>
              {(otherForm.Leave_Mode==='Half Day' || otherForm.Leave_Mode==='Period-wise') && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{otherForm.Leave_Mode==='Half Day'?'Time Slot (Morning / Afternoon)':'Period Range (e.g. 3rd–4th period)'}</label>
                  <input value={otherForm.Time_Detail} onChange={e=>setOtherForm(f=>({...f,Time_Detail:e.target.value}))}
                    placeholder={otherForm.Leave_Mode==='Half Day'?'Morning only / Afternoon only':'e.g. 2nd–3rd period'} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]"/>
                </div>
              )}
            </div>

            {/* Reason */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Reason / Remark</label>
              <textarea value={otherForm.Reason} onChange={e=>setOtherForm(f=>({...f,Reason:e.target.value}))} placeholder="Leave reason..." rows={2} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#fbbf24] resize-none"/>
            </div>

            {/* Reporter info (For Student) */}
            {otherTarget==='STUDENT' && (
              <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm bg-indigo-50/50">
                <p className="text-[10px] font-black uppercase text-indigo-400 mb-4 tracking-widest">Reporter Info (Parent/Guardian)</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Name</label>
                    <input value={otherForm.Reporter_Name} onChange={e=>setOtherForm(f=>({...f,Reporter_Name:e.target.value}))} placeholder="Parent Name" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]"/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Relationship</label>
                      <input value={otherForm.Relationship} onChange={e=>setOtherForm(f=>({...f,Relationship:e.target.value}))} placeholder="Mother/Father" 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]"/>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Phone</label>
                      <input value={otherForm.Phone} onChange={e=>setOtherForm(f=>({...f,Phone:e.target.value}))} placeholder="09..." 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Report Method</label>
                    <select value={otherForm.Method} onChange={e=>setOtherForm(f=>({...f,Method:e.target.value}))} 
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#fbbf24] appearance-none">
                      {['Phone Call','In Person','Message','Email'].map(m=><option key={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Approval Status Setup (Management only) */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Submission Status</label>
              <div className="flex gap-2">
                <button onClick={()=>setOtherForm(f=>({...f,Status:'Approved'}))}
                  className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-wide transition-all border-b-2
                    ${otherForm.Status==='Approved'?'bg-emerald-500 text-white border-emerald-700':'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}>
                  ✓ Pre-Approve
                </button>
                <button onClick={()=>setOtherForm(f=>({...f,Status:'Pending'}))}
                  className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-wide transition-all border-b-2
                    ${otherForm.Status==='Pending'?'bg-amber-400 text-slate-900 border-amber-600':'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}>
                  ⏳ Keep Pending
                </button>
              </div>
            </div>

            <button onClick={handleOtherSubmit} disabled={saving}
              className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-lg border-b-4 transition-all active:scale-95 flex items-center justify-center gap-2
                ${saving?'bg-slate-200 text-slate-400 border-slate-300':'bg-slate-900 text-[#fbbf24] border-slate-800 hover:bg-slate-800'}`}>
              {saving ? 'Submitting...' : `📤 Submit Leave ${othDays>0?`(${othDays} days)`:''}`}
            </button>
          </div>
        )}

        {/* ══ ANALYSIS ══ */}
        {tab==="ANALYSIS"&&(
          <div className="space-y-8">

            <div className="flex flex-wrap gap-3">
              <div className="flex bg-white p-1 rounded-xl border border-slate-100 gap-1 flex-wrap">
                {["ALL","7D","30D","90D"].map(r=>(
                  <button key={r} onClick={()=>setRangeFilter(r)}
                    className={`px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all whitespace-nowrap
                      ${rangeFilter===r?'bg-slate-950 text-white':'text-slate-400 hover:text-slate-700'}`}>
                    {r==="ALL"?"All Time":r==="7D"?"7 Days":r==="30D"?"30 Days":"90 Days"}
                  </button>
                ))}
              </div>
              <div className="flex bg-white p-1 rounded-xl border border-slate-100 gap-1 flex-wrap">
                {["ALL","STUDENT","STAFF"].map(t=>(
                  <button key={t} onClick={()=>setTypeFilter(t)}
                    className={`px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all whitespace-nowrap
                      ${typeFilter===t?'bg-slate-950 text-white':'text-slate-400 hover:text-slate-700'}`}>{t}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                {label:"Total Leaves", value:analysisLeaves.length,                                     icon:"📋", color:"border-indigo-300 bg-indigo-50"},
                {label:"Total Days",   value:analysisLeaves.reduce((s,l)=>s+Number(l.Total_Days||1),0), icon:"📅", color:"border-blue-300 bg-blue-50"},
                {label:"Approved",     value:analysisLeaves.filter(l=>l.Status==="Approved").length,     icon:"✅", color:"border-emerald-300 bg-emerald-50"},
              ].map((s,i)=>(
                <div key={i} className={`${s.color} p-5 rounded-[2rem] border-b-[6px] shadow-md flex flex-col items-center gap-2`}>
                  <span className="text-2xl">{s.icon}</span>
                  <p className="text-2xl font-black text-slate-950 leading-none">{s.value}</p>
                  <p className="text-[8px] uppercase tracking-widest font-black text-slate-500 text-center">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
              <h3 className="text-[9px] uppercase tracking-[0.3em] font-black text-slate-400 mb-4">Duration Type Breakdown</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {label:'Full Day(s)', count:fullDayCount,  bg:'#f0fdf4', color:'#16a34a', icon:'📅'},
                  {label:'½ Day',       count:halfDayCount,  bg:'#fffbeb', color:'#92400e', icon:'🌗'},
                  {label:'Period(s)',   count:periodCount,   bg:'#f5f3ff', color:'#6d28d9', icon:'⏱️'},
                ].map((x,i)=>(
                  <div key={i} style={{background:x.bg,borderRadius:'16px',padding:'14px 10px',textAlign:'center',border:`1px solid ${x.color}22`}}>
                    <div style={{fontSize:'20px',marginBottom:'4px'}}>{x.icon}</div>
                    <p style={{fontSize:'22px',fontWeight:900,color:x.color,lineHeight:1,margin:'0 0 3px'}}>{x.count}</p>
                    <p style={{fontSize:'8px',fontWeight:900,color:x.color,textTransform:'uppercase',letterSpacing:'0.06em',opacity:0.8,margin:0}}>{x.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border-b-[8px] border-slate-200 shadow-xl">
              <h3 className="text-xs uppercase tracking-[0.3em] font-black text-slate-400 mb-6">Monthly Trend (6 Months)</h3>
              <div className="flex items-end gap-3 h-32">
                {monthlyData.map((m,i)=>(
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <p className="text-[9px] font-black text-slate-600">{m.count>0?m.count:""}</p>
                    <div className="w-full rounded-t-xl bg-slate-950 transition-all duration-500"
                      style={{height:`${Math.max((m.count/maxMonthCount)*96,m.count>0?8:4)}px`}}/>
                    <p className="text-[8px] uppercase font-black text-slate-400">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border-b-[8px] border-slate-200 shadow-xl">
              <h3 className="text-xs uppercase tracking-[0.3em] font-black text-slate-400 mb-6">Leave Type Breakdown</h3>
              {leaveTypes.length===0?(<p className="text-center text-slate-300 italic py-8">No data</p>):(
                <div className="space-y-4">
                  {leaveTypes.map(([type,count],i)=>(
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-black text-slate-700 uppercase italic truncate pr-4">{type}</span>
                        <span className="text-sm font-black text-slate-950 shrink-0">{count}</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-950 rounded-full transition-all duration-700"
                          style={{width:`${(count/maxTypeCount)*100}%`}}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-950 p-6 rounded-[2.5rem] border-b-[8px] border-[#fbbf24] shadow-2xl">
              <h3 className="text-xs uppercase tracking-[0.3em] font-black text-[#fbbf24] mb-6 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#fbbf24] rounded-full"/>Top Leave Takers
              </h3>
              {topLeaves.length===0?(<p className="text-center text-white/20 italic py-8 uppercase text-sm">No data</p>):(
                <div className="space-y-3">
                  {topLeaves.map((p,i)=>(
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className={`text-lg font-black shrink-0 ${i===0?'text-[#fbbf24]':i===1?'text-slate-300':i===2?'text-amber-600':'text-white/30'}`}>#{i+1}</span>
                        <div className="min-w-0">
                          <p className="text-white font-black uppercase italic text-sm truncate">{p.name}</p>
                          <p className="text-[8px] uppercase font-black text-slate-500 mt-0.5">{p.type}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[#fbbf24] font-black text-lg leading-none">{p.days}</p>
                        <p className="text-[8px] uppercase font-black text-slate-500">days · {p.count}x</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* ══ ATTENDANCE WATCHLIST (Relocated & Tab UI) ══ */}
            <div className="bg-slate-950 p-6 rounded-[2.5rem] border-b-[8px] border-rose-500 shadow-2xl mt-8">
              <h3 className="text-[11px] uppercase tracking-[0.3em] font-black text-rose-400 mb-5 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-rose-500 rounded-full"/>Attendance Watchlist
              </h3>
              
              <div className="flex flex-wrap gap-2 pb-3 mb-4">
                {watchTabs.map(f => {
                  const count = watchMap[f.id].users.length;
                  return (
                    <button key={f.id} onClick={() => setWatchFilter(f.id)}
                      className={`shrink-0 px-3 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center gap-2
                        ${watchFilter === f.id ? 'bg-rose-500 text-white border-rose-700' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'}`}>
                      {f.label} <span className={`px-2 py-1 rounded-lg ${watchFilter === f.id ? 'bg-rose-700' : 'bg-white/10'}`}>{count}</span>
                    </button>
                  )
                })}
              </div>

              <div className="grid grid-cols-1">
                {watchMap[watchFilter] && (
                  <WatchlistGroup {...watchMap[watchFilter]} />
                )}
              </div>
            </div>

            {/* ══ INDIVIDUAL HISTORY SEARCH ══ */}
            <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-white/10 shadow-xl mt-6">
              <h3 className="text-[11px] uppercase tracking-[0.3em] font-black text-sky-400 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-sky-500 rounded-full"/>Individual History Search
              </h3>
              <input 
                value={historySearchQuery} 
                onChange={e => setHistorySearchQuery(e.target.value)}
                placeholder="Search student or staff name/ID..."
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-sky-500 transition-colors mb-4"
              />
              {historySearchQuery.trim().length >= 2 && (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                  {searchedUsers.length === 0 ? (
                    <p className="text-white/30 text-[11px] italic text-center py-6">No matching records found.</p>
                  ) : searchedUsers.map((u, i) => (
                    <div key={i} className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-white font-bold text-base leading-tight">{u.name}</p>
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-black tracking-widest">{u.id}</span>
                            {u.type === 'STUDENT' ? (
                              <>
                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold uppercase tracking-widest">Student</span>
                                {(u.grade || u.section) && (
                                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold uppercase tracking-widest whitespace-nowrap">
                                    {u.grade ? `G-${u.grade}` : ''}{u.grade && u.section ? ' · ' : ''}{u.section}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase tracking-widest">Staff</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-[#fbbf24] leading-none">{u.totalDays}</p>
                          <p className="text-[8px] uppercase tracking-widest text-slate-500 mt-1">Total Days</p>
                        </div>
                      </div>
                      <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
                        {u.reasons.map((r, ri) => (
                          <div key={ri} className="bg-slate-900/50 p-3 rounded-xl border border-white/5 flex gap-3 items-center">
                            <div className="shrink-0 text-center bg-slate-800 rounded-lg px-2 py-1.5 min-w-[50px]">
                              <p className="text-[9px] font-black text-slate-400">📅 {r.start}</p>
                              {r.end && r.end !== r.start && <p className="text-[9px] font-black text-slate-500 mt-0.5">↓ {r.end}</p>}
                            </div>
                            <div className="flex-1">
                              <span className="text-[8px] uppercase tracking-widest text-sky-500 font-black mb-1 block">{r.type}</span>
                              <p className="text-xs text-slate-300 italic leading-snug">{r.text}</p>
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

        {/* ══ HISTORY ══ */}
        {tab==="HISTORY"&&(
          <div className="space-y-4">
            {history.length===0?(
              <div className="py-24 text-center">
                <p className="font-black uppercase italic text-slate-300 text-xl tracking-widest">No history yet</p>
              </div>
            ):history.slice().reverse().map((l,i)=>(
              <div key={i} className="bg-white p-5 rounded-[2rem] border-b-[6px] border-slate-100 shadow-md">
                <div className="flex items-center gap-4">
                  <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${l.Status==="Approved"?"bg-emerald-100":"bg-rose-100"}`}>
                    {l.Status==="Approved"?"✅":"❌"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-black uppercase italic text-sm text-slate-950 truncate">{l.Name}</p>
                      <DurationBadge leave={l}/>
                    </div>
                    <p className="text-[9px] uppercase font-black text-slate-400">
                      {l.Leave_Type} · {cleanDateStr(l.Start_Date)}{cleanDateStr(l.End_Date)&&cleanDateStr(l.End_Date)!==cleanDateStr(l.Start_Date)?` → ${cleanDateStr(l.End_Date)}`:''}
                    </p>
                    {l.Notes&&l.Notes!=='-'&&<p className="text-[9px] text-purple-500 font-bold mt-1 italic">📝 {l.Notes}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`text-[8px] px-3 py-1 rounded-full font-black uppercase ${l.Status==="Approved"?"bg-emerald-100 text-emerald-700":"bg-rose-100 text-rose-700"}`}>
                      {l.Status}
                    </span>
                    {l.Approved_By&&l.Approved_By!=='-'&&(
                      <p className="text-[7px] text-slate-400 font-black uppercase mt-1">by {l.Approved_By}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}