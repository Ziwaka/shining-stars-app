"use client";
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';
import { hasPerm } from '@/lib/permissions';

const MM_TZ = 'Asia/Yangon';
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

function AbsentModal({ persons, title, onClose }) {
  if (!persons || persons.length === 0) return null;
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div className="bg-white w-full md:w-[520px] rounded-t-[2.5rem] md:rounded-[2.5rem] p-6 shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center md:hidden mb-4"><div className="w-12 h-1.5 bg-slate-200 rounded-full"/></div>
        <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1">Absent Detail</p>
            <h3 className="text-xl font-black text-slate-900 leading-none">{title}</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 font-black text-lg flex items-center justify-center hover:bg-slate-200">✕</button>
        </div>
        <div className="overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
          {persons.map((p, i) => (
             <div key={i} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm">
               <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${p.status === 'Approved' ? 'bg-emerald-100' : 'bg-rose-100'}`}>{p.grade ? '🎓' : '👔'}</div>
                    <div>
                      <p className="font-black text-slate-900 text-[15px]">{p.name || p.id}</p>
                      {p.grade && <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Grade {p.grade}{p.section ? ` · ${p.section}` : ''}</p>}
                    </div>
                  </div>
                  <span className={`text-[9px] uppercase font-black px-3 py-1 rounded-lg shadow-sm border ${p.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{p.status}</span>
               </div>
               <div className="bg-white p-3 rounded-xl border border-slate-100">
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase">{p.leave_type || 'Leave'}</span>
                   <span className="text-[10px] font-bold text-slate-500">📅 {formatDateDisplay(p.start_date)}{p.end_date && p.end_date !== p.start_date ? ` → ${formatDateDisplay(p.end_date)}` : ''}</span>
                 </div>
                 {p.reason && p.reason !== '-' && <p className="text-[12px] text-slate-600 italic leading-snug">"{p.reason}"</p>}
               </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StaffAccessHub() {
  const [user, setUser] = useState(null);
  const [att, setAtt] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loadingAtt, setLoadingAtt] = useState(true);
  const [modal, setModal] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || "null");
    if (!auth) { router.push('/login'); return; }
    if (auth.userRole === 'management') { router.push('/management/mgt-dashboard'); return; }

    fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getStaffPermissions' }) })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          const fresh = res.data.find(s => (s.Staff_ID && s.Staff_ID.toString() === auth.Staff_ID?.toString()) || (s.Name && s.Name === auth['Name (ALL CAPITAL)']) || (s.Name && s.Name === auth.Name) );
          if (fresh) {
            const updated = { ...auth, ...fresh }; localStorage.setItem('user', JSON.stringify(updated)); setUser(updated); return;
          }
        }
        setUser(auth);
      }).catch(() => setUser(auth));

    const today = new Date().toLocaleDateString('en-CA', { timeZone:'Asia/Yangon' });
    Promise.all([
      fetch(WEB_APP_URL, { method:'POST', body:JSON.stringify({ action:'getAttendance', date:today }) }).then(r=>r.json()),
      fetch(WEB_APP_URL, { method:'POST', body:JSON.stringify({ action:'getAttendanceTrend' }) }).then(r=>r.json())
    ]).then(([attRes, trendRes]) => {
      if (attRes.success) setAtt(attRes);
      if (trendRes.success) setTrend(trendRes.trend || []);
      setLoadingAtt(false);
    }).catch(() => setLoadingAtt(false));
  }, []);

  if (!user) return <div className="h-screen flex items-center justify-center bg-[#F0F9FF]"><div className="w-12 h-12 border-4 border-slate-200 border-t-[#fbbf24] rounded-full animate-spin"></div></div>;

  const toolGroups = [
    { group: "Campus & Student Operations", items: [ { name: 'Student Directory', path: '/staff/student-dir', icon: '👤', perm: null }, { name: 'Hostel Management', path: '/staff/hostel', icon: '🏠', perm: 'Can_Manage_Hostel' }, { name: 'House Score Adjust', path: '/staff/points', icon: '⚖️', perm: null }, ] },
    { group: "Facilities & Transport", items: [ { name: 'Vehicle Registry', path: '/staff/vehicles', icon: '🛵', perm: null }, { name: 'Inventory', path: '/staff/inventory', icon: '📦', perm: 'Can_Manage_Inventory' }, { name: 'Lost & Found', path: '/staff/lost-found', icon: '🔍', perm: null }, ] },
    { group: "Staff Professional Hub", items: [ { name: 'Staff Contacts', path: '/staff/contacts', icon: '📞', perm: null }, { name: 'Master Registry', path: '/staff/staff-dir', icon: '👔', perm: 'Can_View_Staff' }, { name: 'Leave Portal', path: '/staff/leave', icon: '📄', perm: null }, ] },
    { group: "Administrative & Ledger", items: [ { name: 'Financial Registry', path: '/staff/fees', icon: '💰', perm: 'Can_Manage_Fees' }, { name: 'Registry Notes', path: '/staff/notes', icon: '📒', perm: null }, { name: 'Communication', path: '/management/communication', icon: '📢', perm: 'Can_Post_Announcement' }, { name: 'Exam Records', path: '/staff/exam-records', icon: '📝', perm: 'Can_Record_Exam' }, { name: 'Calendar', path: '/staff/calendar', icon: '📅', perm: 'Can_Manage_Events' }, { name: 'My Timetable', path: '/staff/timetable', icon: '🗓️', perm: null }, ] }
  ];

  const handleLogout = () => { localStorage.removeItem('user'); sessionStorage.removeItem('user'); router.push('/login'); };
  const COLOR = { green:'#16a34a', yellow:'#d97706', red:'#dc2626' };

  const allAbsentPersons = [ ...(att?.absentStudents || []), ...(att?.pendingStudents || []), ...(att?.absentStaff || []), ...(att?.pendingStaff || []) ];
  const openAbsentModal = (type) => {
    let persons = []; let title = '';
    if (type === 'student') { persons = [...(att?.absentStudents||[]), ...(att?.pendingStudents||[])]; title = 'Student Absences Today'; } 
    else if (type === 'staff') { persons = [...(att?.absentStaff||[]), ...(att?.pendingStaff||[])]; title = 'Staff Absences Today'; } 
    else { persons = allAbsentPersons.filter(p => (p.classKey || 'Unknown') === (type || 'Unknown')); title = type && type !== 'Unknown' ? `Class ${type} — Absences` : 'Grade Unknown — Absences'; }
    if (persons.length > 0) setModal({ title, persons });
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F0F9FF] font-black text-slate-950 p-4 md:p-12 pb-32">
      {modal && <AbsentModal title={modal.title} persons={modal.persons} onClose={() => setModal(null)}/>}

      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* HEADER */}
        <div className="bg-slate-950 rounded-[3rem] p-8 md:p-14 border-b-[12px] border-[#fbbf24] shadow-2xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#fbbf24]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10 w-20 h-20 md:w-32 md:h-32 bg-white rounded-[2rem] flex items-center justify-center text-4xl md:text-6xl shadow-xl border-4 border-[#fbbf24] shrink-0">👤</div>
          <div className="text-center md:text-left flex-1 z-10 min-w-0">
            <div className="inline-block px-4 py-1.5 bg-[#fbbf24] text-slate-950 text-[10px] font-black uppercase rounded-lg mb-3 tracking-[0.2em]">Educational Staff</div>
            <h1 className="text-2xl md:text-5xl italic uppercase font-black text-white tracking-tighter leading-none mb-3 break-words">{user['Name (ALL CAPITAL)'] || user.Name || user.username}</h1>
            <p className="text-slate-400 text-[10px] md:text-xs uppercase font-black tracking-[0.3em]">ID: <span className="text-[#fbbf24]">{user.Staff_ID || user.ID || "—"}</span><span className="mx-3 opacity-30">|</span>Status: <span className="text-white">Authorized</span></p>
          </div>
          <button onClick={handleLogout} className="relative z-50 px-6 py-3 bg-rose-600 text-white text-[10px] md:text-xs font-black uppercase rounded-2xl border-b-4 border-rose-900 active:scale-95 transition-all shrink-0 shadow-xl hover:bg-rose-700">Logout ⏻</button>
        </div>

        {/* ATTENDANCE DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl relative overflow-hidden h-full flex flex-col">
               <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-4">Today's Attendance</h3>
               {loadingAtt ? (
                 <div className="animate-pulse h-20 bg-slate-100 rounded-xl"></div>
               ) : att ? (
                 <div className="space-y-4 flex-1">
                   <div className="flex items-center gap-4 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors" onClick={() => openAbsentModal('student')}>
                     <svg width="44" height="44" viewBox="0 0 36 36" className="-rotate-90 shrink-0">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4"/>
                        <circle cx="18" cy="18" r="14" fill="none" stroke={COLOR[att.school?.color||'green']} strokeWidth="4" strokeDasharray={`${((att.school?.pct||100)/100*87.96).toFixed(1)} 87.96`} strokeLinecap="round"/>
                        <text x="18" y="21" textAnchor="middle" fill={COLOR[att.school?.color||'green']} fontSize="8" fontWeight="900" transform="rotate(90,18,18)">{att.school?.pct||100}%</text>
                     </svg>
                     <div className="flex-1">
                        <p className="text-xs font-black text-slate-950">🎓 Students</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5"><span className="text-emerald-500">{att.school?.present} In</span> · <span className="text-rose-500">{att.school?.absent} Out</span></p>
                     </div>
                   </div>
                   <div className="flex items-center gap-4 pt-4 border-t border-slate-100 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors" onClick={() => openAbsentModal('staff')}>
                     <svg width="44" height="44" viewBox="0 0 36 36" className="-rotate-90 shrink-0">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4"/>
                        <circle cx="18" cy="18" r="14" fill="none" stroke={COLOR[att.staff?.color||'green']} strokeWidth="4" strokeDasharray={`${((att.staff?.pct||100)/100*87.96).toFixed(1)} 87.96`} strokeLinecap="round"/>
                        <text x="18" y="21" textAnchor="middle" fill={COLOR[att.staff?.color||'green']} fontSize="8" fontWeight="900" transform="rotate(90,18,18)">{att.staff?.pct||100}%</text>
                     </svg>
                     <div className="flex-1">
                        <p className="text-xs font-black text-slate-950">👔 Staff</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5"><span className="text-emerald-500">{att.staff?.present} In</span> · <span className="text-rose-500">{att.staff?.absent} Out</span></p>
                     </div>
                   </div>
                   {att.classes?.some(c => c.absent > 0 || c.pending > 0) && (
                     <div className="pt-4 border-t border-slate-100">
                        <p className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-3">By Class Absences</p>
                        <div className="flex flex-wrap gap-2">
                           {att.classes.filter(c => c.absent > 0 || c.pending > 0).map((c,i) => (
                             <button key={i} onClick={() => openAbsentModal(c.grade || 'Unknown')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all hover:opacity-80 ${c.color==='red'?'bg-rose-100 text-rose-700':c.color==='yellow'?'bg-amber-100 text-amber-700':'bg-emerald-100 text-emerald-700'}`}>
                               {c.grade} · {c.absent > 0 ? `${c.absent} Abs` : `${c.pending} Pen`}
                             </button>
                           ))}
                        </div>
                     </div>
                   )}
                 </div>
               ) : <p className="text-xs text-slate-400 italic">Data unavailable</p>}
            </div>
          </div>

          <div className="md:col-span-2 bg-slate-950 rounded-[2rem] p-6 border-b-[8px] border-[#fbbf24] shadow-xl text-white flex flex-col min-h-[300px]">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-[10px] uppercase tracking-widest text-[#fbbf24] font-black">Student Attendance (Last 30 Days)</h3>
               <span className="text-[9px] bg-white/10 px-3 py-1 rounded-full text-slate-300">Daily Breakdown</span>
            </div>
            <div className="flex-1 flex items-end gap-1 relative">
              {loadingAtt ? (
                 <div className="w-full h-full flex items-center justify-center text-[10px] text-white/50">Loading chart...</div>
              ) : trend.length === 0 ? (
                 <div className="w-full h-full flex items-center justify-center text-[10px] text-white/50">No data available</div>
              ) : (
                 trend.map((t, i) => (
                   <div key={i} className="group relative flex-1 flex flex-col items-center justify-end h-full">
                     <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-white text-slate-950 text-[9px] py-1.5 px-3 rounded-lg font-black whitespace-nowrap z-20 pointer-events-none transition-opacity shadow-xl">
                        {t.label}: {t.pct}% ({t.absent} absent)
                     </div>
                     <div className="w-full bg-[#fbbf24] rounded-t-sm transition-all duration-500 hover:bg-amber-300" style={{height: `${Math.max(t.pct, 5)}%`, opacity: t.pct<90?0.6:1}}></div>
                   </div>
                 ))
              )}
            </div>
            <div className="flex justify-between mt-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">
              <span>30 Days Ago</span><span>Today</span>
            </div>
          </div>
        </div>

        {/* TOOL GROUPS */}
        <div className="space-y-12 pt-4">
          {toolGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-6">
              <h2 className="text-base md:text-xl uppercase border-l-8 border-slate-950 pl-4 tracking-tight text-slate-950">{group.group}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {group.items.map((tool, i) => {
                  const locked = tool.perm ? !hasPerm(user, tool.perm) : false;
                  return (
                    <button key={i} onClick={() => !locked && router.push(tool.path)} className={`relative group p-6 md:p-8 rounded-[2rem] border-b-[8px] transition-all duration-300 flex flex-col items-center text-center gap-4 shadow-lg ${locked ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed' : 'bg-white border-slate-100 hover:border-[#fbbf24] hover:-translate-y-1 active:scale-95'}`}>
                      <span className={`text-4xl md:text-5xl transition-transform duration-300 ${!locked && 'group-hover:scale-110'}`}>{tool.icon}</span>
                      <div><h3 className={`text-[11px] md:text-sm font-black uppercase italic tracking-tight leading-tight ${locked ? 'text-slate-400' : 'text-slate-950'}`}>{tool.name}</h3></div>
                      {locked && <div className="absolute top-4 right-4 text-slate-400 text-sm opacity-50">🔒</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        body { background-color: #F0F9FF; font-weight: 900 !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}