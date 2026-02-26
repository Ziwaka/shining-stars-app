"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

/**
 * Shining Stars - Management Master Layout (v15.0 Soft Blue Edition)
 * FIX: Added 'Back' button for easier navigation [cite: 2026-02-26]
 * FIX: Changed background to Soft Light Blue (#F0F9FF) to reduce eye strain [cite: 2026-02-26]
 * STYLE: Wide-Screen View & Slate-950 Bold [cite: 2023-02-23]
 */
export default function MgtUniversalLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || "null");
    if (!auth || auth.userRole !== 'management') { 
      router.push('/login'); 
    } else { 
      setUser(auth); 
    }
  }, [router]);

  const navItems = [
    { name: 'Dashboard', path: '/management/mgt-dashboard', icon: '📊' },
    { name: 'Leave Hub', path: '/management/leave', icon: '📄' },
    { name: 'Performance', path: '/management/performance', icon: '🏆' },
    { name: 'Registry', path: '/management/analytic', icon: '📈' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F0F9FF] flex flex-col font-black selection:bg-[#fbbf24] text-slate-950 overflow-x-hidden">
      
      {/* 🌟 1. FULL-WIDTH STICKY HEADER WITH BACK BUTTON */}
      <header className="sticky top-0 z-[100] bg-[#020617] border-b-8 border-[#fbbf24] p-4 md:p-6 shadow-2xl">
        <div className="w-full px-2 md:px-10 flex justify-between items-center">
          <div className="flex items-center gap-3 md:gap-5">
            {/* 🔙 BACK BUTTON */}
            <button 
              onClick={() => router.back()} 
              className="w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center text-xl transition-all active:scale-75 border border-white/20 shadow-lg"
              title="Go Back"
            >
              ⬅️
            </button>
            
            {/* 🏠 HOME BUTTON */}
            <Link href="/" className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl flex items-center justify-center text-2xl md:text-3xl border-4 border-[#fbbf24] shadow-lg hover:scale-105 transition-transform active:scale-90">
              🌟
            </Link>

            <div className="leading-none ml-2">
              <h2 className="text-white text-md md:text-2xl italic uppercase tracking-tighter font-black">Shining Stars</h2>
              <p className="text-[#fbbf24] text-[8px] md:text-[9px] uppercase tracking-[0.4em] mt-1 italic font-black">GM Authority Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <div className="hidden sm:flex flex-col items-end mr-2 md:mr-6 opacity-80 border-r-2 border-white/10 pr-4 md:pr-6">
              <span className="text-[9px] text-white uppercase tracking-widest">Authorized GM</span>
              <span className="text-xs md:text-sm text-[#fbbf24] italic">{user?.username || "Admin"}</span>
            </div>
            <button 
              onClick={() => router.push('/public-zone')} 
              className="hidden md:block px-5 py-2.5 bg-white/5 text-white text-[10px] font-black uppercase italic rounded-xl border border-white/10 hover:bg-white/10 transition-all tracking-widest"
            >
              Public Site
            </button>
            <button 
              onClick={handleLogout} 
              className="px-5 py-2.5 bg-[#DC2626] text-white text-[10px] font-black uppercase italic rounded-xl border-b-4 border-red-900 active:scale-95 transition-all shadow-lg"
            >
              Logout ⏻
            </button>
          </div>
        </div>
      </header>

      {/* 🌟 2. FULL-WIDTH MAIN CONTENT AREA (Soft Blue Background) */}
      <main className="flex-1 w-full px-4 md:px-10 lg:px-12 py-10 pb-44 relative animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {/* Expanded Registry Badge */}
        <div className="mb-10 flex items-center gap-5">
           <div className="h-12 md:h-16 w-2.5 bg-slate-950 rounded-full shadow-md"></div>
           <div className="flex flex-col">
              <h1 className="text-2xl md:text-5xl italic uppercase font-black text-slate-950 leading-none tracking-tight">Master Management Ledger</h1>
              <div className="flex items-center gap-3 mt-2">
                 <span className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-black text-slate-400">Shining Stars - Ma Thwe Registry Hub</span>
                 <div className="h-px w-20 bg-slate-300"></div>
                 <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">● Secure Access</span>
              </div>
           </div>
        </div>

        {/* Dynamic Page Content */}
        <div className="relative z-10 w-full overflow-x-auto">
          {children}
        </div>

        {/* Background Subtle Watermark */}
        <div className="fixed bottom-20 right-10 opacity-[0.04] pointer-events-none -z-10 select-none">
           <p className="text-[18vw] leading-none uppercase font-black italic tracking-tighter text-blue-900">GM HUB</p>
        </div>
      </main>

      {/* 🌟 3. PREMIUM WIDE BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#020617] border-t-8 border-[#fbbf24] p-4 flex justify-around items-center z-[110] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="w-full max-w-[1000px] flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} 
                className={`group flex flex-col items-center gap-1.5 p-2 px-4 transition-all duration-300 ${isActive ? 'scale-110' : 'opacity-40 hover:opacity-100 hover:scale-105'}`}>
                <span className={`text-2xl md:text-4xl transition-all ${isActive ? 'drop-shadow-[0_0_15px_#fbbf24] scale-110' : 'grayscale'}`}>
                  {item.icon}
                </span>
                <span className={`text-[8px] md:text-[10px] uppercase font-black tracking-widest leading-none ${isActive ? 'text-[#fbbf24] italic' : 'text-white'}`}>
                  {item.name}
                </span>
                {isActive && (
                  <div className="w-full h-1 bg-[#fbbf24] rounded-full shadow-[0_0_12px_#fbbf24] mt-1 animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <style jsx global>{`
        body { background-color: #F0F9FF; font-family: 'Inter', sans-serif; font-weight: 900 !important; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #020617; border-radius: 10px; }
        ::-webkit-scrollbar-track { background: #F0F9FF; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}