"use client";
import { getPhotoUrl } from "@/lib/cloudinary";
import Image from "next/image";
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


  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ 
          action: 'getData', 
          sheetName: 'Student_Directory',
          targetGid: 1807615173
        }) });
        const data = await res.json();
        console.log('[StudentDir] GAS response:', data.success, 'rows:', data.data?.length, data.message || '');
        if (data.success) {
          setStudents(data.data || []);
          if (data.data?.length > 0) console.log('[StudentDir] First row keys:', Object.keys(data.data[0]));
        } else {
          console.error('[StudentDir] GAS error:', data.message);
        }
      } catch(e) {
        console.error('[StudentDir] Fetch error:', e);
      } finally { setLoading(false); }
    };
    fetchStudents();
  }, []);

  // Grade field — Sheet မှာ "Grade" နှင့် "Class" နှစ်ခုလုံးရှိသည်
  const getGrade = (s) => s['Grade'] || s['Class'] || s['grade'] || s['class'] || '';
  const getName  = (s) => s['Name (ALL CAPITAL)'] || s['အမည်'] || s['Name'] || '';
  const getID    = (s) => s['Enrollment No.'] || s['Registration No.'] || s['No.'] || '';
  const getHouse = (s) => s['House'] || s['Steam'] || '';
  const getType  = (s) => s['School/Hostel'] || '';
  const getSex   = (s) => s['Sex'] || '';

  const gradeStats = students.reduce((acc, s) => {
    const g = String(getGrade(s) || "").trim() || "Unknown";
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  const uniqueGrades = Object.keys(gradeStats).sort((a, b) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  const filteredStudents = students.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !search.trim() ||
      getName(s).toLowerCase().includes(q) ||
      (s['အမည်'] || '').includes(search) ||
      getID(s).toString().includes(search) ||
      (s['Registration No.'] || '').toString().includes(search) ||
      (s['Father\'s Name'] || '').toLowerCase().includes(q) ||
      (s['Mother\'s Name'] || '').toLowerCase().includes(q);
    const matchGrade = gradeFilter === "ALL" || String(getGrade(s)).trim() === String(gradeFilter).trim();
    return matchSearch && matchGrade;
  });

  const showGradesView = gradeFilter === "ALL" && search.trim() === "";


  if (loading) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse text-2xl md:text-3xl uppercase italic tracking-tighter px-6 text-center" style={{background:'#0F071A', color:'#FFD700'}}>Loading Directory...</div>;

  return (
    <div className="min-h-screen p-3 md:p-10 font-black selection:bg-gold text-slate-950 font-serif-numbers overflow-x-hidden" style={{background:'#0F071A'}}>
      <div className="mx-auto space-y-6 md:space-y-10" style={{maxWidth:'1600px'}}>
        
        {/* HEADER */}
        <div className="p-6 md:p-12 md:rounded-[3.5rem] md:border-b-[12px] shadow-3xl flex items-center gap-4 md:gap-8 relative overflow-hidden" style={{background:'linear-gradient(135deg, #4c1d95, #2e1065, #0F071A)', borderRadius:'2rem', borderBottomWidth:'6px', borderColor:'#FFD700'}}>
          <button onClick={handleBack} className="p-3 md:p-5 md:rounded-[2rem] hover:bg-white transition-all shadow-2xl active:scale-90 border-b-4 md:border-b-6 border-amber-600 flex-shrink-0 z-10" style={{background:'#FFD700', borderRadius:'1.5rem'}}>
            <span className="text-xl md:text-3xl">🔙</span>
          </button>
          <div className="z-10 min-w-0">
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl italic uppercase font-black text-white tracking-tighter leading-none truncate">Student Hub</h1>
            <p className="mt-2 md:tracking-[0.4em] uppercase md:text-[10px] bg-black/30 inline-block px-3 md:px-4 py-1.5 rounded-full border border-white/10 truncate max-w-full" style={{color:'#FFD700', letterSpacing:'0.2em', fontSize:'8px'}}>
              {gradeFilter === "ALL" ? "Master Directory" : `CLASS: GRADE ${gradeFilter}`}
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-5" style={{fontSize:'150px'}}>🎓</div>
        </div>
        {/* SEARCH BAR */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search by Name, Myanmar Name or ID..." 
            className="w-full border-2 md:border-4 p-5 md:p-8 md:rounded-[2.5rem] text-white font-bold italic text-base md:text-xl outline-none focus:border-[#FFD700] shadow-2xl transition-all" style={{background:'#1A0B2E', borderColor:'#4c1d95', borderRadius:'1.5rem'}} 
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
            <span className="text-white font-bold italic text-sm md:text-base px-2">Showing Grade: <span className="" style={{color:'#FFD700'}}>{gradeFilter}</span></span>
            <button onClick={() => setGradeFilter("ALL")} className="bg-rose-500 hover:bg-rose-600 text-white md:text-xs font-black tracking-widest uppercase px-5 py-2.5 rounded-full shadow-lg transition-all" style={{fontSize:'10px'}}>
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
                onClick={() => setGradeFilter(String(g).trim())}
                className="group p-6 md:p-8 md:rounded-[2.5rem] border-t border-t-white/10 md:border-b-[8px] shadow-xl flex flex-col items-center justify-center gap-3 hover:-translate-y-2 hover:border-b-[#FFD700] hover:shadow-[0_20px_40px_-10px_rgba(255,215,0,0.3)] transition-all" style={{background:'linear-gradient(135deg, #1e1b4b, #0f172a)', borderRadius:'2rem', borderBottomWidth:'6px', borderBottomWidth:'#4c1d95'}}
              >
                {/* 🌟 PREMIUM ICON: Glowing Academic Cap instead of basic Folder 🌟 */}
                <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.1)] group-hover:bg-gold/20 group-hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all duration-500" style={{background:'#FFD700', borderRadius:'1.2rem'}}>
                  <svg className="w-8 h-8 md:w-10 md:h-10 group-hover:scale-110 transition-transform duration-500" style={{color:'#FFD700'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                  </svg>
                </div>
                
                <h2 className="text-lg md:text-2xl font-black text-white italic mt-1 text-center break-words w-full">GRADE {g}</h2>
                <div className="bg-black/50 px-3 py-1 rounded-full">
                   <p className="md:text-[9px] tracking-widest uppercase font-bold" style={{color:'#FFD700', fontSize:'8px'}}>{gradeStats[g]} Students</p>
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
                const previewImg = getPhotoUrl(s.Photo_URL);
                return (
                  <button 
                    key={idx} 
                    onClick={() => router.push(`/staff/student-dir/${encodeURIComponent(getID(s))}`)}
                    className="p-4 md:p-6 md:rounded-[2rem] md:border-b-[8px] shadow-2xl flex items-center gap-4 hover:-translate-y-2 active:scale-95 transition-all text-left group min-w-0" style={{background:'#1e1b4b', borderRadius:'1.5rem', borderBottomWidth:'6px', borderColor:'#4c1d95'}}
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
                        <p style={{fontSize:'9px', color:'#a78bfa', fontWeight:900, letterSpacing:'0.08em', marginBottom:'2px'}}>
                          {s['အမည်'] || ''}
                        </p>
                        <h3 className="text-sm md:text-base uppercase font-black italic text-white whitespace-normal break-words line-clamp-2 leading-tight mb-2 group-hover:text-gold transition-colors">
                          {getName(s)}
                        </h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                           <span className="md:text-[9px] text-purple-300 font-bold tracking-widest uppercase bg-black/40 px-2 py-1 rounded border border-white/5" style={{fontSize:'8px'}}>
                             {getID(s)}
                           </span>
                           <span className="md:text-[9px] font-black tracking-widest uppercase bg-black/40 px-2 py-1 rounded border border-white/5" style={{fontSize:'8px', color:'#FFD700'}}>
                             G{getGrade(s)}
                           </span>
                           {getHouse(s) ? (
                             <span className="md:text-[9px] font-black tracking-widest uppercase bg-black/40 px-2 py-1 rounded border border-white/5" style={{fontSize:'8px', color:'#34d399'}}>
                               🏠 {getHouse(s)}
                             </span>
                           ) : null}
                           {getType(s) ? (
                             <span className="md:text-[9px] font-black tracking-widest uppercase bg-black/40 px-2 py-1 rounded border border-white/5" style={{fontSize:'8px', color:'#94a3b8'}}>
                               {getType(s) === 'Hostel' ? '🏠 Hostel' : '🏫 Day'}
                             </span>
                           ) : null}
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