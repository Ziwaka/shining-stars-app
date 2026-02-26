"use client";
import { useEffect, useState } from 'react';
import { WEB_APP_URL } from '@/lib/api';

/**
 * Shining Stars - Performance Intelligence (v1.0)
 * FEATURE: Point Logs (Incidents) & Top 10 Student Rankings [cite: 2026-02-25]
 * STYLE: Slate-950 Bold Luxury | Tac-Indigo Theme [cite: 2023-02-23]
 */
export default function MgtPerformanceHub() {
  const [data, setData] = useState({ students: [], scores: [], points: [], rankings: [] });
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState("All");
  const [activeTab, setActiveTab] = useState("RANKINGS"); // RANKINGS, INCIDENTS

  useEffect(() => {
    const loadPerformance = async () => {
      try {
        const res = await fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getInitialData' }) });
        const result = await res.json();

        if (result.success) {
          const students = result.students || [];
          const scores = result.scores || [];
          
          // RANKING LOGIC: Group by Student, Average score, Sort Top 10 [cite: 2026-02-25]
          const gradeRankings = {};
          const grades = [...new Set(students.map(s => s.Grade))];

          grades.forEach(g => {
            const gradeScores = scores.filter(sc => sc.Grade === g);
            const studentTotals = {};
            
            gradeScores.forEach(sc => {
              if (!studentTotals[sc.Student_ID]) studentTotals[sc.Student_ID] = { name: sc.Name, total: 0, count: 0 };
              studentTotals[sc.Student_ID].total += Number(sc.Score);
              studentTotals[sc.Student_ID].count += 1;
            });

            gradeRankings[g] = Object.values(studentTotals)
              .map(s => ({ ...s, avg: (s.total / s.count).toFixed(2) }))
              .sort((a, b) => b.avg - a.avg)
              .slice(0, 10);
          });

          setData({
            students,
            scores: scores.reverse(),
            points: (result.housePoints || []).reverse(),
            rankings: gradeRankings
          });
        }
      } finally { setLoading(false); }
    };
    loadPerformance();
  }, []);

  const currentRankings = selectedGrade === "All" ? [] : (data.rankings[selectedGrade] || []);
  const filteredIncidents = data.points.filter(p => {
    const s = data.students.find(st => st['Enrollment No.'] == p.Student_ID);
    return selectedGrade === "All" || s?.Grade === selectedGrade;
  });

  if (loading) return <div className="h-96 flex items-center justify-center font-black text-[#fbbf24] animate-pulse text-4xl uppercase italic">Synchronizing Academic Records...</div>;

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-40">
      
      {/* PERFORMANCE NAVIGATION [cite: 2026-02-25] */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex bg-white/5 p-3 rounded-[3rem] gap-3 border border-white/5">
           {["RANKINGS", "INCIDENTS"].map(t => (
             <button key={t} onClick={() => setActiveTab(t)} className={`px-12 py-5 rounded-[2rem] font-black italic uppercase tracking-widest text-[11px] transition-all ${activeTab === t ? 'bg-[#fbbf24] text-black shadow-xl' : 'text-white/40 hover:text-white'}`}>{t}</button>
           ))}
        </div>
        
        <select className="bg-slate-900 border-4 border-white/5 p-5 px-10 rounded-[2.5rem] font-black italic text-white outline-none focus:border-[#fbbf24]" value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
           <option value="All">All Grades</option>
           {[...new Set(data.students.map(s => s.Grade))].map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {activeTab === "RANKINGS" && (
        <div className="bg-white p-12 rounded-[5rem] border-b-[20px] border-indigo-950 shadow-3xl overflow-hidden">
           <h4 className="text-3xl font-black uppercase italic text-slate-950 mb-12 border-l-[12px] border-indigo-600 pl-8 leading-none">Top 10 Academic Elites: {selectedGrade}</h4>
           {selectedGrade !== "All" ? (
             <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                   <thead className="border-b-4 border-slate-100 text-[10px] uppercase text-slate-400 italic tracking-widest">
                      <tr><th className="p-8">Rank</th><th>Student Name</th><th>Average Score</th><th>Performance Metric</th></tr>
                   </thead>
                   <tbody className="text-slate-950 font-black italic uppercase">
                      {currentRankings.map((s, i) => (
                        <tr key={i} className="border-b border-slate-50 group hover:bg-slate-50 transition-all">
                           <td className="p-8 text-4xl text-indigo-950/20 group-hover:text-indigo-600">#{i + 1}</td>
                           <td className="text-xl">{s.name}</td>
                           <td className="text-3xl text-indigo-600">{s.avg}</td>
                           <td><div className="h-4 w-48 bg-slate-100 rounded-full overflow-hidden"><div style={{ width: `${s.avg}%` }} className="bg-indigo-500 h-full shadow-lg" /></div></td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           ) : <p className="text-center py-20 text-slate-300 font-black uppercase italic tracking-widest">Select a Grade to View Rankings</p>}
        </div>
      )}

      {activeTab === "INCIDENTS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
           {filteredIncidents.slice(0, 15).map((p, i) => (
             <div key={i} className={`p-10 rounded-[4rem] border-b-[15px] shadow-3xl text-white space-y-6 relative overflow-hidden group ${Number(p.Points) >= 0 ? 'bg-emerald-950 border-emerald-500' : 'bg-rose-950 border-rose-500'}`}>
                <span className="absolute -right-5 -top-5 text-9xl opacity-10 group-hover:scale-125 transition-transform">{Number(p.Points) >= 0 ? "📈" : "📉"}</span>
                <p className="text-[10px] font-black uppercase tracking-widest italic opacity-60">{p.Category}</p>
                <h4 className="text-3xl font-black italic uppercase leading-none">{p.Name}</h4>
                <p className="text-sm font-black italic opacity-40 leading-relaxed truncate">"{p.Remark || "No Registry Entry"}"</p>
                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                   <span className="text-[9px] uppercase font-black">{p.Date}</span>
                   <span className={`text-4xl font-black ${Number(p.Points) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{Number(p.Points) >= 0 ? '+' : ''}{p.Points}</span>
                </div>
             </div>
           ))}
           {filteredIncidents.length === 0 && <p className="col-span-full text-center text-white/10 font-black text-3xl uppercase italic py-40 border-2 border-dashed border-white/5 rounded-[4rem]">No Performance Logs Detected</p>}
        </div>
      )}

    </div>
  );
}