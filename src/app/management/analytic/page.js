"use client";
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

// ── Color palette ───────────────────────────────────────────────────────────
const C = {
  bg:     '#07080f',
  surf:   '#0d0f1a',
  surf2:  '#121525',
  border: 'rgba(255,255,255,0.07)',
  gold:   '#fbbf24',
  blue:   '#60a5fa',
  green:  '#34d399',
  pink:   '#f472b6',
  amber:  '#fb923c',
  purple: '#a78bfa',
  cyan:   '#22d3ee',
  red:    '#f87171',
  muted:  'rgba(255,255,255,0.3)',
  text:   'rgba(255,255,255,0.88)',
};

const scoreColor = v => v >= 80 ? C.green : v >= 60 ? C.blue : v >= 40 ? C.amber : C.red;

// ── Shared components ───────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'80px 0',flexDirection:'column',gap:'12px'}}>
    <div style={{width:'32px',height:'32px',border:`2px solid ${C.border}`,borderTop:`2px solid ${C.gold}`,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
    <span style={{fontSize:'9px',color:C.muted,letterSpacing:'0.2em',textTransform:'uppercase'}}>Loading analytics…</span>
  </div>
);

const Card = ({ children, style={}, accent }) => (
  <div style={{
    background: C.surf,
    border: `1px solid ${C.border}`,
    borderRadius: '18px',
    padding: '18px',
    position: 'relative',
    overflow: 'hidden',
    ...style
  }}>
    {accent && <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:`linear-gradient(90deg,${accent}cc,${accent}22)`}}/>}
    {children}
  </div>
);

const CardLabel = ({ children }) => (
  <p style={{fontSize:'8px',color:C.muted,textTransform:'uppercase',letterSpacing:'0.18em',fontWeight:900,margin:'0 0 14px'}}>{children}</p>
);

