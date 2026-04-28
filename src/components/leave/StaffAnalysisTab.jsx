"use client";
import { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { formatDateDisplay } from '@/components/leave/DateHelpers';

export default function StaffAnalysisTab({ statsList, loading }) {
  const [watchFilter, setWatchFilter] = useState("CONSECUTIVE_3");
  const [searchRaw, setSearchRaw] = useState("");
  const [searchQuery] = useDebounce(searchRaw, 300);

  const searchedUsers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return statsList.filter(u => 
      u.name.toLowerCase().includes(q) || 
      u.id.toLowerCase().includes(q)
    );
  }, [statsList, searchQuery]);

  const watchGroups = useMemo(() => ({
    'CONSECUTIVE_3': {
      title: '၃ ရက်ဆက်တိုက် ပျက်သူများ',
      users: statsList.filter(u => u.consecutiveMax >= 3),
      icon: '🔥',
      color: 'text-orange-600'
    },
    'CONSECUTIVE_5': {
      title: '၅ ရက်ဆက်တိုက် ပျက်သူများ',
      users: statsList.filter(u => u.consecutiveMax >= 5),
      icon: '🚨',
      color: 'text-rose-600'
    },
    'WEEK_2PLUS': {
      title: '၁ ပတ်အတွင်း ၂ ရက်နှင့်အထက်',
      users: statsList.filter(u => u.weekCount >= 2),
      icon: '📊',
      color: 'text-emerald-600'
    },
    'MONTH_3PLUS': {
      title: '၁ လအတွင်း ၃ ရက်နှင့်အထက်',
      users: statsList.filter(u => u.monthCount >= 3),
      icon: '📈',
      color: 'text-blue-600'
    }
  }), [statsList]);

  if (loading) {
    return <div className="text-center py-10 text-slate-400">Loading analysis...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Individual Search */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <p className="text-xs font-black text-sky-600 uppercase tracking-wide mb-3">
          🔍 တစ်ဦးချင်း ရှာဖွေရန်
        </p>
        <input
          value={searchRaw}
          onChange={e => setSearchRaw(e.target.value)}
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
                      <div className="text-[10px] text-slate-600 italic space-y-1">
                        {u.reasons.slice(0, 2).map((r, ri) => (
                          <div key={ri} className="bg-white/60 p-1.5 rounded-lg">
                            <p className="text-slate-700">"{r.text}"</p>
                            {r.remark && r.remark !== '-' && r.remark !== '' && (
                              <p className="text-amber-600 text-[9px] font-bold mt-0.5">✏️ {r.remark}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Watchlist Tabs */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 bg-amber-500 rounded-full" />
          <h3 className="text-base font-black uppercase tracking-tight">Attendance Watchlist</h3>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {Object.keys(watchGroups).map(key => (
            <button
              key={key}
              onClick={() => setWatchFilter(key)}
              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${
                watchFilter === key
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {watchGroups[key].title.split(' ')[0]}
              <span className="ml-1 text-[7px]">
                ({watchGroups[key].users.length})
              </span>
            </button>
          ))}
        </div>

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
                    <div className="text-[10px] text-slate-600 italic space-y-1">
                      {u.reasons.slice(0, 2).map((r, ri) => (
                        <div key={ri} className="bg-white/60 p-1.5 rounded-lg">
                          <div className="flex justify-between text-[9px] text-slate-500">
                            <span>{formatDateDisplay(r.start)}</span>
                            <span>{r.type}</span>
                          </div>
                          <p className="text-slate-700 mt-0.5">"{r.text}"</p>
                          {r.remark && r.remark !== '-' && r.remark !== '' && (
                            <p className="text-amber-600 text-[9px] font-bold mt-0.5">✏️ {r.remark}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}