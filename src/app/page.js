"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

export default function MasterLandingPage() {
  const router = useRouter();

  // --- 🌟 Data Status များများပြနိုင်ရန် Zone များကို ထပ်တိုးထားပါသည် 🌟 ---
  const [zones, setZones] = useState({
    network: { label: "NETWORK FIREWALL", status: "WAITING...", done: false },
    public: { label: "PUBLIC RESOURCES", status: "WAITING...", done: false },
    announcement: { label: "ANNOUNCEMENTS", status: "WAITING...", done: false },
    student: { label: "STUDENT ZONE", status: "WAITING...", done: false },
    staff: { label: "STAFF ZONE", status: "WAITING...", done: false },
    management: { label: "MANAGEMENT SECURE", status: "WAITING...", done: false },
    database: { label: "CLOUD DATABASE", status: "WAITING...", done: false }
  });

  const [isOnline, setIsOnline] = useState(true);
  
  // --- 🌟 Animation ပြေးနေစေရန် Running Log State 🌟 ---
  const [runningLog, setRunningLog] = useState("INITIALIZING SYSTEM...");

  const updateZone = (key, status, done) => {
    setZones(prev => ({
      ...prev,
      [key]: { ...prev[key], status, done }
    }));
  };

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    // 🌟 Live Terminal Animation 🌟
    const logMessages = [
      "VERIFYING SSL CERTIFICATES...", 
      "PINGING LOCAL SERVERS...", 
      "ALLOCATING MEMORY CACHE...", 
      "BYPASSING SECURITY PROXY...", 
      "SYSTEM OPTIMAL AND READY."
    ];
    let logIndex = 0;
    const logInterval = setInterval(() => {
      setRunningLog(logMessages[logIndex % logMessages.length]);
      logIndex++;
    }, 800);

    const startGlobalSync = async () => {
      if (!WEB_APP_URL) return;

      try {
        updateZone('network', "VERIFYING...", false);
        await new Promise(r => setTimeout(r, 300)); 
        updateZone('network', "SECURE", true);

        updateZone('public', "SYNCING...", false);
        await new Promise(r => setTimeout(r, 400)); 
        updateZone('public', "ONLINE", true);

        updateZone('announcement', "FETCHING...", false);
        const annRes = await fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getData', sheetName: 'Announcements' }) });
        if (annRes.ok) {
          localStorage.setItem('cached_announcements', JSON.stringify((await annRes.json()).data));
        }
        updateZone('announcement', "CACHED", true);

        updateZone('student', "PREPARING...", false);
        await new Promise(r => setTimeout(r, 500));
        updateZone('student', "READY", true);

        updateZone('staff', "AUTHENTICATING...", false);
        await new Promise(r => setTimeout(r, 600));
        updateZone('staff', "READY", true);

        updateZone('management', "ENCRYPTING...", false);
        await new Promise(r => setTimeout(r, 700));
        updateZone('management', "SECURED", true);

        updateZone('database', "CONNECTING...", false);
        await new Promise(r => setTimeout(r, 400));
        updateZone('database', "LINKED", true);

      } catch (err) {
        console.error("Sync Error");
        updateZone('announcement', "FAILED", false);
      }
    };

    startGlobalSync();
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(logInterval);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center bg-[#2e1065] text-white selection:bg-[#FFD700] m-0 p-0 font-black uppercase italic tracking-tighter overflow-x-hidden">
      
      {/* 🌌 LOGO-MATCHED BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-b from-[#4c1d95] via-[#2e1065] to-[#170838]"></div>

      {/* --- 1. BRANDING SECTION --- */}
      <div className="relative z-10 w-full flex flex-col items-center pt-12 md:pt-16 px-4 text-center space-y-6 mb-8 animate-in fade-in slide-in-from-top duration-1000">
        <div className="bg-white p-4 rounded-[2.5rem] shadow-[0_0_50px_rgba(255,215,0,0.2)] border-4 border-[#FFD700] hover:scale-105 transition-transform duration-300">
          <img src="/logo.jpg" alt="Logo" className="w-20 h-20 md:w-28 md:h-28 object-contain" />
        </div>

        <div className="space-y-2 md:space-y-3 w-full">
          <p className="text-[#FFD700] font-bold tracking-[0.6em] text-[10px] md:text-xs drop-shadow-md">OFFICIAL PORTAL</p>
          
          {/* 🌟 SHINING STARS - MA THWE တစ်ကြောင်းတည်း 🌟 */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white drop-shadow-xl w-full px-2">
            SHINING STARS - MA THWE
          </h1>
          
          <p className="text-sm md:text-xl text-purple-300 font-serif lowercase italic opacity-90 tracking-widest pt-1">
            private high school
          </p>
        </div>
      </div>

      {/* --- 2. ACTION SECTION: BUTTONS (WITH STUDENT & STAFF TEXT + SHAKE ANIMATION) --- */}
      <div className="relative z-10 w-full max-w-sm px-8 space-y-5 flex flex-col items-center z-20">
        
        {/* 🌟 SECURE ENTRY PORTAL (WITH "STUDENT & STAFF" TEXT) 🌟 */}
        <button 
          onClick={() => router.push('/login')}
          className="interactive-shake group w-full bg-white rounded-[2.5rem] p-6 md:p-8 flex flex-col items-center justify-center gap-1 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)] transition-all border-b-[10px] border-[#FFD700]"
        >
          <span className="font-black text-slate-950 text-[10px] tracking-[0.5em] opacity-40 leading-none">SECURE ENTRY</span>
          <span className="font-black text-slate-950 text-4xl tracking-tighter leading-none mt-1 mb-2">PORTAL</span>
          <span className="bg-slate-100 text-[#4c1d95] px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border-2 border-slate-200 group-hover:bg-[#FFD700] group-hover:border-[#FFD700] transition-colors">
            STUDENT & STAFF
          </span>
        </button>

        {/* 🌟 PUBLIC HUB 🌟 */}
        <button 
          onClick={() => router.push('/public-zone')}
          className="interactive-shake group w-full bg-[#FFD700] rounded-[2rem] p-5 border-b-[6px] border-amber-600 flex flex-col items-center justify-center transition-all shadow-xl"
        >
          <span className="font-black text-slate-950 text-lg tracking-widest leading-none">PUBLIC HUB</span>
        </button>
      </div>

      {/* --- 3. DETAILED SYSTEM MODULES --- */}
      <div className="relative z-10 w-full max-w-sm px-8 mt-8 mb-8">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl flex flex-col gap-4 border-t-2 border-t-[#FFD700]/50">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <span className="text-[10px] text-white/50 tracking-widest font-bold">CORE MODULES</span>
            <span className={`text-[9px] font-black flex items-center gap-2 ${isOnline ? 'text-emerald-400' : 'text-rose-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`}></div>
              {isOnline ? 'NETWORK ONLINE' : 'OFFLINE'}
            </span>
          </div>

          {/* List of Zones */}
          <div className="flex flex-col gap-3">
            {Object.keys(zones).map((key) => (
              <div key={key} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-1 h-1 rounded-full ${zones[key].done ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                  <span className="text-[9px] md:text-[10px] text-white/80 tracking-[0.2em]">{zones[key].label}</span>
                </div>
                <span className={`text-[9px] md:text-[10px] font-black ${zones[key].done ? 'text-emerald-400' : 'text-[#FFD700] animate-pulse'}`}>
                  {zones[key].status}
                </span>
              </div>
            ))}
          </div>

          {/* Live Running Log Animation */}
          <div className="mt-2 pt-3 border-t border-white/10 flex items-center gap-2">
            <span className="text-[10px] font-mono text-emerald-500">_&gt;</span>
            <span className="text-[8px] md:text-[9px] font-mono tracking-widest text-white/60 animate-pulse">
              {runningLog}
            </span>
          </div>

        </div>
      </div>

      {/* --- 4. FOOTER --- */}
      <div className="relative z-10 w-full text-center pb-8 px-4 space-y-4 mt-auto">
         <div className="space-y-1">
           <p className="text-[9px] font-black tracking-[0.3em] text-white/50 uppercase">
             Shining Stars - Ma Thwe PHS
           </p>
           <p className="text-[7px] font-medium tracking-[0.2em] text-white/30 uppercase italic">
             Est. 2019 • Taunggyi, Southern Shan State
           </p>
         </div>
         <div className="inline-block bg-black/20 border border-white/5 px-6 py-2 rounded-full shadow-lg">
           <span className="text-[8px] font-black tracking-[0.4em] text-[#FFD700]">
             Developed by SHINE THIT.
           </span>
         </div>
      </div>

      {/* 🌟 CSS ANIMATIONS FOR BUTTON SHAKING (ထိလိုက်ရင် လှုပ်ရှားမည့် Effect) 🌟 */}
      <style jsx global>{`
        .interactive-shake:hover {
          animation: wiggle 0.4s ease-in-out infinite alternate;
          transform: translateY(-4px);
        }
        .interactive-shake:active {
          transform: translateY(4px) scale(0.95);
          animation: none;
        }

        @keyframes wiggle {
          0% { transform: translateY(-4px) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(-1deg); }
          50% { transform: translateY(-4px) rotate(1deg); }
          75% { transform: translateY(-4px) rotate(-1deg); }
          100% { transform: translateY(-4px) rotate(0deg); }
        }
      `}</style>

    </div>
  );
}