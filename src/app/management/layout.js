"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function MgtUniversalLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || "null");
    if (!auth || auth.userRole !== 'management') {
      router.push('/login');
    } else {
      setUser(auth);
    }
  }, [router]);

  const navItems = [
    { name: 'Dashboard', path: '/management/mgt-dashboard', icon: '📊' },
    { name: 'Leave Hub',  path: '/management/leave',         icon: '📄' },
    { name: 'Performance',path: '/management/performance',   icon: '🏆' },
    { name: 'Analytics',  path: '/management/analytic',      icon: '📈' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F0F9FF] flex flex-col font-black selection:bg-[#fbbf24] text-slate-950 overflow-x-hidden">

      {/* ── SINGLE TOP HEADER ── */}
      <header className="sticky top-0 z-[100] bg-[#020617] border-b-[6px] border-[#fbbf24] px-4 md:px-10 py-3 md:py-4 shadow-2xl flex items-center justify-between gap-4">

        {/* LEFT — Logo + Home */}
        <Link href="/management/mgt-dashboard" className="flex items-center gap-3 group shrink-0">
          <div className="w-9 h-9 md:w-11 md:h-11 bg-[#fbbf24] rounded-xl flex items-center justify-center text-xl font-black shadow-md group-hover:scale-105 transition-transform">
            🌟
          </div>
          <div className="leading-none">
            <p className="text-white text-sm md:text-base font-black uppercase italic tracking-tight">Shining Stars</p>
            <p className="text-[#fbbf24] text-[8px] uppercase tracking-[0.3em] font-black">Management Hub</p>
          </div>
        </Link>

        {/* RIGHT — User + Logout only */}
        <div className="flex items-center gap-3 md:gap-5">
          <div className="hidden sm:flex flex-col items-end leading-none">
            <span className="text-[8px] text-white/50 uppercase tracking-widest">Logged in as</span>
            <span className="text-[11px] text-[#fbbf24] font-black italic mt-0.5">{user?.Name || user?.name || user?.username || user?.['Name (ALL CAPITAL)'] || "Admin"}</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-rose-600 text-white text-[9px] md:text-[10px] font-black uppercase rounded-xl border-b-[3px] border-rose-900 active:scale-95 transition-all shadow-lg"
          >
            Logout ⏻
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 w-full pb-28 animate-in fade-in duration-300">
        {children}
      </main>

      {/* ── BOTTOM NAV ── */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#020617] border-t-[6px] border-[#fbbf24] px-4 py-3 flex justify-around items-center z-[110] shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-200 ${isActive ? 'scale-110' : 'opacity-40 hover:opacity-80'}`}
            >
              <span className={`text-2xl ${isActive ? 'drop-shadow-[0_0_10px_#fbbf24]' : 'grayscale'}`}>
                {item.icon}
              </span>
              <span className={`text-[8px] uppercase font-black tracking-widest ${isActive ? 'text-[#fbbf24]' : 'text-white'}`}>
                {item.name}
              </span>
              {isActive && <div className="w-4 h-0.5 bg-[#fbbf24] rounded-full" />}
            </Link>
          );
        })}
      </nav>

      <style jsx global>{`
        body { background-color: #F0F9FF; font-weight: 900 !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #020617; border-radius: 10px; }
      `}</style>
    </div>
  );
}
