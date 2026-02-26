"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

export default function GMDashboardFinal() {
  const router = useRouter();
  const [stats, setStats] = useState({ totalS: 0, male: 0, female: 0, pendingL: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHub = async () => {
      try {
        const res = await fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getInitialData' }) });
        const result = await res.json();
        if (result.success) {
          const activeS = result.students.filter(u => u.Status === true || u.Status?.toString().toUpperCase() === "TRUE");
          setStats({
            totalS: activeS.length,
            male: activeS.filter(x => ['M','MALE','ကျား'].includes(x.Sex?.toString().toUpperCase())).length, // GENDER [cite: 2026-02-25]
            female: activeS.filter(x => ['F','FEMALE','မ'].includes(x.Sex?.toString().toUpperCase())).length,
            pendingL: result.leaves.filter(l => l.Status === 'Pending').length
          });
        }
      } finally { setLoading(false); }
    };
    loadHub();
  }, []);

  const commands = [
    { name: "Student Dir", path: "/staff/student-dir", icon: "🎓" },
    { name: "Staff Dir", path: "/staff/staff-dir", icon: "👔" },
    { name: "Hostel Hub", path: "/staff/hostel", icon: "🏠" },
    { name: "Marks Record", path: "/staff/scores", icon: "📝" },
    { name: "Point Adjust", path: "/staff/points", icon: "⚡" },
    { name: "Registry Notes", path: "/staff/notes", icon: "📒" },
  ];

  if (loading) return <div className="h-[60vh] flex flex-col items-center justify-center font-black text-[#fbbf24] animate-pulse">Establishing Authority Hub...</div>;

  return (
    <div className="space-y-6">
      {/* GENDER & ENROLLMENT [cite: 2026-02-25] */}
      <div className="bg-white p-6 rounded-[2.5rem] border-b-[8px] border-indigo-950 shadow-xl">
         <p className="text-[8px] uppercase font-black text-slate-400 mb-2 italic">Student Registry Mix</p>
         <h3 className="text-6xl font-black italic text-slate-950 leading-none mb-6">{stats.totalS}</h3>
         <div className="grid grid-cols-2 gap-3">
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-center">
               <p className="text-[8px] font-black text-indigo-400 uppercase">Male</p>
               <p className="text-2xl font-black text-indigo-900">{stats.male}</p>
            </div>
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 text-center">
               <p className="text-[8px] font-black text-rose-400 uppercase">Female</p>
               <p className="text-2xl font-black text-rose-900">{stats.female}</p>
            </div>
         </div>
      </div>

      {/* GM COMMAND CENTER [cite: 2026-02-25] */}
      <div className="bg-white p-6 rounded-[2.5rem] border-b-[10px] border-slate-100 shadow-xl">
         <h4 className="text-xs font-black uppercase italic text-slate-950 mb-6 border-l-4 border-[#fbbf24] pl-4">Authority Registry Tools</h4>
         <div className="grid grid-cols-2 gap-3">
            {commands.map((m, i) => (
               <button key={i} onClick={() => router.push(m.path)} className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 flex items-center gap-3 active:bg-[#fbbf24] transition-all">
                  <span className="text-2xl">{m.icon}</span>
                  <span className="text-[8px] uppercase font-black italic text-slate-500 leading-tight text-left">{m.name}</span>
               </button>
            ))}
         </div>
      </div>
    </div>
  );
}