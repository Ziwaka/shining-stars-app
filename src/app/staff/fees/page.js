"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL, GIDS } from '@/lib/api';

/**
 * Shining Stars - Fees Management Master (v2.1 Master)
 * FEATURE: Enhanced Navigation + Fixed Price Link + Next Due Amount [cite: 2026-02-25]
 * STYLE: Slate-950 Bold Luxury | Purple & Gold Theme [cite: 2023-02-23]
 */
export default function FeesManagementHub() {
  const [students, setStudents] = useState([]);
  const [feeLogs, setFeeLogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);
  const router = useRouter();

  // ENTRY STATES [cite: 2026-02-25]
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form, setForm] = useState({
    category: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    nextAmount: "0",
    dueDate: "",
    remark: ""
  });

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || "null");
    if (!auth || auth['Can_Manage_Fees'] !== true) { router.push('/staff'); return; }
    setStaff(auth);

    const initFinanceHub = async () => {
      try {
        const [sRes, fRes, cRes] = await Promise.all([
          fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getData', targetGid: GIDS.STUDENT_DIR }) }),
          fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getData', sheetName: 'Fees_Management' }) }),
          fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getConfig', category: 'Fee_Categories' }) })
        ]);
        const sData = await sRes.json();
        const fData = await fRes.json();
        const cData = await cRes.json();

        if (sData.success) setStudents(sData.data.filter(s => !s.Status || s.Status.toString().toLowerCase() === "active"));
        if (fData.success) setFeeLogs(fData.data);
        if (cData.success && cData.data.length > 0) {
          setCategories(cData.data);
          setForm(prev => ({ ...prev, category: cData.data[0].Setting_Name, amount: cData.data[0].Value_1 || "" }));
        }
      } finally { setLoading(false); }
    };
    initFinanceHub();
  }, [router]);

  const handleCategoryChange = (val) => {
    const selected = categories.find(c => c.Setting_Name === val);
    setForm({ ...form, category: val, amount: selected?.Value_1 || "" });
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !form.amount) { alert("ERROR: Link Profile and Enter Amount!"); return; }
    setLoading(true);

    const data = [{
      Date: form.date,
      Student_ID: selectedStudent['Enrollment No.'],
      Fee_Category: form.category,
      Amount_Paid: form.amount,
      Next_Due_Date: form.dueDate,
      Next_Due_Amount: form.nextAmount,
      Status: "PAID",
      Recorded_By: staff.Name,
      Remark: form.remark
    }];

    try {
      const res = await fetch(WEB_APP_URL, { 
        method: 'POST', 
        body: JSON.stringify({ action: 'recordNote', sheetName: 'Fees_Management', data }) 
      });
      if ((await res.json()).success) {
        alert("FINANCIAL UPDATE SUCCESSFUL ★");
        window.location.reload(); 
      }
    } finally { setLoading(false); }
  };

  const filteredStudents = search.trim() === "" 
    ? students.slice(0, 5) 
    : students.filter(s => s['Name (ALL CAPITAL)']?.toLowerCase().includes(search.toLowerCase()) || s['Enrollment No.']?.toString().includes(search)).slice(0, 5);

  const studentLedger = feeLogs.filter(log => log.Student_ID == selectedStudent?.['Enrollment No.']);

  if (loading) return <div className="min-h-screen bg-[#0F071A] flex items-center justify-center font-black text-[#fbbf24] animate-pulse text-3xl uppercase italic tracking-tighter">Authorizing Finance Hub...</div>;

  return (
    <div className="min-h-screen bg-[#0F071A] p-6 md:p-14 font-black selection:bg-[#fbbf24] text-slate-950">
      <div className="max-w-[1800px] mx-auto space-y-12">
        
        {/* NAVIGATION HEADER [cite: 2026-02-25] */}
        <div className="bg-gradient-to-br from-[#4c1d95] via-[#2D1B4E] to-[#0F071A] p-10 md:p-16 rounded-[4rem] border-b-[15px] border-[#fbbf24] shadow-3xl flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-6">
            <button onClick={() => router.push('/staff')} className="bg-[#fbbf24] p-6 rounded-[2.5rem] hover:bg-white transition-all shadow-2xl active:scale-90 border-b-6 border-amber-600 group" title="Back to Staff Hub">
              <span className="text-3xl group-hover:scale-125 inline-block transition-transform">🔙</span>
            </button>
            <button onClick={() => router.push('/')} className="bg-white/10 p-6 rounded-[2.5rem] hover:bg-white/20 transition-all border border-white/10 group" title="Back to Home">
              <span className="text-3xl group-hover:scale-125 inline-block transition-transform">🏠</span>
            </button>
            <h1 className="text-5xl md:text-8xl italic uppercase font-black text-white tracking-tighter leading-none ml-4">Fees Hub</h1>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[#fbbf24] text-[10px] uppercase font-black tracking-[0.5em] italic">Access Verified: {staff.Name} • Finance Protocol</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
          
          {/* LEFT: STUDENT PICKER [cite: 2026-02-25] */}
          <div className="xl:col-span-3 space-y-8 bg-white/5 p-12 rounded-[4.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
            <h2 className="text-2xl uppercase italic text-[#fbbf24] font-black border-l-8 border-[#fbbf24] pl-6 tracking-tighter">Profile Protocol</h2>
            <input 
              type="text" placeholder="SEARCH NAME OR ID..." 
              className="w-full bg-[#0F071A] border-4 border-white/10 p-8 rounded-[2.5rem] text-[#fbbf24] font-black italic text-xl outline-none focus:border-[#fbbf24] shadow-inner placeholder:opacity-20"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
            <div className="space-y-4">
              {filteredStudents.map((s, idx) => (
                <button key={idx} onClick={() => setSelectedStudent(s)} className={`w-full p-8 rounded-[3rem] border-2 flex justify-between items-center transition-all ${selectedStudent?.['Enrollment No.'] === s['Enrollment No.'] ? 'bg-[#fbbf24] border-[#fbbf24] text-[#1A0B2E] scale-105 shadow-2xl' : 'bg-white/5 border-white/10 text-white hover:border-[#fbbf24]'}`}>
                  <div className="text-left font-black italic uppercase leading-none">
                    <span className="text-[9px] px-4 py-1.5 rounded-full mb-2 inline-block bg-white/10">{s.Grade}</span>
                    <p className="text-xl">{s['Name (ALL CAPITAL)']}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* CENTER: ENTRY FORM [cite: 2026-02-25] */}
          <div className="xl:col-span-5 bg-white p-14 rounded-[5rem] border-b-[20px] border-indigo-900 shadow-3xl space-y-10">
            <h2 className="text-3xl uppercase italic text-indigo-900 font-black border-l-8 border-indigo-900 pl-8 tracking-tighter">Payment Entry</h2>
            
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[11px] uppercase text-slate-400 font-black ml-6 italic">Fee Category</label>
                  <select className="w-full bg-slate-50 border-4 border-slate-100 p-8 rounded-[2.5rem] font-black italic text-xl outline-none focus:border-indigo-900 shadow-inner appearance-none" value={form.category} onChange={(e) => handleCategoryChange(e.target.value)}>
                    {categories.map((c, i) => <option key={i} value={c.Setting_Name}>{c.Setting_Name}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] uppercase text-slate-400 font-black ml-6 italic">Amount (MMK)</label>
                  <input type="number" className="w-full bg-slate-50 border-4 border-slate-100 p-8 rounded-[2.5rem] font-black italic text-3xl outline-none focus:border-[#fbbf24] text-emerald-600" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[11px] uppercase text-rose-500 font-black ml-6 italic">Next Due Amount</label>
                  <input type="number" className="w-full bg-rose-50 border-4 border-rose-100 p-8 rounded-[2.5rem] font-black italic text-2xl outline-none text-rose-600 shadow-inner" value={form.nextAmount} onChange={(e) => setForm({...form, nextAmount: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] uppercase text-rose-500 font-black ml-6 italic">Next Due Date</label>
                  <input type="date" className="w-full bg-rose-50 border-4 border-rose-100 p-8 rounded-[2.5rem] font-black italic outline-none text-rose-600 shadow-inner" value={form.dueDate} onChange={(e) => setForm({...form, dueDate: e.target.value})} />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] uppercase text-slate-400 font-black ml-6 italic">Remark / Memo</label>
                <textarea rows="2" className="w-full bg-slate-50 border-4 border-slate-100 p-8 rounded-[2.5rem] font-black italic outline-none focus:border-[#fbbf24] shadow-inner" value={form.remark} onChange={(e) => setForm({...form, remark: e.target.value})} />
              </div>

              <button onClick={handleSubmit} disabled={!selectedStudent || !form.amount} className="w-full py-10 bg-[#1A0B2E] text-white rounded-[4rem] text-2xl font-black uppercase italic shadow-2xl hover:bg-[#fbbf24] hover:text-[#1A0B2E] transition-all border-b-10 border-amber-500 disabled:opacity-20 active:scale-95">Record Registry ★</button>
            </div>
          </div>

          {/* RIGHT: LEDGER [cite: 2026-02-25] */}
          <div className="xl:col-span-4 bg-white/5 p-12 rounded-[5rem] border border-white/10 shadow-3xl space-y-10 overflow-hidden">
            <h2 className="text-3xl uppercase italic text-indigo-400 font-black border-l-8 border-indigo-400 pl-8 tracking-tighter">Student Ledger</h2>
            {selectedStudent ? (
              <div className="space-y-6 max-h-[750px] overflow-y-auto custom-scrollbar pr-6">
                {studentLedger.length > 0 ? studentLedger.reverse().map((log, i) => (
                  <div key={i} className="bg-white p-10 rounded-[3.5rem] border-b-[12px] border-indigo-900 shadow-2xl transition-all hover:translate-y-[-5px]">
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[10px] font-black uppercase bg-emerald-100 px-5 py-2 rounded-full text-emerald-700">PAID</span>
                      <span className="text-xs text-slate-400 font-black italic">{log.Date}</span>
                    </div>
                    <p className="text-[10px] uppercase text-indigo-900 font-black mb-1 italic tracking-widest">{log.Fee_Category}</p>
                    <p className="text-4xl font-black text-slate-950 italic leading-none">{Number(log.Amount_Paid).toLocaleString()} MMK</p>
                    <div className="mt-8 pt-6 border-t-2 border-slate-100 grid grid-cols-2 gap-4">
                       <div>
                         <p className="text-[8px] uppercase text-rose-500 font-black italic">Next Amount</p>
                         <p className="text-lg font-black text-rose-600">{Number(log.Next_Due_Amount || 0).toLocaleString()} MMK</p>
                       </div>
                       <div className="text-right">
                         <p className="text-[8px] uppercase text-rose-500 font-black italic">Next Due Date</p>
                         <p className="text-lg font-black text-rose-600">{log.Next_Due_Date || "N/A"}</p>
                       </div>
                    </div>
                  </div>
                )) : <div className="text-center py-40 border-4 border-dashed border-white/10 rounded-[4rem] text-white/10 uppercase font-black italic tracking-[0.4em]">No financial archive.</div>}
              </div>
            ) : <div className="text-center py-40 text-white/10 uppercase font-black italic tracking-[0.4em]">Link profile to view ledger.</div>}
          </div>
        </div>
      </div>
      <style jsx global>{` body { font-weight: 900 !important; } .custom-scrollbar::-webkit-scrollbar { width: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #fbbf24; border-radius: 20px; border: 3px solid #0F071A; } `}</style>
    </div>
  );
}