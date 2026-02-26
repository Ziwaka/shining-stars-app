"use client";
import "./globals.css";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Shining Stars - Universal Layout (v3.0 Clean)
 * FIXED: Removed redundant STAFF & STUDENT view links [cite: 2026-02-25]
 * STYLE: Slate-950 Bold UI [cite: 2023-02-23]
 */
export default function RootLayout({ children }) {
  const [user, setUser] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch (e) { console.error(e); }
    }
  }, [pathname]);

  const isLoginPage = pathname.includes('/login');

  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-950 font-black">
        {!isLoginPage && user && (
          <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b-4 border-indigo-900 px-8 py-4 flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-6">
              <Link href="/" className="font-black text-indigo-900 text-xl tracking-tighter">
                SHINING STARS <span className="text-amber-500">★</span>
              </Link>
              <Link href="/" className="text-[10px] font-black text-indigo-900 hover:text-amber-500 uppercase tracking-widest italic">HOME</Link>
            </div>
            
            <div className="flex gap-6 items-center">
              {/* FIXED: STAFF VIEW and STUDENT VIEW links removed completely [cite: 2026-02-25] */}
              <button 
                onClick={() => { localStorage.removeItem("user"); sessionStorage.removeItem("user"); window.location.href = "/login"; }}
                className="bg-indigo-900 text-white px-6 py-2 rounded-xl text-[10px] font-black hover:bg-rose-600 transition shadow-xl active:scale-95"
              >
                LOGOUT
              </button>
            </div>
          </nav>
        )}
        <div className={isLoginPage ? "" : "pt-24"}>{children}</div>

        <style jsx global>{`
          body { font-weight: 900 !important; color: #020617 !important; }
        `}</style>
      </body>
    </html>
  );
}