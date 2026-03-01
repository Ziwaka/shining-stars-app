"use client";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL, GIDS } from '@/lib/api';

/**
 * Ma Thwe - Fees Management Hub (v4.1 - Bug Fix)
 * FIXED:
 * - Button disabled bug: amount always initialized from loaded categories
 * - Due state managed separately so optimistic update clears it instantly
 * - No duplicate records: feeLogs append only once after server confirm
 * - Button: idle → amber/processing → green/success → form reset (no reload)
 */
export default function FeesManagementHub() {
  const [students, setStudents] = useState([]);
  const [feeLogs, setFeeLogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [btnState, setBtnState] = useState("idle"); // "idle" | "processing" | "success"

  // activeDue managed as its own state so we can clear it instantly on settle
  // null = no due | { amount, dueDate } = outstanding
  const [activeDue, setActiveDue] = useState(null);

  const categoriesRef = useRef([]);
  const initializedRef = useRef(false); // ✅ guard: run init only once

  const buildDefaultForm = (cats) => ({
    category: cats?.[0]?.Setting_Name || "",
    amount: String(cats?.[0]?.Value_1 || "0"),
    date: new Date().toISOString().split('T')[0],
    nextAmount: "0",
    dueDate: "",
    remark: ""
  });

  const [form, setForm] = useState(buildDefaultForm([]));

  useEffect(() => {
    // ✅ FIXED: empty dependency [] so this runs ONCE only, never on re-render
    // Guard ref prevents StrictMode double-invoke from double-fetching
    if (initializedRef.current) return;
    initializedRef.current = true;

    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || "null");
    if (!auth) { router.push('/login'); return; }

    const isManagement = auth.userRole === 'management' || auth.Position === 'GM';
    const hasFeesPermission = auth['Can_Manage_Fees'] === true || String(auth['Can_Manage_Fees']).trim().toUpperCase() === "TRUE";

    if (!isManagement && !hasFeesPermission) { router.push('/staff'); return; }
    setStaff(auth);

    const initFinanceHub = async () => {
      try {
        const [sRes, fRes, cRes] = await Promise.all([
          fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getData', targetGid: GIDS.STUDENT_DIR, sheetName: 'Student_Directory' }) }),
          fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getData', sheetName: 'Fees_Management' }) }),
          fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getConfig', category: 'Fee_Categories' }) })
        ]);
        const sData = await sRes.json();
        const fData = await fRes.json();
        const cData = await cRes.json();

        if (sData.success) {
          setStudents(sData.data.filter(s => {
            const stat = String(s.Status || "").trim().toUpperCase();
            return s.Status === true || stat === "TRUE" || stat === "ACTIVE" || stat === "";
          }));
        }
        if (fData.success) setFeeLogs(fData.data);
        if (cData.success && cData.data.length > 0) {
          const cats = cData.data;
          categoriesRef.current = cats;
          setCategories(cats);
          setForm(buildDefaultForm(cats));
        }
      } finally {
        setLoading(false); // ✅ only called once, never again
      }
    };
    initFinanceHub();
  }, []); // ✅ FIXED: was [router] which caused re-runs → now empty array

  // ─── Derived State ────────────────────────────────────────────────────────
  const currentStudentId = selectedStudent?.['Enrollment No.'] || selectedStudent?.Student_ID || selectedStudent?.ID;

  const studentLedger = feeLogs.filter(
    log => String(log.Student_ID) === String(currentStudentId)
  );

  // Paid records (Amount_Paid > 0), newest first
  const paidRecords = studentLedger
    .filter(log => Number(log.Amount_Paid || 0) > 0)
    .slice()
    .reverse();

  const totalPaidSum = paidRecords.reduce((sum, r) => sum + Number(r.Amount_Paid || 0), 0);

  // ✅ FIX: Recalculate activeDue from ledger when student changes
  // activeDue state is source of truth for display,
  // but we sync it from ledger when selectedStudent changes
  useEffect(() => {
    if (!currentStudentId) { setActiveDue(null); return; }
    const ledger = feeLogs.filter(log => String(log.Student_ID) === String(currentStudentId));
    const last = ledger.length > 0 ? ledger[ledger.length - 1] : null;
    const dueAmt = Number(last?.Next_Due_Amount || 0);
    setActiveDue(dueAmt > 0 ? { amount: dueAmt, dueDate: last?.Next_Due_Date || "" } : null);
  }, [currentStudentId, feeLogs]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleSettleDue = () => {
    if (!activeDue) return;
    setForm(prev => ({
      ...prev,
      category: "DUE SETTLEMENT",
      amount: activeDue.amount.toString(),
      remark: `Settlement for due dated ${activeDue.dueDate}`,
      nextAmount: "0",
      dueDate: ""
    }));
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleCategoryChange = (catName) => {
    const cat = categories.find(c => c.Setting_Name === catName);
    setForm(prev => ({
      ...prev,
      category: catName,
      // only overwrite amount if category has a preset value
      amount: cat?.Value_1 ? String(cat.Value_1) : prev.amount
    }));
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !form.amount || btnState !== "idle") return;

    setBtnState("processing");

    const sId = selectedStudent['Enrollment No.'] || selectedStudent.Student_ID || selectedStudent.ID;
    const nextDueAmt = form.nextAmount || "0";
    const payload = [{
      Date: form.date,
      Student_ID: sId,
      Fee_Category: form.category,
      Amount_Paid: form.amount,
      Next_Due_Date: form.dueDate || "",
      Next_Due_Amount: nextDueAmt,
      Status: "PAID",
      Recorded_By: staff?.Name || "",
      Remark: form.remark
    }];

    try {
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'recordNote', sheetName: 'Fees_Management', data: payload })
      });
      const result = await res.json();

      if (result.success) {
        // ✅ FIX: Append to feeLogs (triggers activeDue useEffect to recalculate)
        const newLog = {
          Student_ID: String(sId),
          Date: form.date,
          Fee_Category: form.category,
          Amount_Paid: form.amount,
          Next_Due_Date: form.dueDate || "",
          Next_Due_Amount: nextDueAmt,
          Status: "PAID",
          Recorded_By: staff?.Name || "",
          Remark: form.remark
        };
        setFeeLogs(prev => [...prev, newLog]);

        // ✅ FIX: If this was a settlement (nextAmount=0), clear due immediately
        if (Number(nextDueAmt) === 0) {
          setActiveDue(null);
        } else {
          setActiveDue({ amount: Number(nextDueAmt), dueDate: form.dueDate || "" });
        }

        setBtnState("success");

        // After 1.5s → reset to idle + clear form
        setTimeout(() => {
          setBtnState("idle");
          setForm(buildDefaultForm(categoriesRef.current));
        }, 1500);

      } else {
        setBtnState("idle");
        alert("Server Error: " + (result.message || "Unknown error"));
      }
    } catch (e) {
      setBtnState("idle");
      alert("Network Error. Please check connection.");
    }
  };

  // ─── Filtered Students ────────────────────────────────────────────────────
  const filteredStudents = search.trim() === ""
    ? students.slice(0, 8)
    : students.filter(s => {
        const nameMatch = (s['Name (ALL CAPITAL)'] || s.Name || "").toLowerCase().includes(search.toLowerCase());
        const idMatch = (s['Enrollment No.'] || s.Student_ID || "").toString().includes(search);
        return nameMatch || idMatch;
      }).slice(0, 10);

  // ─── Loading Screen ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#F0F9FF] flex flex-col items-center justify-center font-black text-[#4c1d95] animate-pulse uppercase italic">
      Synchronizing Secure Hub...
    </div>
  );

  // ─── Main UI ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0F9FF] font-black text-slate-950">
      <div className="max-w-[1200px] mx-auto p-4 pb-20 space-y-6">

        {/* ── HEADER ── */}
        <div className="bg-[#4c1d95] p-6 rounded-[2.5rem] border-b-[8px] border-[#fbbf24] shadow-xl space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/staff')}
              className="w-12 h-12 bg-[#fbbf24] rounded-2xl flex items-center justify-center text-2xl shadow-lg active:scale-90 transition-transform"
            >←</button>
            <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Fees Hub</h1>
          </div>

          {selectedStudent && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                <p className="text-[#fbbf24] text-[8px] uppercase font-black tracking-widest">Total Paid</p>
                <p className="text-xl text-white italic truncate">{totalPaidSum.toLocaleString()} MMK</p>
              </div>
              <div className="bg-rose-500/20 p-4 rounded-2xl border border-rose-500/30">
                <p className="text-rose-300 text-[8px] uppercase font-black tracking-widest">Outstanding Due</p>
                <p className="text-xl text-rose-400 italic truncate">
                  {activeDue ? activeDue.amount.toLocaleString() : "0"} MMK
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── 1. SELECT STUDENT ── */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-lg space-y-4 border-b-4 border-slate-100">
          <h2 className="text-[10px] font-black uppercase text-slate-400 italic">1. Identify Student</h2>
          <input
            type="text"
            placeholder="SEARCH NAME OR ID..."
            className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-slate-950 font-black italic text-sm outline-none focus:border-[#fbbf24]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar">
            {filteredStudents.map((s, idx) => {
              const sId = s['Enrollment No.'] || s.Student_ID;
              const isActive = String(currentStudentId) === String(sId);
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedStudent(s)}
                  className={`shrink-0 p-4 px-6 rounded-2xl border-2 flex flex-col transition-all ${
                    isActive
                      ? 'bg-[#fbbf24] border-[#fbbf24] scale-105 shadow-md'
                      : 'bg-slate-50 border-slate-100 text-slate-400'
                  }`}
                >
                  <span className="text-[8px] font-black mb-1 opacity-60">ID: {sId}</span>
                  <p className="text-xs uppercase italic font-black whitespace-nowrap">
                    {s['Name (ALL CAPITAL)'] || s.Name}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 2. PAYMENT ENTRY FORM ── */}
        <div className="bg-white p-8 rounded-[3rem] border-b-[12px] border-indigo-950 shadow-2xl space-y-6">
          <h2 className="text-[10px] font-black uppercase text-indigo-900 italic">2. Financial Entry</h2>
          <div className="space-y-4">

            {/* Date */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase text-slate-400 font-black ml-4 italic">Payment Date</label>
              <input
                type="date"
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-black italic text-sm outline-none focus:border-indigo-950"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase text-slate-400 font-black ml-4 italic">Category</label>
              <select
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-black italic text-base outline-none focus:border-indigo-950 appearance-none"
                value={form.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                {categories.map((c, i) => (
                  <option key={i} value={c.Setting_Name}>{c.Setting_Name}</option>
                ))}
                <option value="DUE SETTLEMENT">DUE SETTLEMENT</option>
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase text-slate-400 font-black ml-4 italic">Amount (MMK)</label>
              <input
                type="number"
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-black italic text-2xl text-emerald-600 outline-none focus:border-emerald-400"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>

            {/* Next Due */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase text-rose-500 font-black ml-4 italic">Next Due MMK</label>
                <input
                  type="number"
                  className="w-full bg-rose-50 border-2 border-rose-100 p-4 rounded-2xl font-black italic text-sm text-rose-600 outline-none focus:border-rose-400"
                  value={form.nextAmount}
                  onChange={(e) => setForm({ ...form, nextAmount: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase text-rose-500 font-black ml-4 italic">Due Date</label>
                <input
                  type="date"
                  className="w-full bg-rose-50 border-2 border-rose-100 p-4 rounded-2xl font-black italic text-sm text-rose-600 outline-none focus:border-rose-400"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>

            {/* Remark */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase text-slate-400 font-black ml-4 italic">Remark / Memo</label>
              <input
                type="text"
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-black italic text-sm outline-none focus:border-indigo-200"
                value={form.remark}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
              />
            </div>

            {/* Submit Button - 3 States */}
            <button
              onClick={handleSubmit}
              disabled={!selectedStudent || !form.amount || btnState !== "idle"}
              className={`w-full py-6 rounded-[2rem] text-lg font-black uppercase shadow-xl transition-all duration-200 border-b-8 active:translate-y-2
                ${btnState === "idle"
                  ? "bg-slate-950 text-white border-indigo-700 hover:bg-indigo-950"
                  : ""}
                ${btnState === "processing"
                  ? "bg-amber-400 text-slate-950 border-amber-600 scale-[0.98] cursor-not-allowed"
                  : ""}
                ${btnState === "success"
                  ? "bg-emerald-500 text-white border-emerald-700 scale-100 cursor-not-allowed"
                  : ""}
                ${(!selectedStudent || !form.amount) && btnState === "idle"
                  ? "opacity-40 cursor-not-allowed"
                  : ""}
              `}
            >
              {btnState === "idle" && "Record Registry ★"}
              {btnState === "processing" && (
                <span className="flex items-center justify-center gap-3">
                  <span className="inline-block w-4 h-4 border-4 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></span>
                  PROCESSING...
                </span>
              )}
              {btnState === "success" && "✓ PAID — RECORDED"}
            </button>
          </div>
        </div>

        {/* ── 3. SMART LEDGER ── */}
        <div className="bg-slate-950 p-8 rounded-[3rem] shadow-2xl space-y-6">
          <h2 className="text-[10px] font-black uppercase italic text-[#fbbf24] flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#fbbf24] rounded-full"></span>
            3. Ledger History
          </h2>

          {!selectedStudent ? (
            <p className="text-white/20 text-center italic py-10 uppercase text-[10px]">Select a student profile.</p>
          ) : (
            <div className="space-y-4">

              {/* ── Outstanding Due Banner (only shown when due exists) ── */}
              {activeDue && (
                <div className="bg-rose-500 p-6 rounded-[2.5rem] border-b-8 border-rose-900 shadow-2xl">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[8px] font-black uppercase px-3 py-1 rounded-full bg-white text-rose-600 shadow-md">
                      OUTSTANDING DUE
                    </span>
                    <span className="text-[8px] text-white/60 font-black uppercase">
                      DUE: {activeDue.dueDate || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[8px] text-white/70 font-black uppercase italic mb-1">Balance Due</p>
                      <p className="text-3xl font-black text-white italic leading-none">
                        {activeDue.amount.toLocaleString()} <span className="text-sm">MMK</span>
                      </p>
                    </div>
                    <button
                      onClick={handleSettleDue}
                      className="bg-white text-rose-600 px-6 py-3 rounded-full font-black uppercase italic text-[10px] shadow-xl active:scale-95 transition-all"
                    >
                      Settle Now ⚡
                    </button>
                  </div>
                </div>
              )}

              {/* ── Paid History ── */}
              {paidRecords.length > 0 ? (
                paidRecords.map((log, i) => (
                  <div key={i} className="bg-white p-5 rounded-[2rem] border-b-[6px] border-indigo-200 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[7px] font-black uppercase px-3 py-1 rounded-full shadow-sm bg-emerald-100 text-emerald-700">
                        PAID
                      </span>
                      <span className="text-[8px] text-slate-400 font-black italic">{log.Date}</span>
                    </div>
                    <p className="text-[8px] uppercase text-indigo-900 font-black truncate mb-1">{log.Fee_Category}</p>
                    <p className="text-2xl font-black text-slate-950 italic leading-none">
                      {Number(log.Amount_Paid || 0).toLocaleString()} <span className="text-[10px]">MMK</span>
                    </p>
                    {log.Remark ? (
                      <p className="text-[8px] text-slate-400 font-black italic mt-2 truncate">※ {log.Remark}</p>
                    ) : null}

                  </div>
                ))
              ) : (
                <p className="text-white/20 text-center italic py-6 uppercase text-[10px]">No payment history.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        body {
          background-color: #F0F9FF;
          font-weight: 900 !important;
          -webkit-tap-highlight-color: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fbbf24; border-radius: 10px; }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 0.7s linear infinite;
        }
      `}</style>
    </div>
  );
}