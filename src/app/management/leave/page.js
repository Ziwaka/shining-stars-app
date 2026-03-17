"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

// ── Date Helpers ──
const MM_TZ = 'Asia/Yangon';
const getTodayMM = () => {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: MM_TZ }); }
  catch(e) { return new Date().toISOString().split('T')[0]; }
};
const formatMMDate = (d) => {
  if (!d || d === '-') return '-';
  try {
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.trim())) return d.trim();
    const dateObj = new Date(d);
    if (!isNaN(dateObj.getTime())) return dateObj.toLocaleDateString('en-CA', { timeZone: MM_TZ });
  } catch (e) {}
  return String(d).split('T')[0];
};
const formatDateDisplay = (d) => {
  if (!d || d === '-') return '-';
  try {
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return d;
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: MM_TZ });
    return `${day}/${month}/${year}, ${weekday}`;
  } catch(e) { return formatMMDate(d); }
};

const getDisplayName = s => s['Name (ALL CAPITAL)'] || s['အမည်'] || s.Name || '';
const LEAVE_DEFAULTS = ['Casual Leave','Medical Leave','Emergency Leave','Personal Leave', 'Sick Leave', 'Funeral', 'Personal Affair'];

function DurationBadge({ leave, big }) {
  const dt   = leave.Duration_Type || (leave.Leave_Mode === 'Half Day' ? 'HALF' : leave.Leave_Mode === 'Period-wise' ? 'PERIOD' : 'FULL');
  const days = Number(leave.Total_Days || 0);
  const sz   = big ? { fontSize:'9px', padding:'4px 10px' } : { fontSize:'8px', padding:'3px 8px' };
  if (dt === 'HALF') {
    const part = leave.Half_Day_Part && leave.Half_Day_Part !== '-' ? ` (${leave.Half_Day_Part})` : '';
    return <span style={{...sz, background:'#fef3c7', color:'#92400e', fontWeight:900, borderRadius:'99px', textTransform:'uppercase', whiteSpace:'nowrap'}}>🌗 ½ Day{part}</span>;
  }
  if (dt === 'PERIOD') {
    const subj = leave.Period_Range && leave.Period_Range !== '-' ? leave.Period_Range : (leave.Leave_Detail && leave.Leave_Detail !== '-' ? leave.Leave_Detail : 'Period');
    return <span style={{...sz, background:'#ede9fe', color:'#6d28d9', fontWeight:900, borderRadius:'99px', textTransform:'uppercase', whiteSpace:'nowrap'}}>⏱️ {subj}</span>;
  }
  return <span style={{...sz, background:'#f0fdf4', color:'#16a34a', fontWeight:900, borderRadius:'99px', textTransform:'uppercase', whiteSpace:'nowrap'}}>📅 {days} Day{days!==1?'s':''}</span>;
}

