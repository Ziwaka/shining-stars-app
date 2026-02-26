"use client";
import { useRouter, usePathname } from 'next/navigation';

export default function StudentMasterLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const getBtnClass = (path) => {
    const isActive = pathname === path;
    return isActive 
      ? "px-6 py-2 bg-[#fbbf24] text-[#020617] rounded-full text-[10px] font-black uppercase border-b-4 border-amber-600 shadow-lg italic transition-all scale-105"
      : "px-6 py-2 bg-white/10 text-white rounded-full text-[10px] font-black uppercase border-2 border-white/20 hover:bg-white/10 italic transition-all";
  };

  return (
    <div className="min-h-screen bg-[#0F071A] font-black text-white selection:bg-[#fbbf24]">
      
      {/* --- STUDENT NAVIGATION BAR --- */}
      <nav className="bg-gradient-to-r from-[#4c1d95] via-[#6d28d9] to-[#1E293B] p-6 md:px-12 flex flex-col md:flex-row justify-between items-center sticky top-0 z-[100] shadow-2xl border-b-[8px] border-[#fbbf24] gap-6 font-black text-white">
        <div className="flex items-center gap-6 cursor-pointer" onClick={() => router.push('/student/school-dashboard')}>
          <img src="/logo.jpg" alt="Logo" className="w-12 h-12 rounded-2xl border-2 border-white shadow-xl" />
          <h1 className="text-xl md:text-3xl uppercase tracking-tighter italic font-black">Shining Stars - Ma Thwe</h1>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3 font-black">
          <button onClick={() => router.push('/student/school-dashboard')} className={getBtnClass('/student/school-dashboard')}>SCHOOL 🏠</button>
          <button onClick={() => router.push('/student/profile')} className={getBtnClass('/student/profile')}>PROFILE 👤</button>
          <button onClick={() => router.push('/student/my-performance')} className={getBtnClass('/student/my-performance')}>MY-RECORD ★</button>
          {/* ဖြုတ်ထားသောနေရာ: Redundant Logout Button ကို ဖြုတ်လိုက်ပါပြီ */}
        </div>
      </nav>

      <main className="relative z-10">{children}</main>

      <style jsx global>{`
        body { background-color: #0F071A; font-weight: 900 !important; }
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-thumb { background: #fbbf24; border-radius: 10px; }
      `}</style>
    </div>
  );
}