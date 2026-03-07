"use client";
import { getPhotoUrl } from "@/lib/cloudinary";
import Image from "next/image";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

/**
 * Shining Stars - Premium Student Profile (v68.0)
 * FIX: Replaced Drive UC endpoint with highly stable Google UserContent endpoint (lh3) for images [cite: 2026-02-25]
 * FIX: Added multiple variations for Photo column name matching and Auto-Fallback (onError) [cite: 2026-02-25]
 * STYLE: High Visibility Ivory (#FDFCF0) & Slate-950 Bold Luxury Template [cite: 2023-02-23]
 */
export default function UltimateMaThweProfile() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 🌟 FIX: Ultimate Google Drive Image Extractor
  const getImageUrl = (url) => {
    if (!url || String(url).trim() === "-" || String(url).trim() === "") return "/logo.png";
    try {
      const strUrl = String(url).trim();
      
      // တကယ်လို့ Google Drive Link မဟုတ်ရင် (ဥပမာ - Imgur လင့်ခ်ဖြစ်နေရင်) တိုက်ရိုက်ပြမည်
      if (!strUrl.includes('drive.google.com')) return strUrl;

      // Google Drive ID ကို ဆွဲထုတ်ခြင်း
      let fileId = null;
      if (strUrl.includes('id=')) {
        fileId = strUrl.split('id=')[1]?.split('&')[0];
      } else if (strUrl.includes('/d/')) {
        fileId = strUrl.split('/d/')[1]?.split('/')[0];
      }
      
      // အတည်ငြိမ်ဆုံး Google Image Server Link သို့ ပြောင်းခြင်း
      return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : "/logo.png";
    } catch (e) { 
      return "/logo.png"; 
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "-") return "-";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  useEffect(() => {
    const fetchVault = async () => {
      const saved = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (!saved || saved === "undefined") { router.push('/login'); return; }
      const authUser = JSON.parse(saved);
      const myID = (authUser.Student_ID || authUser['Enrollment No.'] || "").toString().trim();

      try {
        const res = await fetch(WEB_APP_URL, { 
          method: 'POST', 
          body: JSON.stringify({ action: 'getData', sheetName: 'Student_Directory' }) 
        });
        const text = await res.text();
        const result = JSON.parse(text);

        if (result.success && Array.isArray(result.data)) {
          // NORMALIZER: Trim spaces from keys
          const normalizedData = result.data.map(obj => {
            const cleanObj = {};
            Object.keys(obj).forEach(k => { cleanObj[k.trim()] = obj[k]; });
            return cleanObj;
          });

          const student = normalizedData.find(s => 
            (s['Enrollment No.']?.toString().trim() === myID) || 
            (s['Student_ID']?.toString().trim() === myID)
          );
          setSelectedStudent(student);
        }
      } catch (err) { 
        console.error("Profile Sync Error:", err); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchVault();
  }, [router]);

  const DataGroupBlock = ({ title, icon, items, borderColor = "#020617" }) => (
    <div className="bg-white p-8 md:p-10 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl" style={{borderRadius:'3rem', borderTopWidth:'12px', borderColor: borderColor }}>
      <h3 className="text-xl md:text-2xl uppercase italic font-black text-slate-950 mb-8 flex items-center gap-3 border-b-2 border-slate-100 pb-4">
        <span className="bg-slate-100 p-3 rounded-2xl">{icon}</span> {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, idx) => (
          <div key={idx} className="bg-slate-50 p-5 border border-slate-200 flex flex-col justify-center" style={{borderRadius:'1.5rem'}}>
            <span className="md:text-xs font-black uppercase text-slate-400 tracking-widest mb-1" style={{fontSize:'10px'}}>
               {item.label}
            </span>
            <span className="text-sm md:text-lg font-black text-slate-950 leading-tight">
               {item.value || "-"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-black text-slate-950" style={{background:'#FDFCF0'}}>
         <div className="text-7xl mb-6 animate-pulse">🗃️</div>
         <div className="text-sm uppercase italic" style={{letterSpacing:'0.4em'}}>Retrieving Master Ledger...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-950 font-black selection:bg-gold pb-40" style={{background:'#FDFCF0'}}>
      <div className="mx-auto p-4 md:p-10 space-y-10 relative z-10" style={{maxWidth:'1400px'}}>
        
        {selectedStudent ? (
          <div className="space-y-10">
            
            {/* 🌟 PREMIUM IDENTITY HEADER */}
            <div className="bg-slate-950 p-8 md:p-14 shadow-2xl flex flex-col md:flex-row items-center gap-8 md:gap-14 relative overflow-hidden" style={{borderRadius:'4rem', borderBottomWidth:'15px', borderColor:'#fbbf24'}}>
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

              <div className="relative shrink-0 z-10">
                <div className="w-48 h-48 md:w-72 md:h-72 overflow-hidden border-8 border-white/10 shadow-2xl bg-white flex items-center justify-center" style={{borderRadius:'3.5rem'}}>
                   {/* 🌟 FIX: Multi-key photo check and auto-fallback logo if image is broken */}
                   <img 
                      src={getImageUrl(selectedStudent['Photo URL'] || selectedStudent['Photo_URL'] || selectedStudent['Photo'] || selectedStudent['Photo_Link'])} 
                      className="w-full h-full object-cover" 
                      alt="Student Photo" 
                      onError={(e) => { e.target.src = '/logo.png'; }} 
                   />
                </div>
                <div className="absolute -bottom-3 -right-3 w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center border-4 border-slate-950 text-slate-950 text-2xl md:text-4xl shadow-lg" style={{background:'#fbbf24'}}>⭐</div>
              </div>

              <div className="text-center md:text-left flex-1 font-black z-10">
                <div className="inline-block px-5 py-2 text-slate-950 md:text-xs font-black uppercase rounded-xl mb-4 shadow-md" style={{background:'#fbbf24', fontSize:'10px', letterSpacing:'0.2em'}}>Premium Profile</div>
                <h2 className="md:text-sm uppercase mb-2 italic" style={{color:'#fbbf24', fontSize:'10px', letterSpacing:'0.5em'}}>Shining Stars - Ma Thwe</h2>
                <h1 className="text-3xl md:text-6xl italic uppercase font-black tracking-tighter leading-tight mb-2 text-white">
                  {selectedStudent['Name (ALL CAPITAL)'] || selectedStudent['Name']}
                </h1>
                <p className="text-xl md:text-3xl text-slate-400 font-black italic mb-8">{selectedStudent['အမည်']}</p>
                
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <div className="px-6 py-3 bg-white/10 text-white rounded-2xl border border-white/20 text-xs md:text-sm uppercase tracking-widest">
                     ID: <span className="" style={{color:'#fbbf24'}}>{selectedStudent['Enrollment No.'] || selectedStudent['Student_ID']}</span>
                  </div>
                  <div className="px-6 py-3 bg-white/10 text-white rounded-2xl border border-white/20 text-xs md:text-sm uppercase tracking-widest">
                     Grade: <span className="text-emerald-400">{selectedStudent['Grade']}</span>
                  </div>
                  <div className="px-6 py-3 text-slate-950 rounded-2xl text-xs md:text-sm uppercase tracking-widest shadow-lg" style={{background:'#fbbf24'}}>
                     House: {selectedStudent['House'] || "UNASSIGNED"}
                  </div>
                </div>
              </div>
            </div>

            {/* 🌟 PRECISE DATA GROUPS */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              
              <DataGroupBlock title="Institutional Registry" icon="🏛️" borderColor="#3B82F6" items={[
                { label: "Enrollment No.", value: selectedStudent['Enrollment No.'] },
                { label: "Registration No.", value: selectedStudent['Registration No.'] },
                { label: "NRC Identity", value: selectedStudent['NRC'] },
                { label: "Official Status", value: selectedStudent['Status'] },
                { label: "Campus House", value: selectedStudent['House'] },
                { label: "Join Date", value: formatDate(selectedStudent['Join Date']) },
                { label: "Gender", value: selectedStudent['Sex'] },
                { label: "Record No.", value: selectedStudent['No.'] }
              ]} />

              <DataGroupBlock title="Personal Metadata" icon="💎" borderColor="#8B5CF6" items={[
                { label: "Date of Birth", value: formatDate(selectedStudent['DOB']) },
                { label: "Age", value: selectedStudent['Age'] },
                { label: "Current Age", value: selectedStudent['Current Age'] },
                { label: "Nationality", value: selectedStudent['Nation'] },
                { label: "Religion", value: selectedStudent['Religion'] },
                { label: "ဘာသာတွဲ (Stream)", value: selectedStudent['Steam'] },
                { label: "Transferred From", value: selectedStudent['Transferred from'] },
                { label: "Current Grade", value: selectedStudent['Grade'] }
              ]} />

              <DataGroupBlock title="Guardian & Family" icon="👪" borderColor="#F59E0B" items={[
                { label: "Father Name", value: selectedStudent["Father's Name"] },
                { label: "Father Job", value: selectedStudent["Father's Occupation"] },
                { label: "Mother Name", value: selectedStudent["Mother's Name"] },
                { label: "Mother Job", value: selectedStudent["Mother's Occupation"] },
                { label: "Primary Phone", value: selectedStudent["Parent Phone 1"] },
                { label: "Secondary Phone", value: selectedStudent["Parent Phone 2"] },
                { label: "Guardian Name", value: selectedStudent["Guardian's Name"] },
                { label: "Relationship", value: selectedStudent["Parent Guardian"] }
              ]} />

              <DataGroupBlock title="Residence & Welfare" icon="🌍" borderColor="#10B981" items={[
                { label: "Township", value: selectedStudent['မြို့'] },
                { label: "Division", value: selectedStudent['တိုင်းဒေသကြီး'] },
                { label: "Ward / Quarter", value: selectedStudent['Ward/Quarter'] },
                { label: "Full Address", value: selectedStudent['Address'] },
                { label: "Street", value: selectedStudent['Address & Street'] },
                { label: "School/Hostel", value: selectedStudent['School/Hostel'] },
                { label: "Clinical Alerts / Allergies", value: selectedStudent['ရောဂါနှင့် မတည့်သော အစားအစာ/ဆေး'] },
                { label: "Dietary Exclusion", value: selectedStudent['မစားစာရင်း'] },
                { label: "Siblings Info", value: selectedStudent['မောင်နှမ အရင်းအချာ'] }
              ]} />

            </div>

            {/* WATERMARK FOOTER */}
            <div className="text-center py-20 opacity-30 italic font-black text-slate-500">
               <div className="text-5xl mb-4">🌟</div>
               <p className="text-3xl md:text-5xl uppercase tracking-widest font-black leading-none">SHINING STARS</p>
               <p className="uppercase mt-4 font-black" style={{fontSize:'10px', letterSpacing:'1em'}}>VERSION 68.0 • MASTER LEDGER SYNCED</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center font-black text-slate-400 uppercase italic" style={{minHeight:'60vh'}}>
             <div className="text-6xl mb-4">📭</div>
             <div className="text-2xl">No Archive Entry Found.</div>
             <p className="text-xs mt-2 tracking-widest">Please contact administration.</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        body { background-color: #FDFCF0; font-weight: 900 !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    
      {/* 🏠 Home Button */}
      <button onClick={() => router.push('/student')}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-2.5 border-2 rounded-full font-black uppercase tracking-wider shadow-xl hover:bg-gold hover:text-[#020617] transition-all" style={{background:'#020617', borderColor:'#fbbf24', color:'#fbbf24', fontSize:'10px'}}>
        🏠 Home
      </button>
</div>
  );
}