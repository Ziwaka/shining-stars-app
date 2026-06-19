"use client";
import { getPhotoUrl } from "@/lib/cloudinary";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

// ── MMT Date Converter (Date object / ISO string များကိုသာ ပြောင်း) ──
function toMMTDateStr(val) {
  if (!val && val !== 0) return '';
  // Date object
  if (val instanceof Date) {
    const mmt = new Date(val.getTime() + 6.5 * 60 * 60 * 1000);
    return `${mmt.getUTCFullYear()}-${String(mmt.getUTCMonth() + 1).padStart(2, '0')}-${String(mmt.getUTCDate()).padStart(2, '0')}`;
  }
  const str = String(val).trim();
  if (!str) return '';
  // ISO datetime (T) or space-separated
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const mmt = new Date(d.getTime() + 6.5 * 60 * 60 * 1000);
      return `${mmt.getUTCFullYear()}-${String(mmt.getUTCMonth() + 1).padStart(2, '0')}-${String(mmt.getUTCDate()).padStart(2, '0')}`;
    }
  }
  // yyyy-MM-dd ရက်စွဲသက်သက် (သို့) စာသား → မပြောင်း
  return str;
}

// ── Data array တစ်ခုလုံးထဲက date-like fields အားလုံးကို MMT ပြောင်း ──
function convertAllDates(arr) {
  return (arr || []).map(item => {
    const newItem = {};
    for (const key in item) {
      newItem[key] = toMMTDateStr(item[key]);
    }
    return newItem;
  });
}

// ── DEBUG: Leave record raw data (start_date) ကို စစ်ရန် ──
function logLeaveSample(records) {
  if (!records.length) return;
  console.log('🔍 Leave_Records sample (first 2 rows):');
  console.log(records.slice(0, 2).map(r => ({
    User_ID: r.User_ID,
    Start_Date: r.Start_Date,
    End_Date: r.End_Date,
    Date_Applied: r.Date_Applied
  })));
}

