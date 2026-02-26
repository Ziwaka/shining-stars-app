"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

/**
 * Shining Stars - Home Content (v38.0 Final)
 * STRICT ADHERENCE: Full Code, Slate-950 Bold [cite: 2026-02-23]
 * FIX: Removed Redundant Nav Bar [cite: 2026-02-25]
 */
export default function StudentPortalHome() {
  const [data, setData] = useState({ fees: [], announcements: [] });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPortalHome = async () => {
      const saved = localStorage.getItem('user') || sessionStorage.getItem('user');
      // Auth Check logic fix [cite: 2026-02-24]
      if (!saved || saved === "undefined") { router.push('/login'); return; }
      const authUser = JSON.parse(saved);
      setUser(authUser);
      const myID = (authUser.Student_ID || "").toString().trim();

      try {
        const fetchSheet = async (name) => {
          const res = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getData', sheetName: name }),
          });
          return res.json();
        };
        const [feesRes, annRes] = await Promise.all([
          fetchSheet("Fees_Management"),
          fetchSheet("Announcements")
        ]);
        if (feesRes.success && annRes.success) {
          setData({
            fees: feesRes.data?.filter(f => f.Student_ID.toString().trim() === myID) || [],
            announcements: annRes.data?.filter(a => a.Target_Student === true || a.Target_Student === "TRUE") || []
          });
        }
      } catch (err) { console.error("Home Sync Error."); }
      finally { setLoading(false); }
    };
    fetchPortalHome();
  }, [router]);

  if (loading) return <div className="p-20 text-center font-black text-2xl animate-pulse italic">SYNCING DASHBOARD...</div>;

  return (
    <div className="max-w-7xl mx-auto p-8 md:p-14 space-y-12 font-black text-[#020617]">
      <div className="bg-white p-12 rounded-[4rem] shadow-2xl border-4 border-white font-black">
         <h2 className="text-4xl md:text-8xl italic uppercase font-black tracking-tighter leading-none">Welcome, {user?.Name}</h2>
         <p className="text-slate-400 mt-6 uppercase tracking-[0.6em] text-xs font-black italic">Institutional Portal Access: AUTHORIZED</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 font-black">
         <div className="bg-[#020617] p-12 rounded-[5rem] shadow-2xl text-white border-b-[20px] border-[#E91E63] italic">
            <h3 className="text-xl md:text-2xl uppercase italic font-black mb-10 border-l-[20px] border-[#fbbf24] pl-6 text-[#fbbf24]">Official News</h3>
            <div className="space-y-10">
               {data.announcements.map((ann, i) => (
                 <div key={i} className="pb-8 border-b border-white/10 last:border-0 italic font-black">
                    <span className="text-[11px] text-[#E91E63] uppercase tracking-[0.2em] font-black">{ann.Date}</span>
                    <h4 className="text-2xl font-black uppercase mt-3">{ann.Title}</h4>
                    <p className="text-sm md:text-xl text-slate-400 mt-4 leading-relaxed line-clamp-2">{ann.Message}</p>
                 </div>
               ))}
            </div>
         </div>

         <div className="bg-white p-12 rounded-[5rem] shadow-2xl border-4 border-slate-50 font-black">
            <h3 className="text-xl md:text-2xl uppercase italic font-black mb-10 border-l-[20px] border-[#4c1d95] pl-6 text-[#020617]">Institutional Data</h3>
            <div className="p-10 bg-slate-50 rounded-[3.5rem] border-2 border-white shadow-inner font-black">
               <p className="text-[12px] uppercase opacity-40 font-black italic mb-4">Financial Registry Date</p>
               <p className="text-4xl md:text-6xl font-black italic text-[#E91E63]">{data.fees[0]?.Next_Due_Date || "SYNCING..."}</p>
            </div>
         </div>
      </div>
    </div>
  );
}