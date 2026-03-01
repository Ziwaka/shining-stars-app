"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

/**
 * Shining Stars - Student My-Performance Hub (v5.3 Identity Update)
 * FEATURE: Observation Log now displays "Recorded By" for teacher feedback [cite: 2026-02-26]
 * PRESERVED: Ivory/Slate-950 Style, Attendance Removed, House Sync Fix [cite: 2026-02-25]
 * STYLE: High Visibility Ivory (#FDFCF0) & Slate-950 Bold Luxury Template [cite: 2023-02-23]
 */
export default function MyPerformanceRegistry() {
  const [auth, setAuth] = useState(null);
  const [myHouse, setMyHouse] = useState("SYNCING..."); 
  const [data, setData] = useState({ 
    scores: [], earnedPoints: [], deductedPoints: [], 
    notes: [], fees: [], leaves: [] 
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const toEngNum = (str) => {
    if (str === null || str === undefined) return "0";
    const burmeseNumbers = {'၀':'0','၁':'1','၂':'2','၃':'3','၄':'4','၅':'5','၆':'6','၇':'7','၈':'8','၉':'9'};
    return String(str).replace(/[၀-၉]/g, m => burmeseNumbers[m]).trim();
  };

  useEffect(() => {
    let isMounted = true;
    const fetchMyHubProtocol = async () => {
      const saved = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (!saved || saved === "undefined") { router.push('/login'); return; }
      const user = JSON.parse(saved);
      if (isMounted) setAuth(user);
      const myID = (user.Student_ID || user['Enrollment No.'] || "").toString().trim();

      const fetchSheet = async (name) => {
        try {
          const res = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getData', sheetName: name }),
          });
          const text = await res.text();
          try {
            const json = JSON.parse(text);
            if (json.success && Array.isArray(json.data)) {
               json.data = json.data.map(obj => {
                  const cleanObj = {};
                  Object.keys(obj).forEach(k => { cleanObj[k.trim()] = obj[k]; });
                  return cleanObj;
               });
            }
            return json;
          } catch (e) { return { success: false, data: [] }; }
        } catch (e) { return { success: false, data: [] }; }
      };

      try {
        const [scRes, pRes, nRes, fRes, lRes, dirRes] = await Promise.all([
          fetchSheet('Score_Records'), fetchSheet('House_Points'),
          fetchSheet('Student_Notes_Log'), fetchSheet('Fees_Management'),
          fetchSheet('Leave_Records'), fetchSheet('Student_Directory') 
        ]);

        if (!isMounted) return;

        let liveHouse = "UNASSIGNED";
        if (dirRes.success && Array.isArray(dirRes.data)) {
           const studentProfile = dirRes.data.find(s => {
              const rowID = String(s.Student_ID || s['Enrollment No.'] || s['Student ID'] || "").trim();
              return rowID === myID;
           });
           if (studentProfile && studentProfile.House) liveHouse = studentProfile.House;
        }
        setMyHouse(liveHouse);

        const filterMyRecords = (result) => {
          if (!result.success || !Array.isArray(result.data)) return [];
          return result.data.filter(x => {
             const rowID = String(x.Student_ID || x.User_ID || x['Enrollment No.'] || x['Student ID'] || "").trim();
             return rowID === myID;
          });
        };

        const myPoints = filterMyRecords(pRes);
        let earned = []; let deducted = [];
        myPoints.forEach(pt => {
           const rawPts = pt.Points !== undefined ? pt.Points : (pt.Point !== undefined ? pt.Point : "0");
           const ptsNum = parseInt(toEngNum(rawPts), 10);
           const safePts = isNaN(ptsNum) ? 0 : ptsNum;
           const processedPt = { ...pt, Numeric_Points: safePts };
           if (safePts >= 0) earned.push(processedPt);
           else deducted.push(processedPt);
        });

        setData({
          scores: filterMyRecords(scRes).reverse(),
          earnedPoints: earned.reverse(),
          deductedPoints: deducted.reverse(),
          notes: filterMyRecords(nRes).reverse(),
          fees: filterMyRecords(fRes).reverse(),
          leaves: filterMyRecords(lRes).reverse()
        });

      } catch (err) { console.error("DEBUG PERFORMANCE ERROR:", err); }
      finally { if (isMounted) setLoading(false); }
    };
    fetchMyHubProtocol();
    return () => { isMounted = false; };
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-[#FDFCF0] flex flex-col items-center justify-center font-black text-[#020617] animate-pulse">
      <div className="text-7xl mb-6">🗂️</div>
      <div className="text-sm uppercase italic tracking-[0.4em] text-[#020617]">Decrypting Personal Archives...</div>
    </div>
  );

  const totalEarned = data.earnedPoints.reduce((s, x) => s + x.Numeric_Points, 0);
  const totalDeducted = data.deductedPoints.reduce((s, x) => s + Math.abs(x.Numeric_Points), 0);
  const leavesTaken = data.leaves.filter(x => String(x.Status).toLowerCase().includes("approved")).length;

  return (
    <div className="min-h-screen bg-[#FDFCF0] p-4 md:p-10 font-black selection:bg-[#fbbf24] text-slate-950 pb-40">
      <div className="max-w-[1500px] mx-auto space-y-12">
        
        {/* HEADER SECTION */}
        <div className="bg-slate-950 p-10 md:p-14 rounded-[4rem] border-b-[15px] border-[#fbbf24] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="flex items-center gap-6 md:gap-10 z-10">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-[2.5rem] flex items-center justify-center text-5xl md:text-7xl shadow-2xl border-4 border-[#fbbf24]">🧑‍🎓</div>
            <div className="text-center md:text-left leading-none">
              <div className="inline-block px-4 py-1.5 bg-[#fbbf24] text-slate-950 text-[10px] font-black uppercase rounded-lg mb-4 tracking-[0.2em] shadow-md">My Performance Hub</div>
              <h1 className="text-3xl md:text-6xl italic uppercase font-black text-white tracking-tighter leading-tight">{auth?.Name}</h1>
              <p className="text-slate-400 text-xs md:text-sm uppercase font-black tracking-[0.4em] mt-3 italic">House: <span className="text-white">{myHouse}</span></p>
            </div>
          </div>
          <div className="flex bg-white/10 p-5 px-8 rounded-full border-2 border-white/20 items-center gap-4 z-10 backdrop-blur-sm text-white">
             <span className="text-[10px] uppercase text-slate-300 font-black italic tracking-widest">Registry ID:</span>
             <span className="text-xl md:text-3xl font-black text-[#fbbf24] italic">{auth?.Student_ID || auth?.['Enrollment No.']}</span>
          </div>
        </div>

        {/* ANALYTICS SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
           <PerfStat label="My Contribution" value={`+${totalEarned}`} icon="📈" borderColor="#10B981" textColor="#059669" />
           <PerfStat label="Points Deducted" value={`-${totalDeducted}`} icon="📉" borderColor="#E11D48" textColor="#BE123C" />
           <PerfStat label="Approved Leaves" value={leavesTaken} icon="🗓️" borderColor="#8B5CF6" textColor="#7C3AED" />
        </div>

        {/* DATA SECTIONS */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          
          {/* 1. EARNED POINTS */}
          <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border-t-[10px] border-[#10B981] space-y-8 flex flex-col h-full">
            <h2 className="text-2xl font-black uppercase italic text-emerald-700 border-b-4 border-emerald-100 pb-4 flex items-center gap-3">
              <span className="bg-emerald-500 text-white w-10 h-10 flex items-center justify-center rounded-xl text-xl shadow-md">+</span>
              Points I Earned
            </h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex-1">
              {data.earnedPoints.length > 0 ? data.earnedPoints.map((pt, i) => (
                <div key={i} className="bg-emerald-50 p-6 rounded-[2rem] border-2 border-emerald-200 flex justify-between items-center transition-all hover:-translate-y-1">
                  <div>
                    <p className="text-lg font-black uppercase text-slate-950 italic">★ {pt.Event_Name}</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-2">{pt.Date} • By {pt.Recorded_By}</p>
                  </div>
                  <div className="text-4xl font-black text-emerald-600">+{pt.Numeric_Points}</div>
                </div>
              )) : <div className="text-center py-20 opacity-30 italic uppercase">No Contribution Yet</div>}
            </div>
          </div>

          {/* 2. DEDUCTED POINTS */}
          <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border-t-[10px] border-[#E11D48] space-y-8 flex flex-col h-full">
            <h2 className="text-2xl font-black uppercase italic text-rose-700 border-b-4 border-rose-100 pb-4 flex items-center gap-3">
              <span className="bg-rose-600 text-white w-10 h-10 flex items-center justify-center rounded-xl text-2xl shadow-md">-</span>
              Points I Lost
            </h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex-1">
              {data.deductedPoints.length > 0 ? data.deductedPoints.map((pt, i) => (
                <div key={i} className="bg-rose-50 p-6 rounded-[2rem] border-2 border-rose-200 flex justify-between items-center transition-all hover:-translate-y-1">
                  <div>
                    <p className="text-lg font-black uppercase text-slate-950 italic">⚠ {pt.Event_Name}</p>
                    {pt.Remark && <p className="text-xs text-rose-700 bg-white px-3 py-1 rounded-lg mt-2 inline-block border border-rose-200 shadow-sm">"{pt.Remark}"</p>}
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-2">{pt.Date} • By {pt.Recorded_By}</p>
                  </div>
                  <div className="text-4xl font-black text-rose-600">{pt.Numeric_Points}</div>
                </div>
              )) : <div className="text-center py-20 opacity-30 italic uppercase">Clean Record</div>}
            </div>
          </div>

          {/* 3. EXAM REGISTRY */}
          <div className="bg-slate-950 p-10 rounded-[3.5rem] shadow-xl border-t-[10px] border-[#8B5CF6] space-y-8 text-white flex flex-col h-full">
            <h2 className="text-2xl font-black uppercase italic text-[#A78BFA] border-b-4 border-white/10 pb-4 flex items-center gap-3">
              <span className="bg-[#8B5CF6] text-white w-10 h-10 flex items-center justify-center rounded-xl text-xl shadow-md">📊</span>
              Exam Registry
            </h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex-1">
              {data.scores.length > 0 ? data.scores.map((sc, i) => (
                <div key={i} className="bg-white/5 p-6 rounded-[2rem] border border-white/10 flex justify-between items-center hover:bg-white/10 transition-all">
                   <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{sc.Term}</p>
                      <p className="text-xl font-black italic uppercase text-white">{sc.Subject}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-4xl md:text-5xl font-black italic text-[#fbbf24]">{sc.Score}</p>
                      <p className={`text-[10px] font-black uppercase mt-1 tracking-widest ${String(sc.Result).toLowerCase() === 'pass' ? 'text-emerald-400' : 'text-rose-400'}`}>{sc.Result}</p>
                   </div>
                </div>
              )) : <div className="text-center py-20 opacity-30 italic uppercase">No Academic Records</div>}
            </div>
          </div>

          {/* 4. OBSERVATION LOG (WITH RECORDED BY) */}
          <div className="bg-[#FEF9C3] p-10 rounded-[3.5rem] shadow-xl border-t-[10px] border-[#F59E0B] space-y-8 flex flex-col h-full">
            <h2 className="text-2xl font-black uppercase italic text-amber-800 border-b-4 border-amber-200 pb-4 flex items-center gap-3">
              <span className="bg-amber-500 text-white w-10 h-10 flex items-center justify-center rounded-xl text-xl shadow-md">📓</span>
              Observation Log
            </h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex-1">
              {data.notes.length > 0 ? data.notes.map((n, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-amber-100 transition-all hover:-translate-y-1">
                  <p className="text-lg font-black italic text-slate-950 leading-relaxed mb-4">"{n.Note_Detail}"</p>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-700 px-3 py-1 rounded-lg tracking-widest">{n.Category}</span>
                    <div className="text-right leading-none">
                       {/* 🌟 Added Recorded By here [cite: 2026-02-26] */}
                       <p className="text-[8px] text-slate-400 font-black uppercase mb-1 tracking-widest italic">By: {n.Recorded_By || 'Academic Office'}</p>
                       <span className="text-[10px] text-slate-400 font-black uppercase">{n.Date}</span>
                    </div>
                  </div>
                </div>
              )) : <div className="text-center py-20 opacity-30 italic uppercase">No Observations Archived</div>}
            </div>
          </div>

          {/* 5. LEAVE HISTORY */}
          <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border-t-[10px] border-[#3B82F6] space-y-8 flex flex-col h-full">
            <h2 className="text-2xl font-black uppercase italic text-blue-700 border-b-4 border-blue-100 pb-4 flex items-center gap-3">
              <span className="bg-blue-500 text-white w-10 h-10 flex items-center justify-center rounded-xl text-xl shadow-md">✈️</span>
              Leave History
            </h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex-1">
              {data.leaves.length > 0 ? data.leaves.map((l, i) => (
                <div key={i} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 transition-all hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase bg-slate-200 text-slate-700 px-3 py-1 rounded-lg tracking-widest">{l.Leave_Type}</span>
                      <p className="text-sm font-black uppercase text-slate-950 mt-2">{l.Start_Date} to {l.End_Date}</p>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg tracking-widest ${String(l.Status).toLowerCase() === 'approved' ? 'bg-emerald-100 text-emerald-700' : String(l.Status).toLowerCase() === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {l.Status}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-bold italic text-slate-600 bg-white p-3 rounded-xl border border-slate-100">"{l.Reason}"</p>
                </div>
              )) : <div className="text-center py-20 opacity-30 italic uppercase">No Leaves Recorded</div>}
            </div>
          </div>

          {/* 6. FEES MANAGEMENT */}
          <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border-t-[10px] border-[#0F766E] space-y-8 flex flex-col h-full">
            <h2 className="text-2xl font-black uppercase italic text-teal-700 border-b-4 border-teal-100 pb-4 flex items-center gap-3">
              <span className="bg-teal-600 text-white w-10 h-10 flex items-center justify-center rounded-xl text-xl shadow-md">💰</span>
              Financial Registry
            </h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex-1">
              {data.fees.length > 0 ? data.fees.map((f, i) => (
                <div key={i} className="bg-teal-50/50 p-6 rounded-[2rem] border border-teal-100 flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all hover:-translate-y-1 hover:bg-teal-50">
                  <div className="flex-1">
                    <span className="text-[10px] font-black uppercase bg-white text-teal-700 px-3 py-1 rounded-lg tracking-widest border border-teal-200">{f.Fee_Type || "Tuition"}</span>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-3">Date: {f.Date || f.Payment_Date}</p>
                    {f.Remark && <p className="text-xs italic text-teal-800 mt-1">Note: {f.Remark}</p>}
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-2xl md:text-3xl font-black italic text-teal-700">{Number(f.Amount_Paid || 0).toLocaleString()} <span className="text-sm">MMK</span></p>
                    <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-slate-400">Next Due: {f.Next_Due_Date || "-"}</p>
                  </div>
                </div>
              )) : <div className="text-center py-20 opacity-30 italic uppercase">No Payments Found</div>}
            </div>
          </div>

        </div>
        
        <div className="text-center py-20 opacity-20 italic font-black text-slate-900">
           <div className="text-5xl mb-4">🌟</div>
           <p className="text-3xl md:text-5xl uppercase tracking-widest font-black leading-none">SHINING STARS</p>
           <p className="text-[10px] uppercase mt-4 tracking-[1em] font-black">VERSION 5.3 • PERSONAL ARCHIVE SYNCED</p>
        </div>

      </div>
      <style jsx global>{`
        body { background-color: #FDFCF0; font-weight: 900 !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}

function PerfStat({ label, value, icon, borderColor, textColor }) {
  return (
    <div className="bg-white p-8 rounded-[3rem] border-b-[10px] shadow-xl flex justify-between items-center group transition-transform hover:-translate-y-2" style={{ borderColor: borderColor }}>
      <div className="leading-none flex-1">
        <p className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 italic">{label}</p>
        <p className="text-3xl md:text-4xl lg:text-5xl font-black italic tracking-tighter" style={{ color: textColor }}>{value}</p>
      </div>
      <span className="text-5xl md:text-6xl drop-shadow-sm transition-transform group-hover:scale-110">{icon}</span>
    </div>
  );
}