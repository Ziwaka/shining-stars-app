"use client";
import { useEffect, useState } from 'react';
import { WEB_APP_URL } from '@/lib/api';

/**
 * Shining Stars - Management Leave Intelligence (v8.5 Precision Fix)
 * FIX: Local Timezone Date Matching to solve Registry Mismatch [cite: 2026-02-25]
 * STYLE: Slate-950 Bold Luxury [cite: 2023-02-23]
 */
export default function GMLeaveAuthority() {
  const [data, setData] = useState({ pending: [], history: [] });
  const [loading, setLoading] = useState(true);
  const [proc, setProc] = useState(false);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await fetch(WEB_APP_URL, { 
          method: 'POST', 
          body: JSON.stringify({ action: 'getInitialData' }) 
        });
        const result = await res.json();
        if (result.success) {
          const l = result.leaves || [];
          setData({
            pending: l.filter(x => x.Status === "Pending"),
            history: l.filter(x => x.Status !== "Pending").reverse()
          });
        }
      } catch (e) {
        console.error("Registry Sync Failure");
      } finally { setLoading(false); }
    };
    fetchLeaves();
  }, []);

  const handleAction = async (leave, status) => {
    const gm = JSON.parse(localStorage.getItem('user') || "{}");
    if (!gm.Name) return alert("GM Session Expired. Please Login Again.");

    setProc(true);
    
    /**
     * ⚠️ CRITICAL TIMEZONE FIX [cite: 2026-02-25]:
     * ISO Date (UTC) ကို မသုံးတော့ဘဲ User ရဲ့ Local Timezone (MMT) အတိုင်း 
     * YYYY-MM-DD format ကို တိုက်ရိုက်ယူပြီး Sheet ထဲက ရက်စွဲနဲ့ ညှိလိုက်ပါပြီ။
     */
    const d = new Date(leave.Start_Date);
    const cleanDate = d.toLocaleDateString('en-CA'); // Outputs: "2026-02-26" [cite: 2026-02-25]

    try {
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'updateLeave', 
          userId: leave.User_ID, 
          name: leave.Name, // Fallback အတွက် နာမည်ပါ ပို့ပေးထားသည် [cite: 2026-02-25]
          startDate: cleanDate, 
          status, 
          approvedBy: gm.Name 
        })
      });
      const result = await res.json();
      if (result.success) {
        alert(`SUCCESS: Leave ${status} Registry Updated ★`);
        window.location.reload();
      } else {
        alert(`FAIL: ${result.message}`); // Registry mismatch error ပေါ်လျှင် ဤနေရာမှ သိနိုင်သည် [cite: 2026-02-25]
      }
    } catch (e) {
      alert("NETWORK SYNC FAILURE");
    } finally { setProc(false); }
  };

  if (loading || proc) return (
    <div className="h-[60vh] flex flex-col items-center justify-center font-black text-[#fbbf24] animate-pulse uppercase italic tracking-[0.5em]">
      Synchronizing Authority...
    </div>
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 border-l-8 border-[#fbbf24] pl-5">
         <h2 className="text-2xl font-black uppercase italic text-white leading-none">Leave Intelligence</h2>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {data.pending.length > 0 ? data.pending.map((l, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] border-b-[10px] border-emerald-950 shadow-xl space-y-4">
             <div className="flex justify-between items-center text-[8px] font-black uppercase italic text-indigo-400">
                <span>{l.User_Type} Profile</span>
                <span>ID: {l.User_ID}</span>
             </div>
             <h3 className="text-3xl font-black italic uppercase text-slate-950 leading-none">{l.Name}</h3>
             <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 font-black italic">
                "{l.Reason}"
             </div>
             <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 border-t border-slate-50 pt-3">
                <span>Timeline: {new Date(l.Start_Date).toLocaleDateString()}</span>
                <span className="text-slate-950 text-xl">{l.Total_Days} D</span>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleAction(l, "Approved")} className="py-5 bg-emerald-500 text-white rounded-[1.8rem] font-black uppercase shadow-lg border-b-6 border-emerald-900 active:scale-95 transition-all">Approve</button>
                <button onClick={() => handleAction(l, "Rejected")} className="py-5 bg-rose-500 text-white rounded-[1.8rem] font-black uppercase shadow-lg border-b-6 border-rose-900 active:scale-95 transition-all">Reject</button>
             </div>
          </div>
        )) : <div className="py-20 text-center opacity-10 font-black text-2xl uppercase italic tracking-widest">Registry Queue Empty</div>}
      </div>
    </div>
  );
}