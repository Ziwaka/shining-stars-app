"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL, GIDS } from '@/lib/api';

/**
 * Shining Stars - Dormitory Analytics Dashboard (v2.1 Master)
 * FEATURE: Combined Gender Analytics Card + Real-time Student_DIR Sync [cite: 2026-02-25]
 * STYLE: Slate-950 Bold Luxury | Teal, Blue & Rose Theme [cite: 2023-02-23]
 */
export default function HostelDashboardCombined() {
  const [students, setStudents] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [sRes, fRes] = await Promise.all([
          fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getData', targetGid: GIDS.STUDENT_DIR }) }),
          fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getData', sheetName: 'Hostel_Facilities' }) })
        ]);
        const sData = await sRes.json();
        const fData = await fRes.json();

        if (sData.success) setStudents(sData.data);
        if (fData.success) setFacilities(fData.data);
      } catch (err) {
        console.error("Dashboard Sync Protocol Failed.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // RESIDENT ANALYTICS (Column AB = Hostel) [cite: 2026-02-25]
  const residents = students.filter(s => s['School/Hostel']?.toString().trim().toLowerCase() === "hostel");
  
  // SEX RATIO (Column F = ကျား/မ) [cite: 2026-02-25]
  const maleCount = residents.filter(s => s['Sex']?.toString().trim() === "ကျား").length;
  const femaleCount = residents.filter(s => s['Sex']?.toString().trim() === "မ").length;

  // MAINTENANCE LOGIC [cite: 2026-02-25]
  const needRepair = facilities.reduce((sum, item) => sum + (Number(item.Need_Repair) || 0), 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-black animate-pulse text-3xl uppercase italic tracking-tighter" style={{background:'#0F071A', color:'#fbbf24'}}>
      Scanning Dormitory Hub...
    </div>
  );

  return (
    <div className="min-h-screen p-6 md:p-14 font-black selection:bg-gold text-slate-950" style={{background:'#0F071A'}}>
      <div className="mx-auto space-y-12" style={{maxWidth:'1700px'}}>
        
        {/* HEADER & NAVIGATION [cite: 2026-02-25] */}
        <div className="p-10 md:p-16 shadow-3xl flex flex-col md:flex-row justify-between items-center gap-10" style={{background:'linear-gradient(135deg, #0d9488, #115e59, #0F071A)', borderRadius:'4rem', borderBottomWidth:'15px', borderColor:'#fbbf24'}}>
          <div className="flex items-center gap-6">
            <button onClick={() => router.push('/staff')} className="p-6 hover:bg-white transition-all shadow-2xl active:scale-90 border-b-6 border-amber-600 group" style={{background:'#fbbf24', borderRadius:'2.5rem'}}>
              <span className="text-3xl group-hover:rotate-[-20deg] inline-block transition-transform">🔙</span>
            </button>
            <button onClick={() => router.push('/')} className="bg-white/10 p-6 hover:bg-white/20 transition-all border border-white/10 group" style={{borderRadius:'2.5rem'}}>
              <span className="text-3xl group-hover:scale-110 inline-block transition-transform">🏠</span>
            </button>
            <h1 className="text-5xl md:text-8xl italic uppercase font-black text-white tracking-tighter leading-none ml-4">Hostel Hub</h1>
          </div>
          <p className="uppercase font-black italic opacity-80 leading-none" style={{color:'#fbbf24', fontSize:'10px', letterSpacing:'0.6em'}}>Security Protocol v2.1 [cite: 2026-02-25]</p>
        </div>

        {/* ANALYTICS SUMMARY (3 CARD LAYOUT) [cite: 2026-02-25] */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CARD 1: TOTAL [cite: 2026-02-25] */}
          <div className="bg-white p-12 border-teal-100 shadow-3xl flex justify-between items-center group transition-all hover:translate-y-[-10px]" style={{borderRadius:'4rem', borderBottomWidth:'15px'}}>
            <div>
              <p className="font-black uppercase text-slate-400 mb-2" style={{fontSize:'10px', letterSpacing:'0.3em'}}>Total Residents</p>
              <p className="text-7xl font-black italic tracking-tighter text-teal-600 leading-none">{residents.length}</p>
              <p className="font-black uppercase text-teal-900/30 mt-4 italic" style={{fontSize:'9px', letterSpacing:'0.2em'}}>Active Students [cite: 2026-02-25]</p>
            </div>
            <span className="text-8xl grayscale opacity-5 group-hover:opacity-100 transition-all">🏠</span>
          </div>

          {/* CARD 2: COMBINED GENDER (ကျား + မ) [cite: 2026-02-25] */}
          <div className="bg-white p-12 border-slate-100 shadow-3xl group transition-all hover:translate-y-[-10px]" style={{borderRadius:'4rem', borderBottomWidth:'15px'}}>
             <p className="font-black uppercase text-slate-400 mb-6" style={{fontSize:'10px', letterSpacing:'0.3em'}}>Resident Distribution</p>
             <div className="flex items-center justify-between gap-4">
                <div className="flex-1 text-center border-r-4 border-slate-50">
                   <p className="text-5xl font-black italic text-blue-600 leading-none">{maleCount}</p>
                   <p className="font-black uppercase text-blue-400 mt-2 italic tracking-widest" style={{fontSize:'10px'}}>ကျား (Male)</p>
                </div>
                <div className="flex-1 text-center">
                   <p className="text-5xl font-black italic text-rose-500 leading-none">{femaleCount}</p>
                   <p className="font-black uppercase text-rose-400 mt-2 italic tracking-widest" style={{fontSize:'10px'}}>မ (Female)</p>
                </div>
             </div>
             <div className="mt-8 h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-600 transition-all" style={{ width: `${(maleCount/residents.length)*100}%` }}></div>
                <div className="h-full bg-rose-500 transition-all" style={{ width: `${(femaleCount/residents.length)*100}%` }}></div>
             </div>
          </div>

          {/* CARD 3: MAINTENANCE [cite: 2026-02-25] */}
          <div className="bg-white p-12 border-amber-100 shadow-3xl flex justify-between items-center group transition-all hover:translate-y-[-10px]" style={{borderRadius:'4rem', borderBottomWidth:'15px'}}>
            <div>
              <p className="font-black uppercase text-slate-400 mb-2" style={{fontSize:'10px', letterSpacing:'0.3em'}}>Maintenance Alerts</p>
              <p className="text-7xl font-black italic tracking-tighter text-amber-500 leading-none">{needRepair}</p>
              <p className="font-black uppercase text-amber-900/30 mt-4 italic" style={{fontSize:'9px', letterSpacing:'0.2em'}}>Items Need Repair [cite: 2026-02-25]</p>
            </div>
            <span className="text-7xl grayscale opacity-5 group-hover:grayscale-0 group-hover:opacity-100 transition-all">🛠️</span>
          </div>

        </div>

        {/* ACCESS MODULES [cite: 2026-02-25] */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <ModuleCard 
            title="Resident Directory" 
            desc="Grade-wise listing & sex-ratio registry" 
            icon="🛏️" 
            path="/staff/hostel/dir" 
            color="bg-teal-600"
            footer={`${maleCount} ကျား • ${femaleCount} မ`}
          />
          <ModuleCard 
            title="Facility Monitoring" 
            desc="Inventory control & repair registry" 
            icon="🧹" 
            path="/staff/hostel/facilities" 
            color="bg-indigo-600"
            footer={`${facilities.length} ASSETS LOGGED`}
          />
        </div>

        <div className="text-center pt-20">
          <p className="text-white/10 font-black uppercase" style={{fontSize:'10px', letterSpacing:'1em'}}>Secure Hub Authorization Required • v2.1</p>
        </div>

      </div>
      <style jsx global>{` body { font-weight: 900 !important; color: #020617 !important; } `}</style>
    </div>
  );
}

function ModuleCard({ title, desc, icon, path, color, footer }) {
  const router = useRouter();
  return (
    <button onClick={() => router.push(path)} className="bg-white/5 border-2 border-white/5 p-14 text-left group hover:bg-white/10 hover:border-gold transition-all relative overflow-hidden active:scale-95 shadow-2xl" style={{borderRadius:'5rem'}}>
      <div className={`w-24 h-24 rounded-3xl ${color} flex items-center justify-center text-5xl mb-10 shadow-3xl group-hover:rotate-12 transition-transform`}>
        {icon}
      </div>
      <h2 className="text-4xl md:text-5xl font-black uppercase italic text-white mb-4 tracking-tighter leading-none">{title}</h2>
      <p className="text-white/30 font-black uppercase leading-relaxed mb-6" style={{fontSize:'11px', letterSpacing:'0.2em'}}>{desc}</p>
      <div className="inline-block px-6 py-2 rounded-full font-black uppercase text-slate-900" style={{background:'#fbbf24', fontSize:'9px', letterSpacing:'0.3em'}}>{footer}</div>
      <div className="absolute bottom-10 right-14 w-20 h-2 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-right duration-500" style={{background:'#fbbf24'}}></div>
    </button>
  );
}