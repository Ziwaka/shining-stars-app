"use client";
import { getPhotoUrl } from "@/lib/cloudinary";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

// ── MMT Date Converter ──
function toMMTDateStr(val) {
  if (!val && val !== 0) return '—';
  if (val instanceof Date) {
    const mmt = new Date(val.getTime() + 6.5 * 60 * 60 * 1000);
    return `${mmt.getUTCFullYear()}-${String(mmt.getUTCMonth() + 1).padStart(2, '0')}-${String(mmt.getUTCDate()).padStart(2, '0')}`;
  }
  const str = String(val).trim();
  if (!str) return '—';
  const isoRegex = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/;
  const match = str.match(isoRegex);
  if (match) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const mmt = new Date(d.getTime() + 6.5 * 60 * 60 * 1000);
      return `${mmt.getUTCFullYear()}-${String(mmt.getUTCMonth() + 1).padStart(2, '0')}-${String(mmt.getUTCDate()).padStart(2, '0')}`;
    }
  }
  return str;
}

// ── Distinction & Fail helpers ──
const SUBJECT_DISTINCTION_MAP = {
  Myan: 75, Eng: 75, Bio: 75, Eco: 75,
  Maths: 80, Phys: 80, Chem: 80, Social: 80
};

const isDistinction = (subject, percentage) => {
  const threshold = SUBJECT_DISTINCTION_MAP[subject];
  return threshold ? percentage >= threshold : false;
};

const isFail = (percentage) => percentage < 40;

