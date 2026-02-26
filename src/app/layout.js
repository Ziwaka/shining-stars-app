"use client";
import "./globals.css";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }) {
  const [user, setUser] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    const savedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (savedUser && savedUser !== "undefined") {
      try { setUser(JSON.parse(savedUser)); } catch (e) { console.error(e); }
    }
  }, [pathname]);

  const isFullScreenPage = pathname === '/' || pathname.includes('/login') || pathname.includes('/public-zone');

  return (
    <html lang="en">
      {/* 🌟 မလိုအပ်သော Flex များ အကုန်ဖြုတ်ပြီး မူရင်းရိုးရှင်းသော body သာ ပြန်ထားပါသည် */}
      <body className="antialiased bg-slate-50 text-slate-950 font-black">
        
        {!isFullScreenPage && user && (
          <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b-4 border-indigo-900 px-8 py-4 flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-6">
              <Link href="/" className="font-black text-indigo-900 text-xl tracking-tighter">
                SHINING STARS <span className="text-amber-500">★</span>
              </Link>
              <Link href="/" className="text-[10px] font-black text-indigo-900 hover:text-amber-500 uppercase tracking-widest italic transition-colors">HOME</Link>
            </div>
            
            <div className="flex gap-6 items-center">
              <button 
                onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.href = "/login"; }}
                className="bg-indigo-900 text-white px-6 py-2 rounded-xl text-[10px] font-black hover:bg-rose-600 transition shadow-xl active:scale-95"
              >
                LOGOUT
              </button>
            </div>
          </nav>
        )}

        {/* 🌟 ရှင်းလင်းသော Content Wrapper (Flex အရှုပ်အရှင်း မရှိတော့ပါ) */}
        <div className={isFullScreenPage ? "" : "pt-24"}>
          {children}
        </div>

        <style jsx global>{`
          body { font-weight: 900 !important; color: #020617 !important; }
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-thumb { background: #020617; border-radius: 10px; }
        `}</style>
      </body>
    </html>
  );
}
