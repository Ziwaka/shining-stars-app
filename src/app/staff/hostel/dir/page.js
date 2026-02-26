"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL, GIDS } from '@/lib/api';

/**
 * Shining Stars - Hostel Resident Master (v2.1)
 * FEATURE: Fixed Sex Filter for "ကျား" & "မ" + Grade Grouping [cite: 2026-02-25]
 * STYLE: Slate-950 Bold Luxury | Teal & Gold [cite: 2023-02-23]
 */
export default function HostelResidentRegistryV2() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || "null");
    if (!auth || auth['Can_Manage_Hostel'] !== true) { router.push('/staff'); return; }

    const fetchRegistry = async () => {
      try {
        const res = await fetch(WEB_APP_URL, { 
          method: 'POST', 
          body: JSON.stringify({ action: 'getData', targetGid: GIDS.STUDENT_DIR }) 
        });
        const result = await res.json();
        
        if (result.success) {
          // FILTER: Only Column AB = "Hostel" [cite: 2026-02-25]
          const hostelOnly = result.data.filter(s => 
            s['School/Hostel']?.toString().trim().toLowerCase() === "hostel"
          );
          setResidents(hostelOnly);
        }
      } catch (err) {
        console.error("Registry Sync Failure.");
      } finally {
        setLoading(false);
      }
    };
    fetchRegistry();
  }, [router]);

  // SEX ANALYTICS (Column F: ကျား/မ) [cite: 2026-02-25]
  const maleResidents = residents.filter(s => s['Sex']?.toString().trim() === "ကျား");
  const femaleResidents = residents.filter(s => s['Sex']?.toString().trim() === "မ");

  // GROUPING: Grade-wise [cite: 2026-02-25]
  const grades = [...new Set(residents.map(s => s.Grade).filter(Boolean))].sort();

  const filtered = residents.filter(s => 
    s['Name (ALL CAPITAL)']?.toLowerCase().includes(search.toLowerCase()) ||
    s['Enrollment No.']?.toString().includes(search)
  );

  if (loading) return (
    <div className="min-h-screen bg-[#0F071A] flex items-center justify-center font-black text-[#fbbf24] animate-pulse text-3xl uppercase italic tracking-tighter">
      Authorizing Resident Archive...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F071A] p-6 md:p-14 font-black selection:bg-[#fbbf24] text-slate-950">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* HEADER & TOTAL [cite: 2026-02-25] */}
        <div className="bg-gradient-to-br from-[#0d9488] via-[#115e59] to-[#0F071A] p-10 md:p-16 rounded-[4rem] border-b-[15px] border-[#fbbf24] shadow-3xl flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-6">
            <button onClick={() => router.push('/staff/hostel')} className="bg-[#fbbf24] p-6 rounded-[2.5rem] hover:bg-white transition-all shadow-2xl active:scale-90 border-b-6 border-amber-600 group">
              <span className="text-3xl group-hover:scale-125 inline-block">🔙</span>
            </button>
            <h1 className="text-5xl md:text-8xl italic uppercase font-black text-white tracking-tighter leading-none">Resident Log</h1>
          </div>
          <div className="bg-white/10 p-8 px-12 rounded-[3rem] border border-white/10 text-center">
            <p className="text-[#fbbf24] text-5xl font-black italic leading-none">{residents.length}</p>
            <p className="text-white/40 text-[9px] uppercase tracking-[0.4em] mt-3 font-black">Total Residents [cite: 2026-02-25]</p>
          </div>
        </div>

        {/* SEX RATIO DASHBOARD (ကျား/မ) [cite: 2026-02-25] */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-white p-12 rounded-[4rem] border-b-[15px] border-blue-600 shadow-3xl flex justify-between items-center group transition-all hover:translate-y-[-5px]">
            <div>
              <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest italic mb-3">Male (ကျား)</p>
              <p className="text-7xl font-black text-blue-600 italic leading-none">{maleResidents.length}</p>
            </div>
            <span className="text-8xl opacity-10 group-hover:opacity-100 transition-opacity">👦</span>
          </div>
          <div className="bg-white p-12 rounded-[4rem] border-b-[15px] border-rose-500 shadow-3xl flex justify-between items-center group transition-all hover:translate-y-[-5px]">
            <div>
              <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest italic mb-3">Female (မ)</p>
              <p className="text-7xl font-black text-rose-500 italic leading-none">{femaleResidents.length}</p>
            </div>
            <span className="text-8xl opacity-10 group-hover:opacity-100 transition-opacity">👧</span>
          </div>
        </div>

        {/* SEARCH PROTOCOL [cite: 2026-02-25] */}
        <input 
          type="text" 
          placeholder="ရှာဖွေလိုသည့် အမည် သို့မဟုတ် ID ရိုက်ထည့်ပါ..." 
          className="w-full bg-white/5 border-4 border-white/10 p-8 rounded-[3rem] text-[#fbbf24] font-black italic text-2xl outline-none focus:border-[#fbbf24] shadow-2xl placeholder:opacity-10" 
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* GRADE-WISE LISTING [cite: 2026-02-25] */}
        <div className="space-y-20 pb-40">
          {grades.map((grade, gIdx) => (
            <div key={gIdx} className="space-y-10">
              <div className="flex items-center gap-6 border-l-[10px] border-[#fbbf24] pl-8">
                <h2 className="text-4xl uppercase italic text-[#fbbf24] font-black tracking-tighter">GRADE: {grade}</h2>
                <span className="bg-white/10 px-6 py-2 rounded-full text-[10px] text-white/40 font-black italic tracking-widest uppercase">
                  {filtered.filter(s => s.Grade === grade).length} Active Residents
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filtered.filter(s => s.Grade === grade).map((s, idx) => (
                  <div key={idx} className="bg-white p-10 rounded-[4rem] border-b-[15px] border-teal-900 shadow-3xl flex items-center gap-8 group transition-all hover:scale-105">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-5xl shadow-inner border-4 border-white group-hover:border-teal-500 overflow-hidden shrink-0 transition-colors">
                      {s.Photo_URL ? (
                        <img src={`https://drive.google.com/thumbnail?id=${s.Photo_URL.split('id=')[1]?.split('&')[0]}&sz=w300`} className="w-full h-full object-cover" />
                      ) : (s['Sex']?.toString().trim() === "ကျား" ? "👦" : "👧")}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase italic shadow-sm ${s['Sex']?.toString().trim() === "ကျား" ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-600'}`}>
                          {s['Sex'] || "N/A"}
                        </span>
                        <span className="text-[8px] text-slate-300 font-black uppercase italic tracking-widest leading-none">Registry Record</span>
                      </div>
                      <h3 className="text-2xl font-black italic text-slate-950 uppercase leading-none truncate mb-3">{s['Name (ALL CAPITAL)']}</h3>
                      <p className="text-sm text-teal-600 font-black tracking-widest uppercase leading-none">ID: {s['Enrollment No.']}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {filtered.length === 0 && (
            <div className="text-center py-40 bg-white/5 rounded-[5rem] border-4 border-dashed border-white/5">
              <p className="text-white/10 text-3xl font-black uppercase italic tracking-[0.5em]">No Resident Data Found</p>
            </div>
          )}
        </div>

      </div>
      <style jsx global>{`
        body { font-weight: 900 !important; color: #020617 !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fbbf24; border-radius: 20px; border: 3px solid #0F071A; }
      `}</style>
    </div>
  );
}