"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

export default function LandingPage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const upd = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', upd);
    window.addEventListener('offline', upd);
    upd();
    // Cache announcements quietly
    fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getData', sheetName:'Announcements' }) })
      .then(r=>r.json()).then(d=>{ if(d.data) localStorage.setItem('cached_announcements', JSON.stringify(d.data)); })
      .catch(()=>{});
    setTimeout(() => setReady(true), 100);
    return () => { window.removeEventListener('online', upd); window.removeEventListener('offline', upd); };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#0f0a1e] flex flex-col items-center justify-between overflow-x-hidden font-black">

      {/* BG gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#1a0a3e] via-[#0f0a1e] to-[#000]" />
      <div className="fixed inset-0 -z-10 opacity-30"
        style={{backgroundImage:'radial-gradient(ellipse 80% 50% at 50% 0%, #4c1d95 0%, transparent 70%)'}} />

      {/* TOP STATUS DOT */}
      <div className="w-full flex justify-end px-5 pt-4">
        <div className={`flex items-center gap-1.5 text-[8px] uppercase tracking-widest font-black ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`} />
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* CENTER CONTENT */}
      <div className={`flex-1 flex flex-col items-center justify-center w-full px-5 py-8 gap-8 transition-all duration-700 ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

        {/* LOGO */}
        <div className="relative">
          <div className="absolute inset-0 rounded-[2rem] bg-[#fbbf24] blur-2xl opacity-20 scale-110" />
          <div className="relative bg-white rounded-[2rem] p-3.5 border-4 border-[#fbbf24] shadow-2xl">
            <img
              src="/logo.jpg"
              alt="Shining Stars Logo"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-xl"
              onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
            />
            <div className="w-20 h-20 sm:w-24 sm:h-24 hidden items-center justify-center text-4xl">🌟</div>
          </div>
        </div>

        {/* SCHOOL NAME */}
        <div className="text-center space-y-2 w-full max-w-xs">
          <p className="text-[#fbbf24] text-[9px] uppercase tracking-[0.5em] font-black">Private High School</p>
          <h1 className="text-white font-black uppercase leading-tight tracking-tight"
            style={{fontSize:'clamp(1.4rem, 7vw, 2.2rem)'}}>
            Shining Stars<br/>Ma Thwe
          </h1>
          <p className="text-white/30 text-[9px] uppercase tracking-[0.3em] font-black">Est. 2019 · Taunggyi</p>
        </div>

        {/* BUTTONS */}
        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-white text-slate-950 rounded-[2rem] py-5 px-6 font-black uppercase tracking-widest text-sm shadow-2xl border-b-[6px] border-[#fbbf24] active:scale-95 active:border-b-2 transition-all hover:bg-[#fbbf24] flex items-center justify-between"
          >
            <span>Sign In</span>
            <span className="text-base">→</span>
          </button>
          <button
            onClick={() => router.push('/public-zone')}
            className="w-full bg-white/5 border border-white/10 text-white rounded-[2rem] py-4 px-6 font-black uppercase tracking-widest text-xs active:scale-95 transition-all hover:bg-white/10 flex items-center justify-between"
          >
            <span>Public Hub</span>
            <span className="opacity-40">→</span>
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <p className="text-white/20 text-[8px] uppercase tracking-[0.3em] pb-6 font-black">
        Shining Stars · Developed by Shine Thit
      </p>
    </div>
  );
}
