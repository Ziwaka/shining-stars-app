"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';
import { hasPerm } from '@/lib/permissions';

export default function StaffAccessHub() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || "null");
    if (!auth) { router.push('/login'); return; }
    if (auth.userRole === 'management') { router.push('/management/mgt-dashboard'); return; }

    // Fetch fresh permissions from Staff_Permissions sheet
    fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getStaffPermissions' }) })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          const fresh = res.data.find(s =>
            (s.Staff_ID && s.Staff_ID.toString() === auth.Staff_ID?.toString()) ||
            (s.Name && s.Name === auth['Name (ALL CAPITAL)']) ||
            (s.Name && s.Name === auth.Name)
          );
          if (fresh) {
            const updated = { ...auth, ...fresh };
            localStorage.setItem('user', JSON.stringify(updated));
            setUser(updated);
            return;
          }
        }
        setUser(auth);
      })
      .catch(() => setUser(auth));
  }, []);

  if (!user) return null;

  // ── Permission rules ──────────────────────────────────────────────
  // FREE (no permission needed):
  //   Student Directory, House Score Adjustment, Staff Contacts,
  //   My Leave, Registry Notes, Lost & Found, My Timetable
  //
  // LOCKED (permission required):
  //   Hostel, Master Registry, Financial Registry, Inventory,
  //   Communication, Exam Records, Calendar, Attendance/Leave mgmt

  const toolGroups = [
    {
      group: "Campus & Student Operations",
      items: [
        { name: 'Student Directory',   path: '/staff/student-dir', icon: '👤', perm: null },
        { name: 'Hostel Management',   path: '/staff/hostel',      icon: '🏠', perm: 'Can_Manage_Hostel' },
        { name: 'House Score Adjust',  path: '/staff/points',      icon: '⚖️', perm: null },
      ]
    },
    {
      group: "Staff Professional Hub",
      items: [
        { name: 'Staff Contacts',   path: '/staff/contacts',   icon: '📞', perm: null },
        { name: 'Master Registry',  path: '/staff/staff-dir',  icon: '👔', perm: 'Can_View_Staff' },
        { name: 'My Leave',         path: '/staff/my-leave',   icon: '📄', perm: null },
      ]
    },
    {
      group: "Administrative & Ledger",
      items: [
        { name: 'Financial Registry', path: '/staff/fees',             icon: '💰', perm: 'Can_Manage_Fees' },
        { name: 'Registry Notes',     path: '/staff/notes',            icon: '📒', perm: null },
        { name: 'Inventory',          path: '/staff/inventory',        icon: '📦', perm: 'Can_Manage_Inventory' },
        { name: 'Lost & Found',       path: '/staff/lost-found',       icon: '🔍', perm: null },
        { name: 'Communication',      path: '/management/communication',icon: '📢', perm: 'Can_Post_Announcement' },
        { name: 'Exam Records',       path: '/staff/exam-records',     icon: '📝', perm: 'Can_Record_Note' },
        { name: 'Calendar',           path: '/staff/calendar',         icon: '📅', perm: 'Can_Manage_Events' },
        { name: 'My Timetable',       path: '/staff/timetable',        icon: '🗓️', perm: null },
      ]
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F0F9FF] font-black text-slate-950 p-5 md:p-12 pb-32">
      <div className="max-w-[1400px] mx-auto space-y-12">

        {/* HEADER */}
        <div className="bg-slate-950 rounded-[3rem] p-8 md:p-14 border-b-[12px] border-[#fbbf24] shadow-2xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#fbbf24]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10 w-20 h-20 md:w-32 md:h-32 bg-white rounded-[2rem] flex items-center justify-center text-4xl md:text-6xl shadow-xl border-4 border-[#fbbf24] shrink-0">
            👤
          </div>
          <div className="text-center md:text-left flex-1 z-10 min-w-0">
            <div className="inline-block px-4 py-1.5 bg-[#fbbf24] text-slate-950 text-[10px] font-black uppercase rounded-lg mb-3 tracking-[0.2em]">
              Educational Staff
            </div>
            <h1 className="text-3xl md:text-6xl italic uppercase font-black text-white tracking-tighter leading-none mb-3 break-words">
              {user['Name (ALL CAPITAL)'] || user.Name || user.username}
            </h1>
            <p className="text-slate-400 text-xs uppercase font-black tracking-[0.3em]">
              ID: <span className="text-[#fbbf24]">{user.Staff_ID || user.ID || "—"}</span>
              <span className="mx-3 opacity-30">|</span>
              Status: <span className="text-white">Authorized</span>
            </p>
          </div>
          <button onClick={handleLogout}
            className="relative z-50 px-8 py-4 bg-rose-600 text-white text-xs font-black uppercase rounded-2xl border-b-4 border-rose-900 active:scale-95 transition-all shrink-0 shadow-xl hover:bg-rose-700">
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
                {group.items.map((tool, i) => {
                  const locked = tool.perm ? !hasPerm(user, tool.perm) : false;
                  return (
                    <button key={i}
                      onClick={() => !locked && router.push(tool.path)}
                      className={`relative group p-8 rounded-[2.5rem] border-b-[10px] transition-all duration-300 flex flex-col items-center text-center gap-5 shadow-lg
                        ${locked
                          ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                          : 'bg-white border-slate-100 hover:border-[#fbbf24] hover:-translate-y-1.5 active:scale-95'
                        }`}>
                      <span className={`text-5xl md:text-6xl transition-transform duration-300 ${!locked && 'group-hover:scale-110'}`}>
                        {tool.icon}
                      </span>
                      <div>
                        <h3 className={`text-base md:text-lg font-black uppercase italic tracking-tight ${locked ? 'text-slate-400' : 'text-slate-950'}`}>
                          {tool.name}
                        </h3>
                        <p className={`text-[9px] uppercase tracking-[0.3em] font-black mt-1 ${locked ? 'text-rose-400' : 'text-slate-400'}`}>
                          {locked ? "RESTRICTED ACCESS" : "AUTHORIZED MODULE"}
                        </p>
                      </div>
                      {locked && (
                        <div className="absolute top-5 right-6 text-slate-400 text-xl opacity-50">🔒</div>
                      )}
                    </button>
                  );
                })}
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