export default function StudentDirectoryOnly() {
  const [students, setStudents]   = useState([]);
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [studentNotes, setStudentNotes] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");
  const router = useRouter();

  const handleBack = () => {
    if (classFilter !== "ALL") { setClassFilter("ALL"); return; }
    if (gradeFilter !== "ALL") { setGradeFilter("ALL"); return; }
    const auth = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null");
    router.push(auth?.userRole === "management" ? "/management/mgt-dashboard" : "/staff");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stuRes, leaveRes, notesRes] = await Promise.all([
          fetch(WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'getData', sheetName: 'Student_Directory', targetGid: 1807615173 })
          }),
          fetch(WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'getData', sheetName: 'Leave_Records' })
          }),
          fetch(WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'getData', sheetName: 'Student_Notes_Log' })
          })
        ]);

        const stuData   = await stuRes.json();
        const leaveData = await leaveRes.json();
        const notesData = await notesRes.json();

        if (stuData.success)   setStudents(convertAllDates(stuData.data || []));
        if (leaveData.success) {
          const convertedLeaves = convertAllDates(leaveData.data || []);
          setLeaveRecords(convertedLeaves);
          logLeaveSample(convertedLeaves);
        }
        if (notesData.success) setStudentNotes(convertAllDates(notesData.data || []));
      } catch(e) {
        console.error('[StudentDir] Fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── helpers ─────────────────────────────────────
  const getGrade    = (s) => s['Grade'] || s['Class'] || s['grade'] || s['class'] || '';
  const getClass    = (s) => String(s['Class'] || '').trim();
  const getName     = (s) => s['Name (ALL CAPITAL)'] || s['အမည်'] || s['Name'] || '';
  const getID       = (s) => s['Enrollment No.'] || s['Registration No.'] || s['No.'] || '';
  const getHouse    = (s) => s['House'] || s['Steam'] || '';
  const getType     = (s) => s['School/Hostel'] || '';
  const isActive    = (s) => String(s.Status ?? 'TRUE').toUpperCase() === 'TRUE' || s.Status === true;

  // ── Leave History (အားလုံး) ─────────────────────
  const getLeaveHistoryText = (studentId) => {
    if (!studentId) return '';
    const records = leaveRecords.filter(r =>
      String(r.User_ID || '').trim() === String(studentId).trim()
    );
    // Debug: log count for this student
    console.log(`📋 Student ${studentId}: ${records.length} leave records found`);

    if (!records.length) return '';
    // နောက်ဆုံးယူထားတဲ့ ခွင့်က အပေါ်ဆုံးမှာ ပေါ်အောင် reverse
    const sorted = records.slice().reverse();
    return sorted.map(r => {
      const start = r['Start_Date']   || '';
      const end   = r['End_Date']     || start;
      const type  = r['Leave_Type']   || '';
      const status= r['Status']       || '';
      const remark= r['Remark']       || '';
      return `📌 ${start} → ${end} (${type}) [${status}] ${remark ? '🗒 '+remark : ''}`;
    }).join('\n');
  };

  // ── Registry Note ────────────────────────────────
  const getRegistryNoteText = (studentId) => {
    if (!studentId) return '';
    const notes = studentNotes.filter(r =>
      String(r.Student_ID || r['Enrollment No.'] || '').trim() === String(studentId).trim()
    );
    if (!notes.length) return '';
    return notes.slice().reverse().map(r => {
      const date = r['Date'] || r['Date_Recorded'] || '';
      const note = r['Note'] || r['Remark'] || '';
      return `📝 ${date}: ${note}`;
    }).join('\n');
  };

  // ── filter logic ─────────────────────────────────
  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !search.trim() ||
      getName(s).toLowerCase().includes(q) ||
      (s['အမည်'] || '').includes(search) ||
      getID(s).toString().includes(search) ||
      (s['Father\'s Name'] || '').toLowerCase().includes(q) ||
      (s['Mother\'s Name'] || '').toLowerCase().includes(q) ||
      getLeaveHistoryText(getID(s)).toLowerCase().includes(q) ||
      getRegistryNoteText(getID(s)).toLowerCase().includes(q);

    if (gradeFilter === "INACTIVE_ARCHIVE") return matchSearch && !isActive(s);
    const matchGrade = gradeFilter === "ALL" || String(getGrade(s)).trim() === String(gradeFilter).trim();
    const matchClass = classFilter === "ALL" || getClass(s) === String(classFilter).trim();
    return matchSearch && matchGrade && matchClass && isActive(s);
  });

  const activeStudents = filtered.filter(s => isActive(s));

  // ── grade folders ───────────────────────────────
  const activeAll   = students.filter(s => isActive(s));
  const gradeStats  = activeAll.reduce((acc, s) => {
    const g = String(getGrade(s) || "").trim() || "Unknown";
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  const uniqueGrades = Object.keys(gradeStats).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  const availableClasses = (gradeFilter !== "ALL" && gradeFilter !== "INACTIVE_ARCHIVE")
    ? [...new Set(students.filter(s => isActive(s) && String(getGrade(s)).trim() === gradeFilter).map(s => getClass(s)).filter(Boolean))].sort()
    : [];

  const showGradesView = gradeFilter === "ALL" && search.trim() === "";
  const showClassesView = !showGradesView && gradeFilter === "12" && classFilter === "ALL" && search.trim() === "";

  // ── Student Card ────────────────────────────────
  const StudentCard = ({ s, inactive = false }) => {
    const previewImg = getPhotoUrl(s.Photo_URL);
    const cardStyle = inactive
      ? { background: '#1a1a1a', borderRadius: '1.5rem', borderBottomWidth: '6px',
          borderColor: '#3a3a3a', filter: 'grayscale(1)', opacity: 0.75 }
      : { background: '#1e1b4b', borderRadius: '1.5rem', borderBottomWidth: '6px',
          borderColor: '#4c1d95' };

    const studentId = getID(s);
    const leaveHistoryText = getLeaveHistoryText(studentId);
    const registryNoteText = getRegistryNoteText(studentId);

    return (
      <button
        onClick={() => router.push(`/staff/student-dir/${encodeURIComponent(studentId)}`)}
        className="p-4 md:p-6 md:rounded-[2rem] md:border-b-[8px] shadow-2xl flex flex-col gap-4 hover:-translate-y-2 active:scale-95 transition-all text-left group min-w-0"
        style={cardStyle}
      >
        {/* Photo + basic info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-xl md:rounded-[1rem] overflow-hidden flex items-center justify-center shadow-inner border-2 md:border-[3px] border-white/20 flex-shrink-0 relative">
            {previewImg
              ? <img src={previewImg} referrerPolicy="no-referrer" className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }} />
              : null}
            <span className="absolute inset-0 flex items-center justify-center text-3xl opacity-20 text-white z-[-1]">👤</span>
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <p style={{ fontSize: '9px', color: inactive ? '#888' : '#a78bfa', fontWeight: 900, letterSpacing: '0.08em', marginBottom: '2px' }}>
              {s['အမည်'] || ''}
            </p>
            <h3 className="text-sm md:text-base uppercase font-black italic whitespace-normal break-words line-clamp-2 leading-tight mb-2"
              style={{ color: inactive ? '#aaa' : '#fff' }}>
              {getName(s)}
            </h3>
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="font-bold tracking-widest uppercase bg-black/40 px-2 py-1 rounded border border-white/5"
                style={{ fontSize: '8px', color: inactive ? '#888' : '#c4b5fd' }}>
                {studentId}
              </span>
              <span className="font-black tracking-widest uppercase bg-black/40 px-2 py-1 rounded border border-white/5"
                style={{ fontSize: '8px', color: inactive ? '#888' : '#FFD700' }}>
                G{getGrade(s)} {getClass(s) && `• ${getClass(s)}`}
              </span>
              {getHouse(s) ? (
                <span className="font-black tracking-widest uppercase bg-black/40 px-2 py-1 rounded border border-white/5"
                  style={{ fontSize: '8px', color: inactive ? '#888' : '#34d399' }}>
                  🏠 {getHouse(s)}
                </span>
              ) : null}
              {getType(s) ? (
                <span className="font-black tracking-widest uppercase bg-black/40 px-2 py-1 rounded border border-white/5"
                  style={{ fontSize: '8px', color: '#888' }}>
                  {getType(s) === 'Hostel' ? '🏠 Hostel' : '🏫 Day'}
                </span>
              ) : null}
              {inactive && (
                <span className="font-black tracking-widest uppercase px-2 py-1 rounded border"
                  style={{ fontSize: '8px', color: '#777', borderColor: '#444', background: '#222', letterSpacing: '0.12em' }}>
                  ARCHIVED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Leave History (All) */}
        {leaveHistoryText && (
          <div className="pt-2 border-t border-white/10">
            <p className="text-[10px] md:text-xs font-black uppercase tracking-wider mb-1"
               style={{ color: '#facc15' }}>📋 Leave History</p>
            <pre className="text-[11px] md:text-sm leading-relaxed whitespace-pre-wrap break-words font-sans"
                 style={{ color: inactive ? '#ccc' : '#ddd', margin: 0 }}>
              {leaveHistoryText}
            </pre>
          </div>
        )}

        {/* Registry Note */}
        {registryNoteText && (
          <div className="pt-2 border-t border-white/10">
            <p className="text-[10px] md:text-xs font-black uppercase tracking-wider mb-1"
               style={{ color: '#60a5fa' }}>📝 Registry Note</p>
            <pre className="text-[11px] md:text-sm leading-relaxed whitespace-pre-wrap break-words font-sans"
                 style={{ color: inactive ? '#ccc' : '#ddd', margin: 0 }}>
              {registryNoteText}
            </pre>
          </div>
        )}
      </button>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-black animate-pulse text-2xl uppercase italic tracking-tighter px-6 text-center"
      style={{ background: '#0F071A', color: '#FFD700' }}>
      Loading Directory...
    </div>
  );

  return (
    <div className="min-h-screen p-3 md:p-10 font-black overflow-x-hidden" style={{ background: '#0F071A' }}>
      <div className="mx-auto space-y-6 md:space-y-10" style={{ maxWidth: '1600px' }}>

        {/* Header */}
        <div className="p-6 md:p-12 md:rounded-[3.5rem] md:border-b-[12px] shadow-3xl flex items-center gap-4 md:gap-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #4c1d95, #2e1065, #0F071A)', borderRadius: '2rem', borderBottomWidth: '6px', borderColor: '#FFD700' }}>
          <button onClick={handleBack}
            className="p-3 md:p-5 md:rounded-[2rem] hover:bg-white transition-all shadow-2xl active:scale-90 border-b-4 md:border-b-6 border-amber-600 flex-shrink-0 z-10"
            style={{ background: '#FFD700', borderRadius: '1.5rem' }}>
            <span className="text-xl md:text-3xl">🔙</span>
          </button>
          <div className="z-10 min-w-0">
            <h1 className="text-3xl sm:text-4xl md:text-6xl italic uppercase font-black text-white tracking-tighter leading-none truncate">Student Hub</h1>
            <p className="mt-2 uppercase bg-black/30 inline-block px-3 md:px-4 py-1.5 rounded-full border border-white/10 truncate max-w-full"
              style={{ color: '#FFD700', letterSpacing: '0.2em', fontSize: '8px' }}>
              {gradeFilter === "ALL" ? "Master Directory" : gradeFilter === "INACTIVE_ARCHIVE" ? "Inactive Archive" : `GRADE ${gradeFilter} ${classFilter !== "ALL" ? `/ CLASS ${classFilter}` : ""}`}
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-5" style={{ fontSize: '150px' }}>🎓</div>
        </div>

        {/* Search */}
        <div className="relative">
          <input type="text" placeholder="Search by Name, Myanmar Name, ID, Leave History, Registry Note..."
            className="w-full border-2 md:border-4 p-5 md:p-8 md:rounded-[2.5rem] text-white font-bold italic text-base md:text-xl outline-none focus:border-[#FFD700] shadow-2xl transition-all"
            style={{ background: '#1A0B2E', borderColor: '#4c1d95', borderRadius: '1.5rem' }}
            onChange={(e) => {setSearch(e.target.value); setGradeFilter("ALL");}} value={search} />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-2xl">✕</button>
          )}
        </div>

        {/* Back to grades */}
        {!showGradesView && gradeFilter !== "ALL" && (
          <div className="flex items-center justify-between bg-white/5 border border-white/10 p-3 md:p-4 rounded-2xl">
            <span className="text-white font-bold italic text-sm md:text-base px-2">
              Viewing: <span style={{ color: '#FFD700' }}>{gradeFilter === "INACTIVE_ARCHIVE" ? "Inactive Archive" : `Grade ${gradeFilter}`}</span>
            </span>
            <button onClick={() => {setGradeFilter("ALL"); setClassFilter("ALL");}}
              className="bg-rose-500 hover:bg-rose-600 text-white font-black tracking-widest uppercase px-5 py-2.5 rounded-full shadow-lg transition-all"
              style={{ fontSize: '10px' }}>
              Clear Filter
            </button>
          </div>
        )}

        {/* Main folders */}
        {showGradesView && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 pb-20 animate-in fade-in zoom-in-95 duration-500">
            {uniqueGrades.map((g, idx) => (
              <button key={idx} onClick={() => setGradeFilter(String(g).trim())}
                className="group p-6 md:p-8 md:rounded-[2.5rem] border-t border-t-white/10 md:border-b-[8px] shadow-xl flex flex-col items-center justify-center gap-3 hover:-translate-y-2 transition-all"
                style={{ background: 'linear-gradient(135deg, #1e1b4b, #0f172a)', borderRadius: '2rem', borderBottomWidth: '6px', borderColor: '#4c1d95' }}>
                <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center"
                  style={{ background: '#FFD700', borderRadius: '1.2rem' }}>
                  <svg className="w-8 h-8 md:w-10 md:h-10" style={{ color: '#4c1d95' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                  </svg>
                </div>
                <h2 className="text-lg md:text-2xl font-black text-white italic mt-1 text-center">GRADE {g}</h2>
                <div className="bg-black/50 px-3 py-1 rounded-full">
                  <p className="tracking-widest uppercase font-bold" style={{ color: '#FFD700', fontSize: '8px' }}>{activeAll.filter(s => String(getGrade(s)).trim() === g).length} Active</p>
                </div>
              </button>
            ))}
            <button onClick={() => setGradeFilter("INACTIVE_ARCHIVE")}
              className="group p-6 md:p-8 md:rounded-[2.5rem] border-t border-t-white/10 md:border-b-[8px] shadow-xl flex flex-col items-center justify-center gap-3 hover:-translate-y-2 transition-all"
              style={{ background: 'linear-gradient(135deg, #1a1a1a, #000)', borderRadius: '2rem', borderBottomWidth: '6px', borderColor: '#ef4444' }}>
              <div className="text-4xl filter grayscale">📂</div>
              <h2 className="text-lg md:text-2xl font-black text-rose-500 italic mt-1 text-center">ARCHIVE</h2>
              <div className="bg-rose-500/20 px-3 py-1 rounded-full">
                <p className="tracking-widest uppercase font-bold text-rose-500" style={{ fontSize: '8px' }}>{students.filter(s => !isActive(s)).length} Inactive</p>
              </div>
            </button>
          </div>
        )}

        {/* Sub-folders (Grade 12) */}
        {showClassesView && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 pb-20 animate-in fade-in zoom-in-95 duration-500">
            {availableClasses.map((c, idx) => (
              <button key={idx} onClick={() => setClassFilter(c)}
                className="group p-6 md:p-8 md:rounded-[2.5rem] border-t border-t-white/10 md:border-b-[8px] shadow-xl flex flex-col items-center justify-center gap-3 hover:-translate-y-2 transition-all"
                style={{ background: 'linear-gradient(135deg, #312e81, #1e1b4b)', borderRadius: '2rem', borderBottomWidth: '6px', borderColor: '#FFD700' }}>
                <div className="text-4xl">📂</div>
                <h2 className="text-lg md:text-2xl font-black text-white italic mt-1 text-center">CLASS {c}</h2>
              </button>
            ))}
          </div>
        )}

        {/* Student List */}
        {(!showGradesView && !showClassesView) && (
          <div className="pb-40 animate-in fade-in slide-in-from-bottom-10 duration-500 space-y-8">
            {filtered.length === 0 && (
              <div className="text-center py-20 font-black italic text-xl uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
                No students found.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filtered.map((s, idx) => <StudentCard key={idx} s={s} isInactive={!isActive(s)} />)}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}