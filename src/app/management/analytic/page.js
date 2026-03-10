"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

// ── Palette ──────────────────────────────────────────────────────
const C = {
  bg:      '#0a0e1a',
  surf:    '#0f1422',
  surf2:   '#141926',
  border:  'rgba(255,255,255,0.07)',
  blue:    '#4f9eff',
  green:   '#3ecf8e',
  amber:   '#f5a623',
  pink:    '#ff6b9d',
  purple:  '#a78bfa',
  cyan:    '#22d3ee',
  red:     '#f87171',
  muted:   'rgba(255,255,255,0.28)',
  text:    'rgba(255,255,255,0.85)',
};

const HOUSE_COLORS = {
  'အနော်ရထာ':    '#ef4444',
  'ကျန်စစ်သား':  '#f59e0b',
  'ဘုရင့်နောင်': '#22c55e',
  'အလောင်းဘုရား':'#dc2626',
  'ဗန္ဓုလ':       '#3b82f6',
};
const houseColor = h => HOUSE_COLORS[h] || C.amber;

// ── Shared mini components ────────────────────────────────────────
const Spinner = () => (
  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 0',gap:'14px'}}>
    <div style={{width:'36px',height:'36px',border:`2px solid ${C.border}`,borderTop:`2px solid ${C.blue}`,borderRadius:'50%',animation:'spin 0.9s linear infinite'}}/>
    <span style={{fontSize:'10px',color:C.muted,letterSpacing:'0.15em',textTransform:'uppercase'}}>Loading data…</span>
  </div>
);

const KpiCard = ({ icon, label, value, color, sub, trend }) => (
  <div style={{background:C.surf,border:`1px solid ${C.border}`,borderRadius:'14px',padding:'16px 14px',display:'flex',flexDirection:'column',gap:'6px',position:'relative',overflow:'hidden'}}>
    <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:`linear-gradient(90deg,${color}88,${color}22)`}}/>
    <div style={{fontSize:'18px'}}>{icon}</div>
    <div style={{fontSize:'26px',fontWeight:900,color,lineHeight:1,fontVariantNumeric:'tabular-nums'}}>{value}</div>
    <div style={{fontSize:'9px',color:C.muted,textTransform:'uppercase',letterSpacing:'0.12em'}}>{label}</div>
    {sub && <div style={{fontSize:'9px',color:'rgba(255,255,255,0.2)',marginTop:'1px'}}>{sub}</div>}
  </div>
);

