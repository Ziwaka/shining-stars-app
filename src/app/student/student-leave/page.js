"use client";
import Image from "next/image";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

export default function StudentLeavePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'Medical',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!savedUser) { router.push('/login'); return; }
    setUser(JSON.parse(savedUser));
    setLoading(false);
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      alert("အချက်အလက်အားလုံး ပြည့်စုံအောင် ဖြည့်ပေးပါဗျာ။");
      return;
    }
    
    setSubmitting(true);
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // အစ်ကို့ရဲ့ Tab No. 8: Leave_Records Headers များအတိုင်း ဒေတာပြင်ဆင်ခြင်း
    const leaveData = [{
      "Date_Applied": new Date().toLocaleDateString('en-GB'),
      "User_Type": "Student",
      "User_ID": user.Student_ID || user['Enrollment No.'],
      "Name": user.Name,
      "Leave_Type": formData.leaveType,
      "Start_Date": formData.startDate,
      "End_Date": formData.endDate,
      "Total_Days": totalDays,
      "Reason": formData.reason,
      "Approved_By": "-",
      "Status": "Pending"
    }];

    try {
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'submitData', sheetName: 'Leave_Records', data: leaveData }),
      });
      const result = await res.json();
      if (result.success) {
        alert("ခွင့်တိုင်ကြားမှု အောင်မြင်ပါသည်။ ကျောင်းမှ အတည်ပြုချက်ကို စောင့်ဆိုင်းပေးပါဗျာ။ ✅");
        router.push('/student');
      }
    } catch (err) { 
      alert("Error: ဒေတာပေးပို့မှု မအောင်မြင်ပါ။"); 
    } finally { 
      setSubmitting(false); 
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="font-black text-xl uppercase tracking-widest animate-pulse" style={{color:'#020617'}}>Accessing Leave Portal...</p>
    </div>
  );

  return (
    <div className="min-h-screen font-sans pb-20 selection:bg-gold" style={{background:'#F8FAFC', color:'#020617'}}>
      {/* Official Top Bar */}
      <nav className="bg-white border-b-4 px-8 py-6 flex justify-between items-center sticky top-0 z-50 shadow-sm" style={{borderColor:'#020617'}}>
        <div className="flex items-center gap-4">
          <Image src="/logo.png" width={48} height={48} alt="Logo" className="w-12 h-12 rounded-xl shadow-lg border border-slate-50" />
          <div>
            <h1 className="font-black text-sm md:text-lg uppercase tracking-tight leading-none" style={{color:'#020617'}}>
               Shining Stars - Ma Thwe
            </h1>
            <p className="font-bold uppercase mt-1 italic" style={{color:'#4c1d95', fontSize:'8px', letterSpacing:'0.4em'}}>Official Student Leave Request</p>
          </div>
        </div>
        <button onClick={() => router.push('/student')} className="font-black uppercase bg-slate-100 px-8 py-3 rounded-full hover:bg-[#020617] hover:text-white transition-all" style={{fontSize:'10px'}}>
          ← BACK
        </button>
      </nav>

      <div className="max-w-2xl mx-auto p-6 mt-10">
        <form onSubmit={handleSubmit} className="bg-white p-10 md:p-14 shadow-2xl border border-slate-100 space-y-10 relative overflow-hidden" style={{borderRadius:'4rem'}}>
          <div className="absolute top-[-20px] right-[-20px] p-10 opacity-5 pointer-events-none rotate-12" style={{fontSize:'12rem'}}>📝</div>
          
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 leading-none" style={{color:'#020617'}}>Apply for Leave</h2>
            <p className="text-slate-400 font-bold uppercase italic" style={{fontSize:'9px', letterSpacing:'0.3em'}}>Authorized Parent/Student Application</p>
          </div>

          <div className="space-y-8">
            {/* Category Selection */}
            <div>
              <label className="block font-black uppercase text-slate-400 mb-4 ml-4 italic" style={{fontSize:'10px', letterSpacing:'0.4em'}}>Select Leave Category</label>
              <select 
                value={formData.leaveType}
                onChange={(e) => setFormData({...formData, leaveType: e.target.value})}
                className="w-full p-6 bg-slate-50 border-2 border-slate-100 font-black text-slate-950 outline-none focus:border-purple shadow-sm transition-all" style={{borderRadius:'2.5rem'}}
              >
                <option value="Medical">Medical Leave (နေမကောင်း၍)</option>
                <option value="Personal">Personal Leave (ကိစ္စရှိ၍)</option>
                <option value="Emergency">Emergency (အရေးပေါ်)</option>
              </select>
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block font-black uppercase text-slate-400 mb-4 ml-4 italic" style={{fontSize:'10px', letterSpacing:'0.4em'}}>Start Date</label>
                <input 
                  type="date" 
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full p-6 bg-slate-50 border-2 border-slate-100 font-black text-slate-950 outline-none focus:border-purple shadow-sm" style={{borderRadius:'2.5rem'}}
                />
              </div>
              <div>
                <label className="block font-black uppercase text-slate-400 mb-4 ml-4 italic" style={{fontSize:'10px', letterSpacing:'0.4em'}}>End Date</label>
                <input 
                  type="date" 
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full p-6 bg-slate-50 border-2 border-slate-100 font-black text-slate-950 outline-none focus:border-purple shadow-sm" style={{borderRadius:'2.5rem'}}
                />
              </div>
            </div>

            {/* Description Area */}
            <div>
              <label className="block font-black uppercase text-slate-400 mb-4 ml-4 italic" style={{fontSize:'10px', letterSpacing:'0.4em'}}>Detailed Reason</label>
              <textarea 
                rows="4"
                required
                placeholder="အကြောင်းပြချက် အသေးစိတ်ကို ဤနေရာတွင် ရေးသားပေးပါ..."
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="w-full p-8 bg-slate-50 border-2 border-slate-100 font-black text-slate-950 outline-none focus:border-purple shadow-sm placeholder:text-slate-300 transition-all" style={{borderRadius:'3rem'}}
              ></textarea>
            </div>
          </div>

          <button 
            type="submit"
            disabled={submitting}
            className="w-full py-8 text-white font-black uppercase shadow-2xl hover:bg-[#4c1d95] transition-all active:scale-95 text-sm" style={{background:'#020617', borderRadius:'3rem', letterSpacing:'0.6em', borderBottomWidth:'12px', borderColor:'#fbbf24'}}
          >
            {submitting ? "RECORDING..." : "CONFIRM & SEND REQUEST"}
          </button>
        </form>

        {/* Mascot Message */}
        <div className="mt-12 p-10 bg-white border border-slate-100 flex items-center gap-8 shadow-sm" style={{borderRadius:'3.5rem'}}>
           <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-xl ring-8 ring-slate-50" style={{background:'#4c1d95'}}>🐱</div>
           <div>
              <p className="font-black uppercase mb-2 italic" style={{fontSize:'10px', color:'#4c1d95', letterSpacing:'0.4em'}}>Mars Notification:</p>
              <p className="font-black text-lg leading-tight" style={{color:'#020617'}}>"Health always comes first! Take a good rest and recover soon. 💜"</p>
           </div>
        </div>
      </div>
    </div>
  );
}