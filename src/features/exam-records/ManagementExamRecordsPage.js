"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';
import * as XLSX from 'xlsx';

const S = {
  page: { display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden', background:'#0f0a1e', color:'#fff', fontFamily:'system-ui,sans-serif' },
  header: { zIndex:40, background:'rgba(10,15,30,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  card:   { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'16px' },
  input:  { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'10px', padding:'8px 12px', color:'#fff', fontSize:'12px', outline:'none', boxSizing:'border-box', textAlign:'center' },
  label:  { display:'block', fontSize:'9px', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'6px' },
  select: { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', padding:'10px 14px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box', cursor:'pointer' },
  tabOn:  { background:'#fbbf24', color:'#0a0f1e', border:'none', borderRadius:'10px', padding:'7px 16px', fontSize:'10px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap' },
  tabOff: { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)', border:'none', borderRadius:'10px', padding:'7px 16px', fontSize:'10px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap' },
};

const GRADE_COLOR = { A:'#34d399', B:'#60a5fa', C:'#fbbf24', D:'#fb923c', F:'#f87171', Distinction:'#fbbf24' };
const SUBJECT_DISTINCTION_MAP = {
  'Myan': 75, 'Eng': 75, 'Bio': 75, 'Eco': 75,
  'Maths': 80, 'Phys': 80, 'Chem': 80, 'Social': 80,
  'History': 75
};

const getDistinction = (subject, pct) => {
  const threshold = SUBJECT_DISTINCTION_MAP[subject];
  if (!threshold) return false;
  return pct >= threshold;
};

const pctToGrade = (pct, cfg) => {
  if (pct >= (cfg?.gradeA||80)) return 'A';
  if (pct >= (cfg?.gradeB||65)) return 'B';
  if (pct >= (cfg?.gradeC||50)) return 'C';
  if (pct >= (cfg?.gradeD||40)) return 'D';
  return 'F';
};

const RANK_ICONS = ['🥇','🥈','🥉'];
const GRADES = ['KG','1','2','3','4','5','6','7','8','9','10','11','12'];
const SECTIONS = ['A','B','C','D','E','F'];
const EXAM_TYPES = ['July Chapter End Test', 'October Midterm Test', 'December Chapter End Test', 'February Year End Test', 'Other (Custom)'];

const NORMALIZE_SUBJECT_MAP = {
  'မြန်မာ': 'Myan', 'myan': 'Myan', 'myanmar': 'Myan',
  'အင်္ဂလိပ်': 'Eng', 'eng': 'Eng', 'english': 'Eng',
  'သင်္ချာ': 'Maths', 'maths': 'Maths', 'math': 'Maths', 'mathematics': 'Maths',
  'ဓာတု': 'Chem', 'chem': 'Chem', 'chemistry': 'Chem',
  'ရူပ': 'Phys', 'phys': 'Phys', 'physics': 'Phys',
  'ဇီဝ': 'Bio', 'bio': 'Bio', 'biology': 'Bio',
  'စီးပွားရေး': 'Eco', 'ဘောဂ': 'Eco', 'eco': 'Eco', 'economics': 'Eco',
  'လူမှုရေး': 'Social', 'social': 'Social',
  'history': 'History', 'History': 'History'
};

const normalizeSubject = (name) => {
  if (!name) return name;
  const trimmed = name.toString().trim();
  const lower = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(NORMALIZE_SUBJECT_MAP)) {
    if (lower === key.toLowerCase() || trimmed === key) return value;
  }
  return trimmed;
};

export default function ExamRecordsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('entry');
  const [config, setConfig] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const [selYear, setSelYear] = useState('');
  const [selGrade, setSelGrade] = useState('');
  const [selSection, setSelSection] = useState('');
  const [examType, setExamType] = useState('July Chapter End Test');
  const [customExamName, setCustomExamName] = useState('');

  const [bulkData, setBulkData] = useState({});
  const [maxScores, setMaxScores] = useState({});
  const [rankData, setRankData] = useState({});
  const [hasImportedData, setHasImportedData] = useState(false);
  const [hasImportedRanks, setHasImportedRanks] = useState(false); // NEW

  const [singleStudentId, setSingleStudentId] = useState('');
  const [singleSubject, setSingleSubject] = useState('');
  const [singleScore, setSingleScore] = useState('');
  const [singleMaxScore, setSingleMaxScore] = useState('100');

  const [rankList, setRankList] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [canEdit, setCanEdit] = useState(false);

  const prevSubjectsRef = useRef('');
  const prevStudentIdsRef = useRef('');

  // Auth
  useEffect(() => {
    const saved = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    const checkPerm = (key) => u.userRole==='management' || u[key]===true || String(u[key]||'').toUpperCase()==='TRUE';
    if (u.userRole === 'management') { setUser(u); setCanEdit(true); fetchConfig(u); return; }
    if (checkPerm('Can_Record_Exam')) { setUser(u); setCanEdit(true); fetchConfig(u); return; }
    fetch(WEB_APP_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify({ action:'getStaffPermissions' }) })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          const fresh = (res.data||[]).find(s => (s.Staff_ID && s.Staff_ID.toString() === u.Staff_ID?.toString()) || (s.Name && (s.Name === u['Name (ALL CAPITAL)'] || s.Name === u.Name)));
          if (fresh) {
            const updated = { ...u, ...fresh };
            localStorage.setItem('user', JSON.stringify(updated));
            if (!(updated['Can_Record_Exam']===true || String(updated['Can_Record_Exam']||'').toUpperCase()==='TRUE')) { router.push('/management/mgt-dashboard'); return; }
            setUser(updated); setCanEdit(true); fetchConfig(updated); return;
          }
        }
        router.push('/management/mgt-dashboard');
      })
      .catch(() => router.push('/management/mgt-dashboard'));
  }, []);

  const fetchConfig = async (u) => {
    setLoading(true);
    try {
      const [cfgRes, stuRes] = await Promise.all([
        fetch(WEB_APP_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify({ action:'getExamConfig' }) }),
        fetch(WEB_APP_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify({ action:'getData', sheetName:'Student_Directory' }) }),
      ]);
      const cfg = await cfgRes.json();
      const stu = await stuRes.json();
      if (cfg.success) { setConfig(cfg.config); setSelYear(cfg.config.academicYear || ''); }
      if (stu.success) setStudents(stu.data || []);
    } catch {}
    setLoading(false);
  };

  const showMsg = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg(null),4000); };

  const gradeKey = selGrade === 'KG' ? 'KG' : `Grade ${selGrade}`;
  const rawConfigSubjects = (config?.subjectsByGrade?.[gradeKey]) || [];
  const configSubjects = useMemo(() => rawConfigSubjects.map(sub => normalizeSubject(sub)), [rawConfigSubjects]);

  const classStudents = useMemo(() => {
    return students.filter(s => {
      const g = (s.Grade || s['Grade'] || '').toString().replace('Grade ','').trim();
      const sec = (s.Section || s['Section'] || '').toString().trim();
      if (String(g) !== String(selGrade)) return false;
      if (selSection && sec && sec !== selSection) return false;
      return true;
    });
  }, [students, selGrade, selSection]);

  // ─── displaySubjects: only subjects that have at least one score in bulkData ───
  const displaySubjects = useMemo(() => {
    const subjectsInData = new Set();
    Object.values(bulkData).forEach(studentData => {
      Object.keys(studentData).forEach(sub => {
        const val = studentData[sub];
        if (val !== undefined && val !== null && val !== '') {
          subjectsInData.add(sub);
        }
      });
    });
    return [...subjectsInData];
  }, [bulkData]);

  // ─── studentsWithData: if we imported data, show only those with scores ───
  const studentsWithData = useMemo(() => {
    if (!hasImportedData) return classStudents;
    return classStudents.filter(s => {
      const sid = s['Enrollment No.'] || s.Student_ID || '';
      return sid && bulkData[sid] && Object.keys(bulkData[sid]).length > 0;
    });
  }, [classStudents, bulkData, hasImportedData]);

  useEffect(() => {
    if (!selGrade) return;
    const currentSubjectsKey = JSON.stringify([...configSubjects].sort());
    const currentStudentIds = classStudents.map(s => s['Enrollment No.'] || s.Student_ID || '').filter(id => id);
    const currentStudentIdsKey = JSON.stringify([...currentStudentIds].sort());

    if (currentSubjectsKey !== prevSubjectsRef.current) {
      setMaxScores(prev => {
        const newMax = { ...prev };
        configSubjects.forEach(sub => { if (!(sub in newMax)) newMax[sub] = '100'; });
        return newMax;
      });
      prevSubjectsRef.current = currentSubjectsKey;
    }

    if (currentStudentIdsKey !== prevStudentIdsRef.current) {
      setBulkData(prev => {
        const newData = { ...prev };
        classStudents.forEach(s => {
          const sid = s['Enrollment No.'] || s.Student_ID || '';
          if (sid && !newData[sid]) newData[sid] = {};
        });
        return newData;
      });
      prevStudentIdsRef.current = currentStudentIdsKey;
    }
  }, [configSubjects, classStudents, selGrade]);

  const handleBulkChange = (sid, subject, val) => {
    const normalizedSub = normalizeSubject(subject);
    setBulkData(prev => ({
      ...prev,
      [sid]: { ...(prev[sid]||{}), [normalizedSub]: val }
    }));
  };

  // ─── COMPUTE RANKS using studentsWithData ───
  const computeRanks = (data, studentsList, passMark) => {
    const pass = passMark || 40;
    const studentStats = {};
    studentsList.forEach(s => {
      const sid = s['Enrollment No.'] || s.Student_ID || '';
      if (!sid) return;
      const scores = data[sid] || {};
      let total = 0;
      let failCount = 0;
      Object.entries(scores).forEach(([subject, score]) => {
        const num = Number(score);
        if (!isNaN(num)) {
          total += num;
          if (num < pass) failCount++;
        }
      });
      studentStats[sid] = { total, failCount };
    });

    const ranks = {};
    Object.keys(studentStats).forEach(sid => {
      const current = studentStats[sid];
      let rank = 1;
      Object.keys(studentStats).forEach(otherSid => {
        if (otherSid === sid) return;
        const other = studentStats[otherSid];
        if (other.total > current.total) {
          rank++;
        } else if (other.total === current.total && other.failCount > current.failCount) {
          rank++;
        }
      });
      ranks[sid] = rank;
    });
    return ranks;
  };

  // ─── EXCEL UPLOAD – DYNAMIC SUBJECT DETECTION ───
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) { showMsg('No file selected', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellFormula: true, cellText: false, cellNF: false });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const range = XLSX.utils.decode_range(firstSheet['!ref']);

        // Build rows from cell.v (computed values) with fallback to cell.w
        const rows = [];
        for (let R = range.s.r; R <= range.e.r; R++) {
          const row = [];
          for (let C = range.s.c; C <= range.e.c; C++) {
            const addr = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = firstSheet[addr];
            if (cell && cell.v !== undefined && cell.v !== null) {
              row.push(cell.v);
            } else if (cell && cell.w !== undefined) {
              const wStr = String(cell.w).trim();
              const num = parseFloat(wStr);
              if (!isNaN(num) && wStr !== '') {
                row.push(num);
              } else {
                row.push(wStr);
              }
            } else {
              row.push('');
            }
          }
          rows.push(row);
        }

        if (rows.length === 0) { showMsg('Excel ဖိုင်ဗလာဖြစ်နေပါတယ်', 'error'); return; }

        const headerRow = rows[0];
        console.log('📋 Excel Header Row:', headerRow);

        // ─── Define known non-subject column keywords ───
        const nonSubjectKeywords = [
          'စဉ်', 'ခုံအမှတ်', 'enrollment', 'enrolment', 'အမည်', 'name',
          'class', 'စုစုပေါင်း', 'total', 'rank', 'အဆင့်', 'ကျဘာသာ', 'fail', 'remark'
        ];

        // ─── Build column mappings ───
        const colMap = {};
        const subjectCols = [];

        console.log('🔍 Analyzing columns:');
        headerRow.forEach((cell, idx) => {
          const str = String(cell || '').trim();
          if (!str) {
            console.log(`  Column ${idx}: empty`);
            return;
          }
          const lower = str.toLowerCase();
          const isNonSubject = nonSubjectKeywords.some(kw => lower.includes(kw) || str === kw);
          if (isNonSubject) {
            console.log(`  Column ${idx}: "${str}" → NON-SUBJECT (${nonSubjectKeywords.find(kw => lower.includes(kw) || str === kw)})`);
            if (lower.includes('enrollment') || lower.includes('enrolment')) {
              colMap.enrollment = idx;
            } else if (str === 'အမည်' || lower.includes('name')) {
              colMap.name = idx;
            } else if (/rank|အဆင့်|class rank/i.test(str)) {
              colMap.rank = idx;
            }
            return;
          }
          // Otherwise treat as subject column
          const normalized = normalizeSubject(str);
          console.log(`  Column ${idx}: "${str}" → SUBJECT (normalized: "${normalized}")`);
          subjectCols.push({ header: str, normalized, index: idx });
          colMap[normalized] = idx;
        });

        console.log('🔍 Final colMap:', JSON.stringify(colMap));
        console.log('📚 Detected subjects:', subjectCols.map(s => s.normalized));

        const hasStudentId = colMap.enrollment !== undefined || colMap.name !== undefined;
        if (!hasStudentId || subjectCols.length === 0) {
          showMsg('မှန်ကန်တဲ့ ခေါင်းစဉ်တန်း မတွေ့ပါ။ (Enrollment/အမည် + ဘာသာရပ် အနည်းဆုံး ၁ခုပါရပါမယ်)', 'error');
          return;
        }

        // Student mapping
        const studentMapByEnrollment = {};
        const studentMapByName = {};
        classStudents.forEach(s => {
          const sid = (s['Enrollment No.'] || s['Enrollment Number'] || s.Student_ID || '').toString().trim();
          const name = (s['Name (ALL CAPITAL)'] || s['အမည်'] || s.Name || '').toString().trim();
          if (sid) studentMapByEnrollment[sid] = s;
          if (name) studentMapByName[name] = s;
          const normalName = (s.Name || '').toString().trim();
          if (normalName && normalName !== name) studentMapByName[normalName] = s;
        });

        const getStudentFromRow = (row) => {
          if (colMap.enrollment !== undefined) {
            const enroll = String(row[colMap.enrollment] || '').trim();
            if (enroll && studentMapByEnrollment[enroll]) return studentMapByEnrollment[enroll];
          }
          if (colMap.name !== undefined) {
            const name = String(row[colMap.name] || '').trim();
            if (name && studentMapByName[name]) return studentMapByName[name];
          }
          return null;
        };

        let importedCount = 0;
        const newSubjectsFound = [];
        const newRankData = {};
        const newBulkData = {};

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          if (row.every(cell => cell === '' || cell === undefined || cell === null)) continue;

          const student = getStudentFromRow(row);
          if (!student) continue;

          const sid = student['Enrollment No.'] || student['Enrollment Number'] || student.Student_ID || '';
          if (!sid) continue;

          // Read Rank
          if (colMap.rank !== undefined) {
            const rankVal = row.length > colMap.rank ? row[colMap.rank] : undefined;
            if (rankVal !== undefined && rankVal !== null && rankVal !== '') {
              const num = Number(rankVal);
              if (!isNaN(num)) {
                newRankData[sid] = num;
              }
            }
          }

          if (!newBulkData[sid]) newBulkData[sid] = {};
          let hasScore = false;

          subjectCols.forEach(({ normalized, index }) => {
            const rawVal = row.length > index ? row[index] : undefined;
            if (rawVal === undefined || rawVal === null || rawVal === '') return;
            const score = parseFloat(rawVal);
            if (!isNaN(score)) {
              newBulkData[sid][normalized] = score;
              hasScore = true;
              if (!newSubjectsFound.includes(normalized)) newSubjectsFound.push(normalized);
            }
          });

          if (hasScore) importedCount++;
        }

        // Replace bulkData with newBulkData (only students with scores)
        setBulkData(newBulkData);
        console.log('📊 New bulkData:', newBulkData);
        console.log(`✅ Imported ${importedCount} students, subjects:`, newSubjectsFound);

        // Set rankData from imported ranks (if any)
        if (Object.keys(newRankData).length > 0) {
          setRankData(newRankData);
          setHasImportedRanks(true);  // ✅ Prevent auto-compute
          console.log('📊 Imported ranks:', newRankData);
        }

        // Add maxScores for new subjects
        if (newSubjectsFound.length > 0) {
          setMaxScores(prev => {
            const updated = { ...prev };
            newSubjectsFound.forEach(sub => {
              if (!(sub in updated)) updated[sub] = '100';
            });
            return updated;
          });
        }

        setHasImportedData(true);

        showMsg(`✅ ${importedCount} ကျောင်းသား အချက်အလက် သွင်းပြီး (Rank ${Object.keys(newRankData).length} ဦး, ဘာသာရပ် ${newSubjectsFound.length} ခု)`);
        e.target.value = null;
      } catch (err) {
        console.error(err);
        showMsg('Excel ဖတ်ရာမှာ အမှားရှိပါတယ်: ' + err.message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ─── Recompute ranks ONLY if no imported rank exists ───
  useEffect(() => {
    // If ranks were imported from Excel, skip auto-compute
    if (hasImportedRanks) {
      console.log('✅ Using imported ranks from Excel. Skipping auto-recompute.');
      return;
    }

    if (Object.keys(bulkData).length === 0) {
      // Only set to empty if not already empty to avoid unnecessary rerenders
      if (Object.keys(rankData).length > 0) {
        setRankData({});
      }
      return;
    }
    const passMark = config?.passMark || 40;
    const newRanks = computeRanks(bulkData, studentsWithData, passMark);
    setRankData(newRanks);
  }, [bulkData, studentsWithData, config, hasImportedRanks]); // ✅ Removed rankData from dependencies

  // ─── SUBMIT BULK ───
  const handleSubmitBulk = async () => {
    if (!selYear) return showMsg('Academic Year ထည့်ပါ', 'error');
    if (!selGrade) return showMsg('Grade ရွေးပါ', 'error');
    if (studentsWithData.length === 0) return showMsg('Student data not found. Please upload Excel.', 'error');

    let finalExamName = examType;
    if (examType === 'Other (Custom)') {
      if (!customExamName.trim()) return showMsg('Custom Exam Name ထည့်ပါ', 'error');
      finalExamName = customExamName.trim();
    }

    const records = [];
    studentsWithData.forEach(s => {
      const sid = s['Enrollment No.'] || s.Student_ID || '';
      const name = s['Name (ALL CAPITAL)'] || s['အမည်'] || s.Name || '';
      const studentSubjects = bulkData[sid] || {};
      const rank = rankData[sid] !== undefined ? rankData[sid] : '';

      Object.entries(studentSubjects).forEach(([subject, score]) => {
        if (score === '' || score === undefined || score === null) return;
        const numScore = Number(score);
        if (isNaN(numScore)) return;

        const maxScore = Number(maxScores[subject]) || 100;
        const pct = Math.round((numScore / maxScore) * 100);
        const grade = pctToGrade(pct, config);
        const isDistinction = getDistinction(subject, pct);

        records.push({
          Student_ID: sid,
          Name: name,
          Subject: subject,
          Score: numScore,
          Max_Score: maxScore,
          Grade: grade,
          Distinction: isDistinction,
          Percentage: pct,
          Rank: rank
        });
      });
    });

    if (records.length === 0) return showMsg('Score မထည့်ရသေးပါ', 'error');

    setSaving(true);
    try {
      const payload = {
        action: 'recordExamBulk',
        Academic_Year: selYear,
        Exam_Name: finalExamName,
        Grade: selGrade,
        Section: selSection,
        records: records,
        Recorded_By: user?.Name || user?.username || '',
        staffId: user?.Staff_ID || user?.username || '',
        userRole: user?.userRole || 'staff'
      };
      console.log('🚀 Sending Payload:', JSON.stringify(payload, null, 2));
      const res = await fetch(WEB_APP_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      const r = await res.json();
      if (r.success) { showMsg(r.message || '✓ Bulk saved successfully!'); } else showMsg(r.message || 'Error saving.', 'error');
    } catch (err) { console.error(err); showMsg('Network error.', 'error'); }
    setSaving(false);
  };

  // ─── SUBMIT SINGLE ───
  const handleSubmitSingle = async () => {
    if (!selYear) return showMsg('Academic Year ထည့်ပါ', 'error');
    if (!selGrade) return showMsg('Grade ရွေးပါ', 'error');
    if (!singleStudentId) return showMsg('Student ရွေးပါ', 'error');
    if (!singleSubject.trim()) return showMsg('Subject/Event Name ထည့်ပါ', 'error');
    if (singleScore === '' || isNaN(Number(singleScore))) return showMsg('Score ထည့်ပါ', 'error');

    let finalExamName = examType;
    if (examType === 'Other (Custom)') {
      if (!customExamName.trim()) return showMsg('Custom Exam Name ထည့်ပါ', 'error');
      finalExamName = customExamName.trim();
    }

    const subject = normalizeSubject(singleSubject.trim());
    const numScore = Number(singleScore);
    const maxScore = Number(singleMaxScore) || 100;
    const pct = Math.round((numScore / maxScore) * 100);
    const grade = pctToGrade(pct, config);
    const isDistinction = getDistinction(subject, pct);

    const student = classStudents.find(s => (s['Enrollment No.'] || s.Student_ID) === singleStudentId);
    const name = student ? (student['Name (ALL CAPITAL)'] || student['အမည်'] || student.Name) : '';

    const records = [{
      Student_ID: singleStudentId,
      Name: name,
      Subject: subject,
      Score: numScore,
      Max_Score: maxScore,
      Grade: grade,
      Distinction: isDistinction,
      Percentage: pct,
      Rank: ''
    }];

    setSaving(true);
    try {
      const payload = {
        action: 'recordExamSingle',
        Academic_Year: selYear,
        Exam_Name: finalExamName,
        Grade: selGrade,
        Section: selSection,
        records: records,
        Recorded_By: user?.Name || user?.username || '',
        staffId: user?.Staff_ID || user?.username || '',
        userRole: user?.userRole || 'staff'
      };
      console.log('🚀 Sending Single Payload:', JSON.stringify(payload, null, 2));
      const res = await fetch(WEB_APP_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      const r = await res.json();
      if (r.success) {
        showMsg('✅ Single entry saved');
        setSingleStudentId('');
        setSingleSubject('');
        setSingleScore('');
        setSingleMaxScore('100');
      } else showMsg(r.message || 'Error saving.', 'error');
    } catch (err) { console.error(err); showMsg('Network error.', 'error'); }
    setSaving(false);
  };

  // ─── FETCH RESULTS ───
  const fetchResults = useCallback(async () => {
    if (!selYear || !selGrade) return;
    setResultsLoading(true);
    try {
      const finalExamName = examType === 'Other (Custom)' ? customExamName : examType;
      const res = await fetch(WEB_APP_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({
        action: 'getExamResults',
        Academic_Year: selYear,
        Exam_Name: finalExamName,
        Grade: selGrade,
        Section: selSection,
      }) });
      const r = await res.json();
      if (r.success) setRankList(r.rankList || []);
    } catch { }
    setResultsLoading(false);
  }, [selYear, selGrade, selSection, examType, customExamName]);

  useEffect(() => {
    if (tab === 'results' || tab === 'ranking') fetchResults();
  }, [tab, fetchResults]);

  const handleUpdateEdit = async () => {
    if (!editRow) return;
    setSaving(true);
    try {
      const finalExamName = examType === 'Other (Custom)' ? customExamName : examType;
      const payload = {
        action: 'updateExamRecord',
        Academic_Year: selYear,
        Exam_Name: finalExamName,
        Grade: selGrade,
        Section: selSection || editRow.Section || '',
        Student_ID: editRow.Student_ID,
        Subject: editRow.Subject,
        Score: Number(editRow.Score),
        Max_Score: Number(editRow.Max_Score),
        Remark: editRow.Remark || '',
      };
      console.log('🔄 Update Payload:', payload);
      const res = await fetch(WEB_APP_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      const r = await res.json();
      if (r.success) { showMsg('✓ Updated'); setEditRow(null); fetchResults(); } else showMsg(r.message || 'Error', 'error');
    } catch { showMsg('Network error', 'error'); }
    setSaving(false);
  };

  // ─── FILTER BAR ───
  const filterBar = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px', marginBottom: '12px' }}>
      <div><label style={S.label}>Academic Year</label><input value={selYear} onChange={e => setSelYear(e.target.value)} placeholder="2024-2025" style={{ ...S.input, textAlign: 'left', padding: '10px 14px' }} /></div>
      <div><label style={S.label}>Grade</label><select value={selGrade} onChange={e => setSelGrade(e.target.value)} style={S.select}><option value="">— Grade —</option>{GRADES.map(g => <option key={g} style={{ background: '#0a0f1e' }}>{g}</option>)}</select></div>
      <div><label style={S.label}>Section</label><select value={selSection} onChange={e => setSelSection(e.target.value)} style={S.select}><option value="">All</option>{SECTIONS.map(s => <option key={s} style={{ background: '#0a0f1e' }}>{s}</option>)}</select></div>
      <div><label style={S.label}>Exam Type</label>
        <select value={examType} onChange={e => setExamType(e.target.value)} style={S.select}>
          {EXAM_TYPES.map(t => <option key={t} style={{ background: '#0a0f1e' }}>{t}</option>)}
        </select>
      </div>
      {examType === 'Other (Custom)' && (
        <div style={{ gridColumn: 'span 2' }}>
          <label style={S.label}>Custom Exam Name</label>
          <input value={customExamName} onChange={e => setCustomExamName(e.target.value)} placeholder="e.g. Spelling Bee, Art Competition..." style={{ ...S.input, textAlign: 'left', padding: '10px 14px' }} />
        </div>
      )}
    </div>
  );

  // ─── RENDER ───
  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}select,input{font-family:inherit}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}input[type=number]{-moz-appearance:textfield}::-webkit-scrollbar{height:4px;background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}`}</style>

      <div style={S.header}>
        <button onClick={()=>router.back()} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'14px'}}>← Back</button>
        <div style={{textAlign:'center'}}><p style={{fontWeight:900,fontSize:'13px',textTransform:'uppercase',letterSpacing:'0.1em',margin:0}}>Exam Records</p><p style={{fontSize:'9px',color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'0.12em',margin:0}}>Shining Stars</p></div>
        <button onClick={()=>fetchConfig(user)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'18px'}}>↻</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '80px' }}>
        {msg && <div style={{ position: 'fixed', top: '64px', left: '50%', transform: 'translateX(-50%)', zIndex: 50, padding: '8px 20px', borderRadius: '999px', fontSize: '12px', fontWeight: 900, color: '#fff', background: msg.type === 'error' ? '#ef4444' : '#10b981', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>{msg.text}</div>}

        <div style={{ display: 'flex', gap: '6px', padding: '12px 16px 0', overflowX: 'auto' }}>
          {[{ id: 'entry', label: '📝 Bulk Entry' }, { id: 'single', label: '➕ Single Entry' }, { id: 'results', label: '📊 Results' }, { id: 'ranking', label: '🏆 Ranking' }, ...(canEdit ? [{ id: 'edit', label: '✏️ Edit' }] : [])].map(t => <button key={t.id} onClick={() => setTab(t.id)} style={tab === t.id ? S.tabOn : S.tabOff}>{t.label}</button>)}
        </div>

        <div style={{ padding: '0 16px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #fbbf24', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>
          ) : (
            <>
              {/* ── BULK ENTRY ── */}
              {tab === 'entry' && (
                <div style={{ marginTop: '8px' }}>
                  {filterBar}
                  <div style={{ ...S.card, marginBottom: '12px', border: '1px dashed rgba(251,191,36,0.3)' }}>
                    <label style={{ ...S.label, color: '#fbbf24' }}>📂 Upload Excel (.xlsx)</label>
                    <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} style={{ ...S.input, padding: '6px', textAlign: 'left' }} />
                    <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>
                      ✅ Excel ထဲကအတိုင်း အကုန်ဖတ်ပါမယ် (ဘာသာရပ်အားလုံး အလိုအလျောက် ဖော်ထုတ်မယ်)<br />
                      ✅ Total ကော်လံမှာ ဂဏန်းသီးသန့်ပြမယ်<br />
                      ✅ Excel ထဲက Rank ကို သူ့အတိုင်း သိမ်းမယ် (မပါရင် ပြန်တွက်ပေးမယ်)<br />
                      ✅ Excel ထဲပါတဲ့ ကျောင်းသားတွေကိုသာ ပြမယ်
                    </p>
                  </div>

                  {selGrade && displaySubjects.length === 0 && <div style={{ ...S.card, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>⚠️ ဘာသာရပ် မတွေ့ပါ။ Excel တင်ပါ။</div>}
                  {selGrade && displaySubjects.length > 0 && (
                    <>
                      <div style={{ ...S.card, marginBottom: '8px' }}>
                        <p style={{ ...S.label, marginBottom: '8px', color: '#fbbf24' }}>Max Score per Subject</p>
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(displaySubjects.length, 4)},1fr)`, gap: '6px' }}>
                          {displaySubjects.map(sub => <div key={sub}><label style={{ ...S.label, fontSize: '8px' }}>{sub}</label><input type="number" value={maxScores[sub] || '100'} onChange={e => setMaxScores(p => ({ ...p, [sub]: e.target.value }))} style={S.input} /></div>)}
                        </div>
                      </div>
                      <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                          <thead><tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <th style={{ padding: '8px 10px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: 900, fontSize: '9px', textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', left: 0, background: 'rgba(10,15,30,0.98)', zIndex: 5 }}>Name</th>
                            {displaySubjects.map(sub => <th key={sub} style={{ padding: '8px 6px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontWeight: 900, fontSize: '9px', textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.08)', minWidth: '64px' }}>{sub}</th>)}
                            <th style={{ padding: '8px 6px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '9px', borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>Total</th>
                            <th style={{ padding: '8px 6px', textAlign: 'center', color: 'rgba(251,191,36,0.6)', fontWeight: 900, fontSize: '9px', borderBottom: '1px solid rgba(251,191,36,0.2)', whiteSpace: 'nowrap' }}>🏆 Rank</th>
                          </tr></thead>
                          <tbody>
                            {studentsWithData.length === 0 ? (
                              <tr><td colSpan={displaySubjects.length + 3} style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.2)' }}>Excel ထဲမှ ကျောင်းသား မတွေ့ပါ</td></tr>
                            ) : studentsWithData.map((s, i) => {
                                const sid = s['Enrollment No.'] || s.Student_ID || '';
                                const name = s['Name (ALL CAPITAL)'] || s['အမည်'] || s.Name || '';
                                const row = bulkData[sid] || {};
                                const totScore = displaySubjects.reduce((sum, sub) => sum + (Number(row[sub]) || 0), 0);
                                const totMax = displaySubjects.reduce((sum, sub) => sum + (Number(maxScores[sub]) || 100), 0);
                                const totPct = totMax > 0 ? Math.round((totScore / totMax) * 100) : 0;
                                const failCount = displaySubjects.filter(sub => {
                                  const sc = Number(row[sub]);
                                  const mx = Number(maxScores[sub]) || 100;
                                  return !isNaN(sc) && row[sub] !== '' && Math.round((sc / mx) * 100) < (config?.passMark || 40);
                                }).length;
                                const lg = pctToGrade(totPct, config);
                                const rank = rankData[sid];
                                return (
                                  <tr key={sid} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                                    <td style={{ padding: '6px 10px', position: 'sticky', left: 0, background: i % 2 === 0 ? '#0a0f1e' : 'rgba(255,255,255,0.015)', zIndex: 4 }}>
                                      <p style={{ fontWeight: 700, fontSize: '11px', color: '#fff', margin: 0, whiteSpace: 'nowrap' }}>{name}</p>
                                      <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{sid}</p>
                                    </td>
                                    {displaySubjects.map(sub => {
                                      const val = row[sub] !== undefined ? row[sub] : '';
                                      const mx = Number(maxScores[sub]) || 100;
                                      const pct = val !== '' && !isNaN(Number(val)) ? Math.round((Number(val) / mx) * 100) : null;
                                      const isFail = pct !== null && pct < (config?.passMark || 40);
                                      const isDist = pct !== null ? getDistinction(sub, pct) : false;
                                      return (<td key={sub} style={{ padding: '4px 4px', textAlign: 'center' }}>
                                        <input type="number" value={val} onChange={e => handleBulkChange(sid, sub, e.target.value)} min="0" max={maxScores[sub] || 100} style={{ ...S.input, width: '58px', borderColor: isFail ? 'rgba(239,68,68,0.5)' : val !== '' ? 'rgba(134,239,172,0.3)' : 'rgba(255,255,255,0.12)', color: isFail ? '#f87171' : val !== '' ? '#86efac' : '#fff' }} />
                                        {isDist && <span style={{ fontSize: '8px', color: '#fbbf24', display: 'block' }}>⭐</span>}
                                      </td>);
                                    })}
                                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                      {totScore > 0 && (
                                        <div>
                                          <span style={{ fontWeight: 900, fontSize: '15px', color: '#fff' }}>{totScore}</span>
                                          <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>/{totMax}</p>
                                          {failCount > 0 && <p style={{ fontSize: '8px', color: '#f87171', margin: 0 }}>{failCount}F</p>}
                                        </div>
                                      )}
                                    </td>
                                    <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 900, fontSize: '16px', color: rank && !isNaN(rank) && rank <= 3 ? '#fbbf24' : 'rgba(255,255,255,0.5)' }}>
                                      {rank ? (rank <= 3 ? RANK_ICONS[rank - 1] : rank) : '—'}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                      <button onClick={handleSubmitBulk} disabled={saving} style={{ background: '#fbbf24', color: '#0a0f1e', border: 'none', borderRadius: '14px', padding: '14px', fontSize: '13px', fontWeight: 900, width: '100%', cursor: saving ? 'default' : 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: saving ? 0.5 : 1 }}>{saving ? 'Saving...' : '💾 Save Bulk Records'}</button>
                    </>
                  )}
                </div>
              )}

              {/* ── SINGLE ENTRY ── */}
              {tab === 'single' && (
                <div style={{ marginTop: '8px' }}>
                  {filterBar}
                  <div style={{ ...S.card, border: '1px solid rgba(52,211,153,0.2)' }}>
                    <p style={{ fontWeight: 900, fontSize: '14px', color: '#34d399', margin: '0 0 12px' }}>✏️ Single Entry (တစ်ဦးချင်း)</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={S.label}>Student</label>
                        <select value={singleStudentId} onChange={e => setSingleStudentId(e.target.value)} style={S.select}>
                          <option value="">— Select —</option>
                          {classStudents.map(s => {
                            const sid = s['Enrollment No.'] || s.Student_ID || '';
                            const name = s['Name (ALL CAPITAL)'] || s['အမည်'] || s.Name || '';
                            return <option key={sid} value={sid} style={{ background: '#0a0f1e' }}>{name} ({sid})</option>
                          })}
                        </select>
                      </div>
                      <div>
                        <label style={S.label}>Subject / Event Name</label>
                        <input value={singleSubject} onChange={e => setSingleSubject(e.target.value)} placeholder="e.g. English Speaking" style={{ ...S.input, textAlign: 'left', padding: '10px 14px' }} />
                      </div>
                      <div>
                        <label style={S.label}>Score</label>
                        <input type="number" value={singleScore} onChange={e => setSingleScore(e.target.value)} placeholder="0" style={{ ...S.input, textAlign: 'left', padding: '10px 14px' }} />
                      </div>
                      <div>
                        <label style={S.label}>Max Score</label>
                        <input type="number" value={singleMaxScore} onChange={e => setSingleMaxScore(e.target.value)} placeholder="100" style={{ ...S.input, textAlign: 'left', padding: '10px 14px' }} />
                      </div>
                    </div>
                    <button onClick={handleSubmitSingle} disabled={saving} style={{ marginTop: '12px', background: '#34d399', color: '#0a0f1e', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '13px', fontWeight: 900, width: '100%', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.5 : 1 }}>
                      {saving ? 'Saving...' : '➕ Add Single Entry'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── RESULTS ── */}
              {tab === 'results' && (
                <div style={{ marginTop: '8px' }}>
                  {filterBar}
                  <button onClick={fetchResults} style={{ ...S.card, width: '100%', border: 'none', cursor: 'pointer', color: '#fbbf24', fontWeight: 900, fontSize: '12px', marginBottom: '12px', padding: '10px' }}>🔍 Load Results</button>
                  {resultsLoading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}><div style={{ width: '28px', height: '28px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #fbbf24', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>
                    : rankList.map((stu, i) => {
                      const totalPct = stu.totalMax > 0 ? Math.round((stu.totalScore / stu.totalMax) * 100) : 0;
                      const overallGrade = pctToGrade(totalPct, config);
                      const allDistinction = Object.entries(stu.subjects || {}).every(([sub, v]) => getDistinction(sub, v.pct));
                      return (<div key={stu.Student_ID || i} style={{ ...S.card, marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 900, fontSize: '13px', color: '#fff' }}>{stu.Name}</span>
                            {stu.Section && <span style={{ fontSize: '8px', padding: '1px 8px', borderRadius: '99px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>{stu.Section}</span>}
                            {allDistinction && <span style={{ fontSize: '8px', padding: '1px 8px', borderRadius: '99px', background: 'rgba(251,191,36,0.2)', color: '#fbbf24', fontWeight: 900 }}>🏆 All Distinction</span>}
                          </div><p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>{stu.Student_ID}</p></div>
                          <div style={{ textAlign: 'right' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{stu.rank && <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>Rank {stu.rank}</span>}<span style={{ fontWeight: 900, fontSize: '22px', color: GRADE_COLOR[overallGrade] || '#fff' }}>{overallGrade}</span></div><p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{totalPct}% · {stu.totalScore}/{stu.totalMax}</p></div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: '5px' }}>
                          {Object.entries(stu.subjects || {}).map(([sub, v]) => {
                            const isDist = getDistinction(sub, v.pct);
                            return (<div key={sub} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${v.result === 'Fail' ? 'rgba(239,68,68,0.2)' : isDist ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '8px', padding: '6px 8px', textAlign: 'center' }}>
                              <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.35)', margin: '0 0 2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{sub}</p>
                              <p style={{ fontWeight: 900, fontSize: '14px', color: GRADE_COLOR[v.grade] || '#fff', margin: 0 }}>{v.grade} {isDist && '⭐'}</p>
                              <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{v.score}/{v.max}</p>
                            </div>);
                          })}
                        </div>
                      </div>);
                    })}
                </div>
              )}

              {/* ── RANKING ── */}
              {tab === 'ranking' && (
                <div style={{ marginTop: '8px' }}>
                  {filterBar}
                  <button onClick={fetchResults} style={{ ...S.card, width: '100%', border: 'none', cursor: 'pointer', color: '#fbbf24', fontWeight: 900, fontSize: '12px', marginBottom: '12px', padding: '10px' }}>🔍 Load Ranking</button>
                  {resultsLoading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}><div style={{ width: '28px', height: '28px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #fbbf24', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>
                    : rankList.length === 0 ? <div style={{ textAlign: 'center', padding: '50px 0', color: 'rgba(255,255,255,0.2)' }}>Data မရှိသေးပါ</div>
                      : <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>{rankList.map((stu, i) => {
                        const totalPct = stu.totalMax > 0 ? Math.round((stu.totalScore / stu.totalMax) * 100) : 0;
                        const lg = pctToGrade(totalPct, config);
                        const failCount = Object.values(stu.subjects || {}).filter(v => v.result === 'Fail').length;
                        const isTop3 = (stu.rank || 999) <= 3;
                        const allDist = Object.entries(stu.subjects || {}).every(([sub, v]) => getDistinction(sub, v.pct));
                        return (<div key={stu.Student_ID || i} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: isTop3 ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.03)', border: isTop3 ? '1px solid rgba(251,191,36,0.15)' : '1px solid rgba(255,255,255,0.07)' }}>
                          <div style={{ flexShrink: 0, width: '36px', textAlign: 'center' }}>{stu.rank <= 3 ? <span style={{ fontSize: '22px' }}>{RANK_ICONS[(stu.rank || 1) - 1]}</span> : <span style={{ fontWeight: 900, fontSize: '16px', color: 'rgba(255,255,255,0.3)' }}>{stu.rank}</span>}</div>
                          <div style={{ flex: 1, minWidth: 0 }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ fontWeight: 900, fontSize: '13px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stu.Name}</span>{stu.Section && <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{stu.Section}</span>}{allDist && <span style={{ fontSize: '8px', color: '#fbbf24' }}>⭐</span>}</div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}><span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>Total: {stu.totalScore}/{stu.totalMax}</span>{failCount > 0 && <span style={{ fontSize: '9px', color: '#f87171', fontWeight: 900 }}>{failCount} Fail</span>}</div></div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}><span style={{ fontWeight: 900, fontSize: '20px', color: GRADE_COLOR[lg] || '#fff' }}>{lg}</span><p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{totalPct}%</p></div>
                        </div>);
                      })}</div>}
                </div>
              )}

              {/* ── EDIT ── */}
              {tab === 'edit' && canEdit && (
                <div style={{ marginTop: '8px' }}>
                  {filterBar}
                  <button onClick={fetchResults} style={{ ...S.card, width: '100%', border: 'none', cursor: 'pointer', color: '#fbbf24', fontWeight: 900, fontSize: '12px', marginBottom: '12px', padding: '10px' }}>🔍 Load Records</button>
                  {editRow && (<div style={{ ...S.card, border: '1px solid rgba(251,191,36,0.3)', marginBottom: '12px' }}><p style={{ fontWeight: 900, fontSize: '13px', color: '#fbbf24', margin: '0 0 12px' }}>✏️ {editRow.Name} — {editRow.Subject}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}><div><label style={S.label}>Score</label><input type="number" value={editRow.Score} onChange={e => setEditRow(p => ({ ...p, Score: e.target.value }))} style={{ ...S.input, textAlign: 'left', padding: '10px 14px' }} /></div><div><label style={S.label}>Max Score</label><input type="number" value={editRow.Max_Score} onChange={e => setEditRow(p => ({ ...p, Max_Score: e.target.value }))} style={{ ...S.input, textAlign: 'left', padding: '10px 14px' }} /></div></div>
                    <div style={{ marginBottom: '10px' }}><label style={S.label}>Remark</label><input value={editRow.Remark || ''} onChange={e => setEditRow(p => ({ ...p, Remark: e.target.value }))} style={{ ...S.input, textAlign: 'left', padding: '10px 14px' }} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}><button onClick={() => setEditRow(null)} style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: '12px', padding: '10px', fontWeight: 900, cursor: 'pointer' }}>Cancel</button><button onClick={handleUpdateEdit} disabled={saving} style={{ background: '#fbbf24', color: '#0a0f1e', border: 'none', borderRadius: '12px', padding: '10px', fontWeight: 900, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.5 : 1 }}>{saving ? 'Saving...' : '💾 Update'}</button></div></div>)}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>{rankList.flatMap(stu => Object.entries(stu.subjects || {}).map(([sub, v]) => ({ ...v, Student_ID: stu.Student_ID, Name: stu.Name, Section: stu.Section, Subject: sub }))).map((row, i) => <button key={i} onClick={() => setEditRow({ ...row, Remark: '' })} style={{ ...S.card, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textAlign: 'left', border: `1px solid ${row.result === 'Fail' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}` }}><div><p style={{ fontWeight: 900, fontSize: '12px', color: '#fff', margin: 0 }}>{row.Name}</p><p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>{row.Subject}</p></div><div style={{ textAlign: 'right' }}><span style={{ fontWeight: 900, fontSize: '16px', color: GRADE_COLOR[row.grade] || '#fff' }}>{row.grade}</span><p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{row.score}/{row.max} · {row.pct}%</p></div></button>)}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}