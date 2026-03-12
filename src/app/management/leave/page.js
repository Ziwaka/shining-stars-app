"use client";
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

// ── Helper: days ago ─────────────────────────────────────────────────────────
const daysAgo = (dateStr) => {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  if (isNaN(d)) return Infinity;
  return (Date.now() - d.getTime()) / 86400000;
};

// ── Helper: extract grade from User_ID or Name field ────────────────────────
const extractGrade = (leave) => {
  const uid = String(leave.User_ID || '');
  const m = uid.match(/G(\d+)/i);
  if (m) return `Grade ${m[1]}`;
  const g = String(leave.Grade || leave.grade || '');
  if (g) return g.startsWith('Grade') ? g : `Grade ${g}`;
  return 'Unknown Grade';
};

export default function LeaveHub() {
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [proc,      setProc]      = useState(false);
  const [tab,       setTab]       = useState("QUEUE");
  // Analysis sub-tab
  const [aTab, setATab] = useState("OVERVIEW");
  const router = useRouter();

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || "null");
    if (!auth || auth.userRole !== 'management') { router.push('/login'); return; }
    fetch(WEB_APP_URL, { method:'POST', body:JSON.stringify({ action:'getInitialData' }) })
      .then(r => r.json())
      .then(res => { if (res.success) setAllLeaves(res.leaves || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const handleAction = async (leave, status) => {
    const gm = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || "{}");
    if (!gm.Name) return alert("Session Expired. Please Login Again.");
    setProc(true);
    try {
      const cleanDate = new Date(leave.Start_Date).toLocaleDateString('en-CA');
      const res = await fetch(WEB_APP_URL, {
        method:'POST',
        body:JSON.stringify({ action:'updateLeave', userId:leave.User_ID, name:leave.Name, startDate:cleanDate, status, approvedBy:gm.Name })
      });
      const result = await res.json();
      if (result.success) {
        setAllLeaves(prev => prev.map(l =>
          l.User_ID === leave.User_ID && l.Start_Date === leave.Start_Date
            ? { ...l, Status:status, Approved_By:gm.Name } : l
        ));
      } else { alert("FAIL: " + result.message); }
    } catch { alert("Network Error"); }
    finally { setProc(false); }
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const pending = allLeaves.filter(x => x.Status === "Pending");
  const history = allLeaves.filter(x => x.Status !== "Pending");

  // ── Analysis computed data ────────────────────────────────────────────────
  const analysis = useMemo(() => {
    const staff    = allLeaves.filter(l => l.User_Type === 'STAFF');
    const students = allLeaves.filter(l => l.User_Type === 'STUDENT');

    // Top leave takers by period — returns [{name, days, count, type}]
    const topByPeriod = (list, maxDays) => {
      const filtered = maxDays ? list.filter(l => daysAgo(l.Start_Date) <= maxDays) : list;
      const map = {};
      filtered.forEach(l => {
        const k = l.Name || 'Unknown';
        if (!map[k]) map[k] = { name:k, type:l.User_Type, id:l.User_ID, days:0, count:0, reasons:[] };
        map[k].days  += Number(l.Total_Days || 1);
        map[k].count += 1;
        if (l.Reason && l.Reason !== '-' && map[k].reasons.length < 3)
          map[k].reasons.push({ reason:l.Reason, date:l.Start_Date, days:Number(l.Total_Days||1) });
      });
      return Object.values(map).sort((a,b) => b.days - a.days).slice(0, 10);
    };

    // Student by grade breakdown
    const gradeMap = {};
    students.forEach(l => {
      const g = extractGrade(l);
      if (!gradeMap[g]) gradeMap[g] = { grade:g, total:0, approved:0, pending:0, people:{} };
      gradeMap[g].total++;
      if (l.Status === 'Approved') gradeMap[g].approved++;
      if (l.Status === 'Pending')  gradeMap[g].pending++;
      const nm = l.Name||'Unknown';
      if (!gradeMap[g].people[nm]) gradeMap[g].people[nm] = 0;
      gradeMap[g].people[nm] += Number(l.Total_Days||1);
    });
    const byGrade = Object.values(gradeMap).sort((a,b) => b.total - a.total);

    // Consecutive leave takers (Total_Days >= threshold)
    const consecutive = (minDays) => {
      return allLeaves
        .filter(l => Number(l.Total_Days || 1) >= minDays)
        .sort((a,b) => Number(b.Total_Days||1) - Number(a.Total_Days||1))
        .slice(0, 20)
        .map(l => ({
          name:      l.Name || 'Unknown',
          type:      l.User_Type,
          id:        l.User_ID,
          days:      Number(l.Total_Days || 1),
          leaveType: l.Leave_Type || '-',
          start:     l.Start_Date,
          end:       l.End_Date,
          reason:    l.Reason || '-',
          status:    l.Status,
        }));
    };

    // Monthly trend (6 months)
    const now = new Date();
    const monthly = Array.from({ length:6 }, (_,i) => {
      const d = new Date(now.getFullYear(), now.getMonth()-(5-i), 1);
      const label = d.toLocaleDateString('en-US', { month:'short' });
      const list = allLeaves.filter(l => {
        const ld = new Date(l.Start_Date);
        return ld.getFullYear()===d.getFullYear() && ld.getMonth()===d.getMonth();
      });
      return { label, count:list.length, days:list.reduce((s,l)=>s+Number(l.Total_Days||1),0) };
    });

    // Leave type breakdown
    const typeMap = {};
    allLeaves.forEach(l => {
      const t = l.Leave_Type || 'Other';
      if (!typeMap[t]) typeMap[t] = { type:t, count:0, days:0 };
      typeMap[t].count++;
      typeMap[t].days += Number(l.Total_Days||1);
    });
    const byType = Object.values(typeMap).sort((a,b) => b.count - a.count);

    return {
      staff, students,
      staffTop:    topByPeriod(staff,    null),
      studentTop:  topByPeriod(students, null),
      byGrade,
      topAll:      topByPeriod(allLeaves, null),
      top6m:       topByPeriod(allLeaves, 180),
      top3m:       topByPeriod(allLeaves, 90),
      top2m:       topByPeriod(allLeaves, 60),
      top1m:       topByPeriod(allLeaves, 30),
      consec2:     consecutive(2),
      consec3:     consecutive(3),
      consec5:     consecutive(5),
      monthly, byType,
    };
  }, [allLeaves]);

  const TABS = [
    { id:"QUEUE",    label:"Queue",    badge:pending.length },
    { id:"ANALYSIS", label:"Analysis", badge:null },
    { id:"HISTORY",  label:"History",  badge:history.length },
  ];

  const A_TABS = [
    { id:"OVERVIEW",  label:"Overview" },
    { id:"PERIODS",   label:"By Period" },
    { id:"STAFF",     label:"Staff" },
    { id:"STUDENT",   label:"Student" },
    { id:"CONSEC",    label:"Consecutive" },
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
              <p className="text-[8px] uppercase tracking-widest text-slate-400 font-black">Total Records</p>
            </div>
          </div>
        </div>

        {/* ── MAIN TABS ── */}
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2
                ${tab===t.id ? 'bg-slate-950 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'}`}>
              {t.label}
              {t.badge !== null && t.badge > 0 && (
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black ${tab===t.id ? 'bg-[#fbbf24] text-slate-950' : 'bg-slate-100 text-slate-500'}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════ */}
        {/* TAB: QUEUE                                     */}
        {/* ══════════════════════════════════════════════ */}
        {tab === "QUEUE" && (
          <div className="space-y-5">
            {pending.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-6xl mb-4">✅</p>
                <p className="font-black uppercase italic text-slate-300 text-xl tracking-widest">Queue Empty</p>
              </div>
            ) : pending.map((l,i) => (
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
                  <button onClick={() => handleAction(l,"Approved")}
                    className="py-4 bg-emerald-500 text-white rounded-[1.5rem] font-black uppercase shadow-lg border-b-4 border-emerald-800 active:scale-95 transition-all hover:bg-emerald-600">
                    ✓ Approve
                  </button>
                  <button onClick={() => handleAction(l,"Rejected")}
                    className="py-4 bg-rose-500 text-white rounded-[1.5rem] font-black uppercase shadow-lg border-b-4 border-rose-800 active:scale-95 transition-all hover:bg-rose-600">
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* TAB: ANALYSIS                                  */}
        {/* ══════════════════════════════════════════════ */}
        {tab === "ANALYSIS" && (
          <div className="space-y-6">

            {/* Analysis sub-tabs */}
            <div className="overflow-x-auto pb-1">
              <div className="flex bg-white p-1 rounded-2xl border border-slate-100 gap-1 w-max min-w-full">
                {A_TABS.map(t => (
                  <button key={t.id} onClick={() => setATab(t.id)}
                    className={`px-5 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all whitespace-nowrap
                      ${aTab===t.id ? 'bg-slate-950 text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── OVERVIEW ── */}
            {aTab === "OVERVIEW" && (
              <div className="space-y-6">
                {/* Summary stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label:"Total",    value:allLeaves.length,                                    icon:"📋", c:"border-indigo-300 bg-indigo-50" },
                    { label:"Staff",    value:analysis.staff.length,                               icon:"👔", c:"border-blue-300 bg-blue-50" },
                    { label:"Student",  value:analysis.students.length,                            icon:"🎓", c:"border-purple-300 bg-purple-50" },
                    { label:"Approved", value:allLeaves.filter(l=>l.Status==="Approved").length,   icon:"✅", c:"border-emerald-300 bg-emerald-50" },
                  ].map((s,i) => (
                    <div key={i} className={`${s.c} p-5 rounded-[2rem] border-b-[6px] shadow-md flex flex-col items-center gap-2`}>
                      <span className="text-2xl">{s.icon}</span>
                      <p className="text-2xl font-black text-slate-950 leading-none">{s.value}</p>
                      <p className="text-[8px] uppercase tracking-widest font-black text-slate-500 text-center">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Monthly trend */}
                <div className="bg-white p-6 rounded-[2.5rem] border-b-[8px] border-slate-200 shadow-xl">
                  <h3 className="text-[9px] uppercase tracking-[0.3em] font-black text-slate-400 mb-6">Monthly Trend (6 Months)</h3>
                  <div className="flex items-end gap-3 h-32">
                    {analysis.monthly.map((m,i) => {
                      const max = Math.max(...analysis.monthly.map(x=>x.count), 1);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <p className="text-[9px] font-black text-slate-600">{m.count>0?m.count:""}</p>
                          <div className="w-full rounded-t-xl bg-slate-950 transition-all duration-500"
                            style={{ height:`${Math.max((m.count/max)*96, m.count>0?8:4)}px` }}/>
                          <p className="text-[8px] uppercase font-black text-slate-400">{m.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Leave type breakdown */}
                <div className="bg-white p-6 rounded-[2.5rem] border-b-[8px] border-slate-200 shadow-xl">
                  <h3 className="text-[9px] uppercase tracking-[0.3em] font-black text-slate-400 mb-6">Leave Type Breakdown</h3>
                  {analysis.byType.length === 0
                    ? <p className="text-center text-slate-300 italic py-8">No data</p>
                    : <div className="space-y-4">
                        {analysis.byType.map((t,i) => (
                          <div key={i} className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-black text-slate-700 uppercase italic truncate pr-4">{t.type}</span>
                              <span className="text-sm font-black text-slate-950 shrink-0">{t.count} requests · {t.days} days</span>
                            </div>
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-950 rounded-full transition-all duration-700"
                                style={{ width:`${(t.count/analysis.byType[0].count)*100}%` }}/>
                            </div>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              </div>
            )}

            {/* ── BY PERIOD ── */}
            {aTab === "PERIODS" && (
              <div className="space-y-6">
                {[
                  { label:"All Time",       list:analysis.topAll  },
                  { label:"Last 6 Months",  list:analysis.top6m   },
                  { label:"Last 3 Months",  list:analysis.top3m   },
                  { label:"Last 2 Months",  list:analysis.top2m   },
                  { label:"Last 1 Month",   list:analysis.top1m   },
                ].map((period, pi) => (
                  <div key={pi} className="bg-slate-950 p-6 rounded-[2.5rem] border-b-[8px] border-[#fbbf24] shadow-2xl">
                    <h3 className="text-[9px] uppercase tracking-[0.3em] font-black text-[#fbbf24] mb-5 flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-[#fbbf24] rounded-full"/>
                      Top Leave Takers — {period.label}
                    </h3>
                    {period.list.length === 0
                      ? <p className="text-center text-white/20 italic py-6 text-sm">No data</p>
                      : <div className="space-y-3">
                          {period.list.map((p,i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className={`text-base font-black shrink-0 ${i===0?'text-[#fbbf24]':i===1?'text-slate-300':i===2?'text-amber-600':'text-white/30'}`}>
                                    #{i+1}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-white font-black uppercase italic text-sm truncate">{p.name}</p>
                                    <p className="text-[8px] uppercase font-black text-slate-500 mt-0.5">{p.type} · ID: {p.id}</p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-[#fbbf24] font-black text-lg leading-none">{p.days}</p>
                                  <p className="text-[8px] uppercase font-black text-slate-500">days · {p.count}x</p>
                                </div>
                              </div>
                              {p.reasons.length > 0 && (
                                <div className="space-y-1 mt-2 border-t border-white/10 pt-2">
                                  {p.reasons.map((r,ri) => (
                                    <p key={ri} className="text-[8px] text-slate-400 italic">
                                      {r.date} · {r.days}d — "{r.reason}"
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                    }
                  </div>
                ))}
              </div>
            )}

            {/* ── STAFF ── */}
            {aTab === "STAFF" && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-[2rem] border-b-[6px] border-slate-200 shadow-md flex gap-4 flex-wrap">
                  {[
                    { label:"Total Requests", value:analysis.staff.length },
                    { label:"Total Days",     value:analysis.staff.reduce((s,l)=>s+Number(l.Total_Days||1),0) },
                    { label:"Approved",       value:analysis.staff.filter(l=>l.Status==="Approved").length },
                    { label:"Pending",        value:analysis.staff.filter(l=>l.Status==="Pending").length },
                  ].map((s,i) => (
                    <div key={i} className="flex-1 min-w-[80px] text-center">
                      <p className="text-2xl font-black text-slate-950">{s.value}</p>
                      <p className="text-[8px] uppercase font-black text-slate-400 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-950 p-6 rounded-[2.5rem] border-b-[8px] border-[#fbbf24] shadow-2xl">
                  <h3 className="text-[9px] uppercase tracking-[0.3em] font-black text-[#fbbf24] mb-5">Staff — All Time Top Leave Takers</h3>
                  {analysis.staffTop.length === 0
                    ? <p className="text-center text-white/20 italic py-6">No staff leave data</p>
                    : analysis.staffTop.map((p,i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-3">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`text-base font-black shrink-0 ${i===0?'text-[#fbbf24]':i===1?'text-slate-300':i===2?'text-amber-600':'text-white/30'}`}>#{i+1}</span>
                              <div className="min-w-0">
                                <p className="text-white font-black uppercase italic text-sm truncate">{p.name}</p>
                                <p className="text-[8px] uppercase font-black text-slate-500 mt-0.5">ID: {p.id}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[#fbbf24] font-black text-lg leading-none">{p.days}</p>
                              <p className="text-[8px] uppercase font-black text-slate-500">days · {p.count}x</p>
                            </div>
                          </div>
                          {p.reasons.length > 0 && (
                            <div className="border-t border-white/10 pt-2 space-y-1">
                              {p.reasons.map((r,ri) => (
                                <p key={ri} className="text-[8px] text-slate-400 italic">{r.date} · {r.days}d — "{r.reason}"</p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                  }
                </div>
              </div>
            )}

            {/* ── STUDENT ── */}
            {aTab === "STUDENT" && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-[2rem] border-b-[6px] border-slate-200 shadow-md flex gap-4 flex-wrap">
                  {[
                    { label:"Total Requests", value:analysis.students.length },
                    { label:"Total Days",     value:analysis.students.reduce((s,l)=>s+Number(l.Total_Days||1),0) },
                    { label:"Approved",       value:analysis.students.filter(l=>l.Status==="Approved").length },
                    { label:"Pending",        value:analysis.students.filter(l=>l.Status==="Pending").length },
                  ].map((s,i) => (
                    <div key={i} className="flex-1 min-w-[80px] text-center">
                      <p className="text-2xl font-black text-slate-950">{s.value}</p>
                      <p className="text-[8px] uppercase font-black text-slate-400 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* By grade */}
                <div className="space-y-3">
                  {analysis.byGrade.map((g,gi) => {
                    const topPeople = Object.entries(g.people).sort((a,b)=>b[1]-a[1]).slice(0,5);
                    return (
                      <div key={gi} className="bg-white rounded-[2rem] border-b-[6px] border-slate-200 shadow-md overflow-hidden">
                        <div className="bg-slate-950 px-5 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-[#fbbf24] font-black text-sm uppercase italic">{g.grade}</span>
                          </div>
                          <div className="flex gap-4">
                            <div className="text-center">
                              <p className="text-white font-black text-sm leading-none">{g.total}</p>
                              <p className="text-[7px] text-slate-500 uppercase font-black">total</p>
                            </div>
                            <div className="text-center">
                              <p className="text-emerald-400 font-black text-sm leading-none">{g.approved}</p>
                              <p className="text-[7px] text-slate-500 uppercase font-black">approved</p>
                            </div>
                            <div className="text-center">
                              <p className="text-amber-400 font-black text-sm leading-none">{g.pending}</p>
                              <p className="text-[7px] text-slate-500 uppercase font-black">pending</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          {topPeople.map(([name, days],pi) => (
                            <div key={pi} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`text-[10px] font-black shrink-0 ${pi===0?'text-amber-500':pi===1?'text-slate-400':pi===2?'text-amber-700':'text-slate-300'}`}>#{pi+1}</span>
                                <p className="text-sm font-black text-slate-700 truncate uppercase italic">{name}</p>
                              </div>
                              <div className="shrink-0 flex items-center gap-2">
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden w-20">
                                  <div className="h-full bg-slate-800 rounded-full"
                                    style={{ width:`${(days/topPeople[0][1])*100}%` }}/>
                                </div>
                                <span className="text-[10px] font-black text-slate-600 w-8 text-right">{days}d</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Student all-time top */}
                <div className="bg-slate-950 p-6 rounded-[2.5rem] border-b-[8px] border-[#fbbf24] shadow-2xl">
                  <h3 className="text-[9px] uppercase tracking-[0.3em] font-black text-[#fbbf24] mb-5">Students — All Time Top Leave Takers</h3>
                  {analysis.studentTop.length === 0
                    ? <p className="text-center text-white/20 italic py-6">No student leave data</p>
                    : analysis.studentTop.map((p,i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-3">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`text-base font-black shrink-0 ${i===0?'text-[#fbbf24]':i===1?'text-slate-300':i===2?'text-amber-600':'text-white/30'}`}>#{i+1}</span>
                              <div className="min-w-0">
                                <p className="text-white font-black uppercase italic text-sm truncate">{p.name}</p>
                                <p className="text-[8px] uppercase font-black text-slate-500 mt-0.5">ID: {p.id}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[#fbbf24] font-black text-lg leading-none">{p.days}</p>
                              <p className="text-[8px] uppercase font-black text-slate-500">days · {p.count}x</p>
                            </div>
                          </div>
                          {p.reasons.length > 0 && (
                            <div className="border-t border-white/10 pt-2 space-y-1">
                              {p.reasons.map((r,ri) => (
                                <p key={ri} className="text-[8px] text-slate-400 italic">{r.date} · {r.days}d — "{r.reason}"</p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                  }
                </div>
              </div>
            )}

            {/* ── CONSECUTIVE ── */}
            {aTab === "CONSEC" && (
              <div className="space-y-6">
                {[
                  { label:"2+ Days Consecutive", list:analysis.consec2, color:"border-amber-400 bg-amber-50",    badge:"2+ days" },
                  { label:"3+ Days Consecutive", list:analysis.consec3, color:"border-orange-400 bg-orange-50",  badge:"3+ days" },
                  { label:"5+ Days Consecutive", list:analysis.consec5, color:"border-rose-400 bg-rose-50",      badge:"5+ days" },
                ].map((group, gi) => (
                  <div key={gi}>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xs uppercase tracking-widest font-black text-slate-700">{group.label}</h3>
                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${gi===0?'bg-amber-100 text-amber-700':gi===1?'bg-orange-100 text-orange-700':'bg-rose-100 text-rose-700'}`}>
                        {group.list.length} records
                      </span>
                    </div>
                    {group.list.length === 0
                      ? <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
                          <p className="text-slate-300 italic font-black text-sm">No {group.badge} leaves found</p>
                        </div>
                      : <div className="space-y-3">
                          {group.list.map((l,i) => (
                            <div key={i} className="bg-white p-4 rounded-[1.5rem] border-b-[4px] border-slate-200 shadow-md flex items-start gap-4">
                              <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm
                                ${gi===0?'bg-amber-100 text-amber-700':gi===1?'bg-orange-100 text-orange-700':'bg-rose-100 text-rose-700'}`}>
                                {l.days}d
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-black uppercase italic text-sm text-slate-950">{l.name}</p>
                                  <span className="text-[7px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase">{l.type}</span>
                                  <span className={`text-[7px] px-2 py-0.5 rounded-full font-black uppercase
                                    ${l.status==="Approved"?'bg-emerald-100 text-emerald-700':l.status==="Pending"?'bg-amber-100 text-amber-700':'bg-rose-100 text-rose-700'}`}>
                                    {l.status}
                                  </span>
                                </div>
                                <p className="text-[9px] font-black text-slate-400 mt-1 uppercase">
                                  {l.leaveType} · {l.start} → {l.end}
                                </p>
                                {l.reason && l.reason !== '-' && (
                                  <p className="text-[9px] italic text-slate-500 mt-1">"{l.reason}"</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                    }
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* TAB: HISTORY                                   */}
        {/* ══════════════════════════════════════════════ */}
        {tab === "HISTORY" && (
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="py-24 text-center">
                <p className="font-black uppercase italic text-slate-300 text-xl tracking-widest">No history yet</p>
              </div>
            ) : history.slice().reverse().map((l,i) => (
              <div key={i} className="bg-white p-5 rounded-[2rem] border-b-[6px] border-slate-100 shadow-md flex items-center gap-4">
                <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-lg
                  ${l.Status==="Approved"?"bg-emerald-100":"bg-rose-100"}`}>
                  {l.Status==="Approved"?"✅":"❌"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black uppercase italic text-sm text-slate-950 truncate">{l.Name}</p>
                  <p className="text-[9px] uppercase font-black text-slate-400 mt-0.5">
                    {l.Leave_Type} · {l.Total_Days} days · {l.Start_Date}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className={`text-[8px] px-3 py-1 rounded-full font-black uppercase
                    ${l.Status==="Approved"?"bg-emerald-100 text-emerald-700":"bg-rose-100 text-rose-700"}`}>
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