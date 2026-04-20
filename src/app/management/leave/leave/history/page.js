"use client";
import { useState, useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import useLeaveData from '@/hooks/useLeaveData';
import DurationBadge from '@/components/leave/DurationBadge';
import { formatDateDisplay, formatMMDate, getTodayMM } from '@/components/leave/DateHelpers';

export default function HistoryPage() {
  const { allLeaves, loading } = useLeaveData();
  const [histSearchRaw, setHistSearchRaw] = useState('');
  const [histSearch] = useDebounce(histSearchRaw, 300);
  const [histFilter, setHistFilter] = useState('ALL');
  const today = getTodayMM();

  const history = useMemo(() => {
    return allLeaves.filter(l => 
      l.Status !== 'Pending' && 
      l.Start_Date <= today
    );
  }, [allLeaves, today]);

  const expandedHistory = useMemo(() => {
    const expanded = [];
    history.forEach(leave => {
      const start = formatMMDate(leave.Start_Date);
      const end = formatMMDate(leave.End_Date || leave.Start_Date);
      const maxEnd = end > today ? today : end;
      let current = new Date(start);
      const last = new Date(maxEnd);
      while (current <= last) {
        const dateStr = current.toLocaleDateString('en-CA',{timeZone:'Asia/Yangon'});
        expanded.push({
          ...leave,
          displayDate: dateStr,
          originalStart: start,
          originalEnd: end
        });
        current.setDate(current.getDate() + 1);
      }
    });
    return expanded;
  }, [history, today]);

  const filteredHistory = useMemo(() => {
    return expandedHistory.filter(item => {
      const matchSearch = (item.Name || '').toLowerCase().includes(histSearch.toLowerCase());
      const matchType = histFilter === 'ALL' || item.User_Type === histFilter;
      return matchSearch && matchType;
    });
  }, [expandedHistory, histSearch, histFilter]);

  const groupedHistory = useMemo(() => {
    const groups = {};
    filteredHistory.forEach(item => {
      const date = item.displayDate;
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  }, [filteredHistory]);

  const sortedHistoryDates = useMemo(() => {
    return Object.keys(groupedHistory).sort((a, b) => new Date(b) - new Date(a));
  }, [groupedHistory]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-4xl text-amber-500 animate-pulse">⌛ Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          placeholder="Search by name..."
          value={histSearchRaw}
          onChange={e => setHistSearchRaw(e.target.value)}
          className="flex-1 min-w-[200px] bg-white border border-slate-200 rounded-full px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-200"
        />
        <select
          value={histFilter}
          onChange={e => setHistFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-full px-4 py-2 text-sm font-black uppercase outline-none focus:ring-2 focus:ring-amber-200"
        >
          <option value="ALL">All</option>
          <option value="STUDENT">Students</option>
          <option value="STAFF">Staff</option>
        </select>
      </div>

      {sortedHistoryDates.length === 0 ? (
        <div className="py-20 text-center text-slate-300 italic text-2xl font-black">No records found</div>
      ) : (
        sortedHistoryDates.map(date => (
          <div key={date} className="space-y-2">
            <div className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 py-2 px-4 rounded-full shadow-sm border border-slate-100 inline-block">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                📅 {formatDateDisplay(date)} · {groupedHistory[date].length} ဦး
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {groupedHistory[date].map((item, idx) => (
                <div
                  key={idx}
                  className={`bg-white p-4 rounded-2xl border-l-8 shadow-md hover:shadow-lg transition-all ${
                    item.Status === 'Approved' ? 'border-emerald-400' : item.Status === 'AWOL' ? 'border-orange-500' : 'border-rose-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                        item.User_Type === 'STUDENT' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.User_Type}
                      </span>
                      <DurationBadge leave={item} />
                    </div>
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${
                      item.Status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : item.Status === 'AWOL' ? 'bg-orange-100 text-orange-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {item.Status}
                    </span>
                  </div>
                  <h4 className="font-black text-slate-900 text-base uppercase leading-tight mb-1">{item.Name}</h4>
                  <p className="text-[9px] text-slate-400 font-bold mb-2">ID: {item.User_ID} · {item.Leave_Type}</p>
                  <div className="bg-slate-50 p-2 rounded-lg text-[11px] italic text-slate-600 line-clamp-2 mb-2">
                    "{item.Reason || '—'}"
                  </div>
                  {item.Remark && item.Remark !== '-' && item.Remark !== '' && (
                    <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg text-[11px] text-amber-700 font-bold mb-2 flex items-start gap-1.5">
                      <span className="shrink-0">✏️</span>
                      <span>{item.Remark}</span>
                    </div>
                  )}
                  {item.Attachment_Link && item.Attachment_Link !== '-' && (
                    <a href={item.Attachment_Link} target="_blank" className="text-[9px] text-sky-500 underline font-black inline-block">
                      📎 Attachment
                    </a>
                  )}
                  {item.originalStart !== item.originalEnd && (
                    <p className="text-[8px] text-slate-400 mt-2 border-t border-slate-100 pt-1">
                      📅 {formatDateDisplay(item.originalStart)} – {formatDateDisplay(item.originalEnd)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}