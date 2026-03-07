"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffAccessHub() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || "null");
    if (!auth) {
      router.push('/login');
      return;
    }
    // Management role ဆိုရင် Management Zone သို့ redirect
    if (auth.userRole === 'management') {
      router.push('/management/mgt-dashboard');
      return;
    }
    setUser(auth);
  }, [router]);

  if (!user) return null;

  const hasPermission = (field) => {
    const val = user[field];
    return val === true || String(val).trim().toUpperCase() === "TRUE";
  };

  // Staff သာ မြင်ရသည် — Management links မပါ
  const toolGroups = [
    {
      group: "Campus & Student Operations",
      items: [
        { name: 'Student Directory', path: '/staff/student-dir', icon: '👤', locked: !hasPermission('Can_View_Student') },
        { name: 'Hostel Management', path: '/staff/hostel', icon: '🏠', locked: !hasPermission('Can_Manage_Hostel') },
        { name: 'House Score Adjust', path: '/staff/points', icon: '⚖️', locked: !hasPermission('Can_Adjust_Points') },
      ]
    },
    {
      group: "Staff Professional Hub",
      items: [
        { name: 'Staff Contacts', path: '/staff/contacts', icon: '📞', locked: false },
        { name: 'Master Registry', path: '/staff/staff-dir', icon: '👔', locked: !hasPermission('Can_View_Staff') },
        { name: 'My Leave Form', path: '/staff/leave', icon: '📄', locked: !hasPermission('Can_Record_Attendance_&_Leave') },
      ]
    },
    {
      group: "Administrative & Ledger",
      items: [
        { name: 'Financial Registry', path: '/staff/fees', icon: '💰', locked: !hasPermission('Can_Manage_Fees') },
        { name: 'Registry Notes', path: '/staff/notes', icon: '📒', locked: !hasPermission('Can_Record_Note') },
        { name: 'Inventory', path: '/staff/inventory', icon: '📦', locked: false },
        { name: 'Lost & Found', path: '/staff/lost-found', icon: '🔍', locked: false },
        { name: 'Communication', path: '/management/communication', icon: '📢', locked: !hasPermission('Can_Record_Note') },
        { name: 'Score Records', path: '/staff/scores', icon: '📝', locked: !hasPermission('Can_Record_Note') },
        { name: 'Calendar', path: '/staff/calendar', icon: '📅', locked: false },
      ]
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen font-black text-slate-950 p-5 md:p-12 pb-32" style={{background:'#F0F9FF'}}>
      <div className="mx-auto space-y-12" style={{maxWidth:'1400px'}}>

        {/* HEADER */}
        <div className="bg-slate-950 p-8 md:p-14 shadow-2xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden" style={{borderRadius:'3rem', borderBottomWidth:'12px', borderColor:'#fbbf24'}}>
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" style={{background:'#fbbf24'}} />

          <div className="relative z-10 w-20 h-20 md:w-32 md:h-32 bg-white flex items-center justify-center text-4xl md:text-6xl shadow-xl border-4 shrink-0" style={{borderRadius:'2rem', borderColor:'#fbbf24'}}>
            👤
          </div>

          <div className="text-center md:text-left flex-1 z-10 min-w-0">
            <div className="inline-block px-4 py-1.5 text-slate-950 font-black uppercase rounded-lg mb-3" style={{background:'#fbbf24', fontSize:'10px', letterSpacing:'0.2em'}}>
              Educational Staff
            </div>
            <h1 className="text-3xl md:text-6xl italic uppercase font-black text-white tracking-tighter leading-none mb-3 break-words">
              {user.Name || user.username}
            </h1>
            <p className="text-slate-400 text-xs uppercase font-black" style={{letterSpacing:'0.3em'}}>
              ID: <span className="" style={{color:'#fbbf24'}}>{user.Staff_ID || user.ID || "—"}</span>
              <span className="mx-3 opacity-30">|</span>
              Status: <span className="text-white">Authorized</span>
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="relative z-50 px-8 py-4 bg-rose-600 text-white text-xs font-black uppercase rounded-2xl border-b-4 border-rose-900 active:scale-95 transition-all shrink-0 shadow-xl hover:bg-rose-700"
          >
            Logout ⏻
          </button>
        </div>

        {/* TOOL GROUPS */}
        <div className="space-y-12">
          {toolGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-6">
              <h2 className="text-lg md:text-xl uppercase border-l-8 border-slate-950 pl-5 tracking-tight text-slate-950">
                {group.group}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.items.map((tool, i) => (
                  <button
                    key={i}
                    onClick={() => !tool.locked && router.push(tool.path)}
                    className={`relative group p-8 rounded-[2.5rem] border-b-[10px] transition-all duration-300 flex flex-col items-center text-center gap-5 shadow-lg
                      ${tool.locked
                        ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                        : 'bg-white border-slate-100 hover:border-gold hover:-translate-y-1.5 active:scale-95'
                      }`}
                  >
                    <span className={`text-5xl md:text-6xl transition-transform duration-300 ${!tool.locked && 'group-hover:scale-110'}`}>
                      {tool.icon}
                    </span>
                    <div>
                      <h3 className={`text-base md:text-lg font-black uppercase italic tracking-tight ${tool.locked ? 'text-slate-400' : 'text-slate-950'}`}>
                        {tool.name}
                      </h3>
                      <p className={`text-[9px] uppercase tracking-[0.3em] font-black mt-1 ${tool.locked ? 'text-rose-400' : 'text-slate-400'}`}>
                        {tool.locked ? "RESTRICTED ACCESS" : "AUTHORIZED MODULE"}
                      </p>
                    </div>
                    {tool.locked && (
                      <div className="absolute top-5 right-6 text-slate-400 text-xl opacity-50">🔒</div>
                    )}
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