"use client";
import { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { formatDateDisplay, formatMMDate, getTodayMM } from '@/components/leave/DateHelpers';
import CompactWatchlistFilter from '@/components/leave/CompactWatchlistFilter';
import StatCard from '@/components/leave/StatCard';
import GradeBreakdown from '@/components/leave/GradeBreakdown';

export default function StaffAnalysisTab({ statsList, allLeaves, loading }) {
  const [watchFilter, setWatchFilter] = useState("CONSECUTIVE_3");
  const [rangeFilter, setRangeFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [calDate, setCalDate] = useState(new Date());
  const [selectedCalDate, setSelectedCalDate] = useState(null);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [searchQuery] = useDebounce(historySearchQuery, 300);

  // Watch groups (full version)
  const watchGroups = useMemo(() => {
    const getTodayAbsentUsers = statsList.filter(u => u.isAbsentToday);
    return {
      'TODAY': { title: 'ယနေ့ ပျက်သူ', users: getTodayAbsentUsers, icon: '📍', color: 'text-sky-600' },
      'CONSECUTIVE_2': { title: '၂ ရက်ဆက်တိုက်', users: statsList.filter(u => u.consecutiveMax >= 2 && u.consecutiveMax < 3), icon: '⚠️', color: 'text-amber-600' },
      'CONSECUTIVE_3': { title: '၃ ရက်ဆက်တိုက်', users: statsList.filter(u => u.consecutiveMax >= 3 && u.consecutiveMax < 5), icon: '🔥', color: 'text-orange-600' },
      'CONSECUTIVE_5': { title: '၅ ရက်ဆက်တိုက်', users: statsList.filter(u => u.consecutiveMax >= 5), icon: '🚨', color: 'text-rose-600' },
      'WEEK_3': { title: '၁ ပတ် (≥၃ ရက်)', users: statsList.filter(u => u.weekCount >= 3), icon: '📅', color: 'text-indigo-600' },
      'MONTH_3': { title: '၁ လ (≥၃ ရက်)', users: statsList.filter(u => u.monthCount >= 3), icon: '📆', color: 'text-purple-600' },
      'ALL_5': { title: 'All Time (≥၅ ရက်)', users: statsList.filter(u => u.totalDays >= 5), icon: '🏆', color: 'text-slate-600' }
    };
  }, [statsList]);

  const watchTabs = useMemo(() => [
    { id: 'TODAY', label: 'ယနေ့', count: watchGroups['TODAY'].users.length },
    { id: 'CONSECUTIVE_2', label: '၂ ရက်ဆက်', count: watchGroups['CONSECUTIVE_2'].users.length },
    { id: 'CONSECUTIVE_3', label: '၃ ရက်ဆက်', count: watchGroups['CONSECUTIVE_3'].users.length },
    { id: 'CONSECUTIVE_5', label: '≥၅ ရက်ဆက်', count: watchGroups['CONSECUTIVE_5'].users.length },
    { id: 'WEEK_3', label: '၁ ပတ် (၃)', count: watchGroups['WEEK_3'].users.length },
    { id: 'MONTH_3', label: '၁ လ (၃)', count: watchGroups['MONTH_3'].users.length },
    { id: 'ALL_5', label: 'All Time (၅)', count: watchGroups['ALL_5'].users.length }
  ], [watchGroups]);

  // Calendar cells (useMemo)
  const calCells = useMemo(() => {
    const cYear = calDate.getFullYear();
    const cMonth = calDate.getMonth();
    const daysInMonth = new Date(cYear, cMonth + 1, 0).getDate();
    const firstDay = new Date(cYear, cMonth, 1).getDay();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = `${cYear}-${String(cMonth+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
      const count = allLeaves.filter(l => l.Status === 'Approved' && formatMMDate(l.Start_Date) <= dStr && (formatMMDate(l.End_Date) || formatMMDate(l.Start_Date)) >= dStr).length;
      cells.push({ day: i, dateStr: dStr, total: count });
    }
    return cells;
  }, [calDate, allLeaves]);

  // Stats cards data (filtered by range & type)
  const analysisLeaves = useMemo(() => {
    const now = new Date();
    return allLeaves.filter(l => {
      const days = (now - new Date(formatMMDate(l.Start_Date))) / 86400000;
      if (rangeFilter === "7D") return days <= 7;
      if (rangeFilter === "30D") return days <= 30;
      if (rangeFilter === "90D") return days <= 90;
      return true;
    }).filter(l => typeFilter === "ALL" || l.User_Type === typeFilter);
  }, [allLeaves, rangeFilter, typeFilter]);

  // Individual search (debounced)
  const searchedUsers = useMemo(() => {
    if (searchQuery.trim().length < 2) return [];
    const q = searchQuery.toLowerCase();
    return statsList.filter(u => u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
  }, [statsList, searchQuery]);

  const prevMonth = () => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1));
  const nextMonth = () => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1));

  if (loading) return <div className="text-center py-10 text-slate-400">Loading analysis...</div>;

  return (
    <div className="space-y-6">
      {/* Calendar View */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200">‹</button>
          <div className="text-center">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
              {new Date(calDate.getFullYear(), calDate.getMonth()).toLocaleString('default', { month: 'long' })} {calDate.getFullYear()}
            </h3>
          </div>
          <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="text-[8px] font-black uppercase text-slate-400">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calCells.map((cell, idx) => {
            if (!cell) return <div key={idx} className="aspect-square bg-slate-50 rounded-lg opacity-50"/>;
            const isToday = cell.dateStr === getTodayMM();
            return (
              <button
                key={idx}
                onClick={() => cell.total > 0 && setSelectedCalDate(cell.dateStr)}
                className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-center text-xs transition-all border ${
                  isToday ? 'bg-sky-600 text-white border-sky-800 shadow-md scale-105 z-10' :
                  cell.total > 0 ? 'bg-rose-50 border-rose-200 hover:bg-rose-100' : 'bg-slate-50 border-slate-100 hover:bg-white'
                }`}
              >
                <span className={`font-black text-[10px] ${isToday ? 'text-white' : cell.total > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{cell.day}</span>
                {cell.total > 0 && <span className={`text-[7px] font-black ${isToday ? 'text-white/80' : 'text-rose-500'}`}>{cell.total}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Leaves" value={analysisLeaves.length} subtitle="All leaves" icon="📋" color="blue" trend="Filtered" />
        <StatCard title="Total Days" value={analysisLeaves.reduce((s,l)=>s+Number(l.Total_Days||0),0)} subtitle="Sum of days" icon="📅" color="amber" trend="Filtered" />
        <StatCard title="Approved" value={analysisLeaves.filter(l=>l.Status==='Approved').length} subtitle="Approved leaves" icon="✅" color="green" trend="Filtered" />
        <StatCard title="Staff/Student" value={`${analysisLeaves.filter(l=>l.User_Type==='STAFF').length}/${analysisLeaves.filter(l=>l.User_Type==='STUDENT').length}`} subtitle="Staff / Student" icon="👥" color="purple" trend="Filtered" />
      </div>

      {/* Range & Type Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex bg-white p-1 rounded-xl border border-slate-100 gap-1 flex-1 min-w-[180px]">
          {["ALL","7D","30D","90D"].map(r=>(
            <button key={r} onClick={()=>setRangeFilter(r)} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${rangeFilter===r?'bg-slate-900 text-white':'bg-transparent text-slate-500'}`}>{r}</button>
          ))}
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-100 gap-1 flex-1 min-w-[180px]">
          {["ALL","STUDENT","STAFF"].map(t=>(
            <button key={t} onClick={()=>setTypeFilter(t)} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${typeFilter===t?'bg-amber-400 text-slate-900':'bg-transparent text-slate-500'}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Attendance Watchlist with CompactFilter */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-2 h-8 bg-amber-500 rounded-full shadow-lg" />
          <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Attendance Watchlist</h3>
        </div>
        <div className="flex items-center justify-between mb-4">
          <CompactWatchlistFilter tabs={watchTabs} activeId={watchFilter} onSelect={setWatchFilter} />
          <span className="text-xs text-slate-400 font-black">{watchGroups[watchFilter]?.users.length || 0} individuals</span>
        </div>
        {watchGroups[watchFilter] && (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {watchGroups[watchFilter].users.length === 0 ? (
              <p className="text-center text-slate-400 italic py-8">စာရင်းမရှိပါ</p>
            ) : (
              watchGroups[watchFilter].users.map((u, i) => (
                <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-slate-900">{u.name}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className="text-[8px] bg-white px-2 py-0.5 rounded-full">ID: {u.id}</span>
                        <span className="text-[8px] px-2 py-0.5 rounded-full bg-indigo-100">{u.type}</span>
                        {u.grade && <span className="text-[8px] px-2 py-0.5 rounded-full bg-sky-100">G-{u.grade}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-amber-600">{u.totalDays}d</p>
                      <p className="text-[7px] text-slate-400 uppercase">total</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-white p-1.5 rounded-lg text-center">
                      <p className="text-xs font-black text-rose-600">{u.consecutiveMax || 0}</p>
                      <p className="text-[6px] text-slate-400 uppercase">Max Consec</p>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg text-center">
                      <p className="text-xs font-black text-amber-600">{u.weekCount || 0}</p>
                      <p className="text-[6px] text-slate-400 uppercase">This Week</p>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg text-center">
                      <p className="text-xs font-black text-emerald-600">{u.monthCount || 0}</p>
                      <p className="text-[6px] text-slate-400 uppercase">This Month</p>
                    </div>
                  </div>
                  {u.reasons?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <p className="text-[8px] text-slate-400 font-black uppercase mb-1">နောက်ဆုံးခွင့်:</p>
                      <p className="text-[10px] text-slate-600 italic">"{u.reasons[0].text?.substring(0, 80)}"</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Individual Search */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <p className="text-xs font-black text-sky-600 uppercase tracking-wide mb-3">🔍 တစ်ဦးချင်း ရှာဖွေရန်</p>
        <input
          value={historySearchQuery}
          onChange={e => setHistorySearchQuery(e.target.value)}
          placeholder="နာမည် သို့မဟုတ် ID ရိုက်ထည့်ပါ..."
          className="w-full bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-200"
        />
        {searchQuery.trim().length >= 2 && (
          <div className="mt-4 max-h-80 overflow-y-auto space-y-2">
            {searchedUsers.length === 0 ? (
              <p className="text-center text-slate-400 italic py-4">မတွေ့ပါ။</p>
            ) : (
              searchedUsers.map((u, i) => (
                <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-slate-900">{u.name}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[8px] bg-white px-2 py-0.5 rounded-full">ID: {u.id}</span>
                        <span className="text-[8px] px-2 py-0.5 rounded-full bg-indigo-100">{u.type}</span>
                        {u.grade && <span className="text-[8px] px-2 py-0.5 rounded-full bg-sky-100">G-{u.grade}</span>}
                      </div>
                    </div>
                    <span className="text-sm font-black text-amber-600">{u.totalDays}d</span>
                  </div>
                  {u.reasons?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <p className="text-[8px] text-slate-400 font-black uppercase mb-1">နောက်ဆုံးခွင့်:</p>
                      <p className="text-[10px] text-slate-600 italic">"{u.reasons[0].text?.substring(0, 80)}"</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Calendar Modal (for showing absentees on a specific day) */}
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
            <div className="overflow-y-auto pr-2 space-y-3 flex-1">
              {allLeaves.filter(l => l.Status === 'Approved' && formatMMDate(l.Start_Date) <= selectedCalDate && (formatMMDate(l.End_Date) || formatMMDate(l.Start_Date)) >= selectedCalDate).map((l, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-lg">{l.User_Type==='STUDENT'?'🎓':'👔'}</div>
                      <div>
                        <p className="font-black text-slate-900 text-[15px] m-0">{l.Name}</p>
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
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}