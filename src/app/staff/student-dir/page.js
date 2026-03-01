"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL, GIDS } from '@/lib/api';

export default function StudentDirectoryOnly() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const router = useRouter();

  const handleBack = () => {
    const auth = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null");
    router.push(auth?.userRole === "management" ? "/management/mgt-dashboard" : "/staff");
  };

  const getDrivePreview = (url) => {
    if (!url || typeof url !== 'string') return null;
    try {
      let fileId = "";
      if (url.includes('id=')) fileId = url.split('id=')[1].split('&')[0];
      else if (url.includes('/d/')) fileId = url.split('/d/')[1].split('/')[0];
      return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000` : url;
    } catch (e) { return null; }
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getData', targetGid: GIDS.STUDENT_DIR }) });
        const data = await res.json();
        if (data.success) setStudents(data.data);
      } finally { setLoading(false); }
    };
    fetchStudents();
  }, []);

  const gradeStats = students.reduce((acc, s) => {
    const g = s.Grade || "Unknown";
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  const uniqueGrades = Object.keys(gradeStats).sort((a, b) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  const filteredStudents = students.filter(s => {
    const matchSearch = s['Name (ALL CAPITAL)']?.toLowerCase().includes(search.toLowerCase()) || 
                        s['အမည်']?.includes(search) || 
                        s['Name (Myanmar)']?.includes(search) || 
                        s['Enrollment No.']?.toString().includes(search);
    const matchGrade = gradeFilter === "ALL" || s.Grade === gradeFilter;
    return matchSearch && matchGrade;
  });

  const showGradesView = gradeFilter === "ALL" && search.trim() === "";

  if (loading) return <div className="min-h-screen bg-[#0F071A] flex items-center justify-center font-black text-[#FFD700] animate-pulse text-2xl md:text-3xl uppercase italic tracking-tighter px-6 text-center">Loading Directory...</div>;

  return (
    <div className="min-h-screen bg-[#0F071A] p-3 md:p-10 font-black selection:bg-[#FFD700] text-slate-950 font-serif-numbers overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-10">
        
        {/* HEADER */}
        <div className="bg-gradient-to-br from-[#4c1d95] via-[#2e1065] to-[#0F071A] p-6 md:p-12 rounded-[2rem] md:rounded-[3.5rem] border-b-[6px] md:border-b-[12px] border-[#FFD700] shadow-3xl flex items-center gap-4 md:gap-8 relative overflow-hidden">
          <button onClick={handleBack} className="bg-[#FFD700] p-3 md:p-5 rounded-[1.5rem] md:rounded-[2rem] hover:bg-white transition-all shadow-2xl active:scale-90 border-b-4 md:border-b-6 border-amber-600 flex-shrink-0 z-10">
            <span className="text-xl md:text-3xl">🔙</span>
          </button>
          <div className="z-10 min-w-0">
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl italic uppercase font-black text-white tracking-tighter leading-none truncate">Student Hub</h1>
            <p className="text-[#FFD700] mt-2 tracking-[0.2em] md:tracking-[0.4em] uppercase text-[8px] md:text-[10px] bg-black/30 inline-block px-3 md:px-4 py-1.5 rounded-full border border-white/10 truncate max-w-full">
              {gradeFilter === "ALL" ? "Master Directory" : `CLASS: GRADE ${gradeFilter}`}
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 text-[150px] opacity-5">🎓</div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search by Name, Myanmar Name or ID..." 
            className="w-full bg-[#1A0B2E] border-2 md:border-4 border-[#4c1d95] p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] text-white font-bold italic text-base md:text-xl outline-none focus:border-[#FFD700] shadow-2xl transition-all" 
            onChange={(e) => setSearch(e.target.value)} 
            value={search}
          />
          {search && (
             <button onClick={() => setSearch("")} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-2xl">✕</button>
          )}
        </div>

        {/* BACK TO GRADES BUTTON */}
        {!showGradesView && gradeFilter !== "ALL" && (
          <div className="flex items-center justify-between bg-white/5 border border-white/10 p-3 md:p-4 rounded-2xl">
            <span className="text-white font-bold italic text-sm md:text-base px-2">Showing Grade: <span className="text-[#FFD700]">{gradeFilter}</span></span>
            <button onClick={() => setGradeFilter("ALL")} className="bg-rose-500 hover:bg-rose-600 text-white text-[10px] md:text-xs font-black tracking-widest uppercase px-5 py-2.5 rounded-full shadow-lg transition-all">
               Clear Filter
            </button>
          </div>
        )}

        {/* 🌟 VIEW 1: PREMIUM GRADE FOLDERS 🌟 */}
        {showGradesView && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 pb-20 animate-in fade-in zoom-in-95 duration-500">
            {uniqueGrades.map((g, idx) => (
              <button 
                key={idx} 
                onClick={() => setGradeFilter(g)}
                className="group bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-t border-t-white/10 border-b-[6px] md:border-b-[8px] border-b-[#4c1d95] shadow-xl flex flex-col items-center justify-center gap-3 hover:-translate-y-2 hover:border-b-[#FFD700] hover:shadow-[0_20px_40px_-10px_rgba(255,215,0,0.3)] transition-all"
              >
                {/* 🌟 PREMIUM ICON: Glowing Academic Cap instead of basic Folder 🌟 */}
                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#FFD700]/10 rounded-[1.2rem] flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.1)] group-hover:bg-[#FFD700]/20 group-hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all duration-500">
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-[#FFD700] group-hover:scale-110 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                  </svg>
                </div>
                
                <h2 className="text-lg md:text-2xl font-black text-white italic mt-1 text-center break-words w-full">GRADE {g}</h2>
                <div className="bg-black/50 px-3 py-1 rounded-full">
                   <p className="text-[#FFD700] text-[8px] md:text-[9px] tracking-widest uppercase font-bold">{gradeStats[g]} Students</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 🌟 VIEW 2: STUDENT LIST (FIXED OVERFLOW) 🌟 */}
        {!showGradesView && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-40 animate-in fade-in slide-in-from-bottom-10 duration-500">
            
            {filteredStudents.length === 0 ? (
              <div className="col-span-full text-center py-20 text-white/40 font-black italic text-xl uppercase tracking-widest">
                No students found.
              </div>
            ) : (
              filteredStudents.map((s, idx) => {
                const previewImg = getDrivePreview(s.Photo_URL);
                return (
                  <button 
                    key={idx} 
                    onClick={() => router.push(`/staff/student-dir/${encodeURIComponent(s['Enrollment No.'])}`)} 
                    className="bg-[#1e1b4b] p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-b-[6px] md:border-b-[8px] border-[#4c1d95] shadow-2xl flex items-center gap-4 hover:-translate-y-2 active:scale-95 transition-all text-left group min-w-0"
                  >
                     {/* Student Photo */}
                     <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-xl md:rounded-[1rem] overflow-hidden flex items-center justify-center shadow-inner border-2 md:border-[3px] border-white/20 flex-shrink-0 relative">
                        {previewImg ? (
                          <img 
                            src={previewImg} 
                            referrerPolicy="no-referrer" 
                            className="w-full h-full object-cover" 
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : null}
                        <span className="absolute inset-0 flex items-center justify-center text-3xl opacity-20 text-white z-[-1]">👤</span>
                     </div>
                     
                     {/* 🌟 FIX: Student Info (Whitespace-normal and Line-clamp used to prevent overflow) 🌟 */}
                     <div className="flex-1 min-w-0 pr-1">
                        {/* Name will wrap up to 2 lines beautifully instead of shooting out of the box */}
                        <h3 className="text-sm md:text-base uppercase font-black italic text-white whitespace-normal break-words line-clamp-2 leading-tight mb-2 group-hover:text-[#FFD700] transition-colors">
                          {s['Name (ALL CAPITAL)']}
                        </h3>
                        
                        {/* Badges Container (Wraps cleanly if screen is small) */}
                        <div className="flex flex-wrap gap-1 mt-1">
                           <span className="text-[8px] md:text-[9px] text-purple-300 font-bold tracking-widest uppercase bg-black/40 px-2 py-1 rounded border border-white/5">
                             ID: {s['Enrollment No.']}
                           </span>
                           <span className="text-[8px] md:text-[9px] text-[#FFD700] font-black tracking-widest uppercase bg-black/40 px-2 py-1 rounded border border-white/5">
                             GRADE: {s.Grade}
                           </span>
                        </div>
                     </div>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}