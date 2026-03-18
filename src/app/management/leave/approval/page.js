"use client";
import { useState } from 'react';
import useLeaveData from '@/hooks/useLeaveData';
import DurationBadge from '@/components/leave/DurationBadge';
import { formatDateDisplay, formatMMDate } from '@/components/leave/DateHelpers';
import { WEB_APP_URL } from '@/lib/api';

export default function ApprovalPage() {
  const { allLeaves, pending, loading, fetchLeaves } = useLeaveData();
  const [proc, setProc] = useState(false);
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
    }
    return null;
  });

  const handleAction = async (leave, status) => {
    if (!user?.Name) return alert('Session Expired.');
    if (!confirm(`Are you sure you want to ${status} this request?`)) return;
    setProc(true);
    try {
      const cleanDate = formatMMDate(leave.Start_Date);
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'updateLeave',
          rowIndex: leave._rowIndex,
          userId: leave.User_ID,
          name: leave.Name,
          startDate: cleanDate,
          status,
          approvedBy: user.Name
        })
      });
      const r = await res.json();
      if (r.success) {
        alert(`Request ${status} successfully!`);
        fetchLeaves();
      } else alert('FAIL: ' + r.message);
    } catch {
      alert('Network Error');
    } finally {
      setProc(false);
    }
  };

  if (loading || proc) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="text-2xl text-amber-500 animate-pulse">⌛ Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      {pending.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <p className="text-5xl mb-3">🥂</p>
          <p className="font-black text-slate-400 text-xl">All Caught Up!</p>
        </div>
      ) : (
        pending.map((l, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border-l-8 border-slate-200 shadow-sm hover:shadow-md transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="bg-indigo-50 text-indigo-700 text-[8px] px-2 py-0.5 rounded-full font-black">{l.Category}</span>
                <span className={`text-[8px] px-2 py-0.5 rounded-full font-black ${l.User_Type === 'STUDENT' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                  {l.User_Type}
                </span>
                <DurationBadge leave={l} />
              </div>
              <span className="text-[8px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{formatDateDisplay(l.Date_Applied)}</span>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl shrink-0">
                {l.User_Type === 'STUDENT' ? '🎓' : '👔'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-base uppercase truncate">{l.Name}</h3>
                <p className="text-[9px] text-slate-400">ID: {l.User_ID} · {l.Leave_Type}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-slate-800">{l.Total_Days}d</p>
              </div>
            </div>

            {/* Reason */}
            <div className="bg-slate-50 p-3 rounded-xl text-xs italic text-slate-600 mb-2 line-clamp-2">
              "{l.Reason || '—'}"
            </div>

            {/* Dates & Actions */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-[8px] text-slate-500 bg-white px-2 py-1 rounded-full border border-slate-100">
                📅 {formatDateDisplay(l.Start_Date)}{l.End_Date && formatMMDate(l.End_Date) !== formatMMDate(l.Start_Date) ? ` – ${formatDateDisplay(l.End_Date)}` : ''}
              </p>
              <div className="flex gap-2">
                {l.Attachment_Link && l.Attachment_Link !== '-' && (
                  <a href={l.Attachment_Link} target="_blank" className="text-[8px] text-sky-500 underline">📎</a>
                )}
                <button onClick={() => handleAction(l, 'Approved')} className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[8px] font-black uppercase shadow-sm">✓ Approve</button>
                <button onClick={() => handleAction(l, 'Rejected')} className="px-3 py-1 bg-rose-500 text-white rounded-full text-[8px] font-black uppercase shadow-sm">✗ Decline</button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}