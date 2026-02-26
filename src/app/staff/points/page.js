"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Shining Stars - Staff & Management Access Hub (v14.0 Pro Flow)
 * FIX: Unlocked House Score Adjust for Staff members [cite: 2026-02-26]
 * FEATURE: Grouped access to Student, Staff, and Financial modules [cite: 2026-02-26]
 * STYLE: Professional Soft Blue (#F0F9FF) & Slate-950 Bold Luxury [cite: 2023-02-23]
 */
export default function StaffAccessHub() {
  const [user, setUser] = useState(null);
  const [isGM, setIsGM] = useState(false); 
  const router = useRouter();

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || "null");
    if (!auth) { 
      router.push('/login'); 
    } else {
      setUser(auth);
      if (auth.userRole === 'management') {
        setIsGM(true);
      }
    }
  }, [router]);

  // 🌟 MASTER ACCESS DEFINITIONS
  const toolGroups = [
    {
      group: "Student & House Operations",
      items: [
        { name: 'Student Directory', path: '/staff/student-dir', icon: '👤', locked: false },
        { name: 'Hostel Hub', path: '/staff/hostel', icon: '🏠', locked: false },
        // 🌟 UNLOCKED: Staff တွေ အမှတ်ပေးလို့ရအောင် ပြန်ဖွင့်ပေးလိုက်ပါပြီ [cite: 2026-02-26]
        { name: 'House Score Adjust', path: '/staff/points', icon: '⚖️', locked: false } 
      ]
    },
    {
      group: "Staff & Internal Registry",
      items: [
        // Restricted to GM only
        { name: 'Staff Directory', path: '/staff/staff-dir', icon: '👔', locked: true },
        { name: 'Leave Hub (Staff)', path: '/management/leave', icon: '📄', locked: true },
        { name: 'Staff Performance', path: '/management/performance', icon: '🏆', locked: true }
      ]
    },
    {
      group: "Administrative & Finance",
      items: [
        { name: 'Financial Registry', path: '/staff/fees', icon: '💰', locked: false },
        { name: 'Registry Notes', path: '/staff/notes', icon: '📒', locked: false },
        { name: 'Mgt Dashboard', path: '/management/mgt-dashboard', icon: '🛡️', locked: true }
      ]
    }
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F0F9FF] font-black text-slate-950 p-6 md:p-14 pb-48">
      <div className="max-w-[1500px] mx-auto space-y-16">
        
        {/* SUPREMACY HEADER */}
        <div className="bg-slate-950 rounded-[4rem] p-10 md:p-16 border-b-[15px] border-[#fbbf24] shadow-3xl flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#fbbf24]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="relative z-10 shrink-0">
            <div className="w-24 h-24 md:w-40 md:h-40 bg-white rounded-[2.5rem] flex items-center justify-center text-5xl md:text-7xl shadow-2xl border-4 border-[#fbbf24]">
               {isGM ? "🏛️" : "👤"}
            </div>
          </div>

          <div className="text-center md:text-left flex-1 z-10">
            <div className="inline-block px-4 py-1.5 bg-[#fbbf24] text-slate-950 text-[10px] font-black uppercase rounded-lg mb-4 tracking-[0.2em] shadow-md">
               {isGM ? "General Manager Authority" : "Educational Staff Pathway"}
            </div>
            <h1 className="text-4xl md:text-7xl italic uppercase font-black text-white tracking-tighter leading-none mb-4">
               {user.Name || user.username}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
               <span className="text-[#fbbf24] text-xl md:text-2xl font-black italic tracking-widest uppercase">• ID: {user.Student_ID || user.id || "STAFF-PRO"}</span>
               <span className="h-4 w-px bg-white/20 hidden md:block"></span>
               <p className="text-slate-400 text-xs md:text-sm uppercase font-black tracking-[0.3em] italic">Status: <span className="text-white">Authorized Access</span></p>
            </div>
          </div>
        </div>

        {/* ACCESS GRID */}
        <div className="space-y-16">
          {toolGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-8">
              <h2 className="text-xl md:text-2xl uppercase italic border-l-8 border-slate-950 pl-6 tracking-tight text-slate-950">
                {group.group}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {group.items.map((tool, i) => {
                  // 🌟 Logic: Unlock everything for GM, or follow individual 'locked' status for Staff [cite: 2026-02-26]
                  const effectivelyLocked = isGM ? false : tool.locked;

                  return (
                    <button
                      key={i}
                      onClick={() => !effectivelyLocked && router.push(tool.path)}
                      className={`relative group p-10 rounded-[3rem] border-b-[12px] transition-all duration-300 flex flex-col items-center text-center gap-6 shadow-xl
                        ${effectivelyLocked 
                          ? 'bg-slate-200 border-slate-300 opacity-60 cursor-not-allowed' 
                          : 'bg-white border-slate-100 hover:border-[#fbbf24] hover:-translate-y-2 active:scale-95'
                        }`}
                    >
                      <span className={`text-6xl md:text-7xl transition-transform duration-500 ${!effectivelyLocked && 'group-hover:scale-125'}`}>
                        {tool.icon}
                      </span>
                      
                      <div className="space-y-2">
                        <h3 className={`text-lg md:text-xl font-black uppercase italic tracking-tighter ${effectivelyLocked ? 'text-slate-400' : 'text-slate-950'}`}>
                          {tool.name}
                        </h3>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black">
                          {effectivelyLocked ? "GM ONLY ACCESS" : "AUTHORIZED MODULE"}
                        </p>
                      </div>

                      {/* GM UNLOCKED BADGE */}
                      {isGM && tool.locked && (
                        <div className="absolute top-6 right-8 bg-emerald-500 text-white text-[9px] px-3 py-1 rounded-lg font-black uppercase tracking-widest shadow-md animate-pulse">
                           GM Access ✨
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>

      <style jsx global>{`
        body { background-color: #F0F9FF; font-weight: 900 !important; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: #020617; border-radius: 10px; }
      `}</style>
    </div>
  );
}