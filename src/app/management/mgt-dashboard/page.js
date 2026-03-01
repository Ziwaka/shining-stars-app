"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

export default function ManagementDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalS: 0, male: 0, female: 0, pendingL: 0 });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || "null");
    if (!auth || auth.userRole !== 'management') {
      router.push('/login');
      return;
    }
    setUser(auth);

    const loadDashboard = async () => {
      try {
        const res = await fetch(WEB_APP_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'getInitialData' })
        });
        const result = await res.json();
        if (result.success) {
          const activeS = result.students.filter(u =>
            u.Status === true || u.Status?.toString().toUpperCase() === "TRUE"
          );
          setStats({
            totalS: activeS.length,
            male: activeS.filter(x => ['M','MALE','ကျား'].includes(x.Sex?.toString().toUpperCase())).length,
            female: activeS.filter(x => ['F','FEMALE','မ'].includes(x.Sex?.toString().toUpperCase())).length,
            pendingL: result.leaves.filter(l => l.Status === 'Pending').length
          });
          setRecentLeaves(result.leaves.filter(l => l.Status === 'Pending').slice(0, 3));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const toolGroups = [
    {
      group: "Student & Campus",
      items: [
        { name: 'Student Directory', path: '/staff/student-dir', icon: '🎓' },
        { name: 'Hostel Hub',        path: '/staff/hostel',       icon: '🏠' },
        { name: 'Score Adjust',      path: '/staff/points',       icon: '⚡' },
        { name: 'Registry Notes',    path: '/staff/notes',        icon: '📒' },
      ]
    },
    {
      group: "Staff & Admin",
      items: [
        { name: 'Staff Directory',   path: '/staff/staff-dir',    icon: '👔' },
        { name: 'Staff Contacts',    path: '/staff/contacts',     icon: '📞' },
        { name: 'Financial Registry',path: '/staff/fees',         icon: '💰' },
        { name: 'Performance',       path: '/management/performance', icon: '🏆' },
      ]
    },
    {
      group: "Management Operations",
      items: [
        { name: 'Leave Hub',         path: '/management/leave',       icon: '📄' },
        { name: 'Analytics',         path: '/management/analytic',    icon: '📈' },
        { name: 'Communication',     path: '/management/communication', icon: '📢' },
      ]
    }
  ];

  if (loading) return (
    <div className="min-h-screen bg-[#F0F9FF] flex items-center justify-center font-black text-[#4c1d95] animate-pulse text-xl uppercase italic tracking-widest px-6 text-center">
      Loading Management Hub...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F9FF] font-black text-slate-950 p-5 md:p-12 pb-32">
      <div className="max-w-[1400px] mx-auto space-y-12">

        {/* ── IDENTITY HEADER (Same style as Staff) ── */}
        <div className="bg-slate-950 rounded-[3rem] p-8 md:p-14 border-b-[12px] border-[#fbbf24] shadow-2xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#fbbf24]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

          {/* Avatar */}
          <div className="relative z-10 w-20 h-20 md:w-32 md:h-32 bg-white rounded-[2rem] flex items-center justify-center text-4xl md:text-6xl shadow-xl border-4 border-[#fbbf24] shrink-0">
            🏛️
          </div>

          {/* Info */}
          <div className="text-center md:text-left flex-1 z-10 min-w-0">
            <div className="inline-block px-4 py-1.5 bg-[#fbbf24] text-slate-950 text-[10px] font-black uppercase rounded-lg mb-3 tracking-[0.2em]">
              Management Authority
            </div>
            <h1 className="text-3xl md:text-6xl italic uppercase font-black text-white tracking-tighter leading-none mb-3 break-words">
              {user?.Name || user?.name || user?.username || "Admin"}
            </h1>
            <p className="text-slate-400 text-xs uppercase font-black tracking-[0.3em]">
              ID: <span className="text-[#fbbf24]">{user?.Staff_ID || user?.ID || "—"}</span>
              <span className="mx-3 opacity-30">|</span>
              Status: <span className="text-white">Full Authority</span>
            </p>
          </div>


        </div>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: "Total Students", value: stats.totalS, icon: "🎓", border: "border-indigo-300", bg: "bg-indigo-50" },
            { label: "Male",           value: stats.male,   icon: "👦", border: "border-blue-300",   bg: "bg-blue-50" },
            { label: "Female",         value: stats.female, icon: "👧", border: "border-pink-300",   bg: "bg-pink-50" },
            { label: "Pending Leaves", value: stats.pendingL, icon: "⏳", border: "border-amber-400", bg: "bg-amber-50",
              onClick: () => router.push('/management/leave') },
          ].map((s, i) => (
            <button
              key={i}
              onClick={s.onClick}
              className={`${s.bg} p-5 md:p-7 rounded-[2rem] border-b-[8px] ${s.border} shadow-md flex flex-col items-center gap-2 hover:-translate-y-1 active:scale-95 transition-all ${s.onClick ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span className="text-3xl md:text-4xl">{s.icon}</span>
              <p className="text-3xl md:text-4xl font-black text-slate-950 leading-none">{s.value}</p>
              <p className="text-[9px] uppercase tracking-widest font-black text-slate-500 text-center leading-tight">{s.label}</p>
            </button>
          ))}
        </div>

        {/* ── PENDING LEAVES QUICK VIEW ── */}
        {recentLeaves.length > 0 && (
          <div className="bg-white rounded-[2.5rem] border-b-[10px] border-amber-400 shadow-xl overflow-hidden">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">⏳</span>
                <h3 className="text-sm font-black uppercase text-amber-800 tracking-widest">Pending Leave Queue</h3>
                <span className="bg-amber-500 text-white text-[9px] px-2.5 py-0.5 rounded-full font-black">{stats.pendingL}</span>
              </div>
              <button onClick={() => router.push('/management/leave')}
                className="text-[9px] font-black uppercase text-amber-600 hover:text-amber-800 tracking-widest transition-colors">
                View All →
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {recentLeaves.map((l, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-black text-slate-950 uppercase italic text-sm truncate">{l.Name}</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase mt-0.5">{l.Leave_Type} · {l.Start_Date}</p>
                  </div>
                  <span className="shrink-0 bg-amber-100 text-amber-700 text-[8px] px-3 py-1 rounded-full font-black uppercase">Pending</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TOOL GROUPS (Same style as Staff) ── */}
        <div className="space-y-12">
          {toolGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-6">
              <h2 className="text-lg md:text-xl uppercase border-l-8 border-slate-950 pl-5 tracking-tight text-slate-950">
                {group.group}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {group.items.map((tool, i) => (
                  <button
                    key={i}
                    onClick={() => router.push(tool.path)}
                    className="group bg-white p-8 rounded-[2.5rem] border-b-[10px] border-slate-100 hover:border-[#fbbf24] hover:-translate-y-1.5 active:scale-95 transition-all duration-300 flex flex-col items-center text-center gap-5 shadow-lg"
                  >
                    <span className="text-5xl md:text-6xl transition-transform duration-300 group-hover:scale-110">
                      {tool.icon}
                    </span>
                    <div>
                      <h3 className="text-base md:text-lg font-black uppercase italic tracking-tight text-slate-950">
                        {tool.name}
                      </h3>
                      <p className="text-[9px] uppercase tracking-[0.3em] font-black mt-1 text-slate-400">
                        Management Access
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>

      <style jsx global>{`
        body { background-color: #F0F9FF; font-weight: 900 !important; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: #020617; border-radius: 10px; }
      `}</style>
    </div>
  );
}
