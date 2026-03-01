"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

export default function LeaveHub() {
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proc, setProc] = useState(false);
  const [tab, setTab] = useState("QUEUE");
  // Analysis filters
  const [rangeFilter, setRangeFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const router = useRouter();

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || "null");
    if (!auth || auth.userRole !== 'management') { router.push('/login'); return; }

    const fetchLeaves = async () => {
      try {
        const res = await fetch(WEB_APP_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'getInitialData' })
        });
        const result = await res.json();
        if (result.success) setAllLeaves(result.leaves || []);
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    };
    fetchLeaves();
  }, [router]);

  const handleAction = async (leave, status) => {
    const gm = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || "{}");
    if (!gm.Name) return alert("Session Expired. Please Login Again.");
    setProc(true);
    try {
      const d = new Date(leave.Start_Date);
      const cleanDate = d.toLocaleDateString('en-CA');
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'updateLeave',
          userId: leave.User_ID,
          name: leave.Name,
          startDate: cleanDate,
          status,
          approvedBy: gm.Name
        })
      });
      const result = await res.json();
      if (result.success) {
        setAllLeaves(prev => prev.map(l =>
          l.User_ID === leave.User_ID && l.Start_Date === leave.Start_Date
            ? { ...l, Status: status, Approved_By: gm.Name }
            : l
        ));
      } else {
        alert("FAIL: " + result.message);
      }
    } catch (e) {
      alert("Network Error");
    } finally { setProc(false); }
  };

  // ── Derived data ──────────────────────────────────────────────
  const pending = allLeaves.filter(x => x.Status === "Pending");
  const history = allLeaves.filter(x => x.Status !== "Pending");

  // Analysis: filter by time range
  const now = new Date();
  const analysisLeaves = allLeaves.filter(l => {
    if (rangeFilter === "7D") {
      return (now - new Date(l.Start_Date)) / 86400000 <= 7;
    } else if (rangeFilter === "30D") {
      return (now - new Date(l.Start_Date)) / 86400000 <= 30;
    } else if (rangeFilter === "90D") {
      return (now - new Date(l.Start_Date)) / 86400000 <= 90;
    }
    return true; // ALL
  }).filter(l => typeFilter === "ALL" || l.User_Type === typeFilter);

  // Top leave takers
  const leaveCounts = analysisLeaves.reduce((acc, l) => {
    const key = l.Name || "Unknown";
    if (!acc[key]) acc[key] = { name: key, type: l.User_Type, count: 0, days: 0 };
    acc[key].count += 1;
    acc[key].days += Number(l.Total_Days || 1);
    return acc;
  }, {});
  const topLeaves = Object.values(leaveCounts).sort((a, b) => b.days - a.days).slice(0, 10);

  // Leave type breakdown
  const leaveTypeCount = analysisLeaves.reduce((acc, l) => {
    const t = l.Leave_Type || "Other";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const leaveTypes = Object.entries(leaveTypeCount).sort((a, b) => b[1] - a[1]);
  const maxTypeCount = leaveTypes[0]?.[1] || 1;

  // Monthly trend (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const count = allLeaves.filter(l => {
      const ld = new Date(l.Start_Date);
      return ld.getFullYear() === d.getFullYear() && ld.getMonth() === d.getMonth();
    }).length;
    return { label, count };
  });
  const maxMonthCount = Math.max(...monthlyData.map(m => m.count), 1);

  const TABS = [
    { id: "QUEUE",    label: "Queue",    badge: pending.length },
    { id: "ANALYSIS", label: "Analysis", badge: null },
    { id: "HISTORY",  label: "History",  badge: history.length },
  ];

  if (loading || proc) return (
    <div className="min-h-[50vh] flex items-center justify-center font-black text-[#4c1d95] animate-pulse uppercase italic tracking-widest text-lg">
      {proc ? "Processing..." : "Loading Leave Hub..."}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F9FF] font-black text-slate-950 p-4 md:p-10 pb-36">
      <div className="max-w-[1000px] mx-auto space-y-8">

        {/* ── HEADER ── */}
        <div className="bg-slate-950 rounded-[2.5rem] p-7 md:p-10 border-b-[10px] border-[#fbbf24] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-56 h-56 bg-[#fbbf24]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
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
              <p className="text-[8px] uppercase tracking-widest text-slate-400 font-black">Total Records</p>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2
                ${tab === t.id ? 'bg-slate-950 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'}`}
            >
              {t.label}
              {t.badge !== null && t.badge > 0 && (
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black ${tab === t.id ? 'bg-[#fbbf24] text-slate-950' : 'bg-slate-100 text-slate-500'}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════ */}
        {/* TAB 1 — QUEUE                                 */}
        {/* ══════════════════════════════════════════════ */}
        {tab === "QUEUE" && (
          <div className="space-y-5">
            {pending.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-6xl mb-4">✅</p>
                <p className="font-black uppercase italic text-slate-300 text-xl tracking-widest">Queue Empty</p>
              </div>
            ) : pending.map((l, i) => (
              <div key={i} className="bg-white p-6 rounded-[2.5rem] border-b-[10px] border-slate-200 shadow-xl space-y-4 hover:border-[#fbbf24] transition-all">
                <div className="flex justify-between items-center">
                  <span className="bg-amber-100 text-amber-700 text-[8px] px-3 py-1 rounded-full font-black uppercase">{l.User_Type}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase">{l.Date_Applied}</span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                    {l.User_Type === "STUDENT" ? "🎓" : "👔"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-black italic uppercase text-slate-950 leading-none truncate">{l.Name}</h3>
                    <p className="text-[9px] text-slate-400 font-black uppercase mt-1">ID: {l.User_ID} · {l.Leave_Type}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-black text-slate-950">{l.Total_Days}</p>
                    <p className="text-[8px] uppercase text-slate-400 font-black">days</p>
                  </div>
                </div>
                <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 text-sm italic text-slate-600">
                  "{l.Reason}"
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase">
                  📅 {l.Start_Date} → {l.End_Date}
                  {l.Reporter_Name && l.Reporter_Name !== "-" && (
                    <span className="ml-3">· By: {l.Reporter_Name} ({l.Relationship}) {l.Phone}</span>
                  )}
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleAction(l, "Approved")}
                    className="py-4 bg-emerald-500 text-white rounded-[1.5rem] font-black uppercase shadow-lg border-b-4 border-emerald-800 active:scale-95 transition-all hover:bg-emerald-600"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleAction(l, "Rejected")}
                    className="py-4 bg-rose-500 text-white rounded-[1.5rem] font-black uppercase shadow-lg border-b-4 border-rose-800 active:scale-95 transition-all hover:bg-rose-600"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* TAB 2 — ANALYSIS                              */}
        {/* ══════════════════════════════════════════════ */}
        {tab === "ANALYSIS" && (
          <div className="space-y-8">

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex bg-white p-1 rounded-xl border border-slate-100 gap-1">
                {["ALL","7D","30D","90D"].map(r => (
                  <button key={r} onClick={() => setRangeFilter(r)}
                    className={`px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all
                      ${rangeFilter === r ? 'bg-slate-950 text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                    {r === "ALL" ? "All Time" : r === "7D" ? "7 Days" : r === "30D" ? "30 Days" : "90 Days"}
                  </button>
                ))}
              </div>
              <div className="flex bg-white p-1 rounded-xl border border-slate-100 gap-1">
                {["ALL","STUDENT","STAFF"].map(t => (
                  <button key={t} onClick={() => setTypeFilter(t)}
                    className={`px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all
                      ${typeFilter === t ? 'bg-slate-950 text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Leaves", value: analysisLeaves.length, icon: "📋", color: "border-indigo-300 bg-indigo-50" },
                { label: "Total Days",   value: analysisLeaves.reduce((s,l) => s + Number(l.Total_Days||1), 0), icon: "📅", color: "border-blue-300 bg-blue-50" },
                { label: "Approved",     value: analysisLeaves.filter(l=>l.Status==="Approved").length, icon: "✅", color: "border-emerald-300 bg-emerald-50" },
              ].map((s,i) => (
                <div key={i} className={`${s.color} p-5 rounded-[2rem] border-b-[6px] shadow-md flex flex-col items-center gap-2`}>
                  <span className="text-2xl">{s.icon}</span>
                  <p className="text-2xl md:text-3xl font-black text-slate-950 leading-none">{s.value}</p>
                  <p className="text-[8px] uppercase tracking-widest font-black text-slate-500 text-center">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Monthly Trend Bar Chart */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border-b-[8px] border-slate-200 shadow-xl">
              <h3 className="text-xs uppercase tracking-[0.3em] font-black text-slate-400 mb-6">Monthly Trend (6 Months)</h3>
              <div className="flex items-end gap-3 h-32">
                {monthlyData.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <p className="text-[9px] font-black text-slate-600">{m.count > 0 ? m.count : ""}</p>
                    <div className="w-full rounded-t-xl bg-slate-950 transition-all duration-500"
                      style={{ height: `${Math.max((m.count / maxMonthCount) * 96, m.count > 0 ? 8 : 4)}px` }} />
                    <p className="text-[8px] uppercase font-black text-slate-400">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Leave Type Breakdown */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border-b-[8px] border-slate-200 shadow-xl">
              <h3 className="text-xs uppercase tracking-[0.3em] font-black text-slate-400 mb-6">Leave Type Breakdown</h3>
              {leaveTypes.length === 0 ? (
                <p className="text-center text-slate-300 italic py-8">No data</p>
              ) : (
                <div className="space-y-4">
                  {leaveTypes.map(([type, count], i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-black text-slate-700 uppercase italic truncate pr-4">{type}</span>
                        <span className="text-sm font-black text-slate-950 shrink-0">{count}</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-950 rounded-full transition-all duration-700"
                          style={{ width: `${(count / maxTypeCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Leave Takers */}
            <div className="bg-slate-950 p-6 md:p-8 rounded-[2.5rem] border-b-[8px] border-[#fbbf24] shadow-2xl">
              <h3 className="text-xs uppercase tracking-[0.3em] font-black text-[#fbbf24] mb-6 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#fbbf24] rounded-full" />
                Top Leave Takers
              </h3>
              {topLeaves.length === 0 ? (
                <p className="text-center text-white/20 italic py-8 uppercase text-sm">No data in selected range</p>
              ) : (
                <div className="space-y-3">
                  {topLeaves.map((person, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className={`text-lg font-black shrink-0 ${i === 0 ? 'text-[#fbbf24]' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-white/30'}`}>
                          #{i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-white font-black uppercase italic text-sm truncate">{person.name}</p>
                          <p className="text-[8px] uppercase font-black text-slate-500 mt-0.5">{person.type}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[#fbbf24] font-black text-lg leading-none">{person.days}</p>
                        <p className="text-[8px] uppercase font-black text-slate-500">days · {person.count}x</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* TAB 3 — HISTORY                               */}
        {/* ══════════════════════════════════════════════ */}
        {tab === "HISTORY" && (
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="py-24 text-center">
                <p className="font-black uppercase italic text-slate-300 text-xl tracking-widest">No history yet</p>
              </div>
            ) : history.slice().reverse().map((l, i) => (
              <div key={i} className="bg-white p-5 rounded-[2rem] border-b-[6px] border-slate-100 shadow-md flex items-center gap-4">
                <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-lg
                  ${l.Status === "Approved" ? "bg-emerald-100" : "bg-rose-100"}`}>
                  {l.Status === "Approved" ? "✅" : "❌"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black uppercase italic text-sm text-slate-950 truncate">{l.Name}</p>
                  <p className="text-[9px] uppercase font-black text-slate-400 mt-0.5">
                    {l.Leave_Type} · {l.Total_Days} days · {l.Start_Date}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className={`text-[8px] px-3 py-1 rounded-full font-black uppercase
                    ${l.Status === "Approved" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {l.Status}
                  </span>
                  {l.Approved_By && l.Approved_By !== "-" && (
                    <p className="text-[7px] text-slate-400 font-black uppercase mt-1">by {l.Approved_By}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}