"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffAccessHub() {
  const [user, setUser] = useState(null);
  const [isGM, setIsGM] = useState(false); 
  const router = useRouter();

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || "null");
    if (!auth) { 
      router.push('/login'); 
    } else {
      setUser(auth);
      if (auth.userRole === 'management' || auth.Position === 'GM') {
        setIsGM(true);
      }
    }
  }, [router]);

  if (!user) return null;

  // 🌟 Sheet မှ Permission (TRUE/FALSE) များကို စစ်ဆေးရန် 🌟
  const hasPermission = (field) => {
    const val = user[field];
    return val === true || val === "TRUE" || val === "true";
  };

  // 🌟 DYNAMIC TOOL GROUPS 🌟
  // normalLocked ဆိုသည်မှာ သာမန် Staff များအတွက် Lock ချထားခြင်း ရှိမရှိ စစ်ဆေးခြင်းဖြစ်သည်။
  // GM ဝင်လာပါက normalLocked ဖြစ်နေသော ခလုတ်များတွင် "GM Access ✨" Badge ပြပေးပါမည်။
  const toolGroups = [
    {
      group: "Student & House Operations",
      items: [
        { name: 'Student Directory', path: '/staff/student-dir', icon: '👤', normalLocked: !hasPermission('Can_View_Student') },
        { name: 'Hostel Hub', path: '/staff/hostel', icon: '🏠', normalLocked: !hasPermission('Can_Manage_Hostel') },
        { name: 'House Score Adjust', path: '/staff/points', icon: '⚖️', normalLocked: !hasPermission('Can_Adjust_Points') } 
      ]
    },
    {
      group: "Staff & Internal Registry",
      items: [
        { name: 'Staff Contacts', path: '/staff/contacts', icon: '📞', normalLocked: false }, // အားလုံးဝင်ခွင့်ရှိသည်
        { name: 'Master Staff Profile', path: '/staff/staff-dir', icon: '👔', normalLocked: !hasPermission('Can_View_Staff') },
        { name: 'Leave Hub (Staff)', path: '/management/leave', icon: '📄', normalLocked: !hasPermission('Can_Record_Attendance_&_Leave') },
        { name: 'Staff Performance', path: '/management/performance', icon: '🏆', normalLocked: true } // မူလက ပိတ်ထားသည် (GM သာရမည်)
      ]
    },
    {
      group: "Administrative & Finance",
      items: [
        { name: 'Financial Registry', path: '/staff/fees', icon: '💰', normalLocked: !hasPermission('Can_Manage_Fees') },
        { name: 'Registry Notes', path: '/staff/notes', icon: '📒', normalLocked: !hasPermission('Can_Record_Note') },
        { name: 'Mgt Dashboard', path: '/management/mgt-dashboard', icon: '🛡️', normalLocked: true } // မူလက ပိတ်ထားသည် (GM သာရမည်)
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F0F9FF] font-black text-slate-950 p-6 md:p-14 pb-48">
      <div className="max-w-[1500px] mx-auto space-y-16">
        
        {/* SUPREMACY HEADER */}
        <div className="bg-slate-950 rounded-[4rem] p-10 md:p-16 border-b-[15px] border-[#fbbf24] shadow-3xl flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#fbbf24]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="relative z-10 shrink-0">
            <div className="w-24 h-24 md:w-40 md:h-40 bg-white rounded-[2.5rem] flex items-center justify-center text-5xl md:text-7xl shadow-2xl border-4 border-[#fbbf24]">
               {isGM ? "🏛️" : "👤"}
            </div>
          </div>

          <div className="text-center md:text-left flex-1 z-10">
            <div className="inline-block px-4 py-1.5 bg-[#fbbf24] text-slate-950 text-[10px] font-black uppercase rounded-lg mb-4 tracking-[0.2em] shadow-md">
               {isGM ? "General Manager Authority" : "Educational Staff Pathway"}
            </div>
            <h1 className="text-4xl md:text-7xl italic uppercase font-black text-white tracking-tighter leading-none mb-4">
               {user.Name || user.username}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
               <span className="text-[#fbbf24] text-xl md:text-2xl font-black italic tracking-widest uppercase">• ID: {user.ID || user.Student_ID || "STAFF-PRO"}</span>
               <span className="h-4 w-px bg-white/20 hidden md:block"></span>
               <p className="text-slate-400 text-xs md:text-sm uppercase font-black tracking-[0.3em] italic">Status: <span className="text-white">Authorized Access</span></p>
            </div>
          </div>
        </div>

        {/* ACCESS GRID */}
        <div className="space-y-16">
          {toolGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-8">
              <h2 className="text-xl md:text-2xl uppercase italic border-l-8 border-slate-950 pl-6 tracking-tight text-slate-950">
                {group.group}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {group.items.map((tool, i) => {
                  
                  // 🌟 FINAL ACCESS LOGIC 🌟
                  // GM ဆိုလျှင် အားလုံးပွင့်မည်။ မဟုတ်လျှင် normalLocked အတိုင်းဖြစ်သည်။
                  const isEffectivelyLocked = isGM ? false : tool.normalLocked;
                  // သာမန် Staff ပိတ်ထားသော်လည်း ယခုဝင်နေသူမှာ GM ဖြစ်နေပါက Badge ပြမည်။
                  const showGMBadge = isGM && tool.normalLocked;

                  return (
                    <button
                      key={i}
                      onClick={() => !isEffectivelyLocked && router.push(tool.path)}
                      className={`relative group p-10 rounded-[3rem] border-b-[12px] transition-all duration-300 flex flex-col items-center text-center gap-6 shadow-xl
                        ${isEffectivelyLocked 
                          ? 'bg-slate-200 border-slate-300 opacity-60 cursor-not-allowed' 
                          : 'bg-white border-slate-100 hover:border-[#fbbf24] hover:-translate-y-2 active:scale-95'
                        }`}
                    >
                      <span className={`text-6xl md:text-7xl transition-transform duration-500 ${!isEffectivelyLocked && 'group-hover:scale-125'}`}>
                        {tool.icon}
                      </span>
                      
                      <div className="space-y-2">
                        <h3 className={`text-lg md:text-xl font-black uppercase italic tracking-tighter ${isEffectivelyLocked ? 'text-slate-400' : 'text-slate-950'}`}>
                          {tool.name}
                        </h3>
                        <p className={`text-[10px] uppercase tracking-[0.3em] font-black max-w-[200px] truncate mx-auto
                           ${isEffectivelyLocked ? 'text-rose-400' : 'text-slate-400'}`}>
                          {isEffectivelyLocked ? "RESTRICTED ACCESS" : (showGMBadge ? "GM AUTHORIZED" : "AUTHORIZED MODULE")}
                        </p>
                      </div>

                      {/* 🔒 LOCK ICON IF RESTRICTED */}
                      {isEffectivelyLocked && (
                        <div className="absolute top-6 right-8 text-slate-400 text-2xl opacity-50">
                          🔒
                        </div>
                      )}

                      {/* ✨ GM UNLOCKED BADGE */}
                      {showGMBadge && (
                        <div className="absolute top-6 right-8 bg-emerald-500 text-white text-[9px] px-3 py-1 rounded-lg font-black uppercase tracking-widest shadow-md animate-pulse">
                           GM Access ✨
                        </div>
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
