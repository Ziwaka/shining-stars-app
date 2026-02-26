"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL, GIDS } from '@/lib/api';

/**
 * Shining Stars - Staff Administrative Directory (v73.0)
 * FIXED: Removed redundant paths from Header [cite: 2026-02-25]
 * PATH: src/app/staff/profile/page.js [cite: 2026-02-25]
 * FEATURES: Student Card Grid, Modal Detail (35 Columns), ID/Name Search
 */
export default function AdministrativeStudentRegistry() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inspect, setInspect] = useState(null);
  const router = useRouter();

  const getImageUrl = (url) => {
    if (!url || url === "-" || url === "") return "/logo.jpg";
    try {
      const fileId = url.includes('id=') ? url.split('id=')[1]?.split('&')[0] : (url.includes('/d/') ? url.split('/d/')[1]?.split('/')[0] : url);
      return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : "/logo.jpg";
    } catch (e) { return "/logo.jpg"; }
  };

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || "null");
    if (!auth || auth.Can_View_Student !== true) { router.push('/staff'); return; }

    const fetchData = async () => {
      try {
        const res = await fetch(WEB_APP_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'getData', targetGid: GIDS.STUDENT_DIR })
        });
        const result = await res.json();
        if (result.success) setStudents(result.data);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [router]);

  // SEARCH LOGIC: Enrollment No. or Full Name [cite: 2026-02-25]
  const filtered = students.filter(s => 
    s['Name (ALL CAPITAL)']?.toLowerCase().includes(search.toLowerCase()) ||
    s['Enrollment No.']?.toString().includes(search)
  );

  if (loading) return <div className="min-h-screen bg-[#0F071A] flex items-center justify-center font-black text-[#fbbf24] animate-pulse italic uppercase">AUTHORIZING ARCHIVE ACCESS...</div>;

  return (
    <div className="min-h-screen bg-[#0F071A] p-6 md:p-14 font-black selection:bg-[#fbbf24]">
      <div className="max-w-[1700px] mx-auto space-y-12">
        
        {/* CLEAN HEADER - No Redundant Paths [cite: 2026-02-25] */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-10 bg-white/5 p-12 rounded-[4rem] border-b-8 border-[#fbbf24] shadow-3xl">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-7xl uppercase italic font-black text-white tracking-tighter">Student Registry</h1>
            <p className="text-[#fbbf24] text-xs uppercase tracking-[0.5em] mt-2 italic">Administrative Control Hub</p>
          </div>
          <div className="w-full lg:w-[45rem]">
            <input 
              type="text" 
              placeholder="SEARCH BY ENROLLMENT ID OR STUDENT NAME..." 
              className="w-full bg-[#0F071A] border-4 border-white/10 p-7 rounded-[2.5rem] text-[#fbbf24] outline-none focus:border-[#fbbf24] font-black italic shadow-2xl text-xl"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* INDIVIDUAL STUDENT CARDS GRID [cite: 2026-02-25] */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10">
          {filtered.map((s, idx) => (
            <div 
              key={idx} 
              onClick={() => setInspect(s)}
              className="bg-white/5 p-1 rounded-[3.5rem] hover:bg-[#fbbf24]/10 transition-all cursor-pointer border border-white/10 shadow-2xl group"
            >
              <div className="bg-[#1A0B2E] p-10 rounded-[3.4rem] h-full flex flex-col items-center space-y-8 relative overflow-hidden">
                <div className="absolute top-6 right-8 bg-[#fbbf24] text-[#020617] px-4 py-1 rounded-full text-[10px] font-black uppercase italic shadow-md">ID: {s['Enrollment No.']}</div>
                
                <div className="w-44 h-44 rounded-[3rem] overflow-hidden border-8 border-white/5 shadow-2xl transition-transform group-hover:scale-105">
                  <img src={getImageUrl(s.Photo_URL)} className="w-full h-full object-cover" alt="Student" />
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-3xl uppercase font-black italic text-white leading-tight">{s['Name (ALL CAPITAL)']}</h3>
                  <p className="text-[#fbbf24] text-lg font-black italic">{s['Grade'] || s['အမည်'] || "No Entry"}</p>
                </div>

                <div className="w-full grid grid-cols-2 gap-4 border-t border-white/5 pt-6 font-black italic">
                   <div className="text-center">
                     <p className="text-[9px] uppercase text-white/30 tracking-widest">House (AF32)</p>
                     <p className="text-sm text-rose-400 uppercase">{s.House || "-"}</p>
                   </div>
                   <div className="text-center">
                     <p className="text-[9px] uppercase text-white/30 tracking-widest">Steam (AE31)</p>
                     <p className="text-sm text-blue-400 uppercase">{s.Steam || "-"}</p>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL: 35-COLUMN FULL DOSSIER [cite: 2026-02-15, 2026-02-25] */}
        {inspect && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-[#020617]/98 backdrop-blur-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-[#1A0B2E] w-full max-w-7xl max-h-[85vh] overflow-y-auto rounded-[5rem] border-4 border-[#fbbf24]/30 p-12 md:p-24 relative shadow-[0_0_150px_rgba(0,0,0,1)]">
              <button onClick={() => setInspect(null)} className="absolute top-12 right-12 text-white hover:text-red-500 text-5xl font-black">✕</button>
              
              <div className="flex flex-col md:flex-row gap-16 items-center mb-20 border-b-4 border-white/5 pb-20">
                <img src={getImageUrl(inspect.Photo_URL)} className="w-64 h-64 md:w-80 md:h-80 rounded-[5rem] object-cover border-[12px] border-white/5 shadow-2xl" alt="Ledger" />
                <div className="text-center md:text-left space-y-6">
                  <h2 className="text-6xl md:text-[8rem] italic uppercase font-black text-white leading-none tracking-tighter">{inspect['Name (ALL CAPITAL)']}</h2>
                  <p className="text-[#fbbf24] text-3xl uppercase tracking-[0.5em] italic font-black">Archive Record: {inspect['Enrollment No.']}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 font-black italic">
                {Object.entries(inspect).map(([key, value]) => (
                  key !== "Photo_URL" && (
                    <div key={key} className="bg-white/5 p-8 rounded-[2.5rem] border-2 border-white/5 hover:border-[#fbbf24]/30 transition-all">
                      <span className="text-xs text-[#fbbf24] uppercase tracking-widest font-black">{key}</span>
                      <p className="text-white text-2xl mt-3 truncate">{value || "-"}</p>
                    </div>
                  )
                ))}
              </div>
              <div className="mt-24 text-center">
                 <button onClick={() => setInspect(null)} className="px-24 py-8 bg-[#fbbf24] text-[#020617] rounded-full text-xl uppercase italic font-black hover:scale-105 transition-all shadow-3xl border-b-8 border-amber-600">Close Dossier Access</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}