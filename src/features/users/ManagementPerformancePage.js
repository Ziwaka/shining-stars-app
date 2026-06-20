"use client";
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

/* ==================== HELPER FUNCTIONS ==================== */
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

// Month order for display
const MONTH_ORDER = ['MAY', 'JUL', 'OCT', 'DEC', 'FEB'];

/* ==================== STYLE CONSTANTS ==================== */
const S = {
  page: { display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden', background:'#0f0a1e', color:'#fff', fontFamily:'system-ui,sans-serif' },
  header: { zIndex:40, background:'rgba(15,10,30,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  card:   { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', padding:'16px' },
  select: { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', padding:'9px 14px', color:'#fff', fontSize:'12px', outline:'none' },
  tabOn:  { background:'#fbbf24', color:'#0f172a', border:'none', borderRadius:'10px', padding:'7px 18px', fontSize:'10px', fontWeight:900, textTransform:'uppercase', cursor:'pointer' },
  tabOff: { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)', border:'none', borderRadius:'10px', padding:'7px 18px', fontSize:'10px', fontWeight:900, textTransform:'uppercase', cursor:'pointer' },
  input:  { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', padding:'9px 14px', color:'#fff', fontSize:'12px', outline:'none', flex:1 },
};

const pctColor = (p) => p >= 80 ? '#34d399' : p >= 60 ? '#60a5fa' : p >= 40 ? '#fbbf24' : '#f87171';
const safeNum = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const RANK_ICON = ['🥇','🥈','🥉'];

/* ==================== COMPONENT ==================== */
export default function MgtPerformanceHub() {
  const router = useRouter();
  const [data, setData]               = useState({ students:[], points:[], rankings:{}, grades:[], subjects:[], scoresData:[], totalActiveByGradeStream:{} });
  const [loading, setLoading]         = useState(true);
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [tab, setTab]                 = useState('rankings');

  const [searchName, setSearchName] = useState('');
  const [perfFilter, setPerfFilter] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedCompareIds, setSelectedCompareIds] = useState([]);
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  // ── UPDATED AUTH CHECK: Allow staff with permission ──
  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    
    // Management user ကို ဒီအတိုင်း ဝင်ခွင့်ပြုသည်။
    if (u.userRole === 'management') {
      loadData();
      return;
    }
    
    // Staff user ဖြစ်ပါက Can_View_Performance_Hub permission ရှိမှသာ ဝင်ခွင့်ပြုသည်။
    if (u.userRole === 'staff') {
      const hasPerm = u['Can_View_Performance_Hub'] === true || u['Can_View_Performance_Hub'] === 'TRUE';
      if (hasPerm) {
        loadData();
        return;
      }
    }
    
    // အထက်ပါအခြေအနေများနှင့် မကိုက်ညီပါက login သို့ ပြန်ညွှန်သည်။
    router.push('/login');
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [initRes, scoreRes, ptRes] = await Promise.all([
        fetch(WEB_APP_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify({ action:'getInitialData' }) }),
        fetch(WEB_APP_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify({ action:'getData', sheetName:'Exam_Records' }) }),
        fetch(WEB_APP_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify({ action:'getData', sheetName:'House_Points' }) }),
      ]);
      const init  = await initRes.json();
      const score = await scoreRes.json();
      const pt    = await ptRes.json();

      const students = init.students || [];
      const scoresData = score.data || [];
      const points   = (pt.data || []).reverse();

      const grades = [...new Set(students.map(s => s.Grade).filter(Boolean))].sort();
      const subjects = [...new Set(scoresData.map(sc => sc.Subject || sc.Subject_Name).filter(Boolean))].sort();

      // Build rankings per grade
      const rankings = {};
      grades.forEach(g => {
        const gradeScores = scoresData.filter(sc => String(sc.Grade) === String(g));
        const totals = {};
        gradeScores.forEach(sc => {
          const id = sc.Student_ID;
          if (!totals[id]) totals[id] = { id, name:sc.Name, total:0, count:0, subs:{} };
          totals[id].total += safeNum(sc['Percentage (%)'] || sc.Percentage);
          totals[id].count++;
          const subj = sc.Subject || sc.Subject_Name || 'Unknown';
          totals[id].subs[subj] = safeNum(sc['Percentage (%)'] || sc.Percentage);
        });
        const list = Object.values(totals)
          .map(s => ({ ...s, avg: s.count ? Math.round(s.total / s.count) : 0 }))
          .sort((a,b) => b.avg - a.avg);
        rankings[g] = list;
      });

      // Calculate total active per grade+stream
      const totalActiveByGradeStream = {};
      scoresData.forEach(sc => {
        const grade = sc.Grade ? String(sc.Grade).trim() : '';
        const subject = sc.Subject ? String(sc.Subject).trim() : '';
        if (!grade || (subject !== 'Bio' && subject !== 'Eco')) return;
        const key = `${grade}_${subject}`;
        if (!totalActiveByGradeStream[key]) totalActiveByGradeStream[key] = new Set();
        const studentId = sc.Student_ID ? String(sc.Student_ID).trim() : '';
        if (studentId) totalActiveByGradeStream[key].add(studentId);
      });
      const totalActiveCounts = {};
      Object.keys(totalActiveByGradeStream).forEach(key => {
        totalActiveCounts[key] = totalActiveByGradeStream[key].size;
      });

      setData({ students, points, rankings, grades, subjects, scoresData, totalActiveByGradeStream: totalActiveCounts });
    } finally { setLoading(false); }
  };

  const grades = data.grades || [];
  const subjects = data.subjects || [];

  // ── Rankings tab ──
  const currentRankings = useMemo(() => {
    if (selectedGrade === 'All' || !data.rankings[selectedGrade]) return [];
    let list = data.rankings[selectedGrade];
    if (perfFilter === 'Weak') list = list.filter(s => s.avg < 40);
    else if (perfFilter === 'Medium') list = list.filter(s => s.avg >= 40 && s.avg <= 70);
    else if (perfFilter === 'Strong') list = list.filter(s => s.avg > 70);
    if (searchName.trim()) {
      const q = searchName.trim().toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q));
    }
    return list;
  }, [selectedGrade, data.rankings, perfFilter, searchName]);

  const analytics = useMemo(() => {
    if (selectedGrade === 'All' || !data.rankings[selectedGrade]) return null;
    const list = data.rankings[selectedGrade];
    if (list.length === 0) return null;
    const totalAvg = Math.round(list.reduce((sum,s) => sum + s.avg, 0) / list.length);
    const highest = list[0];
    const lowest = list[list.length-1];
    const weakCount = list.filter(s => s.avg < 40).length;
    const strongCount = list.filter(s => s.avg > 70).length;
    return { totalAvg, highest, lowest, weakCount, strongCount, totalStudents: list.length };
  }, [selectedGrade, data.rankings]);

  // ── By Subject tab ──
  const subjectRankings = useMemo(() => {
    if (selectedGrade === 'All' || !selectedSubject || !data.rankings[selectedGrade]) return [];
    const list = data.rankings[selectedGrade];
    return list
      .filter(s => selectedSubject in s.subs)
      .map(s => ({ id: s.id, name: s.name, score: s.subs[selectedSubject] }))
      .sort((a,b) => b.score - a.score);
  }, [selectedGrade, selectedSubject, data.rankings]);

  // ── Compare tab: multi‑month data ──
  const availableMonths = useMemo(() => {
    if (selectedGrade === 'All' || !data.scoresData.length) return [];
    const months = new Set();
    data.scoresData
      .filter(sc => String(sc.Grade) === selectedGrade)
      .forEach(sc => {
        const m = getMonthKey(sc.Exam_Name || sc.Term);
        if (m) months.add(m);
      });
    return MONTH_ORDER.filter(m => months.has(m));
  }, [selectedGrade, data.scoresData]);

  const compareData = useMemo(() => {
    if (selectedGrade === 'All' || availableMonths.length === 0 || !data.scoresData.length) return {};
    const gradeScores = data.scoresData.filter(sc => String(sc.Grade) === selectedGrade);
    const result = {};

    gradeScores.forEach(sc => {
      const monthKey = getMonthKey(sc.Exam_Name || sc.Term);
      if (!monthKey || !availableMonths.includes(monthKey)) return;
      const studentId = sc.Student_ID?.toString().trim();
      if (!studentId) return;
      const subject = sc.Subject?.trim();
      const score = Number(sc.Score);
      if (isNaN(score)) return;

      if (!result[studentId]) {
        result[studentId] = { name: sc.Name, months: {} };
      }
      if (!result[studentId].months[monthKey]) {
        result[studentId].months[monthKey] = { subs: {}, total: 0 };
      }
      let mappedSubject = subject;
      if (subject === 'Bio' || subject === 'Eco') mappedSubject = 'Bio/Eco';
      else if (subject === 'Social') mappedSubject = 'SS';
      result[studentId].months[monthKey].subs[mappedSubject] = score;
      result[studentId].months[monthKey].total += score;
    });

    availableMonths.forEach(month => {
      const entries = Object.entries(result)
        .map(([id, stu]) => ({
          id,
          total: stu.months[month]?.total || 0
        }))
        .filter(e => e.total > 0)
        .sort((a, b) => b.total - a.total);

      entries.forEach((entry, idx) => {
        if (result[entry.id].months[month]) {
          result[entry.id].months[month].rank = idx + 1;
        }
      });
    });

    return result;
  }, [selectedGrade, availableMonths, data.scoresData]);

  const latestMonth = availableMonths.length > 0 ? availableMonths[availableMonths.length - 1] : null;

  useEffect(() => {
    if (tab === 'compare' && latestMonth && Object.keys(compareData).length > 0) {
      const studentIds = Object.keys(compareData);
      const top10Ids = studentIds
        .map(id => ({ id, total: compareData[id].months[latestMonth]?.total || 0 }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)
        .map(x => x.id);
      setSelectedCompareIds(top10Ids);
    }
  }, [tab, latestMonth, compareData]);

  const getEnrollment = (student) => (student['Enrollment No.'] || student['Enrollment Number'] || student['Enrollment no.'] || '').toString().trim();

  const filteredPoints = useMemo(() => data.points.filter(p => {
    const pts = safeNum(p.Points ?? p.points ?? p.Point ?? p.Score);
    if (pts === 0) return false;
    if (selectedGrade === 'All') return true;
    const s = data.students.find(st => getEnrollment(st) === p.Student_ID?.toString());
    return s?.Grade?.toString() === selectedGrade;
  }), [data.points, selectedGrade, data.students]);

  const toggleExpand = (id) => {
    setExpandedStudentId(prev => prev === id ? null : id);
  };

  const StudentExamDetail = ({ studentId, grade }) => {
    if (!studentId || !grade) return null;
    const studentScores = data.scoresData.filter(sc => {
      const id = sc.Student_ID ? String(sc.Student_ID).trim() : '';
      return id === studentId;
    });

    const subjectsList = ['Myan', 'Eng', 'Maths', 'Chem', 'Phys', 'Bio/Eco', 'SS'];
    const monthOrder = MONTH_ORDER;
    const subjectScores = {};
    const monthRank = {};
    subjectsList.forEach(sub => {
      subjectScores[sub] = {};
      monthOrder.forEach(m => { subjectScores[sub][m] = null; });
    });
    monthOrder.forEach(m => { monthRank[m] = null; });

    studentScores.forEach(sc => {
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
        matchedSubject = subjectsList.find(s => s === subject);
      }
      if (matchedSubject && subjectScores[matchedSubject]) {
        const score = Number(sc.Score);
        if (!isNaN(score)) {
          subjectScores[matchedSubject][monthKey] = score;
        }
      }
    });

    const student = data.students.find(st => getEnrollment(st) === studentId);
    const studentStream = student ? (student.Stream || (() => {
      const bioScore = studentScores.find(s => s.Subject === 'Bio');
      if (bioScore) return 'Bio';
      const ecoScore = studentScores.find(s => s.Subject === 'Eco');
      if (ecoScore) return 'Eco';
      return 'General';
    })()) : 'General';
    const gradeStreamKey = `${grade}_${studentStream}`;
    const totalActive = data.totalActiveByGradeStream[gradeStreamKey] || 0;

    const hasAnyScore = monthOrder.some(m => subjectsList.some(sub => subjectScores[sub][m] !== null));
    if (!hasAnyScore) return <div className="text-slate-500 italic p-4">No exam records found for this student.</div>;

    return (
      <div style={{ overflowX:'auto', marginTop:'12px' }}>
        <table style={{ width:'100%', fontSize:'12px', borderCollapse:'collapse', color:'#fff' }}>
          <thead>
            <tr style={{ background:'rgba(255,255,255,0.05)' }}>
              <th style={{ padding:'6px 8px', textAlign:'left', fontWeight:900 }}>Subject</th>
              {monthOrder.map(m => (
                <th key={m} style={{ padding:'6px 8px', textAlign:'center', fontWeight:900 }}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subjectsList.map(sub => (
              <tr key={sub} style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <td style={{ padding:'6px 8px', fontWeight:700 }}>{sub}</td>
                {monthOrder.map(m => {
                  const score = subjectScores[sub][m];
                  if (score === null) return <td key={m} style={{ padding:'6px 8px', textAlign:'center', color:'rgba(255,255,255,0.3)' }}>—</td>;
                  const dist = isDistinction(sub === 'Bio/Eco' ? 'Bio' : sub === 'SS' ? 'Social' : sub, score);
                  const fail = isFail(score);
                  return (
                    <td key={m} style={{ padding:'6px 8px', textAlign:'center', fontWeight:900, color: fail ? '#f87171' : dist ? '#fbbf24' : '#e2e8f0' }}>
                      {score}
                      {dist && <span style={{ color:'#fbbf24', marginLeft:'2px' }}>⭐</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Total row */}
            <tr style={{ borderTop:'2px solid rgba(255,255,255,0.1)' }}>
              <td style={{ padding:'6px 8px', fontWeight:900, color:'#60a5fa' }}>Total</td>
              {monthOrder.map(m => {
                const total = subjectsList.reduce((sum, sub) => {
                  const v = subjectScores[sub][m];
                  return v !== null ? sum + v : sum;
                }, 0);
                const hasScore = subjectsList.some(sub => subjectScores[sub][m] !== null);
                return (
                  <td key={m} style={{ padding:'6px 8px', textAlign:'center', fontWeight:900, color: hasScore ? '#60a5fa' : 'rgba(255,255,255,0.3)' }}>
                    {hasScore ? total : '—'}
                  </td>
                );
              })}
            </tr>
            {/* Rank row */}
            <tr style={{ borderTop:'1px solid rgba(251,191,36,0.3)' }}>
              <td style={{ padding:'6px 8px', fontWeight:900, color:'#fbbf24' }}>🏆 Rank</td>
              {monthOrder.map(m => {
                const hasScore = subjectsList.some(sub => subjectScores[sub][m] !== null);
                if (!hasScore) return <td key={m} style={{ padding:'6px 8px', textAlign:'center', color:'rgba(255,255,255,0.3)' }}>—</td>;
                const rank = monthRank[m];
                if (rank && String(rank).includes('/')) {
                  return <td key={m} style={{ padding:'6px 8px', textAlign:'center', fontWeight:900, color:'#fbbf24' }}>{rank}</td>;
                }
                const displayRank = (rank && rank !== '—') ? `${rank} / ${totalActive}` : `— / ${totalActive}`;
                return <td key={m} style={{ padding:'6px 8px', textAlign:'center', fontWeight:900, color:'#fbbf24' }}>{displayRank}</td>;
              })}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>

      {/* header */}
      <div style={S.header}>
        <button onClick={() => router.back()} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'14px' }}>← Back</button>
        <div style={{ textAlign:'center' }}>
          <p style={{ fontWeight:900, fontSize:'13px', textTransform:'uppercase', letterSpacing:'0.1em', margin:0 }}>Performance Hub</p>
          <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)', margin:0, textTransform:'uppercase', letterSpacing:'0.1em' }}>Analytics & Rankings</p>
        </div>
        <button onClick={loadData} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'18px' }}>↻</button>
      </div>

      {/* tabs */}
      <div style={{ padding:'12px 16px', display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
        <button onClick={() => setTab('rankings')} style={tab==='rankings'?S.tabOn:S.tabOff}>🏆 Rankings</button>
        <button onClick={() => setTab('bysubject')} style={tab==='bysubject'?S.tabOn:S.tabOff}>📘 By Subject</button>
        <button onClick={() => setTab('compare')}   style={tab==='compare'?S.tabOn:S.tabOff}>⚖️ Compare</button>
        <button onClick={() => setTab('points')}    style={tab==='points'?S.tabOn:S.tabOff}>⭐ House Points</button>
      </div>

      {/* main scrollable */}
      <div style={{flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', paddingBottom:'80px'}}>
      
      {/* Global filter row */}
      <div style={{ padding:'0 16px 12px', display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
        <select value={selectedGrade} onChange={e => { setSelectedGrade(e.target.value); setExpandedStudentId(null); setSelectedCompareIds([]); setSelectedSubject(''); }} style={S.select}>
          <option value="All" style={{ background:'#1a1030', color:'#fff' }}>All Grades</option>
          {grades.map(g => <option key={g} value={g} style={{ background:'#1a1030', color:'#fff' }}>Grade {g}</option>)}
        </select>
        {tab === 'rankings' && selectedGrade !== 'All' && (
          <>
            <select value={perfFilter} onChange={e => setPerfFilter(e.target.value)} style={S.select}>
              <option value="All" style={{ background:'#1a1030', color:'#fff' }}>All Students</option>
              <option value="Weak" style={{ background:'#1a1030', color:'#fff' }}>Weak (&lt;40%)</option>
              <option value="Medium" style={{ background:'#1a1030', color:'#fff' }}>Medium (40-70%)</option>
              <option value="Strong" style={{ background:'#1a1030', color:'#fff' }}>Strong (&gt;70%)</option>
            </select>
            <input type="text" placeholder="Search name..." value={searchName} onChange={e => setSearchName(e.target.value)} style={S.input} />
          </>
        )}
        {tab === 'bysubject' && selectedGrade !== 'All' && (
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} style={S.select}>
            <option value="" style={{ background:'#1a1030', color:'#fff' }}>-- Select Subject --</option>
            {subjects.map(sub => <option key={sub} value={sub} style={{ background:'#1a1030', color:'#fff' }}>{sub}</option>)}
          </select>
        )}
      </div>

      <div style={{ padding:'0 16px' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
            <div style={{ width:'32px', height:'32px', border:'3px solid rgba(255,255,255,0.1)', borderTop:'3px solid #fbbf24', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
          </div>
        ) : (
          <>
            {/* ==================== RANKINGS TAB ==================== */}
            {tab === 'rankings' && (
              <div>
                {analytics && (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(100px,1fr))', gap:'8px', marginBottom:'12px' }}>
                    <div style={{...S.card, padding:'10px', textAlign:'center'}}>
                      <div style={{fontSize:'10px', color:'rgba(255,255,255,0.4)'}}>Class Avg</div>
                      <div style={{fontWeight:900, fontSize:'20px', color:'#60a5fa'}}>{analytics.totalAvg}%</div>
                    </div>
                    <div style={{...S.card, padding:'10px', textAlign:'center'}}>
                      <div style={{fontSize:'10px', color:'rgba(255,255,255,0.4)'}}>Highest</div>
                      <div style={{fontWeight:900, fontSize:'20px', color:'#34d399'}}>{analytics.highest.avg}%</div>
                      <div style={{fontSize:'9px', color:'rgba(255,255,255,0.3)'}}>{analytics.highest.name}</div>
                    </div>
                    <div style={{...S.card, padding:'10px', textAlign:'center'}}>
                      <div style={{fontSize:'10px', color:'rgba(255,255,255,0.4)'}}>Weak &lt;40%</div>
                      <div style={{fontWeight:900, fontSize:'20px', color:'#f87171'}}>{analytics.weakCount}</div>
                    </div>
                    <div style={{...S.card, padding:'10px', textAlign:'center'}}>
                      <div style={{fontSize:'10px', color:'rgba(255,255,255,0.4)'}}>Strong &gt;70%</div>
                      <div style={{fontWeight:900, fontSize:'20px', color:'#34d399'}}>{analytics.strongCount}</div>
                    </div>
                  </div>
                )}
                {selectedGrade === 'All' ? (
                  <div style={{ textAlign:'center', padding:'50px 0', color:'rgba(255,255,255,0.2)' }}>Grade တစ်ခု ရွေးပါ</div>
                ) : currentRankings.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'50px 0', color:'rgba(255,255,255,0.2)' }}>No students found</div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {currentRankings.map((s, i) => (
                      <div key={s.id}>
                        <div
                          onClick={() => toggleExpand(s.id)}
                          style={{ ...S.card, display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px',
                            background: expandedStudentId===s.id ? 'rgba(251,191,36,0.1)' : (i===0 ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.04)'),
                            borderLeft: `4px solid ${expandedStudentId===s.id ? '#fbbf24' : pctColor(s.avg)}`,
                            cursor:'pointer' }}>
                          <div style={{ fontSize:'24px', flexShrink:0, width:'32px', textAlign:'center' }}>
                            {RANK_ICON[i] || <span style={{ fontWeight:900, fontSize:'14px', color:'rgba(255,255,255,0.3)' }}>#{i+1}</span>}
                          </div>
                          <div style={{ flex:1 }}>
                            <p style={{ fontWeight:900, fontSize:'13px', color:'#fff', margin:'0 0 3px' }}>{s.name}</p>
                            <div style={{ height:'4px', background:'rgba(255,255,255,0.06)', borderRadius:'99px', overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${s.avg}%`, background: pctColor(s.avg), borderRadius:'99px' }}/>
                            </div>
                          </div>
                          <div style={{ textAlign:'right', flexShrink:0 }}>
                            <p style={{ fontWeight:900, fontSize:'18px', color: pctColor(s.avg), margin:0 }}>{s.avg}%</p>
                            <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)', margin:0 }}>{s.count} subjects</p>
                          </div>
                        </div>
                        {/* expand: student info + exam detail table */}
                        {expandedStudentId === s.id && (
                          <div style={{ marginTop:'4px', padding:'8px 16px', background:'rgba(255,255,255,0.03)', borderRadius:'12px' }}>
                            {/* Extra info: Boarding/School, Previous School, City */}
                            {(() => {
                              const student = data.students.find(st => getEnrollment(st) === s.id?.toString());
                              if (student) {
                                const boarding   = student['School/Hostel']      || '—';
                                const prevSchool = student['Transferred from']   || '—';
                                const city       = student['မြို့'] || student['Town'] || '—';
                                return (
                                  <div style={{ display:'flex', flexWrap:'wrap', gap:'12px', marginBottom:'10px', fontSize:'11px', color:'rgba(255,255,255,0.6)' }}>
                                    <span>🏠 <b style={{color:'#fff'}}>{boarding}</b></span>
                                    <span>🏫 <b style={{color:'#fff'}}>{prevSchool}</b></span>
                                    <span>📍 <b style={{color:'#fff'}}>{city}</b></span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            {/* Exam detail table */}
                            <StudentExamDetail studentId={s.id} grade={selectedGrade} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ==================== BY SUBJECT TAB ==================== */}
            {tab === 'bysubject' && (
              <div>
                {selectedGrade === 'All' ? (
                  <div style={{ textAlign:'center', padding:'50px 0', color:'rgba(255,255,255,0.2)' }}>Grade တစ်ခု ရွေးပါ</div>
                ) : !selectedSubject ? (
                  <div style={{ textAlign:'center', padding:'50px 0', color:'rgba(255,255,255,0.2)' }}>Subject တစ်ခု ရွေးပါ</div>
                ) : subjectRankings.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'50px 0', color:'rgba(255,255,255,0.2)' }}>No data for {selectedSubject}</div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                    <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:'0 0 8px' }}>Subject: <b style={{color:'#fff'}}>{selectedSubject}</b> — {subjectRankings.length} students</p>
                    {subjectRankings.map((s, i) => (
                      <div key={s.id} style={{...S.card, padding:'10px 16px', display:'flex', alignItems:'center', gap:'10px', background:'rgba(255,255,255,0.03)' }}>
                        <span style={{ width:'24px', textAlign:'center', fontWeight:900, color:'rgba(255,255,255,0.3)' }}>{i+1}</span>
                        <span style={{ flex:1, fontWeight:700 }}>{s.name}</span>
                        <span style={{ fontWeight:900, color: pctColor(s.score), fontSize:'16px' }}>{s.score}%</span>
                        <div style={{ width:'80px', height:'4px', background:'rgba(255,255,255,0.06)', borderRadius:'99px', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${s.score}%`, background: pctColor(s.score), borderRadius:'99px' }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ==================== COMPARE TAB (Multi‑month, Auto all exams) ==================== */}
            {tab === 'compare' && (
              <div>
                {selectedGrade === 'All' ? (
                  <div style={{ textAlign:'center', padding:'50px 0', color:'rgba(255,255,255,0.2)' }}>Grade တစ်ခု ရွေးပါ</div>
                ) : availableMonths.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'50px 0', color:'rgba(255,255,255,0.2)' }}>No exam data for this grade yet</div>
                ) : (
                  <>
                    <div style={{ marginBottom:'12px' }}>
                      <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:'0 0 8px' }}>
                        Comparing across <b style={{color:'#fbbf24'}}>{availableMonths.join(', ')}</b> (auto‑detected, max 10 students)
                      </p>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                        {Object.entries(compareData).map(([id, stu]) => (
                          <label key={id} style={{ display:'flex', alignItems:'center', gap:'4px', background: selectedCompareIds.includes(id) ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)', padding:'4px 10px', borderRadius:'20px', fontSize:'11px', cursor:'pointer' }}>
                            <input
                              type="checkbox"
                              checked={selectedCompareIds.includes(id)}
                              onChange={() => {
                                setSelectedCompareIds(prev =>
                                  prev.includes(id)
                                    ? prev.filter(x => x !== id)
                                    : prev.length < 10 ? [...prev, id] : prev
                                );
                              }}
                              style={{ accentColor:'#fbbf24' }}
                            />
                            {stu.name}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Multi‑month table */}
                    <div style={{ overflowX:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px', color:'#fff' }}>
                        <thead>
                          <tr style={{ borderBottom:'2px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding:'8px 10px', textAlign:'left', color:'rgba(255,255,255,0.5)' }}>Subject</th>
                            {selectedCompareIds.map(id => {
                              const stu = compareData[id];
                              if (!stu) return null;
                              return (
                                <th key={id} colSpan={availableMonths.length} style={{ padding:'8px 10px', textAlign:'center', color:'#fbbf24', borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
                                  {stu.name}
                                </th>
                              );
                            })}
                          </tr>
                          <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding:'4px 10px' }}></th>
                            {selectedCompareIds.map(id => (
                              availableMonths.map(m => (
                                <th key={`${id}-${m}`} style={{ padding:'4px 6px', textAlign:'center', fontSize:'10px', color:'rgba(255,255,255,0.4)' }}>{m}</th>
                              ))
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {['Myan', 'Eng', 'Maths', 'Chem', 'Phys', 'Bio/Eco', 'SS'].map(sub => (
                            <tr key={sub} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding:'8px 10px', fontWeight:500 }}>{sub}</td>
                              {selectedCompareIds.map(id => {
                                const stu = compareData[id];
                                if (!stu) return null;
                                return availableMonths.map(m => {
                                  const monthData = stu.months[m];
                                  const score = monthData?.subs[sub];
                                  if (score === undefined || score === null) {
                                    return <td key={`${id}-${m}`} style={{ padding:'6px 8px', textAlign:'center', color:'rgba(255,255,255,0.3)' }}>—</td>;
                                  }
                                  const dist = isDistinction(sub === 'Bio/Eco' ? 'Bio' : sub === 'SS' ? 'Social' : sub, score);
                                  const fail = isFail(score);
                                  return (
                                    <td key={`${id}-${m}`} style={{ padding:'6px 8px', textAlign:'center', fontWeight:900, color: fail ? '#f87171' : dist ? '#fbbf24' : '#e2e8f0' }}>
                                      {score}
                                      {dist && <span style={{ color:'#fbbf24', marginLeft:'2px' }}>⭐</span>}
                                    </td>
                                  );
                                });
                              })}
                            </tr>
                          ))}
                          {/* Total row */}
                          <tr style={{ borderTop:'2px solid rgba(255,255,255,0.1)' }}>
                            <td style={{ padding:'8px 10px', fontWeight:900, color:'#60a5fa' }}>Total</td>
                            {selectedCompareIds.map(id => {
                              const stu = compareData[id];
                              if (!stu) return null;
                              return availableMonths.map(m => {
                                const total = stu.months[m]?.total ?? null;
                                return (
                                  <td key={`${id}-${m}`} style={{ padding:'8px 10px', textAlign:'center', fontWeight:900, color: total !== null ? '#60a5fa' : 'rgba(255,255,255,0.3)' }}>
                                    {total !== null ? total : '—'}
                                  </td>
                                );
                              });
                            })}
                          </tr>
                          {/* Rank row */}
                          <tr style={{ borderTop:'1px solid rgba(251,191,36,0.3)' }}>
                            <td style={{ padding:'8px 10px', fontWeight:900, color:'#fbbf24' }}>🏆 Rank</td>
                            {selectedCompareIds.map(id => {
                              const stu = compareData[id];
                              if (!stu) return null;
                              return availableMonths.map(m => {
                                const rank = stu.months[m]?.rank;
                                return (
                                  <td key={`${id}-${m}`} style={{ padding:'8px 10px', textAlign:'center', fontWeight:900, color: rank ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}>
                                    {rank ? rank : '—'}
                                  </td>
                                );
                              });
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ==================== HOUSE POINTS TAB ==================== */}
            {tab === 'points' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {filteredPoints.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'50px 0', color:'rgba(255,255,255,0.2)' }}>House points records မရှိသေးပါ</div>
                ) : filteredPoints.slice(0, 30).map((p, i) => {
                  const pts = safeNum(p.Points ?? p.points ?? p.Point ?? p.Score);
                  const pos = pts >= 0;
                  return (
                    <div key={i} style={{ ...S.card, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center',
                      borderLeft:`4px solid ${pos?'#34d399':'#f87171'}`,
                      background:`rgba(${pos?'52,211,153':'248,113,113'},0.05)` }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px', flexWrap:'wrap' }}>
                          <p style={{ fontWeight:900, fontSize:'12px', color:'#fff', margin:0 }}>{p.Name}</p>
                          <span style={{ fontSize:'8px', padding:'1px 8px', borderRadius:'99px', background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.4)', fontWeight:900 }}>{p.Category}</span>
                          {p.House_Name && <span style={{ fontSize:'8px', color:'rgba(255,255,255,0.3)' }}>{p.House_Name}</span>}
                        </div>
                        {p.Remark && <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.35)', margin:0, fontStyle:'italic' }}>"{p.Remark}"</p>}
                        <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.2)', margin:'3px 0 0' }}>{p.Date} · {p.Recorded_By}</p>
                      </div>
                      <div style={{ flexShrink:0, marginLeft:'12px', textAlign:'right' }}>
                        <span style={{ fontWeight:900, fontSize:'20px', color: pos?'#34d399':'#f87171' }}>
                          {pos?'+':''}{pts}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </div>
  );
}