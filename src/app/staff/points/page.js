"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffPointsHub() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || "null");
    if (!auth) {
      router.push('/login');
    } else {
      setUser(auth);
    }
  }, [router]);

  if (!user) return null;

  const hasPermission = (field) => {
    const val = user[field];
    return val === true || String(val).trim().toUpperCase() === "TRUE";
  };

  const canAdjust = hasPermission('Can_Adjust_Points');

  return (
    <div className="min-h-screen bg-[#F0F9FF] font-black text-slate-950 p-5 md:p-12 pb-32">
      <div className="max-w-[900px] mx-auto space-y-8">

        {/* HEADER */}
        <div className="bg-slate-950 rounded-[3rem] p-8 md:p-12 border-b-[10px] border-[#fbbf24] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 bg-[#fbbf24]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <button
            onClick={() => router.push('/staff')}
            className="relative z-10 mb-6 flex items-center gap-2 text-[#fbbf24] text-xs uppercase tracking-widest font-black hover:opacity-70 transition-opacity"
          >
            ← Back
          </button>
          <div className="relative z-10">
            <p className="text-[#fbbf24] text-[9px] uppercase tracking-[0.4em] font-black mb-2">Staff Module</p>
            <h1 className="text-3xl md:text-5xl italic uppercase font-black text-white tracking-tighter leading-none">
              House Score Adjust
            </h1>
            <p className="text-slate-400 text-xs uppercase font-black tracking-[0.3em] mt-3">
              User: <span className="text-white">{user.Name || user.username}</span>
              <span className="mx-3 opacity-30">|</span>
              Access: <span className={canAdjust ? "text-emerald-400" : "text-rose-400"}>{canAdjust ? "Authorized" : "Restricted"}</span>
            </p>
          </div>
        </div>

        {!canAdjust ? (
          <div className="py-24 text-center">
            <p className="text-6xl mb-4">🔒</p>
            <p className="font-black uppercase italic text-slate-400 text-xl tracking-widest">Access Restricted</p>
            <p className="text-slate-400 text-xs uppercase font-black tracking-widest mt-3">Contact management to enable this module</p>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border-b-[8px] border-slate-200 shadow-xl p-8 md:p-12">
            <p className="text-center text-slate-400 font-black uppercase italic tracking-widest text-lg py-16">
              Score Adjustment Module<br/>
              <span className="text-sm text-slate-300 mt-2 block">Coming Soon</span>
            </p>
          </div>
        )}

      </div>

      <style jsx global>{`
        body { background-color: #F0F9FF; font-weight: 900 !important; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: #020617; border-radius: 10px; }
      `}</style>
    </div>
  );
}
