"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

const S = {
  page:    { minHeight:'100vh', background:'#0f0a1e', color:'#fff', fontFamily:'system-ui,sans-serif', paddingBottom:'80px' },
  header:  { position:'sticky', top:0, zIndex:40, background:'rgba(15,10,30,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  card:    { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', padding:'16px' },
  input:   { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', padding:'10px 14px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' },
  select:  { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', padding:'10px 14px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' },
  label:   { display:'block', fontSize:'9px', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'6px' },
  btn:     { background:'#fbbf24', color:'#0f172a', border:'none', borderRadius:'14px', padding:'13px', fontSize:'13px', fontWeight:900, width:'100%', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.06em' },
  tabOn:   { background:'#fbbf24', color:'#0f172a', border:'none', borderRadius:'10px', padding:'7px 16px', fontSize:'10px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap' },
  tabOff:  { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)', border:'none', borderRadius:'10px', padding:'7px 16px', fontSize:'10px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap' },
};

const pctColor  = (p) => p >= 80 ? '#34d399' : p >= 60 ? '#60a5fa' : p >= 40 ? '#fbbf24' : '#f87171';
const pctLabel  = (p) => p >= 80 ? 'Distinction' : p >= 40 ? 'Pass' : 'Fail';
const GRADES    = ['KG','1','2','3','4','5','6','7','8','9','10','11','12'];

export default function ScoreRecordPage() {
  const router  = useRouter();
  const [user, setUser]           = useState(null);
  const [tab, setTab]             = useState('record');
  const [subjects, setSubjects]   = useState([]);
  const [terms, setTerms]         = useState([]);
  const [defYear, setDefYear]     = useState('');
  const [students, setStudents]   = useState([]);
  const [scores, setScores]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState(null);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState({ year:'', term:'', grade:'' });

  const [form, setForm] = useState({
    Student_ID:'', Name:'', Grade:'', Academic_Year:'', Term:'',
    Subject:'', Score:'', Max_Score:'100', Remark:''
  });

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    setUser(u);
    fetchAll(u);
  }, []);

  const fetchAll = async (u) => {
    setLoading(true);
    try {
      const [cfgRes, stuRes] = await Promise.all([
        fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getScoreConfig' }) }),
        fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getData', sheetName:'Student_Directory' }) }),
      ]);
      const cfg = await cfgRes.json();
      const stu = await stuRes.json();
      if (cfg.success) {
        setSubjects(cfg.subjects || []);
        setTerms(cfg.terms || []);
        setDefYear(cfg.academicYear || '');
        setForm(f => ({ ...f, Academic_Year: cfg.academicYear || '', Term: cfg.terms?.[0] || '' }));
        setFilter(f => ({ ...f, year: cfg.academicYear || '' }));
      }
      if (stu.success) setStudents(stu.data || []);
    } catch {}
    setLoading(false);
  };

  const fetchScores = async () => {
    try {
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({
        action:'getScores', ...filter
      })});
      const r = await res.json();
      if (r.success) setScores(r.data || []);
    } catch {}
  };

  useEffect(() => { if (tab === 'history') fetchScores(); }, [tab, filter]);

  const showMsg = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg(null),3500); };

  const selectStudent = (stu) => {
    setForm(f => ({
      ...f,
      Student_ID: stu['Enrollment No.'] || stu.Student_ID || '',
      Name: stu['Name (ALL CAPITAL)'] || stu['အမည်'] || '',
      Grade: String(stu.Grade || ''),
    }));
    setSearch('');
  };

  const pct = form.Score && form.Max_Score
    ? Math.round((Number(form.Score) / Number(form.Max_Score)) * 100) : null;

  const handleSave = async () => {
    if (!form.Student_ID) return showMsg('Student ရွေးပါ', 'error');
    if (!form.Subject)    return showMsg('Subject ရွေးပါ', 'error');
    if (!form.Score)      return showMsg('Score ထည့်ပါ', 'error');
    if (!form.Term)       return showMsg('Term ရွေးပါ', 'error');
    setSaving(true);
    try {
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({
        action:'recordScore', ...form,
        Recorded_By: user?.Name || user?.name || user?.username,
      })});
      const r = await res.json();
      if (r.success) {
        showMsg(r.message);
        setForm(f => ({ ...f, Student_ID:'', Name:'', Grade:'', Score:'', Remark:'' }));
      } else showMsg(r.message || 'Error', 'error');
    } catch { showMsg('Network error', 'error'); }
    setSaving(false);
  };

  const filteredStudents = search.length >= 2
    ? students.filter(s => {
        const n = (s['Name (ALL CAPITAL)'] || s['အမည်'] || '').toLowerCase();
        const id = (s['Enrollment No.'] || '').toLowerCase();
        return n.includes(search.toLowerCase()) || id.includes(search.toLowerCase());
      }).slice(0, 8)
    : [];

  // Group scores by student for history
  const groupedScores = scores.reduce((acc, s) => {
    const k = s.Student_ID;
    if (!acc[k]) acc[k] = { name: s.Name, grade: s.Grade, id: s.Student_ID, items:[] };
    acc[k].items.push(s);
    return acc;
  }, {});

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>

      <div style={S.header}>
        <button onClick={()=>router.back()} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'14px'}}>← Back</button>
        <div style={{textAlign:'center'}}>
          <p style={{fontWeight:900,fontSize:'13px',textTransform:'uppercase',letterSpacing:'0.1em',margin:0}}>Score Records</p>
          <p style={{fontSize:'9px',color:'rgba(255,255,255,0.25)',margin:0,letterSpacing:'0.12em',textTransform:'uppercase'}}>Shining Stars</p>
        </div>
        <button onClick={()=>fetchAll(user)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'18px'}}>↻</button>
      </div>

      {msg && (
        <div style={{position:'fixed',top:'64px',left:'50%',transform:'translateX(-50%)',zIndex:50,padding:'8px 20px',borderRadius:'999px',fontSize:'12px',fontWeight:900,color:'#fff',background:msg.type==='error'?'#ef4444':'#10b981',boxShadow:'0 4px 20px rgba(0,0,0,0.4)',whiteSpace:'nowrap'}}>
          {msg.text}
        </div>
      )}

      <div style={{display:'flex',gap:'6px',padding:'12px 16px 8px',overflowX:'auto'}}>
        <button onClick={()=>setTab('record')} style={tab==='record'?S.tabOn:S.tabOff}>✏️ Record</button>
        <button onClick={()=>setTab('history')} style={tab==='history'?S.tabOn:S.tabOff}>📊 History</button>
      </div>

      <div style={{padding:'0 16px'}}>
        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'60px 0'}}>
            <div style={{width:'32px',height:'32px',border:'3px solid rgba(255,255,255,0.1)',borderTop:'3px solid #fbbf24',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
          </div>
        ) : (
          <>
            {/* ══ RECORD FORM ══ */}
            {tab==='record' && (
              <div style={{display:'flex',flexDirection:'column',gap:'12px',marginTop:'8px'}}>

                {/* Year + Term */}
                <div style={{...S.card,display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                  <div>
                    <label style={S.label}>Academic Year</label>
                    <input value={form.Academic_Year} onChange={e=>setForm(f=>({...f,Academic_Year:e.target.value}))}
                      placeholder="2025-2026" style={S.input}/>
                  </div>
                  <div>
                    <label style={S.label}>Term</label>
                    <select value={form.Term} onChange={e=>setForm(f=>({...f,Term:e.target.value}))} style={S.select}>
                      <option value="" style={{background:'#1a1030'}}>-- Term --</option>
                      {terms.map(t=><option key={t} value={t} style={{background:'#1a1030'}}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Student Search */}
                <div style={S.card}>
                  <label style={S.label}>Student ရွေးပါ</label>
                  {form.Student_ID ? (
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.3)',borderRadius:'12px',padding:'10px 14px'}}>
                      <div>
                        <p style={{fontWeight:900,fontSize:'13px',color:'#fbbf24',margin:0}}>{form.Name}</p>
                        <p style={{fontSize:'9px',color:'rgba(255,255,255,0.4)',margin:'2px 0 0'}}>{form.Student_ID} · Grade {form.Grade}</p>
                      </div>
                      <button onClick={()=>setForm(f=>({...f,Student_ID:'',Name:'',Grade:''}))}
                        style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'16px'}}>✕</button>
                    </div>
                  ) : (
                    <div style={{position:'relative'}}>
                      <input value={search} onChange={e=>setSearch(e.target.value)}
                        placeholder="နာမည် သို့ ID ရိုက်ပါ (2+ လုံး)..." style={S.input}/>
                      {filteredStudents.length > 0 && (
                        <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:20,background:'#1a1030',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'12px',marginTop:'4px',overflow:'hidden'}}>
                          {filteredStudents.map((s,i)=>(
                            <button key={i} onClick={()=>selectStudent(s)}
                              style={{width:'100%',padding:'10px 14px',background:'none',border:'none',color:'#fff',cursor:'pointer',textAlign:'left',borderBottom:i<filteredStudents.length-1?'1px solid rgba(255,255,255,0.05)':'none',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                              <span style={{fontSize:'12px',fontWeight:700}}>{s['Name (ALL CAPITAL)']||s['အမည်']}</span>
                              <span style={{fontSize:'9px',color:'rgba(255,255,255,0.4)'}}>G{s.Grade} · {s['Enrollment No.']}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Subject */}
                <div style={S.card}>
                  <label style={S.label}>Subject (System_Config မှ)</label>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                    {subjects.map(sub=>(
                      <button key={sub} onClick={()=>setForm(f=>({...f,Subject:sub}))}
                        style={{padding:'7px 14px',borderRadius:'99px',border:'none',cursor:'pointer',fontWeight:900,fontSize:'10px',
                          background:form.Subject===sub?'#fbbf24':'rgba(255,255,255,0.06)',
                          color:form.Subject===sub?'#0f172a':'rgba(255,255,255,0.5)'}}>
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Score */}
                <div style={S.card}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
                    <div>
                      <label style={S.label}>Score *</label>
                      <input type="number" min="0" value={form.Score}
                        max={form.Max_Score}
                        onChange={e=>setForm(f=>({...f,Score:e.target.value}))}
                        placeholder="0" style={S.input}/>
                    </div>
                    <div>
                      <label style={S.label}>Max Score</label>
                      <input type="number" min="1" value={form.Max_Score}
                        onChange={e=>setForm(f=>({...f,Max_Score:e.target.value}))}
                        placeholder="100" style={S.input}/>
                    </div>
                  </div>

                  {/* Live preview */}
                  {pct !== null && (
                    <div style={{background:'rgba(255,255,255,0.03)',borderRadius:'12px',padding:'12px',textAlign:'center'}}>
                      <div style={{fontSize:'32px',fontWeight:900,color:pctColor(pct)}}>{pct}%</div>
                      <div style={{height:'6px',background:'rgba(255,255,255,0.06)',borderRadius:'99px',overflow:'hidden',margin:'8px 0'}}>
                        <div style={{height:'100%',width:`${pct}%`,background:pctColor(pct),borderRadius:'99px',transition:'width 0.4s ease'}}/>
                      </div>
                      <span style={{padding:'3px 14px',borderRadius:'99px',fontSize:'10px',fontWeight:900,
                        background: pct>=80?'rgba(52,211,153,0.15)': pct>=40?'rgba(96,165,250,0.15)':'rgba(248,113,113,0.15)',
                        color:pctColor(pct)}}>
                        {pctLabel(pct)}
                      </span>
                    </div>
                  )}

                  <div style={{marginTop:'10px'}}>
                    <label style={S.label}>Remark (optional)</label>
                    <input value={form.Remark} onChange={e=>setForm(f=>({...f,Remark:e.target.value}))}
                      placeholder="Optional note..." style={S.input}/>
                  </div>
                </div>

                <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'12px',padding:'10px 14px'}}>
                  <p style={{fontSize:'10px',color:'rgba(255,255,255,0.3)',margin:0}}>
                    💡 Bulk entry အတွက် Google Sheet Score_Records tab ကို တိုက်ရိုက် ထည့်ပါ — App က single entry အတွက်သာ
                  </p>
                </div>

                <button onClick={handleSave} disabled={saving}
                  style={{...S.btn,opacity:saving?0.5:1,cursor:saving?'default':'pointer'}}>
                  {saving?'Saving...':'✓ Save Score'}
                </button>
              </div>
            )}

            {/* ══ HISTORY ══ */}
            {tab==='history' && (
              <div style={{display:'flex',flexDirection:'column',gap:'10px',marginTop:'8px'}}>
                {/* Filters */}
                <div style={{...S.card,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                  <div>
                    <label style={S.label}>Year</label>
                    <input value={filter.year} onChange={e=>setFilter(f=>({...f,year:e.target.value}))}
                      placeholder="2025-2026" style={S.input}/>
                  </div>
                  <div>
                    <label style={S.label}>Term</label>
                    <select value={filter.term} onChange={e=>setFilter(f=>({...f,term:e.target.value}))} style={S.select}>
                      <option value="" style={{background:'#1a1030'}}>All</option>
                      {terms.map(t=><option key={t} value={t} style={{background:'#1a1030'}}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Grade</label>
                    <select value={filter.grade} onChange={e=>setFilter(f=>({...f,grade:e.target.value}))} style={S.select}>
                      <option value="" style={{background:'#1a1030'}}>All</option>
                      {GRADES.map(g=><option key={g} value={g} style={{background:'#1a1030'}}>G{g}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={fetchScores}
                  style={{...S.btn,padding:'10px',fontSize:'11px'}}>
                  🔍 Filter စစ်မည်
                </button>

                {scores.length === 0 ? (
                  <div style={{textAlign:'center',padding:'50px 0',color:'rgba(255,255,255,0.2)'}}>Record မရှိသေးပါ</div>
                ) : Object.values(groupedScores).map((grp,i)=>(
                  <div key={i} style={S.card}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                      <div>
                        <p style={{fontWeight:900,fontSize:'13px',color:'#fff',margin:0}}>{grp.name}</p>
                        <p style={{fontSize:'9px',color:'rgba(255,255,255,0.3)',margin:'2px 0 0'}}>Grade {grp.grade} · {grp.id}</p>
                      </div>
                      <span style={{fontSize:'9px',color:'rgba(255,255,255,0.25)',fontWeight:900}}>
                        {grp.items.length} subjects
                      </span>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                      {grp.items.map((sc,j)=>{
                        const p = Number(sc['Percentage (%)']||sc.Percentage||0);
                        return (
                          <div key={j} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:'rgba(255,255,255,0.03)',borderRadius:'10px'}}>
                            <div>
                              <span style={{fontSize:'12px',fontWeight:700,color:'rgba(255,255,255,0.8)'}}>{sc.Subject}</span>
                              <span style={{fontSize:'9px',color:'rgba(255,255,255,0.25)',marginLeft:'8px'}}>{sc.Term}</span>
                            </div>
                            <div style={{textAlign:'right'}}>
                              <span style={{fontWeight:900,fontSize:'13px',color:pctColor(p)}}>{sc.Score}/{sc.Max_Score}</span>
                              <span style={{fontSize:'9px',color:pctColor(p),marginLeft:'6px'}}>{p}%</span>
                              {sc.Distinction && <span style={{marginLeft:'4px',fontSize:'9px',color:'#fbbf24'}}>⭐</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Average */}
                    {grp.items.length > 1 && (
                      <div style={{marginTop:'10px',padding:'8px 12px',background:'rgba(251,191,36,0.06)',borderRadius:'10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:'10px',color:'rgba(255,255,255,0.4)',fontWeight:900,textTransform:'uppercase',letterSpacing:'0.08em'}}>Average</span>
                        <span style={{fontWeight:900,fontSize:'14px',color:'#fbbf24'}}>
                          {Math.round(grp.items.reduce((s,r)=>s+Number(r['Percentage (%)']||r.Percentage||0),0)/grp.items.length)}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}