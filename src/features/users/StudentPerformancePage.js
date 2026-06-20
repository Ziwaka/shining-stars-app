"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';
import { getPhotoUrl } from '@/lib/cloudinary';

// ─── HELPER FUNCTIONS ───
const SUBJECT_DISTINCTION_MAP = {
  Myan: 75, Eng: 75, Bio: 75, Eco: 75,
  Maths: 80, Phys: 80, Chem: 80, Social: 80
};

const isDistinction = (subject, percentage) => {
  const threshold = SUBJECT_DISTINCTION_MAP[subject];
  return threshold ? percentage >= threshold : false;
};

const isFail = (percentage) => percentage < 40;

const getMonthKey = (examName) => {
  const name = (examName || '').toUpperCase();
  if (name.includes('MAY')) return 'MAY';
  if (name.includes('JUL') || name.includes('JULY')) return 'JUL';
  if (name.includes('OCT') || name.includes('OCTOBER')) return 'OCT';
  if (name.includes('DEC') || name.includes('DECEMBER')) return 'DEC';
  if (name.includes('FEB') || name.includes('FEBRUARY')) return 'FEB';
  return null;
};

function formatDateWithDay(dateStr) {
  if (!dateStr || dateStr === '—') return '—';
  try {
    let cleaned = dateStr.replace(/[ZT]/g, ' ').trim();
    const parts = cleaned.split(/[- :]/);
    if (parts.length >= 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[d.getDay()]}, ${String(day).padStart(2, '0')} ${months[d.getMonth()]} ${year}`;
      }
    }
    return dateStr;
  } catch (e) { return dateStr; }
}
// ─── END HELPERS ───

export default function MyPerformanceRegistry() {
  const [auth, setAuth] = useState(null);
  const [myHouse, setMyHouse] = useState("SYNCING...");
  const [myPhoto, setMyPhoto] = useState(null);
  const [myGrade, setMyGrade] = useState(null);
  const [myStream, setMyStream] = useState(null);
  // ─── NEW: Store total active from Exam_Records ───
  const [totalActiveByGradeStream, setTotalActiveByGradeStream] = useState({});
  const [data, setData] = useState({ 
    scores: [], earnedPoints: [], deductedPoints: [], 
    notes: [], fees: [], leaves: [] 
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const toEngNum = (str) => {
    if (str === null || str === undefined) return "0";
    const burmeseNumbers = {'၀':'0','၁':'1','၂':'2','၃':'3','၄':'4','၅':'5','၆':'6','၇':'7','၈':'8','၉':'9'};
    return String(str).replace(/[၀-၉]/g, m => burmeseNumbers[m]).trim();
  };

  useEffect(() => {
    let isMounted = true;
    const fetchMyHubProtocol = async () => {
      const saved = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (!saved || saved === "undefined") { router.push('/login'); return; }
      const user = JSON.parse(saved);
      if (isMounted) setAuth(user);
      const myID = (user.Student_ID || user['Enrollment No.'] || "").toString().trim();

      const fetchSheet = async (name) => {
        try {
          const res = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: {'Content-Type':'text/plain;charset=utf-8'},
            body: JSON.stringify({ action: 'getData', sheetName: name }),
          });
          const text = await res.text();
          try {
            const json = JSON.parse(text);
            if (json.success && Array.isArray(json.data)) {
               json.data = (json.data || []).map(obj => {
                  const cleanObj = {};
                  Object.keys(obj).forEach(k => { cleanObj[k.trim()] = obj[k]; });
                  return cleanObj;
               });
            }
            return json;
          } catch (e) { return { success: false, data: [] }; }
        } catch (e) { return { success: false, data: [] }; }
      };

      try {
        const [scRes, pRes, nRes, fRes, lRes, dirRes] = await Promise.all([
          fetchSheet('Exam_Records'), fetchSheet('House_Points'),
          fetchSheet('Student_Notes_Log'), fetchSheet('Fees_Management'),
          fetchSheet('Leave_Records'), fetchSheet('Student_Directory') 
        ]);

        if (!isMounted) return;

        let liveHouse = "UNASSIGNED";
        let photoUrl = null;
        let studentGrade = null;
        let studentStream = null;
        
        // ─── Calculate totals from Exam_Records (Ignore Status) ───
        const totalsFromExam = {};
        if (scRes.success && Array.isArray(scRes.data)) {
          scRes.data.forEach(sc => {
            const grade = sc.Grade ? String(sc.Grade).trim() : '';
            const subject = sc.Subject ? String(sc.Subject).trim() : '';
            // Only count Bio or Eco subjects
            if (!grade || (subject !== 'Bio' && subject !== 'Eco')) return;
            
            const key = `${grade}_${subject}`;
            if (!totalsFromExam[key]) {
              // Store unique Student_IDs for this grade+subject
              totalsFromExam[key] = new Set();
            }
            const studentId = sc.Student_ID ? String(sc.Student_ID).trim() : '';
            if (studentId) {
              totalsFromExam[key].add(studentId);
            }
          });
        }
        
        if (dirRes.success && Array.isArray(dirRes.data)) {
          // Find current student
          const studentProfile = dirRes.data.find(s => {
            const rowID = String(s.Student_ID || s['Enrollment No.'] || s['Student ID'] || "").trim();
            return rowID === myID;
          });
          if (studentProfile) {
            if (studentProfile.House) liveHouse = studentProfile.House;
            if (studentProfile.Photo_URL) photoUrl = studentProfile.Photo_URL;
            if (studentProfile.Grade) studentGrade = String(studentProfile.Grade).trim();
          }
          
          // Determine student's stream from their own scores
          if (scRes.success && Array.isArray(scRes.data)) {
            const myScores = scRes.data.filter(x => {
              const rowID = String(x.Student_ID || x.User_ID || x['Enrollment No.'] || x['Student ID'] || "").trim();
              return rowID === myID;
            });
            const hasBio = myScores.some(sc => String(sc.Subject || '').trim() === 'Bio');
            const hasEco = myScores.some(sc => String(sc.Subject || '').trim() === 'Eco');
            if (hasBio) studentStream = 'Bio';
            else if (hasEco) studentStream = 'Eco';
            else studentStream = 'General';
          }
        }
        
        setMyHouse(liveHouse);
        setMyPhoto(photoUrl);
        setMyGrade(studentGrade);
        setMyStream(studentStream);
        
        // ─── Convert Sets to counts ───
        const totalCounts = {};
        Object.keys(totalsFromExam).forEach(key => {
          totalCounts[key] = totalsFromExam[key].size;
        });
        setTotalActiveByGradeStream(totalCounts);

        const filterMyRecords = (result) => {
          if (!result.success || !Array.isArray(result.data)) return [];
          return (result.data||[]).filter(x => {
             const rowID = String(x.Student_ID || x.User_ID || x['Enrollment No.'] || x['Student ID'] || "").trim();
             return rowID === myID;
          });
        };

        const myPoints = filterMyRecords(pRes);
        let earned = []; let deducted = [];
        myPoints.forEach(pt => {
           const rawPts = pt.Points !== undefined ? pt.Points : (pt.Point !== undefined ? pt.Point : "0");
           const ptsNum = parseInt(toEngNum(rawPts), 10);
           const safePts = isNaN(ptsNum) ? 0 : ptsNum;
           const processedPt = { ...pt, Numeric_Points: safePts };
           if (safePts >= 0) earned.push(processedPt);
           else deducted.push(processedPt);
        });

        setData({
          scores: filterMyRecords(scRes).reverse(),
          earnedPoints: earned.reverse(),
          deductedPoints: deducted.reverse(),
          notes: filterMyRecords(nRes).reverse(),
          fees: filterMyRecords(fRes).reverse(),
          leaves: filterMyRecords(lRes).reverse()
        });

      } catch (err) { console.error("DEBUG PERFORMANCE ERROR:", err); }
      finally { if (isMounted) setLoading(false); }
    };
    fetchMyHubProtocol();
    return () => { isMounted = false; };
  }, [router]);

  if (loading) return (
    <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center font-black animate-pulse" style={{background:'#FDFCF0', color:'#020617'}}>
      <div className="text-7xl mb-6">🗂️</div>
      <div className="text-sm uppercase italic" style={{letterSpacing:'0.4em', color:'#020617'}}>Decrypting Personal Archives...</div>
    </div>
  );

  const totalEarned = data.earnedPoints.reduce((s, x) => s + x.Numeric_Points, 0);
  const totalDeducted = data.deductedPoints.reduce((s, x) => s + Math.abs(x.Numeric_Points), 0);
  const leavesTaken = data.leaves.filter(x => String(x.Status).toLowerCase().includes("approved")).length;
  const photoUrl = getPhotoUrl(myPhoto);
  
  // ─── Get total from Exam_Records for this Grade + Stream ───
  const gradeStreamKey = myGrade && myStream ? `${myGrade}_${myStream}` : null;
  const totalActive = gradeStreamKey ? (totalActiveByGradeStream[gradeStreamKey] || 0) : 0;

  return (
    <div className="p-4 md:p-10 font-black selection:bg-gold text-slate-950" style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",paddingBottom:"120px",minHeight:0,background:'#FDFCF0'}}>
      <div className="mx-auto space-y-12" style={{maxWidth:'1500px'}}>
        
        {/* HEADER SECTION */}
        <div className="bg-slate-950 p-10 md:p-14 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-10 relative overflow-hidden" style={{borderRadius:'4rem', borderBottomWidth:'15px', borderColor:'#fbbf24'}}>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="flex items-center gap-6 md:gap-10 z-10">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white flex items-center justify-center text-5xl md:text-7xl shadow-2xl border-4 overflow-hidden" style={{borderRadius:'2.5rem', borderColor:'#fbbf24'}}>
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt={auth?.Name || "Student"} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '🧑‍🎓';
                  }}
                />
              ) : (
                <span>🧑‍🎓</span>
              )}
            </div>
            <div className="text-center md:text-left leading-none">
              <div className="inline-block px-4 py-1.5 text-slate-950 font-black uppercase rounded-lg mb-4 shadow-md" style={{background:'#fbbf24', fontSize:'10px', letterSpacing:'0.2em'}}>My Performance Hub</div>
              <h1 className="text-3xl md:text-6xl italic uppercase font-black text-white tracking-tighter leading-tight">{auth?.Name}</h1>
              <p className="text-slate-400 text-xs md:text-sm uppercase font-black mt-3 italic" style={{letterSpacing:'0.4em'}}>House: <span className="text-white">{myHouse}</span> {myStream && <span className="text-amber-400 ml-2">• Stream: {myStream}</span>}</p>
            </div>
          </div>
          <div className="flex bg-white/10 p-5 px-8 rounded-full border-2 border-white/20 items-center gap-4 z-10 backdrop-blur-sm text-white">
             <span className="uppercase text-slate-300 font-black italic tracking-widest" style={{fontSize:'10px'}}>Registry ID:</span>
             <span className="text-xl md:text-3xl font-black italic" style={{color:'#fbbf24'}}>{auth?.Student_ID || auth?.['Enrollment No.']}</span>
          </div>
        </div>

        {/* ANALYTICS SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
           <PerfStat label="My Contribution" value={`+${totalEarned}`} icon="📈" borderColor="#10B981" textColor="#059669" />
           <PerfStat label="Points Deducted" value={`-${totalDeducted}`} icon="📉" borderColor="#E11D48" textColor="#BE123C" />
           <PerfStat label="Approved Leaves" value={leavesTaken} icon="🗓️" borderColor="#8B5CF6" textColor="#7C3AED" />
        </div>

        {/* DATA SECTIONS */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          
          {/* 1. EARNED POINTS */}
          <div className="bg-white p-10 shadow-xl space-y-8 flex flex-col h-full" style={{borderRadius:'3.5rem', borderTopWidth:'10px', borderColor:'#10B981'}}>
            <h2 className="text-2xl font-black uppercase italic text-emerald-700 border-b-4 border-emerald-100 pb-4 flex items-center gap-3">
              <span className="bg-emerald-500 text-white w-10 h-10 flex items-center justify-center rounded-xl text-xl shadow-md">+</span>
              Points I Earned
            </h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex-1">
              {data.earnedPoints.length > 0 ? data.earnedPoints.map((pt, i) => (
                <div key={i} className="bg-emerald-50 p-6 border-2 border-emerald-200 flex justify-between items-center transition-all hover:-translate-y-1" style={{borderRadius:'2rem'}}>
                  <div>
                    <p className="text-lg font-black uppercase text-slate-950 italic">★ {pt.Event_Name}</p>
                    <p className="text-emerald-600 font-bold uppercase tracking-widest mt-2" style={{fontSize:'10px'}}>{pt.Date} • By {pt.Recorded_By}</p>
                  </div>
                  <div className="text-4xl font-black text-emerald-600">+{pt.Numeric_Points}</div>
                </div>
              )) : <div className="text-center py-20 opacity-30 italic uppercase">No Contribution Yet</div>}
            </div>
          </div>

          {/* 2. DEDUCTED POINTS */}
          <div className="bg-white p-10 shadow-xl space-y-8 flex flex-col h-full" style={{borderRadius:'3.5rem', borderTopWidth:'10px', borderColor:'#E11D48'}}>
            <h2 className="text-2xl font-black uppercase italic text-rose-700 border-b-4 border-rose-100 pb-4 flex items-center gap-3">
              <span className="bg-rose-600 text-white w-10 h-10 flex items-center justify-center rounded-xl text-2xl shadow-md">-</span>
              Points I Lost
            </h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex-1">
              {data.deductedPoints.length > 0 ? data.deductedPoints.map((pt, i) => (
                <div key={i} className="bg-rose-50 p-6 border-2 border-rose-200 flex justify-between items-center transition-all hover:-translate-y-1" style={{borderRadius:'2rem'}}>
                  <div>
                    <p className="text-lg font-black uppercase text-slate-950 italic">⚠ {pt.Event_Name}</p>
                    {pt.Remark && <p className="text-xs text-rose-700 bg-white px-3 py-1 rounded-lg mt-2 inline-block border border-rose-200 shadow-sm">"{pt.Remark}"</p>}
                    <p className="text-rose-500 font-bold uppercase tracking-widest mt-2" style={{fontSize:'10px'}}>{pt.Date} • By {pt.Recorded_By}</p>
                  </div>
                  <div className="text-4xl font-black text-rose-600">{pt.Numeric_Points}</div>
                </div>
              )) : <div className="text-center py-20 opacity-30 italic uppercase">Clean Record</div>}
            </div>
          </div>

          {/* 3. EXAM REGISTRY */}
          <div className="bg-slate-950 p-10 shadow-xl space-y-8 text-white flex flex-col h-full" style={{borderRadius:'3.5rem', borderTopWidth:'10px', borderColor:'#8B5CF6'}}>
            <h2 className="text-2xl font-black uppercase italic border-b-4 border-white/10 pb-4 flex items-center gap-3" style={{color:'#A78BFA'}}>
              <span className="text-white w-10 h-10 flex items-center justify-center rounded-xl text-xl shadow-md" style={{background:'#8B5CF6'}}>📊</span>
              Exam Registry
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              {(() => {
                const subjects = ['Myan', 'Eng', 'Maths', 'Chem', 'Phys', 'Bio/Eco', 'SS'];
                const monthOrder = ['MAY', 'JUL', 'OCT', 'DEC', 'FEB'];
                
                const subjectScores = {};
                const monthRank = {};
                subjects.forEach(sub => {
                  subjectScores[sub] = {};
                  monthOrder.forEach(m => {
                    subjectScores[sub][m] = null;
                  });
                });
                monthOrder.forEach(m => {
                  monthRank[m] = null;
                });

                data.scores.forEach(sc => {
                  const subject = (sc.Subject || '').trim();
                  const examName = sc.Exam_Name || sc.Term || '';
                  const monthKey = getMonthKey(examName);
                  if (!monthKey) return;
                  
                  const rank = sc.Rank !== undefined ? sc.Rank : sc['Rank'];
                  if (rank !== undefined && rank !== null && rank !== '') {
                    monthRank[monthKey] = rank;
                  }
                  
                  let matchedSubject = null;
                  if (subject === 'Bio' || subject === 'Eco') {
                    matchedSubject = 'Bio/Eco';
                  } else if (subject === 'Social') {
                    matchedSubject = 'SS';
                  } else {
                    matchedSubject = subjects.find(s => s === subject);
                  }
                  
                  if (matchedSubject && subjectScores[matchedSubject]) {
                    const score = Number(sc.Score);
                    if (!isNaN(score)) {
                      subjectScores[matchedSubject][monthKey] = score;
                    }
                  }
                });

                const hasAnyScore = monthOrder.some(m => 
                  subjects.some(sub => subjectScores[sub][m] !== null)
                );

                if (!hasAnyScore) {
                  return <div className="text-center py-20 opacity-30 italic uppercase text-white">No Academic Records</div>;
                }

                return (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <th className="p-3 border-b border-white/10 sticky left-0 bg-slate-950 z-10">SUBJECT</th>
                        {monthOrder.map(m => (
                          <th key={m} className="p-3 border-b border-white/10 text-center">{m}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map(sub => {
                        const scores = subjectScores[sub];
                        return (
                          <tr key={sub} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-3 font-bold text-sm md:text-base text-white sticky left-0 bg-slate-950 z-10">{sub}</td>
                            {monthOrder.map(m => {
                              const score = scores[m];
                              let display = '—';
                              let isDist = false;
                              let isFailScore = false;
                              if (score !== null && score !== undefined) {
                                display = String(score);
                                const threshold = SUBJECT_DISTINCTION_MAP[sub === 'Bio/Eco' ? 'Bio' : sub === 'SS' ? 'Social' : sub];
                                isDist = threshold ? score >= threshold : false;
                                isFailScore = score < 40;
                              }
                              return (
                                <td key={m} className="p-3 text-center text-sm md:text-base font-black">
                                  {score !== null ? (
                                    <span className={`${isFailScore ? 'text-rose-400' : isDist ? 'text-amber-400' : 'text-slate-200'}`}>
                                      {display}
                                      {isDist && <span className="text-amber-400 text-xs ml-1">⭐</span>}
                                    </span>
                                  ) : (
                                    <span className="text-slate-600">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}

                      {/* ─── RANK ROW - Uses total from Exam_Records ─── */}
                      <tr className="border-t-2 border-amber-500/30 bg-amber-500/5">
                        <td className="p-3 font-black text-sm md:text-base text-amber-400 sticky left-0 bg-slate-950 z-10">🏆 Rank</td>
                        {monthOrder.map(m => {
                          const hasScore = subjects.some(sub => subjectScores[sub][m] !== null);
                          if (!hasScore) {
                            return <td key={m} className="p-3 text-center text-slate-600">—</td>;
                          }
                          const rank = monthRank[m];
                          if (rank && String(rank).includes('/')) {
                            return <td key={m} className="p-3 text-center text-sm md:text-base font-black text-amber-400">{rank}</td>;
                          }
                          const displayRank = (rank && rank !== '—') ? `${rank} / ${totalActive}` : '—';
                          return (
                            <td key={m} className="p-3 text-center text-sm md:text-base font-black text-amber-400">
                              {displayRank}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                );
              })()}
            </div>
            <div className="text-right text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">
              ⚡ SHOWING ONLY MAIN EXAMS (MAY, JUL, OCT, DEC, FEB)
            </div>
          </div>

          {/* 4. OBSERVATION LOG */}
          <div className="p-10 shadow-xl space-y-8 flex flex-col h-full" style={{background:'#FEF9C3', borderRadius:'3.5rem', borderTopWidth:'10px', borderColor:'#F59E0B'}}>
            <h2 className="text-2xl font-black uppercase italic text-amber-800 border-b-4 border-amber-200 pb-4 flex items-center gap-3">
              <span className="bg-amber-500 text-white w-10 h-10 flex items-center justify-center rounded-xl text-xl shadow-md">📓</span>
              Observation Log
            </h2>
            <div className="space-y-4 pr-2 custom-scrollbar flex-1">
              {data.notes.length > 0 ? data.notes.map((n, i) => (
                <div key={i} className="bg-white p-6 shadow-sm border border-amber-100 transition-all hover:-translate-y-1" style={{borderRadius:'2rem'}}>
                  <p className="text-lg font-black italic text-slate-950 leading-relaxed mb-4">"{n.Note_Detail}"</p>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <span className="font-black uppercase bg-amber-100 text-amber-700 px-3 py-1 rounded-lg tracking-widest" style={{fontSize:'10px'}}>{n.Category}</span>
                    <div className="text-right leading-none">
                       <p className="text-slate-400 font-black uppercase mb-1 tracking-widest italic" style={{fontSize:'8px'}}>By: {n.Recorded_By || 'Academic Office'}</p>
                       <span className="text-slate-400 font-black uppercase" style={{fontSize:'10px'}}>{n.Date}</span>
                    </div>
                  </div>
                </div>
              )) : <div className="text-center py-20 opacity-30 italic uppercase">No Observations Archived</div>}
            </div>
          </div>

          {/* 5. LEAVE HISTORY */}
          <div className="bg-white p-10 shadow-xl space-y-8 flex flex-col h-full" style={{borderRadius:'3.5rem', borderTopWidth:'10px', borderColor:'#3B82F6'}}>
            <h2 className="text-2xl font-black uppercase italic text-blue-700 border-b-4 border-blue-100 pb-4 flex items-center gap-3">
              <span className="bg-blue-500 text-white w-10 h-10 flex items-center justify-center rounded-xl text-xl shadow-md">✈️</span>
              Leave History
            </h2>
            <div className="space-y-4 pr-2 custom-scrollbar flex-1">
              {data.leaves.length > 0 ? data.leaves.map((l, i) => (
                <div key={i} className="bg-slate-50 p-6 border border-slate-200 transition-all hover:-translate-y-1" style={{borderRadius:'2rem'}}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-black uppercase bg-slate-200 text-slate-700 px-3 py-1 rounded-lg tracking-widest" style={{fontSize:'10px'}}>{l.Leave_Type}</span>
                      <p className="text-sm font-black uppercase text-slate-950 mt-2">
                        {formatDateWithDay(l.Start_Date)} → {formatDateWithDay(l.End_Date)}
                      </p>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg tracking-widest ${String(l.Status).toLowerCase() === 'approved' ? 'bg-emerald-100 text-emerald-700' : String(l.Status).toLowerCase() === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {l.Status}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-bold italic text-slate-600 bg-white p-3 rounded-xl border border-slate-100">"{l.Reason}"</p>
                </div>
              )) : <div className="text-center py-20 opacity-30 italic uppercase">No Leaves Recorded</div>}
            </div>
          </div>

          {/* 6. FEES MANAGEMENT */}
          <div className="bg-white p-10 shadow-xl space-y-8 flex flex-col h-full" style={{borderRadius:'3.5rem', borderTopWidth:'10px', borderColor:'#0F766E'}}>
            <h2 className="text-2xl font-black uppercase italic text-teal-700 border-b-4 border-teal-100 pb-4 flex items-center gap-3">
              <span className="bg-teal-600 text-white w-10 h-10 flex items-center justify-center rounded-xl text-xl shadow-md">💰</span>
              Financial Registry
            </h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex-1">
              {data.fees.length > 0 ? data.fees.map((f, i) => (
                <div key={i} className="bg-teal-50/50 p-6 border border-teal-100 flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all hover:-translate-y-1 hover:bg-teal-50" style={{borderRadius:'2rem'}}>
                  <div className="flex-1">
                    <span className="font-black uppercase bg-white text-teal-700 px-3 py-1 rounded-lg tracking-widest border border-teal-200" style={{fontSize:'10px'}}>{f.Fee_Type || "Tuition"}</span>
                    <p className="text-slate-500 font-bold uppercase tracking-widest mt-3" style={{fontSize:'10px'}}>Date: {formatDateWithDay(f.Date || f.Payment_Date)}</p>
                    {f.Remark && <p className="text-xs italic text-teal-800 mt-1">Note: {f.Remark}</p>}
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-2xl md:text-3xl font-black italic text-teal-700">{Number(f.Amount_Paid || 0).toLocaleString()} <span className="text-sm">MMK</span></p>
                    <p className="font-black uppercase tracking-widest mt-1 text-slate-400" style={{fontSize:'10px'}}>Next Due: {f.Next_Due_Date || "-"}</p>
                  </div>
                </div>
              )) : <div className="text-center py-20 opacity-30 italic uppercase">No Payments Found</div>}
            </div>
          </div>

        </div>
        
        <div className="text-center py-20 opacity-20 italic font-black text-slate-900">
           <div className="text-5xl mb-4">🌟</div>
           <p className="text-3xl md:text-5xl uppercase tracking-widest font-black leading-none">SHINING STARS</p>
           <p className="uppercase mt-4 font-black" style={{fontSize:'10px', letterSpacing:'1em'}}>VERSION 5.3 • PERSONAL ARCHIVE SYNCED</p>
        </div>

      </div>
      <style jsx global>{`
        body { background-color: #FDFCF0; font-weight: 900 !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}

function PerfStat({ label, value, icon, borderColor, textColor }) {
  const router = useRouter();
  return (
    <div className="bg-white p-8 shadow-xl flex justify-between items-center group transition-transform hover:-translate-y-2" style={{borderRadius:'3rem', borderBottomWidth:'10px', borderColor: borderColor }}>
      <div className="leading-none flex-1">
        <p className="md:text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 italic" style={{fontSize:'9px'}}>{label}</p>
        <p className="text-3xl md:text-4xl lg:text-5xl font-black italic tracking-tighter" style={{ color: textColor }}>{value}</p>
      </div>
      <span className="text-5xl md:text-6xl drop-shadow-sm transition-transform group-hover:scale-110">{icon}</span>
    
      {/* 🏠 Home Button */}
      <button onClick={() => router.push('/student')}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-2.5 border-2 rounded-full font-black uppercase tracking-wider shadow-xl hover:bg-gold hover:text-[#020617] transition-all" style={{background:'#020617', borderColor:'#fbbf24', color:'#fbbf24', fontSize:'10px'}}>
        🏠 Home
      </button>
    </div>
  );
}