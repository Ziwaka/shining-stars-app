"use client";
import React from 'react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import { WEB_APP_URL } from '@/lib/api';
import CompactWatchlistFilter from '@/components/leave/CompactWatchlistFilter';
import StaffAnalysisTab from '@/components/leave/StaffAnalysisTab';

const MM_TZ = 'Asia/Yangon';
const getTodayMM = () => {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: MM_TZ }); }
  catch(e) { return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Yangon'}); }
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

const S = {
  page:    { display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden', background:'#fdfcf0', color:'#020617', fontFamily:'system-ui,sans-serif' },
  header:  { flexShrink:0, background:'#020617', borderBottom:'6px solid #fbbf24', padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' },
  body:    { flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', paddingBottom:'80px' },
  card:    { background:'#fff', border:'1px solid #e2e8f0', borderRadius:'20px', padding:'18px', boxShadow:'0 4px 12px rgba(0,0,0,0.03)', marginBottom:'14px' },
  input:   { width:'100%', background:'#fdfcf0', border:'2px solid #e2e8f0', borderRadius:'14px', padding:'12px 14px', color:'#020617', fontSize:'13px', fontWeight:700, outline:'none', boxSizing:'border-box' },
  select:  { width:'100%', background:'#fdfcf0', border:'2px solid #e2e8f0', borderRadius:'14px', padding:'12px 14px', color:'#020617', fontSize:'13px', fontWeight:700, outline:'none', boxSizing:'border-box' },
  label:   { display:'block', fontSize:'9px', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:900, marginBottom:'6px' },
  btnDark: { background:'#020617', color:'#fbbf24', border:'none', borderRadius:'14px', padding:'14px', fontSize:'13px', fontWeight:900, width:'100%', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.06em' },
  tabOn:   { background:'#020617', color:'#fff', border:'none', borderRadius:'10px', padding:'10px 16px', fontSize:'11px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 4px 10px rgba(0,0,0,0.1)' },
  tabOff:  { background:'rgba(0,0,0,0.04)', color:'#94a3b8', border:'none', borderRadius:'10px', padding:'10px 16px', fontSize:'11px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap' },
};

const LEAVE_TYPES = ['Sick Leave','Medical Leave','Personal Leave','Urgent Affair', 'Casual Leave', 'Emergency Leave'];
const METHODS     = ['Phone Call','Telegram','Viber','Directly'];
const getDisplayName = s => s['Name (ALL CAPITAL)'] || s['အမည်'] || s.Name || '';

const DurationBadge = React.memo(({ leave }) => {
  const dt   = leave.Duration_Type || (leave.Leave_Mode === 'Half Day' ? 'HALF' : leave.Leave_Mode === 'Period-wise' ? 'PERIOD' : 'FULL');
  const days = Number(leave.Total_Days || 0);
  if (dt === 'HALF') {
    const part = leave.Half_Day_Part && leave.Half_Day_Part !== '-' ? ` (${leave.Half_Day_Part})` : '';
    return <span style={{background:'#fef3c7',color:'#92400e',fontSize:'9px',fontWeight:900,padding:'3px 8px',borderRadius:'99px',textTransform:'uppercase',whiteSpace:'nowrap'}}>🌗 ½ Day{part}</span>;
  }
  if (dt === 'PERIOD') {
    const subj = leave.Period_Range && leave.Period_Range !== '-' ? leave.Period_Range : (leave.Leave_Detail && leave.Leave_Detail !== '-' ? leave.Leave_Detail : 'Period');
    return <span style={{background:'#ede9fe',color:'#6d28d9',fontSize:'9px',fontWeight:900,padding:'3px 8px',borderRadius:'99px',textTransform:'uppercase',whiteSpace:'nowrap'}}>⏱️ {subj}</span>;
  }
  return <span style={{background:'#f0fdf4',color:'#16a34a',fontSize:'9px',fontWeight:900,padding:'3px 8px',borderRadius:'99px',textTransform:'uppercase',whiteSpace:'nowrap'}}>📅 {days} Day{days!==1?'s':''}</span>;
});

const WatchlistGroup = React.memo(({ title, users, icon, color, bg }) => (
  <div style={{background:bg||'#ffffff',border:'1px solid #e2e8f0',padding:'20px',borderRadius:'24px',display:'flex',flexDirection:'column',maxHeight:'450px',boxShadow:'0 2px 10px rgba(0,0,0,0.02)'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',borderBottom:'1px solid #f1f5f9',paddingBottom:'12px',flexShrink:0}}>
      <p style={{fontSize:'13px',fontWeight:900,textTransform:'uppercase',letterSpacing:'0.05em',color:color,margin:0}}>{icon} {title}</p>
      <span style={{fontSize:'11px',background:'#f1f5f9',color:'#475569',padding:'4px 10px',borderRadius:'8px',fontWeight:900}}>{users.length} Total</span>
    </div>
    <div style={{overflowY:'auto',display:'flex',flexDirection:'column',gap:'12px',paddingRight:'4px'}}>
      {users.length === 0 ? <p style={{fontSize:'12px',color:'#94a3b8',textAlign:'center',margin:'20px 0',fontStyle:'italic'}}>No records found</p> : users.map((u,i)=>(
        <div key={i} style={{background:'#f8fafc',borderRadius:'16px',padding:'16px',border:'1px solid #e2e8f0'}}>
          <p style={{fontSize:'15px',fontWeight:900,color:'#0f172a',margin:'0 0 10px'}}>{u.name}</p>
          <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'12px'}}>
            <span style={{fontSize:'9px',background:'#ffffff',border:'1px solid #e2e8f0',color:'#475569',padding:'4px 8px',borderRadius:'8px',fontWeight:900}}>ID: {u.id}</span>
            {u.type === 'STUDENT' ? (
              <>
                <span style={{fontSize:'9px',background:'#e0e7ff',color:'#4f46e5',padding:'4px 8px',borderRadius:'8px',fontWeight:900}}>STUDENT</span>
                {(u.grade || u.section) && <span style={{fontSize:'9px',background:'#e0f2fe',color:'#0284c7',padding:'4px 8px',borderRadius:'8px',fontWeight:900}}>G-{u.grade} {u.section?`· ${u.section}`:''}</span>}
              </>
            ) : <span style={{fontSize:'9px',background:'#fef3c7',color:'#d97706',padding:'4px 8px',borderRadius:'8px',fontWeight:900}}>STAFF</span>}
          </div>
          {u.reasons && u.reasons.length > 0 && (
            <div style={{borderTop:'1px solid #e2e8f0',paddingTop:'12px'}}>
              <p style={{fontSize:'9px',color:'#64748b',textTransform:'uppercase',fontWeight:900,margin:'0 0 8px',letterSpacing:'0.1em'}}>Recent Absences:</p>
              {u.reasons.slice(0,3).map((r,ri)=>(
                <div key={ri} style={{background:'#ffffff',padding:'10px',borderRadius:'10px',marginBottom:'6px',borderLeft:'3px solid #cbd5e1',boxShadow:'0 1px 3px rgba(0,0,0,0.02)'}}>
                  <p style={{fontSize:'10px',color:'#64748b',fontWeight:900,margin:'0 0 4px'}}>📅 {formatDateDisplay(r.start)} {r.end&&formatMMDate(r.end)!==formatMMDate(r.start)?`→ ${formatDateDisplay(r.end)}`:''}</p>
                  <p style={{fontSize:'11px',color:'#334155',margin:0,fontStyle:'italic',wordBreak:'break-word'}}>"{r.text}"</p>
                  {r.attachment && r.attachment !== '-' && <a href={r.attachment} target="_blank" style={{fontSize:'10px', color:'#0284c7', textDecoration:'none', fontWeight:900, display:'inline-block', marginTop:'6px'}}>📎 View Doc</a>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
));

const DUR_TYPES = [
  { id:'FULL',   label:'Full Day', icon:'📅' },
  { id:'HALF',   label:'½ Day',    icon:'🌗' },
  { id:'PERIOD', label:'Subject',  icon:'⏱️' },
];

export default function StaffLeave() {
  const router = useRouter();
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [registry, setRegistry] = useState({ students:[], staff:[], allLeaves:[], pending:[], history:[], statsList: [] });
  
  const [view, setView]         = useState('NEW'); 
  const [target, setTarget]     = useState('STUDENT');
  const [selected, setSelected] = useState(null);
  const [searchRaw, setSearchRaw] = useState('');
  const [search] = useDebounce(searchRaw, 150);
  const [msg, setMsg]           = useState(null);
  
  const [rangeFilter, setRangeFilter] = useState("ALL");
  const [typeFilter,  setTypeFilter]  = useState("ALL");
  const [watchFilter, setWatchFilter] = useState("TODAY");
  
  const [histSearch, setHistSearch] = useState("");
  const [histFilter, setHistFilter] = useState("ALL");

  const [calDate, setCalDate] = useState(new Date());
  const [selectedCalDate, setSelectedCalDate] = useState(null);

  const [form, setForm] = useState({
    category:'School', type:'Sick Leave', durType:'FULL',
    start: getTodayMM(), end: getTodayMM(), halfPart:'AM', subject:'',
    reason:'', remark:'', attachment:'',
    reporter:'', relation:'', phone:'', method:'Phone Call',
  });
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(WEB_APP_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({action:'getInitialData'})});
      const r = await res.json();
      if (r.success) {
        const isActive = u => u.Status?.toString().toUpperCase() !== 'FALSE';
        const students = (r.students||[]).filter(isActive);
        const staff = (r.staffList||r.staff||[]).filter(isActive);
        const allLeaves = r.leaves || [];
        const pending = allLeaves.filter(x=>x.Status==='Pending');
        const history = allLeaves.filter(x=>x.Status!=='Pending').reverse();
        
        const stats = {};
        allLeaves.filter(l => l.Status === 'Approved').forEach(l => {
          const k = l.User_ID || l.Name;
          if (!stats[k]) stats[k] = { name: l.Name, type: l.User_Type, id: l.User_ID || '-', grade: '', section: '', totalDays: 0, weekCount: 0, monthCount: 0, consecutiveMax: 0, isAbsentToday: false, reasons: [] };
          const cleanS = formatMMDate(l.Start_Date);
          const cleanE = formatMMDate(l.End_Date) || cleanS;
          const days = Number(l.Total_Days) || 0;
          stats[k].totalDays += days;
          const todayStr = getTodayMM();
          if (todayStr >= cleanS && todayStr <= cleanE) stats[k].isAbsentToday = true;
          const sdMs = new Date(cleanS).getTime();
          const now = new Date();
          const diffDays = (now.getTime() - sdMs) / 86400000;
          if (diffDays <= 7) stats[k].weekCount += days;
          if (diffDays <= 30) stats[k].monthCount += days;
          if (l.Reason && l.Reason !== '-') stats[k].reasons.push({ start: cleanS, end: cleanE, text: l.Reason, type: l.Leave_Type, attachment: l.Attachment_Link });
        });
        Object.values(stats).forEach(u => {
          if (u.type === 'STUDENT') {
            const st = students.find(s => s.Student_ID === u.id || s['Enrollment No.'] === u.id || s['Name (ALL CAPITAL)'] === u.name || s['အမည်'] === u.name || s.Name === u.name);
            if (st) { u.grade = st.Grade || ''; u.section = st.Class || st.Section || ''; }
          }
          u.reasons.sort((a,b) => new Date(b.start) - new Date(a.start));
          let maxC = 0, currC = 0, lastEnd = 0;
          const periods = u.reasons.map(r => ({ start: new Date(r.start).getTime(), days: 1 }));
          periods.sort((a,b) => a.start - b.start);
          periods.forEach(p => {
            if (lastEnd === 0) currC = p.days;
            else { const diffDays = (p.start - lastEnd) / 86400000; if (diffDays <= 3) currC += p.days; else currC = p.days; }
            if (currC > maxC) maxC = currC;
            lastEnd = p.start + (p.days * 86400000);
          });
          u.consecutiveMax = maxC;
        });
        const statsList = Object.values(stats);
        
        setRegistry({ students, staff, allLeaves, pending, history, statsList });
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user')||sessionStorage.getItem('user')||'null');
    if (!u) { router.push('/login'); return; }
    const checkPerm = k => u.userRole==='management' || u[k]===true || String(u[k]||'').toUpperCase()==='TRUE';
    if (u.userRole==='management') { setUser(u); fetchData(); return; }
    if (checkPerm('Can_Record_Attendance_&_Leave')) { setUser(u); fetchData(); return; }
    fetch(WEB_APP_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({action:'getStaffPermissions'})})
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
  }, [router, fetchData]);

  const showMsg = (text,type='success') => { setMsg({text,type}); setTimeout(()=>setMsg(null),3000); };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setUploading(true);
      try {
        const res = await fetch(WEB_APP_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({ action:'uploadPhoto', base64, filename: file.name, mimeType: file.type, folder: 'documents' }) }).then(r=>r.json());
        if(res.success) { setF('attachment', res.photoUrl); showMsg('File uploaded ✓'); }
        else showMsg('Upload failed','error');
      } catch(e) { showMsg('Upload error','error'); }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const calcDays = useCallback(() => {
    if (form.durType === 'HALF')   return 0.5;
    if (form.durType === 'PERIOD') return 0;
    if (!form.start || !form.end)  return 0;
    const d = Math.ceil(Math.abs(new Date(form.end)-new Date(form.start))/86400000)+1;
    return d > 0 ? d : 0;
  }, [form.durType, form.start, form.end]);
  const endDateForSave  = () => (form.durType !== 'FULL') ? form.start : form.end;
  const durationSummary = () => {
    const d = calcDays();
    if (form.durType === 'HALF')   return `½ Day — ${form.halfPart}`;
    if (form.durType === 'PERIOD') return `⏱️ ${form.subject || 'Subject(s)'}`;
    return `${d} day${d!==1?'s':''}`;
  };

  const handleSubmit = async () => {
    if (!selected||!form.start||!form.reason.trim()) return showMsg('Date နှင့် Reason ဖြည့်ပါ','error');
    if (form.durType==='FULL'&&!form.end) return showMsg('End Date ဖြည့်ပါ','error');
    if (form.durType==='PERIOD'&&!form.subject.trim()) return showMsg('ဘာသာရပ် အမည် ဖြည့်ပါ','error');
    if (target==='STUDENT'&&(!form.reporter.trim()||!form.relation.trim()||!form.phone.trim())) return showMsg('Reporter details ဖြည့်ပါ','error');
    
    const startDateMM = formatMMDate(form.start);
    const endDateMM = formatMMDate(endDateForSave());
    const userId = selected['Enrollment No.'] || selected['Staff_ID'];
    
    // Check for duplicate leave (same user, same dates, not rejected)
    const existingLeave = registry.allLeaves.find(l => 
      l.User_ID === userId &&
      l.Status !== 'Rejected' &&
      formatMMDate(l.Start_Date) === startDateMM &&
      formatMMDate(l.End_Date || l.Start_Date) === endDateMM
    );

    if (existingLeave) {
      const confirmMsg = `⚠️ ဤအသုံးပြုသူအတွက် ဤရက်များတွင် ခွင့်တင်ထားပြီးသားဖြစ်သည်။\n\nStatus: ${existingLeave.Status}\nLeave Type: ${existingLeave.Leave_Type}\nReason: ${existingLeave.Reason}\n\nဆက်လက်တင်မည်လား။`;
      if (!confirm(confirmMsg)) return;
    }

    setSaving(true);
    const totalDays=calcDays();
    const applyDateMM = getTodayMM();

    const entry=[{
      Date_Applied: applyDateMM, Category:form.category, User_Type:target,
      User_ID: userId,
      Name:selected['Name (ALL CAPITAL)']||selected['အမည်']||selected['Name'],
      Leave_Type:form.type, Duration_Type:form.durType, Half_Day_Part:form.durType==='HALF'?form.halfPart:'-',
      Period_Count:'-', Period_Range:form.durType==='PERIOD'?form.subject:'-',
      Start_Date: startDateMM, End_Date: endDateMM, Total_Days:totalDays,
      Reason:form.reason, Remark:form.remark||'-', Attachment_Link:form.attachment||'-',
      Reporter_Name:target==='STUDENT'?form.reporter:'-', Relationship:target==='STUDENT'?form.relation:'-',
      Phone:target==='STUDENT'?form.phone:'-', Method:target==='STUDENT'?form.method:'-',
      Approved_By:'-', Status:'Pending',
    }];
    try {
      const res = await fetch(WEB_APP_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({action:'recordNote',sheetName:'Leave_Records', userRole:'staff', staffId: user?.Staff_ID||user?.username||'',data:entry})});
      const r = await res.json();
      if (r.success) {
        showMsg('Leave တင်ပြီးပါပြီ ✓');
        setForm({category:'School',type:'Sick Leave',durType:'FULL',start:getTodayMM(),end:getTodayMM(),halfPart:'AM',subject:'',reason:'',remark:'',attachment:'',reporter:'',relation:'',phone:'',method:'Phone Call'});
        setSelected(null); setSearchRaw(''); fetchData();
      } else showMsg(r.message||'Error','error');
    } catch { showMsg('Network error','error'); }
    setSaving(false);
  };

  // ========== FIXED SEARCH (Regex, case‑insensitive, partial match on both name fields) ==========
  const filtered = useMemo(() => {
    if (!search) return [];
    const list = target === 'STUDENT' ? registry.students : registry.staff;
    const trimmed = search.trim();
    if (!trimmed) return [];
    const regex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return list.filter(u => {
      let nameMatch = false;
      if (target === 'STUDENT') {
        const burmeseName = u['အမည်'] || '';
        const englishName = u['Name (ALL CAPITAL)'] || u['Name'] || '';
        nameMatch = regex.test(burmeseName) || regex.test(englishName);
      } else {
        const staffName = u['Name (ALL CAPITAL)'] || u['Name'] || '';
        nameMatch = regex.test(staffName);
      }
      const id = (u['Enrollment No.'] || u['Student_ID'] || u['Staff_ID'] || '').toString();
      return nameMatch || regex.test(id);
    });
  }, [search, target, registry.students, registry.staff]);

  const getStudentInfo = useCallback((userId, name) => {
    const st = registry.students.find(s => s.Student_ID === userId || s['Enrollment No.'] === userId || s['Name (ALL CAPITAL)'] === name || s['အမည်'] === name || s.Name === name);
    return st ? { grade: st.Grade || '', section: st.Class || st.Section || '' } : { grade:'', section:'' };
  }, [registry.students]);

  const historyData = useMemo(() => {
    if (view !== 'HISTORY') return { filteredHistory: [], groupedHistory: {}, sortedDates: [] };
    const trimmedSearch = histSearch.trim();
    let filtered = registry.history.slice();
    if (trimmedSearch) {
      const regex = new RegExp(trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filtered = filtered.filter(h => 
        regex.test(h.Name || '') || regex.test(h.Leave_Type || '')
      );
    }
    if (histFilter !== 'ALL') {
      filtered = filtered.filter(h => h.User_Type === histFilter);
    }
    const grouped = filtered.reduce((acc, l) => {
      const date = formatMMDate(l.Start_Date);
      if (!acc[date]) acc[date] = [];
      acc[date].push(l);
      return acc;
    }, {});
    const sorted = Object.keys(grouped).sort((a,b) => new Date(b) - new Date(a));
    return { filteredHistory: filtered, groupedHistory: grouped, sortedDates: sorted };
  }, [view, registry.history, histSearch, histFilter]);

  if (loading || saving || uploading) return (
    <div className="min-h-[50vh] flex items-center justify-center font-black text-[#4c1d95] animate-pulse uppercase italic tracking-widest text-lg">
      {saving || uploading ? "Processing..." : "Loading Leave Hub..."}
    </div>
  );

  return (
    <div style={S.page}>
      
      {selectedCalDate && (
        <div className="fixed inset-0 z-[99] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedCalDate(null)}>
           <div className="bg-white w-full max-w-[520px] rounded-[24px] p-6 shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4 shrink-0">
               <div>
                 <h3 className="text-xl font-black text-slate-900 leading-none mb-1">Absent Details</h3>
                 <p className="text-[10px] uppercase tracking-widest text-sky-500 font-bold">{formatDateDisplay(selectedCalDate)}</p>
               </div>
               <button onClick={() => setSelectedCalDate(null)} className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 font-black text-lg flex items-center justify-center hover:bg-slate-200">✕</button>
             </div>
             <div className="overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-200 flex-1">
               {registry.allLeaves.filter(l => l.Status === 'Approved' && formatMMDate(l.Start_Date) <= selectedCalDate && (formatMMDate(l.End_Date) || formatMMDate(l.Start_Date)) >= selectedCalDate).map((l, i) => {
                  const stInfo = l.User_Type === 'STUDENT' ? getStudentInfo(l.User_ID, l.Name) : {grade:'',section:''};
                  return (
                    <div key={i} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-lg">{l.User_Type==='STUDENT'?'🎓':'👔'}</div>
                           <div>
                             <p className="font-black text-slate-900 text-[15px] m-0">{l.Name}</p>
                             {l.User_Type==='STUDENT' && <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">
                               {stInfo.grade ? `G-${stInfo.grade}` : ''}{stInfo.grade && stInfo.section ? ` - ${stInfo.section}` : ''}{!stInfo.grade ? 'STUDENT' : ''}
                             </span>}
                           </div>
                         </div>
                         <span className="text-[9px] uppercase font-black bg-white px-3 py-1 rounded-lg shadow-sm text-sky-600 border border-slate-100 shrink-0">{l.Leave_Type}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <p className="text-[12px] text-slate-600 italic leading-snug m-0">"{l.Reason}"</p>
                         {l.Remark && l.Remark !== '-' && l.Remark !== '' && (
                           <div className="mt-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 text-[10px] text-amber-700 font-bold flex items-start gap-1">
                             <span>✏️</span><span>{l.Remark}</span>
                           </div>
                         )}
                      </div>
                    </div>
                  )
               })}
             </div>
           </div>
        </div>
      )}

      <div style={S.header}>
        <button onClick={()=>router.push('/staff')} style={{background:'#fbbf24',color:'#020617',border:'none',borderRadius:'10px',width:'36px',height:'36px',cursor:'pointer',fontSize:'16px',fontWeight:900}}>←</button>
        <div style={{flex:1,marginLeft:'10px'}}>
          <p style={{fontWeight:900,fontSize:'14px',color:'#fff',margin:0,textTransform:'uppercase',letterSpacing:'0.05em'}}>Leave Request</p>
          <p style={{fontSize:'9px',color:'#fbbf24',margin:0,letterSpacing:'0.2em',textTransform:'uppercase'}}>Staff / Teacher Portal</p>
        </div>
        <button onClick={fetchData} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'18px'}}>↻</button>
      </div>

      {msg&&<div style={{position:'fixed',top:'70px',left:'50%',transform:'translateX(-50%)',zIndex:50,padding:'8px 20px',borderRadius:'999px',fontSize:'12px',fontWeight:900,color:'#fff',background:msg.type==='error'?'#ef4444':'#10b981',boxShadow:'0 4px 20px rgba(0,0,0,0.2)',whiteSpace:'nowrap'}}>{msg.text}</div>}

      <div style={S.body}>
        <div style={{maxWidth:'600px',margin:'0 auto',padding:'16px',display:'flex',flexDirection:'column',gap:'12px'}}>

          <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'8px'}}>
            <button onClick={()=>setView('NEW')}     style={view==='NEW'     ?S.tabOn:S.tabOff}>✏️ New</button>
            <button onClick={()=>setView('PENDING')} style={view==='PENDING' ?S.tabOn:S.tabOff}>⏳ Pending ({registry.pending.length})</button>
            <button onClick={()=>setView('HISTORY')} style={view==='HISTORY' ?S.tabOn:S.tabOff}>📋 History</button>
            <button onClick={()=>setView('ANALYSIS')} style={view==='ANALYSIS' ?S.tabOn:S.tabOff}>📊 Analysis</button>
          </div>

          {view==='NEW' && !selected && (
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
                  <button key={t} onClick={()=>{setTarget(t);setSearchRaw('');}}
                    style={{flex:1,padding:'10px',borderRadius:'10px',border:'none',cursor:'pointer',fontWeight:900,fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.05em',
                      background:target===t?'#020617':'transparent',color:target===t?'#fff':'#94a3b8'}}>{t}</button>
                ))}
              </div>
              <div style={S.card}>
                <label style={S.label}>နာမည် သို့ ID ရှာပါ</label>
                <input value={searchRaw} onChange={e=>setSearchRaw(e.target.value)} placeholder={target==='STUDENT'?'ကျောင်းသားနာမည် သို့ ID...':'ဝန်ထမ်းနာမည် သို့ ID...'} style={S.input}/>
                {filtered.length>0&&(
                  <div style={{marginTop:'8px',display:'flex',flexDirection:'column',gap:'6px',maxHeight:'300px',overflowY:'auto'}}>
                    {filtered.map((u,i)=>(
                      <button key={i} onClick={()=>{setSelected(u);setSearchRaw('');}} style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'12px 14px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',textAlign:'left'}}>
                        <div>
                          <p style={{fontWeight:900,fontSize:'13px',color:'#020617',margin:0}}>{getDisplayName(u)}</p>
                          <p style={{fontSize:'9px',color:'#94a3b8',margin:'2px 0 0',textTransform:'uppercase',letterSpacing:'0.1em'}}>ID: {target==='STUDENT'?u['Enrollment No.']:u['Staff_ID']}</p>
                        </div>
                        <span style={{color:'#94a3b8',fontSize:'16px'}}>→</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {view==='NEW' && selected && (
            <>
              <div style={{background:'#fef9c3',border:'2px solid #fbbf24',borderRadius:'16px',padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <p style={{fontSize:'9px',color:'#92400e',textTransform:'uppercase',letterSpacing:'0.12em',margin:'0 0 3px',fontWeight:900}}>Target ({form.category})</p>
                  <p style={{fontWeight:900,fontSize:'15px',color:'#020617',margin:0}}>{getDisplayName(selected)}</p>
                  <p style={{fontSize:'9px',color:'#92400e',margin:'2px 0 0'}}>ID: {target==='STUDENT'?selected['Enrollment No.']:selected['Staff_ID']}</p>
                </div>
                <button onClick={()=>setSelected(null)} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'10px',padding:'6px 12px',color:'#64748b',fontSize:'11px',fontWeight:900,cursor:'pointer'}}>✕ Change</button>
              </div>

              <div style={S.card}>
                <label style={S.label}>Leave Category</label>
                <select value={form.type} onChange={e=>setF('type',e.target.value)} style={S.select}>
                  {LEAVE_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>

              <div style={{...S.card,background:'#f8faff',border:'2px solid #e0e7ff'}}>
                <label style={{...S.label,color:'#4338ca',marginBottom:'10px'}}>⏱ Duration Type</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'16px'}}>
                  {DUR_TYPES.map(d=>(
                    <button key={d.id} onClick={()=>setF('durType',d.id)}
                      style={{padding:'10px 6px',borderRadius:'12px',border:'none',cursor:'pointer',fontWeight:900,fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.04em',
                        display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',
                        background:form.durType===d.id?'#4338ca':'#fff', color:form.durType===d.id?'#fff':'#64748b',
                        boxShadow:form.durType===d.id?'0 4px 14px rgba(67,56,202,0.3)':'0 1px 4px rgba(0,0,0,0.06)', transition:'all 0.15s'}}>
                      <span style={{fontSize:'18px'}}>{d.icon}</span>{d.label}
                    </button>
                  ))}
                </div>

                {form.durType==='FULL'&&(
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                    <div><label style={S.label}>Start Date *</label><input type="date" value={form.start} onChange={e=>setF('start',e.target.value)} style={S.input}/></div>
                    <div><label style={S.label}>End Date *</label><input type="date" value={form.end} onChange={e=>setF('end',e.target.value)} style={S.input}/></div>
                  </div>
                )}

                {form.durType==='HALF'&&(
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                    <div><label style={S.label}>Date *</label><input type="date" value={form.start} onChange={e=>setF('start',e.target.value)} style={S.input}/></div>
                    <div>
                      <label style={S.label}>Time of Day *</label>
                      <div style={{display:'flex',gap:'6px'}}>
                        {['AM','PM'].map(p=>(
                          <button key={p} onClick={()=>setF('halfPart',p)} style={{flex:1,padding:'12px',borderRadius:'12px',border:'none',cursor:'pointer',fontWeight:900,fontSize:'12px', background:form.halfPart===p?'#fbbf24':'#f1f5f9', color:form.halfPart===p?'#020617':'#94a3b8'}}>{p}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {form.durType==='PERIOD'&&(
                  <div className="grid grid-cols-2 gap-4">
                    <div><label style={S.label}>Date *</label><input type="date" value={form.start} onChange={e=>setF('start',e.target.value)} style={S.input}/></div>
                    <div>
                      <label style={S.label}>Subject(s) missed *</label>
                      <input value={form.subject} onChange={e=>setF('subject',e.target.value)} placeholder="Mathematics..." style={S.input}/>
                    </div>
                  </div>
                )}
              </div>

              <div style={S.card}>
                <label style={{...S.label,color:'#ef4444'}}>Reason *</label>
                <textarea rows={3} value={form.reason} onChange={e=>setF('reason',e.target.value)} placeholder="အကြောင်းပြချက် ရေးပါ..." style={{...S.input,resize:'vertical',minHeight:'80px'}}/>
              </div>

              <div style={S.card}>
                <label style={{...S.label,color:'#0284c7'}}>📎 Supporting Document (Optional)</label>
                <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} style={{...S.input, padding:'8px'}}/>
                {uploading && <p style={{fontSize:'10px', color:'#0284c7', marginTop:'6px', fontWeight:900}}>Uploading image...</p>}
                {form.attachment && <img src={form.attachment} alt="Attachment" style={{marginTop:'10px', maxHeight:'120px', borderRadius:'10px', border:'1px solid #e2e8f0'}}/>}
              </div>

              {target==='STUDENT'&&(
                <div style={{...S.card,background:'#fffbeb',border:'1px solid rgba(251,191,36,0.3)'}}>
                  <p style={{...S.label,marginBottom:'12px',color:'#92400e'}}>ခွင့်တိုင်သူ အချက်အလက်</p>
                  <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                      <input value={form.reporter} onChange={e=>setF('reporter',e.target.value)} placeholder="သတင်းပို့သူအမည် *" style={{...S.input,background:'#fff'}}/>
                      <input value={form.relation} onChange={e=>setF('relation',e.target.value)} placeholder="ဆက်ဆံရေး *" style={{...S.input,background:'#fff'}}/>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                      <input value={form.phone} onChange={e=>setF('phone',e.target.value)} placeholder="ဖုန်းနံပါတ် *" type="tel" style={{...S.input,background:'#fff'}}/>
                      <select value={form.method} onChange={e=>setF('method',e.target.value)} style={{...S.select,background:'#fff'}}>
                        {METHODS.map(m=><option key={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div style={S.card}>
                <label style={{...S.label,color:'#7c3aed'}}>📝 Notes / Remark <span style={{fontSize:'8px',fontWeight:400,color:'#94a3b8'}}>(Optional)</span></label>
                <textarea rows={2} value={form.remark} onChange={e=>setF('remark',e.target.value)} placeholder="ထပ်ဆောင်း မှတ်ချက် (optional)..." style={{...S.input,resize:'vertical',minHeight:'60px'}}/>
              </div>

              {form.start&&(
                <div style={{background:'#1e1b4b',borderRadius:'14px',padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px',marginBottom:'14px'}}>
                  <div>
                    <p style={{fontSize:'8px',color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.12em',margin:'0 0 3px',fontWeight:900}}>Leave Summary</p>
                    <p style={{fontSize:'12px',color:'#fff',fontWeight:900,margin:0}}>{getDisplayName(selected)}</p>
                    <p style={{fontSize:'9px',color:'rgba(255,255,255,0.5)',margin:'2px 0 0'}}>{form.type} · {formatDateDisplay(form.start)}{form.end&&formatMMDate(form.end)!==formatMMDate(form.start)?` → ${formatDateDisplay(form.end)}`:''}</p>
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

          {view==='PENDING' && (
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
                      <p style={{fontSize:'9px',color:'#94a3b8',flexShrink:0,marginLeft:'8px'}}>{formatDateDisplay(l.Date_Applied)}</p>
                    </div>
                    <p style={{fontWeight:900,fontSize:'15px',color:'#020617',margin:'0 0 2px'}}>{l.Name}</p>
                    <div style={{display:'flex', gap:'6px', marginBottom:'10px', flexWrap:'wrap'}}>
                      <span style={{fontSize:'9px',color:'#64748b',background:'#f1f5f9',padding:'2px 6px',borderRadius:'6px',fontWeight:900}}>ID: {l.User_ID}</span>
                      {l.User_Type === 'STUDENT' && (stInfo.grade || stInfo.section) && (
                         <span style={{fontSize:'9px',background:'#e0f2fe',color:'#0284c7',padding:'2px 6px',borderRadius:'6px',fontWeight:900}}>
                           {stInfo.grade ? `G-${stInfo.grade}` : ''}{stInfo.grade && stInfo.section ? ` - ${stInfo.section}` : ''}
                         </span>
                      )}
                    </div>
                    <p style={{fontSize:'9px',color:'#94a3b8',margin:'0 0 10px',fontWeight:900}}><span style={{color:'#6366f1'}}>{l.Leave_Type}</span> · {formatDateDisplay(l.Start_Date)}{l.End_Date&&formatMMDate(l.End_Date)!==formatMMDate(l.Start_Date)?` → ${formatDateDisplay(l.End_Date)}`:''}</p>
                    <div style={{background:'#f8fafc',borderLeft:'3px solid #7c3aed',borderRadius:'10px',padding:'10px 12px',marginBottom:'8px'}}>
                      <p style={{fontSize:'9px',color:'#94a3b8',fontWeight:900,margin:'0 0 4px',textTransform:'uppercase',letterSpacing:'0.1em'}}>Reason:</p>
                      <p style={{fontSize:'12px',color:'#334155',margin:0,fontStyle:'italic',wordBreak:'break-word'}}>"{l.Reason}"</p>
                    </div>
                    {l.Attachment_Link && l.Attachment_Link !== '-' && (
                      <a href={l.Attachment_Link} target="_blank" style={{fontSize:'10px', color:'#0284c7', textDecoration:'none', fontWeight:900, display:'inline-block', marginBottom:'8px'}}>📎 View Document</a>
                    )}
                    <div style={{background:'#f1f5f9',color:'#64748b',borderRadius:'10px',padding:'8px',textAlign:'center',fontSize:'10px',fontWeight:900,textTransform:'uppercase',letterSpacing:'0.1em'}}>Awaiting Authorization from Management</div>
                  </div>
                );
              })}
            </div>
          )}

          {view==='HISTORY' && (
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div style={{display:'flex',gap:'8px',marginBottom:'4px',flexWrap:'wrap'}}>
                <input placeholder="Search name..." value={histSearch} onChange={e=>setHistSearch(e.target.value)} style={{...S.input, flex:1, minWidth:'150px', background:'#fff', border:'1px solid #cbd5e1'}} />
                <select value={histFilter} onChange={e=>setHistFilter(e.target.value)} style={{...S.select, width:'auto', background:'#fff', border:'1px solid #cbd5e1'}}>
                  <option value="ALL">All Roles</option><option value="STUDENT">Students</option><option value="STAFF">Staff</option>
                </select>
              </div>

              {historyData.sortedDates.length===0?(
                <div className="py-24 text-center"><p className="font-black uppercase italic text-slate-300 text-xl tracking-widest">No history yet</p></div>
              ):historyData.sortedDates.map(date => (
                <div key={date}>
                  <div className="flex items-center gap-2 mt-4 mb-2">
                     <span className="text-xs font-black bg-slate-200 px-3 py-1 rounded-lg">📅 {formatDateDisplay(date)}</span>
                     <div className="flex-1 h-0.5 bg-slate-100 rounded-full"/>
                  </div>
                  <div className="flex flex-col gap-3">
                    {historyData.groupedHistory[date].map((l,i)=>{
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
                                 {stInfo.grade ? `G-${stInfo.grade}` : ''}{stInfo.grade && stInfo.section ? ` - ${stInfo.section}` : ''}
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

          {view === 'ANALYSIS' && (
            <StaffAnalysisTab 
              statsList={registry.statsList} 
              allLeaves={registry.allLeaves}
              loading={loading} 
            />
          )}

        </div>
      </div>
    </div>
  );
}