const HBar = ({ label, value, max, color, pct: forcePct }) => {
  const pct = forcePct !== undefined ? forcePct : (max > 0 ? Math.min(100, Math.round(value/max*100)) : 0);
  return (
    <div style={{marginBottom:'10px'}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',marginBottom:'5px'}}>
        <span style={{color:C.text}}>{label}</span>
        <span style={{fontWeight:900,color}}>{value}{forcePct!==undefined?'%':''}</span>
      </div>
      <div style={{height:'5px',background:'rgba(255,255,255,0.05)',borderRadius:'99px',overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:'99px',transition:'width 1s cubic-bezier(.4,0,.2,1)'}}/>
      </div>
    </div>
  );
};

const SectionHead = ({ title }) => (
  <div style={{display:'flex',alignItems:'center',gap:'10px',margin:'4px 0 12px'}}>
    <div style={{flex:1,height:'1px',background:C.border}}/>
    <span style={{fontSize:'8px',color:C.muted,letterSpacing:'0.2em',textTransform:'uppercase',whiteSpace:'nowrap'}}>{title}</span>
    <div style={{flex:1,height:'1px',background:C.border}}/>
  </div>
);

const Card = ({ children, style={} }) => (
  <div style={{background:C.surf,border:`1px solid ${C.border}`,borderRadius:'14px',padding:'16px',...style}}>
    {children}
  </div>
);

const CardTitle = ({ children }) => (
  <p style={{fontSize:'9px',color:C.muted,textTransform:'uppercase',letterSpacing:'0.14em',fontWeight:900,marginBottom:'14px',margin:'0 0 14px'}}>{children}</p>
);

// ── Score color by percentage ──
const scoreColor = v => v >= 80 ? C.green : v >= 60 ? C.blue : v >= 40 ? C.amber : C.red;

// ── Main component ────────────────────────────────────────────────
export default function AnalyticsPage() {
  const router   = useRouter();
  const [tab, setTab]         = useState('overview');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.userRole !== 'management') { router.push('/login'); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getAnalytics' }) });
      const r   = await res.json();
      if (r.success) { setData(r); setUpdated(new Date().toLocaleTimeString()); }
    } catch {}
    setLoading(false);
  };

  const TABS = [
    { id:'overview',  label:'📊 Overview'  },
    { id:'students',  label:'🎓 Students'  },
    { id:'academic',  label:'📝 Academic'  },
    { id:'finance',   label:'💰 Finance'   },
    { id:'ops',       label:'⚙️ Ops'       },
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden',background:C.bg,color:C.text,fontFamily:'system-ui,sans-serif'}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:99px}
      `}</style>

      {/* Header */}
      <div style={{flexShrink:0,zIndex:40,background:'rgba(10,14,26,0.97)',backdropFilter:'blur(12px)',borderBottom:`1px solid ${C.border}`,padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <button onClick={()=>router.back()} style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:'14px'}}>← Back</button>
        <div style={{textAlign:'center'}}>
          <p style={{fontWeight:900,fontSize:'13px',textTransform:'uppercase',letterSpacing:'0.1em',margin:0}}>School Analytics</p>
          {updated && <p style={{fontSize:'8px',color:'rgba(255,255,255,0.2)',margin:0}}>↻ {updated}</p>}
        </div>
        <button onClick={fetchData} style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:'18px'}}>↻</button>
      </div>

      {/* Tabs */}
      <div style={{flexShrink:0,display:'flex',gap:'6px',padding:'10px 16px 6px',overflowX:'auto',background:C.bg,borderBottom:`1px solid ${C.border}`}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={tab===t.id
              ? {background:C.blue,color:'#fff',border:'none',borderRadius:'10px',padding:'6px 14px',fontSize:'10px',fontWeight:900,cursor:'pointer',whiteSpace:'nowrap'}
              : {background:'rgba(255,255,255,0.05)',color:C.muted,border:`1px solid ${C.border}`,borderRadius:'10px',padding:'6px 14px',fontSize:'10px',fontWeight:900,cursor:'pointer',whiteSpace:'nowrap'}
            }>{t.label}</button>
        ))}
      </div>

      {/* Body */}
      <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',paddingBottom:'80px'}}>
        <div style={{padding:'12px 16px 0',animation:'fadeUp 0.3s ease'}}>
          {loading ? <Spinner/> : !data ? (
            <div style={{textAlign:'center',padding:'80px 0',color:C.muted}}>Data မရရှိနိုင်ပါ</div>
          ) : (
            <>
              {/* ══════════ OVERVIEW ══════════ */}
              {tab==='overview' && (
                <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                  <SectionHead title="Key Metrics"/>

                  {/* KPI row 1 */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                    <KpiCard icon="🎓" label="Total Students"  value={data.students.total}                              color={C.blue}   sub={`${data.students.active} active`}/>
                    <KpiCard icon="👔" label="Total Staff"     value={data.staff.total}                                 color={C.purple} sub={`${data.staff.active} active`}/>
                    <KpiCard icon="💰" label="Revenue (ks)"    value={(data.fees.revenue||0).toLocaleString()}          color={C.green}  sub={`${data.fees.paid} paid records`}/>
                    <KpiCard icon="⏳" label="Leave Pending"   value={data.leaves.pending}                              color={data.leaves.pending>0?C.amber:C.green} sub={`${data.leaves.approved} approved`}/>
                  </div>

                  {/* Gender + Hostel split */}
                  <Card>
                    <CardTitle>Student Breakdown</CardTitle>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'14px'}}>
                      {/* Gender */}
                      <div>
                        <div style={{fontSize:'9px',color:C.muted,marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.1em'}}>Gender</div>
                        <div style={{display:'flex',height:'6px',borderRadius:'99px',overflow:'hidden',marginBottom:'6px'}}>
                          <div style={{width:`${data.students.total?Math.round(data.students.male/data.students.total*100):50}%`,background:C.blue}}/>
                          <div style={{flex:1,background:C.pink}}/>
                        </div>
                        <div style={{display:'flex',gap:'10px',fontSize:'9px'}}>
                          <span style={{color:C.blue}}>♂ {data.students.male}</span>
                          <span style={{color:C.pink}}>♀ {data.students.female}</span>
                        </div>
                      </div>
                      {/* School/Hostel */}
                      <div>
                        <div style={{fontSize:'9px',color:C.muted,marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.1em'}}>Boarding</div>
                        <div style={{display:'flex',height:'6px',borderRadius:'99px',overflow:'hidden',marginBottom:'6px'}}>
                          <div style={{width:`${data.students.total?Math.round(data.students.school/data.students.total*100):50}%`,background:C.cyan}}/>
                          <div style={{flex:1,background:C.purple}}/>
                        </div>
                        <div style={{display:'flex',gap:'10px',fontSize:'9px'}}>
                          <span style={{color:C.cyan}}>🏫 {data.students.school}</span>
                          <span style={{color:C.purple}}>🏠 {data.students.hostel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Grade distribution mini */}
                    {data.students.gradeBreakdown?.length > 0 && (
                      <>
                        <div style={{fontSize:'9px',color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'8px'}}>Grade Distribution</div>
                        <div style={{display:'flex',gap:'4px',alignItems:'flex-end',height:'48px'}}>
                          {data.students.gradeBreakdown.map((g,i)=>{
                            const maxC = Math.max(...data.students.gradeBreakdown.map(x=>x.count));
                            const h = maxC > 0 ? Math.round((g.count/maxC)*44) : 4;
                            return (
                              <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',flex:1,gap:'2px'}}>
                                <div style={{fontSize:'7px',color:C.blue,fontWeight:900}}>{g.count}</div>
                                <div style={{width:'100%',height:`${h}px`,background:`${C.blue}99`,borderRadius:'3px 3px 0 0',minHeight:'4px'}}/>
                                <div style={{fontSize:'6px',color:C.muted,transform:'rotate(-30deg)',whiteSpace:'nowrap'}}>{g.grade}</div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </Card>

                  {/* Academic snapshot */}
                  {data.scores.total > 0 && (
                    <Card>
                      <CardTitle>Academic Snapshot</CardTitle>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'14px'}}>
                        {[
                          {label:'Avg Score', value:data.scores.avg+'%',     color:scoreColor(data.scores.avg)},
                          {label:'Distinctions', value:data.scores.distinctions, color:C.green},
                          {label:'Fails',    value:data.scores.fails,         color:data.scores.fails>0?C.red:C.green},
                        ].map((s,i)=>(
                          <div key={i} style={{background:C.surf2,borderRadius:'10px',padding:'10px',textAlign:'center'}}>
                            <div style={{fontSize:'18px',fontWeight:900,color:s.color}}>{s.value}</div>
                            <div style={{fontSize:'8px',color:C.muted,textTransform:'uppercase',letterSpacing:'0.08em',marginTop:'2px'}}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                      {data.scores.subjectAvg?.slice(0,3).map((s,i)=>(
                        <HBar key={i} label={s.subject} value={s.avg} max={100} color={scoreColor(s.avg)} pct={s.avg}/>
                      ))}
                    </Card>
                  )}

                  {/* House leaderboard */}
                  {data.housePoints?.length > 0 && (
                    <Card>
                      <CardTitle>🏆 House Leaderboard</CardTitle>
                      {data.housePoints.map((h,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 0',borderBottom:i<data.housePoints.length-1?`1px solid ${C.border}`:'none'}}>
                          <span style={{fontSize:'16px',flexShrink:0}}>{['🥇','🥈','🥉','4️⃣','5️⃣'][i]||'⭐'}</span>
                          <div style={{flex:1}}>
                            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                              <span style={{fontWeight:900,fontSize:'12px',color:houseColor(h.house)}}>{h.house}</span>
                              <span style={{fontWeight:900,fontSize:'13px',color:houseColor(h.house)}}>{h.total} pts</span>
                            </div>
                            <div style={{height:'4px',background:'rgba(255,255,255,0.05)',borderRadius:'99px',overflow:'hidden'}}>
                              <div style={{height:'100%',width:`${data.housePoints[0]?.total>0?Math.round(h.total/data.housePoints[0].total*100):0}%`,background:houseColor(h.house),borderRadius:'99px'}}/>
                            </div>
                          </div>
                        </div>
                      ))}
                    </Card>
                  )}

                  {/* Fee snapshot */}
                  <Card>
                    <CardTitle>Finance Snapshot</CardTitle>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',textAlign:'center'}}>
                      {[
                        {label:'Revenue',  value:(data.fees.revenue||0).toLocaleString()+' ks', color:C.green},
                        {label:'Paid',     value:data.fees.paid,   color:C.green},
                        {label:'Pending',  value:data.fees.pending, color:data.fees.pending>0?C.amber:C.green},
                      ].map((f,i)=>(
                        <div key={i} style={{background:C.surf2,borderRadius:'10px',padding:'10px'}}>
                          <div style={{fontSize:'15px',fontWeight:900,color:f.color,lineHeight:1.1}}>{f.value}</div>
                          <div style={{fontSize:'8px',color:C.muted,textTransform:'uppercase',letterSpacing:'0.08em',marginTop:'4px'}}>{f.label}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* ══════════ STUDENTS ══════════ */}
              {tab==='students' && (
                <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                  <SectionHead title="Student Analysis"/>

                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
                    <KpiCard icon="👥" label="Total"   value={data.students.total}   color={C.blue}/>
                    <KpiCard icon="♂"  label="Male"    value={data.students.male}    color={C.cyan}/>
                    <KpiCard icon="♀"  label="Female"  value={data.students.female}  color={C.pink}/>
                  </div>

                  {/* Gender visual */}
                  <Card>
                    <CardTitle>Gender Ratio</CardTitle>
                    <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
                      {/* Ring chart */}
                      <svg width="80" height="80" viewBox="0 0 36 36" style={{flexShrink:0,transform:'rotate(-90deg)'}}>
                        <circle cx="18" cy="18" r="14" fill="none" stroke={C.pink} strokeWidth="4"/>
                        <circle cx="18" cy="18" r="14" fill="none" stroke={C.blue} strokeWidth="4"
                          strokeDasharray={`${data.students.total?data.students.male/data.students.total*88:44} 88`}/>
                      </svg>
                      <div style={{flex:1}}>
                        <HBar label="♂ Male"   value={data.students.male}   max={data.students.total} color={C.blue}/>
                        <HBar label="♀ Female" value={data.students.female} max={data.students.total} color={C.pink}/>
                      </div>
                    </div>
                  </Card>

                  {/* Grade breakdown */}
                  <Card>
                    <CardTitle>Grade Distribution</CardTitle>
                    {(data.students.gradeBreakdown||[]).map((g,i)=>(
                      <HBar key={i} label={g.grade} value={g.count}
                        max={Math.max(...(data.students.gradeBreakdown||[{count:1}]).map(x=>x.count))}
                        color={C.blue}/>
                    ))}
                  </Card>

                  {/* House distribution */}
                  {Object.keys(data.students.houseCounts||{}).length > 0 && (
                    <Card>
                      <CardTitle>House Distribution</CardTitle>
                      {Object.entries(data.students.houseCounts).sort((a,b)=>b[1]-a[1]).map(([h,c],i)=>(
                        <HBar key={i} label={h} value={c}
                          max={Math.max(...Object.values(data.students.houseCounts))}
                          color={houseColor(h)}/>
                      ))}
                    </Card>
                  )}

                  {/* School vs Hostel */}
                  <Card>
                    <CardTitle>Boarding Status</CardTitle>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'14px'}}>
                      {[
                        {icon:'🏫',label:'Day School', value:data.students.school, color:C.cyan},
                        {icon:'🏠',label:'Hostel',     value:data.students.hostel, color:C.purple},
                      ].map((b,i)=>(
                        <div key={i} style={{background:C.surf2,borderRadius:'12px',padding:'14px',textAlign:'center',border:`1px solid ${b.color}22`}}>
                          <div style={{fontSize:'22px',marginBottom:'4px'}}>{b.icon}</div>
                          <div style={{fontSize:'24px',fontWeight:900,color:b.color}}>{b.value}</div>
                          <div style={{fontSize:'8px',color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginTop:'2px'}}>{b.label}</div>
                          <div style={{fontSize:'10px',color:b.color,marginTop:'4px'}}>
                            {data.students.total ? Math.round(b.value/data.students.total*100) : 0}%
                          </div>
                        </div>
                      ))}
                    </div>
                    <HBar label="Day School" value={data.students.school} max={data.students.total} color={C.cyan}/>
                    <HBar label="Hostel"     value={data.students.hostel} max={data.students.total} color={C.purple}/>
                  </Card>
                </div>
              )}

              {/* ══════════ ACADEMIC ══════════ */}
              {tab==='academic' && (
                <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                  <SectionHead title="Academic Performance"/>

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                    <KpiCard icon="📊" label="Avg Score"    value={data.scores.avg+'%'}         color={scoreColor(data.scores.avg)}/>
                    <KpiCard icon="⭐" label="Distinctions" value={data.scores.distinctions}    color={C.green}/>
                    <KpiCard icon="❌" label="Fails"        value={data.scores.fails}           color={data.scores.fails>0?C.red:C.green}/>
                    <KpiCard icon="📋" label="Total Records" value={data.scores.total}          color={C.blue}/>
                  </div>

                  {/* Score distribution visual */}
                  {data.scores.total > 0 && (
                    <Card>
                      <CardTitle>Score Performance Band</CardTitle>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px',marginBottom:'12px'}}>
                        {[
                          {label:'Excellent\n(80%+)', color:C.green,  key:'excellent'},
                          {label:'Good\n(60–79%)', color:C.blue,   key:'good'},
                          {label:'Average\n(40–59%)', color:C.amber,  key:'avg'},
                          {label:'Below\n(<40%)', color:C.red,    key:'low'},
                        ].map((b,i)=>(
                          <div key={i} style={{background:C.surf2,borderRadius:'10px',padding:'10px 6px',textAlign:'center',border:`1px solid ${b.color}22`}}>
                            <div style={{fontSize:'16px',fontWeight:900,color:b.color}}>{data.scores.distinctions && i===0 ? data.scores.distinctions : i===3 ? data.scores.fails : '—'}</div>
                            <div style={{fontSize:'7px',color:C.muted,marginTop:'4px',whiteSpace:'pre-line',lineHeight:1.4}}>{b.label}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{background:`${scoreColor(data.scores.avg)}22`,border:`1px solid ${scoreColor(data.scores.avg)}44`,borderRadius:'10px',padding:'12px',display:'flex',alignItems:'center',gap:'12px'}}>
                        <div style={{fontSize:'32px',fontWeight:900,color:scoreColor(data.scores.avg)}}>{data.scores.avg}%</div>
                        <div>
                          <div style={{fontSize:'10px',color:C.text,fontWeight:700}}>Class Average</div>
                          <div style={{fontSize:'9px',color:C.muted,marginTop:'2px'}}>
                            {data.scores.avg>=80?'Excellent performance!'
                            :data.scores.avg>=60?'Good performance'
                            :data.scores.avg>=40?'Needs improvement'
                            :'Critical — intervention required'}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Subject averages */}
                  {data.scores.subjectAvg?.length > 0 && (
                    <Card>
                      <CardTitle>Subject Average Scores</CardTitle>
                      {data.scores.subjectAvg.map((s,i)=>(
                        <div key={i} style={{marginBottom:'12px'}}>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',marginBottom:'5px'}}>
                            <span style={{color:C.text}}>{s.subject}</span>
                            <span style={{fontWeight:900,color:scoreColor(s.avg)}}>{s.avg}%</span>
                          </div>
                          <div style={{height:'6px',background:'rgba(255,255,255,0.05)',borderRadius:'99px',overflow:'hidden'}}>
                            <div style={{height:'100%',width:`${s.avg}%`,background:scoreColor(s.avg),borderRadius:'99px'}}/>
                          </div>
                        </div>
                      ))}
                    </Card>
                  )}

                  {/* House Points */}
                  {data.housePoints?.length > 0 && (
                    <Card>
                      <CardTitle>🏆 House Points Ranking</CardTitle>
                      {data.housePoints.map((h,i)=>{
                        const col = houseColor(h.house);
                        const pct = data.housePoints[0]?.total > 0 ? Math.round(h.total/data.housePoints[0].total*100) : 0;
                        return (
                          <div key={i} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:i<data.housePoints.length-1?`1px solid ${C.border}`:'none'}}>
                            <span style={{fontSize:'20px',flexShrink:0}}>{['🥇','🥈','🥉','4️⃣','5️⃣'][i]||'⭐'}</span>
                            <div style={{flex:1}}>
                              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'5px'}}>
                                <span style={{fontWeight:900,fontSize:'12px',color:col}}>{h.house}</span>
                                <span style={{fontWeight:900,fontSize:'14px',color:col}}>{h.total} pts</span>
                              </div>
                              <div style={{height:'5px',background:'rgba(255,255,255,0.05)',borderRadius:'99px',overflow:'hidden'}}>
                                <div style={{height:'100%',width:`${pct}%`,background:col,borderRadius:'99px'}}/>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </Card>
                  )}

                  {data.scores.total === 0 && (
                    <div style={{textAlign:'center',padding:'50px 0',color:C.muted}}>Score records မရှိသေးပါ</div>
                  )}
                </div>
              )}

              {/* ══════════ FINANCE ══════════ */}
              {tab==='finance' && (
                <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                  <SectionHead title="Financial Overview"/>

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                    <KpiCard icon="💰" label="Total Revenue"  value={(data.fees.revenue||0).toLocaleString()+' ks'} color={C.green}/>
                    <KpiCard icon="✅" label="Paid Records"   value={data.fees.paid}     color={C.green}/>
                    <KpiCard icon="⏳" label="Pending"        value={data.fees.pending}  color={data.fees.pending>0?C.amber:C.green}/>
                    <KpiCard icon="📊" label="Collection Rate"
                      value={data.fees.paid+data.fees.pending>0?Math.round(data.fees.paid/(data.fees.paid+data.fees.pending)*100)+'%':'—'}
                      color={C.blue}/>
                  </div>

                  {/* Payment status donut */}
                  {(data.fees.paid > 0 || data.fees.pending > 0) && (
                    <Card>
                      <CardTitle>Payment Status</CardTitle>
                      <div style={{display:'flex',alignItems:'center',gap:'20px'}}>
                        {/* Simple donut */}
                        {(() => {
                          const total = data.fees.paid + data.fees.pending;
                          const paidPct = total > 0 ? data.fees.paid/total : 0;
                          const circ = 88;
                          return (
                            <svg width="90" height="90" viewBox="0 0 36 36" style={{flexShrink:0,transform:'rotate(-90deg)'}}>
                              <circle cx="18" cy="18" r="14" fill="none" stroke={C.amber} strokeWidth="4"/>
                              <circle cx="18" cy="18" r="14" fill="none" stroke={C.green} strokeWidth="4"
                                strokeDasharray={`${paidPct*circ} ${circ}`}/>
                              <text x="18" y="20" textAnchor="middle" fill={C.green} fontSize="7" fontWeight="900"
                                transform="rotate(90,18,18)">{Math.round(paidPct*100)}%</text>
                            </svg>
                          );
                        })()}
                        <div style={{flex:1}}>
                          <HBar label="✅ Paid"    value={data.fees.paid}    max={data.fees.paid+data.fees.pending} color={C.green}/>
                          <HBar label="⏳ Pending" value={data.fees.pending} max={data.fees.paid+data.fees.pending} color={C.amber}/>
                        </div>
                      </div>
                    </Card>
                  )}

                  {data.fees.paid===0 && data.fees.pending===0 && (
                    <div style={{textAlign:'center',padding:'50px 0',color:C.muted}}>Fee records မရှိသေးပါ</div>
                  )}
                </div>
              )}

              {/* ══════════ OPS ══════════ */}
              {tab==='ops' && (
                <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                  <SectionHead title="Operations Overview"/>

                  {/* Staff */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                    <KpiCard icon="👔" label="Total Staff"  value={data.staff.total}  color={C.purple}/>
                    <KpiCard icon="✅" label="Active Staff" value={data.staff.active} color={C.green} sub={`${data.staff.total-data.staff.active} inactive`}/>
                  </div>

                  {/* Leave management */}
                  <Card>
                    <CardTitle>Leave Management</CardTitle>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'14px'}}>
                      {[
                        {label:'Pending',  value:data.leaves.pending,  color:C.amber, bg:`${C.amber}15`},
                        {label:'Approved', value:data.leaves.approved, color:C.green, bg:`${C.green}15`},
                        {label:'Rejected', value:data.leaves.rejected, color:C.red,   bg:`${C.red}15`},
                      ].map((l,i)=>(
                        <div key={i} style={{background:l.bg,border:`1px solid ${l.color}30`,borderRadius:'10px',padding:'12px',textAlign:'center'}}>
                          <div style={{fontSize:'22px',fontWeight:900,color:l.color}}>{l.value}</div>
                          <div style={{fontSize:'8px',color:C.muted,textTransform:'uppercase',letterSpacing:'0.08em',marginTop:'3px'}}>{l.label}</div>
                        </div>
                      ))}
                    </div>

                    {data.leaves.recent?.length > 0 && (
                      <>
                        <div style={{fontSize:'9px',color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'8px'}}>Recent Requests</div>
                        {data.leaves.recent.map((l,i)=>(
                          <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<data.leaves.recent.length-1?`1px solid ${C.border}`:'none'}}>
                            <div>
                              <div style={{fontSize:'12px',color:C.text,fontWeight:700}}>{l.Name}</div>
                              <div style={{fontSize:'9px',color:C.muted,marginTop:'1px'}}>{l.Leave_Type}</div>
                            </div>
                            <span style={{fontSize:'9px',fontWeight:900,padding:'3px 10px',borderRadius:'99px',
                              background:l.Status==='Approved'?`${C.green}20`:l.Status==='Rejected'?`${C.red}20`:`${C.amber}20`,
                              color:l.Status==='Approved'?C.green:l.Status==='Rejected'?C.red:C.amber}}>
                              {l.Status}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </Card>

                  {/* Recent student notes */}
                  {data.recentNotes?.length > 0 && (
                    <Card>
                      <CardTitle>Recent Student Notes</CardTitle>
                      {data.recentNotes.map((n,i)=>(
                        <div key={i} style={{padding:'8px 0',borderBottom:i<data.recentNotes.length-1?`1px solid ${C.border}`:'none'}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}>
                            <span style={{fontSize:'12px',fontWeight:700,color:C.text}}>{n.Name}</span>
                            <span style={{fontSize:'8px',padding:'2px 8px',borderRadius:'99px',background:'rgba(255,255,255,0.06)',color:C.muted}}>{n.Category}</span>
                          </div>
                          <p style={{fontSize:'11px',color:C.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',margin:0}}>{n.Note_Detail}</p>
                        </div>
                      ))}
                    </Card>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}