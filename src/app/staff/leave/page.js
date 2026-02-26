"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

/**
 * Shining Stars - Leave Request Form (v27.1)
 * FEATURE: Added "Main Profile" explicit navigation button [cite: 2026-02-25]
 * UI: Modern SaaS Luxury (Ivory, Dark Blue, Gold, Clear Texts) [cite: 2026-02-25]
 * LOGIC: Strict Validation Maintained [cite: 2026-02-25]
 */
export default function LeaveRequestFormWithProfile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [registry, setRegistry] = useState({ students: [], staff: [], pending: [], history: [] });
  const [view, setView] = useState("NEW_LEAVE");
  const [target, setTarget] = useState("STUDENT");
  const [selectedUser, setSelectedUser] = useState(null); 
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    type: "Sick Leave", start: "", end: "", reason: "",
    reporter: "", relation: "", phone: "", method: "Phone Call"
  });

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || "null");
    if (!auth) { router.push('/login'); return; }
    setUser(auth);

    const loadRegistry = async () => {
      try {
        const res = await fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getInitialData' }) });
        const result = await res.json();
        if (result.success) {
          const isActive = (u) => u.Status?.toString().toUpperCase() === "TRUE";
          setRegistry({
            students: result.students.filter(isActive),
            staff: result.staffList.filter(isActive),
            pending: result.leaves.filter(x => x.Status === "Pending"),
            history: result.leaves.filter(x => x.Status !== "Pending").reverse()
          });
        }
      } finally { setLoading(false); }
    };
    loadRegistry();
  }, [router]);

  const handleSubmission = async () => {
    // ⚠️ STRICT LOGIC MAINTAINED [cite: 2026-02-25]
    if (!selectedUser || !form.start || !form.end || !form.reason.trim()) {
      return alert("MANDATORY: Dates and Reason are required!");
    }
    if (target === "STUDENT" && (!form.reporter.trim() || !form.relation.trim() || !form.phone.trim())) {
      return alert("MANDATORY: Reporter details are required for Students!");
    }

    setIsSyncing(true);
    const entry = [{
      Date_Applied: new Date().toLocaleDateString('en-CA'),
      User_Type: target,
      User_ID: selectedUser['Enrollment No.'] || selectedUser['Staff_ID'],
      Name: selectedUser['Name (ALL CAPITAL)'] || selectedUser['Name'],
      Leave_Type: form.type, Start_Date: form.start, End_Date: form.end,
      Total_Days: Math.ceil(Math.abs(new Date(form.end) - new Date(form.start)) / (1000 * 60 * 60 * 24)) + 1,
      Reason: form.reason, Reporter_Name: target === "STUDENT" ? form.reporter : "-",
      Relationship: target === "STUDENT" ? form.relation : "-",
      Phone: target === "STUDENT" ? form.phone : "-", Method: target === "STUDENT" ? form.method : "-",
      Approved_By: "-", Status: "Pending"
    }];

    try {
      const res = await fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'recordNote', sheetName: 'Leave_Records', data: entry }) });
      if ((await res.json()).success) { alert("SUCCESS: Registry Logged ★"); window.location.reload(); }
    } finally { setIsSyncing(false); }
  };

  const handleAuthorization = async (leave, status) => {
    if (user.userRole !== 'management') return alert("Management only.");
    setIsSyncing(true);
    try {
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'updateLeave', userId: leave.User_ID, name: leave.Name, startDate: leave.Start_Date, status, approvedBy: user.Name })
      });
      if ((await res.json()).success) { alert(`SUCCESS: ${status} ★`); window.location.reload(); }
    } finally { setIsSyncing(false); }
  };

  const filteredItems = (target === "STUDENT" ? registry.students : registry.staff).filter(u => {
    const sL = search.toLowerCase();
    const name = (u['Name (ALL CAPITAL)'] || u['Name'] || "").toLowerCase();
    const id = (u['Enrollment No.'] || u['Staff_ID'] || "").toString();
    return search && (name.includes(sL) || id.includes(sL));
  });

  if (loading || isSyncing) return (
    <div className="min-h-screen bg-[#FDFCF0] flex flex-col items-center justify-center font-black text-[#0F172A] animate-pulse">
      <div className="text-6xl mb-4">💠</div>
      <div className="text-sm uppercase italic tracking-widest text-[#7C3AED]">Synchronizing System...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCF0] p-4 md:p-10 font-black text-[#020617] pb-32 selection:bg-[#FBBF24]">
      <div className="max-w-[1100px] mx-auto space-y-8">
        
        {/* TOP HEADER [cite: 2026-02-25] */}
        {!selectedUser && (
          <div className="bg-white p-6 md:px-10 md:py-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col xl:flex-row justify-between items-center gap-6 animate-in fade-in">
             <div className="flex items-center justify-between w-full xl:w-auto gap-5">
                <div className="flex items-center gap-5">
                   <button onClick={() => router.push('/staff')} className="bg-[#0F172A] text-[#FBBF24] w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-[#020617] hover:scale-105 active:scale-95 transition-all text-xl shadow-md">🔙</button>
                   <div>
                      <h1 className="text-[clamp(1.4rem,3vw,2rem)] italic uppercase tracking-tight leading-none text-[#0F172A]">Leave Request Form</h1>
                      <p className="text-xs text-[#7C3AED] uppercase tracking-widest mt-1">Shining Stars Hub</p>
                   </div>
                </div>
             </div>
             
             <div className="flex flex-wrap items-center justify-center gap-4">
                {/* 🌟 NEW: MAIN PROFILE BUTTON (GLOBAL NAVIGATION BYPASS) [cite: 2026-02-25] */}
                <button onClick={() => router.push('/staff')} className="px-6 py-3.5 bg-[#FBBF24] text-[#0F172A] rounded-full font-black uppercase text-[10px] md:text-xs shadow-sm hover:bg-amber-400 transition-all flex items-center gap-2 active:scale-95">
                   <span className="text-sm">👤</span> Main Profile
                </button>

                <div className="flex bg-slate-50 p-1.5 rounded-full border border-slate-200">
                   {[{id:"NEW_LEAVE", label:"New Request"}, {id:"PENDING", label:`Queue (${registry.pending.length})`}, {id:"HISTORY", label:"History"}].map(t => (
                     <button key={t.id} onClick={() => setView(t.id)} className={`px-5 md:px-6 py-3 rounded-full font-black uppercase text-[9px] md:text-xs transition-all ${view === t.id ? 'bg-[#0F172A] text-white shadow-md' : 'text-slate-400 hover:text-[#020617]'}`}>{t.label}</button>
                   ))}
                </div>
             </div>
          </div>
        )}

        {view === "NEW_LEAVE" && (
          <div className="transition-all duration-500">
            
            {/* SEARCH VIEW */}
            {!selectedUser ? (
              <div className="max-w-[700px] mx-auto space-y-6 animate-in slide-in-from-bottom-5">
                <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    {["STUDENT", "STAFF"].map(t => (
                      <button key={t} onClick={() => setTarget(t)} className={`flex-1 py-4 rounded-xl font-black uppercase tracking-wider text-xs transition-all ${target === t ? 'bg-[#0F172A] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>{t}</button>
                    ))}
                </div>
                
                <div className="relative shadow-sm rounded-2xl">
                   <input type="text" placeholder="Search by name or ID..." className="w-full bg-white border-2 border-slate-100 p-6 rounded-2xl text-[#020617] font-black italic outline-none focus:border-[#FBBF24] focus:ring-4 focus:ring-[#FBBF24]/20 transition-all text-lg placeholder:text-slate-300" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredItems.map((u, i) => (
                      <button key={i} onClick={() => setSelectedUser(u)} className="bg-white p-6 rounded-2xl border border-slate-100 flex justify-between items-center transition-all hover:border-[#7C3AED] hover:shadow-md hover:scale-[1.01] group">
                          <div className="text-left">
                             <p className="text-[clamp(1rem,2vw,1.2rem)] text-[#0F172A] italic uppercase font-black leading-none group-hover:text-[#7C3AED] transition-colors">{u['Name (ALL CAPITAL)'] || u['Name']}</p>
                             <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-2 uppercase">ID: {u['Enrollment No.'] || u['Staff_ID']}</p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#7C3AED] group-hover:text-white transition-all">➔</div>
                      </button>
                    ))}
                    {filteredItems.length === 0 && <div className="py-20 text-center text-slate-300 font-black uppercase italic tracking-widest text-xl">No identity found</div>}
                </div>
              </div>
            ) : (
              
              /* FORM VIEW */
              <div className="max-w-[850px] mx-auto bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95">
                 
                 <div className="bg-[#FEF9C3] px-8 md:px-12 py-8 border-b-4 border-[#FBBF24] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <p className="text-[10px] font-black uppercase text-[#7C3AED] tracking-[0.3em] mb-1">Target Identity</p>
                      <h2 className="text-[clamp(1.5rem,4vw,2.5rem)] font-black italic uppercase leading-none text-[#0F172A]">{selectedUser['Name (ALL CAPITAL)'] || selectedUser['Name']}</h2>
                      <p className="text-xs font-black uppercase text-[#0F172A]/50 mt-2 tracking-widest">ID: {selectedUser['Enrollment No.'] || selectedUser['Staff_ID']}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                       <button onClick={() => setSelectedUser(null)} className="px-6 py-3 bg-white text-[#0F172A] border border-slate-200 rounded-full font-black uppercase text-[10px] shadow-sm hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all">Change Identity ✕</button>
                       {/* 🌟 NEW: MAIN PROFILE BUTTON (IN FORM VIEW TOO) [cite: 2026-02-25] */}
                       <button onClick={() => router.push('/staff')} className="px-6 py-3 bg-[#0F172A] text-[#FBBF24] rounded-full font-black uppercase text-[10px] shadow-sm hover:scale-105 transition-all flex items-center gap-2">
                          <span>👤</span> Main Profile
                       </button>
                    </div>
                 </div>

                 <div className="p-8 md:p-12 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2"><p className="text-[10px] uppercase text-slate-400 font-black ml-2 tracking-widest">Leave Category</p>
                          <select className="w-full bg-[#FDFCF0] border-2 border-slate-200 p-5 rounded-2xl font-black italic outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10 text-[#020617] transition-all" value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                             <option>Sick Leave</option><option>Medical Leave</option><option>Personal Leave</option><option>Urgent Affair</option>
                          </select>
                       </div>
                       <div className="space-y-2"><p className="text-[10px] uppercase text-slate-400 font-black ml-2 tracking-widest">Timeline (Start - End)</p>
                          <div className="flex gap-3">
                             <input type="date" className="flex-1 bg-[#FDFCF0] border-2 border-slate-200 p-5 rounded-2xl font-black italic outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10 text-[#020617] transition-all" value={form.start} onChange={(e) => setForm({...form, start: e.target.value})} />
                             <input type="date" className="flex-1 bg-[#FDFCF0] border-2 border-slate-200 p-5 rounded-2xl font-black italic outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10 text-[#020617] transition-all" value={form.end} onChange={(e) => setForm({...form, end: e.target.value})} />
                          </div>
                       </div>
                    </div>

                    {target === "STUDENT" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#FEF9C3]/40 p-6 md:p-8 rounded-3xl border border-[#FBBF24]/30">
                         <input type="text" placeholder="ခွင့်တိုင်သူ အမည် (Reporter Name)" className="bg-white p-5 rounded-2xl font-black outline-none border border-slate-200 focus:border-[#FBBF24] focus:ring-4 focus:ring-[#FBBF24]/10 text-[#020617] transition-all" value={form.reporter} onChange={(e) => setForm({...form, reporter: e.target.value})} />
                         <input type="text" placeholder="တော်စပ်ပုံ (Relationship)" className="bg-white p-5 rounded-2xl font-black outline-none border border-slate-200 focus:border-[#FBBF24] focus:ring-4 focus:ring-[#FBBF24]/10 text-[#020617] transition-all" value={form.relation} onChange={(e) => setForm({...form, relation: e.target.value})} />
                         <input type="tel" placeholder="ဆက်သွယ်ရန် ဖုန်း (Phone)" className="bg-white p-5 rounded-2xl font-black outline-none border border-slate-200 focus:border-[#FBBF24] focus:ring-4 focus:ring-[#FBBF24]/10 text-[#020617] transition-all" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
                         <select className="bg-white p-5 rounded-2xl font-black border border-slate-200 focus:border-[#FBBF24] text-[#020617] outline-none" value={form.method} onChange={(e) => setForm({...form, method: e.target.value})}><option>Phone Call</option><option>Telegram</option><option>Viber</option><option>Directly</option></select>
                      </div>
                    )}

                    <div className="space-y-2">
                       <p className="text-[10px] uppercase text-rose-500 font-black ml-2 tracking-widest">Reasoning (MANDATORY)</p>
                       <textarea rows="4" placeholder="Brief justification required to proceed..." className="w-full bg-[#FDFCF0] border-2 border-slate-200 p-6 rounded-3xl font-black italic outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10 text-[#020617] resize-none transition-all" value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})} />
                    </div>

                    <button onClick={handleSubmission} className="w-full py-8 bg-[#0F172A] text-[#FBBF24] rounded-[2rem] text-[clamp(1.2rem,2vw,1.5rem)] font-black uppercase italic shadow-lg hover:bg-[#020617] hover:shadow-xl transition-all border-b-4 border-[#FBBF24] active:scale-[0.98] flex justify-center items-center gap-3">
                        <span>Submit Request</span> <span className="text-2xl">★</span>
                    </button>
                 </div>
              </div>
            )}
          </div>
        )}

        {/* PENDING QUEUE */}
        {view === "PENDING" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
             {registry.pending.map((l, i) => (
               <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="space-y-5">
                    <div className="flex justify-between items-start">
                       <span className="bg-[#FEF9C3] text-[#0F172A] border border-[#FBBF24] px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider">{l.User_Type} Profile</span>
                       <p className="text-[10px] text-slate-400 font-bold">{l.Date_Applied}</p>
                    </div>
                    <div>
                       <h3 className="text-[clamp(1.3rem,3vw,1.8rem)] font-black italic uppercase text-[#0F172A] leading-none mb-3">{l.Name}</h3>
                       <div className="bg-[#FDFCF0] p-5 rounded-2xl border-l-4 border-[#7C3AED]"><p className="text-[clamp(1rem,2vw,1.2rem)] font-black italic text-[#020617] leading-snug">"{l.Reason}"</p></div>
                    </div>
                    {l.User_Type === 'STUDENT' && (
                      <div className="text-[10px] font-black uppercase text-slate-500 bg-slate-50 p-4 rounded-xl space-y-1">
                         <p>By: {l.Reporter_Name} ({l.Relationship})</p>
                         <p>Contact: {l.Phone} | {l.Method}</p>
                      </div>
                    )}
                  </div>
                  
                  {user.userRole === 'management' ? (
                    <div className="grid grid-cols-2 gap-3 pt-6 mt-4 border-t border-slate-100">
                       <button onClick={() => handleAuthorization(l, "Approved")} className="py-4 bg-[#0F172A] text-white rounded-xl font-black uppercase text-xs shadow-md hover:bg-emerald-600 transition-colors">Approve</button>
                       <button onClick={() => handleAuthorization(l, "Rejected")} className="py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-black uppercase text-xs hover:bg-rose-50 hover:text-rose-600 transition-colors">Reject</button>
                    </div>
                  ) : <div className="text-center font-black uppercase italic text-[10px] text-[#FBBF24] bg-[#0F172A] py-3 rounded-xl mt-6 tracking-widest">Awaiting Authorization</div>}
               </div>
             ))}
             {registry.pending.length === 0 && <div className="col-span-full py-32 text-center opacity-30 font-black text-4xl uppercase italic text-slate-400">Queue Empty</div>}
          </div>
        )}
      </div>
      <style jsx global>{` .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; } body { background-color: #FDFCF0; } `}</style>
    </div>
  );
}