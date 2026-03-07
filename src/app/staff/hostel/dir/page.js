"use client";
import { getPhotoUrl } from "@/lib/cloudinary";
import Image from "next/image";
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
    <div className="min-h-screen flex items-center justify-center font-black animate-pulse text-3xl uppercase italic tracking-tighter" style={{background:'#0F071A', color:'#fbbf24'}}>
      Authorizing Resident Archive...
    </div>
  );

  return (
    <div className="min-h-screen p-6 md:p-14 font-black selection:bg-gold text-slate-950" style={{background:'#0F071A'}}>
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* HEADER & TOTAL [cite: 2026-02-25] */}
        <div className="p-10 md:p-16 shadow-3xl flex flex-col md:flex-row justify-between items-center gap-10" style={{background:'linear-gradient(135deg, #0d9488, #115e59, #0F071A)', borderRadius:'4rem', borderBottomWidth:'15px', borderColor:'#fbbf24'}}>
          <div className="flex items-center gap-6">
            <button onClick={() => router.push('/staff/hostel')} className="p-6 hover:bg-white transition-all shadow-2xl active:scale-90 border-b-6 border-amber-600 group" style={{background:'#fbbf24', borderRadius:'2.5rem'}}>
              <span className="text-3xl group-hover:scale-125 inline-block">🔙</span>
            </button>
            <h1 className="text-5xl md:text-8xl italic uppercase font-black text-white tracking-tighter leading-none">Resident Log</h1>
          </div>
          <div className="bg-white/10 p-8 px-12 border border-white/10 text-center" style={{borderRadius:'3rem'}}>
            <p className="text-5xl font-black italic leading-none" style={{color:'#fbbf24'}}>{residents.length}</p>
            <p className="text-white/40 uppercase mt-3 font-black" style={{fontSize:'9px', letterSpacing:'0.4em'}}>Total Residents [cite: 2026-02-25]</p>
          </div>
        </div>

        {/* SEX RATIO DASHBOARD (ကျား/မ) [cite: 2026-02-25] */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-white p-12 border-blue-600 shadow-3xl flex justify-between items-center group transition-all hover:translate-y-[-5px]" style={{borderRadius:'4rem', borderBottomWidth:'15px'}}>
            <div>
              <p className="font-black uppercase text-slate-400 tracking-widest italic mb-3" style={{fontSize:'11px'}}>Male (ကျား)</p>
              <p className="text-7xl font-black text-blue-600 italic leading-none">{maleResidents.length}</p>
            </div>
            <span className="text-8xl opacity-10 group-hover:opacity-100 transition-opacity">👦</span>
          </div>
          <div className="bg-white p-12 border-rose-500 shadow-3xl flex justify-between items-center group transition-all hover:translate-y-[-5px]" style={{borderRadius:'4rem', borderBottomWidth:'15px'}}>
            <div>
              <p className="font-black uppercase text-slate-400 tracking-widest italic mb-3" style={{fontSize:'11px'}}>Female (မ)</p>
              <p className="text-7xl font-black text-rose-500 italic leading-none">{femaleResidents.length}</p>
            </div>
            <span className="text-8xl opacity-10 group-hover:opacity-100 transition-opacity">👧</span>
          </div>
        </div>

        {/* SEARCH PROTOCOL [cite: 2026-02-25] */}
        <input 
          type="text" 
          placeholder="ရှာဖွေလိုသည့် အမည် သို့မဟုတ် ID ရိုက်ထည့်ပါ..." 
          className="w-full bg-white/5 border-4 border-white/10 p-8 font-black italic text-2xl outline-none focus:border-gold shadow-2xl placeholder:opacity-10" style={{borderRadius:'3rem', color:'#fbbf24'}} 
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* GRADE-WISE LISTING [cite: 2026-02-25] */}
        <div className="space-y-20 pb-40">
          {grades.map((grade, gIdx) => (
            <div key={gIdx} className="space-y-10">
              <div className="flex items-center gap-6 pl-8" style={{borderLeftWidth:'10px', borderColor:'#fbbf24'}}>
                <h2 className="text-4xl uppercase italic font-black tracking-tighter" style={{color:'#fbbf24'}}>GRADE: {grade}</h2>
                <span className="bg-white/10 px-6 py-2 rounded-full text-white/40 font-black italic tracking-widest uppercase" style={{fontSize:'10px'}}>
                  {filtered.filter(s => s.Grade === grade).length} Active Residents
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filtered.filter(s => s.Grade === grade).map((s, idx) => (
                  <div key={idx} className="bg-white p-10 border-teal-900 shadow-3xl flex items-center gap-8 group transition-all hover:scale-105" style={{borderRadius:'4rem', borderBottomWidth:'15px'}}>
                    <div className="w-24 h-24 bg-slate-50 flex items-center justify-center text-5xl shadow-inner border-4 border-white group-hover:border-teal-500 overflow-hidden shrink-0 transition-colors" style={{borderRadius:'2.5rem'}}>
                      {s.Photo_URL ? (
                        <img src={`https://drive.google.com/thumbnail?id=${s.Photo_URL.split('id=')[1]?.split('&')[0]}&sz=w300`} className="w-full h-full object-cover" />
                      ) : (s['Sex']?.toString().trim() === "ကျား" ? "👦" : "👧")}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase italic shadow-sm ${s['Sex']?.toString().trim() === "ကျား" ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-600'}`}>
                          {s['Sex'] || "N/A"}
                        </span>
                        <span className="text-slate-300 font-black uppercase italic tracking-widest leading-none" style={{fontSize:'8px'}}>Registry Record</span>
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
            <div className="text-center py-40 bg-white/5 border-4 border-dashed border-white/5" style={{borderRadius:'5rem'}}>
              <p className="text-white/10 text-3xl font-black uppercase italic" style={{letterSpacing:'0.5em'}}>No Resident Data Found</p>
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