// ★ အရောင်လင်းလင်းနဲ့ သန့်သန့်ရှင်းရှင်းဖြစ်အောင် ပြင်ဆင်ထားသော Watchlist ★
const WatchlistGroup = ({ title, users, icon, color }) => (
  <div className="bg-white border border-slate-200 p-5 rounded-3xl flex flex-col max-h-[600px] shadow-sm">
    <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4 shrink-0">
      <p className={`text-[12px] md:text-[14px] font-black uppercase tracking-widest leading-tight ${color}`}>{icon} {title}</p>
      <span className="text-[11px] px-3 py-1.5 rounded-lg font-black bg-slate-100 text-slate-600 shrink-0">{users.length} Total</span>
    </div>
    <div className="space-y-4 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
      {users.length === 0 ? <p className="text-[11px] text-slate-400 italic text-center py-10">No records found</p> : users.map((u,i)=>(
        <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-2">
          <div>
            <p className="text-[15px] font-bold text-slate-900 leading-tight">{u.name}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[10px] px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-500 font-black tracking-widest">{u.id}</span>
              {u.type === 'STUDENT' ? (
                <>
                  <span className="text-[9px] px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 font-bold uppercase tracking-widest">Student</span>
                  {(u.grade || u.section) && <span className="text-[9px] px-2 py-1 rounded-md bg-sky-100 text-sky-700 font-bold uppercase tracking-widest">G-{u.grade} {u.section?`· ${u.section}`:''}</span>}
                </>
              ) : <span className="text-[9px] px-2 py-1 rounded-md bg-amber-100 text-amber-700 font-bold uppercase tracking-widest">Staff</span>}
            </div>
          </div>
          {u.reasons && u.reasons.length > 0 && (
            <div className="border-t border-slate-200 pt-3 space-y-2 mt-2">
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-black">Absence Reasons:</p>
              {u.reasons.slice(0, 3).map((r, ri) => (
                <div key={ri} className="text-[11px] bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                  <span className="text-slate-500 font-black text-[9px] block mb-1">📅 {formatDateDisplay(r.start)}{r.end && formatMMDate(r.end) !== formatMMDate(r.start) ? ` → ${formatDateDisplay(r.end)}` : ''}</span>
                  <span className="text-slate-700 italic mb-1 block leading-relaxed">"{r.text}"</span>
                  {r.attachment && r.attachment !== '-' && <a href={r.attachment} target="_blank" className="text-[10px] text-sky-500 underline font-bold mt-1 inline-block">📎 View Doc</a>}
                </div>
              ))}
              {u.reasons.length > 3 && <p className="text-[10px] text-slate-400 font-bold italic text-center pt-1">+ {u.reasons.length - 3} older records</p>}
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
  const [uploading, setUploading] = useState(false);
  const [tab,       setTab]       = useState("QUEUE");
  
  const [rangeFilter, setRangeFilter] = useState("ALL");
  const [typeFilter,  setTypeFilter]  = useState("ALL");
  const [watchFilter, setWatchFilter] = useState("TODAY");

  const [histSearch, setHistSearch] = useState("");
  const [histFilter, setHistFilter] = useState("ALL");

  const [calDate, setCalDate] = useState(new Date());
  const [selectedCalDate, setSelectedCalDate] = useState(null); // ★ ပြက္ခဒိန် Modal အတွက် State

  const [allStaff, setAllStaff]       = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [otherTarget, setOtherTarget] = useState('STAFF');
  const [otherSearch, setOtherSearch] = useState('');
  const [otherSel, setOtherSel]       = useState(null);
  const [saving, setSaving]           = useState(false);
  const [otherForm, setOtherForm]     = useState({
    Category: 'School', Leave_Type:'Casual Leave', Start_Date: getTodayMM(), End_Date: getTodayMM(), Reason:'', Leave_Mode:'Full Day', Time_Detail:'', subject:'', Attachment_Link:'', Reporter_Name:'', Relationship:'', Phone:'', Method:'Phone Call', Status: 'Approved' 
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
    } catch(e){}
    finally{setLoading(false);}
  };

  const handleAction = async (leave, status) => {
    if (!user?.Name) return alert("Session Expired.");
    setProc(true);
    try {
      const cleanDate = formatMMDate(leave.Start_Date);
      const res = await fetch(WEB_APP_URL,{method:'POST',body:JSON.stringify({action:'updateLeave',rowIndex:leave._rowIndex,userId:leave.User_ID,name:leave.Name,startDate:cleanDate,status,approvedBy:user.Name})});
      const r   = await res.json();
      if (r.success) {
        setAllLeaves(prev=>prev.map(l=>l._rowIndex===leave._rowIndex?{...l,Status:status,Approved_By:user.Name}:l));
      } else alert("FAIL: "+r.message);
    } catch { alert("Network Error"); }
    finally{setProc(false);}
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setUploading(true);
      try {
        const res = await fetch(WEB_APP_URL, { method:'POST', body:JSON.stringify({ action:'uploadPhoto', base64, filename: file.name, mimeType: file.type }) }).then(r=>r.json());
        if(res.success) { setOtherForm(f=>({...f, Attachment_Link: res.photoUrl})); alert('File uploaded ✓'); }
        else alert('Upload failed');
      } catch(e) { alert('Upload error'); }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const calcDays = () => {
    if (otherForm.Leave_Mode === 'Half Day')   return 0.5;
    if (otherForm.Leave_Mode === 'Period-wise') return 0;
    if (!otherForm.Start_Date || !otherForm.End_Date)  return 0;
    const d = Math.ceil(Math.abs(new Date(otherForm.End_Date)-new Date(otherForm.Start_Date))/86400000)+1;
    return d > 0 ? d : 0;
  };

  const handleOtherSubmit = async () => {
    if (!otherSel)                return alert('တစ်ဦး ရွေးပါ');
    if (!otherForm.Start_Date)    return alert('Start Date ထည့်ပါ');
    if (otherForm.Leave_Mode==='Full Day'&&!otherForm.End_Date) return alert('End Date ထည့်ပါ');
    if (!otherForm.Reason.trim()) return alert('Reason ဖြည့်ပါ');
    if (otherTarget==='STUDENT' && !otherForm.Reporter_Name.trim()) return alert('Reporter Name ဖြည့်ပါ');
    if (otherForm.Leave_Mode === 'Half Day' && !otherForm.Time_Detail.trim()) return alert('Half-day အတွက် အချိန်အသေးစိတ် ထည့်ပါ');
    if (otherForm.Leave_Mode === 'Period-wise' && !otherForm.subject.trim()) return alert('ဘာသာရပ် အမည် ဖြည့်ပါ');
    
    setSaving(true);
    const days = calcDays();
    const endD = otherForm.Leave_Mode === 'Full Day' ? otherForm.End_Date : otherForm.Start_Date;
    
    try {
      const isStaff = otherTarget === 'STAFF';
      const mmToday = getTodayMM();
      const entry = [{
        Date_Applied: mmToday, Category: otherForm.Category, User_Type: otherTarget,
        User_ID: otherSel['Enrollment No.'] || otherSel.Student_ID || otherSel.Staff_ID || '',
        Name: getDisplayName(otherSel), Leave_Type: otherForm.Leave_Type,
        Start_Date: formatMMDate(otherForm.Start_Date), End_Date: formatMMDate(endD), Total_Days: days, Reason: otherForm.Reason.trim(),
        Leave_Mode: otherForm.Leave_Mode, Half_Day_Part: otherForm.Leave_Mode==='Half Day'?otherForm.Time_Detail:'-',
        Period_Count: '-', Period_Range: otherForm.Leave_Mode==='Period-wise'?otherForm.subject:'-',
        Attachment_Link: otherForm.Attachment_Link || '-',
        Reporter_Name: isStaff ? (user.Name||user.username||'Management') : otherForm.Reporter_Name,
        Relationship: isStaff ? 'Management' : otherForm.Relationship, Phone: isStaff ? '-' : otherForm.Phone,
        Method: isStaff ? 'Direct' : otherForm.Method, Approved_By: otherForm.Status === 'Approved' ? (user.Name||'Management') : '-',
        Status: otherForm.Status
      }];
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'recordNote', sheetName:'Leave_Records', data: entry }) });
      const r = await res.json();
      if (r.success) {
        alert('Leave Form တင်ပြီးပါပြီ ✓');
        setOtherSel(null); setOtherSearch('');
        setOtherForm(f=>({...f, Start_Date:getTodayMM(), End_Date:getTodayMM(), Reason:'', Leave_Mode:'Full Day', Time_Detail:'', subject:'', Attachment_Link:'', Reporter_Name:'', Relationship:'', Phone:''}));
        fetchLeaves(); 
        setTab(otherForm.Status === 'Pending' ? 'QUEUE' : 'HISTORY');
      } else alert(r.message||'Error');
    } catch { alert('Network error'); }
    setSaving(false);
  };

  const getStudentInfo = (userId, name) => {
    const st = allStudents.find(s => s.Student_ID === userId || s['Enrollment No.'] === userId || s['Name (ALL CAPITAL)'] === name || s.Name === name);
    return st ? { grade: st.Grade || '', section: st.Section || st.Class || '' } : { grade:'', section:'' };
  };

  const pending = allLeaves.filter(x=>x.Status==="Pending");
  const history = allLeaves.filter(x=>x.Status!=="Pending");

  const filteredHistory = history.filter(h => {
    const matchSearch = (h.Name||'').toLowerCase().includes(histSearch.toLowerCase()) || (h.Leave_Type||'').toLowerCase().includes(histSearch.toLowerCase());
    const matchType = histFilter === 'ALL' || h.User_Type === histFilter;
    return matchSearch && matchType;
  });

  const groupedHistory = filteredHistory.reduce((acc, l) => {
    const date = formatMMDate(l.Start_Date);
    if (!acc[date]) acc[date] = [];
    acc[date].push(l);
    return acc;
  }, {});
  const sortedHistoryDates = Object.keys(groupedHistory).sort((a,b) => new Date(b) - new Date(a));

  const now = new Date();
  const analysisLeaves = allLeaves.filter(l=>{
    const days=(now-new Date(formatMMDate(l.Start_Date)))/86400000;
    if (rangeFilter==="7D") return days<=7; if (rangeFilter==="30D") return days<=30; if (rangeFilter==="90D") return days<=90;
    return true;
  }).filter(l=>typeFilter==="ALL"||l.User_Type===typeFilter);

  const halfDayCount   = analysisLeaves.filter(l=>(l.Duration_Type||l.Leave_Mode)==='HALF'||l.Leave_Mode==='Half Day').length;
  const periodCount    = analysisLeaves.filter(l=>(l.Duration_Type||l.Leave_Mode)==='PERIOD'||l.Leave_Mode==='Period-wise').length;
  const fullDayCount   = analysisLeaves.filter(l=>(l.Duration_Type||l.Leave_Mode)==='FULL'||l.Leave_Mode==='Full Day').length;

  const userStats = {};
  const todayStr = getTodayMM(); 

  allLeaves.filter(l => l.Status === 'Approved').forEach(l => {
    const k = l.User_ID || l.Name;
    if (!userStats[k]) userStats[k] = { name: l.Name, type: l.User_Type, id: l.User_ID || '-', grade: '', section: '', totalDays: 0, last7: 0, last30: 0, last90: 0, periods: [], isAbsentToday: false, reasons: [] };
    
    const cleanS = formatMMDate(l.Start_Date);
    const cleanE = formatMMDate(l.End_Date) || cleanS;
    const days = Number(l.Total_Days) || 0;
    
    userStats[k].totalDays += days;
    
    if (todayStr >= cleanS && todayStr <= cleanE) {
        userStats[k].isAbsentToday = true;
    }
    
    const sdMs = new Date(cleanS).getTime();
    const diffDays = (now.getTime() - sdMs) / 86400000;
    if (diffDays <= 7) userStats[k].last7 += days; 
    if (diffDays <= 30) userStats[k].last30 += days; 
    if (diffDays <= 90) userStats[k].last90 += days;
    
    userStats[k].periods.push({ start: sdMs, days });
    if (l.Reason && l.Reason !== '-') userStats[k].reasons.push({ start: cleanS, end: cleanE, text: l.Reason, type: l.Leave_Type, attachment: l.Attachment_Link });
  });

  Object.values(userStats).forEach(u => {
    if (u.type === 'STUDENT') {
      const stInfo = getStudentInfo(u.id, u.name);
      u.grade = stInfo.grade; u.section = stInfo.section;
    }
    u.reasons.sort((a,b) => new Date(b.start) - new Date(a.start));
    u.periods.sort((a,b) => a.start - b.start);
    let maxC = 0, currC = 0, lastEnd = 0;
    u.periods.forEach(p => {
      if (lastEnd === 0) currC = p.days;
      else { const diffDays = (p.start - lastEnd) / 86400000; if (diffDays <= 3) currC += p.days; else currC = p.days; }
      if (currC > maxC) maxC = currC; lastEnd = p.start + (p.days * 86400000);
    });
    u.maxConsecutive = maxC;
  });

  const statsList = Object.values(userStats);
  const watchMap = {
    'TODAY': { title: 'ယနေ့ ပျက်သူ', users: statsList.filter(u => u.isAbsentToday), icon: '📍', color: 'text-sky-600' },
    'C2':    { title: '၂ ရက်ဆက်တိုက်', users: statsList.filter(u => u.maxConsecutive >= 2 && u.maxConsecutive < 3), icon: '⚠️', color: 'text-amber-600' },
    'C3':    { title: '၃ ရက်ဆက်တိုက်', users: statsList.filter(u => u.maxConsecutive >= 3 && u.maxConsecutive < 5), icon: '🔥', color: 'text-orange-600' },
    'C5':    { title: '၅ ရက်ဆက်တိုက်', users: statsList.filter(u => u.maxConsecutive >= 5), icon: '🚨', color: 'text-rose-600' },
    'W3':    { title: '၁ ပတ် (≥ ၃ ရက်)', users: statsList.filter(u => u.last7 >= 3), icon: '📅', color: 'text-indigo-600' },
    'M3':    { title: '၁ လ (≥ ၃ ရက်)', users: statsList.filter(u => u.last30 >= 3), icon: '📆', color: 'text-purple-600' },
    'M5':    { title: '၃ လ (≥ ၅ ရက်)', users: statsList.filter(u => u.last90 >= 5), icon: '📊', color: 'text-pink-600' },
    'ALL5':  { title: 'All Time (≥ ၅ ရက်)', users: statsList.filter(u => u.totalDays >= 5), icon: '🏆', color: 'text-slate-600' }
  };
  const watchTabs = [
    { id: 'TODAY', label: 'ယနေ့' }, { id: 'C2', label: '၂ ရက်ဆက်' }, { id: 'C3', label: '၃ ရက်ဆက်' }, { id: 'C5', label: '≥ ၅ ရက်ဆက်' },
    { id: 'W3', label: '၁ ပတ် (၃)' }, { id: 'M3', label: '၁ လ (၃)' }, { id: 'M5', label: '၃ လ (၅)' }, { id: 'ALL5', label: 'All Time (၅)' }
  ];

  const [historySearchQueryAnalysis, setHistorySearchQueryAnalysis] = useState("");
  const searchedUsersAnalysis = historySearchQueryAnalysis.trim().length >= 2 ? statsList.filter(u => u.name.toLowerCase().includes(historySearchQueryAnalysis.toLowerCase()) || u.id.toLowerCase().includes(historySearchQueryAnalysis.toLowerCase())) : [];

  // --- CALENDAR GENERATION ---
  const cYear = calDate.getFullYear();
  const cMonth = calDate.getMonth();
  const daysInMonth = new Date(cYear, cMonth + 1, 0).getDate();
  const firstDay = new Date(cYear, cMonth, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const calCells = [];
  for(let i=0; i<firstDay; i++) calCells.push(null);
  for(let i=1; i<=daysInMonth; i++) {
     const dStr = `${cYear}-${String(cMonth+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
     const dayLeaves = allLeaves.filter(l => l.Status === 'Approved' && formatMMDate(l.Start_Date) <= dStr && (formatMMDate(l.End_Date) || formatMMDate(l.Start_Date)) >= dStr);
     
     const gradeMap = {};
     let totalAbs = 0;
     dayLeaves.forEach(l => {
         let g = 'Staff';
         if(l.User_Type==='STUDENT') {
            const st = getStudentInfo(l.User_ID, l.Name);
            g = st.grade ? `G-${st.grade}${st.section ? ` - ${st.section}` : ''}` : 'Unknown';
         }
         gradeMap[g] = (gradeMap[g]||0)+1;
         totalAbs++;
     });
     calCells.push({ day: i, dateStr: dStr, total: totalAbs, grades: gradeMap });
  }

  const prevMonth = () => setCalDate(new Date(cYear, cMonth - 1, 1));
  const nextMonth = () => setCalDate(new Date(cYear, cMonth + 1, 1));

  if (loading||proc) return <div className="min-h-[50vh] flex items-center justify-center font-black text-[#4c1d95] animate-pulse uppercase italic tracking-widest text-lg">{proc?"Processing...":"Loading Leave Hub..."}</div>;

  return (
    <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch'}} className="bg-[#F0F9FF] font-black text-slate-950 p-4 md:p-6 pb-36">
      
      {/* ★ CALENDAR MODAL ★ */}
      {selectedCalDate && (
        <div className="fixed inset-0 z-[99] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedCalDate(null)}>
           <div className="bg-white w-full max-w-[500px] rounded-[2rem] p-6 shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
               <div>
                 <h3 className="text-xl font-black text-slate-900 leading-none mb-1">Absent Details</h3>
                 <p className="text-[10px] uppercase tracking-widest text-sky-500 font-bold">{formatDateDisplay(selectedCalDate)}</p>
               </div>
               <button onClick={() => setSelectedCalDate(null)} className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 font-black text-lg flex items-center justify-center hover:bg-slate-200">✕</button>
             </div>
             <div className="overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
               {allLeaves.filter(l => l.Status === 'Approved' && formatMMDate(l.Start_Date) <= selectedCalDate && (formatMMDate(l.End_Date) || formatMMDate(l.Start_Date)) >= selectedCalDate).map((l, i) => {
                  const stInfo = l.User_Type === 'STUDENT' ? getStudentInfo(l.User_ID, l.Name) : {grade:'',section:''};
                  return (
                    <div key={i} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                         <p className="font-black text-slate-900 text-[15px]">{l.Name}</p>
                         <span className="text-[9px] uppercase font-black bg-white px-3 py-1 rounded-lg shadow-sm text-sky-600 border border-slate-100">{l.Leave_Type}</span>
                      </div>
                      <div className="flex gap-2 mb-3 flex-wrap">
                        <span className="text-[9px] bg-slate-200 text-slate-700 px-2 py-1 rounded-md font-black">ID: {l.User_ID}</span>
                        {l.User_Type === 'STUDENT' ? (
                           <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md font-black">
                             {stInfo.grade ? `G-${stInfo.grade}` : ''}{stInfo.grade && stInfo.section ? ` - ${stInfo.section}` : ''}{!stInfo.grade ? 'STUDENT' : ''}
                           </span>
                        ) : <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-black">STAFF</span>}
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <p className="text-[12px] text-slate-600 italic leading-snug">"{l.Reason}"</p>
                      </div>
                    </div>
                  )
               })}
             </div>
           </div>
        </div>
      )}

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
            <button onClick={fetchLeaves} className="bg-white/10 rounded-2xl px-4 py-3 border border-white/10 text-white text-xl hover:bg-white/20 transition-all">↻</button>
          </div>
        </div>

        {/* MAIN TABS */}
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 gap-1 overflow-x-auto">
          {[{id:"QUEUE",label:"Queue",badge:pending.length},{id:"SUBMIT",label:"Submit",badge:null},{id:"ANALYSIS",label:"Analysis",badge:null},{id:"HISTORY",label:"History",badge:history.length}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex-1 py-3.5 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap
                ${tab===t.id?'bg-slate-950 text-white shadow-md':'text-slate-400 hover:text-slate-700'}`}>
              {t.label}
              {t.badge!==null&&t.badge>0&&<span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black ${tab===t.id?'bg-[#fbbf24] text-slate-950':'bg-slate-100 text-slate-500'}`}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* ══ QUEUE ══ */}
        {tab==="QUEUE"&&(
          <div className="space-y-5">
            {pending.length===0?(
              <div className="py-24 text-center"><p className="text-6xl mb-4">✅</p><p className="font-black uppercase italic text-slate-300 text-xl tracking-widest">Queue Empty</p></div>
            ):pending.map((l,i)=>(
              <div key={i} className="bg-white p-6 rounded-[2.5rem] border-b-[10px] border-slate-200 shadow-xl space-y-4 hover:border-[#fbbf24] transition-all">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {l.Category&&<span className="bg-indigo-100 text-indigo-700 text-[8px] px-3 py-1 rounded-full font-black uppercase">{l.Category}</span>}
                    <span className="bg-amber-100 text-amber-700 text-[8px] px-3 py-1 rounded-full font-black uppercase">{l.User_Type}</span>
                    <DurationBadge leave={l} big/>
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase">{formatDateDisplay(l.Date_Applied)}</span>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">{l.User_Type==="STUDENT"?"🎓":"👔"}</div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-black italic uppercase text-slate-950 leading-none truncate">{l.Name}</h3>
                    <p className="text-[9px] text-slate-400 font-black uppercase mt-1">ID: {l.User_ID} · {l.Leave_Type}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-black text-slate-950">{l.Total_Days}</p>
                    <p className="text-[8px] uppercase text-slate-400 font-black">{(l.Duration_Type||l.Leave_Mode)==='HALF'||l.Leave_Mode==='Half Day'?'half':'days'}</p>
                  </div>
                </div>

                <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 text-sm italic text-slate-600">"{l.Reason}"</div>

                <div className="flex justify-between items-end flex-wrap gap-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase">
                    📅 {formatDateDisplay(l.Start_Date)}{l.End_Date&&formatMMDate(l.End_Date)!==formatMMDate(l.Start_Date)?` → ${formatDateDisplay(l.End_Date)}`:''}
                    {l.Half_Day_Part&&l.Half_Day_Part!=='-'&&<span className="ml-2">· {l.Half_Day_Part} Session</span>}
                    {l.Period_Range&&l.Period_Range!=='-'&&<span className="ml-2">· Subject: {l.Period_Range}</span>}
                    {l.Reporter_Name&&l.Reporter_Name!=='-'&&<span className="ml-3 break-all block mt-1">· Reporter: {l.Reporter_Name} ({l.Relationship}) {l.Phone}</span>}
                  </p>
                  {l.Attachment_Link && l.Attachment_Link !== '-' && <a href={l.Attachment_Link} target="_blank" className="text-[10px] text-sky-500 underline font-bold px-2 py-1 bg-sky-50 rounded-lg">📎 View Doc</a>}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button onClick={()=>handleAction(l,"Approved")} className="py-4 bg-emerald-500 text-white rounded-[1.5rem] font-black uppercase shadow-lg border-b-4 border-emerald-800 active:scale-95 transition-all hover:bg-emerald-600">✓ Approve</button>
                  <button onClick={()=>handleAction(l,"Rejected")} className="py-4 bg-rose-500 text-white rounded-[1.5rem] font-black uppercase shadow-lg border-b-4 border-rose-800 active:scale-95 transition-all hover:bg-rose-600">✕ Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ SUBMIT ══ */}
        {tab==="SUBMIT"&&(
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {['School','Guide'].map(c=>(
                <button key={c} onClick={()=>setOtherForm(f=>({...f,Category:c}))} className={`py-4 px-2 rounded-[1.5rem] font-black uppercase text-xs transition-all flex flex-col items-center gap-2 border-b-4 ${otherForm.Category===c?'bg-indigo-600 text-white border-indigo-800 shadow-lg':'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}>
                  <span className="text-2xl leading-none">{c==='School'?'🏫':'📚'}</span>{c}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[{id:'STAFF',icon:'👔',label:'Staff Leave'},{id:'STUDENT',icon:'🎓',label:'Student Leave'}].map(t=>(
                <button key={t.id} onClick={()=>{setOtherTarget(t.id);setOtherSel(null);setOtherSearch('');}} className={`py-4 px-2 rounded-[1.5rem] font-black uppercase text-xs transition-all flex flex-col items-center gap-2 border-b-4 ${otherTarget===t.id?'bg-[#fbbf24] text-slate-900 border-amber-600 shadow-lg':'bg-white text-slate-400 border-slate-200'}`}>
                  <span className="text-2xl leading-none">{t.icon}</span>{t.label}
                </button>
              ))}
            </div>

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
                  <input value={otherSearch} onChange={e=>setOtherSearch(e.target.value)} placeholder="Search by name or ID..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]" autoComplete="off"/>
                  {filteredOther.length>0&&(
                    <div className="absolute top-full left-0 right-0 z-20 bg-white border border-slate-200 rounded-2xl mt-2 overflow-hidden max-h-48 overflow-y-auto shadow-xl">
                      {filteredOther.map((s,i)=>(
                        <button key={i} onClick={()=>{setOtherSel(s);setOtherSearch('');}} className={`w-full px-5 py-3 text-left hover:bg-slate-50 transition-colors ${i<filteredOther.length-1?'border-b border-slate-100':''}`}>
                          <div className="text-sm font-bold text-slate-800">{getDisplayName(s)}</div>
                          <div className="text-[10px] font-bold text-slate-400 tracking-wider mt-1">{s['Enrollment No.']||s.Staff_ID}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Leave Type</label>
              <select value={otherForm.Leave_Type} onChange={e=>setOtherForm(f=>({...f,Leave_Type:e.target.value}))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none">
                {LEAVE_DEFAULTS.map(lt=><option key={lt}>{lt}</option>)}
              </select>
            </div>

            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Leave Mode</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Full Day','Half Day','Period-wise'].map(m=>(
                  <button key={m} onClick={()=>setOtherForm(f=>({...f,Leave_Mode:m}))} className={`px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-wide transition-all ${otherForm.Leave_Mode===m?'bg-slate-900 text-white shadow-md':'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>{m}</button>
                ))}
              </div>

              {otherForm.Leave_Mode==='Full Day'&&(
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Start Date</label><input type="date" value={otherForm.Start_Date} onChange={e=>setOtherForm(f=>({...f,Start_Date:e.target.value}))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none"/></div>
                  <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">End Date</label><input type="date" value={otherForm.End_Date} min={otherForm.Start_Date} onChange={e=>setOtherForm(f=>({...f,End_Date:e.target.value}))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none"/></div>
                </div>
              )}

              {otherForm.Leave_Mode==='Half Day'&&(
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Date</label><input type="date" value={otherForm.Start_Date} onChange={e=>setOtherForm(f=>({...f,Start_Date:e.target.value}))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none"/></div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Time of Day</label>
                    <input value={otherForm.Time_Detail} onChange={e=>setOtherForm(f=>({...f,Time_Detail:e.target.value}))} placeholder="AM or PM" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none"/>
                  </div>
                </div>
              )}

              {otherForm.Leave_Mode==='Period-wise'&&(
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Date</label><input type="date" value={otherForm.Start_Date} onChange={e=>setOtherForm(f=>({...f,Start_Date:e.target.value}))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none"/></div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Subject(s)</label>
                    <input value={otherForm.subject} onChange={e=>setOtherForm(f=>({...f,subject:e.target.value}))} placeholder="Mathematics..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none"/>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Reason / Remark</label>
              <textarea value={otherForm.Reason} onChange={e=>setOtherForm(f=>({...f,Reason:e.target.value}))} placeholder="Leave reason..." rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none resize-none"/>
            </div>

            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest text-sky-500">📎 Supporting Document (Optional)</label>
              <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none"/>
              {uploading && <p className="text-[10px] text-sky-500 mt-2 font-bold">Uploading image...</p>}
              {otherForm.Attachment_Link && <img src={otherForm.Attachment_Link} className="mt-3 max-h-24 rounded-lg border border-slate-200" alt="Doc"/>}
            </div>

            {otherTarget==='STUDENT' && (
              <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm bg-indigo-50/50">
                <p className="text-[10px] font-black uppercase text-indigo-400 mb-4 tracking-widest">Reporter Info</p>
                <div className="space-y-4">
                  <input value={otherForm.Reporter_Name} onChange={e=>setOtherForm(f=>({...f,Reporter_Name:e.target.value}))} placeholder="Parent Name" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"/>
                  <div className="grid grid-cols-2 gap-4">
                    <input value={otherForm.Relationship} onChange={e=>setOtherForm(f=>({...f,Relationship:e.target.value}))} placeholder="Mother/Father" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"/>
                    <input value={otherForm.Phone} onChange={e=>setOtherForm(f=>({...f,Phone:e.target.value}))} placeholder="09..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"/>
                  </div>
                  <select value={otherForm.Method} onChange={e=>setOtherForm(f=>({...f,Method:e.target.value}))} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none">
                    {['Phone Call','In Person','Message','Email'].map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Submission Status</label>
              <div className="flex gap-2">
                <button onClick={()=>setOtherForm(f=>({...f,Status:'Approved'}))} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-wide transition-all border-b-2 ${otherForm.Status==='Approved'?'bg-emerald-500 text-white border-emerald-700':'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}>✓ Pre-Approve</button>
                <button onClick={()=>setOtherForm(f=>({...f,Status:'Pending'}))} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-wide transition-all border-b-2 ${otherForm.Status==='Pending'?'bg-amber-400 text-slate-900 border-amber-600':'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}>⏳ Keep Pending</button>
              </div>
            </div>

            <button onClick={handleOtherSubmit} disabled={saving} className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-lg border-b-4 transition-all active:scale-95 flex items-center justify-center gap-2 ${saving?'bg-slate-200 text-slate-400 border-slate-300':'bg-slate-900 text-[#fbbf24] border-slate-800 hover:bg-slate-800'}`}>
              {saving ? 'Submitting...' : '📤 Submit Leave'}
            </button>
          </div>
        )}

        {/* ══ HISTORY ══ */}
        {tab==="HISTORY"&&(
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap mb-2">
               <input placeholder="Search name..." value={histSearch} onChange={e=>setHistSearch(e.target.value)} className="flex-1 min-w-[150px] bg-white border border-slate-200 rounded-xl px-4 py-2 outline-none text-sm font-bold"/>
               <select value={histFilter} onChange={e=>setHistFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 outline-none text-sm font-bold">
                 <option value="ALL">All Roles</option><option value="STUDENT">Students</option><option value="STAFF">Staff</option>
               </select>
            </div>

            {sortedHistoryDates.length===0?(
              <div className="py-24 text-center"><p className="font-black uppercase italic text-slate-300 text-xl tracking-widest">No history yet</p></div>
            ):sortedHistoryDates.map(date => (
              <div key={date}>
                <div className="flex items-center gap-2 mt-4 mb-2">
                   <span className="text-xs font-black bg-slate-200 px-3 py-1 rounded-lg">📅 {formatDateDisplay(date)}</span>
                   <div className="flex-1 h-0.5 bg-slate-100 rounded-full"/>
                </div>
                <div className="flex flex-col gap-3">
                  {groupedHistory[date].map((l,i)=>{
                    const stInfo = l.User_Type === 'STUDENT' ? getStudentInfo(l.User_ID, l.Name) : {grade:'',section:''};
                    return (
                      <div key={i} className={`bg-white p-5 rounded-[2rem] border-b-[6px] shadow-sm ${l.Status==='Approved'?'border-emerald-100':'border-rose-100'}`}>
                        <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-2 flex-wrap">
                             {l.Category && <span className="text-[8px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-black uppercase">{l.Category}</span>}
                             <span className="text-[8px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md font-black uppercase">{l.User_Type}</span>
                             <DurationBadge leave={l}/>
                           </div>
                           <span className={`text-[8px] px-3 py-1 rounded-full font-black uppercase ${l.Status==="Approved"?"bg-emerald-100 text-emerald-700":"bg-rose-100 text-rose-700"}`}>{l.Status}</span>
                        </div>
                        <p className="font-black uppercase italic text-sm text-slate-950">{l.Name}</p>
                        
                        <div className="flex gap-2 mb-2 flex-wrap">
                          <span className="text-[8px] color-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded-md font-black">ID: {l.User_ID}</span>
                          {l.User_Type === 'STUDENT' && (stInfo.grade || stInfo.section) && (
                             <span className="text-[8px] bg-[#e0f2fe] color-[#0284c7] px-2 py-0.5 rounded-md font-black">
                               {stInfo.grade ? `G-${stInfo.grade}` : ''}{stInfo.grade && stInfo.section ? ` - ${stInfo.section}` : ''}{!stInfo.grade ? 'STUDENT' : ''}
                             </span>
                          )}
                        </div>

                        <p className="text-[9px] uppercase font-black text-slate-400 mt-1">{l.Leave_Type} · {formatDateDisplay(l.Start_Date)}{l.End_Date&&formatMMDate(l.End_Date)!==formatMMDate(l.Start_Date)?` → ${formatDateDisplay(l.End_Date)}`:''}</p>
                        <div className="bg-slate-50 border-l-2 border-slate-300 p-2 mt-2 rounded-r-lg"><p className="text-[10px] text-slate-500 italic m-0 word-break-word">"{l.Reason}"</p></div>
                        {l.Attachment_Link && l.Attachment_Link !== '-' && <a href={l.Attachment_Link} target="_blank" className="text-[10px] text-sky-500 underline font-bold mt-2 inline-block">📎 View Document</a>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ ANALYSIS ══ */}
        {tab==="ANALYSIS"&&(
          <div className="space-y-8">
            
            {/* Calendar View for Leaves */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200">‹</button>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">{monthNames[cMonth]} {cYear}</h3>
                <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200">›</button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d} className="text-[8px] font-black uppercase text-slate-400">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calCells.map((cell, idx) => {
                  if (!cell) return <div key={idx} className="aspect-square bg-slate-50 rounded-lg opacity-50"/>;
                  return (
                    <button key={idx} onClick={() => cell.total > 0 && setSelectedCalDate(cell.dateStr)} className={`aspect-square rounded-xl p-1 flex flex-col relative transition-all ${cell.dateStr===getTodayMM()?'ring-2 ring-sky-500 bg-sky-50':cell.total>0?'bg-rose-50 border border-rose-100 cursor-pointer hover:bg-rose-100':'bg-slate-50 cursor-default'}`}>
                      <span className={`text-[10px] font-black absolute top-1 right-2 ${cell.total>0?'text-rose-500':'text-slate-400'}`}>{cell.day}</span>
                      <div className="flex-1 flex items-center justify-center pt-3">
                         {cell.total > 0 ? <span className="text-xs font-black text-rose-600">{cell.total}</span> : <span className="text-[8px] text-slate-300">-</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-sky-500 rounded-full"/>
                <h3 className="text-[12px] text-slate-900 font-black uppercase tracking-widest m-0">Attendance Watchlist</h3>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide snap-x">
                {watchTabs.map(f => {
                  const count = watchMap[f.id].users.length;
                  const active = watchFilter === f.id;
                  return (
                    <button key={f.id} onClick={() => setWatchFilter(f.id)}
                      style={{
                        flexShrink:0, padding:'10px 12px', borderRadius:'12px', border:'none', cursor:'pointer',
                        fontSize:'10px', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.05em',
                        display:'flex', alignItems:'center', gap:'6px',
                        background: active ? '#0f172a' : '#f8fafc', color: active ? '#fff' : '#64748b'
                      }}>
                      {f.label} 
                      <span style={{background:active?'rgba(255,255,255,0.2)':'#e2e8f0',color:active?'#fbbf24':'#475569',padding:'2px 6px',borderRadius:'6px'}}>{count}</span>
                    </button>
                  )
                })}
              </div>
              {watchMap[watchFilter] && <WatchlistGroup {...watchMap[watchFilter]} bg="#ffffff" color="#0f172a" />}
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex bg-white p-1 rounded-xl border border-slate-100 gap-1 flex-1 min-w-[180px]">
                {["ALL","7D","30D","90D"].map(r=>(
                  <button key={r} onClick={()=>setRangeFilter(r)} style={{flex:1,padding:'8px 4px',borderRadius:'10px',border:'none',cursor:'pointer',fontSize:'9px',fontWeight:900, background:rangeFilter===r?'#020617':'transparent',color:rangeFilter===r?'#fff':'#64748b'}}>{r}</button>
                ))}
              </div>
              <div className="flex bg-white p-1 rounded-xl border border-slate-100 gap-1 flex-1 min-w-[180px]">
                {["ALL","STUDENT","STAFF"].map(t=>(
                  <button key={t} onClick={()=>setTypeFilter(t)} style={{flex:1,padding:'8px 4px',borderRadius:'10px',border:'none',cursor:'pointer',fontSize:'9px',fontWeight:900, background:typeFilter===t?'#fbbf24':'transparent',color:typeFilter===t?'#020617':'#64748b'}}>{t}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                {label:"Total Leaves", value:analysisLeaves.length,                                     icon:"📋", bg:'#eff6ff', color:'#2563eb'},
                {label:"Total Days",   value:analysisLeaves.reduce((s,l)=>s+Number(l.Total_Days||0),0), icon:"📅", bg:'#fef3c7', color:'#d97706'},
                {label:"Approved",     value:analysisLeaves.filter(l=>l.Status==="Approved").length,     icon:"✅", bg:'#f0fdf4', color:'#16a34a'},
              ].map((s,i)=>(
                <div key={i} style={{background:s.bg,padding:'16px 10px',borderRadius:'16px',textAlign:'center',border:`1px solid ${s.color}33`}}>
                  <div style={{fontSize:'20px',marginBottom:'4px'}}>{s.icon}</div>
                  <p style={{fontSize:'22px',fontWeight:900,color:s.color,margin:'0 0 4px',lineHeight:1}}>{s.value}</p>
                  <p style={{fontSize:'8px',fontWeight:900,color:s.color,textTransform:'uppercase',letterSpacing:'0.05em',margin:0,opacity:0.8}}>{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white p-5 rounded-[24px] border border-slate-200 shadow-xl">
              <p className="text-[11px] font-black color-[#0284c7] uppercase tracking-widest mb-3">🔍 Individual Search</p>
              <input value={historySearchQueryAnalysis} onChange={e => setHistorySearchQueryAnalysis(e.target.value)} placeholder="Search student or staff name/ID..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none mb-3"/>
              {historySearchQueryAnalysis.trim().length >= 2 && (
                <div className="max-h-[350px] overflow-y-auto flex flex-col gap-3 pr-1">
                  {searchedUsersAnalysis.length === 0 ? <p className="text-[11px] text-slate-400 text-center italic my-4">No records found.</p> : searchedUsersAnalysis.map((u, i) => (
                    <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm font-black text-slate-900 m-0 mb-1">{u.name}</p>
                          <div className="flex gap-2 flex-wrap">
                            <span className="text-[8px] bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded-md font-black">ID: {u.id}</span>
                            {u.type === 'STUDENT' ? (
                              <>
                                <span className="text-[8px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-black">STUDENT</span>
                                {(u.grade || u.section) && <span className="text-[8px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-md font-black">{u.grade ? `Grade ${u.grade}` : ''}{u.grade && u.section ? ` - ${u.section}` : ''}{!u.grade ? 'STUDENT' : ''}</span>}
                              </>
                            ) : <span className="text-[8px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md font-black">STAFF</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-amber-500 leading-none m-0">{u.totalDays}</p>
                          <p className="text-[8px] uppercase tracking-widest text-slate-400 mt-1 font-bold m-0">Total Days</p>
                        </div>
                      </div>
                      <div className="border-t border-slate-200 pt-3 flex flex-col gap-2">
                        <p className="text-[9px] color-[#94a3b8] uppercase font-black m-0 mb-1">Absence Records:</p>
                        {u.reasons.map((r, ri) => (
                          <div key={ri} className="bg-white p-2 rounded-lg flex gap-3 items-center border border-slate-100 shadow-sm">
                            <div className="bg-slate-50 p-2 rounded-md text-center min-w-[50px] border border-slate-200">
                              <p className="text-[9px] text-slate-600 font-black m-0">{formatDateDisplay(r.start)}</p>
                              {r.end && formatMMDate(r.end) !== formatMMDate(r.start) && <p className="text-[8px] text-slate-400 font-black m-0 mt-0.5">↓<br/>{formatDateDisplay(r.end)}</p>}
                            </div>
                            <div className="flex-1">
                              <span className="text-[8px] text-sky-600 uppercase font-black block mb-0.5">{r.type}</span>
                              <p className="text-[11px] text-slate-600 m-0 font-italic word-break-word">Reason: {r.text}</p>
                              {r.attachment && r.attachment !== '-' && <a href={r.attachment} target="_blank" className="text-[10px] text-sky-500 underline font-bold mt-1 inline-block">📎 View Doc</a>}
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
    </div>
  );
}