"use client";
import { useEffect, useState } from 'react';
import { WEB_APP_URL } from '@/lib/api';

/**
 * Shining Stars - Analytic Hub (v7.0)
 * FIX: Default Export for Analytic Page [cite: 2026-02-25]
 * STYLE: Slate-950 Bold Luxury [cite: 2023-02-23]
 */
export default function AnalyticHub() {
  const [stats, setStats] = useState({ total: 0, m: 0, f: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getInitialData' }) });
        const result = await res.json();
        if (result.success) {
          const s = result.students || [];
          setStats({
            total: s.length,
            m: s.filter(x => ['M','MALE','ကျား'].includes(x.Sex?.toString().toUpperCase())).length,
            f: s.filter(x => ['F','FEMALE','မ'].includes(x.Sex?.toString().toUpperCase())).length
          });
        }
      } finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="h-40 flex items-center justify-center font-black text-[#fbbf24] animate-pulse">Establishing Intel...</div>;

  return (
    <div className="bg-white p-8 rounded-[3rem] border-b-[15px] border-indigo-950 shadow-2xl space-y-8">
      <h2 className="text-2xl font-black uppercase italic text-slate-950 border-l-8 border-[#fbbf24] pl-6">Demographic Analysis</h2>
      <div className="grid grid-cols-1 gap-4">
         <div className="bg-slate-50 p-6 rounded-[2rem] text-center border-2 border-slate-100">
            <p className="text-5xl font-black italic text-slate-950">{stats.total}</p>
            <p className="text-[10px] uppercase font-black opacity-30 mt-2">Total Registry</p>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-50 p-5 rounded-[2rem] text-center border-2 border-indigo-100"><p className="text-2xl font-black text-indigo-900">{stats.m}</p><p className="text-[8px] uppercase font-black opacity-40">Male</p></div>
            <div className="bg-rose-50 p-5 rounded-[2rem] text-center border-2 border-rose-100"><p className="text-2xl font-black text-rose-900">{stats.f}</p><p className="text-[8px] uppercase font-black opacity-40">Female</p></div>
         </div>
      </div>
    </div>
  );
}