// ── Map exam name to month key ──
function getMonthFromExam(examName) {
  const map = {
    'May Chapter End Test': 'MAY',
    'July Chapter End Test': 'JUL',
    'October Midterm Test': 'OCT',
    'December Chapter End Test': 'DEC',
    'February Year End Test': 'FEB'
  };
  return map[examName] || null;
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id ? decodeURIComponent(params.id) : "";

  const [student, setStudent] = useState(null);
  const [allData, setAllData] = useState({ scores: [], points: [], notes: [], fees: [], leaves: [], vehicles: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("PROFILE");

  // ── Rank related states ──
  const [selectedRankExam, setSelectedRankExam] = useState("May Chapter End Test");
  const [classRankList, setClassRankList] = useState([]);
  const [studentRank, setStudentRank] = useState(null);
  const [rankLoading, setRankLoading] = useState(false);
  const [rankError, setRankError] = useState(null);
  const [academicYear, setAcademicYear] = useState('2026-2027');

  // ── Annual summary states ──
  const [distinctionCount, setDistinctionCount] = useState(0);
  const [failCount, setFailCount] = useState(0);

  const getHouseTheme = (houseName) => {
    const h = (houseName || "").toLowerCase();
    if (h.includes('red') || h.includes('ruby') || h.includes('ဇွဲ'))
      return { bg: 'from-rose-600 to-rose-900', text: 'text-rose-600', badge: 'bg-rose-500 text-white' };
    if (h.includes('blue') || h.includes('sapphire') || h.includes('သတ္တိ'))
      return { bg: 'from-blue-600 to-blue-900', text: 'text-blue-600', badge: 'bg-blue-500 text-white' };
    if (h.includes('green') || h.includes('emerald') || h.includes('အောင်'))
      return { bg: 'from-emerald-500 to-emerald-800', text: 'text-emerald-600', badge: 'bg-emerald-500 text-white' };
    if (h.includes('yellow') || h.includes('gold') || h.includes('topaz') || h.includes('မာန်'))
      return { bg: 'from-amber-400 to-amber-600', text: 'text-amber-600', badge: 'bg-amber-400 text-slate-900' };
    return { bg: 'from-[#4c1d95] to-[#1e1b4b]', text: 'text-[#FFD700]', badge: 'bg-[#FFD700] text-slate-900' };
  };

  // ── Authentication & Data Fetching ──
  useEffect(() => {
    const saved = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    const _u = JSON.parse(saved || 'null');
    if (!_u || (_u.userRole !== 'staff' && _u.userRole !== 'management')) { router.push('/login'); return; }

    const fetchStudentData = async () => {
      try {
        const headers = { 'Content-Type': 'text/plain;charset=utf-8' };
        const [sRes, scRes, pRes, nRes, fRes, lRes, vRes] = await Promise.all([
          fetch(WEB_APP_URL, { method: 'POST', headers, body: JSON.stringify({ action: 'getData', sheetName: 'Student_Directory' }) }),
          fetch(WEB_APP_URL, { method: 'POST', headers, body: JSON.stringify({ action: 'getData', sheetName: 'Exam_Records' }) }),
          fetch(WEB_APP_URL, { method: 'POST', headers, body: JSON.stringify({ action: 'getData', sheetName: 'House_Points' }) }),
          fetch(WEB_APP_URL, { method: 'POST', headers, body: JSON.stringify({ action: 'getData', sheetName: 'Student_Notes_Log' }) }),
          fetch(WEB_APP_URL, { method: 'POST', headers, body: JSON.stringify({ action: 'getData', sheetName: 'Fees_Management' }) }),
          fetch(WEB_APP_URL, { method: 'POST', headers, body: JSON.stringify({ action: 'getData', sheetName: 'Leave_Records' }) }),
          fetch(WEB_APP_URL, { method: 'POST', headers, body: JSON.stringify({ action: 'getVehicles' }) })
        ]);

        const [s, sc, p, n, f, l, v] = await Promise.all([sRes.json(), scRes.json(), pRes.json(), nRes.json(), fRes.json(), lRes.json(), vRes.json()]);

        if (s.success) {
          const foundStudent = s.data.find(x => (x['Enrollment No.'] || x['Registration No.'] || x['No.'] || '').toString().trim() === studentId.trim());
          setStudent(foundStudent);
          
          // Try to get academic year from config
          try {
            const cfgRes = await fetch(WEB_APP_URL, { method: 'POST', headers, body: JSON.stringify({ action: 'getExamConfig' }) });
            const cfg = await cfgRes.json();
            if (cfg.success && cfg.config?.academicYear) {
              setAcademicYear(cfg.config.academicYear);
            }
          } catch(e) {}
        }

        const studentScores = sc.success ? sc.data.filter(x => (x.Student_ID || '').toString() === studentId) : [];
        setAllData({
          scores: studentScores,
          points: p.success ? p.data.filter(x => (x.Student_ID || '').toString() === studentId) : [],
          notes: n.success ? n.data.filter(x => (x.Student_ID || '').toString() === studentId) : [],
          fees: f.success ? f.data.filter(x => (x.Student_ID || '').toString() === studentId) : [],
          leaves: l.success ? l.data.filter(x => (x.User_ID || '').toString() === studentId && x.Status === 'Approved') : [],
          vehicles: v.success ? v.data.filter(x => (x.User_ID || '').toString() === studentId) : []
        });
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    if (studentId) fetchStudentData();
  }, [studentId]);

  // ── Compute Annual Distinction & Fail Counts ──
  useEffect(() => {
    if (!allData.scores.length) {
      setDistinctionCount(0);
      setFailCount(0);
      return;
    }

    const subjectBest = {};

    allData.scores.forEach(sc => {
      const subject = (sc.Subject || '').trim();
      if (!subject) return;

      const score = Number(sc.Score);
      const maxScore = Number(sc.Max_Score || sc['Max Score'] || 100);
      const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

      if (!subjectBest[subject]) {
        subjectBest[subject] = { maxPct: pct, everFail: false };
      }
      if (pct > subjectBest[subject].maxPct) subjectBest[subject].maxPct = pct;
      if (pct < 40) subjectBest[subject].everFail = true;
    });

    const distinctionSubjects = Object.entries(subjectBest).filter(([sub, data]) =>
      isDistinction(sub, data.maxPct)
    ).length;
    const failSubjects = Object.entries(subjectBest).filter(([_, data]) => data.everFail).length;

    setDistinctionCount(distinctionSubjects);
    setFailCount(failSubjects);
  }, [allData.scores]);

  // ── Fetch Class Ranking (FIXED: no Section filter, grade normalization) ──
  useEffect(() => {
    if (!student || !selectedRankExam) return;
    
    // --- Normalize grade (KG to 12) ---
    const gradeRaw = student.Grade || '';
    let grade = gradeRaw.toString().trim();
    grade = grade.replace(/^Grade\s*/i, '').trim();
    if (grade.toUpperCase() === 'KG') {
      grade = 'KG';
    }

    const studentEnrollNo = (student['Enrollment No.'] || '').toString().trim();
    const studentIdFromStudent = (student.Student_ID || '').toString().trim();

    const fetchRank = async () => {
      setRankLoading(true);
      setRankError(null);
      try {
        // ── Payload: do NOT include Section (to avoid filtering out records with no section) ──
        const payload = {
          action: 'getExamResults',
          Academic_Year: academicYear,
          Exam_Name: selectedRankExam,
          Grade: grade,
        };

        console.log('🚀 Fetching rank with payload:', payload);

        const res = await fetch(WEB_APP_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log('📊 Rank API Response:', data);
        
        if (data.success) {
          const fullList = data.rankList || [];
          setClassRankList(fullList);
          
          if (fullList.length === 0) {
            setStudentRank(null);
            setRankError('No rank data for this exam.');
            return;
          }
          
          console.log('🔍 Full rank list (first 5):', fullList.slice(0, 5).map(s => ({ id: s.Student_ID, name: s.Name })));

          // ── Find student ──
          let foundStudent = null;
          let foundIndex = -1;
          
          // 1. By Enrollment No.
          fullList.forEach((stu, idx) => {
            const stuId = (stu.Student_ID || '').toString().trim();
            if (stuId === studentEnrollNo || stuId === studentIdFromStudent || stuId === studentId) {
              foundStudent = stu;
              foundIndex = idx;
            }
          });
          
          // 2. By Name (fallback)
          if (!foundStudent) {
            const studentName = (student['Name (ALL CAPITAL)'] || student.Name || '').toString().trim();
            fullList.forEach((stu, idx) => {
              const stuName = (stu.Name || '').toString().trim();
              if (stuName === studentName) {
                foundStudent = stu;
                foundIndex = idx;
              }
            });
          }
          
          // 3. Partial ID match
          if (!foundStudent) {
            fullList.forEach((stu, idx) => {
              const stuId = (stu.Student_ID || '').toString().trim();
              if (stuId.includes(studentEnrollNo) || studentEnrollNo.includes(stuId)) {
                foundStudent = stu;
                foundIndex = idx;
              }
            });
          }
          
          console.log('🎯 Found student in rank list:', foundStudent ? `YES (rank ${foundIndex+1})` : 'NO', foundStudent);
          
          if (foundStudent) {
            const subjects = foundStudent.subjects || {};
            let stream = '';
            if (subjects.Bio) stream = 'Bio';
            else if (subjects.Eco) stream = 'Eco';
            else if (subjects.Social) stream = 'Social';
            
            setStudentRank({
              rank: foundIndex + 1,
              total: fullList.length,
              stream: stream || 'General'
            });
          } else {
            setStudentRank(null);
            setRankError(`Student not found in ranking list for ${selectedRankExam}.`);
          }
        } else {
          setRankError(data.message || 'Failed to load ranking.');
        }
      } catch (err) {
        console.error('Rank fetch failed', err);
        setRankError('Network error while fetching rank.');
        setStudentRank(null);
      }
      setRankLoading(false);
    };

    fetchRank();
  }, [student, selectedRankExam, academicYear, studentId]);

  const totalPoints = allData.points.reduce((sum, x) => sum + (Number(x.Points) || 0), 0);
  const totalPaid = allData.fees.reduce((sum, x) => sum + (Number(x.Amount_Paid) || 0), 0);
  const lastFee = allData.fees.length > 0 ? allData.fees[allData.fees.length - 1] : null;

  const houseTheme = getHouseTheme(student?.House);
  const previewImg = getPhotoUrl(student?.Photo_URL);
  const vehicle = allData.vehicles.length > 0 ? allData.vehicles[0] : null;

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-[#4c1d95] animate-pulse text-2xl uppercase italic px-6">Loading Profile...</div>;
  if (!student) return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-black text-rose-600 text-2xl uppercase italic gap-4">Student Not Found <button onClick={() => router.push('/staff/student-dir')} className="text-sm bg-slate-900 text-white px-6 py-2 rounded-full">Go Back</button></div>;

  return (
    <div className="min-h-screen bg-slate-100 p-2 sm:p-4 md:p-10 font-black text-slate-950 font-serif-numbers">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* TOP NAVBAR */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-2 md:px-4 pt-2 pb-4 border-b-2 border-slate-200 gap-4">
          <div className="flex items-center gap-2"><span className="text-lg md:text-xl font-black text-[#4c1d95] uppercase italic tracking-tighter">Shining Stars</span><span className="text-[#FFD700] text-xl">★</span></div>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            <button onClick={() => router.push('/staff')} className="bg-slate-200 text-slate-700 text-[9px] md:text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-full hover:bg-slate-300 transition-all flex items-center gap-1"><span>⌂</span> HUB</button>
            <button onClick={() => router.push('/staff/student-dir')} className="bg-[#4c1d95] text-white text-[9px] md:text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-full hover:bg-black shadow-md"><span>◂</span> DIRECTORY</button>
            <button onClick={() => router.push('/')} className="bg-rose-500 text-white text-[9px] md:text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-full shadow-md">EXIT <span>⏏</span></button>
          </div>
        </div>

        {/* HEADER */}
        <div className={`relative bg-gradient-to-br ${houseTheme.bg} p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center md:items-start gap-6 overflow-hidden`}>
          <button onClick={() => router.push('/staff/student-dir')} className="absolute top-4 left-4 md:top-8 md:left-8 text-white bg-white/10 hover:bg-white hover:text-black w-10 h-10 rounded-full flex items-center justify-center transition-all z-20 backdrop-blur-md">←</button>
          <div className="z-10 mt-10 md:mt-0 flex-shrink-0 relative">
            <div className={`w-32 h-32 md:w-40 md:h-40 bg-white rounded-[1.5rem] md:rounded-[2rem] p-1.5 shadow-2xl overflow-hidden border-4 border-white/20 relative`}>
              {previewImg && <img src={previewImg} referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-[1.2rem] md:rounded-[1.7rem] relative z-10" onError={(e) => { e.target.style.display = 'none'; }} />}
              <span className="absolute inset-0 flex items-center justify-center text-5xl md:text-6xl text-slate-300 z-0 bg-slate-100">👤</span>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-start text-center md:text-left z-10 w-full min-w-0 md:mt-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase italic leading-tight drop-shadow-md break-words">{student['Name (ALL CAPITAL)'] || "UNKNOWN"}</h2>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white/90 mt-1">{student['အမည်']}</h3>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4">
              <span className="text-white/90 font-bold uppercase text-[9px] md:text-[10px] bg-black/30 px-3 py-1.5 rounded-full border border-white/10">ID: {student['Enrollment No.']}</span>
              <span className="text-white/90 font-bold uppercase text-[9px] md:text-[10px] bg-black/30 px-3 py-1.5 rounded-full border border-white/10">GRADE: {student.Grade} {student.Class ? `• ${student.Class}` : ''}</span>
              {student.House && <span className={`px-3 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg ${houseTheme.badge}`}>{student.House}</span>}
            </div>
          </div>
          <div className={`absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 blur-3xl rounded-full`}></div>
        </div>

        {/* TABS */}
        <div className="flex bg-white p-2 rounded-full shadow-sm border border-slate-200 gap-1 w-full max-w-md mx-auto relative -mt-4 z-20">
          {["PROFILE", "PERFORMANCE"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 md:py-4 rounded-full font-black italic uppercase tracking-widest text-[10px] md:text-xs transition-all ${activeTab === tab ? 'bg-[#FFD700] text-slate-950 shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>{tab}</button>
          ))}
        </div>

        <div className="pt-2 pb-20">
          {activeTab === "PROFILE" ? (
            <div className="space-y-6 md:space-y-8">
              {/* Parent Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm space-y-4">
                  <h4 className="text-[10px] uppercase text-slate-400 font-bold tracking-widest border-b pb-2">ဖခင် အချက်အလက်</h4>
                  <div className="space-y-3">
                    <p className="text-lg md:text-xl font-black text-slate-900">{student["Father's Name"] || "—"}</p>
                    <PhoneLink label="ဖုန်းနံပါတ်" phoneStr={student["Father's Phone"]} />
                    <div className="flex flex-col flex-1"><span className="text-[8px] uppercase text-slate-400 font-bold">အလုပ်အကိုင်</span><span className="text-sm md:text-base font-bold text-slate-700">{student["Father's Occupation"] || "—"}</span></div>
                  </div>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm space-y-4">
                  <h4 className="text-[10px] uppercase text-slate-400 font-bold tracking-widest border-b pb-2">မိခင် အချက်အလက်</h4>
                  <div className="space-y-3">
                    <p className="text-lg md:text-xl font-black text-slate-900">{student["Mother's Name"] || "—"}</p>
                    <PhoneLink label="ဖုန်းနံပါတ်" phoneStr={student["Mother's Phone"]} />
                    <div className="flex flex-col flex-1"><span className="text-[8px] uppercase text-slate-400 font-bold">အလုပ်အကိုင်</span><span className="text-sm md:text-base font-bold text-slate-700">{student["Mother's Occupation"] || "—"}</span></div>
                  </div>
                </div>
              </div>

              {/* Residential & Guardian */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-slate-100 flex flex-col justify-center"><h4 className="text-[10px] uppercase text-slate-400 font-bold tracking-widest border-b border-slate-100 pb-2 mb-3">အုပ်ထိန်းသူ</h4><p className="text-lg md:text-xl font-black text-slate-900 mb-3">{student["Guardian's Name"] || "—"}</p><PhoneLink label="အုပ်ထိန်းသူဖုန်း" phoneStr={student["Guardian's Phone"]} /></div>
                <div className="lg:col-span-2 bg-slate-50 p-6 md:p-8 rounded-[2rem] border-2 border-slate-200 flex flex-col justify-center"><p className="text-[10px] uppercase text-slate-400 font-bold mb-3 italic">နေရပ်လိပ်စာ</p><p className="text-lg md:text-2xl font-black text-slate-900 italic break-words leading-relaxed">{[student["Address & Street"], student["Ward/Quarter"], student["Town"]].filter(Boolean).join(", ") || "—"}</p></div>
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-slate-100 flex flex-col items-center"><h4 className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-3 w-full border-b">ကိုယ်ပိုင်ဆက်သွယ်ရန်</h4><PhoneLink label="ကျောင်းသားဖုန်း" phoneStr={student["Student's Phone"]} align="center" /></div>
                <div className="bg-indigo-50/50 p-6 md:p-8 rounded-[2rem] border-2 border-indigo-100 text-center"><p className="text-[10px] uppercase text-indigo-400 font-bold mb-1 italic">နေထိုင်မှု</p><p className="text-xl md:text-2xl font-black text-indigo-900 uppercase">{student["School/Hostel"] || "—"}</p></div>
                <div className="bg-sky-50/50 p-6 md:p-8 rounded-[2rem] border-2 border-sky-100 text-center"><p className="text-[10px] uppercase text-sky-400 font-bold mb-1 italic">ယခင်ကျောင်း</p><p className="text-base md:text-lg font-black text-sky-900 uppercase">{student["Transferred from"] || "—"}</p></div>
              </div>

              {/* DETAILED FEATURES SECTIONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-4">
                {/* Leave History Section */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-orange-100 shadow-sm space-y-4">
                  <h4 className="text-[10px] uppercase text-orange-400 font-black tracking-widest border-b border-orange-100 pb-2 flex justify-between">
                    <span>Leave History (ခွင့်မှတ်တမ်း)</span>
                    <span className="text-[8px] bg-orange-100 px-2 py-0.5 rounded text-orange-600">APPROVED</span>
                  </h4>
                  <div className="space-y-3">
                    {allData.leaves.length > 0 ? [...allData.leaves].reverse().map((lv, i) => (
                      <div key={i} className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black">
                          <span className="text-slate-500 italic">📅 {toMMTDateStr(lv.Start_Date)} {lv.End_Date && `→ ${toMMTDateStr(lv.End_Date)}`}</span>
                          <span className="text-orange-600 bg-white px-2 py-0.5 rounded shadow-sm">{lv.Total_Days || 1} Days</span>
                        </div>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{lv.Leave_Type}</p>
                        <p className="text-xs font-bold text-slate-600 italic border-t border-orange-100 pt-2 line-clamp-2">" {lv.Reason || "No reason provided" } "</p>
                      </div>
                    )) : <p className="text-slate-400 text-sm font-bold italic text-center py-6">No approved leaves on record.</p>}
                  </div>
                </div>

                {/* Vehicle Info Section */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-blue-100 shadow-sm space-y-4">
                  <h4 className="text-[10px] uppercase text-blue-400 font-bold tracking-widest border-b border-blue-100 pb-2">Vehicle Log (ယာဉ်အချက်အလက်)</h4>
                  <div className="flex items-center gap-5 py-4">
                    <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner border border-blue-200">🚌</div>
                    <div className="min-w-0">
                      <p className="text-lg md:text-xl font-black text-slate-800 tracking-tighter uppercase">{vehicle ? vehicle.Plate_No : "None Assigned"}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-[9px] font-bold text-blue-400 uppercase bg-blue-50 px-2 py-0.5 rounded">{vehicle?.Vehicle_Type || "—"}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded">{vehicle?.Color || "—"}</span>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 mt-2 italic">Pickup: {student.Pickup_Point || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Registry Note History */}
                <div className="md:col-span-2 bg-slate-900 p-8 md:p-10 rounded-[2.5rem] border-b-[10px] border-amber-500 shadow-2xl overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-8 text-amber-500/10 text-8xl select-none">📋</div>
                  <h4 className="text-[10px] uppercase text-amber-500 font-black tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"/>Official Registry Notes History
                  </h4>
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-3 custom-scrollbar relative z-10">
                    {allData.notes.length > 0 ? [...allData.notes].reverse().map((n, i) => (
                      <div key={i} className="bg-white/5 p-5 rounded-[1.5rem] border border-white/10 hover:border-amber-500/30 transition-all">
                        <p className="text-white text-sm md:text-base italic font-medium leading-relaxed opacity-90">"{n.Note || n.Note_Detail}"</p>
                        <div className="flex justify-between mt-4 pt-3 border-t border-white/5 text-[9px] font-black uppercase text-amber-500/50 tracking-widest">
                          <span className="flex items-center gap-1">🏷️ {n.Category || "General"}</span>
                          <span className="flex items-center gap-1">📅 {toMMTDateStr(n.Date)}</span>
                          <span className="flex items-center gap-1">👤 {n.Recorded_By || "Office"}</span>
                        </div>
                      </div>
                    )) : <p className="text-white/40 text-sm font-bold italic text-center py-10">No official administrative entries for this student.</p>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 md:space-y-8">
              {/* PERFORMANCE TAB */}
              {/* Top stat cards: Rank, House Points, Total Finance */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                {/* Rank Card */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm flex flex-col justify-center min-w-0">
                  <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 truncate">
                    RANK {studentRank?.stream ? `(${studentRank.stream})` : ''}
                  </p>
                  {rankLoading ? (
                    <div className="animate-pulse h-8 bg-slate-200 rounded w-16" />
                  ) : studentRank ? (
                    <>
                      <p className="text-3xl md:text-5xl font-black font-serif-numbers italic tracking-tighter text-indigo-600 truncate">
                        {studentRank.rank} / {studentRank.total}
                      </p>
                      <p className="text-[8px] md:text-[9px] font-bold uppercase text-slate-300 italic tracking-widest mt-2 truncate">
                        {selectedRankExam}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400 italic truncate">{rankError || '—'}</p>
                  )}
                </div>
                <StatCard label="House Points" value={totalPoints} unit="POINTS" color={houseTheme.text} />
                <StatCard label="Total Finance" value={totalPaid.toLocaleString()} unit="MMK PAID" color="text-emerald-600" />
              </div>

              {/* Exam selection for ranking & Academic History header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
                <h3 className="text-lg md:text-xl font-black uppercase italic text-slate-800 border-l-4 border-indigo-600 pl-4">
                  Academic History
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-400">Rank by:</span>
                  <select
                    value={selectedRankExam}
                    onChange={(e) => setSelectedRankExam(e.target.value)}
                    className="text-[10px] font-bold bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
                  >
                    <option>May Chapter End Test</option>
                    <option>July Chapter End Test</option>
                    <option>October Midterm Test</option>
                    <option>December Chapter End Test</option>
                    <option>February Year End Test</option>
                    <option>Other (Custom)</option>
                  </select>
                </div>
              </div>

              {/* Annual Distinction & Fail Summary */}
              <div className="flex gap-4 mb-4">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 text-center">
                  <p className="text-amber-600 text-2xl font-black">⭐ {distinctionCount}</p>
                  <p className="text-[10px] font-bold uppercase text-amber-400">Distinctions</p>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-2xl px-6 py-4 text-center">
                  <p className="text-rose-600 text-2xl font-black">{failCount}</p>
                  <p className="text-[10px] font-bold uppercase text-rose-400">Fails</p>
                </div>
              </div>

              {/* Financial Ledger (same as before) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border-2 border-slate-100 shadow-xl flex flex-col lg:col-span-2">
                  <h3 className="text-lg md:text-xl font-black uppercase italic text-slate-800 border-l-4 border-emerald-500 pl-4 mb-6">Financial Ledger</h3>
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden">
                      <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest"><span>DATE / CATEGORY</span><span>AMOUNT PAID</span></div>
                      <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {allData.fees.length > 0 ? allData.fees.map((f, i) => (
                          <div key={i} className="px-6 py-4 flex justify-between items-center bg-white/50"><div className="min-w-0"><p className="text-[10px] font-black text-slate-400 italic">{toMMTDateStr(f.Date)}</p><p className="text-sm font-bold text-slate-800 uppercase truncate">{f.Fee_Category}</p></div><p className="text-lg font-black text-emerald-600 shrink-0">{Number(f.Amount_Paid || 0).toLocaleString()} <span className="text-[10px]">MMK</span></p></div>
                        )) : <p className="p-10 text-center text-slate-400 italic text-xs">No payment history found.</p>}
                      </div>
                    </div>
                    {lastFee && Number(lastFee.Next_Due_Amount || 0) > 0 && (
                      <div className="bg-rose-50 p-6 md:p-8 rounded-3xl border-2 border-rose-200 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-center md:text-left"><p className="text-[10px] font-black uppercase text-rose-400 tracking-widest mb-1">Current Outstanding Due</p><h4 className="text-3xl md:text-5xl font-black text-rose-600 font-serif-numbers leading-none">{Number(lastFee.Next_Due_Amount).toLocaleString()} <span className="text-sm">MMK</span></h4></div>
                        <div className="bg-white/60 px-6 py-3 rounded-2xl border border-rose-100 text-center"><p className="text-[9px] font-black uppercase text-rose-400">Next Payment Due</p><p className="text-base font-black text-rose-900 italic">{toMMTDateStr(lastFee.Next_Due_Date)}</p></div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm flex flex-col">
                  <h3 className="text-lg md:text-xl font-black uppercase italic text-slate-800 border-l-4 border-amber-500 pl-4 mb-4 md:mb-6">Teacher Observations</h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {allData.notes.length > 0 ? [...allData.notes].reverse().map((n, i) => (
                      <div key={i} className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
                        <p className="text-base md:text-lg font-bold italic text-slate-900">"{n.Note || n.Note_Detail}"</p>
                        <div className="flex justify-between items-center text-[9px] font-bold uppercase text-slate-500 mt-3 pt-3 border-t border-slate-200"><span>BY: {n.Recorded_By}</span><span>{toMMTDateStr(n.Date)}</span></div>
                      </div>
                    )) : <p className="text-slate-400 text-xs font-bold italic text-center py-6">No Behavioral Archive.</p>}
                  </div>
                </div>

                {/* Academic History Table (with Rank row at bottom) */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm flex flex-col lg:col-span-2">
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full min-w-[600px] text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                          <th className="p-3 border-b border-slate-200 sticky left-0 bg-slate-100 z-10">Subject</th>
                          <th className="p-3 border-b border-slate-200 text-center">MAY</th>
                          <th className="p-3 border-b border-slate-200 text-center">JUL</th>
                          <th className="p-3 border-b border-slate-200 text-center">OCT</th>
                          <th className="p-3 border-b border-slate-200 text-center">DEC</th>
                          <th className="p-3 border-b border-slate-200 text-center">FEB</th>
                        </tr>
                      </thead>
                      <tbody>
                        {['Myan','Eng','Maths','Chem','Phys','Bio/Eco','SS'].map(subject => {
                          const monthMap = {};

                          const subjectLookups = [];
                          if (subject === 'Bio/Eco') subjectLookups.push('Bio', 'Eco');
                          else if (subject === 'SS') subjectLookups.push('Social');
                          else subjectLookups.push(subject);

                          allData.scores.forEach(sc => {
                            const rawExam = sc.Exam_Name || sc['Exam Name'] || sc.Term || '';
                            const examName = String(rawExam).trim();
                            if (!examName) return;

                            const examUpper = examName.toUpperCase();
                            let monthKey = null;
                            if (examUpper.includes('MAY')) monthKey = 'MAY';
                            else if (examUpper.includes('JUL')) monthKey = 'JUL';
                            else if (examUpper.includes('OCT')) monthKey = 'OCT';
                            else if (examUpper.includes('DEC')) monthKey = 'DEC';
                            else if (examUpper.includes('FEB')) monthKey = 'FEB';
                            if (!monthKey) return;

                            const scSubject = (sc.Subject || '').trim();
                            const subjectMatched = subjectLookups.some(lookup =>
                              scSubject.toLowerCase() === lookup.toLowerCase()
                            );
                            if (!subjectMatched) return;

                            const score = Number(sc.Score);
                            const maxScore = Number(sc.Max_Score || sc['Max Score'] || 100);
                            const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
                            const distinction = isDistinction(scSubject, pct);
                            const fail = isFail(pct);

                            monthMap[monthKey] = {
                              score: sc.Score,
                              maxScore: maxScore,
                              pct: pct,
                              distinction: distinction,
                              fail: fail
                            };
                          });

                          const months = ['MAY','JUL','OCT','DEC','FEB'];
                          return (
                            <tr key={subject} className="hover:bg-indigo-50/30 transition-colors border-b border-slate-100">
                              <td className="p-3 font-bold text-sm md:text-base text-slate-800 sticky left-0 bg-white z-10">
                                {subject}
                              </td>
                              {months.map(m => {
                                const cell = monthMap[m];
                                return (
                                  <td key={m} className="p-3 text-center text-sm md:text-base font-bold">
                                    {cell ? (
                                      <span className={`italic inline-flex items-center gap-1 ${
                                        cell.fail ? 'text-rose-600' : 'text-slate-700'
                                      }`}>
                                        {cell.score}
                                        {cell.distinction && <span className="text-yellow-500 text-base" title="Distinction">⭐</span>}
                                        {cell.fail && <span className="text-[10px] text-rose-500 font-black"> (F)</span>}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300">–</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}

                        {/* Rank Row */}
                        {(() => {
                          const examMonth = getMonthFromExam(selectedRankExam);
                          const months = ['MAY','JUL','OCT','DEC','FEB'];
                          return (
                            <tr className="border-t-2 border-indigo-200 bg-indigo-50/50">
                              <td className="p-3 font-bold text-sm md:text-base text-indigo-700 sticky left-0 bg-indigo-50/50 z-10">
                                🏆 Rank
                              </td>
                              {months.map(m => {
                                const showRank = (examMonth === m && studentRank);
                                return (
                                  <td key={m} className="p-3 text-center text-sm md:text-base font-black">
                                    {rankLoading && examMonth === m ? (
                                      <span className="text-slate-400 animate-pulse">⏳</span>
                                    ) : showRank ? (
                                      <span className="text-indigo-700">
                                        {studentRank.rank} / {studentRank.total}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300">—</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                  {allData.scores.length === 0 && (
                    <p className="text-slate-400 text-xs font-bold italic text-center py-6">No Exam Records.</p>
                  )}
                  {rankError && (
                    <p className="text-rose-500 text-xs font-bold text-center py-2">{rankError}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style jsx global>{`
        body { background-color: #f8fafc; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}

// ── Helpers ──
function PhoneLink({ label, phoneStr, align = "left" }) {
  const cleanPhoneStr = phoneStr ? phoneStr.replace(/[^0-9+]/g, '') : "";
  if (!phoneStr || phoneStr === "—") return (
    <div className={`flex flex-col min-w-0 flex-1 ${align === "center" ? "items-center text-center" : "items-start text-left"}`}>
      <span className="text-[8px] uppercase text-slate-400 font-bold tracking-widest">{label}</span>
      <span className="text-sm md:text-base font-bold text-slate-400">—</span>
    </div>
  );
  return (
    <div className={`flex items-center gap-3 bg-slate-50 p-2.5 pl-4 rounded-xl border border-slate-200 max-w-full ${align === "center" ? "justify-center" : "justify-between"}`}>
      <div className={`flex flex-col min-w-0 flex-1 ${align === "center" ? "items-center text-center" : "items-start text-left"}`}>
        <span className="text-[8px] uppercase text-slate-400 font-bold tracking-widest">{label}</span>
        <span className="text-sm md:text-base font-bold text-slate-900 tracking-wider truncate w-full">{phoneStr}</span>
      </div>
      <a href={`tel:${cleanPhoneStr}`} className="flex-shrink-0 bg-emerald-100 p-2.5 rounded-lg border border-emerald-200 text-emerald-600 shadow-sm">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>
      </a>
    </div>
  );
}

function StatCard({ label, value, unit, color }) {
  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm flex flex-col justify-center min-w-0">
      <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 truncate">{label}</p>
      <p className={`text-3xl md:text-5xl font-black font-serif-numbers italic tracking-tighter ${color} truncate`}>{value}</p>
      <p className="text-[8px] md:text-[9px] font-bold uppercase text-slate-300 italic tracking-widest mt-2 truncate">{unit}</p>
    </div>
  );
}