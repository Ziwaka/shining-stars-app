"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL, GIDS } from '@/lib/api';

/**
 * Shining Stars - Hostel Facilities (v1.0)
 * FEATURE: Inventory Tracking & Condition Monitoring [cite: 2026-02-25]
 * STYLE: Slate-950 Bold Luxury | Blue Theme [cite: 2023-02-23]
 */
export default function HostelFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);
  const router = useRouter();

  const [form, setForm] = useState({ hostel: "", item: "", qty: "", good: "", damaged: "", repair: "", remark: "" });

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || "null");
    if (!auth || auth['Can_Manage_Hostel'] !== true) { router.push('/staff'); return; }
    setStaff(auth);

    const initFacilities = async () => {
      try {
        const [fRes, hRes] = await Promise.all([
          fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getData', sheetName: 'Hostel_Facilities' }) }),
          fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getConfig', category: 'Hostel_List' }) })
        ]);
        const fData = await fRes.json();
        const hData = await hRes.json();

        if (fData.success) setFacilities(fData.data);
        if (hData.success && hData.data.length > 0) {
          setHostels(hData.data);
          setForm(prev => ({ ...prev, hostel: hData.data[0].Setting_Name }));
        }
      } finally { setLoading(false); }
    };
    initFacilities();
  }, [router]);

  const handleSubmit = async () => {
    if (!form.item || !form.qty) { alert("MANDATORY: Enter Item Name and Total Quantity!"); return; }
    setLoading(true);
    const data = [{
      Hostel_Name: form.hostel,
      Item_Name: form.item,
      Total_Quantity: form.qty,
      Good_Condition: form.good,
      Damaged: form.damaged,
      Need_Repair: form.repair,
      Last_Check_Date: new Date().toISOString().split('T')[0],
      Recorded_By: staff.Name,
      Remark: form.remark
    }];
    try {
      const res = await fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'recordNote', sheetName: 'Hostel_Facilities', data }) });
      if ((await res.json()).success) { alert("INVENTORY UPDATED ★"); window.location.reload(); }
    } finally { setLoading(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#0F071A] flex items-center justify-center font-black text-[#fbbf24] animate-pulse text-2xl uppercase italic">Authorizing Inventory...</div>;

  return (
    <div className="min-h-screen bg-[#0F071A] p-6 md:p-14 font-black selection:bg-[#fbbf24] text-slate-950">
      <div className="max-w-[1800px] mx-auto space-y-12">
        
        {/* HEADER [cite: 2026-02-25] */}
        <div className="bg-gradient-to-br from-blue-700 via-indigo-800 to-[#0F071A] p-10 rounded-[4rem] border-b-[15px] border-[#fbbf24] shadow-3xl flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button onClick={() => router.push('/staff/hostel')} className="bg-[#fbbf24] p-5 rounded-[2rem] hover:bg-white transition-all shadow-xl active:scale-90">🔙</button>
            <h1 className="text-4xl md:text-7xl italic uppercase font-black text-white tracking-tighter leading-none">Facility Log</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* ENTRY FORM [cite: 2026-02-25] */}
          <div className="xl:col-span-4 bg-white p-14 rounded-[5rem] border-b-[20px] border-indigo-900 shadow-3xl space-y-10">
            <h2 className="text-2xl uppercase italic text-indigo-900 font-black border-l-8 border-indigo-900 pl-6">Inventory Entry</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-slate-400 font-black ml-4">Hostel Name</label>
                <select className="w-full bg-slate-50 border-4 border-slate-100 p-6 rounded-[2rem] font-black italic outline-none" value={form.hostel} onChange={(e) => setForm({...form, hostel: e.target.value})}>
                  {hostels.map((h, i) => <option key={i} value={h.Setting_Name}>{h.Setting_Name}</option>)}
                </select>
              </div>
              <input type="text" placeholder="ITEM NAME (E.G. BED, FAN...)" className="w-full bg-slate-50 border-4 border-slate-100 p-7 rounded-[2.5rem] font-black italic text-xl outline-none" value={form.item} onChange={(e) => setForm({...form, item: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="TOTAL QTY" className="bg-slate-50 border-4 border-slate-100 p-6 rounded-[2rem] font-black italic outline-none" value={form.qty} onChange={(e) => setForm({...form, qty: e.target.value})} />
                <input type="number" placeholder="GOOD" className="bg-emerald-50 border-4 border-emerald-100 p-6 rounded-[2rem] font-black italic outline-none" value={form.good} onChange={(e) => setForm({...form, good: e.target.value})} />
                <input type="number" placeholder="DAMAGED" className="bg-rose-50 border-4 border-rose-100 p-6 rounded-[2rem] font-black italic outline-none" value={form.damaged} onChange={(e) => setForm({...form, damaged: e.target.value})} />
                <input type="number" placeholder="REPAIR" className="bg-amber-50 border-4 border-amber-100 p-6 rounded-[2rem] font-black italic outline-none" value={form.repair} onChange={(e) => setForm({...form, repair: e.target.value})} />
              </div>
              <button onClick={handleSubmit} className="w-full py-8 bg-[#1A0B2E] text-white rounded-[3.5rem] text-xl font-black uppercase italic shadow-2xl hover:bg-indigo-600 transition-all border-b-8 border-indigo-900">Sync Inventory ★</button>
            </div>
          </div>

          {/* MONITORING LIST [cite: 2026-02-25] */}
          <div className="xl:col-span-8 bg-white/5 p-12 rounded-[5rem] border border-white/10 shadow-3xl overflow-hidden">
            <h2 className="text-2xl uppercase italic text-indigo-400 font-black border-l-8 border-indigo-400 pl-6 mb-8">Asset Monitoring</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[700px] overflow-y-auto custom-scrollbar pr-6">
              {facilities.length > 0 ? facilities.reverse().map((item, i) => (
                <div key={i} className="bg-white p-10 rounded-[3.5rem] border-b-[15px] border-indigo-900 shadow-2xl space-y-6">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase bg-indigo-100 px-5 py-2 rounded-full text-indigo-900">{item.Hostel_Name}</span>
                    <span className="text-[10px] text-slate-300 font-black uppercase italic">Updated: {item.Last_Check_Date}</span>
                  </div>
                  <h3 className="text-4xl font-black text-slate-950 italic uppercase leading-none">{item.Item_Name}</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-emerald-500 p-4 rounded-3xl text-white">
                      <p className="text-[8px] font-black uppercase mb-1">Good</p>
                      <p className="text-3xl font-black">{item.Good_Condition || 0}</p>
                    </div>
                    <div className="bg-rose-500 p-4 rounded-3xl text-white">
                      <p className="text-[8px] font-black uppercase mb-1">Damaged</p>
                      <p className="text-3xl font-black">{item.Damaged || 0}</p>
                    </div>
                    <div className="bg-amber-500 p-4 rounded-3xl text-white">
                      <p className="text-[8px] font-black uppercase mb-1">Repair</p>
                      <p className="text-3xl font-black">{item.Need_Repair || 0}</p>
                    </div>
                  </div>
                </div>
              )) : <div className="col-span-2 text-center py-40 text-white/10 font-black uppercase italic tracking-[1em]">No Assets Logged.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}