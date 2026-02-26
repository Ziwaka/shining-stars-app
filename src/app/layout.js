"use client";
import "./globals.css";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Shining Stars - Universal Layout (v4.0 Logo Fix)
 * FEATURE: Integrated logo.jpg from public folder [cite: 2026-02-26]
 * FIX: Exact pathing for Vercel deployment [cite: 2026-02-26]
 * STYLE: Professional Ivory/Slate UI with Bold typography [cite: 2023-02-23]
 */
export default function RootLayout({ children }) {
  const [user, setUser] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    const savedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (savedUser && savedUser !== "undefined") {
      try { setUser(JSON.parse(savedUser)); } catch (e) { console.error("Session Error:", e); }
    }
  }, [pathname]);

  const isLoginPage = pathname.includes('/login');

  return (
    <html lang="en">
      <body className="antialiased bg-[#FDFCF0] text-slate-950 font-black">
        {!isLoginPage && user && (
          <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b-4 border-slate-950 px-6 md:px-12 py-4 flex justify-between items-center shadow-xl">
            
            {/* 🌟 LOGO & BRANDING SECTION [cite: 2026-02-26] */}
            <div className="flex items-center gap-4 md:gap-8">
              <Link href="/" className="flex items-center gap-3 group">
                {/* Logo Image from Public Folder */}
                <img 
                  src="/logo.jpg" 
                  alt="Logo" 
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-contain shadow-md border-2 border-slate-950 transition-transform group-hover:scale-110"
                />
                <div className="flex flex-col leading-none">
                  <span className="font-black text-slate-950 text-lg md:text-xl tracking-tighter uppercase italic">SHINING STARS</span>
                  <span className="text-[8px] text-amber-500 font-black tracking-[0.4em] mt-1">ACADEMIC REGISTRY</span>
                </div>
              </Link>
              <Link href="/" className="hidden md:block text-[10px] font-black text-slate-400 hover:text-slate-950 uppercase tracking-widest italic border-l-2 border-slate-200 pl-6">HOME</Link>
            </div>
            
            {/* ACTIONS SECTION */}
            <div className="flex gap-4 items-center">
              <div className="hidden md:flex flex-col items-end mr-4 leading-none text-right">
                 <p className="text-[9px] text-slate-400 uppercase font-black italic mb-1">Active User</p>
                 <p className="text-xs font-black uppercase tracking-tight">{user.Name || user.username}</p>
              </div>
              <button 
                onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.href = "/login"; }}
                className="bg-slate-950 text-white px-6 md:px-8 py-2 md:py-3 rounded-2xl text-[10px] font-black hover:bg-rose-600 transition-all shadow-xl active:scale-95 border-b-4 border-slate-800"
              >
                LOGOUT
              </button>
            </div>
          </nav>
        )}

        <div className={isLoginPage ? "" : "pt-28 md:pt-32"}>{children}</div>

        <style jsx global>{`
          body { font-weight: 900 !important; color: #020617 !important; }
          /* Custom Scrollbar for Pro Look */
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-thumb { background: #020617; border-radius: 10px; }
        `}</style>
      </body>
    </html>
  );
}
