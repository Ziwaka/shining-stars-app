"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

/**
 * Shining Stars - Student Observation Registry (v6.0 Pro Master)
 * FEATURE: Recent History Log with Date and Recorded_By [cite: 2026-02-26]
 * FEATURE: Post-Success Auto Refresh for History [cite: 2026-02-26]
 * STYLE: Professional Soft Blue (#F0F9FF) & Slate-950 Bold [cite: 2023-02-23]
 */
export default function StudentObservationNotes() {
  const [students, setStudents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]); // 🌟 Added History State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [staff, setStaff] = useState(null);
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("Observation");
  const [noteDetail, setNoteDetail] = useState("");

  // Function to fetch History separately for refreshes [cite: 2026-02-26]
  const fetchRecentLogs = async () => {
    try {
      const res = await fetch(WEB_APP_URL, { 
        method: 'POST', 
        body: JSON.stringify({ action: 'getData', sheetName: 'Student_Notes_Log' }) 
      });
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        // Show last 10 notes, newest first [cite: 2026-02-26]
        setRecentNotes(result.data.reverse().slice(0, 10));
      }
    } catch (e) { console.error("History Fetch Failed"); }
  };

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || "null");
    if (!auth) { router.push('/login'); return; }
    setStaff(auth);

    const initNotesHub = async () => {
      try {
        const [sRes, cRes] = await Promise.all([
          fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getData', sheetName: 'Student_Directory' }) }),
          fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getConfig', category: 'Note_Categories' }) })
        ]);
        const sData = await sRes.json();
        const cData = await cRes.json();

        if (sData.success) {
          const cleanedData = sData.data.map(item => {
            const normalized = {};
            Object.keys(item).forEach(key => { normalized[key.trim()] = item[key]; });
            return normalized;
          });
          setStudents(cleanedData);
        }
        if (cData.success && cData.data.length > 0) setCategories(cData.data);
        else setCategories([{ Setting_Name: "Observation" }, { Setting_Name: "Academic" }]);
        
        // Load initial history [cite: 2026-02-26]
        await fetchRecentLogs();
        
      } catch (err) { console.error("Sync Error"); } finally { setLoading(false); }
    };
    initNotesHub();
  }, [router]);

  const handleSubmit = async () => {
    if (!selectedStudent || !noteDetail.trim()) return;
    setSubmitting(true);

    const data = [{
      Date: new Date().toISOString().split('T')[0],
      Student_ID: selectedStudent['Enrollment No.'] || selectedStudent.Student_ID,
      Name: selectedStudent['Name (ALL CAPITAL)'] || selectedStudent.Name,
      Category: selectedCategory,
      Note_Detail: noteDetail.trim(),
      Visibility: "Staff-Wide",
      Recorded_By: staff.Name || staff.username || "System Admin"
    }];

    try {
      const res = await fetch(WEB_APP_URL, { 
        method: 'POST', 
        body: JSON.stringify({ action: 'recordNote', sheetName: 'Student_Notes_Log', data }) 
      });
      const result = await res.json();
      if (result.success) {
        setIsSuccess(true);
        setNoteDetail("");
        await fetchRecentLogs(); // 🌟 Auto-Refresh History [cite: 2026-02-26]
      }
    } catch (err) { alert("Network Error"); } finally { setSubmitting(false); }
  };

  const handleNextEntry = () => {
    setIsSuccess(false);
    setSelectedStudent(null);
    setSearch("");
  };

  const filtered = search.trim() === "" ? [] : students.filter(s => {
    const name = (s['Name (ALL CAPITAL)'] || s.Name || "").toLowerCase();
    const id = (s['Enrollment No.'] || s.Student_ID || "").toString();
    return name.includes(search.toLowerCase()) || id.includes(search);
  }).slice(0, 6);

  if (loading) return (
    <div className="min-h-screen bg-[#F0F9FF] flex flex-col items-center justify-center font-black text-slate-950">
      <div className="text-8xl animate-bounce">📓</div>
      <p className="mt-4 uppercase tracking-[0.4em]">Linking Registry Archives...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F9FF] p-6 md:p-14 font-black selection:bg-[#fbbf24] text-slate-950 pb-40">
      <div className="max-w-[1500px] mx-auto space-y-16">
        
        {/* HEADER */}
        <div className="bg-slate-950 p-10 md:p-14 rounded-[4rem] border-b-[15px] border-[#fbbf24] shadow-3xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#fbbf24]/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="flex items-center gap-6 z-10 leading-none">
            <button onClick={() => router.back()} className="bg-white/10 p-5 rounded-3xl text-white hover:bg-[#fbbf24] transition-all">⬅️</button>
            <h1 className="text-4xl md:text-7xl italic uppercase font-black text-white tracking-tighter ml-4">Observation Log</h1>
          </div>
          <div className="bg-white/10 px-8 py-3 rounded-2xl border border-white/20 text-white text-[10px] uppercase font-black z-10 italic text-right">
             GM Verified Registry Hub<br/>
             <span className="text-[#fbbf24]">{staff?.Name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          
          {/* LEFT: SEARCH & FORM */}
          <div className="xl:col-span-8 space-y-10">
            <div className="bg-white p-12 md:p-16 rounded-[5rem] shadow-2xl border-t-[12px] border-slate-900 min-h-[600px] flex flex-col justify-center">
              {!isSuccess ? (
                <>
                  <div className="mb-10 flex justify-between items-end border-b-4 border-slate-100 pb-6">
                    <h2 className="text-2xl md:text-3xl uppercase italic font-black text-slate-950">1. Link & Record</h2>
                    <span className="text-[10px] uppercase text-emerald-600 font-bold tracking-widest italic">Live Database Active</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                    <div className="space-y-4">
                      <label className="text-xs uppercase text-slate-400 font-black ml-4">Student Identity *</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="SEARCH NAME/ID..." 
                          className="w-full bg-slate-50 border-4 border-slate-100 p-6 rounded-3xl text-slate-950 font-black italic text-xl outline-none focus:border-[#fbbf24] shadow-inner uppercase" 
                          value={search} onChange={(e) => setSearch(e.target.value)}
                        />
                        {search.length > 0 && !selectedStudent && (
                          <div className="absolute top-full left-0 w-full mt-3 bg-white rounded-3xl shadow-2xl border-4 border-slate-950 overflow-hidden z-[100]">
                            {filtered.map((s, idx) => (
                              <button key={idx} onClick={() => setSelectedStudent(s)} className="w-full p-6 text-left hover:bg-slate-50 border-b-2 border-slate-100 flex justify-between items-center group">
                                <span className="text-xl font-black italic uppercase">{s['Name (ALL CAPITAL)'] || s.Name}</span>
                                <span className="bg-slate-950 text-[#fbbf24] text-[8px] px-3 py-1 rounded-lg uppercase">{s.House}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {selectedStudent && (
                        <div className="p-6 rounded-2xl bg-slate-950 text-[#fbbf24] shadow-lg animate-in zoom-in-95">
                          <p className="text-lg uppercase italic font-black leading-none">{selectedStudent['Name (ALL CAPITAL)'] || selectedStudent.Name}</p>
                          <p className="text-[9px] text-white/50 mt-1 uppercase">ID: {selectedStudent['Enrollment No.'] || selectedStudent.Student_ID}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs uppercase text-slate-400 font-black ml-4">Classification</label>
                      <select className="w-full bg-slate-50 border-4 border-slate-100 p-6 rounded-3xl font-black italic text-xl outline-none focus:border-slate-950 appearance-none shadow-inner" onChange={(e) => setSelectedCategory(e.target.value)} value={selectedCategory}>
                        {categories.map((c, idx) => <option key={idx} value={c.Setting_Name}>{c.Setting_Name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4 mb-10">
                    <label className="text-xs uppercase text-slate-400 font-black ml-4">Observation Detail *</label>
                    <textarea rows="6" placeholder="WRITE DETAILED LOG..." className="w-full bg-slate-50 border-4 border-slate-100 p-8 rounded-[3.5rem] text-slate-950 font-black italic text-2xl outline-none focus:border-[#fbbf24] shadow-inner custom-scrollbar" value={noteDetail} onChange={(e) => setNoteDetail(e.target.value)} />
                  </div>

                  <button onClick={handleSubmit} disabled={!selectedStudent || !noteDetail.trim() || submitting} className={`w-full py-10 rounded-[4rem] text-3xl font-black uppercase italic shadow-2xl border-b-[15px] transition-all active:scale-95 ${submitting ? 'bg-slate-200' : 'bg-slate-950 text-white border-slate-800 hover:bg-slate-900'}`}>
                    {submitting ? 'SYNCING...' : 'ARCHIVE LOG ★'}
                  </button>
                </>
              ) : (
                <div className="text-center space-y-8 animate-in zoom-in-90">
                   <div className="text-9xl">✅</div>
                   <h2 className="text-5xl font-black italic uppercase text-slate-950">Record Archived</h2>
                   <button onClick={handleNextEntry} className="px-16 py-8 bg-[#fbbf24] text-slate-950 rounded-[4rem] text-3xl font-black uppercase italic shadow-2xl border-b-8 border-amber-600 active:scale-95">Next Student 👤</button>
                </div>
              )}
            </div>
          </div>

          {/* 🌟 RIGHT: RECENT HISTORY LOG [cite: 2026-02-26] */}
          <div className="xl:col-span-4 space-y-8">
            <div className="bg-white p-10 rounded-[4rem] shadow-xl border-t-[12px] border-[#fbbf24] h-full overflow-hidden">
              <h2 className="text-2xl uppercase italic text-slate-950 font-black border-l-8 border-slate-950 pl-5 mb-8 tracking-tighter">Recent Archive</h2>
              <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                {recentNotes.length > 0 ? recentNotes.map((n, i) => (
                  <div key={i} className="bg-slate-50 p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative group">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[8px] uppercase font-black bg-slate-950 text-[#fbbf24] px-3 py-1 rounded-lg italic">
                        {n.Date}
                      </span>
                      <span className="text-[8px] uppercase font-black text-slate-400 italic">
                        By: {n.Recorded_By}
                      </span>
                    </div>
                    <p className="text-md font-black italic uppercase text-slate-950 leading-tight mb-2">{n.Name}</p>
                    <p className="text-[10px] text-slate-500 font-bold italic line-clamp-3">"{n.Note_Detail}"</p>
                    <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
                       <span className="text-[8px] uppercase font-black text-blue-600">{n.Category}</span>
                       <span className="text-[8px] text-slate-300">ID: {n.Student_ID}</span>
                    </div>
                  </div>
                )) : <div className="p-20 text-center text-slate-300 italic uppercase font-black">No Recent Records</div>}
              </div>
            </div>
          </div>

        </div>
      </div>
      <style jsx global>{`
        body { background-color: #F0F9FF; font-weight: 900 !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #020617; border-radius: 20px; }
      `}</style>
    </div>
  );
}