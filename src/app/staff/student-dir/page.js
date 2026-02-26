"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL, GIDS } from '@/lib/api';

/**
 * Shining Stars - Student Directory & Performance Hub (v14.0 Master)
 * FEATURE: Integrated Performance Dashboard (Scores, Points, Notes, Fees) [cite: 2026-02-25]
 * FIX: Photo API + Grade Visibility + Combined Modal [cite: 2026-02-25]
 * STYLE: Slate-950 Bold Luxury [cite: 2023-02-23]
 */
export default function StudentDirectoryPerformanceHub() {
  const [students, setStudents] = useState([]);
  const [allData, setAllData] = useState({ scores: [], points: [], notes: [], fees: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState("PROFILE"); // Modal Tab State [cite: 2026-02-25]
  const router = useRouter();

  // UNIVERSAL DRIVE PHOTO FIX [cite: 2026-02-25]
  const getDrivePreview = (url) => {
    if (!url || typeof url !== 'string') return null;
    try {
      let fileId = "";
      if (url.includes('id=')) fileId = url.split('id=')[1].split('&')[0];
      else if (url.includes('/d/')) fileId = url.split('/d/')[1].split('/')[0];
      return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000` : url;
    } catch (e) { return url; }
  };

  useEffect(() => {
    const fetchIntegratedData = async () => {
      if (!WEB_APP_URL) return;
      try {
        const [sRes, scRes, pRes, nRes, fRes] = await Promise.all([
          fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getData', targetGid: GIDS.STUDENT_DIR }) }),
          fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getData', sheetName: 'Score_Records' }) }),
          fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getData', sheetName: 'House_Points' }) }),
          fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getData', sheetName: 'Student_Notes_Log' }) }),
          fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'getData', sheetName: 'Fees_Management' }) })
        ]);
        
        const [s, sc, p, n, f] = await Promise.all([sRes.json(), scRes.json(), pRes.json(), nRes.json(), fRes.json()]);
        
        if (s.success) setStudents(s.data);
        setAllData({
          scores: sc.success ? sc.data : [],
          points: p.success ? p.data : [],
          notes: n.success ? n.data : [],
          fees: f.success ? f.data : []
        });
      } finally { setLoading(false); }
    };
    fetchIntegratedData();
  }, []);

  // ANALYTICS CALCULATIONS [cite: 2026-02-25]
  const getMetrics = (id) => {
    const sid = id?.toString();
    const scores = allData.scores.filter(x => x.Student_ID == sid);
    const points = allData.points.filter(x => x.Student_ID == sid);
    const notes = allData.notes.filter(x => x.Student_ID == sid);
    const fees = allData.fees.filter(x => x.Student_ID == sid);

    return {
      studentScores: scores,
      studentPoints: points,
      studentNotes: notes,
      totalPoints: points.reduce((sum, x) => sum + (Number(x.Points) || 0), 0),
      avgScore: scores.length ? (scores.reduce((sum, x) => sum + (Number(x.Score) || 0), 0) / scores.length).toFixed(1) : "N/A",
      totalPaid: fees.reduce((sum, x) => sum + (Number(x.Amount_Paid) || 0), 0)
    };
  };

  const grades = ["ALL", ...new Set(students.map(s => s.Grade).filter(Boolean))];
  const filtered = students.filter(s => {
    const matchSearch = s['Name (ALL CAPITAL)']?.toLowerCase().includes(search.toLowerCase()) || s['Enrollment No.']?.toString().includes(search);
    const matchGrade = gradeFilter === "ALL" || s.Grade === gradeFilter;
    return matchSearch && matchGrade;
  });

  if (loading) return <div className="min-h-screen bg-[#0F071A] flex items-center justify-center font-black text-[#fbbf24] animate-pulse text-3xl uppercase italic tracking-tighter">Authorizing Performance Hub...</div>;

  return (
    <div className="min-h-screen bg-[#0F071A] p-4 md:p-14 font-black selection:bg-[#fbbf24] text-slate-950">
      <div className="max-w-[1800px] mx-auto space-y-12">
        
        {/* HEADER */}
        <div className="bg-gradient-to-br from-[#4c1d95] via-[#1e3a8a] to-[#0F071A] p-10 md:p-16 rounded-[4rem] border-b-[15px] border-[#fbbf24] shadow-3xl flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-6">
            <button onClick={() => router.push('/staff')} className="bg-[#fbbf24] p-5 rounded-[2.5rem] hover:bg-white transition-all shadow-2xl active:scale-90 border-b-6 border-amber-600">
              <span className="text-3xl">🔙</span>
            </button>
            <h1 className="text-5xl md:text-8xl italic uppercase font-black text-white tracking-tighter leading-none">Student Hub</h1>
          </div>
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <input type="text" placeholder="နာမည် သို့မဟုတ် ID ဖြင့် ရှာဖွေပါ..." className="w-full bg-[#1A0B2E] border-4 border-[#2563eb]/20 p-8 rounded-[3rem] text-[#fef3c7] font-black italic text-2xl outline-none focus:border-[#fbbf24] shadow-2xl" onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="w-full bg-[#2563eb] border-b-10 border-blue-900 p-8 rounded-[2.5rem] text-white font-black italic text-2xl outline-none shadow-2xl appearance-none cursor-pointer" onChange={(e) => setGradeFilter(e.target.value)}>
            {grades.map((g, idx) => <option key={idx} value={g} className="text-slate-950 font-black">GRADE: {g}</option>)}
          </select>
        </div>

        {/* LIST GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-40">
          {filtered.map((s, idx) => (
            <button key={idx} onClick={() => { setSelectedStudent(s); setActiveTab("PROFILE"); }} className="bg-[#fef3c7] p-8 rounded-[4rem] border-b-[18px] border-[#1e3a8a] shadow-3xl flex items-center gap-6 hover:scale-105 active:scale-95 transition-all text-left group overflow-hidden">
               <div className="w-24 h-24 bg-white rounded-[2.5rem] overflow-hidden flex items-center justify-center shadow-2xl border-4 border-white flex-shrink-0">
                  {s.Photo_URL ? <img src={getDrivePreview(s.Photo_URL)} className="w-full h-full object-cover" /> : <span className="text-4xl opacity-20">👤</span>}
               </div>
               <div className="flex-1 overflow-hidden">
                  <h3 className="text-xl uppercase font-black italic text-slate-950 truncate leading-none mb-2">{s['Name (ALL CAPITAL)']}</h3>
                  <p className="text-xs text-[#2563eb] font-black tracking-widest leading-none uppercase">ID: {s['Enrollment No.']} • GRADE: {s.Grade}</p>
               </div>
            </button>
          ))}
        </div>

        {/* MASTER MODAL [cite: 2026-02-25] */}
        {selectedStudent && (() => {
          const m = getMetrics(selectedStudent['Enrollment No.']);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-[#0F071A]/98 backdrop-blur-3xl" onClick={() => setSelectedStudent(null)}></div>
              <div className="relative bg-white w-full max-w-[1700px] h-[92vh] rounded-[5rem] border-b-[20px] border-[#fbbf24] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
                
                {/* MODAL HEADER [cite: 2026-02-25] */}
                <div className="bg-gradient-to-r from-[#4c1d95] to-[#1e3a8a] p-10 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex items-center gap-8">
                    <div className="w-32 h-32 bg-white rounded-[3rem] p-2 shadow-2xl overflow-hidden flex items-center justify-center">
                      {selectedStudent.Photo_URL ? <img src={getDrivePreview(selectedStudent.Photo_URL)} className="w-full h-full object-cover rounded-[2.5rem]" /> : <span className="text-6xl">👤</span>}
                    </div>
                    <div>
                      <h2 className="text-4xl font-black text-[#fbbf24] uppercase italic leading-none">{selectedStudent['Name (ALL CAPITAL)']}</h2>
                      <p className="text-white/60 font-black italic mt-3 tracking-[0.4em] uppercase">ID: {selectedStudent['Enrollment No.']} • GRADE: {selectedStudent.Grade}</p>
                    </div>
                  </div>
                  <div className="flex bg-black/20 p-3 rounded-[3rem] gap-2">
                    {["PROFILE", "PERFORMANCE"].map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab)} className={`px-12 py-4 rounded-full font-black italic uppercase tracking-widest text-xs transition-all ${activeTab === tab ? 'bg-[#fbbf24] text-black shadow-xl' : 'text-white/40 hover:text-white'}`}>{tab}</button>
                    ))}
                  </div>
                  <button onClick={() => setSelectedStudent(null)} className="text-5xl text-white/20 hover:text-rose-500 font-black transition-all">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                  {activeTab === "PROFILE" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <ProfileItem label="ဖခင်အမည်" value={selectedStudent["Father's Name"]} />
                      <ProfileItem label="မိခင်အမည်" value={selectedStudent["Mother's Name"]} />
                      <ProfileItem label="ဖုန်း (၁)" value={selectedStudent["Parent Phone 1"]} color="text-blue-600" />
                      <ProfileItem label="ဖုန်း (၂)" value={selectedStudent["Parent Phone 2"]} color="text-blue-600" />
                      <ProfileItem label="အဆောင်/ကျောင်း" value={selectedStudent["School/Hostel"]} />
                      <ProfileItem label="အသင်း" value={selectedStudent.House} />
                      <div className="md:col-span-2 lg:col-span-3 bg-slate-50 p-10 rounded-[3.5rem] border-2 border-slate-100 shadow-inner">
                        <p className="text-[10px] uppercase text-slate-400 font-black mb-4 italic tracking-widest leading-none">နေရပ်လိပ်စာ (RESIDENTIAL ADDRESS)</p>
                        <p className="text-2xl font-black text-slate-950 leading-relaxed italic">{selectedStudent.Address}</p>
                      </div>
                    </div>
                  ) : (
                    /* PERFORMANCE DASHBOARD TAB [cite: 2026-02-25] */
                    <div className="space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <StatCard label="Academic Avg" value={m.avgScore} unit="PERCENT" color="text-violet-600" icon="🎓" />
                        <StatCard label="House Points" value={m.totalPoints} unit="POINTS" color="text-amber-500" icon="⭐" />
                        <StatCard label="Total Finance" value={m.totalPaid.toLocaleString()} unit="MMK PAID" color="text-emerald-600" icon="💰" />
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                        <div className="bg-[#fef3c7] p-10 rounded-[4rem] border-b-[15px] border-amber-600/20 shadow-xl space-y-6">
                           <h3 className="text-2xl font-black uppercase italic text-amber-900 border-l-8 border-amber-600 pl-6">Teacher Observations</h3>
                           <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                              {m.studentNotes.length > 0 ? m.studentNotes.reverse().map((n, i) => (
                                <div key={i} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-amber-100 group transition-all hover:translate-y-[-5px]">
                                  <p className="text-xl font-black italic text-slate-950 leading-relaxed">"{n.Note_Detail}"</p>
                                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50 text-[9px] font-black uppercase text-amber-800 italic">
                                    <span>BY: {n.Recorded_By}</span>
                                    <span>{n.Date}</span>
                                  </div>
                                </div>
                              )) : <p className="text-amber-900/30 uppercase font-black italic text-center py-10">No Behavioral Archive.</p>}
                           </div>
                        </div>

                        <div className="bg-indigo-50 p-10 rounded-[4rem] border-b-[15px] border-indigo-900/20 shadow-xl space-y-6">
                           <h3 className="text-2xl font-black uppercase italic text-indigo-900 border-l-8 border-indigo-900 pl-6">Academic History</h3>
                           <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                              {m.studentScores.length > 0 ? m.studentScores.reverse().map((sc, i) => (
                                <div key={s} className="bg-white p-6 rounded-[2.5rem] flex justify-between items-center group hover:bg-indigo-900 transition-all cursor-default">
                                   <div>
                                      <p className="text-[8px] font-black uppercase text-slate-400 group-hover:text-white/50 mb-1">{sc.Subject}</p>
                                      <p className="text-xl font-black italic text-slate-900 group-hover:text-white leading-none">{sc.Term}</p>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-4xl font-black italic text-indigo-900 group-hover:text-[#fbbf24] leading-none">{sc.Score}</p>
                                      <p className="text-[8px] font-black uppercase text-slate-400 group-hover:text-white/50 mt-1">Result: {sc.Result}</p>
                                   </div>
                                </div>
                              )) : <p className="text-indigo-900/30 uppercase font-black italic text-center py-10">No Exam Records.</p>}
                           </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      </div>
      <style jsx global>{`
        body { font-weight: 900 !important; color: #020617 !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fbbf24; border-radius: 20px; }
      `}</style>
    </div>
  );
}

function ProfileItem({ label, value, color = "text-slate-950" }) {
  return (
    <div className="bg-slate-50 p-8 rounded-[3.5rem] border-2 border-slate-100 flex flex-col group hover:border-[#4c1d95] transition-all">
      <p className="text-[9px] uppercase text-slate-400 font-black italic mb-2 tracking-widest leading-none">{label}</p>
      <p className={`text-2xl font-black italic ${color} leading-none truncate`}>{value || "—"}</p>
    </div>
  );
}

function StatCard({ label, value, unit, color, icon }) {
  return (
    <div className="bg-white p-10 rounded-[4rem] border-b-[12px] border-slate-100 shadow-2xl flex justify-between items-center group hover:translate-y-[-5px] transition-all">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 leading-none">{label}</p>
        <p className={`text-6xl font-black italic tracking-tighter ${color} leading-none mt-2`}>{value}</p>
        <p className="text-[9px] font-black uppercase text-slate-300 italic tracking-widest mt-4">{unit}</p>
      </div>
      <span className="text-7xl opacity-5 group-hover:opacity-100 transition-opacity font-black">{icon}</span>
    </div>
  );
}