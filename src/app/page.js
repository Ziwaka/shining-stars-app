"use client";
import { useRouter } from 'next/navigation';

export default function LuxurySingleScreenPage() {
  const router = useRouter();

  return (
    /* 🌟 Scroll ဆွဲ၍ရအောင် 'relative min-h-screen' ဖြင့် အသေအချာ ပြင်ဆင်ထားပါသည် */
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between bg-[#4c1d95] text-white selection:bg-[#FFD700] m-0 p-0 overflow-x-hidden">
      
      {/* Background Atmosphere Overlays */}
      <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-15 pointer-events-none -z-10"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-[#4c1d95] via-[#3b0764] to-[#020617] pointer-events-none -z-20"></div>

      {/* --- TOP SECTION: LOGO & BRANDING --- */}
      <div className="relative z-10 w-full flex flex-col items-center pt-16 px-6 text-center space-y-8">
        <div className="bg-white/10 p-4 rounded-[32px] border border-[#FFD700]/30 backdrop-blur-xl shadow-2xl">
          <img src="/logo.jpg" alt="Logo" className="w-20 h-20 md:w-24 md:h-24 object-contain" />
        </div>

        <div className="space-y-4">
          <p className="text-[#FFD700] font-black tracking-[0.5em] uppercase text-[10px] leading-none opacity-80">Official Portal</p>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-black tracking-tight leading-tight mb-2 text-white italic whitespace-nowrap">
            Shining Stars - မသွယ်
          </h1>
          <p className="text-purple-200 font-black tracking-[0.3em] uppercase text-xs md:text-sm">
            Private High School
          </p>
        </div>

        <div className="max-w-xs md:max-w-md pt-4 border-t border-white/10">
          <p className="text-xl md:text-2xl text-purple-100 italic font-black tracking-widest font-serif">
            "Experience the difference"
          </p>
        </div>
      </div>

      {/* --- ACTION SECTION: BUTTONS --- */}
      <div className="relative z-10 w-full max-w-sm px-8 space-y-6 pb-10 pt-6">
        
        <button 
          onClick={() => router.push('/login')}
          className="group w-full bg-white rounded-[24px] p-8 flex flex-col items-center justify-center gap-3 shadow-2xl transition-all hover:-translate-y-2 active:scale-95 border-b-8 border-[#FFD700]"
        >
          <span className="font-black text-slate-950 text-xs tracking-[0.4em] uppercase opacity-60">ENTER</span>
          <span className="font-black text-slate-950 text-2xl tracking-[0.1em] uppercase">PORTAL</span>
          <span className="text-slate-400 font-black text-[9px] uppercase tracking-widest mt-1">Student & Staff Access</span>
        </button>

        <button 
          onClick={() => router.push('/public-zone')}
          className="group w-full bg-[#FFD700] rounded-[24px] p-6 flex flex-col items-center justify-center transition-all hover:bg-white active:scale-95 shadow-xl"
        >
          <span className="font-black text-slate-950 text-[10px] tracking-widest uppercase opacity-60">PUBLIC ZONE</span>
          <span className="font-black text-slate-950 text-base tracking-widest uppercase leading-none">News & Resources</span>
        </button>
      </div>

      {/* --- BOTTOM SECTION: ESTABLISHED INFO --- */}
      <div className="relative z-10 w-full text-center pb-10 px-4 flex flex-col items-center justify-center">
         
         {/* 🌟 အစ်ကို လိုချင်သော စာသားအပြည့်အစုံကို သပ်ရပ်စွာ နေရာချပေးထားပါသည် */}
         <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-white/60 mb-2">
           SHINING STARS - MA THWE PRIVATE HIGH SCHOOL
         </p>
         
         <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/40 mb-6 italic">
           ESTABLISHED IN 2019 • SOUTHERN SHAN STATE, TAUNGGYI.
         </p>

         {/* 🌟 Styled Developer Credit */}
         <div>
           <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-[#FFD700] italic bg-black/40 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 shadow-2xl inline-block">
             Developed by SHINE THIT.
           </span>
         </div>
      </div>
    </div>
  );
}