const KpiCard = ({ icon, label, value, color, sub }) => (
  <div style={{background:C.surf,border:`1px solid ${C.border}`,borderRadius:'14px',padding:'14px 12px',display:'flex',flexDirection:'column',gap:'5px',position:'relative',overflow:'hidden'}}>
    <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:`linear-gradient(90deg,${color}cc,${color}11)`}}/>
    <span style={{fontSize:'16px'}}>{icon}</span>
    <span style={{fontSize:'24px',fontWeight:900,color,lineHeight:1,fontVariantNumeric:'tabular-nums'}}>{value}</span>
    <span style={{fontSize:'8px',color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em'}}>{label}</span>
    {sub && <span style={{fontSize:'8px',color:'rgba(255,255,255,0.18)'}}>{sub}</span>}
  </div>
);

// Horizontal bar with label and count
const HBar = ({ label, count, max, color, showPct, total }) => {
  const pct = max > 0 ? Math.min(100, Math.round(count / max * 100)) : 0;
  const pctOfTotal = total > 0 ? Math.round(count / total * 100) : null;
  return (
    <div style={{marginBottom:'10px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'11px',marginBottom:'5px'}}>
        <span style={{color:C.text,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',paddingRight:'8px'}}>{label}</span>
        <span style={{fontWeight:900,color,flexShrink:0}}>
          {count}{pctOfTotal !== null && showPct ? <span style={{color:C.muted,fontWeight:400,fontSize:'9px',marginLeft:'4px'}}>{pctOfTotal}%</span> : ''}
        </span>
      </div>
      <div style={{height:'4px',background:'rgba(255,255,255,0.05)',borderRadius:'99px',overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:'99px',transition:'width 0.9s cubic-bezier(.4,0,.2,1)'}}/>
      </div>
    </div>
  );
};

// Compact ranked list
const RankList = ({ items, color, total, emptyMsg }) => {
  const [expanded, setExpanded] = useState(false);
  if (!items || items.length === 0) return <p style={{textAlign:'center',padding:'20px 0',color:C.muted,fontSize:'11px',fontStyle:'italic'}}>{emptyMsg||'No data'}</p>;
  const max = items[0].count;
  const visible = expanded ? items : items.slice(0, 6);
  return (
    <>
      {visible.map((item, i) => (
        <HBar key={i} label={item.label} count={item.count} max={max} color={
          i===0?color:i===1?color+'cc':i===2?color+'99':color+'55'
        } showPct total={total}/>
      ))}
      {items.length > 6 && (
        <button onClick={() => setExpanded(e=>!e)}
          style={{background:'none',border:`1px solid ${C.border}`,color:C.muted,borderRadius:'8px',padding:'5px 14px',fontSize:'9px',textTransform:'uppercase',letterSpacing:'0.12em',cursor:'pointer',width:'100%',marginTop:'4px'}}>
          {expanded ? '▲ Less' : `▼ +${items.length-6} more`}
        </button>
      )}
    </>
  );
};

// Dual-bar for grade×gender
const GradeGenderRow = ({ grade, male, female, total, maxTotal }) => {
  const malePct = total > 0 ? Math.round(male/total*100) : 50;
  return (
    <div style={{marginBottom:'12px'}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:'10px',marginBottom:'5px'}}>
        <span style={{color:C.text,fontWeight:700}}>{grade}</span>
        <span style={{color:C.muted,fontSize:'9px'}}>
          <span style={{color:C.blue}}>♂{male}</span>
          <span style={{color:'rgba(255,255,255,0.2)',margin:'0 4px'}}>·</span>
          <span style={{color:C.pink}}>♀{female}</span>
          <span style={{color:'rgba(255,255,255,0.2)',margin:'0 4px'}}>·</span>
          <span style={{color:C.text}}>{total}</span>
        </span>
      </div>
      <div style={{height:'6px',background:'rgba(255,255,255,0.05)',borderRadius:'99px',overflow:'hidden',display:'flex'}}>
        <div style={{height:'100%',width:`${malePct}%`,background:C.blue,transition:'width 0.8s ease'}}/>
        <div style={{height:'100%',flex:1,background:C.pink+'99'}}/>
      </div>
    </div>
  );
};

// ── Main ────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const router = useRouter();
  const [tab, setTab]         = useState('students');
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
      const res = await fetch(WEB_APP_URL, { method:'POST', body:JSON.stringify({ action:'getAnalytics' }) });
      const r   = await res.json();
      if (r.success) { setData(r); setUpdated(new Date().toLocaleTimeString()); }
    } catch {}
    setLoading(false);
  };

  const TABS = [
    { id:'overview',  icon:'📊', label:'Overview'   },
    { id:'students',  icon:'🎓', label:'Students'   },
    { id:'demog',     icon:'🧬', label:'Demographics'},
    { id:'academic',  icon:'📝', label:'Academic'   },
    { id:'finance',   icon:'💰', label:'Finance'    },
    { id:'ops',       icon:'⚙️', label:'Ops'        },
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden',background:C.bg,color:C.text,fontFamily:'system-ui,sans-serif'}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:99px}
      `}</style>

      {/* Header */}
      <div style={{flexShrink:0,zIndex:40,background:'rgba(7,8,15,0.97)',backdropFilter:'blur(16px)',borderBottom:`1px solid ${C.border}`,padding:'11px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <button onClick={()=>router.back()} style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:'13px',padding:'4px 8px'}}>← Back</button>
        <div style={{textAlign:'center'}}>
          <p style={{fontWeight:900,fontSize:'12px',textTransform:'uppercase',letterSpacing:'0.12em',margin:0,color:C.text}}>Analytics</p>
          {updated && <p style={{fontSize:'8px',color:'rgba(255,255,255,0.15)',margin:0}}>↻ {updated}</p>}
        </div>
        <button onClick={fetchData} style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:'16px',padding:'4px 8px'}}>↻</button>
      </div>

      {/* Tabs */}
      <div style={{flexShrink:0,display:'flex',gap:'4px',padding:'8px 12px 6px',overflowX:'auto',background:C.bg,borderBottom:`1px solid ${C.border}`}}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={tab===t.id
              ? {background:C.gold,color:'#0a0e1a',border:'none',borderRadius:'10px',padding:'6px 12px',fontSize:'9px',fontWeight:900,cursor:'pointer',whiteSpace:'nowrap',letterSpacing:'0.05em',textTransform:'uppercase'}
              : {background:C.surf,color:C.muted,border:`1px solid ${C.border}`,borderRadius:'10px',padding:'6px 12px',fontSize:'9px',fontWeight:900,cursor:'pointer',whiteSpace:'nowrap',letterSpacing:'0.05em',textTransform:'uppercase'}
            }>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Body */}
      <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',paddingBottom:'80px'}}>
        <div style={{padding:'12px 14px',animation:'fadeUp 0.25s ease'}}>
          {loading ? <Spinner/> : !data ? (
            <div style={{textAlign:'center',padding:'80px 0',color:C.muted}}>Data မရရှိပါ — ↻ ကနေ ပြန်ကြိုးစားပါ</div>
          ) : (
            <>
              {/* ══════════ OVERVIEW ══════════════════════════════════════════ */}
              {tab === 'overview' && (() => {
                const d = data;
                const s = d.students;
                const collectionRate = (d.fees.paid+d.fees.pending) > 0
                  ? Math.round(d.fees.paid/(d.fees.paid+d.fees.pending)*100) : 0;
                return (
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    {/* KPI grid */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                      <KpiCard icon="🎓" label="Total Students"  value={s.total}                        color={C.blue}   sub={`${s.male}M · ${s.female}F`}/>
                      <KpiCard icon="👔" label="Staff"           value={d.staff.total}                  color={C.purple} sub={`${d.staff.active} active`}/>
                      <KpiCard icon="💰" label="Revenue (ks)"    value={(d.fees.revenue||0).toLocaleString()} color={C.green}  sub={`${collectionRate}% collected`}/>
                      <KpiCard icon="⏳" label="Pending Leaves"  value={d.leaves.pending}               color={d.leaves.pending>0?C.amber:C.green} sub={`${d.leaves.approved} approved`}/>
                    </div>

                    {/* Student breakdown strip */}
                    <Card accent={C.blue}>
                      <CardLabel>Student Composition</CardLabel>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px',textAlign:'center',marginBottom:'16px'}}>
                        {[
                          {label:'Male',    value:s.male,   color:C.blue,   icon:'♂'},
                          {label:'Female',  value:s.female, color:C.pink,   icon:'♀'},
                          {label:'Hostel',  value:s.hostel, color:C.purple, icon:'🏠'},
                          {label:'Day',     value:s.school, color:C.cyan,   icon:'🏫'},
                        ].map((x,i) => (
                          <div key={i} style={{background:C.surf2,borderRadius:'10px',padding:'10px 6px',border:`1px solid ${x.color}22`}}>
                            <div style={{fontSize:'12px',color:x.color,marginBottom:'2px'}}>{x.icon}</div>
                            <div style={{fontSize:'18px',fontWeight:900,color:x.color,lineHeight:1}}>{x.value}</div>
                            <div style={{fontSize:'7px',color:C.muted,textTransform:'uppercase',marginTop:'3px',letterSpacing:'0.08em'}}>{x.label}</div>
                          </div>
                        ))}
                      </div>
                      {/* Grade mini chart */}
                      {s.gradeBreakdown?.length > 0 && (() => {
                        const maxG = Math.max(...s.gradeBreakdown.map(x=>x.count));
                        return (
                          <div>
                            <div style={{fontSize:'8px',color:C.muted,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:'8px'}}>Grade Distribution</div>
                            <div style={{display:'flex',alignItems:'flex-end',gap:'3px',height:'44px'}}>
                              {s.gradeBreakdown.map((g,i) => (
                                <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',flex:1,gap:'2px'}}>
                                  <div style={{fontSize:'7px',color:C.gold,fontWeight:900,lineHeight:1}}>{g.count}</div>
                                  <div style={{width:'100%',background:`${C.blue}aa`,borderRadius:'3px 3px 0 0',minHeight:'3px',height:`${Math.max(Math.round(g.count/maxG*36),3)}px`}}/>
                                  <div style={{fontSize:'6px',color:C.muted,transform:'rotate(-30deg)',whiteSpace:'nowrap',lineHeight:1}}>{g.grade.replace('Grade ','G')}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </Card>

                    {/* Academic + Finance snapshot side by side */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                      <Card accent={scoreColor(d.scores.avg)}>
                        <CardLabel>Academic</CardLabel>
                        <div style={{fontSize:'28px',fontWeight:900,color:scoreColor(d.scores.avg),lineHeight:1}}>{d.scores.avg}%</div>
                        <div style={{fontSize:'8px',color:C.muted,marginTop:'3px',marginBottom:'10px'}}>Class Average</div>
                        <div style={{display:'flex',gap:'8px'}}>
                          <div style={{flex:1,textAlign:'center',background:C.surf2,borderRadius:'8px',padding:'8px 4px'}}>
                            <div style={{fontSize:'16px',fontWeight:900,color:C.green}}>{d.scores.distinctions}</div>
                            <div style={{fontSize:'7px',color:C.muted,textTransform:'uppercase',marginTop:'2px'}}>Distinctions</div>
                          </div>
                          <div style={{flex:1,textAlign:'center',background:C.surf2,borderRadius:'8px',padding:'8px 4px'}}>
                            <div style={{fontSize:'16px',fontWeight:900,color:d.scores.fails>0?C.red:C.green}}>{d.scores.fails}</div>
                            <div style={{fontSize:'7px',color:C.muted,textTransform:'uppercase',marginTop:'2px'}}>Fails</div>
                          </div>
                        </div>
                      </Card>
                      <Card accent={C.green}>
                        <CardLabel>Finance</CardLabel>
                        <div style={{fontSize:'18px',fontWeight:900,color:C.green,lineHeight:1}}>{(d.fees.revenue||0).toLocaleString()}</div>
                        <div style={{fontSize:'8px',color:C.muted,marginTop:'3px',marginBottom:'10px'}}>Revenue (Ks)</div>
                        <div style={{display:'flex',gap:'8px'}}>
                          <div style={{flex:1,textAlign:'center',background:C.surf2,borderRadius:'8px',padding:'8px 4px'}}>
                            <div style={{fontSize:'16px',fontWeight:900,color:C.green}}>{d.fees.paid}</div>
                            <div style={{fontSize:'7px',color:C.muted,textTransform:'uppercase',marginTop:'2px'}}>Paid</div>
                          </div>
                          <div style={{flex:1,textAlign:'center',background:C.surf2,borderRadius:'8px',padding:'8px 4px'}}>
                            <div style={{fontSize:'16px',fontWeight:900,color:d.fees.pending>0?C.amber:C.green}}>{d.fees.pending}</div>
                            <div style={{fontSize:'7px',color:C.muted,textTransform:'uppercase',marginTop:'2px'}}>Pending</div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                );
              })()}

              {/* ══════════ STUDENTS ══════════════════════════════════════════ */}
              {tab === 'students' && (() => {
                const s = data.students;
                const total = s.total;
                return (
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    {/* Top KPIs */}
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
                      <KpiCard icon="👥" label="Total"  value={total}    color={C.blue}/>
                      <KpiCard icon="♂"  label="Male"   value={s.male}   color={C.cyan}/>
                      <KpiCard icon="♀"  label="Female" value={s.female} color={C.pink}/>
                    </div>

                    {/* Gender visual */}
                    <Card accent={C.blue}>
                      <CardLabel>Gender Ratio</CardLabel>
                      <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
                        <svg width="76" height="76" viewBox="0 0 36 36" style={{flexShrink:0,transform:'rotate(-90deg)'}}>
                          <circle cx="18" cy="18" r="14" fill="none" stroke={C.pink+'66'} strokeWidth="5"/>
                          <circle cx="18" cy="18" r="14" fill="none" stroke={C.blue} strokeWidth="5"
                            strokeDasharray={`${total?s.male/total*88:44} 88`}/>
                        </svg>
                        <div style={{flex:1}}>
                          <HBar label="♂ Male"   count={s.male}   max={total} color={C.blue} showPct total={total}/>
                          <HBar label="♀ Female" count={s.female} max={total} color={C.pink} showPct total={total}/>
                        </div>
                      </div>
                    </Card>

                    {/* Boarding */}
                    <Card accent={C.cyan}>
                      <CardLabel>Boarding Status</CardLabel>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'12px'}}>
                        {[
                          {icon:'🏫',label:'Day School',value:s.school,color:C.cyan},
                          {icon:'🏠',label:'Hostel',    value:s.hostel,color:C.purple},
                        ].map((x,i) => (
                          <div key={i} style={{background:C.surf2,borderRadius:'12px',padding:'14px',textAlign:'center',border:`1px solid ${x.color}22`}}>
                            <div style={{fontSize:'20px',marginBottom:'3px'}}>{x.icon}</div>
                            <div style={{fontSize:'22px',fontWeight:900,color:x.color}}>{x.value}</div>
                            <div style={{fontSize:'7px',color:C.muted,textTransform:'uppercase',marginTop:'2px',letterSpacing:'0.08em'}}>{x.label}</div>
                            <div style={{fontSize:'10px',color:x.color,marginTop:'4px',fontWeight:700}}>
                              {total?Math.round(x.value/total*100):0}%
                            </div>
                          </div>
                        ))}
                      </div>
                      <HBar label="Day School" count={s.school} max={total} color={C.cyan} showPct total={total}/>
                      <HBar label="Hostel"     count={s.hostel} max={total} color={C.purple} showPct total={total}/>
                    </Card>

                    {/* House distribution */}
                    {Object.keys(s.houseCounts||{}).length > 0 && (
                      <Card accent={C.gold}>
                        <CardLabel>House Distribution</CardLabel>
                        {Object.entries(s.houseCounts).sort((a,b)=>b[1]-a[1]).map(([h,c],i) => (
                          <HBar key={i} label={h} count={c} max={Math.max(...Object.values(s.houseCounts))} color={C.gold} showPct total={total}/>
                        ))}
                      </Card>
                    )}

                    {/* Grade × Gender */}
                    {s.gradeGenderBreakdown?.length > 0 && (
                      <Card accent={C.blue}>
                        <CardLabel>Grade × Gender Breakdown</CardLabel>
                        <div style={{display:'flex',gap:'12px',marginBottom:'10px',fontSize:'9px',color:C.muted}}>
                          <span><span style={{color:C.blue}}>■</span> Male</span>
                          <span><span style={{color:C.pink}}>■</span> Female</span>
                        </div>
                        {s.gradeGenderBreakdown.map((row,i) => (
                          <GradeGenderRow key={i} {...row}
                            maxTotal={Math.max(...s.gradeGenderBreakdown.map(r=>r.total))}/>
                        ))}
                      </Card>
                    )}

                    {/* Grade count bars */}
                    <Card>
                      <CardLabel>Grade Distribution</CardLabel>
                      {(s.gradeBreakdown||[]).map((g,i) => (
                        <HBar key={i} label={g.grade} count={g.count}
                          max={Math.max(...(s.gradeBreakdown||[{count:1}]).map(x=>x.count))}
                          color={C.blue} showPct total={total}/>
                      ))}
                    </Card>
                  </div>
                );
              })()}

              {/* ══════════ DEMOGRAPHICS ══════════════════════════════════════ */}
              {tab === 'demog' && (() => {
                const dm = data.demographics || {};
                const total = data.students.total;
                const keys  = data.studentSampleKeys || [];
                const gasDeployed = !!data.demographics; // if undefined → old GAS still running

                const DemogSection = ({ title, items, color, icon }) => (
                  <Card accent={color}>
                    <CardLabel>{icon} {title}</CardLabel>
                    <RankList items={items} color={color} total={total} emptyMsg={`${title} — column မတွေ့ပါ`}/>
                  </Card>
                );

                return (
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>

                    {/* ── GAS not deployed warning ── */}
                    {!gasDeployed && (
                      <div style={{background:'rgba(248,113,113,0.1)',border:'1px solid rgba(248,113,113,0.3)',borderRadius:'14px',padding:'16px',textAlign:'center'}}>
                        <div style={{fontSize:'24px',marginBottom:'8px'}}>⚠️</div>
                        <p style={{color:'#f87171',fontWeight:900,fontSize:'12px',textTransform:'uppercase',letterSpacing:'0.1em'}}>Code.gs Deploy မလုပ်ရသေးပါ</p>
                        <p style={{color:C.muted,fontSize:'10px',marginTop:'6px'}}>GAS backend ကို redeploy လုပ်ပြီးမှ refresh ထပ်ခေါ်ပါ</p>
                      </div>
                    )}

                    {/* ── Column Keys Debug Panel ── */}
                    {keys.length > 0 && (
                      <details style={{background:C.surf2,border:`1px solid ${C.border}`,borderRadius:'12px',padding:'12px'}}>
                        <summary style={{fontSize:'9px',color:C.muted,textTransform:'uppercase',letterSpacing:'0.12em',cursor:'pointer',fontWeight:900}}>
                          🔍 Student_Directory Columns ({keys.length} fields) — click to inspect
                        </summary>
                        <div style={{marginTop:'10px',display:'flex',flexWrap:'wrap',gap:'4px'}}>
                          {keys.map((k,i) => (
                            <span key={i} style={{fontSize:'9px',background:'rgba(255,255,255,0.07)',color:C.text,padding:'3px 8px',borderRadius:'6px',fontFamily:'monospace'}}>
                              {k}
                            </span>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Age Range */}
                    {dm.ageTotal > 0 && (
                      <Card accent={C.cyan}>
                        <CardLabel>📅 Age Range Distribution ({dm.ageTotal} students)</CardLabel>
                        {(dm.ageRanges||[]).map((r,i) => (
                          <HBar key={i} label={`${r.range} years`} count={r.count}
                            max={Math.max(...dm.ageRanges.map(x=>x.count),1)}
                            color={[C.blue,C.cyan,C.green,C.amber,C.purple][i%5]}
                            showPct total={dm.ageTotal}/>
                        ))}
                        {dm.ageTotal < total && (
                          <p style={{fontSize:'8px',color:C.muted,marginTop:'8px',fontStyle:'italic'}}>
                            * {total - dm.ageTotal} students have no DOB recorded
                          </p>
                        )}
                      </Card>
                    )}

                    {/* Race / Nationality */}
                    {gasDeployed && <DemogSection title="Race / Nationality" items={dm.races}             color={C.purple} icon="🧬"/>}

                    {/* Religion */}
                    {gasDeployed && <DemogSection title="Religion"           items={dm.religions}         color={C.gold}   icon="🛐"/>}

                    {/* Town */}
                    {gasDeployed && <DemogSection title="Hometown (Town)"    items={dm.towns}             color={C.cyan}   icon="🏙️"/>}

                    {/* Father's Occupation */}
                    {gasDeployed && <DemogSection title="Father's Occupation" items={dm.fatherOccupations} color={C.blue}  icon="👨‍💼"/>}

                    {/* Mother's Occupation */}
                    {gasDeployed && <DemogSection title="Mother's Occupation" items={dm.motherOccupations} color={C.pink}  icon="👩‍💼"/>}

                    {/* Transferred from */}
                    {gasDeployed && dm.transferredFrom?.length > 0 && (
                      <DemogSection title="Previous School (Transferred from)" items={dm.transferredFrom} color={C.amber} icon="🏫"/>
                    )}

                    {/* Ward */}
                    {gasDeployed && dm.wards?.length > 0 && (
                      <DemogSection title="Ward / Quarter" items={dm.wards} color={C.green} icon="📍"/>
                    )}
                  </div>
                );
              })()}

              {/* ══════════ ACADEMIC ══════════════════════════════════════════ */}
              {tab === 'academic' && (() => {
                const sc = data.scores;
                return (
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                      <KpiCard icon="📊" label="Avg Score"     value={sc.avg+'%'}       color={scoreColor(sc.avg)}/>
                      <KpiCard icon="📋" label="Total Records" value={sc.total}          color={C.blue}/>
                      <KpiCard icon="⭐" label="Distinctions"  value={sc.distinctions}   color={C.green}/>
                      <KpiCard icon="❌" label="Fails"         value={sc.fails}          color={sc.fails>0?C.red:C.green}/>
                    </div>

                    {sc.total > 0 && (
                      <>
                        {/* Score band */}
                        <Card accent={scoreColor(sc.avg)}>
                          <CardLabel>Score Performance Band</CardLabel>
                          <div style={{background:`${scoreColor(sc.avg)}18`,border:`1px solid ${scoreColor(sc.avg)}33`,borderRadius:'12px',padding:'14px',display:'flex',alignItems:'center',gap:'14px',marginBottom:'12px'}}>
                            <div style={{fontSize:'36px',fontWeight:900,color:scoreColor(sc.avg)}}>{sc.avg}%</div>
                            <div>
                              <div style={{fontSize:'11px',color:C.text,fontWeight:700}}>School Average</div>
                              <div style={{fontSize:'9px',color:C.muted,marginTop:'2px'}}>
                                {sc.avg>=80?'Excellent 🎉':sc.avg>=60?'Good 👍':sc.avg>=40?'Needs improvement ⚠️':'Critical — intervention required 🚨'}
                              </div>
                            </div>
                          </div>
                        </Card>

                        {/* Subject averages */}
                        {sc.subjectAvg?.length > 0 && (
                          <Card>
                            <CardLabel>Subject Average Scores</CardLabel>
                            {sc.subjectAvg.map((s,i) => (
                              <HBar key={i} label={s.subject} count={s.avg}
                                max={100} color={scoreColor(s.avg)}/>
                            ))}
                          </Card>
                        )}
                      </>
                    )}

                    {sc.total === 0 && (
                      <div style={{textAlign:'center',padding:'60px 0',color:C.muted}}>Score records မရှိသေးပါ</div>
                    )}
                  </div>
                );
              })()}

              {/* ══════════ FINANCE ══════════════════════════════════════════ */}
              {tab === 'finance' && (() => {
                const f = data.fees;
                const total = f.paid + f.pending;
                const rate  = total > 0 ? Math.round(f.paid/total*100) : 0;
                return (
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                      <KpiCard icon="💰" label="Revenue (ks)"    value={(f.revenue||0).toLocaleString()} color={C.green}/>
                      <KpiCard icon="📊" label="Collection Rate" value={rate+'%'}                        color={rate>=80?C.green:rate>=60?C.amber:C.red}/>
                      <KpiCard icon="✅" label="Paid"            value={f.paid}                          color={C.green}/>
                      <KpiCard icon="⏳" label="Pending"         value={f.pending}                       color={f.pending>0?C.amber:C.green}/>
                    </div>

                    {total > 0 && (
                      <Card accent={C.green}>
                        <CardLabel>Payment Status</CardLabel>
                        <div style={{display:'flex',gap:'20px',alignItems:'center'}}>
                          <svg width="90" height="90" viewBox="0 0 36 36" style={{flexShrink:0,transform:'rotate(-90deg)'}}>
                            <circle cx="18" cy="18" r="14" fill="none" stroke={C.amber+'44'} strokeWidth="5"/>
                            <circle cx="18" cy="18" r="14" fill="none" stroke={C.green} strokeWidth="5"
                              strokeDasharray={`${(f.paid/total)*88} 88`}/>
                            <text x="18" y="20" textAnchor="middle" fill={C.green} fontSize="6.5" fontWeight="900"
                              transform="rotate(90,18,18)">{rate}%</text>
                          </svg>
                          <div style={{flex:1}}>
                            <HBar label="✅ Paid"    count={f.paid}    max={total} color={C.green} showPct total={total}/>
                            <HBar label="⏳ Pending" count={f.pending} max={total} color={C.amber} showPct total={total}/>
                          </div>
                        </div>
                      </Card>
                    )}
                    {total === 0 && <div style={{textAlign:'center',padding:'60px 0',color:C.muted}}>Fee records မရှိသေးပါ</div>}
                  </div>
                );
              })()}

              {/* ══════════ OPS ══════════════════════════════════════════════ */}
              {tab === 'ops' && (() => {
                const lv = data.leaves;
                const st = data.staff;
                return (
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                      <KpiCard icon="👔" label="Total Staff"  value={st.total}  color={C.purple}/>
                      <KpiCard icon="✅" label="Active Staff" value={st.active} color={C.green} sub={`${st.total-st.active} inactive`}/>
                    </div>

                    {/* Staff by Subject */}
                    {st.bySubject?.length > 0 && (
                      <Card accent={C.purple}>
                        <CardLabel>👨‍🏫 Teaching Subject Breakdown</CardLabel>
                        <RankList items={st.bySubject} color={C.purple} total={st.total}/>
                      </Card>
                    )}

                    {/* Staff by Position */}
                    {st.byPosition?.length > 0 && (
                      <Card accent={C.cyan}>
                        <CardLabel>🏷️ Position / Role Breakdown</CardLabel>
                        <RankList items={st.byPosition} color={C.cyan} total={st.total}/>
                      </Card>
                    )}

                    {/* Staff column inspector */}
                    {st.sampleKeys?.length > 0 && (
                      <details style={{background:C.surf2,border:`1px solid ${C.border}`,borderRadius:'12px',padding:'12px'}}>
                        <summary style={{fontSize:'9px',color:C.muted,textTransform:'uppercase',letterSpacing:'0.12em',cursor:'pointer',fontWeight:900}}>
                          🔍 Staff_Directory Columns ({st.sampleKeys.length} fields)
                        </summary>
                        <div style={{marginTop:'10px',display:'flex',flexWrap:'wrap',gap:'4px'}}>
                          {st.sampleKeys.map((k,i) => (
                            <span key={i} style={{fontSize:'9px',background:'rgba(255,255,255,0.07)',color:C.text,padding:'3px 8px',borderRadius:'6px',fontFamily:'monospace'}}>{k}</span>
                          ))}
                        </div>
                      </details>
                    )}

                    <Card accent={C.amber}>
                      <CardLabel>Leave Management</CardLabel>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'14px'}}>
                        {[
                          {label:'Pending', value:lv.pending,  color:C.amber, bg:`${C.amber}15`},
                          {label:'Approved',value:lv.approved, color:C.green, bg:`${C.green}15`},
                          {label:'Rejected',value:lv.rejected, color:C.red,   bg:`${C.red}15`},
                        ].map((x,i) => (
                          <div key={i} style={{background:x.bg,border:`1px solid ${x.color}33`,borderRadius:'10px',padding:'12px',textAlign:'center'}}>
                            <div style={{fontSize:'22px',fontWeight:900,color:x.color}}>{x.value}</div>
                            <div style={{fontSize:'7px',color:C.muted,textTransform:'uppercase',letterSpacing:'0.08em',marginTop:'3px'}}>{x.label}</div>
                          </div>
                        ))}
                      </div>
                      {lv.recent?.length > 0 && (
                        <>
                          <div style={{fontSize:'8px',color:C.muted,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:'8px'}}>Recent Requests</div>
                          {lv.recent.map((l,i) => (
                            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<lv.recent.length-1?`1px solid ${C.border}`:'none'}}>
                              <div>
                                <div style={{fontSize:'11px',color:C.text,fontWeight:700}}>{l.Name}</div>
                                <div style={{fontSize:'8px',color:C.muted,marginTop:'1px'}}>{l.Leave_Type}</div>
                              </div>
                              <span style={{fontSize:'8px',fontWeight:900,padding:'3px 10px',borderRadius:'99px',
                                background:l.Status==='Approved'?`${C.green}20`:l.Status==='Rejected'?`${C.red}20`:`${C.amber}20`,
                                color:l.Status==='Approved'?C.green:l.Status==='Rejected'?C.red:C.amber}}>
                                {l.Status}
                              </span>
                            </div>
                          ))}
                        </>
                      )}
                    </Card>

                    {data.recentNotes?.length > 0 && (
                      <Card>
                        <CardLabel>Recent Student Notes</CardLabel>
                        {data.recentNotes.map((n,i) => (
                          <div key={i} style={{padding:'8px 0',borderBottom:i<data.recentNotes.length-1?`1px solid ${C.border}`:'none'}}>
                            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'2px'}}>
                              <span style={{fontSize:'11px',fontWeight:700,color:C.text}}>{n.Name}</span>
                              <span style={{fontSize:'7px',padding:'2px 8px',borderRadius:'99px',background:'rgba(255,255,255,0.06)',color:C.muted}}>{n.Category}</span>
                            </div>
                            <p style={{fontSize:'10px',color:C.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',margin:0}}>{n.Note_Detail}</p>
                          </div>
                        ))}
                      </Card>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}